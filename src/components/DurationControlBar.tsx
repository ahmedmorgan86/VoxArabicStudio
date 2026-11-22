import React from 'react';
import { Language } from '../types';
import { Clock, Minus, Plus, RefreshCw, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';

interface DurationControlBarProps {
  language: Language;
  enabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  targetSeconds: number;
  onTargetSecondsChange: (seconds: number) => void;
  estimatedSeconds: number;
  onFitScriptToDuration?: () => void;
  isFittingScript?: boolean;
  canFitScript?: boolean;
  durationNotice?: string | null;
  onDismissNotice?: () => void;
}

const PRESET_SECONDS = [5, 10, 15, 30, 60];

export const DurationControlBar: React.FC<DurationControlBarProps> = ({
  language,
  enabled,
  onToggleEnabled,
  targetSeconds,
  onTargetSecondsChange,
  estimatedSeconds,
  onFitScriptToDuration,
  isFittingScript = false,
  canFitScript = false,
  durationNotice,
  onDismissNotice,
}) => {
  const isAr = language === 'ar';

  const clampSeconds = (val: number) => {
    if (!Number.isFinite(val)) return 15;
    return Math.max(3, Math.min(300, Math.round(val)));
  };

  const ratio =
    enabled && targetSeconds > 0 && estimatedSeconds > 0
      ? estimatedSeconds / targetSeconds
      : 1;

  const fitStatus: 'empty' | 'ideal' | 'short' | 'long' =
    estimatedSeconds <= 0
      ? 'empty'
      : ratio > 1.28
      ? 'long'
      : ratio < 0.74
      ? 'short'
      : 'ideal';

  const progressPct =
    enabled && targetSeconds > 0
      ? Math.min(100, Math.round((estimatedSeconds / targetSeconds) * 100))
      : 0;

  return (
    <div className="rounded-lg bg-[#F6F4EF] dark:bg-[#141210] p-3 space-y-2.5">
      {/* Header Row: Mode Switch + Live Estimated Duration */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-[#D94E28] dark:text-[#EE6A43]" />
          <span className="text-xs font-bold text-[#171614] dark:text-[#F3F0EA]">
            {isAr ? 'مدة الفويس قبل التوليد' : 'Target Voice Duration'}
          </span>

          {/* Auto vs Fixed Segmented Control */}
          <div className="flex items-center rounded-md bg-[#EDEAE2] dark:bg-[#1E1C19] p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => onToggleEnabled(false)}
              className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                !enabled
                  ? 'bg-white dark:bg-[#2C2924] text-[#171614] dark:text-white'
                  : 'text-[#5F5B53] dark:text-[#968F84] hover:text-[#171614] dark:hover:text-white'
              }`}
            >
              {isAr ? 'تلقائي' : 'Auto'}
            </button>
            <button
              type="button"
              onClick={() => onToggleEnabled(true)}
              className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                enabled
                  ? 'bg-[#D94E28] text-white'
                  : 'text-[#5F5B53] dark:text-[#968F84] hover:text-[#171614] dark:hover:text-white'
              }`}
            >
              {isAr ? 'مدة محددة' : 'Exact Time'}
            </button>
          </div>
        </div>

        {/* Live Estimated Script Duration Readout */}
        <div className="flex items-center gap-2 text-[11px] font-mono tabular-nums">
          <span className="text-[#5F5B53] dark:text-[#968F84]">
            {isAr ? 'التقديري للنص:' : 'Est. Script:'}{' '}
            <strong className="text-[#171614] dark:text-[#F3F0EA]">
              {estimatedSeconds > 0
                ? isAr
                  ? `~${estimatedSeconds.toFixed(1)}ث`
                  : `~${estimatedSeconds.toFixed(1)}s`
                : '0s'}
            </strong>
          </span>
          {enabled && (
            <>
              <span className="text-[#DED9CE] dark:text-[#2A2723]">|</span>
              <span className="font-bold text-[#D94E28] dark:text-[#EE6A43]">
                {isAr ? `الهدف: ${targetSeconds}ث` : `Target: ${targetSeconds}s`}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Quick Presets + Precision Seconds Stepper */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESET_SECONDS.map((sec) => {
            const isSelected = enabled && targetSeconds === sec;
            return (
              <button
                key={sec}
                type="button"
                onClick={() => {
                  onToggleEnabled(true);
                  onTargetSecondsChange(sec);
                }}
                className={`rounded-md border px-2 py-1 text-[11px] font-mono tabular-nums font-semibold transition-colors ${
                  isSelected
                    ? 'border-[#D94E28] bg-[#D94E28] text-white'
                    : 'border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1A1816] text-[#5F5B53] dark:text-[#A39D93] hover:border-[#D94E28] hover:text-[#D94E28] dark:hover:text-[#EE6A43]'
                }`}
              >
                {isAr ? `${sec}ث` : `${sec}s`}
              </button>
            );
          })}
        </div>

        {/* Numeric Seconds Input + Stepper */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              onToggleEnabled(true);
              onTargetSecondsChange(clampSeconds(targetSeconds - 1));
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1A1816] text-[#5F5B53] dark:text-[#A39D93] hover:border-[#D94E28] hover:text-[#D94E28] dark:hover:text-[#EE6A43] transition-colors"
            title={isAr ? 'تقليل ثانية' : 'Decrease 1s'}
            aria-label={isAr ? 'تقليل ثانية' : 'Decrease 1 second'}
          >
            <Minus className="h-3 w-3" />
          </button>

          <div className="relative flex items-center">
            <input
              type="number"
              min={3}
              max={300}
              step={1}
              value={targetSeconds}
              onFocus={() => {
                if (!enabled) onToggleEnabled(true);
              }}
              onChange={(e) => {
                onToggleEnabled(true);
                const val = Number(e.target.value);
                if (!Number.isNaN(val)) {
                  onTargetSecondsChange(Math.max(1, Math.min(300, Math.round(val))));
                }
              }}
              onBlur={() => onTargetSecondsChange(clampSeconds(targetSeconds))}
              className="w-16 rounded-md border border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1A1816] px-2 py-1 text-center text-xs font-mono tabular-nums font-bold text-[#171614] dark:text-[#F3F0EA] focus:border-[#D94E28] focus:outline-none"
              aria-label={isAr ? 'المدة بالثواني' : 'Target duration in seconds'}
            />
            <span className="ms-1 text-[11px] font-mono text-[#5F5B53] dark:text-[#968F84]">
              {isAr ? 'ثانية' : 'sec'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              onToggleEnabled(true);
              onTargetSecondsChange(clampSeconds(targetSeconds + 1));
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1A1816] text-[#5F5B53] dark:text-[#A39D93] hover:border-[#D94E28] hover:text-[#D94E28] dark:hover:text-[#EE6A43] transition-colors"
            title={isAr ? 'زيادة ثانية' : 'Increase 1s'}
            aria-label={isAr ? 'زيادة ثانية' : 'Increase 1 second'}
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Live Fit Meter & One-Click AI Script Adaptation (visible when Exact Time enabled) */}
      {enabled && (
        <div className="space-y-2 pt-1.5 border-t border-[#DED9CE]/70 dark:border-[#2A2723]">
          {/* Progress Bar */}
          <div className="h-1.5 w-full rounded-sm bg-[#DED9CE] dark:bg-[#2A2723] overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                fitStatus === 'ideal'
                  ? 'bg-[#15803D]'
                  : fitStatus === 'long'
                  ? 'bg-[#D94E28]'
                  : 'bg-amber-600 dark:bg-amber-500'
              }`}
              style={{ width: `${Math.max(4, progressPct)}%` }}
            />
          </div>

          {/* Fit Guidance + AI Fit Button */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px]">
              {fitStatus === 'ideal' ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#15803D] dark:text-emerald-400 shrink-0" />
                  <span className="font-medium text-[#15803D] dark:text-emerald-400">
                    {isAr
                      ? `مناسب تماماً — سيتم ضبط الإيقاع بدقة ليكون ${targetSeconds} ثانية بدون تغيير طبقة الصوت`
                      : `Great fit — pitch-preserving pacing will lock audio to ${targetSeconds}s`}
                  </span>
                </>
              ) : fitStatus === 'long' ? (
                <>
                  <AlertTriangle className="h-3.5 w-3.5 text-[#D94E28] dark:text-[#EE6A43] shrink-0" />
                  <span className="font-medium text-[#D94E28] dark:text-[#EE6A43]">
                    {isAr
                      ? `النص أطول من ${targetSeconds}ث (~${estimatedSeconds.toFixed(1)}ث) — يُنصح بتكييف النص بالذكاء الاصطناعي`
                      : `Script (~${estimatedSeconds.toFixed(1)}s) is longer than ${targetSeconds}s — adapt script for natural pacing`}
                  </span>
                </>
              ) : fitStatus === 'short' ? (
                <>
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="font-medium text-amber-700 dark:text-amber-300">
                    {isAr
                      ? `النص أقصر من ${targetSeconds}ث (~${estimatedSeconds.toFixed(1)}ث) — سيتم إبطاؤه وإضافة صمت ختامي، أو وسّع النص`
                      : `Script (~${estimatedSeconds.toFixed(1)}s) is shorter than ${targetSeconds}s — will slow & pad silence, or expand script`}
                  </span>
                </>
              ) : (
                <span className="text-[#5F5B53] dark:text-[#968F84]">
                  {isAr
                    ? 'اكتب النص لحساب المدة التقديرية ومقارنتها بالهدف'
                    : 'Enter script text to compare estimated duration against target'}
                </span>
              )}
            </div>

            {onFitScriptToDuration && (
              <button
                type="button"
                onClick={onFitScriptToDuration}
                disabled={isFittingScript || !canFitScript}
                className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-40 whitespace-nowrap ${
                  fitStatus === 'long' || fitStatus === 'short'
                    ? 'border-[#D94E28] bg-[#FDF1EC] dark:bg-[#261A15] text-[#D94E28] dark:text-[#EE6A43] hover:bg-[#D94E28] hover:text-white'
                    : 'border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1A1816] text-[#171614] dark:text-[#F3F0EA] hover:border-[#D94E28] hover:text-[#D94E28]'
                }`}
              >
                {isFittingScript ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                <span>
                  {isFittingScript
                    ? isAr
                      ? 'جارِ التكييف...'
                      : 'Fitting...'
                    : isAr
                    ? `تكييف النص لـ ${targetSeconds}ث (AI)`
                    : `Fit Script to ${targetSeconds}s (AI)`}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Post-generation non-blocking notice (e.g. max_speed_capped) */}
      {durationNotice && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-amber-300 dark:border-amber-800/70 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1.5 text-[11px] text-amber-900 dark:text-amber-200">
          <span>{durationNotice}</span>
          {onDismissNotice && (
            <button
              type="button"
              onClick={onDismissNotice}
              className="font-bold text-amber-700 dark:text-amber-300 hover:opacity-80 px-1"
              aria-label="Dismiss"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
};
