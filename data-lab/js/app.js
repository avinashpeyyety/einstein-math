/* Data Engineering Academy — Beginner to Expert Interactive Controller (Einstein Math Portal) */
const STORAGE_KEY = 'einstein-data-academy-v2';

const state = {
  activeTrack: 'postgres',
  activeModuleIdx: 0,
  lessonsMastered: {},
  sqlSolved: {},
  reconSolved: {},
  activeChallenge: 0,
  theme: 'dark'
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) Object.assign(state, JSON.parse(raw));
  } catch (_) {}
  if (state.theme === 'light') {
    document.documentElement.classList.add('light');
    document.getElementById('theme-btn').textContent = '🌙 Dark';
  }
}

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  updateXP();
}

function toggleTheme() {
  const isLight = document.documentElement.classList.toggle('light');
  state.theme = isLight ? 'light' : 'dark';
  document.getElementById('theme-btn').textContent = isLight ? '🌙 Dark' : '☀️ Light';
  saveState();
}

function esc(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderTableHtml(rows) {
  if (!rows || !rows.length) return '<div class="muted">0 rows returned.</div>';
  const cols = Object.keys(rows[0]);
  return `<div class="table-wrap"><table class="data-table"><thead><tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${cols.map(c => `<td>${esc(r[c] === null || r[c] === undefined ? 'NULL' : r[c])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function updateXP() {
  const totalLessons = DataLabCurriculum.TRACKS.reduce((a, t) => a + t.modules.length, 0);
  const lessonsDone = Object.values(state.lessonsMastered).filter(Boolean).length;
  const sqlDone = Object.values(state.sqlSolved).filter(Boolean).length;
  const reconDone = Object.values(state.reconSolved).filter(Boolean).length;

  const total = totalLessons + DataLabSQL.CHALLENGES.length + reconBugs.length;
  const done = lessonsDone + sqlDone + reconDone;
  const pct = Math.round((done / total) * 100);

  document.getElementById('xp-text').textContent = `${done}/${total} Mastered (${pct}%)`;
  document.getElementById('xp-bar').style.width = pct + '%';

  const status = document.getElementById('recon-status');
  if (status) {
    if (reconDone === reconBugs.length) {
      status.textContent = 'ALL 4 INCIDENTS RESOLVED (99.9%+ Parity)';
      status.className = 'badge badge-ok';
    } else {
      status.textContent = `${reconBugs.length - reconDone} Open Production Incidents`;
      status.className = 'badge badge-warn';
    }
  }
}

function switchTab(id) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  document.getElementById('panel-' + id).classList.remove('hidden');
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
}

// ============================================================
// TAB 1: BEGINNER -> EXPERT COACHING ACADEMY
// ============================================================
function renderTrackCards() {
  const container = document.getElementById('track-selector');
  container.innerHTML = DataLabCurriculum.TRACKS.map(t => {
    const done = t.modules.filter(m => state.lessonsMastered[m.id]).length;
    const active = t.id === state.activeTrack;
    return `<button type="button" onclick="selectTrack('${t.id}')" class="choice-btn ${active ? 'active' : ''}" style="padding:14px;">
      <div class="row-between" style="margin-bottom:6px;">
        <span style="font-size:15px;font-weight:700;">${t.icon} ${esc(t.name)}</span>
        <span class="badge ${done === t.modules.length ? 'badge-ok' : t.badge}">${done}/${t.modules.length}</span>
      </div>
      <div class="muted" style="line-height:1.4;">${esc(t.tagline)}</div>
    </button>`;
  }).join('');
}

function selectTrack(trackId) {
  state.activeTrack = trackId;
  state.activeModuleIdx = 0;
  renderTrackCards();
  renderModuleView();
}

function selectModule(idx) {
  state.activeModuleIdx = idx;
  renderModuleView();
}

function renderModuleView() {
  const track = DataLabCurriculum.TRACKS.find(t => t.id === state.activeTrack) || DataLabCurriculum.TRACKS[0];
  const mod = track.modules[state.activeModuleIdx] || track.modules[0];

  // Level stepper
  const stepper = document.getElementById('level-stepper');
  stepper.innerHTML = track.modules.map((m, idx) => {
    const done = !!state.lessonsMastered[m.id];
    const active = idx === state.activeModuleIdx;
    return `<button type="button" onclick="selectModule(${idx})" class="choice-btn ${active ? 'active' : ''}" style="padding:10px 12px;">
      <div class="row-between">
        <span class="text-xs" style="font-weight:700;color:${active ? 'var(--primary)' : 'var(--text)'};">${esc(m.level)}</span>
        <span class="badge ${done ? 'badge-ok' : ''}">${done ? '✓' : (idx + 1)}</span>
      </div>
      <div class="muted" style="margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(m.title)}</div>
    </button>`;
  }).join('');

  // Lesson body
  const done = !!state.lessonsMastered[mod.id];
  const nextExists = state.activeModuleIdx < track.modules.length - 1;
  document.getElementById('lesson-viewer').innerHTML = `
    <div class="grid-2">
      <div class="stack">
        <div class="row-between">
          <span class="badge ${track.badge}">${track.icon} ${esc(track.name)} · ${esc(mod.level)}</span>
          <span class="badge ${done ? 'badge-ok' : 'badge-warn'}">${done ? '✓ Mastered' : 'In Progress'}</span>
        </div>
        <h2>${esc(mod.title)}</h2>
        <p class="text-xs" style="line-height:1.65;">${esc(mod.concept)}</p>
        <div class="subcard">
          <div class="text-xs" style="font-weight:700;color:var(--primary);margin-bottom:3px;">🧠 Mental Model</div>
          <div class="muted" style="color:var(--text);">${esc(mod.mentalModel)}</div>
        </div>
        <div class="subcard" style="border-color:rgba(251,191,36,0.45);">
          <div class="text-xs" style="font-weight:700;color:var(--warning);margin-bottom:3px;">⚠️ Common Production Pitfall</div>
          <div class="muted">${esc(mod.pitfall)}</div>
        </div>
      </div>

      <div class="stack">
        <div class="stack-sm">
          <div class="muted" style="font-weight:600;">${esc(mod.codeLabel)}</div>
          <pre class="code-box">${esc(mod.code)}</pre>
        </div>

        <div class="subcard stack-sm">
          <div class="text-xs" style="font-weight:700;">✅ Mastery Check: ${esc(mod.check.q)}</div>
          <div class="stack-sm">
            ${mod.check.opts.map((o, oi) => `<button type="button" onclick="answerLessonCheck('${mod.id}', ${oi})" id="lc-${mod.id}-${oi}" class="choice-btn">${esc(o)}</button>`).join('')}
          </div>
          <div id="lc-fb-${mod.id}" class="card text-xs hidden" style="padding:9px 11px;"></div>
          ${nextExists ? `<div class="row" style="justify-content:flex-end;margin-top:4px;"><button type="button" class="btn btn-primary" onclick="selectModule(${state.activeModuleIdx + 1})">Next Level (${esc(track.modules[state.activeModuleIdx + 1].level)}) →</button></div>` : ''}
        </div>
      </div>
    </div>
  `;
}

function answerLessonCheck(modId, optIdx) {
  const track = DataLabCurriculum.TRACKS.find(t => t.id === state.activeTrack);
  const mod = track.modules.find(m => m.id === modId);
  const ok = optIdx === mod.check.ans;

  mod.check.opts.forEach((_, i) => {
    const b = document.getElementById(`lc-${modId}-${i}`);
    if (!b) return;
    if (i === mod.check.ans) b.style.borderColor = 'var(--success)';
    else if (i === optIdx && !ok) b.style.borderColor = 'var(--error)';
    else b.style.borderColor = 'var(--border)';
  });

  const fb = document.getElementById(`lc-fb-${modId}`);
  fb.classList.remove('hidden');
  fb.textContent = (ok ? '✓ Mastered! ' : '✗ Try again: ') + mod.check.exp;
  fb.style.color = ok ? 'var(--success)' : 'var(--warning)';
  fb.style.borderColor = ok ? 'var(--success)' : 'var(--warning)';

  if (ok) {
    state.lessonsMastered[modId] = true;
    saveState();
    renderTrackCards();
  }
}

// ============================================================
// TAB 2: SQL PLAYGROUND & DIALECT TRANSLATOR
// ============================================================
function renderChallengeList() {
  const el = document.getElementById('sql-challenge-list');
  el.innerHTML = DataLabSQL.CHALLENGES.map((c, idx) => {
    const solved = !!state.sqlSolved[c.id];
    const active = idx === state.activeChallenge;
    return `<button type="button" onclick="loadChallenge(${idx})" class="choice-btn ${active ? 'active' : ''}">
      <div class="row-between">
        <span class="text-xs" style="font-weight:700;">${esc(c.title)}</span>
        <span class="badge ${solved ? 'badge-ok' : (c.dialect === 'tsql' ? 'badge-sqlserver' : 'badge-pg')}">${solved ? '✓ Solved' : (c.dialect === 'tsql' ? 'T-SQL' : 'PostgreSQL')}</span>
      </div>
    </button>`;
  }).join('');
}

function loadChallenge(idx) {
  state.activeChallenge = idx;
  const c = DataLabSQL.CHALLENGES[idx];
  renderChallengeList();
  document.getElementById('sql-chal-meta').textContent = c.project;
  document.getElementById('sql-chal-title').textContent = c.title;
  document.getElementById('sql-chal-prompt').textContent = c.prompt;
  document.getElementById('sql-editor').value = c.starter;
  document.getElementById('sql-hint-box').classList.add('hidden');
  document.getElementById('sql-hint-box').textContent = 'Hint: ' + c.hint;
  document.getElementById('sql-feedback').classList.add('hidden');
  document.getElementById('sql-output').innerHTML = '<div class="muted">Click <strong>▶ Run Query</strong> to execute against the in-memory tables.</div>';
}

function runUserSQL() {
  const c = DataLabSQL.CHALLENGES[state.activeChallenge];
  const sql = document.getElementById('sql-editor').value;
  const ok = c.validate(sql);
  const fb = document.getElementById('sql-feedback');
  fb.classList.remove('hidden');

  if (ok) {
    state.sqlSolved[c.id] = true;
    saveState();
    renderChallengeList();
    fb.className = 'subcard text-xs';
    fb.style.borderColor = 'var(--success)';
    fb.style.color = 'var(--success)';
    fb.textContent = '✓ Passed! Your query satisfies the production SQL rule.';
    document.getElementById('sql-output').innerHTML = renderTableHtml(c.run());
  } else {
    fb.className = 'subcard text-xs';
    fb.style.borderColor = 'var(--warning)';
    fb.style.color = 'var(--warning)';
    fb.textContent = 'Not quite yet — inspect the output below (or click Hint) to see why the current query fails.';
    document.getElementById('sql-output').innerHTML = renderTableHtml(c.badRun());
  }
}

function showSQLHint() {
  document.getElementById('sql-hint-box').classList.toggle('hidden');
}

function fillSQLSolution() {
  const c = DataLabSQL.CHALLENGES[state.activeChallenge];
  document.getElementById('sql-editor').value = c.solution;
  runUserSQL();
}

function previewTable(tblName) {
  document.getElementById('table-preview-title').textContent = tblName + ' (sample rows)';
  document.getElementById('table-preview-body').innerHTML = renderTableHtml(DataLabSQL.TABLES[tblName]);
}

function renderDialectTable() {
  document.getElementById('dialect-table-body').innerHTML = DataLabSQL.DIALECT_MAP.map(d => `
    <tr>
      <td style="font-family:inherit;font-weight:600;color:var(--text);">${esc(d.topic)}</td>
      <td style="color:#38bdf8;">${esc(d.tsql)}</td>
      <td style="color:#a78bfa;">${esc(d.pg)}</td>
      <td style="font-family:inherit;color:var(--muted);white-space:normal;">${esc(d.note)}</td>
    </tr>
  `).join('');
}

// ============================================================
// TAB 3: ANIMATED SSIS & PYTHON ETL PIPELINE STUDIO
// ============================================================
let pipeTimer = null;

function runPipelineSim() {
  if (pipeTimer) clearInterval(pipeTimer);
  const proj = document.getElementById('pipe-project').value;
  const fault = document.getElementById('pipe-fault').value;
  const fixEnabled = document.getElementById('pipe-fix').checked;

  const nodes = proj === 'retail'
    ? [
        { id: 'n1', name: '1. Store POS & Vendor CSVs', sub: 'Flat files + staging feeds' },
        { id: 'n2', name: '2. Python (pandas/pyodbc)', sub: 'Encoding & SKU normalization' },
        { id: 'n3', name: '3. SSIS Incremental Load', sub: 'Watermark → stg tables' },
        { id: 'n4', name: '4. T-SQL Star Schema', sub: 'MERGE FactSales / DimProduct' },
        { id: 'n5', name: '5. SQL Agent Parity Gate', sub: 'Automated total reconciliation' }
      ]
    : [
        { id: 'n1', name: '1. SQL Server OLTP / ERP', sub: 'Incremental watermark extract' },
        { id: 'n2', name: '2. Python Chunk Validator', sub: 'Schema & grain checks' },
        { id: 'n3', name: '3. PostgreSQL COPY Stream', sub: 'psycopg2 copy_expert()' },
        { id: 'n4', name: '4. PL/pgSQL Upsert', sub: 'ON CONFLICT + Partitions' },
        { id: 'n5', name: '5. Automated Parity Gate', sub: 'Row count & sum verification' }
      ];

  const track = document.getElementById('pipe-track');
  track.innerHTML = nodes.map(n => `
    <div id="${n.id}" class="pipe-node">
      <div class="text-xs" style="font-weight:700;">${esc(n.name)}</div>
      <div class="muted">${esc(n.sub)}</div>
      <div id="${n.id}-stat" class="mono text-xs" style="margin-top:8px;color:var(--muted);">Waiting…</div>
    </div>
  `).join('');

  const logEl = document.getElementById('pipe-log');
  logEl.textContent = `[00:00] Starting ${proj === 'retail' ? 'SSIS + Python → SQL Server' : 'Python COPY → PostgreSQL'} pipeline...\n`;

  let step = 0;
  pipeTimer = setInterval(() => {
    if (step >= nodes.length) {
      clearInterval(pipeTimer);
      logEl.textContent += `[DONE] Pipeline completed cleanly! Target SLA met.\n`;
      return;
    }
    const n = nodes[step];
    const el = document.getElementById(n.id);
    const stat = document.getElementById(n.id + '-stat');
    el.classList.add('running');

    const failAt =
      (fault === 'encoding' && step === 1) ||
      (fault === 'dupsku' && step === 3) ||
      (fault === 'slowinsert' && step === 2);

    setTimeout(() => {
      el.classList.remove('running');
      if (failAt && !fixEnabled) {
        el.classList.add('fail');
        if (fault === 'encoding') {
          stat.textContent = 'CRASH: UnicodeDecodeError';
          stat.style.color = 'var(--error)';
          logEl.textContent += `[ERROR] Stage 2 failed: Vendor file sent Latin-1 byte 0xE9 in UTF-8 reader. Enable "Apply Production Fix" to use encoding fallback!\n`;
        } else if (fault === 'dupsku') {
          stat.textContent = 'WARN: Join Fan-Out!';
          stat.style.color = 'var(--error)';
          logEl.textContent += `[ERROR] Stage 4 fan-out: Duplicate SKU A-9042 in DimProduct doubled FactSales rows! Enable "Apply Production Fix" to deduplicate.\n`;
        } else if (fault === 'slowinsert') {
          stat.textContent = 'SLA BREACH: 14.0 hrs';
          stat.style.color = 'var(--error)';
          logEl.textContent += `[ERROR] Stage 3 row-by-row executemany() stalled at ~1,000 rows/sec. Enable "Apply Production Fix" to switch to PostgreSQL COPY!\n`;
        }
        clearInterval(pipeTimer);
      } else {
        el.classList.add('ok');
        stat.style.color = 'var(--success)';
        if (failAt && fixEnabled) {
          stat.textContent = '✓ Auto-Recovered';
          logEl.textContent += `[OK] ${n.name}: Production safeguard handled "${fault}" cleanly.\n`;
        } else {
          stat.textContent = '✓ Passed';
          logEl.textContent += `[OK] ${n.name} finished.\n`;
        }
        step++;
      }
    }, 320);
  }, 550);
}

// ============================================================
// TAB 4: POSTGRESQL INTERNALS (PARTITIONING, EXPLAIN & COPY)
// ============================================================
function updatePGExplorer() {
  const rangeMonths = parseInt(document.getElementById('pg-range').value, 10);
  const partitioned = document.getElementById('pg-part').checked;
  const indexed = document.getElementById('pg-idx').checked;

  const grid = document.getElementById('pg-part-grid');
  const totalMonths = 72;
  let html = '';
  for (let i = 1; i <= totalMonths; i++) {
    const yr = 2017 + Math.floor((i - 1) / 12);
    const mo = ((i - 1) % 12) + 1;
    const label = `${String(yr).slice(2)}-${String(mo).padStart(2, '0')}`;
    const isTarget = i > totalMonths - rangeMonths;
    let cls = 'part-cell';
    if (!partitioned) cls += ' fullscan';
    else if (isTarget) cls += ' scanned';
    html += `<div class="${cls}">${label}</div>`;
  }
  grid.innerHTML = html;

  const scannedParts = partitioned ? rangeMonths : totalMonths;
  const rowsScannedM = (42 * (scannedParts / totalMonths)) * (indexed ? 0.14 : 1.0);
  const latencySec = (partitioned ? (rangeMonths * 0.45) : 21.4) * (indexed ? 0.35 : 1.0) + 0.25;

  document.getElementById('pg-parts-scanned').textContent = `${scannedParts} / 72 partitions`;
  document.getElementById('pg-rows-scanned').textContent = `~${rowsScannedM.toFixed(1)}M rows`;
  const latEl = document.getElementById('pg-latency');
  latEl.textContent = `${latencySec.toFixed(2)} sec`;
  latEl.style.color = latencySec <= 3.0 ? 'var(--success)' : 'var(--error)';

  const plan = partitioned
    ? `Append  (cost=0.43..${Math.round(latencySec * 4200)} rows=${Math.round(rowsScannedM * 1000000)})\n  Subplans Removed: ${totalMonths - scannedParts}  <-- Declarative Partition Pruning\n  -> ${indexed ? 'Index Scan using idx_plant_event_ts' : 'Seq Scan'} on fact_shop_floor_2022_xx\n        Filter: (event_ts >= NOW() - INTERVAL '${rangeMonths} months')\nExecution Time: ${(latencySec * 1000).toFixed(0)} ms`
    : `${indexed ? 'Bitmap Index Scan' : 'Parallel Seq Scan'} on fact_shop_floor_events (UNPARTITIONED 42M rows)\n  Filter: (event_ts >= NOW() - INTERVAL '${rangeMonths} months')\n  Rows Removed by Filter: ${Math.round((42 - (42 * rangeMonths / 72)) * 1000000).toLocaleString()}\nExecution Time: ${(latencySec * 1000).toFixed(0)} ms  <-- Full 6-Year Table Scan`;

  document.getElementById('pg-explain').textContent = plan;
}

function updateBackfill() {
  let hrs = 14.0;
  if (document.getElementById('opt-copy').checked) hrs -= 7.5;
  if (document.getElementById('opt-index').checked) hrs -= 2.5;
  if (document.getElementById('opt-chunk').checked) hrs -= 1.5;
  const el = document.getElementById('backfill-total');
  el.textContent = hrs.toFixed(1) + ' hrs';
  el.style.color = hrs <= 3.0 ? 'var(--success)' : 'var(--warning)';
}

// ============================================================
// TAB 5: PRODUCTION DEBUGGING LAB
// ============================================================
const reconBugs = [
  {
    id: 'r1',
    title: 'Incident #1 (SQL Server): FactSales is +$18,420 higher than POS End-of-Day Total',
    evidence: "SQL Diagnostic: SELECT sku_code, COUNT(*) FROM dw.DimProduct GROUP BY sku_code HAVING COUNT(*) > 1  -->  A-9042 (2 rows).",
    options: [
      { text: "Delete all transactions for SKU 'A-9042' from FactSales", ok: false, msg: "Incorrect — deleting valid sales drops real revenue." },
      { text: "Deduplicate DimProduct on sku_code (keep active record) and re-run idempotent MERGE", ok: true, msg: "Resolved! Eliminated the many-to-many join fan-out and restored exact parity." },
      { text: "Advance the SSIS watermark timestamp by 1 day", ok: false, msg: "Watermarking controls the extract window, not duplicate dimension keys." }
    ]
  },
  {
    id: 'r2',
    title: 'Incident #2 (PostgreSQL): Planned Production Output is 2× higher than Source ERP',
    evidence: "SQL Diagnostic: Split work order WO-8821 produced 2 child rows both inheriting planned_qty = 500.",
    options: [
      { text: "Use composite grain (wo_id, split_seq) and allocate planned_qty once per parent work order", ok: true, msg: "Resolved! Composite grain + parent-level allocation eliminates double counting." },
      { text: "Divide all planned_qty values by 2 across the table", ok: false, msg: "Incorrect — that halves normal non-split work orders!" },
      { text: "Drop monthly partitioning on fact_shop_floor_events", ok: false, msg: "Partitioning controls query I/O, not aggregation grain." }
    ]
  },
  {
    id: 'r3',
    title: 'Incident #3 (SQL Server): Store #12 shows $0 sales on Nov 14, double on Nov 15',
    evidence: "SQL Diagnostic: Store #12 exports UTC timestamps; CAST(txn_ts AS DATE) shifted evening sales into the next UTC day.",
    options: [
      { text: "Ignore it because the weekly total still balances", ok: false, msg: "Daily store reporting and day-of-week comparisons will be wrong." },
      { text: "Convert UTC timestamps AT TIME ZONE 'Central Standard Time' before deriving biz_date", ok: true, msg: "Resolved! Localizing timestamps before date truncation aligns daily totals." },
      { text: "Switch Python CSV encoding from latin1 to utf-8", ok: false, msg: "Character encoding does not affect timezone offsets." }
    ]
  },
  {
    id: 'r4',
    title: 'Incident #4 (SSIS / Python): Nightly job succeeded in 4 mins, but Store #7 has 0 rows',
    evidence: "SQL Diagnostic: Store #7 uploaded a 0-byte empty CSV; SSIS Data Flow loaded 0 rows without throwing an error.",
    options: [
      { text: "Add a pre-load row-count & file-size gate in Python/SSIS that fails & alerts on 0-row files", ok: true, msg: "Resolved! Explicit row-count assertions stop silent partial loads." },
      { text: "Remove Store #7 from DimStore", ok: false, msg: "Hiding a store masks an upstream outage." },
      { text: "Disable SSIS Fast Load", ok: false, msg: "Fast Load controls bulk insert speed, not empty-file detection." }
    ]
  }
];

function renderRecon() {
  document.getElementById('recon-cases').innerHTML = reconBugs.map((bug, idx) => {
    const done = !!state.reconSolved[bug.id];
    return `<div class="subcard stack-sm">
      <div class="row-between">
        <h3>${esc(bug.title)}</h3>
        <span id="recon-b-${idx}" class="badge ${done ? 'badge-ok' : 'badge-warn'}">${done ? '✓ Resolved' : 'Open'}</span>
      </div>
      <pre class="code-box" style="padding:9px 11px;">${esc(bug.evidence)}</pre>
      <div class="grid-3">
        ${bug.options.map((o, oi) => `<button type="button" onclick="checkRecon(${idx}, ${oi})" class="choice-btn">${esc(o.text)}</button>`).join('')}
      </div>
      <div id="recon-fb-${idx}" class="card text-xs hidden" style="padding:9px 11px;"></div>
    </div>`;
  }).join('');
}

function checkRecon(bi, oi) {
  const bug = reconBugs[bi];
  const opt = bug.options[oi];
  const fb = document.getElementById('recon-fb-' + bi);
  fb.classList.remove('hidden');
  fb.textContent = opt.msg;
  fb.style.color = opt.ok ? 'var(--success)' : 'var(--error)';
  fb.style.borderColor = opt.ok ? 'var(--success)' : 'var(--error)';
  if (opt.ok) {
    state.reconSolved[bug.id] = true;
    const b = document.getElementById('recon-b-' + bi);
    b.textContent = '✓ Resolved';
    b.className = 'badge badge-ok';
    saveState();
  }
}

function resetProgress() {
  if (!confirm('Reset all Data Academy progress (lessons, SQL challenges, and debugging labs)?')) return;
  state.lessonsMastered = {};
  state.sqlSolved = {};
  state.reconSolved = {};
  saveState();
  renderTrackCards();
  renderModuleView();
  renderChallengeList();
  renderRecon();
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  renderTrackCards();
  renderModuleView();
  renderChallengeList();
  loadChallenge(0);
  previewTable('stg_pos_sales');
  renderDialectTable();
  updatePGExplorer();
  updateBackfill();
  renderRecon();
  updateXP();
});
