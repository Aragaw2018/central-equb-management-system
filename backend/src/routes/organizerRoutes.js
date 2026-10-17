// backend/src/routes/organizerRoutes.js
const express = require('express');
const router = express.Router();
const organizerController = require('../controllers/organizerController');

/**
 * 1. GROUP MANAGEMENT ENDPOINTS
 */

// Create a new Equb group
router.post('/groups', organizerController.createGroup);

// ── SPECIFIC sub-routes MUST come before /:organizerId to avoid Express
//    matching the path parameter greedily. ────────────────────────────────────

// Fetch all members of a group with payment + win status (Members modal)
// Registered at TWO paths — the sub-path AND a top-level path to guarantee
// no route-collision issues regardless of Express evaluation order.
router.get('/groups/:groupId/members', organizerController.getGroupMembers);
router.get('/group-members/:groupId', organizerController.getGroupMembers);

// Send real-time payment reminders to unpaid members (persists + socket push)
router.post('/groups/:groupId/send-reminders', organizerController.sendPaymentReminders);

// Fetch comprehensive financial and member participation reports for a group
router.get('/groups/:groupId/report', organizerController.getGroupReport);

// Start a new round/cycle for a designated group
router.post('/groups/:groupId/start-new-cycle', organizerController.startNewCycle);

// Retrieve all groups managed by a specific organizer (generic param — must be LAST)
router.get('/groups/:organizerId', organizerController.getOrganizerGroups);

// Update details for an existing group
router.patch('/groups/:groupId', organizerController.updateGroup);

// Delete an existing group
router.delete('/groups/:groupId', organizerController.deleteGroup);

/**
 * 2. MEMBERSHIP & REQUEST MANAGEMENT
 */

// Retrieve pending membership request applications for an organizer
router.get('/requests/:organizerId', organizerController.getPendingRequests);

// Approve or reject a member's group join request
router.patch('/requests/:membershipId/status', organizerController.updateMembershipStatus);

module.exports = router;
