/* Data Lab — 9 First-Principles Lessons (Day-1 Beginner → Production Data Engineering)
 * Calm, single-focus flow: Watch -> Explore Visually -> Practice (Real Postgres 18 / Python) -> Takeaway.
 * Plain, concrete engineering language throughout; PostgreSQL, SQL Server, SSIS & Python learned in natural progression.
 */
const ZenChapters = [
  {
    id: 'l1-filter',
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
    worldUpgrade: 'Stage 9 active: End-to-end automated reconciliation verifies 100% parity across your entire data pipeline!'
  }
];

if (typeof module !== 'undefined' && module.exports) module.exports = ZenChapters;
if (typeof window !== 'undefined') window.ZenChapters = ZenChapters;
