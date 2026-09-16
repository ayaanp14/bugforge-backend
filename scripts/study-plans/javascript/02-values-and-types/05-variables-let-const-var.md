---
title: let, const and var — scope, hoisting and the temporal dead zone
minutes: 13
---
Three keywords declare variables, and the oldest one, `var`, is the reason the other two exist. `var` is function-scoped and hoisted with a value of `undefined`, which produced a generation of bugs (the loop-closure classic, accidental globals, variables used before their line); `let` and `const` (2015) are block-scoped, hoisted but *uninitialised*, and `const` cannot be reassigned. This lesson explains scope and hoisting precisely, the **temporal dead zone**, what `const` does and does not freeze, and the conventions modern code follows.

## Three declarations

| | `var` | `let` | `const` |
| --- | --- | --- | --- |
| scope | function (or global) | block | block |
| hoisted | yes, initialised to `undefined` | yes, uninitialised (TDZ) | yes, uninitialised (TDZ) |
| redeclare in same scope | allowed | `SyntaxError` | `SyntaxError` |
| reassign | yes | yes | **no** |
| creates a global property when top-level in a script | yes (`globalThis.x`) | no | no |
| use | never in new code | when the binding changes | default |

## Block scope

```js
{
  let a = 1;
  const b = 2;
  var c = 3;
}
console.log(typeof a, typeof b, c);   // "undefined" "undefined" 3
```

`let` and `const` live in the nearest enclosing `{ }` — an `if` body, a loop body, a bare block. `var` ignores blocks and attaches to the enclosing **function** (or the whole script), which is how a `var i` in a `for` loop leaks out and how two `var x` in one function silently share.

## Hoisting and the temporal dead zone

All declarations are processed before the code runs — that is **hoisting** — but they are initialised differently:

```js
console.log(v);   // undefined — var is hoisted and initialised to undefined
var v = 1;

console.log(l);   // ReferenceError: Cannot access 'l' before initialization
let l = 2;
```

From the start of the block until the `let`/`const` line executes, the binding exists but is in the **temporal dead zone**: any read or write throws. This is a feature — it turns "used before defined" into an immediate, precise error instead of a silent `undefined` that surfaces three functions later. `typeof l` in the TDZ also throws (the one case where `typeof` throws). Function *declarations* are hoisted with their body, so you may call a function above its definition; function *expressions* assigned to `const` are not (module 3).

## The loop-closure classic

```js
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i), 0);   // 3 3 3
for (let j = 0; j < 3; j++) setTimeout(() => console.log(j), 0);   // 0 1 2
```

With `var`, one `i` is shared by every callback and equals `3` when they run. With `let`, **each iteration gets a fresh binding** — the specification copies the loop variable into a new scope per iteration — so each closure sees its own `j`. This example alone justifies `let`; module 3 explains closures properly.

## `const` is about the binding, not the value

```js
const n = 1;
n = 2;                 // TypeError: Assignment to constant variable
const o = { x: 1 };
o.x = 2;               // fine — the object is mutable; the binding still points at it
o = {};                // TypeError
const arr = [];
arr.push(1);           // fine
```

`const` prevents **reassignment**, nothing more. Immutable *contents* need `Object.freeze` (shallow) or discipline (module 4). Style-wise this is exactly right: most bindings are never reassigned, so `const` documents that; a `let` then signals "this one changes — watch it."

## Global scope and accidental globals

In a script (not a module), top-level `var` and function declarations become properties of the global object (`globalThis`, `window` in browsers); top-level `let`/`const` do not. Assigning to an undeclared name in sloppy mode creates a global — `total = 0` inside a function with a typo becomes a silent shared variable — which strict mode turns into a `ReferenceError`. Modules (ESM) have their own top-level scope and are strict by default, another reason to prefer them.

## Shadowing and redeclaration

An inner block may declare a name that exists outside — **shadowing** — and the inner one wins inside the block. It is legal, occasionally useful (a loop's `const item` inside a function that also has `item`), and usually confusing; linters flag it. Redeclaring with `let`/`const` in the *same* scope is a `SyntaxError`; `var` allows it silently, another way bugs hide.

## Naming conventions

`camelCase` for variables and functions; `PascalCase` for classes; `UPPER_SNAKE` for module-level constants that are truly constant values (`MAX_RETRIES`, `API_URL`) — not for every `const`. Booleans read as predicates (`isReady`, `hasItems`); collections plural (`users`); a `let` deserves a name that says what changes (`remaining`, `cursor`).

## Practical rules

1. `const` by default; `let` when reassignment is needed; `var` never.
2. Declare at first use, in the smallest block that needs the name.
3. One declaration per line; initialise on the declaration line.
4. Turn on ESLint `no-var`, `prefer-const`, `no-shadow`, `no-undef`.
5. In a `for` loop, `let i`; in `for…of`/`for…in`, `const item`.

## Interview angle

- *"`var` versus `let` versus `const`?"* Function scope and `undefined`-hoisting versus block scope with a TDZ; `const` additionally forbids reassignment.
- *"What is hoisting?"* Declarations are processed before execution; `var` initialises to `undefined`, `let`/`const` remain uninitialised until their line.
- *"What is the temporal dead zone?"* The window between entering a scope and executing a `let`/`const` declaration, during which access throws `ReferenceError`.
- *"Why does `for (var …)` with `setTimeout` print the last value?"* One shared `var` binding; `let` creates a binding per iteration.
- *"Does `const` make an object immutable?"* No — only the binding; use `Object.freeze` for shallow immutability.

## Key takeaways

- `const` default, `let` for change, `var` never.
- Block scope for `let`/`const`; function scope for `var`; `var` leaks from blocks and redeclares silently.
- Hoisting: `var` → `undefined`; `let`/`const` → TDZ `ReferenceError` on early access.
- `for (let …)` gives each iteration its own binding — the fix for the closure classic.
- `const` freezes the binding, not the object; strict mode/modules stop accidental globals.
