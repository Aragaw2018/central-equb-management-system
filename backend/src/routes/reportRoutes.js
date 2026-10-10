const express = require('express');
const router = express.Router();
const { getMemberFinancials, getOrganizerAnalytics } = require('../controllers/reportController');

router.get('/member/:userId', getMemberFinancials);
router.get('/organizer/:organizerId', getOrganizerAnalytics);

module.exports = router;