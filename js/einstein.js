/* Einstein comic character — SVG + expression states */
const Einstein = {
  states: ['idle', 'explain', 'cheer', 'think'],

  svgMarkup() {
    return `
<svg class="einstein-svg" viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <pattern id="ht" patternUnits="userSpaceOnUse" width="6" height="6">
      <circle cx="1.5" cy="1.5" r="1" fill="#1a1a2e" opacity="0.12"/>
    </pattern>
  </defs>
  <ellipse cx="100" cy="205" rx="58" ry="32" fill="#E85D04" stroke="#1a1a2e" stroke-width="3"/>
  <rect x="52" y="150" width="96" height="58" rx="10" fill="#F48C06" stroke="#1a1a2e" stroke-width="3"/>
  <path d="M68 152 L84 175 L68 198" fill="none" stroke="#1a1a2e" stroke-width="2.5"/>
  <path d="M132 152 L116 175 L132 198" fill="none" stroke="#1a1a2e" stroke-width="2.5"/>
  <rect x="88" y="138" width="24" height="18" fill="#F5D0A9" stroke="#1a1a2e" stroke-width="2"/>
  <g class="hair-bob">
    <ellipse cx="100" cy="95" rx="50" ry="54" fill="#F5D0A9" stroke="#1a1a2e" stroke-width="3.5"/>
    <ellipse cx="100" cy="95" rx="50" ry="54" fill="url(#ht)"/>
    <g fill="#F4F1DE" stroke="#1a1a2e" stroke-width="2.5" stroke-linejoin="round">
      <path d="M52 88 Q38 48 55 32 Q72 18 88 38"/>
      <path d="M68 42 Q78 12 98 22 Q115 8 124 28"/>
      <path d="M112 32 Q132 2 148 28 Q162 18 158 52"/>
      <path d="M148 68 Q168 52 160 88 Q172 98 150 108"/>
      <path d="M50 98 Q32 82 40 118 Q28 130 54 122"/>
      <ellipse cx="100" cy="46" rx="44" ry="30"/>
    </g>
  </g>
  <g class="face">
    <ellipse cx="80" cy="90" rx="11" ry="13" fill="#fff" stroke="#1a1a2e" stroke-width="2.5"/>
    <ellipse cx="120" cy="90" rx="11" ry="13" fill="#fff" stroke="#1a1a2e" stroke-width="2.5"/>
    <circle class="pupil-l" cx="82" cy="92" r="5.5" fill="#1a1a2e"/>
    <circle class="pupil-r" cx="122" cy="92" r="5.5" fill="#1a1a2e"/>
    <circle cx="84" cy="90" r="1.6" fill="#fff"/>
    <circle cx="124" cy="90" r="1.6" fill="#fff"/>
    <path d="M68 74 Q80 68 92 75" fill="none" stroke="#1a1a2e" stroke-width="3" stroke-linecap="round"/>
    <path d="M108 75 Q120 68 132 74" fill="none" stroke="#1a1a2e" stroke-width="3" stroke-linecap="round"/>
    <path d="M100 94 L94 114 Q100 118 106 114 Z" fill="#E8B88A" stroke="#1a1a2e" stroke-width="2"/>
    <path d="M82 116 Q100 128 118 116 Q110 134 100 132 Q90 134 82 116" fill="#F4F1DE" stroke="#1a1a2e" stroke-width="2"/>
    <path class="mouth" d="M88 138 Q100 148 112 138" fill="none" stroke="#1a1a2e" stroke-width="2.8" stroke-linecap="round"/>
  </g>
</svg>`;
  },

  mount(el, state = 'idle') {
    if (!el) return;
    el.innerHTML = this.svgMarkup();
    el.classList.add('einstein-stage');
    this.setState(el, state);
  },

  setState(el, state) {
    if (!el) return;
    this.states.forEach(s => el.classList.remove('state-' + s));
    const s = this.states.includes(state) ? state : 'idle';
    el.classList.add('state-' + s);
    const mouth = el.querySelector('.mouth');
    if (mouth) {
      if (s === 'cheer') mouth.setAttribute('d', 'M85 136 Q100 155 115 136');
      else if (s === 'think') mouth.setAttribute('d', 'M92 142 Q100 138 110 142');
      else if (s === 'explain') mouth.setAttribute('d', 'M88 136 Q100 150 112 136 Q100 142 88 136');
      else mouth.setAttribute('d', 'M88 138 Q100 148 112 138');
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
    pow.style.left = (rect.left + rect.width * 0.5 + window.scrollX - 20) + 'px';
    pow.style.top = (rect.top + window.scrollY) + 'px';
    pow.style.position = 'absolute';
    document.body.appendChild(pow);
    setTimeout(() => pow.remove(), 700);
  }
};

window.Einstein = Einstein;
