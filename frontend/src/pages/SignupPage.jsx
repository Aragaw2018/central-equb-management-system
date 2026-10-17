import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import {
    Phone, Mail, Loader2, AlertCircle,
    CheckCircle2, ArrowLeft, Eye, EyeOff,
} from 'lucide-react';

export default function SignupPage() {
    const navigate = useNavigate();
    const messageRef = useRef(null);

    const [formData, setFormData] = useState({
        firstName: '',
        fatherName: '',
        phoneNumber: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'MEMBER', // Automatically defaults to MEMBER
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Auto-scroll to message banner on error or success
    useEffect(() => {
        if ((error || success) && messageRef.current) {
            messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [error, success]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        if (!formData.firstName.trim() || !formData.fatherName.trim()) {
            setError("First Name and Father's Name are required.");
            return false;
        }

        const phoneRegex = /^(?:\+251|0)[79]\d{8}$/;
        if (!phoneRegex.test(formData.phoneNumber.trim())) {
            setError("Please enter a valid Ethiopian phone number (e.g. 0912345678 or +251912345678).");
            return false;
        }

        if (formData.email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email.trim())) {
                setError("Please enter a valid email address.");
                return false;
            }
        }

        if (!formData.password || formData.password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!validateForm()) return;

        setLoading(true);
        try {
            const res = await axiosInstance.post('/users/register', {
                firstName: formData.firstName.trim(),
                fatherName: formData.fatherName.trim(),
                phoneNumber: formData.phoneNumber.trim(),
                email: formData.email.trim() || undefined,
                password: formData.password,
                role: 'MEMBER', // Sent directly as MEMBER
            });

            setSuccess(res.data.message || "Account created successfully! Redirecting to login...");
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                "Registration failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    // ── Shared input styles ──────────────────────────────────────────────────
    const inputCls = "w-full p-4 bg-slate-100 rounded-2xl border-none font-bold outline-none ring-2 ring-transparent focus:ring-[#005C53] transition-all text-slate-800 placeholder:text-slate-400";

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-10 border border-slate-100 relative">

                {/* Back button */}
                <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-[#005C53] transition-all font-black text-[10px] uppercase tracking-widest group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to home
                </button>

                {/* Heading */}
                <div className="text-center mb-8 mt-4">
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Create Account</h1>
                    <p className="text-slate-400 font-bold mt-1 uppercase tracking-widest text-xs">
                        Central Digital Equb System
                    </p>
                  
                </div>

                <form onSubmit={handleSubmit} className="space-y-6" noValidate autoComplete="off">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* First Name */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">First Name *</label>
                            <input
                                type="text"
                                name="firstName"
                                required
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="e.g. Abebe"
                                className={inputCls}
                            />
                        </div>

                        {/* Father's Name */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Father's Name *</label>
                            <input
                                type="text"
                                name="fatherName"
                                required
                                value={formData.fatherName}
                                onChange={handleChange}
                                placeholder="e.g. Bikila"
                                className={inputCls}
                            />
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Phone Number *</label>
                            <div className="relative">
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    required
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    placeholder="09... or 07..."
                                    className={inputCls}
                                />
                                <Phone className="absolute right-4 top-4 text-slate-400" size={20} />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Email (Optional)</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    name="email"
                                    autoComplete="off"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="abebe@example.com"
                                    className={inputCls}
                                />
                                <Mail className="absolute right-4 top-4 text-slate-400" size={20} />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Password *</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    autoComplete="new-password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Min. 6 characters"
                                    className={`${inputCls} pr-12`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Confirm Password *</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    autoComplete="new-password"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className={`${inputCls} pr-12`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(v => !v)}
                                    className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div ref={messageRef} className="space-y-3">
                        {success && (
                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-700 font-bold text-sm">
                                <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                                <span>{success}</span>
                            </div>
                        )}
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 font-bold text-sm">
                                <AlertCircle size={20} className="shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-[#005C53] hover:bg-[#004a42] text-white rounded-2xl font-bold text-base shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
                    >
                        {loading
                            ? <><Loader2 className="animate-spin" size={20} /> Creating Account...</>
                            : 'Create Account'}
                    </button>
                </form>

                <p className="text-center mt-6 text-slate-500 font-bold text-sm">
                    Already have an account?{' '}
                    <Link to="/login" className="text-[#005C53] hover:underline font-black">Sign In</Link>
                </p>
            </div>
        </div>
    );
}