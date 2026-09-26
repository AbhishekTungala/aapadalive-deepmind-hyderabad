import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  PhoneOff,
  AlertTriangle,
  Key,
  ShieldCheck,
  Radio,
  Mic,
  Lock
} from 'lucide-react';
import type { SystemTelemetry } from '../types';

interface HeaderProps {
  telemetry: SystemTelemetry;
  apiKey: string;
  onSetApiKey: (key: string) => void;
  onStartLiveMic: () => void;
  onStopCall: () => void;
  onStartNewCall?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  telemetry,
  apiKey,
  onSetApiKey,
  onStartLiveMic,
  onStopCall,
  onStartNewCall,
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
  const isFinalized = telemetry.callState === 'FINALIZED';

  // Format call duration into MM:SS
  const formatDuration = (totalSeconds: number = 0) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="relative z-30 border-b border-[#1e3a5f]/60 bg-[#0a131f]/95 backdrop-blur-2xl px-4 lg:px-6 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
      {/* Auto Hang-Off Countdown Banner */}
      {telemetry.autoHangUpCountdown !== null && telemetry.autoHangUpCountdown !== undefined && (
        <div className="absolute top-full left-0 right-0 z-50 bg-gradient-to-r from-red-600/30 via-rose-600/40 to-red-600/30 border-b-2 border-rose-500 text-rose-200 px-6 py-2.5 flex items-center justify-between shadow-2xl backdrop-blur-xl animate-pulse">
          <div className="flex items-center gap-3">
            <span className="p-1 px-2.5 rounded-lg bg-rose-600 text-white font-extrabold text-xs tracking-wider shadow-md">
              AUTO HANG-OFF INITIATED
            </span>
            <div className="flex items-center gap-2">
              <PhoneOff className="w-4 h-4 text-rose-400" />
              <span className="text-xs font-semibold tracking-wide">
                108 Dispatch Authorized: Dispatch announcement complete. Disconnecting line in{' '}
                <span className="font-mono font-bold text-white text-sm underline">{telemetry.autoHangUpCountdown}s</span>...
              </span>
            </div>
          </div>
          <div className="text-xs font-mono text-rose-300 hidden md:block">
            Microphone & Web Audio buffer queue releasing
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
                Caller interrupted Gemini mid-sentence! Audio playback buffer flushed instantly (0ms latency).
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

      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Left: macOS-Style Command Header Title & Window Controls */}
        <div className="flex items-center gap-3.5">
          {/* macOS window control dots */}
          <div className="flex items-center gap-1.5 mr-1">
            <span className="w-3 h-3 rounded-full bg-[#ef4444] border border-[#dc2626]/60 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
            <span className="w-3 h-3 rounded-full bg-[#f59e0b] border border-[#d97706]/60 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
            <span className="w-3 h-3 rounded-full bg-[#10b981] border border-[#059669]/60 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
          </div>

          <div>
            <h1 className="text-sm md:text-base font-black tracking-tight text-white flex items-center gap-2 font-mono">
              <span className="bg-gradient-to-r from-rose-400 via-amber-300 to-cyan-400 bg-clip-text text-transparent">
                AapadaLive
              </span>
              <span className="text-slate-400 font-sans font-bold">—</span>
              <span className="text-white">
                Next-Gen Voice & Real-Time Audio Copilot
              </span>
            </h1>
            <p className="text-[10px] md:text-[11px] text-cyan-300/80 font-mono tracking-wider uppercase mt-0.5">
              MID-SENTENCE BARGE-IN • VOCAL TONE PROSODY • REAL-TIME TRANSLATION • STRUCTURED VOICE ACTION
            </p>
          </div>
        </div>

        {/* Right: Reference Dashboard Status Pills & Start/End Live Call CTA */}
        <div className="flex items-center gap-2.5">
          {/* Gemini 3.8 Live Ready Status Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111e2e] border border-[#1e3a5f] text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_8px_#10b981]" />
            <span className="text-emerald-300 font-bold">Gemini 3.8 Live: Ready</span>
          </div>

          {/* Full-Duplex Bidi Audio Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111e2e] border border-[#1e3a5f] text-xs font-mono text-cyan-300">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-cyan-300">Full-Duplex Bidi Audio</span>
          </div>

          {/* Mic 16kHz Active Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111e2e] border border-[#1e3a5f] text-xs font-mono">
            <Mic className={`w-3.5 h-3.5 ${isConnected ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
            <span className="text-slate-400">Mic:</span>
            <span className={`font-bold ${isConnected ? 'text-rose-300' : 'text-slate-300'}`}>
              {isConnected ? '16kHz Live' : '16kHz Standby'}
            </span>
          </div>

          {/* Ops Clock */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111e2e] border border-[#1e3a5f] text-xs font-mono text-slate-300">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-300 font-bold">{missionTime || '14:20:00 IST'}</span>
          </div>

          {/* API Key Modal Button */}
          <button
            onClick={() => setShowKeyModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111e2e] hover:bg-[#1a2c42] border border-[#1e3a5f] text-slate-300 text-xs font-mono transition-all cursor-pointer shadow-sm"
            title="Configure Gemini API Key (sessionStorage only)"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">API Key</span>
            {apiKey && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
          </button>

          {/* Start / End Live Call Button */}
          {isConnected ? (
            <button
              onClick={onStopCall}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-mono font-bold text-xs tracking-wider shadow-[0_0_20px_rgba(225,29,72,0.45)] border border-rose-400/50 cursor-pointer active:scale-95 transition-all animate-pulse"
            >
              <PhoneOff className="w-4 h-4 text-white" />
              <span>HANG UP // END CALL ({formatDuration(telemetry.callDurationSeconds || 0)})</span>
            </button>
          ) : isFinalized ? (
            <button
              onClick={onStartNewCall || onStartLiveMic}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-mono font-bold text-xs tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.35)] cursor-pointer active:scale-95 transition-all"
            >
              <PhoneCall className="w-4 h-4 text-slate-950" />
              <span>START NEW EMERGENCY CALL</span>
            </button>
          ) : (
            <button
              onClick={onStartLiveMic}
              disabled={isConnecting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-mono font-bold text-xs tracking-wider shadow-[0_0_25px_rgba(6,182,212,0.4)] cursor-pointer active:scale-95 transition-all"
            >
              <PhoneCall className="w-4 h-4 text-slate-950" />
              <span>{isConnecting ? 'CONNECTING MIC...' : 'START LIVE 108 CALL'}</span>
            </button>
          )}
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
