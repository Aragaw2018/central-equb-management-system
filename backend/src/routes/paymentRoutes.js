// src/routes/paymentRoutes.js
const express       = require('express');
const router        = express.Router();
const upload        = require('../config/paymentUpload');
const {
    submitPayment,
    getPendingPayments,
    reviewPayment,
    getMemberPayments,
} = require('../controllers/paymentController');

// Member: submit a payment with optional receipt image
router.post('/submit', upload.single('receiptImage'), submitPayment);

// Member: get own payment history
router.get('/member/:userId', getMemberPayments);

// Organizer: get pending payments for their groups
router.get('/organizer/:organizerId/pending', getPendingPayments);

// Organizer: approve or reject a payment
router.patch('/:paymentId/review', reviewPayment);

module.exports = router;
