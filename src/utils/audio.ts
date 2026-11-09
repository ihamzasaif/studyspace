/**
 * Web Audio API synthesizer for calm study chimes and ambient study sounds.
 * Fully self-contained, zero external audio dependencies or network latency.
 */

let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Play a soothing three-tone completion chime (E5 -> G#5 -> B5)
 */
export function playChime() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    const notes = [659.25, 830.61, 987.77]; // E5, G#5, B5 (Warm major triad)
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      // Smooth attack, gentle exponential decay
      gain.gain.setValueAtTime(0.0001, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.2, now + idx * 0.12 + 0.04);
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
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.05);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  } catch {
    // ignore
  }
}

// Ambient Noise Generator (Brown / White / Rain / Waves)
let currentSourceNode: AudioBufferSourceNode | null = null;
let currentGainNode: GainNode | null = null;
let lfoOsc: OscillatorNode | null = null;

export function stopAmbientNoise() {
  if (currentGainNode && audioCtx) {
    try {
      const now = audioCtx.currentTime;
      currentGainNode.gain.cancelScheduledValues(now);
      currentGainNode.gain.setValueAtTime(currentGainNode.gain.value, now);
      currentGainNode.gain.linearRampToValueAtTime(0.0001, now + 0.25);
    } catch {
      // ignore
    }
  }

  const oldSource = currentSourceNode;
  const oldLfo = lfoOsc;
  currentSourceNode = null;
  currentGainNode = null;
  lfoOsc = null;

  if (oldSource) {
    setTimeout(() => {
      try {
        oldSource.stop();
        oldSource.disconnect();
        if (oldLfo) {
          oldLfo.stop();
          oldLfo.disconnect();
        }
      } catch {
        // ignore
      }
    }, 280);
  }
}

export function startAmbientNoise(type: 'brown' | 'white' | 'rain' | 'waves', volume: number = 0.25) {
  // Stop existing sound smoothly
  stopAmbientNoise();

  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // 5 seconds of stereo noise for rich looping texture
    const sampleRate = ctx.sampleRate;
    const bufferSize = 5 * sampleRate;
    const buffer = ctx.createBuffer(2, bufferSize, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        left[i] = (Math.random() * 2 - 1) * 0.4;
        right[i] = (Math.random() * 2 - 1) * 0.4;
      }
    } else if (type === 'brown') {
      // Deep warm brownian noise
      let lastLeft = 0.0;
      let lastRight = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const whiteL = Math.random() * 2 - 1;
        const whiteR = Math.random() * 2 - 1;
        lastLeft = (lastLeft + 0.04 * whiteL) / 1.04;
        lastRight = (lastRight + 0.04 * whiteR) / 1.04;
        left[i] = lastLeft * 4.2;
        right[i] = lastRight * 4.2;
      }
    } else if (type === 'rain') {
      // Pinkish rain with random drop fluctuations
      let b0L = 0, b1L = 0, b2L = 0;
      let b0R = 0, b1R = 0, b2R = 0;
      for (let i = 0; i < bufferSize; i++) {
        const whiteL = Math.random() * 2 - 1;
        const whiteR = Math.random() * 2 - 1;
        b0L = 0.99886 * b0L + whiteL * 0.0555179;
        b1L = 0.99332 * b1L + whiteL * 0.0750759;
        b2L = 0.96900 * b2L + whiteL * 0.1538520;
        left[i] = (b0L + b1L + b2L + whiteL * 0.5362) * 0.45;

        b0R = 0.99886 * b0R + whiteR * 0.0555179;
        b1R = 0.99332 * b1R + whiteR * 0.0750759;
        b2R = 0.96900 * b2R + whiteR * 0.1538520;
        right[i] = (b0R + b1R + b2R + whiteR * 0.5362) * 0.45;
      }
    } else if (type === 'waves') {
      // Ocean waves: Brownian baseline
      let lastLeft = 0.0;
      let lastRight = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const whiteL = Math.random() * 2 - 1;
        const whiteR = Math.random() * 2 - 1;
        lastLeft = (lastLeft + 0.035 * whiteL) / 1.035;
        lastRight = (lastRight + 0.035 * whiteR) / 1.035;
        left[i] = lastLeft * 4.5;
        right[i] = lastRight * 4.5;
      }
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Filters for natural timbre
    const filter = ctx.createBiquadFilter();
    if (type === 'brown') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, ctx.currentTime);
      filter.Q.setValueAtTime(0.8, ctx.currentTime);
    } else if (type === 'rain') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1100, ctx.currentTime);
      filter.Q.setValueAtTime(0.5, ctx.currentTime);
    } else if (type === 'waves') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, ctx.currentTime);
    } else {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, ctx.currentTime);
    }

    const gainNode = ctx.createGain();
    const targetGain = Math.max(0.08, Math.min(volume, 0.45));
    gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 0.5);

    // If ocean waves, add a slow LFO for wave ebb and flow
    if (type === 'waves') {
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // ~8 second wave cycle
      lfoGain.gain.setValueAtTime(0.35 * targetGain, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(gainNode.gain);
      lfo.start();
      lfoOsc = lfo;
    }

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(0);
    currentSourceNode = source;
    currentGainNode = gainNode;
  } catch (err) {
    console.warn('Ambient noise playback error:', err);
  }
}
