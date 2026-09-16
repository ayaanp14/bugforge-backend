---
title: Statements, expressions and the semicolon rules
minutes: 12
---
A JavaScript program is a sequence of statements, and most statements are built from expressions — but the two are not the same thing, and the language's most notorious quirk, **automatic semicolon insertion**, lives exactly on their boundary. This lesson covers the anatomy of a program: what counts as a statement, what counts as an expression, how blocks and comments work, the rules by which the parser inserts semicolons you did not write, the three places that rule bites, and the conventions (strict mode, naming, formatting) that keep code readable across a team.

## Expressions produce values; statements do things

An **expression** evaluates to a value: `2 + 3`, `x`, `f(y)`, `a ? b : c`, `[1, 2]`, `() => 1`, `x = 5` (assignment is an expression too — its value is the assigned value). A **statement** performs an action and produces nothing: `let x = 5;`, `if (...) {...}`, `for (...)`, `return x;`, `throw e;`. An expression can stand alone as an *expression statement* — `f(y);` — but a statement cannot appear where a value is needed: `const a = if (x) 1 else 2;` is a syntax error, which is what the conditional operator `x ? 1 : 2` is for.

This distinction decides where arrow bodies need braces (`x => x * 2` is an expression body, `x => { return x * 2; }` a block body) and why `console.log(let y = 1)` fails.

## Blocks, scope and declarations

Braces group statements into a **block**; `let` and `const` declared inside are visible only there (module 2). A lone block is legal and occasionally useful for scoping a temporary name. Declarations come in five kinds — `let`, `const`, `var`, `function`, `class` — and `const` is the default: a binding that cannot be reassigned catches a class of bugs for free. Reach for `let` when the variable must change, and never for `var`.

## Comments and strict mode

`// to end of line` and `/* block */`. There is no nesting of block comments. A JSDoc comment `/** … */` above a function is what editors read for hover documentation and is worth writing for anything public.

`"use strict";` as the first statement of a file (or function) enables strict mode: assigning to an undeclared name throws `ReferenceError` instead of creating a global; assigning to a read-only property throws; `this` in a plain function call is `undefined` rather than the global object; duplicate parameter names and octal literals are errors; `delete` of an undeletable property throws. ES modules and class bodies are strict automatically. There is no reason to write sloppy-mode code in this decade.

## Automatic semicolon insertion (ASI)

Semicolons end statements, and the parser inserts one when it *must* to make sense of a line break. The rule, roughly: if the next token cannot continue the current statement and there is a newline before it, a semicolon is inserted; also before a closing `}` and at end of input. Three consequences:

**1. `return` on its own line returns `undefined`.**

```js
function f() {
  return          // ASI inserts a semicolon here
    { ok: true }; // this object is an unreachable block
}
f();              // undefined
```

The same applies to `break`, `continue`, `throw` (`throw` alone is a syntax error) and `yield`. Keep the value on the same line as `return`.

**2. A line starting with `(`, `[`, `` ` ``, `+`, `-` or `/` continues the previous line.**

```js
const a = b
(c || d).run()     // parsed as: const a = b(c || d).run()  — calling b!
const x = 1
[1, 2].forEach(f)  // parsed as: 1[1, 2].forEach(f)
```

If you omit semicolons, start such lines with a defensive `;` — `;(c || d).run()` — which is the convention in semicolon-free codebases. If you write semicolons, this never happens.

**3. `++`/`--` bind to the token on their own line.**

```js
a
++b   // parsed as: a; ++b;  — not a++
```

The pragmatic rule: **pick one style and let Prettier enforce it.** With semicolons, the only trap left is the `return` one; without, the leading-bracket rule. Either is fine; mixing is not.

## Identifiers and naming

Names are case-sensitive, may contain letters, digits, `_` and `$`, and may not start with a digit; Unicode letters are allowed but rarely wise. Conventions: `camelCase` for variables and functions, `PascalCase` for classes and constructors, `SCREAMING_SNAKE` for true constants (`MAX_RETRIES`), a leading `_` to *hint* privacy (real privacy is `#field`, module 5). Reserved words (`class`, `delete`, `new`, `typeof`, `await` in modules…) cannot be identifiers but can be property names: `obj.class` is legal, `const class = 1` is not.

## Operators worth naming now

`typeof x` (a string naming the type), `x ?? y` (nullish coalescing — `y` only when `x` is `null` or `undefined`), `a?.b` (optional chaining — `undefined` instead of a throw when `a` is nullish), `...spread`, the comma operator (avoid), `void expr` (evaluates and gives `undefined` — mostly for arrow functions that must not return a value). All get their own treatment later; recognise them when they appear.

## Formatting that a team can live with

Two-space indentation, one statement per line, braces on every `if`/`for` body even when it is one line (the dangling-else and "I added a second statement" bugs are both eliminated), `===` everywhere, `const` first. Run **Prettier** so no one argues, and **ESLint** to catch `no-undef`, `no-unused-vars`, `eqeqeq` and the ASI hazards mechanically. In an interview, the visible habits — `const`, `===`, braces, meaningful names — are what an interviewer reads as competence before the algorithm even starts.

## Interview angle

- *"Expression versus statement?"* Expressions evaluate to a value and can be nested; statements perform actions and cannot appear where a value is expected.
- *"What is ASI and when does it bite?"* The parser's semicolon insertion at line breaks; `return` followed by a newline, and lines starting with `(` or `[`.
- *"What does strict mode change?"* Undeclared assignment throws, `this` is `undefined` in plain calls, several silent failures become errors; on by default in modules.
- *"`let` versus `const`?"* Both block-scoped; `const` forbids reassignment (not mutation) — default to `const`.
- *"Can a reserved word be a property name?"* Yes (`obj.class`); it just cannot be a variable name.

## Key takeaways

- Expressions have values; statements do not. Arrow expression bodies, the conditional operator and assignment-as-expression follow from this.
- `const` by default, `let` when needed, `var` never; `"use strict"` always (automatic in modules).
- ASI: keep `return` values on the same line; with no semicolons, prefix lines starting with `(`/`[`/`` ` `` with `;`.
- camelCase / PascalCase / SCREAMING_SNAKE; reserved words are fine as property names.
- Prettier + ESLint, braces on every body, `===` — the habits interviewers notice first.
