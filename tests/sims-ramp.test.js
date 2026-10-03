#!/usr/bin/env node
/* X4 physics sim tests — plain Node, no deps.
 * Run: node tests/sims-ramp.test.js   (from repo root)
 * Ramp physics vs the analytic formula, static vs kinetic threshold, determinism / fixed timestep,
 * check evaluation, physics lesson-JSON validation, and lazy loading (no sim code in the math path). */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const Engine = require('../js/sims/engine.js');
const Ramp = require('../js/sims/ramp.js');
const Checks = require('../js/sims/checks.js');
const PHYS = JSON.parse(read('data/subjects/physics.json'));
const simLessons = Object.values(PHYS.tracks).flatMap(tr => Object.values(tr.lessons).filter(L => L.type === 'sim'));
const RAD = Math.PI / 180;
const close = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg}: ${a} vs ${b}`);

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('ok  ' + name); }
  catch (e) { fail++; console.log('FAIL ' + name + '\n   ' + String(e.stack || e).split('\n').slice(0, 3).join('\n   ')); }
}

t('1. sliding matches the analytic answer: a = g(sinθ − μk cosθ), t = √(2L/a), v = √(2aL)', () => {
  let n = 0;
  for (const angleDeg of [20, 30, 35, 45, 60, 75]) for (const muS of [0.1, 0.3, 0.5]) for (const muK of [0, 0.1, 0.25]) for (const g of [1.6, 9.8, 24.8]) for (const length of [0.5, 2, 5]) {
    const p = { angleDeg, muS, muK: Math.min(muK, muS), g, length, mass: 3 };
    const an = Ramp.analytic(p);
    const m = Engine.simulate('ramp', p).metrics;
    assert.strictEqual(m.slides, an.slides, `slides ${JSON.stringify(p)}`);
    if (!an.slides) continue;
    n++;
    close(m.a, g * (Math.sin(angleDeg * RAD) - p.muK * Math.cos(angleDeg * RAD)), 1e-12, 'a');
    close(m.t, Math.sqrt(2 * length / m.a), 1e-9, 't');
    close(m.v, Math.sqrt(2 * m.a * length), 1e-9, 'v');
    close(m.distance, length, 1e-12, 'distance');
  }
  assert.ok(n > 300, 'many sliding cases checked: ' + n);
});

t('2. static vs kinetic threshold: starts only when tanθ > μs; μk alone never starts it; μk is capped at μs', () => {
  const muS = 0.5, th = Math.atan(muS) / RAD;           // 26.565…°
  const below = Engine.simulate('ramp', { angleDeg: th - 0.01, muS, muK: 0.1 }).metrics;
  const above = Engine.simulate('ramp', { angleDeg: th + 0.01, muS, muK: 0.1 }).metrics;
  assert.strictEqual(below.slides, false); assert.strictEqual(below.stuck, true); assert.strictEqual(below.distance, 0);
  assert.strictEqual(above.slides, true); assert.ok(above.t > 0);
  close(Ramp.analytic({ muS }).thresholdAngleDeg, th, 1e-12, 'threshold angle');
  // between: kinetic friction would let it slide (tanθ > μk) but static friction holds it
  const held = Engine.simulate('ramp', { angleDeg: 20, muS: 0.5, muK: 0.2 }).metrics;
  assert.ok(Math.tan(20 * RAD) > 0.2 && Math.tan(20 * RAD) < 0.5);
  assert.strictEqual(held.slides, false, 'static friction holds');
  // μk > μs is treated as μk = μs
  const capped = Engine.simulate('ramp', { angleDeg: 40, muS: 0.3, muK: 0.9 }).metrics;
  close(capped.a, 9.8 * (Math.sin(40 * RAD) - 0.3 * Math.cos(40 * RAD)), 1e-12, 'μk capped');
  // flat ramp never moves; frictionless ramp a = g sinθ
  assert.strictEqual(Engine.simulate('ramp', { angleDeg: 0, muS: 0, muK: 0 }).metrics.slides, false);
  close(Engine.simulate('ramp', { angleDeg: 30, muS: 0, muK: 0 }).metrics.a, 9.8 * 0.5, 1e-12, 'frictionless');
});

t('3. mass cancels: same time for 0.5 kg and 50 kg; forces scale with mass', () => {
  const a = Engine.simulate('ramp', { angleDeg: 35, mass: 0.5 }).metrics, b = Engine.simulate('ramp', { angleDeg: 35, mass: 50 }).metrics;
  assert.strictEqual(a.t, b.t);
  const f1 = Ramp.model.forces(Engine.resolveParams(Ramp.model, { mass: 1 })), f5 = Ramp.model.forces(Engine.resolveParams(Ramp.model, { mass: 5 }));
  close(f5.downSlope, 5 * f1.downSlope, 1e-12, 'downSlope'); close(f5.staticMax, 5 * f1.staticMax, 1e-12, 'staticMax');
});

t('4. deterministic + pure: identical runs, frozen inputs untouched, frame-rate independent (fixed dt)', () => {
  const p = { angleDeg: 33, muS: 0.4, muK: 0.2, g: 9.8, length: 3, mass: 2 };
  const r1 = Engine.simulate('ramp', p, { trace: true }), r2 = Engine.simulate('ramp', p, { trace: true });
  assert.deepStrictEqual(r1.trace, r2.trace);
  assert.deepStrictEqual(r1.metrics, r2.metrics);
  const fp = Object.freeze(Engine.resolveParams(Ramp.model, p));
  const s0 = Object.freeze(Ramp.model.init(fp));
  const s1 = Ramp.model.step(s0, fp, Engine.DT);
  assert.notStrictEqual(s1, s0); assert.strictEqual(s0.x, 0); assert.ok(s1.x > 0);
  // animated driver with ragged frame times lands on the exact same final state as the headless run
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const runner = Engine.createRunner(Ramp.model, p);
  let guard = 0;
  while (!Ramp.model.done(runner.state, runner.params) && guard++ < 10000) Engine.advance(runner, 0.004 + rnd() * 0.05);
  assert.deepStrictEqual(runner.state, r1.state);
  assert.strictEqual(runner.steps, r1.steps);
});

t('5. params: defaults fill gaps, junk and out-of-range values are clamped', () => {
  const p = Engine.resolveParams(Ramp.model, { angleDeg: 500, mass: 'x', muS: -1 });
  assert.strictEqual(p.angleDeg, 80); assert.strictEqual(p.mass, Ramp.model.defaults.mass); assert.strictEqual(p.muS, 0);
  assert.throws(() => Engine.simulate('pendulum', {}), /Unknown sim kind/);
});

t('6. check evaluation: goal ops, goal grading from run metrics, predict answers computed by the sim', () => {
  const m = { slides: true, a: 3.1, t: 1.1, v: 2, distance: 2 };
  assert.ok(Checks.evaluateGoal({ metric: 'slides', op: 'eq', value: true }, m));
  assert.ok(!Checks.evaluateGoal({ metric: 'slides', op: 'eq', value: false }, m));
  assert.ok(Checks.evaluateGoal({ metric: 't', op: 'lt', value: 1.2 }, m));
  assert.ok(!Checks.evaluateGoal({ metric: 't', op: 'lt', value: 1.2 }, { ...m, t: null }), 'stuck never meets a time goal');
  assert.ok(Checks.evaluateGoal({ metric: 'a', op: 'approx', value: 3, tol: 0.3 }, m));
  assert.ok(!Checks.evaluateGoal({ metric: 'a', op: 'approx', value: 3, tol: 0.05 }, m));
  assert.ok(Checks.evaluateGoal({ metric: 'v', op: 'between', value: [1, 3] }, m));
  const goal = { id: 'g', type: 'goal', goal: { metric: 't', op: 'lt', value: 1.2 } };
  const fast = Engine.simulate('ramp', { angleDeg: 45, muS: 0.3, muK: 0.2 }).metrics;
  const slow = Engine.simulate('ramp', { angleDeg: 28, muS: 0.5, muK: 0.3 }).metrics;
  assert.strictEqual(Checks.grade(goal, { kind: 'ramp', metrics: fast }).ok, true);
  assert.strictEqual(Checks.grade(goal, { kind: 'ramp', metrics: slow }).ok, false);
  assert.strictEqual(Checks.grade(goal, { kind: 'ramp', metrics: null }).ok, false, 'no run, no pass');
  const slideQ = { type: 'predict', setup: { angleDeg: 10, muS: 0.5 }, metric: 'slides', choices: [{ value: true }, { value: false }] };
  assert.strictEqual(Checks.expectedValue(slideQ, 'ramp', {}), false);
  assert.strictEqual(Checks.grade(slideQ, { kind: 'ramp', params: {}, choice: false }).ok, true);
  assert.strictEqual(Checks.grade(slideQ, { kind: 'ramp', params: {}, choice: true }).ok, false);
  const massQ = { type: 'predict', setup: { angleDeg: 35, mass: 1 }, compare: { alt: { mass: 5 }, metric: 't' }, choices: [] };
  assert.strictEqual(Checks.expectedValue(massQ, 'ramp', {}), 'same');
  const steeper = { type: 'predict', setup: { angleDeg: 35 }, compare: { alt: { angleDeg: 50 }, metric: 't' } };
  assert.strictEqual(Checks.expectedValue(steeper, 'ramp', {}), 'less');
  const aQ = { type: 'predict', setup: { angleDeg: 40, muS: 0.3, muK: 0.2, g: 9.8 }, metric: 'a', choices: [2.1, 4.8, 6.3, 9.8].map(value => ({ value })) };
  assert.strictEqual(Checks.expectedValue(aQ, 'ramp', {}), 4.8);
  assert.ok(/under 1.2 s/.test(Checks.describeGoal(goal.goal)));
});

t('7. physics.json sim lessons are valid; goals need slider changes and are reachable; predictions match a choice', () => {
  assert.ok(simLessons.length >= 1);
  for (const L of simLessons) {
    assert.deepStrictEqual(Checks.validateLesson(L), [], L.id);
    for (const c of L.simChecks) {
      if (c.type !== 'goal') continue;
      const start = Engine.simulate(L.sim.kind, Checks.paramsFor(c, L.sim.params)).metrics;
      assert.ok(!Checks.evaluateGoal(c.goal, start), `${c.id}: kid must change something`);
      const sol = Checks.findSolution(c, L.sim);
      assert.ok(sol, c.id + ' reachable');
      (c.lock || []).forEach(k => assert.strictEqual(sol[k], Checks.paramsFor(c, L.sim.params)[k], `${c.id} keeps ${k} locked`));
    }
    const types = new Set(L.simChecks.map(c => c.type));
    assert.ok(types.has('goal') && types.has('predict'), L.id + ' mixes goal + predict checks');
  }
});

t('8. validation catches broken sim lessons', () => {
  const base = JSON.parse(JSON.stringify(simLessons[0]));
  const v = mut => Checks.validateLesson(Object.assign(JSON.parse(JSON.stringify(base)), mut));
  assert.ok(v({ sim: { ...base.sim, kind: 'pendulum' } }).some(e => /Unknown sim kind/.test(e)));
  assert.ok(v({ sim: { ...base.sim, params: { ...base.sim.params, muK: 0.9, muS: 0.4 } } }).some(e => /muK/.test(e)));
  assert.ok(v({ simChecks: [] }).some(e => /simChecks/.test(e)));
  assert.ok(v({ simChecks: [{ id: 'x', type: 'goal', prompt: 'p', lock: ['angleDeg', 'muS', 'mass'], goal: { metric: 't', op: 'lt', value: 0.01 } }] }).some(e => /cannot be reached/.test(e)));
  assert.ok(v({ simChecks: [{ id: 'x', type: 'predict', prompt: 'p', setup: { angleDeg: 10 }, metric: 'slides', choices: [{ label: 'a', value: true }, { label: 'b', value: 'maybe' }] }] }).some(e => /no choice matches/.test(e)));
  assert.ok(v({ simChecks: [{ id: 'x', type: 'quiz', prompt: 'p' }] }).some(e => /type must be/.test(e)));
  assert.ok(v({ prerequisites: undefined }).some(e => /prerequisites/.test(e)));
});

t('9. lazy: sim code is not in index.html or the SW precache; app loads it on demand; SW caches it on first use', () => {
  const html = read('index.html'), sw = read('sw.js'), app = read('js/app.js');
  assert.ok(!/js\/sims\//.test(html), 'index.html has no sim scripts');
  const pre = sw.slice(sw.indexOf('const PRECACHE'), sw.indexOf('];', sw.indexOf('const PRECACHE')));
  assert.ok(!/sims/.test(pre), 'not precached');
  assert.ok(/url\.pathname\.includes\('\/js\/sims\/'\)/.test(sw), 'SW sims route');
  ['js/sims/engine.js', 'js/sims/ramp.js', 'js/sims/checks.js'].forEach(f => {
    assert.ok(app.includes(`'${f}'`), 'app lazy-loads ' + f);
    assert.ok(fs.existsSync(path.join(ROOT, f)));
  });
  assert.ok(/einstein-math-v2\.4\.8/.test(sw) && /v2\.4\.8/.test(html), 'SW + footer v2.4.8');
});

console.log(`\n${pass} passed${fail ? `, ${fail} failed` : ''}`);
process.exit(fail ? 1 : 0);
