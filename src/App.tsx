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

const INITIAL_TRIAGE_TICKET: TriageTicket = {
  ticketId: 'HYD-108-INIT',
  timestamp: new Date().toLocaleTimeString(),
  category: 'ROAD_ACCIDENT',
  categoryLabel: 'Road Traffic Accident',
  severity: 'CRITICAL',
  landmark: 'PVNR Expressway (Pillar 142)',
  exactLocation: 'Mehdipatnam Ramp Descent, Hyderabad',
  extractedVitals: {
    consciousness: '2 victims unconscious, 1 driver trapped',
    breathing: 'Irregular, agonal gasping observed',
    pulseStatus: 'Rapid, thready',
    bloodLoss: 'Severe arterial laceration from shattered windshield',
    traumaNotes: 'Vehicle overturned on median, fuel leak suspected'
  },
  callerIdentity: {
    phone: '+91 98490 44108',
    vehiclePlate: 'TS 09 UB 4402'
  },
  recommendedUnit: {
    unitType: 'ALS-108 Ambulance + Extrication Hydraulic Cutter Unit',
    unitId: '108-HYD-42',
    etaMinutes: 3,
    specialEquipment: ['Jaws of Life Cutter', 'Cervical Collars', 'High-Flow O2']
  },
  dispatchStatus: 'PENDING_APPROVAL',
  lastUpdated: new Date().toLocaleTimeString()
};

const INITIAL_PROSODY: AcousticProsodyMetrics = {
  stressScore: 88,
  pitchVarianceHz: 182,
  speechRateWpm: 210,
  snrDb: 15,
  detectedTags: [
    { id: 'panic', label: 'Acute Panic / Hyperventilation', severity: 'critical', confidence: 0.95, active: true },
    { id: 'horns', label: 'Background Traffic & Heavy Horns', severity: 'warning', confidence: 0.89, active: true },
    { id: 'multispeaker', label: 'Multiple Overlapping Bystander Voices', severity: 'warning', confidence: 0.82, active: true }
  ]
};

const INITIAL_TRANSCRIPTS: TranscriptEntry[] = [
  {
    id: 'intro-1',
    timestamp: '11:38:02',
    speaker: 'CALLER',
    originalText: 'హలో 108?! Please come fast! PVNR Expressway Pillar 142 దగ్గర severe accident అయింది! TS 09 UB 4402 car overturned!',
    originalLanguage: 'code-switched',
    translatedText: 'Hello 108?! Please come fast! Near PVNR Expressway Pillar 142, a severe accident occurred! Car TS 09 UB 4402 overturned!',
    entities: [
      { text: 'PVNR Expressway', type: 'LANDMARK' },
      { text: 'TS 09 UB 4402', type: 'VEHICLE_NO' },
      { text: 'BLEEDING', type: 'SYMPTOM' }
    ],
    isComplete: true
  },
  {
    id: 'intro-2',
    timestamp: '11:38:05',
    speaker: 'GEMINI_DISPATCH',
    originalText: 'This is Hyderabad 108 Dispatch. Advanced Life Support Unit 42 has been dispatched to PVNR Pillar 142. Do not attempt to move the trapped driver if spine injury is suspected. Keep the airway open and clear bystanders—',
    originalLanguage: 'en',
    translatedText: 'This is Hyderabad 108 Dispatch. Advanced Life Support Unit 42 has been dispatched to PVNR Pillar 142. Do not attempt to move the trapped driver if spine injury is suspected. Keep the airway open and clear bystanders—',
    entities: [
      { text: 'PVNR Expressway', type: 'LANDMARK' }
    ],
    isComplete: true
  }
];

export function App() {
  const [telemetry, setTelemetry] = useState<SystemTelemetry>({
    connectionStatus: 'DISCONNECTED',
    interactionStatus: 'IDLE',
    latencyMs: 38,
    activeModel: 'gemini-3.8-live',
    bargeInActive: false,
    bargeInCount: 0,
    audioInputLevel: 0,
    audioOutputLevel: 0,
    callDurationSeconds: 0,
    callState: 'IDLE',
    autoHangUpCountdown: null
  });

  const [prosody, setProsody] = useState<AcousticProsodyMetrics>(INITIAL_PROSODY);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>(INITIAL_TRANSCRIPTS);
  const [ticket, setTicket] = useState<TriageTicket>(INITIAL_TRIAGE_TICKET);
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
      // Countdown reached 0: execute full teardown
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
      categoryLabel: 'Awaiting Voice Input...',
      severity: 'MODERATE',
      landmark: 'Listening for landmark...',
      exactLocation: 'Hyderabad Dispatch Line Open',
      extractedVitals: {
        consciousness: 'Listening to caller audio...',
        breathing: 'Acoustic prosody monitor active',
        pulseStatus: 'Awaiting report',
        bloodLoss: 'Awaiting report',
        traumaNotes: 'Speak into microphone to populate live triage assessment'
      },
      callerIdentity: {
        phone: 'Incoming Emergency Line',
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
    setTranscripts([]);
    setTicket({
      ...INITIAL_TRIAGE_TICKET,
      ticketId: `HYD-108-${Date.now().toString().slice(-4)}`,
      dispatchStatus: 'PENDING_APPROVAL',
      timestamp: new Date().toLocaleTimeString(),
      lastUpdated: new Date().toLocaleTimeString()
    });
    setProsody({
      stressScore: 10,
      pitchVarianceHz: 0,
      speechRateWpm: 0,
      snrDb: 6,
      detectedTags: [
        { id: 'line-ready', label: '108 Line Ready For Next Emergency', severity: 'info', confidence: 0.99, active: true }
      ]
    });
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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#06080d] text-slate-100 select-none">
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

      {/* Main 4-Zone Command Grid */}
      <main className="flex-1 p-3.5 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-3.5 max-w-[1920px] w-full mx-auto">
        {/* Zone 1 (Left): Vocal Prosody & Acoustic Telemetry */}
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
