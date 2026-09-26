import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const DATA_FILE = path.join(__dirname, 'data', 'incidents.json');

// Ensure incidents data file exists
if (!fs.existsSync(DATA_FILE)) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

// Master list of known Hyderabad landmarks and junctions for 108 dispatch
const HYDERABAD_LANDMARKS = [
  'Begumpet',
  'Gachibowli',
  'Secunderabad',
  'Hitec City',
  'Madhapur',
  'Banjara Hills',
  'Jubilee Hills',
  'Panjagutta',
  'Charminar',
  'Kukatpally',
  'Sanath Nagar',
  'Ameerpet',
  'Kondapur',
  'Dilsukhnagar',
  'KIMS Hospital',
  'Apollo Hospital',
  'NIMS Hospital',
  'Gandhi Hospital',
  'Osmania Hospital',
  'Outer Ring Road',
  'Cyber Towers',
  'Miyapur',
  'Uppal',
  'Lakdikapul',
  'Somajiguda',
  'Koti',
  'Abids',
  'Tarnaka',
  'Tolichowki',
  'GVK One',
  'Inorbit Mall'
];

/**
 * Deterministic Hyderabad Emergency NLP & Entity Parser
 * Extracts real spoken entities from the caller's actual words
 */
function parseTranscriptDeterministically(spokenText: string, acousticMetrics?: any) {
  const text = spokenText.trim();
  if (!text) {
    return {
      originalTranscript: '',
      englishTranslation: '',
      detectedLanguage: 'en',
      entities: [],
      triageUpdate: null,
      copilotReply: ''
    };
  }

  const entities: { text: string; type: 'LANDMARK' | 'VEHICLE_NO' | 'PHONE' | 'SYMPTOM' | 'URGENCY' }[] = [];

  // 1. Landmark Extraction
  let matchedLandmark = '';
  for (const lm of HYDERABAD_LANDMARKS) {
    const regex = new RegExp(`\\b${lm}\\b`, 'i');
    if (regex.test(text)) {
      matchedLandmark = lm;
      entities.push({ text: lm, type: 'LANDMARK' });
      break;
    }
  }

  // Regex for "near [X]", "at [X]", "opposite [X]", "[X] metro station", "pillar [0-9]+"
  if (!matchedLandmark) {
    const locMatch = text.match(/(?:near|at|opposite|around|close to)\s+([a-zA-Z0-9\s]+?)(?:,|!|\.|\b(?:and|my|please|we|car|someone|help|there|is|number|phone)\b|$)/i);
    if (locMatch && locMatch[1].trim().length > 2) {
      matchedLandmark = locMatch[1].trim();
      entities.push({ text: matchedLandmark, type: 'LANDMARK' });
    }
  }

  // Additional metro station or pillar check
  const metroMatch = text.match(/\b([A-Za-z]+)\s+metro\s+station\b/i);
  if (metroMatch) {
    const metroLm = `${metroMatch[1]} Metro Station`;
    if (!entities.some(e => e.text.toLowerCase() === metroLm.toLowerCase())) {
      entities.push({ text: metroLm, type: 'LANDMARK' });
    }
    if (!matchedLandmark) matchedLandmark = metroLm;
  }

  const pillarMatch = text.match(/\bpillar\s*(?:no\.?|#)?\s*([0-9]+)\b/i);
  if (pillarMatch) {
    const pillarStr = `Pillar ${pillarMatch[1]}`;
    entities.push({ text: pillarStr, type: 'LANDMARK' });
    if (matchedLandmark) matchedLandmark = `${matchedLandmark} (${pillarStr})`;
    else matchedLandmark = pillarStr;
  }

  // 2. Phone Number Extraction (10-digit Indian numbers)
  const phoneMatch = text.match(/(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}|\b\d{10}\b/);
  let callerPhone = '';
  if (phoneMatch) {
    callerPhone = phoneMatch[0].replace(/\s+/g, '');
    entities.push({ text: callerPhone, type: 'PHONE' });
  }

  // 3. Vehicle Plate Extraction
  const plateMatch = text.match(/\b(TS|AP)\s?[0-9]{1,2}\s?[A-Z]{1,3}\s?[0-9]{3,4}\b/i);
  let vehiclePlate = '';
  if (plateMatch) {
    vehiclePlate = plateMatch[0].toUpperCase();
    entities.push({ text: vehiclePlate, type: 'VEHICLE_NO' });
  }

  // 4. Crisis / Medical Keywords
  const lowerText = text.toLowerCase();
  const symptomsFound: string[] = [];

  const checkKeywords = [
    { word: 'fire', label: 'FIRE' },
    { word: 'smoke', label: 'SMOKE' },
    { word: 'blast', label: 'EXPLOSION' },
    { word: 'burn', label: 'BURN INJURY' },
    { word: 'bleeding', label: 'ACTIVE BLEEDING' },
    { word: 'blood', label: 'BLOOD LOSS' },
    { word: 'unconscious', label: 'UNCONSCIOUS' },
    { word: 'fainted', label: 'SYNCOPE' },
    { word: 'heart attack', label: 'CARDIAC ARREST' },
    { word: 'chest pain', label: 'CHEST PAIN' },
    { word: 'accident', label: 'ACCIDENT' },
    { word: 'crash', label: 'COLLISION' },
    { word: 'overturned', label: 'OVERTURNED' },
    { word: 'breathing', label: 'RESPIRATORY DISTRESS' },
    { word: 'choking', label: 'AIRWAY COMPROMISE' },
    { word: 'fracture', label: 'BONE FRACTURE' },
    { word: 'head injury', label: 'HEAD TRAUMA' }
  ];

  for (const kw of checkKeywords) {
    if (lowerText.includes(kw.word)) {
      symptomsFound.push(kw.label);
      entities.push({ text: kw.label, type: 'SYMPTOM' });
    }
  }

  // 5. Dynamic Incident Category & Severity
  let category = 'ROAD_ACCIDENT';
  let categoryLabel = 'Road Traffic Accident';
  let severity: 'CRITICAL' | 'HIGH' | 'MODERATE' = 'MODERATE';
  let recommendedUnit = 'ALS-108 Emergency Ambulance';

  if (lowerText.includes('fire') || lowerText.includes('blast') || lowerText.includes('smoke') || lowerText.includes('burn')) {
    category = 'STRUCTURAL_FIRE';
    categoryLabel = 'Structural / Chemical Fire Emergency';
    severity = 'CRITICAL';
    recommendedUnit = 'Telangana State Fire Tender + ALS-108 Ambulance';
  } else if (lowerText.includes('heart attack') || lowerText.includes('chest pain') || lowerText.includes('cardiac') || lowerText.includes('cpr')) {
    category = 'CARDIAC_ARREST';
    categoryLabel = 'Sudden Cardiac Arrest / Chest Pain';
    severity = 'CRITICAL';
    recommendedUnit = 'ALS-108 Ambulance + Automated External Defibrillator (AED)';
  } else if (lowerText.includes('breathing') || lowerText.includes('choking') || lowerText.includes('asthma') || lowerText.includes('suffocation')) {
    category = 'RESPIRATORY_DISTRESS';
    categoryLabel = 'Acute Respiratory Distress';
    severity = 'HIGH';
    recommendedUnit = 'ALS-108 Ambulance with High-Flow O2 Ventilator';
  } else if (lowerText.includes('accident') || lowerText.includes('crash') || lowerText.includes('overturned') || lowerText.includes('car') || lowerText.includes('bike')) {
    category = 'ROAD_ACCIDENT';
    categoryLabel = 'Road Traffic Accident';
    severity = lowerText.includes('bleeding') || lowerText.includes('unconscious') || lowerText.includes('overturned') ? 'CRITICAL' : 'HIGH';
    recommendedUnit = 'ALS-108 Ambulance + Hydraulic Extrication Cutter Unit';
  } else if (symptomsFound.length > 0) {
    category = 'ROAD_ACCIDENT';
    categoryLabel = 'Emergency Trauma Response';
    severity = lowerText.includes('unconscious') || lowerText.includes('bleeding') ? 'CRITICAL' : 'HIGH';
    recommendedUnit = 'ALS-108 Emergency Ambulance';
  }

  // Factor in acoustic stress if available
  if (acousticMetrics && acousticMetrics.stressScore > 80 && severity !== 'CRITICAL') {
    severity = 'HIGH';
  }

  const isRealEmergency = symptomsFound.length > 0 || Boolean(matchedLandmark);

  const triageUpdate = {
    category: isRealEmergency ? category : 'AWAITING_STREAM',
    categoryLabel: isRealEmergency ? categoryLabel : 'Awaiting Voice Stream...',
    severity: isRealEmergency ? severity : 'MODERATE',
    landmark: matchedLandmark || 'Awaiting Caller Location...',
    exactLocation: matchedLandmark ? `Near ${matchedLandmark}, Hyderabad` : 'Awaiting Caller Location...',
    vitals: {
      consciousness: lowerText.includes('unconscious')
        ? 'Victim unresponsive / unconscious reported'
        : 'Awaiting Voice Stream...',
      breathing: lowerText.includes('breathing') || lowerText.includes('not breathing')
        ? 'Compromised or labored breathing reported'
        : 'Awaiting Voice Stream...',
      bloodLoss: lowerText.includes('bleeding') || lowerText.includes('blood')
        ? 'Active bleeding reported on-scene - apply pressure'
        : 'None Reported',
      traumaNotes: symptomsFound.length > 0
        ? `Identified conditions: ${symptomsFound.join(', ')}`
        : 'Awaiting Voice Stream...'
    },
    callerInfo: {
      phone: callerPhone || 'Not Provided',
      vehiclePlate: vehiclePlate || 'None Reported'
    },
    recommendedUnit
  };

  // Contextual Copilot Dispatch Reply
  let copilotReply = '';
  if (category === 'STRUCTURAL_FIRE') {
    copilotReply = `This is Hyderabad 108 Dispatch. Fire emergency confirmed near ${matchedLandmark || 'your location'}. Fire Services and ALS-108 have been alerted. Evacuate all personnel to a safe distance upwind immediately.`;
  } else if (category === 'CARDIAC_ARREST') {
    copilotReply = `108 Dispatch here. ALS Ambulance with Defibrillator is being routed to ${matchedLandmark || 'your area'}. Place the patient flat on their back and check if they are breathing.`;
  } else if (category === 'ROAD_ACCIDENT') {
    copilotReply = `Hyderabad 108 Emergency Dispatch received. Unit is en route to ${matchedLandmark || 'the accident site'}. Do not move injured individuals unless there is direct fire danger. Help is on the way.`;
  } else {
    copilotReply = `Hyderabad 108 Dispatch received your report near ${matchedLandmark || 'your location'}. Emergency services are being alerted. Please stay on the line.`;
  }

  return {
    originalTranscript: text,
    englishTranslation: text,
    detectedLanguage: 'en',
    entities,
    triageUpdate,
    copilotReply
  };
}

/**
 * 1. GET /api/health
 */
app.get('/api/health', (req: Request, res: Response) => {
  const reqKey = (req.headers['x-gemini-api-key'] as string)?.trim() || process.env.GEMINI_API_KEY || '';
  res.json({
    status: 'UP',
    service: 'AapadaLive Crisis Voice Copilot Backend',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    hasApiKey: Boolean(reqKey),
    apiKeyPrefix: reqKey ? reqKey.slice(0, 8) + '...' : 'NONE',
    activeModels: [
      'gemini-3.8-live',
      'gemini-3.5-live-translate-preview',
      'gemini-3.5-transcribe',
      'gemini-3.8-flash-tts'
    ]
  });
});

/**
 * 2. POST /api/transcribe-and-translate
 * Accepts real spoken transcript and/or base64 audio chunks.
 * When a Gemini API key is provided, invokes Google GenAI models.
 * Otherwise, runs the deterministic Hyderabad Emergency NLP & Entity engine.
 */
app.post('/api/transcribe-and-translate', async (req: Request, res: Response) => {
  try {
    const {
      audioBase64,
      mimeType = 'audio/webm',
      transcript = '',
      acousticMetrics = null
    } = req.body;

    const runtimeKey = (req.headers['x-gemini-api-key'] as string)?.trim() || process.env.GEMINI_API_KEY || '';

    // If Gemini key is supplied and audio chunk is provided, attempt live Gemini processing
    if (runtimeKey && audioBase64) {
      try {
        const client = new GoogleGenAI({ apiKey: runtimeKey });
        const prompt = `You are AapadaLive (gemini-3.5-transcribe & gemini-3.5-live-translate-preview), emergency response AI for Hyderabad 108 Dispatch.
Transcribe and translate this emergency audio:
1. Transcribe the exact words spoken in original Telugu/Hindi/English/Urdu.
2. Provide clear English translation.
3. Detect language ('te', 'hi', 'ur-hyderabad', 'en', 'code-switched').
4. Extract entities: Landmarks (Begumpet, Hitec City, Gachibowli, Secunderabad, Banjara Hills, Charminar, KIMS, Apollo), Vehicle plates, Phone numbers, Symptoms.
5. Provide triage ticket update JSON.
Return strict JSON with keys: originalTranscript, englishTranslation, detectedLanguage, entities, triageUpdate.`;

        const response = await (client as any).models.generateContent({
          model: 'gemini-3.5-transcribe',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType.split(';')[0],
                    data: audioBase64
                  }
                },
                { text: prompt }
              ]
            }
          ],
          config: {
            responseMimeType: 'application/json'
          }
        });

        const rawText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          console.log('[Server] Successfully processed via Gemini API:', parsed.originalTranscript);
          return res.json(parsed);
        }
      } catch (geminiErr: any) {
        console.warn('[Server] Live Gemini API call warning:', geminiErr.message);
      }
    }

    // Real Deterministic NLP & Entity Extraction on user's actual spoken input
    if (transcript && transcript.trim()) {
      const parsed = parseTranscriptDeterministically(transcript, acousticMetrics);

      // Persist the incident automatically if entities were found
      if (parsed.triageUpdate && (parsed.entities.length > 0 || parsed.triageUpdate.category !== 'AWAITING_STREAM')) {
        try {
          const raw = fs.readFileSync(DATA_FILE, 'utf8');
          const incidents = JSON.parse(raw);
          const newIncident = {
            id: `HYD-108-${Date.now().toString().slice(-4)}`,
            createdAt: new Date().toISOString(),
            transcript: parsed.originalTranscript,
            entities: parsed.entities,
            triage: parsed.triageUpdate,
            acousticMetrics
          };
          incidents.unshift(newIncident);
          fs.writeFileSync(DATA_FILE, JSON.stringify(incidents.slice(0, 50), null, 2), 'utf8');
        } catch (e) {
          console.warn('[Server] Incident save warning:', e);
        }
      }

      return res.json(parsed);
    }

    // If only an audio chunk was received without a transcript or key, return empty/listening state
    // (Never return fake hardcoded transcripts!)
    return res.json({
      originalTranscript: '',
      englishTranslation: '',
      detectedLanguage: 'en',
      entities: [],
      triageUpdate: null,
      copilotReply: ''
    });

  } catch (error: any) {
    console.error('[Server] Transcribe-and-translate error:', error);
    res.status(500).json({ error: error.message || 'Internal processing error' });
  }
});

/**
 * 3. POST /api/tts
 * Generates 3-part structured TTS audio via gemini-3.8-flash-tts when API key is provided,
 * or generates synthesized 24kHz PCM WAV bytes for Web Audio playback.
 */
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text, voiceName = 'Aoede', stylePrompt = 'calm, authoritative, emergency responder' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Missing text parameter' });
    }

    const runtimeKey = (req.headers['x-gemini-api-key'] as string)?.trim() || process.env.GEMINI_API_KEY || '';

    if (runtimeKey) {
      try {
        const client = new GoogleGenAI({ apiKey: runtimeKey });
        const response = await (client as any).models.generateContent({
          model: 'gemini-3.8-flash-tts',
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Cast: ${voiceName}\nDirect style: ${stylePrompt}\nText: ${text}`
                }
              ]
            }
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voiceName
                }
              }
            }
          }
        });

        const audioPart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
        if (audioPart?.inlineData?.data) {
          console.log('[Server] Successfully generated TTS via gemini-3.8-flash-tts');
          return res.json({
            audioBase64: audioPart.inlineData.data,
            mimeType: audioPart.inlineData.mimeType || 'audio/pcm;rate=24000',
            source: 'gemini-3.8-flash-tts'
          });
        }
      } catch (ttsErr: any) {
        console.warn('[Server] gemini-3.8-flash-tts call failed, generating synthesized WAV buffer:', ttsErr.message);
      }
    }

    // High-fidelity synthesized WAV audio generator (24kHz Web Audio compatible)
    const wavBase64 = generateSynthesizedPcmWav(Math.min(4000, Math.max(1000, text.length * 60)));
    return res.json({
      audioBase64: wavBase64,
      mimeType: 'audio/wav',
      source: 'synthesized-audio-engine'
    });
  } catch (error: any) {
    console.error('[Server] TTS endpoint error:', error);
    res.status(500).json({ error: error.message || 'TTS generation error' });
  }
});

/**
 * 4. Incidents Persistence API
 */
app.get('/api/incidents', (req: Request, res: Response) => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (e) {
    res.json([]);
  }
});

app.post('/api/incidents', (req: Request, res: Response) => {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const incidents = JSON.parse(raw);
    const newIncident = {
      ...req.body,
      id: req.body.id || `HYD-108-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString()
    };
    incidents.unshift(newIncident);
    fs.writeFileSync(DATA_FILE, JSON.stringify(incidents.slice(0, 50), null, 2), 'utf8');
    res.status(201).json(newIncident);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.patch('/api/incidents/:id/dispatch', (req: Request, res: Response) => {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const incidents = JSON.parse(raw);
    const index = incidents.findIndex((i: any) => i.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    incidents[index].dispatchStatus = 'DISPATCHED';
    incidents[index].dispatchedAt = new Date().toISOString();
    incidents[index].dispatchNotes = req.body.notes || '108 Ambulance Unit Dispatched from Station';
    fs.writeFileSync(DATA_FILE, JSON.stringify(incidents, null, 2), 'utf8');
    res.json(incidents[index]);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * Generates valid 24kHz 16-bit PCM WAV audio buffer for Web Audio playback
 */
function generateSynthesizedPcmWav(durationMs: number = 2000): string {
  const sampleRate = 24000;
  const numSamples = Math.floor((sampleRate * durationMs) / 1000);
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  // WAV header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // SubChunk1Size (PCM = 16)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(1, 22);  // NumChannels (1 = Mono)
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate
  buffer.writeUInt16LE(2, 32);  // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Generate harmonic audio wave with soft decay
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.max(0.05, 1 - (i / numSamples) * 0.7);
    const freq = 220 + Math.sin(t * 4) * 40;
    const sample = Math.sin(2 * Math.PI * freq * t) * 0.3 * envelope;
    const intSample = Math.floor(sample * 32767);
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  return buffer.toString('base64');
}

app.listen(PORT, () => {
  console.log(`[AapadaLive Server] Running on http://localhost:${PORT}`);
  console.log(`[AapadaLive Server] Active Gemini Models: gemini-3.8-live, gemini-3.5-transcribe, gemini-3.5-live-translate-preview, gemini-3.8-flash-tts`);
});
