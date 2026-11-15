/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Header } from './components/Header';
import { VoiceSelector } from './components/VoiceSelector';
import { DialectSelector } from './components/DialectSelector';
import { StyleSelector, DEFAULT_VOICE_SETTINGS } from './components/StyleSelector';
import { ScriptTemplates } from './components/ScriptTemplates';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { DialogueStudio } from './components/DialogueStudio';
import { AdvancedGenerationStudio } from './components/AdvancedGenerationStudio';
import { AudioHistory } from './components/AudioHistory';
import { AudioEffectsRack } from './components/AudioEffectsRack';
import {
  AdvancedParagraph,
  Language,
  StudioTab,
  VoiceName,
  GeneratedAudioItem,
  AudioEffectsConfig,
  CustomVoicePersona,
  VoiceSettingsConfig,
} from './types';
import {
  ARABIC_DIALECTS,
  ENGLISH_DIALECTS,
  EXPRESSIVE_CUES,
  ScriptSample,
  VOCAL_STYLES,
} from './data/voicesAndDialects';
import {
  speakWithBrowserWebSpeech,
  stopBrowserWebSpeech,
} from './utils/audioHelper';
import {
  applyAudioEffectsToWavBase64,
  formatEffectsSummary,
} from './utils/audioEffects';
import {
  RefreshCw,
  Sparkles,
  RotateCcw,
  Volume2,
  Mic,
  MicOff,
  Copy,
  Check,
  AlertCircle,
  FileText,
  VolumeX,
  Radio,
  Globe2,
  AudioLines,
  Sliders,
  LayoutGrid,
  Columns2,
} from 'lucide-react';

type InspectorTab = 'voice' | 'dialect' | 'tone' | 'effects';

export default function App() {
  const [language, setLanguage] = useState<Language>('ar');
  const [activeTab, setActiveTab] = useState<StudioTab>('single');
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('voice');
  const [inspectorLayout, setInspectorLayout] = useState<'tabbed' | 'expanded'>('tabbed');

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('voxarabic_theme');
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem('voxarabic_theme', theme);
    } catch {
      // ignore storage quota
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Single Voice State
  const [inputText, setInputText] = useState(
    'أهلاً بك في استوديو فوكس أرابيك للذكاء الاصطناعي. يمكنك تحويل أي نص إلى صوت بشري واقعي بمختلف اللهجات والأنماط الصوتية.'
  );
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Advanced Multi-Paragraph State
  const [advancedParagraphs, setAdvancedParagraphs] = useState<AdvancedParagraph[]>([
    {
      id: 'adv-1',
      text: 'في كل مشروع إبداعي ناجح، تبدأ البداية بنبرة هادئة وعميقة تشد انتباه المستمع منذ اللحظة الأولى.',
      speechRate: 0.85,
      pitch: -2,
      styleId: 'cinematic',
      customTone: '',
      pauseAfterMs: 500,
    },
    {
      id: 'adv-2',
      text: 'ثم تنطلق الطاقة والحماس! <breath> هنا يمكنك رفع السرعة والطبقة لتوصيل ذروة المشهد بوضوح وتأثير مذهل.',
      speechRate: 1.2,
      pitch: 2,
      styleId: 'excited',
      customTone: '',
      pauseAfterMs: 0,
    },
  ]);

  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Kore');
  const [selectedDialect, setSelectedDialect] = useState<string>('msa');
  const [customDialect, setCustomDialect] = useState<string>('');
  const [selectedStyleId, setSelectedStyleId] = useState<string>('natural');
  const [customTonePrompt, setCustomTonePrompt] = useState<string>('');
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettingsConfig>(
    DEFAULT_VOICE_SETTINGS
  );

  // Custom Designed Voices
  const [customVoices, setCustomVoices] = useState<CustomVoicePersona[]>(() => {
    try {
      const saved = localStorage.getItem('voxarabic_custom_voices');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('voxarabic_custom_voices', JSON.stringify(customVoices));
    } catch {
      // ignore storage quota
    }
  }, [customVoices]);

  const [effectsConfig, setEffectsConfig] = useState<AudioEffectsConfig>({
    reverbEnabled: false,
    reverbMix: 0.28,
    reverbSpace: 'hall',
    compressionEnabled: false,
    compressionAmount: 55,
    warmthEnabled: false,
  });

  // Generation status
  const [isLoading, setIsLoading] = useState(false);
  const [isTashkeelLoading, setIsTashkeelLoading] = useState(false);
  const [isDialectConverting, setIsDialectConverting] = useState(false);
  const [isPreviewingCustom, setIsPreviewingCustom] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Audition voice status
  const [auditioningVoice, setAuditioningVoice] = useState<VoiceName | null>(null);
  const auditionAudioRef = useRef<HTMLAudioElement | null>(null);

  // Browser Web Speech preview status
  const [isBrowserSpeaking, setIsBrowserSpeaking] = useState(false);

  // Active audio
  const [currentAudio, setCurrentAudio] = useState<{
    id: string;
    audioBase64: string;
    mimeType: string;
    voice: VoiceName;
    dialectName: string;
  } | null>(null);

  // Audio history (persisted in localStorage)
  const [history, setHistory] = useState<GeneratedAudioItem[]>(() => {
    try {
      const saved = localStorage.getItem('voxarabic_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Speech Recognition (Dictation)
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Copy feedback
  const [copiedText, setCopiedText] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('voxarabic_history', JSON.stringify(history.slice(0, 20)));
    } catch {
      // storage full
    }
  }, [history]);

  // Adjust document direction
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    const nextLang = language === 'ar' ? 'en' : 'ar';
    setLanguage(nextLang);
    if (nextLang === 'en') {
      setSelectedDialect('american');
      if (
        inputText ===
        'أهلاً بك في استوديو فوكس أرابيك للذكاء الاصطناعي. يمكنك تحويل أي نص إلى صوت بشري واقعي بمختلف اللهجات والأنماط الصوتية.'
      ) {
        setInputText(
          'Welcome to VoxArabic AI Studio. Convert any text into lifelike speech with multiple accents, emotional cadence, and pristine clarity.'
        );
      }
    } else {
      setSelectedDialect('msa');
    }
  };

  // Insert expressive vocal cue at cursor position
  const insertExpressiveCue = (tag: string) => {
    const el = textareaRef.current;
    if (!el) {
      setInputText((prev) => (prev ? `${prev.trimEnd()} ${tag} ` : `${tag} `));
      return;
    }
    const start = el.selectionStart ?? inputText.length;
    const end = el.selectionEnd ?? inputText.length;
    const before = inputText.slice(0, start);
    const after = inputText.slice(end);
    const padLeft = before && !before.endsWith(' ') ? ' ' : '';
    const padRight = after && !after.startsWith(' ') ? ' ' : ' ';
    const nextText = `${before}${padLeft}${tag}${padRight}${after}`;
    setInputText(nextText);
    requestAnimationFrame(() => {
      const nextCursor = start + padLeft.length + tag.length + padRight.length;
      el.focus();
      el.setSelectionRange(nextCursor, nextCursor);
    });
  };

  // Dictation handler
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage(
        language === 'ar'
          ? 'المتصفح لا يدعم ميزة الإملاء الصوتي المباشر.'
          : 'Speech recognition is not supported in this browser.'
      );
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'ar' ? 'ar-SA' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Dictation error:', err);
      setIsListening(false);
    }
  };

  // Audition standard voice sample
  const handleAuditionVoice = async (voice: VoiceName) => {
    if (auditioningVoice === voice) {
      if (auditionAudioRef.current) {
        auditionAudioRef.current.pause();
        auditionAudioRef.current.currentTime = 0;
      }
      setAuditioningVoice(null);
      return;
    }

    setAuditioningVoice(voice);

    try {
      const res = await fetch(`/api/voices/audition/${encodeURIComponent(voice)}?lang=${language}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch audition');

      if (data.audioBase64) {
        if (!auditionAudioRef.current) {
          auditionAudioRef.current = new Audio();
        }
        auditionAudioRef.current.src = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
        auditionAudioRef.current.onended = () => setAuditioningVoice(null);
        auditionAudioRef.current.onerror = () => setAuditioningVoice(null);
        await auditionAudioRef.current.play();
      }
    } catch (err) {
      console.warn('Audition error:', err);
      speakWithBrowserWebSpeech(
        language === 'ar'
          ? `مرحباً بك في الاستوديو، أنا ${voice}.`
          : `Hello, I am ${voice}.`,
        language,
        () => setAuditioningVoice(null)
      );
    }
  };

  // Preview a Voice Design custom persona via Gemini 3.8 Flash TTS
  const handlePreviewCustomVoice = async (baseVoice: string, prompt: string) => {
    setIsPreviewingCustom(true);
    setErrorMessage(null);
    try {
      const sampleLine =
        language === 'ar'
          ? 'مرحباً بكم! <breath> هذا هو الصوت المصمم خصيصاً لكم بأعلى درجات الواقعية والتعبير.'
          : 'Hello there! <breath> This is your custom designed voice speaking with natural warmth and character.';

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sampleLine,
          voice: baseVoice,
          voiceDesignPrompt: prompt,
          language,
          dialect: selectedDialect,
          customDialect,
          style: 'Natural expressive showcase',
          modelMode: 'flash',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Preview failed');

      if (data.audioBase64) {
        if (!auditionAudioRef.current) {
          auditionAudioRef.current = new Audio();
        }
        auditionAudioRef.current.src = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
        await auditionAudioRef.current.play();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Voice preview failed');
    } finally {
      setIsPreviewingCustom(false);
    }
  };

  // Instant local browser speech preview
  const handleBrowserPreview = () => {
    if (isBrowserSpeaking) {
      stopBrowserWebSpeech();
      setIsBrowserSpeaking(false);
      return;
    }

    if (!inputText.trim()) return;

    setIsBrowserSpeaking(true);
    speakWithBrowserWebSpeech(inputText.trim(), language, () => {
      setIsBrowserSpeaking(false);
    });
  };

  // Smart Auto-Tashkeel for Arabic
  const handleAutoTashkeel = async () => {
    if (!inputText.trim()) return;
    setIsTashkeelLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/tashkeel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      });
      const data = await res.json();
      if (data.vocalizedText) {
        setInputText(data.vocalizedText);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsTashkeelLoading(false);
    }
  };

  // Convert script to target dialect
  const handleConvertDialect = async (targetDialectId: string) => {
    if (!inputText.trim()) return;
    setIsDialectConverting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/dialect/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          targetDialect: targetDialectId,
          customDialect: targetDialectId === 'custom' ? customDialect : undefined,
          targetLanguage: language,
        }),
      });
      const data = await res.json();
      if (data.convertedText) {
        setInputText(data.convertedText);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsDialectConverting(false);
    }
  };

  // Apply script template
  const handleApplySample = (sample: ScriptSample) => {
    setLanguage(sample.language);
    setInputText(sample.text);
    setSelectedVoice(sample.recommendedVoice);
    setSelectedDialect(sample.dialect);
    setSelectedStyleId(sample.recommendedStyle);
  };

  // Derived active summary metadata
  const activeCustomVoice = customVoices.find((cv) => cv.id === selectedVoice);
  const usesExpressiveEngine =
    Boolean(activeCustomVoice) ||
    /<(breath|laugh|gasp)>|\|(yeah|mhm)\|/i.test(inputText) ||
    voiceSettings.styleExaggeration >= 75;

  const isAr = language === 'ar';

  const activeVoiceLabel = activeCustomVoice ? activeCustomVoice.name : selectedVoice;
  const activeDialectLabel = useMemo(() => {
    if (selectedDialect === 'custom') {
      return customDialect.trim() || (isAr ? 'مخصص' : 'Custom');
    }
    const list = isAr ? ARABIC_DIALECTS : ENGLISH_DIALECTS;
    const found = list.find((d) => d.id === selectedDialect);
    return found ? `${found.flag} ${isAr ? found.nameAr : found.nameEn}` : selectedDialect;
  }, [selectedDialect, customDialect, isAr]);

  const activeStyleLabel = useMemo(() => {
    if (customTonePrompt.trim()) {
      return customTonePrompt.trim();
    }
    const found = VOCAL_STYLES.find((s) => s.id === selectedStyleId);
    return found ? `${found.icon} ${isAr ? found.nameAr : found.nameEn}` : selectedStyleId;
  }, [selectedStyleId, customTonePrompt, isAr]);

  const activeEffectsCount =
    (effectsConfig.reverbEnabled ? 1 : 0) +
    (effectsConfig.compressionEnabled ? 1 : 0) +
    (effectsConfig.warmthEnabled ? 1 : 0);

  // Synthesize Single Voice
  const handleSynthesize = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);
    stopBrowserWebSpeech();
    setIsBrowserSpeaking(false);

    const styleObj = VOCAL_STYLES.find((s) => s.id === selectedStyleId);
    const styleInstruction = styleObj ? styleObj.promptInstruction : 'Natural delivery';

    const actualBaseVoice = activeCustomVoice ? activeCustomVoice.baseVoice : selectedVoice;
    const displayVoiceName = activeCustomVoice ? activeCustomVoice.name : selectedVoice;
    const displayDialect =
      selectedDialect === 'custom' && customDialect.trim()
        ? customDialect.trim()
        : selectedDialect;

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText.trim(),
          voice: actualBaseVoice,
          voiceDesignPrompt: activeCustomVoice?.prompt,
          language,
          dialect: selectedDialect,
          customDialect: selectedDialect === 'custom' ? customDialect : undefined,
          style: styleInstruction,
          customTonePrompt: customTonePrompt.trim() || undefined,
          voiceSettings,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = {};
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        throw new Error(
          language === 'ar'
            ? 'تعذر الاتصال بخادم الـ API. إذا كنت تنشر المشروع على Vercel، تأكد من إضافة GEMINI_API_KEY في إعدادات البيئة (Settings > Environment Variables) ثم أعد النشر.'
            : 'API server unreachable. If deployed on Vercel, ensure GEMINI_API_KEY is configured in Vercel Environment Variables.'
        );
      }

      if (!res.ok) {
        throw new Error(data.error || 'TTS generation failed');
      }

      if (data.audioBase64) {
        const processedAudioBase64 = await applyAudioEffectsToWavBase64(
          data.audioBase64,
          effectsConfig
        );
        const effectsSummary = formatEffectsSummary(effectsConfig, language);

        const audioItem: GeneratedAudioItem = {
          id: Math.random().toString(36).substring(2, 9),
          text: inputText.trim(),
          audioBase64: processedAudioBase64,
          mimeType: data.mimeType || 'audio/wav',
          voice: displayVoiceName,
          dialect: displayDialect,
          language,
          styleName: customTonePrompt.trim()
            ? customTonePrompt.trim()
            : styleObj?.nameAr || selectedStyleId,
          effectsSummary: effectsSummary || undefined,
          createdAt: Date.now(),
        };

        setCurrentAudio({
          id: audioItem.id,
          audioBase64: processedAudioBase64,
          mimeType: data.mimeType || 'audio/wav',
          voice: displayVoiceName,
          dialectName: effectsSummary
            ? `${displayDialect} · ${effectsSummary}`
            : displayDialect,
        });

        setHistory((prev) => [audioItem, ...prev]);
      }
    } catch (err: any) {
      console.error('Synthesize error:', err);
      setErrorMessage(
        err.message ||
          (language === 'ar'
            ? 'حدث خطأ أثناء توليد الصوت. يرجى المحاولة مرة أخرى.'
            : 'Error generating audio. Please try again.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Synthesize Dialogue
  const handleGenerateDialogue = async (payload: {
    dialogueLines: Array<{ speaker: string; text: string; style?: string }>;
    speakerAVoice: VoiceName;
    speakerBVoice: VoiceName;
    speakerAName: string;
    speakerBName: string;
    speakerADesignPrompt?: string;
    speakerBDesignPrompt?: string;
    language: Language;
    dialect: string;
    customDialect?: string;
  }) => {
    setIsLoading(true);
    setErrorMessage(null);
    stopBrowserWebSpeech();

    try {
      const res = await fetch('/api/tts/dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = {};
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        throw new Error(
          language === 'ar'
            ? 'تعذر الاتصال بخادم الـ API للحوار. تأكد من إعداد GEMINI_API_KEY على Vercel.'
            : 'Dialogue API server unreachable. Ensure GEMINI_API_KEY is configured on Vercel.'
        );
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate dialogue');
      }

      if (data.audioBase64) {
        const processedAudioBase64 = await applyAudioEffectsToWavBase64(
          data.audioBase64,
          effectsConfig
        );
        const effectsSummary = formatEffectsSummary(effectsConfig, language);

        const audioItem: GeneratedAudioItem = {
          id: Math.random().toString(36).substring(2, 9),
          text: payload.dialogueLines.map((l) => `${l.speaker}: ${l.text}`).join(' | '),
          audioBase64: processedAudioBase64,
          mimeType: data.mimeType || 'audio/wav',
          voice: `${payload.speakerAName} & ${payload.speakerBName}`,
          dialect: payload.customDialect || payload.dialect || 'Dialogue Studio',
          language,
          styleName: 'Dialogue Scene',
          effectsSummary: effectsSummary || undefined,
          createdAt: Date.now(),
        };

        setCurrentAudio({
          id: audioItem.id,
          audioBase64: processedAudioBase64,
          mimeType: data.mimeType || 'audio/wav',
          voice: `${payload.speakerAName} · ${payload.speakerBName}`,
          dialectName: effectsSummary
            ? `Dual Dialogue · ${effectsSummary}`
            : 'Dual Dialogue',
        });

        setHistory((prev) => [audioItem, ...prev]);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Synthesize Advanced Multi-Paragraph Mode
  const handleGenerateAdvanced = async () => {
    const validParagraphs = advancedParagraphs.filter((p) => p.text.trim().length > 0);
    if (validParagraphs.length === 0) return;

    setIsLoading(true);
    setErrorMessage(null);
    stopBrowserWebSpeech();
    setIsBrowserSpeaking(false);

    const activeCustom = customVoices.find((cv) => cv.id === selectedVoice);
    const defaultBaseVoice = activeCustom ? activeCustom.baseVoice : selectedVoice;
    const displayVoiceName = activeCustom ? activeCustom.name : selectedVoice;
    const displayDialect =
      selectedDialect === 'custom' && customDialect.trim()
        ? customDialect.trim()
        : selectedDialect;

    try {
      const payloadParagraphs = validParagraphs.map((p) => {
        const chosenVoiceId = p.voiceOverride || selectedVoice;
        const customParaVoice = customVoices.find((cv) => cv.id === chosenVoiceId);
        const styleObj = VOCAL_STYLES.find((s) => s.id === p.styleId);
        return {
          id: p.id,
          text: p.text.trim(),
          voice: customParaVoice ? customParaVoice.baseVoice : chosenVoiceId,
          voiceDesignPrompt: customParaVoice?.prompt,
          speechRate: p.speechRate,
          pitch: p.pitch,
          styleInstruction: styleObj?.promptInstruction || 'Natural balanced delivery',
          customTone: p.customTone.trim() || undefined,
          pauseAfterMs: p.pauseAfterMs,
        };
      });

      const res = await fetch('/api/tts/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paragraphs: payloadParagraphs,
          defaultVoice: defaultBaseVoice,
          defaultVoiceDesignPrompt: activeCustom?.prompt,
          language,
          dialect: selectedDialect,
          customDialect: selectedDialect === 'custom' ? customDialect : undefined,
          stability: voiceSettings.stability,
          styleExaggeration: voiceSettings.styleExaggeration,
          speakerBoost: voiceSettings.speakerBoost,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = {};
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        throw new Error(
          language === 'ar'
            ? 'تعذر الاتصال بخادم الـ API للتوليد المتقدم.'
            : 'Advanced TTS API server unreachable.'
        );
      }

      if (!res.ok) {
        throw new Error(data.error || 'Advanced TTS generation failed');
      }

      if (data.audioBase64) {
        const processedAudioBase64 = await applyAudioEffectsToWavBase64(
          data.audioBase64,
          effectsConfig
        );
        const effectsSummary = formatEffectsSummary(effectsConfig, language);
        const paraSummary =
          language === 'ar'
            ? `${validParagraphs.length} فقرات متقدمة`
            : `${validParagraphs.length} Advanced Paragraphs`;

        const audioItem: GeneratedAudioItem = {
          id: Math.random().toString(36).substring(2, 9),
          text: validParagraphs.map((p) => p.text.trim()).join('\n'),
          audioBase64: processedAudioBase64,
          mimeType: data.mimeType || 'audio/wav',
          voice: displayVoiceName,
          dialect: displayDialect,
          language,
          styleName: paraSummary,
          effectsSummary: effectsSummary || undefined,
          createdAt: Date.now(),
        };

        setCurrentAudio({
          id: audioItem.id,
          audioBase64: processedAudioBase64,
          mimeType: data.mimeType || 'audio/wav',
          voice: displayVoiceName,
          dialectName: effectsSummary
            ? `${paraSummary} · ${displayDialect} · ${effectsSummary}`
            : `${paraSummary} · ${displayDialect}`,
        });

        setHistory((prev) => [audioItem, ...prev]);
      }
    } catch (err: any) {
      console.error('Advanced TTS error:', err);
      setErrorMessage(err.message || 'Advanced generation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const copyTextToClipboard = () => {
    if (!inputText) return;
    navigator.clipboard.writeText(inputText).then(() => {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    });
  };

  const inspectorTabs: Array<{
    id: InspectorTab;
    labelAr: string;
    labelEn: string;
    icon: React.ReactNode;
    badge?: string;
    hidden?: boolean;
  }> = [
    {
      id: 'voice',
      labelAr: 'الصوت',
      labelEn: 'Voice',
      icon: <Radio className="h-3.5 w-3.5" />,
    },
    {
      id: 'dialect',
      labelAr: 'اللهجة',
      labelEn: 'Dialect',
      icon: <Globe2 className="h-3.5 w-3.5" />,
    },
    {
      id: 'tone',
      labelAr: 'النبرة',
      labelEn: 'Tone',
      icon: <AudioLines className="h-3.5 w-3.5" />,
      hidden: activeTab === 'advanced',
    },
    {
      id: 'effects',
      labelAr: 'المؤثرات',
      labelEn: 'DSP',
      icon: <Sliders className="h-3.5 w-3.5" />,
      badge: activeEffectsCount > 0 ? String(activeEffectsCount) : undefined,
    },
  ];

  // Ensure inspectorTab doesn't stay on 'tone' when entering Advanced mode
  useEffect(() => {
    if (activeTab === 'advanced' && inspectorTab === 'tone') {
      setInspectorTab('voice');
    }
  }, [activeTab, inspectorTab]);

  return (
    <div className="min-h-screen bg-[#F6F4EF] dark:bg-[#121110] text-[#171614] dark:text-[#F3F0EA] transition-colors">
      <Header
        language={language}
        onToggleLanguage={toggleLanguage}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="mx-auto max-w-[1380px] px-4 py-5 sm:px-6 space-y-5">
        {/* Error notification banner */}
        {errorMessage && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-300 dark:border-red-800/80 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-red-900 dark:text-red-200 text-xs">
            <div className="flex items-start gap-2.5 flex-1 min-w-[240px]">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="font-medium leading-relaxed">{errorMessage}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {activeTab === 'single' &&
                /(quota|حصة|429|RESOURCE_EXHAUSTED)/i.test(errorMessage) && (
                  <button
                    type="button"
                    onClick={handleBrowserPreview}
                    className="rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-[#1A1816] px-2.5 py-1 text-[11px] font-semibold text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  >
                    {isAr ? 'تشغيل المعاينة المحلية بالمتصفح' : 'Use Browser Preview'}
                  </button>
                )}
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="font-bold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 px-1.5 py-0.5"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Active Configuration Summary Bar (Single & Advanced modes) */}
        {(activeTab === 'single' || activeTab === 'advanced') && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1A1816] px-4 py-2.5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setInspectorLayout('tabbed');
                  setInspectorTab('voice');
                }}
                className="flex items-center gap-1.5 hover:text-[#D94E28] dark:hover:text-[#EE6A43] transition-colors whitespace-nowrap"
              >
                <span className="text-[#5F5B53] dark:text-[#968F84]">
                  {isAr ? 'الصوت:' : 'Voice:'}
                </span>
                <span className="font-bold text-[#171614] dark:text-[#F3F0EA]">
                  {activeVoiceLabel}
                </span>
              </button>

              <span className="text-[#DED9CE] dark:text-[#2A2723]" aria-hidden="true">
                /
              </span>

              <button
                type="button"
                onClick={() => {
                  setInspectorLayout('tabbed');
                  setInspectorTab('dialect');
                }}
                className="flex items-center gap-1.5 hover:text-[#D94E28] dark:hover:text-[#EE6A43] transition-colors whitespace-nowrap"
              >
                <span className="text-[#5F5B53] dark:text-[#968F84]">
                  {isAr ? 'اللهجة:' : 'Dialect:'}
                </span>
                <span className="font-bold text-[#171614] dark:text-[#F3F0EA]">
                  {activeDialectLabel}
                </span>
              </button>

              {activeTab === 'single' && (
                <>
                  <span className="text-[#DED9CE] dark:text-[#2A2723]" aria-hidden="true">
                    /
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setInspectorLayout('tabbed');
                      setInspectorTab('tone');
                    }}
                    className="flex items-center gap-1.5 hover:text-[#D94E28] dark:hover:text-[#EE6A43] transition-colors whitespace-nowrap"
                  >
                    <span className="text-[#5F5B53] dark:text-[#968F84]">
                      {isAr ? 'النبرة:' : 'Tone:'}
                    </span>
                    <span className="font-bold text-[#171614] dark:text-[#F3F0EA] max-w-[160px] truncate">
                      {activeStyleLabel}
                    </span>
                  </button>
                </>
              )}

              <span className="text-[#DED9CE] dark:text-[#2A2723]" aria-hidden="true">
                /
              </span>

              <button
                type="button"
                onClick={() => {
                  setInspectorLayout('tabbed');
                  setInspectorTab('effects');
                }}
                className="flex items-center gap-1.5 hover:text-[#D94E28] dark:hover:text-[#EE6A43] transition-colors whitespace-nowrap"
              >
                <span className="text-[#5F5B53] dark:text-[#968F84]">
                  {isAr ? 'المؤثرات:' : 'DSP:'}
                </span>
                <span
                  className={`font-bold ${
                    activeEffectsCount > 0
                      ? 'text-[#D94E28] dark:text-[#EE6A43]'
                      : 'text-[#171614] dark:text-[#F3F0EA]'
                  }`}
                >
                  {activeEffectsCount > 0
                    ? formatEffectsSummary(effectsConfig, language)
                    : isAr
                    ? 'نقي (بدون)'
                    : 'Dry'}
                </span>
              </button>
            </div>

            {/* Inspector Display Switcher */}
            <div className="flex items-center rounded-lg bg-[#EDEAE2] dark:bg-[#121110] p-0.5 text-[11px] shrink-0">
              <button
                type="button"
                onClick={() => setInspectorLayout('tabbed')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                  inspectorLayout === 'tabbed'
                    ? 'bg-white dark:bg-[#26231F] text-[#171614] dark:text-white'
                    : 'text-[#5F5B53] dark:text-[#968F84] hover:text-[#171614] dark:hover:text-white'
                }`}
              >
                <Columns2 className="h-3 w-3" />
                <span>{isAr ? 'تبويب منظم' : 'Tabbed'}</span>
              </button>
              <button
                type="button"
                onClick={() => setInspectorLayout('expanded')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                  inspectorLayout === 'expanded'
                    ? 'bg-white dark:bg-[#26231F] text-[#171614] dark:text-white'
                    : 'text-[#5F5B53] dark:text-[#968F84] hover:text-[#171614] dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="h-3 w-3" />
                <span>{isAr ? 'عرض الكل' : 'Show All'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Studio Workspace */}
        {activeTab === 'single' || activeTab === 'advanced' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Primary Script / Advanced Paragraph Column (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {activeTab === 'single' ? (
                <>
                  {/* Quick Script Presets */}
                  <ScriptTemplates language={language} onApplySample={handleApplySample} />

                  {/* Unified Script Workbench */}
                  <div className="rounded-xl border border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1A1816] p-5 space-y-3.5">
                    {/* Workbench Header & Utilities */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDEAE2] dark:border-[#26231F] pb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#D94E28] dark:text-[#EE6A43]" />
                        <span className="text-xs font-bold text-[#171614] dark:text-[#F3F0EA]">
                          {isAr ? 'محرر النص الصوتي (Script Track)' : 'Script Track Editor'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={toggleSpeechRecognition}
                          className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                            isListening
                              ? 'border-red-500 bg-red-50 dark:bg-red-950/70 text-red-700 dark:text-red-300'
                              : 'border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#22201C] text-[#171614] dark:text-[#F3F0EA] hover:bg-[#EDEAE2] dark:hover:bg-[#2C2924]'
                          }`}
                          title={isAr ? 'إملاء صوتي' : 'Dictate'}
                        >
                          {isListening ? (
                            <>
                              <MicOff className="h-3 w-3 text-red-600 dark:text-red-400" />
                              <span>{isAr ? 'إيقاف' : 'Stop'}</span>
                            </>
                          ) : (
                            <>
                              <Mic className="h-3 w-3 text-[#5F5B53] dark:text-[#968F84]" />
                              <span>{isAr ? 'إملاء' : 'Dictate'}</span>
                            </>
                          )}
                        </button>

                        {language === 'ar' && (
                          <button
                            type="button"
                            onClick={handleAutoTashkeel}
                            disabled={isTashkeelLoading || !inputText.trim()}
                            className="flex items-center gap-1 rounded-lg border border-[#15803D]/40 bg-[#15803D]/10 px-2.5 py-1 text-xs font-semibold text-[#15803D] dark:text-emerald-400 hover:bg-[#15803D]/20 transition-colors disabled:opacity-50"
                            title="ضبط وتشكيل الحركات الإعرابية التامة"
                          >
                            {isTashkeelLoading ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <Sparkles className="h-3 w-3" />
                            )}
                            <span>{isTashkeelLoading ? 'تشكيل...' : 'تشكيل النص'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={copyTextToClipboard}
                          className="rounded-lg border border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#22201C] p-1.5 text-[#5F5B53] dark:text-[#968F84] hover:bg-[#EDEAE2] dark:hover:bg-[#2C2924] hover:text-[#171614] dark:hover:text-white transition-colors"
                          title={isAr ? 'نسخ النص' : 'Copy'}
                        >
                          {copiedText ? (
                            <Check className="h-3.5 w-3.5 text-[#15803D] dark:text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setInputText('')}
                          className="rounded-lg border border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#22201C] p-1.5 text-[#5F5B53] dark:text-[#968F84] hover:bg-[#EDEAE2] dark:hover:bg-[#2C2924] hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title={isAr ? 'مسح النص' : 'Clear'}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Expressive Vocal Tags Strip */}
                    <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-[#F6F4EF] dark:bg-[#141210] px-3 py-2">
                      <span className="text-[11px] font-semibold text-[#D94E28] dark:text-[#EE6A43] me-1">
                        {isAr ? 'مؤثرات الأداء التفاعلية:' : 'Audio Tags:'}
                      </span>
                      {EXPRESSIVE_CUES.map((cue) => (
                        <button
                          key={cue.tag}
                          type="button"
                          onClick={() => insertExpressiveCue(cue.tag)}
                          title={isAr ? cue.descAr : cue.descEn}
                          className="rounded bg-white dark:bg-[#1E1C19] hover:text-[#D94E28] dark:hover:text-[#EE6A43] px-2 py-0.5 text-[11px] font-mono text-[#5F5B53] dark:text-[#A39D93] transition-colors"
                        >
                          {cue.tag} · {isAr ? cue.labelAr : cue.labelEn}
                        </button>
                      ))}
                    </div>

                    {/* Script Textarea */}
                    <textarea
                      ref={textareaRef}
                      rows={8}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={
                        isAr
                          ? 'اكتب أو الصق النص هنا.. يمكنك استخدام الفصحى أو أي لهجة وإدراج <laugh> أو <breath>...'
                          : 'Enter or paste your script here... You can insert <breath>, <laugh>, <gasp>, |yeah|, |mhm|...'
                      }
                      className="w-full resize-none rounded-lg border border-[#DED9CE] dark:border-[#2A2723] bg-[#FBF9F5] dark:bg-[#121110] p-4 text-sm leading-relaxed text-[#171614] dark:text-[#F3F0EA] placeholder-[#8C857B] dark:placeholder-[#5E584F] focus:border-[#D94E28] focus:outline-none"
                    />

                    {/* Metrics & Engine Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#5F5B53] dark:text-[#968F84] font-mono tabular-nums">
                      <span>
                        {isAr
                          ? `${inputText.trim().split(/\s+/).filter(Boolean).length} كلمة · ${inputText.length} حرف`
                          : `${inputText.trim().split(/\s+/).filter(Boolean).length} words · ${inputText.length} chars`}
                      </span>
                      <span
                        className={
                          usesExpressiveEngine
                            ? 'text-[#D94E28] dark:text-[#EE6A43] font-semibold'
                            : 'text-[#5F5B53] dark:text-[#968F84]'
                        }
                      >
                        {usesExpressiveEngine
                          ? 'Gemini 3.8 Flash TTS (Expressive / Voice Design) · 24kHz'
                          : 'Gemini 3.8 Flash Lite TTS · 24kHz'}
                      </span>
                    </div>

                    {/* Primary Execution Row */}
                    <div className="pt-3 border-t border-[#EDEAE2] dark:border-[#26231F] flex flex-col sm:flex-row items-center gap-2.5">
                      <button
                        type="button"
                        onClick={handleSynthesize}
                        disabled={isLoading || !inputText.trim()}
                        className="w-full sm:flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#D94E28] hover:bg-[#C2411D] p-3.5 text-sm font-bold text-white transition-colors active:scale-95 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin text-white" />
                            <span>
                              {isAr ? 'جارِ معالجة وتوليد الصوت...' : 'Synthesizing Master Take...'}
                            </span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-4 w-4" />
                            <span>
                              {isAr ? 'توليد الصوت الآن (Master WAV / MP3)' : 'Synthesize Master Audio'}
                            </span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleBrowserPreview}
                        disabled={!inputText.trim()}
                        className={`w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg border px-4 py-3.5 text-xs font-semibold transition-colors disabled:opacity-40 active:scale-95 whitespace-nowrap ${
                          isBrowserSpeaking
                            ? 'border-[#D94E28] bg-[#FDF1EC] dark:bg-[#261A15] text-[#D94E28] dark:text-[#EE6A43]'
                            : 'border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#22201C] text-[#171614] dark:text-[#F3F0EA] hover:bg-[#EDEAE2] dark:hover:bg-[#2C2924]'
                        }`}
                        title={
                          isAr
                            ? 'معاينة تجريبية فورية داخل المتصفح'
                            : 'Instant local browser audio preview'
                        }
                      >
                        {isBrowserSpeaking ? (
                          <>
                            <VolumeX className="h-4 w-4 text-[#D94E28] dark:text-[#EE6A43]" />
                            <span>{isAr ? 'إيقاف المعاينة' : 'Stop Preview'}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-4 w-4 text-[#5F5B53] dark:text-[#968F84]" />
                            <span>{isAr ? 'معاينة سريعة بالمتصفح' : 'Browser Preview'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <AdvancedGenerationStudio
                  language={language}
                  paragraphs={advancedParagraphs}
                  onParagraphsChange={setAdvancedParagraphs}
                  defaultVoice={selectedVoice}
                  customVoices={customVoices}
                  selectedDialect={selectedDialect}
                  customDialect={customDialect}
                  editorText={inputText}
                  onGenerateAdvanced={handleGenerateAdvanced}
                  isLoading={isLoading}
                />
              )}
            </div>

            {/* Right Column: Organized Studio Inspector (5 cols) */}
            <div className="lg:col-span-5">
              {inspectorLayout === 'tabbed' ? (
                <div className="rounded-xl border border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1A1816] overflow-hidden">
                  {/* Tabbed Inspector Header */}
                  <div className="grid grid-flow-col auto-cols-fr border-b border-[#DED9CE] dark:border-[#2A2723] bg-[#FBF9F5] dark:bg-[#151311]">
                    {inspectorTabs
                      .filter((t) => !t.hidden)
                      .map((tab) => {
                        const isActive = inspectorTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setInspectorTab(tab.id)}
                            className={`relative flex items-center justify-center gap-1.5 py-3 px-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                              isActive
                                ? 'bg-white dark:bg-[#1A1816] text-[#D94E28] dark:text-[#EE6A43]'
                                : 'text-[#5F5B53] dark:text-[#968F84] hover:text-[#171614] dark:hover:text-[#F3F0EA]'
                            }`}
                          >
                            {tab.icon}
                            <span>{isAr ? tab.labelAr : tab.labelEn}</span>
                            {tab.badge && (
                              <span className="font-mono text-[10px] font-bold text-[#D94E28] dark:text-[#EE6A43]">
                                ({tab.badge})
                              </span>
                            )}
                            {isActive && (
                              <span className="absolute inset-x-0 bottom-0 h-[2px] bg-[#D94E28] dark:bg-[#EE6A43]" />
                            )}
                          </button>
                        );
                      })}
                  </div>

                  {/* Active Inspector Body */}
                  <div className="p-4">
                    {inspectorTab === 'voice' && (
                      <VoiceSelector
                        selectedVoice={selectedVoice}
                        onSelectVoice={setSelectedVoice}
                        onAuditionVoice={handleAuditionVoice}
                        auditioningVoice={auditioningVoice}
                        customVoices={customVoices}
                        onAddCustomVoice={(v) => setCustomVoices((prev) => [v, ...prev])}
                        onDeleteCustomVoice={(id) => {
                          setCustomVoices((prev) => prev.filter((item) => item.id !== id));
                          if (selectedVoice === id) setSelectedVoice('Kore');
                        }}
                        onPreviewCustomVoice={handlePreviewCustomVoice}
                        isPreviewingCustom={isPreviewingCustom}
                        language={language}
                        embedded
                      />
                    )}

                    {inspectorTab === 'dialect' && (
                      <DialectSelector
                        language={language}
                        selectedDialect={selectedDialect}
                        onSelectDialect={setSelectedDialect}
                        customDialect={customDialect}
                        onCustomDialectChange={setCustomDialect}
                        onConvertDialectText={
                          activeTab === 'single' ? handleConvertDialect : undefined
                        }
                        isConvertingDialect={isDialectConverting}
                        embedded
                      />
                    )}

                    {inspectorTab === 'tone' && activeTab === 'single' && (
                      <StyleSelector
                        selectedStyleId={selectedStyleId}
                        onSelectStyle={setSelectedStyleId}
                        customTonePrompt={customTonePrompt}
                        onCustomTonePromptChange={setCustomTonePrompt}
                        voiceSettings={voiceSettings}
                        onVoiceSettingsChange={setVoiceSettings}
                        language={language}
                        embedded
                      />
                    )}

                    {inspectorTab === 'effects' && (
                      <AudioEffectsRack
                        config={effectsConfig}
                        onChange={setEffectsConfig}
                        language={language}
                        embedded
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <VoiceSelector
                    selectedVoice={selectedVoice}
                    onSelectVoice={setSelectedVoice}
                    onAuditionVoice={handleAuditionVoice}
                    auditioningVoice={auditioningVoice}
                    customVoices={customVoices}
                    onAddCustomVoice={(v) => setCustomVoices((prev) => [v, ...prev])}
                    onDeleteCustomVoice={(id) => {
                      setCustomVoices((prev) => prev.filter((item) => item.id !== id));
                      if (selectedVoice === id) setSelectedVoice('Kore');
                    }}
                    onPreviewCustomVoice={handlePreviewCustomVoice}
                    isPreviewingCustom={isPreviewingCustom}
                    language={language}
                  />

                  <DialectSelector
                    language={language}
                    selectedDialect={selectedDialect}
                    onSelectDialect={setSelectedDialect}
                    customDialect={customDialect}
                    onCustomDialectChange={setCustomDialect}
                    onConvertDialectText={
                      activeTab === 'single' ? handleConvertDialect : undefined
                    }
                    isConvertingDialect={isDialectConverting}
                  />

                  {activeTab === 'single' && (
                    <StyleSelector
                      selectedStyleId={selectedStyleId}
                      onSelectStyle={setSelectedStyleId}
                      customTonePrompt={customTonePrompt}
                      onCustomTonePromptChange={setCustomTonePrompt}
                      voiceSettings={voiceSettings}
                      onVoiceSettingsChange={setVoiceSettings}
                      language={language}
                    />
                  )}

                  <AudioEffectsRack
                    config={effectsConfig}
                    onChange={setEffectsConfig}
                    language={language}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Dialogue Screenplay Studio Tab — Balanced 8/4 Split with DSP Rack */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-8">
              <DialogueStudio
                language={language}
                customVoices={customVoices}
                onGenerateDialogue={handleGenerateDialogue}
                isLoading={isLoading}
              />
            </div>
            <div className="lg:col-span-4">
              <AudioEffectsRack
                config={effectsConfig}
                onChange={setEffectsConfig}
                language={language}
              />
            </div>
          </div>
        )}

        {/* Dedicated Full-Width Master Audio Deck */}
        <AudioPlayerBar
          audioBase64={currentAudio?.audioBase64 || null}
          mimeType={currentAudio?.mimeType || 'audio/wav'}
          voiceName={currentAudio?.voice}
          dialectName={currentAudio?.dialectName}
          language={language}
        />

        {/* Master Takes History */}
        <AudioHistory
          history={history}
          onSelectAudio={(item) =>
            setCurrentAudio({
              id: item.id,
              audioBase64: item.audioBase64,
              mimeType: item.mimeType,
              voice: item.voice,
              dialectName: item.effectsSummary
                ? `${item.dialect} · ${item.effectsSummary}`
                : item.dialect,
            })
          }
          onClearHistory={() => setHistory([])}
          onDeleteItem={(id) => setHistory((prev) => prev.filter((item) => item.id !== id))}
          currentAudioId={currentAudio?.id}
          language={language}
        />
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="mt-14 border-t border-[#DED9CE] dark:border-[#2A2723] py-6 text-center text-xs text-[#5F5B53] dark:text-[#968F84]">
        <div className="font-mono">VoxArabic Studio · 24kHz WAV &amp; MP3</div>
      </footer>
    </div>
  );
}
