import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { 
    Phone, Mail, ShieldCheck, 
    Loader2, AlertCircle, CheckCircle2, 
    Upload, Camera, X, Scan, ArrowLeft,
    Eye, EyeOff, Building2
} from 'lucide-react';

export default function SignupPage() {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const messageRef = useRef(null); // ለስህተት መልእክቱ scroll ማድረጊያ reference

    const [formData, setFormData] = useState({
        firstName: '',
        fatherName: '',
        phoneNumber: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'MEMBER',
        faydaId: '',
        bankName: '',
        accountHolder: '',
        accountNumber: ''
    });

    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [showCamera, setShowCamera] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
            stopCamera();
        };
    }, [preview]);

    // ስህተት ወይም Success መልእክት በሚመጣበት ጊዜ ስክሪኑ አውቶማቲክ ወደ መልእክቱ እንዲወርድ ያደርጋል
    useEffect(() => {
        if ((error || success) && messageRef.current) {
            messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [error, success]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'faydaId' || name === 'accountNumber') {
            const cleanValue = value.replace(/\D/g, '');
            setFormData((prev) => ({ ...prev, [name]: cleanValue }));
            return;
        }

        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const startCamera = async () => {
        setError('');
        setShowCamera(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            setError("Camera access denied or unavailable. You can upload a file instead.");
            setShowCamera(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
            videoRef.current.srcObject = null;
        }
        setShowCamera(false);
    };

    const capturePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (video && canvas) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);
            
            canvas.toBlob((blob) => {
                if (!blob) return;
                const capturedFile = new File([blob], "fayda_id.jpg", { type: "image/jpeg" });
                
                if (preview) URL.revokeObjectURL(preview);
                setFile(capturedFile);
                setPreview(URL.createObjectURL(capturedFile));
                stopCamera();
            }, 'image/jpeg');
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (preview) URL.revokeObjectURL(preview);
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const removePhoto = () => {
        if (preview) URL.revokeObjectURL(preview);
        setFile(null);
        setPreview(null);
    };

    const validateForm = () => {
        if (!formData.firstName.trim() || !formData.fatherName.trim()) {
            setError("First Name and Father's Name are required.");
            return false;
        }

        const phoneRegex = /^(?:\+251|0)[79]\d{8}$/;
        if (!phoneRegex.test(formData.phoneNumber.trim())) {
            setError("Please enter a valid Ethiopian phone number (e.g., 0912345678 or +251912345678).");
            return false;
        }

        if (formData.email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email.trim())) {
                setError("Please enter a valid email address.");
                return false;
            }
        }

        if (!formData.role) {
            setError("Please select your role.");
            return false;
        }

        const faydaRegex = /^\d{12}$/;
        if (!faydaRegex.test(formData.faydaId)) {
            setError("Fayda ID must be exactly 12 digits.");
            return false;
        }

        // የባንክ መረጃዎች ግዴታ (Required) እንዲሆኑ የተደረገበት ማስተካከያ
        if (!formData.bankName.trim()) {
            setError("Bank Name is required.");
            return false;
        }

        if (!formData.accountHolder.trim()) {
            setError("Account Holder Name is required.");
            return false;
        }

        if (!formData.accountNumber.trim()) {
            setError("Account Number is required.");
            return false;
        }

        const bankRegex = /^\d{13}$/;
        if (!bankRegex.test(formData.accountNumber)) {
            setError("Bank account number must be exactly 13 digits.");
            return false;
        }

        if (!formData.password || formData.password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match!");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!validateForm()) return;

        const data = new FormData();
        Object.keys(formData).forEach((key) => {
            data.append(key, formData[key]);
        });
        
        if (file) {
            data.append('faydaImage', file);
        }

        setLoading(true);
        try {
            const res = await axiosInstance.post('/users/register', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            const successMsg = res.data.message || "Account created successfully!";
            setSuccess(successMsg);
            
            setTimeout(() => {
                navigate('/login');
            }, 2000);
            
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.response?.data?.message || "Registration failed. Try again.";
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl p-10 border border-slate-100 relative">
                
                <button 
                    type="button"
                    onClick={() => navigate('/')} 
                    className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-all font-black text-[10px] uppercase tracking-widest group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to home
                </button>
                
                <div className="text-center mb-10 mt-4">
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Create Account</h1>
                    <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-xs">Central Digital Ekub System</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6" noValidate autoComplete="off">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">First Name *</label>
                            <input 
                                type="text" 
                                name="firstName" 
                                required 
                                value={formData.firstName} 
                                onChange={handleChange}
                                placeholder="e.g. Abebe" 
                                className="w-full p-4 bg-slate-100 rounded-2xl border-none font-bold outline-none ring-2 ring-transparent focus:ring-blue-500 transition-all" 
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Father's Name *</label>
                            <input 
                                type="text" 
                                name="fatherName" 
                                required 
                                value={formData.fatherName} 
                                onChange={handleChange}
                                placeholder="e.g. Bikila" 
                                className="w-full p-4 bg-slate-100 rounded-2xl border-none font-bold outline-none ring-2 ring-transparent focus:ring-blue-500 transition-all" 
                            />
                        </div>

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
                                    className="w-full p-4 bg-slate-100 rounded-2xl border-none font-bold outline-none ring-2 ring-transparent focus:ring-blue-500 transition-all" 
                                />
                                <Phone className="absolute right-4 top-4 text-slate-300" size={20} />
                            </div>
                        </div>

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
                                    className="w-full p-4 bg-slate-100 rounded-2xl border-none font-bold outline-none ring-2 ring-transparent focus:ring-blue-500 transition-all" 
                                />
                                <Mail className="absolute right-4 top-4 text-slate-300" size={20} />
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Fayda ID Number (12 Digits) *</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    name="faydaId" 
                                    maxLength="12"
                                    required 
                                    value={formData.faydaId} 
                                    onChange={handleChange}
                                    placeholder="Enter your 12-digit FIN" 
                                    className="w-full p-4 bg-slate-100 rounded-2xl border-none font-bold outline-none ring-2 ring-transparent focus:ring-blue-500 transition-all" 
                                />
                                <ShieldCheck className="absolute right-4 top-4 text-slate-300" size={20} />
                            </div>
                        </div>

                        {/* Bank Details - ሁሉም መረጃዎች Required ሆነዋል */}
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100 shadow-inner">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-blue-500 uppercase">Bank Name *</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        name="bankName" 
                                        required
                                        value={formData.bankName} 
                                        onChange={handleChange} 
                                        placeholder="CBE / Telebirr" 
                                        className="w-full p-3 bg-white rounded-xl text-sm font-bold border-none outline-none focus:ring-2 focus:ring-blue-400" 
                                    />
                                    <Building2 className="absolute right-3 top-3 text-slate-300" size={16} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-blue-500 uppercase">Account Holder *</label>
                                <input 
                                    type="text" 
                                    name="accountHolder" 
                                    required
                                    value={formData.accountHolder} 
                                    onChange={handleChange} 
                                    placeholder="Full Name" 
                                    className="w-full p-3 bg-white rounded-xl text-sm font-bold border-none outline-none focus:ring-2 focus:ring-blue-400" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-blue-500 uppercase">Account Number (13 Digits) *</label>
                                <input 
                                    type="text" 
                                    name="accountNumber" 
                                    maxLength="13"
                                    required
                                    value={formData.accountNumber} 
                                    onChange={handleChange} 
                                    placeholder="13-digit number" 
                                    className="w-full p-3 bg-white rounded-xl text-sm font-bold border-none outline-none focus:ring-2 focus:ring-blue-400" 
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Password *</label>
                            <div className="relative">
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    name="password" 
                                    autoComplete="new-password"
                                    required 
                                    value={formData.password} 
                                    onChange={handleChange}
                                    placeholder="••••••••" 
                                    className="w-full p-4 bg-slate-100 rounded-2xl border-none font-bold outline-none ring-2 ring-transparent focus:ring-blue-500 transition-all pr-12" 
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Confirm Password *</label>
                            <div className="relative">
                                <input 
                                    type={showConfirmPassword ? "text" : "password"} 
                                    name="confirmPassword" 
                                    autoComplete="new-password"
                                    required 
                                    value={formData.confirmPassword} 
                                    onChange={handleChange}
                                    placeholder="••••••••" 
                                    className="w-full p-4 bg-slate-100 rounded-2xl border-none font-bold outline-none ring-2 ring-transparent focus:ring-blue-500 transition-all pr-12" 
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Fayda ID Photo (Optional)</label>
                        
                        {!preview && !showCamera && (
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    type="button" 
                                    onClick={startCamera} 
                                    className="flex flex-col items-center justify-center p-6 bg-slate-900 text-white rounded-[2rem] hover:bg-blue-600 transition-all gap-2 shadow-lg"
                                >
                                    <Camera size={24} />
                                    <span className="text-[10px] font-black uppercase">Scan via Camera</span>
                                </button>
                                <label className="flex flex-col items-center justify-center p-6 bg-slate-100 border-2 border-dashed border-slate-200 rounded-[2rem] cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all gap-2">
                                    <Upload size={24} className="text-slate-400" />
                                    <span className="text-[10px] font-black uppercase text-slate-500">Upload Document</span>
                                    <input type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
                                </label>
                            </div>
                        )}

                        {showCamera && (
                            <div className="relative bg-black rounded-[2rem] overflow-hidden shadow-2xl">
                                <video ref={videoRef} autoPlay playsInline className="w-full h-64 object-cover" />
                                <div className="absolute inset-0 border-[3px] border-blue-500/30 m-8 rounded-lg pointer-events-none border-dashed animate-pulse" />
                                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 px-4">
                                    <button 
                                        type="button" 
                                        onClick={stopCamera} 
                                        className="p-3 bg-red-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                                    >
                                        <X size={20} />
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={capturePhoto} 
                                        className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-all"
                                    >
                                        <Scan size={18} /> Capture ID
                                    </button>
                                </div>
                            </div>
                        )}

                        {preview && (
                            <div className="relative rounded-[2rem] overflow-hidden border-4 border-emerald-500 shadow-xl">
                                <img src={preview} alt="Fayda ID Preview" className="w-full h-48 object-cover" />
                                <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[9px] font-black px-3 py-1.5 rounded-full flex items-center gap-1">
                                    <CheckCircle2 size={12} /> ID SCANNED
                                </div>
                                <button 
                                    type="button" 
                                    onClick={removePhoto} 
                                    className="absolute top-3 right-3 p-2 bg-white/90 text-red-500 rounded-full hover:bg-white transition-all shadow-md"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div ref={messageRef}>
                        {success && (
                            <div className="p-5 bg-emerald-50 border-2 border-emerald-200 rounded-2xl flex items-center gap-4 text-emerald-700 font-black text-sm animate-bounce">
                                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shrink-0 shadow-lg">
                                    <CheckCircle2 size={24} className="text-white" />
                                </div>
                                <div>
                                    <p className="uppercase text-[10px] tracking-widest">Success</p>
                                    <p>{success}</p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 font-bold text-sm">
                                <AlertCircle size={20} className="shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" /> SECURING ACCOUNT...
                            </>
                        ) : (
                            "SIGN UP & FINALIZE"
                        )}
                    </button>
                </form>

                <p className="text-center mt-8 text-slate-500 font-bold">
                    Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
                </p>
            </div>
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}