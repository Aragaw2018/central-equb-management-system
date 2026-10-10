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
    const { category, amount, penalty, maxMembers, description } = req.body;

    if (!category || !amount || !penalty || !maxMembers) {
        return res.status(400).json({ error: "category, amount, penalty, and maxMembers are required." });
    }

    const validCategories = ['DAILY', 'WEEKLY', 'MONTHLY'];
    if (!validCategories.includes(category)) {
        return res.status(400).json({ error: "category must be DAILY, WEEKLY, or MONTHLY." });
    }

    if (Number(amount) <= 0 || Number(penalty) < 0 || Number(maxMembers) <= 0) {
        return res.status(400).json({ error: "amount and maxMembers must be positive; penalty must be non-negative." });
    }

    try {
        const plan = await prisma.equbPlan.create({
            data: {
                category,
                amount: parseFloat(amount),
                penalty: parseFloat(penalty),
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
    const { category, amount, penalty, maxMembers, description } = req.body;

    const validCategories = ['DAILY', 'WEEKLY', 'MONTHLY'];
    if (category && !validCategories.includes(category)) {
        return res.status(400).json({ error: "category must be DAILY, WEEKLY, or MONTHLY." });
    }
    if (amount !== undefined && Number(amount) <= 0) return res.status(400).json({ error: "amount must be positive." });
    if (penalty !== undefined && Number(penalty) < 0) return res.status(400).json({ error: "penalty must be non-negative." });
    if (maxMembers !== undefined && Number(maxMembers) <= 0) return res.status(400).json({ error: "maxMembers must be positive." });

    try {
        const updated = await prisma.equbPlan.update({
            where: { id },
            data: {
                ...(category !== undefined && { category }),
                ...(amount !== undefined && { amount: parseFloat(amount) }),
                ...(penalty !== undefined && { penalty: parseFloat(penalty) }),
                ...(maxMembers !== undefined && { maxMembers: parseInt(maxMembers, 10) }),
                ...(description !== undefined && { description: description || null }),
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
};