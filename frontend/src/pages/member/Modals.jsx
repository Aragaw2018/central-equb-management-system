import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import axiosInstance from '../../api/axiosInstance';
import {
    X, CheckCircle2, Trophy, Shield, CreditCard,
    Upload, Landmark, Wallet, Loader2, Search,
    UserPlus, AlertCircle, ShieldCheck, User,
    ShieldAlert, Camera, Map, Fingerprint, FileText, RefreshCw, Sparkles
} from 'lucide-react';

const API_BASE = 'http://localhost:5000';

// ── 1. WINNER CELEBRATION MODAL (Expanded & High-Energy) ──
export function WinnerModal({ data, currentUserId, onClose }) {
    const isWinner = data?.winnerId === currentUserId;
    const winnerName = data?.winnerName || 'Anonymous Member';
    const initials = winnerName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const groupName = data?.groupName || data?.group?.name || 'Equb Circle';
    const roundNumber = data?.roundNumber || 1;
    const potAmount = Number(data?.potAmount || 0).toLocaleString();

    // High-Energy Celebration Multi-Burst Confetti Effect
    useEffect(() => {
        if (!data) return;

        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.5 },
            colors: ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#3b82f6', '#eab308']
        });

        const duration = 4000;
        const animationEnd = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 6,
                angle: 60,
                spread: 70,
                origin: { x: 0, y: 0.6 },
                colors: ['#f59e0b', '#10b981', '#ffd700']
            });
            confetti({
                particleCount: 6,
                angle: 120,
                spread: 70,
                origin: { x: 1, y: 0.6 },
                colors: ['#6366f1', '#ec4899', '#06b6d4']
            });

            if (Date.now() < animationEnd) {
                requestAnimationFrame(frame);
            }
        };

        frame();
    }, [data]);

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-2xl animate-in fade-in duration-300">
            <div className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/30 rounded-[3.5rem] shadow-[0_0_100px_rgba(245,158,11,0.25)] max-w-xl w-full overflow-hidden animate-in zoom-in-90 duration-500 transform transition-all">

                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-20 p-3 bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-all border border-slate-700/60 shadow-lg backdrop-blur-md"
                >
                    <X size={20} />
                </button>

                <div className="relative pt-12 pb-6 px-10 text-center overflow-hidden">
                    <div className="relative inline-flex items-center justify-center mb-4">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full blur-2xl opacity-70 animate-pulse" />
                        <div className="relative w-24 h-24 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 rounded-3xl p-1 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-300">
                            <div className="w-full h-full bg-slate-900/40 backdrop-blur-sm rounded-[22px] flex items-center justify-center">
                                <Trophy className="text-amber-300 drop-shadow-[0_5px_15px_rgba(245,158,11,0.8)]" size={50} />
                            </div>
                        </div>
                    </div>

                    <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-400 uppercase tracking-wider drop-shadow-sm">
                        🎉 Congratulations! 🎉
                    </h2>

                    <div className="mt-3 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-slate-800/90 border border-slate-700/80 text-xs font-bold text-slate-300 backdrop-blur-md shadow-inner">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-slate-200">{groupName}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-amber-400 font-black">Round #{roundNumber}</span>
                    </div>
                </div>

                <div className="px-10 pb-12 text-center relative z-10 space-y-6">
                    <div className="relative p-8 rounded-[3rem] bg-gradient-to-b from-slate-800/90 to-slate-800/40 border border-slate-700/50 backdrop-blur-md shadow-2xl flex flex-col items-center">
                        <div className="relative mb-4">
                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-3xl filter drop-shadow-[0_3px_10px_rgba(245,158,11,0.9)] animate-bounce">
                                👑
                            </div>
                            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 via-emerald-500 to-cyan-500 p-1 shadow-2xl">
                                <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center font-black text-3xl text-amber-400 border border-slate-800">
                                    {initials}
                                </div>
                            </div>

                            {isWinner && (
                                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[11px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-lg border border-emerald-300/40">
                                    You Won!
                                </span>
                            )}
                        </div>

                        <h3 className="text-3xl font-black text-white tracking-tight mt-2">
                            {winnerName}
                        </h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Official Round Winner
                        </p>
                    </div>

                    <div className="relative p-7 rounded-[3rem] bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-blue-500/15 border border-amber-500/40 backdrop-blur-md shadow-inner text-center overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />
                        <p className="text-xs font-black text-amber-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
                            <Sparkles size={16} className="text-amber-400 animate-spin" /> Total Pot Payout
                        </p>
                        <div className="text-5xl font-black text-white tracking-tight flex items-baseline justify-center gap-2.5 drop-shadow-lg mt-1">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-100 to-amber-300">{potAmount}</span>
                            <span className="text-xl font-bold text-amber-400">ETB</span>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className={`w-full py-5 rounded-2xl font-black text-base uppercase tracking-wider shadow-2xl transition-all transform active:scale-95 flex items-center justify-center gap-3 ${isWinner
                            ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white hover:brightness-110 shadow-emerald-900/60 border border-emerald-400/40'
                            : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 hover:brightness-110 shadow-amber-900/60 border border-amber-300/50'
                            }`}
                    >
                        <ShieldCheck size={22} />
                        {isWinner ? 'Claim My Pot' : 'Close'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── 2. PAYMENT SUBMISSION MODAL — Powered by Chapa ──
export function PaymentModal({ membership, onClose, onSubmitted, paymentContext = null }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [demoState, setDemoState] = useState('on-time');

    const baseAmount = Number(membership?.group?.plan?.amount || 0);
    const groupName = membership?.group?.name || 'Equb Group';
    const round = membership?.group?.currentRound || 1;
    const cycle = membership?.group?.cycleNumber || 1;

    const targetRound = paymentContext?.targetRound ?? round;
    const isOverdue = paymentContext?.isOverdue ?? false;

    const rawPenalty = Number(membership?.group?.plan?.penalty || 0);
    const rawT1 = Number(membership?.group?.plan?.tier1Penalty || 0);
    const rawT2 = Number(membership?.group?.plan?.tier2Penalty || 0);
    const rawT3 = Number(membership?.group?.plan?.tier3Penalty || 0);

    const resolvedT1 = rawT1 > 0 ? rawT1 : rawPenalty > 0 ? rawPenalty : baseAmount > 0 ? Math.round(baseAmount * 0.05) : 10;
    const resolvedT2 = rawT2 > 0 ? rawT2 : rawPenalty > 0 ? Math.round(rawPenalty * 1.5) : baseAmount > 0 ? Math.round(baseAmount * 0.10) : 25;
    const resolvedT3 = rawT3 > 0 ? rawT3 : rawPenalty > 0 ? Math.round(rawPenalty * 2.5) : baseAmount > 0 ? Math.round(baseAmount * 0.20) : 50;

    const DEMO_STATES = {
        'on-time': { label: 'On-Time', penalty: 0, pillCls: 'bg-emerald-100 text-emerald-700 border-emerald-200', badge: null },
        'tier1': { label: `Tier 1 (+${resolvedT1})`, penalty: resolvedT1, pillCls: 'bg-yellow-100 text-yellow-700 border-yellow-200', badge: { icon: '⚠️', text: 'Tier 1 Light Penalty Applied', bg: 'bg-yellow-50 border-yellow-300', text2: 'text-yellow-800' } },
        'tier2': { label: `Tier 2 (+${resolvedT2})`, penalty: resolvedT2, pillCls: 'bg-orange-100 text-orange-700 border-orange-200', badge: { icon: '⚠️', text: 'Tier 2 Medium Penalty Applied', bg: 'bg-orange-50 border-orange-300', text2: 'text-orange-800' } },
        'tier3': { label: `Tier 3 (+${resolvedT3})`, penalty: resolvedT3, pillCls: 'bg-red-100 text-red-700 border-red-200', badge: { icon: '🚨', text: 'Tier 3 Severe Penalty Applied', bg: 'bg-red-50 border-red-300', text2: 'text-red-800' } },
        'excluded': { label: 'Excluded', penalty: 0, pillCls: 'bg-red-600 text-white border-red-600', badge: null },
    };

    const demo = DEMO_STATES[demoState];
    const penaltyFee = demo.penalty;
    const totalAmount = baseAmount + penaltyFee;
    const isExcluded = demoState === 'excluded';

    const handleChapaCheckout = async () => {
        if (isExcluded) return;
        setError('');
        setLoading(true);

        try {
            const { data } = await axiosInstance.post('/payments/chapa/initialize', {
                membershipId: membership.id,
                groupId: membership.groupId,
                penaltyOverride: penaltyFee,
            });
            window.location.href = data.checkoutUrl;
        } catch (err) {
            const msg = err.response?.data?.error || err.response?.data?.detail || 'Failed to connect to payment gateway. Please try again.';
            setError(msg);
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                <div className={`p-8 border-b flex justify-between items-center ${isOverdue ? 'bg-gradient-to-r from-red-50 to-orange-50' : 'bg-gradient-to-r from-slate-50 to-blue-50'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-2xl ${isOverdue ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                            <Wallet size={22} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800 leading-tight">
                                {isOverdue ? `Pay Overdue Round ${targetRound}` : 'Pay Contribution'}
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Round {targetRound} · Cycle {cycle}
                                {isOverdue && <span className="ml-2 text-red-500">(Overdue)</span>}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-700">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-5">
                    {isOverdue && (
                        <div className="flex items-start gap-3 px-4 py-4 bg-red-50 border-2 border-red-200 rounded-2xl animate-in fade-in duration-200">
                            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-red-800 font-black text-xs uppercase tracking-wide mb-1">
                                    Overdue Settlement Required
                                </p>
                                <p className="text-red-700 text-xs font-medium leading-relaxed mb-2">
                                    You have an unpaid contribution for <span className="font-black">Round {targetRound}</span>.
                                    You must settle this round first (including the late penalty)
                                    before proceeding to Round {round}.
                                </p>
                                <div className="flex items-center gap-2 text-xs font-black text-red-900">
                                    <span className="bg-white px-2 py-1 rounded-lg border border-red-200">
                                        Base {baseAmount.toLocaleString()} ETB
                                    </span>
                                    <span className="text-red-500">+</span>
                                    <span className="bg-red-100 px-2 py-1 rounded-lg border border-red-200">
                                        Penalty {penaltyFee.toLocaleString()} ETB
                                    </span>
                                    <span className="text-red-500">=</span>
                                    <span className="bg-red-600 text-white px-2 py-1 rounded-lg">
                                        {totalAmount.toLocaleString()} ETB
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-slate-50 rounded-[1.5rem] p-4 border border-slate-200">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <RefreshCw size={10} /> Demo State Simulator
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(DEMO_STATES).map(([key, cfg]) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => { setDemoState(key); setError(''); }}
                                    className={`text-[10px] font-black px-3 py-1.5 rounded-full border transition-all ${demoState === key
                                        ? cfg.pillCls + ' shadow-sm scale-105'
                                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    {cfg.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {demo.badge && (
                        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${demo.badge.bg} animate-in fade-in slide-in-from-top-1 duration-200`}>
                            <span className="text-base leading-none">{demo.badge.icon}</span>
                            <p className={`text-xs font-black uppercase tracking-wide ${demo.badge.text2}`}>
                                {demo.badge.text}
                            </p>
                        </div>
                    )}

                    <div className={`relative p-6 rounded-[2rem] text-center overflow-hidden shadow-xl transition-all duration-300 ${isExcluded
                        ? 'bg-gradient-to-br from-red-700 to-red-900 shadow-red-900/30'
                        : 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-900/30'
                        }`}>
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.1),_transparent)]" />

                        {isExcluded ? (
                            <div className="relative z-10">
                                <p className="text-xs font-black text-red-300 uppercase tracking-widest mb-2">Membership Status</p>
                                <p className="text-2xl font-black text-white tracking-tight">EXCLUDED</p>
                                <p className="text-xs font-bold text-red-300 mt-1">Payment blocked</p>
                            </div>
                        ) : (
                            <div className="relative z-10">
                                {penaltyFee > 0 ? (
                                    <>
                                        <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-2">Amount Breakdown</p>
                                        <div className="flex items-center justify-center gap-3 mb-1">
                                            <div className="text-right">
                                                <p className="text-[9px] font-bold text-blue-300 uppercase">Base</p>
                                                <p className="text-xl font-black text-white">{baseAmount.toLocaleString()}</p>
                                            </div>
                                            <span className="text-blue-300 text-lg font-black">+</span>
                                            <div className="text-left">
                                                <p className="text-[9px] font-bold text-red-300 uppercase">Late Fee</p>
                                                <p className="text-xl font-black text-red-300">{penaltyFee.toLocaleString()}</p>
                                            </div>
                                            <span className="text-blue-300 text-lg font-black">=</span>
                                            <div className="text-left">
                                                <p className="text-[9px] font-bold text-amber-300 uppercase">Total</p>
                                                <p className="text-xl font-black text-amber-200">{totalAmount.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-bold text-blue-300 mt-2">{groupName}</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-xs font-black text-blue-200 uppercase tracking-widest mb-2">Amount Due</p>
                                        <div className="flex items-baseline justify-center gap-2">
                                            <span className="text-5xl font-black text-white tracking-tight">
                                                {totalAmount.toLocaleString()}
                                            </span>
                                            <span className="text-xl font-bold text-blue-200">ETB</span>
                                        </div>
                                        <p className="text-xs font-bold text-blue-300 mt-2">{groupName}</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {!isExcluded && (
                        <div className="flex items-center justify-center gap-3 flex-wrap">
                            {[
                                { label: 'Telebirr', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
                                { label: 'CBE Birr', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
                                { label: 'Awash Pay', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
                                { label: 'Visa / MC', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
                            ].map(m => (
                                <span key={m.label} className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full border ${m.bg} ${m.text} ${m.border} tracking-wider`}>
                                    {m.label}
                                </span>
                            ))}
                        </div>
                    )}

                    <button
                        onClick={handleChapaCheckout}
                        disabled={loading || isExcluded}
                        className={`relative w-full py-5 rounded-[1.8rem] font-black text-base uppercase tracking-wide shadow-2xl transition-all transform active:scale-[0.98] overflow-hidden group flex items-center justify-center gap-3 ${isExcluded
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                            : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:brightness-110 text-white shadow-blue-900/40 disabled:opacity-70 disabled:cursor-not-allowed'
                            }`}
                    >
                        {!loading && !isExcluded && (
                            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                        )}

                        {loading ? (
                            <><Loader2 size={22} className="animate-spin" /><span>Connecting to Chapa...</span></>
                        ) : isExcluded ? (
                            <><AlertCircle size={22} /><span>Payment Blocked</span></>
                        ) : (
                            <><CreditCard size={22} /><span>Pay {totalAmount.toLocaleString()} ETB with Chapa</span></>
                        )}
                    </button>

                    {!isExcluded && (
                        <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <Shield size={13} className="text-emerald-500" />
                            <span>Secured by Chapa · 256-bit SSL Encrypted</span>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-1 duration-200">
                            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-black text-red-700">Payment Gateway Error</p>
                                <p className="text-xs font-bold text-red-600 mt-0.5">{error}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── 3. WINNER NOMINATE MODAL ──
export function WinnerNominateModal({ win, onClose, onSubmitted }) {
    const user = JSON.parse(localStorage.getItem('user'));
    const [phone, setPhone] = useState('');
    const [results, setResults] = useState([]);
    const [selected, setSelected] = useState(null);
    const [searching, setSearching] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async () => {
        if (!phone.trim() || phone.length < 3) return;
        setSearching(true);
        setError('');
        try {
            const res = await axiosInstance.get(`/guarantor/search`, {
                params: {
                    groupId: win.groupId,
                    phone: phone,
                    excludeUserId: user.id
                }
            });
            setResults(res.data);
            if (res.data.length === 0) {
                setError("No eligible members found (only those who haven't won this cycle).");
            }
        } catch (err) {
            setError("Failed to search members. Please try again.");
        } finally {
            setSearching(false);
        }
    };

    const handleNominate = async () => {
        if (!selected) return;
        setSubmitting(true); setError('');
        try {
            await axiosInstance.post('/guarantor/request', {
                drawResultId: win.id,
                guarantorPhoneNumber: selected.phoneNumber,
                userId: user.id
            });
            onSubmitted(); onClose();
        } catch (err) {
            setError(err.response?.data?.error || "Nomination failed.");
        } finally { setSubmitting(false); }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 bg-emerald-50 border-b flex justify-between items-center text-emerald-700">
                    <div className="flex items-center gap-3 text-emerald-700">
                        <div className="bg-white p-2 rounded-xl shadow-sm"><UserPlus size={20} /></div>
                        <h2 className="text-lg font-black uppercase tracking-tighter">Choose Your Wase</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-all text-slate-400"><X size={20} /></button>
                </div>
                <div className="p-8 space-y-6">
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start gap-3 text-amber-700">
                        <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                        <p className="text-[10px] font-bold leading-relaxed">The Wase must be an approved member who hasn't won yet. They will need to submit legal collateral.</p>
                    </div>
                    <div className="flex gap-2">
                        <input type="text" value={phone} onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Search phone (09...)" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none ring-2 ring-transparent focus:ring-emerald-500 transition-all pl-12" />
                        <button onClick={handleSearch} disabled={searching} className="px-5 bg-slate-900 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-lg">{searching ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}</button>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin">
                        {results.map(m => (
                            <button key={m.id} onClick={() => setSelected(m)} className={`w-full p-4 rounded-2xl flex items-center justify-between border-2 transition-all ${selected?.id === m.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-50 bg-slate-50 hover:border-emerald-200'}`}>
                                <div className="flex items-center gap-3 text-left">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${selected?.id === m.id ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>{m.fullName[0].toUpperCase()}</div>
                                    <div><p className="font-black text-slate-800 text-sm">{m.fullName}</p><p className="text-[10px] text-slate-400 font-mono">{m.phoneNumber}</p></div>
                                </div>
                                {selected?.id === m.id && <CheckCircle2 className="text-emerald-500 animate-in zoom-in" size={20} />}
                            </button>
                        ))}
                    </div>
                    {error && <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-2 text-red-600 font-bold text-xs animate-shake"><AlertCircle size={16} /> {error}</div>}
                    <button onClick={handleNominate} disabled={!selected || submitting} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black shadow-xl transition-all flex items-center justify-center gap-3 text-sm uppercase">{submitting ? <Loader2 className="animate-spin" /> : <UserPlus size={20} />} {submitting ? "Processing..." : "Nominate as My Wase"}</button>
                </div>
            </div>
        </div>
    );
}

// ── 4. PROVIDE GUARANTOR MODAL ──
export function ProvideGuarantorModal({ guarantorRequest, onClose, onSubmitted }) {
    const rawStored = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // Active state for guarantor's 12-digit Fayda ID
    const [faydaId, setFaydaId] = useState(rawStored?.faydaId || '');

    // Form & Files State
    const [checkNumber, setCheckNumber] = useState('');
    const [files, setFiles] = useState({ check: null, land: null, fayda: null });
    const [previews, setPreviews] = useState({ check: null, land: null, fayda: null });

    // Status States
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // ── Fetch fresh user profile from backend on mount to guarantee real Fayda ID ──
    useEffect(() => {
        const activeUserId = rawStored?.id;
        if (!activeUserId) return;

        axiosInstance.get(`/users/profile/${activeUserId}`)
            .then(res => {
                const u = res.data?.user || res.data;
                const freshFayda = u?.faydaId || rawStored?.faydaId || '';
                if (freshFayda) {
                    setFaydaId(freshFayda);
                    // Sync fresh faydaId into localStorage so it never shows "Not linked" again
                    localStorage.setItem('user', JSON.stringify({ ...rawStored, ...u, faydaId: freshFayda }));
                }
            })
            .catch(err => console.error("ProvideGuarantor profile fetch error:", err));
    }, [rawStored?.id]);

    const startCamera = async () => {
        setIsCameraActive(true); setError('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            setError("Camera access denied.");
            setIsCameraActive(false);
        }
    };

    const captureFace = () => {
        setScanning(true);
        setTimeout(() => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!video || !canvas) return;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);

            canvas.toBlob((blob) => {
                const capturedFile = new File([blob], "face_verification.jpg", { type: "image/jpeg" });
                setFiles(prev => ({ ...prev, fayda: capturedFile }));
                setPreviews(prev => ({ ...prev, fayda: URL.createObjectURL(capturedFile) }));
                setScanned(true);
                setScanning(false);
                setIsCameraActive(false);
                if (video.srcObject) video.srcObject.getTracks().forEach(t => t.stop());
            }, 'image/jpeg');
        }, 2500);
    };

    const handleFileChange = (field, file) => {
        if (!file) return;
        setFiles(prev => ({ ...prev, [field]: file }));
        setPreviews(prev => ({ ...prev, [field]: URL.createObjectURL(file) }));
    };

    const handleAccept = async () => {
        const finalFin = (faydaId || rawStored?.faydaId || '').trim();

        if (!finalFin) {
            return setError("Your National Fayda ID is required. Please enter or verify your 12-digit FIN.");
        }

        if (!checkNumber || !scanned || !files.check || !files.land) {
            return setError("Please complete all required fields and security steps.");
        }

        setError(''); setLoading(true);
        const fd = new FormData();
        fd.append('status', 'ACCEPTED');
        fd.append('userId', rawStored.id);
        fd.append('checkNumber', checkNumber);
        fd.append('faydaId', finalFin);

        fd.append('checkImage', files.check);
        fd.append('landDoc', files.land);
        fd.append('faydaScan', files.fayda);

        try {
            await axiosInstance.patch(`/guarantor/${guarantorRequest.id}/respond`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            onSubmitted(); onClose();
        } catch (err) {
            setError(err.response?.data?.error || "Submission failed.");
        } finally { setLoading(false); }
    };

    const isReady = checkNumber && scanned && files.check && files.land && (faydaId || rawStored?.faydaId);

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md overflow-y-auto">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-white px-8 py-6 border-b flex justify-between items-center shrink-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#005C53]/10 rounded-xl flex items-center justify-center text-[#005C53]">
                            <ShieldCheck size={24} />
                        </div>
                        <h2 className="font-black text-slate-800 text-lg uppercase tracking-tight">Security Compliance</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                </div>

                {/* Scrollable Form Body */}
                <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* ── National Fayda ID — Auto-filled & Smart Editable fallback ── */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1">
                                <FileText size={12} /> National ID (Fayda) *
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    maxLength={12}
                                    value={faydaId}
                                    onChange={e => {
                                        setFaydaId(e.target.value.replace(/\D/g, '').slice(0, 12));
                                        setError('');
                                    }}
                                    placeholder="Enter 12-digit FIN"
                                    readOnly={Boolean(faydaId && faydaId.length === 12)}
                                    className={`w-full p-4 rounded-2xl font-mono font-bold text-slate-700 outline-none transition-all tracking-widest ${
                                        faydaId && faydaId.length === 12
                                            ? 'bg-slate-100 border-none cursor-not-allowed text-slate-600'
                                            : 'bg-slate-50 border-2 border-slate-200 focus:border-[#005C53]'
                                    }`}
                                />
                                {faydaId && faydaId.length === 12 && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                                        <ShieldCheck size={14} className="text-emerald-600" />
                                    </div>
                                )}
                            </div>
                            {faydaId && faydaId.length === 12 ? (
                                <p className="text-[10px] font-bold text-emerald-600 ml-2 flex items-center gap-1">
                                    <CheckCircle2 size={11} /> Auto-verified from your National Fayda Profile
                                </p>
                            ) : (
                                <p className="text-[10px] font-medium text-slate-400 ml-2">
                                    Please ensure your 12-digit National Fayda ID is entered.
                                </p>
                            )}
                        </div>

                        {/* ── Bank Check Number ── */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1">
                                <Landmark size={12} /> Bank Check Number *
                            </label>
                            <input
                                type="text"
                                value={checkNumber}
                                onChange={e => setCheckNumber(e.target.value)}
                                placeholder="CHK-XXXXXX"
                                className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-[#005C53] transition-all text-slate-800"
                            />
                        </div>
                    </div>

                    {/* ── Document uploads ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <label className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-[2rem] cursor-pointer transition-all ${previews.check ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                            {previews.check
                                ? <img src={previews.check} className="h-24 w-full object-cover rounded-xl" alt="Check" />
                                : <><Landmark size={24} className="text-slate-300 mb-2" /><span className="text-[10px] font-black text-slate-500 uppercase">Bank Check Photo *</span></>}
                            <input type="file" className="hidden" onChange={e => handleFileChange('check', e.target.files[0])} accept="image/*" />
                        </label>
                        <label className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-[2rem] cursor-pointer transition-all ${previews.land ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                            {previews.land
                                ? <img src={previews.land} className="h-24 w-full object-cover rounded-xl" alt="Land deed" />
                                : <><Map size={24} className="text-slate-300 mb-2" /><span className="text-[10px] font-black text-slate-500 uppercase">Land Title Deed *</span></>}
                            <input type="file" className="hidden" onChange={e => handleFileChange('land', e.target.files[0])} accept="image/*" />
                        </label>
                    </div>

                    {/* ── Face verification camera ── */}
                    <div className="relative bg-slate-900 rounded-[2.5rem] overflow-hidden min-h-[220px] flex flex-col items-center justify-center p-6 border-4 border-slate-800 shadow-2xl">
                        {isCameraActive ? (
                            <div className="w-full text-center space-y-3">
                                <video ref={videoRef} autoPlay playsInline className="w-full h-40 object-cover rounded-2xl bg-black" />
                                <button onClick={captureFace} disabled={scanning} className="w-full py-3 bg-[#005C53] text-white rounded-2xl font-black text-xs uppercase">
                                    {scanning ? "Analyzing..." : "Capture Face Scan"}
                                </button>
                            </div>
                        ) : scanned ? (
                            <div className="text-center animate-in zoom-in">
                                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle2 size={40} className="text-white" />
                                </div>
                                <p className="text-emerald-400 font-black text-base uppercase">Identity Verified</p>
                                <button onClick={startCamera} className="mt-2 text-slate-400 text-[10px] font-bold underline">Retake Photo</button>
                            </div>
                        ) : (
                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                                    <Camera size={30} className="text-slate-500" />
                                </div>
                                <p className="text-white font-black text-sm uppercase">Face Verification Required</p>
                                <button onClick={startCamera} className="px-8 py-3 bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-white/20 transition-all">
                                    Activate Camera
                                </button>
                            </div>
                        )}
                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    {/* ── Legal disclaimer + error ── */}
                    <div className="space-y-4">
                        <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-4 flex gap-3 items-start">
                            <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={18} />
                            <p className="text-[10px] font-bold text-amber-800 leading-relaxed italic">
                                Legal Accountability: By submitting, I legally commit to ensure the winner's future contributions. My assets serve as collateral.
                            </p>
                        </div>
                        {error && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-2 text-xs font-black animate-in fade-in">
                                <AlertCircle size={18} /> {error}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleAccept}
                        disabled={!isReady || loading}
                        className={`w-full py-5 rounded-[1.8rem] font-black text-sm shadow-2xl transition-all flex items-center justify-center gap-3 uppercase
                            ${isReady && !loading ? 'bg-[#005C53] hover:bg-[#004a42] text-white active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                        {loading ? "Processing..." : "Finalize Legal Wase Agreement"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── DEFAULT EXPORT ──
const modals = { WinnerModal, PaymentModal, WinnerNominateModal, ProvideGuarantorModal };
export default modals;