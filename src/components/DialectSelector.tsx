import React, { useState } from 'react';
import { ARABIC_DIALECTS, ENGLISH_DIALECTS } from '../data/voicesAndDialects';
import { Language } from '../types';
import { Globe2, RefreshCw, Wand2, Check } from 'lucide-react';

interface DialectSelectorProps {
  language: Language;
  selectedDialect: string;
  onSelectDialect: (dialectId: string) => void;
  onConvertDialectText?: (targetDialectId: string) => void;
  isConvertingDialect?: boolean;
}

export const DialectSelector: React.FC<DialectSelectorProps> = ({
  language,
  selectedDialect,
  onSelectDialect,
  onConvertDialectText,
  isConvertingDialect = false,
}) => {
  const isAr = language === 'ar';
  const dialects = isAr ? ARABIC_DIALECTS : ENGLISH_DIALECTS;

  const [regionFilter, setRegionFilter] = useState<string>('all');

  // Regional grouping filter logic
  const filteredDialects = dialects.filter((d) => {
    if (regionFilter === 'all') return true;
    if (regionFilter === 'egypt_levant') {
      return d.id === 'egyptian' || d.id === 'levantine';
    }
    if (regionFilter === 'gulf_iraq') {
      return d.id === 'gulf' || d.id === 'iraqi';
    }
    if (regionFilter === 'maghreb') {
      return d.id === 'maghrebi';
    }
    if (regionFilter === 'standard') {
      return d.id === 'msa' || d.id === 'classical';
    }
    return true;
  });

  // Nuance and cadence descriptors
  const dialectCharacteristics: Record<
    string,
    {
      cadenceAr: string;
      cadenceEn: string;
      taglineAr: string;
      taglineEn: string;
    }
  > = {
    msa: {
      cadenceAr: 'مخارج حروف دقيقة وإعراب فصيح',
      cadenceEn: 'Crisp articulation & formal pronunciation',
      taglineAr: 'نشرات الأخبار، المؤتمرات، والمحتوى التعليمي',
      taglineEn: 'News broadcasts, education & corporate',
    },
    egyptian: {
      cadenceAr: 'إيقاع قاهري سريع، حافل بالعفوية وخفة الظل',
      cadenceEn: 'Warm, upbeat & spontaneous Cairo cadence',
      taglineAr: 'إعلانات السوشيال، الكوميديا، والمحتوى الجماهيري',
      taglineEn: 'Commercials, comedy & mass entertainment',
    },
    gulf: {
      cadenceAr: 'نبرة رصينة، وقورة ومحبوبة ذات نغم محلي',
      cadenceEn: 'Prestigious, authentic Saudi & Gulf rhythm',
      taglineAr: 'الإعلانات الفخمة، الترحيب، والهوية الوطنية',
      taglineEn: 'Luxury promos, hospitality & Gulf media',
    },
    levantine: {
      cadenceAr: 'نغم شامي عذب وموسيقي رقيق جداً',
      cadenceEn: 'Melodic, gentle & expressive musical cadence',
      taglineAr: 'الدبلجة، الروايات، والمشاهد العاطفية',
      taglineEn: 'Dubbing, audiobooks & dramatic prose',
    },
    maghrebi: {
      cadenceAr: 'دارجة أصيلة بنغمة تراثية وسرعة إيقاعية',
      cadenceEn: 'Distinctive North African rhythm & expressions',
      taglineAr: 'المحتوى المغاربي التراثي والتواصل المحلي',
      taglineEn: 'Moroccan/Maghrebi local communication',
    },
    iraqi: {
      cadenceAr: 'شجن عراقي أصيل بنبرة دافئة ومعبرة',
      cadenceEn: 'Deeply expressive, poetic & soulful tone',
      taglineAr: 'السرد الشجي، الشعر، والقصص التراثية',
      taglineEn: 'Soulful storytelling, poetry & folklore',
    },
    classical: {
      cadenceAr: 'أعلى درجات الفصاحة، الجزالة وضبط المخارج',
      cadenceEn: 'Strict classical eloquence & vocal mastery',
      taglineAr: 'الملاحم، الشعر الجاهلي والأندلسي، والكتب الدينية',
      taglineEn: 'Classical epics, poetry & historical works',
    },
    american: {
      cadenceAr: 'لكنة أمريكية واضحة، ديناميكية وشائعة عالمياً',
      cadenceEn: 'Standard North American clear & dynamic accent',
      taglineAr: 'التقنية، التسويق، والبودكاست العالمي',
      taglineEn: 'Tech, global marketing & modern podcasts',
    },
    british: {
      cadenceAr: 'لكنة بريطانية راقية ومتقنة (Received Pronunciation)',
      cadenceEn: 'Sophisticated & articulate British RP accent',
      taglineAr: 'الوثائقيات الفخمة، الإعلانات الراقية، والأدب',
      taglineEn: 'Documentaries, luxury brand promos & literature',
    },
    australian: {
      cadenceAr: 'نبرة أسترالية عفوية، مشرقة ومفعمة بالود',
      cadenceEn: 'Upbeat, friendly & authentic Aussie rhythm',
      taglineAr: 'المحتوى الشبابي، السفر، وأسلوب الحياة',
      taglineEn: 'Lifestyle, travel & casual entertainment',
    },
  };

  const currentDialectObj = dialects.find((d) => d.id === selectedDialect);

  return (
    <div className="rounded-xl border border-slate-800 bg-[#090d16] p-4 space-y-3.5 shadow-sm">
      {/* Top Header: Title, Subtitle and Regional Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Globe2 className="h-4 w-4 text-purple-400" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              {isAr ? 'اللهجة واللكنة الإقليمية' : 'Dialect & Regional Accent'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {isAr
                ? 'ضبط الإيقاع الصوتي ومخارج الكلمات حسب النمط الجغرافي'
                : 'Fine-tune acoustic cadence & local regional articulation'}
            </p>
          </div>
        </div>

        {/* Region Filter Tabs for Arabic */}
        {isAr && (
          <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setRegionFilter('all')}
              className={`px-2 py-1 rounded font-medium transition-colors whitespace-nowrap ${
                regionFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              الكل
            </button>
            <button
              type="button"
              onClick={() => setRegionFilter('egypt_levant')}
              className={`px-2 py-1 rounded font-medium transition-colors whitespace-nowrap ${
                regionFilter === 'egypt_levant'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              مصر والشام
            </button>
            <button
              type="button"
              onClick={() => setRegionFilter('gulf_iraq')}
              className={`px-2 py-1 rounded font-medium transition-colors whitespace-nowrap ${
                regionFilter === 'gulf_iraq'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              الخليج والعراق
            </button>
            <button
              type="button"
              onClick={() => setRegionFilter('maghreb')}
              className={`px-2 py-1 rounded font-medium transition-colors whitespace-nowrap ${
                regionFilter === 'maghreb'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              المغرب
            </button>
            <button
              type="button"
              onClick={() => setRegionFilter('standard')}
              className={`px-2 py-1 rounded font-medium transition-colors whitespace-nowrap ${
                regionFilter === 'standard'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              الفصحى
            </button>
          </div>
        )}
      </div>

      {/* Dialect Cards List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {filteredDialects.map((d) => {
          const isSelected = selectedDialect === d.id;
          const char = dialectCharacteristics[d.id] || {
            cadenceAr: d.descAr,
            cadenceEn: d.descEn,
            taglineAr: d.regionAr,
            taglineEn: d.regionEn,
          };

          return (
            <div
              key={d.id}
              onClick={() => onSelectDialect(d.id)}
              className={`group flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                isSelected
                  ? 'border-purple-500 bg-[#161129] shadow-sm ring-1 ring-purple-500/20'
                  : 'border-slate-800/90 bg-[#0b0f19] hover:border-slate-700 hover:bg-[#0f1524]'
              }`}
            >
              {/* Flag Badge & Radio State */}
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0 pt-0.5">
                <span className="text-xl" role="img" aria-label={d.nameEn}>
                  {d.flag}
                </span>
                <div
                  className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border transition-colors ${
                    isSelected
                      ? 'border-purple-400 bg-purple-400 text-slate-950'
                      : 'border-slate-700 bg-slate-900 group-hover:border-slate-600'
                  }`}
                >
                  {isSelected && <Check className="h-2 w-2 stroke-[3]" />}
                </div>
              </div>

              {/* Dialect Description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="font-bold text-xs text-slate-100 group-hover:text-purple-300 transition-colors">
                    {isAr ? d.nameAr : d.nameEn}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {isAr ? d.regionAr : d.regionEn}
                  </span>
                </div>

                <p className="text-[11px] text-purple-300/90 leading-tight">
                  {isAr ? char.cadenceAr : char.cadenceEn}
                </p>

                <p className="text-[10px] text-slate-400 line-clamp-1 mt-1">
                  {isAr ? char.taglineAr : char.taglineEn}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dedicated Dialect Script Adaptation Action Bar */}
      {onConvertDialectText && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-lg border border-purple-500/30 bg-purple-950/20 px-3.5 py-2.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">
              {isAr ? 'اللهجة المحددة للنطق:' : 'Active dialect target:'}
            </span>
            <span className="font-bold text-purple-300">
              {currentDialectObj ? `${currentDialectObj.flag} ${isAr ? currentDialectObj.nameAr : currentDialectObj.nameEn}` : selectedDialect}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onConvertDialectText(selectedDialect)}
            disabled={isConvertingDialect}
            className="flex items-center justify-center gap-1.5 rounded bg-purple-600 hover:bg-purple-500 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors active:scale-95 disabled:opacity-50"
            title={isAr ? 'إعادة صياغة النص في المحرر ليتطابق مع كلمات هذه اللهجة' : 'Rewrite script to match this dialect vocabulary'}
          >
            {isConvertingDialect ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-white" />
                <span>{isAr ? 'جارِ تحويل مفردات النص...' : 'Adapting Vocabulary...'}</span>
              </>
            ) : (
              <>
                <Wand2 className="h-3.5 w-3.5 text-purple-200" />
                <span>{isAr ? 'تحويل النص لمفردات هذه اللهجة 🪄' : 'Adapt Script to Dialect 🪄'}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
