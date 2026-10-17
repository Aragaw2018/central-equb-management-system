import React from 'react';
import {
    Zap, RefreshCcw, Calendar, ArrowRight, ShieldCheck,
    Trophy, CreditCard, Tv2, Plus, ChevronLeft, UserPlus,
    Users, CalendarDays, Wallet, UserCheck, PackageOpen,
    ClockIcon, CheckCircle2, XCircle, X, User, ShieldAlert,
    Loader2, Sparkles, BadgeCheck, Building2,
} from 'lucide-react';

// Status configurations
const STS = {
    PENDING: { label: 'Pending Approval', cls: 'bg-amber-100 text-amber-700', Icon: ClockIcon },
    APPROVED: { label: 'Approved', cls: 'bg-emerald-100 text-emerald-700', Icon: CheckCircle2 },
    REJECTED: { label: 'Rejected', cls: 'bg-red-100 text-red-600', Icon: XCircle },
};

const PAY_STS = {
    PENDING: { label: 'Verification Pending', cls: 'bg-amber-50 text-amber-600 border-amber-100' },
    APPROVED: { label: 'Paid', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' }
};

// Helper utilities
const getDisplayRound = (round, maxMembers) => {
    if (!round) return 1;
    return ((round - 1) % (maxMembers || 6)) + 1;
};

// Reusable Back Button Component
const BackButton = ({ onClick, label }) => (
    <button
        onClick={onClick}
        className="group flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 rounded-full text-slate-500 font-bold hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm"
    >
        <ChevronLeft size={20} /> {label}
    </button>
);

// -- Winner Payout Card — with per-win dismiss persisted to localStorage -----------
export const WinnerPayoutCard = ({ wins = [], currentUserId }) => {
    const [dismissed, setDismissed] = React.useState({});

    const handleDismiss = (winId) => {
        localStorage.setItem('dismissed_win_' + winId, 'true');
        setDismissed(prev => ({ ...prev, [winId]: true }));
    };

    const visible = wins.filter(w =>
        w.isFundsReleased &&
        w.winnerId === currentUserId &&
        localStorage.getItem('dismissed_win_' + w.id) !== 'true' &&
        !dismissed[w.id]
    );

    if (visible.length === 0) return null;

    return (
        <div className='space-y-5 mb-10'>
            {visible.map(win => {
                const totalPot = parseFloat(win.potAmount ?? 0);
                const feePct = 2;
                const platformFee = parseFloat(((totalPot * feePct) / 100).toFixed(2));
                const netPayout = parseFloat((totalPot - platformFee).toFixed(2));
                const groupName = win.group?.name || 'Your Equb';
                const displayRound = win.roundNumber || 1;
                const winner = win.winner || {};
                const bankName = winner.bankName || null;
                const accountNum = winner.accountNumber || null;
                const accountHolder = winner.accountHolder || winner.fullName || null;

                // Display destination: use configured bank if available, else Telebirr phone fallback
                const destinationLabel = bankName
                    ? bankName
                    : 'Telebirr (Registered Phone)';
                const destinationSub = accountNum
                    ? `${accountNum}${accountHolder ? ' · ' + accountHolder : ''}`
                    : winner.phoneNumber || 'Payout via registered phone';
                return (
                    <div key={win.id} className='relative overflow-hidden rounded-[3rem] shadow-2xl shadow-amber-900/20 animate-in fade-in duration-700'>
                        <div className='absolute inset-0 bg-gradient-to-br from-amber-400 via-yellow-300 to-orange-400' />
                        <div className='absolute -top-20 -right-20 w-64 h-64 bg-white/20 rounded-full blur-3xl pointer-events-none' />
                        <div className='relative z-10 p-8 md:p-10'>
                            <div className='flex items-start justify-between gap-4 mb-8'>
                                <div className='flex items-center gap-4'>
                                    <div className='w-14 h-14 bg-white/30 rounded-[1.2rem] flex items-center justify-center shadow-lg'><Trophy size={28} className='text-amber-900' /></div>
                                    <div>
                                        <div className='flex items-center gap-2 mb-0.5'><Sparkles size={14} className='text-amber-700' /><p className='text-[10px] font-black text-amber-800 uppercase tracking-[0.25em]'>Congratulations!</p></div>
                                        <h2 className='text-xl md:text-2xl font-black text-amber-950'>{winner.fullName || 'You'} Won Round #{displayRound}!</h2>
                                        <p className='text-amber-800 font-bold text-sm mt-0.5'>{groupName}</p>
                                    </div>
                                </div>
                                <div className='flex items-center gap-3 shrink-0'>
                                    <div className='hidden sm:flex items-center gap-2 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg'>
                                        <BadgeCheck size={13} /> Transferred
                                    </div>
                                    <button
                                        onClick={() => handleDismiss(win.id)}
                                        title='Dismiss this card'
                                        aria-label='Dismiss win card'
                                        className='w-9 h-9 flex items-center justify-center rounded-full bg-amber-900/20 hover:bg-amber-900/40 text-amber-900 hover:text-amber-950 transition-all active:scale-90 shadow-sm'
                                    >
                                        <X size={16} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
                                <div className='bg-white/30 rounded-[1.5rem] p-5 border border-white/40'>
                                    <p className='text-[9px] font-black text-amber-800 uppercase tracking-widest mb-1'>Total Pot Won</p>
                                    <p className='text-2xl font-black text-amber-950'>{totalPot.toLocaleString()} <span className='text-sm font-bold opacity-70'>ETB</span></p>
                                </div>
                                <div className='bg-white/20 rounded-[1.5rem] p-5 border border-white/30'>
                                    <p className='text-[9px] font-black text-amber-800 uppercase tracking-widest mb-1'>Service Fee ({feePct}%)</p>
                                    <p className='text-2xl font-black text-amber-900'>- {platformFee.toLocaleString()} <span className='text-sm font-bold opacity-70'>ETB</span></p>
                                </div>
                                <div className='bg-emerald-600 rounded-[1.5rem] p-5 shadow-xl'>
                                    <p className='text-[9px] font-black text-emerald-200 uppercase tracking-widest mb-1'>Net Deposited</p>
                                    <p className='text-2xl font-black text-white'>{netPayout.toLocaleString()} <span className='text-sm font-bold text-emerald-200'>ETB</span></p>
                                </div>
                            </div>
                            <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/25 rounded-[1.5rem] px-6 py-4 border border-white/40'>
                                <div className='flex items-center gap-3'>
                                    <Building2 size={18} className='text-amber-800 shrink-0' />
                                    <div>
                                        <p className='text-[9px] font-black text-amber-800 uppercase tracking-widest'>Destination Account</p>
                                        <p className='font-black text-amber-950 text-sm'>{destinationLabel}</p>
                                        <p className='text-amber-800 font-mono text-xs mt-0.5'>{destinationSub}</p>
                                    </div>
                                </div>
                                <div className='flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-800 text-[10px] font-black uppercase px-4 py-2 rounded-full'>
                                    <CheckCircle2 size={12} /> Completed
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};


// ── Winner Payout Card ─────────────────────────────────────────────────────────

export const CategoryCards = ({ onSelect }) => {
    const CAT_CONFIG = {
        DAILY: { label: 'Daily Equb', desc: 'Save and win every 24 hours', icon: <Zap size={28} />, bg: 'bg-orange-50', accent: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-100', shadow: 'shadow-orange-200/40' },
        WEEKLY: { label: 'Weekly Equb', desc: 'Traditional weekly savings cycle', icon: <RefreshCcw size={28} />, bg: 'bg-blue-50', accent: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-100', shadow: 'shadow-blue-200/40' },
        MONTHLY: { label: 'Monthly Equb', desc: 'High-value long term savings', icon: <Calendar size={28} />, bg: 'bg-emerald-50', accent: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-100', shadow: 'shadow-emerald-200/40' }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Object.entries(CAT_CONFIG).map(([id, cfg]) => (
                <button
                    key={id}
                    onClick={() => onSelect(id)}
                    className={`relative group overflow-hidden ${cfg.bg} ${cfg.border} border-2 rounded-[2.5rem] p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${cfg.shadow} text-left flex flex-col h-full`}
                >
                    <div className={`w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-8 group-hover:scale-110 transition-all ${cfg.text}`}>
                        {cfg.icon}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">{cfg.label}</h3>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">{cfg.desc}</p>
                    </div>
                    <div className={`flex items-center justify-between py-3 px-6 ${cfg.accent} rounded-2xl text-white`}>
                        <span className="text-xs font-black uppercase">See Plans</span>
                        <ArrowRight size={16} />
                    </div>
                </button>
            ))}
        </div>
    );
};

export const PlansGrid = ({ category, plans = [], loading, onBack, onSelect }) => {
    const CAT_COLOR = {
        DAILY: { pill: 'bg-violet-100 text-violet-700', bar: 'from-violet-500 to-violet-400', dot: 'bg-violet-500' },
        WEEKLY: { pill: 'bg-blue-100   text-blue-700', bar: 'from-blue-500   to-blue-400', dot: 'bg-blue-500' },
        MONTHLY: { pill: 'bg-emerald-100 text-emerald-700', bar: 'from-emerald-500 to-emerald-400', dot: 'bg-emerald-500' },
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <BackButton onClick={onBack} label="Back to Categories" />

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 size={40} className="animate-spin text-[#005C53]" />
                </div>
            ) : plans.length === 0 ? (
                <div className="py-20 text-center text-slate-400">
                    <PackageOpen size={44} className="mx-auto mb-4 opacity-30" />
                    <p className="font-bold">No plans available for this category yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {plans.map(p => {
                        const c = CAT_COLOR[p.category] || CAT_COLOR.MONTHLY;
                        return (
                            <div
                                key={p.id}
                                className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                            >
                                {/* Colour accent bar */}
                                <div className={`h-2 w-full bg-gradient-to-r ${c.bar}`} />

                                <div className="p-8 flex flex-col flex-1">
                                    {/* Category pill */}
                                    <div className="flex items-center gap-2 mb-5">
                                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${c.pill}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                                            {p.category} Equb
                                        </span>
                                    </div>

                                    {/* Amount — hero number */}
                                    <div className="mb-2">
                                        <span className="text-5xl font-black text-slate-900 tracking-tight">
                                            {Number(p.amount).toLocaleString()}
                                        </span>
                                        <span className="text-xl font-bold text-slate-400 ml-2">ETB</span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                                        Per contribution cycle
                                    </p>

                                    {/* Stats row */}
                                    <div className="flex items-center gap-4 mb-6 flex-wrap">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                            <Users size={13} className="text-slate-400" />
                                            Up to {p.maxMembers} members
                                        </div>
                                        {p.description && (
                                            <p className="text-xs text-slate-400 font-medium leading-relaxed line-clamp-2 mt-2 w-full">
                                                {p.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="mt-auto">
                                        <button
                                            onClick={() => onSelect(p)}
                                            className="w-full py-4 bg-[#005C53] hover:bg-[#004a42] text-white rounded-2xl font-black text-sm shadow-lg shadow-[#005C53]/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                        >
                                            View Groups &amp; Join <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export const AvailableGroupsGrid = ({ plan, groups = [], memberships = [], onBack, onJoin, isKycVerified = true, onKycRequired }) => {
    const joinedIds = memberships.map(m => m.groupId);

    const CAT_COLOR = {
        DAILY: { pill: 'bg-violet-100 text-violet-700 border-violet-200', bar: 'from-violet-500 to-violet-400' },
        WEEKLY: { pill: 'bg-blue-100   text-blue-700   border-blue-200', bar: 'from-blue-500   to-blue-400' },
        MONTHLY: { pill: 'bg-emerald-100 text-emerald-700 border-emerald-200', bar: 'from-emerald-500 to-emerald-400' },
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <BackButton onClick={onBack} label="Back to Plans" />

            {groups.length === 0 ? (
                <div className="py-20 text-center text-slate-400">
                    <PackageOpen size={44} className="mx-auto mb-4 opacity-30" />
                    <p className="font-bold">No open groups for this plan yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {groups.map(g => {
                        const isJoined = joinedIds.includes(g.id);
                        const enrolled = g._count?.memberships || 0;
                        const maxM = g.plan?.maxMembers || plan?.maxMembers || 10;
                        const fillPct = maxM > 0 ? Math.min(100, Math.round((enrolled / maxM) * 100)) : 0;
                        const cat = g.plan?.category || plan?.category || 'MONTHLY';
                        const c = CAT_COLOR[cat] || CAT_COLOR.MONTHLY;
                        const amount = Number(g.plan?.amount || plan?.amount || 0);
                        const roundPot = amount * enrolled;
                        const organizer = g.organizer?.fullName || 'N/A';

                        return (
                            <div
                                key={g.id}
                                className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col"
                            >
                                {/* Colour bar */}
                                <div className={`h-2 w-full bg-gradient-to-r ${c.bar}`} />

                                <div className="p-8 flex flex-col gap-5 flex-1">
                                    {/* Header row */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight truncate">
                                                {g.name}
                                            </h3>
                                            {/* Organizer badge */}
                                            <div className="flex items-center gap-1.5 mt-1.5">
                                                <User size={12} className="text-slate-400 shrink-0" />
                                                <span className="text-xs font-bold text-slate-500">
                                                    Organized by: <span className="text-slate-700 font-black">{organizer}</span>
                                                </span>
                                            </div>
                                        </div>
                                        {/* Category pill */}
                                        <span className={`text-[9px] font-black px-2.5 py-1.5 rounded-full border uppercase tracking-wide shrink-0 ${c.pill}`}>
                                            {cat}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    {g.description && (
                                        <p className="text-xs text-slate-400 font-medium leading-relaxed -mt-2">
                                            {g.description}
                                        </p>
                                    )}

                                    {/* Financial stats */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">
                                                Cycle Amount
                                            </p>
                                            <p className="text-lg font-black text-slate-900">
                                                {amount.toLocaleString()}
                                                <span className="text-xs font-bold text-slate-400 ml-1">ETB</span>
                                            </p>
                                        </div>
                                        <div className="bg-[#005C53]/8 rounded-2xl p-4 border border-[#005C53]/15">
                                            <p className="text-[9px] font-black text-[#005C53]/60 uppercase tracking-wider mb-1">
                                                Current Pot
                                            </p>
                                            <p className="text-lg font-black text-[#005C53]">
                                                {roundPot.toLocaleString()}
                                                <span className="text-xs font-bold text-[#005C53]/60 ml-1">ETB</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Capacity */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-black text-slate-600 flex items-center gap-1.5">
                                                <Users size={13} className="text-slate-400" />
                                                {enrolled} of {maxM} Members Capacity
                                            </span>
                                            <span className="text-xs font-black text-[#005C53]">{fillPct}%</span>
                                        </div>
                                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-[#005C53] to-[#00A896] transition-all duration-700"
                                                style={{ width: `${fillPct}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Start date */}
                                    {g.startDate && (
                                        <p className="text-[10px] font-bold text-slate-400 -mt-1">
                                            Started {new Date(g.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                    )}

                                    {/* CTA */}
                                    <div className="mt-auto pt-2">
                                        {isJoined ? (
                                            <div className="w-full py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-sm border border-emerald-100 flex items-center justify-center gap-2">
                                                <UserCheck size={16} /> Already Joined
                                            </div>
                                        ) : !isKycVerified ? (
                                            <button
                                                onClick={onKycRequired}
                                                className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-sm border-2 border-dashed border-slate-300 flex items-center justify-center gap-2 hover:bg-[#005C53]/10 hover:text-[#005C53] hover:border-[#005C53]/40 transition-all"
                                            >
                                                <ShieldAlert size={15} /> Fayda Verification Required
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => onJoin(g)}
                                                className="w-full py-4 bg-[#005C53] hover:bg-[#004a42] text-white rounded-2xl font-black text-sm shadow-lg shadow-[#005C53]/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                            >
                                                <UserPlus size={16} /> Join This Group
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export const ActionRequiredSection = ({ myWins = [], onNominate }) => {
    const needsAction = myWins.filter(win => !win.isFundsReleased);

    if (needsAction.length === 0) return null;

    return (
        <div className="bg-emerald-50 border-2 border-emerald-100 rounded-[2.5rem] p-8 shadow-sm mb-10 animate-in fade-in duration-700">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-emerald-500 p-2 rounded-xl text-white shadow-lg shadow-emerald-200">
                    <ShieldCheck size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Action Required</h2>
                    <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest">Legal Assets Required for Fund Release</p>
                </div>
            </div>

            <div className="space-y-4">
                {needsAction.map(win => {
                    const guarantorRecord = win.guarantor;
                    const status = guarantorRecord?.status;

                    return (
                        <div key={win.id} className="bg-white p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm border border-emerald-100 hover:border-emerald-300 transition-all">
                            <div>
                                <h3 className="font-black text-slate-800 text-lg">
                                    {win.group?.name} • Round {getDisplayRound(win.roundNumber, win.group?.plan?.maxMembers)}
                                </h3>
                                <p className="text-xs text-slate-400 font-bold uppercase mt-1">
                                    {status === 'PENDING'
                                        ? `Nominated: ${guarantorRecord?.guarantor?.fullName || 'N/A'}`
                                        : status === 'ACCEPTED'
                                            ? `Guarantor: ${guarantorRecord?.guarantor?.fullName || 'N/A'}`
                                            : "Status: Awaiting Legal Assets"}
                                </p>
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto">
                                {!status || status === 'REJECTED' ? (
                                    <button
                                        onClick={() => onNominate(win)}
                                        className="w-full md:w-auto bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-xs hover:bg-slate-900 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                                    >
                                        <UserPlus size={16} /> Select Guarantor
                                    </button>
                                ) : status === 'PENDING' ? (
                                    <span className="w-full md:w-auto bg-amber-50 text-amber-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase border border-amber-100 flex items-center justify-center gap-2 italic">
                                        <Loader2 size={14} className="animate-spin" /> Pending Acceptance
                                    </span>
                                ) : (
                                    <span className="w-full md:w-auto bg-blue-50 text-blue-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase border border-blue-100 flex items-center justify-center gap-2">
                                        <CheckCircle2 size={14} /> Guarantor Accepted
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const ReceivedGuarantorRequestsSection = ({ requests = [], onAccept, onReject }) => {
    if (requests.length === 0) return null;

    return (
        <div className="bg-amber-50 border-2 border-amber-100 rounded-[2.5rem] p-8 shadow-sm mb-10">
            <div className="flex items-center gap-3 mb-6">
                <ShieldAlert className="text-amber-600" size={24} />
                <h2 className="text-xl font-black text-slate-800">Wase Requests</h2>
            </div>
            <div className="space-y-4">
                {requests.map(req => (
                    <div key={req.id} className="bg-white p-6 rounded-3xl border border-amber-100 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
                        <p className="text-sm font-bold text-slate-700 flex-1">
                            <span className="font-black text-blue-600">{req.drawResult?.winner?.fullName}</span> nominated you as a Wase.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => onAccept(req)} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-blue-600 transition-all">
                                ACCEPT & UPLOAD
                            </button>
                            <button onClick={() => onReject(req.id)} className="px-6 py-3 bg-white border border-red-100 text-red-500 rounded-2xl font-black text-xs">
                                DECLINE
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const JoinRequestsSection = ({ memberships = [], myPayments = [], onPay, onDraw }) => (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
        <h2 className="font-black text-slate-800 text-xl mb-6 flex items-center gap-3">
            <Plus className="text-blue-500" /> My Memberships
        </h2>
        <div className="divide-y divide-slate-100">
            {memberships.map(m => {
                const status = STS[m.status] || STS.PENDING;
                const curRound = m.group?.currentRound || 1;
                const curCycle = m.group?.cycleNumber || 1;
                const max = m.group?.plan?.maxMembers || 6;
                const displayRound = getDisplayRound(curRound, max);

                // ── Find earliest unpaid round (client-side scan) ──────────
                // We check payments for rounds 1 … curRound to find the
                // first gap (no APPROVED payment). Falls back to curRound.
                const paidRounds = new Set(
                    (myPayments || [])
                        .filter(p =>
                            p.groupId === m.groupId &&
                            p.cycleNumber === curCycle &&
                            p.status === 'APPROVED'
                        )
                        .map(p => p.roundNumber)
                );

                let targetRound = curRound;
                for (let r = 1; r <= curRound; r++) {
                    if (!paidRounds.has(r)) { targetRound = r; break; }
                }
                const isOverdue = targetRound < curRound;

                // Existing payment record for targetRound (may be PENDING)
                const targetPayment = myPayments.find(p =>
                    p.groupId === m.groupId &&
                    p.roundNumber === targetRound &&
                    p.cycleNumber === curCycle
                );

                return (
                    <div key={m.id} className="py-6 flex flex-col md:flex-row justify-between items-center gap-4 hover:bg-slate-50/50 px-4 rounded-3xl transition-colors">
                        <div>
                            <p className="font-black text-slate-800 text-lg uppercase tracking-tight">{m.group?.name}</p>
                            <div className="flex items-center gap-2 flex-wrap mt-1">
                                <p className="text-xs text-slate-400 font-bold uppercase">Cycle {curCycle} &bull; Round {displayRound}</p>
                                {isOverdue && (
                                    <span className="text-[9px] font-black px-2 py-0.5 bg-red-100 text-red-700 rounded-full uppercase border border-red-200">
                                        Round {targetRound} Overdue
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap justify-end">
                            <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${status.cls}`}>
                                {status.label}
                            </span>

                            {m.status === 'APPROVED' && (
                                <>
                                    {/* ── Payment action button ──────────────── */}
                                    {!targetPayment || targetPayment.status === 'REJECTED' ? (
                                        isOverdue ? (
                                            // Attention-grabbing overdue button
                                            <button
                                                onClick={() => onPay(m, { targetRound, isOverdue })}
                                                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-black text-xs shadow-lg transition-all flex items-center gap-1.5 animate-pulse"
                                            >
                                                <CreditCard size={14} />
                                                Pay Overdue Round {targetRound} (Late)
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => onPay(m, { targetRound, isOverdue })}
                                                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-xs shadow-lg hover:bg-blue-700 transition-all"
                                            >
                                                <CreditCard size={14} className="inline mr-1" /> Pay Round {displayRound}
                                            </button>
                                        )
                                    ) : targetPayment.status === 'PENDING' ? (
                                        <span className="bg-amber-50 text-amber-600 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase border border-amber-100 flex items-center gap-1.5">
                                            <ClockIcon size={12} className="animate-spin" /> Verification Pending
                                        </span>
                                    ) : (
                                        <span className="bg-emerald-50 text-emerald-600 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase border border-emerald-100 flex items-center gap-1.5">
                                            <CheckCircle2 size={12} /> Round {isOverdue ? targetRound : displayRound} Paid
                                        </span>
                                    )}

                                    <button
                                        onClick={() => onDraw(m.groupId)}
                                        className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-xs shadow-lg hover:bg-violet-600 transition-all"
                                    >
                                        <Tv2 size={14} className="inline mr-1" /> Live Draw
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);

export const RoundHistorySection = ({ history = [], memberships = [] }) => {
    if (history.length === 0) return null;

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden mt-10">
            <div className="px-8 py-6 border-b flex items-center gap-3 bg-slate-50/50">
                <Trophy className="text-amber-500" size={22} />
                <h2 className="font-black text-slate-800 text-lg uppercase tracking-tight">System Round History</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        <tr>
                            <th className="px-8 py-4">Round</th>
                            <th className="px-8 py-4">Winner</th>
                            <th className="px-8 py-4">Group</th>
                            <th className="px-8 py-4 text-right">Pot Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {history.map(w => {
                            const currentMembership = Array.isArray(memberships)
                                ? memberships.find(m => m.groupId === w.groupId)
                                : null;
                            const max = currentMembership?.group?.plan?.maxMembers || 6;
                            return (
                                <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-4 font-black text-slate-400 text-xs">#{getDisplayRound(w.roundNumber, max)}</td>
                                    <td className="px-8 py-4 font-bold text-slate-700 text-sm uppercase">{w.winnerName || w.winner?.fullName}</td>
                                    <td className="px-8 py-4 text-slate-500 text-sm font-medium uppercase">{w.groupName || w.group?.name}</td>
                                    <td className="px-8 py-4 text-right font-black text-slate-900">{Number(w.potAmount || 0).toLocaleString()} ETB</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const SuccessView = ({ onHome }) => (
    <div className="py-20 text-center space-y-6 animate-in zoom-in-95">
        <div className="bg-emerald-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
            <UserCheck size={48} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Request Sent Successfully!</h2>
        <button onClick={onHome} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-blue-600 transition-all uppercase text-[10px] tracking-widest">
            BACK TO DASHBOARD
        </button>
    </div>
);
