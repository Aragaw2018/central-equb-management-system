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
        // Total number of groups under the organizer
        const totalGroups = await prisma.equbGroup.count({ where: { organizerId } });

        // Total collected amount
        const totalCollected = await prisma.groupPayment.aggregate({
            where: { group: { organizerId }, status: 'APPROVED' },
            _sum: { amount: true }
        });

        // Pending (unapproved) payments
        const pendingPayments = await prisma.groupPayment.count({
            where: { group: { organizerId }, status: 'PENDING' }
        });

        res.json({
            totalGroups,
            totalCollected: totalCollected._sum.amount || 0,
            pendingPayments
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch analytics" });
    }
};

module.exports = { getMemberFinancials, getOrganizerAnalytics };