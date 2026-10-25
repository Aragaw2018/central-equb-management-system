// src/app.js
const express = require('express');
const cors = require('cors');
const path = require('path');

// ── 1. Route Imports ──────────────────────────────────────────────────────────
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const organizerRoutes = require('./routes/organizerRoutes');
const memberRoutes = require('./routes/memberRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const drawRoutes = require('./routes/drawRoutes');
const guarantorRoutes = require('./routes/guarantorRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// ── Maintenance-mode kill-switch middleware ───────────────────────────────────
const checkMaintenance = require('./middlewares/checkMaintenance');

const app = express();

// ── 2. Core Middleware ────────────────────────────────────────────────────────
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,   // Required for HttpOnly cookies to be sent/received
}));
app.use(require('cookie-parser')());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Static File Serving
 * Serves uploaded identity verification (Fayda ID), payment receipts,
 * and guarantor security documents.
 */
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ── 3. Application API Routes ────────────────────────────────────────────────

// Authentication, user management, and password reset (ALWAYS accessible)
app.use('/api/users', userRoutes);

// System administration (ALWAYS accessible — admins must remain able to disable maintenance)
app.use('/api/admin', adminRoutes);

// ── Maintenance-mode kill-switch — gates all non-admin routes ─────────────────
// Runs AFTER /api/users and /api/admin are registered so those bypass it.
app.use(checkMaintenance);

// Group management and cycle controls for organizers
app.use('/api/organizer', organizerRoutes);

// Member actions, discovery, and group listings
app.use('/api/member', memberRoutes);

// Payment submissions, reviews, and receipt verification
app.use('/api/payments', paymentRoutes);

// Lottery/Equb draw operations and winner selection
app.use('/api/draw', drawRoutes);

// Guarantor nominations, collateral verification, and fund releases
app.use('/api/guarantor', guarantorRoutes);

// Financial analytics, member balance statements, and reporting
app.use('/api/reports', reportRoutes);

// In-app notification feed for members and organizers
app.use('/api/notifications', notificationRoutes);

// ── 4. Global Error & 440 Handler ─────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

module.exports = app;