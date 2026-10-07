/* Track P — multi-subject catalog + curriculum normalize (schema v3, X1) + lazy subject packs (X2).
 * Subjects: math (live) + physics (live since X4: sim lessons for ages 5–6 (X6), 7–8 and 9–10; an age track
 * without physics lessons shows the X3 coming-soon state). Progress is keyed `subject:track` in js/storage.js. No other subjects (Chief: math + physics only). */
const Subjects = {
  CATALOG: [
    { id: 'math', label: 'Math', status: 'live', blurb: 'Numbers, shapes & cosmic adventures' },
    { id: 'physics', label: 'Physics', status: 'live', blurb: "Einstein's push, float & ramp labs + 3D Space Lab (planets, rockets, stars)" },
  ],

  defaultId: 'math',

  get(id) {
    return this.CATALOG.find((s) => s.id === id) || this.CATALOG[0];
  },

  /** X3: any catalog subject can be chosen in the switcher (physics shows its coming-soon state). */
  isSelectable(id) {
    return this.CATALOG.some((x) => x.id === id);
  },

  isLive(id) {
    const s = this.CATALOG.find((x) => x.id === id);
    return !!(s && s.status === 'live');
  },

  /* ---------- X2: lazy subject packs ----------
   * Each subject's lessons live in data/subjects/<id>.json ({ meta, tracks }). Only the packs a session
   * needs are fetched (math at boot; another subject when it is opened); the service worker precaches
   * the math pack and caches any other pack on first use. */
  packUrl(id) {
    return 'data/subjects/' + this.get(id).id + '.json';
  },

  _packs: {},

  /** Fetch a subject pack once per session (memoised); a failed fetch can be retried. */
  loadPack(id, fetchFn) {
    const sid = this.get(id).id;
    if (!this._packs[sid]) {
      const f = fetchFn || ((u) => fetch(u));
      this._packs[sid] = Promise.resolve()
        .then(() => f(this.packUrl(sid)))
        .then((res) => {
          if (!res || !res.ok) throw new Error('Could not load the ' + sid + ' lessons (' + (res ? res.status : 'offline') + ')');
          return res.json();
        })
        .then((pack) => {
          if (!pack || typeof pack !== 'object' || !pack.tracks || typeof pack.tracks !== 'object') throw new Error('The ' + sid + ' lessons file is not valid');
          return pack;
        })
        .catch((err) => {
          delete this._packs[sid];
          throw err;
        });
    }
    return this._packs[sid];
  },

  isPackLoaded(curriculum, id) {
    const s = curriculum && curriculum.subjects && curriculum.subjects[id];
    return !!(s && s.packLoaded);
  },

  /** Put a loaded pack's tracks under subjects[id] and re-point curriculum.tracks at the active subject. */
  applyPack(curriculum, id, pack, activeSubjectId) {
    const sid = this.get(id).id;
    const base = curriculum && curriculum.subjects ? curriculum : this.normalizeCurriculum(curriculum || { tracks: {} }, this.defaultId);
    const cat = this.get(sid);
    const prev = base.subjects[sid] || { id: sid, label: cat.label, status: cat.status };
    const subjects = { ...base.subjects, [sid]: { ...prev, tracks: (pack && pack.tracks) || {}, packLoaded: true, packVersion: (pack && pack.meta && pack.meta.version) || null } };
    const meta = sid === this.defaultId && pack && pack.meta ? { ...base.meta, ...pack.meta } : base.meta;
    return this.normalizeCurriculum({ ...base, meta, subjects }, activeSubjectId || base.activeSubjectId || sid);
  },

  /** Boot / switch helper: the math pack is always the base; the active subject's pack is added on demand. */
  async loadCurriculum(activeSubjectId, fetchFn) {
    let cur = this.applyPack(null, this.defaultId, await this.loadPack(this.defaultId, fetchFn), this.defaultId);
    const sid = this.isSelectable(activeSubjectId) ? activeSubjectId : this.defaultId;
    if (sid !== this.defaultId) cur = this.applyPack(cur, sid, await this.loadPack(sid, fetchFn), sid);
    return cur;
  },

  /**
   * Legacy curriculum has top-level tracks. Schema v3 wraps subjects.{math,physics}.tracks.
   * Keep curriculum.tracks pointing at the active subject's tracks for back-compat.
   */
  normalizeCurriculum(raw, activeSubjectId) {
    if (!raw || typeof raw !== 'object') return raw;
    const sid = this.isSelectable(activeSubjectId) ? activeSubjectId : this.defaultId;
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
    // X3: curriculum.tracks is the active subject's own tracks — never math lessons under another subject
    const active = subjects[sid] || subjects.math;
    const tracks = sid === this.defaultId
      ? subjects.math.tracks
      : ((active && active.tracks) || {});
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
