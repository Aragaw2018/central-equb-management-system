// backend/src/controllers/memberController.js
const prisma = require('../config/db');

/**
 * Read kyc_mode from SystemSetting.
 * Returns 'automated' (default) or 'manual'.
 * Fail-open on DB errors.
 */
async function getKycMode() {
    try {
        const s = await prisma.systemSetting.findUnique({ where: { key: 'kyc_mode' } });
        return s?.value === 'manual' ? 'manual' : 'automated';
    } catch {
        return 'automated';
    }
}

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
        // ── KYC gate ──────────────────────────────────────────────────────────
        // In 'automated' mode: member must be VERIFIED before joining.
        // In 'manual'    mode: admin approves KYC separately — gate is bypassed here
        //                      (admin KYC review enforces verification manually).
        const [user, kycMode] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId }, select: { kycStatus: true } }),
            getKycMode(),
        ]);

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        if (kycMode === 'automated' && user.kycStatus !== 'VERIFIED') {
            return res.status(403).json({
                error: 'Access Denied: You must complete National Fayda ID verification before joining an Equb group.',
                code: 'KYC_REQUIRED',
            });
        }

        // In manual mode, warn but allow (admin will review KYC separately)
        const kycWarning = kycMode === 'manual' && user.kycStatus !== 'VERIFIED'
            ? 'Note: Your Fayda ID is pending admin review. Participation is subject to approval.'
            : null;

        const existing = await prisma.equbMembership.findUnique({
            where: { userId_groupId: { userId, groupId } }
        });
        if (existing) return res.status(400).json({ error: "Already applied to this group" });

        const membership = await prisma.equbMembership.create({
            data: { userId, groupId, status: 'PENDING' }
        });
        res.status(201).json({ message: "Request sent", membership, ...(kycWarning && { kycWarning }) });
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