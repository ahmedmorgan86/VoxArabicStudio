import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Copy,
  Check,
  Repeat,
  RefreshCw,
} from 'lucide-react';
import {
  downloadWavFile,
  downloadMp3File,
  extractWaveformPeaks,
} from '../utils/audioHelper';
import { AudioVisualizer } from './AudioVisualizer';
import { Language, VoiceName } from '../types';

interface AudioPlayerBarProps {
  audioBase64: string | null;
  mimeType?: string;
  voiceName?: VoiceName;
  dialectName?: string;
  language: Language;
  onEnded?: () => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  audioBase64,
  mimeType = 'audio/wav',
  voiceName,
  dialectName,
  language,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExportingMp3, setIsExportingMp3] = useState(false);

  const waveformPeaks = useMemo(() => {
    if (!audioBase64) return [];
    return extractWaveformPeaks(audioBase64, 56);
  }, [audioBase64]);

  const audioSrc = audioBase64 ? `data:${mimeType};base64,${audioBase64}` : null;

  useEffect(() => {
    if (audioRef.current && audioSrc) {
      audioRef.current.src = audioSrc;
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.loop = isLooping;
      audioRef.current.load();

      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }
  }, [audioSrc]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (
        audioRef.current.duration &&
        !isNaN(audioRef.current.duration) &&
        isFinite(audioRef.current.duration)
      ) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (
      audioRef.current &&
      !isNaN(audioRef.current.duration) &&
      isFinite(audioRef.current.duration)
    ) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (targetTime: number) => {
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioRef.current.muted = newMuted;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleLoop = () => {
    const newLoop = !isLooping;
    setIsLooping(newLoop);
    if (audioRef.current) {
      audioRef.current.loop = newLoop;
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleDownload = () => {
    if (!audioBase64) return;
    const filename = `voxarabic-${voiceName || 'take'}-${Date.now()}.wav`;
    downloadWavFile(audioBase64, filename);
  };

  const handleDownloadMp3 = () => {
    if (!audioBase64 || isExportingMp3) return;
    setIsExportingMp3(true);
    setTimeout(() => {
      try {
        const filename = `voxarabic-${voiceName || 'take'}-${Date.now()}.mp3`;
        downloadMp3File(audioBase64, filename, 192);
      } catch (err) {
        console.error('MP3 export failed:', err);
      } finally {
        setIsExportingMp3(false);
      }
    }, 15);
  };

  const handleCopy = () => {
    if (!audioBase64) return;
    navigator.clipboard.writeText(`data:${mimeType};base64,${audioBase64}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isAr = language === 'ar';

  if (!audioBase64) {
    return (
      <div className="rounded-xl border border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1A1816] px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EDEAE2] dark:bg-[#22201C] text-[#D94E28] dark:text-[#EE6A43] shrink-0">
            <Volume2 className="h-5 w-5" />
          </div>
          <div className="text-center sm:text-start">
            <h4 className="text-xs font-bold text-[#171614] dark:text-[#F3F0EA]">
              {isAr ? 'مشغّل الماستر جاهز (Master Audio Deck)' : 'Master Audio Deck Ready'}
            </h4>
            <p className="mt-0.5 text-xs text-[#5F5B53] dark:text-[#968F84]">
              {isAr
                ? 'اضغط على زر التوليد لعرض الموجة الصوتية والتحكم في السرعة والتصدير بصيغتي WAV و MP3'
                : 'Synthesize audio to inspect the interactive waveform and export WAV or MP3'}
            </p>
          </div>
        </div>
        <div className="text-[11px] font-mono text-[#5F5B53] dark:text-[#968F84] whitespace-nowrap">
          24kHz · WAV / MP3 192kbps
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#DED9CE] dark:border-[#2A2723] bg-white dark:bg-[#1A1816] p-4 space-y-4">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Visualizer Frame */}
      <AudioVisualizer
        peaks={waveformPeaks}
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        onSeek={handleSeek}
        language={language}
      />

      {/* Transport Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Playback Transport */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlay}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D94E28] hover:bg-[#C2411D] text-white transition-colors active:scale-95"
            title={isPlaying ? (isAr ? 'إيقاف مؤقت' : 'Pause') : isAr ? 'تشغيل' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 fill-current ms-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={handleRestart}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#22201C] text-[#171614] dark:text-[#F3F0EA] hover:bg-[#EDEAE2] dark:hover:bg-[#2C2924] transition-colors"
            title={isAr ? 'إعادة من البداية' : 'Restart'}
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={toggleLoop}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
              isLooping
                ? 'border-[#D94E28] bg-[#D94E28]/10 text-[#D94E28] dark:text-[#EE6A43]'
                : 'border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#22201C] text-[#5F5B53] dark:text-[#968F84] hover:text-[#171614] dark:hover:text-white'
            }`}
            title={isAr ? 'تكرار مستمر' : 'Toggle Loop'}
          >
            <Repeat className="h-4 w-4" />
          </button>

          {/* Speed selector */}
          <div className="hidden sm:flex items-center gap-0.5 border-s border-e border-[#DED9CE] dark:border-[#2A2723] px-2 mx-1">
            {[0.75, 1, 1.25, 1.5].map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => handleSpeedChange(speed)}
                className={`px-2 py-1 text-[11px] font-mono rounded transition-colors ${
                  playbackRate === speed
                    ? 'bg-[#171614] dark:bg-[#F3F0EA] text-white dark:text-[#171614] font-semibold'
                    : 'text-[#5F5B53] dark:text-[#968F84] hover:text-[#171614] dark:hover:text-white'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Volume controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMute}
            className="text-[#5F5B53] dark:text-[#968F84] hover:text-[#171614] dark:hover:text-white transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4 text-red-600 dark:text-red-400" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="h-1.5 w-16 cursor-pointer rounded bg-[#DED9CE] dark:bg-[#2A2723] accent-[#D94E28]"
          />
        </div>

        {/* Actions: Copy, Export WAV & Export MP3 */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#22201C] px-3 py-2 text-xs font-medium text-[#171614] dark:text-[#F3F0EA] hover:bg-[#EDEAE2] dark:hover:bg-[#2C2924] transition-colors"
            title={isAr ? 'نسخ رابط الصوت' : 'Copy Audio URL'}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-[#15803D] dark:text-emerald-400" />
                <span className="text-[#15803D] dark:text-emerald-400">
                  {isAr ? 'تم النسخ' : 'Copied'}
                </span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-[#5F5B53] dark:text-[#968F84]" />
                <span>{isAr ? 'نسخ' : 'Copy'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-lg border border-[#DED9CE] dark:border-[#2A2723] bg-[#F6F4EF] dark:bg-[#22201C] hover:bg-[#EDEAE2] dark:hover:bg-[#2C2924] px-3 py-2 text-xs font-semibold text-[#171614] dark:text-[#F3F0EA] transition-colors active:scale-95"
            title={isAr ? 'تحميل ملف WAV غير مضغوط' : 'Download uncompressed WAV'}
          >
            <Download className="h-3.5 w-3.5 text-[#D94E28] dark:text-[#EE6A43]" />
            <span>{isAr ? 'تصدير WAV' : 'Export WAV'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadMp3}
            disabled={isExportingMp3}
            className="flex items-center gap-1.5 rounded-lg bg-[#171614] dark:bg-[#F3F0EA] hover:bg-[#2E2B27] dark:hover:bg-white px-3.5 py-2 text-xs font-bold text-white dark:text-[#171614] transition-colors active:scale-95 disabled:opacity-60"
            title={isAr ? 'تحميل ملف MP3 (192kbps) مدمج بالتأثيرات' : 'Download MP3 (192kbps) with applied effects'}
          >
            {isExportingMp3 ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>
              {isExportingMp3
                ? isAr
                  ? 'جارِ التحويل...'
                  : 'Encoding...'
                : isAr
                ? 'تصدير MP3'
                : 'Export MP3'}
            </span>
          </button>
        </div>
      </div>

      {/* Subtle Take Info Line */}
      {(voiceName || dialectName) && (
        <div className="pt-2 border-t border-[#DED9CE] dark:border-[#2A2723] flex flex-wrap items-center gap-2 text-[11px] text-[#5F5B53] dark:text-[#968F84] font-mono">
          {voiceName && (
            <span className="text-[#171614] dark:text-[#F3F0EA] font-semibold">
              {voiceName}
            </span>
          )}
          {voiceName && dialectName && <span aria-hidden="true">·</span>}
          {dialectName && <span>{dialectName}</span>}
        </div>
      )}
    </div>
  );
};
