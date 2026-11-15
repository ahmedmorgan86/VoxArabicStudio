import React from 'react';
import { AudioEffectsConfig, Language, ReverbSpace } from '../types';
import { Sliders, Waves, Gauge, Sparkles } from 'lucide-react';

interface AudioEffectsRackProps {
  config: AudioEffectsConfig;
  onChange: (nextConfig: AudioEffectsConfig) => void;
  language: Language;
  embedded?: boolean;
}

export const AudioEffectsRack: React.FC<AudioEffectsRackProps> = ({
  config,
  onChange,
  language,
  embedded = false,
}) => {
  const isAr = language === 'ar';

  const applyPreset = (preset: 'dry' | 'podcast' | 'cinematic' | 'epic') => {
    if (preset === 'dry') {
      onChange({
        reverbEnabled: false,
        reverbMix: 0.2,
        reverbSpace: 'studio',
        compressionEnabled: false,
        compressionAmount: 45,
        warmthEnabled: false,
      });
    } else if (preset === 'podcast') {
      onChange({
        reverbEnabled: false,
        reverbMix: 0.12,
        reverbSpace: 'studio',
        compressionEnabled: true,
        compressionAmount: 60,
        warmthEnabled: true,
      });
    } else if (preset === 'cinematic') {
      onChange({
        reverbEnabled: true,
        reverbMix: 0.28,
        reverbSpace: 'hall',
        compressionEnabled: true,
        compressionAmount: 70,
        warmthEnabled: true,
      });
    } else {
      onChange({
        reverbEnabled: true,
        reverbMix: 0.45,
        reverbSpace: 'cathedral',
        compressionEnabled: true,
        compressionAmount: 80,
        warmthEnabled: true,
      });
    }
  };

  const activePreset = (() => {
    if (!config.reverbEnabled && !config.compressionEnabled && !config.warmthEnabled) {
      return 'dry';
    }
    if (
      !config.reverbEnabled &&
      config.compressionEnabled &&
      config.warmthEnabled &&
      config.compressionAmount === 60
    ) {
      return 'podcast';
    }
    if (
      config.reverbEnabled &&
      config.reverbSpace === 'hall' &&
      config.compressionEnabled &&
      config.warmthEnabled &&
      Math.abs(config.reverbMix - 0.28) < 0.02
    ) {
      return 'cinematic';
    }
    if (
      config.reverbEnabled &&
      config.reverbSpace === 'cathedral' &&
      config.compressionEnabled &&
      config.warmthEnabled &&
      Math.abs(config.reverbMix - 0.45) < 0.02
    ) {
      return 'epic';
    }
    return 'custom';
  })();

  const reverbSpaces: Array<{ id: ReverbSpace; labelAr: string; labelEn: string }> = [
    { id: 'studio', labelAr: 'غرفة استوديو', labelEn: 'Studio Room' },
    { id: 'hall', labelAr: 'قاعة واسعة', labelEn: 'Concert Hall' },
    { id: 'cathedral', labelAr: 'فضاء ملحمي', labelEn: 'Cathedral' },
  ];

  const ratioVal = (2.2 + (config.compressionAmount / 100) * 8.0).toFixed(1);
  const thresholdVal = Math.round(-12 - (config.compressionAmount / 100) * 22);

  return (
    <div
      className={
        embedded
          ? 'space-y-3.5'
          : 'rounded-xl border border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1A1816] p-4 space-y-3.5'
      }
    >
      {/* Header with Preset Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDEAE2] dark:border-[#26231F] pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-[#D94E28] dark:text-[#EE6A43]" />
          <div>
            <h3 className="text-xs font-bold text-[#171614] dark:text-[#F3F0EA]">
              {isAr ? 'المؤثرات الصوتية (DSP)' : 'Audio Effects Rack (DSP)'}
            </h3>
            <p className="text-[11px] text-[#5F5B53] dark:text-[#968F84]">
              {isAr ? 'تُدمج مباشرة في ملف الماستر' : 'Baked into exported WAV & MP3'}
            </p>
          </div>
        </div>

        <div className="flex items-center rounded-lg bg-[#EDEAE2] dark:bg-[#121110] p-0.5 text-[11px]">
          {(['dry', 'podcast', 'cinematic', 'epic'] as const).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => applyPreset(preset)}
              className={`px-2 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                activePreset === preset
                  ? 'bg-white dark:bg-[#26231F] text-[#D94E28] dark:text-[#EE6A43] font-semibold'
                  : 'text-[#5F5B53] dark:text-[#968F84] hover:text-[#171614] dark:hover:text-white'
              }`}
            >
              {preset === 'dry'
                ? isAr
                  ? 'نقي'
                  : 'Dry'
                : preset === 'podcast'
                ? isAr
                  ? 'بودكاست'
                  : 'Podcast'
                : preset === 'cinematic'
                ? isAr
                  ? 'سينمائي'
                  : 'Cinema'
                : isAr
                ? 'ملحمي'
                : 'Epic'}
            </button>
          ))}
        </div>
      </div>

      {/* Effect Modules */}
      <div className="divide-y divide-[#EDEAE2] dark:divide-[#26231F]">
        {/* Module 1: Reverb */}
        <div className="py-3 first:pt-0 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Waves
                className={`h-4 w-4 ${
                  config.reverbEnabled
                    ? 'text-[#D94E28] dark:text-[#EE6A43]'
                    : 'text-[#7A746A]'
                }`}
              />
              <div>
                <div className="text-xs font-bold text-[#171614] dark:text-[#F3F0EA]">
                  {isAr ? 'الصدى المكاني (Reverb)' : 'Spatial Reverb'}
                </div>
                <div className="text-[10px] text-[#5F5B53] dark:text-[#968F84]">
                  {isAr ? 'عمق واتساع يحاكي الاستوديو والقاعات' : 'Acoustic room ambience'}
                </div>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={config.reverbEnabled}
              onClick={() =>
                onChange({ ...config, reverbEnabled: !config.reverbEnabled })
              }
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                config.reverbEnabled
                  ? 'border-[#D94E28] bg-[#D94E28] text-white'
                  : 'border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1C1A17] text-[#5F5B53] dark:text-[#968F84]'
              }`}
            >
              {config.reverbEnabled ? (isAr ? 'مُفعّل' : 'Active') : isAr ? 'تفعيل' : 'Enable'}
            </button>
          </div>

          {config.reverbEnabled && (
            <div className="pt-2 border-t border-[#EDEAE2] dark:border-[#26231F] space-y-2.5">
              <div className="grid grid-cols-3 gap-1.5">
                {reverbSpaces.map((sp) => (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => onChange({ ...config, reverbSpace: sp.id })}
                    className={`rounded-md border py-1.5 px-2 text-[11px] font-medium transition-colors ${
                      config.reverbSpace === sp.id
                        ? 'border-[#D94E28] bg-[#FDF1EC] dark:bg-[#261A15] text-[#D94E28] dark:text-[#EE6A43]'
                        : 'border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1A1816] text-[#5F5B53] dark:text-[#968F84]'
                    }`}
                  >
                    {isAr ? sp.labelAr : sp.labelEn}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] text-[#5F5B53] dark:text-[#968F84]">
                  {isAr ? 'نسبة الصدى' : 'Wet Mix'}
                </span>
                <input
                  type="range"
                  min={0.05}
                  max={0.7}
                  step={0.05}
                  value={config.reverbMix}
                  onChange={(e) =>
                    onChange({ ...config, reverbMix: parseFloat(e.target.value) })
                  }
                  className="flex-1 h-1.5 cursor-pointer rounded bg-[#DED9CE] dark:bg-[#2A2723] accent-[#D94E28]"
                />
                <span className="w-10 text-end font-mono tabular-nums text-[11px] text-[#D94E28] dark:text-[#EE6A43] font-semibold">
                  {Math.round(config.reverbMix * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Module 2: Compression */}
        <div className="py-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Gauge
                className={`h-4 w-4 ${
                  config.compressionEnabled
                    ? 'text-[#D94E28] dark:text-[#EE6A43]'
                    : 'text-[#7A746A]'
                }`}
              />
              <div>
                <div className="text-xs font-bold text-[#171614] dark:text-[#F3F0EA]">
                  {isAr ? 'ضغط الصوت (Compression)' : 'Dynamics Compression'}
                </div>
                <div className="text-[10px] text-[#5F5B53] dark:text-[#968F84]">
                  {isAr ? 'توحيد مستوى الصوت والحضور الإذاعي' : 'Broadcast loudness leveling'}
                </div>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={config.compressionEnabled}
              onClick={() =>
                onChange({
                  ...config,
                  compressionEnabled: !config.compressionEnabled,
                })
              }
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                config.compressionEnabled
                  ? 'border-[#D94E28] bg-[#D94E28] text-white'
                  : 'border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1C1A17] text-[#5F5B53] dark:text-[#968F84]'
              }`}
            >
              {config.compressionEnabled ? (isAr ? 'مُفعّل' : 'Active') : isAr ? 'تفعيل' : 'Enable'}
            </button>
          </div>

          {config.compressionEnabled && (
            <div className="pt-2 border-t border-[#EDEAE2] dark:border-[#26231F] space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] text-[#5F5B53] dark:text-[#968F84]">
                  {isAr ? 'شدة الضغط' : 'Intensity'}
                </span>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={config.compressionAmount}
                  onChange={(e) =>
                    onChange({
                      ...config,
                      compressionAmount: parseInt(e.target.value, 10),
                    })
                  }
                  className="flex-1 h-1.5 cursor-pointer rounded bg-[#DED9CE] dark:bg-[#2A2723] accent-[#D94E28]"
                />
                <span className="w-10 text-end font-mono tabular-nums text-[11px] text-[#D94E28] dark:text-[#EE6A43] font-semibold">
                  {config.compressionAmount}%
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-[#5F5B53] dark:text-[#968F84]">
                <span>Threshold: {thresholdVal} dB</span>
                <span>Ratio: {ratioVal}:1</span>
              </div>
            </div>
          )}
        </div>

        {/* Module 3: Broadcast EQ */}
        <div className="pt-3 pb-1 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Sparkles
              className={`h-4 w-4 ${
                config.warmthEnabled
                  ? 'text-[#15803D] dark:text-emerald-400'
                  : 'text-[#7A746A]'
              }`}
            />
            <div>
              <div className="text-xs font-bold text-[#171614] dark:text-[#F3F0EA]">
                {isAr ? 'دفء ووضوح البث (Broadcast EQ)' : 'Broadcast Warmth EQ'}
              </div>
              <div className="text-[10px] text-[#5F5B53] dark:text-[#968F84]">
                {isAr ? 'تعزيز الدفء ومخارج الحروف' : 'Low-end richness & vocal clarity'}
              </div>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={config.warmthEnabled}
            onClick={() =>
              onChange({ ...config, warmthEnabled: !config.warmthEnabled })
            }
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
              config.warmthEnabled
                ? 'border-[#15803D] bg-[#15803D] text-white'
                : 'border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1C1A17] text-[#5F5B53] dark:text-[#968F84]'
            }`}
          >
            {config.warmthEnabled ? (isAr ? 'مُفعّل' : 'Active') : isAr ? 'تفعيل' : 'Enable'}
          </button>
        </div>
      </div>
    </div>
  );
};
