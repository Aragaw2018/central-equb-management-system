import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import axiosInstance from '../api/axiosInstance';
import {
  Plus, LayoutGrid, Loader2, AlertCircle,
  CalendarDays, Users, Search,
  TrendingUp, CheckCircle2, Clock, Tv2, 
  Trash2, Pencil, X, Save
} from 'lucide-react';

const STATUS_META = {
  OPEN: { label: 'Open', style: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  ACTIVE: { label: 'Active', style: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  COMPLETED: { label: 'Completed', style: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
};

// ── 1. Unified Group Form Modal (Create/Edit) ──
function GroupModal({ group, onClose, onRefresh, organizerId, plans }) {
  const isEdit = !!group;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    planId: '',
    startDate: '',
    bankName: '',
    accountName: '',
    accountNumber: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Sync state when group prop changes
  useEffect(() => {
    if (group) {
      setFormData({
        name: group.name || '',
        description: group.description || '',
        planId: group.planId || group.plan?.id || '',
        startDate: group.startDate ? new Date(group.startDate).toISOString().split('T')[0] : '',
        bankName: group.bankName || '',
        accountName: group.accountName || '',
        accountNumber: group.accountNumber || ''
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
      setError(err.response?.data?.error || err.response?.data?.message || "Operation failed. Please try again."); 
    } finally { 
      setSubmitting(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              {isEdit ? <Pencil size={20}/> : <Plus size={20}/>}
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              {isEdit ? 'Edit Group Settings' : 'Launch New Equb Group'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200/50 rounded-full transition-all">
            <X size={20}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5 overflow-y-auto max-h-[75vh]">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Group Name *</label>
            <input 
              type="text" 
              required 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800" 
              placeholder="e.g. Merkato Traders" 
            />
          </div>
          
          {!isEdit && (
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Equb Plan *</label>
              <select 
                required 
                value={formData.planId} 
                onChange={e => setFormData({...formData, planId: e.target.value})} 
                className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
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
              type="date" 
              required 
              value={formData.startDate} 
              onChange={e => setFormData({...formData, startDate: e.target.value})} 
              className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none outline-none focus:ring-2 focus:ring-blue-500 text-slate-800" 
            />
          </div>

          <div className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100 space-y-4">
            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest text-center">Payment Information</p>
            <input 
              type="text" 
              placeholder="Bank Name (CBE, Telebirr...)" 
              value={formData.bankName} 
              onChange={e => setFormData({...formData, bankName: e.target.value})} 
              className="w-full p-3 bg-white rounded-xl text-sm font-bold border-none outline-none text-slate-800" 
            />
            <div className="grid grid-cols-2 gap-3">
              <input 
                type="text" 
                placeholder="Acc. Holder" 
                value={formData.accountName} 
                onChange={e => setFormData({...formData, accountName: e.target.value})} 
                className="p-3 bg-white rounded-xl text-sm font-bold border-none outline-none text-slate-800" 
              />
              <input 
                type="text" 
                placeholder="Acc. Number" 
                value={formData.accountNumber} 
                onChange={e => setFormData({...formData, accountNumber: e.target.value})} 
                className="p-3 bg-white rounded-xl text-sm font-bold border-none outline-none text-slate-800" 
              />
            </div>
          </div>

          {error && <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl text-center">{error}</div>}

          <button 
            type="submit" 
            disabled={submitting} 
            className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18}/>}
            {isEdit ? 'SAVE CHANGES' : 'CREATE GROUP'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── 2. Main Component ──
function MyGroups() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const organizerId = user?.id;

  const [groups, setGroups] = useState([]);
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, open: 0, totalManaged: '0.00' });
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState(null); 
  const [editTarget, setEditTarget] = useState(null);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    if (!organizerId) return;
    setLoading(true);
    try {
      const [grpRes, plRes] = await Promise.all([
        axiosInstance.get(`/organizer/groups/${organizerId}`),
        axiosInstance.get('/admin/plans')
      ]);
      setGroups(grpRes.data?.groups || []); 
      setStats(grpRes.data?.stats || { total: 0, active: 0, open: 0, totalManaged: '0.00' }); 
      setPlans(plRes.data || []);
    } catch (err) { 
      console.error("Fetch Data Error:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, [organizerId]);

  const handleDeleteGroup = async (group, memberCount) => {
    if (memberCount > 0) {
      alert("Security Alert: Cannot delete a group with active members.");
      return;
    }
    if (window.confirm("Permanently delete this group?")) {
      try {
        await axiosInstance.delete(`/organizer/groups/${group.id}`); 
        fetchData();
      } catch (err) {
        alert(err.response?.data?.error || "Failed to delete group.");
      }
    }
  };

  return (
    <DashboardLayout role="ORGANIZER">

      {/* Modals Logic */}
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
      
      {/* Header Section */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">Pot Management</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Control and Manage your active equb cycles</p>
        </div>
        <button 
          onClick={() => setModalMode('CREATE')} 
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black shadow-2xl hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-3"
        >
          <Plus size={20} /> LAUNCH NEW GROUP
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><TrendingUp size={24}/></div>
          <div><p className="text-[10px] font-black uppercase text-slate-400">Total Managed</p><p className="text-xl font-black text-slate-800">{Number(stats.totalManaged || 0).toLocaleString()} ETB</p></div>
        </div>
        <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><CheckCircle2 size={24}/></div>
          <div><p className="text-[10px] font-black uppercase text-slate-400">Active Cycles</p><p className="text-xl font-black text-slate-800">{stats.active}</p></div>
        </div>
        <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center"><Clock size={24}/></div>
          <div><p className="text-[10px] font-black uppercase text-slate-400">Open Seats</p><p className="text-xl font-black text-slate-800">{stats.open}</p></div>
        </div>
        <div className="bg-white p-7 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center"><Users size={24}/></div>
          <div><p className="text-[10px] font-black uppercase text-slate-400">Total Members</p><p className="text-xl font-black text-slate-800">{stats.total}</p></div>
        </div>
      </div>

      {/* Groups Grid Container */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden mb-20">
        <div className="p-8 border-b flex items-center justify-between bg-slate-50/30">
          <div className="relative w-full max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
            <input 
              type="text" 
              placeholder="Search by group name..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-blue-500 transition-all text-slate-800" 
            />
          </div>
        </div>

        {loading ? (
          <div className="py-40 text-center flex flex-col items-center gap-4">
            <Loader2 size={40} className="animate-spin text-blue-200" />
            <p className="font-black text-slate-300 uppercase tracking-widest text-xs">Syncing Ledger...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-10">
            {groups
              .filter(g => g.name?.toLowerCase().includes(search.toLowerCase()))
              .map(group => {
                const statusMeta = STATUS_META[group.status] || STATUS_META.OPEN;
                const memberCount = group._count?.memberships || 0;

                return (
                  <div key={group.id} className="bg-white border-2 border-slate-50 hover:border-blue-500 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 hover:shadow-blue-200/30 transition-all duration-500 relative group">
                    
                    {/* Action Buttons (Edit & Delete) */}
                    <div className="absolute top-6 right-6 flex gap-2">
                      <button 
                        onClick={() => { setEditTarget(group); setModalMode('EDIT'); }} 
                        className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        title="Edit Group"
                      >
                        <Pencil size={16}/>
                      </button>
                      <button 
                        onClick={() => handleDeleteGroup(group, memberCount)} 
                        className="w-9 h-9 bg-red-50 text-red-600 rounded-xl flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm"
                        title="Delete Group"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>

                    <div className="mb-6 pr-16">
                      <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2 truncate uppercase">{group.name}</h3>
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${statusMeta.style}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} /> {statusMeta.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Cycle Amount</p>
                        <p className="font-black text-slate-900 text-base">
                          {Number(group.plan?.amount || 0).toLocaleString()} ETB
                        </p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Members</p>
                        <p className="font-black text-slate-900 text-base">
                          {memberCount} / {group.plan?.maxMembers || '∞'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                        Launched {group.startDate ? new Date(group.startDate).toLocaleDateString() : 'N/A'}
                      </p>
                      <button 
                        onClick={() => navigate(`/organizer/draw/${group.id}`)}
                        className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-violet-200 transition-all flex items-center gap-2"
                      >
                        <Tv2 size={14}/> LIVE DRAW
                      </button>
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