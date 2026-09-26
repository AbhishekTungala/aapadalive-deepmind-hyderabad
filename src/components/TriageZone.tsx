import React, { useState } from 'react';
import {
  FileText,
  AlertOctagon,
  MapPin,
  HeartPulse,
  Truck,
  Send,
  Volume2,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { TriageTicket, TTSPreset } from '../types';
import { TTS_ACTION_PRESETS } from '../services/geminiAudioStack';

interface TriageZoneProps {
  ticket: TriageTicket;
  onDispatchTicket: () => void;
  onTriggerTTS: (preset: TTSPreset) => void;
}

export const TriageZone: React.FC<TriageZoneProps> = ({
  ticket,
  onDispatchTicket,
  onTriggerTTS,
}) => {
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/50 text-xs font-black tracking-wider flex items-center gap-1.5 animate-pulse">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            CODE RED (CRITICAL)
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/50 text-xs font-bold tracking-wider flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
            CODE YELLOW (HIGH)
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 text-xs font-bold tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            CODE GREEN (MODERATE)
          </span>
        );
    }
  };

  const handleDispatch = () => {
    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#06b6d4', '#10b981', '#f59e0b', '#ef4444']
      });
    } catch (e) {}

    onDispatchTicket();
  };

  const handleTTSClick = (preset: TTSPreset) => {
    setActivePresetId(preset.id);
    onTriggerTTS(preset);
    setTimeout(() => setActivePresetId(null), 2000);
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4 command-card rounded-2xl overflow-y-auto">
      {/* Zone Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Zone 3: Live Triage Ticket & Dispatch
            </h2>
            <p className="text-[11px] text-slate-400">
              Auto-Populated via <code className="text-cyan-400 font-mono">update_triage_dashboard</code> tool
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Ticket #{ticket.ticketId}
        </span>
      </div>

      {/* Auto-Populating Incident Triage Ticket */}
      <div className="p-4 rounded-xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 shadow-xl space-y-3.5 relative">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Incident Category
            </span>
            <div className="text-base font-extrabold text-white flex items-center gap-2 mt-0.5">
              <span>{ticket.categoryLabel || ticket.category}</span>
            </div>
          </div>
          {getSeverityBadge(ticket.severity)}
        </div>

        {/* Location & Landmark */}
        <div className="p-2.5 rounded-lg bg-[#070b13] border border-slate-800/80">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-cyan-300">
                {ticket.landmark}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {ticket.exactLocation}
              </div>
            </div>
          </div>
        </div>

        {/* Extracted Vitals & Clinical Conditions */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
            Extracted Patient Vitals & Trauma
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Consciousness:</span>
              <span className="font-semibold text-slate-200">
                {ticket.extractedVitals.consciousness}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Breathing:</span>
              <span className="font-semibold text-slate-200">
                {ticket.extractedVitals.breathing}
              </span>
            </div>
          </div>
          {ticket.extractedVitals.traumaNotes && (
            <div className="p-2 rounded-lg bg-rose-950/20 border border-rose-900/40 text-[11px] text-rose-200">
              <span className="font-bold text-rose-400">Clinical Alert: </span>
              {ticket.extractedVitals.traumaNotes}
            </div>
          )}
        </div>

        {/* Recommended Unit & Caller Identity */}
        <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider block">
                Recommended Response
              </span>
              <span className="text-xs font-bold text-white">
                {ticket.recommendedUnit.unitType}
              </span>
              <span className="text-[10px] text-emerald-300/80 block">
                ID: {ticket.recommendedUnit.unitId} • ETA: {ticket.recommendedUnit.etaMinutes} mins
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Caller Phone</span>
            <span className="text-xs font-mono font-bold text-cyan-300">
              {ticket.callerIdentity?.phone || '+91 98490 12345'}
            </span>
          </div>
        </div>

        {/* Big Authorize Dispatch Action */}
        <button
          onClick={handleDispatch}
          className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
            ticket.dispatchStatus === 'DISPATCHED'
              ? 'bg-emerald-600 text-white shadow-emerald-600/30'
              : 'bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-rose-600/30 animate-pulse'
          }`}
        >
          {ticket.dispatchStatus === 'DISPATCHED' ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>DISPATCH CONFIRMED (SIREN ON)</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>AUTHORIZE 108 DISPATCH UNIT (ONE-CLICK)</span>
            </>
          )}
        </button>
      </div>

      {/* Zone 3 Bottom: One-Tap Dispatcher Voice Injection (gemini-3.8-flash-tts) */}
      <div className="space-y-2 mt-auto">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            One-Tap Dispatcher Voice Injection
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/40 text-cyan-300">
            gemini-3.8-flash-tts
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          Injects 3-part structured TTS (Cast, Direct Style, Verbatim Text) directly into the caller's audio stream.
        </p>

        <div className="grid grid-cols-2 gap-2">
          {TTS_ACTION_PRESETS.map((preset) => {
            const isPlaying = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleTTSClick(preset)}
                className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                  isPlaying
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                    {preset.language}
                  </span>
                  <Volume2 className={`w-3 h-3 ${isPlaying ? 'text-cyan-400 animate-spin' : 'text-slate-500 group-hover:text-cyan-400'}`} />
                </div>
                <div className="text-xs font-bold text-white leading-snug">
                  {preset.label}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 line-clamp-1 italic font-mono">
                  {preset.text}
                </div>
                <div className="mt-1 text-[9px] text-slate-500">
                  Voice: <span className="text-slate-400 font-mono">{preset.voice}</span> • Style: <span className="text-slate-400">{preset.style.slice(0, 24)}...</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
