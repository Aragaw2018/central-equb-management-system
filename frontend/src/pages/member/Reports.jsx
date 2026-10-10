import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import DashboardLayout from '../../components/DashboardLayout';
import { 
    Wallet, 
    TrendingUp, 
    PieChart, 
    Activity, 
    ArrowUpRight, 
    Trophy, 
    Loader2 
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

export default function MemberReports() {
    const user = getStoredUser();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        axiosInstance.get(`/reports/member/${user.id}`)
            .then(res => setStats(res.data))
            .catch(err => console.error('Failed to fetch financial reports:', err))
            .finally(() => setLoading(false));
    }, [user?.id]);

    if (loading) {
        return (
            <DashboardLayout role="MEMBER">
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                    <Loader2 className="animate-spin text-blue-600" size={32} />
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

    return (
        <DashboardLayout role="MEMBER">
            <div className="max-w-6xl mx-auto space-y-10 pb-20">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight">Financial Reports</h1>
                        <p className="text-slate-400 font-bold mt-1 uppercase text-xs">Analysis of your savings and winnings</p>
                    </div>
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-xl text-blue-600"><Activity size={20}/></div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">System Status</p>
                            <p className="text-xs font-bold text-emerald-500 flex items-center gap-1">Live Tracking Active</p>
                        </div>
                    </div>
                </div>

                {/* --- STAT CARDS --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Total Saved */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 p-10 opacity-10"><Wallet size={120} /></div>
                        <div className="relative z-10">
                            <p className="text-slate-400 font-black text-xs uppercase tracking-widest mb-2">Total Contributions</p>
                            <h2 className="text-4xl font-black">{totalPaid.toLocaleString()} <span className="text-sm font-normal opacity-50">ETB</span></h2>
                            <div className="mt-6 flex items-center gap-2 text-emerald-400 text-xs font-bold">
                                <ArrowUpRight size={14} /> Approved Savings
                            </div>
                        </div>
                    </div>

                    {/* Total Won */}
                    <div className="bg-white rounded-[2.5rem] p-8 border-2 border-amber-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-5 text-amber-500"><TrendingUp size={120} /></div>
                        <div className="relative z-10">
                            <p className="text-amber-500 font-black text-xs uppercase tracking-widest mb-2">Total Winnings</p>
                            <h2 className="text-4xl font-black text-slate-800">{totalWon.toLocaleString()} <span className="text-sm font-normal opacity-30">ETB</span></h2>
                            <div className="mt-6 flex items-center gap-2 text-blue-500 text-xs font-bold">
                                <Trophy size={14} /> Accumulated Pot
                            </div>
                        </div>
                    </div>

                    {/* Net Balance */}
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                        <p className="text-slate-400 font-black text-xs uppercase tracking-widest mb-2">Net Financial Status</p>
                        <h2 className={`text-4xl font-black ${netBalance >= 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                            {netBalance.toLocaleString()} <span className="text-sm font-normal opacity-30">ETB</span>
                        </h2>
                        <div className="mt-6 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                                style={{ width: totalWon > 0 ? `${Math.min((totalPaid / totalWon) * 100, 100)}%` : '0%' }}
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-tighter">Savings vs Winnings Ratio</p>
                    </div>
                </div>

                {/* --- DETAILED ANALYSIS --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
                        <h3 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-2"><PieChart size={20} className="text-blue-500" /> Payment Distribution</h3>
                        <div className="space-y-4">
                            {paymentStats.length > 0 ? (
                                paymentStats.map((stat, idx) => (
                                    <div key={stat.status || idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                        <span className="font-bold text-slate-600 text-sm uppercase">{stat.status}</span>
                                        <span className="font-black text-slate-800">{stat._count} Payments</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-slate-400 font-bold text-center py-4">No payment stats recorded yet.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-blue-600 rounded-[2.5rem] p-10 text-white relative overflow-hidden flex flex-col justify-between">
                        <div className="relative z-10">
                            <h3 className="text-xl font-black mb-4 italic">"Financial freedom through collective savings."</h3>
                            <p className="text-blue-100 text-sm leading-relaxed font-medium">Your consistency in paying contributes to the trust and success of the Equb system. Keep up the great work!</p>
                        </div>
                        <div className="absolute -bottom-6 -right-6 opacity-20"><TrendingUp size={150} /></div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}