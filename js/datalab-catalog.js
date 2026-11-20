/* Data Lab Catalog — mirrors js/space.js so clicking "🗄️ Data Lab" opens seamlessly
 * inside Einstein Math (#screen-data, keeping header, Einstein coach & halftone paper)
 * and each section card deep-links into The River of Data (data-lab/). */
const DataLabCatalog = {
  BASE: 'data-lab/',

  SECTIONS: [
    {
      id: 'river', icon: '🌊', title: 'The River of Data (7-Chapter Zen Journey)', query: '', color: '#E8892F',
      blurb: 'Learn PostgreSQL 18, SQL Server (T-SQL), SSIS & Python effortlessly—one calm breath at a time. Voice-narrated visual koans, tactile sandboxes, and real Postgres grading that heal a living river.',
      topics: ['Orion voice & canvas', '7 timeless chapters', '4-beat focus flow', 'living river']
    },
    {
      id: 'studio', icon: '🐘', title: 'Full PostgreSQL 18 SQL Studio', query: '?view=studio', color: '#4A6B82',
      blurb: 'Jump straight into real PostgreSQL 18 running locally in your browser (WASM): 13 Beginner→Expert graded labs, live schema explorer, freeform scratchpad & 10-row T-SQL ↔ PG dialect map.',
      topics: ['real Postgres 18', '13 graded labs', 'T-SQL ↔ PG map', 'live schema']
    },
    {
      id: 'partitions', icon: '🗂️', title: 'Chapter VI: Effortless Speed (Partitions)', query: '?ch=6', color: '#5E7D54',
      blurb: 'Feel how 72 monthly range partitions and sargable date bounds drop queries from 21.4s to 1.4s, then prove it on a real PostgreSQL 18 EXPLAIN plan.',
      topics: ['72-month pruning', 'sargable ranges', 'real EXPLAIN plan']
    },
    {
      id: 'mirror', icon: '⚖️', title: 'Chapter VII: The Mirror (Reconciliation)', query: '?ch=7', color: '#9B7EDE',
      blurb: 'Master fan-out-safe CTE reconciliation, local timezone boundaries, and recursive Bill-of-Materials queries to light the harbour watchtower lantern.',
      topics: ['CTE reconciliation', 'zero fan-out', 'timezones', 'WITH RECURSIVE']
    },
    {
      id: 'journal', icon: '📖', title: 'Field Journal & Spaced Recall', query: '?view=journal', color: '#C25E3E',
      blurb: 'Review your collected one-sentence Data Koans and clear the moss with gentle spaced-recall practice on real PostgreSQL 18.',
      topics: ['7 Data Koans', 'spaced recall', 'World Map']
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
      <span class="btn btn-cyan btn-sm">Enter ▶</span>
    </a>`).join('');
  }
};

if (typeof module !== 'undefined' && module.exports) module.exports = DataLabCatalog;
