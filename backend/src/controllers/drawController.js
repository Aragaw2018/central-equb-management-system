// backend/src/controllers/drawController.js
const prisma = require('../config/db');
const { getIO } = require('../socket');
const { triggerDraw } = require('../socket');

const startDraw = async (req, res) => {
    const { groupId } = req.params;

    try {
        const group = await prisma.equbGroup.findUnique({
            where: { id: groupId },
            include: { plan: true }
        });

        if (!group) return res.status(404).json({ error: "Group not found!" });

        // 🎯 Payment verification check (Extra Safety)
        const unpaidMembers = await prisma.equbMembership.findMany({
            where: {
                groupId: groupId,
                status: 'APPROVED',
                payments: {
                    none: {
                        roundNumber: group.currentRound,
                        cycleNumber: group.cycleNumber,
                        status: 'APPROVED'
                    }
                }
            },
            include: { user: true }
        });

        if (unpaidMembers.length > 0) {
            const names = unpaidMembers.map(m => m.user.fullName).join(", ");
            return res.status(400).json({ 
                error: `There are members whose payments are not approved for round ${group.currentRound} (Cycle ${group.cycleNumber}): ${names}` 
            });
        }

        const drawData = await triggerDraw(groupId);
        res.json({ message: "The draw has started.", drawData });

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getDrawResults = async (req, res) => {
    const { groupId } = req.params;
    try {
        const results = await prisma.drawResult.findMany({
            where: { groupId },
            orderBy: [{ cycleNumber: 'desc' }, { roundNumber: 'desc' }],
            include: { winner: { select: { id: true, fullName: true, phoneNumber: true } } },
        });
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch history." });
    }
};

const confirmGuarantor = async (req, res) => {
    try {
        const updated = await prisma.drawResult.update({
            where: { id: req.params.resultId },
            data: { guarantorProvided: true },
        });
        res.json({ message: 'Guarantor confirmed.', drawResult: updated });
    } catch (error) { res.status(500).json({ error: error.message }); }
};


module.exports = { startDraw, getDrawResults, confirmGuarantor };