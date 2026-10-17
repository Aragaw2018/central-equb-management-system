import React, { useState, useEffect, useRef, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import axiosInstance from '../api/axiosInstance';
import {
  PlusCircle,
  Pencil,
  Trash2,
  Layers,
  Users,
  AlertCircle,
  FileText,
  CheckCircle2,
  Loader2,
  X,
  Save,
  ShieldAlert,
} from 'lucide-react';

const CATEGORY_META = {
  DAILY: { label: 'Daily', color: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
  WEEKLY: { label: 'Weekly', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  MONTHLY: { label: 'Monthly', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
};

const EMPTY_FORM = {
  category: 'DAILY',
  amount: '',
  penalty: '',       // legacy — kept for backward-compat display
  tier1Penalty: '',
  tier2Penalty: '',
  tier3Penalty: '',
  maxMembers: '',
  description: '',
};

// ─── Tier badge styling ───────────────────────────────────────────────────────
const TIER_META = [
  { key: 'tier1Penalty', label: 'Tier 1',  badge: 'bg-yellow-50  text-yellow-700  border-yellow-200', dot: 'bg-yellow-400' },
  { key: 'tier2Penalty', label: 'Tier 2', badge: 'bg-orange-50  text-orange-700  border-orange-200', dot: 'bg-orange-400' },
  { key: 'tier3Penalty', label: 'Tier 3',  badge: 'bg-red-50     text-red-700     border-red-200', dot: 'bg-red-500' },
];

function AdminManagePlans() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const formRef = useRef(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((type, msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ type, msg });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/admin/plans');
      setPlans(res.data);
    } catch {
      showToast('error', 'Failed to load plans.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  // Escape key + scroll-lock for delete modal
  useEffect(() => {
    if (!deleteTarget) return;
    const onKey = (e) => { if (e.key === 'Escape' && !deleting) setDeleteTarget(null); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', onKey);
    };
  }, [deleteTarget, deleting]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditClick = (plan) => {
    setEditingId(plan.id);
    setForm({
      category: plan.category,
      amount: String(plan.amount),
      penalty: String(plan.penalty),
      tier1Penalty: String(plan.tier1Penalty ?? ''),
      tier2Penalty: String(plan.tier2Penalty ?? ''),
      tier3Penalty: String(plan.tier3Penalty ?? ''),
      maxMembers: String(plan.maxMembers),
      description: plan.description || '',
    });
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Client-side tier ordering validation
    const t1 = Number(form.tier1Penalty) || 0;
    const t2 = Number(form.tier2Penalty) || 0;
    const t3 = Number(form.tier3Penalty) || 0;
    if (!(t1 <= t2 && t2 <= t3)) {
      showToast('error', 'Penalty tiers must be in ascending order: Tier 1 ≤ Tier 2 ≤ Tier 3.');
      setSubmitting(false);
      return;
    }

    const payload = {
      category: form.category,
      amount: Number(form.amount),
      penalty: t3,                  // legacy field synced to tier3
      tier1Penalty: t1,
      tier2Penalty: t2,
      tier3Penalty: t3,
      maxMembers: Number(form.maxMembers),
      description: form.description.trim(),
    };

    try {
      if (editingId) {
        const res = await axiosInstance.put(`/admin/plans/${editingId}`, payload);
        setPlans((prev) =>
          prev.map((p) => (p.id === editingId ? res.data.plan || res.data : p))
        );
        showToast('success', 'Plan updated successfully!');
        setEditingId(null);
      } else {
        const res = await axiosInstance.post('/admin/create-plan', payload);
        const newPlan = res.data.plan || res.data;
        setPlans((prev) => [newPlan, ...prev]);
        showToast('success', 'Plan created successfully!');
      }
      setForm(EMPTY_FORM);
    } catch (err) {
      const msg = err.response?.data?.error || `Failed to ${editingId ? 'update' : 'create'} plan.`;
      showToast('error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/admin/plans/${deleteTarget.id}`);
      setPlans((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      if (editingId === deleteTarget.id) {
        setEditingId(null);
        setForm(EMPTY_FORM);
      }
      showToast('success', 'Plan deleted.');
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to delete plan.');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // ── Shared input class ──────────────────────────────────────────────────────
  const inputCls =
    'w-full px-4 py-3.5 bg-slate-50 rounded-[1.2rem] border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-700 transition-colors text-sm';
  const labelCls =
    'block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5';

  return (
    <DashboardLayout role="ADMIN">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-[1.5rem] shadow-2xl font-bold text-sm transition-all duration-300 ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
            }`}
          role="alert"
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget && !deleting) setDeleteTarget(null); }}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-sm w-full p-8 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-red-50 rounded-[1.2rem] flex items-center justify-center mb-5">
              <Trash2 size={26} className="text-red-500" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">Delete this plan?</h3>
            <p className="text-slate-500 font-medium text-sm mb-1">
              You are about to delete the{' '}
              <span className="font-black text-slate-700">
                {Number(deleteTarget.amount).toLocaleString()} ETB{' '}
                {CATEGORY_META[deleteTarget.category]?.label} plan.
              </span>
            </p>
            <p className="text-slate-400 font-medium text-xs mb-8">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-3 rounded-[1.2rem] border-2 border-slate-100 text-slate-500 font-black hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 py-3 rounded-[1.2rem] bg-red-500 hover:bg-red-600 text-white font-black shadow-lg shadow-red-100 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Equb Plans</h1>
        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-1">
          Define templates for new Equb groups
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-10 items-start">

        {/* ── Form Panel ───────────────────────────────────────────────────── */}
        <div
          ref={formRef}
          className="xl:col-span-2 bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden"
        >
          {/* Form header */}
          <div className={`px-8 pt-8 pb-6 border-b border-slate-50 flex items-center justify-between gap-3 ${editingId ? 'bg-amber-50/60' : ''}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-[1rem] flex items-center justify-center ${editingId ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                {editingId ? <Pencil size={18} /> : <PlusCircle size={20} />}
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-800">
                  {editingId ? 'Edit Plan' : 'New Plan'}
                </h2>
                {editingId && (
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Editing mode</p>
                )}
              </div>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
                title="Cancel edit"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">

            {/* Category */}
            <div>
              <label htmlFor="category" className={labelCls}>Category</label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                className={inputCls}
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>

            {/* Amount + Max Members */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="amount" className={labelCls}>Amount (ETB)</label>
                <input
                  id="amount" type="number" name="amount"
                  value={form.amount} onChange={handleChange}
                  placeholder="e.g. 500" min="1" required
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="maxMembers" className={labelCls}>Max Members</label>
                <input
                  id="maxMembers" type="number" name="maxMembers"
                  value={form.maxMembers} onChange={handleChange}
                  placeholder="e.g. 20" min="1" required
                  className={inputCls}
                />
              </div>
            </div>

            {/* ── 3-Tier Penalty Section ──────────────────────────────────── */}
            <div className="bg-slate-50 rounded-[1.5rem] p-5 space-y-4 border border-slate-100">
              <div className="flex items-center gap-2 mb-1">
                <ShieldAlert size={15} className="text-orange-400" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Penalty Tiers (ETB)
                </span>
              </div>

              {TIER_META.map((t) => (
                <div key={t.key}>
                  <label htmlFor={t.key} className="flex items-center gap-2 mb-1.5">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${t.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
                      {t.label}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">{t.amharic}</span>
                  </label>
                  <input
                    id={t.key}
                    type="number"
                    name={t.key}
                    value={form[t.key]}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    step="0.01"
                    className={inputCls}
                  />
                </div>
              ))}

              <p className="text-[10px] text-slate-400 font-medium pt-1">
                Tiers must be in ascending order: Tier 1 ≤ Tier 2 ≤ Tier 3
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className={labelCls}>
                Description <span className="normal-case font-medium text-slate-400">(optional)</span>
              </label>
              <textarea
                id="description" name="description"
                value={form.description} onChange={handleChange}
                rows={3} placeholder="Brief description of this plan..."
                className={`${inputCls} resize-none`}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full flex items-center justify-center gap-3 text-white py-4 rounded-[1.5rem] font-black shadow-lg transition-all disabled:opacity-60 ${editingId
                  ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-100'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
                }`}
            >
              {submitting ? (
                <><Loader2 size={18} className="animate-spin" /> {editingId ? 'Saving…' : 'Creating…'}</>
              ) : editingId ? (
                <><Save size={18} /> Save Changes</>
              ) : (
                <><PlusCircle size={18} /> Create Plan</>
              )}
            </button>
          </form>
        </div>

        {/* ── Plan Cards ───────────────────────────────────────────────────── */}
        <div className="xl:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-slate-800">
              All Plans
              <span className="ml-3 text-sm font-bold text-slate-400">({plans.length})</span>
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-slate-300">
              <Loader2 size={40} className="animate-spin" />
            </div>
          ) : plans.length === 0 ? (
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-300">
                <Layers size={32} />
              </div>
              <p className="text-slate-400 font-bold">No plans yet. Create your first one!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isEditing={editingId === plan.id}
                  onEdit={() => handleEditClick(plan)}
                  onDelete={() => setDeleteTarget(plan)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PlanCard
// ─────────────────────────────────────────────────────────────────────────────
function PlanCard({ plan, isEditing, onEdit, onDelete }) {
  const meta = CATEGORY_META[plan.category] || CATEGORY_META.MONTHLY;

  const t1 = Number(plan.tier1Penalty ?? 0);
  const t2 = Number(plan.tier2Penalty ?? 0);
  const t3 = Number(plan.tier3Penalty ?? 0);
  const hasTiers = t1 > 0 || t2 > 0 || t3 > 0;

  return (
    <div
      className={`bg-white rounded-[2rem] border-2 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group ${isEditing ? 'border-amber-300 shadow-amber-100' : 'border-slate-100'
        }`}
    >
      {/* Category colour bar */}
      <div className={`h-1.5 w-full ${meta.dot}`} />

      <div className="p-7">
        {/* Top row: badge + action buttons */}
        <div className="flex items-start justify-between mb-5">
          <span className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${meta.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onEdit}
              title="Edit plan"
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isEditing
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-500'
                }`}
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              title="Delete plan"
              className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Amount */}
        <p className="text-3xl font-black text-slate-800 tracking-tight mb-1">
          {Number(plan.amount).toLocaleString()}
          <span className="text-base font-bold text-slate-400 ml-1">ETB</span>
        </p>
        <p className="text-xs text-slate-300 font-bold mb-4">
          Created {new Date(plan.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>

        {/* Max Members row */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 bg-blue-50 rounded-xl flex items-center justify-center">
            <Users size={13} className="text-blue-400" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Max Members</p>
            <p className="text-sm font-black text-slate-700">{plan.maxMembers}</p>
          </div>
        </div>

        {/* ── Penalty Tiers ───────────────────────────────────────────────── */}
        {hasTiers ? (
          <div className="pt-4 border-t border-slate-50 space-y-2">
            <div className="flex items-center gap-1.5 mb-2">
              <ShieldAlert size={12} className="text-orange-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Penalty Tiers</span>
            </div>
            {TIER_META.map((tm) => {
              const val = Number(plan[tm.key] ?? 0);
              return (
                <div key={tm.key} className={`flex items-center justify-between px-3 py-2 rounded-xl border ${tm.badge}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${tm.dot}`} />
                    <span className="text-[10px] font-black uppercase tracking-wider">{tm.label}</span>
                    <span className="text-[10px] font-medium opacity-70">{tm.amharic}</span>
                  </div>
                  <span className="text-xs font-black">
                    {val > 0 ? `${val.toLocaleString()} ETB` : <span className="opacity-40 font-bold">—</span>}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          /* Legacy flat penalty fallback */
          <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
            <div className="w-7 h-7 bg-red-50 rounded-xl flex items-center justify-center">
              <AlertCircle size={13} className="text-red-400" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Penalty</p>
              <p className="text-sm font-black text-slate-700">{Number(plan.penalty).toLocaleString()} ETB</p>
            </div>
          </div>
        )}

        {/* Description */}
        {plan.description && (
          <div className="flex items-start gap-2 mt-4 pt-4 border-t border-slate-50">
            <FileText size={13} className="text-slate-300 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-400 font-medium leading-relaxed line-clamp-2">
              {plan.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminManagePlans;
