import React, { useEffect, useRef, useCallback } from 'react';
// Import the logo here
import logoImg from '../assets/logo.jpg';

const COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#22c55e',
];

// Physics easing
function spinEase(t) {
  if (t < 0.08) {
    return 3.5 * t * t;
  }
  if (t < 0.70) {
    const tAdj = (t - 0.08) / 0.62;
    return 0.0224 + 0.70 * tAdj;
  }
  const tAdj = (t - 0.70) / 0.30;
  const decel = 1 - Math.pow(1 - tAdj, 3);
  return 0.7224 + 0.2776 * decel;
}

// Tick sound
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function playTick(volume = 0.15) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.04);
  } catch {}
}

function playFanfare() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.start(t);
      osc.stop(t + 0.35);
    } catch {}
  });
}

// SpinningWheel component
function SpinningWheel({ participants = [], winnerId, durationMs, onFinished }) {
  const canvasRef = useRef(null);
  const logoRef = useRef(null); // Logo container
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const lastTickRef = useRef(0);
  const lastSegRef = useRef(-1);
  const doneRef = useRef(false);

  const n = participants.length;
  const winnerIdx = participants.findIndex((p) => p.userId === winnerId);
  const DURATION = durationMs || 120000;

  const arc = n > 0 ? (2 * Math.PI) / n : 1;
  const targetAngle = -(winnerIdx * arc + arc / 2);
  const totalRotation = 2 * Math.PI * 20 + targetAngle;

  // Preload logo
  useEffect(() => {
    const img = new Image();
    img.src = logoImg;
    img.onload = () => {
      logoRef.current = img;
    };
  }, []);

  const drawWheel = useCallback(
    (rotation) => {
      const canvas = canvasRef.current;
      if (!canvas || n === 0) return;
      const ctx = canvas.getContext('2d');
      const W = canvas.width,
        H = canvas.height;
      const cx = W / 2,
        cy = H / 2;
      const r = Math.min(cx, cy) - 18;

      ctx.clearRect(0, 0, W, H);

      // Glow ring
      const grad = ctx.createRadialGradient(cx, cy, r - 4, cx, cy, r + 12);
      grad.addColorStop(0, 'rgba(99,102,241,0.15)');
      grad.addColorStop(1, 'rgba(99,102,241,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, r + 12, 0, 2 * Math.PI);
      ctx.fillStyle = grad;
      ctx.fill();

      // Segments
      participants.forEach((p, i) => {
        const segStart = rotation + i * arc - Math.PI / 2;
        const segEnd = segStart + arc;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, segStart, segEnd);
        ctx.closePath();
        ctx.fillStyle = COLORS[i % COLORS.length];
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Name label
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(segStart + arc / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        const fontSize = Math.max(9, Math.min(15, 180 / n));
        ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        const name = p.fullName.length > 13 ? p.fullName.slice(0, 12) + '…' : p.fullName;
        ctx.fillText(name, r - 10, fontSize / 3);
        ctx.restore();
      });

      // Draw logo in center (Replacing the star)
      
      // 1. White background circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, 34, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.restore();

      // 2. Crop logo into a circle
      if (logoRef.current) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, 30, 0, 2 * Math.PI);
        ctx.clip(); // Clips the image into a circle
        ctx.drawImage(logoRef.current, cx - 30, cy - 30, 60, 60);
        ctx.restore();
      }

      // Pointer
      const py = cy - r - 4;
      const pGrad = ctx.createLinearGradient(cx - 14, py, cx + 14, py + 28);
      pGrad.addColorStop(0, '#fbbf24');
      pGrad.addColorStop(0.5, '#f59e0b');
      pGrad.addColorStop(1, '#d97706');
      ctx.beginPath();
      ctx.moveTo(cx, py - 8);
      ctx.lineTo(cx - 14, py + 22);
      ctx.lineTo(cx + 14, py + 22);
      ctx.closePath();
      ctx.fillStyle = pGrad;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    },
    [participants, n, arc]
  );

  useEffect(() => {
    if (n === 0 || doneRef.current) return;
    doneRef.current = false;

    const animate = (timestamp) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const t = Math.min(elapsed / DURATION, 1);
      const eased = spinEase(t);
      const rotation = totalRotation * eased;

      drawWheel(rotation);

      const normalised = ((rotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      const currentSeg = Math.floor((normalised / (2 * Math.PI)) * n) % n;
      if (currentSeg !== lastSegRef.current) {
        lastSegRef.current = currentSeg;
        const speed = t < 0.70 ? 1 : 1 - (t - 0.70) / 0.30;
        const vol = 0.08 + speed * 0.12;
        if (timestamp - lastTickRef.current > 30) {
          playTick(vol);
          lastTickRef.current = timestamp;
        }
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        drawWheel(totalRotation);
        doneRef.current = true;
        playFanfare();
        if (onFinished) onFinished();
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [participants, winnerId, DURATION, totalRotation, drawWheel, onFinished, n]);

  return (
    <div className="relative flex items-center justify-center select-none">
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }}
      />
      <canvas
        ref={canvasRef}
        width={440}
        height={440}
        className="relative max-w-full"
        style={{ borderRadius: '50%', filter: 'drop-shadow(0 8px 32px rgba(99,102,241,0.25))' }}
      />
    </div>
  );
}

export default SpinningWheel;