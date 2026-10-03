#!/usr/bin/env node
/* X3 live subject switcher tests — plain Node, no deps.
 * Run: node tests/subjects-x3.test.js   (from repo root)
 * Covers subject-scoped progress keys, Today's path and the parent summary per subject.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const MATH = JSON.parse(read('data/subjects/math.json'));
const PHYS = JSON.parse(read('data/subjects/physics.json'));
const plain = o => JSON.parse(JSON.stringify(o));

function fakeLocalStorage(init) {
  const m = new Map(Object.entries(init || {}));
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), _map: m };
}
function load(ls) {
  const ctx = { localStorage: ls || fakeLocalStorage(), window: {}, console, Date, JSON, Math, Promise, Error };
  vm.createContext(ctx);
  vm.runInContext(read('js/storage.js'), ctx, { filename: 'js/storage.js' });
  vm.runInContext(read('js/subjects.js'), ctx, { filename: 'js/subjects.js' });
  return { Storage: ctx.window.Storage, Subjects: ctx.window.Subjects, ls: ctx.localStorage };
}
function fetchWith(packs) {
  return async url => {
    const body = packs[url];
    return body ? { ok: true, status: 200, json: async () => plain(body) } : { ok: false, status: 404, json: async () => ({}) };
  };
}
const PACKS = { 'data/subjects/math.json': MATH, 'data/subjects/physics.json': PHYS };
// The X3-era empty physics pack (coming-soon state); the shipped pack has sim lessons since X4.
const STUB_PACKS = { ...PACKS, 'data/subjects/physics.json': { meta: { subject: 'physics', status: 'soon' }, tracks: {} } };
// A hypothetical future physics pack (not shipped) to prove filtering by subject.
const FUTURE_PHYS = {
  id: 'physics', label: 'Physics',
  tracks: { 'ages-7-8': { label: 'Ages 7–8', ageRange: '7–8',
    units: [{ id: 'p-u1', title: 'Push & Pull', lessons: ['p-l1', 'p-l2'] }],
    lessons: { 'p-l1': { id: 'p-l1', title: 'Forces', unitId: 'p-u1', prerequisites: [] }, 'p-l2': { id: 'p-l2', title: 'Magnets', unitId: 'p-u1', prerequisites: ['p-l1'] } } } }
};

function seed(Storage) {
  const store = Storage.loadStore();
  Storage.createUser(store, { displayName: 'Mira', trackId: 'ages-7-8' });
  const u = Storage.getActiveUser(store);
  const tp = Storage.getTrackProgress(u, 'ages-7-8', 'math');
  const firstTwo = Object.keys(MATH.tracks['ages-7-8'].lessons).slice(0, 2);
  firstTwo.forEach(id => Storage.markLessonDone(tp, id, { checkTotal: 3, checkCorrect: 3 }));
  tp.stars = 7;
  Storage.saveTrackProgress(store, u.id, 'ages-7-8', tp, 'math');
  return { store, u, firstTwo };
}

let pass = 0, fail = 0;
async function t(name, fn) {
  try { await fn(); pass++; console.log('ok  ' + name); }
  catch (e) { fail++; console.log('FAIL ' + name + '\n   ' + (e.stack || e).toString().split('\n').slice(0, 3).join('\n   ')); }
}

(async () => {
  await t('1. only math + physics are selectable; physics choice persists across reload; other ids → math', async () => {
    const { Storage, Subjects, ls } = load();
    assert.deepStrictEqual(plain(Subjects.CATALOG.map(s => s.id)), ['math', 'physics']);
    assert.ok(Subjects.isSelectable('physics') && !Subjects.isSelectable('science'));
    const store = Storage.loadStore();
    Storage.setActiveSubject(store, 'physics');
    const again = load(ls).Storage;
    assert.strictEqual(again.getActiveSubject(again.loadStore()), 'physics', 'persisted');
    Storage.setActiveSubject(store, 'chemistry');
    assert.strictEqual(load(ls).Storage.getActiveSubject(), 'math');
    assert.strictEqual(Storage.sanitizeSubject('physics'), 'physics');
    assert.strictEqual(Storage.sanitizeSubject(undefined), 'math');
  });

  await t('2. progress is subject-scoped: physics:<track> is separate from math:<track>', async () => {
    const { Storage, ls } = load();
    const { store, u } = seed(Storage);
    const mathBefore = plain(u.progress['math:ages-7-8']);
    const ptp = Storage.getTrackProgress(u, Storage.subjectTrackId(u, 'physics'), 'physics');
    assert.strictEqual(ptp.stars, 0, 'physics starts empty');
    ptp.stars = 2;
    Storage.saveTrackProgress(store, u.id, 'ages-7-8', ptp, 'physics');
    const re = load(ls).Storage;
    const ru = re.getActiveUser(re.loadStore());
    assert.strictEqual(ru.progress['physics:ages-7-8'].stars, 2);
    assert.deepStrictEqual(plain(ru.progress['math:ages-7-8']), mathBefore, 'math untouched');
    assert.strictEqual(re.getTrackProgress(ru, 'ages-7-8', 'math').stars, 7);
  });

  await t('3. subjectTrackId follows the age track; setUserTrack moves every subject', async () => {
    const { Storage } = load();
    const { store, u } = seed(Storage);
    assert.strictEqual(Storage.subjectTrackId(u, 'physics'), 'ages-7-8');
    Storage.setUserTrack(store, u.id, 'ages-9-10');
    assert.strictEqual(Storage.subjectTrackId(u, 'math'), 'ages-9-10');
    assert.strictEqual(Storage.subjectTrackId(u, 'physics'), 'ages-9-10');
  });

  await t('4. curriculum follows the subject: physics stub has no tracks; switching back restores math', async () => {
    const { Subjects } = load();
    let cur = await Subjects.loadCurriculum('math', fetchWith(STUB_PACKS));
    const mathTracks = cur.tracks;
    cur = Subjects.applyPack(cur, 'physics', await Subjects.loadPack('physics', fetchWith(STUB_PACKS)), 'physics');
    assert.strictEqual(cur.activeSubjectId, 'physics');
    assert.deepStrictEqual(plain(cur.tracks), {});
    cur = Subjects.normalizeCurriculum(cur, 'math');
    assert.strictEqual(cur.tracks, mathTracks, 'same math tracks object back');
  });

  await t("5. Today's path: math unchanged, empty for the physics stub, physics-only lessons for a physics pack", async () => {
    const { Storage } = load();
    const { u } = seed(Storage);
    const mathTrack = MATH.tracks['ages-7-8'];
    const mathPath = Storage.getSuggestedPath(Storage.peekTrackProgress(u, 'ages-7-8', 'math'), mathTrack, 3);
    assert.ok(mathPath.length > 0);
    mathPath.forEach(p => assert.ok(mathTrack.lessons[p.lessonId], 'math lesson'));
    const legacy = Storage.getSuggestedPath(Storage.getTrackProgress(u, 'ages-7-8'), mathTrack, 3);
    assert.deepStrictEqual(plain(mathPath), plain(legacy), 'math path identical to pre-X3 call');
    assert.deepStrictEqual(plain(Storage.getSuggestedPath(Storage.peekTrackProgress(u, 'ages-7-8', 'physics'), null, 3)), []);
    const pPath = Storage.getSuggestedPath(Storage.peekTrackProgress(u, 'ages-7-8', 'physics'), FUTURE_PHYS.tracks['ages-7-8'], 3);
    assert.ok(pPath.length > 0);
    pPath.forEach(p => assert.ok(/^p-l/.test(p.lessonId), 'physics lesson only: ' + p.lessonId));
  });

  await t('6. parent summary follows the subject (stars, lessons, recent) and never writes empty keys', async () => {
    const { Storage, Subjects } = load();
    const { store, u, firstTwo } = seed(Storage);
    let cur = await Subjects.loadCurriculum('math', fetchWith(STUB_PACKS));
    const m = Storage.getParentSummary(store, u.id, cur);
    assert.strictEqual(m.subjectId, 'math');
    assert.strictEqual(m.subjectReady, true);
    assert.strictEqual(m.stars, 7);
    assert.strictEqual(m.lessonsDone, 2);
    assert.strictEqual(m.lessonsTotal, Object.keys(MATH.tracks['ages-7-8'].lessons).length);
    assert.deepStrictEqual(plain(m.recentActivity.map(r => r.lessonId).sort()), firstTwo.slice().sort());
    cur = Subjects.applyPack(cur, 'physics', await Subjects.loadPack('physics', fetchWith(STUB_PACKS)), 'physics');
    const p = Storage.getParentSummary(store, u.id, cur);
    assert.strictEqual(p.subjectId, 'physics');
    assert.strictEqual(p.subjectLabel, 'Physics');
    assert.strictEqual(p.subjectReady, false);
    assert.strictEqual(p.stars, 0);
    assert.strictEqual(p.lessonsDone, 0);
    assert.strictEqual(p.lessonsTotal, 0);
    assert.deepStrictEqual(plain(p.recentActivity), []);
    assert.strictEqual(p.trackLabel, MATH.tracks['ages-7-8'].label, 'age label falls back to math track');
    assert.ok(!('physics:ages-7-8' in u.progress), 'summary did not create a physics key');
    // explicit subject argument wins over curriculum.activeSubjectId
    assert.strictEqual(Storage.getParentSummary(store, u.id, cur, 'math').stars, 7);
  });

  await t('7. parent summary with a physics pack counts physics progress only', async () => {
    const { Storage, Subjects } = load();
    const { store, u } = seed(Storage);
    const cur = await Subjects.loadCurriculum('physics', fetchWith({ ...PACKS, 'data/subjects/physics.json': FUTURE_PHYS }));
    assert.strictEqual(cur.activeSubjectId, 'physics');
    const ptp = Storage.getTrackProgress(u, 'ages-7-8', 'physics');
    Storage.markLessonDone(ptp, 'p-l1', { checkTotal: 2, checkCorrect: 2 });
    ptp.stars = 3;
    Storage.saveTrackProgress(store, u.id, 'ages-7-8', ptp, 'physics');
    const p = Storage.getParentSummary(store, u.id, cur);
    assert.strictEqual(p.subjectReady, true);
    assert.strictEqual(p.stars, 3);
    assert.strictEqual(p.lessonsDone, 1);
    assert.strictEqual(p.lessonsTotal, 2);
    assert.deepStrictEqual(plain(p.recentActivity.map(r => r.lessonId)), ['p-l1']);
    const m = Storage.getParentSummary(store, u.id, cur, 'math');
    assert.strictEqual(m.stars, 7);
    assert.strictEqual(m.lessonsDone, 2);
  });

  await t('8. real v2 export: restore, switch to physics and back leaves math progress identical', async () => {
    const { Storage, Subjects } = load();
    const fx = JSON.parse(read('tests/fixtures/v2-real-progress-export.json'));
    const store = Storage.replaceAllFromImport(Storage.parseImportPayload(JSON.stringify(fx)));
    const s0 = Storage.loadStore();
    assert.ok(Object.keys(s0.users).length > 0);
    const before = plain(Object.values(s0.users).map(u => u.progress));
    let cur = await Subjects.loadCurriculum('math', fetchWith(PACKS));
    const sums = Object.keys(s0.users).map(id => Storage.getParentSummary(s0, id, cur).stars);
    Storage.setActiveSubject(s0, 'physics');
    cur = Subjects.applyPack(cur, 'physics', await Subjects.loadPack('physics', fetchWith(PACKS)), 'physics');
    Object.keys(s0.users).forEach(id => assert.strictEqual(Storage.getParentSummary(s0, id, cur).stars, 0));
    Storage.setActiveSubject(s0, 'math');
    cur = Subjects.normalizeCurriculum(cur, 'math');
    const s1 = Storage.loadStore();
    assert.deepStrictEqual(plain(Object.values(s1.users).map(u => u.progress)), before);
    assert.deepStrictEqual(plain(Object.keys(s1.users).map(id => Storage.getParentSummary(s1, id, cur).stars)), plain(sums));
    assert.ok(store);
  });

  console.log(`\n${pass} passed${fail ? `, ${fail} failed` : ''}`);
  process.exit(fail ? 1 : 0);
})();
