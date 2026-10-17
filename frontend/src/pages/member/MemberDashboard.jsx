import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { connectSocket } from '../../socket/socketClient';
import DashboardLayout from '../../components/DashboardLayout';
import NotificationBell from '../../components/NotificationBell';
import AgreementPage from '../AgreementPage';
import { Bell, CheckCircle2, ArrowRight, ShieldAlert, Loader2, X, Fingerprint, BadgeCheck, Camera, Upload } from 'lucide-react';

import { WinnerModal, PaymentModal, WinnerNominateModal, ProvideGuarantorModal } from './Modals';
import {
    ActionRequiredSection,
    RoundHistorySection,
    CategoryCards,
    JoinRequestsSection,
    PlansGrid,
    AvailableGroupsGrid,
    SuccessView,
    ReceivedGuarantorRequestsSection,
    WinnerPayoutCard,
} from './DashboardSections';

// Safe LocalStorage Parser
const getStoredUser = () => {
    try {
        const item = localStorage.getItem('user');
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error("Failed to parse stored user data:", e);
        return null;
    }
};

// ── KYC Verification Banner ───────────────────────────────────────────────────
function KycBanner({ onVerify }) {
    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 bg-[#005C53]/8 border-2 border-[#005C53]/25 rounded-[1.5rem] shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-[#005C53]/15 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldAlert size={17} className="text-[#005C53]" />
                </div>
                <div>
                    <p className="font-black text-slate-800 text-sm">Verification Required</p>
                    <p className="text-slate-600 font-medium text-xs mt-0.5 leading-relaxed max-w-lg">
                        Your National Fayda ID is not verified yet. Complete instant verification
                        to join Equb groups and participate in draws.
                    </p>
                </div>
            </div>
            <button
                onClick={onVerify}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#005C53] hover:bg-[#004a42] text-white rounded-xl font-black text-xs uppercase tracking-wide shadow-md transition-all active:scale-95 shrink-0 whitespace-nowrap"
            >
                <Fingerprint size={14} /> Verify Fayda ID Now
            </button>
        </div>
    );
}

// ── Fayda eKYC Verification Modal — 2-step (FIN + doc → OTP) ─────────────────
function FaydaVerifyModal({ userId, onClose, onVerified }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // Step 1 state
    const [fin, setFin] = useState('');
    const [docFile, setDocFile] = useState(null);
    const [docPreview, setDocPreview] = useState(null);
    const [showCamera, setShowCamera] = useState(false);

    // Step 2 state
    const [step, setStep] = useState(1);     // 1 | 2
    const [otp, setOtp] = useState('');
    const [debugOtp, setDebugOtp] = useState('');

    // Shared
    const [status, setStatus] = useState('idle'); // idle | sending | verifying | success | error
    const [errMsg, setErrMsg] = useState('');

    // ── Camera helpers ────────────────────────────────────────────────────────
    const startCamera = async () => {
        setErrMsg('');
        setShowCamera(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch {
            setErrMsg('Camera access denied. Please upload a photo instead.');
            setShowCamera(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
        setShowCamera(false);
    };

    const capturePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        canvas.toBlob(blob => {
            if (!blob) return;
            const f = new File([blob], 'fayda_id.jpg', { type: 'image/jpeg' });
            if (docPreview) URL.revokeObjectURL(docPreview);
            setDocFile(f);
            setDocPreview(URL.createObjectURL(f));
            stopCamera();
        }, 'image/jpeg');
    };

    const handleFileChange = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        if (docPreview) URL.revokeObjectURL(docPreview);
        setDocFile(f);
        setDocPreview(URL.createObjectURL(f));
    };

    // Cleanup on unmount
    useEffect(() => () => {
        stopCamera();
        if (docPreview) URL.revokeObjectURL(docPreview);
    }, []);

    // ── Step 1: Send OTP ──────────────────────────────────────────────────────
    const handleSendOtp = async () => {
        if (!/^\d{12}$/.test(fin)) {
            setErrMsg('Please enter exactly 12 digits.');
            return;
        }
        setStatus('sending');
        setErrMsg('');
        try {
            await new Promise(r => setTimeout(r, 1000)); // simulate network
            const fd = new FormData();
            fd.append('userId', userId);
            fd.append('faydaId', fin);
            if (docFile) fd.append('faydaImage', docFile);

            const { data } = await axiosInstance.post('/users/send-fayda-otp', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setDebugOtp(data.debugOtp || '');
            setStep(2);
            setStatus('idle');
        } catch (err) {
            setErrMsg(err.response?.data?.error || 'Failed to send code. Please try again.');
            setStatus('error');
        }
    };

    // ── Step 2: Verify OTP ────────────────────────────────────────────────────
    const handleVerifyOtp = async () => {
        if (otp.length !== 6) {
            setErrMsg('Please enter the 6-digit code.');
            return;
        }
        setStatus('verifying');
        setErrMsg('');
        try {
            const { data } = await axiosInstance.post('/users/verify-fayda-otp', { userId, otp });
            const stored = JSON.parse(localStorage.getItem('user') || '{}');
            const updated = { ...stored, ...data.user };
            localStorage.setItem('user', JSON.stringify(updated));
            window.dispatchEvent(new Event('userUpdated'));
            setStatus('success');
            setTimeout(() => { onVerified(updated); onClose(); }, 1800);
        } catch (err) {
            setErrMsg(err.response?.data?.error || 'Incorrect code. Please try again.');
            setStatus('error');
        }
    };

    // ── Shared input style ────────────────────────────────────────────────────
    const inputCls = "w-full px-5 py-4 bg-slate-50 rounded-[1.2rem] border-2 border-transparent focus:border-[#005C53] outline-none font-bold text-slate-800 transition-colors disabled:opacity-50";

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 max-h-[92vh] flex flex-col">

                {/* Header */}
                <div className="px-8 pt-8 pb-6 border-b border-slate-50 flex items-start justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-[#005C53]/10 rounded-2xl flex items-center justify-center shrink-0">
                            <Fingerprint size={22} className="text-[#005C53]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800 leading-tight">Fayda ID Verification</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                National eKYC &mdash; Step {step} of 2
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-300 hover:text-slate-500 transition-colors rounded-full"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Step progress bar */}
                <div className="px-8 pt-4 shrink-0">
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#005C53] rounded-full transition-all duration-500"
                            style={{ width: status === 'success' ? '100%' : step === 1 ? '50%' : '100%' }}
                        />
                    </div>
                </div>

                {/* Scrollable body */}
                <div className="px-8 py-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">

                    {/* ── SUCCESS ── */}
                    {status === 'success' && (
                        <div className="flex flex-col items-center gap-4 py-8 animate-in zoom-in duration-300">
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                                <BadgeCheck size={44} className="text-emerald-500" />
                            </div>
                            <div className="text-center">
                                <p className="text-xl font-black text-slate-800 mb-1">Fayda ID Verified!</p>
                                <p className="text-sm font-medium text-slate-500">
                                    Your identity has been confirmed. You can now join Equb groups.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 1: Identification & Document Capture ── */}
                    {status !== 'success' && step === 1 && (
                        <>
                            <p className="text-sm font-medium text-slate-500 leading-relaxed">
                                Enter your 12-digit National Fayda Identification Number and
                                attach a photo of your Fayda ID card (optional but recommended).
                            </p>

                            {/* FIN input */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                                    12-Digit Fayda Identification Number (FIN) *
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={12}
                                    value={fin}
                                    onChange={e => {
                                        setFin(e.target.value.replace(/\D/g, '').slice(0, 12));
                                        setErrMsg('');
                                        if (status === 'error') setStatus('idle');
                                    }}
                                    placeholder="e.g. 100234567890"
                                    disabled={status === 'sending'}
                                    className={`${inputCls} font-mono text-lg tracking-widest`}
                                />
                                <div className="flex items-center justify-between mt-1.5 px-1">
                                    <span className={`text-[10px] font-bold ${fin.length === 12 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                        {fin.length} / 12 digits
                                    </span>
                                    {fin.length === 12 && (
                                        <span className="text-[10px] font-black text-emerald-500 flex items-center gap-1">
                                            <CheckCircle2 size={11} /> Format valid
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Document attachment */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                                    Fayda ID Photo (Optional)
                                </label>

                                {/* Camera view */}
                                {showCamera ? (
                                    <div className="relative bg-slate-900 rounded-[1.5rem] overflow-hidden">
                                        <video ref={videoRef} autoPlay playsInline className="w-full h-52 object-cover" />
                                        <div className="absolute inset-0 border-[3px] border-[#005C53]/50 m-6 rounded-xl pointer-events-none border-dashed" />
                                        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3 px-4">
                                            <button
                                                type="button"
                                                onClick={stopCamera}
                                                className="p-3 bg-red-500 text-white rounded-full shadow-lg"
                                            >
                                                <X size={18} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={capturePhoto}
                                                className="flex-1 py-3 bg-[#005C53] text-white rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2"
                                            >
                                                <Camera size={16} /> Capture Photo
                                            </button>
                                        </div>
                                    </div>
                                ) : docPreview ? (
                                    <div className="relative rounded-[1.5rem] overflow-hidden border-2 border-emerald-400">
                                        <img src={docPreview} alt="Fayda ID" className="w-full h-44 object-cover" />
                                        <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                                            <CheckCircle2 size={10} /> ID ATTACHED
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => { setDocFile(null); setDocPreview(null); }}
                                            className="absolute top-2 right-2 p-1.5 bg-white/90 text-red-500 rounded-full shadow"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={startCamera}
                                            className="flex flex-col items-center justify-center gap-2 py-5 bg-slate-900 text-white rounded-2xl hover:bg-[#005C53] transition-all font-black text-[10px] uppercase"
                                        >
                                            <Camera size={22} />
                                            Take Photo via Camera
                                        </button>
                                        <label className="flex flex-col items-center justify-center gap-2 py-5 bg-slate-100 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-[#005C53]/8 hover:border-[#005C53]/40 transition-all font-black text-[10px] uppercase text-slate-500">
                                            <Upload size={22} />
                                            Upload ID Photo
                                            <input
                                                type="file"
                                                onChange={handleFileChange}
                                                accept="image/jpeg,image/png"
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                )}
                            </div>

                            {/* Error */}
                            {errMsg && (
                                <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl animate-in fade-in duration-200">
                                    <ShieldAlert size={14} className="text-red-500 mt-0.5 shrink-0" />
                                    <p className="text-xs font-bold text-red-700">{errMsg}</p>
                                </div>
                            )}

                            {/* Send OTP button */}
                            <button
                                onClick={handleSendOtp}
                                disabled={status === 'sending' || fin.length !== 12}
                                className="w-full py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed bg-[#005C53] hover:bg-[#004a42] text-white"
                            >
                                {status === 'sending'
                                    ? <><Loader2 size={18} className="animate-spin" /> Sending Verification Code...</>
                                    : <><Fingerprint size={18} /> Send Verification Code</>}
                            </button>

                            <p className="text-center text-[10px] text-slate-400 font-medium">
                                A 6-digit code will be sent to your registered phone number.
                            </p>
                        </>
                    )}

                    {/* ── STEP 2: OTP Verification ── */}
                    {status !== 'success' && step === 2 && (
                        <>
                            {debugOtp && (
                                <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl">
                                    <span className="text-base">📱</span>
                                    <p className="text-xs font-bold text-amber-800">
                                        Demo SMS Code: <span className="font-black text-lg tracking-widest text-amber-900">{debugOtp}</span>
                                    </p>
                                </div>
                            )}

                            <p className="text-sm font-medium text-slate-500 leading-relaxed">
                                A 6-digit verification code has been sent to your registered phone number.
                                Enter it below to confirm your identity.
                            </p>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                                    6-Digit Verification Code
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={otp}
                                    onChange={e => {
                                        setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                                        setErrMsg('');
                                        if (status === 'error') setStatus('idle');
                                    }}
                                    placeholder="e.g. 472819"
                                    disabled={status === 'verifying'}
                                    className={`${inputCls} font-mono text-2xl tracking-[0.4em] text-center`}
                                    autoFocus
                                />
                                <div className="flex justify-center mt-1.5">
                                    <span className={`text-[10px] font-bold ${otp.length === 6 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                        {otp.length} / 6 digits
                                    </span>
                                </div>
                            </div>

                            {errMsg && (
                                <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl animate-in fade-in duration-200">
                                    <ShieldAlert size={14} className="text-red-500 mt-0.5 shrink-0" />
                                    <p className="text-xs font-bold text-red-700">{errMsg}</p>
                                </div>
                            )}

                            <button
                                onClick={handleVerifyOtp}
                                disabled={status === 'verifying' || otp.length !== 6}
                                className="w-full py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed bg-[#005C53] hover:bg-[#004a42] text-white"
                            >
                                {status === 'verifying'
                                    ? <><Loader2 size={18} className="animate-spin" /> Verifying Identity...</>
                                    : <><BadgeCheck size={18} /> Confirm &amp; Verify ID</>}
                            </button>

                            <p className="text-center text-xs text-slate-400 font-medium">
                                Did not receive the code?{' '}
                                <button
                                    type="button"
                                    onClick={() => { setStep(1); setOtp(''); setErrMsg(''); setStatus('idle'); }}
                                    className="text-[#005C53] font-black hover:underline"
                                >
                                    Go back and resend
                                </button>
                            </p>
                        </>
                    )}
                </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}

// ── Bank Reminder Banner ───────────────────────────────────────────────────────
function BankReminderBanner({ user, onSetup }) {
    const hasBankDetails = user?.bankName && user?.accountNumber;

    if (hasBankDetails) {
        return (
            <div className="flex items-center gap-3 px-5 py-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xs font-bold animate-in fade-in duration-500">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                <span>
                    Payout Account Configured —{' '}
                    <span className="font-black">{user.bankName}</span>
                    {user.accountNumber && (
                        <span className="font-mono opacity-70 ml-1">
                            ···{user.accountNumber.slice(-4)}
                        </span>
                    )}
                </span>
            </div>
        );
    }

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 bg-amber-50 border-2 border-amber-200 rounded-[1.5rem] shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                    <Bell size={17} className="text-amber-600" />
                </div>
                <div>
                    <p className="font-black text-slate-800 text-sm">Set Up Your Payout Account</p>
                    <p className="text-amber-700 font-medium text-xs mt-0.5 leading-relaxed max-w-lg">
                        If you want your winnings transferred directly to your bank (CBE, BOA, Dashen, Awash, etc.)
                        instead of Telebirr, please set your bank details to avoid payout delays.
                    </p>
                </div>
            </div>
            <button
                onClick={onSetup}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-xs uppercase tracking-wide shadow-md shadow-amber-200 transition-all active:scale-95 shrink-0 whitespace-nowrap"
            >
                Set Bank Details <ArrowRight size={14} />
            </button>
        </div>
    );
}

export default function MemberDashboard() {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(() => getStoredUser());
    const userId = currentUser?.id;

    // --- NAVIGATION VIEWS ---
    const [view, setView] = useState('home');
    const [selCat, setSelCat] = useState(null);
    const [selPlan, setSelPlan] = useState(null);
    const [selGroup, setSelGroup] = useState(null);

    // --- DATA STATES ---
    const [allPlans, setAllPlans] = useState([]);
    const [groups, setGroups] = useState([]);
    const [memberships, setMemberships] = useState([]);
    const [myPayments, setMyPayments] = useState([]);
    const [recentWinners, setRecentWinners] = useState([]);
    const [myWins, setMyWins] = useState([]);
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [loading, setLoading] = useState({ plans: false, groups: false, mb: true });

    // KYC modal
    const [showKycModal, setShowKycModal] = useState(false);

    // Modals Control
    const [activeModal, setActiveModal] = useState({
        winner: null,
        payment: null,
        nominate: null,
        guarantorForm: null
    });

    // --- DATA FETCHING (ENRICHED WITH REAL GROUP NAMES) ---
    const refreshData = useCallback(async () => {
        if (!userId) return;
        try {
            const [mbRes, payRes, winsRes, reqRes] = await Promise.all([
                axiosInstance.get(`/member/memberships/${userId}`),
                axiosInstance.get(`/payments/member/${userId}`),
                axiosInstance.get(`/guarantor/wins/${userId}`),
                axiosInstance.get(`/guarantor/pending/${userId}`)
            ]);

            const userMemberships = mbRes.data || [];
            setMemberships(userMemberships);
            setMyPayments(payRes.data || []);
            setMyWins(winsRes.data || []);
            setReceivedRequests(reqRes.data || []);

            const approvedMemberships = userMemberships.filter(m => m.status === 'APPROVED');

            if (approvedMemberships.length > 0) {
                // Fetch each group's draw history and bind the group object directly
                const historyPromises = approvedMemberships.map(async (m) => {
                    try {
                        const res = await axiosInstance.get(`/draw/${m.groupId}/results`);
                        const grp = m.group || { name: m.group?.name || 'Equb Group' };
                        return (res.data || []).map(hItem => ({
                            ...hItem,
                            // Ensure both group and groupName are set so RoundHistorySection displays it
                            group: hItem.group?.name ? hItem.group : grp,
                            groupName: hItem.group?.name || hItem.groupName || grp?.name || 'Equb Group',
                        }));
                    } catch {
                        return [];
                    }
                });

                const histories = await Promise.all(historyPromises);
                const combinedHistory = histories
                    .flat()
                    .sort((a, b) => new Date(b.drawnAt || 0) - new Date(a.drawnAt || 0));

                setRecentWinners(combinedHistory.slice(0, 10));
            } else {
                setRecentWinners([]);
            }
        } catch (err) {
            console.error("Refresh Data Error:", err);
        } finally {
            setLoading(prev => ({ ...prev, mb: false }));
        }
    }, [userId]);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    // ── Sync user data when localStorage is updated ───────────────────────────
    useEffect(() => {
        const handleStorageChange = () => {
            setCurrentUser(getStoredUser());
        };
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('userUpdated', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('userUpdated', handleStorageChange);
        };
    }, []);

    // --- SOCKET LOGIC ---
    useEffect(() => {
        if (!userId) return;
        const socket = connectSocket();

        socket.emit('joinUserRoom', { userId });

        const approvedGids = memberships
            .filter(m => m.status === 'APPROVED')
            .map(m => m.groupId);

        approvedGids.forEach(gid => socket.emit('joinGroupRoom', { groupId: gid, userId }));

        const handleWinnerAnnounced = (data) => {
            if (approvedGids.includes(data.groupId)) {
                setActiveModal(prev => ({ ...prev, winner: data }));
                refreshData();
            }
        };

        const handleGuarantorRequested = (data) => {
            refreshData();
            console.log(`[Socket] Guarantor requested by ${data.winnerName}`);
        };

        const handleGuarantorResponded = (data) => {
            refreshData();
            alert(`${data.guarantorName} has ${data.status?.toLowerCase()} your request.`);
        };

        socket.on('winnerAnnounced', handleWinnerAnnounced);
        socket.on('guarantorRequested', handleGuarantorRequested);
        socket.on('guarantorResponded', handleGuarantorResponded);

        return () => {
            socket.off('winnerAnnounced', handleWinnerAnnounced);
            socket.off('guarantorRequested', handleGuarantorRequested);
            socket.off('guarantorResponded', handleGuarantorResponded);
        };
    }, [userId, memberships, refreshData]);

    // --- ACTIONS ---
    const handleCategorySelect = async (catId) => {
        setSelCat(catId);
        setLoading(prev => ({ ...prev, plans: true }));
        try {
            const res = await axiosInstance.get('/admin/plans');
            setAllPlans((res.data || []).filter(p => p.category === catId));
            setView('plans');
        } catch (err) {
            console.error("Error fetching plans:", err);
        } finally {
            setLoading(prev => ({ ...prev, plans: false }));
        }
    };

    const handlePlanSelect = async (plan) => {
        setSelPlan(plan);
        setLoading(prev => ({ ...prev, groups: true }));
        try {
            const res = await axiosInstance.get(`/member/plans/${plan.id}/groups`);
            setGroups(res.data || []);
            setView('groups');
        } catch (err) {
            console.error("Error fetching groups:", err);
        } finally {
            setLoading(prev => ({ ...prev, groups: false }));
        }
    };

    const handleRejectRequest = async (requestId) => {
        if (!window.confirm("Are you sure you want to decline this request?")) return;
        try {
            await axiosInstance.patch(`/guarantor/${requestId}/respond`, { status: 'REJECTED', userId });
            refreshData();
        } catch (err) {
            alert("Failed to reject request.");
        }
    };

    const handleJoinGroup = async () => {
        if (!selGroup) return;
        try {
            await axiosInstance.post('/member/join-group', { userId, groupId: selGroup.id });
            refreshData();
            setView('success');
        } catch (err) {
            const code = err.response?.data?.code;
            if (code === 'KYC_REQUIRED') {
                setShowKycModal(true);
                return;
            }
            alert(err.response?.data?.error || "Failed to join group.");
        }
    };

    return (
        <DashboardLayout role="MEMBER" headerExtra={
            <NotificationBell userId={userId} />
        }>
            {/* ── KYC Verification Modal ─────────────────────────────── */}
            {showKycModal && (
                <FaydaVerifyModal
                    userId={userId}
                    onClose={() => setShowKycModal(false)}
                    onVerified={(updatedUser) => {
                        setCurrentUser(updatedUser);
                        setShowKycModal(false);
                    }}
                />
            )}
            {/* --- MODALS --- */}
            {activeModal.winner && (
                <WinnerModal
                    data={activeModal.winner}
                    currentUserId={userId}
                    onClose={() => setActiveModal(prev => ({ ...prev, winner: null }))}
                />
            )}

            {activeModal.payment && (
                <PaymentModal
                    membership={activeModal.payment.membership}
                    paymentContext={activeModal.payment.context}
                    onClose={() => setActiveModal(prev => ({ ...prev, payment: null }))}
                    onSubmitted={refreshData}
                />
            )}

            {activeModal.nominate && (
                <WinnerNominateModal
                    win={activeModal.nominate}
                    onClose={() => setActiveModal(prev => ({ ...prev, nominate: null }))}
                    onSubmitted={refreshData}
                />
            )}

            {activeModal.guarantorForm && (
                <ProvideGuarantorModal
                    guarantorRequest={activeModal.guarantorForm}
                    onClose={() => setActiveModal(prev => ({ ...prev, guarantorForm: null }))}
                    onSubmitted={refreshData}
                />
            )}

            <div className="max-w-6xl mx-auto space-y-10">
                {view === 'home' && (
                    <>
                        <div className="flex justify-between items-center">
                            <h1 className="text-4xl font-black text-slate-800">My Savings</h1>
                            <p className="text-slate-400 font-bold uppercase text-xs">Overview</p>
                        </div>

                        <BankReminderBanner
                            user={currentUser}
                            onSetup={() => navigate('/profile')}
                        />

                        {currentUser?.kycStatus !== 'VERIFIED' && (
                            <KycBanner onVerify={() => setShowKycModal(true)} />
                        )}

                        <ReceivedGuarantorRequestsSection
                            requests={receivedRequests}
                            onAccept={(req) => setActiveModal(prev => ({ ...prev, guarantorForm: req }))}
                            onReject={handleRejectRequest}
                        />

                        <WinnerPayoutCard
                            wins={myWins}
                            currentUserId={userId}
                        />

                        <ActionRequiredSection
                            myWins={myWins}
                            onNominate={(win) => setActiveModal(prev => ({ ...prev, nominate: win }))}
                        />

                        <CategoryCards onSelect={handleCategorySelect} />

                        <JoinRequestsSection
                            memberships={memberships}
                            myPayments={myPayments}
                            onPay={(m, ctx) => setActiveModal(prev => ({ ...prev, payment: { membership: m, context: ctx } }))}
                            onDraw={(gid) => navigate(`/member/draw/${gid}`)}
                        />

                        <RoundHistorySection history={recentWinners} memberships={memberships} />
                    </>
                )}

                {view === 'plans' && (
                    <PlansGrid
                        category={selCat}
                        plans={allPlans}
                        loading={loading.plans}
                        onBack={() => setView('home')}
                        onSelect={handlePlanSelect}
                    />
                )}

                {view === 'groups' && (
                    <AvailableGroupsGrid
                        plan={selPlan}
                        groups={groups}
                        memberships={memberships}
                        loading={loading.groups}
                        onBack={() => setView('plans')}
                        onJoin={(g) => {
                            if (currentUser?.kycStatus !== 'VERIFIED') {
                                setShowKycModal(true);
                                return;
                            }
                            setSelGroup(g);
                            setView('agreement');
                        }}
                        isKycVerified={currentUser?.kycStatus === 'VERIFIED'}
                        onKycRequired={() => setShowKycModal(true)}
                    />
                )}

                {view === 'agreement' && selGroup && (
                    <AgreementPage
                        plan={{
                            amount: Number(selGroup.plan?.amount || 0),
                            penalty: Number(selGroup.plan?.penalty || 0),
                            tier1Penalty: Number(selGroup.plan?.tier1Penalty || 0),
                            tier2Penalty: Number(selGroup.plan?.tier2Penalty || 0),
                            tier3Penalty: Number(selGroup.plan?.tier3Penalty || 0),
                            category: selGroup.plan?.category || 'DAILY',
                            members: selGroup.plan?.maxMembers,
                            size: selGroup.name,
                            startDate: selGroup.startDate ? new Date(selGroup.startDate).toLocaleDateString() : 'N/A'
                        }}
                        onAgree={handleJoinGroup}
                        onBack={() => setView('groups')}
                    />
                )}

                {view === 'success' && <SuccessView onHome={() => setView('home')} />}
            </div>
        </DashboardLayout>
    );
}