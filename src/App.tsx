/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { VoiceSelector } from './components/VoiceSelector';
import { DialectSelector } from './components/DialectSelector';
import { StyleSelector } from './components/StyleSelector';
import { ScriptTemplates } from './components/ScriptTemplates';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { DialogueStudio } from './components/DialogueStudio';
import { AudioHistory } from './components/AudioHistory';
import {
  Language,
  VoiceName,
  GeneratedAudioItem,
} from './types';
import { ScriptSample, VOCAL_STYLES } from './data/voicesAndDialects';
import {
  speakWithBrowserWebSpeech,
  stopBrowserWebSpeech,
} from './utils/audioHelper';
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
} from 'lucide-react';

export default function App() {
  const [language, setLanguage] = useState<Language>('ar');
  const [activeTab, setActiveTab] = useState<'single' | 'dialogue'>('single');

  // Single Voice State
  const [inputText, setInputText] = useState(
    'أهلاً بك في استوديو فوكس أرابيك للذكاء الاصطناعي. يمكنك تحويل أي نص إلى صوت بشري واقعي بمختلف اللهجات والأنماط الصوتية.'
  );
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>('Kore');
  const [selectedDialect, setSelectedDialect] = useState<string>('msa');
  const [selectedStyleId, setSelectedStyleId] = useState<string>('natural');

  // Generation status
  const [isLoading, setIsLoading] = useState(false);
  const [isTashkeelLoading, setIsTashkeelLoading] = useState(false);
  const [isDialectConverting, setIsDialectConverting] = useState(false);
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

  // Dictation handler
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
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

  // Audition voice sample
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
      const res = await fetch(`/api/voices/audition/${voice}`);
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
      const greetings: Record<string, string> = {
        Kore: 'مرحباً، أنا كوري، صوتي دافئ ونقي.',
        Puck: 'أهلاً يا صديقي! أنا باك، كلي طاقة وحيوية!',
        Charon: 'مرحباً، أنا شارون، صوت عميق للأفلام والوثائقيات.',
        Fenrir: 'أهلاً، أنا فنرير، صوت قوي وملحمي.',
        Zephyr: 'مرحباً، أنا زفير، صوت هادئ ومريح.',
      };
      speakWithBrowserWebSpeech(greetings[voice] || 'مرحباً بك في استوديو الصوت', language, () => {
        setAuditioningVoice(null);
      });
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
    setInputText(sample.text);
    setSelectedVoice(sample.recommendedVoice);
    setSelectedDialect(sample.dialect);
    setSelectedStyleId(sample.recommendedStyle);
  };

  // Synthesize Single Voice
  const handleSynthesize = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);
    stopBrowserWebSpeech();
    setIsBrowserSpeaking(false);

    const styleObj = VOCAL_STYLES.find((s) => s.id === selectedStyleId);
    const styleInstruction = styleObj ? styleObj.promptInstruction : 'Natural delivery';

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText.trim(),
          voice: selectedVoice,
          language,
          dialect: selectedDialect,
          style: styleInstruction,
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
        const audioItem: GeneratedAudioItem = {
          id: Math.random().toString(36).substring(2, 9),
          text: inputText.trim(),
          audioBase64: data.audioBase64,
          mimeType: data.mimeType || 'audio/wav',
          voice: selectedVoice,
          dialect: selectedDialect,
          language,
          styleName: styleObj?.nameAr || selectedStyleId,
          createdAt: Date.now(),
        };

        setCurrentAudio({
          id: audioItem.id,
          audioBase64: data.audioBase64,
          mimeType: data.mimeType || 'audio/wav',
          voice: selectedVoice,
          dialectName: selectedDialect,
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
        const audioItem: GeneratedAudioItem = {
          id: Math.random().toString(36).substring(2, 9),
          text: payload.dialogueLines.map((l) => `${l.speaker}: ${l.text}`).join(' | '),
          audioBase64: data.audioBase64,
          mimeType: data.mimeType || 'audio/wav',
          voice: payload.speakerAVoice,
          dialect: 'Dialogue Studio',
          language,
          styleName: 'Dialogue Scene',
          createdAt: Date.now(),
        };

        setCurrentAudio({
          id: audioItem.id,
          audioBase64: data.audioBase64,
          mimeType: data.mimeType || 'audio/wav',
          voice: payload.speakerAVoice,
          dialectName: 'Dual Dialogue',
        });

        setHistory((prev) => [audioItem, ...prev]);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
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

  const isAr = language === 'ar';

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200">
      <Header
        language={language}
        onToggleLanguage={toggleLanguage}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-6">
        {/* Error notification banner */}
        {errorMessage && (
          <div className="flex items-center gap-3 rounded-lg border border-red-800/80 bg-red-950/40 p-3 text-red-200 text-xs">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
            <div className="font-medium flex-1">{errorMessage}</div>
            <button
              onClick={() => setErrorMessage(null)}
              className="font-bold text-red-400 hover:text-red-200 px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Studio Workspace */}
        {activeTab === 'single' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Script Editor & Master Audio Player (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Presets Row */}
              <ScriptTemplates language={language} onApplySample={handleApplySample} />

              {/* Main Script Editor */}
              <div className="rounded-xl border border-slate-800 bg-[#090d16] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-cyan-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {isAr ? 'نص التسجيل (Script Track)' : 'Script Track'}
                    </span>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center gap-1.5">
                    {/* Dictation */}
                    <button
                      onClick={toggleSpeechRecognition}
                      className={`flex items-center gap-1 rounded border px-2 py-1 text-xs font-medium transition-colors ${
                        isListening
                          ? 'border-red-500 bg-red-950/80 text-red-300'
                          : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                      title={isAr ? 'إملاء صوتي' : 'Dictate'}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="h-3 w-3 text-red-400" />
                          <span>{isAr ? 'إيقاف' : 'Stop'}</span>
                        </>
                      ) : (
                        <>
                          <Mic className="h-3 w-3 text-slate-400" />
                          <span>{isAr ? 'إملاء' : 'Dictate'}</span>
                        </>
                      )}
                    </button>

                    {/* Auto-Tashkeel for Arabic */}
                    {language === 'ar' && (
                      <button
                        onClick={handleAutoTashkeel}
                        disabled={isTashkeelLoading || !inputText.trim()}
                        className="flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-950/30 px-2 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-900/50 hover:text-white transition-colors disabled:opacity-50"
                        title="ضبط وتشكيل الحركات الإعرابية التامة"
                      >
                        {isTashkeelLoading ? (
                          <RefreshCw className="h-3 w-3 animate-spin text-emerald-400" />
                        ) : (
                          <Sparkles className="h-3 w-3 text-emerald-400" />
                        )}
                        <span>{isTashkeelLoading ? 'تشكيل...' : 'تشكيل النص'}</span>
                      </button>
                    )}

                    {/* Copy */}
                    <button
                      onClick={copyTextToClipboard}
                      className="rounded border border-slate-800 bg-slate-900 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                      title={isAr ? 'نسخ النص' : 'Copy'}
                    >
                      {copiedText ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>

                    {/* Clear */}
                    <button
                      onClick={() => setInputText('')}
                      className="rounded border border-slate-800 bg-slate-900 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
                      title={isAr ? 'مسح النص' : 'Clear'}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Textarea */}
                <textarea
                  rows={6}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isAr
                      ? 'اكتب أو الصق النص هنا.. يمكنك استخدام الفصحى أو أي لهجة عامية...'
                      : 'Enter or paste your script here...'
                  }
                  className="w-full resize-none rounded-lg border border-slate-800 bg-[#0b0f19] p-3 text-sm leading-relaxed text-slate-100 placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                />

                {/* Counter & Technical Note */}
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>
                    {isAr
                      ? `${inputText.trim().split(/\s+/).filter(Boolean).length} كلمة · ${inputText.length} حرف`
                      : `${inputText.trim().split(/\s+/).filter(Boolean).length} words · ${inputText.length} chars`}
                  </span>
                  <span>Gemini 3.8 Flash Lite TTS · 24kHz</span>
                </div>
              </div>

              {/* Execution Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                {/* Primary Master Synth Button */}
                <button
                  onClick={handleSynthesize}
                  disabled={isLoading || !inputText.trim()}
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 p-3.5 text-sm font-bold text-slate-950 transition-colors active:scale-95 disabled:opacity-50 shadow-sm"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-slate-950" />
                      <span>{isAr ? 'جارِ معالجة وتوليد الصوت...' : 'Synthesizing Master Take...'}</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4" />
                      <span>{isAr ? 'توليد الصوت الآن (Master WAV)' : 'Synthesize Master WAV'}</span>
                    </>
                  )}
                </button>

                {/* Secondary Fast Browser Preview Button */}
                <button
                  onClick={handleBrowserPreview}
                  disabled={!inputText.trim()}
                  className={`w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg border px-4 py-3.5 text-xs font-semibold transition-colors disabled:opacity-40 active:scale-95 ${
                    isBrowserSpeaking
                      ? 'border-amber-400 bg-amber-950/60 text-amber-300'
                      : 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                  title={isAr ? 'معاينة تجريبية فورية داخل المتصفح' : 'Instant local browser audio preview'}
                >
                  {isBrowserSpeaking ? (
                    <>
                      <VolumeX className="h-4 w-4 text-amber-400" />
                      <span>{isAr ? 'إيقاف المعاينة' : 'Stop Preview'}</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4 text-slate-400" />
                      <span>{isAr ? 'معاينة فورية بالمتصفح' : 'Browser Preview'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Master Audio Player */}
              <AudioPlayerBar
                audioBase64={currentAudio?.audioBase64 || null}
                mimeType={currentAudio?.mimeType || 'audio/wav'}
                voiceName={currentAudio?.voice}
                dialectName={currentAudio?.dialectName}
                language={language}
              />
            </div>

            {/* Right Column: Parameters Rack (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Voice Personas */}
              <VoiceSelector
                selectedVoice={selectedVoice}
                onSelectVoice={setSelectedVoice}
                onAuditionVoice={handleAuditionVoice}
                auditioningVoice={auditioningVoice}
                language={language}
              />

              {/* Regional Dialects */}
              <DialectSelector
                language={language}
                selectedDialect={selectedDialect}
                onSelectDialect={setSelectedDialect}
                onConvertDialectText={handleConvertDialect}
                isConvertingDialect={isDialectConverting}
              />

              {/* Vocal Performance Styles */}
              <StyleSelector
                selectedStyleId={selectedStyleId}
                onSelectStyle={setSelectedStyleId}
                language={language}
              />
            </div>
          </div>
        ) : (
          /* Dialogue Screenplay Studio Tab */
          <div className="space-y-6">
            <DialogueStudio
              language={language}
              onGenerateDialogue={handleGenerateDialogue}
              isLoading={isLoading}
            />

            {/* Audio Player for Dialogue */}
            {currentAudio && (
              <AudioPlayerBar
                audioBase64={currentAudio.audioBase64}
                mimeType={currentAudio.mimeType}
                voiceName={currentAudio.voice}
                dialectName={currentAudio.dialectName}
                language={language}
              />
            )}
          </div>
        )}

        {/* Master Takes History */}
        <AudioHistory
          history={history}
          onSelectAudio={(item) =>
            setCurrentAudio({
              id: item.id,
              audioBase64: item.audioBase64,
              mimeType: item.mimeType,
              voice: item.voice,
              dialectName: item.dialect,
            })
          }
          onClearHistory={() => setHistory([])}
          onDeleteItem={(id) => setHistory((prev) => prev.filter((item) => item.id !== id))}
          currentAudioId={currentAudio?.id}
          language={language}
        />
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-800/80 py-6 text-center text-xs text-slate-400">
        <div className="flex items-center justify-center gap-2 font-mono">
          <span>VoxArabic AI Studio</span>
          <span aria-hidden="true">·</span>
          <span>Google Gemini 3.8 Neural Speech</span>
          <span aria-hidden="true">·</span>
          <span>24kHz Studio Master</span>
        </div>
      </footer>
    </div>
  );
}
