/* X40 — Lever / seesaw sim (ages 7–8): a load sits on one side of the fulcrum, Einstein pushes on the other.
 * Model (pure, deterministic, fixed dt via SimEngine):
 *   params: load (kg), loadArm (m from fulcrum), effortArm (m from fulcrum), push (kg of force).
 *   Turning effect: load·loadArm vs push·effortArm (the law of the lever).
 *   needed = load·loadArm ÷ effortArm (push that just balances). push·effortArm > load·loadArm → the load lifts;
 *   equal → balanced; less → the load stays down. A longer effort arm means less push is needed.
 * View: SimKit.mountLab (tilting beam over a triangle fulcrum, sliders, live readout, reduced-motion instant). */
(function (root, factory) {
  const Engine = root.SimEngine || (typeof require === 'function' ? require('./engine.js') : null);
  const api = factory(Engine, root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SimLever = api;
})(typeof self !== 'undefined' ? self : this, function (Engine, root) {
  'use strict';
  const TILT_TIME = 1;      // seconds the beam takes to settle
  const MAX_TILT = 0.28;    // radians
  const REL_EPS = 1e-6;

  function solve(p) {
    const L = p.load * p.loadArm;
    const E = p.push * p.effortArm;
    const balanced = Math.abs(E - L) <= REL_EPS * Math.max(1, L);
    const lifts = !balanced && E > L;
    return { L, E, balanced, lifts, needed: L / p.effortArm, side: balanced ? 0 : (lifts ? 1 : -1) };
  }

  const model = {
    id: 'lever',
    defaults: { load: 20, loadArm: 1, effortArm: 1, push: 10 },
    limits: { load: [1, 100], loadArm: [0.25, 4], effortArm: [0.25, 4], push: [1, 100] },

    init() {
      return { t: 0, angle: 0, settled: false };
    },

    step(s, p, dt) {
      const t = Math.min(TILT_TIME, s.t + dt);
      const target = solve(p).side * MAX_TILT;
      const f = t / TILT_TIME;
      return { t, angle: target * (f * (2 - f)), settled: t >= TILT_TIME - 1e-9 };
    },

    done(s) {
      return !!s.settled;
    },

    metrics(s, p) {
      const r = solve(p);
      return { lifts: r.lifts, balanced: r.balanced, needed: r.needed, push: p.push, cheer: r.lifts || r.balanced };
    },

    analytic(params) {
      const p = Engine ? Engine.resolveParams(model, params) : params;
      const r = solve(p);
      return { lifts: r.lifts, balanced: r.balanced, needed: r.needed };
    }
  };

  if (Engine) Engine.register(model);

  const CONTROL_DEFAULTS = {
    load: { label: 'Load', unit: ' kg', min: 5, max: 60, step: 5, digits: 0 },
    loadArm: { label: 'Load distance from fulcrum', unit: ' m', min: 0.5, max: 3, step: 0.5, digits: 1 },
    effortArm: { label: 'Push distance from fulcrum', unit: ' m', min: 0.5, max: 3, step: 0.5, digits: 1 },
    push: { label: 'Einstein\u2019s push', unit: ' kg', min: 5, max: 60, step: 5, digits: 0 }
  };

  function view() {
    const Kit = root.SimKit;
    const fmt = Kit.fmt;
    return {
      cls: 'sim-lever',
      label: 'Lever and seesaw lab',
      resetLabel: '↺ Level the beam',
      controlDefaults: CONTROL_DEFAULTS,
      describe(state, p) {
        const r = solve(p);
        if (state.settled) {
          if (r.balanced) return `Balanced! ${fmt(p.push, 0)} kg × ${fmt(p.effortArm, 1)} m = ${fmt(p.load, 0)} kg × ${fmt(p.loadArm, 1)} m.`;
          if (r.lifts) return `Up it goes! The load lifts. You only needed ${fmt(r.needed, 1)} kg of push.`;
          return `Too heavy — the load stays down. You need ${fmt(r.needed, 1)} kg of push here.`;
        }
        if (state.t > 0) return 'Pushing…';
        return 'Move the load or the push farther from the fulcrum, then press Run it.';
      },
      aria(state, p) {
        return `Load ${fmt(p.load, 0)} kilograms at ${fmt(p.loadArm, 1)} metres; push ${fmt(p.push, 0)} kilograms at ${fmt(p.effortArm, 1)} metres.`;
      },
      draw(ctx, canvas, state, p) {
        const W = canvas.width, H = canvas.height;
        const cx = W / 2, pivotY = H - 70;
        const ppm = (W / 2 - 40) / 3;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#FFF8E7'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#A3E635'; ctx.fillRect(0, pivotY + 40, W, H - pivotY - 40);
        // fulcrum
        ctx.fillStyle = '#F59E0B'; ctx.strokeStyle = '#1F1F1F'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(cx, pivotY); ctx.lineTo(cx - 28, pivotY + 40); ctx.lineTo(cx + 28, pivotY + 40); ctx.closePath();
        ctx.fill(); ctx.stroke();
        // beam (positive angle = effort side down, load side up)
        ctx.save();
        ctx.translate(cx, pivotY);
        ctx.rotate(state.angle);
        ctx.fillStyle = '#92400E';
        ctx.fillRect(-3 * ppm - 10, -10, 6 * ppm + 20, 10);
        ctx.strokeRect(-3 * ppm - 10, -10, 6 * ppm + 20, 10);
        ctx.fillStyle = '#1F1F1F'; ctx.font = '10px sans-serif';
        for (let m = 1; m <= 3; m++) {
          ctx.fillText(m + ' m', -m * ppm - 8, 12);
          ctx.fillText(m + ' m', m * ppm - 8, 12);
        }
        // load box (left)
        const bs = 18 + Math.min(30, p.load * 0.5);
        const lx = -p.loadArm * ppm;
        ctx.fillStyle = '#3B82F6';
        ctx.fillRect(lx - bs / 2, -10 - bs, bs, bs); ctx.strokeRect(lx - bs / 2, -10 - bs, bs, bs);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif';
        ctx.fillText(fmt(p.load, 0) + 'kg', lx - 12, -10 - bs / 2 + 4);
        // push arrow (right)
        const ex = p.effortArm * ppm;
        const len = 20 + Math.min(50, p.push);
        ctx.strokeStyle = '#7C3AED'; ctx.fillStyle = '#7C3AED'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(ex, -10 - len); ctx.lineTo(ex, -18); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ex - 9, -24); ctx.lineTo(ex + 9, -24); ctx.lineTo(ex, -11); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#1F1F1F'; ctx.font = 'bold 11px sans-serif';
        ctx.fillText('push ' + fmt(p.push, 0) + 'kg', ex - 26, -16 - len);
        ctx.restore();
        ctx.fillStyle = '#1F1F1F'; ctx.font = 'bold 13px sans-serif';
        ctx.fillText('fulcrum', cx - 24, pivotY + 58);
      }
    };
  }

  function mount(host, opts) {
    return root.SimKit.mountLab(host, model, opts, view());
  }

  return { model, analytic: model.analytic, mount, CONTROL_DEFAULTS, solve };
});
