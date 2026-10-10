// backend/src/controllers/userController.js

const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
const sendSMS = require('../config/smsService');

/**
 * 1. USER REGISTRATION
 * Handles registration for all user roles with password hashing,
 * field validations, and optional Fayda document upload.
 */
const registerUser = async (req, res) => {
    console.log("Registration Attempt:", req.body);

    const { 
        firstName, 
        fatherName, 
        phoneNumber, 
        email, 
        password, 
        role, 
        faydaId,
        bankName,
        accountHolder,
        accountNumber 
    } = req.body;

    // Validation for required fields
    if (!firstName || !fatherName || !phoneNumber || !password || !role || !faydaId) {
        return res.status(400).json({ 
            error: "Missing mandatory fields. Please ensure Names, Phone, FIN, and Role are provided." 
        });
    }

    try {
        // Check for duplicate credentials
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { phoneNumber: phoneNumber },
                    { faydaId: faydaId },
                    ...(email ? [{ email: email }] : [])
                ]
            }
        });

        if (existingUser) {
            return res.status(409).json({ error: "Phone number, Email, or Fayda ID is already registered." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const faydaImageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        const newUser = await prisma.user.create({
            data: {
                firstName,
                fatherName,
                fullName: `${firstName} ${fatherName}`,
                phoneNumber,
                email: email || null,
                password: hashedPassword,
                role,
                faydaId,
                faydaImageUrl,
                bankName: bankName || null,
                accountHolder: accountHolder || null,
                accountNumber: accountNumber || null,
                isApproved: (role === 'MEMBER' || role === 'ADMIN'), 
                isActive: true,
                kycStatus: "PENDING"
            }
        });

        res.status(201).json({
            message: "Account created successfully! You can now login.",
            user: { 
                id: newUser.id, 
                fullName: newUser.fullName, 
                role: newUser.role 
            }
        });

    } catch (error) {
        console.error("Registration Error Logic:", error);
        res.status(500).json({ error: "Internal server error during registration." });
    }
};

/**
 * 2. USER LOGIN
 * Authenticates users and checks for active status and organizer approvals.
 */
const loginUser = async (req, res) => {
    const { identifier, password } = req.body;

    try {
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { phoneNumber: identifier }
                ]
            }
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Invalid credentials. Please check your phone/email and password." });
        }

        if (!user.isActive) {
            return res.status(403).json({ 
                error: "Your account has been deactivated. Please contact support." 
            });
        }

        if (user.role === 'ORGANIZER' && !user.isApproved) {
            return res.status(403).json({ 
                error: "Access Denied. Your organizer account is still pending admin approval." 
            });
        }

        res.json({
            message: "Login successful",
            user: {
                id: user.id,
                fullName: user.fullName,
                role: user.role,
                isApproved: user.isApproved,
                kycStatus: user.kycStatus
            }
        });
    } catch (error) {
        console.error("Login Error Logic:", error);
        res.status(500).json({ error: "Internal server error during login." });
    }
};

/**
 * 3. SEND OTP (Password Reset Step 1)
 */
const sendOTP = async (req, res) => {
    const { phoneNumber } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { phoneNumber } });
        if (!user) {
            return res.status(404).json({ error: "User not found with this phone number." });
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 5 * 60000); // 5-minute expiry

        await prisma.user.update({
            where: { phoneNumber },
            data: { otpCode, otpExpires }
        });

        await sendSMS(phoneNumber, `Your Central Ekub verification code is: ${otpCode}`);

        res.json({
            message: "Verification code sent!",
            debugCode: otpCode // Retained for local testing/debugging
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to send OTP: " + error.message });
    }
};

/**
 * 4. VERIFY OTP (Password Reset Step 2)
 */
const verifyOTP = async (req, res) => {
    const { phoneNumber, otpCode } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { phoneNumber } });
        if (user && user.otpCode === otpCode && new Date() < new Date(user.otpExpires)) {
            return res.json({ message: "OTP verified successfully." });
        }
        res.status(400).json({ error: "Invalid or expired verification code." });
    } catch (error) {
        res.status(500).json({ error: "Verification failed." });
    }
};

/**
 * 5. FINALIZE RESET (Password Reset Step 3)
 */
const finalizeReset = async (req, res) => {
    const { phoneNumber, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters." });
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { phoneNumber },
            data: {
                password: hashedPassword,
                otpCode: null,
                otpExpires: null
            }
        });
        res.json({ message: "Password updated successfully! You can now login." });
    } catch (error) {
        res.status(500).json({ error: "Final password reset failed." });
    }
};

/**
 * 6. UPDATE PROFILE & BANK DETAILS
 */
const updateProfile = async (req, res) => {
    const { userId } = req.params;
    const { firstName, fatherName, email, bankName, accountHolder, accountNumber } = req.body;

    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                firstName,
                fatherName,
                fullName: `${firstName} ${fatherName}`,
                email,
                bankName,
                accountHolder,
                accountNumber
            }
        });

        res.json({ message: "Profile updated successfully!", user: updatedUser });
    } catch (error) {
        res.status(500).json({ error: "Failed to update profile." });
    }
};

/**
 * 7. CHANGE PASSWORD
 */
const changePassword = async (req, res) => {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Current password is incorrect." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        res.json({ message: "Password changed successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to change password." });
    }
};

// Export all controller functions cleanly in a single module.exports block
module.exports = {
    registerUser,
    loginUser,
    sendOTP,
    verifyOTP,
    finalizeReset,
    updateProfile,
    changePassword
};