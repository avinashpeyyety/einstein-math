#!/usr/bin/env node
/* X5 — ages 7–8 "Forces & Friction" unit: 4 lab lessons + a unit check, all valid sim lessons.
 * Run: node tests/physics-x5.test.js   (from repo root) */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const ROOT = path.resolve(__dirname, '..');
const Engine = require('../js/sims/engine.js');
require('../js/sims/ramp.js');
const Checks = require('../js/sims/checks.js');
const PHYS = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/subjects/physics.json'), 'utf8'));
const tr = PHYS.tracks['ages-7-8'];
const unit = tr.units.find(u => u.id === 'unit-forces-friction');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('ok  ' + name); }
  catch (e) { fail++; console.log('FAIL ' + name + '\n   ' + String(e.stack || e).split('\n').slice(0, 3).join('\n   ')); }
}

t('1. unit has 4 lessons + a unit check, every id resolves to a sim lesson in this unit', () => {
  assert.ok(unit, 'unit-forces-friction exists');
  assert.strictEqual(unit.lessons.length, 5);
  assert.strictEqual(unit.lessons[unit.lessons.length - 1], 'ph-ff-unit-check', 'check comes last');
  unit.lessons.forEach(id => {
    const L = tr.lessons[id];
    assert.ok(L, id + ' exists');
    assert.strictEqual(L.unitId, unit.id);
    assert.strictEqual(L.type, 'sim');
    assert.deepStrictEqual(Checks.validateLesson(L), [], id);
  });
});

t('2. prerequisites chain through the unit in order', () => {
  unit.lessons.forEach((id, i) => {
    assert.deepStrictEqual(tr.lessons[id].prerequisites, i ? [unit.lessons[i - 1]] : [], id);
  });
});

t('3. every goal needs a change and is reachable; predictions are computed by the sim', () => {
  unit.lessons.forEach(id => {
    const L = tr.lessons[id];
    L.simChecks.forEach(c => {
      if (c.type === 'goal') {
        const start = Engine.simulate(L.sim.kind, Checks.paramsFor(c, L.sim.params)).metrics;
        assert.ok(!Checks.evaluateGoal(c.goal, start), c.id + ' needs a change');
        assert.ok(Checks.findSolution(c, L.sim), c.id + ' reachable');
      } else {
        const exp = Checks.expectedValue(c, L.sim.kind, L.sim.params);
        assert.ok(c.choices.some(ch => ch.value === exp), c.id + ' has the sim answer');
      }
    });
  });
});

t('4. lesson ideas hold in the sim: mass ties, steeper is faster, grip can hold a 35° block', () => {
  const ty = (p) => Engine.simulate('ramp', p).metrics.t;
  assert.strictEqual(ty({ angleDeg: 35, mass: 1 }), ty({ angleDeg: 35, mass: 8 }));
  assert.ok(ty({ angleDeg: 45, muS: 0.4, muK: 0.2 }) < ty({ angleDeg: 30, muS: 0.4, muK: 0.2 }));
  assert.strictEqual(Engine.simulate('ramp', { angleDeg: 35, muS: 0.75, muK: 0.3 }).metrics.slides, false);
  assert.strictEqual(Engine.simulate('ramp', { angleDeg: 35, muS: 0.5, muK: 0.3 }).metrics.slides, true);
});

console.log(`\n${pass} passed${fail ? `, ${fail} failed` : ''}`);
process.exit(fail ? 1 : 0);
