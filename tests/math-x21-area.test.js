#!/usr/bin/env node
/* X21 — ages 7–8 Area (3.MD.5–8): unit squares, rows × columns, additive area + area vs perimeter.
 * Run: node tests/math-x21-area.test.js   (from repo root) */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const ROOT = path.resolve(__dirname, '..');
const MATH = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/subjects/math.json'), 'utf8'));
const APP = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const tr = MATH.tracks['ages-7-8'];
const IDS = ['ar-unit-squares', 'ar-rows-columns', 'ar-area-vs-perimeter'];
const unit = tr.units.find(u => u.id === 'unit-area');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('ok  ' + name); }
  catch (e) { fail++; console.log('FAIL ' + name + '\n   ' + String(e.stack || e).split('\n').slice(0, 3).join('\n   ')); }
}
const items = L => [...L.practice, ...L.quickCheck];

/** Independent answer for every prompt shape the unit uses (null = not machine-checkable). */
function solve(prompt) {
  const p = prompt.trim();
  let m;
  // "A RxC grid of unit squares has area ?" / "R rows × C columns = area ?" / "R × C rectangle area ?"
  if ((m = p.match(/^A (\d+)×(\d+) (?:grid of unit squares|square of unit squares) has area \?$/)))
    return String(+m[1] * +m[2]);
  if ((m = p.match(/^(\d+) rows × (\d+) columns = area \?$/)))
    return String(+m[1] * +m[2]);
  if ((m = p.match(/^(\d+) × (\d+) rectangle area \?$/)))
    return String(+m[1] * +m[2]);
  if ((m = p.match(/^Area of a rectangle with (\d+) rows and (\d+) columns\?$/)))
    return String(+m[1] * +m[2]);
  if ((m = p.match(/^Area of a (\d+)-by-(\d+) rectangle\?$/)))
    return String(+m[1] * +m[2]);
  if ((m = p.match(/^How many unit squares are in a (\d+)×(\d+) rectangle\?$/)))
    return String(+m[1] * +m[2]);
  if ((m = p.match(/^Area of a (\d+)×(\d+) strip of unit squares\?$/)))
    return String(+m[1] * +m[2]);
  if ((m = p.match(/^Rectangle (\d+)×(\d+): area \?$/)))
    return String(+m[1] * +m[2]);
  if ((m = p.match(/^Rectangle (\d+)×(\d+): perimeter\?$/)))
    return String(2 * (+m[1] + +m[2]));
  if ((m = p.match(/^Rectangle (\d+) by (\d+)\. Which is the AREA\?$/)))
    return String(+m[1] * +m[2]);
  if ((m = p.match(/^Rectangle (\d+) by (\d+)\. Which is the PERIMETER\?$/)))
    return String(2 * (+m[1] + +m[2]));
  // L-shape additive: "L-shape: AxB rectangle + CxD rectangle. Total area ?"
  if ((m = p.match(/^L-shape: (\d+)×(\d+) rectangle \+ (\d+)×(\d+) rectangle\. Total area \?$/)))
    return String(+m[1] * +m[2] + +m[3] * +m[4]);
  if ((m = p.match(/^L-shape split: (\d+)×(\d+) \+ (\d+)×(\d+)\. Total area \?$/)))
    return String(+m[1] * +m[2] + +m[3] * +m[4]);
  if ((m = p.match(/^Which equation finds the area of a (\d+)-by-(\d+) rectangle\?$/)))
    return `${m[1]} × ${m[2]}`;
  return null;
}

t('1. unit unit-area (after unit-mult-div) holds the 3 lessons in order; track has 37 lessons', () => {
  assert.ok(unit, 'unit exists');
  assert.deepStrictEqual(unit.lessons, IDS);
  const ids = tr.units.map(u => u.id);
  assert.strictEqual(ids.indexOf('unit-area'), ids.indexOf('unit-mult-div') + 1);
  assert.strictEqual(Object.keys(tr.lessons).length, 37);
  IDS.forEach(id => assert.strictEqual(tr.lessons[id].unitId, 'unit-area', id));
  const all = tr.units.flatMap(u => u.lessons);
  assert.strictEqual(new Set(all).size, all.length);
  assert.deepStrictEqual([...all].sort(), Object.keys(tr.lessons).sort());
});

t('2. prerequisites chain 1 → 2 → 3; lesson 1 builds on arrays; all resolve', () => {
  const [a, b, c] = IDS.map(id => tr.lessons[id]);
  assert.ok(b.prerequisites.includes(a.id), 'lesson 2 needs lesson 1');
  assert.ok(c.prerequisites.includes(b.id), 'lesson 3 needs lesson 2');
  assert.ok(!a.prerequisites.some(p => IDS.includes(p)), 'no cycle');
  assert.deepStrictEqual(a.prerequisites, ['md-arrays-div']);
  IDS.forEach(id => tr.lessons[id].prerequisites.forEach(p => assert.ok(tr.lessons[p], id + ' prereq ' + p)));
});

t('3. lesson shape: intro, 2 panels, worked example (3 steps), 5 practice, 3 checks, unique ids', () => {
  const ref = Object.keys(tr.lessons['md-equal-groups']).sort();
  IDS.forEach(id => {
    const L = tr.lessons[id];
    assert.deepStrictEqual(Object.keys(L).sort(), ref, id + ' same keys as existing lessons');
    assert.ok(L.einsteinIntro && L.title && L.durationMin > 0, id);
    assert.strictEqual(L.explain.panels.length, 2, id);
    assert.strictEqual(L.workedExample.steps.length, 3, id);
    assert.strictEqual(L.practice.length, 5, id);
    assert.strictEqual(L.quickCheck.length, 3, id);
    const ids = items(L).map(q => q.id);
    assert.strictEqual(new Set(ids).size, ids.length, id + ' duplicate item id');
  });
  const every = Object.values(MATH.tracks).flatMap(x => Object.values(x.lessons)).flatMap(items).map(q => q.id);
  IDS.forEach(id => items(tr.lessons[id]).forEach(q => assert.strictEqual(every.filter(x => x === q.id).length, 1, 'globally unique ' + q.id)));
});

t('4. answers are valid: mc answer is a choice (no dupes), fill accepts its answer and is numeric when expected', () => {
  IDS.forEach(id => items(tr.lessons[id]).forEach(q => {
    if (q.type === 'mc') {
      assert.ok(q.choices.includes(q.answer), q.id);
      assert.strictEqual(new Set(q.choices).size, q.choices.length, q.id + ' dup choices');
    } else {
      assert.strictEqual(q.type, 'fill', q.id);
      assert.ok(q.accept.includes(q.answer), q.id);
    }
  }));
});

t('5. every answer is mathematically right (independent solver)', () => {
  let n = 0;
  IDS.forEach(id => items(tr.lessons[id]).forEach(q => {
    const want = solve(q.prompt);
    if (want === null) return;
    assert.strictEqual(q.answer, want, `${q.id}: "${q.prompt}"`);
    n++;
  }));
  assert.ok(n >= 18, 'machine-checked ' + n + ' items');
  // conceptual items the solver skips — pin expected answers
  assert.strictEqual(tr.lessons['ar-unit-squares'].practice.find(q => q.id === 'x21a-p1').answer, 'how much space a shape covers');
  assert.strictEqual(tr.lessons['ar-area-vs-perimeter'].practice.find(q => q.id === 'x21c-p1').answer, 'inside ; around');
});

t('6. coverage: unit-square count, rows×columns, additive L-area, area vs perimeter distinction', () => {
  const L1 = items(tr.lessons['ar-unit-squares']);
  const L2 = items(tr.lessons['ar-rows-columns']);
  const L3 = items(tr.lessons['ar-area-vs-perimeter']);
  assert.ok(L1.some(q => /unit squares|square unit/.test(q.prompt)), 'unit squares');
  assert.ok(L2.some(q => /rows × columns|rows and .* columns|×/.test(q.prompt)), 'rows×cols');
  assert.ok(L3.some(q => /L-shape/.test(q.prompt)), 'L-shape additive');
  assert.ok(L3.some(q => /AREA/.test(q.prompt)) && L3.some(q => /PERIMETER/.test(q.prompt)), 'area vs perim');
  // same rectangle: area ≠ perimeter for 3×5
  const area35 = L3.find(q => /3 by 5.*AREA/.test(q.prompt));
  const perim35 = L3.find(q => /3 by 5.*PERIMETER/.test(q.prompt));
  assert.ok(area35 && perim35);
  assert.strictEqual(area35.answer, '15');
  assert.strictEqual(perim35.answer, '16');
  assert.notStrictEqual(area35.answer, perim35.answer);
});

t('7. every panel visual has a renderer in js/app.js (unitSquareGrid keys)', () => {
  assert.ok(APP.includes('function unitSquareGrid'), 'helper present');
  IDS.forEach(id => tr.lessons[id].explain.panels.forEach(p => {
    assert.ok(APP.includes(`'${p.visual}':`), p.visual + ' key');
  }));
  ['area-grid-3x4', 'area-grid-tile', 'area-grid-rows-cols', 'area-grid-mult', 'area-l-shape', 'area-vs-perim-grid']
    .forEach(k => assert.ok(APP.includes(`'${k}':`), k));
});

t('8. storage: lesson status follows the chain; stars land under math:ages-7-8', () => {
  const ls = new Map();
  const ctx = {
    localStorage: {
      getItem: k => (ls.has(k) ? ls.get(k) : null),
      setItem: (k, v) => ls.set(k, String(v)),
      removeItem: k => ls.delete(k)
    },
    window: {}, console, Date, JSON, Math
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/storage.js'), 'utf8'), ctx);
  const S = ctx.window.Storage;
  const store = S.loadStore();
  S.createUser(store, { displayName: 'Ana', trackId: 'ages-7-8' });
  const u = S.getActiveUser(store);
  const tp = S.getTrackProgress(u, 'ages-7-8', 'math');
  assert.strictEqual(S.lessonStatus(tp, 'ar-unit-squares', tr), 'locked');
  // unlock arrays chain: md-equal-groups → md-arrays-div
  S.markLessonDone(tp, 'md-equal-groups', { checkTotal: 3, checkCorrect: 3 });
  S.markLessonDone(tp, 'md-arrays-div', { checkTotal: 3, checkCorrect: 3 });
  assert.strictEqual(S.lessonStatus(tp, 'ar-unit-squares', tr), 'ready');
  assert.strictEqual(S.lessonStatus(tp, 'ar-rows-columns', tr), 'locked');
  const before = tp.stars;
  S.markLessonDone(tp, 'ar-unit-squares', { checkTotal: 3, checkCorrect: 3 });
  assert.strictEqual(tp.stars, before + 1);
  assert.strictEqual(S.lessonStatus(tp, 'ar-rows-columns', tr), 'ready');
  assert.strictEqual(S.lessonStatus(tp, 'ar-area-vs-perimeter', tr), 'locked');
  S.saveTrackProgress(store, u.id, 'ages-7-8', tp, 'math');
  assert.strictEqual(S.getActiveUser(S.loadStore()).progress['math:ages-7-8'].stars, before + 1);
  tp.diagnosticDone = true;
  assert.strictEqual(S.lessonStatus(tp, 'ar-area-vs-perimeter', tr), 'ready');
});

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
