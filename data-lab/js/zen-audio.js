/* Zen Audio Engine — Orion MP3 narration playback + gentle synthesized Zen chimes (Web Audio API)
 * Zero harsh buzzers: warm wooden tap, pentatonic marimba chord on mastery, quiet hollow woodblock on error.
 */
const ZenAudio = {
  enabled: true,
  _ctx: null,
  _audioEl: null,
  _raf: null,
  _onTick: null,
  _onEnd: null,

  _getCtx() {
    if (!this.enabled) return null;
    if (!this._ctx && typeof window !== 'undefined') {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this._ctx = new AC();
    }
    if (this._ctx && this._ctx.state === 'suspended') {
      this._ctx.resume().catch(() => {});
    }
    return this._ctx;
  },

  tap() {
    const ctx = this._getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.045);
    g.gain.setValueAtTime(0.06, now);
    g.gain.exponentialRampToValueAtTime(0.0008, now + 0.05);
    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.055);
  },

  woodblock() {
    const ctx = this._getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(165, now + 0.11);
    g.gain.setValueAtTime(0.08, now);
    g.gain.exponentialRampToValueAtTime(0.0008, now + 0.12);
    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  },

  /* Warm pentatonic marimba chime (C5 - D5 - G5 - A5) */
  chime(fullChord = false) {
    const ctx = this._getCtx();
    if (!ctx) return;
    const notes = fullChord ? [523.25, 659.25, 783.99, 1046.5] : [523.25, 659.25, 783.99];
    const now = ctx.currentTime;
    notes.forEach((freq, i) => {
      const t = now + i * 0.095;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.075, t + 0.018);
      g.gain.exponentialRampToValueAtTime(0.0005, t + 0.75);
      osc.connect(g).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.78);
    });
  },

  stopNarration() {
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
    if (this._audioEl) {
      this._audioEl.pause();
      this._audioEl.currentTime = 0;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch (_) {}
    }
  },

  playNarration(src, fallbackText, onTick, onEnd) {
    this.stopNarration();
    this._onTick = onTick;
    this._onEnd = onEnd;

    if (!this.enabled) {
      // Silent timed playback so the Motion Koan animation still flows smoothly
      const start = performance.now();
      const dur = 16.5;
      const step = () => {
        const t = (performance.now() - start) / 1000;
        if (onTick) onTick(Math.min(t, dur), dur);
        if (t < dur) this._raf = requestAnimationFrame(step);
        else if (onEnd) onEnd();
      };
      this._raf = requestAnimationFrame(step);
      return;
    }

    const audio = new Audio(src);
    this._audioEl = audio;
    const tick = () => {
      if (!this._audioEl || this._audioEl !== audio) return;
      const dur = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 17.0;
      if (onTick) onTick(audio.currentTime || 0, dur);
      if (!audio.paused && !audio.ended) {
        this._raf = requestAnimationFrame(tick);
      }
    };
    audio.addEventListener('play', () => { this._raf = requestAnimationFrame(tick); });
    audio.addEventListener('ended', () => {
      const dur = Number.isFinite(audio.duration) ? audio.duration : 17.0;
      if (onTick) onTick(dur, dur);
      if (onEnd) onEnd();
    });
    audio.play().catch(() => {
      // Fallback to silent timed visual progression if autoplay is blocked until user click
      const start = performance.now();
      const dur = 16.5;
      const step = () => {
        const t = (performance.now() - start) / 1000;
        if (onTick) onTick(Math.min(t, dur), dur);
        if (t < dur) this._raf = requestAnimationFrame(step);
        else if (onEnd) onEnd();
      };
      this._raf = requestAnimationFrame(step);
    });
  }
};

if (typeof window !== 'undefined') window.ZenAudio = ZenAudio;
