#!/usr/bin/env node
/* X25 — ages 7–8 fractions on a number line, simple equivalence, compare with the same numerator or
 * denominator (3.NF.2–3). Run: node tests/math-x25-number-line.test.js   (from repo root) */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const ROOT = path.resolve(__dirname, '..');
const MATH = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/subjects/math.json'), 'utf8'));
const APP = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const tr = MATH.tracks['ages-7-8'];
const IDS = ['fr-number-line', 'fr-equivalent', 'fr-compare-same'];
const unit = tr.units.find(u => u.id === 'unit-fractions');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('ok  ' + name); }
  catch (e) { fail++; console.log('FAIL ' + name + '\n   ' + String(e.stack || e).split('\n').slice(0, 3).join('\n   ')); }
}
const items = L => [...L.practice, ...L.quickCheck];

// --- independent exact rational arithmetic -------------------------------------------------
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const F = (n, d) => { const g = gcd(n, d) || 1; return { n: n / g, d: d / g }; };
const eq = (a, b) => !!a && !!b && a.n * b.d === b.n * a.d;
const cmp = (a, b) => Math.sign(a.n * b.d - b.n * a.d);
function parse(str) {
  const s = String(str).trim();
  let m;
  if ((m = s.match(/^(\d+)\/(\d+)$/))) return F(+m[1], +m[2]);
  if ((m = s.match(/^\d+$/))) return F(+s, 1);
  return null;
}
const FR = '(\\d+\\/\\d+)';

/** Independent check for every prompt shape the unit uses. Returns a predicate on an answer, or null. */
function checker(prompt) {
  const p = prompt.trim();
  let m;
  if ((m = p.match(/^A line from 0 to 1 is cut into (\d+) equal parts\. Point (\w) is (\d+) jumps? from 0\. What fraction is \2\?$/))) {
    const v = `${+m[3]}/${+m[1]}`; return a => a === v; // the line names the fraction in its own parts
  }
  if ((m = p.match(/^A line from 0 to 1 is cut into (\d+) equal parts\. How many jumps from 0 to (\d+)\/(\d+)\?$/))) {
    assert.strictEqual(m[1], m[3], 'jump question uses the line\'s own denominator');
    return a => a === String(+m[2]);
  }
  if ((m = p.match(/^To show (halves|thirds|fourths|sixths|eighths), cut the line from 0 to 1 into how many equal parts\?$/))) {
    const v = String({ halves: 2, thirds: 3, fourths: 4, sixths: 6, eighths: 8 }[m[1]]); return a => a === v;
  }
  if ((m = p.match(new RegExp(`^Which fraction sits at the same spot as ${FR}\\?$`)))) { const v = parse(m[1]); return a => a !== m[1] && eq(parse(a), v); }
  if ((m = p.match(/^(\d+)\/(\d+) = \?\/(\d+)$/))) { const v = String(+m[1] * +m[3] / +m[2]); return a => a === v; }
  if ((m = p.match(/^(\d+)\/(\d+) = \?$/))) { const v = F(+m[1], +m[2]); assert.strictEqual(v.d, 1, 'whole-number item'); return a => a === String(v.n); }
  if ((m = p.match(/^(\d+) = \?\/(\d+)$/))) { const v = String(+m[1] * +m[2]); return a => a === v; }
  if ((m = p.match(new RegExp(`^Is ${FR} equal to ${FR}\\?$`)))) { const v = eq(parse(m[1]), parse(m[2])) ? 'yes' : 'no'; return a => a === v; }
  if ((m = p.match(new RegExp(`^Pick the sign: ${FR} \\? ${FR}$`)))) { const c = cmp(parse(m[1]), parse(m[2])); const v = c > 0 ? '>' : c < 0 ? '<' : '='; return a => a === v; }
  if ((m = p.match(new RegExp(`^Which is (bigger|smaller): ${FR} or ${FR}\\?$`)))) {
    const c = cmp(parse(m[2]), parse(m[3]));
    const v = c === 0 ? 'same' : ((c > 0) === (m[1] === 'bigger') ? m[2] : m[3]); return a => a === v;
  }
  return null;
}

t('1. the 3 lessons sit in unit-fractions right after fr-unit-fractions; track has 43 lessons (X28 +3); old lessons untouched', () => {
  const i = unit.lessons.indexOf('fr-unit-fractions');
  assert.ok(i >= 0);
  assert.deepStrictEqual(unit.lessons.slice(i + 1, i + 4), IDS);
  assert.strictEqual(Object.keys(tr.lessons).length, 43);
  IDS.forEach(id => assert.strictEqual(tr.lessons[id].unitId, 'unit-fractions', id));
  ['fr-halves-fourths', 'fr-thirds-set', 'fr-set-of'].forEach(id => assert.ok(unit.lessons.includes(id), id));
  const all = tr.units.flatMap(u => u.lessons);
  assert.strictEqual(new Set(all).size, all.length);
  assert.deepStrictEqual([...all].sort(), Object.keys(tr.lessons).sort());
});

t('2. prerequisites chain fr-unit-fractions → 1 → 2 → 3; all resolve', () => {
  const [a, b, c] = IDS.map(id => tr.lessons[id]);
  assert.deepStrictEqual(a.prerequisites, ['fr-unit-fractions']);
  assert.deepStrictEqual(b.prerequisites, [a.id]);
  assert.deepStrictEqual(c.prerequisites, [b.id]);
  IDS.forEach(id => tr.lessons[id].prerequisites.forEach(p => assert.ok(tr.lessons[p], id + ' prereq ' + p)));
});

t('3. lesson shape: intro, 2 panels, worked example (3 steps), 5 practice, 3 checks, ids globally unique', () => {
  const ref = Object.keys(tr.lessons['fr-unit-fractions']).sort();
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

t('5. every answer is mathematically right; every accepted fill is right; exactly one mc choice is right', () => {
  let n = 0;
  IDS.forEach(id => items(tr.lessons[id]).forEach(q => {
    const ok = checker(q.prompt);
    if (!ok) return;
    assert.ok(ok(q.answer), `${q.id}: "${q.prompt}" → ${q.answer}`);
    if (q.type === 'fill') q.accept.forEach(a => assert.ok(ok(a), `${q.id} accepts wrong "${a}"`));
    else assert.strictEqual(q.choices.filter(c => ok(c)).length, 1, `${q.id} has ${q.choices.filter(c => ok(c)).length} right choices`);
    n++;
  }));
  assert.ok(n >= 23, 'machine-checked ' + n + ' items');
  // the one conceptual item the solver skips — pin it
  assert.strictEqual(tr.lessons['fr-compare-same'].practice.find(q => q.id === 'x25c-p5').answer, 'no — the wholes are different sizes');
});

t('6. coverage: grade 3 denominators only; number-line jumps; equivalence + whole numbers; compare by same numerator AND same denominator with all three signs', () => {
  IDS.forEach(id => items(tr.lessons[id]).forEach(q => {
    const text = [q.prompt, ...(q.choices || []), q.answer].join(' ');
    (text.match(/\d+\/(\d+)/g) || []).forEach(f => assert.ok([1, 2, 3, 4, 6, 8].includes(+f.split('/')[1]), `${q.id} denominator in ${f}`));
  }));
  const [L1, L2, L3] = IDS.map(id => items(tr.lessons[id]));
  assert.ok(L1.filter(q => /^A line from 0 to 1/.test(q.prompt)).length >= 6, 'number-line items');
  assert.ok(L1.some(q => q.answer === '3/3'), 'a point that lands on 1');
  assert.ok(L2.filter(q => /same spot|= \?\/|^Is /.test(q.prompt)).length >= 5, 'equivalence items');
  assert.ok(L2.some(q => /^\d+ = \?\/1$/.test(q.prompt)) && L2.some(q => /^(\d+)\/\1 = \?$/.test(q.prompt)), 'whole numbers as fractions');
  const signs = L3.filter(q => /^Pick the sign:/.test(q.prompt));
  assert.deepStrictEqual([...new Set(signs.map(q => q.answer))].sort(), ['<', '=', '>']);
  const pairs = L3.map(q => q.prompt.match(/(\d+)\/(\d+)\D+(\d+)\/(\d+)/)).filter(Boolean);
  assert.ok(pairs.some(m => m[2] === m[4] && m[1] !== m[3]), 'same denominator compare');
  assert.ok(pairs.some(m => m[1] === m[3] && m[2] !== m[4]), 'same numerator compare');
});

t('7. every panel visual has a renderer in js/app.js; fractionLineParts renders a sane SVG', () => {
  assert.ok(APP.includes('function fractionLineParts'));
  IDS.forEach(id => tr.lessons[id].explain.panels.forEach(p => assert.ok(APP.includes(`'${p.visual}':`), p.visual + ' key')));
  const grab = name => { const i = APP.indexOf('  function ' + name); const j = APP.indexOf('\n  }\n', i); return APP.slice(i, j + 4); };
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(grab('fractionLineParts') + '; this.lp = fractionLineParts;', ctx);
  const one = ctx.lp({ lines: [{ d: 4, points: [3] }], labelTicks: true, aria: 'x' });
  assert.strictEqual((one.match(/<line /g) || []).length, 1 + 5, 'axis + 5 ticks');
  assert.strictEqual((one.match(/<circle /g) || []).length, 1);
  ['>0<', '>1/4<', '>2/4<', '>3/4<', '>1<'].forEach(s => assert.ok(one.includes(s), s));
  assert.ok(/role="img" aria-label="x"/.test(one));
  const two = ctx.lp({ lines: [{ d: 2, points: [1] }, { d: 4, points: [2] }] });
  const cx = [...two.matchAll(/<circle cx="([\d.]+)"/g)].map(m => m[1]);
  assert.strictEqual(cx.length, 2);
  assert.strictEqual(cx[0], cx[1], '1/2 and 2/4 at the same x');
  assert.ok(!two.includes('>1/4<'), 'no tick labels unless asked');
});

t('8. storage: lesson status follows the chain; stars land under math:ages-7-8', () => {
  const ls = new Map();
  const ctx = {
    localStorage: { getItem: k => (ls.has(k) ? ls.get(k) : null), setItem: (k, v) => ls.set(k, String(v)), removeItem: k => ls.delete(k) },
    window: {}, console, Date, JSON, Math
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/storage.js'), 'utf8'), ctx);
  const S = ctx.window.Storage;
  const store = S.loadStore();
  S.createUser(store, { displayName: 'Asha', trackId: 'ages-7-8' });
  const u = S.getActiveUser(store);
  const tp = S.getTrackProgress(u, 'ages-7-8', 'math');
  assert.strictEqual(S.lessonStatus(tp, 'fr-number-line', tr), 'locked');
  ['fr-halves-fourths', 'fr-unit-fractions'].forEach(id => S.markLessonDone(tp, id, { checkTotal: 3, checkCorrect: 3 }));
  assert.strictEqual(S.lessonStatus(tp, 'fr-number-line', tr), 'ready');
  assert.strictEqual(S.lessonStatus(tp, 'fr-equivalent', tr), 'locked');
  const before = tp.stars;
  S.markLessonDone(tp, 'fr-number-line', { checkTotal: 3, checkCorrect: 3 });
  assert.strictEqual(tp.stars, before + 1);
  assert.strictEqual(S.lessonStatus(tp, 'fr-equivalent', tr), 'ready');
  assert.strictEqual(S.lessonStatus(tp, 'fr-compare-same', tr), 'locked');
  S.saveTrackProgress(store, u.id, 'ages-7-8', tp, 'math');
  assert.strictEqual(S.getActiveUser(S.loadStore()).progress['math:ages-7-8'].stars, before + 1);
});

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
