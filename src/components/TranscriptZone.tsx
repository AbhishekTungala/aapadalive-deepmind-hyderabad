import React, { useState, useEffect, useRef } from 'react';
import {
  Languages,
  User,
  Bot,
  Zap,
  MapPin,
  Car,
  Phone,
  Search,
  ArrowDown,
  AlertTriangle,
  Radio,
  Sparkles
} from 'lucide-react';
import type { TranscriptEntry } from '../types';

interface TranscriptZoneProps {
  transcripts: TranscriptEntry[];
}

export const TranscriptZone: React.FC<TranscriptZoneProps> = ({ transcripts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpeaker, setFilterSpeaker] = useState<'ALL' | 'CALLER' | 'GEMINI_DISPATCH' | 'OPERATOR_OVERRIDE'>('ALL');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new transcript entries
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  const filtered = transcripts.filter((t) => {
    if (filterSpeaker !== 'ALL' && t.speaker !== filterSpeaker) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        t.originalText.toLowerCase().includes(q) ||
        t.translatedText.toLowerCase().includes(q) ||
        t.entities.some((e) => e.text.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getLanguageLabel = (code: string) => {
    switch (code) {
      case 'te': return 'Telugu';
      case 'hi': return 'Hindi';
      case 'ur-hyderabad': return 'Hyderabadi Urdu';
      case 'code-switched': return 'Bilingual Code-Switch';
      default: return 'English';
    }
  };

  const renderEntityBadge = (entity: { text: string; type: string }) => {
    switch (entity.type) {
      case 'LANDMARK':
        return (
          <span
            key={entity.text}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)] text-xs font-semibold"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            {entity.text}
          </span>
        );
      case 'VEHICLE_NO':
        return (
          <span
            key={entity.text}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)] text-xs font-mono font-bold tracking-wider"
          >
            <Car className="w-3.5 h-3.5 text-cyan-400" />
            {entity.text}
          </span>
        );
      case 'PHONE':
        return (
          <span
            key={entity.text}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)] text-xs font-mono font-semibold"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            {entity.text}
          </span>
        );
      default:
        return (
          <span
            key={entity.text}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)] text-xs font-bold animate-pulse"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            {entity.text}
          </span>
        );
    }
  };

  return (
    <div className="h-full flex flex-col p-4 lg:p-5 bg-gradient-to-b from-slate-900/70 via-slate-900/40 to-slate-950/80 backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] rounded-2xl ring-1 ring-white/[0.04] overflow-hidden">
      {/* Zone Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.2)]">
            <Languages className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Zone 2: Real-Time Stream & Bilingual Bridge
            </h2>
            <p className="text-[11px] text-slate-400 font-mono">
              CONTINUOUS TELUGU / HINDI AUDIO TRANSLATION
            </p>
          </div>
        </div>

        {/* Filter & Search Controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search feed..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-36 sm:w-44 transition-all"
            />
          </div>

          <div className="flex items-center bg-slate-950/80 border border-white/[0.08] rounded-xl p-1 text-xs">
            <button
              onClick={() => setFilterSpeaker('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer font-mono text-[11px] ${
                filterSpeaker === 'ALL' ? 'bg-cyan-600 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              ALL
            </button>
            <button
              onClick={() => setFilterSpeaker('CALLER')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer font-mono text-[11px] ${
                filterSpeaker === 'CALLER' ? 'bg-cyan-600 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              CALLER
            </button>
            <button
              onClick={() => setFilterSpeaker('GEMINI_DISPATCH')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer font-mono text-[11px] ${
                filterSpeaker === 'GEMINI_DISPATCH' ? 'bg-cyan-600 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              COPILOT
            </button>
          </div>
        </div>
      </div>

      {/* Transcript Chat Stream */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3.5 pr-2 scroll-smooth"
      >
        {filtered.length === 0 ? (
          /* Mission-Critical Radar Standby Screen */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="relative w-20 h-20 flex items-center justify-center">
              {/* Radar pulse ripples */}
              <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping" />
              <div className="absolute inset-2 rounded-full border border-cyan-500/30" />
              <div className="absolute inset-4 rounded-full border border-cyan-500/40" />
              {/* Rotating radar sweep arm */}
              <div className="absolute inset-0 rounded-full flex items-center justify-center animate-radar-sweep">
                <div className="w-1/2 h-[2px] bg-gradient-to-r from-transparent to-cyan-400 origin-right" />
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan-950/40 border border-cyan-500/50 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
            </div>

            <div className="space-y-1.5 max-w-sm">
              <h3 className="text-xs font-mono font-bold text-cyan-300 tracking-widest uppercase">
                108 DISPATCH LINE SECURED // LISTENING ON 16kHz PCM
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Voice activity detection is standby. Click <span className="text-cyan-400 font-semibold">"Start Live Emergency Call"</span> to speak into your microphone, or trigger an acoustic scenario from the <span className="text-amber-400 font-semibold">Test Bench</span>.
              </p>
            </div>
          </div>
        ) : (
          filtered.map((entry) => {
            const isCaller = entry.speaker === 'CALLER';
            const isOperator = entry.speaker === 'OPERATOR_OVERRIDE';

            return (
              <div
                key={entry.id}
                className={`p-4 rounded-2xl border transition-all shadow-md ${
                  isCaller
                    ? 'bg-slate-900/80 border-cyan-500/20 shadow-[0_4px_20px_rgba(6,182,212,0.06)]'
                    : isOperator
                    ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                    : 'bg-slate-900/80 border-purple-500/20 shadow-[0_4px_20px_rgba(168,85,247,0.06)]'
                }`}
              >
                {/* Chat Bubble Header */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2.5">
                    {isCaller ? (
                      <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.2)]">
                        <User className="w-4 h-4" />
                      </div>
                    ) : isOperator ? (
                      <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <Zap className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-[0_0_8px_rgba(168,85,247,0.2)]">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white tracking-wide">
                          {isCaller
                            ? 'CALLER (LIVE AUDIO)'
                            : isOperator
                            ? '108 DISPATCHER OVERRIDE'
                            : '108 COPILOT'}
                        </span>
                        {!isCaller && !isOperator && (
                          <span className="px-1.5 py-0.2 rounded bg-purple-500/20 border border-purple-500/30 text-[9px] font-mono text-purple-300">
                            GEMINI 3.8
                          </span>
                        )}
                        {isCaller && (
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse delay-75" />
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse delay-150" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {entry.timestamp}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-slate-300 font-mono">
                    {getLanguageLabel(entry.originalLanguage)}
                  </span>
                </div>

                {/* Spoken Text */}
                <div className="text-sm leading-relaxed text-slate-100 font-normal mb-2.5 p-3 rounded-xl bg-slate-950/70 border border-white/[0.04]">
                  {entry.originalText}
                </div>

                {/* Live English Translation Inset Bubble */}
                {entry.originalLanguage !== 'en' && entry.translatedText !== entry.originalText && (
                  <div className="border-l-2 border-cyan-400 bg-cyan-950/20 pl-3 py-2 pr-3 rounded-r-xl text-cyan-200 text-sm leading-relaxed mb-2.5">
                    <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3 h-3" />
                      ENGLISH OPERATOR BRIDGE:
                    </span>
                    {entry.translatedText}
                  </div>
                )}

                {/* Extracted Entity Micro-Chips */}
                {entry.entities && entry.entities.length > 0 && (
                  <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                      ENTITIES:
                    </span>
                    {entry.entities.map((e) => renderEntityBadge(e))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-500 font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
          <span>BILINGUAL SPEECH INGESTION READY</span>
        </div>
        <button
          onClick={() => {
            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }}
          className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer font-sans"
        >
          <ArrowDown className="w-3.5 h-3.5" /> Jump to Latest
        </button>
      </div>
    </div>
  );
};
