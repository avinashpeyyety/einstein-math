#!/usr/bin/env python3
"""X26 — Math ages 9–10: thousandths & rounding decimals, powers of 10, multiply decimals,
divide decimals (Common Core 5.NBT.1–4, 5.NBT.7), 4 lessons in u4-decimals-area after g4-decimal-sub:
  1. Thousandths & Rounding Decimals — expanded form to thousandths, compare, round — 5.NBT.3–4
  2. Powers of 10                    — ×/÷ by 10, 100, 1000; exponents 10², 10³   — 5.NBT.1–2
  3. Multiply Decimals               — decimal × whole, decimal × decimal          — 5.NBT.7
  4. Divide Decimals                 — decimal ÷ whole, whole ÷ 0.5/0.1, dec ÷ dec — 5.NBT.7
Idempotent: re-running is a no-op.
Run: python3 scripts/lessons_x26.py  (from repo root)"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lesson_helpers import mc, fill, lesson, panels, example  # noqa: E402

PACK = ROOT / "data" / "subjects" / "math.json"
TRACK = "ages-9-10"
UNIT = "u4-decimals-area"
AFTER = "g4-decimal-sub"
ORDER = ["g5-thousandths-round", "g5-powers-of-ten", "g5-decimal-multiply", "g5-decimal-divide"]


def build():
    L = []
    L.append(lesson(
        "g5-thousandths-round", UNIT, "Thousandths & Rounding Decimals",
        "Tenths, hundredths… and now THOUSANDTHS! Each place to the right is 10 times smaller. Let's read, compare and round them.",
        panels(
            ("3.472 = 3 ones + 4 tenths + 7 hundredths + 2 thousandths. The 2 is worth only 0.002!",
             "decimal-thousandths-pv", "explain"),
            ("4.268 sits between 4.2 and 4.3 — and it's closer to 4.3. Look one place to the right: 6 is 5 or more, so round UP!",
             "decimal-round-line", "think"),
        ),
        example("Worked Example", "Round 3.476 to the nearest hundredth.", [
            "Hundredths place: 3.476 is between 3.47 and 3.48",
            "Look at the thousandths digit: 6 is 5 or more → round up",
            "3.476 → 3.48"]),
        [fill("x26a-p1", "Write 3 + 0.4 + 0.07 + 0.002 as a decimal.", "3.472", ["3.472"],
              "Put each part in its place: ones . tenths hundredths thousandths.", "3.472!",
              "3 ones, 4 tenths, 7 hundredths, 2 thousandths → 3.472."),
         mc("x26a-p2", "Which is greater: 0.457 or 0.46?", ["0.46", "0.457", "they are equal"], "0.46",
            "Write both with 3 places: 0.457 and 0.460.", "0.46 is greater!",
            "0.460 vs 0.457 → 460 thousandths beats 457 thousandths. More digits doesn't mean bigger!"),
         fill("x26a-p3", "Round 4.268 to the nearest tenth.", "4.3", ["4.3", "4.30"],
              "Look at the hundredths digit.", "4.3!", "The hundredths digit is 6 (5 or more), so 4.2 rounds up to 4.3."),
         mc("x26a-p4", "Round 7.352 to the nearest hundredth.", ["7.35", "7.36", "7.4", "7.3"], "7.35",
            "Look at the thousandths digit.", "7.35!", "The thousandths digit is 2 (less than 5), so keep 7.35."),
         fill("x26a-p5", "Round 12.5 to the nearest whole number.", "13", ["13"],
              "Look at the tenths digit.", "13!", "The tenths digit is 5, so round up: 12.5 → 13."),
         mc("x26a-p6", "In 5.384, what is the value of the 4?",
            ["4 thousandths", "4 hundredths", "4 tenths", "4 ones"], "4 thousandths",
            "Count places after the dot: tenths, hundredths, thousandths.", "4 thousandths = 0.004!",
            "5.384: 3 is tenths, 8 is hundredths, 4 is thousandths.")],
        [mc("x26a-q1", "Which is greater: 0.309 or 0.31?", ["0.31", "0.309", "they are equal"], "0.31"),
         fill("x26a-q2", "Round 2.746 to the nearest hundredth.", "2.75", ["2.75"]),
         fill("x26a-q3", "Write 6 + 0.2 + 0.005 as a decimal.", "6.205", ["6.205"])],
        prereqs=["g4-decimal-compare"], skills=["decimal-thousandths", "decimal-rounding"], duration=9))

    L.append(lesson(
        "g5-powers-of-ten", UNIT, "Powers of 10",
        "Multiply by 10 and every digit jumps one place to the LEFT. Divide by 10 and they slide one place to the RIGHT. Let's play!",
        panels(
            ("3.6 × 10 = 36 — each digit moves one place left. × 100 moves two places, × 1000 moves three!",
             "pow10-shift", "explain"),
            ("10² means 10 × 10 = 100. 10³ = 10 × 10 × 10 = 1000. The little number counts the zeros!",
             "pow10-exponents", "think"),
        ),
        example("Worked Example", "Solve 4.27 × 100.", [
            "100 has 2 zeros → digits move 2 places left",
            "4.27 → 42.7 → 427",
            "4.27 × 100 = 427"]),
        [fill("x26b-p1", "3.6 × 10 = ?", "36", ["36", "36.0"],
              "× 10 → one place left.", "36!", "3.6 × 10: the 3 becomes 3 tens and the 6 becomes 6 ones → 36."),
         mc("x26b-p2", "0.45 × 100 = ?", ["45", "4.5", "450", "0.045"], "45",
            "× 100 → two places left.", "45!", "0.45 → 4.5 → 45."),
         fill("x26b-p3", "720 ÷ 100 = ?", "7.2", ["7.2", "7.20"],
              "÷ 100 → two places right.", "7.2!", "720 → 72 → 7.2."),
         mc("x26b-p4", "5.8 ÷ 10 = ?", ["0.58", "58", "0.058", "5.08"], "0.58",
            "÷ 10 → one place right.", "0.58!", "5.8 ÷ 10: 5 ones become 5 tenths, 8 tenths become 8 hundredths → 0.58."),
         fill("x26b-p5", "10³ = ?", "1000", ["1000", "1,000"],
              "10 × 10 × 10.", "1000!", "10³ = 10 × 10 × 10 = 1000 (3 zeros)."),
         mc("x26b-p6", "How many zeros are in 10⁴ written out?", ["4", "3", "5", "10"], "4",
            "The little number counts the zeros.", "4 zeros — 10,000!", "10⁴ = 10 × 10 × 10 × 10 = 10,000.")],
        [fill("x26b-q1", "2.5 × 1000 = ?", "2500", ["2500", "2,500"]),
         mc("x26b-q2", "64 ÷ 1000 = ?", ["0.064", "0.64", "6.4", "0.0064"], "0.064"),
         fill("x26b-q3", "10² = ?", "100", ["100"])],
        prereqs=["g4-decimal-pv"], skills=["powers-of-ten", "decimal-place-value"], duration=8))

    L.append(lesson(
        "g5-decimal-multiply", UNIT, "Multiply Decimals",
        "Multiplying decimals is a secret mission: multiply like whole numbers, then put the dot back in the right place!",
        panels(
            ("0.3 × 0.2: 3 tenths of 2 tenths is 6 HUNDREDTHS. 0.3 × 0.2 = 0.06 — smaller than both!",
             "decimal-mult-grid", "explain"),
            ("2.4 × 1.5: do 24 × 15 = 360. One decimal place + one decimal place = two places → 3.60 = 3.6!",
             "decimal-mult-places", "think"),
        ),
        example("Worked Example", "Solve 1.25 × 3.", [
            "Ignore the dot: 125 × 3 = 375",
            "1.25 has 2 decimal places → 3.75",
            "Estimate check: about 1 × 3 = 3, and 3.75 is close ✓"]),
        [fill("x26c-p1", "0.6 × 4 = ?", "2.4", ["2.4", "2.40"],
              "6 tenths × 4 = 24 tenths.", "2.4!", "6 × 4 = 24, one decimal place → 2.4."),
         mc("x26c-p2", "1.25 × 3 = ?", ["3.75", "37.5", "0.375", "3.65"], "3.75",
            "125 × 3, then count decimal places.", "3.75!", "125 × 3 = 375; 2 decimal places → 3.75."),
         fill("x26c-p3", "0.3 × 0.2 = ?", "0.06", ["0.06", ".06"],
              "Tenths × tenths = hundredths.", "0.06!", "3 × 2 = 6; 1 + 1 = 2 decimal places → 0.06."),
         mc("x26c-p4", "2.4 × 1.5 = ?", ["3.6", "36", "0.36", "3.9"], "3.6",
            "24 × 15 = 360. How many decimal places in all?", "3.6!",
            "24 × 15 = 360; 1 + 1 = 2 decimal places → 3.60 = 3.6."),
         fill("x26c-p5", "A notebook costs $1.75. How much do 4 notebooks cost, in dollars?", "7",
              ["7", "7.00", "7.0", "$7", "$7.00"],
              "Multiply 1.75 × 4.", "$7.00!", "175 × 4 = 700; 2 decimal places → 7.00 dollars."),
         mc("x26c-p6", "Estimate first: 3.9 × 5 is close to…", ["20", "2", "200", "15"], "20",
            "Round 3.9 to the nearest whole number.", "About 20!", "3.9 is about 4, and 4 × 5 = 20 (the exact answer is 19.5).")],
        [fill("x26c-q1", "0.8 × 6 = ?", "4.8", ["4.8", "4.80"]),
         mc("x26c-q2", "0.4 × 0.5 = ?", ["0.2", "2", "0.02", "0.9"], "0.2"),
         fill("x26c-q3", "1.2 × 0.3 = ?", "0.36", ["0.36", ".36"])],
        prereqs=["g5-powers-of-ten", "g4-multi-mult"], skills=["decimal-multiply"], duration=10))

    L.append(lesson(
        "g5-decimal-divide", UNIT, "Divide Decimals",
        "Sharing money, cutting ribbon, counting halves — dividing decimals is everywhere. Let's crack it!",
        panels(
            ("4.8 ÷ 4: 48 tenths shared by 4 is 12 tenths each. 4.8 ÷ 4 = 1.2!",
             "decimal-div-share", "explain"),
            ("3 ÷ 0.5 asks: how many halves fit in 3? Each whole has 2 halves → 6 halves. So 3 ÷ 0.5 = 6 — BIGGER than 3!",
             "decimal-div-halves", "think"),
        ),
        example("Worked Example", "Solve 1.44 ÷ 1.2.", [
            "Make the divisor whole: × 10 on both → 14.4 ÷ 12",
            "144 ÷ 12 = 12 → 14.4 ÷ 12 = 1.2",
            "Check: 1.2 × 1.2 = 1.44 ✓"]),
        [fill("x26d-p1", "4.8 ÷ 4 = ?", "1.2", ["1.2", "1.20"],
              "48 tenths ÷ 4.", "1.2!", "48 ÷ 4 = 12 tenths → 1.2. Check: 1.2 × 4 = 4.8."),
         mc("x26d-p2", "3 ÷ 0.5 = ?", ["6", "1.5", "0.6", "15"], "6",
            "How many halves fit in 3?", "6 halves!", "Each whole has 2 halves, so 3 wholes have 6. Check: 6 × 0.5 = 3."),
         fill("x26d-p3", "2 ÷ 0.1 = ?", "20", ["20"],
              "How many tenths fit in 2?", "20!", "Each whole has 10 tenths, so 2 wholes have 20. Check: 20 × 0.1 = 2."),
         mc("x26d-p4", "1.44 ÷ 1.2 = ?", ["1.2", "12", "0.12", "1.02"], "1.2",
            "Multiply both by 10: 14.4 ÷ 12.", "1.2!", "14.4 ÷ 12 = 1.2. Check: 1.2 × 1.2 = 1.44."),
         fill("x26d-p5", "Four friends share $10.60 equally. How much does each friend get, in dollars?", "2.65",
              ["2.65", "$2.65"],
              "Divide 10.60 ÷ 4.", "$2.65 each!", "1060 cents ÷ 4 = 265 cents = $2.65. Check: 2.65 × 4 = 10.60."),
         mc("x26d-p6", "How many halves are in 3?", ["6", "3", "1.5", "9"], "6",
            "Count 2 halves for every whole.", "6!", "3 × 2 = 6 halves, so 3 ÷ 0.5 = 6.")],
        [fill("x26d-q1", "6.3 ÷ 3 = ?", "2.1", ["2.1", "2.10"]),
         mc("x26d-q2", "4 ÷ 0.5 = ?", ["8", "2", "0.8", "20"], "8"),
         fill("x26d-q3", "0.9 ÷ 0.3 = ?", "3", ["3"])],
        prereqs=["g5-decimal-multiply", "g4-multi-div"], skills=["decimal-divide"], duration=10))
    return L


def main():
    data = json.loads(PACK.read_text())
    track = data["tracks"][TRACK]
    unit = next(u for u in track["units"] if u["id"] == UNIT)
    added = 0
    prev = AFTER
    for L in build():
        lid = L["id"]
        if lid not in track["lessons"]:
            track["lessons"][lid] = L
            added += 1
        if lid not in unit["lessons"]:
            unit["lessons"].insert(unit["lessons"].index(prev) + 1, lid)
        prev = lid
    for lid, L in track["lessons"].items():
        for p in L["prerequisites"]:
            assert p in track["lessons"], (lid, p)
    PACK.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    print(f"added {added}; {TRACK} now {len(track['lessons'])} lessons")
    print(f"{UNIT}: {unit['lessons']}")


if __name__ == "__main__":
    main()
