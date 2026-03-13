(function () {
  class RetroAudio {
    constructor() {
      this.enabled = true;
      this.ctx = null;
    }

    ensure() {
      if (!this.enabled) return null;
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    }

    beep(freq = 440, duration = 0.12, type = 'square', gainValue = 0.03) {
      const ctx = this.ensure();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = gainValue;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(gainValue, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.start(now);
      osc.stop(now + duration);
    }

    hit() { this.beep(660, 0.08, 'square', 0.04); }
    throw() { this.beep(320, 0.07, 'triangle', 0.03); }
    miss() { this.beep(180, 0.11, 'sawtooth', 0.025); }
    start() { this.beep(440, 0.08); setTimeout(() => this.beep(660, 0.08), 90); }
    end() { this.beep(220, 0.2, 'triangle', 0.035); }

    toggle() {
      this.enabled = !this.enabled;
      return this.enabled;
    }
  }

  window.retroAudio = new RetroAudio();
})();
