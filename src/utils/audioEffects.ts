import { AudioEffectsConfig, ReverbSpace } from '../types';

/**
 * Generates an artificial stereo impulse response buffer for Web Audio ConvolverNode
 * with natural pre-delay and frequency-damped exponential decay.
 */
function createReverbImpulse(
  ctx: BaseAudioContext,
  space: ReverbSpace
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const presets: Record<ReverbSpace, { duration: number; decay: number; preDelayMs: number }> = {
    studio: { duration: 0.85, decay: 3.4, preDelayMs: 12 },
    hall: { duration: 1.75, decay: 2.5, preDelayMs: 22 },
    cathedral: { duration: 2.75, decay: 1.9, preDelayMs: 32 },
  };

  const { duration, decay, preDelayMs } = presets[space] || presets.hall;
  const length = Math.floor(sampleRate * duration);
  const preDelaySamples = Math.floor((preDelayMs / 1000) * sampleRate);
  const impulse = ctx.createBuffer(2, length, sampleRate);

  for (let ch = 0; ch < 2; ch++) {
    const channelData = impulse.getChannelData(ch);
    let lpState = 0;
    for (let i = 0; i < length; i++) {
      if (i < preDelaySamples) {
        channelData[i] = 0;
        continue;
      }
      const n = (i - preDelaySamples) / (length - preDelaySamples);
      const envelope = Math.pow(1 - n, decay);
      const white = Math.random() * 2 - 1;
      // Gentle low-pass damping so late reflections sound warm rather than harsh
      lpState = lpState * 0.45 + white * 0.55;
      channelData[i] = lpState * envelope * 0.65;
    }
  }

  return impulse;
}

/**
 * Encodes an AudioBuffer (mono or stereo, downmixed cleanly to mono 16-bit PCM WAV
 * or stereo 16-bit PCM WAV) back into a base64 WAV string.
 */
function encodeAudioBufferToWavBase64(buffer: AudioBuffer): string {
  const numChannels = Math.min(2, buffer.numberOfChannels);
  const sampleRate = buffer.sampleRate;
  const numSamples = buffer.length;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = numSamples * blockAlign;
  const wavBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(wavBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF Header
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Peak check for anti-clipping normalization
  const channels: Float32Array[] = [];
  let maxPeak = 0;
  for (let ch = 0; ch < numChannels; ch++) {
    const data = buffer.getChannelData(ch);
    channels.push(data);
    for (let i = 0; i < numSamples; i++) {
      const abs = Math.abs(data[i]);
      if (abs > maxPeak) maxPeak = abs;
    }
  }

  const normalizeScale = maxPeak > 0.96 ? 0.96 / maxPeak : 1.0;

  // Interleave & write 16-bit PCM samples
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let sample = channels[ch][i] * normalizeScale;
      sample = Math.max(-1, Math.min(1, sample));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  // Convert ArrayBuffer to base64 in chunks to avoid call-stack limits
  const bytes = new Uint8Array(wavBuffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

/**
 * Applies studio DSP effects (EQ Warmth, Dynamics Compression, Stereo Reverb)
 * to a base64 WAV audio clip using OfflineAudioContext and returns a new base64 WAV.
 */
export async function applyAudioEffectsToWavBase64(
  base64Wav: string,
  config: AudioEffectsConfig
): Promise<string> {
  if (!config.reverbEnabled && !config.compressionEnabled && !config.warmthEnabled) {
    return base64Wav;
  }

  if (typeof window === 'undefined') {
    return base64Wav;
  }

  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const OfflineCtx = window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext;

  if (!AudioCtx || !OfflineCtx) {
    return base64Wav;
  }

  try {
    // Decode base64 WAV -> ArrayBuffer
    const binaryStr = atob(base64Wav);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const tempCtx = new AudioCtx();
    const decodedBuffer = await tempCtx.decodeAudioData(bytes.buffer.slice(0));
    await tempCtx.close().catch(() => {});

    // Add tail room if reverb is enabled so the tail decays smoothly
    const tailSeconds = config.reverbEnabled
      ? config.reverbSpace === 'cathedral'
        ? 2.2
        : config.reverbSpace === 'hall'
        ? 1.5
        : 0.8
      : 0.05;

    const outputChannels = config.reverbEnabled ? 2 : decodedBuffer.numberOfChannels;
    const totalLength = decodedBuffer.length + Math.floor(tailSeconds * decodedBuffer.sampleRate);

    const offlineCtx = new OfflineCtx(
      outputChannels,
      totalLength,
      decodedBuffer.sampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = decodedBuffer;

    let currentNode: AudioNode = source;

    // Stage 1: Broadcast Warmth & Presence EQ
    if (config.warmthEnabled) {
      const lowShelf = offlineCtx.createBiquadFilter();
      lowShelf.type = 'lowshelf';
      lowShelf.frequency.value = 160;
      lowShelf.gain.value = 2.6;

      const presencePeak = offlineCtx.createBiquadFilter();
      presencePeak.type = 'peaking';
      presencePeak.frequency.value = 3400;
      presencePeak.Q.value = 0.9;
      presencePeak.gain.value = 2.4;

      currentNode.connect(lowShelf);
      lowShelf.connect(presencePeak);
      currentNode = presencePeak;
    }

    // Stage 2: Dynamics Compression
    if (config.compressionEnabled) {
      const amount = Math.max(0, Math.min(100, config.compressionAmount)) / 100;
      const compressor = offlineCtx.createDynamicsCompressor();
      compressor.threshold.value = -12 - amount * 22; // -12dB to -34dB
      compressor.knee.value = 12;
      compressor.ratio.value = 2.2 + amount * 8.0; // 2.2:1 to 10.2:1
      compressor.attack.value = 0.004;
      compressor.release.value = 0.16;

      const makeupGain = offlineCtx.createGain();
      makeupGain.gain.value = 1.0 + amount * 0.45;

      currentNode.connect(compressor);
      compressor.connect(makeupGain);
      currentNode = makeupGain;
    }

    // Stage 3: Stereo Reverb (Dry / Wet parallel mix)
    if (config.reverbEnabled) {
      const mix = Math.max(0.05, Math.min(0.75, config.reverbMix));
      const dryGain = offlineCtx.createGain();
      dryGain.gain.value = 1 - mix * 0.35;

      const wetGain = offlineCtx.createGain();
      wetGain.gain.value = mix * 0.9;

      const convolver = offlineCtx.createConvolver();
      convolver.buffer = createReverbImpulse(offlineCtx, config.reverbSpace);

      currentNode.connect(dryGain);
      currentNode.connect(convolver);
      convolver.connect(wetGain);

      dryGain.connect(offlineCtx.destination);
      wetGain.connect(offlineCtx.destination);
    } else {
      currentNode.connect(offlineCtx.destination);
    }

    source.start(0);
    const renderedBuffer = await offlineCtx.startRendering();
    return encodeAudioBufferToWavBase64(renderedBuffer);
  } catch (err) {
    console.warn('Audio effects DSP processing bypassed due to error:', err);
    return base64Wav;
  }
}

export function formatEffectsSummary(
  config: AudioEffectsConfig,
  lang: 'ar' | 'en'
): string {
  const parts: string[] = [];
  if (config.reverbEnabled) {
    const spaceMap = {
      studio: lang === 'ar' ? 'صدى استوديو' : 'Studio Reverb',
      hall: lang === 'ar' ? 'صدى قاعة' : 'Hall Reverb',
      cathedral: lang === 'ar' ? 'صدى ملحمي' : 'Epic Reverb',
    };
    parts.push(`${spaceMap[config.reverbSpace]} ${Math.round(config.reverbMix * 100)}%`);
  }
  if (config.compressionEnabled) {
    parts.push(
      lang === 'ar'
        ? `ضغط صوتي ${config.compressionAmount}%`
        : `Comp ${config.compressionAmount}%`
    );
  }
  if (config.warmthEnabled) {
    parts.push(lang === 'ar' ? 'دفء البث' : 'Broadcast EQ');
  }
  return parts.join(' · ');
}
