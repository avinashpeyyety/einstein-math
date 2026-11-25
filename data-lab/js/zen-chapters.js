/* Data Lab — 15 First-Principles Lessons across 2 Tracks (Day-1 Beginner → Senior Analytical SQL Engineer)
 * Track 1 (L1–L9): Core SQL & Data Pipelines
 * Track 2 (L10–L15): Analytical SQL & Dimensional Modeling (Windows, Dedup, SCD-2, Timezones, Recursive BOM, JSONB)
 */
const ZenTracks = [
  { id: 1, status: 'live', name: 'Track 1 · Core SQL & Pipelines', short: 'Track 1 (L1–9)', range: [1, 9], desc: 'SQL fundamentals, Python CSV hygiene, Star Schema joins, bulk loading, dialects, partitioning & reconciliation.' },
  { id: 2, status: 'live', name: 'Track 2 · Analytical SQL & Modeling', short: 'Track 2 (L10–15)', range: [10, 15], desc: 'Window functions, ROW_NUMBER() dedup, SCD Type 2 history, timezones, WITH RECURSIVE trees & JSONB pipelines.' },
  { id: 3, status: 'planned', name: 'Track 3 · Authoritative Platforms, Parquet & Internals', short: 'Track 3 (L16–21)', range: [16, 21], desc: 'DuckDB-WASM Parquet, Medallion/dbt DAGs, Data Contracts, Semantic Layers, B-Tree/Covering indexes & MVCC locks.' },
  { id: 4, status: 'planned', name: 'Track 4 · Distributed Compute, Lakehouse & Streaming', short: 'Track 4 (L22–27)', range: [22, 27], desc: 'Spark shuffles & skew salting, Iceberg/Delta snapshots, Kafka partitions, watermarks, WAL CDC & Hybrid Vector Search.' },
  { id: 5, status: 'planned', name: 'Track 5 · Agentic Data Workflows & Harnesses', short: 'Track 5 (L28–33)', range: [28, 33], desc: 'Inline vs. post-hoc agent analysis, typed tools, EXPLAIN cost guards, code sandboxes, RBAC/approvals & trajectory evals.' },
  { id: 6, status: 'planned', name: 'Track 6 · LLM Serving, Compilers & Silicon (CUDA / TPU)', short: 'Track 6 (L34–39)', range: [34, 39], desc: 'Prefill FLOPS vs. Decode HBM bandwidth, KV/Prefix caching, quantization/routing, CUDA/Triton vs. TPU/XLA & datacenter locality.' },
  { id: 7, status: 'planned', name: 'Track 7 · On-Call Incident Labs & Capstone', short: 'Track 7 (Capstone)', range: [40, 47], desc: '8 live break-fix incidents across SQL, agents & serving clusters + end-to-end real-time architecture simulator.' }
];

const ZenChapters = [
  {
    id: 'l1-filter',
    track: 1,
    num: 1,
    roman: '1',
    stageLabel: 'Filter',
    title: 'Reading & Filtering Tables',
    subtitle: 'SELECT, WHERE & ORDER BY on real rows',
    level: 'Beginner',
    tech: 'PostgreSQL · SQL Basics',
    audio: 'audio/ch01.mp3',
    durationSec: 17,
    narration: 'Every database stores information in tables—just like spreadsheets made of rows and columns. To find what you need, start with SELECT for the columns, WHERE to filter rows, and ORDER BY to sort them. Simple filters are the foundation of every query you will ever write.',
    cues: [
      { at: 0.0, scene: 'table', caption: 'Every database stores information in tables—rows and columns, just like a spreadsheet.' },
      { at: 5.6, scene: 'select-where', caption: 'Start with SELECT for the columns, WHERE to filter rows, and ORDER BY to sort them.' },
      { at: 11.8, scene: 'sorted', caption: 'Simple filters are the foundation of every query you will ever write.' }
    ],
    touch: {
      prompt: 'Toggle each filter below on the real dim_product table. Watch rows filter and re-sort while the matching SQL builds itself:',
      type: 'filter-table'
    },
    spell: {
      mode: 'pg',
      pgChallengeId: 'pg1-filter',
      peekTable: 'dim_product',
      autoPeek: true,
      intro: 'Now write your first real PostgreSQL 18 query. Use the dim_product preview below to filter for active products priced over 30, sorted highest price first.',
      helpers: [
        { label: 'WHERE is_active', insert: 'WHERE is_active' },
        { label: 'AND unit_price > 30', insert: ' AND unit_price > 30' },
        { label: 'ORDER BY unit_price DESC', insert: '\nORDER BY unit_price DESC' }
      ]
    },
    koan: 'SELECT picks the columns, WHERE filters the rows, and ORDER BY sets the display order.',
    worldUpgrade: 'Stage 1 active: Your pipeline can now read, filter, and sort raw database tables accurately.'
  },
  {
    id: 'l2-groupby',
    num: 2,
    roman: '2',
    stageLabel: 'Summarize',
    title: 'Summarizing with GROUP BY',
    subtitle: 'Turn raw transactions into store totals with COUNT & SUM',
    level: 'Beginner',
    tech: 'PostgreSQL · Aggregations',
    audio: 'audio/ch02.mp3',
    durationSec: 15,
    narration: 'Nobody reads fourteen thousand raw sales receipts one by one. GROUP BY folds matching rows together so you can count transactions or add up revenue per store in a single step. Think of it as turning raw events into clear business summaries.',
    cues: [
      { at: 0.0, scene: 'raw-rows', caption: 'Nobody reads thousands of raw sales receipts one by one.' },
      { at: 4.2, scene: 'folding', caption: 'GROUP BY folds matching rows together so you can COUNT transactions or SUM revenue per store.' },
      { at: 10.2, scene: 'summary', caption: 'Turn raw transaction rows into clear business summaries in one query.' }
    ],
    touch: {
      prompt: 'Switch between the 14 raw sales receipts and the grouped store totals to see what GROUP BY actually does:',
      type: 'group-fold'
    },
    spell: {
      mode: 'pg',
      pgChallengeId: 'pg2-agg',
      peekTable: 'stg_pos_sales',
      autoPeek: true,
      intro: 'Summarize stg_pos_sales in real PostgreSQL 18: return each store_id with its transaction count and total sales, highest sales first.',
      helpers: [
        { label: 'COUNT(*) AS txn_count', insert: ', COUNT(*) AS txn_count', target: 'select' },
        { label: 'SUM(net_amount) AS total_sales', insert: ', SUM(net_amount) AS total_sales', target: 'select' },
        { label: 'GROUP BY store_id', insert: '\nGROUP BY store_id' },
        { label: 'ORDER BY total_sales DESC', insert: '\nORDER BY total_sales DESC' }
      ]
    },
    koan: 'GROUP BY collapses many detail rows into one summary row per key.',
    worldUpgrade: 'Stage 2 active: Raw events now fold cleanly into store-level KPIs and metrics.'
  },
  {
    id: 'l3-dupes',
    num: 3,
    roman: '3',
    stageLabel: 'Quality',
    title: 'Catching Duplicate Keys',
    subtitle: 'Profile tables with HAVING COUNT(*) > 1 before joining',
    level: 'Beginner',
    tech: 'PostgreSQL · Data Quality',
    audio: 'audio/ch03.mp3',
    durationSec: 15,
    narration: 'Before joining two tables together, always check for duplicate keys. If one product code appears twice in your product table, every sale for that item quietly gets counted twice. Use GROUP BY with HAVING COUNT greater than one to catch duplicates early.',
    cues: [
      { at: 0.0, scene: 'stream', caption: 'Before joining two tables together, always check for duplicate keys.' },
      { at: 4.6, scene: 'dup-crates', caption: 'If one product code (A-9042) appears twice, every sale for it quietly gets counted twice.' },
      { at: 10.4, scene: 'still-lens', caption: 'Use GROUP BY with HAVING COUNT(*) > 1 to catch duplicates before they corrupt reports.' }
    ],
    touch: {
      prompt: 'Compare joining blindly against checking for duplicate SKUs first. Notice how one duplicate product row inflates revenue:',
      type: 'toggle',
      offLabel: 'Join Without Checking (Duplicate SKU Hidden)',
      onLabel: 'Profile First (GROUP BY · HAVING COUNT(*) > 1)',
      offReadout: '240 sales × 2 rows of SKU A-9042 → +$18,420 phantom revenue added silently!',
      onReadout: 'Duplicate key A-9042 caught immediately (count = 2). Fixed before any join runs.'
    },
    spell: {
      mode: 'pg',
      pgChallengeId: 'pg3-dupes',
      peekTable: 'dim_product',
      autoPeek: true,
      intro: 'Inspect dim_product in real PostgreSQL 18 and return every sku_code that appears more than once, along with its count (cnt).',
      helpers: [
        { label: 'GROUP BY sku_code', insert: 'GROUP BY sku_code' },
        { label: 'HAVING COUNT(*) > 1', insert: '\nHAVING COUNT(*) > 1' }
      ]
    },
    koan: 'WHERE filters individual rows before grouping; HAVING filters groups after COUNT or SUM.',
    worldUpgrade: 'Stage 3 active: Automated key-uniqueness profiling catches duplicate keys before they multiply downstream.'
  },
  {
    id: 'l4-python',
    num: 4,
    roman: '4',
    stageLabel: 'Python ETL',
    title: 'Cleaning Raw Files with Python',
    subtitle: 'Handle CSV encodings, leading zeros & bad rows safely',
    level: 'Beginner → Intermediate',
    tech: 'Python (pandas) · Ingestion & Quarantine',
    audio: 'audio/ch04.mp3',
    durationSec: 20,
    narration: 'Real data often arrives as messy CSV files from outside vendors. Strange text encodings can crash nightly jobs, and spreadsheets silently strip leading zeros from product codes like zero-zero-four-two-one. Use Python to clean encodings, force codes to text, and quarantine bad rows before loading.',
    cues: [
      { at: 0.0, scene: 'muddy-boats', caption: 'Real data arrives as messy CSV files from external vendors.' },
      { at: 5.8, scene: 'bad-encoding', caption: 'Unexpected text encodings crash jobs, and numeric parsing strips leading zeros from "00421".' },
      { at: 13.2, scene: 'quarantine-cove', caption: 'Clean encodings, keep IDs as strings, and quarantine invalid rows before database load.' }
    ],
    touch: {
      prompt: 'Turn on each Python ingestion safeguard below and watch how a messy vendor CSV behaves:',
      type: 'sliders2',
      toggles: [
        { id: 'enc', label: 'UTF-8 → CP1252 → Latin-1 Fallback', impact: 'Prevents 2:00 AM UnicodeDecodeError crashes' },
        { id: 'str', label: 'dtype={"sku": str}', impact: 'Preserves leading zeros ("00421" stays "00421", not 421)' },
        { id: 'dedup', label: 'drop_duplicates(subset=["sku"])', impact: 'Guarantees 1 clean row per SKU before DB ingest' }
      ]
    },
    spell: {
      mode: 'python-quiz',
      intro: 'Complete this defensive Python CSV loader so dirty vendor files never break or corrupt your tables:',
      code: `import pandas as pd\n\nfor enc in ("utf-8-sig", "cp1252", "latin1"):\n    try:\n        df = pd.read_csv(path, encoding=enc, dtype=___)\n        break\n    except UnicodeDecodeError:\n        continue\n\ndf["sku"] = df["sku"].str.strip().str.upper()\ndf = df.drop_duplicates(subset=["sku"], keep="last")`,
      question: 'What belongs in dtype=___ so SKU "00421" keeps its leading zeros?',
      options: [
        { text: '{"sku": int}', ok: false, feedback: 'Integer parsing strips leading zeros ("00421" becomes 421), silently breaking downstream SQL joins.' },
        { text: '{"sku": str}', ok: true, feedback: 'Correct! Reading business IDs as strings keeps leading zeros intact and prevents mixed-type bugs.' },
        { text: '{"sku": float}', ok: false, feedback: 'Floats turn "00421" into 421.0 and break exact SKU matching completely.' }
      ]
    },
    koan: 'Always read IDs, ZIP codes, and SKUs as strings—and quarantine bad rows instead of crashing the whole batch.',
    worldUpgrade: 'Stage 4 active: Python ingestion cleans encodings, preserves string keys, and isolates malformed rows.'
  },
  {
    id: 'l5-leftjoin',
    num: 5,
    roman: '5',
    stageLabel: 'Joins',
    title: 'Combining Tables Safely',
    subtitle: 'Facts, Dimensions, LEFT JOIN & Unknown (-1) keys',
    level: 'Intermediate',
    tech: 'Star Schema · SQL Joins',
    audio: 'audio/ch05.mp3',
    durationSec: 20,
    narration: 'Analytics warehouses separate what happened—called facts—from descriptive details—called dimensions. When a brand-new product sells before it reaches the catalog, an INNER JOIN silently drops that revenue. Use a LEFT JOIN and map missing matches to an unknown minus-one key so no sale is ever lost.',
    cues: [
      { at: 0.0, scene: 'two-houses', caption: 'Separate events (Facts) from lookup attributes (Dimensions).' },
      { at: 6.2, scene: 'inner-drop', caption: 'When a brand-new SKU sells early, a strict INNER JOIN silently drops the sale.' },
      { at: 13.0, scene: 'minus-one', caption: 'Use LEFT JOIN + COALESCE(product_sk, -1) so every dollar is preserved.' }
    ],
    touch: {
      prompt: 'Switch between INNER JOIN and LEFT JOIN + COALESCE(-1) to see what happens to unmatched SKU Z-9999 ($94.95 total):',
      type: 'toggle',
      offLabel: 'INNER JOIN (Strict Match Only)',
      onLabel: 'LEFT JOIN + COALESCE(product_sk, -1)',
      offReadout: '2 real sales of SKU Z-9999 ($94.95) silently dropped! Finance totals will not match.',
      onReadout: 'All 14 sales preserved! Unmatched Z-9999 maps cleanly to product_sk = -1 (Unknown).'
    },
    spell: {
      mode: 'pg',
      pgChallengeId: 'pg4-leftjoin',
      peekTable: 'stg_pos_sales',
      autoPeek: false,
      intro: 'Fix the starter query in PostgreSQL 18 so all 14 rows of stg_pos_sales survive, matching active products and using -1 when unmatched.',
      helpers: [
        { label: 'COALESCE(p.product_sk, -1)', find: 'p.product_sk', replace: 'COALESCE(p.product_sk, -1) AS product_sk' },
        { label: 'JOIN → LEFT JOIN', find: '\nJOIN dim_product', replace: '\nLEFT JOIN dim_product' },
        { label: 'Move is_active into ON', find: 'ON p.sku_code = s.sku\nWHERE p.is_active', replace: 'ON p.sku_code = s.sku AND p.is_active' }
      ]
    },
    koan: 'Use LEFT JOIN with an Unknown (-1) surrogate key—and put dimension filters in the ON clause, not WHERE.',
    worldUpgrade: 'Stage 5 active: Facts and Dimensions join safely with zero silently dropped revenue.'
  },
  {
    id: 'l6-bulkload',
    num: 6,
    roman: '6',
    stageLabel: 'Bulk Load',
    title: 'Loading Fast & Retrying Safely',
    subtitle: 'PostgreSQL COPY, SSIS Fast Load & ON CONFLICT upserts',
    level: 'Intermediate → Advanced',
    tech: 'PostgreSQL COPY · SSIS Fast Load · Idempotency',
    audio: 'audio/ch06.mp3',
    durationSec: 18,
    narration: 'Inserting fifty million rows one at a time takes all night. Streaming them in bulk with PostgreSQL COPY or SSIS Fast Load finishes in a fraction of the time. Add ON CONFLICT DO UPDATE so if a job fails halfway, you can safely rerun it with zero duplicate errors.',
    cues: [
      { at: 0.0, scene: 'teacup', caption: 'Row-by-row INSERTs take ~14 hours to load 50 million historical rows.' },
      { at: 5.0, scene: 'aqueduct', caption: 'Bulk streaming (PostgreSQL COPY / SSIS Fast Load) moves buffers 50–85× faster.' },
      { at: 11.8, scene: 'idempotent-wheel', caption: 'ON CONFLICT DO UPDATE makes every load retry-safe with zero duplicate-key crashes.' }
    ],
    touch: {
      prompt: 'Enable each bulk-loading optimization below and watch a 50-million-row historical backfill drop from 14 hours to 2.5 hours:',
      type: 'backfill',
      toggles: [
        { id: 'copy', label: 'PostgreSQL COPY / SSIS Fast Load', delta: -7.5, note: 'Streams raw buffers instead of per-row INSERT round-trips' },
        { id: 'idx', label: 'Drop & Rebuild Secondary Indexes Once', delta: -2.5, note: 'Avoids updating B-Trees 50 million separate times mid-load' },
        { id: 'par', label: '4 Parallel Year-Chunk Workers', delta: -1.5, note: 'High throughput without overloading the source ERP database' }
      ]
    },
    spell: {
      mode: 'pg',
      pgChallengeId: 'pg10-upsert',
      peekTable: 'stg_work_orders',
      autoPeek: false,
      intro: 'Make this work-order load safe to rerun in real PostgreSQL 18. The checker runs your SQL TWICE to verify zero duplicate-key errors.',
      helpers: [
        { label: 'COALESCE(scrap_qty, 0)', find: 'SELECT wo_id, split_seq, good_qty, scrap_qty', replace: 'SELECT wo_id, split_seq, good_qty, COALESCE(scrap_qty, 0)' },
        { label: 'ON CONFLICT (wo_id, split_seq)', insert: '\nON CONFLICT (wo_id, split_seq)' },
        { label: 'DO UPDATE SET ...', insert: '\nDO UPDATE SET good_qty = EXCLUDED.good_qty, scrap_qty = EXCLUDED.scrap_qty' }
      ]
    },
    koan: 'Stream bulk data with COPY or Fast Load, and make every write idempotent so retries are always safe.',
    metrics: ['14.0h → 2.5h backfill', '85× bulk throughput', '0 duplicates on retry'],
    worldUpgrade: 'Stage 6 active: High-speed bulk streaming and retry-proof upserts protect nightly pipelines.'
  },
  {
    id: 'l7-dialects',
    num: 7,
    roman: '7',
    stageLabel: 'Dialects',
    title: 'SQL Server (T-SQL) vs. PostgreSQL',
    subtitle: 'Translate syntax cleanly & avoid migration traps',
    level: 'Intermediate',
    tech: 'T-SQL ↔ PostgreSQL Translation',
    audio: 'audio/ch07.mp3',
    durationSec: 23,
    narration: 'SQL Server and PostgreSQL share the same core logic, just slightly different words. TOP becomes LIMIT, ISNULL becomes COALESCE, and GETDATE becomes CURRENT_DATE. Watch out for one subtle difference: PostgreSQL text matching is case-sensitive, and MVCC snapshots mean you never need NOLOCK.',
    cues: [
      { at: 0.0, scene: 'two-arches', caption: 'SQL Server and PostgreSQL share the same core SQL—just slightly different keywords.' },
      { at: 6.5, scene: 'case-trap', caption: 'TOP → LIMIT · ISNULL → COALESCE · GETDATE() → CURRENT_DATE.' },
      { at: 14.5, scene: 'unified-stream', caption: 'Remember: PostgreSQL is case-sensitive by default, and MVCC replaces WITH (NOLOCK).' }
    ],
    touch: {
      prompt: 'Switch between SQL Server (T-SQL), PostgreSQL, and side-by-side comparison to see the 5 most common translations:',
      type: 'dialect-flip',
      pairs: [
        { concept: 'Row Limit', tsql: 'SELECT TOP 5 * FROM sales;', pg: 'SELECT * FROM sales LIMIT 5;' },
        { concept: 'Null Default', tsql: 'ISNULL(scrap_qty, 0)', pg: 'COALESCE(scrap_qty, 0)' },
        { concept: 'Current Date', tsql: 'CAST(GETDATE() AS DATE)', pg: 'CURRENT_DATE' },
        { concept: 'Upsert', tsql: 'MERGE INTO tgt USING src ...', pg: 'INSERT ... ON CONFLICT DO UPDATE' },
        { concept: 'Text Casing', tsql: "sku = 'a-9042' (case-insensitive)", pg: "LOWER(sku) = 'a-9042' (case-sensitive!)" }
      ]
    },
    spell: {
      mode: 'pg',
      pgChallengeId: 'pg6-translate',
      peekTable: 'stg_work_orders',
      autoPeek: false,
      intro: 'Run the starter query first to see the real PostgreSQL error, then translate TOP 3, ISNULL, and GETDATE() to idiomatic PostgreSQL 18.',
      helpers: [
        { label: 'ISNULL → COALESCE', find: 'ISNULL(', replace: 'COALESCE(' },
        { label: 'GETDATE() → CURRENT_DATE', find: 'CAST(GETDATE() AS DATE)', replace: 'CURRENT_DATE' },
        { label: 'TOP 3 → LIMIT 3', find: 'SELECT TOP 3 ', replace: 'SELECT ', append: '\nLIMIT 3' }
      ]
    },
    koan: 'Prefer ANSI-standard SQL like COALESCE, and always watch text case-sensitivity when migrating to PostgreSQL.',
    worldUpgrade: 'Stage 7 active: You can translate smoothly between SQL Server and PostgreSQL without migration surprises.'
  },
  {
    id: 'l8-partitions',
    num: 8,
    roman: '8',
    stageLabel: 'Partitions',
    title: 'Making Large Tables Fast',
    subtitle: 'Monthly range partitioning, sargable dates & EXPLAIN',
    level: 'Advanced',
    tech: 'PostgreSQL Partitioning & Query Plans',
    audio: 'audio/ch08.mp3',
    durationSec: 19,
    narration: 'If you only need March sales, you should not read six years of history. Partitioning splits huge tables into monthly chunks so PostgreSQL skips everything else. Just never wrap the date column in a function—write clean greater-than-or-equal and less-than bounds so the planner prunes partitions automatically.',
    cues: [
      { at: 0.0, scene: '72-shelves', caption: 'Reading an unpartitioned 42M-row table scans all 72 months (~21.4 seconds).' },
      { at: 5.8, scene: 'pruned-drawer', caption: 'Monthly range partitioning lets PostgreSQL read only the requested month (~1.4 seconds).' },
      { at: 12.0, scene: 'sargable-key', caption: 'Keep WHERE predicates sargable (>= start AND < next) — never wrap event_ts in EXTRACT().' }
    ],
    touch: {
      prompt: 'Switch between wrapped EXTRACT() and sargable range bounds, then drag the month slider across 72 monthly partitions:',
      type: 'partitions'
    },
    spell: {
      mode: 'pg',
      pgChallengeId: 'pg12-sargable',
      peekTable: 'fact_shop_floor_events',
      autoPeek: false,
      intro: 'Rewrite the March-2022 query so the REAL PostgreSQL 18 EXPLAIN plan skips 11 partitions and reads only 1.',
      helpers: [
        { label: "event_ts >= '2022-03-01'", find: 'EXTRACT(YEAR FROM event_ts) = 2022', replace: "event_ts >= '2022-03-01'" },
        { label: "event_ts < '2022-04-01'", find: 'EXTRACT(MONTH FROM event_ts) = 3', replace: "event_ts < '2022-04-01'" }
      ]
    },
    koan: 'Never wrap an indexed or partitioned column in a function inside WHERE—use half-open range bounds (>= and <).',
    metrics: ['21.4s → 1.4s query', '91.7% partitions pruned', 'Real EXPLAIN verified'],
    worldUpgrade: 'Stage 8 active: Partition pruning skips 98%+ of irrelevant historical data on large analytical queries.'
  },
  {
    id: 'l9-reconcile',
    num: 9,
    roman: '9',
    stageLabel: 'Audit',
    title: 'Verifying Pipeline Accuracy',
    subtitle: 'Reconcile source vs. warehouse totals with fan-out-safe CTEs',
    level: 'Advanced → Production',
    tech: 'CTEs · Reconciliation & Auditing',
    audio: 'audio/ch09.mp3',
    durationSec: 18,
    narration: 'Before anyone trusts a new pipeline, compare your warehouse totals against the legacy source system. Never join two raw detail tables before summing, or matching rows multiply and inflate your numbers. Aggregate each side inside its own CTE first, then compare totals side by side.',
    cues: [
      { at: 0.0, scene: 'distorted-mirror', caption: 'Joining two raw tables before summing multiplies matching rows and corrupts totals.' },
      { at: 5.8, scene: 'two-baskets', caption: 'Aggregate each side in its own CTE first so every store has exactly 1 row per side.' },
      { at: 12.2, scene: 'lantern-lit', caption: 'Join the two summaries to pinpoint the exact mismatched store with 100% precision.' }
    ],
    touch: {
      prompt: 'Compare joining raw tables directly vs. aggregating each side in a CTE first. Watch how fan-out creates false alarms:',
      type: 'toggle',
      offLabel: 'Naive Raw JOIN → SUM()',
      onLabel: 'Aggregate-First CTEs → JOIN',
      offReadout: 'Store 12 register total multiplied ×4 rows! False alarm hides the real $25.00 Store 19 discrepancy.',
      onReadout: 'Exact match! Store 12 = $0.00 variance; real $25.00 mismatch at Store 19 isolated cleanly.'
    },
    spell: {
      mode: 'pg',
      pgChallengeId: 'pg7-recon',
      peekTable: 'pos_eod_summary',
      autoPeek: false,
      intro: 'Write a fan-out-safe CTE reconciliation in real PostgreSQL 18 to find the one mismatched store (Store 19, variance 25.00).',
      helpers: [
        { label: 'Scaffold CTE Structure', replaceAll: `WITH legacy AS (\n  SELECT store_id, SUM(pos_eod_total) AS legacy_total\n  FROM pos_eod_summary\n  GROUP BY store_id\n), dw AS (\n  SELECT store_id, SUM(net_amount) AS dw_total\n  FROM stg_pos_sales\n  GROUP BY store_id\n)\nSELECT l.store_id, l.legacy_total, d.dw_total,\n       ABS(l.legacy_total - d.dw_total) AS variance\nFROM legacy l\nJOIN dw d USING (store_id)\n-- add WHERE filter for mismatched stores\n;` },
        { label: 'WHERE ABS(...) > 0', insert: 'WHERE ABS(l.legacy_total - d.dw_total) > 0' }
      ]
    },
    koan: 'Aggregate each table to the same grain in its own CTE before joining—otherwise 1-to-many joins multiply your sums.',
    metrics: ['0× join fan-out', '100% ledger parity', 'Exact $25 variance caught'],
    worldUpgrade: 'Track 1 complete! End-to-end automated reconciliation verifies 100% parity across your core pipeline.'
  },
  /* ==================== TRACK 2: ANALYTICAL SQL & MODELING (L10–L15) ==================== */
  {
    id: 'l10-windows',
    track: 2,
    num: 10,
    roman: '10',
    stageLabel: 'Windows',
    title: 'Window Functions & Running Totals',
    subtitle: 'Compute cumulative metrics with OVER() without collapsing rows',
    level: 'Intermediate',
    tech: 'PostgreSQL · Window Functions',
    audio: 'audio/ch10.mp3',
    durationSec: 19,
    narration: 'GROUP BY collapses rows down to one line per store. Sometimes you want to keep every individual transaction visible while still showing the cumulative running total beside it. Window functions use OVER with PARTITION BY and ORDER BY to calculate across neighboring rows without losing a single detail row.',
    cues: [
      { at: 0.0, scene: 'groupby-collapse', caption: 'GROUP BY collapses detail rows into one summary line per store.' },
      { at: 5.5, scene: 'window-keep', caption: 'Window functions keep every transaction row while calculating a cumulative total beside it.' },
      { at: 11.5, scene: 'running-sum', caption: 'Use SUM(net_amount) OVER (PARTITION BY store_id ORDER BY txn_ts) to reset totals per store.' }
    ],
    touch: {
      prompt: 'Compare GROUP BY against SUM() OVER (PARTITION BY store_id ORDER BY txn_ts) on Store 12 transactions:',
      type: 'window-slide'
    },
    spell: {
      mode: 'pg',
      pgChallengeId: 'pg9-running',
      peekTable: 'stg_pos_sales',
      autoPeek: false,
      intro: 'Add a running_total column per store in transaction-time order using a window function in real PostgreSQL 18.',
      helpers: [
        { label: 'SUM(net_amount) OVER (...)', insert: ',\n       SUM(net_amount) OVER (PARTITION BY store_id ORDER BY txn_ts) AS running_total', target: 'select' }
      ]
    },
    koan: 'GROUP BY collapses rows; window functions with OVER() compute totals across rows while preserving every detail row.',
    worldUpgrade: 'Track 2 Stage 1 active: Analytical window frames now compute running totals and trends without losing row grain.'
  },
  {
    id: 'l11-dedup',
    track: 2,
    num: 11,
    roman: '11',
    stageLabel: 'Dedup',
    title: 'Deduplicating Versions with ROW_NUMBER()',
    subtitle: 'Keep only the latest snapshot per business key cleanly',
    level: 'Intermediate',
    tech: 'PostgreSQL · CTEs & Ranking Windows',
    audio: 'audio/ch11.mp3',
    durationSec: 19,
    narration: 'Staging tables often receive multiple updates for the same product over weeks or months. To keep only the newest record per SKU, assign a sequential rank with ROW_NUMBER partitioned by SKU and ordered by updated_at descending. Then wrap it in a CTE and filter where row number equals one.',
    cues: [
      { at: 0.0, scene: 'multi-ver', caption: 'Vendor feeds often stack multiple historical updates for the same SKU in staging.' },
      { at: 5.8, scene: 'rank-rows', caption: 'ROW_NUMBER() OVER (PARTITION BY sku ORDER BY updated_at DESC) numbers newest rows as 1.' },
      { at: 11.8, scene: 'keep-rn1', caption: 'Filter WHERE rn = 1 in a CTE to emit one clean, latest row per SKU.' }
    ],
    touch: {
      prompt: 'Rank the 8 versioned rows in stg_vendor_products with ROW_NUMBER() and filter to rn = 1 to see how deduplication works:',
      type: 'dedup-rank'
    },
    spell: {
      mode: 'pg',
      pgChallengeId: 'pg5-rownumber',
      peekTable: 'stg_vendor_products',
      autoPeek: true,
      intro: 'Deduplicate stg_vendor_products in PostgreSQL 18 so only the latest version (newest updated_at) of each SKU is returned.',
      helpers: [
        { label: 'Scaffold ranked CTE', replaceAll: `WITH ranked AS (\n  SELECT sku, category, unit_price,\n         ROW_NUMBER() OVER (PARTITION BY sku ORDER BY updated_at DESC) AS rn\n  FROM stg_vendor_products\n)\nSELECT sku, category, unit_price\nFROM ranked\n-- filter to latest version\n;` },
        { label: 'WHERE rn = 1', insert: 'WHERE rn = 1' }
      ]
    },
    koan: 'Deduplicate staged feeds deterministically with ROW_NUMBER() OVER (PARTITION BY key ORDER BY updated_at DESC) and WHERE rn = 1.',
    worldUpgrade: 'Track 2 Stage 2 active: Multi-version vendor feeds now collapse deterministically to the single latest state.'
  },
  {
    id: 'l12-scd2',
    track: 2,
    num: 12,
    roman: '12',
    stageLabel: 'SCD-2',
    title: 'Slowly Changing Dimensions (SCD Type 2)',
    subtitle: 'Join historical facts to the exact version active on that date',
    level: 'Advanced',
    tech: 'Dimensional Modeling · Temporal Joins',
    audio: 'audio/ch12.mp3',
    durationSec: 20,
    narration: 'Product prices and customer tiers change over time. If you only join sales to the current dimension row, last month\'s reports quietly rewrite history with today\'s price. Slowly Changing Dimension Type 2 stores valid-from and valid-to dates so every past transaction joins to the exact version active on that day.',
    cues: [
      { at: 0.0, scene: 'price-change', caption: 'Prices changed on Nov 15: A-9042 rose from $22.99 to $24.99, B-2210 from $115 to $120.' },
      { at: 6.0, scene: 'naive-current', caption: 'Joining on is_current = TRUE rewrites Nov 14 history using Nov 15 prices.' },
      { at: 12.0, scene: 'between-dates', caption: 'Join with s.txn_ts::date BETWEEN d.valid_from AND d.valid_to to preserve exact history.' }
    ],
    touch: {
      prompt: 'Compare joining on is_current against a point-in-time BETWEEN valid_from AND valid_to join as dates cross the Nov 15 price change:',
      type: 'scd2-timeline'
    },
    spell: {
      mode: 'pg',
      pgChallengeId: 'pg14-scd2',
      peekTable: 'dim_product_scd2',
      autoPeek: true,
      intro: 'Fix the join against dim_product_scd2 in PostgreSQL 18 so every sale matches the unit_price active on its UTC sale date.',
      helpers: [
        { label: 'Replace is_current with BETWEEN', find: 'AND d.is_current', replace: '\n AND s.txn_ts::date BETWEEN d.valid_from AND d.valid_to' }
      ]
    },
    koan: 'Never join historical facts on is_current = TRUE; use point-in-time range joins (event_date BETWEEN valid_from AND valid_to).',
    metrics: ['0 retroactive price drift', 'Exact point-in-time joins', 'Audit-grade history'],
    worldUpgrade: 'Track 2 Stage 3 active: Historical analytics preserve point-in-time truth across price and attribute changes.'
  },
  {
    id: 'l13-timezone',
    track: 2,
    num: 13,
    roman: '13',
    stageLabel: 'Timezones',
    title: 'Timezones & Business-Day Cutoffs',
    subtitle: 'Store in UTC, report in local store time with AT TIME ZONE',
    level: 'Advanced',
    tech: 'PostgreSQL · TIMESTAMPTZ & DST',
    audio: 'audio/ch13.mp3',
    durationSec: 19,
    narration: 'Always store timestamps in UTC so servers never argue over clocks. But when Finance asks for Tuesday\'s store revenue, a nine-thirty PM sale in Dallas is already three-thirty AM Wednesday in UTC. Convert with AT TIME ZONE before casting to a date so evening sales land on the right business day.',
    cues: [
      { at: 0.0, scene: 'utc-store', caption: 'Store timestamps in UTC—but remember local evening sales cross UTC midnight early.' },
      { at: 5.8, scene: 'utc-drift', caption: '9:30 PM CST on Nov 14 is stored as 03:30 UTC on Nov 15—casting raw UTC shifts the day!' },
      { at: 11.8, scene: 'local-cast', caption: "Convert with (txn_ts AT TIME ZONE 'America/Chicago')::date before grouping daily sales." }
    ],
    touch: {
      prompt: 'Switch Store 12 between raw UTC dates and US Central (America/Chicago) local dates. Watch evening sale T-1003 ($45.00):',
      type: 'tz-shift'
    },
    spell: {
      mode: 'pg',
      pgChallengeId: 'pg11-timezone',
      peekTable: 'pos_eod_summary',
      autoPeek: false,
      intro: 'Fix Store 12\'s daily totals in PostgreSQL 18 by converting txn_ts from UTC to America/Chicago before casting to DATE.',
      helpers: [
        { label: "AT TIME ZONE 'America/Chicago'", find: 'txn_ts::date', replace: "(txn_ts AT TIME ZONE 'America/Chicago')::date" }
      ]
    },
    koan: 'Store raw events in TIMESTAMPTZ (UTC), and always apply AT TIME ZONE before truncating or casting to a local business date.',
    worldUpgrade: 'Track 2 Stage 4 active: Local business-day rollups now align cleanly with store registers across timezones.'
  },
  {
    id: 'l14-recursive',
    track: 2,
    num: 14,
    roman: '14',
    stageLabel: 'Recursive',
    title: 'Recursive Hierarchies (WITH RECURSIVE)',
    subtitle: 'Explode nested assemblies, org charts & trees in pure SQL',
    level: 'Expert',
    tech: 'PostgreSQL · Recursive CTEs',
    audio: 'audio/ch14.mp3',
    durationSec: 18,
    narration: 'Some data forms trees of arbitrary depth—like a pump made of housings, brackets, and bolts, or managers reporting to directors. A regular join only steps one level deep. WITH RECURSIVE combines a starting anchor query with a recursive step that walks every branch down to the final leaf parts.',
    cues: [
      { at: 0.0, scene: 'bom-root', caption: 'PUMP-100 contains direct parts AND nested sub-assemblies like HOUSING-5 and MOTOR-20.' },
      { at: 6.2, scene: 'bom-expand', caption: 'Each recursive step multiplies quantities down the tree (2 brackets × 2 bolts = 4 bolts).' },
      { at: 12.4, scene: 'bom-leaves', caption: 'Keep only leaf parts (no children) and SUM totals: 1 pump needs 22 BOLT-M8 total!' }
    ],
    touch: {
      prompt: 'Expand the PUMP-100 Bill of Materials one level at a time to see why a single query misses 14 nested bolts:',
      type: 'bom-tree'
    },
    spell: {
      mode: 'pg',
      pgChallengeId: 'pg13-bom',
      peekTable: 'bom',
      autoPeek: true,
      intro: 'Write a WITH RECURSIVE CTE in PostgreSQL 18 to compute the total quantity of every leaf component needed to build one PUMP-100.',
      helpers: [
        { label: 'Scaffold WITH RECURSIVE explode', replaceAll: `WITH RECURSIVE explode AS (\n  SELECT child_part, qty_per::numeric AS total_qty\n  FROM bom\n  WHERE parent_part = 'PUMP-100'\n  UNION ALL\n  SELECT b.child_part, e.total_qty * b.qty_per\n  FROM explode e\n  JOIN bom b ON b.parent_part = e.child_part\n)\nSELECT child_part, SUM(total_qty) AS total_qty\nFROM explode e\n-- keep leaf parts only + GROUP BY\n;` },
        { label: 'WHERE NOT EXISTS (leaves) + GROUP BY', insert: 'WHERE NOT EXISTS (SELECT 1 FROM bom b WHERE b.parent_part = e.child_part)\nGROUP BY child_part' }
      ]
    },
    koan: 'A recursive CTE needs an anchor term, UNION ALL with a self-join step, and matching column types across both branches.',
    worldUpgrade: 'Track 2 Stage 5 active: Multi-level manufacturing BOMs and graph hierarchies resolve in a single SQL query.'
  },
  {
    id: 'l15-jsonb',
    track: 2,
    num: 15,
    roman: '15',
    stageLabel: 'JSONB',
    title: 'Semi-Structured JSONB Pipelines',
    subtitle: 'Flatten nested API & webhook arrays into clean relational tables',
    level: 'Expert',
    tech: 'PostgreSQL · JSONB & LATERAL Unnest',
    audio: 'audio/ch15.mp3',
    durationSec: 23,
    narration: 'Modern APIs and webhooks rarely arrive as flat tables—they send nested JSON objects with arrays of line items inside. PostgreSQL stores these cleanly as binary JSONB. Use the arrow operators to pull out fields and CROSS JOIN LATERAL with jsonb_array_elements to turn nested arrays into crisp, queryable rows.',
    cues: [
      { at: 0.0, scene: 'raw-json', caption: 'Webhooks arrive as nested JSONB payloads containing customer objects and items arrays.' },
      { at: 6.0, scene: 'lateral-unnest', caption: "Use -> and ->> to extract fields, and CROSS JOIN LATERAL jsonb_array_elements() to unnest arrays." },
      { at: 12.2, scene: 'flat-rows', caption: 'Cast extracted text to INT/NUMERIC so downstream aggregations run at full native speed.' }
    ],
    touch: {
      prompt: 'Step through flattening raw_webhook_orders from raw JSONB documents into queryable order line items:',
      type: 'jsonb-unnest'
    },
    spell: {
      mode: 'pg',
      pgChallengeId: 'pg15-jsonb',
      peekTable: 'raw_webhook_orders',
      autoPeek: true,
      intro: 'Unnest the items array from raw_webhook_orders in PostgreSQL 18 and calculate line_total = qty * price for each order item.',
      helpers: [
        { label: 'Extract sku, qty, line_total', insert: ",\n       item->>'sku' AS sku,\n       (item->>'qty')::int AS qty,\n       (item->>'qty')::int * (item->>'price')::numeric AS line_total", target: 'select' },
        { label: 'CROSS JOIN LATERAL jsonb_array_elements', find: "-- CROSS JOIN LATERAL jsonb_array_elements(w.payload->'items') AS item", replace: "CROSS JOIN LATERAL jsonb_array_elements(w.payload->'items') AS item" },
        { label: 'ORDER BY order_id, sku', find: 'ORDER BY order_id;', replace: 'ORDER BY order_id, sku;' }
      ]
    },
    koan: 'Use -> for nested JSON objects, ->> for text values, and CROSS JOIN LATERAL jsonb_array_elements() to unnest arrays safely.',
    metrics: ['3 nested JSONB → 5 typed rows', 'Native numeric math', 'API/webhook ready'],
    worldUpgrade: 'Track 2 Complete! You now command analytical SQL, SCD-2 history, timezones, recursive hierarchies, and JSONB pipelines.'
  }
];

// Assign track: 1 to Lessons 2..9 automatically if omitted
ZenChapters.forEach(c => { if (!c.track) c.track = c.num <= 9 ? 1 : 2; });

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ZenChapters;
  module.exports.ZenTracks = ZenTracks;
}
if (typeof window !== 'undefined') {
  window.ZenChapters = ZenChapters;
  window.ZenTracks = ZenTracks;
}
