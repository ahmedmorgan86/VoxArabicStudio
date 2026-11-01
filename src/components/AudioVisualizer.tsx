import React, { useRef, useState } from 'react';
import { formatTime } from '../utils/audioHelper';

interface AudioVisualizerProps {
  peaks: number[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  accentColor?: 'cyan' | 'purple' | 'amber';
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  peaks,
  currentTime,
  duration,
  isPlaying,
  onSeek,
  accentColor = 'cyan',
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

  // Generate 5 time ruler markers based on duration
  const timeMarkers = [0, 0.25, 0.5, 0.75, 1].map((factor) => {
    return formatTime((duration || 10) * factor);
  });

  return (
    <div className="relative w-full rounded-xl bg-[#0b0f19] border border-slate-800 p-4 select-none">
      {/* Time Scale Ruler */}
      <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-slate-400 border-b border-slate-800/80 pb-2 mb-3">
        {timeMarkers.map((marker, idx) => (
          <span key={idx} className="flex flex-col items-center">
            <span>{marker}</span>
            <span className="h-1 w-[1px] bg-slate-800 mt-1" />
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

          // Subtle dynamic breath when actively playing this segment
          if (isPlaying && isPlayed) {
            const oscillation = Math.sin((idx + currentTime * 6) * 0.4) * 6;
            heightPercent = Math.max(12, Math.min(98, heightPercent + oscillation));
          }

          let barClass = 'bg-slate-700/80 hover:bg-slate-600';
          if (isPlayed) {
            if (accentColor === 'purple') {
              barClass = 'bg-purple-400';
            } else if (accentColor === 'amber') {
              barClass = 'bg-amber-400';
            } else {
              barClass = 'bg-cyan-400';
            }
          }

          return (
            <div
              key={idx}
              className="flex-1 flex flex-col items-center justify-center h-full"
            >
              {/* Upper Wave */}
              <div
                style={{ height: `${heightPercent * 0.75}%` }}
                className={`w-full rounded-t-sm transition-all duration-100 ${barClass}`}
              />
              {/* Center dividing line */}
              <div className="w-full h-[1px] bg-slate-800 my-[1px]" />
              {/* Lower Mirror Wave (Audio reflection) */}
              <div
                style={{ height: `${heightPercent * 0.3}%` }}
                className={`w-full rounded-b-sm opacity-40 transition-all duration-100 ${barClass}`}
              />
            </div>
          );
        })}

        {/* Master Playhead Needle */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-cyan-300 pointer-events-none shadow-sm z-20"
          style={{ left: `${progressRatio * 100}%` }}
        >
          <div className="absolute -top-1 -left-[3px] h-2 w-2 rounded-full bg-cyan-300" />
        </div>

        {/* Hover inspection cursor line and timestamp */}
        {hoverX !== null && hoverTime !== null && (
          <div
            className="absolute top-0 bottom-0 w-[1px] bg-white/40 pointer-events-none z-10"
            style={{ left: `${hoverX}px` }}
          >
            <div className="absolute -top-5 -translate-x-1/2 rounded bg-slate-900 border border-slate-700 px-1 py-0.5 text-[9px] font-mono text-slate-200">
              {formatTime(hoverTime)}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Track Meta */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
        <div className="flex items-center gap-2">
          <span className="text-slate-300 font-sans font-semibold">
            {isPlaying ? 'تشغيل المسار الصوتي' : 'جاهز للمعاينة'}
          </span>
          <span aria-hidden="true">·</span>
          <span>WAV 24,000 Hz</span>
          <span aria-hidden="true">·</span>
          <span>16-bit Mono</span>
        </div>
        <div className="text-cyan-400 font-bold tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
    </div>
  );
};
