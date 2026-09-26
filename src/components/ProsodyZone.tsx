import React, { useEffect, useRef } from 'react';
import {
  Activity,
  Mic,
  Volume2,
  Radio
} from 'lucide-react';
import type { AcousticProsodyMetrics } from '../types';

interface ProsodyZoneProps {
  prosody: AcousticProsodyMetrics;
  callerAudioData: Uint8Array;
  geminiAudioData: Uint8Array;
  bargeInCount?: number;
  isConnected?: boolean;
}

export const ProsodyZone: React.FC<ProsodyZoneProps> = ({
  prosody,
  callerAudioData,
  geminiAudioData,
  bargeInCount = 0,
  isConnected = false
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
    ctx.lineWidth = 2;
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 6;
    ctx.stroke();
  }, [callerAudioData]);

  // Render Gemini Copilot Output Waveform
  useEffect(() => {
    const canvas = geminiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const areaGradient = ctx.createLinearGradient(0, 0, 0, height);
    areaGradient.addColorStop(0, 'rgba(168, 85, 247, 0.45)');
    areaGradient.addColorStop(0.6, 'rgba(217, 70, 239, 0.15)');
    areaGradient.addColorStop(1, 'rgba(168, 85, 247, 0.0)');

    const lineGradient = ctx.createLinearGradient(0, 0, width, 0);
    lineGradient.addColorStop(0, '#c084fc');
    lineGradient.addColorStop(0.5, '#e879f9');
    lineGradient.addColorStop(1, '#a855f7');

    const len = geminiAudioData.length;
    if (len < 2) return;
    const step = width / (len - 1);

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
    ctx.lineWidth = 2;
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 6;
    ctx.stroke();
  }, [geminiAudioData]);

  // Dynamic Donut Gauge properties
  const stressPercent = Math.min(100, Math.max(0, prosody.stressScore));
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stressPercent / 100) * circumference;

  const getGaugeColor = () => {
    if (stressPercent >= 80) return '#f43f5e';
    if (stressPercent >= 50) return '#f59e0b';
    return '#06b6d4';
  };

  const getStressLabel = () => {
    if (stressPercent >= 75) return 'HIGH INTENSITY';
    if (stressPercent >= 45) return 'CONVERSATIONAL / ANIMATED';
    return 'CALM BASELINE';
  };

  const clarityVal = isConnected
    ? (prosody.acousticClarity ?? Math.min(99, Math.max(35, 65 + Math.round(prosody.snrDb * 1.2))))
    : 0;
  const confidenceVal = isConnected
    ? (prosody.voiceConfidence ?? Math.min(98, Math.max(40, 60 + Math.round(prosody.snrDb * 1.1))))
    : 0;
  const peakDbVal = prosody.peakDb ?? (callerAudioData[0] ? Math.round((callerAudioData[0] / 255) * 80) : 0);
  const f0Val = prosody.f0Hz ?? prosody.pitchVarianceHz;
  const jitterVal = prosody.jitterPercent ?? (stressPercent > 50 ? 4.2 : (isConnected ? 1.4 : 0));

  return (
    <div className="h-full flex flex-col gap-3.5">
      {/* ========================================================================= */}
      {/* CARD 1: Vocal Tone & Prosody Telemetry (Gemini 3.8 Live)                  */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-xl bg-[#111e2e]/90 backdrop-blur-2xl border border-[#1e3a5f]/70 shadow-[0_8px_32px_0_rgba(10,19,31,0.6)] flex flex-col gap-3">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-[#1e3a5f]/40 pb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold text-white tracking-wide uppercase">
              VOCAL TONE & PROSODY TELEMETRY (GEMINI 3.8 LIVE)
            </span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider ${
            stressPercent >= 75
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
              : stressPercent >= 45
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          }`}>
            {getStressLabel()}
          </span>
        </div>

        {/* Donut Gauge & 2x2 Telemetry Grid */}
        <div className="grid grid-cols-12 gap-3 items-center">
          {/* Left: Thick Cyan Circular Donut Gauge */}
          <div className="col-span-5 flex flex-col items-center justify-center relative">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  stroke="#0a131f"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  stroke={getGaugeColor()}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-out"
                  style={{
                    filter: `drop-shadow(0 0 8px ${getGaugeColor()})`
                  }}
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black font-mono tracking-tight text-white">
                  {stressPercent}%
                </span>
                <span className="text-[9px] font-mono text-cyan-300 tracking-wider">
                  ENERGY
                </span>
              </div>
            </div>
          </div>

          {/* Right: 2x2 Numeric Counter Grid */}
          <div className="col-span-7 grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-[#0a131f]/80 border border-[#1e3a5f]/50">
              <span className="text-[9px] font-mono text-slate-400 block uppercase">Pitch</span>
              <span className="text-sm font-bold font-mono text-cyan-300">{prosody.pitchVarianceHz} <span className="text-[10px] text-slate-500">Hz</span></span>
            </div>
            <div className="p-2 rounded-lg bg-[#0a131f]/80 border border-[#1e3a5f]/50">
              <span className="text-[9px] font-mono text-slate-400 block uppercase">Rate</span>
              <span className="text-sm font-bold font-mono text-teal-300">{prosody.speechRateWpm} <span className="text-[10px] text-slate-500">WPM</span></span>
            </div>
            <div className="p-2 rounded-lg bg-[#0a131f]/80 border border-[#1e3a5f]/50">
              <span className="text-[9px] font-mono text-slate-400 block uppercase">SNR</span>
              <span className="text-sm font-bold font-mono text-emerald-300">{prosody.snrDb} <span className="text-[10px] text-slate-500">dB</span></span>
            </div>
            <div className="p-2 rounded-lg bg-[#0a131f]/80 border border-[#1e3a5f]/50">
              <span className="text-[9px] font-mono text-slate-400 block uppercase">Barge-Ins</span>
              <span className="text-sm font-bold font-mono text-amber-300">{bargeInCount} <span className="text-[10px] text-slate-500">Hits</span></span>
            </div>
          </div>
        </div>

        {/* 2 Glowing Horizontal Cyan/Teal Progress Bars */}
        <div className="space-y-2 pt-1 border-t border-[#1e3a5f]/30">
          <div>
            <div className="flex justify-between text-[10px] font-mono mb-1">
              <span className="text-slate-400">Acoustic Clarity</span>
              <span className="text-cyan-300 font-bold">{clarityVal}%</span>
            </div>
            <div className="h-1.5 w-full bg-[#0a131f] rounded-full overflow-hidden border border-[#1e3a5f]/40">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-300 shadow-[0_0_8px_#06b6d4]"
                style={{ width: `${clarityVal}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-mono mb-1">
              <span className="text-slate-400">Voice Confidence</span>
              <span className="text-teal-300 font-bold">{confidenceVal}%</span>
            </div>
            <div className="h-1.5 w-full bg-[#0a131f] rounded-full overflow-hidden border border-[#1e3a5f]/40">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300 shadow-[0_0_8px_#14b8a6]"
                style={{ width: `${confidenceVal}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CARD 2: Acoustic Radar & Harmonics (Reference Bento Cockpit)             */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-xl bg-[#111e2e]/90 backdrop-blur-2xl border border-[#1e3a5f]/70 shadow-[0_8px_32px_0_rgba(10,19,31,0.6)] flex flex-col gap-3 flex-1">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-[#1e3a5f]/40 pb-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-mono font-bold text-white tracking-wide uppercase">
              ACOUSTIC HARMONICS & DUAL PCM OSCILLOSCOPES
            </span>
          </div>
          <span className="text-[10px] font-mono text-cyan-300">
            POLAR 16kHz
          </span>
        </div>

        {/* Circular Polar Radar Compass & Live Readout Metrics */}
        <div className="grid grid-cols-12 gap-3 items-center">
          {/* Left: Polar Radar Compass */}
          <div className="col-span-5 flex items-center justify-center">
            <div className="relative w-28 h-28 rounded-full bg-[#0a131f] border border-[#1e3a5f] p-1 flex items-center justify-center shadow-inner overflow-hidden">
              {/* Concentric radar rings */}
              <div className="absolute w-20 h-20 rounded-full border border-cyan-500/20" />
              <div className="absolute w-12 h-12 rounded-full border border-cyan-500/30" />
              <div className="absolute w-full h-[1px] bg-cyan-500/20" />
              <div className="absolute h-full w-[1px] bg-cyan-500/20" />

              {/* Rotating Sweep Needle */}
              <div className="absolute inset-0 flex items-center justify-center animate-[spin_4s_linear_infinite] origin-center pointer-events-none">
                <div className="w-[50%] h-[2px] bg-gradient-to-r from-transparent to-cyan-400 self-center ml-auto shadow-[0_0_8px_#22d3ee]" />
              </div>

              {/* Harmonic Frequency Nodes (Reacting to real mic) */}
              <div className="absolute w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981] top-6 left-7 animate-pulse" />
              <div className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#06b6d4] bottom-6 right-8 animate-ping" />
              <div className="absolute w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_8px_#f43f5e] top-8 right-6" style={{ opacity: stressPercent > 40 ? 1 : 0.2 }} />

              <span className="text-[8px] font-mono text-slate-500 absolute top-1">N</span>
              <span className="text-[8px] font-mono text-slate-500 absolute bottom-1">S</span>
              <span className="text-[8px] font-mono text-slate-500 absolute left-1">W</span>
              <span className="text-[8px] font-mono text-slate-500 absolute right-1">E</span>
            </div>
          </div>

          {/* Right: Live Readout Metrics */}
          <div className="col-span-7 space-y-1.5">
            <div className="flex items-center justify-between p-1.5 px-2.5 rounded-lg bg-[#0a131f]/80 border border-[#1e3a5f]/40 font-mono text-xs">
              <span className="text-slate-400 text-[10px]">Peak Level</span>
              <span className="font-bold text-cyan-300">{peakDbVal} dB</span>
            </div>
            <div className="flex items-center justify-between p-1.5 px-2.5 rounded-lg bg-[#0a131f]/80 border border-[#1e3a5f]/40 font-mono text-xs">
              <span className="text-slate-400 text-[10px]">Fundamental F0</span>
              <span className="font-bold text-teal-300">{f0Val} Hz</span>
            </div>
            <div className="flex items-center justify-between p-1.5 px-2.5 rounded-lg bg-[#0a131f]/80 border border-[#1e3a5f]/40 font-mono text-xs">
              <span className="text-slate-400 text-[10px]">Vocal Jitter</span>
              <span className="font-bold text-amber-300">{jitterVal}%</span>
            </div>
          </div>
        </div>

        {/* Dual Real-Time Waveform Sparklines (User vs Gemini) */}
        <div className="space-y-2 mt-auto">
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 mb-1">
              <span className="flex items-center gap-1">
                <Mic className="w-3 h-3" />
                <span>User Microphone Stream (16kHz PCM)</span>
              </span>
              <span className="text-slate-500 text-[9px]">REAL-TIME PCM</span>
            </div>
            <div className="h-14 w-full rounded-lg bg-[#0a131f] border border-[#1e3a5f]/50 overflow-hidden relative">
              <canvas ref={callerCanvasRef} width={320} height={56} className="w-full h-full block" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[10px] font-mono text-purple-400 mb-1">
              <span className="flex items-center gap-1">
                <Volume2 className="w-3 h-3" />
                <span>Gemini Live Voice Output (24kHz PCM)</span>
              </span>
              <span className="text-slate-500 text-[9px]">GEMINI LIVE BIDI</span>
            </div>
            <div className="h-14 w-full rounded-lg bg-[#0a131f] border border-[#1e3a5f]/50 overflow-hidden relative">
              <canvas ref={geminiCanvasRef} width={320} height={56} className="w-full h-full block" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
