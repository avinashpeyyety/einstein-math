/* X40 cycle 2 — Pulley sim (ages 7–8): a load hangs from a pulley system; Einstein pulls the free end of the rope.
 * Model (pure, deterministic, fixed dt via SimEngine):
 *   params: load (kg), ropes (rope segments holding the load up: 1 = one fixed pulley, 2–4 = moving pulleys),
 *           pull (kg of force on the free end), height (m the load should rise).
 *   needed = load ÷ ropes (pull that just holds the load still). pull·ropes > load → the load lifts;
 *   equal → it hangs still; less → it stays down. Trade-off: rope = height × ropes (rope to pull for the lift);
 *   pulled = rope actually pulled in this run (rope if it lifts, else 0).
 *   (Ideal pulleys: no friction, light rope and wheels.)
 * View: SimKit.mountLab (ceiling, pulley wheels, rope segments, rising load, sliders, live readout, reduced-motion instant). */
(function (root, factory) {
  const Engine = root.SimEngine || (typeof require === 'function' ? require('./engine.js') : null);
  const api = factory(Engine, root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SimPulley = api;
})(typeof self !== 'undefined' ? self : this, function (Engine, root) {
  'use strict';
  const LIFT_TIME = 1.5;   // seconds the lift animation takes
  const REL_EPS = 1e-6;

  function solve(p) {
    const ropes = Math.max(1, Math.round(p.ropes));
    const E = p.pull * ropes;
    const holds = Math.abs(E - p.load) <= REL_EPS * Math.max(1, p.load);
    const lifts = !holds && E > p.load;
    return { ropes, holds, lifts, needed: p.load / ropes, rope: p.height * ropes };
  }

  const model = {
    id: 'pulley',
    defaults: { load: 40, ropes: 1, pull: 20, height: 1 },
    limits: { load: [1, 200], ropes: [1, 6], pull: [1, 200], height: [0.5, 3] },

    init() {
      return { t: 0, rise: 0, settled: false };
    },

    step(s, p, dt) {
      const t = Math.min(LIFT_TIME, s.t + dt);
      const f = t / LIFT_TIME;
      const r = solve(p);
      return { t, rise: r.lifts ? p.height * (f * (2 - f)) : 0, settled: t >= LIFT_TIME - 1e-9 };
    },

    done(s) {
      return !!s.settled;
    },

    metrics(s, p) {
      const r = solve(p);
      return { lifts: r.lifts, holds: r.holds, needed: r.needed, rope: r.rope, pulled: r.lifts ? r.rope : 0, pull: p.pull, cheer: r.lifts || r.holds };
    },

    analytic(params) {
      const p = Engine ? Engine.resolveParams(model, params) : params;
      const r = solve(p);
      return { lifts: r.lifts, holds: r.holds, needed: r.needed, rope: r.rope };
    }
  };

  if (Engine) Engine.register(model);

  const CONTROL_DEFAULTS = {
    load: { label: 'Load', unit: ' kg', min: 10, max: 80, step: 10, digits: 0 },
    ropes: { label: 'Ropes holding the load', unit: '', min: 1, max: 4, step: 1, digits: 0 },
    pull: { label: 'Einstein\u2019s pull', unit: ' kg', min: 5, max: 60, step: 5, digits: 0 },
    height: { label: 'Lift height', unit: ' m', min: 0.5, max: 2, step: 0.5, digits: 1 }
  };

  function view() {
    const Kit = root.SimKit;
    const fmt = Kit.fmt;
    return {
      cls: 'sim-pulley',
      label: 'Pulley lab',
      resetLabel: '↺ Lower the load',
      controlDefaults: CONTROL_DEFAULTS,
      describe(state, p) {
        const r = solve(p);
        if (state.settled) {
          if (r.holds) return `It hangs still! ${r.ropes} rope${r.ropes > 1 ? 's' : ''} × ${fmt(p.pull, 0)} kg = ${fmt(p.load, 0)} kg.`;
          if (r.lifts) return `Up it goes! It rose ${fmt(p.height, 1)} m, and you pulled ${fmt(r.rope, 1)} m of rope.`;
          return `Too heavy — it stays down. With ${r.ropes} rope${r.ropes > 1 ? 's' : ''} you need more than ${fmt(r.needed, 1)} kg of pull.`;
        }
        if (state.t > 0) return 'Pulling…';
        return 'Add ropes or change the pull, then press Run it.';
      },
      aria(state, p) {
        const r = solve(p);
        return `Load ${fmt(p.load, 0)} kilograms held by ${r.ropes} ropes; pull ${fmt(p.pull, 0)} kilograms; load raised ${fmt(state.rise, 1)} metres.`;
      },
      draw(ctx, canvas, state, p) {
        const W = canvas.width, H = canvas.height;
        const r = solve(p);
        const ceilY = 24, floorY = H - 30;
        const ppm = (floorY - ceilY - 150) / 2;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#FFF8E7'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#A3E635'; ctx.fillRect(0, floorY, W, H - floorY);
        ctx.fillStyle = '#92400E'; ctx.fillRect(0, 0, W, ceilY);
        ctx.strokeStyle = '#1F1F1F'; ctx.lineWidth = 2;
        const cx = W / 2 - 40;
        const gap = 22;
        const span = (r.ropes - 1) * gap;
        const bs = 34 + Math.min(30, p.load * 0.35);
        const loadTop = floorY - bs - state.rise * ppm;
        const blockY = loadTop - 26;
        // rope segments holding the load
        ctx.strokeStyle = '#B45309'; ctx.lineWidth = 3;
        for (let i = 0; i < r.ropes; i++) {
          const x = cx - span / 2 + i * gap;
          ctx.beginPath(); ctx.moveTo(x, ceilY + 30); ctx.lineTo(x, r.ropes > 1 ? blockY : loadTop); ctx.stroke();
        }
        // top (fixed) pulley wheel
        const topX = cx + span / 2 + 18, topY = ceilY + 30;
        ctx.fillStyle = '#9CA3AF'; ctx.strokeStyle = '#1F1F1F'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(topX, topY, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(topX, ceilY); ctx.lineTo(topX, topY); ctx.stroke();
        // free end of the rope down to Einstein's hand
        const handX = topX + 16, handY = floorY - 70;
        ctx.strokeStyle = '#B45309'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(handX, topY); ctx.lineTo(handX, handY); ctx.stroke();
        ctx.strokeStyle = '#7C3AED'; ctx.fillStyle = '#7C3AED'; ctx.lineWidth = 5;
        const len = 20 + Math.min(50, p.pull);
        ctx.beginPath(); ctx.moveTo(handX + 18, handY); ctx.lineTo(handX + 18, handY + len); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(handX + 9, handY + len - 6); ctx.lineTo(handX + 27, handY + len - 6); ctx.lineTo(handX + 18, handY + len + 7); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#1F1F1F'; ctx.font = 'bold 11px sans-serif';
        ctx.fillText('pull ' + fmt(p.pull, 0) + 'kg', handX + 30, handY + 14);
        // moving pulley block
        if (r.ropes > 1) {
          ctx.fillStyle = '#9CA3AF'; ctx.strokeStyle = '#1F1F1F'; ctx.lineWidth = 2;
          ctx.fillRect(cx - span / 2 - 8, blockY, span + 16, 14); ctx.strokeRect(cx - span / 2 - 8, blockY, span + 16, 14);
          ctx.beginPath(); ctx.moveTo(cx, blockY + 14); ctx.lineTo(cx, loadTop); ctx.stroke();
        }
        // load
        ctx.fillStyle = '#3B82F6'; ctx.strokeStyle = '#1F1F1F'; ctx.lineWidth = 2;
        ctx.fillRect(cx - bs / 2, loadTop, bs, bs); ctx.strokeRect(cx - bs / 2, loadTop, bs, bs);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif';
        ctx.fillText(fmt(p.load, 0) + 'kg', cx - 14, loadTop + bs / 2 + 4);
        ctx.fillStyle = '#1F1F1F'; ctx.font = 'bold 13px sans-serif';
        ctx.fillText(r.ropes + (r.ropes > 1 ? ' ropes hold it' : ' rope holds it'), 12, ceilY + 22);
      }
    };
  }

  function mount(host, opts) {
    return root.SimKit.mountLab(host, model, opts, view());
  }

  return { model, analytic: model.analytic, mount, CONTROL_DEFAULTS, solve };
});
