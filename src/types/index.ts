export type VoiceToneIntensity = 'HIGH' | 'MODERATE' | 'CONVERSATIONAL' | 'LOW';

export interface StructuredVoiceAction {
  id: string;
  text: string;
  type: 'ACTION' | 'KEY_POINT' | 'DECISION' | 'FOLLOW_UP';
  priority?: 'HIGH' | 'MEDIUM' | 'NORMAL';
}

export interface VoiceActionTicket {
  sessionId: string;
  timestamp: string;
  vocalTone: string;
  detectedLanguage: string;
  detectedIntent: string;
  topicSummary: string;
  structuredActions: string[];
  entities: {
    text: string;
    type: 'LOCATION' | 'ACTION' | 'TOPIC' | 'ORGANIZATION' | 'METRIC';
  }[];
  activeLocation: string;
  lastUpdated: string;
  // Backward compatibility fields
  category?: string;
  categoryLabel?: string;
  severity?: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  landmark?: string;
  exactLocation?: string;
  extractedVitals?: {
    consciousness?: string;
    breathing?: string;
    pulseStatus?: string;
    bloodLoss?: string;
    traumaNotes?: string;
  };
  recommendedUnit?: {
    unitType: string;
    unitId: string;
    etaMinutes: number;
    specialEquipment: string[];
  };
  callerIdentity?: {
    name?: string;
    phone?: string;
    vehiclePlate?: string;
  };
  dispatchStatus?: string;
}

export type TriageTicket = VoiceActionTicket;

export interface AcousticProsodyMetrics {
  stressScore: number; // Reused as Vocal Energy & Expressiveness (0-100%)
  pitchVarianceHz: number;
  speechRateWpm: number;
  snrDb: number;
  peakDb?: number;
  f0Hz?: number;
  jitterPercent?: number;
  acousticClarity?: number;
  voiceConfidence?: number;
  detectedTags: {
    id: string;
    label: string;
    severity: 'critical' | 'warning' | 'info';
    confidence: number;
    active: boolean;
  }[];
}

export interface TranscriptEntry {
  id: string;
  timestamp: string;
  speaker: 'USER' | 'GEMINI_VOICE' | 'CALLER' | 'GEMINI_DISPATCH' | 'OPERATOR_OVERRIDE';
  originalText: string;
  originalLanguage: 'te' | 'hi' | 'ur' | 'en' | 'code-switched' | string;
  translatedText: string;
  englishTranslation?: string;
  voiceStyleBadge?: string;
  entities: {
    text: string;
    type: 'LOCATION' | 'ACTION' | 'TOPIC' | 'METRIC' | 'LANDMARK' | string;
  }[];
  isComplete: boolean;
}

export interface TTSPreset {
  id: string;
  label: string;
  language: string;
  voice: 'Kore' | 'Aoede' | 'Puck' | 'Fenrir' | 'Zephyr';
  style: string;
  text: string;
  englishTranslation?: string;
  category: 'ACTION_SUMMARY' | 'TRANSLATION_HINDI' | 'TRANSLATION_TELUGU' | 'BRAINSTORM';
}

export interface SystemTelemetry {
  connectionStatus: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';
  interactionStatus: 'IN_PROGRESS' | 'IDLE';
  latencyMs: number;
  activeModel: string;
  bargeInActive: boolean;
  bargeInCount: number;
  audioInputLevel: number;
  audioOutputLevel: number;
  callDurationSeconds?: number;
  callState?: 'IDLE' | 'ACTIVE' | 'FINALIZED';
  autoHangUpCountdown?: number | null;
}

// Runtime object exports so bundlers never fail on named imports
export const SystemTelemetry = {};
export const AcousticProsodyMetrics = {};
export const TranscriptEntry = {};
export const TriageTicket = {};
export const VoiceActionTicket = {};
export const TTSPreset = {};
export const VOXLIVE_MODULE_VERSION = '2026.2.0';

