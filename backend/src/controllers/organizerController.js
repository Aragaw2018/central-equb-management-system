const prisma = require('../config/db');
const sendSMS = require('../config/smsService');
const { createNotification } = require('./notificationController');
const { getIO } = require('../socket');

const startNewCycle = async (req, res) => {
    const { groupId } = req.params;
    try {
        await prisma.$transaction([
            // 1. Reset 'hasWon' to false for all members (this is the main solution)
            prisma.equbMembership.updateMany({
                where: { groupId: groupId },
                data: { hasWon: false }
            }),
            // 2. Reset the round to 1 and increment the cycle
            prisma.equbGroup.update({
                where: { id: groupId },
                data: { currentRound: 1, cycleNumber: { increment: 1 } }
            })
        ]);
        res.json({ message: "New cycle started successfully!" });
    } catch (e) {
        res.status(500).json({ error: "Failed to reset" });
    }
};

const createGroup = async (req, res) => {
    const { name, description, planId, startDate, organizerId, bankName, accountName, accountNumber } = req.body;
    try {
        const group = await prisma.equbGroup.create({
            data: { name, description, planId, organizerId, startDate: new Date(startDate), status: 'OPEN', bankName, accountName, accountNumber }
        });
        res.status(201).json({ message: "Success", group });
    } catch (error) { res.status(500).json({ error: "Failed" }); }
};

const getOrganizerGroups = async (req, res) => {
    const organizerId = req.params.organizerId;
    try {
        const [groups, paymentVolume, approvedMemberCount] = await Promise.all([
            prisma.equbGroup.findMany({
                where: { organizerId },
                include: {
                    plan: true,
                    memberships: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    firstName: true,
                                    fatherName: true,
                                    phoneNumber: true,
                                    faydaId: true,
                                    kycStatus: true,
                                },
                            },
                            payments: true,
                        },
                    },
                    _count: { select: { memberships: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            // Real total managed: sum of all approved payments across organizer's groups
            prisma.groupPayment.aggregate({
                where: { group: { organizerId }, status: 'APPROVED' },
                _sum: { amount: true },
            }),
            // Real total members count
            prisma.equbMembership.count({
                where: { group: { organizerId } },
            }),
        ]);

        const totalManaged = parseFloat(paymentVolume._sum.amount ?? 0).toFixed(2);

        res.json({
            groups,
            stats: {
                total: approvedMemberCount,
                active: groups.filter(g => g.status === 'ACTIVE').length,
                open: groups.filter(g => g.status === 'OPEN').length,
                totalManaged,
            },
        });
    } catch (error) {
        console.error('getOrganizerGroups error:', error.message);
        res.status(500).json({ error: 'Failed to fetch groups.' });
    }
};

const getPendingRequests = async (req, res) => {
    const requests = await prisma.equbMembership.findMany({
        where: { group: { organizerId: req.params.organizerId }, status: 'PENDING' },
        include: { user: true, group: true }
    });
    res.json(requests);
};

const updateMembershipStatus = async (req, res) => {
    const updated = await prisma.equbMembership.update({
        where: { id: req.params.membershipId },
        data: { status: req.body.status }
    });
    res.json(updated);
};

const getGroupReport = async (req, res) => {
    const group = await prisma.equbGroup.findUnique({
        where: { id: req.params.groupId },
        include: {
            plan: true,
            memberships: {
                include: {
                    user: {
                        select: {
                            id: true, fullName: true, firstName: true, fatherName: true,
                            phoneNumber: true, faydaId: true, kycStatus: true,
                        },
                    },
                    // Include ALL approved payments for this membership so the
                    // financial report can compute totalPaid, penaltyTotal, completedRounds
                    payments: {
                        where: { status: 'APPROVED' },
                        select: {
                            id: true, roundNumber: true, cycleNumber: true,
                            amount: true, penaltyAmount: true, status: true, submittedAt: true,
                        },
                        orderBy: { roundNumber: 'asc' },
                    },
                },
            },
        },
    });
    res.json(group);
};

const deleteGroup = async (req, res) => {
    await prisma.equbGroup.delete({ where: { id: req.params.groupId } });
    res.json({ message: "Deleted" });
};

const updateGroup = async (req, res) => {
    const updated = await prisma.equbGroup.update({ where: { id: req.params.groupId }, data: req.body });
    res.json(updated);
};

/**
 * GET /api/organizer/groups/:groupId/members
 * Returns all members (approved & pending) with complete details
 */
const getGroupMembers = async (req, res) => {
    const { groupId } = req.params;
    try {
        const group = await prisma.equbGroup.findUnique({
            where: { id: groupId },
            select: { currentRound: true, cycleNumber: true, name: true },
        });

        if (!group) return res.status(404).json({ error: 'Group not found.' });

        const { currentRound, cycleNumber } = group;

        // FIX: Remove status: 'APPROVED' restriction so all enrolled members appear!
        const memberships = await prisma.equbMembership.findMany({
            where: { groupId },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        firstName: true,
                        fatherName: true,
                        phoneNumber: true,
                        faydaId: true,
                        kycStatus: true,
                    },
                },
                payments: {
                    where: { cycleNumber },
                    select: { roundNumber: true, status: true, amount: true, submittedAt: true },
                },
            },
            orderBy: { joinedAt: 'asc' },
        });

        // Derive per-member payment status & robust name fallback
        const members = memberships.map(m => {
            const currentPayment = m.payments.find(
                p => p.roundNumber === currentRound && p.status === 'APPROVED'
            );
            const pendingPayment = m.payments.find(
                p => p.roundNumber === currentRound && p.status === 'PENDING'
            );

            const paidRounds = new Set(
                m.payments.filter(p => p.status === 'APPROVED').map(p => p.roundNumber)
            );
            let isOverdue = false;
            for (let r = 1; r < currentRound; r++) {
                if (!paidRounds.has(r)) { isOverdue = true; break; }
            }

            let paymentStatus;
            if (currentPayment) paymentStatus = 'PAID';
            else if (isOverdue) paymentStatus = 'OVERDUE';
            else if (pendingPayment) paymentStatus = 'PENDING';
            else paymentStatus = 'UNPAID';

            // Robust full name builder
            const resolvedName = m.user.fullName?.trim()
                || [m.user.firstName, m.user.fatherName].filter(Boolean).join(' ')
                || `Member (${m.user.phoneNumber || 'N/A'})`;

            return {
                membershipId: m.id,
                userId: m.user.id,
                fullName: resolvedName,
                phoneNumber: m.user.phoneNumber || 'N/A',
                faydaId: m.user.faydaId || 'N/A',
                kycStatus: m.user.kycStatus || 'PENDING',
                membershipStatus: m.status, // 'APPROVED' or 'PENDING'
                hasWon: m.hasWon || false,
                paymentStatus,
                currentRound,
            };
        });

        return res.json({ members, currentRound, cycleNumber, groupId, groupName: group.name });
    } catch (error) {
        console.error('getGroupMembers error:', error.message);
        return res.status(500).json({ error: 'Failed to fetch group members.' });
    }
};

/**
 * POST /api/organizer/groups/:groupId/send-reminders
 *
 * Finds all approved members who have NOT paid for the group's current round,
 * creates a persisted in-app Notification for each one, pushes it over Socket.io
 * so the member's NotificationBell updates instantly, and logs a simulated SMS.
 */
const sendPaymentReminders = async (req, res) => {
    const { groupId } = req.params;

    try {
        // 1. Fetch group with current round info
        const group = await prisma.equbGroup.findUnique({
            where: { id: groupId },
            select: { id: true, name: true, currentRound: true, cycleNumber: true },
        });
        if (!group) return res.status(404).json({ error: 'Group not found.' });

        const { currentRound, cycleNumber, name: groupName } = group;

        // 2. Fetch all APPROVED memberships with user details
        const memberships = await prisma.equbMembership.findMany({
            where: { groupId, status: 'APPROVED' },
            include: { user: { select: { id: true, fullName: true, phoneNumber: true } } },
        });

        // 3. Find memberships that already have an APPROVED payment this round
        const paidSet = new Set(
            (await prisma.groupPayment.findMany({
                where: { groupId, roundNumber: currentRound, cycleNumber, status: 'APPROVED' },
                select: { membershipId: true },
            })).map(p => p.membershipId)
        );

        const unpaid = memberships.filter(m => !paidSet.has(m.id));

        if (unpaid.length === 0) {
            return res.json({
                success: true,
                count: 0,
                message: 'All members have already paid for this round. No reminders needed.',
            });
        }

        // 4. Persist notification + real-time socket push + SMS log for each unpaid member
        const io = getIO();

        await Promise.all(unpaid.map(async (m) => {
            const title = 'Payment Reminder';
            const message = `Dear ${m.user.fullName}, your contribution for Round ${currentRound} of "${groupName}" is due. Please pay via Chapa to avoid late penalties.`;

            // createNotification persists to DB AND emits 'newNotification' via socket
            await createNotification({
                userId: m.user.id,
                type: 'REMINDER',
                title,
                message,
                metadata: { groupId, groupName, roundNumber: currentRound, cycleNumber },
                io,
            });

            // Simulated SMS log — zero external API dependency
            console.log('─────────────────────────────────────────');
            console.log(`[SMS REMINDER] → ${m.user.phoneNumber}`);
            console.log(`💬 Dear ${m.user.fullName}, Round ${currentRound} payment for "${groupName}" is due. Pay now via Chapa.`);
            console.log('─────────────────────────────────────────');
        }));

        console.log(`[Reminder] Delivered | group=${groupName} | round=${currentRound} | recipients=${unpaid.length}`);

        return res.json({
            success: true,
            count: unpaid.length,
            message: `Reminders delivered to ${unpaid.length} member${unpaid.length > 1 ? 's' : ''}.`,
        });

    } catch (error) {
        console.error('[Reminder] sendPaymentReminders error:', error.message);
        return res.status(500).json({ error: 'Failed to send reminders. Please try again.' });
    }
};

module.exports = {
    createGroup,
    getOrganizerGroups,
    startNewCycle,
    getPendingRequests,
    updateMembershipStatus,
    getGroupReport,
    deleteGroup,
    updateGroup,
    getGroupMembers,
    sendPaymentReminders,
};