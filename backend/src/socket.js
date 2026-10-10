// backend/src/services/drawEngine.js
const { Server } = require('socket.io');
const prisma = require('./config/db');


let io;
const activeDraws = {};

/**
 * Initializes WebSocket server instance and connection listeners.
 */
function initSocket(server) {
    io = new Server(server, { 
        cors: { 
            origin: '*', 
            methods: ['GET', 'POST'] 
        } 
    });

    io.on('connection', (socket) => {
        // Room join event for real-time Equb draw viewing
        socket.on('joinGroupRoom', ({ groupId, userId }) => {
            socket.join(`group:${groupId}`);
            
            // Sync client state if draw is currently active
            if (activeDraws[groupId]) {
                const draw = activeDraws[groupId];
                const elapsedMs = Date.now() - draw.serverStartTime;
                if (elapsedMs < draw.drawDurationMs) {
                    socket.emit('drawStarted', { 
                        ...draw, 
                        isSync: true, 
                        elapsedMs 
                    });
                }
            }
        });

        socket.on('leaveGroupRoom', ({ groupId }) => socket.leave(`group:${groupId}`));
        socket.on('joinUserRoom', ({ userId }) => socket.join(`user:${userId}`));
    });

    return io;
}

/**
 * Triggers a live lottery draw for a specific Equb group.
 * Validates member payment status for current cycle & round before proceeding.
 */
async function triggerDraw(groupId) {
    const group = await prisma.equbGroup.findUnique({
        where: { id: groupId },
        include: { 
            plan: true,
            memberships: { 
                where: { status: 'APPROVED' }, 
                include: { user: true } 
            } 
        },
    });

    if (!group) throw new Error('Equb group not found.');

    // 1. Payment Verification Check (Members must have approved payment for current round & cycle)
    const unpaidMembers = await prisma.equbMembership.findMany({
        where: {
            groupId: groupId,
            status: 'APPROVED',
            payments: {
                none: {
                    roundNumber: group.currentRound,
                    cycleNumber: group.cycleNumber,
                    status: 'APPROVED'
                }
            }
        },
        include: { user: true }
    });

    if (unpaidMembers.length > 0) {
        const names = unpaidMembers.map(m => m.user.fullName).join(", ");
        throw new Error(
            `Cannot start draw. The following members have pending or unapproved payments for Round ${group.currentRound} (Cycle ${group.cycleNumber}): ${names}`
        );
    }

    // 2. Filter out past winners in the current cycle
    const previousWinners = await prisma.drawResult.findMany({
        where: { groupId, cycleNumber: group.cycleNumber },
        select: { winnerId: true },
    });

    const wonUserIds = new Set(previousWinners.map(d => d.winnerId));
    const eligible = group.memberships.filter(m => !wonUserIds.has(m.userId));

    if (eligible.length === 0) {
        throw new Error('All members in this group have already won in the current cycle.');
    }

    // 3. Draw winner selection logic
    const winnerMembership = eligible[Math.floor(Math.random() * eligible.length)];
    const winnerUser = winnerMembership.user;
    const isLastWinner = eligible.length === 1;

    const DRAW_DURATION_MS = 120000; // 2 Minutes live draw execution window
    const serverStartTime = Date.now();

    const drawData = {
        groupId,
        participants: eligible.map(m => ({ userId: m.userId, fullName: m.user.fullName })),
        winnerId: winnerUser.id,
        winnerName: winnerUser.fullName,
        roundNumber: group.currentRound,
        cycleNumber: group.cycleNumber,
        drawDurationMs: DRAW_DURATION_MS,
        potAmount: (parseFloat(group.plan.amount) * group.memberships.length).toFixed(2),
        serverStartTime,
        isLastWinner
    };

    activeDraws[groupId] = drawData;
    io.to(`group:${groupId}`).emit('drawStarted', drawData);

    // 4. Finalize draw result and persist to database after countdown completes
    setTimeout(async () => {
        try {
            delete activeDraws[groupId];

            const result = await prisma.$transaction([
                prisma.drawResult.create({
                    data: {
                        groupId: groupId,
                        winnerId: winnerUser.id,
                        roundNumber: group.currentRound,
                        cycleNumber: group.cycleNumber,
                        potAmount: drawData.potAmount,
                        guarantorProvided: isLastWinner // Last winner auto-waives guarantor requirement
                    }
                }),
                prisma.equbMembership.update({
                    where: { id: winnerMembership.id },
                    data: { hasWon: true }
                }),
                prisma.equbGroup.update({
                    where: { id: groupId },
                    data: { currentRound: group.currentRound + 1 }
                })
            ]);

            io.to(`group:${groupId}`).emit('winnerAnnounced', { 
                ...drawData, 
                drawResultId: result[0].id 
            });

        } catch (dbErr) { 
            console.error('Error recording draw winner:', dbErr); 
            delete activeDraws[groupId]; 
        }
    }, DRAW_DURATION_MS + 2000);

    return drawData;
}

module.exports = { 
    initSocket, 
    triggerDraw, 
    getIO: () => io 
};