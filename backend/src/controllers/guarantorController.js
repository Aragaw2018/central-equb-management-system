// backend/src/controllers/guarantorController.js
const prisma = require('../config/db');
const { getIO } = require('../socket');

/**
 * 1. requestGuarantor
 * Allows a winner to nominate an eligible group member as a Wase.
 * Fixes the 409 Conflict by cleaning up old REJECTED requests.
 */
const requestGuarantor = async (req, res) => {
    const { drawResultId, guarantorPhoneNumber, userId } = req.body;

    try {
        const drawResult = await prisma.drawResult.findUnique({
            where: { id: drawResultId },
            include: { guarantor: true }
        });

        if (drawResult.guarantor && drawResult.guarantor.status !== 'REJECTED') {
            return res.status(409).json({ error: 'A nomination is already active.' });
        }

        if (drawResult.guarantor?.status === 'REJECTED') {
            await prisma.guarantor.delete({ where: { id: drawResult.guarantor.id } });
        }

        const cleanPhone = guarantorPhoneNumber.replace(/\D/g, '').slice(-9);
        const guarantorUser = await prisma.user.findFirst({
            where: { phoneNumber: { contains: cleanPhone } }
        });

        if (!guarantorUser) return res.status(404).json({ error: 'Member not found.' });

        const guarantor = await prisma.guarantor.create({
            data: { drawResultId, guarantorId: guarantorUser.id, status: 'PENDING' }
        });

        res.status(201).json({ message: 'Nomination sent!', guarantor });
    } catch (error) {
        res.status(500).json({ error: "Failed to process nomination." });
    }
};

/**
 * 2. respondToGuarantor
 * Handles Wase acceptance (with 3 security docs) or rejection.
 */
const respondToGuarantor = async (req, res) => {
    const { guarantorId } = req.params;
    const { status, userId, checkNumber } = req.body;

    try {
        const record = await prisma.guarantor.findUnique({
            where: { id: guarantorId },
            include: { drawResult: true }
        });

        if (!record || record.guarantorId !== userId) {
            return res.status(403).json({ error: 'Access Denied.' });
        }

        const updateData = { status, respondedAt: new Date() };

        if (status === 'ACCEPTED') {
            if (req.files) {
                // Asset files mapping
                if (req.files.checkImage) updateData.checkImageUrl = `/uploads/guarantor/${req.files.checkImage[0].filename}`;
                if (req.files.landDoc) updateData.landDocUrl = `/uploads/guarantor/${req.files.landDoc[0].filename}`;
                if (req.files.faydaScan) updateData.documentUrl = `/uploads/guarantor/${req.files.faydaScan[0].filename}`;
            }
            updateData.checkNumber = checkNumber;
            updateData.documentStatus = 'PENDING';
        }

        const updated = await prisma.guarantor.update({
            where: { id: guarantorId },
            data: updateData,
            include: {
                guarantor: { select: { fullName: true } },
                drawResult: { select: { winnerId: true } }
            }
        });

        if (status === 'ACCEPTED') {
            await prisma.drawResult.update({
                where: { id: record.drawResultId },
                data: { guarantorProvided: true }
            });
        }

        // Notify the Winner
        const io = getIO();
        if (io) {
            io.to(`user:${updated.drawResult.winnerId}`).emit('guarantorResponded', {
                status,
                guarantorName: updated.guarantor.fullName
            });
        }

        res.json({ message: `Response registered: ${status}`, guarantor: updated });
    } catch (error) {
        console.error('respondToGuarantor error:', error);
        res.status(500).json({ error: 'Processing failed.' });
    }
};

/**
 * 3. searchEligibleGuarantors
 * Fetches group members who haven't won yet and aren't the winner.
 */
const searchEligibleGuarantors = async (req, res) => {
    const { groupId, phone, excludeUserId } = req.query;

    if (!groupId || !phone) {
        return res.status(400).json({ error: 'Group ID and Phone are required.' });
    }

    try {
        // Cleaning phone number (removing initial 0 or +251 and taking the last 9 digits)
        const cleanPhone = phone.replace(/\D/g, '').slice(-9);

        const memberships = await prisma.equbMembership.findMany({
            where: {
                groupId: groupId,
                status: 'APPROVED',
                hasWon: false, // 🎯 Key point: Only those who haven't won yet
                userId: { not: excludeUserId }, // Cannot act as own guarantor
                user: {
                    phoneNumber: { contains: cleanPhone } // Will find it regardless of format
                }
            },
            include: {
                user: {
                    select: { id: true, fullName: true, phoneNumber: true }
                }
            }
        });

        res.json(memberships.map(m => m.user));
    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json({ error: "Failed to search members." });
    }
};

/**
 * Helper: read service_fee_pct from SystemSetting (defaults to 2 if not set)
 */
async function getServiceFeePct() {
    try {
        const setting = await prisma.systemSetting.findUnique({ where: { key: 'service_fee_pct' } });
        const pct = parseFloat(setting?.value ?? '2');
        return isNaN(pct) ? 2 : pct;
    } catch {
        return 2; // safe default
    }
}

/**
 * Helper: compute pot breakdown from ACTUAL approved payments for a draw round.
 *
 * We deliberately ignore the stored `potAmount` on DrawResult because historical
 * rows may have been written before the pot-inflation bug was fixed. Deriving the
 * breakdown from real payment rows guarantees accuracy regardless of when the
 * draw was conducted.
 *
 * Logic:
 *   - Sum the BASE contributions (amount - penaltyAmount) from APPROVED payments
 *     for the exact groupId + roundNumber + cycleNumber of this draw.
 *   - Apply the dynamic service fee to get platformFee and netPayout.
 */
async function computePotBreakdown(result, feePct) {
    // Fetch every approved payment for this specific draw round
    const payments = await prisma.groupPayment.findMany({
        where: {
            groupId: result.groupId,
            roundNumber: result.roundNumber,
            cycleNumber: result.cycleNumber,
            status: 'APPROVED',
        },
        select: { amount: true, penaltyAmount: true },
    });

    // totalPot = sum of BASE contributions only (exclude late-penalty portion)
    const totalPot = parseFloat(
        payments.reduce((sum, p) => {
            const base = parseFloat(p.amount) - parseFloat(p.penaltyAmount || 0);
            return sum + base;
        }, 0).toFixed(2)
    );

    const platformFee = parseFloat(((totalPot * feePct) / 100).toFixed(2));
    const netPayout = parseFloat((totalPot - platformFee).toFixed(2));

    return { totalPot, platformFee, netPayout, feePct };
}

/**
 * 4. getPayoutsForOrganizer
 * Full report for the distribution center with correct pot, fee, and net payout.
 * Bug 1 fix: uses actual approved members, not plan.maxMembers.
 * Bug 2 fix: applies service_fee_pct from SystemSetting.
 */
const getPayoutsForOrganizer = async (req, res) => {
    const { organizerId } = req.params;
    try {
        const [results, feePct] = await Promise.all([
            prisma.drawResult.findMany({
                where: { group: { organizerId } },
                orderBy: { drawnAt: 'desc' },
                include: {
                    winner: {
                        select: {
                            id: true, fullName: true, phoneNumber: true, email: true,
                            bankName: true, accountNumber: true, accountHolder: true,
                        },
                    },
                    group: { include: { plan: true, memberships: { where: { status: 'APPROVED' } } } },
                    guarantor: { include: { guarantor: true } },
                },
            }),
            getServiceFeePct(),
        ]);

        const formattedResults = await Promise.all(
            results.map(async (r) => {
                const breakdown = await computePotBreakdown(r, feePct);
                return { ...r, ...breakdown };
            })
        );

        res.json(formattedResults);
    } catch (error) {
        console.error('getPayoutsForOrganizer error:', error);
        res.status(500).json({ error: 'Failed to fetch payouts report.' });
    }
};

/**
 * Helper Fetchers
 */
const getPendingRequests = async (req, res) => {
    try {
        const requests = await prisma.guarantor.findMany({
            where: { guarantorId: req.params.userId, status: 'PENDING' },
            include: {
                drawResult: {
                    include: { group: { include: { plan: true } }, winner: true }
                }
            }
        });
        res.json(requests);
    } catch (error) { res.status(500).json({ error: "Failed" }); }
};

const getMemberWins = async (req, res) => {
    const { userId } = req.params;
    try {
        const wins = await prisma.drawResult.findMany({
            where: { winnerId: userId },
            include: {
                group: { include: { plan: true } },
                guarantor: { include: { guarantor: { select: { id: true, fullName: true } } } }
            },
            orderBy: { drawnAt: 'desc' }
        });
        res.json(wins);
    } catch (error) { res.status(500).json({ error: 'Failed to fetch wins.' }); }
};

const verifyDocuments = async (req, res) => {
    try {
        const updated = await prisma.guarantor.update({
            where: { id: req.params.guarantorId },
            data: { documentStatus: req.body.documentStatus }
        });
        res.json({ message: "Status updated.", guarantor: updated });
    } catch (error) { res.status(500).json({ error: "Verification failed." }); }
};

const releaseFunds = async (req, res) => {
    const { drawResultId } = req.params;
    const { organizerId } = req.body;

    try {
        // Validate ownership
        const drawResult = await prisma.drawResult.findUnique({
            where: { id: drawResultId },
            include: {
                group: { include: { plan: true, memberships: { where: { status: 'APPROVED' } } } },
                guarantor: true,
            },
        });

        if (!drawResult) return res.status(404).json({ error: 'Draw result not found.' });
        if (drawResult.group.organizerId !== organizerId) {
            return res.status(403).json({ error: 'Only the group organizer can release funds.' });
        }
        if (!drawResult.guarantorProvided || !drawResult.guarantor || drawResult.guarantor.status !== 'ACCEPTED') {
            return res.status(400).json({ error: 'Funds can only be released after an ACCEPTED guarantor.' });
        }
        if (drawResult.guarantor.documentStatus !== 'VERIFIED') {
            return res.status(400).json({ error: 'Guarantor documents must be VERIFIED before releasing funds.' });
        }
        if (drawResult.isFundsReleased) {
            return res.status(400).json({ error: 'Funds have already been released for this round.' });
        }

        // Compute final breakdown with current fee setting
        const feePct = await getServiceFeePct();
        const breakdown = await computePotBreakdown(drawResult, feePct);

        const updated = await prisma.drawResult.update({
            where: { id: drawResultId },
            data: { isFundsReleased: true },
        });

        console.log(
            `[Payout] Released | round=${drawResult.roundNumber} | group=${drawResult.group.name} ` +
            `| totalPot=${breakdown.totalPot} | fee=${breakdown.platformFee} | net=${breakdown.netPayout}`
        );

        res.json({
            message: 'Funds released successfully.',
            drawResult: updated,
            ...breakdown,
        });
    } catch (error) {
        console.error('releaseFunds error:', error);
        res.status(500).json({ error: 'Release failed: ' + error.message });
    }
};

module.exports = {
    requestGuarantor, respondToGuarantor, getPendingRequests,
    getMemberWins, searchEligibleGuarantors, verifyDocuments,
    releaseFunds, getPayoutsForOrganizer
};