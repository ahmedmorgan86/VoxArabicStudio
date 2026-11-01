export type Language = 'ar' | 'en';

export type VoiceName = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';

export interface VoiceOption {
  id: VoiceName;
  nameAr: string;
  nameEn: string;
  gender: 'female' | 'male';
  tagAr: string;
  tagEn: string;
  descAr: string;
  descEn: string;
  color: string;
  avatarSeed: string;
}

export interface DialectOption {
  id: string;
  language: Language;
  nameAr: string;
  nameEn: string;
  flag: string;
  regionAr: string;
  regionEn: string;
  descAr: string;
  descEn: string;
}

export interface VocalStyle {
  id: string;
  icon: string;
  nameAr: string;
  nameEn: string;
  promptInstruction: string;
  color: string;
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
  createdAt: number;
  duration?: number;
}

export interface DialogueLine {
  id: string;
  speaker: string;
  text: string;
  style?: string;
}
