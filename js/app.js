/* Einstein Math — main app controller (multi-track + multi-profile) */
(function () {
  let curriculum = null; // full JSON with tracks
  let store = Storage.loadStore();
  let progress = null; // active track progress blob
  let lessonCtx = null;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function activeUser() {
    return Storage.getActiveUser(store);
  }

  function activeTrackId() {
    const u = activeUser();
    return (u && u.trackId) || curriculum?.meta?.defaultTrackId || 'ages-7-8';
  }

  function activeTrack() {
    const id = activeTrackId();
    return curriculum.tracks[id] || curriculum.tracks['ages-7-8'];
  }


  function refreshStudentCast() {
    if (typeof Student === 'undefined') return;
    const u = activeUser();
    const name = (u && u.displayName) || 'Explorer';
    Student.refreshAll(name);
  }

  function syncProgressFromStore() {
    const u = activeUser();
    if (!u) {
      progress = Storage.trackDefaults();
      refreshStudentCast();
      return;
    }
    progress = Storage.getTrackProgress(u, u.trackId);
    refreshStudentCast();
  }

  function persistProgress() {
    const u = activeUser();
    if (!u) return;
    Storage.saveTrackProgress(store, u.id, u.trackId, progress);
  }

  function syncSpeechFromStore() {
    const on = Storage.getSpeechEnabled(store);
    Einstein.setSpeechEnabled(on);
    const btn = $('#btn-speech-toggle');
    const replay = $('#btn-speech-replay');
    if (btn) {
      const supported = Einstein.speechSupported();
      btn.disabled = !supported;
      btn.textContent = on ? '🔊 Read aloud on' : '🔇 Read aloud';
      btn.title = supported
        ? (on ? 'Turn off Einstein read-aloud' : 'Turn on Einstein read-aloud')
        : 'Read-aloud not supported in this browser';
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    if (replay) {
      if (on && Einstein.speechSupported()) replay.classList.remove('hidden');
      else replay.classList.add('hidden');
    }
  }

  function toggleSpeech() {
    if (!Einstein.speechSupported()) {
      alert('Read-aloud needs Web Speech support (try Chrome or Edge).');
      return;
    }
    const next = !Storage.getSpeechEnabled(store);
    Storage.setSpeechEnabled(store, next);
    store = Storage.loadStore();
    syncSpeechFromStore();
    if (next) {
      Einstein.speakAloud("Read aloud is on! I'll narrate my speech bubbles.", { force: true });
    }
  }

  function renderTodaysPath(hostId) {
    const host = typeof hostId === 'string' ? document.getElementById(hostId) : hostId;
    if (!host) return;
    const u = activeUser();
    if (!u || !curriculum) {
      host.classList.add('hidden');
      host.innerHTML = '';
      return;
    }
    syncProgressFromStore();
    if (!progress.diagnosticDone && !progress.started) {
      host.classList.add('hidden');
      host.innerHTML = '';
      return;
    }
    const track = activeTrack();
    const suggestions = Storage.getSuggestedPath(progress, track, 3);
    if (!suggestions.length) {
      host.classList.add('hidden');
      host.innerHTML = '';
      return;
    }
    host.classList.remove('hidden');
    host.innerHTML = `
      <div class="todays-path-inner">
        <h3 class="todays-path-title">Today's path</h3>
        <ol class="todays-path-list">
          ${suggestions.map((s, i) => `
            <li>
              <button type="button" class="todays-path-btn" data-lesson="${escapeAttr(s.lessonId)}" data-mode="${escapeAttr(s.mode)}">
                <span class="todays-path-n">${i + 1}</span>
                <span class="todays-path-text">
                  <strong>${escapeHtml(s.title)}</strong>
                  <span class="muted">${escapeHtml(s.reason)}</span>
                </span>
              </button>
            </li>`).join('')}
        </ol>
      </div>`;
    host.querySelectorAll('.todays-path-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        startLesson(btn.dataset.lesson, { mode: btn.dataset.mode || 'lesson' });
      });
    });
  }

  /** Smarter Continue: due review → needs_review → recommended → next ready / in_progress */
  function continueAdventure() {
    syncProgressFromStore();
    if (!progress.diagnosticDone) {
      startDiagnostic();
      return;
    }
    const track = activeTrack();
    const suggestions = Storage.getSuggestedPath(progress, track, 1);
    if (suggestions.length) {
      const s = suggestions[0];
      startLesson(s.lessonId, { mode: s.mode || 'lesson' });
      return;
    }
    renderHub();
  }

  function showScreen(id) {
    $$('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateHeaderUser();
  }

  function updateHeaderUser() {
    const chip = $('#user-chip');
    const u = activeUser();
    if (!chip) return;
    if (!u) {
      chip.classList.add('hidden');
      return;
    }
    chip.classList.remove('hidden');
    const letter = (u.displayName || 'E').trim().charAt(0).toUpperCase();
    const av = $('#user-avatar');
    const nameEl = $('#user-name');
    if (av) {
      av.textContent = letter;
      av.style.background = u.avatarColor || '#FF6B35';
    }
    if (nameEl) nameEl.textContent = u.displayName;
    const trackMeta = $('#user-track-label');
    if (trackMeta && curriculum) {
      const t = activeTrack();
      trackMeta.textContent = t ? t.label : '';
    }
  }

  function trackButtonsHtml(selectedId, namePrefix) {
    const tracks = curriculum.tracks;
    const order = ['ages-5-6', 'ages-7-8', 'ages-9-10'];
    return order.map(id => {
      const t = tracks[id];
      if (!t) return '';
      const sel = id === selectedId ? ' selected' : '';
      return `<button type="button" class="track-btn${sel}" data-${namePrefix}-track="${id}">
        <span class="track-btn-label">${escapeHtml(t.label)}</span>
        <span class="track-btn-grade">${escapeHtml(t.gradeBand)}</span>
        <span class="track-btn-blurb">${escapeHtml(t.blurb)}</span>
      </button>`;
    }).join('');
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
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.6rem;">52 − 18 = 34 ★</div>`,
      'count-line': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;letter-spacing:0.08em;">
          1  2  3  4  5  6  7  8  9  10 …
        </div>`,
      'count-20': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.4rem;">20 = 10 + 10 ★</div>`,
      'compare-small': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.5rem;">4 &lt; 7</div>`,
      'compare-gt': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.5rem;">8 &gt; 3 &nbsp;🐊 eats the bigger!</div>`,
      'add-small': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.5rem;">3 + 2 = 5</div>`,
      'friends-10': `
        <div class="viz-box">Friends of 10: 6+4 · 7+3 · 5+5</div>`,
      'sub-small': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.5rem;">8 − 3 = 5</div>`,
      'sub-think': `
        <div class="viz-box">What + 3 makes 8? → 5</div>`,
      'make-ten': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">9 + 5 → 10 + 4 = 14</div>`,
      'count-on': `
        <div class="viz-box">9… 10, 11, 12, 13, 14!</div>`,
      'shapes-basic': `
        <div class="viz-box" style="font-size:2rem;">⚪ circle &nbsp; ⬛ square</div>`,
      'shapes-more': `
        <div class="viz-box" style="font-size:2rem;">▲ triangle &nbsp; ▬ rectangle</div>`,
      'multi-add-align': `
        <div class="viz-box" style="font-family:monospace;font-size:1.2rem;line-height:1.5;">
          &nbsp;1,456<br>+&nbsp;&nbsp;378<br>──────
        </div>`,
      'multi-add-carry': `
        <div class="viz-box" style="font-family:monospace;font-size:1.2rem;">Ones: 6+8=14 → write 4, carry 1</div>`,
      'multi-add-result': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.5rem;">1,456 + 378 = 1,834 ★</div>`,
      'multi-sub-borrow': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">5,000 − 1,234</div>`,
      'multi-sub-result': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.4rem;">= 3,766 ★</div>`,
      'factors-12': `
        <div class="viz-box">12 = 1×12 · 2×6 · 3×4</div>`,
      'prime-7': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.4rem;">7 is PRIME → only 1 and 7</div>`,
      'frac-equiv': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.4rem;">1/2 = 2/4 = 3/6</div>`,
      'frac-simplify': `
        <div class="viz-box">4/8 ÷ 4/4 = 1/2</div>`,
      'frac-same-den': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.4rem;">5/8 &gt; 3/8</div>`,
      'frac-same-num': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.4rem;">1/3 &gt; 1/5</div>`,
      'decimal-tenths': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.4rem;">0.7 = 7/10</div>`,
      'area-rect': `
        <div class="viz-box">Area = length × width<br><strong>5 × 3 = 15</strong></div>`,
      'teen-compose': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">11 = 10 + 1 &nbsp;·&nbsp; 15 = 10 + 5</div>`,
      'teen-line': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.2rem;letter-spacing:0.05em;">11 12 13 14 15 16 17 18 19</div>`,
      'compose-10-viz': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.4rem;">8 + 2 = 10 ★</div>`,
      'length-compare': `
        <div class="viz-box">━━━ longer<br>━ shorter</div>`,
      'length-same': `
        <div class="viz-box">═══ &amp; ═══ same length!</div>`,
      'clock-hour': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.4rem;">🕐 Long hand on 12 → o'clock</div>`,
      'clock-3': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.5rem;">3:00</div>`,
      'coins-row': `
        <div class="viz-box">🪙 1¢ · 5¢ · 10¢ · 25¢</div>`,
      'coins-groups': `
        <div class="viz-box">5 pennies = 1 nickel · 2 nickels = 1 dime</div>`,
      'word-add': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.4rem;">3 + 2 = 5 ★</div>`,
      'word-add-words': `
        <div class="viz-box">more · altogether · in all → ADD</div>`,
      'word-sub': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.4rem;">8 − 3 = 5 ★</div>`,
      'word-sub-words': `
        <div class="viz-box">left · gave away · fewer → SUBTRACT</div>`,
      'skip-2': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">2  4  6  8  10 …</div>`,
      'skip-5': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">5  10  15  20 …</div>`,
      'round-rule': `
        <div class="viz-box">Ones 0–4 → down &nbsp;|&nbsp; 5–9 → up</div>`,
      'round-47': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.5rem;">47 → 50</div>`,
      'array-3x4': `
        <div class="viz-box">
          <div class="dot-grid" style="grid-template-columns:repeat(4,1fr);">${'<div class="dot"></div>'.repeat(12)}</div>
          <div>3 × 4 = 12</div>
        </div>`,
      'div-share': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.4rem;">12 ÷ 3 = 4</div>`,
      'thirds-pie': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.4rem;">1/3 · 2/3 · 3/3</div>`,
      'frac-set': `
        <div class="viz-box">1/3 of 12 = 4</div>`,
      'ruler-inch-cm': `
        <div class="viz-box">📏 inches &amp; centimeters</div>`,
      'ruler-zero': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">Start at 0!</div>`,
      'clock-5min': `
        <div class="viz-box">Each number = +5 min for the long hand</div>`,
      'clock-430': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.5rem;">4:30</div>`,
      'money-change': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">50¢ − 35¢ = 15¢ change</div>`,
      'money-countup': `
        <div class="viz-box">Count up from price → money paid</div>`,
      'wp-1step-add': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">24 + 15 = 39</div>`,
      'wp-1step-sub': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">50 − 18 = 32</div>`,
      'wp-2step': `
        <div class="viz-box">Step 1 → Step 2 → Answer!</div>`,
      'wp-2step-ex': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">(20+8)−5 = 23</div>`,
      'wp-groups': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">4 × 5 = 20</div>`,
      'wp-share': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">20 ÷ 4 = 5</div>`,
      'mult-break': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.2rem;">23×4 = 80+12 = 92</div>`,
      'mult-stack': `
        <div class="viz-box" style="font-family:monospace;font-size:1.3rem;">&nbsp;&nbsp;23<br>×&nbsp;&nbsp;4<br>────</div>`,
      'div-concept': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">84 ÷ 4 = ?</div>`,
      'div-back': `
        <div class="viz-box">4 × 21 = 84 ★</div>`,
      'factors-mult': `
        <div class="viz-box">Factors of 12 · Multiples of 4: 4,8,12…</div>`,
      'lcm-hint': `
        <div class="viz-box">Multiples of 6 are also multiples of 2 &amp; 3</div>`,
      'oomd': `
        <div class="viz-box">() first → ×÷ → +−</div>`,
      'oomd-ex': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">2 + 3 × 4 = 14</div>`,
      'frac-add': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.4rem;">2/7 + 3/7 = 5/7</div>`,
      'frac-sub': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.4rem;">5/8 − 2/8 = 3/8</div>`,
      'mixed-convert': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">7/3 = 2 1/3</div>`,
      'mixed-viz': `
        <div class="viz-box">2 wholes + 1/4 = 2 1/4</div>`,
      'dec-pv': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">0.46 → 4 tenths, 6 hundredths</div>`,
      'dec-frac': `
        <div class="viz-box">0.5 = 5/10 = 1/2</div>`,
      'dec-compare': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">0.5 &gt; 0.45</div>`,
      'dec-zeros': `
        <div class="viz-box">0.4 = 0.40</div>`,
      'volume-box': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">V = l × w × h<br>2×3×4 = 24</div>`
    };
    return map[key] || `<div class="viz-box">${escapeHtml(String(key))}</div>`;
  }

  /* ——— Profile / landing ——— */

  function renderLanding() {
    const users = Storage.listUsers(store);
    const createPanel = $('#landing-create');
    const pickerPanel = $('#landing-picker');
    const continuePanel = $('#landing-continue');

    Einstein.mount($('#landing-einstein'), 'idle');
    refreshStudentCast();

    if (users.length === 0) {
      createPanel?.classList.remove('hidden');
      pickerPanel?.classList.add('hidden');
      continuePanel?.classList.add('hidden');
      const pathLanding = $('#landing-todays-path');
      if (pathLanding) { pathLanding.classList.add('hidden'); pathLanding.innerHTML = ''; }
      Einstein.speak($('#landing-speech'),
        "Greetings! I'm Einstein — and numbers are my superpower. Who's joining the cosmic adventure?"
      );
      renderCreateForm('create');
    } else {
      createPanel?.classList.add('hidden');
      pickerPanel?.classList.remove('hidden');
      continuePanel?.classList.remove('hidden');
      const u = activeUser();
      const dueLanding = u ? Storage.getDueReviews(progress) : [];
      Einstein.speak($('#landing-speech'),
        u
          ? (dueLanding.length
            ? `Welcome back, ${u.displayName}! Time to keep skills sharp — ${dueLanding.length} review${dueLanding.length===1?'':'s'} due!`
            : `Welcome back, ${u.displayName}! Ready to continue our cosmic number adventure?`)
          : "Pick an explorer — or create a new one!"
      );
      renderUserPicker();
      updateContinueVisibility();
      renderTodaysPath('landing-todays-path');
    }
    updateHeaderUser();
    syncSpeechFromStore();
  }

  function updateContinueVisibility() {
    const btn = $('#btn-continue');
    if (!btn) return;
    const u = activeUser();
    syncProgressFromStore();
    if (u && (progress.started || progress.diagnosticDone || progress.currentLessonId)) {
      btn.classList.remove('hidden');
    } else {
      btn.classList.add('hidden');
    }
  }

  function renderCreateForm(mode) {
    const host = mode === 'create' ? $('#create-form') : $('#new-explorer-form');
    if (!host) return;
    const defaultTrack = curriculum.meta.defaultTrackId || 'ages-7-8';
    host.innerHTML = `
      <label class="field-label" for="input-name-${mode}">Explorer name</label>
      <input type="text" id="input-name-${mode}" class="text-input" maxlength="24" placeholder="e.g. Sam" autocomplete="nickname" />
      <p class="field-label" style="margin-top:0.75rem;">Age track</p>
      <div class="track-grid" id="track-grid-${mode}">${trackButtonsHtml(defaultTrack, mode)}</div>
      <div style="margin-top:1rem;display:flex;gap:0.5rem;flex-wrap:wrap;">
        <button type="button" class="btn btn-primary" id="btn-save-profile-${mode}">${mode === 'create' ? 'Start Adventure!' : 'Create Explorer'}</button>
        ${mode === 'new' ? `<button type="button" class="btn btn-ghost" id="btn-cancel-new">Cancel</button>` : ''}
      </div>
      <p class="privacy-note">Progress stays on this device only — no accounts or passwords.</p>`;

    let selected = defaultTrack;
    $$('#track-grid-' + mode + ' .track-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selected = btn.getAttribute('data-' + mode + '-track');
        $$('#track-grid-' + mode + ' .track-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });

    $('#btn-save-profile-' + mode)?.addEventListener('click', () => {
      const name = ($('#input-name-' + mode)?.value || '').trim();
      if (!name) {
        $('#input-name-' + mode)?.focus();
        return;
      }
      Storage.createUser(store, { displayName: name, trackId: selected });
      store = Storage.loadStore();
      syncProgressFromStore();
      if (mode === 'new') {
        $('#new-explorer-form')?.classList.add('hidden');
        renderLanding();
      }
      // New users go to diagnostic for their track
      startDiagnostic();
    });

    $('#btn-cancel-new')?.addEventListener('click', () => {
      $('#new-explorer-form')?.classList.add('hidden');
      renderUserPicker();
    });
  }

  function renderUserPicker() {
    const list = $('#user-picker-list');
    if (!list) return;
    const users = Storage.listUsers(store);
    const activeId = store.activeUserId;
    list.innerHTML = users.map(u => {
      const t = curriculum.tracks[u.trackId];
      const letter = (u.displayName || 'E').charAt(0).toUpperCase();
      const active = u.id === activeId ? ' active' : '';
      return `<button type="button" class="user-card${active}" data-user-id="${u.id}">
        <span class="user-avatar" style="background:${escapeAttr(u.avatarColor || '#FF6B35')}">${escapeHtml(letter)}</span>
        <span class="user-card-text">
          <strong>${escapeHtml(u.displayName)}</strong>
          <span class="muted">${escapeHtml(t ? t.label : u.trackId)}</span>
        </span>
      </button>`;
    }).join('');

    $$('.user-card', list).forEach(btn => {
      btn.addEventListener('click', () => {
        Storage.setActiveUser(store, btn.dataset.userId);
        store = Storage.loadStore();
        syncProgressFromStore();
        renderLanding();
      });
    });

    const showNew = $('#btn-show-new');
    if (showNew) {
      showNew.onclick = () => {
        const form = $('#new-explorer-form');
        form?.classList.remove('hidden');
        renderCreateForm('new');
      };
    }
  }

  /* ——— Diagnostic (track-scoped) ——— */

  let diagIndex = 0;
  let diagAnswers = {};

  function startDiagnostic() {
    const u = activeUser();
    if (!u) {
      showScreen('screen-landing');
      renderLanding();
      return;
    }
    syncProgressFromStore();
    diagIndex = 0;
    diagAnswers = {};
    progress.started = true;
    persistProgress();
    showScreen('screen-diagnostic');
    renderDiagnosticQ();
  }

  function renderDiagnosticQ() {
    const track = activeTrack();
    const d = track.diagnostic;
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
    const track = activeTrack();
    const d = track.diagnostic;
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
    if (!recommended.length && track.units.length) {
      recommended.push(track.units[0].id);
      if (track.units[1]) recommended.push(track.units[1].id);
    }
    progress.recommendedUnits = recommended;
    persistProgress();
    showScreen('screen-diag-result');
    const correct = Object.values(scores).filter(Boolean).length;
    Einstein.mount($('#diag-result-einstein'), 'cheer');
    const totalQ = d.questions.length;
    Einstein.speak($('#diag-result-speech'),
      correct >= Math.ceil(totalQ * 0.7)
        ? `Amazing! You got ${correct} of ${totalQ}. You're ready for bigger adventures!`
        : `You got ${correct} of ${totalQ} — that's a great start! We'll strengthen the spots that need a boost. No shame — every hero trains!`
    );
    const recNames = recommended.map(id => {
      const u = track.units.find(x => x.id === id);
      return u ? u.title : id;
    });
    $('#diag-result-body').innerHTML = `
      <p style="font-weight:700;margin-bottom:0.75rem;">Suggested path (${escapeHtml(track.label)}):</p>
      <ul class="steps-list">${recNames.map(n => `<li>${escapeHtml(n)}</li>`).join('')}</ul>
      <p style="margin-top:1rem;">You can also pick any unlocked lesson from the Mission Map!</p>`;
  }

  /* ——— Hub / Mission Map ——— */

  function renderHub() {
    const u = activeUser();
    if (!u) {
      showScreen('screen-landing');
      renderLanding();
      return;
    }
    syncProgressFromStore();
    const track = activeTrack();
    showScreen('screen-hub');
    const due = Storage.getDueReviews(progress);
    Einstein.mount($('#hub-einstein'), due.length ? 'think' : 'idle');
    Einstein.speak($('#hub-speech'),
      due.length
        ? `Time to keep this sharp! You have ${due.length} review mission${due.length === 1 ? '' : 's'} due. Let's stay cosmic!`
        : `Here's the Mission Map for ${track.label}! Pick a unit — I'll coach you through every panel.`
    );
    const trackLabel = $('#hub-track-label');
    if (trackLabel) trackLabel.textContent = `${track.label} · ${track.gradeBand}`;

    renderTodaysPath('hub-todays-path');

    const reviewHost = $('#review-due-panel');
    if (reviewHost) {
      if (due.length) {
        reviewHost.classList.remove('hidden');
        reviewHost.innerHTML = `
          <h3 class="panel-title" style="font-size:1.3rem;">Review due ★</h3>
          <p class="muted" style="margin-bottom:0.5rem;">Spaced review keeps mastery sticky — device-local only.</p>
          <ul class="lesson-list">
            ${due.map(d => {
              const L = track.lessons[d.lessonId];
              const title = L ? L.title : d.lessonId;
              return `<li>
                <span>${escapeHtml(title)}</span>
                <button type="button" class="badge review btn-review" data-lesson="${d.lessonId}">REVIEW</button>
              </li>`;
            }).join('')}
          </ul>`;
        $$('.btn-review', reviewHost).forEach(btn => {
          btn.addEventListener('click', () => startLesson(btn.dataset.lesson, { mode: 'review' }));
        });
      } else {
        reviewHost.classList.add('hidden');
        reviewHost.innerHTML = '';
      }
    }

    const grid = $('#unit-grid');
    grid.innerHTML = track.units.map(unit => {
      const lessons = (unit.lessons || [])
        .map(id => track.lessons[id])
        .filter(Boolean);
      const accent = unit.color || '#FF6B35';
      const rec = (progress.recommendedUnits || []).includes(unit.id);
      const summary = Storage.unitMasterySummary(progress, unit, track);
      return `
        <div class="unit-card${rec ? ' recommended' : ''}" style="border-top: 8px solid ${accent}" data-unit="${unit.id}">
          <div class="unit-icon">${unit.icon}</div>
          <h3>${escapeHtml(unit.title)}${rec ? ' <span class="rec-pill">Suggested</span>' : ''}</h3>
          <p>${escapeHtml(unit.description)}</p>
          <p class="unit-mastery-line">Mastered ${summary.mastered}/${summary.total}${summary.due ? ` · ${summary.due} review due` : ''}</p>
          ${lessons.length ? `
            <ul class="lesson-list">
              ${lessons.map(L => {
                const st = Storage.lessonStatus(progress, L.id, track);
                const weakPrereqs = Storage.prereqNeedsStrengthen(progress, L, track);
                let label = st === 'done' ? 'DONE' : st === 'needs_review' ? 'RETRY' : st === 'in_progress' ? 'RESUME' : st === 'locked' ? 'LOCKED' : 'GO';
                let cls = st === 'done' ? 'done' : st === 'needs_review' ? 'needs-review' : st === 'locked' ? 'locked' : '';
                const strengthen = weakPrereqs.length
                  ? `<span class="strengthen-tag" title="Try prerequisite first">Strengthen first</span>`
                  : '';
                return `<li>
                  <span>${escapeHtml(L.title)}${strengthen}</span>
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
        const mode = btn.dataset.status === 'needs_review' ? 'remediate' : 'lesson';
        startLesson(btn.dataset.lesson, { mode });
      });
    });
  }

  /* ——— Progress / profile manage ——— */


  function formatParentWhen(iso) {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return String(iso);
    }
  }

  function renderParentSummary() {
    const u = activeUser();
    const host = $('#parent-summary-body');
    if (!host) return;
    if (!u || !curriculum) {
      host.innerHTML = '<p class="privacy-note">Select an explorer to see the family summary.</p>';
      return;
    }
    const summary = Storage.getParentSummary(store, u.id, curriculum);
    if (!summary) {
      host.innerHTML = '<p class="privacy-note">No summary available.</p>';
      return;
    }
    const weak = summary.weakSpots.length
      ? `<ul class="lesson-list">${summary.weakSpots.map(w =>
          `<li><span>${escapeHtml(w.title)}</span><span class="badge needs-review">needs review</span></li>`
        ).join('')}</ul>`
      : '<p class="muted">No weak spots flagged right now — nice!</p>';
    const units = summary.units.map(un =>
      `<li><span>${un.icon || ''} ${escapeHtml(un.title)}</span>
        <span class="badge ${un.mastered === un.total && un.total ? 'done' : ''}">${un.mastered}/${un.total} mastered${un.due ? ` · ${un.due} due` : ''}</span></li>`
    ).join('');
    const recent = summary.recentActivity.length
      ? `<ul class="lesson-list">${summary.recentActivity.map(r =>
          `<li><span>${escapeHtml(r.title)}</span><span class="badge">${escapeHtml((r.masteryLevel || r.status || '').replace('_',' '))} · ${escapeHtml(formatParentWhen(r.lastAt))}</span></li>`
        ).join('')}</ul>`
      : '<p class="muted">No lesson activity yet.</p>';
    const due = summary.reviewsDueCount
      ? `<p style="font-weight:700;">⏱ ${summary.reviewsDueCount} review${summary.reviewsDueCount === 1 ? '' : 's'} due</p>
         <ul class="lesson-list">${summary.reviewsDue.slice(0,6).map(r =>
           `<li><span>${escapeHtml(r.title)}</span><span class="badge">${escapeHtml(formatParentWhen(r.nextReviewAt))}</span></li>`
         ).join('')}</ul>`
      : '<p class="muted">No reviews due.</p>';

    host.innerHTML = `
      <div class="parent-card">
        <div class="parent-identity">
          <span class="user-avatar" style="background:${escapeHtml(summary.avatarColor || '#4ECDC4')}">${escapeHtml((summary.displayName || '?')[0].toUpperCase())}</span>
          <div>
            <strong>${escapeHtml(summary.displayName)}</strong>
            <div class="muted">${escapeHtml(summary.trackLabel)}${summary.ageRange ? ' · ' + escapeHtml(summary.ageRange) : ''}</div>
          </div>
        </div>
        <div class="stat-row parent-stats">
          <div class="stat-box"><div class="num">${summary.stars}</div><div class="label">Stars</div></div>
          <div class="stat-box"><div class="num">${summary.lessonsDone}/${summary.lessonsTotal}</div><div class="label">Lessons Done</div></div>
          <div class="stat-box"><div class="num">${summary.lessonsMastered}</div><div class="label">Mastered</div></div>
          <div class="stat-box"><div class="num">${summary.reviewsDueCount}</div><div class="label">Reviews Due</div></div>
        </div>
        <p class="muted">Last activity: ${escapeHtml(formatParentWhen(summary.lastAt))} · Warm-up: ${summary.diagnosticDone ? 'done' : 'not yet'}</p>
        <h3 class="panel-title" style="font-size:1.1rem;margin-top:1rem;">Unit mastery</h3>
        <ul class="lesson-list">${units}</ul>
        <h3 class="panel-title" style="font-size:1.1rem;margin-top:1rem;">Reviews due</h3>
        ${due}
        <h3 class="panel-title" style="font-size:1.1rem;margin-top:1rem;">Weak spots</h3>
        ${weak}
        <h3 class="panel-title" style="font-size:1.1rem;margin-top:1rem;">Recent activity</h3>
        ${recent}
      </div>`;
  }

  function downloadParentJson() {
    const u = activeUser();
    if (!u || !curriculum) return;
    const summary = Storage.getParentSummary(store, u.id, curriculum);
    if (!summary) return;
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    const safe = (summary.displayName || 'explorer').replace(/[^\w\-]+/g, '_').slice(0, 32);
    a.href = URL.createObjectURL(blob);
    a.download = `einstein-math-parent-${safe}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function printParentSummary() {
    document.body.classList.add('print-parent');
    window.print();
    setTimeout(() => document.body.classList.remove('print-parent'), 400);
  }

  function renderProgress() {
    const u = activeUser();
    if (!u) {
      showScreen('screen-landing');
      renderLanding();
      return;
    }
    syncProgressFromStore();
    const track = activeTrack();
    showScreen('screen-progress');
    const allIds = Object.keys(track.lessons);
    const done = allIds.filter(id => progress.lessons[id]?.status === 'done').length;
    const pct = allIds.length ? Math.round((done / allIds.length) * 100) : 0;
    $('#stat-stars').textContent = progress.stars || 0;
    $('#stat-done').textContent = done;
    $('#stat-total').textContent = allIds.length;
    $('#stat-diag').textContent = progress.diagnosticDone ? 'Yes' : 'No';
    $('#progress-bar').style.width = pct + '%';
    $('#progress-pct').textContent = pct + '%';
    const profileLine = $('#progress-profile-line');
    if (profileLine) {
      profileLine.innerHTML = `<strong>${escapeHtml(u.displayName)}</strong> · ${escapeHtml(track.label)}
        <span class="muted">(progress for this age track)</span>`;
    }

    const dueCount = Storage.getDueReviews(progress).length;
    const unitHost = $('#progress-unit-mastery');
    if (unitHost) {
      unitHost.innerHTML = `<h3 class="panel-title" style="font-size:1.2rem;margin-top:1rem;">Mastery by unit</h3>
        <ul class="lesson-list">
          ${track.units.map(unit => {
            const s = Storage.unitMasterySummary(progress, unit, track);
            return `<li><span>${unit.icon} ${escapeHtml(unit.title)}</span>
              <span class="badge ${s.mastered === s.total && s.total ? 'done' : ''}">${s.mastered}/${s.total} mastered${s.due ? ` · ${s.due} due` : ''}</span></li>`;
          }).join('')}
        </ul>
        <p class="privacy-note">Mastery &amp; review schedule stay on this device only (no cloud).</p>
        ${dueCount ? `<p style="font-weight:700;">⏱ ${dueCount} review${dueCount === 1 ? '' : 's'} due — open Mission Map!</p>` : ''}`;
    }

    const list = $('#progress-lesson-list');
    list.innerHTML = allIds.map(id => {
      const L = track.lessons[id];
      const st = Storage.lessonStatus(progress, id, track);
      const saved = progress.lessons[id] ? Storage.normalizeLesson(progress.lessons[id]) : null;
      const unit = track.units.find(x => x.id === L.unitId);
      const level = saved?.masteryLevel ? ` · ${saved.masteryLevel.replace('_', ' ')}` : '';
      const cls = st === 'done' ? 'done' : st === 'needs_review' ? 'needs-review' : st === 'locked' ? 'locked' : '';
      return `<li>
        <span>${unit ? unit.icon + ' ' : ''}${escapeHtml(L.title)}</span>
        <span class="badge ${cls}">${st.replace('_', ' ').toUpperCase()}${level}</span>
      </li>`;
    }).join('');

    // Track switcher
    const trackHost = $('#progress-track-switch');
    if (trackHost) {
      trackHost.innerHTML = `
        <p class="field-label">Age track</p>
        <div class="track-grid compact">${trackButtonsHtml(u.trackId, 'prog')}</div>
        <p class="privacy-note">Switching tracks keeps each track's stars separate. Confirm when changing.</p>`;
      $$('.track-btn', trackHost).forEach(btn => {
        btn.addEventListener('click', () => {
          const next = btn.getAttribute('data-prog-track');
          if (next === u.trackId) return;
          const tNext = curriculum.tracks[next];
          if (!confirm(`Switch ${u.displayName} to ${tNext.label}? Progress on ${track.label} stays saved.`)) return;
          Storage.setUserTrack(store, u.id, next);
          store = Storage.loadStore();
          syncProgressFromStore();
          renderProgress();
        });
      });
    }

    Einstein.mount($('#progress-einstein'), done > 0 ? 'cheer' : 'think');
    const dueN = Storage.getDueReviews(progress).length;
    Einstein.speak($('#progress-speech'),
      done === 0
        ? "Your adventure log is empty — let's earn some stars!"
        : dueN
          ? `You've completed ${done} lesson${done === 1 ? '' : 's'} and earned ${progress.stars || 0} star${(progress.stars||0)===1?'':'s'}! ${dueN} review${dueN===1?'':'s'} due — time to keep skills sharp!`
          : `You've completed ${done} lesson${done === 1 ? '' : 's'} on this track and earned ${progress.stars || 0} star${(progress.stars||0)===1?'':'s'}! Keep going!`
    );

    renderParentSummary();
  }

  /* ——— Lessons ——— */

  function startLesson(lessonId, opts = {}) {
    const track = activeTrack();
    const lesson = track.lessons[lessonId];
    if (!lesson) return;
    syncProgressFromStore();
    const mode = opts.mode || 'lesson'; // lesson | review | remediate
    const saved = progress.lessons[lessonId]
      ? Storage.normalizeLesson(progress.lessons[lessonId])
      : null;

    // Build question lists for review / remediation
    let practiceList = lesson.practice || [];
    let checkList = lesson.quickCheck || [];
    if (mode === 'review') {
      // Shorter mixed set: up to 3 practice + all check (or practice if no check)
      practiceList = (lesson.practice || []).slice(0, 3);
      checkList = (lesson.quickCheck || []).length
        ? lesson.quickCheck
        : (lesson.practice || []).slice(-2);
    } else if (mode === 'remediate') {
      const missedIds = (saved && saved.missedCheckIds) || [];
      const allCheck = lesson.quickCheck || [];
      const weak = allCheck.filter(q => missedIds.includes(q.id));
      const fromPractice = (lesson.practice || []).filter(q => missedIds.includes(q.id));
      practiceList = (weak.length || fromPractice.length)
        ? [...fromPractice, ...weak].slice(0, 4)
        : (lesson.practice || []).slice(0, 3);
      checkList = weak.length ? weak : allCheck;
    }

    lessonCtx = {
      lesson,
      mode,
      phase: mode === 'review' || mode === 'remediate' ? 'intro' : 'intro',
      panelIndex: 0,
      practiceIndex: 0,
      checkIndex: 0,
      practiceCorrect: 0,
      practiceTotal: 0,
      checkCorrect: 0,
      checkTotal: 0,
      missedCheckIds: [],
      practiceList,
      checkList,
      skipExplain: mode === 'review' || mode === 'remediate'
    };
    Storage.setLessonProgress(progress, lessonId, { status: 'in_progress' });
    persistProgress();
    showScreen('screen-lesson');
    renderLessonPhase();
  }

  function setPips() {
    const L = lessonCtx.lesson;
    const track = activeTrack();
    const phases = ['intro', 'explain', 'example', 'practice', 'check', 'complete'];
    const labels = ['Hi', 'Learn', 'Example', 'Practice', 'Check', '★'];
    const cur = phases.indexOf(lessonCtx.phase);
    $('#lesson-pips').innerHTML = labels.map((lab, i) =>
      `<div class="pip ${i < cur ? 'done' : i === cur ? 'current' : ''}" title="${lab}"></div>`
    ).join('');
    $('#lesson-title').textContent = L.title;
    const unit = track.units.find(u => u.id === L.unitId);
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
      Einstein.mount(stage, lessonCtx.mode === 'review' ? 'think' : 'explain');
      if (lessonCtx.mode === 'review') {
        Einstein.speak(bubble, `Time to keep this sharp! Quick review of "${L.title}" — you've got this!`);
        body.innerHTML = `<div class="viz-box">★ Spaced review mission ★</div>`;
        actions.innerHTML = `<button type="button" class="btn btn-primary" id="btn-next">Start Review!</button>`;
        $('#btn-next').onclick = () => {
          lessonCtx.phase = 'practice';
          lessonCtx.practiceIndex = 0;
          renderLessonPhase();
        };
      } else if (lessonCtx.mode === 'remediate') {
        Einstein.speak(bubble, `Let's retry the weak spots from "${L.title}" — mistakes are plot twists, not endings!`);
        body.innerHTML = `<div class="viz-box">Retry weak spots — short &amp; focused!</div>`;
        actions.innerHTML = `<button type="button" class="btn btn-primary" id="btn-next">Retry Weak Spots!</button>`;
        $('#btn-next').onclick = () => {
          lessonCtx.phase = 'practice';
          lessonCtx.practiceIndex = 0;
          renderLessonPhase();
        };
      } else {
        Einstein.speak(bubble, L.einsteinIntro);
        body.innerHTML = `<div class="viz-box">Get ready — comic-panel learning ahead!</div>`;
        actions.innerHTML = `<button type="button" class="btn btn-primary" id="btn-next">Let's Learn!</button>`;
        $('#btn-next').onclick = () => { lessonCtx.phase = 'explain'; lessonCtx.panelIndex = 0; renderLessonPhase(); };
      }
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
      const pc = lessonCtx.practiceCorrect;
      const pt = lessonCtx.practiceTotal;
      const cc = lessonCtx.checkCorrect;
      const ct = lessonCtx.checkTotal;
      const checkPct = ct > 0 ? cc / ct : 0;
      const stats = {
        practiceCorrect: pc, practiceTotal: pt,
        checkCorrect: cc, checkTotal: ct,
        missedCheckIds: lessonCtx.missedCheckIds || []
      };
      let entry;
      if (lessonCtx.mode === 'remediate') {
        entry = Storage.applyRemediationSuccess(progress, L.id, stats);
      } else {
        entry = Storage.markLessonDone(progress, L.id, stats, {
          isReview: lessonCtx.mode === 'review',
          missedCheckIds: lessonCtx.missedCheckIds || []
        });
      }
      persistProgress();

      const needsRemediation = checkPct < 0.6;
      Einstein.mount(stage, needsRemediation ? 'think' : 'cheer');
      if (!needsRemediation) Einstein.pow(stage, 'YEAH!');

      let speech;
      if (needsRemediation) {
        speech = `Quick Check ${cc}/${ct} — we'll strengthen the weak spots. No shame — every hero trains!`;
      } else if (lessonCtx.mode === 'review') {
        speech = `Review complete! Practice ${pc}/${pt}, Check ${cc}/${ct}. Skills staying sharp — next review scheduled!`;
      } else if (lessonCtx.mode === 'remediate') {
        speech = entry.masteryLevel === 'mastered'
          ? `Weak spots cleared! Practice ${pc}/${pt}, Check ${cc}/${ct}. Mastery climbing — cosmic recovery!`
          : `Retry done! Practice ${pc}/${pt}, Check ${cc}/${ct}. Mastery nudged up — keep training!`;
      } else if (entry.masteryLevel === 'mastered') {
        speech = `Lesson mastered! Practice ${pc}/${pt}, Quick Check ${cc}/${ct}. Star earned — review in about a day!`;
      } else {
        speech = `Lesson complete! Practice ${pc}/${pt}, Quick Check ${cc}/${ct}. Keep practicing to lock mastery!`;
      }
      Einstein.speak(bubble, speech, needsRemediation ? 'correction' : 'success');

      const masteryPct = Math.round((entry.mastery || 0) * 100);
      body.innerHTML = `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.6rem;">
          ${needsRemediation ? '⚡ KEEP TRAINING' : '★ STAR EARNED ★'}
        </div>
        <p style="font-weight:700;text-align:center;">Mastery: ${masteryPct}% · ${escapeHtml((entry.masteryLevel || '').replace('_', ' '))}</p>
        ${entry.nextReviewAt ? `<p class="muted" style="text-align:center;">Next review: ${escapeHtml(new Date(entry.nextReviewAt).toLocaleString())}</p>` : ''}
        <p style="font-weight:700;text-align:center;">Mistakes are just plot twists — you finished the issue!</p>`;

      if (needsRemediation) {
        actions.innerHTML = `
          <button type="button" class="btn btn-primary" id="btn-retry-weak">Retry Weak Spots</button>
          <button type="button" class="btn btn-cyan" id="btn-map">Mission Map</button>
          <button type="button" class="btn btn-ghost" id="btn-redo">Full Lesson Redo</button>`;
        $('#btn-retry-weak').onclick = () => startLesson(L.id, { mode: 'remediate' });
        $('#btn-map').onclick = renderHub;
        $('#btn-redo').onclick = () => startLesson(L.id, { mode: 'lesson' });
      } else {
        actions.innerHTML = `
          <button type="button" class="btn btn-cyan" id="btn-map">Mission Map</button>
          <button type="button" class="btn btn-primary" id="btn-progress">See Progress</button>`;
        $('#btn-map').onclick = renderHub;
        $('#btn-progress').onclick = renderProgress;
      }
    }
  }

  function renderQuestion(mode) {
    const L = lessonCtx.lesson;
    const list = mode === 'practice'
      ? (lessonCtx.practiceList || L.practice || [])
      : (lessonCtx.checkList || L.quickCheck || []);
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
        else if (q.id) {
          if (!lessonCtx.missedCheckIds.includes(q.id)) lessonCtx.missedCheckIds.push(q.id);
        }
      } else {
        lessonCtx.checkTotal++;
        if (ok) lessonCtx.checkCorrect++;
        else if (q.id) {
          if (!lessonCtx.missedCheckIds.includes(q.id)) lessonCtx.missedCheckIds.push(q.id);
        }
      }

      // Checkpoint mid-lesson so refresh doesn't lose attempt counts entirely
      Storage.setLessonProgress(progress, L.id, {
        status: 'in_progress',
        practiceCorrect: lessonCtx.practiceCorrect,
        practiceTotal: lessonCtx.practiceTotal,
        checkCorrect: lessonCtx.checkCorrect,
        checkTotal: lessonCtx.checkTotal
      });
      persistProgress();

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

  function requireUserThen(fn) {
    if (!activeUser()) {
      showScreen('screen-landing');
      renderLanding();
      return;
    }
    fn();
  }

  function openSwitcher() {
    const modal = $('#switcher-modal');
    if (!modal) return;
    const list = $('#switcher-list');
    const users = Storage.listUsers(store);
    list.innerHTML = users.map(u => {
      const t = curriculum.tracks[u.trackId];
      const letter = (u.displayName || 'E').charAt(0).toUpperCase();
      return `<button type="button" class="user-card" data-switch-id="${u.id}">
        <span class="user-avatar" style="background:${escapeAttr(u.avatarColor || '#FF6B35')}">${escapeHtml(letter)}</span>
        <span class="user-card-text">
          <strong>${escapeHtml(u.displayName)}</strong>
          <span class="muted">${escapeHtml(t ? t.label : '')}</span>
        </span>
      </button>`;
    }).join('');
    $$('[data-switch-id]', list).forEach(btn => {
      btn.addEventListener('click', () => {
        Storage.setActiveUser(store, btn.dataset.switchId);
        store = Storage.loadStore();
        syncProgressFromStore();
        modal.classList.add('hidden');
        showScreen('screen-landing');
        renderLanding();
      });
    });
    modal.classList.remove('hidden');
  }

  function wireNav() {
    $('#btn-start')?.addEventListener('click', () => {
      requireUserThen(() => {
        syncProgressFromStore();
        if (!progress.diagnosticDone) startDiagnostic();
        else renderHub();
      });
    });
    $('#btn-continue')?.addEventListener('click', () => {
      requireUserThen(() => continueAdventure());
    });
    $('#btn-to-hub')?.addEventListener('click', () => requireUserThen(renderHub));
    $('#btn-parent-print')?.addEventListener('click', () => printParentSummary());
    $('#btn-parent-json')?.addEventListener('click', () => downloadParentJson());

    $('#btn-diag-to-hub')?.addEventListener('click', () => requireUserThen(renderHub));
    $$('[data-nav]').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.nav;
        if (t === 'landing') { showScreen('screen-landing'); renderLanding(); }
        else if (t === 'hub') requireUserThen(renderHub);
        else if (t === 'progress') requireUserThen(renderProgress);
      });
    });
    $('#btn-reset')?.addEventListener('click', () => {
      const u = activeUser();
      if (!u) return;
      const track = activeTrack();
      if (confirm(`Reset ${u.displayName}'s progress on ${track.label} only? Other tracks & explorers stay safe.`)) {
        progress = Storage.resetTrackProgress(store, u.id, u.trackId);
        store = Storage.loadStore();
        syncProgressFromStore();
        renderProgress();
      }
    });
    $('#btn-rename')?.addEventListener('click', () => {
      const u = activeUser();
      if (!u) return;
      const next = prompt('New explorer name:', u.displayName);
      if (next == null) return;
      Storage.renameUser(store, u.id, next);
      store = Storage.loadStore();
      renderProgress();
      updateHeaderUser();
    });
    $('#btn-delete-user')?.addEventListener('click', () => {
      const u = activeUser();
      if (!u) return;
      if (!confirm(`Delete explorer "${u.displayName}" and all their progress on this device?`)) return;
      Storage.deleteUser(store, u.id);
      store = Storage.loadStore();
      syncProgressFromStore();
      showScreen('screen-landing');
      renderLanding();
    });
    $('#user-chip')?.addEventListener('click', openSwitcher);
    $('#btn-close-switcher')?.addEventListener('click', () => {
      $('#switcher-modal')?.classList.add('hidden');
    });
    $('#switcher-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'switcher-modal') e.target.classList.add('hidden');
    });
    $('.logo')?.addEventListener('click', () => {
      showScreen('screen-landing');
      renderLanding();
    });

    $('#btn-speech-toggle')?.addEventListener('click', () => toggleSpeech());
    $('#btn-speech-replay')?.addEventListener('click', () => Einstein.replayLast());

    $('#btn-export-all')?.addEventListener('click', () => exportAllProfiles());
    $('#btn-import-profiles')?.addEventListener('click', () => {
      const input = $('#input-import-profiles');
      if (input) {
        input.value = '';
        input.click();
      }
    });
    $('#input-import-profiles')?.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) importProfilesFromFile(file);
    });
  }

  function exportAllProfiles() {
    store = Storage.loadStore();
    const payload = Storage.exportAllProfiles(store);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = URL.createObjectURL(blob);
    a.download = `einstein-math-profiles-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function importProfilesFromFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = Storage.parseImportPayload(String(reader.result || ''));
        const userCount = Object.keys(data.users || {}).length;
        if (!userCount) {
          alert('That file has no explorer profiles.');
          return;
        }
        const mode = confirm(
          `Import ${userCount} explorer profile(s) from "${file.name}"?\n\n` +
          'OK = MERGE with this device (recommended).\n' +
          'Cancel = stop (or use Replace on the next prompt).\n\n' +
          'Merge keeps newer updatedAt / lesson lastAt on conflicts. This is a file handoff — not cloud sync.'
        );
        if (mode) {
          const { store: next, stats } = Storage.mergeImportedStore(store, data);
          store = next;
          syncProgressFromStore();
          syncSpeechFromStore();
          alert(`Merge complete: ${stats.added} added, ${stats.merged} merged.`);
          renderProgress();
          updateHeaderUser();
          return;
        }
        const replace = confirm(
          'REPLACE ALL profiles on THIS device with the file?\n\n' +
          'This deletes current explorers on this browser origin and cannot be undone (unless you exported first).\n\n' +
          'OK = replace all. Cancel = do nothing.'
        );
        if (!replace) return;
        const really = confirm("Final confirm: wipe this device's Einstein Math profiles and load the file?");
        if (!really) return;
        store = Storage.replaceAllFromImport(data);
        syncProgressFromStore();
        syncSpeechFromStore();
        alert('Replace-all complete. Profiles loaded from file.');
        showScreen('screen-landing');
        renderLanding();
      } catch (err) {
        alert('Import failed: ' + (err && err.message ? err.message : String(err)));
      }
    };
    reader.onerror = () => alert('Could not read that file.');
    reader.readAsText(file);
  }

  async function boot() {
    try {
      const res = await fetch('data/curriculum.json');
      if (!res.ok) throw new Error('Failed to load curriculum');
      curriculum = await res.json();
      if (!curriculum.tracks) throw new Error('Curriculum missing tracks');
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
    store = Storage.loadStore();
    syncProgressFromStore();
    syncSpeechFromStore();
    refreshStudentCast();
    wireNav();
    renderLanding();
    showScreen('screen-landing');
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
