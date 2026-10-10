import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import axiosInstance from '../api/axiosInstance';
import { 
  FileText, Users, Loader2, ArrowRight, 
  Download, ShieldCheck, TrendingUp, Search, 
  ImageOff, AlertCircle
} from 'lucide-react';

export default function OrganizerReports() {
  // Safely parse localStorage item with fallback
  const user = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id) {
      setError("User session not found.");
      setLoading(false);
      return;
    }

    axiosInstance.get(`/organizer/groups/${user.id}`)
      .then(res => setGroups(res.data?.groups || []))
      .catch(err => setError("Failed to fetch organizer groups."))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleViewReport = async (groupId) => {
    setReportLoading(true);
    try {
      const res = await axiosInstance.get(`/organizer/groups/${groupId}/report`);
      setSelectedGroup(res.data);
    } catch (err) {
      alert("Failed to load audit report. Please try again.");
    } finally {
      setReportLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    // Standard web browser print dialog for audit exports
    window.print();
  };

  const filteredGroups = groups.filter(g => 
    g?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout role="ORGANIZER">
      <div className="max-w-7xl mx-auto space-y-10 mb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight">System Audit & Reports</h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">
              Group Analytics • Member KYC • Audit Logs
            </p>
          </div>
          {selectedGroup && (
            <button 
              onClick={() => setSelectedGroup(null)} 
              className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase shadow-xl hover:bg-blue-600 transition-all self-start sm:self-auto"
            >
              Back to List
            </button>
          )}
        </div>

        {/* Global Loading Spinner */}
        {loading ? (
          <div className="py-40 flex flex-col items-center justify-center gap-4 bg-white rounded-[3rem] border border-slate-100 shadow-xl">
            <Loader2 size={40} className="animate-spin text-blue-600" />
            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Loading System Ledger...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center space-y-4 bg-white rounded-[3rem] border border-slate-100 p-8">
            <AlertCircle size={40} className="text-red-400 mx-auto" />
            <p className="font-bold text-slate-700">{error}</p>
          </div>
        ) : !selectedGroup ? (

          /* ─── GROUP LIST VIEW ─── */
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
            <div className="p-8 border-b bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="font-black text-slate-800 text-xl tracking-tight">Select Group to Audit</h3>
              <div className="relative w-full sm:w-auto">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  type="text" 
                  placeholder="Search groups..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  className="w-full sm:w-64 pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-blue-500" 
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b bg-slate-50/30">
                    <th className="px-10 py-6">Group Identity</th>
                    <th className="px-10 py-6">Capacity</th>
                    <th className="px-10 py-6">Cycle Amount</th>
                    <th className="px-10 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredGroups.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-20 text-center text-slate-400">
                        <ImageOff size={36} className="mx-auto opacity-20 mb-3" />
                        <p className="font-bold text-sm">No groups found matching criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredGroups.map(g => (
                      <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-10 py-6">
                          <p className="font-black text-slate-800 text-base">{g.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                            Launched {g.startDate ? new Date(g.startDate).toLocaleDateString('en-GB') : 'N/A'}
                          </p>
                        </td>
                        <td className="px-10 py-6">
                          <span className="flex items-center gap-2 text-slate-600 font-bold">
                            <Users size={14}/> {g._count?.memberships || 0} / {g.plan?.maxMembers || '∞'}
                          </span>
                        </td>
                        <td className="px-10 py-6 font-black text-slate-900">
                          {Number(g.plan?.amount || 0).toLocaleString()} ETB
                        </td>
                        <td className="px-10 py-6 text-right">
                          <button 
                            onClick={() => handleViewReport(g.id)} 
                            disabled={reportLoading}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-blue-100 flex items-center gap-2 ml-auto transition-all disabled:opacity-50"
                          >
                            {reportLoading ? <Loader2 size={14} className="animate-spin" /> : <>Generate Audit <ArrowRight size={14}/></>}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (

          /* ─── PROFESSIONAL REPORT VIEW ─── */
          <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
            {/* Analytics Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-8 bg-blue-600 rounded-[2.5rem] text-white shadow-xl shadow-blue-100 flex items-center gap-6">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                  <TrendingUp size={32}/>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase opacity-60 tracking-wider">Pot Capacity</p>
                  <p className="text-2xl lg:text-3xl font-black">
                    {Number((selectedGroup.plan?.amount || 0) * (selectedGroup.plan?.maxMembers || 0)).toLocaleString()} ETB
                  </p>
                </div>
              </div>

              <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                  <ShieldCheck size={32}/>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Verification Level</p>
                  <p className="text-2xl lg:text-3xl font-black text-slate-800">High Secure</p>
                </div>
              </div>

              <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
                <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Users size={32}/>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Approved Entities</p>
                  <p className="text-2xl lg:text-3xl font-black text-slate-800">
                    {selectedGroup.memberships?.length || 0} Pax
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Member Audit Table */}
            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
              <div className="px-10 py-8 border-b bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <FileText className="text-slate-900" />
                  <h3 className="font-black text-slate-800 text-xl tracking-tight uppercase">
                    Member Identity Ledger • {selectedGroup.name}
                  </h3>
                </div>
                <button 
                  onClick={handleDownloadPDF}
                  className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                >
                  <Download size={14}/> Download PDF / Print
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b bg-slate-50/30">
                      <th className="px-10 py-6">Member Entity</th>
                      <th className="px-10 py-6">Identity Control (FIN)</th>
                      <th className="px-10 py-6">KYC Status</th>
                      <th className="px-10 py-6 text-right">Audit Entry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {selectedGroup.memberships?.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-10 py-6">
                          <p className="font-black text-slate-800 text-sm uppercase">{m.user?.fullName || 'N/A'}</p>
                          <p className="text-[10px] font-bold text-slate-400 font-mono mt-0.5">{m.user?.phoneNumber || 'N/A'}</p>
                        </td>
                        <td className="px-10 py-6">
                          <span className="font-mono text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                            FIN: {m.user?.faydaId || 'NOT_LINKED'}
                          </span>
                        </td>
                        <td className="px-10 py-6">
                          <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                            m.user?.kycStatus === 'VERIFIED' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {m.user?.kycStatus || 'PENDING'}
                          </span>
                        </td>
                        <td className="px-10 py-6 text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase">
                            {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString('en-GB') : 'N/A'}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}