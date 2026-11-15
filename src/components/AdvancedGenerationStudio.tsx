import React, { useMemo, useRef, useState } from 'react';
import {
  AdvancedParagraph,
  CustomVoicePersona,
  Language,
  VoiceName,
} from '../types';
import {
  EXPRESSIVE_CUES,
  VOCAL_STYLES,
  VOICES,
} from '../data/voicesAndDialects';
import {
  ArrowDown,
  ArrowUp,
  CopyPlus,
  FileDown,
  Play,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Square,
  Trash2,
  Wand2,
} from 'lucide-react';

interface AdvancedGenerationStudioProps {
  language: Language;
  paragraphs: AdvancedParagraph[];
  onParagraphsChange: React.Dispatch<React.SetStateAction<AdvancedParagraph[]>>;
  defaultVoice: VoiceName;
  customVoices: CustomVoicePersona[];
  selectedDialect: string;
  customDialect: string;
  editorText: string;
  onGenerateAdvanced: () => void;
  isLoading: boolean;
}

export const AdvancedGenerationStudio: React.FC<AdvancedGenerationStudioProps> = ({
  language,
  paragraphs,
  onParagraphsChange,
  defaultVoice,
  customVoices,
  selectedDialect,
  customDialect,
  editorText,
  onGenerateAdvanced,
  isLoading,
}) => {
  const isAr = language === 'ar';
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [tashkeelingId, setTashkeelingId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const voiceChoices = useMemo(() => {
    const customMapped = customVoices.map((cv) => ({
      id: cv.id,
      label: `★ ${cv.name} (${cv.baseVoice})`,
      baseVoice: cv.baseVoice,
      designPrompt: cv.prompt,
    }));
    const standardMapped = VOICES.map((v) => ({
      id: v.id,
      label: `${v.id} · ${isAr ? v.timbreAr : v.timbreEn}`,
      baseVoice: v.id,
      designPrompt: undefined,
    }));
    return [...customMapped, ...standardMapped];
  }, [customVoices, isAr]);

  const updateParagraph = (
    id: string,
    patch: Partial<AdvancedParagraph>
  ) => {
    onParagraphsChange((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
  };

  const addParagraph = () => {
    onParagraphsChange((prev) => [
      ...prev,
      {
        id: `para-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
        text: '',
        speechRate: 1.0,
        pitch: 0,
        styleId: 'natural',
        customTone: '',
        pauseAfterMs: 450,
      },
    ]);
  };

  const duplicateParagraph = (para: AdvancedParagraph, index: number) => {
    const clone: AdvancedParagraph = {
      ...para,
      id: `para-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
    };
    onParagraphsChange((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, clone);
      return next;
    });
  };

  const moveParagraph = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= paragraphs.length) return;
    onParagraphsChange((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  };

  const removeParagraph = (id: string) => {
    if (paragraphs.length <= 1) return;
    onParagraphsChange((prev) => prev.filter((p) => p.id !== id));
  };

  const importFromSingleEditor = () => {
    const chunks = editorText
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (chunks.length === 0) return;

    onParagraphsChange(
      chunks.map((chunk, i) => ({
        id: `para-${Date.now().toString(36)}-${i}`,
        text: chunk,
        speechRate: 1.0,
        pitch: 0,
        styleId: 'natural',
        customTone: '',
        pauseAfterMs: 450,
      }))
    );
  };

  const loadMultiToneShowcase = () => {
    if (isAr) {
      onParagraphsChange([
        {
          id: `para-demo-1-${Date.now()}`,
          text: 'في ظلالِ السكونِ العميق... تبدأُ الحكايةُ التي لم تُروَ من قبل. <breath>',
          speechRate: 0.8,
          pitch: -3,
          styleId: 'cinematic',
          customTone: 'راوٍ سينمائي عميق وهادئ ومهيب',
          pauseAfterMs: 700,
        },
        {
          id: `para-demo-2-${Date.now()}`,
          text: 'وفجأة! <gasp> تغيّر كل شيء في لحظة واحدة! يا للروعة، أخيراً أصبحنا نتحكم بكل نبرة وسرعة! <laugh>',
          speechRate: 1.25,
          pitch: 3,
          styleId: 'excited',
          customTone: 'حماسي ومفعم بالبهجة والاندفاع',
          pauseAfterMs: 500,
        },
        {
          id: `para-demo-3-${Date.now()}`,
          text: 'جرّب الآن تعديل كل فقرة على حدة واستمع إلى التناغم الاحترافي بين المشاهد.',
          speechRate: 1.0,
          pitch: 0,
          styleId: 'natural',
          customTone: 'دافئ ومطمئن وواضح',
          pauseAfterMs: 0,
        },
      ]);
    } else {
      onParagraphsChange([
        {
          id: `para-demo-1-${Date.now()}`,
          text: 'In the quiet shadow before dawn... a hidden story begins to unfold. <breath>',
          speechRate: 0.8,
          pitch: -3,
          styleId: 'cinematic',
          customTone: 'Deep, mysterious documentary narrator',
          pauseAfterMs: 700,
        },
        {
          id: `para-demo-2-${Date.now()}`,
          text: 'And suddenly! <gasp> Everything shifted in a single heartbeat! <laugh> You now control every pitch, pace, and emotion!',
          speechRate: 1.25,
          pitch: 3,
          styleId: 'excited',
          customTone: 'Bright, fast-paced, bursting with excitement',
          pauseAfterMs: 500,
        },
        {
          id: `para-demo-3-${Date.now()}`,
          text: 'Fine-tune every paragraph individually and craft studio-grade voiceovers effortlessly.',
          speechRate: 1.0,
          pitch: 0,
          styleId: 'natural',
          customTone: 'Warm, grounded and reassuring',
          pauseAfterMs: 0,
        },
      ]);
    }
  };

  const handleParagraphTashkeel = async (para: AdvancedParagraph) => {
    if (!para.text.trim()) return;
    setTashkeelingId(para.id);
    try {
      const res = await fetch('/api/tashkeel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: para.text }),
      });
      const data = await res.json();
      if (data.vocalizedText) {
        updateParagraph(para.id, { text: data.vocalizedText });
      }
    } catch (err) {
      console.warn('Paragraph tashkeel error:', err);
    } finally {
      setTashkeelingId(null);
    }
  };

  const handlePreviewParagraph = async (para: AdvancedParagraph) => {
    if (previewingId === para.id) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
      }
      setPreviewingId(null);
      return;
    }

    if (!para.text.trim()) return;
    setPreviewingId(para.id);

    try {
      const chosenId = para.voiceOverride || defaultVoice;
      const customObj = customVoices.find((cv) => cv.id === chosenId);
      const baseVoice = customObj ? customObj.baseVoice : chosenId;
      const styleObj = VOCAL_STYLES.find((s) => s.id === para.styleId);

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: para.text.trim(),
          voice: baseVoice,
          voiceDesignPrompt: customObj?.prompt,
          language,
          dialect: selectedDialect,
          customDialect: selectedDialect === 'custom' ? customDialect : undefined,
          style: styleObj?.promptInstruction || 'Natural balanced delivery',
          customTonePrompt: para.customTone.trim() || undefined,
          voiceSettings: {
            stability: 50,
            styleExaggeration: 45,
            speed: para.speechRate,
            pitch: para.pitch,
            speakerBoost: true,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Preview failed');

      if (data.audioBase64) {
        if (!previewAudioRef.current) {
          previewAudioRef.current = new Audio();
        }
        previewAudioRef.current.src = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
        previewAudioRef.current.onended = () => setPreviewingId(null);
        previewAudioRef.current.onerror = () => setPreviewingId(null);
        await previewAudioRef.current.play();
      }
    } catch (err) {
      console.error('Paragraph preview error:', err);
      setPreviewingId(null);
    }
  };

  const insertCueIntoParagraph = (para: AdvancedParagraph, tag: string) => {
    const next = para.text ? `${para.text.trimEnd()} ${tag} ` : `${tag} `;
    updateParagraph(para.id, { text: next });
  };

  const getRateBadgeText = (rate: number) => {
    if (rate <= 0.78) return isAr ? `${rate.toFixed(2)}x · بطيء جداً` : `${rate.toFixed(2)}x · Very Slow`;
    if (rate <= 0.92) return isAr ? `${rate.toFixed(2)}x · بطيء` : `${rate.toFixed(2)}x · Slow`;
    if (rate >= 1.25) return isAr ? `${rate.toFixed(2)}x · سريع جداً` : `${rate.toFixed(2)}x · Very Fast`;
    if (rate >= 1.1) return isAr ? `${rate.toFixed(2)}x · سريع` : `${rate.toFixed(2)}x · Fast`;
    return isAr ? `${rate.toFixed(2)}x · طبيعي` : `${rate.toFixed(2)}x · Normal`;
  };

  const getPitchBadgeText = (pitch: number) => {
    const signed = pitch > 0 ? `+${pitch}` : `${pitch}`;
    if (pitch <= -3) return isAr ? `${signed} · عميق جداً` : `${signed} · Very Deep`;
    if (pitch <= -1) return isAr ? `${signed} · دافئ منخفض` : `${signed} · Deeper`;
    if (pitch >= 3) return isAr ? `${signed} · حاد مرتفع` : `${signed} · High/Bright`;
    if (pitch >= 1) return isAr ? `${signed} · مشرق` : `${signed} · Lifted`;
    return isAr ? `0 · متزن` : `0 · Natural`;
  };

  const totalWords = paragraphs.reduce(
    (acc, p) => acc + p.text.trim().split(/\s+/).filter(Boolean).length,
    0
  );

  return (
    <div className="space-y-4">
      {/* Studio Mode Header Card */}
      <div className="rounded-xl border border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1A1816] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DED9CE] dark:border-[#2A2723] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D94E28]/30 bg-[#FDF1EC] dark:bg-[#261A15] text-[#D94E28] dark:text-[#EE6A43]">
              <SlidersHorizontal className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#171614] dark:text-[#F3F0EA]">
                {isAr ? 'وضع التوليد المتقدم (تحكم دقيق لكل فقرة)' : 'Advanced Generation Mode (Per-Paragraph Control)'}
              </h2>
              <p className="text-xs text-[#5F5B53] dark:text-[#968F84]">
                {isAr
                  ? 'اضبط سرعة التحدث، درجة الصوت، ونبرة الأداء والوقفة لكل فقرة ثم ادمجها في ملف ماستر واحد'
                  : 'Fine-tune Speech Rate, Pitch, Vocal Tone, and Pause per paragraph and render a unified Master track'}
              </p>
            </div>
          </div>

          {/* Utility Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={importFromSingleEditor}
              disabled={!editorText.trim()}
              className="flex items-center gap-1.5 rounded-lg border border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#22201C] hover:bg-[#EDEAE2] dark:hover:bg-[#2C2924] px-2.5 py-1.5 text-xs font-medium text-[#171614] dark:text-[#F3F0EA] transition-colors disabled:opacity-40"
              title={isAr ? 'استيراد النص من المحرر الفردي وتقسيمه حسب الأسطر' : 'Import & split text from Single Voice editor'}
            >
              <FileDown className="h-3.5 w-3.5 text-[#D94E28] dark:text-[#EE6A43]" />
              <span>{isAr ? 'استيراد وتقسيم النص' : 'Import & Split'}</span>
            </button>

            <button
              type="button"
              onClick={loadMultiToneShowcase}
              className="flex items-center gap-1.5 rounded-lg border border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#22201C] hover:bg-[#EDEAE2] dark:hover:bg-[#2C2924] px-2.5 py-1.5 text-xs font-medium text-[#171614] dark:text-[#F3F0EA] transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#D94E28] dark:text-[#EE6A43]" />
              <span>{isAr ? 'نموذج عرض متباين' : 'Load Showcase'}</span>
            </button>

            <button
              type="button"
              onClick={addParagraph}
              className="flex items-center gap-1 rounded-lg border border-[#D94E28] bg-[#FDF1EC] dark:bg-[#261A15] hover:bg-[#D94E28] hover:text-white px-2.5 py-1.5 text-xs font-semibold text-[#D94E28] dark:text-[#EE6A43] dark:hover:text-white transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isAr ? 'إضافة فقرة' : 'Add Paragraph'}</span>
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#5F5B53] dark:text-[#968F84] font-mono tabular-nums">
          <span>
            {isAr
              ? `${paragraphs.length} فقرات · ${totalWords} كلمة إجمالاً`
              : `${paragraphs.length} paragraphs · ${totalWords} total words`}
          </span>
          <span>
            {isAr
              ? 'الصوت الافتراضي: ' + defaultVoice
              : 'Default Voice: ' + defaultVoice}
          </span>
        </div>
      </div>

      {/* Paragraph Director Cards */}
      <div className="space-y-3.5">
        {paragraphs.map((para, index) => {
          const isPreviewing = previewingId === para.id;
          const isTashkeeling = tashkeelingId === para.id;

          return (
            <div
              key={para.id}
              className="rounded-xl border border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1A1816] p-4 space-y-3"
            >
              {/* Paragraph Header Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDEAE2] dark:border-[#26231F] pb-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono tabular-nums text-xs font-bold text-[#D94E28] dark:text-[#EE6A43] bg-[#FDF1EC] dark:bg-[#261A15] border border-[#D94E28]/30 rounded px-2 py-0.5">
                    {isAr ? `الفقرة #${index + 1}` : `Paragraph #${index + 1}`}
                  </span>

                  {/* Per-paragraph Voice Override */}
                  <select
                    value={para.voiceOverride || ''}
                    onChange={(e) =>
                      updateParagraph(para.id, {
                        voiceOverride: e.target.value || undefined,
                      })
                    }
                    className="rounded-md border border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#121110] px-2 py-1 text-xs text-[#171614] dark:text-[#F3F0EA] focus:border-[#D94E28] focus:outline-none max-w-[200px]"
                    title={isAr ? 'تخصيص صوت لهذه الفقرة' : 'Voice override for this paragraph'}
                  >
                    <option value="">
                      {isAr
                        ? `الصوت الافتراضي (${defaultVoice})`
                        : `Default (${defaultVoice})`}
                    </option>
                    {voiceChoices.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>

                  {/* Silence Pause After Paragraph */}
                  {index < paragraphs.length - 1 && (
                    <select
                      value={para.pauseAfterMs}
                      onChange={(e) =>
                        updateParagraph(para.id, {
                          pauseAfterMs: Number(e.target.value),
                        })
                      }
                      className="rounded-md border border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#121110] px-2 py-1 text-xs font-mono tabular-nums text-[#5F5B53] dark:text-[#A39D93] focus:border-[#D94E28] focus:outline-none"
                      title={isAr ? 'وقفة الصمت بعد هذه الفقرة' : 'Silence pause after paragraph'}
                    >
                      <option value={0}>{isAr ? 'بدون وقفة (0ms)' : 'No Pause (0ms)'}</option>
                      <option value={250}>{isAr ? 'وقفة 250ms' : 'Pause 250ms'}</option>
                      <option value={450}>{isAr ? 'وقفة 450ms' : 'Pause 450ms'}</option>
                      <option value={800}>{isAr ? 'وقفة 800ms' : 'Pause 800ms'}</option>
                      <option value={1200}>{isAr ? 'وقفة 1.2s' : 'Pause 1.2s'}</option>
                      <option value={2000}>{isAr ? 'وقفة 2.0s' : 'Pause 2.0s'}</option>
                    </select>
                  )}
                </div>

                {/* Card Controls */}
                <div className="flex items-center gap-1">
                  {isAr && (
                    <button
                      type="button"
                      onClick={() => handleParagraphTashkeel(para)}
                      disabled={isTashkeeling || !para.text.trim()}
                      className="flex items-center gap-1 rounded-md border border-[#15803D]/40 bg-[#15803D]/10 px-2 py-1 text-[11px] font-semibold text-[#15803D] dark:text-emerald-400 hover:bg-[#15803D]/20 transition-colors disabled:opacity-40"
                    >
                      {isTashkeeling ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      <span>تشكيل</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handlePreviewParagraph(para)}
                    disabled={!para.text.trim()}
                    className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors disabled:opacity-40 ${
                      isPreviewing
                        ? 'border-[#D94E28] bg-[#D94E28] text-white'
                        : 'border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#22201C] text-[#171614] dark:text-[#F3F0EA] hover:bg-[#EDEAE2] dark:hover:bg-[#2C2924]'
                    }`}
                    title={isAr ? 'معاينة هذه الفقرة فقط' : 'Preview this paragraph only'}
                  >
                    {isPreviewing ? (
                      <>
                        <Square className="h-3 w-3 fill-current" />
                        <span>{isAr ? 'إيقاف' : 'Stop'}</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 fill-current text-[#D94E28] dark:text-[#EE6A43]" />
                        <span>{isAr ? 'معاينة' : 'Preview'}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => moveParagraph(index, -1)}
                    disabled={index === 0}
                    className="rounded-md border border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#22201C] p-1 text-[#5F5B53] dark:text-[#968F84] hover:text-[#171614] dark:hover:text-white disabled:opacity-25 transition-colors"
                    title={isAr ? 'تحريك للأعلى' : 'Move up'}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => moveParagraph(index, 1)}
                    disabled={index === paragraphs.length - 1}
                    className="rounded-md border border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#22201C] p-1 text-[#5F5B53] dark:text-[#968F84] hover:text-[#171614] dark:hover:text-white disabled:opacity-25 transition-colors"
                    title={isAr ? 'تحريك للأسفل' : 'Move down'}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => duplicateParagraph(para, index)}
                    className="rounded-md border border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#22201C] p-1 text-[#5F5B53] dark:text-[#968F84] hover:text-[#D94E28] dark:hover:text-[#EE6A43] transition-colors"
                    title={isAr ? 'تكرار الفقرة' : 'Duplicate paragraph'}
                  >
                    <CopyPlus className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => removeParagraph(para.id)}
                    disabled={paragraphs.length <= 1}
                    className="rounded-md border border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#22201C] p-1 text-[#5F5B53] dark:text-[#968F84] hover:text-red-600 dark:hover:text-red-400 disabled:opacity-25 transition-colors"
                    title={isAr ? 'حذف الفقرة' : 'Delete paragraph'}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Expressive Cues Bar */}
              <div className="flex flex-wrap items-center gap-1">
                {EXPRESSIVE_CUES.map((cue) => (
                  <button
                    key={cue.tag}
                    type="button"
                    onClick={() => insertCueIntoParagraph(para, cue.tag)}
                    className="rounded border border-[#DED9CE] dark:border-[#2A2723] bg-[#FBF9F5] dark:bg-[#151311] hover:border-[#D94E28] hover:text-[#D94E28] dark:hover:text-[#EE6A43] px-2 py-0.5 text-[10px] font-mono text-[#5F5B53] dark:text-[#968F84] transition-colors"
                  >
                    {cue.tag} · {isAr ? cue.labelAr : cue.labelEn}
                  </button>
                ))}
              </div>

              {/* Paragraph Script Textarea */}
              <textarea
                rows={3}
                value={para.text}
                onChange={(e) => updateParagraph(para.id, { text: e.target.value })}
                placeholder={
                  isAr
                    ? `اكتب نص الفقرة #${index + 1} هنا...`
                    : `Write paragraph #${index + 1} script here...`
                }
                className="w-full resize-none rounded-lg border border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#121110] p-3 text-sm leading-relaxed text-[#171614] dark:text-[#F3F0EA] placeholder-[#8C857B] dark:placeholder-[#5E584F] focus:border-[#D94E28] focus:outline-none"
              />

              {/* Per-Paragraph Precision Acoustic Controls: Speech Rate, Pitch, Vocal Tone */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-lg bg-[#F6F4EF] dark:bg-[#141210] p-3">
                {/* 1. Speech Rate */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[#171614] dark:text-[#F3F0EA]">
                      {isAr ? 'سرعة التحدث (Speech Rate)' : 'Speech Rate'}
                    </span>
                    <span className="font-mono tabular-nums text-[#D94E28] dark:text-[#EE6A43] font-semibold">
                      {getRateBadgeText(para.speechRate)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.6}
                    max={1.5}
                    step={0.05}
                    value={para.speechRate}
                    onChange={(e) =>
                      updateParagraph(para.id, { speechRate: Number(e.target.value) })
                    }
                    className="w-full accent-[#D94E28] h-1.5 bg-[#DED9CE] dark:bg-[#2A2723] rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#5F5B53] dark:text-[#968F84] font-mono tabular-nums">
                    <span>0.60x</span>
                    <span>1.00x</span>
                    <span>1.50x</span>
                  </div>
                </div>

                {/* 2. Pitch */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[#171614] dark:text-[#F3F0EA]">
                      {isAr ? 'درجة الصوت (Pitch)' : 'Vocal Pitch'}
                    </span>
                    <span className="font-mono tabular-nums text-[#D94E28] dark:text-[#EE6A43] font-semibold">
                      {getPitchBadgeText(para.pitch)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-6}
                    max={6}
                    step={1}
                    value={para.pitch}
                    onChange={(e) =>
                      updateParagraph(para.id, { pitch: Number(e.target.value) })
                    }
                    className="w-full accent-[#D94E28] h-1.5 bg-[#DED9CE] dark:bg-[#2A2723] rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#5F5B53] dark:text-[#968F84] font-mono tabular-nums">
                    <span>-6</span>
                    <span>0</span>
                    <span>+6</span>
                  </div>
                </div>

                {/* 3. Vocal Tone & Custom Note */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#171614] dark:text-[#F3F0EA] block">
                    {isAr ? 'نبرة الصوت (Vocal Tone)' : 'Vocal Tone'}
                  </label>
                  <select
                    value={para.styleId}
                    onChange={(e) =>
                      updateParagraph(para.id, { styleId: e.target.value })
                    }
                    className="w-full rounded-md border border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1A1816] px-2 py-1 text-xs text-[#171614] dark:text-[#F3F0EA] focus:border-[#D94E28] focus:outline-none"
                  >
                    {VOCAL_STYLES.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.icon} {isAr ? st.nameAr : st.nameEn}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={para.customTone}
                    onChange={(e) =>
                      updateParagraph(para.id, { customTone: e.target.value })
                    }
                    placeholder={
                      isAr
                        ? 'توجيه إضافي للفقرة (مثلاً: همس غامض)...'
                        : 'Optional custom tone note...'
                    }
                    className="w-full rounded-md border border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1A1816] px-2 py-1 text-[11px] text-[#171614] dark:text-[#F3F0EA] placeholder-[#8C857B] dark:placeholder-[#5E584F] focus:border-[#D94E28] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Paragraph & Master Synthesize Action */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5">
        <button
          type="button"
          onClick={addParagraph}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg border border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1A1816] hover:bg-[#EDEAE2] dark:hover:bg-[#26231F] px-4 py-3.5 text-xs font-semibold text-[#171614] dark:text-[#F3F0EA] transition-colors"
        >
          <Plus className="h-4 w-4 text-[#D94E28] dark:text-[#EE6A43]" />
          <span>{isAr ? 'فقرة جديدة' : 'Add Paragraph'}</span>
        </button>

        <button
          type="button"
          onClick={onGenerateAdvanced}
          disabled={isLoading || paragraphs.every((p) => !p.text.trim())}
          className="w-full sm:flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#D94E28] hover:bg-[#C2411D] p-3.5 text-sm font-bold text-white transition-colors active:scale-95 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin text-white" />
              <span>
                {isAr
                  ? `جارِ توليد ودمج ${paragraphs.filter((p) => p.text.trim()).length} فقرات...`
                  : `Rendering & Merging ${paragraphs.filter((p) => p.text.trim()).length} Paragraphs...`}
              </span>
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              <span>
                {isAr
                  ? 'توليد المقطع المتقدم الكامل (Master WAV / MP3)'
                  : 'Render Advanced Multi-Paragraph Master'}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
