/**
 * Utility functions for audio playback, WAV downloading, waveform extraction, and Web Speech API fallback
 */

export function base64ToBlob(base64: string, mimeType = 'audio/wav'): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

export function downloadWavFile(base64: string, filename = 'speech.wav') {
  const blob = base64ToBlob(base64, 'audio/wav');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 150);
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Extracts true PCM audio peak values (0.05 to 1.0) from a base64 WAV file
 * for ultra-crisp, accurate SoundCloud/Descript-style waveform visualization
 */
export function extractWaveformPeaks(base64: string, numPeaks = 48): number[] {
  try {
    const binary = atob(base64);
    const dataOffset = 44; // Standard WAV header size
    const totalBytes = binary.length;
    if (totalBytes <= dataOffset) {
      return Array(numPeaks).fill(0.3);
    }

    const numSamples = Math.floor((totalBytes - dataOffset) / 2);
    const step = Math.max(1, Math.floor(numSamples / numPeaks));
    const peaks: number[] = [];

    for (let i = 0; i < numPeaks; i++) {
      let max = 0;
      const startByte = dataOffset + i * step * 2;
      const endByte = Math.min(startByte + step * 2, totalBytes);

      for (let j = startByte; j < endByte; j += 4) {
        if (j + 1 < totalBytes) {
          const byte1 = binary.charCodeAt(j);
          const byte2 = binary.charCodeAt(j + 1);
          let sample = byte1 | (byte2 << 8);
          if (sample >= 32768) sample -= 65536; // 16-bit signed
          const abs = Math.abs(sample);
          if (abs > max) max = abs;
        }
      }

      const normalized = Math.min(1, Math.max(0.1, max / 28000));
      peaks.push(Number(normalized.toFixed(3)));
    }

    return peaks;
  } catch (err) {
    console.error('Error extracting peaks:', err);
    return Array(numPeaks).fill(0.35);
  }
}

/**
 * Instant Browser Web Speech API helper for rapid local previews
 */
export function speakWithBrowserWebSpeech(
  text: string,
  lang: 'ar' | 'en' = 'ar',
  onEnd?: () => void
): { stop: () => void } {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return { stop: () => {} };
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  // Try to find matching voice
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find((v) =>
    lang === 'ar' ? v.lang.startsWith('ar') : v.lang.startsWith('en')
  );
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);

  return {
    stop: () => window.speechSynthesis.cancel(),
  };
}

export function stopBrowserWebSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
