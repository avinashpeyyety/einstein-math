/* Data Lab Catalog — mirrors js/space.js so clicking "🗄️ Data Lab" opens seamlessly
 * inside Einstein Math (#screen-data, keeping header, Einstein coach & halftone paper)
 * and each section card deep-links into Data Lab (data-lab/). */
const DataLabCatalog = {
  BASE: 'data-lab/',

  SECTIONS: [
    {
      id: 'path', icon: '📊', title: 'Interactive Data Pipeline Path (9 Lessons)', query: '', color: '#E8892F',
      blurb: 'Start from Day-1 SQL basics (SELECT, WHERE, GROUP BY) and build all the way to Python ETL, Star Schemas, bulk COPY, partitioning & pipeline auditing — one calm, visual step at a time.',
      topics: ['Beginner friendly', 'Voice + diagrams', 'Live table previews', 'Real Postgres 18']
    },
    {
      id: 'playground', icon: '🐘', title: 'Full PostgreSQL 18 SQL Playground', query: '?view=playground', color: '#4A6B82',
      blurb: 'Run real SQL locally in your browser on PostgreSQL 18 (WASM): 13 Beginner→Expert graded labs, freeform Scratchpad, live schema inspector & 10-row T-SQL ↔ PostgreSQL guide.',
      topics: ['Real Postgres 18', '13 graded labs', 'T-SQL ↔ PG guide', 'Live schema']
    },
    {
      id: 'partitions', icon: '⚡', title: 'Lesson 8: Making Large Tables Fast', query: '?lesson=8', color: '#5E7D54',
      blurb: 'Interactive 72-month range partitioning explorer: see how sargable date bounds drop queries from 21.4s to 1.4s, then verify it on a real PostgreSQL 18 EXPLAIN plan.',
      topics: ['72-month pruning', 'Sargable ranges', 'Real EXPLAIN plan']
    },
    {
      id: 'audit', icon: '⚖️', title: 'Lesson 9: Verifying Pipeline Accuracy', query: '?lesson=9', color: '#8B74C9',
      blurb: 'Learn why raw table joins multiply totals and how aggregate-first CTE reconciliation catches real discrepancies with 100% precision.',
      topics: ['CTE reconciliation', 'Zero fan-out', 'Data auditing']
    },
    {
      id: 'takeaways', icon: '📝', title: 'Key Takeaways & Quick Review', query: '?view=takeaways', color: '#C25E3E',
      blurb: 'Review your saved one-sentence engineering rules from completed lessons and run quick PostgreSQL 18 refreshers anytime.',
      topics: ['9 core rules', 'Quick review', 'Curriculum overview']
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
