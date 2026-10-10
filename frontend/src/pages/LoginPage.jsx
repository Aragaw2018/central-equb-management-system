import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Phone, Lock, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'; 
import axiosInstance from '../api/axiosInstance';

// ─── LOGO IMPORT ───
import logoImg from '../assets/logo.jpg';

/**
 * LoginPage component handles authentication with role-based routing.
 */
function LoginPage() {
    const navigate = useNavigate();

    // State management
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

    const handleLogin = async (e) => {
        e.preventDefault();
        
        const cleanIdentifier = identifier.trim();
        if (!cleanIdentifier || !password) {
            setStatusMessage({ type: 'error', text: 'Please fill in all required fields.' });
            return;
        }

        setLoading(true);
        setStatusMessage({ type: '', text: '' });

        try {
            const response = await axiosInstance.post('/users/login', { 
                identifier: cleanIdentifier, 
                password 
            });
            
            const user = response.data?.user;
            if (!user) throw new Error("Invalid response format from server.");

            localStorage.setItem('user', JSON.stringify(user));

            // Role-based Navigation
            if (user.role === 'ADMIN') {
                navigate('/admin-dashboard');
            } else if (user.role === 'ORGANIZER') {
                if (user.isApproved) {
                    navigate('/organizer-dashboard');
                } else {
                    setStatusMessage({ 
                        type: 'warning', 
                        text: 'Your account is pending Admin approval.' 
                    });
                }
            } else {
                navigate('/member-dashboard');
            }

        } catch (err) {
            const errorMsg = err.response?.data?.error || "Invalid credentials. Please check again.";
            setStatusMessage({ type: 'error', text: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    const clearForm = () => {
        setIdentifier('');
        setPassword('');
        setStatusMessage({ type: '', text: '' });
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans antialiased">
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md border border-slate-100 animate-in zoom-in-95 duration-300 relative">
                
                {/* ─── BACK TO HOME BUTTON ─── */}
                <button 
                    type="button"
                    onClick={() => navigate('/')} 
                    className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-all font-black text-[10px] uppercase tracking-widest group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to home
                </button>

                {/* Header Section */}
                <div className="text-center mt-6">
                    <h2 className="text-4xl font-black text-slate-800 tracking-tight">Welcome Back</h2>
                    
                    {/* ─── LOGO ─── */}
                    <div className="my-6 relative inline-block">
                        <div className="absolute inset-0 bg-blue-100 blur-3xl rounded-full scale-150 opacity-50" />
                        <img 
                            src={logoImg} 
                            alt="Central Equb Logo" 
                            className="relative w-28 h-28 object-contain mix-blend-multiply drop-shadow-md" 
                        />
                    </div>
                    
                    <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Identify Transmission</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6 mt-8">
                    {/* Identifier Input */}
                    <div>
                        <label htmlFor="identifier" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                            Email or Phone
                        </label>
                        <div className="relative group">
                            <input 
                                id="identifier"
                                type="text"
                                disabled={loading}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none transition-all duration-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 font-bold text-slate-700 disabled:opacity-50"
                                placeholder="Email or 09..."
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                required
                            />
                            <div className={`absolute left-4 top-4.5 transition-colors duration-200 ${identifier ? 'text-blue-500' : 'text-slate-300'}`}>
                                {identifier.includes('@') ? <Mail size={20}/> : <Phone size={20}/>}
                            </div>
                        </div>
                    </div>

                    {/* Password Input */}
                    <div>
                        <div className="flex justify-between items-end mb-2 ml-1">
                            <label htmlFor="password" className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                Password
                            </label>
                            <button 
                                type="button" 
                                onClick={() => navigate('/forgot-password')}
                                className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest transition-all"
                            >
                                Forgot password?
                            </button>
                        </div>
                        <div className="relative group">
                            <input 
                                id="password"
                                type={showPassword ? "text" : "password"}
                                disabled={loading}
                                className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none transition-all duration-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 font-bold text-slate-700 disabled:opacity-50"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <Lock className={`absolute left-4 top-4.5 transition-colors duration-200 ${password ? 'text-blue-500' : 'text-slate-300'}`} size={20}/>
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-4.5 text-slate-300 hover:text-blue-500 transition-colors"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4">
                        <button 
                            type="button" 
                            onClick={clearForm} 
                            disabled={loading}
                            className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-200 active:scale-95 transition-all disabled:opacity-50"
                        >
                            Clear
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-900 shadow-xl shadow-blue-100 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : "Login"}
                        </button>
                    </div>
                </form>

                {/* Footer Section */}
                <p className="text-center text-slate-400 mt-10 text-[11px] font-black uppercase tracking-widest">
                    New to the system? {' '}
                    <button 
                        type="button"
                        onClick={() => navigate('/signup')}
                        className="text-blue-600 hover:text-blue-800 underline transition-all"
                    >
                        Sign up
                    </button>
                </p>

                {/* Server Response Feedback */}
                {statusMessage.text && (
                    <div 
                        role="alert"
                        className={`mt-8 p-4 rounded-2xl text-center text-xs font-black uppercase tracking-widest animate-in slide-in-from-bottom-2 duration-500 flex items-center justify-center gap-2 ${
                            statusMessage.type === 'error'
                                ? 'bg-red-50 text-red-600 border border-red-100'
                                : statusMessage.type === 'warning'
                                ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                        }`}
                    >
                        {statusMessage.type === 'error' || statusMessage.type === 'warning' ? (
                            <AlertCircle size={16} />
                        ) : (
                            <CheckCircle2 size={16} />
                        )}
                        {statusMessage.text}
                    </div>
                )}
            </div>
        </div>
    );
}

export default LoginPage;