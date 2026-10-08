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
 * A topic as it reads mid-sentence: "Strings" → "strings", "Binary Indexed
 * Tree" → "binary indexed tree", but a topic holding an acronym or a name
 * keeps its capitals ("BFS", "Dijkstra's Algorithm").
 */
function lowerTopic(t: string): string {
  const words = t.split(/\s+/);
  const keep = words.some((w) => /^[A-Z0-9]{2,}$/.test(w) || /[A-Z].*'/.test(w));
  return keep ? t : t.toLowerCase();
}
