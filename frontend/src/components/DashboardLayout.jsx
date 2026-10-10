import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import logoImg from '../assets/logo.jpg';
import {
  LayoutDashboard, Users, History, Settings,
  LogOut, Menu, X, User as UserIcon,
  ShieldAlert, PlusCircle, LayoutGrid, ScanFace, Tv2,
  ChevronRight, DollarSign, FileText
} from 'lucide-react';

function DashboardLayout({ children, role, headerExtra }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
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
        className={`${isSidebarOpen ? 'w-80' : 'w-24'} bg-white border-r border-slate-200/60 transition-all duration-300 ease-in-out flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] h-full z-50 shrink-0`}
      >

        {/* Brand Logo Section */}
        <div className="p-8 mb-4 shrink-0">
          <div className="flex items-center gap-4 group cursor-pointer">
            <div className="bg-white rounded-full p-1 shadow-md border border-slate-100 group-hover:rotate-12 transition-transform duration-500">
              <img 
                src={logoImg} 
                alt="Central Equb Logo" 
                className="w-12 h-12 object-contain mix-blend-multiply" 
              />
            </div>

            {isSidebarOpen && (
              <div className="animate-in fade-in slide-in-from-left-2 duration-500 overflow-hidden">
                <h1 className="font-black text-lg text-slate-800 tracking-tighter leading-tight uppercase whitespace-nowrap">
                  Central Equb <br />
                  <span className="text-blue-600 text-[10px] tracking-[0.3em]">Management System</span> 
                </h1>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links (Scrollable if many items) */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={index}
                to={item.path}
                className={`flex items-center gap-4 p-4 rounded-[1.4rem] transition-all duration-300 group relative ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-[0_10px_20px_-5px_rgba(37,99,235,0.3)]'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
                }`}
              >
                <div className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600 transition-colors'} shrink-0`}>
                  {item.icon}
                </div>
                
                {isSidebarOpen && (
                  <span className={`font-bold tracking-tight text-sm whitespace-nowrap ${isActive ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}>
                    {item.label}
                  </span>
                )}

                {isActive && isSidebarOpen && (
                  <div className="ml-auto animate-in fade-in zoom-in duration-300 shrink-0">
                    <ChevronRight size={16} className="text-white/60" />
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Sign Out Action */}
        <div className="p-6 mt-auto shrink-0">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-4 p-4 rounded-[1.4rem] text-red-500 hover:bg-red-50 transition-all duration-300 font-black group ${!isSidebarOpen && 'justify-center'}`}
          >
            <LogOut size={22} className="group-hover:-translate-x-1 transition-transform shrink-0" />
            {isSidebarOpen && <span className="uppercase text-[11px] tracking-widest font-black whitespace-nowrap">Sign Out</span>}
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

          <div className="flex items-center gap-8">
            {headerExtra && <div className="animate-in fade-in duration-500">{headerExtra}</div>}
            <div className="flex items-center gap-5 pl-8 border-l border-slate-200">
              <div className="text-right hidden md:block">
                <p className="text-sm font-black text-slate-800 leading-none mb-1.5">{user?.fullName || 'User Profile'}</p>
                <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm border ${
                  role === 'ADMIN' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                  role === 'ORGANIZER' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                  'bg-blue-50 text-blue-600 border-blue-100'
                }`}>
                  {role} Account
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