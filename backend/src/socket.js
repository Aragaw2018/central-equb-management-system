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
 *
 * Key change from original:
 *   - Unpaid members are NO LONGER a hard block.
 *   - Only members with an APPROVED payment for the current round/cycle
 *     AND who have not yet won this cycle are eligible participants.
 *   - If at least one eligible paid member exists, the draw proceeds.
 *   - Only throws if ZERO members have paid (nothing to draw).
 */
async function triggerDraw(groupId) {
    const group = await prisma.equbGroup.findUnique({
        where: { id: groupId },
        include: {
            plan: true,
            memberships: {
                where: { status: 'APPROVED' },
                include: { user: true },
            },
        },
    });

    if (!group) throw new Error('Equb group not found.');

    // ── 1. Find who has already won this cycle ────────────────────────────
    const previousWinners = await prisma.drawResult.findMany({
        where: { groupId, cycleNumber: group.cycleNumber },
        select: { winnerId: true },
    });
    const wonUserIds = new Set(previousWinners.map(d => d.winnerId));

    // ── 2. Find which memberships have an APPROVED payment this round ─────
    const paidMemberships = await prisma.equbMembership.findMany({
        where: {
            groupId,
            status: 'APPROVED',
            payments: {
                some: {
                    roundNumber: group.currentRound,
                    cycleNumber: group.cycleNumber,
                    status: 'APPROVED',
                },
            },
        },
        select: { userId: true },
    });
    const paidUserIds = new Set(paidMemberships.map(m => m.userId));

    // ── 3. Eligible = paid this round AND hasn't won this cycle ───────────
    const eligible = group.memberships.filter(
        m => paidUserIds.has(m.userId) && !wonUserIds.has(m.userId)
    );

    // ── 4. Collect unpaid members for informational logging ───────────────
    const unpaidMembers = group.memberships.filter(m => !paidUserIds.has(m.userId));
    if (unpaidMembers.length > 0) {
        const names = unpaidMembers.map(m => m.user.fullName).join(', ');
        console.log(
            `[Draw] INFO | group=${group.name} | round=${group.currentRound} | ` +
            `${unpaidMembers.length} member(s) excluded from draw (unpaid): ${names}`
        );
    }

    if (eligible.length === 0) {
        throw new Error(
            'No eligible members for this draw. ' +
            'None of the approved members have a verified payment for ' +
            `Round ${group.currentRound} (Cycle ${group.cycleNumber}).`
        );
    }

    // ── 5. Select winner randomly from paid-and-not-yet-won members ───────
    // Pot = ONLY paid members × plan amount — never inflated by unpaid members
    const paidMemberCount = paidUserIds.size;
    const actualPot = parseFloat((paidMemberCount * parseFloat(group.plan.amount)).toFixed(2));

    console.log(
        `[Draw] Pot | group=${group.name} | round=${group.currentRound} ` +
        `| paidMembers=${paidMemberCount} | planAmount=${group.plan.amount} | actualPot=${actualPot} ETB`
    );

    const winnerMembership = eligible[Math.floor(Math.random() * eligible.length)];
    const winnerUser = winnerMembership.user;
    const isLastWinner = eligible.length === 1;

    const DRAW_DURATION_MS = 120000; // 2-minute live spin window
    const serverStartTime = Date.now();

    const drawData = {
        groupId,
        participants: eligible.map(m => ({ userId: m.userId, fullName: m.user.fullName })),
        winnerId: winnerUser.id,
        winnerName: winnerUser.fullName,
        roundNumber: group.currentRound,
        cycleNumber: group.cycleNumber,
        drawDurationMs: DRAW_DURATION_MS,
        // Pot = paid members × plan amount (accurate, never includes unpaid contributions)
        potAmount: actualPot.toString(),
        serverStartTime,
        isLastWinner,
        // Carry unpaid info so clients can show a non-blocking warning banner
        unpaidMembers: unpaidMembers.map(m => ({ userId: m.userId, fullName: m.user.fullName })),
    };

    activeDraws[groupId] = drawData;
    io.to(`group:${groupId}`).emit('drawStarted', drawData);

    // ── 6. Persist result after the countdown ────────────────────────────
    setTimeout(async () => {
        try {
            delete activeDraws[groupId];

            const result = await prisma.$transaction([
                prisma.drawResult.create({
                    data: {
                        groupId,
                        winnerId: winnerUser.id,
                        roundNumber: group.currentRound,
                        cycleNumber: group.cycleNumber,
                        potAmount: drawData.potAmount,
                        // Last winner auto-waives guarantor requirement
                        guarantorProvided: isLastWinner,
                    },
                }),
                prisma.equbMembership.update({
                    where: { id: winnerMembership.id },
                    data: { hasWon: true },
                }),
                prisma.equbGroup.update({
                    where: { id: groupId },
                    data: { currentRound: group.currentRound + 1 },
                }),
            ]);

            io.to(`group:${groupId}`).emit('winnerAnnounced', {
                ...drawData,
                drawResultId: result[0].id,
            });

        } catch (dbErr) {
            console.error('[Draw] Error recording winner:', dbErr);
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