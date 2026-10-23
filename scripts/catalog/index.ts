/** Aggregates all hand-authored catalog categories. */

import type { CatalogProblem } from "./types.js";
import { ARRAY_PROBLEMS } from "./arrays.js";
import { STRING_PROBLEMS } from "./strings.js";
import { TWO_POINTER_PROBLEMS } from "./twopointers.js";
import { BINARY_SEARCH_PROBLEMS } from "./binarysearch.js";
import { STACK_PROBLEMS } from "./stack.js";
import { GREEDY_PROBLEMS } from "./greedy.js";
import { DP_PROBLEMS } from "./dp.js";
import { HEAP_PROBLEMS } from "./heap.js";
import { MATRIX_PROBLEMS } from "./matrices.js";
import { INTERVAL_PROBLEMS } from "./intervals.js";
import { GRAPH_PROBLEMS } from "./graphs.js";
import { BACKTRACKING_PROBLEMS } from "./backtracking.js";

// ── Real hiring-round problems, company names carried in tags ──────
import { NUMBER_PROBLEMS } from "./numbers.js";
import { ARRAY2_PROBLEMS } from "./arrays2.js";
import { STRING2_PROBLEMS } from "./strings2.js";
import { SLIDING_PROBLEMS } from "./sliding.js";
import { MATRIX2_PROBLEMS } from "./matrices2.js";
import { DP2_PROBLEMS } from "./dp2.js";
import { GREEDY2_PROBLEMS } from "./greedy2.js";
import { STACKS2_PROBLEMS } from "./stacks2.js";
import { BITS2_PROBLEMS } from "./bits2.js";
import { GRAPHS2_PROBLEMS } from "./graphs2.js";

// ── Wave 3 — LeetCode / GFG / PrepInsta / CodeChef classics ──
import { ARRAY3_PROBLEMS } from "./arrays3.js";
import { STRING3_PROBLEMS } from "./strings3.js";
import { MATH3_PROBLEMS } from "./math3.js";
import { DP3_PROBLEMS } from "./dp3.js";
import { HASHING3_PROBLEMS } from "./hashing3.js";

// ── Wave 4 — LeetCode / GFG classics, CodeKairo-flavoured examples ──
import { ARRAY4_PROBLEMS } from "./arrays4.js";
import { STRING4_PROBLEMS } from "./strings4.js";
import { HASHING4_PROBLEMS } from "./hashing4.js";
import { MATH4_PROBLEMS } from "./math4.js";
import { BITS4_PROBLEMS } from "./bits4.js";
import { TWOPOINTERS4_PROBLEMS } from "./twopointers4.js";
import { SLIDING4_PROBLEMS } from "./sliding4.js";
import { BINARYSEARCH4_PROBLEMS } from "./binarysearch4.js";
import { GREEDY4_PROBLEMS } from "./greedy4.js";
import { DP4_PROBLEMS } from "./dp4.js";
import { MATRICES4_PROBLEMS } from "./matrices4.js";
import { GRAPHS4_PROBLEMS } from "./graphs4.js";
import { HEAPS4_PROBLEMS } from "./heaps4.js";

// ── Wave 5 — the same batch, continued into the LC 2000+ range ──
import { ARRAYS5_PROBLEMS } from "./arrays5.js";
import { STRINGS5_PROBLEMS } from "./strings5.js";
import { DP5_PROBLEMS } from "./dp5.js";
import { MISC4_PROBLEMS } from "./misc4.js";

// ── Wave 6 — 500 LeetCode classics (+ a few GFG/InterviewBit staples), all 13 languages ──
import { ARRAYS6_PROBLEMS } from "./arrays6.js";
import { ARRAYS7_PROBLEMS } from "./arrays7.js";
import { ARRAYS8_PROBLEMS } from "./arrays8.js";
import { STRINGS6_PROBLEMS } from "./strings6.js";
import { STRINGS7_PROBLEMS } from "./strings7.js";
import { STRINGS8_PROBLEMS } from "./strings8.js";
import { STRINGS9_PROBLEMS } from "./strings9.js";
import { MATH6_PROBLEMS } from "./math6.js";
import { MATH7_PROBLEMS } from "./math7.js";
import { BITS6_PROBLEMS } from "./bits6.js";
import { SLIDING6_PROBLEMS } from "./sliding6.js";
import { BINARYSEARCH6_PROBLEMS } from "./binarysearch6.js";
import { STACKS6_PROBLEMS } from "./stacks6.js";
import { HEAPS6_PROBLEMS } from "./heaps6.js";
import { GREEDY6_PROBLEMS } from "./greedy6.js";
import { DP6_PROBLEMS } from "./dp6.js";
import { DP7_PROBLEMS } from "./dp7.js";
import { GRAPHS6_PROBLEMS } from "./graphs6.js";
import { MATRICES6_PROBLEMS } from "./matrices6.js";
import { BACKTRACKING6_PROBLEMS } from "./backtracking6.js";

// ── Wave 7 — 500 more company-asked problems (LeetCode + GFG), all 13 languages:
// 260 on the plain signatures, then 240 trees, linked lists and design classes ──
import { DP8_PROBLEMS } from "./dp8.js";
import { DP9_PROBLEMS } from "./dp9.js";
import { DP10_PROBLEMS } from "./dp10.js";
import { DP11_PROBLEMS } from "./dp11.js";
import { GRAPHS7_PROBLEMS } from "./graphs7.js";
import { GRAPHS8_PROBLEMS } from "./graphs8.js";
import { GRAPHS9_PROBLEMS } from "./graphs9.js";
import { STRINGS10_PROBLEMS } from "./strings10.js";
import { STRINGS11_PROBLEMS } from "./strings11.js";
import { HASHING7_PROBLEMS } from "./hashing7.js";
import { HASHING8_PROBLEMS } from "./hashing8.js";
import { HASHING9_PROBLEMS } from "./hashing9.js";
import { ARRAYS9_PROBLEMS } from "./arrays9.js";
import { TREES1_PROBLEMS } from "./trees1.js";
import { TREES2_PROBLEMS } from "./trees2.js";
import { TREES3_PROBLEMS } from "./trees3.js";
import { TREES4_PROBLEMS } from "./trees4.js";
import { TREES5_PROBLEMS } from "./trees5.js";
import { TREES6_PROBLEMS } from "./trees6.js";
import { LISTS1_PROBLEMS } from "./lists1.js";
import { LISTS2_PROBLEMS } from "./lists2.js";
import { DESIGN1_PROBLEMS } from "./design1.js";
import { DESIGN2_PROBLEMS } from "./design2.js";
import { DESIGN3_PROBLEMS } from "./design3.js";
import { DESIGN4_PROBLEMS } from "./design4.js";
import { COMPANY_COVERAGE } from "./company-coverage.js";

const AUTHORED: CatalogProblem[] = [
  ...ARRAY_PROBLEMS,
  ...STRING_PROBLEMS,
  ...TWO_POINTER_PROBLEMS,
  ...BINARY_SEARCH_PROBLEMS,
  ...STACK_PROBLEMS,
  ...GREEDY_PROBLEMS,
  ...DP_PROBLEMS,
  ...HEAP_PROBLEMS,
  ...MATRIX_PROBLEMS,
  ...INTERVAL_PROBLEMS,
  ...GRAPH_PROBLEMS,
  ...BACKTRACKING_PROBLEMS,
  ...NUMBER_PROBLEMS,
  ...ARRAY2_PROBLEMS,
  ...STRING2_PROBLEMS,
  ...SLIDING_PROBLEMS,
  ...MATRIX2_PROBLEMS,
  ...DP2_PROBLEMS,
  ...GREEDY2_PROBLEMS,
  ...STACKS2_PROBLEMS,
  ...BITS2_PROBLEMS,
  ...GRAPHS2_PROBLEMS,
  ...ARRAY3_PROBLEMS,
  ...STRING3_PROBLEMS,
  ...MATH3_PROBLEMS,
  ...DP3_PROBLEMS,
  ...HASHING3_PROBLEMS,
  ...ARRAY4_PROBLEMS,
  ...STRING4_PROBLEMS,
  ...HASHING4_PROBLEMS,
  ...MATH4_PROBLEMS,
  ...BITS4_PROBLEMS,
  ...TWOPOINTERS4_PROBLEMS,
  ...SLIDING4_PROBLEMS,
  ...BINARYSEARCH4_PROBLEMS,
  ...GREEDY4_PROBLEMS,
  ...DP4_PROBLEMS,
  ...MATRICES4_PROBLEMS,
  ...GRAPHS4_PROBLEMS,
  ...HEAPS4_PROBLEMS,
  ...ARRAYS5_PROBLEMS,
  ...STRINGS5_PROBLEMS,
  ...DP5_PROBLEMS,
  ...MISC4_PROBLEMS,
  ...ARRAYS6_PROBLEMS,
  ...ARRAYS7_PROBLEMS,
  ...ARRAYS8_PROBLEMS,
  ...STRINGS6_PROBLEMS,
  ...STRINGS7_PROBLEMS,
  ...STRINGS8_PROBLEMS,
  ...STRINGS9_PROBLEMS,
  ...MATH6_PROBLEMS,
  ...MATH7_PROBLEMS,
  ...BITS6_PROBLEMS,
  ...SLIDING6_PROBLEMS,
  ...BINARYSEARCH6_PROBLEMS,
  ...STACKS6_PROBLEMS,
  ...HEAPS6_PROBLEMS,
  ...GREEDY6_PROBLEMS,
  ...DP6_PROBLEMS,
  ...DP7_PROBLEMS,
  ...GRAPHS6_PROBLEMS,
  ...MATRICES6_PROBLEMS,
  ...BACKTRACKING6_PROBLEMS,
  ...DP8_PROBLEMS,
  ...DP9_PROBLEMS,
  ...DP10_PROBLEMS,
  ...DP11_PROBLEMS,
  ...GRAPHS7_PROBLEMS,
  ...GRAPHS8_PROBLEMS,
  ...GRAPHS9_PROBLEMS,
  ...STRINGS10_PROBLEMS,
  ...STRINGS11_PROBLEMS,
  ...HASHING7_PROBLEMS,
  ...HASHING8_PROBLEMS,
  ...HASHING9_PROBLEMS,
  ...ARRAYS9_PROBLEMS,
  ...TREES1_PROBLEMS,
  ...TREES2_PROBLEMS,
  ...TREES3_PROBLEMS,
  ...TREES4_PROBLEMS,
  ...TREES5_PROBLEMS,
  ...TREES6_PROBLEMS,
  ...LISTS1_PROBLEMS,
  ...LISTS2_PROBLEMS,
  ...DESIGN1_PROBLEMS,
  ...DESIGN2_PROBLEMS,
  ...DESIGN3_PROBLEMS,
  ...DESIGN4_PROBLEMS,
];

/**
 * Company tags added after authoring (company-coverage.ts, 2026-10-05) — a
 * problem keeps its own tags and gains the companies that list it, in the
 * order the coverage file names them. Seeding writes the merged tags;
 * scripts/apply-company-coverage.ts writes only the tags to a database that
 * already holds the problems.
 */
function withCompanyCoverage(problems: CatalogProblem[]): CatalogProblem[] {
  const extra = new Map<string, string[]>();
  for (const [company, slugs] of Object.entries(COMPANY_COVERAGE)) {
    for (const slug of slugs) extra.set(slug, [...(extra.get(slug) ?? []), company]);
  }
  return problems.map((p) => {
    const add = (extra.get(p.slug) ?? []).filter((c) => !p.tags.includes(c));
    return add.length ? { ...p, tags: [...p.tags, ...add] } : p;
  });
}

export const CATALOG: CatalogProblem[] = withCompanyCoverage(AUTHORED);
