/* Data Lab — Calm Sketchbook Live Pipeline Panorama + Step-1 Synced Visual Diagrams
 * Spirit: Effortless clarity, generous breathing room, warm paper (#F4EEDF), sepia ink (#3A3631 / #6B4F3A),
 * selective functional color (slate blue #4A6B82, saffron #E8892F, sage #5E7D54, warn #C25E3E).
 */
const ZenWorld = {
  _riverCanvas: null,
  _riverCtx: null,
  _koanCanvas: null,
  _koanCtx: null,
  _raf: null,
  _mastered: {},
  _activeChapter: 1,
  _ripples: [],
  _packets: [],
  _lastTs: 0,
  _spawnAcc: 0,

  /* Active Step-1 Visual Diagram state */
  _koanChapter: 1,
  _koanProgress: 0,
  _koanScene: 'table',

  STAGES: [
    { id: 'l1-filter',     label: 'Filter' },
    { id: 'l2-groupby',    label: 'Group' },
    { id: 'l3-dupes',      label: 'Quality' },
    { id: 'l4-python',     label: 'Python' },
    { id: 'l5-leftjoin',   label: 'Joins' },
    { id: 'l6-bulkload',   label: 'Bulk Load' },
    { id: 'l7-dialects',   label: 'Dialects' },
    { id: 'l8-partitions', label: 'Partitions' },
    { id: 'l9-reconcile',  label: 'Audit' }
  ],

  setMastered(map, activeNum = 1) {
    this._mastered = { ...(map || {}) };
    this._activeChapter = activeNum || 1;
  },

  setKoanState(chNum, progress, scene) {
    this._koanChapter = chNum;
    this._koanProgress = Math.max(0, Math.min(1, progress));
    this._koanScene = scene || 'table';
  },

  ripple(xFrac = 0.5) {
    this._ripples.push({ xFrac, r: 8, life: 1.0 });
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
      this._tickPipeline(dt);
      if (this._riverCanvas && this._riverCanvas.offsetParent !== null) this._drawPipeline(now);
      if (this._koanCanvas && this._koanCanvas.offsetParent !== null) this._drawDiagram(now);
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  },

  _setupHiDPI(canvas, ctx) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || 760;
    const h = canvas.clientHeight || 150;
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
      card: dark ? '#231E30' : '#FFFDF7',
      ink: dark ? '#EDE5D7' : '#3A3631',
      sepia: dark ? '#B8A590' : '#6B4F3A',
      muted: dark ? '#90857A' : '#85796B',
      water: dark ? '#4E6F8C' : '#6D8DA6',
      waterSoft: dark ? 'rgba(78,111,140,0.28)' : 'rgba(109,141,166,0.22)',
      saffron: '#E8892F',
      saffronSoft: dark ? 'rgba(232,137,47,0.24)' : 'rgba(232,137,47,0.18)',
      sage: dark ? '#82A677' : '#5E7D54',
      sageSoft: dark ? 'rgba(130,166,119,0.24)' : 'rgba(94,125,84,0.18)',
      warn: '#C25E3E',
      orphan: '#8B74C9'
    };
  },

  _nodeX(idx, w) {
    const pad = Math.max(38, w * 0.065);
    const span = w - pad * 2;
    return pad + (idx / (this.STAGES.length - 1)) * span;
  },

  /* ============================================================
     LIVE END-TO-END DATA PIPELINE PANORAMA
  ============================================================ */
  _tickPipeline(dt) {
    const hasBulk = !!this._mastered['l6-bulkload'];
    const hasPy = !!this._mastered['l4-python'];
    const hasJoin = !!this._mastered['l5-leftjoin'];

    this._spawnAcc += dt * (hasBulk ? 2.6 : 1.05);
    while (this._spawnAcc >= 1) {
      this._spawnAcc -= 1;
      const r = Math.random();
      const kind = r < 0.16 ? 'dirty' : (r < 0.30 ? 'orphan' : 'clean');
      this._packets.push({ u: 0.0, kind, yOff: 0, diverted: false, alpha: 1 });
    }

    const spd = hasBulk ? 0.25 : 0.12;
    for (let i = this._packets.length - 1; i >= 0; i--) {
      const p = this._packets[i];
      if (p.diverted) {
        p.yOff += dt * 42;
        p.alpha -= dt * 1.5;
        if (p.alpha <= 0) this._packets.splice(i, 1);
        continue;
      }
      p.u += dt * spd;
      // Node 4 (Python cleaner) sits at u = 3/8 = 0.375
      if (p.kind === 'dirty' && Math.abs(p.u - 0.375) < 0.025 && hasPy) {
        p.diverted = true;
      }
      // Node 5 (LEFT JOIN -1) sits at u = 4/8 = 0.5
      if (p.kind === 'orphan' && Math.abs(p.u - 0.5) < 0.025) {
        if (hasJoin) p.kind = 'rescued';
        else p.diverted = true;
      }
      if (p.u > 1.02) this._packets.splice(i, 1);
    }

    for (let i = this._ripples.length - 1; i >= 0; i--) {
      const rp = this._ripples[i];
      rp.r += dt * 90;
      rp.life -= dt * 0.9;
      if (rp.life <= 0) this._ripples.splice(i, 1);
    }
  },

  _drawPipeline(now) {
    const g = this._riverCtx;
    const { w, h } = this._setupHiDPI(this._riverCanvas, g);
    const P = this._palette();
    const cy = h * 0.42;

    // Warm sketchbook backdrop
    g.fillStyle = P.paper;
    g.fillRect(0, 0, w, h);

    // Subtle drafting dot grid (very faint architectural paper feel)
    g.fillStyle = P.sepia;
    g.globalAlpha = P.dark ? 0.08 : 0.10;
    for (let x = 18; x < w; x += 26) {
      for (let y = 16; y < h; y += 26) {
        g.fillRect(x, y, 1.2, 1.2);
      }
    }
    g.globalAlpha = 1;

    const x0 = this._nodeX(0, w);
    const xEnd = this._nodeX(this.STAGES.length - 1, w);
    const hasBulk = !!this._mastered['l6-bulkload'];

    // Soft pipeline conduit background rail
    g.strokeStyle = P.waterSoft;
    g.lineWidth = hasBulk ? 14 : 9;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(x0, cy);
    g.lineTo(xEnd, cy);
    g.stroke();

    // Animated dashed flow line inside the conduit
    g.strokeStyle = P.water;
    g.lineWidth = 1.5;
    g.setLineDash([8, 12]);
    g.lineDashOffset = -(now * (hasBulk ? 0.065 : 0.028));
    g.beginPath();
    g.moveTo(x0, cy);
    g.lineTo(xEnd, cy);
    g.stroke();
    g.setLineDash([]);

    // Moving data packets along the conduit
    for (const pkt of this._packets) {
      const px = x0 + pkt.u * (xEnd - x0);
      const py = cy + pkt.yOff;
      g.globalAlpha = Math.max(0, pkt.alpha);
      g.fillStyle = pkt.kind === 'dirty' ? P.warn
        : (pkt.kind === 'orphan' ? P.orphan
        : (pkt.kind === 'rescued' ? P.sage : P.card));
      g.strokeStyle = P.ink;
      g.lineWidth = 1.2;
      g.beginPath();
      g.roundRect(px - 4, py - 4, 8, 8, 2);
      g.fill();
      g.stroke();
      g.globalAlpha = 1;
    }

    // Draw the 9 Pipeline Stage Nodes
    const compact = w < 640;
    const r = compact ? 12 : 15;
    this.STAGES.forEach((st, idx) => {
      const nx = this._nodeX(idx, w);
      const done = !!this._mastered[st.id];
      const active = (idx + 1) === this._activeChapter;

      // Active lesson subtle breathing halo
      if (active) {
        const pulse = 4 + Math.sin(now * 0.004) * 2;
        g.fillStyle = P.saffronSoft;
        g.beginPath();
        g.arc(nx, cy, r + pulse, 0, Math.PI * 2);
        g.fill();
      }

      // Node circle
      g.fillStyle = done ? P.sage : (active ? P.saffron : P.card);
      g.strokeStyle = done ? P.sage : (active ? P.saffron : P.sepia);
      g.lineWidth = active ? 2.2 : 1.5;
      g.beginPath();
      g.arc(nx, cy, r, 0, Math.PI * 2);
      g.fill();
      g.stroke();

      // Number or checkmark inside circle
      g.fillStyle = (done || active) ? '#FFFFFF' : P.sepia;
      g.font = `700 ${compact ? 10 : 11.5}px "DM Sans", sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(done ? '✓' : String(idx + 1), nx, cy + 0.5);

      // Stage label below node: on mobile show ONLY the active stage label (prevents collisions!)
      if (!compact || active) {
        const labelX = compact ? Math.max(38, Math.min(w - 38, nx)) : nx;
        g.fillStyle = active ? P.ink : (done ? P.sage : P.muted);
        g.font = `${active ? 700 : 600} ${compact ? 11 : 11}px "DM Sans", sans-serif`;
        g.textBaseline = 'alphabetic';
        g.fillText(compact ? `${idx + 1}. ${st.label}` : st.label, labelX, cy + r + 17);
      }

      // Small Quarantine note under Stage 4 on desktop when Python cleaner is active
      if (idx === 3 && this._mastered['l4-python'] && !compact) {
        g.fillStyle = P.warn;
        g.font = '600 9px "DM Sans", sans-serif';
        g.fillText('↳ Quarantine', nx, cy + r + 29);
      }
    });

    // Celebratory completion ripples
    for (const rp of this._ripples) {
      const rx = x0 + rp.xFrac * (xEnd - x0);
      g.strokeStyle = P.saffron;
      g.globalAlpha = Math.max(0, rp.life);
      g.lineWidth = 2.4;
      g.beginPath();
      g.arc(rx, cy, rp.r, 0, Math.PI * 2);
      g.stroke();
      g.globalAlpha = 1;
    }

    g.restore();
  },

  _label(g, x, y, txt, P) {
    g.fillStyle = P.sepia;
    g.font = '600 11px "DM Sans", sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'alphabetic';
    g.fillText(txt, x, y);
  },

  /* ============================================================
     STEP 1: SYNCED VISUAL LESSON DIAGRAMS (9 LESSONS)
  ============================================================ */
  _drawDiagram(now) {
    const g = this._koanCtx;
    const { w, h } = this._setupHiDPI(this._koanCanvas, g);
    const P = this._palette();
    const p = this._koanProgress;
    const ch = this._koanChapter;

    g.fillStyle = P.paper;
    g.fillRect(0, 0, w, h);

    // Clean sketchbook frame
    g.strokeStyle = P.sepia;
    g.globalAlpha = 0.22;
    g.lineWidth = 1.4;
    g.strokeRect(10, 10, w - 20, h - 20);
    g.globalAlpha = 1;

    const cx = w / 2;
    const cy = h / 2;
    const sway = Math.sin(now * 0.0022) * 2.5;

    g.strokeStyle = P.ink;
    g.fillStyle = P.ink;
    g.lineWidth = 1.8;
    g.textAlign = 'center';

    if (ch === 1) {
      // Lesson 1: Structured 4-column table with header -> WHERE filter -> ORDER BY DESC
      const narrow = w < 460;
      const rows = p > 0.68
        ? [
            { sku: 'B-2210', cat: 'Footwear',    price: '$120.00', active: 'TRUE',  keep: true },
            { sku: 'G-4400', cat: 'Footwear',    price: '$89.50',  active: 'TRUE',  keep: true },
            { sku: 'C-5501', cat: 'Accessories', price: '$45.00',  active: 'TRUE',  keep: true },
            { sku: 'H-3030', cat: 'Accessories', price: '$64.00',  active: 'FALSE', keep: false }
          ]
        : [
            { sku: 'A-9042', cat: 'Apparel',     price: '$24.99',  active: 'TRUE',  keep: false },
            { sku: 'B-2210', cat: 'Footwear',    price: '$120.00', active: 'TRUE',  keep: true },
            { sku: 'C-5501', cat: 'Accessories', price: '$45.00',  active: 'TRUE',  keep: true },
            { sku: 'H-3030', cat: 'Accessories', price: '$64.00',  active: 'FALSE', keep: false }
          ];
      const tw = Math.min(520, w - 36);
      const tx = cx - tw / 2;
      const rowH = narrow ? 25 : 27;
      const hdrH = narrow ? 22 : 24;
      const totalH = hdrH + rows.length * rowH;
      const titleY = Math.max(24, (h - totalH) / 2 - 4);
      const tableY = titleY + 10;

      const colX = [tx + 12, tx + tw * 0.24, tx + tw * 0.58, tx + tw * 0.80];
      const fSize = narrow ? 10 : 11.5;

      this._label(
        g, cx, titleY,
        p > 0.68 ? 'ORDER BY unit_price DESC (Highest First)'
          : (p > 0.30 ? 'WHERE is_active AND unit_price > 30' : 'Table: dim_product (Rows & Columns)'),
        P
      );

      // Outer rounded table card
      g.fillStyle = P.card;
      g.strokeStyle = P.sepia;
      g.lineWidth = 1.4;
      g.beginPath();
      g.roundRect(tx, tableY, tw, totalH, 8);
      g.fill();
      g.stroke();

      // Column header strip
      g.fillStyle = P.waterSoft;
      g.beginPath();
      g.roundRect(tx, tableY, tw, hdrH, [8, 8, 0, 0]);
      g.fill();
      g.fillStyle = P.sepia;
      g.font = `700 ${narrow ? 9.5 : 10.5}px "DM Sans", sans-serif`;
      g.textAlign = 'left';
      const headers = ['sku_code', 'category', 'unit_price', 'is_active'];
      headers.forEach((hdr, i) => g.fillText(hdr, colX[i], tableY + hdrH - 7));

      // Data rows with crisp column alignment
      rows.forEach((r, idx) => {
        const ry = tableY + hdrH + idx * rowH;
        const faded = p > 0.30 && !r.keep;
        const kept = p > 0.30 && r.keep;

        // Horizontal divider
        g.strokeStyle = P.sepia;
        g.globalAlpha = 0.18;
        g.beginPath(); g.moveTo(tx, ry); g.lineTo(tx + tw, ry); g.stroke();
        g.globalAlpha = 1;

        if (kept) {
          g.fillStyle = P.sageSoft;
          g.fillRect(tx + 1, ry + 1, tw - 2, rowH - 2);
        }

        g.globalAlpha = faded ? 0.34 : 1;
        g.fillStyle = P.ink;
        g.font = `600 ${fSize}px "JetBrains Mono", monospace`;
        const catTxt = narrow && r.cat.length > 9 ? r.cat.slice(0, 8) + '.' : r.cat;
        g.fillText(r.sku, colX[0], ry + rowH - 8);
        g.fillText(catTxt, colX[1], ry + rowH - 8);
        g.fillText(r.price, colX[2], ry + rowH - 8);
        g.fillStyle = r.active === 'TRUE' ? P.sage : P.warn;
        g.fillText(r.active, colX[3], ry + rowH - 8);
        g.globalAlpha = 1;
      });
      g.textAlign = 'center';
    } else if (ch === 2) {
      // Lesson 2: GROUP BY folding 6 raw receipts into 3 store totals
      const leftX = cx - 190;
      const rightX = cx + 65;
      this._label(g, leftX + 60, 28, 'Raw Receipts (stg_pos_sales)', P);
      const receipts = ['Store 12 · $49.98', 'Store 12 · $120.00', 'Store 19 · $75.00', 'Store 19 · $24.99', 'Store 24 · $180.00'];
      receipts.forEach((txt, i) => {
        this._sketchBox(g, leftX, 38 + i * 32, 130, 26, txt, i < 2 ? P.water : (i < 4 ? P.saffron : P.sage), P, 10.5);
      });
      if (p > 0.32) {
        g.strokeStyle = P.sepia; g.lineWidth = 2;
        g.beginPath(); g.moveTo(leftX + 136, cy); g.lineTo(rightX - 10, cy); g.stroke();
        this._label(g, cx - 2, cy - 10, 'GROUP BY', P);
      }
      if (p > 0.45) {
        this._label(g, rightX + 70, 28, 'Store Totals (COUNT + SUM)', P);
        this._sketchBox(g, rightX, 46, 145, 38, 'Store 24 · 3 txns · $331.50', P.sage, P, 10.5);
        this._sketchBox(g, rightX, 94, 145, 38, 'Store 12 · 4 txns · $251.73', P.water, P, 10.5);
        this._sketchBox(g, rightX, 142, 145, 38, 'Store 19 · 3 txns · $157.99', P.saffron, P, 10.5);
      }
    } else if (ch === 3) {
      // Lesson 3: Duplicate SKU A-9042 causing 2× fan-out -> caught by HAVING COUNT(*) > 1
      this._sketchBox(g, cx - 185, cy - 42, 130, 44, 'SKU: A-9042\n(Active)', P.water, P);
      if (p > 0.25) this._sketchBox(g, cx - 185, cy + 12, 130, 44, 'SKU: A-9042\n(Duplicate!)', P.warn, P);
      if (p > 0.48) {
        g.strokeStyle = P.ink; g.lineWidth = 1.8;
        g.beginPath(); g.moveTo(cx - 50, cy - 18); g.lineTo(cx + 35, cy - 22); g.moveTo(cx - 50, cy + 32); g.lineTo(cx + 35, cy + 28); g.stroke();
        this._sketchBox(g, cx + 40, cy - 46, 155, 44, 'Blind Join: Sale × 2\n+$18,420 phantom', P.warn, P);
        this._sketchBox(g, cx + 40, cy + 10, 155, 44, 'HAVING COUNT(*) > 1\nCaught Early ✓', P.sage, P);
      }
    } else if (ch === 4) {
      // Lesson 4: Python CSV Cleaner -> Clean UTF-8 vs Quarantine
      this._sketchBox(g, cx - 210, cy - 42 + sway, 120, 42, 'Latin-1 0xE9\n(Encoding Err)', P.warn, P);
      this._sketchBox(g, cx - 210, cy + 12, 120, 42, 'SKU "00421"\n(Keep Leading 0)', P.water, P);
      if (p > 0.30) {
        g.strokeStyle = P.sage; g.lineWidth = 3;
        g.beginPath(); g.moveTo(cx - 35, 36); g.lineTo(cx - 35, h - 32); g.stroke();
        this._label(g, cx - 35, 28, 'Python pandas Cleaner', P);
      }
      if (p > 0.55) {
        this._sketchBox(g, cx + 35, cy - 46, 160, 44, 'Clean UTF-8 + str\nReady for SQL ✓', P.sage, P);
        this._sketchBox(g, cx + 35, cy + 12, 160, 44, 'Quarantine Table\nBad Rows Logged', P.saffron, P);
      }
    } else if (ch === 5) {
      // Lesson 5: FactSales + DimProduct + Unknown (-1)
      this._sketchBox(g, cx - 200, cy - 26, 130, 54, 'stg_pos_sales\nZ-9999 · $75.00', P.water, P);
      this._sketchBox(g, cx + 65, cy - 58, 135, 46, 'dim_product\nKnown Active SKUs', P.sage, P);
      if (p > 0.42) {
        this._sketchBox(g, cx + 65, cy + 12 + sway * 0.4, 135, 50, 'Unknown Key (-1)\nZ-9999 Preserved ✓', P.saffron, P);
        g.strokeStyle = P.saffron; g.lineWidth = 2.2;
        g.beginPath(); g.moveTo(cx - 66, cy + 4); g.quadraticCurveTo(cx, cy + 36, cx + 62, cy + 36); g.stroke();
      }
    } else if (ch === 6) {
      // Lesson 6: Bulk COPY vs Row-by-Row INSERT + ON CONFLICT
      const fast = p > 0.38;
      this._sketchBox(g, cx - 205, cy - 28, 132, 56, fast ? 'COPY / Fast Load\n85,000 rows/sec' : 'Row INSERT\n1,000 rows/sec', fast ? P.sage : P.warn, P);
      g.strokeStyle = fast ? P.water : P.muted;
      g.lineWidth = fast ? 6 : 2;
      g.setLineDash([10, 8]);
      g.lineDashOffset = -(now * (fast ? 0.14 : 0.03));
      g.beginPath(); g.moveTo(cx - 70, cy); g.lineTo(cx + 62, cy); g.stroke();
      g.setLineDash([]);
      this._sketchBox(g, cx + 68, cy - 28, 142, 56, p > 0.68 ? 'ON CONFLICT\nRetry-Safe ✓' : 'Target Warehouse\n50M Rows', p > 0.68 ? P.saffron : P.water, P);
    } else if (ch === 7) {
      // Lesson 7: T-SQL vs PostgreSQL
      this._sketchBox(g, cx - 200, cy - 34, 148, 66, 'SQL Server (T-SQL)\nTOP · ISNULL · GETDATE', P.water, P);
      this._sketchBox(g, cx + 52, cy - 34, 148, 66, 'PostgreSQL\nLIMIT · COALESCE · NOW', P.saffron, P);
      g.strokeStyle = P.sepia; g.lineWidth = 2;
      g.beginPath(); g.moveTo(cx - 48, cy); g.lineTo(cx + 48, cy); g.stroke();
      this._label(g, cx, cy - 12, 'Same Logic', P);
      this._label(g, cx, cy + 56, p > 0.52 ? 'PostgreSQL is case-sensitive & uses MVCC (no NOLOCK needed)' : 'Two SQL Dialects, One Relational Model', P);
    } else if (ch === 8) {
      // Lesson 8: 12 Monthly Partitions -> 11 Pruned, March glows
      const cols = 12;
      const bw = Math.min(44, (w - 84) / cols);
      const startX = cx - (cols * (bw + 4)) / 2;
      for (let i = 0; i < cols; i++) {
        const isMar = i === 2;
        const pruned = p > 0.42 && !isMar;
        g.globalAlpha = pruned ? 0.20 : 1;
        g.fillStyle = isMar && p > 0.42 ? P.saffron : P.card;
        g.strokeStyle = isMar && p > 0.42 ? P.saffron : P.ink;
        g.lineWidth = isMar ? 2.2 : 1.3;
        g.beginPath();
        g.roundRect(startX + i * (bw + 4), cy - 34, bw, 64, 5);
        g.fill();
        g.stroke();
        g.fillStyle = (isMar && p > 0.42) ? '#fff' : P.ink;
        g.font = '600 10px "JetBrains Mono", monospace';
        g.fillText(`M${String(i + 1).padStart(2, '0')}`, startX + i * (bw + 4) + bw / 2, cy + 4);
      }
      g.globalAlpha = 1;
      this._label(g, cx, cy + 54, p > 0.42 ? 'Sargable Range (>= & <): 11 of 12 Partitions Skipped → 1.4s' : 'Wrapped Column EXTRACT(): Scans All 12 Partitions → 21.4s', P);
    } else {
      // Lesson 9: Aggregate-First CTE Reconciliation
      this._sketchBox(g, cx - 205, cy - 28, 138, 56, 'CTE 1: Legacy EOD\nSUM per Store', P.water, P);
      this._sketchBox(g, cx + 67, cy - 28, 138, 56, 'CTE 2: Warehouse\nSUM per Store', P.sage, P);
      if (p > 0.50) {
        g.strokeStyle = P.saffron; g.lineWidth = 2.2;
        g.beginPath(); g.moveTo(cx - 62, cy); g.lineTo(cx + 62, cy); g.stroke();
        g.fillStyle = P.saffron;
        g.beginPath(); g.arc(cx, cy, 16, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#fff';
        g.font = '700 12px "DM Sans", sans-serif';
        g.fillText('✓', cx, cy + 4);
        this._label(g, cx, cy + 54, '1 Row per Store on Both Sides → Zero Fan-Out · Exact Variance Caught', P);
      }
    }
    g.restore();
  },

  _sketchBox(g, x, y, w, h, text, wash, P, fontSize = 11) {
    g.fillStyle = wash || P.card;
    g.globalAlpha = wash ? 0.22 : 1;
    g.beginPath();
    g.roundRect(x, y, w, h, 7);
    g.fill();
    g.globalAlpha = 1;
    g.strokeStyle = wash || P.ink;
    g.lineWidth = 1.6;
    g.beginPath();
    g.roundRect(x, y, w, h, 7);
    g.stroke();
    g.fillStyle = P.ink;
    g.font = `600 ${fontSize}px "DM Sans", sans-serif`;
    const lines = String(text).split('\n');
    lines.forEach((ln, idx) => {
      g.fillText(ln, x + w / 2, y + h / 2 + (idx - (lines.length - 1) / 2) * 14 + 4);
    });
  }
};

if (typeof window !== 'undefined') window.ZenWorld = ZenWorld;
