#!/usr/bin/env node
/* X1 storage schema v3 tests — plain Node, no deps.
 * Run: node tests/storage-v3.test.js            (from repo root)
 * Optional: V2_STORAGE=/path/to/old/storage.js  compares against the pre-X1 v2 loader.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const curriculum = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/curriculum.json'), 'utf8'));

function fakeLocalStorage(init) {
  const m = new Map(Object.entries(init || {}));
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k),
    _map: m
  };
}
function loadStorage(file, ls) {
  const ctx = { localStorage: ls, window: {}, console, Date, JSON, Math };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file });
  return ctx.window.Storage;
}
const plain = o => JSON.parse(JSON.stringify(o));

// ---- v2 fixture (stub-v3 era: version 2 + prefs.activeSubject, W1b avatar fields) ----
const t0 = '2026-09-20T15:00:00.000Z';
const v2Fixture = {
  version: 2,
  appVersion: '2.3.0',
  activeUserId: 'u_mira',
  prefs: { speechEnabled: true, activeSubject: 'science' },
  users: {
    u_mira: {
      id: 'u_mira', displayName: 'Mira', createdAt: t0, updatedAt: '2026-09-29T10:00:00.000Z',
      trackId: 'ages-7-8', avatarColor: '#4ECDC4',
      avatarImage: 'data:image/png;base64,AAA128', avatarImage512: 'data:image/png;base64,AAA512',
      tracks: {
        'ages-7-8': {
          started: true, diagnosticDone: true, diagnosticScores: { u1: 0.8 }, recommendedUnits: [],
          currentLessonId: null, stars: 3,
          lessons: {}
        },
        'ages-5-6': { started: true, stars: 1, lessons: {} }
      }
    },
    u_old: { // very old blob: lessons lacking mastery fields
      id: 'u_old', displayName: 'Old', createdAt: t0, updatedAt: t0, trackId: 'ages-9-10', avatarColor: '#FF6B35',
      tracks: { 'ages-9-10': { started: true, stars: 2, lessons: {} } }
    }
  }
};
// fill with real lesson ids so Today's path is meaningful
const ids78 = Object.keys(curriculum.tracks['ages-7-8'].lessons);
const ids56 = Object.keys(curriculum.tracks['ages-5-6'].lessons);
const ids910 = Object.keys(curriculum.tracks['ages-9-10'].lessons);
const L = v2Fixture.users.u_mira.tracks['ages-7-8'].lessons;
L[ids78[0]] = { status: 'done', mastery: 1, masteryLevel: 'mastered', checkCorrect: 2, checkTotal: 2, attempts: 2, streak: 2, reviewIntervalDays: 3, lastAt: '2026-09-25T10:00:00.000Z', nextReviewAt: '2026-09-28T10:00:00.000Z', missedCheckIds: [] };
L[ids78[1]] = { status: 'done', mastery: 0.5, masteryLevel: 'needs_review', checkCorrect: 1, checkTotal: 2, attempts: 1, streak: 0, reviewIntervalDays: 1, lastAt: '2026-09-26T10:00:00.000Z', nextReviewAt: '2026-09-27T10:00:00.000Z', missedCheckIds: ['q2'] };
L[ids78[2]] = { status: 'in_progress', lastAt: '2026-09-29T09:00:00.000Z' };
v2Fixture.users.u_mira.tracks['ages-5-6'].lessons[ids56[0]] = { status: 'done', mastery: 0.9, masteryLevel: 'mastered', streak: 1, lastAt: '2026-09-21T10:00:00.000Z', nextReviewAt: '2026-09-22T10:00:00.000Z' };
v2Fixture.users.u_old.tracks['ages-9-10'].lessons[ids910[0]] = { status: 'done', checkCorrect: 3, checkTotal: 3, lastAt: '2026-09-10T10:00:00.000Z' };
v2Fixture.users.u_old.tracks['ages-9-10'].lessons[ids910[1]] = { status: 'done', checkCorrect: 1, checkTotal: 3, lastAt: '2026-09-11T10:00:00.000Z' };

const NOW = new Date('2026-10-01T23:00:00.000Z');
function mathView(S, store, uid, tid) {
  const u = store.users[uid];
  const tp = S.getTrackProgress(u, tid);
  const track = curriculum.tracks[tid];
  return plain({
    tp,
    stars: tp.stars,
    due: S.getDueReviews(tp, NOW).map(d => d.lessonId),
    path: S.getSuggestedPath(tp, track, 3).map(x => [x.lessonId, x.mode]),
    statuses: track.units.flatMap(un => un.lessons.map(id => S.lessonStatus(tp, id, track)))
  });
}

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('ok   -', name); }
  catch (e) { console.log('FAIL -', name, '\n', e && e.stack || e); process.exitCode = 1; }
}

const NEW = path.join(ROOT, 'js/storage.js');

test('1. v2 fixture migrates to v3 with identical math progress under math:* keys', () => {
  const ls = fakeLocalStorage({ 'einstein-math-v2': JSON.stringify(v2Fixture) });
  const S = loadStorage(NEW, ls);
  const store = S.loadStore();
  assert.strictEqual(store.version, 3);
  assert.strictEqual(store.prefs.activeSubject, 'math', 'non-live stub subject falls back to math');
  assert.strictEqual(store.prefs.speechEnabled, true);
  const mira = store.users.u_mira;
  assert.deepStrictEqual(Object.keys(mira.progress).sort(), ['math:ages-5-6', 'math:ages-7-8']);
  assert.ok(!('tracks' in mira), 'legacy tracks removed from v3 user');
  assert.strictEqual(mira.trackId, 'ages-7-8');
  assert.deepStrictEqual(plain(mira.trackBySubject), { math: 'ages-7-8' });
  assert.strictEqual(mira.avatarImage, 'data:image/png;base64,AAA128');
  assert.strictEqual(mira.avatarImage512, 'data:image/png;base64,AAA512');
  // persisted to v3 key; v2 key untouched (non-destructive)
  assert.ok(ls.getItem('einstein-math-v3'));
  assert.strictEqual(ls.getItem('einstein-math-v2'), JSON.stringify(v2Fixture));
  // same values as the pre-X1 loader would give
  const expect = {};
  for (const [uid, tids] of [['u_mira', ['ages-7-8', 'ages-5-6']], ['u_old', ['ages-9-10']]]) {
    for (const tid of tids) {
      const raw = plain(v2Fixture.users[uid].tracks[tid]);
      const want = plain(S.normalizeTrackProgress(raw));
      assert.deepStrictEqual(plain(store.users[uid].progress['math:' + tid]), want, uid + ' ' + tid);
      expect[uid + tid] = mathView(S, store, uid, tid);
    }
  }
  if (process.env.V2_STORAGE) {
    const ls2 = fakeLocalStorage({ 'einstein-math-v2': JSON.stringify(v2Fixture) });
    const S2 = loadStorage(process.env.V2_STORAGE, ls2);
    const s2 = S2.loadStore();
    for (const [uid, tid] of [['u_mira', 'ages-7-8'], ['u_mira', 'ages-5-6'], ['u_old', 'ages-9-10']]) {
      const old = mathView(S2, s2, uid, tid);
      assert.deepStrictEqual(expect[uid + tid], old, 'v2 loader parity ' + uid + ' ' + tid);
    }
    console.log('     (parity vs pre-X1 storage.js: progress, stars, due reviews, Today\'s path, lesson statuses identical)');
  }
});

test('2. migration is idempotent (load twice / migrate twice → same result)', () => {
  const ls = fakeLocalStorage({ 'einstein-math-v2': JSON.stringify(v2Fixture) });
  const S = loadStorage(NEW, ls);
  const a = plain(S.loadStore());
  const afterFirst = ls.getItem('einstein-math-v3');
  const b = plain(S.loadStore());
  assert.deepStrictEqual(b, a);
  const c = plain(S.migrateStoreToV3(plain(a)));
  assert.deepStrictEqual(c, a);
  S.saveStore(S.loadStore());
  assert.deepStrictEqual(JSON.parse(ls.getItem('einstein-math-v3')), JSON.parse(afterFirst));
  // a v3 store that somehow also carries a legacy tracks blob merges (no loss, no dupes)
  const mixed = plain(a);
  mixed.users.u_mira.tracks = plain(v2Fixture.users.u_mira.tracks);
  assert.deepStrictEqual(plain(S.migrateStoreToV3(mixed)), a);
});

test('3. fresh profile works (no keys) and writes v3 shape', () => {
  const ls = fakeLocalStorage();
  const S = loadStorage(NEW, ls);
  const store = S.loadStore();
  assert.strictEqual(store.version, 3);
  assert.deepStrictEqual(Object.keys(store.users), []);
  assert.strictEqual(ls.getItem('einstein-math-v3'), null, 'no write for empty store');
  const u = S.createUser(store, { displayName: 'Zed', trackId: 'ages-5-6' });
  const tp = S.getTrackProgress(u, u.trackId);
  const lid = ids56[0];
  S.markLessonDone(tp, lid, { checkCorrect: 2, checkTotal: 2, practiceCorrect: 3, practiceTotal: 3 });
  S.saveTrackProgress(store, u.id, u.trackId, tp);
  const saved = JSON.parse(ls.getItem('einstein-math-v3'));
  assert.strictEqual(saved.version, 3);
  assert.strictEqual(saved.users[u.id].progress['math:ages-5-6'].stars, 1);
  assert.strictEqual(saved.users[u.id].progress['math:ages-5-6'].lessons[lid].masteryLevel, 'mastered');
  assert.ok(!saved.users[u.id].tracks);
  const s2 = S.loadStore();
  assert.strictEqual(S.getTrackProgress(s2.users[u.id], 'ages-5-6').stars, 1);
  assert.strictEqual(S.getTrackProgress(s2.users[u.id], 'math:ages-5-6').stars, 1, 'keyed id accepted');
  S.setUserTrack(s2, u.id, 'ages-7-8');
  assert.strictEqual(S.loadStore().users[u.id].trackBySubject.math, 'ages-7-8');
  const reset = S.resetTrackProgress(s2, u.id, 'ages-5-6');
  assert.strictEqual(reset.stars, 0);
  const sum = S.getParentSummary(S.loadStore(), u.id, curriculum);
  assert.strictEqual(sum.trackId, 'ages-7-8');
});

test('4. import: old v2 export merges + replaces; v3 export round-trips; avatars kept', () => {
  const oldExport = { format: 'einstein-math-v2', exportedAt: t0, version: 2, appVersion: '2.3.0',
    activeUserId: 'u_mira', prefs: { speechEnabled: false }, users: plain(v2Fixture.users) };
  // replace on a fresh device
  let ls = fakeLocalStorage();
  let S = loadStorage(NEW, ls);
  const parsed = S.parseImportPayload(JSON.stringify(oldExport));
  const rep = S.replaceAllFromImport(parsed);
  assert.strictEqual(rep.version, 3);
  assert.deepStrictEqual(plain(rep.users.u_mira.progress['math:ages-7-8']), plain(S.normalizeTrackProgress(plain(v2Fixture.users.u_mira.tracks['ages-7-8']))));
  assert.strictEqual(rep.users.u_mira.avatarImage512, 'data:image/png;base64,AAA512');
  // merge into a device that already has a v3 Mira with a newer lesson
  const local = S.loadStore();
  const tp = S.getTrackProgress(local.users.u_mira, 'ages-7-8');
  S.markLessonDone(tp, ids78[3], { checkCorrect: 2, checkTotal: 2 });
  S.saveTrackProgress(local, 'u_mira', 'ages-7-8', tp);
  const { store: merged, stats } = S.mergeImportedStore(S.loadStore(), S.parseImportPayload(oldExport));
  assert.strictEqual(stats.merged, 2);
  const mt = merged.users.u_mira.progress['math:ages-7-8'];
  assert.ok(mt.lessons[ids78[3]] && mt.lessons[ids78[0]], 'both local-new and imported lessons kept');
  assert.strictEqual(mt.stars, 4);
  assert.ok(!merged.users.u_mira.tracks);
  assert.strictEqual(merged.users.u_mira.avatarImage, 'data:image/png;base64,AAA128');
  // v3 export → import on another device
  const exp = S.exportAllProfiles(merged);
  assert.strictEqual(exp.format, 'einstein-math-v3');
  assert.strictEqual(exp.version, 3);
  const ls3 = fakeLocalStorage();
  const S3 = loadStorage(NEW, ls3);
  const r3 = S3.mergeImportedStore(S3.loadStore(), S3.parseImportPayload(JSON.stringify(exp)));
  assert.deepStrictEqual(plain(r3.store.users.u_mira.progress), plain(merged.users.u_mira.progress));
  // mergeUser with identical user (W1b smoke) keeps avatar
  const m = S.mergeUser(merged.users.u_mira, plain(merged.users.u_mira));
  assert.strictEqual(m.avatarImage512, 'data:image/png;base64,AAA512');
  // v1 legacy still migrates into v3
  const ls1 = fakeLocalStorage({ 'einstein-math-progress-v1': JSON.stringify({ name: 'Ada', started: true, stars: 2, lessons: { [ids78[0]]: { status: 'done', lastAt: t0 } } }) });
  const S1 = loadStorage(NEW, ls1);
  const s1 = S1.loadStore();
  const ada = Object.values(s1.users)[0];
  assert.strictEqual(ada.progress['math:ages-7-8'].stars, 2);
  assert.strictEqual(ls1.getItem('einstein-math-progress-v1'), null);
});

console.log(`\n${passed} passed${process.exitCode ? ', some FAILED' : ''}`);
