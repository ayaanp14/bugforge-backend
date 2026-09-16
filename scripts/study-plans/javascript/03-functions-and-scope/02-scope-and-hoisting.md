---
title: Lexical scope, the scope chain and hoisting
minutes: 12
---
Scope is the answer to "which `x` does this line mean?" JavaScript answers it **lexically** — by where the code is written, not by who called it — through a chain of nested scopes that the engine builds when it parses the file. Understanding the chain explains closures (next lesson), why `var` leaks, why a function can use a variable declared after it, and what a module does to the global namespace. This lesson is that model, made concrete.

## Scopes nest, and lookups climb

```js
const app = "shop";                       // module/script scope
function order(id) {                      // function scope: id, total
  let total = 0;
  for (const line of lines(id)) {         // block scope per iteration: line
    total += line.price;                  // total found one scope up; lines found two up
  }
  return `${app}:${id}:${total}`;         // app found at the top
}
```

Every function body and every block creates a scope; a name is resolved by looking in the current scope, then its enclosing scope, and so on to the global scope. The chain is fixed at **write time** — `order` can see `app` because it is *written* inside the scope where `app` lives, regardless of where `order` is later called from. This is lexical (static) scoping; nothing about the call site changes it. (Dynamic-looking behaviour comes only from `this`, lesson 4.)

Failing to find a name anywhere throws `ReferenceError` on read; on *write* in sloppy mode it creates a global — strict mode makes it the same `ReferenceError`.

## The kinds of scope

- **Global** — `globalThis` (`window` in browsers, `global` in Node). Top-level `var`/`function` in a *script* attach to it; `let`/`const` do not; a *module's* top level is its own scope and never leaks.
- **Module** — each ES module (and each CommonJS file, which Node wraps in a function) has its own top-level scope. This is why two files can both declare `const config` without clashing.
- **Function** — parameters and everything declared in the body. `var` lives here.
- **Block** — `{ }`, including loop and `if` bodies, `switch` blocks, `catch (e)`. `let`, `const`, `class` live here.

## Hoisting, precisely

Before running a scope the engine registers every declaration in it:

| Declaration | Registered as | Before its line |
| --- | --- | --- |
| `function f() {}` | the complete function | callable |
| `var v` | `v = undefined` | `undefined` |
| `let`/`const`/`class` | uninitialised | `ReferenceError` (TDZ) |
| `import` | live binding, hoisted | usable — imports are resolved before the module body runs |

So a top-level helper may be defined below the code that calls it — a common and readable layout (main logic first, helpers below) — as long as it is a **declaration**. `const helper = () => …` below its use fails with a TDZ error.

```js
main();
function main() { console.log(square(3)); }   // fine: declarations hoist
function square(n) { return n * n; }
```

## Shadowing

An inner scope may declare a name that also exists outside; inside, the inner wins and the outer is unreachable.

```js
const x = "outer";
function f() { const x = "inner"; return x; }   // "inner"
```

Legal, sometimes useful, often a bug source (a loop variable shadowing a parameter). Linters offer `no-shadow`. A parameter shadows an outer variable of the same name too.

## Closures preview: scopes outlive calls

```js
function makeCounter() {
  let n = 0;
  return () => ++n;      // this arrow's scope chain includes makeCounter's scope
}
const c = makeCounter();
c(); c();                // 1, 2 — n lives on after makeCounter returned
```

A function keeps a reference to the scope chain it was created in. When `makeCounter` returns, its scope would normally be discarded — but the returned arrow still refers to it, so it stays. That retained scope is a **closure**, and the whole of the next lesson.

## Blocks as scoping tools

```js
{
  const tmp = compute();
  use(tmp);
}                            // tmp gone; the name is free again
switch (x) {
  case 1: { const y = 1; break; }   // braces per case give each its own y
}
```

Case clauses share the `switch` block's scope; braces around each case body avoid "identifier has already been declared".

## Globals, and how not to make them

Every global is shared by every script on a page or every file in a process — a name clash waiting to happen. Modules fixed this: nothing leaks unless exported. In scripts, wrap in an IIFE or use `let`/`const` at top level. Node's `require`-based files are already wrapped in a function, which is why `var` at the top of a CommonJS file does *not* become a global (unlike a browser script). Reserve `globalThis.x = …` for the rare genuinely global thing, and name it so nobody mistakes it.

## Reading code with the model

To find what a name means: start at the line, look for a declaration in the innermost block; step out block by block to the function; step out function by function to the module; finally the global object. If the nearest declaration is a `let` below the current line, you are in its TDZ. If none exists anywhere, it is a `ReferenceError` (read) or an accidental global (sloppy write). Every scope question in the language yields to that walk.

## Interview angle

- *"What is lexical scope?"* Scope determined by where code is written; inner functions see outer variables through the scope chain, fixed at definition.
- *"What is hoisting?"* Declarations are registered before a scope runs — functions fully, `var` as `undefined`, `let`/`const` uninitialised.
- *"Why can you call a function declared below its use?"* Function declarations hoist with their body; `const f = () => …` does not.
- *"Script versus module top level?"* Script `var`/functions become globals; a module's top level is private and strict.
- *"What is shadowing?"* An inner declaration hiding an outer one of the same name.

## Key takeaways

- Lookups climb the lexical chain: block → function → module → global; the chain is fixed where the code is written.
- Hoisting: functions callable early; `var` is `undefined` early; `let`/`const`/`class` throw early.
- Modules and CommonJS files have private top-level scope; browser scripts leak `var` and functions to `window`.
- A returned function keeps its defining scope alive — the closure mechanism.
- Brace each `switch` case; avoid shadowing; never assign to undeclared names.
