import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import logoImg from '../assets/logo.jpg';
import {
  LayoutDashboard, Users, History, Settings,
  LogOut, Menu, X, User as UserIcon,
  ShieldAlert, PlusCircle, LayoutGrid, ScanFace, Tv2,
  ChevronRight, DollarSign, FileText, ArrowLeftRight, Building2,
} from 'lucide-react';

function DashboardLayout({ children, role, headerExtra }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  // 1. ADMIN NAVIGATION MENU
  const adminMenuItems = [
    { icon: <ShieldAlert size={22} />, label: 'Approval Requests', path: '/admin-dashboard' },
    { icon: <PlusCircle size={22} />, label: 'Manage Plans', path: '/admin/plans' },
    { icon: <Users size={22} />, label: 'System Users', path: '/admin/users' },
    { icon: <ScanFace size={22} />, label: 'KYC Verification', path: '/admin/kyc' },
    { icon: <Settings size={22} />, label: 'Global Settings', path: '/admin/settings' },
  ];

  // 2. ORGANIZER NAVIGATION MENU
  const organizerMenuItems = [
    { icon: <LayoutDashboard size={22} />, label: 'Overview', path: '/organizer-dashboard' },
    { icon: <LayoutGrid size={22} />, label: 'My Groups', path: '/organizer/groups' },
    { icon: <Tv2 size={22} />, label: 'Live Draw', path: '/organizer/groups' },
    { icon: <DollarSign size={22} />, label: 'Payouts', path: '/organizer/payouts' },
    { icon: <FileText size={22} />, label: 'Reports', path: '/organizer/reports' },
  ];

  // 3. MEMBER NAVIGATION MENU
  const memberMenuItems = [
    { icon: <LayoutDashboard size={22} />, label: 'My Savings', path: '/member-dashboard' },
    { icon: <PlusCircle size={22} />, label: 'Join New Equb', path: '/member-dashboard' },
    { icon: <History size={22} />, label: 'Payment History', path: '/payment-history' },
    { icon: <UserIcon size={22} />, label: 'My Profile', path: '/profile' },
  ];

  const menuItems = role === 'ADMIN' ? adminMenuItems : role === 'ORGANIZER' ? organizerMenuItems : memberMenuItems;

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F8FAFC] flex font-sans antialiased text-slate-900">

      {/* ─── SIDEBAR NAVIGATION (FIXED & STICKY) ─── */}
      <aside
        className={`${isSidebarOpen ? 'w-80' : 'w-24'} bg-[#005C53] border-r border-[#004a42] transition-all duration-300 ease-in-out flex flex-col h-full z-50 shrink-0 shadow-[4px_0_32px_rgba(0,0,0,0.35)]`}
      >

        {/* Brand Logo Section */}
        <div className="px-6 py-7 mb-2 shrink-0 border-b border-white/10">
          <div className="flex items-center gap-4 group cursor-pointer">
            {/* Logo ring */}
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center ring-2 ring-white/25 shadow-lg shadow-black/30 shrink-0 overflow-hidden group-hover:ring-white/40 transition-all duration-300">
              <img
                src={logoImg}
                alt="Central Equb Logo"
                className="w-10 h-10 object-contain"
              />
            </div>

            {isSidebarOpen && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-500 overflow-hidden">
                <h1 className="font-black text-sm text-white tracking-wide leading-tight uppercase whitespace-nowrap">
                  Central Equb
                </h1>
                <span className="text-white/70 text-[9px] tracking-[0.25em] font-medium whitespace-nowrap">
                  Management System
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Role badge (only when expanded) */}
        {isSidebarOpen && (
          <div className="px-5 mb-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest w-fit ${role === 'ADMIN' ? 'bg-white/15 text-white border border-white/20' :
              role === 'ORGANIZER' ? 'bg-orange-500/15 text-orange-300 border border-orange-500/25' :
                user?.role === 'ORGANIZER' ? 'bg-teal-400/20 text-teal-200 border border-teal-400/30' :
                  'bg-teal-500/15 text-teal-300 border border-teal-500/25'
              }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {user?.role === 'ORGANIZER' && role === 'MEMBER'
                ? '↔ Member View'
                : role + ' Dashboard'}
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto pb-2">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={index}
                to={item.path}
                title={!isSidebarOpen ? item.label : undefined}
                className={`flex items-center gap-3.5 transition-all duration-200 group relative ${isSidebarOpen ? 'px-4 py-3 rounded-xl' : 'justify-center p-3 rounded-xl mx-auto'
                  } ${isActive
                    ? 'bg-[#00A896] text-white font-bold shadow-sm rounded-xl'
                    : 'text-white font-medium hover:bg-white/10'
                  }`}
              >
                {/* Icon */}
                <div className={`shrink-0 transition-colors duration-200 ${isActive ? 'text-emerald-300' : 'text-white/75 group-hover:text-white'
                  }`}>
                  {item.icon}
                </div>

                {/* Label */}
                {isSidebarOpen && (
                  <span className="text-sm whitespace-nowrap tracking-tight">
                    {item.label}
                  </span>
                )}

                {/* Active dot (collapsed mode) */}
                {isActive && !isSidebarOpen && (
                  <span className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full" />
                )}

                {/* Trailing chevron (expanded + active) */}
                {isActive && isSidebarOpen && (
                  <div className="ml-auto shrink-0">
                    <ChevronRight size={14} className="text-white/50" />
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sign Out Button */}
        <div className="p-4 mt-auto shrink-0 border-t border-white/10">
          <button
            onClick={handleLogout}
            className={`w-full bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-2.5 transition-all duration-200 ${isSidebarOpen ? 'px-4' : 'px-0'
              }`}
          >
            <LogOut size={18} className="shrink-0 text-white" />
            {isSidebarOpen && (
              <span className="text-[11px] uppercase tracking-widest font-black text-white whitespace-nowrap">
                Sign Out
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA (SCROLLABLE) ─── */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* Top Header Bar */}
        <header className="h-24 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 flex items-center justify-between px-10 shrink-0 z-40">
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl text-slate-500 hover:text-blue-600 transition-all border border-slate-200 shadow-sm hover:shadow-md"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-4">
            {/* ── Role Switcher — shown only for ORGANIZER base role ── */}
            {user?.role === 'ORGANIZER' && role === 'ORGANIZER' && (
              <button
                onClick={() => navigate('/member-dashboard')}
                title="Switch to Member View to join groups and save"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-teal-600/30 text-teal-700 bg-white hover:bg-teal-50 font-medium text-sm transition-all shadow-sm animate-in fade-in duration-300"
              >
                <ArrowLeftRight size={15} className="text-teal-600 shrink-0" />
                <span className="whitespace-nowrap hidden sm:inline">Switch to Member View</span>
              </button>
            )}

            {user?.role === 'ORGANIZER' && role === 'MEMBER' && (
              <button
                onClick={() => navigate('/organizer-dashboard')}
                title="Return to your Organizer Dashboard"
                className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-[#005C53] hover:bg-[#004a42] text-white font-semibold text-sm shadow-md transition-all animate-in fade-in duration-300"
              >
                <Building2 size={15} className="shrink-0" />
                <span className="whitespace-nowrap hidden sm:inline">Return to Organizer</span>
              </button>
            )}

            {headerExtra && <div className="animate-in fade-in duration-500">{headerExtra}</div>}
            <div className="flex items-center gap-5 pl-4 border-l border-slate-200">
              <div className="text-right hidden md:block">
                <p className="text-sm font-black text-slate-800 leading-none mb-1.5">{user?.fullName || 'User Profile'}</p>
                <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm border ${role === 'ADMIN' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                  role === 'ORGANIZER' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                    user?.role === 'ORGANIZER' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                      'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>
                  {user?.role === 'ORGANIZER' && role === 'MEMBER'
                    ? 'Member View'
                    : role + ' Account'}
                </span>
              </div>
              <div className="w-14 h-14 bg-white rounded-[1.3rem] flex items-center justify-center text-slate-400 border-2 border-slate-100 shadow-sm overflow-hidden ring-4 ring-slate-50 group cursor-pointer hover:border-blue-200 transition-all">
                <UserIcon size={26} className="group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Main Content Area */}
        <div className="p-10 overflow-y-auto flex-1 h-full">
          <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000 ease-out">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
