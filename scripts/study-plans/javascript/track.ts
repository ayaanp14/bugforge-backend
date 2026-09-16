import type { TrackSeed } from "../dsl.js";
import runtime from "./01-runtime/module.js";
import valuesAndTypes from "./02-values-and-types/module.js";
import functionsAndScope from "./03-functions-and-scope/module.js";
import objectsAndArrays from "./04-objects-and-arrays/module.js";
import prototypesAndClasses from "./05-prototypes-and-classes/module.js";
import collectionsAndIteration from "./06-collections-and-iteration/module.js";
import errors from "./07-errors/module.js";
import async from "./08-async/module.js";
import modulesAndNode from "./09-modules-and-node/module.js";
import stringsAndRegex from "./10-strings-and-regex/module.js";
import functionalPatterns from "./11-functional-patterns/module.js";
import theDomAndBrowser from "./12-the-dom-and-browser/module.js";
import typescriptPreview from "./13-typescript-preview/module.js";
import modernJavascript from "./14-modern-javascript/module.js";
import performanceAndMemory from "./15-performance-and-memory/module.js";
import interviewIdioms from "./16-interview-idioms/module.js";

/** 
 * The JavaScript study plan. Exercises run on Node 16 (the Paiza runner —
 * STUDY_EXECUTOR in src/lib/program-judge.ts), so everything through
 * ES2022 is fair game: class fields, optional chaining, nullish
 * coalescing, `at()`, `replaceAll`, BigInt. Node 17+ additions
 * (`structuredClone`, `Array.prototype.toSorted`, `findLast`, built-in
 * `fetch`) are taught as reading and quiz only.
 *
 * The road, sixteen modules, all written and every reference solution
 * accepted on the judge (`--validate --run`):
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
 *   12 the-dom-and-browser    — DOM, events, fetch, storage, rendering, security; the browser APIs are modelled in Node for the judge
 *   13 typescript-preview     — types on JS, interfaces, generics, narrowing
 *   14 modern-javascript      — ES2020–2024 features, proposals, tooling, runtimes
 *   15 performance-and-memory — V8's tiers and shapes, measuring, GC and leaks, server latency (modelled, never timed)
 *   16 interview-idioms       — the template, the patterns, the idiom sheet, implement-the-built-in, theory drill
 */
export const javascriptTrack: TrackSeed = {
  key: "javascript",
  title: "JavaScript",
  blurb: "The language behind the browser and Node — values and coercion, closures and this, prototypes, the event loop, promises and async — with exercises judged on a real Node runtime.",
  language: "javascript",
  runtime: "Node 16",
  modules: [runtime, valuesAndTypes, functionsAndScope, objectsAndArrays, prototypesAndClasses, collectionsAndIteration, errors, async, modulesAndNode, stringsAndRegex, functionalPatterns, theDomAndBrowser, typescriptPreview, modernJavascript, performanceAndMemory, interviewIdioms],
};
