/* Progress persistence via localStorage */
const STORAGE_KEY = 'einstein-math-progress-v1';

const Storage = {
  defaults() {
    return {
      started: false,
      diagnosticDone: false,
      diagnosticScores: {},
      recommendedUnits: [],
      lessons: {}, // lessonId -> { status: 'locked'|'ready'|'in_progress'|'done', practiceCorrect, practiceTotal, checkCorrect, checkTotal, lastAt }
      currentLessonId: null,
      stars: 0,
      name: 'Explorer'
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return this.defaults();
      return { ...this.defaults(), ...JSON.parse(raw) };
    } catch {
      return this.defaults();
    }
  },

  save(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  },

  reset() {
    localStorage.removeItem(STORAGE_KEY);
    return this.defaults();
  },

  markLessonDone(state, lessonId, stats) {
    state.lessons[lessonId] = {
      status: 'done',
      ...stats,
      lastAt: new Date().toISOString()
    };
    state.stars = (state.stars || 0) + 1;
    state.currentLessonId = lessonId;
    this.save(state);
    return state;
  },

  setLessonProgress(state, lessonId, patch) {
    state.lessons[lessonId] = {
      status: 'in_progress',
      ...(state.lessons[lessonId] || {}),
      ...patch,
      lastAt: new Date().toISOString()
    };
    state.currentLessonId = lessonId;
    state.started = true;
    this.save(state);
    return state;
  },

  lessonStatus(state, lessonId, curriculum) {
    const saved = state.lessons[lessonId];
    if (saved && saved.status === 'done') return 'done';
    if (saved && saved.status === 'in_progress') return 'in_progress';
    const lesson = curriculum.lessons[lessonId];
    if (!lesson) return 'locked';
    const prereqs = lesson.prerequisites || [];
    const unlocked = prereqs.every(pid => state.lessons[pid]?.status === 'done');
    // Soft unlock: if no prereqs OR diagnostic done, allow ready; still prefer prereqs
    if (prereqs.length === 0) return saved?.status || 'ready';
    if (unlocked) return saved?.status || 'ready';
    // Allow exploring after diagnostic even if prereqs incomplete (gentle path)
    if (state.diagnosticDone) return 'ready';
    return 'locked';
  }
};

window.Storage = Storage;
