import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import {
  UserCheck, UserX, ShieldAlert, BarChart3, Users, Loader2,
  LayoutGrid, Wallet, CheckCircle2, TrendingUp, ArrowUpRight,
  Activity, PieChart as PieIcon,
} from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// Colour palette — Deep Pine Teal theme
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  teal: '#005C53',
  blue: '#3b82f6',
  indigo: '#6366f1',
  emerald: '#10b981',
  amber: '#f59e0b',
  orange: '#f97316',
  violet: '#8b5cf6',
  slate: '#64748b',
};

const CATEGORY_COLORS = { Daily: C.violet, Weekly: C.blue, Monthly: C.emerald };

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function fmtETB(n) {
  if (n == null) return '0 ETB';
  const num = Number(n);
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M ETB';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K ETB';
  return num.toLocaleString() + ' ETB';
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 px-4 py-3 text-xs">
      <p className="font-black text-slate-700 mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-bold" style={{ color: p.color }}>
          {p.name}: {fmtETB(p.value)}
        </p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 px-4 py-3 text-xs">
      <p className="font-black" style={{ color: payload[0].payload.color }}>
        {payload[0].name}: {payload[0].value} users
      </p>
    </div>
  );
}

// Skeleton shimmer
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-100 rounded-2xl ${className}`} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI Stat Card
// ─────────────────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, subLabel, gradient, badge }) {
  return (
    <div className={`relative overflow-hidden rounded-[2rem] p-7 text-white shadow-xl ${gradient}`}>
      <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
      <div className="absolute -right-2 -bottom-8 w-20 h-20 bg-white/5 rounded-full pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="w-11 h-11 bg-white/15 rounded-[1rem] flex items-center justify-center">
            {icon}
          </div>
          {badge && (
            <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">{label}</p>
        <p className="text-3xl font-black tracking-tight">{value}</p>
        {subLabel && <p className="text-[10px] opacity-70 font-medium mt-2">{subLabel}</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section wrapper
// ─────────────────────────────────────────────────────────────────────────────
function ChartCard({ title, subtitle, icon, children, loading }) {
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-50 flex items-center gap-3">
        <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500">
          {icon}
        </div>
        <div>
          <h3 className="font-black text-slate-800 text-base">{title}</h3>
          {subtitle && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-8">
        {loading
          ? <Skeleton className="h-52 w-full" />
          : children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
function AdminDashboard() {
  const [pendingList, setPending] = useState([]);
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchPending = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/admin/pending-organizers');
      setPending(res.data);
    } catch (err) {
      console.error('Failed to fetch pending organizers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch admin stats:', err.response?.data || err.message);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/admin/analytics');
      if (res.data?.success) setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err.response?.data || err.message);
    } finally {
      setChartLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
    fetchStats();
    fetchAnalytics();
  }, [fetchPending, fetchStats, fetchAnalytics]);

  const handleApprove = async (userId) => {
    setActionLoading(userId);
    try {
      await axiosInstance.post('/admin/approve-organizer', { userId });
      setPending(prev => prev.filter(item => item.id !== userId));
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId) => {
    if (!window.confirm('Are you sure you want to reject this organizer request?')) return;
    setActionLoading(userId);
    try {
      await axiosInstance.post('/admin/reject-organizer', { userId });
      setPending(prev => prev.filter(item => item.id !== userId));
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Rejection failed');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Derived chart data — from dedicated /analytics endpoint ─────────────
  const cashFlowData = analytics?.cashFlow ?? [];
  const userCompositionData = analytics?.userComposition ?? [];
  const categoryPerformance = analytics?.categoryPerformance ?? [];

  const hasCashData = cashFlowData.some(m => m.inflow > 0);
  const hasUserData = userCompositionData.some(d => d.value > 0);
  const hasCatData = categoryPerformance.some(c => c.volume > 0);

  return (
    <DashboardLayout role="ADMIN">

      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-800">System Control Panel</h1>
        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-1">
          Super Administrator View
        </p>
      </div>

      {/* ════════════════════════════════════════════════════════════
                KPI CARDS — 4 top-level financial metrics
            ════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-[2rem]" />
          ))
        ) : (
          <>
            <KpiCard
              icon={<BarChart3 size={20} className="text-white" />}
              label="Total Volume (All-Time)"
              value={stats?.formattedVolume ?? '0 ETB'}
              subLabel="All approved contributions"
              gradient="bg-gradient-to-br from-[#005C53] to-teal-600"
              badge="Inflow"
            />
            <KpiCard
              icon={<Wallet size={20} className="text-white" />}
              label="Active Escrow"
              value={stats?.formattedEscrow ?? '0 ETB'}
              subLabel="Money held — not yet drawn"
              gradient="bg-gradient-to-br from-blue-600 to-indigo-700"
              badge="Live"
            />
            <KpiCard
              icon={<TrendingUp size={20} className="text-white" />}
              label="Platform Net Earnings"
              value={stats?.formattedPlatformRevenue ?? '0 ETB'}
              subLabel={`${stats?.feePct ?? 2}% system commission`}
              gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
              badge={`${stats?.feePct ?? 2}% fee`}
            />
            <KpiCard
              icon={<CheckCircle2 size={20} className="text-white" />}
              label="Total Disbursed"
              value={stats?.formattedDisbursed ?? '0 ETB'}
              subLabel="Net paid out to winners"
              gradient="bg-gradient-to-br from-amber-400 to-orange-500"
              badge="Paid out"
            />
          </>
        )}
      </div>

      {/* Secondary stat row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {[
          { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: <Users size={20} className="text-blue-600" />, bg: 'bg-blue-50' },
         
          { label: 'Active Groups', value: stats?.activeGroups ?? 0, icon: <LayoutGrid size={20} className="text-violet-600" />, bg: 'bg-violet-50' },
          { label: 'Active Users', value: stats?.activeUserCount ?? 0, icon: <Activity size={20} className="text-emerald-600" />, bg: 'bg-emerald-50' },
        ].map(({ label, value, icon, bg }) => (
          <div key={label} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
            <div className={`w-12 h-12 ${bg} rounded-[1rem] flex items-center justify-center shrink-0`}>
              {icon}
            </div>
            <div className="min-w-0">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest truncate">{label}</p>
              <p className="text-2xl font-black text-slate-800 tracking-tight">
                {statsLoading ? '—' : value.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════
                SECTION 1 — Financial Cash Flow Area Chart
            ════════════════════════════════════════════════════════════ */}
      <ChartCard
        title="Financial Cash Flow"
        subtitle="Monthly inflow vs disbursed vs platform revenue — last 6 months"
        icon={<TrendingUp size={18} />}
        loading={chartLoading}
      >
        {!hasCashData ? (
          <div className="h-52 flex items-center justify-center text-slate-300 font-bold text-sm">
            No payment data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={cashFlowData} margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradInflow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.teal} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={C.teal} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradDisbursed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.amber} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={C.amber} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.emerald} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.emerald} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', fontWeight: 700 }}
              />
              <Area
                type="monotone"
                dataKey="inflow"
                name="Total Inflow"
                stroke={C.teal}
                strokeWidth={2.5}
                fill="url(#gradInflow)"
                dot={{ r: 4, fill: C.teal, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
              <Area
                type="monotone"
                dataKey="disbursed"
                name="Disbursed"
                stroke={C.amber}
                strokeWidth={2.5}
                fill="url(#gradDisbursed)"
                dot={{ r: 4, fill: C.amber, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Platform Revenue"
                stroke={C.emerald}
                strokeWidth={2.5}
                fill="url(#gradRevenue)"
                dot={{ r: 4, fill: C.emerald, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* ════════════════════════════════════════════════════════════
                SECTION 2 — Two side-by-side analytics cards
            ════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 mb-10">

        {/* Chart A — User Composition Donut */}
        <ChartCard
          title="User Composition"
          subtitle="Members vs Organizers vs Admins"
          icon={<PieIcon size={18} />}
          loading={chartLoading}
        >
          {!hasUserData ? (
            <div className="h-52 flex items-center justify-center text-slate-300 font-bold text-sm">
              No user data yet
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={userCompositionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {userCompositionData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-4 -mt-2">
                {userCompositionData.map(d => {
                  const total = userCompositionData.reduce((s, x) => s + x.value, 0) || 1;
                  return (
                    <div key={d.name} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-xs font-black text-slate-700">{d.name}</span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {d.value} ({((d.value / total) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ChartCard>

        {/* Chart B — Category Performance */}
        <ChartCard
          title="Category Performance"
          subtitle="Volume collected by Equb category"
          icon={<BarChart3 size={18} />}
          loading={chartLoading}
        >
          {!hasCatData ? (
            <div className="h-52 flex items-center justify-center text-slate-300 font-bold text-sm">
              No payment data yet
            </div>
          ) : (
            <div className="space-y-5">
              {/* Mini bar chart */}
              <ResponsiveContainer width="100%" height={160}>
                <BarChart
                  data={categoryPerformance}
                  margin={{ top: 4, right: 10, left: 0, bottom: 0 }}
                  barSize={36}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    content={<CustomTooltip />}
                  />
                  <Bar dataKey="volume" name="Volume" radius={[8, 8, 0, 0]}>
                    {categoryPerformance.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={CATEGORY_COLORS[entry.category] ?? C.slate}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Progress bars with stats */}
              {categoryPerformance.map(c => (
                <div key={c.category}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[c.category] ?? C.slate }}
                      />
                      <span className="text-xs font-black text-slate-700">{c.category} Equb</span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {c.groups} group{c.groups !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className="text-xs font-black text-slate-600">
                      {fmtETB(c.volume)}
                      <span className="text-slate-400 font-bold ml-1">({c.pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${c.pct}%`,
                        backgroundColor: CATEGORY_COLORS[c.category] ?? C.slate,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>

      {/* ════════════════════════════════════════════════════════════
                Organizer Approval Table (existing — unchanged)
            ════════════════════════════════════════════════════════════ */}
  

    </DashboardLayout>
  );
}

export default AdminDashboard;
