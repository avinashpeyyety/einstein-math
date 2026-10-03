# Cosmos → Space Lab parity checklist (verified 2026-10-03, live Pages v2.5.0)

Old: github.com/avinashpeyyety/cosmos @ 6a2080c (shipped at https://avinashpeyyety.github.io/pixelloid/cosmos/).
New: https://avinashpeyyety.github.io/einstein-math/cosmos/ (hub: https://avinashpeyyety.github.io/einstein-math/#space).
Method: headless Chrome (SwiftShader WebGL) scripted against the old repo served locally and the live Pages build; same script, same checks. Live run: 0 console/page errors.

| # | Section / feature | Old | Live (new) |
|---|---|---|---|
| 1 | Loads, loader clears, 3D scene renders | ✅ | ✅ (Three.js now vendored, no CDN) |
| 2 | Solar: Sun + 8 planets + Pluto + 5 comets in body list (15) | ✅ | ✅ 15 |
| 3 | Click body → camera fly-to + detail panel | ✅ | ✅ (Earth, Jupiter via `?focus=`) |
| 4 | Keys 1–9 / P (Pluto) / C (Halley) / R reset / Space / F | ✅ | ✅ |
| 5 | Time presets 0×–100k×, speed slider, play/pause, epoch + Δt readouts | ✅ | ✅ |
| 6 | Layer toggles: orbits, labels, star field, belt, comets, moons, follow | ✅ | ✅ |
| 7 | Mode switch buttons + keys S / E / L / T | ✅ | ✅ |
| 8 | Stars: scrubber, stage name/note, Sun-like vs Massive fork, NS/BH end state | ✅ | ✅ (Red giant @600; Neutron star @950 high-mass) |
| 9 | LEO view: Earth + ISS 51.6° caption + detail panel | ✅ | ✅ |
| 10 | Earth: 6 launch-site chips + markers, site zoom, site captions | ✅ | ✅ |
| 11 | Launches with ascent HUD (ALT/VEL/phase, schematic chip): Mercury-Redstone 3, Apollo 11, STS-1, Falcon 9 Starlink, Falcon 9 polar, Vostok 1, Ariane 5, Shenzhou | ✅ | ✅ all 8 climb Liftoff → Max-Q → MECO |
| 12 | Pad fog + floodlights, launch camera easing | ✅ | ✅ (unchanged code) |
| 13 | Falcon 9 first RTLS (booster landing) | ⚠ booster lerps to an off-pad point | 🚧 **stub**: "coming soon" chip + caption note (C1) |
| 14 | Starship tower catch | ⚠ tower hidden before the catch | 🚧 **stub**: "coming soon" chip + caption note (C2) |
| 15 | F9 booster "return" after staging on Starlink/polar | ⚠ same fake landing | booster drops out of shot (part of C1 stub) |
| 16 | LEO mission catalog (`leo.js`: Hubble, Starlink trains, ASDS, Starship loop) | ❌ never imported | 🚧 **stub** card (C3); file kept un-loaded |
| 17 | Mobile <560px body list hidden (known gap) | ⚠ | ⚠ unchanged (C4) |
| 18 | Offline after first visit | ❌ CDN | ✅ SW caches cosmos + three on first use (verified offline reload) |
| 19 | New: back link `← Einstein Math`, deep links `?mode=`/`&site=`/`&focus=` | — | ✅ |
