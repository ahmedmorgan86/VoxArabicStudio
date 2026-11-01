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
        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
          {isAr ? 'نماذج نصوص جاهزة للتجربة' : 'Preset Scripts'}
        </label>
        <span className="text-[11px] text-slate-400">
          {isAr ? 'اختر أي نص لتحميله فوراً في المحرر' : 'Select a script to load into editor'}
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filteredSamples.map((sample) => (
          <button
            key={sample.id}
            onClick={() => onApplySample(sample)}
            className="flex-shrink-0 flex items-center gap-2 rounded-lg border border-slate-800 bg-[#0b0f19] px-3 py-2 text-start transition-colors hover:border-slate-700 hover:bg-[#0e1422] active:scale-95"
          >
            <FileText className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
            <div>
              <div className="text-xs font-semibold text-slate-200">
                {isAr ? sample.titleAr : sample.titleEn}
              </div>
              <div className="text-[10px] text-slate-400">
                {isAr ? sample.categoryAr : sample.categoryEn} · {sample.recommendedVoice}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
