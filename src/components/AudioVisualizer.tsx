import React, { useRef, useState } from 'react';
import { formatTime } from '../utils/audioHelper';

interface AudioVisualizerProps {
  peaks: number[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  language?: 'ar' | 'en';
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  peaks,
  currentTime,
  duration,
  isPlaying,
  onSeek,
  language = 'ar',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);

  const displayPeaks = peaks && peaks.length > 0 ? peaks : Array(56).fill(0.25);
  const progressRatio = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
  const currentActiveIndex = Math.floor(progressRatio * displayPeaks.length);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || duration <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const ratio = x / rect.width;
    setHoverTime(ratio * duration);
    setHoverX(x);
  };

  const handleMouseLeave = () => {
    setHoverTime(null);
    setHoverX(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || duration <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const targetRatio = x / rect.width;
    onSeek(targetRatio * duration);
  };

  const timeMarkers = [0, 0.25, 0.5, 0.75, 1].map((factor) => {
    return formatTime((duration || 10) * factor);
  });

  return (
    <div className="relative w-full rounded-lg bg-[#EDEAE2] dark:bg-[#141210] p-4 select-none">
      {/* Precision Time Ruler */}
      <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-[#6E695F] dark:text-[#968F84] border-b border-[#DED9CE] dark:border-[#2A2723] pb-2 mb-3">
        {timeMarkers.map((marker, idx) => (
          <span key={idx} className="flex flex-col items-center">
            <span>{marker}</span>
            <span className="h-1 w-[1px] bg-[#CFC9BC] dark:bg-[#3A352E] mt-1" />
          </span>
        ))}
      </div>

      {/* Waveform Scrubber Surface */}
      <div
        ref={containerRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative h-20 w-full cursor-pointer flex items-center justify-between gap-[2px] sm:gap-[3px]"
      >
        {displayPeaks.map((peak, idx) => {
          const isPlayed = idx <= currentActiveIndex;
          let heightPercent = Math.max(10, Math.min(95, peak * 100));

          if (isPlaying && isPlayed) {
            const oscillation = Math.sin((idx + currentTime * 6) * 0.4) * 5;
            heightPercent = Math.max(12, Math.min(98, heightPercent + oscillation));
          }

          const barClass = isPlayed
            ? 'bg-[#D94E28] dark:bg-[#EE6A43]'
            : 'bg-[#C4BEB2] dark:bg-[#3B3731] hover:bg-[#9D9689] dark:hover:bg-[#524C44]';

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center justify-center h-full"
            >
              <div
                style={{ height: `${heightPercent * 0.72}%` }}
                className={`w-full rounded-t-xs transition-all duration-100 ${barClass}`}
              />
              <div className="w-full h-[1px] bg-[#DED9CE] dark:bg-[#2A2723] my-[1px]" />
              <div
                style={{ height: `${heightPercent * 0.28}%` }}
                className={`w-full rounded-b-xs opacity-45 transition-all duration-100 ${barClass}`}
              />
            </div>
          );
        })}

        {/* Master Playhead Needle */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-[#171614] dark:bg-[#F3F0EA] pointer-events-none z-20"
          style={{ left: `${progressRatio * 100}%` }}
        >
          <div className="absolute -top-1 -left-[3px] h-2 w-2 rounded-full bg-[#171614] dark:bg-[#F3F0EA]" />
        </div>

        {/* Hover inspection line */}
        {hoverX !== null && hoverTime !== null && (
          <div
            className="absolute top-0 bottom-0 w-[1px] bg-[#171614]/40 dark:bg-white/40 pointer-events-none z-10"
            style={{ left: `${hoverX}px` }}
          >
            <div className="absolute -top-5 -translate-x-1/2 rounded bg-[#171614] dark:bg-[#F3F0EA] px-1.5 py-0.5 text-[9px] font-mono text-white dark:text-[#171614]">
              {formatTime(hoverTime)}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Track Meta */}
      <div className="mt-3 flex items-center justify-between text-xs text-[#5F5B53] dark:text-[#968F84] border-t border-[#DED9CE] dark:border-[#2A2723] pt-2 font-mono">
        <div className="flex items-center gap-2">
          <span className="text-[#171614] dark:text-[#F3F0EA] font-sans font-semibold">
            {isPlaying
              ? language === 'ar'
                ? 'جاري التشغيل'
                : 'Playing'
              : language === 'ar'
              ? 'جاهز للمعاينة'
              : 'Ready'}
          </span>
          <span aria-hidden="true">·</span>
          <span>WAV 24,000 Hz</span>
          <span aria-hidden="true">·</span>
          <span>16-bit</span>
        </div>
        <div className="text-[#D94E28] dark:text-[#EE6A43] font-semibold tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
    </div>
  );
};
