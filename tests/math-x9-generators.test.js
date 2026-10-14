#!/usr/bin/env node
/* X9 cycle 1 — procedural practice generators (js/generators.js): 10 skills, seeded, difficulty dial 1–3.
 * Every generated answer is re-derived by an independent solver from the prompt text; mc items have
 * exactly one right choice; fills accept only equivalent forms; same seed → same set.
 * Run: node tests/math-x9-generators.test.js   (from repo root) */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const ROOT = path.resolve(__dirname, '..');
const SRC = fs.readFileSync(path.join(ROOT, 'js/generators.js'), 'utf8');
const MATH = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/subjects/math.json'), 'utf8'));

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('ok  ' + name); }
  catch (e) { fail++; console.log('FAIL ' + name + '\n   ' + String(e.stack || e).split('\n').slice(0, 3).join('\n   ')); }
}

// Load the browser way (window global, no module) to prove it is DOM-free.
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(SRC, sandbox);
const G = sandbox.window.Generators;

// --- independent exact rational solver (parses the prompt, not gen.terms) ----------------------
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const val = (s) => {
  s = String(s).trim();
  let m = s.match(/^(\d+) (\d+)\/(\d+)$/); if (m) return [(+m[1]) * (+m[3]) + (+m[2]), +m[3]];
  m = s.match(/^(\d+)\/(\d+)$/); if (m) return [+m[1], +m[2]];
  m = s.match(/^\d+$/); if (m) return [+s, 1];
  return null;
};
const eq = (x, y) => x && y && x[0] * y[1] === y[0] * x[1];
function solve(q) {
  const p = q.prompt;
  let m;
  if ((m = p.match(/^(\d+)\/(\d+) ([+−]) (\d+)\/(\d+) = \?$/))) {
    const [a, b, op, c, d] = [+m[1], +m[2], m[3], +m[4], +m[5]];
    const n = op === '+' ? a * d + c * b : a * d - c * b; const den = b * d; const g = gcd(n, den);
    return { frac: [n / g, den / g] };
  }
  if ((m = p.match(/^(\d+) ([+−×÷]) (\d+) = \?$/))) {
    const [a, op, b] = [+m[1], m[2], +m[3]];
    const v = op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : a / b;
    return { num: v };
  }
  if ((m = p.match(/^\? × (\d+) = (\d+)$/))) return { num: +m[2] / +m[1] };
  if ((m = p.match(/(\d+) __ (\d+)$/))) { const a = +m[1], b = +m[2]; return { sign: a > b ? '>' : a < b ? '<' : '=' }; }
  if ((m = p.match(/has (\d+) rows of (\d+) unit squares/))) return { num: +m[1] * +m[2] };
  if ((m = p.match(/a (\d+) × (\d+) rectangle and a (\d+) × (\d+) rectangle/))) return { num: +m[1] * +m[2] + +m[3] * +m[4] };
  throw new Error('unparsed prompt: ' + p);
}
function isRight(q, s, ansStr) {
  if (s.sign) return ansStr === s.sign;
  if (s.frac) return eq(val(ansStr), s.frac);
  return Number.isInteger(s.num) && String(s.num) === String(ansStr).trim();
}

const SEEDS = [1, 2, 3, 7, 42, 99, 1234, 2026, 31337, 4000000000];
const all = [];
for (const s of G.SKILLS) for (const level of [1, 2, 3]) for (const seed of SEEDS) {
  for (const q of G.generate(s.id, { seed, level, count: 8 })) all.push({ skill: s, level, seed, q });
}

t('10 skills, mapped to real math.json lessons on the declared track', () => {
  assert.strictEqual(G.SKILLS.length, 10);
  for (const s of G.SKILLS) {
    const tr = MATH.tracks[s.track]; assert.ok(tr, s.track);
    for (const l of s.lessonIds) assert.ok(tr.lessons[l], s.id + ' → missing lesson ' + l);
    assert.strictEqual(G.skillForLesson(s.lessonIds[0]), s.id);
  }
  for (const tk of Object.keys(MATH.tracks)) assert.ok(G.skillsForTrack(tk).length >= 2, tk);
});

t('X20–X22 skills are covered', () => {
  for (const l of ['md-facts-3-4', 'md-facts-6-9', 'md-div-unknown-factor',
    'ar-unit-squares', 'ar-rows-columns', 'ar-area-vs-perimeter', 'g5-frac-common-den', 'g5-frac-unlike-addsub', 'g5-frac-unlike-wp'])
    assert.ok(G.skillForLesson(l), l);
});

t('deterministic: same seed + level → identical set; different seeds differ', () => {
  for (const s of G.SKILLS) for (const level of [1, 2, 3]) {
    const a = JSON.stringify(G.generate(s.id, { seed: 77, level, count: 6 }));
    const b = JSON.stringify(G.generate(s.id, { seed: 77, level, count: 6 }));
    assert.strictEqual(a, b, s.id);
    const c = JSON.stringify(G.generate(s.id, { seed: 78, level, count: 6 }).map(q => q.prompt));
    assert.notStrictEqual(JSON.stringify(JSON.parse(a).map(q => q.prompt)), c, s.id + ' seeds 77/78 gave the same prompts');
  }
});

t('item shape matches the lesson player (mc | fill, ids unique, hint + feedback)', () => {
  const ids = new Set();
  for (const { q } of all) {
    assert.ok(q.type === 'mc' || q.type === 'fill', q.type);
    assert.ok(q.prompt && q.hint && q.feedbackCorrect && q.feedbackWrong && typeof q.answer === 'string');
    assert.ok(!ids.has(q.id), 'dup id ' + q.id); ids.add(q.id);
    if (q.type === 'mc') {
      assert.ok(Array.isArray(q.choices) && q.choices.length >= 3, q.prompt);
      assert.strictEqual(new Set(q.choices).size, q.choices.length, 'dup choice ' + q.prompt);
      assert.ok(q.choices.includes(q.answer), 'answer not in choices ' + q.prompt);
    } else {
      assert.ok(Array.isArray(q.accept) && q.accept.includes(q.answer), q.prompt);
    }
  }
});

t('every answer re-derived by the independent solver (' + all.length + ' items)', () => {
  for (const { q } of all) assert.ok(isRight(q, solve(q), q.answer), q.prompt + ' => ' + q.answer);
});

t('mc: exactly one right choice; fill: every accepted form is right', () => {
  for (const { q } of all) {
    const s = solve(q);
    if (q.type === 'mc') {
      const right = q.choices.filter(c => isRight(q, s, c));
      assert.strictEqual(right.length, 1, q.prompt + ' [' + q.choices + ']');
    } else for (const a of q.accept) assert.ok(isRight(q, s, a), q.prompt + ' accepts ' + a);
  }
});

t('no negatives or non-whole answers in whole-number skills', () => {
  for (const { q } of all) {
    const s = solve(q);
    if ('num' in s) assert.ok(Number.isInteger(s.num) && s.num >= 0, q.prompt);
    if (q.type === 'mc' && !s.sign && !s.frac) for (const c of q.choices) assert.ok(/^\d+$/.test(c), q.prompt + ' choice ' + c);
  }
});

t('difficulty dial changes the problems', () => {
  const big = (id, level) => G.generate(id, { seed: 5, level, count: 20 }).map(q => (solve(q).num || 0));
  const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
  assert.ok(avg(big('multi-digit-mult', 3)) > avg(big('multi-digit-mult', 1)));
  assert.ok(avg(big('add-within-20', 3)) > avg(big('add-within-20', 1)));
  // level 3 add-within-20 always crosses ten; level 1 stays within 10
  for (const q of G.generate('add-within-20', { seed: 9, level: 3, count: 20 })) assert.ok(solve(q).num > 10, q.prompt);
  for (const q of G.generate('add-within-20', { seed: 9, level: 1, count: 20 })) assert.ok(solve(q).num <= 10, q.prompt);
  // facts levels use the right factor families
  for (const q of G.generate('mult-facts', { seed: 3, level: 3, count: 20 })) assert.ok(q.gen.terms.some(n => n >= 6 && n <= 9), q.prompt);
  // fractions: levels 1–2 sums stay below 1
  for (const lvl of [1, 2]) for (const q of G.generate('frac-unlike-addsub', { seed: 11, level: lvl, count: 20 })) {
    const f = solve(q).frac; assert.ok(f[0] > 0 && f[0] < f[1], q.prompt);
  }
});

t('bad input is safe: unknown skill → [], level clamps, count caps at 50', () => {
  assert.deepStrictEqual(Array.from(G.generate('nope', { seed: 1 })), []);
  assert.strictEqual(G.generate('mult-facts', { seed: 1, level: 9, count: 3 })[0].gen.level, 3);
  assert.strictEqual(G.generate('mult-facts', { seed: 1, level: -2, count: 3 })[0].gen.level, 1);
  assert.strictEqual(G.generate('mult-facts', { seed: 1, count: 500 }).length, 50);
});

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
