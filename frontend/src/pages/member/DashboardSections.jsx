import React from 'react';
import { 
    Zap, RefreshCcw, Calendar, ArrowRight, ShieldCheck, 
    Trophy, CreditCard, Tv2, Plus, ChevronLeft, UserPlus, 
    Users, CalendarDays, Wallet, UserCheck, PackageOpen, 
    ClockIcon, CheckCircle2, XCircle, User, ShieldAlert, 
    Loader2 
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

export const PlansGrid = ({ category, plans = [], loading, onBack, onSelect }) => (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <BackButton onClick={onBack} label="Back to Categories" />

        {loading ? (
            <div className="flex justify-center py-12">
                <Loader2 size={40} className="animate-spin text-blue-600" />
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {plans.map(p => (
                    <div key={p.id} className="bg-white p-10 rounded-[3rem] border-2 border-slate-50 shadow-xl flex flex-col justify-between group">
                        <h3 className="text-5xl font-black text-slate-900 mb-4">
                            {Number(p.amount).toLocaleString()} <span className="text-lg font-bold opacity-30">ETB</span>
                        </h3>
                        <button onClick={() => onSelect(p)} className="mt-8 w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-blue-600 transition-all">
                            SELECT PLAN
                        </button>
                    </div>
                ))}
            </div>
        )}
    </div>
);

export const AvailableGroupsGrid = ({ plan, groups = [], memberships = [], onBack, onJoin }) => {
    const joinedIds = memberships.map(m => m.groupId);

    return (
        <div className="space-y-10">
            <BackButton onClick={onBack} label="Back to Plans" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {groups.map(g => {
                    const isJoined = joinedIds.includes(g.id);
                    return (
                        <div key={g.id} className="bg-white p-10 rounded-[3rem] border-2 border-slate-50 flex flex-col md:flex-row justify-between items-center gap-8 shadow-xl">
                            <div className="flex-1">
                                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">{g.name}</h3>
                                <div className="flex gap-4 mt-6">
                                    <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-3 py-1 rounded-xl">
                                        <Users size={12} className="inline mr-1"/> {g._count?.memberships || 0}/{g.plan?.maxMembers || 6}
                                    </span>
                                </div>
                            </div>
                            {isJoined ? (
                                <div className="bg-emerald-50 text-emerald-600 px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase border border-emerald-100 flex items-center gap-2">
                                    <UserCheck size={16} /> Already Joined
                                </div>
                            ) : (
                                <button onClick={() => onJoin(g)} className="px-10 py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-sm hover:bg-blue-700 shadow-xl transition-all">
                                    JOIN GROUP
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
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

                const currentPayment = myPayments.find(p => 
                    p.groupId === m.groupId && 
                    p.roundNumber === curRound && 
                    p.cycleNumber === curCycle
                );

                return (
                    <div key={m.id} className="py-6 flex flex-col md:flex-row justify-between items-center gap-4 hover:bg-slate-50/50 px-4 rounded-3xl transition-colors">
                        <div>
                            <p className="font-black text-slate-800 text-lg uppercase tracking-tight">{m.group?.name}</p>
                            <p className="text-xs text-slate-400 font-bold uppercase">Cycle {curCycle} • Round {displayRound}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${status.cls}`}>
                                {status.label}
                            </span>
                            
                            {m.status === 'APPROVED' && (
                                <>
                                    {!currentPayment ? (
                                        <button onClick={() => onPay(m)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-xs shadow-lg hover:bg-blue-700 transition-all">
                                            <CreditCard size={14} className="inline mr-1" /> Pay Round {displayRound}
                                        </button>
                                    ) : currentPayment.status === 'PENDING' ? (
                                        <span className="bg-amber-50 text-amber-600 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase border border-amber-100 flex items-center gap-1.5">
                                            <ClockIcon size={12} className="animate-spin" /> Verification Pending
                                        </span>
                                    ) : (
                                        <span className="bg-emerald-50 text-emerald-600 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase border border-emerald-100 flex items-center gap-1.5">
                                            <CheckCircle2 size={12}/> Round {displayRound} Paid
                                        </span>
                                    )}

                                    <button onClick={() => onDraw(m.groupId)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-xs shadow-lg hover:bg-violet-600 transition-all">
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