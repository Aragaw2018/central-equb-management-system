// src/routes/guarantorRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../config/guarantorUpload'); // Multer config for file uploads
const {
    requestGuarantor,
    respondToGuarantor,
    getPendingRequests,
    getMemberWins,
    searchEligibleGuarantors,
    verifyDocuments,
    releaseFunds,
    getPayoutsForOrganizer,
} = require('../controllers/guarantorController');

/**
 * 1. Nominate Guarantor
 * Post request for a winner to send a guarantee nomination to an eligible member.
 */
router.post('/request', requestGuarantor);

/**
 * 2. Search Eligible Guarantors
 * Fetch members eligible to serve as guarantors (e.g., members who haven't won a pot yet).
 */
router.get('/search', searchEligibleGuarantors);

/**
 * 3. Guarantor Response (Accept/Reject with Required Security Documents)
 * Handles uploading required collateral files: Bank Check, Land Certificate/Lease, Fayda/ID Scan.
 */
router.patch(
    '/:guarantorId/respond',
    upload.fields([
        { name: 'checkImage', maxCount: 1 }, // Bank Check Copy
        { name: 'landDoc', maxCount: 1 },    // Land Title Certificate / Lease
        { name: 'faydaScan', maxCount: 1 }   // National Fayda ID / Facial Scan
    ]),
    respondToGuarantor
);

/**
 * 4. Verify Guarantor Documents
 * Organizer endpoint to review and approve or reject uploaded guarantor security documentation.
 */
router.patch('/:guarantorId/verify-docs', verifyDocuments);

/**
 * 5. Get Pending Requests
 * Fetch pending incoming guarantee requests for a specific user dashboard.
 */
router.get('/pending/:userId', getPendingRequests);

/**
 * 6. Get Member Draw Wins
 * Retrieve the list of all successful draw wins for a given member.
 */
router.get('/wins/:userId', getMemberWins);

/**
 * 7. Release Winner Funds
 * Organizer endpoint to authorize and release pot payout once guarantor validation passes.
 */
router.patch('/release/:drawResultId', releaseFunds);

/**
 * 8. Organizer Payout Overview
 * Summary analytics and report route for organizers to track active and past payouts.
 */
router.get('/payouts/:organizerId', getPayoutsForOrganizer);

module.exports = router;