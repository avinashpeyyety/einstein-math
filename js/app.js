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

  /* X3: the active subject (math | physics) scopes the track, progress, Today's path and parent summary */
  function activeSubjectId() {
    return Storage.getActiveSubject(store);
  }

  function activeTrackId() {
    const u = activeUser();
    return (u && Storage.subjectTrackId(u, activeSubjectId())) || curriculum?.meta?.defaultTrackId || 'ages-7-8';
  }

  /** Age tracks (labels / picker) come from math, the subject every explorer has. */
  function ageTracks() {
    return (curriculum && curriculum.subjects && curriculum.subjects.math && curriculum.subjects.math.tracks) || (curriculum && curriculum.tracks) || {};
  }

  /** Lessons for the active subject + track, or null when the subject has none yet (physics stub). */
  function activeTrack() {
    if (!curriculum) return null;
    const id = activeTrackId();
    if (activeSubjectId() !== 'math') return curriculum.tracks[id] || null;
    return curriculum.tracks[id] || curriculum.tracks['ages-7-8'];
  }

  function subjectReady() {
    return !!activeTrack();
  }

  /** The warm-up diagnostic is a math thing; physics lessons open straight from the map / Today's path. */
  function isMathSubject() {
    return activeSubjectId() === 'math';
  }

  /** Friendly empty state for a subject without lessons yet (physics stub). */
  function comingSoonHtml(compact) {
    const sub = Subjects.get(activeSubjectId());
    return `
      <div class="todays-path-inner todays-path-empty subject-soon">
        <h3 class="todays-path-title">${escapeHtml(sub.label)} with Einstein — coming soon!</h3>
        <p class="todays-path-lede">${Object.keys((curriculum && curriculum.subjects && curriculum.subjects[sub.id] && curriculum.subjects[sub.id].tracks) || {}).length
          ? `Einstein's lab is open for other age groups — ${escapeHtml((ageTracks()[activeTrackId()] || {}).label || 'this age')} experiments are on the way!`
          : 'Ramps, magnets, light and sinking-or-floating experiments are being built right now.'}</p>
        ${compact ? '' : '<p class="todays-path-empty-copy">Your Math stars and lessons are safe — they stay under Math.</p>'}
        <button type="button" class="btn btn-cyan btn-sm" data-switch-subject="math">Back to Math</button>
      </div>`;
  }

  function wireComingSoon(host) {
    host.querySelectorAll('[data-switch-subject]').forEach(btn => {
      btn.addEventListener('click', () => switchSubject(btn.dataset.switchSubject));
    });
  }



  function wireStudentMirror() {
    if (typeof Einstein === 'undefined' || typeof Student === 'undefined') return;
    if (Einstein._studentMirrorWired) return;
    Einstein._studentMirrorWired = true;
    const origMount = Einstein.mount.bind(Einstein);
    Einstein.mount = function (el, state) {
      origMount(el, state);
      try { Student.mirrorState(state || 'idle'); } catch (_) {}
    };
    const origSet = Einstein.setState && Einstein.setState.bind(Einstein);
    if (origSet) {
      Einstein.setState = function (el, state) {
        origSet(el, state);
        try { Student.mirrorState(state || 'idle'); } catch (_) {}
      };
    }
  }

  function refreshStudentCast(state) {
    if (typeof Student === 'undefined') return;
    const u = activeUser();
    const name = (u && u.displayName) || 'Explorer';
    const avatar = Storage.avatarSrc(u, true); // avatarImage512 || avatarImage || avatarDataUrl
    Student.refreshAll(name, state, avatar);
  }

  function syncProgressFromStore() {
    const u = activeUser();
    if (!u) {
      progress = Storage.trackDefaults();
      refreshStudentCast();
      return;
    }
    // a subject without lessons gets an in-memory blank (no empty subject:track key is written)
    progress = subjectReady()
      ? Storage.getTrackProgress(u, activeTrackId(), activeSubjectId())
      : Storage.trackDefaults();
    refreshStudentCast();
  }

  function persistProgress() {
    const u = activeUser();
    if (!u || !subjectReady()) return;
    Storage.saveTrackProgress(store, u.id, activeTrackId(), progress, activeSubjectId());
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
    if (!subjectReady()) {
      host.classList.remove('hidden');
      host.innerHTML = comingSoonHtml(false);
      wireComingSoon(host);
      return;
    }
    if (isMathSubject() && !progress.diagnosticDone && !progress.started) {
      host.classList.add('hidden');
      host.innerHTML = '';
      return;
    }
    const track = activeTrack();
    const suggestions = Storage.getSuggestedPath(progress, track, 3);
    host.classList.remove('hidden');
    if (!suggestions.length) {
      host.innerHTML = `
      <div class="todays-path-inner todays-path-empty">
        <h3 class="todays-path-title">Today's path</h3>
        <p class="todays-path-lede">You're all caught up for now.</p>
        <p class="todays-path-empty-copy">No reviews due and no next mission queued. Open the <strong>Mission Map</strong> and pick any lesson — or check back later when a spaced review pops up!</p>
      </div>`;
      return;
    }
    host.innerHTML = `
      <div class="todays-path-inner">
        <h3 class="todays-path-title">Today's path</h3>
        <p class="todays-path-lede">Up to 3 missions — reviews first, then new learning.</p>
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
    if (!subjectReady()) {
      renderHub();
      return;
    }
    if (isMathSubject() && !progress.diagnosticDone) {
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
    if (id !== 'screen-space' && location.hash === '#space') history.replaceState(null, '', location.pathname + location.search);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updateHeaderUser();
    updateSubjectChip();
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
    const av = $('#user-avatar');
    const nameEl = $('#user-name');
    if (av) paintAvatarEl(av, u);
    if (nameEl) nameEl.textContent = u.displayName;
    const trackMeta = $('#user-track-label');
    if (trackMeta && curriculum) {
      const t = ageTracks()[activeTrackId()];
      trackMeta.textContent = t ? t.label : '';
    }
    updateSubjectChip();
    refreshAvatarButtons();
  }

  function updateSubjectChip() {
    const label = $('#subject-chip-label');
    if (!label || typeof Subjects === 'undefined') return;
    const id = Storage.getActiveSubject(store);
    const sub = Subjects.get(id);
    label.textContent = sub ? sub.label : 'Math';
  }

  /** Letter or comic avatar into a .user-avatar element (one field: avatarImage || avatarDataUrl) */
  function paintAvatarEl(el, u) {
    if (!el || !u) return;
    const letter = (u.displayName || 'E').trim().charAt(0).toUpperCase();
    const src = Storage.avatarSrc(u);
    el.classList.remove('has-photo');
    el.style.backgroundImage = '';
    if (src) {
      el.classList.add('has-img');
      el.innerHTML = `<img src="${escapeAttr(src)}" alt="">`;
      el.style.background = '';
    } else {
      el.classList.remove('has-img');
      el.textContent = letter;
      el.style.background = u.avatarColor || '#FF6B35';
    }
  }

  /** Comic avatar when present (avatarImage || avatarDataUrl), else the letter-in-colour circle. */
  function avatarSpanHtml(u, extraClass = '') {
    const letter = escapeHtml(((u && u.displayName) || 'E').trim().charAt(0).toUpperCase());
    const extra = extraClass ? ' ' + extraClass : '';
    const src = Storage.avatarSrc(u);
    if (src) {
      return `<span class="user-avatar has-img${extra}"><img src="${escapeAttr(src)}" alt=""></span>`;
    }
    return `<span class="user-avatar${extra}" style="background:${escapeAttr((u && u.avatarColor) || '#FF6B35')}">${letter}</span>`;
  }

  /* ---------- one photo flow ----------
   * Home card upload, the create form and the profile "Comic avatar" modal all go through
   * renderExplorerAvatar() and saveExplorerAvatar() (avatarImage + avatarImage512, read via Storage.avatarSrc).
   * W1b MediaPipe comicify first; origin's canvas filter only when the model can't run on this browser
   * (no wasm SIMD / model failed to load); the letter avatar is the last resort. Never any network call. */
  const MODEL_BASE = 'vendor/mediapipe/';

  /** Non-blocking notice (no alert(), so a fallback never stops the flow). */
  function notice(msg) {
    const t = document.createElement('div');
    t.className = 'backup-toast';
    t.setAttribute('role', 'status');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  }

  const dataUrlBytes = (u) => Math.floor((u.length - u.indexOf(',') - 1) * 3 / 4);

  /** Fallback: origin's simple canvas comic filter (posterize + warm + edge ink + ink frame) on the square crop. */
  function filterAvatar(src, crop) {
    const MAX = (typeof Comicify !== 'undefined' && Comicify.MAX_BYTES) || 150 * 1024;
    const draw = (levels) => {
      const w = 512, h = 512;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.fillStyle = '#FFF8E7';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(src, crop.x, crop.y, crop.side, crop.side, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;
      // Posterize (`levels`, 8 by default) + gentle contrast/warmth (less muddy than 5-level)
      const step = 255 / (levels - 1);
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];
        // Contrast midtones slightly before quantize
        const contrast = 1.12;
        r = (r - 128) * contrast + 128;
        g = (g - 128) * contrast + 128;
        b = (b - 128) * contrast + 128;
        r = Math.round(Math.min(255, Math.max(0, r)) / step) * step;
        g = Math.round(Math.min(255, Math.max(0, g)) / step) * step;
        b = Math.round(Math.min(255, Math.max(0, b)) / step) * step;
        r = Math.min(255, r * 1.04 + 8);
        g = Math.min(255, g * 1.01 + 4);
        b = Math.min(255, b * 0.96);
        data[i] = r; data[i + 1] = g; data[i + 2] = b;
      }
      // Sobel-ish edge ink (thinner, higher threshold → less blotchy)
      const copy = new Uint8ClampedArray(data);
      const lum = (i) => 0.299 * copy[i] + 0.587 * copy[i + 1] + 0.114 * copy[i + 2];
      const thr = 52;
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const i = (y * w + x) * 4;
          const c = lum(i);
          const gx = Math.abs(c - lum(i + 4)) + Math.abs(c - lum(i - 4));
          const gy = Math.abs(c - lum(i + w * 4)) + Math.abs(c - lum(i - w * 4));
          if (gx + gy > thr) {
            const ink = 0.55;
            data[i] = Math.round(data[i] * (1 - ink) + 22 * ink);
            data[i + 1] = Math.round(data[i + 1] * (1 - ink) + 18 * ink);
            data[i + 2] = Math.round(data[i + 2] * (1 - ink) + 28 * ink);
          }
        }
      }
      ctx.putImageData(imageData, 0, 0);
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = 'rgba(255, 228, 170, 0.14)';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = Math.max(2, Math.round(Math.min(w, h) * 0.012));
      ctx.strokeRect(1, 1, w - 2, h - 2);
      return canvas;
    };
    let big = null, png512 = '';
    for (const levels of [8, 6, 4, 3]) {
      big = draw(levels);
      png512 = big.toDataURL('image/png');
      if (dataUrlBytes(png512) <= MAX) break;
    }
    if (dataUrlBytes(png512) > MAX) png512 = big.toDataURL('image/jpeg', 0.82);
    const sm = document.createElement('canvas');
    sm.width = 128;
    sm.height = 128;
    const sctx = sm.getContext('2d');
    sctx.imageSmoothingQuality = 'high';
    sctx.drawImage(big, 0, 0, 128, 128);
    return { png512, png128: sm.toDataURL('image/png'), mode: 'filter' };
  }

  /** The one avatar builder: W1b comic when the vendored model runs, else the canvas filter. Render errors
   *  (e.g. no person in the photo) are thrown so the caller keeps the letter avatar. */
  async function renderExplorerAvatar(src, crop, avatarColor) {
    let modelOk = typeof Comicify !== 'undefined';
    if (modelOk) {
      try { await Comicify.loadSegmenter(MODEL_BASE); } catch (_) { modelOk = false; }
    }
    if (!modelOk) return filterAvatar(src, crop);
    const r = await Comicify.render(src, crop, { avatarColor, modelBase: MODEL_BASE });
    return { png128: r.png128, png512: r.png512, mode: 'comic' };
  }

  function saveExplorerAvatar(userId, result) {
    Storage.setComicAvatar(store, userId, result.png128, result.png512);
    store = Storage.loadStore();
    syncProgressFromStore();
  }

  /** Read a picked photo (canvas only; works without the model). */
  async function loadExplorerPhoto(file) {
    if (typeof Comicify === 'undefined') throw new Error('Photo tools did not load.');
    return Comicify.load(file);
  }

  function refreshAfterProfileChange() {
    updateHeaderUser();
    refreshStudentCast();
    const onLanding = $('#screen-landing')?.classList.contains('active');
    const onProgress = $('#screen-progress')?.classList.contains('active');
    if (onLanding) renderLanding();
    else if (onProgress) renderProgress();
  }

  /** Home card + create form: auto face crop, no crop step, no blocking alert. */
  async function applyExplorerPhoto(file, userId) {
    const id = userId || activeUser()?.id;
    if (!id || !file || !store.users[id]) return false;
    let src = null;
    try {
      const loaded = await loadExplorerPhoto(file);
      src = loaded.src;
      const res = await renderExplorerAvatar(src, loaded.box, store.users[id].avatarColor);
      saveExplorerAvatar(id, res);
      if (res.mode === 'filter') notice('Comic style isn\'t available on this device, so we used a simple photo filter.');
      return true;
    } catch (err) {
      notice(((err && err.message) || 'That photo did not work.') + ' Keeping the letter avatar.');
      return false;
    } finally {
      if (src && src.close) src.close();
      refreshAfterProfileChange();
    }
  }

  function clearExplorerPhoto(userId) {
    const id = userId || activeUser()?.id;
    if (!id) return;
    const u = store.users[id];
    if (!u || !Storage.avatarSrc(u)) return;
    if (!confirm('Clear comic photo avatar for ' + u.displayName + '?')) return;
    Storage.clearComicAvatar(store, id);
    store = Storage.loadStore();
    syncProgressFromStore();
    refreshAfterProfileChange();
  }

  function renameActiveExplorer() {
    const u = activeUser();
    if (!u) return;
    const next = prompt('Explorer name:', u.displayName);
    if (next == null) return;
    Storage.renameUser(store, u.id, next);
    store = Storage.loadStore();
    syncProgressFromStore();
    updateHeaderUser();
    refreshStudentCast();
    const onProgress = $('#screen-progress')?.classList.contains('active');
    if (onProgress) renderProgress();
    else renderLanding();
  }

  function renameExplorerById(userId) {
    const u = store.users[userId];
    if (!u) return;
    const next = prompt('Explorer name:', u.displayName);
    if (next == null) return;
    Storage.renameUser(store, userId, next);
    store = Storage.loadStore();
    syncProgressFromStore();
    updateHeaderUser();
    refreshStudentCast();
    renderLanding();
  }

  function deleteExplorerById(userId) {
    const u = store.users[userId];
    if (!u) return;
    if (!confirm(`Delete explorer "${u.displayName}" and all their progress on this device?`)) return;
    Storage.deleteUser(store, userId);
    store = Storage.loadStore();
    syncProgressFromStore();
    updateHeaderUser();
    showScreen('screen-landing');
    renderLanding();
  }

  function resetAllExplorers() {
    const n = Object.keys(store.users || {}).length;
    if (!n) {
      alert('No explorers to remove.');
      return;
    }
    if (!confirm(
      `Remove ALL ${n} explorer(s) on this device?\n\n` +
      'This clears every profile and progress under Einstein Math on this browser. Prefs (like read-aloud) stay.\n\n' +
      'This is NOT an import replace — it just wipes local explorers.\n\nOK to continue…'
    )) return;
    if (!confirm('Final confirm: permanently delete all explorers on this device?')) return;
    Storage.resetAllUsers(store);
    store = Storage.loadStore();
    syncProgressFromStore();
    updateHeaderUser();
    showScreen('screen-landing');
    renderLanding();
  }

  function trackButtonsHtml(selectedId, namePrefix) {
    const tracks = ageTracks();
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
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">V = l × w × h<br>2×3×4 = 24</div>`,
      '3d-real': `
        <div class="viz-box">
          <div style="font-size:2rem;line-height:1.4;">⚽ sphere &nbsp; 🎲 cube &nbsp; 🍦 cone</div>
          <div style="font-family:Comic Neue,cursive;font-size:0.95rem;">Ball · Die · Ice cream scoop!</div>
        </div>`,
      '3d-shapes': `
        <div class="viz-box">
          <svg viewBox="0 0 220 90" width="220" height="90" aria-hidden="true">
            <rect x="10" y="30" width="40" height="40" fill="#FF6B35" stroke="#1a1a1a" stroke-width="3"/>
            <text x="30" y="85" text-anchor="middle" font-size="10" font-family="Comic Neue,cursive">2D</text>
            <path d="M80 55 L100 35 L140 35 L120 55 Z" fill="#4ECDC4" stroke="#1a1a1a" stroke-width="3"/>
            <path d="M80 55 L120 55 L120 75 L80 75 Z" fill="#45B7AA" stroke="#1a1a1a" stroke-width="3"/>
            <path d="M120 55 L140 35 L140 55 L120 75 Z" fill="#3AA89C" stroke="#1a1a1a" stroke-width="3"/>
            <text x="110" y="85" text-anchor="middle" font-size="10" font-family="Comic Neue,cursive">3D cube</text>
            <circle cx="180" cy="50" r="22" fill="#FFE66D" stroke="#1a1a1a" stroke-width="3"/>
            <ellipse cx="180" cy="50" rx="22" ry="8" fill="none" stroke="#1a1a1a" stroke-width="2"/>
            <text x="180" y="85" text-anchor="middle" font-size="10" font-family="Comic Neue,cursive">sphere</text>
          </svg>
          <div style="font-family:Comic Neue,cursive;font-size:0.95rem;">Flat = 2D · Solid = 3D (takes up space!)</div>
        </div>`,
      'ab-pattern': `
        <div class="viz-box">
          <div style="font-size:1.6rem;">🔴 🟦 🔴 🟦 🔴 🟦 <span style="color:#FF6B35;">?</span></div>
          <div style="font-family:Comic Neue,cursive;margin-top:0.35rem;">Core: AB · next = 🔴</div>
        </div>`,
      'about-how-many': `
        <div class="viz-box">
          <div style="font-family:Bangers,Impact,sans-serif;font-size:1.4rem;">About how many?</div>
          <div style="font-family:Comic Neue,cursive;">≈ 50 &nbsp;not&nbsp; 47</div>
        </div>`,
      'annex-zero': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.4rem;">
          0.5 = 0.50
          <div style="font-family:Comic Neue,cursive;font-size:1rem;margin-top:0.3rem;">Annex zeros to align places!</div>
        </div>`,
      'area-vs-perim': `
        <div class="viz-box">
          <svg viewBox="0 0 200 100" width="200" height="100" aria-hidden="true">
            <rect x="20" y="20" width="70" height="50" fill="#FFE66D" stroke="#1a1a1a" stroke-width="3"/>
            <text x="55" y="50" text-anchor="middle" font-size="12" font-family="Bangers,Impact,sans-serif">AREA</text>
            <rect x="110" y="20" width="70" height="50" fill="none" stroke="#FF6B35" stroke-width="4" stroke-dasharray="6 3"/>
            <text x="145" y="50" text-anchor="middle" font-size="11" font-family="Bangers,Impact,sans-serif" fill="#FF6B35">PERIM</text>
          </svg>
          <div style="font-family:Comic Neue,cursive;">Inside vs around!</div>
        </div>`,
      'bakery': `
        <div class="viz-box">
          <div style="font-size:1.4rem;">🧁🧁🧁🧁 &nbsp;×&nbsp; 6 &nbsp;+&nbsp; 🧁×5</div>
          <div style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;margin-top:0.35rem;">4×6+5 = 29</div>
        </div>`,
      'balance-scale': `
        <div class="viz-box">
          <svg viewBox="0 0 200 90" width="200" height="90" aria-hidden="true">
            <line x1="100" y1="15" x2="100" y2="45" stroke="#1a1a1a" stroke-width="3"/>
            <line x1="40" y1="50" x2="160" y2="35" stroke="#1a1a1a" stroke-width="3"/>
            <rect x="25" y="50" width="40" height="20" rx="3" fill="#FF6B35" stroke="#1a1a1a" stroke-width="2"/>
            <rect x="145" y="28" width="40" height="14" rx="3" fill="#FFE66D" stroke="#1a1a1a" stroke-width="2"/>
            <text x="45" y="85" text-anchor="middle" font-size="10" font-family="Comic Neue,cursive">heavy ↓</text>
            <text x="165" y="85" text-anchor="middle" font-size="10" font-family="Comic Neue,cursive">light ↑</text>
          </svg>
        </div>`,
      'bar-graph': `
        <div class="viz-box">
          <svg viewBox="0 0 180 100" width="180" height="100" aria-hidden="true">
            <line x1="30" y1="10" x2="30" y2="85" stroke="#1a1a1a" stroke-width="2"/>
            <line x1="30" y1="85" x2="170" y2="85" stroke="#1a1a1a" stroke-width="2"/>
            <rect x="45" y="45" width="25" height="40" fill="#FF6B35" stroke="#1a1a1a" stroke-width="2"/>
            <rect x="85" y="25" width="25" height="60" fill="#4ECDC4" stroke="#1a1a1a" stroke-width="2"/>
            <rect x="125" y="55" width="25" height="30" fill="#FFE66D" stroke="#1a1a1a" stroke-width="2"/>
            <text x="57" y="98" text-anchor="middle" font-size="10">A</text>
            <text x="97" y="98" text-anchor="middle" font-size="10">B</text>
            <text x="137" y="98" text-anchor="middle" font-size="10">C</text>
          </svg>
          <div style="font-family:Comic Neue,cursive;">Taller bar = more!</div>
        </div>`,
      'bar-read': `
        <div class="viz-box">
          <svg viewBox="0 0 160 90" width="160" height="90" aria-hidden="true">
            <line x1="25" y1="5" x2="25" y2="75" stroke="#1a1a1a" stroke-width="2"/>
            <line x1="25" y1="75" x2="150" y2="75" stroke="#1a1a1a" stroke-width="2"/>
            <text x="8" y="20" font-size="9">8</text>
            <text x="8" y="45" font-size="9">4</text>
            <text x="8" y="75" font-size="9">0</text>
            <rect x="50" y="35" width="30" height="40" fill="#FF6B35" stroke="#1a1a1a" stroke-width="2"/>
            <rect x="100" y="15" width="30" height="60" fill="#4ECDC4" stroke="#1a1a1a" stroke-width="2"/>
          </svg>
          <div style="font-family:Comic Neue,cursive;">Check the axis numbers!</div>
        </div>`,
      'borrow': `
        <div class="viz-box" style="font-family:monospace;font-size:1.3rem;">
          Borrow: 1 ten → 10 ones
          <div style="font-family:Comic Neue,cursive;font-size:1rem;margin-top:0.3rem;">Regrouping, not stealing!</div>
        </div>`,
      'carry': `
        <div class="viz-box" style="font-family:monospace;font-size:1.3rem;">
          <span style="color:#FF6B35;">¹</span><br>
          &nbsp;&nbsp;27<br>+ 18<br>────
          <div style="font-family:Comic Neue,cursive;font-size:1rem;">Carry keeps place value honest!</div>
        </div>`,
      'clock-230': `
        <div class="viz-box">
          <svg viewBox="0 0 120 120" width="110" height="110" aria-hidden="true">
            <circle cx="60" cy="60" r="50" fill="#fff" stroke="#1a1a1a" stroke-width="3"/>
            <text x="60" y="22" text-anchor="middle" font-size="11" font-family="Bangers,Impact,sans-serif">12</text>
            <text x="98" y="64" text-anchor="middle" font-size="11" font-family="Bangers,Impact,sans-serif">3</text>
            <text x="60" y="105" text-anchor="middle" font-size="11" font-family="Bangers,Impact,sans-serif">6</text>
            <text x="22" y="64" text-anchor="middle" font-size="11" font-family="Bangers,Impact,sans-serif">9</text>
            <line x1="60" y1="60" x2="81.3" y2="54.3" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
            <line x1="60" y1="60" x2="60.0" y2="94.0" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>
            <circle cx="60" cy="60" r="4" fill="#FF6B35"/>
          </svg>
          <div style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">2:30 — half past 2</div>
        </div>`,
      'clock-count': `
        <div class="viz-box">
          <div style="font-family:Bangers,Impact,sans-serif;font-size:1.2rem;">2:00 → 2:05 → 2:10 → … → 2:30</div>
          <div style="font-family:Comic Neue,cursive;">Count forward until the end!</div>
        </div>`,
      'clock-half': `
        <div class="viz-box">
          <svg viewBox="0 0 120 120" width="110" height="110" aria-hidden="true">
            <circle cx="60" cy="60" r="50" fill="#fff" stroke="#1a1a1a" stroke-width="3"/>
            <text x="60" y="22" text-anchor="middle" font-size="11" font-family="Bangers,Impact,sans-serif">12</text>
            <text x="98" y="64" text-anchor="middle" font-size="11" font-family="Bangers,Impact,sans-serif">3</text>
            <text x="60" y="105" text-anchor="middle" font-size="11" font-family="Bangers,Impact,sans-serif">6</text>
            <text x="22" y="64" text-anchor="middle" font-size="11" font-family="Bangers,Impact,sans-serif">9</text>
            <line x1="60" y1="60" x2="65.7" y2="38.7" stroke="#1a1a1a" stroke-width="4" stroke-linecap="round"/>
            <line x1="60" y1="60" x2="60.0" y2="94.0" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/>
            <circle cx="60" cy="60" r="4" fill="#FF6B35"/>
          </svg>
          <div style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">Long hand on 6 = :30</div>
        </div>`,
      'coin-combo': `
        <div class="viz-box">
          <div>10¢+5¢ &nbsp;=&nbsp; 5¢+5¢+5¢ &nbsp;=&nbsp; 15×1¢</div>
          <div style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;margin-top:0.3rem;">All make 15¢ ★</div>
        </div>`,
      'coins': `
        <div class="viz-box">
          <div style="display:flex;gap:0.6rem;justify-content:center;flex-wrap:wrap;font-family:Bangers,Impact,sans-serif;">
            <span style="border:3px solid #1a1a1a;border-radius:50%;width:42px;height:42px;display:inline-flex;align-items:center;justify-content:center;background:#CD7F32;">1¢</span>
            <span style="border:3px solid #1a1a1a;border-radius:50%;width:48px;height:48px;display:inline-flex;align-items:center;justify-content:center;background:#C0C0C0;">5¢</span>
            <span style="border:3px solid #1a1a1a;border-radius:50%;width:42px;height:42px;display:inline-flex;align-items:center;justify-content:center;background:#FFD700;">10¢</span>
          </div>
          <div style="font-family:Comic Neue,cursive;margin-top:0.4rem;">Nickel=5 · Dime=10</div>
        </div>`,
      'compare-kids': `
        <div class="viz-box">
          <div>Mia ⭐⭐⭐⭐⭐⭐⭐⭐ &nbsp; Leo ⭐⭐⭐⭐⭐</div>
          <div style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;margin-top:0.3rem;">8 − 5 = 3 more</div>
        </div>`,
      'compare-teens': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.4rem;">
          14 vs 17
          <div style="font-family:Comic Neue,cursive;font-size:1rem;">Same tens? 7 ones &gt; 2 ones!</div>
        </div>`,
      'compare-wp': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">
          How many more? → subtract the gap!
        </div>`,
      'coord': `
        <div class="viz-box">
          <svg viewBox="0 0 140 140" width="130" height="130" aria-hidden="true">
            <line x1="20" y1="120" x2="120" y2="120" stroke="#1a1a1a" stroke-width="2"/>
            <line x1="20" y1="120" x2="20" y2="20" stroke="#1a1a1a" stroke-width="2"/>
            <text x="125" y="124" font-size="12" font-family="Bangers,Impact,sans-serif">x</text>
            <text x="12" y="18" font-size="12" font-family="Bangers,Impact,sans-serif">y</text>
            <circle cx="20" cy="120" r="4" fill="#FF6B35"/>
            <text x="28" y="135" font-size="10">(0,0)</text>
          </svg>
          <div style="font-family:Comic Neue,cursive;">First = x (right), second = y (up)</div>
        </div>`,
      'decimal-add': `
        <div class="viz-box" style="font-family:monospace;font-size:1.3rem;">
          &nbsp;0.40<br>+ 0.35<br>─────<br>&nbsp;0.75
        </div>`,
      'decimal-align': `
        <div class="viz-box" style="font-family:monospace;font-size:1.3rem;">
          &nbsp;1.25<br>+ 0.40<br>─────
          <div style="font-family:Comic Neue,cursive;font-size:1rem;">Line up the dots!</div>
        </div>`,
      'decimal-sub': `
        <div class="viz-box" style="font-family:monospace;font-size:1.3rem;">
          &nbsp;0.90<br>− 0.35<br>─────<br>&nbsp;0.55
        </div>`,
      'div-check': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">
          24 ÷ 6 = 4<br>
          <span style="font-family:Comic Neue,cursive;font-size:1rem;">Check: 4 × 6 = 24 ★</span>
        </div>`,
      'div-types': `
        <div class="viz-box">
          <div><strong>Sharing:</strong> 12 ÷ 3 → 4 each</div>
          <div><strong>Grouping:</strong> how many 3s in 12? → 4</div>
        </div>`,
      'divisibility': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">
          15 ÷ 5 = 3 R0 → divisible!
          <div style="font-family:Comic Neue,cursive;font-size:1rem;">No remainder = divides evenly</div>
        </div>`,
      'doubles': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.5rem;">
          6 + 6 = 12
          <div style="font-family:Comic Neue,cursive;font-size:1rem;">Same + same = double!</div>
        </div>`,
      'doubles-chart': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.2rem;">
          5+5=10 · 7+7=14 · 8+8=16
        </div>`,
      'elapsed': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">
          2:00 → 2:30 = 30 min
          <div style="font-family:Comic Neue,cursive;font-size:1rem;">Elapsed time!</div>
        </div>`,
      'eq-groups-wp': `
        <div class="viz-box">
          <div style="display:flex;gap:0.5rem;justify-content:center;flex-wrap:wrap;">
            ${[1,2,3,4].map(() => `<div class="dot-grid" style="grid-template-columns:repeat(3,1fr);border:2px dashed #1a1a1a;padding:4px;">${'<div class="dot"></div>'.repeat(6)}</div>`).join('')}
          </div>
          <div style="font-family:Bangers,Impact,sans-serif;font-size:1.2rem;margin-top:0.35rem;">4 × 6 = 24</div>
        </div>`,
      'estimate': `
        <div class="viz-box">
          <div style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">48 + 31 ≈ 50 + 30 = 80</div>
          <div style="font-family:Comic Neue,cursive;font-size:0.95rem;">Round → add → quick check!</div>
        </div>`,
      'fact-family': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.2rem;">
          2+6=8 · 6+2=8<br>8−6=2 · 8−2=6
        </div>`,
      'factor-pairs': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.15rem;">
          24: 1×24 · 2×12 · 3×8 · 4×6
        </div>`,
      'fluency-add': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.2rem;">
          20+30 → easy!<br>27+18 → regroup!
        </div>`,
      'fluency-check': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">
          47+36 ≈ 50+40 = 90
          <div style="font-family:Comic Neue,cursive;font-size:1rem;">Estimate to check!</div>
        </div>`,
      'frac-set-ex': `
        <div class="viz-box">
          <div class="dot-grid" style="grid-template-columns:repeat(4,1fr);">${'<div class="dot"></div>'.repeat(12)}</div>
          <div style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">1/4 of 12 = 3</div>
        </div>`,
      'frac-size': `
        <div class="viz-box">
          <div style="display:flex;gap:1rem;justify-content:center;align-items:center;flex-wrap:wrap;">
            <div>
              <div style="border:3px solid #1a1a1a;width:90px;height:28px;background:linear-gradient(90deg,#FF6B35 50%,#fff 50%);margin:0 auto;"></div>
              <div style="font-family:Bangers,Impact,sans-serif;">1/2</div>
            </div>
            <div style="font-family:Bangers,Impact,sans-serif;font-size:1.4rem;">&gt;</div>
            <div>
              <div style="border:3px solid #1a1a1a;width:90px;height:28px;background:linear-gradient(90deg,#4ECDC4 25%,#fff 25%);margin:0 auto;"></div>
              <div style="font-family:Bangers,Impact,sans-serif;">1/4</div>
            </div>
          </div>
          <div style="font-family:Comic Neue,cursive;margin-top:0.3rem;">More splits = tinier pieces!</div>
        </div>`,
      'frac-sub-simp': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">
          4/6 − 1/6 = 3/6 = 1/2
        </div>`,
      'frac-times': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">
          a/b × n = (a×n)/b
        </div>`,
      'frac-times-ex': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">
          2/5 × 10 = 20/5 = 4 ★
        </div>`,
      'g4-wp': `
        <div class="viz-box">
          <div style="font-family:Comic Neue,cursive;">Hidden steps?</div>
          <div style="font-family:Bangers,Impact,sans-serif;font-size:1.2rem;">Multiply → then subtract leftovers</div>
        </div>`,
      'long-div': `
        <div class="viz-box" style="font-family:monospace;font-size:1.25rem;line-height:1.4;">
          &nbsp;&nbsp;&nbsp;28<br>3 ) 84<br>
          <div style="font-family:Comic Neue,cursive;font-size:0.95rem;">3s in 8? 2… bring down 4…</div>
        </div>`,
      'long-mult': `
        <div class="viz-box" style="font-family:monospace;font-size:1.25rem;">
          &nbsp;&nbsp;23<br>×&nbsp;&nbsp;4<br>────<br>&nbsp;&nbsp;92
          <div style="font-family:Comic Neue,cursive;font-size:0.95rem;">Ones, then tens — add partials!</div>
        </div>`,
      'ltr': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">
          12÷3×2 = 4×2 = 8
          <div style="font-family:Comic Neue,cursive;font-size:1rem;">Same level → left to right</div>
        </div>`,
      'make-10': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">
          8+5 → (8+2)+3 = 10+3 = 13
        </div>`,
      'mixed-add': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">
          1 2/5 + 2 1/5 = 3 3/5
        </div>`,
      'mixed-regroup': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">
          3 5/4 → 4 1/4
          <div style="font-family:Comic Neue,cursive;font-size:1rem;">Fraction ≥1? Regroup!</div>
        </div>`,
      'mixed-sub': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.15rem;">
          3 1/4 − 1 2/4 → borrow → 1 3/4
        </div>`,
      'mixed-sub-ex': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">
          Same denominators → smooth gears!
        </div>`,
      'money-ex': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.2rem;">
          40¢ + 25¢ = 65¢<br>100¢ − 65¢ = 35¢ change
        </div>`,
      'money-wp': `
        <div class="viz-box">
          <div style="font-family:Comic Neue,cursive;">Cost + cost → pay → change</div>
          <div style="font-family:Bangers,Impact,sans-serif;font-size:1.2rem;margin-top:0.3rem;">Add costs · Subtract to get change</div>
        </div>`,
      'mult-clues': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.2rem;">
          each · every · groups of → ×
        </div>`,
      'multi-step': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.2rem;">
          ① Underline question<br>② Step 1 · Step 2<br>③ Check!
        </div>`,
      'neither': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.5rem;">
          1 is NEITHER
          <div style="font-family:Comic Neue,cursive;font-size:1rem;">Not prime, not composite!</div>
        </div>`,
      'number-line-teens': `
        <div class="viz-box">
          <svg viewBox="0 0 280 50" width="280" height="50" aria-hidden="true">
            <line x1="10" y1="25" x2="270" y2="25" stroke="#1a1a1a" stroke-width="3"/>
            <line x1="20" y1="18" x2="20" y2="32" stroke="#1a1a1a" stroke-width="2"/><text x="20" y="46" text-anchor="middle" font-size="9" font-family="Comic Neue,cursive">10</text><line x1="46" y1="18" x2="46" y2="32" stroke="#1a1a1a" stroke-width="2"/><text x="46" y="46" text-anchor="middle" font-size="9" font-family="Comic Neue,cursive">11</text><line x1="72" y1="18" x2="72" y2="32" stroke="#1a1a1a" stroke-width="2"/><circle cx="72" cy="25" r="5" fill="#4ECDC4" stroke="#1a1a1a" stroke-width="2"/><text x="72" y="46" text-anchor="middle" font-size="9" font-family="Comic Neue,cursive">12</text><line x1="98" y1="18" x2="98" y2="32" stroke="#1a1a1a" stroke-width="2"/><text x="98" y="46" text-anchor="middle" font-size="9" font-family="Comic Neue,cursive">13</text><line x1="124" y1="18" x2="124" y2="32" stroke="#1a1a1a" stroke-width="2"/><text x="124" y="46" text-anchor="middle" font-size="9" font-family="Comic Neue,cursive">14</text><line x1="150" y1="18" x2="150" y2="32" stroke="#1a1a1a" stroke-width="2"/><text x="150" y="46" text-anchor="middle" font-size="9" font-family="Comic Neue,cursive">15</text><line x1="176" y1="18" x2="176" y2="32" stroke="#1a1a1a" stroke-width="2"/><text x="176" y="46" text-anchor="middle" font-size="9" font-family="Comic Neue,cursive">16</text><line x1="202" y1="18" x2="202" y2="32" stroke="#1a1a1a" stroke-width="2"/><text x="202" y="46" text-anchor="middle" font-size="9" font-family="Comic Neue,cursive">17</text><line x1="228" y1="18" x2="228" y2="32" stroke="#1a1a1a" stroke-width="2"/><text x="228" y="46" text-anchor="middle" font-size="9" font-family="Comic Neue,cursive">18</text><line x1="254" y1="18" x2="254" y2="32" stroke="#1a1a1a" stroke-width="2"/><circle cx="254" cy="25" r="5" fill="#FF6B35" stroke="#1a1a1a" stroke-width="2"/><text x="254" y="46" text-anchor="middle" font-size="9" font-family="Comic Neue,cursive">19</text>
          </svg>
          <div style="font-family:Comic Neue,cursive;">12 &lt; 19 — more ones wins!</div>
        </div>`,
      'partial-products': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.25rem;">
          3×4=12 · 20×4=80<br>12+80=92
        </div>`,
      'pemdas': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">
          3+(2×4) = 3+8 = 11
          <div style="font-family:Comic Neue,cursive;font-size:1rem;">() first — not 20!</div>
        </div>`,
      'perimeter': `
        <div class="viz-box">
          <svg viewBox="0 0 140 90" width="140" height="90" aria-hidden="true">
            <rect x="20" y="15" width="100" height="55" fill="#4ECDC4" stroke="#1a1a1a" stroke-width="3"/>
            <text x="70" y="10" text-anchor="middle" font-size="11" font-family="Comic Neue,cursive">5</text>
            <text x="8" y="48" font-size="11" font-family="Comic Neue,cursive">3</text>
          </svg>
          <div style="font-family:Bangers,Impact,sans-serif;font-size:1.2rem;">Walk the outline!</div>
        </div>`,
      'pictograph': `
        <div class="viz-box" style="text-align:left;display:inline-block;">
          <div>Dogs: 🐶🐶🐶 = 3</div>
          <div>Cats: 🐱🐱 = 2</div>
          <div style="font-family:Comic Neue,cursive;margin-top:0.3rem;text-align:center;">Each picture = 1</div>
        </div>`,
      'plot-point': `
        <div class="viz-box">
          <svg viewBox="0 0 140 140" width="130" height="130" aria-hidden="true">
            <line x1="20" y1="120" x2="120" y2="120" stroke="#1a1a1a" stroke-width="2"/>
            <line x1="20" y1="120" x2="20" y2="20" stroke="#1a1a1a" stroke-width="2"/>
            <line x1="20" y1="120" x2="80" y2="120" stroke="#4ECDC4" stroke-width="2" stroke-dasharray="4"/>
            <line x1="80" y1="120" x2="80" y2="80" stroke="#4ECDC4" stroke-width="2" stroke-dasharray="4"/>
            <circle cx="80" cy="80" r="6" fill="#FF6B35" stroke="#1a1a1a" stroke-width="2"/>
            <text x="88" y="76" font-size="12" font-family="Bangers,Impact,sans-serif">(3,2)</text>
          </svg>
          <div style="font-family:Comic Neue,cursive;">Right 3, up 2!</div>
        </div>`,
      'primes': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.2rem;">
          <span style="color:#FF6B35;">Prime:</span> 2,3,5,7,11<br>
          <span style="color:#4ECDC4;">Composite:</span> 4,6,8,9
        </div>`,
      'put-together': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.2rem;">
          in all · altogether · total → ADD
        </div>`,
      'quotative': `
        <div class="viz-box">
          <div class="dot-grid" style="grid-template-columns:repeat(3,1fr);">${'<div class="dot"></div>'.repeat(12)}</div>
          <div style="font-family:Bangers,Impact,sans-serif;font-size:1.2rem;">12 ÷ 3 = 4 groups</div>
        </div>`,
      'rect-perim': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">
          3+5+3+5 = 16
          <div style="font-family:Comic Neue,cursive;font-size:1rem;">Rectangle 3×5 around</div>
        </div>`,
      'regroup-add': `
        <div class="viz-box" style="font-family:monospace;font-size:1.25rem;">
          <span style="color:#FF6B35;">¹</span><br>&nbsp;&nbsp;27<br>+ 18<br>────<br>&nbsp;&nbsp;45
          <div style="font-family:Comic Neue,cursive;font-size:0.95rem;">7+8=15 → write 5, carry 1</div>
        </div>`,
      'regroup-sub': `
        <div class="viz-box" style="font-family:monospace;font-size:1.25rem;">
          5² − 18 → 12−8=4, 4−1=3
          <div style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;margin-top:0.3rem;">52 − 18 = 34 ★</div>
        </div>`,
      'rockets-sum': `
        <div class="viz-box" style="font-size:1.4rem;">
          🚀🚀🚀 + 🚀🚀🚀🚀 = <strong>7</strong>
          <div style="font-family:Bangers,Impact,sans-serif;font-size:1.2rem;">3 + 4 = 7</div>
        </div>`,
      'round-100': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">
          Peek at tens digit<br>0–4 down · 5–9 up
        </div>`,
      'round-examples': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">
          350 → 400 &nbsp;·&nbsp; 340 → 300
        </div>`,
      'shape-ab': `
        <div class="viz-box">
          <div style="font-size:1.8rem;">⚪ ⬛ ⚪ ⬛ ⚪ <span style="color:#FF6B35;">?</span></div>
          <div style="font-family:Comic Neue,cursive;">Circle, square… next is circle!</div>
        </div>`,
      // X20 — ages 7–8 facts, missing factor, properties
      'facts-3s': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">
          3, 6, 9, 12, 15, 18 → 3×6=18
          <div style="font-family:Comic Neue,cursive;font-size:1rem;">6 jumps of 3!</div>
        </div>`,
      'double-double': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">
          4×7: 7 → 14 → 28
          <div style="font-family:Comic Neue,cursive;font-size:1rem;">Double, then double again!</div>
        </div>`,
      'five-plus-one': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">
          6×7 = 5×7 + 7 = 35 + 7 = 42
          <div style="font-family:Comic Neue,cursive;font-size:1rem;">Know 5s? Add one more group!</div>
        </div>`,
      'nines-trick': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">
          9×6 = 10×6 − 6 = 54
          <div style="font-family:Comic Neue,cursive;font-size:1rem;">Ten groups, take one away. 5+4 = 9!</div>
        </div>`,
      'missing-factor': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.4rem;">
          24 ÷ 6 = ? &nbsp;⟷&nbsp; 6 × <span style="color:#FF6B35;">?</span> = 24
          <div style="font-family:Comic Neue,cursive;font-size:1rem;">Division hides a missing factor!</div>
        </div>`,
      'fact-family-24': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.15rem;line-height:1.5;">
          6×4=24 · 4×6=24<br>24÷6=4 · 24÷4=6
          <div style="font-family:Comic Neue,cursive;font-size:1rem;">One fact family, four facts!</div>
        </div>`,
      'turn-around': `
        <div class="viz-box" style="font-size:0.8rem;">
          <div style="display:inline-grid;grid-template-columns:repeat(4,1.1em);gap:2px;margin:0 0.6rem;vertical-align:middle;"><span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span></div><span style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">=</span><div style="display:inline-grid;grid-template-columns:repeat(2,1.1em);gap:2px;margin:0 0.6rem;vertical-align:middle;"><span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span></div>
          <div style="font-family:Comic Neue,cursive;font-size:1rem;">2×4 = 4×2 = 8. Turn it — same stars!</div>
        </div>`,
      'break-apart': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.25rem;">
          7×6 = <span style="color:#4ECDC4;">5×6</span> + <span style="color:#FF6B35;">2×6</span> = 30 + 12 = 42
          <div style="font-family:Comic Neue,cursive;font-size:1rem;">Break a big fact into easy pieces!</div>
        </div>`,
      // X23 — ages 5–6 tens & ones (1.NBT)
      'tens-ones-34': `
        <div class="viz-box">
          <div class="place-blocks"><div class="place-block tens" style="min-width:1.6rem;">10</div><div class="place-block tens" style="min-width:1.6rem;">10</div><div class="place-block tens" style="min-width:1.6rem;">10</div><div class="place-block ones">● ● ● ●</div></div>
          <div style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">3 tens + 4 ones = 34</div>
        </div>`,
      'compare-alligator': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.5rem;">
          52 <span style="color:#2ecc71;">&gt;</span> 25 &nbsp;·&nbsp; 25 <span style="color:#2ecc71;">&lt;</span> 52 &nbsp;·&nbsp; 40 = 40
          <div style="font-family:Comic Neue,cursive;font-size:1rem;">🐊 The mouth opens to the bigger number. Tens first, then ones!</div>
        </div>`,
      'ten-more-34': `
        <div class="viz-box">
          <div class="place-blocks"><div class="place-block tens" style="min-width:1.6rem;">10</div><div class="place-block tens" style="min-width:1.6rem;">10</div><div class="place-block tens" style="min-width:1.6rem;">10</div><div class="place-block ones">● ● ● ●</div></div>
          <div style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">34 + one ten → <span style="color:#FF6B35;">4</span>4</div>
          <div style="font-family:Comic Neue,cursive;font-size:1rem;">10 more: tens go up, ones stay!</div>
        </div>`,
      'ten-less-34': `
        <div class="viz-box">
          <div class="place-blocks"><div class="place-block tens" style="min-width:1.6rem;">10</div><div class="place-block tens" style="min-width:1.6rem;">10</div><div class="place-block ones">● ● ● ●</div></div>
          <div style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">34 − one ten → <span style="color:#FF6B35;">2</span>4</div>
          <div style="font-family:Comic Neue,cursive;font-size:1rem;">10 less: tens go down, ones stay!</div>
        </div>`,
      'add-ones-23-4': `
        <div class="viz-box">
          <div class="place-blocks"><div class="place-block tens" style="min-width:1.6rem;">10</div><div class="place-block tens" style="min-width:1.6rem;">10</div><div class="place-block ones">● ● ● ● ● ● ●</div></div>
          <div style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">23 + 4: 3 + 4 = 7 ones → 27</div>
        </div>`,
      'make-new-ten': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">
          28 + 5 = 28 + <span style="color:#4ECDC4;">2</span> + <span style="color:#FF6B35;">3</span> = 30 + 3 = 33
          <div style="font-family:Comic Neue,cursive;font-size:1rem;">10 ones make a NEW ten!</div>
        </div>`,
      'skip-mult': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">
          5, 10, 15, 20 → 5×4=20
        </div>`,
      'tally': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.6rem;">
          |||| <span style="text-decoration:line-through;color:#FF6B35;">/</span> &nbsp;= 5
          <div style="font-family:Comic Neue,cursive;font-size:1rem;">Four sticks + diagonal = bundle of 5!</div>
        </div>`,
      'teen-16': `
        <div class="viz-box">
          <div class="place-blocks">
            <div class="place-block tens">1 ten<br>= 10</div>
            <div class="place-block ones">6 ones<br>= 6</div>
          </div>
          <div style="font-family:Bangers,Impact,sans-serif;font-size:1.4rem;">16 = 10 + 6</div>
        </div>`,
      'teen-add': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.25rem;">
          14+3 = 10+(4+3) = 17
        </div>`,
      'teen-blocks': `
        <div class="viz-box">
          <div class="place-blocks">
            <div class="place-block tens">10</div>
            <div class="place-block ones">· · ·</div>
          </div>
          <div style="font-family:Comic Neue,cursive;">Teens = ten + extras!</div>
        </div>`,
      'ten-friends': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.2rem;">
          1+9 · 2+8 · 3+7 · 4+6 · 5+5
        </div>`,
      'tens-line': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.15rem;letter-spacing:0.04em;">
          10 20 30 40 50 60 70 80 90 100
        </div>`,
      'tens-rocket': `
        <div class="viz-box" style="font-size:1.3rem;">
          🚀10 🚀20 🚀30 🚀40…
          <div style="font-family:Comic Neue,cursive;">Skip by 10s — fly!</div>
        </div>`,
      'times-10': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.4rem;">
          7 × 10 = 70
          <div style="font-family:Comic Neue,cursive;font-size:1rem;">×10 tacks on a zero!</div>
        </div>`,
      'triangle-facts': `
        <div class="viz-box">
          <svg viewBox="0 0 160 110" width="160" height="110" aria-hidden="true">
            <polygon points="80,15 20,95 140,95" fill="#FFE66D" stroke="#1a1a1a" stroke-width="3"/>
            <text x="80" y="55" text-anchor="middle" font-size="16" font-family="Bangers,Impact,sans-serif">8</text>
            <text x="40" y="90" text-anchor="middle" font-size="14" font-family="Bangers,Impact,sans-serif">2</text>
            <text x="120" y="90" text-anchor="middle" font-size="14" font-family="Bangers,Impact,sans-serif">6</text>
          </svg>
          <div style="font-family:Comic Neue,cursive;">Fact-family triangle!</div>
        </div>`,
      'two-step-ex': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;">
          10+4=14 → 14−3=11 ★
        </div>`,
      'unit-frac': `
        <div class="viz-box">
          <div style="display:flex;gap:4px;justify-content:center;">
            <div style="width:36px;height:36px;background:#FF6B35;border:3px solid #1a1a1a;"></div>
            <div style="width:36px;height:36px;background:#fff;border:3px solid #1a1a1a;"></div>
            <div style="width:36px;height:36px;background:#fff;border:3px solid #1a1a1a;"></div>
            <div style="width:36px;height:36px;background:#fff;border:3px solid #1a1a1a;"></div>
          </div>
          <div style="font-family:Bangers,Impact,sans-serif;font-size:1.3rem;margin-top:0.35rem;">1/4 — one piece of four</div>
        </div>`,
      'volume': `
        <div class="viz-box">
          <svg viewBox="0 0 140 110" width="140" height="110" aria-hidden="true">
            <path d="M40 30 L100 30 L120 50 L120 90 L60 90 L40 70 Z" fill="#4ECDC4" stroke="#1a1a1a" stroke-width="3"/>
            <path d="M40 30 L60 50 L120 50 L100 30 Z" fill="#7EDDD6" stroke="#1a1a1a" stroke-width="2"/>
            <path d="M40 30 L40 70 L60 90 L60 50 Z" fill="#3AA89C" stroke="#1a1a1a" stroke-width="2"/>
          </svg>
          <div style="font-family:Bangers,Impact,sans-serif;font-size:1.25rem;">V = 3×2×4 = 24</div>
        </div>`,
      'volume-layers': `
        <div class="viz-box" style="font-family:Bangers,Impact,sans-serif;font-size:1.2rem;">
          Layer = l×w cubes<br>× height layers = V
        </div>`,
      'weight-compare': `
        <div class="viz-box" style="font-size:1.5rem;">
          🍉 &gt; 🍎
          <div style="font-family:Comic Neue,cursive;font-size:1rem;">Watermelon heavier than apple!</div>
        </div>`,
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
      <p class="field-label" style="margin-top:0.75rem;">Upload comic photo <span class="muted">(optional)</span></p>
      <input type="file" id="input-photo-${mode}" accept="image/*" />
      <p class="muted" style="margin-top:0.35rem;margin-bottom:0;">We comicify it on this device — no cloud upload.</p>
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

    $('#btn-save-profile-' + mode)?.addEventListener('click', async () => {
      const name = ($('#input-name-' + mode)?.value || '').trim();
      if (!name) {
        $('#input-name-' + mode)?.focus();
        return;
      }
      const created = Storage.createUser(store, { displayName: name, trackId: selected });
      store = Storage.loadStore();
      syncProgressFromStore();
      const photoFile = $('#input-photo-' + mode)?.files?.[0];
      if (photoFile && created?.id) await applyExplorerPhoto(photoFile, created.id);
      if (mode === 'new') {
        $('#new-explorer-form')?.classList.add('hidden');
        renderLanding();
      }
      updateHeaderUser();
      refreshStudentCast();
      // New users go to the (math) warm-up diagnostic for their track
      if (!isMathSubject() || !subjectReady()) await switchSubject('math');
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
      const t = ageTracks()[u.trackId];
      const active = u.id === activeId ? ' active' : '';
      const photoId = 'input-photo-card-' + u.id;
      return `<div class="user-card-row${active}" data-user-id="${escapeAttr(u.id)}">
        <button type="button" class="user-card${active}" data-user-id="${escapeAttr(u.id)}">
          ${avatarSpanHtml(u)}
          <span class="user-card-text">
            <strong>${escapeHtml(u.displayName)}</strong>
            <span class="muted">${escapeHtml(t ? t.label : u.trackId)}</span>
          </span>
        </button>
        <div class="user-card-actions">
          <button type="button" class="btn btn-ghost btn-sm btn-rename-card" data-rename-id="${escapeAttr(u.id)}" title="Rename">✎ Rename</button>
          <label class="btn btn-cyan btn-sm btn-photo-card" for="${escapeAttr(photoId)}" data-photo-id="${escapeAttr(u.id)}" title="Upload comic photo">Upload photo</label>
          <input type="file" id="${escapeAttr(photoId)}" class="hidden input-photo-card" accept="image/*" data-photo-user="${escapeAttr(u.id)}" />
          ${Storage.avatarSrc(u) ? `<button type="button" class="btn btn-ghost btn-sm btn-clear-photo-card" data-clear-photo-id="${escapeAttr(u.id)}" title="Clear photo">Clear photo</button>` : ''}
          <button type="button" class="btn btn-ghost btn-sm btn-delete-card" data-delete-id="${escapeAttr(u.id)}" title="Delete">Delete</button>
        </div>
      </div>`;
    }).join('');

    $$('.user-card', list).forEach(btn => {
      btn.addEventListener('click', () => {
        Storage.setActiveUser(store, btn.dataset.userId);
        store = Storage.loadStore();
        syncProgressFromStore();
        renderLanding();
      });
    });
    $$('.btn-rename-card', list).forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        renameExplorerById(btn.dataset.renameId);
      });
    });
    $$('.btn-photo-card', list).forEach(label => {
      label.addEventListener('click', (e) => e.stopPropagation());
    });
    $$('.input-photo-card', list).forEach(input => {
      input.addEventListener('click', (e) => e.stopPropagation());
      input.addEventListener('change', (e) => {
        e.stopPropagation();
        const f = e.target.files && e.target.files[0];
        const uid = e.target.dataset.photoUser;
        if (f && uid) applyExplorerPhoto(f, uid);
        e.target.value = '';
      });
    });
    $$('.btn-clear-photo-card', list).forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearExplorerPhoto(btn.dataset.clearPhotoId);
      });
    });
    $$('.btn-delete-card', list).forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteExplorerById(btn.dataset.deleteId);
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
    if (!subjectReady() || !isMathSubject()) {
      renderHub();
      return;
    }
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
    if (!track) {
      const sub = Subjects.get(activeSubjectId());
      Einstein.mount($('#hub-einstein'), 'think');
      Einstein.speak($('#hub-speech'), `${sub.label} missions are still in my workshop! Switch back to Math any time — your stars are waiting.`);
      const tl = $('#hub-track-label');
      const age = ageTracks()[activeTrackId()];
      if (tl) tl.textContent = `${sub.label} · ${age ? age.label : ''}`;
      renderTodaysPath('hub-todays-path');
      const rh = $('#review-due-panel');
      if (rh) { rh.classList.add('hidden'); rh.innerHTML = ''; }
      const g = $('#unit-grid');
      g.innerHTML = `<div class="unit-card subject-soon-card" style="border-top: 8px solid #A78BFA"><div class="unit-icon">⚛️</div><h3>${escapeHtml(sub.label)} units</h3><p>Coming soon: new experiments for this age group are being built in Einstein's lab.</p></div>`
        + (activeSubjectId() === 'physics' ? spaceUnitCardHtml() : '');
      wireSpaceUnitCard(g);
      return;
    }
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
                const labTag = L.type === 'sim' ? '<span class="sim-tag" title="Interactive lab">🔬 Lab</span>' : '';
                return `<li>
                  <span>${escapeHtml(L.title)}${labTag}${strengthen}</span>
                  <button type="button" class="badge ${cls} btn-lesson" data-lesson="${L.id}" data-status="${st}" ${st === 'locked' ? 'disabled' : ''}>${label}</button>
                </li>`;
              }).join('')}
            </ul>` : `<p style="opacity:0.6;font-weight:700;">More lessons coming soon!</p>`}
        </div>`;
    }).join('') + (activeSubjectId() === 'physics' ? spaceUnitCardHtml() : '');
    wireSpaceUnitCard(grid);

    $$('.btn-lesson', grid).forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (btn.dataset.status === 'locked') return;
        const mode = btn.dataset.status === 'needs_review' ? 'remediate' : 'lesson';
        startLesson(btn.dataset.lesson, { mode });
      });
    });
  }

  /* ——— Space Lab (v2.5.0): former Cosmos app, linked from nav, Home and the Physics Mission Map ——— */
  function renderSpace() {
    showScreen('screen-space');
    if (location.hash !== '#space') history.replaceState(null, '', '#space');
    Einstein.mount($('#space-einstein'), 'explain');
    Einstein.speak($('#space-speech'), 'Welcome to my Space Lab! Pick a lab — orbit the planets, launch a rocket, or watch a star grow old. Some labs are still being built in my workshop.');
    const g = $('#space-grid');
    if (g && typeof SpaceLab !== 'undefined') g.innerHTML = SpaceLab.cardsHtml();
  }

  function spaceUnitCardHtml() {
    if (typeof SpaceLab === 'undefined') return '';
    return `<div class="unit-card space-unit" style="border-top: 8px solid #7C5CFF" data-unit="space-lab">
      <div class="unit-icon">🔭</div>
      <h3>Space Lab</h3>
      <p>3D labs: planets &amp; orbits, rocket launches, the ISS, and the life of a star.</p>
      ${SpaceLab.cardsHtml({ compact: true })}
      <button type="button" class="btn btn-cyan btn-sm btn-space-open">All space labs</button>
    </div>`;
  }

  function wireSpaceUnitCard(grid) {
    $$('.btn-space-open', grid).forEach(b => b.addEventListener('click', () => renderSpace()));
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
          ${avatarSpanHtml({ displayName: summary.displayName, avatarColor: summary.avatarColor || '#4ECDC4', avatarImage: summary.avatarImage })}
          <div>
            <strong>${escapeHtml(summary.displayName)}</strong>
            <div class="muted" data-summary-subject="${escapeHtml(summary.subjectId)}">${escapeHtml(summary.subjectLabel)} · ${escapeHtml(summary.trackLabel)}${summary.ageRange ? ' · ' + escapeHtml(summary.ageRange) : ''}</div>
          </div>
        </div>
        ${summary.subjectReady ? '' : `<p class="privacy-note subject-soon-note">${escapeHtml(summary.subjectLabel)} lessons are coming soon — nothing to report yet. Switch back to Math to see math progress.</p>`}
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
    const track = activeTrack() || { label: (ageTracks()[activeTrackId()] || {}).label || '', lessons: {}, units: [] };
    const sub = Subjects.get(activeSubjectId());
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
      profileLine.innerHTML = `
        <div class="profile-identity-row">
          ${avatarSpanHtml(u, 'avatar-lg')}
          <div class="profile-identity-text">
            <strong>${escapeHtml(u.displayName)}</strong> · ${escapeHtml(sub.label)} · ${escapeHtml(track.label)}
            <span class="muted">(progress for this subject &amp; age track)</span>
          </div>
        </div>`;
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
    list.innerHTML = !subjectReady() ? `<li><span>${escapeHtml(sub.label)} lessons are coming soon — Math progress is under Math.</span></li>` : allIds.map(id => {
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
          const tNext = ageTracks()[next];
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
    if (!track) return;
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
    if (lesson.type === 'sim') {
      // X4: sim lessons are explored in the lab, then graded by lab checks (review: all; remediate: the missed ones)
      practiceList = [];
      const all = lesson.simChecks || [];
      const missedIds = (saved && saved.missedCheckIds) || [];
      const weak = all.filter(q => missedIds.includes(q.id));
      checkList = mode === 'remediate' && weak.length ? weak : all;
    } else if (mode === 'review') {
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
      simParams: null,
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
    const isSim = L.type === 'sim';
    const phases = isSim ? ['intro', 'explain', 'practice', 'check', 'complete'] : ['intro', 'explain', 'example', 'practice', 'check', 'complete'];
    const labels = isSim ? ['Hi', 'Learn', 'Lab', 'Check', '★'] : ['Hi', 'Learn', 'Example', 'Practice', 'Check', '★'];
    const cur = phases.indexOf(lessonCtx.phase);
    $('#lesson-pips').innerHTML = labels.map((lab, i) =>
      `<div class="pip ${i < cur ? 'done' : i === cur ? 'current' : ''}" title="${lab}"></div>`
    ).join('');
    $('#lesson-title').textContent = L.title;
    const unit = track.units.find(u => u.id === L.unitId);
    $('#lesson-meta').textContent = (unit ? unit.title + ' · ' : '') + `~${L.durationMin || 8} min`;
  }

  function renderLessonPhase() {
    const L = lessonCtx.lesson;
    if (L.type === 'sim' && ['example', 'practice', 'check'].includes(lessonCtx.phase)) {
      renderSimPhase();
      return;
    }
    destroySimLab();
    setPips();
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
        body.innerHTML = L.type === 'sim'
          ? `<div class="viz-box">🔬 Einstein's lab — experiment, then take the lab check!</div>`
          : `<div class="viz-box">Get ready — comic-panel learning ahead!</div>`;
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
        <button type="button" class="btn btn-primary" id="btn-next">${isLast ? (L.type === 'sim' ? 'Open the Lab!' : 'See Example') : 'Next Panel'}</button>`;
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
      if (L.type === 'sim') speech = speech.replace(/Practice \d+\/\d+, (Quick )?Check/, 'Lab Check');
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

  /* ——— X4: physics sim lessons (lazy-loaded js/sims/*, never fetched by math-only sessions) ——— */

  // X6: each sim kind lazy-loads only its own view module (engine + checks are shared).
  const SIM_CORE = ['js/sims/engine.js', 'js/sims/checks.js'];
  const SIM_KINDS = {
    ramp: { global: 'SimRamp', scripts: ['js/sims/ramp.js'] },
    push: { global: 'SimPush', scripts: ['js/sims/kit.js', 'js/sims/push.js'] },
    float: { global: 'SimFloat', scripts: ['js/sims/kit.js', 'js/sims/float.js'] }
  };
  const simScriptPromises = {};
  let simLab = null;

  function loadScriptOnce(src) {
    if (!simScriptPromises[src]) {
      simScriptPromises[src] = new Promise((resolve, reject) => {
        const el = document.createElement('script');
        el.src = src;
        el.onload = () => resolve();
        el.onerror = () => { el.remove(); delete simScriptPromises[src]; reject(new Error('could not load ' + src)); };
        document.head.appendChild(el);
      });
    }
    return simScriptPromises[src];
  }

  function simModule(kind) {
    const k = SIM_KINDS[kind];
    return k ? window[k.global] : null;
  }

  function simsReady(kind) {
    return !!(window.SimEngine && window.SimChecks && simModule(kind));
  }

  /** Engine first, then the kind's view module(s) (they register their model), then checks. */
  function loadSims(kind) {
    if (simsReady(kind)) return Promise.resolve();
    const k = SIM_KINDS[kind];
    if (!k) return Promise.reject(new Error('Unknown sim kind: ' + kind));
    const order = [SIM_CORE[0], ...k.scripts, SIM_CORE[1]];
    return order.reduce((chain, src) => chain.then(() => loadScriptOnce(src)), Promise.resolve());
  }

  function destroySimLab() {
    if (simLab) { try { simLab.destroy(); } catch (_) {} simLab = null; }
  }

  function mountSimLab(host, L, params, opts = {}) {
    destroySimLab();
    simLab = simModule(L.sim.kind).mount(host, {
      params,
      controls: L.sim.controls || [],
      locked: opts.locked || [],
      onRun: opts.onRun,
      onChange: opts.onChange
    });
    return simLab;
  }

  async function renderSimPhase() {
    const L = lessonCtx.lesson;
    const ctxToken = lessonCtx;
    if (lessonCtx.phase === 'example') lessonCtx.phase = 'practice';
    if (lessonCtx.phase === 'practice' && lessonCtx.mode !== 'lesson') { lessonCtx.phase = 'check'; lessonCtx.checkIndex = 0; }
    setPips();
    const stage = $('#lesson-einstein');
    const bubble = $('#lesson-speech');
    const body = $('#lesson-body');
    const actions = $('#lesson-actions');
    actions.innerHTML = '';
    const kind = L.sim && L.sim.kind;
    if (!simsReady(kind)) {
      body.innerHTML = '<div class="viz-box sim-loading">Setting up Einstein\'s lab…</div>';
      try {
        await loadSims(kind);
      } catch (err) {
        if (lessonCtx !== ctxToken) return;
        Einstein.mount(stage, 'think');
        Einstein.speak(bubble, "Hmm, my lab equipment didn't arrive. Let's try again!", 'correction');
        body.innerHTML = `<div class="viz-box">Couldn't open the lab — check your connection and try again.</div>`;
        actions.innerHTML = `<button type="button" class="btn btn-primary" id="btn-sim-retry">Try again</button>
          <button type="button" class="btn btn-cyan" id="btn-map">Mission Map</button>`;
        $('#btn-sim-retry').onclick = () => renderSimPhase();
        $('#btn-map').onclick = renderHub;
        return;
      }
      if (lessonCtx !== ctxToken || !document.querySelector('#screen-lesson.active')) return;
    }
    const problems = SimChecks.validateLesson(L);
    if (problems.length) {
      console.warn('Sim lesson skipped:', problems);
      Einstein.mount(stage, 'think');
      Einstein.speak(bubble, 'This lab is still being built — pick another mission for now!');
      body.innerHTML = '<div class="viz-box">Lab under construction 🔧</div>';
      actions.innerHTML = '<button type="button" class="btn btn-cyan" id="btn-map">Mission Map</button>';
      $('#btn-map').onclick = renderHub;
      return;
    }
    if (lessonCtx.phase === 'practice') renderSimExplore();
    else renderSimCheck();
  }

  function renderSimExplore() {
    const L = lessonCtx.lesson;
    const body = $('#lesson-body');
    const actions = $('#lesson-actions');
    Einstein.mount($('#lesson-einstein'), 'explain');
    Einstein.speak($('#lesson-speech'), L.sim.explore || 'Move the sliders and press Run it — experiment!');
    body.innerHTML = '<div class="sim-host" id="sim-host"></div>';
    mountSimLab($('#sim-host'), L, lessonCtx.simParams || L.sim.params, {
      onChange: (p) => { lessonCtx.simParams = p; },
      onRun: (m, p) => {
        lessonCtx.simParams = p;
        Einstein.setState($('#lesson-einstein'), (m.cheer !== undefined ? m.cheer : m.slides) ? 'cheer' : 'think');
      }
    });
    actions.innerHTML = `<button type="button" class="btn btn-primary" id="btn-next">I'm ready for the Lab Check!</button>`;
    $('#btn-next').onclick = () => { lessonCtx.phase = 'check'; lessonCtx.checkIndex = 0; renderLessonPhase(); };
  }

  function renderSimCheck() {
    const L = lessonCtx.lesson;
    const list = lessonCtx.checkList || L.simChecks || [];
    const idx = lessonCtx.checkIndex;
    const q = list[idx];
    if (!q) {
      lessonCtx.phase = 'complete';
      renderLessonPhase();
      return;
    }
    const stage = $('#lesson-einstein');
    const bubble = $('#lesson-speech');
    const body = $('#lesson-body');
    const actions = $('#lesson-actions');
    const isGoal = q.type === 'goal';
    Einstein.mount(stage, 'explain');
    Einstein.speak(bubble, `Lab Check ${idx + 1} of ${list.length} — ${isGoal ? 'set it up, run it, then check!' : 'make your prediction!'}`);
    body.innerHTML = `
      <div class="q-card sim-check" data-check="${escapeAttr(q.id)}" data-check-type="${escapeAttr(q.type)}">
        <div class="q-prompt">${escapeHtml(q.prompt)}</div>
        ${isGoal ? `<p class="sim-goal">🎯 Goal: ${escapeHtml(SimChecks.describeGoal(q.goal))}</p>` : ''}
        <div class="sim-host${isGoal ? '' : ' sim-predict'}" id="sim-host"></div>
        ${isGoal ? '' : `<div class="choices" id="q-choices">${q.choices.map((c, i) =>
          `<button type="button" class="choice" data-choice="${i}">${escapeHtml(c.label)}</button>`).join('')}</div>`}
        <div class="hint-line hidden" id="q-hint"></div>
        <div class="feedback-line" id="q-feedback" aria-live="polite"></div>
      </div>`;
    const feedback = $('#q-feedback');
    const hintEl = $('#q-hint');
    let answered = false;

    const controlIds = (L.sim.controls || []).map(c => c.param);
    const startParams = isGoal
      ? SimChecks.paramsFor(q, lessonCtx.simParams || L.sim.params)
      : SimChecks.paramsFor(q, L.sim.params);
    const lab = mountSimLab($('#sim-host'), L, startParams, {
      locked: isGoal ? (q.lock || []) : controlIds,
      onChange: (p) => {
        if (isGoal) lessonCtx.simParams = p;
        const btn = $('#btn-sim-check');
        if (btn && !answered) { btn.disabled = true; btn.textContent = 'Run it first ▶'; }
      },
      onRun: () => {
        const btn = $('#btn-sim-check');
        if (btn && !answered) { btn.disabled = false; btn.textContent = 'Check my setup ✔'; }
      }
    });
    const runRow = $('#sim-host .sim-buttons');
    if (!isGoal && runRow) runRow.classList.add('hidden');   // predict first, then watch it happen

    function finishAnswer(res) {
      answered = true;
      lessonCtx.checkTotal++;
      if (res.ok) lessonCtx.checkCorrect++;
      else if (q.id && !lessonCtx.missedCheckIds.includes(q.id)) lessonCtx.missedCheckIds.push(q.id);
      Storage.setLessonProgress(progress, L.id, {
        status: 'in_progress',
        checkCorrect: lessonCtx.checkCorrect,
        checkTotal: lessonCtx.checkTotal
      });
      persistProgress();
      feedback.classList.add('show', res.ok ? 'ok' : 'bad');
      if (res.ok) {
        const msg = q.feedbackCorrect || (isGoal ? 'You nailed it — real scientist work!' : 'Correct! The lab agrees with you!');
        feedback.textContent = msg;
        Einstein.setState(stage, 'cheer');
        Einstein.speak(bubble, msg, 'success');
        Einstein.pow(stage, 'YES!');
      } else {
        let msg = q.feedbackWrong;
        if (!msg && isGoal) {
          const a = res.actual;
          msg = `Not yet — your run gave ${SimChecks.describeValue(q.goal.metric, a)}. Goal: ${SimChecks.describeGoal(q.goal)}. Experiments teach us!`;
        }
        if (!msg) {
          const right = (q.choices || []).find(c => c.value === res.expected);
          msg = `Not quite — the lab shows: ${right ? right.label : res.expected}. Watch it happen!`;
        }
        feedback.textContent = msg;
        Einstein.setState(stage, 'think');
        Einstein.speak(bubble, msg, 'correction');
        if (q.hint) { hintEl.textContent = 'Hint: ' + q.hint; hintEl.classList.remove('hidden'); }
      }
      const isLast = idx >= list.length - 1;
      actions.innerHTML = `<button type="button" class="btn btn-primary" id="btn-next">${isLast ? 'Finish!' : 'Next'}</button>`;
      $('#btn-next').onclick = () => {
        lessonCtx.checkIndex++;
        if (lessonCtx.checkIndex >= list.length) lessonCtx.phase = 'complete';
        renderLessonPhase();
      };
    }

    if (isGoal) {
      actions.innerHTML = `<button type="button" class="btn btn-primary" id="btn-sim-check" disabled>Run it first ▶</button>`;
      $('#btn-sim-check').onclick = () => {
        if (answered) return;
        const metrics = lab.lastMetrics();
        if (!metrics) return;
        const res = SimChecks.grade(q, { kind: L.sim.kind, params: lab.getParams(), metrics });
        $('#btn-sim-check').disabled = true;
        finishAnswer(res);
      };
    } else {
      $$('.choice', body).forEach(btn => {
        btn.addEventListener('click', () => {
          if (answered) return;
          const choice = q.choices[Number(btn.dataset.choice)];
          const res = SimChecks.grade(q, { kind: L.sim.kind, params: startParams, choice: choice.value });
          $$('.choice', body).forEach(b => {
            b.disabled = true;
            const c = q.choices[Number(b.dataset.choice)];
            if (c.value === res.expected) b.classList.add('correct');
            else if (b === btn && !res.ok) b.classList.add('incorrect');
          });
          finishAnswer(res);
          if (runRow) runRow.classList.remove('hidden');
          if (!q.compare) lab.run();
        });
      });
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


  /** X3: switch the active subject — loads its pack on first use (X2), then progress / Today's path / summary
   *  read and write `<subject>:<track>`. The choice persists in prefs.activeSubject. */
  async function switchSubject(id) {
    if (!Subjects.isSelectable(id)) return false;
    try {
      curriculum = Subjects.isPackLoaded(curriculum, id)
        ? Subjects.normalizeCurriculum(curriculum, id)
        : Subjects.applyPack(curriculum, id, await Subjects.loadPack(id), id);
    } catch (err) {
      notice(((err && err.message) || 'Could not load that subject.') + ' Staying on ' + Subjects.get(activeSubjectId()).label + '.');
      return false;
    }
    store = Storage.setActiveSubject(store, id);
    store = Storage.loadStore();
    syncProgressFromStore();
    updateSubjectChip();
    if ($('#screen-progress')?.classList.contains('active')) renderProgress();
    else if ($('#screen-hub')?.classList.contains('active')) renderHub();
    else { showScreen('screen-landing'); renderLanding(); }
    return true;
  }

  function openSubjectModal() {
    const modal = $('#subject-modal');
    if (!modal || typeof Subjects === 'undefined') return;
    const list = $('#subject-list');
    const activeId = Storage.getActiveSubject(store);
    list.innerHTML = Subjects.CATALOG.map((sub) => {
      const soon = sub.status !== 'live';
      const sel = sub.id === activeId ? ' selected' : '';
      const badge = soon ? '<span class="soon-badge">soon</span>' : '';
      return `<button type="button" class="user-card subject-card${soon ? ' soon' : ''}${sel}" data-subject-id="${escapeAttr(sub.id)}" aria-pressed="${sub.id === activeId ? 'true' : 'false'}">
        <span class="user-card-text">
          <strong>${escapeHtml(sub.label)}${badge}</strong>
          <span class="muted">${escapeHtml(sub.blurb || '')}</span>
        </span>
      </button>`;
    }).join('');
    $$('[data-subject-id]', list).forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (await switchSubject(btn.dataset.subjectId)) modal.classList.add('hidden');
      });
    });
    modal.classList.remove('hidden');
  }


  /* ---------- W1b comic avatar (device-local) ---------- */
  const avatarCtx = { src: null, cx: 0, cy: 0, side: 0, base: 0, result: null, drag: null };

  function drawAvatarCrop() {
    const cv = $('#avatar-crop');
    if (!cv || !avatarCtx.src) return;
    const g = cv.getContext('2d');
    const W = cv.width;
    const { src, cx, cy, side } = avatarCtx;
    g.fillStyle = '#FFF8E7';
    g.fillRect(0, 0, W, W);
    g.drawImage(src, cx - side / 2, cy - side / 2, side, side, 0, 0, W, W);
    // head-and-shoulders guide (same shape Comicify keeps)
    g.save();
    g.setLineDash([8, 6]);
    g.lineWidth = 3;
    g.strokeStyle = '#1A1A2E';
    g.beginPath();
    g.ellipse(W * 0.5, W * 0.40, W * 0.31, W * 0.37, 0, 0, Math.PI * 2);
    g.moveTo(W * 0.20, W * 0.68); g.lineTo(W * 0.0, W * 0.92);
    g.moveTo(W * 0.80, W * 0.68); g.lineTo(W * 1.0, W * 0.92);
    g.stroke();
    g.restore();
  }

  function clampAvatarCrop() {
    const { src } = avatarCtx;
    const zoom = parseFloat($('#avatar-zoom')?.value || '1') || 1;
    avatarCtx.side = avatarCtx.base / zoom;
    const half = avatarCtx.side / 2;
    avatarCtx.cx = Math.min(src.width - half, Math.max(half, avatarCtx.cx));
    avatarCtx.cy = Math.min(src.height - half, Math.max(half, avatarCtx.cy));
  }

  function showAvatarStep(step) {
    $('#avatar-step-crop')?.classList.toggle('hidden', step !== 'crop');
    $('#avatar-step-preview')?.classList.toggle('hidden', step !== 'preview');
  }

  function closeAvatarModal() {
    $('#avatar-modal')?.classList.add('hidden');
    if (avatarCtx.src && avatarCtx.src.close) avatarCtx.src.close();
    avatarCtx.src = null;
    avatarCtx.result = null;
  }

  /** Profile modal: same builder as the Home card, plus the drag/zoom crop step and a preview. */
  async function startComicAvatar(file) {
    try {
      const { src, box } = await loadExplorerPhoto(file);
      // warm the vendored model while the parent adjusts the crop; if it can't load, Make → canvas filter
      if (typeof Comicify !== 'undefined') Comicify.loadSegmenter(MODEL_BASE).catch(() => {});
      avatarCtx.src = src;
      avatarCtx.base = Math.min(src.width, src.height);
      avatarCtx.cx = box.x + box.side / 2;
      avatarCtx.cy = box.y + box.side / 2;
      const zoomEl = $('#avatar-zoom');
      if (zoomEl) zoomEl.value = String(Math.max(1, Math.min(4, avatarCtx.base / box.side)));
      clampAvatarCrop();
      showAvatarStep('crop');
      $('#avatar-modal')?.classList.remove('hidden');
      drawAvatarCrop();
    } catch (err) {
      notice(((err && err.message) || 'That photo did not work.') + ' Keeping the letter avatar.');
    }
  }

  async function makeComicAvatar() {
    const u = activeUser();
    if (!u || !avatarCtx.src) return;
    const btn = $('#btn-avatar-make');
    if (btn) { btn.disabled = true; btn.textContent = 'Inking…'; }
    try {
      const crop = { x: avatarCtx.cx - avatarCtx.side / 2, y: avatarCtx.cy - avatarCtx.side / 2, side: avatarCtx.side };
      avatarCtx.result = await renderExplorerAvatar(avatarCtx.src, crop, u.avatarColor);
      $('#avatar-preview-big').src = avatarCtx.result.png512;
      $('#avatar-preview-small').src = avatarCtx.result.png128;
      showAvatarStep('preview');
      if (avatarCtx.result.mode === 'filter') notice('Comic style isn\'t available on this device, so this is a simple photo filter.');
    } catch (err) {
      notice(((err && err.message) || 'Comicify failed.') + ' Keeping the letter avatar.');
      closeAvatarModal();
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Make my comic'; }
    }
  }

  function refreshAvatarButtons() {
    const u = activeUser();
    $('#btn-remove-avatar')?.classList.toggle('hidden', !Storage.avatarSrc(u));
  }

  function wireComicAvatar() {
    const input = $('#input-avatar-photo');
    $('#btn-comic-avatar')?.addEventListener('click', () => {
      if (!activeUser() || !input) return;
      input.value = '';
      input.click();
    });
    input?.addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) startComicAvatar(f);
    });
    $('#btn-remove-avatar')?.addEventListener('click', () => {
      const u = activeUser();
      if (!u) return;
      Storage.clearComicAvatar(store, u.id);
      store = Storage.loadStore();
      syncProgressFromStore();
      refreshAfterProfileChange();
      refreshAvatarButtons();
    });
    const cv = $('#avatar-crop');
    cv?.addEventListener('pointerdown', (e) => {
      avatarCtx.drag = { x: e.clientX, y: e.clientY };
      cv.setPointerCapture(e.pointerId);
    });
    cv?.addEventListener('pointermove', (e) => {
      if (!avatarCtx.drag || !avatarCtx.src) return;
      const k = avatarCtx.side / cv.getBoundingClientRect().width;
      avatarCtx.cx -= (e.clientX - avatarCtx.drag.x) * k;
      avatarCtx.cy -= (e.clientY - avatarCtx.drag.y) * k;
      avatarCtx.drag = { x: e.clientX, y: e.clientY };
      clampAvatarCrop();
      drawAvatarCrop();
    });
    const endDrag = () => { avatarCtx.drag = null; };
    cv?.addEventListener('pointerup', endDrag);
    cv?.addEventListener('pointercancel', endDrag);
    $('#avatar-zoom')?.addEventListener('input', () => {
      if (!avatarCtx.src) return;
      clampAvatarCrop();
      drawAvatarCrop();
    });
    $('#btn-avatar-make')?.addEventListener('click', makeComicAvatar);
    $('#btn-avatar-retry')?.addEventListener('click', () => showAvatarStep('crop'));
    $('#btn-avatar-cancel')?.addEventListener('click', closeAvatarModal);
    $('#btn-avatar-keep')?.addEventListener('click', closeAvatarModal);
    $('#btn-avatar-use')?.addEventListener('click', () => {
      const u = activeUser();
      if (!u || !avatarCtx.result) return;
      saveExplorerAvatar(u.id, avatarCtx.result);
      closeAvatarModal();
      refreshAfterProfileChange();
      refreshAvatarButtons();
    });
  }

  function openSwitcher() {
    const modal = $('#switcher-modal');
    if (!modal) return;
    const list = $('#switcher-list');
    const users = Storage.listUsers(store);
    list.innerHTML = users.map(u => {
      const t = ageTracks()[u.trackId];
      return `<button type="button" class="user-card" data-switch-id="${escapeAttr(u.id)}">
        ${avatarSpanHtml(u)}
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
        if (isMathSubject() && !progress.diagnosticDone) startDiagnostic();
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
    $('#btn-open-space')?.addEventListener('click', () => renderSpace());
    $$('[data-nav]').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.nav;
        if (t === 'landing') { showScreen('screen-landing'); renderLanding(); }
        else if (t === 'hub') requireUserThen(renderHub);
        else if (t === 'progress') requireUserThen(renderProgress);
        else if (t === 'space') renderSpace();
      });
    });
    $('#btn-reset')?.addEventListener('click', () => {
      const u = activeUser();
      if (!u) return;
      const track = activeTrack();
      if (!track) return;
      const subLabel = Subjects.get(activeSubjectId()).label;
      if (confirm(`Reset ${u.displayName}'s ${subLabel} progress on ${track.label} only? Other subjects, tracks & explorers stay safe.`)) {
        progress = Storage.resetTrackProgress(store, u.id, activeTrackId(), activeSubjectId());
        store = Storage.loadStore();
        syncProgressFromStore();
        renderProgress();
      }
    });
    $('#btn-delete-user')?.addEventListener('click', () => {
      const u = activeUser();
      if (!u) return;
      deleteExplorerById(u.id);
    });
    $('#btn-reset-all-explorers')?.addEventListener('click', () => resetAllExplorers());
    $('#user-chip')?.addEventListener('click', openSwitcher);
    $('#btn-close-switcher')?.addEventListener('click', () => {
      $('#switcher-modal')?.classList.add('hidden');
    });
    $('#switcher-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'switcher-modal') e.target.classList.add('hidden');
    });
    $('#btn-subject-chip')?.addEventListener('click', openSubjectModal);
    wireComicAvatar();
    $('#btn-close-subject')?.addEventListener('click', () => {
      $('#subject-modal')?.classList.add('hidden');
    });
    $('#subject-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'subject-modal') e.target.classList.add('hidden');
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
    const wantSpace = location.hash === '#space'; // back link from cosmos/ (read before showScreen clears it)
    try {
      // X2: lazy subject packs — only data/subjects/math.json (+ the active subject's pack) is fetched
      store = Storage.loadStore();
      curriculum = await Subjects.loadCurriculum(Storage.getActiveSubject(store));
      if (!Object.keys(ageTracks()).length) throw new Error('Curriculum missing tracks');
    } catch (err) {
      document.body.innerHTML = `
        <div class="app"><div class="comic-panel">
          <h1 class="panel-title">Oops!</h1>
          <p style="font-weight:700;">Could not load the lessons (data/subjects/). Please serve this site over HTTP
          (not file://). Try: <code>python3 -m http.server 8080</code> from the project folder.</p>
          <p style="margin-top:0.5rem;opacity:0.7">${escapeHtml(String(err))}</p>
        </div></div>`;
      return;
    }
    store = Storage.loadStore();
    syncProgressFromStore();
    syncSpeechFromStore();
    wireStudentMirror();
    refreshStudentCast('idle');
    wireNav();
    renderLanding();
    showScreen('screen-landing');
    if (wantSpace) renderSpace();
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
