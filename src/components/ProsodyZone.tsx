import React, { useEffect, useRef } from 'react';
import {
  Activity,
  Mic,
  Volume2,
  AlertCircle,
  Wind,
  Layers,
  Car,
  Flame,
  AudioWaveform as WaveformIcon
} from 'lucide-react';
import type { AcousticProsodyMetrics } from '../types';

interface ProsodyZoneProps {
  prosody: AcousticProsodyMetrics;
  callerAudioData: Uint8Array;
  geminiAudioData: Uint8Array;
}

export const ProsodyZone: React.FC<ProsodyZoneProps> = ({
  prosody,
  callerAudioData,
  geminiAudioData
}) => {
  const callerCanvasRef = useRef<HTMLCanvasElement>(null);
  const geminiCanvasRef = useRef<HTMLCanvasElement>(null);

  // Render Caller Waveform with Multi-Gradient Filled Area & Neon Glow
  useEffect(() => {
    const canvas = callerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Area fill gradient (Cyan-to-Teal illuminated backdrop)
    const areaGradient = ctx.createLinearGradient(0, 0, 0, height);
    areaGradient.addColorStop(0, 'rgba(6, 182, 212, 0.45)');
    areaGradient.addColorStop(0.6, 'rgba(20, 184, 166, 0.15)');
    areaGradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

    // Top line gradient
    const lineGradient = ctx.createLinearGradient(0, 0, width, 0);
    lineGradient.addColorStop(0, '#06b6d4');
    lineGradient.addColorStop(0.5, '#2dd4bf');
    lineGradient.addColorStop(1, '#38bdf8');

    const len = callerAudioData.length;
    if (len < 2) return;
    const step = width / (len - 1);

    // Draw Area
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let i = 0; i < len; i++) {
      const val = callerAudioData[i] / 255;
      const y = height - (val * (height - 8) + 4);
      const x = i * step;
      if (i === 0) {
        ctx.lineTo(x, y);
      } else {
        const prevX = (i - 1) * step;
        const prevVal = callerAudioData[i - 1] / 255;
        const prevY = height - (prevVal * (height - 8) + 4);
        const cpX = (prevX + x) / 2;
        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
      }
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = areaGradient;
    ctx.fill();

    // Draw Top Neon Stroke
    ctx.beginPath();
    for (let i = 0; i < len; i++) {
      const val = callerAudioData[i] / 255;
      const y = height - (val * (height - 8) + 4);
      const x = i * step;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevX = (i - 1) * step;
        const prevVal = callerAudioData[i - 1] / 255;
        const prevY = height - (prevVal * (height - 8) + 4);
        const cpX = (prevX + x) / 2;
        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
      }
    }
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 8;
    ctx.stroke();
  }, [callerAudioData]);

  // Render Gemini Output Waveform with Violet-to-Fuchsia Gradient Filled Area
  useEffect(() => {
    const canvas = geminiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Area fill gradient (Violet-to-Fuchsia)
    const areaGradient = ctx.createLinearGradient(0, 0, 0, height);
    areaGradient.addColorStop(0, 'rgba(168, 85, 247, 0.45)');
    areaGradient.addColorStop(0.6, 'rgba(217, 70, 239, 0.15)');
    areaGradient.addColorStop(1, 'rgba(168, 85, 247, 0.0)');

    // Line stroke gradient
    const lineGradient = ctx.createLinearGradient(0, 0, width, 0);
    lineGradient.addColorStop(0, '#8b5cf6');
    lineGradient.addColorStop(0.5, '#a855f7');
    lineGradient.addColorStop(1, '#d946ef');

    const len = geminiAudioData.length;
    if (len < 2) return;
    const step = width / (len - 1);

    // Draw Area
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let i = 0; i < len; i++) {
      const val = geminiAudioData[i] / 255;
      const y = height - (val * (height - 8) + 4);
      const x = i * step;
      if (i === 0) {
        ctx.lineTo(x, y);
      } else {
        const prevX = (i - 1) * step;
        const prevVal = geminiAudioData[i - 1] / 255;
        const prevY = height - (prevVal * (height - 8) + 4);
        const cpX = (prevX + x) / 2;
        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
      }
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = areaGradient;
    ctx.fill();

    // Draw Top Neon Stroke
    ctx.beginPath();
    for (let i = 0; i < len; i++) {
      const val = geminiAudioData[i] / 255;
      const y = height - (val * (height - 8) + 4);
      const x = i * step;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevX = (i - 1) * step;
        const prevVal = geminiAudioData[i - 1] / 255;
        const prevY = height - (prevVal * (height - 8) + 4);
        const cpX = (prevX + x) / 2;
        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
      }
    }
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 8;
    ctx.stroke();
  }, [geminiAudioData]);

  // Dynamic conic stress colors and drop-shadow
  const getStressConfig = (score: number) => {
    if (score >= 80) {
      return {
        text: 'text-rose-400',
        stroke: '#f43f5e',
        glow: 'rgba(244, 63, 94, 0.7)',
        label: 'CRITICAL STRESS',
        badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
      };
    }
    if (score >= 45) {
      return {
        text: 'text-amber-400',
        stroke: '#f59e0b',
        glow: 'rgba(245, 158, 11, 0.7)',
        label: 'ELEVATED DISTRESS',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      };
    }
    return {
      text: 'text-emerald-400',
      stroke: '#10b981',
      glow: 'rgba(16, 185, 129, 0.7)',
      label: 'RESTING BASELINE',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    };
  };

  const stressCfg = getStressConfig(prosody.stressScore);

  const getTagIcon = (id: string) => {
    switch (id) {
      case 'panic':
      case 'dyspnea':
        return <Wind className="w-3.5 h-3.5" />;
      case 'horns':
        return <Car className="w-3.5 h-3.5" />;
      case 'multispeaker':
        return <Layers className="w-3.5 h-3.5" />;
      case 'fire':
      case 'chem':
        return <Flame className="w-3.5 h-3.5" />;
      default:
        return <AlertCircle className="w-3.5 h-3.5" />;
    }
  };

  // Radial SVG calculation for Panic Stress Score
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, prosody.stressScore)) / 100) * circumference;

  // Compute live dB bar height indicators
  const callerRms = Math.min(100, Math.round((callerAudioData.reduce((a, b) => a + b, 0) / (callerAudioData.length || 1)) * 1.5));
  const geminiRms = Math.min(100, Math.round((geminiAudioData.reduce((a, b) => a + b, 0) / (geminiAudioData.length || 1)) * 1.5));

  return (
    <div className="h-full flex flex-col gap-4 p-4 lg:p-5 bg-gradient-to-b from-slate-900/70 via-slate-900/40 to-slate-950/80 backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] rounded-2xl ring-1 ring-white/[0.04] overflow-y-auto">
      {/* Zone Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Zone 1: Vocal Prosody & Telemetry HUD
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              ACOUSTIC DISTRESS HARMONICS & REAL-TIME DSP
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono">
          DSP LIVE
        </span>
      </div>

      {/* Neon Conic Stress Gauge Card */}
      <div className="p-4 rounded-2xl bg-[#090d16]/90 border border-white/[0.06] shadow-xl flex items-center justify-between relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            Vocal Stress & Panic Index
          </div>
          <div className="flex flex-col">
            <span className={`text-4xl font-black font-mono tracking-tighter ${stressCfg.text}`}>
              {prosody.stressScore}%
            </span>
            <div className="mt-1">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold tracking-wider border uppercase ${stressCfg.badgeBg}`}>
                {stressCfg.label}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 max-w-[200px] leading-relaxed pt-1">
            Real-time fundamental frequency jitter, pitch tremolo, and acoustic intensity.
          </p>
        </div>

        {/* Circular Dual-Ring SVG Gauge with Neon Glow */}
        <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
          <svg
            className="w-full h-full -rotate-90"
            viewBox="0 0 120 120"
            style={{ filter: `drop-shadow(0 0 10px ${stressCfg.glow})` }}
          >
            {/* Outer Background track */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              className="stroke-slate-800/80 fill-none"
              strokeWidth="8"
            />
            {/* Inner dashed ring */}
            <circle
              cx="60"
              cy="60"
              r={radius - 10}
              className="stroke-slate-800/40 fill-none"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            {/* Dynamic Value Arc */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={stressCfg.stroke}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-mono font-black text-white">{prosody.stressScore}%</span>
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">PANIC</span>
          </div>
        </div>
      </div>

      {/* 3 Telemetry Micro-Cards with Sparkline Trend Graphs */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Pitch Variance Micro-Card */}
        <div className="p-3 rounded-xl bg-[#090d16]/80 border border-white/[0.06] flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 font-mono tracking-wider">PITCH F0</div>
          <div className="text-base font-mono font-bold text-cyan-300 mt-1">
            {prosody.pitchVarianceHz} <span className="text-[10px] font-sans text-slate-500 font-normal">Hz</span>
          </div>
          {/* Mini SVG Sparkline */}
          <div className="w-full h-5 mt-2">
            <svg className="w-full h-full" viewBox="0 0 60 20" preserveAspectRatio="none">
              <path
                d="M0,15 Q15,5 30,12 T60,8"
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Speech Rate Micro-Card */}
        <div className="p-3 rounded-xl bg-[#090d16]/80 border border-white/[0.06] flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 font-mono tracking-wider">TEMPO</div>
          <div className="text-base font-mono font-bold text-amber-300 mt-1">
            {prosody.speechRateWpm} <span className="text-[10px] font-sans text-slate-500 font-normal">WPM</span>
          </div>
          {/* Mini SVG Sparkline */}
          <div className="w-full h-5 mt-2">
            <svg className="w-full h-full" viewBox="0 0 60 20" preserveAspectRatio="none">
              <path
                d="M0,12 Q10,18 25,6 T60,10"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* SNR Micro-Card */}
        <div className="p-3 rounded-xl bg-[#090d16]/80 border border-white/[0.06] flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 font-mono tracking-wider">SNR LEVEL</div>
          <div className="text-base font-mono font-bold text-emerald-300 mt-1">
            {prosody.snrDb} <span className="text-[10px] font-sans text-slate-500 font-normal">dB</span>
          </div>
          {/* Mini SVG Sparkline */}
          <div className="w-full h-5 mt-2">
            <svg className="w-full h-full" viewBox="0 0 60 20" preserveAspectRatio="none">
              <path
                d="M0,10 Q20,2 40,8 T60,5"
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Neon Gradient Oscilloscope Visualizers */}
      <div className="space-y-3">
        {/* Caller Voice Stream */}
        <div className="p-3 rounded-xl bg-[#090d16]/90 border border-white/[0.06]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#22d3ee]" />
              <Mic className="w-3.5 h-3.5 text-cyan-400" />
              <span>Caller Microphone Stream</span>
            </div>
            {/* Live dB meter bar */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 font-mono">{callerRms}%</span>
              <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-400 to-cyan-400 transition-all duration-75"
                  style={{ width: `${callerRms}%` }}
                />
              </div>
            </div>
          </div>
          <div className="h-14 w-full bg-[#05070d] rounded-lg overflow-hidden border border-white/[0.04] flex items-center justify-center relative shadow-inner">
            <canvas
              ref={callerCanvasRef}
              width={300}
              height={56}
              className="w-full h-full block"
            />
          </div>
        </div>

        {/* 108 Copilot Audio Output */}
        <div className="p-3 rounded-xl bg-[#090d16]/90 border border-white/[0.06]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shadow-[0_0_6px_#c084fc]" />
              <Volume2 className="w-3.5 h-3.5 text-purple-400" />
              <span>108 Copilot Audio Output</span>
            </div>
            {/* Live dB meter bar */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 font-mono">{geminiRms}%</span>
              <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-400 to-fuchsia-400 transition-all duration-75"
                  style={{ width: `${geminiRms}%` }}
                />
              </div>
            </div>
          </div>
          <div className="h-14 w-full bg-[#05070d] rounded-lg overflow-hidden border border-white/[0.04] flex items-center justify-center relative shadow-inner">
            <canvas
              ref={geminiCanvasRef}
              width={300}
              height={56}
              className="w-full h-full block"
            />
          </div>
        </div>
      </div>

      {/* Paralinguistic & Acoustic Signatures */}
      <div className="space-y-2 mt-auto">
        <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <WaveformIcon className="w-3.5 h-3.5 text-cyan-400" />
          Acoustic Paralinguistic Signatures
        </div>
        <div className="flex flex-wrap gap-1.5">
          {prosody.detectedTags.map((tag) => (
            <div
              key={tag.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                tag.severity === 'critical'
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                  : tag.severity === 'warning'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                  : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
              }`}
            >
              {getTagIcon(tag.id)}
              <span>{tag.label}</span>
              <span className="text-[10px] font-mono opacity-80">
                {Math.round(tag.confidence * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
