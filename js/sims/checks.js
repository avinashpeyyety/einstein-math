/* X4 — sim checks: questions answered by adjusting the sliders and running the sim.
 * Check types (in a `sim` lesson's `simChecks`):
 *   goal    — "make it happen": the kid sets the unlocked sliders, presses Run, then Check. Correct when the
 *             last run's metric meets goal { metric, op, value, tol }. `setup` presets params, `lock` freezes them.
 *   predict — "what will happen?": params are set from `setup` (all sliders locked) and the kid picks a choice;
 *             the right choice is computed by running the sim (never hard-coded), then the run is shown.
 *             With `compare: { alt, metric }` the choice is how the `alt` run differs: 'less' | 'same' | 'more'.
 *             Numeric choices: the closest value to the metric wins.
 * Pure functions (node-testable); `validateLesson` is used by the tests and by the app before mounting. */
(function (root, factory) {
  const Engine = root.SimEngine || (typeof require === 'function' ? require('./engine.js') : null);
  const api = factory(Engine);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SimChecks = api;
})(typeof self !== 'undefined' ? self : this, function (Engine) {
  'use strict';
  const OPS = ['eq', 'lt', 'lte', 'gt', 'gte', 'approx', 'between'];
  const SAME_EPS = 1e-6;

  function evaluateGoal(goal, metrics) {
    if (!goal || !metrics) return false;
    const v = metrics[goal.metric];
    switch (goal.op) {
      case 'eq': return typeof goal.value === 'boolean' ? !!v === goal.value : v === goal.value;
      case 'lt': return v !== null && v < goal.value;
      case 'lte': return v !== null && v <= goal.value;
      case 'gt': return v !== null && v > goal.value;
      case 'gte': return v !== null && v >= goal.value;
      case 'approx': return v !== null && Math.abs(v - goal.value) <= (goal.tol ?? 0.1);
      case 'between': return v !== null && v >= goal.value[0] && v <= goal.value[1];
      default: return false;
    }
  }

  function run(kind, params) {
    return Engine.simulate(kind, params).metrics;
  }

  /** Params a check starts from: current lab params, then the lesson's check setup. */
  function paramsFor(check, current) {
    return { ...(current || {}), ...(check.setup || {}) };
  }

  /** The choice value the sim says is right for a predict check. */
  function expectedValue(check, kind, current) {
    const base = paramsFor(check, current);
    if (check.compare) {
      const m = check.compare.metric;
      const a = run(kind, base)[m];
      const b = run(kind, { ...base, ...check.compare.alt })[m];
      if (a === null || b === null) return a === b ? 'same' : (b === null ? 'more' : 'less');
      if (Math.abs(a - b) <= SAME_EPS * Math.max(1, Math.abs(a))) return 'same';
      return b < a ? 'less' : 'more';
    }
    const v = run(kind, base)[check.metric];
    const vals = (check.choices || []).map((c) => c.value);
    if (typeof v === 'number' && vals.every((x) => typeof x === 'number')) {
      return vals.reduce((best, x) => (Math.abs(x - v) < Math.abs(best - v) ? x : best), vals[0]);
    }
    return v;
  }

  /**
   * Grade one answer. ctx: { kind, params (current lab params), metrics (last run for goal checks), choice }.
   * Returns { ok, expected, actual }.
   */
  function grade(check, ctx) {
    if (check.type === 'goal') {
      const ok = evaluateGoal(check.goal, ctx.metrics);
      return { ok, expected: check.goal, actual: ctx.metrics ? ctx.metrics[check.goal.metric] : null };
    }
    const expected = expectedValue(check, ctx.kind, ctx.params);
    return { ok: ctx.choice === expected, expected, actual: ctx.choice };
  }

  const METRIC_WORDS = { slides: 'slides', a: 'acceleration', t: 'time to the bottom', v: 'speed', distance: 'distance', speed: 'top speed', under: 'part under water' };
  const UNITS = { t: ' s', a: ' m/s²', v: ' m/s', speed: ' m/s', distance: ' m', under: '' };
  // X6: yes/no metrics of the ages 5–6 labs (push, float) — [goal text when true, when false]
  const BOOL_GOALS = {
    slides: ['the block slides', 'the block stays put'],
    moved: ['it moves', 'it stays put'],
    floats: ['it floats', 'it sinks'],
    sinks: ['it sinks', 'it floats'],
    bonk: ['it reaches the end', 'it stops before the end']
  };
  const WORD_VALUES = { away: 'it slides away from Einstein', closer: 'it comes toward Einstein', still: 'it stays put' };

  function describeGoal(goal) {
    if (goal.label) return goal.label;
    const w = METRIC_WORDS[goal.metric] || goal.metric;
    if (BOOL_GOALS[goal.metric]) return BOOL_GOALS[goal.metric][goal.value ? 0 : 1];
    if (typeof goal.value === 'string') return WORD_VALUES[goal.value] || `${w} = ${goal.value}`;
    const u = goal.metric in UNITS ? UNITS[goal.metric] : ' m';
    switch (goal.op) {
      case 'lt': case 'lte': return `${w} under ${goal.value}${u}`;
      case 'gt': case 'gte': return `${w} over ${goal.value}${u}`;
      case 'approx': return `${w} about ${goal.value}${u} (±${goal.tol ?? 0.1})`;
      case 'between': return `${w} between ${goal.value[0]} and ${goal.value[1]}${u}`;
      default: return `${w} = ${goal.value}${u}`;
    }
  }

  /** Kid-friendly words for what a run gave (feedback after a missed goal). */
  function describeValue(metric, v) {
    if (metric === 'slides') return v ? 'a slide' : 'no slide';
    if (BOOL_GOALS[metric]) return BOOL_GOALS[metric][v ? 0 : 1];
    if (v === null || v === undefined) return 'no finish';
    if (typeof v === 'string') return WORD_VALUES[v] || v;
    if (typeof v === 'number') return (Math.round(v * 100) / 100) + (metric in UNITS ? UNITS[metric] : '');
    return String(v);
  }

  /** Grid search over the unlocked controls: a setting that passes the goal (proves a goal is reachable). */
  function findSolution(check, sim, current) {
    const base = { ...(sim.params || {}), ...(current || {}), ...(check.setup || {}) };
    const lock = new Set(check.lock || []);
    const free = (sim.controls || []).filter((c) => !lock.has(c.param));
    const grids = free.map((c) => {
      const n = Math.min(40, Math.round((c.max - c.min) / c.step));
      return Array.from({ length: n + 1 }, (_, i) => +(c.min + ((c.max - c.min) * i) / n).toFixed(6));
    });
    const walk = (i, p) => {
      if (i === free.length) return evaluateGoal(check.goal, run(sim.kind, p)) ? p : null;
      for (const v of grids[i]) {
        const hit = walk(i + 1, { ...p, [free[i].param]: v });
        if (hit) return hit;
      }
      return null;
    };
    return walk(0, base);
  }

  /** Lesson JSON validation for `type: "sim"` lessons. Returns a list of problems ([] = valid). */
  function validateLesson(lesson) {
    const errs = [];
    const id = (lesson && lesson.id) || '?';
    const bad = (m) => errs.push(`${id}: ${m}`);
    if (!lesson || lesson.type !== 'sim') { bad('not a sim lesson'); return errs; }
    ['id', 'unitId', 'title', 'einsteinIntro'].forEach((k) => { if (!lesson[k]) bad('missing ' + k); });
    if (!Array.isArray(lesson.prerequisites)) bad('prerequisites must be an array');
    const sim = lesson.sim;
    let model = null;
    if (!sim || !sim.kind) bad('missing sim.kind');
    else { try { model = Engine.getModel(sim.kind); } catch (e) { bad(e.message); } }
    if (model) {
      Object.keys(sim.params || {}).forEach((k) => { if (!(k in model.defaults)) bad('unknown param ' + k); });
      const p = Engine.resolveParams(model, sim.params);
      if ('muK' in p && p.muK > p.muS) bad('muK must not exceed muS');
      (sim.controls || []).forEach((c) => {
        if (!(c.param in model.defaults)) bad('control for unknown param ' + c.param);
        if (!(c.min < c.max) || !(c.step > 0)) bad(`control ${c.param} needs min < max and step > 0`);
        if (p[c.param] < c.min || p[c.param] > c.max) bad(`param ${c.param} outside its slider range`);
      });
      if (!(sim.controls || []).length) bad('sim needs at least one slider');
    }
    const checks = lesson.simChecks || [];
    if (!checks.length) bad('needs simChecks');
    const ids = new Set();
    checks.forEach((c, i) => {
      const where = `check ${c.id || i}`;
      if (!c.id) bad(where + ' missing id');
      else if (ids.has(c.id)) bad(where + ' duplicate id'); else ids.add(c.id);
      if (!c.prompt) bad(where + ' missing prompt');
      if (model) Object.keys(c.setup || {}).forEach((k) => { if (!(k in model.defaults)) bad(`${where} unknown setup param ${k}`); });
      if (c.type === 'goal') {
        if (!c.goal || !OPS.includes(c.goal.op) || !c.goal.metric) bad(where + ' needs goal { metric, op, value }');
        (c.lock || []).forEach((k) => { if (model && !(k in model.defaults)) bad(`${where} locks unknown param ${k}`); });
        if (model && c.goal && !findSolution(c, sim)) bad(where + ' goal cannot be reached with the sliders');
      } else if (c.type === 'predict') {
        if (!Array.isArray(c.choices) || c.choices.length < 2) bad(where + ' needs 2+ choices');
        else if (model) {
          const exp = expectedValue(c, sim.kind, sim.params);
          if (!c.choices.some((ch) => ch.value === exp)) bad(`${where} no choice matches the sim (${exp})`);
        }
        if (!c.compare && !c.metric) bad(where + ' needs metric or compare');
      } else bad(where + ' type must be goal or predict');
    });
    return errs;
  }

  return { OPS, evaluateGoal, paramsFor, expectedValue, grade, describeGoal, describeValue, findSolution, validateLesson };
});
