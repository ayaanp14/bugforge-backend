---
skill: typescript
level: intermediate
---

## typescript-intermediate-001
topic: basic-types
answer: B
run: typescript

What does this program print?

```typescript
const payload: any = { count: "4" };
const count: number = payload.count;
console.log(count + 1);
```

- A: `5`
- B: `41`
- C: `NaN`
- D: It does not compile: `string` is not assignable to `number`.

> `payload` is `any`, so `payload.count` is `any` too, and `any` is assignable
> to `number` without a check. The annotation converts nothing at runtime:
> `count` still holds the string `"4"`, and `"4" + 1` concatenates to `"41"`.
> Had `payload` been `unknown`, the assignment would be a compile error until
> the value was checked or converted.

## typescript-intermediate-002
topic: basic-types
answer: C

With `strict: true`, what is `Role`, and what happens at the last line?

```typescript
const roles = ["admin", "editor", "viewer"] as const;
type Role = (typeof roles)[number];
roles.push("guest");
```

- A: `Role` is `string`, and the `push` compiles and adds the element.
- B: `Role` is `"admin" | "editor" | "viewer"`, and the `push` compiles but throws.
- C: `Role` is `"admin" | "editor" | "viewer"`, and the `push` is a compile error.
- D: `Role` is `readonly string[]`, and the `push` is a compile error.

> `as const` makes the array a readonly tuple of literal types,
> `readonly ["admin", "editor", "viewer"]`. `typeof roles` reads the variable's
> type in a type position, and indexing it with `[number]` gives the union of
> its element types. A readonly tuple has no `push` in its type, so the call is
> an error ("Property 'push' does not exist"). It never gets as far as running;
> `as const` does not freeze anything at runtime anyway.

## typescript-intermediate-003
topic: basic-types
answer: C, D, E

With `strict: true` and `declare const v: unknown;`, which of these lines compile? Select all that apply.

- A: `v.toString();`
- B: `const s: string = v;`
- C: `const a: any = v;`
- D: `if (typeof v === "string") v.toUpperCase();`
- E: `const same = v === 5;`
- F: `const next = v + 1;`

> `unknown` accepts any value but allows almost nothing on it until it is
> narrowed. It can be assigned only to `unknown` or `any` (C) and compared with
> `===` (E), and a `typeof` check narrows it to `string` inside the `if` (D).
> Calling a method on it (A), assigning it to a `string` (B) and using it in
> arithmetic (F) are errors: "'v' is of type 'unknown'". With `any` instead,
> all six would compile.

## typescript-intermediate-004
topic: basic-types
answer: D

With `strict: true`, what return types does TypeScript infer for these two functions?

```typescript
function fail(msg: string) {
  throw new Error(msg);
}

const failFast = (msg: string) => {
  throw new Error(msg);
};
```

- A: `never` for both
- B: `void` for both
- C: `never` for `fail`, `void` for `failFast`
- D: `void` for `fail`, `never` for `failFast`

> A function expression or arrow function whose end can never be reached, and
> which has no `return`, is inferred to return `never`. A function
> *declaration* in the same situation is inferred as `void`. So a call to
> `fail(...)` does not end control flow for the compiler, and code after it is
> not narrowed. Annotate it explicitly — `function fail(msg: string): never` —
> to get that behaviour.

## typescript-intermediate-005
topic: basic-types
answer: A

With `strict: true` on TypeScript 4.9 or later, which of the two marked lines compile?

```typescript
type Palette = Record<"primary" | "accent", string | number[]>;

const annotated: Palette = { primary: "#018790", accent: [0, 84, 97] };
const checked = { primary: "#018790", accent: [0, 84, 97] } satisfies Palette;

annotated.primary.toUpperCase(); // line 1
checked.primary.toUpperCase();   // line 2
```

- A: Only line 2
- B: Only line 1
- C: Both lines
- D: Neither line

> An annotation makes `Palette` the variable's type, so `annotated.primary` is
> `string | number[]`, which has no `toUpperCase` until it is narrowed: line 1
> fails. `satisfies` checks the object against `Palette` just as strictly — a
> missing or misspelled key, or a wrong value type, is still an error — but the
> variable keeps the type inferred from the literal, so `checked.primary` is
> `string`. `as Palette` would be weaker on both counts: it checks only that
> the two types are comparable, and it gives the variable the wide type.

## typescript-intermediate-006
topic: basic-types
answer: A, C

With `strict: true`, which of these variables have the literal type `"GET"` rather than `string`? Select all that apply.

```typescript
const a = "GET";
let b = "GET";
const c = a;
let d = a;
const e = { method: a }.method;
```

- A: `a`
- B: `b`
- C: `c`
- D: `d`
- E: `e`

> A `const` initialised with a literal gets the literal type `"GET"`, and so
> does another `const` copied from it (`c`). That inferred literal type is a
> *widening* one: wherever the value lands in a mutable place — a `let` (`b`,
> `d`) or an object property (`e`) — it widens to `string`, because that place
> could later hold another string. Declaring `const a: "GET" = "GET"` would
> stop the widening, and `d` would then be `"GET"` as well.

## typescript-intermediate-007
topic: unions-narrowing
answer: C
run: typescript

What does this program print?

```typescript
type Circle = { kind: "circle"; r: number };
type Square = { kind: "square"; side: number };
type Shape = Circle | Square;

function isCircle(s: Shape): s is Circle {
  return "kind" in s;
}

function label(s: Shape): string {
  return isCircle(s) ? "circle " + s.r : "square " + s.side;
}

console.log(label({ kind: "square", side: 2 }));
```

- A: `square 2`
- B: `circle 2`
- C: `circle undefined`
- D: It does not compile: the predicate does not match the function's body.

> The compiler trusts a type predicate (`s is Circle`); it never checks that the
> body proves it. `"kind" in s` is true for every `Shape`, so `isCircle` returns
> `true` for the square, the true branch treats it as a `Circle`, and `s.r`
> reads a property the object does not have: `undefined`. A predicate is only
> as sound as its body — this one should test `s.kind === "circle"`.

## typescript-intermediate-008
topic: unions-narrowing
answer: D

With `strict: true`, what does the compiler say about this function?

```typescript
type Ev =
  | { type: "click"; x: number }
  | { type: "key"; code: string }
  | { type: "scroll"; dy: number };

function handle(e: Ev): string {
  switch (e.type) {
    case "click":
      return "c";
    case "key":
      return "k";
    default: {
      const unreachable: never = e;
      return unreachable;
    }
  }
}
```

- A: Nothing: the `default` branch is unreachable, so the `never` line is ignored.
- B: Nothing, but `handle` throws at runtime when it is given a scroll event.
- C: An error: "Function lacks ending return statement".
- D: An error at the `never` line: the scroll member is not assignable to `never`.

> After the `"click"` and `"key"` cases, `e` is narrowed to the one member left,
> `{ type: "scroll"; dy: number }`. Only `never` is assignable to `never`, so
> the assignment fails and the message names the case that was forgotten. That
> is the point of the pattern: add a `"scroll"` case and `e` becomes `never` in
> `default`, and the function compiles. Every path returns, so there is no
> missing-return error.

## typescript-intermediate-009
topic: unions-narrowing
answer: A
run: typescript

What does this program print?

```typescript
function fmt(v: string | number | undefined): string {
  if (!v) return "empty";
  return typeof v === "number" ? "n" + v : "s" + v;
}

console.log(fmt(0), fmt(""), fmt("0"));
```

- A: `empty empty s0`
- B: `n0 s s0`
- C: `n0 empty s0`
- D: `empty s s0`

> `!v` is true for every falsy value, not only `undefined`: the number `0` and
> the empty string `""` both take the `"empty"` branch. Truthiness narrowing
> removes `undefined` from the type, but it throws away real values with it.
> `"0"` is a non-empty string, so it is truthy and prints `s0`. To treat only a
> missing value as empty, test `v === undefined`.

## typescript-intermediate-010
topic: unions-narrowing
answer: A

With `strict: true`, which statement about these two functions is true?

```typescript
function isText(v: unknown): v is string {
  return typeof v === "string";
}

function assertText(v: unknown): asserts v is string {
  if (typeof v !== "string") throw new TypeError("expected text");
}
```

- A: `isText` narrows only where its result is tested; a bare `assertText(x);` narrows `x` from then on.
- B: Both narrow `x` for the rest of the scope after a bare call, whether or not anything uses the result.
- C: Neither narrows on its own; a caller still has to write `x as string` after calling either of them.
- D: The compiler checks both bodies and rejects any predicate that the body does not actually prove.

> A type predicate (`v is string`) is a boolean return value: narrowing happens
> where that boolean is tested — an `if`, a ternary, a `filter` callback. An
> assertion signature (`asserts v is string`) returns nothing; the compiler
> assumes that if the call returns at all, the condition held, so everything
> after the call sees `string`. Neither body is checked against its signature,
> which is why such functions need care.

## typescript-intermediate-011
topic: unions-narrowing
answer: B

With `strict: true`, which line does not compile?

```typescript
interface Box {
  value: string | null;
}

function widths(b: Box, items: number[]) {
  if (b.value !== null) {
    const n = b.value.length;                      // line 1
    return items.map((i) => i + b.value.length);   // line 2
  }
  return [];                                       // line 3
}
```

- A: Line 1: `b.value` is possibly `null`.
- B: Line 2: `b.value` is possibly `null`.
- C: Line 3: `never[]` does not match the other return.
- D: No line; the check covers the whole `if` block.

> Narrowing of a property access such as `b.value` is not carried into a
> callback: the compiler cannot know when, or how often, `map` will call the
> arrow, and by then something could have set `b.value` back to `null`. Line 1
> runs straight after the check, so it is narrowed. The usual fix is to copy the
> value first — `const v = b.value;` — because a `const` cannot change, and its
> narrowing does reach the callback. Returning `[]` on the other path is fine.

## typescript-intermediate-012
topic: unions-narrowing
answer: B

With `strict: true`, what is the type of `u` in each branch?

```typescript
type Admin = { role: "admin"; permissions: string[] };
type Member = { role: "member"; permissions?: string[] };

function check(u: Admin | Member) {
  if ("permissions" in u) {
    // here?
  } else {
    // and here?
  }
}
```

- A: `Admin` in the `if` branch, `Member` in the `else` branch
- B: `Admin | Member` in the `if` branch, `Member` in the `else` branch
- C: `Admin` in the `if` branch, `Admin | Member` in the `else` branch
- D: `Admin | Member` in both branches

> In the true branch, `in` keeps every member that has the property, whether
> required *or optional* — a `Member` that happens to carry `permissions` is
> still possible. In the false branch it removes the members where the property
> is required: an `Admin` always has `permissions`, so only `Member` is left. To
> pick out admins reliably, test the discriminant: `u.role === "admin"`.

## typescript-intermediate-013
topic: unions-narrowing
answer: A
run: typescript

What does this program print?

```typescript
type Kind = "a" | "b";

function code(k: Kind): number {
  switch (k) {
    case "a":
      return 1;
    case "b":
      return 2;
  }
}

const fromServer: Kind = JSON.parse('"c"');
console.log(code(fromServer));
```

- A: `undefined`
- B: `0`
- C: It throws a `TypeError`.
- D: It does not compile: `code` lacks an ending return statement.

> The `switch` covers every member of `Kind`, so the compiler accepts that the
> function always returns and needs no final `return`. But `JSON.parse` returns
> `any`, so `"c"` reaches `code` unchecked: no case matches, the function runs
> off its end and returns `undefined`. Types describe what the code expects;
> they do not validate data at runtime. A `default` branch that throws would
> have caught it.

## typescript-intermediate-014
topic: interfaces-aliases
answer: C

With `strict: true`, what happens?

```typescript
interface Settings {
  theme: string;
}
interface Settings {
  fontSize: number;
}

const s: Settings = { theme: "dark" };
```

- A: It compiles; the second declaration replaces the first.
- B: It fails: "Duplicate identifier 'Settings'".
- C: It fails: `fontSize` is missing, because the declarations merge.
- D: It compiles; `fontSize` is optional since only one declaration has it.

> Interfaces with the same name in the same scope merge into one, so
> `Settings` requires both `theme` and `fontSize`, and the object lacks
> `fontSize`. This is how code adds members to a type declared elsewhere, such
> as a library's global types. Two `type Settings = …` aliases would be the
> "Duplicate identifier" error instead.

## typescript-intermediate-015
topic: interfaces-aliases
answer: B, C, E

Which statements about `interface` and `type` aliases are true? Select all that apply.

- A: An interface can `extends` a type alias that names a union of object types.
- B: An interface can be reopened by declaring it again; a type alias cannot be declared twice.
- C: A type alias can name a union, a tuple or a primitive; an interface cannot.
- D: An interface exists in the emitted JavaScript; a type alias is erased.
- E: A class can `implements` a type alias that names an object type.

> Interfaces merge when redeclared (B); a second `type` with the same name is a
> "Duplicate identifier" error. Only an alias can name a union, a tuple or a
> primitive (C). `implements` checks the class against any object type, alias
> or interface (E). An interface may extend only object types whose members are
> statically known, so extending a union alias is an error (A). And both are
> erased: neither emits any JavaScript (D).

## typescript-intermediate-016
topic: interfaces-aliases
answer: A
run: typescript

What does this program print?

```typescript
interface Point {
  readonly x: number;
  readonly y: number;
}
const raw = { x: 1, y: 2 };
const p: Point = raw;
raw.x = 10;
console.log(p.x + p.y);
```

- A: `12`
- B: `3`
- C: It does not compile: `x` is a read-only property.
- D: It throws a `TypeError` when `raw.x` is assigned.

> `readonly` only stops writes made *through that type*. A mutable object is
> assignable to a type with `readonly` properties, so `p` and `raw` are the same
> object seen through two types. `raw.x = 10` writes through the mutable one,
> which is allowed, and it changes what `p.x` reads: `10 + 2`. Nothing is
> frozen at runtime — that would take `Object.freeze`.

## typescript-intermediate-017
topic: interfaces-aliases
answer: B, D, E

With `strict: true`, which of these declarations compile? Select all that apply.

```typescript
interface Options {
  verbose?: boolean;
  depth?: number;
}
const extra = { verbose: true, color: "red" };
const colorOnly = { color: "red" };
```

- A: `const a: Options = { verbose: true, color: "red" };`
- B: `const b: Options = extra;`
- C: `const c: Options = colorOnly;`
- D: `const d: Options = { verbose: true, color: "red" } as Options;`
- E: `const e: Options = {};`

> Excess property checking applies only to a fresh object literal assigned
> straight to a type, so `color` is flagged in A. The same object held in a
> variable (B) is checked structurally, and extra properties are allowed. C
> fails for another reason: every property of `Options` is optional (a "weak
> type"), and an object that shares none of them is rejected even from a
> variable. A type assertion skips the excess-property check (D), and `{}`
> satisfies a type whose properties are all optional (E).

## typescript-intermediate-018
topic: interfaces-aliases
answer: A

With `strict: true`, what does the compiler report?

```typescript
interface Scores {
  [player: string]: number;
  total: number;
  label: string;
}
```

- A: An error on `label`: `string` is not assignable to the index type `number`.
- B: An error on `total`: a named property cannot sit beside an index signature.
- C: An error on the index signature: it must follow the named properties.
- D: No error: named properties take precedence over the index signature.

> A `string` index signature promises that *every* string key gives a `number`
> — including `"total"` and `"label"`. So every named property must be
> assignable to the index type: `total: number` is fine, `label: string` is
> not. Widen the index type to `number | string`, or move the per-player
> scores into their own property, such as `players: Record<string, number>`.

## typescript-intermediate-019
topic: interfaces-aliases
answer: C

With `strict: true`, what is `Id`?

```typescript
type A = { id: string; name: string };
type B = { id: number };
type C = A & B;
type Id = C["id"];
```

- A: `string | number`
- B: `string`
- C: `never`
- D: A compile error at `type C`

> An intersection has every property of both sides, and a property on both
> sides has *both* types: `id` is `string & number`, which no value can be, so
> it reduces to `never`. Intersecting incompatible types is not an error in
> itself — the type just becomes impossible to satisfy. `interface C extends A,
> B {}` would instead report the conflict at the declaration.

## typescript-intermediate-020
topic: interfaces-aliases
answer: D
run: typescript

What does this program print?

```typescript
interface Draft {
  title: string;
  note?: string;
}
const d1: Draft = { title: "a" };
const d2: Draft = { title: "b", note: undefined };
console.log("note" in d1, "note" in d2, Object.keys(d2).length);
```

- A: `false false 1`
- B: `false true 1`
- C: `true true 2`
- D: `false true 2`

> An optional property may be *absent* or *present with the value
> `undefined`*, and without `exactOptionalPropertyTypes` the type does not tell
> the two apart. `d1` has no `note` key, so `in` is false; `d2` has the key with
> an `undefined` value, so `in` is true and `Object.keys` lists both `title`
> and `note`. The difference shows up in `in` checks, `Object.keys`, spreading
> over defaults and `JSON.stringify`.

## typescript-intermediate-021
topic: functions
answer: B

With `strict: true`, what happens at the last line?

```typescript
function len(x: string): number;
function len(x: unknown[]): number;
function len(x: string | unknown[]): number {
  return x.length;
}

declare const v: string | number[];
len(v);
```

- A: It compiles, because the implementation accepts `string | unknown[]`.
- B: It fails, because no overload accepts a `string | number[]` argument.
- C: It compiles, and the call's result is typed `any`.
- D: It fails, because the implementation does not match the overloads.

> Callers see only the overload signatures; the implementation's own signature
> is hidden. Each overload is tried by itself, and neither accepts the union:
> the first takes only `string`, the second only arrays. Add a third overload,
> `(x: string | unknown[]): number`, or drop the overloads and keep the single
> union signature.

## typescript-intermediate-022
topic: functions
answer: D

With `strict: true`, what is the type of `r`, and what value does it hold when the program runs?

```typescript
function kind(x: unknown): "unknown";
function kind(x: string): "string";
function kind(x: unknown): "unknown" | "string" {
  return typeof x === "string" ? "string" : "unknown";
}

const r = kind("hi");
```

- A: Type `"string"`, value `"string"`
- B: Type `"unknown"`, value `"unknown"`
- C: Type `"unknown" | "string"`, value `"string"`
- D: Type `"unknown"`, value `"string"`

> Overloads are tried in the order they are written, and the first that accepts
> the arguments wins. `"hi"` is assignable to `unknown`, so the first overload
> matches and `r` is typed `"unknown"` — the `string` overload can never be
> chosen. At runtime only the implementation exists, and it returns
> `"string"`. Write the more specific overload first.

## typescript-intermediate-023
topic: functions
answer: C

With `strict: true` (so `strictFunctionTypes` is on), which assignment is an error?

```typescript
interface Animal { name: string }
interface Dog extends Animal { bark(): string }

interface MethodStyle { handle(a: Animal): void }
interface PropertyStyle { handle: (a: Animal) => void }

const dogOnly = (d: Dog) => { d.bark(); };
const x: MethodStyle = { handle: dogOnly };
const y: PropertyStyle = { handle: dogOnly };
```

- A: Both are errors.
- B: Only `x` is an error.
- C: Only `y` is an error.
- D: Neither is an error.

> `dogOnly` needs a `Dog`, but `handle` promises to accept any `Animal`, and a
> plain `Animal` would crash on `bark()`. `strictFunctionTypes` checks
> parameters contravariantly, but only for properties of function type;
> members written in method syntax stay bivariant (which keeps types such as
> `Array<T>` usable). So `y` is rejected and `x` slips through.

## typescript-intermediate-024
topic: functions
answer: B
run: typescript

What does this program print?

```typescript
type Logger = (msg: string) => void;
const lines: string[] = [];
const log: Logger = (msg) => lines.push(msg);
const result = log("a");
console.log(typeof result, result);
```

- A: `undefined undefined`
- B: `number 1`
- C: `number 0`
- D: It does not compile: `number` is not assignable to `void`.

> A function type that returns `void` accepts a function that returns
> something: the caller only promises not to use the result. So
> `(msg) => lines.push(msg)` is a valid `Logger`, even though `push` returns
> the new length. The compiler types `result` as `void`, but nothing changes at
> runtime: the arrow still returns `push`'s result, `1`. (A function declared
> with a `: void` return type that returns a value *is* an error; the leniency
> is for assigning functions to a `void`-returning type.)

## typescript-intermediate-025
topic: functions
answer: D

With `strict: true`, what happens?

```typescript
interface Counter {
  count: number;
  inc(this: Counter): void;
}
const c: Counter = {
  count: 0,
  inc() {
    this.count++;
  },
};
const inc = c.inc;
inc();
```

- A: It compiles, and `inc()` throws at runtime.
- B: It fails at `const inc = c.inc`: a method cannot be detached.
- C: It compiles, and `inc()` increments `c.count`.
- D: It fails at `inc()`: a `this` of type `void` is not a `Counter`.

> A `this` parameter declares what `this` must be when the function is called.
> Reading the method into a variable is allowed, but calling it bare supplies
> `this: void`, which is not a `Counter`, so the call is rejected — the classic
> lost-`this` bug caught at compile time. `c.inc()` and `inc.call(c)` both
> compile.
