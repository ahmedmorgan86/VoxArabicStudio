import React, { useState } from 'react';
import { VOICES } from '../data/voicesAndDialects';
import { Language, VoiceName } from '../types';
import { Play, Square, Check, Radio } from 'lucide-react';

interface VoiceSelectorProps {
  selectedVoice: VoiceName;
  onSelectVoice: (voice: VoiceName) => void;
  onAuditionVoice?: (voice: VoiceName) => void;
  auditioningVoice?: VoiceName | null;
  language: Language;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoice,
  onSelectVoice,
  onAuditionVoice,
  auditioningVoice,
  language,
}) => {
  const isAr = language === 'ar';
  const [filterGender, setFilterGender] = useState<'all' | 'female' | 'male'>('all');

  const filteredVoices = VOICES.filter((v) => {
    if (filterGender === 'all') return true;
    return v.gender === filterGender;
  });

  // Additional voice vocal profile data for rich casting presentation
  const voiceProfiles: Record<
    VoiceName,
    {
      timbreAr: string;
      timbreEn: string;
      bestForAr: string;
      bestForEn: string;
      accentHue: string;
      waveHeights: number[];
    }
  > = {
    Kore: {
      timbreAr: 'سوبرانو دافئ ورخيم',
      timbreEn: 'Warm Melodious Soprano',
      bestForAr: 'البودكاست، الإعلانات، والكتب الصوتية',
      bestForEn: 'Podcasts, Narration & Luxury Promos',
      accentHue: 'from-pink-500/20 to-purple-500/10 border-pink-500/40 text-pink-300',
      waveHeights: [30, 65, 45, 80, 60, 40, 75, 50],
    },
    Puck: {
      timbreAr: 'تينور شبابي وحيوي',
      timbreEn: 'Dynamic Youthful Tenor',
      bestForAr: 'إعلانات السوشيال ميديا والمحتوى التقني',
      bestForEn: 'Tech Reviews, Upbeat Commercials & Social',
      accentHue: 'from-amber-500/20 to-orange-500/10 border-amber-500/40 text-amber-300',
      waveHeights: [45, 85, 70, 95, 60, 85, 40, 65],
    },
    Charon: {
      timbreAr: 'باريتون عميق وسينمائي',
      timbreEn: 'Resonant Deep Baritone',
      bestForAr: 'الأفلام الوثائقية والبروموهات الفخمة',
      bestForEn: 'Documentaries, Movie Trailers & Epic Recitals',
      accentHue: 'from-blue-500/20 to-indigo-500/10 border-blue-500/40 text-blue-300',
      waveHeights: [80, 90, 75, 60, 85, 70, 55, 40],
    },
    Fenrir: {
      timbreAr: 'طبقة قوية درامية وملحمية',
      timbreEn: 'Commanding Narrative Baritone',
      bestForAr: 'روايات الأكشن، القصص، والمشاهد التمثيلية',
      bestForEn: 'Audiobooks, Dramatic Screenplays & Games',
      accentHue: 'from-purple-500/20 to-violet-500/10 border-purple-500/40 text-purple-300',
      waveHeights: [60, 75, 95, 85, 70, 90, 65, 50],
    },
    Zephyr: {
      timbreAr: 'نبرة رقيقة هادئة وتأملية',
      timbreEn: 'Airy Gentle & Meditative',
      bestForAr: 'التأمل، جلسات الاسترخاء، والقصص الشاعرية',
      bestForEn: 'Mindfulness, Sleep Stories & ASMR',
      accentHue: 'from-teal-500/20 to-cyan-500/10 border-teal-500/40 text-teal-300',
      waveHeights: [25, 40, 35, 55, 45, 30, 50, 35],
    },
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-[#090d16] p-4 space-y-3.5 shadow-sm">
      {/* Header with Title and Gender Filter Segmented Control */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-cyan-400" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {isAr ? 'طاقم الأصوات العصبية' : 'Neural Voice Cast'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {isAr ? 'اختر الشخصية الصوتية واستمع لعينتها الحية' : 'Select persona & audition live sample'}
            </p>
          </div>
        </div>

        {/* Filter Tabs (All / Female / Male) */}
        <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setFilterGender('all')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              filterGender === 'all'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isAr ? 'الكل' : 'All'}
          </button>
          <button
            type="button"
            onClick={() => setFilterGender('female')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              filterGender === 'female'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isAr ? 'نسائي' : 'Female'}
          </button>
          <button
            type="button"
            onClick={() => setFilterGender('male')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              filterGender === 'male'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {isAr ? 'رجالي' : 'Male'}
          </button>
        </div>
      </div>

      {/* Voice Cast List */}
      <div className="space-y-2">
        {filteredVoices.map((v) => {
          const isSelected = selectedVoice === v.id;
          const isAuditioning = auditioningVoice === v.id;
          const profile = voiceProfiles[v.id];

          return (
            <div
              key={v.id}
              onClick={() => onSelectVoice(v.id)}
              className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                isSelected
                  ? 'border-cyan-500 bg-[#0e172a] shadow-sm ring-1 ring-cyan-500/20'
                  : 'border-slate-800/90 bg-[#0b0f19] hover:border-slate-700 hover:bg-[#0f1524]'
              }`}
            >
              {/* Left Details Block */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* Voice Selection Radio Circle */}
                <div className="pt-0.5 flex-shrink-0">
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-400 text-slate-950'
                        : 'border-slate-700 bg-slate-900 group-hover:border-slate-600'
                    }`}
                  >
                    {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                  </div>
                </div>

                {/* Voice Information */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-slate-100 group-hover:text-cyan-300 transition-colors">
                      {isAr ? v.nameAr : v.nameEn}
                    </span>
                    <span className="text-slate-600" aria-hidden="true">·</span>
                    <span className="text-xs font-medium text-cyan-400/90">
                      {isAr ? profile.timbreAr : profile.timbreEn}
                    </span>
                    <span className="text-slate-600" aria-hidden="true">·</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {v.gender === 'female' ? (isAr ? 'أنثى' : 'Female') : isAr ? 'ذكر' : 'Male'}
                    </span>
                  </div>

                  {/* Best For / Usages */}
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400 line-clamp-1">
                    <span className="text-slate-400">{isAr ? 'الأنسب لـ:' : 'Best for:'}</span>
                    <span className="text-slate-300">{isAr ? profile.bestForAr : profile.bestForEn}</span>
                  </div>
                </div>
              </div>

              {/* Right: Audio Waveform graphic & Audition Button */}
              <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 pt-2 sm:pt-0 border-t border-slate-800/60 sm:border-t-0">
                {/* Mini Visualizer Silhouette */}
                <div className="flex items-center gap-[2px] h-5 w-16 px-1 justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                  {profile.waveHeights.map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${isAuditioning ? Math.min(100, h * 1.2) : h}%` }}
                      className={`w-[2px] rounded-full transition-all duration-150 ${
                        isAuditioning
                          ? 'bg-amber-400 animate-pulse'
                          : isSelected
                          ? 'bg-cyan-400'
                          : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>

                {/* Audition Play/Stop Trigger */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onAuditionVoice) onAuditionVoice(v.id);
                  }}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                    isAuditioning
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                      : 'border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                  title={isAr ? 'الاستماع لعينة هذا الصوت' : 'Audition voice sample'}
                >
                  {isAuditioning ? (
                    <>
                      <Square className="h-3 w-3 fill-current" />
                      <span>{isAr ? 'إيقاف' : 'Stop'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 fill-current" />
                      <span>{isAr ? 'استماع' : 'Audition'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
