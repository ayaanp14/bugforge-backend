---
skill: typescript
level: intermediate
---

## typescript-intermediate-026
topic: functions
answer: A, B, E

With `strict: true`, which of these can be assigned to a variable of type `Handler`? Select all that apply.

```typescript
type Handler = (event: string, payload: number, ts: number) => void;
```

- A: `() => {}`
- B: `(event) => console.log(event.length)`
- C: `(event: string, payload: string) => {}`
- D: `(e: string, p: number, t: number, retry: boolean) => {}`
- E: `(e: string, p: number, t: number, retry?: boolean) => {}`

> A function that takes *fewer* parameters is assignable, since JavaScript
> ignores extra arguments — which is why `arr.forEach((x) => …)` works (A, and
> B, whose `event` is typed `string` from context). Each parameter it does take
> must accept what the caller passes, so `payload: string` fails against
> `number` (C). A function that *requires* more parameters than the caller
> supplies is rejected (D); an extra optional one is fine (E).

## typescript-intermediate-027
topic: functions
answer: A
run: typescript

What does this program print?

```typescript
function tagFor(this: { tag: string }, prefix: string): string {
  return prefix + this.tag;
}
const box = { tag: "box", tagFor };
console.log(box.tagFor("a:"), tagFor.length);
```

- A: `a:box 1`
- B: `a:box 2`
- C: `a:undefined 1`
- D: It does not compile: `tagFor` is called without a `this` argument.

> `this: { tag: string }` is not a real parameter: it only tells the compiler
> what `this` must be at a call, and it is erased from the output. The emitted
> function has one parameter, `prefix`, so `tagFor.length` is `1`. The call
> `box.tagFor("a:")` passes `box` as `this`, which has a `tag`, so it compiles
> and returns `"a:box"`.

## typescript-intermediate-028
topic: classes
answer: A
run: typescript

What does this program print?

```typescript
class Account {
  constructor(public owner: string, private balance: number, readonly id = 7) {}
}
const acc = new Account("ana", 30);
console.log(Object.keys(acc).join(","));
```

- A: `owner,balance,id`
- B: `owner`
- C: `owner,id`
- D: It does not compile: `balance` is declared but never read.

> A constructor parameter marked `public`, `private`, `protected` or `readonly`
> is a *parameter property*: TypeScript declares the field and assigns it at
> the start of the constructor. The modifiers are compile-time only, so all
> three become ordinary own properties, created in parameter order, and `id`
> takes its default `7`. An unread private member is reported only under
> `noUnusedLocals`, which `strict` does not include.

## typescript-intermediate-029
topic: classes
answer: B
run: typescript

What does this program print?

```typescript
class Vault {
  private secret = "k1";
  reveal(): string {
    return this.secret;
  }
}
const v = new Vault();
v["secret"] = "k2";
console.log(v.reveal(), JSON.stringify(v));
```

- A: `k1 {}`
- B: `k2 {"secret":"k2"}`
- C: `k1 {"secret":"k1"}`
- D: It does not compile: `secret` is private.

> `private` is checked only at compile time, and bracket access with a string
> literal is a deliberate escape hatch the checker allows — `v.secret = "k2"`
> would be an error, `v["secret"] = "k2"` is not. At runtime `secret` is an
> ordinary property: the write changes what `reveal` returns, and
> `JSON.stringify` includes it. For privacy that holds at runtime, use an
> ECMAScript `#secret` field.

## typescript-intermediate-030
topic: classes
answer: A, C, D

Which statements about abstract classes are true with `strict: true`? Select all that apply.

- A: Calling `new` on an abstract class is a compile error.
- B: An abstract method may have a body, which subclasses inherit unless they override it.
- C: A non-abstract subclass must implement every abstract member, or it does not compile.
- D: An abstract class can have a constructor and ordinary methods with bodies.
- E: An abstract class is erased from the emitted JavaScript, like an interface.

> An abstract class is a partly built base class: it may have a constructor,
> fields and finished methods (D), cannot itself be instantiated (A), and forces
> each concrete subclass to supply every abstract member (C). An abstract method
> is a signature only; giving it a body is an error — "cannot have an
> implementation because it is marked abstract" (B). Unlike an interface, the
> class is emitted as an ordinary JavaScript class; only the `abstract` checks
> disappear (E).

## typescript-intermediate-031
topic: classes
answer: A
run: typescript

What does this program print?

```typescript
abstract class Exporter {
  run(): string {
    return this.header() + "/" + this.body();
  }
  protected header(): string {
    return "R";
  }
  protected abstract body(): string;
}

class CsvExporter extends Exporter {
  protected header(): string {
    return "S";
  }
  protected body(): string {
    return "b" + super.header();
  }
}

console.log(new CsvExporter().run());
```

- A: `S/bR`
- B: `R/bR`
- C: `S/bS`
- D: `R/bS`

> `run` is inherited, but `this` is the `CsvExporter` instance, so
> `this.header()` dispatches to the override and gives `"S"`, and `this.body()`
> runs the subclass's `body`. Inside it, `super.header()` explicitly calls the
> base implementation, `"R"`. The abstract `body` is only a compile-time
> contract, and `protected` members can be called from the class and its
> subclasses.

## typescript-intermediate-032
topic: classes
answer: C

With `strict: true`, which line is an error?

```typescript
class Base {
  protected count = 0;
}

class Child extends Base {
  bump(sibling: Child, other: Base) {
    this.count++;     // line 1
    sibling.count++;  // line 2
    other.count++;    // line 3
  }
}
```

- A: Line 1
- B: Line 2
- C: Line 3
- D: No line; all three compile.

> A protected member is visible inside subclasses, but only through an instance
> of the accessing class (or a subclass of it). `Child` may touch `count` on
> itself and on another `Child`, but not through a `Base` reference — that
> object might be some other subclass of `Base`. The error reads "Property
> 'count' is protected and only accessible through an instance of class
> 'Child'".

## typescript-intermediate-033
topic: classes
answer: A

With `strict: true`, what happens?

```typescript
interface Handler {
  handle(input: string): number;
}

class Upper implements Handler {
  handle(input) {
    return input.length;
  }
}
```

- A: It fails: parameter `input` implicitly has an `any` type.
- B: It compiles: `input` is typed `string` from the interface.
- C: It compiles: `input` is typed `unknown` until it is checked.
- D: It fails: `Upper` incorrectly implements the interface `Handler`.

> `implements` only checks the finished class against the interface; it does
> not feed types into the class body. So `input` gets its type from nowhere,
> and under `noImplicitAny` (part of `strict`) that is an error. Without
> `noImplicitAny`, `input` would be `any` and the class would satisfy
> `Handler`. Annotate the parameter: `handle(input: string)`.

## typescript-intermediate-034
topic: classes
answer: B

With `strict: true`, what happens at the last line?

```typescript
class Ticket {
  private id = 1;
}
class Coupon {
  private id = 1;
}

const t: Ticket = new Coupon();
```

- A: It compiles, because the two classes have the same shape.
- B: It fails, because the private `id` fields come from separate declarations.
- C: It fails, because an instance can only be assigned to its own class type.
- D: It compiles, but `t instanceof Ticket` is then a compile error.

> Classes are compared structurally, so with public `id` fields this would
> compile. A `private` or `protected` member, though, is compatible only with
> the same declaration of it — that is, when one class inherits it from the
> other. C overstates it: any object with the right public shape can be
> assigned to a class type that has no private or protected members.

## typescript-intermediate-035
topic: generics
answer: C

With `strict: true`, what is the type of `v`, and what happens at the last line?

```typescript
function get<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { id: 1, name: "ana", admin: false };
const v = get(user, "name");
get(user, "email");
```

- A: `v` is `string | number | boolean`, and the last line is an error.
- B: `v` is `string`, and the last line compiles and returns `undefined`.
- C: `v` is `string`, and the last line is an error.
- D: `v` is `any`, and the last line compiles.

> `K extends keyof T` limits `key` to `"id" | "name" | "admin"`, and `K` is
> inferred as the literal `"name"`, so the indexed access type `T[K]` is
> `string` — not the union of every property's type, which is what `T[keyof T]`
> would give. `"email"` is not a key of `T`, so it is rejected at compile time.

## typescript-intermediate-036
topic: generics
answer: D
run: typescript

What does this program print?

```typescript
function parse<T = number>(json: string): T {
  return JSON.parse(json);
}
const x = parse<number>('"5"');
console.log(typeof x, x + 1);
```

- A: `number 6`
- B: `number 51`
- C: `string 6`
- D: `string 51`

> A type argument is a promise to the compiler, not a conversion. `JSON.parse`
> returns `any`, so returning it as `T` compiles, and `x` is typed `number` —
> but the value parsed from `'"5"'` is the string `"5"`. Types are erased, so
> `typeof x` is `"string"`, and `x + 1` concatenates.

## typescript-intermediate-037
topic: generics
answer: C

With `strict: true`, what happens?

```typescript
function pair<T>(a: T, b: T): T[] {
  return [a, b];
}

pair(1, "a");
```

- A: It compiles, and `T` is inferred as `string | number`.
- B: It compiles, and `T` is inferred as `unknown`.
- C: It fails: the argument `"a"` is not assignable to `number`.
- D: It fails: the type argument for `T` must be written out.

> When the candidates for `T` conflict and neither is a supertype of the other,
> TypeScript does not invent a union: it fixes `T` from the first candidate,
> `number`, and reports the second argument. Writing
> `pair<string | number>(1, "a")` states the union and compiles.

## typescript-intermediate-038
topic: generics
answer: D

With `strict: true`, what happens at the last line?

```typescript
function make<T, U = string>(a: T, b: U): [T, U] {
  return [a, b];
}

make<number>(1, 2);
```

- A: It compiles; `U` is inferred as `number` from the second argument.
- B: It fails: "Expected 2 type arguments, but got 1".
- C: It compiles; `U` becomes `unknown` because it was not given.
- D: It fails: `2` is not assignable to `string`, the default for `U`.

> Type arguments are either all inferred or all written: once you supply any of
> them, the rest are not inferred but take their defaults. `U` is `string`, so
> the argument `2` is rejected. Because `U` has a default, supplying only one
> type argument is allowed (so not B), and `make(1, 2)` with none at all would
> infer both.

## typescript-intermediate-039
topic: generics
answer: B

With `strict: true`, why does this not compile?

```typescript
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : { length: 0 };
}
```

- A: `length` cannot be read from a value whose type is a type parameter.
- B: `{ length: 0 }` fits the constraint, but `T` may be a narrower type.
- C: A generic function may not return a value of its own type parameter.
- D: The constraint has to be an interface, not an object type literal.

> The constraint says what every `T` has, not what `T` is. A caller may pick
> `T = string` or `T = number[]`, and the function then promises to return that
> exact type — a bare `{ length: 0 }` is neither. Reading `length` is fine,
> because the constraint guarantees it. The message reads "'{ length: number;
> }' is assignable to the constraint of type 'T', but 'T' could be instantiated
> with a different subtype".

## typescript-intermediate-040
topic: generics
answer: D

With `strict: true` on TypeScript 5.0 or later, what is the type of `r`?

```typescript
function routes<const T extends readonly string[]>(paths: T): T {
  return paths;
}

const r = routes(["/a", "/b"]);
```

- A: `string[]`
- B: `readonly string[]`
- C: `("/a" | "/b")[]`
- D: `readonly ["/a", "/b"]`

> A `const` type parameter (added in TypeScript 5.0) makes inference treat the
> argument as if it had been written with `as const`, so `T` is the readonly
> tuple of literal types. Without the `const` modifier, the same call infers
> `string[]`. It saves every caller from writing `as const` themselves.

## typescript-intermediate-041
topic: generics
answer: A
run: typescript

What does this program print?

```typescript
class Registry<T> {
  static count = 0;
  private items: T[] = [];
  add(item: T): number {
    Registry.count++;
    this.items.push(item);
    return this.items.length;
  }
}

const words = new Registry<string>();
const nums = new Registry<number>();
words.add("x");
words.add("y");
console.log(nums.add(1), Registry.count);
```

- A: `1 3`
- B: `1 1`
- C: `3 3`
- D: It does not compile: a generic class cannot have a static member.

> Type arguments are erased: `Registry<string>` and `Registry<number>` are one
> class at runtime, with one `count` shared by every instance. Each instance
> has its own `items`, so `nums.add(1)` returns `1`, while `count` has seen
> three calls. That sharing is why a static member may not mention the class's
> type parameter `T`.

## typescript-intermediate-042
topic: utility-types
answer: A
run: typescript

What does this program print?

```typescript
interface Team {
  title: string;
  members: string[];
}
const team: Readonly<Team> = { title: "core", members: ["a"] };
team.members.push("b");
console.log(team.members.length);
```

- A: `2`
- B: `1`
- C: It does not compile: `members` is a read-only property.
- D: It throws a `TypeError`, because the array is frozen.

> `Readonly<T>` is shallow: it marks each property `readonly`, which forbids
> `team.members = …`, but `members` is still a `string[]`, and calling `push`
> on it is not an assignment to the property. Nothing is frozen at runtime
> either. For an array that cannot be changed through the type, declare the
> property as `readonly string[]`, whose type has no `push`.

## typescript-intermediate-043
topic: utility-types
answer: B

With `strict: true`, what is `M`?

```typescript
type Opts = { a?: number; readonly b: string };
type M = { -readonly [K in keyof Opts]-?: Opts[K] };
```

- A: `{ a?: number; b: string }`
- B: `{ a: number; b: string }`
- C: `{ a: number | undefined; readonly b: string }`
- D: `{ readonly a: number; readonly b: string }`

> A mapped type over `keyof Opts` keeps each property's modifiers unless told
> otherwise. `-readonly` removes `readonly`, and `-?` removes the optional
> marker — and with it the `undefined` that being optional had added, so `a` is
> plain `number`. This is how the library's `Required<T>` is defined (with
> `-?`); a hand-written `Mutable<T>` uses `-readonly`.

## typescript-intermediate-044
topic: utility-types
answer: D

With `strict: true`, what happens at the last line?

```typescript
type Shape =
  | { kind: "circle"; r: number; id: string }
  | { kind: "square"; side: number; id: string };

type NoId = Omit<Shape, "id">;
const s: NoId = { kind: "circle", r: 1 };
```

- A: It compiles; `NoId` is a union of the two shapes without `id`.
- B: It fails: property `side` is missing from the object.
- C: It compiles, but `NoId` has collapsed to `never`.
- D: It fails: `r` does not exist in type `NoId`.

> `Omit` does not distribute over a union. It works from `keyof Shape`, and the
> keys of a union are only those every member has: `"kind" | "id"`. So `NoId`
> is `{ kind: "circle" | "square" }`, and `r` is an excess property. To omit
> from each member separately, distribute it yourself:
> `type DistOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;`.

## typescript-intermediate-045
topic: utility-types
answer: C

With `strict: true` and `type Lang = "en" | "fr" | "de";`, which declaration compiles?

- A: `const a: Record<Lang, string> = { en: "Hi", fr: "Salut" };`
- B: `const b: Record<Lang, string> = { en: "Hi", fr: "Salut", de: "Hallo", es: "Hola" };`
- C: `const c: Partial<Record<Lang, string>> = { en: "Hi" };`
- D: `const d: Record<Lang, number> = { en: 1, fr: 2, de: "3" };`

> `Record` over a union of literal keys is an object type with every one of
> them: `{ en: string; fr: string; de: string }`. Each key is required (A
> misses `de`), and a fresh literal may not add others (B adds `es`).
> `Partial` makes the keys optional, so C compiles. D gives `de` a string where
> the record holds numbers.

## typescript-intermediate-046
topic: utility-types
answer: C

With `strict: true`, what are `Busy` and `Settled`?

```typescript
type State = "idle" | "loading" | "done" | "error" | null;
type Busy = Extract<State, "loading" | "saving">;
type Settled = NonNullable<Exclude<State, "idle" | "loading">>;
```

- A: `Busy` is `"loading" | "saving"`; `Settled` is `"done" | "error"`.
- B: `Busy` is `"loading"`; `Settled` is `"done" | "error" | null`.
- C: `Busy` is `"loading"`; `Settled` is `"done" | "error"`.
- D: `Busy` is `"saving"`; `Settled` is `"done" | "error"`.

> `Extract<T, U>` keeps the members of `T` that are assignable to `U`;
> `"saving"` is not in `State`, so only `"loading"` survives. `Exclude` drops
> `"idle"` and `"loading"`, leaving `"done" | "error" | null`, and
> `NonNullable` then removes `null` (and would remove `undefined`). Both filter
> the first argument; neither adds members from the second.

## typescript-intermediate-047
topic: utility-types
answer: B

With `strict: true`, what is `P`?

```typescript
async function load(id: number, opts?: { cache: boolean }) {
  return { id, label: "x" };
}

type P = Parameters<typeof load>[1];
```

- A: `{ cache: boolean }`
- B: `{ cache: boolean } | undefined`
- C: `[opts?: { cache: boolean }]`
- D: `number`

> `Parameters<F>` is the tuple of `F`'s parameter types,
> `[id: number, opts?: { cache: boolean }]`. Index `1` reads its second
> element, and reading an optional tuple element includes `undefined`.
> `typeof load` is needed because `Parameters` takes a type, not a value.

## typescript-intermediate-048
topic: utility-types
answer: B
run: typescript

What does this program print?

```typescript
interface Config {
  host: string;
  port: number;
  debug: boolean;
}
const defaults: Config = { host: "localhost", port: 80, debug: false };

function withOverrides(o: Partial<Config>): Config {
  return { ...defaults, ...o };
}

console.log(JSON.stringify(withOverrides({ port: undefined, debug: true })));
```

- A: `{"host":"localhost","port":80,"debug":true}`
- B: `{"host":"localhost","debug":true}`
- C: `{"host":"localhost","port":null,"debug":true}`
- D: It does not compile: `undefined` is not assignable to `number`.

> Without `exactOptionalPropertyTypes`, `Partial<Config>` lets each property be
> absent *or* explicitly `undefined`. Spreading copies an own property even
> when its value is `undefined`, so `port: undefined` overwrites the default
> `80`, and `JSON.stringify` leaves out properties whose value is `undefined`.
> The compiler still types the result as `Config`, with `port: number`. Under
> `exactOptionalPropertyTypes`, passing `port: undefined` would be the compile
> error in D.

## typescript-intermediate-049
topic: advanced-types
answer: D

With `strict: true`, what are `A` and `B`?

```typescript
type ToArray<T> = T extends unknown ? T[] : never;
type ToArrayWhole<T> = [T] extends [unknown] ? T[] : never;

type A = ToArray<string | number>;
type B = ToArrayWhole<string | number>;
```

- A: `A` is `(string | number)[]`; `B` is `string[] | number[]`.
- B: Both are `string[] | number[]`.
- C: Both are `(string | number)[]`.
- D: `A` is `string[] | number[]`; `B` is `(string | number)[]`.

> A conditional type whose checked type is a bare type parameter distributes
> over a union: `ToArray` is applied to `string` and to `number` separately,
> and the results are joined. Wrapping both sides in a one-element tuple,
> `[T] extends [unknown]`, means the checked type is no longer a bare
> parameter, so the union is tested as a whole.

## typescript-intermediate-050
topic: advanced-types
answer: C

With `strict: true`, which of these types is `{ id: number; active: boolean }`?

```typescript
async function fetchUser(id: number) {
  return { id, active: true };
}
```

- A: `ReturnType<typeof fetchUser>`
- B: `typeof fetchUser extends (...args: any[]) => infer R ? R : never`
- C: `ReturnType<typeof fetchUser> extends Promise<infer V> ? V : never`
- D: `Awaited<typeof fetchUser>`

> An `async` function returns a `Promise`, so its return type — read with
> `ReturnType` (A) or with your own `infer R` over the function type (B) — is
> `Promise<{ id: number; active: boolean }>`. Matching that against
> `Promise<infer V>` binds `V` to the resolved value. `Awaited` unwraps
> promises, but given the function type itself (D) there is nothing to unwrap,
> and it returns the function type unchanged; `Awaited<ReturnType<typeof
> fetchUser>>` is the library's way to write C.
