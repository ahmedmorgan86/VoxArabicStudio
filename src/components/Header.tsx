import React from 'react';
import { Language, StudioTab } from '../types';
import { Globe2, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  language: Language;
  onToggleLanguage: () => void;
  activeTab: StudioTab;
  onTabChange: (tab: StudioTab) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onToggleLanguage,
  activeTab,
  onTabChange,
  theme,
  onToggleTheme,
}) => {
  const isAr = language === 'ar';

  const navItems: Array<{ id: StudioTab; labelAr: string; labelEn: string }> = [
    { id: 'single', labelAr: 'التسجيل الفردي', labelEn: 'Single Voice' },
    { id: 'advanced', labelAr: 'التوليد المتقدم', labelEn: 'Advanced Mode' },
    { id: 'dialogue', labelAr: 'استوديو الحوار', labelEn: 'Dialogue Studio' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF]/95 dark:bg-[#121110]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 h-14">
        {/* Zone 1: Brand wordmark (one line) */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <span
            aria-hidden="true"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#D94E28] text-white font-mono text-xs font-semibold tracking-tighter"
          >
            VA
          </span>
          <span className="text-base font-extrabold tracking-tight text-[#171614] dark:text-[#F3F0EA]">
            VoxArabic
          </span>
        </div>

        {/* Zone 2: Mode Navigation Links */}
        <nav className="flex items-center gap-5 sm:gap-7 overflow-x-auto scrollbar-none h-full">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`relative h-full flex items-center text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  isActive
                    ? 'text-[#D94E28] dark:text-[#EE6A43]'
                    : 'text-[#5F5B53] dark:text-[#A39D93] hover:text-[#171614] dark:hover:text-[#F3F0EA]'
                }`}
              >
                <span>{isAr ? item.labelAr : item.labelEn}</span>
                {isActive && (
                  <span className="absolute inset-x-0 bottom-0 h-[2px] bg-[#D94E28] dark:bg-[#EE6A43]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Theme & Language Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1C1A17] text-[#5F5B53] dark:text-[#B5AFA4] hover:text-[#171614] dark:hover:text-white transition-colors"
            title={
              theme === 'light'
                ? isAr
                  ? 'التبديل للوضع الداكن'
                  : 'Switch to Dark Mode'
                : isAr
                ? 'التبديل للوضع الفاتح'
                : 'Switch to Light Mode'
            }
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4 text-[#EE6A43]" />
            )}
          </button>

          <button
            type="button"
            onClick={onToggleLanguage}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1C1A17] px-3 text-xs font-semibold text-[#171614] dark:text-[#F3F0EA] hover:bg-[#EDEAE2] dark:hover:bg-[#26231F] transition-colors whitespace-nowrap shrink-0"
            title={isAr ? 'Switch to English' : 'التحويل للعربية'}
          >
            <Globe2 className="h-3.5 w-3.5 text-[#D94E28] dark:text-[#EE6A43]" />
            <span>{isAr ? 'English' : 'عربي'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
