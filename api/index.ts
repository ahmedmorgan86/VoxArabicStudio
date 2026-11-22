import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

export const app = express();
app.use(express.json({ limit: '15mb' }));

const VALID_GEMINI_VOICES = [
  'Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr',
  'Aoede', 'Leda', 'Orus', 'Callirrhoe', 'Autonoe',
  'Enceladus', 'Iapetus', 'Umbriel', 'Algieba', 'Despina',
  'Erinome', 'Algenib', 'Rasalgethi', 'Laomedeia', 'Achernar',
  'Alnilam', 'Schedar', 'Gacrux', 'Pulcherrima', 'Achird',
  'Zubenelgenubi', 'Vindemiatrix', 'Sadachbia', 'Sadaltager', 'Sulafat',
];

const ARABIC_DIALECT_INSTRUCTIONS: Record<string, string> = {
  msa: 'Modern Standard Arabic with crisp, clear broadcast pronunciation (فصحى معاصرة واضحة)',
  classical: 'Classical literary & poetic Arabic with strict articulation and eloquent resonance (فصحى كلاسيكية وتراثية فخمة)',
  egyptian: 'Authentic Egyptian Cairo Arabic dialect, natural and lively (لهجة مصرية قاهرية عامية طبيعية)',
  egyptian_saidi: 'Upper Egyptian Saidi Arabic dialect, warm, bold and traditional (لهجة صعيدية مصرية أصيلة)',
  sudanese: 'Sudanese Arabic dialect, warm, gentle and hospitable cadence (لهجة سودانية دافئة ومضيافة)',
  saudi_najdi: 'Saudi Najdi Riyadh Arabic dialect, prestigious and confident (لهجة سعودية نجدية أصيلة)',
  saudi_hijazi: 'Saudi Hijazi Jeddah & Makkah Arabic dialect, smooth and melodic (لهجة سعودية حجازية عذبة)',
  emirati: 'Emirati Gulf Arabic dialect, refined, warm and modern (لهجة إماراتية خليجية راقية)',
  kuwaiti: 'Kuwaiti Gulf Arabic dialect, expressive and conversational (لهجة كويتية خليجية محببة)',
  qatari_bahraini: 'Qatari and Bahraini Gulf Arabic dialect, grounded and warm (لهجة قطرية وبحرينية أصيلة)',
  yemeni: 'Yemeni Arabic dialect, deep-rooted and poetic (لهجة يمنية أصيلة دافئة)',
  syrian: 'Syrian Damascene Levantine Arabic dialect, sweet and melodic (لهجة سورية شامية دمشقية)',
  lebanese: 'Lebanese Beirut Arabic dialect, lyrical, graceful and expressive (لهجة لبنانية عذبة وموسيقية)',
  jordanian_palestinian: 'Jordanian and Palestinian Levantine Arabic dialect, clear and heartfelt (لهجة أردنية وفلسطينية أصيلة)',
  iraqi: 'Iraqi Baghdadi Arabic dialect, soulful and emotionally resonant (لهجة عراقية بغدادية شجية)',
  moroccan: 'Moroccan Darija Arabic dialect with authentic Maghrebi rhythm (لهجة مغربية دارجة أصيلة)',
  algerian: 'Algerian Arabic dialect, vibrant Maghrebi cadence (لهجة جزائرية دارجة معبرة)',
  tunisian: 'Tunisian Arabic dialect, melodic and smooth Maghrebi cadence (لهجة تونسية لطيفة وعذبة)',
  // Legacy alias fallback
  gulf: 'Saudi & Gulf Arabic dialect, authentic and prestigious (لهجة خليجية سعودية أصيلة)',
  levantine: 'Levantine Syrian/Lebanese Arabic dialect, melodic and warm (لهجة شامية عذبة)',
  maghrebi: 'North African Maghrebi Darija Arabic dialect (لهجة مغاربية دارجة)',
};

const ENGLISH_DIALECT_INSTRUCTIONS: Record<string, string> = {
  american: 'Clear, natural General American English accent',
  american_southern: 'Warm Southern United States / Texas drawl accent',
  canadian: 'Clean, polite Canadian English accent',
  british: 'Sophisticated British Received Pronunciation (RP) accent',
  british_london: 'Contemporary Urban London British accent with vibrant character',
  scottish: 'Rich, authentic Scottish English accent with warm rolling cadence',
  irish: 'Musical, lyrical Irish English lilt',
  australian: 'Upbeat, sunny Australian English accent',
  indian: 'Articulate, crisp Indian English accent',
  south_african: 'Distinctive, grounded South African English accent',
};

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please add GEMINI_API_KEY in your Vercel Project Settings > Environment Variables (مفتاح GEMINI_API_KEY غير موجود في إعدادات البيئة).'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function buildVoiceSettingsDirective(voiceSettings?: {
  stability?: number;
  styleExaggeration?: number;
  speed?: number;
  pitch?: number;
  speakerBoost?: boolean;
}): string {
  if (!voiceSettings) return '';
  const parts: string[] = [];

  if (typeof voiceSettings.stability === 'number') {
    if (voiceSettings.stability <= 30) {
      parts.push('highly dynamic, expressive, varied emotional pitch and spontaneous inflection');
    } else if (voiceSettings.stability >= 75) {
      parts.push('ultra-steady, consistent, controlled broadcast stability with minimal fluctuation');
    } else {
      parts.push('balanced natural vocal consistency');
    }
  }

  if (typeof voiceSettings.styleExaggeration === 'number') {
    if (voiceSettings.styleExaggeration >= 70) {
      parts.push('strongly heightened theatrical emotional emphasis and dramatic delivery');
    } else if (voiceSettings.styleExaggeration <= 20) {
      parts.push('subtle, restrained, understated delivery');
    }
  }

  if (typeof voiceSettings.speed === 'number') {
    const rateStr = `${voiceSettings.speed.toFixed(2)}x`;
    if (voiceSettings.speed <= 0.72) {
      parts.push(`speaking rate ${rateStr}: very slow, deliberate, unhurried dramatic pacing`);
    } else if (voiceSettings.speed <= 0.88) {
      parts.push(`speaking rate ${rateStr}: measured, calm and relaxed speaking tempo`);
    } else if (voiceSettings.speed >= 1.32) {
      parts.push(`speaking rate ${rateStr}: very brisk, rapid, high-tempo energetic delivery`);
    } else if (voiceSettings.speed >= 1.12) {
      parts.push(`speaking rate ${rateStr}: lively, noticeably brisk speaking pace`);
    } else {
      parts.push(`speaking rate ${rateStr}: natural standard speaking pace`);
    }
  }

  if (typeof voiceSettings.pitch === 'number') {
    const pitchStr = `${voiceSettings.pitch > 0 ? `+${voiceSettings.pitch}` : voiceSettings.pitch} semitones`;
    if (voiceSettings.pitch <= -4) {
      parts.push(`vocal pitch ${pitchStr}: very deep, low bass chest resonance`);
    } else if (voiceSettings.pitch <= -1) {
      parts.push(`vocal pitch ${pitchStr}: warm, noticeably lowered baritone register`);
    } else if (voiceSettings.pitch >= 4) {
      parts.push(`vocal pitch ${pitchStr}: noticeably higher, bright and elevated vocal pitch`);
    } else if (voiceSettings.pitch >= 1) {
      parts.push(`vocal pitch ${pitchStr}: slightly lifted, brighter upper vocal tone`);
    } else {
      parts.push(`vocal pitch 0 semitones: natural mid-range register`);
    }
  }

  if (voiceSettings.speakerBoost) {
    parts.push('studio close-mic vocal presence and crystal-clear articulation');
  }

  return parts.join(', ');
}

function hasExpressiveAudioTags(text: string): boolean {
  return /<(breath|laugh|gasp)>|\|(yeah|mhm)\|/i.test(text);
}

interface ParsedGeminiError {
  httpStatus: number;
  errorCode: string;
  isQuotaOrRateLimit: boolean;
  isRetryableSameModel: boolean;
  retryDelaySec?: number;
  messageAr: string;
  messageEn: string;
}

function formatRetryWaitAr(sec?: number): string {
  if (!sec || sec <= 0) return 'لاحقاً';
  if (sec < 60) return `بعد ${sec} ثانية`;
  if (sec < 3600) return `بعد ${Math.ceil(sec / 60)} دقيقة`;
  const hrs = Math.floor(sec / 3600);
  const mins = Math.ceil((sec % 3600) / 60);
  return mins > 0 ? `بعد ${hrs} ساعة و ${mins} دقيقة` : `بعد ${hrs} ساعة`;
}

function formatRetryWaitEn(sec?: number): string {
  if (!sec || sec <= 0) return 'later';
  if (sec < 60) return `in ${sec}s`;
  if (sec < 3600) return `in ${Math.ceil(sec / 60)} min`;
  const hrs = Math.floor(sec / 3600);
  const mins = Math.ceil((sec % 3600) / 60);
  return mins > 0 ? `in ${hrs}h ${mins}m` : `in ${hrs}h`;
}

function parseGeminiError(err: any): ParsedGeminiError {
  const rawMsg = String(err?.message || err || 'Unknown error');
  let parsedJson: any = null;

  const jsonStart = rawMsg.indexOf('{');
  if (jsonStart !== -1) {
    try {
      parsedJson = JSON.parse(rawMsg.slice(jsonStart));
    } catch {
      // ignore non-JSON tail
    }
  }

  const errObj = parsedJson?.error || parsedJson;
  const code = Number(err?.status || err?.code || errObj?.code || 500);
  const statusStr = String(errObj?.status || err?.statusText || '').toUpperCase();
  const detailMsg = String(errObj?.message || rawMsg);

  let retryDelaySec: number | undefined;
  const retryInfo = Array.isArray(errObj?.details)
    ? errObj.details.find((d: any) => d?.retryDelay)
    : null;
  if (retryInfo?.retryDelay) {
    const m = String(retryInfo.retryDelay).match(/(\d+(?:\.\d+)?)s/);
    if (m) retryDelaySec = Math.ceil(Number(m[1]));
  }

  const isDailyQuota =
    /RequestsPerDay|PerDayPerProject|free_tier_requests|limit:\s*10/i.test(detailMsg) ||
    (retryDelaySec !== undefined && retryDelaySec > 120);

  const isQuotaOrRateLimit =
    code === 429 ||
    statusStr === 'RESOURCE_EXHAUSTED' ||
    /quota|rate.?limit|RESOURCE_EXHAUSTED/i.test(detailMsg);

  if (isQuotaOrRateLimit) {
    return {
      httpStatus: 429,
      errorCode: isDailyQuota ? 'QUOTA_EXCEEDED' : 'RATE_LIMITED',
      isQuotaOrRateLimit: true,
      isRetryableSameModel: !isDailyQuota && (retryDelaySec === undefined || retryDelaySec <= 10),
      retryDelaySec,
      messageAr: isDailyQuota
        ? `تم استهلاك الحصة اليومية المجانية لنموذج الصوت (10 طلبات/يوم على الخطة المجانية). يمكنك ربط مفتاح API مدفوع من لوحة Settings > Secrets لرفع الحد فوراً، أو المحاولة مجدداً ${formatRetryWaitAr(retryDelaySec)}.`
        : `تم تجاوز حد الطلبات المؤقت (Rate Limit). يرجى المحاولة ${formatRetryWaitAr(retryDelaySec || 15)}.`,
      messageEn: isDailyQuota
        ? `Daily free-tier quota exceeded (10 requests/day). Select a billing-enabled API key in Settings > Secrets to increase your quota immediately, or retry ${formatRetryWaitEn(retryDelaySec)}.`
        : `Temporary rate limit reached. Please retry ${formatRetryWaitEn(retryDelaySec || 15)}.`,
    };
  }

  if (code === 401 || code === 403 || /API_KEY_INVALID|PERMISSION_DENIED/i.test(detailMsg)) {
    return {
      httpStatus: code === 401 ? 401 : 403,
      errorCode: 'API_KEY_ERROR',
      isQuotaOrRateLimit: false,
      isRetryableSameModel: false,
      messageAr: 'مفتاح Gemini API غير صالح أو يفتقر للصلاحية. يرجى التحقق من المفتاح في Settings > Secrets.',
      messageEn: 'Invalid or unauthorized Gemini API key. Please check Settings > Secrets.',
    };
  }

  return {
    httpStatus: code >= 400 && code < 600 ? code : 500,
    errorCode: 'TTS_ERROR',
    isQuotaOrRateLimit: false,
    isRetryableSameModel: code === 503 || code === 500,
    messageAr: detailMsg.length < 220 ? detailMsg : 'حدث خطأ أثناء معالجة الصوت. يرجى المحاولة مرة أخرى.',
    messageEn: detailMsg.length < 220 ? detailMsg : 'Failed to synthesize speech. Please try again.',
  };
}

type TtsModelName = 'gemini-3.8-flash-lite-tts' | 'gemini-3.8-flash-tts';

// Track temporary quota/rate-limit cooldowns per TTS model so we route directly
// to an available sibling model without wasted failed calls or noisy stderr warnings.
const ttsModelCooldownUntil = new Map<TtsModelName, number>();

function isTtsModelCoolingDown(model: TtsModelName): boolean {
  const until = ttsModelCooldownUntil.get(model);
  if (!until) return false;
  if (Date.now() >= until) {
    ttsModelCooldownUntil.delete(model);
    return false;
  }
  return true;
}

function recordTtsModelCooldown(model: TtsModelName, parsed: ParsedGeminiError): void {
  if (!parsed.isQuotaOrRateLimit) return;
  const fallbackMs =
    parsed.errorCode === 'QUOTA_EXCEEDED' ? 30 * 60 * 1000 : 30 * 1000;
  const delayMs = parsed.retryDelaySec
    ? Math.min(60 * 60 * 1000, Math.max(15 * 1000, parsed.retryDelaySec * 1000))
    : fallbackMs;
  ttsModelCooldownUntil.set(model, Date.now() + delayMs);
}

async function generateTtsWithFallback(
  ai: GoogleGenAI,
  primaryModel: TtsModelName,
  fallbackModel: TtsModelName | null,
  requestParams: Omit<Parameters<typeof ai.models.generateContent>[0], 'model'>
): Promise<{ response: any; modelUsed: string }> {
  // If primaryModel is currently cooling down from quota exhaustion and a sibling fallback
  // model is healthy, route directly to the fallback model immediately.
  const startWithFallback =
    Boolean(fallbackModel && fallbackModel !== primaryModel) &&
    isTtsModelCoolingDown(primaryModel) &&
    !isTtsModelCoolingDown(fallbackModel!);

  const firstModel = startWithFallback ? fallbackModel! : primaryModel;
  const secondModel =
    fallbackModel && fallbackModel !== firstModel ? fallbackModel : null;

  try {
    const response = await ai.models.generateContent({
      model: firstModel,
      ...requestParams,
    });
    return { response, modelUsed: firstModel };
  } catch (primaryErr: any) {
    const parsed = parseGeminiError(primaryErr);
    recordTtsModelCooldown(firstModel, parsed);

    // Quick retry once if transient RPM limit / 503
    if (parsed.isRetryableSameModel) {
      await new Promise((r) => setTimeout(r, 900));
      try {
        const retryResponse = await ai.models.generateContent({
          model: firstModel,
          ...requestParams,
        });
        ttsModelCooldownUntil.delete(firstModel);
        return { response: retryResponse, modelUsed: firstModel };
      } catch {
        // proceed to fallback model
      }
    }

    // Seamlessly switch to sibling TTS model when quota/404/503 is hit
    if (secondModel) {
      try {
        const fallbackResponse = await ai.models.generateContent({
          model: secondModel,
          ...requestParams,
        });
        return { response: fallbackResponse, modelUsed: secondModel };
      } catch (fallbackErr: any) {
        recordTtsModelCooldown(secondModel, parseGeminiError(fallbackErr));
        throw fallbackErr;
      }
    }

    throw primaryErr;
  }
}

function extractWavPcm(wavBuffer: Buffer): {
  sampleRate: number;
  numChannels: number;
  bitsPerSample: number;
  pcm: Buffer;
} {
  let sampleRate = 24000;
  let numChannels = 1;
  let bitsPerSample = 16;
  let dataOffset = 44;
  let dataSize = Math.max(0, wavBuffer.length - 44);

  if (wavBuffer.length >= 12 && wavBuffer.toString('ascii', 0, 4) === 'RIFF') {
    let pos = 12;
    while (pos + 8 <= wavBuffer.length) {
      const chunkId = wavBuffer.toString('ascii', pos, pos + 4);
      const chunkSize = wavBuffer.readUInt32LE(pos + 4);
      if (chunkId === 'fmt ' && pos + 24 <= wavBuffer.length) {
        numChannels = wavBuffer.readUInt16LE(pos + 10) || 1;
        sampleRate = wavBuffer.readUInt32LE(pos + 12) || 24000;
        bitsPerSample = wavBuffer.readUInt16LE(pos + 22) || 16;
      } else if (chunkId === 'data') {
        dataOffset = pos + 8;
        dataSize = Math.min(chunkSize, wavBuffer.length - dataOffset);
        break;
      }
      pos += 8 + chunkSize + (chunkSize % 2);
    }
  }

  return {
    sampleRate,
    numChannels,
    bitsPerSample,
    pcm: wavBuffer.subarray(dataOffset, dataOffset + dataSize),
  };
}

function buildWavFromPcm(
  pcm: Buffer,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);

  return Buffer.concat([header, pcm]);
}

function parseTargetDurationSeconds(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const num = Number(value);
  if (!Number.isFinite(num) || num < 2 || num > 300) return undefined;
  return Number(num.toFixed(1));
}

function estimateSpeechSecondsServer(
  text: string,
  language: string = 'ar',
  speed = 1.0
): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const cues = trimmed.match(/<(breath|laugh|gasp)>|\|(yeah|mhm)\|/gi)?.length || 0;
  const clean = trimmed
    .replace(/<(breath|laugh|gasp)>|\|(yeah|mhm)\|/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = clean ? clean.split(/\s+/).filter(Boolean).length : 0;
  const pauses = clean.match(/[.!?؟،,;:\n]+/g)?.length || 0;
  const wps = language === 'en' ? 2.48 : 2.15;
  const clampedSpeed = Math.max(0.6, Math.min(1.5, speed || 1.0));
  const speechSec = words / (wps * clampedSpeed);
  return Number(
    Math.max(0.8, speechSec + cues * 0.45 + Math.min(pauses * 0.16, speechSec * 0.28 + 0.6) + 0.25).toFixed(1)
  );
}

function buildTargetDurationDirective(targetSeconds: number, estimatedSeconds: number): string {
  const ratio = estimatedSeconds > 0 ? estimatedSeconds / targetSeconds : 1.0;
  if (ratio > 1.25) {
    return `Timing Target: deliver smoothly and briskly with minimal pauses so the entire script finishes cleanly in approximately ${targetSeconds} seconds`;
  }
  if (ratio < 0.78) {
    return `Timing Target: deliver at a deliberate, unhurried, spacious cadence with natural expressive pauses so the speech fills approximately ${targetSeconds} seconds`;
  }
  return `Timing Target: pace the delivery naturally to finish right around ${targetSeconds} seconds`;
}

/**
 * Pitch-preserving WSOLA (Waveform Similarity Overlap-Add) time-stretching for 16-bit mono PCM.
 */
function wsolaTimeStretchMono(
  input: Int16Array,
  targetFrames: number,
  sampleRate: number
): Int16Array {
  const inputLen = input.length;
  if (targetFrames <= 0) return new Int16Array(0);
  if (inputLen === 0) return new Int16Array(targetFrames);

  let winSize = Math.max(256, Math.round(sampleRate * 0.04)); // 40ms window
  if (winSize % 2 !== 0) winSize += 1;
  const hop = winSize / 2;
  const searchRadius = Math.max(64, Math.round(sampleRate * 0.01)); // ±10ms search

  if (inputLen <= winSize + 16 || targetFrames <= winSize) {
    const simple = new Int16Array(targetFrames);
    const copyLen = Math.min(inputLen, targetFrames);
    for (let i = 0; i < copyLen; i++) simple[i] = input[i];
    return simple;
  }

  // Precompute Hann window
  const hann = new Float32Array(winSize);
  for (let i = 0; i < winSize; i++) {
    hann[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / winSize));
  }

  const out = new Float32Array(targetFrames);
  const weight = new Float32Array(targetFrames);
  const speedRatio = inputLen / targetFrames;

  let prevInPos = 0;

  for (let outPos = 0; outPos < targetFrames; outPos += hop) {
    let bestInPos = 0;

    if (outPos === 0) {
      bestInPos = 0;
    } else {
      const nominalIn = Math.round(outPos * speedRatio);
      const refPos = Math.min(inputLen - hop - 1, Math.max(0, prevInPos + hop));
      const minCand = Math.max(0, nominalIn - searchRadius);
      const maxCand = Math.min(inputLen - winSize, nominalIn + searchRadius);

      if (minCand >= maxCand) {
        bestInPos = Math.max(0, Math.min(inputLen - winSize, nominalIn));
      } else {
        bestInPos = Math.max(minCand, Math.min(maxCand, nominalIn));
        let bestScore = -Infinity;

        for (let cand = minCand; cand <= maxCand; cand += 2) {
          let cross = 0;
          let energy = 0;
          for (let k = 0; k < hop; k += 4) {
            const a = input[refPos + k];
            const b = input[cand + k];
            cross += a * b;
            energy += b * b;
          }
          const score = cross / (Math.sqrt(energy) + 1e-3);
          if (score > bestScore) {
            bestScore = score;
            bestInPos = cand;
          }
        }
      }
    }

    const limit = Math.min(winSize, targetFrames - outPos, inputLen - bestInPos);
    for (let i = 0; i < limit; i++) {
      const w = outPos === 0 && i < hop ? 1.0 : hann[i];
      out[outPos + i] += input[bestInPos + i] * w;
      weight[outPos + i] += w;
    }

    prevInPos = bestInPos;
  }

  const result = new Int16Array(targetFrames);
  for (let i = 0; i < targetFrames; i++) {
    const val = weight[i] > 1e-4 ? out[i] / weight[i] : 0;
    result[i] = Math.max(-32768, Math.min(32767, Math.round(val)));
  }

  // Smooth short fade-in (10ms) and fade-out (20ms) to avoid any edge click
  const fadeIn = Math.min(Math.round(sampleRate * 0.01), Math.floor(targetFrames / 8));
  const fadeOut = Math.min(Math.round(sampleRate * 0.02), Math.floor(targetFrames / 6));
  for (let i = 0; i < fadeIn; i++) {
    result[i] = Math.round(result[i] * (i / fadeIn));
  }
  for (let i = 0; i < fadeOut; i++) {
    const idx = targetFrames - fadeOut + i;
    result[idx] = Math.round(result[idx] * (1 - i / fadeOut));
  }

  return result;
}

type ServerDurationFitMode =
  | 'auto'
  | 'exact'
  | 'stretched'
  | 'stretched_and_padded'
  | 'max_speed_capped';

function fitWavBufferToTargetDuration(
  wavBuffer: Buffer,
  targetSeconds?: number
): {
  wavBuffer: Buffer;
  originalDurationSec: number;
  finalDurationSec: number;
  durationFitMode: ServerDurationFitMode;
} {
  const { sampleRate, numChannels, bitsPerSample, pcm } = extractWavPcm(wavBuffer);
  const bytesPerSample = Math.max(1, bitsPerSample / 8);
  const blockAlign = numChannels * bytesPerSample;
  const totalFrames = blockAlign > 0 ? Math.floor(pcm.length / blockAlign) : 0;
  const originalDurationSec =
    sampleRate > 0 ? Number((totalFrames / sampleRate).toFixed(2)) : 0;

  if (!targetSeconds || totalFrames <= 0 || bitsPerSample !== 16 || numChannels !== 1) {
    return {
      wavBuffer,
      originalDurationSec,
      finalDurationSec: originalDurationSec,
      durationFitMode: 'auto',
    };
  }

  // Read mono Int16 samples
  const rawSamples = new Int16Array(totalFrames);
  for (let i = 0; i < totalFrames; i++) {
    rawSamples[i] = pcm.readInt16LE(i * 2);
  }

  // Trim excessive leading/trailing dead air (> 65ms) while keeping 55ms natural breath margin
  const silenceThreshold = 190;
  const marginFrames = Math.round(sampleRate * 0.055);
  let firstActive = 0;
  let lastActive = totalFrames - 1;

  while (firstActive < totalFrames && Math.abs(rawSamples[firstActive]) < silenceThreshold) {
    firstActive++;
  }
  while (lastActive > firstActive && Math.abs(rawSamples[lastActive]) < silenceThreshold) {
    lastActive--;
  }

  const trimStart = firstActive < lastActive ? Math.max(0, firstActive - marginFrames) : 0;
  const trimEnd =
    firstActive < lastActive ? Math.min(totalFrames, lastActive + marginFrames) : totalFrames;
  const trimmed = rawSamples.subarray(trimStart, trimEnd);
  const trimmedFrames = trimmed.length;

  const targetFrames = Math.max(1, Math.round(targetSeconds * sampleRate));
  const speedRatio = trimmedFrames / targetFrames;

  let finalSamples: Int16Array;
  let mode: ServerDurationFitMode;

  if (Math.abs(speedRatio - 1) <= 0.015) {
    finalSamples = new Int16Array(targetFrames);
    const copyCount = Math.min(trimmedFrames, targetFrames);
    finalSamples.set(trimmed.subarray(0, copyCount), 0);
    const fadeOut = Math.min(Math.round(sampleRate * 0.025), Math.floor(copyCount / 6));
    for (let i = 0; i < fadeOut; i++) {
      const idx = copyCount - fadeOut + i;
      finalSamples[idx] = Math.round(finalSamples[idx] * (1 - i / fadeOut));
    }
    mode = 'exact';
  } else if (speedRatio < 0.72) {
    // Text is notably shorter than requested duration: slow down naturally (0.75x) then pad clean silence
    const naturalStretchedFrames = Math.min(targetFrames, Math.round(trimmedFrames / 0.75));
    const stretchedSpeech = wsolaTimeStretchMono(trimmed, naturalStretchedFrames, sampleRate);
    finalSamples = new Int16Array(targetFrames);
    finalSamples.set(stretchedSpeech, 0);
    mode = 'stretched_and_padded';
  } else if (speedRatio > 1.48) {
    // Text is much longer than requested duration: cap speed at natural 1.48x (never cut off spoken words)
    const cappedFrames = Math.max(1, Math.round(trimmedFrames / 1.48));
    finalSamples = wsolaTimeStretchMono(trimmed, cappedFrames, sampleRate);
    mode = 'max_speed_capped';
  } else {
    // Within natural pitch-preserving stretch zone [0.72x .. 1.48x]: hit exact targetFrames
    finalSamples = wsolaTimeStretchMono(trimmed, targetFrames, sampleRate);
    mode = 'stretched';
  }

  const outPcm = Buffer.alloc(finalSamples.length * 2);
  for (let i = 0; i < finalSamples.length; i++) {
    outPcm.writeInt16LE(finalSamples[i], i * 2);
  }

  const fittedWav = buildWavFromPcm(outPcm, sampleRate, numChannels, bitsPerSample);
  const finalDurationSec = Number((finalSamples.length / sampleRate).toFixed(2));

  return {
    wavBuffer: fittedWav,
    originalDurationSec,
    finalDurationSec,
    durationFitMode: mode,
  };
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    supportedVoicesCount: VALID_GEMINI_VOICES.length,
  });
});

// Audition in-memory cache
const auditionCache = new Map<string, string>();

// Audition voice samples endpoint
app.get('/api/voices/audition/:voice', async (req, res) => {
  try {
    const voice = req.params.voice;
    const lang = req.query.lang === 'en' ? 'en' : 'ar';
    if (!VALID_GEMINI_VOICES.includes(voice)) {
      return res.status(400).json({ error: 'Invalid voice' });
    }

    const cacheKey = `${voice}:${lang}`;
    if (auditionCache.has(cacheKey)) {
      return res.json({
        success: true,
        audioBase64: auditionCache.get(cacheKey),
        mimeType: 'audio/wav',
        voice,
      });
    }

    const arGreetings: Record<string, string> = {
      Kore: 'مرحباً بك، أنا كوري، صوتي دافئ ونقي ومناسب لكافة نصوصك.',
      Puck: 'أهلاً يا صديقي! أنا باك، مفعم بالطاقة والحيوية وجاهز لكل أفكارك!',
      Charon: 'أهلاً بكم، أنا شارون، صوت عميق ورزين للأفلام والوثائقيات.',
      Fenrir: 'مرحباً، أنا فنرير، صوت قوي وملحمي يمنح كلماتك هيبة وتأثيراً.',
      Zephyr: 'مرحباً، أنا زفير، نبرة هادئة ورقيقة تنساب بالسكينة والجمال.',
      Aoede: 'أهلاً بكم، أنا أويدي، صوت انسيابي وعذب للبودكاست والقصص.',
      Leda: 'مرحباً! أنا ليدا، صوت شبابي مشرق وواضح لكل محتواك العصري.',
      Orus: 'أهلاً بكم، أنا أوروس، نبرة حازمة وموثوقة لنشرات الأخبار والتقارير.',
      Sulafat: 'مرحباً بكم، أنا سولافات، صوت حريري دافئ يلامس القلوب.',
      Enceladus: 'أهلاً بك، أنا إنسيلادوس، نبرة هامسة وهادئة للتأمل والخواطر.',
      Algenib: 'مرحباً يا صديقي، أنا الجنب، صوت وقور ذو بحة درامية أصيلة.',
      Despina: 'أهلاً بكم، أنا ديسبينا، أداء مصقول وسلس للإعلانات الراقية.',
      Umbriel: 'يا أهلاً! أنا أومبرييل، صوت مريح وعفوي للحوارات اليومية.',
      Algieba: 'مرحباً، أنا الجبهة، صوت مخملي أنيق للروايات والشعر.',
    };

    const greetingText =
      lang === 'en'
        ? `Hello there, I am ${voice}. Experience natural, expressive studio speech tailored to any accent or emotion.`
        : arGreetings[voice] ||
          `مرحباً بك في الاستوديو، أنا ${voice}، يسعدني تقديم نصوصك بأعلى جودة صوتية.`;

    const ai = getGeminiClient();
    const { response } = await generateTtsWithFallback(
      ai,
      'gemini-3.8-flash-lite-tts',
      'gemini-3.8-flash-tts',
      {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: greetingText,
                speechMetadata: {
                  style: 'Warm, expressive natural human delivery',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            languageCode: lang,
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      }
    );

    const audioBase64 =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioBase64) {
      throw new Error('Failed to generate audition sample.');
    }

    auditionCache.set(cacheKey, audioBase64);

    return res.json({
      success: true,
      audioBase64,
      mimeType: 'audio/wav',
      voice,
    });
  } catch (err: any) {
    console.error('Audition error:', err);
    const parsed = parseGeminiError(err);
    return res.status(parsed.httpStatus).json({
      error: parsed.messageEn,
      errorAr: parsed.messageAr,
      code: parsed.errorCode,
    });
  }
});

// Side-by-side A/B Voice Comparison endpoint (generates short sample for two voices on the same text)
app.post('/api/voices/compare', async (req, res) => {
  try {
    const {
      text,
      voiceA = 'Kore',
      voiceB = 'Charon',
      voiceADesignPrompt,
      voiceBDesignPrompt,
      language = 'ar',
      dialect = 'msa',
      customDialect,
      style = 'Natural and clear professional speaker',
      customTonePrompt,
    } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        error: language === 'en' ? 'Sample text is required for comparison.' : 'يرجى إدخال نص قصير للمقارنة بين الصوتين.',
      });
    }

    const trimmedSample = text.trim().slice(0, 280);
    const ai = getGeminiClient();

    const chosenA = VALID_GEMINI_VOICES.includes(voiceA) ? voiceA : 'Kore';
    const chosenB = VALID_GEMINI_VOICES.includes(voiceB) ? voiceB : 'Charon';

    let dialectNote = '';
    if (dialect === 'custom' && typeof customDialect === 'string' && customDialect.trim()) {
      dialectNote = customDialect.trim();
    } else if (language === 'ar') {
      dialectNote =
        ARABIC_DIALECT_INSTRUCTIONS[dialect] ||
        (typeof customDialect === 'string' && customDialect.trim()) ||
        ARABIC_DIALECT_INSTRUCTIONS.msa;
    } else {
      dialectNote =
        ENGLISH_DIALECT_INSTRUCTIONS[dialect] ||
        (typeof customDialect === 'string' && customDialect.trim()) ||
        ENGLISH_DIALECT_INSTRUCTIONS.american;
    }

    const synthesizeSlot = async (chosenVoice: string, designPrompt?: string) => {
      const segments: string[] = [];
      if (typeof designPrompt === 'string' && designPrompt.trim()) {
        segments.push(`Voice Design Persona: ${designPrompt.trim()}`);
      }
      if (typeof style === 'string' && style.trim()) {
        segments.push(`Performance Tone: ${style.trim()}`);
      }
      if (typeof customTonePrompt === 'string' && customTonePrompt.trim()) {
        segments.push(`Custom Directing Note: ${customTonePrompt.trim()}`);
      }
      segments.push(`Dialect/Accent: ${dialectNote}`);
      segments.push('Clear studio delivery for side-by-side voice audition.');

      const useFlash =
        Boolean(designPrompt && designPrompt.trim()) || hasExpressiveAudioTags(trimmedSample);
      const primaryModel: 'gemini-3.8-flash-lite-tts' | 'gemini-3.8-flash-tts' = useFlash
        ? 'gemini-3.8-flash-tts'
        : 'gemini-3.8-flash-lite-tts';
      const fallbackModel: 'gemini-3.8-flash-lite-tts' | 'gemini-3.8-flash-tts' =
        primaryModel === 'gemini-3.8-flash-lite-tts'
          ? 'gemini-3.8-flash-tts'
          : 'gemini-3.8-flash-lite-tts';

      const { response, modelUsed } = await generateTtsWithFallback(
        ai,
        primaryModel,
        fallbackModel,
        {
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: trimmedSample,
                  speechMetadata: {
                    style: segments.join('. '),
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              languageCode: language === 'en' ? 'en' : 'ar',
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: chosenVoice },
              },
            },
          },
        }
      );

      const audioBase64 =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!audioBase64) {
        throw new Error(`No audio returned for voice ${chosenVoice}`);
      }

      const wavBuf = Buffer.from(audioBase64, 'base64');
      const { sampleRate, numChannels, bitsPerSample, pcm } = extractWavPcm(wavBuf);
      const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
      const durationSec = byteRate > 0 ? Number((pcm.length / byteRate).toFixed(2)) : 0;

      return {
        voice: chosenVoice,
        audioBase64,
        mimeType: 'audio/wav',
        durationSec,
        modelUsed,
      };
    };

    const [sampleA, sampleB] = await Promise.all([
      synthesizeSlot(chosenA, voiceADesignPrompt),
      synthesizeSlot(chosenB, voiceBDesignPrompt),
    ]);

    return res.json({
      success: true,
      text: trimmedSample,
      sampleA,
      sampleB,
    });
  } catch (err: any) {
    console.error('Voice compare error:', err);
    const parsed = parseGeminiError(err);
    const isAr = req.body?.language !== 'en';
    return res.status(parsed.httpStatus).json({
      error: isAr ? parsed.messageAr : parsed.messageEn,
      errorCode: parsed.errorCode,
      retryDelaySec: parsed.retryDelaySec,
    });
  }
});

// Main TTS endpoint (auto-routes between gemini-3.8-flash-lite-tts and gemini-3.8-flash-tts)
app.post('/api/tts', async (req, res) => {
  try {
    const {
      text,
      voice = 'Kore',
      voiceDesignPrompt,
      language = 'ar',
      dialect = 'msa',
      customDialect,
      style = 'Natural and clear professional speaker',
      customTonePrompt,
      voiceSettings,
      modelMode = 'auto',
      targetDurationSeconds,
    } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text is required for speech synthesis' });
    }

    const ai = getGeminiClient();
    const parsedTargetDuration = parseTargetDurationSeconds(targetDurationSeconds);

    let dialectNote = '';
    if (dialect === 'custom' && typeof customDialect === 'string' && customDialect.trim()) {
      dialectNote = customDialect.trim();
    } else if (language === 'ar') {
      dialectNote =
        ARABIC_DIALECT_INSTRUCTIONS[dialect] ||
        (typeof customDialect === 'string' && customDialect.trim()) ||
        ARABIC_DIALECT_INSTRUCTIONS.msa;
    } else {
      dialectNote =
        ENGLISH_DIALECT_INSTRUCTIONS[dialect] ||
        (typeof customDialect === 'string' && customDialect.trim()) ||
        ENGLISH_DIALECT_INSTRUCTIONS.american;
    }

    const toneSegments: string[] = [];
    if (typeof voiceDesignPrompt === 'string' && voiceDesignPrompt.trim()) {
      toneSegments.push(`Voice Design Persona: ${voiceDesignPrompt.trim()}`);
    }
    if (typeof style === 'string' && style.trim()) {
      toneSegments.push(`Performance Tone: ${style.trim()}`);
    }
    if (typeof customTonePrompt === 'string' && customTonePrompt.trim()) {
      toneSegments.push(`Custom Directing Note: ${customTonePrompt.trim()}`);
    }
    toneSegments.push(`Dialect/Accent: ${dialectNote}`);

    const settingsDirective = buildVoiceSettingsDirective(voiceSettings);
    if (settingsDirective) {
      toneSegments.push(`Acoustic Delivery: ${settingsDirective}`);
    }
    if (parsedTargetDuration) {
      const estSec = estimateSpeechSecondsServer(
        text.trim(),
        language === 'en' ? 'en' : 'ar',
        voiceSettings?.speed || 1.0
      );
      toneSegments.push(buildTargetDurationDirective(parsedTargetDuration, estSec));
    }
    toneSegments.push('Pristine vocal fidelity, realistic cadence, natural human breathing and intonation.');

    const combinedStyle = toneSegments.join('. ');
    const chosenVoice = VALID_GEMINI_VOICES.includes(voice) ? voice : 'Kore';

    // Route to flagship gemini-3.8-flash-tts for Voice Design, vocal burst tags, or intense acting
    const useFlashFlagship =
      modelMode === 'flash' ||
      Boolean(voiceDesignPrompt && voiceDesignPrompt.trim()) ||
      hasExpressiveAudioTags(text) ||
      (voiceSettings?.styleExaggeration ?? 0) >= 75;

    const primaryModel: 'gemini-3.8-flash-lite-tts' | 'gemini-3.8-flash-tts' =
      useFlashFlagship ? 'gemini-3.8-flash-tts' : 'gemini-3.8-flash-lite-tts';
    const fallbackModel: 'gemini-3.8-flash-lite-tts' | 'gemini-3.8-flash-tts' =
      primaryModel === 'gemini-3.8-flash-lite-tts'
        ? 'gemini-3.8-flash-tts'
        : 'gemini-3.8-flash-lite-tts';

    const { response, modelUsed } = await generateTtsWithFallback(
      ai,
      primaryModel,
      fallbackModel,
      {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: text.trim(),
                speechMetadata: {
                  style: combinedStyle,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            languageCode: language === 'en' ? 'en' : 'ar',
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: chosenVoice },
            },
          },
        },
      }
    );

    const rawAudioBase64 =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!rawAudioBase64) {
      throw new Error('No audio returned from Gemini TTS engine.');
    }

    const rawWavBuffer = Buffer.from(rawAudioBase64, 'base64');
    const fitted = fitWavBufferToTargetDuration(rawWavBuffer, parsedTargetDuration);

    return res.json({
      success: true,
      audioBase64: fitted.wavBuffer.toString('base64'),
      mimeType: 'audio/wav',
      voice: chosenVoice,
      modelUsed,
      textLength: text.length,
      durationSec: fitted.finalDurationSec,
      originalDurationSec: fitted.originalDurationSec,
      durationFitMode: fitted.durationFitMode,
    });
  } catch (err: any) {
    console.error('Error generating speech:', err);
    const parsed = parseGeminiError(err);
    const isAr = req.body?.language === 'ar';
    return res.status(parsed.httpStatus).json({
      error: isAr ? parsed.messageAr : parsed.messageEn,
      errorCode: parsed.errorCode,
      retryDelaySec: parsed.retryDelaySec,
    });
  }
});

// Advanced Multi-Paragraph TTS (per-paragraph Speech Rate, Pitch, Tone, Voice & Silence Pause)
app.post('/api/tts/advanced', async (req, res) => {
  try {
    const {
      paragraphs,
      defaultVoice = 'Kore',
      defaultVoiceDesignPrompt,
      language = 'ar',
      dialect = 'msa',
      customDialect,
      stability = 50,
      styleExaggeration = 35,
      speakerBoost = true,
      targetDurationSeconds,
    } = req.body;

    if (!Array.isArray(paragraphs) || paragraphs.length === 0) {
      return res.status(400).json({ error: 'paragraphs array is required' });
    }

    const validParagraphs = paragraphs.filter(
      (p: any) => p && typeof p.text === 'string' && p.text.trim().length > 0
    );
    if (validParagraphs.length === 0) {
      return res.status(400).json({ error: 'At least one non-empty paragraph is required' });
    }

    const ai = getGeminiClient();
    const parsedTargetDuration = parseTargetDurationSeconds(targetDurationSeconds);

    let dialectNote = '';
    if (dialect === 'custom' && typeof customDialect === 'string' && customDialect.trim()) {
      dialectNote = customDialect.trim();
    } else if (language === 'ar') {
      dialectNote =
        ARABIC_DIALECT_INSTRUCTIONS[dialect] ||
        (typeof customDialect === 'string' && customDialect.trim()) ||
        ARABIC_DIALECT_INSTRUCTIONS.msa;
    } else {
      dialectNote =
        ENGLISH_DIALECT_INSTRUCTIONS[dialect] ||
        (typeof customDialect === 'string' && customDialect.trim()) ||
        ENGLISH_DIALECT_INSTRUCTIONS.american;
    }

    const pcmParts: Buffer[] = [];
    const paragraphDurations: Array<{ id: string; durationSec: number }> = [];
    let outputSampleRate = 24000;
    let outputChannels = 1;
    let outputBitsPerSample = 16;

    for (let idx = 0; idx < validParagraphs.length; idx++) {
      const p = validParagraphs[idx];
      const paraText = String(p.text).trim();
      const paraVoice = VALID_GEMINI_VOICES.includes(p.voice)
        ? p.voice
        : VALID_GEMINI_VOICES.includes(defaultVoice)
        ? defaultVoice
        : 'Kore';

      const designPrompt =
        typeof p.voiceDesignPrompt === 'string' && p.voiceDesignPrompt.trim()
          ? p.voiceDesignPrompt.trim()
          : typeof defaultVoiceDesignPrompt === 'string' && defaultVoiceDesignPrompt.trim()
          ? defaultVoiceDesignPrompt.trim()
          : '';

      const paraRate = typeof p.speechRate === 'number' ? p.speechRate : 1.0;
      const paraPitch = typeof p.pitch === 'number' ? p.pitch : 0;

      const settingsDirective = buildVoiceSettingsDirective({
        stability,
        styleExaggeration,
        speed: paraRate,
        pitch: paraPitch,
        speakerBoost,
      });

      const styleSegments = [
        designPrompt ? `Voice Design Persona: ${designPrompt}` : '',
        p.styleInstruction ? `Vocal Tone: ${p.styleInstruction}` : '',
        p.customTone ? `Paragraph Directing Note: ${p.customTone}` : '',
        `Dialect/Accent: ${dialectNote}`,
        settingsDirective ? `Acoustic Delivery: ${settingsDirective}` : '',
        'Pristine vocal fidelity, seamless natural transitions.',
      ].filter(Boolean);

      const useFlash =
        Boolean(designPrompt) ||
        hasExpressiveAudioTags(paraText) ||
        styleExaggeration >= 75;

      const paraPrimary: 'gemini-3.8-flash-lite-tts' | 'gemini-3.8-flash-tts' = useFlash
        ? 'gemini-3.8-flash-tts'
        : 'gemini-3.8-flash-lite-tts';
      const paraFallback: 'gemini-3.8-flash-lite-tts' | 'gemini-3.8-flash-tts' =
        paraPrimary === 'gemini-3.8-flash-lite-tts'
          ? 'gemini-3.8-flash-tts'
          : 'gemini-3.8-flash-lite-tts';

      const { response } = await generateTtsWithFallback(
        ai,
        paraPrimary,
        paraFallback,
        {
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: paraText,
                  speechMetadata: {
                    style: styleSegments.join('. '),
                  },
                },
              ],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              languageCode: language === 'en' ? 'en' : 'ar',
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: paraVoice },
              },
            },
          },
        }
      );

      const chunkBase64 =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!chunkBase64) {
        throw new Error(`No audio returned for paragraph #${idx + 1}`);
      }

      const wavBuf = Buffer.from(chunkBase64, 'base64');
      const extracted = extractWavPcm(wavBuf);

      if (idx === 0) {
        outputSampleRate = extracted.sampleRate;
        outputChannels = extracted.numChannels;
        outputBitsPerSample = extracted.bitsPerSample;
      }

      const bytesPerSec =
        outputSampleRate * outputChannels * (outputBitsPerSample / 8);
      const durationSec = bytesPerSec > 0 ? extracted.pcm.length / bytesPerSec : 0;
      paragraphDurations.push({
        id: String(p.id || idx + 1),
        durationSec: Number(durationSec.toFixed(2)),
      });

      pcmParts.push(extracted.pcm);

      // Append silence gap between paragraphs if configured
      const pauseMs =
        typeof p.pauseAfterMs === 'number' && p.pauseAfterMs > 0
          ? Math.min(4000, p.pauseAfterMs)
          : 0;
      if (pauseMs > 0 && idx < validParagraphs.length - 1) {
        const blockAlign = outputChannels * (outputBitsPerSample / 8);
        const silenceFrames = Math.round((pauseMs / 1000) * outputSampleRate);
        const silenceBuffer = Buffer.alloc(silenceFrames * blockAlign, 0);
        pcmParts.push(silenceBuffer);
      }
    }

    const mergedPcm = Buffer.concat(pcmParts);
    const mergedWav = buildWavFromPcm(
      mergedPcm,
      outputSampleRate,
      outputChannels,
      outputBitsPerSample
    );
    const fitted = fitWavBufferToTargetDuration(mergedWav, parsedTargetDuration);

    return res.json({
      success: true,
      audioBase64: fitted.wavBuffer.toString('base64'),
      mimeType: 'audio/wav',
      paragraphCount: validParagraphs.length,
      paragraphDurations,
      durationSec: fitted.finalDurationSec,
      originalDurationSec: fitted.originalDurationSec,
      durationFitMode: fitted.durationFitMode,
    });
  } catch (err: any) {
    console.error('Error in advanced multi-paragraph TTS:', err);
    const parsed = parseGeminiError(err);
    const isAr = req.body?.language === 'ar';
    return res.status(parsed.httpStatus).json({
      error: isAr ? parsed.messageAr : parsed.messageEn,
      errorCode: parsed.errorCode,
      retryDelaySec: parsed.retryDelaySec,
    });
  }
});

// Multi-Speaker Dialogue TTS using gemini-3.8-flash-tts
app.post('/api/tts/dialogue', async (req, res) => {
  try {
    const {
      dialogueLines,
      speakerAVoice = 'Puck',
      speakerBVoice = 'Kore',
      speakerAName = 'Speaker 1',
      speakerBName = 'Speaker 2',
      speakerADesignPrompt,
      speakerBDesignPrompt,
      language = 'ar',
      dialect,
      customDialect,
      targetDurationSeconds,
    } = req.body;

    if (!Array.isArray(dialogueLines) || dialogueLines.length === 0) {
      return res.status(400).json({ error: 'dialogueLines array is required' });
    }

    const ai = getGeminiClient();
    const parsedTargetDuration = parseTargetDurationSeconds(targetDurationSeconds);

    const voiceA = VALID_GEMINI_VOICES.includes(speakerAVoice) ? speakerAVoice : 'Puck';
    const voiceB = VALID_GEMINI_VOICES.includes(speakerBVoice) ? speakerBVoice : 'Kore';

    const normalizedSpeakerA =
      (typeof speakerAName === 'string' && speakerAName.trim()) || 'Speaker 1';
    let normalizedSpeakerB =
      (typeof speakerBName === 'string' && speakerBName.trim()) || 'Speaker 2';
    if (normalizedSpeakerA === normalizedSpeakerB) {
      normalizedSpeakerB = `${normalizedSpeakerB} 2`;
    }

    let dialectContext = '';
    if (dialect === 'custom' && typeof customDialect === 'string' && customDialect.trim()) {
      dialectContext = customDialect.trim();
    } else if (dialect) {
      dialectContext =
        language === 'ar'
          ? ARABIC_DIALECT_INSTRUCTIONS[dialect] || ''
          : ENGLISH_DIALECT_INSTRUCTIONS[dialect] || '';
    }

    const totalDialogueText = dialogueLines.map((l: any) => String(l.text || '')).join(' ');
    const dialogueTimingHint = parsedTargetDuration
      ? buildTargetDurationDirective(
          parsedTargetDuration,
          estimateSpeechSecondsServer(totalDialogueText, language === 'en' ? 'en' : 'ar', 1.0)
        )
      : '';

    const parts = dialogueLines.map((line: any) => {
      const isB = String(line.speaker).trim() === normalizedSpeakerB;
      const targetSpeaker = isB ? normalizedSpeakerB : normalizedSpeakerA;
      const personaPrompt = isB ? speakerBDesignPrompt : speakerADesignPrompt;
      const styleParts = [
        personaPrompt ? `Voice Persona: ${personaPrompt}` : '',
        line.style || 'Conversational and expressive',
        dialectContext ? `Dialect/Accent: ${dialectContext}` : '',
        dialogueTimingHint,
      ].filter(Boolean);

      return {
        text: `${targetSpeaker}: ${line.text}`,
        speechMetadata: {
          speaker: targetSpeaker,
          style: styleParts.join('. '),
        },
      };
    });

    const { response } = await generateTtsWithFallback(
      ai,
      'gemini-3.8-flash-tts',
      null,
      {
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            languageCode: language === 'en' ? 'en' : 'ar',
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: normalizedSpeakerA,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voiceA },
                  },
                },
                {
                  speaker: normalizedSpeakerB,
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voiceB },
                  },
                },
              ],
            },
          },
        },
      }
    );

    const rawAudioBase64 =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!rawAudioBase64) {
      throw new Error('No audio generated for dialogue.');
    }

    const rawWavBuffer = Buffer.from(rawAudioBase64, 'base64');
    const fitted = fitWavBufferToTargetDuration(rawWavBuffer, parsedTargetDuration);

    return res.json({
      success: true,
      audioBase64: fitted.wavBuffer.toString('base64'),
      mimeType: 'audio/wav',
      durationSec: fitted.finalDurationSec,
      originalDurationSec: fitted.originalDurationSec,
      durationFitMode: fitted.durationFitMode,
    });
  } catch (err: any) {
    console.error('Error in dialogue TTS:', err);
    const parsed = parseGeminiError(err);
    const isAr = req.body?.language === 'ar';
    return res.status(parsed.httpStatus).json({
      error: isAr ? parsed.messageAr : parsed.messageEn,
      errorCode: parsed.errorCode,
      retryDelaySec: parsed.retryDelaySec,
    });
  }
});

// AI Auto-Tashkeel for flawless Arabic pronunciation
app.post('/api/tashkeel', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Arabic text is required' });
    }

    const ai = getGeminiClient();
    const tashkeelPrompt = `أنت خبير في علم النحو والصرف واللغة العربية والأداء الصوتي الإذاعي.
قم بضبط وتشكيل النص العربي التالي تشكيلاً كاملاً ودقيقاً بنسبة 100% (الحركات: الفتحة، الضمة، الكسرة، السكون، التنوين، والشدة) لكي يتم نطقه عبر محرك تحويل النص إلى صوت (TTS) بأعلى درجات الفصاحة وسلاسة الإعراب دون أي لبس.
احتفظ بأي وسوم أداء صوتي مثل <breath> أو <laugh> أو <gasp> أو |yeah| أو |mhm| كما هي دون ترجمة أو تعديل.
لا تقم بتغيير معاني الكلمات. أعد النص المشكول فقط مباشرة دون أي مقدمات أو شروحات أو أقواس إضافية.

النص المراد تشكيله:
${text}`;

    let vocalizedText = text;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: tashkeelPrompt,
      });
      vocalizedText = response.text?.trim() || text;
    } catch {
      try {
        const liteResponse = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: tashkeelPrompt,
        });
        vocalizedText = liteResponse.text?.trim() || text;
      } catch (geminiErr: any) {
        console.warn('Tashkeel service temporary spike:', geminiErr?.message);
        return res.json({
          success: true,
          vocalizedText: text,
          notice: 'الخدمة تشهد ضغطاً مؤقتاً، تم الاحتفاظ بالنص الأصلي وهو جاهز للنطق.',
        });
      }
    }

    return res.json({ success: true, vocalizedText });
  } catch (err: any) {
    console.error('Error in auto-tashkeel:', err);
    const parsed = parseGeminiError(err);
    return res.status(parsed.httpStatus).json({ error: parsed.messageAr });
  }
});

// Dialect Rewrite / Translation
app.post('/api/dialect/convert', async (req, res) => {
  try {
    const { text, targetDialect, customDialect, targetLanguage = 'ar' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const ai = getGeminiClient();

    let targetPrompt = '';
    if (targetLanguage === 'ar') {
      const dialectNames: Record<string, string> = {
        msa: 'اللغة العربية الفصحى المعاصرة الراقية والمضبوطة لغوياً',
        classical: 'الفصحى التراثية الفخمة كأشعار وروايات العصر الذهبي',
        egyptian: 'اللهجة المصرية القاهرية الدارجة الطبيعية المليئة بالحيوية وخفة الظل',
        egyptian_saidi: 'اللهجة الصعيدية المصرية الأصيلة بمفرداتها ونبرتها المعروفة',
        sudanese: 'اللهجة السودانية الدافئة والعذبة بمفرداتها الأصيلة المحببة',
        saudi_najdi: 'اللهجة السعودية النجدية الأصيلة (أهل الرياض ونجد) بمفرداتها الوقورة',
        saudi_hijazi: 'اللهجة السعودية الحجازية العذبة (أهل جدة ومكة والمدينة)',
        emirati: 'اللهجة الإماراتية الخليجية الراقية والودودة',
        kuwaiti: 'اللهجة الكويتية الخليجية المعبرة والمحبوبة',
        qatari_bahraini: 'اللهجة القطرية والبحرينية الخليجية الأصيلة',
        yemeni: 'اللهجة اليمنية الأصيلة بمفرداتها وتعابيرها العريقة',
        syrian: 'اللهجة السورية الشامية الدمشقية اللطيفة والعذبة',
        lebanese: 'اللهجة اللبنانية العذبة والأنيقة بمفرداتها المحببة',
        jordanian_palestinian: 'اللهجة الأردنية والفلسطينية الشامية الواضحة والأصيلة',
        iraqi: 'اللهجة العراقية البغدادية الشجية والمعبرة بمفرداتها الأصيلة',
        moroccan: 'الدارجة المغربية الأصيلة المفهومة والجميلة',
        algerian: 'اللهجة الجزائرية الدارجة بتعابيرها المميزة',
        tunisian: 'اللهجة التونسية اللطيفة والسلسة',
        gulf: 'اللهجة الخليجية / السعودية الأصيلة',
        levantine: 'اللهجة الشامية العذبة',
        maghrebi: 'اللهجة المغاربية الدارجة',
      };
      const dialectDesc =
        targetDialect === 'custom' && typeof customDialect === 'string' && customDialect.trim()
          ? customDialect.trim()
          : dialectNames[targetDialect] ||
            (typeof customDialect === 'string' && customDialect.trim()) ||
            'اللهجة المطلوبة';

      targetPrompt = `أنت كاتب سيناريو صوتي ومتقن لجميع اللهجات العربية.
قم بإعادة صياغة النص التالي ببراعة واحترافية إلى: ${dialectDesc}.
حافظ على نفس الرسالة والمعنى والشعور، واحتفظ بأي وسوم أداء مثل <breath> أو <laugh> أو <gasp> كما هي.
استخدم المفردات والتعابير العفوية الدقيقة لتلك اللهجة حتى تبدو طبيعية جداً عند تحويلها لصوت.
أعد النص المعاد صياغته فقط بدون أي تفسير أو هوامش.

النص الأصلي:
${text}`;
    } else {
      const enDialects: Record<string, string> = {
        american: 'Natural General American conversational English',
        american_southern: 'Warm, authentic Southern US / Texas phrasing',
        canadian: 'Polite, natural Canadian English',
        british: 'Sophisticated British Received Pronunciation English phrasing',
        british_london: 'Vibrant contemporary London UK English phrasing',
        scottish: 'Warm, authentic Scottish English phrasing',
        irish: 'Melodic, warm Irish English phrasing',
        australian: 'Casual and upbeat Australian English phrasing',
        indian: 'Clear, articulate Indian English phrasing',
        south_african: 'Natural South African English phrasing',
      };
      const dialectDesc =
        targetDialect === 'custom' && typeof customDialect === 'string' && customDialect.trim()
          ? customDialect.trim()
          : enDialects[targetDialect] ||
            (typeof customDialect === 'string' && customDialect.trim()) ||
            'Natural fluent English';

      targetPrompt = `You are a native voiceover scriptwriter. Rewrite/translate the following text into ${dialectDesc}. Keep the tone engaging, human, and preserve any audio tags like <breath>, <laugh>, <gasp>, |yeah|, or |mhm| untouched. Output ONLY the rewritten text without quotation marks or explanations.

Input text:
${text}`;
    }

    let convertedText = text;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: targetPrompt,
      });
      convertedText = response.text?.trim() || text;
    } catch {
      try {
        const liteResponse = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: targetPrompt,
        });
        convertedText = liteResponse.text?.trim() || text;
      } catch (geminiErr: any) {
        console.warn('Dialect service temporary spike:', geminiErr?.message);
        return res.json({
          success: true,
          convertedText: text,
          notice: 'الخدمة تشهد ضغطاً مؤقتاً، يمكنك توليد الصوت مباشرة بالنص الحالي.',
        });
      }
    }

    return res.json({ success: true, convertedText });
  } catch (err: any) {
    console.error('Error in dialect conversion:', err);
    const parsed = parseGeminiError(err);
    return res.status(parsed.httpStatus).json({ error: parsed.messageAr });
  }
});

// AI Script Adaptation to Fit Target Voice Duration
app.post('/api/script/fit-duration', async (req, res) => {
  try {
    const {
      text,
      targetSeconds,
      language = 'ar',
      dialect = 'msa',
      customDialect,
      speed = 1.0,
    } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const parsedTarget = parseTargetDurationSeconds(targetSeconds);
    if (!parsedTarget) {
      return res.status(400).json({ error: 'targetSeconds must be between 2 and 300 seconds' });
    }

    const ai = getGeminiClient();
    const isEn = language === 'en';
    const clampedSpeed = Math.max(0.6, Math.min(1.5, Number(speed) || 1.0));
    const wordsPerSec = isEn ? 2.45 : 2.15;
    const targetWordCount = Math.max(4, Math.round(parsedTarget * wordsPerSec * clampedSpeed));
    const minWords = Math.max(3, Math.round(targetWordCount * 0.88));
    const maxWords = Math.max(minWords + 2, Math.round(targetWordCount * 1.12));

    const dialectNote =
      dialect === 'custom' && typeof customDialect === 'string' && customDialect.trim()
        ? customDialect.trim()
        : isEn
        ? ENGLISH_DIALECT_INSTRUCTIONS[dialect] || 'Natural fluent English'
        : ARABIC_DIALECT_INSTRUCTIONS[dialect] || 'الفصحى المعاصرة الواضحة';

    const fitPrompt = isEn
      ? `You are a professional voiceover copywriter and broadcast timing director.
Rewrite the following voiceover script so that when read aloud naturally at ${clampedSpeed.toFixed(2)}x speed, it fits precisely within ${parsedTarget} seconds (strictly between ${minWords} and ${maxWords} words, aiming for ~${targetWordCount} words).
Rules:
1. Preserve the core message, intent, and tone of the original script.
2. Write in this accent/style: ${dialectNote}.
3. If the script is too long, tighten and condense gracefully; if too short, enrich naturally without fluff.
4. Preserve any expressive audio tags like <breath>, <laugh>, <gasp>, |yeah|, |mhm| where appropriate.
5. Output ONLY the final ready-to-read script text, with no title, quotes, word count, or commentary.

Original script:
${text.trim()}`
      : `أنت كاتب سيناريو ومخرج تعليق صوتي محترف متخصص في ضبط توقيت الإعلانات والفويس أوفر بالثانية.
أعد صياغة النص الصوتي التالي بدقة بحيث يستغرق عند إلقائه بصوت طبيعي وبسرعة ${clampedSpeed.toFixed(2)}x مدة ${parsedTarget} ثانية بالضبط (التزم بأن يكون عدد الكلمات بين ${minWords} و ${maxWords} كلمة، والمستهدف المثالي حوالي ${targetWordCount} كلمة).
القواعد:
1. حافظ على الفكرة الأساسية والرسالة والروح الأصلية للنص.
2. التزم بنفس اللهجة والأسلوب: ${dialectNote}.
3. إذا كان النص الأصلي طويلاً، لخّصه واختصره بسلاسة وإيقاع إذاعي جميل؛ وإذا كان قصيراً، قم بتوسيعه بعبارات طبيعية جذابة ومتماسكة.
4. حافظ على أي وسوم أداء صوتي مثل <breath> أو <laugh> أو <gasp> إن وُجدت وبشكل متوازن.
5. أعد النص النهائي الجاهز للقراءة فقط مباشرة، بدون أي مقدمات أو أقواس أو عدّاد كلمات أو شروحات.

النص الأصلي:
${text.trim()}`;

    let fittedText = text.trim();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: fitPrompt,
      });
      fittedText = response.text?.trim() || fittedText;
    } catch {
      const liteResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: fitPrompt,
      });
      fittedText = liteResponse.text?.trim() || fittedText;
    }

    // Strip accidental surrounding quotes if model returned them
    fittedText = fittedText.replace(/^["«“]+|["»”]+$/g, '').trim();

    return res.json({
      success: true,
      fittedText,
      targetSeconds: parsedTarget,
      estimatedSeconds: estimateSpeechSecondsServer(fittedText, isEn ? 'en' : 'ar', clampedSpeed),
    });
  } catch (err: any) {
    console.error('Error in script fit-duration:', err);
    const parsed = parseGeminiError(err);
    const isAr = req.body?.language !== 'en';
    return res.status(parsed.httpStatus).json({
      error: isAr ? parsed.messageAr : parsed.messageEn,
    });
  }
});

// Vercel serverless default export
export default app;
