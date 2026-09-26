import React, { useState } from 'react';
import {
  Sparkles,
  MapPin,
  Volume2,
  Send,
  CheckCircle2,
  Radio,
  Flame,
  Globe2,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { TriageTicket, TTSPreset, AcousticProsodyMetrics, SystemTelemetry } from '../types';
import { TTS_ACTION_PRESETS } from '../services/geminiAudioStack';

interface TriageZoneProps {
  ticket: TriageTicket;
  prosody: AcousticProsodyMetrics;
  telemetry: SystemTelemetry;
  detectedLanguage?: string;
  onDispatchTicket: () => void;
  onTriggerTTS: (preset: TTSPreset) => void;
}

export const TriageZone: React.FC<TriageZoneProps> = ({
  ticket,
  prosody,
  telemetry,
  detectedLanguage = 'Telugu + English (Code-Switched)',
  onDispatchTicket,
  onTriggerTTS,
}) => {
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Compute Vocal Emotion & Tone from real-time mic prosody
  const getVocalEmotion = () => {
    if (telemetry.connectionStatus !== 'CONNECTED') {
      return { label: 'Line Standby / Ambient Silence', color: 'text-slate-400', badge: 'bg-slate-800 text-slate-400' };
    }
    if (prosody.stressScore >= 75) {
      return { label: 'Panicked / Agonal Shaky (Critical Stress)', color: 'text-rose-400 font-bold', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' };
    }
    if (prosody.stressScore >= 45) {
      return { label: 'Urgent / Elevated Pitch (High Stress)', color: 'text-amber-400 font-bold', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    }
    return { label: 'Calm / Steady Baseline (Conversational)', color: 'text-teal-400 font-bold', badge: 'bg-teal-500/20 text-teal-300 border-teal-500/40' };
  };

  // Determine current Turn-Taking Floor Holder
  const getFloorHolder = () => {
    if (telemetry.connectionStatus !== 'CONNECTED') return 'Line Standby';
    if (telemetry.bargeInActive) return 'Caller Interrupted (Barge-In Active)';
    if (telemetry.interactionStatus === 'IN_PROGRESS') return 'AI Copilot (Speaking 24kHz)';
    if (telemetry.audioInputLevel > 10) return 'Caller (Speaking 16kHz)';
    return 'Floor Open // Listening';
  };

  const emotion = getVocalEmotion();
  const floorHolder = getFloorHolder();

  const handleDispatch = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 75,
        origin: { y: 0.8 },
        colors: ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
      });
    } catch (e) {}

    onDispatchTicket();
  };

  const handleTTSClick = (preset: TTSPreset) => {
    setActivePresetId(preset.id);
    onTriggerTTS(preset);
    setTimeout(() => setActivePresetId(null), 2500);
  };

  return (
    <div className="h-full flex flex-col gap-3.5">
      {/* ========================================================================= */}
      {/* CARD 1: Multi-Speaker Audio -> Structured Action (gemini-3.5-transcribe) */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-xl bg-[#111e2e]/90 backdrop-blur-2xl border border-[#1e3a5f]/70 shadow-[0_8px_32px_0_rgba(10,19,31,0.6)] flex flex-col gap-3">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-[#1e3a5f]/40 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-mono font-bold text-white tracking-wide uppercase">
              Audio ➔ Structured Action (Gemini 3.5)
            </h2>
          </div>
          <span className="text-[10px] font-mono text-cyan-300">
            AUDIO-FIRST
          </span>
        </div>

        {/* 4 Voice-Derived Structured Action Fields */}
        <div className="space-y-2 font-mono text-xs">
          {/* Field 1: Detected Vocal Emotion & Tone */}
          <div className="p-2.5 rounded-lg bg-[#0a131f]/80 border border-[#1e3a5f]/50 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[10px] flex items-center gap-1.5 uppercase">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                Vocal Emotion & Tone
              </span>
              <span className={`px-2 py-0.5 rounded text-[9px] border ${emotion.badge}`}>
                {prosody.stressScore}% STRESS
              </span>
            </div>
            <div className={`text-xs mt-0.5 ${emotion.color}`}>
              {emotion.label}
            </div>
          </div>

          {/* Field 2: Detected Language & Code-Switching */}
          <div className="p-2.5 rounded-lg bg-[#0a131f]/80 border border-[#1e3a5f]/50 flex flex-col gap-1">
            <span className="text-slate-400 text-[10px] flex items-center gap-1.5 uppercase">
              <Globe2 className="w-3.5 h-3.5 text-teal-400" />
              Detected Language & Code-Switching
            </span>
            <div className="text-xs font-bold text-teal-300">
              {detectedLanguage}
            </div>
          </div>

          {/* Field 3: Spoken Location (Synced to Google Map) */}
          <div className="p-2.5 rounded-lg bg-[#0a131f]/80 border border-[#1e3a5f]/50 flex flex-col gap-1">
            <span className="text-slate-400 text-[10px] flex items-center gap-1.5 uppercase">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              Spoken Location (Synced to Map)
            </span>
            <div className="text-xs font-bold text-cyan-300 truncate">
              {ticket.landmark}
            </div>
          </div>

          {/* Field 4: Structured Action Triggered */}
          <div className="p-2.5 rounded-lg bg-[#0a131f]/80 border border-emerald-500/30 flex flex-col gap-1 shadow-sm">
            <span className="text-emerald-400 text-[10px] flex items-center gap-1.5 uppercase font-bold">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              Structured Action Triggered
            </span>
            <div className="text-xs font-bold text-white leading-snug">
              {ticket.category !== 'AWAITING_STREAM'
                ? `[AUTO-DISPATCH] Routing 108 ALS Unit for ${ticket.categoryLabel}`
                : 'Awaiting voice command or incident report from caller...'}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CARD 2: Mid-Sentence Interruption & Expressive TTS (gemini-3.8-flash-tts) */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-xl bg-[#111e2e]/90 backdrop-blur-2xl border border-[#1e3a5f]/70 shadow-[0_8px_32px_0_rgba(10,19,31,0.6)] flex flex-col gap-3 flex-1 justify-between">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-[#1e3a5f]/40 pb-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-mono font-bold text-white tracking-wide uppercase">
              Barge-In & Expressive TTS
            </h3>
          </div>
          <span className="text-[10px] font-mono text-purple-300">
            0ms LATENCY
          </span>
        </div>

        {/* Live Barge-In & Turn-Taking Monitor */}
        <div className="space-y-2 font-mono">
          <div className="p-2.5 rounded-lg bg-[#0a131f]/90 border border-purple-500/30 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[10px] uppercase">Turn Floor Holder:</span>
              <span className={`font-bold text-xs ${
                telemetry.bargeInActive ? 'text-amber-400 animate-bounce' : 'text-purple-300'
              }`}>
                {floorHolder}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-white/[0.06]">
              <span className="text-slate-400 text-[10px] uppercase">Interruption Latency:</span>
              <span className="font-bold text-emerald-400">0ms Buffer Flush</span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-white/[0.06]">
              <span className="text-slate-400 text-[10px] uppercase">Barge-Ins Detected:</span>
              <span className="font-bold text-amber-300">{telemetry.bargeInCount} events</span>
            </div>
          </div>
        </div>

        {/* 4 Expressive Voice Responses (gemini-3.8-flash-tts) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
            <span className="flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-cyan-400" />
              <span>Expressive Voice Responses</span>
            </span>
            <span className="text-slate-500">FLASH-TTS</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {TTS_ACTION_PRESETS.map((preset) => {
              const isPlaying = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleTTSClick(preset)}
                  className={`p-2 rounded-lg border text-left transition-all text-xs cursor-pointer ${
                    isPlaying
                      ? 'bg-purple-500/25 border-purple-400 text-purple-100 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                      : 'bg-[#0a131f]/80 border-[#1e3a5f]/50 hover:bg-[#16273c] text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9px] font-mono font-bold text-purple-400 uppercase">
                      {preset.language.split(' ')[0]}
                    </span>
                    <span className="text-[8px] font-mono text-slate-400">{preset.voice}</span>
                  </div>
                  <div className="font-bold text-white text-[11px] leading-tight truncate">
                    {preset.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleDispatch}
          className={`w-full py-3 px-4 rounded-xl font-mono font-black text-xs tracking-wider uppercase transition-all shadow-[0_0_25px_rgba(225,29,72,0.4)] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer mt-1 ${
            ticket.dispatchStatus === 'DISPATCHED'
              ? 'bg-emerald-600 text-white shadow-emerald-600/30 border border-emerald-400/50'
              : 'bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white border border-rose-400/40 animate-pulse'
          }`}
        >
          {ticket.dispatchStatus === 'DISPATCHED' ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>108 DISPATCH AUTHORIZED // EN ROUTE</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4 text-white" />
              <span>AUTHORIZE 108 AMBULANCE DISPATCH</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
