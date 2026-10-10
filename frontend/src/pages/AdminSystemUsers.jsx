import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import axiosInstance from '../api/axiosInstance';
import {
  Users,
  Search,
  Loader2,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  UserCheck,
  ShieldCheck,
  User as UserIcon,
  ShieldOff,
  ShieldAlert,
  Ban,
  CircleCheck,
  UserPlus,
} from 'lucide-react';

const ROLE_META = {
  ADMIN: { label: 'Admin', style: 'bg-purple-100 text-purple-700' },
  ORGANIZER: { label: 'Organizer', style: 'bg-orange-100 text-orange-700' },
  MEMBER: { label: 'Member', style: 'bg-blue-100 text-blue-700' },
};

function StatCard({ icon, label, value, accent }) {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 flex items-center gap-5">
      <div className={`w-14 h-14 ${accent} rounded-[1.2rem] flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="text-2xl font-black text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function sortUsers(users, key, dir) {
  if (!key) return users;
  return [...users].sort((a, b) => {
    let av = a[key] ?? '';
    let bv = b[key] ?? '';

    if (key === 'createdAt') {
      av = new Date(av).getTime();
      bv = new Date(bv).getTime();
    } else {
      av = av.toString().toLowerCase();
      bv = bv.toString().toLowerCase();
    }

    if (av < bv) return dir === 'asc' ? -1 : 1;
    if (av > bv) return dir === 'asc' ? 1 : -1;
    return 0;
  });
}

function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) return <ChevronsUpDown size={13} className="text-slate-300 ml-1 inline" />;
  return sortDir === 'asc' ? (
    <ChevronUp size={13} className="text-blue-500 ml-1 inline" />
  ) : (
    <ChevronDown size={13} className="text-blue-500 ml-1 inline" />
  );
}

const COLUMNS = [
  { key: 'fullName', label: 'Full Name' },
  { key: 'phoneNumber', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'isApproved', label: 'Approval' },
  { key: 'isActive', label: 'Account' },
  { key: 'createdAt', label: 'Joined' },
];

function AdminSystemUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [updatingRoleId, setUpdatingRoleId] = useState(null);
  const [toast, setToast] = useState(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [sortCol, setSortCol] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  const toastTimerRef = useRef(null);

  const showToast = useCallback((type, msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ type, msg });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await axiosInstance.get('/admin/users');
      setUsers(res.data);
    } catch {
      setFetchError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [fetchUsers]);

  // Block / Unblock User Status
  const handleToggleStatus = async (user) => {
    const action = user.isActive ? 'block' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} ${user.fullName}?`)) return;

    setTogglingId(user.id);
    try {
      const res = await axiosInstance.patch(`/admin/users/${user.id}/status`);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.data.user : u)));
      showToast('success', res.data.message || `User successfully ${user.isActive ? 'blocked' : 'activated'}.`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update user status.';
      showToast('error', msg);
    } finally {
      setTogglingId(null);
    }
  };

  // Change User Role (Promote / Demote)
  const handleRoleChange = async (user, newRole) => {
    if (user.role === newRole) return;
    if (!window.confirm(`Are you sure you want to change ${user.fullName}'s role to ${newRole}?`)) return;

    setUpdatingRoleId(user.id);
    try {
      const res = await axiosInstance.patch(`/admin/users/${user.id}/role`, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? res.data.user : u)));
      showToast('success', res.data.message || `${user.fullName} is now a ${newRole}.`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update user role.';
      showToast('error', msg);
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchSearch =
        !q ||
        (u.fullName || '').toLowerCase().includes(q) ||
        (u.phoneNumber || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q);
      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && u.isActive) ||
        (statusFilter === 'BLOCKED' && !u.isActive);
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const sortedUsers = useMemo(() => {
    return sortUsers(filteredUsers, sortCol, sortDir);
  }, [filteredUsers, sortCol, sortDir]);

  const stats = useMemo(() => {
    return {
      totalUsers: users.length,
      totalMembers: users.filter((u) => u.role === 'MEMBER').length,
      totalOrganizers: users.filter((u) => u.role === 'ORGANIZER').length,
      blockedCount: users.filter((u) => !u.isActive).length,
    };
  }, [users]);

  return (
    <DashboardLayout role="ADMIN">
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-[1.5rem] shadow-2xl font-bold text-sm transition-all duration-300 ${
            toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
          }`}
          role="alert"
        >
          {toast.type === 'success' ? <CircleCheck size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">System Users</h1>
        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-1">
          All registered accounts and role management
        </p>
      </div>

      {!loading && !fetchError && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <StatCard icon={<Users size={22} className="text-blue-600" />} label="Total Users" value={stats.totalUsers} accent="bg-blue-50" />
          <StatCard icon={<UserIcon size={22} className="text-emerald-600" />} label="Members" value={stats.totalMembers} accent="bg-emerald-50" />
          <StatCard icon={<ShieldCheck size={22} className="text-orange-600" />} label="Organizers" value={stats.totalOrganizers} accent="bg-orange-50" />
          <StatCard icon={<Ban size={22} className="text-red-500" />} label="Blocked" value={stats.blockedCount} accent="bg-red-50" />
        </div>
      )}

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name, phone, or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-[1.2rem] border-2 border-transparent focus:border-blue-500 outline-none text-sm font-bold text-slate-700 placeholder:font-medium placeholder:text-slate-400 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {['ALL', 'MEMBER', 'ORGANIZER', 'ADMIN'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoleFilter(r)}
                  className={`px-4 py-2 rounded-[1rem] text-[11px] font-black uppercase tracking-wider transition-all ${
                    roleFilter === r
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  {r === 'ALL' ? 'All Roles' : r.charAt(0) + r.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Account:</span>
            {[
              { key: 'ALL', label: 'All' },
              { key: 'ACTIVE', label: 'Active' },
              { key: 'BLOCKED', label: 'Blocked' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`px-4 py-1.5 rounded-[1rem] text-[11px] font-black uppercase tracking-wider transition-all ${
                  statusFilter === key
                    ? key === 'BLOCKED'
                      ? 'bg-red-500 text-white shadow-md shadow-red-100'
                      : 'bg-emerald-500 text-white shadow-md shadow-emerald-100'
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24 gap-3">
            <Loader2 size={36} className="animate-spin text-slate-300" />
            <span className="font-bold text-slate-400">Loading users…</span>
          </div>
        )}

        {!loading && fetchError && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <AlertCircle size={36} className="text-red-300" />
            <p className="text-red-400 font-bold">{fetchError}</p>
            <button
              type="button"
              onClick={fetchUsers}
              className="px-6 py-3 bg-blue-600 text-white rounded-[1.2rem] font-bold hover:bg-blue-700 transition-all"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !fetchError && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/70 text-slate-400 text-[10px] uppercase font-black tracking-[0.18em]">
                    {COLUMNS.map(({ key, label }) => (
                      <th
                        key={key}
                        onClick={() => handleSort(key)}
                        className="px-7 py-5 cursor-pointer select-none hover:text-blue-500 transition-colors whitespace-nowrap"
                      >
                        {label}
                        <SortIcon col={key} sortCol={sortCol} sortDir={sortDir} />
                      </th>
                    ))}
                    <th className="px-7 py-5 text-center whitespace-nowrap">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-50">
                  {sortedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={COLUMNS.length + 1} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Users size={36} className="text-slate-200" />
                          <p className="font-bold text-slate-400">No users match your filters.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedUsers.map((user) => (
                      <UserRow
                        key={user.id}
                        user={user}
                        toggling={togglingId === user.id}
                        updatingRole={updatingRoleId === user.id}
                        onToggle={() => handleToggleStatus(user)}
                        onRoleChange={(newRole) => handleRoleChange(user, newRole)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-7 py-4 border-t border-slate-50">
              <p className="text-xs text-slate-400 font-bold">
                Showing <span className="text-slate-600">{sortedUsers.length}</span> of{' '}
                <span className="text-slate-600">{users.length}</span> users
              </p>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function UserRow({ user, toggling, updatingRole, onToggle, onRoleChange }) {
  const roleMeta = ROLE_META[user.role] || { label: user.role, style: 'bg-slate-100 text-slate-600' };
  const isBlocked = !user.isActive;

  return (
    <tr
      className={`transition-colors group ${
        isBlocked ? 'bg-slate-50/80 opacity-60 hover:opacity-80' : 'hover:bg-slate-50/60'
      }`}
    >
      <td className="px-7 py-5">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-[0.9rem] flex items-center justify-center shrink-0 transition-colors ${
              isBlocked
                ? 'bg-slate-200 text-slate-400'
                : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'
            }`}
          >
            {isBlocked ? <ShieldOff size={15} /> : <UserIcon size={15} />}
          </div>
          <span className={`font-bold whitespace-nowrap ${isBlocked ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
            {user.fullName}
          </span>
        </div>
      </td>

      <td className="px-7 py-5 text-slate-500 font-medium text-sm whitespace-nowrap">
        {user.phoneNumber}
      </td>

      <td className="px-7 py-5 text-slate-400 font-medium text-sm">
        {user.email || <span className="italic text-slate-300">—</span>}
      </td>

      <td className="px-7 py-5">
        <select
          value={user.role}
          onChange={(e) => onRoleChange(e.target.value)}
          disabled={updatingRole}
          className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider outline-none cursor-pointer border-none ${roleMeta.style}`}
        >
          <option value="MEMBER">Member</option>
          <option value="ORGANIZER">Organizer</option>
          <option value="ADMIN">Admin</option>
        </select>
      </td>

      <td className="px-7 py-5">
        {user.isApproved ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600">
            <UserCheck size={11} /> Approved
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-600">
            <ShieldAlert size={11} /> Pending
          </span>
        )}
      </td>

      <td className="px-7 py-5">
        {user.isActive ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600">
            <CircleCheck size={11} /> Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-500">
            <Ban size={11} /> Blocked
          </span>
        )}
      </td>

      <td className="px-7 py-5 text-slate-400 text-sm font-medium whitespace-nowrap">
        {new Date(user.createdAt).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
      </td>

      <td className="px-7 py-5">
        <div className="flex items-center justify-center gap-2">
          {/* Quick Promote Button for Members */}
          {user.role === 'MEMBER' && (
            <button
              type="button"
              onClick={() => onRoleChange('ORGANIZER')}
              disabled={updatingRole}
              title="Promote user to Organizer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[1rem] text-[11px] font-black uppercase tracking-wider bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white transition-all disabled:opacity-50"
            >
              {updatingRole ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
              Make Organizer
            </button>
          )}

          {/* Block / Activate Button */}
          <button
            type="button"
            onClick={onToggle}
            disabled={toggling}
            title={user.isActive ? 'Block this user' : 'Activate this user'}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-[1rem] text-[11px] font-black uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${
              user.isActive
                ? 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white hover:shadow-red-100'
                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white hover:shadow-emerald-100'
            }`}
          >
            {toggling ? (
              <Loader2 size={13} className="animate-spin" />
            ) : user.isActive ? (
              <><Ban size={13} /> Block</>
            ) : (
              <><CircleCheck size={13} /> Activate</>
            )
          }
          </button>
        </div>
      </td>
    </tr>
  );
}

export default AdminSystemUsers;