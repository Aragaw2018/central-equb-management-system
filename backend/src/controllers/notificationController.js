'use strict';

const prisma = require('../config/db');

/**
 * GET /api/notifications/:userId
 * Returns the 30 most recent notifications for a user, newest first.
 */
const getNotifications = async (req, res) => {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'userId is required.' });

    try {
        const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 30,
        });
        res.json(notifications);
    } catch (err) {
        console.error('[Notification] getNotifications error:', err.message);
        res.status(500).json({ error: 'Failed to fetch notifications.' });
    }
};

/**
 * PATCH /api/notifications/:userId/read-all
 * Marks all notifications for a user as read.
 */
const markAllRead = async (req, res) => {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'userId is required.' });

    try {
        await prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        res.json({ success: true });
    } catch (err) {
        console.error('[Notification] markAllRead error:', err.message);
        res.status(500).json({ error: 'Failed to update notifications.' });
    }
};

/**
 * PATCH /api/notifications/read/:notificationId
 * Marks a single notification as read.
 */
const markOneRead = async (req, res) => {
    const { notificationId } = req.params;
    try {
        await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });
        res.json({ success: true });
    } catch (err) {
        console.error('[Notification] markOneRead error:', err.message);
        res.status(500).json({ error: 'Failed to update notification.' });
    }
};

/**
 * Helper (non-HTTP): create a notification row + push via Socket.io.
 * Imported directly by paymentController — not exposed as a route.
 *
 * @param {Object} opts
 * @param {string}  opts.userId
 * @param {string}  opts.type      — PAYMENT_CONFIRMED | SUPPLEMENTAL_PAYOUT | PENALTY_RECEIVED | GENERAL
 * @param {string}  opts.title
 * @param {string}  opts.message
 * @param {Object=} opts.metadata  — arbitrary extra data stored as JSON
 * @param {Object=} opts.io        — Socket.io server instance (optional; omit in tests)
 * @returns {Promise<Object>}  the created Notification row
 */
const createNotification = async ({ userId, type, title, message, metadata = null, io = null }) => {
    const notification = await prisma.notification.create({
        data: { userId, type, title, message, metadata, isRead: false },
    });

    // Push to the user's personal socket room so the bell updates instantly
    if (io) {
        io.to(`user:${userId}`).emit('newNotification', notification);
    }

    console.log(
        `[Notification] Created | type=${type} | user=${userId} | "${title}"`
    );

    return notification;
};

/**
 * DELETE /api/notifications/:userId/all
 * Permanently deletes ALL notifications for a user (clear-all).
 */
const deleteAllForUser = async (req, res) => {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'userId is required.' });
    try {
        await prisma.notification.deleteMany({ where: { userId } });
        res.json({ success: true });
    } catch (err) {
        console.error('[Notification] deleteAllForUser error:', err.message);
        res.status(500).json({ error: 'Failed to delete notifications.' });
    }
};

/**
 * DELETE /api/notifications/one/:notificationId
 * Permanently deletes a single notification by id.
 */
const deleteOne = async (req, res) => {
    const { notificationId } = req.params;
    try {
        await prisma.notification.delete({ where: { id: notificationId } });
        res.json({ success: true });
    } catch (err) {
        console.error('[Notification] deleteOne error:', err.message);
        res.status(500).json({ error: 'Failed to delete notification.' });
    }
};

module.exports = { getNotifications, markAllRead, markOneRead, createNotification, deleteAllForUser, deleteOne };