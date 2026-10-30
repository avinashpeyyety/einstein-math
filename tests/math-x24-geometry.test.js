#!/usr/bin/env node
/* X24 cycle 1/2 — ages 9–10 geometry: lines/rays/angles, measure angles (protractor), parallel &
 * perpendicular (4.G.1–2, 4.MD.5–7). Run: node tests/math-x24-geometry.test.js   (from repo root) */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const ROOT = path.resolve(__dirname, '..');
const MATH = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/subjects/math.json'), 'utf8'));
const APP = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const tr = MATH.tracks['ages-9-10'];
const IDS = ['g4-lines-rays-angles', 'g4-measure-angles', 'g4-parallel-perp'];
const unit = tr.units.find(u => u.id === 'u4-geometry');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('ok  ' + name); }
  catch (e) { fail++; console.log('FAIL ' + name + '\n   ' + String(e.stack || e).split('\n').slice(0, 3).join('\n   ')); }
}
const items = L => [...L.practice, ...L.quickCheck];
const num = a => { const m = String(a).trim().match(/^(\d+)°?$/); return m ? +m[1] : NaN; };
const kindOf = d => (d < 90 ? 'acute' : d === 90 ? 'right' : d < 180 ? 'obtuse' : 'straight');
const NAMED = { right: 90, straight: 180 };

/** Independent check for every computable prompt shape. Returns a predicate on an answer, or null. */
function checker(prompt) {
  const p = prompt.trim();
  let m;
  if ((m = p.match(/^An angle measures (\d+)°\. What kind of angle is it\?$/))) { const v = kindOf(+m[1]); return a => a === v; }
  if ((m = p.match(/^On a protractor, one ray of an angle sits on 0°\. The other ray points to (\d+)°\. How many degrees is the angle\?$/))) { const v = +m[1]; return a => num(a) === v; }
  if ((m = p.match(/^An angle is split into two parts: (\d+)° and (\d+)°\. How big is the whole angle\?$/))) { const v = +m[1] + +m[2]; return a => num(a) === v; }
  if ((m = p.match(/^A (right|straight) angle \((\d+)°\) is split into two parts\. One part is (\d+)°\. How big is the other part\?$/))) {
    assert.strictEqual(+m[2], NAMED[m[1]], 'named angle size');
    const v = +m[2] - +m[3]; assert.ok(v > 0); return a => num(a) === v;
  }
  if (/^A full turn all the way around a circle is how many degrees\?$/.test(p)) return a => num(a) === 360;
  if ((m = p.match(/^A ray turns through (\d+)\/(\d+) of a full circle\. How many degrees is that\?$/))) { const v = 360 * +m[1] / +m[2]; return a => num(a) === v; }
  if (/^Perpendicular lines meet at an angle of how many degrees\?$/.test(p)) return a => num(a) === 90;
  if (/^Perpendicular lines make what kind of angle\?$/.test(p)) return a => a === 'right';
  if (/^How many endpoints does a line segment have\?$/.test(p)) return a => num(a) === 2 || a === 'two';
  return null;
}

t('1. the 3 lessons sit in u4-geometry right after g4-coord-plane; track has 38 lessons (cycle 2 +2); old lessons untouched', () => {
  const i = unit.lessons.indexOf('g4-coord-plane');
  assert.ok(i >= 0);
  assert.deepStrictEqual(unit.lessons.slice(i + 1, i + 4), IDS);
  assert.strictEqual(Object.keys(tr.lessons).length, 42); // +2 X24 cycle 2, +4 X26
  IDS.forEach(id => assert.strictEqual(tr.lessons[id].unitId, 'u4-geometry', id));
  assert.deepStrictEqual(tr.lessons['g4-coord-plane'].prerequisites, []);
  const all = tr.units.flatMap(u => u.lessons);
  assert.strictEqual(new Set(all).size, all.length);
  assert.deepStrictEqual([...all].sort(), Object.keys(tr.lessons).sort());
  assert.strictEqual(tr.units.filter(u => /geometry/i.test(u.id)).length, 1, 'no second geometry unit');
});

t('2. prerequisites chain g4-coord-plane → 1 → 2 → 3; all resolve', () => {
  const [a, b, c] = IDS.map(id => tr.lessons[id]);
  assert.deepStrictEqual(a.prerequisites, ['g4-coord-plane']);
  assert.deepStrictEqual(b.prerequisites, [a.id]);
  assert.deepStrictEqual(c.prerequisites, [b.id]);
  IDS.forEach(id => tr.lessons[id].prerequisites.forEach(p => assert.ok(tr.lessons[p], id + ' prereq ' + p)));
});

t('3. lesson shape: intro, 2 panels, worked example (3 steps), 5 practice, 3 checks, ids globally unique', () => {
  const ref = Object.keys(tr.lessons['g4-coord-plane']).sort();
  IDS.forEach(id => {
    const L = tr.lessons[id];
    assert.deepStrictEqual(Object.keys(L).sort(), ref, id + ' same keys as existing lessons');
    assert.ok(L.einsteinIntro && L.title && L.durationMin > 0, id);
    assert.strictEqual(L.explain.panels.length, 2, id);
    assert.strictEqual(L.workedExample.steps.length, 3, id);
    assert.strictEqual(L.practice.length, 5, id);
    assert.strictEqual(L.quickCheck.length, 3, id);
    L.practice.forEach(q => assert.ok(q.hint && q.feedbackCorrect && q.feedbackWrong, q.id + ' practice feedback'));
  });
  const every = Object.values(MATH.tracks).flatMap(x => Object.values(x.lessons)).flatMap(items).map(q => q.id);
  IDS.forEach(id => items(tr.lessons[id]).forEach(q => assert.strictEqual(every.filter(x => x === q.id).length, 1, 'globally unique ' + q.id)));
});

t('4. answers are valid: mc answer is a choice (no dupes, ≥3 choices), fill accepts its answer', () => {
  IDS.forEach(id => items(tr.lessons[id]).forEach(q => {
    if (q.type === 'mc') {
      assert.ok(q.choices.includes(q.answer), q.id);
      assert.ok(q.choices.length >= 3, q.id + ' choices');
      assert.strictEqual(new Set(q.choices).size, q.choices.length, q.id + ' dup choices');
    } else {
      assert.strictEqual(q.type, 'fill', q.id);
      assert.ok(q.accept.includes(q.answer), q.id);
    }
  }));
});

t('5. every computable answer is right; every accepted fill is right; exactly one mc choice is right', () => {
  let n = 0;
  IDS.forEach(id => items(tr.lessons[id]).forEach(q => {
    const ok = checker(q.prompt);
    if (!ok) return;
    assert.ok(ok(q.answer), `${q.id}: "${q.prompt}" → ${q.answer}`);
    if (q.type === 'fill') q.accept.forEach(a => assert.ok(ok(a), `${q.id} accepts wrong "${a}"`));
    else assert.strictEqual(q.choices.filter(c => ok(c)).length, 1, `${q.id} has ${q.choices.filter(c => ok(c)).length} right choices`);
    n++;
  }));
  assert.ok(n >= 14, 'machine-checked ' + n + ' items');
  // conceptual items the solver skips — pin them
  const A = id => items(tr.lessons[IDS[+(id[3] === 'b') + 2 * +(id[3] === 'c')]]).find(q => q.id === id).answer;
  assert.strictEqual(A('x24a-p1'), 'line');
  assert.strictEqual(A('x24a-p5'), 'right');
  assert.strictEqual(A('x24a-q1'), 'ray');
  assert.strictEqual(A('x24c-p1'), 'parallel');
  assert.strictEqual(A('x24c-p2'), 'perpendicular');
  assert.strictEqual(A('x24c-p4'), 'parallel');
  assert.strictEqual(A('x24c-p5'), 'no — they cross, but not at 90°');
  assert.strictEqual(A('x24c-q1'), 'parallel');
  assert.strictEqual(A('x24c-q2'), 'perpendicular');
});

t('6. coverage: line/ray/segment; acute+right+obtuse; protractor (with the other-scale distractor); additive + missing part; parallel & perpendicular', () => {
  const [L1, L2, L3] = IDS.map(id => items(tr.lessons[id]));
  const kinds = new Set(L1.filter(q => /What kind of angle/.test(q.prompt)).map(q => q.answer).concat(L1.filter(q => /clock/.test(q.prompt)).map(q => q.answer)));
  ['acute', 'right', 'obtuse'].forEach(k => assert.ok(kinds.has(k), 'angle kind ' + k));
  assert.ok(L1.some(q => /line segment/.test(q.prompt)) && L1.some(q => q.answer === 'ray') && L1.some(q => q.answer === 'line'));
  const pro = L2.filter(q => /^On a protractor/.test(q.prompt));
  assert.ok(pro.length >= 2);
  const mcPro = pro.find(q => q.type === 'mc');
  assert.ok(mcPro && mcPro.choices.includes(String(180 - +mcPro.answer)), 'other-scale reading is a distractor');
  assert.ok(L2.some(q => /split into two parts: /.test(q.prompt)) && L2.some(q => /One part is/.test(q.prompt)), 'additive angles');
  assert.ok(L2.some(q => /full circle|full turn/.test(q.prompt)), 'degrees as part of 360');
  assert.ok(L3.some(q => q.answer === 'parallel') && L3.some(q => q.answer === 'perpendicular'));
  // cycle-2 topics stay out of cycle 1
  IDS.forEach(id => items(tr.lessons[id]).forEach(q => assert.ok(!/symmetr|quadrilateral|isosceles|equilateral|scalene/i.test(q.prompt), q.id)));
});

t('7. every panel visual has a renderer; geometryFigure renders sane SVG for each kind', () => {
  assert.ok(APP.includes('function geometryFigure'));
  IDS.forEach(id => tr.lessons[id].explain.panels.forEach(p => assert.ok(APP.includes(`'${p.visual}':`), p.visual + ' key')));
  const grab = name => { const i = APP.indexOf('  function ' + name); const j = APP.indexOf('\n  }\n', i); return APP.slice(i, j + 4); };
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(grab('geometryFigure') + '; this.g = geometryFigure;', ctx);
  const svgOk = s => { assert.ok(/<svg viewBox="0 0 280 \d+"/.test(s)); assert.ok(!/NaN|undefined/.test(s), 'no NaN/undefined'); };
  const lines = ctx.g({ kind: 'lines', aria: 'x' });
  svgOk(lines);
  assert.ok(/role="img" aria-label="x"/.test(lines));
  assert.strictEqual((lines.match(/<polygon /g) || []).length, 3, 'line 2 arrowheads + ray 1, segment 0');
  assert.strictEqual((lines.match(/<circle /g) || []).length, 6, 'two labelled points per row');
  const ang = ctx.g({ kind: 'angles', angles: [50, 90, 130] });
  svgOk(ang);
  ['>acute<', '>right<', '>obtuse<', '>50°<', '>90°<', '>130°<'].forEach(s => assert.ok(ang.includes(s), s));
  const pr = ctx.g({ kind: 'protractor', deg: 60 });
  svgOk(pr);
  ['>0<', '>90<', '>180<', '>60°<'].forEach(s => assert.ok(pr.includes(s), s));
  // the 60° ray tip: angle measured counter-clockwise from the right-hand 0 ray (screen y grows downward)
  const cx = 140, cy = 140, r = 116, tip = [cx + r * Math.cos(Math.PI / 3), cy - r * Math.sin(Math.PI / 3)].map(v => v.toFixed(1));
  assert.ok(pr.includes(`x2="${tip[0]}" y2="${tip[1]}"`), '60° ray drawn at 60°');
  const add = ctx.g({ kind: 'protractor', parts: [30, 45] });
  svgOk(add);
  assert.ok(add.includes('>30°<') && add.includes('>45°<'));
  ['parallel', 'perpendicular'].forEach(k => svgOk(ctx.g({ kind: k })));
  assert.ok(ctx.g({ kind: 'perpendicular' }).includes('>90°<'));
});

t('8. storage: lesson status follows the chain; stars land under math:ages-9-10', () => {
  const ls = new Map();
  const ctx = {
    localStorage: { getItem: k => (ls.has(k) ? ls.get(k) : null), setItem: (k, v) => ls.set(k, String(v)), removeItem: k => ls.delete(k) },
    window: {}, console, Date, JSON, Math
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/storage.js'), 'utf8'), ctx);
  const S = ctx.window.Storage;
  const store = S.loadStore();
  S.createUser(store, { displayName: 'Ravi', trackId: 'ages-9-10' });
  const u = S.getActiveUser(store);
  const tp = S.getTrackProgress(u, 'ages-9-10', 'math');
  assert.strictEqual(S.lessonStatus(tp, 'g4-lines-rays-angles', tr), 'locked');
  S.markLessonDone(tp, 'g4-coord-plane', { checkTotal: 2, checkCorrect: 2 });
  assert.strictEqual(S.lessonStatus(tp, 'g4-lines-rays-angles', tr), 'ready');
  assert.strictEqual(S.lessonStatus(tp, 'g4-measure-angles', tr), 'locked');
  const before = tp.stars;
  S.markLessonDone(tp, 'g4-lines-rays-angles', { checkTotal: 3, checkCorrect: 3 });
  assert.strictEqual(tp.stars, before + 1);
  assert.strictEqual(S.lessonStatus(tp, 'g4-measure-angles', tr), 'ready');
  assert.strictEqual(S.lessonStatus(tp, 'g4-parallel-perp', tr), 'locked');
  S.saveTrackProgress(store, u.id, 'ages-9-10', tp, 'math');
  assert.strictEqual(S.getActiveUser(S.loadStore()).progress['math:ages-9-10'].stars, before + 1);
});

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
