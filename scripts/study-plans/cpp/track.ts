import type { TrackSeed } from "../dsl.js";
import toolchain from "./01-toolchain/module.js";
import types from "./02-types/module.js";
import controlFlow from "./03-control-flow/module.js";
import functions from "./04-functions/module.js";
import strings from "./05-strings/module.js";
import arraysPointersReferences from "./06-arrays-pointers-references/module.js";
import memory from "./07-memory/module.js";
import classes from "./08-classes/module.js";
import specialMembers from "./09-special-members/module.js";
import inheritancePolymorphism from "./10-inheritance-polymorphism/module.js";
import operators from "./11-operators/module.js";
import templates from "./12-templates/module.js";
import stlContainers from "./13-stl-containers/module.js";
import stlAlgorithms from "./14-stl-algorithms/module.js";
import errorHandling from "./15-error-handling/module.js";
import modernCpp from "./16-modern-cpp/module.js";
import concurrency from "./17-concurrency/module.js";
import ioAndFiles from "./18-io-and-files/module.js";
import performanceAndUb from "./19-performance-and-ub/module.js";
import interviewIdioms from "./20-interview-idioms/module.js";

/**
 * The C++ study plan. Exercises compile on the study judge's Clang 18 with
 * `-std=c++20` and libstdc++ 14 (Paiza — STUDY_EXECUTOR in
 * src/lib/program-judge.ts; measured with scratch/cpplab/probe-cpp.mts), so
 * everything through C++20 is fair game in an exercise: concepts, ranges
 * and views, `std::format`, `std::span`, the spaceship operator,
 * designated initialisers, `std::jthread`. C++23 (`std::print`,
 * `std::expected`, `std::mdspan`, deducing `this`) is taught as reading and
 * quiz only. Threads run (two cores) and a program may write and read files
 * in its working directory, which the concurrency and I/O modules use.
 *
 * Authoring rules that keep the cases deterministic: no addresses, hashes,
 * unordered iteration order, thread timing or wall-clock time in any
 * expected output, no signed overflow or other undefined behaviour in a
 * reference solution (the optimiser folds it), and explicit `std::` with
 * real headers everywhere except the interview module, which teaches
 * `bits/stdc++.h` and `using namespace std;` as the contest idioms they are.
 *
 * The road, twenty modules:
 *
 *   01 toolchain                    — what C++ is, compile and link, program anatomy, console I/O, compilers and error messages
 *   02 types                        — fundamental types, integers and bits, floating point, conversions and casts, const/constexpr/auto, enums and literals
 *   03 control-flow                 — branching, switch, loops, range-for, the loop patterns
 *   04 functions                    — declarations, parameter passing, overloading and defaults, recursion, lambdas, scope and linkage
 *   05 strings                      — std::string, searching and slicing, characters and conversions, parsing, formatting, string_view
 *   06 arrays-pointers-references   — built-in arrays and std::array, pointers, pointer arithmetic, references, const correctness, grids
 *   07 memory                       — the memory model, new/delete, RAII, unique_ptr, shared_ptr/weak_ptr, memory errors and tools
 *   08 classes                      — structs and classes, constructors, this and const members, static members, encapsulation, class design
 *   09 special-members              — copy semantics, destructors and the rule of three, move semantics, rule of five/zero, value categories and elision
 *   10 inheritance-polymorphism     — inheritance, virtual functions, abstract classes, virtual destructors and slicing, RTTI and the vtable, composition
 *   11 operators                    — overloading rules, comparisons and <=>, stream operators, subscript/call/functors, conversions
 *   12 templates                    — function and class templates, specialisation, non-type and variadic templates, concepts, type traits
 *   13 stl-containers               — the container zoo, vector, deque/list/adaptors, map/set, unordered containers, iterators and invalidation
 *   14 stl-algorithms               — the algorithm library, sorting and searching, transforming and reducing, lambdas in depth, ranges and views
 *   15 error-handling               — exceptions, exception safety, optional, variant/visit, error codes and design
 *   16 modern-cpp                   — the standards, auto/decltype/bindings, constexpr, the vocabulary types, C++20 and beyond
 *   17 concurrency                  — threads, mutexes and locks, atomics, condition variables, futures and async, patterns
 *   18 io-and-files                 — streams in depth, structured input, file streams, string streams and formatting, binary I/O and filesystem
 *   19 performance-and-ub           — the UB catalogue, the cost model, memory layout and cache, compiler optimisation, measuring and tools
 *   20 interview-idioms             — the template, the STL idiom sheet, the pitfalls, implement-the-built-in, clean solutions, theory drill
 */
export const cppTrack: TrackSeed = {
  key: "cpp",
  title: "C++",
  blurb: "The language of systems, engines and the hard rounds — types and memory, RAII and ownership, classes and the rule of five, templates, the STL, concurrency and modern C++ — with exercises judged on a real C++20 compiler.",
  language: "cpp",
  runtime: "Clang 18 · C++20",
  modules: [
    toolchain,
    types,
    controlFlow,
    functions,
    strings,
    arraysPointersReferences,
    memory,
    classes,
    specialMembers,
    inheritancePolymorphism,
    operators,
    templates,
    stlContainers,
    stlAlgorithms,
    errorHandling,
    modernCpp,
    concurrency,
    ioAndFiles,
    performanceAndUb,
    interviewIdioms,
  ],
};
