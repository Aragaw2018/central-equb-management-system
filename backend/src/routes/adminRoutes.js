const express = require('express');
const router = express.Router();
const {
    getPendingOrganizers,
    approveOrganizer,
    createPlan,
    getAllPlans,
    getAllUsers,
    toggleUserStatus,
    updatePlan,
    deletePlan,
    getSettings,
    updateSettings,
    getKYCRequests,
    updateKYCStatus,
    updateUserRole,
} = require('../controllers/adminController');

// Organizer approval routes
router.get('/pending-organizers', getPendingOrganizers);
router.post('/approve-organizer', approveOrganizer);

// Equb Plan routes
router.post('/create-plan', createPlan);
router.get('/plans', getAllPlans);
router.put('/plans/:id', updatePlan);
router.delete('/plans/:id', deletePlan);

// System users routes
router.get('/users', getAllUsers);
router.patch('/users/:id/status', toggleUserStatus);
router.patch('/users/:id/role', updateUserRole);

// Global settings routes
router.get('/settings', getSettings);
router.patch('/settings', updateSettings);

// KYC routes
router.get('/kyc', getKYCRequests);
router.patch('/kyc/:id', updateKYCStatus);

module.exports = router;