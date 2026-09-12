/* Multi-profile progress persistence via localStorage (device-local only)
 * Schema v2 with mastery + spaced review fields on each lesson blob.
 */
const STORAGE_KEY_V1 = 'einstein-math-progress-v1';
const STORAGE_KEY = 'einstein-math-v2';

const AVATAR_COLORS = ['#FF6B35', '#4ECDC4', '#FFE66D', '#FF6B9D', '#A78BFA', '#95E1D3'];

/** Spaced-review intervals (days) on successive successful reviews */
const REVIEW_INTERVALS_DAYS = [1, 3, 7];

const Storage = {
  REVIEW_INTERVALS_DAYS,

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
      version: 2,
      appVersion: '2.3.0',
      activeUserId: null,
      users: {},
      prefs: {
        speechEnabled: false
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
        avatarColor: this.avatarColorFor(v1.name || 'Explorer'),
        tracks: { [trackId]: trackProg }
      };
      store.activeUserId = id;
      this.saveStore(store);
      localStorage.removeItem(STORAGE_KEY_V1);
      return store;
    } catch {
      return store;
    }
  },

  loadStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      let store = raw ? JSON.parse(raw) : this.emptyStore();
      if (!store || store.version !== 2 || !store.users) store = this.emptyStore();
      store = this.migrateV1IfNeeded(store);
      // Normalize all lesson blobs on load
      Object.values(store.users || {}).forEach(user => {
        if (!user.tracks) user.tracks = {};
        Object.keys(user.tracks).forEach(tid => {
          user.tracks[tid] = this.normalizeTrackProgress(user.tracks[tid]);
        });
      });
      store = this.normalizeStoreMeta(store);
      return store;
    } catch {
      return this.emptyStore();
    }
  },

  saveStore(store) {
    store.version = 2;
    store.appVersion = store.appVersion || '2.3.0';
    if (!store.prefs || typeof store.prefs !== 'object') store.prefs = { speechEnabled: false };
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

  ensureTrackProgress(user, trackId) {
    if (!user.tracks) user.tracks = {};
    if (!user.tracks[trackId]) {
      user.tracks[trackId] = this.trackDefaults();
    } else {
      user.tracks[trackId] = this.normalizeTrackProgress(user.tracks[trackId]);
    }
    return user.tracks[trackId];
  },

  getTrackProgress(user, trackId) {
    if (!user) return this.trackDefaults();
    return this.ensureTrackProgress(user, trackId || user.trackId);
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
      avatarColor: this.avatarColorFor(name),
      tracks: { [tid]: this.trackDefaults() }
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
    this.ensureTrackProgress(user, trackId);
    this.touchUser(user);
    this.saveStore(store);
    return user;
  },

  saveTrackProgress(store, userId, trackId, trackProgress) {
    const user = store.users[userId];
    if (!user) return;
    if (!user.tracks) user.tracks = {};
    user.tracks[trackId] = this.normalizeTrackProgress(trackProgress);
    user.trackId = trackId;
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
    store.version = 2;
    store.appVersion = store.appVersion || '2.3.0';
    if (!store.prefs || typeof store.prefs !== 'object') {
      store.prefs = { speechEnabled: false };
    } else if (typeof store.prefs.speechEnabled !== 'boolean') {
      store.prefs.speechEnabled = !!store.prefs.speechEnabled;
    }
    if (!store.users) store.users = {};
    return store;
  },

  getSpeechEnabled(store) {
    store = this.normalizeStoreMeta(store || this.loadStore());
    return !!store.prefs.speechEnabled;
  },

  setSpeechEnabled(store, enabled) {
    store = this.normalizeStoreMeta(store);
    store.prefs.speechEnabled = !!enabled;
    this.saveStore(store);
    return store.prefs.speechEnabled;
  },

  /** Full v2 snapshot for multi-device handoff (download). */
  exportAllProfiles(store) {
    const s = this.normalizeStoreMeta(JSON.parse(JSON.stringify(store || this.loadStore())));
    return {
      format: 'einstein-math-v2',
      exportedAt: new Date().toISOString(),
      note: 'Multi-device handoff snapshot (not cloud sync). Import on another device to merge or replace.',
      version: 2,
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

  mergeUser(localU, incomingU) {
    if (!localU) {
      const u = JSON.parse(JSON.stringify(incomingU));
      if (!u.tracks) u.tracks = {};
      Object.keys(u.tracks).forEach(tid => { u.tracks[tid] = this.normalizeTrackProgress(u.tracks[tid]); });
      return u;
    }
    if (!incomingU) return localU;
    // If conflict on user-level fields, keep newer updatedAt for displayName/trackId/avatar
    const preferIncoming = this.isNewerISO(incomingU.updatedAt, localU.updatedAt);
    const out = {
      id: localU.id || incomingU.id,
      displayName: preferIncoming ? (incomingU.displayName || localU.displayName) : (localU.displayName || incomingU.displayName),
      createdAt: localU.createdAt || incomingU.createdAt || new Date().toISOString(),
      updatedAt: preferIncoming ? (incomingU.updatedAt || localU.updatedAt) : (localU.updatedAt || incomingU.updatedAt),
      trackId: preferIncoming ? (incomingU.trackId || localU.trackId) : (localU.trackId || incomingU.trackId),
      avatarColor: preferIncoming ? (incomingU.avatarColor || localU.avatarColor) : (localU.avatarColor || incomingU.avatarColor),
      tracks: {}
    };
    const tids = new Set([
      ...Object.keys(localU.tracks || {}),
      ...Object.keys(incomingU.tracks || {})
    ]);
    tids.forEach(tid => {
      out.tracks[tid] = this.mergeTrackProgress(
        (localU.tracks || {})[tid],
        (incomingU.tracks || {})[tid]
      );
    });
    return out;
  },

  /**
   * Merge imported v2 snapshot into current store.
   * - Users matched by id
   * - Per-user: newer updatedAt wins identity fields
   * - Per-lesson: newer lastAt wins progress
   * Returns { store, stats }
   */
  mergeImportedStore(currentStore, incoming) {
    const store = this.normalizeStoreMeta(JSON.parse(JSON.stringify(currentStore || this.emptyStore())));
    const src = incoming && incoming.users ? incoming : (incoming && incoming.format === 'einstein-math-v2' ? incoming : null);
    if (!src || !src.users) {
      throw new Error('Invalid import: expected einstein-math-v2 JSON with users');
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
      throw new Error('Invalid import: expected einstein-math-v2 JSON with users');
    }
    const store = this.normalizeStoreMeta({
      version: 2,
      appVersion: incoming.appVersion || '2.3.0',
      activeUserId: incoming.activeUserId || null,
      prefs: incoming.prefs && typeof incoming.prefs === 'object'
        ? { speechEnabled: !!incoming.prefs.speechEnabled }
        : { speechEnabled: false },
      users: {}
    });
    Object.keys(incoming.users).forEach(id => {
      const u = incoming.users[id];
      if (!u) return;
      store.users[id] = this.mergeUser(null, { ...u, id });
    });
    if (!store.activeUserId || !store.users[store.activeUserId]) {
      store.activeUserId = Object.keys(store.users)[0] || null;
    }
    this.saveStore(store);
    return store;
  },

  parseImportPayload(raw) {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!data || typeof data !== 'object') throw new Error('Import is not an object');
    // Accept full export OR a bare {version:2, users:{...}} store
    if (data.users && (data.format === 'einstein-math-v2' || data.version === 2 || data.activeUserId !== undefined)) {
      return data;
    }
    throw new Error('Unrecognized file — need an Einstein Math profiles export (einstein-math-v2)');
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
      push(d.lessonId, 'review due', 'review');
    });

    // 2) needs_review (not already listed)
    Object.entries(tp.lessons || {}).forEach(([id, raw]) => {
      if (out.length >= limit) return;
      const L = this.normalizeLesson(raw);
      if (L.masteryLevel === 'needs_review' || (L.status === 'done' && L.mastery < 0.6)) {
        push(id, 'needs review', 'remediate');
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
          push(lid, 'suggested path (resume)', 'lesson');
          return true;
        }
        if (st === 'ready') {
          push(lid, 'suggested path', 'lesson');
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
          push(lid, 'resume', 'lesson');
          return true;
        }
        if (st === 'ready') {
          push(lid, 'next lesson', 'lesson');
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

    resetTrackProgress(store, userId, trackId) {
    const user = store.users[userId];
    if (!user) return;
    user.tracks[trackId] = this.trackDefaults();
    this.touchUser(user);
    this.saveStore(store);
    return user.tracks[trackId];
  }
};

window.Storage = Storage;
