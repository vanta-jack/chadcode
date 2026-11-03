// Procedural Web Audio Engine — Zero external .mp3 or .wav assets
// Combines DESIGN.md SoundFX signatures and Section 3 procedural synthesizer

export const SoundFX = {
  // Commit Slam: Sub-bass sine drop + 120ms filtered noise burst for physical punch
  playCommitSlam(ctx: AudioContext) {
    const now = ctx.currentTime;

    // 1. Sub-bass sine drop (160Hz -> 80Hz -> 32Hz exponential decay)
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.04);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.18);

    oscGain.gain.setValueAtTime(0.8, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.65);

    // 2. Filtered noise burst for physical impact transient (extended for dramatic weight)
    const duration = 0.55;
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(950, now);
    filter.Q.setValueAtTime(1.4, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.45, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    whiteNoise.start(now);
    whiteNoise.stop(now + duration);
  },

  // Countdown Tick: Accelerating FM/triangle blip
  playCountdownTick(ctx: AudioContext, pitch: number = 880) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, now);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  },

  // Demotion Crash: Distorted sawtooth/square wave explosion
  playAuditCrash(ctx: AudioContext) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 1.0);
    gain.gain.setValueAtTime(0.85, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.1);
  },

  // Concept Unlocked: Tri-tone ascending crystalline arpeggio (Steam-style badge unlock)
  playConceptUnlocked(ctx: AudioContext) {
    const now = ctx.currentTime;
    const notes = [587.33, 880, 1174.66]; // D5, A5, D6
    const noteDuration = 0.09;

    notes.forEach((freq, idx) => {
      const noteTime = now + idx * 0.075;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.22, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.005, noteTime + noteDuration + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + noteDuration + 0.16);
    });

    // High shimmer transient
    const shimmerOsc = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmerOsc.type = 'triangle';
    shimmerOsc.frequency.setValueAtTime(2349.32, now + 0.16); // D7
    shimmerGain.gain.setValueAtTime(0.08, now + 0.16);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    shimmerOsc.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);
    shimmerOsc.start(now + 0.16);
    shimmerOsc.stop(now + 0.46);
  },
};

function makeDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
  const k = typeof amount === 'number' ? amount : 50;
  const nSamples = 44100;
  const buffer = new ArrayBuffer(nSamples * 4);
  const curve = new Float32Array(buffer);
  const deg = Math.PI / 180;
  for (let i = 0; i < nSamples; ++i) {
    const x = (i * 2) / nSamples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

class ProceduralSoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private listeners: Set<(muted: boolean) => void> = new Set();

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') {
      return null;
    }
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {
        // Ignore autoplay restriction until user gesture completes
      });
    }
    return this.ctx;
  }

  public unlock(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
    this.listeners.forEach((listener) => listener(this.muted));
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  public subscribe(listener: (muted: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // 10ms filtered white noise burst for terminal typing
  public playKeyClick(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 0.01; // 10ms
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1800, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + duration);
  }

  // 15ms high-pitched sine click (2400Hz)
  public playHoverTick(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 0.015; // 15ms
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400, now);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  // 80Hz sine drop with exponential decay + 120ms filtered noise burst
  public playCommitSlam(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    SoundFX.playCommitSlam(ctx);
  }

  // Low rumble frequency modulation with distortion (extended duration for violent impact)
  public playDamageShake(severe: boolean = false): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = severe ? 1.05 : 0.68;

    const carrier = ctx.createOscillator();
    const modulator = ctx.createOscillator();
    const modGain = ctx.createGain();
    const shaper = ctx.createWaveShaper();
    const masterGain = ctx.createGain();

    carrier.type = severe ? 'sawtooth' : 'triangle';
    carrier.frequency.setValueAtTime(severe ? 72 : 95, now);
    carrier.frequency.exponentialRampToValueAtTime(22, now + duration);

    modulator.type = 'square';
    modulator.frequency.setValueAtTime(severe ? 34 : 48, now);
    modGain.gain.setValueAtTime(severe ? 45 : 20, now);

    shaper.curve = makeDistortionCurve(severe ? 120 : 45);
    shaper.oversample = '2x';

    masterGain.gain.setValueAtTime(severe ? 0.65 : 0.35, now);
    masterGain.gain.exponentialRampToValueAtTime(0.008, now + duration);

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);
    carrier.connect(shaper);
    shaper.connect(masterGain);
    masterGain.connect(ctx.destination);

    modulator.start(now);
    carrier.start(now);
    modulator.stop(now + duration);
    carrier.stop(now + duration);

    if (severe) {
      SoundFX.playAuditCrash(ctx);
    }
  }

  // Discordant square-wave alarm burst
  public playTimeoutBuzzer(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 1.05;

    const oscA = ctx.createOscillator();
    const oscB = ctx.createOscillator();
    const gain = ctx.createGain();

    oscA.type = 'square';
    oscB.type = 'square';

    // Discordant tritone / minor second cluster
    oscA.frequency.setValueAtTime(146.83, now);
    oscB.frequency.setValueAtTime(207.65, now);

    // Rapid alarm pulse envelope
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.setValueAtTime(0.05, now + 0.12);
    gain.gain.setValueAtTime(0.45, now + 0.18);
    gain.gain.setValueAtTime(0.05, now + 0.32);
    gain.gain.setValueAtTime(0.5, now + 0.38);
    gain.gain.exponentialRampToValueAtTime(0.008, now + duration);

    oscA.connect(gain);
    oscB.connect(gain);
    gain.connect(ctx.destination);

    oscA.start(now);
    oscB.start(now);
    oscA.stop(now + duration);
    oscB.stop(now + duration);
  }

  // Countdown tick with pitch escalation when time is critical
  public playCountdownTick(timerSec: number): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const pitch = timerSec <= 5 ? 1320 + (5 - timerSec) * 160 : 880;
    SoundFX.playCountdownTick(ctx, pitch);
  }

  // Steam-style badge/concept unlock arpeggio chime
  public playConceptUnlocked(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    SoundFX.playConceptUnlocked(ctx);
  }
}

export const soundEngine = new ProceduralSoundEngine();

export const playKeyClick = () => soundEngine.playKeyClick();
export const playHoverTick = () => soundEngine.playHoverTick();
export const playCommitSlam = () => soundEngine.playCommitSlam();
export const playDamageShake = (severe?: boolean) =>
  soundEngine.playDamageShake(severe);
export const playTimeoutBuzzer = () => soundEngine.playTimeoutBuzzer();
export const playCountdownTick = (timerSec: number) =>
  soundEngine.playCountdownTick(timerSec);
export const playConceptUnlocked = () => soundEngine.playConceptUnlocked();
