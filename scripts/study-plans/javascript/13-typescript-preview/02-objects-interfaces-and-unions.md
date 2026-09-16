---
title: Object types, interfaces, structural typing and discriminated unions
minutes: 13
---
Most of a TypeScript program's types describe **objects**: what properties they have, which are optional or read-only, what shape each is. Two features decide how those types behave and both surprise newcomers from Java or C#: types are **structural** (a value matches a type if it has the right shape, whatever it was declared as), and the natural way to model "one of several kinds of thing" is not a class hierarchy but a **discriminated union** — a `kind` field the compiler can switch on. This lesson covers object types and interfaces, optional/readonly/index signatures, `type` versus `interface`, structural assignability and excess-property checks, intersections, discriminated unions, `enum` versus literal unions, and `satisfies`.

## Object types

```ts
interface User {
  id: string;
  name: string;
  email?: string;                 // optional: string | undefined
  readonly createdAt: Date;       // cannot be reassigned after construction
  tags: readonly string[];        // a readonly array: no push/pop/assignment by index
  [extra: string]: unknown;       // index signature: any other string key holds an unknown
}
type Point = { x: number; y: number };          // type alias — same for object shapes
```

Optional (`?`) means the property may be absent or `undefined`; under `exactOptionalPropertyTypes` the two are distinguished. `readonly` is compile-time only (no `Object.freeze`). An index signature says "any key of this form maps to this type" — for dictionaries, though `Record<string, T>` or a `Map` is usually clearer. Method syntax `greet(): string` and property syntax `greet: () => string` both work; the latter is stricter about parameter variance.

## `interface` versus `type`

Both name an object shape. `interface` can be **extended** (`interface Admin extends User { role: "admin" }`), **merged** across declarations (two `interface Window` blocks combine — how libraries augment globals), and gives clearer error messages for object shapes. `type` can name **anything** — unions, tuples, primitives, function types, mapped and conditional types — and uses `&` for intersection. Convention in most codebases: `interface` for object shapes that may be extended or implemented by classes, `type` for unions, aliases and computed types. Either is fine; be consistent.

## Structural typing

```ts
interface Named { name: string }
const dog = { name: "Rex", legs: 4 };
const n: Named = dog;                    // ok — dog HAS a name; extra properties are fine for a non-literal
function greet(x: Named) {}
greet({ name: "Ada", age: 36 });         // error: excess property 'age' — a fresh object literal is checked exactly
greet(dog);                              // ok — the same object through a variable
```

A type is a set of required properties; any value with those (and any others) is assignable. Names do not matter — two interfaces with identical members are interchangeable. This is why a plain object can satisfy an interface without `implements`, why library types compose without inheritance, and why "duck typing" is checked statically. The one place TypeScript is *nominal-ish* is **excess property checking**: passing an object **literal** directly to a typed slot flags unknown properties (usually a typo), while the same object through a variable is accepted. Classes are structural too — `class A { x = 1 }` and `class B { x = 1 }` are assignable to each other — unless they have private members, which are compared by declaration.

## Intersections and composition

```ts
type Timestamped = { createdAt: Date; updatedAt: Date };
type Post = { title: string; body: string } & Timestamped;        // has all five properties
type Handler = ((e: Event) => void) & { displayName: string };    // a callable with a property
```

`&` combines shapes; conflicting property types intersect too (`string & number` is `never` — a common source of "why is this never"). Intersections compose behaviour-less data shapes the way mixins compose classes.

## Discriminated unions

```ts
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rect"; width: number; height: number }
  | { kind: "square"; size: number };

function area(s: Shape): number {
  switch (s.kind) {                          // the discriminant: a literal-typed property present in every member
    case "circle": return Math.PI * s.radius ** 2;   // s is narrowed to the circle member here
    case "rect": return s.width * s.height;
    case "square": return s.size ** 2;
  }
}
```

Each member carries a literal `kind` (or `type`, `status`, `tag`); a `switch`/`if` on it **narrows** the union so the member's own properties become available. This is the idiomatic replacement for class hierarchies with `instanceof`, for "objects with a type string and a bag of optional fields", and for state modelling (`{ status: "loading" } | { status: "error"; error: Error } | { status: "ready"; data: T }` — impossible states become unrepresentable). Add the `never` default (previous lesson) for exhaustiveness. Result-style types (module 11) are discriminated unions on `ok: true | false`.

## Unions of primitives and literal unions

`type Id = string | number` — narrow with `typeof`. `type Method = "GET" | "POST" | "PUT" | "DELETE"` — a closed set of strings the compiler completes and checks; combine with `as const` arrays to derive the type from the data: `const METHODS = ["GET", "POST"] as const; type Method = (typeof METHODS)[number];`.

## `enum` — and why unions usually win

```ts
enum Color { Red, Green }           // numeric: Color.Red === 0, and any number is assignable — weak
enum Level { Low = "low", High = "high" }   // string enum: a real runtime object, nominal
```

Enums generate runtime code (an object), are nominal (a `"low"` string is **not** assignable to `Level`), and numeric enums accept arbitrary numbers. String-literal unions are erased, structural, need no import at call sites, and give the same autocompletion. Most modern style guides prefer unions (or `as const` objects) and reserve enums for interop with existing enum-shaped data. `const enum` inlines values but breaks under isolated-module builds — avoid.

## `satisfies`

```ts
const palette = { primary: "#2563EB", muted: "#64748B" } satisfies Record<string, string>;
palette.primary.toUpperCase();     // still knows primary is a string literal-typed key: inference kept, shape validated
```

`satisfies` (4.9) checks a value against a type **without** widening the value to that type — you get validation and keep the precise inferred type. Before it, you chose between `const p: Record<string, string> = …` (loses the exact keys) and no check at all.

## Common mistakes

- Expecting a class name to matter for assignability (it does not — shape does).
- Fighting excess-property errors by widening the type instead of fixing the typo.
- Optional-field bags (`{ radius?: number; width?: number; … }`) instead of a discriminated union.
- `string & number` intersections that collapse to `never`.
- Numeric enums; `const enum` in bundled projects.
- Annotating a config object with a wide type and losing literal keys (use `satisfies` or `as const`).

## Interview angle

- *"Is TypeScript nominally or structurally typed?"* Structurally — shape decides assignability; excess-property checks on fresh literals and private class members are the exceptions.
- *"`interface` versus `type`?"* Interfaces extend and merge and suit object shapes; types alias anything including unions; pick a convention.
- *"What is a discriminated union?"* A union whose members share a literal-typed tag; switching on it narrows to the member — the idiomatic alternative to class hierarchies and optional bags.
- *"Why prefer string-literal unions to enums?"* Erased, structural, no imports, same autocompletion; enums are nominal runtime objects and numeric ones are unsafe.
- *"What does `satisfies` do?"* Validates a value against a type while keeping the value's inferred (narrower) type.

## Key takeaways

- Object types: `?` optional, `readonly`, index signatures; `interface` extends/merges, `type` aliases anything; be consistent.
- Structural typing: shape is everything; fresh literals get excess-property checks; private members make classes nominal.
- `&` intersects shapes (conflicts become `never`); discriminated unions with a literal `kind` model variants and states — switch to narrow, `never` to exhaust.
- String-literal unions (with `as const` sources) over enums.
- `satisfies` validates without widening; `as const` keeps literals.
