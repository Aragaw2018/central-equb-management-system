import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Clock, ShieldCheck, ArrowRight } from 'lucide-react';

export default function MaintenancePage() {
    const navigate  = useNavigate();
    const user      = (() => {
        try { return JSON.parse(localStorage.getItem('user')); }
        catch { return null; }
    })();
    const isAdmin   = user?.role === 'ADMIN';

    return (
        <div className="min-h-screen bg-[#005C53] flex items-center justify-center p-6">
            {/* Ambient glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-lg w-full text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">

                {/* Icon */}
                <div className="flex justify-center">
                    <div className="w-28 h-28 bg-white/10 rounded-[2rem] flex items-center justify-center shadow-2xl ring-1 ring-white/20">
                        <Wrench size={56} className="text-white/80" />
                    </div>
                </div>

                {/* Heading */}
                <div className="space-y-3">
                    <h1 className="text-4xl font-black text-white tracking-tight leading-tight">
                        System Under Scheduled Maintenance
                    </h1>
                    <p className="text-white/60 font-medium text-base leading-relaxed">
                        All savings, draws, and payments are safely paused.
                        We will be back shortly.
                    </p>
                </div>

                {/* Status cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                    {[
                        { icon: <ShieldCheck size={18} />, label: 'Your Funds', sub: 'Safe & secured' },
                        { icon: <Clock       size={18} />, label: 'Estimated Time', sub: 'Back shortly' },
                        { icon: <Wrench      size={18} />, label: 'Status', sub: 'Upgrades in progress' },
                    ].map(({ icon, label, sub }) => (
                        <div
                            key={label}
                            className="bg-white/10 backdrop-blur-sm rounded-[1.5rem] px-5 py-4 border border-white/10"
                        >
                            <div className="flex items-center gap-2 text-white/70 mb-1">
                                {icon}
                                <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
                            </div>
                            <p className="text-white font-black text-sm">{sub}</p>
                        </div>
                    ))}
                </div>

                {/* Admin shortcut */}
                {isAdmin ? (
                    <button
                        onClick={() => navigate('/admin-dashboard')}
                        className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-[#005C53] rounded-2xl font-black text-sm shadow-xl hover:bg-slate-50 transition-all active:scale-95"
                    >
                        <ShieldCheck size={16} />
                        Admin Dashboard
                        <ArrowRight size={16} />
                    </button>
                ) : (
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
                        Admin access only during maintenance
                    </p>
                )}
            </div>
        </div>
    );
}
