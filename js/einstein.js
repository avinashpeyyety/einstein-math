/* Einstein comic teacher — Imagine expression panels + optional Web Speech read-aloud */
const Einstein = {
  states: ['idle', 'explain', 'cheer', 'think'],
  panelBase: 'assets/panels/',
  _speechEnabled: false,
  _lastSpoken: '',
  _utterance: null,

  panelSrc(state) {
    const s = this.states.includes(state) ? state : 'idle';
    return this.panelBase + s + '.png';
  },

  mount(el, state = 'idle') {
    if (!el) return;
    const s = this.states.includes(state) ? state : 'idle';
    el.classList.add('einstein-stage');
    el.innerHTML =
      '<img class="einstein-panel" src="' +
      this.panelSrc(s) +
      '" alt="Einstein" width="200" height="267" decoding="async" />';
    this.setState(el, s);
  },

  setState(el, state) {
    if (!el) return;
    this.states.forEach((x) => el.classList.remove('state-' + x));
    const s = this.states.includes(state) ? state : 'idle';
    el.classList.add('state-' + s);
    const img = el.querySelector('.einstein-panel');
    if (img) {
      const next = this.panelSrc(s);
      if (!img.getAttribute('src') || !img.getAttribute('src').endsWith('/' + s + '.png')) {
        img.setAttribute('src', next);
      }
    }
  },

  setSpeechEnabled(on) {
    this._speechEnabled = !!on;
    if (!this._speechEnabled) this.cancelSpeech();
  },

  isSpeechEnabled() {
    return !!this._speechEnabled;
  },

  speechSupported() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';
  },

  cancelSpeech() {
    try {
      if (this.speechSupported()) window.speechSynthesis.cancel();
    } catch (_) { /* Safari quirks */ }
    this._utterance = null;
  },

  /** Strip UI-ish punctuation noise for kid-friendly TTS */
  _cleanForSpeech(text) {
    return String(text || '')
      .replace(/[★⚡⏱→←]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  },

  speakAloud(text, opts = {}) {
    if (!this._speechEnabled && !opts.force) return;
    if (!this.speechSupported()) return;
    const cleaned = this._cleanForSpeech(text);
    if (!cleaned) return;
    try {
      this.cancelSpeech();
      const u = new SpeechSynthesisUtterance(cleaned);
      u.rate = typeof opts.rate === 'number' ? opts.rate : 0.95;
      u.pitch = 1;
      u.volume = 1;
      this._utterance = u;
      this._lastSpoken = cleaned;
      window.speechSynthesis.speak(u);
    } catch (_) {
      /* graceful no-op */
    }
  },

  replayLast() {
    if (this._lastSpoken) this.speakAloud(this._lastSpoken, { force: true, rate: 0.95 });
  },

  speak(bubbleEl, text, variant) {
    if (!bubbleEl) return;
    bubbleEl.textContent = text;
    bubbleEl.classList.remove('correction', 'success');
    if (variant === 'correction') bubbleEl.classList.add('correction');
    if (variant === 'success') bubbleEl.classList.add('success');
    // Auto-speak when bubble text changes if read-aloud is on
    this.speakAloud(text);
  },

  pow(anchorEl, word = 'POW!') {
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    const pow = document.createElement('div');
    pow.className = 'pow';
    pow.textContent = word;
    pow.style.left = rect.left + rect.width * 0.5 + window.scrollX - 20 + 'px';
    pow.style.top = rect.top + window.scrollY + 'px';
    pow.style.position = 'absolute';
    document.body.appendChild(pow);
    setTimeout(() => pow.remove(), 700);
  },
};

window.Einstein = Einstein;
