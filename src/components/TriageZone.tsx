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
  Building2,
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

  const isStandby = ticket.ticketId === 'STANDBY-108' || ticket.categoryLabel.includes('Awaiting') || ticket.category === 'AWAITING_STREAM';

  const getSeverityBadge = (severity: string) => {
    if (isStandby) {
      return (
        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-mono tracking-wider">
          STANDBY // AWAITING CALL
        </span>
      );
    }
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/25 text-rose-200 border border-rose-500/60 text-[10px] font-mono font-bold tracking-wider flex items-center gap-1 shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse">
            <AlertOctagon className="w-3 h-3 text-rose-400" />
            CRITICAL ALPHA
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-orange-500/25 text-orange-200 border border-orange-500/60 text-[10px] font-mono font-bold tracking-wider flex items-center gap-1 shadow-[0_0_12px_rgba(249,115,22,0.3)]">
            <AlertOctagon className="w-3 h-3 text-orange-400" />
            HIGH BRAVO
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50 text-[10px] font-mono font-bold tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-amber-400" />
            MODERATE CHARLIE
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
      {/* CARD 1: Live Dispatch Triage Queue (Reference Bento Cockpit)             */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-xl bg-[#111e2e]/90 backdrop-blur-2xl border border-[#1e3a5f]/70 shadow-[0_8px_32px_0_rgba(10,19,31,0.6)] flex flex-col gap-3">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-[#1e3a5f]/40 pb-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-mono font-bold text-white tracking-wide uppercase">
              Live Dispatch Triage Queue
            </h2>
          </div>
          {getSeverityBadge(ticket.severity)}
        </div>

        {/* Real Extracted Incident Fields (Horizontal Pill Rows) */}
        <div className="space-y-2 font-mono text-xs">
          {/* Location Row */}
          <div className="p-2 rounded-lg bg-[#0a131f]/80 border border-[#1e3a5f]/50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-400 text-[11px] shrink-0">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Location:</span>
            </div>
            <div className="font-bold text-cyan-300 truncate text-right">
              {ticket.landmark}
            </div>
          </div>

          {/* Category / Symptom Row */}
          <div className="p-2 rounded-lg bg-[#0a131f]/80 border border-[#1e3a5f]/50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-400 text-[11px] shrink-0">
              <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
              <span>Category:</span>
            </div>
            <div className="font-bold text-rose-300 truncate text-right">
              {ticket.categoryLabel}
            </div>
          </div>

          {/* Caller Phone Row */}
          <div className="p-2 rounded-lg bg-[#0a131f]/80 border border-[#1e3a5f]/50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-400 text-[11px] shrink-0">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Caller Phone:</span>
            </div>
            <div className="font-bold text-emerald-300">
              {ticket.callerIdentity?.phone || 'Not Provided'}
            </div>
          </div>

          {/* Vehicle Plate Row */}
          <div className="p-2 rounded-lg bg-[#0a131f]/80 border border-[#1e3a5f]/50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-400 text-[11px] shrink-0">
              <Car className="w-3.5 h-3.5 text-amber-400" />
              <span>Vehicle Plate:</span>
            </div>
            <div className="font-bold text-amber-300">
              {ticket.callerIdentity?.vehiclePlate || 'None Reported'}
            </div>
          </div>
        </div>

        {/* 4 One-Tap TTS Voice Injection Chips */}
        <div className="pt-2 border-t border-[#1e3a5f]/30 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
            <span className="flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-cyan-400" />
              <span>One-Tap Operator Voice Chips</span>
            </span>
            <span className="text-slate-500">VOICE PRESETS</span>
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
                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-100 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      : 'bg-[#0a131f]/80 border-[#1e3a5f]/50 hover:bg-[#16273c] text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase">
                      {preset.language.split(' ')[0]}
                    </span>
                    <span className="text-[8px] font-mono text-slate-500">{preset.voice}</span>
                  </div>
                  <div className="font-bold text-white text-[11px] leading-tight truncate">
                    {preset.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CARD 2: Hospital Capacity & Route Feasibility (Reference Bento Cockpit)  */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-xl bg-[#111e2e]/90 backdrop-blur-2xl border border-[#1e3a5f]/70 shadow-[0_8px_32px_0_rgba(10,19,31,0.6)] flex flex-col gap-3 flex-1 justify-between">
        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-[#1e3a5f]/40 pb-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-mono font-bold text-white tracking-wide uppercase">
              Hospital Capacity & Route Feasibility
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-400">
            TRIAGE NETWORK
          </span>
        </div>

        {/* 3 Glowing Multi-Color Progress Bars for Hospital Load */}
        <div className="space-y-3 font-mono">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-300 font-bold">KIMS Secunderabad</span>
              <span className="text-emerald-400 font-bold">78% Available</span>
            </div>
            <div className="h-2 w-full bg-[#0a131f] rounded-full overflow-hidden border border-[#1e3a5f]/40">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_#10b981]"
                style={{ width: '78%' }}
              />
            </div>
            <span className="text-[9px] text-slate-400 mt-0.5 block">Trauma ICU 4 Beds • Distance: 3.2 km</span>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-300 font-bold">Apollo Jubilee Hills</span>
              <span className="text-amber-400 font-bold">64% Available</span>
            </div>
            <div className="h-2 w-full bg-[#0a131f] rounded-full overflow-hidden border border-[#1e3a5f]/40">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-400 shadow-[0_0_8px_#f59e0b]"
                style={{ width: '64%' }}
              />
            </div>
            <span className="text-[9px] text-slate-400 mt-0.5 block">Cardiac Cath Lab Active • Distance: 5.8 km</span>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-300 font-bold">Osmania General Hospital</span>
              <span className="text-cyan-400 font-bold">89% Available</span>
            </div>
            <div className="h-2 w-full bg-[#0a131f] rounded-full overflow-hidden border border-[#1e3a5f]/40">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 shadow-[0_0_8px_#06b6d4]"
                style={{ width: '89%' }}
              />
            </div>
            <span className="text-[9px] text-slate-400 mt-0.5 block">Major Trauma & Burn Center • Distance: 4.1 km</span>
          </div>
        </div>

        {/* Recommended Unit Summary */}
        <div className="p-2.5 rounded-lg bg-[#0a131f]/90 border border-emerald-500/30 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-emerald-300 font-bold">{ticket.recommendedUnit.unitType}</span>
              <span className="text-[10px] text-slate-400 block">Unit #{ticket.recommendedUnit.unitId} • ETA: {ticket.recommendedUnit.etaMinutes} mins</span>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
            READY
          </span>
        </div>

        {/* High-Alert Dispatch CTA Button */}
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
