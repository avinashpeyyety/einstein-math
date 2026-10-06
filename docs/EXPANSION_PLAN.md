# Einstein Math — Expansion Plan: Math depth · Physics · Space Lab · History (later)

**Owner:** Chief (autonomous paced sprints; no go-ahead needed) · **Implementers:** Forge (engine/UI/content), Studio (comic panels)
**Cadence:** one ticket per sprint cycle, weekday cycles (see §6). Each cycle: take the top unchecked ticket in §5 → ship → smoke → commit → tick it here → pulse.
**Spine kept:** age tracks, mastery + spaced review, Today's path, device-local profiles, comic Einstein, PWA offline, parent summary (SPRINT_PLAN §1).

---

## 1. Is there scope to expand math? Yes.

Today: 3 tracks (ages 5–6, 7–8, 9–10), ~28–30 lessons each, K–5 only, fixed item banks.

| Gap | Expansion |
|-----|-----------|
| Stops at grade 5 | **Ages 11–12 (grades 6–7)**: ratios & rates, percents, negatives, expressions & one-step equations, area of composite shapes, mean/median/mode, intro probability |
| Then | **Ages 13–14 (grade 8 / pre-algebra)**: linear equations, slope, functions, Pythagorean theorem, exponents & scientific notation, transformations |
| Fixed items → repetition | **Procedural item generators** per skill (seeded, difficulty dial) so practice never runs dry |
| Fluency | **Fact-fluency arcade** (timed +/−/×/÷ sprints, streaks, personal bests) |
| Thinking | **Puzzle of the day** (logic, number sense, KenKen-lite) + **math-in-the-world** word problems |
| Teacher/parent | Skill map heat-grid, printable worksheets from the generator |

### 1b. Math coverage audit (2026-10-03)

Full inventory + Common Core K–8 gap tables per age track: [`MATH_COVERAGE_AUDIT.md`](MATH_COVERAGE_AUDIT.md). Biggest gaps inside the existing tracks: ×3/4/6–9 facts and **area** (ages 7–8, no geometry unit), **unlike-denominator fractions**, decimal ×/÷, angles/shape classification and data (ages 9–10), 2-digit place value and equations with unknowns (ages 5–6). Gap-fill tickets X20–X38 are interleaved in §5. Math depth is a goal alongside physics.

## 2. Physics (first science module — replaces generic "Track S" pilot)

Physics is taught by Einstein in his own voice — the most on-brand subject. Interactive canvas sims, not reading.

| Track | Units |
|-------|-------|
| Ages 5–6 | Push & pull · fast/slow · sink or float · light & shadow · loud/quiet sounds · magnets attract/repel |
| Ages 7–8 | Forces & friction · ramps & simple machines (lever, pulley, wheel) · states of matter · sound vibrations · light reflection · magnetism & compasses |
| Ages 9–10 | Speed = distance ÷ time · gravity & falling · energy forms & transfer · circuits (series/parallel sim) · light refraction & color · Earth–Moon–Sun motion |
| Ages 11–14 | Newton's 3 laws · momentum · work/power · waves · electricity (Ohm's law) · density & buoyancy · Einstein bonus: relativity thought-experiments |

Engine: `js/sims/` — tiny canvas sims (ramp, pendulum, circuit, lens, buoyancy) driven by lesson JSON params; checks read sim state. Mastery and review reuse the math engine.

### 2b. Space Lab (Cosmos merged in, v2.5.0)

The former Cosmos app (github.com/avinashpeyyety/cosmos) now lives in this repo at `cosmos/` (Three.js r170 vendored in `vendor/three/`, MIT) and is part of **Physics** — not a separate track. Entry points: top-nav **🔭 Space**, Home "Space Lab" panel, and a **Space Lab** unit card on every Physics Mission Map; catalog in `js/space.js`.

| Section | Status | In the app |
|---|---|---|
| Solar System (8 planets, Pluto, moons, comets + tails, asteroid belt, time controls, layer toggles, focus/fly-to) | ✅ working | `cosmos/?mode=solar` |
| Launch Sites & Liftoff (6 sites, pad fog/floodlights, ascent HUD, 8 playable launches) | ✅ working | `cosmos/?mode=earth` |
| Low Earth Orbit (ISS 51.6° view) | ✅ working | `cosmos/?mode=leo` |
| Life of a Star (scrubber, low/high mass fork, NS/BH ending) | ✅ working | `cosmos/?mode=stars` |
| Rocket landings: Falcon 9 RTLS, Starship tower catch | 🚧 stub (coming-soon card + disabled mission chips; F9 booster no longer fakes a landing) | C1, C2 |
| LEO mission catalog (Hubble, Starlink trains, F9 ASDS, Starship loop, Falcon cadence — `cosmos/js/leo.js`, never wired) | 🚧 stub | C3 |

History: `_archive/cosmos-history/` (git bundle + old URLs). Original Cosmos plan: `cosmos/docs/COSMOS_SPRINT_PLAN_ORIGINAL.md`.

## 3. SQL — on hold (moved out)

Per Avinash (2026-10-01): SQL is for adults and will be a **separate portal**, not part of Einstein Math. No SQL tickets here.

## 4. Platform work needed first

1. Schema v3 real: `subjects.{math,physics}.tracks.*`; progress keyed `subject:track` with migration from v2 keys.
2. Subject switcher live (W1 stub) + subject-aware Today's path and parent summary.
3. Age tracks 11–12 and 13–14 added to the picker (optional per subject).
4. Lazy subject packs: `data/subjects/<subject>.json` loaded on demand; SW caches on first use.

## 5. Ticket queue (top unchecked = next cycle)

Effort: XS ≈ ½ cycle, S ≤ 1 cycle, M = 2 cycles. Each ticket ends with smoke (0 JS errors, existing math flows pass), SW cache bump if shipped assets change, commit on the Air.

- [x] **X1 (M)** Schema v3 for real + progress key migration `subject:track` (math unchanged for users) — ✅ done 2026-10-01
- [x] **X2 (S)** Lazy subject packs `data/subjects/*.json` + SW cache-on-first-use — ✅ done 2026-10-01
- [x] **X3 (S)** Subject switcher live; Today's path + parent summary subject-aware — ✅ done 2026-10-02
- [x] **X4 (M)** Physics engine `js/sims/` + first sim (ramp & friction) + lesson type `sim` — ✅ done 2026-10-03 (staged on box mirror; Air offline)
- [ ] **X5 (M)** Physics pilot: ages 7–8 unit "Forces & friction" (4 lessons + check) — Studio: 2 Einstein physics panels — 🔄 in progress: cycle 1/2 done 2026-10-06 (`5e8b1e4`, 4 labs + unit check live); cycle 2 = the 2 Einstein physics panels
- [ ] **X20 (S)** Math 7–8: ×3/×4/×6–×9 facts + division as unknown factor + commutative/distributive properties (4 lessons) — *audit #1 gap (3.OA)*
- [ ] **X6 (S)** Physics ages 5–6 unit "Push & pull / sink or float" (3 lessons)
- [ ] **X23 (S)** Math 5–6: tens & ones, compare 2-digit with <, >, =, 10 more/10 less, 2-digit + 1-digit (3 lessons) — *1.NBT*
- [ ] **X21 (S)** Math 7–8: Area — unit squares, rows × columns, additive area, area vs perimeter (3 lessons) + unit-square grid visual — *3.MD*
- [ ] **X22 (S)** Math 9–10: add/subtract fractions with unlike denominators (3 lessons) — *5.NF*
- [ ] **C4 (XS)** Space Lab: mobile body picker <560px + Earth/LEO bar no longer overlaps the body list (Cosmos Cycle 3 carry-over)
- [ ] **X9 (M)** Math: procedural generators for top 10 practiced skills (seeded, difficulty dial) — include X20–X22 skills
- [ ] **X12 (M)** Physics ages 9–10: speed, gravity, circuits sim (5 lessons)
- [ ] **X25 (S)** Math 7–8: fractions on a number line, simple equivalence, compare same numerator/denominator (3 lessons) + number-line visual — *3.NF*
- [ ] **X24 (M)** Math 9–10: Geometry — lines/rays/angles, measure angles (protractor visual), parallel/perpendicular, classify triangles & quadrilaterals, symmetry (5 lessons) — *4.G, 4.MD.5–7, 5.G.3–4*
- [ ] **X40 (M)** Physics ages 7–8 unit 2: simple machines — lever & pulley sims (4 lessons)
- [ ] **X28 (S)** Math 7–8: add/sub within 1000, skip-count by 5/10/100, expanded form, even/odd (3 lessons) — *2.NBT, 2.OA.3*
- [ ] **X26 (S)** Math 9–10: multiply & divide decimals, powers of 10, thousandths & rounding decimals (4 lessons) — *5.NBT*
- [ ] **C1 (S)** Space Lab: rebuild Falcon 9 booster recovery — boostback → entry → landing burn onto a visible LZ/droneship; un-stub "Falcon 9 · first RTLS" (`STUB_MISSIONS`, `RECOVERY_STUBBED`)
- [ ] **X10 (M)** Math ages 11–12 track v1: ratios, percents, negatives, one-step equations (8 lessons)
- [ ] **X11 (S)** Fact-fluency arcade (timed sprints, streaks, bests)
- [ ] **X41 (S)** Physics ages 5–6 unit 2: light & shadow + magnets (3 lessons)
- [ ] **X27 (S)** Math 9–10: unit conversions (metric + customary + time) and line plots with fractions (3 lessons) — *4.MD.1–2, 4.MD.4, 5.MD.1–2*
- [ ] **X29 (M)** Math 9–10: fraction × fraction, fractions as division, unit fraction ÷ whole & whole ÷ unit fraction, fractional-side area (4 lessons) — *5.NF.3–7*
- [ ] **X16 (M)** Physics ages 11–14: Newton's laws + Ohm's law sims (6 lessons)
- [ ] **X34 (S)** Math 7–8: mass & liquid volume (g, kg, L), time to the minute, scaled picture/bar graphs, line plots (3 lessons) — *3.MD.1–4*
- [ ] **C2 (S)** Space Lab: Starship tower catch rebuilt — tower stays visible through return, arms close on the booster; un-stub "Starship · tower catch"
- [ ] **X30 (S)** Math 5–6: unknown addend, true/false equations (=), add three numbers, turn-around facts (3 lessons) — *1.OA*
- [ ] **X35 (S)** Mental Math Gym unit in every track (2 lessons each: count on/back & ±10 · compensation & near doubles · ×10/×100 & estimation)
- [ ] **X14 (S)** Puzzle of the day (math + physics rotation)
- [ ] **X36 (S)** Word-problem types: start/change unknown (5–6), two-step with all four operations (7–8), multiplicative comparison (9–10) — 1 lesson per track
- [ ] **C3 (S)** Space Lab: wire `cosmos/js/leo.js` catalog as LEO toggles (Hubble, one Starlink shell) with altitude/inclination/period chips
- [ ] **X15 (M)** Math ages 13–14 pre-algebra v1 (8 lessons)
- [ ] **X31 (XS)** Math 5–6: halves & fourths of shapes, positional words (2 lessons) — *1.G*
- [ ] **X32 (XS)** Math 7–8: quadrilaterals & shape attributes (2 lessons) — *2.G, 3.G.1*
- [ ] **X33 (XS)** Math 9–10: place value to 1,000,000 + rounding multi-digit (2 lessons) — *4.NBT.1–3*
- [ ] **X37 (XS)** Math 9–10: two-rule patterns → ordered pairs, quadrant-1 graphing problems, expressions with ( ) [ ] (2 lessons) — *5.OA, 5.G.2*
- [ ] **X38 (XS)** Math 5–6: count to 120 / count on / before–after, non-standard length units, order 3 lengths (2 lessons) — *K.CC, 1.NBT.1, 1.MD.1–2*
- [ ] **X42 (S)** Space Lab lessons: 2 physics lessons that use the labs (Earth–Moon–Sun & orbits for 9–10, life of a star for 11–14) with Einstein panels + checks
- [ ] **X18 (S)** Parent skill heat-grid + printable generated worksheets
- [ ] **H0 → H6 History** — see [`HISTORY_PLAN.md`](HISTORY_PLAN.md) §5 (starts after X18; earliest Wed 2026-11-11 PM cycle, realistic mid–late Nov 2026)
- [ ] **X19 (S)** Rename/branding pass: "Einstein Academy" umbrella (math stays the flagship) — only if Avinash approves the name (gated; does not block the queue)

Sizes: XS ≈ half a cycle (content-only, 2 lessons), S = 1 cycle, M = 2 cycles. Mix before History: ~25 math · 7 physics · 4 Space Lab tickets. Through C3 a physics or Space Lab ticket lands at least every 2–4 cycles; the tail is a batch of XS math content tickets (≈ 2½ days) before X42/X18.

Blocked on Avinash (do not stall the queue): public GitHub/Pages create for einstein-math (PAT 403).

## 5b. History (later build)

Comprehensive World + American + Indian history, age-banded, with timelines, maps, primary-source cards and quizzes — plan of record in [`HISTORY_PLAN.md`](HISTORY_PLAN.md). Placement: after **X18**; earliest start Wed 2026-11-11 (3:37 PM CT cycle) at zero slip, realistically mid–late November 2026.

## 6. Pacing

- **Sprint cycles:** weekdays 10:37 AM and 3:37 PM CT (two tickets/day max; one if M ticket needs two cycles).
- **Week shape:** Mon–Thu ship tickets; Fri cycle = polish/regressions + docs.
- **Pulse:** included in the twice-daily sprint pulse (11:03, 4:03) — tickets shipped, next ticket, blockers.
- **Stop rules:** two failed smokes on the same ticket → mark ⚠ with reason, skip to next; Air offline → stage on box, apply when back; never push to public; never ship third-party code without vendoring + license note.

## 7. Progress log

- 2026-10-01 · X1 shipped: store schema v3 (`einstein-math-v3`), progress keyed `math:<track>`, v2/stub-v3 migrate on load (v2 key kept), subjects = math (live) + physics (soon); SW v2.3.9
- 2026-10-01 · X2 shipped: lessons moved to subject packs `data/subjects/math.json` (was `data/curriculum.json`, same shape) + `physics.json` stub; only the packs in use are fetched (`Subjects.loadPack`/`loadCurriculum`); SW precaches math, caches other packs on first use in `einstein-math-packs-v1` (kept across versions, refreshed when online); tests/subject-packs.test.js; SW v2.4.6
- 2026-10-01 · (side ask) progress safety net: IndexedDB mirror + auto-restore + progress report download / auto-save file / restore from file
- 2026-10-02 · X3 shipped: subject switcher live for Math + Physics (stub → friendly coming-soon, Back to Math); switching loads the pack via `Subjects.loadPack`, progress reads/writes `<subject>:<track>` (age track shared via `trackBySubject`), Today's path + parent summary follow the selected subject (summary never writes empty keys); choice persists in `prefs.activeSubject`; math unchanged; tests/subjects-x3.test.js; SW v2.4.7
- 2026-10-02 CT · Friday polish / F-polish (`7edc6c4`): Air reachable; baseline @ 9d72d42 (X3); ran storage-v3 + subject-packs + subjects-x3 tests (25 pass); HTTP smoke of shell/packs OK; scrubbed stale SPRINT_PLAN (science/geography/curriculum.json → physics + lazy packs; SQL hold noted) + README (v3 key, SW cache v2.4.7, expansion plan pointer); docs-only, no app/SW code change
- 2026-10-03 · X4 shipped (box lab mirror; Air offline → format-patch staged in /workspace/x4): dependency-free sim engine `js/sims/engine.js` (fixed dt 1/120 s, deterministic, pure model.step, frame-rate-independent accumulator), ramp & friction sim `js/sims/ramp.js` (starts only when tanθ > μs, then a = g(sinθ − μk·cosθ); exact constant-a integration so t = √(2L/a); canvas + keyboard sliders + live readout + reduced-motion instant result), sim checks `js/sims/checks.js` (goal checks graded from the kid's run; predict checks whose answers the sim computes; lesson validation). New lesson type `sim` (intro → panels → Lab → Lab Check → ★) with progress/stars under `physics:<track>`; physics.json gets 2 sim lessons (ages 7–8 "Slide or Stick?", ages 9–10 "Ramp Racer"); ages 5–6 keeps the coming-soon state. Sim code lazy-loaded on first lab (not precached; SW caches it on first use). tests/sims-ramp.test.js; SW v2.4.8
- 2026-10-03 · Cosmos → Space Lab merge (v2.5.0): Cosmos code moved to `cosmos/` with Three.js r170 vendored (`vendor/three/`, MIT; was unpkg CDN); wired into Physics — top-nav 🔭 Space screen (`js/space.js` catalog), Home teaser, Space Lab unit card on Physics Mission Maps; deep links `cosmos/?mode=solar|earth|leo|stars&site=&focus=`; back link `../#space`. Working: Solar System, Launch Sites & Liftoff (8 launches), LEO view, Life of a Star. Stubbed (coming soon): F9 RTLS landing, Starship tower catch (disabled chips + F9 booster drops out instead of fake landing), LEO mission catalog (`leo.js`, never wired). SW: cosmos + three lazy cache-first; HTML navigations under `cosmos/` cached under their own path (no longer able to overwrite the app shell); `js/space.js` precached. History bundle in `_archive/cosmos-history/`. Docs: math coverage audit + gap tickets X20–X38, physics X40–X41, Space Lab C1–C4/X42, History plan (H0 after X18). tests/space-lab.test.js; SW v2.5.0
- 2026-10-06 · X5 cycle 1/2 (`5e8b1e4`): ages 7–8 "Forces & Friction" unit now 4 ramp-lab lessons + unit check — Slide or Stick (X4) → Steeper Means Faster? (angle only) → Ice, Wood or Carpet? (grip) → Heavy vs Light: The Big Race (mass cancels) → Forces & Friction Check ⭐ (5 mixed checks); prerequisites chain through the unit; every goal needs a slider change and is reachable, every prediction is computed by the sim; tests/physics-x5.test.js (4 pass, all suites green); headless-Chrome smoke: app loads with 0 JS errors, math pack (89 lessons) + physics pack load, all 5 labs mount, 💾 backup report + storage OK; SW v2.5.1. Next cycle: the 2 Einstein physics panels (Studio art; Studio idle while the Mahabharata sprint is paused), then X20
