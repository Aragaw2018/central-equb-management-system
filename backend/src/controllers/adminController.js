const prisma = require('../config/db');

// ── 1. Get pending (unapproved) organizers ────────────────────────────────────
const getPendingOrganizers = async (req, res) => {
    try {
        const pending = await prisma.user.findMany({
            where: { role: 'ORGANIZER', isApproved: false }
        });
        res.json(pending);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch pending organizers" });
    }
};

// ── 2. Approve an organizer ───────────────────────────────────────────────────
const approveOrganizer = async (req, res) => {
    const { userId } = req.body;
    try {
        await prisma.user.update({
            where: { id: userId },
            data: { isApproved: true }
        });
        res.json({ message: "Organizer approved successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Approval failed" });
    }
};

// ── 3. Create a new Equb Plan ─────────────────────────────────────────────────
const createPlan = async (req, res) => {
    const {
        category, amount, penalty, maxMembers, description,
        tier1Penalty, tier2Penalty, tier3Penalty,
    } = req.body;

    if (!category || !amount || maxMembers === undefined) {
        return res.status(400).json({ error: "category, amount, and maxMembers are required." });
    }

    const validCategories = ['DAILY', 'WEEKLY', 'MONTHLY'];
    if (!validCategories.includes(category)) {
        return res.status(400).json({ error: "category must be DAILY, WEEKLY, or MONTHLY." });
    }

    if (Number(amount) <= 0 || Number(maxMembers) <= 0) {
        return res.status(400).json({ error: "amount and maxMembers must be positive." });
    }

    const t1 = parseFloat(tier1Penalty ?? 0);
    const t2 = parseFloat(tier2Penalty ?? 0);
    const t3 = parseFloat(tier3Penalty ?? 0);

    if (t1 < 0 || t2 < 0 || t3 < 0) {
        return res.status(400).json({ error: "Penalty tiers must be non-negative." });
    }
    if (!(t1 <= t2 && t2 <= t3)) {
        return res.status(400).json({ error: "Penalty tiers must be in ascending order: Tier 1 ≤ Tier 2 ≤ Tier 3." });
    }

    try {
        const plan = await prisma.equbPlan.create({
            data: {
                category,
                amount: parseFloat(amount),
                // Keep legacy penalty as the max (tier3) for backward compat reads
                penalty: t3 > 0 ? t3 : parseFloat(penalty ?? 0),
                tier1Penalty: t1,
                tier2Penalty: t2,
                tier3Penalty: t3,
                maxMembers: parseInt(maxMembers, 10),
                description: description || null,
            }
        });
        res.status(201).json({ message: "Equb Plan created successfully!", plan });
    } catch (error) {
        console.error("createPlan error:", error);
        res.status(500).json({ error: "Failed to create plan: " + error.message });
    }
};

// ── 4. Get all Equb Plans ─────────────────────────────────────────────────────
const getAllPlans = async (req, res) => {
    try {
        const plans = await prisma.equbPlan.findMany({ orderBy: { createdAt: 'desc' } });
        res.json(plans);
    } catch (error) {
        console.error("getAllPlans error:", error);
        res.status(500).json({ error: "Failed to fetch plans: " + error.message });
    }
};

// ── 5. Update an Equb Plan ────────────────────────────────────────────────────
const updatePlan = async (req, res) => {
    const { id } = req.params;
    const {
        category, amount, penalty, maxMembers, description,
        tier1Penalty, tier2Penalty, tier3Penalty,
    } = req.body;

    const validCategories = ['DAILY', 'WEEKLY', 'MONTHLY'];
    if (category && !validCategories.includes(category)) {
        return res.status(400).json({ error: "category must be DAILY, WEEKLY, or MONTHLY." });
    }
    if (amount !== undefined && Number(amount) <= 0) return res.status(400).json({ error: "amount must be positive." });
    if (maxMembers !== undefined && Number(maxMembers) <= 0) return res.status(400).json({ error: "maxMembers must be positive." });

    const t1 = tier1Penalty !== undefined ? parseFloat(tier1Penalty) : undefined;
    const t2 = tier2Penalty !== undefined ? parseFloat(tier2Penalty) : undefined;
    const t3 = tier3Penalty !== undefined ? parseFloat(tier3Penalty) : undefined;

    if ([t1, t2, t3].some(v => v !== undefined && v < 0)) {
        return res.status(400).json({ error: "Penalty tiers must be non-negative." });
    }
    if (t1 !== undefined && t2 !== undefined && t3 !== undefined) {
        if (!(t1 <= t2 && t2 <= t3)) {
            return res.status(400).json({ error: "Penalty tiers must be in ascending order: Tier 1 ≤ Tier 2 ≤ Tier 3." });
        }
    }

    try {
        const updated = await prisma.equbPlan.update({
            where: { id },
            data: {
                ...(category !== undefined && { category }),
                ...(amount !== undefined && { amount: parseFloat(amount) }),
                ...(maxMembers !== undefined && { maxMembers: parseInt(maxMembers, 10) }),
                ...(description !== undefined && { description: description || null }),
                ...(t1 !== undefined && { tier1Penalty: t1 }),
                ...(t2 !== undefined && { tier2Penalty: t2 }),
                ...(t3 !== undefined && { tier3Penalty: t3 }),
                // Keep legacy penalty in sync with tier3 if tier3 is being updated
                ...(t3 !== undefined && { penalty: t3 }),
                // If only legacy penalty sent (old client), honour it
                ...(penalty !== undefined && t3 === undefined && { penalty: parseFloat(penalty) }),
            }
        });
        res.json({ message: "Plan updated successfully!", plan: updated });
    } catch (error) {
        console.error("updatePlan error:", error);
        if (error.code === 'P2025') return res.status(404).json({ error: "Plan not found." });
        res.status(500).json({ error: "Failed to update plan: " + error.message });
    }
};

// ── 6. Delete an Equb Plan ────────────────────────────────────────────────────
const deletePlan = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.equbPlan.delete({ where: { id } });
        res.json({ message: "Plan deleted successfully!" });
    } catch (error) {
        console.error("deletePlan error:", error);
        if (error.code === 'P2025') return res.status(404).json({ error: "Plan not found." });
        res.status(500).json({ error: "Failed to delete plan: " + error.message });
    }
};

// ── 7. Get all system users ───────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                email: true,
                role: true,
                isApproved: true,
                isActive: true,
                kycStatus: true,
                createdAt: true,
            }
        });
        res.json(users);
    } catch (error) {
        console.error("getAllUsers error:", error);
        res.status(500).json({ error: "Failed to fetch users: " + error.message });
    }
};

// ── 8. Toggle a user's isActive status (block / unblock) ─────────────────────
const toggleUserStatus = async (req, res) => {
    const { id } = req.params;
    try {
        const current = await prisma.user.findUnique({
            where: { id },
            select: { isActive: true, role: true }
        });

        if (!current) return res.status(404).json({ error: "User not found." });

        if (current.role === 'ADMIN' && current.isActive) {
            const adminCount = await prisma.user.count({ where: { role: 'ADMIN', isActive: true } });
            if (adminCount <= 1) {
                return res.status(400).json({ error: "Cannot deactivate the only active admin account." });
            }
        }

        const updated = await prisma.user.update({
            where: { id },
            data: { isActive: !current.isActive },
            select: {
                id: true, fullName: true, phoneNumber: true, email: true,
                role: true, isApproved: true, isActive: true, kycStatus: true, createdAt: true,
            }
        });

        res.json({
            message: `User ${updated.isActive ? 'activated' : 'blocked'} successfully.`,
            user: updated,
        });
    } catch (error) {
        console.error("toggleUserStatus error:", error);
        if (error.code === 'P2025') return res.status(404).json({ error: "User not found." });
        res.status(500).json({ error: "Failed to update user status: " + error.message });
    }
};

// ── 9. Update user role (e.g., MEMBER -> ORGANIZER) ─────────────────────────
const updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['MEMBER', 'ORGANIZER', 'ADMIN'];
    if (!role || !validRoles.includes(role)) {
        return res.status(400).json({ error: "Role must be 'MEMBER', 'ORGANIZER', or 'ADMIN'." });
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                role,
                ...(role === 'ORGANIZER' && { isApproved: true })
            },
            select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                email: true,
                role: true,
                isApproved: true,
                isActive: true,
                kycStatus: true,
                createdAt: true,
            }
        });

        res.json({
            message: `User role updated to ${role} successfully.`,
            user: updatedUser,
        });
    } catch (error) {
        console.error("updateUserRole error:", error);
        if (error.code === 'P2025') return res.status(404).json({ error: "User not found." });
        res.status(500).json({ error: "Failed to update user role: " + error.message });
    }
};

// ── 10. System Settings ───────────────────────────────────────────────────────
const SETTING_DEFAULTS = {
    sms_mode: 'simulation',
    service_fee_pct: '2',
    maintenance_mode: 'false',
    chapa_mode: 'sandbox',   // 'sandbox' | 'live'
    kyc_mode: 'automated', // 'automated' | 'manual'
};

const getSettings = async (req, res) => {
    try {
        await Promise.all(
            Object.entries(SETTING_DEFAULTS).map(([key, value]) =>
                prisma.systemSetting.upsert({ where: { key }, update: {}, create: { key, value } })
            )
        );
        const rows = await prisma.systemSetting.findMany({ orderBy: { key: 'asc' } });
        res.json(Object.fromEntries(rows.map(r => [r.key, r.value])));
    } catch (error) {
        console.error("getSettings error:", error);
        res.status(500).json({ error: "Failed to fetch settings: " + error.message });
    }
};

const updateSettings = async (req, res) => {
    const updates = req.body;

    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
        return res.status(400).json({ error: "Request body must be a key-value object." });
    }

    const allowedKeys = Object.keys(SETTING_DEFAULTS);
    const invalidKeys = Object.keys(updates).filter(k => !allowedKeys.includes(k));
    if (invalidKeys.length > 0) {
        return res.status(400).json({ error: `Unknown setting keys: ${invalidKeys.join(', ')}` });
    }

    if (updates.sms_mode && !['simulation', 'live'].includes(updates.sms_mode)) {
        return res.status(400).json({ error: "sms_mode must be 'simulation' or 'live'." });
    }
    if (updates.maintenance_mode && !['true', 'false'].includes(updates.maintenance_mode)) {
        return res.status(400).json({ error: "maintenance_mode must be 'true' or 'false'." });
    }
    if (updates.service_fee_pct !== undefined) {
        const fee = parseFloat(updates.service_fee_pct);
        if (isNaN(fee) || fee < 0 || fee > 100) {
            return res.status(400).json({ error: "service_fee_pct must be a number between 0 and 100." });
        }
    }
    if (updates.chapa_mode && !['sandbox', 'live'].includes(updates.chapa_mode)) {
        return res.status(400).json({ error: "chapa_mode must be 'sandbox' or 'live'." });
    }
    if (updates.kyc_mode && !['automated', 'manual'].includes(updates.kyc_mode)) {
        return res.status(400).json({ error: "kyc_mode must be 'automated' or 'manual'." });
    }

    try {
        await Promise.all(
            Object.entries(updates).map(([key, value]) =>
                prisma.systemSetting.upsert({
                    where: { key },
                    update: { value: String(value) },
                    create: { key, value: String(value) }
                })
            )
        );
        const rows = await prisma.systemSetting.findMany({ orderBy: { key: 'asc' } });
        res.json({ message: "Settings updated successfully.", settings: Object.fromEntries(rows.map(r => [r.key, r.value])) });
    } catch (error) {
        console.error("updateSettings error:", error);
        res.status(500).json({ error: "Failed to update settings: " + error.message });
    }
};

// ── 11. KYC — Get requests by status ─────────────────────────────────────────
const getKYCRequests = async (req, res) => {
    const { status } = req.query;
    const validStatuses = ['PENDING', 'VERIFIED', 'REJECTED'];
    const filterStatus = validStatuses.includes(status) ? status : 'PENDING';

    try {
        const users = await prisma.user.findMany({
            where: {
                faydaId: { not: null },
                kycStatus: filterStatus,
            },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                email: true,
                role: true,
                faydaId: true,
                faydaImageUrl: true,
                kycStatus: true,
                kycNote: true,
                createdAt: true,
            }
        });
        res.json({ status: filterStatus, users });
    } catch (error) {
        console.error("getKYCRequests error:", error);
        res.status(500).json({ error: "Failed to fetch KYC requests: " + error.message });
    }
};

// ── 12. KYC — Approve or reject ───────────────────────────────────────────────
const updateKYCStatus = async (req, res) => {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses = ['VERIFIED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "status must be 'VERIFIED' or 'REJECTED'." });
    }

    if (status === 'REJECTED' && (!note || note.trim() === '')) {
        return res.status(400).json({ error: "A rejection reason (note) is required when rejecting KYC." });
    }

    try {
        const updated = await prisma.user.update({
            where: { id },
            data: {
                kycStatus: status,
                kycNote: status === 'REJECTED' ? note.trim() : null,
            },
            select: { id: true, fullName: true, kycStatus: true, kycNote: true }
        });
        res.json({
            message: `KYC ${status === 'VERIFIED' ? 'approved' : 'rejected'} for ${updated.fullName}.`,
            user: updated,
        });
    } catch (error) {
        console.error("updateKYCStatus error:", error);
        if (error.code === 'P2025') return res.status(404).json({ error: "User not found." });
        res.status(500).json({ error: "Failed to update KYC status: " + error.message });
    }
};

// ── 14. Dedicated Analytics Endpoint ─────────────────────────────────────────
// Kept separate from getAdminStats so a failure in one cannot affect the other.
async function getAnalytics(req, res) {
    try {
        const feeSetting = await prisma.systemSetting.findUnique({ where: { key: 'service_fee_pct' } });
        const feePct = parseFloat(feeSetting?.value ?? '2');

        // ── Run all queries in parallel ──────────────────────────────────────
        const [
            approvedPayments,
            roleCounts,
            activeGroupsWithPlans,
        ] = await Promise.all([
            // All approved payments with date + category
            prisma.groupPayment.findMany({
                where: { status: 'APPROVED' },
                select: {
                    amount: true,
                    penaltyAmount: true,
                    submittedAt: true,
                    group: { select: { plan: { select: { category: true } } } },
                },
                orderBy: { submittedAt: 'asc' },
            }),

            // User role breakdown
            prisma.user.groupBy({
                by: ['role'],
                _count: { _all: true },
            }),

            // Active groups with plan category for counting
            prisma.equbGroup.findMany({
                where: { status: { in: ['OPEN', 'ACTIVE'] } },
                select: { plan: { select: { category: true } } },
            }),
        ]);

        // ── Cash Flow — group by month (last 6 months) ───────────────────────
        const now = new Date();
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                label: d.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
            });
        }

        const inflowMap = {};
        approvedPayments.forEach(p => {
            const d = new Date(p.submittedAt);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            inflowMap[key] = (inflowMap[key] || 0) + parseFloat(p.amount ?? 0);
        });

        const totalInflow = Object.values(inflowMap).reduce((s, v) => s + v, 0);
        const totalRevenue = parseFloat(((totalInflow * feePct) / 100).toFixed(2));
        const totalDisb = parseFloat((totalInflow - totalRevenue).toFixed(2));

        const cashFlow = months.map(({ key, label }) => {
            const inflow = parseFloat((inflowMap[key] || 0).toFixed(2));
            const ratio = totalInflow > 0 ? inflow / totalInflow : 0;
            const disbursed = parseFloat((totalDisb * ratio).toFixed(2));
            const revenue = parseFloat((totalRevenue * ratio).toFixed(2));
            return { name: label, inflow, disbursed, revenue };
        });

        // ── User Composition ─────────────────────────────────────────────────
        const roleMap = { MEMBER: 0, ORGANIZER: 0, ADMIN: 0 };
        roleCounts.forEach(r => { roleMap[r.role] = r._count._all; });

        const userComposition = [
            { name: 'Members', value: roleMap.MEMBER, color: '#3b82f6' },
            { name: 'Organizers', value: roleMap.ORGANIZER, color: '#10b981' },
            { name: 'Admins', value: roleMap.ADMIN, color: '#8b5cf6' },
        ];

        // ── Category Performance ─────────────────────────────────────────────
        const catVolume = { DAILY: 0, WEEKLY: 0, MONTHLY: 0 };
        approvedPayments.forEach(p => {
            const cat = p.group?.plan?.category;
            if (cat && catVolume[cat] !== undefined) {
                catVolume[cat] += parseFloat(p.amount ?? 0);
            }
        });

        const catGroups = { DAILY: 0, WEEKLY: 0, MONTHLY: 0 };
        activeGroupsWithPlans.forEach(g => {
            const cat = g.plan?.category;
            if (cat && catGroups[cat] !== undefined) catGroups[cat]++;
        });

        const totalCatVol = Object.values(catVolume).reduce((s, v) => s + v, 0) || 1;
        const categoryPerformance = ['DAILY', 'WEEKLY', 'MONTHLY'].map(cat => ({
            category: cat.charAt(0) + cat.slice(1).toLowerCase(),
            volume: parseFloat(catVolume[cat].toFixed(2)),
            pct: parseFloat(((catVolume[cat] / totalCatVol) * 100).toFixed(1)),
            groups: catGroups[cat],
        }));

        return res.json({
            success: true,
            cashFlow,
            userComposition,
            categoryPerformance,
        });
    } catch (error) {
        console.error('getAnalytics error:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch analytics.' });
    }
}

// ── Exports ───────────────────────────────────────────────────────────────────
module.exports = {
    getPendingOrganizers,
    approveOrganizer,
    createPlan,
    getAllPlans,
    updatePlan,
    deletePlan,
    getAllUsers,
    toggleUserStatus,
    updateUserRole,
    getSettings,
    updateSettings,
    getKYCRequests,
    updateKYCStatus,
    getAdminStats,
    getAnalytics,
};

// ── 13. Admin Dashboard Stats (dynamic, replaces hardcoded values) ────────────
// ── 13. Admin Dashboard Stats (dynamic fintech accounting) ─────────────────
async function getAdminStats(req, res) {
    try {
        const feeSetting = await prisma.systemSetting.findUnique({ where: { key: 'service_fee_pct' } });
        const feePct = parseFloat(feeSetting?.value ?? '2');

        const [
            totalUsers,
            pendingOrganizers,
            activeGroups,
            userRoleCounts,
            activeUserCount,
            allPayments,
            categoryStats,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { role: 'ORGANIZER', isApproved: false } }),
            prisma.equbGroup.count({ where: { status: { in: ['OPEN', 'ACTIVE'] } } }),
            // User demographics: count by role
            prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
            // Active users
            prisma.user.count({ where: { isActive: true } }),
            // All approved payments with date for monthly grouping
            prisma.groupPayment.findMany({
                where: { status: 'APPROVED' },
                select: { amount: true, submittedAt: true },
                orderBy: { submittedAt: 'asc' },
            }),
            // Category performance: approved payment volume per plan category
            prisma.groupPayment.findMany({
                where: { status: 'APPROVED' },
                select: { amount: true, group: { select: { plan: { select: { category: true } } } } },
            }),
        ]);

        // ── Core KPIs ─────────────────────────────────────────────────────────
        //
        // ACCOUNTING IDENTITY:
        //   totalVolume = totalDisbursed + platformRevenue + totalPenalties + escrowBalance
        //
        //   totalVolume      = all approved payment amounts (base + penalties)
        //   totalPenalties   = penalty portion routed to organizers
        //   releasedBase     = base contributions for RELEASED draw rounds
        //   unreleasedBase   = base contributions for draw rounds NOT yet released
        //   platformRevenue  = feePct% of releasedBase (fee on physically sent pots)
        //   totalDisbursed   = releasedBase - platformRevenue (net to winners)
        //   escrowBalance    = unreleasedBase (winner selected, pot held pending release)
        //                      + payments for rounds with no draw yet
        //   CHECK: releasedBase + unreleasedBase + noDrawBase + penalties = totalVolume

        // 1. Total inflow
        const paymentAggregate = await prisma.groupPayment.aggregate({
            where: { status: 'APPROVED' },
            _sum: { amount: true, penaltyAmount: true },
        });
        const totalVolume = parseFloat(paymentAggregate._sum.amount ?? 0);
        const totalPenaltiesRouted = parseFloat(paymentAggregate._sum.penaltyAmount ?? 0);

        // 2. All draw results with release status
        const allDrawResults = await prisma.drawResult.findMany({
            select: { groupId: true, roundNumber: true, cycleNumber: true, isFundsReleased: true },
        });

        // 3. Bucket payments into released vs unreleased draw rounds
        let releasedBase = 0;
        let unreleasedBase = 0;

        if (allDrawResults.length > 0) {
            const paymentRows = await Promise.all(
                allDrawResults.map(d =>
                    prisma.groupPayment.findMany({
                        where: {
                            groupId: d.groupId,
                            roundNumber: d.roundNumber,
                            cycleNumber: d.cycleNumber,
                            status: 'APPROVED',
                        },
                        select: { amount: true, penaltyAmount: true },
                    }).then(rows => rows.map(p => ({ ...p, released: d.isFundsReleased })))
                )
            );
            paymentRows.flat().forEach(p => {
                const base = parseFloat(p.amount) - parseFloat(p.penaltyAmount || 0);
                if (p.released) releasedBase += base;
                else unreleasedBase += base;
            });
            releasedBase = parseFloat(releasedBase.toFixed(2));
            unreleasedBase = parseFloat(unreleasedBase.toFixed(2));
        }

        // 4. Platform fee + net disbursed (only on physically released pots)
        const platformRevenue = parseFloat(((releasedBase * feePct) / 100).toFixed(2));
        const totalDisbursed = parseFloat((releasedBase - platformRevenue).toFixed(2));

        // 5. Escrow = unreleased committed pots + any payments for rounds not yet drawn
        const allDrawBase = releasedBase + unreleasedBase;
        const noDrawPayments = parseFloat(
            Math.max(0, totalVolume - allDrawBase - totalPenaltiesRouted).toFixed(2)
        );
        const escrowBalance = parseFloat((unreleasedBase + noDrawPayments).toFixed(2));

        // ── User demographics ─────────────────────────────────────────────────
        const fmt = (n) => {
            if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M ETB';
            if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K ETB';
            return n.toLocaleString() + ' ETB';
        };
        const roleMap = { MEMBER: 0, ORGANIZER: 0, ADMIN: 0 };
        userRoleCounts.forEach(r => { roleMap[r.role] = r._count._all; });
        const userDemographics = [
            { role: 'Member', count: roleMap.MEMBER, color: '#3b82f6' },
            { role: 'Organizer', count: roleMap.ORGANIZER, color: '#10b981' },
            { role: 'Admin', count: roleMap.ADMIN, color: '#8b5cf6' },
        ];

        // ── Monthly cash-flow (last 6 months) ────────────────────────────────
        const now = new Date();
        const monthLabels = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            monthLabels.push({
                key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                label: d.toLocaleString('en-US', { month: 'short', year: '2-digit' }),
            });
        }
        const inflowByMonth = {};
        allPayments.forEach(p => {
            const d = new Date(p.submittedAt);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            inflowByMonth[key] = (inflowByMonth[key] || 0) + parseFloat(p.amount ?? 0);
        });
        const totalInflowForRatio = Object.values(inflowByMonth).reduce((s, v) => s + v, 0) || 1;
        const cashFlowData = monthLabels.map(({ key, label }) => {
            const inflow = parseFloat((inflowByMonth[key] || 0).toFixed(2));
            const ratio = inflow / totalInflowForRatio;
            const disbursed = parseFloat((totalDisbursed * ratio).toFixed(2));
            const revenue = parseFloat((platformRevenue * ratio).toFixed(2));
            return { month: label, inflow, disbursed, revenue };
        });

        // ── Category performance ──────────────────────────────────────────────
        const catMap = { DAILY: 0, WEEKLY: 0, MONTHLY: 0 };
        categoryStats.forEach(p => {
            const cat = p.group?.plan?.category;
            if (cat && catMap[cat] !== undefined) catMap[cat] += parseFloat(p.amount ?? 0);
        });
        const catGroupCounts = await prisma.equbGroup.groupBy({
            by: ['planId'], where: { status: { in: ['OPEN', 'ACTIVE'] } }, _count: { _all: true },
        });
        const planIds = catGroupCounts.map(c => c.planId);
        const plans = planIds.length
            ? await prisma.equbPlan.findMany({ where: { id: { in: planIds } }, select: { id: true, category: true } })
            : [];
        const planCatMap = Object.fromEntries(plans.map(p => [p.id, p.category]));
        const groupCountByCat = { DAILY: 0, WEEKLY: 0, MONTHLY: 0 };
        catGroupCounts.forEach(c => {
            const cat = planCatMap[c.planId];
            if (cat && groupCountByCat[cat] !== undefined) groupCountByCat[cat] += c._count._all;
        });
        const totalCatVol = Object.values(catMap).reduce((s, v) => s + v, 0) || 1;
        const categoryPerformance = ['DAILY', 'WEEKLY', 'MONTHLY'].map(cat => ({
            category: cat.charAt(0) + cat.slice(1).toLowerCase(),
            volume: parseFloat(catMap[cat].toFixed(2)),
            pct: parseFloat(((catMap[cat] / totalCatVol) * 100).toFixed(1)),
            groups: groupCountByCat[cat],
        }));

        res.json({
            totalUsers, pendingOrganizers, activeGroups,
            totalVolume, totalDisbursed, platformRevenue, escrowBalance, feePct,
            formattedVolume: fmt(totalVolume),
            formattedDisbursed: fmt(totalDisbursed),
            formattedPlatformRevenue: fmt(platformRevenue),
            formattedEscrow: fmt(escrowBalance),
            // Analytics
            activeUserCount,
            pendingUserCount: totalUsers - activeUserCount,
            userDemographics,
            cashFlowData,
            categoryPerformance,
        });
    } catch (error) {
        console.error('getAdminStats error:', error);
        res.status(500).json({ error: 'Failed to fetch admin statistics.' });
    }
}
