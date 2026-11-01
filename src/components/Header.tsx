import React from 'react';
import { Language } from '../types';
import { Mic2, Users, Globe2, Volume2 } from 'lucide-react';

interface HeaderProps {
  language: Language;
  onToggleLanguage: () => void;
  activeTab: 'single' | 'dialogue';
  onTabChange: (tab: 'single' | 'dialogue') => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onToggleLanguage,
  activeTab,
  onTabChange,
}) => {
  const isAr = language === 'ar';

  return (
    <header className="border-b border-slate-800/80 bg-[#080c14]/95 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500 text-slate-950 font-black shadow-sm">
            <Volume2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold tracking-tight text-white">
                VoxArabic <span className="text-cyan-400 font-light">Studio</span>
              </span>
              <span className="hidden md:inline text-xs text-slate-400 font-normal">
                {isAr ? 'استوديو هندسة الصوت العصبي' : 'Neural Voice Studio'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              24kHz WAV Master Engine
            </div>
          </div>
        </div>

        {/* Studio mode segmented control */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-900/90 p-1 border border-slate-800">
          <button
            onClick={() => onTabChange('single')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'single'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic2 className="h-3.5 w-3.5" />
            <span>{isAr ? 'تسجيل فردي' : 'Single Voice'}</span>
          </button>

          <button
            onClick={() => onTabChange('dialogue')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'dialogue'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>{isAr ? 'استوديو الحوار' : 'Dual Dialogue'}</span>
          </button>
        </div>

        {/* Right utility: Language Switch */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleLanguage}
            className="flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            title={isAr ? 'Switch to English' : 'التحويل للعربية'}
          >
            <Globe2 className="h-3.5 w-3.5 text-cyan-400" />
            <span className="font-semibold">{isAr ? 'English' : 'عربي'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
