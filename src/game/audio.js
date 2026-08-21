// Web Audio programmatic SFX manager
class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.enabled = true;
  }

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.4;
    this.master.connect(this.ctx.destination);
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setEnabled(v) {
    this.enabled = v;
    if (this.master) {
      this.master.gain.value = v ? 0.4 : 0;
    }
  }

  _envelope(node, attack, decay, sustain, release, peak = 1) {
    const t = this.ctx.currentTime;
    node.gain.cancelScheduledValues(t);
    node.gain.setValueAtTime(0, t);
    node.gain.linearRampToValueAtTime(peak, t + attack);
    node.gain.linearRampToValueAtTime(sustain * peak, t + attack + decay);
    node.gain.linearRampToValueAtTime(0, t + attack + decay + release);
  }

  _tone(freq, type, dur, peak = 0.6, freqEnd = null) {
    if (!this.ctx || !this.enabled) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (freqEnd !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), this.ctx.currentTime + dur);
    }
    this._envelope(g, 0.005, 0.03, 0.4, dur, peak);
    osc.connect(g);
    g.connect(this.master);
    osc.start();
    osc.stop(this.ctx.currentTime + dur + 0.05);
  }

  // Kick / shoot: punchy low-mid pop
  kick() {
    if (!this.ctx || !this.enabled) return;
    this._tone(220, 'square', 0.09, 0.5, 60);
    this._tone(660, 'triangle', 0.06, 0.15);
  }

  // Header: sharp "thock" impact — punchy mid thud + high tick
  header() {
    if (!this.ctx || !this.enabled) return;
    this._tone(300, 'square', 0.07, 0.6, 120);
    this._tone(1000, 'triangle', 0.05, 0.3, 500);
    this._tone(140, 'sine', 0.09, 0.35, 70);
  }

  jump() {
    if (!this.ctx || !this.enabled) return;
    this._tone(320, 'triangle', 0.12, 0.35, 720);
  }

  bounce() {
    if (!this.ctx || !this.enabled) return;
    this._tone(180, 'sine', 0.06, 0.2, 90);
  }

  goal() {
    if (!this.ctx || !this.enabled) return;
    // Ascending siren
    const notes = [440, 554, 659, 880];
    notes.forEach((f, i) => {
      setTimeout(() => this._tone(f, 'sawtooth', 0.15, 0.5), i * 90);
    });
    setTimeout(() => this._tone(1200, 'triangle', 0.35, 0.4, 300), 400);
  }

  whistle() {
    if (!this.ctx || !this.enabled) return;
    this._tone(2200, 'sine', 0.5, 0.35, 1800);
  }

  menu() {
    if (!this.ctx || !this.enabled) return;
    this._tone(880, 'square', 0.05, 0.3);
  }

  menuBack() {
    if (!this.ctx || !this.enabled) return;
    this._tone(440, 'square', 0.05, 0.3);
  }

  countdown() {
    if (!this.ctx || !this.enabled) return;
    this._tone(880, 'sine', 0.08, 0.4);
  }
}

export const audio = new AudioManager();
