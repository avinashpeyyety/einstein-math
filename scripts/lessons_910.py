from lesson_helpers import mc, fill, lesson, panels, example

def build():
    L = []
    L.append(lesson(
        "g4-long-mult", "u4-ops", "Long Multiplication Ideas",
        "Break apart factors: 23×4 = (20×4)+(3×4). Partial products to the rescue!",
        panels(("Multiply ones, then tens — add the partial products!", "long-mult", "explain"),
               ("23×4: 3×4=12, 20×4=80, total 92.", "partial-products", "cheer")),
        example("Worked Example", "15 × 6", ["10×6=60", "5×6=30", "60+30=90"]),
        [mc("lm-p1", "12 × 4 = ?", ["16","48","124","8"], "48", "10×4+2×4", "48!", "12×4=48."),
         fill("lm-p2", "21 × 3 = ?", "63", ["63"], "20×3+1×3", "63!", "63."),
         mc("lm-p3", "Partial products for 14×5 start with…", ["10×5 and 4×5","14+5","1×4","round only"], "10×5 and 4×5", "Break apart", "Yes!", "Decompose."),
         mc("lm-p4", "30 × 7 = ?", ["37","210","307","21"], "210", "3×7×10", "210!", "30×7=210.")],
        [mc("lm-q1", "13 × 5 = ?", ["65","15","18","53"], "65"),
         fill("lm-q2", "24 × 2 = ?", "48", ["48"])],
        prereqs=["g4-multi-mult"], skills=["long-multiplication"]))

    L.append(lesson(
        "g4-long-div", "u4-ops", "Long Division Ideas",
        "Divide, multiply, subtract, bring down — the long division loop!",
        panels(("84÷3: how many 3s in 8? 2… then bring down 4…", "long-div", "explain"),
               ("Check with multiplication: quotient × divisor should rebuild the dividend!", "div-check", "cheer")),
        example("Worked Example", "69 ÷ 3", ["3 into 6 is 2", "3 into 9 is 3", "23", "Check: 23×3=69"]),
        [mc("ld-p1", "48 ÷ 4 = ?", ["12","44","52","16"], "12", "4×12", "12!", "48÷4=12."),
         fill("ld-p2", "60 ÷ 5 = ?", "12", ["12"], "5×12=60", "12!", "60÷5=12."),
         mc("ld-p3", "Check 72÷8=9 with…", ["9×8","9+8","72−8","9÷8"], "9×8", "Inverse!", "9×8!", "Multiply to check."),
         mc("ld-p4", "36 ÷ 6 = ?", ["6","30","42","66"], "6", "6×6", "6!", "36÷6=6.")],
        [mc("ld-q1", "56 ÷ 7 = ?", ["8","49","63","9"], "8"),
         fill("ld-q2", "45 ÷ 5 = ?", "9", ["9"])],
        prereqs=["g4-multi-div"], skills=["long-division"]))

    L.append(lesson(
        "g4-primes", "u4-factors", "Primes & Composites",
        "Primes have exactly two factors: 1 and themselves. Composites have more!",
        panels(("2, 3, 5, 7, 11 are primes. 4, 6, 8, 9 are composites.", "primes", "explain"),
               ("1 is neither prime nor composite — a special cosmic loner!", "neither", "think")),
        example("Worked Example", "Is 15 prime?", ["Factors of 15: 1,3,5,15", "More than two factors", "Composite"]),
        [mc("pr-p1", "Which is prime?", ["4","9","7","15"], "7", "Only 1 and 7", "7!", "7 is prime."),
         fill("pr-p2", "Smallest prime number?", "2", ["2"], "Even prime!", "2!", "2 is the smallest."),
         mc("pr-p3", "9 is…", ["prime","composite","neither","fraction"], "composite", "1,3,9", "Composite!", "9=3×3."),
         mc("pr-p4", "Number of factors in a prime?", ["0","1","2","many"], "2", "1 and itself", "2!", "Exactly two.")],
        [mc("pr-q1", "Which is composite?", ["2","3","5","8"], "8"),
         fill("pr-q2", "Is 11 prime? (yes/no)", "yes", ["yes","Yes","YES"])],
        prereqs=["g4-factors-multiples"], skills=["primes"]))

    L.append(lesson(
        "g4-order-ops-deep", "u4-factors", "Order of Ops Practice",
        "PEMDAS power-up: parentheses, then ×÷ left to right, then +−!",
        panels(("Do 3+(2×4) — multiply inside first → 3+8=11, not 20!", "pemdas", "explain"),
               ("Left to right for same-level ops: 12÷3×2 = 4×2 = 8.", "ltr", "cheer")),
        example("Worked Example", "5 + 3 × 2", ["× before +", "3×2=6", "5+6=11"]),
        [mc("oo-p1", "4 + 6 × 2 = ?", ["20","16","12","8"], "16", "× first", "16!", "4+12=16."),
         fill("oo-p2", "(8−3)×2 = ?", "10", ["10"], "Paren first", "10!", "5×2=10."),
         mc("oo-p3", "10 − 2 × 3 = ?", ["24","4","8","6"], "4", "× first", "4!", "10−6=4."),
         mc("oo-p4", "First in 2+(9÷3)?", ["add","divide in paren","ignore paren","multiply 2×9"], "divide in paren", "()", "Paren!", "Do inside.")],
        [mc("oo-q1", "7 + 2 × 5 = ?", ["45","17","14","9"], "17"),
         fill("oo-q2", "(6+4)÷2 = ?", "5", ["5"])],
        prereqs=["g4-order-ops"], skills=["order-ops-deep"]))

    L.append(lesson(
        "g4-frac-times-whole", "u4-fractions", "Fraction × Whole",
        "1/3 of 12 is 12×(1/3)=4. Multiply numerator by the whole, keep denominator!",
        panels(("a/b × n = (a×n)/b. Or think: split into b groups, take a of them.", "frac-times", "explain"),
               ("2/5 × 10 = 20/5 = 4. Simplify when you can!", "frac-times-ex", "cheer")),
        example("Worked Example", "1/4 × 20", ["1×20 / 4", "20/4", "5"]),
        [mc("ftw-p1", "1/2 × 8 = ?", ["2","4","16","1"], "4", "Half of 8", "4!", "1/2 of 8=4."),
         fill("ftw-p2", "1/5 × 15 = ?", "3", ["3"], "15÷5", "3!", "3."),
         mc("ftw-p3", "2/3 × 9 = ?", ["3","6","18","27"], "6", "2×9 / 3", "6!", "18/3=6."),
         mc("ftw-p4", "3/4 × 4 = ?", ["1","3","7","12"], "3", "3×4/4", "3!", "12/4=3.")],
        [mc("ftw-q1", "1/3 × 12 = ?", ["3","4","6","9"], "4"),
         fill("ftw-q2", "2/5 × 10 = ?", "4", ["4"])],
        prereqs=["g4-frac-add-same"], skills=["frac-times-whole"]))

    L.append(lesson(
        "g4-mixed-add", "u4-fractions", "Add Mixed Numbers (Like Denoms)",
        "Add wholes, add fractions — regroup if the fraction part is improper!",
        panels(("1 2/5 + 2 1/5 = 3 3/5. Same denominators make it smooth!", "mixed-add", "explain"),
               ("If fraction ≥1, regroup: 3 5/4 → 4 1/4.", "mixed-regroup", "cheer")),
        example("Worked Example", "2 1/4 + 1 2/4", ["Wholes: 2+1=3", "Fractions: 1/4+2/4=3/4", "3 3/4"]),
        [mc("ma-p1", "1 1/3 + 2 1/3 = ?", ["3 2/3","3 1/3","2 2/3","1 2/3"], "3 2/3", "Add parts", "3 2/3!", "Yes."),
         fill("ma-p2", "Wholes in 2 1/5 + 1 2/5?", "3", ["3"], "2+1", "3!", "Wholes add to 3."),
         mc("ma-p3", "3 2/6 + 1 3/6 = ?", ["4 5/6","4 1/6","5 5/6","3 5/6"], "4 5/6", "Add", "4 5/6!", "Correct."),
         mc("ma-p4", "1 3/4 + 2 2/4 → fraction sum?", ["5/4","1/4","6/4","4/4"], "5/4", "3+2", "5/4!", "Then regroup.")],
        [mc("ma-q1", "1 1/5 + 1 2/5 = ?", ["2 3/5","2 1/5","1 3/5","3 3/5"], "2 3/5"),
         fill("ma-q2", "2 1/8 + 0 3/8 wholes sum?", "2", ["2"])],
        prereqs=["g4-mixed-intro","g4-frac-add-same"], skills=["mixed-add"]))

    L.append(lesson(
        "g4-decimal-add", "u4-decimals-area", "Add Decimals",
        "Line up the decimal points — tenths under tenths — then add!",
        panels(("0.4 + 0.35 → think 0.40 + 0.35 = 0.75.", "decimal-add", "explain"),
               ("Keep the decimal point in the sum aligned!", "decimal-align", "cheer")),
        example("Worked Example", "0.6 + 0.25", ["Align: 0.60 + 0.25", "Add: 85 hundredths", "0.85"]),
        [mc("da-p1", "0.3 + 0.4 = ?", ["0.7","0.12","0.34","7"], "0.7", "Tenths", "0.7!", "0.3+0.4=0.7."),
         fill("da-p2", "0.5 + 0.25 = ?", "0.75", ["0.75",".75"], "Align", "0.75!", "0.75."),
         mc("da-p3", "1.2 + 0.3 = ?", ["1.5","1.23","0.15","4.2"], "1.5", "Add", "1.5!", "1.2+0.3=1.5."),
         mc("da-p4", "When adding decimals, first…", ["align decimal points","ignore points","multiply","round away"], "align decimal points", "Line up!", "Align!", "Place value.")],
        [mc("da-q1", "0.8 + 0.1 = ?", ["0.9","0.81","0.08","9"], "0.9"),
         fill("da-q2", "0.4 + 0.4 = ?", "0.8", ["0.8",".8"])],
        prereqs=["g4-decimal-pv"], skills=["decimal-add"]))

    L.append(lesson(
        "g4-decimal-sub", "u4-decimals-area", "Subtract Decimals",
        "Align decimals, subtract like whole numbers — borrow carefully!",
        panels(("0.90 − 0.35 = 0.55. Tenths and hundredths stay in their lanes!", "decimal-sub", "explain"),
               ("Annex zeros if helpful: 0.5 = 0.50.", "annex-zero", "cheer")),
        example("Worked Example", "0.8 − 0.25", ["0.80 − 0.25", "80−25 hundredths", "0.55"]),
        [mc("ds-p1", "0.9 − 0.3 = ?", ["0.6","0.12","1.2","0.3"], "0.6", "Tenths", "0.6!", "0.9−0.3=0.6."),
         fill("ds-p2", "0.75 − 0.25 = ?", "0.5", ["0.5","0.50",".5"], "Subtract", "0.5!", "0.50."),
         mc("ds-p3", "1.5 − 0.4 = ?", ["1.1","1.9","0.11","11"], "1.1", "Align", "1.1!", "1.5−0.4=1.1."),
         mc("ds-p4", "0.5 − 0.25 needs…", ["0.50 − 0.25","0.5 − 25","5 − 0.25","skip"], "0.50 − 0.25", "Annex 0", "Yes!", "Match places.")],
        [mc("ds-q1", "0.7 − 0.2 = ?", ["0.5","0.9","0.14","5"], "0.5"),
         fill("ds-q2", "1.0 − 0.4 = ?", "0.6", ["0.6",".6"])],
        prereqs=["g4-decimal-add","g4-decimal-compare"], skills=["decimal-sub"]))

    L.append(lesson(
        "g4-volume-rect", "u4-decimals-area", "Rectangular Prism Volume",
        "Volume = length × width × height — unit cubes packed inside!",
        panels(("A 3×2×4 prism holds 24 unit cubes. V=l×w×h!", "volume", "explain"),
               ("Count layers: each layer is l×w cubes, times height layers.", "volume-layers", "cheer")),
        example("Worked Example", "Box 5×2×3. Volume?", ["5×2=10 per layer", "3 layers → 30", "V=30"]),
        [mc("vr-p1", "2×3×4 volume?", ["9","24","14","5"], "24", "Multiply 3", "24!", "2×3×4=24."),
         fill("vr-p2", "5×1×4 volume?", "20", ["20"], "lwh", "20!", "20."),
         mc("vr-p3", "Volume units are…", ["cubic units","square units","degrees","liters only always"], "cubic units", "3D!", "Cubic!", "Unit cubes."),
         mc("vr-p4", "3×3×3 cube volume?", ["9","18","27","33"], "27", "3³", "27!", "27.")],
        [mc("vr-q1", "4×2×2 volume?", ["8","16","4","10"], "16"),
         fill("vr-q2", "6×2×1 volume?", "12", ["12"])],
        prereqs=["g4-volume-wp"], skills=["volume-rect"]))

    L.append(lesson(
        "g4-coord-plane", "u4-geometry", "Coordinate Plane Intro",
        "Ordered pairs (x,y): x right/left, y up/down from the origin!",
        panels(("Origin is (0,0). First number = x (horizontal), second = y (vertical).", "coord", "explain"),
               ("(3,2) means right 3, up 2. Plot like a cosmic treasure map!", "plot-point", "cheer")),
        example("Worked Example", "Plot (2,4)", ["Start at origin", "x=2 → right 2", "y=4 → up 4", "Mark the point"]),
        [mc("cp-p1", "In (5,1), the x-coordinate is…", ["5","1","6","0"], "5", "First number", "5!", "x first."),
         fill("cp-p2", "y-coordinate of (3,7)?", "7", ["7"], "Second", "7!", "y=7."),
         mc("cp-p3", "Origin is…", ["(0,0)","(1,1)","(0,1)","(1,0)"], "(0,0)", "Center start", "(0,0)!", "Origin."),
         mc("cp-p4", "(0,4) lies on the…", ["x-axis","y-axis","nowhere","diagonal only"], "y-axis", "x=0", "y-axis!", "Vertical axis.")],
        [mc("cp-q1", "In (2,9), y is…", ["2","9","11","0"], "9"),
         fill("cp-q2", "x of (8,3)?", "8", ["8"])],
        prereqs=[], skills=["coordinate-plane"]))

    L.append(lesson(
        "g4-multi-step-wp", "u4-word-problems", "Multi-Step Problem Solving",
        "Read, plan, solve, check — multi-step word problems for grade 4–5 heroes!",
        panels(("Find hidden steps: sometimes multiply, then subtract leftovers.", "g4-wp", "explain"),
               ("A bakery sells 4 boxes of 6, then 5 more singles → 4×6+5=29.", "bakery", "cheer")),
        example("Worked Example", "3 packs of 8 stickers, give away 5. Left?", ["3×8=24", "24−5=19", "19 stickers"]),
        [mc("gwp-p1", "2×7 + 4 = ?", ["14","18","11","24"], "18", "× then +", "18!", "14+4=18."),
         fill("gwp-p2", "5×6 − 8 = ?", "22", ["22"], "30−8", "22!", "22."),
         mc("gwp-p3", "4 rows of 5, plus 3 extra. Total?", ["20","23","12","9"], "23", "20+3", "23!", "23."),
         mc("gwp-p4", "Good last step?", ["check reasonableness","delete work","guess only","skip units"], "check reasonableness", "Verify!", "Check!", "Does it make sense?")],
        [mc("gwp-q1", "3×9 − 6 = ?", ["21","27","33","12"], "21"),
         fill("gwp-q2", "8×4 + 2 = ?", "34", ["34"])],
        prereqs=["g4-multi-mult","g4-order-ops"], skills=["multi-step-wp-g4"]))

    L.append(lesson(
        "g4-frac-sub-same", "u4-fractions", "Subtract Fractions (Same Denom)",
        "Same denominator? Subtract numerators, keep the bottom number!",
        panels(("5/8 − 2/8 = 3/8. Denominator stays; numerators subtract!", "frac-sub", "explain"),
               ("Simplify if you can: 4/6 − 1/6 = 3/6 = 1/2.", "frac-sub-simp", "cheer")),
        example("Worked Example", "7/10 − 3/10", ["Same denom 10", "7−3=4", "4/10", "Simplify 2/5 optional"]),
        [mc("fsub-p1", "5/6 − 1/6 = ?", ["4/6","6/6","4/12","5/5"], "4/6", "Subtract tops", "4/6!", "4/6."),
         fill("fsub-p2", "Numerator of 9/10 − 4/10?", "5", ["5"], "9−4", "5!", "5/10."),
         mc("fsub-p3", "3/5 − 2/5 = ?", ["1/5","5/5","1/10","6/5"], "1/5", "1 left", "1/5!", "1/5."),
         mc("fsub-p4", "Keep the _____ when subtracting like fractions.", ["denominator","numerator only","decimal","variable"], "denominator", "Same bottom", "Denom!", "Keep it.")],
        [mc("fsub-q1", "8/9 − 3/9 = ?", ["5/9","11/9","5/18","3/8"], "5/9"),
         fill("fsub-q2", "6/7 − 2/7 numerator?", "4", ["4"])],
        prereqs=["g4-frac-add-same"], skills=["frac-sub-same"]))

    L.append(lesson(
        "g4-area-rect", "u4-decimals-area", "Area of Rectangles",
        "Area = length × width — square units covering the inside!",
        panels(("A 6×4 rectangle has area 24 square units.", "area-rect", "explain"),
               ("Area is inside; perimeter is around — don't mix them up!", "area-vs-perim", "cheer")),
        example("Worked Example", "Length 8, width 3. Area?", ["A = l × w", "8×3=24", "24 square units"]),
        [mc("ar4-p1", "5×7 area?", ["12","35","57","2"], "35", "Multiply", "35!", "35 sq units."),
         fill("ar4-p2", "9×4 area?", "36", ["36"], "9×4", "36!", "36."),
         mc("ar4-p3", "Area units are…", ["square units","cubic only","degrees","meters only always"], "square units", "2D cover", "Square!", "Tiles."),
         mc("ar4-p4", "Perimeter of 5×7 vs area?", ["24 vs 35","35 vs 24","12 vs 35","0"], "24 vs 35", "2(5+7)=24", "Perim 24, area 35!", "Different!")],
        [mc("ar4-q1", "6×6 area?", ["12","24","36","66"], "36"),
         fill("ar4-q2", "10×3 area?", "30", ["30"])],
        prereqs=["g4-decimals-area"], skills=["area-rect"]))

    L.append(lesson(
        "g4-factors-deep", "u4-factors", "Factor Pairs Deep Dive",
        "List factor pairs systematically — don't miss any cosmic partners!",
        panels(("For 24: 1×24, 2×12, 3×8, 4×6 — stop when factors repeat!", "factor-pairs", "explain"),
               ("A number is divisible by a factor if division has no remainder.", "divisibility", "cheer")),
        example("Worked Example", "Factor pairs of 18", ["1×18", "2×9", "3×6", "Done (next would repeat)"]),
        [mc("fd-p1", "Factor pair of 20?", ["2×10","3×5","4×4","7×3"], "2×10", "2×10=20", "2×10!", "Yes."),
         fill("fd-p2", "Partner of 4 in factors of 12? (4×?)", "3", ["3"], "4×3=12", "3!", "3."),
         mc("fd-p3", "All factors of 7?", ["1 and 7","1,7,14","2,7","7 only"], "1 and 7", "Prime", "1 and 7!", "Prime."),
         mc("fd-p4", "Is 5 a factor of 35?", ["yes","no","only sometimes","never numbers"], "yes", "35÷5=7", "Yes!", "Yes.")],
        [mc("fd-q1", "Pair for 16?", ["2×8","3×5","6×2","7×2"], "2×8"),
         fill("fd-q2", "How many factor pairs for 9? (count)", "2", ["2"])],
        prereqs=["g4-factors-intro"], skills=["factor-pairs"]))

    L.append(lesson(
        "g4-mixed-sub", "u4-fractions", "Subtract Mixed Numbers (Light)",
        "Subtract wholes and like fractions — borrow a whole if needed!",
        panels(("3 1/4 − 1 2/4: not enough fourths → borrow → 2 5/4 − 1 2/4 = 1 3/4.", "mixed-sub", "explain"),
               ("Same denominators keep the cosmic gears meshing smoothly.", "mixed-sub-ex", "cheer")),
        example("Worked Example", "4 3/5 − 2 1/5", ["Wholes 4−2=2", "Fractions 3/5−1/5=2/5", "2 2/5"]),
        [mc("msub-p1", "3 2/3 − 1 1/3 = ?", ["2 1/3","2 3/3","4 1/3","1 1/3"], "2 1/3", "Subtract parts", "2 1/3!", "Yes."),
         fill("msub-p2", "Wholes left in 5 1/4 − 2 0/4?", "3", ["3"], "5−2", "3!", "3 wholes."),
         mc("msub-p3", "2 4/6 − 1 1/6 = ?", ["1 3/6","1 5/6","3 3/6","1 1/6"], "1 3/6", "Subtract", "1 3/6!", "Correct."),
         mc("msub-p4", "If fraction too small, first…", ["borrow a whole","multiply","ignore","add"], "borrow a whole", "Regroup!", "Borrow!", "Like whole-number subtract.")],
        [mc("msub-q1", "4 3/8 − 2 1/8 = ?", ["2 2/8","2 4/8","6 2/8","1 2/8"], "2 2/8"),
         fill("msub-q2", "6 2/5 − 3 1/5 wholes?", "3", ["3"])],
        prereqs=["g4-mixed-add"], skills=["mixed-sub"]))

    return L

NEW_UNITS = [
    {"id": "u4-geometry", "title": "Geometry Quest", "icon": "🗺️", "color": "#95E1D3",
     "description": "Coordinate plane and spatial ideas", "lessons": []},
    {"id": "u4-word-problems", "title": "Problem-Solving Lab", "icon": "🧪", "color": "#FFE66D",
     "description": "Multi-step word problems", "lessons": []},
]

DIAG = [
  {"id":"d910-1","type":"mc","prompt":"1,456 + 378 is closest to…","choices":["1,000","1,800","2,000","500"],"answer":"1,800","skill":"multi-add","unitHint":"u4-ops"},
  {"id":"d910-2","type":"mc","prompt":"Which is prime?","choices":["4","9","7","15"],"answer":"7","skill":"primes","unitHint":"u4-factors"},
  {"id":"d910-3","type":"mc","prompt":"1/3 × 12 = ?","choices":["3","4","6","15"],"answer":"4","skill":"frac-times-whole","unitHint":"u4-fractions"},
  {"id":"d910-4","type":"mc","prompt":"Area of 5×3 rectangle?","choices":["8","15","53","2"],"answer":"15","skill":"area","unitHint":"u4-decimals-area"},
  {"id":"d910-5","type":"mc","prompt":"12 × 4 = ?","choices":["16","48","124","8"],"answer":"48","skill":"multi-digit-mult","unitHint":"u4-ops"},
  {"id":"d910-6","type":"mc","prompt":"2/7 + 3/7 = ?","choices":["5/7","5/14","6/7","1/7"],"answer":"5/7","skill":"frac-add-same-den","unitHint":"u4-fractions"},
  {"id":"d910-7","type":"mc","prompt":"0.4 + 0.35 = ?","choices":["0.39","0.75","0.435","4.35"],"answer":"0.75","skill":"decimal-add","unitHint":"u4-decimals-area"},
  {"id":"d910-8","type":"mc","prompt":"2 + 3 × 4 = ?","choices":["20","14","24","9"],"answer":"14","skill":"order-of-operations","unitHint":"u4-factors"},
  {"id":"d910-9","type":"mc","prompt":"In (3,5), the y-coordinate is…","choices":["3","5","8","0"],"answer":"5","skill":"coordinate-plane","unitHint":"u4-geometry"},
  {"id":"d910-10","type":"mc","prompt":"3 packs of 8, give away 5. Left?","choices":["19","24","29","11"],"answer":"19","skill":"multi-step-wp-g4","unitHint":"u4-word-problems"},
]

BLURB = "Multi-digit ops, factors/primes, fractions & mixed numbers, decimal ops, area/volume, coordinates & multi-step WP — ~30 lessons."
