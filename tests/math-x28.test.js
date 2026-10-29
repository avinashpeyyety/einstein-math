#!/usr/bin/env node
/* X28 — ages 7–8 add & subtract within 1000 (2.NBT.7), skip-count by 5/10/100 + expanded form (2.NBT.2–3),
 * even or odd (2.OA.3) — 3 lessons. Run: node tests/math-x28.test.js   (from repo root) */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const ROOT = path.resolve(__dirname, '..');
const MATH = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/subjects/math.json'), 'utf8'));
const APP = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const tr = MATH.tracks['ages-7-8'];
const IDS = ['as-add-sub-1000', 'ns-skip-count-expanded', 'md-even-odd'];
const PLACE = { 'as-add-sub-1000': ['unit-add-sub', 'as-add-fluency'], 'ns-skip-count-expanded': ['unit-number-sense', 'ns-round-hundreds'], 'md-even-odd': ['unit-mult-div', null] };

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('ok  ' + name); }
  catch (e) { fail++; console.log('FAIL ' + name + '\n   ' + String(e.stack || e).split('\n').slice(0, 3).join('\n   ')); }
}
const items = L => [...L.practice, ...L.quickCheck];
const expanded = n => { const h = Math.floor(n / 100) * 100, te = Math.floor(n / 10) % 10 * 10, o = n % 10; return [h, te, o].filter(x => x).join(' + '); };

/** Independent answer for every machine-checkable prompt shape (null = not checkable). */
function solve(prompt) {
  const p = prompt.trim();
  let m;
  if ((m = p.match(/^(\d+) \+ (\d+) = \?$/))) return String(+m[1] + +m[2]);
  if ((m = p.match(/^(\d+) − (\d+) = \?$/))) return String(+m[1] - +m[2]);
  if ((m = p.match(/^Skip-count by (\d+): ([\d, ]+), \? — what comes next\?$/))) {
    const step = +m[1], seq = m[2].split(',').map(Number);
    seq.slice(1).forEach((x, i) => assert.strictEqual(x - seq[i], step, 'sequence hops by ' + step + ': ' + p));
    return String(seq[seq.length - 1] + step);
  }
  if ((m = p.match(/^Which shows (\d+) in expanded form\?$/))) return expanded(+m[1]);
  if ((m = p.match(/^Write ([\d +]+) as a number\.$/))) return String(m[1].split('+').reduce((a, x) => a + +x, 0));
  if ((m = p.match(/^Is (\d+) even or odd\?$/))) return +m[1] % 2 ? 'odd' : 'even';
  if ((m = p.match(/^Write (\d+) as a double: \d+ = (\d+) \+ \?$/))) return String(+m[1] - +m[2]);
  if ((m = p.match(/^(\d+) = \? \+ \? \(a double\)\./))) return String(+m[1] / 2);
  if ((m = p.match(/^The library has (\d+) books\. It gets (\d+) more\./))) return String(+m[1] + +m[2]);
  if ((m = p.match(/^A rocket must fly (\d+) km\. It has flown (\d+) km\./))) return String(+m[1] - +m[2]);
  return null;
}

t('1. lessons sit in their units (after as-add-fluency / ns-round-hundreds / first in mult-div); track 43 lessons; units partition lessons', () => {
  IDS.forEach(id => {
    const [uid, after] = PLACE[id];
    const u = tr.units.find(x => x.id === uid);
    assert.strictEqual(tr.lessons[id].unitId, uid, id);
    assert.strictEqual(u.lessons.indexOf(id), after ? u.lessons.indexOf(after) + 1 : 0, id + ' position');
  });
  assert.strictEqual(Object.keys(tr.lessons).length, 43);
  const all = tr.units.flatMap(u => u.lessons);
  assert.strictEqual(new Set(all).size, all.length);
  assert.deepStrictEqual([...all].sort(), Object.keys(tr.lessons).sort());
});

t('2. prerequisites resolve and build on existing lessons (no cycles into X28)', () => {
  assert.deepStrictEqual(tr.lessons['as-add-sub-1000'].prerequisites, ['as-add-fluency', 'as-sub-regroup']);
  assert.deepStrictEqual(tr.lessons['ns-skip-count-expanded'].prerequisites, ['ns-place-value-basics']);
  assert.deepStrictEqual(tr.lessons['md-even-odd'].prerequisites, ['as-add-within-100']);
  Object.values(tr.lessons).forEach(L => L.prerequisites.forEach(p => assert.ok(tr.lessons[p], L.id + ' prereq ' + p)));
  Object.values(tr.lessons).filter(L => !IDS.includes(L.id)).forEach(L => assert.ok(!L.prerequisites.some(p => IDS.includes(p)), 'old lesson untouched ' + L.id));
});

t('3. lesson shape matches siblings: same keys, 2 panels, 3-step worked example, ≥5 practice, 3 checks, globally unique item ids', () => {
  const ref = Object.keys(tr.lessons['fr-number-line']).sort();
  const every = Object.values(MATH.tracks).flatMap(x => Object.values(x.lessons)).flatMap(items).map(q => q.id);
  IDS.forEach(id => {
    const L = tr.lessons[id];
    assert.deepStrictEqual(Object.keys(L).sort(), ref, id);
    assert.ok(L.einsteinIntro && L.title && L.durationMin > 0, id);
    assert.strictEqual(L.explain.panels.length, 2, id);
    assert.strictEqual(L.workedExample.steps.length, 3, id);
    assert.ok(L.practice.length >= 5, id);
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

t('5. every answer is mathematically right (independent solver); numbers stay within 0–1000; even/odd within 20', () => {
  let n = 0;
  IDS.forEach(id => items(tr.lessons[id]).forEach(q => {
    const want = solve(q.prompt);
    if (want === null) return;
    assert.strictEqual(q.answer, want, `${q.id}: "${q.prompt}"`);
    (q.prompt.match(/\d+/g) || []).forEach(x => assert.ok(+x <= 1000, q.id + ' ' + x));
    if (/^\d+$/.test(q.answer)) assert.ok(+q.answer <= 1000, q.id);
    n++;
  }));
  assert.ok(n >= 22, 'machine-checked ' + n + ' items');
  items(tr.lessons['md-even-odd']).forEach(q => (q.prompt.match(/\d+/g) || []).forEach(x => assert.ok(+x <= 20, q.id + ' 2.OA.3 up to 20')));
});

t('6. coverage: 3-digit add AND subtract with regrouping, skip-count by 5/10/100, expanded form both ways, even AND odd + doubles', () => {
  const A = items(tr.lessons['as-add-sub-1000']).map(q => q.prompt);
  const adds = A.map(p => p.match(/^(\d+) \+ (\d+) = \?$/)).filter(Boolean);
  const subs = A.map(p => p.match(/^(\d+) − (\d+) = \?$/)).filter(Boolean);
  assert.ok(adds.some(m => +m[1] >= 100 && +m[2] >= 100 && (+m[1] % 10) + (+m[2] % 10) >= 10), '3-digit add with regrouping');
  assert.ok(subs.some(m => +m[1] >= 100 && (+m[1] % 10) < (+m[2] % 10)), '3-digit subtract with regrouping');
  const B = items(tr.lessons['ns-skip-count-expanded']).map(q => q.prompt);
  [5, 10, 100].forEach(s => assert.ok(B.some(p => p.startsWith(`Skip-count by ${s}:`)), 'skip by ' + s));
  assert.ok(B.some(p => /expanded form\?$/.test(p)) && B.some(p => /^Write [\d +]+ as a number\.$/.test(p)), 'expanded both ways');
  const C = items(tr.lessons['md-even-odd']);
  ['even', 'odd'].forEach(a => assert.ok(C.some(q => q.answer === a), a));
  assert.ok(C.some(q => /double/.test(q.prompt)), 'doubles (2.OA.3 equal addends)');
});

t('7. every panel visual has a renderer in js/app.js; no SQL anywhere in the lessons', () => {
  IDS.forEach(id => tr.lessons[id].explain.panels.forEach(p => assert.ok(APP.includes(`'${p.visual}': \``), p.visual)));
  assert.ok(!/\bSELECT\b|\bFROM\b.*\bWHERE\b|\bSQL\b/.test(JSON.stringify(IDS.map(id => tr.lessons[id]))));
});

t('8. storage: chain unlocks (locked → ready), stars land under math:ages-7-8, Today\'s path can offer an X28 lesson', () => {
  const ls = new Map();
  const ctx = { localStorage: { getItem: k => (ls.has(k) ? ls.get(k) : null), setItem: (k, v) => ls.set(k, String(v)), removeItem: k => ls.delete(k) }, window: {}, console, Date, JSON, Math };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/storage.js'), 'utf8'), ctx);
  const S = ctx.window.Storage;
  const store = S.loadStore();
  S.createUser(store, { displayName: 'Ravi', trackId: 'ages-7-8' });
  const u = S.getActiveUser(store);
  const tp = S.getTrackProgress(u, 'ages-7-8', 'math');
  IDS.forEach(id => assert.strictEqual(S.lessonStatus(tp, id, tr), 'locked', id));
  S.markLessonDone(tp, 'ns-place-value-basics', { checkTotal: 3, checkCorrect: 3 });
  assert.strictEqual(S.lessonStatus(tp, 'ns-skip-count-expanded', tr), 'ready');
  S.markLessonDone(tp, 'as-add-within-100', { checkTotal: 3, checkCorrect: 3 });
  assert.strictEqual(S.lessonStatus(tp, 'md-even-odd', tr), 'ready');
  assert.strictEqual(S.lessonStatus(tp, 'as-add-sub-1000', tr), 'locked');
  ['as-sub-within-100', 'as-add-regroup', 'as-sub-regroup', 'as-add-fluency'].forEach(id => S.markLessonDone(tp, id, { checkTotal: 3, checkCorrect: 3 }));
  assert.strictEqual(S.lessonStatus(tp, 'as-add-sub-1000', tr), 'ready');
  const before = tp.stars;
  S.markLessonDone(tp, 'as-add-sub-1000', { checkTotal: 3, checkCorrect: 3 });
  assert.strictEqual(tp.stars, before + 1);
  S.saveTrackProgress(store, u.id, 'ages-7-8', tp, 'math');
  assert.strictEqual(S.getActiveUser(S.loadStore()).progress['math:ages-7-8'].stars, before + 1);
  const next = S.getSuggestedPath(tp, tr, 10).map(x => x.lessonId);
  assert.ok(next.some(id => IDS.includes(id)), "Today's path offers an X28 lesson: " + next);
});

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
