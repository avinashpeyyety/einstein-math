/* X12 — Speed race sim (ages 9–10): kid sets distance and time; speed = distance ÷ time.
 * Model (pure, deterministic, fixed dt via SimEngine):
 *   params: distance (m), time (s) — the race length and how long the runner takes.
 *   Constant speed v = distance/time. Marker moves from 0 → distance over `time` seconds.
 *   Bigger distance or smaller time → higher speed. Metrics: speed, distance, time.
 * View: SimKit.mountLab (track + moving marker, sliders, live readout, reduced-motion instant). */
(function (root, factory) {
  const Engine = root.SimEngine || (typeof require === 'function' ? require('./engine.js') : null);
  const api = factory(Engine, root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SimSpeed = api;
})(typeof self !== 'undefined' ? self : this, function (Engine, root) {
  'use strict';
  const EPS = 1e-12;

  const model = {
    id: 'speed',
    defaults: { distance: 100, time: 10 },
    limits: { distance: [10, 500], time: [1, 60] },

    init() {
      return { t: 0, x: 0, finished: false };
    },

    step(s, p, dt) {
      const v = p.distance / p.time;
      let t = s.t + dt;
      let x = v * t;
      if (t >= p.time - EPS) {
        return { t: p.time, x: p.distance, finished: true };
      }
      return { t, x, finished: false };
    },

    done(s) {
      return !!s.finished;
    },

    metrics(s, p) {
      const speed = p.distance / p.time;
      return {
        speed,
        distance: p.distance,
        time: p.time,
        cheer: true
      };
    },

    analytic(params) {
      const p = Engine ? Engine.resolveParams(model, params) : params;
      return { speed: p.distance / p.time, distance: p.distance, time: p.time };
    }
  };

  if (Engine) Engine.register(model);

  const CONTROL_DEFAULTS = {
    distance: { label: 'Distance', unit: ' m', min: 10, max: 500, step: 10, digits: 0 },
    time: { label: 'Time', unit: ' s', min: 1, max: 60, step: 1, digits: 0 }
  };

  function view() {
    const Kit = root.SimKit;
    const fmt = Kit.fmt;
    return {
      cls: 'sim-speed',
      label: 'Speed race track',
      resetLabel: '↺ Back to start',
      controlDefaults: CONTROL_DEFAULTS,
      describe(state, p) {
        const v = p.distance / p.time;
        if (state.finished) {
          return `Finished! ${fmt(p.distance, 0)} m in ${fmt(p.time, 0)} s → speed ${fmt(v, 1)} m/s.`;
        }
        if (state.t > 0) {
          return `Racing… ${fmt(state.x, 0)} m · ${fmt(v, 1)} m/s`;
        }
        return `Set distance and time, then press Run it. Speed = distance ÷ time.`;
      },
      aria(state, p) {
        return `Race track ${fmt(p.distance, 0)} metres in ${fmt(p.time, 0)} seconds, speed ${fmt(p.distance / p.time, 1)} metres per second.`;
      },
      draw(ctx, canvas, state, p) {
        const W = canvas.width, H = canvas.height;
        const trackY = H / 2 + 10;
        const x0 = 40, x1 = W - 40;
        const X = (m) => x0 + (m / p.distance) * (x1 - x0);
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#FFF8E7'; ctx.fillRect(0, 0, W, H);
        // track
        ctx.fillStyle = '#94A3B8'; ctx.fillRect(x0, trackY - 18, x1 - x0, 36);
        ctx.strokeStyle = '#1F1F1F'; ctx.lineWidth = 3;
        ctx.strokeRect(x0, trackY - 18, x1 - x0, 36);
        // lane dashes
        ctx.strokeStyle = '#F8FAFC'; ctx.lineWidth = 2; ctx.setLineDash([10, 8]);
        ctx.beginPath(); ctx.moveTo(x0 + 4, trackY); ctx.lineTo(x1 - 4, trackY); ctx.stroke();
        ctx.setLineDash([]);
        // start / finish flags
        ctx.fillStyle = '#22C55E';
        ctx.fillRect(x0 - 4, trackY - 70, 8, 52);
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(x1 - 4, trackY - 70, 8, 52);
        ctx.fillStyle = '#1F1F1F'; ctx.font = 'bold 12px sans-serif';
        ctx.fillText('START', x0 - 8, trackY - 76);
        ctx.fillText('FINISH', x1 - 28, trackY - 76);
        // metre labels
        ctx.font = '11px sans-serif';
        const marks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * p.distance);
        marks.forEach((m) => {
          const px = X(m);
          ctx.beginPath(); ctx.moveTo(px, trackY + 18); ctx.lineTo(px, trackY + 26); ctx.strokeStyle = '#1F1F1F'; ctx.lineWidth = 2; ctx.stroke();
          ctx.fillStyle = '#1F1F1F'; ctx.fillText(Math.round(m) + ' m', px - 10, trackY + 40);
        });
        // runner
        const rx = X(state.x);
        ctx.fillStyle = '#7C3AED';
        ctx.beginPath(); ctx.arc(rx, trackY - 28, 14, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#1F1F1F'; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = '#FCD9B6';
        ctx.beginPath(); ctx.arc(rx, trackY - 42, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        // speed badge
        const v = p.distance / p.time;
        ctx.fillStyle = '#1F1F1F'; ctx.font = 'bold 14px sans-serif';
        ctx.fillText(fmt(v, 1) + ' m/s', rx - 22, trackY - 58);
      }
    };
  }

  function mount(host, opts) {
    return root.SimKit.mountLab(host, model, opts, view());
  }

  return { model, analytic: model.analytic, mount, CONTROL_DEFAULTS };
});
