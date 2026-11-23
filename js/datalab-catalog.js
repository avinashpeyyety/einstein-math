/* Data Lab Catalog — mirrors js/space.js so clicking "🗄️ Data Lab" opens seamlessly
 * inside Einstein Math (#screen-data, keeping header, Einstein coach & halftone paper)
 * and each section card deep-links into Data Lab (data-lab/). */
const DataLabCatalog = {
  BASE: 'data-lab/',

  SECTIONS: [
    {
      id: 'track1', icon: '📊', title: 'Track 1: Core SQL & Data Pipelines (L1–9)', query: '', color: '#E8892F',
      blurb: 'Start from Day-1 SQL basics (SELECT, WHERE, GROUP BY) and build through Python CSV cleaning, Star Schemas, bulk COPY, T-SQL dialects, partitioning & pipeline auditing.',
      topics: ['Beginner friendly', 'Voice + diagrams', 'Table previews', 'Real Postgres 18']
    },
    {
      id: 'track2', icon: '🔬', title: 'Track 2: Analytical SQL & Modeling (L10–15)', query: '?track=2', color: '#8B74C9',
      blurb: 'Level up to senior analytics engineering: Window functions, ROW_NUMBER() dedup, SCD Type 2 point-in-time joins, UTC/local timezones, WITH RECURSIVE BOMs & JSONB unnesting.',
      topics: ['Windows & dedup', 'SCD Type 2', 'Timezones', 'Recursive + JSONB']
    },
    {
      id: 'playground', icon: '🐘', title: 'Full PostgreSQL 18 SQL Playground', query: '?view=playground', color: '#4A6B82',
      blurb: 'Run real SQL locally in your browser on PostgreSQL 18 (WASM): 15 Beginner→Expert graded labs, Visual EXPLAIN Tree, freeform Scratchpad, live schema & T-SQL ↔ PG guide.',
      topics: ['Real Postgres 18', '15 graded labs', 'Visual EXPLAIN tree', 'T-SQL ↔ PG guide']
    },
    {
      id: 'partitions', icon: '⚡', title: 'Lesson 8: Making Large Tables Fast', query: '?lesson=8', color: '#5E7D54',
      blurb: 'Interactive 72-month range partitioning explorer: see how sargable date bounds drop queries from 21.4s to 1.4s, then inspect the Visual EXPLAIN plan on real PostgreSQL 18.',
      topics: ['72-month pruning', 'Sargable ranges', 'Visual EXPLAIN plan']
    },
    {
      id: 'takeaways', icon: '📝', title: 'Key Takeaways & Quick Review', query: '?view=takeaways', color: '#C25E3E',
      blurb: 'Review your saved one-sentence engineering rules across all 15 lessons and run quick PostgreSQL 18 refreshers anytime.',
      topics: ['15 core rules', 'Quick review', '2-track roadmap']
    }
  ],

  url(section) {
    const s = typeof section === 'string' ? this.SECTIONS.find(x => x.id === section) : section;
    if (!s) return this.BASE;
    return this.BASE + (s.query || '');
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
      <span class="btn btn-cyan btn-sm">Start ▶</span>
    </a>`).join('');
  }
};

if (typeof module !== 'undefined' && module.exports) module.exports = DataLabCatalog;
