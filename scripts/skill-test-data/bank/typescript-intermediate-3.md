---
skill: typescript
level: intermediate
---

## typescript-intermediate-051
topic: advanced-types
answer: B

With `strict: true`, what are `A` and `B`?

```typescript
type IsText<T> = T extends string ? "yes" : "no";

type A = IsText<never>;
type B = IsText<string | 1>;
```

- A: `A` is `"no"`; `B` is `"no"`.
- B: `A` is `never`; `B` is `"yes" | "no"`.
- C: `A` is `"yes"`; `B` is `"yes" | "no"`.
- D: `A` is `never`; `B` is `"no"`.

> `IsText` distributes over a union, testing each member: `string` gives
> `"yes"` and `1` gives `"no"`, so `B` is `"yes" | "no"`. `never` is the empty
> union, so there is nothing to test and the result is `never` — a common
> surprise in helpers such as `IsNever<T>`, which has to be written
> `[T] extends [never] ? true : false`.

## typescript-intermediate-052
topic: advanced-types
answer: B

With `strict: true`, what is `Cls`?

```typescript
type Size = "sm" | "lg";
type Tone = "red" | "blue";
type Cls = `${Size}-${Tone}`;
```

- A: `"sm-red" | "lg-blue"`
- B: `"sm-red" | "sm-blue" | "lg-red" | "lg-blue"`
- C: `` `${string}-${string}` ``
- D: `string`

> A template literal type with unions in its placeholders expands to every
> combination — the cross product — so two sizes and two tones give four
> literal types. The members are not paired off position by position (A), and
> the result stays an exact union of literals rather than a pattern (C) or a
> plain `string` (D).

## typescript-intermediate-053
topic: advanced-types
answer: D

With `strict: true`, what is `Back`?

```typescript
type Strip<S> = S extends `on${infer E}` ? Uncapitalize<E> : never;
type Back = Strip<"onClick" | "onFocus" | "submit">;
```

- A: `"onClick" | "onFocus"`
- B: `"click" | "focus" | "submit"`
- C: `never`
- D: `"click" | "focus"`

> The conditional distributes over the union. For `"onClick"`, the pattern
> `` `on${infer E}` `` matches and binds `E` to `"Click"`, which `Uncapitalize`
> turns into `"click"`; `"onFocus"` works the same way. `"submit"` does not
> start with `on`, so it yields `never`, and `never` disappears from a union.

## typescript-intermediate-054
topic: advanced-types
answer: A

With `strict: true`, what is `G`?

```typescript
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type G = Getters<{ name: string; age: number }>;
```

- A: `{ getName: () => string; getAge: () => number }`
- B: `{ getName: string; getAge: number }`
- C: `{ name: () => string; age: () => number }`
- D: `{ getName: () => string | number; getAge: () => string | number }`

> The `as` clause of a mapped type renames each key: the template literal type
> builds `getName` and `getAge` from `name` and `age`, while `T[K]` still uses
> the original key, so each getter returns its own property's type. The
> `string & K` is there because `keyof T` may include `number` and `symbol`
> keys, which `Capitalize` does not accept.

## typescript-intermediate-055
topic: advanced-types
answer: C

With `strict: true`, what is `F`?

```typescript
type FunctionKeys<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

interface Api {
  url: string;
  get(): void;
  post: (body: string) => void;
  retries: number;
}

type F = FunctionKeys<Api>;
```

- A: `"get"`
- B: `"url" | "retries"`
- C: `"get" | "post"`
- D: `never`

> The mapped type replaces each property's type with its own key when that type
> is a function, and with `never` otherwise. Indexing the result with
> `[keyof T]` collects those values into a union, and the `never`s vanish. A
> method (`get(): void`) and a property holding a function
> (`post: (body: string) => void`) both have function types, so both are kept.

## typescript-intermediate-056
topic: enums-literals
answer: A
run: typescript

What does this program print?

```typescript
enum Level {
  Low = 1,
  Mid,
  High = 10,
  Max,
}
console.log(Level.Mid, Level.Max, Level[2]);
```

- A: `2 11 Mid`
- B: `2 4 Mid`
- C: `1 11 Low`
- D: `2 11 undefined`

> A numeric member without an initialiser is the previous member plus one:
> `Mid` follows `Low = 1` and is `2`, and `Max` follows `High = 10` and is
> `11` — the count restarts from the last explicit value. Numeric enums also
> get a reverse mapping from value to name, so `Level[2]` is `"Mid"`.

## typescript-intermediate-057
topic: enums-literals
answer: C
run: typescript

What does this program print?

```typescript
enum Dir {
  Up,
  Down,
}
enum Tone {
  Red = "RED",
  Green = "GREEN",
}
console.log(Object.keys(Dir).length, Object.keys(Tone).length);
```

- A: `2 2`
- B: `4 4`
- C: `4 2`
- D: `2 4`

> A numeric enum compiles to an object that maps both ways — `Dir.Up` is `0`
> and `Dir[0]` is `"Up"` — so `Dir` has four keys: `"0"`, `"1"`, `"Up"` and
> `"Down"`. A string enum gets no reverse mapping, so `Tone` has only `Red` and
> `Green`. Code that lists a numeric enum's names with `Object.keys` has to
> filter out the numeric keys.

## typescript-intermediate-058
topic: enums-literals
answer: C

With default compiler options (`isolatedModules` and `preserveConstEnums` off), what does this compile to?

```typescript
const enum Flag {
  A = 1,
  B = 2,
}
const x = Flag.B;
```

- A: A function that builds a `Flag` object, then `x` set to `Flag.B`
- B: An object literal `Flag` holding `A` and `B`, then `x` set to `Flag.B`
- C: Only `x` set to `2`, with a comment naming `Flag.B`; no `Flag` object
- D: Nothing at all: `x` is erased together with the enum

> A `const enum` exists only at compile time: every use of a member is replaced
> by its value (`var x = 2 /* Flag.B */;` for the default target) and no object
> is emitted. That is also why code that needs the object — `Object.keys(Flag)`,
> or a reverse lookup such as `Flag[2]` — does not compile. A regular `enum`
> emits the function that builds the object, as in A.

## typescript-intermediate-059
topic: enums-literals
answer: B
run: typescript

What does this program print?

```typescript
enum Perm {
  None = 0,
  Read = 1 << 0,
  Write = 1 << 1,
  All = Read | Write,
}
const p = Perm.Read | Perm.Write;
console.log(p, Perm[p], p === Perm.All);
```

- A: `3 undefined false`
- B: `3 All true`
- C: `3 undefined true`
- D: `3 All false`

> Enum members can be initialised with constant expressions, including other
> members: `Read` is `1`, `Write` is `2` and `All` is `Read | Write`, which is
> `3`. Combining two flags with `|` gives the plain number `3`. Since `All`
> has that value, the reverse mapping `Perm[3]` finds `"All"`, and
> `p === Perm.All` is true.

## typescript-intermediate-060
topic: enums-literals
answer: A, C, E

With `strict: true` on TypeScript 5.x, which of these lines compile? Select all that apply.

```typescript
enum Status {
  Active = 1,
  Inactive = 2,
}
enum Tone {
  Red = "RED",
  Green = "GREEN",
}
let s: Status = Status.Active;
```

- A: `s = 2;`
- B: `s = 5;`
- C: `const n: number = Status.Inactive;`
- D: `const t: Tone = "RED";`
- E: `const k: keyof typeof Status = "Active";`

> A numeric enum is assignable to `number` (C), and a number literal equal to
> one of its members is assignable to the enum (A). Since TypeScript 5.0, a
> literal that matches no member is an error (B). String enum members are
> opaque: even the matching string `"RED"` is not assignable to `Tone` (D) —
> write `Tone.Red`. `typeof Status` is the type of the enum object, so its keys
> are the member names (E).

## typescript-intermediate-061
topic: enums-literals
answer: B, C, D

With `strict: true`, the last line does not compile, because `req.method` is typed `string`. Which changes fix it? Select all that apply.

```typescript
type Method = "GET" | "POST";
function send(url: string, method: Method) {}

const req = { url: "/orders", method: "GET" };
send(req.url, req.method);
```

- A: Declare `req` with `let` instead of `const`.
- B: Add `as const` after the object literal.
- C: Write `method: "GET" as const` inside the object literal.
- D: Annotate it: `const req: { url: string; method: Method } = …`.
- E: Pass `req.method as string` in the call.

> `const` fixes the binding, not the object: its properties could be
> reassigned, so `"GET"` is widened to `string`. Keeping the literal takes
> `as const` on the whole object (B, which also makes its properties
> `readonly`), `as const` on the one value (C), or an annotation that gives the
> property its type (D). `let` changes nothing about the property (A), and a
> `string` (E) is still not assignable to `Method`.

## typescript-intermediate-062
topic: enums-literals
answer: A

With `strict: true`, what are `RoleKey` and `RoleValue`?

```typescript
enum Role {
  Admin = "admin",
  User = "user",
}
type RoleKey = keyof typeof Role;
type RoleValue = `${Role}`;
```

- A: `RoleKey` is `"Admin" | "User"`; `RoleValue` is `"admin" | "user"`.
- B: `RoleKey` is `"Admin" | "User"`; `RoleValue` is `string`.
- C: `RoleKey` is `Role`; `RoleValue` is `"admin" | "user"`.
- D: `RoleKey` is `string`; `RoleValue` is `"admin" | "user"`.

> `typeof Role` is the type of the enum object, so its `keyof` is the member
> names. (`keyof Role`, without `typeof`, would give the keys of the `string`
> type, such as `"length"` and `"charAt"`.) Placing the enum type in a template
> literal type turns each member into its string value, which is a handy way
> to accept either `Role.Admin` or the plain string `"admin"`.

## typescript-intermediate-063
topic: runtime
answer: B
run: typescript

What does this program print?

```typescript
const input: unknown = "5";
const n = input as number;
console.log(n + 1, typeof n);
```

- A: `6 number`
- B: `51 string`
- C: `6 string`
- D: `51 number`

> `as number` is a type assertion: it tells the compiler to treat the value as
> a number and emits nothing, so no conversion happens. `n` is still the string
> `"5"`, so `n + 1` concatenates to `"51"` and `typeof n` is `"string"`.
> Converting takes code that runs, such as `Number(input)`. An assertion from
> `unknown` needs no check at all, which is what makes it dangerous.

## typescript-intermediate-064
topic: runtime
answer: C

With `strict: true`, which check compiles and narrows `pet` to `Bird` inside the `if`?

```typescript
interface Bird { fly(): void }
interface Fish { swim(): void }
declare const pet: Bird | Fish;
```

- A: `if (pet instanceof Bird) { … }`
- B: `if (typeof pet === "Bird") { … }`
- C: `if ("fly" in pet) { … }`
- D: `if (pet.fly !== undefined) { … }`

> Interfaces are erased, so there is no `Bird` value at runtime for
> `instanceof` to test — "'Bird' only refers to a type" (A). `typeof` yields
> JavaScript's own type names such as `"object"`, never an interface's name,
> and the comparison is flagged as having no overlap (B). Reading `pet.fly` is
> an error because `Fish` has no `fly` (D). The `in` operator may be used on any
> member of the union and narrows to the members that have the property.

## typescript-intermediate-065
topic: runtime
answer: B
run: typescript

What does this program print?

```typescript
class Point {
  constructor(public x: number, public y: number) {}
}
function isPoint(v: Point): boolean {
  return v instanceof Point;
}
const literal: Point = { x: 1, y: 2 };
console.log(isPoint(literal), isPoint(new Point(1, 2)));
```

- A: `true true`
- B: `false true`
- C: `false false`
- D: It does not compile: an object literal is not a `Point`.

> Type checking is structural: the literal has `x` and `y`, so to the compiler
> it is a valid `Point`. `instanceof` is a runtime check of the prototype
> chain, and the literal was never built by the `Point` constructor, so it
> fails. A class used as a type guarantees the shape of its public members, not
> that the value is an instance of the class.

## typescript-intermediate-066
topic: runtime
answer: D
run: typescript

What does this program print?

```typescript
const stock = new Map<string, number>([["apples", 4]]);
const pears = stock.get("pears")!;
console.log(pears + 1);
```

- A: `1`
- B: It throws a `TypeError`.
- C: It does not compile: `pears` may be `undefined`.
- D: `NaN`

> `Map.get` returns `number | undefined`, and the non-null assertion `!` drops
> `undefined` from the type without checking anything. It emits no code, so
> `pears` is `undefined` at runtime, and `undefined + 1` is `NaN`. Nothing reads
> a property of `undefined`, so no `TypeError` is thrown — the bad value just
> travels on. Use `?? 0`, or a real check, when the key may be missing.

## typescript-intermediate-067
topic: runtime
answer: D
run: typescript

What does this program print?

```typescript
interface Booking {
  ref: string;
  at: Date;
}
const b: Booking = JSON.parse('{"ref":"x1","at":"2024-01-02T00:00:00Z"}');
console.log(typeof b.at, b.at instanceof Date);
```

- A: `object true`
- B: `string true`
- C: `object false`
- D: `string false`

> `JSON.parse` returns `any`, so assigning its result to `Booking` compiles
> with no check. JSON has no date type: `at` is still the ISO string, so its
> `typeof` is `"string"` and it is not a `Date`. Because the type says `Date`,
> `b.at.getTime()` would compile and then throw. Turn external data into typed
> values with code that converts and validates it (`new Date(raw.at)`), not
> with an annotation.

## typescript-intermediate-068
topic: runtime
answer: A
run: typescript

What does this program print?

```typescript
abstract class Shape {
  kind = "shape";
  abstract area(): number;
}
const AnyShape = Shape as any;
const s = new AnyShape();
console.log(s.kind, typeof s.area);
```

- A: `shape undefined`
- B: `shape function`
- C: It throws a `TypeError`: an abstract class cannot be instantiated.
- D: It does not compile: `Shape` is abstract.

> `abstract` is enforced only by the compiler. Casting the class to `any` takes
> it out of that check, and at runtime `Shape` is an ordinary class, so `new`
> works and runs the field initialiser. An abstract method is a declaration
> without a body, so nothing is emitted for it: `s.area` is `undefined`.

## typescript-intermediate-069
topic: runtime
answer: C
run: typescript

What does this program print?

```typescript
class Animal {
  speak(): string {
    return "...";
  }
}
class Dog extends Animal {
  fetch(): string {
    return "ball";
  }
}
const dogs: Dog[] = [new Dog()];
const animals: Animal[] = dogs;
animals.push(new Animal());
console.log(dogs.length, typeof dogs[1].fetch);
```

- A: `1 function`
- B: `2 function`
- C: `2 undefined`
- D: It does not compile: `Dog[]` is not assignable to `Animal[]`.

> TypeScript treats arrays as covariant: a `Dog[]` is accepted where an
> `Animal[]` is expected, even though an `Animal[]` allows pushing any
> `Animal`. `animals` and `dogs` are the same array, so the push adds a plain
> `Animal` that the `Dog[]` type does not expect, and `dogs[1].fetch` is
> `undefined`. It is a known unsoundness, kept because arrays are mostly read;
> a parameter typed `readonly Animal[]` makes that intent explicit.

## typescript-intermediate-070
topic: config
answer: D

A project has `strict: true` but sets `strictNullChecks: false`. What happens to this code?

```typescript
function findUser(id: number): { name: string } | undefined {
  return undefined;
}
const n = findUser(1).name;
```

- A: It still fails: `findUser(1)` is possibly `undefined`.
- B: It compiles, and the compiler inserts a null check before `.name`.
- C: It compiles only if the call is written `findUser(1)!.name`.
- D: It compiles, though the property read can throw at runtime.

> Without `strictNullChecks`, `null` and `undefined` belong to every type, so
> the `| undefined` in the return type adds nothing and nothing is checked
> before the property read. At runtime the read throws a `TypeError`. With the
> flag on, as `strict` sets it, the line is the error in A. TypeScript never
> inserts runtime checks.

## typescript-intermediate-071
topic: config
answer: A

With `strict: true`, what are the types of `a` and `b`, and what changes if `noUncheckedIndexedAccess` is also turned on?

```typescript
const scores: Record<string, number> = { ana: 3 };
const list = [1, 2, 3];
const a = scores["ben"];
const b = list[5];
```

- A: Both are `number`; with the flag, both become `number | undefined`.
- B: Both are already `number | undefined`; the flag changes nothing.
- C: `a` is `number | undefined` and `b` is `number`; the flag makes `b` match.
- D: Both are `number`; with the flag, only `a` becomes `number | undefined`.

> `strict` does not include `noUncheckedIndexedAccess`. Without it, a read
> through an index signature or an array index is assumed to hit, so both are
> `number` even though both are `undefined` at runtime. The flag adds
> `undefined` to every such read, for records and arrays alike; the loop
> variable of a `for…of` over `list` stays `number`.

## typescript-intermediate-072
topic: config
answer: B, D, E

With `strict: true` (which turns on `useUnknownInCatchVariables`, TypeScript 4.4 and later) and `declare function risky(): void;`, which of these compile? Select all that apply.

- A: `try { risky(); } catch (e) { console.log(e.message); }`
- B: `try { risky(); } catch (e: any) { console.log(e.message); }`
- C: `try { risky(); } catch (e: Error) { console.log(e.message); }`
- D: `try { risky(); } catch (e) { if (e instanceof Error) console.log(e.message); }`
- E: `try { risky(); } catch { console.log("failed"); }`

> Under `strict`, a catch variable is `unknown`, because anything can be thrown
> — not only `Error`s. So `e.message` needs narrowing first (D) or an explicit
> `any` (B). A catch variable may be annotated only as `any` or `unknown`,
> never `Error` (C). Leaving out the binding is valid when the error itself is
> not needed (E). With the flag off, or before TypeScript 4.4, `e` was `any`
> and A compiled.

## typescript-intermediate-073
topic: config
answer: A

With `strict: true` (so `strictPropertyInitialization` is on), which line is an error?

```typescript
class Conn {
  url: string;        // line 1
  retries = 3;        // line 2
  socket!: object;    // line 3
  label?: string;     // line 4
  constructor() {
    this.init();
  }
  init() {
    this.url = "x";
  }
}
```

- A: Line 1
- B: Line 3
- C: Line 4
- D: No line; `init()` assigns `url` before the constructor ends.

> Every property that is not optional must be assigned by an initialiser or
> directly in the constructor. The compiler does not follow the call into
> `init()` — a subclass could override it — so `url` counts as unassigned.
> `retries` has an initialiser, `label` is optional, and `socket!` is a
> definite-assignment assertion: you tell the compiler it will be assigned
> elsewhere.

## typescript-intermediate-074
topic: config
answer: C

With `isolatedModules: true` (which per-file transpilers such as esbuild, Babel and SWC rely on), what happens in `index.ts`?

```typescript
// types.ts
export interface User {
  id: number;
}
export const VERSION = 1;

// index.ts
export { User, VERSION } from "./types";
```

- A: It compiles; the compiler quietly drops `User` from the re-export.
- B: It fails: an interface cannot be re-exported from another module.
- C: It fails: re-exporting a type requires `export type` under this flag.
- D: It compiles, but `VERSION` is erased together with `User`.

> A transpiler that sees one file at a time cannot tell that `User` is only a
> type, so it would emit a re-export of a binding that does not exist at
> runtime. `isolatedModules` makes that an error: write
> `export type { User } from "./types";` for the type, or mark it inline,
> `export { type User, VERSION } from "./types";`. With the flag off, `tsc`
> sees the whole program and silently drops `User` (A).

## typescript-intermediate-075
topic: config
answer: D

A project sets `target: "ES5"` and `lib: ["ES2021", "DOM"]`, and its code calls `"a-b".replaceAll("-", "_")`. What happens?

- A: It fails: `replaceAll` does not exist on a string at the ES5 target.
- B: It compiles, and the call is rewritten as `replace` with a global regex.
- C: It fails: `lib` may not name a newer edition than the `target` does.
- D: It compiles unchanged, and works only where the runtime has `replaceAll`.

> `lib` decides which built-in APIs the compiler *believes* exist; `target`
> decides which syntax gets rewritten for older engines. TypeScript downlevels
> syntax (classes, arrow functions, spread) but never polyfills library
> methods, so the call is emitted as written. With `lib` left at the ES5
> default, A would be the result; pairing an old `target` with a newer `lib` is
> allowed, and usual when a polyfill is loaded separately.
