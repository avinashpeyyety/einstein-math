#!/usr/bin/env python3
"""X25 — Math ages 7–8: fractions on a number line, simple equivalence, compare with the same
numerator or the same denominator (Common Core 3.NF.2–3), 3 lessons appended to unit
unit-fractions (Early Fractions), right after fr-unit-fractions:
  1. Fractions on a Number Line — 0 to 1 cut into d equal jumps; a/d = a jumps from 0 — 3.NF.2
  2. Same Spot, Same Amount     — equivalent fractions + whole numbers as fractions — 3.NF.3a–c
  3. Compare Fractions          — same denominator / same numerator with <, >, = (same whole) — 3.NF.3d
Denominators stay within 2, 3, 4, 6, 8 (the grade 3 set).
Prereqs chain: lesson 1 needs fr-unit-fractions; 2 needs 1; 3 needs 2.
Idempotent: re-running is a no-op.
Run: python3 scripts/lessons_x25.py  (from repo root)"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lesson_helpers import mc, fill, lesson, panels, example  # noqa: E402

PACK = ROOT / "data" / "subjects" / "math.json"
TRACK = "ages-7-8"
UNIT_ID = "unit-fractions"
AFTER_LESSON = "fr-unit-fractions"


def line_q(qid, d, k, name, choices=None, **fb):
    prompt = f"A line from 0 to 1 is cut into {d} equal parts. Point {name} is {k} jump{'s' if k != 1 else ''} from 0. What fraction is {name}?"
    ans = f"{k}/{d}"
    if choices:
        return mc(qid, prompt, choices, ans, fb.get("hint", ""), fb.get("ok", ""), fb.get("bad", ""))
    return fill(qid, prompt, ans, [ans], fb.get("hint", ""), fb.get("ok", ""), fb.get("bad", ""))


def build():
    L = []
    L.append(lesson(
        "fr-number-line", UNIT_ID, "Fractions on a Number Line",
        "A number line is a ruler for fractions! Cut 0 to 1 into equal jumps — each jump is a unit fraction.",
        panels(
            ("Cut 0 to 1 into 4 equal jumps. Each jump is 1/4. Three jumps from 0 lands on 3/4!",
             "nl-quarters", "explain"),
            ("The bottom number says how many equal jumps make 1. The top number says how many jumps you take from 0.",
             "nl-sixths", "think"),
        ),
        example("Worked Example", "Where is 2/3 on a number line?", [
            "Cut 0 to 1 into 3 equal jumps",
            "Each jump is 1/3",
            "Take 2 jumps from 0 → that point is 2/3"]),
        [line_q("x25a-p1", 4, 3, "A", ["3/4", "1/4", "4/3", "3/1"],
                hint="4 equal parts → each jump is 1/4.", ok="3/4!",
                bad="Each jump is 1/4, and 3 jumps make 3/4."),
         fill("x25a-p2", "A line from 0 to 1 is cut into 6 equal parts. How many jumps from 0 to 5/6?", "5", ["5"],
              "Each jump is 1/6. The top number counts the jumps.", "5 jumps!", "5/6 means 5 jumps of 1/6."),
         mc("x25a-p3", "To show thirds, cut the line from 0 to 1 into how many equal parts?",
            ["3", "2", "1", "6"], "3",
            "Thirds → the bottom number is 3.", "3 equal parts!",
            "Thirds means 3 equal parts between 0 and 1."),
         line_q("x25a-p4", 8, 3, "B",
                hint="8 equal parts → each jump is 1/8.", ok="3/8!",
                bad="3 jumps of 1/8 make 3/8."),
         line_q("x25a-p5", 3, 3, "C", ["3/3", "1/3", "3/1", "0/3"],
                hint="Count all 3 jumps — where do you land?", ok="3/3 — right on 1!",
                bad="3 jumps of 1/3 make 3/3, and that lands right on 1.")],
        [line_q("x25a-q1", 6, 1, "D", ["1/6", "6/1", "1/1", "5/6"]),
         fill("x25a-q2", "A line from 0 to 1 is cut into 4 equal parts. How many jumps from 0 to 2/4?", "2", ["2"]),
         line_q("x25a-q3", 8, 7, "E", ["7/8", "1/8", "8/8", "7/1"])],
        prereqs=[AFTER_LESSON], skills=["frac-number-line"], duration=8))

    L.append(lesson(
        "fr-equivalent", UNIT_ID, "Same Spot, Same Amount",
        "Two different names, ONE spot on the number line? Those fractions are equivalent — they are equal!",
        panels(
            ("Cut one line into halves and one into fourths. 1/2 and 2/4 land on the SAME spot — so 1/2 = 2/4!",
             "nl-equiv-half", "explain"),
            ("Bars show it too: 2/3 covers the same amount as 4/6. And 4/4 fills the whole bar — that's 1!",
             "frac-equiv-bars", "cheer"),
        ),
        example("Worked Example", "Is 2/4 equal to 1/2?", [
            "Cut one line from 0 to 1 into 4 parts and one into 2 parts",
            "2/4 and 1/2 land on the same spot",
            "Same spot → 2/4 = 1/2"]),
        [mc("x25b-p1", "Which fraction sits at the same spot as 1/2?",
            ["2/4", "1/4", "2/3", "1/3"], "2/4",
            "How many fourths fill one half?", "2/4 — same spot, same amount!",
            "Two fourths fill the same space as one half, so 1/2 = 2/4."),
         fill("x25b-p2", "1/2 = ?/6", "3", ["3"],
              "Split each half into 3 sixths.", "3/6!", "One half is 3 sixths, so 1/2 = 3/6."),
         fill("x25b-p3", "2/3 = ?/6", "4", ["4"],
              "Each third splits into 2 sixths.", "4/6!", "2 thirds × 2 sixths each = 4 sixths."),
         mc("x25b-p4", "Is 3/4 equal to 6/8?", ["yes", "no"], "yes",
            "Split each fourth into 2 eighths.", "Yes — 3/4 = 6/8!",
            "Each fourth is 2 eighths, so 3 fourths = 6 eighths."),
         fill("x25b-p5", "4/4 = ?", "1", ["1"],
              "4 of the 4 fourths fills the whole.", "1 whole!", "All 4 fourths make 1 whole: 4/4 = 1.")],
        [mc("x25b-q1", "Which fraction sits at the same spot as 1/4?",
            ["2/8", "1/8", "2/4", "4/1"], "2/8"),
         fill("x25b-q2", "3 = ?/1", "3", ["3"]),
         mc("x25b-q3", "Is 2/3 equal to 2/6?", ["no", "yes"], "no")],
        prereqs=["fr-number-line"], skills=["frac-equivalent-simple", "frac-whole-numbers"], duration=9))

    L.append(lesson(
        "fr-compare-same", UNIT_ID, "Compare Fractions",
        "Which is more pizza? With the same whole, you can compare fractions with <, > or = — no measuring needed!",
        panels(
            ("Same bottom number? Same-size pieces! 3/8 < 5/8 because 3 pieces is less than 5 pieces.",
             "frac-compare-same-den", "explain"),
            ("Same top number? Look at the piece size. Thirds are bigger than sixths, so 2/3 > 2/6. Only compare when the wholes are the same size!",
             "frac-compare-same-num", "think"),
        ),
        example("Worked Example", "Compare 3/4 and 3/8.", [
            "Same top number: 3 pieces each",
            "Fourths are bigger pieces than eighths",
            "3/4 > 3/8"]),
        [mc("x25c-p1", "Pick the sign: 3/8 ? 5/8", ["<", ">", "="], "<",
            "Same-size pieces — who has more?", "3/8 < 5/8!",
            "Eighths are the same size, and 3 is less than 5, so 3/8 < 5/8."),
         mc("x25c-p2", "Pick the sign: 2/3 ? 2/6", [">", "<", "="], ">",
            "Same number of pieces — whose pieces are bigger?", "2/3 > 2/6!",
            "Thirds are bigger pieces than sixths, so 2 thirds > 2 sixths."),
         mc("x25c-p3", "Which is bigger: 1/4 or 1/8?", ["1/4", "1/8", "same"], "1/4",
            "Fewer pieces in the whole → bigger pieces.", "1/4!",
            "A whole cut into 4 has bigger pieces than one cut into 8."),
         mc("x25c-p4", "Pick the sign: 4/6 ? 4/6", ["=", "<", ">"], "=",
            "Look closely — are they different?", "Equal!", "Same fraction, same amount: 4/6 = 4/6."),
         mc("x25c-p5", "Lily ate 3/4 of a small pizza. Max ate 3/4 of a giant pizza. Did they eat the same amount?",
            ["no — the wholes are different sizes", "yes — 3/4 is 3/4", "yes — they both ate 3 pieces"],
            "no — the wholes are different sizes",
            "Are the two pizzas the same size?", "Sharp! Compare only with the same whole.",
            "3/4 of a giant pizza is more pizza — fractions compare fairly only when the wholes match.")],
        [mc("x25c-q1", "Pick the sign: 5/6 ? 1/6", [">", "<", "="], ">"),
         mc("x25c-q2", "Pick the sign: 3/4 ? 3/8", ["<", ">", "="], ">"),
         fill("x25c-q3", "Which is smaller: 2/3 or 2/8?", "2/8", ["2/8"])],
        prereqs=["fr-equivalent"], skills=["frac-compare-same-den", "frac-compare-same-num"], duration=9))
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
