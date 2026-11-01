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
} from 'lucide-react';
import { downloadWavFile, formatTime, extractWaveformPeaks } from '../utils/audioHelper';
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
      if (audioRef.current.duration && !isNaN(audioRef.current.duration) && isFinite(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && !isNaN(audioRef.current.duration) && isFinite(audioRef.current.duration)) {
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
      <div className="rounded-xl border border-slate-800 bg-[#0b0f19] p-8 text-center">
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800/80 text-slate-400">
          <Volume2 className="h-5 w-5" />
        </div>
        <h4 className="text-sm font-semibold text-slate-200">
          {isAr ? 'مشغل الصوت الاستوديو جاهز' : 'Master Audio Player Ready'}
        </h4>
        <p className="mt-1 text-xs text-slate-400">
          {isAr
            ? 'انقر على "توليد الصوت الآن" للاستماع للمقطع الصوتي وموجات الـ WAV'
            : 'Click "Synthesize Audio" to listen to the 24kHz master output'}
        </p>
      </div>
    );
  }

  const accentColor = voiceName === 'Kore' ? 'purple' : voiceName === 'Puck' ? 'amber' : 'cyan';

  return (
    <div className="rounded-xl border border-slate-800 bg-[#090d16] p-4 shadow-lg">
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
        accentColor={accentColor}
      />

      {/* Transport Controls Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-3">
        {/* Playback Transport */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400 text-slate-950 font-bold hover:bg-cyan-300 transition-colors active:scale-95 shadow-sm"
            title={isPlaying ? (isAr ? 'إيقاف مؤقت' : 'Pause') : isAr ? 'تشغيل' : 'Play'}
          >
            {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
          </button>

          <button
            onClick={handleRestart}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            title={isAr ? 'إعادة من البداية' : 'Restart'}
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={toggleLoop}
            className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
              isLooping
                ? 'border-cyan-500 bg-cyan-950/60 text-cyan-300'
                : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
            title={isAr ? 'تكرار مستمر' : 'Toggle Loop'}
          >
            <Repeat className="h-4 w-4" />
          </button>

          {/* Speed selector tabs */}
          <div className="hidden sm:flex items-center gap-1 border-r border-l border-slate-800 px-2 mx-1">
            {[0.75, 1, 1.25, 1.5].map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`px-2 py-1 text-[11px] font-mono rounded transition-colors ${
                  playbackRate === speed
                    ? 'bg-slate-800 text-cyan-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
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
            onClick={toggleMute}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4 text-red-400" />
            ) : (
              <Volume2 className="h-4 w-4 text-slate-300" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="h-1 w-16 cursor-pointer appearance-none rounded bg-slate-800 accent-cyan-400"
          />
        </div>

        {/* Actions: Copy & Download */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            title={isAr ? 'نسخ رابط الصوت' : 'Copy Audio URL'}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">{isAr ? 'تم النسخ' : 'Copied'}</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-400" />
                <span>{isAr ? 'نسخ' : 'Copy'}</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-sm transition-colors active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isAr ? 'تصدير WAV' : 'Export WAV'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
