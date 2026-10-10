import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import axiosInstance from '../api/axiosInstance';
import {
  Trophy, Shield, CheckCircle2, XCircle, Loader2,
  AlertCircle, Wallet, Clock, BadgeCheck,
  ChevronDown, ChevronUp, ZoomIn,
  ShieldAlert, ShieldCheck, ImageOff, X, ExternalLink, Camera, Landmark, Map
} from 'lucide-react';

const API_BASE = 'http://localhost:5000';

// ── Status Badges ──────────────────────────────────────────────────────────────
function GuarantorBadge({ status }) {
  const map = {
    PENDING: { label: 'Wase Pending', cls: 'bg-amber-100 text-amber-700', icon: <Clock size={11} /> },
    ACCEPTED: { label: 'Wase Accepted', cls: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 size={11} /> },
    REJECTED: { label: 'Wase Rejected', cls: 'bg-red-100 text-red-600', icon: <XCircle size={11} /> },
    NONE: { label: 'Not set', cls: 'bg-slate-100 text-slate-500', icon: <AlertCircle size={11} /> },
  };
  const m = map[status] || map.NONE;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${m.cls}`}>
      {m.icon} {m.label}
    </span>
  );
}

function DocStatusBadge({ status }) {
  const map = {
    PENDING: { label: 'Docs Pending', cls: 'bg-amber-100 text-amber-700', icon: <Clock size={11} /> },
    VERIFIED: { label: 'Docs Verified', cls: 'bg-emerald-100 text-emerald-700', icon: <ShieldCheck size={11} /> },
    REJECTED: { label: 'Docs Rejected', cls: 'bg-red-100 text-red-600', icon: <ShieldAlert size={11} /> },
  };
  const m = map[status] || map.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${m.cls}`}>
      {m.icon} {m.label}
    </span>
  );
}

function FundsBadge({ released }) {
  return released ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700">
      <Wallet size={11} /> Released
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-500">
      <Wallet size={11} /> Pending
    </span>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, accent }) {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 flex items-center gap-4 hover:shadow-md transition-all">
      <div className={`w-14 h-14 ${accent} rounded-[1.2rem] flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="text-2xl font-black text-slate-800">{value}</p>
      </div>
    </div>
  );
}

// ── Document Viewer Modal ──────────────────────────────────────────────────────
function DocViewerModal({ result, onClose, onVerify, verifying }) {
  const g = result?.guarantor;
  const checkUrl = g?.checkImageUrl ? `${API_BASE}${g.checkImageUrl}` : null;
  const landUrl = g?.landDocUrl ? `${API_BASE}${g.landDocUrl}` : null;
  const faceUrl = g?.documentUrl ? `${API_BASE}${g.documentUrl}` : null; 
  const docStatus = g?.documentStatus || 'PENDING';
  const canVerify = docStatus === 'PENDING' && g?.status === 'ACCEPTED';

  function DocImg({ url, label, icon: Icon }) {
    const [loaded, setLoaded] = useState(false);
    return (
      <div className="flex-1 flex flex-col gap-2 min-w-[200px]">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
          {Icon && <Icon size={12} className="text-blue-500" />} {label}
        </p>
        <div className="relative bg-slate-100 rounded-[1.5rem] overflow-hidden border border-slate-200 h-48 flex items-center justify-center">
          {!url ? (
            <div className="text-center">
              <ImageOff size={24} className="text-slate-300 mx-auto" />
              <p className="text-[9px] font-bold text-slate-400 mt-2">Not Uploaded</p>
            </div>
          ) : (
            <>
              {!loaded && <Loader2 className="animate-spin text-slate-400" />}
              <img 
                src={url} 
                alt={label} 
                onLoad={() => setLoaded(true)} 
                className={`w-full h-full object-cover ${loaded ? 'block' : 'hidden'}`} 
              />
              {loaded && (
                <a href={url} target="_blank" rel="noreferrer" className="absolute top-2 right-2 p-2 bg-slate-900/60 text-white rounded-full hover:bg-slate-900 transition-all">
                  <ExternalLink size={12} />
                </a>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95">
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
             <ShieldCheck size={24} className="text-blue-600" />
             <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Security Asset Verification</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all">
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <DocImg url={faceUrl} label="Face & ID Scan" icon={Camera} />
                <DocImg url={checkUrl} label="Bank Check" icon={Landmark} />
                <DocImg url={landUrl} label="Land Title Map" icon={Map} />
            </div>
            <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-5 flex gap-4">
                <ShieldAlert className="text-amber-600 shrink-0" size={24} />
                <p className="text-xs font-bold text-amber-800 leading-relaxed">
                    <b>LEGAL AUDIT:</b> Verify that all three security assets are authentic. By approving, you confirm that the Equb Pot distribution is secured by these legal collaterals.
                </p>
            </div>
            <div className="mt-8 flex justify-end gap-3">
                <button onClick={onClose} className="px-6 py-3 font-black text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                {canVerify && (
                    <button 
                      onClick={() => onVerify(g.id, 'VERIFIED')} 
                      disabled={verifying} 
                      className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-lg flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {verifying ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />} VERIFY & APPROVE COLLATERAL
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}

// ── Expandable Table Row ───────────────────────────────────────────────────────
function PayoutRow({ result, onRelease, releasing, onViewDocs }) {
  const [expanded, setExpanded] = useState(false);
  const g = result.guarantor;
  const guarantorStatus = g?.status || 'NONE';
  const docStatus = g?.documentStatus || 'PENDING';
  const hasAcceptedGuarantor = guarantorStatus === 'ACCEPTED';
  const docsVerified = docStatus === 'VERIFIED';
  const canRelease = hasAcceptedGuarantor && docsVerified && !result.isFundsReleased;

  return (
    <>
      <tr className="hover:bg-slate-50/60 transition-colors cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <td className="px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-100 rounded-[0.8rem] flex items-center justify-center shrink-0">
              <span className="text-slate-900 text-xs font-black">{result.roundNumber}</span>
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm">{result.group?.name}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                {result.drawnAt ? new Date(result.drawnAt).toLocaleDateString('en-GB') : 'N/A'}
              </p>
            </div>
          </div>
        </td>
        <td className="px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-black text-xs shadow-inner">
              {result.winner?.fullName?.[0] || 'U'}
            </div>
            <div>
              <p className="font-bold text-slate-700 text-sm">{result.winner?.fullName || 'N/A'}</p>
              <p className="text-[10px] text-slate-400 font-mono tracking-tighter">{result.winner?.phoneNumber || 'N/A'}</p>
            </div>
          </div>
        </td>
        <td className="px-6 py-5 font-black text-slate-900 text-sm">
           {Number(result.potAmount || 0).toLocaleString()} <span className="text-[10px] text-slate-400">ETB</span>
        </td>
        <td className="px-6 py-5">
          <div className="flex flex-col gap-1.5 items-start">
            <GuarantorBadge status={guarantorStatus} />
            {hasAcceptedGuarantor && <DocStatusBadge status={docStatus} />}
          </div>
        </td>
        <td className="px-6 py-5">
            <FundsBadge released={result.isFundsReleased} />
        </td>
        <td className="px-6 py-5" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-2">
            {hasAcceptedGuarantor && (
              <button 
                onClick={() => onViewDocs(result)} 
                className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                title="View Collateral Assets"
              >
                <ZoomIn size={18} />
              </button>
            )}
            
            {!result.isFundsReleased ? (
              <button 
                onClick={() => onRelease(result)} 
                disabled={!canRelease || releasing === result.id}
                className={`px-4 py-2.5 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 transition-all
                  ${canRelease ? 'bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
              >
                {releasing === result.id ? <Loader2 size={12} className="animate-spin" /> : <Wallet size={12} />}
                Release Pot
              </button>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-500 font-black text-[10px] px-3 py-2 bg-emerald-50 rounded-xl uppercase">
                <BadgeCheck size={14} /> Completed
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-5 text-slate-300">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </td>
      </tr>

      {/* ── Expanded Details ── */}
      {expanded && (
        <tr className="bg-slate-50/80 animate-in fade-in duration-300">
          <td colSpan={7} className="px-8 pb-8 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm">
              <div className="bg-white rounded-2xl p-5 border shadow-sm flex flex-col justify-between">
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-3 tracking-widest">Transaction Winner</p>
                    <p className="font-black text-slate-800 text-base">{result.winner?.fullName || 'N/A'}</p>
                    <p className="text-slate-500 text-xs mt-1">{result.winner?.email || 'No email provided'}</p>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-5 border shadow-sm">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-3 tracking-widest">Nominated Wase (Guarantor)</p>
                {g ? (
                  <>
                    <p className="font-black text-slate-800 text-base">{g.guarantor?.fullName || 'N/A'}</p>
                    <p className="text-slate-500 text-xs mt-1">{g.guarantor?.phoneNumber || 'N/A'}</p>
                    <div className="mt-3 inline-block px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-mono font-bold">
                      CHK: {g.checkNumber || 'Pending'}
                    </div>
                  </>
                ) : <p className="text-slate-400 italic text-xs">No guarantor selected yet.</p>}
              </div>

              {/* ── Bank Details ── */}
              <div className="bg-blue-600 rounded-2xl p-5 text-white shadow-xl shadow-blue-100 flex flex-col justify-center">
                  <p className="text-[9px] font-black uppercase opacity-60 mb-3 tracking-widest">Target Bank Account</p>
                  {result.winner?.accountNumber ? (
                      <div className="space-y-1">
                          <p className="text-xs font-bold">{result.winner.bankName}</p>
                          <p className="text-xl font-black font-mono tracking-tight">{result.winner.accountNumber}</p>
                          <p className="text-[10px] font-medium opacity-80 uppercase mt-2">Holder: {result.winner.accountHolder}</p>
                      </div>
                  ) : (
                      <p className="text-white/60 text-xs italic font-bold">Winner has not set bank details yet.</p>
                  )}
              </div>

              <div className="bg-white rounded-2xl p-5 border shadow-sm flex flex-col justify-between">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-3 tracking-widest">Pot Status</p>
                {result.isFundsReleased ? (
                   <p className="font-black text-emerald-600 flex items-center gap-2 text-base"><CheckCircle2 size={18} /> SUCCESSFUL</p>
                ) : (
                   <p className="text-slate-500 text-[11px] font-bold leading-relaxed">
                      {!docsVerified ? '🔒 Locked: Security verification required in Gallery.' : '✅ Unlocked: Click "Release Pot" to finalize the transfer.'}
                   </p>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function OrganizerPayouts() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [releasing, setReleasing] = useState(null);
  const [verifying, setVerifying] = useState(null);
  const [docTarget, setDocTarget] = useState(null);

  const fetchPayouts = async () => {
    if (!user.id) {
      setError("User authentication session not found.");
      setLoading(false);
      return;
    }
    try {
      const res = await axiosInstance.get(`/guarantor/payouts/${user.id}`);
      setResults(res.data);
    } catch (err) {
      setError('Failed to fetch payout distribution data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchPayouts(); 
  }, []);

  const handleVerifyDocs = async (guarantorId, documentStatus) => {
    setVerifying(guarantorId);
    try {
      await axiosInstance.patch(`/guarantor/${guarantorId}/verify-docs`, {
        organizerId: user.id,
        documentStatus,
      });
      await fetchPayouts();
      setDocTarget(null);
    } catch (err) {
      alert("Verification failed: " + (err.response?.data?.error || "Server error"));
    } finally {
      setVerifying(null);
    }
  };

  const handleRelease = async (result) => {
    const potDisplay = Number(result.potAmount || 0).toLocaleString();
    const msg = `CRITICAL BANK ACTION:\n\nYou are about to electronically release ${potDisplay} ETB to ${result.winner?.fullName}.\n\nThis will trigger the banking system to transfer the total pot and mark this round as CLOSED.\n\nProceed?`;
    
    if (!window.confirm(msg)) return;

    setReleasing(result.id);
    try {
      await axiosInstance.patch(`/guarantor/release/${result.id}`, { organizerId: user.id });
      alert(`✅ FUNDS RELEASED: ${potDisplay} ETB has been successfully transferred to ${result.winner?.fullName}.`);
      fetchPayouts();
    } catch (err) {
      alert("Fund release failed. Contact system administrator.");
    } finally {
      setReleasing(null);
    }
  };

  const totalCount = results.length;
  const releasedCount = results.filter(r => r.isFundsReleased).length;
  const docsPending = results.filter(r => r.guarantor?.documentStatus === 'PENDING' && r.guarantor?.status === 'ACCEPTED').length;

  return (
    <DashboardLayout role="ORGANIZER">

      {docTarget && (
        <DocViewerModal
          result={docTarget}
          onClose={() => setDocTarget(null)}
          onVerify={handleVerifyDocs}
          verifying={!!verifying}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-10 mb-20">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Payout Control</h1>
            <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-[10px]">Pot Distribution Center • Legal Audit Hub</p>
          </div>
          <div className="bg-blue-600 px-6 py-3 rounded-2xl text-white font-black text-xs shadow-xl flex items-center gap-2 self-start md:self-auto">
             <ShieldCheck size={16}/> AUTHORIZED OPERATOR: {(user?.fullName || 'ORGANIZER').toUpperCase()}
          </div>
        </div>

        {!loading && !error && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<Trophy size={26} className="text-amber-600" />} label="Total Rounds" value={totalCount} accent="bg-amber-50" />
                <StatCard icon={<ShieldCheck size={26} className="text-emerald-600" />} label="Pot Released" value={releasedCount} accent="bg-emerald-50" />
                <StatCard icon={<Clock size={26} className="text-blue-600" />} label="Audit Required" value={docsPending} accent="bg-blue-50" />
                <StatCard icon={<ShieldAlert size={26} className="text-red-600" />} label="Legal Risks" value="0" accent="bg-red-50" />
            </div>
        )}

        <div className="bg-red-50 border-2 border-red-200 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-8 shadow-sm">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <ShieldAlert size={40} className="text-red-600" />
            </div>
            <div>
                <h3 className="font-black text-red-700 text-lg mb-1 uppercase tracking-tight">Operator Legal Accountability</h3>
                <p className="text-red-600 text-sm font-medium leading-relaxed">
                   Releasing pot funds is an <b>irreversible banking action</b>. You are legally obligated to verify the Guarantor's Biometric Face Scan, Signed Check, and Land Deed before clicking release. Any distribution without verified collateral violates Central Ekub security policies.
                </p>
            </div>
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
          {loading ? (
            <div className="py-40 flex flex-col items-center gap-4">
               <Loader2 size={48} className="animate-spin text-blue-500 opacity-20" />
               <p className="font-black text-slate-300 uppercase tracking-widest text-[10px]">Syncing Distribution Ledger...</p>
            </div>
          ) : error ? (
            <div className="py-20 text-center space-y-4">
                <AlertCircle size={40} className="text-red-300 mx-auto" />
                <p className="font-bold text-red-500">{error}</p>
                <button onClick={() => window.location.reload()} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black text-xs hover:bg-slate-800 transition-all">RETRY CONNECTION</button>
            </div>
          ) : results.length === 0 ? (
            <div className="py-32 text-center text-slate-400 space-y-4">
                <ImageOff size={48} className="mx-auto opacity-10" />
                <p className="font-black text-sm uppercase tracking-widest">No rounds completed yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <th className="px-8 py-6">Round / Group</th>
                    <th className="px-8 py-6">Winner Name</th>
                    <th className="px-8 py-6">Total Pot</th>
                    <th className="px-8 py-6">Legal (Wase)</th>
                    <th className="px-8 py-6">Payment</th>
                    <th className="px-8 py-6">Actions</th>
                    <th className="px-4 py-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map(r => (
                    <PayoutRow 
                      key={r.id} 
                      result={r} 
                      onViewDocs={setDocTarget} 
                      onRelease={handleRelease} 
                      releasing={releasing}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none"><Shield size={120} /></div>
            <div className="relative z-10">
                <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                   <BadgeCheck className="text-blue-400" /> STANDARDIZED DISTRIBUTION PROTOCOL
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {[
                        {n: '01', t: 'NOMINATION', d: 'Winner selects an approved member as their Wase.'},
                        {n: '02', t: 'ASSET UPLOAD', d: 'Wase accepts and uploads bank check, land map and face scan.'},
                        {n: '03', t: 'VERIFICATION', d: 'Organizer audits all 3 security assets in the gallery.'},
                        {n: '04', t: 'POT RELEASE', d: 'Funds are electronically distributed to the winner.'},
                    ].map((step, i) => (
                        <div key={i} className="space-y-2">
                            <span className="text-blue-500 font-black text-3xl">{step.n}</span>
                            <p className="font-black text-sm tracking-widest uppercase">{step.t}</p>
                            <p className="text-slate-400 text-xs leading-relaxed font-medium">{step.d}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>

      </div>
    </DashboardLayout>
  );
}