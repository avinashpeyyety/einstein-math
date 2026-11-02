#!/usr/bin/env node
/* X10 cycle 2/2 — ages 11–12: negatives, opposites & absolute value (6.NS.5–7), one-step equations (6.EE.5–7).
 * Run: node tests/math-x10b.test.js   (from repo root) */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const ROOT = path.resolve(__dirname, '..');
const MATH = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/subjects/math.json'), 'utf8'));
const APP = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const tr = MATH.tracks['ages-11-12'];
const IDS = ['g6-negatives', 'g6-absolute-value', 'g6-one-step-add', 'g6-one-step-mult'];
const ALL = tr.units.flatMap(u => u.lessons);

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('ok  ' + name); }
  catch (e) { fail++; console.log('FAIL ' + name + '\n   ' + String(e.stack || e).split('\n').slice(0, 3).join('\n   ')); }
}
const items = L => [...L.practice, ...L.quickCheck];
const n = s => Number(String(s).replace(/\u2212/g, '-').replace(/[$°C\s]/g, ''));

/* One-step equation solver, independent of the authored answers. */
function solveEq(prompt) {
  const p = prompt.replace(/\u2212/g, '-');
  let m;
  if ((m = p.match(/([a-z]) \+ (\d+) = (\d+)/))) return +m[3] - +m[2];
  if ((m = p.match(/(\d+) = ([a-z]) \+ (\d+)/))) return +m[1] - +m[3];
  if ((m = p.match(/([a-z]) - (\d+) = (\d+)/))) return +m[3] + +m[2];
  if ((m = p.match(/([a-z]) ÷ (\d+) = (\d+)/))) return +m[3] * +m[2];
  if ((m = p.match(/(\d+)([a-z]) = (\d+)/))) return +m[3] / +m[1];
  return null;
}

t('2 new units with 4 lessons after the cycle 1 units; 8 lessons total', () => {
  assert.deepStrictEqual(tr.units.map(u => u.id), ['u6-ratios', 'u6-percents', 'u6-integers', 'u6-equations']);
  assert.deepStrictEqual(ALL.slice(4), IDS);
  assert.strictEqual(Object.keys(tr.lessons).length, 8);
  IDS.forEach(id => assert.strictEqual(tr.lessons[id].unitId, tr.units.find(u => u.lessons.includes(id)).id));
});
t('prerequisites resolve and come earlier in the track order', () => {
  IDS.forEach(id => tr.lessons[id].prerequisites.forEach(p => assert.ok(ALL.indexOf(p) > -1 && ALL.indexOf(p) < ALL.indexOf(id), id + ' ← ' + p)));
});
t('every panel visual exists in app.js', () => {
  IDS.forEach(id => tr.lessons[id].explain.panels.forEach(p => assert.ok(APP.includes(`'${p.visual}':`), p.visual)));
});
t('ids unique across the track; mc answer exactly once; fill answer accepted (and both minus signs for negatives)', () => {
  const seen = new Set();
  ALL.forEach(id => items(tr.lessons[id]).forEach(q => {
    assert.ok(!seen.has(q.id), 'dup ' + q.id); seen.add(q.id);
    if (q.type === 'mc') assert.strictEqual(q.choices.filter(c => c === q.answer).length, 1, q.id);
    else {
      assert.ok(q.accept.includes(q.answer), q.id);
      if (n(q.answer) < 0) assert.ok(q.accept.some(a => a.startsWith('-')) && q.accept.some(a => a.startsWith('\u2212')), q.id + ' minus forms');
    }
  }));
});
t('every one-step equation item: answer re-derived by an independent solver and checks back', () => {
  let c = 0;
  for (const id of ['g6-one-step-add', 'g6-one-step-mult']) for (const q of items(tr.lessons[id])) {
    const x = solveEq(q.prompt);
    if (x === null || q.type !== 'fill') continue;
    assert.strictEqual(n(q.answer), x, q.id + ' ' + q.prompt);
    q.accept.forEach(a => assert.strictEqual(n(a), x, q.id + ' accept ' + a));
    c++;
  }
  assert.ok(c >= 10, 'checked ' + c);
  const by = Object.fromEntries(items(tr.lessons['g6-one-step-add']).concat(items(tr.lessons['g6-one-step-mult'])).map(q => [q.id, q]));
  assert.strictEqual(by['x10g-p3'].choices.filter(c2 => +c2 + 9 === 20).length, 1);
  assert.strictEqual(by['x10g-p3'].answer, '11');
  assert.strictEqual(by['x10g-q3'].answer, 4 + 6 === 11 ? 'yes' : 'no');
  assert.strictEqual(by['x10h-q3'].answer, String(49 / 7));
  assert.strictEqual(by['x10g-p4'].answer, 'add 6');
  assert.strictEqual(by['x10h-p3'].answer, 'divide by 8');
});
t('integer items: greatest/least/farthest/opposite answers re-derived', () => {
  const by = Object.fromEntries(items(tr.lessons['g6-negatives']).concat(items(tr.lessons['g6-absolute-value'])).map(q => [q.id, q]));
  const pickBy = (q, f) => q.choices.reduce((a, b) => (f(n(b)) > f(n(a)) ? b : a));
  assert.strictEqual(by['x10e-p3'].answer, pickBy(by['x10e-p3'], v => v));
  assert.strictEqual(by['x10e-q2'].answer, pickBy(by['x10e-q2'], v => -v));
  assert.strictEqual(by['x10f-q3'].answer, pickBy(by['x10f-q3'], v => v));
  assert.strictEqual(by['x10f-p3'].answer, pickBy(by['x10f-p3'], v => Math.abs(v)));
  assert.strictEqual(n(by['x10e-p2'].answer), -7);
  assert.strictEqual(n(by['x10e-p4'].answer), -(-(-4)));
  assert.strictEqual(n(by['x10e-q1'].answer), 15);
  assert.strictEqual(n(by['x10e-p5'].answer), Math.min(3, -1, -6, 0));
  assert.strictEqual(by['x10e-p6'].answer, -4 > -9 ? 'warmer' : 'colder');
  assert.strictEqual(n(by['x10f-p1'].answer), Math.abs(-9));
  assert.strictEqual(n(by['x10f-q1'].answer), Math.abs(-25));
  assert.strictEqual(n(by['x10f-p6'].answer), Math.abs(-120));
  assert.deepStrictEqual(by['x10f-q2'].choices.filter(c => Math.abs(n(c)) === 6), [by['x10f-q2'].answer]);
  const p4 = by['x10f-p4']; const truth = s => { const m = s.replace(/\u2212/g, '-').match(/^(-?\d+) ([<>=]) (-?\d+)$/); const a = +m[1], b = +m[3]; return m[2] === '<' ? a < b : m[2] === '>' ? a > b : a === b; };
  assert.deepStrictEqual(p4.choices.filter(truth), [p4.answer]);
  assert.strictEqual(by['x10f-p5'].answer, Math.abs(-45) > Math.abs(-30) ? 'Jo' : 'Sam');
});
t('diagnostic gained hints for both new units; answers in choices', () => {
  const d = tr.diagnostic; const units = new Set(tr.units.map(u => u.id));
  assert.ok(d.questions.length >= 8);
  ['u6-integers', 'u6-equations'].forEach(u => assert.ok(d.questions.some(q => q.unitHint === u), u));
  d.questions.forEach(q => { assert.strictEqual(q.choices.filter(c => c === q.answer).length, 1, q.id); assert.ok(units.has(q.unitHint), q.id); });
  const q8 = d.questions.find(q => q.id === 'd1112-8'); assert.strictEqual(+q8.answer, 10 - 4);
});
t('no SQL content in the track', () => {
  assert.ok(!/\bSQL\b|SELECT\s/i.test(JSON.stringify(tr)));
});
console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
