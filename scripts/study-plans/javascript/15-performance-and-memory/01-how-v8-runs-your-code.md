---
title: How V8 runs your code — parsing, tiers, hidden classes and inline caches
minutes: 13
---
JavaScript is fast because the engine bets on your code being *predictable* — that a property access at a given line will see objects of the same shape every time, that a function will be called with the same argument types, that an array holds only small integers — and compiles specialised machine code for those bets. When the bets hold, JavaScript runs within a small factor of C; when they break, the engine throws the specialised code away and falls back to slow paths. Understanding the model — parse, interpret, profile, optimise, deoptimise — and the two ideas underneath it, **hidden classes** and **inline caches**, is what turns "JavaScript performance" from folklore into a handful of habits. This lesson explains the pipeline as V8 (Chrome, Node, Deno, Edge) implements it; other engines differ in names, not in principles.

## The pipeline

1. **Parse** — source text → AST. Lazily for functions not yet called (a pre-parser checks syntax only), so startup cost scales with what runs, not with what ships. Code caches (V8's compile cache, Node's `v8.compileCache`) skip this on later runs.
2. **Ignition** — the bytecode interpreter. Every function starts here; bytecode is compact and quick to produce.
3. **Profiling** — while interpreting, V8 records *feedback*: which shapes reached each property access, which types reached each operator, how often each function runs.
4. **Sparkplug** — a fast baseline compiler that turns bytecode into unoptimised machine code without feedback (cheap speed-up, no assumptions).
5. **Maglev** — a mid-tier optimising compiler (V8 ≥ 11.7; not in Node 16) using feedback for moderately hot code.
6. **TurboFan** — the optimising compiler for hot functions: uses the feedback to generate specialised machine code — inlined property loads, unboxed numbers, inlined small functions, eliminated checks.
7. **Deoptimisation** — when an assumption fails at run time (a new shape appears, a string arrives where numbers were expected), the optimised code is abandoned and execution returns to the interpreter with fresh feedback. Repeated deopts for the same function eventually make V8 stop trying.

The practical shape: code that runs once (startup) is interpreted — micro-optimising it is pointless; hot code is compiled with assumptions — keeping those assumptions stable is where performance lives.

## Hidden classes (shapes)

Objects in JavaScript are dictionaries in principle, but V8 does not store them that way. Each object points to a **hidden class** (also called a *map* or *shape*) describing its property names and where each value sits in memory; objects built the same way share one hidden class. Adding properties creates a **transition chain**:

```js
const a = {};          // shape S0 (empty)
a.x = 1;               // S0 --x--> S1
a.y = 2;               // S1 --y--> S2
const b = { x: 5, y: 6 };   // same S2 — same properties in the same order
const c = { y: 6, x: 5 };   // a DIFFERENT shape: order matters
delete a.x;            // a drops to dictionary mode — slow, generic hash lookups
```

Consequences: initialise all properties in the constructor (or literal), in the same order, every time; never add properties later or conditionally; never `delete` (set to `undefined`/`null` instead, or use a `Map`); avoid objects whose property *sets* vary by data (use a `Map` for dictionaries). Class instances built by one constructor naturally share a shape — one of the real performance reasons to use classes for many small objects.

## Inline caches (ICs)

Every property access site (`obj.x` at a specific line) keeps a small cache of the shapes it has seen and, for each, the memory offset of `x`. States:

- **Monomorphic** — one shape: the load is a shape check plus a fixed-offset read, the fastest possible.
- **Polymorphic** — two to four shapes: a short chain of checks, still fast.
- **Megamorphic** — more than four: the site gives up on caching and uses a slow generic lookup (a global hash table). This is where "the same function got 10× slower" comes from.

A function that handles objects of many shapes (a generic `render(item)` over heterogeneous records, a serialiser) is megamorphic by nature — fine, as long as it is not your hot loop. Hot loops want monomorphic sites: uniform objects, consistent types.

## Elements kinds

Arrays also have kinds tracked separately from properties: **PACKED_SMI** (small integers only), **PACKED_DOUBLE** (any numbers), **PACKED_ELEMENTS** (anything), and **HOLEY** variants when the array has gaps. Transitions go one way — SMI → DOUBLE → ELEMENTS, PACKED → HOLEY — and never back. `arr[100] = 1` on a short array creates holes; `new Array(n)` starts holey; `[1, 2, 3.5]` is DOUBLE; `[1, "a"]` is ELEMENTS. Operations on PACKED_SMI arrays are the fastest (no hole checks, no boxing); for numeric work of any size, **typed arrays** (`Float64Array`, `Int32Array`) fix the kind entirely. Build arrays with `push` from empty or with `Array.from`, keep them homogeneous, and never write past the end.

## Numbers: Smis and heap numbers

V8 represents integers in a 31-bit range (on 64-bit, "Smi") directly inside the pointer — no allocation; other numbers (fractions, large integers) are boxed "heap numbers". An array or object field that once held a double keeps a double representation. Mixing `1` and `1.5` in the same field forces boxing or a wider representation; `|0` and `>>> 0` coerce to integers in hot numeric code (asm.js style), and typed arrays make the representation explicit.

## What TurboFan inlines and eliminates

Small functions called from hot code are inlined — the call disappears — so the "function call overhead" folklore mostly does not apply to small, monomorphic helpers; `arr.map(f)` with a tiny `f` compiles to a loop. Bounds checks, type checks and shape checks are hoisted or removed when feedback proves them redundant. Escape analysis removes allocations of short-lived objects that never leave the function (a `{x, y}` returned and immediately destructured). All of this depends on stable feedback: the same code with megamorphic sites gets none of it.

## Things that used to matter and mostly do not

`try`/`catch` in hot functions (optimisable since 2017), `arguments` (fine unless leaked), `for…of` versus indexed `for` (both optimise), closures per se, getters/setters on classes, `const`/`let` in loops. Measure before believing any performance folklore — the engine changes every six weeks.

## Things that still matter

- Shape stability and monomorphic hot sites.
- Elements kinds: packed, homogeneous, no holes; typed arrays for numeric work.
- Avoiding `delete`, dictionary-mode objects and megamorphic hot loops.
- Allocation rate in hot paths (short-lived objects are cheap but not free — module lesson 3).
- Algorithmic complexity — a hash lookup versus a linear scan dwarfs every micro-effect (lesson 4).

## Common mistakes

- Adding properties conditionally or in varying order; `delete` on hot objects.
- Arrays with holes or mixed types in numeric code; `new Array(n)` without filling.
- One generic function serving as the hot loop for every record type.
- Optimising startup code that runs once; believing folklore instead of profiling.
- Reading V8 internals as portable truth — other engines differ in tiers and thresholds.

## Interview angle

- *"How does V8 execute JavaScript?"* Parse → Ignition bytecode with feedback → Sparkplug baseline → TurboFan optimised code on assumptions → deoptimise when they fail.
- *"What is a hidden class?"* An object's shape descriptor (property names and offsets); objects built the same way share one; adding properties or `delete` changes it.
- *"Monomorphic versus megamorphic?"* A property site seeing one shape (fast fixed-offset load) versus more than four (slow generic lookup).
- *"Why is `delete` slow?"* It drops the object into dictionary mode, disabling fast fixed-offset property access.
- *"Why prefer typed arrays for numeric work?"* Fixed element kind and representation — no boxing, no hole checks, predictable memory.

## Key takeaways

- Interpret first, optimise hot code on feedback, deoptimise on surprise; startup code is never optimised.
- Shapes: same properties in the same order share a hidden class; no conditional adds, no `delete`; classes/constructors give uniform shapes.
- Inline caches: keep hot property sites monomorphic; generic code is fine outside hot loops.
- Elements kinds transition one way (SMI → DOUBLE → ELEMENTS, PACKED → HOLEY); typed arrays for numbers.
- Most old folklore is obsolete; shape stability, algorithmic complexity and allocation rate are what remain.
