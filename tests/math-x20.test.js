#!/usr/bin/env node
/* X20 — ages 7–8 ×3/×4/×6–×9 facts, division as missing factor, turn-around & break-apart (4 lessons).
 * Run: node tests/math-x20.test.js   (from repo root) */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const ROOT = path.resolve(__dirname, '..');
const MATH = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/subjects/math.json'), 'utf8'));
const APP = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
const tr = MATH.tracks['ages-7-8'];
const unit = tr.units.find(u => u.id === 'unit-mult-div');
const IDS = ['md-facts-3-4', 'md-facts-6-9', 'md-div-unknown-factor', 'md-properties'];

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('ok  ' + name); }
  catch (e) { fail++; console.log('FAIL ' + name + '\n   ' + String(e.stack || e).split('\n').slice(0, 3).join('\n   ')); }
}
const items = L => [...L.practice, ...L.quickCheck];

t('1. 4 lessons exist, wired into unit-mult-div right after md-facts-2-5-10, old lessons untouched', () => {
  const i = unit.lessons.indexOf('md-facts-2-5-10');
  assert.deepStrictEqual(unit.lessons.slice(i + 1, i + 5), IDS);
  assert.strictEqual(Object.keys(tr.lessons).length, 34);
  IDS.forEach(id => { assert.ok(tr.lessons[id], id); assert.strictEqual(tr.lessons[id].unitId, 'unit-mult-div'); });
  ['md-equal-groups', 'md-arrays-div', 'md-facts-2-5-10', 'md-quotative', 'md-multiply-stories'].forEach(id => assert.ok(unit.lessons.includes(id), id));
});

t('2. lesson shape: intro, 2 panels, worked example, ≥3 practice, ≥2 checks; prereqs resolve; unique item ids', () => {
  const seen = new Set();
  Object.values(tr.lessons).forEach(L => items(L).forEach(q => seen.add(L.id + '/' + q.id)));
  IDS.forEach(id => {
    const L = tr.lessons[id];
    assert.ok(L.einsteinIntro && L.workedExample && L.workedExample.steps.length >= 3, id);
    assert.strictEqual(L.explain.panels.length, 2, id);
    assert.ok(L.practice.length >= 3 && L.quickCheck.length >= 2, id);
    L.prerequisites.forEach(p => assert.ok(tr.lessons[p], id + ' prereq ' + p));
    const ids = items(L).map(q => q.id);
    assert.strictEqual(new Set(ids).size, ids.length, id + ' duplicate item id');
  });
});

t('3. every answer is valid: mc answer is one of the choices (no dupes), fill accept includes answer', () => {
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

t('4. arithmetic is right: "a × b = ?", "a ÷ b = ?", "a × ? = c", "? × b = c" prompts check out', () => {
  let n = 0;
  IDS.forEach(id => items(tr.lessons[id]).forEach(q => {
    const p = q.prompt.replace(/\s+\(.*\)$/, '').replace(/\s/g, '');
    const a = Number(q.answer); let m;
    if ((m = p.match(/^(\d+)×(\d+)=\?$/))) { assert.strictEqual(+m[1] * +m[2], a, q.id); n++; }
    else if ((m = p.match(/^(\d+)÷(\d+)=\?$/))) { assert.strictEqual(+m[1] / +m[2], a, q.id); n++; }
    else if ((m = p.match(/^(\d+)×\?=(\d+)$/))) { assert.strictEqual(+m[1] * a, +m[2], q.id); n++; }
    else if ((m = p.match(/^\?×(\d+)=(\d+)$/))) { assert.strictEqual(a * +m[1], +m[2], q.id); n++; }
  }));
  assert.ok(n >= 15, 'checked ' + n);
});

t('5. every panel visual has a renderer in js/app.js', () => {
  IDS.forEach(id => tr.lessons[id].explain.panels.forEach(p => assert.ok(APP.includes(`'${p.visual}': \``), p.visual)));
});

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
