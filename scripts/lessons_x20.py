#!/usr/bin/env python3
"""X20 — Math ages 7–8: ×3/×4/×6–×9 facts, division as unknown factor,
commutative/distributive properties (4 lessons, audit gap 3.OA.5–7).
Adds lessons to unit-mult-div right after md-facts-2-5-10. Idempotent: re-running is a no-op.
Run: python3 scripts/lessons_x20.py  (from repo root)"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lesson_helpers import mc, fill, lesson, panels, example  # noqa: E402

PACK = ROOT / "data" / "subjects" / "math.json"
TRACK = "ages-7-8"
UNIT = "unit-mult-div"
AFTER = "md-facts-2-5-10"


def build():
    L = []
    L.append(lesson(
        "md-facts-3-4", UNIT, "Facts: 3s & 4s",
        "Skip-count by 3s and 4s — and learn the double-double trick for 4s!",
        panels(("3×6 means 6 jumps of 3: 3, 6, 9, 12, 15, 18!", "facts-3s", "explain"),
               ("4s trick: double, then double again. 4×7 → 14 → 28!", "double-double", "cheer")),
        example("Worked Example", "4 × 6 = ?", ["2 × 6 = 12", "Double it: 12 + 12 = 24", "4 × 6 = 24"]),
        [mc("x20a-p1", "3 × 4 = ?", ["7", "12", "34", "9"], "12", "4 jumps of 3", "12!", "3×4=12."),
         fill("x20a-p2", "3 × 7 = ?", "21", ["21"], "3, 6, 9, 12, 15, 18, 21", "21!", "3×7=21."),
         mc("x20a-p3", "4 × 8 = ?", ["12", "24", "32", "48"], "32", "2×8=16, double it", "32!", "16+16=32."),
         mc("x20a-p4", "Which skip-count shows 3 × 5?", ["3, 6, 9, 12, 15", "5, 10, 15", "3, 5, 8", "1, 2, 3, 4, 5"],
            "3, 6, 9, 12, 15", "5 jumps of 3", "Yes — 15!", "Count by 3s five times."),
         fill("x20a-p5", "4 × 9 = ?", "36", ["36"], "2×9=18, double it", "36!", "18+18=36.")],
        [mc("x20a-q1", "3 × 8 = ?", ["11", "24", "21", "27"], "24"),
         fill("x20a-q2", "4 × 5 = ?", "20", ["20"]),
         fill("x20a-q3", "3 × 9 = ?", "27", ["27"])],
        prereqs=["md-facts-2-5-10"], skills=["mult-facts-3-4"]))

    L.append(lesson(
        "md-facts-6-9", UNIT, "Facts: 6s, 7s, 8s & 9s",
        "The big facts! Use facts you already know to crack 6s, 7s, 8s and 9s.",
        panels(("6×7? Start with 5×7=35, then add one more 7 → 42!", "five-plus-one", "explain"),
               ("9s trick: 9×6 = 10×6 − 6 = 54. And 5 + 4 = 9!", "nines-trick", "cheer")),
        example("Worked Example", "8 × 7 = ?", ["Start with 4 × 7 = 28", "Double it: 28 + 28 = 56", "8 × 7 = 56"]),
        [mc("x20b-p1", "6 × 6 = ?", ["12", "36", "30", "42"], "36", "5×6 + 6", "36!", "30+6=36."),
         fill("x20b-p2", "9 × 4 = ?", "36", ["36"], "10×4 − 4", "36!", "40−4=36."),
         mc("x20b-p3", "7 × 8 = ?", ["54", "56", "48", "63"], "56", "5, 6, 7, 8 → 56 = 7×8", "56!", "7×8=56."),
         mc("x20b-p4", "9 × 7 = 10 × 7 − ?", ["7", "9", "1", "70"], "7", "Take away one 7", "Yes! 70−7=63.", "10 sevens minus 1 seven."),
         fill("x20b-p5", "6 × 8 = ?", "48", ["48"], "5×8 + 8", "48!", "40+8=48.")],
        [mc("x20b-q1", "7 × 7 = ?", ["14", "49", "42", "56"], "49"),
         fill("x20b-q2", "9 × 9 = ?", "81", ["81"]),
         mc("x20b-q3", "8 × 6 = ?", ["48", "42", "54", "14"], "48")],
        prereqs=["md-facts-3-4"], skills=["mult-facts-6-9"]))

    L.append(lesson(
        "md-div-unknown-factor", UNIT, "Division = Missing Factor",
        "Every division hides a multiplication — find the missing factor!",
        panels(("24 ÷ 6 = ? really asks: 6 times WHAT makes 24?", "missing-factor", "explain"),
               ("6 × 4 = 24, so 24 ÷ 6 = 4. Multiplication unlocks division!", "fact-family-24", "cheer")),
        example("Worked Example", "35 ÷ 5 = ?", ["Think: 5 × ? = 35", "5 × 7 = 35", "So 35 ÷ 5 = 7"]),
        [mc("x20c-p1", "18 ÷ 3 = ?  (Think: 3 × ? = 18)", ["5", "6", "15", "21"], "6", "3, 6, 9, 12, 15, 18", "6!", "3×6=18."),
         fill("x20c-p2", "4 × ? = 28", "7", ["7"], "Count by 4s to 28", "7!", "4×7=28."),
         mc("x20c-p3", "Which fact helps solve 42 ÷ 7?", ["7 × 6 = 42", "7 + 35 = 42", "42 − 7 = 35", "4 × 2 = 8"],
            "7 × 6 = 42", "Look for a × fact", "Yes — so 42÷7=6!", "Division pairs with multiplication."),
         fill("x20c-p4", "56 ÷ 8 = ?", "7", ["7"], "8 × ? = 56", "7!", "8×7=56."),
         mc("x20c-p5", "? × 9 = 45", ["5", "4", "36", "54"], "5", "Count by 9s", "5!", "5×9=45.")],
        [fill("x20c-q1", "32 ÷ 4 = ?", "8", ["8"]),
         mc("x20c-q2", "6 × ? = 54", ["8", "9", "7", "48"], "9"),
         fill("x20c-q3", "63 ÷ 9 = ?", "7", ["7"])],
        prereqs=["md-facts-3-4", "md-arrays-div"], skills=["div-unknown-factor"]))

    L.append(lesson(
        "md-properties", UNIT, "Turn-Around & Break-Apart",
        "Two multiplication superpowers: turn facts around, or break them apart!",
        panels(("Turn-around: 3 × 8 = 8 × 3. Turn the array — still 24 stars!", "turn-around", "explain"),
               ("Break-apart: 7 × 6 = 5×6 + 2×6 = 30 + 12 = 42!", "break-apart", "cheer")),
        example("Worked Example", "Break apart 8 × 7", ["Split 8 into 5 + 3", "5 × 7 = 35 and 3 × 7 = 21", "35 + 21 = 56"]),
        [mc("x20d-p1", "6 × 9 = 9 × ?", ["6", "9", "15", "54"], "6", "Turn it around", "6!", "Order can swap."),
         fill("x20d-p2", "If 7 × 4 = 28, then 4 × 7 = ?", "28", ["28"], "Turn-around fact", "28!", "Same product."),
         mc("x20d-p3", "Which one equals 6 × 8?", ["5×8 + 1×8", "5×8 + 1", "6 + 8", "6×5 + 8"],
            "5×8 + 1×8", "6 eights = 5 eights + 1 eight", "Yes — 40+8=48!", "Break 6 into 5+1, keep the 8s."),
         mc("x20d-p4", "4 × (5 + 2) = 4×5 + 4×?", ["2", "5", "4", "7"], "2", "Multiply each part", "2!", "4×5 + 4×2 = 28."),
         fill("x20d-p5", "9 × 6 = 5×6 + 4×6 = 30 + 24 = ?", "54", ["54"], "Add the parts", "54!", "30+24=54.")],
        [mc("x20d-q1", "Turn-around fact for 5 × 9?", ["9 × 5", "5 + 9", "9 − 5", "59"], "9 × 5"),
         fill("x20d-q2", "8 × 6 = 8×5 + 8×1 = 40 + ?", "8", ["8"]),
         mc("x20d-q3", "3 × 12 = 3×10 + 3×2 = ?", ["32", "36", "15", "312"], "36")],
        prereqs=["md-facts-6-9"], skills=["mult-properties"]))
    return L


def main():
    data = json.loads(PACK.read_text())
    track = data["tracks"][TRACK]
    unit = next(u for u in track["units"] if u["id"] == UNIT)
    added = 0
    pos = unit["lessons"].index(AFTER) + 1
    for L in build():
        lid = L["id"]
        if lid in track["lessons"]:
            continue
        track["lessons"][lid] = L
        unit["lessons"].insert(pos, lid)
        pos += 1
        added += 1
    for lid, L in track["lessons"].items():
        for p in L["prerequisites"]:
            assert p in track["lessons"], (lid, p)
    PACK.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    print(f"added {added}; {TRACK} now {len(track['lessons'])} lessons; {UNIT}: {unit['lessons']}")


if __name__ == "__main__":
    main()
