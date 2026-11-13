import type { TrackSeed } from "../dsl.js";
import fastIoAndComplexity from "./01-fast-io-and-complexity/module.js";
import prefixSums from "./02-prefix-sums/module.js";
import bitManipulation from "./03-bit-manipulation/module.js";
import binarySearchOnTheAnswer from "./04-binary-search-on-the-answer/module.js";
import greedy from "./05-greedy/module.js";
import numberTheory from "./06-number-theory/module.js";
import disjointSetUnion from "./07-disjoint-set-union/module.js";
import shortestPaths from "./08-shortest-paths/module.js";
import topologicalSort from "./09-topological-sort/module.js";
import segmentTreeAndFenwick from "./10-segment-tree-and-fenwick/module.js";
import dpOptimisations from "./11-dp-optimisations/module.js";
import stringAlgorithms from "./12-string-algorithms/module.js";

/**
 * Competitive Programming (2026-11-14, the owner's ask). The techniques
 * contests are won with, taught in the order they build on each other — fast
 * I/O and budgeting a solution from the constraints first, then prefix sums,
 * bits, binary search on the answer, greedy with proofs, number theory, DSU,
 * shortest paths, topological order, segment trees and Fenwick trees, DP
 * optimisations and string algorithms. Every lesson is short and animated
 * with a game; every exercise is a contest problem judged on stdin/stdout
 * with hidden cases at the limits, so a solution that is right but too slow
 * fails the way it would in a contest. Each module points at the catalogue's
 * problems for more practice and ends in a timed checkpoint.
 *
 * C++ (Clang 18, -std=c++20, the cpp track's judge facts in
 * ../cpp/track.ts). The contest template — bits/stdc++.h, using namespace
 * std, the two fast-I/O lines, long long by default — is taught in module 1
 * and used throughout. Deterministic output only: no unordered iteration
 * order, no timing, no undefined behaviour in a reference solution.
 *
 * Modules are added below as they are written (scripts/study-plans/competitive-programming/NN-<slug>/).
 */
export const competitiveProgrammingTrack: TrackSeed = {
  key: "competitive-programming",
  title: "Competitive Programming",
  blurb: "The contest toolkit in C++: complexity budgets, prefix sums, bit tricks, binary search on the answer, greedy proofs, number theory, DSU, shortest paths, segment trees, DP optimisations and string algorithms — judged at the limits.",
  language: "cpp",
  runtime: "Clang 18 · C++20",
  modules: [
    fastIoAndComplexity,
    prefixSums,
    bitManipulation,
    binarySearchOnTheAnswer,
    greedy,
    numberTheory,
    disjointSetUnion,
    shortestPaths,
    topologicalSort,
    segmentTreeAndFenwick,
    dpOptimisations,
    stringAlgorithms,
  ],
};
