# Einstein Math

Public interactive math program for ~8-year-olds (US grades 2–3, also remediating grade 1 gaps). Delivered by **Einstein** as an 80s comic-book teacher — big hair, mustache, sweater/lab coat, speech bubbles, bold ink outlines, warm primary colors.

## Features (MVP)

- Landing page with **Start** / **Continue**
- Diagnostic warm-up → suggested unit path
- Full playable lessons with Einstein UI (explain → worked example → practice → quick check)
- Progress tracker (stars, lesson status) saved in `localStorage`
- Extensible `data/curriculum.json`

### Playable lesson IDs

| ID | Unit | Title |
|----|------|-------|
| `ns-place-value-basics` | Number Sense | Ones, Tens & Hundreds |
| `ns-compare-numbers` | Number Sense | Compare Numbers |
| `as-add-within-100` | Add & Subtract | Adding Within 100 |
| `as-sub-within-100` | Add & Subtract | Subtract Within 100 |
| `md-equal-groups` | Multiply & Divide | Equal Groups |
| `fr-halves-fourths` | Fractions | Halves & Fourths |

## Run locally (required: HTTP, not `file://`)

Browsers block `fetch()` of JSON under `file://`. Serve the folder:

```bash
cd einstein-math
python3 -m http.server 8080
```

Then open: <http://localhost:8080>

## GitHub Pages

1. Push this repo (or the `einstein-math` folder as the site root / `/docs`).
2. Settings → Pages → Deploy from branch → choose the branch and folder (`/` or `/docs`).
3. Site will be available at `https://<user>.github.io/<repo>/`.

No build step. No API keys.

## Project layout

```
einstein-math/
  index.html
  README.md
  css/comic.css
  js/storage.js
  js/einstein.js
  js/app.js
  data/curriculum.json
  assets/einstein.svg
```

## Adding lessons

Edit `data/curriculum.json`:

1. Add a lesson object under `lessons` with `id`, `unitId`, `title`, `einsteinIntro`, `explain.panels`, `workedExample`, `practice[]`, `quickCheck[]`.
2. Append the lesson `id` to the matching unit’s `lessons` array.

Question types: `mc` (multiple choice) and `fill` (typed answer).

## Pedagogy notes

- Encouraging tone; wrong answers get gentle comic-panel corrections (hints + explanation), not shame.
- Units cover: number sense & place value, add/sub fluency, intro mult/div, early fractions, measurement (stub), word problems (stub).
