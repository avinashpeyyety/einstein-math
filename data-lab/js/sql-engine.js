/* Data Engineering Lab — In-Memory SQL Sandbox, Dialect Translator & Graded Challenges */
const DataLabSQL = {
  TABLES: {
    stg_pos_sales: [
      { txn_id: 'T-1001', store_id: 12, sku: 'A-9042', qty: 2, net_amount: 49.98, biz_date: '2021-11-14' },
      { txn_id: 'T-1002', store_id: 12, sku: 'B-2210', qty: 1, net_amount: 120.00, biz_date: '2021-11-14' },
      { txn_id: 'T-1003', store_id: 19, sku: 'Z-9999', qty: 3, net_amount: 75.00, biz_date: '2021-11-14' }, // Unknown SKU!
      { txn_id: 'T-1004', store_id: 19, sku: 'A-9042', qty: 1, net_amount: 24.99, biz_date: '2021-11-14' },
      { txn_id: 'T-1005', store_id: 24, sku: 'C-5501', qty: 4, net_amount: 200.00, biz_date: '2021-11-15' }
    ],
    dim_product: [
      { product_sk: 101, sku_code: 'A-9042', category: 'Apparel', is_active: 1, updated_at: '2021-11-10' },
      { product_sk: 102, sku_code: 'A-9042', category: 'Apparel (Old)', is_active: 0, updated_at: '2021-06-01' }, // Duplicate SKU!
      { product_sk: 103, sku_code: 'B-2210', category: 'Footwear', is_active: 1, updated_at: '2021-11-01' },
      { product_sk: 104, sku_code: 'C-5501', category: 'Accessories', is_active: 1, updated_at: '2021-10-15' }
    ],
    pos_eod_summary: [
      { store_id: 12, biz_date: '2021-11-14', pos_eod_total: 169.98 },
      { store_id: 19, biz_date: '2021-11-14', pos_eod_total: 99.99 },
      { store_id: 24, biz_date: '2021-11-15', pos_eod_total: 200.00 }
    ],
    stg_work_orders: [
      { wo_id: 'WO-8821', split_seq: 1, plant: 'Plant-2', planned_qty: 500, good_qty: 280, scrap_qty: 12, status: 'CLOSED' },
      { wo_id: 'WO-8821', split_seq: 2, plant: 'Plant-2', planned_qty: 500, good_qty: 205, scrap_qty: 3, status: 'CLOSED' },
      { wo_id: 'WO-8822', split_seq: 1, plant: 'Plant-1', planned_qty: 300, good_qty: 294, scrap_qty: null, status: 'CLOSED' },
      { wo_id: 'WO-8823', split_seq: 1, plant: 'Plant-2', planned_qty: 400, good_qty: 390, scrap_qty: 10, status: 'OPEN' }
    ]
  },

  DIALECT_MAP: [
    { topic: 'Row Limiting', tsql: 'SELECT TOP 10 * FROM dw.FactSales;', pg: 'SELECT * FROM dw.fact_sales LIMIT 10;', note: 'PostgreSQL uses LIMIT/OFFSET at the end of the query.' },
    { topic: 'Null Handling', tsql: 'ISNULL(scrap_qty, 0)', pg: 'COALESCE(scrap_qty, 0)', note: 'COALESCE is ANSI-standard and works in both SQL Server & PostgreSQL.' },
    { topic: 'Current Timestamp', tsql: 'GETDATE() / SYSDATETIME()', pg: 'NOW() / CURRENT_TIMESTAMP', note: 'NOW() returns timestamptz (timezone-aware) in PostgreSQL.' },
    { topic: 'Date Arithmetic', tsql: 'DATEADD(day, -7, GETDATE())', pg: "CURRENT_DATE - INTERVAL '7 days'", note: 'PostgreSQL uses expressive INTERVAL literals.' },
    { topic: 'Idempotent Upsert', tsql: 'MERGE dw.FactSales AS t USING stg AS s ON ...', pg: 'INSERT INTO dw.fact_sales ... ON CONFLICT (id) DO UPDATE SET ...', note: 'PostgreSQL ON CONFLICT is simpler and avoids SQL Server MERGE concurrency quirks.' },
    { topic: 'Auto-Increment Keys', tsql: 'product_sk INT IDENTITY(1,1) PRIMARY KEY', pg: 'product_sk INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY', note: 'Prefer GENERATED ALWAYS AS IDENTITY over legacy SERIAL in Postgres 10+.' },
    { topic: 'String Concat + NULL', tsql: "first_name + ' ' + last_name", pg: "first_name || ' ' || last_name  -- or CONCAT_WS()", note: 'CONCAT_WS skips NULLs safely in both dialects.' },
    { topic: 'Case Sensitivity', tsql: "WHERE sku = 'a-9042'  -- matches 'A-9042' by default", pg: "WHERE LOWER(sku) = 'a-9042'  -- PG is case-sensitive!", note: 'Top migration gotcha! Always normalize casing or use ILIKE/CITEXT in Postgres.' },
    { topic: 'Locking / Dirty Reads', tsql: 'FROM dbo.WorkOrder WITH (NOLOCK)', pg: '-- Remove NOLOCK! PG uses MVCC snapshots.', note: 'Readers never block writers in PostgreSQL; NOLOCK does not exist.' },
    { topic: 'Bulk Loading', tsql: 'BULK INSERT / SSIS Fast Load / bcp', pg: "COPY stg.events FROM STDIN WITH (FORMAT text)", note: 'psycopg2 copy_expert() streams CSV buffers 5–10x faster than INSERT loops.' }
  ],

  CHALLENGES: [
    {
      id: 'c1-dup-sku',
      project: 'Beginner · SQL Server (T-SQL) & PostgreSQL',
      dialect: 'tsql',
      title: '1. [Beginner] Detect Duplicate Keys with GROUP BY & HAVING',
      prompt: 'A vendor catalog load introduced a duplicate sku_code in dim_product. Write a query to find which sku_code appears more than once (GROUP BY sku_code HAVING COUNT(*) > 1).',
      hint: 'Use SELECT sku_code, COUNT(*) AS cnt FROM dim_product GROUP BY sku_code HAVING COUNT(*) > 1;',
      starter: 'SELECT sku_code, COUNT(*) AS cnt\nFROM dim_product\n-- Add GROUP BY and HAVING below\n;',
      solution: 'SELECT sku_code, COUNT(*) AS cnt\nFROM dim_product\nGROUP BY sku_code\nHAVING COUNT(*) > 1;',
      validate(sql) {
        const s = sql.toLowerCase();
        return s.includes('dim_product') && s.includes('group by') && s.includes('having') && s.includes('count');
      },
      run() {
        const counts = {};
        DataLabSQL.TABLES.dim_product.forEach(r => { counts[r.sku_code] = (counts[r.sku_code] || 0) + 1; });
        return Object.entries(counts).filter(([, c]) => c > 1).map(([sku_code, cnt]) => ({ sku_code, cnt }));
      },
      badRun() {
        return DataLabSQL.TABLES.dim_product.map(r => ({ product_sk: r.product_sk, sku_code: r.sku_code, is_active: r.is_active }));
      }
    },
    {
      id: 'c2-left-join',
      project: 'Intermediate · SQL Server (T-SQL)',
      dialect: 'tsql',
      title: '2. [Intermediate] Preserve Fact Rows with LEFT JOIN + Unknown (-1)',
      prompt: 'Txn T-1003 has SKU Z-9999 which is missing from dim_product. Fix the INNER JOIN to a LEFT JOIN and wrap product_sk with ISNULL(..., -1) or COALESCE(..., -1) so no sales row is dropped.',
      hint: 'Change INNER JOIN to LEFT JOIN and use ISNULL(p.product_sk, -1) AS product_sk (filter p.is_active = 1 in the ON clause!).',
      starter: 'SELECT s.txn_id, s.sku, p.product_sk, s.net_amount\nFROM stg_pos_sales s\nINNER JOIN dim_product p\n  ON s.sku = p.sku_code AND p.is_active = 1;',
      solution: 'SELECT s.txn_id, s.sku, ISNULL(p.product_sk, -1) AS product_sk, s.net_amount\nFROM stg_pos_sales s\nLEFT JOIN dim_product p\n  ON s.sku = p.sku_code AND p.is_active = 1;',
      validate(sql) {
        const s = sql.toLowerCase();
        return s.includes('left join') && (s.includes('isnull') || s.includes('coalesce')) && s.includes('-1');
      },
      run() {
        return DataLabSQL.TABLES.stg_pos_sales.map(s => {
          const p = DataLabSQL.TABLES.dim_product.find(d => d.sku_code === s.sku && d.is_active === 1);
          return { txn_id: s.txn_id, sku: s.sku, product_sk: p ? p.product_sk : -1, net_amount: s.net_amount };
        });
      },
      badRun() {
        return DataLabSQL.TABLES.stg_pos_sales
          .filter(s => DataLabSQL.TABLES.dim_product.some(d => d.sku_code === s.sku && d.is_active === 1))
          .map(s => {
            const p = DataLabSQL.TABLES.dim_product.find(d => d.sku_code === s.sku && d.is_active === 1);
            return { txn_id: s.txn_id, sku: s.sku, product_sk: p.product_sk, net_amount: s.net_amount };
          });
      }
    },
    {
      id: 'c3-reconcile',
      project: 'Intermediate · SQL Server (T-SQL)',
      dialect: 'tsql',
      title: '3. [Intermediate] Source-vs-Target Reconciliation Check',
      prompt: 'Compare summed stg_pos_sales.net_amount per store_id against pos_eod_summary.pos_eod_total and compute variance = ABS(legacy - dw) to verify exact parity.',
      hint: 'Join stg_pos_sales (aggregated by store_id, biz_date) with pos_eod_summary and select ABS(pos_eod_total - dw_total) AS variance.',
      starter: 'SELECT e.store_id, e.pos_eod_total, SUM(s.net_amount) AS dw_total\nFROM pos_eod_summary e\nJOIN stg_pos_sales s ON e.store_id = s.store_id\n-- Add GROUP BY and ABS() variance column\n;',
      solution: 'SELECT e.store_id, e.pos_eod_total, SUM(s.net_amount) AS dw_total,\n  ABS(e.pos_eod_total - SUM(s.net_amount)) AS variance\nFROM pos_eod_summary e\nJOIN stg_pos_sales s ON e.store_id = s.store_id AND e.biz_date = s.biz_date\nGROUP BY e.store_id, e.pos_eod_total;',
      validate(sql) {
        const s = sql.toLowerCase();
        return s.includes('pos_eod_summary') && s.includes('sum(') && s.includes('group by') && s.includes('abs(');
      },
      run() {
        return DataLabSQL.TABLES.pos_eod_summary.map(e => {
          const dw = DataLabSQL.TABLES.stg_pos_sales
            .filter(s => s.store_id === e.store_id && s.biz_date === e.biz_date)
            .reduce((acc, r) => acc + r.net_amount, 0);
          return { store_id: e.store_id, pos_eod_total: e.pos_eod_total.toFixed(2), dw_total: dw.toFixed(2), variance: Math.abs(e.pos_eod_total - dw).toFixed(2) };
        });
      },
      badRun() {
        return [{ status: 'Missing GROUP BY / ABS() variance calculation' }];
      }
    },
    {
      id: 'c4-pg-coalesce',
      project: 'Intermediate · PostgreSQL',
      dialect: 'pg',
      title: '4. [Intermediate] Translate T-SQL ISNULL/GETDATE to PostgreSQL',
      prompt: 'WO-8822 has NULL scrap_qty. Translate the T-SQL query to idiomatic PostgreSQL using COALESCE(scrap_qty, 0) and NOW() (or CURRENT_TIMESTAMP).',
      hint: 'Replace ISNULL with COALESCE and GETDATE() with NOW().',
      starter: 'SELECT wo_id, split_seq, ISNULL(scrap_qty, 0) AS scrap_qty, GETDATE() AS loaded_at\nFROM stg_work_orders;',
      solution: 'SELECT wo_id, split_seq, COALESCE(scrap_qty, 0) AS scrap_qty, NOW() AS loaded_at\nFROM stg_work_orders;',
      validate(sql) {
        const s = sql.toLowerCase();
        return s.includes('coalesce') && (s.includes('now()') || s.includes('current_timestamp')) && !s.includes('isnull') && !s.includes('getdate');
      },
      run() {
        const ts = '2022-03-15 02:14:00+00';
        return DataLabSQL.TABLES.stg_work_orders.map(w => ({
          wo_id: w.wo_id, split_seq: w.split_seq, scrap_qty: w.scrap_qty ?? 0, loaded_at: ts
        }));
      },
      badRun() {
        return [{ pg_error: 'ERROR: function isnull(integer, integer) does not exist — HINT: Use COALESCE() and NOW() in PostgreSQL.' }];
      }
    },
    {
      id: 'c5-split-wo',
      project: 'Advanced · PostgreSQL',
      dialect: 'pg',
      title: '5. [Advanced] Resolve Grain Inflation on Split Work Orders',
      prompt: 'WO-8821 was split into 2 rows, both carrying planned_qty = 500 (naive SUM = 1000!). Use MAX(planned_qty) per wo_id alongside SUM(good_qty) to report true planned vs actual output.',
      hint: 'SELECT wo_id, MAX(planned_qty) AS true_planned, SUM(good_qty) AS total_good FROM stg_work_orders GROUP BY wo_id;',
      starter: 'SELECT wo_id, SUM(planned_qty) AS planned, SUM(good_qty) AS total_good\nFROM stg_work_orders\nGROUP BY wo_id;',
      solution: 'SELECT wo_id, MAX(planned_qty) AS true_planned, SUM(good_qty) AS total_good\nFROM stg_work_orders\nGROUP BY wo_id;',
      validate(sql) {
        const s = sql.toLowerCase();
        return s.includes('max(planned_qty)') && s.includes('sum(good_qty)') && s.includes('group by');
      },
      run() {
        const grouped = {};
        DataLabSQL.TABLES.stg_work_orders.forEach(w => {
          if (!grouped[w.wo_id]) grouped[w.wo_id] = { wo_id: w.wo_id, true_planned: w.planned_qty, total_good: 0 };
          grouped[w.wo_id].true_planned = Math.max(grouped[w.wo_id].true_planned, w.planned_qty);
          grouped[w.wo_id].total_good += w.good_qty;
        });
        return Object.values(grouped);
      },
      badRun() {
        const grouped = {};
        DataLabSQL.TABLES.stg_work_orders.forEach(w => {
          if (!grouped[w.wo_id]) grouped[w.wo_id] = { wo_id: w.wo_id, planned_INFLATED: 0, total_good: 0 };
          grouped[w.wo_id].planned_INFLATED += w.planned_qty;
          grouped[w.wo_id].total_good += w.good_qty;
        });
        return Object.values(grouped);
      }
    },
    {
      id: 'c6-pg-upsert',
      project: 'Expert · PostgreSQL (PL/pgSQL)',
      dialect: 'pg',
      title: '6. [Expert] Idempotent PostgreSQL Upsert (ON CONFLICT)',
      prompt: 'Make the nightly work-order load safe to retry without duplicate-key errors by adding ON CONFLICT (wo_id, split_seq) DO UPDATE SET good_qty = EXCLUDED.good_qty.',
      hint: 'Append ON CONFLICT (wo_id, split_seq) DO UPDATE SET good_qty = EXCLUDED.good_qty;',
      starter: 'INSERT INTO dw.fact_work_orders (wo_id, split_seq, good_qty, scrap_qty)\nSELECT wo_id, split_seq, good_qty, COALESCE(scrap_qty, 0)\nFROM stg_work_orders\n-- Add idempotent ON CONFLICT clause below\n;',
      solution: 'INSERT INTO dw.fact_work_orders (wo_id, split_seq, good_qty, scrap_qty)\nSELECT wo_id, split_seq, good_qty, COALESCE(scrap_qty, 0)\nFROM stg_work_orders\nON CONFLICT (wo_id, split_seq)\nDO UPDATE SET good_qty = EXCLUDED.good_qty, scrap_qty = EXCLUDED.scrap_qty;',
      validate(sql) {
        const s = sql.toLowerCase();
        return s.includes('on conflict') && s.includes('do update') && s.includes('excluded.');
      },
      run() {
        return [
          { command: 'INSERT 0 4 (Idempotent Upsert)', inserted: 2, updated: 2, duplicates_created: 0 }
        ];
      },
      badRun() {
        return [{ pg_error: 'ERROR: duplicate key value violates unique constraint "fact_work_orders_pkey" on retry!' }];
      }
    }
  ]
};

if (typeof module !== 'undefined' && module.exports) module.exports = DataLabSQL;
