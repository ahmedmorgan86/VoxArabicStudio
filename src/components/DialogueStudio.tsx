import React, { useMemo, useState } from 'react';
import { CustomVoicePersona, Language, VoiceName } from '../types';
import {
  ARABIC_DIALECTS,
  ENGLISH_DIALECTS,
  EXPRESSIVE_CUES,
  VOICES,
} from '../data/voicesAndDialects';
import { Plus, Trash2, Users, RefreshCw, Wand2, Sparkles } from 'lucide-react';
import { DurationControlBar } from './DurationControlBar';
import { estimateScriptDurationSeconds } from '../utils/audioHelper';

interface DialogueStudioProps {
  language: Language;
  customVoices: CustomVoicePersona[];
  onGenerateDialogue: (payload: {
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
  }) => void;
  isLoading: boolean;
  targetDurationEnabled: boolean;
  onToggleTargetDuration: (enabled: boolean) => void;
  targetDurationSeconds: number;
  onTargetDurationSecondsChange: (seconds: number) => void;
  durationNotice?: string | null;
  onDismissDurationNotice?: () => void;
}

export const DialogueStudio: React.FC<DialogueStudioProps> = ({
  language,
  customVoices,
  onGenerateDialogue,
  isLoading,
  targetDurationEnabled,
  onToggleTargetDuration,
  targetDurationSeconds,
  onTargetDurationSecondsChange,
  durationNotice,
  onDismissDurationNotice,
}) => {
  const isAr = language === 'ar';

  const [speakerAName, setSpeakerAName] = useState(isAr ? 'خالد' : 'Alex');
  const [speakerBName, setSpeakerBName] = useState(isAr ? 'سارة' : 'Sarah');
  const [speakerAVoice, setSpeakerAVoice] = useState<VoiceName>('Puck');
  const [speakerBVoice, setSpeakerBVoice] = useState<VoiceName>('Kore');
  const [dialogueDialect, setDialogueDialect] = useState<string>(isAr ? 'egyptian' : 'american');
  const [customDialectText, setCustomDialectText] = useState('');
  const [focusedLineId, setFocusedLineId] = useState<string>('1');

  const [lines, setLines] = useState<
    Array<{ id: string; speaker: string; text: string; style: string }>
  >([
    {
      id: '1',
      speaker: isAr ? 'خالد' : 'Alex',
      text: isAr
        ? 'أهلاً يا سارة! <breath> اليوم عندنا تجربة صوتية مذهلة بكل اللهجات والتفاعلات الحقيقية.'
        : 'Hey Sarah! <breath> Today we are exploring ultra-realistic multi-speaker speech with natural vocal cues.',
      style: isAr ? 'حماسي وودود' : 'Enthusiastic and friendly',
    },
    {
      id: '2',
      speaker: isAr ? 'سارة' : 'Sarah',
      text: isAr
        ? 'أهلاً خالد! |yeah| فعلاً دهشة حقيقية <laugh> لما تسمع التنفس والضحكة جوا الحوار بتحس إنه تسجيل استوديو حي!'
        : 'Hi Alex! |yeah| Honestly <laugh> hearing real breaths and backchanneling makes it feel like a live studio!',
      style: isAr ? 'دافئ ومتفاعل' : 'Warm and delighted',
    },
  ]);

  const voiceList = useMemo(() => {
    const customMapped = customVoices.map((cv) => ({
      id: cv.id,
      label: `★ ${cv.name} (${cv.baseVoice})`,
      baseVoice: cv.baseVoice,
      designPrompt: cv.prompt,
    }));
    const standardMapped = VOICES.map((v) => ({
      id: v.id,
      label: `${v.id} · ${isAr ? v.timbreAr : v.timbreEn} (${
        v.gender === 'male' ? (isAr ? 'ذكر' : 'M') : isAr ? 'أنثى' : 'F'
      })`,
      baseVoice: v.id,
      designPrompt: undefined,
    }));
    return [...customMapped, ...standardMapped];
  }, [customVoices, isAr]);

  const dialects = isAr ? ARABIC_DIALECTS : ENGLISH_DIALECTS;

  const estimatedDialogueSeconds = useMemo(() => {
    const valid = lines.filter((l) => l.text.trim().length > 0);
    if (valid.length === 0) return 0;
    const sum = valid.reduce(
      (acc, l, idx) =>
        acc +
        estimateScriptDurationSeconds(l.text, language, 1.0) +
        (idx < valid.length - 1 ? 0.35 : 0),
      0
    );
    return Number(sum.toFixed(1));
  }, [lines, language]);

  const loadScenario = (type: 'podcast' | 'interview' | 'promo') => {
    if (type === 'podcast') {
      const spkA = isAr ? 'خالد' : 'Alex';
      const spkB = isAr ? 'سارة' : 'Sarah';
      setSpeakerAName(spkA);
      setSpeakerBName(spkB);
      setSpeakerAVoice('Puck');
      setSpeakerBVoice('Aoede');
      setLines([
        {
          id: '1',
          speaker: spkA,
          text: isAr
            ? 'مرحباً بمستمعينا الكرام في حلقة جديدة من بودكاست المستقبل الرقمي!'
            : 'Welcome back listeners to a brand new episode of the Digital Future podcast!',
          style: 'Enthusiastic podcast host',
        },
        {
          id: '2',
          speaker: spkB,
          text: isAr
            ? 'يا هلا خالد! |mhm| موضوع اليوم عن كيف أصبحت أصوات الذكاء الاصطناعي تعبّر عن كل المشاعر واللهجات.'
            : 'Hey Alex! |mhm| Today is all about expressive neural voices across every accent and emotion.',
          style: 'Intrigued and conversational',
        },
        {
          id: '3',
          speaker: spkA,
          text: isAr
            ? 'بالتأكيد! <laugh> دقة النطق 24kHz وتنوع الأصوات جعل التجربة حقيقية مية بالمية.'
            : 'Absolutely! <laugh> The 24kHz fidelity and expressive tags are total game changers.',
          style: 'Energetic wrap-up',
        },
      ]);
    } else if (type === 'interview') {
      const spkA = isAr ? 'المذيع' : 'Anchor';
      const spkB = isAr ? 'الخبير' : 'Expert';
      setSpeakerAName(spkA);
      setSpeakerBName(spkB);
      setSpeakerAVoice('Orus');
      setSpeakerBVoice('Vindemiatrix');
      setLines([
        {
          id: '1',
          speaker: spkA,
          text: isAr
            ? 'أهلاً بكم في لقاء خاص. نسعد باستضافة الدكتورة للحديث حول ثورة الصوتيات الذكية.'
            : 'Good evening. Tonight we are joined by our guest to discuss advances in neural speech.',
          style: 'Authoritative news anchor',
        },
        {
          id: '2',
          speaker: spkB,
          text: isAr
            ? 'شكراً لك... <breath> ما نشهده اليوم يمثل نقلة نوعية في الإلقاء الطبيعي بمختلف اللهجات.'
            : 'Thank you... <breath> What we are witnessing is a true paradigm shift in expressive audio.',
          style: 'Poised articulate expert',
        },
      ]);
    } else {
      const spkA = isAr ? 'عمر' : 'Mark';
      const spkB = isAr ? 'ليلى' : 'Maya';
      setSpeakerAName(spkA);
      setSpeakerBName(spkB);
      setSpeakerAVoice('Achird');
      setSpeakerBVoice('Sadachbia');
      setLines([
        {
          id: '1',
          speaker: spkA,
          text: isAr
            ? 'جربتِ تصممي صوت خاص بيكِ في الاستوديو الجديد؟ <gasp>'
            : 'Wait <gasp> have you tried designing a custom voice in the new studio yet?',
          style: 'Curious excited friend',
        },
        {
          id: '2',
          speaker: spkB,
          text: isAr
            ? 'أيوه طبعاً! <laugh> اخترت اللهجة والانفعال والنتيجة طلعت خرافية!'
            : 'Oh yes! <laugh> Picked the accent and acting tone and the result blew me away!',
          style: 'Joyful and animated',
        },
      ]);
    }
  };

  const addLine = (speaker: string) => {
    const newId = Math.random().toString(36).slice(2, 9);
    setLines([
      ...lines,
      {
        id: newId,
        speaker,
        text: '',
        style: isAr ? 'طبيعي وحواري' : 'Natural conversational',
      },
    ]);
    setFocusedLineId(newId);
  };

  const removeLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((l) => l.id !== id));
  };

  const updateLineText = (id: string, text: string) => {
    setLines(lines.map((l) => (l.id === id ? { ...l, text } : l)));
  };

  const updateLineStyle = (id: string, style: string) => {
    setLines(lines.map((l) => (l.id === id ? { ...l, style } : l)));
  };

  const updateLineSpeaker = (id: string, speaker: string) => {
    setLines(lines.map((l) => (l.id === id ? { ...l, speaker } : l)));
  };

  const insertCueIntoActiveLine = (tag: string) => {
    const targetId = lines.some((l) => l.id === focusedLineId) ? focusedLineId : lines[0]?.id;
    if (!targetId) return;
    setLines((prev) =>
      prev.map((l) =>
        l.id === targetId
          ? { ...l, text: l.text ? `${l.text.trimEnd()} ${tag} ` : `${tag} ` }
          : l
      )
    );
  };

  const handleSubmit = () => {
    const validLines = lines.filter((l) => l.text.trim().length > 0);
    if (validLines.length === 0) return;

    const voiceObjA = voiceList.find((v) => v.id === speakerAVoice);
    const voiceObjB = voiceList.find((v) => v.id === speakerBVoice);

    onGenerateDialogue({
      dialogueLines: validLines.map((l) => ({
        speaker: l.speaker,
        text: l.text,
        style: l.style,
      })),
      speakerAVoice: voiceObjA?.baseVoice || speakerAVoice,
      speakerBVoice: voiceObjB?.baseVoice || speakerBVoice,
      speakerADesignPrompt: voiceObjA?.designPrompt,
      speakerBDesignPrompt: voiceObjB?.designPrompt,
      speakerAName,
      speakerBName,
      language,
      dialect: dialogueDialect,
      customDialect: dialogueDialect === 'custom' ? customDialectText : undefined,
    });
  };

  return (
    <div className="space-y-5 rounded-xl border border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1A1816] p-5">
      {/* Studio Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DED9CE] dark:border-[#2A2723] pb-4">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-[#171614] dark:text-[#F3F0EA]">
            <Users className="h-4 w-4 text-[#D94E28] dark:text-[#EE6A43]" />
            <span>{isAr ? 'استوديو السيناريو والحوار الثنائي' : 'Dual-Speaker Dialogue Studio'}</span>
          </h3>
          <p className="mt-0.5 text-xs text-[#5F5B53] dark:text-[#968F84]">
            {isAr
              ? 'حوار متكامل بـ 30+ صوتاً عصبياً مع دعم التفاعل البشري، الضحك، التنفس وكافة اللهجات'
              : 'Multi-turn dialogue across 30+ neural & custom voices with backchanneling and vocal bursts'}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => loadScenario('podcast')}
            className="rounded-lg border border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#22201C] px-2.5 py-1 text-xs font-medium text-[#171614] dark:text-[#F3F0EA] hover:bg-[#EDEAE2] dark:hover:bg-[#2C2924] transition-colors"
          >
            {isAr ? 'بودكاست' : 'Podcast'}
          </button>
          <button
            type="button"
            onClick={() => loadScenario('interview')}
            className="rounded-lg border border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#22201C] px-2.5 py-1 text-xs font-medium text-[#171614] dark:text-[#F3F0EA] hover:bg-[#EDEAE2] dark:hover:bg-[#2C2924] transition-colors"
          >
            {isAr ? 'مقابلة' : 'Interview'}
          </button>
          <button
            type="button"
            onClick={() => loadScenario('promo')}
            className="rounded-lg border border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#22201C] px-2.5 py-1 text-xs font-medium text-[#171614] dark:text-[#F3F0EA] hover:bg-[#EDEAE2] dark:hover:bg-[#2C2924] transition-colors"
          >
            {isAr ? 'حوار تفاعلي' : 'Interactive'}
          </button>
        </div>
      </div>

      {/* Speaker Configs + Dialogue Dialect */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Track A */}
        <div className="rounded-lg bg-[#F6F4EF] dark:bg-[#141210] p-3 space-y-2">
          <div className="text-xs font-bold text-[#D94E28] dark:text-[#EE6A43]">
            {isAr ? 'المتحدث الأول (المسار أ)' : 'Speaker 1 (Track A)'}
          </div>
          <div className="space-y-2">
            <input
              type="text"
              value={speakerAName}
              onChange={(e) => setSpeakerAName(e.target.value)}
              placeholder={isAr ? 'اسم المتحدث' : 'Speaker Name'}
              className="w-full rounded-md border border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1A1816] px-2.5 py-1.5 text-xs text-[#171614] dark:text-[#F3F0EA] focus:border-[#D94E28] focus:outline-none"
            />
            <select
              value={speakerAVoice}
              onChange={(e) => setSpeakerAVoice(e.target.value)}
              className="w-full rounded-md border border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1A1816] px-2.5 py-1.5 text-xs text-[#171614] dark:text-[#F3F0EA] focus:border-[#D94E28] focus:outline-none"
            >
              {voiceList.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Track B */}
        <div className="rounded-lg bg-[#F6F4EF] dark:bg-[#141210] p-3 space-y-2">
          <div className="text-xs font-bold text-[#171614] dark:text-[#F3F0EA]">
            {isAr ? 'المتحدث الثاني (المسار ب)' : 'Speaker 2 (Track B)'}
          </div>
          <div className="space-y-2">
            <input
              type="text"
              value={speakerBName}
              onChange={(e) => setSpeakerBName(e.target.value)}
              placeholder={isAr ? 'اسم المتحدث' : 'Speaker Name'}
              className="w-full rounded-md border border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1A1816] px-2.5 py-1.5 text-xs text-[#171614] dark:text-[#F3F0EA] focus:border-[#D94E28] focus:outline-none"
            />
            <select
              value={speakerBVoice}
              onChange={(e) => setSpeakerBVoice(e.target.value)}
              className="w-full rounded-md border border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1A1816] px-2.5 py-1.5 text-xs text-[#171614] dark:text-[#F3F0EA] focus:border-[#D94E28] focus:outline-none"
            >
              {voiceList.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Shared Dialect / Accent */}
        <div className="rounded-lg bg-[#F6F4EF] dark:bg-[#141210] p-3 space-y-2">
          <div className="text-xs font-bold text-[#15803D] dark:text-emerald-400">
            {isAr ? 'اللهجة أو اللكنة للحوار' : 'Dialogue Accent / Dialect'}
          </div>
          <select
            value={dialogueDialect}
            onChange={(e) => setDialogueDialect(e.target.value)}
            className="w-full rounded-md border border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1A1816] px-2.5 py-1.5 text-xs text-[#171614] dark:text-[#F3F0EA] focus:border-[#15803D] focus:outline-none"
          >
            {dialects.map((d) => (
              <option key={d.id} value={d.id}>
                {d.flag} {isAr ? d.nameAr : d.nameEn}
              </option>
            ))}
            <option value="custom">
              {isAr ? 'لهجة مخصصة (Custom)...' : 'Custom Accent...'}
            </option>
          </select>
          {dialogueDialect === 'custom' && (
            <input
              type="text"
              value={customDialectText}
              onChange={(e) => setCustomDialectText(e.target.value)}
              placeholder={isAr ? 'اكتب اللهجة المطلوبة...' : 'Describe custom accent...'}
              className="w-full rounded-md border border-[#15803D]/50 bg-white dark:bg-[#1A1816] px-2.5 py-1.5 text-xs text-[#171614] dark:text-[#F3F0EA] focus:outline-none"
            />
          )}
        </div>
      </div>

      {/* Expressive Vocal Tags Bar */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-[#F6F4EF] dark:bg-[#141210] px-3 py-2">
        <span className="flex items-center gap-1 text-[11px] font-semibold text-[#D94E28] dark:text-[#EE6A43] me-1">
          <Sparkles className="h-3 w-3" />
          <span>{isAr ? 'إدراج تفاعل في السطر المحدد:' : 'Insert Vocal Cue:'}</span>
        </span>
        {EXPRESSIVE_CUES.map((cue) => (
          <button
            key={cue.tag}
            type="button"
            onClick={() => insertCueIntoActiveLine(cue.tag)}
            title={isAr ? cue.descAr : cue.descEn}
            className="rounded border border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1A1816] hover:border-[#D94E28] hover:text-[#D94E28] dark:hover:text-[#EE6A43] px-2 py-0.5 text-[11px] font-mono text-[#5F5B53] dark:text-[#A39D93] transition-colors"
          >
            {cue.tag} · {isAr ? cue.labelAr : cue.labelEn}
          </button>
        ))}
      </div>

      {/* Script Lines List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-[#5F5B53] dark:text-[#968F84]">
          <span className="font-bold text-[#171614] dark:text-[#F3F0EA]">
            {isAr ? 'تسلسل الحوار' : 'Dialogue Sequence'}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => addLine(speakerAName)}
              className="flex items-center gap-1 rounded-md border border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#22201C] px-2.5 py-1 text-xs font-medium text-[#171614] dark:text-[#F3F0EA] hover:bg-[#EDEAE2] dark:hover:bg-[#2C2924] transition-colors"
            >
              <Plus className="h-3 w-3 text-[#D94E28] dark:text-[#EE6A43]" />
              <span>+{speakerAName}</span>
            </button>
            <button
              type="button"
              onClick={() => addLine(speakerBName)}
              className="flex items-center gap-1 rounded-md border border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#22201C] px-2.5 py-1 text-xs font-medium text-[#171614] dark:text-[#F3F0EA] hover:bg-[#EDEAE2] dark:hover:bg-[#2C2924] transition-colors"
            >
              <Plus className="h-3 w-3" />
              <span>+{speakerBName}</span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {lines.map((line, idx) => {
            const isSpeakerA = line.speaker === speakerAName;
            const isFocused = focusedLineId === line.id;
            return (
              <div
                key={line.id}
                onClick={() => setFocusedLineId(line.id)}
                className={`flex gap-2.5 rounded-lg border p-3 items-start transition-colors ${
                  isFocused
                    ? 'border-[#D94E28] bg-[#FDF1EC]/50 dark:bg-[#261A15]/60'
                    : 'border-[#DED9CE] dark:border-[#2A2723] bg-[#FBF9F5] dark:bg-[#151311]'
                }`}
              >
                <div className="flex flex-col items-center gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      updateLineSpeaker(line.id, isSpeakerA ? speakerBName : speakerAName)
                    }
                    className={`px-2 py-0.5 text-xs font-bold rounded border transition-colors ${
                      isSpeakerA
                        ? 'border-[#D94E28]/50 bg-[#FDF1EC] dark:bg-[#261A15] text-[#D94E28] dark:text-[#EE6A43]'
                        : 'border-[#DED9CE] dark:border-[#2A2723] bg-[#EDEAE2] dark:bg-[#22201C] text-[#171614] dark:text-[#F3F0EA]'
                    }`}
                    title={isAr ? 'انقر لتبديل المتحدث' : 'Click to switch speaker'}
                  >
                    {line.speaker}
                  </button>
                  <span className="text-[10px] font-mono tabular-nums text-[#5F5B53] dark:text-[#968F84]">
                    #{idx + 1}
                  </span>
                </div>

                <div className="flex-1 space-y-1.5">
                  <textarea
                    rows={2}
                    value={line.text}
                    onFocus={() => setFocusedLineId(line.id)}
                    onChange={(e) => updateLineText(line.id, e.target.value)}
                    placeholder={
                      isAr
                        ? `اكتب جملة ${line.speaker}...`
                        : `Enter line for ${line.speaker}...`
                    }
                    className="w-full resize-none rounded-md border border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1A1816] p-2 text-xs text-[#171614] dark:text-[#F3F0EA] placeholder-[#8C857B] dark:placeholder-[#5E584F] focus:border-[#D94E28] focus:outline-none"
                  />
                  <input
                    type="text"
                    value={line.style}
                    onChange={(e) => updateLineStyle(line.id, e.target.value)}
                    placeholder={isAr ? 'تون هذا السطر (مثلاً: ضاحك، همس، غاضب)...' : 'Line tone/emotion...'}
                    className="w-full rounded-md border border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#121110] px-2 py-1 text-[11px] text-[#5F5B53] dark:text-[#A39D93] placeholder-[#8C857B] dark:placeholder-[#5E584F] focus:border-[#D94E28] focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeLine(line.id)}
                  disabled={lines.length <= 1}
                  className="text-[#5F5B53] dark:text-[#968F84] hover:text-red-600 dark:hover:text-red-400 p-1 transition-colors disabled:opacity-20"
                  title={isAr ? 'حذف السطر' : 'Delete line'}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Target Voice Duration Control */}
      <DurationControlBar
        language={language}
        enabled={targetDurationEnabled}
        onToggleEnabled={onToggleTargetDuration}
        targetSeconds={targetDurationSeconds}
        onTargetSecondsChange={onTargetDurationSecondsChange}
        estimatedSeconds={estimatedDialogueSeconds}
        durationNotice={durationNotice}
        onDismissNotice={onDismissDurationNotice}
      />

      {/* Generate Action Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading || lines.every((l) => !l.text.trim())}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#D94E28] hover:bg-[#C2411D] p-3.5 text-sm font-bold text-white transition-colors active:scale-95 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin text-white" />
            <span>{isAr ? 'جارِ معالجة وتوليد الحوار الصوتي...' : 'Synthesizing Dialogue Take...'}</span>
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4" />
            <span>
              {targetDurationEnabled
                ? isAr
                  ? `توليد الحوار الكامل (${targetDurationSeconds} ثانية)`
                  : `Generate Dialogue Master (${targetDurationSeconds}s)`
                : isAr
                ? 'توليد الحوار الكامل (Master Dialogue WAV)'
                : 'Generate Dialogue Master (WAV)'}
            </span>
          </>
        )}
      </button>
    </div>
  );
};
