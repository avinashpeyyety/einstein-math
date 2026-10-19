#!/usr/bin/env node
/* X12 — ages 9–10 "Speed, Gravity & Circuits": speed/fall/circuit sims + 5 valid lab lessons.
 * Run: node tests/physics-x12.test.js   (from repo root) */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const ROOT = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const Engine = require('../js/sims/engine.js');
const Speed = require('../js/sims/speed.js');
const Fall = require('../js/sims/fall.js');
const Circuit = require('../js/sims/circuit.js');
require('../js/sims/ramp.js');
const Checks = require('../js/sims/checks.js');
const PHYS = JSON.parse(read('data/subjects/physics.json'));
const tr = PHYS.tracks['ages-9-10'];
const unit = tr && tr.units.find(u => u.id === 'unit-speed-gravity-circuits');
const rampUnit = tr && tr.units.find(u => u.id === 'unit-ramps-acceleration');
const close = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg}: ${a} vs ${b}`);

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('ok  ' + name); }
  catch (e) { fail++; console.log('FAIL ' + name + '\n   ' + String(e.stack || e).split('\n').slice(0, 3).join('\n   ')); }
}

t('1. speed: speed = distance ÷ time; longer distance / shorter time raises speed; analytic matches', () => {
  const m = Engine.simulate('speed', { distance: 100, time: 10 }).metrics;
  assert.strictEqual(m.speed, 10);
  assert.strictEqual(m.distance, 100);
  assert.strictEqual(m.time, 10);
  close(m.speed, Speed.analytic({ distance: 100, time: 10 }).speed, 1e-12, 'analytic');
  assert.ok(Engine.simulate('speed', { distance: 200, time: 10 }).metrics.speed > m.speed);
  assert.ok(Engine.simulate('speed', { distance: 100, time: 5 }).metrics.speed > m.speed);
  const r1 = Engine.simulate('speed', { distance: 80, time: 4 }, { trace: true });
  const r2 = Engine.simulate('speed', { distance: 80, time: 4 }, { trace: true });
  assert.deepStrictEqual(r1.trace, r2.trace);
  assert.strictEqual(r1.state.x, 80);
  assert.strictEqual(r1.state.finished, true);
});

t('2. fall: vacuum time independent of mass; matches √(2h/g); stronger g → faster; drag makes heavy faster', () => {
  const a = Engine.simulate('fall', { height: 20, mass: 1, drag: 0, g: 9.8 }).metrics;
  const b = Engine.simulate('fall', { height: 20, mass: 8, drag: 0, g: 9.8 }).metrics;
  close(a.t, b.t, 1e-9, 'mass independence');
  close(a.v, b.v, 1e-9, 'impact mass independence');
  const an = Fall.analytic({ height: 20, drag: 0, g: 9.8 });
  close(a.t, an.t, 0.05, 't ≈ √(2h/g)');
  close(a.v, an.v, 0.1, 'v ≈ √(2gh)');
  close(a.a, 9.8, 1e-9, 'a ≈ g in vacuum');
  assert.ok(Engine.simulate('fall', { height: 20, g: 20, drag: 0 }).metrics.t < a.t, 'stronger g faster');
  const light = Engine.simulate('fall', { height: 20, mass: 0.5, drag: 1.5 }).metrics.t;
  const heavy = Engine.simulate('fall', { height: 20, mass: 8, drag: 1.5 }).metrics.t;
  assert.ok(heavy < light, 'with drag, heavy lands sooner');
});

t('3. circuit: series vs parallel brightness/current; open switch dark; Ohm-level solve', () => {
  const ser = Engine.simulate('circuit', { mode: 0, voltage: 6, bulbs: 2, resistance: 3, sw: 1 }).metrics;
  const par = Engine.simulate('circuit', { mode: 1, voltage: 6, bulbs: 2, resistance: 3, sw: 1 }).metrics;
  const off = Engine.simulate('circuit', { mode: 0, voltage: 6, bulbs: 2, sw: 0 }).metrics;
  assert.strictEqual(ser.current, 1);
  assert.strictEqual(ser.brightness, 0.5);
  assert.strictEqual(ser.lit, true);
  assert.strictEqual(par.current, 4);
  assert.strictEqual(par.brightness, 1);
  assert.ok(par.brightness > ser.brightness);
  assert.ok(par.current > ser.current);
  assert.strictEqual(off.lit, false);
  assert.strictEqual(off.current, 0);
  const an = Circuit.analytic({ mode: 0, voltage: 6, bulbs: 2, resistance: 3, sw: 1 });
  assert.strictEqual(ser.current, an.current); assert.strictEqual(ser.brightness, an.brightness); assert.strictEqual(ser.lit, an.lit);
  const one = Engine.simulate('circuit', { mode: 0, voltage: 6, bulbs: 1, resistance: 3, sw: 1 }).metrics;
  assert.ok(one.brightness > ser.brightness, 'one series bulb brighter than two');
});

t('4. unit beside ramp unit; 5 sim lessons; prereq chain; validateLesson empty; ramp lesson untouched', () => {
  assert.ok(rampUnit, 'unit-ramps-acceleration kept');
  assert.ok(tr.lessons['ph-ramp-acceleration'], 'ph-ramp-acceleration kept');
  assert.strictEqual(tr.lessons['ph-ramp-acceleration'].unitId, 'unit-ramps-acceleration');
  assert.ok(unit, 'unit-speed-gravity-circuits exists');
  assert.strictEqual(unit.lessons.length, 5);
  assert.deepStrictEqual(unit.lessons, [
    'ph-speed-formula', 'ph-speed-compare', 'ph-fall-gravity', 'ph-circuit-series', 'ph-circuit-parallel'
  ]);
  unit.lessons.forEach((id, i) => {
    const L = tr.lessons[id];
    assert.ok(L, id);
    assert.strictEqual(L.unitId, unit.id);
    assert.strictEqual(L.type, 'sim');
    assert.deepStrictEqual(Checks.validateLesson(L), [], id);
    assert.deepStrictEqual(L.prerequisites, i ? [unit.lessons[i - 1]] : [], id + ' prereqs');
    assert.ok(L.explain.panels.length >= 2);
    assert.ok(L.simChecks.length >= 3);
  });
  assert.deepStrictEqual(unit.lessons.map(id => tr.lessons[id].sim.kind), [
    'speed', 'speed', 'fall', 'circuit', 'circuit'
  ]);
  assert.ok(PHYS.meta.version >= '0.4.0' || PHYS.meta.version === '0.4.0');
});

t('5. every goal needs a change and is reachable; predictions match the sim', () => {
  let goals = 0, predicts = 0;
  unit.lessons.forEach(id => {
    const L = tr.lessons[id];
    const types = new Set(L.simChecks.map(c => c.type));
    assert.ok(types.has('goal') && types.has('predict'), id + ' mixes goal + predict');
    L.simChecks.forEach(c => {
      if (c.type === 'goal') {
        goals++;
        const start = Engine.simulate(L.sim.kind, Checks.paramsFor(c, L.sim.params)).metrics;
        assert.ok(!Checks.evaluateGoal(c.goal, start), c.id + ' needs a change');
        assert.ok(Checks.findSolution(c, L.sim), c.id + ' reachable');
      } else {
        predicts++;
        const exp = Checks.expectedValue(c, L.sim.kind, L.sim.params);
        assert.ok(c.choices.some(ch => ch.value === exp), `${c.id} has sim answer (${exp})`);
      }
    });
  });
  assert.ok(goals >= 5 && predicts >= 10, `${goals} goals, ${predicts} predicts`);
});

t('6. checks words for new metrics; SIM_KINDS wired; SW footer match; sims not precached', () => {
  assert.strictEqual(Checks.describeGoal({ metric: 'lit', op: 'eq', value: false }), 'the bulbs stay dark');
  assert.ok(/current/.test(Checks.describeGoal({ metric: 'current', op: 'gt', value: 2 })));
  assert.ok(/brightness/.test(Checks.describeGoal({ metric: 'brightness', op: 'gt', value: 0.7 })));
  assert.strictEqual(Checks.describeValue('lit', true), 'the bulbs light up');
  const app = read('js/app.js'), html = read('index.html'), sw = read('sw.js');
  ['speed', 'fall', 'circuit'].forEach(kind => {
    const global = kind === 'speed' ? 'SimSpeed' : kind === 'fall' ? 'SimFall' : 'SimCircuit';
    assert.ok(new RegExp(kind + ':\\s*\\{\\s*global:\\s*\'' + global + '\'').test(app), kind + ' wired');
  });
  ['js/sims/speed.js', 'js/sims/fall.js', 'js/sims/circuit.js'].forEach(f => {
    assert.ok(app.includes(`'${f}'`), 'lazy ' + f);
    assert.ok(!html.includes(f), 'not in index ' + f);
    assert.ok(fs.existsSync(path.join(ROOT, f)));
  });
  const m = sw.match(/einstein-math-v(\d+\.\d+\.\d+)/);
  assert.ok(m && html.includes('v' + m[1] + ' ·'), 'SW matches footer');
  assert.strictEqual(m[1], '2.6.3');
  const pre = sw.slice(sw.indexOf('const PRECACHE'), sw.indexOf('];', sw.indexOf('const PRECACHE')));
  assert.ok(!/sims\/(speed|fall|circuit)/.test(pre), 'new sims not precached');
});

console.log(`\n${pass} passed${fail ? `, ${fail} failed` : ''}`);
process.exit(fail ? 1 : 0);
