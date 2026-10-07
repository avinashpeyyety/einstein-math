/* X6 — Sink or float sim (ages 5–6): drop an object into a water tank and watch it bob or sink.
 * Model (pure, deterministic, fixed dt via SimEngine):
 *   Each object is a solid of size h (m) with a density ρ (kg/m³); water is ρw = 1000 kg/m³.
 *   With y = height of the object's bottom above the tank floor and s = how much of it is under water,
 *   a = −g + (ρw/ρ)·g·(s/h) − drag·(ρw/(ρ·h))·(s/h)·v   (buoyancy grows with the part under water; water
 *   drag acts on the surface, so it slows small light things more than big heavy ones).
 *   Semi-implicit fixed-dt steps. It ends when it rests on the floor (ρ ≥ ρw: it sinks) or settles at the
 *   surface with ρ/ρw of it under water (ρ < ρw: it floats). Size and weight alone never decide — density does.
 * View: SimKit.mountLab (canvas tank, object picker buttons, live readout, reduced-motion instant result). */
(function (root, factory) {
  const Engine = root.SimEngine || (typeof require === 'function' ? require('./engine.js') : null);
  const api = factory(Engine, root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SimFloat = api;
})(typeof self !== 'undefined' ? self : this, function (Engine, root) {
  'use strict';

  /* Typical densities (kg/m³). The duck is hollow, so it counts its air inside. */
  const OBJECTS = [
    { id: 'wood', name: 'wooden block', icon: '🪵', rho: 600, h: 0.10, color: '#B45309', shape: 'block' },
    { id: 'rock', name: 'rock', icon: '🪨', rho: 2600, h: 0.08, color: '#6B7280', shape: 'rock' },
    { id: 'apple', name: 'apple', icon: '🍎', rho: 850, h: 0.08, color: '#EF4444', shape: 'apple' },
    { id: 'coin', name: 'coin', icon: '🪙', rho: 8900, h: 0.025, color: '#F59E0B', shape: 'coin' },
    { id: 'duck', name: 'rubber duck', icon: '🦆', rho: 150, h: 0.09, color: '#FACC15', shape: 'duck' },
    { id: 'key', name: 'key', icon: '🔑', rho: 8500, h: 0.04, color: '#A8A29E', shape: 'key' },
    { id: 'log', name: 'big log', icon: '🌲', rho: 650, h: 0.16, color: '#92400E', shape: 'log' }
  ];

  const objectAt = (p) => OBJECTS[Math.max(0, Math.min(OBJECTS.length - 1, Math.round(p.object)))];

  const model = {
    id: 'float',
    defaults: { object: 0, rhoWater: 1000, depth: 0.6, drop: 0.15, drag: 1, g: 9.8 },
    limits: { object: [0, OBJECTS.length - 1], rhoWater: [500, 2000], depth: [0.3, 2], drop: [0, 1], drag: [0.1, 20], g: [0.1, 50] },
    OBJECTS,
    objectAt,

    init(p) {
      return { t: 0, y: p.depth + p.drop, v: 0, a: 0, wet: false, settled: false, onBottom: false, tDone: null };
    },

    step(s, p, dt) {
      const o = objectAt(p);
      const sub = Math.min(o.h, Math.max(0, p.depth - s.y));
      const frac = sub / o.h;
      const a = -p.g + (p.rhoWater / o.rho) * p.g * frac - p.drag * (p.rhoWater / (o.rho * o.h)) * frac * s.v;
      let v = s.v + a * dt;
      let y = s.y + v * dt;
      const t = s.t + dt;
      const wet = s.wet || frac > 0;
      if (y <= 0) {
        y = 0; v = 0;
        if (o.rho >= p.rhoWater) return { t, y, v, a: 0, wet: true, settled: false, onBottom: true, tDone: t };
      }
      const settled = wet && frac > 0 && o.rho < p.rhoWater && Math.abs(v) < 0.002 && Math.abs(a) < 0.02;
      return { t, y, v, a, wet, settled, onBottom: false, tDone: settled ? t : null };
    },

    done(s) {
      return s.settled || s.onBottom;
    },

    metrics(s, p) {
      const o = objectAt(p);
      const sub = Math.min(o.h, Math.max(0, p.depth - s.y));
      return {
        floats: !!s.settled && !s.onBottom,
        sinks: !!s.onBottom,
        under: sub / o.h,            // part of it under water at the end (0–1)
        t: s.tDone,                  // seconds until it settles / lands on the bottom
        object: o.id,
        density: o.rho,
        cheer: true
      };
    },

    /** Textbook answer: floats when it is less dense than water, with ρ/ρw of it under water. */
    analytic(params) {
      const p = Engine ? Engine.resolveParams(model, params) : params;
      const o = objectAt(p);
      const floats = o.rho < p.rhoWater;
      return { floats, under: floats ? o.rho / p.rhoWater : 1 };
    }
  };

  if (Engine) Engine.register(model);

  /* ---------------- view (browser only) ---------------- */
  const CONTROL_DEFAULTS = {
    object: { label: 'Pick something to drop', min: 0, max: OBJECTS.length - 1, step: 1,
      choices: OBJECTS.map((o, i) => ({ value: i, label: `${o.icon} ${o.name}`, text: o.name })) }
  };

  function drawObject(ctx, o, cx, bottom, px) {
    const h = Math.max(8, o.h * px);
    ctx.fillStyle = o.color; ctx.strokeStyle = '#1F1F1F'; ctx.lineWidth = 3;
    switch (o.shape) {
      case 'rock':
        ctx.beginPath(); ctx.ellipse(cx, bottom - h / 2, h * 0.75, h / 2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); break;
      case 'apple':
        ctx.beginPath(); ctx.arc(cx, bottom - h / 2, h / 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, bottom - h); ctx.lineTo(cx + 3, bottom - h - 8); ctx.stroke(); break;
      case 'coin':
        ctx.beginPath(); ctx.ellipse(cx, bottom - h / 2, h * 0.9, h / 2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); break;
      case 'duck':
        ctx.beginPath(); ctx.ellipse(cx, bottom - h * 0.35, h * 0.6, h * 0.35, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx + h * 0.35, bottom - h * 0.8, h * 0.22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#F97316'; ctx.fillRect(cx + h * 0.52, bottom - h * 0.82, h * 0.2, h * 0.08); break;
      case 'key':
        ctx.beginPath(); ctx.arc(cx - h * 0.6, bottom - h / 2, h / 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillRect(cx - h * 0.1, bottom - h * 0.65, h * 1.4, h * 0.3); ctx.strokeRect(cx - h * 0.1, bottom - h * 0.65, h * 1.4, h * 0.3); break;
      case 'log':
        ctx.fillRect(cx - h * 1.4, bottom - h, h * 2.8, h); ctx.strokeRect(cx - h * 1.4, bottom - h, h * 2.8, h);
        ctx.fillStyle = '#FCD34D'; ctx.beginPath(); ctx.ellipse(cx + h * 1.4, bottom - h / 2, h * 0.2, h / 2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); break;
      default:
        ctx.fillRect(cx - h / 2, bottom - h, h, h); ctx.strokeRect(cx - h / 2, bottom - h, h, h);
    }
  }

  function view() {
    const Kit = root.SimKit;
    const fmt = Kit.fmt;
    return {
      cls: 'sim-float',
      label: 'Sink or float tank',
      resetLabel: '↺ Take it out',
      controlDefaults: CONTROL_DEFAULTS,
      describe(state, p) {
        const o = objectAt(p);
        if (state.onBottom) return `Plop… the ${o.name} SINKS all the way to the bottom!`;
        if (state.settled) return `Bob, bob — the ${o.name} FLOATS! About ${fmt(100 * Math.min(1, Math.max(0, (p.depth - state.y) / o.h)), 0)}% of it is under water.`;
        if (state.wet) return `Splash! The ${o.name} is in the water…`;
        if (state.t > 0) return `Dropping the ${o.name}…`;
        return `Pick something, then press Run it to drop it in the water.`;
      },
      aria(state, p) {
        return `Water tank with a ${objectAt(p).name}.`;
      },
      draw(ctx, canvas, state, p) {
        const W = canvas.width, H = canvas.height;
        const px = 280;                                   // pixels per metre
        const floorY = H - 18, surfY = floorY - p.depth * px;
        const tx0 = 150, tx1 = W - 150;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#FFF8E7'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(56,189,248,0.55)'; ctx.fillRect(tx0, surfY, tx1 - tx0, floorY - surfY);
        const o = objectAt(p);
        drawObject(ctx, o, (tx0 + tx1) / 2, floorY - state.y * px, px);
        ctx.fillStyle = 'rgba(56,189,248,0.25)'; ctx.fillRect(tx0, surfY, tx1 - tx0, floorY - surfY);   // water over the object
        ctx.strokeStyle = '#0369A1'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(tx0, surfY); ctx.lineTo(tx1, surfY); ctx.stroke();
        ctx.strokeStyle = '#1F1F1F'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(tx0, surfY - 40); ctx.lineTo(tx0, floorY); ctx.lineTo(tx1, floorY); ctx.lineTo(tx1, surfY - 40); ctx.stroke();
        ctx.fillStyle = '#1F1F1F'; ctx.font = 'bold 14px sans-serif';
        ctx.fillText('water', tx1 + 10, surfY + 18);
        if (state.settled) ctx.fillText('FLOATS!', 30, surfY + 4);
        if (state.onBottom) ctx.fillText('SINKS!', 30, floorY - 10);
      }
    };
  }

  function mount(host, opts) {
    return root.SimKit.mountLab(host, model, opts, view());
  }

  return { model, OBJECTS, analytic: model.analytic, mount, CONTROL_DEFAULTS };
});
