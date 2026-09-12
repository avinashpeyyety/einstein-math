from lesson_helpers import mc, fill, lesson, panels, example

def build():
    L = []
    L.append(lesson(
        "ns-estimate-sums", "unit-number-sense", "Estimate Sums",
        "Round first, then add — estimation is a cosmic shortcut!",
        panels(("To estimate 48+31, round to 50+30=80 — close enough for a quick check!", "estimate", "explain"),
               ("Estimation asks 'about how many?' not the exact answer.", "about-how-many", "cheer")),
        example("Worked Example", "Estimate 47 + 22.", ["47≈50", "22≈20", "50+20=70", "About 70"]),
        [mc("est-p1", "47 rounded to nearest 10?", ["40","47","50","70"], "50", "5+ up", "50!", "47→50."),
         fill("est-p2", "Estimate 29+41 (nearest 10s sum)", "70", ["70"], "30+40", "70!", "30+40=70."),
         mc("est-p3", "Best estimate for 18+23?", ["20","40","50","100"], "40", "20+20", "About 40!", "18≈20, 23≈20."),
         mc("est-p4", "Estimation is useful to…", ["check reasonableness","replace all math","ignore place value","skip school"], "check reasonableness", "Sanity check!", "Yes!", "Estimate to check.")],
        [mc("est-q1", "Estimate 52+19 ≈ ?", ["50","70","90","20"], "70"),
         fill("est-q2", "Round 64 to nearest 10", "60", ["60"])],
        prereqs=["ns-rounding-intro"], skills=["estimation"]))

    L.append(lesson(
        "ns-round-hundreds", "unit-number-sense", "Round to Hundreds",
        "Bigger place, bigger round! Look at tens to round to the nearest hundred.",
        panels(("To round to hundreds, peek at the tens digit. 5 or more → up!", "round-100", "explain"),
               ("350→400, 340→300. The tens digit decides!", "round-examples", "cheer")),
        example("Worked Example", "Round 368 to nearest hundred.", ["Look at tens digit: 6", "6 ≥ 5 → round up", "368 ≈ 400"]),
        [mc("rh-p1", "Round 240 to nearest 100", ["200","240","300","250"], "200", "Tens=4 <5", "200!", "240→200."),
         fill("rh-p2", "Round 570 to nearest 100", "600", ["600"], "7≥5", "600!", "570→600."),
         mc("rh-p3", "Round 350 to nearest 100", ["300","350","400","500"], "400", "5 rounds up", "400!", "350→400."),
         mc("rh-p4", "Which digit decides rounding to hundreds?", ["ones","tens","hundreds","thousands"], "tens", "Next place!", "Tens!", "Look at tens.")],
        [mc("rh-q1", "Round 820 to nearest 100", ["800","820","900","100"], "800"),
         fill("rh-q2", "Round 651 to nearest 100", "700", ["700"])],
        prereqs=["ns-rounding-intro"], skills=["rounding-hundreds"]))

    L.append(lesson(
        "as-add-regroup", "unit-add-sub", "Add with Regrouping",
        "When ones make 10 or more, trade for a ten — regrouping power!",
        panels(("27+18: ones 7+8=15 → write 5, carry 1 ten!", "regroup-add", "explain"),
               ("Regrouping keeps place value honest across columns.", "carry", "cheer")),
        example("Worked Example", "35 + 47", ["Ones: 5+7=12 → write 2, carry 1", "Tens: 3+4+1=8", "82"]),
        [mc("ar-p1", "Ones 6+7=13. Write ? carry ?", ["3 carry 1","13 carry 0","6 carry 7","1 carry 3"], "3 carry 1", "Regroup!", "3, carry 1!", "13=1 ten + 3."),
         fill("ar-p2", "28 + 15 = ?", "43", ["43"], "Regroup ones", "43!", "28+15=43."),
         mc("ar-p3", "49 + 26 = ?", ["65","75","615","15"], "75", "9+6=15", "75!", "49+26=75."),
         mc("ar-p4", "When do we regroup ones?", ["sum ≥10","sum <5","always","never"], "sum ≥10", "Ten or more!", "≥10!", "Trade for a ten.")],
        [mc("ar-q1", "17 + 25 = ?", ["32","42","312","15"], "42"),
         fill("ar-q2", "38 + 27 = ?", "65", ["65"])],
        prereqs=["as-add-within-100"], skills=["add-regroup"]))

    L.append(lesson(
        "as-sub-regroup", "unit-add-sub", "Subtract with Regrouping",
        "Not enough ones? Borrow a ten — regrouping for subtraction!",
        panels(("52−18: can't do 2−8, so borrow → 12−8=4, tens 4−1=3 → 34!", "regroup-sub", "explain"),
               ("Borrowing is just regrouping a ten into 10 ones.", "borrow", "cheer")),
        example("Worked Example", "41 − 17", ["Ones: 1<7 → borrow", "11−7=4", "Tens: 3−1=2", "24"]),
        [mc("sr-p1", "In 30−8, ones need a…", ["borrow","multiply","decimal","ignore"], "borrow", "0<8", "Borrow!", "Regroup a ten."),
         fill("sr-p2", "40 − 16 = ?", "24", ["24"], "Borrow", "24!", "40−16=24."),
         mc("sr-p3", "63 − 29 = ?", ["34","44","54","14"], "34", "13−9; 5−2", "34!", "63−29=34."),
         mc("sr-p4", "52−18 ones step after borrow?", ["12−8","2−8","5−1","52−8"], "12−8", "10+2", "12−8!", "Borrowed ones.")],
        [mc("sr-q1", "50 − 17 = ?", ["33","43","67","37"], "33"),
         fill("sr-q2", "71 − 35 = ?", "36", ["36"])],
        prereqs=["as-sub-within-100"], skills=["sub-regroup"]))

    L.append(lesson(
        "md-facts-2-5-10", "unit-mult-div", "Facts: 2s, 5s, 10s",
        "Skip-count to learn multiplication facts for 2, 5, and 10!",
        panels(("5×4 means 4 jumps of 5: 5,10,15,20!", "skip-mult", "explain"),
               ("×10 just tacks on a zero: 7×10=70. Cosmic cheat code!", "times-10", "cheer")),
        example("Worked Example", "6 × 5 = ?", ["Skip count by 5 six times", "5,10,15,20,25,30", "30"]),
        [mc("mf-p1", "4 × 2 = ?", ["6","8","42","2"], "8", "2+2+2+2", "8!", "4×2=8."),
         fill("mf-p2", "3 × 10 = ?", "30", ["30"], "×10", "30!", "3×10=30."),
         mc("mf-p3", "7 × 5 = ?", ["12","30","35","75"], "35", "Skip 5s", "35!", "7×5=35."),
         mc("mf-p4", "5 × 10 = ?", ["15","50","510","5"], "50", "×10", "50!", "5×10=50.")],
        [mc("mf-q1", "6 × 2 = ?", ["8","12","62","10"], "12"),
         fill("mf-q2", "4 × 5 = ?", "20", ["20"])],
        prereqs=["md-equal-groups"], skills=["mult-facts-2-5-10"]))

    L.append(lesson(
        "md-quotative", "unit-mult-div", "Division: How Many Groups?",
        "Quotative division asks: how many groups of size n fit inside a total?",
        panels(("12 ÷ 3 as 'how many groups of 3 in 12?' → 4 groups!", "quotative", "explain"),
               ("Sharing (partitive) vs grouping (quotative) — both are division!", "div-types", "cheer")),
        example("Worked Example", "20 ÷ 5 = ? (groups of 5)", ["How many 5s in 20?", "5,10,15,20 → 4 jumps", "4 groups"]),
        [mc("qt-p1", "How many groups of 2 in 10?", ["2","5","8","12"], "5", "10÷2", "5!", "10÷2=5."),
         fill("qt-p2", "15 ÷ 5 = ?", "3", ["3"], "Groups of 5", "3!", "15÷5=3."),
         mc("qt-p3", "18 ÷ 3 = ?", ["6","9","15","21"], "6", "Groups of 3", "6!", "18÷3=6."),
         mc("qt-p4", "'How many teams of 4 from 12 kids?' is…", ["addition","quotative division","rounding","area"], "quotative division", "Grouping!", "Quotative!", "How many groups.")],
        [mc("qt-q1", "Groups of 4 in 16?", ["2","4","8","12"], "4"),
         fill("qt-q2", "24 ÷ 6 = ?", "4", ["4"])],
        prereqs=["md-arrays-div"], skills=["division-quotative"]))

    L.append(lesson(
        "fr-set-of", "unit-fractions", "Fraction of a Set",
        "Find 1/2 of 8, 1/4 of 12 — split the set into equal shares!",
        panels(("1/3 of a set means split into 3 equal groups, take one group!", "frac-set", "explain"),
               ("1/4 of 12: 12÷4=3, so 1/4 of 12 is 3.", "frac-set-ex", "cheer")),
        example("Worked Example", "What is 1/2 of 10?", ["Split 10 into 2 equal groups", "10÷2=5", "1/2 of 10 = 5"]),
        [mc("fs-p1", "1/2 of 8 = ?", ["2","4","6","16"], "4", "8÷2", "4!", "Half of 8 is 4."),
         fill("fs-p2", "1/4 of 12 = ?", "3", ["3"], "12÷4", "3!", "1/4 of 12=3."),
         mc("fs-p3", "1/3 of 9 = ?", ["3","6","9","12"], "3", "9÷3", "3!", "1/3 of 9=3."),
         mc("fs-p4", "To find 1/5 of a set…", ["divide by 5","multiply by 5","add 5","round"], "divide by 5", "Equal shares", "÷5!", "Split into 5.")],
        [mc("fs-q1", "1/2 of 14 = ?", ["5","7","14","28"], "7"),
         fill("fs-q2", "1/4 of 20 = ?", "5", ["5"])],
        prereqs=["fr-thirds-set"], skills=["fraction-of-set"]))

    L.append(lesson(
        "fr-unit-fractions", "unit-fractions", "Unit Fractions",
        "Unit fractions have 1 on top: 1/2, 1/3, 1/4 — one equal piece!",
        panels(("A unit fraction names one piece of a whole split equally.", "unit-frac", "explain"),
               ("1/4 is smaller than 1/2 because pieces are tinier when more splits!", "frac-size", "cheer")),
        example("Worked Example", "Which is larger: 1/3 or 1/6?", ["Same whole", "More pieces → smaller each piece", "1/3 > 1/6"]),
        [mc("uf-p1", "Which is a unit fraction?", ["2/3","1/4","3/4","2/2"], "1/4", "Numerator 1", "1/4!", "Unit = 1 on top."),
         fill("uf-p2", "Numerator of 1/8?", "1", ["1"], "Top number", "1!", "Unit fraction."),
         mc("uf-p3", "Larger piece: 1/2 or 1/8?", ["1/2","1/8","same","neither"], "1/2", "Fewer splits", "1/2!", "Bigger pieces."),
         mc("uf-p4", "1/5 means…", ["1 of 5 equal parts","5 wholes","1+5","skip"], "1 of 5 equal parts", "Unit!", "Yes!", "One fifth.")],
        [mc("uf-q1", "Smaller: 1/3 or 1/10?", ["1/3","1/10","same","1"], "1/10"),
         fill("uf-q2", "Denominator of 1/6?", "6", ["6"])],
        prereqs=["fr-halves-fourths"], skills=["unit-fractions"]))

    L.append(lesson(
        "ms-perimeter", "unit-measurement", "Perimeter Paths",
        "Perimeter is the fence around a shape — add all the side lengths!",
        panels(("Walk the outline: side+side+side+side = perimeter!", "perimeter", "explain"),
               ("Rectangle 3 by 5: 3+5+3+5=16 units around.", "rect-perim", "cheer")),
        example("Worked Example", "Square side 4. Perimeter?", ["4 sides equal", "4+4+4+4", "16", "Or 4×4=16"]),
        [mc("per-p1", "Perimeter means…", ["inside area","distance around","volume","weight"], "distance around", "Fence!", "Around!", "Outline length."),
         fill("per-p2", "Triangle sides 3,4,5. Perimeter?", "12", ["12"], "Add sides", "12!", "3+4+5=12."),
         mc("per-p3", "Rectangle 2 by 6. Perimeter?", ["8","12","16","24"], "16", "2+6+2+6", "16!", "16 units."),
         mc("per-p4", "Square side 5. Perimeter?", ["10","15","20","25"], "20", "4×5", "20!", "4×5=20.")],
        [mc("per-q1", "Sides 2,2,2,2. Perimeter?", ["4","6","8","16"], "8"),
         fill("per-q2", "Rectangle 3×7 perimeter?", "20", ["20"])],
        prereqs=["ms-length-inch-cm"], skills=["perimeter"]))

    L.append(lesson(
        "ms-elapsed-time", "unit-measurement", "Elapsed Time",
        "How much time passed? From start to end — elapsed time mission!",
        panels(("From 2:00 to 2:30 is 30 minutes elapsed.", "elapsed", "explain"),
               ("Count forward on the clock from start until end!", "clock-count", "cheer")),
        example("Worked Example", "Start 1:00, end 1:20. Elapsed?", ["Count minutes from 1:00", "20 minutes later", "20 minutes"]),
        [mc("el-p1", "3:00 to 3:15 elapsed?", ["15 min","30 min","45 min","3 hrs"], "15 min", "Count", "15!", "15 minutes."),
         fill("el-p2", "4:00 to 5:00 = ? hours", "1", ["1"], "One hour", "1!", "1 hour."),
         mc("el-p3", "2:10 to 2:40 = ?", ["20 min","30 min","40 min","50 min"], "30 min", "40−10", "30!", "30 minutes."),
         mc("el-p4", "Elapsed time is…", ["how long something took","clock brand","time zone","birthday"], "how long something took", "Duration!", "Yes!", "Time that passed.")],
        [mc("el-q1", "1:00 to 1:45 = ?", ["15 min","30 min","45 min","60 min"], "45 min"),
         fill("el-q2", "6:00 to 8:00 = ? hours", "2", ["2"])],
        prereqs=["ms-time-5min"], skills=["elapsed-time"]))

    L.append(lesson(
        "ms-bar-graph", "unit-measurement", "Read Bar Graphs",
        "Bars show amounts! Read the scale and compare heights — data hero!",
        panels(("A bar graph uses bar height to show quantity.", "bar-graph", "explain"),
               ("Taller bar = more. Check the axis numbers carefully!", "bar-read", "cheer")),
        example("Worked Example", "Bar for cats at 4, dogs at 6. How many more dogs?", ["Dogs 6, cats 4", "6−4=2", "2 more dogs"]),
        [mc("bg-p1", "Taller bar means…", ["less","more","same","broken"], "more", "Height!", "More!", "Taller = more."),
         fill("bg-p2", "Bar at 5 means quantity?", "5", ["5"], "Read scale", "5!", "Height 5."),
         mc("bg-p3", "Cats 3, birds 7. How many more birds?", ["3","4","7","10"], "4", "7−3", "4!", "7−3=4."),
         mc("bg-p4", "Bar graphs help us…", ["compare amounts","bake cakes","tell time only","draw circles only"], "compare amounts", "Data!", "Compare!", "Visual data.")],
        [mc("bg-q1", "Bars 2 and 8. Difference?", ["4","6","10","16"], "6"),
         fill("bg-q2", "If bar shows 9, value is?", "9", ["9"])],
        prereqs=[], skills=["bar-graphs"]))

    L.append(lesson(
        "wp-multi-step", "unit-word-problems", "Multi-Step Word Problems",
        "Some stories need two moves — add then subtract, or multiply then add!",
        panels(("Underline the question. Do step 1, then step 2. Check!", "multi-step", "explain"),
               ("Had 10, found 4, gave away 3: 10+4=14, 14−3=11.", "two-step-ex", "cheer")),
        example("Worked Example", "Lia had 15. Bought 6 more. Gave 4 away. Now?", ["15+6=21", "21−4=17", "17 left"]),
        [mc("msw-p1", "20+5−8 = ?", ["17","25","13","33"], "17", "Two steps", "17!", "25−8=17."),
         fill("msw-p2", "Had 12, got 3, lost 2. Now?", "13", ["13"], "12+3−2", "13!", "13."),
         mc("msw-p3", "First step for 'had 9, bought 4, spent 2'?", ["9+4","9−2","4−2","ignore 9"], "9+4", "Order!", "Add first!", "Then subtract."),
         mc("msw-p4", "3 packs of 4, then +2 extras. Total?", ["12","14","10","6"], "14", "3×4+2", "14!", "12+2=14.")],
        [mc("msw-q1", "10+7−5 = ?", ["12","15","2","22"], "12"),
         fill("msw-q2", "8×2 then −3 = ?", "13", ["13"])],
        prereqs=["wp-add-sub-2step"], skills=["multi-step-wp"]))

    L.append(lesson(
        "wp-money-stories", "unit-word-problems", "Money Story Problems",
        "Buy, save, make change — money word problems with cents!",
        panels(("Cost and pay → change is subtract. Two items → add costs first!", "money-wp", "explain"),
               ("Snack 40¢ + juice 25¢ = 65¢. Pay 100¢ → change 35¢.", "money-ex", "cheer")),
        example("Worked Example", "Toy 55¢, pay 75¢. Change?", ["Change = pay − cost", "75−55=20", "20¢"]),
        [mc("mny-p1", "30¢ item, pay 50¢. Change?", ["20¢","30¢","50¢","80¢"], "20¢", "50−30", "20¢!", "20¢ change."),
         fill("mny-p2", "15¢ + 25¢ = ? cents", "40", ["40","40¢"], "Add", "40¢!", "15+25=40."),
         mc("mny-p3", "Two items 20¢ and 35¢. Total?", ["15¢","55¢","2035¢","5¢"], "55¢", "Add", "55¢!", "20+35=55."),
         mc("mny-p4", "Had 90¢, spent 40¢. Left?", ["50¢","130¢","40¢","90¢"], "50¢", "Subtract", "50¢!", "90−40=50.")],
        [mc("mny-q1", "45¢, pay 100¢. Change?", ["45¢","55¢","100¢","145¢"], "55¢"),
         fill("mny-q2", "10¢ + 10¢ + 5¢ = ?", "25", ["25","25¢"])],
        prereqs=["ms-money-change","wp-add-sub-1step"], skills=["money-wp"]))

    L.append(lesson(
        "md-multiply-stories", "unit-mult-div", "Equal-Groups Stories",
        "Word problems with equal groups → multiply to find the total!",
        panels(("'4 bags with 6 apples each' → 4×6=24 apples!", "eq-groups-wp", "explain"),
               ("Each, every, groups of — multiplication clues!", "mult-clues", "cheer")),
        example("Worked Example", "5 boxes of 3 crayons. Total?", ["5 groups of 3", "5×3=15", "15 crayons"]),
        [mc("eg-p1", "3 shelves, 5 books each. Total?", ["8","15","35","2"], "15", "3×5", "15!", "3×5=15."),
         fill("eg-p2", "4 × 6 = ?", "24", ["24"], "Equal groups", "24!", "4×6=24."),
         mc("eg-p3", "2 rows of 9. Total?", ["11","18","29","7"], "18", "2×9", "18!", "2×9=18."),
         mc("eg-p4", "'7 packs of 2' operation?", ["7+2","7×2","7−2","7÷2"], "7×2", "Equal groups", "Multiply!", "7×2.")],
        [mc("eg-q1", "6 bags of 4. Total?", ["10","24","2","64"], "24"),
         fill("eg-q2", "5 × 5 = ?", "25", ["25"])],
        prereqs=["md-equal-groups","wp-equal-groups"], skills=["mult-wp"]))

    L.append(lesson(
        "as-add-fluency", "unit-add-sub", "Addition Fluency within 100",
        "Practice speedy adds — with and without regrouping — until it feels automatic!",
        panels(("Warm up with friendly numbers, then mix in regrouping challenges!", "fluency-add", "explain"),
               ("Check with estimation: 47+36 should be about 80.", "fluency-check", "cheer")),
        example("Worked Example", "58 + 27", ["Ones 8+7=15 → write 5 carry 1", "Tens 5+2+1=8", "85"]),
        [mc("af-p1", "34 + 21 = ?", ["55","53","45","15"], "55", "No regroup", "55!", "34+21=55."),
         fill("af-p2", "46 + 39 = ?", "85", ["85"], "Regroup", "85!", "46+39=85."),
         mc("af-p3", "70 + 18 = ?", ["78","88","98","68"], "88", "Easy tens", "88!", "70+18=88."),
         mc("af-p4", "Estimate 49+33 first ≈ ?", ["50","80","90","20"], "80", "50+30", "≈80!", "Good check.")],
        [mc("af-q1", "25 + 48 = ?", ["63","73","83","13"], "73"),
         fill("af-q2", "62 + 19 = ?", "81", ["81"])],
        prereqs=["as-add-regroup"], skills=["add-fluency"]))

    return L

NEW_UNITS = []

DIAG = [
  {"id":"d78-1","type":"mc","prompt":"In 582, which digit is in the tens place?","choices":["5","8","2","0"],"answer":"8","skill":"place-value","unitHint":"unit-number-sense"},
  {"id":"d78-2","type":"mc","prompt":"37 + 25 = ?","choices":["52","62","512","12"],"answer":"62","skill":"add-within-100","unitHint":"unit-add-sub"},
  {"id":"d78-3","type":"mc","prompt":"3 groups of 4 = ?","choices":["7","12","34","1"],"answer":"12","skill":"equal-groups","unitHint":"unit-mult-div"},
  {"id":"d78-4","type":"mc","prompt":"1/4 of 12 = ?","choices":["2","3","4","8"],"answer":"3","skill":"fraction-of-set","unitHint":"unit-fractions"},
  {"id":"d78-5","type":"mc","prompt":"Round 47 to nearest 10.","choices":["40","45","50","70"],"answer":"50","skill":"rounding-tens","unitHint":"unit-number-sense"},
  {"id":"d78-6","type":"mc","prompt":"Rectangle 3×5. Perimeter?","choices":["8","15","16","30"],"answer":"16","skill":"perimeter","unitHint":"unit-measurement"},
  {"id":"d78-7","type":"mc","prompt":"Cost 30¢, pay 50¢. Change?","choices":["20¢","30¢","50¢","80¢"],"answer":"20¢","skill":"money-change","unitHint":"unit-measurement"},
  {"id":"d78-8","type":"mc","prompt":"How many groups of 3 in 12?","choices":["3","4","9","15"],"answer":"4","skill":"division-quotative","unitHint":"unit-mult-div"},
  {"id":"d78-9","type":"mc","prompt":"From 2:00 to 2:30 elapsed?","choices":["10 min","20 min","30 min","2 hrs"],"answer":"30 min","skill":"elapsed-time","unitHint":"unit-measurement"},
  {"id":"d78-10","type":"mc","prompt":"Had 20, got 5, gave away 3. Now?","choices":["22","18","28","12"],"answer":"22","skill":"multi-step-wp","unitHint":"unit-word-problems"},
]

BLURB = "Place value & estimation, regrouping, mult/div ideas, fractions of sets, perimeter & elapsed time, graphs & multi-step WP — ~30 lessons."
