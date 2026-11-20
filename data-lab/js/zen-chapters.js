/* The River of Data — 7 Zen Chapters from First Principles
 * One breath at a time: Watch & Listen -> Touch & Feel -> Speak the Spell (Real Postgres 18 / Python) -> Rest & Koan.
 * Zero vendor silos: PostgreSQL, SQL Server (T-SQL), SSIS & Python appear naturally as instruments serving 7 universal laws.
 */
const ZenChapters = [
  {
    id: 'ch1-stillness',
    num: 1,
    roman: 'I',
    title: 'Stillness',
    subtitle: 'Seeing the Stream Clearly',
    tech: 'PostgreSQL · Profiling & Duplicate Keys',
    audio: 'audio/ch01.mp3',
    narration: 'Before you build a single bridge, sit beside the river and look closely. Two crates carry the exact same name on the ledger. If you rush past them, every number downstream will quietly double. First, learn to see what is truly there.',
    cues: [
      { at: 0.0, scene: 'stream', caption: 'Before you build a single bridge, sit beside the river and look closely.' },
      { at: 4.5, scene: 'dup-crates', caption: 'Two crates carry the exact same name on the ledger.' },
      { at: 9.0, scene: 'fanout-warn', caption: 'If you rush past them, every number downstream will quietly double.' },
      { at: 14.0, scene: 'still-lens', caption: 'First, learn to see what is truly there.' }
    ],
    touch: {
      prompt: 'Slide the Stillness Lens across the product ledger. Watch what happens to daily revenue when one SKU appears twice.',
      type: 'toggle',
      offLabel: 'Blind Join (Duplicate SKU Unseen)',
      onLabel: 'Stillness Lens (GROUP BY · HAVING COUNT > 1)',
      offReadout: '240 sales × 2 rows of A-9042 → +$18,420 phantom revenue!',
      onReadout: 'Duplicate key A-9042 spotted immediately (count = 2). River stays true.'
    },
    spell: {
      mode: 'pg',
      pgChallengeId: 'pg3-dupes',
      intro: 'Now speak it in real PostgreSQL 18. Find every sku_code in dim_product that appears more than once.'
    },
    koan: 'Do not move a river you have not first looked into.',
    worldUpgrade: 'The mountain stream clears; duplicate crates now glow softly so your eye catches them before they multiply.'
  },
  {
    id: 'ch2-sluice',
    num: 2,
    roman: 'II',
    title: 'The Sluice Gate',
    subtitle: 'Purity Before Entry',
    tech: 'Python (pandas) · Encodings & Quarantine',
    audio: 'audio/ch02.mp3',
    narration: 'Files arrive from distant towns in rain and mud. Some carry unfamiliar ink encodings; others lose their leading zeros when read in haste. Do not curse the storm. Build a gentle bamboo sluice gate that cleans good grain and sets broken crates safely aside.',
    cues: [
      { at: 0.0, scene: 'muddy-boats', caption: 'Files arrive from distant towns in rain and mud.' },
      { at: 4.5, scene: 'bad-encoding', caption: 'Some carry unfamiliar ink encodings; others lose their leading zeros.' },
      { at: 9.5, scene: 'build-sluice', caption: 'Do not curse the storm. Build a gentle bamboo sluice gate.' },
      { at: 14.5, scene: 'quarantine-cove', caption: 'Clean the good grain, and set broken crates safely aside.' }
    ],
    touch: {
      prompt: 'Turn the Python Sluice levers below. Watch how raw vendor CSVs react to encoding fallbacks and string-typed SKUs.',
      type: 'sliders2',
      toggles: [
        { id: 'enc', label: 'UTF-8 → CP1252 → Latin-1 Fallback', impact: 'Stops 2:00 AM UnicodeDecodeError crashes' },
        { id: 'str', label: 'dtype={"sku": str}', impact: 'Preserves leading zeros ("00421" stays "00421", not 421)' },
        { id: 'dedup', label: 'drop_duplicates(subset=["sku"])', impact: 'Guarantees 1 clean row per SKU before DB ingest' }
      ]
    },
    spell: {
      mode: 'python-quiz',
      intro: 'Complete the defensive Python sluice gate so no dirty CSV can ever crash or corrupt your warehouse:',
      code: `import pandas as pd\n\nfor enc in ("utf-8-sig", "cp1252", "latin1"):\n    try:\n        df = pd.read_csv(path, encoding=enc, dtype=___)\n        break\n    except UnicodeDecodeError:\n        continue\n\ndf["sku"] = df["sku"].str.strip().str.upper()\ndf = df.drop_duplicates(subset=["sku"], keep="last")`,
      question: 'What belongs in dtype=___ so SKU "00421" never loses its leading zeros?',
      options: [
        { text: '{"sku": int}', ok: false, feedback: 'Integer parsing strips leading zeros ("00421" becomes 421), silently breaking downstream SQL joins.' },
        { text: '{"sku": str}', ok: true, feedback: 'Exact. Reading business keys as strings preserves leading zeros and avoids mixed-type corruption.' },
        { text: '{"sku": float}', ok: false, feedback: 'Floats turn "00421" into 421.0 and break string matching completely.' }
      ]
    },
    koan: 'Clean the water at the gate, never inside the drinking cup.',
    worldUpgrade: 'A hand-woven bamboo sluice gate now guards the stream, quietly routing malformed crates into the Quarantine Cove.'
  },
  {
    id: 'ch3-shape',
    num: 3,
    roman: 'III',
    title: 'Shape',
    subtitle: 'Facts, Dimensions & the Unseen Basket',
    tech: 'Star Schema · LEFT JOIN & Unknown (-1)',
    audio: 'audio/ch03.mp3',
    narration: 'Every story has two halves: what happened, and what gives it meaning. Put measurements in your fact house, and names in your dimension house. And when a brand-new item arrives before its name does, leave an empty basket numbered minus one—never drop a single coin.',
    cues: [
      { at: 0.0, scene: 'two-houses', caption: 'Every story has two halves: what happened, and what gives it meaning.' },
      { at: 5.0, scene: 'inner-drop', caption: 'A rigid INNER JOIN drops valid sales when a new SKU arrives late.' },
      { at: 10.5, scene: 'minus-one', caption: 'Leave a gentle basket numbered minus one—so not a single coin is lost.' },
      { at: 15.5, scene: 'star-harmony', caption: 'Facts and Dimensions join in quiet balance.' }
    ],
    touch: {
      prompt: 'Switch the river gate between INNER JOIN and LEFT JOIN + COALESCE(-1). Watch what happens to unknown SKU Z-9999 ($75.00).',
      type: 'toggle',
      offLabel: 'INNER JOIN (Strict Match Only)',
      onLabel: 'LEFT JOIN + COALESCE(product_sk, -1)',
      offReadout: '2 sales of SKU Z-9999 ($94.95) silently vanished into the river!',
      onReadout: 'All 14 sales preserved! Z-9999 lands safely in Unknown Basket (-1).'
    },
    spell: {
      mode: 'pg',
      pgChallengeId: 'pg4-leftjoin',
      intro: 'Now fix the query in real PostgreSQL 18 so all 14 rows of stg_pos_sales survive with product_sk = -1 when unmatched.'
    },
    koan: 'An unknown name is still a real event; never throw away truth for tidiness.',
    worldUpgrade: 'Twin stone storehouses (Facts & Dimensions) and the woven Unknown (-1) Basket rise along the riverbank.'
  },
  {
    id: 'ch4-aqueduct',
    num: 4,
    roman: 'IV',
    title: 'The Aqueduct',
    subtitle: 'Effortless Flow & Fearless Retries',
    tech: 'Postgres COPY · SSIS Fast Load · ON CONFLICT',
    audio: 'audio/ch04.mp3',
    narration: 'Carrying fifty million drops with a teacup takes all night. Open a stone aqueduct—bulk streaming with COPY or Fast Load—and the river moves in a breath. Make every landing idempotent with ON CONFLICT, so if the night rain stops the wheel, you simply turn it again without fear.',
    cues: [
      { at: 0.0, scene: 'teacup', caption: 'Carrying fifty million drops with a teacup takes fourteen hours.' },
      { at: 5.0, scene: 'aqueduct', caption: 'Open a stone aqueduct—PostgreSQL COPY or SSIS Fast Load.' },
      { at: 10.5, scene: 'idempotent-wheel', caption: 'Make every write idempotent with ON CONFLICT DO UPDATE.' },
      { at: 15.5, scene: 'retry-peace', caption: 'When a job can be retried twice with zero duplicates, the engineer sleeps in peace.' }
    ],
    touch: {
      prompt: 'Open each aqueduct valve to feel how a 50-million-row historical backfill drops from 14 hours to 2.5 hours:',
      type: 'backfill',
      toggles: [
        { id: 'copy', label: 'PostgreSQL COPY / SSIS Fast Load', delta: -7.5, note: 'Streams raw buffers instead of per-row INSERTs' },
        { id: 'idx', label: 'Drop & Rebuild Indexes Once', delta: -2.5, note: 'Avoids 50M tiny B-Tree updates mid-load' },
        { id: 'par', label: '4 Parallel Year-Chunk Workers', delta: -1.5, note: 'Fast without starving the source ERP' }
      ]
    },
    spell: {
      mode: 'pg',
      pgChallengeId: 'pg10-upsert',
      intro: 'Write an idempotent ON CONFLICT load in real PostgreSQL 18. The grader runs your SQL TWICE to prove zero duplicate errors.'
    },
    koan: 'True speed is not rushing; it is removing the friction between steps.',
    worldUpgrade: 'A soaring arched stone aqueduct spans the valley—data glides at 85× speed with a retry-proof shield.'
  },
  {
    id: 'ch5-dialects',
    num: 5,
    roman: 'V',
    title: 'Two Tongues, One Meaning',
    subtitle: 'Seeing Past Syntax (T-SQL ↔ PostgreSQL)',
    tech: 'SQL Server ↔ PostgreSQL Translation',
    audio: 'audio/ch05.mp3',
    narration: 'One village calls it ISNULL and TOP; the next calls it COALESCE and LIMIT. One ignores uppercase and lowercase; the other listens closely to every letter. Do not memorize walls of trivia. See the single relational idea beneath both tongues, and you can cross any border calmly.',
    cues: [
      { at: 0.0, scene: 'two-arches', caption: 'SQL Server and PostgreSQL speak different dialects of one timeless grammar.' },
      { at: 5.5, scene: 'case-trap', caption: 'SQL Server ignores casing by default; PostgreSQL distinguishes "a" from "A".' },
      { at: 11.0, scene: 'mvcc-water', caption: 'In PostgreSQL, readers never block writers—leave WITH (NOLOCK) behind.' },
      { at: 16.0, scene: 'unified-stream', caption: 'See the idea beneath the words, and syntax becomes effortless.' }
    ],
    touch: {
      prompt: 'Flip the Mirror Stone to watch real queries shift effortlessly between SQL Server (T-SQL) and PostgreSQL:',
      type: 'dialect-flip',
      pairs: [
        { concept: 'Row Limit', tsql: 'SELECT TOP 5 * FROM sales;', pg: 'SELECT * FROM sales LIMIT 5;' },
        { concept: 'Null Default', tsql: 'ISNULL(scrap_qty, 0)', pg: 'COALESCE(scrap_qty, 0)' },
        { concept: 'Today / Now', tsql: 'CAST(GETDATE() AS DATE)', pg: 'CURRENT_DATE' },
        { concept: 'Upsert', tsql: 'MERGE INTO tgt USING src ...', pg: 'INSERT ... ON CONFLICT DO UPDATE' },
        { concept: 'Case Match', tsql: "sku = 'a-9042' (case-insensitive)", pg: "LOWER(sku) = 'a-9042' (case-sensitive!)" }
      ]
    },
    spell: {
      mode: 'pg',
      pgChallengeId: 'pg6-translate',
      intro: 'Translate this legacy SQL Server query (TOP 3, ISNULL, GETDATE) so it executes cleanly on real PostgreSQL 18.'
    },
    koan: 'Tools change every decade; clear relational thinking endures for a lifetime.',
    worldUpgrade: 'Twin carved stone archways (T-SQL & PostgreSQL) unite above the canal into one crystal current.'
  },
  {
    id: 'ch6-depth',
    num: 6,
    roman: 'VI',
    title: 'Effortless Speed',
    subtitle: 'Opening Only One Drawer',
    tech: 'PostgreSQL Range Partitioning & EXPLAIN',
    audio: 'audio/ch06.mp3',
    narration: 'If a librarian wants the scroll from March, she does not read six years of shelves. She walks straight to March. Partition your table by time, and write clean range bounds without wrapping the column in a function. The fastest query is the one that skips almost everything.',
    cues: [
      { at: 0.0, scene: '72-shelves', caption: 'An unpartitioned 42-million-row table forces a scan across all 72 months.' },
      { at: 5.5, scene: 'pruned-drawer', caption: 'Monthly range partitioning lets PostgreSQL open only the requested drawer.' },
      { at: 11.0, scene: 'sargable-key', caption: 'Never wrap event_ts in EXTRACT()—use clean >= and < range bounds.' },
      { at: 15.5, scene: 'fast-chime', caption: 'The fastest query is the one that skips almost everything.' }
    ],
    touch: {
      prompt: 'Toggle Sargable Range Bounds and slide the query window across 72 monthly locks. Feel the drop from 21.4s to 1.4s.',
      type: 'partitions'
    },
    spell: {
      mode: 'pg',
      pgChallengeId: 'pg12-sargable',
      intro: 'Rewrite the March query on the 12-partition table so the REAL PostgreSQL 18 EXPLAIN plan prunes 11 partitions and scans only 1.'
    },
    koan: 'Mastery of performance is the art of not reading what you do not need.',
    worldUpgrade: '72 carved tidal lock gates line the reservoir—only the requested month opens as water glides through in 1.4 seconds.'
  },
  {
    id: 'ch7-mirror',
    num: 7,
    roman: 'VII',
    title: 'The Mirror',
    subtitle: 'Balance, Time & Recursive Truth',
    tech: 'CTE Reconciliation · Timezones · WITH RECURSIVE',
    audio: 'audio/ch07.mp3',
    narration: 'At cutover night, trust is earned by a still mirror. Count each side alone before comparing, or joining raw tables will distort the reflection. Honor local timezones, trace nested parts with recursive queries, and light the harbour lantern only when both reflections match.',
    cues: [
      { at: 0.0, scene: 'distorted-mirror', caption: 'Joining two raw tables before summing multiplies rows and bends the mirror.' },
      { at: 5.5, scene: 'two-baskets', caption: 'Aggregate each side in its own CTE first, then compare totals cleanly.' },
      { at: 11.0, scene: 'bom-tree', caption: 'Walk nested assemblies with WITH RECURSIVE down to every leaf part.' },
      { at: 15.5, scene: 'lantern-lit', caption: 'Light the watchtower lantern only when both reflections match.' }
    ],
    touch: {
      prompt: 'Switch the Harbour Mirror from Raw Join to Aggregate-First CTEs and watch the phantom fan-out vanish:',
      type: 'toggle',
      offLabel: 'Naive Raw JOIN → SUM()',
      onLabel: 'Aggregate-First CTEs → JOIN',
      offReadout: 'Store 12 EOD total multiplied ×4 rows! False alarm hides the real $25.00 Store 19 mismatch.',
      onReadout: 'Mirror still! Store 12 = 0.00 variance; real $25.00 Store 19 discrepancy pinpointed cleanly.'
    },
    spell: {
      mode: 'pg',
      pgChallengeId: 'pg7-recon',
      intro: 'Write the fan-out-safe CTE reconciliation in real PostgreSQL 18 to find the one mismatched store (Store 19, variance 25.00).'
    },
    koan: 'Aggregate before you join, or one becomes many.',
    worldUpgrade: 'The saffron watchtower lantern glows calmly over the Harbour—reflecting a still, 100%-reconciled sky.'
  }
];

if (typeof module !== 'undefined' && module.exports) module.exports = ZenChapters;
if (typeof window !== 'undefined') window.ZenChapters = ZenChapters;
