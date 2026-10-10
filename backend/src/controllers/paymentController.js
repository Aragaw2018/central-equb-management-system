// backend/src/controllers/paymentController.js
const prisma = require('../config/db');


// Replace submitPayment function with this
const submitPayment = async (req, res) => {
    const { membershipId, groupId, transactionId, amount } = req.body;

    try {
        const membership = await prisma.equbMembership.findUnique({
            where: { id: membershipId },
            include: { group: true },
        });

        if (!membership || membership.status !== 'APPROVED') {
            return res.status(403).json({ error: 'Membership not approved.' });
        }

        // 🎯 Get current round and cycle number from the group
        const currentRound = membership.group.currentRound;
        const currentCycle = membership.group.cycleNumber;

        // 🎯 Check: Verify if payment already exists for this cycle and round
        const existing = await prisma.groupPayment.findFirst({
            where: { 
                membershipId, 
                roundNumber: currentRound, 
                cycleNumber: currentCycle, // Cycle is our identifier
                status: { not: 'REJECTED' } 
            }
        });

        if (existing) {
            return res.status(400).json({ error: "You have already paid for this round in the current cycle." });
        }

        const payment = await prisma.groupPayment.create({
            data: {
                membershipId,
                groupId,
                roundNumber: currentRound,
                cycleNumber: currentCycle, // 🎯 Cycle is recorded here
                amount: parseFloat(amount),
                transactionId: transactionId.trim(),
                receiptImageUrl: req.file ? `/uploads/payments/${req.file.filename}` : null,
                status: 'PENDING',
            }
        });

        res.status(201).json({ message: "Payment submitted successfully!", payment });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Payment submission failed." });
    }
};

// ── 2. Organizer fetches pending payments for their groups ────────────────────
const getPendingPayments = async (req, res) => {
    try {
        const payments = await prisma.groupPayment.findMany({
            where: { status: 'PENDING', group: { organizerId: req.params.organizerId } },
            include: { membership: { include: { user: true } }, group: true }
        });
        res.json(payments);
    } catch (e) { res.status(500).json({ error: "Failed" }); }
};

const reviewPayment = async (req, res) => {
    try {
        const updated = await prisma.groupPayment.update({
            where: { id: req.params.paymentId },
            data: { status: req.body.status, note: req.body.note, reviewedAt: new Date() }
        });
        res.json({ message: "Success", payment: updated });
    } catch (e) { res.status(500).json({ error: "Failed" }); }
};

const getMemberPayments = async (req, res) => {
    try {
        const payments = await prisma.groupPayment.findMany({
            where: { membership: { userId: req.params.userId } },
            include: { group: true },
            orderBy: { submittedAt: 'desc' }
        });
        res.json(payments);
    } catch (e) { res.status(500).json({ error: "Failed" }); }
};

module.exports = { submitPayment, getPendingPayments, reviewPayment, getMemberPayments };