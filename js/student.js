/* Student pupil — expression panels mirroring Einstein states */
const Student = {
  states: ['idle', 'explain', 'cheer', 'think'],
  panelBase: 'assets/student/panels/',
  defaultName: 'Explorer',
  _lastState: 'idle',

  panelSrc(state) {
    const s = this.states.includes(state) ? state : 'idle';
    return this.panelBase + s + '.png';
  },

  mount(el, displayName, state = 'idle') {
    if (!el) return;
    const s = this.states.includes(state) ? state : 'idle';
    const name = (displayName && String(displayName).trim()) || this.defaultName;
    el.classList.add('student-stage');
    el.innerHTML =
      '<img class="student-panel" src="' +
      this.panelSrc(s) +
      '" alt="' +
      name.replace(/"/g, '') +
      ' — student" width="200" height="267" decoding="async" />' +
      '<div class="student-caption"><span class="student-role">Student</span> · <span class="student-name"></span></div>';
    const nameEl = el.querySelector('.student-name');
    if (nameEl) nameEl.textContent = name;
    this.setState(el, s);
  },

  setName(el, displayName) {
    if (!el) return;
    const name = (displayName && String(displayName).trim()) || this.defaultName;
    const nameEl = el.querySelector('.student-name');
    if (nameEl) nameEl.textContent = name;
    const img = el.querySelector('.student-panel');
    if (img) img.setAttribute('alt', name + ' — student');
  },

  setState(el, state) {
    if (!el) return;
    this.states.forEach((x) => el.classList.remove('state-' + x));
    const s = this.states.includes(state) ? state : 'idle';
    el.classList.add('state-' + s);
    const img = el.querySelector('.student-panel');
    if (img) {
      const next = this.panelSrc(s);
      if (!img.getAttribute('src') || !img.getAttribute('src').endsWith('/' + s + '.png')) {
        img.setAttribute('src', next);
      }
    }
  },

  /** Mount/refresh every student stage; optional state (defaults to last mirrored) */
  refreshAll(displayName, state) {
    const s = state || this._lastState || 'idle';
    this._lastState = this.states.includes(s) ? s : 'idle';
    document.querySelectorAll('.student-stage, [data-student]').forEach((el) => {
      if (!el.querySelector('.student-panel')) this.mount(el, displayName, this._lastState);
      else {
        this.setName(el, displayName);
        this.setState(el, this._lastState);
      }
    });
  },

  /** Mirror Einstein expression across all student stages */
  mirrorState(state) {
    const s = this.states.includes(state) ? state : 'idle';
    this._lastState = s;
    document.querySelectorAll('.student-stage, [data-student]').forEach((el) => {
      if (!el.querySelector('.student-panel')) {
        const nameEl = document.querySelector('.student-name');
        const name = nameEl ? nameEl.textContent : this.defaultName;
        this.mount(el, name, s);
      } else {
        this.setState(el, s);
      }
    });
  },
};

window.Student = Student;
