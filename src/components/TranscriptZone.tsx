import React, { useRef, useEffect } from 'react';
import {
  Mic,
  Radio,
  Languages,
  Sparkles,
  CheckCircle2,
  ListTodo,
  Target,
  Tag,
  Zap,
  Volume2,
  Activity,
  PhoneOff,
  PhoneCall,
  VolumeX
} from 'lucide-react';
import type { TranscriptEntry, VoiceActionTicket } from '../types';

export const LANGUAGE_OPTIONS: { id: 'auto' | 'te' | 'hi' | 'en'; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'te', label: 'తెలుగు' },
  { id: 'hi', label: 'हिंदी' },
  { id: 'en', label: 'English' }
];

interface TranscriptZoneProps {
  transcript: TranscriptEntry[];
  ticket?: VoiceActionTicket;
  activeLandmark?: string;
  isConnected?: boolean;
  onStopCall?: () => void;
  onStartLiveMic?: () => void;
  onStopAudio?: () => void;
  isVoiceMuted?: boolean;
  onToggleVoiceMute?: () => void;
  selectedLanguage?: 'auto' | 'te' | 'hi' | 'en';
  onSelectLanguage?: (lang: 'auto' | 'te' | 'hi' | 'en') => void;
}

export const TranscriptZone: React.FC<TranscriptZoneProps> = ({
  transcript,
  ticket,
  isConnected = false,
  onStopCall,
  onStartLiveMic,
  onStopAudio,
  isVoiceMuted = false,
  onToggleVoiceMute,
  selectedLanguage = 'auto',
  onSelectLanguage
}) => {
  const streamEndRef = useRef<HTMLDivElement>(null);

  // Filter out any entries with empty or blank text
  const validEntries = transcript.filter((entry) => {
    const rawText = (entry.originalText || (entry as any).text || '').trim();
    return rawText.length > 0;
  });

  // Auto-scroll stream as real words are spoken
  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [validEntries.length]);

  const structuredActions = ticket?.structuredActions || [];
  const detectedIntent = ticket?.detectedIntent || 'General Discussion';
  const topicSummary = ticket?.topicSummary || 'Universal Voice Collaboration';
  const vocalTone = ticket?.vocalTone || 'Calm & Conversational';
  const entities = ticket?.entities || [];
  const activeLocation = ticket?.activeLocation || '';

  return (
    <div className="h-full flex flex-col gap-3 p-4 rounded-xl bg-[#111e2e]/90 backdrop-blur-2xl border border-[#1e3a5f]/70 shadow-[0_8px_32px_0_rgba(10,19,31,0.6)] overflow-hidden">
      {/* ========================================================================= */}
      {/* TOP 65%: Live Multi-Speaker Voice & Translation Console                   */}
      {/* ========================================================================= */}
      <div className="flex-[65_65_0%] flex flex-col min-h-0 gap-2">
        <div className="flex flex-wrap items-center justify-between border-b border-[#1e3a5f]/40 pb-2 flex-shrink-0 gap-2">
          <div className="flex items-center gap-2">
            <Mic className={`w-4 h-4 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
            <h2 className="text-xs font-mono font-bold text-white tracking-wide uppercase">
              VOICE & TRANSLATION CONSOLE
            </h2>
          </div>

          {/* Center-Right: Language Selector Pills */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#0a131f] border border-[#1e3a5f]/60 font-mono text-[10px]">
            {LANGUAGE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onSelectLanguage?.(opt.id)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  selectedLanguage === opt.id
                    ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={`Set voice language mode to ${opt.label}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Right: Always-Visible Controls */}
          <div className="flex items-center gap-1.5">
            {/* Permanent Voice Off Toggle */}
            <button
              onClick={onToggleVoiceMute}
              className={`px-2 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all border ${
                isVoiceMuted
                  ? 'bg-rose-500/25 text-rose-200 border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
              }`}
              title={isVoiceMuted ? 'Voice is Muted (Click to Unmute)' : 'Voice is ON (Click to Mute)'}
            >
              {isVoiceMuted ? (
                <>
                  <VolumeX className="w-3 h-3 text-rose-400" />
                  <span>VOICE: OFF</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3 h-3 text-emerald-400" />
                  <span>VOICE: ON</span>
                </>
              )}
            </button>

            {/* Permanent Stop Speech */}
            <button
              onClick={onStopAudio}
              className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
              title="Silence whatever AI is currently saying"
            >
              <VolumeX className="w-3 h-3 text-amber-400" />
              <span>STOP</span>
            </button>

            {/* Permanent Start / End Call */}
            {isConnected ? (
              <button
                onClick={onStopCall}
                className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm animate-pulse"
                title="End active voice session"
              >
                <PhoneOff className="w-3 h-3 text-rose-400" />
                <span>END CALL</span>
              </button>
            ) : (
              <button
                onClick={onStartLiveMic}
                className="px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                title="Start live voice session"
              >
                <PhoneCall className="w-3 h-3 text-cyan-400" />
                <span>START CALL</span>
              </button>
            )}
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 min-h-0">
          {validEntries.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3 bg-[#0a131f]/60 rounded-xl border border-[#1e3a5f]/40 min-h-[220px]">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-mono font-bold text-cyan-300 tracking-wider uppercase">
                  VOICE INTELLIGENCE BRIDGE READY // LISTENING ON 16kHz PCM
                </div>
                <p className="text-xs text-slate-400 max-w-md">
                  Awaiting spoken audio. Speak naturally in Hindi, Telugu, Urdu, or English, or click one of the Voice Action buttons on the right. Spoken utterances will transcribe, translate, and extract live action items in real time.
                </p>
              </div>
            </div>
          ) : (
            validEntries.map((entry) => {
              const isUser = entry.speaker === 'CALLER' || entry.speaker === 'USER';
              
              // Clean any raw debug tags if present
              const rawSpoken = (entry.originalText || (entry as any).text || '').trim();
              const cleanSpoken = rawSpoken
                .replace(/^\[TTS INJECTION[^\]]*\]:\s*"?/, '')
                .replace(/"?$/, '');

              // English Translation Bridge check
              const engTrans = (entry.englishTranslation || entry.translatedText || '').trim();
              const isNonLatinScript = /[\u0C00-\u0C7F\u0900-\u097F]/.test(engTrans);
              const showTranslationBridge =
                Boolean(engTrans) &&
                engTrans.toLowerCase() !== cleanSpoken.toLowerCase() &&
                !isNonLatinScript;

              return (
                <div
                  key={entry.id}
                  className={`p-3 rounded-xl border transition-all ${
                    isUser
                      ? 'bg-[#0a131f]/90 border-cyan-500/30 shadow-[0_4px_20px_rgba(6,182,212,0.08)]'
                      : 'bg-[#0a131f]/90 border-purple-500/30 shadow-[0_4px_20px_rgba(168,85,247,0.08)]'
                  }`}
                >
                  {/* Message Header */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isUser ? 'bg-cyan-400 animate-pulse' : 'bg-purple-400'
                        }`}
                      />
                      <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                        {isUser ? 'SPEAKER (LIVE MIC)' : 'GEMINI LIVE VOICE'}
                        {!isUser && <Sparkles className="w-3 h-3 text-purple-400" />}
                      </span>

                      {/* Clean Voice Style / Language Badge */}
                      {entry.voiceStyleBadge ? (
                        <span className="text-[10px] font-mono text-purple-300 px-2 py-0.5 rounded bg-purple-950/40 border border-purple-500/30 flex items-center gap-1">
                          <Volume2 className="w-2.5 h-2.5 text-purple-400" />
                          {entry.voiceStyleBadge}
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-cyan-300 px-1.5 py-0.5 rounded bg-black/40 border border-white/[0.06]">
                          {(entry.originalLanguage || 'en').toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {entry.timestamp}
                    </span>
                  </div>

                  {/* Clean Spoken Text */}
                  <div className="text-xs text-slate-200 font-medium leading-relaxed">
                    {cleanSpoken}
                  </div>

                  {/* Inset English Translation Bridge (Never renders if identical to spoken text or non-English) */}
                  {showTranslationBridge && (
                    <div className="mt-2.5 pl-3 py-1.5 border-l-2 border-cyan-400 bg-cyan-950/30 text-cyan-200 text-xs rounded-r-lg font-mono">
                      <span className="text-[9px] uppercase tracking-wider text-cyan-400 block mb-0.5 font-bold flex items-center gap-1">
                        <Languages className="w-3 h-3 text-teal-400" />
                        ENGLISH TRANSLATION BRIDGE:
                      </span>
                      {engTrans}
                    </div>
                  )}

                  {/* Extracted Entity Chips */}
                  {entry.entities && entry.entities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 pt-1.5 border-t border-white/[0.06]">
                      {entry.entities.map((ent, idx) => (
                        <span
                          key={idx}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            ent.type === 'LOCATION' || ent.type === 'LANDMARK'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : ent.type === 'ACTION'
                              ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                              : ent.type === 'METRIC'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                          }`}
                        >
                          {ent.type}: {ent.text}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={streamEndRef} />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM 35%: Live Structured Action & Decisions Board                      */}
      {/* ========================================================================= */}
      <div className="flex-[35_35_0%] flex flex-col min-h-0 pt-2.5 border-t border-[#1e3a5f]/60 gap-2">
        <div className="flex items-center justify-between pb-1 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-mono font-bold text-white tracking-wide uppercase">
              LIVE STRUCTURED ACTION & DECISIONS BOARD
            </h3>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
            <span>REAL-TIME SPEECH EXTRACTION</span>
          </div>
        </div>

        {/* Board Content: 2-Column Responsive Layout */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2.5 min-h-0 overflow-hidden">
          {/* Left Column (7 cols): Live Action Items */}
          <div className="md:col-span-7 bg-[#0a131f]/80 rounded-xl border border-[#1e3a5f]/50 p-2.5 flex flex-col min-h-0">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06] flex-shrink-0">
              <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                EXTRACTED ACTION ITEMS ({structuredActions.length})
              </span>
              <span className="text-[9px] font-mono text-cyan-400">PRIORITIZED</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 mt-2 pr-1 min-h-0">
              {structuredActions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-3 text-slate-500 space-y-1">
                  <Zap className="w-5 h-5 text-slate-600 animate-pulse" />
                  <p className="text-[11px] font-mono">
                    Awaiting spoken input to extract real-time deliverables...
                  </p>
                </div>
              ) : (
                structuredActions.map((action, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-[#0e1b2b] border border-[#1e3a5f]/60 hover:border-cyan-500/40 transition-colors flex items-start gap-2"
                  >
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-xs text-slate-200 font-medium leading-snug flex-1">
                      {action}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column (5 cols): Key Decisions & Intent */}
          <div className="md:col-span-5 bg-[#0a131f]/80 rounded-xl border border-[#1e3a5f]/50 p-2.5 flex flex-col min-h-0 gap-2 overflow-y-auto">
            {/* Intent & Tone Pill */}
            <div className="bg-[#0e1b2b] rounded-lg p-2 border border-white/[0.05]">
              <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Target className="w-3 h-3 text-purple-400" />
                CONVERSATION INTENT & VOCAL TONE
              </div>
              <div className="text-xs font-bold text-white font-mono flex items-center justify-between">
                <span>{detectedIntent}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                  {vocalTone}
                </span>
              </div>
            </div>

            {/* Topic Summary */}
            <div className="bg-[#0e1b2b] rounded-lg p-2 border border-white/[0.05]">
              <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                <Activity className="w-3 h-3 text-cyan-400" />
                SYNTHESIZED TOPIC
              </div>
              <div className="text-xs text-slate-200 font-semibold truncate">
                {topicSummary}
              </div>
            </div>

            {/* Spoken Entities & Geo-Context */}
            <div className="flex-1 bg-[#0e1b2b] rounded-lg p-2 border border-white/[0.05] min-h-[50px]">
              <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Tag className="w-3 h-3 text-emerald-400" />
                SPOKEN ENTITIES ({entities.length + (activeLocation ? 1 : 0)})
              </div>
              <div className="flex flex-wrap gap-1">
                {activeLocation && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    LOC: {activeLocation}
                  </span>
                )}
                {entities.map((ent, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#15273d] text-cyan-300 border border-[#1e3a5f]"
                  >
                    {ent.type}: {ent.text}
                  </span>
                ))}
                {!activeLocation && entities.length === 0 && (
                  <span className="text-[10px] font-mono text-slate-500 italic">
                    Listening for topics, locations & metrics...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
