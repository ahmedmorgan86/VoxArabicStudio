import React from 'react';
import { VOCAL_STYLES } from '../data/voicesAndDialects';
import { Language } from '../types';

interface StyleSelectorProps {
  selectedStyleId: string;
  onSelectStyle: (styleId: string) => void;
  language: Language;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  selectedStyleId,
  onSelectStyle,
  language,
}) => {
  const isAr = language === 'ar';

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
          {isAr ? 'نمط الأداء والمشاعر (Vocal Tone)' : 'Performance Style'}
        </label>
        <span className="text-[11px] text-slate-400">
          {isAr ? 'يتحكم في نبرة الصوت والإيقاع' : 'Controls cadence and emotional weight'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {VOCAL_STYLES.map((style) => {
          const isSelected = selectedStyleId === style.id;
          return (
            <button
              key={style.id}
              onClick={() => onSelectStyle(style.id)}
              className={`flex flex-col items-center justify-center rounded-lg border p-3 text-center transition-colors ${
                isSelected
                  ? 'border-emerald-500 bg-[#0a1a15] text-white ring-1 ring-emerald-500/30'
                  : 'border-slate-800 bg-[#0b0f19] text-slate-300 hover:border-slate-700 hover:bg-[#0e1422]'
              }`}
            >
              <span className="text-xl mb-1">{style.icon}</span>
              <span className="text-xs font-semibold text-slate-200 line-clamp-1">
                {isAr ? style.nameAr : style.nameEn}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
