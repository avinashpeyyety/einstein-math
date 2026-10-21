#!/usr/bin/env python3
"""X24 cycle 2/2 — Math ages 9–10 geometry: 2 lessons appended to u4-geometry (Geometry Quest),
right after g4-parallel-perp (X24 cycle 1):
  4. Classify Triangles & Quadrilaterals — by sides (equilateral / isosceles / scalene), by angles
     (acute / right / obtuse), quadrilateral family (square ⊂ rectangle ⊂ parallelogram, rhombus) — 4.G.2, 5.G.3–4
  5. Line Symmetry — fold lines, count lines of symmetry, symmetric letters — 4.G.3
Prereqs chain: lesson 4 needs g4-parallel-perp; 5 needs 4.
Idempotent: re-running is a no-op.
Run: python3 scripts/lessons_x24b.py  (from repo root)"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lesson_helpers import mc, fill, lesson, panels, example  # noqa: E402

PACK = ROOT / "data" / "subjects" / "math.json"
TRACK = "ages-9-10"
UNIT_ID = "u4-geometry"
AFTER_LESSON = "g4-parallel-perp"


def sides_q(qid, a, b, c, choices, **fb):
    kind = "equilateral" if a == b == c else "isosceles" if len({a, b, c}) == 2 else "scalene"
    return mc(qid, f"A triangle has sides {a} cm, {b} cm and {c} cm. What kind of triangle is it (by its sides)?",
              choices, kind, fb.get("hint", ""), fb.get("ok", ""), fb.get("bad", ""))


def angles_q(qid, a, b, c, **fb):
    m = max(a, b, c)
    kind = "right" if m == 90 else "obtuse" if m > 90 else "acute"
    return mc(qid, f"A triangle has angles {a}°, {b}° and {c}°. What kind of triangle is it (by its angles)?",
              ["acute", "right", "obtuse"], kind, fb.get("hint", ""), fb.get("ok", ""), fb.get("bad", ""))


def build():
    L = []
    L.append(lesson(
        "g4-classify-shapes", UNIT_ID, "Classify Triangles & Quadrilaterals",
        "Shapes have families! Let's sort triangles by their sides and angles — and find out why every square is secretly a rectangle!",
        panels(
            ("By sides: equilateral = all 3 sides equal, isosceles = 2 sides equal, scalene = no sides equal. By angles: a right triangle has one 90° corner, obtuse has one wide angle, acute has all sharp angles!",
             "geo-triangle-types", "explain"),
            ("Quadrilaterals have 4 sides. A parallelogram has 2 pairs of parallel sides. A rectangle is a parallelogram with 4 right angles. A rhombus has 4 equal sides. A square is BOTH — so a square is a rectangle AND a rhombus!",
             "geo-quad-family", "think"),
        ),
        example("Worked Example", "A shape has 4 equal sides and 4 right angles. Name every family it belongs to.", [
            "4 sides → it is a quadrilateral; 2 pairs of parallel sides → a parallelogram",
            "4 right angles → a rectangle; 4 equal sides → a rhombus",
            "Both at once → it is a square (and still a rectangle, rhombus and parallelogram)"]),
        [sides_q("x24d-p1", 5, 5, 5, ["equilateral", "scalene", "right"],
                 hint="Are all three sides the same length?", ok="Equilateral — all sides equal!",
                 bad="5, 5 and 5 are all equal, so it is equilateral."),
         sides_q("x24d-p2", 6, 6, 4, ["isosceles", "equilateral", "scalene"],
                 hint="How many sides match?", ok="Isosceles — two equal sides!",
                 bad="Two sides are 6 cm and one is 4 cm: exactly two equal sides means isosceles."),
         angles_q("x24d-p3", 90, 50, 40, hint="Is one of the angles a square corner?", ok="Right triangle!",
                  bad="One angle is exactly 90°, so it is a right triangle."),
         mc("x24d-p4", "A square has 4 equal sides and 4 right angles. Is a square also a rectangle?",
            ["yes — it has 4 right angles", "no — a rectangle needs 2 long sides", "only if it is big"],
            "yes — it has 4 right angles",
            "What does a shape need to be a rectangle?", "Yes! Every square is a rectangle.",
            "A rectangle just needs 4 right angles. A square has them, so a square is a special rectangle."),
         mc("x24d-p5", "A quadrilateral has 4 equal sides but no right angles. What is it?",
            ["rhombus", "square", "rectangle", "pentagon"], "rhombus",
            "A square needs right angles too.", "A rhombus!",
            "4 equal sides without right angles is a rhombus. A square would need right angles.")],
        [sides_q("x24d-q1", 7, 7, 3, ["isosceles", "equilateral", "scalene"]),
         angles_q("x24d-q2", 100, 45, 35),
         mc("x24d-q3", "Every rectangle is also a…", ["parallelogram", "square", "rhombus", "triangle"], "parallelogram")],
        prereqs=[AFTER_LESSON], skills=["classify-triangles", "classify-quadrilaterals"], duration=10))

    L.append(lesson(
        "g4-symmetry", UNIT_ID, "Line Symmetry",
        "Fold it in half — do the two sides match perfectly? Then you've found a line of symmetry! Mirror magic time!",
        panels(
            ("A line of symmetry folds a shape into two halves that match exactly. A square has 4, a rectangle has 2, an equilateral triangle has 3!",
             "geo-symmetry-shapes", "explain"),
            ("Letters can be symmetric too! A has a line straight down the middle, H has two, B folds top to bottom — but F has none.",
             "geo-symmetry-letters", "cheer"),
        ),
        example("Worked Example", "How many lines of symmetry does a rectangle (not a square) have?", [
            "Fold top to bottom: the halves match → 1 line",
            "Fold left to right: the halves match → 2 lines",
            "Fold corner to corner: the halves do NOT match, so a rectangle has 2 lines"]),
        [mc("x24e-p1", "A line of symmetry folds a shape so the two halves…",
            ["match exactly", "are different sizes", "make a triangle"], "match exactly",
            "Think of folding paper in half.", "Match exactly!",
            "On a line of symmetry, the two halves are mirror images that match exactly."),
         fill("x24e-p2", "How many lines of symmetry does a square have?", "4", ["4", "four"],
              "Try up-down, left-right and both diagonals.", "4 lines!",
              "A square folds evenly up-down, left-right and along both diagonals: 4 lines."),
         fill("x24e-p3", "How many lines of symmetry does an equilateral triangle have?", "3", ["3", "three"],
              "Fold from each corner to the middle of the opposite side.", "3 lines!",
              "Each corner gives one fold line to the middle of the opposite side: 3 lines."),
         mc("x24e-p4", "Which capital letter has a line of symmetry?", ["A", "F", "G", "J"], "A",
            "Imagine a mirror down the middle.", "A — straight down the middle!",
            "A folds evenly down the middle. F, G and J don't match on either side."),
         fill("x24e-p5", "How many lines of symmetry does a rectangle (not a square) have?", "2", ["2", "two"],
              "Diagonal folds don't match on a rectangle.", "2 lines!",
              "Up-down and left-right work; the diagonals don't. So 2 lines.")],
        [mc("x24e-q1", "Which capital letter has NO line of symmetry?", ["R", "M", "T", "E"], "R"),
         fill("x24e-q2", "How many lines of symmetry does an isosceles triangle (not equilateral) have?", "1", ["1", "one"]),
         mc("x24e-q3", "How many lines of symmetry does a scalene triangle have?", ["0", "1", "3"], "0")],
        prereqs=["g4-classify-shapes"], skills=["line-symmetry"], duration=8))
    return L


def main():
    data = json.loads(PACK.read_text())
    track = data["tracks"][TRACK]
    unit = next(u for u in track["units"] if u["id"] == UNIT_ID)
    added = 0
    pos = unit["lessons"].index(AFTER_LESSON) + 1
    for L in build():
        lid = L["id"]
        if lid not in track["lessons"]:
            track["lessons"][lid] = L
            added += 1
        if lid not in unit["lessons"]:
            unit["lessons"].insert(pos, lid)
        pos = unit["lessons"].index(lid) + 1
    for lid, L in track["lessons"].items():
        for p in L["prerequisites"]:
            assert p in track["lessons"], (lid, p)
    PACK.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    print(f"added {added}; {TRACK} now {len(track['lessons'])} lessons")
    print(f"{UNIT_ID}: {unit['lessons']}")


if __name__ == "__main__":
    main()
