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
  ArrowDown
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
      case 'te': return 'Telugu (తెలుగు)';
      case 'hi': return 'Hindi (हिंदी)';
      case 'ur-hyderabad': return 'Hyderabadi Urdu';
      case 'code-switched': return 'Code-Switched (Telugu+Eng)';
      default: return 'English';
    }
  };

  const renderEntityBadge = (entity: { text: string; type: string }) => {
    switch (entity.type) {
      case 'LANDMARK':
        return (
          <span key={entity.text} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold">
            <MapPin className="w-3 h-3 text-cyan-400" />
            {entity.text}
          </span>
        );
      case 'VEHICLE_NO':
        return (
          <span key={entity.text} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-mono font-bold tracking-wider">
            <Car className="w-3 h-3 text-amber-400" />
            {entity.text}
          </span>
        );
      case 'PHONE':
        return (
          <span key={entity.text} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono font-semibold">
            <Phone className="w-3 h-3 text-emerald-400" />
            {entity.text}
          </span>
        );
      default:
        return (
          <span key={entity.text} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold">
            <Zap className="w-3 h-3 text-rose-400" />
            {entity.text}
          </span>
        );
    }
  };

  return (
    <div className="h-full flex flex-col p-4 command-card rounded-2xl overflow-hidden">
      {/* Zone Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Languages className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Zone 2: Live Code-Switched Transcript & Translation Stream
            </h2>
            <p className="text-[11px] text-slate-400">
              Powered by <span className="text-cyan-300 font-mono">gemini-3.5-live-translate-preview</span> & <span className="text-amber-300 font-mono">gemini-3.5-transcribe</span>
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search stream..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-36 sm:w-44"
            />
          </div>

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setFilterSpeaker('ALL')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                filterSpeaker === 'ALL' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterSpeaker('CALLER')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                filterSpeaker === 'CALLER' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Caller
            </button>
            <button
              onClick={() => setFilterSpeaker('GEMINI_DISPATCH')}
              className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                filterSpeaker === 'GEMINI_DISPATCH' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Gemini
            </button>
          </div>
        </div>
      </div>

      {/* Transcript Scroll Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-3 pr-2 scroll-smooth"
      >
        {filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs space-y-2">
            <Languages className="w-8 h-8 text-slate-600 animate-pulse" />
            <span>Awaiting incoming emergency call stream...</span>
            <span className="text-[11px] text-slate-600">
              Click "Simulate Panic Call" or "Start Live Mic" to test real-time code-switching.
            </span>
          </div>
        ) : (
          filtered.map((entry) => {
            const isCaller = entry.speaker === 'CALLER';
            const isOperator = entry.speaker === 'OPERATOR_OVERRIDE';

            return (
              <div
                key={entry.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isCaller
                    ? 'bg-slate-900/90 border-slate-800/90 shadow-sm'
                    : isOperator
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    : 'bg-cyan-950/20 border-cyan-800/40 shadow-sm'
                }`}
              >
                {/* Message Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {isCaller ? (
                      <div className="p-1 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    ) : isOperator ? (
                      <div className="p-1 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <Zap className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="p-1 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <span className="text-xs font-bold text-white tracking-wide">
                      {isCaller
                        ? 'EMERGENCY CALLER'
                        : isOperator
                        ? '108 DISPATCHER OVERRIDE (TTS)'
                        : 'GEMINI 3.8 LIVE COPILOT'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {entry.timestamp}
                    </span>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                    {getLanguageLabel(entry.originalLanguage)}
                  </span>
                </div>

                {/* Original Speech Stream */}
                <div className="text-xs leading-relaxed text-slate-200 font-normal mb-2 bg-[#080d17]/80 p-2.5 rounded-lg border border-slate-800/60 font-sans">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                    Original Speech (16kHz Audio Stream):
                  </span>
                  {entry.originalText}
                </div>

                {/* Translated English Stream (for the operator) */}
                {entry.originalLanguage !== 'en' && (
                  <div className="text-xs leading-relaxed text-cyan-200 bg-cyan-950/30 p-2.5 rounded-lg border border-cyan-800/40">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase flex items-center gap-1 mb-0.5">
                      <Languages className="w-3 h-3" />
                      Live Operator English Translation Bridge:
                    </span>
                    {entry.translatedText}
                  </div>
                )}

                {/* Extracted Alphanumeric Entities */}
                {entry.entities && entry.entities.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">
                      Extracted Alphanumerics:
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
      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>Biased vocabulary: Begumpet, Hitec City, Gachibowli, Secunderabad, PVNR, KIMS, Charminar</span>
        </div>
        <button
          onClick={() => {
            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }}
          className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
        >
          <ArrowDown className="w-3 h-3" /> Latest
        </button>
      </div>
    </div>
  );
};
