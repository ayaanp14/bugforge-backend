/**
 * The aptitude syllabus: four sections, each a handful of topics. The
 * question bank in scripts/aptitude-data is keyed by topic id; the API
 * decorates these entries with counts and the candidate's progress, and the
 * frontend renders whatever comes back, so adding a topic is one entry here
 * plus its questions.
 */

export type AptitudeCategoryId = "quantitative" | "logical" | "verbal" | "data-interpretation" | "programming";
export type AptitudeDifficulty = "easy" | "medium" | "hard";

export interface AptitudeCategory {
  id: AptitudeCategoryId;
  label: string;
  blurb: string;
}

export interface AptitudeTopic {
  id: string;
  category: AptitudeCategoryId;
  label: string;
  blurb: string;
}

export const APTITUDE_CATEGORIES: AptitudeCategory[] = [
  { id: "quantitative", label: "Quantitative Aptitude", blurb: "Arithmetic and algebra the way placement papers ask it — fast, exact, and full of shortcuts." },
  { id: "logical", label: "Logical Reasoning", blurb: "Patterns, puzzles and deductions: the section that rewards a method more than a memory." },
  { id: "verbal", label: "Verbal Ability", blurb: "Grammar, vocabulary and reading — precision with words under a clock." },
  { id: "data-interpretation", label: "Data Interpretation", blurb: "Tables, charts and caselets: read the numbers, then reason about them." },
  { id: "programming", label: "Programming MCQs", blurb: "Pseudocode, output prediction and core computer science — the technical section of a placement paper." },
];

export const APTITUDE_TOPICS: AptitudeTopic[] = [
  // ── Quantitative ──
  { id: "number-system", category: "quantitative", label: "Number System", blurb: "Divisibility, remainders, HCF and LCM, unit digits, factors." },
  { id: "percentages", category: "quantitative", label: "Percentages", blurb: "Successive change, percentage points, and turning fractions into percentages fast." },
  { id: "profit-and-loss", category: "quantitative", label: "Profit & Loss", blurb: "Cost, marked and selling price, discounts, and dishonest scales." },
  { id: "ratio-and-proportion", category: "quantitative", label: "Ratio & Proportion", blurb: "Splitting, scaling, partnerships and variation." },
  { id: "averages", category: "quantitative", label: "Averages", blurb: "Weighted means, the effect of adding or removing a member, and deviation tricks." },
  { id: "ages", category: "quantitative", label: "Problems on Ages", blurb: "Relations between ages now, before and after — set up once, solve once." },
  { id: "time-and-work", category: "quantitative", label: "Time & Work", blurb: "Rates of work, pipes and cisterns, alternating days and efficiency." },
  { id: "time-speed-distance", category: "quantitative", label: "Time, Speed & Distance", blurb: "Trains, boats and streams, relative speed, average speed." },
  { id: "interest", category: "quantitative", label: "Simple & Compound Interest", blurb: "Growth over periods, the difference between SI and CI, and doubling times." },
  { id: "permutations-combinations", category: "quantitative", label: "Permutations & Combinations", blurb: "Counting arrangements and selections without listing them." },
  { id: "probability", category: "quantitative", label: "Probability", blurb: "Favourable over total, complements, and independent events." },
  { id: "mixtures-alligation", category: "quantitative", label: "Mixtures & Alligation", blurb: "Blending prices and concentrations; replacing part of a solution." },
  { id: "mensuration", category: "quantitative", label: "Mensuration", blurb: "Areas, perimeters, volumes and surface areas of the usual shapes." },
  // ── Logical ──
  { id: "number-series", category: "logical", label: "Number & Letter Series", blurb: "Find the rule, then the missing term." },
  { id: "coding-decoding", category: "logical", label: "Coding & Decoding", blurb: "Letter shifts, substitutions and pattern codes." },
  { id: "blood-relations", category: "logical", label: "Blood Relations", blurb: "Family trees from statements — draw, then answer." },
  { id: "direction-sense", category: "logical", label: "Direction Sense", blurb: "Turns, distances and where someone ends up." },
  { id: "syllogisms", category: "logical", label: "Syllogisms", blurb: "Which conclusions follow from the statements, and which only seem to." },
  { id: "seating-arrangement", category: "logical", label: "Seating & Puzzles", blurb: "Rows, circles and constraint puzzles." },
  { id: "analogies-classification", category: "logical", label: "Analogies & Classification", blurb: "Spot the relation, or the odd one out." },
  { id: "mathematical-reasoning", category: "logical", label: "Mathematical Reasoning", blurb: "Data sufficiency, number puzzles and statement-based deduction." },
  // ── Verbal ──
  { id: "vocabulary", category: "verbal", label: "Synonyms & Antonyms", blurb: "Word meaning in context, and its opposite." },
  { id: "sentence-correction", category: "verbal", label: "Sentence Correction", blurb: "Subject–verb agreement, tenses, prepositions and modifiers." },
  { id: "sentence-completion", category: "verbal", label: "Fill in the Blanks & Para Jumbles", blurb: "The word that fits, and the order that reads." },
  { id: "reading-comprehension", category: "verbal", label: "Reading Comprehension", blurb: "Short passages, precise questions." },
  // ── Data Interpretation ──
  { id: "tables-and-charts", category: "data-interpretation", label: "Tables & Charts", blurb: "Read a table or chart, then compute ratios, growth and shares." },
  { id: "caselets", category: "data-interpretation", label: "Caselets", blurb: "Data buried in a paragraph — extract it, tabulate it, answer." },
  // ── Programming ──
  { id: "pseudocode", category: "programming", label: "Pseudocode", blurb: "Trace the loop, print the output — the section Infosys and Wipro lean on." },
  { id: "programming-fundamentals", category: "programming", label: "Programming Fundamentals", blurb: "Operators, control flow, functions, pointers and output prediction in C, Java and Python." },
  { id: "data-structures-mcq", category: "programming", label: "Data Structures & Algorithms", blurb: "Arrays, linked lists, stacks, trees, sorting and complexity, asked as MCQs." },
  { id: "os-dbms-networks", category: "programming", label: "OS, DBMS & Networks", blurb: "Core computer science: processes, scheduling, SQL, normalisation and the OSI layers." },
];

const TOPIC_BY_ID = new Map(APTITUDE_TOPICS.map((topic) => [topic.id, topic]));
const CATEGORY_BY_ID = new Map(APTITUDE_CATEGORIES.map((category) => [category.id, category]));

export const aptitudeTopic = (id: string) => TOPIC_BY_ID.get(id);
export const aptitudeCategory = (id: string) => CATEGORY_BY_ID.get(id as AptitudeCategoryId);
export const APTITUDE_DIFFICULTIES: AptitudeDifficulty[] = ["easy", "medium", "hard"];
