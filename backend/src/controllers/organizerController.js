const prisma = require('../config/db');

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
    try {
        const groups = await prisma.equbGroup.findMany({
            where: { organizerId: req.params.organizerId },
            include: { plan: true, _count: { select: { memberships: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ groups, stats: { total: groups.length, active: groups.filter(g => g.status === 'ACTIVE').length, open: groups.filter(g => g.status === 'OPEN').length, totalManaged: '0.00' } });
    } catch (error) { res.status(500).json({ error: "Failed" }); }
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
        include: { plan: true, memberships: { include: { user: true } } }
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

module.exports = { createGroup, getOrganizerGroups, startNewCycle, getPendingRequests, updateMembershipStatus, getGroupReport, deleteGroup, updateGroup };