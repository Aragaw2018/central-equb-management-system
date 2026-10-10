import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { ArrowLeft, Phone, Lock, Hash, ShieldCheck, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); 
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [debugCode, setDebugCode] = useState('');
    const [msg, setMsg] = useState({ type: '', text: '' });

    // Step 1: Send OTP
    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setLoading(true); 
        setMsg({ type: '', text: '' });
        try {
            const res = await axiosInstance.post('/users/send-otp', { phoneNumber });
            setDebugCode(res.data.debugCode || '');
            setStep(2);
            setMsg({ type: 'success', text: "Code sent successfully!" });
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.error || "User not found." });
        } finally { 
            setLoading(false); 
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true); 
        setMsg({ type: '', text: '' });
        try {
            await axiosInstance.post('/users/verify-otp', { phoneNumber, otpCode });
            setStep(3);
            setMsg({ type: 'success', text: "Verified! Create your new password." });
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.error || "Invalid verification code." });
        } finally { 
            setLoading(false); 
        }
    };

    // Step 3: Final Password Update
    const handleFinalReset = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return setMsg({ type: 'error', text: "Passwords do not match." });
        }
        setLoading(true); 
        setMsg({ type: '', text: '' });
        try {
            // Included otpCode in payload for secure backend validation
            await axiosInstance.post('/users/reset-password', { phoneNumber, otpCode, newPassword });
            setMsg({ type: 'success', text: "Success! Password updated." });
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.error || "Reset failed. Please try again." });
        } finally { 
            setLoading(false); 
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-100 animate-in zoom-in-95 duration-300">
                <button 
                    onClick={() => step > 1 ? setStep(step - 1) : navigate('/login')} 
                    className="flex items-center text-slate-400 mb-8 font-black text-xs uppercase tracking-widest hover:text-blue-600 transition-colors"
                >
                    <ArrowLeft size={16} className="mr-2" /> {step > 1 ? "Back Step" : "Back to Login"}
                </button>
                
                <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Reset Password</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Secure Account Recovery</p>
                
                {debugCode && step === 2 && (
                    <div className="bg-amber-50 border-2 border-amber-100 p-5 rounded-2xl mb-8 text-center animate-pulse">
                        <p className="text-amber-600 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Test Verification Code</p>
                        <p className="text-4xl font-black text-amber-800 tracking-[0.3em]">{debugCode}</p>
                    </div>
                )}

                {/* STEP 1: Phone */}
                {step === 1 && (
                    <form onSubmit={handleRequestOTP} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Phone Number</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="09..." 
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-700" 
                                    value={phoneNumber} 
                                    onChange={(e) => setPhoneNumber(e.target.value)} 
                                    required 
                                />
                                <Phone className="absolute left-4 top-4 text-slate-300" size={18} />
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="animate-spin" /> : "Send Code"}
                        </button>
                    </form>
                )}

                {/* STEP 2: OTP */}
                {step === 2 && (
                    <form onSubmit={handleVerifyOTP} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Verification Code</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="6-digit code" 
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-700 tracking-[0.5em]" 
                                    value={otpCode} 
                                    onChange={(e) => setOtpCode(e.target.value)} 
                                    required 
                                />
                                <Hash className="absolute left-4 top-4 text-slate-300" size={18} />
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="animate-spin" /> : "Verify & Continue"}
                        </button>
                    </form>
                )}

                {/* STEP 3: Password Update */}
                {step === 3 && (
                    <form onSubmit={handleFinalReset} className="space-y-5">
                        <div className="flex items-center text-emerald-600 font-black text-[10px] bg-emerald-50 p-3 rounded-xl mb-4 uppercase tracking-widest border border-emerald-100">
                            <CheckCircle size={14} className="mr-2" /> Phone Identity Verified
                        </div>
                        <div className="space-y-4">
                            <div className="relative">
                                <input 
                                    type="password" 
                                    placeholder="New Password" 
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-700" 
                                    value={newPassword} 
                                    onChange={(e) => setNewPassword(e.target.value)} 
                                    required 
                                />
                                <Lock className="absolute left-4 top-4 text-slate-300" size={18} />
                            </div>
                            <div className="relative">
                                <input 
                                    type="password" 
                                    placeholder="Confirm Password" 
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl outline-none font-bold text-slate-700" 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)} 
                                    required 
                                />
                                <ShieldCheck className="absolute left-4 top-4 text-slate-300" size={18} />
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-100 flex items-center justify-center gap-2 mt-4">
                            {loading ? <Loader2 className="animate-spin" /> : "Update Password"}
                        </button>
                    </form>
                )}

                {msg.text && (
                    <div className={`mt-8 p-4 rounded-2xl text-center text-xs font-black uppercase tracking-widest border flex items-center justify-center gap-2 ${msg.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                        {msg.type === 'error' ? <AlertCircle size={14}/> : <CheckCircle size={14}/>}
                        {msg.text}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ForgotPasswordPage;