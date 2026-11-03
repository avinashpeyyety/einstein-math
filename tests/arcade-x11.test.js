#!/usr/bin/env node
/* X11 — Fact-fluency arcade (js/arcade.js): every generated fact is re-derived from its text by an
 * independent parser, ranges match each age track, answers parse − and -, streak/best bookkeeping,
 * and Storage.mergeArcade keeps the higher bests on backup import.
 * Run: node tests/arcade-x11.test.js   (from repo root) */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const ROOT = path.resolve(__dirname, '..');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('ok  ' + name); }
  catch (e) { fail++; console.log('FAIL ' + name + '\n   ' + String(e.stack || e).split('\n').slice(0, 3).join('\n   ')); }
}

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/arcade.js'), 'utf8'), sandbox);
const A = sandbox.window.Arcade;

// independent solver: parse "a op b" where operands may be −n or (−n)
function solve(text) {
  const num = (s) => Number(s.replace(/[()]/g, '').replace(/\u2212/g, '-'));
  const m = text.match(/^(\(?\u2212?\d+\)?) ([+\u2212×÷]) (\(?\u2212?\d+\)?)$/);
  assert.ok(m, 'unparseable fact: ' + text);
  const a = num(m[1]), b = num(m[3]);
  switch (m[2]) {
    case '+': return { a, b, v: a + b };
    case '\u2212': return { a, b, v: a - b };
    case '×': return { a, b, v: a * b };
    case '÷': assert.ok(b !== 0 && a % b === 0, 'non-exact division ' + text); return { a, b, v: a / b };
  }
}

const TRACKS = ['ages-5-6', 'ages-7-8', 'ages-9-10', 'ages-11-12'];

t('every track lists ops, all known, mix last', () => {
  TRACKS.forEach(tr => {
    const ops = A.opsFor(tr).map(o => o.id);
    assert.ok(ops.length >= 3, tr);
    ops.forEach(o => assert.ok(A.OPS[o], o));
    assert.strictEqual(ops[ops.length - 1], 'mix');
  });
});

t('2,000 facts per track/op re-derive to the stored answer', () => {
  let n = 0;
  TRACKS.forEach(tr => A.opsFor(tr).forEach(o => {
    A.makeSet(tr, o.id, 12345 + n, 2000).forEach(f => {
      const s = solve(f.text);
      assert.strictEqual(s.v, f.answer, `${tr} ${o.id} ${f.text}`);
      n++;
    });
  }));
  assert.ok(n > 30000);
});

t('ranges fit the age band', () => {
  A.makeSet('ages-5-6', 'mix', 1, 3000).forEach(f => {
    const s = solve(f.text);
    assert.ok(/[+\u2212]/.test(f.text) && !/[×÷]/.test(f.text), 'ages 5–6 is +/− only: ' + f.text);
    assert.ok(f.answer >= 0 && f.answer <= 10 && s.a <= 10, f.text);
  });
  A.makeSet('ages-7-8', 'mul', 2, 3000).forEach(f => { const s = solve(f.text); assert.ok(s.a <= 10 && s.b <= 10, f.text); });
  A.makeSet('ages-9-10', 'div', 3, 3000).forEach(f => { const s = solve(f.text); assert.ok(s.b >= 1 && s.b <= 12 && f.answer <= 12, f.text); });
  A.makeSet('ages-7-8', 'sub', 4, 3000).forEach(f => assert.ok(f.answer >= 0, 'no negatives below 11–12: ' + f.text));
  const ints = A.makeSet('ages-11-12', 'int', 5, 3000);
  assert.ok(ints.some(f => f.answer < 0), 'integer sprint has negative answers');
  ints.forEach(f => assert.ok(Math.abs(f.answer) <= 20, f.text));
});

t('same seed → same set; no back-to-back repeats', () => {
  const a = A.makeSet('ages-9-10', 'mix', 77, 200).map(f => f.text);
  const b = A.makeSet('ages-9-10', 'mix', 77, 200).map(f => f.text);
  assert.deepStrictEqual(a, b);
  for (let i = 1; i < a.length; i++) assert.notStrictEqual(a[i], a[i - 1]);
});

t('answer parsing: − or -, spaces ok, junk rejected', () => {
  assert.strictEqual(A.parseAnswer(' 42 '), 42);
  assert.strictEqual(A.parseAnswer('−7'), -7);
  assert.strictEqual(A.parseAnswer('-7'), -7);
  ['', '4.5', 'abc', '1/2', '--3'].forEach(x => assert.strictEqual(A.parseAnswer(x), null, x));
  assert.ok(A.isCorrect({ answer: -3 }, '−3'));
  assert.ok(!A.isCorrect({ answer: 3 }, '-3'));
});

t('sprint streaks + bests recorded on the user', () => {
  const sp = A.newSprint('ages-7-8', 'add', 9);
  for (let i = 0; i < 5; i++) A.answer(sp, String(A.current(sp).answer));
  A.answer(sp, 'nope');
  for (let i = 0; i < 2; i++) A.answer(sp, String(A.current(sp).answer));
  assert.strictEqual(sp.correct, 7); assert.strictEqual(sp.wrong, 1);
  assert.strictEqual(sp.streak, 2); assert.strictEqual(sp.bestStreak, 5);
  const u = {};
  let r = A.recordResult(u, sp, '2026-11-03T16:00:00Z');
  assert.ok(r.newBest && r.newStreak);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(u.arcade['ages-7-8:add'])), { best: 7, bestStreak: 5, plays: 1, lastAt: '2026-11-03T16:00:00Z' });
  const sp2 = A.newSprint('ages-7-8', 'add', 10);
  A.answer(sp2, String(A.current(sp2).answer));
  r = A.recordResult(u, sp2, '2026-11-03T17:00:00Z');
  assert.ok(!r.newBest && !r.newStreak);
  assert.strictEqual(u.arcade['ages-7-8:add'].best, 7);
  assert.strictEqual(u.arcade['ages-7-8:add'].plays, 2);
});

t('sprint keeps serving facts past the first batch', () => {
  const sp = A.newSprint('ages-9-10', 'mul', 3);
  for (let i = 0; i < 250; i++) A.answer(sp, String(A.current(sp).answer));
  assert.strictEqual(sp.correct, 250);
});

t('Storage.mergeArcade / mergeUser keep the higher bests across backup import', () => {
  const sb = { window: {}, localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} }, console };
  sb.globalThis = sb;
  vm.createContext(sb);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/storage.js'), 'utf8') + '\n;this.__S = (typeof Storage !== "undefined" ? Storage : window.Storage);', sb);
  const S = sb.__S;
  assert.ok(S && S.mergeArcade, 'Storage.mergeArcade exists');
  const m = S.mergeArcade(
    { 'ages-7-8:add': { best: 20, bestStreak: 9, plays: 3, lastAt: '2026-11-01T00:00:00Z' } },
    { 'ages-7-8:add': { best: 15, bestStreak: 12, plays: 5, lastAt: '2026-11-02T00:00:00Z' }, 'ages-7-8:mul': { best: 8, bestStreak: 4, plays: 1, lastAt: '2026-11-02T00:00:00Z' } });
  assert.deepStrictEqual(JSON.parse(JSON.stringify(m['ages-7-8:add'])), { best: 20, bestStreak: 12, plays: 5, lastAt: '2026-11-02T00:00:00Z' });
  assert.strictEqual(m['ages-7-8:mul'].best, 8);
  assert.strictEqual(S.mergeArcade(null, undefined), null);
  const merged = S.mergeUser(
    { id: 'u1', displayName: 'A', trackId: 'ages-7-8', progress: {}, arcade: { 'ages-7-8:add': { best: 3, bestStreak: 2, plays: 1 } } },
    { id: 'u1', displayName: 'A', trackId: 'ages-7-8', progress: {}, arcade: { 'ages-7-8:add': { best: 11, bestStreak: 1, plays: 2 } } });
  assert.strictEqual(merged.arcade['ages-7-8:add'].best, 11);
  assert.strictEqual(S.mergeUser(null, { id: 'u2', progress: {}, arcade: { 'k': { best: 4 } } }).arcade.k.best, 4);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
