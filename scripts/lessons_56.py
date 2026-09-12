from lesson_helpers import mc, fill, lesson, panels, example

def build():
    L = []
    L.append(lesson(
        "k-count-to-100-tens", "k-counting", "Count by Tens to 100",
        "Tens are rocket boosters! 10, 20, 30… all the way to 100!",
        panels(
            ("Skip-counting by 10s makes big numbers fly by!", "tens-rocket", "explain"),
            ("10, 20, 30, 40, 50, 60, 70, 80, 90, 100 — cosmic!", "tens-line", "cheer"),
        ),
        example("Worked Example", "What comes after 40 when we count by 10s?",
                ["We are counting by tens", "40 + 10 = 50", "Next is 50"]),
        [
            mc("c100-p1", "Count by 10s: 10, 20, ?", ["21","25","30","12"], "30", "Add 10!", "30!", "10+10=20, then +10=30."),
            mc("c100-p2", "What comes after 70 by tens?", ["71","80","60","100"], "80", "70+10", "80!", "70 + 10 = 80."),
            fill("c100-p3", "60 + 10 = ?", "70", ["70"], "Add a ten.", "70!", "60+10=70."),
            mc("c100-p4", "How many tens in 100?", ["1","5","10","100"], "10", "10×10=100", "10 tens!", "Ten groups of 10 make 100."),
        ],
        [mc("c100-q1", "Count by 10s: 50, 60, ?", ["61","70","65","80"], "70", "", "", ""),
         fill("c100-q2", "What number is 9 tens?", "90", ["90"], "", "", "")],
        prereqs=["k-count-to-20"], skills=["count-by-tens"]
    ))
    # strip empty feedback on checks - quickCheck often has no hint fields in original
    for item in L[-1]["quickCheck"]:
        for k in ("hint","feedbackCorrect","feedbackWrong"):
            item.pop(k, None)

    L.append(lesson(
        "k-teen-decompose", "k-counting", "Teens: 10 and Some More",
        "Every teen is a 10 plus some ones — like 13 is 10 + 3!",
        panels(
            ("Teens are ten with extras hiding in the ones place!", "teen-blocks", "explain"),
            ("16 = 10 + 6. The 1 in 16 means one ten!", "teen-16", "cheer"),
        ),
        example("Worked Example", "Break 15 into a ten and ones.",
                ["15 has a 1 in the tens place", "That means 10", "Ones digit is 5", "15 = 10 + 5"]),
        [
            mc("td-p1", "15 = 10 + ?", ["4","5","6","15"], "5", "Ones digit!", "5!", "15 = 10 + 5."),
            fill("td-p2", "17 = 10 + ?", "7", ["7"], "Look at ones.", "7!", "17 = 10 + 7."),
            mc("td-p3", "10 + 4 = ?", ["14","40","104","4"], "14", "Ten and four.", "14 — a teen!", "10+4=14."),
            mc("td-p4", "Which shows 10 + 8?", ["18","80","108","8"], "18", "Teen!", "18!", "10+8 makes 18."),
        ],
        [mc("td-q1", "12 = 10 + ?", ["1","2","10","12"], "2"),
         fill("td-q2", "10 + 9 = ?", "19", ["19"])],
        prereqs=["k-teen-numbers"], skills=["teen-decompose"]
    ))

    L.append(lesson(
        "k-compare-teens", "k-counting", "Compare Teen Numbers",
        "Which teen is greater? Compare tens first — then ones!",
        panels(
            ("Same tens? Peek at the ones! 14 vs 17 → 7 ones wins!", "compare-teens", "explain"),
            ("19 is greater than 12 because 9 ones > 2 ones.", "number-line-teens", "cheer"),
        ),
        example("Worked Example", "Which is greater: 13 or 18?",
                ["Both have 1 ten", "Compare ones: 3 vs 8", "8 > 3", "18 is greater"]),
        [
            mc("ct-p1", "Which is MORE?", ["13","16","both same","0"], "16", "Ones!", "16!", "6 ones > 3 ones."),
            mc("ct-p2", "Which is LESS: 19 or 11?", ["19","11","same","20"], "11", "Fewer ones.", "11!", "1 one < 9 ones."),
            fill("ct-p3", "Which is greater, 14 or 15? (type the number)", "15", ["15"], "Compare ones.", "15!", "5>4 so 15>14."),
            mc("ct-p4", "14 ___ 17", [">","<","=","+"], "<", "14 is smaller.", "14 < 17!", "4 ones < 7 ones."),
        ],
        [mc("ct-q1", "Greater number: 12 or 18?", ["12","18","same","10"], "18"),
         fill("ct-q2", "Type the smaller: 16 or 13", "13", ["13"])],
        prereqs=["k-compare-small","k-teen-numbers"], skills=["compare-teens"]
    ))

    L.append(lesson(
        "k-doubles", "k-add-sub", "Doubles Facts",
        "Doubles are twin powers! 4+4, 6+6 — memorizing them is superhero speed!",
        panels(
            ("A double means both addends are the same number!", "doubles", "explain"),
            ("5+5=10, 7+7=14, 8+8=16 — twin cosmic beams!", "doubles-chart", "cheer"),
        ),
        example("Worked Example", "What is 6 + 6?",
                ["Both numbers are 6", "That's a double", "6+6=12"]),
        [
            mc("dbl-p1", "4 + 4 = ?", ["6","8","44","0"], "8", "Twin 4s!", "8!", "4+4=8."),
            fill("dbl-p2", "7 + 7 = ?", "14", ["14"], "Double 7.", "14!", "7+7=14."),
            mc("dbl-p3", "Which is a double?", ["5+6","8+8","9+1","3+4"], "8+8", "Same + same", "8+8!", "Doubles match."),
            mc("dbl-p4", "9 + 9 = ?", ["16","18","19","99"], "18", "Double 9.", "18!", "9+9=18."),
        ],
        [mc("dbl-q1", "3 + 3 = ?", ["5","6","9","33"], "6"),
         fill("dbl-q2", "8 + 8 = ?", "16", ["16"])],
        prereqs=["k-add-within-10"], skills=["doubles"]
    ))

    L.append(lesson(
        "k-make-10-add", "k-add-sub", "Make 10 to Add",
        "When adding, zip to 10 first — then add the leftover ones. Relativity for addends!",
        panels(
            ("8 + 5: take 2 from 5 to make 10, then 3 left → 13!", "make-10", "explain"),
            ("Friends of 10 help every addition mission!", "ten-friends", "cheer"),
        ),
        example("Worked Example", "Solve 9 + 4 by making 10.",
                ["9 needs 1 to make 10", "Take 1 from 4 → 3 left", "10 + 3 = 13"]),
        [
            mc("m10-p1", "9 needs ? to make 10", ["0","1","2","9"], "1", "9+1=10", "1!", "9+1=10."),
            fill("m10-p2", "8 + 5 = ? (make 10)", "13", ["13"], "8+2=10, +3", "13!", "8+5=13."),
            mc("m10-p3", "7 + 4 = ?", ["10","11","12","74"], "11", "7+3=10 +1", "11!", "7+4=11."),
            mc("m10-p4", "Best first step for 8+6?", ["make 10","subtract","multiply","ignore 8"], "make 10", "Bridge!", "Make 10!", "Fill to 10 first."),
        ],
        [mc("m10-q1", "9 + 3 = ?", ["11","12","13","93"], "12"),
         fill("m10-q2", "6 + 5 = ?", "11", ["11"])],
        prereqs=["k-compose-10","k-add-within-20"], skills=["make-10"]
    ))

    L.append(lesson(
        "k-related-facts", "k-add-sub", "Fact Families",
        "Add and subtract are siblings! 3+5=8, 5+3=8, 8−5=3 — one family!",
        panels(
            ("If you know 2+6=8, you also know 8−6=2!", "fact-family", "explain"),
            ("Three numbers dance together in a fact family.", "triangle-facts", "cheer"),
        ),
        example("Worked Example", "Family for 4, 5, 9",
                ["4+5=9", "5+4=9", "9−4=5", "9−5=4"]),
        [
            mc("ff-p1", "If 3+7=10, then 10−7=?", ["3","7","10","17"], "3", "Undo add!", "3!", "Subtraction undoes."),
            fill("ff-p2", "6+2=8, so 8−2=?", "6", ["6"], "Partner!", "6!", "8−2=6."),
            mc("ff-p3", "Which belongs with 2, 8, 10?", ["2+8=10","2×8=10","10+2=8","8−10=2"], "2+8=10", "Add to total", "Yes!", "2+8=10."),
            mc("ff-p4", "9−4=5, so 4+5=?", ["9","1","45","0"], "9", "Family!", "9!", "Related fact."),
        ],
        [mc("ff-q1", "5+3=8 → 8−3=?", ["5","3","8","2"], "5"),
         fill("ff-q2", "4+6=10 → 10−6=?", "4", ["4"])],
        prereqs=["k-sub-within-10","k-add-within-10"], skills=["fact-families"]
    ))

    L.append(lesson(
        "k-time-half", "k-measurement", "Half Past the Hour",
        "When the long hand points to 6, it's half past — halfway around the clock!",
        panels(
            ("Long hand on 6 means 30 minutes — we say half past!", "clock-half", "explain"),
            ("Short hand a little past 2 + long on 6 → half past 2.", "clock-230", "cheer"),
        ),
        example("Worked Example", "Long hand on 6, short past 4. Time?",
                ["Long on 6 → half past", "Short past 4 → 4", "Half past 4 (or 4:30)"]),
        [
            mc("thh-p1", "Long hand on 6 means…", ["o'clock","half past","quarter","noon only"], "half past", "Halfway!", "Half past!", "6 = 30 minutes."),
            mc("thh-p2", "Half past 3 is also…", ["3:00","3:30","3:15","6:00"], "3:30", "30 minutes", "3:30!", "Half past = :30."),
            fill("thh-p3", "Half past 7 → minutes? (number)", "30", ["30"], "Half hour.", "30!", "Half past = 30 min."),
            mc("thh-p4", "Short past 9, long on 6. Time?", ["9:00","9:30","6:09","9:06"], "9:30", "Half past 9", "9:30!", "Half past 9."),
        ],
        [mc("thh-q1", "Long hand on 6 → ?", ["o'clock","half past","midnight","hour only"], "half past"),
         fill("thh-q2", "Half past 1 is 1:__", "30", ["30"])],
        prereqs=["k-time-hour"], skills=["time-half-hour"]
    ))

    L.append(lesson(
        "k-weight-compare", "k-measurement", "Heavier or Lighter?",
        "Balances and heft! Compare weight — feathers vs rocks, cosmic style!",
        panels(
            ("Heavier sinks the scale down. Lighter floats up!", "balance-scale", "explain"),
            ("A watermelon is heavier than an apple — no relativity needed!", "weight-compare", "cheer"),
        ),
        example("Worked Example", "Feather vs book — which is heavier?",
                ["Feel or use a balance", "Book pushes scale down", "Book is heavier"]),
        [
            mc("wt-p1", "Which is usually HEAVIER?", ["feather","brick","bubble","whisper"], "brick", "Think heft!", "Brick!", "Bricks are heavy."),
            mc("wt-p2", "On a balance, the heavier side…", ["goes up","goes down","stays still","disappears"], "goes down", "Gravity!", "Down!", "Heavy side drops."),
            fill("wt-p3", "Is an elephant heavier than a mouse? (yes/no)", "yes", ["yes","Yes","YES"], "Obvious cosmic truth!", "Yes!", "Elephants are heavier."),
            mc("wt-p4", "Which is LIGHTER?", ["bowling ball","balloon","car","fridge"], "balloon", "Airy!", "Balloon!", "Balloons are light."),
        ],
        [mc("wt-q1", "Heavier: pencil or backpack?", ["pencil","backpack","same","neither"], "backpack"),
         mc("wt-q2", "Lighter side of a balance…", ["goes down","goes up","vanishes","weighs more"], "goes up")],
        prereqs=["k-length-compare"], skills=["weight-compare"]
    ))

    L.append(lesson(
        "k-coin-combos", "k-measurement", "Coin Combinations",
        "Mix pennies, nickels, and dimes to make the same amount — money magic!",
        panels(
            ("A nickel = 5 pennies. A dime = 10 pennies or 2 nickels!", "coins", "explain"),
            ("15¢ could be a dime + nickel, or 3 nickels, or 15 pennies!", "coin-combo", "cheer"),
        ),
        example("Worked Example", "Make 20¢ two ways.",
                ["2 dimes = 20¢", "4 nickels = 20¢", "1 dime + 2 nickels = 20¢"]),
        [
            mc("cc-p1", "2 nickels = ?", ["2¢","5¢","10¢","20¢"], "10¢", "5+5", "10¢!", "2 nickels = 10¢."),
            fill("cc-p2", "1 dime + 1 nickel = ? cents", "15", ["15","15¢"], "10+5", "15¢!", "10+5=15."),
            mc("cc-p3", "Which equals 10¢?", ["1 nickel","2 nickels","1 penny","3 pennies"], "2 nickels", "5+5", "2 nickels!", "Two nickels make a dime."),
            mc("cc-p4", "3 dimes = ?", ["3¢","13¢","30¢","300¢"], "30¢", "10×3", "30¢!", "3×10=30."),
        ],
        [mc("cc-q1", "1 dime + 2 pennies = ?", ["3¢","12¢","21¢","30¢"], "12¢"),
         fill("cc-q2", "4 nickels = ? cents", "20", ["20","20¢"])],
        prereqs=["k-coins-intro"], skills=["coin-combos"]
    ))

    L.append(lesson(
        "k-word-compare", "k-word-problems", "How Many More?",
        "Compare stories ask: how many more? Find the difference — subtract!",
        panels(
            ("'How many more' means find the gap between two amounts!", "compare-wp", "explain"),
            ("Mia has 8, Leo has 5. How many more does Mia have? 8−5=3!", "compare-kids", "cheer"),
        ),
        example("Worked Example", "Sam has 9 stickers, Jo has 4. How many more does Sam have?",
                ["Compare → subtract", "9 − 4 = 5", "Sam has 5 more"]),
        [
            mc("wc-p1", "9 cats, 6 dogs. How many more cats?", ["3","15","6","9"], "3", "9−6", "3!", "9−6=3."),
            fill("wc-p2", "10 red, 7 blue. How many more red?", "3", ["3"], "Subtract.", "3!", "10−7=3."),
            mc("wc-p3", "Key words 'how many more' → ?", ["add","subtract","multiply","ignore"], "subtract", "Difference!", "Subtract!", "Compare → subtract."),
            mc("wc-p4", "5 birds, 2 nests. How many more birds?", ["3","7","2","5"], "3", "5−2", "3!", "5−2=3."),
        ],
        [mc("wc-q1", "8 vs 3. How many more is 8?", ["5","11","3","8"], "5"),
         fill("wc-q2", "12 − 5 = ? (how many more)", "7", ["7"])],
        prereqs=["k-word-sub"], skills=["word-compare"]
    ))

    L.append(lesson(
        "k-word-put-together", "k-word-problems", "Put-Together Stories",
        "Some stories put groups together — that's addition adventure!",
        panels(
            ("'In all', 'altogether', 'total' → add the parts!", "put-together", "explain"),
            ("3 red rockets + 4 blue rockets = 7 rockets in all!", "rockets-sum", "cheer"),
        ),
        example("Worked Example", "4 apples + 5 pears. How many fruits?",
                ["Put together → add", "4 + 5 = 9", "9 fruits"]),
        [
            mc("wp-p1", "2 + 6 toys in all = ?", ["4","8","12","26"], "8", "Add!", "8!", "2+6=8."),
            fill("wp-p2", "5 hats + 3 hats altogether?", "8", ["8"], "Add.", "8!", "5+3=8."),
            mc("wp-p3", "Word 'altogether' usually means…", ["subtract","add","divide","skip"], "add", "Total!", "Add!", "Altogether → add."),
            mc("wp-p4", "7 birds + 2 birds = ?", ["5","9","14","72"], "9", "Sum", "9!", "7+2=9."),
        ],
        [mc("wp-q1", "3 + 8 in all = ?", ["5","11","38","24"], "11"),
         fill("wp-q2", "6 + 6 altogether = ?", "12", ["12"])],
        prereqs=["k-word-add"], skills=["word-put-together"]
    ))

    L.append(lesson(
        "k-patterns-ab", "k-patterns", "AB Color Patterns",
        "Patterns repeat! Red-blue-red-blue is an AB pattern — predict the next!",
        panels(
            ("A pattern has a repeating core. Spot the core, extend it!", "ab-pattern", "explain"),
            ("Circle, square, circle, square… next is circle!", "shape-ab", "cheer"),
        ),
        example("Worked Example", "Pattern: star, circle, star, circle, star, ?",
                ["Core is star, circle", "After circle comes star", "Next is star"]),
        [
            mc("ab-p1", "Red, blue, red, blue, ?", ["red","green","yellow","purple"], "red", "AB repeats", "Red!", "AB → red again."),
            fill("ab-p2", "1, 2, 1, 2, 1, ? (number)", "2", ["2"], "AB", "2!", "Next is 2."),
            mc("ab-p3", "A, B, A, B, A, ?", ["A","B","C","Z"], "B", "AB pattern", "B!", "After A comes B."),
            mc("ab-p4", "Core of clap-stomp-clap-stomp?", ["clap-stomp","clap only","stomp-clap-stomp","random"], "clap-stomp", "Two-beat!", "Clap-stomp!", "AB core."),
        ],
        [mc("ab-q1", "Dot, square, dot, square, ?", ["dot","square","triangle","none"], "dot"),
         fill("ab-q2", "3, 5, 3, 5, 3, ?", "5", ["5"])],
        prereqs=["k-patterns-skip"], skills=["ab-patterns"]
    ))

    L.append(lesson(
        "k-tally-pictograph", "k-data", "Tally Marks & Pictographs",
        "Count votes with tally marks — and read picture graphs. Data detective!",
        panels(
            ("Four tallies, then a diagonal fifth: four sticks become a bundle of 5!", "tally", "explain"),
            ("In a pictograph, each picture often stands for 1 (or more)!", "pictograph", "cheer"),
        ),
        example("Worked Example", "Tally of five (bundle) plus one more means?",
                ["First group = 5", "Plus 1 more", "Total 6"]),
        [
            mc("dat-p1", "Four tally sticks = ?", ["3","4","5","10"], "4", "Count sticks", "4!", "Four tallies."),
            fill("dat-p2", "A five-bundle tally equals?", "5", ["5"], "Diagonal!", "5!", "Bundle of five."),
            mc("dat-p3", "Pictograph: 3 apple pics (1 each). Apples?", ["1","2","3","6"], "3", "Count pics", "3!", "One pic = one."),
            mc("dat-p4", "Four tallies + two more = ?", ["5","6","7","4"], "6", "4+2", "6!", "4+2=6."),
        ],
        [mc("dat-q1", "Five-bundle tally = ?", ["4","5","6","9"], "5"),
         fill("dat-q2", "2 star pics (1 each) = ? stars", "2", ["2"])],
        prereqs=[], skills=["tally","pictograph"]
    ))

    L.append(lesson(
        "k-shapes-3d", "k-shapes", "3D Shape Friends",
        "Spheres, cubes, cones, cylinders — solid shapes you can hold!",
        panels(
            ("Flat shapes are 2D. Solid shapes are 3D — they take up space!", "3d-shapes", "explain"),
            ("A ball is a sphere. A die is a cube. An ice cream scoop sits on a cone!", "3d-real", "cheer"),
        ),
        example("Worked Example", "What 3D shape is a can of soup?",
                ["Round sides, flat circles on ends", "That's a cylinder", "Soup can is like a cylinder"]),
        [
            mc("s3-p1", "A ball is a…", ["cube","sphere","cone","square"], "sphere", "Round solid", "Sphere!", "Balls are spheres."),
            mc("s3-p2", "A die (dice) is most like a…", ["sphere","cube","cone","circle"], "cube", "Six squares", "Cube!", "Dice are like cubes."),
            fill("s3-p3", "How many faces on a cube? (number)", "6", ["6"], "Count sides", "6!", "A cube has 6 faces."),
            mc("s3-p4", "Ice cream cone shape?", ["sphere","cylinder","cone","cube"], "cone", "Pointy!", "Cone!", "Cone shape."),
        ],
        [mc("s3-q1", "Can of soda is like a…", ["sphere","cylinder","cube","triangle"], "cylinder"),
         fill("s3-q2", "Cube faces?", "6", ["6"])],
        prereqs=["k-shapes-intro"], skills=["shapes-3d"]
    ))

    L.append(lesson(
        "k-decompose-teens-add", "k-add-sub", "Add with Teen Numbers",
        "Adding onto teens: 14+3 means keep the ten and add the ones!",
        panels(
            ("14 + 3 = 10 + (4+3) = 10 + 7 = 17. Decompose the teen!", "teen-add", "explain"),
            ("Stay in the teens neighborhood — count on from the bigger number!", "count-on", "cheer"),
        ),
        example("Worked Example", "13 + 5",
                ["Start at 13", "Count on 5: 14,15,16,17,18", "18"]),
        [
            mc("ta-p1", "12 + 4 = ?", ["14","16","8","124"], "16", "Count on", "16!", "12+4=16."),
            fill("ta-p2", "15 + 2 = ?", "17", ["17"], "15,16,17", "17!", "15+2=17."),
            mc("ta-p3", "11 + 6 = ?", ["16","17","5","116"], "17", "Count on 6", "17!", "11+6=17."),
            mc("ta-p4", "10 + 8 = ?", ["18","80","2","108"], "18", "Teen!", "18!", "10+8=18."),
        ],
        [mc("ta-q1", "14 + 3 = ?", ["16","17","11","143"], "17"),
         fill("ta-q2", "16 + 2 = ?", "18", ["18"])],
        prereqs=["k-teen-numbers","k-add-within-20"], skills=["teen-add"]
    ))

    return L

NEW_UNITS = [{
    "id": "k-data",
    "title": "Data Detectives",
    "icon": "📊",
    "color": "#FF8C42",
    "description": "Tally marks, pictographs, and simple counts",
    "lessons": []
}]

DIAG = [
  {"id":"d56-1","type":"mc","prompt":"What is 2 + 3?","choices":["4","5","6","23"],"answer":"5","skill":"add-within-10","unitHint":"k-add-sub"},
  {"id":"d56-2","type":"mc","prompt":"What comes after 8?","choices":["7","9","10","18"],"answer":"9","skill":"count-to-20","unitHint":"k-counting"},
  {"id":"d56-3","type":"mc","prompt":"Which is MORE: 14 or 17?","choices":["14","17","same","10"],"answer":"17","skill":"compare-teens","unitHint":"k-counting"},
  {"id":"d56-4","type":"mc","prompt":"5 − 2 = ?","choices":["2","3","7","8"],"answer":"3","skill":"sub-within-10","unitHint":"k-add-sub"},
  {"id":"d56-5","type":"mc","prompt":"A cube has how many faces?","choices":["4","5","6","8"],"answer":"6","skill":"shapes-3d","unitHint":"k-shapes"},
  {"id":"d56-6","type":"mc","prompt":"14 is 10 + ?","choices":["1","4","10","14"],"answer":"4","skill":"teen-numbers","unitHint":"k-counting"},
  {"id":"d56-7","type":"mc","prompt":"Half past means the long hand is on…","choices":["12","3","6","9"],"answer":"6","skill":"time-half-hour","unitHint":"k-measurement"},
  {"id":"d56-8","type":"mc","prompt":"2 nickels = ?","choices":["2¢","5¢","10¢","20¢"],"answer":"10¢","skill":"coin-combos","unitHint":"k-measurement"},
  {"id":"d56-9","type":"mc","prompt":"9 cats, 6 dogs. How many more cats?","choices":["3","15","6","9"],"answer":"3","skill":"word-compare","unitHint":"k-word-problems"},
  {"id":"d56-10","type":"mc","prompt":"A five-bundle tally equals?","choices":["4","5","6","9"],"answer":"5","skill":"tally","unitHint":"k-data"},
]

BLURB = "Counting & teens, compose/decompose, add/sub, time & coins, stories, patterns, data & 3D shapes — ~29 playable lessons."
