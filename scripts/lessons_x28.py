#!/usr/bin/env python3
"""X28 — Math ages 7–8: add & subtract within 1000, skip-count by 5/10/100 + expanded form,
even or odd (Common Core 2.NBT.2–3, 2.NBT.7, 2.OA.3), 3 lessons in existing units:
  1. Add & Subtract within 1000 — 3-digit +/− with regrouping — 2.NBT.7
       → unit-add-sub, after as-add-fluency
  2. Skip-Count & Expanded Form  — count by 5s/10s/100s; 3-digit expanded form — 2.NBT.2–3
       → unit-number-sense, after ns-round-hundreds
  3. Even or Odd?                — pairs & doubles, numbers up to 20 — 2.OA.3
       → unit-mult-div, first (ready for equal groups)
Idempotent: re-running is a no-op.
Run: python3 scripts/lessons_x28.py  (from repo root)"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lesson_helpers import mc, fill, lesson, panels, example  # noqa: E402

PACK = ROOT / "data" / "subjects" / "math.json"
TRACK = "ages-7-8"
# lesson id → (unit id, insert after lesson id or None = first in unit)
PLACE = {
    "as-add-sub-1000": ("unit-add-sub", "as-add-fluency"),
    "ns-skip-count-expanded": ("unit-number-sense", "ns-round-hundreds"),
    "md-even-odd": ("unit-mult-div", None),
}


def build():
    L = []
    L.append(lesson(
        "as-add-sub-1000", "unit-add-sub", "Add & Subtract within 1000",
        "Big numbers, same tricks! Line up hundreds, tens and ones — then regroup when a place gets too full or too empty.",
        panels(
            ("Add ones, then tens, then hundreds. 6 + 8 = 14 ones → write 4, carry 1 ten. 456 + 278 = 734!",
             "add-1000-regroup", "explain"),
            ("Not enough ones to take away? Trade 1 ten for 10 ones. Not enough tens? Trade 1 hundred for 10 tens. 532 − 187 = 345!",
             "sub-1000-borrow", "think"),
        ),
        example("Worked Example", "Solve 368 + 254.", [
            "Ones: 8 + 4 = 12 → write 2, carry 1 ten",
            "Tens: 6 + 5 + 1 = 12 → write 2, carry 1 hundred",
            "Hundreds: 3 + 2 + 1 = 6 → 368 + 254 = 622"]),
        [fill("x28a-p1", "243 + 125 = ?", "368", ["368"],
              "No regrouping needed — add each place.", "368!", "3 + 5 = 8 ones, 4 + 2 = 6 tens, 2 + 1 = 3 hundreds → 368."),
         mc("x28a-p2", "456 + 278 = ?", ["734", "624", "634", "724"], "734",
            "6 + 8 = 14 ones → carry 1 ten.", "734 — great regrouping!",
            "Ones 14 → write 4 carry 1; tens 5 + 7 + 1 = 13 → write 3 carry 1; hundreds 4 + 2 + 1 = 7 → 734."),
         fill("x28a-p3", "600 − 245 = ?", "355", ["355"],
              "No ones or tens in 600? Trade 1 hundred for 9 tens and 10 ones.", "355!",
              "600 = 5 hundreds + 9 tens + 10 ones. 10 − 5 = 5, 9 − 4 = 5, 5 − 2 = 3 → 355."),
         mc("x28a-p4", "532 − 187 = ?", ["345", "455", "355", "445"], "345",
            "2 ones − 7 ones? Trade a ten first.", "345!",
            "12 − 7 = 5 ones; 12 − 8 = 4 tens (after trading a hundred); 4 − 1 = 3 hundreds → 345."),
         fill("x28a-p5", "The library has 385 books. It gets 147 more. How many books now?", "532", ["532"],
              "Add: 385 + 147.", "532 books!", "385 + 147: 5 + 7 = 12, 8 + 4 + 1 = 13, 3 + 1 + 1 = 5 → 532."),
         mc("x28a-p6", "In 368 + 254, the ones make 8 + 4 = 12. What do you do?",
            ["write 2, carry 1 ten", "write 12 in the ones", "write 1, carry 2 tens"], "write 2, carry 1 ten",
            "12 ones = 1 ten and 2 ones.", "Yes — write 2, carry 1 ten!",
            "12 ones is 1 ten and 2 ones: write the 2, carry the ten.")],
        [fill("x28a-q1", "309 + 491 = ?", "800", ["800"]),
         fill("x28a-q2", "703 − 268 = ?", "435", ["435"]),
         mc("x28a-q3", "A rocket must fly 900 km. It has flown 450 km. How many km are left?",
            ["450", "550", "350", "1350"], "450")],
        prereqs=["as-add-fluency", "as-sub-regroup"], skills=["add-3digit", "sub-3digit"], duration=10))

    L.append(lesson(
        "ns-skip-count-expanded", "unit-number-sense", "Skip-Count & Expanded Form",
        "Hop like a kangaroo! Skip-count by 5s, 10s and 100s — then stretch a number out to see what each digit is worth.",
        panels(
            ("By 5s: 5, 10, 15, 20… By 10s: 340, 350, 360… By 100s: 200, 300, 400… Only one place changes when you hop by 10 or 100!",
             "skip-count-5-10-100", "explain"),
            ("Expanded form stretches a number: 482 = 400 + 80 + 2. Each digit shows its place value!",
             "expanded-482", "cheer"),
        ),
        example("Worked Example", "Write 607 in expanded form.", [
            "6 is in the hundreds place → 600",
            "0 tens → nothing to add for tens",
            "7 ones → 7, so 607 = 600 + 7"]),
        [fill("x28b-p1", "Skip-count by 5: 15, 20, 25, ? — what comes next?", "30", ["30"],
              "Add 5 each hop.", "30!", "25 + 5 = 30."),
         fill("x28b-p2", "Skip-count by 10: 340, 350, 360, ? — what comes next?", "370", ["370"],
              "Only the tens digit changes.", "370!", "360 + 10 = 370 — the tens go up by one."),
         mc("x28b-p3", "Skip-count by 100: 200, 300, 400, ? — what comes next?", ["500", "410", "401", "450"], "500",
            "Only the hundreds digit changes.", "500!", "400 + 100 = 500."),
         fill("x28b-p4", "Skip-count by 10: 970, 980, 990, ? — what comes next?", "1000", ["1000", "1,000"],
              "10 tens make a hundred…", "1000 — a thousand!", "990 + 10 = 1000."),
         mc("x28b-p5", "Which shows 482 in expanded form?",
            ["400 + 80 + 2", "4 + 8 + 2", "400 + 8 + 2", "40 + 80 + 2"], "400 + 80 + 2",
            "What is each digit worth?", "400 + 80 + 2!", "4 hundreds = 400, 8 tens = 80, 2 ones = 2."),
         fill("x28b-p6", "Write 600 + 7 as a number.", "607", ["607"],
              "There are 0 tens — keep a 0 in the tens place.", "607!", "6 hundreds, 0 tens, 7 ones → 607.")],
        [fill("x28b-q1", "Skip-count by 5: 85, 90, 95, ? — what comes next?", "100", ["100"]),
         fill("x28b-q2", "Write 300 + 50 + 9 as a number.", "359", ["359"]),
         mc("x28b-q3", "Which shows 705 in expanded form?", ["700 + 5", "700 + 50", "70 + 5", "7 + 0 + 5"], "700 + 5")],
        prereqs=["ns-place-value-basics"], skills=["skip-count-5-10-100", "expanded-form"], duration=9))

    L.append(lesson(
        "md-even-odd", "unit-mult-div", "Even or Odd?",
        "Can everyone get a partner? Pair things up — if nobody is left over, the number is EVEN. One left over? ODD!",
        panels(
            ("8 dots make 4 pairs with none left over → 8 is even. 7 dots make 3 pairs and 1 lonely dot → 7 is odd.",
             "even-pairs-8-7", "explain"),
            ("Even numbers are doubles: 6 = 3 + 3, 10 = 5 + 5. Odd numbers are a double plus one: 7 = 3 + 3 + 1.",
             "even-doubles", "think"),
        ),
        example("Worked Example", "Is 14 even or odd?", [
            "Pair up 14 things: 7 pairs",
            "Nobody is left over",
            "14 = 7 + 7, a double → 14 is even"]),
        [mc("x28c-p1", "Is 14 even or odd?", ["even", "odd"], "even",
            "Make pairs — is one left over?", "Even — 7 pairs!", "14 makes 7 pairs with none left over, so it is even."),
         mc("x28c-p2", "Is 9 even or odd?", ["even", "odd"], "odd",
            "Make pairs — is one left over?", "Odd!", "9 makes 4 pairs and 1 left over, so it is odd."),
         fill("x28c-p3", "Write 8 as a double: 8 = 4 + ?", "4", ["4"],
              "A double adds a number to itself.", "4 + 4 = 8!", "A double uses the same number twice: 8 = 4 + 4."),
         fill("x28c-p4", "18 = ? + ? (a double). What number goes in both boxes?", "9", ["9"],
              "What number plus itself makes 18?", "9 + 9 = 18!", "9 + 9 = 18, so 18 is even."),
         mc("x28c-p5", "Which number is odd?", ["15", "12", "20", "6"], "15",
            "Look at the ones digit: 1, 3, 5, 7 or 9 means odd.", "15 is odd!",
            "15 makes 7 pairs and 1 left over. 12, 20 and 6 all pair up evenly."),
         mc("x28c-p6", "Max has 13 socks. Can he put ALL of them into pairs?",
            ["no — one is left over", "yes — every sock gets a partner"], "no — one is left over",
            "Is 13 even or odd?", "Right — 13 is odd!", "13 = 6 + 6 + 1, so one sock has no partner.")],
        [mc("x28c-q1", "Is 20 even or odd?", ["even", "odd"], "even"),
         mc("x28c-q2", "Which number is even?", ["16", "11", "19", "7"], "16"),
         fill("x28c-q3", "12 = ? + ? (a double). What number goes in both boxes?", "6", ["6"])],
        prereqs=["as-add-within-100"], skills=["even-odd", "doubles"], duration=8))
    return L


def main():
    data = json.loads(PACK.read_text())
    track = data["tracks"][TRACK]
    added = 0
    for L in build():
        lid = L["id"]
        unit_id, after = PLACE[lid]
        assert L["unitId"] == unit_id
        unit = next(u for u in track["units"] if u["id"] == unit_id)
        if lid not in track["lessons"]:
            track["lessons"][lid] = L
            added += 1
        if lid not in unit["lessons"]:
            pos = 0 if after is None else unit["lessons"].index(after) + 1
            unit["lessons"].insert(pos, lid)
    for lid, L in track["lessons"].items():
        for p in L["prerequisites"]:
            assert p in track["lessons"], (lid, p)
    PACK.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    print(f"added {added}; {TRACK} now {len(track['lessons'])} lessons")
    for u in track["units"]:
        if u["id"] in {v[0] for v in PLACE.values()}:
            print(f"{u['id']}: {u['lessons']}")


if __name__ == "__main__":
    main()
