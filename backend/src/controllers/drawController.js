// backend/src/controllers/drawController.js
const prisma = require('../config/db');
const { getIO } = require('../socket');
const { triggerDraw } = require('../socket');

const startDraw = async (req, res) => {
    const { groupId } = req.params;

    try {
        const group = await prisma.equbGroup.findUnique({
            where: { id: groupId },
            include: { plan: true },
        });

        if (!group) return res.status(404).json({ error: 'Group not found!' });

        // Informational pre-check: find unpaid members to include in the response,
        // but do NOT block the draw — triggerDraw handles eligibility filtering.
        const unpaidMembers = await prisma.equbMembership.findMany({
            where: {
                groupId,
                status: 'APPROVED',
                payments: {
                    none: {
                        roundNumber: group.currentRound,
                        cycleNumber: group.cycleNumber,
                        status: 'APPROVED',
                    },
                },
            },
            include: { user: { select: { id: true, fullName: true } } },
        });

        const drawData = await triggerDraw(groupId);

        return res.json({
            message: 'The draw has started.',
            drawData,
            // Surface unpaid members to the client as a warning (not an error)
            unpaidMembers: unpaidMembers.map(m => ({
                userId: m.user.id,
                fullName: m.user.fullName,
            })),
            unpaidCount: unpaidMembers.length,
        });

    } catch (error) {
        // triggerDraw only throws when ZERO paid members exist — treat as 400
        return res.status(400).json({ error: error.message });
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