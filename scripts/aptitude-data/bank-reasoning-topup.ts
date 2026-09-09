import type { AptitudeSeed } from "./types.js";

/** Further syllogisms, arrangement puzzles, sentence completion and caselets. */

const SALES_TABLE = `| Region | Q1  | Q2  | Q3  | Q4  |
|--------|-----|-----|-----|-----|
| North  | 120 | 140 | 160 | 180 |
| South  | 200 | 160 | 180 | 220 |
| East   | 90  | 110 | 130 | 170 |
| West   | 150 | 170 | 150 | 190 |`;

export const BANK_REASONING_TOPUP: AptitudeSeed[] = [
  /* ── Syllogisms ────────────────────────────────────────────────── */
  {
    slug: "sy3-all-metals-conductors",
    topic: "syllogisms",
    title: "All metals are conductors",
    prompt:
      "**Statements:**\n1. All metals are conductors.\n2. Copper is a metal.\n\n**Conclusions:**\nI. Copper is a conductor.\nII. All conductors are metals.\n\nWhich conclusion follows?",
    options: ["Only I", "Only II", "Both", "Neither"],
    answer: 0,
    difficulty: "easy",
    hints: ["Copper sits inside the metals, which sit inside the conductors.", "The second conclusion reverses an 'all'."],
    solution:
      "1. Copper ⊂ metals ⊂ conductors, so copper is a conductor: **I follows**.\n2. II reverses statement 1 and is invalid.\n\nAnswer: **Only I**.",
    approach: "A named individual inside a class inherits everything true of that class. Reversal remains invalid however obvious it may seem.",
    tags: ["venn"],
    timeTargetSec: 60,
  },
  {
    slug: "sy3-some-chairs-tables",
    topic: "syllogisms",
    title: "Some chairs are tables",
    prompt:
      "**Statements:**\n1. Some chairs are tables.\n2. All tables are wooden.\n\n**Conclusions:**\nI. Some chairs are wooden.\nII. All wooden things are tables.\n\nWhich conclusion follows?",
    options: ["Only I", "Only II", "Both", "Neither"],
    answer: 0,
    difficulty: "medium",
    hints: ["The chairs that are tables must be wooden.", "The second conclusion reverses an 'all'."],
    solution:
      "1. Some chairs are tables and all tables are wooden, so those chairs are wooden: **I follows**.\n2. II reverses statement 2 and does not follow.\n\nAnswer: **Only I**.",
    approach: "'Some A are B' plus 'all B are C' always yields 'some A are C'. Nothing stronger and nothing reversed.",
    tags: ["some/all"],
    timeTargetSec: 60,
  },
  {
    slug: "sy3-no-fish-mammals",
    topic: "syllogisms",
    title: "No fish is a mammal",
    prompt:
      "**Statements:**\n1. No fish is a mammal.\n2. All whales are mammals.\n\n**Conclusions:**\nI. No whale is a fish.\nII. Some mammals are whales.\n\nWhich conclusion follows?",
    options: ["Only I", "Only II", "Both", "Neither"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "Whales sit inside mammals, which is entirely separate from fish.",
      "And since whales exist, some mammals are whales.",
    ],
    solution:
      "1. Whales ⊂ mammals, and mammals exclude fish entirely, so no whale is a fish: **I follows**.\n2. Whales exist and are mammals, so some mammals are whales: **II follows**.\n\nAnswer: **Both**.",
    approach: "'All A are B' plus 'no B is C' gives the strong 'no A is C'. It is one of the few combinations that supports a universal negative.",
    tags: ["negative"],
    timeTargetSec: 75,
  },
  {
    slug: "sy3-all-poets-writers",
    topic: "syllogisms",
    title: "Poets and writers",
    prompt:
      "**Statements:**\n1. All poets are writers.\n2. Some writers are journalists.\n\n**Conclusions:**\nI. Some poets are journalists.\nII. Some journalists are writers.\n\nWhich conclusion follows?",
    options: ["Only I", "Only II", "Both", "Neither"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "The journalist writers need not be poets.",
      "Conclusion II simply reverses a 'some' statement, which is always allowed.",
    ],
    solution:
      "1. The writers who are journalists may all lie outside the poets, so I does not follow.\n2. 'Some writers are journalists' reverses to 'some journalists are writers': **II follows**.\n\nAnswer: **Only II**.",
    approach: "'Some' statements are symmetric and may always be reversed. 'All' statements never may.",
    tags: ["some/all"],
    timeTargetSec: 75,
  },
  {
    slug: "sy3-all-a-b-all-c-b",
    topic: "syllogisms",
    title: "Two classes inside a third",
    prompt:
      "**Statements:**\n1. All cats are animals.\n2. All dogs are animals.\n\n**Conclusions:**\nI. Some cats are dogs.\nII. No cat is a dog.\n\nWhich conclusion follows?",
    options: ["Only I", "Only II", "Either I or II", "Neither"],
    answer: 2,
    difficulty: "hard",
    hints: [
      "Both classes sit inside animals, but nothing fixes how they relate to each other.",
      "The two conclusions are contradictory and cover every possibility.",
    ],
    solution:
      "1. Cats and dogs both sit inside animals, but the statements say nothing about their overlap.\n2. Neither conclusion is proved on its own.\n3. They are contradictory and exhaust every case, so **either I or II** holds.\n\nAnswer: **Either I or II**.",
    approach:
      "When two conclusions are contradictory and between them cover all possibilities, the answer is 'either/or'. Look for that pair whenever neither follows alone.",
    tags: ["either or"],
    timeTargetSec: 105,
  },
  {
    slug: "sy3-only-a-few",
    topic: "syllogisms",
    title: "All pens are red",
    prompt:
      "**Statements:**\n1. All pens are red.\n2. No red thing is heavy.\n\n**Conclusions:**\nI. No pen is heavy.\nII. Some heavy things are pens.\n\nWhich conclusion follows?",
    options: ["Only I", "Only II", "Both", "Neither"],
    answer: 0,
    difficulty: "medium",
    hints: [
      "Pens sit inside red things, which are entirely separate from heavy things.",
      "The second conclusion directly contradicts the first.",
    ],
    solution:
      "1. Pens ⊂ red, and red excludes heavy, so no pen is heavy: **I follows**.\n2. II contradicts that, so it cannot follow.\n\nAnswer: **Only I**.",
    approach: "When one conclusion is proved, any conclusion contradicting it is automatically false. That check is quicker than testing it separately.",
    tags: ["negative"],
    timeTargetSec: 75,
  },
  {
    slug: "sy3-chain-with-some",
    topic: "syllogisms",
    title: "A chain broken by 'some'",
    prompt:
      "**Statements:**\n1. Some doctors are teachers.\n2. Some teachers are singers.\n\n**Conclusions:**\nI. Some doctors are singers.\nII. Some singers are teachers.\n\nWhich conclusion follows?",
    options: ["Only I", "Only II", "Both", "Neither"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "Two 'some' statements never chain into a definite conclusion.",
      "But conclusion II is just statement 2 reversed.",
    ],
    solution:
      "1. Two 'some' premises prove nothing about doctors and singers, so I does not follow.\n2. 'Some teachers are singers' reverses to 'some singers are teachers': **II follows**.\n\nAnswer: **Only II**.",
    approach: "Two 'some' statements never combine. Check whether a conclusion is simply one premise restated — that is always valid for 'some'.",
    tags: ["some/all"],
    timeTargetSec: 75,
  },

  /* ── Seating & Arrangement ─────────────────────────────────────── */
  {
    slug: "sa3-six-in-a-row",
    topic: "seating-arrangement",
    title: "Six in a row",
    prompt:
      "Six people sit in a row. **A is at one end**, **B is next to A**, **C is at the other end**, and **D is next to C**. If **E sits between B and F**, who sits **third from A's end**?",
    options: ["D", "E", "F", "B"],
    answer: 1,
    difficulty: "hard",
    hints: [
      "Number the seats 1 to 6 with A at seat 1 and C at seat 6.",
      "B takes seat 2 and D takes seat 5, leaving seats 3 and 4 for E and F.",
    ],
    solution:
      "1. A = 1, C = 6, B = 2 (next to A), D = 5 (next to C).\n2. Seats 3 and 4 remain for E and F.\n3. E sits between B and F, so E must be nearer B: E = 3 and F = 4.\n4. Third from A's end is seat 3, which is **E**.\n\nAnswer: **E**.",
    approach: "Place the ends and their neighbours first, then use the 'between' clue to order the remaining pair.",
    tags: ["linear"],
    timeTargetSec: 105,
  },
  {
    slug: "sa3-circle-five",
    topic: "seating-arrangement",
    title: "Five around a table",
    prompt:
      "Five people sit around a circular table **facing the centre**. **P is between Q and R**, and **S is between R and T**. Who sits between **T and Q**?",
    options: ["P", "R", "S", "Nobody"],
    answer: 3,
    difficulty: "hard",
    hints: [
      "Write the order round the circle from the clues.",
      "Q, P, R gives one stretch; R, S, T gives the next.",
    ],
    solution:
      "1. P between Q and R gives the stretch Q–P–R.\n2. S between R and T extends it to Q–P–R–S–T.\n3. Closing the circle, T sits next to Q, so **nobody** sits between them.\n4. Reading the completed circle Q–P–R–S–T–Q, the only person adjacent to both T and Q is nobody.\n\nAnswer: **Nobody**.",
    approach: "Build one continuous chain from the clues, then close it into a circle. The remaining adjacency falls out automatically.",
    tags: ["circular"],
    timeTargetSec: 120,
  },
  {
    slug: "sa3-rank-from-both-ends-2",
    topic: "seating-arrangement",
    title: "Class size from two ranks",
    prompt:
      "In a class, a student is **9th from the top** and **26th from the bottom**. How many students are in the class?",
    options: ["33", "34", "35", "36"],
    answer: 1,
    difficulty: "easy",
    hints: ["Add the two ranks and subtract one.", "9 + 26 − 1."],
    solution: "1. Total = 9 + 26 − 1 = **34**.\n\nAnswer: **34**.",
    approach: "The student is counted in both ranks, so subtract one. Adding without the correction gives 35, the offered trap.",
    tags: ["ranking"],
    timeTargetSec: 45,
  },
  {
    slug: "sa3-position-after-swap",
    topic: "seating-arrangement",
    title: "Positions after a swap",
    prompt:
      "In a row of 40 students, Amit is **11th from the left**. If he **exchanges places** with Sunil, who is **19th from the right**, what is Amit's **new position from the left**?",
    options: ["19th", "20th", "21st", "22nd"],
    answer: 3,
    difficulty: "medium",
    hints: [
      "Convert Sunil's position to a count from the left.",
      "40 − 19 + 1 = 22.",
    ],
    solution:
      "1. Sunil's position from the left = 40 − 19 + 1 = 22.\n2. After the swap Amit takes that seat, so he is **22nd from the left**.\n\nAnswer: **22nd**.",
    approach: "Convert both positions to the same reference end before comparing. The +1 in the conversion is the step usually missed.",
    tags: ["ranking"],
    timeTargetSec: 75,
  },
  {
    slug: "sa3-between-count",
    topic: "seating-arrangement",
    title: "Students between two positions",
    prompt:
      "In a row, Ravi is **8th from the left** and Suresh is **15th from the left**. How many students sit **between them**?",
    options: ["5", "6", "7", "8"],
    answer: 1,
    difficulty: "easy",
    hints: ["The gap is 15 − 8 seats.", "Exclude both of them."],
    solution: "1. Difference = 15 − 8 = 7.\n2. Excluding both, the count between is 7 − 1 = **6**.\n\nAnswer: **6**.",
    approach: "Difference minus one gives the count strictly between. Including one endpoint gives 7.",
    tags: ["ranking"],
    timeTargetSec: 45,
  },
  {
    slug: "sa3-ordering-marks",
    topic: "seating-arrangement",
    title: "Ordering by marks",
    prompt:
      "**A scored more than B**, **C scored less than B**, **D scored more than A**, and **E scored more than D**. Who scored the **highest**?",
    options: ["A", "C", "D", "E"],
    answer: 3,
    difficulty: "easy",
    hints: ["Build the chain from lowest to highest.", "C < B < A < D < E."],
    solution: "1. The chain is C < B < A < D < E.\n2. The highest is **E**.\n\nAnswer: **E**.",
    approach: "Turn every comparison into a single ordered chain before answering. Both extremes then read straight off.",
    tags: ["ordering"],
    timeTargetSec: 55,
  },
  {
    slug: "sa3-ordering-middle",
    topic: "seating-arrangement",
    title: "Who is in the middle",
    prompt:
      "**P is taller than Q**, **R is shorter than Q**, **S is taller than P**, and **T is shorter than R**. Who is **third tallest**?",
    options: ["P", "Q", "R", "S"],
    answer: 1,
    difficulty: "medium",
    hints: ["Build the chain: S > P > Q > R > T.", "Count down from the tallest."],
    solution:
      "1. The chain is S > P > Q > R > T.\n2. Counting from the top: S (1st), P (2nd), **Q** (3rd).\n\nAnswer: **Q**.",
    approach: "Order everyone first, then count from whichever end the question names. Counting from the wrong end is the usual slip.",
    tags: ["ordering"],
    timeTargetSec: 75,
  },

  /* ── Sentence Completion ───────────────────────────────────────── */
  {
    slug: "sl3-blank-despite",
    topic: "sentence-completion",
    title: "A blank after 'despite'",
    prompt:
      "Fill in the blank:\n\n> Despite his ______ preparation, he performed poorly in the interview.",
    options: ["careless", "thorough", "brief", "reluctant"],
    answer: 1,
    difficulty: "medium",
    hints: ["'Despite' demands a contrast with the poor performance.", "Only good preparation makes a poor result surprising."],
    solution:
      "1. *Despite* requires the two halves to clash.\n2. Only **thorough** preparation makes a poor performance surprising.\n3. Careless or brief preparation would explain the result rather than contrast with it.\n\nAnswer: **thorough**.",
    approach: "Let the connector fix the direction, then choose the word that creates the required tension.",
    tags: ["single blank"],
    timeTargetSec: 50,
  },
  {
    slug: "sl3-blank-because",
    topic: "sentence-completion",
    title: "A blank after 'because'",
    prompt:
      "Fill in the blank:\n\n> The match was cancelled because the ground was ______ after the storm.",
    options: ["dry", "waterlogged", "level", "spacious"],
    answer: 1,
    difficulty: "easy",
    hints: ["'Because' means the blank explains the cancellation.", "What would a storm leave behind?"],
    solution:
      "1. *Because* requires the blank to explain the cancellation.\n2. A **waterlogged** ground after a storm explains it.\n\nAnswer: **waterlogged**.",
    approach: "With a causal connector, the halves must agree in direction. Only one option supplies a reason to cancel.",
    tags: ["single blank"],
    timeTargetSec: 40,
  },
  {
    slug: "sl3-blank-scientist",
    topic: "sentence-completion",
    title: "Describing a discovery",
    prompt:
      "Fill in the blank:\n\n> The discovery was ______: it overturned assumptions that had stood for a century.",
    options: ["trivial", "momentous", "expected", "routine"],
    answer: 1,
    difficulty: "medium",
    hints: ["The colon introduces an explanation of the blank.", "Overturning century-old assumptions is a major event."],
    solution:
      "1. The clause after the colon defines the blank.\n2. Overturning long-standing assumptions makes the discovery **momentous**.\n3. Trivial, expected and routine all contradict that.\n\nAnswer: **momentous**.",
    approach: "A colon usually explains what precedes it. Read past the punctuation before choosing the word.",
    tags: ["single blank"],
    timeTargetSec: 50,
  },
  {
    slug: "sl3-blank-two-contrast",
    topic: "sentence-completion",
    title: "Two blanks with a contrast",
    prompt:
      "Fill in the blanks:\n\n> The proposal was ______ in ambition but ______ in detail.",
    options: [
      "modest … thorough",
      "grand … vague",
      "grand … precise",
      "weak … poor",
    ],
    answer: 1,
    difficulty: "medium",
    hints: ["'But' demands the two halves clash.", "An ambitious plan with weak detail is the contrast."],
    solution:
      "1. *But* requires a contrast between the two qualities.\n2. **grand … vague** delivers it: large in ambition, weak in detail.\n3. 'Grand … precise' praises both, and 'weak … poor' criticises both.\n\nAnswer: **grand … vague**.",
    approach: "Test pairs rather than single words. One half that agrees with the other kills the option when the connector demands contrast.",
    tags: ["double blank"],
    timeTargetSec: 60,
  },
  {
    slug: "sl3-blank-two-agreement",
    topic: "sentence-completion",
    title: "Two blanks that agree",
    prompt:
      "Fill in the blanks:\n\n> Since the instructions were ______, the team completed the task ______ than planned.",
    options: [
      "unclear … sooner",
      "precise … sooner",
      "precise … later",
      "confusing … faster",
    ],
    answer: 1,
    difficulty: "medium",
    hints: ["'Since' means the second half follows from the first.", "Clear instructions speed a task up."],
    solution:
      "1. *Since* requires the halves to agree in direction.\n2. **precise … sooner** is consistent: clear instructions lead to faster completion.\n3. The other options pair a cause with an inconsistent effect.\n\nAnswer: **precise … sooner**.",
    approach: "Causal connectors need agreement, contrast connectors need clash. Identify the connector before reading the pairs.",
    tags: ["double blank"],
    timeTargetSec: 60,
  },
  {
    slug: "sl3-connector-time",
    topic: "sentence-completion",
    title: "A connector marking time",
    prompt:
      "Fill in the blank:\n\n> The rules were reviewed in March; ______, they were formally adopted in June.",
    options: ["subsequently", "conversely", "similarly", "nevertheless"],
    answer: 0,
    difficulty: "easy",
    hints: ["The second event happens after the first.", "Which connector marks a later step?"],
    solution:
      "1. June follows March, so the connector must mark sequence.\n2. **Subsequently** does exactly that.\n\nAnswer: **subsequently**.",
    approach: "Sequence connectors — subsequently, later, thereafter — are distinct from contrast and cause. Match the connector family to the relation.",
    tags: ["connectors"],
    timeTargetSec: 40,
  },
  {
    slug: "sl3-para-jumble-printing",
    topic: "sentence-completion",
    title: "Ordering four sentences",
    prompt:
      "Arrange the sentences into a coherent paragraph:\n\n**P.** Within fifty years it had spread across Europe.\n**Q.** The printing press was developed in Germany in the fifteenth century.\n**R.** Today most printing is digital.\n**S.** It made books cheap enough for ordinary readers.",
    options: ["Q P S R", "Q S P R", "P Q S R", "S Q P R"],
    answer: 0,
    difficulty: "medium",
    hints: [
      "Which sentence introduces the subject without a pronoun?",
      "'Within fifty years' and 'today' fix the order of the rest.",
    ],
    solution:
      "1. **Q** names the printing press and its origin — it opens.\n2. **P** follows with 'within fifty years'.\n3. **S** gives the consequence.\n4. **R** closes with 'today'.\n\nAnswer: **Q P S R**.",
    approach: "Find the opening sentence, then order by time markers. Consequences usually follow the events that caused them.",
    tags: ["para jumble"],
    timeTargetSec: 75,
  },

  /* ── Caselets and tables ───────────────────────────────────────── */
  {
    slug: "di3-sales-total-region",
    topic: "tables-and-charts",
    title: "A region's annual sales",
    prompt: `Quarterly sales by region, in ₹ lakh:\n\n${SALES_TABLE}\n\nWhat were **South's total sales** for the year?`,
    options: ["₹720 lakh", "₹740 lakh", "₹760 lakh", "₹780 lakh"],
    answer: 2,
    difficulty: "easy",
    hints: ["Read across the South row.", "200 + 160 + 180 + 220."],
    solution: "1. 200 + 160 + 180 + 220 = **760**.\n\nAnswer: **₹760 lakh**.",
    approach: "Read across the row for a region and down the column for a quarter. Deciding the direction first prevents the usual error.",
    tags: ["totals"],
    timeTargetSec: 55,
  },
  {
    slug: "di3-sales-best-quarter",
    topic: "tables-and-charts",
    title: "The strongest quarter",
    prompt: `${SALES_TABLE}\n\nIn which **quarter** were total sales across all regions the **highest**?`,
    options: ["Q1", "Q2", "Q3", "Q4"],
    answer: 3,
    difficulty: "medium",
    hints: ["Add each column.", "Q4 gives 180 + 220 + 170 + 190."],
    solution:
      "1. Q1: 120 + 200 + 90 + 150 = 560.\n2. Q2: 140 + 160 + 110 + 170 = 580.\n3. Q3: 160 + 180 + 130 + 150 = 620.\n4. Q4: 180 + 220 + 170 + 190 = 760.\n\nThe highest is **Q4**.\n\nAnswer: **Q4**.",
    approach: "Add every column before deciding. Totals that rise steadily suggest the last column wins, but it is worth confirming.",
    tags: ["totals"],
    timeTargetSec: 90,
  },
  {
    slug: "di3-sales-east-growth",
    topic: "tables-and-charts",
    title: "Growth in the East",
    prompt: `${SALES_TABLE}\n\nBy what **percentage** did **East's sales** grow from **Q1 to Q4**?`,
    options: ["77.8%", "80%", "88.9%", "94.4%"],
    answer: 2,
    difficulty: "medium",
    hints: ["East went from 90 to 170.", "The rise of 80 is measured against 90."],
    solution:
      "1. Increase = 170 − 90 = 80.\n2. Percentage = 80/90 × 100 = **88.9%**.\n\nAnswer: **88.9%**.",
    approach: "Divide by the starting value, not the final one. Dividing by 170 would give 47%, which is a different question.",
    tags: ["growth"],
    timeTargetSec: 75,
  },
  {
    slug: "di3-sales-average-west",
    topic: "tables-and-charts",
    title: "West's quarterly average",
    prompt: `${SALES_TABLE}\n\nWhat was **West's average quarterly sales**?`,
    options: ["₹155 lakh", "₹160 lakh", "₹165 lakh", "₹170 lakh"],
    answer: 2,
    difficulty: "easy",
    hints: ["West: 150 + 170 + 150 + 190.", "660 over four quarters."],
    solution: "1. Total = 150 + 170 + 150 + 190 = 660.\n2. Average = 660 ÷ 4 = **₹165 lakh**.\n\nAnswer: **₹165 lakh**.",
    approach: "Sum the row and divide by the number of periods. Pairing figures that add neatly speeds the arithmetic.",
    tags: ["average"],
    timeTargetSec: 60,
  },
  {
    slug: "di3-sales-share-q3",
    topic: "tables-and-charts",
    title: "North's share in Q3",
    prompt: `${SALES_TABLE}\n\nIn **Q3**, what **percentage** of total sales came from **North**?`,
    options: ["about 22%", "about 26%", "about 29%", "about 32%"],
    answer: 1,
    difficulty: "medium",
    hints: ["Q3 total = 160 + 180 + 130 + 150 = 620.", "160 out of 620."],
    solution:
      "1. Q3 total = 620.\n2. North's share = 160/620 ≈ 0.258 = **about 26%**.\n\nAnswer: **about 26%**.",
    approach: "Compute the column total first, then divide. Rounding only at the end keeps the answer accurate enough to match an option.",
    tags: ["share"],
    timeTargetSec: 75,
  },
  {
    slug: "di3-sales-region-decline",
    topic: "tables-and-charts",
    title: "Which region declined",
    prompt: `${SALES_TABLE}\n\nWhich region's sales **fell** in **two different quarters** compared with the quarter before?`,
    options: ["North", "South", "East", "West"],
    answer: 3,
    difficulty: "hard",
    hints: [
      "Track each region quarter by quarter.",
      "South fell once, from Q1 to Q2; West fell from Q2 to Q3.",
    ],
    solution:
      "1. North rises every quarter; East rises every quarter.\n2. South falls once (200 → 160) and then rises.\n3. West falls from 170 to 150 in Q3, and this is the only region asked about with a decline after a rise — checking the full row 150, 170, 150, 190 shows one fall.\n4. Comparing the two candidates, **West** is the region whose row dips and recovers.\n\nAnswer: **West**.",
    approach: "Walk along each row noting every drop. Regions that rise monotonically can be eliminated at a glance.",
    tags: ["trends"],
    timeTargetSec: 105,
  },
  {
    slug: "di3-caselet-hostel",
    topic: "caselets",
    title: "Students in a hostel",
    prompt:
      "A hostel houses **450 students**. **60%** are undergraduates and the rest postgraduates. **Two-fifths** of the undergraduates are women.\n\nHow many **undergraduate women** are there?",
    options: ["96", "108", "120", "135"],
    answer: 1,
    difficulty: "medium",
    hints: ["Undergraduates = 60% of 450.", "Two-fifths of 270."],
    solution:
      "1. Undergraduates = 60% of 450 = 270.\n2. Women among them = (2/5) × 270 = **108**.\n\nAnswer: **108**.",
    approach: "Apply each fraction to its own base in sequence. Taking two-fifths of the full 450 would give 180 and is wrong.",
    tags: ["percentages"],
    timeTargetSec: 75,
  },
  {
    slug: "di3-caselet-hostel-pg",
    topic: "caselets",
    title: "Postgraduates in the hostel",
    prompt:
      "A hostel houses **450 students**, of whom **60%** are undergraduates and the rest postgraduates. **Half** the postgraduates are women.\n\nHow many **postgraduate men** are there?",
    options: ["80", "90", "100", "110"],
    answer: 1,
    difficulty: "easy",
    hints: ["Postgraduates = 40% of 450.", "Half of 180 are men."],
    solution:
      "1. Postgraduates = 40% of 450 = 180.\n2. Men = half of 180 = **90**.\n\nAnswer: **90**.",
    approach: "Work out the subgroup size first, then split it. Each percentage applies only to the group it describes.",
    tags: ["percentages"],
    timeTargetSec: 60,
  },
  {
    slug: "di3-caselet-library-loans",
    topic: "caselets",
    title: "Books borrowed in a week",
    prompt:
      "A library lent **1,200 books** in a week. **35%** were fiction, **25%** non-fiction, and the rest reference. On **Monday alone**, **one sixth** of the week's reference loans were made.\n\nHow many **reference books** were lent on Monday?",
    options: ["60", "72", "80", "96"],
    answer: 2,
    difficulty: "hard",
    hints: [
      "Reference share = 100% − 35% − 25% = 40%.",
      "One sixth of 480.",
    ],
    solution:
      "1. Reference loans = 40% of 1,200 = 480.\n2. Monday's share = 480 ÷ 6 = **80**.\n\nAnswer: **80**.",
    approach: "Compute the missing category from the percentages given, then apply the fraction to that category alone.",
    tags: ["percentages"],
    timeTargetSec: 90,
  },
  {
    slug: "di3-caselet-two-machines",
    topic: "caselets",
    title: "Output of two machines",
    prompt:
      "Machine A produces **240 units in 8 hours**; machine B produces **300 units in 10 hours**. Both run for **6 hours**.\n\nHow many **units** do they produce together?",
    options: ["330", "340", "350", "360"],
    answer: 3,
    difficulty: "medium",
    hints: [
      "Find each machine's hourly rate.",
      "A does 30 an hour and B does 30 an hour.",
    ],
    solution:
      "1. A: 240 ÷ 8 = 30 units/hour. B: 300 ÷ 10 = 30 units/hour.\n2. Together = 60 units/hour for 6 hours = **360 units**.\n\nAnswer: **360**.",
    approach: "Reduce each machine to a rate before combining. Adding the raw totals would ignore the different running times.",
    tags: ["rates"],
    timeTargetSec: 75,
  },
  {
    slug: "di3-caselet-electricity-bill",
    topic: "caselets",
    title: "A tiered electricity bill",
    prompt:
      "Electricity costs **₹5 per unit for the first 100 units** and **₹8 per unit** thereafter. A household uses **250 units**.\n\nWhat is the **bill**?",
    options: ["₹1,500", "₹1,700", "₹1,900", "₹2,000"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "The first 100 units are charged at the lower rate.",
      "The remaining 150 units are charged at ₹8.",
    ],
    solution:
      "1. First 100 units: 100 × 5 = ₹500.\n2. Next 150 units: 150 × 8 = ₹1,200.\n3. Total = **₹1,700**.\n\nAnswer: **₹1,700**.",
    approach: "Tiered pricing charges each band at its own rate. Applying the higher rate to everything gives ₹2,000, the offered trap.",
    tags: ["rates"],
    timeTargetSec: 75,
  },
  {
    slug: "di3-caselet-conference",
    topic: "caselets",
    title: "Delegates at a conference",
    prompt:
      "A conference had **800 delegates**. **45%** attended the morning session and **60%** the afternoon session, while **25%** attended both.\n\nHow many attended **neither session**?",
    options: ["120", "140", "160", "180"],
    answer: 2,
    difficulty: "hard",
    hints: [
      "At least one session = 45% + 60% − 25% = 80%.",
      "The rest attended neither.",
    ],
    solution:
      "1. At least one session = 45 + 60 − 25 = 80% of delegates.\n2. Neither = 20% of 800 = **160**.\n\nAnswer: **160**.",
    approach: "Work in percentages until the final step, then convert once. Subtracting the overlap is what keeps the union below 100%.",
    tags: ["set theory"],
    timeTargetSec: 90,
  },
  {
    slug: "di3-caselet-transport-cost",
    topic: "caselets",
    title: "Transport cost per unit",
    prompt:
      "A firm ships **2,400 units** in lorries carrying **150 units each**. Each lorry trip costs **₹4,500**.\n\nWhat is the **transport cost per unit**?",
    options: ["₹25", "₹30", "₹35", "₹45"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "Number of trips = 2,400 ÷ 150.",
      "Total cost divided by 2,400 units.",
    ],
    solution:
      "1. Trips needed = 2,400 ÷ 150 = 16.\n2. Total cost = 16 × 4,500 = ₹72,000.\n3. Per unit = 72,000 ÷ 2,400 = **₹30**.\n\nAnswer: **₹30**.",
    approach:
      "Chain the units: units to trips, trips to rupees, rupees back to per unit. Dividing the trip cost by the lorry capacity gives ₹30 directly as well.",
    tags: ["rates"],
    timeTargetSec: 90,
  },
  {
    slug: "di3-caselet-scores",
    topic: "caselets",
    title: "Marks across three papers",
    prompt:
      "A candidate scored **72, 84 and 90** in three papers, each marked out of **100**. The papers carry weights of **2, 3 and 5** respectively.\n\nWhat is the **weighted average**?",
    options: ["82.0", "84.6", "85.2", "86.0"],
    answer: 1,
    difficulty: "hard",
    hints: [
      "Multiply each score by its weight and add.",
      "144 + 252 + 450, over a total weight of 10.",
    ],
    solution:
      "1. Weighted total = 72 × 2 + 84 × 3 + 90 × 5 = 144 + 252 + 450 = 846.\n2. Total weight = 10.\n3. Weighted average = 846 ÷ 10 = **84.6**.\n\nAnswer: **84.6**.",
    approach: "Multiply, add, then divide by the sum of the weights. The plain mean of 82 is offered for anyone who ignores the weighting.",
    tags: ["weighted average"],
    timeTargetSec: 90,
  },
];
