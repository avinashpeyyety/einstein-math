/* Data Lab Catalog — mirrors js/space.js so clicking "🗄️ Data Lab" opens seamlessly
 * inside Einstein Math (#screen-data, keeping header, Einstein coach & halftone paper)
 * and each section card deep-links into data-lab/?tab=… */
const DataLabCatalog = {
  BASE: 'data-lab/',

  SECTIONS: [
    {
      id: 'academy', icon: '🎓', title: 'Coaching Tracks (Beginner → Expert)', tab: 'academy', color: '#FF6B35',
      blurb: '16 structured lessons across PostgreSQL, SQL Server (T-SQL), SSIS & Python — with mental models, real code, pitfalls & mastery checks.',
      topics: ['PostgreSQL', 'T-SQL', 'SSIS', 'Python ETL']
    },
    {
      id: 'sql', icon: '🐘', title: 'Live PostgreSQL 18 Playground', tab: 'sql', color: '#A78BFA',
      blurb: 'Run real SQL directly in your browser on PostgreSQL 18 (WASM). Solve 13 Beginner→Expert labs graded on real result sets & EXPLAIN plans.',
      topics: ['real Postgres 18', '13 graded labs', 'T-SQL ↔ PG cheat sheet']
    },
    {
      id: 'pipe', icon: '🔀', title: 'ETL Pipeline Studio (SSIS & Python)', tab: 'pipe', color: '#4ECDC4',
      blurb: 'Watch rows flow through 5 animated stages, inject real production faults (encoding crashes, join fan-outs, slow inserts), and toggle fixes.',
      topics: ['SSIS', 'pandas / pyodbc', 'psycopg2 COPY', 'fault recovery']
    },
    {
      id: 'pg', icon: '⚡', title: 'Postgres Partitioning & COPY Lab', tab: 'pg', color: '#FFE66D',
      blurb: 'Interactive 72-month range partition pruning visualizer, simulated EXPLAIN (ANALYZE, BUFFERS), and a 14h → 2.5h bulk-load optimizer.',
      topics: ['range partitions', 'B-Tree indexes', 'EXPLAIN', 'bulk COPY']
    },
    {
      id: 'recon', icon: '🛠️', title: 'Production Debugging Lab', tab: 'recon', color: '#FF6B9D',
      blurb: 'Diagnose and fix 4 real-world SQL & ETL incidents: duplicate-SKU fan-outs, split work-order grain inflation, UTC timezone shifts & empty files.',
      topics: ['reconciliation', 'grain bugs', 'timezones', 'row-count gates']
    }
  ],

  url(section) {
    const s = typeof section === 'string' ? this.SECTIONS.find(x => x.id === section) : section;
    if (!s) return this.BASE;
    return this.BASE + '?tab=' + encodeURIComponent(s.tab);
  },

  _esc(v) {
    return String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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
