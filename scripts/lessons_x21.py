#!/usr/bin/env python3
"""X21 — Math ages 7–8: Area (Common Core 3.MD.5–8), 3 lessons in a new unit unit-area:
  1. Area with Unit Squares — count/tile unit squares                         — 3.MD.5–6
  2. Rows × Columns         — area = rows × columns, relate to multiplication — 3.MD.7a–b
  3. Area vs Perimeter      — additive area (L-shapes) + area vs perimeter    — 3.MD.7c–d, 3.MD.8
Prereqs chain: lesson 1 needs md-arrays-div (arrays = rows & columns);
  2 needs 1; 3 needs 2. Unit sits right after unit-mult-div on the Mission Map.
Idempotent: re-running is a no-op.
Run: python3 scripts/lessons_x21.py  (from repo root)"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lesson_helpers import mc, fill, lesson, panels, example  # noqa: E402

PACK = ROOT / "data" / "subjects" / "math.json"
TRACK = "ages-7-8"
UNIT = {
    "id": "unit-area",
    "title": "Area Adventures",
    "icon": "▦",
    "color": "#7C5CFF",
    "description": "Cover shapes with unit squares — count them, multiply rows × columns, and tell area from perimeter!",
    "lessons": [],
}
AFTER_UNIT = "unit-mult-div"


def build():
    L = []
    L.append(lesson(
        "ar-unit-squares", UNIT["id"], "Area with Unit Squares",
        "Area is how much SPACE a flat shape covers. We tile it with little unit squares — no gaps, no overlaps — and count them!",
        panels(
            ("Each little square is 1 square unit. This 3-by-4 rectangle holds 12 unit squares — so the area is 12!",
             "area-grid-3x4", "explain"),
            ("Tile the floor! Count every square once. Gaps or overlaps? Start over — fair tiling only!",
             "area-grid-tile", "cheer"),
        ),
        example("Worked Example", "A rectangle is tiled with 2 rows of 3 unit squares. What is its area?", [
            "Count the unit squares: row 1 has 3, row 2 has 3",
            "3 + 3 = 6 unit squares",
            "Area = 6 square units"]),
        [mc("x21a-p1", "Area means…",
            ["how much space a shape covers", "how far around a shape", "how tall a shape is", "how heavy a shape is"],
            "how much space a shape covers",
            "Think: covering the inside like a floor.",
            "Yes — area covers the inside!",
            "Area is the space inside, not the fence around."),
         fill("x21a-p2", "A 2×3 grid of unit squares has area ?", "6", ["6"],
              "Count every square: 2 rows of 3.", "6 square units!", "2 × 3 = 6 unit squares."),
         mc("x21a-p3", "How many unit squares are in a 4×5 rectangle?",
            ["9", "20", "45", "15"], "20",
            "4 rows of 5 squares each.", "20!", "4 × 5 = 20 unit squares."),
         mc("x21a-p4", "Which tiling shows area correctly?",
            ["unit squares with no gaps and no overlaps", "squares with big gaps", "squares stacked on top of each other", "only the outline drawn"],
            "unit squares with no gaps and no overlaps",
            "Fair tiling: cover every bit once.",
            "Perfect tiling!",
            "Gaps skip space; overlaps double-count."),
         fill("x21a-p5", "A 3×3 square of unit squares has area ?", "9", ["9"],
              "3 rows of 3.", "9!", "3 × 3 = 9 square units.")],
        [mc("x21a-q1", "Area of a 1×6 strip of unit squares?",
            ["6", "7", "16", "1"], "6"),
         fill("x21a-q2", "A 5×2 grid of unit squares has area ?", "10", ["10"]),
         mc("x21a-q3", "One unit square has area…",
            ["1 square unit", "1 unit around", "0", "2 square units"], "1 square unit")],
        prereqs=["md-arrays-div"], skills=["area-unit-squares"]))

    L.append(lesson(
        "ar-rows-columns", UNIT["id"], "Rows × Columns",
        "Counting one-by-one is slow. Multiply rows × columns — that's the same as the area of a rectangle!",
        panels(
            ("Label it! 3 rows and 4 columns → area = 3 × 4 = 12 square units. Same as an array!",
             "area-grid-rows-cols", "explain"),
            ("Rows × columns IS multiplication. A 2-by-5 rectangle has area 2 × 5 = 10 — just like 2 groups of 5!",
             "area-grid-mult", "cheer"),
        ),
        example("Worked Example", "A garden is 4 rows by 6 columns of unit squares. Area?", [
            "Area = rows × columns",
            "4 × 6 = 24",
            "Area = 24 square units"]),
        [mc("x21b-p1", "Area of a rectangle with 3 rows and 5 columns?",
            ["8", "15", "35", "2"], "15",
            "Multiply rows × columns.", "15!", "3 × 5 = 15."),
         fill("x21b-p2", "2 rows × 8 columns = area ?", "16", ["16"],
              "2 × 8.", "16!", "2 × 8 = 16 square units."),
         mc("x21b-p3", "Which equation finds the area of a 4-by-7 rectangle?",
            ["4 × 7", "4 + 7", "4 + 7 + 4 + 7", "47"], "4 × 7",
            "Area uses multiplication of sides (in unit squares).",
            "Yes — 4 × 7!",
            "Adding all four sides is perimeter, not area."),
         fill("x21b-p4", "5 × 6 rectangle area ?", "30", ["30"],
              "Rows × columns.", "30!", "5 × 6 = 30."),
         mc("x21b-p5", "A 3×4 array of stars has the same area idea as…",
            ["a 3-by-4 rectangle of unit squares", "a perimeter of 3+4", "3 + 4 stars", "only 3 stars"],
            "a 3-by-4 rectangle of unit squares",
            "Arrays and area grids are both rows × columns.",
            "Same idea — 12!",
            "Arrays and area both use rows × columns.")],
        [fill("x21b-q1", "3 rows × 7 columns = area ?", "21", ["21"]),
         mc("x21b-q2", "Area of a 6-by-4 rectangle?",
            ["10", "24", "20", "64"], "24"),
         fill("x21b-q3", "1 × 9 rectangle area ?", "9", ["9"])],
        prereqs=["ar-unit-squares"], skills=["area-rows-columns"]))

    L.append(lesson(
        "ar-area-vs-perimeter", UNIT["id"], "Area vs Perimeter",
        "Area is INSIDE (covering). Perimeter is AROUND (the fence). Weird L-shapes? Split into rectangles and ADD the areas!",
        panels(
            ("L-shape trick: split into two rectangles. 3×2 = 6 and 2×2 = 4. Add: area = 10 square units!",
             "area-l-shape", "explain"),
            ("Same rectangle: area = 3 × 5 = 15 inside. Perimeter = 3+5+3+5 = 16 around. Inside ≠ around!",
             "area-vs-perim-grid", "think"),
        ),
        example("Worked Example", "An L-shape is a 3×4 rectangle plus a 2×2 square stuck on. Total area?", [
            "First rectangle: 3 × 4 = 12",
            "Second rectangle: 2 × 2 = 4",
            "Add: 12 + 4 = 16 square units"]),
        [mc("x21c-p1", "Area is ___ ; perimeter is ___.",
            ["inside ; around", "around ; inside", "taller ; wider", "heavier ; lighter"],
            "inside ; around",
            "Floor vs fence.",
            "Inside = area, around = perimeter!",
            "Don't swap them — area covers, perimeter fences."),
         fill("x21c-p2", "L-shape: 2×4 rectangle + 3×2 rectangle. Total area ?", "14", ["14"],
              "Add the two areas: 8 + 6.", "14!", "2×4=8, 3×2=6, 8+6=14."),
         mc("x21c-p3", "Rectangle 3 by 5. Which is the AREA?",
            ["15", "16", "8", "30"], "15",
            "Area = 3 × 5. Perimeter = 3+5+3+5.",
            "15 — that's inside!",
            "16 would be the perimeter (3+5+3+5)."),
         mc("x21c-p4", "Rectangle 3 by 5. Which is the PERIMETER?",
            ["16", "15", "8", "35"], "16",
            "Add the four sides: 3+5+3+5.",
            "16 around!",
            "15 is the area (3×5), not the fence."),
         fill("x21c-p5", "L-shape split: 4×3 + 2×2. Total area ?", "16", ["16"],
              "12 + 4.", "16!", "4×3=12, 2×2=4, total 16.")],
        [mc("x21c-q1", "To find an L-shape's area, you can…",
            ["split into rectangles and add", "only measure the longest side", "count the perimeter twice", "subtract the perimeter"],
            "split into rectangles and add"),
         fill("x21c-q2", "Rectangle 2×6: area ?", "12", ["12"]),
         mc("x21c-q3", "Rectangle 2×6: perimeter?",
            ["16", "12", "8", "26"], "16")],
        prereqs=["ar-rows-columns"], skills=["area-additive", "area-vs-perimeter"]))
    return L


def main():
    data = json.loads(PACK.read_text())
    track = data["tracks"][TRACK]
    unit = next((u for u in track["units"] if u["id"] == UNIT["id"]), None)
    if unit is None:
        unit = dict(UNIT, lessons=[])
        pos = next(i for i, u in enumerate(track["units"]) if u["id"] == AFTER_UNIT) + 1
        track["units"].insert(pos, unit)
    added = 0
    for L in build():
        lid = L["id"]
        if lid not in track["lessons"]:
            track["lessons"][lid] = L
            added += 1
        if lid not in unit["lessons"]:
            unit["lessons"].append(lid)
    for lid, L in track["lessons"].items():
        for p in L["prerequisites"]:
            assert p in track["lessons"], (lid, p)
    PACK.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    print(f"added {added}; {TRACK} now {len(track['lessons'])} lessons; units: {[u['id'] for u in track['units']]}")
    print(f"{UNIT['id']}: {unit['lessons']}")


if __name__ == "__main__":
    main()
