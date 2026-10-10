import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { UserCheck, UserX, ShieldAlert, BarChart3, Users, Loader2 } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';

function AdminDashboard() {
  const [pendingList, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // Tracks active button ID

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const res = await axiosInstance.get('/admin/pending-organizers');
      setPending(res.data);
    } catch (err) {
      console.error('Failed to fetch pending organizers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    setActionLoading(userId);
    try {
      await axiosInstance.post('/admin/approve-organizer', { userId });
      setPending((prev) => prev.filter((item) => item.id !== userId));
    } catch (err) {
      alert(err.response?.data?.message || "Approval failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId) => {
    if (!window.confirm("Are you sure you want to reject this organizer request?")) return;
    
    setActionLoading(userId);
    try {
      await axiosInstance.post('/admin/reject-organizer', { userId });
      setPending((prev) => prev.filter((item) => item.id !== userId));
    } catch (err) {
      alert(err.response?.data?.message || "Rejection failed");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <DashboardLayout role="ADMIN">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-800">System Control Panel</h1>
        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-1">
          Super Administrator View
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <AdminStatCard icon={<Users className="text-blue-600"/>} label="Total Users" value="1,240" color="bg-blue-50"/>
        <AdminStatCard icon={<ShieldAlert className="text-orange-600"/>} label="Pending Organizers" value={pendingList.length} color="bg-orange-50"/>
        <AdminStatCard icon={<BarChart3 className="text-emerald-600"/>} label="Total Volume" value="1.2M ETB" color="bg-emerald-50"/>
      </div>

      {/* Approval Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-50">
          <h3 className="text-xl font-black text-slate-800">New Organizer Requests</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em]">
                <th className="px-8 py-5">Full Name</th>
                <th className="px-8 py-5">Phone Number</th>
                <th className="px-8 py-5">Joined Date</th>
                <th className="px-8 py-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-slate-400 font-bold">
                    <Loader2 className="animate-spin inline-block mr-2" size={20} />
                    Loading organizer requests...
                  </td>
                </tr>
              ) : pendingList.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-10 text-center text-slate-300 font-bold italic">
                    No pending requests found.
                  </td>
                </tr>
              ) : (
                pendingList.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6 font-bold text-slate-700">
                      {user.fullName || `${user.firstName || ''} ${user.fatherName || ''}`.trim() || 'N/A'}
                    </td>
                    <td className="px-8 py-6 text-slate-500 font-medium">{user.phoneNumber || 'N/A'}</td>
                    <td className="px-8 py-6 text-slate-400 text-sm">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center gap-3">
                        <button 
                          disabled={actionLoading === user.id}
                          onClick={() => handleApprove(user.id)} 
                          className="bg-emerald-500 text-white px-5 py-2 rounded-xl font-black text-xs hover:bg-emerald-600 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          {actionLoading === user.id ? <Loader2 className="animate-spin" size={14}/> : <UserCheck size={14}/>}
                          Approve
                        </button>
                        <button 
                          disabled={actionLoading === user.id}
                          onClick={() => handleReject(user.id)} 
                          className="bg-red-50 text-red-500 px-5 py-2 rounded-xl font-black text-xs hover:bg-red-100 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          <UserX size={14}/> Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

function AdminStatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-slate-50 shadow-sm flex items-center gap-6">
      <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-slate-800">{value}</p>
      </div>
    </div>
  );
}

export default AdminDashboard;