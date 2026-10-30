#!/usr/bin/env node
/* X24 cycle 2/2 — ages 9–10 geometry: classify triangles & quadrilaterals (4.G.2, 5.G.3–4) and line
 * symmetry (4.G.3). Run: node tests/math-x24b-geometry.test.js   (from repo root) */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const ROOT = path.resolve(__dirname, '..');
const MATH = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/subjects/math.json'), 'utf8'));
const APP = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const tr = MATH.tracks['ages-9-10'];
const IDS = ['g4-classify-shapes', 'g4-symmetry'];
const unit = tr.units.find(u => u.id === 'u4-geometry');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('ok  ' + name); }
  catch (e) { fail++; console.log('FAIL ' + name + '\n   ' + String(e.stack || e).split('\n').slice(0, 3).join('\n   ')); }
}
const items = L => [...L.practice, ...L.quickCheck];
const WORDS = { zero: 0, one: 1, two: 2, three: 3, four: 4 };
const num = a => { const s = String(a).trim().toLowerCase(); return s in WORDS ? WORDS[s] : /^\d+$/.test(s) ? +s : NaN; };
// block capitals with at least one line of symmetry (sans-serif)
const SYM_LETTERS = new Set('ABCDEHIKMOTUVWXY'.split(''));
const SYM_COUNT = { square: 4, 'equilateral triangle': 3, 'rectangle (not a square)': 2, 'isosceles triangle (not equilateral)': 1, 'scalene triangle': 0 };

function checker(prompt) {
  const p = prompt.trim();
  let m;
  if ((m = p.match(/^A triangle has sides (\d+) cm, (\d+) cm and (\d+) cm\. What kind of triangle is it \(by its sides\)\?$/))) {
    const s = [+m[1], +m[2], +m[3]].sort((a, b) => a - b);
    assert.ok(s[0] + s[1] > s[2], 'triangle inequality');
    const v = s[0] === s[2] ? 'equilateral' : (s[0] === s[1] || s[1] === s[2]) ? 'isosceles' : 'scalene';
    // equilateral is also (inclusively) isosceles: an equilateral item must not offer isosceles
    return a => a === v;
  }
  if ((m = p.match(/^A triangle has angles (\d+)°, (\d+)° and (\d+)°\. What kind of triangle is it \(by its angles\)\?$/))) {
    const s = [+m[1], +m[2], +m[3]];
    assert.strictEqual(s[0] + s[1] + s[2], 180, 'angles sum to 180');
    const mx = Math.max(...s), v = mx === 90 ? 'right' : mx > 90 ? 'obtuse' : 'acute';
    return a => a === v;
  }
  if ((m = p.match(/^How many lines of symmetry does an? (.+) have\?$/))) {
    assert.ok(m[1] in SYM_COUNT, 'known shape ' + m[1]);
    const v = SYM_COUNT[m[1]];
    return a => num(a) === v;
  }
  if (/^Which capital letter has a line of symmetry\?$/.test(p)) return a => SYM_LETTERS.has(a);
  if (/^Which capital letter has NO line of symmetry\?$/.test(p)) return a => !SYM_LETTERS.has(a);
  return null;
}

t('1. the 2 lessons sit in u4-geometry right after g4-parallel-perp; track has 38 lessons; cycle-1 lessons untouched', () => {
  const i = unit.lessons.indexOf('g4-parallel-perp');
  assert.ok(i >= 0);
  assert.deepStrictEqual(unit.lessons.slice(i + 1, i + 3), IDS);
  assert.strictEqual(Object.keys(tr.lessons).length, 42);
  IDS.forEach(id => assert.strictEqual(tr.lessons[id].unitId, 'u4-geometry', id));
  ['g4-coord-plane', 'g4-lines-rays-angles', 'g4-measure-angles', 'g4-parallel-perp'].forEach(id => assert.ok(unit.lessons.includes(id), id));
  const all = tr.units.flatMap(u => u.lessons);
  assert.strictEqual(new Set(all).size, all.length);
  assert.deepStrictEqual([...all].sort(), Object.keys(tr.lessons).sort());
});

t('2. prerequisites chain g4-parallel-perp → classify → symmetry', () => {
  assert.deepStrictEqual(tr.lessons['g4-classify-shapes'].prerequisites, ['g4-parallel-perp']);
  assert.deepStrictEqual(tr.lessons['g4-symmetry'].prerequisites, ['g4-classify-shapes']);
});

t('3. lesson shape: same keys, 2 panels, 3-step example, 5 practice with feedback, 3 checks, ids globally unique', () => {
  const ref = Object.keys(tr.lessons['g4-parallel-perp']).sort();
  IDS.forEach(id => {
    const L = tr.lessons[id];
    assert.deepStrictEqual(Object.keys(L).sort(), ref, id);
    assert.strictEqual(L.explain.panels.length, 2, id);
    assert.strictEqual(L.workedExample.steps.length, 3, id);
    assert.strictEqual(L.practice.length, 5, id);
    assert.strictEqual(L.quickCheck.length, 3, id);
    L.practice.forEach(q => assert.ok(q.hint && q.feedbackCorrect && q.feedbackWrong, q.id));
  });
  const every = Object.values(MATH.tracks).flatMap(x => Object.values(x.lessons)).flatMap(items).map(q => q.id);
  IDS.forEach(id => items(tr.lessons[id]).forEach(q => assert.strictEqual(every.filter(x => x === q.id).length, 1, q.id)));
});

t('4. mc answer is a choice (≥3, no dupes); fill accepts its answer', () => {
  IDS.forEach(id => items(tr.lessons[id]).forEach(q => {
    if (q.type === 'mc') {
      assert.ok(q.choices.includes(q.answer), q.id);
      assert.ok(q.choices.length >= 3, q.id);
      assert.strictEqual(new Set(q.choices).size, q.choices.length, q.id);
    } else {
      assert.strictEqual(q.type, 'fill', q.id);
      assert.ok(q.accept.includes(q.answer), q.id);
    }
  }));
});

t('5. every computable answer re-derived; exactly one right mc choice; every accepted fill right', () => {
  let n = 0;
  IDS.forEach(id => items(tr.lessons[id]).forEach(q => {
    const ok = checker(q.prompt);
    if (!ok) return;
    assert.ok(ok(q.answer), `${q.id}: ${q.prompt} → ${q.answer}`);
    if (q.type === 'fill') q.accept.forEach(a => assert.ok(ok(a), `${q.id} accepts wrong ${a}`));
    else assert.strictEqual(q.choices.filter(c => ok(c)).length, 1, q.id);
    if (/by its sides/.test(q.prompt) && q.answer === 'equilateral') assert.ok(!q.choices.includes('isosceles'), q.id + ' inclusive-definition ambiguity');
    n++;
  }));
  assert.ok(n >= 11, 'machine-checked ' + n);
  const A = qid => IDS.flatMap(id => items(tr.lessons[id])).find(q => q.id === qid).answer;
  assert.strictEqual(A('x24d-p4'), 'yes — it has 4 right angles');
  assert.strictEqual(A('x24d-p5'), 'rhombus');
  assert.strictEqual(A('x24d-q3'), 'parallelogram');
  assert.strictEqual(A('x24e-p1'), 'match exactly');
});

t('6. coverage: equilateral/isosceles/scalene, acute/right/obtuse, quad hierarchy; symmetry counts + letters', () => {
  const [A, B] = IDS.map(id => items(tr.lessons[id]));
  ['equilateral', 'isosceles'].forEach(k => assert.ok(A.some(q => q.answer === k), k));
  assert.ok(A.some(q => /by its sides/.test(q.prompt) && q.choices.includes('scalene')));
  ['right', 'obtuse'].forEach(k => assert.ok(A.some(q => /by its angles/.test(q.prompt) && q.answer === k), k));
  assert.ok(A.some(q => /square/.test(q.prompt) && /rectangle/.test(q.prompt)), 'square is a rectangle');
  assert.ok(B.filter(q => /lines of symmetry/.test(q.prompt)).length >= 4);
  assert.ok(B.some(q => /NO line of symmetry/.test(q.prompt)) && B.some(q => /has a line of symmetry/.test(q.prompt)));
});

t('7. panel visuals have renderers; new geometryFigure kinds render sane SVG', () => {
  IDS.forEach(id => tr.lessons[id].explain.panels.forEach(p => assert.ok(APP.includes(`'${p.visual}':`), p.visual)));
  const grab = name => { const i = APP.indexOf('  function ' + name); const j = APP.indexOf('\n  }\n', i); return APP.slice(i, j + 4); };
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(grab('geometryFigure') + '; this.g = geometryFigure;', ctx);
  const ok = s => { assert.ok(/<svg viewBox="0 0 280 \d+"/.test(s)); assert.ok(!/NaN|undefined/.test(s)); return s; };
  const tri = ok(ctx.g({ kind: 'triangles' }));
  assert.strictEqual((tri.match(/<polygon /g) || []).length, 3);
  ['>equilateral<', '>isosceles<', '>scalene<'].forEach(s => assert.ok(tri.includes(s), s));
  const q = ok(ctx.g({ kind: 'quads' }));
  assert.strictEqual((q.match(/<polygon /g) || []).length, 4);
  ['>square<', '>rectangle<', '>rhombus<', '>parallelogram<'].forEach(s => assert.ok(q.includes(s), s));
  const sy = ok(ctx.g({ kind: 'symmetry' }));
  assert.strictEqual((sy.match(/stroke-dasharray/g) || []).length, 4 + 2 + 3, 'square 4 + rectangle 2 + triangle 3 fold lines');
  const le = ok(ctx.g({ kind: 'letters' }));
  assert.strictEqual((le.match(/stroke-dasharray/g) || []).length, 1 + 2 + 1, 'A 1, H 2, B 1, F 0');
  ['>A<', '>H<', '>B<', '>F<', '>none<'].forEach(s => assert.ok(le.includes(s), s));
  // cycle-1 kinds still render
  ['lines', 'angles', 'protractor', 'parallel', 'perpendicular'].forEach(k => ok(ctx.g({ kind: k })));
});

t('8. storage: classify unlocks after parallel-perp; symmetry after classify', () => {
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
  assert.strictEqual(S.lessonStatus(tp, 'g4-classify-shapes', tr), 'locked');
  S.markLessonDone(tp, 'g4-parallel-perp', { checkTotal: 3, checkCorrect: 3 });
  assert.strictEqual(S.lessonStatus(tp, 'g4-classify-shapes', tr), 'ready');
  assert.strictEqual(S.lessonStatus(tp, 'g4-symmetry', tr), 'locked');
  S.markLessonDone(tp, 'g4-classify-shapes', { checkTotal: 3, checkCorrect: 3 });
  assert.strictEqual(S.lessonStatus(tp, 'g4-symmetry', tr), 'ready');
});

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
