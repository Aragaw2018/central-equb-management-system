import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Zap, ArrowRight, CheckCircle2, 
  TrendingUp, Mail, Phone, Globe, Lock, Menu, X,
  RefreshCcw, Calendar, RefreshCw, CreditCard
} from 'lucide-react';

// ─── ASSETS ───
import logoImg from '../assets/logo.jpg';
import landingImg from '../assets/landing.png';
import tellImg from '../assets/tell.png';
import cbeImg from '../assets/cbe.png';

// ─── COLOR MAP FOR DYNAMIC UTILITIES ───
const COLOR_THEMES = {
  orange: 'text-amber-500 bg-amber-50 border-amber-200',
  teal: 'text-[#005C53] bg-teal-50 border-teal-200',
  emerald: 'text-emerald-500 bg-emerald-50 border-emerald-200',
};

// ─── COLORFUL SPINNING WHEEL COMPONENT ───
// ─── COLORFUL SPINNING WHEEL COMPONENT (PERFECTLY CENTERED) ───
function ColorfulSimulatedWheel() {
  const members = ["Abebe", "Misgie", "Gizaw", "Belete", "Chala", "Hana", "Sara", "Dawit", "Elias", "Beti"];
  const colors = ['#005C53', '#00A896', '#028090', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#007f5f', '#f97316'];
  const sliceAngle = 360 / members.length; // 36 ዲግሪ

  return (
    <div className="relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center">
      {/* 1. ውጫዊው የሚሽከረከረው የመንኮራኩር ክበብ */}
      <div className="absolute inset-0 rounded-full border-[10px] border-slate-100 shadow-2xl overflow-hidden animate-[spin_20s_linear_infinite]">
        
        {/* የ 10ሩ ቀለሞች Conic Gradient */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{ 
            background: `conic-gradient(${colors.map((c, i) => `${c} ${i * sliceAngle}deg ${(i + 1) * sliceAngle}deg`).join(', ')})` 
          }}
        />

        {/* 2. ስሞቹ በእያንዳንዱ ቀለም ቁራጭ መሃል ላይ ልክ በ 18 ዲግሪ ማዕዘን እንዲያርፉ */}
        {members.map((name, i) => {
          const centerAngle = i * sliceAngle + (sliceAngle / 2); // የእያንዳንዱ ቁራጭ ትክክለኛ መሃል
          return (
            <div 
              key={i}
              className="absolute inset-0 flex items-start justify-center pt-5 pointer-events-none"
              style={{ transform: `rotate(${centerAngle}deg)` }}
            >
              <span className="text-[10px] md:text-[12px] font-black text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {name}
              </span>
            </div>
          );
        })}
      </div>

      {/* 3. የመሃሉ ሎጎ — የራሱ ነጭ ዳራ ኖሮት ከበስተጀርባ ያሉትን ቀለሞች ሙሉ በሙሉ ሸፍኖ ቁጭ ይላል */}
      <div className="absolute z-30 w-24 h-24 md:w-32 md:h-32 bg-white rounded-full flex items-center justify-center shadow-[0_4px_25px_rgba(0,0,0,0.25)] border-4 border-white overflow-hidden">
        <img src={logoImg} alt="Logo" className="w-full h-full object-contain p-1" />
      </div>

      {/* 4. የዕጣው ጠቋሚ ቀስት (Top Arrow) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-2.5 z-40">
        <div className="w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-t-[32px] border-[#005C53] drop-shadow-md" />
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
    }, 2500);
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
    <div className="min-h-screen bg-white font-sans text-slate-900 scroll-smooth selection:bg-[#005C53] selection:text-white overflow-x-hidden">
      
      {/* ─── 1. NAVIGATION ─── */}
      <nav className="fixed top-0 w-full z-[100] bg-[#003d36] text-white backdrop-blur-md border-b border-[#005C53]/30 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
            <div className="rounded-full p-1.5 shadow-md bg-white border border-teal-200">
              <img src={logoImg} alt="Logo" className="h-9 w-9 object-contain mix-blend-multiply" />
            </div>
            <div>
              <span className="font-black text-xl tracking-tighter uppercase block leading-none text-white">Central Equb</span>
              <span className="text-[9px] font-bold text-[#00A896] uppercase tracking-[0.25em]">Management System</span>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-8 text-[12px] font-bold uppercase tracking-widest text-teal-100/90">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} className="hover:text-[#00A896] text-white transition-colors">{link.name}</a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button 
  onClick={() => navigate('/login')} 
  className="hidden sm:block text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl border border-teal-300/60 text-white hover:bg-white/15 hover:border-white transition-all shadow-sm"
>  Login</button>
            <button onClick={() => navigate('/signup')} className="bg-[#00A896] hover:bg-[#008f80] text-white px-6 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-md transition-all active:scale-95">Get Started</button>
            <button className="lg:hidden p-2 text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden bg-[#00332d] border-b border-[#005C53] p-6 space-y-4 shadow-2xl">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} onClick={() => setIsMenuOpen(false)} className="block text-sm font-bold text-teal-100 hover:text-[#00A896] uppercase tracking-widest border-b border-teal-900 pb-2">{link.name}</a>
            ))}
          </div>
        )}
      </nav>

      {/* ─── 2. HERO SECTION ─── */}
      <section id="home" className="pt-28 pb-20 px-6 bg-gradient-to-b from-teal-50/40 via-white to-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-20">
            
            {/* LEFT SIDE: LOGO IMAGE (RESTORED TO ORIGINAL ROUNDED STYLE) */}
            <div className="lg:col-span-5 flex justify-center lg:justify-start">
              <div className="relative group">
                <div className="absolute inset-0 bg-[#00A896]/30 blur-[90px] rounded-full scale-110 animate-pulse" />
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
            <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            

              <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tighter text-slate-900">
                Central <span className="text-[#005C53]">Equb Management</span> System.
              </h1>
              
              <p className="text-base md:text-lg text-slate-600 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                Combines trusted Ethiopian communal savings with National Fayda ID verification, automated Chapa escrow payments, and legal collateral security.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-2">
                <button onClick={() => navigate('/signup')} className="bg-[#005C53] hover:bg-[#004840] text-white px-8 py-4 rounded-xl font-bold text-xs shadow-xl flex items-center justify-center gap-3 transition-all uppercase tracking-widest active:scale-95">
                  Join Now <ArrowRight size={18} />
                </button>
               <button 
  onClick={() => navigate('/login')} 
  className="bg-white hover:bg-teal-50 text-[#005C53] border-2 border-[#005C53] px-8 py-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all uppercase tracking-widest shadow-md hover:shadow-lg active:scale-95"
>
  Member Login
</button>
              </div>

              {/* Supported Payment Channels */}
              <div className="pt-4 flex items-center justify-center lg:justify-start gap-3 text-xs font-semibold text-slate-500">
                <CreditCard size={16} className="text-[#005C53]" />
                <span>Powered by Chapa • Telebirr • CBE Birr • Awash • Cards</span>
              </div>
            </div>

          </div>

          {/* HERO CARDS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="relative bg-white p-4 rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden group">
              <img src={landingImg} alt="Market" className="rounded-[2rem] w-full h-[400px] object-cover grayscale-[10%] group-hover:grayscale-0 transition-all duration-700" />
             
            </div>

            <div className="relative bg-[#003d36] p-4 rounded-[2.5rem] border border-[#005C53] shadow-xl overflow-hidden flex items-center justify-center">
              <img src={payImages[payImgIndex]} alt="Payment channels" className="rounded-[2rem] w-full h-[400px] object-contain transition-all duration-500 opacity-95" />
              <div className="absolute top-8 right-8 bg-[#00A896] text-white px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-md">
                Automated Escrow Payouts
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. SERVICES ─── */}
      <section id="services" className="py-24 bg-white px-6 border-y border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="flex flex-col items-center">
            <div className="mb-8 text-center space-y-2 font-black uppercase tracking-tighter">
              <div className="inline-flex items-center gap-2 text-[#005C53] bg-teal-50 px-4 py-1.5 rounded-full border border-teal-100 text-[10px]">
                <RefreshCw size={12} className="animate-spin text-[#00A896]" /> Automated Lottery Hub
              </div>
              <h3 className="text-3xl md:text-4xl text-slate-900 leading-tight">Synchronized <br /> Lottery Wheel</h3>
            </div>
            <ColorfulSimulatedWheel />
            <div className="mt-8 flex gap-4 w-full max-w-sm">
              <div className="flex-1 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Draw Status</p>
                <p className="text-xs font-bold text-[#005C53] uppercase">Live & Random</p>
              </div>
              <div className="flex-1 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Participation</p>
                <p className="text-xs font-bold text-emerald-600 uppercase">On-Time Members</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-2 text-center lg:text-left font-black uppercase tracking-tighter">
              <h2 className="text-[#005C53] text-xs tracking-[0.3em]">What We Offer</h2>
              <h3 className="text-3xl md:text-4xl text-slate-900 leading-tight">Technology for <br /> Every Equb Goal.</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {[
                { icon: <Zap size={22} />, title: "Daily Cycles", desc: "Fast-moving short-term savings for immediate merchant liquidity and 24-hour transfers.", theme: "orange" },
                { icon: <RefreshCcw size={22} />, title: "Weekly Savings", desc: "Traditional weekly savings cycle designed for consistent and sustainable community growth.", theme: "teal" },
                { icon: <Calendar size={22} />, title: "Monthly Payouts", desc: "High-value, investment-grade equb for major personal milestones and enterprise capital.", theme: "emerald" }
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-5 bg-slate-50 p-5 rounded-2xl border border-slate-200 hover:border-[#005C53] hover:bg-white transition-all duration-300 group shadow-sm">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${COLOR_THEMES[s.theme]}`}>{s.icon}</div>
                  <div className="flex-1">
                    <h4 className="text-base font-bold text-slate-900 uppercase tracking-tight mb-0.5">{s.title}</h4>
                    <p className="text-slate-600 text-xs font-medium leading-relaxed">{s.desc}</p>
                  </div>
                  <ArrowRight size={16} className="text-slate-300 group-hover:text-[#005C53] transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-24 px-6 bg-slate-50/60">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 font-black uppercase tracking-tight text-slate-900">
            <h3 className="text-4xl tracking-tighter leading-tight text-slate-800">Standardized <br /> Governance.</h3>
            <div className="space-y-6">
              {[
                { n: "01", t: "National Fayda eKYC", d: "Verify member identity using the National Fayda Identification Number for 100% legal trust." },
                { n: "02", t: "Automated Seat Allocation", d: "Join equb groups matched to your saving capacity with transparent rules and 3-tier penalty windows." },
                { n: "03", t: "Wase Secured Distribution", d: "Watch the draw live. Pot funds are automatically transferred after legal Wase check & land collateral audit." }
              ].map((step, i) => (
                <div key={i} className="flex gap-5 group">
                  <span className="text-4xl font-black text-teal-200 group-hover:text-[#005C53] transition-colors leading-none">{step.n}</span>
                  <div>
                    <h5 className="text-lg font-bold mb-0.5">{step.t}</h5>
                    <p className="text-slate-600 font-medium normal-case tracking-normal text-xs leading-relaxed">{step.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#003d36] rounded-[2.5rem] p-10 text-white relative shadow-2xl border border-[#005C53] overflow-hidden">
            <Lock className="text-[#00A896] mb-6" size={48} />
            <h4 className="text-2xl font-bold mb-4 tracking-tight">100% Escrow & Collateral Secured</h4>
            <p className="text-teal-100/90 font-medium normal-case leading-relaxed mb-8 text-sm border-l-4 border-[#00A896] pl-4">
              "Every Birr is legally secured in central escrow. Funds are never released without verified Wase guarantees."
            </p>
            <div className="grid grid-cols-2 gap-4 relative z-10 font-bold">
              <div className="p-4 bg-white/10 rounded-xl border border-white/10 backdrop-blur-sm">
                <CheckCircle2 className="text-[#00A896] mb-1.5" size={18}/> 
                <p className="text-[11px] tracking-wide text-white">Fayda ID Verified</p>
              </div>
              <div className="p-4 bg-white/10 rounded-xl border border-white/10 backdrop-blur-sm">
                <CheckCircle2 className="text-[#00A896] mb-1.5" size={18}/> 
                <p className="text-[11px] tracking-wide text-white">Wase Collateral Audit</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. ABOUT US SECTION ─── */}
      <section id="about" className="py-24 bg-[#002f2a] px-6 border-y border-teal-900/60">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-[#00A896] text-xs font-bold uppercase tracking-[0.3em] mb-2">Who We Are</h2>
            <h3 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase leading-tight">
              Redefining the <br /> <span className="text-[#00A896] italic">Future of Equb.</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:border-[#00A896]/60 transition-all duration-300">
              <div className="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center text-[#00A896] mb-5">
                <Zap size={24} />
              </div>
              <h4 className="text-lg font-bold text-white uppercase mb-2">Our Mission</h4>
              <p className="text-teal-100/80 font-medium text-xs leading-relaxed">
                To empower Ethiopian communities by providing a highly secure, transparent, and automated digital platform for traditional Equb.
              </p>
            </div>

            <div className="p-7 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:border-emerald-500/60 transition-all duration-300">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-5">
                <Globe size={24} />
              </div>
              <h4 className="text-lg font-bold text-white uppercase mb-2">Our Vision</h4>
              <p className="text-teal-100/80 font-medium text-xs leading-relaxed">
                To be the leading digital financial inclusion partner in East Africa, digitizing communal trust with modern fintech solutions.
              </p>
            </div>

            <div className="p-7 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:border-amber-500/60 transition-all duration-300">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 mb-5">
                <ShieldCheck size={24} />
              </div>
              <h4 className="text-lg font-bold text-white uppercase mb-2">Core Values</h4>
              <ul className="space-y-2">
                {['Unwavering Trust', 'Full Transparency', 'Absolute Security', 'Heritage Innovation'].map((val, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-teal-100 font-semibold text-xs">
                    <CheckCircle2 size={14} className="text-[#00A896]" /> {val}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. CONTACT ─── */}
      <section id="contact" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 text-center lg:text-left">
            <h2 className="text-4xl md:text-6xl font-black leading-tight text-slate-900 tracking-tight">
              Ready to <br /> <span className="text-[#005C53]">Transform Your Equb?</span>
            </h2>
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-center lg:justify-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-all">
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-[#005C53]"><Mail size={22}/></div>
                <div className="text-left"><p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Support Email</p><p className="text-base font-bold text-slate-800">aragaw@gmail.com</p></div>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-all">
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-[#005C53]"><Phone size={22}/></div>
                <div className="text-left"><p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Customer Helpline</p><p className="text-base font-bold text-slate-800">+251 918964326</p></div>
              </div>
            </div>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-4 bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-sm text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Your Full Name" className="w-full p-3.5 bg-white border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 focus:ring-2 focus:ring-[#005C53]/20 transition-all" />
              <input type="text" placeholder="Phone Number (09...)" className="w-full p-3.5 bg-white border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 focus:ring-2 focus:ring-[#005C53]/20 transition-all" />
            </div>
            <textarea rows={4} placeholder="How can we help you? Write your message..." className="w-full p-3.5 bg-white border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 focus:ring-2 focus:ring-[#005C53]/20 transition-all resize-none" />
            <button type="submit" className="w-full py-4 bg-[#005C53] hover:bg-[#004840] text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-md transition-all active:scale-95">Send Message</button>
          </form>
        </div>
      </section>

      {/* ─── 7. FOOTER ─── */}
      <footer className="py-14 px-6 border-t border-slate-200 bg-slate-50 text-center">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
          <div className="bg-white rounded-full p-2 shadow-sm border border-slate-200">
            <img src={logoImg} alt="Footer Logo" className="h-12 w-12 object-contain mix-blend-multiply" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xl font-black text-slate-900 tracking-tight">Central Equb Management System</h4>
            <p className="text-[10px] tracking-widest uppercase font-bold text-[#005C53]">Digital Escrow • Fayda eKYC • Wase Collateral Security</p>
          </div>
          <p className="text-[10px] tracking-wider text-slate-400 font-semibold">© 2026 CENTRAL EQUB SYSTEMS. DEBRE TABOR, ETHIOPIA. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>
    </div>
  );
}