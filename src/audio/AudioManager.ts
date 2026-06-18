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

  // Real celluloid table tennis ball bounce on wooden table
  public playTableBounce(intensity: number = 0.8) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // High frequency plastic shell pop (primary pitch of celluloid ball)
      const oscShell = this.ctx.createOscillator();
      const gainShell = this.ctx.createGain();
      oscShell.type = "sine";
      oscShell.frequency.setValueAtTime(1150, t);
      oscShell.frequency.exponentialRampToValueAtTime(800, t + 0.05);

      gainShell.gain.setValueAtTime(0, t);
      gainShell.gain.linearRampToValueAtTime(this.volume * 0.4 * intensity, t + 0.001);
      gainShell.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);

      // Low frequency table-top wood vibration
      const oscTable = this.ctx.createOscillator();
      const gainTable = this.ctx.createGain();
      oscTable.type = "triangle";
      oscTable.frequency.setValueAtTime(160, t);
      oscTable.frequency.exponentialRampToValueAtTime(110, t + 0.08);

      gainTable.gain.setValueAtTime(0, t);
      gainTable.gain.linearRampToValueAtTime(this.volume * 0.15 * intensity, t + 0.002);
      gainTable.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);

      // Bandpass filter to sit nicely in typical ping-pong bounce frequency space
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(1100, t);
      filter.Q.setValueAtTime(2.0, t);

      oscShell.connect(filter);
      filter.connect(gainShell);
      gainShell.connect(this.ctx.destination);

      oscTable.connect(gainTable);
      gainTable.connect(this.ctx.destination);

      oscShell.start(t);
      oscShell.stop(t + 0.1);
      oscTable.start(t);
      oscTable.stop(t + 0.12);
    } catch (e) {
      console.warn("Audio bounce failed", e);
    }
  }

  // Real springy rubber + wood paddle strike sound
  public playPaddleHit(intensity: number = 0.8, isOpponent: boolean = false) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Primary solid click (the wood blade contact)
      const oscWood = this.ctx.createOscillator();
      const gainWood = this.ctx.createGain();
      oscWood.type = "sine";
      const startFreq = isOpponent ? 500 : 540;
      const endFreq = isOpponent ? 320 : 360;
      oscWood.frequency.setValueAtTime(startFreq, t);
      oscWood.frequency.exponentialRampToValueAtTime(endFreq, t + 0.04);

      gainWood.gain.setValueAtTime(0, t);
      gainWood.gain.linearRampToValueAtTime(this.volume * 0.5 * intensity, t + 0.001);
      gainWood.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);

      // Rubber click/friction (frequency noise burst)
      const noise = this.ctx.createBufferSource();
      const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.02, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      noise.buffer = noiseBuffer;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(this.volume * 0.12 * intensity, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.015);

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.setValueAtTime(1500, t);
      noiseFilter.Q.setValueAtTime(3.5, t);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      // Low frequency body vibration of the paddle handle
      const oscBody = this.ctx.createOscillator();
      const gainBody = this.ctx.createGain();
      oscBody.type = "triangle";
      oscBody.frequency.setValueAtTime(130, t);
      oscBody.frequency.exponentialRampToValueAtTime(80, t + 0.07);

      gainBody.gain.setValueAtTime(0, t);
      gainBody.gain.linearRampToValueAtTime(this.volume * 0.25 * intensity, t + 0.002);
      gainBody.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

      oscWood.connect(gainWood);
      gainWood.connect(this.ctx.destination);

      oscBody.connect(gainBody);
      gainBody.connect(this.ctx.destination);

      oscWood.start(t);
      oscWood.stop(t + 0.08);
      oscBody.start(t);
      oscBody.stop(t + 0.1);
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
