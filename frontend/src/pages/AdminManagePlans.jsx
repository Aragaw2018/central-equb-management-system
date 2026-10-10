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
} from 'lucide-react';

const CATEGORY_META = {
  DAILY: { label: 'Daily', color: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
  WEEKLY: { label: 'Weekly', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  MONTHLY: { label: 'Monthly', color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
};

const EMPTY_FORM = {
  category: 'DAILY',
  amount: '',
  penalty: '',
  maxMembers: '',
  description: '',
};

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

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Lock scroll and support Escape for Delete Modal
  useEffect(() => {
    if (!deleteTarget) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !deleting) setDeleteTarget(null);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
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

    const payload = {
      category: form.category,
      amount: Number(form.amount),
      penalty: Number(form.penalty),
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
      const msg = err.response?.data?.error || 'Failed to delete plan.';
      showToast('error', msg);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <DashboardLayout role="ADMIN">
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-[1.5rem] shadow-2xl font-bold text-sm transition-all duration-300 ${
            toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
          }`}
          role="alert"
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleting) setDeleteTarget(null);
          }}
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

      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Equb Plans</h1>
        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-1">
          Define templates for new Equb groups
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-10 items-start">
        <div ref={formRef} className="xl:col-span-2 bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
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
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                    Editing mode
                  </p>
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
            <div>
              <label htmlFor="category" className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full px-4 py-4 bg-slate-50 rounded-[1.5rem] border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-700 transition-colors"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="amount" className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                  Amount (ETB)
                </label>
                <input
                  id="amount"
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="e.g. 500"
                  min="1"
                  required
                  className="w-full px-4 py-4 bg-slate-50 rounded-[1.5rem] border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-700 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="penalty" className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                  Penalty (ETB)
                </label>
                <input
                  id="penalty"
                  type="number"
                  name="penalty"
                  value={form.penalty}
                  onChange={handleChange}
                  placeholder="e.g. 50"
                  min="0"
                  required
                  className="w-full px-4 py-4 bg-slate-50 rounded-[1.5rem] border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-700 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="maxMembers" className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                Max Members
              </label>
              <input
                id="maxMembers"
                type="number"
                name="maxMembers"
                value={form.maxMembers}
                onChange={handleChange}
                placeholder="e.g. 20"
                min="1"
                required
                className="w-full px-4 py-4 bg-slate-50 rounded-[1.5rem] border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-700 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                Description <span className="normal-case font-medium text-slate-400">(optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Brief description of this plan..."
                className="w-full px-4 py-4 bg-slate-50 rounded-[1.5rem] border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-700 resize-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full flex items-center justify-center gap-3 text-white py-4 rounded-[1.5rem] font-black shadow-lg transition-all disabled:opacity-60 ${
                editingId
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

function PlanCard({ plan, isEditing, onEdit, onDelete }) {
  const meta = CATEGORY_META[plan.category] || CATEGORY_META.MONTHLY;

  return (
    <div
      className={`bg-white rounded-[2rem] border-2 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group ${
        isEditing ? 'border-amber-300 shadow-amber-100' : 'border-slate-100'
      }`}
    >
      <div className={`h-1.5 w-full ${meta.dot}`} />

      <div className="p-7">
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
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                isEditing
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

        <p className="text-3xl font-black text-slate-800 tracking-tight mb-1">
          {Number(plan.amount).toLocaleString()}
          <span className="text-base font-bold text-slate-400 ml-1">ETB</span>
        </p>

        <p className="text-xs text-slate-300 font-bold mb-4">
          Created {new Date(plan.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>

        <div className="flex items-center gap-5 pt-4 border-t border-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-red-50 rounded-xl flex items-center justify-center">
              <AlertCircle size={13} className="text-red-400" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Penalty</p>
              <p className="text-sm font-black text-slate-700">{Number(plan.penalty).toLocaleString()} ETB</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users size={13} className="text-blue-400" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Max Members</p>
              <p className="text-sm font-black text-slate-700">{plan.maxMembers}</p>
            </div>
          </div>
        </div>

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