/* Data Engineering Academy — Real PostgreSQL Lab (PGlite: PostgreSQL compiled to WASM, runs 100% in the browser)
 * - Seeds a realistic retail + manufacturing schema (incl. a 12-partition shop-floor table)
 * - Grades challenges by comparing YOUR result set with the reference solution's result set (no regex guessing)
 * - Challenge runs are wrapped in BEGIN/ROLLBACK so the seed data always stays pristine
 * Works in the browser (window.PgLab) and in Node for tests (module.exports). */
const PgLab = {
  db: null,
  ready: false,
  version: '',

  SEED_SQL: `
SET TimeZone = 'UTC';

CREATE TABLE dim_store (
  store_id   INT PRIMARY KEY,
  store_name TEXT NOT NULL,
  region     TEXT NOT NULL
);
INSERT INTO dim_store VALUES
  (7,  'Austin North',   'TX-Central'),
  (12, 'Dallas Uptown',  'TX-North'),
  (19, 'Houston Galleria','TX-South'),
  (24, 'San Antonio Pearl','TX-Central'),
  (31, 'Fort Worth West', 'TX-North');

CREATE TABLE dim_product (
  product_sk INT PRIMARY KEY,
  sku_code   TEXT NOT NULL,
  category   TEXT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  is_active  BOOLEAN NOT NULL,
  updated_at DATE NOT NULL
);
INSERT INTO dim_product VALUES
  (101, 'A-9042', 'Apparel',          24.99, TRUE,  '2021-11-10'),
  (102, 'A-9042', 'Apparel (Legacy)', 22.99, FALSE, '2021-06-01'),
  (103, 'B-2210', 'Footwear',        120.00, TRUE,  '2021-11-01'),
  (104, 'C-5501', 'Accessories',      45.00, TRUE,  '2021-10-15'),
  (105, 'D-7310', 'Home',             12.25, TRUE,  '2021-11-05'),
  (106, 'E-1180', 'Apparel',          29.00, TRUE,  '2021-09-30'),
  (107, 'F-6620', 'Home',             15.75, TRUE,  '2021-10-02'),
  (108, 'G-4400', 'Footwear',         89.50, TRUE,  '2021-08-14'),
  (109, 'H-3030', 'Accessories',      64.00, FALSE, '2021-03-22');

CREATE TABLE stg_vendor_products (
  sku        TEXT NOT NULL,
  category   TEXT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
INSERT INTO stg_vendor_products VALUES
  ('A-9042', 'Apparel',      23.99, '2021-10-01 09:00+00'),
  ('A-9042', 'Apparel',      24.99, '2021-11-10 09:00+00'),
  ('B-2210', 'Footwear',    115.00, '2021-09-15 09:00+00'),
  ('B-2210', 'Footwear',    120.00, '2021-11-01 09:00+00'),
  ('B-2210', 'Footwear',    118.00, '2021-10-01 09:00+00'),
  ('C-5501', 'Accessories',  45.00, '2021-10-15 09:00+00'),
  ('D-7310', 'Home',         12.25, '2021-11-05 09:00+00'),
  ('D-7310', 'Home',         11.50, '2021-08-20 09:00+00');

CREATE TABLE stg_pos_sales (
  txn_id     TEXT PRIMARY KEY,
  store_id   INT NOT NULL,
  sku        TEXT NOT NULL,
  qty        INT NOT NULL,
  net_amount NUMERIC(10,2) NOT NULL,
  txn_ts     TIMESTAMPTZ NOT NULL  -- stored in UTC, stores operate on US Central time
);
INSERT INTO stg_pos_sales VALUES
  ('T-1001', 12, 'A-9042', 2,  49.98, '2021-11-14 15:05+00'),
  ('T-1002', 12, 'B-2210', 1, 120.00, '2021-11-14 18:40+00'),
  ('T-1003', 12, 'C-5501', 1,  45.00, '2021-11-15 03:30+00'),
  ('T-1004', 12, 'D-7310', 3,  36.75, '2021-11-15 16:10+00'),
  ('T-1005', 19, 'Z-9999', 3,  75.00, '2021-11-14 14:20+00'),
  ('T-1006', 19, 'A-9042', 1,  24.99, '2021-11-14 20:15+00'),
  ('T-1007', 19, 'E-1180', 2,  58.00, '2021-11-15 17:45+00'),
  ('T-1008', 24, 'C-5501', 4, 180.00, '2021-11-14 16:00+00'),
  ('T-1009', 24, 'B-2210', 1, 120.00, '2021-11-15 19:30+00'),
  ('T-1010', 24, 'F-6620', 2,  31.50, '2021-11-16 02:10+00'),
  ('T-1011',  7, 'A-9042', 1,  24.99, '2021-11-14 17:00+00'),
  ('T-1012',  7, 'Z-9999', 1,  19.95, '2021-11-15 15:25+00'),
  ('T-1013', 31, 'D-7310', 2,  24.50, '2021-11-14 21:00+00'),
  ('T-1014', 31, 'E-1180', 1,  29.00, '2021-11-15 22:40+00');

CREATE TABLE pos_eod_summary (
  store_id      INT NOT NULL,
  biz_date      DATE NOT NULL,
  pos_eod_total NUMERIC(10,2) NOT NULL,
  PRIMARY KEY (store_id, biz_date)
);
INSERT INTO pos_eod_summary
SELECT store_id, (txn_ts AT TIME ZONE 'America/Chicago')::date, SUM(net_amount)
FROM stg_pos_sales GROUP BY 1, 2;
-- A real-world discrepancy hiding in the legacy register totals:
UPDATE pos_eod_summary SET pos_eod_total = pos_eod_total + 25.00
WHERE store_id = 19 AND biz_date = '2021-11-14';

CREATE TABLE stg_work_orders (
  wo_id       TEXT NOT NULL,
  split_seq   INT NOT NULL,
  plant       TEXT NOT NULL,
  planned_qty INT NOT NULL,
  good_qty    INT NOT NULL,
  scrap_qty   INT,
  status      TEXT NOT NULL
);
INSERT INTO stg_work_orders VALUES
  ('WO-8821', 1, 'Plant-2', 500, 280,   12, 'CLOSED'),
  ('WO-8821', 2, 'Plant-2', 500, 205,    3, 'CLOSED'),
  ('WO-8822', 1, 'Plant-1', 300, 294, NULL, 'CLOSED'),
  ('WO-8823', 1, 'Plant-2', 400, 390,   10, 'OPEN'),
  ('WO-8824', 1, 'Plant-1', 250, 241, NULL, 'CLOSED'),
  ('WO-8825', 1, 'Plant-1', 600, 575,   18, 'CLOSED');

CREATE TABLE fact_work_orders (
  wo_id      TEXT NOT NULL,
  split_seq  INT NOT NULL,
  good_qty   INT NOT NULL,
  scrap_qty  INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (wo_id, split_seq)
);
INSERT INTO fact_work_orders (wo_id, split_seq, good_qty, scrap_qty) VALUES
  ('WO-8821', 1, 250, 12),
  ('WO-8822', 1, 290, 0);

CREATE TABLE bom (
  parent_part TEXT NOT NULL,
  child_part  TEXT NOT NULL,
  qty_per     NUMERIC(10,2) NOT NULL
);
INSERT INTO bom VALUES
  ('PUMP-100',  'HOUSING-5', 1),
  ('PUMP-100',  'MOTOR-20',  1),
  ('PUMP-100',  'BOLT-M8',   8),
  ('MOTOR-20',  'ROTOR-3',   1),
  ('MOTOR-20',  'BOLT-M8',   4),
  ('MOTOR-20',  'WIRE-1M',   2),
  ('HOUSING-5', 'GASKET-2',  2),
  ('HOUSING-5', 'BOLT-M8',   6),
  ('HOUSING-5', 'BRACKET-9', 2),
  ('BRACKET-9', 'BOLT-M8',   2);

CREATE TABLE fact_shop_floor_events (
  event_id     BIGINT NOT NULL,
  plant_id     INT NOT NULL,
  machine_id   INT NOT NULL,
  event_ts     TIMESTAMPTZ NOT NULL,
  downtime_sec INT NOT NULL
) PARTITION BY RANGE (event_ts);
CREATE TABLE fact_shop_floor_events_2022_01 PARTITION OF fact_shop_floor_events FOR VALUES FROM ('2022-01-01') TO ('2022-02-01');
CREATE TABLE fact_shop_floor_events_2022_02 PARTITION OF fact_shop_floor_events FOR VALUES FROM ('2022-02-01') TO ('2022-03-01');
CREATE TABLE fact_shop_floor_events_2022_03 PARTITION OF fact_shop_floor_events FOR VALUES FROM ('2022-03-01') TO ('2022-04-01');
CREATE TABLE fact_shop_floor_events_2022_04 PARTITION OF fact_shop_floor_events FOR VALUES FROM ('2022-04-01') TO ('2022-05-01');
CREATE TABLE fact_shop_floor_events_2022_05 PARTITION OF fact_shop_floor_events FOR VALUES FROM ('2022-05-01') TO ('2022-06-01');
CREATE TABLE fact_shop_floor_events_2022_06 PARTITION OF fact_shop_floor_events FOR VALUES FROM ('2022-06-01') TO ('2022-07-01');
CREATE TABLE fact_shop_floor_events_2022_07 PARTITION OF fact_shop_floor_events FOR VALUES FROM ('2022-07-01') TO ('2022-08-01');
CREATE TABLE fact_shop_floor_events_2022_08 PARTITION OF fact_shop_floor_events FOR VALUES FROM ('2022-08-01') TO ('2022-09-01');
CREATE TABLE fact_shop_floor_events_2022_09 PARTITION OF fact_shop_floor_events FOR VALUES FROM ('2022-09-01') TO ('2022-10-01');
CREATE TABLE fact_shop_floor_events_2022_10 PARTITION OF fact_shop_floor_events FOR VALUES FROM ('2022-10-01') TO ('2022-11-01');
CREATE TABLE fact_shop_floor_events_2022_11 PARTITION OF fact_shop_floor_events FOR VALUES FROM ('2022-11-01') TO ('2022-12-01');
CREATE TABLE fact_shop_floor_events_2022_12 PARTITION OF fact_shop_floor_events FOR VALUES FROM ('2022-12-01') TO ('2023-01-01');
INSERT INTO fact_shop_floor_events
SELECT g, 1 + (g % 2), 1 + (g % 30), TIMESTAMPTZ '2022-01-01 00:00+00' + (g - 1) * INTERVAL '525 seconds', (g * 37) % 600
FROM generate_series(1, 60000) AS g;
CREATE INDEX idx_sfe_plant_ts ON fact_shop_floor_events (plant_id, event_ts);
ANALYZE;
`,

  /* Lesson "Try it" snippets — every Postgres & SQL Server lesson gets a runnable PostgreSQL example. */
  TRY_IT: {
    'pg-beg': { label: 'Run in real PostgreSQL', sql: `-- Filtering, sorting & limiting
SELECT sku_code, category, unit_price
FROM dim_product
WHERE unit_price > 25.00
ORDER BY unit_price DESC
LIMIT 10;

-- Case-sensitivity gotcha: try it yourself
SELECT 'sku-1' = 'SKU-1'               AS raw_equal,
       LOWER('sku-1') = LOWER('SKU-1') AS normalized_equal;` },
    'pg-int': { label: 'Run in real PostgreSQL', sql: `WITH ranked AS (
  SELECT sku, category, unit_price, updated_at,
         ROW_NUMBER() OVER (PARTITION BY sku ORDER BY updated_at DESC) AS rn
  FROM stg_vendor_products
)
SELECT * FROM ranked ORDER BY sku, rn;  -- rn = 1 is the latest version of each SKU` },
    'pg-adv': { label: 'Run in real PostgreSQL', sql: `-- xmax = 0 means the row was INSERTED; otherwise it was UPDATED by ON CONFLICT
INSERT INTO fact_work_orders (wo_id, split_seq, good_qty, scrap_qty)
SELECT wo_id, split_seq, good_qty, COALESCE(scrap_qty, 0)
FROM stg_work_orders
ON CONFLICT (wo_id, split_seq)
DO UPDATE SET good_qty = EXCLUDED.good_qty, scrap_qty = EXCLUDED.scrap_qty
RETURNING wo_id, split_seq, good_qty, (xmax = 0) AS was_inserted;` },
    'pg-exp': { label: 'Run real EXPLAIN ANALYZE', sql: `-- Sargable range predicate: watch the planner prune 11 of 12 partitions
EXPLAIN (ANALYZE, COSTS OFF)
SELECT plant_id, SUM(downtime_sec) AS total_downtime
FROM fact_shop_floor_events
WHERE event_ts >= '2022-03-01' AND event_ts < '2022-04-01'
GROUP BY plant_id;` },
    'tsql-beg': { label: 'Run PostgreSQL equivalent', sql: `-- T-SQL: SELECT TOP (5) ..., ISNULL(...), CAST(GETDATE() AS DATE)
SELECT store_id, sku,
       COALESCE(qty, 0)  AS qty,         -- ISNULL  -> COALESCE
       txn_ts::date      AS utc_date,    -- CAST(x AS DATE) works too
       CURRENT_DATE      AS today        -- GETDATE() -> NOW() / CURRENT_DATE
FROM stg_pos_sales
ORDER BY txn_ts DESC
LIMIT 5;                                 -- TOP (5) -> LIMIT 5` },
    'tsql-int': { label: 'Run PostgreSQL equivalent', sql: `-- Star-schema load with an Unknown (-1) member: Z-9999 is not in dim_product yet
SELECT s.txn_id, s.sku,
       COALESCE(p.product_sk, -1) AS product_sk,
       st.store_name, s.net_amount
FROM stg_pos_sales s
LEFT JOIN dim_product p ON p.sku_code = s.sku AND p.is_active
JOIN dim_store st      ON st.store_id = s.store_id
ORDER BY s.txn_id;` },
    'tsql-adv': { label: 'Run MERGE in PostgreSQL', sql: `-- PostgreSQL 15+ supports the SQL-standard MERGE too (same idea as T-SQL MERGE)
MERGE INTO fact_work_orders AS tgt
USING (SELECT wo_id, split_seq, good_qty, COALESCE(scrap_qty, 0) AS scrap_qty FROM stg_work_orders) AS src
  ON tgt.wo_id = src.wo_id AND tgt.split_seq = src.split_seq
WHEN MATCHED THEN
  UPDATE SET good_qty = src.good_qty, scrap_qty = src.scrap_qty
WHEN NOT MATCHED THEN
  INSERT (wo_id, split_seq, good_qty, scrap_qty) VALUES (src.wo_id, src.split_seq, src.good_qty, src.scrap_qty);

SELECT * FROM fact_work_orders ORDER BY wo_id, split_seq;` },
    'tsql-exp': { label: 'Run index demo in PostgreSQL', sql: `-- Covering index (PostgreSQL INCLUDE works like SQL Server INCLUDE)
CREATE INDEX IF NOT EXISTS ix_sales_store_ts ON stg_pos_sales (store_id, txn_ts) INCLUDE (net_amount);
SET enable_seqscan = off;  -- tiny demo table: nudge the planner so you can see the index used
EXPLAIN (COSTS OFF)
SELECT store_id, txn_ts, net_amount FROM stg_pos_sales WHERE store_id = 12 ORDER BY txn_ts;
RESET enable_seqscan;` }
  },

  CHALLENGES: [
    {
      id: 'pg1-filter', level: 'Beginner', title: 'Filter, Sort & Project',
      prompt: 'Return sku_code, category and unit_price for ACTIVE products priced above 30.00, most expensive first.',
      hint: 'WHERE is_active AND unit_price > 30 … ORDER BY unit_price DESC',
      starter: `SELECT sku_code, category, unit_price\nFROM dim_product\n-- add WHERE + ORDER BY\n;`,
      solution: `SELECT sku_code, category, unit_price\nFROM dim_product\nWHERE is_active AND unit_price > 30\nORDER BY unit_price DESC;`,
      orderMatters: true
    },
    {
      id: 'pg2-agg', level: 'Beginner', title: 'Aggregate Sales per Store',
      prompt: 'Return store_id, txn_count (number of transactions) and total_sales (sum of net_amount) per store, highest total_sales first.',
      hint: 'COUNT(*) and SUM(net_amount) with GROUP BY store_id, then ORDER BY total_sales DESC.',
      starter: `SELECT store_id\nFROM stg_pos_sales\n;`,
      solution: `SELECT store_id, COUNT(*) AS txn_count, SUM(net_amount) AS total_sales\nFROM stg_pos_sales\nGROUP BY store_id\nORDER BY total_sales DESC;`,
      orderMatters: true
    },
    {
      id: 'pg3-dupes', level: 'Beginner', title: 'Detect Duplicate Business Keys',
      prompt: 'dim_product should have one row per sku_code. Return every sku_code that appears more than once, with its count (cnt).',
      hint: 'GROUP BY sku_code HAVING COUNT(*) > 1',
      starter: `SELECT sku_code, COUNT(*) AS cnt\nFROM dim_product\n-- GROUP BY … HAVING …\n;`,
      solution: `SELECT sku_code, COUNT(*) AS cnt\nFROM dim_product\nGROUP BY sku_code\nHAVING COUNT(*) > 1;`
    },
    {
      id: 'pg4-leftjoin', level: 'Intermediate', title: 'Never Drop Revenue: LEFT JOIN + Unknown (-1)',
      prompt: 'The starter query silently loses sales for SKU Z-9999 (not in dim_product yet). Return txn_id, sku, product_sk (use -1 when unmatched, only match ACTIVE products) and net_amount for ALL 14 sales.',
      hint: 'Switch to LEFT JOIN, move "p.is_active" into the ON clause, and COALESCE(p.product_sk, -1).',
      starter: `SELECT s.txn_id, s.sku, p.product_sk, s.net_amount\nFROM stg_pos_sales s\nJOIN dim_product p ON p.sku_code = s.sku\nWHERE p.is_active;`,
      solution: `SELECT s.txn_id, s.sku, COALESCE(p.product_sk, -1) AS product_sk, s.net_amount\nFROM stg_pos_sales s\nLEFT JOIN dim_product p ON p.sku_code = s.sku AND p.is_active;`
    },
    {
      id: 'pg5-rownumber', level: 'Intermediate', title: 'Deduplicate with ROW_NUMBER()',
      prompt: 'stg_vendor_products holds several versions per SKU. Return sku, category, unit_price for ONLY the most recent version (latest updated_at) of each SKU.',
      hint: 'CTE with ROW_NUMBER() OVER (PARTITION BY sku ORDER BY updated_at DESC) AS rn, then WHERE rn = 1.',
      starter: `SELECT sku, category, unit_price\nFROM stg_vendor_products;`,
      solution: `WITH ranked AS (\n  SELECT sku, category, unit_price,\n         ROW_NUMBER() OVER (PARTITION BY sku ORDER BY updated_at DESC) AS rn\n  FROM stg_vendor_products\n)\nSELECT sku, category, unit_price FROM ranked WHERE rn = 1;`
    },
    {
      id: 'pg6-translate', level: 'Intermediate', title: 'Translate T-SQL to PostgreSQL',
      prompt: 'This legacy SQL Server query fails in PostgreSQL. Translate it: top 3 work-order rows by good_qty with wo_id, split_seq, scrap_qty (NULL → 0) and today\'s load_date. Run the starter first to see the real error!',
      hint: 'TOP 3 → LIMIT 3 at the end · ISNULL → COALESCE · CAST(GETDATE() AS DATE) → CURRENT_DATE',
      starter: `SELECT TOP 3 wo_id, split_seq,\n       ISNULL(scrap_qty, 0) AS scrap_qty,\n       CAST(GETDATE() AS DATE) AS load_date\nFROM stg_work_orders\nORDER BY good_qty DESC;`,
      solution: `SELECT wo_id, split_seq,\n       COALESCE(scrap_qty, 0) AS scrap_qty,\n       CURRENT_DATE AS load_date\nFROM stg_work_orders\nORDER BY good_qty DESC\nLIMIT 3;`,
      orderMatters: true
    },
    {
      id: 'pg7-recon', level: 'Intermediate', title: 'Reconcile Without Join Fan-Out',
      prompt: 'Find stores whose legacy register totals (pos_eod_summary) do not match the warehouse (stg_pos_sales). Return store_id, legacy_total, dw_total, variance (absolute difference) — only mismatched stores. Beware: joining the raw tables first multiplies rows!',
      hint: 'Aggregate EACH side per store in its own CTE first, then JOIN the two summaries and filter ABS(legacy_total - dw_total) > 0.',
      starter: `SELECT e.store_id,\n       SUM(e.pos_eod_total) AS legacy_total,\n       SUM(s.net_amount)    AS dw_total\nFROM pos_eod_summary e\nJOIN stg_pos_sales s ON s.store_id = e.store_id\nGROUP BY e.store_id;`,
      solution: `WITH legacy AS (\n  SELECT store_id, SUM(pos_eod_total) AS legacy_total FROM pos_eod_summary GROUP BY store_id\n), dw AS (\n  SELECT store_id, SUM(net_amount) AS dw_total FROM stg_pos_sales GROUP BY store_id\n)\nSELECT l.store_id, l.legacy_total, d.dw_total, ABS(l.legacy_total - d.dw_total) AS variance\nFROM legacy l JOIN dw d USING (store_id)\nWHERE ABS(l.legacy_total - d.dw_total) > 0;`
    },
    {
      id: 'pg8-grain', level: 'Advanced', title: 'Fix Grain Inflation on Split Work Orders',
      prompt: 'WO-8821 was split into two rows that BOTH carry planned_qty = 500. Return wo_id, true_planned (planned once per work order) and total_good (all good_qty across splits).',
      hint: 'MAX(planned_qty) — not SUM — per wo_id, alongside SUM(good_qty).',
      starter: `SELECT wo_id, SUM(planned_qty) AS true_planned, SUM(good_qty) AS total_good\nFROM stg_work_orders\nGROUP BY wo_id;`,
      solution: `SELECT wo_id, MAX(planned_qty) AS true_planned, SUM(good_qty) AS total_good\nFROM stg_work_orders\nGROUP BY wo_id;`
    },
    {
      id: 'pg9-running', level: 'Advanced', title: 'Running Totals with Window Frames',
      prompt: 'Return txn_id, store_id, net_amount and running_total — the cumulative net_amount per store in transaction-time order.',
      hint: 'SUM(net_amount) OVER (PARTITION BY store_id ORDER BY txn_ts)',
      starter: `SELECT txn_id, store_id, net_amount\nFROM stg_pos_sales\nORDER BY store_id, txn_ts;`,
      solution: `SELECT txn_id, store_id, net_amount,\n       SUM(net_amount) OVER (PARTITION BY store_id ORDER BY txn_ts) AS running_total\nFROM stg_pos_sales\nORDER BY store_id, txn_ts;`
    },
    {
      id: 'pg10-upsert', level: 'Advanced', title: 'Idempotent Load with ON CONFLICT',
      prompt: 'Load stg_work_orders into fact_work_orders (wo_id, split_seq, good_qty, scrap_qty). Two rows already exist and scrap_qty is NOT NULL. The grader runs your SQL TWICE (like a retried nightly job) — it must never fail or duplicate.',
      hint: 'COALESCE(scrap_qty, 0) for NULLs, then ON CONFLICT (wo_id, split_seq) DO UPDATE SET good_qty = EXCLUDED.good_qty, scrap_qty = EXCLUDED.scrap_qty',
      starter: `INSERT INTO fact_work_orders (wo_id, split_seq, good_qty, scrap_qty)\nSELECT wo_id, split_seq, good_qty, scrap_qty\nFROM stg_work_orders;`,
      solution: `INSERT INTO fact_work_orders (wo_id, split_seq, good_qty, scrap_qty)\nSELECT wo_id, split_seq, good_qty, COALESCE(scrap_qty, 0)\nFROM stg_work_orders\nON CONFLICT (wo_id, split_seq)\nDO UPDATE SET good_qty = EXCLUDED.good_qty, scrap_qty = EXCLUDED.scrap_qty;`,
      mode: 'dml', runTwice: true,
      checkSql: `SELECT wo_id, split_seq, good_qty, scrap_qty FROM fact_work_orders ORDER BY wo_id, split_seq;`
    },
    {
      id: 'pg11-timezone', level: 'Expert', title: 'Timezone-Correct Business Dates',
      prompt: 'Store 12 operates on US Central time, but txn_ts is stored in UTC, so the starter puts an evening sale on the wrong day (compare with pos_eod_summary!). Return biz_date and daily_total for store 12 using the America/Chicago local date.',
      hint: '(txn_ts AT TIME ZONE \'America/Chicago\')::date AS biz_date',
      starter: `SELECT txn_ts::date AS biz_date, SUM(net_amount) AS daily_total\nFROM stg_pos_sales\nWHERE store_id = 12\nGROUP BY 1\nORDER BY 1;`,
      solution: `SELECT (txn_ts AT TIME ZONE 'America/Chicago')::date AS biz_date, SUM(net_amount) AS daily_total\nFROM stg_pos_sales\nWHERE store_id = 12\nGROUP BY 1\nORDER BY 1;`
    },
    {
      id: 'pg12-sargable', level: 'Expert', title: 'Make It Sargable: Partition Pruning',
      prompt: 'The starter returns the right March-2022 downtime per plant, but wrapping event_ts in EXTRACT() forces PostgreSQL to scan all 12 partitions. Rewrite it so the REAL query plan touches only the March partition (graded on results AND the EXPLAIN plan).',
      hint: 'Use a half-open range on the raw column: WHERE event_ts >= \'2022-03-01\' AND event_ts < \'2022-04-01\'',
      starter: `SELECT plant_id, SUM(downtime_sec) AS total_downtime\nFROM fact_shop_floor_events\nWHERE EXTRACT(YEAR FROM event_ts) = 2022\n  AND EXTRACT(MONTH FROM event_ts) = 3\nGROUP BY plant_id\nORDER BY plant_id;`,
      solution: `SELECT plant_id, SUM(downtime_sec) AS total_downtime\nFROM fact_shop_floor_events\nWHERE event_ts >= '2022-03-01' AND event_ts < '2022-04-01'\nGROUP BY plant_id\nORDER BY plant_id;`,
      planCheck: { maxPartitions: 1 }
    },
    {
      id: 'pg13-bom', level: 'Expert', title: 'Explode a Bill of Materials (Recursive CTE)',
      prompt: 'Manufacturing needs the total quantity of every LEAF component (parts with no children) required to build ONE PUMP-100. Quantities multiply down the tree (e.g., 2 brackets × 2 bolts each). Return child_part and total_qty.',
      hint: 'WITH RECURSIVE: anchor = children of PUMP-100 (cast qty_per::numeric — PostgreSQL requires both terms of a recursive CTE to have the SAME type, and numeric(10,2) × numeric(10,2) widens to plain numeric); recursive step joins bom on parent_part = child_part and multiplies qty. Keep parts that never appear as a parent_part and SUM per part.',
      starter: `-- Direct children only — misses nested sub-assemblies!\nSELECT child_part, qty_per AS total_qty\nFROM bom\nWHERE parent_part = 'PUMP-100';`,
      solution: `WITH RECURSIVE explode AS (\n  SELECT child_part, qty_per::numeric AS total_qty\n  FROM bom WHERE parent_part = 'PUMP-100'\n  UNION ALL\n  SELECT b.child_part, e.total_qty * b.qty_per\n  FROM explode e JOIN bom b ON b.parent_part = e.child_part\n)\nSELECT child_part, SUM(total_qty) AS total_qty\nFROM explode e\nWHERE NOT EXISTS (SELECT 1 FROM bom b WHERE b.parent_part = e.child_part)\nGROUP BY child_part;`
    }
  ],

  /* ---------------- Engine ---------------- */
  async init(PGliteClass) {
    this._PGlite = PGliteClass || this._PGlite;
    this.db = new this._PGlite();
    await this.db.exec(this.SEED_SQL);
    const v = await this.db.query('SELECT version() AS v');
    this.version = String(v.rows[0].v).split(' (')[0].split(' on ')[0];
    this.ready = true;
    return this.version;
  },

  async reset() {
    this.ready = false;
    if (this.db && this.db.close) { try { await this.db.close(); } catch (_) {} }
    return this.init();
  },

  /** Run arbitrary SQL (multiple statements allowed). Returns { results, ms }. Throws Postgres errors. */
  async run(sql) {
    const t0 = (typeof performance !== 'undefined' ? performance : Date).now();
    const results = await this.db.exec(sql, { rowMode: 'array' });
    const ms = (typeof performance !== 'undefined' ? performance : Date).now() - t0;
    return { results, ms };
  },

  lastRowResult(results) {
    for (let i = results.length - 1; i >= 0; i--) {
      if (results[i].fields && results[i].fields.length) return results[i];
    }
    return results[results.length - 1] || { rows: [], fields: [] };
  },

  async _inRollback(fn) {
    await this.db.exec('BEGIN');
    try { return await fn(); }
    finally { try { await this.db.exec('ROLLBACK'); } catch (_) {} }
  },

  async _execChallenge(ch, sql) {
    return this._inRollback(async () => {
      if (ch.mode === 'dml') {
        const times = ch.runTwice ? 2 : 1;
        for (let i = 0; i < times; i++) {
          try { await this.db.exec(sql); }
          catch (e) { e.message = (i === 1 ? 'Failed on the RETRY run (not idempotent): ' : '') + e.message; throw e; }
        }
        return this.lastRowResult(await this.db.exec(ch.checkSql, { rowMode: 'array' }));
      }
      return this.lastRowResult(await this.db.exec(sql, { rowMode: 'array' }));
    });
  },

  _norm(v) {
    if (v === null || v === undefined) return '∅';
    if (v instanceof Date) return v.toISOString();
    if (typeof v === 'number' || typeof v === 'bigint') return Number(v).toFixed(4);
    if (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v.trim())) return Number(v).toFixed(4);
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  },

  _rowKeys(res, orderMatters) {
    const keys = (res.rows || []).map(r => r.map(c => this._norm(c)).join('␟'));
    return orderMatters ? keys : keys.slice().sort();
  },

  async countPartitionsInPlan(sql) {
    const clean = sql.trim().replace(/;+\s*$/, '');
    if (clean.includes(';')) return { error: 'Use a single SELECT statement so the plan can be inspected.' };
    const plan = await this.db.query('EXPLAIN ' + clean);
    const text = plan.rows.map(r => Object.values(r)[0]).join('\n');
    const parts = new Set((text.match(/fact_shop_floor_events_\d{4}_\d{2}/g) || []));
    return { count: parts.size, text };
  },

  /** Grade a challenge: compares your result set to the reference solution's. */
  async grade(ch, userSql) {
    let user;
    try { user = await this._execChallenge(ch, userSql); }
    catch (e) { return { ok: false, error: e.message, message: 'PostgreSQL error: ' + e.message }; }
    let expected;
    try { expected = await this._execChallenge(ch, ch.solution); }
    catch (e) { return { ok: false, user, message: 'Reference solution failed (please report): ' + e.message }; }

    const ucols = (user.fields || []).length, ecols = expected.fields.length;
    const out = { user, expected };
    if (ucols !== ecols) return { ...out, ok: false, message: `Expected ${ecols} column(s) (${expected.fields.map(f => f.name).join(', ')}) but your query returned ${ucols}.` };
    const urows = (user.rows || []).length, erows = expected.rows.length;
    if (urows !== erows) return { ...out, ok: false, message: `Expected ${erows} row(s) but your query returned ${urows}.` };
    const a = this._rowKeys(user, ch.orderMatters), b = this._rowKeys(expected, ch.orderMatters);
    const same = a.every((k, i) => k === b[i]);
    if (!same) return { ...out, ok: false, message: ch.orderMatters ? 'Row count matches, but values or ORDER differ from the expected output.' : 'Row count matches, but some values differ from the expected output.' };

    if (ch.planCheck) {
      const p = await this.countPartitionsInPlan(userSql);
      if (p.error) return { ...out, ok: false, message: p.error };
      out.plan = p.text;
      if (p.count > ch.planCheck.maxPartitions) {
        return { ...out, ok: false, message: `Correct numbers — but the real EXPLAIN plan scans ${p.count} partitions. Make the predicate sargable so PostgreSQL prunes to ${ch.planCheck.maxPartitions}.` };
      }
    }
    return { ...out, ok: true, message: ch.planCheck ? '✓ Correct results AND the plan prunes to a single partition!' : '✓ Your result set exactly matches the reference solution.' };
  },

  async schema() {
    const r = await this.db.query(`
      SELECT c.table_name,
             string_agg(c.column_name || ' ' || c.data_type, ', ' ORDER BY c.ordinal_position) AS cols,
             MAX(CASE WHEN p.relkind = 'p' THEN 1 ELSE 0 END) AS partitioned
      FROM information_schema.columns c
      JOIN pg_class p ON p.relname = c.table_name
      WHERE c.table_schema = 'public' AND c.table_name !~ '_\\d{4}_\\d{2}$'
      GROUP BY c.table_name ORDER BY c.table_name`);
    return r.rows;
  }
};

if (typeof module !== 'undefined' && module.exports) module.exports = PgLab;
if (typeof window !== 'undefined') window.PgLab = PgLab;
