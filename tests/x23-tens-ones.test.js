#!/usr/bin/env node
/* X23 — ages 5–6 Tens & Ones (1.NBT.2–5): compare with <, >, =; 10 more / 10 less; 2-digit + 1-digit.
 * Run: node tests/x23-tens-ones.test.js   (from repo root) */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const ROOT = path.resolve(__dirname, '..');
const MATH = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/subjects/math.json'), 'utf8'));
const APP = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const tr = MATH.tracks['ages-5-6'];
const IDS = ['k-compare-2digit', 'k-ten-more-less', 'k-add-2digit-1digit'];
const unit = tr.units.find(u => u.id === 'k-tens-ones');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('ok  ' + name); }
  catch (e) { fail++; console.log('FAIL ' + name + '\n   ' + String(e.stack || e).split('\n').slice(0, 3).join('\n   ')); }
}
const items = L => [...L.practice, ...L.quickCheck];
const sign = (a, b) => (a < b ? '<' : a > b ? '>' : '=');
// "3 tens and 4 ones" | "34" → number
const num = s => { const m = s.trim().match(/^(\d+) tens? and (\d+) ones?$/); return m ? 10 * +m[1] + +m[2] : (/^\d+$/.test(s.trim()) ? +s.trim() : NaN); };

/** Independent answer for every prompt shape the unit uses (null = not machine-checkable). */
function solve(prompt) {
  const p = prompt.replace(/^Stretch!\s*/, '').trim();
  let m;
  if ((m = p.match(/^(.+?) \? (.+?) — pick the sign\.$/))) return sign(num(m[1]), num(m[2]));
  if ((m = p.match(/^(\d+) tens and (\d+) ones = \?$/))) return String(10 * +m[1] + +m[2]);
  if ((m = p.match(/^How many tens are in (\d+)\?$/))) return String(Math.floor(+m[1] / 10));
  if ((m = p.match(/^How many ones are in (\d+)\?$/))) return String(+m[1] % 10);
  if ((m = p.match(/^Which is bigger: (\d+) or (\d+)\?$/))) return +m[1] === +m[2] ? 'They are equal' : String(Math.max(+m[1], +m[2]));
  if ((m = p.match(/^10 more than (\d+) = \?$/))) return String(+m[1] + 10);
  if ((m = p.match(/^10 less than (\d+) = \?$/))) return String(+m[1] - 10);
  if ((m = p.match(/^(\d+) \+ (\d+) = \?$/))) return String(+m[1] + +m[2]);
  if ((m = p.match(/^(\d+) − (\d+) = \?$/))) return String(+m[1] - +m[2]);
  return null;
}

t('1. unit k-tens-ones (after k-add-sub) holds the 3 lessons in order; other units untouched', () => {
  assert.ok(unit, 'unit exists');
  assert.deepStrictEqual(unit.lessons, IDS);
  const ids = tr.units.map(u => u.id);
  assert.strictEqual(ids.indexOf('k-tens-ones'), ids.indexOf('k-add-sub') + 1);
  assert.strictEqual(Object.keys(tr.lessons).length, 32);
  IDS.forEach(id => assert.strictEqual(tr.lessons[id].unitId, 'k-tens-ones', id));
  // every lesson is in exactly one unit
  const all = tr.units.flatMap(u => u.lessons);
  assert.strictEqual(new Set(all).size, all.length);
  assert.deepStrictEqual([...all].sort(), Object.keys(tr.lessons).sort());
});

t('2. prerequisites chain 1 → 2 → 3 and resolve; lesson 1 builds on count-by-tens + compare teens', () => {
  const [a, b, c] = IDS.map(id => tr.lessons[id]);
  assert.ok(b.prerequisites.includes(a.id), 'lesson 2 needs lesson 1');
  assert.ok(c.prerequisites.includes(b.id), 'lesson 3 needs lesson 2');
  assert.ok(!a.prerequisites.some(p => IDS.includes(p)), 'no cycle');
  assert.deepStrictEqual(a.prerequisites, ['k-count-to-100-tens', 'k-compare-teens']);
  IDS.forEach(id => tr.lessons[id].prerequisites.forEach(p => assert.ok(tr.lessons[p], id + ' prereq ' + p)));
});

t('3. lesson shape matches the schema: intro, 2 panels, worked example (3 steps), ≥5 practice, 3 checks, unique ids', () => {
  const ref = Object.keys(tr.lessons['k-teen-numbers']).sort();
  IDS.forEach(id => {
    const L = tr.lessons[id];
    assert.deepStrictEqual(Object.keys(L).sort(), ref, id + ' same keys as existing lessons');
    assert.ok(L.einsteinIntro && L.title && L.durationMin > 0, id);
    assert.strictEqual(L.explain.panels.length, 2, id);
    assert.strictEqual(L.workedExample.steps.length, 3, id);
    assert.ok(L.practice.length >= 5, id);
    assert.strictEqual(L.quickCheck.length, 3, id);
    const ids = items(L).map(q => q.id);
    assert.strictEqual(new Set(ids).size, ids.length, id + ' duplicate item id');
  });
  const every = Object.values(MATH.tracks).flatMap(x => Object.values(x.lessons)).flatMap(items).map(q => q.id);
  IDS.forEach(id => items(tr.lessons[id]).forEach(q => assert.strictEqual(every.filter(x => x === q.id).length, 1, 'globally unique ' + q.id)));
});

t('4. answers are valid: mc answer is a choice (no dupes), fill accepts its answer and is numeric', () => {
  IDS.forEach(id => items(tr.lessons[id]).forEach(q => {
    if (q.type === 'mc') {
      assert.ok(q.choices.includes(q.answer), q.id);
      assert.strictEqual(new Set(q.choices).size, q.choices.length, q.id + ' dup choices');
    } else {
      assert.strictEqual(q.type, 'fill', q.id);
      assert.ok(q.accept.includes(q.answer) && /^\d+$/.test(q.answer), q.id);
    }
  }));
});

t('5. every answer is mathematically right (independent solver), and all numbers stay within 0–99', () => {
  let n = 0;
  IDS.forEach(id => items(tr.lessons[id]).forEach(q => {
    const want = solve(q.prompt);
    if (want === null) return;
    assert.strictEqual(q.answer, want, `${q.id}: "${q.prompt}"`);
    (q.prompt.match(/\d+/g) || []).concat(/^\d+$/.test(q.answer) ? [q.answer] : []).forEach(x => assert.ok(+x <= 99, q.id + ' ' + x));
    n++;
  }));
  assert.ok(n >= 25, 'machine-checked ' + n + ' items');
  assert.strictEqual(items(tr.lessons['k-add-2digit-1digit']).find(q => q.id === 'x23c-p3').answer, 'The ones: 2 + 5');
});

t('6. coverage: place value (tens/ones), all three signs, 10 more AND 10 less, 2-digit + 1-digit (both orders)', () => {
  const L1 = items(tr.lessons['k-compare-2digit']), L2 = items(tr.lessons['k-ten-more-less']), L3 = items(tr.lessons['k-add-2digit-1digit']);
  assert.ok(L1.some(q => /tens/.test(q.prompt)) && L1.some(q => /ones are in/.test(q.prompt)), 'place value');
  ['<', '>', '='].forEach(s => assert.ok(L1.some(q => q.answer === s), 'sign ' + s));
  ['<', '>', '='].forEach(s => assert.ok(tr.lessons['k-compare-2digit'].practice.some(q => q.answer === s), 'practiced ' + s));
  L1.filter(q => q.type === 'mc' && /pick the sign/.test(q.prompt)).forEach(q => assert.deepStrictEqual(q.choices, ['<', '>', '='], q.id));
  assert.ok(L2.some(q => /10 more|\+ 10/.test(q.prompt)) && L2.some(q => /10 less|− 10/.test(q.prompt)), '±10');
  const adds = L3.map(q => q.prompt.replace(/^Stretch!\s*/, '').match(/^(\d+) \+ (\d+) = \?$/)).filter(Boolean);
  assert.ok(adds.some(m => +m[1] >= 10 && +m[2] < 10) && adds.some(m => +m[1] < 10 && +m[2] >= 10), 'both orders');
  adds.forEach(m => assert.ok((+m[1] >= 10) !== (+m[2] >= 10), '2-digit + 1-digit only: ' + m[0]));
});

t('7. regrouping policy: quick checks never regroup; exactly one "Stretch!" make-a-ten item in practice', () => {
  const L = tr.lessons['k-add-2digit-1digit'];
  const regroups = q => { const m = q.prompt.replace(/^Stretch!\s*/, '').match(/^(\d+) \+ (\d+) = \?$/); return !!m && (+m[1] % 10) + (+m[2] % 10) >= 10; };
  assert.ok(!L.quickCheck.some(regroups), 'no regrouping in checks');
  const stretch = L.practice.filter(regroups);
  assert.strictEqual(stretch.length, 1);
  assert.ok(/^Stretch!/.test(stretch[0].prompt) && stretch[0].hint, 'labelled + hinted');
  assert.ok(L.explain.panels.some(p => p.visual === 'make-new-ten'));
});

t('8. every panel visual has a renderer in js/app.js', () => {
  IDS.forEach(id => tr.lessons[id].explain.panels.forEach(p => assert.ok(APP.includes(`'${p.visual}': \``), p.visual)));
});

t('9. storage: lesson status follows the chain (locked → ready; soft-unlock after diagnostic), stars land under math:ages-5-6', () => {
  const ls = new Map();
  const ctx = { localStorage: { getItem: k => (ls.has(k) ? ls.get(k) : null), setItem: (k, v) => ls.set(k, String(v)), removeItem: k => ls.delete(k) }, window: {}, console, Date, JSON, Math };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/storage.js'), 'utf8'), ctx);
  const S = ctx.window.Storage;
  const store = S.loadStore();
  S.createUser(store, { displayName: 'Ana', trackId: 'ages-5-6' });
  const u = S.getActiveUser(store);
  const tp = S.getTrackProgress(u, 'ages-5-6', 'math');
  assert.strictEqual(S.lessonStatus(tp, 'k-compare-2digit', tr), 'locked');
  ['k-count-to-20', 'k-count-to-100-tens', 'k-compare-small', 'k-teen-numbers', 'k-compare-teens'].forEach(id => S.markLessonDone(tp, id, { checkTotal: 3, checkCorrect: 3 }));
  assert.strictEqual(S.lessonStatus(tp, 'k-compare-2digit', tr), 'ready');
  assert.strictEqual(S.lessonStatus(tp, 'k-ten-more-less', tr), 'locked');
  const before = tp.stars;
  S.markLessonDone(tp, 'k-compare-2digit', { checkTotal: 3, checkCorrect: 3 });
  assert.strictEqual(tp.stars, before + 1);
  assert.strictEqual(S.lessonStatus(tp, 'k-ten-more-less', tr), 'ready');
  assert.strictEqual(S.lessonStatus(tp, 'k-add-2digit-1digit', tr), 'locked');
  S.saveTrackProgress(store, u.id, 'ages-5-6', tp, 'math');
  assert.strictEqual(S.getActiveUser(S.loadStore()).progress['math:ages-5-6'].stars, before + 1);
  // after the warm-up diagnostic the app soft-unlocks every lesson (existing pattern for all tracks)
  tp.diagnosticDone = true;
  assert.strictEqual(S.lessonStatus(tp, 'k-add-2digit-1digit', tr), 'ready');
  tp.diagnosticDone = false;
  const path3 = S.getSuggestedPath(tp, tr, 3).map(x => x.lessonId);
  assert.ok(path3.includes('k-ten-more-less'), "Today's path offers the next X23 lesson: " + path3);
});

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
