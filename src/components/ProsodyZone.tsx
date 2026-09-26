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

  // Render Caller Waveform on Canvas with Neon Cyan Glow
  useEffect(() => {
    const canvas = callerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Neon Cyan Gradient styling
    const gradient = ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, '#0891b2');
    gradient.addColorStop(0.5, '#06b6d4');
    gradient.addColorStop(1, '#22d3ee');

    ctx.fillStyle = gradient;
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 4;

    const barWidth = (width / callerAudioData.length) * 1.5;
    let x = 0;

    for (let i = 0; i < callerAudioData.length; i++) {
      const barHeight = Math.max(2, (callerAudioData[i] / 255) * height * 0.92);
      ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
      x += barWidth;
    }
  }, [callerAudioData]);

  // Render Gemini Output Waveform on Canvas with Neon Violet Glow
  useEffect(() => {
    const canvas = geminiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Neon Violet/Purple Gradient styling
    const gradient = ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, '#6d28d9');
    gradient.addColorStop(0.5, '#8b5cf6');
    gradient.addColorStop(1, '#c084fc');

    ctx.fillStyle = gradient;
    ctx.shadowColor = '#8b5cf6';
    ctx.shadowBlur = 4;

    const barWidth = (width / geminiAudioData.length) * 1.5;
    let x = 0;

    for (let i = 0; i < geminiAudioData.length; i++) {
      const barHeight = Math.max(2, (geminiAudioData[i] / 255) * height * 0.92);
      ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
      x += barWidth;
    }
  }, [geminiAudioData]);

  // Stress score color mapping
  const getStressColor = (score: number) => {
    if (score >= 80) return 'text-rose-500 stroke-rose-500';
    if (score >= 60) return 'text-amber-500 stroke-amber-500';
    if (score >= 35) return 'text-yellow-400 stroke-yellow-400';
    return 'text-emerald-400 stroke-emerald-400';
  };

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
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (prosody.stressScore / 100) * circumference;

  return (
    <div className="h-full flex flex-col gap-4 p-5 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-xl overflow-y-auto">
      {/* Zone Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Zone 1: Vocal Prosody & Acoustics
            </h2>
            <p className="text-[11px] text-slate-400">
              Live Acoustic Agitation & Dual Waveform Telemetry
            </p>
          </div>
        </div>
      </div>

      {/* Large Clean Vocal Stress Gauge */}
      <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800/80 flex items-center justify-between relative overflow-hidden shadow-lg">
        <div className="space-y-1.5 z-10">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            Vocal Stress & Panic Index
          </div>
          <div className="text-3xl font-black font-mono tracking-tight flex items-baseline gap-2">
            <span className={getStressColor(prosody.stressScore).split(' ')[0]}>
              {prosody.stressScore}%
            </span>
            <span className="text-xs text-slate-400 font-sans font-semibold uppercase tracking-wider">
              {prosody.stressScore >= 80 ? 'Critical Panic' : prosody.stressScore >= 50 ? 'Elevated Distress' : 'Baseline Resting'}
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-[210px] leading-relaxed">
            Derived in real-time from fundamental frequency F0 jitter, harmonic shimmer, and RMS energy.
          </p>
        </div>

        {/* Circular SVG Gauge */}
        <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 110 110">
            {/* Background circle */}
            <circle
              cx="55"
              cy="55"
              r={radius}
              className="stroke-slate-800/80 fill-none"
              strokeWidth="9"
            />
            {/* Value circle */}
            <circle
              cx="55"
              cy="55"
              r={radius}
              className={`fill-none transition-all duration-700 ease-out ${getStressColor(prosody.stressScore).split(' ')[1]}`}
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-base font-mono font-extrabold text-white">{prosody.stressScore}%</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Stress</span>
          </div>
        </div>
      </div>

      {/* Acoustic Parameters Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium">Pitch Variance</div>
          <div className="text-sm font-mono font-bold text-cyan-300 mt-0.5">
            {prosody.pitchVarianceHz} <span className="text-[10px] font-sans text-slate-500">Hz</span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium">Speaking Rate</div>
          <div className="text-sm font-mono font-bold text-amber-300 mt-0.5">
            {prosody.speechRateWpm} <span className="text-[10px] font-sans text-slate-500">WPM</span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium">Signal SNR</div>
          <div className="text-sm font-mono font-bold text-emerald-300 mt-0.5">
            {prosody.snrDb} <span className="text-[10px] font-sans text-slate-500">dB</span>
          </div>
        </div>
      </div>

      {/* Dual Waveform Visualizers (Caller in Neon Cyan, AI Copilot in Neon Violet) */}
      <div className="space-y-3">
        {/* Caller Voice Waveform */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <Mic className="w-3.5 h-3.5 text-cyan-400" />
              <span>Caller Microphone Stream</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">16kHz Input</span>
          </div>
          <div className="h-14 w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center relative shadow-inner">
            <canvas
              ref={callerCanvasRef}
              width={280}
              height={56}
              className="w-full h-full block"
            />
          </div>
        </div>

        {/* AI Copilot Voice Waveform */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <Volume2 className="w-3.5 h-3.5 text-purple-400" />
              <span>108 Copilot Audio Output</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">24kHz Native</span>
          </div>
          <div className="h-14 w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center relative shadow-inner">
            <canvas
              ref={geminiCanvasRef}
              width={280}
              height={56}
              className="w-full h-full block"
            />
          </div>
        </div>
      </div>

      {/* Paralinguistic & Acoustic Tags */}
      <div className="space-y-2 mt-auto">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <WaveformIcon className="w-3.5 h-3.5 text-cyan-400" />
          Detected Acoustic Signatures
        </div>
        <div className="flex flex-wrap gap-1.5">
          {prosody.detectedTags.map((tag) => (
            <div
              key={tag.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                tag.severity === 'critical'
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-sm shadow-rose-500/20'
                  : tag.severity === 'warning'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm shadow-amber-500/20'
                  : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
              }`}
            >
              {getTagIcon(tag.id)}
              <span>{tag.label}</span>
              <span className="text-[10px] font-mono opacity-70">
                {Math.round(tag.confidence * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
