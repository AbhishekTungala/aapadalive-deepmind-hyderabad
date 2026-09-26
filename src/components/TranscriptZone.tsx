import React, { useEffect, useRef } from 'react';
import {
  Mic,
  MapPin,
  Radio,
  ExternalLink
} from 'lucide-react';
import type { TranscriptEntry } from '../types';

interface TranscriptZoneProps {
  transcript: TranscriptEntry[];
  activeLandmark?: string;
}

export const TranscriptZone: React.FC<TranscriptZoneProps> = ({
  transcript,
  activeLandmark = ''
}) => {
  const streamEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll stream as real words are spoken
  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const hasSpokenLocation = Boolean(
    activeLandmark &&
    !activeLandmark.includes('Awaiting') &&
    activeLandmark.trim().length > 0
  );

  const activeLocation = hasSpokenLocation
    ? `${activeLandmark}, Hyderabad, Telangana`
    : 'Hyderabad, Telangana';

  return (
    <div className="h-full flex flex-col gap-3.5 p-4 rounded-xl bg-[#111e2e]/90 backdrop-blur-2xl border border-[#1e3a5f]/70 shadow-[0_8px_32px_0_rgba(10,19,31,0.6)]">
      {/* ========================================================================= */}
      {/* TOP HALF: Real Interactive Google Map (Problem Statement 2 Audio Sync)   */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between border-b border-[#1e3a5f]/40 pb-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-mono font-bold text-white tracking-wide uppercase">
              Real Interactive Incident Map (Google Maps Engine)
            </h2>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
            <span>AUDIO-SYNCED GEO-TRIANGULATION</span>
          </div>
        </div>

        {/* Real Embedded Google Map with Dark Mode Filter */}
        <div className="relative h-64 w-full rounded-xl bg-[#080f1a] border border-[#1e3a5f]/60 overflow-hidden shadow-inner flex items-center justify-center">
          <iframe
            key={activeLocation}
            title="Real Interactive Google Map - Spoken Incident Location"
            src={`https://maps.google.com/maps?q=${encodeURIComponent(activeLocation)}&t=m&z=14&output=embed`}
            className="w-full h-full border-0 invert-[90%] hue-rotate-180 contrast-105 opacity-90"
            loading="lazy"
          />

          {/* Floating Spoken Location Badge (Updates immediately when caller speaks!) */}
          <div className="absolute top-2.5 left-2.5 px-3 py-1.5 rounded-lg bg-[#0a131f]/95 border border-cyan-500/40 text-[11px] font-mono text-cyan-300 flex items-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.7)] backdrop-blur-md">
            <MapPin className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
            <span className="font-bold">
              {hasSpokenLocation
                ? `Spoken Location: ${activeLandmark}`
                : 'Hyderabad Central — Listening for spoken location...'}
            </span>
          </div>

          <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded bg-[#0a131f]/90 border border-[#1e3a5f]/60 text-[9px] font-mono text-slate-300 flex items-center gap-1.5">
            <ExternalLink className="w-3 h-3 text-cyan-400" />
            <span>Google Maps Live Embed</span>
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
