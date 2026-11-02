#!/usr/bin/env node
/* X10 cycle 1/2 — new ages 11–12 track: ratios & unit rates (6.RP.1–3b), percents & percent of a number (6.RP.3c).
 * Run: node tests/math-x10.test.js   (from repo root) */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const ROOT = path.resolve(__dirname, '..');
const MATH = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/subjects/math.json'), 'utf8'));
const APP = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const tr = MATH.tracks['ages-11-12'];
const IDS = ['g6-ratios', 'g6-unit-rates', 'g6-percents', 'g6-percent-of'];

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('ok  ' + name); }
  catch (e) { fail++; console.log('FAIL ' + name + '\n   ' + String(e.stack || e).split('\n').slice(0, 3).join('\n   ')); }
}
const items = L => [...L.practice, ...L.quickCheck];
const num = s => Number(String(s).replace(/ kg$/, '').replace(/[$%,\s]/g, ''));
const r = (a, b) => `${a}:${b}`;
const gcd = (a, b) => b ? gcd(b, a % b) : a;

/* Independent re-derivation of every item's correct answer (computed here, not copied). */
const EXPECT = {
  'x10a-p1': r(3, 5), 'x10a-p2': r(3, 3 + 5), 'x10a-p3': 3 * (8 / 2), 'x10a-p4': r(4 / gcd(4, 6), 6 / gcd(4, 6)),
  'x10a-p5': 2 * (12 / 3), 'x10a-p6': r(10 / gcd(10, 15), 15 / gcd(10, 15)),
  'x10a-q1': 5 * (8 / 2), 'x10a-q2': 18 / (4 + 5) * 4, 'x10a-q3': ['9:16', '6:8', '9:12', '15:20'].find(x => { const [a, b] = x.split(':').map(Number); return a * 4 !== b * 3; }),
  'x10b-p1': 150 / 3, 'x10b-p2': 2.5 / 5, 'x10b-p3': 60 / 4, 'x10b-p4': (4 / 8 < 3 / 5) ? '8 apples for $4' : '5 apples for $3',
  'x10b-p5': 12 * 7, 'x10b-p6': 900 / 30, 'x10b-q1': 45 / 5, 'x10b-q2': 9 / 6 * 10, 'x10b-q3': 16 / 2,
  'x10c-p1': 37, 'x10c-p2': 100 / 4, 'x10c-p3': 0.6 * 100, 'x10c-p4': 45 / 100, 'x10c-p6': 7 / 20 * 100,
  'x10c-q1': 9 / 10 * 100,
  'x10d-p1': 80 / 10, 'x10d-p2': 46 / 2, 'x10d-p3': 60 / 4, 'x10d-p4': 40 * 0.2, 'x10d-p5': 90 * 3 / 10, 'x10d-p6': 12 / 0.5,
  'x10d-q1': 40 * 3 / 4, 'x10d-q2': 50 - 50 / 10, 'x10d-q3': 5 / 0.25,
};
const val = s => { const x = String(s); if (x.endsWith('%')) return Number(x.slice(0, -1)) / 100; if (x.includes('/')) { const [a, b] = x.split('/').map(Number); return a / b; } return num(x); };

t('track exists with label, 2 units, 4 lessons in unit order, picker lists it', () => {
  assert.ok(tr, 'ages-11-12 track');
  assert.strictEqual(tr.label, 'Ages 11–12');
  assert.deepStrictEqual(tr.units.map(u => u.id), ['u6-ratios', 'u6-percents']);
  assert.deepStrictEqual(tr.units.flatMap(u => u.lessons), IDS);
  assert.strictEqual(Object.keys(tr.lessons).length, 4);
  assert.ok(APP.includes("'ages-9-10', 'ages-11-12']"), 'trackButtonsHtml order includes ages-11-12');
});
t('prerequisites resolve and come earlier', () => {
  IDS.forEach((id, i) => tr.lessons[id].prerequisites.forEach(p => assert.ok(IDS.indexOf(p) > -1 && IDS.indexOf(p) < i, id + ' ← ' + p)));
});
t('every panel visual exists in app.js', () => {
  IDS.forEach(id => tr.lessons[id].explain.panels.forEach(p => assert.ok(APP.includes(`'${p.visual}':`), p.visual)));
});
t('ids unique; mc answer appears exactly once among choices; fill answer is accepted', () => {
  const seen = new Set();
  IDS.forEach(id => items(tr.lessons[id]).forEach(q => {
    assert.ok(!seen.has(q.id), 'dup ' + q.id); seen.add(q.id);
    if (q.type === 'mc') assert.strictEqual(q.choices.filter(c => c === q.answer).length, 1, q.id);
    else assert.ok(q.accept.includes(q.answer), q.id);
  }));
});
t('every numeric/ratio answer re-derived independently', () => {
  let n = 0;
  for (const id of IDS) for (const q of items(tr.lessons[id])) {
    if (!(q.id in EXPECT)) continue;
    const e = EXPECT[q.id];
    if (typeof e === 'number') {
      const got = String(q.answer).endsWith('%') ? Number(q.answer.slice(0, -1)) : num(q.answer);
      assert.ok(Math.abs(got - e) < 1e-9, `${q.id}: ${q.answer} vs ${e}`);
      (q.accept || []).forEach(a => { const g = String(a).endsWith('%') ? Number(a.slice(0, -1)) : num(a); assert.ok(Math.abs(g - e) < 1e-9, `${q.id} accept ${a}`); });
    } else assert.strictEqual(q.answer, e, q.id);
    n++;
  }
  assert.ok(n >= 30, 'checked ' + n);
});
t('mc percent/fraction/decimal items: exactly one choice equals the intended value', () => {
  const L = tr.lessons['g6-percents'];
  const byId = Object.fromEntries(items(L).map(q => [q.id, q]));
  const p5 = byId['x10c-p5']; const max = Math.max(...p5.choices.map(val));
  assert.deepStrictEqual(p5.choices.filter(c => val(c) === max), [p5.answer]);
  const q2 = byId['x10c-q2']; assert.deepStrictEqual(q2.choices.filter(c => Math.abs(val(c) - 0.5) < 1e-9), [q2.answer]);
  const q3 = byId['x10c-q3']; assert.deepStrictEqual(q3.choices.filter(c => Math.abs(val(c) - 0.2) > 1e-9), [q3.answer]);
  const p3 = byId['x10c-p3']; assert.deepStrictEqual(p3.choices.filter(c => Math.abs(val(c) - 0.6) < 1e-9), [p3.answer]);
});
t('diagnostic: answers in choices, unit hints point at real units', () => {
  const d = tr.diagnostic; const units = new Set(tr.units.map(u => u.id));
  assert.ok(d.questions.length >= 6);
  d.questions.forEach(q => { assert.strictEqual(q.choices.filter(c => c === q.answer).length, 1, q.id); assert.ok(units.has(q.unitHint), q.id); });
});
t('no SQL content in the new track', () => {
  assert.ok(!/\bSQL\b|SELECT\s/i.test(JSON.stringify(tr)));
});
console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
