'use strict';

const express = require('express');
const router = express.Router();
const {
    getNotifications,
    markAllRead,
    markOneRead,
    deleteAllForUser,
    deleteOne,
} = require('../controllers/notificationController');

// GET  /api/notifications/:userId          — fetch recent notifications
router.get('/:userId', getNotifications);

// PATCH /api/notifications/:userId/read-all — mark all as read
router.patch('/:userId/read-all', markAllRead);

// PATCH /api/notifications/read/:notificationId — mark one as read
router.patch('/read/:notificationId', markOneRead);

// DELETE /api/notifications/:userId/all    — clear all (dismiss entire feed)
router.delete('/:userId/all', deleteAllForUser);

// DELETE /api/notifications/one/:notificationId — dismiss a single notification
router.delete('/one/:notificationId', deleteOne);

module.exports = router;
