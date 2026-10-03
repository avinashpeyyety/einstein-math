/* X4 — Ramp & friction sim: a block on an incline (angle, mass, μs, μk, gravity, ramp length).
 * Model (pure, deterministic, fixed dt via SimEngine):
 *   at rest: it starts to slide only if the pull down the slope beats the most static friction can give,
 *            m·g·sinθ > μs·m·g·cosθ  (⇔ tanθ > μs). Otherwise it stays put ("stuck").
 *   sliding: a = g·(sinθ − μk·cosθ)  (μk is capped at μs). Mass cancels — heavy and light blocks race equal.
 *   Constant-acceleration steps are integrated exactly (x += v·dt + ½a·dt²), and the arrival at the bottom
 *   is solved inside the last step, so time-to-bottom matches √(2L/a) to floating-point precision.
 * View: mount(host, opts) draws the canvas, kid-sized range sliders (keyboard native), Run / Reset, and a
 * live text readout; prefers-reduced-motion shows the final frame instantly instead of animating. */
(function (root, factory) {
  const Engine = root.SimEngine || (typeof require === 'function' ? require('./engine.js') : null);
  const api = factory(Engine);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SimRamp = api;
})(typeof self !== 'undefined' ? self : this, function (Engine) {
  'use strict';
  const RAD = Math.PI / 180;

  const model = {
    id: 'ramp',
    defaults: { angleDeg: 20, mass: 2, muS: 0.5, muK: 0.3, g: 9.8, length: 2 },
    limits: { angleDeg: [0, 80], mass: [0.1, 100], muS: [0, 2], muK: [0, 2], g: [0.1, 50], length: [0.2, 10] },

    forces(p) {
      const th = p.angleDeg * RAD;
      const W = p.mass * p.g;
      const N = W * Math.cos(th);
      return {
        weight: W,
        downSlope: W * Math.sin(th),      // pull along the slope
        normal: N,
        staticMax: p.muS * N,             // most grip static friction can give
        kinetic: Math.min(p.muK, p.muS) * N
      };
    },

    init() {
      return { t: 0, x: 0, v: 0, a: 0, moving: false, stuck: false, atBottom: false, tBottom: null };
    },

    step(s, p, dt) {
      const th = p.angleDeg * RAD;
      const sin = Math.sin(th), cos = Math.cos(th);
      const muK = Math.min(p.muK, p.muS);
      let moving = s.moving;
      if (!moving) {
        const f = model.forces(p);
        if (!(f.downSlope > f.staticMax)) return { ...s, t: s.t + dt, a: 0, stuck: true };
        moving = true;
      }
      const a = p.g * (sin - muK * cos);
      if (a <= 0 && s.v <= 0) return { ...s, t: s.t + dt, a: 0, moving: false, stuck: true };
      const rem = p.length - s.x;
      const dx = s.v * dt + 0.5 * a * dt * dt;
      if (dx >= rem) {
        const tau = a > 0 ? (-s.v + Math.sqrt(s.v * s.v + 2 * a * rem)) / a : rem / s.v;
        return { t: s.t + tau, x: p.length, v: s.v + a * tau, a, moving: true, stuck: false, atBottom: true, tBottom: s.t + tau };
      }
      return { t: s.t + dt, x: s.x + dx, v: s.v + a * dt, a, moving: true, stuck: false, atBottom: false, tBottom: null };
    },

    done(s) {
      return s.stuck || s.atBottom;
    },

    /** What a check can read after a run. */
    metrics(s, p) {
      return {
        slides: !!(s.moving || s.atBottom),
        stuck: !!s.stuck,
        a: s.a,
        t: s.tBottom,              // seconds to reach the bottom (null if it never gets there)
        v: s.v,                    // speed at the end, m/s
        distance: s.x,
        mass: p.mass,
        angleDeg: p.angleDeg
      };
    },

    /** Textbook answer, used by tests and by the lab's "Einstein says" hints. */
    analytic(params) {
      const p = Engine ? Engine.resolveParams(model, params) : params;
      const th = p.angleDeg * RAD;
      const slides = Math.sin(th) > p.muS * Math.cos(th);
      const a = slides ? p.g * (Math.sin(th) - Math.min(p.muK, p.muS) * Math.cos(th)) : 0;
      return {
        slides,
        a,
        thresholdAngleDeg: Math.atan(p.muS) / RAD,
        tBottom: slides && a > 0 ? Math.sqrt(2 * p.length / a) : null,
        vBottom: slides && a > 0 ? Math.sqrt(2 * a * p.length) : 0
      };
    }
  };

  if (Engine) Engine.register(model);

  /* ---------------- view (browser only) ---------------- */
  const fmt = (v, d) => (v === null || v === undefined || !Number.isFinite(v) ? '—' : Number(v).toFixed(d));
  const CONTROL_DEFAULTS = {
    angleDeg: { label: 'Ramp angle', unit: '°', min: 0, max: 60, step: 1, digits: 0 },
    mass: { label: 'Block mass', unit: ' kg', min: 0.5, max: 10, step: 0.5, digits: 1 },
    muS: { label: 'Grip to start (μs)', unit: '', min: 0.05, max: 1, step: 0.05, digits: 2 },
    muK: { label: 'Rub while sliding (μk)', unit: '', min: 0, max: 1, step: 0.05, digits: 2 },
    g: { label: 'Gravity (g)', unit: ' m/s²', min: 1, max: 25, step: 0.1, digits: 1 },
    length: { label: 'Ramp length', unit: ' m', min: 0.5, max: 5, step: 0.5, digits: 1 }
  };

  function prefersReducedMotion() {
    try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (_) { return false; }
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function mount(host, opts) {
    opts = opts || {};
    let params = Engine.resolveParams(model, opts.params);
    let locked = new Set(opts.locked || []);
    const controls = (opts.controls || []).map((c) => ({ ...(CONTROL_DEFAULTS[c.param] || {}), ...c }));
    const reduced = opts.reducedMotion !== undefined ? !!opts.reducedMotion : prefersReducedMotion();
    let raf = 0, runner = null, lastResult = null, running = false, pendingResolve = null;

    host.innerHTML = `
      <div class="sim sim-ramp">
        <canvas class="sim-canvas" width="560" height="280" role="img" aria-label="Ramp lab"></canvas>
        <div class="sim-readout" aria-live="polite"></div>
        <div class="sim-controls">
          ${controls.map((c) => `
            <label class="sim-control" data-control="${esc(c.param)}">
              <span class="sim-control-label">${esc(c.label)}</span>
              <input type="range" data-param="${esc(c.param)}" min="${c.min}" max="${c.max}" step="${c.step}" />
              <output class="sim-control-value"></output>
            </label>`).join('')}
        </div>
        <div class="sim-buttons">
          <button type="button" class="btn btn-primary btn-sm" data-sim-run>▶ Run it</button>
          <button type="button" class="btn btn-ghost btn-sm" data-sim-reset>↺ Reset block</button>
        </div>
      </div>`;
    const canvas = host.querySelector('canvas');
    const ctx = canvas.getContext && canvas.getContext('2d');
    const readout = host.querySelector('.sim-readout');
    const runBtn = host.querySelector('[data-sim-run]');

    function valueText(c, v) {
      return fmt(v, c.digits ?? 2) + (c.unit || '');
    }

    function syncInputs() {
      controls.forEach((c) => {
        const input = host.querySelector(`input[data-param="${c.param}"]`);
        const out = host.querySelector(`[data-control="${c.param}"] output`);
        input.value = String(params[c.param]);
        input.disabled = locked.has(c.param);
        input.setAttribute('aria-valuetext', valueText(c, params[c.param]));
        input.closest('.sim-control').classList.toggle('locked', locked.has(c.param));
        if (out) out.textContent = valueText(c, params[c.param]) + (locked.has(c.param) ? ' 🔒' : '');
      });
    }

    function describe(state) {
      const m = model.metrics(state, params);
      if (state.stuck) return `Stuck! The grip wins — the block stays put at ${fmt(params.angleDeg, 0)}°.`;
      if (state.atBottom) return `Whoosh! Reached the bottom (${fmt(params.length, 1)} m) in ${fmt(m.t, 2)} s · acceleration ${fmt(m.a, 2)} m/s² · speed ${fmt(m.v, 2)} m/s.`;
      if (state.moving) return `Sliding… ${fmt(state.x, 2)} m in ${fmt(state.t, 2)} s · speed ${fmt(state.v, 2)} m/s.`;
      return 'Ready! Set the sliders, then press Run it.';
    }

    function draw(state) {
      if (!ctx) return;
      const W = canvas.width, H = canvas.height;
      const th = params.angleDeg * RAD;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#FFF8E7'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#A3E635'; ctx.fillRect(0, H - 24, W, 24);
      const bx = W - 40, by = H - 24;
      const cos = Math.cos(th), sin = Math.sin(th);
      const Lpx = Math.min((W - 90) / Math.max(cos, 0.05), sin > 0.01 ? (H - 70) / sin : 1e9);
      const tx = bx - Lpx * cos, ty = by - Lpx * sin;
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(bx, by); ctx.lineTo(tx, by); ctx.closePath();
      ctx.fillStyle = '#FDBA74'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#1F1F1F'; ctx.stroke();
      // angle arc + label
      ctx.beginPath(); ctx.arc(bx, by, 34, Math.PI, Math.PI + th, false); ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#1F1F1F'; ctx.font = 'bold 16px sans-serif';
      ctx.fillText(fmt(params.angleDeg, 0) + '°', bx - 70, by - 8);
      // block (size grows gently with mass)
      const size = 22 + Math.min(20, Math.sqrt(params.mass) * 7);
      const frac = params.length > 0 ? Math.min(1, state.x / params.length) : 0;
      const along = frac * Math.max(0, Lpx - size);
      const cx = tx + along * cos, cy = ty + along * sin;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(th);
      ctx.fillStyle = state.stuck ? '#60A5FA' : '#EF4444';
      ctx.fillRect(0, -size, size, size); ctx.lineWidth = 3; ctx.strokeRect(0, -size, size, size);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.fillText(fmt(params.mass, 1) + 'kg', 3, -size / 2 + 4);
      ctx.restore();
      canvas.setAttribute('aria-label', `Ramp at ${fmt(params.angleDeg, 0)} degrees, block ${fmt(params.mass, 1)} kilograms. ${describe(state)}`);
    }

    function show(state) {
      draw(state);
      readout.textContent = describe(state);
    }

    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0; running = false; runBtn.disabled = false;
      if (pendingResolve) { const r = pendingResolve; pendingResolve = null; r(null); }
    }

    function reset() {
      stop();
      lastResult = null;
      runner = Engine.createRunner(model, params);
      show(runner.state);
    }

    function finish(result) {
      running = false; runBtn.disabled = false; raf = 0;
      lastResult = result;
      show(result.state);
      if (typeof opts.onRun === 'function') opts.onRun(result.metrics, { ...params });
      if (pendingResolve) { const r = pendingResolve; pendingResolve = null; r(result.metrics); }
    }

    function run() {
      stop();
      const result = Engine.simulate(model, params);   // deterministic outcome, same steps as the animation
      runner = Engine.createRunner(model, params);
      return new Promise((resolve) => {
        pendingResolve = resolve;
        running = true; runBtn.disabled = true;
        if (reduced || typeof requestAnimationFrame !== 'function') { finish(result); return; }
        let last = null, stuckFrames = 0;
        const tick = (ts) => {
          if (last === null) last = ts;
          Engine.advance(runner, (ts - last) / 1000);
          last = ts;
          show(runner.state);
          if (model.done(runner.state, runner.params)) {
            if (runner.state.stuck && stuckFrames++ < 20) { raf = requestAnimationFrame(tick); return; }
            finish(result);
            return;
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      });
    }

    host.querySelectorAll('input[data-param]').forEach((input) => {
      input.addEventListener('input', () => {
        const k = input.dataset.param;
        if (locked.has(k)) return;
        params = Engine.resolveParams(model, { ...params, [k]: Number(input.value) });
        syncInputs();
        reset();
        if (typeof opts.onChange === 'function') opts.onChange({ ...params });
      });
    });
    runBtn.addEventListener('click', () => { run(); });
    host.querySelector('[data-sim-reset]').addEventListener('click', () => reset());

    syncInputs();
    reset();

    return {
      run,
      reset,
      getParams: () => ({ ...params }),
      setParams(next, o) {
        params = Engine.resolveParams(model, { ...params, ...(next || {}) });
        if (o && o.locked) locked = new Set(o.locked);
        syncInputs();
        reset();
      },
      /** Metrics of the last finished run for the current sliders (null if changed since or never run). */
      lastMetrics: () => (lastResult ? lastResult.metrics : null),
      isRunning: () => running,
      destroy() { stop(); host.innerHTML = ''; }
    };
  }

  return { model, analytic: model.analytic, mount, CONTROL_DEFAULTS };
});
