/**
 * Web Audio API synthesizer for calm study chimes and ambient study sounds.
 * Avoids any external audio file 404s or network lag.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Play a soothing three-tone completion chime (E5 -> G#5 -> B5)
 */
export function playChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const notes = [659.25, 830.61, 987.77]; // E5, G#5, B5 (Warm major triad)
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      // Envelope: smooth attack, gentle exponential decay
      gain.gain.setValueAtTime(0.0001, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.12 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 1.3);
    });
  } catch {
    // Audio context may not be allowed until user gesture
  }
}

/**
 * Subtle soft tick for button taps or timer starts
 */
export function playSoftClick() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.05);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  } catch {
    // ignore
  }
}

// Ambient Noise Generator (Brown / White / Rain)
let noiseNode: AudioNode | null = null;
let noiseGainNode: GainNode | null = null;

export function stopAmbientNoise() {
  if (noiseGainNode && audioCtx) {
    noiseGainNode.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    setTimeout(() => {
      try {
        if (noiseNode) {
          (noiseNode as AudioBufferSourceNode).stop();
          noiseNode.disconnect();
          noiseNode = null;
        }
      } catch {
        // ignore
      }
    }, 550);
  }
}

export function startAmbientNoise(type: 'brown' | 'white' | 'rain') {
  stopAmbientNoise();

  try {
    const ctx = getAudioContext();
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'brown') {
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // Gain compensation
      }
    } else if (type === 'rain') {
      // Pinkish noise with low-pass filter
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2 + white * 0.5362) * 0.3;
      }
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;
    whiteNoise.loop = true;

    const filter = ctx.createBiquadFilter();
    if (type === 'brown') {
      filter.type = 'lowpass';
      filter.frequency.value = 400;
    } else if (type === 'rain') {
      filter.type = 'lowpass';
      filter.frequency.value = 850;
    } else {
      filter.type = 'lowpass';
      filter.frequency.value = 2500;
    }

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 1.0); // Soft, non-intrusive volume

    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    whiteNoise.start(0);
    noiseNode = whiteNoise;
    noiseGainNode = gainNode;
  } catch {
    // User might need to interact first
  }
}
