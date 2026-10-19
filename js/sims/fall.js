/* X12 — Falling / gravity sim (ages 9–10): drop from a height; mass cancels when drag ≈ 0.
 * Model (pure, deterministic, fixed dt via SimEngine):
 *   params: height (m), g (m/s²), mass (kg), drag (kg/s linear air drag).
 *   Downward positive: a = g − (drag/mass)·v. Vacuum (drag=0): a = g, t = √(2h/g), v = √(2gh);
 *   mass cancels. With drag, heavier objects fall a bit faster.
 * View: SimKit.mountLab (tower drop, sliders, live readout, reduced-motion instant). */
(function (root, factory) {
  const Engine = root.SimEngine || (typeof require === 'function' ? require('./engine.js') : null);
  const api = factory(Engine, root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SimFall = api;
})(typeof self !== 'undefined' ? self : this, function (Engine, root) {
  'use strict';
  const EPS = 1e-12;

  const model = {
    id: 'fall',
    defaults: { height: 20, g: 9.8, mass: 1, drag: 0 },
    limits: { height: [1, 100], g: [1.6, 25], mass: [0.1, 20], drag: [0, 5] },

    init(p) {
      return { t: 0, y: p.height, v: 0, a: p.g, landed: false, tLand: null, vImpact: 0 };
    },

    step(s, p, dt) {
      if (s.landed) return s;
      const a = p.g - (p.drag / p.mass) * s.v;
      let v = s.v + a * dt;
      let y = s.y - v * dt;
      let t = s.t + dt;
      if (y <= EPS) {
        // solve remaining distance with constant a over this slice (approx)
        const rem = s.y;
        if (rem <= EPS) {
          return { t, y: 0, v, a, landed: true, tLand: t, vImpact: Math.max(0, v) };
        }
        // y decreases: s.y + (-v)*tau + 0.5*(-a)*tau^2 = 0 → 0.5 a tau^2 + v tau - s.y = 0
        const disc = s.v * s.v + 2 * a * s.y;
        const tau = a > EPS ? (-s.v + Math.sqrt(Math.max(0, disc))) / a : (s.v > EPS ? s.y / s.v : 0);
        const tt = Math.max(0, Math.min(dt, tau));
        const vHit = s.v + a * tt;
        return { t: s.t + tt, y: 0, v: 0, a: 0, landed: true, tLand: s.t + tt, vImpact: Math.max(0, vHit) };
      }
      return { t, y, v, a, landed: false, tLand: null, vImpact: 0 };
    },

    done(s) {
      return !!s.landed;
    },

    metrics(s, p) {
      return {
        t: s.tLand,
        v: s.vImpact,
        a: p.drag < 1e-9 ? p.g : (s.landed ? s.vImpact / Math.max(s.tLand, EPS) : s.a),
        height: p.height,
        mass: p.mass,
        g: p.g,
        cheer: true
      };
    },

    analytic(params) {
      const p = Engine ? Engine.resolveParams(model, params) : params;
      if (p.drag < 1e-9) {
        const t = Math.sqrt((2 * p.height) / p.g);
        return { t, v: Math.sqrt(2 * p.g * p.height), a: p.g };
      }
      return null;
    }
  };

  if (Engine) Engine.register(model);

  const CONTROL_DEFAULTS = {
    height: { label: 'Drop height', unit: ' m', min: 5, max: 50, step: 1, digits: 0 },
    g: { label: 'Gravity g', unit: ' m/s²', min: 1.6, max: 25, step: 0.1, digits: 1 },
    mass: { label: 'Mass', unit: ' kg', min: 0.5, max: 10, step: 0.5, digits: 1 },
    drag: { label: 'Air drag', unit: '', min: 0, max: 2, step: 0.1, digits: 1,
      choices: [
        { value: 0, label: '🚀 Vacuum', text: 'Vacuum' },
        { value: 0.5, label: '💨 Light air', text: 'Light air' },
        { value: 1.5, label: '🌬️ Windy', text: 'Windy' }
      ] }
  };

  function view() {
    const Kit = root.SimKit;
    const fmt = Kit.fmt;
    return {
      cls: 'sim-fall',
      label: 'Gravity drop tower',
      resetLabel: '↺ Lift it up',
      controlDefaults: CONTROL_DEFAULTS,
      describe(state, p) {
        if (state.landed) {
          const tip = p.drag < 1e-9 ? ' (mass did not matter!)' : '';
          return `Thud! Hit the ground in ${fmt(state.tLand, 2)} s at ${fmt(state.vImpact, 1)} m/s.${tip}`;
        }
        if (state.t > 0) {
          return `Falling… ${fmt(state.y, 1)} m up · ${fmt(state.v, 1)} m/s`;
        }
        return `Pick a height and gravity, then press Run it. Try vacuum vs air!`;
      },
      aria(state, p) {
        return `Drop from ${fmt(p.height, 0)} metres at g=${fmt(p.g, 1)}, mass ${fmt(p.mass, 1)} kilograms.`;
      },
      draw(ctx, canvas, state, p) {
        const W = canvas.width, H = canvas.height;
        const groundY = H - 36;
        const topY = 30;
        const px = (groundY - topY) / Math.max(p.height, 1);
        const cy = groundY - state.y * px;
        const cx = W / 2;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#E0F2FE'; ctx.fillRect(0, 0, W, H);
        // tower rails
        ctx.strokeStyle = '#64748B'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(cx - 50, topY - 10); ctx.lineTo(cx - 50, groundY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + 50, topY - 10); ctx.lineTo(cx + 50, groundY); ctx.stroke();
        // ground
        ctx.fillStyle = '#A3E635'; ctx.fillRect(0, groundY, W, H - groundY);
        ctx.strokeStyle = '#1F1F1F'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.stroke();
        // height marks
        ctx.fillStyle = '#1F1F1F'; ctx.font = '11px sans-serif';
        for (let m = 0; m <= p.height; m += Math.max(5, Math.round(p.height / 4))) {
          const yy = groundY - m * px;
          ctx.beginPath(); ctx.moveTo(cx + 58, yy); ctx.lineTo(cx + 68, yy); ctx.stroke();
          ctx.fillText(m + ' m', cx + 72, yy + 4);
        }
        // falling ball (size from mass)
        const r = 10 + Math.min(18, p.mass * 2);
        ctx.fillStyle = p.drag < 1e-9 ? '#3B82F6' : '#F59E0B';
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#1F1F1F'; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif';
        ctx.fillText(fmt(p.mass, 0) + 'kg', cx - 10, cy + 4);
        // g label
        ctx.fillStyle = '#1F1F1F'; ctx.font = 'bold 13px sans-serif';
        ctx.fillText('g = ' + fmt(p.g, 1) + ' m/s²', 16, 24);
        if (p.drag < 1e-9) ctx.fillText('VACUUM', 16, 44);
        else ctx.fillText('AIR drag ' + fmt(p.drag, 1), 16, 44);
      }
    };
  }

  function mount(host, opts) {
    return root.SimKit.mountLab(host, model, opts, view());
  }

  return { model, analytic: model.analytic, mount, CONTROL_DEFAULTS };
});
