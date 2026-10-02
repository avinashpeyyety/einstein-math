/* Student pupil — expression panels mirroring Einstein states;
 * optional comic avatar (data URL) replaces panel art when set. */
const Student = {
  states: ['idle', 'explain', 'cheer', 'think'],
  panelBase: 'assets/student/panels/',
  defaultName: 'Explorer',
  _lastState: 'idle',
  _avatarDataUrl: null,

  panelSrc(state) {
    const s = this.states.includes(state) ? state : 'idle';
    return this.panelBase + s + '.png';
  },

  mount(el, displayName, state = 'idle') {
    if (!el) return;
    const s = this.states.includes(state) ? state : 'idle';
    const name = (displayName && String(displayName).trim()) || this.defaultName;
    el.classList.add('student-stage');
    const src = this._avatarDataUrl || this.panelSrc(s);
    const avatarClass = this._avatarDataUrl ? ' student-panel-avatar' : '';
    el.innerHTML =
      '<img class="student-panel' +
      avatarClass +
      '" src="' +
      src.replace(/"/g, '') +
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

  setAvatar(el, dataUrl) {
    if (!el) return;
    const img = el.querySelector('.student-panel');
    if (!img) return;
    if (dataUrl) {
      img.src = dataUrl;
      img.classList.add('student-panel-avatar');
    } else {
      img.classList.remove('student-panel-avatar');
      img.src = this.panelSrc(this._lastState || 'idle');
    }
  },

  setState(el, state) {
    if (!el) return;
    this.states.forEach((x) => el.classList.remove('state-' + x));
    const s = this.states.includes(state) ? state : 'idle';
    el.classList.add('state-' + s);
    const img = el.querySelector('.student-panel');
    if (!img) return;
    // Keep comic photo when set; only swap stock panels
    if (this._avatarDataUrl || img.classList.contains('student-panel-avatar')) {
      if (this._avatarDataUrl && img.getAttribute('src') !== this._avatarDataUrl) {
        img.src = this._avatarDataUrl;
      }
      img.classList.add('student-panel-avatar');
      return;
    }
    const next = this.panelSrc(s);
    if (!img.getAttribute('src') || !img.getAttribute('src').endsWith('/' + s + '.png')) {
      img.setAttribute('src', next);
    }
  },

  /** Mount/refresh every student stage; optional state + comic avatar data URL */
  refreshAll(displayName, state, avatarDataUrl) {
    const s = state || this._lastState || 'idle';
    this._lastState = this.states.includes(s) ? s : 'idle';
    this._avatarDataUrl =
      avatarDataUrl && String(avatarDataUrl).startsWith('data:image/')
        ? String(avatarDataUrl)
        : null;
    document.querySelectorAll('.student-stage, [data-student]').forEach((el) => {
      if (!el.querySelector('.student-panel')) this.mount(el, displayName, this._lastState);
      else {
        this.setName(el, displayName);
        this.setAvatar(el, this._avatarDataUrl);
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
