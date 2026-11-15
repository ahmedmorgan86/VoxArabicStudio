import React, { useState } from 'react';
import { VOCAL_STYLES } from '../data/voicesAndDialects';
import { Language, VocalStyleCategory, VoiceSettingsConfig } from '../types';
import { AudioLines, RotateCcw, Sparkles, Sliders } from 'lucide-react';

interface StyleSelectorProps {
  selectedStyleId: string;
  onSelectStyle: (styleId: string) => void;
  customTonePrompt: string;
  onCustomTonePromptChange: (val: string) => void;
  voiceSettings: VoiceSettingsConfig;
  onVoiceSettingsChange: (next: VoiceSettingsConfig) => void;
  language: Language;
  embedded?: boolean;
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettingsConfig = {
  stability: 50,
  styleExaggeration: 35,
  speed: 1.0,
  pitch: 0,
  speakerBoost: true,
};

export const StyleSelector: React.FC<StyleSelectorProps> = ({
  selectedStyleId,
  onSelectStyle,
  customTonePrompt,
  onCustomTonePromptChange,
  voiceSettings,
  onVoiceSettingsChange,
  language,
  embedded = false,
}) => {
  const isAr = language === 'ar';
  const [categoryFilter, setCategoryFilter] = useState<'all' | VocalStyleCategory>('all');

  const categories: Array<{ id: 'all' | VocalStyleCategory; ar: string; en: string }> = [
    { id: 'all', ar: 'الكل (16)', en: 'All (16)' },
    { id: 'emotion', ar: 'مشاعر', en: 'Emotions' },
    { id: 'broadcast', ar: 'بث وإلقاء', en: 'Broadcast' },
    { id: 'narrative', ar: 'سرد وشعر', en: 'Narrative' },
    { id: 'character', ar: 'شخصيات', en: 'Characters' },
  ];

  const filteredStyles =
    categoryFilter === 'all'
      ? VOCAL_STYLES
      : VOCAL_STYLES.filter((s) => s.category === categoryFilter);

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
          <AudioLines className="h-4 w-4 text-[#D94E28] dark:text-[#EE6A43]" />
          <div>
            <h3 className="text-xs font-bold text-[#171614] dark:text-[#F3F0EA]">
              {isAr ? 'التون ونمط الأداء الصوتي' : 'Vocal Tone & Delivery'}
            </h3>
            <p className="text-[11px] text-[#5F5B53] dark:text-[#968F84]">
              {isAr
                ? '16 أسلوباً + توجيه تمثيلي حر + ضبط الصوت الدقيق'
                : '16 styles + custom prompt + fine voice sliders'}
            </p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategoryFilter(cat.id)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors ${
              categoryFilter === cat.id
                ? 'bg-[#FDF1EC] dark:bg-[#261A15] text-[#D94E28] dark:text-[#EE6A43] font-semibold'
                : 'bg-[#F6F4EF] dark:bg-[#141210] text-[#5F5B53] dark:text-[#968F84] hover:text-[#171614] dark:hover:text-white'
            }`}
          >
            {isAr ? cat.ar : cat.en}
          </button>
        ))}
      </div>

      {/* Style Presets Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-[210px] overflow-y-auto pe-1">
        {filteredStyles.map((style) => {
          const isSelected = selectedStyleId === style.id;
          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onSelectStyle(style.id)}
              className={`flex flex-col items-center justify-center rounded-lg border p-2.5 text-center transition-colors ${
                isSelected
                  ? 'border-[#D94E28] bg-[#FDF1EC] dark:bg-[#261A15] text-[#171614] dark:text-white'
                  : 'border-transparent bg-[#F6F4EF] dark:bg-[#141210] text-[#5F5B53] dark:text-[#B5AFA4] hover:bg-[#EDEAE2] dark:hover:bg-[#1F1C19]'
              }`}
            >
              <span className="text-lg mb-1 leading-none">{style.icon}</span>
              <span className="text-[11px] font-semibold line-clamp-1">
                {isAr ? style.nameAr : style.nameEn}
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom Freeform Tone Prompt */}
      <div className="space-y-1.5 pt-2 border-t border-[#EDEAE2] dark:border-[#26231F]">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-[#171614] dark:text-[#F3F0EA] flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#D94E28] dark:text-[#EE6A43]" />
            <span>{isAr ? 'تون وطريقة إلقاء مخصصة (اختياري)' : 'Custom Tone Note'}</span>
          </label>
          {customTonePrompt && (
            <button
              type="button"
              onClick={() => onCustomTonePromptChange('')}
              className="text-[10px] text-[#5F5B53] hover:text-[#171614] dark:hover:text-white"
            >
              {isAr ? 'مسح' : 'Clear'}
            </button>
          )}
        </div>
        <input
          type="text"
          value={customTonePrompt}
          onChange={(e) => onCustomTonePromptChange(e.target.value)}
          placeholder={
            isAr
              ? 'مثال: "همس غامض مع توقفات درامية" أو "معلق رياضي متحمس"...'
              : 'e.g. "Sarcastic late-night host", "Breathless whisper"...'
          }
          className="w-full rounded-lg border border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#121110] px-3 py-1.5 text-xs text-[#171614] dark:text-[#F3F0EA] placeholder-[#7A746A] focus:border-[#D94E28] focus:outline-none"
        />
      </div>

      {/* Voice Settings Sliders */}
      <div className="space-y-3 pt-2 border-t border-[#DED9CE] dark:border-[#2A2723]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#171614] dark:text-[#F3F0EA]">
            <Sliders className="h-3.5 w-3.5 text-[#D94E28] dark:text-[#EE6A43]" />
            <span>{isAr ? 'إعدادات الصوت الدقيقة' : 'Fine Voice Settings'}</span>
          </div>
          <button
            type="button"
            onClick={() => onVoiceSettingsChange(DEFAULT_VOICE_SETTINGS)}
            className="flex items-center gap-1 text-[11px] text-[#5F5B53] dark:text-[#968F84] hover:text-[#D94E28] transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            <span>{isAr ? 'افتراضي' : 'Reset'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Stability */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#171614] dark:text-[#E5E0D5] font-medium">
                {isAr ? 'الثبات (Stability)' : 'Stability'}
              </span>
              <span className="font-mono tabular-nums text-[#D94E28] dark:text-[#EE6A43] font-semibold">
                {voiceSettings.stability}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={voiceSettings.stability}
              onChange={(e) =>
                onVoiceSettingsChange({ ...voiceSettings, stability: Number(e.target.value) })
              }
              className="w-full accent-[#D94E28] h-1.5 bg-[#DED9CE] dark:bg-[#2A2723] rounded-lg cursor-pointer"
            />
          </div>

          {/* Style Exaggeration */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#171614] dark:text-[#E5E0D5] font-medium">
                {isAr ? 'التمثيل والمبالغة' : 'Style Exaggeration'}
              </span>
              <span className="font-mono tabular-nums text-[#D94E28] dark:text-[#EE6A43] font-semibold">
                {voiceSettings.styleExaggeration}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={voiceSettings.styleExaggeration}
              onChange={(e) =>
                onVoiceSettingsChange({
                  ...voiceSettings,
                  styleExaggeration: Number(e.target.value),
                })
              }
              className="w-full accent-[#D94E28] h-1.5 bg-[#DED9CE] dark:bg-[#2A2723] rounded-lg cursor-pointer"
            />
          </div>

          {/* Speaking Speed */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#171614] dark:text-[#E5E0D5] font-medium">
                {isAr ? 'سرعة الإلقاء' : 'Speaking Speed'}
              </span>
              <span className="font-mono tabular-nums text-[#D94E28] dark:text-[#EE6A43] font-semibold">
                {voiceSettings.speed.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min={0.65}
              max={1.45}
              step={0.05}
              value={voiceSettings.speed}
              onChange={(e) =>
                onVoiceSettingsChange({ ...voiceSettings, speed: Number(e.target.value) })
              }
              className="w-full accent-[#D94E28] h-1.5 bg-[#DED9CE] dark:bg-[#2A2723] rounded-lg cursor-pointer"
            />
          </div>

          {/* Pitch */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#171614] dark:text-[#E5E0D5] font-medium">
                {isAr ? 'طبقة الصوت (Pitch)' : 'Vocal Pitch'}
              </span>
              <span className="font-mono tabular-nums text-[#D94E28] dark:text-[#EE6A43] font-semibold">
                {voiceSettings.pitch > 0 ? `+${voiceSettings.pitch}` : voiceSettings.pitch}
              </span>
            </div>
            <input
              type="range"
              min={-6}
              max={6}
              step={1}
              value={voiceSettings.pitch}
              onChange={(e) =>
                onVoiceSettingsChange({ ...voiceSettings, pitch: Number(e.target.value) })
              }
              className="w-full accent-[#D94E28] h-1.5 bg-[#DED9CE] dark:bg-[#2A2723] rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Speaker Clarity Boost */}
        <label className="flex items-center justify-between pt-2 border-t border-[#DED9CE] dark:border-[#2A2723] cursor-pointer">
          <div>
            <div className="text-xs font-semibold text-[#171614] dark:text-[#F3F0EA]">
              {isAr ? 'تعزيز حضور ووضوح المتحدث' : 'Speaker Clarity Boost'}
            </div>
            <div className="text-[10px] text-[#5F5B53] dark:text-[#968F84]">
              {isAr ? 'يركز جودة الميكروفون ونقاء المخارج' : 'Enhances studio mic presence'}
            </div>
          </div>
          <input
            type="checkbox"
            checked={voiceSettings.speakerBoost}
            onChange={(e) =>
              onVoiceSettingsChange({ ...voiceSettings, speakerBoost: e.target.checked })
            }
            className="h-4 w-4 accent-[#D94E28] rounded cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
};
