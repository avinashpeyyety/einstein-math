/* Data Engineering Lab — Interactive Controller (Einstein Math Portal) */
const STORAGE_KEY = 'einstein-data-lab-v1';

const state = {
  sqlSolved: {},
  reconSolved: {},
  quizAnswers: {},
  activeChallenge: 0,
  theme: 'dark'
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      Object.assign(state, parsed);
    }
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

function updateXP() {
  const sqlDone = Object.values(state.sqlSolved).filter(Boolean).length;
  const reconDone = Object.values(state.reconSolved).filter(Boolean).length;
  const quizDone = Object.values(state.quizAnswers).filter(v => v === true).length;
  const totalTasks = DataLabSQL.CHALLENGES.length + reconBugs.length + quizData.length;
  const done = sqlDone + reconDone + quizDone;
  const pct = Math.round((done / totalTasks) * 100);

  document.getElementById('xp-text').textContent = `${done}/${totalTasks} Mastered (${pct}%)`;
  document.getElementById('xp-bar').style.width = pct + '%';

  const status = document.getElementById('recon-status');
  if (status) {
    if (reconDone === reconBugs.length) {
      status.textContent = 'GO-LIVE APPROVED (99.9%+ Parity)';
      status.className = 'badge badge-ok';
    } else {
      status.textContent = `BLOCKED (${reconBugs.length - reconDone} Open Incidents)`;
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

function esc(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderTableHtml(rows) {
  if (!rows || !rows.length) return '<div class="muted">0 rows returned.</div>';
  const cols = Object.keys(rows[0]);
  return `<div class="table-wrap"><table class="data-table"><thead><tr>${cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${cols.map(c => `<td>${esc(r[c] === null || r[c] === undefined ? 'NULL' : r[c])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

// ============================================================
// TAB 1: CAPACITY MATH SIMULATOR
// ============================================================
function updateCapSim() {
  const mode = document.getElementById('cap-mode').value;
  if (mode === 'retail') {
    document.getElementById('cap-label-1').textContent = 'Number of Stores';
    document.getElementById('cap-label-2').textContent = 'Active SKUs';
    const stores = parseInt(document.getElementById('cap-s1').value, 10);
    const skus = parseInt(document.getElementById('cap-s2').value, 10) * 1000;
    const years = parseInt(document.getElementById('cap-s3').value, 10);
    document.getElementById('cap-v1').textContent = stores + ' stores';
    document.getElementById('cap-v2').textContent = skus.toLocaleString() + ' SKUs';
    document.getElementById('cap-v3').textContent = years + ' yrs';

    const daily = stores * 1300 + stores * skus;
    const histM = (stores * 1300 * 365 * years + stores * skus * 34 * (years / 3)) / 1e6;
    const gb = histM * 0.57;
    const mins = Math.round(12 + stores * 0.8 + daily / 180000);

    document.getElementById('cap-daily').textContent = daily.toLocaleString() + ' rows/day';
    document.getElementById('cap-hist').textContent = histM.toFixed(1) + 'M rows';
    document.getElementById('cap-gb').textContent = '~' + gb.toFixed(1) + ' GB';
    document.getElementById('cap-sla').textContent = '~' + mins + ' mins';
    document.getElementById('cap-note').textContent = `Retail math: ${stores} stores × ~1,300 POS lines/day + (${stores} × ${skus.toLocaleString()} SKU inventory snapshots) = ${daily.toLocaleString()} daily rows (~${Math.round(daily * 0.27 / 1000)} MB/day). Runtime is dominated by ${stores} store export handshakes + SQL Server staging merges.`;
  } else {
    document.getElementById('cap-label-1').textContent = 'Shop-Floor Machines';
    document.getElementById('cap-label-2').textContent = 'Events / Machine / Day';
    const machines = parseInt(document.getElementById('cap-s1').value, 10);
    const evPerM = parseInt(document.getElementById('cap-s2').value, 10) * 100;
    const years = parseInt(document.getElementById('cap-s3').value, 10);
    document.getElementById('cap-v1').textContent = machines + ' machines';
    document.getElementById('cap-v2').textContent = evPerM.toLocaleString() + ' ev/day';
    document.getElementById('cap-v3').textContent = years + ' yrs';

    const daily = machines * evPerM + 5500; // + ERP work orders/BOM
    const histM = (daily * 365 * years) / 1e6;
    const gb = histM * 1.3; // wider machine/ERP rows + PG indexes
    const mins = Math.round(8 + (daily / 10000) * 1.2);

    document.getElementById('cap-daily').textContent = daily.toLocaleString() + ' rows/day';
    document.getElementById('cap-hist').textContent = histM.toFixed(1) + 'M rows';
    document.getElementById('cap-gb').textContent = '~' + gb.toFixed(1) + ' GB';
    document.getElementById('cap-sla').textContent = '~' + mins + ' mins';
    document.getElementById('cap-note').textContent = `Manufacturing math: ${machines} shop-floor machines × ${evPerM.toLocaleString()} events/day + ~5,500 ERP work-order/BOM rows = ${daily.toLocaleString()} rows/day (~${Math.round(daily * 0.75 / 1000)} MB/day). Over ${years} yrs that reaches ${histM.toFixed(1)}M rows (~${gb.toFixed(1)} GB in PostgreSQL).`;
  }
}

function switchCapMode() {
  const mode = document.getElementById('cap-mode').value;
  if (mode === 'retail') {
    document.getElementById('cap-s1').min = 5; document.getElementById('cap-s1').max = 100; document.getElementById('cap-s1').value = 35;
    document.getElementById('cap-s2').min = 5; document.getElementById('cap-s2').max = 60; document.getElementById('cap-s2').value = 25;
    document.getElementById('cap-s3').value = 3;
  } else {
    document.getElementById('cap-s1').min = 10; document.getElementById('cap-s1').max = 150; document.getElementById('cap-s1').value = 60;
    document.getElementById('cap-s2').min = 5; document.getElementById('cap-s2').max = 60; document.getElementById('cap-s2').value = 32;
    document.getElementById('cap-s3').value = 6;
  }
  updateCapSim();
}

// ============================================================
// TAB 2: SQL PLAYGROUND & DIALECT TRANSLATOR
// ============================================================
function renderChallengeList() {
  const el = document.getElementById('sql-challenge-list');
  el.innerHTML = DataLabSQL.CHALLENGES.map((c, idx) => {
    const solved = !!state.sqlSolved[c.id];
    const active = idx === state.activeChallenge;
    return `<button onclick="loadChallenge(${idx})" class="choice-btn ${active ? 'active' : ''}">
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
    fb.textContent = '✓ Passed! Your query satisfies the exact production migration rule.';
    document.getElementById('sql-output').innerHTML = renderTableHtml(c.run());
  } else {
    fb.className = 'subcard text-xs';
    fb.style.borderColor = 'var(--warning)';
    fb.style.color = 'var(--warning)';
    fb.textContent = 'Not quite yet — inspect the output below (or click Show Hint) to see why the starter/current query fails the migration check.';
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
        { id: 'n1', name: '1. 35 Store Exports & CSVs', sub: '45K POS + 875K Inv rows' },
        { id: 'n2', name: '2. Python (pandas/pyodbc)', sub: 'Encoding & 25K SKU clean' },
        { id: 'n3', name: '3. SSIS Incremental Load', sub: 'Watermark → stg tables' },
        { id: 'n4', name: '4. T-SQL Star Schema', sub: 'MERGE FactSales/Inv' },
        { id: 'n5', name: '5. Agent Reconciliation', sub: 'Z-Tape parity check' }
      ]
    : [
        { id: 'n1', name: '1. SQL Server ERP + Logs', sub: '200K daily / 50M hist' },
        { id: 'n2', name: '2. Python Validation', sub: 'Schema & split-WO check' },
        { id: 'n3', name: '3. PostgreSQL COPY Stream', sub: 'psycopg2 copy_expert()' },
        { id: 'n4', name: '4. PL/pgSQL Upsert', sub: 'ON CONFLICT + Partitions' },
        { id: 'n5', name: '5. Go/No-Go Parity Gate', sub: 'Row & financial totals' }
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
  logEl.textContent = `[00:00] Starting ${proj === 'retail' ? 'Retail SSIS + Python' : 'Manufacturing Python COPY + PostgreSQL'} batch...\n`;

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

    // Check injected fault
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
          logEl.textContent += `[ERROR] Stage 2 failed: Vendor #44 sent Latin-1 byte 0xE9 in UTF-8 reader. Toggle "Apply Production Fix" to handle encoding fallback!\n`;
        } else if (fault === 'dupsku') {
          stat.textContent = 'WARN: +$18,420 Fan-Out!';
          stat.style.color = 'var(--error)';
          logEl.textContent += `[ERROR] Stage 4 fan-out: Duplicate SKU A-9042 in DimProduct doubled 240 FactSales rows! Toggle "Apply Production Fix" to deduplicate.\n`;
        } else if (fault === 'slowinsert') {
          stat.textContent = 'SLA BREACH: 14.0 hrs';
          stat.style.color = 'var(--error)';
          logEl.textContent += `[ERROR] Stage 3 row-by-row executemany() stalled at ~1,000 rows/sec (14h ETA). Toggle "Apply Production Fix" to switch to PostgreSQL COPY!\n`;
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
// TAB 4: POSTGRESQL PARTITION PRUNING & BACKFILL OPTIMIZER
// ============================================================
function updatePGExplorer() {
  const rangeMonths = parseInt(document.getElementById('pg-range').value, 10);
  const partitioned = document.getElementById('pg-part').checked;
  const indexed = document.getElementById('pg-idx').checked;

  const grid = document.getElementById('pg-part-grid');
  const totalMonths = 72; // 6 years
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
    ? `Append  (cost=0.43..${Math.round(latencySec * 4200)} rows=${Math.round(rowsScannedM * 1000000)})\n  Subplans Removed: ${totalMonths - scannedParts}  <-- Partition Pruning!\n  -> ${indexed ? 'Index Scan using idx_plant_event_ts' : 'Seq Scan'} on fact_shop_floor_2022_xx\n        Filter: (event_ts >= NOW() - INTERVAL '${rangeMonths} months')\nExecution Time: ${(latencySec * 1000).toFixed(0)} ms`
    : `${indexed ? 'Bitmap Index Scan' : 'Parallel Seq Scan'} on fact_shop_floor_events (UNPARTITIONED 42M rows)\n  Filter: (event_ts >= NOW() - INTERVAL '${rangeMonths} months')\n  Rows Removed by Filter: ${Math.round((42 - (42 * rangeMonths / 72)) * 1000000).toLocaleString()}\nExecution Time: ${(latencySec * 1000).toFixed(0)} ms  <-- Full 6-Year Scan!`;

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
// TAB 5: CUTOVER NIGHT INCIDENT LAB
// ============================================================
const reconBugs = [
  {
    id: 'r1',
    title: 'Incident #1 (Retail): FactSales is +$18,420 higher than Legacy POS Z-Tape',
    evidence: "SQL Diagnostic: SELECT sku_code, COUNT(*) FROM dw.DimProduct GROUP BY sku_code HAVING COUNT(*) > 1  -->  A-9042 (2 rows).",
    options: [
      { text: "Delete all transactions for SKU 'A-9042' from FactSales", ok: false, msg: "Wrong — deleting valid sales breaks revenue in the opposite direction." },
      { text: "Deduplicate DimProduct on sku_code (active record) and re-run idempotent MERGE", ok: true, msg: "Resolved! Eliminated the many-to-many join fan-out and restored exact Z-tape parity." },
      { text: "Advance the SSIS watermark timestamp by 1 day", ok: false, msg: "Watermarking controls extraction window, not duplicate dimension keys." }
    ]
  },
  {
    id: 'r2',
    title: 'Incident #2 (Manufacturing): Plant 2 Planned Output is 2× higher than ERP',
    evidence: "SQL Diagnostic: dbo.WorkOrderSplit generated 2 split child rows sharing parent_wo_id = 'WO-8821', both inheriting planned_qty = 500.",
    options: [
      { text: "Use composite grain (wo_id, split_seq) and allocate planned_qty once per parent work order", ok: true, msg: "Resolved! Composite key + parent-level allocation fixes split work-order inflation." },
      { text: "Divide all planned_qty values by 2 across the table", ok: false, msg: "Wrong — that halves all normal non-split work orders!" },
      { text: "Drop monthly partitioning on fact_shop_floor_events", ok: false, msg: "Partitioning affects query speed, not work-order aggregation grain." }
    ]
  },
  {
    id: 'r3',
    title: 'Incident #3 (Retail): Store #12 shows $0 sales on Nov 14, double on Nov 15',
    evidence: "SQL Diagnostic: Store #12 POS exports UTC timestamps; T-SQL CAST(txn_ts AS DATE) shifted evening sales into the next UTC day.",
    options: [
      { text: "Ignore it because the 7-day weekly total still balances", ok: false, msg: "Store managers rely on accurate daily Z-tape and YoY day-of-week comps." },
      { text: "Convert UTC timestamps AT TIME ZONE 'Central Standard Time' before deriving biz_date", ok: true, msg: "Resolved! Localizing timestamps before date truncation aligns daily store totals." },
      { text: "Switch Python CSV encoding from latin1 to utf-8", ok: false, msg: "Character encoding does not change timezone offsets." }
    ]
  },
  {
    id: 'r4',
    title: 'Incident #4 (Retail): SQL Server Agent succeeded in 4 mins, but Store #7 has 0 rows',
    evidence: "SQL Diagnostic: Store #7's SFTP export was a 0-byte empty file; SSIS Data Flow loaded 0 rows without throwing an error.",
    options: [
      { text: "Add a pre-load row-count & file-size gate in Python/SSIS that fails & alerts on 0-row store exports", ok: true, msg: "Resolved! Automated empty-file / row-count assertions stop silent partial loads." },
      { text: "Remove Store #7 from DimStore", ok: false, msg: "Hiding a store from DimStore masks a real upstream outage." },
      { text: "Switch from SQL Server to PostgreSQL", ok: false, msg: "Changing databases doesn't catch empty upstream files." }
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
        ${bug.options.map((o, oi) => `<button onclick="checkRecon(${idx}, ${oi})" class="choice-btn">${esc(o.text)}</button>`).join('')}
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

// ============================================================
// TAB 6: INTERVIEW GRILL
// ============================================================
const quizData = [
  { id: 'q1', q: '1. Why did 250 MB/day across 35 stores take ~45 minutes in SSIS?', opts: ['SQL Server maxes out at 10 MB/min.', 'Connection/network overhead polling 35 store exports + Python SKU cleaning + T-SQL MERGE/index maintenance.', 'pandas takes 40 mins to read 250 MB.'], ans: 1, exp: 'Multi-store on-prem pipelines are handshake/I-O bound, not raw byte bound.' },
  { id: 'q2', q: '2. Why migrate analytics from SQL Server ERP to PostgreSQL instead of staying on SQL Server?', opts: ['SQL Server cannot run star schemas.', 'To eliminate SQL Server BI/CAL licensing costs and isolate heavy analytics from the live ERP.', 'Python cannot connect to SQL Server.'], ans: 1, exp: 'Cutting SQL Server reporting/CAL licensing costs while offloading BI queries from the transactional ERP is a textbook SMB business case.' },
  { id: 'q3', q: '3. What is the #1 subtle bug when translating T-SQL WHERE clauses to PostgreSQL?', opts: ['PostgreSQL has no WHERE clause.', 'SQL Server defaults to case-insensitive collation, whereas PostgreSQL text comparisons are case-sensitive.', 'PostgreSQL does not support integers.'], ans: 1, exp: "Always normalize casing (UPPER/LOWER) or use ILIKE/CITEXT when moving from SQL Server to PostgreSQL." },
  { id: 'q4', q: '4. How do you guarantee a nightly load can be retried safely without creating duplicates?', opts: ['Make loads idempotent using MERGE (SQL Server) or ON CONFLICT DO UPDATE (PostgreSQL) on a natural/composite key.', 'Truncate all 50M rows every night.', 'Remove primary keys.'], ans: 0, exp: 'Idempotency lets failed jobs retry safely without duplicating revenue or production totals.' },
  { id: 'q5', q: '5. Why use LEFT JOIN + Unknown (-1) surrogate key when loading FactSales?', opts: ['It makes the query shorter.', 'So valid sales for brand-new SKUs missing from DimProduct are never silently dropped.', 'SQL Server requires -1 keys.'], ans: 1, exp: 'Dropping revenue rows on an INNER JOIN silently breaks financial reconciliation.' },
  { id: 'q6', q: '6. What drove the biggest speedup in the 50M-row PostgreSQL backfill (14h → 2.5h)?', opts: ['Switching from row-by-row INSERTs to PostgreSQL COPY bulk-loading + deferred index rebuilds + chunking.', 'Renaming columns to snake_case.', 'Switching Cron to Task Scheduler.'], ans: 0, exp: 'COPY streams data directly into PostgreSQL storage, bypassing per-row SQL parse/commit overhead.' },
  { id: 'q7', q: '7. Why partition the 42M-row shop_floor_events table by month?', opts: ['So 90-day BI dashboards prune 69 of 72 partitions and stay under 3 seconds.', 'PostgreSQL tables cannot exceed 1M rows.', 'To avoid writing WHERE clauses.'], ans: 0, exp: 'Range partition pruning dramatically reduces disk I/O for time-bounded operational dashboards.' },
  { id: 'q8', q: '8. How does Project 2 prove 4-year progression beyond a Junior Data Engineer?', opts: ['More lines of Python code.', 'Leading client mapping workshops, designing the partitioned star schema, building a reusable COPY framework, and mentoring a junior DE.', 'Working longer hours.'], ans: 1, exp: 'Mid-level/senior growth is demonstrated through architectural ownership, stakeholder leadership, and mentoring.' }
];

function renderQuiz() {
  document.getElementById('quiz-container').innerHTML = quizData.map((item, idx) => `
    <div class="subcard stack-sm">
      <div class="text-xs" style="font-weight:700;">${esc(item.q)}</div>
      <div class="stack-sm">
        ${item.opts.map((o, oi) => `<button onclick="answerQuiz(${idx}, ${oi})" id="q-${idx}-${oi}" class="choice-btn">${esc(o)}</button>`).join('')}
      </div>
      <div id="q-exp-${idx}" class="card text-xs hidden" style="padding:9px 11px;"></div>
    </div>
  `).join('');
}

function answerQuiz(qi, oi) {
  const item = quizData[qi];
  const ok = oi === item.ans;
  state.quizAnswers[item.id] = ok;
  saveState();
  item.opts.forEach((_, i) => {
    const b = document.getElementById(`q-${qi}-${i}`);
    if (i === item.ans) b.style.borderColor = 'var(--success)';
    else if (i === oi && !ok) b.style.borderColor = 'var(--error)';
    else b.style.borderColor = 'var(--border)';
  });
  const exp = document.getElementById('q-exp-' + qi);
  exp.classList.remove('hidden');
  exp.textContent = (ok ? '✓ Senior-Ready: ' : '✗ Review: ') + item.exp;
  exp.style.color = ok ? 'var(--success)' : 'var(--warning)';
  exp.style.borderColor = ok ? 'var(--success)' : 'var(--warning)';
}

function resetProgress() {
  if (!confirm('Reset all Data Lab progress (SQL challenges, incidents, and quiz)?')) return;
  state.sqlSolved = {};
  state.reconSolved = {};
  state.quizAnswers = {};
  saveState();
  renderChallengeList();
  renderRecon();
  renderQuiz();
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  updateCapSim();
  renderChallengeList();
  loadChallenge(0);
  previewTable('stg_pos_sales');
  renderDialectTable();
  updatePGExplorer();
  updateBackfill();
  renderRecon();
  renderQuiz();
  updateXP();
});
