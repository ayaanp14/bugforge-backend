import type { AptitudeSeed } from "./types.js";

/** Mathematical reasoning: clocks, calendars, data sufficiency and deduction. */
export const BANK_MATH_REASONING: AptitudeSeed[] = [
  {
    slug: "mr2-clock-angle-4-20",
    topic: "mathematical-reasoning",
    title: "Angle between the hands at 4:20",
    prompt: "What is the **angle between the hour and minute hands** at **4:20**?",
    options: ["0°", "10°", "20°", "30°"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "Use |30H − 5.5M| with H = 4 and M = 20.",
      "The hour hand has moved a third of the way past 4.",
    ],
    solution:
      "1. Angle = |30 × 4 − 5.5 × 20| = |120 − 110| = **10°**.\n2. (The minute hand is at 120°; the hour hand is at 120 + 10 = 130°.)\n\nAnswer: **10°**.",
    approach:
      "The formula |30H − 5.5M| covers every case. If the result exceeds 180°, subtract it from 360° to get the smaller angle.",
    tags: ["clocks"],
    timeTargetSec: 60,
  },
  {
    slug: "mr2-clock-angle-7-20",
    topic: "mathematical-reasoning",
    title: "Angle at 7:20",
    prompt: "What is the **angle between the hands** of a clock at **7:20**?",
    options: ["90°", "100°", "110°", "120°"],
    answer: 1,
    difficulty: "medium",
    hints: ["Apply |30H − 5.5M| with H = 7 and M = 20.", "|210 − 110|."],
    solution: "1. Angle = |30 × 7 − 5.5 × 20| = |210 − 110| = **100°**.\n\nAnswer: **100°**.",
    approach: "Remember that the hour hand drifts 0.5° per minute, which is exactly what the 5.5 in the formula accounts for.",
    tags: ["clocks"],
    timeTargetSec: 60,
  },
  {
    slug: "mr2-clock-hands-together",
    topic: "mathematical-reasoning",
    title: "When the hands coincide",
    prompt: "How many times do the **hands of a clock coincide** in **24 hours**?",
    options: ["20", "22", "24", "44"],
    answer: 1,
    difficulty: "hard",
    hints: [
      "In 12 hours the hands coincide 11 times, not 12.",
      "Between 11 and 1 there is only one coincidence, at 12 o'clock.",
    ],
    solution:
      "1. In 12 hours the hands coincide 11 times — the expected 12 minus one, because there is no separate coincidence between 11 and 12.\n2. Over 24 hours that is 2 × 11 = **22**.\n\nAnswer: **22**.",
    approach:
      "The hands coincide 11 times in 12 hours and are opposite 11 times too. Both counts are one less than the naive answer for the same reason.",
    tags: ["clocks"],
    timeTargetSec: 90,
  },
  {
    slug: "mr2-clock-right-angle",
    topic: "mathematical-reasoning",
    title: "Right angles in a day",
    prompt: "How many times in **24 hours** are the hands of a clock at **right angles**?",
    options: ["22", "24", "44", "48"],
    answer: 2,
    difficulty: "hard",
    hints: [
      "In 12 hours the hands are at right angles 22 times.",
      "That is two per hour, minus the two lost around 3 and 9.",
    ],
    solution:
      "1. In 12 hours the hands form a right angle 22 times.\n2. Over 24 hours that is 2 × 22 = **44**.\n\nAnswer: **44**.",
    approach: "The pattern to remember: in 12 hours the hands coincide 11 times, oppose 11 times and form right angles 22 times.",
    tags: ["clocks"],
    timeTargetSec: 90,
  },
  {
    slug: "mr2-clock-gains",
    topic: "mathematical-reasoning",
    title: "A clock that gains time",
    prompt:
      "A clock **gains 5 minutes every hour**. If it is set correctly at **8 a.m.**, what will it show when the correct time is **2 p.m.**?",
    options: ["2:20 p.m.", "2:25 p.m.", "2:30 p.m.", "2:35 p.m."],
    answer: 2,
    difficulty: "medium",
    hints: ["Six hours pass between 8 a.m. and 2 p.m.", "The clock gains 5 minutes in each of them."],
    solution:
      "1. From 8 a.m. to 2 p.m. is 6 hours.\n2. The clock gains 5 × 6 = 30 minutes.\n3. It will show **2:30 p.m.**\n\nAnswer: **2:30 p.m.**",
    approach: "Multiply the gain per hour by the hours elapsed, then add. A losing clock works the same way with a subtraction.",
    tags: ["clocks"],
    timeTargetSec: 60,
  },
  {
    slug: "mr2-calendar-odd-days",
    topic: "mathematical-reasoning",
    title: "The day after a hundred days",
    prompt: "If today is **Monday**, what day will it be after **61 days**?",
    options: ["Friday", "Saturday", "Sunday", "Monday"],
    answer: 1,
    difficulty: "easy",
    hints: ["Divide 61 by 7 and keep the remainder.", "61 = 8 × 7 + 5."],
    solution:
      "1. 61 ÷ 7 = 8 remainder 5, so 5 odd days.\n2. Five days after Monday: Tuesday, Wednesday, Thursday, Friday, **Saturday**.\n\nAnswer: **Saturday**.",
    approach: "Only the remainder on division by 7 matters. Count that many days forward from the given day.",
    tags: ["calendar"],
    timeTargetSec: 50,
  },
  {
    slug: "mr2-calendar-same-date-next-year",
    topic: "mathematical-reasoning",
    title: "The same date a year later",
    prompt:
      "If **15 March 2027** is a **Monday**, what day will **15 March 2028** be? (2028 is a leap year.)",
    options: ["Tuesday", "Wednesday", "Thursday", "Friday"],
    answer: 1,
    difficulty: "hard",
    hints: [
      "The stretch from March 2027 to March 2028 includes 29 February 2028.",
      "That makes 366 days, which is 2 odd days.",
    ],
    solution:
      "1. From 15 March 2027 to 15 March 2028 spans 366 days, because 29 February 2028 falls inside it.\n2. 366 ÷ 7 leaves a remainder of 2.\n3. Two days after Monday is **Wednesday**.\n\nAnswer: **Wednesday**.",
    approach:
      "An ordinary year advances the weekday by 1 and a leap year by 2. What matters is whether 29 February falls inside the interval, not which year is a leap year.",
    tags: ["calendar"],
    timeTargetSec: 105,
  },
  {
    slug: "mr2-calendar-month-later",
    topic: "mathematical-reasoning",
    title: "A month later",
    prompt: "If **10 June** is a **Wednesday**, what day is **10 July** of the same year?",
    options: ["Thursday", "Friday", "Saturday", "Sunday"],
    answer: 1,
    difficulty: "medium",
    hints: ["June has 30 days.", "30 = 4 × 7 + 2, so two odd days."],
    solution:
      "1. From 10 June to 10 July is 30 days.\n2. 30 ÷ 7 leaves 2, so advance two days from Wednesday.\n3. That gives **Friday**.\n\nAnswer: **Friday**.",
    approach: "Month lengths give the odd days directly: a 30-day month advances 2, a 31-day month advances 3, and February advances 0 or 1.",
    tags: ["calendar"],
    timeTargetSec: 60,
  },
  {
    slug: "mr2-calendar-days-before",
    topic: "mathematical-reasoning",
    title: "Counting backwards",
    prompt: "If today is **Thursday**, what day was it **45 days ago**?",
    options: ["Monday", "Tuesday", "Wednesday", "Friday"],
    answer: 0,
    difficulty: "medium",
    hints: ["45 ÷ 7 leaves a remainder of 3.", "Count three days backwards from Thursday."],
    solution:
      "1. 45 = 6 × 7 + 3, so there are 3 odd days.\n2. Counting back from Thursday: Wednesday (1), Tuesday (2), Monday (3).\n3. The day was **Monday**.\n\nAnswer: **Monday**.",
    approach: "Going backwards, subtract the odd days instead of adding them.",
    tags: ["calendar"],
    timeTargetSec: 60,
  },
  {
    slug: "mr2-data-sufficiency-age",
    topic: "mathematical-reasoning",
    title: "Data sufficiency: how old is Ravi",
    prompt:
      "**Question:** What is Ravi's age?\n\n**Statement I:** Ravi is 8 years younger than his brother.\n**Statement II:** Ravi's brother will be 30 in five years.\n\nWhich statements are needed?",
    options: [
      "I alone is sufficient",
      "II alone is sufficient",
      "Both together are needed",
      "Even both together are not sufficient",
    ],
    answer: 2,
    difficulty: "medium",
    hints: ["Test each statement on its own before combining them.", "I gives a relation; II gives the brother's age."],
    solution:
      "1. I alone: a relation but no number — not sufficient.\n2. II alone: the brother is 25 now, but nothing links that to Ravi — not sufficient.\n3. Together: brother 25, so Ravi is 17. **Both together are needed**.\n\nAnswer: **Both together are needed**.",
    approach:
      "Evaluate each statement in isolation first, carrying nothing across. The question asks about sufficiency, not the value itself.",
    tags: ["data sufficiency"],
    timeTargetSec: 90,
  },
  {
    slug: "mr2-data-sufficiency-one-enough",
    topic: "mathematical-reasoning",
    title: "Data sufficiency: the area",
    prompt:
      "**Question:** What is the area of a square?\n\n**Statement I:** Its perimeter is 40 cm.\n**Statement II:** Its diagonal is 10√2 cm.\n\nWhich statements are sufficient?",
    options: [
      "I alone only",
      "II alone only",
      "Either I or II alone is sufficient",
      "Both together are needed",
    ],
    answer: 2,
    difficulty: "medium",
    hints: [
      "A square is determined by any single measurement.",
      "Perimeter 40 gives side 10; diagonal 10√2 also gives side 10.",
    ],
    solution:
      "1. I alone: perimeter 40 → side 10 → area 100. Sufficient.\n2. II alone: diagonal 10√2 → side 10 → area 100. Also sufficient.\n3. So **either statement alone is sufficient**.\n\nAnswer: **Either I or II alone is sufficient**.",
    approach:
      "When each statement independently pins the answer down, the correct choice is 'either alone'. Check both separately rather than stopping at the first.",
    tags: ["data sufficiency"],
    timeTargetSec: 90,
  },
  {
    slug: "mr2-data-sufficiency-insufficient",
    topic: "mathematical-reasoning",
    title: "Data sufficiency: not enough",
    prompt:
      "**Question:** What is the value of x?\n\n**Statement I:** x is an even number.\n**Statement II:** x is greater than 4 and less than 10.\n\nWhich statements are sufficient?",
    options: [
      "I alone is sufficient",
      "II alone is sufficient",
      "Both together are sufficient",
      "Even both together are not sufficient",
    ],
    answer: 3,
    difficulty: "medium",
    hints: [
      "Combine the two statements and list every value that fits.",
      "6 and 8 both satisfy both conditions.",
    ],
    solution:
      "1. I alone: infinitely many even numbers — not sufficient.\n2. II alone: 5, 6, 7, 8 or 9 — not sufficient.\n3. Together: x could be 6 or 8, so the value is still not fixed.\n4. **Even both together are not sufficient**.\n\nAnswer: **Even both together are not sufficient**.",
    approach:
      "Sufficiency needs a unique answer. If two values survive both statements, the data is insufficient however much it narrows things.",
    tags: ["data sufficiency"],
    timeTargetSec: 90,
  },
  {
    slug: "mr2-statement-assumption-advert",
    topic: "mathematical-reasoning",
    title: "Statement and assumption",
    prompt:
      "**Statement:** *'Enrol in our institute and secure a government job.'*\n\n**Assumptions:**\nI. People are interested in government jobs.\nII. No one can get a government job without this institute.\n\nWhich assumption is implicit?",
    options: ["Only I", "Only II", "Both", "Neither"],
    answer: 0,
    difficulty: "medium",
    hints: [
      "An assumption is what the statement takes for granted to make sense.",
      "Would the advertisement work if nobody wanted such a job?",
    ],
    solution:
      "1. The claim only appeals if government jobs are desirable, so **I is implicit**.\n2. Claiming the institute is the *only* route is far stronger than the statement requires, so II is not implicit.\n\nAnswer: **Only I**.",
    approach:
      "An implicit assumption must be necessary for the statement to hold. Options containing 'only', 'always' or 'never' are almost always too strong.",
    tags: ["assumptions"],
    timeTargetSec: 90,
  },
  {
    slug: "mr2-statement-conclusion",
    topic: "mathematical-reasoning",
    title: "Statement and conclusion",
    prompt:
      "**Statement:** *'The company has decided to increase the salaries of all its employees by 15% from next month.'*\n\n**Conclusions:**\nI. The company has the funds to pay higher salaries.\nII. All employees will now be satisfied.\n\nWhich conclusion follows?",
    options: ["Only I", "Only II", "Both", "Neither"],
    answer: 0,
    difficulty: "medium",
    hints: [
      "A decision to pay more implies the means to do so.",
      "Satisfaction is a prediction about people, not a consequence of the decision.",
    ],
    solution:
      "1. Deciding on a rise implies the company can afford it: **I follows**.\n2. Whether every employee is satisfied cannot be concluded from a pay rise alone: II does not follow.\n\nAnswer: **Only I**.",
    approach:
      "A conclusion must follow from the statement itself, not from plausible expectations about how people will react.",
    tags: ["conclusions"],
    timeTargetSec: 90,
  },
  {
    slug: "mr2-cause-and-effect",
    topic: "mathematical-reasoning",
    title: "Cause and effect",
    prompt:
      "**Statements:**\nI. The government has raised the price of petrol sharply.\nII. Sales of electric scooters have risen this quarter.\n\nWhich best describes the relation?",
    options: [
      "I is the cause and II is its effect",
      "II is the cause and I is its effect",
      "Both are independent causes",
      "Both are effects of a common cause",
    ],
    answer: 0,
    difficulty: "medium",
    hints: [
      "Ask which event could plausibly bring about the other.",
      "Higher fuel prices push buyers towards alternatives.",
    ],
    solution:
      "1. A sharp rise in petrol prices makes petrol vehicles costlier to run.\n2. That pushes buyers towards electric alternatives, so sales rise.\n3. **I is the cause and II is its effect**.\n\nAnswer: **I is the cause and II is its effect**.",
    approach:
      "Check the direction of plausibility and the timing. Scooter sales cannot raise petrol prices, which rules out the reverse reading.",
    tags: ["cause and effect"],
    timeTargetSec: 90,
  },
  {
    slug: "mr2-course-of-action",
    topic: "mathematical-reasoning",
    title: "Course of action",
    prompt:
      "**Statement:** *'Many students fail mathematics every year in this school.'*\n\n**Courses of action:**\nI. The school should arrange extra coaching in mathematics.\nII. The school should stop teaching mathematics.\n\nWhich course of action follows?",
    options: ["Only I", "Only II", "Both", "Neither"],
    answer: 0,
    difficulty: "easy",
    hints: [
      "A sensible course of action addresses the problem rather than abandoning it.",
      "Dropping the subject is not a remedy.",
    ],
    solution:
      "1. Extra coaching directly addresses the failures: **I follows**.\n2. Stopping the subject avoids the problem rather than solving it, and is not practical.\n\nAnswer: **Only I**.",
    approach: "A valid course of action must be both relevant to the problem and reasonable to carry out. Extreme responses almost never qualify.",
    tags: ["course of action"],
    timeTargetSec: 75,
  },
  {
    slug: "mr2-number-puzzle-sum-product",
    topic: "mathematical-reasoning",
    title: "Sum and product",
    prompt: "Two numbers have a **sum of 15** and a **product of 56**. What is the **difference** between them?",
    options: ["1", "3", "5", "7"],
    answer: 0,
    difficulty: "medium",
    hints: [
      "Find two numbers that multiply to 56 and add to 15.",
      "7 and 8 fit both conditions.",
    ],
    solution:
      "1. Factor pairs of 56: (1, 56), (2, 28), (4, 14), (7, 8).\n2. Only 7 and 8 add to 15.\n3. Their difference is **1**.\n\nAnswer: **1**.",
    approach:
      "List factor pairs rather than solving a quadratic. Algebraically, (a − b)² = (a + b)² − 4ab = 225 − 224 = 1, giving the same answer.",
    tags: ["number puzzle"],
    timeTargetSec: 75,
  },
  {
    slug: "mr2-number-puzzle-two-digit",
    topic: "mathematical-reasoning",
    title: "Reversing a two-digit number",
    prompt:
      "A **two-digit number** has digits summing to **9**. **Reversing the digits** gives a number **27 less** than the original. What is the number?",
    options: ["45", "54", "63", "72"],
    answer: 2,
    difficulty: "hard",
    hints: [
      "Let the digits be t and u, so the number is 10t + u.",
      "Reversal changes the value by 9(t − u), and here that difference is 27.",
    ],
    solution:
      "1. Let the number be 10t + u with t + u = 9.\n2. Original − reversed = (10t + u) − (10u + t) = 9(t − u) = 27, so t − u = 3.\n3. Solving t + u = 9 and t − u = 3 gives t = 6, u = 3.\n4. The number is **63**.\n\nAnswer: **63**.",
    approach:
      "Reversing a two-digit number always changes it by 9 times the difference of the digits. That fact turns the puzzle into two simple equations.",
    tags: ["number puzzle"],
    timeTargetSec: 120,
  },
  {
    slug: "mr2-number-puzzle-consecutive",
    topic: "mathematical-reasoning",
    title: "Three consecutive integers",
    prompt: "The **sum of three consecutive integers is 72**. What is the **largest** of them?",
    options: ["23", "24", "25", "26"],
    answer: 2,
    difficulty: "easy",
    hints: ["The middle number is the average.", "72 ÷ 3 = 24."],
    solution:
      "1. The middle integer = 72 ÷ 3 = 24.\n2. The three integers are 23, 24, 25.\n3. The largest is **25**.\n\nAnswer: **25**.",
    approach: "For an odd count of consecutive numbers, the average is the middle term. No algebra is needed.",
    tags: ["number puzzle"],
    timeTargetSec: 45,
  },
  {
    slug: "mr2-venn-two-sets",
    topic: "mathematical-reasoning",
    title: "Two subjects",
    prompt:
      "In a class of **60 students**, **35 study physics**, **30 study chemistry** and **15 study both**. How many study **neither**?",
    options: ["5", "10", "15", "20"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "Students studying at least one = 35 + 30 − 15.",
      "Subtract that from the class total.",
    ],
    solution:
      "1. At least one subject = 35 + 30 − 15 = 50.\n2. Neither = 60 − 50 = **10**.\n\nAnswer: **10**.",
    approach: "Add the two groups and subtract the overlap once, then take the complement. Forgetting to remove the overlap gives 65, which is impossible.",
    tags: ["set theory"],
    timeTargetSec: 75,
  },
  {
    slug: "mr2-venn-only-one",
    topic: "mathematical-reasoning",
    title: "Only one of the two",
    prompt:
      "Of **100 people**, **60 read newspaper A**, **45 read newspaper B** and **20 read both**. How many read **exactly one** newspaper?",
    options: ["55", "65", "75", "85"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "Only A = 60 − 20 and only B = 45 − 20.",
      "Add those two figures.",
    ],
    solution:
      "1. Only A = 60 − 20 = 40; only B = 45 − 20 = 25.\n2. Exactly one = 40 + 25 = **65**.\n\nAnswer: **65**.",
    approach: "'Exactly one' removes the overlap from both groups, so it is the union minus the intersection: 85 − 20 = 65.",
    tags: ["set theory"],
    timeTargetSec: 75,
  },
  {
    slug: "mr2-venn-three-sets",
    topic: "mathematical-reasoning",
    title: "Three sports",
    prompt:
      "In a group, **30 play cricket**, **25 play football** and **20 play both**. How many play **at least one** of the two?",
    options: ["30", "35", "45", "55"],
    answer: 1,
    difficulty: "easy",
    hints: ["Union = 30 + 25 − 20.", "Subtract the overlap once."],
    solution: "1. At least one = 30 + 25 − 20 = **35**.\n\nAnswer: **35**.",
    approach: "The union of two sets is the sum minus the intersection. Adding without subtracting counts the overlap twice.",
    tags: ["set theory"],
    timeTargetSec: 50,
  },
  {
    slug: "mr2-logical-deduction-boxes",
    topic: "mathematical-reasoning",
    title: "Which box holds the prize",
    prompt:
      "Three boxes are labelled A, B and C, and exactly one holds a prize. **Box A says 'the prize is not here'**, **Box B says 'the prize is here'**, and **Box C says 'the prize is not in B'**. If **exactly one statement is true**, where is the prize?",
    options: ["Box A", "Box B", "Box C", "Cannot be determined"],
    answer: 0,
    difficulty: "hard",
    hints: [
      "Test each possibility and count how many statements come out true.",
      "If the prize is in A: A's statement is false, B's is false, C's is true — exactly one.",
    ],
    solution:
      "1. Prize in A: A false, B false, C true → 1 true. ✓\n2. Prize in B: A true, B true, C false → 2 true. ✗\n3. Prize in C: A true, B false, C true → 2 true. ✗\n4. Only the first case gives exactly one true statement, so the prize is in **Box A**.\n\nAnswer: **Box A**.",
    approach:
      "Test each case exhaustively against the constraint. Counting the true statements per case is faster than reasoning about the statements directly.",
    tags: ["deduction"],
    timeTargetSec: 135,
  },
  {
    slug: "mr2-logical-deduction-liars",
    topic: "mathematical-reasoning",
    title: "Who is telling the truth",
    prompt:
      "**A says 'B is lying'**, and **B says 'C is lying'**, while **C says 'both A and B are lying'**. Who is telling the **truth**?",
    options: ["A only", "B only", "C only", "A and C"],
    answer: 1,
    difficulty: "hard",
    hints: [
      "Try assuming A is truthful and follow it through to a contradiction.",
      "Then try assuming A is lying, which forces B to be truthful.",
    ],
    solution:
      "1. Suppose A is truthful. Then B lies, so C's statement 'C is lying' being false means C is truthful. But C claims A and B both lie, contradicting A being truthful. ✗\n2. Suppose A is lying. Then B is truthful, so C is lying.\n3. Check C: C claims A and B both lie. A does lie but B does not, so C's claim is false — consistent with C lying. ✓\n4. The consistent assignment is A lying, B truthful, C lying, so **B only** tells the truth.\n\nAnswer: **B only**.",
    approach:
      "Assume each person truthful in turn and follow the consequences until a contradiction appears. Exactly one assignment should survive.",
    tags: ["deduction"],
    timeTargetSec: 150,
  },
  {
    slug: "mr2-pattern-matchsticks",
    topic: "mathematical-reasoning",
    title: "Matchsticks in a pattern",
    prompt:
      "Squares are built in a row from matchsticks: **1 square needs 4 sticks**, **2 squares need 7**, and **3 squares need 10**. How many sticks are needed for **10 squares**?",
    options: ["28", "31", "34", "40"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "Each extra square adds 3 sticks, not 4, because a side is shared.",
      "The rule is 3n + 1.",
    ],
    solution:
      "1. The counts go 4, 7, 10 — rising by 3 each time.\n2. The formula is 3n + 1.\n3. For 10 squares: 3 × 10 + 1 = **31**.\n\nAnswer: **31**.",
    approach:
      "Find the constant increment first, then fit the linear rule an + b using one known value. Multiplying 4 by 10 ignores the shared sides.",
    tags: ["pattern"],
    timeTargetSec: 75,
  },
  {
    slug: "mr2-cubes-painted",
    topic: "mathematical-reasoning",
    title: "A painted cube cut up",
    prompt:
      "A cube is painted on all faces and then cut into **27 smaller cubes** of equal size. How many small cubes have **exactly two faces painted**?",
    options: ["6", "8", "12", "18"],
    answer: 2,
    difficulty: "hard",
    hints: [
      "27 small cubes means a 3 × 3 × 3 arrangement.",
      "Two painted faces means the cube sits on an edge but not at a corner.",
    ],
    solution:
      "1. 27 cubes form a 3 × 3 × 3 block.\n2. Cubes with exactly two painted faces sit along the edges, excluding the corners.\n3. A cube has 12 edges, and each contributes 3 − 2 = 1 such small cube.\n4. Total = **12**.\n\nAnswer: **12**.",
    approach:
      "For an n × n × n painted cube: 8 corners have three faces painted, 12(n − 2) edge cubes have two, 6(n − 2)² face cubes have one, and (n − 2)³ have none.",
    tags: ["cubes"],
    timeTargetSec: 120,
  },
  {
    slug: "mr2-cubes-one-face",
    topic: "mathematical-reasoning",
    title: "Cubes with one painted face",
    prompt:
      "A painted cube is cut into **64 equal smaller cubes**. How many have **exactly one face painted**?",
    options: ["8", "16", "24", "36"],
    answer: 2,
    difficulty: "hard",
    hints: [
      "64 small cubes means a 4 × 4 × 4 block.",
      "One painted face means the cube sits in the middle of a face: 6(n − 2)².",
    ],
    solution:
      "1. 64 cubes form a 4 × 4 × 4 block, so n = 4.\n2. Cubes with one painted face = 6(n − 2)² = 6 × 4 = **24**.\n\nAnswer: **24**.",
    approach: "Apply the standard formulas rather than counting. For n = 4: 8 corners, 24 edges, 24 faces and 8 hidden cubes, totalling 64. ✓",
    tags: ["cubes"],
    timeTargetSec: 105,
  },
  {
    slug: "mr2-arrangement-handshake",
    topic: "mathematical-reasoning",
    title: "Matches in a tournament",
    prompt:
      "In a tournament where **every team plays every other team once**, **45 matches** are played. How many **teams** took part?",
    options: ["9", "10", "11", "12"],
    answer: 1,
    difficulty: "medium",
    hints: ["Matches = C(n, 2) = n(n − 1)/2.", "n(n − 1) = 90."],
    solution: "1. n(n − 1)/2 = 45 → n(n − 1) = 90.\n2. 10 × 9 = 90, so n = **10**.\n\nAnswer: **10**.",
    approach: "Round-robin matches, handshakes and lines between points all count pairs, so all are C(n,2).",
    tags: ["counting"],
    timeTargetSec: 60,
  },
  {
    slug: "mr2-average-speed-reasoning",
    topic: "mathematical-reasoning",
    title: "Reasoning about an average",
    prompt:
      "A student's average across **4 tests is 80**. What is the **lowest possible score** on any one test, if each test is marked out of **100**?",
    options: ["20", "40", "60", "80"],
    answer: 0,
    difficulty: "hard",
    hints: [
      "The four scores total 320.",
      "To make one as low as possible, make the other three as high as possible.",
    ],
    solution:
      "1. Total across four tests = 4 × 80 = 320.\n2. To minimise one score, maximise the rest: 100 + 100 + 100 = 300.\n3. The lowest score = 320 − 300 = **20**.\n\nAnswer: **20**.",
    approach:
      "Extreme-value questions push every other quantity to its limit. Fix the total first, then push the others to their maximum.",
    tags: ["extremes"],
    timeTargetSec: 105,
  },
  {
    slug: "mr2-inequality-reasoning",
    topic: "mathematical-reasoning",
    title: "Reading a chain of inequalities",
    prompt:
      "If **A > B**, **B > C**, **C = D** and **D > E**, which of the following is **definitely true**?",
    options: ["A > E", "E > B", "C > A", "B = D"],
    answer: 0,
    difficulty: "medium",
    hints: ["Chain the relations into a single line.", "A > B > C = D > E."],
    solution:
      "1. The chain reads A > B > C = D > E.\n2. So A > E is definitely true.\n3. The others contradict the chain or are not forced by it.\n\nAnswer: **A > E**.",
    approach:
      "Write all the relations as one chain. A conclusion is safe only if every link between the two terms points the same way.",
    tags: ["inequalities"],
    timeTargetSec: 75,
  },
  {
    slug: "mr2-inequality-not-determined",
    topic: "mathematical-reasoning",
    title: "When nothing follows",
    prompt:
      "If **P ≥ Q**, **Q > R** and **S < R**, which of the following is **definitely true**?",
    options: ["P > S", "S > Q", "P = R", "Q < S"],
    answer: 0,
    difficulty: "medium",
    hints: ["Chain them: P ≥ Q > R > S.", "Any strict inequality in the chain makes the ends strictly ordered."],
    solution:
      "1. The chain is P ≥ Q > R > S.\n2. Since at least one link is strict, P > S definitely holds.\n3. The other options reverse the chain or claim equality that is not forced.\n\nAnswer: **P > S**.",
    approach:
      "A mixture of ≥ and > still yields a strict conclusion, provided at least one link is strict. All links being ≥ would only give ≥.",
    tags: ["inequalities"],
    timeTargetSec: 75,
  },
];
