import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import axiosInstance from '../api/axiosInstance';
import {
  MessageSquare,
  Percent,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  RefreshCw,
  Radio,
  FlaskConical,
  WifiOff,
  Wifi,
} from 'lucide-react';

// ── Section card wrapper ───────────────────────────────────────────────────────
function SettingCard({ icon, title, subtitle, children, accentColor = 'bg-blue-50 text-blue-600' }) {
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

// ── Toggle switch ──────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled, onColor = 'bg-blue-600' }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? onColor : 'bg-slate-200'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
          checked ? 'translate-x-8' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
function AdminGlobalSettings() {
  const [settings, setSettings] = useState({
    sms_mode: 'simulation',
    service_fee_pct: '2',
    maintenance_mode: 'false',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [toast, setToast] = useState(null);
  const [dirty, setDirty] = useState(false);

  const toastTimerRef = useRef(null);

  // ── Fetch Initial Data ────────────────────────────────────────────────────
  useEffect(() => {
    fetchSettings();
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await axiosInstance.get('/admin/settings');
      setSettings(res.data);
      setDirty(false);
    } catch {
      setFetchError('Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Toast Notification Helper ────────────────────────────────────────────
  const showToast = (type, msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ type, msg });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  };

  // ── Draft Input Change Handler ───────────────────────────────────────────
  const handleChange = (key, value) => {
    // Basic validation for service fee percentage
    if (key === 'service_fee_pct') {
      const val = parseFloat(value);
      if (val < 0 || val > 100) return;
    }
    setSettings((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  // ── Save Settings ────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axiosInstance.patch('/admin/settings', settings);
      setSettings(res.data.settings);
      setDirty(false);
      showToast('success', 'Settings saved successfully!');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to save settings.';
      showToast('error', msg);
    } finally {
      setSaving(false);
    }
  };

  const isMaintenanceOn = settings.maintenance_mode === 'true';
  const isLiveMode = settings.sms_mode === 'live';

  return (
    <DashboardLayout role="ADMIN">
      {/* ── Toast Notification ── */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-[1.5rem] shadow-2xl font-bold text-sm transition-all duration-300 ${
            toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="mb-10 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Global Settings</h1>
          <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-1">
            System-wide configuration
          </p>
        </div>

        {!loading && !fetchError && (
          <div className="flex items-center gap-3">
            <button
              onClick={fetchSettings}
              disabled={saving}
              title="Reload from server"
              className="p-3 bg-white border border-slate-100 text-slate-400 rounded-[1.1rem] hover:text-blue-500 hover:border-blue-200 transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw size={18} className={saving ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={handleSave}
              disabled={!dirty || saving}
              className={`flex items-center gap-2 px-6 py-3 rounded-[1.1rem] font-black text-sm shadow-lg transition-all ${
                dirty && !saving
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save size={16} /> Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ── Loading State ── */}
      {loading && (
        <div className="flex items-center justify-center py-32 gap-3">
          <Loader2 size={36} className="animate-spin text-slate-300" />
          <span className="font-bold text-slate-400">Loading settings…</span>
        </div>
      )}

      {/* ── Error State ── */}
      {!loading && fetchError && (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <AlertCircle size={36} className="text-red-300" />
          <p className="text-red-400 font-bold">{fetchError}</p>
          <button
            onClick={fetchSettings}
            className="px-6 py-3 bg-blue-600 text-white rounded-[1.2rem] font-bold hover:bg-blue-700 transition-all"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Settings Cards ── */}
      {!loading && !fetchError && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 1. SMS Configuration */}
          <SettingCard
            icon={<MessageSquare size={22} />}
            title="SMS Configuration"
            subtitle="Control how OTP and notification SMS messages are delivered"
            accentColor="bg-blue-50 text-blue-600"
          >
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleChange('sms_mode', 'simulation')}
                  className={`p-5 rounded-[1.5rem] border-2 text-left transition-all ${
                    !isLiveMode
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-[0.8rem] flex items-center justify-center mb-3 ${
                      !isLiveMode ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    <FlaskConical size={18} />
                  </div>
                  <p className={`font-black text-sm ${!isLiveMode ? 'text-blue-700' : 'text-slate-500'}`}>
                    Simulation
                  </p>
                  <p className={`text-xs font-medium mt-0.5 ${!isLiveMode ? 'text-blue-500' : 'text-slate-400'}`}>
                    Logs to console only
                  </p>
                  {!isLiveMode && (
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase tracking-wider">
                      <CheckCircle2 size={11} /> Active
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleChange('sms_mode', 'live')}
                  className={`p-5 rounded-[1.5rem] border-2 text-left transition-all ${
                    isLiveMode
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-[0.8rem] flex items-center justify-center mb-3 ${
                      isLiveMode ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    <Radio size={18} />
                  </div>
                  <p className={`font-black text-sm ${isLiveMode ? 'text-emerald-700' : 'text-slate-500'}`}>
                    Live (AfroMessage)
                  </p>
                  <p className={`text-xs font-medium mt-0.5 ${isLiveMode ? 'text-emerald-600' : 'text-slate-400'}`}>
                    Sends real SMS via API
                  </p>
                  {isLiveMode && (
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-wider">
                      <CheckCircle2 size={11} /> Active
                    </div>
                  )}
                </button>
              </div>

              <div
                className={`flex items-center gap-3 p-4 rounded-[1.2rem] ${
                  isLiveMode ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50 border border-slate-100'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full animate-pulse ${isLiveMode ? 'bg-emerald-500' : 'bg-slate-400'}`}
                />
                <p className={`text-xs font-bold ${isLiveMode ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {isLiveMode
                    ? 'Live mode active — real SMS messages will be sent via AfroMessage'
                    : 'Simulation mode active — SMS messages are logged to the server console'}
                </p>
              </div>

              {isLiveMode && (
                <div className="flex items-start gap-3 p-4 rounded-[1.2rem] bg-amber-50 border border-amber-100">
                  <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-amber-700 leading-relaxed">
                    Live mode charges your AfroMessage account per SMS. Ensure your API token in{' '}
                    <code className="bg-amber-100 px-1 rounded">.env</code> is valid before switching.
                  </p>
                </div>
              )}
            </div>
          </SettingCard>

          {/* 2. Financials */}
          <SettingCard
            icon={<Percent size={22} />}
            title="Financials"
            subtitle="Configure platform fees applied to each Equb transaction"
            accentColor="bg-violet-50 text-violet-600"
          >
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="serviceFeeInput"
                  className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2"
                >
                  Platform Service Fee
                </label>
                <div className="relative">
                  <input
                    id="serviceFeeInput"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settings.service_fee_pct}
                    onChange={(e) => handleChange('service_fee_pct', e.target.value)}
                    className="w-full px-5 py-4 pr-12 bg-slate-50 rounded-[1.5rem] border-2 border-transparent focus:border-violet-500 outline-none font-black text-2xl text-slate-800 transition-colors"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl pointer-events-none">
                    %
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-2 ml-1">
                  Accepted range: 0% – 100%. Current:{' '}
                  <span className="font-black text-violet-600">{settings.service_fee_pct || 0}%</span>
                </p>
              </div>

              <div className="bg-violet-50 rounded-[1.5rem] p-5 border border-violet-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-violet-400 mb-3">
                  Fee Preview
                </p>
                <div className="space-y-2">
                  {[500, 1000, 5000].map((amount) => {
                    const fee = (((parseFloat(settings.service_fee_pct) || 0) / 100) * amount).toFixed(2);
                    return (
                      <div key={amount} className="flex justify-between items-center text-sm">
                        <span className="font-bold text-slate-500">{amount.toLocaleString()} ETB contribution</span>
                        <span className="font-black text-violet-700">→ {parseFloat(fee).toLocaleString()} ETB fee</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </SettingCard>

          {/* 3. Maintenance Mode */}
          <SettingCard
            icon={<ShieldAlert size={22} />}
            title="System Status"
            subtitle="Temporarily disable access for all non-admin users"
            accentColor={isMaintenanceOn ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}
          >
            <div className="space-y-6">
              <div
                className={`flex items-center justify-between p-5 rounded-[1.5rem] border-2 transition-all ${
                  isMaintenanceOn ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-11 h-11 rounded-[1rem] flex items-center justify-center ${
                      isMaintenanceOn ? 'bg-red-100' : 'bg-emerald-100'
                    }`}
                  >
                    {isMaintenanceOn ? (
                      <WifiOff size={20} className="text-red-500" />
                    ) : (
                      <Wifi size={20} className="text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <p className={`font-black text-sm ${isMaintenanceOn ? 'text-red-700' : 'text-emerald-700'}`}>
                      {isMaintenanceOn ? 'Maintenance Mode ON' : 'System Operational'}
                    </p>
                    <p className={`text-xs font-medium ${isMaintenanceOn ? 'text-red-500' : 'text-emerald-600'}`}>
                      {isMaintenanceOn
                        ? 'Non-admin users cannot log in'
                        : 'All users can access the system normally'}
                    </p>
                  </div>
                </div>
                <Toggle
                  checked={isMaintenanceOn}
                  onChange={(val) => handleChange('maintenance_mode', val ? 'true' : 'false')}
                  onColor="bg-red-500"
                />
              </div>

              {isMaintenanceOn && (
                <div className="flex items-start gap-3 p-4 rounded-[1.2rem] bg-red-50 border border-red-100">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-red-700 mb-1">Maintenance mode is ON</p>
                    <p className="text-xs font-bold text-red-600 leading-relaxed">
                      All members and organizers will be unable to log in until this is turned off. Only admin
                      accounts remain accessible.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    isMaintenanceOn ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'
                  }`}
                />
                <p
                  className={`text-xs font-black uppercase tracking-widest ${
                    isMaintenanceOn ? 'text-red-400' : 'text-emerald-500'
                  }`}
                >
                  {isMaintenanceOn ? 'System offline for users' : 'System online'}
                </p>
              </div>
            </div>
          </SettingCard>

          {/* 4. Unsaved Changes Banner */}
          {dirty && (
            <div className="lg:col-span-2 bg-amber-50 border-2 border-amber-200 rounded-[2rem] p-6 flex items-center justify-between gap-4 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-100 rounded-[1rem] flex items-center justify-center shrink-0">
                  <AlertCircle size={20} className="text-amber-600" />
                </div>
                <div>
                  <p className="font-black text-amber-800 text-sm">You have unsaved changes</p>
                  <p className="text-amber-600 font-medium text-xs mt-0.5">
                    Click "Save Changes" in the header to apply your settings to the system.
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

export default AdminGlobalSettings;