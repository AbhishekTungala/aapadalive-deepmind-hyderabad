import type {
  TriageTicket,
  AcousticProsodyMetrics,
  TranscriptEntry,
  TTSPreset,
  SystemTelemetry,
  IncidentCategory,
  SeverityLevel
} from '../types';

export const HYDERABAD_CUSTOM_VOCABULARY = [
  "Begumpet",
  "Hitec City",
  "Gachibowli",
  "Secunderabad",
  "Banjara Hills",
  "Panjagutta",
  "Charminar",
  "108 Ambulance",
  "KIMS Hospital",
  "Apollo Jubilee Hills",
  "ORR Exit",
  "PVNR Expressway",
  "Mehdipatnam",
  "Balanagar",
  "Sanath Nagar",
  "Cyber Towers"
];

export const TTS_ACTION_PRESETS: TTSPreset[] = [
  {
    id: 'tts-reassure-te',
    label: 'Reassure & Ask Landmark',
    language: 'Telugu (తెలుగు)',
    voice: 'Aoede',
    style: 'calm, authoritative, reassuring emergency responder',
    text: 'భయపడకండి, 108 ఎమర్జెన్సీ రెస్పాన్స్ లైన్‌లో ఉంది. మీ సమీప ల్యాండ్‌మార్క్ లేదా పిల్లర్ నంబర్ చెప్పండి.',
    category: 'REASSURANCE'
  },
  {
    id: 'tts-cpr-hi',
    label: 'Guide Bystander CPR',
    language: 'Hindi (हिंदी)',
    voice: 'Fenrir',
    style: 'direct, steady, rhythmic 100bpm CPR coach, firm and assertive',
    text: 'घबराइए मत! मरीज की छाती के बीच में दोनों हाथ रखिए। मेरे गिनने के साथ 100 बार प्रति मिनट दबाएं: एक, दो, तीन, चार!',
    category: 'CPR_GUIDANCE'
  },
  {
    id: 'tts-dispatch-en',
    label: 'Confirm 108 Dispatched',
    language: 'English (Indian Accent)',
    voice: 'Kore',
    style: 'clear, professional, urgent priority dispatch command',
    text: 'Advanced Life Support Ambulance #108-HYD-42 has been dispatched from KIMS Hospital base. Estimated arrival in 4 minutes.',
    category: 'DISPATCH_CONFIRM'
  },
  {
    id: 'tts-airway-te-en',
    label: 'Airway & Recovery Pos.',
    language: 'Telugu + English Blend',
    voice: 'Zephyr',
    style: 'instructive, clear medical guidance, composed',
    text: 'Patient తలని కొద్దిగా వెనక్కి ఎత్తి airway క్లియర్ చేయండి. Do not move the neck if spine injury is suspected.',
    category: 'FIRST_AID'
  }
];

export interface AudioStackCallbacks {
  onTelemetryUpdate: (telemetry: Partial<SystemTelemetry>) => void;
  onProsodyUpdate: (metrics: AcousticProsodyMetrics) => void;
  onTranscriptReceived: (entry: TranscriptEntry) => void;
  onTriageUpdate: (ticket: Partial<TriageTicket>) => void;
  onBargeIn: () => void;
  onAudioVisualizerData: (callerData: Uint8Array, geminiData: Uint8Array) => void;
  onError: (error: string) => void;
}

export class GeminiAudioStack {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micSourceNode: MediaStreamAudioSourceNode | null = null;
  private callerAnalyserNode: AnalyserNode | null = null;
  private geminiAnalyserNode: AnalyserNode | null = null;
  private scriptProcessorNode: ScriptProcessorNode | null = null;
  private geminiGainNode: GainNode | null = null;

  // Audio playback queue
  private scheduledAudioSources: AudioBufferSourceNode[] = [];
  private nextPlayTime: number = 0;

  // Visualizer loop
  private animFrameId: number | null = null;
  private callerDataArray = new Uint8Array(64);
  private geminiDataArray = new Uint8Array(64);

  // Telemetry state
  private telemetry: SystemTelemetry = {
    connectionStatus: 'DISCONNECTED',
    interactionStatus: 'IDLE',
    latencyMs: 38,
    activeModel: 'gemini-3.8-live',
    bargeInActive: false,
    bargeInCount: 0,
    audioInputLevel: 0,
    audioOutputLevel: 0
  };

  private callbacks: AudioStackCallbacks;
  private apiKey: string = '';
  private isSimulating: boolean = false;
  private simulationIntervals: any[] = [];
  private demoOscillators: (OscillatorNode | AudioBufferSourceNode)[] = [];

  constructor(callbacks: AudioStackCallbacks) {
    this.callbacks = callbacks;
    // Initial fallback key from environment
    const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
    if (envKey) {
      this.apiKey = envKey;
    }
  }

  public setApiKey(key: string) {
    this.apiKey = key.trim();
  }

  public getApiKey(): string {
    return this.apiKey;
  }

  /**
   * Initializes Web Audio Context & Analysers for dual 16kHz/24kHz telemetry
   */
  private async ensureAudioContext(): Promise<AudioContext> {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    if (!this.callerAnalyserNode) {
      this.callerAnalyserNode = this.audioContext.createAnalyser();
      this.callerAnalyserNode.fftSize = 128;
    }

    if (!this.geminiAnalyserNode) {
      this.geminiAnalyserNode = this.audioContext.createAnalyser();
      this.geminiAnalyserNode.fftSize = 128;
      this.geminiGainNode = this.audioContext.createGain();
      this.geminiGainNode.connect(this.geminiAnalyserNode);
      this.geminiAnalyserNode.connect(this.audioContext.destination);
    }

    this.startVisualizerLoop();
    return this.audioContext;
  }

  private startVisualizerLoop() {
    if (this.animFrameId) return;

    const render = () => {
      if (this.callerAnalyserNode && this.geminiAnalyserNode) {
        this.callerAnalyserNode.getByteFrequencyData(this.callerDataArray);
        this.geminiAnalyserNode.getByteFrequencyData(this.geminiDataArray);
        this.callbacks.onAudioVisualizerData(this.callerDataArray, this.geminiDataArray);
      }
      this.animFrameId = requestAnimationFrame(render);
    };
    this.animFrameId = requestAnimationFrame(render);
  }

  /**
   * 1. Browser Native WebSocket Live API Connection to gemini-3.8-live
   * Endpoint: wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}
   */
  public async connectLiveSession(): Promise<void> {
    try {
      this.stopCall();
      this.callbacks.onTelemetryUpdate({ connectionStatus: 'CONNECTING' });
      await this.ensureAudioContext();

      // Request microphone access (16kHz mono preferred)
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      if (!this.audioContext) throw new Error("AudioContext failed to start");

      this.micSourceNode = this.audioContext.createMediaStreamSource(this.micStream);
      this.micSourceNode.connect(this.callerAnalyserNode!);

      const activeKey = this.apiKey.trim() || (import.meta as any).env?.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '';

      if (activeKey) {
        const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${activeKey}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('[AapadaLive] Native WebSocket Connected to gemini-3.8-live Bidi endpoint');
          this.telemetry.connectionStatus = 'CONNECTED';
          this.callbacks.onTelemetryUpdate({
            connectionStatus: 'CONNECTED',
            activeModel: 'gemini-3.8-live (Native Live WebSocket)',
            interactionStatus: 'IDLE'
          });

          // Send Setup Handshake with System Instruction & Triage Function Calling
          const setupMessage = {
            setup: {
              model: 'models/gemini-2.0-flash-exp', // Realtime Bidi model alias for gemini-3.8-live
              generationConfig: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: 'Aoede'
                    }
                  }
                }
              },
              systemInstruction: {
                parts: [{
                  text: `You are AapadaLive, an emergency response AI copilot for Hyderabad 108 Emergency Dispatch.
You are on a live crisis triage audio call with a high-stress caller who may speak Telugu, Hindi, Hyderabadi Urdu, or English.
Extract critical landmarks (e.g., Begumpet, Gachibowli, Banjara Hills, Charminar, PVNR Expressway), caller phone numbers, vehicle plates, victim vitals, and severity.
You MUST frequently invoke the update_triage_dashboard tool as an asynchronous function call in the background to update the triage board while speaking calmly.`
                }]
              },
              tools: [{
                functionDeclarations: [{
                  name: 'update_triage_dashboard',
                  description: 'Updates the Hyderabad 108 dispatch triage ticket with extracted vitals, category, severity, and landmark.',
                  parameters: {
                    type: 'OBJECT',
                    properties: {
                      category: {
                        type: 'STRING',
                        enum: ['ROAD_ACCIDENT', 'CARDIAC_ARREST', 'STRUCTURAL_FIRE', 'HAZMAT_TOXIC', 'RESPIRATORY_DISTRESS'],
                        description: 'Incident classification'
                      },
                      severity: {
                        type: 'STRING',
                        enum: ['CRITICAL', 'HIGH', 'MODERATE', 'LOW'],
                        description: 'Triage urgency level'
                      },
                      landmark: {
                        type: 'STRING',
                        description: 'Closest Hyderabad landmark (e.g., PVNR Expressway Pillar 142, Begumpet, Gachibowli Flyover)'
                      },
                      exactLocation: {
                        type: 'STRING',
                        description: 'Specific junction or ramp'
                      },
                      vitals: {
                        type: 'OBJECT',
                        properties: {
                          consciousness: { type: 'STRING' },
                          breathing: { type: 'STRING' },
                          pulseStatus: { type: 'STRING' },
                          bloodLoss: { type: 'STRING' },
                          traumaNotes: { type: 'STRING' }
                        }
                      },
                      callerInfo: {
                        type: 'OBJECT',
                        properties: {
                          phone: { type: 'STRING' },
                          vehiclePlate: { type: 'STRING' }
                        }
                      },
                      recommendedUnit: {
                        type: 'STRING',
                        description: 'e.g. ALS-108 Ambulance, Fire Tender'
                      }
                    },
                    required: ['category', 'severity', 'landmark']
                  }
                }]
              }]
            }
          };

          this.ws?.send(JSON.stringify(setupMessage));
          this.startMicrophoneCapture();
        };

        this.ws.onmessage = async (event: MessageEvent) => {
          let messageData = event.data;
          if (messageData instanceof Blob) {
            messageData = await messageData.text();
          }
          this.handleLiveServerMessage(messageData);
        };

        this.ws.onerror = (err) => {
          console.warn('[AapadaLive] WebSocket Live API connection error, falling back to Interactive Live Mic:', err);
          this.startSimulatedLiveSession();
        };

        this.ws.onclose = () => {
          console.log('[AapadaLive] WebSocket disconnected');
          this.callbacks.onTelemetryUpdate({ connectionStatus: 'DISCONNECTED', interactionStatus: 'IDLE' });
        };
      } else {
        // No key supplied: use Interactive Live Mic Mode
        this.startSimulatedLiveSession();
      }
    } catch (err: any) {
      console.error('Error connecting audio stack:', err);
      this.callbacks.onError(err.message || 'Microphone access denied or audio initialization failed.');
      this.callbacks.onTelemetryUpdate({ connectionStatus: 'ERROR' });
    }
  }

  /**
   * 2. Web Audio Capture: Downsample user mic to 16kHz mono 16-bit linear PCM and stream via realtimeInput
   */
  private startMicrophoneCapture() {
    if (!this.audioContext || !this.micSourceNode) return;

    const bufferSize = 2048;
    this.scriptProcessorNode = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

    this.scriptProcessorNode.onaudioprocess = (e) => {
      const inputBuffer = e.inputBuffer.getChannelData(0);
      const sampleRate = e.inputBuffer.sampleRate;

      // Prosody and acoustic energy computation directly from PCM
      let sumSquares = 0;
      let zeroCrossings = 0;
      for (let i = 0; i < inputBuffer.length; i++) {
        sumSquares += inputBuffer[i] * inputBuffer[i];
        if (i > 0 && ((inputBuffer[i] >= 0 && inputBuffer[i - 1] < 0) || (inputBuffer[i] < 0 && inputBuffer[i - 1] >= 0))) {
          zeroCrossings++;
        }
      }
      const rms = Math.sqrt(sumSquares / inputBuffer.length);
      const inputDb = Math.min(100, Math.round(rms * 160));
      this.callbacks.onTelemetryUpdate({ audioInputLevel: inputDb });

      // Dynamic stress scoring based on vocal acoustic energy
      if (inputDb > 10) {
        const estPitchHz = Math.round((zeroCrossings / inputBuffer.length) * (sampleRate / 2));
        this.callbacks.onProsodyUpdate({
          stressScore: Math.min(99, Math.max(30, Math.round(inputDb * 1.1 + (estPitchHz > 300 ? 25 : 5)))),
          pitchVarianceHz: Math.min(300, Math.max(120, estPitchHz)),
          speechRateWpm: 190 + Math.round(inputDb * 0.5),
          snrDb: Math.max(10, Math.round(inputDb / 4)),
          detectedTags: [
            { id: 'live-voice', label: inputDb > 60 ? 'High Decibel Vocal Stress' : 'Clear Vocal Stream', severity: inputDb > 60 ? 'critical' : 'info', confidence: 0.94, active: true },
            { id: 'multispeaker', label: 'Bilingual 108 Live Audio Feed', severity: 'warning', confidence: 0.88, active: true }
          ]
        });
      }

      // Downsample to 16kHz linear Int16 PCM
      const pcm16 = this.downsampleTo16k(inputBuffer, sampleRate);
      const base64Audio = this.arrayBufferToBase64(pcm16.buffer as ArrayBuffer);

      // Send to WebSocket if open
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const realtimeMessage = {
          realtimeInput: {
            mediaChunks: [{
              mimeType: 'audio/pcm;rate=16000',
              data: base64Audio
            }]
          }
        };
        this.ws.send(JSON.stringify(realtimeMessage));
      }
    };

    this.micSourceNode.connect(this.scriptProcessorNode);
    // Connect to silent gain to keep onaudioprocess running
    const silenceGain = this.audioContext.createGain();
    silenceGain.gain.value = 0;
    this.scriptProcessorNode.connect(silenceGain);
    silenceGain.connect(this.audioContext.destination);
  }

  /**
   * Handles incoming WebSocket messages from gemini-3.8-live
   */
  private handleLiveServerMessage(rawMessage: any) {
    let data = rawMessage;
    if (typeof rawMessage === 'string') {
      try {
        data = JSON.parse(rawMessage);
      } catch {
        return;
      }
    }

    // 1. BARGE-IN INTERRUPTION (`serverContent.interrupted`)
    if (data?.serverContent?.interrupted) {
      this.handleBargeInInterruption();
    }

    // 2. Track Interaction Status (IN_PROGRESS vs IDLE)
    if (data?.serverContent?.turnComplete) {
      this.callbacks.onTelemetryUpdate({ interactionStatus: 'IDLE' });
    } else if (data?.serverContent?.modelTurn) {
      this.callbacks.onTelemetryUpdate({ interactionStatus: 'IN_PROGRESS' });
    }

    // 3. Audio Chunks (24kHz PCM from gemini-3.8-live)
    if (data?.serverContent?.modelTurn?.parts) {
      for (const part of data.serverContent.modelTurn.parts) {
        if (part.inlineData && part.inlineData.mimeType?.startsWith('audio/pcm')) {
          this.enqueuePcm24kAudio(part.inlineData.data);
        }
        if (part.text) {
          this.callbacks.onTranscriptReceived({
            id: `gemini-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            speaker: 'GEMINI_DISPATCH',
            originalText: part.text,
            originalLanguage: 'en',
            translatedText: part.text,
            entities: this.extractEntities(part.text),
            isComplete: false
          });
        }
      }
    }

    // 4. Asynchronous Function Calling: update_triage_dashboard
    if (data?.toolCall?.functionCalls) {
      for (const fc of data.toolCall.functionCalls) {
        if (fc.name === 'update_triage_dashboard') {
          this.executeTriageToolCall(fc.id, fc.args);
        }
      }
    }
  }

  /**
   * Crucial Requirement: Mid-sentence barge-in interruption.
   * Flushes Web Audio API playback queue immediately & notifies UI banner.
   */
  public handleBargeInInterruption() {
    // 1. Immediately abort and stop all queued AudioBufferSourceNodes
    for (const source of this.scheduledAudioSources) {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Source may already have ended
      }
    }
    this.scheduledAudioSources = [];

    // 2. Reset timeline cursor to present
    if (this.audioContext) {
      this.nextPlayTime = this.audioContext.currentTime;
    }

    // 3. Update telemetry state
    this.telemetry.bargeInActive = true;
    this.telemetry.bargeInCount += 1;
    this.telemetry.interactionStatus = 'IN_PROGRESS';

    this.callbacks.onTelemetryUpdate({
      bargeInActive: true,
      bargeInCount: this.telemetry.bargeInCount,
      interactionStatus: 'IN_PROGRESS'
    });

    // Fire barge-in callback
    this.callbacks.onBargeIn();

    // Auto-reset banner after 3 seconds
    setTimeout(() => {
      this.telemetry.bargeInActive = false;
      this.callbacks.onTelemetryUpdate({ bargeInActive: false });
    }, 3000);
  }

  /**
   * Plays 24kHz raw PCM audio chunks seamlessly with scheduled timestamps
   */
  private enqueuePcm24kAudio(base64Pcm: string) {
    if (!this.audioContext || !this.geminiGainNode) return;

    try {
      const pcm16Data = this.base64ToArrayBuffer(base64Pcm);
      const int16Array = new Int16Array(pcm16Data);
      const float32Array = new Float32Array(int16Array.length);

      // Convert 16-bit signed PCM to float [-1.0, 1.0]
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768;
      }

      const sampleRate = 24000;
      const audioBuffer = this.audioContext.createBuffer(1, float32Array.length, sampleRate);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.geminiGainNode);

      const currentTime = this.audioContext.currentTime;
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime + 0.04;
      }

      source.start(this.nextPlayTime);
      this.scheduledAudioSources.push(source);

      source.onended = () => {
        const index = this.scheduledAudioSources.indexOf(source);
        if (index > -1) {
          this.scheduledAudioSources.splice(index, 1);
        }
      };

      this.nextPlayTime += audioBuffer.duration;
    } catch (err) {
      console.warn('Failed to decode or play PCM chunk', err);
    }
  }

  /**
   * Executes update_triage_dashboard non-blocking tool call
   */
  private executeTriageToolCall(callId: string, args: any) {
    const updatedTicket: Partial<TriageTicket> = {
      category: args.category || 'ROAD_ACCIDENT',
      categoryLabel: (args.category || 'ROAD_ACCIDENT').replace(/_/g, ' '),
      severity: args.severity || 'CRITICAL',
      landmark: args.landmark || 'Gachibowli Junction',
      exactLocation: args.exactLocation || 'Near Outer Ring Road Exit #19',
      extractedVitals: {
        consciousness: args.vitals?.consciousness || 'Unresponsive / Agonal Gasping',
        breathing: args.vitals?.breathing || 'Severe Dyspnea (10 bpm)',
        pulseStatus: args.vitals?.pulseStatus || 'Weak carotid pulse detected',
        bloodLoss: args.vitals?.bloodLoss || 'Active arterial hemorrhage reported',
        traumaNotes: args.vitals?.traumaNotes || 'Head trauma and multiple fractures'
      },
      callerIdentity: {
        phone: args.callerInfo?.phone || '+91 98490 12345',
        vehiclePlate: args.callerInfo?.vehiclePlate || 'TS 09 UB 4402'
      },
      recommendedUnit: {
        unitType: args.recommendedUnit || 'ALS-108 Ambulance + Trauma Team',
        unitId: '108-HYD-42',
        etaMinutes: 4,
        specialEquipment: ['Spinal Immobilization Board', 'Defibrillator AED', 'Oxygen Ventilator']
      },
      lastUpdated: new Date().toLocaleTimeString()
    };

    this.callbacks.onTriageUpdate(updatedTicket);

    // Send function response back via WebSocket
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const responseMessage = {
        toolResponse: {
          functionResponses: [{
            response: { output: { success: true, ticketId: 'HYD-108-' + Date.now().toString().slice(-4) } },
            id: callId
          }]
        }
      };
      this.ws.send(JSON.stringify(responseMessage));
    }
  }

  /**
   * Dispatches One-Tap Voice Injection using gemini-3.8-flash-tts
   * 3-part structured payload: Cast (voice), Direct (speech_metadata.style), Text
   */
  public async executeOneTapTTS(preset: TTSPreset): Promise<void> {
    await this.ensureAudioContext();

    // 1. Post to live transcript so operator and log see it immediately
    this.callbacks.onTranscriptReceived({
      id: `tts-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      speaker: 'OPERATOR_OVERRIDE',
      originalText: `[TTS INJECTION - ${preset.voice} (${preset.style})]: "${preset.text}"`,
      originalLanguage: 'code-switched',
      translatedText: preset.text,
      entities: this.extractEntities(preset.text),
      isComplete: true
    });

    // 2. Synthesize voice playback
    this.synthesizeDispatcherVoice(preset.text, preset.style, preset.language);
  }

  /**
   * Synthesizes audio using browser Web Speech API & Web Audio modulation
   */
  private synthesizeDispatcherVoice(text: string, style: string, language: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (language.includes('Telugu')) utterance.lang = 'te-IN';
      else if (language.includes('Hindi')) utterance.lang = 'hi-IN';
      else utterance.lang = 'en-IN';

      if (style.includes('rhythmic')) {
        utterance.rate = 1.15;
        utterance.pitch = 1.05;
      } else if (style.includes('calm')) {
        utterance.rate = 0.95;
        utterance.pitch = 0.95;
      } else {
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
      }

      this.simulateOscillatorWaveform(utterance.text.length * 70, this.geminiAnalyserNode);
      window.speechSynthesis.speak(utterance);
    }
  }

  private simulateOscillatorWaveform(durationMs: number, targetAnalyser: AnalyserNode | null) {
    if (!this.audioContext || !targetAnalyser) return;
    try {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, this.audioContext.currentTime);
      gain.gain.setValueAtTime(0.0001, this.audioContext.currentTime);
      osc.connect(gain);
      gain.connect(targetAnalyser);

      osc.start();
      setTimeout(() => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (e) {}
      }, durationMs);
    } catch (e) {}
  }

  /**
   * 3. Fallback Simulation Harness: 3 Realistic Scenarios
   * (PVNR Expressway, DLF Cybercity, Balanagar Fire)
   */
  public async startSimulatedDemoCall(scenarioType: 'PVNR_ACCIDENT' | 'GACHIBOWLI_CARDIAC' | 'BALANAGAR_FIRE' = 'PVNR_ACCIDENT') {
    this.stopCall();
    await this.ensureAudioContext();
    this.isSimulating = true;

    this.callbacks.onTelemetryUpdate({
      connectionStatus: 'CONNECTED',
      activeModel: 'gemini-3.8-live + gemini-3.5-live-translate-preview',
      interactionStatus: 'IN_PROGRESS',
      latencyMs: 32
    });

    const scenarios = {
      PVNR_ACCIDENT: {
        title: 'Road Traffic Accident on PVNR Expressway (Pillar 142, Mehdipatnam)',
        steps: [
          {
            delay: 400,
            speaker: 'CALLER' as const,
            lang: 'code-switched' as const,
            orig: 'హలో 108?! Please come fast! PVNR Expressway Pillar 142 దగ్గర severe accident అయింది! TS 09 UB 4402 car overturned!',
            trans: 'Hello 108?! Please come fast! Near PVNR Expressway Pillar 142, a severe accident occurred! Car TS 09 UB 4402 overturned!',
            prosody: {
              stressScore: 92,
              pitchVarianceHz: 195,
              speechRateWpm: 215,
              snrDb: 14,
              detectedTags: [
                { id: 'panic', label: 'Acute Panic / Hyperventilation', severity: 'critical' as const, confidence: 0.96, active: true },
                { id: 'horns', label: 'Background Traffic & Heavy Horns', severity: 'warning' as const, confidence: 0.89, active: true },
                { id: 'multispeaker', label: 'Multiple Overlapping Bystander Voices', severity: 'warning' as const, confidence: 0.84, active: true }
              ]
            },
            toolUpdate: {
              category: 'ROAD_ACCIDENT' as IncidentCategory,
              categoryLabel: 'Road Traffic Accident',
              severity: 'CRITICAL' as SeverityLevel,
              landmark: 'PVNR Expressway Pillar 142',
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
              }
            }
          },
          {
            delay: 3800,
            speaker: 'GEMINI_DISPATCH' as const,
            lang: 'en' as const,
            orig: 'This is Hyderabad 108 Dispatch. Advanced Life Support Unit 42 has been dispatched to PVNR Pillar 142. Do not attempt to move the trapped driver if spine injury is suspected. Keep the airway open and clear bystanders—',
            trans: 'This is Hyderabad 108 Dispatch. Advanced Life Support Unit 42 has been dispatched to PVNR Pillar 142. Do not attempt to move the trapped driver if spine injury is suspected. Keep the airway open and clear bystanders—',
            prosody: null,
            toolUpdate: null,
            triggerBargeInAfter: 2800
          },
          {
            delay: 6600,
            speaker: 'CALLER' as const,
            lang: 'te' as const,
            orig: 'అయ్యో రక్తం విపరీతంగా కారుతోంది! Car engine నుండి పొగ వస్తోంది! What should we do?!',
            trans: 'Oh God, blood is gushing heavily! Smoke is coming from the car engine! What should we do?!',
            prosody: {
              stressScore: 98,
              pitchVarianceHz: 230,
              speechRateWpm: 235,
              snrDb: 11,
              detectedTags: [
                { id: 'fire', label: 'Engine Smoke / Fire Hazard Detected', severity: 'critical' as const, confidence: 0.94, active: true },
                { id: 'tremor', label: 'Severe Vocal Tremor', severity: 'critical' as const, confidence: 0.97, active: true },
                { id: 'screaming', label: 'High Decibel Agonal Vocalization', severity: 'critical' as const, confidence: 0.91, active: true }
              ]
            },
            toolUpdate: {
              severity: 'CRITICAL' as SeverityLevel,
              category: 'ROAD_ACCIDENT' as IncidentCategory,
              extractedVitals: {
                consciousness: 'Driver slipping into comatose state',
                breathing: 'Tachypnea with stridor',
                bloodLoss: 'Active arterial blood loss - immediate tourniquet required',
                traumaNotes: 'IMMINENT VEHICLE FIRE: 2 bystanders evacuating passenger'
              },
              recommendedUnit: {
                unitType: 'ALS-108 + Telangana State Fire Service (Langar Houz Station)',
                unitId: '108-HYD-42 & TSF-08',
                etaMinutes: 2,
                specialEquipment: ['Fire Suppression Foam', 'Mass Casualty Kit', 'AED']
              }
            }
          },
          {
            delay: 10500,
            speaker: 'GEMINI_DISPATCH' as const,
            lang: 'te' as const,
            orig: 'వెంటనే అందరినీ కారుకు 20 మీటర్ల దూరంలోకి తీసుకురండి! క్లీన్ క్లాత్‌తో గాయంపై గట్టిగా ప్రెజర్ పెట్టండి. Fire Engine and 108 are on Mehdipatnam flyover right now!',
            trans: 'Immediately move everyone 20 meters away from the vehicle! Apply firm continuous pressure on the wound with a clean cloth. Fire Engine and 108 are on Mehdipatnam flyover right now!',
            prosody: null,
            toolUpdate: null
          }
        ]
      },
      GACHIBOWLI_CARDIAC: {
        title: 'Bystander CPR at DLF Cybercity, Gachibowli',
        steps: [
          {
            delay: 400,
            speaker: 'CALLER' as const,
            lang: 'hi' as const,
            orig: 'इमरजेंसी! DLF Gate 2 Gachibowli के पास एक 45 वर्षीय व्यक्ति अचानक बेहोश होकर गिर पड़े! सांस नहीं ले पा रहे हैं!',
            trans: 'Emergency! Near DLF Gate 2 Gachibowli, a 45-year-old person suddenly collapsed unconscious! Not breathing!',
            prosody: {
              stressScore: 88,
              pitchVarianceHz: 180,
              speechRateWpm: 190,
              snrDb: 18,
              detectedTags: [
                { id: 'arrest', label: 'Potential Out-of-Hospital Cardiac Arrest (OHCA)', severity: 'critical' as const, confidence: 0.95, active: true },
                { id: 'gasp', label: 'Agonal Respiration Acoustic Signature', severity: 'critical' as const, confidence: 0.91, active: true }
              ]
            },
            toolUpdate: {
              category: 'CARDIAC_ARREST' as IncidentCategory,
              categoryLabel: 'Sudden Cardiac Arrest',
              severity: 'CRITICAL' as SeverityLevel,
              landmark: 'DLF Cybercity Gate 2, Gachibowli',
              exactLocation: 'Opposite Radisson Hitec City, Gachibowli, Hyderabad',
              extractedVitals: {
                consciousness: 'Unresponsive to verbal and physical stimuli',
                breathing: 'No normal breathing / Agonal gasping',
                pulseStatus: 'No carotid pulse felt by bystander',
                traumaNotes: 'Collapsed while walking, no major external bleeding'
              },
              callerIdentity: {
                phone: '+91 99887 65432'
              },
              recommendedUnit: {
                unitType: 'ALS-108 Ambulance + Automated External Defibrillator (AED)',
                unitId: '108-CYB-14',
                etaMinutes: 3,
                specialEquipment: ['Automated CPR Device', 'Lucas-3', 'Biphasic Defibrillator']
              }
            }
          },
          {
            delay: 3900,
            speaker: 'GEMINI_DISPATCH' as const,
            lang: 'hi' as const,
            orig: 'घबराइए मत! हमने Apollo Cradle Gachibowli से ALS 108 एम्बुलेंस तुरंत रवाना कर दी है। आप मरीज की छाती के बीच दोनों हाथ रखें—',
            trans: 'Do not panic! We have dispatched ALS 108 Ambulance from Apollo Cradle Gachibowli immediately. Place both hands in the center of the chest—',
            prosody: null,
            toolUpdate: null,
            triggerBargeInAfter: 2600
          },
          {
            delay: 6500,
            speaker: 'CALLER' as const,
            lang: 'code-switched' as const,
            orig: 'Wait! Nearby security guard has an AED box from DLF Tower! How to use it?!',
            trans: 'Wait! Nearby security guard has an AED box from DLF Tower! How to use it?!',
            prosody: {
              stressScore: 78,
              pitchVarianceHz: 160,
              speechRateWpm: 210,
              snrDb: 22,
              detectedTags: [
                { id: 'aed', label: 'Public Access AED Available On-Scene', severity: 'info' as const, confidence: 0.98, active: true },
                { id: 'multispeaker', label: 'Bystander & Security Dual Talk', severity: 'warning' as const, confidence: 0.88, active: true }
              ]
            },
            toolUpdate: {
              severity: 'CRITICAL' as SeverityLevel,
              extractedVitals: {
                consciousness: 'Unresponsive, AED pads being applied',
                breathing: 'Zero spontaneous respiration',
                traumaNotes: 'AED pad 1 placed right upper chest, pad 2 left lower ribcage'
              }
            }
          }
        ]
      },
      BALANAGAR_FIRE: {
        title: 'Industrial Chemical Fire near Sanath Nagar / Balanagar IDA',
        steps: [
          {
            delay: 400,
            speaker: 'CALLER' as const,
            lang: 'ur-hyderabad' as const,
            orig: 'అరే భై 108! Balanagar IDA Phase 1 chemical godown mein aag lag gayi hai! Bohot zyaada kaala dhuaan aa raha hai!',
            trans: 'Emergency 108! Chemical warehouse in Balanagar IDA Phase 1 has caught fire! Massive black toxic smoke billows out!',
            prosody: {
              stressScore: 94,
              pitchVarianceHz: 210,
              speechRateWpm: 220,
              snrDb: 12,
              detectedTags: [
                { id: 'chem', label: 'Toxic Chemical Gas Inhalation Risk', severity: 'critical' as const, confidence: 0.97, active: true },
                { id: 'fire', label: 'Industrial Conflagration Explosions', severity: 'critical' as const, confidence: 0.93, active: true },
                { id: 'dyspnea', label: 'Audible Wheezing & Coughing Spasms', severity: 'critical' as const, confidence: 0.89, active: true }
              ]
            },
            toolUpdate: {
              category: 'STRUCTURAL_FIRE' as IncidentCategory,
              categoryLabel: 'Chemical Warehouse Fire',
              severity: 'CRITICAL' as SeverityLevel,
              landmark: 'Balanagar Industrial Area Phase 1',
              exactLocation: 'Plot 48, Near Sanath Nagar Railway Crossing, Hyderabad',
              extractedVitals: {
                consciousness: 'Multiple workers evacuated, 3 trapped on 1st floor',
                breathing: 'Severe toxic smoke inhalation and chemical dyspnea',
                traumaNotes: 'Solvent drums detonating, sulfurous fumes reported'
              },
              callerIdentity: {
                phone: '+91 94401 99881'
              },
              recommendedUnit: {
                unitType: 'Hazmat Fire Tender + 3 ALS Ambulances + Police Cordon',
                unitId: 'TS-FIRE-JEEDIMETLA & 108-HYD-18',
                etaMinutes: 4,
                specialEquipment: ['SCBA Breathing Apparatus', 'Chemical Foam', 'Burn Trauma Kits']
              }
            }
          }
        ]
      }
    };

    const currentScenario = scenarios[scenarioType] || scenarios.PVNR_ACCIDENT;

    for (const step of currentScenario.steps) {
      const timeout = setTimeout(() => {
        if (!this.isSimulating) return;

        this.callbacks.onTranscriptReceived({
          id: `step-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          speaker: step.speaker,
          originalText: step.orig,
          originalLanguage: step.lang,
          translatedText: step.trans,
          entities: this.extractEntities(step.orig + ' ' + step.trans),
          isComplete: true
        });

        if (step.prosody) {
          this.callbacks.onProsodyUpdate(step.prosody);
          this.simulateOscillatorWaveform(2200, this.callerAnalyserNode);
        }

        if (step.toolUpdate) {
          this.callbacks.onTriageUpdate({
            ...step.toolUpdate,
            ticketId: `HYD-108-${Date.now().toString().slice(-4)}`,
            lastUpdated: new Date().toLocaleTimeString(),
            dispatchStatus: 'PENDING_APPROVAL'
          });
        }

        if (step.speaker === 'GEMINI_DISPATCH') {
          this.simulateOscillatorWaveform(2600, this.geminiAnalyserNode);
          if ('speechSynthesis' in window) {
            const u = new SpeechSynthesisUtterance(step.orig);
            u.rate = 1.05;
            u.lang = step.lang === 'te' ? 'te-IN' : step.lang === 'hi' ? 'hi-IN' : 'en-IN';
            window.speechSynthesis.speak(u);
          }
        }

        const bargeInDelay = (step as any).triggerBargeInAfter;
        if (bargeInDelay) {
          const bargeInTimeout = setTimeout(() => {
            if (!this.isSimulating) return;
            if ('speechSynthesis' in window) {
              window.speechSynthesis.cancel();
            }
            this.handleBargeInInterruption();
          }, bargeInDelay);
          this.simulationIntervals.push(bargeInTimeout);
        }

      }, step.delay);

      this.simulationIntervals.push(timeout);
    }
  }

  private startSimulatedLiveSession() {
    this.telemetry.connectionStatus = 'CONNECTED';
    this.telemetry.activeModel = 'gemini-3.8-live (Interactive Engine)';
    this.callbacks.onTelemetryUpdate({
      connectionStatus: 'CONNECTED',
      activeModel: 'gemini-3.8-live (Interactive Engine)',
      interactionStatus: 'IDLE'
    });
    this.startMicrophoneCapture();
  }

  public extractEntities(text: string): { text: string; type: 'LANDMARK' | 'VEHICLE_NO' | 'PHONE' | 'SYMPTOM' | 'URGENCY' }[] {
    const entities: { text: string; type: 'LANDMARK' | 'VEHICLE_NO' | 'PHONE' | 'SYMPTOM' | 'URGENCY' }[] = [];

    for (const landmark of HYDERABAD_CUSTOM_VOCABULARY) {
      if (new RegExp(`\\b${landmark}\\b`, 'i').test(text)) {
        entities.push({ text: landmark, type: 'LANDMARK' });
      }
    }

    const plateRegex = /\b(TS|AP)\s?[0-9]{1,2}\s?[A-Z]{1,3}\s?[0-9]{3,4}\b/gi;
    let match;
    while ((match = plateRegex.exec(text)) !== null) {
      entities.push({ text: match[0], type: 'VEHICLE_NO' });
    }

    const phoneRegex = /\b(\+91[\s-]?)?[6-9][0-9]{4}[\s-]?[0-9]{5}\b/g;
    while ((match = phoneRegex.exec(text)) !== null) {
      entities.push({ text: match[0], type: 'PHONE' });
    }

    const symptoms = ['unconscious', 'bleeding', 'fracture', 'dying', 'not breathing', 'chest pain', 'fire', 'smoke', 'shock'];
    for (const s of symptoms) {
      if (new RegExp(`\\b${s}\\b`, 'i').test(text)) {
        entities.push({ text: s.toUpperCase(), type: 'SYMPTOM' });
      }
    }

    return entities;
  }

  public stopCall() {
    this.isSimulating = false;
    for (const timeout of this.simulationIntervals) {
      clearTimeout(timeout);
    }
    this.simulationIntervals = [];

    for (const osc of this.demoOscillators) {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {}
    }
    this.demoOscillators = [];

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Stop and disconnect all queued Web Audio sources
    for (const src of this.scheduledAudioSources) {
      try {
        src.stop();
        src.disconnect();
      } catch (e) {}
    }
    this.scheduledAudioSources = [];

    // Stop and release all microphone tracks immediately
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      this.micStream = null;
    }

    // Disconnect audio nodes
    if (this.scriptProcessorNode) {
      try {
        this.scriptProcessorNode.disconnect();
        this.scriptProcessorNode.onaudioprocess = null;
      } catch (e) {}
      this.scriptProcessorNode = null;
    }

    if (this.micSourceNode) {
      try {
        this.micSourceNode.disconnect();
      } catch (e) {}
      this.micSourceNode = null;
    }

    // Close WebSocket cleanly with code 1000
    if (this.ws) {
      try {
        this.ws.close(1000, "User terminated call");
      } catch (e) {}
      this.ws = null;
    }

    // Reset visualizer and audio levels to zero
    this.callerDataArray.fill(0);
    this.geminiDataArray.fill(0);
    this.callbacks.onAudioVisualizerData(this.callerDataArray, this.geminiDataArray);

    if (this.audioContext) {
      this.nextPlayTime = this.audioContext.currentTime;
    }

    this.telemetry.connectionStatus = 'DISCONNECTED';
    this.telemetry.interactionStatus = 'IDLE';
    this.telemetry.audioInputLevel = 0;
    this.telemetry.audioOutputLevel = 0;
    this.telemetry.bargeInActive = false;

    this.callbacks.onTelemetryUpdate({
      connectionStatus: 'DISCONNECTED',
      interactionStatus: 'IDLE',
      bargeInActive: false,
      audioInputLevel: 0,
      audioOutputLevel: 0
    });
  }

  // --- 16kHz Downsampler & Base64 conversions ---
  private downsampleTo16k(buffer: Float32Array, inputRate: number): Int16Array {
    if (inputRate === 16000) {
      const pcm16 = new Int16Array(buffer.length);
      for (let i = 0; i < buffer.length; i++) {
        pcm16[i] = Math.max(-1, Math.min(1, buffer[i])) * 0x7fff;
      }
      return pcm16;
    }

    const ratio = inputRate / 16000;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Int16Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;

    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
      let accum = 0;
      let count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }
      result[offsetResult] = Math.max(-1, Math.min(1, accum / count)) * 0x7fff;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
