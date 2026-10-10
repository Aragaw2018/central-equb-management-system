import React, { useState } from 'react';
import { ShieldCheck, Info, AlertCircle, FileText, ArrowLeft, CheckCircle2 } from 'lucide-react';

/**
 * AgreementPage Component
 * @param {Object} props.plan - Selected Equb plan specifications (amount, penalty, members, size, startDate)
 * @param {Function} props.onAgree - Callback function executed upon confirmation
 * @param {Function} props.onBack - Callback function for navigation back
 */
function AgreementPage({ plan = {}, onAgree, onBack }) {
  const [agreed, setAgreed] = useState(false);

  // Safe formatting helpers
  const formatCurrency = (val) => (typeof val === 'number' ? val.toLocaleString() : val || '0');
  
  const amount = formatCurrency(plan?.amount);
  const penalty = formatCurrency(plan?.penalty);
  const members = plan?.members ?? 0;
  const size = plan?.size ?? 1;
  const startDate = plan?.startDate || 'Pending Announcement';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="bg-white max-w-2xl w-full rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* --- Header Section --- */}
        <div className="bg-slate-900 p-8 md:p-10 text-white flex items-center gap-6">
          <div className="bg-blue-500/20 p-4 rounded-2xl hidden sm:flex items-center justify-center shrink-0">
            <FileText size={40} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">Membership Agreement</h2>
            <p className="text-slate-400 font-bold mt-1 text-sm md:text-base">
              Selected: <span className="text-blue-400">{amount} ETB</span> ({size} {size === 1 ? 'Piece' : 'Pieces'})
            </p>
          </div>
        </div>

        {/* --- Content Body --- */}
        <div className="p-8 md:p-10 space-y-8 max-h-[55vh] md:max-h-[60vh] overflow-y-auto custom-scrollbar">
          
          {/* 1. Specific Plan Summary */}
          <section className="bg-blue-50/70 p-6 rounded-[2rem] border border-blue-100/80">
            <h3 className="flex items-center gap-2 text-blue-800 font-black mb-4 uppercase text-xs tracking-widest">
              <Info size={18} /> Plan Specifications
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col">
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Late Penalty</span>
                <span className="text-blue-700 font-black text-base md:text-lg">{penalty} ETB</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Total Members</span>
                <span className="text-blue-700 font-black text-base md:text-lg">{members} People</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Start Date</span>
                <span className="text-blue-700 font-black text-base md:text-lg">{startDate}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Contribution</span>
                <span className="text-blue-700 font-black text-base md:text-lg">{amount} ETB</span>
              </div>
            </div>
          </section>

          {/* 2. System Operation & Rules */}
          <section className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-black text-slate-800">
              <ShieldCheck className="text-emerald-500 shrink-0" size={22} /> How it Works
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              By joining this specific <span className="font-bold text-slate-800">{size} piece</span> plan, you commit to contributing 
              <span className="font-bold text-slate-800"> {amount} ETB </span> on a regular schedule. 
              The system ensures a fair, transparent, and automated draw for all verified members.
            </p>
            
            {/* Penalty Warning Box */}
            <div className="flex gap-4 items-start p-5 bg-amber-50/80 rounded-2xl border border-amber-200/60">
              <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-amber-900 text-xs font-black uppercase mb-1 tracking-wider">Strict Deadline Policy</p>
                <p className="text-amber-800 text-[13px] font-bold leading-snug">
                  Contributions must be made before 10:30 AM EAT. Late payments will automatically incur 
                  a <span className="underline decoration-amber-400">{penalty} ETB fine</span>.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Member Commitment */}
          <section className="text-slate-500 text-[13px] italic font-medium border-l-4 border-slate-300 pl-4 py-1">
            "I understand that my trust score depends on my payment consistency, 
            and I agree to provide a valid guarantor (Wase) upon winning a draw."
          </section>
        </div>

        {/* --- Footer & Acceptance Area --- */}
        <div className="p-8 md:p-10 bg-slate-50/80 border-t border-slate-100">
          
          {/* Custom Styled Checkbox Label */}
          <label className="flex items-center gap-4 cursor-pointer mb-8 group p-4 bg-white rounded-2xl border border-slate-200/80 transition-all hover:border-blue-300 shadow-sm select-none">
            <div className="relative flex items-center justify-center shrink-0">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="peer appearance-none w-6 h-6 border-2 border-slate-300 rounded-lg checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <CheckCircle2 size={16} className="absolute text-white pointer-events-none hidden peer-checked:block" />
            </div>
            <span className="text-slate-700 text-sm font-bold group-hover:text-blue-600 transition-colors">
              I have read and agree to the {amount} ETB plan rules.
            </span>
          </label>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Back Button */}
            <button
              type="button"
              onClick={onBack}
              className="flex-1 flex items-center justify-center gap-2 py-4 text-slate-500 font-bold hover:text-slate-800 hover:bg-slate-100 rounded-2xl transition-all"
            >
              <ArrowLeft size={18} /> Go Back
            </button>

            {/* Confirm & Join Button */}
            <button
              type="button"
              disabled={!agreed}
              onClick={onAgree}
              className={`flex-[2] py-4 rounded-2xl font-black text-base md:text-lg shadow-xl transition-all active:scale-[0.98] ${
                agreed
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              Confirm & Join
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgreementPage;