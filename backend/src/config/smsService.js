// backend/src/config/smsService.js
const axios = require('axios');
const prisma = require('./db');

/**
 * Reads the current sms_mode setting from SystemSetting.
 * Falls back to 'simulation' if the row doesn't exist yet.
 */
const getSmsMode = async () => {
    try {
        const setting = await prisma.systemSetting.findUnique({
            where: { key: 'sms_mode' }
        });
        return setting?.value ?? 'simulation';
    } catch {
        return 'simulation';
    }
};

/**
 * Sends an SMS via AfroMessage API (live mode).
 */
const sendLiveSMS = async (to, message) => {
    const token = process.env.AFROMESSAGE_TOKEN;
    const senderName = process.env.SENDER_NAME || 'Ekub';

    const response = await axios.get('https://api.afromessage.com/api/send', {
        params: {
            from: senderName,
            sender: senderName,
            to,
            message,
            callback: ''
        },
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    console.log(`[SMS LIVE] Sent to ${to} → status: ${response.data?.acknowledge}`);
    return response.data;
};

/**
 * Logs the message to the console (simulation mode).
 */
const sendSimulatedSMS = (to, message) => {
    console.log('─────────────────────────────────────────');
    console.log(`📱 SMS SIMULATION  →  ${to}`);
    console.log(`💬 MESSAGE: ${message}`);
    console.log('─────────────────────────────────────────');
    return { status: 'success', message: 'Simulated SMS' };
};

/**
 * Main export — decides live vs. simulation at call-time
 * based on the sms_mode row in SystemSetting.
 */
const sendSMS = async (to, message) => {
    const mode = await getSmsMode();

    if (mode === 'live') {
        return await sendLiveSMS(to, message);
    }

    return sendSimulatedSMS(to, message);
};

module.exports = sendSMS;
