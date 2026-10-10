// backend/src/routes/organizerRoutes.js
const express = require('express');
const router = express.Router();
const organizerController = require('../controllers/organizerController');

/**
 * 1. GROUP MANAGEMENT ENDPOINTS
 */

// Create a new Equb group
router.post('/groups', organizerController.createGroup);

// Retrieve all groups managed by a specific organizer
router.get('/groups/:organizerId', organizerController.getOrganizerGroups);

// Update details for an existing group
router.patch('/groups/:groupId', organizerController.updateGroup);

// Delete an existing group
router.delete('/groups/:groupId', organizerController.deleteGroup);

// Start a new round/cycle for a designated group
router.post('/groups/:groupId/start-new-cycle', organizerController.startNewCycle);

/**
 * 2. MEMBERSHIP & REQUEST MANAGEMENT
 */

// Retrieve pending membership request applications for an organizer
router.get('/requests/:organizerId', organizerController.getPendingRequests);

// Approve or reject a member's group join request
router.patch('/requests/:membershipId/status', organizerController.updateMembershipStatus);

/**
 * 3. REPORTING & ANALYTICS
 */

// Fetch comprehensive financial and member participation reports for a group
router.get('/groups/:groupId/report', organizerController.getGroupReport);

module.exports = router;