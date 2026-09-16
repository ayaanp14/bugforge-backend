---
title: What JavaScript is, and why it looks the way it does
minutes: 12
---
JavaScript was written in ten days in 1995 to make web pages move, and it now runs the browser, the server (Node), the phone (React Native), the desktop (Electron) and the build tools of every other language. It is the only language every web developer must know and, by most counts, the most used programming language in the world. Its shape — C-like syntax, first-class functions from Scheme, prototype-based objects from Self, dynamic types, one thread with an event loop — explains most of what will surprise you in this plan. This lesson is the map: what the language is, who defines it, where it runs, and what a JavaScript program is at its simplest.

## Three names, one language

**JavaScript** is the language you write. **ECMAScript** is its specification, maintained by the TC39 committee and published yearly (ES2015 — also called ES6 — was the big modernisation; ES2016 onwards adds a few features each year). **ECMA-262** is the document's number. The names "ES6", "ES2020", "ESNext" all refer to editions of the spec; engines implement the spec, and features move through **four TC39 stages** (proposal → draft → candidate → finished) before landing. Nothing about the language is owned by one company, which is why it evolves slowly and never breaks old code — a page written in 1998 still runs.

## The design in five decisions

1. **Dynamic typing.** Variables have no type; values do. `let x = 1; x = "one";` is legal. The trade-off is flexibility against the runtime errors a compiler would have caught — which is why TypeScript exists and why this plan spends a whole module on values and coercion.
2. **First-class functions and closures.** Functions are values you can pass, return and store; an inner function remembers the variables around it. This is the heart of the language — callbacks, event handlers, promises, React components are all closures.
3. **Prototypes, not classes.** Objects inherit directly from other objects through a prototype chain; the `class` keyword (2015) is a cleaner syntax over the same mechanism.
4. **Single-threaded with an event loop.** One thread runs your code; I/O happens elsewhere and calls back when done. No data races, no locks — and a program that blocks that one thread freezes everything.
5. **Forgiving semantics.** Missing semicolons are inserted, `"5" * 2` is `10`, undefined properties are `undefined` rather than errors. Convenient for a ten-line script, treacherous in a ten-thousand-line application; the rules for staying safe are a recurring theme.

## Where it runs

- **Browsers** — the original host. The language plus the DOM, `fetch`, `localStorage` and the rest of the Web APIs.
- **Node.js** (2009) — Chrome's V8 engine with file, network and process APIs instead of a DOM. Servers, CLIs, build tools. The runtime this plan judges on: **Node 16**.
- **Deno** and **Bun** — newer server runtimes with the same language and different standard libraries.
- **Embedded** — in databases, editors, game engines, and as the scripting layer of countless applications.

The *language* is the same everywhere; the *host objects* differ. `console.log` exists in all of them; `document` exists only in a browser; `require("fs")` only in Node.

## Your first program

```js
// hello.js
"use strict";
const name = "world";
console.log(`Hello, ${name}!`);
```

Run it with `node hello.js`. There is no class, no `main`, no compilation step you see — the file is the program, executed top to bottom. `"use strict"` at the top opts into **strict mode**, which turns several silent mistakes into errors (assigning to an undeclared variable, duplicate parameter names, writing to read-only properties); modules and classes are strict automatically, and every program in this plan should start with it.

## Reading input, the judge's way

Exercises here read standard input and print to standard output, exactly like any other judged language:

```js
const input = require("fs").readFileSync(0, "utf8");     // everything on stdin, as one string
const tokens = input.trim().split(/\s+/);                 // whitespace-separated tokens
const n = Number(tokens[0]);
console.log(n * 2);
```

Lesson 3 covers the alternatives; this one line is enough for now.

## Versions you will hear about

| Edition | Year | Brought |
| --- | --- | --- |
| ES5 | 2009 | strict mode, JSON, `Array.prototype.map/filter/reduce` |
| ES2015 (ES6) | 2015 | `let`/`const`, arrows, classes, template literals, destructuring, promises, modules, `Map`/`Set` |
| ES2017 | 2017 | `async`/`await` |
| ES2019–2020 | | `flat`, optional catch binding, optional chaining `?.`, nullish `??`, `BigInt` |
| ES2021–2022 | | `replaceAll`, logical assignment, class fields, `at()`, top-level `await` |

Node 16 supports everything through ES2022. Newer features (`toSorted`, `structuredClone`, the `using` declaration) are noted where they matter but not exercised.

## Interview angle

- *"Is JavaScript compiled or interpreted?"* Both — engines parse to bytecode, interpret, and JIT-compile hot code to machine code (next lesson).
- *"What is ECMAScript?"* The specification JavaScript implements; editions are yearly.
- *"Why is JavaScript single-threaded?"* By design: one call stack, an event loop for I/O; simple concurrency model, no races.
- *"What does `"use strict"` do?"* Turns silent errors into thrown errors and removes some unsafe behaviours; on by default in modules and classes.
- *"Node versus browser?"* Same language and engine family; different host APIs (files and processes versus DOM and `fetch`).

## Key takeaways

- JavaScript = the language; ECMAScript = the yearly spec from TC39; engines implement it and never break old code.
- Dynamic types, first-class functions and closures, prototypes, one thread plus an event loop, forgiving coercion.
- Same language everywhere; host APIs differ. This plan runs on Node 16.
- A file is a program; `"use strict"` at the top; `readFileSync(0)` reads all of stdin.
- ES2015 is the modern baseline; know what each later edition added.
