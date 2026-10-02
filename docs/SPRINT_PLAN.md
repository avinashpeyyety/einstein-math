# Einstein Math — Continuous Multi-Subject Sprint Plan

**Status:** Continuous development (not a fixed end date)  
**Product spine:** Ages **5–6 / 7–8 / 9–10** tracks  
**Owners:** Forge (product/engine/UI) · Studio (comic art/panels) · Chief (one ticket/cycle) · Pulse (keep EM on Next until cadence is routine)

---

## 0. North star

One **comic-led, age-tracked, offline-capable PWA hub**. Subjects ship as **modules** that share profile, mastery, spaced review, Today’s path, and parent export/import. Math proves the engine; **physics** is the first science module (see [`EXPANSION_PLAN.md`](EXPANSION_PLAN.md)). SQL is **not** part of Einstein Math (separate adult portal). Active ticket queue + Friday polish cadence live in the expansion plan.

---

## 1. Non-negotiables

Keep forever (math or not):

| Pillar | Note |
|--------|------|
| Age tracks | 5–6 / 7–8 / 9–10 as the age spine |
| Mastery + spaced review | Check thresholds, needs_review, Retry weak spots |
| Device-local profiles | No accounts; `localStorage` + export/import handoff |
| Comic Einstein voice | Speech bubbles, no-shame pedagogy |
| PWA / offline | SW cache; bump cache name on ship |
| Parent summary | Print/PDF + JSON download |

**Math remains the proving ground** for the shared engine; Track P (X1–X3) shipped schema v3 + live subject switcher. Next platform/content work is physics (`js/sims/` + pilot units) per EXPANSION_PLAN §5.

---

## 2. Architecture (platform-agnostic module model)

### Shared (once)

- Profiles, progress store, Today’s path, parent summary, visuals renderer, speech, SW shell
- Age-track picker and explorer identity (optional **comicified photo avatar** from profile upload)

### Per subject (module)

- Units → lessons (explain → example → practice → check)
- Diagnostic items + suggested path
- Visual keys / Imagine panels
- Subject-scoped speech copy

### Curriculum shape (target schema v3)

```text
data/subjects/<subject>.json   (lazy packs; math precached, others on first use)
  meta + tracks: { "ages-5-6": …, "ages-7-8": …, "ages-9-10": … }

Schema v3 store (einstein-math-v3):
  subjects live: math; soon: physics
  progress keys: subject:track  (e.g. math:ages-7-8)
```

Progress keys **namespaced** by `subject + track` so multi-subject explorers stay clean.

---

## 3. Sprint tracks

### Track M — Math continuous (ongoing)

- Fill weak / thin lessons; more depth per unit
- New visuals / Imagine panels where HTML viz isn’t enough
- Pedagogy: adaptive hints, better remediation
- Assessment richness (diagnostic + check)

### Track P — Platform (enables multi-subject)

- ✅ Subject switcher live (Math + Physics coming-soon; X3) — Today's path + parent summary follow subject
- ✅ Schema v3 + lazy packs `data/subjects/*.json` (X1/X2); subjects = math (live) + physics (soon)
- ✅ Progress namespaced `subject:track`
- SW cache / versioning discipline for multi-pack assets (`einstein-math-packs-v1`)
- **Personalized comic profile:** ✅ **Shipped (v2.4.0)** · UI on Home (v2.4.1) · comicify quality pass (v2.4.2, ~640px PNG) — in-browser comicify (canvas; no external APIs) → explorer avatar on chip / Home cards / Progress / student portrait; stored as `avatarDataUrl` with device-local profile + export/import; photo never leaves the device
- **Home profile controls (v2.4.2):** rename + comic photo upload/clear moved to Home Who’s Playing cards and Create / + New Explorer form; Progress keeps identity row only (no upload/rename tools)

### Track S — Physics (first science module; replaces generic Science pilot)

- Active tickets in [`EXPANSION_PLAN.md`](EXPANSION_PLAN.md) §5: **X4** physics engine `js/sims/` + ramp sim → **X5/X6/X12/X16** age-band units
- Same lesson phases + new lesson type `sim`; reuse mastery / review / Today's path
- Einstein teaches physics in his own voice; Studio panels when a ticket needs art

### Track G / other subjects — parked

- Geography, reading, history, coding-lite: **parked** until physics proves the module pattern
- **SQL:** on hold forever for Einstein Math (separate adult portal) — never add SQL tickets here

---

## 4. Cadence (2–4 weeks rolling)

- Week-sized **S/M** tickets; **one active build at a time** unless Avinash parallelizes
- Chief assigns ≤1 ticket per cycle; Forge builds; Studio only when panels/art needed
- Example roll:

| Week | Focus (example) |
|------|-----------------|
| W1 | ✅ Track P: schema v3 stub + subject switcher (Math-only still works) |
| W1b | ✅ Track P: profile photo upload → comicify → personalized explorer avatar — v2.4.0/2.4.2 photo + rename UI on Home; device-local MediaPipe comic avatar (W1b) merged in v2.4.3 |
| X1–X3 | ✅ Schema v3, lazy packs, subject switcher (2026-10-01/02) |
| Next | EXPANSION_PLAN §5 top unchecked (**X4** physics engine) — Mon–Thu ship; Fri = polish/docs |
| Ongoing | Math depth (X9/X10/X11/…) interleaved after physics pilot proves `sim` |

Autonomous paced sprints are pre-authorized (see EXPANSION_PLAN §6).

---

## 5. Owners

| Role | Job on this plan |
|------|------------------|
| **Forge** | Product, engine, UI, schema, SW, subject modules |
| **Studio** | Comic art / Imagine panels when a ticket needs visuals |
| **Chief** | Assign **one** ticket per cycle from [`EXPANSION_PLAN.md`](EXPANSION_PLAN.md) §5 (Fri = polish) |
| **Pulse** | Keep Einstein Math on **COMMAND Next** until continuous cadence is routine |

---

## 6. Definition of done (this planning ticket)

- [x] This file exists at `docs/SPRINT_PLAN.md`
- [x] README one-line pointer to this plan
- [x] `COMMAND.md` Next updated (MB stays In flight; EM listed for after MB / parallelize)
- [x] Commit + push `einstein-math` (`docs: continuous multi-subject sprint plan`)

---

## Vision (Avinash)

Continuous development. Not math-only forever. Next subject is **physics** (Einstein-voiced sims); deeper math tracks (11–14) and fluency/puzzles follow in EXPANSION_PLAN. Other subjects stay parked. SQL is a separate adult portal — not Einstein Math. Age spine stays 5–6 / 7–8 / 9–10 (with 11–14 queued).

---

## 7. Product backlog (Avinash asks)

| Ask | Track | Note |
|-----|-------|------|
| Profile photo upload → comicify for personalized explorer avatar | P | ✅ **Shipped (v2.4.0)**; **UI on Home (v2.4.2)** — create form + Who’s Playing cards host upload/clear/rename; Progress identity only; in-browser comicify; `avatarDataUrl`; export/import; no external APIs |
