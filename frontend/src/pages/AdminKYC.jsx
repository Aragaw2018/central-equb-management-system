import React, { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import axiosInstance from '../api/axiosInstance';
import {
  ScanFace, CheckCircle2, XCircle, AlertCircle, Loader2,
  Clock, BadgeCheck, ShieldX, Search,
  CreditCard, X, ImageOff, ZoomIn, ExternalLink, UserCheck
} from 'lucide-react';

// Environment variable with localhost fallback
const API_BASE = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000';

// Helper to reliably resolve uploaded image URLs
const resolveImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanBase = API_BASE.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
};

// Helper for clean display name fallback
const getUserDisplayName = (user) => {
  if (!user) return 'Unnamed User';
  if (user.fullName && user.fullName.trim() !== '') return user.fullName;
  const combined = [user.firstName, user.fatherName].filter(Boolean).join(' ');
  if (combined.trim() !== '') return combined;
  return `Member (${user.phoneNumber || 'No Phone'})`;
};

const KYC_META = {
  PENDING: { label: 'Pending', style: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  VERIFIED: { label: 'Verified', style: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  REJECTED: { label: 'Rejected', style: 'bg-red-100 text-red-600', dot: 'bg-red-500' },
};

function IDImageModal({ user, onClose }) {
  const imageUrl = resolveImageUrl(user?.faydaImageUrl);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const displayName = getUserDisplayName(user);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!user) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-teal-50 rounded-[1rem] flex items-center justify-center shrink-0">
              <ScanFace size={20} className="text-[#005C53]" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 text-lg leading-tight">National Fayda ID Document</h3>
              <p className="text-xs font-bold text-slate-400 mt-0.5">{displayName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-[0.9rem] text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-wrap gap-4 px-8 py-4 bg-slate-50/70 border-b border-slate-100">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Fayda ID Number</p>
            <p className="font-black text-slate-800 font-mono text-sm">{user.faydaId || 'N/A'}</p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Phone</p>
            <p className="font-bold text-slate-600 text-sm">{user.phoneNumber}</p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Role</p>
            <p className="font-bold text-slate-600 text-sm uppercase">{user.role}</p>
          </div>
          <div className="ml-auto self-center">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${KYC_META[user.kycStatus]?.style}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${KYC_META[user.kycStatus]?.dot}`} />
              {KYC_META[user.kycStatus]?.label}
            </span>
          </div>
        </div>

        <div className="p-6">
          {!imageUrl ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 bg-slate-50 rounded-[1.5rem] border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 bg-slate-100 rounded-[1.2rem] flex items-center justify-center">
                <ImageOff size={28} className="text-slate-300" />
              </div>
              <div className="text-center">
                <p className="font-black text-slate-600">No ID photo uploaded</p>
                <p className="text-slate-400 text-sm font-medium mt-1">This user registered using Fayda number only without image upload.</p>
              </div>
            </div>
          ) : (
            <div className="relative rounded-[1.5rem] overflow-hidden bg-slate-100 border border-slate-200 min-h-[260px] flex items-center justify-center">
              {!imgLoaded && !imgError && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10">
                  <Loader2 size={28} className="animate-spin text-[#005C53]" />
                </div>
              )}

              {!imgError ? (
                <img
                  src={imageUrl}
                  alt={`${displayName} Fayda ID`}
                  onLoad={() => setImgLoaded(true)}
                  onError={() => setImgError(true)}
                  className={`w-full object-contain max-h-[420px] transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <ImageOff size={28} className="text-slate-300" />
                  <p className="text-slate-400 font-bold text-sm">Failed to load document image</p>
                </div>
              )}

              {imgLoaded && !imgError && (
                <a
                  href={imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-900/70 hover:bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full transition-all"
                >
                  <ExternalLink size={11} /> Open full size
                </a>
              )}
            </div>
          )}
        </div>

        <div className="px-8 py-5 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm rounded-[1rem] transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminKYC() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [counts, setCounts] = useState({ PENDING: 0, VERIFIED: 0, REJECTED: 0 });

  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [processing, setProcessing] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);

  const toastTimerRef = useRef(null);

  const showToast = useCallback((type, msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ type, msg });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchKYC = useCallback(async (status) => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await axiosInstance.get(`/admin/kyc?status=${status}`);
      // Strictly filter out ADMIN accounts
      const nonAdminUsers = (res.data.users || []).filter((u) => u.role !== 'ADMIN');
      setUsers(nonAdminUsers);
      setCounts((prev) => ({ ...prev, [status]: nonAdminUsers.length }));
    } catch {
      setFetchError('Failed to load KYC requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKYC(activeTab);
  }, [activeTab, fetchKYC]);

  const handleApprove = async (userId, userName) => {
    setProcessing(userId);
    try {
      await axiosInstance.patch(`/admin/kyc/${userId}`, { status: 'VERIFIED' });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setCounts((prev) => ({
        ...prev,
        PENDING: Math.max(0, prev.PENDING - 1),
        VERIFIED: prev.VERIFIED + 1,
      }));
      showToast('success', `KYC verified for ${userName}.`);
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Approval failed.');
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget || !rejectNote.trim()) return;
    setProcessing(rejectTarget.id);
    const targetName = getUserDisplayName(rejectTarget);
    try {
      await axiosInstance.patch(`/admin/kyc/${rejectTarget.id}`, {
        status: 'REJECTED',
        note: rejectNote.trim(),
      });
      setUsers((prev) => prev.filter((u) => u.id !== rejectTarget.id));
      setCounts((prev) => ({
        ...prev,
        PENDING: Math.max(0, prev.PENDING - 1),
        REJECTED: prev.REJECTED + 1,
      }));
      showToast('success', `KYC rejected for ${targetName}.`);
      setRejectTarget(null);
      setRejectNote('');
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Rejection failed.');
    } finally {
      setProcessing(null);
    }
  };

  // Filter with clean fallback for names and strict non-admin exclusion
  const filtered = users.filter((u) => {
    if (u.role === 'ADMIN') return false;
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const name = getUserDisplayName(u).toLowerCase();
    const phone = (u.phoneNumber || '').toLowerCase();
    const fayda = (u.faydaId || '').toLowerCase();
    return name.includes(q) || phone.includes(q) || fayda.includes(q);
  });

  return (
    <DashboardLayout role="ADMIN">
      {viewTarget && <IDImageModal user={viewTarget} onClose={() => setViewTarget(null)} />}

      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-[1.5rem] shadow-2xl font-bold text-sm transition-all duration-300 ${
          toast.type === 'success' ? 'bg-[#005C53] text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-50 rounded-[1.1rem] flex items-center justify-center shrink-0">
                  <XCircle size={24} className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800">Reject KYC</h3>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">{getUserDisplayName(rejectTarget)}</p>
                </div>
              </div>
              <button onClick={() => setRejectTarget(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-50 rounded-[1.5rem] p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-500">Fayda ID</span>
                <span className="font-black text-slate-800 font-mono">{rejectTarget.faydaId || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-500">Phone</span>
                <span className="font-bold text-slate-600">{rejectTarget.phoneNumber}</span>
              </div>
            </div>

            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
              Rejection Reason <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={3}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="e.g. Fayda ID number mismatch…"
              className="w-full px-4 py-3 bg-slate-50 rounded-[1.2rem] border-2 border-transparent focus:border-red-400 outline-none text-sm font-bold text-slate-700 resize-none transition-colors mb-4 placeholder:font-medium placeholder:text-slate-400"
            />
            <div className="flex flex-wrap gap-2 mb-6">
              {['ID image is blurry', 'Fayda ID number mismatch', 'Expired ID document', 'Name does not match registration'].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setRejectNote(reason)}
                  className={`px-3 py-1.5 rounded-[0.8rem] text-[11px] font-bold transition-all ${
                    rejectNote === reason ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setRejectTarget(null)}
                disabled={processing === rejectTarget?.id}
                className="flex-1 py-3 rounded-[1.2rem] border-2 border-slate-100 text-slate-500 font-bold hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!rejectNote.trim() || processing === rejectTarget?.id}
                className="flex-1 py-3 rounded-[1.2rem] bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing === rejectTarget?.id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                Reject KYC
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">KYC Verification</h1>
        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-1">National Fayda ID review & compliance queue</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        <StatCard icon={<Clock size={22} className="text-amber-500" />} label="Pending Review" value={counts.PENDING} accent="bg-amber-50" />
        <StatCard icon={<BadgeCheck size={22} className="text-emerald-600" />} label="Verified Members" value={counts.VERIFIED} accent="bg-emerald-50" />
        <StatCard icon={<ShieldX size={22} className="text-red-500" />} label="Rejected" value={counts.REJECTED} accent="bg-red-50" />
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search name, phone, or Fayda ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-[1.2rem] border-2 border-transparent focus:border-[#005C53] outline-none text-sm font-bold text-slate-700 placeholder:font-medium placeholder:text-slate-400 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            {['PENDING', 'VERIFIED', 'REJECTED'].map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSearch(''); }}
                className={`px-4 py-2 rounded-[1rem] text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                  activeTab === tab
                    ? tab === 'VERIFIED' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-100'
                      : tab === 'REJECTED' ? 'bg-red-500 text-white shadow-md shadow-red-100'
                        : 'bg-amber-400 text-white shadow-md shadow-amber-100'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                {KYC_META[tab].label}
                {counts[tab] > 0 && (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-white/30' : 'bg-slate-200 text-slate-600'}`}>
                    {counts[tab]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24 gap-3">
            <Loader2 size={36} className="animate-spin text-[#005C53]" />
            <span className="font-bold text-slate-400">Loading verification queue…</span>
          </div>
        )}

        {!loading && fetchError && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <AlertCircle size={36} className="text-red-300" />
            <p className="text-red-400 font-bold">{fetchError}</p>
            <button onClick={() => fetchKYC(activeTab)} className="px-6 py-2.5 bg-[#005C53] text-white rounded-[1rem] font-bold hover:bg-[#004840] transition-all">Retry</button>
          </div>
        )}

        {!loading && !fetchError && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-20 h-20 bg-teal-50/60 rounded-[1.5rem] flex items-center justify-center">
              <UserCheck size={36} className="text-[#005C53]" />
            </div>
            <div className="text-center">
              <p className="font-black text-slate-600 text-lg">
                {search ? 'No users match your search' : `No ${KYC_META[activeTab].label.toLowerCase()} requests`}
              </p>
              <p className="text-slate-400 text-xs font-medium mt-1">Queue is clear and up to date.</p>
            </div>
          </div>
        )}

        {!loading && !fetchError && filtered.length > 0 && (
          <div className="divide-y divide-slate-100">
            {filtered.map((user) => {
              const displayName = getUserDisplayName(user);
              return (
                <KYCRow
                  key={user.id}
                  user={user}
                  displayName={displayName}
                  activeTab={activeTab}
                  processing={processing}
                  onApprove={() => handleApprove(user.id, displayName)}
                  onReject={() => { setRejectTarget(user); setRejectNote(''); }}
                  onViewID={() => setViewTarget(user)}
                />
              );
            })}
          </div>
        )}

        {!loading && !fetchError && (
          <div className="px-8 py-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-bold">
              Showing <span className="text-slate-700 font-bold">{filtered.length}</span> of{' '}
              <span className="text-slate-700 font-bold">{users.length}</span> {KYC_META[activeTab].label.toLowerCase()} requests
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, label, value, accent }) {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 flex items-center gap-5">
      <div className={`w-14 h-14 ${accent} rounded-[1.2rem] flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="text-2xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function KYCRow({ user, displayName, activeTab, processing, onApprove, onReject, onViewID }) {
  const meta = KYC_META[user.kycStatus] || KYC_META.PENDING;
  const isProcessing = processing === user.id;
  const hasImage = Boolean(user.faydaImageUrl);
  const thumbUrl = resolveImageUrl(user.faydaImageUrl);

  return (
    <div className={`px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-colors hover:bg-slate-50/70 group ${
      isProcessing ? 'opacity-60 pointer-events-none' : ''
    }`}>
      {/* Thumbnail */}
      <button
        onClick={onViewID}
        title={hasImage ? 'Click to inspect document' : 'No document uploaded'}
        className="relative shrink-0 w-14 h-14 rounded-[1.1rem] overflow-hidden border-2 border-slate-200 bg-slate-100 flex items-center justify-center hover:border-[#005C53] hover:shadow-md transition-all group/thumb"
      >
        {hasImage ? (
          <>
            <img
              src={thumbUrl}
              alt={`${displayName} ID`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="hidden w-full h-full items-center justify-center absolute inset-0 bg-slate-100">
              <ImageOff size={16} className="text-slate-300" />
            </div>
            <div className="absolute inset-0 bg-[#005C53]/0 group-hover/thumb:bg-[#005C53]/60 flex items-center justify-center transition-all">
              <ZoomIn size={18} className="text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <ImageOff size={16} className="text-slate-300" />
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">No ID</span>
          </div>
        )}
      </button>

      {/* User Information */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-3 mb-1.5">
          <span className="font-black text-slate-900 text-base">{displayName}</span>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${meta.style}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          <span className="text-xs font-bold text-slate-600">{user.phoneNumber}</span>
          {user.email && <span className="text-xs font-medium text-slate-400">{user.email}</span>}
          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase tracking-wider">{user.role}</span>
          <span className="text-xs text-slate-400 font-medium">
            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
          </span>
        </div>
        {user.kycStatus === 'REJECTED' && user.kycNote && (
          <div className="flex items-start gap-2 mt-2 px-3 py-2 bg-red-50 rounded-xl border border-red-100 w-fit">
            <AlertCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs font-bold text-red-600">{user.kycNote}</p>
          </div>
        )}
      </div>

      {/* Fayda ID Card */}
      <div className="flex items-center gap-2.5 bg-teal-50/50 border border-teal-100/60 px-4 py-2.5 rounded-[1.2rem] shrink-0">
        <CreditCard size={16} className="text-[#005C53]" />
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fayda ID</p>
          <p className="font-black text-slate-800 font-mono text-sm">{user.faydaId || 'N/A'}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onViewID}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-[1.1rem] font-bold text-xs transition-all border ${
            hasImage
              ? 'bg-teal-50 text-[#005C53] border-teal-200 hover:bg-[#005C53] hover:text-white hover:border-[#005C53] shadow-sm'
              : 'bg-slate-50 text-slate-400 border-slate-200 cursor-default'
          }`}
          title={hasImage ? 'View uploaded ID document' : 'No document uploaded'}
        >
          <ZoomIn size={13} />
          View ID
        </button>

        {activeTab === 'PENDING' && (
          <>
            <button
              onClick={onApprove}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[1.1rem] font-bold text-xs shadow-md shadow-emerald-100 transition-all disabled:opacity-50 active:scale-95"
            >
              {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
              Approve
            </button>
            <button
              onClick={onReject}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-[1.1rem] font-bold text-xs transition-all disabled:opacity-50 active:scale-95"
            >
              <XCircle size={13} />
              Reject
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminKYC;