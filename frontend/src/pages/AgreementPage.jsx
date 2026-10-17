import React, { useState } from 'react';
import {
  ShieldCheck,
  Info,
  AlertCircle,
  AlertTriangle,
  FileText,
  ArrowLeft,
  CheckCircle2,
  Clock,
  CalendarDays,
  Ban,
  Lock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

/**
 * AgreementPage
 *
 * Props:
 *   plan.amount         - number  Base contribution amount in ETB
 *   plan.tier1Penalty   - number  Light penalty ETB (admin-configured)
 *   plan.tier2Penalty   - number  Medium penalty ETB
 *   plan.tier3Penalty   - number  Severe penalty ETB
 *   plan.category       - string  'DAILY' | 'WEEKLY' | 'MONTHLY'
 *   plan.members        - number  Max members in the group
 *   plan.size           - string  Group name / slot identifier
 *   plan.startDate      - string  Formatted start date
 *   onAgree()           - callback: member confirmed
 *   onBack()            - callback: go back
 */
function AgreementPage({ plan = {}, onAgree, onBack }) {
  const [agreed, setAgreed] = useState(false);
  const [policyExpanded, setPolicyExpanded] = useState(false);

  // Safe number formatter
  const fmtETB = (val) => `${Number(val || 0).toLocaleString()} ETB`;

  const amount = Number(plan?.amount || 0);
  const members = plan?.members ?? 0;
  const size = plan?.size ?? '';
  const startDate = plan?.startDate || 'Pending Announcement';
  const category = plan?.category || 'DAILY';

  // Resolve tier penalty amounts with fallbacks for legacy plans
  // whose tier fields are 0 / null / undefined.
  // Priority: explicit tier field → legacy flat penalty → % of base amount → hard minimum
  const rawPenalty = Number(plan?.penalty || 0);

  const t1 = (() => {
    const v = Number(plan?.tier1Penalty || 0);
    if (v > 0) return v;
    if (rawPenalty > 0) return rawPenalty;
    if (amount > 0) return Math.round(amount * 0.05);
    return 10;
  })();

  const t2 = (() => {
    const v = Number(plan?.tier2Penalty || 0);
    if (v > 0) return v;
    if (rawPenalty > 0) return Math.round(rawPenalty * 1.5);
    if (amount > 0) return Math.round(amount * 0.10);
    return 25;
  })();

  const t3 = (() => {
    const v = Number(plan?.tier3Penalty || 0);
    if (v > 0) return v;
    if (rawPenalty > 0) return Math.round(rawPenalty * 2.5);
    if (amount > 0) return Math.round(amount * 0.20);
    return 50;
  })();

  // Category display label
  const categoryLabel =
    category === 'DAILY' ? 'Daily' :
      category === 'WEEKLY' ? 'Weekly' :
        category === 'MONTHLY' ? 'Monthly' : category;

  const frequencyWord =
    category === 'DAILY' ? 'day' :
      category === 'WEEKLY' ? 'week' : 'month';

  // Schedule rows — built per category so only the relevant one is ever rendered
  const SCHEDULE_CONFIG = {
    DAILY: {
      icon: <Clock size={15} className="text-violet-500" />,
      title: 'Daily Equb — Payment Schedule',
      rows: [
        {
          status: 'Regular Payment',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          window: 'Before 10:00 AM (EAT)',
          note: 'Draw takes place at 10:00 AM',
          fee: null,   // null = on-time (0 ETB)
          defaulted: false,
        },
        {
          status: 'Tier 1 — Light Penalty',
          badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          dot: 'bg-yellow-400',
          window: '10:00 AM – 12:00 PM (EAT)',
          note: '',
          fee: t1,
          defaulted: false,
        },
        {
          status: 'Tier 2 — Medium Penalty',
          badge: 'bg-orange-100 text-orange-800 border-orange-200',
          dot: 'bg-orange-400',
          window: '12:00 PM – 2:00 AM next day (EAT)',
          note: '',
          fee: t2,
          defaulted: false,
        },
        {
          status: 'Tier 3 — Severe Penalty',
          badge: 'bg-red-100 text-red-800 border-red-200',
          dot: 'bg-red-500',
          window: '2:00 AM – 6:00 AM next day (EAT)',
          note: '',
          fee: t3,
          defaulted: false,
        },
        {
          status: 'DEFAULTED',
          badge: 'bg-red-700 text-white border-red-700',
          dot: 'bg-red-900',
          window: 'After 6:00 AM next day',
          note: 'Membership terminated',
          fee: null,
          defaulted: true,
        },
      ],
    },

    WEEKLY: {
      icon: <CalendarDays size={15} className="text-blue-500" />,
      title: 'Weekly Equb — Payment Schedule',
      rows: [
        {
          status: 'Regular Payment',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          window: 'Before Sunday 10:00 AM (EAT)',
          note: 'Draw takes place on Sunday at 10:00 AM',
          fee: null,
          defaulted: false,
        },
        {
          status: 'Tier 1 — Light Penalty',
          badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          dot: 'bg-yellow-400',
          window: 'Sunday 10:00 AM – Tuesday 10:00 AM',
          note: '',
          fee: t1,
          defaulted: false,
        },
        {
          status: 'Tier 2 — Medium Penalty',
          badge: 'bg-orange-100 text-orange-800 border-orange-200',
          dot: 'bg-orange-400',
          window: 'Tuesday 10:00 AM – Thursday 10:00 AM',
          note: '',
          fee: t2,
          defaulted: false,
        },
        {
          status: 'Tier 3 — Severe Penalty',
          badge: 'bg-red-100 text-red-800 border-red-200',
          dot: 'bg-red-500',
          window: 'Thursday 10:00 AM – Saturday 10:00 AM',
          note: '',
          fee: t3,
          defaulted: false,
        },
        {
          status: 'DEFAULTED',
          badge: 'bg-red-700 text-white border-red-700',
          dot: 'bg-red-900',
          window: 'After Saturday 10:00 AM',
          note: 'Membership terminated',
          fee: null,
          defaulted: true,
        },
      ],
    },

    MONTHLY: {
      icon: <CalendarDays size={15} className="text-emerald-500" />,
      title: 'Monthly Equb — Payment Schedule',
      rows: [
        {
          status: 'Regular Payment',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          window: 'Days 1 – 7 (Week 1)',
          note: 'Draw takes place during Week 1',
          fee: null,
          defaulted: false,
        },
        {
          status: 'Tier 1 — Light Penalty',
          badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          dot: 'bg-yellow-400',
          window: 'Days 8 – 14 (Week 2)',
          note: '',
          fee: t1,
          defaulted: false,
        },
        {
          status: 'Tier 2 — Medium Penalty',
          badge: 'bg-orange-100 text-orange-800 border-orange-200',
          dot: 'bg-orange-400',
          window: 'Days 15 – 21 (Week 3)',
          note: '',
          fee: t2,
          defaulted: false,
        },
        {
          status: 'Tier 3 — Severe Penalty',
          badge: 'bg-red-100 text-red-800 border-red-200',
          dot: 'bg-red-500',
          window: 'Days 22 – 28 (Week 4)',
          note: '',
          fee: t3,
          defaulted: false,
        },
        {
          status: 'DEFAULTED',
          badge: 'bg-red-700 text-white border-red-700',
          dot: 'bg-red-900',
          window: 'After Day 28',
          note: 'Membership terminated',
          fee: null,
          defaulted: true,
        },
      ],
    },
  };

  // Only the schedule matching the plan's category is used — no other categories shown
  const schedule = SCHEDULE_CONFIG[category] || SCHEDULE_CONFIG.DAILY;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="bg-white max-w-2xl w-full rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-300">

        {/* Header */}
        <div className="bg-slate-900 p-8 md:p-10 text-white flex items-center gap-6">
          <div className="bg-blue-500/20 p-4 rounded-2xl hidden sm:flex items-center justify-center shrink-0">
            <FileText size={40} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">Membership Agreement</h2>
            <p className="text-slate-400 font-bold mt-1 text-sm md:text-base">
              Selected:{' '}
              <span className="text-blue-400">{fmtETB(amount)}</span>
              {size ? ` — ${size}` : ''}
            </p>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="p-8 md:p-10 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">

          {/* 1. Plan Specifications */}
          <section className="bg-blue-50/70 p-6 rounded-[2rem] border border-blue-100/80">
            <h3 className="flex items-center gap-2 text-blue-800 font-black mb-5 uppercase text-xs tracking-widest">
              <Info size={16} /> Plan Specifications
            </h3>
            <div className="grid grid-cols-2 gap-5 mb-5">
              <SpecCell label="Plan Type" value={`${categoryLabel} Equb`} />
              <SpecCell label="Total Members" value={`${members} Members`} />
              <SpecCell label="Contribution" value={fmtETB(amount)} />
              <SpecCell label="Start Date" value={startDate} />
            </div>

            {/* Penalty tier summary — shows actual admin amounts */}
            <div className="pt-4 border-t border-blue-100">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">
                Penalty Structure
              </p>
              <div className="grid grid-cols-3 gap-2">
                <PenaltyChip
                  label="Tier 1 — Light"
                  amount={t1}
                  cls="bg-yellow-50 border-yellow-200 text-yellow-800"
                />
                <PenaltyChip
                  label="Tier 2 — Medium"
                  amount={t2}
                  cls="bg-orange-50 border-orange-200 text-orange-800"
                />
                <PenaltyChip
                  label="Tier 3 — Severe"
                  amount={t3}
                  cls="bg-red-50 border-red-200 text-red-800"
                />
              </div>
            </div>
          </section>

          {/* 2. How It Works */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 text-lg font-black text-slate-800">
              <ShieldCheck className="text-emerald-500 shrink-0" size={22} />
              How It Works
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              By joining this <span className="font-bold text-slate-800">{categoryLabel} Equb</span>,
              you commit to contributing{' '}
              <span className="font-bold text-slate-800">{fmtETB(amount)}</span> every {frequencyWord}.
              The system runs a fair, transparent, and automated draw for all verified members.
            </p>
          </section>

          {/* 3. Penalty & Default Policy */}
          <section className="rounded-[2rem] border border-red-200 overflow-hidden">

            {/* Collapsible header */}
            <button
              type="button"
              onClick={() => setPolicyExpanded((v) => !v)}
              className="w-full flex items-center justify-between gap-3 px-6 py-5 bg-red-50 hover:bg-red-100/60 transition-colors text-left"
              aria-expanded={policyExpanded}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle size={18} className="text-red-500 shrink-0" />
                <div>
                  <p className="text-red-800 font-black text-sm uppercase tracking-wider">
                    Penalty &amp; Default Policy
                  </p>
                  <p className="text-red-500 text-[11px] font-semibold">
                    Legally binding — read carefully before confirming
                  </p>
                </div>
              </div>
              {policyExpanded
                ? <ChevronUp size={18} className="text-red-400 shrink-0" />
                : <ChevronDown size={18} className="text-red-400 shrink-0" />}
            </button>

            {policyExpanded && (
              <div className="px-6 pb-6 pt-5 space-y-6 bg-white">

                {/* Schedule table — only the category matching this plan */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    {schedule.icon}
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      {schedule.title}
                    </span>
                  </div>

                  <div className="rounded-2xl overflow-hidden border border-slate-200">
                    {/* Column headers */}
                    <div className="grid grid-cols-3 bg-slate-100 px-4 py-3">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        Status
                      </span>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        Payment Window
                      </span>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider text-right">
                        Fee
                      </span>
                    </div>

                    {/* Rows */}
                    {schedule.rows.map((row, i) => (
                      <div
                        key={i}
                        className={`grid grid-cols-3 items-start px-4 py-3.5 border-t border-slate-100 ${row.defaulted ? 'bg-red-50/50' : ''
                          }`}
                      >
                        {/* Status badge */}
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${row.dot}`} />
                          <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-lg border ${row.badge}`}>
                            {row.defaulted && <Ban size={9} />}
                            {row.status}
                          </span>
                        </div>

                        {/* Window */}
                        <div>
                          <p className="text-xs font-semibold text-slate-700">{row.window}</p>
                          {row.note && (
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{row.note}</p>
                          )}
                        </div>

                        {/* Fee — sentinel: null = on-time, positive number = penalty amount */}
                        <div className="text-right">
                          {row.defaulted ? (
                            <span className="text-[10px] font-black text-red-600 uppercase tracking-wide">
                              Excluded / Terminated
                            </span>
                          ) : row.fee === null ? (
                            <span className="text-xs font-black text-emerald-600">
                              0 ETB (On-Time)
                            </span>
                          ) : (
                            <span className="text-xs font-black text-red-700">
                              +{Number(row.fee).toLocaleString()} ETB
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Capital Retention Rule */}
                <div className="flex gap-3 items-start p-5 bg-slate-900 rounded-2xl">
                  <Lock size={16} className="text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-amber-300 font-black text-xs uppercase tracking-wider mb-2">
                      Capital Retention Rule
                    </p>
                    <p className="text-slate-300 text-[12px] font-medium leading-relaxed">
                      If a member is defaulted or excluded, any previously paid rounds are{' '}
                      <span className="text-white font-bold">locked</span> and will{' '}
                      <span className="text-amber-400 font-bold">ONLY</span> be refunded at the end
                      of the Equb cycle, minus all incurred penalties.
                    </p>
                  </div>
                </div>

                {/* Legal exclusion notice */}
                <div className="flex gap-3 items-start p-4 bg-red-50 rounded-2xl border border-red-200">
                  <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-red-800 font-black text-xs uppercase tracking-wider mb-1">
                      Exclusion &amp; Legal Accountability
                    </p>
                    <p className="text-red-700 text-[12px] font-medium leading-relaxed">
                      Members who reach DEFAULTED status are permanently excluded from the current
                      Equb cycle and may be restricted from joining future groups. Legal proceedings
                      may follow for outstanding financial obligations.
                    </p>
                  </div>
                </div>

              </div>
            )}
          </section>

          {/* 4. Member Commitment */}
          <section className="text-slate-500 text-[13px] italic font-medium border-l-4 border-slate-300 pl-4 py-1">
            "I understand that my trust score depends on my payment consistency,
            and I agree to provide a valid guarantor upon winning a draw."
          </section>

        </div>

        {/* Footer */}
        <div className="p-8 md:p-10 bg-slate-50/80 border-t border-slate-100">
          <label className="flex items-center gap-4 cursor-pointer mb-8 group p-4 bg-white rounded-2xl border border-slate-200 transition-all hover:border-blue-300 shadow-sm select-none">
            <div className="relative flex items-center justify-center shrink-0">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="peer appearance-none w-6 h-6 border-2 border-slate-300 rounded-lg checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <CheckCircle2
                size={16}
                className="absolute text-white pointer-events-none hidden peer-checked:block"
              />
            </div>
            <span className="text-slate-700 text-sm font-bold group-hover:text-blue-600 transition-colors">
              I have read and agree to the {fmtETB(amount)} plan rules, including the Penalty &amp; Default Policy.
            </span>
          </label>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 flex items-center justify-center gap-2 py-4 text-slate-500 font-bold hover:text-slate-800 hover:bg-slate-100 rounded-2xl transition-all"
            >
              <ArrowLeft size={18} /> Go Back
            </button>
            <button
              type="button"
              disabled={!agreed}
              onClick={onAgree}
              className={`flex-[2] py-4 rounded-2xl font-black text-base md:text-lg shadow-xl transition-all active:scale-[0.98] ${agreed
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
            >
              Confirm &amp; Join
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// Helper: spec grid cell
function SpecCell({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-0.5">
        {label}
      </span>
      <span className="text-blue-700 font-black text-base">{value}</span>
    </div>
  );
}

// Helper: penalty tier chip in plan spec card
function PenaltyChip({ label, amount, cls }) {
  return (
    <div className={`flex flex-col items-center p-3 rounded-xl border text-center ${cls}`}>
      <span className="text-[9px] font-black uppercase tracking-wider mb-1">{label}</span>
      <span className="text-sm font-black">
        {amount > 0
          ? `${Number(amount).toLocaleString()} ETB`
          : <span className="opacity-40 font-bold">Not set</span>}
      </span>
    </div>
  );
}

export default AgreementPage;
