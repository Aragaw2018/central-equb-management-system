import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import NotificationBell from '../components/NotificationBell';
import axiosInstance from '../api/axiosInstance';
import {
  Plus,
  TrendingUp,
  Clock,
  Users,
  X,
  CheckCircle2,
  UserCheck,
  CreditCard,
  ImageOff,
  ExternalLink,
  Eye,
  FileText,
  ArrowRight,
  Wallet,
  AlertTriangle,
  ShieldAlert,
  LayoutGrid,
} from 'lucide-react';

const API_BASE = 'http://localhost:5000';

const STATUS_META = {
  OPEN: { label: 'Open', style: 'bg-blue-100 text-blue-700' },
  ACTIVE: { label: 'Active', style: 'bg-emerald-100 text-emerald-700' },
  COMPLETED: { label: 'Completed', style: 'bg-slate-100 text-slate-500' },
};

const TIER_LABEL = { 1: 'Tier 1', 2: 'Tier 2', 3: 'Tier 3' };
const TIER_BADGE = {
  1: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  2: 'bg-orange-100 text-orange-700 border-orange-200',
  3: 'bg-red-100    text-red-700    border-red-200',
};

// ─────────────────────────────────────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all group">
      <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-2xl font-black text-slate-800 tracking-tight">{value}</p>
        {sub && <p className="text-[10px] font-bold text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dismissible Penalty Notification Card
// ─────────────────────────────────────────────────────────────────────────────
function PenaltyNotificationCard({ activity, onDismiss }) {
  const dismissKey = `dismissed_penalty_${activity.id}`;

  // Already dismissed on a previous session — render nothing
  if (localStorage.getItem(dismissKey) === 'true') return null;

  const tierBadge = TIER_BADGE[activity.penaltyTier] || TIER_BADGE[3];
  const tierLabel = TIER_LABEL[activity.penaltyTier] || 'Penalty';
  const timeStr = activity.reviewedAt
    ? new Date(activity.reviewedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '';

  const handleDismiss = () => {
    localStorage.setItem(dismissKey, 'true');
    onDismiss(activity.id);
  };

  return (
    <div className="relative flex items-start gap-4 px-6 py-5 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-[1.8rem] shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Icon */}
      <div className="w-11 h-11 bg-teal-100 rounded-2xl flex items-center justify-center shrink-0 mt-0.5">
        <Wallet size={20} className="text-teal-600" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-[10px] font-black text-teal-700 uppercase tracking-wider">
            New Penalty Received
          </span>
          <span className={`inline-flex items-center text-[9px] font-black px-2 py-0.5 rounded-full border ${tierBadge}`}>
            {tierLabel}
          </span>
        </div>
        <p className="text-sm font-bold text-slate-800 leading-snug">
          <span className="text-teal-600 font-black">+{Number(activity.penaltyAmount).toLocaleString()} ETB</span>
          {' '}from <span className="font-black">{activity.memberName}</span>
          {' '}— {activity.groupName} &middot; Round {activity.roundNumber}
          {' '}<span className="text-slate-400 font-medium">routed to your Telebirr</span>
        </p>
        {timeStr && (
          <p className="text-[10px] font-medium text-slate-400 mt-1">{timeStr}</p>
        )}
      </div>

      {/* Dismiss button */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss notification"
        className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:bg-teal-100 hover:text-teal-600 transition-all"
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Receipt Viewer Modal
// ─────────────────────────────────────────────────────────────────────────────
function ReceiptViewerModal({ payment, onClose }) {
  if (!payment) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
        <div className="px-10 py-6 border-b flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-xl text-blue-600"><FileText size={20} /></div>
            <h3 className="font-black text-slate-800 text-lg uppercase">Audit Payment Receipt</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400">
            <X size={24} />
          </button>
        </div>

        <div className="p-10 space-y-6 overflow-y-auto max-h-[80vh] custom-scrollbar">
          <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Member Name</p>
              <p className="font-black text-slate-800">{payment.membership?.user?.fullName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Transaction ID</p>
              <p className="font-black text-blue-600 font-mono text-base">{payment.transactionId}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Amount Paid</p>
              <p className="font-black text-emerald-600 text-lg">{Number(payment.amount || 0).toLocaleString()} ETB</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Submission Date</p>
              <p className="font-black text-slate-700">
                {payment.submittedAt ? new Date(payment.submittedAt).toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Screenshot Evidence</p>
            <div className="relative rounded-[2rem] overflow-hidden border-4 border-slate-100 bg-slate-200 shadow-inner group">
              {payment.receiptImageUrl ? (
                <>
                  <img
                    src={`${API_BASE}${payment.receiptImageUrl}`}
                    alt="Payment Receipt"
                    className="w-full h-auto object-contain max-h-[500px]"
                  />
                  <a
                    href={`${API_BASE}${payment.receiptImageUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute bottom-4 right-4 bg-white/90 p-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-black text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
                  >
                    <ExternalLink size={16} /> OPEN FULL SIZE
                  </a>
                </>
              ) : (
                <div className="py-20 flex flex-col items-center gap-4 text-slate-400">
                  <ImageOff size={48} className="opacity-20" />
                  <p className="font-bold uppercase text-xs">No Screenshot Uploaded</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-10 py-6 border-t bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-lg hover:bg-blue-600 transition-all"
          >
            Finished Review
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Join Requests Section
// ─────────────────────────────────────────────────────────────────────────────
function JoinRequests({ organizerId, onRefresh }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proc, setProc] = useState(null);

  useEffect(() => {
    axiosInstance.get('/organizer/requests/' + organizerId)
      .then(r => setRequests(r.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [organizerId]);

  const decide = async (id, status) => {
    setProc(id);
    try {
      await axiosInstance.patch('/organizer/requests/' + id + '/status', { status });
      setRequests(p => p.filter(x => x.id !== id));
      if (onRefresh) onRefresh();
    } catch {
      alert('Action failed');
    } finally {
      setProc(null);
    }
  };

  if (!loading && requests.length === 0) return null;

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden mb-10">
      <div className="px-10 py-6 border-b flex items-center gap-3 bg-blue-50/20">
        <Users size={20} className="text-blue-600" />
        <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Join Requests</h3>
        <span className="ml-auto text-[10px] font-black bg-blue-600 text-white px-3 py-1 rounded-full">
          {requests.length} NEW
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b bg-slate-50/50">
              <th className="px-10 py-5">Member Details</th>
              <th className="px-10 py-5">Target Group</th>
              <th className="px-10 py-5">KYC Status</th>
              <th className="px-10 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {requests.map(req => (
              <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-10 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-500 shadow-inner">
                      {req.user?.fullName?.[0] || 'U'}
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-sm">{req.user?.fullName}</p>
                      <p className="text-[10px] font-bold text-slate-400 font-mono">{req.user?.phoneNumber}</p>
                    </div>
                  </div>
                </td>
                <td className="px-10 py-5">
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-lg uppercase border border-blue-100">
                    {req.group?.name}
                  </span>
                </td>
                <td className="px-10 py-5">
                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${req.user?.kycStatus === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {req.user?.kycStatus || 'PENDING'}
                  </span>
                </td>
                <td className="px-10 py-5 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      disabled={proc === req.id}
                      onClick={() => decide(req.id, 'APPROVED')}
                      className="h-10 px-5 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <UserCheck size={14} /> Approve
                    </button>
                    <button
                      disabled={proc === req.id}
                      onClick={() => decide(req.id, 'REJECTED')}
                      className="h-10 px-5 bg-white border-2 border-red-100 text-red-500 rounded-xl font-black text-[10px] uppercase hover:bg-red-50 transition-all disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Payment Approvals Table
// ─────────────────────────────────────────────────────────────────────────────
function PaymentApprovals({ organizerId, onRefresh }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proc, setProc] = useState(null);
  const [viewerTarget, setViewerTarget] = useState(null);

  useEffect(() => {
    axiosInstance.get('/payments/organizer/' + organizerId + '/pending')
      .then(r => setPayments(r.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [organizerId]);

  const handleReview = async (id, status) => {
    setProc(id);
    try {
      await axiosInstance.patch('/payments/' + id + '/review', { status });
      setPayments(p => p.filter(x => x.id !== id));
      if (onRefresh) onRefresh();
    } catch {
      alert('Review failed');
    } finally {
      setProc(null);
    }
  };

  if (!loading && payments.length === 0) return null;

  return (
    <>
      {viewerTarget && (
        <ReceiptViewerModal payment={viewerTarget} onClose={() => setViewerTarget(null)} />
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden mb-10">
        <div className="px-10 py-6 border-b flex items-center gap-3 bg-emerald-50/20">
          <CreditCard size={20} className="text-emerald-600" />
          <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Payment Approvals</h3>
          <span className="ml-auto text-[10px] font-black bg-emerald-600 text-white px-3 py-1 rounded-full">
            {payments.length} AWAITING
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                <th className="px-10 py-5">Member Entity</th>
                <th className="px-10 py-5">Financial Info</th>
                <th className="px-10 py-5">Equb Group</th>
                <th className="px-10 py-5 text-right">Audit Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {payments.map(pay => (
                <tr key={pay.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-10 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-lg flex items-center justify-center font-black text-xs">
                        {pay.membership?.user?.fullName?.[0] || 'M'}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm">{pay.membership?.user?.fullName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{pay.membership?.user?.phoneNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-5">
                    <p className="font-black text-slate-900 text-sm">{Number(pay.amount || 0).toLocaleString()} ETB</p>
                    <p className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter">ID: {pay.transactionId}</p>
                  </td>
                  <td className="px-10 py-5">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg uppercase">
                      {pay.group?.name}
                    </span>
                  </td>
                  <td className="px-10 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setViewerTarget(pay)}
                        className="h-10 px-4 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 font-black text-[10px] uppercase shadow-sm"
                      >
                        <Eye size={14} /> View Receipt
                      </button>
                      <button
                        onClick={() => handleReview(pay.id, 'APPROVED')}
                        disabled={proc === pay.id}
                        className="h-10 px-5 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReview(pay.id, 'REJECTED')}
                        disabled={proc === pay.id}
                        className="h-10 px-5 bg-white border-2 border-red-100 text-red-500 rounded-xl font-black text-[10px] uppercase hover:bg-red-50 transition-all disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Organizer Dashboard
// ─────────────────────────────────────────────────────────────────────────────
function OrganizerDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const organizerId = user?.id;

  const [groups, setGroups] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, open: 0, totalManaged: '0.00' });
  const [loading, setLoading] = useState(true);

  // Analytics: penalty earnings + recent penalty activities
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Dismissed notification IDs (stored in localStorage per payment id)
  const [dismissedIds, setDismissedIds] = useState(() => {
    // Pre-populate from localStorage so dismissed cards never flash on mount
    return new Set();
  });

  // ── Fetch group overview ─────────────────────────────────────────────────
  const fetchData = useCallback(() => {
    if (!organizerId) return;
    axiosInstance.get('/organizer/groups/' + organizerId)
      .then(r => { setGroups(r.data.groups || []); setStats(r.data.stats || {}); })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [organizerId]);

  // ── Fetch analytics (penalty earnings) ──────────────────────────────────
  const fetchAnalytics = useCallback(() => {
    if (!organizerId) return;
    axiosInstance.get('/reports/organizer/' + organizerId)
      .then(r => setAnalytics(r.data))
      .catch(err => console.error('Analytics fetch failed:', err))
      .finally(() => setAnalyticsLoading(false));
  }, [organizerId]);

  useEffect(() => {
    fetchData();
    fetchAnalytics();
  }, [fetchData, fetchAnalytics]);

  // ── Dismiss a penalty notification card ─────────────────────────────────
  const handleDismiss = (paymentId) => {
    setDismissedIds(prev => new Set([...prev, paymentId]));
    // localStorage is already written by PenaltyNotificationCard itself
  };

  // Visible (non-dismissed) penalty activities
  const visibleActivities = (analytics?.recentPenaltyActivities ?? []).filter(
    a => !dismissedIds.has(a.id) && localStorage.getItem(`dismissed_penalty_${a.id}`) !== 'true'
  );

  const penaltyEarnings = Number(analytics?.totalPenaltyEarnings ?? 0);
  const hasPenaltyCards = visibleActivities.length > 0;

  return (
    <DashboardLayout role="ORGANIZER" headerExtra={<NotificationBell userId={organizerId} />}>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight uppercase">Overview</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">
            Authorized Access: {user?.fullName}
          </p>
        </div>
        <button
          onClick={() => navigate('/organizer/groups')}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-blue-600 shadow-2xl transition-all active:scale-95"
        >
          <Plus size={20} /> LAUNCH NEW GROUP
        </button>
      </div>

      {/* ── Dismissible Penalty Notification Cards ──────────────────────── */}
      {hasPenaltyCards && (
        <div className="space-y-3 mb-8">
          {visibleActivities.map(activity => (
            <PenaltyNotificationCard
              key={activity.id}
              activity={activity}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      )}

      {/* ── Stats Grid — 4 accurate cards ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard
          icon={<LayoutGrid size={24} className="text-[#005C53]" />}
          label="Active Groups"
          value={loading ? '...' : ((stats.active || 0) + (stats.open || 0))}
          color="bg-[#005C53]/10"
          sub="Open + active cycles"
        />
        <StatCard
          icon={<Users size={24} className="text-purple-600" />}
          label="Enrolled Members"
          value={loading ? '...' : stats.total || 0}
          color="bg-purple-50"
          sub="Approved memberships"
        />
        <StatCard
          icon={<Wallet size={24} className="text-teal-600" />}
          label="Penalty Revenue"
          value={analyticsLoading ? '...' : `${penaltyEarnings.toLocaleString()} ETB`}
          color="bg-teal-50"
          sub="Late fees routed to your Telebirr"
        />
        <StatCard
          icon={<CheckCircle2 size={24} className="text-emerald-600" />}
          label="Completed Payouts"
          value={analyticsLoading ? '...' : (analytics?.recentPenaltyActivities?.length > 0 ? analytics.recentPenaltyActivities.length : '—')}
          color="bg-emerald-50"
          sub="Released rounds"
        />
      </div>

      {/* ── Join Requests ────────────────────────────────────────────────── */}
      <JoinRequests organizerId={organizerId} onRefresh={fetchData} />

      {/* ── Payment Approvals ────────────────────────────────────────────── */}
      <PaymentApprovals organizerId={organizerId} onRefresh={fetchData} />

      {/* ── Active Ledger ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden mb-20">
        <div className="px-10 py-8 border-b flex justify-between items-center bg-slate-50/30">
          <div>
            <h3 className="font-black text-slate-800 text-xl tracking-tight">Active Ledger</h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
              Managed equb groups overview
            </p>
          </div>
          <button
            onClick={() => navigate('/organizer/groups')}
            className="bg-white px-6 py-2.5 rounded-xl border border-slate-200 text-blue-600 text-[10px] font-black hover:bg-blue-50 transition-all flex items-center gap-2"
          >
            EXPLORE ALL <ArrowRight size={14} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b bg-slate-50/50">
                <th className="px-10 py-6">Group Identity</th>
                <th className="px-10 py-6">Category</th>
                <th className="px-10 py-6">Amount</th>
                <th className="px-10 py-6">Status</th>
                <th className="px-10 py-6">Penalty Activity</th>
                <th className="px-10 py-6 text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {groups.slice(0, 5).map(g => {
                // Find if this group has any recent penalty activity
                const groupPenalties = (analytics?.recentPenaltyActivities ?? [])
                  .filter(a => a.groupId === g.id);
                const latestPenalty = groupPenalties[0] ?? null;

                return (
                  <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-10 py-6 font-black text-slate-700">{g.name}</td>
                    <td className="px-10 py-6 font-black text-slate-400 text-xs uppercase">
                      {g.plan?.category || g.plan?.interval || 'CUSTOM'}
                    </td>
                    <td className="px-10 py-6 font-black text-slate-900">
                      {Number(g.plan?.amount || 0).toLocaleString()} ETB
                    </td>
                    <td className="px-10 py-6">
                      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${STATUS_META[g.status]?.style || STATUS_META.OPEN.style}`}>
                        {STATUS_META[g.status]?.label || 'OPEN'}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      {latestPenalty ? (
                        <span className={`inline-flex items-center gap-1.5 text-[9px] font-black px-3 py-1.5 rounded-full border ${TIER_BADGE[latestPenalty.penaltyTier] || TIER_BADGE[3]}`}>
                          <AlertTriangle size={10} />
                          +{Number(latestPenalty.penaltyAmount).toLocaleString()} ETB Penalty
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-10 py-6 text-right">
                      <button
                        onClick={() => navigate('/organizer/groups')}
                        className="text-[10px] font-black text-[#005C53] hover:underline flex items-center gap-1 ml-auto"
                      >
                        Manage <ArrowRight size={11} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </DashboardLayout>
  );
}

export default OrganizerDashboard;
