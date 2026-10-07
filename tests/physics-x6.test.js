#!/usr/bin/env node
/* X6 — ages 5–6 "Push, Pull, Sink & Float" unit: push & float sim models + 3 valid lab lessons.
 * Run: node tests/physics-x6.test.js   (from repo root) */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const ROOT = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const Engine = require('../js/sims/engine.js');
const Push = require('../js/sims/push.js');
const Float = require('../js/sims/float.js');
require('../js/sims/ramp.js');
const Checks = require('../js/sims/checks.js');
const PHYS = JSON.parse(read('data/subjects/physics.json'));
const MATH = JSON.parse(read('data/subjects/math.json'));
const tr = PHYS.tracks['ages-5-6'];
const unit = tr && tr.units.find(u => u.id === 'unit-push-pull-float');
const dist = p => Engine.simulate('push', p).metrics.distance;
const close = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg}: ${a} vs ${b}`);

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; console.log('ok  ' + name); }
  catch (e) { fail++; console.log('FAIL ' + name + '\n   ' + String(e.stack || e).split('\n').slice(0, 3).join('\n   ')); }
}

t('1. push: distance grows with force (monotonic), matches ½a₁T² + (a₁T)²/(2μg), too-gentle pushes never start', () => {
  for (const mass of [1, 2, 3, 4, 5]) {
    let prev = -1, moved = 0;
    for (let force = 0; force <= 30; force++) {
      const m = Engine.simulate('push', { force, mass }).metrics;
      const an = Push.analytic({ force, mass });
      assert.ok(m.distance >= prev, `monotonic m=${mass} F=${force}`);
      if (prev > 0 && !m.bonk) assert.ok(m.distance > prev, `strictly farther below the wall m=${mass} F=${force}`);
      close(m.distance, an.distance, 1e-9, `analytic m=${mass} F=${force}`);
      assert.strictEqual(m.moved, an.moves, `starts only past the grip m=${mass} F=${force}`);
      assert.strictEqual(m.moved, force > 0.25 * mass * 9.8);
      if (m.moved) moved++;
      prev = m.distance;
    }
    assert.ok(moved > 5, 'many moving cases for m=' + mass);
  }
  const s = Engine.simulate('push', { force: 3, mass: 2 }).metrics;
  assert.strictEqual(s.moved, false); assert.strictEqual(s.distance, 0); assert.strictEqual(s.way, 'still');
  assert.ok(dist({ force: 20 }) > dist({ force: 8 }), 'big push beats gentle push');
});

t('2. push: heavier box goes less far for the same push; pull mirrors push (toward Einstein); the mat end caps it', () => {
  for (const force of [10, 15, 20, 25, 30]) {
    let prev = Infinity;
    for (const mass of [1, 2, 3, 4, 5]) {
      const d = dist({ force, mass });
      assert.ok(d <= prev, `heavier never farther F=${force} m=${mass}`);
      if (prev < 5) assert.ok(d < prev || d === 0, `strictly less below the wall F=${force} m=${mass}`);
      prev = d;
    }
  }
  const push = Engine.simulate('push', { force: 12, dir: 1 }).metrics, pull = Engine.simulate('push', { force: 12, dir: -1 }).metrics;
  assert.strictEqual(push.way, 'away'); assert.strictEqual(pull.way, 'closer');
  assert.strictEqual(pull.x, -push.x); assert.strictEqual(pull.distance, push.distance);
  const bonk = Engine.simulate('push', { force: 30, mass: 1 }).metrics;
  assert.strictEqual(bonk.bonk, true); assert.strictEqual(bonk.distance, 5);
});

t('3. push: deterministic, pure and frame-rate independent (ragged frames = headless run)', () => {
  const p = { force: 17, mass: 2, dir: -1 };
  const r1 = Engine.simulate('push', p, { trace: true }), r2 = Engine.simulate('push', p, { trace: true });
  assert.deepStrictEqual(r1.trace, r2.trace);
  const fp = Object.freeze(Engine.resolveParams(Push.model, p)), s0 = Object.freeze(Push.model.init(fp));
  const s1 = Push.model.step(s0, fp, Engine.DT);
  assert.strictEqual(s0.x, 0); assert.ok(s1.x < 0, 'pull moves toward Einstein');
  let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const runner = Engine.createRunner(Push.model, p);
  let guard = 0;
  while (!Push.model.done(runner.state, runner.params) && guard++ < 10000) Engine.advance(runner, 0.004 + rnd() * 0.05);
  assert.deepStrictEqual(runner.state, r1.state);
});

t('4. float: floats exactly when less dense than water, settles with ρ/ρw under water; sinkers rest on the floor', () => {
  Float.OBJECTS.forEach((o, i) => {
    const m = Engine.simulate('float', { object: i }).metrics;
    assert.strictEqual(m.floats, o.rho < 1000, o.id);
    assert.strictEqual(m.sinks, o.rho >= 1000, o.id);
    assert.ok(m.t !== null && m.t < 5, `${o.id} settles quickly (${m.t})`);
    if (m.floats) close(m.under, o.rho / 1000, 0.01, o.id + ' part under water');
    else assert.strictEqual(m.under, 1);
    assert.strictEqual(m.floats, Float.analytic({ object: i }).floats);
  });
  const by = id => Engine.simulate('float', { object: Float.OBJECTS.findIndex(o => o.id === id) }).metrics;
  ['wood', 'apple', 'duck', 'log'].forEach(id => assert.strictEqual(by(id).floats, true, id + ' floats'));
  ['rock', 'coin', 'key'].forEach(id => assert.strictEqual(by(id).floats, false, id + ' sinks'));
  // size is not the rule: the biggest object floats, the smallest sinks
  const big = Float.OBJECTS.reduce((a, b) => (b.h > a.h ? b : a)), small = Float.OBJECTS.reduce((a, b) => (b.h < a.h ? b : a));
  assert.ok(big.rho < 1000 && small.rho > 1000);
  // salty enough water floats an apple higher; denser water than rock makes rock float (density, not the object)
  assert.ok(Engine.simulate('float', { object: 2, rhoWater: 1200 }).metrics.under < by('apple').under);
  assert.strictEqual(Engine.simulate('float', { object: 1, rhoWater: 2000 }).metrics.floats, false, 'rock 2600 still sinks in 2000');
  const r1 = Engine.simulate('float', { object: 4 }, { trace: true }), r2 = Engine.simulate('float', { object: 4 }, { trace: true });
  assert.deepStrictEqual(r1.trace, r2.trace);
  assert.ok(Math.min(...r1.trace.map(s => s.y)) > 0, 'a floater never touches the floor');
});

t('5. track ages-5-6 matches the math 5–6 track naming; unit has 3 sim lessons, all valid, prerequisites chained', () => {
  assert.ok(tr && MATH.tracks['ages-5-6'], 'same track id as math');
  assert.strictEqual(tr.id, 'ages-5-6');
  assert.strictEqual(tr.label, MATH.tracks['ages-5-6'].label);
  assert.strictEqual(tr.ageRange, MATH.tracks['ages-5-6'].ageRange);
  assert.strictEqual(tr.gradeBand, MATH.tracks['ages-5-6'].gradeBand);
  assert.ok(unit, 'unit-push-pull-float exists');
  assert.strictEqual(unit.lessons.length, 3);
  assert.deepStrictEqual(Object.keys(tr.lessons).sort(), [...unit.lessons].sort());
  unit.lessons.forEach((id, i) => {
    const L = tr.lessons[id];
    assert.strictEqual(L.unitId, unit.id); assert.strictEqual(L.type, 'sim');
    assert.deepStrictEqual(Checks.validateLesson(L), [], id);
    assert.deepStrictEqual(L.prerequisites, i ? [unit.lessons[i - 1]] : [], id + ' prereqs');
    assert.ok(L.explain.panels.length >= 2 && L.explain.panels.every(p => p.speech && ['idle', 'explain', 'cheer', 'think'].includes(p.state)), id + ' panels reuse Einstein states');
    assert.ok(['push', 'float'].includes(L.sim.kind));
  });
  assert.deepStrictEqual(unit.lessons.map(id => tr.lessons[id].sim.kind), ['push', 'push', 'float']);
});

t('6. every goal needs a change from its start and is reachable (locks respected); every prediction is computed by the sim', () => {
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
        const sol = Checks.findSolution(c, L.sim);
        assert.ok(sol, c.id + ' reachable');
        (c.lock || []).forEach(k => assert.strictEqual(sol[k], Checks.paramsFor(c, L.sim.params)[k], `${c.id} keeps ${k} locked`));
        assert.ok(c.goal.label && Checks.describeGoal(c.goal) === c.goal.label, c.id + ' has kid words');
      } else {
        predicts++;
        const exp = Checks.expectedValue(c, L.sim.kind, L.sim.params);
        assert.ok(c.choices.some(ch => ch.value === exp), `${c.id} has the sim answer (${exp})`);
        // the answer flips when the sim says so: graded against the sim, not a stored key
        assert.strictEqual(Checks.grade(c, { kind: L.sim.kind, params: L.sim.params, choice: exp }).ok, true);
      }
    });
  });
  assert.ok(goals >= 5 && predicts >= 6, `${goals} goals, ${predicts} predictions`);
  // spot-check the lesson ideas through the checks themselves
  const L1 = tr.lessons['ph-push-or-pull'], L2 = tr.lessons['ph-big-small-push'], L3 = tr.lessons['ph-sink-or-float'];
  assert.strictEqual(Checks.expectedValue(L1.simChecks.find(c => c.id === 'ph-pp-c3'), 'push', L1.sim.params), 'more', 'big push goes farther');
  assert.strictEqual(Checks.expectedValue(L2.simChecks.find(c => c.id === 'ph-bs-c2'), 'push', L2.sim.params), 'less', 'heavy box goes less far');
  assert.strictEqual(Checks.expectedValue(L3.simChecks.find(c => c.id === 'ph-sf-c1'), 'float', L3.sim.params), false, 'rock sinks');
  assert.strictEqual(Checks.expectedValue(L3.simChecks.find(c => c.id === 'ph-sf-c4'), 'float', L3.sim.params), true, 'big log floats');
});

t('7. checks words for the new metrics; validation still catches broken push/float lessons', () => {
  assert.strictEqual(Checks.describeGoal({ metric: 'floats', op: 'eq', value: false }), 'it sinks');
  assert.strictEqual(Checks.describeGoal({ metric: 'way', op: 'eq', value: 'closer' }), 'it comes toward Einstein');
  assert.ok(/distance between 1 and 2 m/.test(Checks.describeGoal({ metric: 'distance', op: 'between', value: [1, 2] })));
  assert.strictEqual(Checks.describeValue('floats', true), 'it floats');
  assert.strictEqual(Checks.describeValue('way', 'away'), 'it slides away from Einstein');
  assert.strictEqual(Checks.describeValue('distance', 0.6505), '0.65 m');
  assert.strictEqual(Checks.describeValue('slides', false), 'no slide');
  const base = tr.lessons['ph-big-small-push'];
  const v = mut => Checks.validateLesson(Object.assign(JSON.parse(JSON.stringify(base)), mut));
  assert.ok(v({ simChecks: [{ id: 'x', type: 'goal', prompt: 'p', setup: { mass: 5 }, lock: ['mass'], goal: { metric: 'distance', op: 'gt', value: 4 } }] }).some(e => /cannot be reached/.test(e)));
  assert.ok(v({ simChecks: [{ id: 'x', type: 'predict', prompt: 'p', setup: { force: 3 }, metric: 'moved', choices: [{ label: 'a', value: true }, { label: 'b', value: 'maybe' }] }] }).some(e => /no choice matches/.test(e)));
  assert.ok(v({ sim: { ...base.sim, params: { ...base.sim.params, wobble: 1 } } }).some(e => /unknown param wobble/.test(e)));
  const fl = tr.lessons['ph-sink-or-float'];
  assert.ok(Checks.validateLesson({ ...fl, sim: { ...fl.sim, params: { ...fl.sim.params, object: 1 }, controls: [] } }).some(e => /at least one slider/.test(e)));
});

t('8. lazy + wired: app maps push/float kinds to their modules, not precached, SW version matches footer, no coming-soon for 5–6', () => {
  const html = read('index.html'), sw = read('sw.js'), app = read('js/app.js');
  ['js/sims/kit.js', 'js/sims/push.js', 'js/sims/float.js'].forEach(f => {
    assert.ok(app.includes(`'${f}'`), 'app lazy-loads ' + f);
    assert.ok(!html.includes(f), 'not in index.html: ' + f);
    assert.ok(fs.existsSync(path.join(ROOT, f)));
  });
  assert.ok(/push:\s*\{\s*global:\s*'SimPush'/.test(app) && /float:\s*\{\s*global:\s*'SimFloat'/.test(app), 'kind → module map');
  const pre = sw.slice(sw.indexOf('const PRECACHE'), sw.indexOf('];', sw.indexOf('const PRECACHE')));
  assert.ok(!/sims/.test(pre), 'sims not precached');
  const m = sw.match(/einstein-math-v(\d+\.\d+\.\d+)/);
  assert.ok(m && html.includes('v' + m[1] + ' ·'), 'SW cache version matches footer');
  assert.ok(!/Coming soon: push &amp; pull/.test(app), 'stale coming-soon copy gone');
  ['ages-5-6', 'ages-7-8', 'ages-9-10'].forEach(id => assert.ok(PHYS.tracks[id], 'physics track live: ' + id));
});

console.log(`\n${pass} passed${fail ? `, ${fail} failed` : ''}`);
process.exit(fail ? 1 : 0);
