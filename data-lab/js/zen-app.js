/* The River of Data — Zen Focus Engine (4-Beat Micro-Loop + Real PostgreSQL 18 + Quiet Modals)
 * Principles: Wu Wei (effortless progression), Ma (one calm screen at a time), real execution (PGlite WASM).
 */
(() => {
  'use strict';

  const STORAGE_KEY = 'einstein-zen-river-v1';
  const MOSS_MS = 24 * 60 * 60 * 1000; // 24h gentle spaced-recall reminder

  const DEFAULT_STATE = {
    currentChapterIdx: 0,
    currentBeat: 1,
    mastered: {},
    masteredAt: {},
    sqlSolved: {},
    partAllMist: false,
    soundEnabled: true,
    dark: false
  };

  let state = loadState();
  let _hasInteracted = false;
  let _pgBootPromise = null;
  let _isPlayingNarration = false;
  let _draftSql = {};        // per-chapter Beat 3 draft
  let _touchState = {};      // per-chapter Beat 2 interactive widget state
  let _studioSubTab = 'labs';
  let _studioLabId = 'pg1-filter';
  let _studioLabDrafts = {};
  let _studioScratchSql = `SELECT s.store_id, st.store_name, COUNT(*) AS txns, SUM(s.net_amount) AS revenue\nFROM stg_pos_sales s\nJOIN dim_store st ON st.store_id = s.store_id\nGROUP BY s.store_id, st.store_name\nORDER BY revenue DESC;`;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_STATE };
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_STATE,
        ...parsed,
        mastered: { ...(parsed.mastered || {}) },
        masteredAt: { ...(parsed.masteredAt || {}) },
        sqlSolved: { ...(parsed.sqlSolved || {}) }
      };
    } catch (_) {
      return { ...DEFAULT_STATE };
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function getChapter(idx = state.currentChapterIdx) {
    const safeIdx = Math.max(0, Math.min(ZenChapters.length - 1, idx));
    return ZenChapters[safeIdx];
  }

  function isChapterUnlocked(idx) {
    if (idx <= 0) return true;
    if (state.partAllMist) return true;
    if (idx === state.currentChapterIdx) return true;
    const ch = ZenChapters[idx];
    const prev = ZenChapters[idx - 1];
    return !!(state.mastered[ch.id] || state.mastered[prev.id]);
  }

  function masteredCount() {
    return ZenChapters.filter(c => state.mastered[c.id]).length;
  }

  function markChapterMastered(ch) {
    const wasMastered = !!state.mastered[ch.id];
    state.mastered[ch.id] = true;
    state.masteredAt[ch.id] = Date.now();
    if (ch.spell && ch.spell.pgChallengeId) {
      state.sqlSolved[ch.spell.pgChallengeId] = true;
    }
    saveState();
    syncHeaderAndRiver();
    const xFrac = Math.min(0.93, 0.14 + (ch.num - 1) * 0.13);
    ZenWorld.ripple(xFrac);
    if (!wasMastered) {
      setTimeout(() => ZenWorld.ripple(xFrac), 320);
    }
  }

  /* ============================================================
     REAL POSTGRESQL 18 (PGLITE WASM) LAZY BOOT
  ============================================================ */
  async function ensurePgReady() {
    if (window.PgLab && PgLab.ready) {
      updatePgStatusBadges(`● ${PgLab.version} live in browser`, true);
      return PgLab;
    }
    if (!_pgBootPromise) {
      updatePgStatusBadges('⏳ Waking PostgreSQL 18 (WASM)…', false);
      _pgBootPromise = (async () => {
        const mod = await import('../vendor/pglite/index.js');
        const PGlite = mod.PGlite || mod.default;
        const ver = await PgLab.init(PGlite);
        updatePgStatusBadges(`● ${ver} live in browser`, true);
        return PgLab;
      })().catch(err => {
        _pgBootPromise = null;
        updatePgStatusBadges(`⚠ Postgres boot failed: ${err.message}`, false);
        throw err;
      });
    }
    return _pgBootPromise;
  }

  function updatePgStatusBadges(text, ready) {
    ['#pg-status', '#studio-pg-status'].forEach(sel => {
      const el = $(sel);
      if (!el) return;
      el.textContent = text;
      el.style.color = ready ? 'var(--sage)' : 'var(--saffron)';
    });
  }

  /* ============================================================
     THEME, SOUND & RIVER HEADER SYNC
  ============================================================ */
  function applyTheme() {
    document.documentElement.classList.toggle('dark', !!state.dark);
    const btn = $('#btn-theme');
    if (btn) btn.textContent = state.dark ? '☀️ Warm Paper' : '🌙 Night';
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', state.dark ? '#16131E' : '#F4EEDF');
  }

  function applySoundSetting() {
    ZenAudio.enabled = !!state.soundEnabled;
    if (!state.soundEnabled) {
      ZenAudio.stopNarration();
      _isPlayingNarration = false;
    }
    const btn = $('#btn-sound');
    if (btn) btn.textContent = state.soundEnabled ? '🔊 Voice On' : '🔇 Muted';
  }

  function syncHeaderAndRiver() {
    ZenWorld.setMastered(state.mastered);
    const done = masteredCount();
    const journalBtn = $('#btn-journal');
    if (journalBtn) journalBtn.textContent = `📖 Journal (${done}/7)`;

    const statusEl = $('#river-status');
    const rightEl = $('#river-right');
    if (statusEl) {
      if (done === 0) {
        statusEl.textContent = 'A quiet mountain stream awaits. Master each chapter to heal the river.';
      } else if (done === 7) {
        statusEl.textContent = 'All 7 landmarks awake · The harbour watchtower lantern shines over a still river.';
      } else {
        const names = ZenChapters.filter(c => state.mastered[c.id]).map(c => c.title);
        statusEl.textContent = `${done} of 7 landmarks awake · ${names.join(' → ')}`;
      }
    }
    if (rightEl) {
      const solvedSql = Object.keys(state.sqlSolved).filter(k => state.sqlSolved[k]).length;
      rightEl.textContent = `Postgres 18 Labs: ${solvedSql}/${PgLab.CHALLENGES.length}`;
    }
  }

  /* ============================================================
     NAVIGATION: CHAPTERS & 4-BEAT STEPPER
  ============================================================ */
  function openChapter(idx, beat = 1, autoPlay = false) {
    const safeIdx = Math.max(0, Math.min(ZenChapters.length - 1, idx));
    ZenAudio.stopNarration();
    _isPlayingNarration = false;
    state.currentChapterIdx = safeIdx;
    state.currentBeat = beat;
    saveState();
    renderStage(autoPlay);
    syncHeaderAndRiver();
  }

  function setBeat(beat, autoPlay = false) {
    const ch = getChapter();
    if (beat === 4 && !state.mastered[ch.id]) {
      ZenAudio.woodblock();
      return;
    }
    ZenAudio.stopNarration();
    _isPlayingNarration = false;
    state.currentBeat = beat;
    saveState();
    renderStage(autoPlay);
  }

  /* ============================================================
     STAGE RENDERER (SINGLE FOCUS — ONE BEAT AT A TIME)
  ============================================================ */
  function renderStage(autoPlay = false) {
    const stage = $('#focus-stage');
    if (!stage) return;
    const ch = getChapter();
    const beat = state.currentBeat;
    const mastered = !!state.mastered[ch.id];

    const beatMeta = [
      { n: 1, label: '1. Watch' },
      { n: 2, label: '2. Feel' },
      { n: 3, label: '3. Spell' },
      { n: 4, label: '4. Koan' }
    ];

    const stepperHtml = beatMeta.map(b => {
      const cls = b.n === beat
        ? 'active'
        : (b.n < beat || mastered ? 'done' : '');
      const locked = b.n === 4 && !mastered;
      return `<button type="button" class="beat-dot ${cls}" data-beat="${b.n}" ${locked ? 'disabled title="Complete Beat 3 to unlock the Koan"' : ''}>${b.label}</button>`;
    }).join('');

    let bodyHtml = '';
    if (beat === 1) bodyHtml = renderBeat1Html(ch);
    else if (beat === 2) bodyHtml = renderBeat2Html(ch);
    else if (beat === 3) bodyHtml = renderBeat3Html(ch);
    else bodyHtml = renderBeat4Html(ch);

    stage.innerHTML = `
      <div class="chapter-top">
        <div>
          <div class="chapter-eyebrow">Chapter ${esc(ch.roman)} of VII · ${esc(ch.tech)}</div>
          <h2 class="chapter-title">${esc(ch.title)}</h2>
          <p class="chapter-sub">${esc(ch.subtitle)}</p>
        </div>
        <div class="beat-dots" role="tablist" aria-label="Chapter beats">${stepperHtml}</div>
      </div>
      <div id="beat-body" class="stack-sm" style="gap:16px;">${bodyHtml}</div>
    `;

    // Wire stepper dots
    $$('.beat-dot', stage).forEach(btn => {
      btn.addEventListener('click', () => {
        const n = Number(btn.dataset.beat);
        if (!Number.isFinite(n)) return;
        ZenAudio.tap();
        setBeat(n, false);
      });
    });

    // Wire current beat interactions
    if (beat === 1) wireBeat1(ch, autoPlay);
    else if (beat === 2) wireBeat2(ch);
    else if (beat === 3) wireBeat3(ch);
    else wireBeat4(ch);
  }

  /* ---------------- BEAT 1: WATCH & LISTEN ---------------- */
  function renderBeat1Html(ch) {
    const firstCaption = (ch.cues && ch.cues[0]) ? ch.cues[0].caption : ch.narration;
    return `
      <div class="koan-stage-wrap">
        <canvas id="koan-stage-canvas" aria-label="Animated visual metaphor for ${esc(ch.title)}"></canvas>
        <div class="progress-hairline"><div id="koan-progress-fill" class="progress-hairline-fill"></div></div>
        <div id="koan-subtitle" class="koan-subtitle-bar">“${esc(firstCaption)}”</div>
      </div>
      <div class="row-between">
        <div class="row">
          <button type="button" id="btn-play-koan" class="btn-quiet">▶ Listen &amp; Watch</button>
          <span id="koan-time-hint" class="muted">${state.soundEnabled ? 'Narrated by Orion · ~16 seconds' : 'Silent visual story · ~16 seconds'}</span>
        </div>
        <button type="button" id="btn-to-beat2" class="btn-saffron">Continue to Touch &amp; Feel →</button>
      </div>
    `;
  }

  function wireBeat1(ch, autoPlay) {
    const riverCanvas = $('#zen-river-canvas');
    const koanCanvas = $('#koan-stage-canvas');
    ZenWorld.mount(riverCanvas, koanCanvas);
    ZenWorld.setKoanState(ch.num, 0.06, ch.cues[0] ? ch.cues[0].scene : 'stream');

    const playBtn = $('#btn-play-koan');
    const fill = $('#koan-progress-fill');
    const sub = $('#koan-subtitle');
    const hint = $('#koan-time-hint');

    const startPlayback = () => {
      _isPlayingNarration = true;
      if (playBtn) playBtn.textContent = '↺ Replay Story';
      if (hint) hint.textContent = state.soundEnabled ? 'Listening… breathe and watch the sketch unfold.' : 'Watching silent visual story…';

      ZenAudio.playNarration(
        ch.audio,
        ch.narration,
        (t, dur) => {
          const pct = dur > 0 ? Math.min(1, t / dur) : 0;
          if (fill) fill.style.width = `${(pct * 100).toFixed(1)}%`;
          let activeCue = ch.cues[0];
          for (const cue of ch.cues) {
            if (t >= cue.at) activeCue = cue;
          }
          ZenWorld.setKoanState(ch.num, pct, activeCue ? activeCue.scene : 'stream');
          if (sub && activeCue) sub.textContent = `“${activeCue.caption}”`;
        },
        () => {
          _isPlayingNarration = false;
          if (fill) fill.style.width = '100%';
          ZenWorld.setKoanState(ch.num, 1, ch.cues[ch.cues.length - 1].scene);
          if (hint) hint.textContent = 'Story complete · Ready to feel it with your hands.';
        }
      );
    };

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        ZenAudio.tap();
        startPlayback();
      });
    }

    const nextBtn = $('#btn-to-beat2');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        ZenAudio.tap();
        setBeat(2);
      });
    }

    if (autoPlay && _hasInteracted) {
      startPlayback();
    }
  }

  /* ---------------- BEAT 2: TOUCH & FEEL ---------------- */
  function getTouchState(ch) {
    if (!_touchState[ch.id]) {
      if (ch.touch.type === 'toggle') {
        _touchState[ch.id] = { on: false };
      } else if (ch.touch.type === 'sliders2') {
        _touchState[ch.id] = { enc: false, str: false, dedup: false };
      } else if (ch.touch.type === 'backfill') {
        _touchState[ch.id] = { copy: false, idx: false, par: false };
      } else if (ch.touch.type === 'dialect-flip') {
        _touchState[ch.id] = { side: 'both' }; // 'tsql' | 'pg' | 'both'
      } else if (ch.touch.type === 'partitions') {
        _touchState[ch.id] = { sargable: false, month: 39 }; // 39 = 2022-03
      }
    }
    return _touchState[ch.id];
  }

  function renderBeat2Html(ch) {
    const ts = getTouchState(ch);
    let inner = '';

    if (ch.touch.type === 'toggle') {
      const on = !!ts.on;
      const borderCol = on ? 'var(--sage)' : 'var(--warn)';
      inner = `
        <div class="touch-toggle-row">
          <button type="button" class="touch-choice ${!on ? 'selected' : ''}" data-toggle="off">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--warn);">Before</div>
            <div>${esc(ch.touch.offLabel)}</div>
          </button>
          <button type="button" class="touch-choice ${on ? 'selected' : ''}" data-toggle="on">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--sage);">With Law Applied</div>
            <div>${esc(ch.touch.onLabel)}</div>
          </button>
        </div>
        <div class="touch-readout" style="border-left-color:${borderCol};">
          ${esc(on ? ch.touch.onReadout : ch.touch.offReadout)}
        </div>
      `;
    } else if (ch.touch.type === 'sliders2') {
      const count = ch.touch.toggles.filter(t => ts[t.id]).length;
      const sampleEnc = ts.enc ? 'UTF-8 clean ("Café Mug")' : '💥 UnicodeDecodeError at byte 0xE9';
      const sampleSku = ts.str ? '"00421" (str — exact join match)' : '421 (int — leading zeros lost!)';
      const sampleRows = ts.dedup ? '1 unique row per SKU' : '2 duplicate rows (join fan-out risk)';
      inner = `
        <div class="stack-sm">
          ${ch.touch.toggles.map(t => `
            <button type="button" class="touch-choice ${ts[t.id] ? 'selected' : ''}" data-lever="${esc(t.id)}">
              <div class="row-between">
                <span class="mono" style="font-size:13px;">${ts[t.id] ? '✓' : '○'} ${esc(t.label)}</span>
                <span class="muted">${esc(t.impact)}</span>
              </div>
            </button>
          `).join('')}
        </div>
        <div class="touch-readout" style="border-left-color:${count === 3 ? 'var(--sage)' : 'var(--warn)'};">
          <div><strong>Live Vendor CSV Sample:</strong></div>
          <div>• Encoding: ${esc(sampleEnc)}</div>
          <div>• SKU Key:  ${esc(sampleSku)}</div>
          <div>• Uniqueness: ${esc(sampleRows)}</div>
          <div style="margin-top:6px;color:${count === 3 ? 'var(--sage)' : 'var(--sepia)'};font-weight:600;">
            ${count === 3 ? '✓ All 3 Sluice Guards engaged — dirty files quarantined cleanly.' : `${count}/3 guards engaged — tap each lever to seal the gate.`}
          </div>
        </div>
      `;
    } else if (ch.touch.type === 'backfill') {
      let hours = 14.0;
      ch.touch.toggles.forEach(t => { if (ts[t.id]) hours += t.delta; });
      hours = Math.max(2.5, Number(hours.toFixed(1)));
      const throughput = ts.copy ? (ts.par ? '85,000 rows/sec' : '42,000 rows/sec') : '1,000 rows/sec';
      const pctFast = Math.round(((14 - hours) / (14 - 2.5)) * 100);
      inner = `
        <div class="stack-sm">
          ${ch.touch.toggles.map(t => `
            <button type="button" class="touch-choice ${ts[t.id] ? 'selected' : ''}" data-valve="${esc(t.id)}">
              <div class="row-between">
                <span>${ts[t.id] ? '✓' : '○'} ${esc(t.label)}</span>
                <span class="mono" style="color:var(--sage);font-weight:700;">${t.delta} hrs</span>
              </div>
              <div class="muted" style="margin-top:2px;">${esc(t.note)}</div>
            </button>
          `).join('')}
        </div>
        <div class="touch-readout" style="border-left-color:${hours <= 3 ? 'var(--sage)' : 'var(--saffron)'};">
          <div class="row-between">
            <span><strong>50M-Row Backfill Time:</strong> ${hours.toFixed(1)} hrs</span>
            <span><strong>Flow Rate:</strong> ${throughput}</span>
          </div>
          <div class="progress-hairline" style="margin-top:8px;height:6px;border-radius:99px;overflow:hidden;">
            <div class="progress-hairline-fill" style="width:${Math.max(8, pctFast)}%;background:${hours <= 3 ? 'var(--sage)' : 'var(--saffron)'};"></div>
          </div>
        </div>
      `;
    } else if (ch.touch.type === 'dialect-flip') {
      const side = ts.side || 'both';
      inner = `
        <div class="row">
          <button type="button" class="pill-btn ${side === 'tsql' ? 'btn-saffron' : ''}" data-side="tsql">SQL Server (T-SQL)</button>
          <button type="button" class="pill-btn ${side === 'both' ? 'btn-saffron' : ''}" data-side="both">Side-by-Side Mirror</button>
          <button type="button" class="pill-btn ${side === 'pg' ? 'btn-saffron' : ''}" data-side="pg">PostgreSQL</button>
        </div>
        <div class="table-wrap">
          <table class="zen-table">
            <thead>
              <tr>
                <th>Universal Idea</th>
                ${side !== 'pg' ? '<th>SQL Server (T-SQL)</th>' : ''}
                ${side !== 'tsql' ? '<th>PostgreSQL</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${ch.touch.pairs.map(p => `
                <tr>
                  <td style="font-family:var(--font);font-weight:600;color:var(--sepia);">${esc(p.concept)}</td>
                  ${side !== 'pg' ? `<td>${esc(p.tsql)}</td>` : ''}
                  ${side !== 'tsql' ? `<td style="color:var(--sage);">${esc(p.pg)}</td>` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (ch.touch.type === 'partitions') {
      const sarg = !!ts.sargable;
      const targetIdx = ts.month; // 1..72
      const yr = 2019 + Math.floor((targetIdx - 1) / 12);
      const mo = ((targetIdx - 1) % 12) + 1;
      const moStr = `${yr}-${String(mo).padStart(2, '0')}`;
      const nextMo = mo === 12 ? `${yr + 1}-01` : `${yr}-${String(mo + 1).padStart(2, '0')}`;
      let gridCells = '';
      for (let i = 1; i <= 72; i++) {
        const cy = 2019 + Math.floor((i - 1) / 12);
        const cm = ((i - 1) % 12) + 1;
        const label = `${String(cy).slice(2)}-${String(cm).padStart(2, '0')}`;
        const cls = sarg ? (i === targetIdx ? 'open' : '') : 'scan';
        gridCells += `<div class="part-mini ${cls}">${label}</div>`;
      }
      inner = `
        <div class="touch-toggle-row">
          <button type="button" class="touch-choice ${!sarg ? 'selected' : ''}" data-sarg="off">
            <div style="font-size:11px;color:var(--warn);text-transform:uppercase;">Non-Sargable (Wrapped)</div>
            <div id="part-sql-off" class="mono" style="font-size:12px;">WHERE EXTRACT(MONTH FROM event_ts) = ${mo}</div>
          </button>
          <button type="button" class="touch-choice ${sarg ? 'selected' : ''}" data-sarg="on">
            <div style="font-size:11px;color:var(--sage);text-transform:uppercase;">Sargable Range Bounds</div>
            <div id="part-sql-on" class="mono" style="font-size:12px;">WHERE event_ts >= '${moStr}-01' AND event_ts &lt; '${nextMo}-01'</div>
          </button>
        </div>
        <div class="row-between">
          <label for="part-month-slider" class="muted">Target Month Drawer: <strong id="part-month-label" class="mono" style="color:var(--ink);">${moStr}</strong></label>
          <input id="part-month-slider" type="range" min="1" max="72" value="${targetIdx}" style="flex:1;max-width:300px;accent-color:var(--saffron);" />
        </div>
        <div id="part-mini-grid" class="part-mini-grid">${gridCells}</div>
        <div id="part-readout" class="touch-readout" style="border-left-color:${sarg ? 'var(--sage)' : 'var(--warn)'};">
          ${sarg
            ? `✓ Partition Pruning Active: 1 of 72 monthly locks opened (${moStr}) · 98.6% skipped · ~1.4s`
            : `⚠ Full Table Scan: Wrapping event_ts in EXTRACT() blinds the planner → all 72 locks opened · ~21.4s`}
        </div>
      `;
    }

    return `
      <div class="touch-box">
        <div style="font-weight:600;color:var(--sepia);">${esc(ch.touch.prompt)}</div>
        ${inner}
      </div>
      <div class="row-between">
        <button type="button" id="btn-back-beat1" class="btn-quiet">← Back to Watch</button>
        <button type="button" id="btn-to-beat3" class="btn-saffron">Continue to Speak the Spell →</button>
      </div>
    `;
  }

  function wireBeat2(ch) {
    const ts = getTouchState(ch);
    const body = $('#beat-body');

    if (ch.touch.type === 'toggle') {
      $$('[data-toggle]', body).forEach(btn => {
        btn.addEventListener('click', () => {
          ts.on = btn.dataset.toggle === 'on';
          ts.on ? ZenAudio.chime(false) : ZenAudio.tap();
          renderStage(false);
        });
      });
    } else if (ch.touch.type === 'sliders2') {
      $$('[data-lever]', body).forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.lever;
          ts[id] = !ts[id];
          const allOn = ch.touch.toggles.every(t => ts[t.id]);
          allOn ? ZenAudio.chime(false) : ZenAudio.tap();
          renderStage(false);
        });
      });
    } else if (ch.touch.type === 'backfill') {
      $$('[data-valve]', body).forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.valve;
          ts[id] = !ts[id];
          const allOn = ch.touch.toggles.every(t => ts[t.id]);
          allOn ? ZenAudio.chime(false) : ZenAudio.tap();
          renderStage(false);
        });
      });
    } else if (ch.touch.type === 'dialect-flip') {
      $$('[data-side]', body).forEach(btn => {
        btn.addEventListener('click', () => {
          ts.side = btn.dataset.side;
          ZenAudio.tap();
          renderStage(false);
        });
      });
    } else if (ch.touch.type === 'partitions') {
      $$('[data-sarg]', body).forEach(btn => {
        btn.addEventListener('click', () => {
          ts.sargable = btn.dataset.sarg === 'on';
          ts.sargable ? ZenAudio.chime(false) : ZenAudio.tap();
          renderStage(false);
        });
      });
      const slider = $('#part-month-slider', body);
      if (slider) {
        slider.addEventListener('input', () => {
          ts.month = Number(slider.value);
          const idx = ts.month;
          const yr = 2019 + Math.floor((idx - 1) / 12);
          const mo = ((idx - 1) % 12) + 1;
          const moStr = `${yr}-${String(mo).padStart(2, '0')}`;
          const nextMo = mo === 12 ? `${yr + 1}-01` : `${yr}-${String(mo + 1).padStart(2, '0')}`;
          const lbl = $('#part-month-label', body);
          const sqlOff = $('#part-sql-off', body);
          const sqlOn = $('#part-sql-on', body);
          const readout = $('#part-readout', body);
          if (lbl) lbl.textContent = moStr;
          if (sqlOff) sqlOff.textContent = `WHERE EXTRACT(MONTH FROM event_ts) = ${mo}`;
          if (sqlOn) sqlOn.textContent = `WHERE event_ts >= '${moStr}-01' AND event_ts < '${nextMo}-01'`;
          if (readout) {
            readout.textContent = ts.sargable
              ? `✓ Partition Pruning Active: 1 of 72 monthly locks opened (${moStr}) · 98.6% skipped · ~1.4s`
              : `⚠ Full Table Scan: Wrapping event_ts in EXTRACT() blinds the planner → all 72 locks opened · ~21.4s`;
          }
          const cells = $$('#part-mini-grid .part-mini', body);
          cells.forEach((cell, i) => {
            cell.classList.remove('open', 'scan');
            if (ts.sargable) {
              if (i + 1 === idx) cell.classList.add('open');
            } else {
              cell.classList.add('scan');
            }
          });
        });
      }
    }

    const back = $('#btn-back-beat1', body);
    if (back) back.addEventListener('click', () => { ZenAudio.tap(); setBeat(1); });
    const next = $('#btn-to-beat3', body);
    if (next) next.addEventListener('click', () => { ZenAudio.tap(); setBeat(3); });
  }

  /* ---------------- BEAT 3: SPEAK THE SPELL (REAL PG18 OR PYTHON) ---------------- */
  function renderBeat3Html(ch) {
    const mastered = !!state.mastered[ch.id];

    if (ch.spell.mode === 'python-quiz') {
      const codeShown = mastered ? ch.spell.code.replace('___', '{"sku": str}') : ch.spell.code;
      return `
        <p style="margin:0;color:var(--sepia);font-weight:500;">${esc(ch.spell.intro)}</p>
        <pre id="py-spell-code" class="zen-code">${esc(codeShown)}</pre>
        <div style="font-weight:600;">${esc(ch.spell.question)}</div>
        <div class="touch-toggle-row">
          ${ch.spell.options.map((o, idx) => `
            <button type="button" class="touch-choice ${mastered && o.ok ? 'selected' : ''}" data-py-opt="${idx}">
              <span class="mono">${esc(o.text)}</span>
            </button>
          `).join('')}
        </div>
        <div id="spell-feedback" class="zen-feedback ${mastered ? 'ok' : 'hidden'}">
          ${mastered ? '✓ Sluice Gate mastered. Leading zeros are preserved.' : ''}
        </div>
        <div class="row-between">
          <button type="button" id="btn-back-beat2" class="btn-quiet">← Back to Feel</button>
          <button type="button" id="btn-to-beat4" class="btn-saffron ${mastered ? '' : 'hidden'}">Rest &amp; Receive Koan →</button>
        </div>
      `;
    }

    // Real PostgreSQL 18 mode
    const pgCh = PgLab.CHALLENGES.find(c => c.id === ch.spell.pgChallengeId);
    const currentSql = _draftSql[ch.id] != null ? _draftSql[ch.id] : (mastered ? pgCh.solution : pgCh.starter);
    const pgStatusText = PgLab.ready ? `● ${PgLab.version} live in browser` : '⏳ Ready to wake PostgreSQL 18 (WASM)';

    return `
      <p style="margin:0;color:var(--sepia);font-weight:500;">${esc(ch.spell.intro)}</p>
      <div class="zen-feedback" style="background:var(--surface-soft);">
        <strong>Task:</strong> ${esc(pgCh.prompt)}
      </div>
      <div class="sql-box">
        <div class="sql-bar">
          <span id="pg-status">${esc(pgStatusText)}</span>
          <span>Cmd / Ctrl + Enter to run</span>
        </div>
        <textarea id="zen-sql-input" class="zen-sql" spellcheck="false" aria-label="PostgreSQL 18 SQL editor">${esc(currentSql)}</textarea>
      </div>
      <div class="row-between">
        <div class="row">
          <button type="button" id="btn-run-spell" class="btn-saffron">▶ Run &amp; Grade on Postgres 18</button>
          <button type="button" id="btn-whisper" class="btn-quiet">💡 Whisper</button>
          <button type="button" id="btn-reveal" class="btn-quiet">✓ Reveal Spell</button>
          <button type="button" id="btn-starter" class="btn-quiet">↺ Starter</button>
        </div>
        <button type="button" id="btn-to-beat4" class="btn-saffron ${mastered ? '' : 'hidden'}">Rest &amp; Receive Koan →</button>
      </div>
      <div id="spell-hint" class="zen-feedback hidden"></div>
      <div id="spell-feedback" class="zen-feedback ${mastered ? 'ok' : 'hidden'}">
        ${mastered ? '✓ Already mastered on real PostgreSQL 18 — run again anytime to practice.' : ''}
      </div>
      <div id="spell-plan" class="hidden"></div>
      <div id="spell-results" class="hidden"></div>
      <div class="row-between" style="padding-top:4px;">
        <button type="button" id="btn-back-beat2" class="btn-quiet">← Back to Feel</button>
        <button type="button" id="btn-open-studio-inline" class="pill-btn">🐘 Open Full SQL Studio (Schema &amp; All 13 Labs)</button>
      </div>
    `;
  }

  function renderResultTableHtml(res) {
    if (!res || !res.fields || !res.fields.length) return '';
    const rows = res.rows || [];
    const header = res.fields.map(f => `<th>${esc(f.name)}</th>`).join('');
    const body = rows.length
      ? rows.slice(0, 40).map(r => `<tr>${r.map(v => `<td>${v === null ? '<span class="muted">NULL</span>' : esc(v)}</td>`).join('')}</tr>`).join('')
      : `<tr><td colspan="${res.fields.length}" class="muted">0 rows returned</td></tr>`;
    return `
      <div class="table-wrap">
        <table class="zen-table">
          <thead><tr>${header}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    `;
  }

  function wireBeat3(ch) {
    const body = $('#beat-body');
    const back = $('#btn-back-beat2', body);
    if (back) back.addEventListener('click', () => { ZenAudio.tap(); setBeat(2); });

    const toBeat4 = $('#btn-to-beat4', body);
    if (toBeat4) toBeat4.addEventListener('click', () => { ZenAudio.tap(); setBeat(4); });

    if (ch.spell.mode === 'python-quiz') {
      const fb = $('#spell-feedback', body);
      const codeEl = $('#py-spell-code', body);
      $$('[data-py-opt]', body).forEach(btn => {
        btn.addEventListener('click', () => {
          const opt = ch.spell.options[Number(btn.dataset.pyOpt)];
          $$('[data-py-opt]', body).forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          fb.classList.remove('hidden', 'ok', 'warn');
          if (opt.ok) {
            ZenAudio.chime(true);
            fb.classList.add('ok');
            fb.textContent = `✓ ${opt.feedback}`;
            if (codeEl) codeEl.textContent = ch.spell.code.replace('___', opt.text);
            markChapterMastered(ch);
            if (toBeat4) toBeat4.classList.remove('hidden');
            // Re-enable Beat 4 dot in stepper
            const dot4 = $('.beat-dot[data-beat="4"]');
            if (dot4) dot4.disabled = false;
          } else {
            ZenAudio.woodblock();
            fb.classList.add('warn');
            fb.textContent = opt.feedback;
          }
        });
      });
      return;
    }

    // PostgreSQL 18 Beat 3 wiring
    const pgCh = PgLab.CHALLENGES.find(c => c.id === ch.spell.pgChallengeId);
    const input = $('#zen-sql-input', body);
    const runBtn = $('#btn-run-spell', body);
    const whisperBtn = $('#btn-whisper', body);
    const revealBtn = $('#btn-reveal', body);
    const starterBtn = $('#btn-starter', body);
    const hintBox = $('#spell-hint', body);
    const fb = $('#spell-feedback', body);
    const planBox = $('#spell-plan', body);
    const resBox = $('#spell-results', body);
    const studioBtn = $('#btn-open-studio-inline', body);

    // Warm up PGlite quietly in the background as soon as user enters Beat 3!
    ensurePgReady().catch(() => {});

    if (input) {
      input.addEventListener('input', () => { _draftSql[ch.id] = input.value; });
      input.addEventListener('keydown', e => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          e.preventDefault();
          runGrade();
        }
      });
    }

    async function runGrade() {
      if (!input) return;
      const sql = input.value.trim();
      if (!sql) return;
      runBtn.disabled = true;
      runBtn.textContent = 'Running on Postgres 18…';
      fb.classList.remove('hidden', 'ok', 'warn');
      fb.textContent = 'Executing inside a safe rollback transaction…';
      planBox.classList.add('hidden');
      resBox.classList.add('hidden');

      try {
        await ensurePgReady();
        const res = await PgLab.grade(pgCh, sql);
        fb.classList.remove('ok', 'warn');
        fb.textContent = res.message;

        if (res.plan) {
          planBox.classList.remove('hidden');
          planBox.innerHTML = `<div class="muted" style="margin-bottom:4px;">Real PostgreSQL 18 EXPLAIN Plan:</div><pre class="zen-code">${esc(res.plan)}</pre>`;
        }
        if (res.user && res.user.fields && res.user.fields.length) {
          resBox.classList.remove('hidden');
          resBox.innerHTML = `<div class="muted" style="margin-bottom:4px;">Your Query Output (${(res.user.rows || []).length} row${(res.user.rows || []).length === 1 ? '' : 's'}):</div>${renderResultTableHtml(res.user)}`;
        }

        if (res.ok) {
          ZenAudio.chime(true);
          fb.classList.add('ok');
          markChapterMastered(ch);
          if (toBeat4) toBeat4.classList.remove('hidden');
          const dot4 = $('.beat-dot[data-beat="4"]');
          if (dot4) dot4.disabled = false;
        } else {
          ZenAudio.woodblock();
          fb.classList.add('warn');
        }
      } catch (err) {
        ZenAudio.woodblock();
        fb.classList.add('warn');
        fb.textContent = `Could not execute query: ${err.message}`;
      } finally {
        runBtn.disabled = false;
        runBtn.textContent = '▶ Run & Grade on Postgres 18';
      }
    }

    if (runBtn) runBtn.addEventListener('click', runGrade);
    if (whisperBtn) {
      whisperBtn.addEventListener('click', () => {
        ZenAudio.tap();
        hintBox.classList.remove('hidden');
        hintBox.innerHTML = `<strong>💡 Whisper:</strong> ${esc(pgCh.hint)}`;
      });
    }
    if (revealBtn) {
      revealBtn.addEventListener('click', () => {
        ZenAudio.tap();
        input.value = pgCh.solution;
        _draftSql[ch.id] = pgCh.solution;
      });
    }
    if (starterBtn) {
      starterBtn.addEventListener('click', () => {
        ZenAudio.tap();
        input.value = pgCh.starter;
        _draftSql[ch.id] = pgCh.starter;
      });
    }
    if (studioBtn) {
      studioBtn.addEventListener('click', () => {
        ZenAudio.tap();
        openModal('studio');
      });
    }
  }

  /* ---------------- BEAT 4: REST & CRYSTALLIZE (KOAN) ---------------- */
  function renderBeat4Html(ch) {
    const isLast = state.currentChapterIdx >= ZenChapters.length - 1;
    const nextCh = isLast ? null : ZenChapters[state.currentChapterIdx + 1];
    return `
      <div class="koan-card">
        <div class="chapter-eyebrow">Chapter ${esc(ch.roman)} Mastered · Koan Inscribed</div>
        <blockquote class="koan-quote">“${esc(ch.koan)}”</blockquote>
        <p style="margin:0;max-width:46ch;color:var(--sepia);">${esc(ch.worldUpgrade)}</p>
        <div class="row" style="margin-top:8px;">
          ${nextCh
            ? `<button type="button" id="btn-next-chapter" class="btn-saffron">Enter Chapter ${esc(nextCh.roman)}: ${esc(nextCh.title)} →</button>`
            : `<button type="button" id="btn-finish-journal" class="btn-saffron">📖 Open Your Completed Field Journal</button>
               <button type="button" id="btn-finish-studio" class="btn-quiet">🐘 Explore All 13 Postgres Labs</button>`
          }
          <button type="button" id="btn-replay-chapter" class="btn-quiet">↺ Replay Chapter</button>
        </div>
      </div>
    `;
  }

  function wireBeat4(ch) {
    const body = $('#beat-body');
    const nextBtn = $('#btn-next-chapter', body);
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        ZenAudio.tap();
        openChapter(state.currentChapterIdx + 1, 1, true);
      });
    }
    const replayBtn = $('#btn-replay-chapter', body);
    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        ZenAudio.tap();
        setBeat(1, true);
      });
    }
    const jBtn = $('#btn-finish-journal', body);
    if (jBtn) jBtn.addEventListener('click', () => { ZenAudio.tap(); openModal('journal'); });
    const sBtn = $('#btn-finish-studio', body);
    if (sBtn) sBtn.addEventListener('click', () => { ZenAudio.tap(); openModal('studio'); });
  }

  /* ============================================================
     3 QUIET MODALS: WORLD MAP, FIELD JOURNAL, FULL SQL STUDIO
  ============================================================ */
  function closeAllModals() {
    $$('.modal-overlay').forEach(m => m.classList.add('hidden'));
  }

  function openModal(kind) {
    closeAllModals();
    ZenAudio.stopNarration();
    const modal = $(`#modal-${kind}`);
    if (!modal) return;
    modal.classList.remove('hidden');
    if (kind === 'map') renderMapModal();
    else if (kind === 'journal') renderJournalModal();
    else if (kind === 'studio') renderStudioModal();
  }

  function renderMapModal() {
    const body = $('#modal-map-body');
    if (!body) return;
    const done = masteredCount();
    body.innerHTML = `
      <div class="row-between">
        <span class="muted">${done} of 7 chapters awakened along the River of Data.</span>
        <label class="row" style="font-size:13px;cursor:pointer;">
          <input type="checkbox" id="chk-part-mist" ${state.partAllMist ? 'checked' : ''} style="accent-color:var(--saffron);" />
          <span>Part all mist (explore any chapter freely)</span>
        </label>
      </div>
      <div class="stack-sm">
        ${ZenChapters.map((ch, idx) => {
          const unlocked = isChapterUnlocked(idx);
          const isDone = !!state.mastered[ch.id];
          const isCurr = idx === state.currentChapterIdx;
          const badge = isDone ? '✓ Mastered' : (isCurr ? '● Current' : (unlocked ? '○ Ready' : '☁️ Mist'));
          return `
            <button type="button" class="chapter-list-item ${!unlocked ? 'mist' : ''} ${isCurr ? 'current' : ''}" data-jump-ch="${idx}" ${!unlocked ? 'disabled' : ''}>
              <div>
                <div style="font-weight:700;">Chapter ${esc(ch.roman)} · ${esc(ch.title)} <span class="muted" style="font-weight:400;">— ${esc(ch.subtitle)}</span></div>
                <div class="muted" style="font-size:11.5px;">${esc(ch.tech)}</div>
              </div>
              <span class="mono" style="font-size:12px;color:${isDone ? 'var(--sage)' : (isCurr ? 'var(--saffron)' : 'var(--muted)')};">${badge}</span>
            </button>
          `;
        }).join('')}
      </div>
      <div class="row-between" style="padding-top:8px;border-top:1px solid var(--border);">
        <span class="muted">Progress is saved privately in this browser.</span>
        <button type="button" id="btn-reset-journey" class="pill-btn" style="color:var(--warn);">↺ Reset Journey</button>
      </div>
    `;

    const chk = $('#chk-part-mist', body);
    if (chk) {
      chk.addEventListener('change', () => {
        ZenAudio.tap();
        state.partAllMist = chk.checked;
        saveState();
        renderMapModal();
      });
    }
    $$('[data-jump-ch]', body).forEach(btn => {
      btn.addEventListener('click', () => {
        ZenAudio.tap();
        const idx = Number(btn.dataset.jumpCh);
        closeAllModals();
        openChapter(idx, 1, false);
      });
    });
    const resetBtn = $('#btn-reset-journey', body);
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (!confirm('Return the River of Data to its quiet beginning? This clears local progress.')) return;
        state = { ...DEFAULT_STATE, soundEnabled: state.soundEnabled, dark: state.dark };
        _draftSql = {};
        _touchState = {};
        saveState();
        closeAllModals();
        openChapter(0, 1, false);
      });
    }
  }

  function renderJournalModal() {
    const body = $('#modal-journal-body');
    if (!body) return;
    const now = Date.now();
    const done = masteredCount();

    body.innerHTML = `
      <p class="muted" style="margin:0;">
        ${done === 0
          ? 'Your Field Journal is open and blank. Complete Chapter I to inscribe your first Koan.'
          : `${done} of 7 timeless data laws inscribed. Tap “Clear the Moss” anytime for a calm spaced-recall check.`}
      </p>
      <div class="stack-sm">
        ${ZenChapters.map((ch, idx) => {
          const isDone = !!state.mastered[ch.id];
          if (!isDone) {
            return `
              <div class="chapter-list-item mist" style="cursor:default;">
                <span>Chapter ${esc(ch.roman)} · ${esc(ch.title)}</span>
                <span class="muted">Waiting in the mist…</span>
              </div>
            `;
          }
          const age = now - (state.masteredAt[ch.id] || now);
          const mossy = age > MOSS_MS;
          return `
            <div class="koan-card" style="text-align:left;align-items:stretch;padding:16px 18px;gap:8px;">
              <div class="row-between">
                <span class="chapter-eyebrow">Chapter ${esc(ch.roman)} · ${esc(ch.title)}</span>
                <button type="button" class="pill-btn" data-practice-ch="${idx}">
                  ${mossy ? '🌿 Clear the Moss' : '↺ Practice Spell'}
                </button>
              </div>
              <p style="margin:0;font-family:var(--font-serif);font-style:italic;font-size:1.12rem;">“${esc(ch.koan)}”</p>
              <div class="muted">${esc(ch.tech)}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    $$('[data-practice-ch]', body).forEach(btn => {
      btn.addEventListener('click', () => {
        ZenAudio.tap();
        const idx = Number(btn.dataset.practiceCh);
        closeAllModals();
        openChapter(idx, 3, false);
      });
    });
  }

  /* ---------------- FULL POSTGRESQL 18 SQL STUDIO MODAL ---------------- */
  function renderStudioModal() {
    const body = $('#modal-studio-body');
    if (!body) return;
    const solvedCount = Object.keys(state.sqlSolved).filter(k => state.sqlSolved[k]).length;

    body.innerHTML = `
      <div class="row-between">
        <div class="row">
          <button type="button" class="pill-btn ${_studioSubTab === 'labs' ? 'btn-saffron' : ''}" data-studio-tab="labs">13 Graded Labs (${solvedCount}/13)</button>
          <button type="button" class="pill-btn ${_studioSubTab === 'scratch' ? 'btn-saffron' : ''}" data-studio-tab="scratch">Scratchpad &amp; Schema</button>
          <button type="button" class="pill-btn ${_studioSubTab === 'dialect' ? 'btn-saffron' : ''}" data-studio-tab="dialect">T-SQL ↔ PostgreSQL Map</button>
        </div>
        <span id="studio-pg-status" class="mono muted" style="font-size:11.5px;">
          ${PgLab.ready ? `● ${PgLab.version} live in browser` : '⏳ Waking PostgreSQL 18…'}
        </span>
      </div>
      <div id="studio-pane" class="stack-sm" style="gap:12px;"></div>
    `;

    $$('[data-studio-tab]', body).forEach(btn => {
      btn.addEventListener('click', () => {
        ZenAudio.tap();
        _studioSubTab = btn.dataset.studioTab;
        renderStudioModal();
      });
    });

    if (_studioSubTab === 'labs') renderStudioLabsPane($('#studio-pane', body));
    else if (_studioSubTab === 'scratch') renderStudioScratchPane($('#studio-pane', body));
    else renderStudioDialectPane($('#studio-pane', body));

    if (_studioSubTab !== 'dialect') ensurePgReady().catch(() => {});
  }

  function renderStudioLabsPane(pane) {
    const ch = PgLab.CHALLENGES.find(c => c.id === _studioLabId) || PgLab.CHALLENGES[0];
    const draft = _studioLabDrafts[ch.id] != null ? _studioLabDrafts[ch.id] : ch.starter;

    pane.innerHTML = `
      <div class="row" style="gap:6px;">
        ${PgLab.CHALLENGES.map((c, i) => {
          const solved = !!state.sqlSolved[c.id];
          const active = c.id === ch.id;
          return `<button type="button" class="pill-btn ${active ? 'btn-saffron' : ''}" data-lab-id="${esc(c.id)}" style="padding:4px 10px;font-size:11.5px;" title="${esc(c.level + ': ' + c.title)}">
            ${solved ? '✓ ' : ''}${i + 1}. ${esc(c.level.slice(0, 3))}
          </button>`;
        }).join('')}
      </div>
      <div class="zen-feedback" style="background:var(--surface-soft);">
        <div class="chapter-eyebrow" style="margin-bottom:2px;">${esc(ch.level)} · ${esc(ch.title)}</div>
        <div>${esc(ch.prompt)}</div>
      </div>
      <div class="sql-box">
        <div class="sql-bar">
          <span>PostgreSQL 18 Graded Sandbox (auto-rollback)</span>
          <span>Cmd / Ctrl + Enter to run</span>
        </div>
        <textarea id="studio-sql-input" class="zen-sql" spellcheck="false">${esc(draft)}</textarea>
      </div>
      <div class="row">
        <button type="button" id="studio-run-lab" class="btn-saffron">▶ Run &amp; Grade</button>
        <button type="button" id="studio-lab-hint" class="btn-quiet">💡 Hint</button>
        <button type="button" id="studio-lab-sol" class="btn-quiet">✓ Solution</button>
        <button type="button" id="studio-lab-reset" class="btn-quiet">↺ Starter</button>
      </div>
      <div id="studio-lab-fb" class="zen-feedback hidden"></div>
      <div id="studio-lab-plan" class="hidden"></div>
      <div id="studio-lab-res" class="hidden"></div>
    `;

    $$('[data-lab-id]', pane).forEach(btn => {
      btn.addEventListener('click', () => {
        ZenAudio.tap();
        _studioLabId = btn.dataset.labId;
        renderStudioModal();
      });
    });

    const input = $('#studio-sql-input', pane);
    const runBtn = $('#studio-run-lab', pane);
    const fb = $('#studio-lab-fb', pane);
    const planEl = $('#studio-lab-plan', pane);
    const resEl = $('#studio-lab-res', pane);

    input.addEventListener('input', () => { _studioLabDrafts[ch.id] = input.value; });
    input.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        runLab();
      }
    });

    async function runLab() {
      const sql = input.value.trim();
      if (!sql) return;
      runBtn.disabled = true;
      runBtn.textContent = 'Running…';
      fb.classList.remove('hidden', 'ok', 'warn');
      fb.textContent = 'Running on real PostgreSQL 18…';
      planEl.classList.add('hidden');
      resEl.classList.add('hidden');
      try {
        await ensurePgReady();
        const res = await PgLab.grade(ch, sql);
        fb.textContent = res.message;
        if (res.plan) {
          planEl.classList.remove('hidden');
          planEl.innerHTML = `<pre class="zen-code">${esc(res.plan)}</pre>`;
        }
        if (res.user && res.user.fields && res.user.fields.length) {
          resEl.classList.remove('hidden');
          resEl.innerHTML = renderResultTableHtml(res.user);
        }
        if (res.ok) {
          ZenAudio.chime(true);
          fb.classList.add('ok');
          state.sqlSolved[ch.id] = true;
          saveState();
          syncHeaderAndRiver();
          // Refresh pill checkmark without losing output
          const pill = $(`[data-lab-id="${ch.id}"]`, pane);
          if (pill && !pill.textContent.includes('✓')) pill.textContent = `✓ ${pill.textContent.trim()}`;
        } else {
          ZenAudio.woodblock();
          fb.classList.add('warn');
        }
      } catch (e) {
        ZenAudio.woodblock();
        fb.classList.add('warn');
        fb.textContent = e.message;
      } finally {
        runBtn.disabled = false;
        runBtn.textContent = '▶ Run & Grade';
      }
    }

    runBtn.addEventListener('click', runLab);
    $('#studio-lab-hint', pane).addEventListener('click', () => {
      ZenAudio.tap();
      fb.classList.remove('hidden', 'ok', 'warn');
      fb.innerHTML = `<strong>💡 Hint:</strong> ${esc(ch.hint)}`;
    });
    $('#studio-lab-sol', pane).addEventListener('click', () => {
      ZenAudio.tap();
      input.value = ch.solution;
      _studioLabDrafts[ch.id] = ch.solution;
    });
    $('#studio-lab-reset', pane).addEventListener('click', () => {
      ZenAudio.tap();
      input.value = ch.starter;
      _studioLabDrafts[ch.id] = ch.starter;
    });
  }

  function renderStudioScratchPane(pane) {
    const snippets = [
      { label: 'Store Revenue', sql: `SELECT s.store_id, st.store_name, COUNT(*) AS txns, SUM(s.net_amount) AS revenue\nFROM stg_pos_sales s\nJOIN dim_store st ON st.store_id = s.store_id\nGROUP BY s.store_id, st.store_name\nORDER BY revenue DESC;` },
      { label: 'Partition EXPLAIN', sql: PgLab.TRY_IT['pg-exp'].sql },
      { label: 'ROW_NUMBER Dedup', sql: PgLab.TRY_IT['pg-int'].sql },
      { label: 'Recursive BOM', sql: PgLab.CHALLENGES.find(c => c.id === 'pg13-bom').solution }
    ];

    pane.innerHTML = `
      <div class="row">
        ${snippets.map((s, i) => `<button type="button" class="pill-btn" data-snip="${i}">${esc(s.label)}</button>`).join('')}
        <button type="button" id="studio-reset-db" class="pill-btn" style="margin-left:auto;">↺ Reset Seed DB</button>
      </div>
      <div class="sql-box">
        <div class="sql-bar">
          <span>Freeform PostgreSQL 18 Scratchpad</span>
          <span>Cmd / Ctrl + Enter to execute</span>
        </div>
        <textarea id="studio-scratch-input" class="zen-sql" spellcheck="false">${esc(_studioScratchSql)}</textarea>
      </div>
      <div class="row">
        <button type="button" id="studio-run-scratch" class="btn-saffron">▶ Execute SQL</button>
        <span id="studio-scratch-ms" class="muted mono"></span>
      </div>
      <div id="studio-scratch-out" class="stack-sm"></div>
      <div style="border-top:1px solid var(--border);padding-top:10px;">
        <div class="chapter-eyebrow" style="margin-bottom:6px;">Live PostgreSQL Tables (click to preview)</div>
        <div id="studio-schema-list" class="stack-sm"><span class="muted">Loading schema…</span></div>
      </div>
    `;

    const input = $('#studio-scratch-input', pane);
    const runBtn = $('#studio-run-scratch', pane);
    const msEl = $('#studio-scratch-ms', pane);
    const outEl = $('#studio-scratch-out', pane);
    const schemaEl = $('#studio-schema-list', pane);

    input.addEventListener('input', () => { _studioScratchSql = input.value; });
    input.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        execScratch();
      }
    });

    $$('[data-snip]', pane).forEach(btn => {
      btn.addEventListener('click', () => {
        ZenAudio.tap();
        const s = snippets[Number(btn.dataset.snip)];
        input.value = s.sql;
        _studioScratchSql = s.sql;
      });
    });

    async function execScratch() {
      const sql = input.value.trim();
      if (!sql) return;
      runBtn.disabled = true;
      outEl.innerHTML = `<div class="zen-feedback">Running…</div>`;
      try {
        await ensurePgReady();
        const { results, ms } = await PgLab.run(sql);
        msEl.textContent = `${ms.toFixed(1)} ms`;
        const blocks = results.map(r => {
          if (r.fields && r.fields.length) return renderResultTableHtml(r);
          return `<div class="zen-feedback ok">✓ Statement executed (${r.affectedRows || 0} rows affected)</div>`;
        }).join('');
        outEl.innerHTML = blocks || `<div class="zen-feedback ok">✓ Done</div>`;
        ZenAudio.tap();
        loadSchema();
      } catch (e) {
        ZenAudio.woodblock();
        outEl.innerHTML = `<div class="zen-feedback warn">PostgreSQL error: ${esc(e.message)}</div>`;
      } finally {
        runBtn.disabled = false;
      }
    }

    async function loadSchema() {
      try {
        await ensurePgReady();
        const rows = await PgLab.schema();
        schemaEl.innerHTML = rows.map(r => `
          <button type="button" class="chapter-list-item" data-preview-tbl="${esc(r.table_name)}" style="padding:9px 12px;">
            <div>
              <strong class="mono" style="font-size:12.5px;">${esc(r.table_name)}</strong>
              ${r.partitioned ? '<span class="muted"> · 12 monthly partitions</span>' : ''}
              <div class="muted mono" style="font-size:11px;white-space:normal;">${esc(r.cols)}</div>
            </div>
            <span class="muted">Preview →</span>
          </button>
        `).join('');
        $$('[data-preview-tbl]', schemaEl).forEach(b => {
          b.addEventListener('click', () => {
            ZenAudio.tap();
            input.value = `SELECT * FROM ${b.dataset.previewTbl} LIMIT 12;`;
            _studioScratchSql = input.value;
            execScratch();
          });
        });
      } catch (e) {
        schemaEl.innerHTML = `<span class="muted">${esc(e.message)}</span>`;
      }
    }

    runBtn.addEventListener('click', execScratch);
    $('#studio-reset-db', pane).addEventListener('click', async () => {
      ZenAudio.tap();
      outEl.innerHTML = `<div class="zen-feedback">Resetting PostgreSQL seed database…</div>`;
      await ensurePgReady();
      await PgLab.reset();
      outEl.innerHTML = `<div class="zen-feedback ok">✓ Seed tables restored to pristine state.</div>`;
      loadSchema();
    });

    loadSchema();
  }

  function renderStudioDialectPane(pane) {
    const map = (window.DataLabSQL && DataLabSQL.DIALECT_MAP) ? DataLabSQL.DIALECT_MAP : [];
    pane.innerHTML = `
      <p class="muted" style="margin:0;">10 essential patterns for translating smoothly between SQL Server (T-SQL) and PostgreSQL.</p>
      <div class="table-wrap">
        <table class="zen-table">
          <thead>
            <tr>
              <th>Pattern</th>
              <th>SQL Server (T-SQL)</th>
              <th>PostgreSQL</th>
              <th>Why</th>
            </tr>
          </thead>
          <tbody>
            ${map.map(row => `
              <tr>
                <td style="font-family:var(--font);font-weight:600;color:var(--sepia);">${esc(row.topic)}</td>
                <td style="white-space:normal;">${esc(row.tsql)}</td>
                <td style="white-space:normal;color:var(--sage);">${esc(row.pg)}</td>
                <td style="font-family:var(--font);white-space:normal;color:var(--muted);">${esc(row.note)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /* ============================================================
     DEEP LINKS & BOOTSTRAP
  ============================================================ */
  function applyUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const chParam = params.get('ch');
    const viewParam = params.get('view');
    const legacyTab = params.get('tab');

    if (chParam) {
      const n = parseInt(chParam, 10);
      if (n >= 1 && n <= ZenChapters.length) {
        state.currentChapterIdx = n - 1;
        state.currentBeat = 1;
      }
    } else if (legacyTab === 'pg') {
      state.currentChapterIdx = 5; // Ch VI Effortless Speed
      state.currentBeat = 1;
    } else if (legacyTab === 'recon') {
      state.currentChapterIdx = 6; // Ch VII The Mirror
      state.currentBeat = 1;
    }

    if (viewParam === 'studio' || legacyTab === 'sql') {
      setTimeout(() => openModal('studio'), 60);
    } else if (viewParam === 'journal') {
      setTimeout(() => openModal('journal'), 60);
    } else if (viewParam === 'map' || legacyTab === 'academy') {
      setTimeout(() => openModal('map'), 60);
    }
  }

  function init() {
    document.addEventListener('pointerdown', () => { _hasInteracted = true; }, { once: true });

    applyTheme();
    applySoundSetting();
    applyUrlParams();

    // Mount living River panorama immediately
    ZenWorld.mount($('#zen-river-canvas'), null);
    syncHeaderAndRiver();
    renderStage(false);

    // Header actions
    const mapBtn = $('#btn-map');
    const journalBtn = $('#btn-journal');
    const studioBtn = $('#btn-studio');
    const soundBtn = $('#btn-sound');
    const themeBtn = $('#btn-theme');

    if (mapBtn) mapBtn.addEventListener('click', () => { ZenAudio.tap(); openModal('map'); });
    if (journalBtn) journalBtn.addEventListener('click', () => { ZenAudio.tap(); openModal('journal'); });
    if (studioBtn) studioBtn.addEventListener('click', () => { ZenAudio.tap(); openModal('studio'); });
    if (soundBtn) soundBtn.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      applySoundSetting();
      saveState();
      if (state.soundEnabled) ZenAudio.tap();
    });
    if (themeBtn) themeBtn.addEventListener('click', () => {
      state.dark = !state.dark;
      applyTheme();
      saveState();
      ZenAudio.tap();
    });

    // Modal close buttons & backdrop clicks
    $$('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => { ZenAudio.tap(); closeAllModals(); });
    });
    $$('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', e => {
        if (e.target === overlay) closeAllModals();
      });
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeAllModals();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
