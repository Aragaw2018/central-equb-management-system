import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../api/axiosInstance';
import DashboardLayout from '../../components/DashboardLayout';
import { User, Landmark, Lock, CheckCircle2, Loader2, Save, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';

// Safe helper to parse local storage without crashing on null/corrupt data
const getStoredUser = () => {
    try {
        const item = localStorage.getItem('user');
        return item ? JSON.parse(item) : {};
    } catch {
        return {};
    }
};

export default function Profile() {
    const storedUser = getStoredUser();
    const [loading, setLoading] = useState(false);
    const [passLoading, setPassLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        firstName: storedUser?.firstName || '',
        fatherName: storedUser?.fatherName || '',
        email: storedUser?.email || '',
        bankName: storedUser?.bankName || '',
        accountHolder: storedUser?.accountHolder || '',
        accountNumber: storedUser?.accountNumber || '',
    });

    const [passData, setPassData] = useState({ currentPassword: '', newPassword: '' });
    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);

    const msgTimerRef = useRef(null);

    // ── Fetch fresh profile on mount ──────────────────────────────────────────
    useEffect(() => {
        const activeId = storedUser?.id || getStoredUser()?.id;
        if (!activeId) return;
        axiosInstance.get('/users/profile/' + activeId)
            .then(res => {
                const u = res.data?.user || res.data;
                if (!u) return;
                setFormData(prev => ({
                    firstName: u.firstName || prev.firstName,
                    fatherName: u.fatherName || prev.fatherName,
                    email: u.email || prev.email,
                    bankName: u.bankName || prev.bankName,
                    accountHolder: u.accountHolder || prev.accountHolder,
                    accountNumber: u.accountNumber || prev.accountNumber,
                }));
                localStorage.setItem('user', JSON.stringify({ ...storedUser, ...u }));
            })
            .catch(() => { });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storedUser?.id]);

    const showMsg = (type, text) => {
        setMsg({ type, text });
        if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
        msgTimerRef.current = setTimeout(() => setMsg({ type: '', text: '' }), 5000);
    };

    // ── Handle Profile Save ────────────────────────────────────────────────────
    const handleUpdate = async (e) => {
        e.preventDefault();
        const activeId = storedUser?.id || getStoredUser()?.id;
        if (!activeId) {
            showMsg('error', 'User session not found. Please log in again.');
            return;
        }

        setLoading(true);
        try {
            const res = await axiosInstance.patch('/users/profile/' + activeId, formData);
            const updatedUser = res.data?.user;
            if (updatedUser) {
                const merged = { ...storedUser, ...updatedUser };
                localStorage.setItem('user', JSON.stringify(merged));
                // Fire custom event so MemberDashboard banner hides immediately
                window.dispatchEvent(new Event('userUpdated'));
            }
            showMsg('success', res.data.message || 'Profile and payout details updated successfully!');
        } catch (err) {
            showMsg('error', err.response?.data?.error || err.response?.data?.message || 'Failed to update profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Handle Password Change Request ─────────────────────────────────────────
    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        const activeId = storedUser?.id || getStoredUser()?.id;

        if (!activeId) {
            showMsg('error', 'User session expired. Please log in again.');
            return;
        }

        if (!passData.currentPassword.trim() || !passData.newPassword.trim()) {
            showMsg('error', 'Please fill in both current and new password fields.');
            return;
        }

        if (passData.newPassword.length < 6) {
            showMsg('error', 'New password must be at least 6 characters long.');
            return;
        }

        if (passData.currentPassword === passData.newPassword) {
            showMsg('error', 'New password must be different from your current password.');
            return;
        }

        setPassLoading(true);
        try {
            // Send request to backend
            const res = await axiosInstance.patch(`/users/change-password/${activeId}`, {
                currentPassword: passData.currentPassword,
                newPassword: passData.newPassword
            });

            showMsg('success', res.data?.message || 'Password updated successfully!');
            setPassData({ currentPassword: '', newPassword: '' });
        } catch (err) {
            // Read both error and message from backend cleanly
            const errorText = err.response?.data?.error 
                || err.response?.data?.message 
                || 'Failed to update password. Please check your current password.';
            showMsg('error', errorText);
        } finally {
            setPassLoading(false);
        }
    };

    return (
        <DashboardLayout role="MEMBER">
            <div className="max-w-4xl mx-auto space-y-8 pb-20">
                <div>
                    <h1 className="text-3xl font-black text-slate-800">Account Settings</h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Manage your identity and banking information</p>
                </div>

                {msg.text && (
                    <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-sm animate-in fade-in slide-in-from-top-2 duration-300 ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                        {msg.type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
                        {msg.text}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column: Personal & Banking Details */}
                    <div className="md:col-span-2 space-y-6">
                        <form onSubmit={handleUpdate} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-blue-50 p-2 rounded-xl text-blue-600"><User size={20} /></div>
                                <h2 className="font-black text-slate-800 uppercase tracking-tighter">Personal Information</h2>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">First Name</label>
                                    <input type="text" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Father's Name</label>
                                    <input type="text" value={formData.fatherName} onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Email Address</label>
                                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>

                            {/* Banking Payout Details */}
                            <div className="pt-6 border-t border-slate-50 space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600"><Landmark size={20} /></div>
                                    <h2 className="font-black text-slate-800 uppercase tracking-tighter">Bank Payout Details</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Bank / Service</label>
                                        <select
                                            value={formData.bankName}
                                            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                            className="w-full p-4 bg-emerald-50/30 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 appearance-none cursor-pointer"
                                        >
                                            <option value="">— Select Bank —</option>
                                            <option value="CBE">Commercial Bank of Ethiopia (CBE)</option>
                                            <option value="BOA">Bank of Abyssinia (BOA)</option>
                                            <option value="Dashen">Dashen Bank</option>
                                            <option value="Awash">Awash Bank</option>
                                            <option value="Telebirr">Telebirr / SuperApp</option>
                                            <option value="Wegagen">Wegagen Bank</option>
                                            <option value="Zemen">Zemen Bank</option>
                                            <option value="Nib">NIB International Bank</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Account Holder Name</label>
                                        <input
                                            type="text"
                                            placeholder="Full name on account"
                                            value={formData.accountHolder}
                                            onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                                            className="w-full p-4 bg-emerald-50/30 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Account Number</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 1000123456789"
                                            value={formData.accountNumber}
                                            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                            className="w-full p-4 bg-emerald-50/30 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-emerald-600 font-bold ml-2">
                                    💡 This account will receive your Equb winnings when funds are released by the organizer. If not set, payouts default to your Telebirr number — set this to avoid payout delays.
                                </p>
                            </div>

                            <button type="submit" disabled={loading} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-all disabled:opacity-50">
                                {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                SAVE ALL CHANGES
                            </button>
                        </form>
                    </div>

                    {/* Right Column: Security & Verification */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-amber-50 p-2 rounded-xl text-amber-600"><Lock size={20} /></div>
                                <h2 className="font-black text-slate-800 uppercase tracking-tighter text-sm">Security</h2>
                            </div>
                            <form onSubmit={handlePasswordUpdate} className="space-y-4">
                                <div className="relative">
                                    <input
                                        type={showCurrentPass ? 'text' : 'password'}
                                        placeholder="Current Password"
                                        value={passData.currentPassword}
                                        onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
                                        className="w-full p-4 pr-12 bg-slate-50 rounded-2xl text-xs font-bold border-none outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>

                                <div className="relative">
                                    <input
                                        type={showNewPass ? 'text' : 'password'}
                                        placeholder="New Password (min. 6 chars)"
                                        value={passData.newPassword}
                                        onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                                        className="w-full p-4 pr-12 bg-slate-50 rounded-2xl text-xs font-bold border-none outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPass(!showNewPass)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={passLoading}
                                    className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-amber-100 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-95"
                                >
                                    {passLoading ? <Loader2 className="animate-spin" size={16} /> : 'Update Password'}
                                </button>
                            </form>
                        </div>

                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                            <ShieldCheck className="absolute -bottom-4 -right-4 opacity-10" size={100} />
                            <p className="text-[10px] font-black text-blue-400 uppercase mb-2">Verified Profile</p>
                            <p className="text-xs font-medium leading-relaxed opacity-70">Your account is secured with 256-bit encryption and linked to your National Fayda ID.</p>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}