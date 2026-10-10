// src/components/NotificationBell.jsx
import React, { useState } from 'react';
import { Bell, Trophy, X } from 'lucide-react';

export default function NotificationBell({ notifications, onClear }) {
    const [open, setOpen] = useState(false);
    const unread = notifications.filter(n => !n.read).length;

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(o => !o)}
                className="relative w-10 h-10 flex items-center justify-center rounded-[0.9rem] text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
            >
                <Bell size={20} />
                {unread > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                )}
            </button>

            {open && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

                    {/* Dropdown */}
                    <div className="absolute right-0 top-12 z-50 w-80 bg-white rounded-[1.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                            <h3 className="font-black text-slate-800 text-sm">Notifications</h3>
                            <div className="flex items-center gap-2">
                                {notifications.length > 0 && (
                                    <button onClick={onClear} className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-wider transition-colors">
                                        Clear all
                                    </button>
                                )}
                                <button onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 gap-2">
                                    <Bell size={24} className="text-slate-200" />
                                    <p className="text-slate-400 font-bold text-xs">No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map(n => (
                                    <div key={n.id} className={`px-5 py-4 flex items-start gap-3 ${!n.read ? 'bg-amber-50/50' : ''}`}>
                                        <div className="w-8 h-8 bg-amber-100 rounded-[0.7rem] flex items-center justify-center shrink-0 mt-0.5">
                                            <Trophy size={14} className="text-amber-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-700 leading-snug">{n.message}</p>
                                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{n.time}</p>
                                        </div>
                                        {!n.read && (
                                            <div className="w-2 h-2 bg-amber-400 rounded-full shrink-0 mt-2" />
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
