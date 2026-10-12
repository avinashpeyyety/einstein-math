#!/usr/bin/env node
/* X22 — ages 9–10 add & subtract fractions with unlike denominators (5.NF.1–2):
 * common denominators, unlike add/sub (+ a mixed number), word problems + benchmark estimates.
 * Run: node tests/math-x22-unlike-fractions.test.js   (from repo root) */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const ROOT = path.resolve(__dirname, '..');
const MATH = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/subjects/math.json'), 'utf8'));
const APP = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const tr = MATH.tracks['ages-9-10'];
const IDS = ['g5-frac-common-den', 'g5-frac-unlike-addsub', 'g5-frac-unlike-wp'];
const unit = tr.units.find(u => u.id === 'u4-fractions');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('ok  ' + name); }
  catch (e) { fail++; console.log('FAIL ' + name + '\n   ' + String(e.stack || e).split('\n').slice(0, 3).join('\n   ')); }
}
const items = L => [...L.practice, ...L.quickCheck];

// --- independent exact rational arithmetic -------------------------------------------------
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const lcm = (a, b) => (a / gcd(a, b)) * b;
const F = (n, d) => { const g = gcd(n, d) || 1; return { n: n / g, d: d / g }; };
const add = (a, b) => F(a.n * b.d + b.n * a.d, a.d * b.d);
const sub = (a, b) => F(a.n * b.d - b.n * a.d, a.d * b.d);
const eq = (a, b) => a.n * b.d === b.n * a.d;
const cmp = (a, b) => Math.sign(a.n * b.d - b.n * a.d);
/** "3/4", "1 3/4", "7" → fraction (null if not a number) */
function parse(str) {
  const s = String(str).trim();
  let m;
  if ((m = s.match(/^(\d+) (\d+)\/(\d+)$/))) return F(+m[1] * +m[3] + +m[2], +m[3]);
  if ((m = s.match(/^(\d+)\/(\d+)$/))) return F(+m[1], +m[2]);
  if ((m = s.match(/^\d+$/))) return F(+s, 1);
  return null;
}
const FR = '(\\d+(?: \\d+)?\\/\\d+)';
const MINUS = '[−-]';

/** Independent check for every prompt shape the unit uses. Returns a predicate on an answer, or null. */
function checker(prompt) {
  const p = prompt.trim();
  let m;
  if ((m = p.match(new RegExp(`^${FR} \\+ ${FR} = \\?$`)))) { const v = add(parse(m[1]), parse(m[2])); return a => eq(parse(a), v); }
  if ((m = p.match(new RegExp(`^${FR} ${MINUS} ${FR} = \\?$`)))) { const v = sub(parse(m[1]), parse(m[2])); return a => eq(parse(a), v); }
  if ((m = p.match(/^(\d+)\/(\d+) = \?\/(\d+)$/))) { const v = String(+m[1] * +m[3] / +m[2]); return a => a === v; }
  if ((m = p.match(/^Least common denominator of \d+\/(\d+) and \d+\/(\d+)\?$/))) { const v = String(lcm(+m[1], +m[2])); return a => a === v; }
  if ((m = p.match(/^Which is a common denominator for \d+\/(\d+) and \d+\/(\d+)\?$/))) { const b = +m[1], c = +m[2]; return a => +a % b === 0 && +a % c === 0; }
  if ((m = p.match(/^Rewrite (\d+)\/(\d+) and (\d+)\/(\d+) with denominator (\d+):$/))) {
    const D = +m[5]; const v = `${+m[1] * D / +m[2]}/${D} and ${+m[3] * D / +m[4]}/${D}`; return a => a === v;
  }
  if ((m = p.match(new RegExp(`^Estimate: is ${FR} \\+ ${FR} more or less than (\\d+(?:\\/\\d+)?)\\?$`)))) {
    const c = cmp(add(parse(m[1]), parse(m[2])), parse(m[3]));
    const v = c > 0 ? `more than ${m[3]}` : c < 0 ? `less than ${m[3]}` : `exactly ${m[3]}`; return a => a === v;
  }
  // stories: "ate A of … ate B … together" / "walked A mile, then B mile more" → sum; "is A m long … cut off B" / "holds A L … pour out B" → difference
  if ((m = p.match(new RegExp(`ate ${FR} of .* ate ${FR} of .*together\\?$`)))) { const v = add(parse(m[1]), parse(m[2])); return a => eq(parse(a), v); }
  if ((m = p.match(new RegExp(`walked ${FR} mile, then ${FR} mile more\\. How far in all\\?$`)))) { const v = add(parse(m[1]), parse(m[2])); return a => eq(parse(a), v); }
  if ((m = p.match(new RegExp(`is ${FR} m long\\. You cut off ${FR} m\\. How many meters are left\\?$`)))) { const v = sub(parse(m[1]), parse(m[2])); return a => eq(parse(a), v); }
  if ((m = p.match(new RegExp(`holds ${FR} L of juice\\. You pour out ${FR} L\\. How much is left\\?$`)))) { const v = sub(parse(m[1]), parse(m[2])); return a => eq(parse(a), v); }
  return null;
}

t('1. the 3 lessons sit in u4-fractions right after g4-mixed-sub; track has 33 lessons; old lessons untouched', () => {
  const i = unit.lessons.indexOf('g4-mixed-sub');
  assert.ok(i >= 0);
  assert.deepStrictEqual(unit.lessons.slice(i + 1, i + 4), IDS);
  assert.strictEqual(Object.keys(tr.lessons).length, 33);
  IDS.forEach(id => assert.strictEqual(tr.lessons[id].unitId, 'u4-fractions', id));
  ['g4-frac-equiv', 'g4-frac-compare', 'g4-frac-add-same', 'g4-mixed-intro', 'g4-frac-times-whole', 'g4-mixed-add', 'g4-frac-sub-same']
    .forEach(id => assert.ok(unit.lessons.includes(id), id));
  const all = tr.units.flatMap(u => u.lessons);
  assert.strictEqual(new Set(all).size, all.length);
  assert.deepStrictEqual([...all].sort(), Object.keys(tr.lessons).sort());
});

t('2. prerequisites chain g4-frac-sub-same → 1 → 2 → 3; all resolve', () => {
  const [a, b, c] = IDS.map(id => tr.lessons[id]);
  assert.deepStrictEqual(a.prerequisites, ['g4-frac-sub-same']);
  assert.deepStrictEqual(b.prerequisites, [a.id]);
  assert.deepStrictEqual(c.prerequisites, [b.id]);
  IDS.forEach(id => tr.lessons[id].prerequisites.forEach(p => assert.ok(tr.lessons[p], id + ' prereq ' + p)));
});

t('3. lesson shape: intro, 2 panels, worked example (3 steps), 5 practice, 3 checks, ids globally unique', () => {
  const ref = Object.keys(tr.lessons['g4-frac-add-same']).sort();
  IDS.forEach(id => {
    const L = tr.lessons[id];
    assert.deepStrictEqual(Object.keys(L).sort(), ref, id + ' same keys as existing lessons');
    assert.ok(L.einsteinIntro && L.title && L.durationMin > 0, id);
    assert.strictEqual(L.explain.panels.length, 2, id);
    assert.strictEqual(L.workedExample.steps.length, 3, id);
    assert.strictEqual(L.practice.length, 5, id);
    assert.strictEqual(L.quickCheck.length, 3, id);
  });
  const every = Object.values(MATH.tracks).flatMap(x => Object.values(x.lessons)).flatMap(items).map(q => q.id);
  IDS.forEach(id => items(tr.lessons[id]).forEach(q => assert.strictEqual(every.filter(x => x === q.id).length, 1, 'globally unique ' + q.id)));
});

t('4. answers are valid: mc answer is a choice (no dupes), fill accepts its answer', () => {
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

t('5. every answer is mathematically right; every accepted fill is equivalent; exactly one mc choice is right', () => {
  let n = 0;
  IDS.forEach(id => items(tr.lessons[id]).forEach(q => {
    const ok = checker(q.prompt);
    if (!ok) return;
    assert.ok(ok(q.answer), `${q.id}: "${q.prompt}" → ${q.answer}`);
    if (q.type === 'fill') q.accept.forEach(a => assert.ok(ok(a), `${q.id} accepts wrong "${a}"`));
    else assert.strictEqual(q.choices.filter(c => ok(c)).length, 1, `${q.id} has ${q.choices.filter(c => ok(c)).length} right choices`);
    n++;
  }));
  assert.ok(n >= 22, 'machine-checked ' + n + ' items');
  // conceptual items the solver skips — pin expected answers
  assert.strictEqual(tr.lessons['g5-frac-unlike-addsub'].practice.find(q => q.id === 'x22b-p5').answer, 'the pieces are different sizes — make them the same first');
  assert.strictEqual(tr.lessons['g5-frac-unlike-wp'].practice.find(q => q.id === 'x22c-p4').answer, 'less than 1/2 — so Sam is wrong');
});

t('6. coverage: unlike denominators throughout, the add-the-bottoms error is a distractor, a mixed number, benchmark estimates', () => {
  const L2 = items(tr.lessons['g5-frac-unlike-addsub']);
  const L3 = items(tr.lessons['g5-frac-unlike-wp']);
  const sums = L2.filter(q => /^\d+\/\d+ [+−-] \d+\/\d+ = \?$/.test(q.prompt));
  assert.ok(sums.length >= 5);
  sums.forEach(q => { const [, , b, , d] = q.prompt.match(/^(\d+)\/(\d+) [+−-] (\d+)\/(\d+)/); assert.notStrictEqual(b, d, q.id + ' must be unlike'); });
  assert.ok(L2.find(q => q.prompt === '1/2 + 1/3 = ?').choices.includes('2/5'), 'classic error as distractor');
  assert.ok(L2.some(q => /^\d+ \d+\/\d+ /.test(q.prompt)), 'mixed number item');
  assert.ok(L2.some(q => /[−-]/.test(q.prompt)) && L2.some(q => /\+/.test(q.prompt)), 'both operations');
  assert.ok(L3.filter(q => /^Estimate:/.test(q.prompt)).length >= 3, 'benchmark estimates');
});

t('7. every panel visual has a renderer in js/app.js; helpers render sane SVG', () => {
  ['function fractionBars', 'function fractionNumberLine'].forEach(h => assert.ok(APP.includes(h), h));
  IDS.forEach(id => tr.lessons[id].explain.panels.forEach(p => assert.ok(APP.includes(`'${p.visual}':`), p.visual + ' key')));
  // pull the two pure helpers out of app.js and render them
  const grab = name => { const i = APP.indexOf('  function ' + name); const j = APP.indexOf('\n  }\n', i); return APP.slice(i, j + 4); };
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(grab('fractionBars') + grab('fractionNumberLine') + '; this.fb = fractionBars; this.nl = fractionNumberLine;', ctx);
  const svg = ctx.fb({ bars: [{ d: 12, n: 9, take: 2 }], aria: 'x' });
  assert.strictEqual((svg.match(/<rect /g) || []).length, 12);
  assert.strictEqual((svg.match(/stroke-dasharray/g) || []).length, 2, 'two taken-away parts');
  assert.ok(/role="img" aria-label="x"/.test(svg));
  const line = ctx.nl({ points: [{ v: 0.4, label: '2/5' }] });
  assert.strictEqual((line.match(/<circle /g) || []).length, 1);
  assert.ok(line.includes('>1/2<'));
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
  assert.strictEqual(S.lessonStatus(tp, 'g5-frac-common-den', tr), 'locked');
  ['g4-frac-equiv', 'g4-frac-compare', 'g4-frac-add-same', 'g4-frac-sub-same']
    .forEach(id => S.markLessonDone(tp, id, { checkTotal: 3, checkCorrect: 3 }));
  assert.strictEqual(S.lessonStatus(tp, 'g5-frac-common-den', tr), 'ready');
  assert.strictEqual(S.lessonStatus(tp, 'g5-frac-unlike-addsub', tr), 'locked');
  const before = tp.stars;
  S.markLessonDone(tp, 'g5-frac-common-den', { checkTotal: 3, checkCorrect: 3 });
  assert.strictEqual(tp.stars, before + 1);
  assert.strictEqual(S.lessonStatus(tp, 'g5-frac-unlike-addsub', tr), 'ready');
  assert.strictEqual(S.lessonStatus(tp, 'g5-frac-unlike-wp', tr), 'locked');
  S.saveTrackProgress(store, u.id, 'ages-9-10', tp, 'math');
  assert.strictEqual(S.getActiveUser(S.loadStore()).progress['math:ages-9-10'].stars, before + 1);
});

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
