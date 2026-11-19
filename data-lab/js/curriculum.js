/* Data Engineering Academy — Beginner to Expert Coaching Curriculum
 * 4 Tech Tracks: PostgreSQL, SQL Server (T-SQL), SSIS & ETL Architecture, Python Data Engineering
 * Each track progresses through: Beginner -> Intermediate -> Advanced -> Expert
 */
const DataLabCurriculum = {
  TRACKS: [
    {
      id: 'postgres',
      name: 'PostgreSQL',
      icon: '🐘',
      badge: 'badge-pg',
      tagline: 'From your first SELECT to MVCC, range partitioning, EXPLAIN ANALYZE, and COPY bulk pipelines.',
      modules: [
        {
          id: 'pg-beg',
          level: 'Beginner',
          title: 'Tables, Primary Keys, Types & Basic Queries',
          concept: 'PostgreSQL is a strict, ACID-compliant relational database. Every table should have an explicit primary key (prefer GENERATED ALWAYS AS IDENTITY over legacy SERIAL), strict data types (NUMERIC for money—never FLOAT!), and TIMESTAMPTZ for timestamps.',
          mentalModel: 'Think of a table as a strongly-typed spreadsheet where Postgres enforces data integrity on every write so bad data never corrupts downstream analytics.',
          codeLabel: 'PostgreSQL DDL & Core Query',
          code: `CREATE TABLE dw.dim_product (
  product_sk  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sku_code    TEXT NOT NULL UNIQUE,
  category    TEXT NOT NULL DEFAULT 'UNCATEGORIZED',
  unit_price  NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SELECT sku_code, category, unit_price
FROM dw.dim_product
WHERE unit_price > 25.00
ORDER BY unit_price DESC
LIMIT 10;`,
          pitfall: 'PostgreSQL string comparisons are CASE-SENSITIVE by default! \'sku-1\' != \'SKU-1\'. Always normalize casing with UPPER()/LOWER() on ingest or use ILIKE.',
          check: {
            q: 'Which data type should you always use for financial amounts in PostgreSQL?',
            opts: ['FLOAT / DOUBLE PRECISION', 'NUMERIC(12,2)', 'TEXT'],
            ans: 1,
            exp: 'NUMERIC stores exact decimal values without binary floating-point rounding errors.'
          }
        },
        {
          id: 'pg-int',
          level: 'Intermediate',
          title: 'JOINs, CTEs, Window Functions & COALESCE',
          concept: 'Analytical SQL relies on LEFT JOIN (to preserve fact rows even when dimension lookups miss), Common Table Expressions (WITH ...) for readable multi-step transforms, and Window Functions (ROW_NUMBER, SUM OVER) for deduplication and running totals.',
          mentalModel: 'GROUP BY collapses rows into one row per group; Window Functions (OVER PARTITION BY) compute rankings or totals while keeping every detail row intact.',
          codeLabel: 'Deduplicating & Ranking with CTE + ROW_NUMBER()',
          code: `WITH ranked_products AS (
  SELECT
    sku_code,
    category,
    COALESCE(unit_price, 0.00) AS unit_price,
    ROW_NUMBER() OVER (
      PARTITION BY sku_code
      ORDER BY updated_at DESC
    ) AS rn
  FROM stg.vendor_products
)
SELECT sku_code, category, unit_price
FROM ranked_products
WHERE rn = 1;`,
          pitfall: 'Filtering a LEFT JOINed table in the WHERE clause (e.g. WHERE p.is_active = 1) silently turns it into an INNER JOIN and drops unmatched rows! Put dimension filters in the ON clause.',
          check: {
            q: 'Where should you filter p.is_active = 1 when LEFT JOINing stg_sales s to dim_product p?',
            opts: ['In the WHERE clause', 'In the ON clause of the LEFT JOIN', 'In the ORDER BY clause'],
            ans: 1,
            exp: 'Putting p.is_active = 1 in the ON clause preserves unmatched sales rows (with NULLs for p) instead of filtering them out.'
          }
        },
        {
          id: 'pg-adv',
          level: 'Advanced',
          title: 'Idempotent Upserts (ON CONFLICT), PL/pgSQL & Indexes',
          concept: 'Production pipelines retry on failure. PostgreSQL\'s INSERT ... ON CONFLICT (key) DO UPDATE makes loads idempotent (safe to re-run with zero duplicates). Pair selective B-Tree indexes with composite columns ordered by equality first, then range.',
          mentalModel: 'An index is like a book\'s back-of-book index: fast for finding 2% of rows, but slow to maintain during massive bulk loads—so drop non-unique indexes before huge backfills and rebuild them after.',
          codeLabel: 'Idempotent Upsert & Composite B-Tree Index',
          code: `CREATE INDEX idx_wo_plant_date
  ON dw.fact_work_orders (plant_sk, completed_at);

INSERT INTO dw.fact_work_orders (wo_id, split_seq, good_qty, scrap_qty, updated_at)
SELECT wo_id, split_seq, good_qty, COALESCE(scrap_qty, 0), NOW()
FROM stg.work_orders
ON CONFLICT (wo_id, split_seq)
DO UPDATE SET
  good_qty   = EXCLUDED.good_qty,
  scrap_qty  = EXCLUDED.scrap_qty,
  updated_at = EXCLUDED.updated_at;`,
          pitfall: 'In PostgreSQL, ON CONFLICT requires a matching UNIQUE constraint or PRIMARY KEY on the exact conflict columns.',
          check: {
            q: 'What does EXCLUDED refer to inside PostgreSQL\'s ON CONFLICT DO UPDATE?',
            opts: ['Rows deleted from the table', 'The incoming row that conflicted with an existing key', 'Rows ignored by a WHERE clause'],
            ans: 1,
            exp: 'EXCLUDED holds the proposed new values from the INSERT so you can update the existing row cleanly.'
          }
        },
        {
          id: 'pg-exp',
          level: 'Expert',
          title: 'Range Partitioning, COPY Bulk Loading, MVCC & EXPLAIN ANALYZE',
          concept: 'At tens of millions of rows, declarative monthly PARTITION BY RANGE lets Postgres prune untouched months (scanning 3 of 72 partitions). For bulk ingestion, COPY streams raw data directly into storage (~10x faster than INSERT). Understanding MVCC (readers never block writers, autovacuum reclaims dead tuples) keeps large databases healthy.',
          mentalModel: 'Partitioning splits one giant 50M-row filing cabinet into 72 labeled monthly drawers so queries only open the drawers matching the WHERE date range.',
          codeLabel: 'Declarative Range Partitioning & EXPLAIN ANALYZE',
          code: `CREATE TABLE dw.fact_shop_floor_events (
  event_id     BIGINT NOT NULL,
  plant_sk     INT NOT NULL,
  event_ts     TIMESTAMPTZ NOT NULL,
  downtime_sec INT NOT NULL
) PARTITION BY RANGE (event_ts);

CREATE TABLE dw.fact_shop_floor_2022_01
  PARTITION OF dw.fact_shop_floor_events
  FOR VALUES FROM ('2022-01-01') TO ('2022-02-01');

EXPLAIN (ANALYZE, BUFFERS)
SELECT plant_sk, SUM(downtime_sec)
FROM dw.fact_shop_floor_events
WHERE event_ts >= '2022-01-01' AND event_ts < '2022-02-01'
GROUP BY plant_sk;`,
          pitfall: 'Wrapping the partition key in a function like WHERE DATE_TRUNC(\'month\', event_ts) = ... disables partition pruning! Always write sargable range predicates (event_ts >= ... AND event_ts < ...).',
          check: {
            q: 'Why does WHERE YEAR(event_ts) = 2022 hurt performance on a partitioned/indexed table?',
            opts: ['PostgreSQL has no YEAR function', 'Wrapping the column in a function prevents index usage and partition pruning', 'It causes a syntax error only on Mondays'],
            ans: 1,
            exp: 'Non-sargable predicates force Postgres to evaluate the function on every row instead of pruning partitions or seeking the B-Tree index.'
          }
        }
      ]
    },
    {
      id: 'sqlserver',
      name: 'SQL Server (T-SQL)',
      icon: '🧱',
      badge: 'badge-sqlserver',
      tagline: 'Master T-SQL, star schemas, MERGE upserts, watermarking, clustered indexes, and SQL Server Agent.',
      modules: [
        {
          id: 'tsql-beg',
          level: 'Beginner',
          title: 'T-SQL Essentials: TOP, ISNULL, DATEADD & Schemas',
          concept: 'SQL Server organizes objects into schemas (stg, dw, etl) to separate raw staging data from curated reporting tables. Key T-SQL idioms include TOP N, ISNULL(), GETDATE(), and DATEADD().',
          mentalModel: 'Schemas are folders inside your database: stg.* holds raw landings, etl.* holds control/audit tables, and dw.* holds clean reporting tables.',
          codeLabel: 'T-SQL Staging & Date Filtering',
          code: `SELECT TOP (20)
  s.store_id,
  s.sku,
  ISNULL(s.discount_amt, 0.00) AS discount_amt,
  CAST(s.txn_ts AS DATE) AS biz_date
FROM stg.pos_sales s
WHERE s.txn_ts >= DATEADD(DAY, -7, CAST(GETDATE() AS DATE))
ORDER BY s.txn_ts DESC;`,
          pitfall: 'SQL Server defaults to case-insensitive collation (SQL_Latin1_General_CP1_CI_AS), which is convenient until you migrate queries to PostgreSQL or Linux systems.',
          check: {
            q: 'Why separate tables into stg.*, etl.*, and dw.* schemas in SQL Server?',
            opts: ['It makes queries run 100x faster automatically', 'It isolates raw landing data, control metadata, and clean BI tables for permissions and maintainability', 'SQL Server only allows 10 tables per schema'],
            ans: 1,
            exp: 'Schema separation lets BI users read only dw.* while ETL jobs write to stg.* and etl.* safely.'
          }
        },
        {
          id: 'tsql-int',
          level: 'Intermediate',
          title: 'Dimensional Modeling: Fact & Dimension Tables',
          concept: 'Analytics warehouses use a Star Schema: wide, descriptive Dimension tables (DimProduct, DimStore, DimDate) joined to narrow, high-volume Fact tables (FactSales, FactInventory) using integer surrogate keys.',
          mentalModel: 'Facts store measurements ("what happened": qty, net_amount); Dimensions store context ("who, what, where, when"). Always include an Unknown (-1) dimension row so late-arriving facts never drop.',
          codeLabel: 'Populating FactSales with Unknown (-1) Surrogate Key',
          code: `INSERT INTO dw.FactSales (txn_id, product_sk, store_sk, date_sk, qty, net_amount)
SELECT
  s.txn_id,
  ISNULL(p.product_sk, -1) AS product_sk,
  st.store_sk,
  CONVERT(INT, FORMAT(s.biz_date, 'yyyyMMdd')) AS date_sk,
  s.qty,
  s.net_amount
FROM stg.pos_sales s
LEFT JOIN dw.DimProduct p
  ON s.sku = p.sku_code AND p.is_active = 1
INNER JOIN dw.DimStore st
  ON s.store_id = st.store_id;`,
          pitfall: 'Joining FactSales directly to a DimProduct table containing duplicate active SKUs causes a many-to-many join fan-out that silently inflates revenue!',
          check: {
            q: 'What is the purpose of an Unknown (-1) surrogate key in DimProduct?',
            opts: ['To delete invalid sales', 'To preserve valid fact rows when a brand-new SKU hasn\'t arrived in the product dimension yet', 'To speed up ORDER BY'],
            ans: 1,
            exp: 'Mapping missing dimension lookups to -1 ensures financial totals always reconcile 100% with the source POS.'
          }
        },
        {
          id: 'tsql-adv',
          level: 'Advanced',
          title: 'Stored Procedures, Watermarking & Idempotent MERGE',
          concept: 'Instead of reloading years of data every night, store the last successfully processed timestamp in etl.watermark_control. Extract only newer rows (with a small overlap window for late arrivals) and apply a T-SQL MERGE or UPDATE+INSERT inside a transaction.',
          mentalModel: 'A watermark is a bookmark in a book: you resume reading from the bookmark, re-reading the last paragraph (overlap) just in case anything was revised.',
          codeLabel: 'Transactional Stored Procedure with MERGE & Watermark',
          code: `CREATE OR ALTER PROCEDURE etl.usp_load_fact_sales
AS
BEGIN
  SET NOCOUNT ON;
  BEGIN TRAN;
    MERGE dw.FactSales AS tgt
    USING stg.pos_sales_clean AS src
      ON tgt.txn_id = src.txn_id
    WHEN MATCHED THEN
      UPDATE SET tgt.net_amount = src.net_amount, tgt.qty = src.qty
    WHEN NOT MATCHED BY TARGET THEN
      INSERT (txn_id, product_sk, store_sk, qty, net_amount)
      VALUES (src.txn_id, src.product_sk, src.store_sk, src.qty, src.net_amount);

    UPDATE etl.watermark_control
    SET last_loaded_at = (SELECT MAX(txn_ts) FROM stg.pos_sales_clean)
    WHERE pipeline_name = 'pos_sales';
  COMMIT TRAN;
END;`,
          pitfall: 'Updating the watermark BEFORE the MERGE commits means a mid-batch crash permanently skips those rows on the next run! Always update the watermark inside the same transaction or strictly after success.',
          check: {
            q: 'When should etl.watermark_control be updated?',
            opts: ['At the very start of extraction', 'Only after the target fact load succeeds (or in the same atomic transaction)', 'Once a month manually'],
            ans: 1,
            exp: 'Updating the watermark only after a committed load guarantees failed runs can safely retry without data loss.'
          }
        },
        {
          id: 'tsql-exp',
          level: 'Expert',
          title: 'Clustered vs Non-Clustered Indexes, Columnstore & SQL Agent',
          concept: 'Every SQL Server table can have ONE Clustered Index (the physical sort order of the data pages—great on date_sk or an identity key) and multiple Non-Clustered Indexes with INCLUDE columns to create covering indexes. For multi-million-row analytics tables, Clustered Columnstore Indexes (CCI) compress data 5–10x and accelerate aggregations.',
          mentalModel: 'Clustered Index = the dictionary itself (sorted A–Z). Non-Clustered Index = a separate index card pointing to dictionary pages. Columnstore = storing each column separately for lightning-fast SUM/COUNT scans.',
          codeLabel: 'Covering Index & Clustered Columnstore for Analytics',
          code: `-- Covering non-clustered index for store daily lookups
CREATE NONCLUSTERED INDEX IX_FactSales_StoreDate
  ON dw.FactSales (store_sk, date_sk)
  INCLUDE (qty, net_amount);

-- Or Clustered Columnstore for high-compression BI fact tables
CREATE CLUSTERED COLUMNSTORE INDEX CCI_FactInventory
  ON dw.FactInventory;`,
          pitfall: 'Putting WITH (NOLOCK) everywhere in SQL Server can cause phantom reads, skipped rows, or duplicate rows during page splits—never use NOLOCK in financial reconciliation queries!',
          check: {
            q: 'Why should you avoid WITH (NOLOCK) in financial reconciliation queries?',
            opts: ['It slows queries down', 'It can read uncommitted dirty data, skip rows, or double-read rows during concurrent page splits', 'SQL Server deprecated SELECT with NOLOCK'],
            ans: 1,
            exp: 'NOLOCK trades accuracy for speed; use Read Committed Snapshot Isolation (RCSI) instead for consistent non-blocking reads.'
          }
        }
      ]
    },
    {
      id: 'ssis',
      name: 'SSIS & ETL Design',
      icon: '🔀',
      badge: 'badge-ok',
      tagline: 'Control Flow vs Data Flow, incremental architecture, error redirection, and production runbooks.',
      modules: [
        {
          id: 'ssis-beg',
          level: 'Beginner',
          title: 'Control Flow vs Data Flow & Package Anatomy',
          concept: 'SQL Server Integration Services (SSIS) separates orchestration (Control Flow: Execute SQL, Loops, File System tasks, Precedence Constraints) from row-by-row/buffer streaming (Data Flow: Sources → Transformations → Destinations).',
          mentalModel: 'Control Flow is the traffic controller deciding WHAT runs and in what order; Data Flow is the conveyor belt moving and reshaping actual data rows.',
          codeLabel: 'Typical Nightly SSIS Control Flow Sequence',
          code: `[1. Execute SQL: Read Watermark]
       │ (On Success)
       ▼
[2. Execute Process: Python Vendor CSV Cleaner]
       │ (On Success)
       ▼
[3. Foreach Loop: 35 Store Exports → Data Flow → stg.pos_sales]
       │ (On Success)
       ▼
[4. Execute SQL: EXEC etl.usp_load_fact_sales]
       │ (On Success)        └─ (On Failure) → [Send Mail Alert + Log Error]
       ▼
[5. Execute SQL: Reconciliation Parity Gate]`,
          pitfall: 'Putting heavy SQL joins inside SSIS Lookup/Merge Join components instead of landing to staging and doing set-based SQL merges—database engines join millions of rows far faster than SSIS memory buffers.',
          check: {
            q: 'In SSIS, which layer handles loops, Execute SQL tasks, and failure email alerts?',
            opts: ['Data Flow', 'Control Flow', 'Connection Manager'],
            ans: 1,
            exp: 'Control Flow orchestrates tasks, loops, and precedence constraints; Data Flow moves row buffers.'
          }
        },
        {
          id: 'ssis-int',
          level: 'Intermediate',
          title: 'Staging Layers (ELT vs ETL) & Fast Load Mode',
          concept: 'Modern on-prem SSIS follows an ELT pattern: extract raw data quickly into stg.* tables using OLE DB Destination "Table or view - fast load" (bulk-logged), then run set-based T-SQL stored procedures to transform into dw.*.',
          mentalModel: 'Get the groceries inside the house first (Staging), then wash and cook them (Transform). If cooking fails, you don\'t have to drive back to 35 stores!',
          codeLabel: 'SSIS Fast Load Settings Checklist',
          code: `OLE DB Destination -> Data Access Mode:
  [x] Table or view - fast load
  [x] Table lock (TABLOCK for minimal logging into empty staging)
  [x] Check constraints = OFF (validate in SQL step)
  Rows per batch: 50,000
  Maximum insert commit size: 50,000`,
          pitfall: 'Leaving OLE DB Destination on default "Table or view" (non-fast load) sends individual row-by-row INSERTs—turning a 2-minute load into a 2-hour bottleneck!',
          check: {
            q: 'What happens if you forget to enable "Fast Load" on an SSIS OLE DB Destination?',
            opts: ['SSIS deletes the table', 'SSIS issues slow row-by-row INSERTs instead of bulk batches', 'Nothing changes'],
            ans: 1,
            exp: 'Fast Load uses bulk-insert APIs; without it, throughput collapses on large tables.'
          }
        },
        {
          id: 'ssis-adv',
          level: 'Advanced',
          title: 'Error Redirection, Bad-Row Quarantine & Audit Logging',
          concept: 'Never let 1 malformed vendor row silently vanish or crash 34 healthy stores. Configure SSIS Error Output to "Redirect Row" into an etl.quarantine_bad_rows table with error code, column, and batch_id, and log start/end/row-counts in etl.audit_log.',
          mentalModel: 'A quarantine table is an airport customs desk: suspicious rows are pulled aside for inspection while valid passengers keep moving.',
          codeLabel: 'ETL Audit & Quarantine Pattern',
          code: `CREATE TABLE etl.batch_audit_log (
  batch_id       BIGINT IDENTITY(1,1) PRIMARY KEY,
  pipeline_name  VARCHAR(100) NOT NULL,
  started_at     DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  finished_at    DATETIME2 NULL,
  rows_extracted INT NULL,
  rows_loaded    INT NULL,
  rows_rejected  INT DEFAULT 0,
  status         VARCHAR(20) NOT NULL -- RUNNING / SUCCESS / FAILED
);`,
          pitfall: 'A job succeeding with 0 rows extracted when an upstream SFTP file is empty! Always assert rows_extracted > expected_min in your audit step.',
          check: {
            q: 'How do you catch a silent failure where a store uploads a 0-byte empty CSV file?',
            opts: ['Rely on SSIS throwing a syntax error', 'Add an explicit row-count / file-size assertion gate that alerts on 0 rows', 'Disable logging'],
            ans: 1,
            exp: 'SSIS happily loads 0 rows from an empty file with green checkmarks unless you enforce row-count gates.'
          }
        },
        {
          id: 'ssis-exp',
          level: 'Expert',
          title: 'Buffer Tuning, Parallelism & Zero-Downtime Cutover',
          concept: 'At scale, tune DefaultBufferMaxRows and DefaultBufferSize, eliminate blocking transforms (Sort, Aggregate) inside Data Flow, and parallelize independent store/plant loads via MaxConcurrentExecutables. For migrations, run Dual-Run Parallel Validation (legacy vs target) with automated reconciliation gates before switching BI tools over a weekend.',
          mentalModel: 'Blocking transforms (like Sort) force SSIS to hold every single row in RAM before outputting row 1. Push sorting and aggregation down to SQL Server or PostgreSQL.',
          codeLabel: 'Weekend Cutover Go / No-Go Checklist',
          code: `1. Freeze legacy ETL writes (Fri 10:00 PM)
2. Run final incremental delta + 6-year parity reconciliation
3. Verify Gate:
   - Row count parity = 100.0% across all fact tables
   - Financial total variance <= $0.01 (99.9%+ parity)
   - BI dashboard latency < 3.0 seconds on 90-day queries
4. Repoint Power BI / reporting connections to target DB
5. Keep legacy DB read-only for 14-day rollback safety net`,
          pitfall: 'Cutting over without a parallel-run period or rollback plan—always keep the legacy reporting DB read-only for 1–2 weeks post-launch.',
          check: {
            q: 'Why are Sort and Aggregate components called "blocking transforms" in SSIS?',
            opts: ['They lock the network card', 'They must read all rows into memory before emitting the first output row', 'They only work on SQL Server 2008'],
            ans: 1,
            exp: 'Full-blocking transforms stall the pipeline and spike RAM; perform ORDER BY and GROUP BY in SQL instead.'
          }
        }
      ]
    },
    {
      id: 'python',
      name: 'Python for Data Eng',
      icon: '🐍',
      badge: 'badge-py',
      tagline: 'pandas cleaning, encoding safety, pyodbc/psycopg2, chunked memory control, and COPY bulk frameworks.',
      modules: [
        {
          id: 'py-beg',
          level: 'Beginner',
          title: 'Defensive CSV Ingestion & Encoding Normalization',
          concept: 'Real-world SMB vendor feeds have mixed encodings (UTF-8 vs Windows-1252/Latin-1), leading/trailing whitespace, inconsistent column casing, and numeric SKUs that pandas silently strips leading zeros from unless you pass dtype=str.',
          mentalModel: 'Never trust raw CSVs: read IDs/SKUs as strings, normalize headers immediately, and handle encoding fallbacks explicitly.',
          codeLabel: 'Defensive pandas CSV Reader',
          code: `import pandas as pd

def read_vendor_csv(path: str) -> pd.DataFrame:
    for enc in ("utf-8-sig", "cp1252", "latin1"):
        try:
            df = pd.read_csv(path, encoding=enc, dtype={"sku": str, "store_id": str})
            break
        except UnicodeDecodeError:
            continue
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    df["sku"] = df["sku"].str.strip().str.upper()
    return df.drop_duplicates(subset=["sku"], keep="last")`,
          pitfall: 'Reading SKU "00421" without dtype={"sku": str} turns it into integer 421—breaking every downstream JOIN!',
          check: {
            q: 'Why pass dtype={"sku": str} when reading a retail CSV with pandas?',
            opts: ['It makes the CSV smaller', 'It preserves leading zeros (e.g., "00421") and prevents mixed-type join failures', 'pandas cannot read integers'],
            ans: 1,
            exp: 'Preserving leading zeros in SKUs, zip codes, and store IDs prevents silent join mismatches.'
          }
        },
        {
          id: 'py-int',
          level: 'Intermediate',
          title: 'Parameterized DB Connections (pyodbc & psycopg2)',
          concept: 'Use context managers (with conn:) so connections always close cleanly and transactions roll back automatically on error. Always use parameterized queries (? in pyodbc, %s in psycopg2) rather than f-strings to prevent SQL injection and quoting bugs.',
          mentalModel: 'Context managers guarantee cleanup even when an exception hits at 3:00 AM—preventing zombie locks on production tables.',
          codeLabel: 'Safe Parameterized Extraction with pyodbc',
          code: `import pyodbc
import pandas as pd

conn_str = "DRIVER={ODBC Driver 17 for SQL Server};SERVER=erp01;DATABASE=ERP;Trusted_Connection=yes;"
query = """
  SELECT wo_id, split_seq, planned_qty, good_qty, scrap_qty
  FROM dbo.WorkOrders
  WHERE updated_at >= ?
"""
with pyodbc.connect(conn_str) as conn:
    df = pd.read_sql(query, conn, params=[last_watermark])`,
          pitfall: 'Interpolating dates or strings with f-strings (WHERE sku = \'{sku}\') breaks on single quotes like O\'Brien and opens SQL injection holes.',
          check: {
            q: 'What happens when an exception occurs inside a `with psycopg2.connect(...) as conn:` block?',
            opts: ['Partial writes are permanently committed', 'The transaction automatically rolls back', 'The database shuts down'],
            ans: 1,
            exp: 'Using connection context managers guarantees atomic rollback on error.'
          }
        },
        {
          id: 'py-adv',
          level: 'Advanced',
          title: 'Chunked Processing & PostgreSQL COPY Bulk Loading',
          concept: 'Loading 50M rows into RAM crashes Python (OOM). Stream data in fixed chunks (e.g., 100,000 rows per batch via pd.read_sql(..., chunksize=100_000)) and pipe each chunk directly into PostgreSQL via io.StringIO + cur.copy_expert().',
          mentalModel: 'Streaming chunks through COPY is like a firehose instead of carrying water one teacup (row-by-row INSERT) at a time.',
          codeLabel: 'Memory-Safe Chunked SQL Server → PostgreSQL COPY',
          code: `import io

def stream_to_postgres(sql_conn, pg_conn, select_sql, target_table, chunksize=100_000):
    total = 0
    for chunk in pd.read_sql(select_sql, sql_conn, chunksize=chunksize):
        buf = io.StringIO()
        chunk.to_csv(buf, index=False, header=False, sep="\\t", na_rep="\\\\N")
        buf.seek(0)
        with pg_conn.cursor() as cur:
            cur.copy_expert(
                f"COPY {target_table} FROM STDIN WITH (FORMAT text, NULL '\\\\N')",
                buf
            )
        pg_conn.commit()
        total += len(chunk)
    return total`,
          pitfall: 'Forgetting buf.seek(0) before copy_expert() leaves the buffer cursor at the end—loading 0 rows with no error!',
          check: {
            q: 'Why must you call buf.seek(0) after writing a DataFrame into io.StringIO()?',
            opts: ['To compress the CSV', 'To rewind the in-memory stream pointer back to the start so COPY actually reads the data', 'To clear memory'],
            ans: 1,
            exp: 'Without seek(0), the file pointer sits at EOF and COPY reads 0 bytes.'
          }
        },
        {
          id: 'py-exp',
          level: 'Expert',
          title: 'Config-Driven Frameworks, Parallel Workers & Reconciliation Suites',
          concept: 'Senior data engineers don\'t copy-paste 30 scripts—they build one config-driven Python framework (YAML/JSON table specs, schema validation, structured logging, retry backoff, and ThreadPoolExecutor/ProcessPoolExecutor for parallel year-chunks) paired with an automated reconciliation suite.',
          mentalModel: 'Separate WHAT to migrate (config metadata) from HOW to migrate it (reusable engine + automated parity assertions).',
          codeLabel: 'Automated Source-vs-Target Reconciliation Gate',
          code: `def assert_parity(src_conn, tgt_conn, table_cfg, tolerance=0.01):
    src_cnt, src_sum = fetch_metrics(src_conn, table_cfg["src_sql"])
    tgt_cnt, tgt_sum = fetch_metrics(tgt_conn, table_cfg["tgt_sql"])
    variance = abs((src_sum or 0) - (tgt_sum or 0))
    passed = (src_cnt == tgt_cnt) and (variance <= tolerance)
    if not passed:
        raise RuntimeError(
            f"Parity FAILED on {table_cfg['name']}: "
            f"rows {src_cnt} vs {tgt_cnt}, sum variance={variance:.2f}"
        )
    return {"table": table_cfg["name"], "rows": tgt_cnt, "variance": variance}`,
          pitfall: 'Running 20 parallel Python workers against a small on-prem ERP SQL Server during business hours can saturate CPU/I-O and slow down live plant operations—always cap workers (e.g., 2–4) and run backfills off-hours.',
          check: {
            q: 'Why cap parallel worker threads (e.g. 4 workers) when extracting from an on-premise ERP?',
            opts: ['Python only allows 4 threads', 'Too many concurrent queries can saturate CPU/disk on the live transactional ERP', 'PostgreSQL rejects >4 connections'],
            ans: 1,
            exp: 'Protecting the source OLTP/ERP database from contention is a core responsibility of a senior data engineer.'
          }
        }
      ]
    }
  ]
};

if (typeof module !== 'undefined' && module.exports) module.exports = DataLabCurriculum;
