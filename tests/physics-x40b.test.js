#!/usr/bin/env node
/* X40 cycle 2/2 — ages 7–8 "Simple Machines": pulley sim + 2 valid lab lessons (Pulley Power, The Rope Trade).
 * Run: node tests/physics-x40b.test.js   (from repo root) */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const ROOT = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const Engine = require('../js/sims/engine.js');
const Pulley = require('../js/sims/pulley.js');
require('../js/sims/lever.js');
const Checks = require('../js/sims/checks.js');
const PHYS = JSON.parse(read('data/subjects/physics.json'));
const tr = PHYS.tracks['ages-7-8'];
const unit = tr && tr.units.find(u => u.id === 'unit-simple-machines');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('ok  ' + name); }
  catch (e) { fail++; console.log('FAIL ' + name + '\n   ' + String(e.stack || e).split('\n').slice(0, 3).join('\n   ')); }
}

t('1. pulley: needed = load ÷ ropes; lifts / holds / stays down; rope = height × ropes; analytic matches', () => {
  const down = Engine.simulate('pulley', { load: 40, ropes: 1, pull: 20 }).metrics;
  assert.strictEqual(down.lifts, false); assert.strictEqual(down.holds, false); assert.strictEqual(down.needed, 40);
  assert.strictEqual(down.pulled, 0, 'nothing pulled when it stays down');
  const hold = Engine.simulate('pulley', { load: 60, ropes: 3, pull: 20 }).metrics;
  assert.strictEqual(hold.holds, true); assert.strictEqual(hold.lifts, false); assert.strictEqual(hold.needed, 20);
  const up = Engine.simulate('pulley', { load: 60, ropes: 4, pull: 20, height: 1.5 });
  assert.strictEqual(up.metrics.lifts, true); assert.strictEqual(up.metrics.needed, 15);
  assert.strictEqual(up.metrics.rope, 6); assert.strictEqual(up.metrics.pulled, 6);
  assert.ok(Math.abs(up.state.rise - 1.5) < 1e-9 && up.state.settled, 'load rises the full height');
  assert.strictEqual(Engine.simulate('pulley', { load: 40, ropes: 2, height: 1 }).metrics.rope, 2);
  assert.deepStrictEqual(Pulley.analytic({ load: 60, ropes: 3, pull: 20, height: 1 }), { lifts: false, holds: true, needed: 20, rope: 3 });
  const r1 = Engine.simulate('pulley', { ropes: 2, pull: 25 }, { trace: true }), r2 = Engine.simulate('pulley', { ropes: 2, pull: 25 }, { trace: true });
  assert.deepStrictEqual(r1.trace, r2.trace);
});

t('2. unit = 2 lever + 2 pulley lessons; prereq chain; validateLesson empty; pack 0.6.0', () => {
  assert.deepStrictEqual(unit.lessons, ['ph-lever-lift', 'ph-lever-balance', 'ph-pulley-power', 'ph-pulley-trade']);
  unit.lessons.forEach((id, i) => {
    const L = tr.lessons[id];
    assert.strictEqual(L.unitId, unit.id);
    assert.strictEqual(L.sim.kind, i < 2 ? 'lever' : 'pulley');
    assert.deepStrictEqual(Checks.validateLesson(L), [], id);
    assert.deepStrictEqual(L.prerequisites, i ? [unit.lessons[i - 1]] : [], id + ' prereqs');
    assert.ok(L.explain.panels.length >= 2 && L.simChecks.length >= 3);
  });
  assert.strictEqual(PHYS.meta.version, '0.6.0');
  assert.strictEqual(tr.units[0].lessons.length, 5, 'Forces & Friction untouched');
});

t('3. every pulley goal needs a change and is reachable; predictions hand-derived', () => {
  let goals = 0, predicts = 0;
  ['ph-pulley-power', 'ph-pulley-trade'].forEach(id => {
    const L = tr.lessons[id];
    L.simChecks.forEach(c => {
      if (c.type === 'goal') {
        goals++;
        const start = Engine.simulate('pulley', Checks.paramsFor(c, L.sim.params)).metrics;
        assert.ok(!Checks.evaluateGoal(c.goal, start), c.id + ' needs a change');
        const sol = Checks.findSolution(c, L.sim);
        assert.ok(sol, c.id + ' reachable');
        (c.lock || []).forEach(k => assert.strictEqual(sol[k], c.setup[k], c.id + ' keeps locked ' + k));
      } else predicts++;
    });
  });
  const ex = (lid, cid) => Checks.expectedValue(tr.lessons[lid].simChecks.find(c => c.id === cid), 'pulley', tr.lessons[lid].sim.params);
  assert.strictEqual(ex('ph-pulley-power', 'ph-pp-c1'), false);    // 20 < 40
  assert.strictEqual(ex('ph-pulley-power', 'ph-pp-c2'), 'less');   // 40 → 20
  assert.strictEqual(ex('ph-pulley-power', 'ph-pp-c3'), 20);       // 60 ÷ 3
  assert.strictEqual(ex('ph-pulley-trade', 'ph-pt-c1'), 2);        // 1 m × 2
  assert.strictEqual(ex('ph-pulley-trade', 'ph-pt-c2'), 'more');   // 2 m → 4 m
  assert.strictEqual(ex('ph-pulley-trade', 'ph-pt-c3'), 'less');   // 20 → 10 kg
  const g = tr.lessons['ph-pulley-power'].simChecks[3];
  assert.ok(!Checks.evaluateGoal(g.goal, Engine.simulate('pulley', { ...g.setup, ropes: 3 }).metrics), '3 ropes only holds');
  assert.ok(Checks.evaluateGoal(g.goal, Engine.simulate('pulley', { ...g.setup, ropes: 4 }).metrics), '4 ropes lifts');
  const g2 = tr.lessons['ph-pulley-trade'].simChecks[3];
  assert.ok(Checks.evaluateGoal(g2.goal, Engine.simulate('pulley', { ...g2.setup, ropes: 3, height: 2 }).metrics));
  assert.ok(Checks.evaluateGoal(g2.goal, Engine.simulate('pulley', { ...g2.setup, ropes: 4, height: 1.5 }).metrics));
  assert.ok(!Checks.evaluateGoal(g2.goal, Engine.simulate('pulley', { ...g2.setup, ropes: 2, height: 2 }).metrics), '2 ropes cannot lift 40 kg with 15 kg');
  assert.ok(goals === 2 && predicts === 6, `${goals} goals, ${predicts} predicts`);
});

t('4. checks words; SIM_KINDS wired lazily; not precached; SW matches footer', () => {
  assert.strictEqual(Checks.describeValue('holds', true), 'the load hangs still');
  assert.ok(/rope pulled about 6 m/.test(Checks.describeGoal({ metric: 'pulled', op: 'approx', value: 6, tol: 0.01 })));
  const app = read('js/app.js'), html = read('index.html'), sw = read('sw.js');
  assert.ok(/pulley:\s*\{\s*global:\s*'SimPulley'/.test(app));
  assert.ok(app.includes("'js/sims/pulley.js'") && !html.includes('js/sims/pulley.js'));
  const m = sw.match(/einstein-math-v(\d+\.\d+\.\d+)/);
  assert.ok(m && html.includes('v' + m[1] + ' ·'), 'SW matches footer');
  const pre = sw.slice(sw.indexOf('const PRECACHE'), sw.indexOf('];', sw.indexOf('const PRECACHE')));
  assert.ok(!/sims\/pulley/.test(pre), 'pulley not precached');
});

console.log(`\n${pass} passed${fail ? `, ${fail} failed` : ''}`);
process.exit(fail ? 1 : 0);
