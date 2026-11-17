// Moonlit Catch: every sound is synthesized with WebAudio, no audio files.
// The context is created on the first user gesture, so browsers allow it.
export function createNightAudio() {
  let context = null;
  let muted = false;
  let ambientNodes = null;

  function ensureContext() {
    if (context) return context;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    context = new AudioContextClass();
    return context;
  }

  function unlockAudio() {
    const ctx = ensureContext();
    if (ctx && ctx.state === 'suspended') void ctx.resume();
    startAmbientWaves();
  }

  function tone(frequency, duration, type, volume, slideTo) {
    if (muted) return;
    const ctx = ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.05);
  }

  // A soft looping wash of filtered noise: the sea at night.
  function startAmbientWaves() {
    if (ambientNodes || !context) return;
    const length = context.sampleRate * 2;
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    const gain = context.createGain();
    gain.gain.value = 0.035;
    const lfo = context.createOscillator();
    lfo.frequency.value = 0.12;
    const lfoGain = context.createGain();
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    source.start();
    lfo.start();
    ambientNodes = { source, lfo };
  }

  function playSplash() {
    tone(520, 0.18, 'sine', 0.16, 140);
    tone(900, 0.1, 'triangle', 0.07, 300);
  }

  function playReelTick() {
    tone(1150, 0.05, 'square', 0.035, 950);
  }

  function playCatchChime(combo) {
    const base = 523 * Math.pow(1.059, Math.min(combo, 5));
    tone(base, 0.22, 'sine', 0.18);
    setTimeout(() => tone(base * 1.5, 0.3, 'sine', 0.16), 70);
    setTimeout(() => tone(base * 2, 0.34, 'sine', 0.12), 140);
  }

  function playJunkClunk() {
    tone(180, 0.16, 'sawtooth', 0.12, 90);
  }

  function playSting() {
    tone(220, 0.3, 'sawtooth', 0.14, 55);
    tone(110, 0.35, 'square', 0.07, 50);
  }

  function playDawnBell() {
    tone(392, 0.9, 'sine', 0.2);
    setTimeout(() => tone(523, 1.1, 'sine', 0.18), 220);
    setTimeout(() => tone(659, 1.4, 'sine', 0.15), 440);
  }

  function playQuotaFanfare() {
    [523, 659, 784, 1047].forEach((frequency, index) => {
      setTimeout(() => tone(frequency, 0.4, 'triangle', 0.16), index * 110);
    });
  }

  function toggleMuted() {
    muted = !muted;
    return muted;
  }

  return {
    unlockAudio,
    playSplash,
    playReelTick,
    playCatchChime,
    playJunkClunk,
    playSting,
    playDawnBell,
    playQuotaFanfare,
    toggleMuted,
    isMuted: () => muted,
  };
}
