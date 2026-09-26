import React, { useState } from 'react';
import {
  PhoneCall,
  PhoneOff,
  AlertTriangle,
  PlayCircle,
  Key,
  Flame,
  Activity,
  ChevronDown,
  Clock,
  RotateCcw,
  Sparkles
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

  React.useEffect(() => {
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
    <header className="relative z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl px-4 lg:px-6 py-3">
      {/* Auto Hang-Off Countdown Banner */}
      {telemetry.autoHangUpCountdown !== null && telemetry.autoHangUpCountdown !== undefined && (
        <div className="absolute top-full left-0 right-0 z-50 bg-rose-600/30 border-b-2 border-rose-500 text-rose-200 px-6 py-2.5 flex items-center justify-between shadow-2xl backdrop-blur-md animate-pulse">
          <div className="flex items-center gap-3">
            <span className="p-1 px-2.5 rounded bg-rose-600 text-white font-extrabold text-xs tracking-wider">
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
        <div className="absolute top-full left-0 right-0 z-50 bg-amber-500/20 border-b-2 border-amber-500 text-amber-200 px-6 py-2.5 flex items-center justify-between shadow-2xl backdrop-blur-md animate-pulse">
          <div className="flex items-center gap-3">
            <span className="p-1 px-2.5 rounded bg-amber-500 text-black font-extrabold text-xs tracking-wider animate-bounce">
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
            <span className="px-2 py-0.5 rounded bg-amber-500/30 border border-amber-400/50">
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 via-amber-500 to-cyan-500 p-[2px] shadow-lg shadow-rose-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Flame className="w-5 h-5 text-rose-500 animate-pulse" />
                </div>
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-rose-400 opacity-75' : 'bg-emerald-400 opacity-75'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1">
                  Aapada<span className="text-cyan-400">Live</span>
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 tracking-wider">
                  HYD 108 DISPATCH
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Bilingual Crisis Triage & Voice Copilot • Telangana Emergency Operations
              </p>
            </div>
          </div>

          {/* Clean Google Gemini AI Branding in Navbar Only */}
          <div className="hidden xl:flex items-center gap-2 pl-4 border-l border-slate-800">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold text-white">Google Gemini</span>
              <span className="text-slate-400">• Real-Time Multimodal Voice</span>
            </div>
          </div>
        </div>

        {/* Center: High-Contrast Status & Telemetry */}
        <div className="flex items-center gap-3">
          {/* Pulsating Call Status Badge */}
          {isConnected ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/50 text-rose-300 text-xs font-bold shadow-lg shadow-rose-500/20">
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
              <span className="tracking-wide">SYSTEM STANDBY (108 READY)</span>
            </div>
          )}

          {/* Latency Telemetry */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Latency:</span>
            <span className="text-emerald-400 font-bold">{telemetry.latencyMs}ms</span>
          </div>

          {/* Barge-in counter */}
          {telemetry.bargeInCount > 0 && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs font-mono">
              <span className="text-amber-300">Barge-Ins:</span>
              <span className="text-amber-400 font-bold">{telemetry.bargeInCount}</span>
            </div>
          )}
        </div>

        {/* Right: Prominent Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Secondary: Test Bench (Pre-Recorded) Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowScenarioMenu(!showScenarioMenu)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700 hover:border-slate-600 text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              <PlayCircle className="w-4 h-4 text-amber-400" />
              <span>Test Bench (Pre-Recorded)</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showScenarioMenu ? 'rotate-180' : ''}`} />
            </button>

            {showScenarioMenu && (
              <div className="absolute right-0 mt-2 w-84 rounded-2xl bg-slate-900/95 border border-slate-700/80 p-2.5 shadow-2xl z-50 backdrop-blur-xl">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">
                  Pre-Recorded Test Bench Scenarios
                </div>
                <div className="space-y-1.5">
                  <button
                    onClick={() => {
                      onStartScenario('PVNR_ACCIDENT');
                      setShowScenarioMenu(false);
                    }}
                    className="w-full text-left p-3 rounded-xl hover:bg-slate-800/80 transition-colors flex flex-col cursor-pointer border border-transparent hover:border-slate-700"
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
                    className="w-full text-left p-3 rounded-xl hover:bg-slate-800/80 transition-colors flex flex-col cursor-pointer border border-transparent hover:border-slate-700"
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
                    className="w-full text-left p-3 rounded-xl hover:bg-slate-800/80 transition-colors flex flex-col cursor-pointer border border-transparent hover:border-slate-700"
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

          {/* Primary: Start Live Emergency Call / End Call Button */}
          {isConnected ? (
            /* ACTIVE: High-visibility Red End Call Button */
            <button
              onClick={onStopCall}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold tracking-wide shadow-lg shadow-rose-600/40 border border-rose-400/50 transition-all cursor-pointer animate-pulse"
              title="Hang up call: Releases microphone, closes connection, and finalizes triage"
            >
              <PhoneOff className="w-4 h-4 text-white" />
              <span>End Call / Hang Up ({formatDuration(telemetry.callDurationSeconds || 0)})</span>
            </button>
          ) : isFinalized ? (
            /* FINALIZED: Start New Emergency Call */
            <button
              onClick={onStartNewCall}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold tracking-wide shadow-lg shadow-emerald-600/30 border border-emerald-400/50 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-white" />
              <span>Start New Emergency Call</span>
            </button>
          ) : (
            /* IDLE: Distinct Glowing Teal/Blue Start Live Emergency Call Button */
            <button
              onClick={onStartLiveMic}
              disabled={isConnecting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white text-xs font-extrabold tracking-wide shadow-lg shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <PhoneCall className="w-4 h-4 text-white" />
              <span>{isConnecting ? 'Opening 108 Emergency Line...' : 'Start Live Emergency Call'}</span>
            </button>
          )}

          {/* API Key Modal Button */}
          <button
            onClick={() => setShowKeyModal(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              apiKey
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-white'
            }`}
            title="Configure Gemini API Key"
          >
            <Key className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline font-mono text-[11px]">
              {apiKey ? 'API Key Active' : 'API Key'}
            </span>
          </button>
        </div>
      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Key className="w-5 h-5 text-cyan-400" />
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
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-mono mb-3 focus:outline-none focus:border-cyan-500"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500">
                Leaves no trace in source code or dist bundle
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onSetApiKey(tempKey);
                    setShowKeyModal(false);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer"
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
