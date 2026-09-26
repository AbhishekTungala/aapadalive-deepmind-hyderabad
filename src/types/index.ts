export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
export type IncidentCategory = 'ROAD_ACCIDENT' | 'CARDIAC_ARREST' | 'STRUCTURAL_FIRE' | 'HAZMAT_TOXIC' | 'RESPIRATORY_DISTRESS' | 'AWAITING_STREAM';

export interface TriageTicket {
  ticketId: string;
  timestamp: string;
  category: IncidentCategory;
  categoryLabel: string;
  severity: SeverityLevel;
  landmark: string;
  exactLocation: string;
  extractedVitals: {
    consciousness: string;
    breathing: string;
    pulseStatus?: string;
    bloodLoss?: string;
    traumaNotes?: string;
  };
  callerIdentity?: {
    name?: string;
    phone?: string;
    vehiclePlate?: string;
  };
  recommendedUnit: {
    unitType: string;
    unitId: string;
    etaMinutes: number;
    specialEquipment: string[];
  };
  dispatchStatus: 'PENDING_APPROVAL' | 'DISPATCHED' | 'EN_ROUTE' | 'ON_SCENE';
  lastUpdated: string;
}

export interface AcousticProsodyMetrics {
  stressScore: number;
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
  speaker: 'CALLER' | 'GEMINI_DISPATCH' | 'OPERATOR_OVERRIDE';
  originalText: string;
  originalLanguage: 'te' | 'hi' | 'ur-hyderabad' | 'en' | 'code-switched';
  translatedText: string;
  entities: {
    text: string;
    type: 'LANDMARK' | 'VEHICLE_NO' | 'PHONE' | 'SYMPTOM' | 'URGENCY';
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
  category: 'REASSURANCE' | 'CPR_GUIDANCE' | 'DISPATCH_CONFIRM' | 'FIRST_AID';
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
export const TTSPreset = {};
export const AAPADA_MODULE_VERSION = '2026.1.0';
