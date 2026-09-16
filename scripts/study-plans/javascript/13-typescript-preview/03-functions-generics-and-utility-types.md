---
title: Function types, generics, keyof and the utility types
minutes: 13
---
Generics are how TypeScript types code that works for many types without giving up precision: `first(xs: number[]): number` and `first(xs: string[]): string` become one `first<T>(xs: T[]): T`, and the compiler fills in `T` at each call. Combined with `keyof`, indexed access and constraints, generics express the relationships real code has — "this key must exist on that object", "the return type is the property's type" — and the standard library's **utility types** (`Partial`, `Pick`, `Record`, `ReturnType`…) are generics you will use daily. This lesson covers function typing, generic functions and constraints, `keyof`/indexed access, the utility types with what each is made of, and a first look at mapped and conditional types so their error messages make sense.

## Typing functions

```ts
function add(a: number, b: number): number { return a + b; }
const mul = (a: number, b: number): number => a * b;
type BinaryOp = (a: number, b: number) => number;            // a function type
function apply(op: BinaryOp, a: number, b: number) { return op(a, b); }

function greet(name: string, greeting = "Hello", ...rest: string[]): string { … }   // defaults and rest are typed like values
function log(msg: string, level?: "info" | "warn") {}                                // optional parameter
```

Return types are inferred; annotate them on exported functions so a change inside does not silently change the public contract. Parameters are checked **contravariantly-ish** (a callback declared to take `Animal` may be given one taking `Dog` only under `strictFunctionTypes` rules for method syntax) — in practice: callbacks may accept *fewer* parameters than provided (`arr.map((x) => …)` ignores index) but not more.

**Overloads** describe a function whose return type depends on argument types:

```ts
function parse(x: string): number;
function parse(x: number): string;
function parse(x: string | number) { return typeof x === "string" ? Number(x) : String(x); }
```

Prefer a union or a generic when it expresses the same thing; overloads for genuinely different signatures.

## Generic functions

```ts
function first<T>(xs: T[]): T | undefined { return xs[0]; }
first([1, 2]);            // T inferred as number → number | undefined
first(["a"]);             // string | undefined
first<number>([]);        // explicit

function map<T, U>(xs: T[], f: (x: T) => U): U[] { return xs.map(f); }
const lens = map(["a", "bb"], (s) => s.length);   // T = string, U = number → number[]
```

A type parameter stands for "some type, decided by the caller"; inference picks it from the arguments. Name them `T`, `U`, `K`, `V` for simple cases and descriptively (`TItem`, `TKey`) when several interact. A function that does not use `T` in its parameters cannot infer it — that is a sign the generic is misplaced.

## Constraints, `keyof` and indexed access

```ts
function longest<T extends { length: number }>(a: T, b: T): T { return a.length >= b.length ? a : b; }
longest("abc", "de");  longest([1, 2], [3]);   longest(1, 2);   // error: number has no length

function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] { return items.map((i) => i[key]); }
pluck(users, "name");     // string[] — K is "name", T[K] is string
pluck(users, "zip");      // error: Argument of type '"zip"' is not assignable to parameter of type 'keyof User'
```

`extends` **constrains** a type parameter (the value must at least have this shape). `keyof T` is the union of `T`'s property names as literal types (`"id" | "name" | "email"`). `T[K]` (indexed access) is the type of property `K` on `T`. Together they type "give me the property named `key`" so that a misspelled key is a compile error and the return type follows the property — the pattern behind every typed `get`, `groupBy(key)`, `sortBy(key)`, form-field binding and ORM column reference.

## Generic types and classes

```ts
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };    // a default type argument
class Stack<T> {
  #items: T[] = [];
  push(x: T) { this.#items.push(x); }
  pop(): T | undefined { return this.#items.pop(); }
}
const s = new Stack<number>(); s.push("x");     // error
interface Repository<T extends { id: string }> { get(id: string): Promise<T | undefined>; save(item: T): Promise<void>; }
```

`Array<T>`, `Promise<T>`, `Map<K, V>`, `Set<T>`, `Record<K, V>` are generic types you already use; `Promise<User[]>` reads as "a promise of an array of users".

## The utility types

All built from mapped and conditional types (below); know what each does and roughly how:

| Utility | Meaning | Made of |
| --- | --- | --- |
| `Partial<T>` | every property optional | `{ [K in keyof T]?: T[K] }` |
| `Required<T>` | every property required | `{ [K in keyof T]-?: T[K] }` |
| `Readonly<T>` | every property readonly | `{ readonly [K in keyof T]: T[K] }` |
| `Pick<T, K>` | only the keys `K` | `{ [P in K]: T[P] }` |
| `Omit<T, K>` | all but the keys `K` | `Pick<T, Exclude<keyof T, K>>` |
| `Record<K, V>` | an object with keys `K` and values `V` | `{ [P in K]: V }` |
| `Exclude<T, U>` / `Extract<T, U>` | remove / keep union members assignable to `U` | conditional over the union |
| `NonNullable<T>` | drop `null` and `undefined` | `T & {}` |
| `ReturnType<F>` / `Parameters<F>` | a function's return / parameter tuple | `infer` |
| `Awaited<T>` | what `await` yields | recursive conditional |

`Partial<User>` for update payloads, `Pick<User, "id" | "name">` for a list view, `Omit<User, "passwordHash">` for a public shape, `Record<Method, Handler>` for a dispatch table, `ReturnType<typeof makeStore>` to name a type you never wrote.

## Mapped and conditional types, briefly

```ts
type Nullable<T> = { [K in keyof T]: T[K] | null };            // mapped: transform every property
type Getters<T> = { [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K] };   // key remapping + template literal types
type ElementOf<A> = A extends (infer E)[] ? E : never;          // conditional with infer: number[] → number
type IsString<T> = T extends string ? "yes" : "no";             // distributes over unions
```

A **mapped type** iterates `keyof` and builds a new object type; a **conditional type** chooses between types with `extends ? :` and can `infer` parts of a type. They are the meta-programming layer of the type system — you read them in library types and error messages long before you write them; when you do write one, keep it small and name it.

## Common mistakes

- `any` in a function signature because "it takes anything" — that is `unknown` or a generic.
- A generic whose `T` appears only in the return type (uninferrable).
- `keyof` without a constraint (`function get<T>(o: T, k: string)` — `o[k]` is an error; use `K extends keyof T`).
- `Omit` on a union (it operates on the union's *common* keys — use a distributive helper).
- Reaching for overloads where a union parameter suffices; or for conditional types where a plain union would do.
- Under-typing callbacks (`(x: any) => void`) in generic helpers.

## Interview angle

- *"What is a generic?"* A type parameter decided per use, letting one function or type work for many types while staying precise.
- *"Explain `K extends keyof T` and `T[K]`."* Constrain the key to the object's property names; index the object type by it to get that property's type.
- *"`Partial` versus `Pick` versus `Omit`?"* All optional; only these keys; all but these keys.
- *"How is `Omit` implemented?"* `Pick<T, Exclude<keyof T, K>>`.
- *"What is a mapped type?"* A type built by iterating `keyof` some type and transforming each property.

## Key takeaways

- Type parameters and returns explicitly on public functions; function types describe callbacks; overloads only for genuinely different signatures.
- Generics infer `T` from arguments; constrain with `extends`; `keyof T` + `T[K]` type property access safely.
- Generic types/classes: `Result<T, E>`, `Stack<T>`, `Repository<T extends { id }>`.
- Utility types: `Partial`, `Required`, `Readonly`, `Pick`, `Omit`, `Record`, `Exclude`/`Extract`, `NonNullable`, `ReturnType`/`Parameters`, `Awaited`.
- Mapped types transform properties; conditional types choose with `extends ? :` and `infer` — read them, write them sparingly.
