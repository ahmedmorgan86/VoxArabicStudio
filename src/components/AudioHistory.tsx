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
    <div className="space-y-3 rounded-xl border border-slate-800 bg-[#090d16] p-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">
            {isAr ? 'سجل المقاطع المنشأة (Session Takes)' : 'Master Takes History'}
          </h3>
          <span className="font-mono text-xs text-slate-400">
            ({history.length})
          </span>
        </div>
        <button
          onClick={onClearHistory}
          className="text-xs text-slate-400 hover:text-red-400 transition-colors"
        >
          {isAr ? 'مسح السجل' : 'Clear All'}
        </button>
      </div>

      <div className="divide-y divide-slate-800/60">
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
                isCurrent ? 'bg-cyan-950/20 px-2 rounded-lg' : ''
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1 font-mono">
                  <span className="font-bold text-cyan-400">{item.voice}</span>
                  <span aria-hidden="true">·</span>
                  <span>{item.dialect}</span>
                  <span aria-hidden="true">·</span>
                  <span>{timeStr}</span>
                </div>
                <p className="text-xs text-slate-200 truncate leading-relaxed">
                  {item.text}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => onSelectAudio(item)}
                  className="flex items-center gap-1.5 rounded bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>{isAr ? 'تشغيل' : 'Play'}</span>
                </button>

                <button
                  onClick={() =>
                    downloadWavFile(item.audioBase64, `voxarabic-${item.voice}-${item.id}.wav`)
                  }
                  className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-emerald-400 transition-colors"
                  title={isAr ? 'تحميل WAV' : 'Download WAV'}
                >
                  <Download className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={() => onDeleteItem(item.id)}
                  className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
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
