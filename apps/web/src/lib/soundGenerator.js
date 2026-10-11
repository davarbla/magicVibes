// Web Audio API Sound Generators

let audioCtx = null;

const getContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Helper to create noise buffer
const createNoiseBuffer = (ctx, duration, type = 'white') => {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = buffer.getChannelData(0);
  
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    if (type === 'brown') {
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Compensate for gain
    } else if (type === 'pink') {
      // Simplified pink noise approximation
      output[i] = (lastOut * 0.9) + (white * 0.1);
      lastOut = output[i];
      output[i] *= 2;
    } else {
      output[i] = white;
    }
  }
  return buffer;
};

export const generateBirdSound = () => {
  return new Promise((resolve) => {
    const ctx = getContext();
    const duration = 1.5;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    
    // Chirp pattern
    const now = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const startTime = now + (i * 0.4);
      osc.frequency.setValueAtTime(3000, startTime);
      osc.frequency.exponentialRampToValueAtTime(4500, startTime + 0.1);
      osc.frequency.exponentialRampToValueAtTime(3000, startTime + 0.2);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, startTime + 0.2);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + duration);
    
    setTimeout(resolve, duration * 1000);
  });
};

export const generateThunderSound = () => {
  return new Promise((resolve) => {
    const ctx = getContext();
    const duration = 3.0;
    const now = ctx.currentTime;
    
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = createNoiseBuffer(ctx, duration, 'brown');
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.linearRampToValueAtTime(100, now + duration);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(1.5, now + 0.1); // Strike
    gain.gain.exponentialRampToValueAtTime(0.5, now + 0.5);
    gain.gain.linearRampToValueAtTime(0.8, now + 0.8); // Secondary rumble
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noiseSource.start(now);
    setTimeout(resolve, duration * 1000);
  });
};

export const generateRainSound = () => {
  return new Promise((resolve) => {
    const ctx = getContext();
    const duration = 2.5;
    const now = ctx.currentTime;
    
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = createNoiseBuffer(ctx, duration, 'pink');
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 0.5;
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.5);
    gain.gain.setValueAtTime(0.3, now + duration - 0.5);
    gain.gain.linearRampToValueAtTime(0, now + duration);
    
    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noiseSource.start(now);
    setTimeout(resolve, duration * 1000);
  });
};

export const generateDogSound = () => {
  return new Promise((resolve) => {
    const ctx = getContext();
    const duration = 1.0;
    const now = ctx.currentTime;
    
    const playBark = (startTime) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, startTime);
      osc.frequency.exponentialRampToValueAtTime(100, startTime + 0.15);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, startTime);
      filter.frequency.exponentialRampToValueAtTime(400, startTime + 0.15);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.5, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + 0.2);
    };
    
    playBark(now);
    playBark(now + 0.3);
    
    setTimeout(resolve, duration * 1000);
  });
};

export const generateWaterSound = () => {
  return new Promise((resolve) => {
    const ctx = getContext();
    const duration = 2.0;
    const now = ctx.currentTime;
    
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = createNoiseBuffer(ctx, duration, 'pink');
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    
    // LFO for bubbling effect
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 8; // 8 Hz modulation
    
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 400;
    
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    
    filter.frequency.setValueAtTime(800, now);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.2);
    gain.gain.setValueAtTime(0.4, now + duration - 0.2);
    gain.gain.linearRampToValueAtTime(0, now + duration);
    
    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noiseSource.start(now);
    lfo.start(now);
    lfo.stop(now + duration);
    
    setTimeout(resolve, duration * 1000);
  });
};

export const generateWindSound = () => {
  return new Promise((resolve) => {
    const ctx = getContext();
    const duration = 3.0;
    const now = ctx.currentTime;
    
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = createNoiseBuffer(ctx, duration, 'pink');
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.0;
    
    // Slow LFO for wind howling
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.5;
    
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 600;
    
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    
    filter.frequency.setValueAtTime(400, now);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 1.0);
    gain.gain.linearRampToValueAtTime(0, now + duration);
    
    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noiseSource.start(now);
    lfo.start(now);
    lfo.stop(now + duration);
    
    setTimeout(resolve, duration * 1000);
  });
};

export const generateCricketSound = () => {
  return new Promise((resolve) => {
    const ctx = getContext();
    const duration = 2.0;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 4500;
    
    const gain = ctx.createGain();
    gain.gain.value = 0;
    
    // Rapid amplitude modulation for chirping
    const lfo = ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = 30;
    
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.1;
    
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    
    // Envelope
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    
    for (let i = 0; i < 4; i++) {
      const startTime = now + (i * 0.5);
      masterGain.gain.setValueAtTime(0, startTime);
      masterGain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      masterGain.gain.setValueAtTime(0.2, startTime + 0.2);
      masterGain.gain.linearRampToValueAtTime(0, startTime + 0.25);
    }
    
    osc.connect(gain);
    gain.connect(masterGain);
    masterGain.connect(ctx.destination);
    
    osc.start(now);
    lfo.start(now);
    osc.stop(now + duration);
    lfo.stop(now + duration);
    
    setTimeout(resolve, duration * 1000);
  });
};

export const generateOceanSound = () => {
  return new Promise((resolve) => {
    const ctx = getContext();
    const duration = 3.5;
    const now = ctx.currentTime;
    
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = createNoiseBuffer(ctx, duration, 'brown');
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    
    // Wave crashing filter sweep
    filter.frequency.setValueAtTime(100, now);
    filter.frequency.exponentialRampToValueAtTime(800, now + 1.0);
    filter.frequency.exponentialRampToValueAtTime(100, now + duration);
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.6, now + 1.0); // Crash
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration); // Recede
    
    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    noiseSource.start(now);
    setTimeout(resolve, duration * 1000);
  });
};

export const generateMagicSound = () => {
  return new Promise((resolve) => {
    const ctx = getContext();
    const duration = 2.0;
    const now = ctx.currentTime;
    
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.2;
    masterGain.connect(ctx.destination);
    
    // Arpeggio
    const notes = [880, 1108.73, 1318.51, 1760, 2217.46]; // A5, C#6, E6, A6, C#7
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const startTime = now + (i * 0.1);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(1, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 1.0);
      
      osc.connect(gain);
      gain.connect(masterGain);
      
      osc.start(startTime);
      osc.stop(startTime + 1.0);
    });
    
    setTimeout(resolve, duration * 1000);
  });
};