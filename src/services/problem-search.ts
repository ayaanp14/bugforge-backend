import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { cachedShared } from "../lib/cache.js";
import { correctSearch, parseSearch, rankSearch, searchVocabulary, type ParsedSearch, type SearchVocabulary, type TextHit } from "../lib/problem-search.js";
import { getCatalogue, type CatalogueRow } from "./dashboard.js";

/**
 * GET /api/problems?search= — the published problems a query matches, best
 * first (lib/problem-search.ts says how a query is read and ranked).
 *
 * One database statement per search at most, and none on a repeat: the
 * title, tag and company signals are read off the catalogue already in
 * memory, and only the statement text needs MySQL — one MATCH … AGAINST
 * over the FULLTEXT index on (title, description), which answers every
 * term's hit and the overall relevance at once. That answer is the same
 * for every reader, so it is cached in both tiers by its terms; the
 * reader's solve state is applied by the route afterwards.
 *
 * Measured on the local copy (1,598 published problems, 2026-10-03): the
 * statement is a full-text index search (EXPLAIN: `type: fulltext`) taking
 * ~2 ms for the commonest term; the `LIKE '%q%'` it replaces read the
 * statements of every published row in turn when the term was rare.
 *
 * Shaped for what comes next: a semantic (embedding) lookup would be one
 * more source of per-row evidence beside `textHits`, folded into the same
 * rank — not a second endpoint.
 */

/** Seconds a term set's full-text answer is kept; the catalogue itself refreshes every 120 s. */
const TEXT_TTL_SECONDS = 120;
/** Server-side ceiling on the statement (MAX_EXECUTION_TIME); past it the search answers without text. */
const TEXT_TIMEOUT_MS = 1500;
/** More rows than the catalogue holds — a bound on a pathological answer, never a page size. */
const TEXT_ROW_CAP = 5000;

/** The full-text answer as cached: `[id, relevance, term mask]` per matching problem. */
export type TextRows = Array<[string, number, number]>;

/**
 * One statement: each matching problem's relevance over all terms, and a
 * bitmask of which terms it contains (bit i ⇔ `terms[i]*` matches). Every
 * value is a bound parameter; the terms are letters and digits only
 * (normalizeSearch), so no full-text operator can arrive from the query
 * either — the `*` is ours.
 */
export function fulltextStatement(terms: readonly string[]): Prisma.Sql {
  const against = (expr: string) => Prisma.sql`MATCH(title, description) AGAINST (${expr} IN BOOLEAN MODE)`;
  const any = terms.map((t) => `${t}*`).join(" ");
  const mask = Prisma.join(
    terms.map((t, i) => Prisma.sql`(${against(`${t}*`)} > 0) * ${2 ** i}`),
    " + ",
  );
  return Prisma.sql`
    SELECT /*+ MAX_EXECUTION_TIME(${Prisma.raw(String(TEXT_TIMEOUT_MS))}) */
      id, ${against(any)} AS relevance, ${mask} AS mask
    FROM Problem
    WHERE isPublished = 1 AND ${against(any)}
    LIMIT ${TEXT_ROW_CAP}`;
}

export async function fulltextRows(terms: readonly string[]): Promise<TextRows> {
  if (terms.length === 0) return [];
  const rows = await prisma.$queryRaw<Array<{ id: string; relevance: unknown; mask: unknown }>>(fulltextStatement(terms));
  // DOUBLE arrives as a number and the integer sum as a bigint; three
  // decimals of relevance is all the rank uses, and keeps the cached copy small.
  return rows.map((r) => [r.id, Math.round(Number(r.relevance) * 1000) / 1000, Number(r.mask)]);
}

export interface ProblemSearchDeps {
  catalogue: () => Promise<CatalogueRow[]>;
  /** The uncached full-text read (`fulltextRows`); swapped out by the tests. */
  fulltext: (terms: readonly string[]) => Promise<TextRows>;
  /** Cache key prefix — bump the version when TextRows changes shape. */
  cacheKey?: string;
}

/**
 * Logged once per distinct failure, not once per keystroke: a database
 * without the index (the `db push` not yet run) would otherwise print on
 * every search.
 */
const reported = new Set<string>();
function reportTextFailure(err: unknown): void {
  const message = err instanceof Error ? err.message.split("\n")[0]! : String(err);
  if (reported.has(message) || reported.size > 50) return;
  reported.add(message);
  console.warn(`[problem-search] full-text lookup failed — answering from titles, topics and companies only: ${message}`);
}

export function createProblemSearch(deps: ProblemSearchDeps) {
  const prefix = deps.cacheKey ?? "problem-search:text:v1:";
  const vocabularies = new WeakMap<CatalogueRow[], SearchVocabulary>();

  const vocabularyOf = (catalogue: CatalogueRow[]): SearchVocabulary => {
    let vocab = vocabularies.get(catalogue);
    if (!vocab) {
      vocab = searchVocabulary(catalogue.map((row) => (Array.isArray(row.tags) ? (row.tags as string[]) : [])));
      vocabularies.set(catalogue, vocab);
    }
    return vocab;
  };

  /**
   * The text half, or null when it cannot be had. A failure (no index, a
   * timeout, the database away) is thrown out of the cache loader, so it
   * is never stored — the next search tries again — and the search answers
   * from what is in memory rather than failing the request.
   */
  const textHits = async (parsed: ParsedSearch): Promise<Map<string, TextHit> | null> => {
    if (parsed.terms.length === 0) return new Map();
    try {
      const rows = await cachedShared(`${prefix}${parsed.terms.join(" ")}`, TEXT_TTL_SECONDS, () => deps.fulltext(parsed.terms), TEXT_TTL_SECONDS * 1000);
      return new Map(rows.map(([id, relevance, mask]) => [id, { relevance, mask }]));
    } catch (err) {
      reportTextFailure(err);
      return null;
    }
  };

  /**
   * The published problems matching `query` (already through
   * normalizeSearch, and not empty), best first. Rows are the catalogue's
   * own objects; the route filters, sorts and pages them like any other view.
   */
  return async function searchCatalogue(query: string): Promise<CatalogueRow[]> {
    const catalogue = await deps.catalogue();
    const vocab = vocabularyOf(catalogue);
    const parsed = parseSearch(query, vocab);
    const asTyped = rankSearch(catalogue, parsed, await textHits(parsed));
    if (asTyped.firm) return asTyped.rows;
    // No problem has every word in its title or tags: try again with the
    // typos corrected ("tow sum"). The correction wins when it is firm, or
    // when it is merely complete where the query as typed was not — so
    // "tow sum" finds Two Sum rather than Beautiful Towers II, and a word
    // that only statements use is kept. In memory but for the corrected
    // terms' own (cached) full-text read; correctSearch returns null at once
    // when every word is one titles or tags use, which is the common case.
    const corrected = correctSearch(query, catalogue);
    if (!corrected) return asTyped.rows;
    const reparsed = parseSearch(corrected, vocab);
    const fixed = rankSearch(catalogue, reparsed, await textHits(reparsed));
    return fixed.firm || (fixed.complete && !asTyped.complete) ? fixed.rows : asTyped.rows;
  };
}

export const searchCatalogue = createProblemSearch({ catalogue: getCatalogue, fulltext: fulltextRows });
