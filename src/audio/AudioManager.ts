class AudioManager {
  private ctx: AudioContext | null = null;
  private volume: number = 0.6;
  private enabled: boolean = true;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
  }

  public setEnabled(flag: boolean) {
    this.enabled = flag;
  }

  // Soft wooden table bounce sound
  public playTableBounce(intensity: number = 0.8) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Base sine osc for wood hollow resonance
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      // Starts around 220Hz, drops to 160Hz quickly
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.08);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(this.volume * 0.3 * intensity, t + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

      // Low-pass filter to keep it woody and soft, not pingy
      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(350, t);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.15);
    } catch (e) {
      console.warn("Audio bounce failed", e);
    }
  }

  // Soft rubber paddle hit sound
  public playPaddleHit(intensity: number = 0.8, isOpponent: boolean = false) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Low freq sine body
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      const startFreq = isOpponent ? 280 : 310;
      const endFreq = isOpponent ? 180 : 210;
      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.06);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(this.volume * 0.45 * intensity, t + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);

      // Add a tiny bit of white noise filter sweep for the rubber friction strike
      const noise = this.ctx.createBufferSource();
      const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.015, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      noise.buffer = noiseBuffer;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(this.volume * 0.08 * intensity, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.015);

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.setValueAtTime(1200, t);
      noiseFilter.Q.setValueAtTime(3, t);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      // Low pass on the main osc
      const bodyFilter = this.ctx.createBiquadFilter();
      bodyFilter.type = "lowpass";
      bodyFilter.frequency.setValueAtTime(800, t);

      osc.connect(bodyFilter);
      bodyFilter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.12);
      noise.start(t);
    } catch (e) {
      console.warn("Audio hit failed", e);
    }
  }

  // Snare/buzz-like hit on the net
  public playNetTouch() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.linearRampToValueAtTime(90, t + 0.1);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(this.volume * 0.25, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);

      // White noise buzz
      const noise = this.ctx.createBufferSource();
      const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.08, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      noise.buffer = noiseBuffer;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(this.volume * 0.15, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

      const flt = this.ctx.createBiquadFilter();
      flt.type = "bandpass";
      flt.frequency.setValueAtTime(400, t);

      noise.connect(flt);
      flt.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.16);
      noise.start(t);
    } catch (e) {
      console.warn("Audio net-touch failed", e);
    }
  }

  // Soft high-frequency chimes / zen bell
  public playScorePoint(forPlayer: boolean = true) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      const gain2 = this.ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";

      // Dual notes making a beautiful warm cord (Major 3rd or Perfect 5th)
      const baseFreq = forPlayer ? 523.25 : 440.0; // C5 (Player score happy) or A4 (Opponent score soft)
      const secondaryFreq = forPlayer ? 659.25 : 554.37; // E5 or C#5

      osc1.frequency.setValueAtTime(baseFreq, t);
      osc2.frequency.setValueAtTime(secondaryFreq, t);

      gain1.gain.setValueAtTime(0, t);
      gain1.gain.linearRampToValueAtTime(this.volume * 0.15, t + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);

      gain2.gain.setValueAtTime(0, t);
      gain2.gain.linearRampToValueAtTime(this.volume * 0.12, t + 0.04);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);

      const filter = this.ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1200, t);

      osc1.connect(filter);
      osc2.connect(filter);

      filter.connect(gain1);
      filter.connect(gain2);

      gain1.connect(this.ctx.destination);
      gain2.connect(this.ctx.destination);

      osc1.start(t);
      osc1.stop(t + 0.9);
      osc2.start(t);
      osc2.stop(t + 0.9);
    } catch (e) {
      console.warn("Audio score fail", e);
    }
  }

  public playMenuHover() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(450, t + 0.02);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(this.volume * 0.08, t + 0.001);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.04);
    } catch (e) {
      // ignore silently since hover triggered very frequently
    }
  }

  public playMenuSelect() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(350, t);
      osc.frequency.exponentialRampToValueAtTime(700, t + 0.08);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(this.volume * 0.16, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.2);
    } catch (e) {
      // ignore
    }
  }
}

export const audioManager = new AudioManager();
