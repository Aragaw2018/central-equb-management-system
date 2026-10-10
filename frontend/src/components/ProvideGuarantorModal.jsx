import React, { useState, useRef } from 'react';
import axiosInstance from '../api/axiosInstance';
import {
  Loader2,
  CheckCircle2,
  X,
  Shield,
  Upload,
  CreditCard,
  FileText,
  ShieldAlert,
  Fingerprint,
  Map,
  Camera,
  RefreshCw
} from 'lucide-react';

// File upload component
function FileUploadBox({ label, fieldName, preview, onFile, onRemove, required, icon: Icon }) {
  const ref = useRef(null);
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
        {Icon && <Icon size={12} className="text-slate-400" />}
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {!preview ? (
        <label
          htmlFor={fieldName}
          className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-[1.2rem] py-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
        >
          <Upload size={18} className="text-slate-400 group-hover:text-blue-500" />
          <p className="text-[10px] font-bold text-slate-500 text-center px-2">Upload Image</p>
          <input
            id={fieldName}
            ref={ref}
            type="file"
            accept="image/*"
            onChange={(e) => onFile(e.target.files?.[0])}
            className="hidden"
          />
        </label>
      ) : (
        <div className="relative rounded-[1.2rem] overflow-hidden border-2 border-emerald-200 bg-slate-50">
          <img src={preview} alt={label} className="w-full h-24 object-cover" />
          <div className="absolute top-1 left-1 bg-emerald-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 size={8} /> LOADED
          </div>
          <button
            type="button"
            onClick={() => {
              onRemove();
              if (ref.current) ref.current.value = '';
            }}
            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"
          >
            <X size={10} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function ProvideGuarantorModal({ guarantorRequest, onClose, onSubmitted }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const videoRef = useRef(null);

  // 1. Form state variables
  const [checkNumber, setCheckNumber] = useState('');
  const [faydaId, setFaydaId] = useState('');
  const [checkFile, setCheckFile] = useState(null);
  const [checkPreview, setCheckPreview] = useState(null);
  const [landFile, setLandFile] = useState(null);
  const [landPreview, setLandPreview] = useState(null);
  const [faydaFile, setFaydaFile] = useState(null);
  const [faydaPreview, setFaydaPreview] = useState(null);

  // 2. Camera and biometric state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const winner = guarantorRequest?.drawResult?.winner;

  // 3. Strict form validation logic
  const isFormComplete =
    checkNumber.trim().length > 2 &&
    faydaId.trim().length > 2 &&
    checkFile !== null &&
    landFile !== null &&
    faydaFile !== null &&
    scanned === true;

  const handleFileChange = (setter, previewSetter) => (file) => {
    if (!file) return;
    setter(file);
    previewSetter(URL.createObjectURL(file));
  };

  const stopCameraStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // 4. Camera control handler
  const startCamera = async () => {
    setIsCameraActive(true);
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Camera access denied. Please grant permission in browser settings.');
      setIsCameraActive(false);
    }
  };

  const handleStartScan = () => {
    setScanning(true);
    // Simulated facial recognition process
    setTimeout(() => {
      setScanning(false);
      setScanned(true);
      setIsCameraActive(false);
      stopCameraStream();
    }, 3500);
  };

  const resetBiometricScan = () => {
    stopCameraStream();
    setScanned(false);
    setIsCameraActive(false);
  };

  const handleAccept = async () => {
    if (!isFormComplete) return;
    setError('');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('status', 'ACCEPTED');
      fd.append('userId', user.id);
      fd.append('checkNumber', checkNumber);
      fd.append('faydaId', faydaId);
      fd.append('checkImage', checkFile);
      fd.append('landDoc', landFile);
      fd.append('faydaScan', faydaFile);

      await axiosInstance.patch(`/guarantor/${guarantorRequest.id}/respond`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onSubmitted();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit security documents.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!guarantorRequest) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg my-8 animate-in zoom-in-95">

        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-8 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Shield size={20} className="text-blue-600" />
            </div>
            <h2 className="font-black text-slate-800 text-base">Security Compliance (Guarantor)</h2>
          </div>
          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-8 py-6 space-y-5">
          {/* Form Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                  National ID (Fayda) *
                </label>
                <input
                  type="text"
                  value={faydaId}
                  onChange={(e) => setFaydaId(e.target.value)}
                  placeholder="Enter Fayda ID"
                  className="w-full p-3 bg-slate-100 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                  Bank Check Number *
                </label>
                <input
                  type="text"
                  value={checkNumber}
                  onChange={(e) => setCheckNumber(e.target.value)}
                  placeholder="CHK-XXXXXX"
                  className="w-full p-3 bg-slate-100 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* File Uploads Grid */}
            <div className="grid grid-cols-3 gap-3">
              <FileUploadBox
                label="Fayda Scan"
                fieldName="fayda"
                preview={faydaPreview}
                icon={FileText}
                onFile={handleFileChange(setFaydaFile, setFaydaPreview)}
                onRemove={() => setFaydaPreview(null)}
                required
              />
              <FileUploadBox
                label="Check Photo"
                fieldName="check"
                preview={checkPreview}
                icon={CreditCard}
                onFile={handleFileChange(setCheckFile, setCheckPreview)}
                onRemove={() => setCheckPreview(null)}
                required
              />
              <FileUploadBox
                label="Land Map"
                fieldName="land"
                preview={landPreview}
                icon={Map}
                onFile={handleFileChange(setLandFile, setLandPreview)}
                onRemove={() => setLandPreview(null)}
                required
              />
            </div>

            {/* Camera / Biometric Section */}
            <div className="relative bg-slate-900 rounded-[2rem] overflow-hidden min-h-[200px] flex flex-col items-center justify-center p-4 border-4 border-slate-800">
              {isCameraActive ? (
                <div className="w-full space-y-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-48 object-cover rounded-2xl bg-black"
                  />
                  {scanning ? (
                    <div className="absolute inset-0 bg-blue-600/20 flex flex-col items-center justify-center">
                      <div className="w-32 h-32 border-2 border-white/50 rounded-full animate-ping mb-4" />
                      <p className="text-white font-black text-xs animate-pulse">ANALYZING BIOMETRICS...</p>
                    </div>
                  ) : (
                    <button
                      onClick={handleStartScan}
                      className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2"
                    >
                      <Fingerprint size={16} /> CAPTURE & SYNC
                    </button>
                  )}
                </div>
              ) : scanned ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40">
                    <CheckCircle2 size={32} className="text-white" />
                  </div>
                  <p className="text-emerald-400 font-black text-sm uppercase tracking-widest">
                    Identity Verified
                  </p>
                  <button
                    onClick={resetBiometricScan}
                    className="text-slate-400 hover:text-white text-[10px] flex items-center gap-1 mt-1 transition-colors"
                  >
                    <RefreshCw size={10} /> Retake Verification
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                    <Camera size={28} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="text-white font-black text-xs uppercase">Facial Recognition Required</p>
                    <p className="text-slate-500 text-[9px] mt-1">Sync live facial scan with National Fayda system</p>
                  </div>
                  <button
                    onClick={startCamera}
                    className="px-8 py-3 bg-slate-800 hover:bg-blue-600 text-white rounded-xl text-[10px] font-black transition-all"
                  >
                    ACTIVATE CAMERA
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Legal Disclaimer */}
          <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-4 flex gap-3 items-start">
            <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={16} />
            <p className="text-[10px] font-bold text-amber-800 leading-relaxed italic">
              Legal Disclaimer: I {user?.fullName || 'User'} hereby legally commit to being the guarantor for{' '}
              {winner?.fullName || 'the winner'}. My submitted assets serve as legally binding collateral.
            </p>
          </div>

          {error && <p className="text-red-500 text-[10px] font-bold text-center">{error}</p>}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-2">
            <button
              onClick={() => {
                stopCameraStream();
                onClose();
              }}
              className="flex-1 py-4 text-slate-400 font-black text-xs hover:text-slate-600 transition-colors"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              disabled={!isFormComplete || submitting}
              className={`flex-[2] py-4 rounded-2xl font-black text-xs shadow-xl transition-all flex items-center justify-center gap-2 ${
                isFormComplete
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <>
                  <CheckCircle2 size={16} /> ACCEPT & SUBMIT
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}