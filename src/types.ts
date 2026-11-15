export type Language = 'ar' | 'en';

export type VoiceName = string;

export type VoiceCategory =
  | 'narration'
  | 'conversational'
  | 'cinematic'
  | 'news'
  | 'characters'
  | 'asmr';

export type VoiceAgeGroup = 'young' | 'adult' | 'mature';

export interface VoiceOption {
  id: VoiceName;
  nameAr: string;
  nameEn: string;
  gender: 'female' | 'male';
  ageGroup: VoiceAgeGroup;
  category: VoiceCategory;
  timbreAr: string;
  timbreEn: string;
  bestForAr: string;
  bestForEn: string;
  descAr: string;
  descEn: string;
  waveHeights: number[];
  isCustom?: boolean;
  baseVoice?: string;
  voiceDesignPrompt?: string;
}

export interface CustomVoicePersona {
  id: string;
  name: string;
  baseVoice: string;
  gender: 'female' | 'male';
  ageGroup: VoiceAgeGroup;
  prompt: string;
  createdAt: number;
}

export type DialectRegionGroup =
  | 'standard'
  | 'egypt_sudan'
  | 'gulf'
  | 'levant_iraq'
  | 'maghreb'
  | 'en_americas'
  | 'en_uk_ireland'
  | 'en_global';

export interface DialectOption {
  id: string;
  language: Language;
  regionGroup: DialectRegionGroup;
  nameAr: string;
  nameEn: string;
  flag: string;
  regionAr: string;
  regionEn: string;
  cadenceAr: string;
  cadenceEn: string;
  descAr: string;
  descEn: string;
}

export type VocalStyleCategory = 'broadcast' | 'emotion' | 'narrative' | 'character';

export interface VocalStyle {
  id: string;
  icon: string;
  category: VocalStyleCategory;
  nameAr: string;
  nameEn: string;
  promptInstruction: string;
}

export interface VoiceSettingsConfig {
  stability: number; // 0 - 100
  styleExaggeration: number; // 0 - 100
  speed: number; // 0.6 - 1.5
  pitch: number; // -6 to +6
  speakerBoost: boolean;
}

export type ReverbSpace = 'studio' | 'hall' | 'cathedral';

export interface AudioEffectsConfig {
  reverbEnabled: boolean;
  reverbMix: number; // 0.05 to 0.70
  reverbSpace: ReverbSpace;
  compressionEnabled: boolean;
  compressionAmount: number; // 10 to 100
  warmthEnabled: boolean;
}

export interface GeneratedAudioItem {
  id: string;
  text: string;
  audioBase64: string;
  mimeType: string;
  voice: VoiceName;
  dialect: string;
  language: Language;
  styleName: string;
  effectsSummary?: string;
  createdAt: number;
  duration?: number;
}

export interface DialogueLine {
  id: string;
  speaker: string;
  text: string;
  style?: string;
}

export type StudioTab = 'single' | 'advanced' | 'dialogue';

export interface AdvancedParagraph {
  id: string;
  text: string;
  voiceOverride?: VoiceName; // optional override; falls back to global selectedVoice
  speechRate: number; // 0.60 - 1.50
  pitch: number; // -6 to +6
  styleId: string;
  customTone: string;
  pauseAfterMs: number; // 0 - 2500
}

