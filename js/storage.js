/* Multi-profile progress persistence via localStorage (device-local only)
 * Schema v3 (X1): per-user progress keyed `subject:track` (e.g. "math:ages-7-8"),
 * with mastery + spaced review fields on each lesson blob.
 * v2 stores (user.tracks keyed by bare track id) migrate on load; the v2 key is left untouched.
 */
const STORAGE_KEY_V1 = 'einstein-math-progress-v1';
const STORAGE_KEY_V2 = 'einstein-math-v2';
const STORAGE_KEY = 'einstein-math-v3';
const SCHEMA_VERSION = 3;
const SUBJECT_IDS = ['math', 'physics'];
const DEFAULT_SUBJECT = 'math';

const AVATAR_COLORS = ['#FF6B35', '#4ECDC4', '#FFE66D', '#FF6B9D', '#A78BFA', '#95E1D3'];

/** Spaced-review intervals (days) on successive successful reviews */
const REVIEW_INTERVALS_DAYS = [1, 3, 7];

const Storage = {
  REVIEW_INTERVALS_DAYS,
  STORAGE_KEY,
  STORAGE_KEY_V2,
  SCHEMA_VERSION,
  SUBJECT_IDS,

  /** "math" + "ages-7-8" → "math:ages-7-8". A key that already has a subject passes through. */
  progressKey(subjectId, trackId) {
    const t = String(trackId || '');
    if (t.includes(':')) return t;
    return `${subjectId || DEFAULT_SUBJECT}:${t}`;
  },

  /** "math:ages-7-8" → { subject: 'math', trackId: 'ages-7-8' }; bare v2 ids are math. */
  parseProgressKey(key) {
    const k = String(key || '');
    const i = k.indexOf(':');
    if (i < 0) return { subject: DEFAULT_SUBJECT, trackId: k };
    return { subject: k.slice(0, i) || DEFAULT_SUBJECT, trackId: k.slice(i + 1) };
  },

  sanitizeSubject(id) {
    // Only live subjects can be active; physics is still "soon", so anything else falls back to math.
    const live = (typeof Subjects !== 'undefined' && Subjects.isLive) ? Subjects.isLive(id) : id === DEFAULT_SUBJECT;
    return id && SUBJECT_IDS.includes(id) && live ? id : DEFAULT_SUBJECT;
  },

  /**
   * v2 → v3 for one user. Moves user.tracks[tid] → user.progress["math:tid"].
   * Idempotent; never drops data (a key present on both sides is merged, newer lesson wins).
   */
  migrateUserToV3(user) {
    if (!user || typeof user !== 'object') return user;
    if (!user.progress || typeof user.progress !== 'object') user.progress = {};
    const legacy = user.tracks;
    if (legacy && typeof legacy === 'object') {
      Object.keys(legacy).forEach(tid => {
        const key = this.progressKey(DEFAULT_SUBJECT, tid);
        user.progress[key] = user.progress[key]
          ? this.mergeTrackProgress(user.progress[key], legacy[tid])
          : this.normalizeTrackProgress(legacy[tid]);
      });
    }
    delete user.tracks;
    Object.keys(user.progress).forEach(key => {
      user.progress[key] = this.normalizeTrackProgress(user.progress[key]);
    });
    if (!user.trackBySubject || typeof user.trackBySubject !== 'object') user.trackBySubject = {};
    if (user.trackId && !user.trackBySubject[DEFAULT_SUBJECT]) user.trackBySubject[DEFAULT_SUBJECT] = user.trackId;
    if (!user.trackId && user.trackBySubject[DEFAULT_SUBJECT]) user.trackId = user.trackBySubject[DEFAULT_SUBJECT];
    return user;
  },

  /** FNV-1a 32-bit + length: cheap content fingerprint for the legacy v2 key. */
  hashString(str) {
    const t = String(str == null ? '' : str);
    let h = 0x811c9dc5;
    for (let i = 0; i < t.length; i++) {
      h ^= t.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, '0') + ':' + t.length;
  },

  /**
   * Marker for the v2 key contents v3 has absorbed: { hash, absorbedAt, v2UpdatedAt }.
   * Stored on the v3 store as `legacyV2`; device-local (not exported).
   */
  legacyV2Marker(rawV2, v2Store) {
    let v2UpdatedAt = null;
    Object.values((v2Store && v2Store.users) || {}).forEach(u => {
      if (u && u.updatedAt && this.isNewerISO(u.updatedAt, v2UpdatedAt)) v2UpdatedAt = u.updatedAt;
    });
    return { hash: this.hashString(rawV2), absorbedAt: new Date().toISOString(), v2UpdatedAt };
  },

  /**
   * Old-tab safety: an old (pre-X1) tab keeps saving to the v2 key after migration.
   * If the v2 key's content differs from what v3 last absorbed, migrate it in memory and merge
   * it in (same newest-lesson-wins rule as import). v3-only progress is never dropped.
   * Users missing from v3 are only added back if the old tab touched them after the last absorb
   * (so a profile deleted in v3 is not resurrected by an unchanged v2 copy).
   * Returns true if v3 changed. Never writes the v2 key.
   */
  absorbLegacyV2(store, rawV2) {
    if (rawV2 == null) return false;
    const prev = store.legacyV2 && typeof store.legacyV2 === 'object' ? store.legacyV2 : null;
    const hash = this.hashString(rawV2);
    if (prev && prev.hash === hash) return false;
    let v2 = null;
    try { v2 = JSON.parse(rawV2); } catch { v2 = null; }
    if (this.isStoreShape(v2)) {
      Object.keys(v2.users).forEach(id => {
        const v2u = v2.users[id];
        if (!v2u || typeof v2u !== 'object') return;
        const local = store.users[id];
        if (local) {
          const before = JSON.parse(JSON.stringify(local.progress || {}));
          const merged = this.mergeUser(local, { ...v2u, id });
          // Stars: import keeps max(); here both sides grew from the same base, so also credit
          // each lesson the old tab newly passed that v3 had not.
          Object.keys(merged.progress || {}).forEach(key => {
            const prevTp = before[key];
            if (!prevTp) return;
            const passed = L => !!L && L.status === 'done' && (!(L.checkTotal > 0) || (L.checkCorrect || 0) / L.checkTotal >= 0.6);
            let gained = 0;
            Object.entries(merged.progress[key].lessons || {}).forEach(([lid, L]) => {
              if (passed(L) && !passed(prevTp.lessons && prevTp.lessons[lid])) gained++;
            });
            merged.progress[key].stars = Math.max(merged.progress[key].stars || 0, (prevTp.stars || 0) + gained);
          });
          store.users[id] = merged;
        } else if (!prev || !this.isNewerISO(prev.absorbedAt, v2u.updatedAt)) { // touched at/after last absorb
          store.users[id] = this.mergeUser(null, { ...v2u, id });
        }
      });
      if (!store.activeUserId || !store.users[store.activeUserId]) {
        store.activeUserId = v2.activeUserId && store.users[v2.activeUserId] ? v2.activeUserId : (Object.keys(store.users)[0] || null);
      }
    }
    store.legacyV2 = this.legacyV2Marker(rawV2, v2);
    return true;
  },

  /** v2 / stub-v3 store → v3 in place. Idempotent. */
  migrateStoreToV3(store) {
    if (!store || typeof store !== 'object') return store;
    if (!store.users || typeof store.users !== 'object') store.users = {};
    Object.keys(store.users).forEach(id => {
      if (store.users[id] && typeof store.users[id] === 'object') this.migrateUserToV3(store.users[id]);
    });
    store.version = SCHEMA_VERSION;
    return store;
  },

  trackDefaults() {
    return {
      started: false,
      diagnosticDone: false,
      diagnosticScores: {},
      recommendedUnits: [],
      lessons: {},
      currentLessonId: null,
      stars: 0
    };
  },

  emptyStore() {
    return {
      version: SCHEMA_VERSION,
      appVersion: '2.3.0',
      activeUserId: null,
      users: {},
      prefs: {
        speechEnabled: false,
        activeSubject: 'math'
      }
    };
  },

  uid() {
    return 'u_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  },

  avatarColorFor(name) {
    let h = 0;
    const s = String(name || 'E');
    for (let i = 0; i < s.length; i++) h = (h + s.charCodeAt(i) * (i + 1)) % AVATAR_COLORS.length;
    return AVATAR_COLORS[h];
  },

  /** Defaults for a lesson progress blob (mastery fields) */
  lessonDefaults() {
    return {
      status: 'ready',
      mastery: 0,
      masteryLevel: 'learning', // learning | practicing | mastered | needs_review
      practiceCorrect: 0,
      practiceTotal: 0,
      checkCorrect: 0,
      checkTotal: 0,
      attempts: 0,
      streak: 0,
      reviewIntervalDays: REVIEW_INTERVALS_DAYS[0],
      lastAt: null,
      nextReviewAt: null,
      missedCheckIds: []
    };
  },

  /** Migrate older lesson blobs that lack mastery fields */
  normalizeLesson(raw) {
    const base = this.lessonDefaults();
    if (!raw || typeof raw !== 'object') return { ...base };
    const merged = { ...base, ...raw };
    const hadMastery = Object.prototype.hasOwnProperty.call(raw, 'mastery');
    const hadLevel = Object.prototype.hasOwnProperty.call(raw, 'masteryLevel');
    const hadAttempts = Object.prototype.hasOwnProperty.call(raw, 'attempts');
    const hadStreak = Object.prototype.hasOwnProperty.call(raw, 'streak');
    const hadInterval = Object.prototype.hasOwnProperty.call(raw, 'reviewIntervalDays');

    if (!hadMastery || typeof merged.mastery !== 'number' || Number.isNaN(merged.mastery)) {
      if (merged.status === 'done') {
        const ct = merged.checkTotal || 0;
        const cc = merged.checkCorrect || 0;
        merged.mastery = ct > 0 ? Math.min(1, cc / ct) : 0.8;
      } else {
        merged.mastery = 0;
      }
    }
    if (!hadLevel || !merged.masteryLevel) {
      if (merged.status === 'done' && merged.mastery >= 0.8) merged.masteryLevel = 'mastered';
      else if (merged.status === 'done' && merged.mastery < 0.6) merged.masteryLevel = 'needs_review';
      else if (merged.status === 'done') merged.masteryLevel = 'practicing';
      else if (merged.status === 'in_progress') merged.masteryLevel = 'practicing';
      else merged.masteryLevel = 'learning';
    }
    if (!hadAttempts || typeof merged.attempts !== 'number') {
      merged.attempts = merged.status === 'done' ? 1 : 0;
    }
    if (!hadStreak || typeof merged.streak !== 'number') {
      merged.streak = merged.masteryLevel === 'mastered' ? 1 : 0;
    }
    if (!hadInterval || typeof merged.reviewIntervalDays !== 'number') {
      merged.reviewIntervalDays = REVIEW_INTERVALS_DAYS[0];
    }
    // Schedule a first review for legacy completed lessons that have none
    if (merged.status === 'done' && !raw.nextReviewAt && merged.masteryLevel === 'mastered') {
      merged.nextReviewAt = this.addDaysISO(merged.lastAt || new Date(), merged.reviewIntervalDays || 1);
    }
    if (!Array.isArray(merged.missedCheckIds)) merged.missedCheckIds = [];
    return merged;
  },

  normalizeTrackProgress(trackProgress) {
    const tp = { ...this.trackDefaults(), ...(trackProgress || {}) };
    const lessons = {};
    Object.keys(tp.lessons || {}).forEach(id => {
      lessons[id] = this.normalizeLesson(tp.lessons[id]);
    });
    tp.lessons = lessons;
    return tp;
  },

  migrateV1IfNeeded(store) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_V1);
      if (!raw) return store;
      if (store.users && Object.keys(store.users).length > 0) {
        return store;
      }
      const v1 = JSON.parse(raw);
      const id = this.uid();
      const trackId = 'ages-7-8';
      const trackProg = this.normalizeTrackProgress({
        ...this.trackDefaults(),
        started: !!v1.started,
        diagnosticDone: !!v1.diagnosticDone,
        diagnosticScores: v1.diagnosticScores || {},
        recommendedUnits: v1.recommendedUnits || [],
        lessons: v1.lessons || {},
        currentLessonId: v1.currentLessonId || null,
        stars: v1.stars || 0
      });
      store.users[id] = {
        id,
        displayName: v1.name || 'Explorer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        trackId,
        trackBySubject: { [DEFAULT_SUBJECT]: trackId },
        avatarColor: this.avatarColorFor(v1.name || 'Explorer'),
        progress: { [this.progressKey(DEFAULT_SUBJECT, trackId)]: trackProg }
      };
      store.activeUserId = id;
      this.saveStore(store);
      localStorage.removeItem(STORAGE_KEY_V1);
      return store;
    } catch {
      return store;
    }
  },

  isStoreShape(store) {
    return !!(store && typeof store === 'object' && (store.version === 2 || store.version === SCHEMA_VERSION) &&
      store.users && typeof store.users === 'object');
  },

  loadStore() {
    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      const rawV2 = localStorage.getItem(STORAGE_KEY_V2);
      let fromLegacyKey = false;
      if (raw === null) {
        // First run on v3: read the v2 store (left in place as a rollback copy).
        raw = rawV2;
        fromLegacyKey = raw !== null;
      }
      let store = raw ? JSON.parse(raw) : this.emptyStore();
      if (!this.isStoreShape(store)) { store = this.emptyStore(); fromLegacyKey = false; }
      const needsMigration = store.version !== SCHEMA_VERSION ||
        Object.values(store.users).some(u => u && (u.tracks || !u.progress));
      store = this.migrateV1IfNeeded(store);
      store = this.normalizeStoreMeta(store); // runs migrateStoreToV3 + lesson normalize
      let absorbed = false;
      if (fromLegacyKey) {
        // Fresh migration: this v2 content is now absorbed.
        store.legacyV2 = this.legacyV2Marker(rawV2, store);
      } else if (rawV2 !== null) {
        absorbed = this.absorbLegacyV2(store, rawV2);
      }
      if ((fromLegacyKey || needsMigration || absorbed) && Object.keys(store.users).length) {
        try { this.saveStore(store); } catch { /* quota: stay in memory; v2 key still holds the data */ }
      }
      return store;
    } catch {
      return this.emptyStore();
    }
  },

  saveStore(store) {
    store.version = SCHEMA_VERSION;
    store.updatedAt = new Date().toISOString();
    store.appVersion = store.appVersion || '2.3.0';
    if (!store.prefs || typeof store.prefs !== 'object') store.prefs = { speechEnabled: false, activeSubject: DEFAULT_SUBJECT };
    if (!store.prefs.activeSubject) store.prefs.activeSubject = DEFAULT_SUBJECT;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  },

  listUsers(store) {
    return Object.values(store.users || {}).sort(
      (a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))
    );
  },

  getUser(store, userId) {
    return store.users[userId] || null;
  },

  getActiveUser(store) {
    if (!store.activeUserId) return null;
    return store.users[store.activeUserId] || null;
  },

  /** Track progress for subject (default math). trackId may be bare ("ages-7-8") or keyed ("math:ages-7-8"). */
  ensureTrackProgress(user, trackId, subjectId) {
    if (user.tracks) this.migrateUserToV3(user);
    if (!user.progress) user.progress = {};
    const key = this.progressKey(subjectId || DEFAULT_SUBJECT, trackId);
    if (!user.progress[key]) {
      user.progress[key] = this.trackDefaults();
    } else {
      user.progress[key] = this.normalizeTrackProgress(user.progress[key]);
    }
    return user.progress[key];
  },

  getTrackProgress(user, trackId, subjectId) {
    if (!user) return this.trackDefaults();
    return this.ensureTrackProgress(user, trackId || user.trackId, subjectId);
  },

  /** All math progress keyed by bare track id (v2 view) — for callers that still think in tracks. */
  getSubjectTracks(user, subjectId) {
    const sid = subjectId || DEFAULT_SUBJECT;
    const out = {};
    Object.keys((user && user.progress) || {}).forEach(key => {
      const p = this.parseProgressKey(key);
      if (p.subject === sid) out[p.trackId] = user.progress[key];
    });
    return out;
  },

  touchUser(user) {
    user.updatedAt = new Date().toISOString();
  },

  createUser(store, { displayName, trackId }) {
    const id = this.uid();
    const name = (displayName || 'Explorer').trim().slice(0, 24) || 'Explorer';
    const tid = trackId || 'ages-7-8';
    const user = {
      id,
      displayName: name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      trackId: tid,
      trackBySubject: { [DEFAULT_SUBJECT]: tid },
      avatarColor: this.avatarColorFor(name),
      progress: { [this.progressKey(DEFAULT_SUBJECT, tid)]: this.trackDefaults() }
    };
    store.users[id] = user;
    store.activeUserId = id;
    this.saveStore(store);
    return user;
  },

  setActiveUser(store, userId) {
    if (!store.users[userId]) return null;
    store.activeUserId = userId;
    this.touchUser(store.users[userId]);
    this.saveStore(store);
    return store.users[userId];
  },

  renameUser(store, userId, displayName) {
    const user = store.users[userId];
    if (!user) return null;
    user.displayName = (displayName || '').trim().slice(0, 24) || user.displayName;
    user.avatarColor = this.avatarColorFor(user.displayName);
    this.touchUser(user);
    this.saveStore(store);
    return user;
  },

  /** W1b: comic avatar (device-local). Only generated PNGs are kept; the source photo never is. */
  setComicAvatar(store, userId, png128, png512) {
    const user = store.users[userId];
    if (!user || !png128) return null;
    user.avatarImage = png128;
    user.avatarImage512 = png512 || null;
    this.touchUser(user);
    try {
      this.saveStore(store);
    } catch (err) {
      // localStorage full: keep only the small list-size image
      user.avatarImage512 = null;
      this.saveStore(store);
    }
    return user;
  },

  clearComicAvatar(store, userId) {
    const user = store.users[userId];
    if (!user) return null;
    delete user.avatarImage;
    delete user.avatarImage512;
    this.touchUser(user);
    this.saveStore(store);
    return user;
  },

  deleteUser(store, userId) {
    if (!store.users[userId]) return store;
    delete store.users[userId];
    if (store.activeUserId === userId) {
      const rest = Object.keys(store.users);
      store.activeUserId = rest[0] || null;
    }
    this.saveStore(store);
    return store;
  },

  setUserTrack(store, userId, trackId) {
    const user = store.users[userId];
    if (!user) return null;
    user.trackId = trackId;
    if (!user.trackBySubject) user.trackBySubject = {};
    user.trackBySubject[DEFAULT_SUBJECT] = trackId;
    this.ensureTrackProgress(user, trackId);
    this.touchUser(user);
    this.saveStore(store);
    return user;
  },

  saveTrackProgress(store, userId, trackId, trackProgress, subjectId) {
    const user = store.users[userId];
    if (!user) return;
    if (user.tracks) this.migrateUserToV3(user);
    if (!user.progress) user.progress = {};
    const key = this.progressKey(subjectId || DEFAULT_SUBJECT, trackId);
    const p = this.parseProgressKey(key);
    user.progress[key] = this.normalizeTrackProgress(trackProgress);
    if (!user.trackBySubject) user.trackBySubject = {};
    user.trackBySubject[p.subject] = p.trackId;
    if (p.subject === DEFAULT_SUBJECT) user.trackId = p.trackId;
    this.touchUser(user);
    this.saveStore(store);
  },

  addDaysISO(fromDate, days) {
    const d = fromDate instanceof Date ? new Date(fromDate.getTime()) : new Date(fromDate || Date.now());
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    return d.toISOString();
  },

  /**
   * Apply mastery rules after a check attempt.
   * checkPct: 0–1. opts: { isReview, missedCheckIds }
   * Rules (also in README):
   *  - check ≥ ~80% → mastered / high mastery; schedule first review (~1–2d) or bump interval
   *  - check < 60% → needs_review; shorter interval
   *  - spaced: 1d → 3d → 7d on success; fail resets toward 1d
   */
  applyMasteryResult(trackProgress, lessonId, stats, opts = {}) {
    const prev = this.normalizeLesson(trackProgress.lessons[lessonId]);
    const ct = stats.checkTotal || 0;
    const cc = stats.checkCorrect || 0;
    const checkPct = ct > 0 ? cc / ct : 0;
    const now = new Date();
    const missed = opts.missedCheckIds || stats.missedCheckIds || [];

    let mastery = checkPct;
    let masteryLevel;
    let interval = prev.reviewIntervalDays || REVIEW_INTERVALS_DAYS[0];
    let streak = prev.streak || 0;
    let nextReviewAt;

    if (checkPct >= 0.8) {
      masteryLevel = 'mastered';
      mastery = Math.max(checkPct, 0.8);
      streak = streak + 1;
      if (opts.isReview) {
        const curIdx = REVIEW_INTERVALS_DAYS.indexOf(prev.reviewIntervalDays);
        const nextIdx = Math.min(REVIEW_INTERVALS_DAYS.length - 1, (curIdx < 0 ? 0 : curIdx) + 1);
        interval = REVIEW_INTERVALS_DAYS[nextIdx];
      } else {
        interval = REVIEW_INTERVALS_DAYS[0]; // first review in ~1 day (or 2 if already streaking)
      }
      const days = opts.isReview ? interval : (streak > 1 ? 2 : 1);
      nextReviewAt = this.addDaysISO(now, days);
    } else if (checkPct < 0.6) {
      masteryLevel = 'needs_review';
      mastery = checkPct;
      streak = 0;
      interval = REVIEW_INTERVALS_DAYS[0];
      nextReviewAt = this.addDaysISO(now, 1);
    } else {
      masteryLevel = 'practicing';
      mastery = checkPct;
      streak = 0;
      interval = REVIEW_INTERVALS_DAYS[0];
      nextReviewAt = this.addDaysISO(now, 1);
    }

    const alreadyDone = prev.status === 'done';
    const entry = {
      ...prev,
      status: 'done',
      mastery,
      masteryLevel,
      practiceCorrect: stats.practiceCorrect ?? prev.practiceCorrect,
      practiceTotal: stats.practiceTotal ?? prev.practiceTotal,
      checkCorrect: cc,
      checkTotal: ct,
      attempts: (prev.attempts || 0) + 1,
      streak,
      reviewIntervalDays: interval,
      lastAt: now.toISOString(),
      nextReviewAt,
      missedCheckIds: missed
    };

    trackProgress.lessons[lessonId] = entry;
    if (!alreadyDone && checkPct >= 0.6) {
      trackProgress.stars = (trackProgress.stars || 0) + 1;
    }
    trackProgress.currentLessonId = lessonId;
    trackProgress.started = true;
    return entry;
  },

  markLessonDone(trackProgress, lessonId, stats, opts = {}) {
    return this.applyMasteryResult(trackProgress, lessonId, stats, opts);
  },

  setLessonProgress(trackProgress, lessonId, patch) {
    const prev = this.normalizeLesson(trackProgress.lessons[lessonId]);
    trackProgress.lessons[lessonId] = {
      ...prev,
      ...patch,
      masteryLevel: patch.masteryLevel || prev.masteryLevel || 'practicing',
      lastAt: new Date().toISOString()
    };
    if (!trackProgress.lessons[lessonId].status) {
      trackProgress.lessons[lessonId].status = 'in_progress';
    }
    trackProgress.currentLessonId = lessonId;
    trackProgress.started = true;
    return trackProgress;
  },

  /** Lessons whose nextReviewAt <= now (and have been completed at least once) */
  getDueReviews(trackProgress, now = new Date()) {
    const due = [];
    const t = now instanceof Date ? now.getTime() : new Date(now).getTime();
    Object.entries(trackProgress.lessons || {}).forEach(([id, raw]) => {
      const L = this.normalizeLesson(raw);
      if (!L.nextReviewAt) return;
      if (L.status !== 'done' && L.masteryLevel !== 'needs_review') return;
      if (new Date(L.nextReviewAt).getTime() <= t) {
        due.push({ lessonId: id, ...L });
      }
    });
    due.sort((a, b) => String(a.nextReviewAt).localeCompare(String(b.nextReviewAt)));
    return due;
  },

  /** Soft signal: prereq mastered poorly → strengthen first */
  prereqNeedsStrengthen(trackProgress, lesson, trackCurriculum) {
    const prereqs = (lesson && lesson.prerequisites) || [];
    const weak = [];
    prereqs.forEach(pid => {
      const p = trackProgress.lessons[pid];
      if (!p) return;
      const n = this.normalizeLesson(p);
      if (n.masteryLevel === 'needs_review' || (typeof n.mastery === 'number' && n.mastery < 0.5 && n.status === 'done')) {
        weak.push(pid);
      }
    });
    return weak;
  },

  lessonStatus(trackProgress, lessonId, trackCurriculum) {
    const saved = trackProgress.lessons[lessonId]
      ? this.normalizeLesson(trackProgress.lessons[lessonId])
      : null;
    if (saved && saved.status === 'done') {
      if (saved.masteryLevel === 'needs_review') return 'needs_review';
      return 'done';
    }
    if (saved && saved.status === 'in_progress') return 'in_progress';
    const lesson = trackCurriculum.lessons[lessonId];
    if (!lesson) return 'locked';
    const prereqs = lesson.prerequisites || [];
    const unlocked = prereqs.every(pid => {
      const st = trackProgress.lessons[pid]?.status;
      return st === 'done';
    });
    // Soft-lock: after diagnostic, allow access even if prereqs incomplete,
    // but less aggressively for hard chains — if any prereq missing AND not partially started, still ready after diag
    if (prereqs.length === 0) return saved?.status || 'ready';
    if (unlocked) return saved?.status || 'ready';
    if (trackProgress.diagnosticDone) {
      // Soft unlock after diagnostic; UI may show "Strengthen first"
      return saved?.status || 'ready';
    }
    return 'locked';
  },

  unitMasterySummary(trackProgress, unit, trackCurriculum) {
    const ids = unit.lessons || [];
    let mastered = 0;
    let due = 0;
    const now = Date.now();
    ids.forEach(id => {
      const raw = trackProgress.lessons[id];
      if (!raw) return;
      const L = this.normalizeLesson(raw);
      if (L.masteryLevel === 'mastered' || (L.status === 'done' && L.mastery >= 0.8)) mastered++;
      if (L.nextReviewAt && new Date(L.nextReviewAt).getTime() <= now) due++;
    });
    return { total: ids.length, mastered, due };
  },


  /**
   * Parent / family overview for one explorer (device-local only).
   * curriculum: full curriculum object (for labels + unit titles).
   */
  getParentSummary(store, userId, curriculum) {
    const user = store.users[userId];
    if (!user) return null;
    const trackId = user.trackId;
    const track = curriculum && curriculum.tracks ? curriculum.tracks[trackId] : null;
    const tp = this.normalizeTrackProgress(this.getTrackProgress(user, trackId));
    const lessonDefs = track ? track.lessons : {};
    const allIds = Object.keys(lessonDefs);
    let done = 0;
    let mastered = 0;
    const weakSpots = [];
    let lastAt = null;
    allIds.forEach(id => {
      const raw = tp.lessons[id];
      if (!raw) return;
      const L = this.normalizeLesson(raw);
      if (L.status === 'done') done++;
      if (L.masteryLevel === 'mastered' || (L.status === 'done' && L.mastery >= 0.8)) mastered++;
      if (L.masteryLevel === 'needs_review') {
        weakSpots.push({
          lessonId: id,
          title: lessonDefs[id]?.title || id,
          mastery: L.mastery,
          missedCheckIds: L.missedCheckIds || [],
          lastAt: L.lastAt
        });
      }
      if (L.lastAt && (!lastAt || L.lastAt > lastAt)) lastAt = L.lastAt;
    });
    const reviewsDue = this.getDueReviews(tp);
    const units = (track?.units || []).map(unit => {
      const s = this.unitMasterySummary(tp, unit, track);
      return {
        id: unit.id,
        title: unit.title,
        icon: unit.icon || '',
        total: s.total,
        mastered: s.mastered,
        due: s.due
      };
    });
    const recent = Object.entries(tp.lessons || {})
      .map(([id, raw]) => {
        const L = this.normalizeLesson(raw);
        return { lessonId: id, title: lessonDefs[id]?.title || id, lastAt: L.lastAt, masteryLevel: L.masteryLevel, status: L.status };
      })
      .filter(x => x.lastAt)
      .sort((a, b) => String(b.lastAt).localeCompare(String(a.lastAt)))
      .slice(0, 8);

    return {
      userId: user.id,
      displayName: user.displayName,
      avatarColor: user.avatarColor,
      trackId,
      trackLabel: track?.label || trackId,
      ageRange: track?.ageRange || '',
      stars: tp.stars || 0,
      lessonsTotal: allIds.length,
      lessonsDone: done,
      lessonsMastered: mastered,
      reviewsDueCount: reviewsDue.length,
      reviewsDue: reviewsDue.map(r => ({
        lessonId: r.lessonId,
        title: lessonDefs[r.lessonId]?.title || r.lessonId,
        nextReviewAt: r.nextReviewAt,
        masteryLevel: r.masteryLevel
      })),
      weakSpots,
      units,
      recentActivity: recent,
      lastAt,
      diagnosticDone: !!tp.diagnosticDone,
      exportedAt: new Date().toISOString(),
      note: 'Device-local only — not cloud-synced. No passwords or account secrets.'
    };
  },

  normalizeStoreMeta(store) {
    if (!store || typeof store !== 'object') return this.emptyStore();
    store.appVersion = store.appVersion || '2.3.0';
    if (!store.prefs || typeof store.prefs !== 'object') {
      store.prefs = { speechEnabled: false, activeSubject: DEFAULT_SUBJECT };
    } else {
      if (typeof store.prefs.speechEnabled !== 'boolean') {
        store.prefs.speechEnabled = !!store.prefs.speechEnabled;
      }
      // stub-v3 could hold any id; only live subjects stay active (math today)
      store.prefs.activeSubject = this.sanitizeSubject(store.prefs.activeSubject);
    }
    if (!store.users) store.users = {};
    this.migrateStoreToV3(store);
    return store;
  },

  getSpeechEnabled(store) {
    store = this.normalizeStoreMeta(store || this.loadStore());
    return !!store.prefs.speechEnabled;
  },

  getActiveSubject(store) {
    store = this.normalizeStoreMeta(store || this.loadStore());
    return store.prefs.activeSubject || DEFAULT_SUBJECT;
  },

  setActiveSubject(store, subjectId) {
    if (!store.prefs) store.prefs = { speechEnabled: false, activeSubject: DEFAULT_SUBJECT };
    store.prefs.activeSubject = this.sanitizeSubject(subjectId);
    this.saveStore(store);
    return store;
  },

  setSpeechEnabled(store, enabled) {
    store = this.normalizeStoreMeta(store);
    store.prefs.speechEnabled = !!enabled;
    this.saveStore(store);
    return store.prefs.speechEnabled;
  },

  /** Full v3 snapshot for multi-device handoff (download). Imports accept v2 and v3. */
  exportAllProfiles(store) {
    const s = this.normalizeStoreMeta(JSON.parse(JSON.stringify(store || this.loadStore())));
    return {
      format: 'einstein-math-v3',
      exportedAt: new Date().toISOString(),
      note: 'Multi-device handoff snapshot (not cloud sync). Import on another device to merge or replace.',
      version: SCHEMA_VERSION,
      appVersion: s.appVersion || '2.3.0',
      activeUserId: s.activeUserId || null,
      prefs: s.prefs || { speechEnabled: false },
      users: s.users || {}
    };
  },

  /**
   * Compare two ISO timestamps; true if a is strictly newer than b.
   * Missing timestamps are treated as older.
   */
  isNewerISO(a, b) {
    const ta = a ? Date.parse(a) : NaN;
    const tb = b ? Date.parse(b) : NaN;
    if (Number.isNaN(ta) && Number.isNaN(tb)) return false;
    if (Number.isNaN(ta)) return false;
    if (Number.isNaN(tb)) return true;
    return ta > tb;
  },

  /**
   * Merge one lesson blob: keep the entry with newer lastAt (fallback updatedAt/attempts).
   */
  mergeLessonProgress(localL, incomingL) {
    const a = this.normalizeLesson(localL);
    const b = this.normalizeLesson(incomingL);
    if (this.isNewerISO(b.lastAt, a.lastAt)) return b;
    if (this.isNewerISO(a.lastAt, b.lastAt)) return a;
    // tie-break: higher attempts, then higher mastery
    if ((b.attempts || 0) !== (a.attempts || 0)) {
      return (b.attempts || 0) > (a.attempts || 0) ? b : a;
    }
    return (b.mastery || 0) >= (a.mastery || 0) ? b : a;
  },

  mergeTrackProgress(localT, incomingT) {
    const base = this.normalizeTrackProgress(localT || this.trackDefaults());
    const inc = this.normalizeTrackProgress(incomingT || this.trackDefaults());
    const out = { ...base };
    // Prefer "more progressed" flags via OR, but keep recommended from newer side when possible
    out.started = !!(base.started || inc.started);
    out.diagnosticDone = !!(base.diagnosticDone || inc.diagnosticDone);
    out.stars = Math.max(base.stars || 0, inc.stars || 0);
    // diagnosticScores / recommended: prefer incoming if it has diagnostic and local doesn't, else keep local then fill gaps
    if (inc.diagnosticDone && !base.diagnosticDone) {
      out.diagnosticScores = { ...(inc.diagnosticScores || {}) };
      out.recommendedUnits = [...(inc.recommendedUnits || [])];
    } else {
      out.diagnosticScores = { ...(inc.diagnosticScores || {}), ...(base.diagnosticScores || {}) };
      const rec = [...(base.recommendedUnits || [])];
      (inc.recommendedUnits || []).forEach(id => { if (!rec.includes(id)) rec.push(id); });
      out.recommendedUnits = rec;
    }
    // currentLessonId: prefer non-null from the side that looks more recent via lesson lastAts
    out.currentLessonId = base.currentLessonId || inc.currentLessonId || null;
    const lessons = {};
    const ids = new Set([...Object.keys(base.lessons || {}), ...Object.keys(inc.lessons || {})]);
    ids.forEach(id => {
      if (base.lessons[id] && inc.lessons[id]) lessons[id] = this.mergeLessonProgress(base.lessons[id], inc.lessons[id]);
      else lessons[id] = this.normalizeLesson(base.lessons[id] || inc.lessons[id]);
    });
    out.lessons = lessons;
    return this.normalizeTrackProgress(out);
  },

  /** Merge two users. Either side may be v2 (user.tracks) or v3 (user.progress); result is v3. */
  mergeUser(localU, incomingU) {
    if (!localU) {
      return this.migrateUserToV3(JSON.parse(JSON.stringify(incomingU)));
    }
    if (!incomingU) return localU;
    localU = this.migrateUserToV3(JSON.parse(JSON.stringify(localU)));
    incomingU = this.migrateUserToV3(JSON.parse(JSON.stringify(incomingU)));
    // If conflict on user-level fields, keep newer updatedAt for displayName/trackId/avatar
    const preferIncoming = this.isNewerISO(incomingU.updatedAt, localU.updatedAt);
    const out = {
      id: localU.id || incomingU.id,
      displayName: preferIncoming ? (incomingU.displayName || localU.displayName) : (localU.displayName || incomingU.displayName),
      createdAt: localU.createdAt || incomingU.createdAt || new Date().toISOString(),
      updatedAt: preferIncoming ? (incomingU.updatedAt || localU.updatedAt) : (localU.updatedAt || incomingU.updatedAt),
      trackId: preferIncoming ? (incomingU.trackId || localU.trackId) : (localU.trackId || incomingU.trackId),
      avatarColor: preferIncoming ? (incomingU.avatarColor || localU.avatarColor) : (localU.avatarColor || incomingU.avatarColor),
      trackBySubject: preferIncoming
        ? { ...(localU.trackBySubject || {}), ...(incomingU.trackBySubject || {}) }
        : { ...(incomingU.trackBySubject || {}), ...(localU.trackBySubject || {}) },
      progress: {}
    };
    if (out.trackId) out.trackBySubject[DEFAULT_SUBJECT] = out.trackId;
    const avSrc = preferIncoming ? (incomingU.avatarImage ? incomingU : localU) : (localU.avatarImage ? localU : incomingU);
    if (avSrc && avSrc.avatarImage) {
      out.avatarImage = avSrc.avatarImage;
      if (avSrc.avatarImage512) out.avatarImage512 = avSrc.avatarImage512;
    }
    // Live site v2.4.x stores its photo avatar as avatarDataUrl — keep it through merges.
    const dataUrl = preferIncoming
      ? (incomingU.avatarDataUrl !== undefined ? incomingU.avatarDataUrl : localU.avatarDataUrl)
      : (localU.avatarDataUrl !== undefined ? localU.avatarDataUrl : incomingU.avatarDataUrl);
    if (dataUrl !== undefined) out.avatarDataUrl = dataUrl;
    const keys = new Set([
      ...Object.keys(localU.progress || {}),
      ...Object.keys(incomingU.progress || {})
    ]);
    keys.forEach(key => {
      out.progress[key] = this.mergeTrackProgress(
        (localU.progress || {})[key],
        (incomingU.progress || {})[key]
      );
    });
    return out;
  },

  /**
   * Merge imported v2 or v3 snapshot into current store.
   * - Users matched by id
   * - Per-user: newer updatedAt wins identity fields
   * - Per-lesson: newer lastAt wins progress
   * Returns { store, stats }
   */
  mergeImportedStore(currentStore, incoming) {
    const store = this.normalizeStoreMeta(JSON.parse(JSON.stringify(currentStore || this.emptyStore())));
    const src = incoming && incoming.users ? incoming : null;
    if (!src || !src.users) {
      throw new Error('Invalid import: expected einstein-math-v2/v3 JSON with users');
    }
    const stats = { added: 0, merged: 0, unchanged: 0 };
    Object.keys(src.users).forEach(id => {
      const incomingU = src.users[id];
      if (!incomingU || typeof incomingU !== 'object') return;
      const localU = store.users[id];
      if (!localU) {
        store.users[id] = this.mergeUser(null, { ...incomingU, id });
        stats.added++;
      } else {
        store.users[id] = this.mergeUser(localU, { ...incomingU, id });
        stats.merged++;
      }
    });
    // Prefs: keep local speech unless local never set and incoming has it — prefer local prefs always on merge
    if (incoming.prefs && typeof incoming.prefs === 'object') {
      // only fill missing keys
      Object.keys(incoming.prefs).forEach(k => {
        if (store.prefs[k] === undefined) store.prefs[k] = incoming.prefs[k];
      });
      store.prefs.activeSubject = this.sanitizeSubject(store.prefs.activeSubject);
    }
    if (!store.activeUserId || !store.users[store.activeUserId]) {
      store.activeUserId = incoming.activeUserId && store.users[incoming.activeUserId]
        ? incoming.activeUserId
        : (Object.keys(store.users)[0] || null);
    }
    this.saveStore(store);
    return { store, stats };
  },

  /** Replace entire store with imported snapshot (destructive). */
  replaceAllFromImport(incoming) {
    if (!incoming || !incoming.users) {
      throw new Error('Invalid import: expected einstein-math-v2/v3 JSON with users');
    }
    const store = this.normalizeStoreMeta({
      version: SCHEMA_VERSION,
      appVersion: incoming.appVersion || '2.3.0',
      activeUserId: incoming.activeUserId || null,
      prefs: incoming.prefs && typeof incoming.prefs === 'object'
        ? { speechEnabled: !!incoming.prefs.speechEnabled, activeSubject: incoming.prefs.activeSubject }
        : { speechEnabled: false },
      users: {}
    });
    Object.keys(incoming.users).forEach(id => {
      const u = incoming.users[id];
      if (!u) return;
      store.users[id] = this.mergeUser(null, { ...u, id });
    });
    // A replace is authoritative: don't let the legacy v2 copy merge back in at next boot.
    try {
      const rawV2 = localStorage.getItem(STORAGE_KEY_V2);
      if (rawV2 !== null) store.legacyV2 = this.legacyV2Marker(rawV2, null);
    } catch { /* ignore */ }
    if (!store.activeUserId || !store.users[store.activeUserId]) {
      store.activeUserId = Object.keys(store.users)[0] || null;
    }
    this.saveStore(store);
    return store;
  },

  parseImportPayload(raw) {
    // Browser downloads / editors may add a UTF-8 BOM or surrounding whitespace.
    const data = typeof raw === 'string' ? JSON.parse(raw.replace(/^\uFEFF/, '').trim()) : raw;
    if (!data || typeof data !== 'object') throw new Error('Import is not an object');
    // Accept full export (v2 or v3) OR a bare {version:2|3, users:{...}} store
    if (data.users && (data.format === 'einstein-math-v2' || data.format === 'einstein-math-v3' ||
        data.version === 2 || data.version === SCHEMA_VERSION || data.activeUserId !== undefined)) {
      return data;
    }
    throw new Error('Unrecognized file — need an Einstein Math profiles export (einstein-math-v2 or v3)');
  },

  /**
   * Suggested next missions (1–3) for Today's path / smarter Continue.
   * Priority: due reviews → needs_review → recommended-unit ready lessons → next ready by unit order.
   * Returns [{ lessonId, title, reason, mode }]
   */
  getSuggestedPath(trackProgress, trackCurriculum, limit = 3) {
    const tp = this.normalizeTrackProgress(trackProgress || this.trackDefaults());
    const track = trackCurriculum || { lessons: {}, units: [] };
    const out = [];
    const seen = new Set();
    const push = (lessonId, reason, mode) => {
      if (!lessonId || seen.has(lessonId)) return;
      const L = track.lessons[lessonId];
      if (!L) return;
      seen.add(lessonId);
      out.push({
        lessonId,
        title: L.title || lessonId,
        unitId: L.unitId,
        reason,
        mode: mode || 'lesson'
      });
    };

    // 1) Due reviews
    this.getDueReviews(tp).forEach(d => {
      if (out.length >= limit) return;
      push(d.lessonId, 'Spaced review — keep it sticky!', 'review');
    });

    // 2) needs_review (not already listed)
    Object.entries(tp.lessons || {}).forEach(([id, raw]) => {
      if (out.length >= limit) return;
      const L = this.normalizeLesson(raw);
      if (L.masteryLevel === 'needs_review' || (L.status === 'done' && L.mastery < 0.6)) {
        push(id, 'Strengthen weak spots', 'remediate');
      }
    });

    // 3) Recommended units from diagnostic — first ready / in_progress lesson
    const recUnits = tp.recommendedUnits || [];
    recUnits.forEach(uid => {
      if (out.length >= limit) return;
      const unit = (track.units || []).find(u => u.id === uid);
      if (!unit) return;
      (unit.lessons || []).some(lid => {
        if (out.length >= limit) return true;
        const st = this.lessonStatus(tp, lid, track);
        if (st === 'in_progress') {
          push(lid, 'Resume your suggested path', 'lesson');
          return true;
        }
        if (st === 'ready') {
          push(lid, 'On your suggested path', 'lesson');
          return true;
        }
        return false;
      });
    });

    // 4) Next ready / in_progress in unit order
    (track.units || []).forEach(unit => {
      if (out.length >= limit) return;
      (unit.lessons || []).some(lid => {
        if (out.length >= limit) return true;
        const st = this.lessonStatus(tp, lid, track);
        if (st === 'in_progress') {
          push(lid, 'Pick up where you left off', 'lesson');
          return true;
        }
        if (st === 'ready') {
          push(lid, 'Next up on the map', 'lesson');
          return true;
        }
        return false;
      });
    });

    return out.slice(0, limit);
  },

  /**
   * After a successful remediation retry, nudge mastery upward if check improved.
   * Reuses applyMasteryResult; caller should pass isReview:false and remediate flag via opts.isRemediate.
   * Extra nudge: if previously needs_review and now >= 0.8, treat like a fresh mastery win.
   */
  applyRemediationSuccess(trackProgress, lessonId, stats) {
    const prev = this.normalizeLesson(trackProgress.lessons[lessonId]);
    const entry = this.applyMasteryResult(trackProgress, lessonId, stats, {
      isReview: false,
      missedCheckIds: stats.missedCheckIds || []
    });
    // Soft upward nudge when recovering from needs_review with solid score
    const ct = stats.checkTotal || 0;
    const cc = stats.checkCorrect || 0;
    const checkPct = ct > 0 ? cc / ct : 0;
    if (prev.masteryLevel === 'needs_review' && checkPct >= 0.6) {
      entry.mastery = Math.min(1, Math.max(entry.mastery || 0, checkPct, (prev.mastery || 0) + 0.15));
      if (entry.mastery >= 0.8) {
        entry.masteryLevel = 'mastered';
        entry.missedCheckIds = [];
      } else {
        entry.masteryLevel = 'practicing';
      }
      trackProgress.lessons[lessonId] = entry;
    }
    return entry;
  },

  resetTrackProgress(store, userId, trackId, subjectId) {
    const user = store.users[userId];
    if (!user) return;
    if (user.tracks) this.migrateUserToV3(user);
    if (!user.progress) user.progress = {};
    const key = this.progressKey(subjectId || DEFAULT_SUBJECT, trackId);
    user.progress[key] = this.trackDefaults();
    this.touchUser(user);
    this.saveStore(store);
    return user.progress[key];
  }
};

window.Storage = Storage;
