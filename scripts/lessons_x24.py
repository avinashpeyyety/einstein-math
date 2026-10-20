#!/usr/bin/env python3
"""X24 cycle 1/2 — Math ages 9–10 geometry: 3 lessons appended to the existing unit u4-geometry
(Geometry Quest), right after g4-coord-plane:
  1. Points, Lines, Rays & Angles — line / ray / segment; acute, right, obtuse — 4.G.1–2 (4.MD.5a)
  2. Measure Angles               — degrees, protractor reading, angle parts add up — 4.MD.5–7
  3. Parallel & Perpendicular     — never meet vs. cross at 90° — 4.G.1–2
Cycle 2 (not here): classify triangles & quadrilaterals (5.G.3–4 hierarchy) + line symmetry (4.G.3).
Prereqs chain: lesson 1 needs g4-coord-plane; 2 needs 1; 3 needs 2.
Idempotent: re-running is a no-op.
Run: python3 scripts/lessons_x24.py  (from repo root)"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lesson_helpers import mc, fill, lesson, panels, example  # noqa: E402

PACK = ROOT / "data" / "subjects" / "math.json"
TRACK = "ages-9-10"
UNIT_ID = "u4-geometry"
AFTER_LESSON = "g4-coord-plane"
KINDS = ["acute", "right", "obtuse", "straight"]


def kind_q(qid, deg, **fb):
    return mc(qid, f"An angle measures {deg}°. What kind of angle is it?", KINDS,
              "acute" if deg < 90 else "right" if deg == 90 else "obtuse" if deg < 180 else "straight",
              fb.get("hint", ""), fb.get("ok", ""), fb.get("bad", ""))


def proto_q(qid, deg, choices=None, **fb):
    prompt = f"On a protractor, one ray of an angle sits on 0°. The other ray points to {deg}°. How many degrees is the angle?"
    if choices:
        return mc(qid, prompt, choices, str(deg), fb.get("hint", ""), fb.get("ok", ""), fb.get("bad", ""))
    return fill(qid, prompt, str(deg), [str(deg), f"{deg}°"], fb.get("hint", ""), fb.get("ok", ""), fb.get("bad", ""))


def add_q(qid, a, b, **fb):
    s = a + b
    return fill(qid, f"An angle is split into two parts: {a}° and {b}°. How big is the whole angle?",
                str(s), [str(s), f"{s}°"], fb.get("hint", ""), fb.get("ok", ""), fb.get("bad", ""))


def missing_q(qid, name, whole, part, **fb):
    m = whole - part
    return fill(qid, f"A {name} angle ({whole}°) is split into two parts. One part is {part}°. How big is the other part?",
                str(m), [str(m), f"{m}°"], fb.get("hint", ""), fb.get("ok", ""), fb.get("bad", ""))


def build():
    L = []
    L.append(lesson(
        "g4-lines-rays-angles", UNIT_ID, "Points, Lines, Rays & Angles",
        "Geometry detectives, assemble! Lines, rays and segments are the building blocks — and two rays make an angle!",
        panels(
            ("A line goes on forever both ways. A ray starts at one endpoint and zooms off forever. A segment stops at two endpoints!",
             "geo-line-ray-seg", "explain"),
            ("Two rays that share an endpoint make an angle. Smaller than a square corner? Acute. Exactly a square corner? Right (90°). Wider? Obtuse!",
             "geo-angle-types", "think"),
        ),
        example("Worked Example", "What kind of angle is 120°?", [
            "A right angle is exactly 90°",
            "120° is more than 90° but less than 180°",
            "So 120° is an obtuse angle"]),
        [mc("x24a-p1", "A straight path that goes on forever in BOTH directions is a…",
            ["line", "ray", "line segment", "angle"], "line",
            "Look for arrows on both ends.", "A line — forever both ways!",
            "A ray goes forever only one way, and a segment stops at both ends. Forever both ways is a line."),
         fill("x24a-p2", "How many endpoints does a line segment have?", "2", ["2", "two"],
              "A segment is a piece of a line that stops at each end.", "2 endpoints!",
              "A segment has an endpoint at each end — 2 in all."),
         kind_q("x24a-p3", 35, hint="Is it smaller than a square corner?", ok="Acute — a sharp little angle!",
                bad="35° is less than 90°, so it is acute."),
         kind_q("x24a-p4", 120, hint="Compare it with 90° and 180°.", ok="Obtuse!",
                bad="120° is more than 90° but less than 180°, so it is obtuse."),
         mc("x24a-p5", "At 3:00, the hands of a clock make what kind of angle?",
            ["right", "acute", "obtuse", "straight"], "right",
            "Picture the hands pointing at 12 and 3.", "Right — a square corner!",
            "12 to 3 is a quarter turn, a square corner: a right angle (90°).")],
        [mc("x24a-q1", "Which one has exactly ONE endpoint?", ["ray", "line", "line segment", "point"], "ray"),
         kind_q("x24a-q2", 60),
         kind_q("x24a-q3", 150)],
        prereqs=[AFTER_LESSON], skills=["lines-rays-segments", "angle-types"], duration=9))

    L.append(lesson(
        "g4-measure-angles", UNIT_ID, "Measure Angles",
        "Angles are measured in degrees (°). A full turn is 360°. Grab your protractor — let's measure!",
        panels(
            ("Put the protractor's center dot on the vertex. Line up one ray with 0. The other ray points to the size — here 60°!",
             "geo-protractor-60", "explain"),
            ("Angles add up! Put a 30° angle next to a 45° angle and together they make 75°.",
             "geo-angle-add", "cheer"),
        ),
        example("Worked Example", "A right angle (90°) is split into two parts. One part is 35°. How big is the other?", [
            "The two parts add up to the whole: 90°",
            "Missing part = 90° − 35°",
            "The other part is 55°"]),
        [mc("x24b-p1", "A full turn all the way around a circle is how many degrees?",
            ["360", "180", "90", "100"], "360",
            "Half a turn is 180°.", "360° — a full spin!", "A full turn is 360°; half a turn is 180°."),
         proto_q("x24b-p2", 50, ["50", "130", "40", "180"],
                 hint="Use the scale that starts at 0 where the first ray sits.", ok="50°!",
                 bad="Read the scale that starts at 0 on your first ray: 50°. 130 is the other scale."),
         add_q("x24b-p3", 30, 45, hint="Add the two parts.", ok="75°!", bad="30° + 45° = 75°."),
         missing_q("x24b-p4", "right", 90, 25, hint="The parts add up to 90°.", ok="65°!", bad="90° − 25° = 65°."),
         mc("x24b-p5", "A ray turns through 1/4 of a full circle. How many degrees is that?",
            ["90", "25", "45", "180"], "90",
            "A full circle is 360°. What is 1/4 of 360?", "90° — a quarter turn!",
            "360° ÷ 4 = 90°.")],
        [proto_q("x24b-q1", 135),
         add_q("x24b-q2", 60, 20),
         missing_q("x24b-q3", "straight", 180, 110)],
        prereqs=["g4-lines-rays-angles"], skills=["measure-angles", "angle-addition"], duration=10))

    L.append(lesson(
        "g4-parallel-perp", UNIT_ID, "Parallel & Perpendicular",
        "Some lines are best friends that never meet. Others cross at a perfect square corner. Let's spot them!",
        panels(
            ("Parallel lines run side by side forever and never meet — the gap between them stays the same, like train tracks!",
             "geo-parallel", "explain"),
            ("Perpendicular lines cross to make square corners — right angles of 90°. Look at the corner of a book!",
             "geo-perpendicular", "think"),
        ),
        example("Worked Example", "In the letter H, how do the lines fit together?", [
            "The two tall sides never meet and stay the same distance apart → parallel",
            "The middle bar crosses each tall side at a square corner",
            "So the middle bar is perpendicular to both tall sides"]),
        [mc("x24c-p1", "Two lines that never meet and stay the same distance apart are…",
            ["parallel", "perpendicular", "intersecting", "rays"], "parallel",
            "Think of train tracks.", "Parallel!", "Lines that never meet, with the same gap, are parallel."),
         mc("x24c-p2", "Two lines that cross to make square corners are…",
            ["perpendicular", "parallel", "obtuse", "segments"], "perpendicular",
            "Square corner = right angle.", "Perpendicular!", "Lines that cross at right angles are perpendicular."),
         fill("x24c-p3", "Perpendicular lines meet at an angle of how many degrees?", "90", ["90", "90°"],
              "A square corner.", "90°!", "Perpendicular lines make right angles: 90°."),
         mc("x24c-p4", "In the letter H, the two tall sides are…",
            ["parallel", "perpendicular", "neither"], "parallel",
            "Do the tall sides ever meet?", "Parallel!", "The tall sides of H never meet and stay the same distance apart."),
         mc("x24c-p5", "Two roads cross like an X, but not at square corners. Are they perpendicular?",
            ["no — they cross, but not at 90°", "yes — any lines that cross are perpendicular", "no — they are parallel"],
            "no — they cross, but not at 90°",
            "Perpendicular needs a square corner.", "Sharp eyes!",
            "Crossing is not enough — perpendicular lines must meet at 90°. These lines just intersect.")],
        [mc("x24c-q1", "The top and bottom edges of a door are…", ["parallel", "perpendicular", "neither"], "parallel"),
         mc("x24c-q2", "In the letter T, the two lines are…", ["perpendicular", "parallel", "neither"], "perpendicular"),
         mc("x24c-q3", "Perpendicular lines make what kind of angle?", ["right", "acute", "obtuse", "straight"], "right")],
        prereqs=["g4-measure-angles"], skills=["parallel-perpendicular"], duration=8))
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
