# Einstein Math — History module plan (later build)

**Status:** planned, not started. **Placement:** after **X18** in the [expansion queue](EXPANSION_PLAN.md#5-ticket-queue-top-unchecked--next-cycle) — math and physics keep their pace first; history follows.
**Rough start:** H0 lands at the earliest **Wed 2026-11-11 (3:37 PM CT cycle)** if every ticket ships on schedule (46 cycles from Mon 2026-10-05 at 8 ticket-cycles/week, Mon–Thu, Fridays = polish). With typical slippage (~1 lost cycle/week, M tickets running long), plan for **mid–late November 2026 (≈ Nov 16–25)**.
**Subject id:** `history` (third subject in `Subjects.CATALOG`, own lazy pack `data/subjects/history.json`, progress `history:<track>` — X1–X3 machinery, no new storage work).

## 1. Three strands, age-banded

| Band | World / global | American | Indian |
|---|---|---|---|
| **5–6** (stories & me) | Then vs now (homes, toys, transport); famous inventions (wheel, writing, printing); world festivals & maps (continents, oceans) | Symbols & holidays (flag, Thanksgiving, July 4th, MLK Day) as stories; Native peoples' homes & foods | Festivals & stories (Diwali, Holi, Pongal, Eid, Christmas in India); Indian flag & national symbols; Gandhi as a person |
| **7–8** (people & places) | Early humans → farming; River civilizations (Egypt, Mesopotamia, Indus, China); Greece & Rome basics; great explorers | First Americans; colonies & the Revolution (story level); Lincoln & ending slavery; inventors (Edison, Wright brothers) | Indus Valley (Harappa, Mohenjo-daro); Vedic life & epics as literature; Ashoka; Mughal builders (Taj Mahal); freedom fighters as people |
| **9–10** (timelines & causes) | Classical empires (Persia, Maurya, Han, Rome); Silk Road & trade; Middle Ages worldwide (Islamic golden age, Mali, Song China, Europe); Renaissance & printing; Age of Exploration (incl. its impact on Indigenous peoples) | Constitution & Bill of Rights; westward expansion & its cost to Native nations; Civil War & Reconstruction; immigration & industry | Maurya & Gupta (zero, decimals, Aryabhata); Chola maritime trade; Delhi Sultanate & Mughals; East India Company → 1857; national movement (Gandhi, Nehru, Bose, Ambedkar, Sarojini Naidu) |
| **11–14** (sources & perspectives) | Revolutions (scientific, industrial, French); world wars; decolonization; Cold War & space race; UN & human rights | Civil rights movement; Great Depression & New Deal; WWII home front; space race & modern America | Partition & Independence (1947); Constitution (Ambedkar) & Republic (1950); Green Revolution; ISRO & modern India |

Content stays at story/timeline level for 5–8; causes, multiple perspectives and primary sources from 9 up. Hard topics (slavery, Partition, wars, colonization) are introduced from 9–10 with care notes for parents, no graphic detail.

## 2. Unit outlines (v1 — ~6 units per strand across bands)

- **World:** W1 Then & Now · W2 River Civilizations · W3 Greece, Rome & Classical Empires · W4 Trade Routes & the Medieval World · W5 Renaissance, Printing & Exploration · W6 Revolutions & the Modern World (11–14)
- **American:** A1 Symbols & Holidays · A2 First Americans · A3 Colonies & Revolution · A4 Constitution & a Growing Nation · A5 Civil War & Reconstruction · A6 Civil Rights & Modern America (11–14)
- **Indian:** I1 Festivals & Symbols · I2 Indus Valley · I3 Ashoka, Maurya & Gupta (science & math links: zero, decimals) · I4 Cholas, Sultanate & Mughals · I5 The Freedom Struggle · I6 Independence, Partition & the Republic (11–14)

Each unit: 3–5 lessons (explain panels with Einstein as narrator → timeline/map interaction → primary-source card → quick check), mastery + spaced review reused.

## 3. Interaction types (new lesson/item types)

| Type | What the kid does | Engine note |
|---|---|---|
| `timeline` | Drag events onto a scrollable timeline; zoom eras; "what came first?" ordering checks | new item type `order`; BCE/CE handled; reuse Cosmos-style scrubber idea |
| `map` | Tap regions/cities on simple SVG maps; trace trade routes; "where did this happen?" | vendored SVG base maps (public domain, e.g. Natural Earth); no tile servers |
| `source-card` | Read a short primary-source excerpt or artifact image with a caption + "who / when / why" prompts | each card carries citation + license |
| `quiz` | Existing `mc` / `fill` + new `order` and `match` (person ↔ achievement) | grading reuses the math engine |
| `compare` (9+) | Two perspectives side by side, "what does each source say?" | text-only, cited |

## 4. Sourcing & accuracy policy

1. **Cited:** every fact, date and quote has a source in the pack (`sources: [{title, publisher, url, accessed}]`). Preferred: Library of Congress, National Archives, Smithsonian, NCERT textbooks, Archaeological Survey of India, UNESCO, Britannica, museum collections.
2. **Neutral:** describe events and the people affected; present major perspectives fairly where they differ (e.g. colonization, Partition); no political or religious advocacy; epics and religious texts presented as literature/belief ("the Ramayana tells…"), not as dated history.
3. **Age-appropriate:** no graphic violence; difficult topics only from 9–10, with a parent note on the unit card; vocabulary checked per band.
4. **Dates:** BCE/CE; "about/c." for uncertain dates; debated claims flagged as debated, not stated as fact.
5. **Images:** public domain or CC-licensed only, credited on the card; no AI-generated "historical photos" (comic Einstein panels are fine and obviously illustrations).
6. **Review gate:** each unit gets a fact-check pass (every claim ↔ source) before it ships; corrections log in this file.
7. **Tooling:** drafting with SuperGrok subscription or local tools only — never paid xAI API credits.

## 5. Ticket plan (queued after X18)

- **H0 (M)** History platform: `history` subject + pack stub, item types `order` / `match`, timeline + SVG-map + source-card renderers, `sources` schema & validator test
- **H1 (S)** World W1 "Then & Now" (ages 5–6, 3 lessons)
- **H2 (S)** Indian I1 "Festivals & Symbols" (ages 5–6, 3 lessons)
- **H3 (S)** American A1 "Symbols & Holidays" (ages 5–6, 3 lessons)
- **H4 (M)** World W2 River Civilizations (ages 7–8, incl. Indus cross-link) — 4 lessons + map
- **H5 (M)** Indian I2 Indus Valley + I3 Ashoka (ages 7–8)
- **H6 (M)** American A2 First Americans + A3 Colonies & Revolution (ages 7–8)
- then rotate W → I → A per band upward (9–10, then 11–14), interleaved 1:1 with math/physics tickets so neither stalls.
