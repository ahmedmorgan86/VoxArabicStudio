import React, { useState } from 'react';
import { Language, VoiceName } from '../types';
import { VOICES } from '../data/voicesAndDialects';
import { Plus, Trash2, Users, RefreshCw, Wand2 } from 'lucide-react';

interface DialogueStudioProps {
  language: Language;
  onGenerateDialogue: (payload: {
    dialogueLines: Array<{ speaker: string; text: string; style?: string }>;
    speakerAVoice: VoiceName;
    speakerBVoice: VoiceName;
    speakerAName: string;
    speakerBName: string;
  }) => void;
  isLoading: boolean;
}

export const DialogueStudio: React.FC<DialogueStudioProps> = ({
  language,
  onGenerateDialogue,
  isLoading,
}) => {
  const isAr = language === 'ar';

  const [speakerAName, setSpeakerAName] = useState(isAr ? 'خالد' : 'Alex');
  const [speakerBName, setSpeakerBName] = useState(isAr ? 'سارة' : 'Sarah');
  const [speakerAVoice, setSpeakerAVoice] = useState<VoiceName>('Puck');
  const [speakerBVoice, setSpeakerBVoice] = useState<VoiceName>('Kore');

  const [lines, setLines] = useState<Array<{ id: string; speaker: string; text: string; style: string }>>([
    {
      id: '1',
      speaker: isAr ? 'خالد' : 'Alex',
      text: isAr
        ? 'أهلاً يا سارة! اليوم عندنا موضوع مهم جداً عن أحدث تقنيات تحويل النص إلى صوت.'
        : 'Hey Sarah! Today we have a fascinating breakdown of next-generation speech models.',
      style: isAr ? 'حماسي وودود' : 'Enthusiastic and friendly',
    },
    {
      id: '2',
      speaker: isAr ? 'سارة' : 'Sarah',
      text: isAr
        ? 'أهلاً خالد! فعلاً التطور في الصوت الطبيعي واللهجات العربية بقى مبهر وأشبه بالسحر.'
        : 'Hi Alex! The nuance and natural human cadence in modern TTS is truly incredible.',
      style: isAr ? 'نبرة هادئة ومتحمسة' : 'Warm and intrigued',
    },
    {
      id: '3',
      speaker: isAr ? 'خالد' : 'Alex',
      text: isAr
        ? 'المميز إنك تقدر تختار أي لهجة ونمط مشاعر، والصوت بيطلع نقي وبدقة عالية جداً!'
        : 'What blows my mind is the emotional depth and dialect fidelity we can achieve instantly!',
      style: isAr ? 'متحمس ومؤكد' : 'Excited and affirmative',
    },
  ]);

  const loadScenario = (type: 'podcast' | 'interview' | 'promo') => {
    if (type === 'podcast') {
      const spkA = isAr ? 'خالد' : 'Alex';
      const spkB = isAr ? 'سارة' : 'Sarah';
      setSpeakerAName(spkA);
      setSpeakerBName(spkB);
      setSpeakerAVoice('Puck');
      setSpeakerBVoice('Kore');
      setLines([
        {
          id: '1',
          speaker: spkA,
          text: isAr
            ? 'مرحباً بمستمعينا الكرام في حلقة جديدة من بودكاست المستقبل الرقمي!'
            : 'Welcome back listeners to a brand new episode of the Digital Future podcast!',
          style: 'Enthusiastic podcast intro',
        },
        {
          id: '2',
          speaker: spkB,
          text: isAr
            ? 'يا هلا خالد! موضوع اليوم عن استوديوهات الذكاء الاصطناعي وكيف أصبحت تصنع أصواتاً بشرية تحاكي الواقع بدقة.'
            : 'Hey Alex! Today is all about modern AI voice studios and human-like speech synthesis.',
          style: 'Intrigued and conversational',
        },
        {
          id: '3',
          speaker: spkA,
          text: isAr
            ? 'بالتأكيد! دقة النطق 24kHz وتعدد اللهجات جعلت التجربة خارقة للعادة.'
            : 'Absolutely! The 24kHz fidelity and dialect control are game changers.',
          style: 'Energetic wrap-up',
        },
      ]);
    } else if (type === 'interview') {
      const spkA = isAr ? 'المذيع' : 'Anchor';
      const spkB = isAr ? 'الخبير' : 'Expert';
      setSpeakerAName(spkA);
      setSpeakerBName(spkB);
      setSpeakerAVoice('Charon');
      setSpeakerBVoice('Kore');
      setLines([
        {
          id: '1',
          speaker: spkA,
          text: isAr
            ? 'أهلاً بكم في لقاء خاص. نسعد باستضافة الدكتورة سارة للحديث حول أفق التقنية الصوتية.'
            : 'Good evening. Tonight we are joined by Dr. Sarah to discuss advances in neural voice modeling.',
          style: 'Authoritative news anchor',
        },
        {
          id: '2',
          speaker: spkB,
          text: isAr
            ? 'شكراً لك، يسعدني التواجد معكم. ما نشهده اليوم يمثل نقلة نوعية في معالجة الإشارات الصوتية واللغة العربية.'
            : 'Thank you. It is a pleasure to be here. What we are witnessing is a paradigm shift.',
          style: 'Articulate academic expert',
        },
      ]);
    } else {
      const spkA = isAr ? 'عمر' : 'Mark';
      const spkB = isAr ? 'ليلى' : 'Maya';
      setSpeakerAName(spkA);
      setSpeakerBName(spkB);
      setSpeakerAVoice('Puck');
      setSpeakerBVoice('Zephyr');
      setLines([
        {
          id: '1',
          speaker: spkA,
          text: isAr
            ? 'سمعت عن استوديو VoxArabic الجديد؟'
            : 'Have you checked out the new VoxArabic AI studio?',
          style: 'Casual exciting prompt',
        },
        {
          id: '2',
          speaker: spkB,
          text: isAr
            ? 'أيوه طبعاً! جربت أحول نص باللهجة المصرية والنتيجة كانت ممتازة جداً!'
            : 'Yes! The accent accuracy and emotional warmth are stunning!',
          style: 'Warm and friendly',
        },
      ]);
    }
  };

  const addLine = (speaker: string) => {
    setLines([
      ...lines,
      {
        id: Math.random().toString(),
        speaker,
        text: '',
        style: isAr ? 'طبيعي وحواري' : 'Natural conversational',
      },
    ]);
  };

  const removeLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((l) => l.id !== id));
  };

  const updateLineText = (id: string, text: string) => {
    setLines(lines.map((l) => (l.id === id ? { ...l, text } : l)));
  };

  const updateLineSpeaker = (id: string, speaker: string) => {
    setLines(lines.map((l) => (l.id === id ? { ...l, speaker } : l)));
  };

  const handleSubmit = () => {
    const validLines = lines.filter((l) => l.text.trim().length > 0);
    if (validLines.length === 0) return;

    onGenerateDialogue({
      dialogueLines: validLines.map((l) => ({
        speaker: l.speaker,
        text: l.text,
        style: l.style,
      })),
      speakerAVoice,
      speakerBVoice,
      speakerAName,
      speakerBName,
    });
  };

  return (
    <div className="space-y-5 rounded-xl border border-slate-800 bg-[#090d16] p-5">
      {/* Studio Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="flex items-center gap-2 text-base font-bold text-white">
            <Users className="h-4 w-4 text-cyan-400" />
            <span>{isAr ? 'استوديو السيناريو والحوار الثنائي' : 'Dual-Speaker Dialogue Studio'}</span>
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            {isAr
              ? 'إنشاء حوار متسلسل ومتبادل بين شخصيتين بصوت ونبرة مستقلة لكل طرف'
              : 'Synthesize seamless multi-turn conversational dialogue between two distinct voices'}
          </p>
        </div>

        {/* Preset Scenarios Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => loadScenario('podcast')}
            className="rounded border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            {isAr ? 'بودكاست' : 'Podcast'}
          </button>
          <button
            onClick={() => loadScenario('interview')}
            className="rounded border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            {isAr ? 'مقابلة' : 'Interview'}
          </button>
          <button
            onClick={() => loadScenario('promo')}
            className="rounded border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            {isAr ? 'إعلان' : 'Promo'}
          </button>
        </div>
      </div>

      {/* Speaker Configs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Track 1: Speaker A */}
        <div className="rounded-lg border border-slate-800 bg-[#0b0f19] p-3 space-y-2">
          <div className="text-xs font-bold text-slate-300">
            {isAr ? 'المتحدث الأول (المسار أ)' : 'Speaker 1 (Track A)'}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                {isAr ? 'الاسم' : 'Name'}
              </label>
              <input
                type="text"
                value={speakerAName}
                onChange={(e) => setSpeakerAName(e.target.value)}
                className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                {isAr ? 'الصوت' : 'Voice'}
              </label>
              <select
                value={speakerAVoice}
                onChange={(e) => setSpeakerAVoice(e.target.value as VoiceName)}
                className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                {VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.id} ({v.gender === 'male' ? 'ذكر' : 'أنثى'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Track 2: Speaker B */}
        <div className="rounded-lg border border-slate-800 bg-[#0b0f19] p-3 space-y-2">
          <div className="text-xs font-bold text-slate-300">
            {isAr ? 'المتحدث الثاني (المسار ب)' : 'Speaker 2 (Track B)'}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                {isAr ? 'الاسم' : 'Name'}
              </label>
              <input
                type="text"
                value={speakerBName}
                onChange={(e) => setSpeakerBName(e.target.value)}
                className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                {isAr ? 'الصوت' : 'Voice'}
              </label>
              <select
                value={speakerBVoice}
                onChange={(e) => setSpeakerBVoice(e.target.value as VoiceName)}
                className="w-full rounded border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                {VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.id} ({v.gender === 'male' ? 'ذكر' : 'أنثى'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Script Lines List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-bold text-slate-300">
            {isAr ? 'تسلسل الحوار' : 'Dialogue Sequence'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => addLine(speakerAName)}
              className="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <Plus className="h-3 w-3" />
              <span>+{speakerAName}</span>
            </button>
            <button
              onClick={() => addLine(speakerBName)}
              className="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
            >
              <Plus className="h-3 w-3" />
              <span>+{speakerBName}</span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {lines.map((line, idx) => {
            const isSpeakerA = line.speaker === speakerAName;
            return (
              <div
                key={line.id}
                className="flex gap-2.5 rounded-lg border border-slate-800 bg-[#0b0f19] p-3 items-start"
              >
                <div className="flex flex-col items-center gap-1.5 pt-0.5">
                  <button
                    onClick={() =>
                      updateLineSpeaker(line.id, isSpeakerA ? speakerBName : speakerAName)
                    }
                    className={`px-2 py-0.5 text-xs font-bold rounded border transition-colors ${
                      isSpeakerA
                        ? 'border-cyan-500/50 bg-cyan-950/40 text-cyan-300'
                        : 'border-purple-500/50 bg-purple-950/40 text-purple-300'
                    }`}
                    title={isAr ? 'انقر لتبديل المتحدث' : 'Click to switch speaker'}
                  >
                    {line.speaker}
                  </button>
                  <span className="text-[10px] font-mono text-slate-400">#{idx + 1}</span>
                </div>

                <div className="flex-1">
                  <textarea
                    rows={2}
                    value={line.text}
                    onChange={(e) => updateLineText(line.id, e.target.value)}
                    placeholder={
                      isAr
                        ? `اكتب جملة ${line.speaker}...`
                        : `Enter line for ${line.speaker}...`
                    }
                    className="w-full resize-none rounded border border-slate-800/80 bg-slate-900/80 p-2 text-xs text-slate-100 placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={() => removeLine(line.id)}
                  disabled={lines.length <= 1}
                  className="text-slate-400 hover:text-red-400 p-1 transition-colors disabled:opacity-20"
                  title={isAr ? 'حذف السطر' : 'Delete line'}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Generate Action Button */}
      <button
        onClick={handleSubmit}
        disabled={isLoading || lines.every((l) => !l.text.trim())}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 p-3.5 text-sm font-bold text-slate-950 shadow-sm transition-colors active:scale-95 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin text-slate-950" />
            <span>{isAr ? 'جارِ معالجة وتوليد الحوار الصوتي...' : 'Synthesizing Dialogue Take...'}</span>
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4" />
            <span>{isAr ? 'توليد الحوار الكامل (Master Dialogue WAV)' : 'Generate Dialogue Master (WAV)'}</span>
          </>
        )}
      </button>
    </div>
  );
};
