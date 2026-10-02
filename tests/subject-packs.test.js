#!/usr/bin/env node
/* X2 lazy subject pack tests — plain Node, no deps.  Run: node tests/subject-packs.test.js (from repo root) */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
function loadSubjects() {
  const ctx = { window: {}, console, JSON, Math, Promise, Error };
  vm.createContext(ctx);
  vm.runInContext(read('js/subjects.js'), ctx, { filename: 'js/subjects.js' });
  return ctx.window.Subjects;
}
const packFiles = { 'data/subjects/math.json': JSON.parse(read('data/subjects/math.json')), 'data/subjects/physics.json': JSON.parse(read('data/subjects/physics.json')) };
function fakeFetch(log, opts = {}) {
  return async (url) => {
    log.push(url);
    if (opts.fail && opts.fail.includes(url)) return { ok: false, status: 404, json: async () => ({}) };
    const body = packFiles[url];
    return body ? { ok: true, status: 200, json: async () => JSON.parse(JSON.stringify(body)) } : { ok: false, status: 404, json: async () => ({}) };
  };
}
let pass = 0, fail = 0;
async function t(name, fn) {
  try { await fn(); pass++; console.log('ok   - ' + name); } catch (e) { fail++; console.log('FAIL - ' + name + '\n       ' + (e && e.stack || e)); }
}

(async () => {
  await t('1. packs exist: math has the 3 tracks (89 lessons), physics is a valid empty stub; no data/curriculum.json', () => {
    const m = packFiles['data/subjects/math.json'];
    assert.deepStrictEqual(Object.keys(m.tracks).sort(), ['ages-5-6', 'ages-7-8', 'ages-9-10']);
    const n = Object.values(m.tracks).reduce((a, tr) => a + Object.keys(tr.lessons).length, 0);
    assert.strictEqual(n, 89);
    for (const tr of Object.values(m.tracks)) for (const u of tr.units) for (const id of u.lessons) assert.ok(tr.lessons[id], 'unit lesson ' + id);
    const p = packFiles['data/subjects/physics.json'];
    assert.strictEqual(p.meta.subject, 'physics');
    assert.deepStrictEqual(p.tracks, {});
    assert.ok(!fs.existsSync(path.join(ROOT, 'data/curriculum.json')));
  });

  await t('2. boot loads only the math pack (lazy) and keeps curriculum.tracks = math tracks', async () => {
    const S = loadSubjects(), log = [];
    const cur = await S.loadCurriculum('math', fakeFetch(log));
    assert.deepStrictEqual(log, ['data/subjects/math.json']);
    assert.strictEqual(cur.activeSubjectId, 'math');
    assert.deepStrictEqual(Object.keys(cur.tracks).sort(), ['ages-5-6', 'ages-7-8', 'ages-9-10']);
    assert.strictEqual(cur.meta.defaultTrackId, 'ages-7-8');
    assert.strictEqual(cur.subjects.math.packLoaded, true);
    assert.ok(!S.isPackLoaded(cur, 'physics'));
  });

  await t('3. a "soon" active subject (physics) never forces its pack at boot; math stays active', async () => {
    const S = loadSubjects(), log = [];
    const cur = await S.loadCurriculum('physics', fakeFetch(log));
    assert.deepStrictEqual(log, ['data/subjects/math.json']);
    assert.strictEqual(cur.activeSubjectId, 'math');
  });

  await t('4. loadPack fetches each pack once per session (memoised) and on demand only', async () => {
    const S = loadSubjects(), log = [], f = fakeFetch(log);
    await S.loadCurriculum('math', f);
    const p1 = await S.loadPack('physics', f), p2 = await S.loadPack('physics', f);
    await S.loadPack('math', f);
    assert.strictEqual(p1, p2);
    assert.deepStrictEqual(log, ['data/subjects/math.json', 'data/subjects/physics.json']);
  });

  await t('5. applyPack merges a subject pack without touching math; live subject switch re-points tracks', async () => {
    const S = loadSubjects(), f = fakeFetch([]);
    let cur = await S.loadCurriculum('math', f);
    cur = S.applyPack(cur, 'physics', { meta: { subject: 'physics' }, tracks: { 'ages-7-8': { id: 'ages-7-8', units: [], lessons: { 'phy-1': {} } } } }, 'math');
    assert.ok(S.isPackLoaded(cur, 'physics'));
    assert.deepStrictEqual(Object.keys(cur.subjects.physics.tracks), ['ages-7-8']);
    assert.strictEqual(Object.keys(cur.subjects.math.tracks).length, 3);
    assert.strictEqual(cur.tracks, cur.subjects.math.tracks, 'physics is not live yet, math stays active');
    S.CATALOG.find((s) => s.id === 'physics').status = 'live';
    const sw = S.normalizeCurriculum(cur, 'physics');
    assert.strictEqual(sw.activeSubjectId, 'physics');
    assert.ok(sw.tracks['ages-7-8'].lessons['phy-1']);
  });

  await t('6. a failed pack fetch rejects and can be retried (not cached as a failure); bad JSON shape rejects', async () => {
    const S = loadSubjects(), log = [];
    await assert.rejects(S.loadPack('physics', fakeFetch(log, { fail: ['data/subjects/physics.json'] })), /physics/);
    const ok = await S.loadPack('physics', fakeFetch(log));
    assert.deepStrictEqual(ok.tracks, {});
    const S2 = loadSubjects();
    await assert.rejects(S2.loadPack('physics', async () => ({ ok: true, json: async () => ({ nope: 1 }) })), /not valid/);
  });

  await t('7. sw.js: math pack precached, physics not; pack route caches on first use in a kept cache', () => {
    const sw = read('sw.js');
    assert.match(sw, /const CACHE = 'einstein-math-v\d+\.\d+\.\d+'/);
    assert.ok(sw.includes("'./data/subjects/math.json'"));
    assert.ok(!sw.includes('physics.json'));
    assert.ok(!sw.includes('curriculum.json'));
    assert.ok(sw.includes("url.pathname.includes('/data/subjects/')"));
    assert.ok(/k !== PACK_CACHE/.test(sw), 'pack cache survives version bumps');
    const ver = sw.match(/einstein-math-v(\d+\.\d+\.\d+)/)[1];
    assert.ok(read('index.html').includes('v' + ver + ' ·'), 'index.html footer matches SW cache version');
  });

  console.log('\n' + pass + ' passed' + (fail ? ', ' + fail + ' failed' : ''));
  process.exit(fail ? 1 : 0);
})();
