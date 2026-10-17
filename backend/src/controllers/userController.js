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
    } = req.body;

    // Fayda ID is no longer required at signup — collected during eKYC verification
    if (!firstName || !fatherName || !phoneNumber || !password || !role) {
        return res.status(400).json({
            error: "Missing mandatory fields. Please ensure First Name, Father's Name, Phone, Role, and Password are provided."
        });
    }

    try {
        // Check for duplicate credentials
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { phoneNumber: phoneNumber },
                    ...(email ? [{ email: email }] : [])
                ]
            }
        });

        if (existingUser) {
            return res.status(409).json({ error: "Phone number or Email is already registered." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                firstName,
                fatherName,
                fullName: `${firstName} ${fatherName}`,
                phoneNumber,
                email: email || null,
                password: hashedPassword,
                role,
                faydaId: null,          // submitted later via eKYC modal
                faydaImageUrl: null,
                isApproved: (role === 'MEMBER' || role === 'ADMIN'),
                isActive: true,
                kycStatus: 'PENDING',
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
                firstName: user.firstName,
                fatherName: user.fatherName,
                phoneNumber: user.phoneNumber,
                email: user.email,
                role: user.role,
                isApproved: user.isApproved,
                kycStatus: user.kycStatus,
                faydaId: user.faydaId ?? null,
                bankName: user.bankName ?? null,
                accountNumber: user.accountNumber ?? null,
                accountHolder: user.accountHolder ?? null,
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
 * 6. GET PROFILE — returns safe user data for the profile page pre-fill
 */
const getProfile = async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                fullName: true,
                firstName: true,
                fatherName: true,
                email: true,
                phoneNumber: true,
                role: true,
                bankName: true,
                accountHolder: true,
                accountNumber: true,
                kycStatus: true,
                isApproved: true,
                faydaId: true,
            },
        });
        if (!user) return res.status(404).json({ error: 'User not found.' });
        res.json({ user });
    } catch (error) {
        console.error('getProfile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile.' });
    }
};

/**
 * 7. UPDATE PROFILE & BANK DETAILS
 * Partial update — only overwrites fields that are actually provided.
 */
const updateProfile = async (req, res) => {
    const { userId } = req.params;
    const { firstName, fatherName, email, bankName, accountHolder, accountNumber } = req.body;

    try {
        const updateData = {};

        if (bankName !== undefined) updateData.bankName = bankName || null;
        if (accountHolder !== undefined) updateData.accountHolder = accountHolder || null;
        if (accountNumber !== undefined) updateData.accountNumber = accountNumber || null;
        if (email !== undefined) updateData.email = email || null;

        if (firstName && fatherName) {
            updateData.firstName = firstName.trim();
            updateData.fatherName = fatherName.trim();
            updateData.fullName = `${firstName.trim()} ${fatherName.trim()}`;
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
        });

        const safeUser = {
            id: updatedUser.id,
            fullName: updatedUser.fullName,
            firstName: updatedUser.firstName,
            fatherName: updatedUser.fatherName,
            email: updatedUser.email,
            phoneNumber: updatedUser.phoneNumber,
            role: updatedUser.role,
            bankName: updatedUser.bankName,
            accountHolder: updatedUser.accountHolder,
            accountNumber: updatedUser.accountNumber,
            kycStatus: updatedUser.kycStatus,
            isApproved: updatedUser.isApproved,
        };

        res.json({
            message: "Profile and payout details updated successfully!",
            user: safeUser,
        });
    } catch (error) {
        console.error("updateProfile error:", error);
        res.status(500).json({ error: "Failed to update profile." });
    }
};

/**
 * 8. CHANGE PASSWORD (ENHANCED & REAL TIME PERSISTENCE)
 */
const changePassword = async (req, res) => {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Both current and new password are required." });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters long." });
    }

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        // Verify current password against database hash
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Current password is incorrect. Please check and try again." });
        }

        // Hash the new password with salt rounds 10
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update database atomically
        const updated = await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        console.log(`[AUTH] Password changed successfully for user: ${updated.fullName} (${updated.id})`);

        return res.json({
            success: true,
            message: "Password changed successfully! Next time you log in, use your new password."
        });
    } catch (error) {
        console.error("changePassword error:", error.message);
        return res.status(500).json({ error: "Failed to update password. Server error." });
    }
};

/**
 * 9. SEND FAYDA OTP — Step 1 of 2-step eKYC
 */
const sendFaydaOTP = async (req, res) => {
    const { userId, faydaId } = req.body;

    if (!userId || !faydaId) {
        return res.status(400).json({ error: 'userId and faydaId are required.' });
    }

    try {
        const kycSetting = await prisma.systemSetting.findUnique({ where: { key: 'kyc_mode' } });
        if (kycSetting?.value === 'manual') {
            return res.status(403).json({
                error: 'Self-service verification is currently disabled. Please submit your Fayda ID and wait for admin approval.',
                code: 'KYC_MANUAL_MODE',
            });
        }
    } catch {
        // Fail-open
    }

    const FIN_REGEX = /^\d{12}$/;
    if (!FIN_REGEX.test(faydaId)) {
        return res.status(422).json({
            error: 'Invalid Fayda ID format. Your National Fayda Identification Number must be exactly 12 digits.',
        });
    }

    try {
        const conflict = await prisma.user.findFirst({
            where: { faydaId, NOT: { id: userId } },
            select: { id: true },
        });
        if (conflict) {
            return res.status(409).json({
                error: 'This Fayda ID is already linked to another account. Please contact support.',
            });
        }

        const faydaImageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const expires = new Date(Date.now() + 10 * 60 * 1000);

        await prisma.user.update({
            where: { id: userId },
            data: {
                faydaId,
                ...(faydaImageUrl !== undefined && { faydaImageUrl }),
                otpCode: otp,
                otpExpires: expires,
            },
        });

        console.log(`[KYC] OTP sent (simulation) | user=${userId} | otp=${otp}`);

        return res.json({
            success: true,
            message: 'Verification code sent to your registered phone number.',
            debugOtp: otp,
        });
    } catch (error) {
        if (error.code === 'P2025') return res.status(404).json({ error: 'User not found.' });
        console.error('[KYC] sendFaydaOTP error:', error.message);
        return res.status(500).json({ error: 'Failed to send verification code. Please try again.' });
    }
};

/**
 * 10. VERIFY FAYDA OTP — Step 2 of 2-step eKYC
 */
const verifyFaydaOTP = async (req, res) => {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
        return res.status(400).json({ error: 'userId and otp are required.' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { otpCode: true, otpExpires: true, faydaId: true },
        });

        if (!user) return res.status(404).json({ error: 'User not found.' });

        if (!user.otpCode) {
            return res.status(400).json({ error: 'No pending verification. Please request a new code.' });
        }

        if (new Date() > new Date(user.otpExpires)) {
            return res.status(410).json({ error: 'Verification code expired. Please request a new one.' });
        }

        if (otp.trim() !== user.otpCode) {
            return res.status(422).json({ error: 'Incorrect verification code. Please check and try again.' });
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                kycStatus: 'VERIFIED',
                isApproved: true,
                otpCode: null,
                otpExpires: null,
            },
            select: {
                id: true, fullName: true, firstName: true, fatherName: true,
                phoneNumber: true, email: true, role: true,
                faydaId: true, faydaImageUrl: true, kycStatus: true, isApproved: true,
                bankName: true, accountNumber: true, accountHolder: true,
            },
        });

        console.log(`[KYC] Verified | user=${updated.fullName} | faydaId=${updated.faydaId}`);

        return res.json({
            success: true,
            message: 'National Fayda ID verified successfully!',
            user: updated,
        });
    } catch (error) {
        console.error('[KYC] verifyFaydaOTP error:', error.message);
        return res.status(500).json({ error: 'Verification failed. Please try again.' });
    }
};

/**
 * (Legacy) AUTO-VERIFY FAYDA — single-step
 */
const autoVerifyFayda = async (req, res) => {
    const { userId, faydaId } = req.body;

    if (!userId || !faydaId) {
        return res.status(400).json({ error: 'userId and faydaId are required.' });
    }

    const FIN_REGEX = /^\d{12}$/;
    if (!FIN_REGEX.test(faydaId)) {
        return res.status(422).json({
            error: 'Invalid Fayda ID format. Your National Fayda Identification Number must be exactly 12 digits.',
        });
    }

    try {
        const conflict = await prisma.user.findFirst({
            where: { faydaId, NOT: { id: userId } },
            select: { id: true },
        });

        if (conflict) {
            return res.status(409).json({
                error: 'This Fayda ID is already linked to another account. Please contact support.',
            });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                faydaId,
                kycStatus: 'VERIFIED',
                isApproved: true,
            },
            select: {
                id: true, fullName: true, firstName: true, fatherName: true,
                phoneNumber: true, email: true, role: true,
                faydaId: true, kycStatus: true, isApproved: true,
                bankName: true, accountNumber: true, accountHolder: true,
            },
        });

        console.log(`[KYC] Auto-verified | user=${user.fullName} | faydaId=${faydaId}`);

        return res.json({
            success: true,
            message: 'National Fayda ID verified successfully!',
            user,
        });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'User not found.' });
        }
        console.error('[KYC] autoVerifyFayda error:', error.message);
        return res.status(500).json({ error: 'Verification failed. Please try again.' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    sendOTP,
    verifyOTP,
    finalizeReset,
    getProfile,
    updateProfile,
    changePassword,
    autoVerifyFayda,
    sendFaydaOTP,
    verifyFaydaOTP,
};