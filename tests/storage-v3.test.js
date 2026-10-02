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
  const noTs = o => { const c = JSON.parse(o); delete c.updatedAt; return c; };
  assert.deepStrictEqual(noTs(ls.getItem('einstein-math-v3')), noTs(afterFirst));
  assert.strictEqual(a.legacyV2.hash, S.hashString(JSON.stringify(v2Fixture)), 'migration records absorbed-v2 marker');
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


// ---------- follow-up: old-tab v2 saves after migration ----------
function migrated() {
  const ls = fakeLocalStorage({ 'einstein-math-v2': JSON.stringify(v2Fixture) });
  const S = loadStorage(NEW, ls);
  S.loadStore();
  return { ls, S };
}
/** What an old (pre-X1) tab does: mutate its in-memory v2 store and JSON.stringify it to the v2 key. */
function oldTabSave(ls, mutate) {
  const v2 = JSON.parse(ls.getItem('einstein-math-v2'));
  mutate(v2);
  ls.setItem('einstein-math-v2', JSON.stringify(v2));
}
const iso = n => new Date(Date.now() + n * 864e5).toISOString();

test('5. old-tab save after migration is merged into v3 at boot (v3-only progress kept)', () => {
  const { ls, S } = migrated();
  // new tab earns a lesson in v3
  let st = S.loadStore();
  const tp = S.getTrackProgress(st.users.u_mira, 'ages-7-8');
  S.markLessonDone(tp, ids78[4], { checkCorrect: 2, checkTotal: 2 });
  S.saveTrackProgress(st, 'u_mira', 'ages-7-8', tp);
  // old tab (still on v2 code) finishes a different lesson and a 5-6 lesson, and saves
  oldTabSave(ls, v2 => {
    const u = v2.users.u_mira;
    u.updatedAt = iso(0);
    u.tracks['ages-7-8'].lessons[ids78[5]] = { status: 'done', mastery: 1, masteryLevel: 'mastered', checkCorrect: 2, checkTotal: 2, attempts: 1, streak: 1, reviewIntervalDays: 1, lastAt: iso(0), nextReviewAt: iso(1), missedCheckIds: [] };
    u.tracks['ages-7-8'].stars = 4;
    u.tracks['ages-5-6'].lessons[ids56[1]] = { status: 'in_progress', lastAt: iso(0) };
  });
  const rawV2 = ls.getItem('einstein-math-v2');
  st = S.loadStore();
  const t78 = st.users.u_mira.progress['math:ages-7-8'];
  assert.ok(t78.lessons[ids78[4]], 'v3-only lesson kept');
  assert.strictEqual(t78.lessons[ids78[5]].status, 'done', 'old-tab lesson merged');
  assert.strictEqual(st.users.u_mira.progress['math:ages-5-6'].lessons[ids56[1]].status, 'in_progress');
  assert.strictEqual(t78.stars, 5, 'stars: v3 base 3 + v3 lesson 1 + old-tab lesson 1');
  assert.ok(!st.users.u_mira.tracks);
  assert.strictEqual(st.legacyV2.hash, S.hashString(rawV2), 'marker = hash of absorbed v2 content');
  assert.strictEqual(ls.getItem('einstein-math-v2'), rawV2, 'v2 key untouched');
  const saved = JSON.parse(ls.getItem('einstein-math-v3'));
  assert.ok(saved.users.u_mira.progress['math:ages-7-8'].lessons[ids78[5]], 'merge persisted');
  assert.ok(saved.updatedAt, 'store-level updatedAt on save');
  assert.strictEqual(saved.users.u_mira.avatarImage512, 'data:image/png;base64,AAA512');
  if (process.env.V2_STORAGE) {
    // same thing driven by the real pre-X1 storage.js
    const Sold = loadStorage(process.env.V2_STORAGE, ls);
    const os = Sold.loadStore();
    const otp = Sold.getTrackProgress(os.users.u_old, 'ages-9-10');
    Sold.markLessonDone(otp, ids910[2], { checkCorrect: 3, checkTotal: 3 });
    Sold.saveTrackProgress(os, 'u_old', 'ages-9-10', otp);
    const st2 = S.loadStore();
    assert.strictEqual(st2.users.u_old.progress['math:ages-9-10'].lessons[ids910[2]].masteryLevel, 'mastered', 'real old-code save merged');
    assert.ok(st2.users.u_mira.progress['math:ages-7-8'].lessons[ids78[4]], 'v3-only lesson still kept');
    console.log('     (also verified with a save from the real pre-X1 storage.js)');
  }
});

test('6. second boot does not re-merge (marker idempotent); deleted v3 user not resurrected', () => {
  const { ls, S } = migrated();
  let st = S.loadStore();
  S.deleteUser(st, 'u_old');
  oldTabSave(ls, v2 => { v2.users.u_mira.updatedAt = iso(0); v2.users.u_mira.tracks['ages-7-8'].lessons[ids78[6]] = { status: 'in_progress', lastAt: iso(0) }; });
  st = S.loadStore();
  assert.ok(!st.users.u_old, 'u_old (deleted in v3, untouched by old tab) not resurrected');
  assert.ok(st.users.u_mira.progress['math:ages-7-8'].lessons[ids78[6]]);
  const v3a = ls.getItem('einstein-math-v3');
  // second + third boot: no write, same content
  const st2 = S.loadStore(); S.loadStore();
  assert.strictEqual(ls.getItem('einstein-math-v3'), v3a, 'no re-merge / no rewrite on later boots');
  assert.strictEqual(S.absorbLegacyV2(st2, ls.getItem('einstein-math-v2')), false);
  // v3 tab makes progress, reboot: v2 unchanged so v3 progress is not disturbed
  const tp = S.getTrackProgress(st2.users.u_mira, 'ages-7-8');
  S.setLessonProgress(tp, ids78[6], { status: 'in_progress', practiceCorrect: 9 });
  S.saveTrackProgress(st2, 'u_mira', 'ages-7-8', tp);
  assert.strictEqual(S.loadStore().users.u_mira.progress['math:ages-7-8'].lessons[ids78[6]].practiceCorrect, 9);
  // a user created in the old tab after migration IS added
  oldTabSave(ls, v2 => { v2.users.u_new = { id: 'u_new', displayName: 'New', createdAt: iso(0), updatedAt: iso(0), trackId: 'ages-5-6', avatarColor: '#FFE66D', tracks: { 'ages-5-6': { started: true, stars: 1, lessons: {} } } }; });
  assert.strictEqual(S.loadStore().users.u_new.progress['math:ages-5-6'].stars, 1);
});

test('7. v3-newer lesson wins over older v2 copy (and newer v2 lesson wins over older v3)', () => {
  const { ls, S } = migrated();
  let st = S.loadStore();
  const tp = S.getTrackProgress(st.users.u_mira, 'ages-7-8');
  // v3 retakes lesson 1 (was needs_review in v2) → mastered now
  S.applyRemediationSuccess(tp, ids78[1], { checkCorrect: 2, checkTotal: 2 });
  S.saveTrackProgress(st, 'u_mira', 'ages-7-8', tp);
  const v3L1 = plain(S.loadStore().users.u_mira.progress['math:ages-7-8'].lessons[ids78[1]]);
  oldTabSave(ls, v2 => {
    const L = v2.users.u_mira.tracks['ages-7-8'].lessons;
    L[ids78[1]].practiceCorrect = 1;                       // stale copy, older lastAt
    L[ids78[2]] = { ...L[ids78[2]], status: 'done', mastery: 0.7, masteryLevel: 'practicing', checkCorrect: 2, checkTotal: 3, lastAt: iso(1) }; // newer in v2
  });
  st = S.loadStore();
  const L = st.users.u_mira.progress['math:ages-7-8'].lessons;
  assert.deepStrictEqual(plain(L[ids78[1]]), v3L1, 'v3 newer lesson kept');
  assert.strictEqual(L[ids78[1]].masteryLevel, 'mastered');
  assert.strictEqual(L[ids78[2]].status, 'done', 'v2 newer lesson wins');
});

test('8. real live-site (v2.4.2) export imports — plain, BOM+CRLF, merge, replace, avatar kept as avatarImage', () => {
  const text = fs.readFileSync(path.join(__dirname, 'fixtures/v2-live-2.4.2-export.json'), 'utf8');
  const exp = JSON.parse(text);
  assert.strictEqual(exp.format, 'einstein-math-v2');
  assert.strictEqual(exp.version, 2);
  const variants = { plain: text, bomCrlf: '\uFEFF' + text.replace(/\n/g, '\r\n') + '\r\n', padded: '\n  ' + text + '\n\n' };
  for (const [name, raw] of Object.entries(variants)) {
    // replace-all on a device that still has a v2 key (restore steps)
    const ls = fakeLocalStorage({ 'einstein-math-v2': JSON.stringify(v2Fixture) });
    const S = loadStorage(NEW, ls);
    S.loadStore();
    const data = S.parseImportPayload(raw);
    const rep = S.replaceAllFromImport(data);
    for (const [id, u] of Object.entries(exp.users)) {
      for (const tid of Object.keys(u.tracks)) {
        assert.deepStrictEqual(plain(rep.users[id].progress['math:' + tid]), plain(S.normalizeTrackProgress(plain(u.tracks[tid]))), name + ' ' + id + ' ' + tid);
      }
      assert.strictEqual(rep.users[id].avatarImage, u.avatarDataUrl || undefined, name + ' avatarDataUrl → avatarImage on replace');
      assert.ok(!('avatarDataUrl' in rep.users[id]), name + ' avatarDataUrl dropped after copy');
    }
    const after = S.loadStore();
    assert.deepStrictEqual(Object.keys(after.users).sort(), Object.keys(exp.users).sort(), name + ': replace not undone by legacy v2 at next boot');
    // merge into an existing device copy of the same users
    const ls2 = fakeLocalStorage();
    const S2 = loadStorage(NEW, ls2);
    S2.replaceAllFromImport(S2.parseImportPayload(raw));
    const st = S2.loadStore();
    const mid = exp.activeUserId;
    const tp = S2.getTrackProgress(st.users[mid], 'ages-7-8');
    S2.markLessonDone(tp, ids78[7], { checkCorrect: 2, checkTotal: 2 });
    S2.saveTrackProgress(st, mid, 'ages-7-8', tp);
    const { store: merged } = S2.mergeImportedStore(S2.loadStore(), S2.parseImportPayload(raw));
    assert.ok(merged.users[mid].progress['math:ages-7-8'].lessons[ids78[7]], name + ' local lesson kept on merge');
    assert.strictEqual(merged.users[mid].avatarImage, exp.users[mid].avatarDataUrl, name + ' avatar kept on merge (as avatarImage)');
  }
});


test('9. origin/main v2.4.2 export WITH avatarDataUrl restores as avatarImage (backup restore + import + migration + old tab)', () => {
  const text = fs.readFileSync(path.join(__dirname, 'fixtures/v2-origin-2.4.2-avatar-export.json'), 'utf8');
  const exp = JSON.parse(text);
  const [uid] = Object.keys(exp.users);
  const url = exp.users[uid].avatarDataUrl;
  assert.ok(/^data:image\/png;base64,/.test(url));
  // backup.js restore path: parseImportPayload → replaceAllFromImport
  const ls = fakeLocalStorage();
  const S = loadStorage(NEW, ls);
  S.replaceAllFromImport(S.parseImportPayload('\uFEFF' + text));
  let u = S.loadStore().users[uid];
  assert.strictEqual(u.avatarImage, url);
  assert.ok(!('avatarDataUrl' in u));
  assert.strictEqual(S.avatarSrc(u), url);
  assert.strictEqual(S.avatarSrc(u, true), url);
  assert.deepStrictEqual(plain(u.progress['math:ages-9-10']), plain(S.normalizeTrackProgress(plain(exp.users[uid].tracks['ages-9-10']))));
  assert.strictEqual(S.getParentSummary(S.loadStore(), uid, curriculum).avatarImage, url);
  // clear removes it for good (no stale second field)
  S.clearUserAvatar(S.loadStore(), uid);
  assert.strictEqual(S.avatarSrc(S.loadStore().users[uid]), null);
  // import button path (merge into a device that has the same user without avatar)
  const r = S.mergeImportedStore(S.loadStore(), S.parseImportPayload(text));
  assert.strictEqual(r.store.users[uid].avatarImage, url, 'merge restores avatar from newer-or-only side');
  // W1b avatar wins when both exist; setUserAvatar writes avatarImage
  const both = S.migrateUserToV3({ id: 'x', avatarImage: 'data:image/png;base64,W1B', avatarImage512: 'data:image/png;base64,W1B512', avatarDataUrl: url, tracks: {} });
  assert.strictEqual(both.avatarImage, 'data:image/png;base64,W1B');
  assert.strictEqual(both.avatarImage512, 'data:image/png;base64,W1B512');
  assert.ok(!('avatarDataUrl' in both));
  const st = S.loadStore();
  S.setUserAvatar(st, uid, url);
  assert.strictEqual(S.loadStore().users[uid].avatarImage, url);
  // v2 store in localStorage (live user's first v3 load) migrates its avatar
  const v2store = { version: 2, appVersion: '2.4.0', activeUserId: uid, prefs: { speechEnabled: false }, users: plain(exp.users) };
  const ls2 = fakeLocalStorage({ 'einstein-math-v2': JSON.stringify(v2store) });
  const S2 = loadStorage(NEW, ls2);
  assert.strictEqual(S2.loadStore().users[uid].avatarImage, url);
  // old v2.4.x tab sets a photo after migration → boot merge copies it
  const ls3 = fakeLocalStorage({ 'einstein-math-v2': JSON.stringify({ ...v2store, users: { [uid]: { ...plain(exp.users[uid]), avatarDataUrl: null } } }) });
  const S3 = loadStorage(NEW, ls3);
  assert.strictEqual(S3.avatarSrc(S3.loadStore().users[uid]), null);
  oldTabSave(ls3, v2 => { v2.users[uid].avatarDataUrl = url; v2.users[uid].updatedAt = new Date(Date.now() + 1000).toISOString(); });
  assert.strictEqual(S3.loadStore().users[uid].avatarImage, url, 'old-tab avatar merged as avatarImage');
});

console.log(`\n${passed} passed${process.exitCode ? ', some FAILED' : ''}`);
