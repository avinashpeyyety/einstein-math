# Cosmos sprint plan — continuous visual / content / info loop

**Plan of record** for Studio-led Cosmos work under Pixelloid. Assigned **2026-09-16**.  
**Owner:** Studio (pixelloid lane). Pulse keeps Cosmos visible in Command **Next** until it is **In flight**.  
**Does not** steal the Mahābhārata In-flight slot unless Avinash says parallelize.  
**Live:** https://avinashpeyyety.github.io/pixelloid/cosmos/  
**Publish:** `ai-lab-vault/scripts/publish-pages.sh cosmos`  
**Refs:** [`../NEXT.md`](../NEXT.md) · [`../README.md`](../README.md)

This is a **continuous loop**, not a one-and-done sprint. Each cycle ships one visual + one content + one space-info improvement, then repeats.

---

## Vision

World-class interactive space education: visually stunning, factually rich, continuously improved.

Cosmos should feel like an **ops instrument** for looking at the sky — dense, accurate, tasteful — not a marketing splash. Schematic vs to-scale is always labeled. Facts have sources. Beauty serves understanding.

---

## Three pillars

Each sprint cycle **touches all three**. Never ship a pretty pass with empty facts, or a fact dump with muddy lighting.

### A. Visual quality

Lighting, PBR/materials, atmosphere, textures (NASA where offline-ok), shadows, bloom/fog **tastefully**, camera polish, mobile perf, UI chrome density matching ops-instrument clarity (not marketing fluff).

### B. Content

More missions (Shuttle final, Artemis I, Electron, …), LEO objects (Hubble, Starlink shell), solar-body detail, star-lifecycle fidelity, narrative beats on launch/staging.

### C. Space information

Accurate labels, scales/distances callouts, orbital facts, unit toggles, educational HUD panels, source-of-truth notes (schematic vs to-scale), glossary tips **without clutter**.

---

## Continuous loop (cadence)

Weekly (or per-ship) cycle:

1. **Audit** — play live Pages on desktop + phone; note one gap per pillar.
2. **Improve** — one visual + one content + one info item (keep the trio small enough to ship).
3. **Publish** — `ai-lab-vault/scripts/publish-pages.sh cosmos` (syncs working tree → `pixelloid/cosmos/` + Pages).
4. **Measure** — mobile FPS, load, link check (github.io/pixelloid/cosmos/).
5. **Log** — brief note in this file’s Changelog + tick `NEXT.md`.

**Slot rule:** Cosmos stays in Command **Next** while Mahābhārata is In flight. Promote Cosmos to In flight only when Avinash parallelizes or MB clears.

**Working trees**

| Path | Role |
|------|------|
| `ai-projects/cosmos/` | Git working copy / public mirror https://github.com/avinashpeyyety/cosmos |
| `ai-projects/pixelloid/cosmos/` | Shipping copy on Pages |

Iterate in the working copy; publish is the only path that makes it live.

---

## Sprint 0 — baseline (2026-09-16)

Inventory of what is live today. No feature work in this planning ticket.

### Modes (keys)

| Key | Mode | What it is now |
|-----|------|----------------|
| **S** | Solar system | Keplerian planets + Pluto, moons, comets, belt, bloom sun; compressed AU (`auToScene` power 0.72). |
| **E** | Earth launch theater | Globe + 6 sites; site zoom + sequenced ascent. |
| **L** | LEO theater | ISS-ish altitude, Apollo/Falcon/Starship windows; Hubble / ISS / Starlink exist in catalog, not as clean user toggles. |
| **T** | Star lifecycle | Cosmic-time scrub; Sun-like vs Massive fork (PN→WD vs SN→NS/BH). |

### Launch sites (Earth mode)

Cape Canaveral / KSC · Vandenberg SFB · Starbase Boca Chica · Baikonur · Kourou · Jiuquan.

### Playable launch missions

Mercury-Redstone 3 · Apollo 11 · STS-1 Columbia · Falcon 9 first RTLS · Falcon 9 Starlink · Falcon 9 polar · Starship tower catch · Vostok 1 · Ariane 5 · Shenzhou.

**Missing vs NEXT:** Shuttle **final** (STS-135), **Artemis I**, **Electron**.

### Solar catalog (bodies.js)

Sol + Mercury–Neptune + Pluto; moons via `moons.js`; comets Halley, Encke, Hale–Bopp, Swift–Tuttle, Tempel 1.  
HUD stats today: semi-major, year, day, moons — **no** live distance, equilibrium temp, discovery year, unit toggle, or schematic disclaimer.

### Star lifecycle stages

- **Sun-like:** molecular cloud → protostar → main sequence → red giant → planetary nebula → white dwarf.
- **Massive:** cloud → massive protostar → massive MS → red supergiant → core-collapse SN → neutron star **or** stellar black hole.

Stage name + short note on scrub; no overlay facts (T_eff, radius, fusion stage, remnant mass).

### Known gaps (from NEXT.md)

**Now**

- ~~Launch camera: ease cuts at staging / SECO~~ **shipped** (Cycle 1 lead).
- ~~Site detail: short ground fog + floodlight beams only in pad-local phase~~ **shipped** (Cycle 2).
- Mobile body picker (solar list hidden `<560px`).

**Later**

- Optional NASA day/night textures when offline assets allowed.
- More missions: Shuttle final, Artemis I, Electron.
- LEO: Hubble + one Starlink shell as clean toggles.
- Embed mode (`?embed=1`) · screenshot export.

**Curiosity**

- True site azimuths baked into ascent heading.
- Optional audio whoosh / ignition toggle.

### Visual debt list

| Debt | Notes |
|------|--------|
| Launch camera | **Done (Cycle 1 lead):** eased pad→chase→orbit + staging/SECO dual-stage framing (`buildLaunchCamHint`); adaptive follow in `main.js`. |
| Pad atmosphere | **Done (Cycle 2):** siteStage ground fog discs + 4 additive flood beams; fades with `localUntil` / pad theater blend — does not hijack scene `FogExp2`. |
| Materials | Color/emissive spheres; no NASA PBR textures. Earth globe is “hyper-clear” but not photometric. |
| Bloom | UnrealBloomPass always on; strengths per mode (solar 0.55, earth 0.28, LEO 0.32, stars 0.72) — tasteful pass still needed. |
| Mobile | `.hud-left` (body list) `display:none` below 560px **with no replacement picker**. `.hud-right` (detail panel) hidden below 900px — **info vanishes on tablet/phone**. |
| Scale honesty | `auToScene` compresses outer system; LEO sizes “exaggerated for visibility” (leo.js). **Not disclosed in the HUD.** |
| Chrome | Poetic blurbs (crowns) are on-brand; fact density is thin for an instrument. |
| Perf | No logged mobile FPS / payload baseline yet — Cycle 1+ must measure. |

### Info debt list

| Debt | Notes |
|------|--------|
| Body HUD | Missing temp, live distance, orbital period in chosen units, discovery/flyby year. |
| Units | No AU/km/mi or °C/K toggle. |
| Disclaimer | No “schematic · not to scale” vs “to-scale radii in LEO” chip. |
| Lifecycle | Scrub note is prose-only; no glossary/tip on fork physics. |
| Sources | No on-screen source-of-truth (NASA / JPL Horizons / NSSDC). |

---

## Sprint backlog themes (prioritized)

Each theme is a **cycle-sized** slice, not a year-long epic. A cycle may take one theme as the **lead** and still touch the other two pillars with a small companion (e.g. camera polish + one staging caption + one scale chip).

| # | Theme | Lead pillar | Companion (min) |
|---|--------|-------------|-----------------|
| **1** | Launch theater camera + pad atmosphere | A visual | B: staging/SECO beat labels · C: altitude/velocity readout during ascent — **shipped** |
| **2** | Mobile body picker | A visual / UX | C: keep one-line body fact visible when list is a sheet |
| **3** | Info HUD v1 (distance, period, temp, discovery-year style facts per body) | C info | A: HUD chrome density, not bigger panels |
| **4** | Texture / lighting pass (solar + Earth) | A visual | C: texture credit + “not photometric” if maps are artistic |
| **5** | Mission pack expansion (STS-135, Artemis I, Electron) | B content | C: mission date, payload, destination facts · A: vehicle silhouette readable |
| **6** | LEO toggles (Hubble, Starlink shell) | B content | C: altitude / inclination / period chips · A: clean on/off, not clutter |
| **7** | Star lifecycle info overlays on scrub | C info | A: overlay typography on the photosphere, no HUD soup · B: fork fidelity if a stage is thin |
| **8** | Embed + screenshot export (`?embed=1`) | A / product | C: embed still shows scale disclaimer |
| **9** | Accuracy pass (scales disclaimer, true site azimuths) | C info | A: do not “fix” beauty by lying about heading |

**Curiosity (not a cycle lead until 1–9 pressure is clear):** audio whoosh / ignition toggle.

---

## Recommended first three cycles

Use these unless Avinash reorders.

### Cycle 1 — Launch theater (camera + pad)

- **A:** Ease camera cuts at staging / SECO; keep the stack in frame; ~~pad-local ground fog + floodlight beams~~ → **Cycle 2**.
- **B:** Named narrative beats on the existing missions (liftoff, staging, SECO, insertion) — no new vehicles yet. *(labels shipped in Cycle 1 lead)*
- **C:** Ascent HUD: altitude, velocity, phase name; one-line “schematic trajectory, not a guidance solution.” *(shipped 2026-09-21)*
- **Measure:** desktop + phone launch of STS-1 and Falcon RTLS; stack never leaves frame; FPS note.

### Cycle 2 — Pad atmosphere *(shipped 2026-09-21)*

- **A:** Pad-local ground fog + floodlight beams only while vehicle on/near pad; fade out after `localUntil`.
- **B / C:** deferred at ship time (ascent HUD → Cycle 1 C leftover; Forge parked).

### Cycle 3 — Mobile body picker

- **A:** Replacement picker below 560px (sheet / segmented control / search). Do not just un-hide the desktop list.
- **B:** Picker groups: planets · dwarf · comets (same catalog, denser chrome).
- **C:** Selected body keeps a one-line fact when the detail panel is hidden (`<900px`).
- **Measure:** iPhone-width pass; body list reachable; no overlap with Earth/Stars bars.

### Cycle 4 — Info HUD v1

- **A:** Ops-instrument typography; no new decoration. Detail panel usable at tablet width (don’t leave facts only on desktop).
- **B:** Fill missing facts for Sol + 8 planets + Pluto (temp, discovery/flyby as fits).
- **C:** Live distance (scene + true AU), period, temp; unit toggle AU/km; persistent **schematic vs to-scale** chip.
- **Measure:** every body shows ≥4 facts; disclaimer visible in Solar and LEO.

---

## Definition of Done (every cycle)

- [ ] Change **live** on https://avinashpeyyety.github.io/pixelloid/cosmos/
- [ ] `NEXT.md` updated (Now / Later / Done)
- [ ] Brief note in this file’s Changelog (date, cycle #, pillars touched, commit)
- [ ] Measure logged: mobile FPS (or “jank / ok”), load, Pages link check
- [ ] Does **not** bump Mahābhārata out of In flight

**This planning ticket (Sprint 0)**

- [x] This file exists at `pixelloid/cosmos/docs/SPRINT_PLAN.md` (and `ai-projects/cosmos/docs/` working copy)
- [x] `cosmos/NEXT.md` **Now** points here as the continuous plan of record
- [ ] No visual/feature implementation in the same commit

---

## Out of scope (until a cycle names it)

- New modes beyond S / E / L / T
- Audio (curiosity)
- Stealing MB In-flight capacity
- Treating `python3 -m http.server 8777` as the publish target
- NASA texture downloads that break offline-first without an explicit “offline assets allowed” decision

---

## Changelog

| Date | Cycle | What | Git |
|------|-------|------|-----|
| 2026-09-21 | **1 C** | **C** Ascent HUD: ALT/VEL readouts + phase (`phaseLabel`) during Earth launch; schematic chip (“schematic trajectory, not a guidance solution.”); hide after insertion / when not launching. Ops-dense chrome, mobile-aware. | d8263f1 |
| 2026-09-21 | **2** | **A** Pad-local ground fog (soft discs on siteStage) + 4 additive floodlight beams; intensity gated by `localUntil` / pad theater blend — no scene `FogExp2` hijack. Ascent HUD waits. | 21c4041 |
| 2026-09-21 | **1 lead** | **A** Launch camera polish: ease pad→chase through staging/SECO; dual-stage framing; adaptive `followLaunchCam`. **B** companion: HUD labels `Staging · MECO` / `SECO · Second stage`. Pad fog + ascent HUD left for next ships. | fdd3116 |
| 2026-09-16 | **0** | Plan of record created. Baseline inventory + 9-theme backlog. No product code. | *(this commit)* |
