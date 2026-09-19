import type { TrackSeed } from "../dsl.js";
import gettingStarted from "./01-getting-started/module.js";
import typesAndOperators from "./02-types-and-operators/module.js";
import controlFlow from "./03-control-flow/module.js";
import functions from "./04-functions/module.js";
import strings from "./05-strings/module.js";
import listsAndTuples from "./06-lists-and-tuples/module.js";
import dictsAndSets from "./07-dicts-and-sets/module.js";
import classes from "./08-classes/module.js";
import inheritanceAndProtocols from "./09-inheritance-and-protocols/module.js";
import errorsAndExceptions from "./10-errors-and-exceptions/module.js";
import iteratorsAndGenerators from "./11-iterators-and-generators/module.js";
import modulesAndPackages from "./12-modules-and-packages/module.js";
import standardLibrary from "./13-standard-library/module.js";
import filesAndData from "./14-files-and-data/module.js";
import typingAndQuality from "./15-typing-and-quality/module.js";
import decoratorsAndMetaprogramming from "./16-decorators-and-metaprogramming/module.js";
import concurrency from "./17-concurrency/module.js";
import testingAndDebugging from "./18-testing-and-debugging/module.js";
import memoryAndPerformance from "./19-memory-and-performance/module.js";
import interviewIdioms from "./20-interview-idioms/module.js";

/**
 * The Python study plan. Exercises run on the study judge's CPython 3.11
 * (Paiza — STUDY_EXECUTOR in src/lib/program-judge.ts; measured with
 * scratch/pylab/probe-py.mts: 3.11.13 on aarch64, two cores, numpy and
 * pandas importable, hash randomisation on), so everything through 3.11 is
 * fair game in an exercise: structural pattern matching, exception groups
 * and `except*`, `tomllib`, `typing.Self`, `asyncio.TaskGroup`, `StrEnum`,
 * `dataclass(slots=True, kw_only=True)`. 3.12 and later (the `type`
 * statement, PEP 695 generics, `itertools.batched`, f-string quote reuse,
 * free-threading) are taught as reading and quiz only.
 *
 * Authoring rules that keep the cases deterministic: never print a set or
 * anything in set order (string hashes are salted per process — sort
 * first), never `hash()`, `id()`, a default object repr, the clock, an
 * unseeded random or a thread interleaving in an expected output; a
 * judged program reads with bare `input()` or `sys.stdin` (a prompt string
 * is written to stdout) and exits 0 — an uncaught exception is a runtime
 * error even after the right output.
 *
 * The road, twenty modules:
 *
 *   01 getting-started              — what Python is, running it, program anatomy, console I/O, errors and tracebacks
 *   02 types-and-operators          — numbers, floating point, booleans and truthiness, names and binding, conversions, operators
 *   03 control-flow                 — conditionals, while, for and range, match statements, the loop patterns
 *   04 functions                    — defining, parameters and arguments, scope and closures, recursion, lambdas and higher-order functions, hints and docstrings
 *   05 strings                      — basics, slicing and methods, formatting, characters and Unicode, parsing input, regular expressions
 *   06 lists-and-tuples             — lists, comprehensions, sorting, tuples and unpacking, grids, the sequence tools
 *   07 dicts-and-sets               — dictionaries, counting and grouping, sets, hashing and keys, nested data and JSON, choosing a collection
 *   08 classes                      — defining classes, dunder methods, properties and encapsulation, class and static methods, dataclasses, class design
 *   09 inheritance-and-protocols    — inheritance, polymorphism and duck typing, ABCs, multiple inheritance and the MRO, protocols, composition
 *   10 errors-and-exceptions        — exceptions, custom exceptions, EAFP, context managers, exception groups and notes, assertions
 *   11 iterators-and-generators     — the iteration protocol, generators, generator expressions, itertools, functools and operator, lazy pipelines
 *   12 modules-and-packages         — modules and imports, packages, the standard-library map, virtual environments and packaging, scripts and the CLI
 *   13 standard-library             — math and numbers, dates and times, collections in depth, text-processing tools, enums
 *   14 files-and-data               — files, pathlib, csv, JSON in depth, bytes and binary data, sqlite3
 *   15 typing-and-quality           — type hints in depth, mypy, PEP 8 and style, logging, idiomatic Python
 *   16 decorators-and-metaprogramming — decorators, closures and late binding, descriptors, attribute access, classes as objects, the data model
 *   17 concurrency                  — the GIL and the models, threads, concurrent.futures, multiprocessing, asyncio basics, asyncio patterns
 *   18 testing-and-debugging        — the testing mindset, unittest, pytest in outline, mocking, debugging
 *   19 memory-and-performance       — the object model, the cost model, bytecode and the interpreter, measuring, numeric performance, writing fast Python
 *   20 interview-idioms             — the template, the idiom sheet, the pitfalls, implement-the-built-in, clean solutions, theory drill
 */
export const pythonTrack: TrackSeed = {
  key: "python",
  title: "Python",
  blurb: "The language of data, scripting and the fastest interview rounds — the object model, comprehensions and generators, classes and the data model, exceptions, the standard library, typing, concurrency and performance — with exercises judged on a real CPython 3.11.",
  language: "python",
  runtime: "CPython 3.11",
  modules: [
    gettingStarted,
    typesAndOperators,
    controlFlow,
    functions,
    strings,
    listsAndTuples,
    dictsAndSets,
    classes,
    inheritanceAndProtocols,
    errorsAndExceptions,
    iteratorsAndGenerators,
    modulesAndPackages,
    standardLibrary,
    filesAndData,
    typingAndQuality,
    decoratorsAndMetaprogramming,
    concurrency,
    testingAndDebugging,
    memoryAndPerformance,
    interviewIdioms,
  ],
};
