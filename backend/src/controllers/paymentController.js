// backend/src/controllers/paymentController.js
'use strict';

const prisma = require('../config/db');
const sendSMS = require('../config/smsService');
const chapaService = require('../services/chapaService');
const { calculatePenaltyTier } = require('../utils/penaltyCalculator');
const { createNotification } = require('./notificationController');
const { getIO } = require('../socket');

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS — Sequential Round Enforcement
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reads the admin-configured service fee percentage from SystemSetting.
 * Falls back to 2% if the row is missing or unreadable.
 */
async function getServiceFeePct() {
    try {
        const setting = await prisma.systemSetting.findUnique({
            where: { key: 'service_fee_pct' },
        });
        const pct = parseFloat(setting?.value ?? '2');
        return isNaN(pct) ? 2 : pct;
    } catch {
        return 2; // safe default — never break payment flow
    }
}

/**
 * Finds the EARLIEST unpaid round for a membership.
 * Scans rounds 1 … currentRound and returns the first without an APPROVED payment.
 * Returns currentRound when all prior rounds are settled.
 */
async function resolveTargetRound(membershipId, currentRound, cycleNumber) {
    if (currentRound <= 1) return currentRound;

    const approvedPayments = await prisma.groupPayment.findMany({
        where: {
            membershipId,
            cycleNumber,
            status: 'APPROVED',
            roundNumber: { gte: 1, lte: currentRound },
        },
        select: { roundNumber: true },
    });

    const paidRounds = new Set(approvedPayments.map(p => p.roundNumber));
    for (let r = 1; r <= currentRound; r++) {
        if (!paidRounds.has(r)) return r;
    }
    return currentRound;
}

/** Returns the maximum (Tier 3) penalty for a plan — used for overdue rounds. */
function getMaxPenalty(plan) {
    const t3 = Number(plan.tier3Penalty ?? 0);
    if (t3 > 0) return t3;
    const flat = Number(plan.penalty ?? 0);
    if (flat > 0) return Math.round(flat * 2.5);
    const amt = Number(plan.amount ?? 0);
    if (amt > 0) return Math.round(amt * 0.20);
    return 50;
}

// ─────────────────────────────────────────────────────────────────────────────
// CHAPA PAYMENT FLOWS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/payments/requirements/:membershipId
 *
 * Returns the payment action the member must take next:
 *   targetRound, isOverdue, baseAmount, penaltyAmount, totalAmount
 *
 * Used by the frontend to render the correct Pay button label and arrears warning.
 */
const getPaymentRequirements = async (req, res) => {
    const { membershipId } = req.params;
    if (!membershipId) return res.status(400).json({ error: 'membershipId required.' });

    try {
        const membership = await prisma.equbMembership.findUnique({
            where: { id: membershipId },
            include: { group: { include: { plan: true } } },
        });

        if (!membership) return res.status(404).json({ error: 'Membership not found.' });
        if (membership.status !== 'APPROVED') {
            return res.json({ targetRound: null, isOverdue: false, baseAmount: 0, penaltyAmount: 0, totalAmount: 0 });
        }

        const { currentRound, cycleNumber, plan } = membership.group;
        const baseAmount = parseFloat(plan.amount);
        const targetRound = await resolveTargetRound(membershipId, currentRound, cycleNumber);
        const isOverdue = targetRound < currentRound;

        let penaltyAmount;
        if (isOverdue) {
            penaltyAmount = getMaxPenalty(plan);
        } else {
            const info = calculatePenaltyTier(membership.group, plan);
            penaltyAmount = info.isDefaulted ? 0 : info.penaltyAmount;
        }

        const totalAmount = parseFloat((baseAmount + penaltyAmount).toFixed(2));

        return res.json({
            targetRound, currentRound, cycleNumber,
            isOverdue, baseAmount, penaltyAmount, totalAmount,
            groupName: membership.group.name,
        });
    } catch (err) {
        console.error('[Payment] getPaymentRequirements error:', err.message);
        return res.status(500).json({ error: 'Failed to fetch payment requirements.' });
    }
};

/**
 * POST /api/payments/chapa/initialize
 *
 * Initiates a Chapa-hosted checkout for an Equb contribution.
 * Now enforces sequential payment order — the member MUST pay the
 * earliest unpaid round before proceeding to later rounds.
 *
 * Body: { membershipId, groupId }
 */
const initiateChapaPayment = async (req, res) => {
    const { membershipId, groupId } = req.body;

    if (!membershipId || !groupId) {
        return res.status(400).json({ error: 'membershipId and groupId are required.' });
    }

    try {
        // ── 1. Fetch membership ────────────────────────────────────────────
        const membership = await prisma.equbMembership.findUnique({
            where: { id: membershipId },
            include: {
                group: { include: { plan: true } },
                user: {
                    select: {
                        id: true, fullName: true, firstName: true,
                        fatherName: true, phoneNumber: true, email: true,
                    },
                },
            },
        });

        if (!membership) return res.status(404).json({ error: 'Membership not found.' });
        if (membership.status !== 'APPROVED') {
            return res.status(403).json({
                error: 'Your membership has not been approved yet. Please wait for the organizer.',
            });
        }
        if (membership.groupId !== groupId) return res.status(400).json({ error: 'Group/membership mismatch.' });

        const { currentRound, cycleNumber, plan } = membership.group;
        const user = membership.user;
        const baseAmount = parseFloat(plan.amount);

        // ── 2. Resolve earliest unpaid round ──────────────────────────────
        const targetRound = await resolveTargetRound(membershipId, currentRound, cycleNumber);
        const isOverdue = targetRound < currentRound;

        console.log(
            `[Payment] Init | user=${user.fullName} | group=${membership.group.name} ` +
            `| currentRound=${currentRound} | targetRound=${targetRound} ` +
            `| overdue=${isOverdue} | cycle=${cycleNumber}`
        );

        // ── 3. Duplicate-payment guard for targetRound ────────────────────
        const existingPayment = await prisma.groupPayment.findFirst({
            where: {
                membershipId,
                roundNumber: targetRound,
                cycleNumber,
                status: { not: 'REJECTED' },
            },
        });

        if (existingPayment) {
            if (existingPayment.status === 'APPROVED') {
                return res.status(409).json({
                    error: `You have already made a verified payment for Round ${targetRound} (Cycle ${cycleNumber}).`,
                });
            }
            if (existingPayment.status === 'PENDING' && existingPayment.transactionId) {
                return res.json({
                    checkoutUrl: `https://checkout.chapa.co/checkout/payment/${existingPayment.transactionId}`,
                    tx_ref: existingPayment.transactionId,
                    message: 'A pending payment already exists. Redirecting to checkout.',
                    targetRound,
                    isOverdue,
                });
            }
        }

        // ── 4. Calculate penalty ───────────────────────────────────────────
        let penaltyAmount;
        let penaltyTierNum = 3;

        // If the client sent an explicit penaltyOverride (from the Demo Simulator),
        // use it directly and skip the live-tier / overdue calculation.
        const penaltyOverride = req.body.penaltyOverride;
        const hasOverride = typeof penaltyOverride === 'number' && penaltyOverride >= 0;

        if (hasOverride) {
            penaltyAmount = parseFloat(penaltyOverride.toFixed(2));
            // Infer tier from override amount for audit purposes (best-effort)
            const t1 = Number(membership.group.plan.tier1Penalty ?? 0);
            const t2 = Number(membership.group.plan.tier2Penalty ?? 0);
            const t3 = Number(membership.group.plan.tier3Penalty ?? 0);
            if (penaltyAmount === 0) penaltyTierNum = 0;
            else if (t1 > 0 && penaltyAmount <= t1) penaltyTierNum = 1;
            else if (t2 > 0 && penaltyAmount <= t2) penaltyTierNum = 2;
            else penaltyTierNum = 3;
            console.log(`[Payment] penaltyOverride=${penaltyAmount} ETB → tier=${penaltyTierNum}`);
        } else if (isOverdue) {
            // Overdue → always enforce Tier 3 (maximum) penalty
            penaltyAmount = getMaxPenalty(plan);
            penaltyTierNum = 3;
            console.log(`[Payment] OVERDUE round ${targetRound} → Tier 3 penalty: ${penaltyAmount} ETB`);
        } else {
            const penaltyInfo = calculatePenaltyTier(membership.group, plan);

            if (penaltyInfo.isDefaulted) {
                return res.status(403).json({
                    error:
                        'You have exceeded the maximum penalty window and have been excluded from this Equb. ' +
                        'Any previously paid rounds are locked and will only be refunded at the end of the ' +
                        'equb cycle minus incurred penalties.',
                    penaltyInfo,
                    code: 'PAYMENT_DEFAULTED',
                });
            }

            penaltyAmount = penaltyInfo.penaltyAmount;
            penaltyTierNum = typeof penaltyInfo.tier === 'number' ? penaltyInfo.tier : 0;
            console.log(
                `[Payment] Live tier=${penaltyInfo.tier} | penalty=${penaltyAmount} ETB | ` +
                `window="${penaltyInfo.window}"`
            );
        }

        const totalAmount = parseFloat((baseAmount + penaltyAmount).toFixed(2));
        console.log(`[Payment] Total | base=${baseAmount} + penalty=${penaltyAmount} = ${totalAmount} ETB`);

        // ── 5. Generate tx_ref — encode targetRound ───────────────────────
        const tx_ref = `EQB-${groupId.slice(0, 4).toUpperCase()}-R${targetRound}-${Date.now()}`;

        // ── 6. Upsert PENDING payment for targetRound ─────────────────────
        const payment = await prisma.groupPayment.upsert({
            where: {
                membershipId_cycleNumber_roundNumber: { membershipId, cycleNumber, roundNumber: targetRound },
            },
            update: {
                transactionId: tx_ref,
                status: 'PENDING',
                amount: totalAmount,
                penaltyAmount,
                penaltyTier: penaltyTierNum,
            },
            create: {
                membershipId,
                groupId,
                roundNumber: targetRound,
                cycleNumber,
                amount: totalAmount,
                penaltyAmount,
                penaltyTier: penaltyTierNum,
                transactionId: tx_ref,
                status: 'PENDING',
            },
        });

        console.log(`[Payment] DB upserted | id=${payment.id} | tx_ref=${tx_ref} | round=${targetRound}`);

        // ── 7. Call Chapa API ──────────────────────────────────────────────
        const returnUrl = `${process.env.FRONTEND_URL}/payment-callback?tx_ref=${tx_ref}`;
        const payerEmail = user.email || `equb.${user.phoneNumber}@cems.et`;

        const { checkoutUrl } = await chapaService.initializePayment({
            amount: totalAmount,
            currency: 'ETB',
            email: payerEmail,
            firstName: user.firstName || user.fullName.split(' ')[0],
            lastName: user.fatherName || user.fullName.split(' ').slice(1).join(' ') || 'Member',
            tx_ref,
            return_url: returnUrl,
            callback_url: process.env.CHAPA_WEBHOOK_URL || undefined,
        });

        console.log(`[Payment] Chapa checkout ready | tx_ref=${tx_ref} | url=${checkoutUrl}`);

        return res.status(201).json({
            message: 'Payment initialized. Redirect the user to the checkout URL.',
            checkoutUrl,
            tx_ref,
            targetRound,
            currentRound,
            isOverdue,
            baseAmount,
            penaltyAmount,
            totalAmount,
        });

    } catch (error) {
        const msg = error.response?.data?.message || error.message;
        console.error(`[Payment] initiateChapaPayment error: ${msg}`);
        return res.status(500).json({ error: 'Failed to initialize payment. Please try again.', detail: msg });
    }
};
/**
 * GET /api/payments/chapa/verify/:tx_ref
 *
 * Verifies a completed Chapa transaction and marks the DB record APPROVED.
 * Called from the frontend payment-callback page after Chapa redirects.
 *
 * Extended flow (post-draw late payment routing):
 *  1. Call Chapa verify API
 *  2. Mark GroupPayment APPROVED
 *  3. Check if a DrawResult already exists for this round/cycle
 *  4a. If draw ALREADY happened → post-draw routing:
 *       - Net base amount (after 2% platform fee) → winner supplemental payout notification
 *       - Penalty amount → organizer penalty credit notification
 *  4b. If draw NOT happened yet → normal confirmation flow
 *  5. Simulated SMS logs (no external API calls)
 *  6. Return clean JSON response
 */
const verifyChapaPayment = async (req, res) => {
    const tx_ref = req.params.tx_ref || req.query.tx_ref;

    if (!tx_ref) {
        return res.status(400).json({ error: 'tx_ref is required.' });
    }

    console.log(`[Payment] Verification request | tx_ref=${tx_ref}`);

    try {
        // ── 1. Call Chapa verify endpoint ──────────────────────────────────
        const chapaTransaction = await chapaService.verifyPayment(tx_ref);
        const chapaStatus = chapaTransaction.status?.toLowerCase();

        console.log(`[Payment] Chapa status for ${tx_ref}: ${chapaStatus}`);

        if (chapaStatus !== 'success') {
            await prisma.groupPayment.updateMany({
                where: { transactionId: tx_ref },
                data: {
                    status: chapaStatus === 'failed' ? 'REJECTED' : 'PENDING',
                    reviewedAt: new Date(),
                    note: `Chapa status: ${chapaStatus}`,
                },
            });
            return res.status(402).json({
                success: false,
                message: `Payment not completed. Chapa status: ${chapaStatus}`,
            });
        }

        // ── 2. Mark payment APPROVED ───────────────────────────────────────
        const updatedPayments = await prisma.groupPayment.updateMany({
            where: { transactionId: tx_ref, status: { not: 'APPROVED' } },
            data: {
                status: 'APPROVED',
                reviewedAt: new Date(),
                receiptImageUrl: null,
                note: `Verified via Chapa on ${new Date().toISOString()}`,
            },
        });

        // Idempotent — already approved
        if (updatedPayments.count === 0) {
            const existing = await prisma.groupPayment.findFirst({
                where: { transactionId: tx_ref },
                include: { membership: { include: { user: true } }, group: true },
            });
            return res.json({ success: true, message: 'Payment was already verified.', payment: existing });
        }

        // ── 3. Fetch full payment with all relations needed for routing ────
        const payment = await prisma.groupPayment.findFirst({
            where: { transactionId: tx_ref },
            include: {
                membership: { include: { user: true } },
                group: {
                    include: {
                        organizer: { select: { id: true, fullName: true, phoneNumber: true } },
                    },
                },
            },
        });

        const io = getIO();
        const memberUser = payment.membership.user;
        const organizer = payment.group.organizer;
        const groupName = payment.group.name;
        const roundNumber = payment.roundNumber;
        const cycleNumber = payment.cycleNumber;
        const totalPaid = Number(payment.amount);
        const penaltyAmount = Number(payment.penaltyAmount || 0);
        const baseAmount = parseFloat((totalPaid - penaltyAmount).toFixed(2));

        console.log(
            `[Payment] Approved | member=${memberUser.fullName} | group=${groupName} ` +
            `| round=${roundNumber} | base=${baseAmount} ETB | penalty=${penaltyAmount} ETB`
        );

        // ── 4. Check whether the draw for this round already happened ──────
        const existingDraw = await prisma.drawResult.findFirst({
            where: {
                groupId: payment.groupId,
                roundNumber: roundNumber,
                cycleNumber: cycleNumber,
            },
            include: {
                winner: { select: { id: true, fullName: true, phoneNumber: true } },
            },
        });

        if (existingDraw) {
            // ─────────────────────────────────────────────────────────────
            // POST-DRAW LATE PAYMENT — route funds to winner + organizer
            // ─────────────────────────────────────────────────────────────
            console.log(
                `[Payment] POST-DRAW late payment | draw already happened | ` +
                `winner=${existingDraw.winner.fullName}`
            );

            const feePct = await getServiceFeePct();
            const PLATFORM_FEE_RATIO = feePct / 100;
            const netWinnerAmount = parseFloat((baseAmount * (1 - PLATFORM_FEE_RATIO)).toFixed(2));
            const platformFee = parseFloat((baseAmount * PLATFORM_FEE_RATIO).toFixed(2));

            // 4a. In-app notification for the winner (supplemental payout)
            try {
                await createNotification({
                    userId: existingDraw.winnerId,
                    type: 'SUPPLEMENTAL_PAYOUT',
                    title: 'Supplemental Payout Received',
                    message: `You received ${netWinnerAmount.toLocaleString()} ETB from ` +
                        `${memberUser.fullName} for Round ${roundNumber} ` +
                        `(${groupName}) via Telebirr/Bank. ` +
                        `(${platformFee.toLocaleString()} ETB platform fee deducted)`,
                    metadata: {
                        paymentId: payment.id,
                        fromUserId: memberUser.id,
                        fromUserName: memberUser.fullName,
                        groupId: payment.groupId,
                        groupName,
                        roundNumber,
                        cycleNumber,
                        netWinnerAmount,
                        platformFee,
                        baseAmount,
                    },
                    io,
                });

                // Simulated SMS log — winner
                console.log('─────────────────────────────────────────');
                console.log(`📱 SMS SIMULATION  →  ${existingDraw.winner.phoneNumber}`);
                console.log(
                    `💬 MESSAGE: Supplemental Payout: You received ` +
                    `${netWinnerAmount.toLocaleString()} ETB from ${memberUser.fullName} ` +
                    `for Round ${roundNumber} (${groupName}) via Telebirr/Bank.`
                );
                console.log('─────────────────────────────────────────');
            } catch (notifErr) {
                console.warn(`[Payment] Winner notification failed (non-critical): ${notifErr.message}`);
            }

            // 4b. In-app notification for the organizer (penalty credit)
            if (penaltyAmount > 0) {
                try {
                    await createNotification({
                        userId: organizer.id,
                        type: 'PENALTY_RECEIVED',
                        title: 'Penalty Fee Received',
                        message: `You received ${penaltyAmount.toLocaleString()} ETB late penalty ` +
                            `from ${memberUser.fullName} for ${groupName} ` +
                            `(Round ${roundNumber}) via Telebirr.`,
                        metadata: {
                            paymentId: payment.id,
                            fromUserId: memberUser.id,
                            fromUserName: memberUser.fullName,
                            groupId: payment.groupId,
                            groupName,
                            roundNumber,
                            cycleNumber,
                            penaltyAmount,
                        },
                        io,
                    });

                    // Simulated SMS log — organizer
                    console.log('─────────────────────────────────────────');
                    console.log(`📱 SMS SIMULATION  →  ${organizer.phoneNumber}`);
                    console.log(
                        `💬 MESSAGE: Dear ${organizer.fullName}, you received a ` +
                        `${penaltyAmount.toLocaleString()} ETB late penalty fee from ` +
                        `${memberUser.fullName} for ${groupName} (Round ${roundNumber}) via Telebirr.`
                    );
                    console.log('─────────────────────────────────────────');
                } catch (notifErr) {
                    console.warn(`[Payment] Organizer penalty notification failed (non-critical): ${notifErr.message}`);
                }
            }

            return res.json({
                success: true,
                message: 'Late payment verified and funds routed successfully.',
                isPostDraw: true,
                netWinnerAmount,
                penaltyAmount,
                platformFee,
                payment,
            });
        }

        // ─────────────────────────────────────────────────────────────────
        // NORMAL FLOW — draw has not happened yet
        // ─────────────────────────────────────────────────────────────────

        // 4c. In-app notification for the paying member (confirmation)
        try {
            await createNotification({
                userId: memberUser.id,
                type: 'PAYMENT_CONFIRMED',
                title: 'Payment Confirmed',
                message: `Your contribution of ${totalPaid.toLocaleString()} ETB ` +
                    `for Round ${roundNumber} (${groupName}) has been verified.` +
                    (penaltyAmount > 0
                        ? ` Includes ${penaltyAmount.toLocaleString()} ETB late penalty.`
                        : ''),
                metadata: {
                    paymentId: payment.id,
                    groupId: payment.groupId,
                    groupName,
                    roundNumber,
                    cycleNumber,
                    totalPaid,
                    penaltyAmount,
                    tx_ref,
                },
                io,
            });
        } catch (notifErr) {
            console.warn(`[Payment] Member confirmation notification failed (non-critical): ${notifErr.message}`);
        }

        // 4d. Organizer penalty notification (normal, pre-draw)
        if (penaltyAmount > 0) {
            try {
                await createNotification({
                    userId: organizer.id,
                    type: 'PENALTY_RECEIVED',
                    title: 'Penalty Fee Received',
                    message: `You received ${penaltyAmount.toLocaleString()} ETB late penalty ` +
                        `from ${memberUser.fullName} for ${groupName} ` +
                        `(Round ${roundNumber}) via Telebirr.`,
                    metadata: {
                        paymentId: payment.id,
                        fromUserId: memberUser.id,
                        fromUserName: memberUser.fullName,
                        groupId: payment.groupId,
                        groupName,
                        roundNumber,
                        cycleNumber,
                        penaltyAmount,
                    },
                    io,
                });
            } catch (notifErr) {
                console.warn(`[Payment] Organizer pre-draw penalty notification failed (non-critical): ${notifErr.message}`);
            }
        }

        // ── 5. Simulated SMS logs (no external API, 100% offline-safe) ────
        try {
            await sendSMS(memberUser.phoneNumber,
                `Payment confirmed! Your Equb contribution of ${totalPaid.toLocaleString()} ETB ` +
                `for Round ${roundNumber} (Cycle ${cycleNumber}) has been verified. ` +
                `Group: ${groupName} | Ref: ${tx_ref}`
            );
        } catch (smsErr) {
            console.warn(`[Payment] Member SMS failed (non-critical): ${smsErr.message}`);
        }

        if (penaltyAmount > 0) {
            try {
                await sendSMS(organizer.phoneNumber,
                    `Dear ${organizer.fullName}, you received a ${penaltyAmount.toLocaleString()} ETB ` +
                    `late penalty fee from ${memberUser.fullName} for ${groupName} ` +
                    `(Round ${roundNumber}) via Telebirr.`
                );
            } catch (smsErr) {
                console.warn(`[Payment] Organizer SMS failed (non-critical): ${smsErr.message}`);
            }
        }

        // ── 6. Return success ──────────────────────────────────────────────
        return res.json({
            success: true,
            message: 'Payment verified successfully.',
            isPostDraw: false,
            payment,
        });

    } catch (error) {
        const msg = error.response?.data?.message || error.message;
        console.error(`[Payment] verifyChapaPayment error for ${tx_ref}: ${msg}`);
        return res.status(500).json({
            success: false,
            error: 'Payment verification failed. Please contact support.',
            detail: msg,
        });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// REPORTING / ORGANIZER REVIEW  (unchanged from original)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/payments/organizer/:organizerId/pending
 * Returns all PENDING payments for groups owned by this organizer.
 */
const getPendingPayments = async (req, res) => {
    try {
        const payments = await prisma.groupPayment.findMany({
            where: {
                status: 'PENDING',
                group: { organizerId: req.params.organizerId },
            },
            orderBy: { submittedAt: 'asc' },
            include: {
                membership: {
                    include: {
                        user: { select: { id: true, fullName: true, phoneNumber: true, faydaId: true } },
                    },
                },
                group: { select: { id: true, name: true, plan: true } },
            },
        });
        res.json(payments);
    } catch (error) {
        console.error('[Payment] getPendingPayments error:', error.message);
        res.status(500).json({ error: 'Failed to fetch pending payments.' });
    }
};

/**
 * PATCH /api/payments/:paymentId/review
 * Organizer manually approves or rejects a payment (fallback for non-Chapa submissions).
 */
const reviewPayment = async (req, res) => {
    const { status, note } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ error: "status must be 'APPROVED' or 'REJECTED'." });
    }

    try {
        const updated = await prisma.groupPayment.update({
            where: { id: req.params.paymentId },
            data: { status, note: note || null, reviewedAt: new Date() },
        });
        res.json({ message: `Payment ${status.toLowerCase()} successfully.`, payment: updated });
    } catch (error) {
        console.error('[Payment] reviewPayment error:', error.message);
        res.status(500).json({ error: 'Failed to review payment.' });
    }
};

/**
 * GET /api/payments/member/:userId
 * Returns the payment history for a specific member.
 */
const getMemberPayments = async (req, res) => {
    try {
        const payments = await prisma.groupPayment.findMany({
            where: { membership: { userId: req.params.userId } },
            include: { group: { select: { id: true, name: true, plan: true } } },
            orderBy: { submittedAt: 'desc' },
        });
        res.json(payments);
    } catch (error) {
        console.error('[Payment] getMemberPayments error:', error.message);
        res.status(500).json({ error: 'Failed to fetch payment history.' });
    }
};

module.exports = {
    initiateChapaPayment,
    verifyChapaPayment,
    getPendingPayments,
    reviewPayment,
    getMemberPayments,
    getPaymentRequirements,
};
