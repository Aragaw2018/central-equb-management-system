// backend/src/controllers/reportController.js
const prisma = require('../config/db');

// 1. Financial report for a member
const getMemberFinancials = async (req, res) => {
    const { userId } = req.params;

    try {
        // Total approved payments sum
        const payments = await prisma.groupPayment.aggregate({
            where: { membership: { userId }, status: 'APPROVED' },
            _sum: { amount: true }
        });

        // Total won amount sum
        const wins = await prisma.drawResult.aggregate({
            where: { winnerId: userId },
            _sum: { potAmount: true }
        });

        // Payment status counts (paid, unpaid, rejected)
        const paymentStats = await prisma.groupPayment.groupBy({
            by: ['status'],
            where: { membership: { userId } },
            _count: true
        });

        res.json({
            totalPaid: payments._sum.amount || 0,
            totalWon: wins._sum.potAmount || 0,
            netBalance: (wins._sum.potAmount || 0) - (payments._sum.amount || 0),
            paymentStats
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch financials" });
    }
};

// 2. Report data for the Organizer
const getOrganizerAnalytics = async (req, res) => {
    const { organizerId } = req.params;

    try {
        const [
            totalGroups,
            totalCollected,
            pendingPayments,
            totalPenaltyEarnings,
            recentPenaltyActivities,
        ] = await Promise.all([
            // Total number of groups under the organizer
            prisma.equbGroup.count({ where: { organizerId } }),

            // Total collected amount (all approved payments)
            prisma.groupPayment.aggregate({
                where: { group: { organizerId }, status: 'APPROVED' },
                _sum: { amount: true },
            }),

            // Pending (unapproved) payments
            prisma.groupPayment.count({
                where: { group: { organizerId }, status: 'PENDING' },
            }),

            // Sum of all penalty amounts on approved payments
            prisma.groupPayment.aggregate({
                where: {
                    group: { organizerId },
                    status: 'APPROVED',
                    penaltyAmount: { gt: 0 },
                },
                _sum: { penaltyAmount: true },
            }),

            // Latest 10 payments that included a penalty — for the notification cards
            prisma.groupPayment.findMany({
                where: {
                    group: { organizerId },
                    status: 'APPROVED',
                    penaltyAmount: { gt: 0 },
                },
                orderBy: { reviewedAt: 'desc' },
                take: 10,
                select: {
                    id: true,
                    amount: true,
                    penaltyAmount: true,
                    penaltyTier: true,
                    roundNumber: true,
                    cycleNumber: true,
                    reviewedAt: true,
                    submittedAt: true,
                    transactionId: true,
                    membership: {
                        select: {
                            user: { select: { id: true, fullName: true, phoneNumber: true } },
                        },
                    },
                    group: { select: { id: true, name: true } },
                },
            }),
        ]);

        res.json({
            totalGroups,
            totalCollected: totalCollected._sum.amount ?? 0,
            pendingPayments,
            totalPenaltyEarnings: totalPenaltyEarnings._sum.penaltyAmount ?? 0,
            recentPenaltyActivities: recentPenaltyActivities.map(p => ({
                id: p.id,
                transactionId: p.transactionId,
                amount: Number(p.amount),
                penaltyAmount: Number(p.penaltyAmount),
                penaltyTier: p.penaltyTier,
                roundNumber: p.roundNumber,
                cycleNumber: p.cycleNumber,
                reviewedAt: p.reviewedAt,
                submittedAt: p.submittedAt,
                memberName: p.membership?.user?.fullName ?? 'Unknown',
                memberPhone: p.membership?.user?.phoneNumber ?? '',
                groupId: p.group?.id ?? '',
                groupName: p.group?.name ?? '',
            })),
        });
    } catch (error) {
        console.error('getOrganizerAnalytics error:', error.message);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
};

module.exports = { getMemberFinancials, getOrganizerAnalytics };