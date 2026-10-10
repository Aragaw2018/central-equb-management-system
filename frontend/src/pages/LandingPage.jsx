import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Zap, ArrowRight, CheckCircle2, 
  TrendingUp, Mail, Phone, Globe, Lock, Menu, X, PlayCircle,
  RefreshCcw, Calendar, RefreshCw
} from 'lucide-react';

// ─── ASSETS ───
import logoImg from '../assets/logo.jpg';
import landingImg from '../assets/landing.png';
import tellImg from '../assets/tell.png';
import cbeImg from '../assets/cbe.png';

// ─── COLOR MAP FOR DYNAMIC UTILITIES ───
const COLOR_THEMES = {
  orange: 'text-amber-500 bg-amber-50 border-amber-200',
  blue: 'text-blue-600 bg-blue-50 border-blue-200',
  emerald: 'text-emerald-500 bg-emerald-50 border-emerald-200',
};

// ─── COLORFUL SPINNING WHEEL COMPONENT ───
function ColorfulSimulatedWheel() {
  const members = ["Abebe", "Misgie", "Gizaw", "Belete", "Chala", "Hana", "Sara", "Dawit", "Elias", "Beti"];
  const colors = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#22c55e'];

  return (
    <div className="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center">
      <div className="absolute inset-0 rounded-full border-[10px] border-slate-100 shadow-2xl overflow-hidden animate-[spin_18s_linear_infinite]">
        <div 
          className="absolute inset-0 rounded-full"
          style={{ background: `conic-gradient(${colors.map((c, i) => `${c} ${i * 36}deg ${(i + 1) * 36}deg`).join(', ')})` }}
        />
        {members.map((name, i) => (
          <div 
            key={i}
            className="absolute top-0 left-1/2 w-1/2 h-full origin-left flex items-center justify-end pr-8 text-[9px] md:text-[11px] font-black text-white uppercase tracking-tighter"
            style={{ transform: `rotate(${i * 36 + 18}deg)` }}
          >
            <span className="rotate-90 drop-shadow-md">{name}</span>
          </div>
        ))}
      </div>
      <div className="absolute z-30 w-24 h-24 md:w-32 md:h-32 bg-white rounded-full flex items-center justify-center shadow-2xl border-4 border-slate-50 overflow-hidden">
        <img src={logoImg} alt="Logo" className="w-full h-full object-contain mix-blend-multiply scale-110" />
      </div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-2 z-40">
        <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[35px] border-slate-800 drop-shadow-lg" />
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [payImgIndex, setPayImgIndex] = useState(0);
  const payImages = [tellImg, cbeImg];

  useEffect(() => {
    const interval = setInterval(() => {
      setPayImgIndex((prev) => (prev + 1) % 2);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Services', href: '#services' },
    { name: 'How it Works', href: '#how-it-works' },
    { name: 'About Us', href: '#about' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 scroll-smooth selection:bg-blue-600 selection:text-white overflow-x-hidden">
      
      {/* ─── 1. NAVIGATION ─── */}
      <nav className="fixed top-0 w-full z-[100] bg-slate-950 text-white backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-full p-1 shadow-sm border bg-white">
              <img src={logoImg} alt="Logo" className="h-10 w-10 object-contain mix-blend-multiply" />
            </div>
            <div>
              <span className="font-black text-xl tracking-tighter uppercase block leading-none">Central Equb</span>
              <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em]">Management System</span>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-8 text-[12px] font-black uppercase tracking-widest text-slate-400">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} className="hover:text-blue-400  text-white  transition-colors">{link.name}</a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/login')} className="hidden sm:block text-[11px] font-black uppercase tracking-widest px-4 hover:text-blue-400 transition-colors">Login</button>
            <button onClick={() => navigate('/signup')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95">Get Started</button>
            <button className="lg:hidden p-2 text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden bg-slate-900 border-b border-slate-800 p-6 space-y-4 shadow-2xl">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} onClick={() => setIsMenuOpen(false)} className="block text-sm font-black text-slate-300 hover:text-blue-400 uppercase tracking-widest border-b border-slate-800 pb-2">{link.name}</a>
            ))}
          </div>
        )}
      </nav>

      {/* ─── 2. HERO SECTION ─── */}
      <section id="home" className="pt-20 lg:pt-20 pb-24 px-6 bg-slate-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-24">
            
            {/* LEFT SIDE: LOGO IMAGE */}
            <div className="lg:col-span-5 flex justify-center lg:justify-start">
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-200/50 blur-[90px] rounded-full scale-110 animate-pulse" />
                <div className="relative bg-white rounded-[10rem] p-3 shadow-2xl border border-slate-100 transform group-hover:scale-105 transition-transform duration-500">
                  <img 
                    src={logoImg} 
                    alt="Main Logo" 
                    className="w-64 h-64 md:w-80 md:h-80 object-contain mix-blend-multiply" 
                  />
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: TEXT */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-8">
              
              
              <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tighter text-slate-800">
                Central <span className="text-blue-600">Equb Management</span> System.
              </h1>
              
              <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                Central Digital Equb combines traditional communal savings with high-end digital security, biometric verification, and automated payouts.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-2">
                <button onClick={() => navigate('/signup')} className="group bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-xs shadow-2xl flex items-center justify-center gap-3 hover:bg-blue-600 transition-all uppercase tracking-widest active:scale-95">
                  Join Now <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
             
              </div>
            </div>

          </div>

          {/* HERO CARDS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="relative bg-white p-4 rounded-[3.5rem] border border-slate-200 shadow-xl overflow-hidden group">
              <img src={landingImg} alt="Market" className="rounded-[2.5rem] w-full h-[450px] object-cover grayscale-[10%] group-hover:grayscale-0 transition-all duration-700" />
              <div className="absolute bottom-8 left-8 bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg"><TrendingUp size={24} /></div>
                  <div className="font-black uppercase">
                    <p className="text-[9px] text-slate-400 leading-none tracking-widest mb-1">Released Volume</p>
                    <p className="text-xl text-slate-900 tracking-tight">4.5M+ ETB</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative bg-slate-950 p-4 rounded-[3.5rem] border-4 border-slate-800 shadow-xl overflow-hidden flex items-center justify-center">
              <img src={payImages[payImgIndex]} alt="Payment channels" className="rounded-[2.5rem] w-full h-[450px] object-contain transition-all duration-500 opacity-90" />
              <div className="absolute top-8 right-8 bg-blue-600 text-white px-5 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl border border-white/10">
                Multi-Channel Payouts
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. SERVICES ─── */}
      <section id="services" className="py-28 bg-white px-6 border-y border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="flex flex-col items-center">
            <div className="mb-10 text-center space-y-2 font-black uppercase tracking-tighter">
              <div className="inline-flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100 text-[10px]">
                <RefreshCw size={12} className="animate-spin" /> Live Sync Demo
              </div>
              <h3 className="text-4xl text-slate-900 leading-tight">Synchronized <br /> Lottery Hub</h3>
            </div>
            <ColorfulSimulatedWheel />
            <div className="mt-10 flex gap-4 w-full max-w-sm">
              <div className="flex-1 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Engine Status</p>
                <p className="text-xs font-black text-blue-600 uppercase italic">Online</p>
              </div>
              <div className="flex-1 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Global Nodes</p>
                <p className="text-xs font-black text-emerald-600 uppercase">10 Active</p>
              </div>
            </div>
          </div>

          <div className="space-y-10">
            <div className="space-y-2 text-center lg:text-left font-black uppercase tracking-tighter">
              <h2 className="text-blue-600 text-xs tracking-[0.3em]">What we offer</h2>
              <h3 className="text-4xl text-slate-900 leading-tight">Technology for <br /> Every Goal.</h3>
            </div>
            <div className="grid grid-cols-1 gap-5">
              {[
                { icon: <Zap size={24} />, title: "Daily Cycles", desc: "Short-term savings for immediate business needs. 24-hour transfers.", theme: "orange" },
                { icon: <RefreshCcw size={24} />, title: "Weekly Savings", desc: "Traditional savings cycle for consistent and sustainable growth.", theme: "blue" },
                { icon: <Calendar size={24} />, title: "Monthly Payouts", desc: "Long-term investment-grade savings for major milestones.", theme: "emerald" }
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-200 hover:border-blue-500/50 hover:bg-white transition-all duration-300 group shadow-sm">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-105 ${COLOR_THEMES[s.theme]}`}>{s.icon}</div>
                  <div className="flex-1">
                    <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-1">{s.title}</h4>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">{s.desc}</p>
                  </div>
                  <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-28 px-6 bg-slate-50/50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center font-black uppercase tracking-tight text-slate-900">
          <div className="space-y-10">
            <h3 className="text-5xl tracking-tighter leading-tight text-slate-800">Standardized <br /> Governance.</h3>
            <div className="space-y-8">
              {[
                { n: "01", t: "Identity Sync", d: "Verify identity using National Fayda Identification Number for complete trust." },
                { n: "02", t: "Seat Allocation", d: "Join groups matched to your cycle preference and monthly saving capacity." },
                { n: "03", t: "Distribution", d: "Watch draws live. Pot released instantly after verified Wase confirmation." }
              ].map((step, i) => (
                <div key={i} className="flex gap-6 group">
                  <span className="text-5xl text-slate-300 group-hover:text-blue-600 transition-colors leading-none">{step.n}</span>
                  <div>
                    <h5 className="text-xl mb-1">{step.t}</h5>
                    <p className="text-slate-500 font-medium normal-case tracking-normal text-sm leading-relaxed">{step.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-950 rounded-[3.5rem] p-12 text-white relative shadow-2xl border-4 border-slate-800 overflow-hidden">
            <Lock className="text-blue-500 mb-8 shadow-blue-500/20" size={56} />
            <h4 className="text-3xl mb-6 tracking-tighter italic text-blue-100">70% Asset Protected.</h4>
            <p className="text-slate-400 font-medium normal-case leading-relaxed mb-10 text-lg opacity-90 border-l-4 border-blue-600 pl-4 tracking-normal">
              "Every Birr is legally secured. We provide the bridge between culture and security."
            </p>
            <div className="grid grid-cols-2 gap-4 relative z-10 font-black">
              <div className="p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm"><CheckCircle2 className="text-emerald-400 mb-2" size={20}/> <p className="text-[10px] tracking-widest text-slate-300">Biometric Sync</p></div>
              <div className="p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm"><CheckCircle2 className="text-emerald-400 mb-2" size={20}/> <p className="text-[10px] tracking-widest text-slate-300">Asset Audit</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. ABOUT US SECTION ─── */}
      <section id="about" className="py-28 bg-slate-950 px-6 border-y border-slate-800">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-blue-500 text-xs font-black uppercase tracking-[0.3em] mb-3">Who We Are</h2>
            <h3 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase leading-tight">
              Redefining the <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 italic">Future of Equb.</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 hover:border-blue-500/50 transition-all duration-300 group">
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mb-6 group-hover:scale-105 transition-transform">
                <Zap size={28} />
              </div>
              <h4 className="text-xl font-black text-white uppercase mb-3 text-blue-400">Our Mission</h4>
              <p className="text-slate-400 font-medium text-sm leading-relaxed">
                To empower Ethiopian communities by providing a highly secure, transparent, and automated digital platform for traditional Equb.
              </p>
            </div>

            <div className="p-8 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 hover:border-emerald-500/50 transition-all duration-300 group">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-105 transition-transform">
                <Globe size={28} />
              </div>
              <h4 className="text-xl font-black text-white uppercase mb-3 text-emerald-400">Our Vision</h4>
              <p className="text-slate-400 font-medium text-sm leading-relaxed">
                To be the leading digital financial inclusion partner in East Africa, digitizing communal trust with modern fintech solutions.
              </p>
            </div>

            <div className="p-8 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 hover:border-amber-500/50 transition-all duration-300 group">
              <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 mb-6 group-hover:scale-105 transition-transform">
                <ShieldCheck size={28} />
              </div>
              <h4 className="text-xl font-black text-white uppercase mb-3 text-amber-400">Core Values</h4>
              <ul className="space-y-2.5">
                {['Unwavering Trust', 'Full Transparency', 'Absolute Security', 'Heritage Innovation'].map((val, idx) => (
                  <li key={idx} className="flex items-center gap-2.5 text-slate-300 font-bold text-xs">
                    <CheckCircle2 size={15} className="text-amber-400" /> {val}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. CONTACT ─── */}
      <section id="contact" className="py-28 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10 text-center lg:text-left font-black uppercase tracking-tighter">
            <h2 className="text-5xl md:text-7xl leading-tight text-slate-900 italic">Ready to <br /> transform?</h2>
            <div className="space-y-6 mt-8 tracking-tight">
              <div className="flex items-center justify-center lg:justify-start gap-6 group cursor-pointer p-4 rounded-2xl hover:bg-slate-50 transition-all">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all"><Mail size={24}/></div>
                <div><p className="text-[10px] text-slate-400 tracking-widest uppercase">Support Transmission</p><p className="text-xl normal-case font-bold">aragaw@gmail.com</p></div>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-6 group cursor-pointer p-4 rounded-2xl hover:bg-slate-50 transition-all">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all"><Phone size={24}/></div>
                <div><p className="text-[10px] text-slate-400 tracking-widest uppercase">Global Hotline</p><p className="text-xl normal-case font-bold">+251 918964326</p></div>
              </div>
            </div>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-4 bg-slate-50 p-8 md:p-10 rounded-[3rem] border border-slate-200 shadow-sm font-black uppercase text-xs tracking-widest">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Identity Name" className="w-full p-4 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 transition-all" />
              <input type="text" placeholder="Phone Number" className="w-full p-4 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 transition-all" />
            </div>
            <textarea rows={4} placeholder="State your query..." className="w-full p-4 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none" />
            <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl hover:bg-blue-600 transition-all active:scale-95">Establish Connection</button>
          </form>
        </div>
      </section>

      {/* ─── 7. FOOTER ─── */}
      <footer className="py-16 px-6 border-t border-slate-200 bg-slate-50 text-center font-black uppercase tracking-widest">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-8">
          <div className="bg-white rounded-full p-2 shadow-md border border-slate-200">
            <img src={logoImg} alt="Footer Logo" className="h-16 w-16 object-contain mix-blend-multiply" />
          </div>
          <div className="space-y-2 tracking-tighter">
            <h4 className="text-3xl text-slate-800">Central Equb Management</h4>
            <p className="text-[10px] tracking-[0.4em] text-blue-600">Digital Hub • Secure Collateral • Heritage Sustenance</p>
          </div>
          <p className="text-[10px] tracking-[0.3em] text-slate-400">© 2026 CENTRAL EQUB SYSTEMS. DEBRE TABOR, ETHIOPIA.</p>
        </div>
      </footer>
    </div>
  );
}