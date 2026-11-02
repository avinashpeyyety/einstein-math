#!/usr/bin/env python3
"""X10 cycle 1/2 — Math ages 11–12 (grades 6–7) track v1: new `ages-11-12` track with
  unit u6-ratios  (Ratio Rockets):  Ratios & Equivalent Ratios (6.RP.1, 6.RP.3a) → Rates & Unit Rates (6.RP.2, 6.RP.3b)
  unit u6-percents (Percent Power): Percent Means per 100 (6.RP.3c) → Percent of a Number (6.RP.3c)
plus a 6-question warm-up diagnostic. Cycle 2 adds negatives (6.NS.5–7) and one-step equations (6.EE.5–7).
Idempotent: re-running is a no-op.
Run: python3 scripts/lessons_x10.py  (from repo root)"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lesson_helpers import mc, fill, lesson, panels, example  # noqa: E402

PACK = ROOT / "data" / "subjects" / "math.json"
TRACK = "ages-11-12"

UNITS = [
    {"id": "u6-ratios", "title": "Ratio Rockets", "icon": "🚀", "color": "#FF6B35",
     "description": "Compare amounts with ratios, rates and unit rates!",
     "lessons": ["g6-ratios", "g6-unit-rates"]},
    {"id": "u6-percents", "title": "Percent Power", "icon": "💯", "color": "#4ECDC4",
     "description": "Percent means per 100 — find percents of anything!",
     "lessons": ["g6-percents", "g6-percent-of"]},
]

DIAG = {
    "id": "diag-ages-11-12", "title": "Nebula Warm-Up",
    "einsteinIntro": "Quick warm-up on ratios, rates and percents — let's see where your rocket starts!",
    "questions": [
        {"id": "d1112-1", "type": "mc", "prompt": "3 red and 5 blue marbles. Ratio of red to blue?",
         "choices": ["3:5", "5:3", "3:8", "8:3"], "answer": "3:5", "skill": "ratios", "unitHint": "u6-ratios"},
        {"id": "d1112-2", "type": "mc", "prompt": "2:3 = 6:?", "choices": ["9", "6", "7", "12"], "answer": "9",
         "skill": "equivalent-ratios", "unitHint": "u6-ratios"},
        {"id": "d1112-3", "type": "mc", "prompt": "4 pens cost $2. Cost of 1 pen?",
         "choices": ["$0.50", "$2", "$8", "$0.25"], "answer": "$0.50", "skill": "unit-rate", "unitHint": "u6-ratios"},
        {"id": "d1112-4", "type": "mc", "prompt": "1/2 as a percent?", "choices": ["50%", "12%", "20%", "2%"],
         "answer": "50%", "skill": "percent-meaning", "unitHint": "u6-percents"},
        {"id": "d1112-5", "type": "mc", "prompt": "0.3 = ?", "choices": ["30%", "3%", "0.3%", "300%"],
         "answer": "30%", "skill": "percent-decimal", "unitHint": "u6-percents"},
        {"id": "d1112-6", "type": "mc", "prompt": "10% of 50 = ?", "choices": ["5", "10", "50", "0.5"],
         "answer": "5", "skill": "percent-of", "unitHint": "u6-percents"},
    ],
}


def build():
    L = []
    L.append(lesson(
        "g6-ratios", "u6-ratios", "Ratios & Equivalent Ratios",
        "A ratio compares two amounts. 3 red for every 2 blue is written 3:2. Multiply both sides by the same number and the ratio stays the same!",
        panels(
            ("3 red stars for every 2 blue stars → red : blue = 3 : 2. Red : ALL stars = 3 : 5.", "ratio-tape", "explain"),
            ("A ratio table: 2:3 → 4:6 → 6:9. Multiply BOTH numbers by the same amount — the ratio doesn't change!", "ratio-table", "think"),
        ),
        example("Worked Example", "2 cups of flour for every 3 cups of milk. How much flour for 12 cups of milk?", [
            "Milk went from 3 to 12 → that's × 4",
            "Do the same to the flour: 2 × 4 = 8",
            "8 cups of flour (2:3 = 8:12)"]),
        [mc("x10a-p1", "A bag has 3 red marbles and 5 blue marbles. What is the ratio of red to blue?",
            ["3:5", "5:3", "3:8", "5:8"], "3:5", "Red comes first.", "3:5!",
            "Red to blue = 3 red : 5 blue = 3:5."),
         mc("x10a-p2", "Same bag (3 red, 5 blue). What is the ratio of red to ALL marbles?",
            ["3:8", "3:5", "5:8", "8:3"], "3:8", "All marbles = 3 + 5.", "3:8!",
            "There are 3 + 5 = 8 marbles, so red : all = 3:8."),
         fill("x10a-p3", "2:3 = 8:?", "12", ["12"], "2 became 8 — what did you multiply by?", "12!",
              "2 × 4 = 8, so 3 × 4 = 12."),
         mc("x10a-p4", "Which ratio is equivalent to 4:6?", ["2:3", "3:2", "4:9", "6:8"], "2:3",
            "Divide both numbers by the same number.", "2:3!", "4 ÷ 2 = 2 and 6 ÷ 2 = 3 → 2:3."),
         fill("x10a-p5", "A recipe uses 2 cups of flour for every 3 cups of milk. How many cups of flour go with 12 cups of milk?",
              "8", ["8"], "3 × ? = 12", "8 cups!", "3 × 4 = 12 cups of milk, so 2 × 4 = 8 cups of flour."),
         mc("x10a-p6", "What is 10:15 in simplest form?", ["2:3", "1:5", "5:10", "3:2"], "2:3",
            "Both numbers divide by 5.", "2:3!", "10 ÷ 5 = 2 and 15 ÷ 5 = 3 → 2:3.")],
        [fill("x10a-q1", "5:2 = ?:8", "20", ["20"]),
         mc("x10a-q2", "Boys to girls in a club is 4:5. There are 18 kids. How many boys?", ["8", "4", "10", "9"], "8"),
         mc("x10a-q3", "Which ratio is NOT equivalent to 3:4?", ["9:16", "6:8", "9:12", "15:20"], "9:16")],
        prereqs=[], skills=["ratios", "equivalent-ratios"], duration=9))

    L.append(lesson(
        "g6-unit-rates", "u6-ratios", "Rates & Unit Rates",
        "A rate compares two different kinds of things — miles and hours, dollars and pencils. A UNIT rate tells you how much for just ONE!",
        panels(
            ("120 miles in 3 hours → split into 3 equal parts: 40 miles in each hour. That's 40 miles per hour!", "unit-rate-bar", "explain"),
            ("6 stickers for $3 → $3 ÷ 6 = $0.50 for each sticker. Unit price helps you find the best deal!", "unit-price", "think"),
        ),
        example("Worked Example", "Which is the better deal: 4 juice boxes for $6.00 or 6 juice boxes for $8.40?", [
            "$6.00 ÷ 4 = $1.50 per box",
            "$8.40 ÷ 6 = $1.40 per box",
            "$1.40 < $1.50 → 6 for $8.40 is the better deal"]),
        [fill("x10b-p1", "A car goes 150 miles in 3 hours at a steady speed. How many miles per hour?", "50", ["50"],
              "Divide miles by hours.", "50 miles per hour!", "150 ÷ 3 = 50."),
         mc("x10b-p2", "5 pencils cost $2.50. How much does 1 pencil cost?", ["$0.50", "$0.25", "$2.00", "$5.00"], "$0.50",
            "Divide the cost by 5.", "$0.50!", "$2.50 ÷ 5 = $0.50."),
         fill("x10b-p3", "Maya reads 60 pages in 4 days at the same rate. How many pages per day?", "15", ["15"],
              "Pages ÷ days.", "15 pages a day!", "60 ÷ 4 = 15."),
         mc("x10b-p4", "Which is the better deal?", ["8 apples for $4", "5 apples for $3", "they cost the same"], "8 apples for $4",
            "Find the price of one apple each way.", "Right — $0.50 beats $0.60!",
            "$4 ÷ 8 = $0.50 per apple; $3 ÷ 5 = $0.60 per apple. 8 for $4 is cheaper per apple."),
         fill("x10b-p5", "A printer makes 12 pages per minute. How many pages in 7 minutes?", "84", ["84"],
              "Multiply the unit rate by the minutes.", "84 pages!", "12 × 7 = 84."),
         mc("x10b-p6", "A rocket burns 900 kg of fuel in 30 seconds. How much fuel per second?", ["30 kg", "27 kg", "300 kg", "3 kg"], "30 kg",
            "900 ÷ 30.", "30 kg each second!", "900 ÷ 30 = 30 kg per second.")],
        [fill("x10b-q1", "You earn $45 for 5 hours of work. How many dollars per hour?", "9", ["9", "$9", "9.00", "$9.00"]),
         mc("x10b-q2", "6 muffins cost $9. At the same price, how much do 10 muffins cost?", ["$15", "$12", "$18", "$13.50"], "$15"),
         fill("x10b-q3", "You run 2 miles in 16 minutes at a steady pace. How many minutes per mile?", "8", ["8"])],
        prereqs=["g6-ratios"], skills=["rates", "unit-rate"], duration=9))

    L.append(lesson(
        "g6-percents", "u6-percents", "Percent Means per 100",
        "Per-CENT means per HUNDRED. 35% is 35 out of 100. Fractions, decimals and percents are three ways to say the same amount!",
        panels(
            ("Shade 35 of the 100 squares → 35 out of 100 = 35% = 0.35.", "percent-grid", "explain"),
            ("1/2 = 0.5 = 50%. 1/4 = 0.25 = 25%. 3/4 = 0.75 = 75%. 1/10 = 0.1 = 10%. Same amount, three outfits!", "percent-fdp", "think"),
        ),
        example("Worked Example", "Write 3/5 as a percent.", [
            "Make the bottom 100: 5 × 20 = 100",
            "Do the same to the top: 3 × 20 = 60 → 60/100",
            "60/100 = 60%"]),
        [mc("x10c-p1", "37 out of 100 squares are shaded. What percent is shaded?", ["37%", "63%", "3.7%", "0.37%"], "37%",
            "Percent = out of 100.", "37%!", "37 out of 100 = 37%."),
         fill("x10c-p2", "Write 1/4 as a percent.", "25%", ["25%", "25"], "1/4 = ?/100", "25%!", "1/4 = 25/100 = 25%."),
         mc("x10c-p3", "0.6 = ?", ["60%", "6%", "0.6%", "600%"], "60%", "0.6 = 0.60 = 60 hundredths.", "60%!",
            "0.6 = 60/100 = 60%."),
         fill("x10c-p4", "Write 45% as a decimal.", "0.45", ["0.45", ".45"], "45% = 45 hundredths.", "0.45!",
              "45% = 45/100 = 0.45."),
         mc("x10c-p5", "Which is largest?", ["3/4", "70%", "0.7", "0.07"], "3/4", "Change them all to percents.", "3/4 = 75% wins!",
            "3/4 = 75%, 70% = 70%, 0.7 = 70%, 0.07 = 7% → 3/4 is largest."),
         fill("x10c-p6", "Write 7/20 as a percent.", "35%", ["35%", "35"], "20 × 5 = 100.", "35%!",
              "7/20 = 35/100 = 35%.")],
        [fill("x10c-q1", "Write 9/10 as a percent.", "90%", ["90%", "90"]),
         mc("x10c-q2", "50% is the same as…", ["1/2", "1/5", "1/50", "5"], "1/2"),
         mc("x10c-q3", "Which one is NOT equal to 20%?", ["2/100", "0.2", "1/5", "20/100"], "2/100")],
        prereqs=["g6-ratios"], skills=["percent-meaning", "percent-decimal"], duration=9))

    L.append(lesson(
        "g6-percent-of", "u6-percents", "Percent of a Number",
        "What's 30% of 70? Find 10% first (just divide by 10), then build any percent you need!",
        panels(
            ("A tape of 80 split into 4 equal parts: each part is 25% = 20.", "percent-tape", "explain"),
            ("10% of 70 = 7. So 30% = 3 × 7 = 21, and 50% = half = 35!", "percent-tenths", "think"),
        ),
        example("Worked Example", "Find 30% of 70.", [
            "10% of 70 = 70 ÷ 10 = 7",
            "30% = 3 × 10% = 3 × 7",
            "30% of 70 = 21"]),
        [fill("x10d-p1", "10% of 80 = ?", "8", ["8"], "Divide by 10.", "8!", "80 ÷ 10 = 8."),
         mc("x10d-p2", "50% of 46 = ?", ["23", "46", "92", "4.6"], "23", "50% is half.", "23!", "Half of 46 is 23."),
         fill("x10d-p3", "25% of 60 = ?", "15", ["15"], "25% is one quarter.", "15!", "60 ÷ 4 = 15."),
         mc("x10d-p4", "A $40 game is 20% off. How much money do you save?", ["$8", "$20", "$4", "$32"], "$8",
            "10% of 40 is 4.", "You save $8!", "10% of $40 = $4, so 20% = $8."),
         fill("x10d-p5", "30% of 90 = ?", "27", ["27"], "10% of 90 first.", "27!", "10% of 90 = 9, and 3 × 9 = 27."),
         mc("x10d-p6", "12 is 50% of what number?", ["24", "6", "12", "60"], "24", "12 is HALF of the number.", "24!",
            "If half is 12, the whole is 12 × 2 = 24.")],
        [fill("x10d-q1", "75% of 40 = ?", "30", ["30"]),
         mc("x10d-q2", "A $50 shirt is 10% off. What is the sale price?", ["$45", "$5", "$40", "$55"], "$45"),
         fill("x10d-q3", "5 is 25% of what number?", "20", ["20"])],
        prereqs=["g6-percents"], skills=["percent-of", "percent-whole"], duration=10))
    return L


def main():
    data = json.loads(PACK.read_text())
    tracks = data["tracks"]
    if TRACK not in tracks:
        tracks[TRACK] = {
            "id": TRACK, "label": "Ages 11–12", "ageRange": "11–12", "gradeBand": "Grades 6–7",
            "blurb": "Ratios & rates, percents, negative numbers and one-step equations — new track, growing!",
            "units": [], "diagnostic": DIAG, "lessons": {},
        }
    track = tracks[TRACK]
    for U in UNITS:
        if not any(u["id"] == U["id"] for u in track["units"]):
            track["units"].append(json.loads(json.dumps(U)))
    added = 0
    for L in build():
        if L["id"] not in track["lessons"]:
            track["lessons"][L["id"]] = L
            added += 1
    for lid, L in track["lessons"].items():
        for p in L["prerequisites"]:
            assert p in track["lessons"], (lid, p)
    data["meta"]["gradeBand"] = "Ages 5–12 (K–7)"
    data["meta"]["audienceAge"] = "5–12"
    PACK.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    print(f"added {added}; {TRACK} now {len(track['lessons'])} lessons; units {[u['id'] for u in track['units']]}")


if __name__ == "__main__":
    main()
