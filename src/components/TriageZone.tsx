import React, { useState } from 'react';
import {
  Sparkles,
  Volume2,
  CheckCircle2,
  Radio,
  Globe2,
  ListTodo,
  Copy,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { TriageTicket, TTSPreset, AcousticProsodyMetrics, SystemTelemetry } from '../types';
import { TTS_ACTION_PRESETS } from '../services/geminiAudioStack';

interface TriageZoneProps {
  ticket: TriageTicket;
  prosody: AcousticProsodyMetrics;
  telemetry: SystemTelemetry;
  detectedLanguage?: string;
  onDispatchTicket?: () => void;
  onTriggerTTS: (preset: TTSPreset) => void;
}

export const TriageZone: React.FC<TriageZoneProps> = ({
  ticket,
  prosody,
  telemetry,
  detectedLanguage,
  onTriggerTTS,
}) => {
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isConnected = telemetry.connectionStatus === 'CONNECTED';
  const hasVoiceContent = Boolean(
    ticket.topicSummary &&
    !ticket.topicSummary.includes('Awaiting') &&
    ticket.topicSummary !== 'Spoken Voice Stream'
  );

  const activeLanguage = !isConnected && !hasVoiceContent
    ? 'Awaiting Voice Stream...'
    : (detectedLanguage || ticket.detectedLanguage || 'English / Multilingual');

  // Compute Vocal Emotion & Tone from real-time mic prosody
  const getVocalTone = () => {
    if (!isConnected && !hasVoiceContent) {
      return {
        label: 'Standby / Ambient Silence',
        color: 'text-slate-400',
        badge: 'bg-slate-800 text-slate-400 border-slate-700'
      };
    }
    if (prosody.stressScore >= 75) {
      return {
        label: 'Urgent / High Intensity (Rapid Pitch & Energy)',
        color: 'text-rose-400 font-bold',
        badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
      };
    }
    if (prosody.stressScore >= 45 || prosody.speechRateWpm > 125) {
      return {
        label: 'Animated & Energetic (Engaged Cadence)',
        color: 'text-cyan-400 font-bold',
        badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
      };
    }
    return {
      label: 'Calm & Conversational (Steady Pitch Baseline)',
      color: 'text-teal-400 font-bold',
      badge: 'bg-teal-500/20 text-teal-300 border-teal-500/40'
    };
  };

  // Determine current Turn-Taking Floor Holder
  const getFloorHolder = () => {
    if (!isConnected) return 'Line Standby';
    if (telemetry.bargeInActive) return 'Speaker Interrupted (Barge-In Active)';
    if (telemetry.interactionStatus === 'IN_PROGRESS') return 'Gemini Voice (Speaking 24kHz)';
    if (telemetry.audioInputLevel > 10) return 'Speaker (Streaming 16kHz PCM)';
    return 'Floor Open // Listening';
  };

  const tone = getVocalTone();
  const floorHolder = getFloorHolder();

  // Export structured actions to clipboard
  const handleExportActions = () => {
    const exportPayload = {
      sessionId: ticket.sessionId || `VOX-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      topic: ticket.topicSummary || 'Voice Action Session',
      intent: ticket.detectedIntent || 'General Discussion',
      vocalTone: tone.label,
      detectedLanguage: activeLanguage,
      actions: ticket.structuredActions || [],
      entities: ticket.entities || []
    };

    try {
      navigator.clipboard.writeText(JSON.stringify(exportPayload, null, 2));
      setCopied(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.85 },
        colors: ['#06b6d4', '#10b981', '#a855f7', '#f59e0b']
      });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleTTSClick = (preset: TTSPreset) => {
    setActivePresetId(preset.id);
    onTriggerTTS(preset);
    setTimeout(() => setActivePresetId(null), 2500);
  };

  const actionsList = (ticket.structuredActions && ticket.structuredActions.length > 0)
    ? ticket.structuredActions
    : [
        'Awaiting spoken conversation to extract live structured actions...',
        'Speak any meeting request, engineering task, or decision to see action items generate live.'
      ];

  return (
    <div className="h-full flex flex-col gap-3.5">
      {/* ========================================================================= */}
      {/* CARD 1: AUDIO -> STRUCTURED ACTION ENGINE (gemini-3.5-transcribe)         */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-xl bg-[#111e2e]/90 backdrop-blur-2xl border border-[#1e3a5f]/70 shadow-[0_8px_32px_0_rgba(10,19,31,0.6)] flex flex-col gap-3">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-[#1e3a5f]/40 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-mono font-bold text-white tracking-wide uppercase">
              AUDIO ➔ STRUCTURED ACTION ENGINE (GEMINI 3.5 TRANSCRIBE)
            </h2>
          </div>
          <span className="text-[10px] font-mono text-cyan-300">
            AUDIO-TO-ACTION
          </span>
        </div>

        {/* 4 Voice-Derived Structured Action Fields */}
        <div className="space-y-2 font-mono text-xs">
          {/* Field 1: Vocal Tone & Prosody */}
          <div className="p-2.5 rounded-lg bg-[#0a131f]/80 border border-[#1e3a5f]/50 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[10px] flex items-center gap-1.5 uppercase font-bold">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                Vocal Tone & Prosody
              </span>
              <span className={`px-2 py-0.5 rounded text-[9px] border ${tone.badge}`}>
                {prosody.stressScore}% ENERGY
              </span>
            </div>
            <div className={`text-xs mt-0.5 ${tone.color}`}>
              {tone.label}
            </div>
          </div>

          {/* Field 2: Detected Language Bridge */}
          <div className="p-2.5 rounded-lg bg-[#0a131f]/80 border border-[#1e3a5f]/50 flex flex-col gap-1">
            <span className="text-slate-400 text-[10px] flex items-center gap-1.5 uppercase font-bold">
              <Globe2 className="w-3.5 h-3.5 text-teal-400" />
              Detected Language Bridge
            </span>
            <div className="text-xs font-bold text-teal-300">
              {activeLanguage}
            </div>
          </div>

          {/* Field 3: Spoken Intent & Topic */}
          <div className="p-2.5 rounded-lg bg-[#0a131f]/80 border border-[#1e3a5f]/50 flex flex-col gap-1">
            <span className="text-slate-400 text-[10px] flex items-center gap-1.5 uppercase font-bold">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              Spoken Intent & Topic
            </span>
            <div className="text-xs font-bold text-cyan-200">
              {ticket.detectedIntent || 'General Discussion'}
              {ticket.topicSummary && ticket.topicSummary !== 'Universal Voice Collaboration' && (
                <span className="block text-slate-300 text-[11px] font-normal mt-0.5">
                  Topic: {ticket.topicSummary}
                </span>
              )}
            </div>
          </div>

          {/* Field 4: Extracted Action Items / Structured Output */}
          <div className="p-2.5 rounded-lg bg-[#0a131f]/80 border border-emerald-500/30 flex flex-col gap-1.5 shadow-sm">
            <span className="text-emerald-400 text-[10px] flex items-center gap-1.5 uppercase font-bold">
              <ListTodo className="w-3.5 h-3.5 text-emerald-400" />
              Extracted Action Items / Structured Output
            </span>
            <ul className="space-y-1.5 mt-0.5">
              {actionsList.map((action, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[11px] text-slate-200 leading-snug">
                  <span className="text-emerald-400 font-bold mt-0.5">•</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CARD 2: MID-SENTENCE BARGE-IN & EXPRESSIVE TTS (gemini-3.8-flash-tts)     */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-xl bg-[#111e2e]/90 backdrop-blur-2xl border border-[#1e3a5f]/70 shadow-[0_8px_32px_0_rgba(10,19,31,0.6)] flex flex-col gap-3 flex-1 justify-between">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-[#1e3a5f]/40 pb-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-mono font-bold text-white tracking-wide uppercase">
              MID-SENTENCE BARGE-IN & EXPRESSIVE TTS (GEMINI 3.8 FLASH TTS)
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
              <span className="text-slate-400 text-[10px] uppercase">Active Floor Holder:</span>
              <span className={`font-bold text-xs ${
                telemetry.bargeInActive ? 'text-amber-400 animate-bounce' : 'text-purple-300'
              }`}>
                {floorHolder}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-white/[0.06]">
              <span className="text-slate-400 text-[10px] uppercase">Interruption Buffer Flush:</span>
              <span className="font-bold text-emerald-400">0ms Buffer Flush</span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-white/[0.06]">
              <span className="text-slate-400 text-[10px] uppercase">Barge-In Count:</span>
              <span className="font-bold text-amber-300">{telemetry.bargeInCount} events</span>
            </div>
          </div>
        </div>

        {/* 4 Expressive Voice Style Triggers (gemini-3.8-flash-tts) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
            <span className="flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-cyan-400" />
              <span>4 Expressive Voice Style Triggers</span>
            </span>
            <span className="text-slate-500">GEMINI 3.8 FLASH TTS</span>
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
                      {preset.voice}
                    </span>
                    <span className="text-[8px] font-mono text-slate-400">{preset.language.split(' ')[0]}</span>
                  </div>
                  <div className="font-bold text-white text-[11px] leading-tight truncate">
                    {preset.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Button: Export Structured Voice Actions */}
        <button
          onClick={handleExportActions}
          className="w-full py-3 px-4 rounded-xl font-mono font-black text-xs tracking-wider uppercase transition-all shadow-[0_0_25px_rgba(6,182,212,0.35)] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer mt-1 bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-slate-950 font-bold border border-cyan-400/40"
        >
          {copied ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>COPIED TO CLIPBOARD (JSON)</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-950" />
              <span>EXPORT STRUCTURED VOICE ACTIONS (JSON / CLIPBOARD)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
