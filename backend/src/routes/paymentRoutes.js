// backend/src/routes/paymentRoutes.js
'use strict';

const express = require('express');
const router = express.Router();

const {
    initiateChapaPayment,
    verifyChapaPayment,
    getPendingPayments,
    reviewPayment,
    getMemberPayments,
    getPaymentRequirements,
} = require('../controllers/paymentController');

// ─────────────────────────────────────────────────────────────────────────────
// CHAPA PAYMENT GATEWAY ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/payments/chapa/initialize
 *
 * Body: { membershipId, groupId, amount }
 * Returns: { checkoutUrl, tx_ref }
 *
 * Step 1 of Chapa flow — creates DB record and returns hosted checkout URL.
 * The client redirects the user to checkoutUrl to complete payment.
 */
router.post('/chapa/initialize', initiateChapaPayment);

/**
 * GET /api/payments/requirements/:membershipId
 * Returns targetRound, isOverdue, penaltyAmount, totalAmount for a membership.
 */
router.get('/requirements/:membershipId', getPaymentRequirements);

/**
 * GET /api/payments/chapa/verify/:tx_ref
 *
 * Params: tx_ref
 * Returns: { success, message, payment }
 *
 * Step 2 of Chapa flow — called from the frontend /payment-callback page.
 * Verifies with Chapa API and marks the DB record APPROVED if successful.
 * Also triggers a confirmation SMS to the member.
 */
router.get('/chapa/verify/:tx_ref', verifyChapaPayment);

// ─────────────────────────────────────────────────────────────────────────────
// ORGANIZER MANAGEMENT ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/payments/organizer/:organizerId/pending
 * Returns all PENDING payments for groups managed by this organizer.
 */
router.get('/organizer/:organizerId/pending', getPendingPayments);

/**
 * PATCH /api/payments/:paymentId/review
 * Body: { status: 'APPROVED' | 'REJECTED', note?: string }
 * Manually approve or reject a payment (fallback for non-Chapa submissions).
 */
router.patch('/:paymentId/review', reviewPayment);

// ─────────────────────────────────────────────────────────────────────────────
// MEMBER HISTORY ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/payments/member/:userId
 * Returns full payment history for a member, ordered by newest first.
 */
router.get('/member/:userId', getMemberPayments);

module.exports = router;
