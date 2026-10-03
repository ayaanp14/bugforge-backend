import { COMPANY_RENAMED, isCompanyTag } from "./companies.js";
import { topicHubByTag } from "./problem-topics.js";

/**
 * Problem search: what a query means and how matches are ordered. Pure — the
 * full-text lookup that feeds it is services/problem-search.ts.
 *
 * GET /api/problems?search= used to be `title LIKE '%q%' OR description LIKE
 * '%q%'` in newest-first order: the whole query as one substring, so "amazon"
 * found the one statement that mentions Amazon and none of the 1,405 problems
 * tagged with it, "amazon sliding window" found nothing, and "two sum" listed
 * Two Sum last of four.
 *
 * A query is read as parts. A run of words that names a tag — a company
 * ("amazon", "goldman sachs") or a topic ("sliding window", "dp") — is one
 * part; every other word is a part of its own. A problem satisfies a part
 * through its title, its tags, or the full-text index over title and
 * statement. The answer is the problems satisfying as many parts as any
 * problem does — every part when some problem manages that, which is the
 * usual case, so "amazon array" is Amazon's array problems; the best partial
 * match when none does, so one unknown word never empties the list.
 *
 * Within that set the order is a score — the problem's number, then title
 * signals, then tags, then text relevance (the RANK table) — with fixed
 * tie-breaks, so the same query over the same catalogue always pages the
 * same way. When no problem satisfies every part, the query is tried again
 * with its typos corrected against the words titles and tags use
 * (correctSearch), and the correction is kept only if that one does.
 *
 * Tags and companies are matched against the catalogue already held in
 * memory (services/dashboard getCatalogue), never in SQL: `tags` is a JSON
 * array, which no index serves (lib/catalogue-filter.ts measured the same
 * choice for the chip filters). Only the statement is not in memory, and that
 * is what the FULLTEXT index is for.
 */

/** Longer input is cut here: no search needs more, and every part costs a MATCH. */
export const SEARCH_MAX_CHARS = 100;
/** Parts read from one query, and full-text terms sent; the rest are ignored. */
export const SEARCH_MAX_PARTS = 8;

/**
 * Points per signal. Guidelines rather than physics: what matters is the
 * order — an exact title beats a title prefix beats a company beats a topic
 * beats a title that merely contains the query beats text relevance.
 * Signals add up, so "Array Partition" tagged Array outranks "Rotate Array"
 * tagged Array for "array", and both outrank a statement that mentions arrays.
 */
export const RANK = {
  /** The query names the problem's number ("1", "#1", "1. two sum"). */
  numberExact: 150,
  titleExact: 100,
  titlePrefix: 80,
  companyExact: 75,
  tagExact: 70,
  /** The query starts a word inside the title ("rotate array" for "array"). */
  titleContainsWord: 65,
  /** The query inside a word ("maximum subarray" for "array"). */
  titleContains: 60,
  /** Every part in the title, in any order ("sum two" → "Two Sum"). */
  titleAllParts: 50,
  /** Each part in the title, when the query as a whole is not. */
  titlePart: 15,
  /** A part that starts a word of a tag without being the whole tag ("tree" → Segment Tree). */
  tagPartial: 35,
  /** Matched by the full-text index; up to `textRelevance` more by relevance. */
  text: 30,
  textRelevance: 10,
} as const;

/**
 * InnoDB's default full-text stopwords (INFORMATION_SCHEMA.INNODB_FT_DEFAULT_STOPWORD
 * on MySQL 8.4). A stopword is never indexed, so as a term it can only match
 * by accident — "the*" matched 643 statements, every "then" and "there" — and
 * as a part it would demand something no index can show.
 */
const STOPWORDS = new Set([
  "a", "about", "an", "are", "as", "at", "be", "by", "com", "de", "en", "for", "from", "how", "i", "in", "is", "it",
  "la", "of", "on", "or", "that", "the", "this", "to", "und", "was", "what", "when", "where", "who", "will", "with", "www",
]);

/** `innodb_ft_min_token_size`: shorter words are not in the index at all. */
const FT_MIN_TOKEN = 3;

/**
 * Names people search by that are not the tag's own words. Each points at a
 * tag and applies only when the catalogue carries that tag. Keys are written
 * as `normalizeSearch` + `foldWord` leave them.
 */
const SYNONYMS: Readonly<Record<string, string>> = {
  dp: "Dynamic Programming",
  bfs: "Breadth-First Search",
  dfs: "Depth-First Search",
  dsu: "Union Find",
  "disjoint set": "Union Find",
  "priority queue": "Heap (Priority Queue)",
  pq: "Heap (Priority Queue)",
  hashmap: "Hash Table",
  "hash map": "Hash Table",
  hashtable: "Hash Table",
  hashing: "Hash Table",
  dictionary: "Hash Table",
  bitwise: "Bit Manipulation",
  mst: "Minimum Spanning Tree",
  fenwick: "Fenwick Tree",
  // Not "bit": it is how "bit manipulation" starts far more often than it
  // means a Binary Indexed Tree, and a partial tag match already finds both.
  "topo sort": "Topological Sort",
  toposort: "Topological Sort",
  "2 pointer": "Two Pointers",
};

/**
 * The query as it is matched: accents stripped, lowercased, every run of
 * anything but letters and digits made one space, at most SEARCH_MAX_CHARS.
 * "" means no search. Titles and tags go through the same function, so the
 * two sides of every comparison agree on what a word is — and the result
 * can carry no full-text operator (`+ - < > ( ) ~ * " @`) or quote.
 */
export function normalizeSearch(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw
    .slice(0, SEARCH_MAX_CHARS * 4)
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .slice(0, SEARCH_MAX_CHARS)
    .trim();
}

/**
 * A word with its plural ending taken off, so "arrays" finds "Rotate Array"
 * and "queries" finds "Range Sum Query". Applied to both sides; it only has
 * to be consistent, not correct English.
 */
export function foldWord(word: string): string {
  if (word.length <= 3 || /\d/.test(word)) return word;
  if (word.endsWith("ies") && word.length > 4) return `${word.slice(0, -3)}y`;
  if (/(?:ch|sh|x|z|ss)es$/.test(word)) return word.slice(0, -2);
  if (word.endsWith("s") && !/(?:ss|us|is)$/.test(word)) return word.slice(0, -1);
  return word;
}

const foldPhrase = (normalized: string): string =>
  normalized ? normalized.split(" ").map(foldWord).join(" ") : "";

/**
 * The full-text term for a word: the part it shares with its folded form, so
 * the prefix search covers both spellings — "queries" → `quer*` (query,
 * queries), "arrays" → `array*`.
 */
function textStem(word: string): string {
  const folded = foldWord(word);
  let i = 0;
  while (i < word.length && i < folded.length && word[i] === folded[i]) i++;
  const stem = word.slice(0, i);
  return stem.length >= FT_MIN_TOKEN ? stem : word;
}

/** One company, or one topic with its aliases ("Heap" and "Heap (Priority Queue)"). */
export interface SearchEntity {
  kind: "company" | "topic";
  /** Every tag that counts as this entity on a problem. */
  tags: ReadonlySet<string>;
}

/** What the catalogue's tags make searchable by name: folded phrase → entity. */
export interface SearchVocabulary {
  phrases: ReadonlyMap<string, SearchEntity>;
  /** Words in the longest phrase, the most a lookup has to try. */
  longest: number;
}

/**
 * Built from the tags the catalogue actually carries, so a tag added by a
 * future catalog wave is searchable by name the moment it is published.
 */
export function searchVocabulary(tagSets: Iterable<readonly string[]>): SearchVocabulary {
  const tags = new Set<string>();
  for (const set of tagSets) for (const t of set) if (typeof t === "string" && t) tags.add(t);

  // One entity per company tag, one per topic hub (a hub's tag and its
  // aliases are the same topic), one per topic tag with no hub.
  const entityOf = new Map<string, SearchEntity>();
  const groups = new Map<string, Set<string>>();
  for (const tag of tags) {
    const key = isCompanyTag(tag) ? `company:${COMPANY_RENAMED[tag] ?? tag}` : `topic:${topicHubByTag(tag)?.tag ?? tag}`;
    let group = groups.get(key);
    if (!group) groups.set(key, (group = new Set()));
    group.add(tag);
  }
  for (const [key, group] of groups) {
    const entity: SearchEntity = { kind: key.startsWith("company:") ? "company" : "topic", tags: group };
    for (const tag of group) entityOf.set(tag, entity);
  }

  const phrases = new Map<string, SearchEntity>();
  const add = (name: string, entity: SearchEntity | undefined) => {
    const phrase = foldPhrase(normalizeSearch(name));
    if (entity && phrase && !phrases.has(phrase)) phrases.set(phrase, entity);
  };
  for (const tag of tags) add(tag, entityOf.get(tag));
  for (const [oldName, name] of Object.entries(COMPANY_RENAMED)) add(oldName, entityOf.get(name));
  for (const [alias, tag] of Object.entries(SYNONYMS)) add(alias, entityOf.get(tag));

  let longest = 1;
  for (const phrase of phrases.keys()) longest = Math.max(longest, phrase.split(" ").length);
  return { phrases, longest };
}

/** One thing the query asks for. */
export interface SearchPart {
  /** Folded words, space-joined: what titles and tags are compared with. */
  phrase: string;
  /** The tag it names, when it names one. */
  entity: SearchEntity | null;
  /** Bits of this part's full-text terms in `ParsedSearch.terms`; 0 when it has none. */
  termMask: number;
}

export interface ParsedSearch {
  /** The whole query, folded — the title tiers compare it with the folded title. */
  phrase: string;
  parts: SearchPart[];
  /**
   * Full-text terms, each a bare stem of letters and digits; a match is
   * `<term>*` in boolean mode. Empty when no word is long enough to be
   * indexed (or every word is a stopword), and then no query is sent.
   */
  terms: string[];
}

/** Reads a normalized query into parts. `text` must come from `normalizeSearch`. */
export function parseSearch(text: string, vocab: SearchVocabulary): ParsedSearch {
  const words = text ? text.split(" ").map(foldWord) : [];
  const raw = text ? text.split(" ") : [];
  const parts: SearchPart[] = [];
  const terms: string[] = [];

  const termBit = (word: string): number => {
    if (word.length < FT_MIN_TOKEN || STOPWORDS.has(word)) return 0;
    const stem = textStem(word);
    let at = terms.indexOf(stem);
    if (at === -1) {
      if (terms.length >= SEARCH_MAX_PARTS) return 0;
      terms.push(stem);
      at = terms.length - 1;
    }
    return 1 << at;
  };

  // "sum sum" asks for one thing, once.
  const push = (part: SearchPart) => {
    if (!parts.some((p) => p.phrase === part.phrase)) parts.push(part);
  };
  for (let i = 0; i < words.length && parts.length < SEARCH_MAX_PARTS; ) {
    // Longest phrase first: "binary search" is the topic, not "binary" and "search".
    let matched = 0;
    for (let n = Math.min(vocab.longest, words.length - i); n >= 1 && !matched; n--) {
      const entity = vocab.phrases.get(words.slice(i, i + n).join(" "));
      if (!entity) continue;
      let termMask = 0;
      for (let k = i; k < i + n; k++) termMask |= termBit(raw[k]!);
      push({ phrase: words.slice(i, i + n).join(" "), entity, termMask });
      matched = n;
    }
    if (matched) {
      i += matched;
      continue;
    }
    const word = words[i]!;
    // A stopword or a lone letter asks for nothing a title, a tag or the index
    // can show on its own; the whole-query title tiers still read it.
    if (!STOPWORDS.has(raw[i]!) && (word.length >= 2 || /\d/.test(word))) {
      push({ phrase: word, entity: null, termMask: termBit(raw[i]!) });
    }
    i += 1;
  }
  return { phrase: words.join(" "), parts, terms };
}

/** A problem's full-text match: relevance, and which of `ParsedSearch.terms` it contains (bit i = term i). */
export interface TextHit {
  relevance: number;
  mask: number;
}

export interface SearchableRow {
  id: string;
  title: string;
  tags: unknown;
  /** "1. Two Sum" — a query that is this number finds the problem first. */
  number?: number | null;
}

interface RowIndex {
  /** Folded title. */
  title: string;
  tags: readonly string[];
  /** Each tag folded, the same order as `tags`. */
  tagPhrases: readonly string[];
}

const rowIndexes = new WeakMap<readonly SearchableRow[], RowIndex[]>();

/** Folded once per catalogue instance (it is replaced, never mutated, every two minutes). */
function indexRows(rows: readonly SearchableRow[]): RowIndex[] {
  let index = rowIndexes.get(rows);
  if (!index) {
    index = rows.map((row) => {
      const tags = Array.isArray(row.tags) ? (row.tags as unknown[]).filter((t): t is string => typeof t === "string") : [];
      return { title: foldPhrase(normalizeSearch(row.title)), tags, tagPhrases: tags.map((t) => foldPhrase(normalizeSearch(t))) };
    });
    rowIndexes.set(rows, index);
  }
  return index;
}

/** `needle` starts a word of `haystack` (both folded, space-separated). */
const startsWord = (haystack: string, needle: string): boolean =>
  haystack.startsWith(needle) || haystack.includes(` ${needle}`);

/** Title signals for the query as a whole: one tier, the best that applies. */
function titleTier(title: string, query: string): number {
  if (!query) return 0;
  if (title === query) return RANK.titleExact;
  if (title.startsWith(query)) return RANK.titlePrefix;
  if (title.includes(` ${query}`)) return RANK.titleContainsWord;
  if (query.length >= 3 && title.includes(query)) return RANK.titleContains;
  return 0;
}

/** A part found in the title: at a word start, or inside a word once it is three letters long. */
const inTitle = (title: string, phrase: string): boolean =>
  startsWord(title, phrase) || (phrase.length >= 3 && title.includes(phrase));

interface Scored<T> {
  row: T;
  coverage: number;
  score: number;
  /** The folded title's length when the title matched; Infinity when it did not. */
  titleLength: number;
  /** Position in `rows` — the catalogue's own order, newest first. */
  at: number;
}

/**
 * The rows matching the query, best first. `hits` is the full-text answer for
 * `query.terms` (null when it could not be had — the title and tag signals
 * still answer). Every row appears at most once, whichever signals found it.
 */
export function rankCatalogue<T extends SearchableRow>(rows: readonly T[], query: ParsedSearch, hits: ReadonlyMap<string, TextHit> | null): T[] {
  return rankSearch(rows, query, hits).rows;
}

/**
 * `rankCatalogue`, saying how good the answer is:
 * - `complete`: some problem satisfies every part (or, for a query with no
 *   parts, some title matched). Otherwise it is the best partial match.
 * - `firm`: some problem satisfies every part through its title, its number
 *   or a tag it carries by that name — not only through its statement or a
 *   word of a longer tag. "tow sum" is complete (Beautiful Towers II starts
 *   a word with "tow", and its statement says "sum") but not firm; "two sum"
 *   is both.
 * Anything short of firm is the cue to try the query with its typos
 * corrected (correctSearch).
 */
export function rankSearch<T extends SearchableRow>(rows: readonly T[], query: ParsedSearch, hits: ReadonlyMap<string, TextHit> | null): { rows: T[]; complete: boolean; firm: boolean } {
  const index = indexRows(rows);
  let firmBest = 0;
  let maxRelevance = 0;
  if (hits) for (const hit of hits.values()) if (hit.relevance > maxRelevance) maxRelevance = hit.relevance;

  const scored: Scored<T>[] = [];
  let best = 0;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]!;
    const { title, tags, tagPhrases } = index[r]!;
    const hit = hits?.get(row.id);

    const tier = titleTier(title, query.phrase);
    let score = tier;
    let coverage = 0;
    let titleParts = 0;
    let firm = 0;
    const number = row.number == null ? null : String(row.number);
    for (const part of query.parts) {
      if (part.phrase === number) {
        // Parts are distinct, so at most one can be the number.
        score += RANK.numberExact;
        coverage += 1;
        firm += 1;
        continue;
      }
      const titled = inTitle(title, part.phrase);
      if (titled) titleParts += 1;
      let tagged = 0;
      if (part.entity && tags.some((t) => part.entity!.tags.has(t))) {
        tagged = part.entity.kind === "company" ? RANK.companyExact : RANK.tagExact;
      } else if (!titled && tagPhrases.some((t) => startsWord(t, part.phrase))) {
        // Only for a part the title does not already answer: "two" in "two
        // sum" is the title's word, not a hint at Two Pointers, and counting
        // both put "Two Sum Less Than K" (tagged Two Pointers) above "Two Sum".
        tagged = RANK.tagPartial;
      }
      score += tagged;
      const texted = part.termMask !== 0 && hit !== undefined && (hit.mask & part.termMask) === part.termMask;
      if (titled || tagged || texted) coverage += 1;
      if (titled || tagged === RANK.companyExact || tagged === RANK.tagExact) firm += 1;
    }
    if (firm > firmBest) firmBest = firm;
    if (tier === 0 && titleParts > 0) {
      // The query as a whole is not in the title; its parts may be ("sum
      // two" → "Two Sum", or "the array" → "Rotate Array" once "the" is dropped).
      score += titleParts === query.parts.length ? RANK.titleAllParts : Math.min(titleParts * RANK.titlePart, RANK.titleAllParts - RANK.titlePart);
    }
    // Relevance separates statements; once the title holds the whole query,
    // how often the statement repeats a word says little, and it put "Two
    // Furthest Houses…" above "Two Sum" for "two". Those rows are separated
    // by title length instead (below).
    if (hit) score += RANK.text + (tier === 0 && maxRelevance > 0 ? (RANK.textRelevance * hit.relevance) / maxRelevance : 0);

    // A query with no parts (only stopwords or single letters) is a title
    // lookup and nothing else.
    if (query.parts.length === 0 ? tier === 0 : coverage === 0) continue;
    if (coverage > best) best = coverage;
    scored.push({ row, coverage, score, titleLength: tier > 0 || titleParts > 0 ? title.length : Infinity, at: r });
  }

  // Ties, in order: of two titles the query matches equally, the shorter is
  // the closer match ("Two Sum" before "Two Sum II - Input Array Is Sorted");
  // rows the title did not match (a company's 1,405 problems, all at the same
  // score) keep the catalogue's order, the order the company chip lists them
  // in. Numbers only — a localeCompare tie-break built a collator per call
  // and cost ~30 ms on "amazon".
  const ranked = scored
    .filter((s) => s.coverage === best)
    .sort((a, b) => b.score - a.score || (a.titleLength === b.titleLength ? 0 : a.titleLength < b.titleLength ? -1 : 1) || a.at - b.at)
    .map((s) => s.row);
  const complete = ranked.length > 0 && best === query.parts.length;
  return { rows: ranked, complete, firm: complete && firmBest === query.parts.length };
}

// ── Typos ────────────────────────────────────────────────────────────

/** Every word of every title and tag, folded, with how many titles and tags use it. */
const wordCounts = new WeakMap<readonly SearchableRow[], ReadonlyMap<string, number>>();
function wordsOf(rows: readonly SearchableRow[]): ReadonlyMap<string, number> {
  let words = wordCounts.get(rows);
  if (!words) {
    const counts = new Map<string, number>();
    for (const { title, tagPhrases } of indexRows(rows)) {
      for (const text of [title, ...tagPhrases]) for (const w of text.split(" ")) if (w) counts.set(w, (counts.get(w) ?? 0) + 1);
    }
    wordCounts.set(rows, (words = counts));
  }
  return words;
}

/**
 * Optimal string alignment distance — edits, with a swap of two neighbours
 * as one ("tow" → "two") — or `max + 1` as soon as it must exceed `max`.
 */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev2: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let d = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d = Math.min(d, prev2[j - 2]! + 1);
      cur.push(d);
      if (d < rowMin) rowMin = d;
    }
    if (rowMin > max) return max + 1;
    prev2 = prev;
    prev = cur;
  }
  return prev[b.length]!;
}

/**
 * The query with each word that no title or tag uses replaced by the
 * closest word that one does ("tow sum" → "two sum", "slidng window" →
 * "sliding window", "palidrome" → "palindrome"), or null when there is
 * nothing to correct. One edit is allowed in a word of up to five letters,
 * two in a longer one; ties go to the more common word. Numbers, stopwords
 * and words under three letters are left alone.
 *
 * The service only asks when the query as typed matched incompletely, and
 * only keeps the correction when it matches completely, so a word that is
 * merely rare — or only in statements, which this vocabulary does not hold —
 * is never traded for a worse answer.
 */
export function correctSearch(text: string, rows: readonly SearchableRow[]): string | null {
  if (!text) return null;
  const vocabulary = wordsOf(rows);
  let changed = false;
  const words = text.split(" ").map((raw) => {
    const word = foldWord(raw);
    if (raw.length < 3 || /\d/.test(raw) || STOPWORDS.has(raw) || vocabulary.has(word)) return raw;
    const max = word.length <= 5 ? 1 : 2;
    let best: string | null = null;
    let bestDistance = max + 1;
    let bestCount = 0;
    for (const [candidate, count] of vocabulary) {
      if (candidate.length < 3 || Math.abs(candidate.length - word.length) > max) continue;
      const d = editDistance(word, candidate, max);
      if (d < bestDistance || (d === bestDistance && d <= max && (count > bestCount || (count === bestCount && best !== null && candidate < best)))) {
        best = candidate;
        bestDistance = d;
        bestCount = count;
      }
    }
    if (best === null || bestDistance > max) return raw;
    changed = true;
    return best;
  });
  return changed ? words.join(" ") : null;
}
