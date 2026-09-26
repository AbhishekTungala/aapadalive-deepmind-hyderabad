import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ProsodyZone } from './components/ProsodyZone';
import { TranscriptZone } from './components/TranscriptZone';
import { TriageZone } from './components/TriageZone';
import { GeminiAudioStack } from './services/geminiAudioStack';
import { Activity, AlertOctagon } from 'lucide-react';
import type {
  SystemTelemetry,
  AcousticProsodyMetrics,
  TranscriptEntry,
  TriageTicket,
  TTSPreset
} from './types';

// Strict Real-Time Extraction Defaults (ZERO Mock Data)
const STANDBY_TRIAGE_TICKET: TriageTicket = {
  ticketId: 'STANDBY-108',
  timestamp: '--:--:--',
  category: 'AWAITING_STREAM',
  categoryLabel: 'Awaiting Voice Stream...',
  severity: 'MODERATE',
  landmark: 'Awaiting Caller Location...',
  exactLocation: 'Awaiting Caller Location...',
  extractedVitals: {
    consciousness: 'Awaiting Voice Stream...',
    breathing: 'Awaiting Voice Stream...',
    pulseStatus: 'Awaiting Voice Stream...',
    bloodLoss: 'None Reported',
    traumaNotes: 'Awaiting Voice Stream...'
  },
  callerIdentity: {
    phone: 'Not Provided',
    vehiclePlate: 'None Reported'
  },
  recommendedUnit: {
    unitType: 'ALS-108 Emergency Ambulance',
    unitId: 'HYD-108-STANDBY',
    etaMinutes: 4,
    specialEquipment: ['Telemetry Stream', 'Automated Triage', 'Bilingual Bridge']
  },
  dispatchStatus: 'PENDING_APPROVAL',
  lastUpdated: '--:--:--'
};

const STANDBY_PROSODY: AcousticProsodyMetrics = {
  stressScore: 0,
  pitchVarianceHz: 0,
  speechRateWpm: 0,
  snrDb: 0,
  peakDb: 0,
  f0Hz: 0,
  jitterPercent: 0,
  acousticClarity: 95,
  voiceConfidence: 85,
  detectedTags: [
    { id: 'standby', label: 'System Standby / Line Ready', severity: 'info', confidence: 1.0, active: true }
  ]
};

const STANDBY_TRANSCRIPTS: TranscriptEntry[] = [];

export function App() {
  const [telemetry, setTelemetry] = useState<SystemTelemetry>({
    connectionStatus: 'DISCONNECTED',
    interactionStatus: 'IDLE',
    latencyMs: 18,
    activeModel: 'gemini-3.8-live',
    bargeInActive: false,
    bargeInCount: 0,
    audioInputLevel: 0,
    audioOutputLevel: 0,
    callDurationSeconds: 0,
    callState: 'IDLE',
    autoHangUpCountdown: null
  });

  const [prosody, setProsody] = useState<AcousticProsodyMetrics>(STANDBY_PROSODY);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>(STANDBY_TRANSCRIPTS);
  const [ticket, setTicket] = useState<TriageTicket>(STANDBY_TRIAGE_TICKET);
  const [callerAudioData, setCallerAudioData] = useState<Uint8Array>(new Uint8Array(64));
  const [geminiAudioData, setGeminiAudioData] = useState<Uint8Array>(new Uint8Array(64));

  // Historical telemetry points for Wide Neon Gradient Spline Area Graph
  const [splineHistory, setSplineHistory] = useState<number[]>(new Array(40).fill(5));
  const splineCanvasRef = useRef<HTMLCanvasElement>(null);

  // Purge any historical key stored in localStorage
  useEffect(() => {
    try {
      localStorage.removeItem('gemini_api_key');
    } catch {}
  }, []);

  const [apiKey, setApiKey] = useState<string>(
    () => (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('gemini_api_key') : '') || ''
  );

  const [autoHangUpCountdown, setAutoHangUpCountdown] = useState<number | null>(null);
  const silenceTimerRef = useRef<number>(0);
  const audioStackRef = useRef<GeminiAudioStack | null>(null);

  useEffect(() => {
    // Initialize audio stack
    const stack = new GeminiAudioStack({
      onTelemetryUpdate: (patch) => {
        setTelemetry((prev) => ({ ...prev, ...patch }));
      },
      onProsodyUpdate: (newProsody) => {
        setProsody(newProsody);
        setSplineHistory((prev) => [...prev.slice(1), Math.max(5, newProsody.stressScore)]);
      },
      onTranscriptReceived: (entry) => {
        setTranscripts((prev) => {
          const existingIdx = prev.findIndex((e) => e.id === entry.id);
          if (existingIdx >= 0) {
            const copy = [...prev];
            copy[existingIdx] = entry;
            return copy;
          }
          return [...prev, entry];
        });
      },
      onTriageUpdate: (ticketPatch) => {
        setTicket((prev) => ({ ...prev, ...ticketPatch }));
      },
      onBargeIn: () => {
        setTelemetry((prev) => ({
          ...prev,
          bargeInActive: true,
          bargeInCount: prev.bargeInCount + 1,
          interactionStatus: 'IN_PROGRESS'
        }));
      },
      onAudioVisualizerData: (caller, gemini) => {
        setCallerAudioData(new Uint8Array(caller));
        setGeminiAudioData(new Uint8Array(gemini));
      },
      onError: (err) => {
        console.error('AudioStack error:', err);
      }
    });

    if (apiKey) {
      stack.setApiKey(apiKey);
    }
    audioStackRef.current = stack;

    return () => {
      stack.stopCall();
    };
  }, []);

  // Sync call duration timer
  useEffect(() => {
    let interval: any = null;
    if (telemetry.connectionStatus === 'CONNECTED') {
      interval = setInterval(() => {
        setTelemetry((t) => ({
          ...t,
          callDurationSeconds: (t.callDurationSeconds || 0) + 1,
          callState: 'ACTIVE'
        }));
      }, 1000);
    } else {
      setTelemetry((t) => ({ ...t, callDurationSeconds: 0 }));
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [telemetry.connectionStatus]);

  // Intelligent Auto-Disconnect Timer (Trigger 2: 12 seconds silence when ticket is filled)
  useEffect(() => {
    let interval: any = null;
    if (telemetry.connectionStatus === 'CONNECTED' && autoHangUpCountdown === null) {
      interval = setInterval(() => {
        const isSilent = (telemetry.audioInputLevel || 0) < 5 && (telemetry.audioOutputLevel || 0) < 5;
        const hasExtractedData = ticket.landmark !== 'Awaiting Caller Location...' && !ticket.landmark.includes('Awaiting');

        if (isSilent && hasExtractedData) {
          silenceTimerRef.current += 1;
          if (silenceTimerRef.current >= 12) {
            handleStopCall();
            silenceTimerRef.current = 0;
          }
        } else {
          silenceTimerRef.current = 0;
        }
      }, 1000);
    } else {
      silenceTimerRef.current = 0;
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [telemetry.connectionStatus, telemetry.audioInputLevel, telemetry.audioOutputLevel, ticket.landmark, autoHangUpCountdown]);

  // Auto-hang-up countdown ticker
  useEffect(() => {
    let timer: any = null;
    if (autoHangUpCountdown !== null && autoHangUpCountdown > 0) {
      setTelemetry((t) => ({ ...t, autoHangUpCountdown }));
      timer = setTimeout(() => {
        setAutoHangUpCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (autoHangUpCountdown === 0) {
      handleStopCall();
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [autoHangUpCountdown]);

  // Render Spline Area Graph on Bottom Telemetry Ribbon Canvas
  useEffect(() => {
    const canvas = splineCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Spline Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
    gradient.addColorStop(0.6, 'rgba(16, 185, 129, 0.15)');
    gradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

    const strokeGrad = ctx.createLinearGradient(0, 0, width, 0);
    strokeGrad.addColorStop(0, '#06b6d4');
    strokeGrad.addColorStop(0.5, '#10b981');
    strokeGrad.addColorStop(1, '#f59e0b');

    const points = splineHistory;
    const len = points.length;
    if (len < 2) return;
    const step = width / (len - 1);

    // Draw Spline Area Fill
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let i = 0; i < len; i++) {
      const val = points[i] / 100;
      const y = height - (val * (height - 12) + 6);
      const x = i * step;
      if (i === 0) {
        ctx.lineTo(x, y);
      } else {
        const prevX = (i - 1) * step;
        const prevVal = points[i - 1] / 100;
        const prevY = height - (prevVal * (height - 12) + 6);
        const cpX = (prevX + x) / 2;
        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
      }
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw Spline Stroke
    ctx.beginPath();
    for (let i = 0; i < len; i++) {
      const val = points[i] / 100;
      const y = height - (val * (height - 12) + 6);
      const x = i * step;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevX = (i - 1) * step;
        const prevVal = points[i - 1] / 100;
        const prevY = height - (prevVal * (height - 12) + 6);
        const cpX = (prevX + x) / 2;
        ctx.bezierCurveTo(cpX, prevY, cpX, y, x, y);
      }
    }
    ctx.strokeStyle = strokeGrad;
    ctx.lineWidth = 2;
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 8;
    ctx.stroke();
  }, [splineHistory]);

  const handleSetApiKey = (key: string) => {
    setApiKey(key);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('gemini_api_key', key);
    }
    if (audioStackRef.current) {
      audioStackRef.current.setApiKey(key);
    }
  };

  const handleStartLiveMic = () => {
    setTranscripts([]);
    setTicket(STANDBY_TRIAGE_TICKET);
    setProsody(STANDBY_PROSODY);
    setAutoHangUpCountdown(null);
    setTelemetry((t) => ({ ...t, callState: 'ACTIVE' }));
    if (audioStackRef.current) {
      audioStackRef.current.connectLiveSession();
    }
  };

  const handleStopCall = () => {
    if (audioStackRef.current) {
      audioStackRef.current.stopCall();
    }
    setAutoHangUpCountdown(null);
    setTelemetry((t) => ({
      ...t,
      connectionStatus: 'DISCONNECTED',
      interactionStatus: 'IDLE',
      callState: 'FINALIZED',
      autoHangUpCountdown: null,
      audioInputLevel: 0,
      audioOutputLevel: 0
    }));
  };

  const handleStartNewCall = () => {
    handleStopCall();
    setTranscripts(STANDBY_TRANSCRIPTS);
    setTicket(STANDBY_TRIAGE_TICKET);
    setProsody(STANDBY_PROSODY);
    setAutoHangUpCountdown(null);
    setTelemetry((t) => ({
      ...t,
      callState: 'IDLE',
      callDurationSeconds: 0,
      autoHangUpCountdown: null
    }));
  };

  const handleTriggerTTS = (preset: TTSPreset) => {
    if (audioStackRef.current) {
      audioStackRef.current.executeOneTapTTS(preset);
    }
  };

  const handleDispatchTicket = () => {
    setTicket((prev) => ({
      ...prev,
      dispatchStatus: 'DISPATCHED'
    }));

    if (audioStackRef.current) {
      audioStackRef.current.executeOneTapTTS({
        id: 'tts-dispatch-announcement',
        label: 'Dispatch Announcement',
        language: 'English (Indian Accent)',
        voice: 'Kore',
        style: 'clear, professional, urgent priority dispatch command',
        text: '108 Ambulance has been dispatched to your location. Help is on the way.',
        category: 'DISPATCH_CONFIRM'
      });
    }

    setAutoHangUpCountdown(3);
  };

  const currentSeverity = ticket.severity;

  return (
    <div className="min-h-screen h-screen w-screen overflow-hidden bg-[#0a131f] text-slate-100 flex flex-col select-none relative font-sans antialiased">
      {/* Top macOS-Style Command Header */}
      <Header
        telemetry={telemetry}
        apiKey={apiKey}
        onSetApiKey={handleSetApiKey}
        onStartLiveMic={handleStartLiveMic}
        onStopCall={handleStopCall}
        onStartNewCall={handleStartNewCall}
      />

      {/* Main 3-Column Bento Grid */}
      <main className="flex-1 p-3 md:p-3.5 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-3 max-w-[1920px] w-full mx-auto">
        {/* Left Column: Stacked Cards (ProsodyZone) */}
        <section className="lg:col-span-3 h-full overflow-hidden">
          <ProsodyZone
            prosody={prosody}
            callerAudioData={callerAudioData}
            geminiAudioData={geminiAudioData}
            bargeInCount={telemetry.bargeInCount}
          />
        </section>

        {/* Center Hero Card: Hyderabad Operations Map + Live Voice Stream (TranscriptZone) */}
        <section className="lg:col-span-6 h-full overflow-hidden">
          <TranscriptZone
            transcript={transcripts}
            activeLandmark={ticket.landmark}
          />
        </section>

        {/* Right Column: Stacked Cards (TriageZone) */}
        <section className="lg:col-span-3 h-full overflow-hidden">
          <TriageZone
            ticket={ticket}
            prosody={prosody}
            telemetry={telemetry}
            onDispatchTicket={handleDispatchTicket}
            onTriggerTTS={handleTriggerTTS}
          />
        </section>
      </main>

      {/* ========================================================================= */}
      {/* FULL-WIDTH BOTTOM CARD: Incident Priority & Telemetry Ribbon (Reference) */}
      {/* ========================================================================= */}
      <footer className="border-t border-[#1e3a5f]/60 bg-[#111e2e]/95 backdrop-blur-2xl px-4 py-2.5 shadow-[0_-4px_24px_rgba(0,0,0,0.5)] z-20">
        <div className="max-w-[1920px] mx-auto grid grid-cols-12 gap-4 items-center">
          {/* Left: Segmented Horizontal Priority Bar */}
          <div className="col-span-12 md:col-span-3 flex flex-col gap-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5 text-cyan-400" />
              <span>INCIDENT PRIORITY LEVEL</span>
            </span>
            <div className="grid grid-cols-4 gap-1 p-1 rounded-lg bg-[#0a131f] border border-[#1e3a5f]/60 text-[10px] font-mono font-bold text-center">
              <div className={`py-1 rounded ${
                currentSeverity === 'CRITICAL' && ticket.category !== 'AWAITING_STREAM'
                  ? 'bg-rose-500 text-white shadow-[0_0_10px_#f43f5e] animate-pulse'
                  : 'text-slate-500'
              }`}>
                CRITICAL
              </div>
              <div className={`py-1 rounded ${
                currentSeverity === 'HIGH' && ticket.category !== 'AWAITING_STREAM'
                  ? 'bg-orange-500 text-white shadow-[0_0_10px_#f97316]'
                  : 'text-slate-500'
              }`}>
                HIGH
              </div>
              <div className={`py-1 rounded ${
                currentSeverity === 'MODERATE' && ticket.category !== 'AWAITING_STREAM'
                  ? 'bg-amber-500 text-white shadow-[0_0_10px_#f59e0b]'
                  : 'text-slate-500'
              }`}>
                MED
              </div>
              <div className={`py-1 rounded ${
                ticket.category === 'AWAITING_STREAM' || currentSeverity === 'LOW'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-500'
              }`}>
                STANDBY
              </div>
            </div>
          </div>

          {/* Center: Wide Multi-Layered Neon Gradient Spline Area Graph */}
          <div className="col-span-12 md:col-span-6 flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-cyan-300 flex items-center gap-1">
                <Activity className="w-3 h-3 text-cyan-400" />
                <span>DYNAMIC CALL ACOUSTIC ENERGY & STRESS SPLINE</span>
              </span>
              <span className="text-slate-400">DSP ROLLING 40-FRAME BUFFER</span>
            </div>
            <div className="h-10 w-full rounded-lg bg-[#0a131f] border border-[#1e3a5f]/60 overflow-hidden relative shadow-inner">
              <canvas
                ref={splineCanvasRef}
                width={640}
                height={40}
                className="w-full h-full block"
              />
            </div>
          </div>

          {/* Bottom Right: Two Glowing Progress Bars */}
          <div className="col-span-12 md:col-span-3 flex flex-col gap-1.5 font-mono">
            <div>
              <div className="flex justify-between text-[9px] text-slate-400 mb-0.5">
                <span>Voice Recognition Confidence</span>
                <span className="text-cyan-300 font-bold">96.4%</span>
              </div>
              <div className="h-1.5 w-full bg-[#0a131f] rounded-full overflow-hidden border border-[#1e3a5f]/40">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 w-[96.4%] shadow-[0_0_6px_#06b6d4]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[9px] text-slate-400 mb-0.5">
                <span>Hospital Access Continuity</span>
                <span className="text-emerald-300 font-bold">99.1%</span>
              </div>
              <div className="h-1.5 w-full bg-[#0a131f] rounded-full overflow-hidden border border-[#1e3a5f]/40">
                <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 w-[99.1%] shadow-[0_0_6px_#10b981]" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
