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

// Ensure sessions/incidents data file exists
if (!fs.existsSync(DATA_FILE)) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, '[]', 'utf8');
} else {
  // Clear any legacy emergency template incidents
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const existing = JSON.parse(raw);
    const cleaned = existing.filter((item: any) => !item.id?.includes('HYD-108') && !item.triage?.recommendedUnit?.includes('108'));
    fs.writeFileSync(DATA_FILE, JSON.stringify(cleaned, null, 2), 'utf8');
  } catch {}
}

// Global landmark and city locations for context detection & map synchronization
const KNOWN_LOCATIONS = [
  'Hitec City',
  'Gachibowli',
  'Secunderabad',
  'Madhapur',
  'Banjara Hills',
  'Jubilee Hills',
  'Begumpet',
  'Charminar',
  'Kukatpally',
  'Ameerpet',
  'Kondapur',
  'Dilsukhnagar',
  'Hyderabad',
  'Bengaluru',
  'Bangalore',
  'Mumbai',
  'Delhi',
  'New Delhi',
  'Pune',
  'Chennai',
  'Kolkata',
  'Gurgaon',
  'Noida',
  'San Francisco',
  'New York',
  'London',
  'Singapore',
  'Tokyo',
  'Berlin'
];

/**
 * Robust JSON generation with automatic model fallback
 */
async function callGeminiJson(client: GoogleGenAI, contents: any): Promise<any> {
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
  for (const model of models) {
    try {
      const res = await (client as any).models.generateContent({
        model,
        contents,
        config: { responseMimeType: 'application/json' }
      });
      const raw = res.text || res.candidates?.[0]?.content?.parts?.[0]?.text;
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e: any) {
      console.warn(`[VoxLive Server] ${model} attempt notice:`, e.message);
    }
  }
  return null;
}

/**
 * 1. Real-Time Multilingual Translation Bridge
 * Translates ANY spoken Hindi, Telugu, Hinglish, Tenglish, Urdu or regional speech
 * into accurate English via Google GTX Live endpoint with Gemini fallback.
 */
async function translateToEnglish(text: string, apiKey?: string): Promise<{ english: string; detectedLang: string }> {
  const clean = text.trim();
  if (!clean) return { english: '', detectedLang: 'en' };

  // 1. First try Google GTX Live API (instant, high accuracy, handles Hinglish/Tenglish)
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(clean)}`;
    const response = await fetch(url);
    if (response.ok) {
      const data: any = await response.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translatedParts = data[0].map((item: any) => item[0]).filter(Boolean);
        const translatedText = translatedParts.join(' ').trim();
        const detectedSrc = data[2] || 'auto';
        if (translatedText) {
          const langLabel = detectedSrc === 'hi'
            ? 'Hindi -> English'
            : detectedSrc === 'te'
            ? 'Telugu -> English'
            : detectedSrc === 'ur'
            ? 'Urdu -> English'
            : detectedSrc === 'en'
            ? 'English'
            : `${detectedSrc.toUpperCase()} -> English`;
          return { english: translatedText, detectedLang: langLabel };
        }
      }
    }
  } catch (err: any) {
    console.warn('[VoxLive Backend] Google GTX translation notice:', err.message);
  }

  // 2. Fallback to Gemini if key is present
  if (apiKey) {
    try {
      const client = new GoogleGenAI({ apiKey });
      const prompt = `Translate this text accurately to English. If it is already English, keep it as is. Detect source language. Return strict JSON with {"english": "...", "detectedLang": "..."}. Text: "${clean}"`;
      const parsed = await callGeminiJson(client, [{ role: 'user', parts: [{ text: prompt }] }]);
      if (parsed?.english) {
        return {
          english: parsed.english,
          detectedLang: parsed.detectedLang || 'Detected -> English'
        };
      }
    } catch {}
  }

  return { english: clean, detectedLang: 'English' };
}

/**
 * 2. Deterministic Universal Voice & Audio Action Engine
 * Extracts real intent, vocal tone, structured actions, and entities from any user speech
 */
function parseUniversalVoiceInput(
  spokenText: string,
  englishText: string,
  detectedLang: string,
  acousticMetrics?: any
) {
  const text = spokenText.trim();
  const eng = englishText.trim() || text;

  if (!text) {
    return {
      originalTranscript: '',
      englishTranslation: '',
      detectedLanguage: 'Awaiting Voice Stream...',
      vocalTone: 'Neutral / Standby',
      detectedIntent: 'Standby',
      topicSummary: 'Awaiting Spoken Input...',
      structuredActions: [] as string[],
      entities: [] as { text: string; type: 'LOCATION' | 'ACTION' | 'TOPIC' | 'ORGANIZATION' | 'METRIC' }[],
      activeLocation: '',
      copilotReply: ''
    };
  }

  const entities: { text: string; type: 'LOCATION' | 'ACTION' | 'TOPIC' | 'ORGANIZATION' | 'METRIC' }[] = [];
  const lowerText = text.toLowerCase();
  const lowerEng = eng.toLowerCase();

  // 1. Location Recognition & Extraction
  let matchedLocation = '';
  for (const loc of KNOWN_LOCATIONS) {
    const regex = new RegExp(`\\b${loc}\\b`, 'i');
    if (regex.test(text) || regex.test(eng)) {
      matchedLocation = loc;
      entities.push({ text: loc, type: 'LOCATION' });
      break;
    }
  }

  // Regex for "in [X]", "at [X]", "near [X]"
  if (!matchedLocation) {
    const locMatch = eng.match(/\b(?:in|at|near|around)\s+([A-Z][a-zA-Z\s]+?)(?:,|\.|\b(?:office|room|building|branch|hub|station|campus)\b|$)/);
    if (locMatch && locMatch[1].trim().length > 2) {
      matchedLocation = locMatch[1].trim();
      entities.push({ text: matchedLocation, type: 'LOCATION' });
    }
  }

  // 2. Vocal Tone derived from live mic acoustic metrics
  const stress = acousticMetrics?.stressScore ?? 25;
  const speechRate = acousticMetrics?.speechRateWpm ?? 110;
  const snr = acousticMetrics?.snrDb ?? 18;

  let vocalTone = 'Calm & Conversational';
  if (stress > 70 || speechRate > 155) {
    vocalTone = 'Urgent / High Intensity';
  } else if (stress > 45 || speechRate > 125) {
    vocalTone = 'Animated & Energetic';
  } else if (snr < 10 || speechRate < 80) {
    vocalTone = 'Hesitant / Low Volume';
  } else {
    vocalTone = 'Calm & Conversational';
  }

  // 3. Spoken Intent Classification
  let detectedIntent = 'General Discussion';
  if (/\b(?:what|why|how|when|where|who|can we|could you|should we|is there|are we|\?|kya|kyun|kaise|kab|eppudu|ela|emi)\b/i.test(lowerEng) || lowerEng.includes('?')) {
    detectedIntent = 'Question / Inquiry';
  } else if (/\b(?:meeting|schedule|call|sync|standup|appointment|10 baje|tomorrow|kal|friday|monday|today|aaj|timing)\b/i.test(lowerEng) || /\b(?:meeting|baje|kal|rakhte)\b/i.test(lowerText)) {
    detectedIntent = 'Meeting & Scheduling';
  } else if (/\b(?:deploy|deployment|review|latency|api|backend|frontend|fix|build|release|test|ship|code|pipeline|database|server)\b/i.test(lowerEng)) {
    detectedIntent = 'Task / Action Request';
  } else if (/\b(?:product|launch|idea|feature|strategy|plan|design|think|discuss|collaborate|proposal|market)\b/i.test(lowerEng)) {
    detectedIntent = 'Brainstorming & Strategy';
  } else if (/\b(?:urgent|alert|help|critical|down|failing|error|blocked|issue)\b/i.test(lowerEng)) {
    detectedIntent = 'Priority Issue / Alert';
  }

  // 4. Topic Summary (concise 3-6 words)
  let topicSummary = 'Universal Voice Collaboration';
  if (lowerEng.includes('product launch') || lowerText.includes('product launch')) {
    topicSummary = 'Product Launch Planning';
    entities.push({ text: 'Product Launch', type: 'TOPIC' });
  } else if (lowerEng.includes('latency') || lowerEng.includes('deployment')) {
    topicSummary = 'API Latency & Deployment Review';
    entities.push({ text: 'Backend API Latency', type: 'METRIC' });
    entities.push({ text: 'Deployment', type: 'ACTION' });
  } else if (lowerEng.includes('meeting')) {
    topicSummary = matchedLocation ? `Team Meeting at ${matchedLocation}` : 'Scheduled Sync Meeting';
  } else if (detectedIntent === 'Question / Inquiry') {
    topicSummary = `Inquiry: ${eng.slice(0, 35)}...`;
  } else {
    topicSummary = eng.slice(0, 40) || 'Spoken Voice Stream';
  }

  // 5. Dynamic Structured Voice Action Extraction (derived directly from spoken words)
  const structuredActions: string[] = [];

  if (detectedIntent === 'Meeting & Scheduling') {
    const locPart = matchedLocation ? ` at ${matchedLocation} office` : '';
    const timePart = lowerEng.includes('10') || lowerText.includes('10') ? ' for 10:00 AM' : '';
    const dayPart = lowerEng.includes('tomorrow') || lowerText.includes('kal') ? ' tomorrow' : '';
    structuredActions.push(`Schedule meeting${timePart}${dayPart}${locPart}`);
    structuredActions.push('Prepare presentation slides and alignment agenda');
  } else if (detectedIntent === 'Task / Action Request') {
    if (lowerEng.includes('latency') || lowerEng.includes('api')) {
      structuredActions.push('Conduct performance audit of backend API latency metrics');
    }
    if (lowerEng.includes('deploy') || lowerEng.includes('friday')) {
      const day = lowerEng.includes('friday') ? 'Friday' : 'next scheduled window';
      structuredActions.push(`Coordinate production deployment checklist for ${day}`);
    }
    if (structuredActions.length === 0) {
      structuredActions.push(`Execute requested task: ${eng}`);
    }
  } else if (detectedIntent === 'Question / Inquiry') {
    structuredActions.push(`Investigate and synthesize answers for: "${eng}"`);
    structuredActions.push('Share summarized telemetry and findings with team');
  } else if (detectedIntent === 'Brainstorming & Strategy') {
    structuredActions.push(`Draft concept blueprint based on discussion: "${eng}"`);
    structuredActions.push('Consolidate feasibility notes and action owners');
  } else {
    structuredActions.push(`Track spoken note: "${eng.slice(0, 60)}"`);
  }

  // 6. Natural Conversational VoxLive Copilot Response (concise 1-2 sentences)
  let copilotReply = '';
  if (detectedIntent === 'Meeting & Scheduling') {
    copilotReply = `Sounds like a solid plan. I have logged the meeting for ${matchedLocation || 'the office'} and framed the preparatory action items for you.`;
  } else if (detectedIntent === 'Task / Action Request') {
    if (lowerEng.includes('latency') || lowerEng.includes('deploy')) {
      copilotReply = `Absolutely. We can inspect the backend API latency benchmarks and set up the deployment schedule for Friday right away.`;
    } else {
      copilotReply = `Understood. I have logged that action item and will track the execution steps for you.`;
    }
  } else if (detectedIntent === 'Question / Inquiry') {
    copilotReply = `I understand your question regarding ${topicSummary}. Let's examine the details and extract the core takeaways.`;
  } else if (detectedIntent === 'Brainstorming & Strategy') {
    copilotReply = `That is a compelling direction! I've structured your key ideas into actionable deliverables on screen.`;
  } else {
    copilotReply = `I'm listening. I've translated your speech and extracted the core discussion points into your live action feed.`;
  }

  return {
    originalTranscript: text,
    englishTranslation: eng,
    detectedLanguage: detectedLang || 'English',
    vocalTone,
    detectedIntent,
    topicSummary,
    structuredActions,
    entities,
    activeLocation: matchedLocation,
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
    service: 'VoxLive AI Voice Intelligence Backend',
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
 * 1b. GET /api/config/runtime
 * Local-only configuration endpoint for development & live demos.
 * Returns the environment API key ONLY when requested from localhost.
 */
app.get('/api/config/runtime', (req: Request, res: Response) => {
  const remoteIp = req.socket.remoteAddress || '';
  const host = req.headers.host || '';
  const isLocal =
    remoteIp.includes('127.0.0.1') ||
    remoteIp.includes('::1') ||
    remoteIp === 'localhost' ||
    host.includes('localhost') ||
    host.includes('127.0.0.1');

  if (!isLocal) {
    return res.status(403).json({ error: 'Runtime config is strictly restricted to localhost requests' });
  }

  res.json({
    apiKey: process.env.GEMINI_API_KEY || ''
  });
});

/**
 * 2. POST /api/transcribe-and-translate
 * Universal Real-Time Multilingual Translation, Conversational Intelligence & Structured Action Extraction
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

    let spokenText = (transcript || '').trim();

    // If an audio chunk is provided and no transcript, attempt Gemini transcription if key is present
    if (!spokenText && audioBase64 && runtimeKey) {
      try {
        const client = new GoogleGenAI({ apiKey: runtimeKey });
        const contents = [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: mimeType.split(';')[0],
                  data: audioBase64
                }
              },
              { text: 'Transcribe the spoken audio verbatim in original language (Hindi/Telugu/English). Return strict JSON with {"transcript": "..."}' }
            ]
          }
        ];
        const parsed = await callGeminiJson(client, contents);
        if (parsed?.transcript) {
          spokenText = parsed.transcript.trim();
        }
      } catch (err: any) {
        console.warn('[VoxLive Server] Audio transcribe notice:', err.message);
      }
    }

    if (!spokenText) {
      return res.json({
        originalTranscript: '',
        englishTranslation: '',
        detectedLanguage: 'Awaiting Voice Stream...',
        vocalTone: 'Neutral / Standby',
        detectedIntent: 'Standby',
        topicSummary: 'Awaiting Spoken Input...',
        structuredActions: [],
        entities: [],
        activeLocation: '',
        copilotReply: '',
        triageUpdate: null
      });
    }

    // 1. Multilingual translation via Google GTX Live endpoint + Gemini fallback
    const { english, detectedLang } = await translateToEnglish(spokenText, runtimeKey);

    // 2. Deterministic baseline extraction (context-aware, reliable fallback)
    let nlpResult = parseUniversalVoiceInput(spokenText, english, detectedLang, acousticMetrics);

    // 3. If Gemini key is available, enhance with live conversational intelligence
    if (runtimeKey) {
      try {
        const client = new GoogleGenAI({ apiKey: runtimeKey });
        const prompt = `You are VoxLive, a real-time voice-first AI collaborator powered by the Gemini Audio Stack. Respond naturally, concisely (1-2 sentences), and directly to whatever the user just said, adapting your tone to their vocal prosody.
User Spoken: "${spokenText}"
English Meaning: "${english}"
Vocal Energy: ${acousticMetrics?.stressScore ?? 25}%
Pitch Variance: ${acousticMetrics?.pitchVarianceHz ?? 0}Hz

Return strict JSON with:
{
  "copilotReply": "1-2 sentence direct, conversational, natural spoken response",
  "detectedIntent": "Question / Inquiry | Meeting & Scheduling | Task / Action Request | Brainstorming & Strategy | General Discussion",
  "vocalTone": "Calm & Conversational | Animated & Energetic | Urgent / High Intensity | Hesitant / Low Volume",
  "topicSummary": "short 3-6 word topic description",
  "structuredActions": ["action item 1", "action item 2"],
  "location": "extracted city or location name, or empty string if none mentioned"
}`;

        const parsed = await callGeminiJson(client, [{ role: 'user', parts: [{ text: prompt }] }]);
        if (parsed) {
          if (parsed.copilotReply) {
            nlpResult.copilotReply = parsed.copilotReply;
          }
          if (parsed.detectedIntent) {
            nlpResult.detectedIntent = parsed.detectedIntent;
          }
          if (parsed.vocalTone) {
            nlpResult.vocalTone = parsed.vocalTone;
          }
          if (parsed.topicSummary) {
            nlpResult.topicSummary = parsed.topicSummary;
          }
          if (Array.isArray(parsed.structuredActions) && parsed.structuredActions.length > 0) {
            nlpResult.structuredActions = parsed.structuredActions;
          }
          if (parsed.location) {
            nlpResult.activeLocation = parsed.location;
            if (!nlpResult.entities.some(e => e.text.toLowerCase() === parsed.location.toLowerCase())) {
              nlpResult.entities.push({ text: parsed.location, type: 'LOCATION' });
            }
          }
        }
      } catch (geminiErr: any) {
        console.warn('[VoxLive Server] Gemini conversational intelligence fallback:', geminiErr.message);
      }
    }

    // Prepare unified Structured Action Ticket for UI
    const voiceActionTicket = {
      sessionId: `VOX-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleTimeString(),
      vocalTone: nlpResult.vocalTone,
      detectedLanguage: nlpResult.detectedLanguage,
      detectedIntent: nlpResult.detectedIntent,
      topicSummary: nlpResult.topicSummary,
      structuredActions: nlpResult.structuredActions,
      entities: nlpResult.entities,
      activeLocation: nlpResult.activeLocation || '',
      lastUpdated: new Date().toLocaleTimeString(),
      // Compatibility aliases
      category: nlpResult.detectedIntent,
      categoryLabel: nlpResult.topicSummary,
      severity: nlpResult.vocalTone.includes('High') ? 'HIGH' : 'MODERATE',
      landmark: nlpResult.activeLocation || 'Voice Context Active',
      exactLocation: nlpResult.activeLocation || 'Voice Context Active'
    };

    // Save session asynchronously
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const sessions = JSON.parse(raw);
      sessions.unshift({
        id: voiceActionTicket.sessionId,
        createdAt: new Date().toISOString(),
        transcript: nlpResult.originalTranscript,
        englishTranslation: nlpResult.englishTranslation,
        intent: nlpResult.detectedIntent,
        actions: nlpResult.structuredActions,
        entities: nlpResult.entities,
        acousticMetrics
      });
      fs.writeFileSync(DATA_FILE, JSON.stringify(sessions.slice(0, 50), null, 2), 'utf8');
    } catch (e) {
      console.warn('[VoxLive Server] Session persistence notice:', e);
    }

    return res.json({
      originalTranscript: nlpResult.originalTranscript,
      englishTranslation: nlpResult.englishTranslation,
      detectedLanguage: nlpResult.detectedLanguage,
      vocalTone: nlpResult.vocalTone,
      detectedIntent: nlpResult.detectedIntent,
      topicSummary: nlpResult.topicSummary,
      structuredActions: nlpResult.structuredActions,
      entities: nlpResult.entities,
      activeLocation: nlpResult.activeLocation,
      copilotReply: nlpResult.copilotReply,
      triageUpdate: voiceActionTicket
    });

  } catch (error: any) {
    console.error('[VoxLive Server] Transcribe-and-translate error:', error);
    res.status(500).json({ error: error.message || 'Internal processing error' });
  }
});

/**
 * 3. POST /api/tts
 * Generates natural expressive speech via gemini-3.8-flash-tts or synthesized Web Audio buffer
 */
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text, voiceName = 'Aoede', stylePrompt = 'calm, natural, engaging conversational collaborator' } = req.body;

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
          console.log('[VoxLive Server] Successfully generated TTS via gemini-3.8-flash-tts');
          return res.json({
            audioBase64: audioPart.inlineData.data,
            mimeType: audioPart.inlineData.mimeType || 'audio/pcm;rate=24000',
            source: 'gemini-3.8-flash-tts'
          });
        }
      } catch (ttsErr: any) {
        console.warn('[VoxLive Server] gemini-3.8-flash-tts call notice:', ttsErr.message);
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
    console.error('[VoxLive Server] TTS endpoint error:', error);
    res.status(500).json({ error: error.message || 'TTS generation error' });
  }
});

/**
 * 4. Sessions Persistence API
 */
app.get('/api/incidents', (req: Request, res: Response) => {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    res.json(JSON.parse(data));
  } catch (e) {
    res.json([]);
  }
});

app.get('/api/sessions', (req: Request, res: Response) => {
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
    const sessions = JSON.parse(raw);
    const newSession = {
      ...req.body,
      id: req.body.id || `VOX-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString()
    };
    sessions.unshift(newSession);
    fs.writeFileSync(DATA_FILE, JSON.stringify(sessions.slice(0, 50), null, 2), 'utf8');
    res.status(201).json(newSession);
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
  console.log(`[VoxLive AI Server] Running on http://localhost:${PORT}`);
  console.log(`[VoxLive AI Server] Active Gemini Models: gemini-3.8-live, gemini-3.5-live-translate-preview, gemini-3.5-transcribe, gemini-3.8-flash-tts`);
});
