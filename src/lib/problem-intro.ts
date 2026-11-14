/**
 * A problem page's own opening — the words a search engine compares first.
 *
 * Search Console held 288 problem pages under "Crawled – currently not
 * indexed" (2026-10-09). Rendered, a problem page was ~1,350 characters: the
 * statement and its examples, close to word for word what LeetCode and its
 * mirrors already have indexed under the same title — and the meta
 * description was the statement's first sentence, LeetCode's sentence. The
 * edge's 7.5 KB article (editorial, solutions) never reached the index,
 * because React replaces it inside #root and Google indexes the rendered DOM.
 *
 * So each page now opens in its own words, from what this site wrote and the
 * mirrors did not: a lead sentence from its facts (difficulty, the topics it
 * teaches, the companies that ask it) and a meta description led by the
 * editorial's idea — the paragraph `explain()` (scripts/catalog/types.ts)
 * puts before "## Approach". Pure; services/seo.ts and routes/problems.ts
 * both read it, so the edge and the SPA say the same words.
 */

/** "a, b and c" */
export function joinAnd(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * The editorial's idea: its Markdown before the first heading, or — for an
 * editorial written some other way — its first paragraph that is prose (not a
 * heading, a fence, a list or a table). Empty when there is none.
 */
export function editorialIdea(editorial: string | null | undefined): string {
  const text = (editorial ?? "").replace(/\r\n/g, "\n").trim();
  if (!text) return "";
  const paragraphs = text.replace(/```[\s\S]*?```/g, "\n\n").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const prose = (p: string) => !/^(#{1,6}\s|[-*+]\s|\d+\.\s|\||>|<)/.test(p);
  // explain()'s shape: the idea, then "## Approach". Anything before the
  // first heading is the idea, however many paragraphs it runs to.
  const beforeHeading: string[] = [];
  for (const p of paragraphs) {
    if (/^#{1,6}\s/.test(p)) break;
    if (prose(p)) beforeHeading.push(p);
  }
  if (beforeHeading.length) return beforeHeading.join(" ").replace(/\s+/g, " ");
  return (paragraphs.find(prose) ?? "").replace(/\s+/g, " ");
}

export interface IntroFacts {
  title: string;
  /** "Easy" | "Medium" | "Hard" (any case). */
  difficulty: string;
  /** Topic names, best first — the hubs' labels where there are hubs. */
  topics: string[];
  /** Companies that ask it, best first. */
  companies: string[];
}

const MAX_TOPICS = 3;
const MAX_COMPANIES = 4;

/**
 * "Integer to Roman is a medium coding problem on strings, math and greedy,
 * asked in Amazon, Microsoft, Adobe and Twitter interviews." — the page's
 * lead, above the statement, for every reader. Facts only: no approach, so a
 * member opening the workbench is told nothing the hints withhold.
 */
export function problemIntro(f: IntroFacts): string {
  const difficulty = f.difficulty.trim().toLowerCase();
  const article = /^[aeiou]/.test(difficulty) ? "an" : "a";
  const topics = [...new Set(f.topics.map((t) => t.trim()).filter(Boolean))].slice(0, MAX_TOPICS);
  const companies = [...new Set(f.companies.map((c) => c.trim()).filter(Boolean))].slice(0, MAX_COMPANIES);
  const what = `${f.title} is ${difficulty ? `${article} ${difficulty} ` : "a "}coding problem${topics.length ? ` on ${joinAnd(topics.map(lowerTopic))}` : ""}`;
  return `${what}${companies.length ? `, asked in ${joinAnd(companies)} interviews` : ""}.`;
}

/**
 * A problem's meta description: what the page offers, then its facts —
 * "Two Sum solution explained: step-by-step approach, complexity and code in
 * Python, Java, C++ and JavaScript. An easy problem, asked at Amazon and
 * Google."
 *
 * Until 2026-11-14 it was led by the editorial's idea ("Sort the array;
 * then a run of consecutive values…"), which answered the search in the
 * result itself: Search Console had 510 problem pages on page 1 at a 2%
 * click rate, and pages at position 2 with no clicks at all. The searcher
 * looking for a solution is told the page has one — the approach, the
 * complexity, the code in the languages searched with it — and not the
 * trick. Every published problem carries an editorial with an approach and
 * a complexity, and solutions in all 13 languages (the catalogue's seed gate
 * refuses one without), so the languages named are always on the page;
 * `complexity` is still read off the editorial, so a problem written another
 * way is never promised one. The facts are the intro's (no approach), so a
 * member is told nothing the hints withhold. Fits `max` characters: the
 * companies go first, then the topics, then the "explained" wording, then
 * a cut on a word.
 */
export function problemDescription(f: IntroFacts & { complexity: boolean }, max = 158): string {
  const offer = `step-by-step approach${f.complexity ? ", complexity" : ""} and code in Python, Java, C++ and JavaScript.`;
  const difficulty = f.difficulty.trim().toLowerCase();
  const article = /^[aeiou]/.test(difficulty) ? "An" : "A";
  const topics = [...new Set(f.topics.map((t) => t.trim()).filter(Boolean))].slice(0, 2).map(lowerTopic);
  const companies = [...new Set(f.companies.map((c) => c.trim()).filter(Boolean))].slice(0, 3);
  const kind = difficulty ? `${article} ${difficulty} problem` : "A coding problem";
  const tails = [
    ...(topics.length && companies.length ? [` ${kind} on ${joinAnd(topics)}, asked at ${joinAnd(companies)}.`] : []),
    ...(companies.length ? [` ${kind}, asked at ${joinAnd(companies)}.`] : []),
    // "asked at Amazon" is the fact a searcher clicks for: two companies before the topics alone.
    ...(companies.length > 2 ? [` ${kind}, asked at ${joinAnd(companies.slice(0, 2))}.`] : []),
    ...(topics.length ? [` ${kind} on ${joinAnd(topics)}.`] : []),
    ` ${kind}.`,
    "",
  ];
  for (const lead of [`${f.title} solution explained: ${offer}`, `${f.title} solution: ${offer}`]) {
    const tail = tails.find((t) => lead.length + t.length <= max);
    if (tail !== undefined) return lead + tail;
  }
  const whole = `${f.title} solution: ${offer}`;
  const cut = whole.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

/**
 * A topic as it reads mid-sentence: "Strings" → "strings", "Binary Indexed
 * Tree" → "binary indexed tree", but a topic holding an acronym or a name
 * keeps its capitals ("BFS", "Dijkstra's Algorithm").
 */
function lowerTopic(t: string): string {
  const words = t.split(/\s+/);
  const keep = words.some((w) => /^[A-Z0-9]{2,}$/.test(w) || /[A-Z].*'/.test(w));
  return keep ? t : t.toLowerCase();
}
