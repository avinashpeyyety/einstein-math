#!/usr/bin/env python3
"""X23 — Math ages 5–6: Tens & Ones (Common Core 1.NBT.2–5), 3 lessons in a new unit k-tens-ones:
  1. Compare with <, >, =   (tens & ones place value, then compare tens first)          — 1.NBT.2, 1.NBT.3
  2. 10 More, 10 Less       (only the tens digit changes; mentally, within 100)          — 1.NBT.5
  3. Add Tens & Ones        (2-digit + 1-digit; checks never regroup, one guided
                             "make a new ten" stretch item in practice + panel)          — 1.NBT.4
Prereqs chain 1 → 2 → 3 (lesson 1 also needs count-by-tens + compare teens; lesson 3 also needs add within 20).
The unit sits right after k-add-sub on the Mission Map. Idempotent: re-running is a no-op.
Run: python3 scripts/lessons_x23.py  (from repo root)"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lesson_helpers import mc, fill, lesson, panels, example  # noqa: E402

PACK = ROOT / "data" / "subjects" / "math.json"
TRACK = "ages-5-6"
UNIT = {
    "id": "k-tens-ones",
    "title": "Tens & Ones",
    "icon": "🧱",
    "color": "#F59E0B",
    "description": "Build numbers with tens and ones — compare them, jump by 10, and add!",
    "lessons": [],
}
AFTER_UNIT = "k-add-sub"
SIGNS = ["<", ">", "="]


def build():
    L = []
    L.append(lesson(
        "k-compare-2digit", UNIT["id"], "Compare with <, >, =",
        "Big numbers are made of TENS and ONES. Let's find out which number is bigger — the alligator always eats the bigger one!",
        panels(("34 is 3 TENS and 4 ONES. Three sticks of ten, four little cubes!", "tens-ones-34", "explain"),
               ("To compare, look at the TENS first. 52 has 5 tens, 25 has only 2 — so 52 > 25. Same tens? Then check the ones!", "compare-alligator", "cheer")),
        example("Worked Example", "Compare 47 and 43.", [
            "Tens: 4 and 4 — the same!",
            "Ones: 7 and 3 — 7 is more",
            "So 47 > 43 (the mouth opens to 47)"]),
        [mc("x23a-p1", "How many tens are in 34?", ["3", "4", "34", "7"], "3",
            "The first digit tells the tens.", "Yes — 3 tens (30)!", "34 = 3 tens and 4 ones."),
         fill("x23a-p2", "6 tens and 2 ones = ?", "62", ["62"],
              "60 and 2 more.", "62!", "6 tens = 60, plus 2 ones = 62."),
         mc("x23a-p3", "Which is bigger: 52 or 25?", ["52", "25", "They are equal"], "52",
            "Compare the tens: 5 tens or 2 tens?", "Yes — 52 > 25!", "52 has 5 tens; 25 has only 2."),
         mc("x23a-p4", "47 ? 43 — pick the sign.", SIGNS, ">",
            "Same tens — look at the ones.", "47 > 43 — 7 ones beat 3!", "Tens tie, 7 > 3, so 47 > 43."),
         mc("x23a-p5", "29 ? 31 — pick the sign.", SIGNS, "<",
            "Tens first: 2 tens or 3 tens?", "29 < 31!", "2 tens < 3 tens, so 29 < 31."),
         mc("x23a-p6", "5 tens and 0 ones ? 50 — pick the sign.", SIGNS, "=",
            "5 tens is 50.", "Equal — 50 = 50!", "5 tens and 0 ones is exactly 50.")],
        [mc("x23a-q1", "68 ? 86 — pick the sign.", SIGNS, "<"),
         fill("x23a-q2", "How many ones are in 75?", "5", ["5"]),
         mc("x23a-q3", "4 tens and 0 ones ? 40 — pick the sign.", SIGNS, "=")],
        prereqs=["k-count-to-100-tens", "k-compare-teens"], skills=["place-value-tens-ones", "compare-2-digit"]))

    L.append(lesson(
        "k-ten-more-less", UNIT["id"], "10 More, 10 Less",
        "Jump by TENS like a rocket! Add a ten or take a ten away — watch which digit changes.",
        panels(("10 more = one more TEN. 34 → 44. The ones stay the same!", "ten-more-34", "explain"),
               ("10 less = take one TEN away. 34 → 24. Only the tens digit moves!", "ten-less-34", "think")),
        example("Worked Example", "What is 10 more than 57?", [
            "57 = 5 tens and 7 ones",
            "Add one ten: 6 tens and 7 ones",
            "10 more than 57 is 67"]),
        [mc("x23b-p1", "10 more than 23 = ?", ["24", "33", "13", "123"], "33",
            "Add one ten: 2 tens → 3 tens.", "33!", "23 + 10 = 33 — only the tens changed."),
         fill("x23b-p2", "10 less than 48 = ?", "38", ["38"],
              "Take one ten away: 4 tens → 3 tens.", "38!", "48 − 10 = 38."),
         mc("x23b-p3", "10 more than 60 = ?", ["61", "70", "50", "600"], "70",
            "6 tens → 7 tens.", "70!", "60 + 10 = 70."),
         fill("x23b-p4", "45 + 10 = ?", "55", ["55"],
              "Tens go up by one, ones stay 5.", "55!", "45 + 10 = 55."),
         mc("x23b-p5", "72 − 10 = ?", ["62", "71", "82", "70"], "62",
            "Tens go down by one, ones stay 2.", "62!", "72 − 10 = 62."),
         mc("x23b-p6", "10 less than 19 = ?", ["9", "18", "29", "10"], "9",
            "19 is 1 ten and 9 ones. Take the ten away!", "9!", "19 − 10 = 9.")],
        [fill("x23b-q1", "10 more than 86 = ?", "96", ["96"]),
         mc("x23b-q2", "10 less than 50 = ?", ["40", "49", "60", "5"], "40"),
         fill("x23b-q3", "34 − 10 = ?", "24", ["24"])],
        prereqs=["k-compare-2digit"], skills=["ten-more-ten-less"]))

    L.append(lesson(
        "k-add-2digit-1digit", UNIT["id"], "Add Tens & Ones",
        "Let's add a small number to a big one. Ones join the ones — the tens wait patiently!",
        panels(("23 + 4: add ones to ones! 3 + 4 = 7, so 23 + 4 = 27. The 2 tens stay put.", "add-ones-23-4", "explain"),
               ("Stretch! 28 + 5: the ones make a NEW ten. 28 + 2 = 30, then 3 more = 33!", "make-new-ten", "cheer")),
        example("Worked Example", "What is 42 + 5?", [
            "42 = 4 tens and 2 ones",
            "Add the ones: 2 + 5 = 7",
            "4 tens and 7 ones = 47"]),
        [fill("x23c-p1", "31 + 6 = ?", "37", ["37"],
              "Add the ones: 1 + 6.", "37!", "1 + 6 = 7 ones, 3 tens stay: 37."),
         mc("x23c-p2", "54 + 3 = ?", ["57", "84", "51", "27"], "57",
            "4 ones + 3 ones.", "57!", "4 + 3 = 7, so 54 + 3 = 57."),
         mc("x23c-p3", "In 62 + 5, what do we add first?", ["The ones: 2 + 5", "The tens: 6 + 5", "6 + 2"], "The ones: 2 + 5",
            "The 5 is ones — add it to the ones.", "Yes — ones with ones!", "5 is a ones number, so add it to the 2 ones."),
         fill("x23c-p4", "4 + 73 = ?", "77", ["77"],
              "Turn it around: 73 + 4.", "77!", "3 + 4 = 7 ones, so 77."),
         mc("x23c-p5", "Stretch! 28 + 5 = ?", ["33", "23", "78", "313"], "33",
            "Make a new ten: 28 + 2 = 30, then 3 more.", "33 — you made a new ten!", "28 + 2 = 30, 30 + 3 = 33.")],
        [fill("x23c-q1", "43 + 5 = ?", "48", ["48"]),
         mc("x23c-q2", "21 + 7 = ?", ["28", "91", "27", "38"], "28"),
         fill("x23c-q3", "6 + 52 = ?", "58", ["58"])],
        prereqs=["k-ten-more-less", "k-add-within-20"], skills=["add-2-digit-1-digit"]))
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


if __name__ == "__main__":
    main()
