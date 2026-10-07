/* X6 — Push & pull sim (ages 5–6): Einstein pushes or pulls a toy box along a flat floor.
 * Model (pure, deterministic, fixed dt via SimEngine):
 *   params: force (how hard, N), dir (+1 push = away from Einstein, −1 pull = toward him), mass (kg),
 *           mu (floor grip), pushTime (s the push lasts), g, wall (m from the start to each end of the mat).
 *   start:  it only moves if the push beats the floor's grip, force > mu·m·g (else "stays put").
 *   push:   a = dir·(force/m − mu·g) for pushTime seconds;  then coast: a = −mu·g until it stops.
 *   Each constant-acceleration piece is integrated exactly and the stop / end-of-mat moment is solved inside
 *   the step, so distance = ½a₁T² + (a₁T)²/(2·mu·g) (capped at the wall) to floating-point precision.
 *   Bigger push → farther; heavier box → less far for the same push.
 * View: SimKit.mountLab (canvas, slider + push/pull buttons, live readout, reduced-motion instant result). */
(function (root, factory) {
  const Engine = root.SimEngine || (typeof require === 'function' ? require('./engine.js') : null);
  const api = factory(Engine, root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SimPush = api;
})(typeof self !== 'undefined' ? self : this, function (Engine, root) {
  'use strict';
  const EPS = 1e-12;

  const model = {
    id: 'push',
    defaults: { force: 10, dir: 1, mass: 2, mu: 0.25, pushTime: 0.5, g: 9.8, wall: 5 },
    limits: { force: [0, 100], dir: [-1, 1], mass: [0.1, 100], mu: [0.05, 2], pushTime: [0.05, 5], g: [0.1, 50], wall: [0.5, 50] },

    sign(p) { return p.dir < 0 ? -1 : 1; },

    /** Floor grip a resting object can hold against (N): the push has to beat this to start. */
    grip(p) { return p.mu * p.mass * p.g; },

    init() {
      return { t: 0, x: 0, v: 0, moved: false, stuck: false, stopped: false, bonk: false, tStop: null, vMax: 0 };
    },

    step(s, p, dt) {
      if (!s.moved && s.t < EPS) {
        if (!(p.force > model.grip(p))) return { ...s, t: s.t + dt, stuck: true };
      }
      const dir = model.sign(p);
      const mug = p.mu * p.g;
      let { t, x, v, vMax } = s;
      let r = dt, stopped = false, bonk = false;
      while (r > EPS && !stopped) {
        const pushing = t < p.pushTime - EPS;
        const a = pushing ? dir * (p.force / p.mass - mug) : -dir * mug;   // motion is always along dir
        let seg = pushing ? Math.min(r, p.pushTime - t) : Math.min(r, Math.abs(v) / mug);
        const stopsHere = !pushing && seg >= Math.abs(v) / mug - EPS;
        // distance along dir (u), its speed and acceleration
        const u0 = dir * x, uv = dir * v, ua = dir * a;
        const u1 = u0 + uv * seg + 0.5 * ua * seg * seg;
        if (u1 >= p.wall) {
          const rem = p.wall - u0;
          const tau = rem <= 0 ? 0 : (2 * rem) / (uv + Math.sqrt(Math.max(0, uv * uv + 2 * ua * rem)));
          t += tau; x = dir * p.wall; v = 0; stopped = true; bonk = true;
          break;
        }
        x = dir * u1;
        v = stopsHere ? 0 : dir * (uv + ua * seg);
        t += seg; r -= seg;
        vMax = Math.max(vMax, Math.abs(v));
        if (stopsHere) stopped = true;
      }
      return { t, x, v, moved: true, stuck: false, stopped, bonk, tStop: stopped ? t : null, vMax };
    },

    done(s) {
      return s.stuck || s.stopped;
    },

    metrics(s, p) {
      const way = s.x > 1e-9 ? 'away' : s.x < -1e-9 ? 'closer' : 'still';
      return {
        moved: !!s.moved && !s.stuck,
        way,                         // 'away' (pushed off), 'closer' (pulled in), 'still'
        distance: Math.abs(s.x),     // metres from the start
        x: s.x,
        t: s.tStop,                  // seconds until it stops (null if it never moved)
        speed: s.vMax,               // top speed, m/s
        bonk: !!s.bonk,              // reached the end of the mat
        mass: p.mass,
        force: p.force,
        cheer: !!s.moved && !s.stuck
      };
    },

    /** Textbook answer (tests + hints). */
    analytic(params) {
      const p = Engine ? Engine.resolveParams(model, params) : params;
      const mug = p.mu * p.g;
      if (!(p.force > p.mu * p.mass * p.g)) return { moves: false, distance: 0, topSpeed: 0 };
      const a1 = p.force / p.mass - mug;
      const v1 = a1 * p.pushTime;
      const d = 0.5 * a1 * p.pushTime * p.pushTime + (v1 * v1) / (2 * mug);
      return { moves: true, distance: Math.min(d, p.wall), topSpeed: v1, bonk: d >= p.wall };
    }
  };

  if (Engine) Engine.register(model);

  /* ---------------- view (browser only) ---------------- */
  const CONTROL_DEFAULTS = {
    force: { label: 'How hard?', unit: '', min: 0, max: 30, step: 1, digits: 0 },
    mass: { label: 'Box weight', unit: ' kg', min: 1, max: 5, step: 1, digits: 0 },
    dir: { label: 'Push or pull?', min: -1, max: 1, step: 2,
      choices: [{ value: 1, label: '👉 Push', text: 'Push' }, { value: -1, label: '👈 Pull', text: 'Pull' }] }
  };

  function view() {
    const Kit = root.SimKit;
    const fmt = Kit.fmt;
    return {
      cls: 'sim-push',
      label: 'Push and pull lab',
      resetLabel: '↺ Back to start',
      controlDefaults: CONTROL_DEFAULTS,
      describe(state, p, ctl) {
        const what = p.mass >= 3 ? 'heavy box' : 'box';
        if (state.stuck) return `It won't budge! That push is too gentle to beat the floor's grip.`;
        if (state.stopped && state.bonk) return state.x < 0 ? `Whee! The ${what} slid all the way back to Einstein!` : `Bonk! The ${what} zoomed all the way to the wall (${fmt(p.wall, 0)} m)!`;
        if (state.stopped) return `${p.dir < 0 ? 'Pulled closer' : 'Pushed away'}: the ${what} went ${fmt(Math.abs(state.x), 2)} m and stopped (${fmt(state.tStop, 1)} s).`;
        if (state.moved) return `Sliding… ${fmt(Math.abs(state.x), 2)} m`;
        return ctl && ctl.has('dir') ? 'Ready! Pick push or pull, choose how hard, then press Run it.' : 'Ready! Choose how hard to push, then press Run it.';
      },
      aria(state, p) {
        return `${p.dir < 0 ? 'Pull' : 'Push'} strength ${fmt(p.force, 0)} on a ${fmt(p.mass, 0)} kilogram box.`;
      },
      draw(ctx, canvas, state, p) {
        const W = canvas.width, H = canvas.height;
        const floorY = H - 50;
        const x0 = 60, x1 = W - 30;                       // mat from −wall (Einstein) to +wall (wall)
        const scale = (x1 - x0) / (2 * p.wall);
        const X = (m) => x0 + (m + p.wall) * scale;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#FFF8E7'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#FDE68A'; ctx.fillRect(x0, floorY, x1 - x0, 14);
        ctx.fillStyle = '#A3E635'; ctx.fillRect(0, floorY + 14, W, H - floorY - 14);
        ctx.strokeStyle = '#1F1F1F'; ctx.lineWidth = 3;
        ctx.strokeRect(x0, floorY, x1 - x0, 14);
        // wall on the right
        ctx.fillStyle = '#F87171'; ctx.fillRect(x1, floorY - 90, 16, 104); ctx.strokeRect(x1, floorY - 90, 16, 104);
        // metre marks + flags at 1 m and 2 m (away side)
        ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = '#1F1F1F'; ctx.lineWidth = 2;
        for (let m = -Math.floor(p.wall); m <= Math.floor(p.wall); m++) {
          ctx.beginPath(); ctx.moveTo(X(m), floorY + 14); ctx.lineTo(X(m), floorY + 22); ctx.stroke();
          if (m) ctx.fillText(Math.abs(m) + ' m', X(m) - 10, floorY + 36);
        }
        ctx.fillStyle = 'rgba(34,197,94,0.25)'; ctx.fillRect(X(1), floorY - 70, X(2) - X(1), 70);
        [1, 2].forEach((m) => {
          ctx.beginPath(); ctx.moveTo(X(m), floorY); ctx.lineTo(X(m), floorY - 70); ctx.strokeStyle = '#1F1F1F'; ctx.stroke();
          ctx.fillStyle = m === 1 ? '#3B82F6' : '#EF4444';
          ctx.beginPath(); ctx.moveTo(X(m), floorY - 70); ctx.lineTo(X(m) + 18, floorY - 62); ctx.lineTo(X(m), floorY - 54); ctx.closePath(); ctx.fill(); ctx.stroke();
        });
        ctx.fillStyle = '#1F1F1F'; ctx.fillText('start', X(0) - 14, floorY + 36);
        // Einstein on the left (comic head: white hair, face, mustache)
        const ex = 32, ey = floorY - 60;
        ctx.fillStyle = '#F5F5F5'; ctx.beginPath(); ctx.arc(ex, ey - 6, 24, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#FCD9B6'; ctx.beginPath(); ctx.arc(ex, ey + 2, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#9CA3AF'; ctx.fillRect(ex - 9, ey + 6, 18, 5);
        ctx.fillStyle = '#7C3AED'; ctx.fillRect(ex - 14, ey + 18, 28, 42); ctx.strokeRect(ex - 14, ey + 18, 28, 42);
        // the box / cart (bigger and darker when heavier)
        const size = 26 + Math.min(26, p.mass * 5);
        const cx = X(state.x) - size / 2;
        ctx.fillStyle = p.mass >= 3 ? '#B45309' : '#F59E0B';
        ctx.fillRect(cx, floorY - size, size, size); ctx.lineWidth = 3; ctx.strokeRect(cx, floorY - size, size, size);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.fillText(fmt(p.mass, 0) + ' kg', cx + size / 2 - 14, floorY - size / 2 + 4);
        // force arrow while pushing / before the run
        const pushing = !state.stuck && state.t < p.pushTime;
        if (pushing && p.force > 0) {
          const len = 12 + p.force * 2.4, dir = p.dir < 0 ? -1 : 1;
          const ay = floorY - size - 16;
          const sx = dir > 0 ? cx - 6 - len : cx + size + 6 + len;
          const tx = dir > 0 ? cx - 6 : cx + size + 6;
          ctx.strokeStyle = dir > 0 ? '#2563EB' : '#DB2777'; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 6;
          ctx.beginPath(); ctx.moveTo(dir > 0 ? sx : tx, ay); ctx.lineTo(dir > 0 ? tx : sx, ay); ctx.stroke();
          const hx = dir > 0 ? tx : sx;
          ctx.beginPath(); ctx.moveTo(hx + 10 * dir, ay); ctx.lineTo(hx - 4 * dir, ay - 9); ctx.lineTo(hx - 4 * dir, ay + 9); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#1F1F1F'; ctx.font = 'bold 13px sans-serif';
          ctx.fillText(dir > 0 ? 'PUSH!' : 'PULL!', Math.min(sx, tx), ay - 12);
        }
        ctx.strokeStyle = '#1F1F1F';
      }
    };
  }

  function mount(host, opts) {
    return root.SimKit.mountLab(host, model, opts, view());
  }

  return { model, analytic: model.analytic, mount, CONTROL_DEFAULTS };
});
