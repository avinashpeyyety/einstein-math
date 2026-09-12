# Einstein Math

Public interactive math program for **ages 5–10** (US K–5), delivered by **Einstein** as an 80s comic-book teacher — big hair, mustache, sweater/lab coat, speech bubbles, bold ink outlines, warm primary colors.

## Features

- **Age tracks** (distinct curricula, **~28–30 playable lessons** each):
  - **Ages 5–6 (K–1)** — counting & teens, compose/decompose, doubles & make-10, length/weight/time/coins, story problems, AB patterns, tally/pictograph, 3D shapes
  - **Ages 7–8 (grades 2–3)** — place value, rounding & estimation, regrouping fluency, mult/div ideas (facts, quotative), fractions of a set, perimeter, elapsed time, bar graphs, multi-step & money WP
  - **Ages 9–10 (grades 4–5)** — multi-digit ops + long mult/div ideas, factors/primes, order of ops, fraction × whole & mixed add/sub (like denoms), decimal add/sub, area/volume, coordinate plane, multi-step WP
- **Mastery + spaced review** (device-local) — check ≥ ~80% → mastered & schedule review; fail &lt; 60% → needs_review + **Retry weak spots**
- **Today's path** — Mission Map + Home suggest the next 1–3 missions (due reviews → needs_review → diagnostic path → next ready); friendly empty-state when nothing is queued
- **Parent / Family summary** on the Progress screen — stars, done/mastered, reviews due, unit mastery, weak spots, recent activity; **Print / Save as PDF** + **Download JSON**
- **Multi-device handoff** — **Export all profiles** / **Import profiles** (merge by id or replace-all) until real sync exists
- **PWA / offline** — installable app shell; service worker caches curriculum + panels after first online visit
- **Einstein read-aloud** — optional Web Speech API narration of speech bubbles (toggle in header)
- **Local multi-user profiles** — named explorers on one device; progress nested per age track
- Landing: create profile (name + track) or pick an existing explorer
- Richer diagnostic (10 items) → suggested unit path (per track)
- Full playable lessons with Einstein UI (explain → worked example → practice → quick check)
- Progress checkpointed to `localStorage` after every save (survives refresh on the same device/origin)
- Extensible `data/curriculum.json` with `tracks` (meta.version **2.3.0**)

### Device-local only

No accounts, no passwords, no server sync API. Clearing site data erases progress. Profiles live under the key `einstein-math-v2`. Parent exports and multi-device handoff files are snapshots of that local data only — **you** copy the JSON between devices.

## Install / offline (PWA)

1. Serve over **http://** or **https://** (not `file://`) — see Run locally below.
2. Open the site once **online** so the service worker can cache:
   - `index.html`, `css/comic.css`, `js/*`, `data/curriculum.json`
   - `assets/panels/*` (Einstein), `assets/student/panels/*` (pupil idle/explain/cheer/think), `assets/student/portrait.jpg`
   - `assets/icons/*`, `manifest.webmanifest`
3. In **Chromium** (Chrome/Edge): address-bar install icon / menu → **Install Einstein Math**. Localhost is allowed for install.
4. After that first visit, reload offline — app shell + lessons should still load from cache.
5. Updates: bump the SW cache name (in `sw.js`) when shipping CSS/JS/panel changes so clients pick up a new precache.
6. **Hard-refresh after SW cache bumps** — a normal reload can keep a stale shell/panels while the old worker is still in control. After a `CACHE` bump (or if student/Einstein panels look wrong), do a hard refresh (**Cmd+Shift+R** / **Ctrl+Shift+R**) once online, or DevTools → Application → Clear storage, then reload so the new worker installs and the pupil likeness panels swap correctly.

Safari / iOS: Add to Home Screen works; offline cache behavior depends on the browser — speech and install UX vary.

## Student panels (likeness QA)

Pupil stages mirror Einstein moods via `js/student.js` → `assets/student/panels/{idle,explain,cheer,think}.png` (same four states). Crop uses `object-fit: cover` + `object-position: center top` so the face stays in the 3:4 frame like the teacher panels. After any panel or CSS ship, bump `sw.js` `CACHE` and **hard-refresh** (see Install / offline).

## Multi-device handoff (import / export)

On **Progress → Parent / Family → Multi-device handoff**:

1. **Export all profiles** — downloads full `einstein-math-v2` JSON (`einstein-math-profiles-YYYY-MM-DD.json`).
2. **Import profiles** — pick a file, then choose:
   - **Merge (default confirm OK):** match users by `id`; identity fields prefer newer `updatedAt`; each lesson prefers newer `lastAt` (tie-break: attempts, then mastery). Prefs stay local-first.
   - **Replace all (Cancel merge, then two strong confirms):** wipe this origin’s profiles and load the file.

UI copy states clearly this is **file handoff, not cloud sync**.

Round-trip mental model: Device A export → copy file → Device B import merge → both kids’ progress preserved when ids match; conflicts resolve to the newer lesson activity.

## Einstein read-aloud

- Header toggle: **Read aloud** on/off (stored in `einstein-math-v2` → `prefs.speechEnabled`).
- When on, changing a speech bubble auto-speaks via `speechSynthesis` (rate ~0.95).
- **Replay** re-speaks the last line.
- Missing API → graceful no-op; previous utterance is cancelled to avoid Safari overlap quirks.

## Mastery & spaced review (rules)

Per user → track → lesson blob:

| Field | Meaning |
|--------|---------|
| `mastery` | 0–1 from latest check accuracy |
| `masteryLevel` | `learning` / `practicing` / `mastered` / `needs_review` |
| `practiceCorrect/Total`, `checkCorrect/Total` | Attempt tallies |
| `attempts`, `streak` | Completions & successful review streak |
| `lastAt`, `nextReviewAt` | ISO timestamps |
| `reviewIntervalDays` | Current spacing step (1 → 3 → 7) |
| `missedCheckIds` | Missed item ids for remediation |

**Rules (tuned simply):**

1. Quick check **≥ ~80%** → `mastered`, schedule first review in **~1–2 days**.
2. Check **&lt; 60%** → `needs_review`; offer **Retry weak spots** (missed items) before a full redo; next review ~1 day.
3. Check **60–79%** → `practicing`; schedule a short follow-up (~1 day).
4. Successful **review**: bump interval **1d → 3d → 7d**. Failed review: reset toward **1d**.
5. Successful **remediation** retry nudges mastery upward (and can clear `needs_review` when strong enough).
6. Mission Map / Continue / Today's path / Progress prefer **due reviews**, then **needs_review**, then diagnostic recommendations, then next ready lesson.
7. Soft unlock after diagnostic still applies; weak prerequisites show a **Strengthen first** badge (not a hard lock).

Older lesson blobs without mastery fields are **normalized on load** with sensible defaults.

## Parent / Family export

On **Progress → Parent / Family** (active explorer):

1. Review name, age track, stars, lessons done/mastered, reviews due, unit mastery, weak spots (`needs_review`), and recent activity (`lastAt`).
2. **Print / Save as PDF** — opens the browser print dialog with print-friendly CSS (family section only). Choose “Save as PDF” in the print destination if available.
3. **Download JSON** — downloads `einstein-math-parent-<name>.json`, a plain snapshot from `Storage.getParentSummary(userId)` (no secrets; local progress fields only).

Helper: `Storage.getParentSummary(store, userId, curriculum)`.

## Storage schema (`einstein-math-v2`)

```json
{
  "version": 2,
  "appVersion": "2.3.0",
  "activeUserId": "u_…",
  "prefs": { "speechEnabled": false },
  "users": {
    "u_…": {
      "id": "u_…",
      "displayName": "Sam",
      "createdAt": "…",
      "updatedAt": "…",
      "trackId": "ages-7-8",
      "avatarColor": "#FF6B35",
      "tracks": {
        "ages-7-8": {
          "started": true,
          "diagnosticDone": true,
          "diagnosticScores": {},
          "recommendedUnits": [],
          "lessons": {
            "ns-place-value-basics": {
              "status": "done",
              "mastery": 1,
              "masteryLevel": "mastered",
              "practiceCorrect": 4,
              "practiceTotal": 4,
              "checkCorrect": 2,
              "checkTotal": 2,
              "attempts": 1,
              "streak": 1,
              "reviewIntervalDays": 1,
              "lastAt": "…",
              "nextReviewAt": "…",
              "missedCheckIds": []
            }
          },
          "currentLessonId": null,
          "stars": 0
        }
      }
    }
  }
}
```

On first load, legacy `einstein-math-progress-v1` (if present) migrates into a default user **Explorer** on the ages 7–8 track.

## Run locally (required: HTTP, not `file://`)

Browsers block `fetch()` of JSON under `file://`. Serve the folder:

```bash
cd einstein-math
python3 -m http.server 8899
```

Then open: <http://127.0.0.1:8899>

Localhost works for PWA install in Chromium.

## Smoke demo (2.3 trusted-home sprint)

1. Load once online → DevTools → Application → Service Worker registered; Cache Storage shows `einstein-math-v2.3.4` (or the current `CACHE` in `sw.js`).
2. Go offline (DevTools Network → Offline) → reload → landing / Mission Map still usable.
3. Create two explorers, earn progress → **Export all profiles** → clear site data → **Import** merge → both kids restored.
4. Toggle **Read aloud** → Einstein bubbles speak; **Replay** repeats the last line.
5. Seed a due review (`nextReviewAt` in the past) → Home/Map **Today's path** + **Continue** open that review first.
6. Fail a check (&lt;60%) → Retry Weak Spots → success nudges mastery / can clear needs_review.

## Sprint notes (2.3.0)

| Goal | Result |
|------|--------|
| PWA / offline | `manifest.webmanifest`, icons, `sw.js`, SW register on http(s) only |
| Multi-device handoff | Export all + import merge/replace on Progress |
| Read-aloud | Web Speech toggle + replay; prefs in v2 root |
| Adaptivity polish | Today's path + smarter Continue; remediation mastery nudge |
| Version | curriculum `meta.version` **2.3.0** |
| Non-goals | No accounts, no server, no GitHub Pages push, no real-time sync API |

Curriculum generators (optional): `scripts/expand_curriculum.py` + `scripts/lessons_*.py`.

## Roadmap progress

| Done (2.3) | Still missing |
|------------|----------------|
| ~28–30 real lessons / track; balanced strands | Real cloud sync / accounts |
| Parent / family overview + print + JSON export | Printable worksheets; standards tagging UI |
| Mastery + spaced review + remediation retry | Richer Imagine panels per new lesson |
| PWA install + offline shell | Push notifications / remote review reminders |
| Multi-device file handoff (export/import) | |
| Read-aloud (Web Speech) | |
| Today's path / smarter Continue | |
| Multi-user local profiles + age tracks | |

## GitHub Pages

1. Push this repo (or the `einstein-math` folder as the site root / `/docs`).
2. Settings → Pages → Deploy from branch → choose the branch and folder (`/` or `/docs`).
3. Site will be available at `https://<user>.github.io/<repo>/`.

No build step. No API keys. (This sprint does **not** push to GitHub.)

## Project layout

```
einstein-math/
  index.html
  manifest.webmanifest
  sw.js
  README.md
  css/comic.css
  js/storage.js
  js/einstein.js
  js/app.js
  data/curriculum.json
  assets/panels/*.png          # Einstein idle/explain/cheer/think
  assets/student/portrait.jpg
  assets/student/panels/*.png  # pupil likeness panels (same four states)
  assets/icons/icon-192.png
  assets/icons/icon-512.png
  assets/icons/icon.svg
  scripts/          # curriculum expansion helpers (optional)
```

## Adding lessons

Edit `data/curriculum.json` under the right track (`tracks["ages-5-6"]`, etc.):

1. Add a lesson object under that track’s `lessons` with `id`, `unitId`, `title`, `einsteinIntro`, `explain.panels`, `workedExample`, `practice[]`, `quickCheck[]`.
2. Append the lesson `id` to the matching unit’s `lessons` array.
3. Bump `meta.version` when shipping curriculum changes.

Question types: `mc` (multiple choice) and `fill` (typed answer). Prefer keeping existing lesson IDs so migrated progress still maps.

## Pedagogy notes

- Encouraging tone; wrong answers get gentle comic-panel corrections (hints + explanation), not shame.
- Keep comic voice across all age bands — older tracks go deeper, not drier.
- Mastery is formative: reviews and remediation keep practice light and local.
- Parent view stays calmer and factual while remaining comic-adjacent.
