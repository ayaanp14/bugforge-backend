---
title: What TypeScript adds — erased types, inference, and any versus unknown versus never
minutes: 13
---
TypeScript is JavaScript plus a **static type system**: annotations and inference that let a compiler check your program before it runs, then erase everything and emit plain JavaScript. Nothing about the runtime changes — no types exist at run time, no performance difference, the same engines — which is both the point and the trap: a type is a *promise about* a value, checked at compile time, and a value that arrives from JSON, a database or a user can break the promise without anyone noticing unless you check at the boundary. This lesson covers what the compiler does, the basic types and how inference assigns them, literal types and widening, and the three special types — `any`, `unknown`, `never` — whose correct use is most of the difference between TypeScript that helps and TypeScript that lies.

## Erasure, and what that means

```ts
function total(items: { price: number; qty: number }[]): number {
  return items.reduce((sum, i) => sum + i.price * i.qty, 0);
}
```

compiles to

```js
function total(items) {
  return items.reduce((sum, i) => sum + i.price * i.qty, 0);
}
```

`tsc` (or esbuild, swc, Babel — anything that strips types) removes the annotations. Consequences: a type error is a compile-time message, never a runtime exception; `instanceof SomeInterface` cannot exist; a value's runtime shape is whatever it actually is, whatever the annotation claimed. TypeScript's guarantee is conditional: *if* every value entering the program matches its declared type, *then* the program has no type errors. Making the "if" true at the boundaries (lesson 4) is your job.

## Basic types and inference

```ts
let n: number = 3;            // annotation
let s = "hi";                 // inferred: string
let ok = true;                // boolean
let big = 10n;                // bigint
let nothing: null = null;     // null and undefined are types too
let ids: number[] = [];       // array of numbers — also Array<number>
let pair: [string, number] = ["a", 1];   // tuple: fixed length and per-position types
let maybe: string | undefined;           // union — one of several types
const point = { x: 1, y: 2 };            // inferred { x: number; y: number }
```

**Inference** assigns types from initialisers and return statements; annotate parameters (nothing to infer from), public function return types when you want the contract explicit, and variables declared without an initialiser. Over-annotating (`const n: number = 3`) adds noise; under-annotating parameters gives implicit `any`, which `strict` mode rejects.

## Literal types and widening

```ts
const a = "left";             // type "left" — a literal type: exactly this string
let b = "left";               // type string — let widens, because it may be reassigned
let dir: "left" | "right" = "left";     // a union of literals — a lightweight enum
const cfg = { mode: "dark" };            // { mode: string } — widened inside an object
const cfg2 = { mode: "dark" } as const;  // { readonly mode: "dark" } — as const keeps literals and makes it readonly
const tuple = [1, 2] as const;           // readonly [1, 2]
```

Literal types are how TypeScript models "one of these exact values": `"GET" | "POST"`, `200 | 404`, `true`. `as const` is the tool for configuration objects and tuples that should keep their exact shape. Unions of string literals replace most `enum`s (lesson 2).

## `any` — the off switch

`any` is assignable to and from everything and every operation on it is allowed: `const x: any = json; x.foo.bar()` compiles. It is contagious — values derived from `any` are `any` — and it silently removes checking from every expression it touches. Legitimate uses: a migration step from JavaScript, the boundary of an untyped library, a genuinely dynamic value you will not inspect. In each case keep it local and convert to a real type as soon as possible. `strict` mode's `noImplicitAny` refuses *implicit* `any` (un-annotated parameters); explicit `any` is allowed but every occurrence should be a decision.

## `unknown` — the type-safe top

`unknown` also accepts every value — but you can do **nothing** with it until you narrow it:

```ts
function handle(data: unknown) {
  data.length;                                  // error: Object is of type 'unknown'
  if (typeof data === "string") data.length;    // ok: narrowed to string
  if (Array.isArray(data)) data.map(String);    // ok: any[]
  if (typeof data === "object" && data !== null && "id" in data) …   // narrowed to object with id
}
```

`JSON.parse` returns `any` in the standard library — the first thing to do with it is `as unknown` (or a validator that returns a typed value), so that the compiler forces the checks. `catch (err)` binds `unknown` under `useUnknownInCatchVariables` (part of `strict`), which is why `err.message` needs `err instanceof Error` first. Rule: **`unknown` at boundaries, never `any`.**

## `never` — the empty type

`never` has no values. It is the return type of a function that never returns (`throw`, infinite loop), the type of a variable after every possibility has been narrowed away, and the tool for **exhaustiveness**:

```ts
type Shape = { kind: "circle"; r: number } | { kind: "square"; s: number };
function area(s: Shape): number {
  switch (s.kind) {
    case "circle": return Math.PI * s.r ** 2;
    case "square": return s.s ** 2;
    default: { const exhaustive: never = s; throw new Error(`unhandled ${exhaustive}`); }
  }
}
```

Add a third shape and forget a case: `s` in the `default` is no longer `never`, and the assignment fails to compile — the compiler tells you every place that must be updated. `never` in a union disappears (`string | never` is `string`); a function returning `never` lets the compiler know code after it is unreachable.

## `void`, `object`, `Function`

`void` is a return type meaning "nothing useful returned" (callers may not use the value); `object` is any non-primitive; `Function` is any callable (too loose — write the signature). Prefer `undefined` returns typed as `void` and specific object shapes over `object`.

## Types in JavaScript files

The same checker runs on `.js` with `// @ts-check` at the top (or `checkJs` in tsconfig) using **JSDoc** annotations:

```js
// @ts-check
/** @param {number} a @param {number} b @returns {number} */
function add(a, b) { return a + b; }
/** @type {{ name: string; tags: string[] }} */
const user = { name: "Ada", tags: [] };
```

This is the zero-build way to get most of TypeScript's checking in a JavaScript project, and the usual first step of a migration.

## Common mistakes

- Trusting an annotation on data that came from outside (`const u = JSON.parse(text) as User` — a lie the compiler cannot catch).
- `any` to silence an error instead of understanding it; `any` spreading through a codebase.
- Annotating everything (`const n: number = 1`) or nothing (implicit `any` parameters).
- Forgetting `as const` on config objects, then fighting `string` where `"dark" | "light"` was meant.
- Missing the exhaustive `never` check on a discriminated union.
- Believing types add runtime safety — they add compile-time checking only.

## Interview angle

- *"What does TypeScript add, and what happens at run time?"* Static types checked at compile time, then erased; the emitted JavaScript has no types.
- *"`any` versus `unknown`?"* Both accept anything; `any` disables checking on use, `unknown` requires narrowing before use.
- *"What is `never` for?"* The empty type: functions that do not return, exhausted unions, exhaustiveness checks.
- *"`const a = 'x'` versus `let a = 'x'`?"* `"x"` (literal) versus `string` (widened); `as const` prevents widening in objects and arrays.
- *"How do you type-check plain JavaScript?"* `// @ts-check` with JSDoc annotations, or `checkJs`.

## Key takeaways

- Types are compile-time promises, erased at build; the runtime is plain JavaScript — check values at the boundaries.
- Annotate parameters and public returns; let inference do the rest; unions and tuples describe shapes precisely.
- `const` gives literal types, `let` widens, `as const` freezes shapes into readonly literals.
- `any` disables checking (keep it local and rare); `unknown` forces narrowing (use it at boundaries); `never` marks impossibility and powers exhaustiveness.
- `// @ts-check` + JSDoc brings the checker to JavaScript files.
