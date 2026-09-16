---
title: Theory drill — the questions, the two-sentence answers, and where each one goes deeper
minutes: 14
---
The theory part of a JavaScript interview is a fixed repertoire: perhaps forty questions, asked in slightly different words, for which the interviewer wants a crisp answer and then one level of depth. The failure mode is not ignorance — you have covered every one of these in the previous fifteen modules — but a rambling answer that never lands, or a crisp answer that cannot go one level further. This lesson is the repertoire as flashcards: the question, the answer in two sentences, the follow-up the interviewer is likely to add, and the module that holds the depth. Drill it aloud; the exercises give you a spaced-repetition scheduler and an answer grader to practise with.

## Language core

| Question | Two-sentence answer | Likely follow-up → depth |
| --- | --- | --- |
| `var`, `let`, `const`? | `var` is function-scoped and hoisted as `undefined`; `let`/`const` are block-scoped with a temporal dead zone. `const` fixes the binding, not the value. | Loop closures with `var` → module 2 |
| Hoisting? | Declarations are processed before execution: functions fully, `var` as `undefined`, `let`/`const`/`class` uninitialised (TDZ). Accessing a TDZ binding throws `ReferenceError`. | Function versus arrow expressions → module 3 |
| `==` versus `===`? | `===` compares type and value; `==` coerces first by an algorithm (null/undefined equal each other only; numbers win over strings; objects to primitives). Use `===` and `Object.is` for `NaN`/`±0`. | `[] == ![]` → module 2 |
| Coercion and falsy values? | Seven falsy values: `false, 0, -0, 0n, "", null, undefined`; everything else is truthy including `[]` and `{}`. `+` concatenates when either side is a string; other operators go numeric. | `"5" - 2` versus `"5" + 2` → module 2 |
| `typeof null`? | `"object"` — a bug preserved for compatibility. Test with `x === null`. | `typeof` of a function/array → module 2 |
| `null` versus `undefined`? | `undefined` means "no value assigned" (missing property, no return); `null` is a deliberate "empty". Default parameters trigger on `undefined` only. | `??` versus `\|\|` → module 14 |
| Closures? | A function keeps access to the variables of the scope where it was created, even after that scope has returned. They implement private state, memoisation, `once`, and module patterns. | Loop-closure classic; memory leaks via closures → modules 3, 15 |
| `this`? | Decided at call time by the call form: `new` → the instance; `call`/`apply`/`bind` → explicit; `obj.method()` → `obj`; plain call → `undefined` in strict mode. Arrows have no `this` and use the enclosing one. | Losing `this` in callbacks and the three fixes → module 3 |
| Prototypes and inheritance? | Every object has a prototype link; property lookup walks the chain. `class` is syntax over constructor functions and prototypes; `extends` links the prototypes and `super` calls the parent. | `Object.create`, `instanceof` implementation → module 5 |
| Shallow versus deep copy? | Spread/`Object.assign` copy one level; nested objects are shared. Deep copies need `structuredClone` or a recursive clone that handles cycles. | What `JSON.parse(JSON.stringify())` loses → modules 4, 14 |
| Immutability? | Not changing an object after creation — copy-on-write with spread and non-mutating array methods. `Object.freeze` is shallow; `const` does not freeze. | Structural sharing, `Readonly` in TS → modules 11, 13 |
| `Map` versus object? | `Map` takes any key type, preserves insertion order, has `size`, no prototype collisions, and is faster for frequent add/delete. Objects for fixed-shape records and JSON. | `WeakMap` and leaks → modules 6, 15 |
| Symbols? | Unique, non-enumerable-by-default keys used for metadata and protocols (`Symbol.iterator`). `Symbol.for` gives a global registry. | Well-known symbols → module 6 |
| Iterators and generators? | An iterable has `[Symbol.iterator]()` returning `{ next() }`; `for…of`, spread and destructuring use it. Generators (`function*`) build iterators lazily with `yield`. | Async generators and `for await` → modules 6, 8 |
| Modules: ESM versus CommonJS? | ESM is static (`import`/`export`, hoisted, live bindings, async loading); CJS is dynamic (`require`, a copied `module.exports` value at call time). Node picks by `"type"`/extension. | Interop, `__dirname` in ESM → module 9 |
| Strict mode? | Turns silent errors into thrown ones: undeclared assignment, writes to read-only, duplicate parameters; `this` is `undefined` in plain calls. Modules and classes are strict by default. | Module 1 |

## Asynchrony

| Question | Two-sentence answer | Likely follow-up → depth |
| --- | --- | --- |
| The event loop? | One thread runs tasks from queues: the current script, then all microtasks (promise reactions, `queueMicrotask`), then one macrotask (timer, I/O), repeat. Node adds `process.nextTick` before microtasks and phases for timers, I/O, `setImmediate`. | Order of `setTimeout(0)`, `Promise.then`, `nextTick` → modules 1, 8 |
| Microtask versus macrotask? | Microtasks drain completely before the loop continues (starving rendering if unbounded); macrotasks run one per turn. Promise callbacks are microtasks; timers are macrotasks. | Why `await` in a loop yields → module 8 |
| Promises? | An object representing a future value in one of three states, settled once; `then` returns a new promise, chaining transformations and flattening returned promises. Errors propagate to the nearest `catch`. | Implement one → module 16 checkpoint |
| `async`/`await`? | Syntax over promises: an `async` function returns a promise; `await` pauses it (yielding to the loop) until the awaited value settles. Sequential awaits serialise; `Promise.all` runs them concurrently. | `forEach` with `await`; `return await` in `try` → module 8 |
| Callback hell and its fixes? | Deep nesting of callbacks with duplicated error handling. Promises flatten it, `async`/`await` makes it read sequentially, and `util.promisify` converts Node-style APIs. | Module 8 |
| `Promise.all` versus `allSettled` versus `race` versus `any`? | `all` fails fast and preserves order; `allSettled` reports every outcome; `race` takes the first to settle; `any` takes the first to fulfil and fails only when all fail. | Timeouts with `race` and `AbortSignal` → module 8 |
| Debounce versus throttle? | Debounce runs once after activity stops for the delay (search box); throttle runs at most once per interval during activity (scroll). Both share one timer across calls. | Leading/trailing options → module 8 |

## Browser and platform

| Question | Two-sentence answer | Likely follow-up → depth |
| --- | --- | --- |
| Event bubbling, capturing, delegation? | Events run capture (down), target, bubble (up); `addEventListener`'s third argument picks the phase. Delegation registers one listener on an ancestor and dispatches on `event.target.closest(selector)`. | `stopPropagation` versus `preventDefault` → module 12 |
| `localStorage`, `sessionStorage`, cookies? | Storage is 5–10 MB, string-only, synchronous, per origin, never sent to the server; cookies are ~4 KB, sent with every request, and carry `HttpOnly`/`Secure`/`SameSite` flags. Auth tokens belong in `HttpOnly` cookies. | XSS and CSRF → module 12 |
| CORS? | The browser blocks cross-origin *responses* unless the server opts in with `Access-Control-Allow-Origin`; preflight `OPTIONS` requests precede non-simple requests. It protects users, not servers. | Credentials and `SameSite` → module 12 |
| XSS and CSP? | Injecting script through untrusted HTML; prevent with escaping/`textContent`, sanitisation, and a Content-Security-Policy that forbids inline and foreign scripts. | Module 12 |
| Reflow versus repaint? | Reflow recomputes layout (geometry changes); repaint redraws pixels (colour). Interleaving DOM writes and layout reads forces synchronous reflows — batch reads, then writes. | `requestAnimationFrame` → module 12 |
| Web Workers? | Background threads without DOM access, communicating by message passing (structured clone or transfer). Use for CPU-heavy work to keep the UI responsive. | `SharedArrayBuffer` → module 15 |

## Engineering

| Question | Two-sentence answer | Likely follow-up → depth |
| --- | --- | --- |
| Memory leaks in JavaScript? | References you forgot: unbounded caches, listeners and timers never removed, closures over large scopes, detached DOM nodes, growing arrays. Find with two heap snapshots and retainer paths. | Generational GC → module 15 |
| Why is my code slow? | Measure first (profile, percentiles), then fix complexity and data structures, then allocation and shape stability in the hot path; on servers count round trips and cache composed payloads. | Module 15 |
| Bundling and tree-shaking? | A bundler follows the import graph into deployable files; tree-shaking removes unused ESM exports (static, side-effect-free). Code splitting loads routes lazily. | Source maps, `sideEffects` → module 14 |
| TypeScript's benefits? | Types catch mismatches at compile time, document contracts, and drive tooling; structural typing and narrowing model real JavaScript. Types vanish at run time — validate at boundaries. | `unknown` versus `any`, discriminated unions → module 13 |
| Error handling patterns? | Throw `Error` subclasses with `cause`; catch at boundaries (request handler, `main`); reject promises with errors, never values. Expected failures can be `Result` values. | Unhandled rejections → module 7 |
| Testing? | Unit tests with arrange–act–assert on behaviour, not implementation; mock only the boundary (network, clock); integration tests for the wiring; a pre-commit gate. | Module 14 |

## How to use these

Answer in the two-sentence form first, then stop. Silence invites the follow-up, and the follow-up is where you demonstrate depth — do not pre-empt it with a monologue. When a question is one you have not seen, reduce it to one you have ("that is asking about closures with an event loop twist") and say so.

## Common mistakes

- Answering with an example instead of a definition ("closures are like when you have a function inside a function…"). Give the definition, then an example if asked.
- Rambling past the answer; contradicting yourself on the way to the point.
- Confusing microtasks and macrotasks; `null` and `undefined`; shallow and deep copies; CORS as a server protection.
- Not knowing where the depth is when the follow-up comes.

## What the interviewer is listening for

- A precise first sentence.
- Correct vocabulary: TDZ, microtask, prototype chain, structural typing, retained size.
- The ability to go one level deeper on request — and to say "I don't know that one" cleanly when you cannot.

## Key takeaways

- The theory repertoire is finite; know each answer in two sentences and where its depth lives.
- Core: scoping and hoisting, coercion, closures, `this`, prototypes, copies and immutability, `Map`, symbols, iterators, modules.
- Async: the loop, micro/macro tasks, promises, `async`/`await`, the four combinators, debounce/throttle.
- Platform and engineering: events, storage, CORS/XSS, reflow, workers, leaks, performance method, bundling, TypeScript, errors, tests.
- Answer, stop, take the follow-up.
