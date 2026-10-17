'use strict';

/**
 * checkMaintenance middleware
 *
 * Reads maintenance_mode from SystemSetting on every request.
 * If the value is 'true' AND the requesting user is not an ADMIN,
 * the request is blocked immediately with HTTP 503.
 *
 * Pass-through rules (never blocked):
 *   - /api/users/login  — so admins can still sign in
 *   - /api/users/register, /api/users/send-otp, etc. (public user routes)
 *   - /api/admin/*      — admin API remains accessible
 *
 * The user role is read from the `x-user-role` header which our frontend
 * axiosInstance attaches automatically from localStorage when present.
 * (No auth middleware is required — this is a best-effort kill-switch.)
 */

const prisma = require('../config/db');

// Paths that are always allowed regardless of maintenance mode
const ALWAYS_ALLOWED_PREFIXES = [
    '/api/users',    // login, register, password reset, OTP — public
    '/api/admin',    // admin panel always accessible
];

const checkMaintenance = async (req, res, next) => {
    // Skip check for always-allowed routes
    const path = req.path;
    if (ALWAYS_ALLOWED_PREFIXES.some(prefix => path.startsWith(prefix))) {
        return next();
    }

    try {
        const setting = await prisma.systemSetting.findUnique({
            where: { key: 'maintenance_mode' },
        });

        const isMaintenanceOn = setting?.value === 'true';

        if (!isMaintenanceOn) {
            return next(); // system is operational
        }

        // Maintenance is ON — check if the caller is an admin
        // Role is forwarded by the frontend in x-user-role header
        const userRole = req.headers['x-user-role'];

        if (userRole === 'ADMIN') {
            return next(); // admins bypass maintenance mode
        }

        // Block everyone else
        return res.status(503).json({
            error: 'System Under Maintenance: The platform is currently paused for scheduled upgrades. Please try again later.',
            code:  'MAINTENANCE_MODE',
        });

    } catch (err) {
        // If DB read fails, allow the request through (fail-open)
        console.error('[Maintenance] Setting read failed (fail-open):', err.message);
        return next();
    }
};

module.exports = checkMaintenance;
