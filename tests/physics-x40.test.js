#!/usr/bin/env node
/* X40 cycle 1/2 — ages 7–8 "Simple Machines": lever sim + 2 valid lab lessons.
 * Run: node tests/physics-x40.test.js   (from repo root) */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const ROOT = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const Engine = require('../js/sims/engine.js');
const Lever = require('../js/sims/lever.js');
require('../js/sims/ramp.js');
const Checks = require('../js/sims/checks.js');
const PHYS = JSON.parse(read('data/subjects/physics.json'));
const tr = PHYS.tracks['ages-7-8'];
const unit = tr && tr.units.find(u => u.id === 'unit-simple-machines');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('ok  ' + name); }
  catch (e) { fail++; console.log('FAIL ' + name + '\n   ' + String(e.stack || e).split('\n').slice(0, 3).join('\n   ')); }
}

t('1. lever law: needed = load·loadArm ÷ effortArm; lifts / balanced / stays down; analytic matches', () => {
  const down = Engine.simulate('lever', { load: 20, loadArm: 1, effortArm: 1, push: 10 }).metrics;
  assert.strictEqual(down.lifts, false); assert.strictEqual(down.balanced, false); assert.strictEqual(down.needed, 20);
  const bal = Engine.simulate('lever', { load: 20, loadArm: 1, effortArm: 2, push: 10 }).metrics;
  assert.strictEqual(bal.balanced, true); assert.strictEqual(bal.lifts, false);
  const up = Engine.simulate('lever', { load: 40, loadArm: 1, effortArm: 3, push: 15 }).metrics;
  assert.strictEqual(up.lifts, true); assert.ok(Math.abs(up.needed - 40 / 3) < 1e-12);
  const bal2 = Engine.simulate('lever', { load: 30, loadArm: 0.5, effortArm: 1.5, push: 10 }).metrics;
  assert.strictEqual(bal2.balanced, true, 'float-safe balance');
  assert.deepStrictEqual(Lever.analytic({ load: 20, loadArm: 1, effortArm: 2, push: 10 }), { lifts: false, balanced: true, needed: 10 });
  assert.ok(Engine.simulate('lever', { effortArm: 3 }).metrics.needed < down.needed, 'longer push arm → less push');
  const r1 = Engine.simulate('lever', { push: 30 }, { trace: true }), r2 = Engine.simulate('lever', { push: 30 }, { trace: true });
  assert.deepStrictEqual(r1.trace, r2.trace);
  assert.strictEqual(r1.state.settled, true);
  assert.ok(r1.state.angle > 0 && down.lifts === false);
});

t('2. unit after Forces & Friction; 2 sim lessons; prereq chain; validateLesson empty; X5 unit untouched', () => {
  assert.deepStrictEqual(tr.units.map(u => u.id), ['unit-forces-friction', 'unit-simple-machines']);
  assert.strictEqual(tr.units[0].lessons.length, 5);
  assert.deepStrictEqual(unit.lessons, ['ph-lever-lift', 'ph-lever-balance']);
  unit.lessons.forEach((id, i) => {
    const L = tr.lessons[id];
    assert.strictEqual(L.unitId, unit.id);
    assert.strictEqual(L.type, 'sim');
    assert.strictEqual(L.sim.kind, 'lever');
    assert.deepStrictEqual(Checks.validateLesson(L), [], id);
    assert.deepStrictEqual(L.prerequisites, i ? [unit.lessons[i - 1]] : [], id + ' prereqs');
    assert.ok(L.explain.panels.length >= 2 && L.simChecks.length >= 3);
  });
  assert.strictEqual(PHYS.meta.version, '0.5.0');
});

t('3. every goal needs a change and is reachable; predictions match the sim', () => {
  let goals = 0, predicts = 0;
  unit.lessons.forEach(id => {
    const L = tr.lessons[id];
    L.simChecks.forEach(c => {
      if (c.type === 'goal') {
        goals++;
        const start = Engine.simulate('lever', Checks.paramsFor(c, L.sim.params)).metrics;
        assert.ok(!Checks.evaluateGoal(c.goal, start), c.id + ' needs a change');
        const sol = Checks.findSolution(c, L.sim);
        assert.ok(sol, c.id + ' reachable');
        (c.lock || []).forEach(k => assert.strictEqual(sol[k], c.setup[k], c.id + ' keeps locked ' + k));
      } else {
        predicts++;
        const exp = Checks.expectedValue(c, 'lever', L.sim.params);
        assert.ok(c.choices.some(ch => ch.value === exp), `${c.id} has sim answer (${exp})`);
      }
    });
  });
  // hand-derived answers (not just "some choice matches")
  const ex = (lid, cid) => Checks.expectedValue(tr.lessons[lid].simChecks.find(c => c.id === cid), 'lever', tr.lessons[lid].sim.params);
  assert.strictEqual(ex('ph-lever-lift', 'ph-ll-c1'), false);
  assert.strictEqual(ex('ph-lever-lift', 'ph-ll-c2'), 'less');
  assert.strictEqual(ex('ph-lever-lift', 'ph-ll-c3'), 10);
  assert.strictEqual(ex('ph-lever-balance', 'ph-lb-c1'), true);
  assert.strictEqual(ex('ph-lever-balance', 'ph-lb-c2'), 'more');
  assert.strictEqual(ex('ph-lever-balance', 'ph-lb-c3'), 20);
  assert.ok(goals === 2 && predicts === 6, `${goals} goals, ${predicts} predicts`);
});

t('4. checks words; SIM_KINDS wired lazily; not precached; SW matches footer', () => {
  assert.strictEqual(Checks.describeGoal({ metric: 'lifts', op: 'eq', value: true }), 'the load lifts up');
  assert.strictEqual(Checks.describeValue('balanced', false), 'the seesaw tips');
  assert.ok(/push needed under 15 kg/.test(Checks.describeGoal({ metric: 'needed', op: 'lt', value: 15 })));
  const app = read('js/app.js'), html = read('index.html'), sw = read('sw.js');
  assert.ok(/lever:\s*\{\s*global:\s*'SimLever'/.test(app));
  assert.ok(app.includes("'js/sims/lever.js'") && !html.includes('js/sims/lever.js'));
  const m = sw.match(/einstein-math-v(\d+\.\d+\.\d+)/);
  assert.ok(m && html.includes('v' + m[1] + ' ·'), 'SW matches footer');
  const pre = sw.slice(sw.indexOf('const PRECACHE'), sw.indexOf('];', sw.indexOf('const PRECACHE')));
  assert.ok(!/sims\/lever/.test(pre), 'lever not precached');
});

console.log(`\n${pass} passed${fail ? `, ${fail} failed` : ''}`);
process.exit(fail ? 1 : 0);
