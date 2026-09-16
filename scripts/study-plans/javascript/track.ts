import type { TrackSeed } from "../dsl.js";
import runtime from "./01-runtime/module.js";
import valuesAndTypes from "./02-values-and-types/module.js";
import functionsAndScope from "./03-functions-and-scope/module.js";
import objectsAndArrays from "./04-objects-and-arrays/module.js";

/**
 * The JavaScript study plan. Exercises run on Node 16 (the Paiza runner —
 * STUDY_EXECUTOR in src/lib/program-judge.ts), so everything through
 * ES2022 is fair game: class fields, optional chaining, nullish
 * coalescing, `at()`, `replaceAll`, BigInt. Node 17+ additions
 * (`structuredClone`, `Array.prototype.toSorted`, `findLast`, built-in
 * `fetch`) are taught as reading and quiz only.
 *
 * The planned road, sixteen modules; the ones written so far are wired
 * below and the rest land in this order:
 *
 *   01 runtime                — what JS is, engines, Node, stdin/stdout, ASI, event loop preview
 *   02 values-and-types       — primitives, numbers, strings, truthiness and equality, let/const/var
 *   03 functions-and-scope    — declarations, scope and hoisting, closures, this, higher-order functions
 *   04 objects-and-arrays     — literals, copying, arrays, the method toolbox, destructuring and spread
 *   05 prototypes-and-classes — the prototype chain, constructors, class syntax, inheritance, getters
 *   06 collections-and-iteration — Map, Set, WeakMap, iterators, generators, for-of, symbols
 *   07 errors                 — throw/try/catch, Error subclasses, error handling patterns
 *   08 async                  — callbacks, promises, async/await, the event loop in depth
 *   09 modules-and-node       — CommonJS vs ESM, npm, fs/path/process, streams
 *   10 strings-and-regex      — Unicode, template tags, the regex engine, parsing
 *   11 functional-patterns    — immutability, composition, currying, memoisation, reduce
 *   12 the-dom-and-browser    — reading only: DOM, events, fetch, storage (no judge)
 *   13 typescript-preview     — types on JS, interfaces, generics, narrowing
 *   14 modern-javascript      — ES2020–2024 features, proposals, tooling
 *   15 performance-and-memory — engine-friendly code, leaks, measuring
 *   16 interview-idioms       — the template, the pitfalls, the idiom sheet, theory drill
 */
export const javascriptTrack: TrackSeed = {
  key: "javascript",
  title: "JavaScript",
  blurb: "The language behind the browser and Node — values and coercion, closures and this, prototypes, the event loop, promises and async — with exercises judged on a real Node runtime.",
  language: "javascript",
  runtime: "Node 16",
  modules: [runtime, valuesAndTypes, functionsAndScope, objectsAndArrays],
};
