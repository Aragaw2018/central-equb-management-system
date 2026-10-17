import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import axiosInstance from '../api/axiosInstance';
import {
  Plus, LayoutGrid, Loader2,
  Users, Search,
  Tv2, Trash2, Pencil, X, Save, Bell, PhoneCall,
  ShieldCheck, ShieldAlert, Trophy, CheckCircle2,
} from 'lucide-react';

// ─── Status meta ──────────────────────────────────────────────────────────────
const STATUS_META = {
  OPEN: { label: 'Open', style: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  ACTIVE: { label: 'Active', style: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  COMPLETED: { label: 'Completed', style: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
};

const CAT_BADGE = {
  DAILY: 'bg-violet-100 text-violet-700 border-violet-200',
  WEEKLY: 'bg-blue-100   text-blue-700   border-blue-200',
  MONTHLY: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const PAY_STATUS_META = {
  PAID: { label: 'PAID', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  PENDING: { label: 'PENDING', cls: 'bg-blue-100    text-blue-700    border-blue-200' },
  UNPAID: { label: 'UNPAID', cls: 'bg-amber-100   text-amber-700   border-amber-200' },
  OVERDUE: { label: 'OVERDUE', cls: 'bg-red-100     text-red-700     border-red-200' },
};

// ─────────────────────────────────────────────────────────────────────────────
// GroupModal — Create / Edit
// ─────────────────────────────────────────────────────────────────────────────
function GroupModal({ group, onClose, onRefresh, organizerId, plans }) {
  const isEdit = !!group;

  const [formData, setFormData] = useState({
    name: '', description: '', planId: '', startDate: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || '',
        description: group.description || '',
        planId: group.planId || group.plan?.id || '',
        startDate: group.startDate
          ? new Date(group.startDate).toISOString().split('T')[0]
          : '',
      });
    }
  }, [group]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (isEdit) {
        await axiosInstance.patch(`/organizer/groups/${group.id}`, formData);
      } else {
        await axiosInstance.post('/organizer/groups', { ...formData, organizerId });
      }
      onRefresh();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Operation failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-[#005C53] transition-all text-slate-800';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#005C53] rounded-xl flex items-center justify-center text-white shadow-lg">
              {isEdit ? <Pencil size={20} /> : <Plus size={20} />}
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              {isEdit ? 'Edit Group Settings' : 'Launch New Equb Group'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200/50 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto max-h-[75vh]">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Group Name *</label>
            <input
              type="text" required value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className={inputCls} placeholder="e.g. Merkato Traders"
            />
          </div>

          {!isEdit && (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Equb Plan *</label>
              <select
                required value={formData.planId}
                onChange={e => setFormData({ ...formData, planId: e.target.value })}
                className={inputCls}
              >
                <option value="">-- Choose Plan --</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.category} • {Number(p.amount).toLocaleString()} ETB
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Start Date *</label>
            <input
              type="date" required value={formData.startDate}
              onChange={e => setFormData({ ...formData, startDate: e.target.value })}
              className={inputCls}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl text-center">{error}</div>
          )}

          <button
            type="submit" disabled={submitting}
            className="w-full py-5 bg-[#005C53] hover:bg-[#004a42] text-white rounded-2xl font-black shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {isEdit ? 'SAVE CHANGES' : 'CREATE GROUP'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GroupMembersModal — View all members with payment + KYC + win status
// ─────────────────────────────────────────────────────────────────────────────
function GroupMembersModal({ groupId, groupName, initialMembers, initialRound, onClose }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [curRound, setCurRound] = useState(initialRound || 1);

  const normalizeMember = useCallback((item, round) => {
    const u = item.user || item;
    const fullName = u.fullName || [u.firstName, u.fatherName].filter(Boolean).join(' ') || item.fullName || 'Member';
    const phoneNumber = u.phoneNumber || item.phoneNumber || 'N/A';
    const faydaId = u.faydaId || item.faydaId;
    const kycStatus = u.kycStatus || item.kycStatus;
    const hasWon = item.hasWon !== undefined ? item.hasWon : (u.hasWon || false);

    let paymentStatus = item.paymentStatus;
    if (!paymentStatus) {
      const payments = item.payments || [];
      const hasPaid = payments.some(p => (Number(p.roundNumber) === Number(round)) && p.status === 'APPROVED');
      paymentStatus = hasPaid ? 'PAID' : 'UNPAID';
    }

    return {
      membershipId: item.id || item.membershipId || Math.random().toString(),
      fullName,
      phoneNumber,
      faydaId,
      kycStatus,
      hasWon,
      paymentStatus,
      currentRound: round
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (initialMembers && initialMembers.length > 0) {
      setMembers(initialMembers.map(m => normalizeMember(m, curRound)));
      setLoading(false);
    }

    const loadGroupRoster = async () => {
      try {
        let res;
        try {
          res = await axiosInstance.get(`/organizer/groups/${groupId}/members`);
        } catch {
          try {
            res = await axiosInstance.get(`/organizer/group-members/${groupId}`);
          } catch {
            try {
              res = await axiosInstance.get(`/organizer/reports/${groupId}`);
            } catch {
              res = await axiosInstance.get(`/member/group/${groupId}`);
            }
          }
        }

        if (!isMounted || !res?.data) return;

        const data = res.data;
        const rawMembers = data.members || data.memberships || (Array.isArray(data) ? data : []);
        const activeRound = data.currentRound || data.group?.currentRound || curRound;

        if (isMounted) {
          setCurRound(activeRound);
          if (rawMembers.length > 0) {
            setMembers(rawMembers.map(m => normalizeMember(m, activeRound)));
          }
        }
      } catch (err) {
        console.error('Group members fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadGroupRoster();
    return () => { isMounted = false; };
  }, [groupId, initialMembers, curRound, normalizeMember]);

  const unpaidMembers = members.filter(m => m.paymentStatus === 'UNPAID' || m.paymentStatus === 'OVERDUE');

  const handleSendReminders = async () => {
    if (unpaidMembers.length === 0) return;
    setSending(true);
    try {
      const res = await axiosInstance.post(`/organizer/groups/${groupId}/send-reminders`);
      setToastMsg(res.data.message || `Reminders sent to ${unpaidMembers.length} member${unpaidMembers.length > 1 ? 's' : ''}!`);
    } catch (err) {
      setToastMsg(err.response?.data?.error || 'Failed to send reminders. Please try again.');
    } finally {
      setSending(false);
      setTimeout(() => setToastMsg(''), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-8 py-6 border-b flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#005C53]/10 rounded-2xl flex items-center justify-center shrink-0">
              <Users size={20} className="text-[#005C53]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 leading-tight">{groupName}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Members Roster &mdash; Round {curRound}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-500 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Action bar */}
        {!loading && unpaidMembers.length > 0 && (
          <div className="px-8 py-4 bg-amber-50 border-b border-amber-100 flex items-center justify-between gap-4 shrink-0">
            <p className="text-xs font-bold text-amber-700">
              <span className="font-black">{unpaidMembers.length}</span> member{unpaidMembers.length > 1 ? 's have' : ' has'} not paid for Round {curRound}.
            </p>
            <button
              onClick={handleSendReminders}
              disabled={sending}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-xs uppercase tracking-wide transition-all active:scale-95 disabled:opacity-60 shrink-0"
            >
              {sending
                ? <><Loader2 size={13} className="animate-spin" /> Sending...</>
                : <><Bell size={13} /> Send Payment Reminder</>}
            </button>
          </div>
        )}

        {/* Toast */}
        {toastMsg && (
          <div className="mx-8 mt-4 flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-2xl animate-in fade-in duration-200 shrink-0">
            <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
            <p className="text-xs font-bold text-emerald-700">{toastMsg}</p>
          </div>
        )}

        {/* Members list */}
        <div className="overflow-y-auto flex-1 px-8 py-6 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <Loader2 size={30} className="animate-spin text-slate-300" />
              <span className="font-bold text-slate-400 text-sm">Loading members...</span>
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-300">
              <Users size={40} />
              <p className="font-bold text-sm">No members enrolled in this group yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((m, i) => {
                const ps = PAY_STATUS_META[m.paymentStatus] || PAY_STATUS_META.UNPAID;
                const kyc = m.kycStatus === 'VERIFIED';

                return (
                  <div key={m.membershipId || i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-[#005C53]/20 transition-all">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0">
                      {i + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-slate-800 text-sm truncate">{m.fullName}</p>
                        {kyc
                          ? <ShieldCheck size={13} className="text-emerald-500 shrink-0" title="KYC Verified" />
                          : <ShieldAlert size={13} className="text-amber-400 shrink-0" title="KYC Pending" />}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1 font-bold">
                          <PhoneCall size={10} className="text-[#005C53]" /> {m.phoneNumber}
                        </span>
                        {m.faydaId && (
                          <span className="text-[10px] font-mono text-slate-400">
                            FIN: {m.faydaId}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className={`text-[9px] font-black px-2.5 py-1.5 rounded-full border uppercase tracking-wide shrink-0 ${ps.cls}`}>
                      {m.paymentStatus === 'PAID'
                        ? `PAID (Rnd ${curRound})`
                        : ps.label}
                    </span>

                    <span className={`text-[9px] font-black px-2.5 py-1.5 rounded-full border uppercase tracking-wide shrink-0 ${m.hasWon
                      ? 'bg-amber-100 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                      {m.hasWon
                        ? <span className="flex items-center gap-1"><Trophy size={9} /> Won</span>
                        : 'Eligible'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer counts */}
        {!loading && members.length > 0 && (
          <div className="px-8 py-4 border-t border-slate-50 flex items-center gap-6 shrink-0 bg-slate-50/50">
            <span className="text-[10px] font-black text-slate-400 uppercase">
              Total: <span className="text-slate-700">{members.length}</span>
            </span>
            <span className="text-[10px] font-black text-emerald-600 uppercase">
              Paid: {members.filter(m => m.paymentStatus === 'PAID').length}
            </span>
            <span className="text-[10px] font-black text-amber-600 uppercase">
              Unpaid: {members.filter(m => m.paymentStatus === 'UNPAID').length}
            </span>
            <span className="text-[10px] font-black text-red-600 uppercase">
              Overdue: {members.filter(m => m.paymentStatus === 'OVERDUE').length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
function MyGroups() {
  const navigate = useNavigate();
  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();
  const organizerId = user?.id;

  const [groups, setGroups] = useState([]);
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, open: 0, totalManaged: '0.00' });
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [membersTarget, setMembersTarget] = useState(null);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    if (!organizerId) return;
    setLoading(true);
    try {
      const [grpRes, plRes] = await Promise.all([
        axiosInstance.get(`/organizer/groups/${organizerId}`),
        axiosInstance.get('/admin/plans'),
      ]);
      setGroups(grpRes.data?.groups || []);
      setStats(grpRes.data?.stats || { total: 0, active: 0, open: 0, totalManaged: '0.00' });
      setPlans(plRes.data || []);
    } catch (err) {
      console.error('MyGroups fetchData error:', err);
    } finally {
      setLoading(false);
    }
  }, [organizerId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDeleteGroup = async (group, memberCount) => {
    if (memberCount > 0) {
      alert('Security Alert: Cannot delete a group with active members.');
      return;
    }
    if (window.confirm('Permanently delete this group?')) {
      try {
        await axiosInstance.delete(`/organizer/groups/${group.id}`);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete group.');
      }
    }
  };

  const filtered = groups.filter(g =>
    g.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout role="ORGANIZER">

      {/* ── Modals ───────────────────────────────────────────────── */}
      {modalMode === 'CREATE' && (
        <GroupModal
          organizerId={organizerId}
          plans={plans}
          onClose={() => setModalMode(null)}
          onRefresh={fetchData}
        />
      )}
      {modalMode === 'EDIT' && editTarget && (
        <GroupModal
          group={editTarget}
          plans={plans}
          onClose={() => { setModalMode(null); setEditTarget(null); }}
          onRefresh={fetchData}
        />
      )}
      {membersTarget && (
        <GroupMembersModal
          groupId={membersTarget.id}
          groupName={membersTarget.name}
          initialMembers={membersTarget.memberships}
          initialRound={membersTarget.currentRound}
          onClose={() => setMembersTarget(null)}
        />
      )}

      {/* ── Page Header ───────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Pot Management</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">
            Control and manage your active Equb cycles
          </p>
        </div>
        <button
          onClick={() => setModalMode('CREATE')}
          className="bg-[#005C53] text-white px-8 py-4 rounded-2xl font-black shadow-2xl hover:bg-[#004a42] transition-all active:scale-95 flex items-center gap-3"
        >
          <Plus size={20} /> LAUNCH NEW GROUP
        </button>
      </div>

      {/* ── Groups Container ──────────────────────────────────────── */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden mb-20">
        <div className="p-8 border-b flex items-center justify-between bg-slate-50/30">
          <div className="relative w-full max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              type="text"
              placeholder="Search by group name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-[#005C53] transition-all text-slate-800"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-40 text-center flex flex-col items-center gap-4">
            <Loader2 size={40} className="animate-spin text-[#005C53]/30" />
            <p className="font-black text-slate-300 uppercase tracking-widest text-xs">Syncing Ledger...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-32 text-center flex flex-col items-center gap-4 text-slate-300">
            <LayoutGrid size={44} />
            <p className="font-bold text-sm">{search ? 'No groups match your search.' : 'No groups yet. Launch your first one!'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 p-8">
            {filtered.map(group => {
              const statusMeta = STATUS_META[group.status] || STATUS_META.OPEN;
              const memberCount = group.memberships?.length || group._count?.memberships || 0;
              const maxMembers = group.plan?.maxMembers || 0;
              const fillPct = maxMembers > 0 ? Math.min(100, Math.round((memberCount / maxMembers) * 100)) : 0;
              const roundPot = Number((group.plan?.amount || 0) * memberCount);

              return (
                <div
                  key={group.id}
                  className="w-full bg-white rounded-[2.5rem] p-8 border border-slate-200/80 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight truncate uppercase mb-3">
                        {group.name}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${statusMeta.style}`}>
                          <span className={`w-2 h-2 rounded-full ${statusMeta.dot}`} />
                          {statusMeta.label}
                        </span>
                        {group.plan?.category && (
                          <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl border uppercase tracking-wide ${CAT_BADGE[group.plan.category] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                            {group.plan.category}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => { setEditTarget(group); setModalMode('EDIT'); }}
                        className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        title="Edit Group"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group, memberCount)}
                        className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"
                        title="Delete Group"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                        Cycle Amount
                      </p>
                      <p className="text-xl font-black text-slate-900">
                        {Number(group.plan?.amount || 0).toLocaleString()}
                        <span className="text-sm font-bold text-slate-400 ml-1">ETB</span>
                      </p>
                    </div>
                    <div className="bg-[#005C53]/8 rounded-2xl p-5 border border-[#005C53]/15">
                      <p className="text-[9px] font-black text-[#005C53]/60 uppercase tracking-wider mb-1.5">
                        Target Pot / Round
                      </p>
                      <p className="text-xl font-black text-[#005C53]">
                        {roundPot.toLocaleString()}
                        <span className="text-sm font-bold text-[#005C53]/60 ml-1">ETB</span>
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-slate-600">
                        {memberCount} of {maxMembers || '∞'} Seats Filled
                      </span>
                      <span className="text-xs font-black text-[#005C53]">
                        {fillPct}%
                      </span>
                    </div>
                    <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#005C53] to-[#00A896] transition-all duration-700"
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-5 border-t border-slate-100 gap-3">
                    <p className="text-[10px] font-bold text-slate-400">
                      Started{' '}
                      {group.startDate
                        ? new Date(group.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                        : 'N/A'}
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setMembersTarget({
                          id: group.id,
                          name: group.name,
                          memberships: group.memberships,
                          currentRound: group.currentRound || 1
                        })}
                        className="flex items-center gap-2 px-5 py-3 bg-[#005C53] hover:bg-[#004a42] text-white rounded-2xl font-black text-xs uppercase tracking-wide shadow-lg shadow-[#005C53]/30 transition-all active:scale-95"
                      >
                        <Users size={15} />
                        View Members ({memberCount})
                      </button>
                      <button
                        onClick={() => navigate(`/organizer/draw/${group.id}`)}
                        className="flex items-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-violet-200 transition-all active:scale-95"
                      >
                        <Tv2 size={15} /> Live Draw
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default MyGroups;