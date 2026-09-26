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

  // Render Caller Waveform on Canvas
  useEffect(() => {
    const canvas = callerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Gradient styling
    const gradient = ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, '#06b6d4');
    gradient.addColorStop(0.7, '#38bdf8');
    gradient.addColorStop(1, '#f43f5e');

    ctx.fillStyle = gradient;
    const barWidth = (width / callerAudioData.length) * 1.5;
    let x = 0;

    for (let i = 0; i < callerAudioData.length; i++) {
      const barHeight = (callerAudioData[i] / 255) * height * 0.9;
      ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
      x += barWidth;
    }
  }, [callerAudioData]);

  // Render Gemini Output Waveform on Canvas
  useEffect(() => {
    const canvas = geminiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, '#10b981');
    gradient.addColorStop(0.7, '#34d399');
    gradient.addColorStop(1, '#06b6d4');

    ctx.fillStyle = gradient;
    const barWidth = (width / geminiAudioData.length) * 1.5;
    let x = 0;

    for (let i = 0; i < geminiAudioData.length; i++) {
      const barHeight = (geminiAudioData[i] / 255) * height * 0.9;
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
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (prosody.stressScore / 100) * circumference;

  return (
    <div className="h-full flex flex-col gap-4 p-4 command-card rounded-2xl overflow-y-auto">
      {/* Zone Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Zone 1: Vocal Prosody & Acoustics
            </h2>
            <p className="text-[11px] text-slate-400">
              Raw Audio Prosody Analysis & Dual Stream Visualizer
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-900 border border-slate-700 text-cyan-400">
          PCM Realtime
        </span>
      </div>

      {/* Stress & Panic Score Radial Gauge Card */}
      <div className="p-4 rounded-xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800/80 flex items-center justify-between relative overflow-hidden">
        <div className="space-y-1 z-10">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            Vocal Stress & Panic Score
          </div>
          <div className="text-2xl font-black font-mono tracking-tight flex items-baseline gap-1">
            <span className={getStressColor(prosody.stressScore).split(' ')[0]}>
              {prosody.stressScore}%
            </span>
            <span className="text-xs text-slate-500 font-sans font-normal">
              {prosody.stressScore >= 80 ? 'CRITICAL CRISIS' : prosody.stressScore >= 50 ? 'ELEVATED STRESS' : 'CALM'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 max-w-[210px] leading-tight">
            Calculated from fundamental frequency jitter, harmonic shimmer & speech rate.
          </p>
        </div>

        {/* Circular SVG Gauge */}
        <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className="stroke-slate-800 fill-none"
              strokeWidth="9"
            />
            {/* Value circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              className={`fill-none transition-all duration-700 ease-out ${getStressColor(prosody.stressScore).split(' ')[1]}`}
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs font-mono font-bold text-white">{prosody.stressScore}%</span>
            <span className="text-[9px] text-slate-400 uppercase">Panic</span>
          </div>
        </div>
      </div>

      {/* Acoustic Parameters Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 font-medium">Pitch Variance</div>
          <div className="text-sm font-mono font-bold text-cyan-300 mt-0.5">
            {prosody.pitchVarianceHz} <span className="text-[10px] font-sans text-slate-500">Hz</span>
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 font-medium">Speech Rate</div>
          <div className="text-sm font-mono font-bold text-amber-300 mt-0.5">
            {prosody.speechRateWpm} <span className="text-[10px] font-sans text-slate-500">WPM</span>
          </div>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="text-[10px] text-slate-400 font-medium">Signal SNR</div>
          <div className="text-sm font-mono font-bold text-emerald-300 mt-0.5">
            {prosody.snrDb} <span className="text-[10px] font-sans text-slate-500">dB</span>
          </div>
        </div>
      </div>

      {/* Dual Waveform Visualizers */}
      <div className="space-y-3">
        {/* Caller 16kHz Waveform */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
              <Mic className="w-3.5 h-3.5" />
              <span>Caller Microphone In</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/50 text-cyan-300">
              16kHz Mono PCM
            </span>
          </div>
          <div className="h-14 w-full bg-[#05080f] rounded-lg overflow-hidden border border-slate-800/60 flex items-center justify-center relative">
            <canvas
              ref={callerCanvasRef}
              width={260}
              height={56}
              className="w-full h-full block"
            />
          </div>
        </div>

        {/* Gemini 24kHz Waveform */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <Volume2 className="w-3.5 h-3.5" />
              <span>Gemini Copilot Out</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/50 text-emerald-300">
              24kHz Mono PCM
            </span>
          </div>
          <div className="h-14 w-full bg-[#05080f] rounded-lg overflow-hidden border border-slate-800/60 flex items-center justify-center relative">
            <canvas
              ref={geminiCanvasRef}
              width={260}
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
          Detected Acoustic Tags (gemini-3.8-live)
        </div>
        <div className="flex flex-wrap gap-1.5">
          {prosody.detectedTags.map((tag) => (
            <div
              key={tag.id}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
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
