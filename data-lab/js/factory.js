/* Einstein's Data Factory — Animated Canvas Pipeline Sandbox & Unlockable Skill Tree
 * Pure Canvas 2D + Data Model (zero external deps, 60fps HiDPI, Warm Paper + Cozy Dark aware).
 * Every mastered milestone unlocks downstream nodes AND physically upgrades the live factory.
 */
const DataFactory = {
  MILESTONES: [
    {
      id: 'm1-profile',
      tier: 1,
      station: 0,
      icon: '🔍',
      title: '1. Data Profiling & Duplicate Radar',
      tech: 'PostgreSQL / T-SQL',
      requires: [],
      pgChallengeId: 'pg3-dupes',
      gainLabel: '+Duplicate Radar · Unlocks Ingestion & Modeling',
      concept: 'Before building any pipeline, profile source tables for duplicate business keys, nulls, and broken grain using GROUP BY and HAVING COUNT(*) > 1.',
      mentalModel: 'You cannot build a skyscraper on quicksand—profiling catches bad keys before they multiply revenue in downstream joins.',
      code: `SELECT sku_code, COUNT(*) AS cnt\nFROM dim_product\nGROUP BY sku_code\nHAVING COUNT(*) > 1;`,
      metricsDelta: { throughput: 1200, parity: 79, latency: 21.4, backfill: 14.0 }
    },
    {
      id: 'm2-python',
      tier: 2,
      station: 1,
      icon: '🐍',
      title: '2. Python Encoding Shield & Quarantine',
      tech: 'Python (pandas)',
      requires: ['m1-profile'],
      assessment: {
        q: 'A vendor CSV contains Latin-1 bytes and leading-zero SKUs like "00421". Which pandas pattern prevents crashes AND preserves leading zeros?',
        opts: [
          'pd.read_csv(path) with default settings',
          'Try utf-8-sig → cp1252 → latin1 fallback, pass dtype={"sku": str}, and drop_duplicates(subset=["sku"])',
          'Convert all SKUs to float64 and ignore UnicodeDecodeError'
        ],
        ans: 1,
        exp: 'Explicit encoding fallback + dtype=str + key deduplication stops crashes and prevents broken joins.'
      },
      gainLabel: '+Quarantine Chute · Eliminates Dirty-Row Crashes',
      concept: 'Real-world CSVs arrive with mixed encodings (UTF-8 vs Latin-1/CP1252) and numeric-looking IDs. Defensive Python pre-processing normalizes headers, preserves leading zeros, and routes malformed rows to a quarantine table.',
      mentalModel: 'Your Python cleaner is airport customs: bad rows are pulled aside for inspection while clean data flows uninterrupted.',
      code: `for enc in ("utf-8-sig", "cp1252", "latin1"):\n    try:\n        df = pd.read_csv(path, encoding=enc, dtype={"sku": str})\n        break\n    except UnicodeDecodeError:\n        continue\ndf = df.drop_duplicates(subset=["sku"], keep="last")`,
      metricsDelta: { throughput: 2500, parity: 84, latency: 21.4, backfill: 14.0 }
    },
    {
      id: 'm3-star',
      tier: 2,
      station: 3,
      icon: '⭐',
      title: '3. Star Schema & Unknown (-1) Net',
      tech: 'SQL Server / PostgreSQL',
      requires: ['m1-profile'],
      pgChallengeId: 'pg4-leftjoin',
      gainLabel: '+Unknown (-1) Key · Parity 79% → 92%',
      concept: 'Use LEFT JOIN (with active-flag filters inside the ON clause) and COALESCE(product_sk, -1) so valid sales for brand-new SKUs are never silently dropped.',
      mentalModel: 'An INNER JOIN throws away money whenever a new product arrives late; an Unknown (-1) surrogate key catches every single dollar.',
      code: `SELECT s.txn_id, s.sku,\n       COALESCE(p.product_sk, -1) AS product_sk, s.net_amount\nFROM stg_pos_sales s\nLEFT JOIN dim_product p\n  ON p.sku_code = s.sku AND p.is_active;`,
      metricsDelta: { throughput: 3200, parity: 92, latency: 21.4, backfill: 14.0 }
    },
    {
      id: 'm4-bulk',
      tier: 3,
      station: 2,
      icon: '🚀',
      title: '4. Bulk Firehose (COPY & Fast Load)',
      tech: 'Postgres COPY / SSIS',
      requires: ['m2-python'],
      assessment: {
        q: 'Loading 50M rows with row-by-row INSERTs takes 14 hours. Which combination cuts it to ~2.5 hours?',
        opts: [
          'Stream chunks through PostgreSQL COPY (or SSIS Fast Load), drop/rebuild non-unique indexes once, and run 4 parallel chunk workers',
          'Add 10 more indexes before loading and commit after every single row',
          'Convert all columns to TEXT and run 100 concurrent workers on the live ERP'
        ],
        ans: 0,
        exp: 'COPY/Fast Load + deferred index builds + bounded parallelism delivers an order-of-magnitude throughput leap.'
      },
      gainLabel: '⚡ 85× Speedup · Backfill 14.0h → 2.5h',
      concept: 'Row-by-row INSERTs choke on per-row parsing and WAL commits. Streaming chunks via io.StringIO + psycopg2 copy_expert() (or SSIS Fast Load) with deferred index rebuilds turns a 14-hour crawl into a 2.5-hour firehose.',
      mentalModel: 'Stop carrying water in a teacup (INSERT)—connect a firehose (COPY) and build your indexes once the tank is full.',
      code: `buf = io.StringIO()\nchunk.to_csv(buf, index=False, header=False, sep="\\t", na_rep="\\\\N")\nbuf.seek(0)\ncur.copy_expert("COPY stg.events FROM STDIN WITH (FORMAT text, NULL '\\\\N')", buf)`,
      metricsDelta: { throughput: 85000, parity: 92, latency: 21.4, backfill: 2.5 }
    },
    {
      id: 'm5-upsert',
      tier: 3,
      station: 3,
      icon: '🛡️',
      title: '5. Idempotent Upserts & T-SQL → PG',
      tech: 'PostgreSQL ON CONFLICT / MERGE',
      requires: ['m3-star'],
      pgChallengeId: 'pg10-upsert',
      gainLabel: '+Retry-Proof Shield · Zero Duplicates on Rerun',
      concept: 'Nightly pipelines fail and retry. Idempotent upserts (PostgreSQL ON CONFLICT DO UPDATE or SQL Server MERGE) guarantee that running the same batch twice produces the exact same table state.',
      mentalModel: 'An idempotent load is like pressing an elevator button twice—it still goes to the exact same floor without creating two elevators.',
      code: `INSERT INTO fact_work_orders (wo_id, split_seq, good_qty, scrap_qty)\nSELECT wo_id, split_seq, good_qty, COALESCE(scrap_qty, 0)\nFROM stg_work_orders\nON CONFLICT (wo_id, split_seq)\nDO UPDATE SET good_qty = EXCLUDED.good_qty,\n              scrap_qty = EXCLUDED.scrap_qty;`,
      metricsDelta: { throughput: 95000, parity: 96, latency: 18.0, backfill: 2.5 }
    },
    {
      id: 'm6-partition',
      tier: 4,
      station: 4,
      icon: '🗂️',
      title: '6. Range Partitioning & Sargable Plans',
      tech: 'PostgreSQL EXPLAIN',
      requires: ['m4-bulk', 'm5-upsert'],
      pgChallengeId: 'pg12-sargable',
      gainLabel: '⚡ Query Latency 21.4s → 1.4s (12× Pruning)',
      concept: 'Declarative monthly PARTITION BY RANGE lets PostgreSQL prune untouched months—as long as your WHERE clause uses sargable range bounds (event_ts >= ... AND event_ts < ...) instead of wrapping the column in EXTRACT().',
      mentalModel: 'Instead of flipping through all 72 months of a 42M-row ledger, PostgreSQL opens only the exact monthly drawer you asked for.',
      code: `SELECT plant_id, SUM(downtime_sec)\nFROM fact_shop_floor_events\nWHERE event_ts >= '2022-03-01'\n  AND event_ts <  '2022-04-01'\nGROUP BY plant_id;`,
      metricsDelta: { throughput: 110000, parity: 97, latency: 1.4, backfill: 2.5 }
    },
    {
      id: 'm7-recon',
      tier: 4,
      station: 5,
      icon: '⚖️',
      title: '7. Fan-Out-Safe Reconciliation & Timezones',
      tech: 'PostgreSQL CTEs / Timezones',
      requires: ['m5-upsert'],
      pgChallengeId: 'pg7-recon',
      gainLabel: '+99.98% Parity Gate · Zero Silent Drift',
      concept: 'Always aggregate each side of a reconciliation in its own CTE before joining (avoiding many-to-many multiplication), localize UTC timestamps before deriving business dates, and fail loudly on 0-row source files.',
      mentalModel: 'Aggregate first, join second—like counting apples in each basket separately before comparing totals.',
      code: `WITH legacy AS (SELECT store_id, SUM(pos_eod_total) AS l FROM pos_eod_summary GROUP BY 1),\n     dw     AS (SELECT store_id, SUM(net_amount)    AS d FROM stg_pos_sales   GROUP BY 1)\nSELECT store_id, l, d, ABS(l - d) AS variance\nFROM legacy JOIN dw USING (store_id)\nWHERE ABS(l - d) > 0;`,
      metricsDelta: { throughput: 115000, parity: 99.98, latency: 1.4, backfill: 2.5 }
    },
    {
      id: 'm8-capstone',
      tier: 5,
      station: 5,
      icon: '👑',
      title: '8. Capstone: Recursive BOM & Go-Live',
      tech: 'PostgreSQL WITH RECURSIVE',
      requires: ['m6-partition', 'm7-recon'],
      pgChallengeId: 'pg13-bom',
      gainLabel: '👑 Principal Data Engineer · Full Factory Overdrive',
      concept: 'Master recursive SQL (WITH RECURSIVE) to explode multi-level manufacturing Bills of Materials, multiply quantities down the assembly tree, and certify your entire 6-station data platform for zero-downtime Go-Live.',
      mentalModel: 'A recursive CTE walks down a tree branch by branch until it reaches every leaf bolt and gasket.',
      code: `WITH RECURSIVE explode AS (\n  SELECT child_part, qty_per::numeric AS qty FROM bom WHERE parent_part = 'PUMP-100'\n  UNION ALL\n  SELECT b.child_part, e.qty * b.qty_per FROM explode e JOIN bom b ON b.parent_part = e.child_part\n)\nSELECT child_part, SUM(qty) FROM explode e\nWHERE NOT EXISTS (SELECT 1 FROM bom b WHERE b.parent_part = e.child_part)\nGROUP BY child_part;`,
      metricsDelta: { throughput: 128000, parity: 100.0, latency: 1.1, backfill: 2.2 }
    }
  ],

  STATIONS: [
    { id: 0, label: '1. Raw Sources', sub: 'POS · ERP · CSVs', icon: '📦' },
    { id: 1, label: '2. Python Shield', sub: 'pandas · Encoding', icon: '🐍' },
    { id: 2, label: '3. Bulk Loader', sub: 'COPY / Fast Load', icon: '🚀' },
    { id: 3, label: '4. Star Schema', sub: 'Upsert · Key -1', icon: '⭐' },
    { id: 4, label: '5. Partitions', sub: '72-Mo · B-Tree', icon: '🗂️' },
    { id: 5, label: '6. Parity & BI', sub: 'Reconcile · Live', icon: '📊' }
  ],

  RANKS: [
    { min: 0, title: 'Apprentice Scribbler', badge: 'Rank 1' },
    { min: 1, title: 'Data Profiler', badge: 'Rank 2' },
    { min: 3, title: 'Pipeline Builder', badge: 'Rank 3' },
    { min: 5, title: 'Warehouse Architect', badge: 'Rank 4' },
    { min: 7, title: 'Staff Data Engineer', badge: 'Rank 5' },
    { min: 8, title: 'Principal Data Engineer 👑', badge: 'MAX RANK' }
  ],

  /* Live animation state */
  _canvas: null,
  _ctx: null,
  _raf: null,
  _packets: [],
  _sparks: [],
  _lastTs: 0,
  _spawnAcc: 0,
  _activeFault: null,
  _faultUntil: 0,
  _unlockedSet: new Set(),
  _sandboxMode: false,

  isUnlocked(id, completedMap) {
    if (this._sandboxMode) return true;
    const m = this.MILESTONES.find(x => x.id === id);
    if (!m) return false;
    return m.requires.every(req => !!completedMap[req]);
  },

  computeTelemetry(completedMap) {
    let throughput = 950;
    let parity = 74.2;
    let latency = 21.4;
    let backfill = 14.0;
    let count = 0;

    if (completedMap['m1-profile']) { throughput = 1400; parity = 79.5; count++; }
    if (completedMap['m2-python']) { throughput += 1200; parity += 4.5; count++; }
    if (completedMap['m3-star']) { parity = Math.max(parity, 92.4); count++; }
    if (completedMap['m4-bulk']) { throughput = 85000; backfill = 2.5; count++; }
    if (completedMap['m5-upsert']) { throughput = Math.max(throughput, 96000); parity = Math.min(99.5, parity + 4.1); count++; }
    if (completedMap['m6-partition']) { latency = 1.4; throughput += 14000; count++; }
    if (completedMap['m7-recon']) { parity = 99.98; count++; }
    if (completedMap['m8-capstone']) { throughput = 128000; parity = 100.0; latency = 1.1; backfill = 2.2; count++; }

    let rank = this.RANKS[0];
    for (const r of this.RANKS) {
      if (count >= r.min) rank = r;
    }
    return { throughput, parity, latency, backfill, count, total: this.MILESTONES.length, rank };
  },

  syncState(completedMap, sandboxMode) {
    this._unlockedSet = new Set(Object.keys(completedMap).filter(k => completedMap[k]));
    this._sandboxMode = !!sandboxMode;
  },

  injectFault(type) {
    this._activeFault = type;
    this._faultUntil = performance.now() + 4500;
    // Emit a visible wave of fault packets
    for (let i = 0; i < 6; i++) {
      this._packets.push({
        seg: 0,
        t: -i * 0.12,
        kind: type === 'encoding' ? 'dirty' : (type === 'orphan' ? 'orphan' : 'valid'),
        yOff: (Math.random() - 0.5) * 14,
        diverted: false,
        dropProgress: 0
      });
    }
  },

  celebrate(stationIdx) {
    if (!this._canvas) return;
    const w = this._canvas.clientWidth || 900;
    const h = this._canvas.clientHeight || 220;
    const x = this._stationPos(stationIdx, w, h).x;
    const y = this._stationPos(stationIdx, w, h).y;
    const colors = ['#FF6B35', '#FFE66D', '#4ECDC4', '#A78BFA', '#16A34A'];
    for (let i = 0; i < 28; i++) {
      const ang = (Math.PI * 2 * i) / 28 + Math.random() * 0.2;
      const spd = 65 + Math.random() * 140;
      this._sparks.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 30,
        life: 1.0,
        color: colors[i % colors.length],
        size: 3 + Math.random() * 3.5
      });
    }
  },

  _stationPos(idx, w, h) {
    const padX = Math.max(58, w * 0.08);
    const usableW = w - padX * 2;
    const x = padX + (usableW * idx) / (this.STATIONS.length - 1);
    const waveY = (idx % 2 === 0 ? -10 : 10);
    return { x, y: h * 0.48 + waveY };
  },

  mountCanvas(canvasEl) {
    if (!canvasEl) return;
    this._canvas = canvasEl;
    this._ctx = canvasEl.getContext('2d');
    if (this._raf) cancelAnimationFrame(this._raf);
    this._lastTs = performance.now();

    const loop = (now) => {
      const dt = Math.min(0.05, (now - this._lastTs) / 1000);
      this._lastTs = now;
      this._tick(dt, now);
      this._draw(now);
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  },

  _tick(dt, now) {
    if (this._activeFault && now > this._faultUntil) this._activeFault = null;
    const hasBulk = this._unlockedSet.has('m4-bulk');
    const hasPython = this._unlockedSet.has('m2-python');
    const hasStar = this._unlockedSet.has('m3-star');
    const hasPart = this._unlockedSet.has('m6-partition');

    const spawnRate = hasBulk ? 4.8 : 1.7;
    this._spawnAcc += dt * spawnRate;
    while (this._spawnAcc >= 1) {
      this._spawnAcc -= 1;
      const r = Math.random();
      let kind = 'valid';
      if (r < 0.16) kind = 'dirty';
      else if (r < 0.30) kind = 'orphan';
      this._packets.push({ seg: 0, t: 0, kind, yOff: (Math.random() - 0.5) * 12, diverted: false, dropProgress: 0 });
    }

    const baseSpeed = hasBulk ? 1.55 : 0.62;
    for (let i = this._packets.length - 1; i >= 0; i--) {
      const p = this._packets[i];
      if (p.diverted) {
        p.dropProgress += dt * 1.9;
        if (p.dropProgress >= 1) this._packets.splice(i, 1);
        continue;
      }
      const segSpeed = p.seg === 2 ? (hasBulk ? 2.1 : 0.38) : (p.seg === 4 && !hasPart ? 0.5 : baseSpeed);
      p.t += dt * segSpeed;
      if (p.t >= 1) {
        p.t = 0;
        p.seg += 1;
        // Station 1: Python Shield handles dirty packets
        if (p.seg === 1 && p.kind === 'dirty') {
          p.diverted = true;
          p.divertType = hasPython ? 'quarantine' : 'crash';
        }
        // Station 3: Star Schema handles orphan SKUs
        if (p.seg === 3 && p.kind === 'orphan') {
          if (hasStar) {
            p.kind = 'rescued'; // caught by Unknown (-1)!
          } else {
            p.diverted = true;
            p.divertType = 'dropped';
          }
        }
        if (p.seg >= this.STATIONS.length - 1) {
          this._packets.splice(i, 1);
        }
      }
    }

    for (let i = this._sparks.length - 1; i >= 0; i--) {
      const s = this._sparks[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 190 * dt;
      s.life -= dt * 1.1;
      if (s.life <= 0) this._sparks.splice(i, 1);
    }
  },

  _draw(now) {
    const c = this._canvas;
    const g = this._ctx;
    if (!c || !g) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = c.clientWidth || 900;
    const h = c.clientHeight || 220;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    g.save();
    g.scale(dpr, dpr);

    const isDark = document.documentElement.classList.contains('dark');
    const ink = isDark ? '#FFF8E7' : '#1a1a2e';
    const bg = isDark ? '#1b162b' : '#FFF8E7';
    const gridCol = isDark ? 'rgba(255,248,231,0.06)' : 'rgba(26,26,46,0.07)';
    const pipeBg = isDark ? 'rgba(255,248,231,0.12)' : 'rgba(26,26,46,0.12)';
    const cardBg = isDark ? '#28213e' : '#FFFEF5';

    // Background & blueprint grid
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = gridCol;
    g.lineWidth = 1;
    for (let gx = 20; gx < w; gx += 24) { g.beginPath(); g.moveTo(gx, 0); g.lineTo(gx, h); g.stroke(); }
    for (let gy = 20; gy < h; gy += 24) { g.beginPath(); g.moveTo(0, gy); g.lineTo(w, gy); g.stroke(); }

    const pts = this.STATIONS.map((_, i) => this._stationPos(i, w, h));
    const hasBulk = this._unlockedSet.has('m4-bulk');
    const hasPython = this._unlockedSet.has('m2-python');
    const hasStar = this._unlockedSet.has('m3-star');
    const hasUpsert = this._unlockedSet.has('m5-upsert');
    const hasPart = this._unlockedSet.has('m6-partition');
    const hasRecon = this._unlockedSet.has('m7-recon');
    const hasCap = this._unlockedSet.has('m8-capstone');

    const stationUpgraded = [
      this._unlockedSet.has('m1-profile'),
      hasPython,
      hasBulk,
      hasStar || hasUpsert,
      hasPart,
      hasRecon || hasCap
    ];

    // Draw pipes between stations
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const mx = (a.x + b.x) / 2;
      g.beginPath();
      g.moveTo(a.x, a.y);
      g.bezierCurveTo(mx, a.y, mx, b.y, b.x, b.y);
      g.strokeStyle = pipeBg;
      g.lineWidth = (i === 2 && hasBulk) ? 14 : 9;
      g.lineCap = 'round';
      g.stroke();

      // Active animated flow dash inside pipe
      g.beginPath();
      g.moveTo(a.x, a.y);
      g.bezierCurveTo(mx, a.y, mx, b.y, b.x, b.y);
      g.strokeStyle = stationUpgraded[i] ? '#4ECDC4' : (isDark ? 'rgba(255,230,109,0.35)' : 'rgba(255,107,53,0.35)');
      g.lineWidth = 2.5;
      g.setLineDash([6, 10]);
      g.lineDashOffset = -(now * (hasBulk ? 0.09 : 0.035));
      g.stroke();
      g.setLineDash([]);
    }

    // Draw packets
    for (const p of this._packets) {
      if (p.t < 0) continue;
      let px, py;
      if (p.diverted) {
        const st = pts[Math.min(p.seg, pts.length - 1)];
        px = st.x;
        py = st.y + 28 + p.dropProgress * 44;
        g.globalAlpha = Math.max(0, 1 - p.dropProgress);
        g.fillStyle = p.divertType === 'quarantine' ? '#FFE66D' : '#F87171';
        g.beginPath();
        g.arc(px, py, 5, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = ink;
        g.lineWidth = 1.2;
        g.stroke();
        g.globalAlpha = 1;
        continue;
      }
      const a = pts[p.seg], b = pts[p.seg + 1];
      const u = p.t, inv = 1 - u;
      const mx = (a.x + b.x) / 2;
      px = inv * inv * inv * a.x + 3 * inv * inv * u * mx + 3 * inv * u * u * mx + u * u * u * b.x;
      py = inv * inv * inv * a.y + 3 * inv * inv * u * a.y + 3 * inv * u * u * b.y + u * u * u * b.y + p.yOff * Math.sin(u * Math.PI);

      g.fillStyle = p.kind === 'dirty' ? '#FB923C' : (p.kind === 'orphan' ? '#A78BFA' : (p.kind === 'rescued' ? '#34D399' : '#4ECDC4'));
      g.beginPath();
      g.arc(px, py, p.kind === 'rescued' ? 5.5 : 4.5, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = '#1a1a2e';
      g.lineWidth = 1.2;
      g.stroke();
    }

    // Draw station nodes
    const boxW = Math.min(116, Math.max(82, (w - 80) / 6.6));
    const boxH = 66;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const st = this.STATIONS[i];
      const up = stationUpgraded[i];
      const x = p.x - boxW / 2;
      const y = p.y - boxH / 2;

      // Offset comic shadow
      g.fillStyle = isDark ? '#090710' : '#1a1a2e';
      this._roundRect(g, x + 3, y + 3, boxW, boxH, 10);
      g.fill();

      // Node body
      g.fillStyle = up ? (isDark ? '#2d2647' : '#FFFDF0') : cardBg;
      this._roundRect(g, x, y, boxW, boxH, 10);
      g.fill();
      g.strokeStyle = up ? (hasCap ? '#FF6B35' : '#4ECDC4') : (isDark ? 'rgba(255,248,231,0.3)' : '#1a1a2e');
      g.lineWidth = up ? 2.5 : 2;
      g.stroke();

      // Top status bar
      g.fillStyle = up ? (hasCap ? '#FF6B35' : '#4ECDC4') : '#94a3b8';
      this._roundRect(g, x + 1, y + 1, boxW - 2, 7, 4);
      g.fill();

      // Icon & text
      g.fillStyle = ink;
      g.textAlign = 'center';
      g.font = '700 11.5px "DM Sans", sans-serif';
      g.fillText(`${st.icon} ${st.label.replace(/^\d+\.\s*/, '')}`, p.x, y + 29);
      g.fillStyle = isDark ? '#C4BAD6' : '#55526B';
      g.font = '500 10px "JetBrains Mono", monospace';
      g.fillText(up ? '✓ UPGRADED' : st.sub, p.x, y + 48);
    }

    // Celebratory sparks
    for (const s of this._sparks) {
      g.globalAlpha = Math.max(0, s.life);
      g.fillStyle = s.color;
      g.beginPath();
      g.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
    g.restore();
  },

  _roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }
};

if (typeof module !== 'undefined' && module.exports) module.exports = DataFactory;
if (typeof window !== 'undefined') window.DataFactory = DataFactory;
