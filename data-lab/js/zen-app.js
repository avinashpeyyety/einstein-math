/* Data Lab — Calm, Single-Focus Interactive Learning Engine (9 Lessons + Real PostgreSQL 18 WASM)
 * Design spirit: effortless progressive flow, generous negative space, visual intuition before syntax,
 * live input table previews, clickable SQL building blocks, and instant real database feedback.
 */
(() => {
  'use strict';

  const STORAGE_KEY = 'einstein-datalab-v2';
  const LEGACY_KEY = 'einstein-zen-river-v1';
  const REVIEW_MS = 24 * 60 * 60 * 1000;

  /* Exact snapshots of the seeded PostgreSQL 18 tables (formatted like SQL NUMERIC(10,2) & BOOLEAN) */
  const TABLE_SNAPSHOTS = {
    dim_product: {
      cols: ['product_sk', 'sku_code', 'category', 'unit_price', 'is_active'],
      rows: [
        [101, 'A-9042', 'Apparel',          '24.99',  'TRUE'],
        [102, 'A-9042', 'Apparel (Legacy)', '22.99',  'FALSE'],
        [103, 'B-2210', 'Footwear',         '120.00', 'TRUE'],
        [104, 'C-5501', 'Accessories',      '45.00',  'TRUE'],
        [105, 'D-7310', 'Home',             '12.25',  'TRUE'],
        [106, 'E-1180', 'Apparel',          '29.00',  'TRUE'],
        [107, 'F-6620', 'Home',             '15.75',  'TRUE'],
        [108, 'G-4400', 'Footwear',         '89.50',  'TRUE'],
        [109, 'H-3030', 'Accessories',      '64.00',  'FALSE']
      ]
    },
    stg_pos_sales: {
      cols: ['txn_id', 'store_id', 'sku', 'qty', 'net_amount'],
      rows: [
        ['T-1001', 12, 'A-9042', 2,  '49.98'],
        ['T-1002', 12, 'B-2210', 1, '120.00'],
        ['T-1003', 12, 'C-5501', 1,  '45.00'],
        ['T-1004', 12, 'D-7310', 3,  '36.75'],
        ['T-1005', 19, 'Z-9999', 3,  '75.00'],
        ['T-1006', 19, 'A-9042', 1,  '24.99'],
        ['T-1007', 19, 'E-1180', 2,  '58.00'],
        ['T-1008', 24, 'C-5501', 4, '180.00'],
        ['T-1009', 24, 'B-2210', 1, '120.00'],
        ['T-1010', 24, 'F-6620', 2,  '31.50'],
        ['T-1011',  7, 'A-9042', 1,  '24.99'],
        ['T-1012',  7, 'Z-9999', 1,  '19.95'],
        ['T-1013', 31, 'D-7310', 2,  '24.50'],
        ['T-1014', 31, 'E-1180', 1,  '29.00']
      ]
    },
    stg_work_orders: {
      cols: ['wo_id', 'split_seq', 'plant', 'planned_qty', 'good_qty', 'scrap_qty', 'status'],
      rows: [
        ['WO-8821', 1, 'Plant-2', 500, 280,   12, 'CLOSED'],
        ['WO-8821', 2, 'Plant-2', 500, 205,    3, 'CLOSED'],
        ['WO-8822', 1, 'Plant-1', 300, 294, null, 'CLOSED'],
        ['WO-8823', 1, 'Plant-2', 400, 390,   10, 'OPEN'],
        ['WO-8824', 1, 'Plant-1', 250, 241, null, 'CLOSED'],
        ['WO-8825', 1, 'Plant-1', 600, 575,   18, 'CLOSED']
      ]
    },
    pos_eod_summary: {
      cols: ['store_id', 'biz_date', 'pos_eod_total'],
      rows: [
        [7,  '2021-11-14',  '24.99'],
        [7,  '2021-11-15',  '19.95'],
        [12, '2021-11-14', '214.98'],
        [12, '2021-11-15',  '36.75'],
        [19, '2021-11-14', '124.99'],
        [19, '2021-11-15',  '58.00'],
        [24, '2021-11-14', '180.00'],
        [24, '2021-11-15', '151.50'],
        [31, '2021-11-14',  '24.50'],
        [31, '2021-11-15',  '29.00']
      ]
    },
    fact_shop_floor_events: {
      cols: ['event_id', 'plant_id', 'machine_id', 'event_ts (partition key)', 'downtime_sec'],
      rows: [
        [1,     2,  2, '2022-01-01 00:00:00+00', 37],
        [9800,  1, 21, '2022-03-01 00:12:30+00', 220],
        [14750, 2, 11, '2022-03-31 23:40:00+00', 515],
        ['…', '…', '…', '60,000 rows across 12 monthly partitions (2022_01 .. 2022_12)', '…']
      ]
    },
    stg_vendor_products: {
      cols: ['sku', 'category', 'unit_price', 'updated_at'],
      rows: [
        ['A-9042', 'Apparel',     '23.99',  '2021-10-01 09:00+00'],
        ['A-9042', 'Apparel',     '24.99',  '2021-11-10 09:00+00'],
        ['B-2210', 'Footwear',    '115.00', '2021-09-15 09:00+00'],
        ['B-2210', 'Footwear',    '120.00', '2021-11-01 09:00+00'],
        ['B-2210', 'Footwear',    '118.00', '2021-10-01 09:00+00'],
        ['C-5501', 'Accessories', '45.00',  '2021-10-15 09:00+00'],
        ['D-7310', 'Home',        '12.25',  '2021-11-05 09:00+00'],
        ['D-7310', 'Home',        '11.50',  '2021-08-20 09:00+00']
      ]
    },
    dim_product_scd2: {
      cols: ['version_id', 'sku_code', 'unit_price', 'valid_from', 'valid_to', 'is_current'],
      rows: [
        [1, 'A-9042', '22.99',  '2021-01-01', '2021-11-14', 'FALSE'],
        [2, 'A-9042', '24.99',  '2021-11-15', '9999-12-31', 'TRUE'],
        [3, 'B-2210', '115.00', '2021-01-01', '2021-11-14', 'FALSE'],
        [4, 'B-2210', '120.00', '2021-11-15', '9999-12-31', 'TRUE'],
        [5, 'C-5501', '45.00',  '2021-01-01', '9999-12-31', 'TRUE']
      ]
    },
    bom: {
      cols: ['parent_part', 'child_part', 'qty_per'],
      rows: [
        ['PUMP-100',  'HOUSING-5', '1.00'],
        ['PUMP-100',  'MOTOR-20',  '1.00'],
        ['PUMP-100',  'BOLT-M8',   '8.00'],
        ['MOTOR-20',  'ROTOR-3',   '1.00'],
        ['MOTOR-20',  'BOLT-M8',   '4.00'],
        ['MOTOR-20',  'WIRE-1M',   '2.00'],
        ['HOUSING-5', 'GASKET-2',  '2.00'],
        ['HOUSING-5', 'BOLT-M8',   '6.00'],
        ['HOUSING-5', 'BRACKET-9', '2.00'],
        ['BRACKET-9', 'BOLT-M8',   '2.00']
      ]
    },
    raw_webhook_orders: {
      cols: ['event_id', 'payload (JSONB)'],
      rows: [
        ['WH-01', '{"order_id":"ORD-501","customer":{"tier":"gold"},"items":[{"sku":"A-9042","qty":2,"price":24.99},{"sku":"C-5501","qty":1,"price":45.00}]}'],
        ['WH-02', '{"order_id":"ORD-502","customer":{"tier":"silver"},"items":[{"sku":"B-2210","qty":1,"price":120.00}]}'],
        ['WH-03', '{"order_id":"ORD-503","customer":{"tier":"gold"},"items":[{"sku":"A-9042","qty":1,"price":24.99},{"sku":"G-4400","qty":2,"price":89.50}]}']
      ]
    }
  };

  const DEFAULT_STATE = {
    currentChapterIdx: 0,
    currentBeat: 1,
    mastered: {},
    masteredAt: {},
    sqlSolved: {},
    unlockAll: false,
    soundEnabled: true,
    dark: false
  };

  let state = loadState();
  let _hasInteracted = false;
  let _pgBootPromise = null;
  let _draftSql = {};
  let _touchState = {};
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
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_STATE,
          ...parsed,
          mastered: { ...(parsed.mastered || {}) },
          masteredAt: { ...(parsed.masteredAt || {}) },
          sqlSolved: { ...(parsed.sqlSolved || {}) }
        };
      }
      // Migrate preferences & solved SQL labs gently from v1 if present
      const legacyRaw = localStorage.getItem(LEGACY_KEY);
      if (legacyRaw) {
        const old = JSON.parse(legacyRaw);
        return {
          ...DEFAULT_STATE,
          sqlSolved: { ...(old.sqlSolved || {}) },
          soundEnabled: old.soundEnabled !== undefined ? !!old.soundEnabled : true,
          dark: !!old.dark
        };
      }
      return { ...DEFAULT_STATE };
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
    if (idx <= 0 || idx === 9) return true; // Lesson 1 (Track 1) and Lesson 10 (Track 2) always open
    if (state.unlockAll) return true;
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
    syncHeaderAndPipeline();
    const stages = ZenWorld.activeStages();
    const localIdx = Math.max(0, stages.findIndex(s => s.id === ch.id));
    const xFrac = localIdx / Math.max(1, stages.length - 1);
    ZenWorld.ripple(xFrac);
    if (!wasMastered) {
      setTimeout(() => ZenWorld.ripple(xFrac), 300);
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
      updatePgStatusBadges('⏳ Starting PostgreSQL 18 (WASM)…', false);
      _pgBootPromise = (async () => {
        const pgliteUrl = new URL('../vendor/pglite/index.js', window.location.href).href;
        const mod = await import(pgliteUrl);
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
     THEME, SOUND & PIPELINE HEADER SYNC
  ============================================================ */
  function applyTheme() {
    document.documentElement.classList.toggle('dark', !!state.dark);
    const btn = $('#btn-theme');
    if (btn) {
      btn.textContent = state.dark ? '☀️' : '🌙';
      btn.title = state.dark ? 'Switch to Warm Paper theme' : 'Switch to Night theme';
    }
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', state.dark ? '#16131E' : '#F4EEDF');
  }

  function applySoundSetting() {
    ZenAudio.enabled = !!state.soundEnabled;
    if (!state.soundEnabled) ZenAudio.stopNarration();
    const btn = $('#btn-journal');
    if (btn) btn.textContent = `📝 Takeaways (${masteredCount()}/${ZenChapters.length})`;
    const sBtn = $('#btn-sound');
    if (sBtn) sBtn.textContent = state.soundEnabled ? '🔊 Voice' : '🔇 Muted';
  }

  function syncHeaderAndPipeline() {
    const ch = getChapter();
    const track = ch.track || (ch.num >= 10 ? 2 : 1);
    ZenWorld.setMastered(state.mastered, ch.num, track);
    const done = masteredCount();
    const total = ZenChapters.length;

    const journalBtn = $('#btn-journal');
    if (journalBtn) journalBtn.textContent = `📝 Takeaways (${done}/${total})`;

    // Sync track switcher pills
    $$('[data-track-switch]').forEach(btn => {
      btn.classList.toggle('active', Number(btn.dataset.trackSwitch) === track);
    });

    const trackChapters = ZenChapters.filter(c => (c.track || 1) === track);
    const trackDone = trackChapters.filter(c => state.mastered[c.id]).length;

    const statusEl = $('#river-status');
    const rightEl = $('#river-right');
    if (statusEl) {
      if (trackDone === 0) {
        statusEl.textContent = `Track ${track}: 0/${trackChapters.length} stages · Start with Lesson ${trackChapters[0].num}.`;
      } else if (trackDone === trackChapters.length) {
        statusEl.textContent = `Track ${track} complete (${trackDone}/${trackChapters.length})!`;
      } else {
        const names = trackChapters.filter(c => state.mastered[c.id]).map(c => c.stageLabel);
        statusEl.textContent = `Track ${track}: ${trackDone}/${trackChapters.length} active · ${names.join(' → ')}`;
      }
    }
    if (rightEl) {
      const solvedSql = Object.keys(state.sqlSolved).filter(k => state.sqlSolved[k]).length;
      rightEl.textContent = `Postgres 18 Labs: ${solvedSql}/${PgLab.CHALLENGES.length}`;
    }
  }

  /* ============================================================
     NAVIGATION: LESSONS & 4-STEP FOCUS FLOW
  ============================================================ */
  function openChapter(idx, beat = 1, autoPlay = false) {
    const safeIdx = Math.max(0, Math.min(ZenChapters.length - 1, idx));
    ZenAudio.stopNarration();
    state.currentChapterIdx = safeIdx;
    state.currentBeat = beat;
    saveState();
    renderStage(autoPlay);
    syncHeaderAndPipeline();
  }

  function setBeat(beat, autoPlay = false) {
    const ch = getChapter();
    if (beat === 4 && !state.mastered[ch.id]) {
      ZenAudio.woodblock();
      return;
    }
    ZenAudio.stopNarration();
    state.currentBeat = beat;
    saveState();
    renderStage(autoPlay);
  }

  /* ============================================================
     STAGE RENDERER (ONE FOCUSED STEP AT A TIME)
  ============================================================ */
  function renderStage(autoPlay = false) {
    const stage = $('#focus-stage');
    if (!stage) return;
    const ch = getChapter();
    const beat = state.currentBeat;
    const mastered = !!state.mastered[ch.id];

    const stepMeta = [
      { n: 1, label: '1. Watch' },
      { n: 2, label: '2. Explore' },
      { n: 3, label: '3. Practice' },
      { n: 4, label: '4. Takeaway' }
    ];

    const stepperHtml = stepMeta.map(b => {
      const cls = b.n === beat ? 'active' : (b.n < beat || mastered ? 'done' : '');
      const locked = b.n === 4 && !mastered;
      return `<button type="button" class="beat-dot ${cls}" data-beat="${b.n}" ${locked ? 'disabled title="Complete Step 3 (Practice) to unlock the summary"' : ''}>${b.label}</button>`;
    }).join('');

    let bodyHtml = '';
    if (beat === 1) bodyHtml = renderBeat1Html(ch);
    else if (beat === 2) bodyHtml = renderBeat2Html(ch);
    else if (beat === 3) bodyHtml = renderBeat3Html(ch);
    else bodyHtml = renderBeat4Html(ch);

    stage.innerHTML = `
      <div class="chapter-top">
        <div>
          <div class="chapter-eyebrow">Lesson ${ch.num} of ${ZenChapters.length} · ${esc(ch.level)} · ${esc(ch.tech)}</div>
          <h2 class="chapter-title">${esc(ch.title)}</h2>
          <p class="chapter-sub">${esc(ch.subtitle)}</p>
        </div>
        <div class="beat-dots" role="tablist" aria-label="Lesson steps">${stepperHtml}</div>
      </div>
      <div id="beat-body" class="stack-sm" style="gap:16px;">${bodyHtml}</div>
    `;

    $$('.beat-dot', stage).forEach(btn => {
      btn.addEventListener('click', () => {
        const n = Number(btn.dataset.beat);
        if (!Number.isFinite(n)) return;
        ZenAudio.tap();
        setBeat(n, false);
      });
    });

    if (beat === 1) wireBeat1(ch, autoPlay);
    else if (beat === 2) wireBeat2(ch);
    else if (beat === 3) wireBeat3(ch);
    else wireBeat4(ch);
  }

  /* ---------------- STEP 1: WATCH & LISTEN ---------------- */
  function renderBeat1Html(ch) {
    const firstCaption = (ch.cues && ch.cues[0]) ? ch.cues[0].caption : ch.narration;
    const secs = ch.durationSec || 17;
    return `
      <div class="koan-stage-wrap">
        <div id="koan-canvas-box" class="koan-canvas-box" title="Click to play visual explanation">
          <canvas id="koan-stage-canvas" aria-label="Visual diagram for ${esc(ch.title)}"></canvas>
          <span id="koan-play-overlay" class="koan-play-overlay">▶ Click to play (${secs}s)</span>
        </div>
        <div class="progress-hairline"><div id="koan-progress-fill" class="progress-hairline-fill"></div></div>
        <div id="koan-subtitle" class="koan-subtitle-bar">${esc(firstCaption)}</div>
      </div>
      <div class="row-between">
        <div class="row">
          <button type="button" id="btn-play-koan" class="btn-quiet">▶ Play Explanation (${secs}s)</button>
          <span id="koan-time-hint" class="muted">~2 min · Real PostgreSQL 18 in browser</span>
        </div>
        <button type="button" id="btn-to-beat2" class="btn-saffron">Explore Visually →</button>
      </div>
    `;
  }

  function wireBeat1(ch, autoPlay) {
    const riverCanvas = $('#zen-river-canvas');
    const koanCanvas = $('#koan-stage-canvas');
    ZenWorld.mount(riverCanvas, koanCanvas);
    ZenWorld.setKoanState(ch.num, 0.05, ch.cues[0] ? ch.cues[0].scene : 'table');

    const playBtn = $('#btn-play-koan');
    const canvasBox = $('#koan-canvas-box');
    const overlay = $('#koan-play-overlay');
    const fill = $('#koan-progress-fill');
    const sub = $('#koan-subtitle');
    const hint = $('#koan-time-hint');

    const startPlayback = () => {
      if (playBtn) playBtn.textContent = '↺ Replay Explanation';
      if (overlay) overlay.classList.add('playing');
      if (hint) hint.textContent = state.soundEnabled ? 'Playing walkthrough…' : 'Running silent visual walkthrough…';

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
          ZenWorld.setKoanState(ch.num, pct, activeCue ? activeCue.scene : 'table');
          if (sub && activeCue) sub.textContent = activeCue.caption;
        },
        () => {
          if (fill) fill.style.width = '100%';
          ZenWorld.setKoanState(ch.num, 1, ch.cues[ch.cues.length - 1].scene);
          if (overlay) {
            overlay.textContent = '↺ Replay';
            overlay.classList.remove('playing');
          }
          if (hint) hint.textContent = 'Done — ready to explore interactively.';
        }
      );
    };

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        ZenAudio.tap();
        startPlayback();
      });
    }
    if (canvasBox) {
      canvasBox.addEventListener('click', () => {
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

    if (autoPlay && _hasInteracted) startPlayback();
  }

  /* ---------------- STEP 2: EXPLORE VISUALLY ---------------- */
  function getTouchState(ch) {
    if (!_touchState[ch.id]) {
      if (ch.touch.type === 'filter-table') {
        _touchState[ch.id] = { activeOnly: false, over30: false, sortDesc: false };
      } else if (ch.touch.type === 'group-fold') {
        _touchState[ch.id] = { grouped: false, sorted: false };
      } else if (ch.touch.type === 'toggle') {
        _touchState[ch.id] = { on: false };
      } else if (ch.touch.type === 'sliders2') {
        _touchState[ch.id] = { enc: false, str: false, dedup: false };
      } else if (ch.touch.type === 'backfill') {
        _touchState[ch.id] = { copy: false, idx: false, par: false };
      } else if (ch.touch.type === 'dialect-flip') {
        _touchState[ch.id] = { side: 'both' };
      } else if (ch.touch.type === 'partitions') {
        _touchState[ch.id] = { sargable: false, month: 39 };
      } else if (ch.touch.type === 'window-slide') {
        _touchState[ch.id] = { mode: 'window' }; // 'group' | 'window'
      } else if (ch.touch.type === 'dedup-rank') {
        _touchState[ch.id] = { ranked: true, onlyLatest: false };
      } else if (ch.touch.type === 'scd2-timeline') {
        _touchState[ch.id] = { pointInTime: false };
      } else if (ch.touch.type === 'tz-shift') {
        _touchState[ch.id] = { local: false };
      } else if (ch.touch.type === 'bom-tree') {
        _touchState[ch.id] = { depth: 1 }; // 1 | 2 | 3
      } else if (ch.touch.type === 'jsonb-unnest') {
        _touchState[ch.id] = { flattened: false };
      }
    }
    return _touchState[ch.id];
  }

  function renderBeat2Html(ch) {
    const ts = getTouchState(ch);
    let inner = '';

    if (ch.touch.type === 'filter-table') {
      const baseRows = TABLE_SNAPSHOTS.dim_product.rows.map(r => ({
        sku_code: r[1], category: r[2], unit_price: Number(r[3]), priceStr: r[3], is_active: r[4] === 'TRUE'
      }));
      const keptMask = r => (!ts.activeOnly || r.is_active) && (!ts.over30 || r.unit_price > 30);
      const displayRows = baseRows.slice();
      if (ts.sortDesc) displayRows.sort((a, b) => b.unit_price - a.unit_price);
      const keptCount = displayRows.filter(keptMask).length;

      const whereParts = [];
      if (ts.activeOnly) whereParts.push('is_active');
      if (ts.over30) whereParts.push('unit_price > 30');
      const liveSql = [
        'SELECT sku_code, category, unit_price',
        'FROM dim_product',
        whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : null,
        ts.sortDesc ? 'ORDER BY unit_price DESC' : null
      ].filter(Boolean).join('\n') + ';';

      inner = `
        <div class="row">
          <button type="button" class="pill-btn ${ts.activeOnly ? 'btn-saffron' : ''}" data-ft="activeOnly"><span class="chip-mark">${ts.activeOnly ? '✓' : '+'}</span> Active Only</button>
          <button type="button" class="pill-btn ${ts.over30 ? 'btn-saffron' : ''}" data-ft="over30"><span class="chip-mark">${ts.over30 ? '✓' : '+'}</span> Price &gt; $30</button>
          <button type="button" class="pill-btn ${ts.sortDesc ? 'btn-saffron' : ''}" data-ft="sortDesc"><span class="chip-mark">${ts.sortDesc ? '✓' : '+'}</span> Sort Highest Price</button>
        </div>
        <div class="explore-split">
          <div class="table-wrap" style="max-height:245px;overflow-y:auto;">
            <table class="zen-table">
              <thead>
                <tr><th>sku_code</th><th>category</th><th>unit_price</th><th>is_active</th></tr>
              </thead>
              <tbody>
                ${displayRows.map(r => {
                  const kept = keptMask(r);
                  const cls = (ts.activeOnly || ts.over30) ? (kept ? 'row-kept' : 'row-excluded') : '';
                  return `<tr class="${cls}">
                    <td>${esc(r.sku_code)}</td>
                    <td>${esc(r.category)}</td>
                    <td>${esc(r.priceStr)}</td>
                    <td>${r.is_active ? 'TRUE' : 'FALSE'}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
          <div class="stack-sm" style="gap:6px;">
            <div class="row-between">
              <span class="muted"><strong>Matching SQL</strong></span>
              <span class="mono muted">${keptCount} of ${displayRows.length} rows</span>
            </div>
            <pre class="zen-code" style="min-height:112px;">${esc(liveSql)}</pre>
            <div class="muted" style="font-size:12px;">Notice how each button adds one SQL clause. Next, you'll run this on real PostgreSQL 18.</div>
          </div>
        </div>
      `;
    } else if (ch.touch.type === 'group-fold') {
      const raw = TABLE_SNAPSHOTS.stg_pos_sales.rows;
      let tableHtml = '';
      let liveSql = '';
      if (!ts.grouped) {
        liveSql = `SELECT txn_id, store_id, sku, net_amount\nFROM stg_pos_sales;\n-- 14 individual receipts`;
        tableHtml = `
          <div class="table-wrap" style="max-height:240px;overflow-y:auto;">
            <table class="zen-table">
              <thead><tr><th>txn_id</th><th>store_id</th><th>sku</th><th>net_amount</th></tr></thead>
              <tbody>
                ${raw.map(r => `<tr><td>${esc(r[0])}</td><td>Store ${r[1]}</td><td>${esc(r[2])}</td><td>${esc(r[4])}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
        `;
      } else {
        const byStore = {};
        raw.forEach(r => {
          const sid = r[1];
          if (!byStore[sid]) byStore[sid] = { store_id: sid, txn_count: 0, total_sales: 0 };
          byStore[sid].txn_count += 1;
          byStore[sid].total_sales += Number(r[4]);
        });
        let rows = Object.values(byStore);
        rows.sort((a, b) => ts.sorted ? b.total_sales - a.total_sales : a.store_id - b.store_id);
        liveSql = [
          'SELECT store_id,',
          '       COUNT(*) AS txn_count,',
          '       SUM(net_amount) AS total_sales',
          'FROM stg_pos_sales',
          'GROUP BY store_id',
          ts.sorted ? 'ORDER BY total_sales DESC' : null
        ].filter(Boolean).join('\n') + ';';
        tableHtml = `
          <div class="table-wrap">
            <table class="zen-table">
              <thead><tr><th>store_id</th><th>txn_count</th><th>total_sales</th></tr></thead>
              <tbody>
                ${rows.map(r => `<tr class="row-kept"><td>Store ${r.store_id}</td><td>${r.txn_count} txns</td><td>${r.total_sales.toFixed(2)}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
      inner = `
        <div class="row">
          <button type="button" class="pill-btn ${!ts.grouped ? 'btn-saffron' : ''}" data-gf="raw">14 Raw Receipts</button>
          <button type="button" class="pill-btn ${ts.grouped ? 'btn-saffron' : ''}" data-gf="grouped"><span class="chip-mark">${ts.grouped ? '✓' : '+'}</span> GROUP BY store_id (5 Stores)</button>
          ${ts.grouped ? `<button type="button" class="pill-btn ${ts.sorted ? 'btn-saffron' : ''}" data-gf="sort"><span class="chip-mark">${ts.sorted ? '✓' : '+'}</span> Sort Highest Sales</button>` : ''}
        </div>
        <div class="explore-split">
          ${tableHtml}
          <div class="stack-sm" style="gap:6px;">
            <span class="muted"><strong>Matching SQL</strong></span>
            <pre class="zen-code" style="min-height:118px;">${esc(liveSql)}</pre>
            <div class="muted" style="font-size:12px;">${ts.grouped ? '14 receipts collapsed into 5 store totals.' : 'Click GROUP BY store_id to fold receipts by store.'}</div>
          </div>
        </div>
      `;
    } else if (ch.touch.type === 'toggle') {
      const on = !!ts.on;
      const borderCol = on ? 'var(--sage)' : 'var(--warn)';
      inner = `
        <div class="touch-toggle-row">
          <button type="button" class="touch-choice ${!on ? 'selected' : ''}" data-toggle="off">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--warn);">Problem Pattern</div>
            <div>${esc(ch.touch.offLabel)}</div>
          </button>
          <button type="button" class="touch-choice ${on ? 'selected' : ''}" data-toggle="on">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--sage);">Safe Pattern</div>
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
            ${count === 3 ? '✓ All 3 Python safeguards enabled — ready for clean SQL loading.' : `${count}/3 safeguards active — click each option to test its effect.`}
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
            <span><strong>Throughput:</strong> ${throughput}</span>
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
          <button type="button" class="pill-btn ${side === 'both' ? 'btn-saffron' : ''}" data-side="both">Side-by-Side</button>
          <button type="button" class="pill-btn ${side === 'pg' ? 'btn-saffron' : ''}" data-side="pg">PostgreSQL</button>
        </div>
        <div class="table-wrap">
          <table class="zen-table">
            <thead>
              <tr>
                <th>Concept</th>
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
      const targetIdx = ts.month;
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
            <div style="font-size:11px;color:var(--warn);text-transform:uppercase;">Wrapped Column (Full Scan)</div>
            <div id="part-sql-off" class="mono" style="font-size:12px;">WHERE EXTRACT(MONTH FROM event_ts) = ${mo}</div>
          </button>
          <button type="button" class="touch-choice ${sarg ? 'selected' : ''}" data-sarg="on">
            <div style="font-size:11px;color:var(--sage);text-transform:uppercase;">Sargable Range Bounds</div>
            <div id="part-sql-on" class="mono" style="font-size:12px;">WHERE event_ts >= '${moStr}-01' AND event_ts &lt; '${nextMo}-01'</div>
          </button>
        </div>
        <div class="row-between">
          <label for="part-month-slider" class="muted">Target Month Partition: <strong id="part-month-label" class="mono" style="color:var(--ink);">${moStr}</strong></label>
          <input id="part-month-slider" type="range" min="1" max="72" value="${targetIdx}" style="flex:1;max-width:300px;accent-color:var(--saffron);" />
        </div>
        <div id="part-mini-grid" class="part-mini-grid">${gridCells}</div>
        <div id="part-readout" class="touch-readout" style="border-left-color:${sarg ? 'var(--sage)' : 'var(--warn)'};">
          ${sarg
            ? `✓ Partition Pruning Active: 1 of 72 monthly partitions read (${moStr}) · 98.6% skipped · ~1.4s`
            : `⚠ Full Table Scan: Wrapping event_ts in EXTRACT() blocks pruning → all 72 partitions scanned · ~21.4s`}
        </div>
      `;
    } else if (ch.touch.type === 'window-slide') {
      const isWin = ts.mode === 'window';
      const s12 = [
        { id: 'T-1001', ts: 'Nov 14 15:05', amt: 49.98, run: 49.98 },
        { id: 'T-1002', ts: 'Nov 14 18:40', amt: 120.00, run: 169.98 },
        { id: 'T-1003', ts: 'Nov 15 03:30', amt: 45.00, run: 214.98 },
        { id: 'T-1004', ts: 'Nov 15 16:10', amt: 36.75, run: 251.73 }
      ];
      const liveSql = isWin
        ? `SELECT txn_id, store_id, net_amount,\n       SUM(net_amount) OVER (\n         PARTITION BY store_id\n         ORDER BY txn_ts\n       ) AS running_total\nFROM stg_pos_sales\nORDER BY store_id, txn_ts;`
        : `SELECT store_id, SUM(net_amount) AS total\nFROM stg_pos_sales\nGROUP BY store_id;\n-- Collapses 4 transactions into 1 row!`;
      inner = `
        <div class="row">
          <button type="button" class="pill-btn ${!isWin ? 'btn-saffron' : ''}" data-win="group">GROUP BY (Collapses Rows)</button>
          <button type="button" class="pill-btn ${isWin ? 'btn-saffron' : ''}" data-win="window"><span class="chip-mark">${isWin ? '✓' : '+'}</span> SUM() OVER (Keeps All Rows)</button>
        </div>
        <div class="explore-split">
          <div class="table-wrap">
            <table class="zen-table">
              <thead><tr>${isWin ? '<th>txn_id</th><th>net_amount</th><th>running_total</th>' : '<th>store_id</th><th>total</th>'}</tr></thead>
              <tbody>
                ${isWin
                  ? s12.map(r => `<tr class="row-kept"><td>${r.id}</td><td>${r.amt.toFixed(2)}</td><td style="font-weight:700;">${r.run.toFixed(2)}</td></tr>`).join('')
                  : `<tr><td>Store 12</td><td style="font-weight:700;">251.73 (4 rows merged)</td></tr>`}
              </tbody>
            </table>
          </div>
          <div class="stack-sm" style="gap:6px;">
            <span class="muted"><strong>Matching SQL</strong></span>
            <pre class="zen-code">${esc(liveSql)}</pre>
          </div>
        </div>
      `;
    } else if (ch.touch.type === 'dedup-rank') {
      const rankedRows = [
        { sku: 'A-9042', price: '24.99',  dt: '2021-11-10', rn: 1 },
        { sku: 'A-9042', price: '23.99',  dt: '2021-10-01', rn: 2 },
        { sku: 'B-2210', price: '120.00', dt: '2021-11-01', rn: 1 },
        { sku: 'B-2210', price: '118.00', dt: '2021-10-01', rn: 2 },
        { sku: 'B-2210', price: '115.00', dt: '2021-09-15', rn: 3 },
        { sku: 'C-5501', price: '45.00',  dt: '2021-10-15', rn: 1 },
        { sku: 'D-7310', price: '12.25',  dt: '2021-11-05', rn: 1 },
        { sku: 'D-7310', price: '11.50',  dt: '2021-08-20', rn: 2 }
      ];
      const liveSql = `WITH ranked AS (\n  SELECT sku, category, unit_price,\n         ROW_NUMBER() OVER (\n           PARTITION BY sku\n           ORDER BY updated_at DESC\n         ) AS rn\n  FROM stg_vendor_products\n)\nSELECT sku, category, unit_price\nFROM ranked${ts.onlyLatest ? '\nWHERE rn = 1' : ''};`;
      inner = `
        <div class="row">
          <button type="button" class="pill-btn ${ts.ranked ? 'btn-saffron' : ''}" data-dedup="rank"><span class="chip-mark">${ts.ranked ? '✓' : '+'}</span> Add ROW_NUMBER() Rank</button>
          <button type="button" class="pill-btn ${ts.onlyLatest ? 'btn-saffron' : ''}" data-dedup="filter"><span class="chip-mark">${ts.onlyLatest ? '✓' : '+'}</span> Filter WHERE rn = 1</button>
        </div>
        <div class="explore-split">
          <div class="table-wrap" style="max-height:235px;overflow-y:auto;">
            <table class="zen-table">
              <thead><tr><th>sku</th><th>unit_price</th><th>updated_at</th>${ts.ranked ? '<th>rn</th>' : ''}</tr></thead>
              <tbody>
                ${rankedRows.map(r => {
                  const cls = ts.onlyLatest ? (r.rn === 1 ? 'row-kept' : 'row-excluded') : (ts.ranked && r.rn === 1 ? 'row-kept' : '');
                  return `<tr class="${cls}"><td>${r.sku}</td><td>${r.price}</td><td>${r.dt}</td>${ts.ranked ? `<td style="font-weight:700;">${r.rn}</td>` : ''}</tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
          <div class="stack-sm" style="gap:6px;">
            <span class="muted"><strong>Matching SQL</strong> (${ts.onlyLatest ? '4 unique SKUs kept' : '8 raw rows'})</span>
            <pre class="zen-code">${esc(liveSql)}</pre>
          </div>
        </div>
      `;
    } else if (ch.touch.type === 'scd2-timeline') {
      const pit = !!ts.pointInTime;
      const sample = [
        { txn: 'T-1001', sku: 'A-9042', date: '2021-11-14', cur: '24.99 (wrong!)', hist: '22.99 ✓' },
        { txn: 'T-1002', sku: 'B-2210', date: '2021-11-14', cur: '120.00 (wrong!)', hist: '115.00 ✓' },
        { txn: 'T-1009', sku: 'B-2210', date: '2021-11-15', cur: '120.00', hist: '120.00 ✓' }
      ];
      inner = `
        <div class="touch-toggle-row">
          <button type="button" class="touch-choice ${!pit ? 'selected' : ''}" data-scd="off">
            <div style="font-size:11px;color:var(--warn);text-transform:uppercase;">Rewrites History</div>
            <div class="mono" style="font-size:12px;">ON d.sku_code = s.sku AND d.is_current</div>
          </button>
          <button type="button" class="touch-choice ${pit ? 'selected' : ''}" data-scd="on">
            <div style="font-size:11px;color:var(--sage);text-transform:uppercase;">Point-in-Time SCD-2</div>
            <div class="mono" style="font-size:12px;">AND s.txn_ts::date BETWEEN d.valid_from AND d.valid_to</div>
          </button>
        </div>
        <div class="table-wrap">
          <table class="zen-table">
            <thead><tr><th>txn_id</th><th>sku</th><th>sale_date</th><th>matched unit_price</th></tr></thead>
            <tbody>
              ${sample.map(r => `<tr class="${pit ? 'row-kept' : ''}"><td>${r.txn}</td><td>${r.sku}</td><td>${r.date}</td><td style="color:${pit ? 'var(--sage)' : (r.cur.includes('wrong') ? 'var(--warn)' : 'inherit')};font-weight:700;">${pit ? r.hist : r.cur}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (ch.touch.type === 'tz-shift') {
      const local = !!ts.local;
      const sales = [
        { txn: 'T-1001', utc: '2021-11-14 15:05+00', utcDate: '2021-11-14', cstDate: '2021-11-14 (09:05 CST)', amt: '49.98', shifted: false },
        { txn: 'T-1002', utc: '2021-11-14 18:40+00', utcDate: '2021-11-14', cstDate: '2021-11-14 (12:40 CST)', amt: '120.00', shifted: false },
        { txn: 'T-1003', utc: '2021-11-15 03:30+00', utcDate: '2021-11-15 ⚠', cstDate: '2021-11-14 (21:30 CST) ✓', amt: '45.00', shifted: true },
        { txn: 'T-1004', utc: '2021-11-15 16:10+00', utcDate: '2021-11-15', cstDate: '2021-11-15 (10:10 CST)', amt: '36.75', shifted: false }
      ];
      inner = `
        <div class="row">
          <button type="button" class="pill-btn ${!local ? 'btn-saffron' : ''}" data-tz="utc">Raw UTC Date (txn_ts::date)</button>
          <button type="button" class="pill-btn ${local ? 'btn-saffron' : ''}" data-tz="local"><span class="chip-mark">${local ? '✓' : '+'}</span> America/Chicago Local Date</button>
        </div>
        <div class="table-wrap">
          <table class="zen-table">
            <thead><tr><th>txn_id</th><th>stored UTC</th><th>assigned biz_date</th><th>net_amount</th></tr></thead>
            <tbody>
              ${sales.map(r => `<tr class="${r.shifted ? (local ? 'row-kept' : '') : ''}"><td>${r.txn}</td><td>${r.utc}</td><td style="font-weight:${r.shifted ? 700 : 400};color:${r.shifted ? (local ? 'var(--sage)' : 'var(--warn)') : 'inherit'};">${local ? r.cstDate : r.utcDate}</td><td>${r.amt}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div class="touch-readout" style="border-left-color:${local ? 'var(--sage)' : 'var(--warn)'};">
          ${local
            ? '✓ Nov 14 Total = $214.98 | Nov 15 Total = $36.75 — Matches Dallas Store 12 EOD Register to the penny!'
            : '⚠ Nov 14 Total = $169.98 | Nov 15 Total = $81.75 — $45.00 evening sale T-1003 drifted into tomorrow!'}
        </div>
      `;
    } else if (ch.touch.type === 'bom-tree') {
      const d = ts.depth || 1;
      const levels = [
        { n: 1, label: 'Level 1 (Direct)', bolts: 8,  desc: 'PUMP-100 → 8 BOLT-M8 (misses sub-assemblies MOTOR-20 & HOUSING-5!)' },
        { n: 2, label: 'Level 2 (+ Sub-Assemblies)', bolts: 18, desc: '+4 bolts inside MOTOR-20, +6 bolts inside HOUSING-5 (still misses BRACKET-9!)' },
        { n: 3, label: 'Level 3 (Full Recursive Leaves)', bolts: 22, desc: '+2 BRACKET-9 × 2 bolts = +4 more → 22 BOLT-M8, 2 GASKET-2, 1 ROTOR-3, 2 WIRE-1M ✓' }
      ];
      const cur = levels[d - 1];
      inner = `
        <div class="row">
          ${levels.map(lv => `<button type="button" class="pill-btn ${d === lv.n ? 'btn-saffron' : ''}" data-bom="${lv.n}">${lv.label}</button>`).join('')}
        </div>
        <div class="touch-readout" style="border-left-color:${d === 3 ? 'var(--sage)' : 'var(--saffron)'};">
          <div class="row-between">
            <span><strong>Depth Explored:</strong> Level ${d} of 3</span>
            <span><strong>BOLT-M8 Counted:</strong> ${cur.bolts} of 22</span>
          </div>
          <div style="margin-top:6px;">${esc(cur.desc)}</div>
        </div>
      `;
    } else if (ch.touch.type === 'jsonb-unnest') {
      const flat = !!ts.flattened;
      const flatRows = [
        ['ORD-501', 'gold',   'A-9042', 2, '49.98'],
        ['ORD-501', 'gold',   'C-5501', 1, '45.00'],
        ['ORD-502', 'silver', 'B-2210', 1, '120.00'],
        ['ORD-503', 'gold',   'A-9042', 1, '24.99'],
        ['ORD-503', 'gold',   'G-4400', 2, '179.00']
      ];
      inner = `
        <div class="row">
          <button type="button" class="pill-btn ${!flat ? 'btn-saffron' : ''}" data-jb="raw">3 Nested JSONB Webhooks</button>
          <button type="button" class="pill-btn ${flat ? 'btn-saffron' : ''}" data-jb="flat"><span class="chip-mark">${flat ? '✓' : '+'}</span> Unnest via jsonb_array_elements (5 Rows)</button>
        </div>
        ${flat
          ? `<div class="table-wrap"><table class="zen-table"><thead><tr><th>order_id</th><th>tier</th><th>sku</th><th>qty</th><th>line_total</th></tr></thead><tbody>${flatRows.map(r => `<tr class="row-kept"><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td></tr>`).join('')}</tbody></table></div>`
          : `<pre class="zen-code">WH-01: {"order_id":"ORD-501","customer":{"tier":"gold"},"items":[{"sku":"A-9042","qty":2,"price":24.99},{"sku":"C-5501","qty":1,"price":45.00}]}\nWH-02: {"order_id":"ORD-502","customer":{"tier":"silver"},"items":[{"sku":"B-2210","qty":1,"price":120.00}]}\nWH-03: {"order_id":"ORD-503","customer":{"tier":"gold"},"items":[{"sku":"A-9042","qty":1,"price":24.99},{"sku":"G-4400","qty":2,"price":89.50}]}</pre>`
        }
      `;
    }

    return `
      <div class="touch-box">
        <div style="font-weight:600;color:var(--sepia);">${esc(ch.touch.prompt)}</div>
        ${inner}
      </div>
      <div class="row-between">
        <button type="button" id="btn-back-beat1" class="btn-quiet">← Back to Watch</button>
        <button type="button" id="btn-to-beat3" class="btn-saffron">Try It in Practice →</button>
      </div>
    `;
  }

  function wireBeat2(ch) {
    const ts = getTouchState(ch);
    const body = $('#beat-body');

    if (ch.touch.type === 'filter-table') {
      $$('[data-ft]', body).forEach(btn => {
        btn.addEventListener('click', () => {
          const key = btn.dataset.ft;
          ts[key] = !ts[key];
          (ts.activeOnly && ts.over30 && ts.sortDesc) ? ZenAudio.chime(false) : ZenAudio.tap();
          renderStage(false);
        });
      });
    } else if (ch.touch.type === 'group-fold') {
      $$('[data-gf]', body).forEach(btn => {
        btn.addEventListener('click', () => {
          const act = btn.dataset.gf;
          if (act === 'raw') { ts.grouped = false; ts.sorted = false; ZenAudio.tap(); }
          else if (act === 'grouped') { ts.grouped = true; ZenAudio.chime(false); }
          else if (act === 'sort') { ts.sorted = !ts.sorted; ZenAudio.tap(); }
          renderStage(false);
        });
      });
    } else if (ch.touch.type === 'toggle') {
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
          ch.touch.toggles.every(t => ts[t.id]) ? ZenAudio.chime(false) : ZenAudio.tap();
          renderStage(false);
        });
      });
    } else if (ch.touch.type === 'backfill') {
      $$('[data-valve]', body).forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.valve;
          ts[id] = !ts[id];
          ch.touch.toggles.every(t => ts[t.id]) ? ZenAudio.chime(false) : ZenAudio.tap();
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
              ? `✓ Partition Pruning Active: 1 of 72 monthly partitions read (${moStr}) · 98.6% skipped · ~1.4s`
              : `⚠ Full Table Scan: Wrapping event_ts in EXTRACT() blocks pruning → all 72 partitions scanned · ~21.4s`;
          }
          $$('#part-mini-grid .part-mini', body).forEach((cell, i) => {
            cell.classList.remove('open', 'scan');
            if (ts.sargable) { if (i + 1 === idx) cell.classList.add('open'); }
            else cell.classList.add('scan');
          });
        });
      }
    } else if (ch.touch.type === 'window-slide') {
      $$('[data-win]', body).forEach(btn => {
        btn.addEventListener('click', () => {
          ts.mode = btn.dataset.win;
          ts.mode === 'window' ? ZenAudio.chime(false) : ZenAudio.tap();
          renderStage(false);
        });
      });
    } else if (ch.touch.type === 'dedup-rank') {
      $$('[data-dedup]', body).forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.dataset.dedup === 'rank') ts.ranked = !ts.ranked;
          if (btn.dataset.dedup === 'filter') { ts.onlyLatest = !ts.onlyLatest; if (ts.onlyLatest) ts.ranked = true; }
          ts.onlyLatest ? ZenAudio.chime(false) : ZenAudio.tap();
          renderStage(false);
        });
      });
    } else if (ch.touch.type === 'scd2-timeline') {
      $$('[data-scd]', body).forEach(btn => {
        btn.addEventListener('click', () => {
          ts.pointInTime = btn.dataset.scd === 'on';
          ts.pointInTime ? ZenAudio.chime(false) : ZenAudio.tap();
          renderStage(false);
        });
      });
    } else if (ch.touch.type === 'tz-shift') {
      $$('[data-tz]', body).forEach(btn => {
        btn.addEventListener('click', () => {
          ts.local = btn.dataset.tz === 'local';
          ts.local ? ZenAudio.chime(false) : ZenAudio.tap();
          renderStage(false);
        });
      });
    } else if (ch.touch.type === 'bom-tree') {
      $$('[data-bom]', body).forEach(btn => {
        btn.addEventListener('click', () => {
          ts.depth = Number(btn.dataset.bom);
          ts.depth === 3 ? ZenAudio.chime(false) : ZenAudio.tap();
          renderStage(false);
        });
      });
    } else if (ch.touch.type === 'jsonb-unnest') {
      $$('[data-jb]', body).forEach(btn => {
        btn.addEventListener('click', () => {
          ts.flattened = btn.dataset.jb === 'flat';
          ts.flattened ? ZenAudio.chime(false) : ZenAudio.tap();
          renderStage(false);
        });
      });
    }

    const back = $('#btn-back-beat1', body);
    if (back) back.addEventListener('click', () => { ZenAudio.tap(); setBeat(1); });
    const next = $('#btn-to-beat3', body);
    if (next) next.addEventListener('click', () => { ZenAudio.tap(); setBeat(3); });
  }

  /* ---------------- STEP 3: PRACTICE (REAL PG18 OR PYTHON) ---------------- */
  function renderTablePeekHtml(tableName, autoOpen) {
    const snap = TABLE_SNAPSHOTS[tableName];
    if (!snap) return '';
    const tall = snap.rows.length > 9;
    return `
      <details class="peek-details" ${autoOpen ? 'open' : ''}>
        <summary>
          <span>👀 Input Table Preview: <code class="mono">${esc(tableName)}</code> (${snap.rows.length} rows)</span>
          <span class="muted" style="font-weight:400;">${tall ? 'Scrollable · click to toggle' : 'Click to toggle'}</span>
        </summary>
        <div class="table-wrap" style="${tall ? 'max-height:240px;overflow-y:auto;' : ''}">
          <table class="zen-table">
            <thead><tr>${snap.cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead>
            <tbody>
              ${snap.rows.map(r => `<tr>${r.map(v => `<td>${v === null ? '<span class="muted">NULL</span>' : esc(v)}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
        </div>
      </details>
    `;
  }

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
          ${mastered ? '✓ Completed! Leading zeros in string keys are preserved.' : ''}
        </div>
        <div class="row-between">
          <button type="button" id="btn-back-beat2" class="btn-quiet">← Back to Explore</button>
          <button type="button" id="btn-to-beat4" class="btn-saffron ${mastered ? '' : 'hidden'}">See Key Takeaway →</button>
        </div>
      `;
    }

    const pgCh = PgLab.CHALLENGES.find(c => c.id === ch.spell.pgChallengeId);
    const currentSql = _draftSql[ch.id] != null ? _draftSql[ch.id] : (mastered ? pgCh.solution : pgCh.starter);
    const pgStatusText = PgLab.ready ? `● ${PgLab.version} live in browser` : '⏳ Ready to run on PostgreSQL 18 (WASM)';
    const helpers = ch.spell.helpers || [];

    return `
      <p style="margin:0;color:var(--sepia);font-weight:500;">${esc(ch.spell.intro)}</p>
      <div class="zen-feedback" style="background:var(--surface-soft);">
        <strong>Goal:</strong> ${esc(pgCh.prompt)}
      </div>
      ${ch.spell.peekTable ? renderTablePeekHtml(ch.spell.peekTable, !!ch.spell.autoPeek) : ''}
      ${helpers.length ? `
        <div class="helper-bar">
          <span class="muted" style="font-weight:600;">SQL Building Blocks (click to insert):</span>
          ${helpers.map((h, i) => `<button type="button" class="helper-chip" data-helper-idx="${i}">+ ${esc(h.label)}</button>`).join('')}
        </div>
      ` : ''}
      <div class="sql-box">
        <div class="sql-bar">
          <span id="pg-status">${esc(pgStatusText)}</span>
          <span>Cmd / Ctrl + Enter to run</span>
        </div>
        <textarea id="zen-sql-input" class="zen-sql" spellcheck="false" aria-label="PostgreSQL 18 SQL editor">${esc(currentSql)}</textarea>
      </div>
      <div class="row-between">
        <div class="row">
          <button type="button" id="btn-run-spell" class="btn-saffron">▶ Run &amp; Check</button>
          <button type="button" id="btn-whisper" class="btn-quiet">💡 Hint</button>
          <button type="button" id="btn-reveal" class="btn-quiet">✓ Show Answer</button>
          <button type="button" id="btn-starter" class="btn-quiet">↺ Reset</button>
        </div>
        <button type="button" id="btn-to-beat4" class="btn-saffron ${mastered ? '' : 'hidden'}">See Key Takeaway →</button>
      </div>
      <div id="spell-hint" class="zen-feedback hidden"></div>
      <div id="spell-feedback" class="zen-feedback ${mastered ? 'ok' : 'hidden'}">
        ${mastered ? '✓ Verified on real PostgreSQL 18 — run again anytime to practice.' : ''}
      </div>
      <div id="spell-plan" class="hidden"></div>
      <div id="spell-results" class="hidden"></div>
      <div class="row-between" style="padding-top:4px;">
        <button type="button" id="btn-back-beat2" class="btn-quiet">← Back to Explore</button>
        <button type="button" id="btn-open-studio-inline" class="pill-btn">🐘 Open Full SQL Playground (All ${PgLab.CHALLENGES.length} Labs &amp; Schema)</button>
      </div>
    `;
  }

  /* Visual EXPLAIN Plan Tree Viewer — turns raw PostgreSQL EXPLAIN lines into scannable color-coded nodes */
  function renderExplainTreeHtml(planText) {
    if (!planText) return '';
    const lines = String(planText).split('\n').filter(l => l.trim());
    const parts = new Set(String(planText).match(/fact_shop_floor_events_\d{4}_\d{2}/g) || []);
    const partBanner = parts.size
      ? `<div class="muted" style="font-weight:600;color:${parts.size <= 1 ? 'var(--sage)' : 'var(--warn)'};margin-bottom:4px;">
          ${parts.size <= 1 ? `✓ Partition Pruning Active: only ${parts.size} partition scanned (11 pruned)` : `⚠ Scanning ${parts.size} of 12 partitions (make predicate sargable to prune)`}
         </div>`
      : '';
    const nodesHtml = lines.map(line => {
      const leadSpaces = (line.match(/^(\s*)/) || ['', ''])[1].length;
      const depth = Math.min(6, Math.floor(leadSpaces / 4));
      const clean = line.trim().replace(/^->\s*/, '');
      let badge = 'OP', cls = 'op';
      if (/Seq Scan/i.test(clean)) { badge = 'SEQ SCAN'; cls = 'seq'; }
      else if (/Index Only Scan/i.test(clean)) { badge = 'INDEX ONLY'; cls = 'idx'; }
      else if (/Bitmap|Index Scan/i.test(clean)) { badge = 'INDEX SCAN'; cls = 'idx'; }
      else if (/Hash|Merge|Nested Loop/i.test(clean)) { badge = 'JOIN'; cls = 'op'; }
      else if (/Aggregate|Group|Sort/i.test(clean)) { badge = 'AGG/SORT'; cls = 'op'; }
      else if (/Append/i.test(clean)) { badge = 'PARTITIONS'; cls = 'op'; }
      else if (/Filter:|Index Cond:|Planning Time:|Execution Time:/i.test(clean)) { badge = 'DETAIL'; cls = 'op'; }
      return `<div class="plan-node" style="margin-left:${depth * 16}px;">
        <span class="plan-badge ${cls}">${badge}</span>
        <span style="overflow-wrap:anywhere;">${esc(clean)}</span>
      </div>`;
    }).join('');
    return `
      <div class="stack-sm" style="gap:6px;">
        <div class="muted" style="font-weight:600;">Visual PostgreSQL 18 EXPLAIN Plan Tree:</div>
        <div class="plan-tree">${partBanner}${nodesHtml}</div>
        <details class="peek-details" style="padding:7px 12px;">
          <summary style="font-size:12px;">Raw EXPLAIN text</summary>
          <pre class="zen-code" style="margin-top:6px;">${esc(planText)}</pre>
        </details>
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

  function insertHelperIntoEditor(textarea, helper) {
    let val = textarea.value;
    if (helper.replaceAll) {
      textarea.value = helper.replaceAll;
      textarea.focus();
      return;
    }
    if (helper.find && val.includes(helper.find)) {
      val = val.replace(helper.find, helper.replace || '');
      if (helper.append) {
        const semiIdx = val.lastIndexOf(';');
        if (semiIdx !== -1) {
          val = val.slice(0, semiIdx).replace(/\s+$/, '') + helper.append + ';';
        } else {
          val = val.replace(/\s+$/, '') + helper.append + ';';
        }
      }
      textarea.value = val;
      textarea.focus();
      return;
    }
    const snippet = helper.insert || helper.replace || '';
    if (!snippet) return;
    if (helper.target === 'select') {
      const fromIdx = val.search(/\nFROM\b/i);
      if (fromIdx !== -1) {
        textarea.value = val.slice(0, fromIdx) + snippet + val.slice(fromIdx);
        textarea.focus();
        return;
      }
    }
    const commentMatch = val.match(/--[^\n]*/);
    if (commentMatch) {
      textarea.value = val.replace(/--[^\n]*/, snippet.trim());
      textarea.focus();
      return;
    }
    const semiIdx = val.lastIndexOf(';');
    if (semiIdx !== -1) {
      const before = val.slice(0, semiIdx).replace(/\s+$/, '');
      const sep = snippet.startsWith('\n') || snippet.startsWith(',') || snippet.startsWith(' ') ? '' : '\n';
      textarea.value = before + sep + snippet + ';';
      textarea.focus();
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    textarea.value = val.slice(0, start) + snippet + val.slice(end);
    textarea.selectionStart = textarea.selectionEnd = start + snippet.length;
    textarea.focus();
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

    ensurePgReady().catch(() => {});

    // Wire clickable SQL Building Block chips
    $$('[data-helper-idx]', body).forEach(btn => {
      btn.addEventListener('click', () => {
        const helper = (ch.spell.helpers || [])[Number(btn.dataset.helperIdx)];
        if (!helper || !input) return;
        ZenAudio.tap();
        insertHelperIntoEditor(input, helper);
        _draftSql[ch.id] = input.value;
      });
    });

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
      fb.textContent = 'Running query inside a safe rollback transaction…';
      planBox.classList.add('hidden');
      resBox.classList.add('hidden');

      try {
        await ensurePgReady();
        const res = await PgLab.grade(pgCh, sql);
        fb.classList.remove('ok', 'warn');
        fb.textContent = res.message;

        if (res.plan) {
          planBox.classList.remove('hidden');
          planBox.innerHTML = renderExplainTreeHtml(res.plan);
        }
        if (res.user && res.user.fields && res.user.fields.length) {
          resBox.classList.remove('hidden');
          resBox.innerHTML = `<div class="muted" style="margin-bottom:4px;">Query Result (${(res.user.rows || []).length} row${(res.user.rows || []).length === 1 ? '' : 's'}):</div>${renderResultTableHtml(res.user)}`;
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
        runBtn.textContent = '▶ Run & Check';
      }
    }

    if (runBtn) runBtn.addEventListener('click', runGrade);
    if (whisperBtn) {
      whisperBtn.addEventListener('click', () => {
        ZenAudio.tap();
        hintBox.classList.remove('hidden');
        hintBox.innerHTML = `<strong>💡 Hint:</strong> ${esc(pgCh.hint)}`;
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

  /* ---------------- STEP 4: KEY TAKEAWAY ---------------- */
  function renderBeat4Html(ch) {
    const isLast = state.currentChapterIdx >= ZenChapters.length - 1;
    const nextCh = isLast ? null : ZenChapters[state.currentChapterIdx + 1];
    return `
      <div class="koan-card">
        <div class="chapter-eyebrow">Lesson ${ch.num} Complete · Key Takeaway</div>
        <blockquote class="koan-quote" style="font-style:normal;">${esc(ch.koan)}</blockquote>
        <p style="margin:0;max-width:48ch;color:var(--sepia);">${esc(ch.worldUpgrade)}</p>
        <div class="row" style="margin-top:8px;">
          ${nextCh
            ? `<button type="button" id="btn-next-chapter" class="btn-saffron">Next: Lesson ${nextCh.num} — ${esc(nextCh.title)} →</button>`
            : `<button type="button" id="btn-finish-journal" class="btn-saffron">📝 Review All ${ZenChapters.length} Key Takeaways</button>
               <button type="button" id="btn-finish-studio" class="btn-quiet">🐘 Explore All ${PgLab.CHALLENGES.length} Postgres Labs</button>`
          }
          <button type="button" id="btn-replay-chapter" class="btn-quiet">↺ Replay Lesson</button>
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
     3 CLEAN MODALS: LESSONS, KEY TAKEAWAYS, SQL PLAYGROUND
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
    const tracks = window.ZenTracks || [
      { id: 1, name: 'Track 1 · Core SQL & Pipelines' },
      { id: 2, name: 'Track 2 · Analytical SQL & Modeling' }
    ];
    body.innerHTML = `
      <div class="row-between">
        <span class="muted">${done} of ${ZenChapters.length} lessons completed across ${tracks.length} tracks.</span>
        <label class="row" style="font-size:13px;cursor:pointer;">
          <input type="checkbox" id="chk-unlock-all" ${state.unlockAll ? 'checked' : ''} style="accent-color:var(--saffron);" />
          <span>Unlock all lessons (jump freely)</span>
        </label>
      </div>
      ${tracks.map(tr => {
        const list = ZenChapters.map((ch, idx) => ({ ch, idx })).filter(x => (x.ch.track || 1) === tr.id);
        return `
          <div class="stack-sm" style="gap:6px;">
            <div class="chapter-eyebrow" style="margin-top:4px;">${esc(tr.name)}</div>
            ${list.map(({ ch, idx }) => {
              const unlocked = isChapterUnlocked(idx);
              const isDone = !!state.mastered[ch.id];
              const isCurr = idx === state.currentChapterIdx;
              const badge = isDone ? '✓ Done' : (isCurr ? '● Active' : (unlocked ? '○ Ready' : '🔒 Locked'));
              return `
                <button type="button" class="chapter-list-item ${!unlocked ? 'mist' : ''} ${isCurr ? 'current' : ''}" data-jump-ch="${idx}" ${!unlocked ? 'disabled' : ''}>
                  <div>
                    <div style="font-weight:700;">Lesson ${ch.num} · ${esc(ch.title)} <span class="muted" style="font-weight:400;">— ${esc(ch.subtitle)}</span></div>
                    <div class="muted" style="font-size:11.5px;">${esc(ch.level)} · ${esc(ch.tech)}</div>
                  </div>
                  <span class="mono" style="font-size:12px;color:${isDone ? 'var(--sage)' : (isCurr ? 'var(--saffron)' : 'var(--muted)')};">${badge}</span>
                </button>
              `;
            }).join('')}
          </div>
        `;
      }).join('')}
      <div class="row-between" style="padding-top:8px;border-top:1px solid var(--border);">
        <span class="muted">Saved locally on this device — works offline.</span>
        <button type="button" id="btn-reset-journey" class="pill-btn" style="color:var(--warn);">↺ Reset Progress</button>
      </div>
    `;

    const chk = $('#chk-unlock-all', body);
    if (chk) {
      chk.addEventListener('change', () => {
        ZenAudio.tap();
        state.unlockAll = chk.checked;
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
        if (!confirm('Reset Data Lab lesson progress on this device?')) return;
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
          ? 'Complete Lesson 1 to save your first Key Takeaway here for quick review.'
          : `${done} of ${ZenChapters.length} core concepts saved. Tap “Quick Review” anytime to re-test yourself on real PostgreSQL 18.`}
      </p>
      <div class="stack-sm">
        ${ZenChapters.map((ch, idx) => {
          const isDone = !!state.mastered[ch.id];
          if (!isDone) {
            return `
              <div class="chapter-list-item mist" style="cursor:default;">
                <span>Lesson ${ch.num} · ${esc(ch.title)}</span>
                <span class="muted">Not completed yet</span>
              </div>
            `;
          }
          const age = now - (state.masteredAt[ch.id] || now);
          const due = age > REVIEW_MS;
          return `
            <div class="koan-card" style="text-align:left;align-items:stretch;padding:16px 18px;gap:8px;">
              <div class="row-between">
                <span class="chapter-eyebrow">Lesson ${ch.num} · ${esc(ch.title)}</span>
                <button type="button" class="pill-btn" data-practice-ch="${idx}">
                  ${due ? '↺ Due for Quick Review' : '↺ Practice Again'}
                </button>
              </div>
              <p style="margin:0;font-size:1.02rem;font-weight:500;">${esc(ch.koan)}</p>
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

  /* ---------------- FULL POSTGRESQL 18 SQL PLAYGROUND MODAL ---------------- */
  function renderStudioModal() {
    const body = $('#modal-studio-body');
    if (!body) return;
    const solvedCount = Object.keys(state.sqlSolved).filter(k => state.sqlSolved[k]).length;

    body.innerHTML = `
      <div class="row-between">
        <div class="row">
          <button type="button" class="pill-btn ${_studioSubTab === 'labs' ? 'btn-saffron' : ''}" data-studio-tab="labs">${PgLab.CHALLENGES.length} Graded Labs (${solvedCount}/${PgLab.CHALLENGES.length})</button>
          <button type="button" class="pill-btn ${_studioSubTab === 'scratch' ? 'btn-saffron' : ''}" data-studio-tab="scratch">Scratchpad &amp; Schema</button>
          <button type="button" class="pill-btn ${_studioSubTab === 'dialect' ? 'btn-saffron' : ''}" data-studio-tab="dialect">T-SQL ↔ PostgreSQL Guide</button>
        </div>
        <span id="studio-pg-status" class="mono muted" style="font-size:11.5px;">
          ${PgLab.ready ? `● ${PgLab.version} live in browser` : '⏳ Starting PostgreSQL 18…'}
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
        <button type="button" id="studio-run-lab" class="btn-saffron">▶ Run &amp; Check</button>
        <button type="button" id="studio-lab-hint" class="btn-quiet">💡 Hint</button>
        <button type="button" id="studio-lab-sol" class="btn-quiet">✓ Show Answer</button>
        <button type="button" id="studio-lab-reset" class="btn-quiet">↺ Reset</button>
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
          planEl.innerHTML = renderExplainTreeHtml(res.plan);
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
          syncHeaderAndPipeline();
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
        runBtn.textContent = '▶ Run & Check';
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
      { label: 'SCD-2 Point-in-Time', sql: PgLab.CHALLENGES.find(c => c.id === 'pg14-scd2').solution },
      { label: 'Recursive BOM', sql: PgLab.CHALLENGES.find(c => c.id === 'pg13-bom').solution },
      { label: 'JSONB Unnest', sql: PgLab.CHALLENGES.find(c => c.id === 'pg15-jsonb').solution }
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
        <button type="button" id="studio-run-scratch" class="btn-saffron">▶ Run SQL</button>
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
          if (r.fields && r.fields.length === 1 && /QUERY PLAN/i.test(r.fields[0].name)) {
            const planText = (r.rows || []).map(row => row[0]).join('\n');
            return renderExplainTreeHtml(planText);
          }
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
      outEl.innerHTML = `<div class="zen-feedback ok">✓ Seed tables restored.</div>`;
      loadSchema();
    });

    loadSchema();
  }

  function renderStudioDialectPane(pane) {
    const map = (window.DataLabSQL && DataLabSQL.DIALECT_MAP) ? DataLabSQL.DIALECT_MAP : [];
    pane.innerHTML = `
      <p class="muted" style="margin:0;">10 essential syntax translations between SQL Server (T-SQL) and PostgreSQL.</p>
      <div class="table-wrap">
        <table class="zen-table">
          <thead>
            <tr>
              <th>Pattern</th>
              <th>SQL Server (T-SQL)</th>
              <th>PostgreSQL</th>
              <th>Note</th>
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
     PIPELINE CANVAS CLICK-TO-JUMP + DEEP LINKS + BOOTSTRAP
  ============================================================ */
  function wirePipelineCanvasClicks(canvas) {
    if (!canvas) return;
    canvas.style.cursor = 'pointer';
    canvas.title = 'Click any unlocked stage to jump to that lesson';
    canvas.addEventListener('click', e => {
      const stages = ZenWorld.activeStages();
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const w = rect.width || 760;
      const pad = Math.max(40, w * (stages.length <= 6 ? 0.10 : 0.065));
      const span = w - pad * 2;
      let hitStage = null;
      let bestDist = 30;
      for (let i = 0; i < stages.length; i++) {
        const nx = pad + (i / Math.max(1, stages.length - 1)) * span;
        const d = Math.abs(x - nx);
        if (d < bestDist) { bestDist = d; hitStage = stages[i]; }
      }
      if (hitStage) {
        const globalIdx = ZenChapters.findIndex(c => c.id === hitStage.id);
        if (globalIdx >= 0 && isChapterUnlocked(globalIdx)) {
          ZenAudio.tap();
          openChapter(globalIdx, 1, false);
        } else {
          ZenAudio.woodblock();
          openModal('map');
        }
      }
    });
  }

  function applyUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const lessonParam = params.get('lesson') || params.get('ch');
    const trackParam = params.get('track');
    const viewParam = params.get('view');
    const legacyTab = params.get('tab');

    if (lessonParam) {
      const n = parseInt(lessonParam, 10);
      if (n >= 1 && n <= ZenChapters.length) {
        state.currentChapterIdx = n - 1;
        state.currentBeat = 1;
      }
    } else if (trackParam === '2') {
      state.currentChapterIdx = 9; // Lesson 10: Track 2 entry
      state.currentBeat = 1;
    } else if (legacyTab === 'pg') {
      state.currentChapterIdx = 7; // Lesson 8: Making Large Tables Fast (Partitions)
      state.currentBeat = 1;
    } else if (legacyTab === 'recon') {
      state.currentChapterIdx = 8; // Lesson 9: Verifying Pipeline Accuracy
      state.currentBeat = 1;
    }

    if (viewParam === 'playground' || viewParam === 'studio' || legacyTab === 'sql') {
      setTimeout(() => openModal('studio'), 60);
    } else if (viewParam === 'takeaways' || viewParam === 'journal') {
      setTimeout(() => openModal('journal'), 60);
    } else if (viewParam === 'lessons' || viewParam === 'map' || legacyTab === 'academy') {
      setTimeout(() => openModal('map'), 60);
    }
  }

  function init() {
    document.addEventListener('pointerdown', () => { _hasInteracted = true; }, { once: true });

    applyTheme();
    applySoundSetting();
    applyUrlParams();

    const riverCanvas = $('#zen-river-canvas');
    ZenWorld.mount(riverCanvas, null);
    wirePipelineCanvasClicks(riverCanvas);
    syncHeaderAndPipeline();
    renderStage(false);

    // Track switcher pills in pipeline bar
    $$('[data-track-switch]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTrack = Number(btn.dataset.trackSwitch);
        const curTrack = getChapter().track || 1;
        if (targetTrack === curTrack) return;
        ZenAudio.tap();
        const firstIdx = ZenChapters.findIndex(c => (c.track || 1) === targetTrack);
        if (firstIdx >= 0) openChapter(firstIdx, 1, false);
      });
    });

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
