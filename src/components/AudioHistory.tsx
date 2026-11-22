import React from 'react';
import { GeneratedAudioItem, Language } from '../types';
import { Play, Trash2, Download } from 'lucide-react';
import { downloadWavFile } from '../utils/audioHelper';

interface AudioHistoryProps {
  history: GeneratedAudioItem[];
  onSelectAudio: (item: GeneratedAudioItem) => void;
  onClearHistory: () => void;
  onDeleteItem: (id: string) => void;
  currentAudioId?: string;
  language: Language;
}

export const AudioHistory: React.FC<AudioHistoryProps> = ({
  history,
  onSelectAudio,
  onClearHistory,
  onDeleteItem,
  currentAudioId,
  language,
}) => {
  const isAr = language === 'ar';

  if (history.length === 0) return null;

  return (
    <div className="space-y-3 rounded-xl border border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1A1816] p-4">
      <div className="flex items-center justify-between border-b border-[#DED9CE] dark:border-[#2A2723] pb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-[#171614] dark:text-[#F3F0EA]">
            {isAr ? 'سجل المقاطع المنشأة (Session Takes)' : 'Master Takes History'}
          </h3>
          <span className="font-mono tabular-nums text-xs text-[#5F5B53] dark:text-[#968F84]">
            ({history.length})
          </span>
        </div>
        <button
          type="button"
          onClick={onClearHistory}
          className="text-xs font-medium text-[#5F5B53] dark:text-[#968F84] hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          {isAr ? 'مسح السجل' : 'Clear All'}
        </button>
      </div>

      <div className="divide-y divide-[#EDEAE2] dark:divide-[#26231F]">
        {history.map((item) => {
          const isCurrent = currentAudioId === item.id;
          const timeStr = new Date(item.createdAt).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={item.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 transition-colors ${
                isCurrent ? 'bg-[#FDF1EC] dark:bg-[#261A15] px-2.5 rounded-lg' : ''
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#5F5B53] dark:text-[#968F84] mb-1 font-mono tabular-nums">
                  <span className="font-bold text-[#D94E28] dark:text-[#EE6A43]">{item.voice}</span>
                  <span aria-hidden="true">·</span>
                  <span>{item.dialect}</span>
                  {typeof item.duration === 'number' && item.duration > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-[#171614] dark:text-[#F3F0EA]">
                        {isAr ? `${item.duration.toFixed(1)}ث` : `${item.duration.toFixed(1)}s`}
                      </span>
                    </>
                  )}
                  {item.effectsSummary && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#15803D] dark:text-emerald-400 font-sans font-medium">
                        {item.effectsSummary}
                      </span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span>{timeStr}</span>
                </div>
                <p className="text-xs text-[#171614] dark:text-[#F3F0EA] truncate leading-relaxed">
                  {item.text}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectAudio(item)}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                    isCurrent
                      ? 'border-[#D94E28] bg-[#D94E28] text-white'
                      : 'border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#22201C] text-[#171614] dark:text-[#F3F0EA] hover:bg-[#EDEAE2] dark:hover:bg-[#2C2924]'
                  }`}
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>{isAr ? 'تشغيل' : 'Play'}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    downloadWavFile(item.audioBase64, `voxarabic-${item.voice}-${item.id}.wav`)
                  }
                  className="rounded-lg border border-transparent p-1.5 text-[#5F5B53] dark:text-[#968F84] hover:border-[#DED9CE] dark:hover:border-[#2A2723] hover:bg-[#F6F4EF] dark:hover:bg-[#22201C] hover:text-[#15803D] dark:hover:text-emerald-400 transition-colors"
                  title={isAr ? 'تحميل WAV' : 'Download WAV'}
                >
                  <Download className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteItem(item.id)}
                  className="rounded-lg border border-transparent p-1.5 text-[#5F5B53] dark:text-[#968F84] hover:border-[#DED9CE] dark:hover:border-[#2A2723] hover:bg-[#F6F4EF] dark:hover:bg-[#22201C] hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title={isAr ? 'حذف' : 'Delete'}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
