// backend/src/controllers/memberController.js
const prisma = require('../config/db');

// 1. Fetch all open groups
const getOpenGroups = async (req, res) => {
    try {
        const groups = await prisma.equbGroup.findMany({
            where: { status: 'OPEN' },
            include: {
                plan: true,
                organizer: { select: { id: true, fullName: true } },
                _count: { select: { memberships: { where: { status: 'APPROVED' } } } }
            }
        });
        res.json(groups);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch open groups" });
    }
};

// 2. Fetch groups under a specific plan
const getGroupsByPlan = async (req, res) => {
    try {
        const groups = await prisma.equbGroup.findMany({
            where: { planId: req.params.planId, status: 'OPEN' },
            include: {
                plan: true,
                organizer: { select: { id: true, fullName: true } },
                _count: { select: { memberships: { where: { status: 'APPROVED' } } } }
            }
        });
        res.json(groups);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch groups by plan" });
    }
};

// 3. Join group request
const joinGroup = async (req, res) => {
    const { userId, groupId } = req.body;
    try {
        const existing = await prisma.equbMembership.findUnique({
            where: { userId_groupId: { userId, groupId } }
        });
        if (existing) return res.status(400).json({ error: "Already applied to this group" });

        const membership = await prisma.equbMembership.create({
            data: { userId, groupId, status: 'PENDING' }
        });
        res.status(201).json({ message: "Request sent", membership });
    } catch (error) {
        res.status(500).json({ error: "Failed to join group" });
    }
};

// 4. Fetch memberships of a specific member
const getMemberMemberships = async (req, res) => {
    try {
        const memberships = await prisma.equbMembership.findMany({
            where: { userId: req.params.userId },
            include: { 
                group: { include: { plan: true, organizer: true } } 
            },
            orderBy: { joinedAt: 'desc' }
        });
        res.json(memberships);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch memberships" });
    }
};

// 5. Fetch group details (for draw page)
const getGroupDetails = async (req, res) => {
    try {
        const group = await prisma.equbGroup.findUnique({
            where: { id: req.params.groupId },
            include: {
                plan: true,
                organizer: { select: { id: true, fullName: true } },
                memberships: {
                    where: { status: 'APPROVED' },
                    select: { userId: true, hasWon: true, user: { select: { fullName: true } } }
                }
            }
        });
        res.json(group);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch group details" });
    }
};

// 6. Fetch member wins list
const getMemberWins = async (req, res) => {
    try {
        const wins = await prisma.drawResult.findMany({
            where: { winnerId: req.params.userId },
            include: { 
                group: { include: { plan: true } }, 
                guarantor: { include: { guarantor: true } }
            },
            orderBy: { drawnAt: 'desc' }
        });
        res.json(wins);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch wins" });
    }
};

// 7. Search members (for guarantor)
const searchGroupMembers = async (req, res) => {
    const { phone, forGuarantor } = req.query;
    try {
        const memberships = await prisma.equbMembership.findMany({
            where: {
                groupId: req.params.groupId,
                status: 'APPROVED',
                user: phone ? { phoneNumber: { contains: phone } } : {}
            },
            include: { user: true }
        });

        let members = memberships.map(m => m.user);

        if (forGuarantor === 'true') {
            const winners = await prisma.drawResult.findMany({
                where: { groupId: req.params.groupId },
                select: { winnerId: true }
            });
            const winnerIds = new Set(winners.map(w => w.winnerId));
            members = members.filter(m => !winnerIds.has(m.id));
        }

        res.json(members);
    } catch (error) {
        res.status(500).json({ error: "Search failed" });
    }
};

// 🎯 Export all functions (none should be left behind)
module.exports = { 
    getOpenGroups,
    getGroupsByPlan,
    joinGroup,
    getMemberMemberships,
    getGroupDetails,
    getMemberWins,
    searchGroupMembers 
};