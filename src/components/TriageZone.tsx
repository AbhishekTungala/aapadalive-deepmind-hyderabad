import React, { useState } from 'react';
import {
  FileText,
  AlertOctagon,
  MapPin,
  HeartPulse,
  Truck,
  Send,
  Volume2,
  CheckCircle2,
  ShieldAlert,
  Clock,
  Phone,
  Car
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

  const isStandby = ticket.ticketId === 'STANDBY-108' || ticket.categoryLabel === 'System Standby';

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="px-3 py-1 rounded-xl bg-rose-500/25 text-rose-200 border border-rose-500/60 text-xs font-black tracking-wider flex items-center gap-1.5 shadow-lg shadow-rose-500/20 animate-pulse">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            CODE RED (CRITICAL)
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-3 py-1 rounded-xl bg-amber-500/25 text-amber-200 border border-amber-500/60 text-xs font-bold tracking-wider flex items-center gap-1.5 shadow-lg shadow-amber-500/20">
            <AlertOctagon className="w-4 h-4 text-amber-400" />
            CODE YELLOW (HIGH)
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 text-xs font-bold tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            CODE GREEN (MODERATE)
          </span>
        );
    }
  };

  const handleDispatch = () => {
    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.8 },
        colors: ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899']
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
    <div className="h-full flex flex-col gap-4 p-5 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-xl overflow-y-auto">
      {/* Zone Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Zone 3: Triage Ticket & Dispatch Control
            </h2>
            <p className="text-[11px] text-slate-400">
              Automated Incident Triage & Emergency Unit Deployment
            </p>
          </div>
        </div>
        {!isStandby && (
          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-bold">
            #{ticket.ticketId}
          </span>
        )}
      </div>

      {isStandby ? (
        /* Clean Standby State */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3.5 bg-gradient-to-b from-slate-900/80 to-slate-950/80 rounded-2xl border border-slate-800/80">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h3 className="text-sm font-bold text-white tracking-wide">
              No Active Incident — Dispatch Standby
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ready for incoming 108 emergency calls. Clinical vitals, location landmarks, and recommended ambulance dispatch units will populate here in real-time.
            </p>
          </div>
          <div className="pt-2 flex items-center gap-2 text-xs font-medium text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>108 Hyderabad Central Dispatch Line Ready</span>
          </div>
        </div>
      ) : (
        /* Active Incident Triage Ticket */
        <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 shadow-xl space-y-4">
          {/* Prominent Incident Category & Severity Glassmorphism Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-rose-950/40 via-red-950/30 to-slate-900/50 border border-rose-500/30 flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Emergency Classification
              </span>
              <div className="text-base font-black text-white mt-0.5">
                {ticket.categoryLabel || ticket.category}
              </div>
            </div>
            {getSeverityBadge(ticket.severity)}
          </div>

          {/* 2-Column Grid: Location Landmark & Caller Identity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {/* Landmark & Exact Location */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-cyan-300">
                    {ticket.landmark}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {ticket.exactLocation}
                  </div>
                </div>
              </div>
            </div>

            {/* Caller Identity */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  Phone:
                </span>
                <span className="font-mono font-bold text-emerald-300">
                  {ticket.callerIdentity?.phone || 'Emergency Line'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1.5">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-amber-400" />
                  Vehicle:
                </span>
                <span className="font-mono font-bold text-amber-300">
                  {ticket.callerIdentity?.vehiclePlate || 'Not sighted'}
                </span>
              </div>
            </div>
          </div>

          {/* Extracted Clinical Vitals */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
              Extracted Patient Vitals & Trauma State
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-medium block">Consciousness:</span>
                <span className="font-semibold text-slate-100">
                  {ticket.extractedVitals.consciousness}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-medium block">Breathing:</span>
                <span className="font-semibold text-slate-100">
                  {ticket.extractedVitals.breathing}
                </span>
              </div>
            </div>

            {ticket.extractedVitals.traumaNotes && (
              <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-900/50 text-xs text-rose-200">
                <span className="font-bold text-rose-400">Clinical Alert: </span>
                {ticket.extractedVitals.traumaNotes}
              </div>
            )}
          </div>

          {/* Recommended Response Unit */}
          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider block">
                  Recommended Dispatch Unit
                </span>
                <span className="text-xs font-bold text-white">
                  {ticket.recommendedUnit.unitType}
                </span>
                <div className="flex items-center gap-2 text-[10px] text-emerald-300/80 mt-0.5">
                  <span>Unit: {ticket.recommendedUnit.unitId}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-400" />
                    ETA: {ticket.recommendedUnit.etaMinutes} mins
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Large Tactile Authorize Dispatch Button with Siren Pulse */}
          <button
            onClick={handleDispatch}
            className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-xs tracking-wider uppercase transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 ${
              ticket.dispatchStatus === 'DISPATCHED'
                ? 'bg-emerald-600 text-white shadow-emerald-600/30 border border-emerald-400/50'
                : 'bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-rose-600/30 border border-rose-400/40 animate-pulse'
            }`}
          >
            {ticket.dispatchStatus === 'DISPATCHED' ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-white" />
                <span>108 DISPATCH AUTHORIZED (UNITS EN ROUTE)</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5 text-white" />
                <span>AUTHORIZE 108 AMBULANCE DISPATCH</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Dispatcher Voice Overrides */}
      <div className="space-y-2.5 mt-auto">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
          One-Tap Dispatcher Voice Guidance
        </div>

        <div className="grid grid-cols-2 gap-2">
          {TTS_ACTION_PRESETS.map((preset) => {
            const isPlaying = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleTTSClick(preset)}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                  isPlaying
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                    {preset.language.split(' ')[0]}
                  </span>
                  <Volume2 className={`w-3.5 h-3.5 ${isPlaying ? 'text-cyan-400 animate-spin' : 'text-slate-500 group-hover:text-cyan-400'}`} />
                </div>
                <div className="text-xs font-bold text-white leading-snug">
                  {preset.label}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 line-clamp-1 italic font-mono">
                  {preset.text}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
