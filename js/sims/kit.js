/* X6 — shared lab view kit for the ages 5–6 sims (push.js, float.js). Browser only; loaded lazily with them.
 * mountLab(host, model, opts, view) gives the same handle as SimRamp.mount (run / reset / getParams /
 * setParams / lastMetrics / isRunning / destroy), so js/app.js mounts any sim kind the same way.
 * Controls: range sliders (keyboard native) or `choices` button groups (Tab + Enter/Space, aria-pressed).
 * Runs are deterministic: Engine.simulate gives the result, the animation replays the same fixed steps;
 * prefers-reduced-motion shows the final frame instantly. view = { cls, label, resetLabel, controlDefaults,
 * draw(ctx, canvas, state, params), describe(state, params, controlIds), aria(state, params) }. */
(function (root, factory) {
  const Engine = root.SimEngine || (typeof require === 'function' ? require('./engine.js') : null);
  const api = factory(Engine);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SimKit = api;
})(typeof self !== 'undefined' ? self : this, function (Engine) {
  'use strict';
  const fmt = (v, d) => (v === null || v === undefined || !Number.isFinite(v) ? '—' : Number(v).toFixed(d));

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function prefersReducedMotion() {
    try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (_) { return false; }
  }

  function mountLab(host, model, opts, view) {
    opts = opts || {};
    let params = Engine.resolveParams(model, opts.params);
    let locked = new Set(opts.locked || []);
    const controls = (opts.controls || []).map((c) => ({ ...((view.controlDefaults || {})[c.param] || {}), ...c }));
    const controlIds = new Set(controls.map((c) => c.param));
    const reduced = opts.reducedMotion !== undefined ? !!opts.reducedMotion : prefersReducedMotion();
    let raf = 0, runner = null, lastResult = null, running = false, pendingResolve = null;

    const controlHtml = (c) => c.choices
      ? `<div class="sim-control sim-choice" data-control="${esc(c.param)}">
           <span class="sim-control-label" id="lbl-${esc(c.param)}">${esc(c.label)}</span>
           <div class="sim-choice-row" role="group" aria-labelledby="lbl-${esc(c.param)}">
             ${c.choices.map((ch) => `<button type="button" class="btn btn-ghost btn-sm sim-choice-btn" data-param="${esc(c.param)}" data-value="${esc(ch.value)}" aria-pressed="false">${esc(ch.label)}</button>`).join('')}
           </div>
           <output class="sim-control-value"></output>
         </div>`
      : `<label class="sim-control" data-control="${esc(c.param)}">
           <span class="sim-control-label">${esc(c.label)}</span>
           <input type="range" data-param="${esc(c.param)}" min="${c.min}" max="${c.max}" step="${c.step}" />
           <output class="sim-control-value"></output>
         </label>`;

    host.innerHTML = `
      <div class="sim ${esc(view.cls || '')}">
        <canvas class="sim-canvas" width="560" height="280" role="img" aria-label="${esc(view.label || 'Lab')}"></canvas>
        <div class="sim-readout" aria-live="polite"></div>
        <div class="sim-controls">${controls.map(controlHtml).join('')}</div>
        <div class="sim-buttons">
          <button type="button" class="btn btn-primary btn-sm" data-sim-run>▶ Run it</button>
          <button type="button" class="btn btn-ghost btn-sm" data-sim-reset>${esc(view.resetLabel || '↺ Reset')}</button>
        </div>
      </div>`;
    const canvas = host.querySelector('canvas');
    const ctx = canvas.getContext && canvas.getContext('2d');
    const readout = host.querySelector('.sim-readout');
    const runBtn = host.querySelector('[data-sim-run]');

    function valueText(c, v) {
      if (c.choices) {
        const ch = c.choices.find((x) => Number(x.value) === Number(v));
        return ch ? (ch.text || ch.label) : String(v);
      }
      return fmt(v, c.digits ?? 0) + (c.unit || '');
    }

    function syncInputs() {
      controls.forEach((c) => {
        const box = host.querySelector(`[data-control="${c.param}"]`);
        const out = box.querySelector('output');
        const isLocked = locked.has(c.param);
        box.classList.toggle('locked', isLocked);
        if (c.choices) {
          box.querySelectorAll('button[data-value]').forEach((b) => {
            const on = Number(b.dataset.value) === Number(params[c.param]);
            b.setAttribute('aria-pressed', on ? 'true' : 'false');
            b.classList.toggle('btn-primary', on);
            b.classList.toggle('btn-ghost', !on);
            b.disabled = isLocked;
          });
        } else {
          const input = box.querySelector('input');
          input.value = String(params[c.param]);
          input.disabled = isLocked;
          input.setAttribute('aria-valuetext', valueText(c, params[c.param]));
        }
        if (out) out.textContent = valueText(c, params[c.param]) + (isLocked ? ' 🔒' : '');
      });
    }

    function show(state) {
      if (ctx) view.draw(ctx, canvas, state, params);
      const text = view.describe(state, params, controlIds);
      readout.textContent = text;
      canvas.setAttribute('aria-label', (view.aria ? view.aria(state, params) + ' ' : '') + text);
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
      const result = Engine.simulate(model, params);
      runner = Engine.createRunner(model, params);
      return new Promise((resolve) => {
        pendingResolve = resolve;
        running = true; runBtn.disabled = true;
        if (reduced || typeof requestAnimationFrame !== 'function') { finish(result); return; }
        let last = null, holdFrames = 0;
        const tick = (ts) => {
          if (last === null) last = ts;
          Engine.advance(runner, (ts - last) / 1000);
          last = ts;
          show(runner.state);
          if (model.done(runner.state, runner.params) || runner.state.t >= 30) {
            if (holdFrames++ < 15) { raf = requestAnimationFrame(tick); return; }
            finish(result);
            return;
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      });
    }

    function setParam(k, v) {
      if (locked.has(k)) return;
      params = Engine.resolveParams(model, { ...params, [k]: Number(v) });
      syncInputs();
      reset();
      if (typeof opts.onChange === 'function') opts.onChange({ ...params });
    }

    host.querySelectorAll('input[data-param]').forEach((input) => {
      input.addEventListener('input', () => setParam(input.dataset.param, input.value));
    });
    host.querySelectorAll('button[data-param]').forEach((b) => {
      b.addEventListener('click', () => setParam(b.dataset.param, b.dataset.value));
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
      lastMetrics: () => (lastResult ? lastResult.metrics : null),
      isRunning: () => running,
      destroy() { stop(); host.innerHTML = ''; }
    };
  }

  return { mountLab, fmt, esc, prefersReducedMotion };
});
