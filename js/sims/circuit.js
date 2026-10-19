/* X12 — Series / parallel circuit sim (ages 9–10): battery + bulbs + switch (Ohm's-law level).
 * Model (pure, deterministic, fixed dt via SimEngine):
 *   params: mode (0=series, 1=parallel), voltage (V), bulbs (1–2), resistance (Ω per bulb), sw (0=open, 1=closed).
 *   Series: I = V/(n·R), each bulb sees V/n → dimmer when n=2.
 *   Parallel: I_total = n·V/R, each bulb sees full V → brighter.
 *   Switch open → no current, bulbs dark. Settles in one step (steady-state DC).
 * View: SimKit.mountLab (schematic-ish battery/bulbs/wires, live readout, reduced-motion instant). */
(function (root, factory) {
  const Engine = root.SimEngine || (typeof require === 'function' ? require('./engine.js') : null);
  const api = factory(Engine, root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SimCircuit = api;
})(typeof self !== 'undefined' ? self : this, function (Engine, root) {
  'use strict';

  function solve(p) {
    const n = Math.max(1, Math.round(p.bulbs));
    const R = p.resistance;
    const V = p.voltage;
    const closed = p.sw >= 0.5;
    if (!closed) {
      return { current: 0, brightness: 0, lit: false, mode: p.mode >= 0.5 ? 1 : 0, bulbs: n };
    }
    const series = p.mode < 0.5;
    let current, brightness;
    if (series) {
      current = V / (n * R);
      brightness = (V / n) / Math.max(V, 1e-9); // share the battery — 1 bulb = 1, 2 bulbs ≈ 0.5
    } else {
      current = (n * V) / R;
      brightness = 1; // each gets full V
    }
    // scale brightness a little with voltage so kids can dim/brighten with the battery
    const vScale = Math.min(1.25, Math.max(0.15, V / 6));
    brightness = Math.min(1, brightness * vScale);
    return { current, brightness, lit: brightness > 0.05, mode: series ? 0 : 1, bulbs: n };
  }

  const model = {
    id: 'circuit',
    defaults: { mode: 0, voltage: 6, bulbs: 2, resistance: 3, sw: 1 },
    limits: { mode: [0, 1], voltage: [1, 12], bulbs: [1, 2], resistance: [1, 10], sw: [0, 1] },

    init(p) {
      const r = solve(p);
      return { t: 0, settled: false, ...r };
    },

    step(s, p, dt) {
      const r = solve(p);
      return { t: s.t + dt, settled: true, ...r };
    },

    done(s) {
      return !!s.settled;
    },

    metrics(s) {
      return {
        current: s.current,
        brightness: s.brightness,
        lit: !!s.lit,
        mode: s.mode,
        cheer: true
      };
    },

    analytic(params) {
      const p = Engine ? Engine.resolveParams(model, params) : params;
      return solve(p);
    }
  };

  if (Engine) Engine.register(model);

  const CONTROL_DEFAULTS = {
    mode: { label: 'Wiring', min: 0, max: 1, step: 1,
      choices: [
        { value: 0, label: '🔗 Series', text: 'Series' },
        { value: 1, label: '⑂ Parallel', text: 'Parallel' }
      ] },
    voltage: { label: 'Battery', unit: ' V', min: 1, max: 12, step: 1, digits: 0 },
    bulbs: { label: 'Bulbs', min: 1, max: 2, step: 1, digits: 0,
      choices: [
        { value: 1, label: '💡 1 bulb', text: '1 bulb' },
        { value: 2, label: '💡💡 2 bulbs', text: '2 bulbs' }
      ] },
    resistance: { label: 'Bulb resistance', unit: ' Ω', min: 1, max: 10, step: 1, digits: 0 },
    sw: { label: 'Switch', min: 0, max: 1, step: 1,
      choices: [
        { value: 0, label: '⭕ Open', text: 'Open' },
        { value: 1, label: '✅ Closed', text: 'Closed' }
      ] }
  };

  function view() {
    const Kit = root.SimKit;
    const fmt = Kit.fmt;
    return {
      cls: 'sim-circuit',
      label: 'Series and parallel circuit lab',
      resetLabel: '↺ Reset circuit',
      controlDefaults: CONTROL_DEFAULTS,
      describe(state, p) {
        const kind = p.mode < 0.5 ? 'series' : 'parallel';
        if (p.sw < 0.5) return `Switch is OPEN — no current. Flip it closed to light the ${kind} circuit!`;
        if (state.settled || state.t > 0) {
          return `${kind[0].toUpperCase()}${kind.slice(1)}: current ${fmt(state.current, 2)} A · brightness ${fmt(100 * state.brightness, 0)}%.`;
        }
        return `Pick series or parallel, set the battery, then press Run it.`;
      },
      aria(state, p) {
        return `${p.mode < 0.5 ? 'Series' : 'Parallel'} circuit, ${fmt(p.voltage, 0)} volt battery, ${Math.round(p.bulbs)} bulbs.`;
      },
      draw(ctx, canvas, state, p) {
        const W = canvas.width, H = canvas.height;
        const n = Math.max(1, Math.round(p.bulbs));
        const series = p.mode < 0.5;
        const on = p.sw >= 0.5 && state.lit;
        const glow = on ? state.brightness : 0;
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#FFF8E7'; ctx.fillRect(0, 0, W, H);

        // battery
        const bx = 50, by = H / 2;
        ctx.fillStyle = '#1F1F1F';
        ctx.fillRect(bx, by - 28, 14, 56);
        ctx.fillRect(bx + 18, by - 18, 8, 36);
        ctx.fillStyle = '#EF4444'; ctx.fillRect(bx - 6, by - 8, 6, 16);
        ctx.fillStyle = '#1F1F1F'; ctx.font = 'bold 12px sans-serif';
        ctx.fillText(fmt(p.voltage, 0) + ' V', bx - 4, by + 48);

        // switch
        const sx = 120, sy = by - 60;
        ctx.strokeStyle = '#1F1F1F'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(sx + 40, sy, 6, 0, Math.PI * 2); ctx.stroke();
        if (p.sw >= 0.5) {
          ctx.beginPath(); ctx.moveTo(sx + 6, sy); ctx.lineTo(sx + 34, sy); ctx.stroke();
        } else {
          ctx.beginPath(); ctx.moveTo(sx + 6, sy); ctx.lineTo(sx + 30, sy - 18); ctx.stroke();
        }
        ctx.fillStyle = '#1F1F1F'; ctx.font = '11px sans-serif';
        ctx.fillText(p.sw >= 0.5 ? 'ON' : 'OFF', sx + 8, sy - 24);

        // wires + bulbs
        const bulbXs = n === 1 ? [W / 2] : [W / 2 - 70, W / 2 + 70];
        const bulbY = series ? by : by - 30;
        ctx.strokeStyle = on ? '#F59E0B' : '#94A3B8'; ctx.lineWidth = 4;
        // top rail from battery+ through switch
        ctx.beginPath();
        ctx.moveTo(bx + 26, by - 18);
        ctx.lineTo(sx, by - 18);
        ctx.lineTo(sx, sy);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(sx + 40, sy);
        ctx.lineTo(sx + 40, by - 18);
        ctx.lineTo(bulbXs[bulbXs.length - 1] + (series ? 0 : 80), by - 18);
        ctx.stroke();

        if (series) {
          // one path through bulbs in a row
          ctx.beginPath();
          ctx.moveTo(bx + 26, by + 18);
          ctx.lineTo(bulbXs[0] - 40, by + 18);
          ctx.lineTo(bulbXs[0] - 40, bulbY);
          ctx.stroke();
          for (let i = 0; i < n; i++) {
            const x = bulbXs[i];
            if (i > 0) {
              ctx.beginPath();
              ctx.moveTo(bulbXs[i - 1] + 22, bulbY);
              ctx.lineTo(x - 22, bulbY);
              ctx.stroke();
            }
          }
          ctx.beginPath();
          ctx.moveTo(bulbXs[n - 1] + 22, bulbY);
          ctx.lineTo(bulbXs[n - 1] + 70, bulbY);
          ctx.lineTo(bulbXs[n - 1] + 70, by - 18);
          ctx.stroke();
        } else {
          // parallel branches
          ctx.beginPath();
          ctx.moveTo(bx + 26, by + 18);
          ctx.lineTo(W / 2, by + 18);
          ctx.stroke();
          for (let i = 0; i < n; i++) {
            const x = bulbXs[i];
            ctx.beginPath();
            ctx.moveTo(x, by - 18);
            ctx.lineTo(x, bulbY - 22);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x, bulbY + 22);
            ctx.lineTo(x, by + 18);
            ctx.stroke();
          }
        }

        // draw bulbs
        bulbXs.slice(0, n).forEach((x) => {
          const y = bulbY;
          if (glow > 0) {
            ctx.fillStyle = `rgba(250, 204, 21, ${0.25 + 0.55 * glow})`;
            ctx.beginPath(); ctx.arc(x, y, 28 + 10 * glow, 0, Math.PI * 2); ctx.fill();
          }
          ctx.fillStyle = on ? `rgb(250, ${180 + Math.round(40 * glow)}, 50)` : '#CBD5E1';
          ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#1F1F1F'; ctx.lineWidth = 3; ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x - 8, y - 6); ctx.lineTo(x + 8, y + 6);
          ctx.moveTo(x + 8, y - 6); ctx.lineTo(x - 8, y + 6);
          ctx.stroke();
        });

        ctx.fillStyle = '#1F1F1F'; ctx.font = 'bold 14px sans-serif';
        ctx.fillText(series ? 'SERIES' : 'PARALLEL', W - 110, 28);
        if (state.settled || state.t > 0) {
          ctx.font = '12px sans-serif';
          ctx.fillText('I = ' + fmt(state.current, 2) + ' A', W - 110, 48);
        }
      }
    };
  }

  function mount(host, opts) {
    return root.SimKit.mountLab(host, model, opts, view());
  }

  return { model, analytic: model.analytic, solve, mount, CONTROL_DEFAULTS };
});
