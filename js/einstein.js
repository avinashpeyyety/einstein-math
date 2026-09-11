/* Einstein comic teacher — Imagine expression panels */
const Einstein = {
  states: ['idle', 'explain', 'cheer', 'think'],
  panelBase: 'assets/panels/',

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

  speak(bubbleEl, text, variant) {
    if (!bubbleEl) return;
    bubbleEl.textContent = text;
    bubbleEl.classList.remove('correction', 'success');
    if (variant === 'correction') bubbleEl.classList.add('correction');
    if (variant === 'success') bubbleEl.classList.add('success');
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
