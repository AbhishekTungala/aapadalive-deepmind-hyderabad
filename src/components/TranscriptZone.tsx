import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Mic,
  Crosshair
} from 'lucide-react';
import type { TranscriptEntry } from '../types';

interface TranscriptZoneProps {
  transcript: TranscriptEntry[];
  activeLandmark?: string;
}

interface MapZone {
  id: string;
  name: string;
  points: string;
  center: [number, number];
  color: string;
}

const HYDERABAD_ZONES: MapZone[] = [
  {
    id: 'SECUNDERABAD',
    name: 'Secunderabad',
    points: '380,40 470,50 490,110 430,130 370,90',
    center: [430, 80],
    color: '#06b6d4'
  },
  {
    id: 'BEGUMPET',
    name: 'Begumpet',
    points: '260,60 360,70 380,120 310,140 250,110',
    center: [310, 100],
    color: '#2dd4bf'
  },
  {
    id: 'BANJARA_HILLS',
    name: 'Banjara Hills',
    points: '230,130 330,130 340,190 260,200 210,160',
    center: [270, 160],
    color: '#10b981'
  },
  {
    id: 'HITEC_CITY',
    name: 'Hitec City',
    points: '120,110 210,120 220,180 150,190 100,150',
    center: [160, 150],
    color: '#38bdf8'
  },
  {
    id: 'GACHIBOWLI',
    name: 'Gachibowli',
    points: '70,180 160,180 170,250 100,260 50,220',
    center: [110, 220],
    color: '#06b6d4'
  },
  {
    id: 'CHARMINAR',
    name: 'Charminar',
    points: '290,190 390,200 410,270 330,280 270,240',
    center: [340, 240],
    color: '#f59e0b'
  }
];

export const TranscriptZone: React.FC<TranscriptZoneProps> = ({
  transcript,
  activeLandmark = ''
}) => {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const streamEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll stream as real words are spoken
  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Determine which zone to highlight based on real spoken landmark
  const currentHighlightedZone = React.useMemo(() => {
    if (selectedZone) return selectedZone;
    if (!activeLandmark || activeLandmark.includes('Awaiting')) return null;

    const lower = activeLandmark.toLowerCase();
    for (const zone of HYDERABAD_ZONES) {
      if (lower.includes(zone.name.toLowerCase()) || lower.includes(zone.id.toLowerCase())) {
        return zone.id;
      }
    }
    return null;
  }, [activeLandmark, selectedZone]);

  return (
    <div className="h-full flex flex-col gap-3.5 p-4 rounded-xl bg-[#111e2e]/90 backdrop-blur-2xl border border-[#1e3a5f]/70 shadow-[0_8px_32px_0_rgba(10,19,31,0.6)]">
      {/* ========================================================================= */}
      {/* TOP HALF: Dark Vector Tactical Map of Hyderabad (Interactive SVG Grid)   */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between border-b border-[#1e3a5f]/40 pb-2">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-mono font-bold text-white tracking-wide uppercase">
              Interactive Hyderabad City Operations Map
            </h2>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#22d3ee]" />
              <span>ORR / RADIAL CORRIDORS</span>
            </span>
            <span className="text-slate-500">17°23'N 78°28'E</span>
          </div>
        </div>

        {/* SVG Tactical Map Canvas */}
        <div className="relative h-64 w-full rounded-xl bg-[#080f1a] border border-[#1e3a5f]/60 overflow-hidden shadow-inner flex items-center justify-center">
          <svg
            viewBox="0 0 540 310"
            className="w-full h-full object-cover select-none"
          >
            <defs>
              {/* Tactical map background grid pattern */}
              <pattern id="tacticalGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e3a5f" strokeWidth="0.5" strokeOpacity="0.4" />
                <circle cx="0" cy="0" r="1" fill="#06b6d4" fillOpacity="0.4" />
              </pattern>

              {/* Radial gradient for highlighted beacon */}
              <radialGradient id="beaconGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Grid Backdrop */}
            <rect width="100%" height="100%" fill="url(#tacticalGrid)" />

            {/* Interconnected Cyan Emergency Route Corridors */}
            <g stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6">
              <line x1="110" y1="220" x2="160" y2="150" />
              <line x1="160" y1="150" x2="270" y2="160" />
              <line x1="270" y1="160" x2="310" y2="100" />
              <line x1="310" y1="100" x2="430" y2="80" />
              <line x1="270" y1="160" x2="340" y2="240" />
              <line x1="110" y1="220" x2="340" y2="240" strokeOpacity="0.4" />
              <line x1="430" y1="80" x2="340" y2="240" strokeOpacity="0.3" />
            </g>

            {/* Tactical Zone Polygons */}
            {HYDERABAD_ZONES.map((zone) => {
              const isZoneActive = currentHighlightedZone === zone.id;
              return (
                <g
                  key={zone.id}
                  onClick={() => setSelectedZone(zone.id === selectedZone ? null : zone.id)}
                  className="cursor-pointer transition-all duration-300"
                >
                  <polygon
                    points={zone.points}
                    fill={isZoneActive ? 'rgba(6, 182, 212, 0.25)' : 'rgba(17, 30, 46, 0.55)'}
                    stroke={isZoneActive ? '#22d3ee' : '#1e3a5f'}
                    strokeWidth={isZoneActive ? '2.5' : '1'}
                    className="transition-all hover:stroke-cyan-400 hover:fill-cyan-950/40"
                    style={{
                      filter: isZoneActive ? 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.5))' : 'none'
                    }}
                  />

                  {/* Zone Label */}
                  <text
                    x={zone.center[0]}
                    y={zone.center[1]}
                    fill={isZoneActive ? '#ffffff' : '#94a3b8'}
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight={isZoneActive ? 'bold' : 'normal'}
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {zone.name.toUpperCase()}
                  </text>

                  {/* Pulsing Pin Beacon when active */}
                  {isZoneActive && (
                    <g transform={`translate(${zone.center[0]}, ${zone.center[1] - 14})`}>
                      <circle cx="0" cy="0" r="16" fill="url(#beaconGlow)" className="animate-ping" />
                      <circle cx="0" cy="0" r="5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Map Overlay HUD Pill */}
          <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-[#0a131f]/90 border border-[#1e3a5f] text-[10px] font-mono text-cyan-300 flex items-center gap-1.5 shadow-md">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>
              {currentHighlightedZone
                ? `FOCUSED SECTOR: ${currentHighlightedZone}`
                : 'CITY SECTOR TELEMETRY READY'}
            </span>
          </div>

          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-[#0a131f]/80 border border-[#1e3a5f]/50 text-[9px] font-mono text-slate-400">
            Click Sector to Filter Routing
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM HALF: Live Real-Time Voice Stream & Bilingual Translation         */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col gap-2 min-h-[220px]">
        <div className="flex items-center justify-between border-b border-[#1e3a5f]/40 pb-2">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-mono font-bold text-white tracking-wide uppercase">
              Live Real-Time Voice Stream & Bilingual Translation
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            MIC 16kHz PCM • ZERO FAKE FALLBACK
          </span>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[260px]">
          {transcript.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-[#0a131f]/60 rounded-xl border border-[#1e3a5f]/40">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-mono font-bold text-cyan-300 tracking-wider">
                  108 DISPATCH LINE SECURED // LISTENING ON 16kHz PCM
                </div>
                <p className="text-xs text-slate-400 max-w-md">
                  Awaiting caller voice stream. Click <strong>"Start Live 108 Call"</strong> above and speak in Telugu, Hindi, Urdu, or English. Spoken words will transcribe and translate here in real time.
                </p>
              </div>
            </div>
          ) : (
            transcript.map((entry) => (
              <div
                key={entry.id}
                className={`p-3 rounded-xl border transition-all ${
                  entry.speaker === 'CALLER'
                    ? 'bg-[#0a131f]/90 border-cyan-500/30 shadow-[0_4px_20px_rgba(6,182,212,0.1)]'
                    : 'bg-[#0a131f]/90 border-purple-500/30 shadow-[0_4px_20px_rgba(168,85,247,0.1)]'
                }`}
              >
                {/* Message Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      entry.speaker === 'CALLER' ? 'bg-cyan-400 animate-pulse' : 'bg-purple-400'
                    }`} />
                    <span className="text-xs font-bold text-white font-mono">
                      {entry.speaker === 'CALLER' ? 'CALLER (LIVE MIC)' : '108 COPILOT (GEMINI)'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-black/40">
                      {entry.originalLanguage.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    {entry.timestamp}
                  </span>
                </div>

                {/* Original Spoken Text */}
                <div className="text-xs text-slate-200 font-medium leading-relaxed">
                  {entry.originalText}
                </div>

                {/* Inset English Operator Translation Bridge */}
                {entry.translatedText && entry.translatedText !== entry.originalText && (
                  <div className="mt-2 pl-3 py-1.5 border-l-2 border-cyan-400 bg-cyan-950/20 text-cyan-200 text-xs rounded-r-lg font-mono">
                    <span className="text-[9px] uppercase tracking-wider text-cyan-400 block mb-0.5">
                      ENGLISH OPERATOR TRANSLATION:
                    </span>
                    {entry.translatedText}
                  </div>
                )}

                {/* Extracted Entity Chips */}
                {entry.entities && entry.entities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 pt-1 border-t border-white/[0.06]">
                    {entry.entities.map((ent, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          ent.type === 'LANDMARK'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : ent.type === 'VEHICLE_NO'
                            ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                            : 'bg-rose-500/10 text-rose-300 border-rose-500/30 animate-pulse'
                        }`}
                      >
                        {ent.type}: {ent.text}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={streamEndRef} />
        </div>
      </div>
    </div>
  );
};
