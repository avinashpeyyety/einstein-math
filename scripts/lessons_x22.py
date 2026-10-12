#!/usr/bin/env python3
"""X22 — Math ages 9–10: add & subtract fractions with UNLIKE denominators (Common Core 5.NF.1–2),
3 lessons appended to unit u4-fractions (Fraction Universe), right after g4-mixed-sub:
  1. Common Denominators            — rewrite as equivalent fractions with a shared denominator — 5.NF.1
  2. Add & Subtract Unlike Fractions — same-size pieces first, then add/subtract (+ a mixed number) — 5.NF.1
  3. Fraction Stories & Estimates   — word problems + benchmark fractions (1/2, 1) to check answers — 5.NF.2
Prereqs chain: lesson 1 needs g4-frac-sub-same (which chains equiv → compare → add-same);
  2 needs 1; 3 needs 2.
Idempotent: re-running is a no-op.
Run: python3 scripts/lessons_x22.py  (from repo root)"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lesson_helpers import mc, fill, lesson, panels, example  # noqa: E402

PACK = ROOT / "data" / "subjects" / "math.json"
TRACK = "ages-9-10"
UNIT_ID = "u4-fractions"
AFTER_LESSON = "g4-mixed-sub"
M = "−"  # minus sign used across the pack


def build():
    L = []
    L.append(lesson(
        "g5-frac-common-den", UNIT_ID, "Common Denominators",
        "Halves and thirds are different-size pieces. Cut them into the SAME size pieces first — that's a common denominator!",
        panels(
            ("1/2 and 1/3 don't match. Cut both into sixths: 1/2 = 3/6 and 1/3 = 2/6. Now the pieces are the same size!",
             "frac-cd-bars", "explain"),
            ("Find a common denominator: list multiples. 4 → 4, 8, 12… and 6 → 6, 12… The first match, 12, is the LEAST common denominator!",
             "frac-cd-multiples", "think"),
        ),
        example("Worked Example", "Rewrite 3/4 and 1/6 with a common denominator.", [
            "Multiples of 4: 4, 8, 12 · multiples of 6: 6, 12 → use 12",
            "3/4 = 9/12 (×3 top and bottom)",
            "1/6 = 2/12 (×2 top and bottom)"]),
        [mc("x22a-p1", "Which is a common denominator for 1/2 and 1/3?",
            ["6", "5", "3", "2"], "6",
            "It must be a multiple of BOTH 2 and 3.",
            "6 — both 2 and 3 go into 6!",
            "5 = 2 + 3 doesn't work; you need a multiple of both, like 6."),
         fill("x22a-p2", "1/3 = ?/6", "2", ["2"],
              "3 × 2 = 6, so multiply the top by 2 too.", "2/6!", "1 × 2 = 2, so 1/3 = 2/6."),
         fill("x22a-p3", "3/4 = ?/12", "9", ["9"],
              "4 × 3 = 12, so multiply the top by 3.", "9/12!", "3 × 3 = 9, so 3/4 = 9/12."),
         mc("x22a-p4", "Least common denominator of 1/4 and 1/6?",
            ["12", "24", "10", "6"], "12",
            "List multiples of 6 until one is also a multiple of 4.",
            "12 — the smallest one that works!",
            "24 works too, but 12 is the LEAST common denominator."),
         mc("x22a-p5", "Rewrite 1/2 and 2/5 with denominator 10:",
            ["5/10 and 4/10", "1/10 and 2/10", "5/10 and 2/10", "2/10 and 5/10"], "5/10 and 4/10",
            "Multiply top AND bottom by the same number.",
            "5/10 and 4/10!",
            "1/2 = 5/10 (×5) and 2/5 = 4/10 (×2) — change the top too.")],
        [fill("x22a-q1", "2/3 = ?/9", "6", ["6"]),
         mc("x22a-q2", "Least common denominator of 1/3 and 1/4?",
            ["12", "7", "24", "4"], "12"),
         mc("x22a-q3", "Rewrite 1/3 and 1/6 with denominator 6:",
            ["2/6 and 1/6", "1/6 and 1/6", "3/6 and 1/6", "2/6 and 2/6"], "2/6 and 1/6")],
        prereqs=["g4-frac-sub-same"], skills=["frac-common-denominator"], duration=9))

    L.append(lesson(
        "g5-frac-unlike-addsub", UNIT_ID, "Add & Subtract Unlike Fractions",
        "Different denominators? Make the pieces the same size, THEN add or subtract the tops — just like before!",
        panels(
            ("1/2 + 1/3 → 3/6 + 2/6 = 5/6. Never add the bottoms — 2/5 would be smaller than 1/2!",
             "frac-unlike-add", "explain"),
            (f"3/4 {M} 1/6 → 9/12 {M} 2/12 = 7/12. Same-size pieces, then take away!",
             "frac-unlike-sub", "think"),
        ),
        example("Worked Example", "1/4 + 2/3", [
            "Common denominator 12: 1/4 = 3/12 and 2/3 = 8/12",
            "Add the tops: 3 + 8 = 11",
            "1/4 + 2/3 = 11/12"]),
        [mc("x22b-p1", "1/2 + 1/3 = ?",
            ["5/6", "2/5", "2/6", "1/5"], "5/6",
            "Sixths: 3/6 + 2/6.", "5/6!",
            "2/5 adds the bottoms — make sixths first: 3/6 + 2/6 = 5/6."),
         fill("x22b-p2", "1/4 + 1/6 = ?", "5/12", ["5/12", "10/24"],
              "Twelfths: 3/12 + 2/12.", "5/12!", "1/4 = 3/12 and 1/6 = 2/12, so 5/12."),
         mc("x22b-p3", f"3/4 {M} 1/6 = ?",
            ["7/12", "2/10", "1/2", "5/12"], "7/12",
            "Twelfths: 9/12 − 2/12.", "7/12!",
            f"3/4 = 9/12 and 1/6 = 2/12, so 9/12 {M} 2/12 = 7/12."),
         fill("x22b-p4", "1 1/2 + 1/4 = ?", "1 3/4", ["1 3/4", "7/4", "1 6/8", "14/8"],
              "Keep the 1. Then 1/2 + 1/4 = 2/4 + 1/4.", "1 3/4!",
              "1/2 = 2/4, so 2/4 + 1/4 = 3/4 → 1 3/4."),
         mc("x22b-p5", "Why isn't 1/2 + 1/3 equal to 2/5?",
            ["the pieces are different sizes — make them the same first", "because 5 is odd",
             "you should multiply instead", "it is — 2/5 is right"],
            "the pieces are different sizes — make them the same first",
            "Is 2/5 even bigger than 1/2?",
            "Right — same-size pieces first!",
            "2/5 is less than 1/2, so it can't be 1/2 plus more. Make sixths first.")],
        [mc("x22b-q1", "1/2 + 1/5 = ?",
            ["7/10", "2/7", "2/10", "6/10"], "7/10"),
         fill("x22b-q2", f"2/3 {M} 1/4 = ?", "5/12", ["5/12"]),
         fill("x22b-q3", "1/3 + 1/6 = ?", "1/2", ["1/2", "3/6", "9/18"])],
        prereqs=["g5-frac-common-den"], skills=["frac-add-unlike", "frac-sub-unlike"], duration=10))

    L.append(lesson(
        "g5-frac-unlike-wp", UNIT_ID, "Fraction Stories & Estimates",
        "Real problems mix fraction sizes. Solve them — then check with benchmarks like 1/2 and 1. Does the answer make sense?",
        panels(
            ("Maya eats 1/2 of a pizza, Leo eats 1/3. Together: 3/6 + 2/6 = 5/6 of the pizza!",
             "frac-unlike-story", "explain"),
            ("Benchmark check: 2/5 is a bit less than 1/2. So 2/5 + 1/2 is a bit less than 1. The exact answer 9/10 fits!",
             "frac-benchmark", "think"),
        ),
        example("Worked Example", "A ribbon is 3/4 m. You cut off 1/3 m. How much is left?", [
            "Common denominator 12: 3/4 = 9/12 and 1/3 = 4/12",
            f"9/12 {M} 4/12 = 5/12",
            "Check: 3/4 minus about 1/3 leaves a bit less than 1/2 — 5/12 fits!"]),
        [mc("x22c-p1", "Maya ate 1/2 of a pizza and Leo ate 1/3 of the same pizza. How much did they eat together?",
            ["5/6", "2/5", "1/6", "2/6"], "5/6",
            "Sixths: 3/6 + 2/6.", "5/6 of the pizza!",
            "Together means add: 3/6 + 2/6 = 5/6."),
         mc("x22c-p2", "Estimate: is 2/5 + 1/2 more or less than 1?",
            ["less than 1", "more than 1", "exactly 1"], "less than 1",
            "2/5 is a bit less than 1/2.", "Less — it's 9/10!",
            "1/2 + 1/2 = 1, and 2/5 is less than 1/2, so the sum is less than 1."),
         fill("x22c-p3", "A ribbon is 3/4 m long. You cut off 1/3 m. How many meters are left?", "5/12", ["5/12"],
              "Twelfths: 9/12 − 4/12.", "5/12 m left!", f"3/4 = 9/12 and 1/3 = 4/12, so 9/12 {M} 4/12 = 5/12."),
         mc("x22c-p4", "Sam says 1/2 + 1/3 = 2/5. The sum must be MORE than 1/2, but 2/5 is…",
            ["less than 1/2 — so Sam is wrong", "more than 1 — so Sam is right", "exactly 1/2", "equal to 1/3"],
            "less than 1/2 — so Sam is wrong",
            "Compare 2/5 with 1/2 (= 2.5/5).",
            "Benchmark detective! Sam added the bottoms.",
            "2/5 is less than 1/2, so it can't be 1/2 plus more. The real answer is 5/6."),
         mc("x22c-p5", "Estimate: is 3/4 + 3/8 more or less than 1?",
            ["more than 1", "less than 1", "exactly 1"], "more than 1",
            "3/4 needs only 1/4 (= 2/8) more to make 1.", "More — it's 9/8!",
            "3/8 is more than the 2/8 needed to reach 1, so the sum is more than 1.")],
        [fill("x22c-q1", "Jo walked 2/3 mile, then 1/6 mile more. How far in all?", "5/6", ["5/6", "10/12", "15/18"]),
         mc("x22c-q2", "Estimate: is 1/3 + 1/4 more or less than 1/2?",
            ["more than 1/2", "less than 1/2", "exactly 1/2"], "more than 1/2"),
         mc("x22c-q3", "A jug holds 7/8 L of juice. You pour out 1/2 L. How much is left?",
            ["3/8", "6/6", "1/4", "6/8"], "3/8")],
        prereqs=["g5-frac-unlike-addsub"], skills=["frac-unlike-word-problems", "frac-benchmark-estimate"], duration=10))
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
