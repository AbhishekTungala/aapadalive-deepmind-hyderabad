import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  PhoneOff,
  AlertTriangle,
  Key,
  Lock,
  Volume2,
  VolumeX,
  Languages
} from 'lucide-react';
import type { SystemTelemetry } from '../types';

export const LANGUAGE_OPTIONS: { id: 'auto' | 'te' | 'hi' | 'en'; label: string }[] = [
  { id: 'auto', label: 'Auto (Bilingual)' },
  { id: 'te', label: 'తెలుగు (Telugu)' },
  { id: 'hi', label: 'हिंदी (Hindi)' },
  { id: 'en', label: 'English' }
];

interface HeaderProps {
  telemetry: SystemTelemetry;
  apiKey: string;
  onSetApiKey: (key: string) => void;
  onStartLiveMic: () => void;
  onStopCall: () => void;
  onStartNewCall?: () => void;
  onStopAudio?: () => void;
  isVoiceMuted?: boolean;
  onToggleVoiceMute?: () => void;
  selectedLanguage?: 'auto' | 'te' | 'hi' | 'en';
  onSelectLanguage?: (lang: 'auto' | 'te' | 'hi' | 'en') => void;
}

export const Header: React.FC<HeaderProps> = ({
  telemetry,
  apiKey,
  onSetApiKey,
  onStartLiveMic,
  onStopCall,
  onStopAudio,
  isVoiceMuted = false,
  onToggleVoiceMute,
  selectedLanguage = 'auto',
  onSelectLanguage
}) => {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  const [missionTime, setMissionTime] = useState<string>('');

  // Live Ticking Mission Clock in IST
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setMissionTime(`${timeStr} IST`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setTempKey(apiKey);
  }, [apiKey, showKeyModal]);

  const isConnected = telemetry.connectionStatus === 'CONNECTED';
  const isConnecting = telemetry.connectionStatus === 'CONNECTING';

  // Format call duration into MM:SS
  const formatDuration = (totalSeconds: number = 0) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="relative z-30 border-b border-[#1e3a5f]/60 bg-[#0a131f]/95 backdrop-blur-2xl px-3 lg:px-5 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
      {/* Auto Hang-Off Countdown Banner */}
      {telemetry.autoHangUpCountdown !== null && telemetry.autoHangUpCountdown !== undefined && (
        <div className="absolute top-full left-0 right-0 z-50 bg-gradient-to-r from-cyan-600/30 via-teal-600/40 to-cyan-600/30 border-b-2 border-cyan-500 text-cyan-200 px-6 py-2.5 flex items-center justify-between shadow-2xl backdrop-blur-xl animate-pulse">
          <div className="flex items-center gap-3">
            <span className="p-1 px-2.5 rounded-lg bg-cyan-600 text-white font-extrabold text-xs tracking-wider shadow-md">
              VOICE SESSION COMPLETION
            </span>
            <div className="flex items-center gap-2">
              <PhoneOff className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold tracking-wide">
                Voice interaction finalized. Disconnecting audio line in{' '}
                <span className="font-mono font-bold text-white text-sm underline">{telemetry.autoHangUpCountdown}s</span>...
              </span>
            </div>
          </div>
          <div className="text-xs font-mono text-cyan-300 hidden md:block">
            Microphone & Web Audio buffer queue releasing cleanly
          </div>
        </div>
      )}

      {/* Mid-Sentence Barge-In Interruption Banner */}
      {telemetry.bargeInActive && (
        <div className="absolute top-full left-0 right-0 z-50 bg-gradient-to-r from-amber-500/20 via-orange-500/30 to-amber-500/20 border border-amber-500/40 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.2)] px-6 py-2.5 flex items-center justify-between backdrop-blur-xl animate-pulse">
          <div className="flex items-center gap-3">
            <span className="p-1 px-2.5 rounded-lg bg-amber-500 text-black font-extrabold text-xs tracking-wider shadow-md animate-bounce">
              BARGE-IN DETECTED
            </span>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-semibold tracking-wide">
                User interrupted Gemini mid-sentence! Audio playback buffer flushed instantly (0ms latency).
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-amber-300">
            <span>Interruption #{telemetry.bargeInCount}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/30 border border-amber-400/50">
              Web Audio Queue Cleared
            </span>
          </div>
        </div>
      )}

      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: macOS-Style Command Header Title & Window Controls */}
        <div className="flex items-center gap-3">
          {/* macOS window control dots */}
          <div className="flex items-center gap-1.5 mr-1">
            <span className="w-3 h-3 rounded-full bg-[#ef4444] border border-[#dc2626]/60 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
            <span className="w-3 h-3 rounded-full bg-[#f59e0b] border border-[#d97706]/60 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
            <span className="w-3 h-3 rounded-full bg-[#10b981] border border-[#059669]/60 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
          </div>

          <div>
            <h1 className="text-sm md:text-base font-black tracking-tight text-white flex items-center gap-2 font-mono">
              <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                VoxLive AI
              </span>
              <span className="text-slate-400 font-sans font-bold">—</span>
              <span className="text-white">
                Next-Gen Voice & Real-Time Audio Stack
              </span>
            </h1>
            <p className="text-[10px] md:text-[11px] text-cyan-300/80 font-mono tracking-wider uppercase mt-0.5">
              GEMINI 3.8 LIVE • TELUGU / HINDI / ENGLISH MULTILINGUAL • REAL-TIME CSV DATASET
            </p>
          </div>
        </div>

        {/* Center: Live Language Mode Selector Pill Bar */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#111e2e] border border-[#1e3a5f] shadow-inner">
          <span className="text-[10px] font-mono text-slate-400 px-1.5 flex items-center gap-1 hidden md:flex">
            <Languages className="w-3 h-3 text-cyan-400" />
            <span>LANG:</span>
          </span>
          {LANGUAGE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onSelectLanguage?.(opt.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                selectedLanguage === opt.id
                  ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Right: Always-Visible Controls (Voice Off, Stop Speech, Call Toggle) */}
        <div className="flex items-center gap-2">
          {/* Permanent High-Visibility "VOICE OFF / MUTE AI" Toggle Button */}
          <button
            onClick={onToggleVoiceMute}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-mono font-bold text-xs tracking-wider transition-all cursor-pointer shadow-sm border active:scale-95 ${
              isVoiceMuted
                ? 'bg-rose-500/25 hover:bg-rose-500/35 text-rose-200 border-rose-500 shadow-[0_0_16px_rgba(244,63,94,0.35)] animate-pulse'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/50'
            }`}
            title={isVoiceMuted ? 'AI Voice Output is Muted (Click to Unmute)' : 'AI Voice Output is Active (Click to Mute)'}
          >
            {isVoiceMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-rose-400" />
                <span>🔇 AI VOICE: OFF (MUTED)</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span>🔊 AI VOICE: ON</span>
              </>
            )}
          </button>

          {/* Always-Visible "STOP CURRENT SPEECH" Button */}
          <button
            onClick={onStopAudio}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-mono font-bold text-xs tracking-wider cursor-pointer active:scale-95 transition-all shadow-sm"
            title="Immediately silence whatever the AI voice is saying right now"
          >
            <VolumeX className="w-4 h-4 text-amber-400" />
            <span>STOP SPEECH</span>
          </button>

          {/* Always-Visible "START / END VOICE SESSION" Toggle Button */}
          {isConnected ? (
            <button
              onClick={onStopCall}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-mono font-bold text-xs tracking-wider shadow-[0_0_20px_rgba(225,29,72,0.45)] border border-rose-400/50 cursor-pointer active:scale-95 transition-all animate-pulse"
              title="End current voice session"
            >
              <PhoneOff className="w-4 h-4 text-white" />
              <span>END VOICE SESSION ({formatDuration(telemetry.callDurationSeconds || 0)})</span>
            </button>
          ) : (
            <button
              onClick={onStartLiveMic}
              disabled={isConnecting}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-mono font-bold text-xs tracking-wider shadow-[0_0_25px_rgba(6,182,212,0.4)] cursor-pointer active:scale-95 transition-all"
            >
              <PhoneCall className="w-4 h-4 text-slate-950" />
              <span>{isConnecting ? 'CONNECTING MIC...' : 'START VOICE SESSION'}</span>
            </button>
          )}

          {/* Ops Clock */}
          {missionTime && (
            <div className="hidden lg:flex items-center px-2.5 py-2 rounded-xl bg-[#111e2e] border border-[#1e3a5f] text-slate-400 text-xs font-mono">
              <span className="text-cyan-300 font-bold">{missionTime}</span>
            </div>
          )}

          {/* API Key Modal Button */}
          <button
            onClick={() => setShowKeyModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-[#111e2e] hover:bg-[#1a2c42] border border-[#1e3a5f] text-slate-300 text-xs font-mono transition-all cursor-pointer shadow-sm"
            title="Configure Gemini API Key"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">API</span>
            {apiKey && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Security-Compliant API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0d1624] border border-[#1e3a5f] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div className="flex items-center gap-2 text-white font-bold">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>Runtime Gemini API Key</span>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-2">
              <p>
                Your API key is stored <strong>exclusively in your browser's sessionStorage</strong>. It is never committed to Git, bundled into dist artifacts, or logged to disk.
              </p>
              <p className="text-slate-400 text-[11px]">
                Supports <code className="text-cyan-300 font-mono">gemini-3.8-live</code>, <code className="text-cyan-300 font-mono">gemini-3.5-transcribe</code>, and <code className="text-cyan-300 font-mono">gemini-3.8-flash-tts</code>.
              </p>
            </div>

            <input
              type="password"
              placeholder="Paste Google Gemini API Key"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-[#1e3a5f] text-white text-xs font-mono focus:outline-none focus:border-cyan-400 placeholder:text-slate-600"
            />

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => {
                  onSetApiKey('');
                  setShowKeyModal(false);
                }}
                className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-mono cursor-pointer"
              >
                Clear Key
              </button>
              <button
                onClick={() => {
                  onSetApiKey(tempKey.trim());
                  setShowKeyModal(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono cursor-pointer"
              >
                Save to Session
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
