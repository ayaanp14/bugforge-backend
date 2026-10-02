import type { Walkthrough } from "../walkthroughs/core.js";
import { FIGURES as arrays } from "./arrays.js";
import { FIGURES as backtracking } from "./backtracking.js";
import { FIGURES as bigONotation } from "./big-o-notation.js";
import { FIGURES as binarySearch } from "./binary-search.js";
import { FIGURES as binarySearchOnAnswer } from "./binary-search-on-answer.js";
import { FIGURES as binarySearchTree } from "./binary-search-tree.js";
import { FIGURES as binaryTree } from "./binary-tree.js";
import { FIGURES as bitManipulation } from "./bit-manipulation.js";
import { FIGURES as breadthFirstSearch } from "./breadth-first-search.js";
import { FIGURES as depthFirstSearch } from "./depth-first-search.js";
import { FIGURES as dijkstrasAlgorithm } from "./dijkstras-algorithm.js";
import { FIGURES as dynamicProgramming } from "./dynamic-programming.js";
import { FIGURES as graphs } from "./graphs.js";
import { FIGURES as greedyAlgorithms } from "./greedy-algorithms.js";
import { FIGURES as hashing } from "./hashing.js";
import { FIGURES as heap } from "./heap.js";
import { FIGURES as intervals } from "./intervals.js";
import { FIGURES as kadanesAlgorithm } from "./kadanes-algorithm.js";
import { FIGURES as knapsackProblem } from "./knapsack-problem.js";
import { FIGURES as linkedList } from "./linked-list.js";
import { FIGURES as longestCommonSubsequence } from "./longest-common-subsequence.js";
import { FIGURES as longestIncreasingSubsequence } from "./longest-increasing-subsequence.js";
import { FIGURES as matrix } from "./matrix.js";
import { FIGURES as minimumSpanningTree } from "./minimum-spanning-tree.js";
import { FIGURES as monotonicStack } from "./monotonic-stack.js";
import { FIGURES as prefixSum } from "./prefix-sum.js";
import { FIGURES as queue } from "./queue.js";
import { FIGURES as recursion } from "./recursion.js";
import { FIGURES as slidingWindow } from "./sliding-window.js";
import { FIGURES as sortingAlgorithms } from "./sorting-algorithms.js";
import { FIGURES as stack } from "./stack.js";
import { FIGURES as strings } from "./strings.js";
import { FIGURES as topologicalSort } from "./topological-sort.js";
import { FIGURES as trie } from "./trie.js";
import { FIGURES as twoPointers } from "./two-pointers.js";
import { FIGURES as unionFind } from "./union-find.js";

/** Every lesson's figures by lesson slug, then figure name (one module per lesson, beside this file). */
export const LESSON_FIGURES: Readonly<Record<string, Readonly<Record<string, () => Walkthrough>>>> = {
  arrays: arrays,
  backtracking: backtracking,
  "big-o-notation": bigONotation,
  "binary-search": binarySearch,
  "binary-search-on-answer": binarySearchOnAnswer,
  "binary-search-tree": binarySearchTree,
  "binary-tree": binaryTree,
  "bit-manipulation": bitManipulation,
  "breadth-first-search": breadthFirstSearch,
  "depth-first-search": depthFirstSearch,
  "dijkstras-algorithm": dijkstrasAlgorithm,
  "dynamic-programming": dynamicProgramming,
  graphs: graphs,
  "greedy-algorithms": greedyAlgorithms,
  hashing: hashing,
  heap: heap,
  intervals: intervals,
  "kadanes-algorithm": kadanesAlgorithm,
  "knapsack-problem": knapsackProblem,
  "linked-list": linkedList,
  "longest-common-subsequence": longestCommonSubsequence,
  "longest-increasing-subsequence": longestIncreasingSubsequence,
  matrix: matrix,
  "minimum-spanning-tree": minimumSpanningTree,
  "monotonic-stack": monotonicStack,
  "prefix-sum": prefixSum,
  queue: queue,
  recursion: recursion,
  "sliding-window": slidingWindow,
  "sorting-algorithms": sortingAlgorithms,
  stack: stack,
  strings: strings,
  "topological-sort": topologicalSort,
  trie: trie,
  "two-pointers": twoPointers,
  "union-find": unionFind,
};
