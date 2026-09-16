---
title: Narrowing, type guards, assertions — making the compiler trust a value
minutes: 12
---
A union type says "one of these"; before you can use the value as one particular member you must **narrow** it, and TypeScript understands the same checks you would write in plain JavaScript — `typeof`, `instanceof`, `in`, equality, truthiness, a `switch` on a discriminant. Narrowing is control-flow analysis: inside the `if`, the variable has a smaller type; in the `else`, the complement. When the built-in checks cannot express what you know, you write a **type guard** (`x is User`) or an **assertion function**, and when you know better than the compiler you use `as` — carefully, because `as` is a promise the compiler will not verify. This lesson covers every narrowing form, exhaustiveness, guards and assertions, the two escape hatches and their rules, and how runtime validation at the boundary connects to all of it.

## Narrowing by control flow

```ts
function describe(x: string | number | null | Date | string[]) {
  if (x === null) return "null";                       // equality narrowing: x is null here, string | number | Date | string[] after
  if (typeof x === "string") return x.toUpperCase();   // typeof: "string" | "number" | "boolean" | "bigint" | "symbol" | "undefined" | "object" | "function"
  if (typeof x === "number") return x.toFixed(2);
  if (x instanceof Date) return x.toISOString();       // instanceof: classes and built-ins
  if (Array.isArray(x)) return x.join(",");            // built-in guards: Array.isArray, Number.isFinite …
  return x;                                            // never — everything has been handled
}
```

After each `return`, the remaining type shrinks. `typeof x === "object"` leaves `null` in (it is `"object"` too) — check `x !== null` first or together. **Truthiness** narrowing (`if (x)`) removes `null`/`undefined` but also `0`, `""` and `false` — fine for objects, a bug for numbers and strings that may legitimately be falsy. Narrowing applies to `const`s and to properties along a path (`obj.a.b`) until something could have changed them (a function call, an `await`, an assignment) — the compiler then resets to the declared type, which is why extracting to a local `const` sometimes "fixes" a narrowing error.

## `in`, discriminants and `switch`

```ts
type Cat = { meow(): void }; type Dog = { bark(): void };
function speak(p: Cat | Dog) { if ("meow" in p) p.meow(); else p.bark(); }   // `in` narrows by property presence

type Event = { type: "click"; x: number } | { type: "key"; key: string } | { type: "scroll"; dy: number };
function handle(e: Event) {
  switch (e.type) {
    case "click": return e.x;
    case "key": return e.key;
    case "scroll": return e.dy;
    default: return assertNever(e);      // compile error the day a fourth event appears
  }
}
function assertNever(x: never): never { throw new Error(`unexpected: ${JSON.stringify(x)}`); }
```

The discriminant switch is the workhorse of typed application code; `assertNever` turns "I forgot a case" into a build failure and, at run time, into a loud error for data the types did not anticipate.

## User-defined type guards

```ts
interface User { id: string; name: string; email?: string }
function isUser(x: unknown): x is User {
  return typeof x === "object" && x !== null
    && typeof (x as any).id === "string"
    && typeof (x as any).name === "string"
    && ((x as any).email === undefined || typeof (x as any).email === "string");
}
const data: unknown = JSON.parse(text);
if (isUser(data)) data.name;      // narrowed to User
users.filter(isUser);             // filter with a guard returns User[] — plain (u) => !!u would keep the union
```

A function returning `x is T` tells the compiler "when I return true, treat `x` as `T`". Its body is ordinary JavaScript — **you** are responsible for it being correct; a guard that checks less than it claims is an `as` in disguise. Guards compose (`isArrayOf(isUser)`), work with `filter`, and are the honest way to turn `unknown` into a type. For anything beyond a few fields use a schema library (zod, valibot) whose `parse` returns the typed value and whose type you `infer` — one definition, runtime check and static type together.

## Assertion functions

```ts
function assertIsUser(x: unknown): asserts x is User { if (!isUser(x)) throw new TypeError("not a User"); }
function assert(cond: unknown, msg?: string): asserts cond { if (!cond) throw new Error(msg ?? "assertion failed"); }

assertIsUser(data);   data.name;          // narrowed from here on — no if block
assert(user, "user required"); user.id;   // removes undefined
```

`asserts x is T` narrows for the rest of the scope when the function returns; `asserts cond` narrows on any boolean expression (`assert(x !== null)`). Node's `assert` module is typed this way. Use assertions for invariants (module 7's distinction): a failure is a bug, and the throw is the right outcome.

## `as` and `!` — the escape hatches

```ts
const input = document.getElementById("q") as HTMLInputElement;   // you know more than the compiler (the element's kind)
const el = document.querySelector(".x")!;                          // non-null assertion: "this is not null, trust me"
const n = value as unknown as number;                              // double assertion: turn off checking entirely — a smell
```

`as` narrows or widens between **compatible** types without any check; `!` removes `null | undefined`. Both compile to nothing. Acceptable when the knowledge is real and local (DOM element types, a value you just validated, a literal you want narrowed); a bug source when used to silence an error about data from outside. Rules: prefer a guard or a schema when the value came from I/O; prefer narrowing (`if`) to `!`; never `as any`; treat every `as` in a diff as a review question.

## Narrowing `unknown` at the boundary

The pattern that makes the whole type system honest:

1. Data enters as `unknown` (`JSON.parse(text) as unknown`, `req.body as unknown`, `catch (err: unknown)`).
2. A guard or schema **validates** it and returns a typed value (or throws/returns an error).
3. Everything inside works with the typed value; no `as`, no `any`.

For errors: `if (err instanceof Error) err.message`, or a guard for your `AppError` (module 7). For `catch`, `strict` binds `err` as `unknown` for exactly this reason.

## Common mistakes

- `typeof x === "object"` forgetting `null`; truthiness narrowing on numbers/strings.
- Narrowing lost across a function call or `await` (extract to a `const`).
- A type guard that returns true without checking everything it claims.
- `as` to convert I/O data (`JSON.parse(t) as User`) — no check happened.
- `!` sprinkled to silence strict null errors instead of handling the null case.
- Missing `assertNever` in exhaustive switches; `default: return undefined` hiding new cases.

## Interview angle

- *"What is narrowing?"* Control-flow analysis that shrinks a union inside a branch based on `typeof`, `instanceof`, `in`, equality, truthiness or a discriminant check.
- *"What is a type guard?"* A function returning `x is T` whose true result narrows `x`; you write the runtime check.
- *"When is `as` acceptable?"* When you know something the compiler cannot and the knowledge is local and safe (DOM types, just-validated data); never for I/O data.
- *"How do you handle `unknown` from JSON?"* Validate with a guard or schema at the boundary and work with the typed result.
- *"What does `asserts x is T` do?"* Narrows `x` for the rest of the scope after the function returns (it throws otherwise).

## Key takeaways

- `typeof`, `instanceof`, `in`, `===`, truthiness and discriminant `switch` narrow by control flow; narrowing resets across calls and `await`.
- `assertNever` in the `default` makes unions exhaustive at compile time and loud at run time.
- Type guards (`x is T`) and assertion functions (`asserts x is T`) are the honest bridges from `unknown`; their bodies must check what they claim.
- `as` and `!` are unchecked promises — local, rare, never on I/O data; `as any` never.
- Boundary pattern: `unknown` in → validate (guard/schema) → typed everywhere else.
