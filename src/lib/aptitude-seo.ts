/**
 * An aptitude question's search title and description (2026-11-17).
 *
 * Search Console's first read through the API (2026-11-17) found the 305
 * aptitude questions Google showed at an average position of 9.5 — the
 * bottom of page one — with 3 clicks from 1,691 impressions. The queries
 * were the questions themselves, typed or pasted: "20 20 19 17 14 10",
 * "cow is to calf horse is to", "how many broadcast domains does a single
 * 24-port switch have?", even a whole MCQ with its options. The result they
 * were shown was titled with the question's name — "Cow is to calf —
 * Aptitude Question" — which neither repeats what was searched nor says
 * the answer is there.
 *
 * So a title leads with the question as it is searched — its *core*: a
 * series, an analogy read out as words, a one-line question — and ends
 * with the promise ("Answer & Explanation"), and a description is the
 * question with its options and then the promise. Where a question has no
 * short core (a passage, a table, code, an instruction whose content is
 * in the options, a word whose name is already how it is searched —
 * "Synonym of ABATE") the caller keeps the name-led title.
 *
 * Pure; services/seo.ts runs it over the whole bank, so two questions whose
 * cores would give one title both fall back to their (unique) names.
 * Pinned by aptitude-seo.test.ts.
 */

/** Topics whose authored name is already the search phrase, or whose prompt has no searchable line. */
const NAME_LED_TOPICS = new Set([
  "vocabulary",
  "sentence-correction",
  "sentence-completion",
  "reading-comprehension",
  "tables-and-charts",
  "caselets",
  "pseudocode",
  "programming-fundamentals",
  "syllogisms",
  "seating-arrangement",
]);

export type CoreKind = "series" | "analogy" | "odd-one-out" | "question";

/** Markdown emphasis and code marks off a line, spaces collapsed: the words a searcher would type. */
export function plainLine(line: string): string {
  return line
    .replace(/^>\s*/, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/(^|[^\w*])\*([^*\n]+)\*(?=[^\w*]|$)/g, "$1$2")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

const ANALOGY = /^(.+?)\s*:\s*(.+?)\s*::\s*(.+?)\s*:\s*\?$/;

/**
 * The question as it is searched, or null when it has none short of the
 * whole prompt. `kind` decides the title's suffix.
 */
export function searchCore(prompt: string, topic: string): { core: string; kind: CoreKind } | null {
  if (NAME_LED_TOPICS.has(topic)) return null;
  // Code and tables are not typed into a search box; their questions keep their names.
  if (prompt.includes("```") || /^\s*\|/m.test(prompt)) return null;
  const raw = prompt.split("\n").map((l) => l.trim()).filter(Boolean);
  // A quoted passage or example sentence is the material, not the question.
  const lines = raw.filter((l) => !l.startsWith(">")).map(plainLine).filter(Boolean);
  if (!lines.length) return null;
  // Data sufficiency: the question is the whole two-statement set.
  if (lines.some((l) => /^Statement I\b/i.test(l))) return null;

  const [first, second] = lines;
  if (second && /does not belong|odd one out/i.test(first!)) return { core: `Odd one out: ${second}`, kind: "odd-one-out" };
  // "Find the next term:" then the series; "Find the value of:" then the expression.
  if (second && first!.endsWith(":") && lines.length === 2) {
    const series = /next term|missing term|next number|complete the series|wrong term/i.test(first!);
    return { core: second, kind: series ? "series" : "question" };
  }
  const whole = lines.join(" ");
  const analogy = ANALOGY.exec(whole);
  if (analogy) return { core: `${analogy[1]} is to ${analogy[2]} as ${analogy[3]} is to ?`, kind: "analogy" };
  // An instruction alone ("Choose the correct sentence:") has its content in the options.
  if (whole.endsWith(":")) return null;
  return { core: whole, kind: "question" };
}

const SUFFIXES: Record<CoreKind, string[]> = {
  series: [" — Next Term: Answer & Explanation", " — Next Term, Answer Explained", " — Next Term Solved", " — Solved"],
  analogy: [" — Answer & Explanation", " — Answer Explained", " — Solved"],
  "odd-one-out": [" — Answer & Explanation", " — Answer Explained", " — Solved"],
  question: [" — Answer & Explanation", " — Answer Explained", " — Solved"],
};

/** The core-led title within `budget` characters, or null (no core, or one too long for any suffix). */
export function coreTitle(prompt: string, topic: string, budget: number): string | null {
  const found = searchCore(prompt, topic);
  if (!found) return null;
  return SUFFIXES[found.kind].map((s) => found.core + s).find((t) => t.length <= budget) ?? null;
}

const DESCRIPTION_TAIL = "Answer with a step-by-step solution on CodeKairo.";

/** Cut at a word boundary to at most `max` characters. */
function cutWords(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return (space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:.–—-]+$/, "");
}

/**
 * The question (its plain stem — the caller's questionStem), then its
 * options lettered as an MCQ is pasted, then the promise; cut to `max`
 * with the promise kept. An instruction-only stem ("Choose the correct
 * sentence:") is led by the question's name, which is what tells thirty
 * such pages apart.
 */
export function aptitudeDescription(q: { title: string; stem: string; options: string[] }, max: number): string {
  const room = max - DESCRIPTION_TAIL.length - 1;
  const stem = q.stem.trim();
  // Led by the name too when the stem alone would be cut: questions on one
  // passage, caselet or set-up share its opening, and were cut to one
  // description (36 of the bank's 1,169 until this rule).
  const named = stem.endsWith(":") || stem.length < 25 || stem.length > room;
  const lead = named ? `${q.title} — ${stem}` : stem;
  const options = q.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${plainLine(o)}`).join(" ");
  const body = options ? `${lead} ${options}` : lead;
  const fitted = body.length <= room ? body : `${cutWords(body, room - 1)}…`;
  return `${fitted} ${DESCRIPTION_TAIL}`;
}
