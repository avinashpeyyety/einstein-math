/* Student pupil portrait — comic panel beside Einstein */
const Student = {
  src: 'assets/student/portrait.jpg',
  defaultName: 'Explorer',

  mount(el, displayName) {
    if (!el) return;
    el.classList.add('student-stage');
    const name = (displayName && String(displayName).trim()) || this.defaultName;
    el.innerHTML =
      '<img class="student-panel" src="' +
      this.src +
      '" alt="' +
      name.replace(/"/g, '') +
      ' — student" width="200" height="267" decoding="async" />' +
      '<div class="student-caption"><span class="student-role">Student</span> · <span class="student-name"></span></div>';
    const nameEl = el.querySelector('.student-name');
    if (nameEl) nameEl.textContent = name;
  },

  setName(el, displayName) {
    if (!el) return;
    const name = (displayName && String(displayName).trim()) || this.defaultName;
    const nameEl = el.querySelector('.student-name');
    if (nameEl) nameEl.textContent = name;
    const img = el.querySelector('.student-panel');
    if (img) img.setAttribute('alt', name + ' — student');
  },

  /** Mount or refresh every .student-stage (or [data-student]) on the page */
  refreshAll(displayName) {
    document.querySelectorAll('.student-stage, [data-student]').forEach((el) => {
      if (!el.querySelector('.student-panel')) this.mount(el, displayName);
      else this.setName(el, displayName);
    });
  },
};

window.Student = Student;
