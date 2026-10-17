// frontend/src/pages/PaymentCallback.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import {
    CheckCircle2, XCircle, Loader2, ArrowRight,
    AlertTriangle, RefreshCw, Home, Receipt,
} from 'lucide-react';

// ── Status enum ────────────────────────────────────────────────────────────────
const STATUS = {
    VERIFYING: 'verifying',
    SUCCESS:   'success',
    FAILED:    'failed',
    NO_REF:    'no_ref',
};

// ── Animated spinner ───────────────────────────────────────────────────────────
function VerifyingView() {
    return (
        <div className="flex flex-col items-center gap-8 text-center">
            {/* Multi-ring spinner */}
            <div className="relative w-28 h-28">
                <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin" />
                <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-indigo-400 animate-spin"
                    style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Receipt size={28} className="text-blue-600" />
                </div>
            </div>

            <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-800">Verifying Payment</h2>
                <p className="text-slate-500 font-medium max-w-xs">
                    Securely confirming your transaction with Chapa. This only takes a moment...
                </p>
            </div>

            {/* Animated progress bar */}
            <div className="w-64 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse"
                    style={{ width: '70%', transition: 'width 1s ease' }} />
            </div>
        </div>
    );
}

// ── Success view ───────────────────────────────────────────────────────────────
function SuccessView({ payment, txRef, onDashboard }) {
    const amount    = Number(payment?.amount || 0).toLocaleString();
    const groupName = payment?.group?.name || 'Your Equb Group';
    const round     = payment?.roundNumber || '—';
    const cycle     = payment?.cycleNumber || '—';

    // Celebrate with a subtle glow pulse on mount
    return (
        <div className="flex flex-col items-center gap-8 text-center animate-in zoom-in-95 fade-in duration-500">
            {/* Success icon */}
            <div className="relative">
                <div className="absolute inset-0 bg-emerald-400 rounded-full blur-2xl opacity-25 animate-pulse" />
                <div className="relative w-28 h-28 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-900/20">
                    <CheckCircle2 size={52} className="text-white" strokeWidth={2.5} />
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-xs font-black text-emerald-600 uppercase tracking-[0.25em]">
                    Payment Approved Automatically!
                </p>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                    You're all set! 🎉
                </h2>
                <p className="text-slate-500 font-medium">
                    Your Equb contribution has been verified and recorded.
                </p>
            </div>

            {/* Receipt card */}
            <div className="w-full max-w-sm bg-gradient-to-b from-slate-50 to-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-4 text-left">

                {/* Amount — hero field */}
                <div className="flex items-baseline justify-between pb-4 border-b border-slate-100">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Amount Paid</span>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-800">{amount}</span>
                        <span className="text-sm font-bold text-slate-400">ETB</span>
                    </div>
                </div>

                {[
                    { label: 'Group',           value: groupName },
                    { label: 'Round',           value: `Round ${round} · Cycle ${cycle}` },
                    { label: 'Transaction Ref', value: txRef, mono: true },
                    { label: 'Status',          value: 'Approved ✅', green: true },
                ].map(({ label, value, mono, green }) => (
                    <div key={label} className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
                        <span className={`text-xs font-bold text-right max-w-[180px] truncate
                            ${mono  ? 'font-mono text-slate-600' : ''}
                            ${green ? 'text-emerald-600'         : 'text-slate-700'}
                        `}>
                            {value}
                        </span>
                    </div>
                ))}
            </div>

            {/* CTA */}
            <button
                onClick={onDashboard}
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white rounded-[1.5rem] font-black shadow-xl shadow-blue-900/20 transition-all transform active:scale-95 uppercase tracking-wide"
            >
                Back to Dashboard <ArrowRight size={18} />
            </button>
        </div>
    );
}

// ── Failed view ────────────────────────────────────────────────────────────────
function FailedView({ txRef, errorMsg, onRetry, onDashboard }) {
    return (
        <div className="flex flex-col items-center gap-8 text-center animate-in zoom-in-95 fade-in duration-500">
            {/* Failure icon */}
            <div className="relative">
                <div className="absolute inset-0 bg-red-400 rounded-full blur-2xl opacity-20 animate-pulse" />
                <div className="relative w-28 h-28 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center shadow-2xl shadow-red-900/20">
                    <XCircle size={52} className="text-white" strokeWidth={2.5} />
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-xs font-black text-red-500 uppercase tracking-[0.25em]">
                    Payment Verification Failed
                </p>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                    Something went wrong
                </h2>
                <p className="text-slate-500 font-medium max-w-xs">
                    {errorMsg || "We couldn't verify your payment. Please try again or contact support."}
                </p>
            </div>

            {/* Error detail card */}
            <div className="w-full max-w-sm bg-red-50 border border-red-100 rounded-[1.5rem] p-5 space-y-2 text-left">
                <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangle size={15} className="shrink-0" />
                    <p className="text-[10px] font-black uppercase tracking-widest">What to do</p>
                </div>
                <ul className="space-y-1.5 ml-1">
                    {[
                        'Check your Telebirr / CBE app for the transaction status.',
                        'If money was deducted, click "Retry Verification" below.',
                        'If the problem persists, contact support with your reference.',
                    ].map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs font-medium text-red-700">
                            <span className="w-1.5 h-1.5 bg-red-400 rounded-full shrink-0 mt-1.5" />
                            {tip}
                        </li>
                    ))}
                </ul>
                {txRef && (
                    <p className="mt-2 pt-2 border-t border-red-200 text-[10px] font-mono text-red-500">
                        Ref: {txRef}
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                <button
                    onClick={onRetry}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-[1.5rem] font-black shadow-xl shadow-red-900/20 transition-all transform active:scale-95 uppercase text-sm"
                >
                    <RefreshCw size={17} /> Retry Verification
                </button>
                <button
                    onClick={onDashboard}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[1.5rem] font-black transition-all transform active:scale-95 uppercase text-sm"
                >
                    <Home size={17} /> Dashboard
                </button>
            </div>
        </div>
    );
}

// ── No tx_ref view ─────────────────────────────────────────────────────────────
function NoRefView({ onDashboard }) {
    return (
        <div className="flex flex-col items-center gap-6 text-center">
            <AlertTriangle size={52} className="text-amber-400" />
            <div>
                <h2 className="text-2xl font-black text-slate-800">Invalid Callback</h2>
                <p className="text-slate-500 font-medium mt-2 max-w-xs">
                    No payment reference was found in the URL. This page should only be accessed after completing a Chapa payment.
                </p>
            </div>
            <button onClick={onDashboard} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black transition-all">
                <Home size={17} /> Return to Dashboard
            </button>
        </div>
    );
}

// ── Main PaymentCallback component ─────────────────────────────────────────────
export default function PaymentCallback() {
    const navigate       = useNavigate();
    const [searchParams] = useSearchParams();
    const txRef          = searchParams.get('tx_ref');

    const [status,  setStatus]  = useState(STATUS.VERIFYING);
    const [payment, setPayment] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');

    const verifyPayment = useCallback(async () => {
        if (!txRef) {
            setStatus(STATUS.NO_REF);
            return;
        }

        setStatus(STATUS.VERIFYING);
        setErrorMsg('');

        try {
            console.log(`[PaymentCallback] Verifying tx_ref: ${txRef}`);
            const { data } = await axiosInstance.get(`/payments/chapa/verify/${txRef}`);

            if (data.success) {
                setPayment(data.payment);
                setStatus(STATUS.SUCCESS);
                console.log('[PaymentCallback] ✅ Payment verified:', data.payment?.id);
            } else {
                setErrorMsg(data.message || 'Verification returned unsuccessful.');
                setStatus(STATUS.FAILED);
            }
        } catch (err) {
            const msg = err.response?.data?.error || err.response?.data?.detail || err.message || 'Verification request failed.';
            console.error('[PaymentCallback] ❌ Error:', msg);
            setErrorMsg(msg);
            setStatus(STATUS.FAILED);
        }
    }, [txRef]);

    // Auto-verify on mount
    useEffect(() => {
        verifyPayment();
    }, [verifyPayment]);

    const goToDashboard = () => navigate('/member-dashboard');

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center p-6">

            {/* Background decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl" />
            </div>

            {/* Card */}
            <div className="relative z-10 bg-white/90 backdrop-blur-xl rounded-[3rem] shadow-2xl shadow-slate-200/80 border border-white/80 w-full max-w-lg p-10 md:p-14">

                {/* Logo / Brand strip */}
                <div className="flex items-center justify-center gap-2 mb-10">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl" />
                    <span className="text-sm font-black text-slate-700 uppercase tracking-widest">Central Equb</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Payment</span>
                </div>

                {/* Content — switches based on status */}
                {status === STATUS.VERIFYING && <VerifyingView />}
                {status === STATUS.SUCCESS   && (
                    <SuccessView
                        payment={payment}
                        txRef={txRef}
                        onDashboard={goToDashboard}
                    />
                )}
                {status === STATUS.FAILED    && (
                    <FailedView
                        txRef={txRef}
                        errorMsg={errorMsg}
                        onRetry={verifyPayment}
                        onDashboard={goToDashboard}
                    />
                )}
                {status === STATUS.NO_REF    && <NoRefView onDashboard={goToDashboard} />}

                {/* Footer */}
                <p className="mt-10 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                    Secured by Chapa · 256-bit SSL
                </p>
            </div>
        </div>
    );
}
