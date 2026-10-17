import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import axiosInstance from '../api/axiosInstance';
import {
  MessageSquare, Percent, ShieldAlert, CheckCircle2, AlertCircle,
  Loader2, Save, RefreshCw, Radio, FlaskConical, WifiOff, Wifi,
  CreditCard, Fingerprint, UserCheck, ShieldCheck,
} from 'lucide-react';

// ── Reusable sub-components ───────────────────────────────────────────────────

function SettingCard({ icon, title, subtitle, accentColor = 'bg-blue-50 text-blue-600', children }) {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-8 pt-8 pb-6 border-b border-slate-50 flex items-center gap-4">
        <div className={`w-12 h-12 ${accentColor} rounded-[1.1rem] flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-black text-slate-800">{title}</h3>
          <p className="text-xs font-bold text-slate-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="p-8">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, disabled, onColor = 'bg-[#005C53]' }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#005C53] disabled:opacity-50 disabled:cursor-not-allowed ${checked ? onColor : 'bg-slate-200'
        }`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${checked ? 'translate-x-8' : 'translate-x-1'
        }`} />
    </button>
  );
}

/**
 * Two-option pill selector (replaces toggle for multi-value settings).
 * options: [{ value, label, icon, description }]
 */
function PillSelector({ value, onChange, options, disabled }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {options.map(opt => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => !disabled && onChange(opt.value)}
            className={`p-5 rounded-[1.5rem] border-2 text-left transition-all ${isActive
                ? `${opt.activeClass} shadow-sm`
                : 'border-slate-100 bg-slate-50 hover:border-slate-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={disabled}
          >
            <div className={`w-9 h-9 rounded-[0.8rem] flex items-center justify-center mb-3 ${isActive ? opt.iconActiveClass : 'bg-slate-200 text-slate-400'
              }`}>
              {opt.icon}
            </div>
            <p className={`font-black text-sm ${isActive ? opt.labelClass : 'text-slate-500'}`}>
              {opt.label}
            </p>
            <p className={`text-xs font-medium mt-0.5 ${isActive ? opt.subClass : 'text-slate-400'}`}>
              {opt.description}
            </p>
            {isActive && (
              <div className={`mt-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider ${opt.labelClass}`}>
                <CheckCircle2 size={11} /> Active
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  sms_mode: 'simulation',
  service_fee_pct: '2',
  maintenance_mode: 'false',
  chapa_mode: 'sandbox',
  kyc_mode: 'automated',
};

export default function AdminGlobalSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [toast, setToast] = useState(null);
  const [dirty, setDirty] = useState(false);
  const toastTimer = useRef(null);

  useEffect(() => {
    fetchSettings();
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await axiosInstance.get('/admin/settings');
      setSettings({ ...DEFAULT_SETTINGS, ...res.data });
      setDirty(false);
    } catch {
      setFetchError('Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type, msg) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ type, msg });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  const handleChange = (key, value) => {
    if (key === 'service_fee_pct') {
      const n = parseFloat(value);
      if (!isNaN(n) && (n < 0 || n > 100)) return;
    }
    setSettings(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axiosInstance.patch('/admin/settings', settings);
      setSettings({ ...DEFAULT_SETTINGS, ...res.data.settings });
      setDirty(false);
      showToast('success', 'Settings updated and enforced across the platform!');
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  // ── Derived booleans ──────────────────────────────────────────────────────
  const isMaintenanceOn = settings.maintenance_mode === 'true';
  const isLiveSMS = settings.sms_mode === 'live';
  const isChapaLive = settings.chapa_mode === 'live';
  const isKycManual = settings.kyc_mode === 'manual';

  // ── Option configs for PillSelector ──────────────────────────────────────
  const smsOptions = [
    {
      value: 'simulation',
      label: 'Simulation',
      description: 'Logs to console only',
      icon: <FlaskConical size={18} />,
      activeClass: 'border-blue-500 bg-blue-50',
      iconActiveClass: 'bg-blue-100 text-blue-600',
      labelClass: 'text-blue-700',
      subClass: 'text-blue-500',
    },
    {
      value: 'live',
      label: 'Live (AfroMessage)',
      description: 'Sends real SMS via API',
      icon: <Radio size={18} />,
      activeClass: 'border-emerald-500 bg-emerald-50',
      iconActiveClass: 'bg-emerald-100 text-emerald-600',
      labelClass: 'text-emerald-700',
      subClass: 'text-emerald-600',
    },
  ];

  const chapaOptions = [
    {
      value: 'sandbox',
      label: 'Sandbox (Test Mode)',
      description: 'No real money moves',
      icon: <FlaskConical size={18} />,
      activeClass: 'border-violet-500 bg-violet-50',
      iconActiveClass: 'bg-violet-100 text-violet-600',
      labelClass: 'text-violet-700',
      subClass: 'text-violet-500',
    },
    {
      value: 'live',
      label: 'Live Production',
      description: 'Real transactions',
      icon: <CreditCard size={18} />,
      activeClass: 'border-emerald-500 bg-emerald-50',
      iconActiveClass: 'bg-emerald-100 text-emerald-600',
      labelClass: 'text-emerald-700',
      subClass: 'text-emerald-600',
    },
  ];

  const kycOptions = [
    {
      value: 'automated',
      label: 'Automated',
      description: 'Members self-verify via OTP modal',
      icon: <UserCheck size={18} />,
      activeClass: 'border-[#005C53] bg-[#005C53]/8',
      iconActiveClass: 'bg-[#005C53]/15 text-[#005C53]',
      labelClass: 'text-[#005C53]',
      subClass: 'text-[#005C53]/70',
    },
    {
      value: 'manual',
      label: 'Strict Manual Review',
      description: 'Admin approves each submission',
      icon: <ShieldCheck size={18} />,
      activeClass: 'border-orange-500 bg-orange-50',
      iconActiveClass: 'bg-orange-100 text-orange-600',
      labelClass: 'text-orange-700',
      subClass: 'text-orange-500',
    },
  ];

  return (
    <DashboardLayout role="ADMIN">

      {/* ── Toast ──────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-[1.5rem] shadow-2xl font-bold text-sm transition-all duration-300 ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
          }`}>
          {toast.type === 'success'
            ? <CheckCircle2 size={18} />
            : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="mb-10 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Global Settings</h1>
          <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-1">
            System-wide configuration — changes take effect immediately
          </p>
        </div>

        {!loading && !fetchError && (
          <div className="flex items-center gap-3">
            <button
              onClick={fetchSettings}
              disabled={saving}
              title="Reload from server"
              className="p-3 bg-white border border-slate-100 text-slate-400 rounded-[1.1rem] hover:text-[#005C53] hover:border-[#005C53]/30 transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw size={18} className={saving ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={handleSave}
              disabled={!dirty || saving}
              className={`flex items-center gap-2 px-6 py-3 rounded-[1.1rem] font-black text-sm shadow-lg transition-all ${dirty && !saving
                  ? 'bg-[#005C53] text-white hover:bg-[#004a42] shadow-[#005C53]/20'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                }`}
            >
              {saving
                ? <><Loader2 size={16} className="animate-spin" /> Saving…</>
                : <><Save size={16} /> Save Changes</>}
            </button>
          </div>
        )}
      </div>

      {/* ── Loading ────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center py-32 gap-3">
          <Loader2 size={36} className="animate-spin text-slate-300" />
          <span className="font-bold text-slate-400">Loading settings…</span>
        </div>
      )}

      {/* ── Error ──────────────────────────────────────────────────── */}
      {!loading && fetchError && (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <AlertCircle size={36} className="text-red-300" />
          <p className="text-red-400 font-bold">{fetchError}</p>
          <button onClick={fetchSettings} className="px-6 py-3 bg-[#005C53] text-white rounded-[1.2rem] font-bold hover:bg-[#004a42] transition-all">
            Retry
          </button>
        </div>
      )}

      {/* ── Settings Grid ───────────────────────────────────────────── */}
      {!loading && !fetchError && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── 1. SMS Configuration ─────────────────────────── */}
          <SettingCard
            icon={<MessageSquare size={22} />}
            title="SMS Configuration"
            subtitle="How OTP and notification SMS messages are delivered"
            accentColor="bg-blue-50 text-blue-600"
          >
            <div className="space-y-5">
              <PillSelector
                value={settings.sms_mode}
                onChange={v => handleChange('sms_mode', v)}
                options={smsOptions}
                disabled={saving}
              />
              <div className={`flex items-center gap-3 p-4 rounded-[1.2rem] ${isLiveSMS ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50 border border-slate-100'
                }`}>
                <span className={`w-2 h-2 rounded-full shrink-0 animate-pulse ${isLiveSMS ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                <p className={`text-xs font-bold ${isLiveSMS ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {isLiveSMS
                    ? 'Live mode — real SMS charges apply via AfroMessage'
                    : 'Simulation mode — SMS logs printed to server console only'}
                </p>
              </div>
              {isLiveSMS && (
                <div className="flex items-start gap-3 p-4 rounded-[1.2rem] bg-amber-50 border border-amber-100">
                  <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-amber-700 leading-relaxed">
                    Live mode charges your AfroMessage account per SMS. Ensure{' '}
                    <code className="bg-amber-100 px-1 rounded">AFROMESSAGE_TOKEN</code> in{' '}
                    <code className="bg-amber-100 px-1 rounded">.env</code> is valid.
                  </p>
                </div>
              )}
            </div>
          </SettingCard>

          {/* ── 2. Platform Service Fee ───────────────────────── */}
          <SettingCard
            icon={<Percent size={22} />}
            title="Platform Service Fee"
            subtitle="Applied to every Equb payout — enforced on all new transactions immediately"
            accentColor="bg-violet-50 text-violet-600"
          >
            <div className="space-y-6">
              <div>
                <label htmlFor="fee-input" className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                  Fee Percentage
                </label>
                <div className="relative">
                  <input
                    id="fee-input"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settings.service_fee_pct}
                    onChange={e => handleChange('service_fee_pct', e.target.value)}
                    disabled={saving}
                    className="w-full px-5 py-4 pr-12 bg-slate-50 rounded-[1.5rem] border-2 border-transparent focus:border-violet-500 outline-none font-black text-2xl text-slate-800 transition-colors disabled:opacity-50"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl pointer-events-none">%</span>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-2 ml-1">
                  Range 0–100%. Current:{' '}
                  <span className="font-black text-violet-600">{settings.service_fee_pct ?? 2}%</span>
                </p>
              </div>

              {/* Live fee preview */}
              <div className="bg-violet-50 rounded-[1.5rem] p-5 border border-violet-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-violet-400 mb-3">Live Fee Preview</p>
                <div className="space-y-2">
                  {[500, 1000, 5000].map(amt => {
                    const fee = (((parseFloat(settings.service_fee_pct) || 0) / 100) * amt).toFixed(2);
                    return (
                      <div key={amt} className="flex justify-between items-center text-sm">
                        <span className="font-bold text-slate-500">{amt.toLocaleString()} ETB pot</span>
                        <span className="font-black text-violet-700">→ {parseFloat(fee).toLocaleString()} ETB fee</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </SettingCard>

          {/* ── 3. System Maintenance Mode ───────────────────── */}
          <SettingCard
            icon={isMaintenanceOn ? <WifiOff size={22} /> : <Wifi size={22} />}
            title="System Status"
            subtitle="Temporarily block all non-admin access with a single toggle"
            accentColor={isMaintenanceOn ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}
          >
            <div className="space-y-6">
              <div className={`flex items-center justify-between p-5 rounded-[1.5rem] border-2 transition-all ${isMaintenanceOn ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'
                }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-[1rem] flex items-center justify-center ${isMaintenanceOn ? 'bg-red-100' : 'bg-emerald-100'
                    }`}>
                    {isMaintenanceOn
                      ? <WifiOff size={20} className="text-red-500" />
                      : <Wifi size={20} className="text-emerald-600" />}
                  </div>
                  <div>
                    <p className={`font-black text-sm ${isMaintenanceOn ? 'text-red-700' : 'text-emerald-700'}`}>
                      {isMaintenanceOn ? 'Maintenance Mode ON' : 'System Operational'}
                    </p>
                    <p className={`text-xs font-medium ${isMaintenanceOn ? 'text-red-500' : 'text-emerald-600'}`}>
                      {isMaintenanceOn
                        ? 'All non-admin requests return HTTP 503'
                        : 'All users can access the system normally'}
                    </p>
                  </div>
                </div>
                <Toggle
                  checked={isMaintenanceOn}
                  onChange={v => handleChange('maintenance_mode', v ? 'true' : 'false')}
                  onColor="bg-red-500"
                  disabled={saving}
                />
              </div>

              {isMaintenanceOn && (
                <div className="flex items-start gap-3 p-4 rounded-[1.2rem] bg-red-50 border border-red-100">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-red-700 mb-1">Kill-switch is ACTIVE</p>
                    <p className="text-xs font-bold text-red-600 leading-relaxed">
                      All Member and Organizer API requests are blocked at the server level
                      with HTTP 503. Only Admin accounts remain accessible. Non-admin users
                      are redirected to the Maintenance page.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isMaintenanceOn ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'
                  }`} />
                <p className={`text-xs font-black uppercase tracking-widest ${isMaintenanceOn ? 'text-red-400' : 'text-emerald-500'
                  }`}>
                  {isMaintenanceOn ? 'System offline for users' : 'System online'}
                </p>
              </div>
            </div>
          </SettingCard>

          {/* ── 4. Chapa Payment Environment ─────────────────── */}
          <SettingCard
            icon={<CreditCard size={22} />}
            title="Chapa Payment Environment"
            subtitle="Choose whether Chapa transactions run in developer test mode or live real-money mode"
            accentColor={isChapaLive ? 'bg-emerald-50 text-emerald-600' : 'bg-violet-50 text-violet-600'}
          >
            <div className="space-y-5">
              <PillSelector
                value={settings.chapa_mode}
                onChange={v => handleChange('chapa_mode', v)}
                options={chapaOptions}
                disabled={saving}
              />

              {isChapaLive && (
                <div className="flex items-start gap-3 p-4 rounded-[1.2rem] bg-red-50 border border-red-100">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-red-700 leading-relaxed">
                    <span className="font-black">Live mode enabled.</span>{' '}
                    All Chapa payments will process real ETB transactions.
                    Ensure your <code className="bg-red-100 px-1 rounded">CHAPA_SECRET_KEY</code> is
                    the production key, not the test key.
                  </p>
                </div>
              )}

              {!isChapaLive && (
                <div className="flex items-center gap-3 p-4 rounded-[1.2rem] bg-slate-50 border border-slate-100">
                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shrink-0" />
                  <p className="text-xs font-bold text-slate-500">
                    Sandbox mode — test transactions will not charge real accounts.
                  </p>
                </div>
              )}
            </div>
          </SettingCard>

          {/* ── 5. Fayda eKYC Verification Mode ──────────────── */}
          <SettingCard
            icon={<Fingerprint size={22} />}
            title="Fayda eKYC Verification Mode"
            subtitle="Control how members verify their National Fayda ID"
            accentColor={isKycManual ? 'bg-orange-50 text-orange-600' : 'bg-[#005C53]/10 text-[#005C53]'}
          >
            <div className="space-y-5">
              <PillSelector
                value={settings.kyc_mode}
                onChange={v => handleChange('kyc_mode', v)}
                options={kycOptions}
                disabled={saving}
              />

              {isKycManual ? (
                <div className="flex items-start gap-3 p-4 rounded-[1.2rem] bg-orange-50 border border-orange-100">
                  <ShieldAlert size={16} className="text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-orange-700 mb-1">Manual Review Active</p>
                    <p className="text-xs font-bold text-orange-600 leading-relaxed">
                      Members cannot auto-verify via the OTP modal. They must submit their
                      Fayda ID and wait for an Admin to approve under{' '}
                      <span className="font-black">KYC Verification</span> in the admin panel.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 rounded-[1.2rem] bg-[#005C53]/6 border border-[#005C53]/15">
                  <span className="w-2 h-2 rounded-full bg-[#005C53] animate-pulse shrink-0" />
                  <p className="text-xs font-bold text-[#005C53]/80">
                    Automated mode — members complete the 2-step OTP flow instantly on their dashboard.
                  </p>
                </div>
              )}
            </div>
          </SettingCard>

          {/* ── Unsaved Changes Banner ──────────────────────── */}
          {dirty && (
            <div className="lg:col-span-2 bg-amber-50 border-2 border-amber-200 rounded-[2rem] p-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-100 rounded-[1rem] flex items-center justify-center shrink-0">
                  <AlertCircle size={20} className="text-amber-600" />
                </div>
                <div>
                  <p className="font-black text-amber-800 text-sm">You have unsaved changes</p>
                  <p className="text-amber-600 font-medium text-xs mt-0.5">
                    Changes are not enforced until saved. Click "Save Changes" to apply.
                  </p>
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-[1.1rem] font-black text-sm shadow-lg shadow-amber-100 transition-all shrink-0 disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Saving…' : 'Save Now'}
              </button>
            </div>
          )}

        </div>
      )}
    </DashboardLayout>
  );
}
