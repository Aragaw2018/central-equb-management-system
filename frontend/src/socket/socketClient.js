// src/socket/socketClient.js
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

let socket = null;

export function getSocket() {
    if (!socket) {
        socket = io(SOCKET_URL, { autoConnect: false });
    }
    return socket;
}

export function connectSocket() {
    const s = getSocket();
    if (!s.connected) s.connect();
    return s;
}

// Connect AND immediately join the user's personal notification room
export function connectSocketForUser(userId) {
    const s = connectSocket();
    s.once('connect', () => {
        s.emit('joinUserRoom', { userId });
    });
    // If already connected, join immediately
    if (s.connected && userId) {
        s.emit('joinUserRoom', { userId });
    }
    return s;
}

export function disconnectSocket() {
    if (socket && socket.connected) socket.disconnect();
}
