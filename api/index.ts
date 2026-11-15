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
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
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
    });

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
    return res.status(500).json({ error: err.message || 'Audition failed' });
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
    } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text is required for speech synthesis' });
    }

    const ai = getGeminiClient();

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
    toneSegments.push('Pristine vocal fidelity, realistic cadence, natural human breathing and intonation.');

    const combinedStyle = toneSegments.join('. ');
    const chosenVoice = VALID_GEMINI_VOICES.includes(voice) ? voice : 'Kore';

    // Route to flagship gemini-3.8-flash-tts for Voice Design, vocal burst tags, or intense acting
    const useFlashFlagship =
      modelMode === 'flash' ||
      Boolean(voiceDesignPrompt && voiceDesignPrompt.trim()) ||
      hasExpressiveAudioTags(text) ||
      (voiceSettings?.styleExaggeration ?? 0) >= 75;

    const selectedModel = useFlashFlagship
      ? 'gemini-3.8-flash-tts'
      : 'gemini-3.8-flash-lite-tts';

    const response = await ai.models.generateContent({
      model: selectedModel,
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
    });

    const audioBase64 =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioBase64) {
      throw new Error('No audio returned from Gemini TTS engine.');
    }

    return res.json({
      success: true,
      audioBase64,
      mimeType: 'audio/wav',
      voice: chosenVoice,
      modelUsed: selectedModel,
      textLength: text.length,
    });
  } catch (err: any) {
    console.error('Error generating speech:', err);
    return res.status(500).json({
      error: err.message || 'Failed to synthesize speech.',
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

      const response = await ai.models.generateContent({
        model: useFlash ? 'gemini-3.8-flash-tts' : 'gemini-3.8-flash-lite-tts',
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
      });

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

    return res.json({
      success: true,
      audioBase64: mergedWav.toString('base64'),
      mimeType: 'audio/wav',
      paragraphCount: validParagraphs.length,
      paragraphDurations,
    });
  } catch (err: any) {
    console.error('Error in advanced multi-paragraph TTS:', err);
    return res.status(500).json({
      error: err.message || 'Failed to synthesize advanced multi-paragraph speech.',
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
    } = req.body;

    if (!Array.isArray(dialogueLines) || dialogueLines.length === 0) {
      return res.status(400).json({ error: 'dialogueLines array is required' });
    }

    const ai = getGeminiClient();

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

    const parts = dialogueLines.map((line: any) => {
      const isB = String(line.speaker).trim() === normalizedSpeakerB;
      const targetSpeaker = isB ? normalizedSpeakerB : normalizedSpeakerA;
      const personaPrompt = isB ? speakerBDesignPrompt : speakerADesignPrompt;
      const styleParts = [
        personaPrompt ? `Voice Persona: ${personaPrompt}` : '',
        line.style || 'Conversational and expressive',
        dialectContext ? `Dialect/Accent: ${dialectContext}` : '',
      ].filter(Boolean);

      return {
        text: `${targetSpeaker}: ${line.text}`,
        speechMetadata: {
          speaker: targetSpeaker,
          style: styleParts.join('. '),
        },
      };
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-tts',
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
    });

    const audioBase64 =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!audioBase64) {
      throw new Error('No audio generated for dialogue.');
    }

    return res.json({
      success: true,
      audioBase64,
      mimeType: 'audio/wav',
    });
  } catch (err: any) {
    console.error('Error in dialogue TTS:', err);
    return res.status(500).json({
      error: err.message || 'Failed to synthesize multi-speaker dialogue.',
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

    let vocalizedText = text;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `أنت خبير في علم النحو والصرف واللغة العربية والأداء الصوتي الإذاعي.
قم بضبط وتشكيل النص العربي التالي تشكيلاً كاملاً ودقيقاً بنسبة 100% (الحركات: الفتحة، الضمة، الكسرة، السكون، التنوين، والشدة) لكي يتم نطقه عبر محرك تحويل النص إلى صوت (TTS) بأعلى درجات الفصاحة وسلاسة الإعراب دون أي لبس.
احتفظ بأي وسوم أداء صوتي مثل <breath> أو <laugh> أو <gasp> أو |yeah| أو |mhm| كما هي دون ترجمة أو تعديل.
لا تقم بتغيير معاني الكلمات. أعد النص المشكول فقط مباشرة دون أي مقدمات أو شروحات أو أقواس إضافية.

النص المراد تشكيله:
${text}`,
      });
      vocalizedText = response.text?.trim() || text;
    } catch (geminiErr: any) {
      console.warn('Tashkeel service temporary spike:', geminiErr?.message);
      return res.json({
        success: true,
        vocalizedText: text,
        notice: 'الخدمة تشهد ضغطاً مؤقتاً، تم الاحتفاظ بالنص الأصلي وهو جاهز للنطق.',
      });
    }

    return res.json({ success: true, vocalizedText });
  } catch (err: any) {
    console.error('Error in auto-tashkeel:', err);
    return res.status(500).json({ error: err.message || 'Failed to add tashkeel' });
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
        model: 'gemini-3.8-flash',
        contents: targetPrompt,
      });
      convertedText = response.text?.trim() || text;
    } catch (geminiErr: any) {
      console.warn('Dialect service temporary spike:', geminiErr?.message);
      return res.json({
        success: true,
        convertedText: text,
        notice: 'الخدمة تشهد ضغطاً مؤقتاً، يمكنك توليد الصوت مباشرة بالنص الحالي.',
      });
    }

    return res.json({ success: true, convertedText });
  } catch (err: any) {
    console.error('Error in dialect conversion:', err);
    return res.status(500).json({ error: err.message || 'Failed to convert dialect' });
  }
});

// Vercel serverless default export
export default app;
