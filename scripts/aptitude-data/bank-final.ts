import type { AptitudeSeed } from "./types.js";

/** A final set spread across the lighter topics. */

const PASSAGE_RAIL = `> Railways were the first industry to require a single national time. Before them, every town kept its own clock by the sun, and a difference of a few minutes between neighbouring places troubled nobody. A timetable made those minutes intolerable. Within a generation, the railway companies had imposed a standard time across whole countries — not because anyone had argued for it, but because the trains could not run without it.`;

export const BANK_FINAL: AptitudeSeed[] = [
  /* ── Syllogisms ────────────────────────────────────────────────── */
  {
    slug: "sy4-all-engineers-graduates",
    topic: "syllogisms",
    title: "Engineers and graduates",
    prompt:
      "**Statements:**\n1. All engineers are graduates.\n2. Some graduates are unemployed.\n\n**Conclusions:**\nI. Some engineers are unemployed.\nII. Some unemployed people are graduates.\n\nWhich conclusion follows?",
    options: ["Only I", "Only II", "Both", "Neither"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "The unemployed graduates need not be engineers.",
      "Conclusion II is statement 2 reversed.",
    ],
    solution:
      "1. The unemployed graduates may all lie outside the engineers, so I does not follow.\n2. 'Some graduates are unemployed' reverses to 'some unemployed people are graduates': **II follows**.\n\nAnswer: **Only II**.",
    approach: "'Some' statements reverse freely; 'all' statements never do. Checking whether a conclusion is just a premise restated is the quickest test.",
    tags: ["some/all"],
    timeTargetSec: 75,
  },
  {
    slug: "sy4-no-book-magazine",
    topic: "syllogisms",
    title: "Books and magazines",
    prompt:
      "**Statements:**\n1. No book is a magazine.\n2. All magazines are printed.\n\n**Conclusions:**\nI. Some printed things are not books.\nII. No printed thing is a book.\n\nWhich conclusion follows?",
    options: ["Only I", "Only II", "Both", "Neither"],
    answer: 0,
    difficulty: "hard",
    hints: [
      "Magazines are printed and are not books, so at least those printed things are not books.",
      "But books themselves may well be printed.",
    ],
    solution:
      "1. All magazines are printed and no magazine is a book, so those printed items are not books: **I follows**.\n2. Books could also be printed, so II is too strong.\n\nAnswer: **Only I**.",
    approach: "Carry the negative only as far as the premises reach. A 'some are not' conclusion is safe where a universal 'no' is not.",
    tags: ["negative"],
    timeTargetSec: 90,
  },
  {
    slug: "sy4-all-fruits-sweet",
    topic: "syllogisms",
    title: "A three-step chain",
    prompt:
      "**Statements:**\n1. All mangoes are fruits.\n2. All fruits are food.\n3. All food is perishable.\n\n**Conclusions:**\nI. All mangoes are perishable.\nII. Some perishable things are mangoes.\n\nWhich conclusion follows?",
    options: ["Only I", "Only II", "Both", "Neither"],
    answer: 2,
    difficulty: "medium",
    hints: ["Follow the chain from mangoes outwards.", "Since mangoes exist, the 'some' converse also holds."],
    solution:
      "1. Mangoes ⊂ fruits ⊂ food ⊂ perishable, so all mangoes are perishable: **I follows**.\n2. Mangoes exist and are perishable, so some perishable things are mangoes: **II follows**.\n\nAnswer: **Both**.",
    approach: "Chains of 'all' pass forwards through any number of links. The 'some' converse of a valid 'all' conclusion is also valid.",
    tags: ["venn"],
    timeTargetSec: 75,
  },
  {
    slug: "sy4-some-not-follow",
    topic: "syllogisms",
    title: "When neither follows",
    prompt:
      "**Statements:**\n1. Some pens are red.\n2. Some red things are expensive.\n\n**Conclusions:**\nI. Some pens are expensive.\nII. No pen is expensive.\n\nWhich conclusion follows?",
    options: ["Only I", "Only II", "Either I or II", "Neither"],
    answer: 2,
    difficulty: "hard",
    hints: [
      "Two 'some' statements never chain into a definite conclusion.",
      "But these two conclusions are contradictory and cover every case.",
    ],
    solution:
      "1. Two 'some' premises prove nothing definite, so neither holds on its own.\n2. Pens and expensive things must either overlap or not, and I and II are exactly those two cases.\n3. So **either I or II** holds.\n\nAnswer: **Either I or II**.",
    approach:
      "Whenever neither conclusion follows alone, check whether they form a complementary pair. If they do, the answer is 'either/or' rather than 'neither'.",
    tags: ["either or"],
    timeTargetSec: 105,
  },
  {
    slug: "sy4-all-a-are-b-converse",
    topic: "syllogisms",
    title: "Testing a converse",
    prompt:
      "**Statement:** All lawyers are graduates.\n\n**Conclusions:**\nI. Some graduates are lawyers.\nII. All graduates are lawyers.\n\nWhich conclusion follows?",
    options: ["Only I", "Only II", "Both", "Neither"],
    answer: 0,
    difficulty: "easy",
    hints: ["Lawyers exist and all of them are graduates.", "But graduates may include many non-lawyers."],
    solution:
      "1. Lawyers exist and every one is a graduate, so some graduates are lawyers: **I follows**.\n2. II reverses the statement completely and does not follow.\n\nAnswer: **Only I**.",
    approach: "'All A are B' supports 'some B are A' but never 'all B are A'. That partial converse is valid and frequently tested.",
    tags: ["venn"],
    timeTargetSec: 60,
  },

  /* ── Seating & Arrangement ─────────────────────────────────────── */
  {
    slug: "sa4-four-in-a-row",
    topic: "seating-arrangement",
    title: "Four in a row",
    prompt:
      "Four people sit in a row. **B is at the left end**, **D is immediately to the right of B**, **A is not at either end**, and **C is immediately to the right of A**. Who sits at the **right end**?",
    options: ["A", "B", "C", "D"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "B takes seat 1 and D takes seat 2.",
      "Only seats 3 and 4 are left, and A cannot be at an end.",
    ],
    solution:
      "1. B = seat 1 and D = seat 2.\n2. Seats 3 and 4 remain for A and C, and A is not at an end, so A = seat 3.\n3. C is immediately to the right of A, so C = seat 4.\n4. The row is B, D, A, C and the right end is **C**.\n\nAnswer: **C**.",
    approach: "Place the clues that fix a seat outright, then let the remaining constraint settle the rest. Check the finished row against every clue.",
    tags: ["linear"],
    timeTargetSec: 90,
  },
  {
    slug: "sa4-circle-four",
    topic: "seating-arrangement",
    title: "Four around a table",
    prompt:
      "Four people sit around a square table, one on each side, **facing the centre**. **P is opposite Q** and **R is to the immediate left of P**. Who is **opposite R**?",
    options: ["P", "Q", "S", "Nobody"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "With four seats, opposite means two seats away.",
      "Place P, then Q opposite, then R on P's left.",
    ],
    solution:
      "1. Number the seats 1–4 clockwise, with P at 1 and Q opposite at 3.\n2. Facing the centre, P's left is clockwise, so R = seat 2.\n3. The remaining seat 4 holds S, and seat 4 is opposite seat 2.\n4. So **S** sits opposite R.\n\nAnswer: **S**.",
    approach: "Fix one person, place their opposite, then use the left-right rule. Facing the centre, left is clockwise.",
    tags: ["circular"],
    timeTargetSec: 90,
  },
  {
    slug: "sa4-rank-in-class",
    topic: "seating-arrangement",
    title: "Rank from the other end",
    prompt:
      "In a class of **35 students**, Priya ranks **12th from the bottom**. What is her rank **from the top**?",
    options: ["22nd", "23rd", "24th", "25th"],
    answer: 2,
    difficulty: "easy",
    hints: ["Rank from top = total − rank from bottom + 1.", "35 − 12 + 1."],
    solution: "1. Rank from the top = 35 − 12 + 1 = **24th**.\n\nAnswer: **24th**.",
    approach: "The +1 accounts for the student being counted at both ends. Subtracting alone gives 23, the offered trap.",
    tags: ["ranking"],
    timeTargetSec: 45,
  },
  {
    slug: "sa4-ordering-ages",
    topic: "seating-arrangement",
    title: "Ordering by age",
    prompt:
      "**M is older than N**, **O is younger than N**, **P is older than M**, and **Q is younger than O**. Who is the **second oldest**?",
    options: ["M", "N", "O", "P"],
    answer: 0,
    difficulty: "medium",
    hints: ["Build the chain: P > M > N > O > Q.", "Count down from the oldest."],
    solution:
      "1. The chain is P > M > N > O > Q.\n2. The oldest is P, so the second oldest is **M**.\n\nAnswer: **M**.",
    approach: "Order everyone into one chain, then count from the correct end. The question asks for second, not first.",
    tags: ["ordering"],
    timeTargetSec: 60,
  },
  {
    slug: "sa4-floors-five",
    topic: "seating-arrangement",
    title: "Five floors",
    prompt:
      "Five people live on five floors. **A lives above B**, **C lives below B**, **D lives above A**, and **E lives between A and D**. Who lives on the **second floor from the bottom**?",
    options: ["A", "B", "C", "E"],
    answer: 1,
    difficulty: "hard",
    hints: [
      "Order upwards: C, B, A, then E, then D.",
      "The bottom floor is C's.",
    ],
    solution:
      "1. C is below B, and B is below A, giving C, B, A upwards.\n2. D is above A, and E lies between A and D, so the order continues A, E, D.\n3. The full order upwards is C, B, A, E, D.\n4. The second from the bottom is **B**.\n\nAnswer: **B**.",
    approach: "Build the vertical chain from the bottom up, inserting each person as their clue allows. Count from the end the question names.",
    tags: ["ordering"],
    timeTargetSec: 105,
  },

  /* ── Sentence Completion ───────────────────────────────────────── */
  {
    slug: "sl4-blank-although",
    topic: "sentence-completion",
    title: "A blank after 'although'",
    prompt:
      "Fill in the blank:\n\n> Although the report was ______, the board accepted its recommendations without debate.",
    options: ["persuasive", "damning", "brief", "official"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "'Although' requires the two halves to clash.",
      "Accepting a critical report without debate is the surprise.",
    ],
    solution:
      "1. *Although* demands a contrast with the easy acceptance.\n2. A **damning** report accepted without debate supplies that tension.\n3. A persuasive or official report would be accepted as a matter of course.\n\nAnswer: **damning**.",
    approach: "Let the connector set the direction, then pick the word that makes the second half surprising rather than expected.",
    tags: ["single blank"],
    timeTargetSec: 55,
  },
  {
    slug: "sl4-blank-so-that",
    topic: "sentence-completion",
    title: "A result clause",
    prompt:
      "Fill in the blank:\n\n> The instructions were so ______ that even a beginner could follow them.",
    options: ["technical", "straightforward", "lengthy", "obscure"],
    answer: 1,
    difficulty: "easy",
    hints: ["The result is that a beginner could follow them.", "Which quality produces that result?"],
    solution:
      "1. 'So ... that' links a quality to its result.\n2. Only **straightforward** instructions could be followed by a beginner.\n\nAnswer: **straightforward**.",
    approach: "The clause after 'that' states the consequence. Work backwards from it to the quality required.",
    tags: ["single blank"],
    timeTargetSec: 45,
  },
  {
    slug: "sl4-connector-concession",
    topic: "sentence-completion",
    title: "Conceding a point",
    prompt:
      "Fill in the blank:\n\n> The plan is expensive; ______, it is the only option that meets the deadline.",
    options: ["moreover", "admittedly", "however", "therefore"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "The second clause defends the plan against the first.",
      "Which connector introduces an opposing consideration?",
    ],
    solution:
      "1. The first clause criticises the plan; the second defends it.\n2. **However** marks that turn.\n3. *Moreover* would add another criticism, and *therefore* would draw a conclusion from it.\n\nAnswer: **however**.",
    approach: "Read both halves and decide whether the second agrees with the first or pushes back. Only contrast connectors push back.",
    tags: ["connectors"],
    timeTargetSec: 45,
  },
  {
    slug: "sl4-blank-pair-contrast",
    topic: "sentence-completion",
    title: "A contrasting pair",
    prompt:
      "Fill in the blanks:\n\n> The first half of the match was ______, but the second was surprisingly ______.",
    options: [
      "dull … tedious",
      "dull … lively",
      "exciting … thrilling",
      "slow … sluggish",
    ],
    answer: 1,
    difficulty: "medium",
    hints: ["'But' and 'surprisingly' both demand a contrast.", "Only one pair moves in opposite directions."],
    solution:
      "1. *But surprisingly* requires the halves to clash.\n2. **dull … lively** is the only pair that does.\n3. The other three pair two similar words together.\n\nAnswer: **dull … lively**.",
    approach: "Scan the pairs for one that changes direction. Three of the four options here are near-synonyms and can be dismissed at a glance.",
    tags: ["double blank"],
    timeTargetSec: 55,
  },
  {
    slug: "sl4-para-jumble-vaccine",
    topic: "sentence-completion",
    title: "Ordering a short paragraph",
    prompt:
      "Arrange the sentences into a coherent paragraph:\n\n**P.** The idea was ridiculed at first.\n**Q.** Edward Jenner tested the first vaccine in 1796.\n**R.** Within a century it had eradicated smallpox in Europe.\n**S.** But the evidence gradually won doctors over.",
    options: ["Q P S R", "Q S P R", "P Q S R", "P S Q R"],
    answer: 0,
    difficulty: "medium",
    hints: [
      "Which sentence names the subject rather than referring back to it?",
      "'The idea' must follow the sentence that introduces it.",
    ],
    solution:
      "1. **Q** names Jenner and the first vaccine — it opens.\n2. **P** refers back to 'the idea', so it follows.\n3. **S** begins 'but' and answers the ridicule.\n4. **R** closes with the long-term outcome.\n\nAnswer: **Q P S R**.",
    approach: "Sentences beginning with 'the', 'it' or 'but' always refer back to something. The opening sentence is the one that refers back to nothing.",
    tags: ["para jumble"],
    timeTargetSec: 75,
  },

  /* ── Mixtures ──────────────────────────────────────────────────── */
  {
    slug: "ma4-two-grades-rice",
    topic: "mixtures-alligation",
    title: "Rice at two prices",
    prompt:
      "Rice costing **₹50 per kg** is mixed with rice costing **₹70 per kg** to give a mixture worth **₹56 per kg**. In what **ratio**?",
    options: ["3 : 2", "7 : 3", "2 : 3", "3 : 7"],
    answer: 1,
    difficulty: "medium",
    hints: ["Alligation: (70 − 56) : (56 − 50).", "14 : 6."],
    solution:
      "1. Cheaper : dearer = (70 − 56) : (56 − 50) = 14 : 6 = **7 : 3**.\n2. Check: (7 × 50 + 3 × 70)/10 = 560/10 = 56. ✓\n\nAnswer: **7 : 3**.",
    approach: "The mean at 56 is much nearer 50, so far more of the cheaper grade is needed. That sanity check catches an inverted ratio.",
    tags: ["alligation"],
    timeTargetSec: 60,
  },
  {
    slug: "ma4-milk-water-30-percent",
    topic: "mixtures-alligation",
    title: "Water in a mixture",
    prompt:
      "A **50-litre mixture** contains **30% water**. How much **milk** must be added to reduce the water to **20%**?",
    options: ["20 L", "25 L", "30 L", "35 L"],
    answer: 1,
    difficulty: "hard",
    hints: [
      "The water is fixed at 15 litres.",
      "For 15 litres to be 20% of the mixture, the total must be 75 litres.",
    ],
    solution:
      "1. Water = 30% of 50 = 15 L, and it does not change.\n2. For water to be 20%, the total = 15 ÷ 0.20 = 75 L.\n3. Milk added = 75 − 50 = **25 L**.\n\nAnswer: **25 L**.",
    approach: "Anchor on the component that stays fixed — here the water — and compute the new total from it.",
    tags: ["concentration"],
    timeTargetSec: 90,
  },
  {
    slug: "ma4-three-way-alligation",
    topic: "mixtures-alligation",
    title: "Average cost of three items",
    prompt:
      "**5 kg at ₹40**, **10 kg at ₹50** and **5 kg at ₹80** are mixed. What is the **cost per kg** of the mixture?",
    options: ["₹50", "₹52", "₹55", "₹58"],
    answer: 2,
    difficulty: "medium",
    hints: ["Total cost over total weight.", "200 + 500 + 400 over 20 kg."],
    solution:
      "1. Cost = 5 × 40 + 10 × 50 + 5 × 80 = 200 + 500 + 400 = ₹1,100.\n2. Weight = 5 + 10 + 5 = 20 kg.\n3. Cost per kg = 1,100 ÷ 20 = **₹55**.\n\nAnswer: **₹55**.",
    approach: "Weighted average across three components: total cost divided by total weight.",
    tags: ["weighted average"],
    timeTargetSec: 75,
  },
  {
    slug: "ma4-alligation-marks",
    topic: "mixtures-alligation",
    title: "Two groups of candidates",
    prompt:
      "In an exam the **average mark of passed candidates is 70** and of **failed candidates 30**. The **overall average is 60**. What is the ratio of **passed to failed** candidates?",
    options: ["1 : 3", "3 : 1", "2 : 1", "1 : 2"],
    answer: 1,
    difficulty: "medium",
    hints: ["Alligation with 60 as the mean.", "(60 − 30) : (70 − 60)."],
    solution:
      "1. Passed : failed = (60 − 30) : (70 − 60) = 30 : 10 = **3 : 1**.\n2. Check: (3 × 70 + 1 × 30)/4 = 240/4 = 60. ✓\n\nAnswer: **3 : 1**.",
    approach: "Each group's size is proportional to the *other* group's distance from the mean. The mean nearer 70 means more candidates passed.",
    tags: ["weighted average"],
    timeTargetSec: 75,
  },
  {
    slug: "ma4-replace-third-time",
    topic: "mixtures-alligation",
    title: "Repeated replacement",
    prompt:
      "A tank holds **100 litres of milk**. **20 litres** is drawn off and replaced with water **twice**. How much **milk** remains?",
    options: ["60 L", "64 L", "68 L", "72 L"],
    answer: 1,
    difficulty: "medium",
    hints: ["Each operation leaves 80% of the milk.", "100 × 0.8 × 0.8."],
    solution: "1. Fraction remaining each time = 0.8.\n2. After two operations: 100 × 0.64 = **64 L**.\n\nAnswer: **64 L**.",
    approach: "Remaining = initial × (1 − drawn/total)ⁿ. Subtracting 40 litres directly would give 60 and ignores that the second draw removes less milk.",
    tags: ["replacement"],
    timeTargetSec: 60,
  },

  /* ── Reading Comprehension ─────────────────────────────────────── */
  {
    slug: "rc3-rail-main-idea",
    topic: "reading-comprehension",
    title: "Why railways standardised time",
    prompt: `${PASSAGE_RAIL}\n\nWhat is the **main point** of the passage?`,
    options: [
      "Railways standardised time out of practical necessity rather than by argument.",
      "Towns resisted the introduction of standard time.",
      "Sundials were inaccurate before the railway age.",
      "Timetables were invented before the railways.",
    ],
    answer: 0,
    difficulty: "medium",
    hints: [
      "The final sentence gives the reason explicitly.",
      "It contrasts argument with necessity.",
    ],
    solution:
      "1. The passage says standard time was imposed 'not because anyone had argued for it, but because the trains could not run without it'.\n2. That is exactly the first option.\n3. The passage never mentions resistance, sundial accuracy, or the invention of timetables before railways.\n\nAnswer: **Railways standardised time out of practical necessity rather than by argument.**",
    approach: "When a passage ends with an explicit 'not because ... but because', that sentence usually carries the main idea.",
    tags: ["main idea"],
    timeTargetSec: 90,
  },
  {
    slug: "rc3-rail-detail",
    topic: "reading-comprehension",
    title: "How towns kept time before",
    prompt: `${PASSAGE_RAIL}\n\nAccording to the passage, how did towns keep time **before the railways**?`,
    options: [
      "By a national standard",
      "By their own clock set by the sun",
      "By the railway timetable",
      "The passage does not say",
    ],
    answer: 1,
    difficulty: "easy",
    hints: ["Look at the second sentence.", "It describes local time-keeping."],
    solution:
      "1. The passage says 'every town kept its own clock by the sun'.\n2. That matches the second option directly.\n\nAnswer: **By their own clock set by the sun**.",
    approach: "Detail questions are answered by locating the sentence. Scan for the key term rather than relying on memory.",
    tags: ["detail"],
    timeTargetSec: 60,
  },
  {
    slug: "rc3-rail-inference",
    topic: "reading-comprehension",
    title: "What the passage implies",
    prompt: `${PASSAGE_RAIL}\n\nWhich statement can be **inferred** from the passage?`,
    options: [
      "Technical requirements can change social conventions without public debate.",
      "Railways were unpopular in the nineteenth century.",
      "Standard time was adopted worldwide at the same moment.",
      "Local time was more accurate than standard time.",
    ],
    answer: 0,
    difficulty: "hard",
    hints: [
      "The passage stresses that nobody argued for standard time.",
      "Yet it was adopted within a generation.",
    ],
    solution:
      "1. The passage describes a convention changing because a technology required it, explicitly not because it was argued for.\n2. Generalising that gives the first option.\n3. The others go beyond or against the text.\n\nAnswer: **Technical requirements can change social conventions without public debate.**",
    approach: "A valid inference generalises what the passage demonstrates. Options that add facts the passage never mentions are not inferences.",
    tags: ["inference"],
    timeTargetSec: 105,
  },
  {
    slug: "rc3-rail-tone",
    topic: "reading-comprehension",
    title: "The tone of the passage",
    prompt: `${PASSAGE_RAIL}\n\nThe tone of the passage is best described as:`,
    options: ["Nostalgic", "Explanatory", "Indignant", "Sceptical"],
    answer: 1,
    difficulty: "medium",
    hints: [
      "The passage sets out how and why something happened.",
      "It passes no judgement on whether the change was good.",
    ],
    solution:
      "1. The passage describes a sequence of events and gives the reason for them.\n2. It expresses neither regret nor anger, so the tone is **explanatory**.\n\nAnswer: **Explanatory**.",
    approach: "Ask whether the author is arguing, lamenting or simply accounting for something. An account without evaluation is explanatory.",
    tags: ["tone"],
    timeTargetSec: 75,
  },
  {
    slug: "rc3-rail-vocabulary",
    topic: "reading-comprehension",
    title: "A word in context",
    prompt: `${PASSAGE_RAIL}\n\nAs used in the passage, **'intolerable'** most nearly means:`,
    options: ["Unbearable in practice", "Physically painful", "Illegal", "Expensive"],
    answer: 0,
    difficulty: "medium",
    hints: [
      "The word describes what a timetable did to small differences in local time.",
      "It concerns workability, not pain or law.",
    ],
    solution:
      "1. The passage says a timetable made minor time differences intolerable — that is, impossible to work with.\n2. **Unbearable in practice** captures that sense.\n\nAnswer: **Unbearable in practice**.",
    approach: "Vocabulary-in-context questions are settled by the sentence, not by the word's strongest dictionary sense.",
    tags: ["vocabulary in context"],
    timeTargetSec: 75,
  },

  /* ── Mensuration ───────────────────────────────────────────────── */
  {
    slug: "me4-square-side-from-perimeter",
    topic: "mensuration",
    title: "Area from the perimeter",
    prompt: "The **perimeter of a square is 64 cm**. What is its **area**?",
    options: ["196 cm²", "225 cm²", "256 cm²", "289 cm²"],
    answer: 2,
    difficulty: "easy",
    hints: ["Side = perimeter ÷ 4.", "16² = ?"],
    solution: "1. Side = 64 ÷ 4 = 16 cm.\n2. Area = 16² = **256 cm²**.\n\nAnswer: **256 cm²**.",
    approach: "Route through the side length. Every measurement of a square follows from it.",
    tags: ["square"],
    timeTargetSec: 45,
  },
  {
    slug: "me4-cylinder-total-surface",
    topic: "mensuration",
    title: "Total surface of a cylinder",
    prompt:
      "What is the **total surface area** of a closed cylinder with radius **7 cm** and height **3 cm**? (Take π = 22/7.)",
    options: ["308 cm²", "396 cm²", "440 cm²", "484 cm²"],
    answer: 2,
    difficulty: "medium",
    hints: ["Total surface = 2πr(r + h).", "2 × (22/7) × 7 × 10."],
    solution:
      "1. Total surface = 2πr(r + h) = 2 × (22/7) × 7 × (7 + 3).\n2. 2 × (22/7) × 7 = 44.\n3. 44 × 10 = **440 cm²**.\n\nAnswer: **440 cm²**.",
    approach: "Total surface adds the two circular ends to the curved surface: 2πrh + 2πr² = 2πr(r + h).",
    tags: ["cylinder"],
    timeTargetSec: 75,
  },
  {
    slug: "me4-triangle-equilateral-perimeter",
    topic: "mensuration",
    title: "Side from the perimeter",
    prompt: "An equilateral triangle has a **perimeter of 36 cm**. What is its **height**? (Take √3 = 1.73.)",
    options: ["6√3 cm", "8√3 cm", "10√3 cm", "12√3 cm"],
    answer: 0,
    difficulty: "medium",
    hints: ["Side = 36 ÷ 3 = 12 cm.", "Height = (√3/2) × side."],
    solution:
      "1. Side = 36 ÷ 3 = 12 cm.\n2. Height = (√3/2) × 12 = **6√3 cm** (about 10.38 cm).\n\nAnswer: **6√3 cm**.",
    approach: "For an equilateral triangle, height is (√3/2)a and area is (√3/4)a². Both follow once the side is known.",
    tags: ["triangle"],
    timeTargetSec: 60,
  },
  {
    slug: "me4-circle-radius-doubled",
    topic: "mensuration",
    title: "Doubling the radius",
    prompt: "If the **radius of a circle is doubled**, by what factor does its **area increase**?",
    options: ["2", "3", "4", "8"],
    answer: 2,
    difficulty: "easy",
    hints: ["Area is proportional to the square of the radius.", "2² = 4."],
    solution: "1. Area ∝ r², so doubling r multiplies the area by 2² = **4**.\n\nAnswer: **4**.",
    approach: "Lengths scale by k, areas by k², volumes by k³. Doubling the radius would multiply the circumference by only 2.",
    tags: ["scaling"],
    timeTargetSec: 40,
  },
  {
    slug: "me4-room-floor-tiles",
    topic: "mensuration",
    title: "Tiles for a floor",
    prompt:
      "How many square tiles of side **50 cm** are needed to cover a floor measuring **8 m × 6 m**?",
    options: ["144", "168", "192", "216"],
    answer: 2,
    difficulty: "medium",
    hints: [
      "Convert to the same units: the floor is 800 cm × 600 cm.",
      "Each tile covers 2,500 cm².",
    ],
    solution:
      "1. Floor area = 800 × 600 = 4,80,000 cm².\n2. Tile area = 50 × 50 = 2,500 cm².\n3. Tiles = 4,80,000 ÷ 2,500 = **192**.\n\nAnswer: **192**.",
    approach:
      "Convert to one unit before dividing. Counting tiles along each side works too: 16 across by 12 down gives the same 192.",
    tags: ["area"],
    timeTargetSec: 90,
  },
];
