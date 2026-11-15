import React from 'react';
import { SAMPLE_SCRIPTS, ScriptSample } from '../data/voicesAndDialects';
import { Language } from '../types';
import { FileText } from 'lucide-react';

interface ScriptTemplatesProps {
  language: Language;
  onApplySample: (sample: ScriptSample) => void;
}

export const ScriptTemplates: React.FC<ScriptTemplatesProps> = ({
  language,
  onApplySample,
}) => {
  const isAr = language === 'ar';
  const filteredSamples = SAMPLE_SCRIPTS.filter((s) => s.language === language);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-[#171614] dark:text-[#F3F0EA]">
          {isAr ? 'نماذج نصوص سريعة' : 'Script Presets'}
        </h3>
        <span className="text-[11px] text-[#5F5B53] dark:text-[#968F84]">
          {isAr ? 'اختر نموذجاً لتحميله في المحرر' : 'Select a sample to load'}
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filteredSamples.map((sample) => (
          <button
            key={sample.id}
            type="button"
            onClick={() => onApplySample(sample)}
            className="flex-shrink-0 flex items-center gap-2 rounded-lg border border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1A1816] px-3 py-2 text-start transition-colors hover:border-[#D94E28] dark:hover:border-[#EE6A43] active:scale-95"
          >
            <FileText className="h-3.5 w-3.5 text-[#D94E28] dark:text-[#EE6A43] flex-shrink-0" />
            <div>
              <div className="text-xs font-semibold text-[#171614] dark:text-[#F3F0EA] whitespace-nowrap">
                {isAr ? sample.titleAr : sample.titleEn}
              </div>
              <div className="text-[10px] text-[#5F5B53] dark:text-[#968F84] font-mono">
                {isAr ? sample.categoryAr : sample.categoryEn} · {sample.recommendedVoice}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
