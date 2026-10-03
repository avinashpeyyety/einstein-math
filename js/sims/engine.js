/* X4 — Einstein physics sim engine (dependency-free).
 * Fixed timestep, deterministic, pure state updates: a model is
 *   { id, defaults, init(params) → state, step(state, params, dt) → newState, done(state, params) → bool }
 * and never mutates its inputs, so the same params always give the same run (node-testable).
 * Rendering is separate: views call Engine.advance(runner, elapsed) from requestAnimationFrame and it
 * steps the model in fixed dt slices (accumulator), capped so a slow frame can't spiral.
 * Loaded lazily (only when a physics `sim` lesson opens) — math users never download it. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SimEngine = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const DT = 1 / 120;           // seconds per step (fixed)
  const MAX_STEPS_PER_ADVANCE = 240;
  const models = {};

  function register(model) {
    if (!model || !model.id || typeof model.step !== 'function' || typeof model.init !== 'function') {
      throw new Error('SimEngine.register: model needs id, init and step');
    }
    models[model.id] = model;
    return model;
  }

  function getModel(kind) {
    const m = models[kind];
    if (!m) throw new Error('Unknown sim kind: ' + kind);
    return m;
  }

  /** Lesson params merged over model defaults, numbers only, clamped to the model's limits. */
  function resolveParams(model, params) {
    const out = {};
    const lim = model.limits || {};
    Object.keys(model.defaults).forEach((k) => {
      let v = params && params[k] !== undefined ? Number(params[k]) : model.defaults[k];
      if (!Number.isFinite(v)) v = model.defaults[k];
      if (lim[k]) v = Math.min(lim[k][1], Math.max(lim[k][0], v));
      out[k] = v;
    });
    return out;
  }

  function createRunner(model, params, opts) {
    const p = resolveParams(model, params);
    const dt = (opts && opts.dt) || DT;
    return { model, params: p, dt, state: model.init(p), steps: 0, acc: 0 };
  }

  /** One fixed step (pure model call, runner bookkeeping only). */
  function step(runner) {
    if (runner.model.done(runner.state, runner.params)) return runner.state;
    runner.state = runner.model.step(runner.state, runner.params, runner.dt);
    runner.steps++;
    return runner.state;
  }

  /** Real-time driver: consume `elapsed` seconds in fixed dt slices. Returns steps taken. */
  function advance(runner, elapsed) {
    runner.acc += Math.max(0, Math.min(elapsed, 0.25));
    let n = 0;
    while (runner.acc >= runner.dt && n < MAX_STEPS_PER_ADVANCE && !runner.model.done(runner.state, runner.params)) {
      step(runner);
      runner.acc -= runner.dt;
      n++;
    }
    return n;
  }

  /** Headless run to completion (or tMax). Same steps as the animated run → identical result. */
  function simulate(kind, params, opts) {
    const model = typeof kind === 'string' ? getModel(kind) : kind;
    const runner = createRunner(model, params, opts);
    const tMax = (opts && opts.tMax) || 30;
    const maxSteps = Math.ceil(tMax / runner.dt);
    const trace = opts && opts.trace ? [runner.state] : null;
    while (!model.done(runner.state, runner.params) && runner.steps < maxSteps) {
      step(runner);
      if (trace) trace.push(runner.state);
    }
    return { params: runner.params, state: runner.state, steps: runner.steps, trace, metrics: model.metrics ? model.metrics(runner.state, runner.params) : null };
  }

  return { DT, register, getModel, resolveParams, createRunner, step, advance, simulate, models };
});
