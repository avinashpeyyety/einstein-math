#!/usr/bin/env node
/* X26 — ages 9–10 thousandths & rounding (5.NBT.3–4), powers of 10 (5.NBT.1–2), multiply & divide decimals
 * (5.NBT.7) — 4 lessons in u4-decimals-area. Run: node tests/math-x26.test.js   (from repo root) */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const ROOT = path.resolve(__dirname, '..');
const MATH = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/subjects/math.json'), 'utf8'));
const APP = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const tr = MATH.tracks['ages-9-10'];
const IDS = ['g5-thousandths-round', 'g5-powers-of-ten', 'g5-decimal-multiply', 'g5-decimal-divide'];

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('ok  ' + name); }
  catch (e) { fail++; console.log('FAIL ' + name + '\n   ' + String(e.stack || e).split('\n').slice(0, 3).join('\n   ')); }
}
const items = L => [...L.practice, ...L.quickCheck];

/* Exact rational arithmetic with BigInt — no floats anywhere. */
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
const Q = (n, d = 1n) => { const g = gcd(n, d) || 1n; return [n / g, d / g]; };
const parse = s => { s = s.replace(/[$,]/g, ''); const [w, f = ''] = s.split('.'); return Q(BigInt((w || '0') + f), 10n ** BigInt(f.length)); };
const mul = (a, b) => Q(a[0] * b[0], a[1] * b[1]);
const div = (a, b) => Q(a[0] * b[1], a[1] * b[0]);
const add = (a, b) => Q(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
const cmp = (a, b) => { const x = a[0] * b[1], y = b[0] * a[1]; return x > y ? 1 : x < y ? -1 : 0; };
function fmt(q) {
  let [n, d] = q, k = 0n;
  while (10n ** k % d !== 0n) { k++; assert.ok(k < 12n, 'non-terminating ' + q); }
  const v = n * (10n ** k / d);
  if (k === 0n) return String(v);
  const s = String(v).padStart(Number(k) + 1, '0');
  return (s.slice(0, -Number(k)) + '.' + s.slice(-Number(k))).replace(/0+$/, '').replace(/\.$/, '');
}
function round(q, places) { // half up, q ≥ 0
  const m = 10n ** BigInt(places);
  const [n, d] = mul(q, [m, 1n]);
  const r = (2n * n + d) / (2n * d);
  return Q(r, m);
}
const PLACES = { 'whole number': 0, tenth: 1, hundredth: 2 };
const SUP = { '²': 2, '³': 3, '⁴': 4, '⁵': 5 };
const NUM = '(\\d+(?:\\.\\d+)?)';

/** Independent answer for every machine-checkable prompt shape (null = not checkable). */
function solve(prompt) {
  const p = prompt.trim();
  let m;
  if ((m = p.match(new RegExp(`^${NUM} × ${NUM} = \\?$`)))) return fmt(mul(parse(m[1]), parse(m[2])));
  if ((m = p.match(new RegExp(`^${NUM} ÷ ${NUM} = \\?$`)))) return fmt(div(parse(m[1]), parse(m[2])));
  if ((m = p.match(/^10([²³⁴⁵]) = \?$/))) return String(10 ** SUP[m[1]]);
  if ((m = p.match(/^How many zeros are in 10([²³⁴⁵]) written out\?$/))) return String(SUP[m[1]]);
  if ((m = p.match(/^Write ([\d. +]+) as a decimal\.$/))) return fmt(m[1].split('+').map(x => parse(x.trim())).reduce(add));
  if ((m = p.match(new RegExp(`^Which is greater: ${NUM} or ${NUM}\\?$`)))) {
    const c = cmp(parse(m[1]), parse(m[2]));
    return c > 0 ? m[1] : c < 0 ? m[2] : 'they are equal';
  }
  if ((m = p.match(new RegExp(`^Round ${NUM} to the nearest (whole number|tenth|hundredth)\\.$`)))) return fmt(round(parse(m[1]), PLACES[m[2]]));
  if ((m = p.match(/^In (\d+)\.(\d+), what is the value of the (\d)\?$/))) {
    const i = m[2].indexOf(m[3]);
    assert.ok(i >= 0 && m[2].indexOf(m[3], i + 1) < 0 && !m[1].includes(m[3]), 'digit unique: ' + p);
    return m[3] + ' ' + ['tenths', 'hundredths', 'thousandths'][i];
  }
  if ((m = p.match(/^How many halves are in (\d+)\?$/))) return String(2 * +m[1]);
  if ((m = p.match(new RegExp(`^A notebook costs \\$${NUM}\\. How much do (\\d+) notebooks cost`)))) return fmt(mul(parse(m[1]), parse(m[2])));
  if ((m = p.match(new RegExp(`^Four friends share \\$${NUM} equally\\.`)))) return fmt(div(parse(m[1]), parse('4')));
  return null;
}
const same = (a, b) => /^\$?[\d.,]+$/.test(a) && /^[\d.]+$/.test(b) ? cmp(parse(a), parse(b)) === 0 : a === b;

t('1. 4 lessons sit in u4-decimals-area right after g4-decimal-sub, in order; track 42 lessons; units partition lessons', () => {
  const u = tr.units.find(x => x.id === 'u4-decimals-area');
  const i = u.lessons.indexOf('g4-decimal-sub');
  assert.deepStrictEqual(u.lessons.slice(i + 1, i + 5), IDS);
  IDS.forEach(id => assert.strictEqual(tr.lessons[id].unitId, 'u4-decimals-area', id));
  assert.strictEqual(Object.keys(tr.lessons).length, 42);
  const all = tr.units.flatMap(x => x.lessons);
  assert.strictEqual(new Set(all).size, all.length);
  assert.deepStrictEqual([...all].sort(), Object.keys(tr.lessons).sort());
});

t('2. prerequisites resolve and chain (no cycles into X26 from old lessons)', () => {
  assert.deepStrictEqual(tr.lessons['g5-thousandths-round'].prerequisites, ['g4-decimal-compare']);
  assert.deepStrictEqual(tr.lessons['g5-powers-of-ten'].prerequisites, ['g4-decimal-pv']);
  assert.deepStrictEqual(tr.lessons['g5-decimal-multiply'].prerequisites, ['g5-powers-of-ten', 'g4-multi-mult']);
  assert.deepStrictEqual(tr.lessons['g5-decimal-divide'].prerequisites, ['g5-decimal-multiply', 'g4-multi-div']);
  Object.values(tr.lessons).forEach(L => L.prerequisites.forEach(p => assert.ok(tr.lessons[p], L.id + ' prereq ' + p)));
  Object.values(tr.lessons).filter(L => !IDS.includes(L.id)).forEach(L => assert.ok(!L.prerequisites.some(p => IDS.includes(p)), 'old lesson untouched ' + L.id));
});

t('3. lesson shape matches siblings: same keys, 2 panels, 3-step worked example, 6 practice, 3 checks, globally unique item ids', () => {
  const ref = Object.keys(tr.lessons['g4-decimal-sub']).sort();
  const every = Object.values(MATH.tracks).flatMap(x => Object.values(x.lessons)).flatMap(items).map(q => q.id);
  IDS.forEach(id => {
    const L = tr.lessons[id];
    assert.deepStrictEqual(Object.keys(L).sort(), ref, id);
    assert.ok(L.einsteinIntro && L.title && L.durationMin > 0, id);
    assert.strictEqual(L.explain.panels.length, 2, id);
    assert.strictEqual(L.workedExample.steps.length, 3, id);
    assert.strictEqual(L.practice.length, 6, id);
    assert.strictEqual(L.quickCheck.length, 3, id);
    L.practice.forEach(q => assert.ok(q.hint && q.feedbackCorrect && q.feedbackWrong, q.id + ' practice has hint + feedback'));
    items(L).forEach(q => assert.strictEqual(every.filter(x => x === q.id).length, 1, 'globally unique ' + q.id));
  });
});

t('4. answers valid: mc answer among unique choices; fill accepts its answer', () => {
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

t('5. every answer is mathematically right (exact BigInt solver); every accepted fill form equals it; exactly one correct mc choice', () => {
  let n = 0;
  IDS.forEach(id => items(tr.lessons[id]).forEach(q => {
    const want = solve(q.prompt);
    if (want === null) return;
    assert.ok(same(q.answer, want), `${q.id}: "${q.prompt}" → ${q.answer}, solver ${want}`);
    if (q.type === 'fill') q.accept.forEach(a => assert.ok(same(a.replace(/^\./, '0.'), want), `${q.id} accepts ${a}`));
    else assert.strictEqual(q.choices.filter(c => same(c, want)).length, 1, q.id + ' one correct choice');
    n++;
  }));
  assert.ok(n >= 34, 'machine-checked ' + n + ' items');
});

t('6. coverage: thousandths + rounding to whole/tenth/hundredth, ×/÷ by 10/100/1000 + exponents, decimal × decimal, whole ÷ decimal', () => {
  const P = id => items(tr.lessons[id]).map(q => q.prompt);
  ['whole number', 'tenth', 'hundredth'].forEach(w => assert.ok(P('g5-thousandths-round').some(p => p.includes('nearest ' + w)), w));
  assert.ok(P('g5-thousandths-round').some(p => /\d\.\d{3}\b/.test(p)), 'thousandths');
  ['× 10 ', '× 100 ', '× 1000 ', '÷ 10 ', '÷ 100 ', '÷ 1000 '].forEach(s => assert.ok(P('g5-powers-of-ten').some(p => p.includes(s)), s));
  assert.ok(P('g5-powers-of-ten').some(p => /10[²³]/.test(p)), 'exponents');
  assert.ok(P('g5-decimal-multiply').some(p => /^\d*\.\d+ × \d*\.\d+ = \?$/.test(p)), 'decimal × decimal');
  assert.ok(P('g5-decimal-divide').some(p => /^\d+ ÷ 0\.\d+ = \?$/.test(p)), 'whole ÷ decimal');
  assert.ok(P('g5-decimal-divide').some(p => /^\d*\.\d+ ÷ \d*\.\d+ = \?$/.test(p)), 'decimal ÷ decimal');
});

t('7. every panel visual has a renderer in js/app.js; no SQL anywhere in the lessons', () => {
  IDS.forEach(id => tr.lessons[id].explain.panels.forEach(p => assert.ok(APP.includes(`'${p.visual}': \``), p.visual)));
  assert.ok(!/\bSELECT\b|\bFROM\b.*\bWHERE\b|\bSQL\b/.test(JSON.stringify(IDS.map(id => tr.lessons[id]))));
});

t('8. storage: chain unlocks (locked → ready), stars land under math:ages-9-10, Today\'s path can offer an X26 lesson', () => {
  const ls = new Map();
  const ctx = { localStorage: { getItem: k => (ls.has(k) ? ls.get(k) : null), setItem: (k, v) => ls.set(k, String(v)), removeItem: k => ls.delete(k) }, window: {}, console, Date, JSON, Math };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/storage.js'), 'utf8'), ctx);
  const S = ctx.window.Storage;
  const store = S.loadStore();
  S.createUser(store, { displayName: 'Ravi', trackId: 'ages-9-10' });
  const u = S.getActiveUser(store);
  const tp = S.getTrackProgress(u, 'ages-9-10', 'math');
  const done = id => S.markLessonDone(tp, id, { checkTotal: 3, checkCorrect: 3 });
  IDS.forEach(id => assert.strictEqual(S.lessonStatus(tp, id, tr), 'locked', id));
  const seen = new Set();
  const doneAll = id => { if (seen.has(id)) return; seen.add(id); tr.lessons[id].prerequisites.forEach(doneAll); done(id); };
  tr.lessons['g5-thousandths-round'].prerequisites.forEach(doneAll);
  assert.strictEqual(S.lessonStatus(tp, 'g5-thousandths-round', tr), 'ready');
  tr.lessons['g5-powers-of-ten'].prerequisites.forEach(doneAll);
  assert.strictEqual(S.lessonStatus(tp, 'g5-powers-of-ten', tr), 'ready');
  assert.strictEqual(S.lessonStatus(tp, 'g5-decimal-multiply', tr), 'locked');
  doneAll('g4-multi-mult');
  doneAll('g5-powers-of-ten');
  assert.strictEqual(S.lessonStatus(tp, 'g5-decimal-multiply', tr), 'ready');
  const unit = tr.units.find(x => x.id === 'u4-decimals-area').lessons;
  unit.slice(0, unit.indexOf(IDS[0])).forEach(doneAll); // the path offers the next open lesson per unit, in unit order
  const next = S.getSuggestedPath(tp, tr, 10).map(x => x.lessonId);
  assert.ok(next.some(id => IDS.includes(id)), "Today's path offers an X26 lesson: " + next);
  const before = tp.stars;
  doneAll('g5-decimal-multiply');
  assert.strictEqual(tp.stars, before + 1);
  S.saveTrackProgress(store, u.id, 'ages-9-10', tp, 'math');
  assert.strictEqual(S.getActiveUser(S.loadStore()).progress['math:ages-9-10'].stars, before + 1);
});

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
