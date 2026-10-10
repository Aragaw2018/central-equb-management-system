import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import {
    DollarSign, Loader2, CheckCircle2, AlertCircle, LayoutGrid, Trophy,
} from 'lucide-react';

export default function PayoutsPanel({ organizerId }) {
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(null);
    const [selectedGroup, setSelectedGroup] = useState('');
    const [toast, setToast] = useState(null);
    const [groups, setGroups] = useState([]);

    useEffect(() => {
        if (!organizerId) return;
        axiosInstance.get(`/organizer/groups/${organizerId}`)
            .then(res => setGroups(res.data.groups || []))
            .catch(() => { });
    }, [organizerId]);

    useEffect(() => {
        if (!selectedGroup) {
            setPayouts([]);
            return;
        }
        setLoading(true);
        axiosInstance.get(`/guarantor/group/${selectedGroup}/payouts?userId=${organizerId}`)
            .then(res => setPayouts(res.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [selectedGroup, organizerId]);

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const handleReleaseFunds = async (guarantorId) => {
        setProcessing(guarantorId);
        try {
            const res = await axiosInstance.patch(`/guarantor/${guarantorId}/release-funds`, { userId: organizerId });
            setPayouts(prev => prev.map(p => (
                p.guarantor?.id === guarantorId ? { ...p, isFundsReleased: true } : p
            )));
            showToast('success', res.data.message);
        } catch (err) {
            showToast('error', err.response?.data?.error || 'Failed to release funds.');
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            {toast && (
                <div className={`mx-6 mt-4 flex items-center gap-3 px-5 py-3 rounded-[1.2rem] font-bold text-sm ${toast.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-red-50 text-red-600 border border-red-100'
                    }`}>
                    {toast.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                    {toast.msg}
                </div>
            )}

            <div className="px-8 py-6 border-b border-slate-50 flex items-center gap-3">
                <div className="w-9 h-9 bg-violet-50 rounded-[0.9rem] flex items-center justify-center">
                    <DollarSign size={16} className="text-violet-500" />
                </div>
                <div>
                    <h3 className="font-black text-slate-800 text-base">Payouts</h3>
                    <p className="text-slate-400 text-xs font-medium mt-0.5">Release funds only after the guarantor accepts</p>
                </div>
            </div>

            <div className="px-8 py-4 border-b border-slate-50">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Select Group</label>
                <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 rounded-[1.2rem] border-2 border-transparent focus:border-violet-500 outline-none font-bold text-slate-700 appearance-none transition-colors"
                >
                    <option value="">— Select a group to view payouts —</option>
                    {groups.map(group => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                </select>
            </div>

            {!selectedGroup ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="w-12 h-12 bg-slate-50 rounded-[1rem] flex items-center justify-center">
                        <LayoutGrid size={22} className="text-slate-300" />
                    </div>
                    <p className="font-bold text-slate-400 text-sm">Select a group to view payouts</p>
                </div>
            ) : loading ? (
                <div className="flex items-center justify-center py-12 gap-3">
                    <Loader2 size={24} className="animate-spin text-slate-300" />
                    <span className="font-bold text-slate-400 text-sm">Loading payouts...</span>
                </div>
            ) : payouts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="w-12 h-12 bg-slate-50 rounded-[1rem] flex items-center justify-center">
                        <Trophy size={22} className="text-slate-300" />
                    </div>
                    <p className="font-bold text-slate-400 text-sm">No payouts yet for this group</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/70 text-slate-400 text-[10px] uppercase font-black tracking-[0.15em]">
                                <th className="px-6 py-4">Winner</th>
                                <th className="px-6 py-4">Round</th>
                                <th className="px-6 py-4">Guarantor</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Funds</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {payouts.map(payout => {
                                const guarantor = payout.guarantor;
                                const isProcessing = processing === guarantor?.id;
                                const canRelease = guarantor?.status === 'ACCEPTED' && !payout.isFundsReleased;
                                const amount = payout.group?.plan
                                    ? Number(payout.group.plan.amount) * (payout.group._count?.memberships || 1)
                                    : 0;

                                return (
                                    <tr key={payout.id} className="hover:bg-slate-50/60 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-800 text-sm">{payout.winner.fullName}</p>
                                            <p className="text-xs text-slate-400">{payout.winner.phoneNumber}</p>
                                        </td>
                                        <td className="px-6 py-4 font-black text-slate-700 text-sm">#{payout.roundNumber}</td>
                                        <td className="px-6 py-4">
                                            {guarantor ? (
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">{guarantor.guarantor.fullName}</p>
                                                    <p className="text-xs text-slate-400">{guarantor.guarantor.phoneNumber}</p>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 text-sm font-medium">No guarantor</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {payout.isFundsReleased ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700">
                                                    <CheckCircle2 size={11} /> Released
                                                </span>
                                            ) : guarantor ? (
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                    guarantor.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' :
                                                    guarantor.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                                                    'bg-amber-100 text-amber-700'
                                                }`}>
                                                    {guarantor.status}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-500">
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-black text-slate-800 text-sm">
                                            {amount.toLocaleString()} ETB
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {canRelease ? (
                                                    <button
                                                        onClick={() => handleReleaseFunds(guarantor.id)}
                                                        disabled={isProcessing}
                                                        className="flex items-center gap-1.5 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-[1rem] font-black text-xs shadow-md shadow-violet-100 transition-all disabled:opacity-50"
                                                    >
                                                        {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <DollarSign size={13} />}
                                                        Release Funds
                                                    </button>
                                                ) : payout.isFundsReleased ? (
                                                    <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                                                        <CheckCircle2 size={14} /> Completed
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-xs font-medium">
                                                        {guarantor?.status === 'REJECTED' ? 'Guarantor rejected' : 'Waiting for guarantor'}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
