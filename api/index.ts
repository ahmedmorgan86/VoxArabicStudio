import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

export const app = express();
app.use(express.json({ limit: '15mb' }));

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

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Audition in-memory cache
const auditionCache = new Map<string, string>();

// Audition voice samples endpoint
app.get('/api/voices/audition/:voice', async (req, res) => {
  try {
    const voice = req.params.voice;
    const validVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
    if (!validVoices.includes(voice)) {
      return res.status(400).json({ error: 'Invalid voice' });
    }

    if (auditionCache.has(voice)) {
      return res.json({
        success: true,
        audioBase64: auditionCache.get(voice),
        mimeType: 'audio/wav',
        voice,
      });
    }

    const sampleGreetings: Record<string, string> = {
      Kore: 'مرحباً بك، أنا كوري، صوتي دافئ ونقي ومناسب لكافة نصوصك.',
      Puck: 'أهلاً يا صديقي! أنا باك، مفعم بالطاقة والحيوية وجاهز لكل أفكارك!',
      Charon: 'أهلاً بكم، أنا شارون، صوت عميق ورزين للأفلام والوثائقيات.',
      Fenrir: 'مرحباً، أنا فنرير، صوت قوي وملحمي يمنح كلماتك هيبة وتأثيراً.',
      Zephyr: 'مرحباً، أنا زفير، نبرة هادئة ورقيقة تنساب بالسكينة والجمال.',
    };

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: sampleGreetings[voice] || 'مرحباً بك في استوديو الصوت الذكي.',
              speechMetadata: {
                style: 'Warm, natural human delivery',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
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

    auditionCache.set(voice, audioBase64);

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

// Main TTS endpoint using gemini-3.8-flash-lite-tts
app.post('/api/tts', async (req, res) => {
  try {
    const {
      text,
      voice = 'Kore',
      language = 'ar',
      dialect = 'msa',
      style = 'Natural and clear professional speaker',
    } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Text is required for speech synthesis' });
    }

    const ai = getGeminiClient();

    let dialectNote = '';
    if (language === 'ar') {
      switch (dialect) {
        case 'egyptian':
          dialectNote = 'Egyptian Arabic dialect (لهجة مصرية عامية طبيعية)';
          break;
        case 'gulf':
          dialectNote = 'Gulf / Saudi Arabic dialect (لهجة خليجية سعودية أصيلة)';
          break;
        case 'levantine':
          dialectNote = 'Levantine Arabic dialect (لهجة شامية سورية/لبنانية عذبة)';
          break;
        case 'maghrebi':
          dialectNote = 'North African / Moroccan Arabic dialect (لهجة مغاربية دارجة)';
          break;
        case 'iraqi':
          dialectNote = 'Iraqi Arabic dialect (لهجة عراقية شجية)';
          break;
        case 'classical':
          dialectNote = 'Classical formal Arabic with pristine articulation (فصحى كلاسيكية أدبية)';
          break;
        default:
          dialectNote = 'Modern Standard Arabic with crisp pronunciation (فصحى معاصرة)';
          break;
      }
    } else {
      switch (dialect) {
        case 'british':
          dialectNote = 'British Received Pronunciation accent';
          break;
        case 'australian':
          dialectNote = 'Australian accent, friendly and vibrant';
          break;
        default:
          dialectNote = 'American English accent, clear and natural';
          break;
      }
    }

    const combinedStyle = `${style}. Dialect/Accent: ${dialectNote}. Pristine vocal fidelity, realistic cadence, natural human breathing and intonation.`;

    const validVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
    const chosenVoice = validVoices.includes(voice) ? voice : 'Kore';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
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
      textLength: text.length,
    });
  } catch (err: any) {
    console.error('Error generating speech:', err);
    return res.status(500).json({
      error: err.message || 'Failed to synthesize speech.',
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
    } = req.body;

    if (!Array.isArray(dialogueLines) || dialogueLines.length === 0) {
      return res.status(400).json({ error: 'dialogueLines array is required' });
    }

    const ai = getGeminiClient();

    const validVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
    const voiceA = validVoices.includes(speakerAVoice) ? speakerAVoice : 'Puck';
    const voiceB = validVoices.includes(speakerBVoice) ? speakerBVoice : 'Kore';

    const normalizedSpeakerA =
      (typeof speakerAName === 'string' && speakerAName.trim()) || 'Speaker 1';
    let normalizedSpeakerB =
      (typeof speakerBName === 'string' && speakerBName.trim()) || 'Speaker 2';
    if (normalizedSpeakerA === normalizedSpeakerB) {
      normalizedSpeakerB = `${normalizedSpeakerB} 2`;
    }

    const parts = dialogueLines.map((line: any) => {
      const isB = String(line.speaker).trim() === normalizedSpeakerB;
      const targetSpeaker = isB ? normalizedSpeakerB : normalizedSpeakerA;
      return {
        text: `${targetSpeaker}: ${line.text}`,
        speechMetadata: {
          speaker: targetSpeaker,
          style: line.style || 'Conversational and expressive',
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
    const { text, targetDialect, targetLanguage = 'ar' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const ai = getGeminiClient();

    let targetPrompt = '';
    if (targetLanguage === 'ar') {
      const dialectNames: Record<string, string> = {
        egyptian: 'اللهجة المصرية الدارجة الطبيعية المليئة بالحيوية (المصري الأصيل كأهل القاهرة)',
        gulf: 'اللهجة الخليجية / السعودية الأصيلة المحبوبة والمألوفة (كأهل الرياض أو جدة أو الخليج)',
        levantine: 'اللهجة الشامية (السورية أو اللبنانية العذبة واللطيفة)',
        maghrebi: 'اللهجة المغربية / المغاربية (الدارجة المفهومة الجميلة)',
        iraqi: 'اللهجة العراقية الشجية والمعبرة',
        msa: 'اللغة العربية الفصحى المعاصرة الراقية والمضبوطة لغوياً',
        classical: 'الفصحى التراثية الفخمة كأشعار وروايات العصر الذهبي',
      };
      const dialectDesc = dialectNames[targetDialect] || 'اللهجة المطلوبة';
      targetPrompt = `أنت كاتب سيناريو صوتي ومتقن للهجات العربية.
قم بإعادة صياغة النص التالي ببراعة واحترافية إلى: ${dialectDesc}.
حافظ على نفس الرسالة والمعنى والشعور، واستخدم المفردات والتعابير العفوية الدقيقة لتلك اللهجة حتى تبدو طبيعية جداً عند تحويلها لصوت.
أعد النص المعاد صياغته فقط بدون أي تفسير أو هوامش.

النص الأصلي:
${text}`;
    } else {
      const enDialects: Record<string, string> = {
        american: 'Natural American conversational English',
        british: 'Sophisticated British English phrasing',
        australian: 'Casual and upbeat Australian English',
      };
      const dialectDesc = enDialects[targetDialect] || 'Natural fluent English';
      targetPrompt = `You are a native scriptwriter. Rewrite/translate the following text into ${dialectDesc}. Keep the tone engaging, human, and perfectly suitable for audio voiceover. Output ONLY the rewritten text without quotation marks or explanations.

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
