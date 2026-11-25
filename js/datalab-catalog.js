/* Data Lab Catalog & Interactive Hub Showcase for Einstein Math
 * Renders:
 *  1) Live mini pipeline progress + quick-jump links on Einstein Math's Home card (#screen-landing)
 *  2) Rich, sketchbook-styled interactive preview & direct-jump curriculum hub on #screen-data
 * Reads Data Lab's localStorage ('einstein-datalab-v2') so progress & Resume links stay live.
 */
const DataLabCatalog = {
  BASE: 'data-lab/',
  STORAGE_KEY: 'einstein-datalab-v2',

  LESSONS: [
    { num: 1,  track: 1, id: 'l1-filter',     short: 'Filter',     title: 'Reading & Filtering Tables' },
    { num: 2,  track: 1, id: 'l2-groupby',    short: 'Group',      title: 'Summarizing with GROUP BY' },
    { num: 3,  track: 1, id: 'l3-dupes',      short: 'Quality',    title: 'Catching Duplicate Keys' },
    { num: 4,  track: 1, id: 'l4-python',     short: 'Python',     title: 'Cleaning Raw Files with Python' },
    { num: 5,  track: 1, id: 'l5-leftjoin',   short: 'Joins',      title: 'Combining Tables Safely' },
    { num: 6,  track: 1, id: 'l6-bulkload',   short: 'Bulk Load',  title: 'Loading Fast & Retrying Safely' },
    { num: 7,  track: 1, id: 'l7-dialects',   short: 'Dialects',   title: 'SQL Server (T-SQL) vs. PostgreSQL' },
    { num: 8,  track: 1, id: 'l8-partitions', short: 'Partitions', title: 'Making Large Tables Fast' },
    { num: 9,  track: 1, id: 'l9-reconcile',  short: 'Audit',      title: 'Verifying Pipeline Accuracy' },
    { num: 10, track: 2, id: 'l10-windows',   short: 'Windows',    title: 'Window Functions & Running Totals' },
    { num: 11, track: 2, id: 'l11-dedup',     short: 'Dedup',      title: 'Deduplicating with ROW_NUMBER()' },
    { num: 12, track: 2, id: 'l12-scd2',      short: 'SCD-2',      title: 'Slowly Changing Dimensions (SCD-2)' },
    { num: 13, track: 2, id: 'l13-timezone',  short: 'Timezones',  title: 'Timezones & Business-Day Cutoffs' },
    { num: 14, track: 2, id: 'l14-recursive', short: 'Recursive',  title: 'Recursive Hierarchies (BOM)' },
    { num: 15, track: 2, id: 'l15-jsonb',     short: 'JSONB',      title: 'Semi-Structured JSONB Pipelines' }
  ],

  STACK_LAYERS: [
    { num: 1, label: 'Authoritative Data', live: true },
    { num: 2, label: 'Streaming & Scale',  live: false },
    { num: 3, label: 'Agentic Workflows',  live: false },
    { num: 4, label: 'Agent Harnesses',    live: false },
    { num: 5, label: 'LLM & Silicon (CUDA/TPU)', live: false }
  ],

  PREVIEW_ROWS: [
    { sku: 'A-9042', cat: 'Apparel',     price: 24.99,  priceStr: '24.99',  active: true  },
    { sku: 'B-2210', cat: 'Footwear',    price: 120.00, priceStr: '120.00', active: true  },
    { sku: 'C-5501', cat: 'Accessories', price: 45.00,  priceStr: '45.00',  active: true  },
    { sku: 'H-3030', cat: 'Accessories', price: 64.00,  priceStr: '64.00',  active: false }
  ],

  SECTIONS: [
    {
      id: 'track1', icon: '📊', title: 'Track 1: Core SQL & Data Pipelines (L1–9)', query: '', color: '#E8892F',
      blurb: 'Start from Day-1 SQL (SELECT, WHERE, GROUP BY) and build through Python CSV cleaning, Star Schemas, bulk COPY, T-SQL dialects, partitioning & reconciliation.',
      topics: ['Beginner friendly', 'Voice + diagrams', 'Table previews', 'Real Postgres 18']
    },
    {
      id: 'track2', icon: '🔬', title: 'Track 2: Analytical SQL & Modeling (L10–15)', query: '?track=2', color: '#8B74C9',
      blurb: 'Advance to senior analytical SQL: Window functions, ROW_NUMBER() dedup, SCD Type 2 point-in-time joins, UTC/local timezones, WITH RECURSIVE BOMs & JSONB unnesting.',
      topics: ['Windows & dedup', 'SCD Type 2', 'Timezones', 'Recursive + JSONB']
    },
    {
      id: 'playground', icon: '🐘', title: 'PostgreSQL 18 SQL Playground (15 Labs)', query: '?view=playground', color: '#4A6B82',
      blurb: 'Run real SQL locally in your browser via WASM: 15 Beginner→Expert graded labs, Visual EXPLAIN Plan Tree, freeform Scratchpad, live schema & T-SQL ↔ PG guide.',
      topics: ['Real Postgres 18', '15 graded labs', 'Visual EXPLAIN tree', 'T-SQL ↔ PG guide']
    },
    {
      id: 'stack', icon: '🏛️', title: '5-Layer Agentic Data & AI Stack Map', query: '?view=stack', color: '#5E7D54',
      blurb: 'Zoom out to the full modern engineering stack: Authoritative Data Platforms → Streaming → Agentic Workflows & Harnesses → LLM Serving, Compilers & CUDA/TPU Silicon.',
      topics: ['Big-picture map', 'Agent harnesses', 'Serving & silicon', '7-track path']
    },
    {
      id: 'takeaways', icon: '📝', title: 'Key Takeaways & Quick Review', query: '?view=takeaways', color: '#C25E3E',
      blurb: 'Review your saved one-sentence engineering principles across all 15 lessons and run quick PostgreSQL 18 practice refreshers anytime.',
      topics: ['15 core rules', 'Quick review', 'Offline ready']
    }
  ],

  url(section) {
    const s = typeof section === 'string' ? this.SECTIONS.find(x => x.id === section) : section;
    if (!s) return this.BASE;
    return this.BASE + (s.query || '');
  },

  readProgress() {
    const empty = { mastered: {}, sqlSolved: {}, currentIdx: 0, doneCount: 0, sqlCount: 0, nextLesson: this.LESSONS[0] };
    if (typeof localStorage === 'undefined') return empty;
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return empty;
      const st = JSON.parse(raw);
      const mastered = st.mastered || {};
      const sqlSolved = st.sqlSolved || {};
      const doneCount = this.LESSONS.filter(l => mastered[l.id]).length;
      const sqlCount = Object.keys(sqlSolved).filter(k => sqlSolved[k]).length;
      const currentIdx = Math.max(0, Math.min(this.LESSONS.length - 1, Number(st.currentChapterIdx) || 0));
      const nextUnmastered = this.LESSONS.find(l => !mastered[l.id]) || this.LESSONS[currentIdx];
      return { mastered, sqlSolved, currentIdx, doneCount, sqlCount, nextLesson: nextUnmastered };
    } catch (_) {
      return empty;
    }
  },

  _esc(v) {
    return String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },

  /* Enhances the Data Lab card on Einstein Math's Home Page (#screen-landing) with a calm preview + direct clicks */
  renderHomeSlot(rootEl) {
    if (!rootEl) return;
    const p = this.readProgress();
    const e = v => this._esc(v);
    const resumeHref = p.doneCount > 0 ? `${this.BASE}?lesson=${p.nextLesson.num}` : this.BASE;
    const resumeLabel = p.doneCount > 0 ? `▶ Resume L${p.nextLesson.num}` : '▶ Lesson 1';
    const stages = [
      { label: 'SQL', done: !!p.mastered['l1-filter'] },
      { label: 'ETL', done: !!p.mastered['l4-python'] },
      { label: 'Model', done: !!p.mastered['l5-leftjoin'] || !!p.mastered['l12-scd2'] },
      { label: 'Scale', done: !!p.mastered['l8-partitions'] },
      { label: 'AI Stack', done: false }
    ];
    rootEl.innerHTML = `
      <div class="dl-home-flow" aria-label="Data Lab progression preview">
        ${stages.map((st, i) => `
          <span class="dl-home-node ${st.done ? 'done' : ''}">${st.done ? '✓ ' : ''}${e(st.label)}</span>
          ${i < stages.length - 1 ? '<span class="dl-home-arrow" aria-hidden="true">→</span>' : ''}
        `).join('')}
      </div>
      <div class="dl-home-meta">
        <span>🐘 Real PostgreSQL 18 in browser</span>
        <span>${p.doneCount}/15 lessons · ${p.sqlCount}/15 SQL labs</span>
      </div>
      <div class="dl-home-pills">
        <a class="dl-pill dl-pill-accent" href="${e(resumeHref)}">${e(resumeLabel)}</a>
        <a class="dl-pill" href="${this.BASE}?track=2">🔬 Track 2</a>
        <a class="dl-pill" href="${this.BASE}?view=playground">🐘 SQL</a>
        <a class="dl-pill" href="${this.BASE}?view=stack">🏛️ Stack Map</a>
      </div>
    `;
  },

  /* Interactive Showcase Hero + Clickable L1–L15 Curriculum Strip inside #screen-data */
  mountShowcase(rootEl) {
    if (!rootEl) return;
    const p = this.readProgress();
    const e = v => this._esc(v);
    const resumeLesson = p.doneCount > 0 ? p.nextLesson : this.LESSONS[0];
    const resumeHref = `${this.BASE}?lesson=${resumeLesson.num}`;
    const resumeCta = p.doneCount > 0
      ? `▶ Resume Lesson ${resumeLesson.num}: ${resumeLesson.short}`
      : '▶ Start Lesson 1: Reading & Filtering';

    const t1 = this.LESSONS.filter(l => l.track === 1);
    const t2 = this.LESSONS.filter(l => l.track === 2);

    rootEl.innerHTML = `
      <div class="dl-showcase">
        <div class="dl-hero-grid">
          <div class="dl-hero-left">
            <div class="dl-eyebrow">Calm 4-Step Flow · Watch → Explore Visually → Real PostgreSQL 18 → Takeaway</div>
            <h3 class="dl-hero-title">Build Real Data Pipelines, One Concept at a Time</h3>
            <p class="dl-hero-copy">No setup, no mock parsers—every query runs on real PostgreSQL 18 (WASM) right inside your browser, scaling from Day-1 <code>SELECT</code> to SCD-2, <code>EXPLAIN</code> pruning, and the 5-layer Agentic AI data stack.</p>
            <div class="dl-stats-row">
              <span class="dl-stat-badge"><strong>${p.doneCount}/15</strong> Lessons Done</span>
              <span class="dl-stat-badge"><strong>${p.sqlCount}/15</strong> Postgres 18 Labs</span>
              <span class="dl-stat-badge"><strong>15</strong> Voice Walkthroughs</span>
            </div>
            <div class="dl-cta-row">
              <a class="dl-btn-primary" href="${e(resumeHref)}">${e(resumeCta)}</a>
              <a class="dl-btn-quiet" href="${this.BASE}?view=playground">🐘 SQL Playground</a>
              <a class="dl-btn-quiet" href="${this.BASE}?view=stack">🏛️ 5-Layer Stack Map</a>
            </div>
          </div>

          <div class="dl-mini-preview" aria-label="Interactive SQL filter preview">
            <div class="dl-preview-head">
              <span><strong>Live Preview</strong> · Click to feel how Data Lab teaches</span>
              <span class="dl-preview-count" id="dl-prev-count">4 of 4 rows</span>
            </div>
            <div class="dl-preview-toggles">
              <button type="button" class="dl-prev-btn" data-dl-prev="active">+ Active Only</button>
              <button type="button" class="dl-prev-btn" data-dl-prev="price">+ Price &gt; $30</button>
              <a class="dl-prev-try" href="${this.BASE}?lesson=1">Try full lab →</a>
            </div>
            <div class="dl-prev-table-wrap">
              <table class="dl-prev-table">
                <thead><tr><th>sku_code</th><th>category</th><th>price</th><th>active</th></tr></thead>
                <tbody id="dl-prev-tbody"></tbody>
              </table>
            </div>
            <pre class="dl-prev-sql" id="dl-prev-sql"></pre>
          </div>
        </div>

        <div class="dl-tracks-bar">
          <div class="dl-track-group">
            <div class="dl-track-head">
              <span class="dl-eyebrow" style="margin:0;">Track 1 · Core SQL &amp; Data Pipelines (L1–L9)</span>
              <a class="dl-track-open" href="${this.BASE}">Open Track 1 →</a>
            </div>
            <div class="dl-chip-row">
              ${t1.map(l => {
                const done = !!p.mastered[l.id];
                return `<a class="dl-lesson-chip ${done ? 'done' : ''}" href="${this.BASE}?lesson=${l.num}" title="Lesson ${l.num}: ${e(l.title)}">${done ? '✓ ' : `${l.num}. `}${e(l.short)}</a>`;
              }).join('')}
            </div>
          </div>

          <div class="dl-track-group">
            <div class="dl-track-head">
              <span class="dl-eyebrow" style="margin:0;color:#6E55B8;">Track 2 · Analytical SQL &amp; Modeling (L10–L15)</span>
              <a class="dl-track-open" href="${this.BASE}?track=2">Open Track 2 →</a>
            </div>
            <div class="dl-chip-row">
              ${t2.map(l => {
                const done = !!p.mastered[l.id];
                return `<a class="dl-lesson-chip ${done ? 'done' : ''}" href="${this.BASE}?lesson=${l.num}" title="Lesson ${l.num}: ${e(l.title)}">${done ? '✓ ' : `${l.num}. `}${e(l.short)}</a>`;
              }).join('')}
            </div>
          </div>

          <div class="dl-stack-strip">
            <span class="dl-stack-label">5-Layer Full Stack:</span>
            ${this.STACK_LAYERS.map(ly => `<a class="dl-stack-pill ${ly.live ? 'live' : ''}" href="${this.BASE}?view=stack">${ly.num}. ${e(ly.label)}${ly.live ? ' ●' : ''}</a>`).join('')}
          </div>
        </div>
      </div>
    `;

    // Wire the live interactive dim_product preview right on #screen-data!
    const prevState = { active: false, price: false };
    const renderPreview = () => {
      const tbody = rootEl.querySelector('#dl-prev-tbody');
      const sqlEl = rootEl.querySelector('#dl-prev-sql');
      const cntEl = rootEl.querySelector('#dl-prev-count');
      let kept = 0;
      if (tbody) {
        tbody.innerHTML = this.PREVIEW_ROWS.map(r => {
          const ok = (!prevState.active || r.active) && (!prevState.price || r.price > 30);
          if (ok) kept++;
          const cls = (prevState.active || prevState.price) ? (ok ? 'kept' : 'cut') : '';
          return `<tr class="${cls}"><td>${e(r.sku)}</td><td>${e(r.cat)}</td><td>${e(r.priceStr)}</td><td>${r.active ? 'TRUE' : 'FALSE'}</td></tr>`;
        }).join('');
      }
      if (cntEl) cntEl.textContent = `${kept} of ${this.PREVIEW_ROWS.length} rows`;
      const conds = [];
      if (prevState.active) conds.push('is_active');
      if (prevState.price) conds.push('unit_price > 30');
      if (sqlEl) {
        sqlEl.textContent = `SELECT sku_code, category, unit_price\nFROM dim_product${conds.length ? `\nWHERE ${conds.join(' AND ')}` : ''};`;
      }
      rootEl.querySelectorAll('[data-dl-prev]').forEach(btn => {
        const k = btn.dataset.dlPrev;
        const on = !!prevState[k];
        btn.classList.toggle('on', on);
        btn.textContent = (on ? '✓ ' : '+ ') + (k === 'active' ? 'Active Only' : 'Price > $30');
      });
    };

    rootEl.querySelectorAll('[data-dl-prev]').forEach(btn => {
      btn.addEventListener('click', () => {
        const k = btn.dataset.dlPrev;
        prevState[k] = !prevState[k];
        renderPreview();
      });
    });
    renderPreview();
  },

  cardsHtml() {
    const e = v => this._esc(v);
    return this.SECTIONS.map(s => `<a class="unit-card space-card" href="${e(this.url(s))}" data-datalab="${e(s.id)}" style="border-top: 8px solid ${e(s.color)}">
      <div class="unit-icon">${s.icon}</div>
      <h3>${e(s.title)}</h3>
      <p>${e(s.blurb)}</p>
      <p class="unit-mastery-line">${(s.topics || []).map(e).join(' · ')}</p>
      <span class="btn btn-cyan btn-sm">Launch ▶</span>
    </a>`).join('');
  }
};

if (typeof module !== 'undefined' && module.exports) module.exports = DataLabCatalog;
