/* Einstein Math — main app controller */
(function () {
  let curriculum = null;
  let progress = Storage.load();
  let lessonCtx = null;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function showScreen(id) {
    $$('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateContinueVisibility() {
    const btn = $('#btn-continue');
    if (!btn) return;
    if (progress.started || progress.diagnosticDone || progress.currentLessonId) {
      btn.classList.remove('hidden');
    } else {
      btn.classList.add('hidden');
    }
  }

  function renderVisual(key) {
    const map = {
      'place-value-247': `
        <div class="viz-box">
          <div class="place-blocks">
            <div class="place-block hundreds">2 hundreds<br>= 200</div>
            <div class="place-block tens">4 tens<br>= 40</div>
            <div class="place-block ones">7 ones<br>= 7</div>
          </div>
          <div style="margin-top:0.5rem;font-family:Bangers,Impact,sans-serif;font-size:1.5rem;">247</div>
        </div>`,
      'place-value-power': `
        <div class="viz-box">Digit place = POWER!<br>
          <strong>4</strong> in ones &rarr; 4 &nbsp;|&nbsp;
          <strong>4</strong> in tens &rarr; 40 &nbsp;|&nbsp;
          <strong>4</strong> in hundreds &rarr; 400
        </div>`,
      'expanded-247': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.4rem;">
          247 = 200 + 40 + 7
        </div>`,
      'add-align': `
        <div class="viz-box" style="font-family:monospace;font-size:1.4rem;line-height:1.6;">
          &nbsp;&nbsp;37<br>+ 25<br>────
        </div>`,
      'add-carry': `
        <div class="viz-box" style="font-family:monospace;font-size:1.3rem;">
          <span style="color:#FF6B35;">¹</span><br>
          &nbsp;&nbsp;37<br>+ 25<br>────<br>&nbsp;&nbsp;&nbsp;2
          <div style="margin-top:0.4rem;font-family:Comic Neue,cursive;font-size:1rem;">Ones: 7+5=12 &rarr; write 2, carry 1</div>
        </div>`,
      'add-result': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.6rem;">
          37 + 25 = 62 ★
        </div>`,
      'groups-3x4': `
        <div class="viz-box">
          <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;">
            ${[1,2,3].map(() => `<div class="dot-grid" style="grid-template-columns:repeat(2,1fr);">${'<div class="dot"></div>'.repeat(4)}</div>`).join('')}
          </div>
          <div style="margin-top:0.5rem;">3 groups of 4 = 12 &nbsp;&rarr;&nbsp; 3 × 4 = 12</div>
        </div>`,
      'array-2x5': `
        <div class="viz-box">
          <div class="dot-grid" style="grid-template-columns:repeat(5,1fr);">${'<div class="dot"></div>'.repeat(10)}</div>
          <div>2 rows × 5 = 10</div>
        </div>`,
      'half-sandwich': `
        <div class="viz-box"><div class="fraction-pie"></div>1/2 — one half!</div>`,
      'fourths': `
        <div class="viz-box"><div class="fraction-pie fourths"></div>1/4 — one fourth!</div>`,
      'compare-tens': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.5rem;">
          73 &gt; 68<br><span style="font-family:Comic Neue,cursive;font-size:1rem;">7 tens beat 6 tens!</span>
        </div>`,
      'sub-borrow': `
        <div class="viz-box" style="font-family:monospace;font-size:1.3rem;">
          Borrow a ten: 12 − 8 = 4
        </div>`,
      'sub-result': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.6rem;">52 − 18 = 34 ★</div>`
    };
    return map[key] || '';
  }

  function renderLanding() {
    updateContinueVisibility();
    Einstein.mount($('#landing-einstein'), 'idle');
    Einstein.speak($('#landing-speech'),
      progress.started
        ? "Welcome back, young mathematician! Ready to continue our cosmic number adventure?"
        : "Greetings! I'm Einstein — and numbers are my superpower. Want to learn math the comic-book way?"
    );
  }

  let diagIndex = 0;
  let diagAnswers = {};

  function startDiagnostic() {
    diagIndex = 0;
    diagAnswers = {};
    progress.started = true;
    Storage.save(progress);
    showScreen('screen-diagnostic');
    renderDiagnosticQ();
  }

  function renderDiagnosticQ() {
    const d = curriculum.diagnostic;
    const q = d.questions[diagIndex];
    Einstein.mount($('#diag-einstein'), diagIndex === 0 ? 'explain' : 'think');
    Einstein.speak($('#diag-speech'),
      diagIndex === 0 ? d.einsteinIntro : "Nice focus! Next question — take your time."
    );
    $('#diag-progress').textContent = `Warm-Up ${diagIndex + 1} / ${d.questions.length}`;
    const card = $('#diag-card');
    card.innerHTML = `
      <div class="q-prompt">${escapeHtml(q.prompt)}</div>
      <div class="choices">
        ${q.choices.map((c) => `
          <button type="button" class="choice" data-val="${escapeAttr(c)}">${escapeHtml(c)}</button>
        `).join('')}
      </div>`;
    $$('.choice', card).forEach(btn => {
      btn.addEventListener('click', () => {
        diagAnswers[q.id] = btn.dataset.val;
        $$('.choice', card).forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        setTimeout(() => {
          if (diagIndex < d.questions.length - 1) {
            diagIndex++;
            renderDiagnosticQ();
          } else {
            finishDiagnostic();
          }
        }, 280);
      });
    });
  }

  function finishDiagnostic() {
    const d = curriculum.diagnostic;
    const scores = {};
    const unitHits = {};
    d.questions.forEach(q => {
      const ok = String(diagAnswers[q.id]) === String(q.answer);
      scores[q.skill] = ok;
      if (!ok && q.unitHint) {
        unitHits[q.unitHint] = (unitHits[q.unitHint] || 0) + 1;
      }
    });
    progress.diagnosticDone = true;
    progress.diagnosticScores = scores;
    const recommended = Object.entries(unitHits)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);
    if (!recommended.length) {
      recommended.push('unit-number-sense', 'unit-add-sub');
    }
    progress.recommendedUnits = recommended;
    Storage.save(progress);
    showScreen('screen-diag-result');
    const correct = Object.values(scores).filter(Boolean).length;
    Einstein.mount($('#diag-result-einstein'), 'cheer');
    Einstein.speak($('#diag-result-speech'),
      correct >= 4
        ? `Amazing! You got ${correct} of ${d.questions.length}. You're ready for bigger adventures!`
        : `You got ${correct} of ${d.questions.length} — that's a great start! We'll strengthen the spots that need a boost. No shame — every hero trains!`
    );
    const recNames = recommended.map(id => {
      const u = curriculum.units.find(x => x.id === id);
      return u ? u.title : id;
    });
    $('#diag-result-body').innerHTML = `
      <p style="font-weight:700;margin-bottom:0.75rem;">Suggested path:</p>
      <ul class="steps-list">${recNames.map(n => `<li>${escapeHtml(n)}</li>`).join('')}</ul>
      <p style="margin-top:1rem;">You can also pick any unlocked lesson from the Mission Map!</p>`;
  }

  function renderHub() {
    showScreen('screen-hub');
    Einstein.mount($('#hub-einstein'), 'idle');
    Einstein.speak($('#hub-speech'),
      "Here's the Mission Map! Pick a unit — I'll coach you through every panel."
    );
    const grid = $('#unit-grid');
    grid.innerHTML = curriculum.units.map(unit => {
      const lessons = (unit.lessons || [])
        .map(id => curriculum.lessons[id])
        .filter(Boolean);
      const accent = unit.color || '#FF6B35';
      return `
        <div class="unit-card" style="border-top: 8px solid ${accent}" data-unit="${unit.id}">
          <div class="unit-icon">${unit.icon}</div>
          <h3>${escapeHtml(unit.title)}</h3>
          <p>${escapeHtml(unit.description)}</p>
          ${lessons.length ? `
            <ul class="lesson-list">
              ${lessons.map(L => {
                const st = Storage.lessonStatus(progress, L.id, curriculum);
                const label = st === 'done' ? 'DONE' : st === 'in_progress' ? 'RESUME' : st === 'locked' ? 'LOCKED' : 'GO';
                const cls = st === 'done' ? 'done' : st === 'locked' ? 'locked' : '';
                return `<li>
                  <span>${escapeHtml(L.title)}</span>
                  <button type="button" class="badge ${cls} btn-lesson" data-lesson="${L.id}" data-status="${st}" ${st === 'locked' ? 'disabled' : ''}>${label}</button>
                </li>`;
              }).join('')}
            </ul>` : `<p style="opacity:0.6;font-weight:700;">More lessons coming soon!</p>`}
        </div>`;
    }).join('');

    $$('.btn-lesson', grid).forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (btn.dataset.status === 'locked') return;
        startLesson(btn.dataset.lesson);
      });
    });
  }

  function renderProgress() {
    showScreen('screen-progress');
    const allIds = Object.keys(curriculum.lessons);
    const done = allIds.filter(id => progress.lessons[id]?.status === 'done').length;
    const pct = allIds.length ? Math.round((done / allIds.length) * 100) : 0;
    $('#stat-stars').textContent = progress.stars || 0;
    $('#stat-done').textContent = done;
    $('#stat-total').textContent = allIds.length;
    $('#stat-diag').textContent = progress.diagnosticDone ? 'Yes' : 'No';
    $('#progress-bar').style.width = pct + '%';
    $('#progress-pct').textContent = pct + '%';

    const list = $('#progress-lesson-list');
    list.innerHTML = allIds.map(id => {
      const L = curriculum.lessons[id];
      const st = Storage.lessonStatus(progress, id, curriculum);
      const unit = curriculum.units.find(u => u.id === L.unitId);
      return `<li>
        <span>${unit ? unit.icon + ' ' : ''}${escapeHtml(L.title)}</span>
        <span class="badge ${st === 'done' ? 'done' : st === 'locked' ? 'locked' : ''}">${st.replace('_', ' ').toUpperCase()}</span>
      </li>`;
    }).join('');

    Einstein.mount($('#progress-einstein'), done > 0 ? 'cheer' : 'think');
    Einstein.speak($('#progress-speech'),
      done === 0
        ? "Your adventure log is empty — let's earn some stars!"
        : `You've completed ${done} lesson${done === 1 ? '' : 's'} and earned ${progress.stars || 0} star${(progress.stars||0)===1?'':'s'}! Keep going!`
    );
  }

  function startLesson(lessonId) {
    const lesson = curriculum.lessons[lessonId];
    if (!lesson) return;
    lessonCtx = {
      lesson,
      phase: 'intro',
      panelIndex: 0,
      practiceIndex: 0,
      checkIndex: 0,
      practiceCorrect: 0,
      practiceTotal: 0,
      checkCorrect: 0,
      checkTotal: 0
    };
    Storage.setLessonProgress(progress, lessonId, { status: 'in_progress' });
    showScreen('screen-lesson');
    renderLessonPhase();
  }

  function setPips() {
    const L = lessonCtx.lesson;
    const phases = ['intro', 'explain', 'example', 'practice', 'check', 'complete'];
    const labels = ['Hi', 'Learn', 'Example', 'Practice', 'Check', '★'];
    const cur = phases.indexOf(lessonCtx.phase);
    $('#lesson-pips').innerHTML = labels.map((lab, i) =>
      `<div class="pip ${i < cur ? 'done' : i === cur ? 'current' : ''}" title="${lab}"></div>`
    ).join('');
    $('#lesson-title').textContent = L.title;
    const unit = curriculum.units.find(u => u.id === L.unitId);
    $('#lesson-meta').textContent = (unit ? unit.title + ' · ' : '') + `~${L.durationMin || 8} min`;
  }

  function renderLessonPhase() {
    setPips();
    const L = lessonCtx.lesson;
    const stage = $('#lesson-einstein');
    const bubble = $('#lesson-speech');
    const body = $('#lesson-body');
    const actions = $('#lesson-actions');
    actions.innerHTML = '';
    body.innerHTML = '';

    if (lessonCtx.phase === 'intro') {
      Einstein.mount(stage, 'explain');
      Einstein.speak(bubble, L.einsteinIntro);
      body.innerHTML = `<div class="viz-box">Get ready — comic-panel learning ahead!</div>`;
      actions.innerHTML = `<button type="button" class="btn btn-primary" id="btn-next">Let's Learn!</button>`;
      $('#btn-next').onclick = () => { lessonCtx.phase = 'explain'; lessonCtx.panelIndex = 0; renderLessonPhase(); };
    } else if (lessonCtx.phase === 'explain') {
      const panels = L.explain?.panels || [];
      const panel = panels[lessonCtx.panelIndex];
      Einstein.mount(stage, panel?.state || 'explain');
      Einstein.speak(bubble, panel?.speech || '...');
      body.innerHTML = (panel?.visual ? renderVisual(panel.visual) : '') +
        `<p class="lesson-meta">Panel ${lessonCtx.panelIndex + 1} of ${panels.length}</p>`;
      const isLast = lessonCtx.panelIndex >= panels.length - 1;
      actions.innerHTML = `
        ${lessonCtx.panelIndex > 0 ? `<button type="button" class="btn btn-ghost" id="btn-back">Back</button>` : ''}
        <button type="button" class="btn btn-primary" id="btn-next">${isLast ? 'See Example' : 'Next Panel'}</button>`;
      const back = $('#btn-back');
      if (back) back.onclick = () => { lessonCtx.panelIndex--; renderLessonPhase(); };
      $('#btn-next').onclick = () => {
        if (isLast) { lessonCtx.phase = 'example'; renderLessonPhase(); }
        else { lessonCtx.panelIndex++; renderLessonPhase(); }
      };
    } else if (lessonCtx.phase === 'example') {
      const ex = L.workedExample || {};
      Einstein.mount(stage, 'think');
      Einstein.speak(bubble, ex.speech || 'Watch this example.');
      body.innerHTML = `
        <h3 class="panel-title">${escapeHtml(ex.title || 'Worked Example')}</h3>
        <ul class="steps-list">${(ex.steps || []).map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`;
      actions.innerHTML = `<button type="button" class="btn btn-primary" id="btn-next">Try Practice!</button>`;
      $('#btn-next').onclick = () => { lessonCtx.phase = 'practice'; lessonCtx.practiceIndex = 0; renderLessonPhase(); };
    } else if (lessonCtx.phase === 'practice') {
      renderQuestion('practice');
    } else if (lessonCtx.phase === 'check') {
      renderQuestion('check');
    } else if (lessonCtx.phase === 'complete') {
      Einstein.mount(stage, 'cheer');
      Einstein.pow(stage, 'YEAH!');
      const pc = lessonCtx.practiceCorrect;
      const pt = lessonCtx.practiceTotal;
      const cc = lessonCtx.checkCorrect;
      const ct = lessonCtx.checkTotal;
      Einstein.speak(bubble,
        `Lesson complete! Practice ${pc}/${pt}, Quick Check ${cc}/${ct}. You earned a star!`,
        'success'
      );
      body.innerHTML = `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.8rem;">
          ★ STAR EARNED ★
        </div>
        <p style="font-weight:700;text-align:center;">Mistakes are just plot twists — you finished the issue!</p>`;
      Storage.markLessonDone(progress, L.id, {
        practiceCorrect: pc, practiceTotal: pt,
        checkCorrect: cc, checkTotal: ct
      });
      actions.innerHTML = `
        <button type="button" class="btn btn-cyan" id="btn-map">Mission Map</button>
        <button type="button" class="btn btn-primary" id="btn-progress">See Progress</button>`;
      $('#btn-map').onclick = renderHub;
      $('#btn-progress').onclick = renderProgress;
    }
  }

  function renderQuestion(mode) {
    const L = lessonCtx.lesson;
    const list = mode === 'practice' ? (L.practice || []) : (L.quickCheck || []);
    const idx = mode === 'practice' ? lessonCtx.practiceIndex : lessonCtx.checkIndex;
    const q = list[idx];
    const stage = $('#lesson-einstein');
    const bubble = $('#lesson-speech');
    const body = $('#lesson-body');
    const actions = $('#lesson-actions');

    if (!q) {
      if (mode === 'practice') {
        lessonCtx.phase = 'check';
        lessonCtx.checkIndex = 0;
        renderLessonPhase();
      } else {
        lessonCtx.phase = 'complete';
        renderLessonPhase();
      }
      return;
    }

    Einstein.mount(stage, 'explain');
    Einstein.speak(bubble,
      mode === 'practice'
        ? `Practice ${idx + 1} of ${list.length} — give it a shot!`
        : `Quick Check ${idx + 1} of ${list.length} — show what you know!`
    );

    let html = `<div class="q-card"><div class="q-prompt">${escapeHtml(q.prompt)}</div>`;
    if (q.type === 'mc') {
      html += `<div class="choices" id="q-choices">
        ${q.choices.map(c => `<button type="button" class="choice" data-val="${escapeAttr(c)}">${escapeHtml(c)}</button>`).join('')}
      </div>`;
    } else {
      html += `<div class="fill-row">
        <input type="text" id="q-fill" inputmode="numeric" autocomplete="off" placeholder="Your answer" />
        <button type="button" class="btn btn-primary btn-sm" id="btn-submit">Check</button>
      </div>`;
    }
    html += `<div class="hint-line hidden" id="q-hint"></div>`;
    html += `<div class="feedback-line" id="q-feedback"></div></div>`;
    body.innerHTML = html;
    actions.innerHTML = '';

    const feedback = $('#q-feedback');
    const hintEl = $('#q-hint');
    let answered = false;

    function grade(val) {
      if (answered) return;
      answered = true;
      const accept = (q.accept || [q.answer]).map(a => String(a).trim().toLowerCase());
      const ok = accept.includes(String(val).trim().toLowerCase());

      if (mode === 'practice') {
        lessonCtx.practiceTotal++;
        if (ok) lessonCtx.practiceCorrect++;
      } else {
        lessonCtx.checkTotal++;
        if (ok) lessonCtx.checkCorrect++;
      }

      if (q.type === 'mc') {
        $$('.choice', body).forEach(b => {
          b.disabled = true;
          if (String(b.dataset.val) === String(q.answer)) b.classList.add('correct');
          else if (b.dataset.val === val && !ok) b.classList.add('incorrect');
        });
      } else {
        const input = $('#q-fill');
        if (input) {
          input.disabled = true;
          input.style.borderColor = ok ? 'var(--correct)' : 'var(--wrong)';
        }
        const sub = $('#btn-submit');
        if (sub) sub.disabled = true;
      }

      feedback.classList.add('show', ok ? 'ok' : 'bad');
      if (ok) {
        feedback.textContent = q.feedbackCorrect || 'Yes! Cosmic!';
        Einstein.setState(stage, 'cheer');
        Einstein.speak(bubble, q.feedbackCorrect || 'Yes! Cosmic!', 'success');
        Einstein.pow(stage, 'YES!');
      } else {
        feedback.textContent = q.feedbackWrong || (`Not quite — the answer is ` + q.answer + `. You've got the next one!`);
        Einstein.setState(stage, 'think');
        Einstein.speak(bubble, q.feedbackWrong || (`Gentle correction: the answer is ` + q.answer + `. Mistakes help us grow!`), 'correction');
        if (q.hint) {
          hintEl.textContent = 'Hint: ' + q.hint;
          hintEl.classList.remove('hidden');
        }
      }

      const nextLabel = idx >= list.length - 1
        ? (mode === 'practice' ? 'Quick Check' : 'Finish!')
        : 'Next';
      actions.innerHTML = `<button type="button" class="btn btn-primary" id="btn-next">${nextLabel}</button>`;
      $('#btn-next').onclick = () => {
        if (mode === 'practice') {
          lessonCtx.practiceIndex++;
          if (lessonCtx.practiceIndex >= list.length) {
            lessonCtx.phase = 'check';
            lessonCtx.checkIndex = 0;
          }
        } else {
          lessonCtx.checkIndex++;
          if (lessonCtx.checkIndex >= list.length) {
            lessonCtx.phase = 'complete';
          }
        }
        renderLessonPhase();
      };
    }

    if (q.type === 'mc') {
      $$('.choice', body).forEach(btn => {
        btn.addEventListener('click', () => grade(btn.dataset.val));
      });
    } else {
      const submit = () => {
        const v = ($('#q-fill')?.value || '').trim();
        if (!v) return;
        grade(v);
      };
      $('#btn-submit').onclick = submit;
      $('#q-fill').addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, '&#39;');
  }

  function wireNav() {
    $('#btn-start')?.addEventListener('click', () => {
      if (!progress.diagnosticDone) startDiagnostic();
      else renderHub();
    });
    $('#btn-continue')?.addEventListener('click', () => {
      if (progress.currentLessonId && progress.lessons[progress.currentLessonId]?.status === 'in_progress') {
        startLesson(progress.currentLessonId);
      } else if (progress.diagnosticDone) {
        renderHub();
      } else {
        startDiagnostic();
      }
    });
    $('#btn-to-hub')?.addEventListener('click', renderHub);
    $('#btn-diag-to-hub')?.addEventListener('click', renderHub);
    $$('[data-nav]').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.nav;
        if (t === 'landing') { showScreen('screen-landing'); renderLanding(); }
        else if (t === 'hub') renderHub();
        else if (t === 'progress') renderProgress();
      });
    });
    $('#btn-reset')?.addEventListener('click', () => {
      if (confirm('Reset all progress? This cannot be undone.')) {
        progress = Storage.reset();
        showScreen('screen-landing');
        renderLanding();
      }
    });
    $('.logo')?.addEventListener('click', () => {
      showScreen('screen-landing');
      renderLanding();
    });
  }

  async function boot() {
    try {
      const res = await fetch('data/curriculum.json');
      if (!res.ok) throw new Error('Failed to load curriculum');
      curriculum = await res.json();
    } catch (err) {
      document.body.innerHTML = `
        <div class="app"><div class="comic-panel">
          <h1 class="panel-title">Oops!</h1>
          <p style="font-weight:700;">Could not load curriculum.json. Please serve this site over HTTP
          (not file://). Try: <code>python3 -m http.server 8080</code> from the project folder.</p>
          <p style="margin-top:0.5rem;opacity:0.7">${escapeHtml(String(err))}</p>
        </div></div>`;
      return;
    }
    wireNav();
    renderLanding();
    showScreen('screen-landing');
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
