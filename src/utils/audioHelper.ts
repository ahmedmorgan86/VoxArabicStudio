/**
 * Utility functions for audio playback, WAV/MP3 downloading, waveform extraction, and Web Speech API fallback
 */
import { Mp3Encoder } from '@breezystack/lamejs';

export function base64ToBlob(base64: string, mimeType = 'audio/wav'): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

export function downloadBlob(blob: Blob, filename: string) {
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

export function downloadWavFile(base64: string, filename = 'speech.wav') {
  const blob = base64ToBlob(base64, 'audio/wav');
  downloadBlob(blob, filename);
}

/**
 * Parses a base64 WAV (mono or stereo, including DSP effects like Reverb/Compression)
 * and encodes it to a 192kbps MP3 Blob using LAME.
 */
export function wavBase64ToMp3Blob(base64Wav: string, kbps = 192): Blob {
  const binary = atob(base64Wav);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const view = new DataView(bytes.buffer);

  // Default WAV parameters
  let numChannels = 1;
  let sampleRate = 24000;
  let bitsPerSample = 16;
  let dataOffset = 44;
  let dataSize = Math.max(0, bytes.length - 44);

  // Parse RIFF/WAVE chunks cleanly to locate fmt and data
  if (bytes.length >= 12) {
    let pos = 12;
    while (pos + 8 <= bytes.length) {
      const chunkId = String.fromCharCode(
        bytes[pos],
        bytes[pos + 1],
        bytes[pos + 2],
        bytes[pos + 3]
      );
      const chunkSize = view.getUint32(pos + 4, true);

      if (chunkId === 'fmt ' && pos + 24 <= bytes.length) {
        numChannels = view.getUint16(pos + 10, true) || 1;
        sampleRate = view.getUint32(pos + 12, true) || 24000;
        bitsPerSample = view.getUint16(pos + 22, true) || 16;
      } else if (chunkId === 'data') {
        dataOffset = pos + 8;
        dataSize = Math.min(chunkSize, bytes.length - dataOffset);
        break;
      }

      pos += 8 + chunkSize + (chunkSize % 2);
    }
  }

  const channels = Math.min(2, Math.max(1, numChannels));
  const bytesPerSample = Math.max(1, bitsPerSample / 8);
  const blockAlign = numChannels * bytesPerSample;
  const numFrames = Math.floor(dataSize / blockAlign);

  const left = new Int16Array(numFrames);
  const right = channels === 2 ? new Int16Array(numFrames) : null;

  for (let i = 0; i < numFrames; i++) {
    const frameOffset = dataOffset + i * blockAlign;
    if (frameOffset + 1 < bytes.length) {
      left[i] = view.getInt16(frameOffset, true);
    }
    if (right && frameOffset + bytesPerSample + 1 < bytes.length) {
      right[i] = view.getInt16(frameOffset + bytesPerSample, true);
    }
  }

  const mp3Encoder = new Mp3Encoder(channels, sampleRate, kbps);
  const mp3Chunks: BlobPart[] = [];
  const sampleBlockSize = 1152;

  for (let i = 0; i < numFrames; i += sampleBlockSize) {
    const end = Math.min(i + sampleBlockSize, numFrames);
    const leftChunk = left.subarray(i, end);
    const mp3buf =
      channels === 2 && right
        ? mp3Encoder.encodeBuffer(leftChunk, right.subarray(i, end))
        : mp3Encoder.encodeBuffer(leftChunk);

    if (mp3buf.length > 0) {
      const copy = new Uint8Array(mp3buf.length);
      copy.set(mp3buf);
      mp3Chunks.push(copy.buffer);
    }
  }

  const flushBuf = mp3Encoder.flush();
  if (flushBuf.length > 0) {
    const copy = new Uint8Array(flushBuf.length);
    copy.set(flushBuf);
    mp3Chunks.push(copy.buffer);
  }

  return new Blob(mp3Chunks, { type: 'audio/mpeg' });
}

export function downloadMp3File(
  base64Wav: string,
  filename = 'speech.mp3',
  kbps = 192
) {
  const mp3Blob = wavBase64ToMp3Blob(base64Wav, kbps);
  downloadBlob(mp3Blob, filename);
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
