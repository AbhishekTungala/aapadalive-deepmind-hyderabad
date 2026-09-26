# AapadaLive: Bilingual Emergency Triage & Crisis Voice Copilot (Hyderabad 108 Dispatch)

> **Google DeepMind Hyderabad Hackathon — Problem Statement 2: Next-Gen Voice & Real-Time Audio**  
> *A voice-first, real-time emergency dispatch command center where audio is the primary, continuous, and irreplaceable medium.*

[![Google DeepMind](https://img.shields.io/badge/Google%20DeepMind-Hyderabad%20Hackathon%20%2726-4285F4?style=for-the-badge&logo=google)](https://deepmind.google/)
[![Gemini Live Stack](https://img.shields.io/badge/Gemini%20Live-gemini--3.8--live%20%7C%2024kHz%20PCM-06B6D4?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Live Deployment](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-10B981?style=for-the-badge&logo=github)](https://abhishektungala.github.io/aapadalive-deepmind-hyderabad/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

---

## 1. Executive Summary & Problem Context

In high-stress emergency dispatches (modeled after **Telangana 108 Emergency Operations** in Hyderabad), existing systems fail because they treat crisis audio as a secondary layer over text chat. 

During acute trauma:
1. **Intra-Sentence Code-Switching is Ubiquitous:** Callers rarely speak pure English or pure Telugu; they fluidly blend **Telugu + Hyderabadi Urdu + Hindi + English** in single frantic sentences (e.g. *"PVNR Pillar 142 దగ్గర severe accident ayindi... TS 09 UB 4402 car overturned, bleeding heavily!"*).
2. **Critical Telemetry is in the Acoustic Waveform, Not Just Words:** Agonal breathing, hyperventilation, vocal tremor, background traffic horns, and exploding machinery cues are acoustic prosodic signals lost in traditional speech-to-text.
3. **Mid-Sentence Interruptions (Barge-In) are Urgent:** When a caller screams that an engine is catching fire, the AI copilot must immediately flush its audio buffer with 0ms latency and adapt.
4. **Operations Bottleneck:** First responders cannot afford manual form entry while directing CPR or extrication units.

**AapadaLive** solves this with a real-time, 4-zone operations dashboard driven by Google's 2026 Gemini Live Audio stack.

---

## 2. Google AI Audio Stack & Model ID Mapping

| Model ID | Operational Role in AapadaLive | Architecture & Implementation Details |
| :--- | :--- | :--- |
| **`gemini-3.8-live`** | **Real-Time Live API WebSocket** | Native browser `window.WebSocket` streaming raw 16kHz mono linear PCM in, 24kHz PCM out; non-blocking function calling (`update_triage_dashboard`); interaction status tracking (`IN_PROGRESS` vs `IDLE`). |
| **`gemini-3.8-live`** | **0ms Barge-In Queue Flush** | Captures `serverContent.interrupted`, immediately aborts all active `AudioBufferSourceNode`s, clears Web Audio queue, and triggers visual amber warning banner. |
| **`gemini-3.5-live-translate-preview`** | **Bilingual Translation Bridge** | Real-time speech-to-speech / speech-to-text bridge translating caller's native Telugu/Hindi into normalized English for the 108 operator. |
| **`gemini-3.5-transcribe`** | **Smart Transcription & Disfluency Removal** | Smart formatting with `custom_vocabulary` biased toward Hyderabad landmarks (`Begumpet`, `Hitec City`, `Gachibowli`, `PVNR Expressway`, `KIMS Hospital`, `Charminar`, `108 Ambulance`). |
| **`gemini-3.8-flash-tts`** | **One-Tap Dispatcher Voice Injection** | 3-part structured TTS payload: **Cast** (`voice: Aoede, Fenrir, Kore, Zephyr`), **Direct** (`speech_metadata.style`: calm, rhythmic 100bpm CPR coach, authoritative), and verbatim multilingual text. |

---

## 3. System Architecture Diagram

```
+-----------------------------------------------------------------------------------------+
|                                    AAPADALIVE CLIENT                                    |
|                                                                                         |
|   [Caller Mic] ──> [16kHz PCM Downsampler] ───────┐                                     |
|                                                    │ Native WebSocket                    |
|   [Dual HTML5 Canvas Waveforms]                    ▼ (Bidi Protocol)                    |
|   • Caller 16kHz Mono Spectrum (Cyan)       +───────────────────────────────────────+   |
|   • Copilot 24kHz Mono Spectrum (Emerald)   │ wss://generativelanguage.googleapis.  │   |
|                                             │ com/ws/.../BidiGenerateContent        │   |
|   [24kHz Web Audio Buffer Player] <─────────+                                       │   |
|   • Scheduled timeline queue                │ 1. gemini-3.8-live                    │   |
|   • 0ms instant flush on Barge-In           │    - 16kHz In / 24kHz Out             │   |
|                                             │    - Audio Prosody Stress Score       │   |
|   [Asynchronous Triage Worker] <────────────┤    - update_triage_dashboard Tool      │   |
|   • Category, Severity, Landmark, Vitals    │    - serverContent.interrupted (Flush)│   |
|                                             │                                       │   |
|   [Dispatcher One-Tap TTS] ─────────────────┤ 2. gemini-3.5-live-translate-preview  │   |
|   • 3-part structured voice injection       │ 3. gemini-3.5-transcribe              │   |
|     (Cast + Direct Style + Verbatim Text)   │ 4. gemini-3.8-flash-tts               │   |
|                                             +───────────────────────────────────────+   |
+-----------------------------------------------------------------------------------------+
```

---

## 4. Deep-Dive: Core Audio Pipeline (`src/services/geminiAudioStack.ts`)

The entire real-time audio pipeline is encapsulated in [`src/services/geminiAudioStack.ts`](./src/services/geminiAudioStack.ts):

### 4.1 16kHz Mono Linear PCM Downsampler
Browsers capture microphone input at hardware sample rates (typically 44.1kHz or 48kHz). The Live API strictly expects 16kHz mono linear 16-bit PCM. The `downsampleTo16k` method implements an interpolation downsampler that maps floating-point audio into `Int16Array` buffers and encodes them to base64 for `realtimeInput.mediaChunks`:
```typescript
// Downsample arbitrary browser sample rate to 16,000Hz Int16 PCM
const pcm16 = this.downsampleTo16k(inputBuffer, sampleRate);
const base64Audio = this.arrayBufferToBase64(pcm16.buffer as ArrayBuffer);
```

### 4.2 24kHz PCM Playback Scheduler
When Gemini replies with 24kHz raw PCM chunks, `enqueuePcm24kAudio` converts signed 16-bit integers to normalized `Float32Array` values in `[-1.0, 1.0]`. Chunks are dynamically scheduled into future Web Audio timeline slots (`this.nextPlayTime`), ensuring gapless playback without audio stuttering.

### 4.3 0ms Barge-In Interruption Buffer Flush
When the caller interrupts Gemini mid-sentence, `handleBargeInInterruption` triggers:
```typescript
for (const source of this.scheduledAudioSources) {
  try {
    source.stop();
    source.disconnect();
  } catch (e) {}
}
this.scheduledAudioSources = [];
this.nextPlayTime = this.audioContext.currentTime;
this.telemetry.bargeInActive = true;
```
This guarantees **zero audio overlap** and flashes the amber **BARGE-IN DETECTED** banner on the operator console.

### 4.4 Non-Blocking Tool Calling: `update_triage_dashboard`
Gemini invokes `update_triage_dashboard` in the background with `SILENT`/`WHEN_IDLE` scheduling. The function extracts:
- Incident classification: `ROAD_ACCIDENT`, `CARDIAC_ARREST`, `STRUCTURAL_FIRE`
- Severity level: `CRITICAL` (Code Red), `HIGH`, `MODERATE`
- Hyderabad landmarks: *PVNR Expressway, Gachibowli Flyover, Begumpet, DLF Gate 2*
- Vitals: Consciousness, Respiration, Blood loss, Trauma alerts
- Recommended Unit: *ALS-108 Ambulance + Hydraulic Extrication Cutters*

---

## 5. UI/UX: 4-Zone Dark-Mode Command Center

1. **Top Header Bar:**
   - Real-time latency telemetry (`32ms`), connection status badge, and `interaction_status` (`IN_PROGRESS` vs `IDLE`).
   - High-visibility amber alert banner flashing upon caller barge-in.
   - Scenario Simulator selector & Gemini API Key configuration.
2. **Zone 1 (Left Panel): Vocal Prosody & Acoustic Telemetry:**
   - Radial SVG gauge for **Vocal Stress & Panic Score (0–100%)** computed from acoustic jitter and speech rate.
   - Real-time acoustic metrics: Pitch Variance (Hz), Speech Rate (WPM), SNR (dB).
   - Dual HTML5 Canvas waveform visualizers (Caller 16kHz Cyan vs. Copilot 24kHz Emerald).
   - Paralinguistic tags: `Hyperventilating`, `Vocal Tremor`, `Background Horns`, `Engine Smoke / Fire Hazard`.
3. **Zone 2 (Center Panel): Live Code-Switched Transcript & Translation Stream:**
   - Dual-channel message cards showing original Telugu/Hindi/Urdu alongside the **Live Operator English Translation Bridge**.
   - Auto-highlighted alphanumeric entity pills: Vehicle numbers (`TS 09 UB 4402`), Landmarks, Phones, Symptoms.
4. **Zone 3 (Right Panel): Auto-Populating Incident Triage Ticket & One-Tap Actions:**
   - Real-time structured ticket updated via tool calls with 1-click **AUTHORIZE 108 DISPATCH UNIT** action.
   - 4 One-Tap Voice Injections (`gemini-3.8-flash-tts`):
     - *Reassure & Ask Landmark* (Telugu — Aoede)
     - *Guide Bystander CPR* (Hindi — Fenrir, rhythmic 100bpm coach)
     - *Confirm 108 Dispatched* (English — Kore)
     - *Airway & Recovery Pos.* (Telugu-English Blend — Zephyr)

---

## 6. Multi-Speaker Panic Call Simulation Scenarios

Judges can test the full pipeline even in a noisy hackathon hall using the built-in simulator:
1. **PVNR Expressway Overturn (Pillar 142 Mehdipatnam):** Telugu-English code-switched caller, overturned car, arterial hemorrhage, engine smoke hazard, mid-sentence barge-in.
2. **DLF Cybercity Cardiac Arrest (Gachibowli):** Hindi-English caller, 45-year-old collapsed victim, bystander CPR pacing, public access AED retrieval.
3. **Balanagar Chemical Warehouse Fire (Sanath Nagar):** Hyderabadi Urdu, exploding solvent drums, toxic fume inhalation, 3 trapped workers.

---

## 7. Local Setup & Live Demo

### Live URL
🌐 **[https://abhishektungala.github.io/aapadalive-deepmind-hyderabad/](https://abhishektungala.github.io/aapadalive-deepmind-hyderabad/)**

### Running Locally
```bash
# 1. Clone repository
git clone https://github.com/AbhishekTungala/aapadalive-deepmind-hyderabad.git
cd aapadalive-deepmind-hyderabad

# 2. Install dependencies
npm install

# 3. Configure API Key (Optional for simulation, required for live mic)
cp .env.example .env
# Set VITE_GEMINI_API_KEY=your_gemini_api_key

# 4. Start development server
npm run dev

# 5. Build for production
npm run build
```

---

## 8. Hackathon Submission Information
- **Event:** Google DeepMind Hyderabad Hackathon
- **Problem Statement:** Problem Statement 2: Next-Gen Voice & Real-Time Audio
- **Team Name / Author:** Abhishek Tungala
- **Repository:** [https://github.com/AbhishekTungala/aapadalive-deepmind-hyderabad](https://github.com/AbhishekTungala/aapadalive-deepmind-hyderabad)
