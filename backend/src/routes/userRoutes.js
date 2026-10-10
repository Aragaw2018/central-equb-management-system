// backend/src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const upload = require('../config/upload'); // Multer storage configuration

/**
 * 1. AUTHENTICATION & REGISTRATION
 */

// User registration with optional Fayda ID image upload ('faydaImage' field)
router.post('/register', upload.single('faydaImage'), userController.registerUser);

// User login endpoint
router.post('/login', userController.loginUser);

/**
 * 2. PASSWORD RECOVERY (OTP WORKFLOW)
 */

// Step 1: Send OTP to registered phone number
router.post('/send-otp', userController.sendOTP);

// Step 2: Verify received OTP code
router.post('/verify-otp', userController.verifyOTP);

// Step 3: Set new password after successful verification
router.post('/reset-password', userController.finalizeReset);

/**
 * 3. PROFILE & ACCOUNT MANAGEMENT
 */

// Update member/organizer profile & bank information
router.patch('/profile/:userId', userController.updateProfile);

// Authenticated user password update
router.patch('/change-password/:userId', userController.changePassword);

module.exports = router;