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

export const CATALOG: CatalogProblem[] = [
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
];
