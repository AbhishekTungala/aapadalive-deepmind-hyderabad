import { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ProsodyZone } from './components/ProsodyZone';
import { TranscriptZone } from './components/TranscriptZone';
import { TriageZone } from './components/TriageZone';
import { GeminiAudioStack } from './services/geminiAudioStack';
import type {
  SystemTelemetry,
  AcousticProsodyMetrics,
  TranscriptEntry,
  TriageTicket,
  TTSPreset
} from './types';

// Standby Initial State: Completely clean without any pre-loaded mock incidents
const STANDBY_TRIAGE_TICKET: TriageTicket = {
  ticketId: 'STANDBY-108',
  timestamp: '--:--:--',
  category: 'ROAD_ACCIDENT',
  categoryLabel: 'System Standby',
  severity: 'MODERATE',
  landmark: 'Awaiting Incoming Call...',
  exactLocation: 'Telangana 108 Emergency Dispatch Network',
  extractedVitals: {
    consciousness: 'System on standby',
    breathing: 'Acoustic prosody idle',
    pulseStatus: 'Ready',
    bloodLoss: 'None',
    traumaNotes: 'No active incident. Ready for incoming dispatch.'
  },
  callerIdentity: {
    phone: 'Line Ready',
    vehiclePlate: 'Scanning...'
  },
  recommendedUnit: {
    unitType: '108 Fleet Standby',
    unitId: 'Available',
    etaMinutes: 0,
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
      },
      onTranscriptReceived: (entry) => {
        setTranscripts((prev) => [...prev, entry]);
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

  // Sync auto hang-up countdown state into telemetry
  useEffect(() => {
    setTelemetry((t) => ({ ...t, autoHangUpCountdown }));
  }, [autoHangUpCountdown]);

  // Auto Hang-off countdown decrementer (Trigger 1)
  useEffect(() => {
    if (autoHangUpCountdown === null) return;

    if (autoHangUpCountdown > 0) {
      const timer = setTimeout(() => {
        setAutoHangUpCountdown((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (autoHangUpCountdown === 0) {
      handleStopCall();
      setAutoHangUpCountdown(null);
      setTelemetry((t) => ({ ...t, callState: 'FINALIZED' }));
    }
  }, [autoHangUpCountdown]);

  // Silence watchdog timer (Trigger 2: auto-disconnect if silence for 15s after dispatch)
  useEffect(() => {
    let silenceInterval: any = null;
    if (ticket.dispatchStatus === 'DISPATCHED' && telemetry.connectionStatus === 'CONNECTED') {
      silenceInterval = setInterval(() => {
        if (telemetry.audioInputLevel < 5) {
          silenceTimerRef.current += 1;
          if (silenceTimerRef.current >= 15) {
            console.log('[AapadaLive] Silence timeout reached (15s post-dispatch) - auto hanging up');
            handleStopCall();
            setTelemetry((t) => ({ ...t, callState: 'FINALIZED' }));
          }
        } else {
          silenceTimerRef.current = 0;
        }
      }, 1000);
    } else {
      silenceTimerRef.current = 0;
    }

    return () => {
      if (silenceInterval) clearInterval(silenceInterval);
    };
  }, [ticket.dispatchStatus, telemetry.connectionStatus, telemetry.audioInputLevel]);

  const handleSetApiKey = (key: string) => {
    setApiKey(key);
    sessionStorage.setItem('gemini_api_key', key);
    try {
      localStorage.removeItem('gemini_api_key');
    } catch {}
    if (audioStackRef.current) {
      audioStackRef.current.setApiKey(key);
    }
  };

  const handleStartLiveMic = () => {
    setTranscripts([]);
    setTicket({
      ticketId: `HYD-108-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString(),
      category: 'ROAD_ACCIDENT',
      categoryLabel: 'Awaiting Caller Voice...',
      severity: 'MODERATE',
      landmark: 'Listening for landmark...',
      exactLocation: 'Hyderabad Dispatch Line Open',
      extractedVitals: {
        consciousness: 'Listening to caller audio...',
        breathing: 'Acoustic prosody monitor active',
        pulseStatus: 'Evaluating',
        bloodLoss: 'Evaluating',
        traumaNotes: 'Speak into microphone to populate live triage assessment'
      },
      callerIdentity: {
        phone: 'Live Emergency Line',
        vehiclePlate: 'Monitoring audio...'
      },
      recommendedUnit: {
        unitType: 'ALS-108 Ambulance Unit (Standby)',
        unitId: 'Standby',
        etaMinutes: 4,
        specialEquipment: ['Oxygen', 'First Aid', 'AED']
      },
      dispatchStatus: 'PENDING_APPROVAL',
      lastUpdated: new Date().toLocaleTimeString()
    });
    setProsody({
      stressScore: 0,
      pitchVarianceHz: 0,
      speechRateWpm: 0,
      snrDb: 0,
      detectedTags: [
        { id: 'live-open', label: '108 Live Audio Line Open — Listening to Mic', severity: 'info', confidence: 1.0, active: true }
      ]
    });
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

  const handleStartScenario = (scenario: 'PVNR_ACCIDENT' | 'GACHIBOWLI_CARDIAC' | 'BALANAGAR_FIRE') => {
    setTranscripts([]);
    setTelemetry((t) => ({ ...t, callState: 'ACTIVE' }));
    if (audioStackRef.current) {
      audioStackRef.current.startSimulatedDemoCall(scenario);
    }
  };

  const handleTriggerTTS = (preset: TTSPreset) => {
    if (audioStackRef.current) {
      audioStackRef.current.executeOneTapTTS(preset);
    }
  };

  // Trigger 1: When dispatch is authorized, announce and trigger auto hang-off in 3s
  const handleDispatchTicket = () => {
    setTicket((prev) => ({
      ...prev,
      dispatchStatus: 'DISPATCHED'
    }));

    // Announce via TTS
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

    // Initiate 3s countdown to auto hang-off
    setAutoHangUpCountdown(3);
  };

  return (
    <div className="min-h-screen h-screen w-screen overflow-hidden bg-[#07090e] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/20 via-[#07090e] to-[#030508] text-slate-100 flex flex-col select-none relative font-sans antialiased">
      {/* Top Header */}
      <Header
        telemetry={telemetry}
        apiKey={apiKey}
        onSetApiKey={handleSetApiKey}
        onStartLiveMic={handleStartLiveMic}
        onStopCall={handleStopCall}
        onStartNewCall={handleStartNewCall}
        onStartScenario={handleStartScenario}
      />

      {/* Main Tactical Grid Cards */}
      <main className="flex-1 p-3.5 md:p-4 lg:p-5 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-3.5 md:gap-4 lg:gap-5 max-w-[1920px] w-full mx-auto">
        {/* Zone 1 (Left): Vocal Prosody & Acoustic Telemetry HUD */}
        <section className="lg:col-span-3 h-full overflow-hidden">
          <ProsodyZone
            prosody={prosody}
            callerAudioData={callerAudioData}
            geminiAudioData={geminiAudioData}
          />
        </section>

        {/* Zone 2 (Center): Live Code-Switched Transcript & Translation Stream */}
        <section className="lg:col-span-5 h-full overflow-hidden">
          <TranscriptZone
            transcripts={transcripts}
          />
        </section>

        {/* Zone 3 (Right): Auto-Populating Incident Triage Ticket & One-Tap Actions */}
        <section className="lg:col-span-4 h-full overflow-hidden">
          <TriageZone
            ticket={ticket}
            onDispatchTicket={handleDispatchTicket}
            onTriggerTTS={handleTriggerTTS}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
