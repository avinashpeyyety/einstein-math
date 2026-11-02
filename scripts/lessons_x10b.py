#!/usr/bin/env python3
"""X10 cycle 2/2 — Math ages 11–12 track: negatives (6.NS.5–7) + one-step equations (6.EE.5–7).
  unit u6-integers  (Integer Orbit):    Negative Numbers & Opposites (6.NS.5–6) → Absolute Value & Comparing (6.NS.7)
  unit u6-equations (Equation Engines): One-Step Equations: + and − (6.EE.5, 6.EE.7) → One-Step Equations: × and ÷ (6.EE.7)
plus 2 warm-up questions pointing at the new units. Idempotent: re-running is a no-op.
Run: python3 scripts/lessons_x10b.py  (from repo root, after lessons_x10.py)"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lesson_helpers import mc, fill, lesson, panels, example  # noqa: E402

PACK = ROOT / "data" / "subjects" / "math.json"
TRACK = "ages-11-12"
M = "\u2212"  # true minus sign for display; fill items also accept a plain hyphen


def neg(n):
    return [f"-{n}", f"{M}{n}"]


UNITS = [
    {"id": "u6-integers", "title": "Integer Orbit", "icon": "🌡️", "color": "#3B82F6",
     "description": "Below zero! Negative numbers, opposites and absolute value.",
     "lessons": ["g6-negatives", "g6-absolute-value"]},
    {"id": "u6-equations", "title": "Equation Engines", "icon": "⚖️", "color": "#A855F7",
     "description": "Find the mystery number — solve one-step equations by undoing!",
     "lessons": ["g6-one-step-add", "g6-one-step-mult"]},
]

DIAG_ADD = [
    {"id": "d1112-7", "type": "mc", "prompt": "Which temperature is coldest?",
     "choices": [f"{M}5°C", f"{M}2°C", "0°C", "3°C"], "answer": f"{M}5°C", "skill": "negatives", "unitHint": "u6-integers"},
    {"id": "d1112-8", "type": "mc", "prompt": "x + 4 = 10. What is x?", "choices": ["6", "14", "4", "40"], "answer": "6",
     "skill": "one-step-equations", "unitHint": "u6-equations"},
]


def build():
    L = []
    L.append(lesson(
        "g6-negatives", "u6-integers", "Negative Numbers & Opposites",
        f"Numbers keep going LEFT past zero! {M}3 means 3 below zero — colder than 0°, deeper than sea level, or money you owe.",
        panels(
            (f"On the number line, numbers to the LEFT of 0 are negative. 3 and {M}3 are opposites — same distance from 0, opposite sides!", "int-number-line", "explain"),
            (f"A thermometer: 5°C is above zero, {M}3°C is below zero. Lower on the line = colder = smaller number.", "int-thermometer", "think"),
        ),
        example("Worked Example", f"At dawn it was {M}3°C. At noon it was 5°C. Which was colder, and how far apart are they?", [
            f"{M}3 is to the LEFT of 5 on the number line, so {M}3 < 5 → dawn was colder",
            f"From {M}3 up to 0 is 3 degrees, from 0 up to 5 is 5 degrees",
            "3 + 5 = 8 degrees apart"]),
        [mc("x10e-p1", "A diver is 20 m below sea level. Which number shows her position?",
            [f"{M}20", "20", "0", f"{M}2"], f"{M}20", "Below sea level means negative.", f"{M}20!",
            f"Sea level is 0, and 20 m below it is {M}20."),
         fill("x10e-p2", "What is the opposite of 7?", "-7", neg(7), "Same distance from 0, other side.", f"{M}7!",
              f"7 is 7 steps right of 0, so its opposite is 7 steps left: {M}7."),
         mc("x10e-p3", "Which number is greatest?", [f"{M}2", f"{M}8", f"{M}5", f"{M}10"], f"{M}2",
            "Closest to 0 on the left side is greatest.", f"{M}2!", f"{M}2 is farthest RIGHT of these, so it is the greatest."),
         mc("x10e-p4", f"What is the opposite of the opposite of {M}4?", [f"{M}4", "4", "0", f"{M}8"], f"{M}4",
            "Flip across 0 twice.", f"{M}4!", f"The opposite of {M}4 is 4, and the opposite of 4 is {M}4."),
         fill("x10e-p5", f"Put these in order from least to greatest: 3, {M}1, {M}6, 0. Which number comes first?", "-6", neg(6),
              "Least = farthest left.", f"{M}6!", f"{M}6 is farthest left, then {M}1, 0, 3."),
         mc("x10e-p6", f"At midnight it was {M}9°C. In the morning it was {M}4°C. Did it get warmer or colder?",
            ["warmer", "colder", "stayed the same"], "warmer", f"Is {M}4 to the right of {M}9?", "Warmer!",
            f"{M}4 is to the right of {M}9 (closer to 0), so the temperature went up.")],
        [fill("x10e-q1", f"What is the opposite of {M}15?", "15", ["15"]),
         mc("x10e-q2", "Which number is least?", [f"{M}7", f"{M}3", "0", "2"], f"{M}7"),
         mc("x10e-q3", f"A bank account shows {M}$25. What does that mean?",
            ["You owe $25", "You have $25", "You have $0", "You have $50"], "You owe $25")],
        prereqs=[], skills=["negatives", "opposites"], duration=9))

    L.append(lesson(
        "g6-absolute-value", "u6-integers", "Absolute Value & Comparing",
        f"Absolute value is a number's DISTANCE from 0 — always positive or zero. |{M}6| = 6 because {M}6 is 6 steps from 0!",
        panels(
            (f"|{M}6| = 6 and |4| = 4. Absolute value counts the steps back to 0 — the direction doesn't matter.", "abs-distance", "explain"),
            (f"Comparing: {M}5 < {M}2 because {M}5 is farther LEFT. But |{M}5| > |{M}2| — {M}5 is farther from 0!", "int-compare", "think"),
        ),
        example("Worked Example", f"Ravi's account is at {M}$30 and Jo's is at {M}$45. Who owes more?", [
            f"|{M}30| = 30 and |{M}45| = 45 — that's how much each owes",
            "45 > 30, so Jo owes more",
            f"(As balances, {M}45 < {M}30: owing more means a LOWER balance)"]),
        [fill("x10f-p1", f"|{M}9| = ?", "9", ["9"], "Distance from 0.", "9!", f"{M}9 is 9 steps from 0, so |{M}9| = 9."),
         fill("x10f-p2", "|12| = ?", "12", ["12"], "Distance from 0.", "12!", "12 is 12 steps from 0."),
         mc("x10f-p3", "Which number is farthest from 0?", [f"{M}8", "5", f"{M}3", "7"], f"{M}8",
            "Compare absolute values.", f"{M}8!", f"|{M}8| = 8 is bigger than 7, 5 and 3."),
         mc("x10f-p4", "Which statement is true?", [f"{M}5 < {M}2", f"{M}5 > {M}2", f"{M}2 < {M}5", f"{M}5 = {M}2"], f"{M}5 < {M}2",
            "Farther left is smaller.", "Yes!", f"{M}5 is to the left of {M}2, so {M}5 < {M}2."),
         mc("x10f-p5", f"Sam's balance is {M}$30. Jo's balance is {M}$45. Who owes more money?", ["Jo", "Sam", "they owe the same"], "Jo",
            "Compare the absolute values.", "Jo!", f"|{M}45| = 45 > |{M}30| = 30, so Jo owes more."),
         fill("x10f-p6", f"A submarine is at {M}120 m. How many meters below the surface is it?", "120", ["120"],
              "Distance from 0.", "120 m!", f"|{M}120| = 120 meters below the surface.")],
        [fill("x10f-q1", f"|{M}25| = ?", "25", ["25"]),
         mc("x10f-q2", "Which number has an absolute value of 6?", [f"{M}6", "0", "3", f"{M}3"], f"{M}6"),
         mc("x10f-q3", "Which number is greatest?", [f"{M}1", f"{M}10", f"{M}4", f"{M}100"], f"{M}1")],
        prereqs=["g6-negatives"], skills=["absolute-value", "compare-integers"], duration=9))

    L.append(lesson(
        "g6-one-step-add", "u6-equations", "One-Step Equations: + and −",
        f"An equation is a balance — both sides weigh the same. To find the mystery number, UNDO what was done to it: undo + with −, undo − with +!",
        panels(
            ("x + 3 = 8 is a balanced scale. Take 3 off BOTH sides and it stays balanced: x = 5!", "eq-balance", "explain"),
            (f"Adding and subtracting undo each other. x {M} 4 = 10 → add 4 to both sides → x = 14.", "eq-undo", "think"),
        ),
        example("Worked Example", "Solve x + 7 = 15.", [
            f"7 was added to x, so subtract 7 from BOTH sides: x + 7 {M} 7 = 15 {M} 7",
            "x = 8",
            "Check: 8 + 7 = 15 ✓"]),
        [fill("x10g-p1", "x + 5 = 12. x = ?", "7", ["7"], "Subtract 5 from both sides.", "x = 7!", f"12 {M} 5 = 7. Check: 7 + 5 = 12."),
         fill("x10g-p2", f"x {M} 4 = 10. x = ?", "14", ["14"], "Add 4 to both sides.", "x = 14!", f"10 + 4 = 14. Check: 14 {M} 4 = 10."),
         mc("x10g-p3", "Which value makes y + 9 = 20 true?", ["11", "29", "9", "20"], "11", "What plus 9 makes 20?", "11!",
            f"20 {M} 9 = 11, and 11 + 9 = 20."),
         mc("x10g-p4", f"To solve n {M} 6 = 13, what do you do to both sides?", ["add 6", "subtract 6", "multiply by 6", "divide by 6"], "add 6",
            "Undo the subtraction.", "Add 6!", f"6 was subtracted, so add 6: n = 19."),
         fill("x10g-p5", "Ana had some stickers and got 8 more. Now she has 23. How many did she start with? (s + 8 = 23)", "15", ["15"],
              "Subtract 8 from both sides.", "15 stickers!", f"23 {M} 8 = 15. Check: 15 + 8 = 23."),
         fill("x10g-p6", "25 = m + 18. m = ?", "7", ["7"], "The mystery number can be on the right side too.", "m = 7!",
              f"25 {M} 18 = 7. Check: 7 + 18 = 25.")],
        [fill("x10g-q1", "x + 13 = 30. x = ?", "17", ["17"]),
         fill("x10g-q2", f"k {M} 9 = 9. k = ?", "18", ["18"]),
         mc("x10g-q3", "Is x = 4 a solution of x + 6 = 11?", ["no", "yes"], "no")],
        prereqs=[], skills=["one-step-equations", "inverse-add-sub"], duration=9))

    L.append(lesson(
        "g6-one-step-mult", "u6-equations", "One-Step Equations: × and ÷",
        "3x means 3 times x. Multiplying and dividing undo each other — divide to undo ×, multiply to undo ÷!",
        panels(
            ("3x = 12: three equal boxes hold 12 stars in all. Share 12 into 3 boxes → each box (x) holds 4!", "eq-groups", "explain"),
            ("Undo × with ÷ and ÷ with ×. x ÷ 5 = 6 → multiply both sides by 5 → x = 30.", "eq-inverse", "think"),
        ),
        example("Worked Example", "Solve 4x = 28.", [
            "x was multiplied by 4, so divide BOTH sides by 4",
            "x = 28 ÷ 4 = 7",
            "Check: 4 × 7 = 28 ✓"]),
        [fill("x10h-p1", "3x = 21. x = ?", "7", ["7"], "Divide both sides by 3.", "x = 7!", "21 ÷ 3 = 7. Check: 3 × 7 = 21."),
         fill("x10h-p2", "x ÷ 5 = 6. x = ?", "30", ["30"], "Multiply both sides by 5.", "x = 30!", "6 × 5 = 30. Check: 30 ÷ 5 = 6."),
         mc("x10h-p3", "To solve 8n = 56, what do you do to both sides?", ["divide by 8", "multiply by 8", "subtract 8", "add 8"], "divide by 8",
            "Undo the multiplication.", "Divide by 8!", "56 ÷ 8 = 7, so n = 7."),
         fill("x10h-p4", "6 tickets cost $42 in all, each the same price. 6t = 42. t = ?", "7", ["7", "$7"],
              "Divide both sides by 6.", "$7 each!", "42 ÷ 6 = 7. Check: 6 × 7 = 42."),
         mc("x10h-p5", "Which equation means “a number times 4 is 36”?", ["4n = 36", "n + 4 = 36", "n ÷ 4 = 36", "36n = 4"], "4n = 36",
            "“Times” means multiply.", "4n = 36!", "A number times 4 → 4n, and “is 36” → = 36. (n = 9)"),
         fill("x10h-p6", "y ÷ 3 = 9. y = ?", "27", ["27"], "Multiply both sides by 3.", "y = 27!", "9 × 3 = 27. Check: 27 ÷ 3 = 9.")],
        [fill("x10h-q1", "9x = 72. x = ?", "8", ["8"]),
         fill("x10h-q2", "m ÷ 4 = 12. m = ?", "48", ["48"]),
         mc("x10h-q3", "Which value solves 7x = 49?", ["7", "42", "56", "343"], "7")],
        prereqs=["g6-one-step-add"], skills=["one-step-equations", "inverse-mult-div"], duration=10))
    return L


def main():
    data = json.loads(PACK.read_text())
    track = data["tracks"][TRACK]
    for U in UNITS:
        if not any(u["id"] == U["id"] for u in track["units"]):
            track["units"].append(json.loads(json.dumps(U)))
    have = {q["id"] for q in track["diagnostic"]["questions"]}
    for q in DIAG_ADD:
        if q["id"] not in have:
            track["diagnostic"]["questions"].append(q)
    added = 0
    for L in build():
        if L["id"] not in track["lessons"]:
            track["lessons"][L["id"]] = L
            added += 1
    for lid, L in track["lessons"].items():
        for p in L["prerequisites"]:
            assert p in track["lessons"], (lid, p)
    track["blurb"] = "Ratios & rates, percents, negative numbers and one-step equations!"
    PACK.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    print(f"added {added}; {TRACK} now {len(track['lessons'])} lessons; units {[u['id'] for u in track['units']]}")


if __name__ == "__main__":
    main()
