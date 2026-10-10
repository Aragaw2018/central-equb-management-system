import React, { useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import DashboardLayout from '../../components/DashboardLayout';
import { User, Landmark, Lock, CheckCircle2, Loader2, Save, ShieldCheck } from 'lucide-react';

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
        accountNumber: storedUser?.accountNumber || ''
    });

    const [passData, setPassData] = useState({ currentPassword: '', newPassword: '' });

    // Handle Profile Information Update
    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axiosInstance.patch(`/users/profile/${storedUser.id}`, formData);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setMsg({ type: 'success', text: res.data.message || 'Profile updated successfully' });
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
        } finally { 
            setLoading(false); 
        }
    };

    // Handle Password Change Request
    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (!passData.currentPassword || !passData.newPassword) {
            setMsg({ type: 'error', text: 'Please fill in both password fields.' });
            return;
        }

        setPassLoading(true);
        try {
            const res = await axiosInstance.patch(`/users/change-password/${storedUser.id}`, passData);
            setMsg({ type: 'success', text: res.data.message || 'Password updated successfully' });
            setPassData({ currentPassword: '', newPassword: '' });
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update password' });
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
                    <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-sm ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                        {msg.type === 'success' ? <CheckCircle2 size={18}/> : <ShieldCheck size={18}/>}
                        {msg.text}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column: Personal & Banking Details */}
                    <div className="md:col-span-2 space-y-6">
                        <form onSubmit={handleUpdate} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-blue-50 p-2 rounded-xl text-blue-600"><User size={20}/></div>
                                <h2 className="font-black text-slate-800 uppercase tracking-tighter">Personal Information</h2>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">First Name</label>
                                    <input type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Father's Name</label>
                                    <input type="text" value={formData.fatherName} onChange={(e) => setFormData({...formData, fatherName: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Email Address</label>
                                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>

                            {/* Banking Payout Details */}
                            <div className="pt-6 border-t border-slate-50 space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600"><Landmark size={20}/></div>
                                    <h2 className="font-black text-slate-800 uppercase tracking-tighter">Bank Payout Details</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Bank Name</label>
                                        <select value={formData.bankName} onChange={(e) => setFormData({...formData, bankName: e.target.value})} className="w-full p-4 bg-emerald-50/30 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700">
                                            <option value="">Select Bank</option>
                                            <option value="CBE">Commercial Bank of Ethiopia (CBE)</option>
                                            <option value="Abyssinia">Bank of Abyssinia</option>
                                            <option value="Telebirr">Telebirr / SuperApp</option>
                                            <option value="Dashen">Dashen Bank</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Account Number</label>
                                        <input type="text" placeholder="1000..." value={formData.accountNumber} onChange={(e) => setFormData({...formData, accountNumber: e.target.value})} className="w-full p-4 bg-emerald-50/30 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-emerald-500" />
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-all disabled:opacity-50">
                                {loading ? <Loader2 className="animate-spin"/> : <Save size={18}/>}
                                SAVE ALL CHANGES
                            </button>
                        </form>
                    </div>

                    {/* Right Column: Security & Verification */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-amber-50 p-2 rounded-xl text-amber-600"><Lock size={20}/></div>
                                <h2 className="font-black text-slate-800 uppercase tracking-tighter text-sm">Security</h2>
                            </div>
                            <form onSubmit={handlePasswordUpdate} className="space-y-4">
                                <input 
                                    type="password" 
                                    placeholder="Current Password" 
                                    value={passData.currentPassword}
                                    onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
                                    className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-none outline-none focus:ring-2 focus:ring-amber-500" 
                                />
                                <input 
                                    type="password" 
                                    placeholder="New Password" 
                                    value={passData.newPassword}
                                    onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                                    className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold border-none outline-none focus:ring-2 focus:ring-amber-500" 
                                />
                                <button 
                                    type="submit" 
                                    disabled={passLoading}
                                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-amber-100 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                >
                                    {passLoading ? <Loader2 className="animate-spin" size={16}/> : 'Update Password'}
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