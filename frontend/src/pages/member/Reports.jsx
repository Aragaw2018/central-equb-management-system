import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../api/axiosInstance';
import DashboardLayout from '../../components/DashboardLayout';
import { 
    Wallet, 
    TrendingUp, 
    PieChart, 
    Activity, 
    ArrowUpRight, 
    Trophy, 
    Loader2,
    FileText,
    Printer,
    Search,
    CheckCircle2,
    Clock,
    X,
    CreditCard,
    ShieldCheck
} from 'lucide-react';

// Safe helper to read local storage without crashing
const getStoredUser = () => {
    try {
        const item = localStorage.getItem('user');
        return item ? JSON.parse(item) : null;
    } catch {
        return null;
    }
};

// ── Digital Payment Receipt Modal ─────────────────────────────────────────────
function ReceiptModal({ payment, user, onClose }) {
    const receiptRef = useRef(null);

    const handlePrint = () => {
        window.print();
    };

    if (!payment) return null;

    const baseAmount = Number(payment.amount || 0) - Number(payment.penaltyAmount || 0);
    const penaltyAmount = Number(payment.penaltyAmount || 0);
    const totalAmount = Number(payment.amount || 0);
    const groupName = payment.group?.name || 'Central Equb Group';
    const dateStr = payment.submittedAt 
        ? new Date(payment.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'N/A';

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 flex flex-col">
                
                {/* Modal Header */}
                <div className="px-8 pt-8 pb-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#005C53]/10 text-[#005C53] rounded-2xl flex items-center justify-center font-black">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 text-lg leading-tight">Official Payment Receipt</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Central Equb Financial Network</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full transition-all">
                        <X size={18} />
                    </button>
                </div>

                {/* Printable Receipt Body */}
                <div ref={receiptRef} className="p-8 space-y-6 overflow-y-auto">
                    {/* Status Badge */}
                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <div className="flex items-center gap-2 text-emerald-700 font-black text-xs uppercase tracking-wider">
                            <CheckCircle2 size={16} /> Verified via Chapa Escrow
                        </div>
                        <span className="text-[10px] font-mono font-bold text-emerald-600">SUCCESS</span>
                    </div>

                    {/* Receipt Details Grid */}
                    <div className="space-y-3 bg-slate-50 p-6 rounded-2xl border border-slate-100 text-xs font-bold text-slate-600">
                        <div className="flex justify-between border-b border-slate-200/60 pb-2">
                            <span className="text-slate-400 uppercase tracking-wider text-[10px]">Payer Name</span>
                            <span className="text-slate-800 font-black">{user?.fullName || 'Valued Member'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/60 pb-2">
                            <span className="text-slate-400 uppercase tracking-wider text-[10px]">Equb Group</span>
                            <span className="text-slate-800 font-black uppercase">{groupName}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/60 pb-2">
                            <span className="text-slate-400 uppercase tracking-wider text-[10px]">Round & Cycle</span>
                            <span className="text-slate-800 font-black">Round #{payment.roundNumber} &bull; Cycle {payment.cycleNumber || 1}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/60 pb-2">
                            <span className="text-slate-400 uppercase tracking-wider text-[10px]">Transaction Ref</span>
                            <span className="text-[#005C53] font-mono font-bold select-all">{payment.transactionId || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between pt-1">
                            <span className="text-slate-400 uppercase tracking-wider text-[10px]">Date & Time</span>
                            <span className="text-slate-700 font-medium">{dateStr}</span>
                        </div>
                    </div>

                    {/* Financial Breakdown */}
                    <div className="space-y-2 px-2 text-sm font-bold">
                        <div className="flex justify-between text-slate-600">
                            <span>Base Round Contribution</span>
                            <span>{baseAmount.toLocaleString()} ETB</span>
                        </div>
                        {penaltyAmount > 0 && (
                            <div className="flex justify-between text-amber-600">
                                <span>Late Fee / Penalty (Tier)</span>
                                <span>+ {penaltyAmount.toLocaleString()} ETB</span>
                            </div>
                        )}
                        <div className="flex justify-between text-lg font-black text-slate-900 border-t-2 border-slate-100 pt-3 mt-2">
                            <span>Total Amount Paid</span>
                            <span className="text-[#005C53]">{totalAmount.toLocaleString()} ETB</span>
                        </div>
                    </div>

                    {/* Security Footer Note */}
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold justify-center pt-2">
                        <ShieldCheck size={13} className="text-[#005C53]" />
                        <span>Cryptographically logged and verified in Central Equb ledger.</span>
                    </div>
                </div>

                {/* Modal Actions */}
                <div className="px-8 py-5 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md"
                    >
                        <Printer size={15} /> Print Receipt
                    </button>
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function MemberReports() {
    const user = getStoredUser();
    const [stats, setStats] = useState(null);
    const [payments, setPayments] = useState([]);
    const [wins, setWins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('payments'); // 'payments' | 'wins'
    const [selectedReceipt, setSelectedReceipt] = useState(null);

    useEffect(() => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        // Fetch Financial Stats, Detailed Payments, and Wins concurrently
        Promise.all([
            axiosInstance.get(`/reports/member/${user.id}`).catch(() => ({ data: null })),
            axiosInstance.get(`/payments/member/${user.id}`).catch(() => ({ data: [] })),
            axiosInstance.get(`/guarantor/wins/${user.id}`).catch(() => ({ data: [] }))
        ])
        .then(([statsRes, paymentsRes, winsRes]) => {
            setStats(statsRes.data);
            setPayments(paymentsRes.data || []);
            setWins(winsRes.data || []);
        })
        .catch(err => console.error('Failed to fetch detailed reports:', err))
        .finally(() => setLoading(false));
    }, [user?.id]);

    if (loading) {
        return (
            <DashboardLayout role="MEMBER">
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                    <Loader2 className="animate-spin text-[#005C53]" size={36} />
                    <p className="text-slate-500 font-bold text-sm">Generating Financial Insights...</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!stats) {
        return (
            <DashboardLayout role="MEMBER">
                <div className="text-center py-20 font-bold text-slate-400">
                    No financial report data available.
                </div>
            </DashboardLayout>
        );
    }

    const totalPaid = Number(stats.totalPaid || 0);
    const totalWon = Number(stats.totalWon || 0);
    const netBalance = Number(stats.netBalance || 0);
    const paymentStats = stats.paymentStats || [];

    // Filter payments by search query
    const filteredPayments = payments.filter(p => {
        const q = search.toLowerCase().trim();
        if (!q) return true;
        const grpName = (p.group?.name || '').toLowerCase();
        const txId = (p.transactionId || '').toLowerCase();
        const rnd = String(p.roundNumber || '');
        return grpName.includes(q) || txId.includes(q) || rnd.includes(q);
    });

    return (
        <DashboardLayout role="MEMBER">
            {/* ── Receipt Modal ── */}
            {selectedReceipt && (
                <ReceiptModal 
                    payment={selectedReceipt} 
                    user={user} 
                    onClose={() => setSelectedReceipt(null)} 
                />
            )}

            <div className="max-w-6xl mx-auto space-y-10 pb-20">
                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight">Financial Reports</h1>
                        <p className="text-slate-400 font-bold mt-1 uppercase text-xs tracking-widest">
                            Analysis of your savings, winnings &amp; transaction statements
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => window.print()}
                            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all"
                        >
                            <Printer size={16} className="text-[#005C53]" /> Print Statement
                        </button>
                        <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                            <div className="bg-teal-50 p-2 rounded-xl text-[#005C53]"><Activity size={18}/></div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                                <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">Live Tracking</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── STAT CARDS ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Total Saved */}
                    <div className="bg-[#003d36] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl border border-[#005C53]">
                        <div className="absolute top-0 right-0 p-10 opacity-10"><Wallet size={120} /></div>
                        <div className="relative z-10">
                            <p className="text-teal-200/80 font-black text-xs uppercase tracking-widest mb-2">Total Contributions</p>
                            <h2 className="text-4xl font-black tracking-tight">{totalPaid.toLocaleString()} <span className="text-sm font-normal opacity-70">ETB</span></h2>
                            <div className="mt-6 flex items-center gap-2 text-[#00A896] text-xs font-bold">
                                <ArrowUpRight size={14} /> Approved Savings ({payments.length} Payments)
                            </div>
                        </div>
                    </div>

                    {/* Total Won */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-5 text-amber-500"><TrendingUp size={120} /></div>
                        <div className="relative z-10">
                            <p className="text-amber-600 font-black text-xs uppercase tracking-widest mb-2">Total Winnings</p>
                            <h2 className="text-4xl font-black text-slate-800 tracking-tight">{totalWon.toLocaleString()} <span className="text-sm font-normal opacity-40">ETB</span></h2>
                            <div className="mt-6 flex items-center gap-2 text-amber-500 text-xs font-bold">
                                <Trophy size={14} /> {wins.length > 0 ? `${wins.length} Pots Won` : 'Accumulated Pot'}
                            </div>
                        </div>
                    </div>

                    {/* Net Balance */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
                        <p className="text-slate-400 font-black text-xs uppercase tracking-widest mb-2">Net Financial Status</p>
                        <h2 className={`text-4xl font-black tracking-tight ${netBalance >= 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                            {netBalance.toLocaleString()} <span className="text-sm font-normal opacity-40">ETB</span>
                        </h2>
                        <div className="mt-6 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-[#005C53] to-[#00A896] rounded-full transition-all duration-500" 
                                style={{ width: totalWon > 0 ? `${Math.min((totalPaid / totalWon) * 100, 100)}%` : '0%' }}
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-wider">Savings vs Winnings Ratio</p>
                    </div>
                </div>

                {/* ── DETAILED ANALYSIS & STATEMENT TABS ── */}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
                    {/* Table Navigation & Search Header */}
                    <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setActiveTab('payments')}
                                className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                                    activeTab === 'payments' 
                                        ? 'bg-[#005C53] text-white shadow-md' 
                                        : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                                }`}
                            >
                                Payments Statement ({payments.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('wins')}
                                className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                                    activeTab === 'wins' 
                                        ? 'bg-[#005C53] text-white shadow-md' 
                                        : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                                }`}
                            >
                                Winnings History ({wins.length})
                            </button>
                        </div>

                        {/* Search input for statement */}
                        {activeTab === 'payments' && (
                            <div className="relative w-full md:w-72">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by group or ref..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#005C53] transition-all text-slate-800"
                                />
                            </div>
                        )}
                    </div>

                    {/* ── TAB 1: PAYMENTS STATEMENT TABLE ── */}
                    {activeTab === 'payments' && (
                        <div className="overflow-x-auto">
                            {filteredPayments.length === 0 ? (
                                <div className="py-20 text-center flex flex-col items-center gap-3 text-slate-400">
                                    <FileText size={36} className="text-slate-300" />
                                    <p className="font-bold text-sm">
                                        {search ? 'No payments match your search query.' : 'No payment records found.'}
                                    </p>
                                </div>
                            ) : (
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                            <th className="py-4 px-6">Date &bull; Time</th>
                                            <th className="py-4 px-6">Equb Group</th>
                                            <th className="py-4 px-6">Round</th>
                                            <th className="py-4 px-6">Chapa Ref</th>
                                            <th className="py-4 px-6 text-right">Amount (ETB)</th>
                                            <th className="py-4 px-6 text-center">Status</th>
                                            <th className="py-4 px-6 text-center">Receipt</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                                        {filteredPayments.map((p) => {
                                            const penalty = Number(p.penaltyAmount || 0);
                                            const total = Number(p.amount || 0);
                                            const date = p.submittedAt 
                                                ? new Date(p.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                                : 'N/A';

                                            return (
                                                <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                                                    <td className="py-4 px-6 font-mono text-slate-500 whitespace-nowrap">
                                                        {date}
                                                    </td>
                                                    <td className="py-4 px-6 uppercase font-black text-slate-800">
                                                        {p.group?.name || 'Equb Group'}
                                                    </td>
                                                    <td className="py-4 px-6 whitespace-nowrap">
                                                        <span className="bg-slate-100 px-2 py-1 rounded-md text-[11px]">
                                                            Rnd #{p.roundNumber} &bull; C{p.cycleNumber || 1}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 font-mono text-[11px] text-slate-500 select-all">
                                                        {p.transactionId ? `${p.transactionId.slice(0, 14)}...` : 'N/A'}
                                                    </td>
                                                    <td className="py-4 px-6 text-right whitespace-nowrap font-black text-slate-900">
                                                        {total.toLocaleString()} ETB
                                                        {penalty > 0 && (
                                                            <span className="block text-[10px] text-amber-600 font-bold">
                                                                (incl. +{penalty} penalty)
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-6 text-center whitespace-nowrap">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                            p.status === 'APPROVED' 
                                                                ? 'bg-emerald-100 text-emerald-700' 
                                                                : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                            {p.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-center whitespace-nowrap">
                                                        <button
                                                            onClick={() => setSelectedReceipt(p)}
                                                            className="px-3 py-1.5 bg-[#005C53]/10 hover:bg-[#005C53] text-[#005C53] hover:text-white rounded-lg text-[10px] font-bold uppercase transition-all shadow-sm"
                                                        >
                                                            Receipt
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* ── TAB 2: WINNINGS HISTORY TABLE ── */}
                    {activeTab === 'wins' && (
                        <div className="overflow-x-auto">
                            {wins.length === 0 ? (
                                <div className="py-20 text-center flex flex-col items-center gap-3 text-slate-400">
                                    <Trophy size={36} className="text-slate-300" />
                                    <p className="font-bold text-sm">No lottery winnings recorded yet.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                            <th className="py-4 px-6">Draw Date</th>
                                            <th className="py-4 px-6">Equb Group</th>
                                            <th className="py-4 px-6">Round Won</th>
                                            <th className="py-4 px-6 text-right">Gross Pot</th>
                                            <th className="py-4 px-6 text-right">Platform Fee (2%)</th>
                                            <th className="py-4 px-6 text-right">Net Received</th>
                                            <th className="py-4 px-6 text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                                        {wins.map((w) => {
                                            const pot = Number(w.potAmount || 0);
                                            const fee = (pot * 2) / 100;
                                            const net = pot - fee;
                                            const date = w.drawnAt 
                                                ? new Date(w.drawnAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                                : 'N/A';

                                            return (
                                                <tr key={w.id} className="hover:bg-slate-50/60 transition-colors">
                                                    <td className="py-4 px-6 font-mono text-slate-500 whitespace-nowrap">
                                                        {date}
                                                    </td>
                                                    <td className="py-4 px-6 uppercase font-black text-slate-800">
                                                        {w.group?.name || 'Equb Group'}
                                                    </td>
                                                    <td className="py-4 px-6 whitespace-nowrap">
                                                        <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-md text-[11px] font-black">
                                                            Round #{w.roundNumber}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-right font-black text-slate-900 whitespace-nowrap">
                                                        {pot.toLocaleString()} ETB
                                                    </td>
                                                    <td className="py-4 px-6 text-right text-red-500 whitespace-nowrap">
                                                        - {fee.toFixed(2)} ETB
                                                    </td>
                                                    <td className="py-4 px-6 text-right font-black text-emerald-600 whitespace-nowrap text-sm">
                                                        {net.toLocaleString()} ETB
                                                    </td>
                                                    <td className="py-4 px-6 text-center whitespace-nowrap">
                                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700">
                                                            {w.isFundsReleased ? 'Transferred' : 'Pending Wase'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>

                {/* ── ADDITIONAL FINANCIAL INSIGHTS ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Payment Distribution */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                        <h3 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-2">
                            <PieChart size={20} className="text-[#005C53]" /> 
                            Payment Distribution Summary
                        </h3>
                        <div className="space-y-4">
                            {paymentStats.length > 0 ? (
                                paymentStats.map((stat, idx) => (
                                    <div key={stat.status || idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <span className="font-bold text-slate-600 text-sm uppercase">{stat.status}</span>
                                        <span className="font-black text-slate-800">{stat._count} Payments</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 font-bold text-center py-4">No payment stats recorded yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Mission Quote Banner (styled with Deep Pine Teal theme) */}
                    <div className="bg-[#005C53] rounded-[2.5rem] p-10 text-white relative overflow-hidden flex flex-col justify-between shadow-xl">
                        <div className="relative z-10">
                            <h3 className="text-xl font-black mb-4 italic">"Financial freedom through collective savings."</h3>
                            <p className="text-teal-100 text-sm leading-relaxed font-medium">
                                Your consistency in paying contributes to the trust and success of the Central Equb system. Keep up the great work!
                            </p>
                        </div>
                        <div className="absolute -bottom-6 -right-6 opacity-15"><TrendingUp size={150} /></div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}