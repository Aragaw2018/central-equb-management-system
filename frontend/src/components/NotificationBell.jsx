import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, X, CheckCircle2, Wallet, CreditCard, Gift, Info, BellRing } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import { connectSocket } from '../socket/socketClient';

// ── Per-type visual config ─────────────────────────────────────────────────────
const TYPE_META = {
    PAYMENT_CONFIRMED: { icon: <CreditCard size={14} className="text-blue-500" />, bg: 'bg-blue-50', dot: 'bg-blue-400' },
    SUPPLEMENTAL_PAYOUT: { icon: <Gift size={14} className="text-emerald-500" />, bg: 'bg-emerald-50', dot: 'bg-emerald-400' },
    PENALTY_RECEIVED: { icon: <Wallet size={14} className="text-teal-500" />, bg: 'bg-teal-50', dot: 'bg-teal-400' },
    REMINDER: { icon: <BellRing size={14} className="text-amber-500" />, bg: 'bg-amber-50', dot: 'bg-amber-400' },
    GENERAL: { icon: <Info size={14} className="text-slate-400" />, bg: 'bg-slate-50', dot: 'bg-slate-400' },
};

function typeMeta(type) {
    return TYPE_META[type] || TYPE_META.GENERAL;
}

function relativeTime(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

// ── Toast banner (auto-dismisses after 5 s) ────────────────────────────────────
export function NotificationToast({ notification, onClose }) {
    const meta = typeMeta(notification?.type);

    useEffect(() => {
        const t = setTimeout(onClose, 5000);
        return () => clearTimeout(t);
    }, [onClose]);

    if (!notification) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[200] flex items-start gap-3 px-5 py-4 bg-white rounded-[1.5rem] shadow-2xl border border-slate-100 max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className={`w-9 h-9 ${meta.bg} rounded-xl flex items-center justify-center shrink-0 mt-0.5`}>
                {meta.icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-800 mb-0.5">{notification.title}</p>
                <p className="text-[11px] font-medium text-slate-600 leading-snug line-clamp-2">{notification.message}</p>
            </div>
            <button
                onClick={onClose}
                className="p-1 text-slate-300 hover:text-slate-500 transition-colors shrink-0"
                aria-label="Dismiss"
            >
                <X size={14} />
            </button>
        </div>
    );
}

// ── Main NotificationBell component ───────────────────────────────────────────
export default function NotificationBell({ userId }) {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [toast, setToast] = useState(null);
    const dropdownRef = useRef(null);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    // ── Fetch from API ──────────────────────────────────────────────────────
    const fetchNotifications = useCallback(async () => {
        if (!userId) return;
        try {
            const { data } = await axiosInstance.get(`/notifications/${userId}`);
            setNotifications(data);
        } catch {
            // Non-critical — bell just stays empty
        }
    }, [userId]);

    useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

    // Re-fetch when the browser tab regains focus (catches reminders sent while away)
    useEffect(() => {
        const onVisible = () => {
            if (!document.hidden && userId) fetchNotifications();
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [userId, fetchNotifications]);

    // ── Real-time socket listener — re-fetches from DB on every event ─────
    // This guarantees the bell shows real persisted notifications even if
    // the socket payload shape differs from what the DB returns.
    useEffect(() => {
        if (!userId) return;

        const socket = connectSocket();
        socket.emit('joinUserRoom', { userId });

        const handleNew = (notification) => {
            // Re-fetch from DB so the list is always authoritative
            fetchNotifications();
            // Also show a toast using the socket payload directly
            setToast(notification);
        };

        socket.on('newNotification', handleNew);

        // Fallback polling every 30 s — catches reminders sent while socket was offline
        const pollInterval = setInterval(fetchNotifications, 30000);

        return () => {
            socket.off('newNotification', handleNew);
            clearInterval(pollInterval);
        };
    }, [userId, fetchNotifications]);

    // ── Close dropdown on outside click ────────────────────────────────────
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    // ── Mark all read (API + local state) ──────────────────────────────────
    const handleClearAll = async () => {
        try {
            await axiosInstance.patch(`/notifications/${userId}/read-all`);
        } catch {
            // Best-effort
        }
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    return (
        <>
            {/* Toast */}
            {toast && (
                <NotificationToast
                    notification={toast}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Bell button */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setOpen(o => !o)}
                    aria-label="Notifications"
                    className="relative w-10 h-10 flex items-center justify-center rounded-[0.9rem] text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
                >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[9px] font-black rounded-full border-2 border-white flex items-center justify-center animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>

                {/* Dropdown panel */}
                {open && (
                    <div className="absolute right-0 top-12 z-50 w-[22rem] bg-white rounded-[1.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-slate-800 text-sm">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="text-[9px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full">
                                        {unreadCount} new
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleClearAll}
                                        className="flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-emerald-600 uppercase tracking-wider transition-colors"
                                    >
                                        <CheckCircle2 size={12} /> Mark all read
                                    </button>
                                )}
                                <button
                                    onClick={() => setOpen(false)}
                                    className="p-1 text-slate-300 hover:text-slate-500 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 gap-2">
                                    <Bell size={24} className="text-slate-200" />
                                    <p className="text-slate-400 font-bold text-xs">No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map(n => {
                                    const meta = typeMeta(n.type);
                                    return (
                                        <div
                                            key={n.id}
                                            className={`px-5 py-4 flex items-start gap-3 transition-colors ${!n.isRead ? 'bg-blue-50/40' : 'hover:bg-slate-50/60'}`}
                                        >
                                            <div className={`w-8 h-8 ${meta.bg} rounded-[0.7rem] flex items-center justify-center shrink-0 mt-0.5`}>
                                                {meta.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black text-slate-800 mb-0.5 leading-snug">{n.title}</p>
                                                <p className="text-[11px] font-medium text-slate-600 leading-snug">{n.message}</p>
                                                <p className="text-[10px] text-slate-400 font-medium mt-1">{relativeTime(n.createdAt)}</p>
                                            </div>
                                            {!n.isRead && (
                                                <span className={`w-2 h-2 rounded-full shrink-0 mt-2 ${meta.dot}`} />
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
