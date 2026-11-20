/* The River of Data — Hand-Drawn Sketchbook World Canvas + Beat-1 Interactive Motion Koan Stage
 * Aesthetic: Warm sketchbook paper (#F4EEDF), graphite & sepia ink (#3A3631 / #6B4F3A),
 * selective color ONLY where meaningful (river slate-blue #4A6B82, saffron #E8892F, sage #6B8E63, earth #9A8C74).
 */
const ZenWorld = {
  _riverCanvas: null,
  _riverCtx: null,
  _koanCanvas: null,
  _koanCtx: null,
  _raf: null,
  _mastered: {},
  _ripples: [],
  _crates: [],
  _lastTs: 0,
  _spawnAcc: 0,

  /* Active Motion Koan state */
  _koanChapter: 1,
  _koanProgress: 0, // 0..1
  _koanScene: 'stream',

  setMastered(map) {
    this._mastered = { ...(map || {}) };
  },

  setKoanState(chNum, progress, scene) {
    this._koanChapter = chNum;
    this._koanProgress = Math.max(0, Math.min(1, progress));
    this._koanScene = scene || 'stream';
  },

  ripple(xFrac = 0.5) {
    this._ripples.push({ xFrac, r: 6, life: 1.0 });
  },

  mount(riverCanvas, koanCanvas) {
    this._riverCanvas = riverCanvas;
    this._riverCtx = riverCanvas ? riverCanvas.getContext('2d') : null;
    this._koanCanvas = koanCanvas;
    this._koanCtx = koanCanvas ? koanCanvas.getContext('2d') : null;
    if (this._raf) cancelAnimationFrame(this._raf);
    this._lastTs = performance.now();

    const loop = (now) => {
      const dt = Math.min(0.05, (now - this._lastTs) / 1000);
      this._lastTs = now;
      this._tickRiver(dt);
      if (this._riverCanvas && this._riverCanvas.offsetParent !== null) this._drawRiver(now);
      if (this._koanCanvas && this._koanCanvas.offsetParent !== null) this._drawKoan(now);
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  },

  _setupHiDPI(canvas, ctx) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || 760;
    const h = canvas.clientHeight || 180;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.save();
    ctx.scale(dpr, dpr);
    return { w, h };
  },

  _palette() {
    const dark = document.documentElement.classList.contains('dark');
    return {
      dark,
      paper: dark ? '#181422' : '#F4EEDF',
      ink: dark ? '#E8DFD0' : '#3A3631',
      sepia: dark ? '#B8A590' : '#6B4F3A',
      water: dark ? '#3B566E' : '#8DA3B8',
      waterDeep: dark ? '#26394B' : '#4A6B82',
      saffron: '#E8892F',
      torch: '#D9772B',
      sage: dark ? '#7E9C74' : '#7C8A5E',
      earth: dark ? '#8A7C67' : '#9A8C74',
      warn: '#D9534F'
    };
  },

  /* ============================================================
     LIVING RIVER WORLD (Top Panorama — heals with each chapter!)
  ============================================================ */
  _tickRiver(dt) {
    const hasAqueduct = !!this._mastered['ch4-aqueduct'];
    const hasSluice = !!this._mastered['ch2-sluice'];
    const hasShape = !!this._mastered['ch3-shape'];
    this._spawnAcc += dt * (hasAqueduct ? 2.4 : 0.9);
    while (this._spawnAcc >= 1) {
      this._spawnAcc -= 1;
      const r = Math.random();
      const kind = r < 0.16 ? 'dirty' : (r < 0.30 ? 'orphan' : 'clean');
      this._crates.push({ u: -0.02, kind, yOff: (Math.random() - 0.5) * 14, diverted: false, alpha: 1 });
    }
    const spd = hasAqueduct ? 0.24 : 0.11;
    for (let i = this._crates.length - 1; i >= 0; i--) {
      const c = this._crates[i];
      if (c.diverted) {
        c.yOff += dt * 36;
        c.alpha -= dt * 1.4;
        if (c.alpha <= 0) this._crates.splice(i, 1);
        continue;
      }
      c.u += dt * spd;
      if (c.kind === 'dirty' && Math.abs(c.u - 0.27) < 0.02 && hasSluice) {
        c.diverted = true;
      }
      if (c.kind === 'orphan' && Math.abs(c.u - 0.43) < 0.02) {
        if (hasShape) c.kind = 'rescued';
        else c.diverted = true;
      }
      if (c.u > 1.04) this._crates.splice(i, 1);
    }
    for (let i = this._ripples.length - 1; i >= 0; i--) {
      const rp = this._ripples[i];
      rp.r += dt * 95;
      rp.life -= dt * 0.85;
      if (rp.life <= 0) this._ripples.splice(i, 1);
    }
  },

  _riverY(u, h) {
    return h * 0.62 + Math.sin(u * Math.PI * 2.1) * (h * 0.09);
  },

  _drawRiver(now) {
    const g = this._riverCtx;
    const { w, h } = this._setupHiDPI(this._riverCanvas, g);
    const P = this._palette();

    const m1 = !!this._mastered['ch1-stillness'];
    const m2 = !!this._mastered['ch2-sluice'];
    const m3 = !!this._mastered['ch3-shape'];
    const m4 = !!this._mastered['ch4-aqueduct'];
    const m5 = !!this._mastered['ch5-dialects'];
    const m6 = !!this._mastered['ch6-depth'];
    const m7 = !!this._mastered['ch7-mirror'];

    // Warm paper backdrop
    g.fillStyle = P.paper;
    g.fillRect(0, 0, w, h);

    // Distant Sahyadri sketchbook hills (gentle graphite silhouette)
    g.beginPath();
    g.moveTo(0, h * 0.42);
    g.quadraticCurveTo(w * 0.16, h * 0.18, w * 0.34, h * 0.36);
    g.quadraticCurveTo(w * 0.56, h * 0.16, w * 0.78, h * 0.34);
    g.quadraticCurveTo(w * 0.90, h * 0.24, w, h * 0.36);
    g.lineTo(w, h); g.lineTo(0, h); g.closePath();
    g.fillStyle = m1 ? (P.dark ? 'rgba(124,138,94,0.14)' : 'rgba(124,138,94,0.12)') : (P.dark ? 'rgba(154,140,116,0.08)' : 'rgba(154,140,116,0.10)');
    g.fill();
    g.strokeStyle = P.sepia;
    g.globalAlpha = 0.35;
    g.lineWidth = 1.2;
    g.stroke();
    g.globalAlpha = 1;

    // Flowing River Ribbon
    const riverW = m4 ? 36 : 22;
    g.beginPath();
    for (let i = 0; i <= 40; i++) {
      const u = i / 40;
      const x = u * w, y = this._riverY(u, h);
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.strokeStyle = m1 ? P.water : P.earth;
    g.globalAlpha = m1 ? 0.55 : 0.40;
    g.lineWidth = riverW;
    g.lineCap = 'round';
    g.stroke();
    g.globalAlpha = 1;

    // Gentle ink wave strokes along river
    g.beginPath();
    for (let i = 0; i <= 40; i++) {
      const u = i / 40;
      const x = u * w, y = this._riverY(u, h);
      if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.strokeStyle = P.waterDeep;
    g.lineWidth = 1.5;
    g.setLineDash([12, 16]);
    g.lineDashOffset = -(now * (m4 ? 0.05 : 0.02));
    g.stroke();
    g.setLineDash([]);

    // Landmark 1 (Ch II): Bamboo Sluice Gate at x = 0.27
    const sx = w * 0.27, sy = this._riverY(0.27, h);
    if (m2) {
      g.strokeStyle = P.ink;
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(sx - 8, sy - 24); g.lineTo(sx - 8, sy + 20);
      g.moveTo(sx + 8, sy - 24); g.lineTo(sx + 8, sy + 20);
      g.moveTo(sx - 12, sy - 16); g.lineTo(sx + 12, sy - 16);
      g.stroke();
      this._label(g, sx, sy - 30, 'Sluice Gate', P);
    }

    // Landmark 2 (Ch III): Fact & Dimension Storehouses + (-1) Basket at x = 0.43
    const hx = w * 0.43, hy = this._riverY(0.43, h);
    if (m3) {
      g.fillStyle = P.paper; g.strokeStyle = P.ink; g.lineWidth = 1.8;
      g.fillRect(hx - 16, hy - 34, 15, 16); g.strokeRect(hx - 16, hy - 34, 15, 16);
      g.fillRect(hx + 2, hy - 30, 14, 12); g.strokeRect(hx + 2, hy - 30, 14, 12);
      // Roofs
      g.beginPath();
      g.moveTo(hx - 19, hy - 34); g.lineTo(hx - 8.5, hy - 43); g.lineTo(hx + 2, hy - 34);
      g.moveTo(hx, hy - 30); g.lineTo(hx + 9, hy - 37); g.lineTo(hx + 18, hy - 30);
      g.stroke();
      this._label(g, hx, hy - 48, 'Star Houses · (-1)', P);
    }

    // Landmark 3 (Ch IV): Stone Aqueduct Arches at x = 0.59
    const ax = w * 0.59, ay = this._riverY(0.59, h);
    if (m4) {
      g.strokeStyle = P.ink; g.fillStyle = P.earth; g.lineWidth = 1.8;
      for (let k = -1; k <= 1; k++) {
        const bx = ax + k * 18;
        g.beginPath();
        g.arc(bx, ay + 12, 8, Math.PI, 0);
        g.stroke();
      }
      g.beginPath(); g.moveTo(ax - 28, ay - 2); g.lineTo(ax + 28, ay - 2); g.stroke();
      this._label(g, ax, ay - 16, 'COPY Aqueduct', P);
    }

    // Landmark 4 (Ch V): Twin Dialect Archways at x = 0.72
    const dx = w * 0.72, dy = this._riverY(0.72, h);
    if (m5) {
      g.strokeStyle = P.sepia; g.lineWidth = 2;
      g.beginPath();
      g.arc(dx - 7, dy - 10, 9, Math.PI, 0);
      g.arc(dx + 7, dy - 10, 9, Math.PI, 0);
      g.stroke();
      this._label(g, dx, dy - 26, 'T-SQL ↔ PG', P);
    }

    // Landmark 5 (Ch VI): Tidal Partition Locks at x = 0.83
    const px = w * 0.83, py = this._riverY(0.83, h);
    if (m6) {
      for (let k = 0; k < 5; k++) {
        g.fillStyle = k === 2 ? P.saffron : P.paper;
        g.strokeStyle = P.ink; g.lineWidth = 1.4;
        g.fillRect(px - 20 + k * 8, py - 24, 6, 16);
        g.strokeRect(px - 20 + k * 8, py - 24, 6, 16);
      }
      this._label(g, px, py - 30, '72 Locks', P);
    }

    // Landmark 6 (Ch VII): Harbour Watchtower & Saffron Lantern at x = 0.93
    const lx = w * 0.93, ly = this._riverY(0.93, h);
    g.strokeStyle = P.ink; g.fillStyle = P.paper; g.lineWidth = 1.8;
    g.fillRect(lx - 8, ly - 40, 16, 36); g.strokeRect(lx - 8, ly - 40, 16, 36);
    g.beginPath(); g.moveTo(lx - 11, ly - 40); g.lineTo(lx, ly - 52); g.lineTo(lx + 11, ly - 40); g.closePath(); g.stroke();
    if (m7) {
      // Glowing saffron lantern!
      const grd = g.createRadialGradient(lx, ly - 44, 2, lx, ly - 44, 26);
      grd.addColorStop(0, 'rgba(232,137,47,0.85)');
      grd.addColorStop(1, 'rgba(232,137,47,0)');
      g.fillStyle = grd;
      g.beginPath(); g.arc(lx, ly - 44, 26, 0, Math.PI * 2); g.fill();
      g.fillStyle = P.saffron;
      g.beginPath(); g.arc(lx, ly - 44, 4.5, 0, Math.PI * 2); g.fill();
    }

    // Draw flowing wooden data crates
    for (const c of this._crates) {
      const x = c.u * w;
      const y = this._riverY(Math.max(0, Math.min(1, c.u)), h) + c.yOff;
      g.globalAlpha = Math.max(0, c.alpha);
      g.fillStyle = c.kind === 'dirty' ? P.torch : (c.kind === 'orphan' ? '#9B7EDE' : (c.kind === 'rescued' ? P.sage : P.paper));
      g.strokeStyle = P.ink;
      g.lineWidth = 1.4;
      g.fillRect(x - 4.5, y - 4.5, 9, 9);
      g.strokeRect(x - 4.5, y - 4.5, 9, 9);
      g.globalAlpha = 1;
    }

    // Celebratory ripples
    for (const rp of this._ripples) {
      g.strokeStyle = P.saffron;
      g.globalAlpha = Math.max(0, rp.life);
      g.lineWidth = 2.5;
      g.beginPath();
      g.arc(rp.xFrac * w, this._riverY(rp.xFrac, h), rp.r, 0, Math.PI * 2);
      g.stroke();
      g.globalAlpha = 1;
    }

    g.restore();
  },

  _label(g, x, y, txt, P) {
    g.fillStyle = P.sepia;
    g.font = '600 10px "DM Sans", sans-serif';
    g.textAlign = 'center';
    g.fillText(txt, x, y);
  },

  /* ============================================================
     BEAT 1: SYNCHRONIZED MOTION KOAN SKETCHBOOK STAGE
  ============================================================ */
  _drawKoan(now) {
    const g = this._koanCtx;
    const { w, h } = this._setupHiDPI(this._koanCanvas, g);
    const P = this._palette();
    const p = this._koanProgress; // 0..1 synced to Orion audio
    const ch = this._koanChapter;

    g.fillStyle = P.paper;
    g.fillRect(0, 0, w, h);

    // Subtle sketchbook frame border
    g.strokeStyle = P.sepia;
    g.globalAlpha = 0.28;
    g.lineWidth = 1.5;
    g.strokeRect(10, 10, w - 20, h - 20);
    g.globalAlpha = 1;

    const cx = w / 2, cy = h / 2;
    const sway = Math.sin(now * 0.002) * 3;

    g.strokeStyle = P.ink;
    g.fillStyle = P.ink;
    g.lineWidth = 2;
    g.textAlign = 'center';

    if (ch === 1) {
      // Stillness: Two duplicate crates A-9042 causing a glowing fan-out mirror
      this._sketchBox(g, cx - 150, cy - 26, 110, 52, 'SKU: A-9042', p > 0.15 ? P.saffron : null, P);
      if (p > 0.28) this._sketchBox(g, cx - 150, cy + 36, 110, 44, 'SKU: A-9042 (dup)', P.torch, P);
      if (p > 0.50) {
        g.beginPath(); g.moveTo(cx - 35, cy); g.lineTo(cx + 35, cy - 22); g.moveTo(cx - 35, cy); g.lineTo(cx + 35, cy + 28); g.stroke();
        this._sketchBox(g, cx + 45, cy - 48, 130, 42, 'Sale × 2 = +$18.4K', p > 0.75 ? P.sage : P.warn, P);
        this._sketchBox(g, cx + 45, cy + 6, 130, 42, 'HAVING COUNT > 1', P.water, P);
      }
    } else if (ch === 2) {
      // Sluice Gate: Muddy CSV crates entering bamboo filter -> Clean vs Quarantine
      this._sketchBox(g, cx - 210, cy - 22 + sway, 105, 44, 'Latin-1 CSV', P.torch, P);
      this._sketchBox(g, cx - 210, cy + 32, 105, 44, 'SKU "00421"', P.water, P);
      if (p > 0.35) {
        g.strokeStyle = P.sage; g.lineWidth = 3;
        g.beginPath(); g.moveTo(cx - 40, 32); g.lineTo(cx - 40, h - 32); g.stroke();
        g.strokeStyle = P.ink; g.lineWidth = 2;
        this._label(g, cx - 40, 26, 'Python Sluice Gate', P);
      }
      if (p > 0.60) {
        this._sketchBox(g, cx + 45, cy - 46, 145, 44, 'Clean UTF-8 + str', P.sage, P);
        this._sketchBox(g, cx + 45, cy + 16, 145, 44, 'Quarantine Cove', P.saffron, P);
      }
    } else if (ch === 3) {
      // Shape: Facts + Dimensions + Unknown (-1) Basket
      this._sketchBox(g, cx - 190, cy - 26, 120, 52, 'FactSales\n(Z-9999 · $75)', P.water, P);
      this._sketchBox(g, cx + 70, cy - 58, 125, 46, 'DimProduct\n(Known SKUs)', P.earth, P);
      if (p > 0.45) {
        this._sketchBox(g, cx + 70, cy + 12 + sway * 0.5, 125, 50, 'Basket (-1)\nUnknown SKU', P.saffron, P);
        g.strokeStyle = P.saffron; g.lineWidth = 2.2;
        g.beginPath(); g.moveTo(cx - 66, cy + 4); g.quadraticCurveTo(cx, cy + 35, cx + 66, cy + 35); g.stroke();
      }
    } else if (ch === 4) {
      // Aqueduct: Teacup (14h) vs COPY Aqueduct (2.5h) + Idempotent wheel
      const fast = p > 0.42;
      this._sketchBox(g, cx - 200, cy - 26, 120, 52, fast ? 'COPY Stream\n85,000 rows/s' : 'Row INSERT\n1,000 rows/s', fast ? P.sage : P.torch, P);
      // Flow lines
      g.strokeStyle = fast ? P.waterDeep : P.earth;
      g.lineWidth = fast ? 6 : 2;
      g.setLineDash([10, 8]);
      g.lineDashOffset = -(now * (fast ? 0.14 : 0.03));
      g.beginPath(); g.moveTo(cx - 75, cy); g.lineTo(cx + 65, cy); g.stroke();
      g.setLineDash([]);
      this._sketchBox(g, cx + 70, cy - 26, 135, 52, p > 0.7 ? 'ON CONFLICT\nRetry-Safe ✓' : 'Target Table\n50M Rows', p > 0.7 ? P.saffron : P.water, P);
    } else if (ch === 5) {
      // Two Tongues: T-SQL & PostgreSQL arches uniting
      this._sketchBox(g, cx - 195, cy - 34, 140, 64, 'SQL Server\nTOP · ISNULL', P.water, P);
      this._sketchBox(g, cx + 55, cy - 34, 140, 64, 'PostgreSQL\nLIMIT · COALESCE', P.saffron, P);
      g.beginPath(); g.arc(cx, cy - 34, 52, Math.PI, 0); g.stroke();
      this._label(g, cx, cy + 54, p > 0.55 ? 'Watch casing & MVCC — One Relational Truth' : 'Two Dialects, One Grammar', P);
    } else if (ch === 6) {
      // Effortless Speed: 12 monthly drawers, 11 pruned, March glows saffron
      const cols = 12;
      const bw = Math.min(44, (w - 90) / cols);
      const startX = cx - (cols * (bw + 4)) / 2;
      for (let i = 0; i < cols; i++) {
        const isMar = i === 2;
        const pruned = p > 0.45 && !isMar;
        g.globalAlpha = pruned ? 0.22 : 1;
        g.fillStyle = isMar && p > 0.45 ? P.saffron : P.paper;
        g.strokeStyle = P.ink;
        g.lineWidth = isMar ? 2.4 : 1.3;
        g.fillRect(startX + i * (bw + 4), cy - 34, bw, 68);
        g.strokeRect(startX + i * (bw + 4), cy - 34, bw, 68);
        g.fillStyle = P.ink;
        g.font = '600 10px "JetBrains Mono", monospace';
        g.fillText(`M${String(i + 1).padStart(2, '0')}`, startX + i * (bw + 4) + bw / 2, cy + 4);
      }
      g.globalAlpha = 1;
      this._label(g, cx, cy + 56, p > 0.45 ? 'Sargable Range: 11 Drawers Skipped → 1.4s' : 'Unpartitioned Scan: Reading All Months → 21.4s', P);
    } else {
      // Chapter 7: Still Mirror & Saffron Harbour Lantern
      this._sketchBox(g, cx - 195, cy - 26, 125, 52, 'CTE: Legacy Sum\n$169.98', P.earth, P);
      this._sketchBox(g, cx + 70, cy - 26, 125, 52, 'CTE: DW Sum\n$169.98', P.water, P);
      if (p > 0.55) {
        const grd = g.createRadialGradient(cx, cy, 3, cx, cy, 34);
        grd.addColorStop(0, 'rgba(232,137,47,0.85)');
        grd.addColorStop(1, 'rgba(232,137,47,0)');
        g.fillStyle = grd;
        g.beginPath(); g.arc(cx, cy, 34, 0, Math.PI * 2); g.fill();
        g.fillStyle = P.saffron;
        g.beginPath(); g.arc(cx, cy, 8, 0, Math.PI * 2); g.fill();
        this._label(g, cx, cy + 48, 'Variance = 0.00 · Harbour Lantern Lit', P);
      }
    }
    g.restore();
  },

  _sketchBox(g, x, y, w, h, text, wash, P) {
    g.fillStyle = wash || P.paper;
    g.globalAlpha = wash ? 0.28 : 1;
    g.fillRect(x, y, w, h);
    g.globalAlpha = 1;
    g.strokeStyle = P.ink;
    g.lineWidth = 1.8;
    g.strokeRect(x, y, w, h);
    g.fillStyle = P.ink;
    g.font = '600 11.5px "DM Sans", sans-serif';
    const lines = String(text).split('\n');
    lines.forEach((ln, idx) => {
      g.fillText(ln, x + w / 2, y + h / 2 + (idx - (lines.length - 1) / 2) * 15 + 4);
    });
  }
};

if (typeof window !== 'undefined') window.ZenWorld = ZenWorld;
