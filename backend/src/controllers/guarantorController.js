// backend/src/controllers/guarantorController.js
const prisma = require('../config/db');
const { getIO } = require('../socket');

/**
 * 1. requestGuarantor
 * Allows a winner to nominate an eligible group member as a Wase.
 * Fixes the 409 Conflict by cleaning up old REJECTED requests.
 */
const requestGuarantor = async (req, res) => {
    const { drawResultId, guarantorPhoneNumber, userId } = req.body;

    try {
        const drawResult = await prisma.drawResult.findUnique({
            where: { id: drawResultId },
            include: { guarantor: true }
        });

        if (drawResult.guarantor && drawResult.guarantor.status !== 'REJECTED') {
            return res.status(409).json({ error: 'A nomination is already active.' });
        }

        if (drawResult.guarantor?.status === 'REJECTED') {
            await prisma.guarantor.delete({ where: { id: drawResult.guarantor.id } });
        }

        const cleanPhone = guarantorPhoneNumber.replace(/\D/g, '').slice(-9);
        const guarantorUser = await prisma.user.findFirst({
            where: { phoneNumber: { contains: cleanPhone } }
        });

        if (!guarantorUser) return res.status(404).json({ error: 'Member not found.' });

        const guarantor = await prisma.guarantor.create({
            data: { drawResultId, guarantorId: guarantorUser.id, status: 'PENDING' }
        });

        res.status(201).json({ message: 'Nomination sent!', guarantor });
    } catch (error) {
        res.status(500).json({ error: "Failed to process nomination." });
    }
};

/**
 * 2. respondToGuarantor
 * Handles Wase acceptance (with 3 security docs) or rejection.
 */
const respondToGuarantor = async (req, res) => {
    const { guarantorId } = req.params;
    const { status, userId, checkNumber } = req.body;

    try {
        const record = await prisma.guarantor.findUnique({
            where: { id: guarantorId },
            include: { drawResult: true }
        });

        if (!record || record.guarantorId !== userId) {
            return res.status(403).json({ error: 'Access Denied.' });
        }

        const updateData = { status, respondedAt: new Date() };

        if (status === 'ACCEPTED') {
            if (req.files) {
                // Asset files mapping
                if (req.files.checkImage) updateData.checkImageUrl = `/uploads/guarantor/${req.files.checkImage[0].filename}`;
                if (req.files.landDoc) updateData.landDocUrl = `/uploads/guarantor/${req.files.landDoc[0].filename}`;
                if (req.files.faydaScan) updateData.documentUrl = `/uploads/guarantor/${req.files.faydaScan[0].filename}`;
            }
            updateData.checkNumber = checkNumber;
            updateData.documentStatus = 'PENDING';
        }

        const updated = await prisma.guarantor.update({
            where: { id: guarantorId },
            data: updateData,
            include: { 
                guarantor: { select: { fullName: true } },
                drawResult: { select: { winnerId: true } }
            }
        });

        if (status === 'ACCEPTED') {
            await prisma.drawResult.update({
                where: { id: record.drawResultId },
                data: { guarantorProvided: true }
            });
        }

        // Notify the Winner
        const io = getIO();
        if (io) {
            io.to(`user:${updated.drawResult.winnerId}`).emit('guarantorResponded', {
                status,
                guarantorName: updated.guarantor.fullName
            });
        }

        res.json({ message: `Response registered: ${status}`, guarantor: updated });
    } catch (error) {
        console.error('respondToGuarantor error:', error);
        res.status(500).json({ error: 'Processing failed.' });
    }
};

/**
 * 3. searchEligibleGuarantors
 * Fetches group members who haven't won yet and aren't the winner.
 */
const searchEligibleGuarantors = async (req, res) => {
    const { groupId, phone, excludeUserId } = req.query;

    if (!groupId || !phone) {
        return res.status(400).json({ error: 'Group ID and Phone are required.' });
    }

    try {
        // Cleaning phone number (removing initial 0 or +251 and taking the last 9 digits)
        const cleanPhone = phone.replace(/\D/g, '').slice(-9);

        const memberships = await prisma.equbMembership.findMany({
            where: {
                groupId: groupId,
                status: 'APPROVED',
                hasWon: false, // 🎯 Key point: Only those who haven't won yet
                userId: { not: excludeUserId }, // Cannot act as own guarantor
                user: {
                    phoneNumber: { contains: cleanPhone } // Will find it regardless of format
                }
            },
            include: { 
                user: { 
                    select: { id: true, fullName: true, phoneNumber: true } 
                } 
            }
        });

        res.json(memberships.map(m => m.user));
    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json({ error: "Failed to search members." });
    }
};

/**
 * 4. getPayoutsForOrganizer
 * Full report for the distribution center, including bank details.
 */
const getPayoutsForOrganizer = async (req, res) => {
    const { organizerId } = req.params;
    try {
        const results = await prisma.drawResult.findMany({
            where: { group: { organizerId } },
            orderBy: { drawnAt: 'desc' },
            include: { 
                winner: { 
                    select: { 
                        id: true, fullName: true, phoneNumber: true, email: true,
                        bankName: true, accountNumber: true, accountHolder: true 
                    } 
                }, 
                group: { include: { plan: true } }, 
                guarantor: { include: { guarantor: true } } 
            }
        });

        const formattedResults = results.map(r => {
            const pot = r.group.plan ? parseFloat(r.group.plan.amount) * (r.group.plan.maxMembers || 1) : 0;
            return { ...r, potAmount: pot.toFixed(2) };
        });

        res.json(formattedResults);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch payouts report." });
    }
};

/**
 * Helper Fetchers
 */
const getPendingRequests = async (req, res) => {
    try {
        const requests = await prisma.guarantor.findMany({
            where: { guarantorId: req.params.userId, status: 'PENDING' },
            include: { 
                drawResult: { 
                    include: { group: { include: { plan: true } }, winner: true } 
                } 
            }
        });
        res.json(requests);
    } catch (error) { res.status(500).json({ error: "Failed" }); }
};

const getMemberWins = async (req, res) => {
    const { userId } = req.params;
    try {
        const wins = await prisma.drawResult.findMany({
            where: { winnerId: userId },
            include: {
                group: { include: { plan: true } },
                guarantor: { include: { guarantor: { select: { id: true, fullName: true } } } }
            },
            orderBy: { drawnAt: 'desc' }
        });
        res.json(wins);
    } catch (error) { res.status(500).json({ error: 'Failed to fetch wins.' }); }
};

const verifyDocuments = async (req, res) => {
    try {
        const updated = await prisma.guarantor.update({
            where: { id: req.params.guarantorId },
            data: { documentStatus: req.body.documentStatus }
        });
        res.json({ message: "Status updated.", guarantor: updated });
    } catch (error) { res.status(500).json({ error: "Verification failed." }); }
};

const releaseFunds = async (req, res) => {
    try {
        const updated = await prisma.drawResult.update({
            where: { id: req.params.drawResultId },
            data: { isFundsReleased: true }
        });
        res.json({ message: "Funds released!", drawResult: updated });
    } catch (error) { res.status(500).json({ error: "Release failed." }); }
};

module.exports = { 
    requestGuarantor, respondToGuarantor, getPendingRequests, 
    getMemberWins, searchEligibleGuarantors, verifyDocuments, 
    releaseFunds, getPayoutsForOrganizer 
};