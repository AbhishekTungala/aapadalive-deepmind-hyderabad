import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  PhoneOff,
  AlertTriangle,
  PlayCircle,
  Key,
  Flame,
  ChevronDown,
  Clock,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Radio
} from 'lucide-react';
import type { SystemTelemetry } from '../types';

interface HeaderProps {
  telemetry: SystemTelemetry;
  apiKey: string;
  onSetApiKey: (key: string) => void;
  onStartLiveMic: () => void;
  onStopCall: () => void;
  onStartNewCall?: () => void;
  onStartScenario: (scenario: 'PVNR_ACCIDENT' | 'GACHIBOWLI_CARDIAC' | 'BALANAGAR_FIRE') => void;
}

export const Header: React.FC<HeaderProps> = ({
  telemetry,
  apiKey,
  onSetApiKey,
  onStartLiveMic,
  onStopCall,
  onStartNewCall,
  onStartScenario,
}) => {
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);
  const [showScenarioMenu, setShowScenarioMenu] = useState(false);
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
    <header className="relative z-30 border-b border-white/[0.08] bg-[#07090e]/90 backdrop-blur-2xl px-4 lg:px-6 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
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
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 via-amber-500 to-cyan-500 p-[1.5px] shadow-[0_0_20px_rgba(244,63,94,0.35)]">
                <div className="w-full h-full bg-[#07090e] rounded-[10px] flex items-center justify-center">
                  <Flame className="w-5 h-5 text-rose-500 animate-pulse" />
                </div>
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-rose-400 opacity-75' : 'bg-emerald-400 opacity-75'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-lg font-black tracking-tight text-white flex items-center">
                  Aapada
                  <span className="bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent ml-0.5">
                    Live
                  </span>
                </h1>
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold rounded-md bg-white/[0.06] text-slate-300 border border-white/[0.1] tracking-wider uppercase">
                  v2.4 TELEMETRY
                </span>
                <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30 tracking-wider">
                  HYD 108 DISPATCH
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Bilingual Crisis Triage & Voice Copilot • Telangana Emergency Operations
              </p>
            </div>
          </div>

          {/* Clean Google Gemini AI Branding in Navbar Only */}
          <div className="hidden xl:flex items-center gap-2 pl-4 border-l border-white/[0.08]">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/60 border border-white/[0.08] text-xs text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold text-white">Google Gemini</span>
              <span className="text-slate-400 font-mono text-[11px]">• Live Multimodal Audio</span>
            </div>
          </div>
        </div>

        {/* Center: Mission Clock & Live Operational Telemetry */}
        <div className="flex items-center gap-3">
          {/* Pulsating Call Status Badge */}
          {isConnected ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/50 text-rose-300 text-xs font-bold shadow-[0_0_15px_rgba(244,63,94,0.25)]">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="tracking-wide">CALL IN PROGRESS</span>
              <div className="flex items-center gap-1 ml-1 text-white font-mono font-extrabold">
                <Clock className="w-3 h-3 text-rose-400" />
                {formatDuration(telemetry.callDurationSeconds || 0)}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="tracking-wide font-mono text-[11px]">DISPATCH STANDBY // 108 READY</span>
            </div>
          )}

          {/* Mission Operational Clock (IST) */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/[0.08] text-xs font-mono text-slate-300">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">OPS CLOCK:</span>
            <span className="text-cyan-300 font-bold">{missionTime || '14:06:47 IST'}</span>
          </div>

          {/* Round-Trip Latency with Pulsing Green Dot */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/[0.08] text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span className="text-slate-400">RTT:</span>
            <span className="text-emerald-400 font-bold">{telemetry.latencyMs}ms</span>
          </div>

          {/* Barge-in counter */}
          {telemetry.bargeInCount > 0 && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs font-mono">
              <span className="text-amber-300">Barge-Ins:</span>
              <span className="text-amber-400 font-bold">{telemetry.bargeInCount}</span>
            </div>
          )}
        </div>

        {/* Right: Tactile Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Secondary: Test Bench (Pre-Recorded) Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowScenarioMenu(!showScenarioMenu)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 text-slate-200 border border-white/[0.1] hover:border-white/[0.2] text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <PlayCircle className="w-4 h-4 text-amber-400" />
              <span>Test Bench (Pre-Recorded)</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showScenarioMenu ? 'rotate-180' : ''}`} />
            </button>

            {showScenarioMenu && (
              <div className="absolute right-0 mt-2 w-84 rounded-2xl bg-[#0b0f19]/95 border border-white/[0.12] p-2.5 shadow-[0_16px_48px_rgba(0,0,0,0.8)] z-50 backdrop-blur-2xl ring-1 ring-white/[0.05]">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1 font-mono">
                  Offline Acoustic Test Bench Scenarios
                </div>
                <div className="space-y-1.5">
                  <button
                    onClick={() => {
                      onStartScenario('PVNR_ACCIDENT');
                      setShowScenarioMenu(false);
                    }}
                    className="w-full text-left p-3 rounded-xl hover:bg-white/[0.04] transition-colors flex flex-col cursor-pointer border border-transparent hover:border-white/[0.08]"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-rose-400">
                      <span>PVNR Expressway Overturn</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono">Telugu-Eng</span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 leading-snug">
                      Pillar 142 Mehdipatnam • Overturned vehicle, arterial bleeding, fuel leak hazard
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      onStartScenario('GACHIBOWLI_CARDIAC');
                      setShowScenarioMenu(false);
                    }}
                    className="w-full text-left p-3 rounded-xl hover:bg-white/[0.04] transition-colors flex flex-col cursor-pointer border border-transparent hover:border-white/[0.08]"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                      <span>DLF Cybercity Cardiac Arrest</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">Hindi-Eng</span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 leading-snug">
                      Gachibowli Gate 2 • 45yo collapsed, bystander CPR & public access AED
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      onStartScenario('BALANAGAR_FIRE');
                      setShowScenarioMenu(false);
                    }}
                    className="w-full text-left p-3 rounded-xl hover:bg-white/[0.04] transition-colors flex flex-col cursor-pointer border border-transparent hover:border-white/[0.08]"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-cyan-400">
                      <span>Balanagar Chemical Warehouse</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">Urdu-Telugu</span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 leading-snug">
                      Sanath Nagar IDA • Exploding chemical drums, toxic fumes, trapped workers
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Primary CTA Button: Glowing Gradient (Idle) vs Red Alert (Active) */}
          {isConnected ? (
            /* ACTIVE CALL: Red Pulsing Alert Button */
            <button
              onClick={onStopCall}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.4)] text-white text-xs font-extrabold tracking-wide border border-rose-400/50 transition-all cursor-pointer animate-pulse"
              title="Hang up call: Releases microphone, closes connection, and finalizes triage"
            >
              <PhoneOff className="w-4 h-4 text-white" />
              <span>End Call ({formatDuration(telemetry.callDurationSeconds || 0)})</span>
            </button>
          ) : isFinalized ? (
            /* FINALIZED STATE: Start New Emergency Call */
            <button
              onClick={onStartNewCall}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold tracking-wide shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400/50 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-white" />
              <span>Start New Emergency Call</span>
            </button>
          ) : (
            /* IDLE STATE: Glowing Teal/Cyan CTA */
            <button
              onClick={onStartLiveMic}
              disabled={isConnecting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 text-slate-950 text-xs font-extrabold tracking-wide shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all duration-300 cursor-pointer disabled:opacity-50 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <PhoneCall className="w-4 h-4 text-slate-950" />
              <span>{isConnecting ? 'Connecting 108...' : 'Start Live Emergency Call'}</span>
            </button>
          )}

          {/* API Key Modal Button */}
          <button
            onClick={() => setShowKeyModal(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              apiKey
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
                : 'bg-slate-900/80 border-white/[0.08] text-slate-400 hover:text-white'
            }`}
            title="Configure Gemini API Key"
          >
            <Key className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline font-mono text-[11px]">
              {apiKey ? 'API Active' : 'API Key'}
            </span>
          </button>
        </div>
      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-white/[0.12] rounded-2xl max-w-md w-full p-6 shadow-2xl ring-1 ring-white/[0.08]">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              Google Gemini API Configuration
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Enter your Gemini API Key to enable live WebSocket connectivity to <code className="text-cyan-300">gemini-3.8-live</code>. Key is stored securely in your browser's <code className="text-cyan-300">sessionStorage</code> for this session only and passed via the <code className="text-cyan-300">x-gemini-api-key</code> request header.
            </p>
            <input
              type="password"
              placeholder="Paste Gemini API Key..."
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/[0.12] text-white text-xs font-mono mb-3 focus:outline-none focus:border-cyan-500 shadow-inner"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500 font-mono">
                Stored in sessionStorage only
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-white/[0.06] text-slate-300 text-xs font-semibold hover:bg-white/[0.1] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onSetApiKey(tempKey);
                    setShowKeyModal(false);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer shadow-md shadow-cyan-600/30"
                >
                  Save Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
