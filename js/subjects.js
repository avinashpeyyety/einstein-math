/* Track P — multi-subject catalog + curriculum normalize (schema v3, X1).
 * Subjects: math (live) + physics (soon). Progress is keyed `subject:track` in js/storage.js. */
const Subjects = {
  CATALOG: [
    { id: 'math', label: 'Math', status: 'live', blurb: 'Numbers, shapes & cosmic adventures' },
    { id: 'physics', label: 'Physics', status: 'soon', blurb: 'Pushes, ramps, magnets & light with Einstein — coming soon' },
  ],

  defaultId: 'math',

  get(id) {
    return this.CATALOG.find((s) => s.id === id) || this.CATALOG[0];
  },

  isLive(id) {
    const s = this.CATALOG.find((x) => x.id === id);
    return !!(s && s.status === 'live');
  },

  /**
   * Legacy curriculum has top-level tracks. Schema v3 wraps subjects.{math,physics}.tracks.
   * Keep curriculum.tracks pointing at the active subject's tracks for back-compat.
   */
  normalizeCurriculum(raw, activeSubjectId) {
    if (!raw || typeof raw !== 'object') return raw;
    const sid = this.isLive(activeSubjectId) ? activeSubjectId : this.defaultId;
    let subjects = raw.subjects;
    if (!subjects || typeof subjects !== 'object') {
      subjects = {
        math: { id: 'math', label: 'Math', status: 'live', tracks: raw.tracks || {} },
        physics: { id: 'physics', label: 'Physics', status: 'soon', tracks: {} },
      };
    } else {
      // Drop stub-era subjects (science/geography) — v3 is math + physics only
      subjects = { math: subjects.math, physics: subjects.physics || { id: 'physics', label: 'Physics', status: 'soon', tracks: {} } };
    }
    // Ensure math has tracks
    if (!subjects.math) {
      subjects.math = { id: 'math', label: 'Math', status: 'live', tracks: raw.tracks || {} };
    }
    if (!subjects.math.tracks || !Object.keys(subjects.math.tracks).length) {
      subjects.math.tracks = raw.tracks || {};
    }
    const active = subjects[sid] || subjects.math;
    const tracks = (active && active.tracks && Object.keys(active.tracks).length)
      ? active.tracks
      : subjects.math.tracks;
    return {
      ...raw,
      meta: {
        ...(raw.meta || {}),
        schemaVersion: raw.meta && raw.meta.schemaVersion ? raw.meta.schemaVersion : 3,
      },
      subjects,
      tracks,
      activeSubjectId: sid,
    };
  },
};

window.Subjects = Subjects;
