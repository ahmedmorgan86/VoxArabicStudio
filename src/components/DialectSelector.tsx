import React, { useMemo, useState } from 'react';
import { ARABIC_DIALECTS, ENGLISH_DIALECTS } from '../data/voicesAndDialects';
import { DialectRegionGroup, Language } from '../types';
import { Globe2, RefreshCw, Wand2, Check, SlidersHorizontal } from 'lucide-react';

interface DialectSelectorProps {
  language: Language;
  selectedDialect: string;
  onSelectDialect: (dialectId: string) => void;
  customDialect: string;
  onCustomDialectChange: (val: string) => void;
  onConvertDialectText?: (targetDialectId: string) => void;
  isConvertingDialect?: boolean;
  embedded?: boolean;
}

export const DialectSelector: React.FC<DialectSelectorProps> = ({
  language,
  selectedDialect,
  onSelectDialect,
  customDialect,
  onCustomDialectChange,
  onConvertDialectText,
  isConvertingDialect = false,
  embedded = false,
}) => {
  const isAr = language === 'ar';
  const dialects = isAr ? ARABIC_DIALECTS : ENGLISH_DIALECTS;

  const [regionFilter, setRegionFilter] = useState<'all' | DialectRegionGroup | 'custom'>('all');

  const arTabs: Array<{ id: 'all' | DialectRegionGroup | 'custom'; label: string }> = [
    { id: 'all', label: 'الكل (18)' },
    { id: 'standard', label: 'الفصحى' },
    { id: 'egypt_sudan', label: 'مصر والسودان' },
    { id: 'gulf', label: 'السعودية والخليج' },
    { id: 'levant_iraq', label: 'الشام والعراق' },
    { id: 'maghreb', label: 'المغرب العربي' },
    { id: 'custom', label: 'مخصص' },
  ];

  const enTabs: Array<{ id: 'all' | DialectRegionGroup | 'custom'; label: string }> = [
    { id: 'all', label: 'All (10)' },
    { id: 'en_americas', label: 'Americas' },
    { id: 'en_uk_ireland', label: 'UK & Ireland' },
    { id: 'en_global', label: 'Global' },
    { id: 'custom', label: 'Custom' },
  ];

  const tabs = isAr ? arTabs : enTabs;

  const filteredDialects = useMemo(() => {
    if (regionFilter === 'custom') return [];
    if (regionFilter === 'all') return dialects;
    return dialects.filter((d) => d.regionGroup === regionFilter);
  }, [dialects, regionFilter]);

  const currentDialectObj = dialects.find((d) => d.id === selectedDialect);

  return (
    <div
      className={
        embedded
          ? 'space-y-3.5'
          : 'rounded-xl border border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1A1816] p-4 space-y-3.5'
      }
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDEAE2] dark:border-[#26231F] pb-3">
        <div className="flex items-center gap-2">
          <Globe2 className="h-4 w-4 text-[#D94E28] dark:text-[#EE6A43]" />
          <div>
            <h3 className="text-xs font-bold text-[#171614] dark:text-[#F3F0EA]">
              {isAr ? 'اللهجة واللكنة الإقليمية' : 'Dialect & Regional Accent'}
            </h3>
            <p className="text-[11px] text-[#5F5B53] dark:text-[#968F84] font-mono tabular-nums">
              {isAr
                ? `${ARABIC_DIALECTS.length} لهجة عربية + مخصصة`
                : `${ENGLISH_DIALECTS.length} English accents + custom`}
            </p>
          </div>
        </div>
      </div>

      {/* Region Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((tab) => {
          const isActive =
            tab.id === 'custom'
              ? regionFilter === 'custom' || selectedDialect === 'custom'
              : regionFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setRegionFilter(tab.id);
                if (tab.id === 'custom') {
                  onSelectDialect('custom');
                }
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-[#FDF1EC] dark:bg-[#261A15] text-[#D94E28] dark:text-[#EE6A43] font-semibold'
                  : 'bg-[#F6F4EF] dark:bg-[#141210] text-[#5F5B53] dark:text-[#968F84] hover:text-[#171614] dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Custom Dialect / Accent Input */}
      {(regionFilter === 'custom' || selectedDialect === 'custom') && (
        <div className="rounded-lg bg-[#FDF1EC] dark:bg-[#261A15] p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#171614] dark:text-[#F3F0EA] flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#D94E28] dark:text-[#EE6A43]" />
              {isAr ? 'وصف اللهجة أو اللكنة المخصصة' : 'Custom Dialect / Accent'}
            </span>
          </div>
          <input
            type="text"
            value={customDialect}
            onChange={(e) => {
              onSelectDialect('custom');
              onCustomDialectChange(e.target.value);
            }}
            placeholder={
              isAr
                ? 'مثال: لهجة أهل الإسكندرية، أو لهجة جنوب العراق، أو عربي بلكنة فرنسية...'
                : 'e.g. New York Brooklyn accent, French-accented English...'
            }
            className="w-full rounded-md border border-[#DED9CE] dark:border-[#3B352E] bg-white dark:bg-[#121110] px-3 py-2 text-xs text-[#171614] dark:text-[#F3F0EA] placeholder-[#7A746A] focus:border-[#D94E28] focus:outline-none"
          />
        </div>
      )}

      {/* Dialect Cards Grid */}
      {filteredDialects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pe-1">
          {filteredDialects.map((d) => {
            const isSelected = selectedDialect === d.id;

            return (
              <div
                key={d.id}
                onClick={() => onSelectDialect(d.id)}
                className={`group flex items-start gap-2.5 rounded-lg border p-2.5 cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-[#D94E28] bg-[#FDF1EC] dark:bg-[#261A15]'
                    : 'border-transparent bg-[#F6F4EF] dark:bg-[#141210] hover:bg-[#EDEAE2] dark:hover:bg-[#1F1C19]'
                }`}
              >
                <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
                  <span className="text-lg leading-none" role="img" aria-label={d.nameEn}>
                    {d.flag}
                  </span>
                  <div
                    className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border transition-colors ${
                      isSelected
                        ? 'border-[#D94E28] bg-[#D94E28] text-white'
                        : 'border-[#C4BEB2] dark:border-[#423D36] bg-white dark:bg-[#1A1816]'
                    }`}
                  >
                    {isSelected && <Check className="h-2 w-2 stroke-[3]" />}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-bold text-xs text-[#171614] dark:text-[#F3F0EA] truncate">
                    {isAr ? d.nameAr : d.nameEn}
                  </div>
                  <p className="text-[11px] text-[#D94E28] dark:text-[#EE6A43] leading-tight mt-0.5 line-clamp-1">
                    {isAr ? d.cadenceAr : d.cadenceEn}
                  </p>
                  <p className="text-[10px] text-[#5F5B53] dark:text-[#968F84] font-mono mt-0.5 truncate">
                    {isAr ? d.regionAr : d.regionEn}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialect Script Adaptation Bar */}
      {onConvertDialectText && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-[#EDEAE2] dark:border-[#26231F] pt-3">
          <div className="flex items-center gap-2 text-xs min-w-0">
            <span className="text-[#5F5B53] dark:text-[#968F84] whitespace-nowrap">
              {isAr ? 'اللهجة:' : 'Dialect:'}
            </span>
            <span className="font-bold text-[#171614] dark:text-[#F3F0EA] truncate">
              {selectedDialect === 'custom'
                ? customDialect.trim() || (isAr ? 'لهجة مخصصة' : 'Custom Accent')
                : currentDialectObj
                ? `${currentDialectObj.flag} ${isAr ? currentDialectObj.nameAr : currentDialectObj.nameEn}`
                : selectedDialect}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onConvertDialectText(selectedDialect)}
            disabled={isConvertingDialect || (selectedDialect === 'custom' && !customDialect.trim())}
            className="flex items-center justify-center gap-1.5 rounded-md bg-[#171614] dark:bg-[#F3F0EA] hover:bg-[#2D2A26] dark:hover:bg-white px-3 py-1.5 text-xs font-semibold text-white dark:text-[#171614] transition-colors active:scale-95 disabled:opacity-50 whitespace-nowrap"
          >
            {isConvertingDialect ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>{isAr ? 'جارِ التحويل...' : 'Adapting...'}</span>
              </>
            ) : (
              <>
                <Wand2 className="h-3.5 w-3.5 text-[#EE6A43] dark:text-[#D94E28]" />
                <span>{isAr ? 'تحويل النص لهذه اللهجة' : 'Adapt Script'}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
