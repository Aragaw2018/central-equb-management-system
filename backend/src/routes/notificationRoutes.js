'use strict';

const express    = require('express');
const router     = express.Router();
const {
    getNotifications,
    markAllRead,
    markOneRead,
} = require('../controllers/notificationController');

// GET  /api/notifications/:userId          — fetch recent notifications
router.get('/:userId', getNotifications);

// PATCH /api/notifications/:userId/read-all — mark all as read
router.patch('/:userId/read-all', markAllRead);

// PATCH /api/notifications/read/:notificationId — mark one as read
router.patch('/read/:notificationId', markOneRead);

module.exports = router;
