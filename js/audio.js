(function () {
  class RetroAudio {
    constructor() {
      this.enabled = true;
      this.ctx = null;
      this.master = null;
      this.bgmTimer = null;
      this.noteIndex = 0;
      this.started = false;
      this.melody = [392, 440, 523.25, 587.33, 523.25, 440, 392, 329.63];
      this.bass = [130.81, 146.83, 174.61, 146.83];
    }

    ensure() {
      if (!this.enabled) return null;
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.16;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    }

    pulse(freq = 440, duration = 0.12, type = 'square', gainValue = 0.04, whenOffset = 0) {
      const ctx = this.ensure();
      if (!ctx || !this.master) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(this.master);
      const now = ctx.currentTime + whenOffset;
      gain.gain.setValueAtTime(gainValue, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.start(now);
      osc.stop(now + duration);
    }

    hit() {
      this.pulse(659.25, 0.08, 'square', 0.05);
      this.pulse(880, 0.06, 'triangle', 0.025, 0.03);
    }

    miss() {
      this.pulse(174.61, 0.12, 'sawtooth', 0.03);
    }

    throw() {
      this.pulse(329.63, 0.07, 'triangle', 0.03);
    }

    warmupAndStart() {
      const ctx = this.ensure();
      if (!ctx) return;
      if (!this.started) {
        this.started = true;
        this.startTheme();
      }
    }

    startTheme() {
      if (this.bgmTimer || !this.enabled) return;
      this.noteIndex = 0;
      const step = () => {
        if (!this.enabled) return;
        const melodyNote = this.melody[this.noteIndex % this.melody.length];
        const bassNote = this.bass[this.noteIndex % this.bass.length];
        this.pulse(bassNote, 0.22, 'triangle', 0.022);
        this.pulse(melodyNote, 0.12, 'square', 0.032, 0.02);
        this.noteIndex += 1;
      };
      step();
      this.bgmTimer = window.setInterval(step, 240);
    }

    end() {
      this.pulse(220, 0.2, 'triangle', 0.04);
      this.pulse(164.81, 0.22, 'sawtooth', 0.025, 0.06);
    }

    stopTheme() {
      if (this.bgmTimer) {
        clearInterval(this.bgmTimer);
        this.bgmTimer = null;
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      if (!this.enabled) {
        this.stopTheme();
      } else {
        this.warmupAndStart();
      }
      return this.enabled;
    }
  }

  window.retroAudio = new RetroAudio();
})();
