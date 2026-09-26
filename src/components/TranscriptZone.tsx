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
  Radio,
  AlertTriangle
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
          <span key={entity.text} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-semibold">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            {entity.text}
          </span>
        );
      case 'VEHICLE_NO':
        return (
          <span key={entity.text} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold tracking-wider">
            <Car className="w-3.5 h-3.5 text-amber-400" />
            {entity.text}
          </span>
        );
      case 'PHONE':
        return (
          <span key={entity.text} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-semibold">
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            {entity.text}
          </span>
        );
      default:
        return (
          <span key={entity.text} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-bold">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            {entity.text}
          </span>
        );
    }
  };

  return (
    <div className="h-full flex flex-col p-5 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Zone Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Languages className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Zone 2: Live Bilingual Transcript Feed
            </h2>
            <p className="text-[11px] text-slate-400">
              Real-time speech-to-text with continuous English operator bridge
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
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-36 sm:w-44 transition-all"
            />
          </div>

          <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setFilterSpeaker('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filterSpeaker === 'ALL' ? 'bg-cyan-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterSpeaker('CALLER')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filterSpeaker === 'CALLER' ? 'bg-cyan-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Caller
            </button>
            <button
              onClick={() => setFilterSpeaker('GEMINI_DISPATCH')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filterSpeaker === 'GEMINI_DISPATCH' ? 'bg-cyan-600 text-white font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Copilot
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
          /* Clean Radar Standby Empty State */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10 animate-pulse">
              <Radio className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white tracking-wide">
                108 Emergency Dispatch Bridge Ready
              </h3>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Click <span className="text-cyan-400 font-semibold">"Start Live Emergency Call"</span> to speak via microphone, or pick a scenario from the <span className="text-amber-400 font-semibold">Test Bench</span>.
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
                    ? 'bg-slate-900/90 border-slate-800'
                    : isOperator
                    ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                    : 'bg-purple-950/20 border-purple-800/40 text-purple-100'
                }`}
              >
                {/* Chat Bubble Header */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2.5">
                    {isCaller ? (
                      <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        <User className="w-4 h-4" />
                      </div>
                    ) : isOperator ? (
                      <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <Zap className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <span className="text-xs font-bold text-white tracking-wide block">
                        {isCaller
                          ? 'CALLER (LIVE SPEECH)'
                          : isOperator
                          ? '108 DISPATCHER OVERRIDE'
                          : '108 COPILOT (AI)'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {entry.timestamp}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700/60 text-slate-300 font-medium">
                    {getLanguageLabel(entry.originalLanguage)}
                  </span>
                </div>

                {/* Spoken Text */}
                <div className="text-xs leading-relaxed text-slate-100 font-normal mb-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  {entry.originalText}
                </div>

                {/* Live English Translation Bridge (for Dispatcher) */}
                {entry.originalLanguage !== 'en' && entry.translatedText !== entry.originalText && (
                  <div className="text-xs leading-relaxed text-cyan-200 bg-cyan-950/30 p-3 rounded-xl border border-cyan-800/40 mb-2">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                      <Languages className="w-3.5 h-3.5" />
                      English Operator Bridge:
                    </span>
                    {entry.translatedText}
                  </div>
                )}

                {/* Extracted Entities */}
                {entry.entities && entry.entities.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Identified Entities:
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
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Bilingual Telugu/Hindi/Urdu Emergency Bridge Active</span>
        </div>
        <button
          onClick={() => {
            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }}
          className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer font-medium"
        >
          <ArrowDown className="w-3.5 h-3.5" /> Jump to Latest
        </button>
      </div>
    </div>
  );
};
