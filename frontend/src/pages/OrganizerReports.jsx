import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import axiosInstance from '../api/axiosInstance';
import {
  FileText, Users, Loader2, ArrowRight, Download,
  ShieldCheck, ShieldAlert, TrendingUp, Search,
  ImageOff, AlertCircle, Printer, Trophy, CreditCard,
  Wallet, CheckCircle2,
} from 'lucide-react';

// ── Category badge colours ────────────────────────────────────────────────────
const CAT_CLS = {
  DAILY: 'bg-violet-100 text-violet-700',
  WEEKLY: 'bg-blue-100   text-blue-700',
  MONTHLY: 'bg-emerald-100 text-emerald-700',
};

export default function OrganizerReports() {
  const user = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  }, []);

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [report, setReport] = useState(null); // full group report data
  const [members, setMembers] = useState([]); // from /members endpoint
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const printRef = useRef(null);

  useEffect(() => {
    if (!user?.id) { setError('User session not found.'); setLoading(false); return; }
    axiosInstance.get(`/organizer/groups/${user.id}`)
      .then(res => setGroups(res.data?.groups || []))
      .catch(() => setError('Failed to fetch organizer groups.'))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleViewReport = async (groupId) => {
    setReportLoading(true);
    setMembers([]);
    setSearch('');
    try {
      // Fetch both group report (payments per member) + member roster (payment status)
      const [reportRes, membersRes] = await Promise.all([
        axiosInstance.get(`/organizer/groups/${groupId}/report`),
        axiosInstance.get(`/organizer/groups/${groupId}/members`),
      ]);
      setReport(reportRes.data);
      setMembers(membersRes.data?.members || []);
    } catch {
      alert('Failed to load audit report. Please try again.');
    } finally {
      setReportLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const filteredGroups = groups.filter(g =>
    g?.name?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Compute KPI cards from memberships ────────────────────────────────────
  const totalCapital = report?.memberships?.reduce((sum, m) => {
    const paid = (m.payments || [])
      .filter(p => p.status === 'APPROVED')
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    return sum + paid;
  }, 0) ?? 0;

  const totalPenalties = report?.memberships?.reduce((sum, m) => {
    const pens = (m.payments || [])
      .filter(p => p.status === 'APPROVED')
      .reduce((s, p) => s + Number(p.penaltyAmount || 0), 0);
    return sum + pens;
  }, 0) ?? 0;

  // For each member, compute contribution totals from payments in the report
  const memberMap = React.useMemo(() => {
    const map = {};
    (report?.memberships || []).forEach(m => {
      const approvedPayments = (m.payments || []).filter(p => p.status === 'APPROVED');
      const totalPaid = approvedPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
      const penaltyTotal = approvedPayments.reduce((s, p) => s + Number(p.penaltyAmount || 0), 0);
      const completedRounds = approvedPayments.length;
      map[m.user?.id || m.userId] = { totalPaid, penaltyTotal, completedRounds };
    });
    return map;
  }, [report]);

  // Wins (from draw results in report) for each user
  const winMap = React.useMemo(() => {
    const map = {};
    // drawResults are not in the basic report — derive from hasWon in members
    (members || []).forEach(m => {
      if (m.hasWon) map[m.userId] = true;
    });
    return map;
  }, [members]);

  return (
    <DashboardLayout role="ORGANIZER">
      <div className="max-w-7xl mx-auto space-y-10 mb-20">

        {/* ── Header ───────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Financial Audit & Reports</h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">
              Group Ledger • Member Financials • Print Export
            </p>
          </div>
          {report && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setReport(null); setMembers([]); }}
                className="px-5 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-xs uppercase hover:bg-slate-200 transition-all"
              >
                Back to List
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-6 py-3 bg-[#005C53] text-white rounded-xl font-black text-xs uppercase shadow-lg hover:bg-[#004a42] transition-all active:scale-95"
              >
                <Printer size={14} /> Print / Export PDF
              </button>
            </div>
          )}
        </div>

        {/* ── Loading / Error ───────────────────────────────────── */}
        {loading ? (
          <div className="py-40 flex flex-col items-center gap-4 bg-white rounded-[3rem] border border-slate-100 shadow-xl">
            <Loader2 size={40} className="animate-spin text-[#005C53]/40" />
            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Loading System Ledger...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center bg-white rounded-[3rem] border border-slate-100 p-8 space-y-4">
            <AlertCircle size={40} className="text-red-400 mx-auto" />
            <p className="font-bold text-slate-700">{error}</p>
          </div>

        ) : !report ? (

          /* ── GROUP SELECTION LIST ─────────────────────────── */
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
            <div className="p-8 border-b bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="font-black text-slate-800 text-xl tracking-tight">Select Group to Audit</h3>
              <div className="relative w-full sm:w-auto">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="text"
                  placeholder="Search groups..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full sm:w-64 pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-[#005C53]"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b bg-slate-50/30">
                    <th className="px-10 py-6">Group Identity</th>
                    <th className="px-10 py-6">Category</th>
                    <th className="px-10 py-6">Capacity</th>
                    <th className="px-10 py-6">Cycle Amount</th>
                    <th className="px-10 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredGroups.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-slate-400">
                        <ImageOff size={36} className="mx-auto opacity-20 mb-3" />
                        <p className="font-bold text-sm">No groups found.</p>
                      </td>
                    </tr>
                  ) : filteredGroups.map(g => (
                    <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-10 py-6">
                        <p className="font-black text-slate-800 text-base">{g.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                          Started {g.startDate ? new Date(g.startDate).toLocaleDateString('en-GB') : 'N/A'}
                        </p>
                      </td>
                      <td className="px-10 py-6">
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase ${CAT_CLS[g.plan?.category] || 'bg-slate-100 text-slate-500'}`}>
                          {g.plan?.category || 'N/A'}
                        </span>
                      </td>
                      <td className="px-10 py-6">
                        <span className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                          <Users size={14} /> {g._count?.memberships || 0} / {g.plan?.maxMembers || '∞'}
                        </span>
                      </td>
                      <td className="px-10 py-6 font-black text-slate-900">
                        {Number(g.plan?.amount || 0).toLocaleString()} ETB
                      </td>
                      <td className="px-10 py-6 text-right">
                        <button
                          onClick={() => handleViewReport(g.id)}
                          disabled={reportLoading}
                          className="px-6 py-2.5 bg-[#005C53] hover:bg-[#004a42] text-white rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center gap-2 ml-auto transition-all disabled:opacity-50"
                        >
                          {reportLoading
                            ? <Loader2 size={14} className="animate-spin" />
                            : <><FileText size={13} /> Generate Audit <ArrowRight size={13} /></>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        ) : (

          /* ── FULL FINANCIAL AUDIT REPORT ─────────────────── */
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-400 print:space-y-6" ref={printRef}>

            {/* Print-only header */}
            <div className="hidden print:block mb-6 pb-4 border-b-2 border-slate-200">
              <h2 className="text-2xl font-black text-slate-900">Financial Audit Report — {report.name}</h2>
              <p className="text-sm text-slate-500 mt-1">Generated {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>

            {/* ── KPI Cards ─────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3">
              <div className="p-7 bg-[#005C53] rounded-[2rem] text-white shadow-xl flex items-center gap-5">
                <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center shrink-0">
                  <TrendingUp size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase opacity-70 tracking-wider mb-1">Total Capital Collected</p>
                  <p className="text-2xl font-black">{totalCapital.toLocaleString()} ETB</p>
                  <p className="text-[10px] opacity-60 mt-0.5">Approved contributions</p>
                </div>
              </div>

              <div className="p-7 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Wallet size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Total Payouts Distributed</p>
                  <p className="text-2xl font-black text-slate-800">
                    {Number(report.plan?.amount || 0) > 0
                      ? `${((members.filter(m => m.hasWon).length) * Number(report.plan.amount)).toLocaleString()} ETB`
                      : '—'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{members.filter(m => m.hasWon).length} winner{members.filter(m => m.hasWon).length !== 1 ? 's' : ''} so far</p>
                </div>
              </div>

              <div className="p-7 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                  <CreditCard size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Organizer Penalty Yield</p>
                  <p className="text-2xl font-black text-slate-800">{totalPenalties.toLocaleString()} ETB</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Late fees collected</p>
                </div>
              </div>
            </div>

            {/* ── Financial Ledger Table ────────────────── */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden print:rounded-none print:shadow-none print:border-slate-300">
              <div className="px-8 py-6 border-b bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-[#005C53]" />
                  <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">
                    Member Financial Ledger — {report.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                  <Users size={13} /> {report.memberships?.length || 0} Members
                  &nbsp;•&nbsp; Round {report.currentRound || 1}
                </div>
              </div>

              {/* Print-visible heading */}
              <div className="hidden print:block px-8 py-4 border-b">
                <p className="font-black text-slate-800 text-base uppercase">{report.name} — Member Financial Ledger</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b bg-slate-50/40">
                      <th className="px-8 py-5">#</th>
                      <th className="px-8 py-5">Member Name & Phone</th>
                      <th className="px-8 py-5">National Fayda ID</th>
                      <th className="px-8 py-5">Total Contributions</th>
                      <th className="px-8 py-5">Completed Rounds</th>
                      <th className="px-8 py-5">Late Penalties</th>
                      <th className="px-8 py-5">Winnings / Payout Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(report.memberships || []).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-slate-400">
                          <Users size={32} className="mx-auto opacity-20 mb-3" />
                          <p className="font-bold text-sm">No approved members yet.</p>
                        </td>
                      </tr>
                    ) : (report.memberships || []).map((m, i) => {
                      const mid = m.user?.id || m.userId;
                      const fin = memberMap[mid] || { totalPaid: 0, penaltyTotal: 0, completedRounds: 0 };
                      const won = winMap[mid] || m.hasWon;
                      const kyc = m.user?.kycStatus === 'VERIFIED';
                      const totalRounds = report.currentRound || 1;
                      const planAmt = Number(report.plan?.amount || 0);

                      return (
                        <tr key={m.id || m.userId} className="hover:bg-slate-50/60 transition-colors">
                          {/* # */}
                          <td className="px-8 py-5">
                            <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                              {i + 1}
                            </span>
                          </td>

                          {/* Name + Phone */}
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <p className="font-black text-slate-800 text-sm">{m.user?.fullName || 'N/A'}</p>
                              {kyc
                                ? <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
                                : <ShieldAlert size={12} className="text-amber-400 shrink-0" />}
                            </div>
                            <p className="text-[11px] font-mono text-slate-400">{m.user?.phoneNumber || '—'}</p>
                          </td>

                          {/* Fayda ID */}
                          <td className="px-8 py-5">
                            <span className="font-mono text-xs font-bold text-[#005C53] bg-[#005C53]/8 px-2.5 py-1 rounded-lg">
                              {m.user?.faydaId || 'NOT LINKED'}
                            </span>
                          </td>

                          {/* Total Contributions */}
                          <td className="px-8 py-5">
                            <p className="font-black text-slate-800 text-sm">
                              {fin.totalPaid > 0
                                ? `${fin.totalPaid.toLocaleString()} ETB`
                                : <span className="text-slate-400 font-bold">0 ETB</span>}
                            </p>
                          </td>

                          {/* Completed Rounds */}
                          <td className="px-8 py-5">
                            <p className="font-black text-slate-700 text-sm">
                              {fin.completedRounds} / {totalRounds} Rounds
                            </p>
                            <div className="mt-1 h-1.5 w-20 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#005C53] rounded-full"
                                style={{ width: totalRounds > 0 ? `${(fin.completedRounds / totalRounds) * 100}%` : '0%' }}
                              />
                            </div>
                          </td>

                          {/* Penalties */}
                          <td className="px-8 py-5">
                            {fin.penaltyTotal > 0 ? (
                              <span className="text-xs font-black text-red-600 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">
                                +{fin.penaltyTotal.toLocaleString()} ETB
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-emerald-600">None</span>
                            )}
                          </td>

                          {/* Win / Payout Status */}
                          <td className="px-8 py-5">
                            {won ? (
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                                <Trophy size={11} /> Won — {planAmt > 0 ? `${(planAmt * (report.memberships?.length || 1)).toLocaleString()} ETB pot` : 'Winner'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                                <CheckCircle2 size={11} /> Eligible for Draw
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Print footer */}
            <div className="hidden print:block text-center text-xs text-slate-400 pt-4 border-t border-slate-200">
              Central Equb Management System — Confidential Financial Report — {new Date().toLocaleDateString('en-GB')}
            </div>

          </div>
        )}
      </div>

      {/* Global print styles — hides dashboard chrome */}
      <style>{`
                @media print {
                    nav, aside, header, footer,
                    [data-sidebar], .print\\:hidden { display: none !important; }
                    body { background: white !important; }
                    @page { margin: 1.5cm; }
                }
            `}</style>
    </DashboardLayout>
  );
}
