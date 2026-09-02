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
];
