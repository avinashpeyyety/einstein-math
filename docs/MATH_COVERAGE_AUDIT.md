# Math coverage audit — 2026-10-03 (v2.5.0)

**Method:** read `data/subjects/math.json` (the shipped pack) and `js/app.js` (diagnostic, item renderer), not the docs.
Compared each age track to Common Core K–8 domains (CC, OA, NBT, NF, MD, G, RP, NS, EE, F, SP) + mental math + word problems.
Tickets live in [`EXPANSION_PLAN.md` §5](EXPANSION_PLAN.md#5-ticket-queue-top-unchecked--next-cycle).

## Inventory (what the app actually has)

- **3 tracks**, 88 lessons, 517 fixed items (353 multiple-choice, 164 fill-in). Every lesson = explain panels → worked example → practice → quick check. Only two item types (`mc`, `fill`); no number line, drag/build, protractor, grid or plotting interaction. 1 warm-up diagnostic per track.
- **Ages 5–6 (K–1), 29 lessons / 7 units:** count to 20; teens 11–19; compare ≤20; count by 10s to 100; teens = 10 + ones; compare teens · add/sub within 10; friends of 10; add within 20; doubles; make-10; fact families; add with teens · longer/shorter; heavier/lighter; time to hour & half hour; coins; coin combos · add / take-away / compare / put-together stories · skip-count 2 & 5; AB patterns · 2D shapes; 3D shapes · tally & pictograph.
- **Ages 7–8 (G2–3), 30 lessons / 6 units:** ones/tens/hundreds; compare 2–3 digit; round to 10 & 100; estimate sums · add/sub within 100 (with regrouping), fluency · equal groups; arrays & sharing; ×2/5/10 facts; quotative division; equal-groups stories · halves & fourths; thirds & fraction of a set; unit fractions · inch/cm; time to 5 min; money & change; perimeter; elapsed time; bar graphs · 1-step, 2-step, equal-groups, multi-step, money word problems.
- **Ages 9–10 (G4–5), 30 lessons / 6 units:** multi-digit add/sub; multi-digit × and ÷ (incl. long ×/÷) · factors, multiples, primes/composites, factor pairs, order of operations · equivalent & compare fractions; add/sub like denominators; mixed numbers (intro, add, sub); fraction × whole · decimal place value, compare, add, sub; tenths; area of rectangles; volume of prisms; area/volume word problems · coordinate plane intro (1 lesson) · multi-step problem solving (1 lesson).
- **Not covered at all (planned):** ages 11–12 (RP, NS, EE, SP — X10) and 13–14 (EE, F, G8 — X15).

## Gaps inside the tracks the app already covers

### Ages 5–6 (K–1)
| Domain | Gap | Ticket |
|---|---|---|
| CC | Count to 120 by ones, count on from any number, number before/after; one-to-one "how many" for scattered sets | X38 |
| OA | Unknown addend (8 + ? = 11), true/false equations (meaning of =), add three numbers, turn-around (commutative) facts | X30 |
| NBT (G1) | 2-digit place value (tens & ones), compare with <, >, =; 10 more / 10 less; add 2-digit + 1-digit and multiples of 10 | **X23** |
| MD | Order 3 objects by length; measure with non-standard units (iterate a unit); sort data into 3 categories & ask questions | X38 |
| G | Halves & fourths of shapes (1.G.3); positional words; compose shapes; defining vs non-defining attributes | X31 |
| Mental math | Count on/back strategies; ±10 mentally | X35 |
| Word problems | Start-unknown and change-unknown stories; 3-addend stories | X36 |

### Ages 7–8 (G2–3)
| Domain | Gap | Ticket |
|---|---|---|
| OA (G3) | **Multiplication facts 3, 4, 6, 7, 8, 9** (only ×2/5/10 exist); division as unknown factor; commutative & distributive properties; patterns in the × table; × multiples of 10 | **X20** |
| MD (G3) | **Area** (unit squares, rows × columns, additive area, area vs perimeter) — missing entirely | **X21** |
| NF (G3) | Fractions on a number line; simple equivalent fractions; compare same numerator / same denominator; whole numbers as fractions | **X25** |
| NBT (G2) | Add/sub within 1000 (3-digit regrouping); skip-count by 5/10/100 to 1000; expanded form & number names; even/odd (2.OA) | X28 |
| MD | Mass & liquid volume (g, kg, L); time to the nearest minute; scaled picture/bar graphs; line plots (½, ¼ inch); feet/meters & estimating length | X34 |
| G | Quadrilaterals (rhombus, rectangle, square, trapezoid) and shape attributes (angles, faces); partition rectangles into rows/columns — **no geometry unit in this track** | X32 |
| Mental math | Compensation, near-doubles for 2-digit, adding 10/100 mentally | X35 |
| Word problems | Two-step problems with all four operations (3.OA.8) | X36 |

### Ages 9–10 (G4–5)
| Domain | Gap | Ticket |
|---|---|---|
| NF (G5) | **Add/sub fractions with unlike denominators** | **X22** |
| NF (G5) | Fraction × fraction, fractions as division (a/b = a ÷ b), divide unit fractions ↔ whole numbers, area with fractional sides | X29 |
| G (G4–5) | Lines, rays, angles; measure/draw angles; parallel & perpendicular; classify triangles & quadrilaterals (hierarchy); lines of symmetry — Geometry Quest has only the coordinate plane | X24 |
| NBT (G5) | Multiply & divide decimals; powers of 10 / exponents patterns; decimals to thousandths; rounding decimals | X26 |
| MD (G4–5) | Unit conversions (km/m/cm, kg/g, lb/oz, hr/min); line plots with fractions — **no data/statistics lesson in this track** | X27 |
| NBT (G4) | Place value to 1,000,000; rounding multi-digit numbers | X33 |
| OA / G (G4–5) | Multiplicative comparison ("3 times as many"); numerical patterns with two rules → ordered pairs; quadrant-1 graphing for real problems; expressions with parentheses/brackets | X36, X37 |
| Mental math | ×10/×100 shortcuts, estimation of products/quotients | X35 |

### Cross-cutting
- Only `mc` / `fill` item types → fractions on a number line, area grids, angles and graphing need new visual/item types; X25 and X24 include the needed `renderVisual` keys (number line, unit-square grid, protractor).
- Fixed item banks (~6 items per lesson) → X9 generators should cover the new skills too.
