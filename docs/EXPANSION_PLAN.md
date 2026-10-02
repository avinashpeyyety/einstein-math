# Einstein Math — Expansion Plan: Math depth · Physics

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

## 2. Physics (first science module — replaces generic "Track S" pilot)

Physics is taught by Einstein in his own voice — the most on-brand subject. Interactive canvas sims, not reading.

| Track | Units |
|-------|-------|
| Ages 5–6 | Push & pull · fast/slow · sink or float · light & shadow · loud/quiet sounds · magnets attract/repel |
| Ages 7–8 | Forces & friction · ramps & simple machines (lever, pulley, wheel) · states of matter · sound vibrations · light reflection · magnetism & compasses |
| Ages 9–10 | Speed = distance ÷ time · gravity & falling · energy forms & transfer · circuits (series/parallel sim) · light refraction & color · Earth–Moon–Sun motion |
| Ages 11–14 | Newton's 3 laws · momentum · work/power · waves · electricity (Ohm's law) · density & buoyancy · Einstein bonus: relativity thought-experiments |

Engine: `js/sims/` — tiny canvas sims (ramp, pendulum, circuit, lens, buoyancy) driven by lesson JSON params; checks read sim state. Mastery and review reuse the math engine.

## 3. SQL — on hold (moved out)

Per Avinash (2026-10-01): SQL is for adults and will be a **separate portal**, not part of Einstein Math. No SQL tickets here.

## 4. Platform work needed first

1. Schema v3 real: `subjects.{math,physics}.tracks.*`; progress keyed `subject:track` with migration from v2 keys.
2. Subject switcher live (W1 stub) + subject-aware Today's path and parent summary.
3. Age tracks 11–12 and 13–14 added to the picker (optional per subject).
4. Lazy subject packs: `data/subjects/<subject>.json` loaded on demand; SW caches on first use.

## 5. Ticket queue (top unchecked = next cycle)

Effort: S ≤ 1 cycle, M = 2 cycles. Each ticket ends with smoke (0 JS errors, existing math flows pass), SW cache bump if shipped assets change, commit on the Air.

- [x] **X1 (M)** Schema v3 for real + progress key migration `subject:track` (math unchanged for users) — ✅ done 2026-10-01
- [ ] **X2 (S)** Lazy subject packs `data/subjects/*.json` + SW cache-on-first-use
- [ ] **X3 (S)** Subject switcher live; Today's path + parent summary subject-aware
- [ ] **X4 (M)** Physics engine `js/sims/` + first sim (ramp & friction) + lesson type `sim`
- [ ] **X5 (M)** Physics pilot: ages 7–8 unit "Forces & friction" (4 lessons + check) — Studio: 2 Einstein physics panels
- [ ] **X6 (S)** Physics ages 5–6 unit "Push & pull / sink or float" (3 lessons)
- [ ] **X9 (M)** Math: procedural generators for top 10 practiced skills (seeded, difficulty dial)
- [ ] **X10 (M)** Math ages 11–12 track v1: ratios, percents, negatives, one-step equations (8 lessons)
- [ ] **X11 (S)** Fact-fluency arcade (timed sprints, streaks, bests)
- [ ] **X12 (M)** Physics ages 9–10: speed, gravity, circuits sim (5 lessons)
- [ ] **X14 (S)** Puzzle of the day (math + physics rotation)
- [ ] **X15 (M)** Math ages 13–14 pre-algebra v1 (8 lessons)
- [ ] **X16 (M)** Physics ages 11–14: Newton's laws + Ohm's law sims (6 lessons)
- [ ] **X18 (S)** Parent skill heat-grid + printable generated worksheets
- [ ] **X19 (S)** Rename/branding pass: "Einstein Academy" umbrella (math stays the flagship) — only if Avinash approves the name

Blocked on Avinash (do not stall the queue): public GitHub/Pages create for einstein-math (PAT 403).

## 6. Pacing

- **Sprint cycles:** weekdays 10:37 AM and 3:37 PM CT (two tickets/day max; one if M ticket needs two cycles).
- **Week shape:** Mon–Thu ship tickets; Fri cycle = polish/regressions + docs.
- **Pulse:** included in the twice-daily sprint pulse (11:03, 4:03) — tickets shipped, next ticket, blockers.
- **Stop rules:** two failed smokes on the same ticket → mark ⚠ with reason, skip to next; Air offline → stage on box, apply when back; never push to public; never ship third-party code without vendoring + license note.

## 7. Progress log

- 2026-10-01 · X1 shipped: store schema v3 (`einstein-math-v3`), progress keyed `math:<track>`, v2/stub-v3 migrate on load (v2 key kept), subjects = math (live) + physics (soon); SW v2.3.9
- 2026-10-01 · (side ask) progress safety net: IndexedDB mirror + auto-restore + progress report download / auto-save file / restore from file
