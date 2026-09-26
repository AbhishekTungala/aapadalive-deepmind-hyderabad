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
  ShieldCheck,
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
          <span className="px-3 py-1 rounded-xl bg-rose-500/25 text-rose-200 border border-rose-500/60 text-xs font-mono font-black tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            [PRIORITY ALPHA // CODE RED (CRITICAL)]
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-3 py-1 rounded-xl bg-amber-500/25 text-amber-200 border border-amber-500/60 text-xs font-mono font-bold tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <AlertOctagon className="w-4 h-4 text-amber-400" />
            [PRIORITY BRAVO // CODE YELLOW (HIGH)]
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 text-xs font-mono font-bold tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            [PRIORITY CHARLIE // CODE GREEN (MODERATE)]
          </span>
        );
    }
  };

  const handleDispatch = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 75,
        origin: { y: 0.8 },
        colors: ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6']
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
    <div className="h-full flex flex-col gap-4 p-4 lg:p-5 bg-gradient-to-b from-slate-900/70 via-slate-900/40 to-slate-950/80 backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] rounded-2xl ring-1 ring-white/[0.04] overflow-y-auto">
      {/* Zone Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Zone 3: Triage Ticket & Dispatch Action Console
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              REAL-TIME DISPATCH MATRIX & RESOURCE ROUTING
            </p>
          </div>
        </div>
        {isStandby ? (
          <span className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-white/[0.1] text-slate-400 text-[10px] font-mono tracking-wider">
            STATUS: DISPATCH STANDBY
          </span>
        ) : (
          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-slate-950 border border-white/[0.1] text-cyan-300 font-bold">
            #{ticket.ticketId}
          </span>
        )}
      </div>

      {isStandby ? (
        /* Tactical Standby State */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 bg-[#080d17]/80 rounded-2xl border border-white/[0.06] shadow-inner">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.15)]">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h3 className="text-xs font-mono font-bold text-emerald-300 tracking-widest uppercase">
              108 TELEMETRY STANDBY // AWAITING CALL OR TRIGGER
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Waiting for live incoming audio or test bench scenario activation. Extracted patient vitals, GPS landmark triangulation, and ALS emergency ambulance dispatch will automatically populate here.
            </p>
          </div>
          <div className="pt-2 flex items-center gap-2 text-xs font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
            <span>HYD-108 FLEET READY • ALS / BLS / HAZMAT STANDBY</span>
          </div>
        </div>
      ) : (
        /* Active Incident Triage Ticket & Modular Matrix */
        <div className="space-y-3.5">
          {/* Emergency Priority Alpha Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-950/60 via-rose-900/30 to-red-950/60 border border-red-500/40 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.2)] flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono font-bold text-rose-300/80 uppercase tracking-widest block">
                CLASSIFICATION
              </span>
              <div className="text-base font-black text-white mt-0.5 tracking-tight">
                {ticket.categoryLabel || ticket.category}
              </div>
            </div>
            {getSeverityBadge(ticket.severity)}
          </div>

          {/* 2x2 Modular Data Matrix Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Tile 1: Landmark & Location */}
            <div className="p-3 rounded-xl bg-[#090d16]/90 border border-white/[0.06] flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  INCIDENT LOCATION
                </span>
                <div className="text-xs font-bold text-cyan-300 leading-snug">
                  {ticket.landmark}
                </div>
              </div>
              <div className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 leading-tight">
                {ticket.exactLocation}
              </div>
            </div>

            {/* Tile 2: Caller Contact & Vehicle */}
            <div className="p-3 rounded-xl bg-[#090d16]/90 border border-white/[0.06] flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  CALLER IDENTIFIERS
                </span>
                <div className="text-xs font-mono font-bold text-emerald-300">
                  {ticket.callerIdentity?.phone || '+91 98490 12345'}
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1.5 font-mono">
                <Car className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-amber-300 font-bold">{ticket.callerIdentity?.vehiclePlate || 'N/A'}</span>
              </div>
            </div>

            {/* Tile 3: Clinical Vitals Matrix */}
            <div className="col-span-2 p-3 rounded-xl bg-[#090d16]/90 border border-white/[0.06] space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                EXTRACTED CLINICAL VITALS
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-black/40 border border-white/[0.04]">
                  <span className="text-[10px] text-slate-500 font-mono block">Consciousness:</span>
                  <span className="font-semibold text-slate-200">
                    {ticket.extractedVitals.consciousness}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-black/40 border border-white/[0.04]">
                  <span className="text-[10px] text-slate-500 font-mono block">Breathing:</span>
                  <span className="font-semibold text-slate-200">
                    {ticket.extractedVitals.breathing}
                  </span>
                </div>
              </div>

              {ticket.extractedVitals.traumaNotes && (
                <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-900/50 text-xs text-rose-200 flex items-start gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-rose-400 font-mono">[CLINICAL TRAUMA ALERT] </span>
                    {ticket.extractedVitals.traumaNotes}
                  </div>
                </div>
              )}
            </div>

            {/* Tile 4: Recommended Unit */}
            <div className="col-span-2 p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shadow-md">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400 uppercase font-mono font-bold tracking-wider block">
                    RECOMMENDED DISPATCH ALLOCATION
                  </span>
                  <span className="text-xs font-bold text-white tracking-wide">
                    {ticket.recommendedUnit.unitType}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-300/80 mt-0.5">
                    <span>UNIT ID: {ticket.recommendedUnit.unitId}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-bold text-emerald-300">
                      <Clock className="w-3 h-3 text-emerald-400" />
                      ETA: {ticket.recommendedUnit.etaMinutes} MINS
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tactile High-Alert Dispatch CTA Button */}
          <button
            onClick={handleDispatch}
            className={`w-full py-3.5 px-4 rounded-xl font-mono font-black text-xs tracking-widest uppercase transition-all shadow-[0_0_30px_rgba(225,29,72,0.4)] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer ${
              ticket.dispatchStatus === 'DISPATCHED'
                ? 'bg-emerald-600 text-white shadow-emerald-600/30 border border-emerald-400/50'
                : 'bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white border border-rose-400/40 animate-pulse'
            }`}
          >
            {ticket.dispatchStatus === 'DISPATCHED' ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-white" />
                <span>108 DISPATCH AUTHORIZED // AMBULANCE EN ROUTE</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5 text-white" />
                <span>AUTHORIZE 108 AMBULANCE DISPATCH (ONE-TOUCH)</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 4 Quick-Response Voice Override Tiles */}
      <div className="space-y-2 mt-auto">
        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
          <span className="flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            OPERATOR VOICE INJECTION TILES
          </span>
          <span className="text-slate-500">VOICE PRESETS</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {TTS_ACTION_PRESETS.map((preset) => {
            const isPlaying = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleTTSClick(preset)}
                className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                  isPlaying
                    ? 'bg-cyan-500/25 border-cyan-400 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : 'bg-[#090d16]/80 border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.04] text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                    {preset.language.split(' ')[0]}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-mono text-slate-500 px-1 py-0.2 rounded bg-black/40">
                      {preset.voice}
                    </span>
                    <Volume2 className={`w-3 h-3 ${isPlaying ? 'text-cyan-300 animate-spin' : 'text-slate-500 group-hover:text-cyan-400'}`} />
                  </div>
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
