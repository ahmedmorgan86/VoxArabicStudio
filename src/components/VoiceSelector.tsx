import React, { useEffect, useMemo, useRef, useState } from 'react';
import { VOICES, VOICE_DESIGN_TEMPLATES } from '../data/voicesAndDialects';
import {
  CustomVoicePersona,
  Language,
  VoiceAgeGroup,
  VoiceCategory,
  VoiceName,
  VoiceOption,
} from '../types';
import { extractWaveformPeaks } from '../utils/audioHelper';
import {
  Play,
  Square,
  Check,
  Radio,
  Search,
  Sparkles,
  Plus,
  Trash2,
  RefreshCw,
  ArrowLeftRight,
  GitCompareArrows,
  FileText,
  Volume2,
  AlertCircle,
} from 'lucide-react';

interface VoiceSelectorProps {
  selectedVoice: VoiceName;
  onSelectVoice: (voice: VoiceName) => void;
  onAuditionVoice?: (voice: VoiceName) => void;
  auditioningVoice?: VoiceName | null;
  customVoices: CustomVoicePersona[];
  onAddCustomVoice: (voice: CustomVoicePersona) => void;
  onDeleteCustomVoice: (id: string) => void;
  onPreviewCustomVoice?: (baseVoice: string, prompt: string) => Promise<void>;
  isPreviewingCustom?: boolean;
  language: Language;
  embedded?: boolean;
  sampleText?: string;
  selectedDialect?: string;
  customDialect?: string;
  styleInstruction?: string;
  customTonePrompt?: string;
}

interface CompareSample {
  voiceId: VoiceName;
  audioBase64: string;
  mimeType: string;
  durationSec: number;
  peaks: number[];
}

const DEFAULT_COMPARE_TEXT_AR =
  'مرحباً بكم في الاستوديو! هذه عينة قصيرة للمقارنة المباشرة بين وضوح ودفء الصوتين على نفس النص.';
const DEFAULT_COMPARE_TEXT_EN =
  'Welcome to the studio! Here is a short sample to compare clarity, warmth, and delivery side by side.';

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoice,
  onSelectVoice,
  onAuditionVoice,
  auditioningVoice,
  customVoices,
  onAddCustomVoice,
  onDeleteCustomVoice,
  onPreviewCustomVoice,
  isPreviewingCustom = false,
  language,
  embedded = false,
  sampleText,
  selectedDialect,
  customDialect,
  styleInstruction,
  customTonePrompt,
}) => {
  const isAr = language === 'ar';
  const [activeMode, setActiveMode] = useState<'library' | 'compare' | 'design'>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGender, setFilterGender] = useState<'all' | 'female' | 'male'>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | VoiceCategory>('all');

  const [designName, setDesignName] = useState('');
  const [designGender, setDesignGender] = useState<'female' | 'male'>('male');
  const [designAge, setDesignAge] = useState<VoiceAgeGroup>('adult');
  const [designBaseVoice, setDesignBaseVoice] = useState<string>('Charon');
  const [designPrompt, setDesignPrompt] = useState('');

  // A/B Comparison state
  const [compareVoiceA, setCompareVoiceA] = useState<VoiceName>(selectedVoice || 'Kore');
  const [compareVoiceB, setCompareVoiceB] = useState<VoiceName>(
    selectedVoice === 'Charon' ? 'Kore' : 'Charon'
  );
  const [compareText, setCompareText] = useState<string>(
    isAr ? DEFAULT_COMPARE_TEXT_AR : DEFAULT_COMPARE_TEXT_EN
  );
  const [isComparing, setIsComparing] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [compareResults, setCompareResults] = useState<{
    sampleA: CompareSample;
    sampleB: CompareSample;
    text: string;
  } | null>(null);
  const [playingSlot, setPlayingSlot] = useState<'A' | 'B' | null>(null);
  const [isSequentialPlaying, setIsSequentialPlaying] = useState(false);
  const [slotProgress, setSlotProgress] = useState<number>(0);

  const compareAudioRef = useRef<HTMLAudioElement | null>(null);
  const seqTimeoutRef = useRef<number | null>(null);

  // Keep default comparison sample text synced if user toggles language and hasn't customized it
  useEffect(() => {
    setCompareText((prev) => {
      if (prev === DEFAULT_COMPARE_TEXT_AR && !isAr) return DEFAULT_COMPARE_TEXT_EN;
      if (prev === DEFAULT_COMPARE_TEXT_EN && isAr) return DEFAULT_COMPARE_TEXT_AR;
      return prev;
    });
  }, [isAr]);

  const stopCompareAudio = () => {
    if (seqTimeoutRef.current !== null) {
      window.clearTimeout(seqTimeoutRef.current);
      seqTimeoutRef.current = null;
    }
    if (compareAudioRef.current) {
      compareAudioRef.current.pause();
      compareAudioRef.current.currentTime = 0;
      compareAudioRef.current.onended = null;
      compareAudioRef.current.ontimeupdate = null;
    }
    setPlayingSlot(null);
    setIsSequentialPlaying(false);
    setSlotProgress(0);
  };

  useEffect(() => {
    return () => {
      stopCompareAudio();
    };
  }, []);

  const allVoiceOptions: VoiceOption[] = useMemo(() => {
    const mappedCustom: VoiceOption[] = customVoices.map((cv) => ({
      id: cv.id,
      nameAr: cv.name,
      nameEn: cv.name,
      gender: cv.gender,
      ageGroup: cv.ageGroup,
      category: 'characters',
      timbreAr: isAr ? 'صوت مصمم مخصص' : 'Custom Designed Voice',
      timbreEn: 'Custom Designed Voice',
      bestForAr: cv.prompt,
      bestForEn: cv.prompt,
      descAr: cv.prompt,
      descEn: cv.prompt,
      waveHeights: [42, 78, 64, 88, 56, 74, 48, 66],
      isCustom: true,
      baseVoice: cv.baseVoice,
      voiceDesignPrompt: cv.prompt,
    }));
    return [...mappedCustom, ...VOICES];
  }, [customVoices, isAr]);

  const filteredVoices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allVoiceOptions.filter((v) => {
      if (filterGender !== 'all' && v.gender !== filterGender) return false;
      if (filterCategory !== 'all' && !v.isCustom && v.category !== filterCategory) return false;
      if (!q) return true;
      return (
        v.id.toLowerCase().includes(q) ||
        v.nameAr.toLowerCase().includes(q) ||
        v.nameEn.toLowerCase().includes(q) ||
        v.timbreAr.toLowerCase().includes(q) ||
        v.timbreEn.toLowerCase().includes(q) ||
        v.bestForAr.toLowerCase().includes(q) ||
        v.bestForEn.toLowerCase().includes(q)
      );
    });
  }, [allVoiceOptions, filterGender, filterCategory, searchQuery]);

  const categoryLabels: Array<{ id: 'all' | VoiceCategory; ar: string; en: string }> = [
    { id: 'all', ar: 'الكل', en: 'All' },
    { id: 'narration', ar: 'سرد وكتب', en: 'Narration' },
    { id: 'conversational', ar: 'حواري', en: 'Conversational' },
    { id: 'cinematic', ar: 'سينمائي', en: 'Cinematic' },
    { id: 'news', ar: 'إخباري', en: 'News' },
    { id: 'characters', ar: 'شخصيات', en: 'Characters' },
    { id: 'asmr', ar: 'هادئ / ASMR', en: 'Calm / ASMR' },
  ];

  const handleSaveDesignedVoice = () => {
    const cleanPrompt = designPrompt.trim();
    if (!cleanPrompt) return;
    const cleanName =
      designName.trim() ||
      (isAr ? `صوت مخصص #${customVoices.length + 1}` : `Custom Voice #${customVoices.length + 1}`);
    const newVoice: CustomVoicePersona = {
      id: `custom-${Date.now().toString(36)}`,
      name: cleanName,
      baseVoice: designBaseVoice,
      gender: designGender,
      ageGroup: designAge,
      prompt: cleanPrompt,
      createdAt: Date.now(),
    };
    onAddCustomVoice(newVoice);
    onSelectVoice(newVoice.id);
    setActiveMode('library');
    setDesignName('');
    setDesignPrompt('');
  };

  const resolveVoiceMeta = (voiceId: VoiceName) => {
    const found = allVoiceOptions.find((v) => v.id === voiceId);
    if (!found) {
      return {
        id: voiceId,
        displayName: voiceId,
        timbre: '',
        baseVoice: 'Kore',
        designPrompt: undefined as string | undefined,
      };
    }
    return {
      id: found.id,
      displayName: isAr ? found.nameAr : found.nameEn,
      timbre: isAr ? found.timbreAr : found.timbreEn,
      baseVoice: found.isCustom ? found.baseVoice || 'Kore' : found.id,
      designPrompt: found.voiceDesignPrompt,
    };
  };

  const openQuickCompareWith = (targetVoiceId: VoiceName) => {
    stopCompareAudio();
    if (targetVoiceId === selectedVoice) {
      setCompareVoiceA(selectedVoice);
      setCompareVoiceB(selectedVoice === 'Charon' ? 'Kore' : 'Charon');
    } else {
      setCompareVoiceA(selectedVoice);
      setCompareVoiceB(targetVoiceId);
    }
    setCompareResults(null);
    setCompareError(null);
    setActiveMode('compare');
  };

  const handleUseEditorExcerpt = () => {
    const clean = (sampleText || '').trim().replace(/\s+/g, ' ');
    if (!clean) return;
    if (clean.length <= 220) {
      setCompareText(clean);
      return;
    }
    const sliced = clean.slice(0, 220);
    const lastSpace = sliced.lastIndexOf(' ');
    setCompareText((lastSpace > 60 ? sliced.slice(0, lastSpace) : sliced).trim());
  };

  const handleSwapCompareVoices = () => {
    stopCompareAudio();
    setCompareVoiceA(compareVoiceB);
    setCompareVoiceB(compareVoiceA);
    if (compareResults) {
      setCompareResults({
        ...compareResults,
        sampleA: compareResults.sampleB,
        sampleB: compareResults.sampleA,
      });
    }
  };

  const handleGenerateCompareSamples = async () => {
    const trimmed = compareText.trim();
    if (!trimmed) return;
    stopCompareAudio();
    setIsComparing(true);
    setCompareError(null);

    const metaA = resolveVoiceMeta(compareVoiceA);
    const metaB = resolveVoiceMeta(compareVoiceB);

    try {
      const res = await fetch('/api/voices/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: trimmed.slice(0, 280),
          voiceA: metaA.baseVoice,
          voiceB: metaB.baseVoice,
          voiceADesignPrompt: metaA.designPrompt,
          voiceBDesignPrompt: metaB.designPrompt,
          language,
          dialect: selectedDialect || (isAr ? 'msa' : 'american'),
          customDialect: selectedDialect === 'custom' ? customDialect : undefined,
          style: styleInstruction || 'Natural and clear professional speaker',
          customTonePrompt: customTonePrompt?.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Comparison failed');
      }

      if (data.sampleA?.audioBase64 && data.sampleB?.audioBase64) {
        setCompareResults({
          text: data.text || trimmed,
          sampleA: {
            voiceId: compareVoiceA,
            audioBase64: data.sampleA.audioBase64,
            mimeType: data.sampleA.mimeType || 'audio/wav',
            durationSec: data.sampleA.durationSec || 0,
            peaks: extractWaveformPeaks(data.sampleA.audioBase64, 24),
          },
          sampleB: {
            voiceId: compareVoiceB,
            audioBase64: data.sampleB.audioBase64,
            mimeType: data.sampleB.mimeType || 'audio/wav',
            durationSec: data.sampleB.durationSec || 0,
            peaks: extractWaveformPeaks(data.sampleB.audioBase64, 24),
          },
        });
      }
    } catch (err: any) {
      setCompareError(
        err.message ||
          (isAr
            ? 'تعذر توليد عينات المقارنة. يرجى المحاولة مرة أخرى.'
            : 'Failed to generate comparison samples. Please try again.')
      );
    } finally {
      setIsComparing(false);
    }
  };

  const playCompareSlot = async (slot: 'A' | 'B', chainToB = false) => {
    if (!compareResults) return;
    if (playingSlot === slot && !chainToB) {
      stopCompareAudio();
      return;
    }

    stopCompareAudio();
    const targetSample = slot === 'A' ? compareResults.sampleA : compareResults.sampleB;
    if (!compareAudioRef.current) {
      compareAudioRef.current = new Audio();
    }

    const audio = compareAudioRef.current;
    audio.src = `data:${targetSample.mimeType};base64,${targetSample.audioBase64}`;
    setPlayingSlot(slot);
    setIsSequentialPlaying(chainToB);
    setSlotProgress(0);

    audio.ontimeupdate = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        setSlotProgress(Math.min(1, audio.currentTime / audio.duration));
      }
    };

    audio.onended = () => {
      setSlotProgress(0);
      if (chainToB && slot === 'A') {
        setPlayingSlot(null);
        seqTimeoutRef.current = window.setTimeout(() => {
          playCompareSlot('B', false);
        }, 350);
      } else {
        setPlayingSlot(null);
        setIsSequentialPlaying(false);
      }
    };

    audio.onerror = () => {
      stopCompareAudio();
    };

    try {
      await audio.play();
    } catch {
      stopCompareAudio();
    }
  };

  return (
    <div
      className={
        embedded
          ? 'space-y-3.5'
          : 'rounded-xl border border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1A1816] p-4 space-y-3.5'
      }
    >
      {/* Header + Library / Voice Design Switch */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDEAE2] dark:border-[#26231F] pb-3">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-[#D94E28] dark:text-[#EE6A43]" />
          <div>
            <h3 className="text-xs font-bold text-[#171614] dark:text-[#F3F0EA]">
              {isAr ? 'مكتبة وتصميم الأصوات' : 'Voice Library & Design'}
            </h3>
            <p className="text-[11px] text-[#5F5B53] dark:text-[#968F84] font-mono tabular-nums">
              {isAr
                ? `${VOICES.length} صوتاً قياسياً · ${customVoices.length} مخصص`
                : `${VOICES.length} voices · ${customVoices.length} custom`}
            </p>
          </div>
        </div>

        <div className="flex items-center rounded-lg bg-[#EDEAE2] dark:bg-[#121110] p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setActiveMode('library')}
            className={`px-2 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
              activeMode === 'library'
                ? 'bg-white dark:bg-[#26231F] text-[#171614] dark:text-white'
                : 'text-[#5F5B53] dark:text-[#968F84] hover:text-[#171614] dark:hover:text-white'
            }`}
          >
            {isAr ? 'المكتبة (30)' : 'Library'}
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('compare')}
            className={`flex items-center gap-1 px-2 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
              activeMode === 'compare'
                ? 'bg-[#D94E28] text-white'
                : 'text-[#5F5B53] dark:text-[#968F84] hover:text-[#171614] dark:hover:text-white'
            }`}
          >
            <GitCompareArrows className="h-3 w-3" />
            <span>{isAr ? 'مقارنة A/B' : 'Compare'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('design')}
            className={`flex items-center gap-1 px-2 py-1 rounded-md font-semibold transition-colors whitespace-nowrap ${
              activeMode === 'design'
                ? 'bg-[#D94E28] text-white'
                : 'text-[#5F5B53] dark:text-[#968F84] hover:text-[#171614] dark:hover:text-white'
            }`}
          >
            <Sparkles className="h-3 w-3" />
            <span>{isAr ? 'تصميم' : 'Design'}</span>
          </button>
        </div>
      </div>

      {activeMode === 'library' ? (
        <>
          {/* Search + Gender Row */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="h-3.5 w-3.5 text-[#7A746A] absolute top-1/2 -translate-y-1/2 start-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isAr
                    ? 'ابحث بالاسم أو الطابع (مثلاً: عميق، شبابي، إخباري)...'
                    : 'Search by name, timbre, or use case...'
                }
                className="w-full rounded-lg border border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#121110] ps-8 pe-3 py-1.5 text-xs text-[#171614] dark:text-[#F3F0EA] placeholder-[#7A746A] focus:border-[#D94E28] focus:outline-none"
              />
            </div>

            <div className="flex items-center rounded-lg bg-[#EDEAE2] dark:bg-[#121110] p-0.5 text-xs self-start">
              {(['all', 'female', 'male'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setFilterGender(g)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                    filterGender === g
                      ? 'bg-white dark:bg-[#26231F] text-[#171614] dark:text-white'
                      : 'text-[#5F5B53] dark:text-[#968F84] hover:text-[#171614] dark:hover:text-white'
                  }`}
                >
                  {g === 'all'
                    ? isAr
                      ? 'الكل'
                      : 'All'
                    : g === 'female'
                    ? isAr
                      ? 'نسائي'
                      : 'Female'
                    : isAr
                    ? 'رجالي'
                    : 'Male'}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categoryLabels.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilterCategory(cat.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors ${
                  filterCategory === cat.id
                    ? 'bg-[#FDF1EC] dark:bg-[#261A15] text-[#D94E28] dark:text-[#EE6A43] font-semibold'
                    : 'bg-[#F6F4EF] dark:bg-[#141210] text-[#5F5B53] dark:text-[#968F84] hover:text-[#171614] dark:hover:text-white'
                }`}
              >
                {isAr ? cat.ar : cat.en}
              </button>
            ))}
          </div>

          {/* Scrollable Voice Cast List */}
          <div className="divide-y divide-[#EDEAE2] dark:divide-[#26231F] border-t border-[#EDEAE2] dark:border-[#26231F] max-h-[380px] overflow-y-auto">
            {filteredVoices.map((v) => {
              const isSelected = selectedVoice === v.id;
              const isAuditioning = auditioningVoice === v.id;
              const targetAuditionId = v.isCustom ? v.baseVoice || 'Kore' : v.id;

              return (
                <div
                  key={v.id}
                  onClick={() => onSelectVoice(v.id)}
                  className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#FDF1EC] dark:bg-[#261A15]'
                      : 'hover:bg-[#F1EEE7] dark:hover:bg-[#1D1B18]'
                  }`}
                >
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <div className="pt-0.5 flex-shrink-0">
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${
                          isSelected
                            ? 'border-[#D94E28] bg-[#D94E28] text-white'
                            : 'border-[#C4BEB2] dark:border-[#423D36] bg-white dark:bg-[#1A1816]'
                        }`}
                      >
                        {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-[#171614] dark:text-[#F3F0EA]">
                          {isAr ? v.nameAr : v.nameEn}
                        </span>
                        <span className="text-[#B8B1A3] dark:text-[#4F4A42]" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-xs font-medium text-[#D94E28] dark:text-[#EE6A43]">
                          {isAr ? v.timbreAr : v.timbreEn}
                        </span>
                        <span className="text-[#B8B1A3] dark:text-[#4F4A42]" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-[11px] text-[#5F5B53] dark:text-[#968F84] font-mono">
                          {v.gender === 'female' ? (isAr ? 'أنثى' : 'F') : isAr ? 'ذكر' : 'M'}
                        </span>
                        {v.isCustom && (
                          <>
                            <span className="text-[#B8B1A3] dark:text-[#4F4A42]" aria-hidden="true">
                              ·
                            </span>
                            <span className="text-[11px] font-semibold text-[#15803D] dark:text-emerald-400">
                              {isAr ? `أساس ${v.baseVoice}` : `Base: ${v.baseVoice}`}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="mt-0.5 text-xs text-[#5F5B53] dark:text-[#968F84] line-clamp-1">
                        {isAr ? v.bestForAr : v.bestForEn}
                      </div>
                    </div>
                  </div>

                  {/* Waveform + Audition */}
                  <div className="flex items-center justify-between sm:justify-end gap-2.5 flex-shrink-0">
                    <div className="flex items-center gap-[2px] h-5 w-14 px-1 justify-center">
                      {v.waveHeights.map((h, i) => (
                        <div
                          key={i}
                          style={{ height: `${isAuditioning ? Math.min(100, h * 1.2) : h}%` }}
                          className={`w-[2px] rounded-xs transition-all duration-150 ${
                            isAuditioning || isSelected
                              ? 'bg-[#D94E28] dark:bg-[#EE6A43]'
                              : 'bg-[#CFC9BC] dark:bg-[#3A352E]'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {v.isCustom && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCustomVoice(v.id);
                          }}
                          className="rounded-md border border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1C1A17] p-1.5 text-[#5F5B53] hover:text-red-600 transition-colors"
                          title={isAr ? 'حذف الصوت المخصص' : 'Delete custom voice'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openQuickCompareWith(v.id);
                        }}
                        className="rounded-md border border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1C1A17] px-2 py-1.5 text-[11px] font-mono font-semibold text-[#5F5B53] dark:text-[#A39D93] hover:border-[#D94E28] hover:text-[#D94E28] dark:hover:text-[#EE6A43] transition-colors"
                        title={
                          isAr
                            ? `قارن ${v.nameAr} مع الصوت المحدد`
                            : `Compare ${v.nameEn} against current voice`
                        }
                      >
                        A/B
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (v.isCustom && onPreviewCustomVoice && v.voiceDesignPrompt) {
                            onPreviewCustomVoice(targetAuditionId, v.voiceDesignPrompt);
                          } else if (onAuditionVoice) {
                            onAuditionVoice(targetAuditionId);
                          }
                        }}
                        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                          isAuditioning
                            ? 'bg-[#171614] dark:bg-[#F3F0EA] text-white dark:text-[#171614]'
                            : 'border border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1C1A17] text-[#171614] dark:text-[#F3F0EA] hover:bg-[#EDEAE2] dark:hover:bg-[#282521]'
                        }`}
                      >
                        {isAuditioning ? (
                          <>
                            <Square className="h-3 w-3 fill-current" />
                            <span>{isAr ? 'إيقاف' : 'Stop'}</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 fill-current text-[#D94E28] dark:text-[#EE6A43]" />
                            <span>{isAr ? 'استماع' : 'Audition'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredVoices.length === 0 && (
              <div className="p-6 text-center text-xs text-[#5F5B53] dark:text-[#968F84]">
                {isAr
                  ? 'لا توجد أصوات مطابقة لبحثك. جرب تصميم صوت مخصص.'
                  : 'No matching voices found. Try Voice Design.'}
              </div>
            )}
          </div>
        </>
      ) : activeMode === 'compare' ? (
        /* Side-by-Side A/B Voice Comparison Tab */
        <div className="space-y-3.5">
          <p className="text-xs text-[#5F5B53] dark:text-[#A39D93] leading-relaxed">
            {isAr
              ? 'اختر صوتين وولّد عينة قصيرة لكل منهما على نفس النص للاستماع المباشر واختيار الأنسب لمشروعك.'
              : 'Pick two voices and generate short A/B samples on the exact same line to audition side by side.'}
          </p>

          {/* Voice A vs Voice B Selector Row */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-end gap-2">
            <div>
              <label className="text-[11px] font-bold text-[#D94E28] dark:text-[#EE6A43] block mb-1">
                {isAr ? 'الصوت الأول (A)' : 'Voice A'}
              </label>
              <select
                value={compareVoiceA}
                onChange={(e) => {
                  setCompareVoiceA(e.target.value);
                  setCompareResults(null);
                  stopCompareAudio();
                }}
                className="w-full rounded-lg border border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#121110] px-2.5 py-2 text-xs text-[#171614] dark:text-[#F3F0EA] focus:border-[#D94E28] focus:outline-none"
              >
                {allVoiceOptions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.isCustom ? `★ ${v.nameAr}` : `${isAr ? v.nameAr : v.nameEn} · ${isAr ? v.timbreAr : v.timbreEn}`}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleSwapCompareVoices}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#22201C] text-[#5F5B53] dark:text-[#A39D93] hover:border-[#D94E28] hover:text-[#D94E28] dark:hover:text-[#EE6A43] transition-colors self-center sm:self-end"
              title={isAr ? 'تبديل الصوتين' : 'Swap A and B'}
              aria-label={isAr ? 'تبديل الصوتين' : 'Swap voices'}
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
            </button>

            <div>
              <label className="text-[11px] font-bold text-[#171614] dark:text-[#F3F0EA] block mb-1">
                {isAr ? 'الصوت الثاني (B)' : 'Voice B'}
              </label>
              <select
                value={compareVoiceB}
                onChange={(e) => {
                  setCompareVoiceB(e.target.value);
                  setCompareResults(null);
                  stopCompareAudio();
                }}
                className="w-full rounded-lg border border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#121110] px-2.5 py-2 text-xs text-[#171614] dark:text-[#F3F0EA] focus:border-[#D94E28] focus:outline-none"
              >
                {allVoiceOptions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.isCustom ? `★ ${v.nameAr}` : `${isAr ? v.nameAr : v.nameEn} · ${isAr ? v.timbreAr : v.timbreEn}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Shared Comparison Sample Text */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[11px] font-semibold text-[#5F5B53] dark:text-[#968F84]">
                {isAr ? 'نص العينة المشترك للمقارنة' : 'Shared Comparison Sample Text'}
              </label>
              <div className="flex items-center gap-2">
                {sampleText && sampleText.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={handleUseEditorExcerpt}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#D94E28] dark:text-[#EE6A43] hover:underline"
                  >
                    <FileText className="h-3 w-3" />
                    <span>{isAr ? 'اقتباس من نص المحرر' : 'Use Editor Text'}</span>
                  </button>
                )}
                <span className="text-[10px] font-mono tabular-nums text-[#7A746A]">
                  {compareText.length}/280
                </span>
              </div>
            </div>
            <textarea
              rows={2}
              maxLength={280}
              value={compareText}
              onChange={(e) => setCompareText(e.target.value)}
              placeholder={
                isAr
                  ? 'اكتب جملة قصيرة لتجربة الصوتين عليها...'
                  : 'Enter a short line to audition both voices...'
              }
              className="w-full resize-none rounded-lg border border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#121110] p-2.5 text-xs leading-relaxed text-[#171614] dark:text-[#F3F0EA] placeholder-[#7A746A] focus:border-[#D94E28] focus:outline-none"
            />
          </div>

          {/* Generate A/B Comparison Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isComparing || !compareText.trim()}
              onClick={handleGenerateCompareSamples}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#D94E28] hover:bg-[#C2411D] px-3 py-2.5 text-xs font-bold text-white transition-colors active:scale-95 disabled:opacity-50"
            >
              {isComparing ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>
                    {isAr ? 'جارِ توليد عينتي A و B...' : 'Generating A & B Samples...'}
                  </span>
                </>
              ) : (
                <>
                  <GitCompareArrows className="h-3.5 w-3.5" />
                  <span>
                    {isAr ? 'توليد عينتي المقارنة (A & B)' : 'Generate A/B Samples'}
                  </span>
                </>
              )}
            </button>

            {compareResults && (
              <button
                type="button"
                onClick={() => {
                  if (isSequentialPlaying || playingSlot) {
                    stopCompareAudio();
                  } else {
                    playCompareSlot('A', true);
                  }
                }}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                  isSequentialPlaying
                    ? 'border-[#171614] bg-[#171614] text-white dark:border-[#F3F0EA] dark:bg-[#F3F0EA] dark:text-[#171614]'
                    : 'border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#22201C] text-[#171614] dark:text-[#F3F0EA] hover:bg-[#EDEAE2] dark:hover:bg-[#2C2924]'
                }`}
                title={isAr ? 'تشغيل الصوت أ ثم الصوت ب تلقائياً' : 'Play Voice A followed by Voice B'}
              >
                {isSequentialPlaying ? (
                  <>
                    <Square className="h-3 w-3 fill-current" />
                    <span>{isAr ? 'إيقاف' : 'Stop'}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-3.5 w-3.5 text-[#D94E28] dark:text-[#EE6A43]" />
                    <span>{isAr ? 'تشغيل A ← B' : 'Play A → B'}</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Comparison Error */}
          {compareError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-300 dark:border-red-800/70 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-[11px] text-red-800 dark:text-red-200">
              <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <span>{compareError}</span>
            </div>
          )}

          {/* Side-by-Side A/B Playback Cards */}
          {compareResults && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {(
                [
                  { slot: 'A' as const, sample: compareResults.sampleA },
                  { slot: 'B' as const, sample: compareResults.sampleB },
                ] as const
              ).map(({ slot, sample }) => {
                const meta = resolveVoiceMeta(sample.voiceId);
                const isSlotPlaying = playingSlot === slot;
                const isStudioActive = selectedVoice === sample.voiceId;

                return (
                  <div
                    key={slot}
                    className={`rounded-lg p-3 space-y-2.5 transition-colors ${
                      isSlotPlaying
                        ? 'bg-[#FDF1EC] dark:bg-[#261A15]'
                        : 'bg-[#F6F4EF] dark:bg-[#141210]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex h-5 w-5 items-center justify-center rounded font-mono text-[10px] font-bold ${
                              slot === 'A'
                                ? 'bg-[#D94E28] text-white'
                                : 'bg-[#171614] dark:bg-[#F3F0EA] text-white dark:text-[#171614]'
                            }`}
                          >
                            {slot}
                          </span>
                          <span className="font-bold text-xs text-[#171614] dark:text-[#F3F0EA] truncate">
                            {meta.displayName}
                          </span>
                        </div>
                        {meta.timbre && (
                          <div className="mt-0.5 text-[11px] text-[#5F5B53] dark:text-[#968F84] truncate">
                            {meta.timbre}
                          </div>
                        )}
                      </div>
                      <span className="font-mono tabular-nums text-[11px] font-semibold text-[#5F5B53] dark:text-[#968F84] shrink-0">
                        {isAr ? `${sample.durationSec.toFixed(1)}ث` : `${sample.durationSec.toFixed(1)}s`}
                      </span>
                    </div>

                    {/* Extracted Real Waveform Bars */}
                    <div className="flex items-center gap-[2px] h-8 px-1">
                      {sample.peaks.map((peak, idx) => {
                        const barPct = idx / sample.peaks.length;
                        const isPlayed = isSlotPlaying && barPct <= slotProgress;
                        return (
                          <div
                            key={idx}
                            style={{ height: `${Math.max(14, Math.round(peak * 100))}%` }}
                            className={`flex-1 rounded-xs transition-colors duration-100 ${
                              isPlayed
                                ? 'bg-[#D94E28] dark:bg-[#EE6A43]'
                                : isSlotPlaying
                                ? 'bg-[#D94E28]/35 dark:bg-[#EE6A43]/35'
                                : 'bg-[#CFC9BC] dark:bg-[#3A352E]'
                            }`}
                          />
                        );
                      })}
                    </div>

                    {/* Play + Adopt Voice Actions */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => playCompareSlot(slot, false)}
                        className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                          isSlotPlaying
                            ? 'bg-[#171614] dark:bg-[#F3F0EA] text-white dark:text-[#171614]'
                            : 'border border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1C1A17] text-[#171614] dark:text-[#F3F0EA] hover:bg-[#EDEAE2] dark:hover:bg-[#282521]'
                        }`}
                      >
                        {isSlotPlaying ? (
                          <>
                            <Square className="h-3 w-3 fill-current" />
                            <span>{isAr ? 'إيقاف' : 'Stop'}</span>
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3 fill-current text-[#D94E28] dark:text-[#EE6A43]" />
                            <span>{isAr ? `استماع ${slot}` : `Play ${slot}`}</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectVoice(sample.voiceId)}
                        className={`flex items-center justify-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap ${
                          isStudioActive
                            ? 'bg-[#15803D] text-white'
                            : 'border border-[#D94E28]/40 bg-[#FDF1EC] dark:bg-[#261A15] text-[#D94E28] dark:text-[#EE6A43] hover:bg-[#D94E28] hover:text-white'
                        }`}
                      >
                        <Check className="h-3 w-3" />
                        <span>
                          {isStudioActive
                            ? isAr
                              ? 'مُختار'
                              : 'Active'
                            : isAr
                            ? 'اعتماد'
                            : 'Use'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Voice Design Studio Tab */
        <div className="space-y-3">
          <p className="text-xs text-[#5F5B53] dark:text-[#A39D93] leading-relaxed">
            {isAr
              ? 'صمّم أي شخصية صوتية من الصفر — حدد العمر، البحة، الدفء، والأسلوب وسيتولى محرك Gemini 3.8 Flash TTS تجسيدها.'
              : 'Craft any custom voice persona from scratch via Gemini 3.8 Flash TTS — describe age, rasp, warmth, and energy.'}
          </p>

          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-[#5F5B53] dark:text-[#968F84]">
              {isAr ? 'قوالب سريعة:' : 'Quick Templates:'}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {VOICE_DESIGN_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    setDesignName(isAr ? tpl.nameAr : tpl.nameEn);
                    setDesignGender(tpl.gender);
                    setDesignAge(tpl.ageGroup);
                    setDesignBaseVoice(tpl.baseVoice);
                    setDesignPrompt(tpl.prompt);
                  }}
                  className="rounded-md border border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#121110] px-2.5 py-1 text-[11px] text-[#171614] dark:text-[#E5E0D5] hover:border-[#D94E28] transition-colors"
                >
                  {isAr ? tpl.nameAr : tpl.nameEn}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] text-[#5F5B53] dark:text-[#968F84] block mb-1">
                {isAr ? 'اسم الصوت المخصص' : 'Voice Name'}
              </label>
              <input
                type="text"
                value={designName}
                onChange={(e) => setDesignName(e.target.value)}
                placeholder={isAr ? 'مثال: الراوي الحكيم' : 'e.g. Wise Narrator'}
                className="w-full rounded-lg border border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#121110] px-3 py-1.5 text-xs text-[#171614] dark:text-[#F3F0EA] placeholder-[#7A746A] focus:border-[#D94E28] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-[#5F5B53] dark:text-[#968F84] block mb-1">
                {isAr ? 'البصمة الأساسية' : 'Acoustic Base'}
              </label>
              <select
                value={designBaseVoice}
                onChange={(e) => setDesignBaseVoice(e.target.value)}
                className="w-full rounded-lg border border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#121110] px-2.5 py-1.5 text-xs text-[#171614] dark:text-[#F3F0EA] focus:border-[#D94E28] focus:outline-none"
              >
                {VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.id} · {isAr ? v.timbreAr : v.timbreEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] text-[#5F5B53] dark:text-[#968F84] block mb-1">
                {isAr ? 'النوع' : 'Gender'}
              </label>
              <div className="grid grid-cols-2 rounded-lg border border-[#DED9CE] dark:border-[#2A2723] bg-[#EDEAE2] dark:bg-[#121110] p-0.5 text-xs">
                {(['female', 'male'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      setDesignGender(g);
                      setDesignBaseVoice(g === 'female' ? 'Sulafat' : 'Charon');
                    }}
                    className={`py-1 rounded-md font-medium transition-colors ${
                      designGender === g
                        ? 'bg-white dark:bg-[#26231F] text-[#171614] dark:text-white'
                        : 'text-[#5F5B53] dark:text-[#968F84]'
                    }`}
                  >
                    {g === 'female' ? (isAr ? 'أنثى' : 'Female') : isAr ? 'ذكر' : 'Male'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] text-[#5F5B53] dark:text-[#968F84] block mb-1">
                {isAr ? 'العمر' : 'Age Group'}
              </label>
              <div className="grid grid-cols-3 rounded-lg border border-[#DED9CE] dark:border-[#2A2723] bg-[#EDEAE2] dark:bg-[#121110] p-0.5 text-[11px]">
                {(['young', 'adult', 'mature'] as const).map((age) => (
                  <button
                    key={age}
                    type="button"
                    onClick={() => setDesignAge(age)}
                    className={`py-1 rounded-md font-medium transition-colors ${
                      designAge === age
                        ? 'bg-white dark:bg-[#26231F] text-[#171614] dark:text-white'
                        : 'text-[#5F5B53] dark:text-[#968F84]'
                    }`}
                  >
                    {age === 'young'
                      ? isAr
                        ? 'شاب'
                        : 'Young'
                      : age === 'adult'
                      ? isAr
                        ? 'ناضج'
                        : 'Adult'
                      : isAr
                      ? 'مسن'
                      : 'Mature'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-[#5F5B53] dark:text-[#968F84] block mb-1">
              {isAr ? 'وصف الشخصية الصوتية' : 'Voice Persona Prompt'}
            </label>
            <textarea
              rows={3}
              value={designPrompt}
              onChange={(e) => setDesignPrompt(e.target.value)}
              placeholder={
                isAr
                  ? 'مثال: صوت رجل خمسيني دافئ ذو بحة خفيفة، يتحدث بهدوء وثقة كأنه راوي أفلام وثائقية...'
                  : 'e.g. A warm, slightly gravelly 50-year-old male radio host speaking calmly with late-night confidence...'
              }
              className="w-full resize-none rounded-lg border border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#121110] p-2.5 text-xs text-[#171614] dark:text-[#F3F0EA] placeholder-[#7A746A] focus:border-[#D94E28] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {onPreviewCustomVoice && (
              <button
                type="button"
                disabled={!designPrompt.trim() || isPreviewingCustom}
                onClick={() =>
                  onPreviewCustomVoice(
                    designBaseVoice,
                    `${designGender === 'female' ? 'Female' : 'Male'} ${designAge} voice: ${designPrompt.trim()}`
                  )
                }
                className="flex items-center gap-1.5 rounded-lg border border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#22201C] hover:bg-[#EDEAE2] dark:hover:bg-[#2C2924] px-3 py-2 text-xs font-semibold text-[#171614] dark:text-[#F3F0EA] transition-colors disabled:opacity-40"
              >
                {isPreviewingCustom ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#D94E28]" />
                ) : (
                  <Play className="h-3.5 w-3.5 fill-current text-[#D94E28]" />
                )}
                <span>{isAr ? 'معاينة الصوت' : 'Preview Voice'}</span>
              </button>
            )}

            <button
              type="button"
              disabled={!designPrompt.trim()}
              onClick={handleSaveDesignedVoice}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#D94E28] hover:bg-[#C2411D] px-3 py-2 text-xs font-bold text-white transition-colors disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isAr ? 'حفظ وإضافة لمكتبتي' : 'Save & Use Voice'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
