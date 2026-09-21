/* Track P — multi-subject catalog + curriculum normalize (schema v3 stub) */
const Subjects = {
  CATALOG: [
    { id: 'math', label: 'Math', status: 'live', blurb: 'Numbers, shapes & cosmic adventures' },
    { id: 'science', label: 'Science', status: 'soon', blurb: 'Living things, matter & sky — coming soon' },
    { id: 'geography', label: 'Geography', status: 'soon', blurb: 'Maps, places & climate-lite — coming soon' },
  ],

  defaultId: 'math',

  get(id) {
    return this.CATALOG.find((s) => s.id === id) || this.CATALOG[0];
  },

  isLive(id) {
    const s = this.get(id);
    return !!(s && s.status === 'live');
  },

  /**
   * Legacy curriculum has top-level tracks. Schema v3 wraps subjects.*.tracks.
   * Keep curriculum.tracks pointing at the active subject's tracks for back-compat.
   */
  normalizeCurriculum(raw, activeSubjectId) {
    if (!raw || typeof raw !== 'object') return raw;
    const sid = this.isLive(activeSubjectId) ? activeSubjectId : this.defaultId;
    let subjects = raw.subjects;
    if (!subjects || typeof subjects !== 'object') {
      subjects = {
        math: { id: 'math', label: 'Math', status: 'live', tracks: raw.tracks || {} },
        science: { id: 'science', label: 'Science', status: 'soon', tracks: {} },
        geography: { id: 'geography', label: 'Geography', status: 'soon', tracks: {} },
      };
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
