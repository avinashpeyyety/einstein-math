# Einstein Math — Continuous Multi-Subject Sprint Plan

**Status:** Continuous development (not a fixed end date)  
**Product spine:** Ages **5–6 / 7–8 / 9–10** tracks  
**Owners:** Forge (product/engine/UI) · Studio (comic art/panels) · Chief (one ticket/cycle) · Pulse (keep EM on Next until cadence is routine)

---

## 0. North star

One **comic-led, age-tracked, offline-capable PWA hub**. Subjects ship as **modules** that share profile, mastery, spaced review, Today’s path, and parent export/import. Math proves the engine; science, geography, and later subjects plug into the same spine → a **one-stop gamified education** product by age track.

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

**Math remains the proving ground** for the shared engine until Track P + first Science pilot prove the module pattern.

---

## 2. Architecture (platform-agnostic module model)

### Shared (once)

- Profiles, progress store, Today’s path, parent summary, visuals renderer, speech, SW shell
- Age-track picker and explorer identity

### Per subject (module)

- Units → lessons (explain → example → practice → check)
- Diagnostic items + suggested path
- Visual keys / Imagine panels
- Subject-scoped speech copy

### Curriculum shape (target schema v3)

```text
curriculum.json  (or split packs later)
  subjects: {
    math:       { tracks: { "ages-5-6": …, "ages-7-8": …, "ages-9-10": … } },
    science:    { tracks: { … } },
    geography:  { tracks: { … } },
    …
  }
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

- Subject switcher in UI (Math default)
- Curriculum schema v3: `subjects: { math, science, geography, … }` each with tracks
- Progress namespaced by subject + track
- SW cache / versioning discipline for multi-pack assets

### Track S — Science (first expansion)

- Pilot **1 unit per age band** (e.g. living things / matter / earth-sky)
- Same lesson phases: explain → example → practice → check
- Reuse Einstein comic voice + shared progress UI

### Track G — Geography (second expansion)

- Pilot maps / places / climate-lite per age band
- After S proves the module pattern

### Track X — More subjects (backlog)

- Reading / history / coding-lite
- **Park** until P + S prove the module pattern

---

## 4. Cadence (2–4 weeks rolling)

- Week-sized **S/M** tickets; **one active build at a time** unless Avinash parallelizes
- Chief assigns ≤1 ticket per cycle; Forge builds; Studio only when panels/art needed
- Example roll:

| Week | Focus (example) |
|------|-----------------|
| W1 | Track P: schema v3 stub + subject switcher (Math-only still works) |
| W2 | Track S: science pilot unit for ages 5–6 |
| W3 | Track S: science pilots for 7–8 and/or 9–10 |
| W4 | Track M: math depth / visuals OR Track G kickoff |
| Ongoing | Track M fills gaps whenever platform tickets idle |

Start EM continuous work **after Mahabharata clears**, or when Avinash explicitly parallelizes.

---

## 5. Owners

| Role | Job on this plan |
|------|------------------|
| **Forge** | Product, engine, UI, schema, SW, subject modules |
| **Studio** | Comic art / Imagine panels when a ticket needs visuals |
| **Chief** | Assign **one** ticket per cycle from this plan |
| **Pulse** | Keep Einstein Math on **COMMAND Next** until continuous cadence is routine |

---

## 6. Definition of done (this planning ticket)

- [x] This file exists at `docs/SPRINT_PLAN.md`
- [x] README one-line pointer to this plan
- [x] `COMMAND.md` Next updated (MB stays In flight; EM listed for after MB / parallelize)
- [x] Commit + push `einstein-math` (`docs: continuous multi-subject sprint plan`)

---

## Vision (Avinash)

Continuous development. Not math-only forever. Expand into **science, geography, and other subjects** as a **comprehensive one-stop gamified education** product, **graded by age groups**, keeping the existing 5–6 / 7–8 / 9–10 tracks as the age spine.
