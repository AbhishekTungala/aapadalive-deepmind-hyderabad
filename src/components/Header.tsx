import React, { useState } from 'react';
import {
  Radio,
  PhoneCall,
  PhoneOff,
  AlertTriangle,
  PlayCircle,
  Cpu,
  Key,
  Flame,
  Activity,
  ChevronDown
} from 'lucide-react';
import type { SystemTelemetry } from '../types';

interface HeaderProps {
  telemetry: SystemTelemetry;
  apiKey: string;
  onSetApiKey: (key: string) => void;
  onStartLiveMic: () => void;
  onStopCall: () => void;
  onStartScenario: (scenario: 'PVNR_ACCIDENT' | 'GACHIBOWLI_CARDIAC' | 'BALANAGAR_FIRE') => void;
}

export const Header: React.FC<HeaderProps> = ({
  telemetry,
  apiKey,
  onSetApiKey,
  onStartLiveMic,
  onStopCall,
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

  return (
    <header className="relative z-30 border-b border-slate-800 bg-[#080c14]/95 backdrop-blur px-4 py-2.5">
      {/* Mid-Sentence Barge-In Interruption Banner */}
      {telemetry.bargeInActive && (
        <div className="absolute top-full left-0 right-0 z-50 bg-amber-500/20 border-b-2 border-amber-500 text-amber-200 px-4 py-2.5 flex items-center justify-between shadow-2xl backdrop-blur-md animate-pulse">
          <div className="flex items-center gap-3">
            <span className="p-1 rounded bg-amber-500 text-black font-extrabold text-xs tracking-wider animate-bounce">
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
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 via-amber-500 to-cyan-500 p-[2px] shadow-lg shadow-rose-500/20">
                <div className="w-full h-full bg-[#0b0f17] rounded-[10px] flex items-center justify-center">
                  <Flame className="w-5 h-5 text-rose-500 animate-pulse" />
                </div>
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-emerald-400 opacity-75' : 'bg-rose-400 opacity-75'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  Aapada<span className="text-cyan-400 font-extrabold">Live</span>
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  HYD 108 DISPATCH
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                  DeepMind Hackathon '26
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Bilingual Crisis Triage & Voice Copilot • Telangana Emergency Operations
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-800">
            {/* Model Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700/60 text-[11px] font-mono text-cyan-300">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>gemini-3.8-live</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700/60 text-[11px] font-mono text-amber-300">
              <Radio className="w-3.5 h-3.5 text-amber-400" />
              <span>3.5-transcribe</span>
            </div>
          </div>
        </div>

        {/* Center: Live Telemetry Status Badges */}
        <div className="flex items-center gap-3">
          {/* Interaction Status */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Status:</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${
                telemetry.interactionStatus === 'IN_PROGRESS'
                  ? 'bg-cyan-400 animate-ping'
                  : 'bg-emerald-400'
              }`} />
              <span className={`font-mono font-bold ${
                telemetry.interactionStatus === 'IN_PROGRESS'
                  ? 'text-cyan-400'
                  : 'text-emerald-400'
              }`}>
                {telemetry.interactionStatus}
              </span>
            </div>
          </div>

          {/* Latency */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Latency:</span>
            <span className="text-emerald-400 font-bold">{telemetry.latencyMs}ms</span>
          </div>

          {/* Barge-in counter */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Barge-Ins:</span>
            <span className="text-amber-400 font-bold">{telemetry.bargeInCount}</span>
          </div>
        </div>

        {/* Right: Actions & Demo Controls */}
        <div className="flex items-center gap-2.5">
          {/* Scenario Simulator Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowScenarioMenu(!showScenarioMenu)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 text-amber-200 border border-amber-500/40 text-xs font-semibold shadow-lg shadow-amber-500/10 transition-all cursor-pointer"
            >
              <PlayCircle className="w-4 h-4 text-amber-400" />
              <span>Simulate Panic Call (Demo)</span>
              <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
            </button>

            {showScenarioMenu && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-slate-900/95 border border-slate-700 p-2 shadow-2xl z-50 backdrop-blur-lg">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Realistic Hyderabad Crisis Scenarios
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      onStartScenario('PVNR_ACCIDENT');
                      setShowScenarioMenu(false);
                    }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors flex flex-col cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-rose-400">
                      <span>PVNR Expressway Overturn</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">Telugu-Eng</span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      Pillar 142 Mehdipatnam • Car rollover, arterial bleeding, fire hazard & mid-call barge-in
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      onStartScenario('GACHIBOWLI_CARDIAC');
                      setShowScenarioMenu(false);
                    }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors flex flex-col cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                      <span>DLF Cybercity Cardiac Arrest</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">Hindi-Eng</span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      Gachibowli IT Corridor • 45yo collapsed, bystander CPR & public access AED
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      onStartScenario('BALANAGAR_FIRE');
                      setShowScenarioMenu(false);
                    }}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors flex flex-col cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-cyan-400">
                      <span>Balanagar Chemical Warehouse</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">Urdu-Telugu</span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      Sanath Nagar IDA • Exploding chemical drums, toxic fumes, 3 trapped workers
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Live Mic Connection Button */}
          {!isConnected ? (
            <button
              onClick={onStartLiveMic}
              disabled={isConnecting}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <PhoneCall className="w-4 h-4" />
              <span>{isConnecting ? 'Connecting Live...' : 'Start Live Mic'}</span>
            </button>
          ) : (
            <button
              onClick={onStopCall}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" />
              <span>End Call</span>
            </button>
          )}

          {/* API Key Modal Button */}
          <button
            onClick={() => setShowKeyModal(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
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
              Enter your Gemini API Key to enable live WebSocket connectivity to <code className="text-cyan-300">gemini-3.8-live</code>. Key is stored locally in your browser's <code className="text-slate-300">localStorage</code> and falls back to <code className="text-slate-300">.env</code>.
            </p>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-mono mb-3 focus:outline-none focus:border-cyan-500"
            />
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setTempKey('AIzaSyBViF11iVXYKyfa9jrT5gUFNVsAKqkI25w')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 underline underline-offset-2 cursor-pointer"
              >
                Insert Hackathon Key
              </button>
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
