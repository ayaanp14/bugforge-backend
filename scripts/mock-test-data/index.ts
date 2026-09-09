/**
 * The test patterns, as candidates actually sit them.
 *
 * Every pattern below is reconstructed from published prep-portal breakdowns
 * (PrepInsta, FACE Prep, placementpreparation.io, GeeksforGeeks) cross-checked
 * against each other. None of these companies publish an official blueprint,
 * and real drives vary, so each entry carries a `sourceNote` saying how firm
 * its numbers are and what was left out.
 *
 * IMPORTANT — what these papers cover. This engine serves multiple-choice
 * questions. Rounds that are not multiple choice are deliberately absent, and
 * each pattern says which ones: live coding, free-text essays, AI-graded
 * spoken communication, psychometric inventories and the game-based cognitive
 * modules. What remains is the aptitude and technical MCQ portion, which is
 * the part a candidate can actually drill.
 */

export interface SectionSeed {
  key: string;
  name: string;
  durationSec: number;
  questionCount: number;
  instructions?: string;
  /**
   * "mcq" draws from the aptitude bank. "coding" draws from the problem
   * catalogue, where `topics` matches a problem's tags and `difficulty` its
   * level, and is graded on test cases passed.
   */
  kind?: "mcq" | "coding";
  /** What one question here is worth. Coding problems are worth far more. */
  marksPerQuestion?: number;
  blueprint: Array<{ topics?: string[]; category?: string; difficulty?: "easy" | "medium" | "hard"; count: number }>;
}

export interface MockTestSeed {
  slug: string;
  company: string;
  name: string;
  family: "service" | "product" | "generic";
  blurb: string;
  instructions: string;
  negativeMark?: number;
  sectionalTiming?: boolean;
  isAdaptive?: boolean;
  highlights: string[];
  sourceNote: string;
  difficulty: "easy" | "medium" | "hard";
  orderIndex: number;
  sections: SectionSeed[];
}

const min = (n: number) => n * 60;

/* ── shared draw rules ─────────────────────────────────────────────── */

const QUANT = (count: number) => [{ category: "quantitative" as const, count }];
const LOGICAL = (count: number) => [{ category: "logical" as const, count }];
const VERBAL = (count: number) => [{ category: "verbal" as const, count }];

/** Numerical sections at these companies always carry a little DI. */
const NUMERICAL = (count: number) => [
  { category: "quantitative", count: Math.round(count * 0.8) },
  { category: "data-interpretation", count: count - Math.round(count * 0.8) },
];

/** Reasoning with the puzzle-flavoured topics weighted up. */
const REASONING = (count: number) => [
  { topics: ["number-series", "coding-decoding", "blood-relations", "direction-sense"], count: Math.round(count * 0.5) },
  { topics: ["syllogisms", "seating-arrangement", "analogies-classification", "mathematical-reasoning"], count: count - Math.round(count * 0.5) },
];

const PSEUDOCODE = (count: number) => [{ topics: ["pseudocode"], count }];

/**
 * A coding round. Ten marks a problem, graded on test cases passed, which is
 * how every one of these companies actually scores code.
 */
const CODING = (
  key: string,
  name: string,
  minutes: number,
  mix: Array<{ difficulty?: "easy" | "medium" | "hard"; count: number }>,
  instructions?: string
): SectionSeed => ({
  key,
  name,
  durationSec: min(minutes),
  questionCount: mix.reduce((sum, rule) => sum + rule.count, 0),
  instructions,
  kind: "coding",
  marksPerQuestion: 10,
  blueprint: mix,
});

/** The "technical" or "computer fundamentals" block of a services paper. */
const TECHNICAL = (count: number) => [
  { topics: ["programming-fundamentals"], count: Math.round(count * 0.4) },
  { topics: ["data-structures-mcq"], count: Math.round(count * 0.35) },
  { topics: ["os-dbms-networks"], count: count - Math.round(count * 0.4) - Math.round(count * 0.35) },
];

export const MOCK_TESTS: MockTestSeed[] = [
  /* ── TCS ───────────────────────────────────────────────────────── */
  {
    slug: "tcs-nqt-foundation",
    company: "TCS",
    name: "TCS NQT — Foundation",
    family: "service",
    blurb: "The section every NQT candidate must clear before any track opens. Three papers, twenty-five minutes each, and no going back.",
    instructions:
      "The Foundation section of the TCS National Qualifier Test is an elimination gate: fail it and no track opens, however well the Advanced section goes.\n\n- **Three sections, sectionally timed.** Numerical Ability, then Verbal Ability, then Reasoning Ability. Twenty-five minutes each.\n- **You cannot return to a section once you leave it.** The real test goes further and stops you returning to a previous *question*; this mock lets you move within the section you are in.\n- **No negative marking.** A guess costs nothing, so leave nothing blank.\n\nThe real NQT continues into an Advanced section and a ninety-minute coding round. Take the Foundation + Advanced paper for the aptitude half of that.",
    highlights: ["No negative marking", "Sectionally timed", "Elimination gate"],
    sourceNote:
      "Structure agreed across PrepInsta, FACE Prep, GeeksforGeeks and GUVI: 20/25/20 questions at 25 minutes each. One source reports 76 minutes and 26 for Verbal; the 75-minute split is the majority reading. The coding round is not covered here.",
    difficulty: "medium",
    orderIndex: 10,
    sections: [
      { key: "numerical", name: "Numerical Ability", durationSec: min(25), questionCount: 20, blueprint: NUMERICAL(20) },
      { key: "verbal", name: "Verbal Ability", durationSec: min(25), questionCount: 25, blueprint: VERBAL(25) },
      { key: "reasoning", name: "Reasoning Ability", durationSec: min(25), questionCount: 20, blueprint: REASONING(20) },
    ],
  },
  {
    slug: "tcs-nqt-full",
    company: "TCS",
    name: "TCS NQT — Foundation + Advanced",
    family: "service",
    blurb: "The full aptitude half of the NQT: the Foundation gate plus the Advanced questions that decide Digital and Prime.",
    instructions:
      "One sitting of the TCS NQT decides Ninja, Digital and Prime eligibility at once. Foundation is the gate; the Advanced section is what separates the tracks.\n\n- **Five sections, sectionally timed.**\n- **Advanced Quantitative and Advanced Reasoning are harder and shorter** — fifteen questions between them, and the reported cut-offs are steep: roughly 9–12 of 15 for Digital, 12–15 for Prime.\n- **No negative marking anywhere.**\n\nThe ninety-minute Advanced Coding round is not part of this paper.",
    highlights: ["No negative marking", "Sectionally timed", "Decides Ninja / Digital / Prime"],
    sourceNote:
      "Foundation counts are well corroborated. The Advanced aptitude split (10 quantitative + 5 reasoning in a shared 25 minutes) comes from PrepInsta and placementpreparation.io; here the shared window is split so each section has its own clock. Coding is excluded.",
    difficulty: "hard",
    orderIndex: 11,
    sections: [
      { key: "numerical", name: "Numerical Ability", durationSec: min(25), questionCount: 20, blueprint: NUMERICAL(20) },
      { key: "verbal", name: "Verbal Ability", durationSec: min(25), questionCount: 25, blueprint: VERBAL(25) },
      { key: "reasoning", name: "Reasoning Ability", durationSec: min(25), questionCount: 20, blueprint: REASONING(20) },
      {
        key: "advanced-quant",
        name: "Advanced Quantitative Ability",
        durationSec: min(17),
        questionCount: 10,
        instructions: "Harder arithmetic and algebra, with geometry and trigonometry in range.",
        blueprint: [
          { category: "quantitative", difficulty: "hard", count: 7 },
          { category: "quantitative", difficulty: "medium", count: 3 },
        ],
      },
      {
        key: "advanced-reasoning",
        name: "Advanced Reasoning Ability",
        durationSec: min(8),
        questionCount: 5,
        blueprint: [
          { category: "logical", difficulty: "hard", count: 4 },
          { category: "logical", difficulty: "medium", count: 1 },
        ],
      },
    ],
  },

  /* ── Infosys ───────────────────────────────────────────────────── */
  {
    slug: "infosys-systems-engineer",
    company: "Infosys",
    name: "Infosys SE / DSE — Aptitude",
    family: "service",
    blurb: "Five sections with independent cut-offs. A strong quant score will not rescue a weak puzzle score.",
    instructions:
      "The Infosys Systems Engineer paper is the one to respect section by section. Every section carries its own percentile cut-off and there is **no compensation between them** — clearing four and failing one ends the attempt.\n\n- **Mathematical Ability** is only ten questions but gets thirty-five minutes. They are hard.\n- **Pseudocode** is reported to carry double marks per question, so five questions matter more than their count suggests.\n- **Puzzle Solving** is four questions in ten minutes and is where most candidates run out of time.\n- **No negative marking.**\n\nSome drives append an English writing task; free-text answers are not part of this paper.",
    highlights: ["Sectional cut-offs", "No negative marking", "Pseudocode double-weighted"],
    sourceNote:
      "The 10/35, 15/25, 20/20, 5/10, 4/10 breakdown is corroborated identically by PrepInsta, placementpreparation.io and FACE Prep — the firmest number set of any pattern here. The optional English Writing block is omitted.",
    difficulty: "hard",
    orderIndex: 20,
    sections: [
      {
        key: "mathematical",
        name: "Mathematical Ability",
        durationSec: min(35),
        questionCount: 10,
        instructions: "Ten questions, thirty-five minutes. They are meant to take three minutes each.",
        blueprint: [
          { category: "quantitative", difficulty: "hard", count: 5 },
          { category: "quantitative", difficulty: "medium", count: 3 },
          { category: "data-interpretation", count: 2 },
        ],
      },
      { key: "logical", name: "Logical Reasoning", durationSec: min(25), questionCount: 15, blueprint: REASONING(15) },
      { key: "verbal", name: "Verbal Ability", durationSec: min(20), questionCount: 20, blueprint: VERBAL(20) },
      {
        key: "pseudocode",
        name: "Pseudocode",
        durationSec: min(10),
        questionCount: 5,
        instructions: "C-flavoured pseudocode. Trace it and give the output, or say what it computes.",
        blueprint: PSEUDOCODE(5),
      },
      {
        key: "puzzles",
        name: "Puzzle Solving",
        durationSec: min(10),
        questionCount: 4,
        instructions: "Four constraint puzzles in ten minutes. Draw the grid before you answer.",
        blueprint: [
          { topics: ["seating-arrangement"], difficulty: "hard", count: 2 },
          { topics: ["mathematical-reasoning"], count: 2 },
        ],
      },
    ],
  },

  /* ── Wipro ─────────────────────────────────────────────────────── */
  {
    slug: "wipro-nlth-aptitude",
    company: "Wipro",
    name: "Wipro NLTH — Aptitude",
    family: "service",
    blurb: "Fifty-two questions in forty-eight minutes. The fastest pace of any services paper.",
    instructions:
      "The aptitude block of Wipro's National Level Talent Hunt is short and quick: fifty-two questions in forty-eight minutes, under a minute each.\n\n- **Verbal is the largest section and gets the least time** — twenty-two questions in fourteen minutes. Read the question before the passage.\n- **Sectionally timed**, in a fixed order.\n- **No negative marking** in the aptitude block.\n\nThe NLTH also has a twenty-minute written communication essay and a sixty-minute two-problem coding round. Neither is part of this paper.",
    highlights: ["No negative marking", "Under a minute per question", "Sectionally timed"],
    sourceNote:
      "The lowest-confidence pattern here. The 48-minute window and three sub-sections are agreed everywhere, but four different question counts circulate (52, 48, ~36 and 20). The 16/14/22 split is used because its sub-timings sum exactly to 48 minutes. Essay and coding are excluded.",
    difficulty: "medium",
    orderIndex: 30,
    sections: [
      { key: "quantitative", name: "Quantitative Ability", durationSec: min(16), questionCount: 16, blueprint: NUMERICAL(16) },
      { key: "logical", name: "Logical Ability", durationSec: min(18), questionCount: 14, blueprint: REASONING(14) },
      { key: "verbal", name: "English Ability", durationSec: min(14), questionCount: 22, blueprint: VERBAL(22) },
    ],
  },

  /* ── Accenture ─────────────────────────────────────────────────── */
  {
    slug: "accenture-cognitive-technical",
    company: "Accenture",
    name: "Accenture — Cognitive & Technical",
    family: "service",
    blurb: "One shared clock across every section, and you may move between them freely. The pseudocode block is the largest.",
    instructions:
      "Accenture's paper is the odd one out, in a way that changes how you should sit it.\n\n- **One shared timer for the whole paper.** There is no per-section clock.\n- **You may move between sections freely** — so sweep the easy marks across every section first, then come back.\n- **Pseudo Code is the biggest single block**, larger than any of the three cognitive sections.\n- **No negative marking.**\n\nThe coding round and the AI-graded communication assessment are not part of this paper, and neither is the Common Applications and MS Office block, which this bank does not cover.",
    negativeMark: 0,
    sectionalTiming: false,
    highlights: ["One shared clock", "Move between sections freely", "No negative marking"],
    sourceNote:
      "Follows the well-documented Pattern A: 17 verbal, 18 reasoning, 15 numerical, 18 pseudocode, 10 networking and cloud, all on one 90-minute clock. The 12-question MS Office block is omitted and the time reduced to match. A newer 2026 pattern replaces the cognitive sections with games; that is not modelled.",
    difficulty: "medium",
    orderIndex: 40,
    sections: [
      { key: "verbal", name: "Verbal Ability", durationSec: min(17), questionCount: 17, blueprint: VERBAL(17) },
      { key: "reasoning", name: "Reasoning Ability", durationSec: min(18), questionCount: 18, blueprint: REASONING(18) },
      { key: "numerical", name: "Numerical Ability", durationSec: min(15), questionCount: 15, blueprint: NUMERICAL(15) },
      {
        key: "pseudocode",
        name: "Pseudo Code",
        durationSec: min(18),
        questionCount: 18,
        blueprint: [
          { topics: ["pseudocode"], count: 12 },
          { topics: ["programming-fundamentals"], count: 6 },
        ],
      },
      {
        key: "networking",
        name: "Networking, Security & Cloud",
        durationSec: min(10),
        questionCount: 10,
        blueprint: [{ topics: ["os-dbms-networks"], count: 10 }],
      },
    ],
  },

  /* ── Cognizant ─────────────────────────────────────────────────── */
  {
    slug: "cognizant-genc-aptitude",
    company: "Cognizant",
    name: "Cognizant GenC — Aptitude",
    family: "service",
    blurb: "Eighty questions in a hundred minutes, with reasoning the biggest section by some way.",
    instructions:
      "The aptitude round of the GenC assessment. The same paper feeds both GenC and GenC Next; performance decides which offer follows.\n\n- **Logical Reasoning is the largest section** at thirty-five questions, and carries the most marks.\n- **Sectionally timed**, in a fixed order.\n- **No negative marking.**\n\nThe communication assessment that precedes it and the cluster-based technical round that follows are not part of this paper.",
    highlights: ["No negative marking", "Reasoning-heavy", "Sectionally timed"],
    sourceNote:
      "Follows placementpreparation.io's breakdown (25/35, 35/45, 20/20), whose sub-timings are internally consistent. Cognizant's overall shape is genuinely contested — four incompatible patterns circulate, one of which replaces reasoning with game-based tasks.",
    difficulty: "medium",
    orderIndex: 50,
    sections: [
      { key: "numerical", name: "Numerical Ability", durationSec: min(35), questionCount: 25, blueprint: NUMERICAL(25) },
      { key: "logical", name: "Logical Reasoning", durationSec: min(45), questionCount: 35, blueprint: REASONING(35) },
      { key: "verbal", name: "Verbal Ability", durationSec: min(20), questionCount: 20, blueprint: VERBAL(20) },
    ],
  },

  /* ── Capgemini ─────────────────────────────────────────────────── */
  {
    slug: "capgemini-technical-english",
    company: "Capgemini",
    name: "Capgemini — Technical & English",
    family: "service",
    blurb: "A heavy technical block with pseudocode, then thirty questions of English. Each section must be cleared on its own.",
    instructions:
      "Capgemini gates section by section: each one has its own cut-off and you must clear it to reach the next.\n\n- **Technical MCQs and Pseudocode** are one forty-question block covering programming fundamentals, data structures, OS, DBMS and networks. The reported cut-off is 60–65%.\n- **English Communication** is thirty questions of grammar, vocabulary and comprehension. The reported cut-off is 65%.\n- **No negative marking.**\n\nThe game-based cognitive round, the behavioural inventory and the coding round are not part of this paper. The games are genuinely adaptive and cannot be practised as multiple choice.",
    highlights: ["Sectional cut-offs", "No negative marking", "Technical-heavy"],
    sourceNote:
      "Section sizes from PrepInsta and placementpreparation.io, which agree on 40 technical and 30 English. One source reports 30 technical instead. The four-game cognitive round, drawn from a pool of twenty-four, is excluded.",
    difficulty: "hard",
    orderIndex: 60,
    sections: [
      {
        key: "technical",
        name: "Technical MCQs & Pseudocode",
        durationSec: min(45),
        questionCount: 40,
        instructions: "Programming fundamentals, data structures, OS, DBMS and networks, plus pseudocode tracing.",
        blueprint: [
          { topics: ["pseudocode"], count: 10 },
          { topics: ["programming-fundamentals"], count: 12 },
          { topics: ["data-structures-mcq"], count: 10 },
          { topics: ["os-dbms-networks"], count: 8 },
        ],
      },
      { key: "english", name: "English Communication", durationSec: min(30), questionCount: 30, blueprint: VERBAL(30) },
    ],
  },

  /* ── HCLTech ───────────────────────────────────────────────────── */
  {
    slug: "hcltech-aptitude-technical",
    company: "HCLTech",
    name: "HCLTech — Written Test",
    family: "service",
    blurb: "Four sections, fifteen questions, fifteen minutes each. A flat seventy per cent cut-off on every one.",
    instructions:
      "The cleanest pattern of the lot: four sections of fifteen questions, fifteen minutes each.\n\n- **A seventy per cent cut-off on every section** — about eleven of fifteen. Aim for twelve.\n- **Time does not carry over.** Finishing a section early does not lengthen the next one.\n- **No negative marking.**\n\nHCLTech runs its coding in the technical interview rather than the written test, so nothing is missing from this paper.",
    highlights: ["70% cut-off per section", "No negative marking", "No time carried over"],
    sourceNote:
      "FACE Prep's 4 × 15 × 15 pattern, independently corroborated. A longer 77-question variant with a 30-question computer fundamentals block and a coding round is also reported; this is the shorter, better-attested one.",
    difficulty: "medium",
    orderIndex: 70,
    sections: [
      { key: "quantitative", name: "Quantitative Aptitude", durationSec: min(15), questionCount: 15, blueprint: NUMERICAL(15) },
      { key: "logical", name: "Logical Reasoning", durationSec: min(15), questionCount: 15, blueprint: REASONING(15) },
      { key: "verbal", name: "Verbal Ability", durationSec: min(15), questionCount: 15, blueprint: VERBAL(15) },
      { key: "technical", name: "Technical", durationSec: min(15), questionCount: 15, blueprint: TECHNICAL(15) },
    ],
  },

  /* ── Tech Mahindra ─────────────────────────────────────────────── */
  {
    slug: "tech-mahindra-written",
    company: "Tech Mahindra",
    name: "Tech Mahindra — Aptitude & Technical",
    family: "service",
    blurb: "The one paper where a wrong answer can cost you. Five short sections, fifteen minutes each.",
    instructions:
      "Tech Mahindra is the only pattern here where negative marking is credibly reported, so this paper applies it.\n\n- **A quarter mark is deducted for a wrong answer.** A blank costs nothing. Guess only when you can eliminate two options.\n- **Five sections of twelve questions, fifteen minutes each**, in a fixed order with no going back.\n- **Computer Programming and Computer Science** are separate blocks: the first is output tracing and OOP, the second is OS, DBMS, data structures and networks.\n\nThe essay, the seventy-two question psychometric inventory, the Automata code-completion round and the AI communication assessment are not part of this paper.",
    negativeMark: 0.25,
    highlights: ["Negative marking", "Sectionally timed", "Two technical blocks"],
    sourceNote:
      "Sources contradict each other on negative marking: placementpreparation.io reports it as confirmed for recent drives, FACE Prep says there is none. It is applied here because practising under it is the safer preparation. Section sizes follow the campus AMCAT-style pattern.",
    difficulty: "hard",
    orderIndex: 80,
    sections: [
      { key: "logical", name: "Logical Reasoning", durationSec: min(15), questionCount: 12, blueprint: REASONING(12) },
      { key: "quantitative", name: "Quantitative Aptitude", durationSec: min(15), questionCount: 12, blueprint: NUMERICAL(12) },
      { key: "verbal", name: "Verbal Ability", durationSec: min(15), questionCount: 12, blueprint: VERBAL(12) },
      {
        key: "programming",
        name: "Computer Programming",
        durationSec: min(15),
        questionCount: 12,
        blueprint: [
          { topics: ["programming-fundamentals"], count: 8 },
          { topics: ["pseudocode"], count: 4 },
        ],
      },
      {
        key: "computer-science",
        name: "Computer Science",
        durationSec: min(15),
        questionCount: 12,
        blueprint: [
          { topics: ["data-structures-mcq"], count: 6 },
          { topics: ["os-dbms-networks"], count: 6 },
        ],
      },
    ],
  },

  /* ── pure coding assessments ───────────────────────────────────── */
  {
    slug: "google-online-assessment",
    company: "Google",
    name: "Google — Online Assessment",
    family: "product",
    blurb: "Two problems, ninety minutes, nothing else. Google's screen has no aptitude section and never has.",
    instructions:
      "Google's university online assessment is two coding problems in ninety minutes, on a shared clock. There is no aptitude round, no reasoning section and no multiple-choice paper.\n\n- **Both problems are open at once.** Read them both before you start writing.\n- **Marks are per test case**, so a partial solution scores. Never leave an empty editor.\n- Expect graph or tree traversal, a rules-based simulation, or heavy string and array work.\n\nNot every applicant receives this assessment. Candidates who come through a recruiter often skip straight to the technical screen.",
    sectionalTiming: false,
    highlights: ["Pure coding", "Partial credit per test case", "One shared clock"],
    sourceNote:
      "Shape well documented, exact counts crowd-sourced. Two problems in 60 to 90 minutes is the dominant report; some 2025 write-ups describe a three-task variant whose third task is code analysis. Ninety minutes is used here.",
    difficulty: "hard",
    orderIndex: 85,
    sections: [
      CODING("coding", "Coding", 90, [{ difficulty: "medium", count: 2 }], "Two problems, one clock. Move between them freely."),
    ],
  },
  {
    slug: "microsoft-online-assessment",
    company: "Microsoft",
    name: "Microsoft — Online Assessment",
    family: "product",
    blurb: "Two problems on Codility. Below sixty per cent is an automatic no.",
    instructions:
      "Microsoft screens on Codility or HackerRank: two coding problems in ninety minutes, and nothing that is not code.\n\n- **The reported scoring is blunt.** Below sixty per cent is an automatic rejection; a hundred per cent is an automatic pass; between the two a recruiter reads it.\n- **Partial credit counts**, so finish something rather than perfecting nothing.\n- Trees, dynamic programming, arrays and strings are the usual ground.\n\nIndia campus drives add a proctored secure browser, and some tracks add a separate skills assessment in Java and SQL. Neither changes the coding round.",
    sectionalTiming: false,
    highlights: ["Pure coding", "60% is the reported floor", "One shared clock"],
    sourceNote:
      "Well documented in shape. Two to three problems in 60 to 90 minutes across sources, scaling with seniority. The 60/100 per cent thresholds are consistently repeated but crowd-sourced rather than official.",
    difficulty: "hard",
    orderIndex: 86,
    sections: [CODING("coding", "Coding", 90, [{ difficulty: "medium", count: 2 }])],
  },
  {
    slug: "meta-coding-screen",
    company: "Meta",
    name: "Meta — Coding Screen",
    family: "product",
    blurb: "Four problems in seventy minutes. Most candidates do not finish, and that is expected.",
    instructions:
      "Meta's screen is the tightest clock here: four problems in seventy minutes, about seventeen minutes each.\n\n- **Speed is the test.** Not finishing is normal; getting three clean is a strong result.\n- **Do not polish.** Get a correct solution down, then move.\n- **One shared clock**, so triage the four by difficulty before you start.\n\nMeta also runs a different format in which a single large problem unlocks in four stages, and its real assessment is video and microphone monitored throughout. This paper models the four-discrete-problem variant, which is the one that can be reproduced.",
    sectionalTiming: false,
    highlights: ["Pure coding", "Seventeen minutes a problem", "Most do not finish"],
    sourceNote:
      "Varies a lot, and Meta's format changed in 2025. Two live formats are reported: one CodeSignal problem in four unlocking stages over 90 minutes, and four separate problems in 70 minutes. The second is modelled because the staged format cannot be.",
    difficulty: "hard",
    orderIndex: 87,
    sections: [
      CODING("coding", "Coding", 70, [
        { difficulty: "easy", count: 2 },
        { difficulty: "medium", count: 2 },
      ], "Four problems, seventy minutes. Triage before you write."),
    ],
  },
  {
    slug: "apple-coding-assessment",
    company: "Apple",
    name: "Apple — Coding Assessment",
    family: "product",
    blurb: "Three problems, and at least one where brute force will time out.",
    instructions:
      "Apple has no single company-wide assessment; it is set team by team, and many candidates never sit one at all. Where it exists it is roughly three problems in ninety minutes.\n\n- **At least one problem needs a genuinely efficient algorithm.** A working brute force will exceed the time limit.\n- **Implementation quality is weighted unusually heavily** at Apple, so write it as you would want to read it.\n- Arrays, strings, trees, graphs and dynamic programming, with memory-aware solutions favoured.\n\nQA and SDET roles instead get one coding problem plus thirty domain multiple-choice questions. That is a different paper and is not modelled.",
    sectionalTiming: false,
    highlights: ["Pure coding", "One problem needs the optimal solution", "Team-dependent"],
    sourceNote:
      "The least standardised company here, and entirely crowd-sourced. Ninety minutes and three problems is the most-reported shape, with 60 to 90-plus minutes and an unfixed count also reported.",
    difficulty: "hard",
    orderIndex: 88,
    sections: [
      CODING("coding", "Coding", 90, [
        { difficulty: "easy", count: 1 },
        { difficulty: "medium", count: 1 },
        { difficulty: "hard", count: 1 },
      ]),
    ],
  },
  {
    slug: "flipkart-online-coding",
    company: "Flipkart",
    name: "Flipkart — Online Coding",
    family: "product",
    blurb: "Three problems in ninety minutes, and complexity is judged, not just correctness.",
    instructions:
      "Flipkart's first round is three coding problems in ninety minutes on a proctored platform. There is no aptitude or reasoning section at all.\n\n- **All test cases must pass** for a problem to count as solved in the real round, and time and space complexity are assessed alongside correctness.\n- The reported clear rate is around ten to fifteen per cent, so treat a partial score here as normal.\n- Arrays, strings, trees, graphs, hashing, sliding window, recursion and dynamic programming.\n\nThe machine-coding round that follows, where you build a small runnable program from a specification, is a different exercise and is not modelled.",
    sectionalTiming: false,
    highlights: ["Pure coding", "Complexity is assessed", "Low clear rate"],
    sourceNote:
      "Well documented, and the absence of an aptitude section is explicit in the sources. Three problems in 90 minutes is the main report; some batches add a debugging block.",
    difficulty: "hard",
    orderIndex: 89,
    sections: [CODING("coding", "Coding", 90, [{ difficulty: "medium", count: 3 }])],
  },
  {
    slug: "salesforce-swe-assessment",
    company: "Salesforce",
    name: "Salesforce — SWE Assessment",
    family: "product",
    blurb: "Two problems written as stories rather than puzzles. India-gated, and purely coding.",
    instructions:
      "Salesforce runs an India-gated HackerRank assessment: two coding problems, seventy-five minutes, no aptitude section.\n\n- **The problems read as narratives, not textbook data-structure puzzles.** They describe a scenario to simulate, and an efficient solution is still required.\n- **The two are not worth the same.** The reported split is fifty points for the first and seventy-five for the second, out of a hundred and twenty-five.\n\nSome 2025 and 2026 drives add an AI interviewer component after this round.",
    sectionalTiming: false,
    highlights: ["Pure coding", "Narrative problems", "India-gated"],
    sourceNote:
      "Crowd-sourced but consistent across several candidate threads. Duration is reported as 60 minutes in 2024 and 75 in 2025; the 50 and 75 point split is repeatedly confirmed. This paper marks both problems equally.",
    difficulty: "medium",
    orderIndex: 91,
    sections: [CODING("coding", "Coding", 75, [{ difficulty: "medium", count: 2 }])],
  },
  {
    slug: "infosys-specialist-programmer",
    company: "Infosys",
    name: "Infosys SP / DSE — Coding",
    family: "product",
    blurb: "Three hours, three problems, an easy-medium-hard ladder. Which ones you solve sets the offer.",
    instructions:
      "The Specialist Programmer and Power Programmer route skips the aptitude paper entirely: three coding problems in three hours, and the package depends on how far up the ladder you get.\n\n- **The ladder is deliberate.** The first should take about half an hour, the second forty-five to sixty minutes, the third an hour or more.\n- **The reported pass thresholds rise with it**: all test cases on the first, about eighty per cent on the second, about seventy-five on the third.\n- **Partial marking per test case**, and no negative marking.\n\nThe package band, from roughly seven to twenty-one lakh, is decided by which problems you clear. Note this is a different test from the Systems Engineer aptitude paper, which is also in this catalogue.",
    sectionalTiming: false,
    highlights: ["Pure coding", "Easy, medium, hard ladder", "Three hours"],
    sourceNote:
      "Well attested and consistent across sources: 3 problems, 180 minutes, HackerRank, no MCQ section. The naming is a trap, as 'DSE' is used for both this coding track and the aptitude-track Digital Specialist Engineer role.",
    difficulty: "hard",
    orderIndex: 21,
    sections: [
      CODING("coding", "Coding", 180, [
        { difficulty: "easy", count: 1 },
        { difficulty: "medium", count: 1 },
        { difficulty: "hard", count: 1 },
      ], "Solve them in order. The first should be quick; the third is meant to be hard."),
    ],
  },
  {
    slug: "tcs-nqt-advanced-coding",
    company: "TCS",
    name: "TCS NQT — Advanced Coding",
    family: "service",
    blurb: "The ninety-minute coding round that decides Digital and Prime, on its own.",
    instructions:
      "The Advanced Coding round of the TCS NQT, separated out so it can be sat without the two-hour aptitude paper first.\n\n- **Ninety minutes**, raised from seventy-five for the 2026 cycle.\n- **Partial marks are awarded** for a solution that passes some test cases.\n- **The reported thresholds are one problem for Ninja, two for Digital and all three for Prime.**\n\nTCS accepts C, C++, Java, Python and Perl. This paper models two problems; sources disagree on whether the real round sets two or three.",
    sectionalTiming: false,
    highlights: ["Partial marks", "Decides Digital and Prime", "Ninety minutes"],
    sourceNote:
      "The 90-minute window is agreed everywhere. The problem count is genuinely disputed: one major source says three and gives a one, two, three threshold ladder, while several others say two. Two are drawn here.",
    difficulty: "hard",
    orderIndex: 12,
    sections: [
      CODING("coding", "Advanced Coding", 90, [
        { difficulty: "easy", count: 1 },
        { difficulty: "medium", count: 1 },
      ]),
    ],
  },
  {
    slug: "wipro-nlth-programming",
    company: "Wipro",
    name: "Wipro NLTH — Programming",
    family: "service",
    blurb: "Two problems in an hour: one on fundamentals, one on data structures.",
    instructions:
      "The programming round of Wipro's National Level Talent Hunt, which follows the aptitude paper and the written communication essay.\n\n- **You pick one language for the whole round** from Java, C, C++ and Python, and cannot change it.\n- **The two problems are deliberately unequal.** The first is general programming and should take around twenty minutes; the second is data structures and algorithms and takes the rest.\n- The reported cut-off for this round is eighty per cent.",
    sectionalTiming: false,
    highlights: ["One language for the round", "Two unequal problems", "80% cut-off"],
    sourceNote:
      "Sources agree on 2 problems in 60 minutes and on the fundamentals-then-DSA split. Some Wipro tech-track drives add an Automata Fix round in which you repair pre-written code; that is not modelled.",
    difficulty: "medium",
    orderIndex: 31,
    sections: [
      CODING("coding", "Online Programming", 60, [
        { difficulty: "easy", count: 1 },
        { difficulty: "medium", count: 1 },
      ]),
    ],
  },

  /* ── product companies ─────────────────────────────────────────── */
  {
    slug: "amazon-reasoning-debugging",
    company: "Amazon",
    name: "Amazon — SDE Online Assessment",
    family: "product",
    blurb: "Debugging, then two coding problems, then reasoning. The three parts of the assessment that can be reproduced.",
    instructions:
      "Amazon's SDE assessment runs as one long sitting with the parts in a fixed order, and this paper follows it.\n\n- **Code Debugging** first: short snippets with a defect, about three minutes each.\n- **Coding** next, and this is the part that decides the outcome. Two problems in seventy minutes, marked per test case.\n- **Logical Reasoning** last, and it appears only in some India batches rather than every one.\n- **Sections lock when you leave them.** Amazon does not let you go back between parts, and neither does this.\n\nTwo parts of the real assessment are missing because they cannot be reproduced: the Work Simulation, an inbox exercise scored against Amazon's leadership principles, and the Work Style Survey, roughly eighty statements with no right answer.",
    highlights: ["Coding decides it", "Sections lock behind you", "No negative marking"],
    sourceNote:
      "Coding is well documented at 2 problems in 70 minutes with partial scoring. The other two blocks are weaker: sources disagree on the reasoning block (24 questions in 35 minutes versus about 20 in 20) and the debugging count (7 versus 6-8), the larger figures being used, and both are batch-dependent. Amazon's own careers page confirms only that an assessment 'includes a coding test'.",
    difficulty: "hard",
    orderIndex: 90,
    sections: [
      {
        key: "debugging",
        name: "Code Debugging",
        durationSec: min(20),
        questionCount: 7,
        instructions: "Short snippets with a defect. About three minutes each.",
        blueprint: [
          { topics: ["programming-fundamentals"], count: 4 },
          { topics: ["pseudocode"], count: 3 },
        ],
      },
      CODING("coding", "Coding", 70, [{ difficulty: "medium", count: 2 }], "Two problems, seventy minutes. Marked on test cases passed."),
      {
        key: "reasoning",
        name: "Logical Reasoning",
        durationSec: min(35),
        questionCount: 24,
        instructions: "Series, syllogisms, arrangements and light data interpretation.",
        blueprint: [
          { topics: ["number-series", "syllogisms", "seating-arrangement"], count: 14 },
          { category: "logical", count: 6 },
          { category: "data-interpretation", count: 4 },
        ],
      },
    ],
  },
  {
    slug: "goldman-sachs-aptitude",
    company: "Goldman Sachs",
    name: "Goldman Sachs — Aptitude Test",
    family: "product",
    blurb: "The one paper that punishes a guess. Five marks for a right answer, two off for a wrong one.",
    instructions:
      "Goldman Sachs runs the heaviest aptitude round of any firm hiring engineers in India, and the only one where guessing is a losing strategy.\n\n- **Marking is +5 for a correct answer and −2 for a wrong one.** A blank scores zero. Answer only when you can eliminate at least two options.\n- **One shared clock** across every section, and you may move between them freely.\n- The reported cut-off is around **75 per cent**.\n\nThe real Round 1 also carries an Abstract Reasoning and a Diagrammatic Reasoning section, twelve questions each, built entirely from figures and flowcharts. Those are not multiple-choice text questions and are not covered here, so this paper runs four sections rather than six.",
    negativeMark: 0.4,
    sectionalTiming: false,
    highlights: ["Negative marking", "One shared clock", "~75% cut-off"],
    sourceNote:
      "The best-documented pattern in this catalogue: PrepInsta, placementpreparation.io and GraduatesFirst agree on 66 questions, 90 minutes, six sections and the +5/−2 marking. The two figure-based sections are omitted and the time reduced in proportion.",
    difficulty: "hard",
    orderIndex: 100,
    sections: [
      {
        key: "numerical-computation",
        name: "Numerical Computation",
        durationSec: min(9),
        questionCount: 8,
        instructions: "Arithmetic under time: percentages, averages, probability, counting.",
        blueprint: [{ category: "quantitative", count: 8 }],
      },
      {
        key: "numerical-reasoning",
        name: "Numerical Reasoning",
        durationSec: min(16),
        questionCount: 12,
        instructions: "Data interpretation from tables and charts, plus number series.",
        blueprint: [
          { category: "data-interpretation", count: 8 },
          { topics: ["number-series"], count: 4 },
        ],
      },
      { key: "logical", name: "Logical Reasoning", durationSec: min(16), questionCount: 12, blueprint: LOGICAL(12) },
      { key: "verbal", name: "Verbal Reasoning", durationSec: min(14), questionCount: 10, blueprint: VERBAL(10) },
    ],
  },
  {
    slug: "deloitte-assessment",
    company: "Deloitte",
    name: "Deloitte — Online Assessment",
    family: "product",
    blurb: "Sixty-five questions in an hour, with the technical block the largest of the three.",
    instructions:
      "Deloitte's assessment puts more weight on computer fundamentals than on aptitude: thirty of the sixty-five questions are technical.\n\n- **Reported sectional cut-offs** are roughly eleven of twenty-two on aptitude, seven of thirteen on English, and eleven of thirty on technical.\n- **No negative marking.**\n- Sources disagree on whether the paper is adaptive; this one is not.\n\nThe two coding problems that follow the MCQ block are not part of this paper.",
    highlights: ["No negative marking", "Technical-heavy", "Sectional cut-offs"],
    sourceNote:
      "PrepInsta and placementpreparation.io agree on 13 / 22 / 30 MCQs and the 90-minute total including coding. They differ on whether the timer is shared or per-section; per-section is used here. Adaptivity is claimed by one source only and is not modelled.",
    difficulty: "medium",
    orderIndex: 110,
    sections: [
      { key: "language", name: "Language Skills", durationSec: min(10), questionCount: 13, blueprint: VERBAL(13) },
      {
        key: "aptitude",
        name: "General Aptitude",
        durationSec: min(25),
        questionCount: 22,
        instructions: "Quantitative and reasoning together, as Deloitte asks them.",
        blueprint: [
          { category: "quantitative", count: 12 },
          { category: "logical", count: 10 },
        ],
      },
      {
        key: "technical",
        name: "Technical Skills",
        durationSec: min(25),
        questionCount: 30,
        instructions: "Computer fundamentals: programming, data structures, DBMS, OS and networks.",
        blueprint: [
          { topics: ["programming-fundamentals"], count: 10 },
          { topics: ["data-structures-mcq"], count: 10 },
          { topics: ["os-dbms-networks"], count: 10 },
        ],
      },
    ],
  },
  {
    slug: "adobe-campus-aptitude",
    company: "Adobe",
    name: "Adobe — Campus Aptitude",
    family: "product",
    blurb: "Three clean sections of twenty questions, twenty minutes each. Nothing clever, just fast.",
    instructions:
      "Adobe's campus paper is the most straightforward on this list: three equal sections, hard-locked at twenty minutes each.\n\n- **A minute a question**, with no slack anywhere.\n- **No negative marking, not adaptive.**\n- Time does not carry between sections.\n\nThe sixty-minute coding round that follows is not part of this paper.",
    highlights: ["No negative marking", "A minute per question", "Sectionally timed"],
    sourceNote:
      "PrepInsta and TnPOfficer agree on 20 questions and 20 minutes for each of the three aptitude sections, differing only on whether the coding round has two or three problems. An off-campus variant with a different shape is also reported.",
    difficulty: "medium",
    orderIndex: 120,
    sections: [
      { key: "quantitative", name: "Quantitative Aptitude", durationSec: min(20), questionCount: 20, blueprint: NUMERICAL(20) },
      { key: "logical", name: "Logical Reasoning", durationSec: min(20), questionCount: 20, blueprint: REASONING(20) },
      { key: "verbal", name: "Verbal English", durationSec: min(20), questionCount: 20, blueprint: VERBAL(20) },
    ],
  },
  {
    slug: "zs-associates-aptitude",
    company: "ZS Associates",
    name: "ZS Associates — Aptitude",
    family: "product",
    blurb: "Sixty questions, seventy-five minutes, and no section locks. You decide where the time goes.",
    instructions:
      "ZS runs a pure aptitude round with no coding at all, and — unusually — **no sectional time limits**. The seventy-five minutes are yours to spend as you like across all four sections.\n\n- **Move freely between sections.** Sweep the data interpretation you can read quickly, then come back.\n- **No negative marking and no sectional cut-offs.** Leave nothing blank.\n- Data interpretation is a full quarter of the paper.\n\nThe eight-video business-scenario round that follows is not part of this paper.",
    sectionalTiming: false,
    highlights: ["No sectional locks", "No negative marking", "DI-heavy"],
    sourceNote:
      "Crowd-sourced. Sources agree on 75 minutes with free time allocation and no negative marking, but disagree on whether there are four sections or five — one adds an Attention to Detail block. Four are modelled.",
    difficulty: "medium",
    orderIndex: 130,
    sections: [
      { key: "quantitative", name: "Quantitative Aptitude", durationSec: min(22), questionCount: 18, blueprint: QUANT(18) },
      { key: "logical", name: "Logical Reasoning", durationSec: min(20), questionCount: 16, blueprint: LOGICAL(16) },
      { key: "verbal", name: "Verbal Ability", durationSec: min(15), questionCount: 14, blueprint: VERBAL(14) },
      { key: "data-interpretation", name: "Data Interpretation", durationSec: min(18), questionCount: 12, blueprint: [{ category: "data-interpretation", count: 12 }] },
    ],
  },
  {
    slug: "morgan-stanley-assessment",
    company: "Morgan Stanley",
    name: "Morgan Stanley — Aptitude & Technical",
    family: "product",
    blurb: "A short aptitude block, a long computer science block, then pseudocode. Technical weight sits at the front.",
    instructions:
      "Morgan Stanley's technology assessment leans hard on computer science: thirty of its fifty-three questions are fundamentals.\n\n- **Aptitude is only sixteen questions in twenty minutes** — the fastest section of the paper.\n- **Pseudo Code is a named section of its own**, seven questions in twenty minutes. Read the whole routine before you trace it.\n- **Sectionally timed.**\n\nThe three-problem coding round that follows is not part of this paper.",
    highlights: ["CS-heavy", "Dedicated pseudocode section", "Sectionally timed"],
    sourceNote:
      "Follows the one variant with explicit per-section timings (16/20, 30/30, 7/20 plus coding). Morgan Stanley genuinely runs different tests by division and region, and four incompatible patterns are reported; marking and cut-offs are documented nowhere.",
    difficulty: "hard",
    orderIndex: 140,
    sections: [
      {
        key: "aptitude",
        name: "Aptitude",
        durationSec: min(20),
        questionCount: 16,
        blueprint: [
          { category: "quantitative", count: 8 },
          { category: "logical", count: 8 },
        ],
      },
      {
        key: "cs-fundamentals",
        name: "CS Fundamentals",
        durationSec: min(30),
        questionCount: 30,
        instructions: "Data structures, algorithms, operating systems, databases and networks.",
        blueprint: [
          { topics: ["data-structures-mcq"], count: 16 },
          { topics: ["os-dbms-networks"], count: 14 },
        ],
      },
      { key: "pseudocode", name: "Pseudo Code", durationSec: min(20), questionCount: 7, blueprint: PSEUDOCODE(7) },
    ],
  },
  {
    slug: "oracle-aptitude-verbal",
    company: "Oracle",
    name: "Oracle — Aptitude & Verbal",
    family: "product",
    blurb: "Twenty questions on one clock. Short, but the cut-off is sixty per cent.",
    instructions:
      "Oracle's MCQ block is small — ten aptitude and ten verbal — and shares its clock with the coding rounds in the real test.\n\n- **One shared timer**; move between the two sections as you like.\n- **No negative marking, not adaptive.**\n- The reported cut-off is **sixty per cent** on both sections.\n\nOracle's coding round and its distinctive API-making round, where candidates build a REST endpoint rather than solve a puzzle, are not part of this paper.",
    sectionalTiming: false,
    highlights: ["No negative marking", "60% cut-off", "One shared clock"],
    sourceNote:
      "Crowd-sourced but internally consistent across PrepInsta's Oracle pages: 10 aptitude, 10 verbal, one coding and one API question in a shared 90 minutes. Other sources describe a different track with two or three coding problems and no API round.",
    difficulty: "medium",
    orderIndex: 150,
    sections: [
      {
        key: "aptitude",
        name: "Aptitude Assessment",
        durationSec: min(15),
        questionCount: 10,
        blueprint: [
          { category: "logical", count: 6 },
          { category: "quantitative", count: 4 },
        ],
      },
      { key: "verbal", name: "Verbal Assessment", durationSec: min(15), questionCount: 10, blueprint: VERBAL(10) },
    ],
  },
  {
    slug: "zoho-round-one",
    company: "Zoho",
    name: "Zoho — Round 1",
    family: "product",
    blurb: "Generous time, hard questions. Zoho tests depth rather than speed, on paper, at its own office.",
    instructions:
      "Zoho's first round is unlike anything else here. It is sat with pen and paper at a Zoho office, and the timing is deliberately unhurried — four minutes a question on the aptitude block.\n\n- **Depth over speed.** These questions are meant to be worked through properly, not raced.\n- **The technical block is C output prediction**, ten questions in forty-five minutes.\n- **No negative marking**, and there is no CGPA cut-off to reach the test.\n\nZoho runs six or seven rounds for freshers. The programming rounds that follow, including the three-hour no-internet coding round, are not part of this paper.",
    highlights: ["No negative marking", "Generous timing", "C output prediction"],
    sourceNote:
      "Zoho's shape is stable but its numbers are not — three credible sources give three different Round 1 specs (20+10, 25 MCQ, or 10 programming plus 10 aptitude written). This follows 2025 candidate reports: 20 aptitude in 80 minutes, then 10 technical in 45.",
    difficulty: "hard",
    orderIndex: 160,
    sections: [
      {
        key: "aptitude",
        name: "Aptitude",
        durationSec: min(80),
        questionCount: 20,
        instructions: "Four minutes a question. Work them properly.",
        blueprint: [
          { category: "quantitative", difficulty: "hard", count: 8 },
          { category: "quantitative", difficulty: "medium", count: 6 },
          { category: "logical", count: 6 },
        ],
      },
      {
        key: "technical",
        name: "Technical",
        durationSec: min(45),
        questionCount: 10,
        instructions: "C output prediction and programming fundamentals.",
        blueprint: [
          { topics: ["programming-fundamentals"], count: 7 },
          { topics: ["pseudocode"], count: 3 },
        ],
      },
    ],
  },

  /* ── general practice ──────────────────────────────────────────── */
  {
    slug: "big-tech-screen-prep",
    company: "CodeKairo",
    name: "Big Tech Screen — Theory Drill",
    family: "generic",
    blurb: "Not a company's paper. The computer science a Google, Microsoft, Meta or Apple screen assumes you already know.",
    instructions:
      "**This is not any company's real test, and it is important to be clear about that.**\n\nGoogle, Microsoft, Meta, Apple, Flipkart and Salesforce all screen with coding problems and nothing else. There is no aptitude round, no reasoning section and no multiple-choice paper to reproduce. Anyone selling you a MAANG aptitude mock is selling you a fiction.\n\nWhat this paper does instead is drill the theory those coding rounds assume: complexity, data structure trade-offs, the operating system and database facts that come up in the interview that follows, and the language semantics that decide whether your solution is correct.\n\n- **Sit the coding rounds themselves in the challenges section**, not here. That is where the offer is actually decided.\n- **No negative marking**, fifty questions in an hour.",
    highlights: ["Not a company pattern", "No negative marking", "CS fundamentals"],
    sourceNote:
      "Authored, not reconstructed. Google, Microsoft, Meta, Apple, Flipkart and Salesforce were all researched and none runs a non-coding MCQ round, so no paper of theirs exists to model. Amazon is the single exception and has its own paper.",
    difficulty: "hard",
    orderIndex: 6,
    sections: [
      {
        key: "data-structures",
        name: "Data Structures & Algorithms",
        durationSec: min(25),
        questionCount: 20,
        instructions: "Complexity, trade-offs, traversals and the classics.",
        blueprint: [{ topics: ["data-structures-mcq"], count: 20 }],
      },
      {
        key: "systems",
        name: "OS, DBMS & Networks",
        durationSec: min(18),
        questionCount: 15,
        blueprint: [{ topics: ["os-dbms-networks"], count: 15 }],
      },
      {
        key: "language",
        name: "Language Semantics",
        durationSec: min(17),
        questionCount: 15,
        instructions: "Output prediction in C, Java and Python, plus pseudocode tracing.",
        blueprint: [
          { topics: ["programming-fundamentals"], count: 10 },
          { topics: ["pseudocode"], count: 5 },
        ],
      },
    ],
  },
  {
    slug: "full-length-aptitude",
    company: "CodeKairo",
    name: "Full-Length Aptitude Paper",
    family: "generic",
    blurb: "A hundred questions across every section, in two hours. Not tied to any company — the endurance test.",
    instructions:
      "A full-length paper that is not shaped by any one company's pattern. Use it to build stamina and to find out which section quietly loses you the most marks.\n\n- **One hundred questions, two hours, sectionally timed.**\n- **No negative marking.**\n- The result breaks your score down by topic, so treat this as a diagnostic before you drill.",
    highlights: ["No negative marking", "Every section covered", "Diagnostic breakdown"],
    sourceNote: "Not a company pattern. Sized to a typical two-hour campus paper, weighted the way most services tests weight their sections.",
    difficulty: "medium",
    orderIndex: 5,
    sections: [
      { key: "quantitative", name: "Quantitative Aptitude", durationSec: min(35), questionCount: 30, blueprint: QUANT(30) },
      { key: "logical", name: "Logical Reasoning", durationSec: min(30), questionCount: 25, blueprint: LOGICAL(25) },
      { key: "verbal", name: "Verbal Ability", durationSec: min(25), questionCount: 25, blueprint: VERBAL(25) },
      { key: "data-interpretation", name: "Data Interpretation", durationSec: min(20), questionCount: 12, blueprint: [{ category: "data-interpretation", count: 12 }] },
      { key: "technical", name: "Technical MCQs", durationSec: min(10), questionCount: 8, blueprint: TECHNICAL(8) },
    ],
  },
  {
    slug: "quick-aptitude-sprint",
    company: "CodeKairo",
    name: "Thirty-Minute Sprint",
    family: "generic",
    blurb: "Thirty questions, thirty minutes, one section. For the days you only have half an hour.",
    instructions:
      "A single thirty-minute section mixing quantitative, reasoning and verbal, at roughly the pace of a services paper.\n\n- **One minute a question.** That is the pace every services test expects.\n- **No negative marking.**\n\nShort enough to sit before an interview, long enough to be honest about your speed.",
    highlights: ["Thirty minutes", "No negative marking", "Mixed sections"],
    sourceNote: "Not a company pattern. A short diagnostic at services-paper pace.",
    difficulty: "easy",
    orderIndex: 1,
    sections: [
      {
        key: "mixed",
        name: "Mixed Aptitude",
        durationSec: min(30),
        questionCount: 30,
        blueprint: [
          { category: "quantitative", count: 12 },
          { category: "logical", count: 10 },
          { category: "verbal", count: 8 },
        ],
      },
    ],
  },
];

/** Structural checks, so a bad blueprint fails the seed rather than a sitting. */
export function validateMockTests(tests: MockTestSeed[]) {
  const problems: string[] = [];
  const slugs = new Set<string>();
  for (const test of tests) {
    if (slugs.has(test.slug)) problems.push(`${test.slug}: duplicate slug`);
    slugs.add(test.slug);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(test.slug)) problems.push(`${test.slug}: slug must be kebab-case`);
    if (!test.sections.length) problems.push(`${test.slug}: no sections`);
    const keys = new Set<string>();
    for (const section of test.sections) {
      if (keys.has(section.key)) problems.push(`${test.slug}: duplicate section key ${section.key}`);
      keys.add(section.key);
      if (section.questionCount < 1) problems.push(`${test.slug}/${section.key}: no questions`);
      if (section.durationSec < 60) problems.push(`${test.slug}/${section.key}: under a minute`);
      const planned = section.blueprint.reduce((sum, rule) => sum + rule.count, 0);
      if (planned !== section.questionCount) {
        problems.push(`${test.slug}/${section.key}: blueprint draws ${planned} but the section holds ${section.questionCount}`);
      }
      for (const rule of section.blueprint) {
        // A coding rule may name a difficulty alone, because the whole problem
        // catalogue is a valid pool. An mcq rule must narrow the bank.
        if (section.kind !== "coding" && !rule.topics?.length && !rule.category) {
          problems.push(`${test.slug}/${section.key}: a rule names neither topics nor a category`);
        }
        if (section.kind === "coding" && !rule.topics?.length && !rule.difficulty) {
          problems.push(`${test.slug}/${section.key}: a coding rule names neither tags nor a difficulty`);
        }
        if (rule.count < 1) problems.push(`${test.slug}/${section.key}: a rule draws nothing`);
      }
    }
  }
  return problems;
}

export const totalQuestions = (test: MockTestSeed) => test.sections.reduce((sum, s) => sum + s.questionCount, 0);
export const totalDuration = (test: MockTestSeed) => test.sections.reduce((sum, s) => sum + s.durationSec, 0);
