---
skill: typescript
level: basic
---

## typescript-basic-001
topic: basic-types
answer: D

With `strict: true`, what types does TypeScript infer for `n` and `m`?

```typescript
const n = 10;
let m = 10;
```

- A: `number` and `number`
- B: `10` and `10`
- C: `number` and `10`
- D: `10` and `number`

> A `const` can never hold anything else, so TypeScript keeps the literal type `10`. A `let` can be reassigned later, so its literal is widened to `number`; otherwise `m = 11` would be an error. The setting does not matter here: this widening works the same with or without `strict`.

## typescript-basic-002
topic: basic-types
answer: B
run: typescript

What does this program print?

```typescript
const settings = { theme: "dark", size: 12 };
settings.theme = "light";
settings.size += 2;
console.log(settings.theme + " " + settings.size);
```

- A: `dark 12`
- B: `light 14`
- C: It does not compile: `settings` is declared with `const`.
- D: It throws a `TypeError`: `settings` is constant.

> `const` stops the variable `settings` being pointed at another object; it does not freeze the object. The properties are also widened when the object is inferred: `theme` is `string`, not the literal `"dark"`, and `size` is `number`, so both assignments compile and run.

## typescript-basic-003
topic: basic-types
answer: A
run: typescript

What does this program print?

```typescript
const count: number = 7;
const groups: number = 2;
const perGroup = count / groups;
console.log(perGroup);
```

- A: `3.5`
- B: `3`
- C: `4`
- D: It does not compile: the result needs a `float` type.

> TypeScript has one `number` type for integers and fractions alike (JavaScript's 64-bit floating point), and `/` is ordinary division. There is no integer division to truncate the result and no separate `float` or `int` type.

## typescript-basic-004
topic: basic-types
answer: C
run: typescript

What does this program print?

```typescript
const qty: string = "4";
const extra: number = 2;
console.log(qty + extra);
```

- A: `6`
- B: `NaN`
- C: `42`
- D: It does not compile: `+` needs two operands of the same type.

> TypeScript allows `+` between a `string` and a `number`, and types the result as `string`, because that is what JavaScript does: the number is converted and the two are concatenated. The annotations change nothing at runtime. (`qty * extra` would be a compile error: arithmetic operators other than `+` refuse a `string`.)

## typescript-basic-005
topic: basic-types
answer: B, D

With `strict: true`, which lines are compile errors? Select all that apply.

```typescript
let a: any = "hello";
let u: unknown = "hello";

a.toUpperCase();        // line 1
u.toUpperCase();        // line 2
const s1: string = a;   // line 3
const s2: string = u;   // line 4
```

- A: line 1
- B: line 2
- C: line 3
- D: line 4

> `any` switches checking off: you may call anything on it and assign it to anything, so lines 1 and 3 compile. `unknown` is the safe counterpart: you may not call methods on it or assign it to a narrower type until a check such as `typeof u === "string"` has narrowed it, so line 2 and line 4 are both errors.

## typescript-basic-006
topic: basic-types
answer: A

Which return type annotation states that `fail` never finishes normally?

```typescript
function fail(message: string): ____ {
  throw new Error(message);
}
```

- A: `never`
- B: `void`
- C: `undefined`
- D: `null`

> `never` is the type with no values: a function returning `never` cannot return at all. Because this body only throws, the compiler would accept any of the four annotations, but only `never` says what happens. It also helps callers: after `if (s === null) fail("empty");` the compiler knows `s` is not `null`, which it does not when `fail` is declared `void`.

## typescript-basic-007
topic: basic-types
answer: C

With `strict: true`, what happens?

```typescript
let total = 5;
total = "five";
```

- A: It compiles; `total` becomes `string | number`.
- B: It compiles, because a variable without an annotation is `any`.
- C: A compile error: `"five"` is not assignable to type `number`.
- D: It compiles, but the assignment throws at runtime.

> A variable with no annotation takes its type from its initialiser, so `total` is `number` from the first line on. Its type does not grow to accept later values. Only a variable declared with no annotation *and* no initialiser starts out as `any`.

## typescript-basic-008
topic: basic-types
answer: B

What type does TypeScript infer for `values`?

```typescript
const values = [1, "two", 3];
```

- A: `[number, string, number]`
- B: `(string | number)[]`
- C: `any[]`
- D: `number[] | string[]`

> An array literal is inferred as an array, not a tuple, and its element type is the union of the elements' types. So any element may be a `string` or a `number`, and the length is not fixed. A tuple type needs an annotation; `number[] | string[]` would mean all numbers or all strings, which this array is not.

## typescript-basic-009
topic: basic-types
answer: D

With `strict: true`, which assignment compiles?

```typescript
let entry: [string, number] = ["apples", 3];
```

- A: `entry = [3, "apples"];`
- B: `entry = ["pears"];`
- C: `entry = ["pears", 5, 1];`
- D: `entry = ["pears", 5];`

> A tuple type fixes both the length and the type at each position. `[3, "apples"]` has the types in the wrong order, `["pears"]` is one element short and `["pears", 5, 1]` one too many. Only a `string` followed by a `number` fits.

## typescript-basic-010
topic: unions-narrowing
answer: C
run: typescript

What does this program print?

```typescript
function size(x: string | number): number {
  if (typeof x === "string") {
    return x.length;
  }
  return x * 2;
}

console.log(size("four") + " " + size(4));
```

- A: `8 8`
- B: `4 4`
- C: `4 8`
- D: `NaN 8`

> Inside the `if`, `typeof x === "string"` narrows `x` to `string`, so `"four".length` is 4. After the `return`, only `number` is left, so `4 * 2` is 8. The two numbers are joined around a string, giving `4 8`.

## typescript-basic-011
topic: unions-narrowing
answer: B, C

With `strict: true`, which of these lines would be compile errors inside `show`? Select all that apply.

```typescript
function show(value: string | number) {
  // which line?
}
```

- A: `value.toString();`
- B: `value.length;`
- C: `value.toFixed(1);`
- D: `value.valueOf();`

> On a union you may only use what every member has, until you narrow it. `string` and `number` both have `toString()` and `valueOf()`, so A and D compile. `length` exists only on `string` and `toFixed` only on `number`, so B and C are errors until a check such as `typeof value === "string"` narrows the type.

## typescript-basic-012
topic: unions-narrowing
answer: A
run: typescript

What does this program print?

```typescript
interface Fish {
  swim: () => string;
}
interface Bird {
  fly: () => string;
}

function move(animal: Fish | Bird): string {
  if ("swim" in animal) {
    return animal.swim();
  }
  return animal.fly();
}

console.log(move({ fly: () => "up" }) + "-" + move({ swim: () => "down" }));
```

- A: `up-down`
- B: `down-up`
- C: `up-up`
- D: It does not compile: `swim` does not exist on `Bird`.

> The `in` operator narrows: inside the `if`, `animal` is a `Fish`, and after it only `Bird` is left, so both calls compile. At runtime the first object has no `swim` property and returns `"up"`; the second has one and returns `"down"`.

## typescript-basic-013
topic: unions-narrowing
answer: B
run: typescript

What does this program print?

```typescript
class Cat {
  speak(): string {
    return "meow";
  }
}
class Dog {
  speak(): string {
    return "woof";
  }
  fetch(): string {
    return "ball";
  }
}

function act(pet: Cat | Dog): string {
  return pet instanceof Dog ? pet.fetch() : pet.speak();
}

console.log(act(new Dog()) + " " + act({ speak: () => "hiss" }));
```

- A: `woof hiss`
- B: `ball hiss`
- C: `ball meow`
- D: It does not compile: an object literal is not a `Cat`.

> `instanceof Dog` narrows `pet` to `Dog` in the true branch, so a real `Dog` fetches: `"ball"`. Types are structural, so `{ speak: () => "hiss" }` has everything a `Cat` has and is accepted. It is not an instance of `Dog`, so its own `speak` runs and returns `"hiss"`; `Cat`'s method is never involved.

## typescript-basic-014
topic: unions-narrowing
answer: D
run: typescript

What does this program print?

```typescript
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "square"; side: number };

function area(s: Shape): number {
  if (s.kind === "circle") {
    return 3 * s.radius * s.radius;
  }
  return s.side * s.side;
}

console.log(area({ kind: "circle", radius: 2 }) + area({ kind: "square", side: 3 }));
```

- A: `129`
- B: `NaN`
- C: It does not compile: `radius` does not exist on `Shape`.
- D: `21`

> Comparing the shared literal property `kind` narrows the union: inside the `if`, `s` is the circle member, so `s.radius` compiles; after it, `s` is the square. The circle gives `3 * 2 * 2 = 12`, the square `3 * 3 = 9`, and both are numbers, so `+` adds them: 21.

## typescript-basic-015
topic: unions-narrowing
answer: C

With `strict: true`, what happens?

```typescript
function initial(name: string | null): string {
  return name.charAt(0);
}
```

- A: It compiles; `initial(null)` returns `""`.
- B: It compiles; `initial(null)` throws a `TypeError` when it runs.
- C: A compile error: `name` may be `null` where `.charAt` is called.
- D: A compile error: a parameter cannot have the type `string | null`.

> Under `strict` (which turns on `strictNullChecks`), `null` is its own type, and a value that may be `null` must be narrowed before you use it, for example with `if (name === null) return "";` first. Without the check the compiler reports that `name` is possibly `null`. `string | null` is a perfectly good parameter type.

## typescript-basic-016
topic: unions-narrowing
answer: B
run: typescript

What does this program print?

```typescript
function describe(count?: number): string {
  if (count) {
    return "got " + count;
  }
  return "none";
}

console.log(describe(0) + ", " + describe(5));
```

- A: `got 0, got 5`
- B: `none, got 5`
- C: `none, none`
- D: `got 0, none`

> `if (count)` is a truthiness check. It does narrow away `undefined`, but `0` is falsy too, so `describe(0)` falls through to `"none"`. To treat only a missing value as missing, test `count !== undefined`.

## typescript-basic-017
topic: unions-narrowing
answer: A
run: typescript

What does this program print?

```typescript
function kind(value: string | object | null): string {
  if (typeof value === "object") {
    return "object";
  }
  return "string";
}

console.log(kind(null) + " " + kind("x") + " " + kind([]));
```

- A: `object string object`
- B: `string string object`
- C: `object string string`
- D: `string string string`

> `typeof null` is `"object"` in JavaScript, so `null` takes the first branch, and TypeScript narrows `value` there to `object | null` for exactly that reason. An array is an object too. Only the string reaches the last line.

## typescript-basic-018
topic: unions-narrowing
answer: D

With `strict: true`, what is the type of `x` in the final `else` branch?

```typescript
function label(x: string | number): string {
  if (typeof x === "string") {
    return "text";
  } else if (typeof x === "number") {
    return "number";
  } else {
    return x;
  }
}
```

- A: `string | number`
- B: `unknown`
- C: `undefined`
- D: `never`

> Each check removes a member of the union: after `string` and `number` are both ruled out, nothing is left, and the type with no values is `never`. That is why `return x` compiles here (`never` is assignable to every type), and why an exhaustive check often ends in a `never` branch.

## typescript-basic-019
topic: interfaces-aliases
answer: B

With `strict: true`, which lines are compile errors?

```typescript
interface Point {
  x: number;
  y: number;
}

const a: Point = { x: 1, y: 2, z: 3 };   // line 1
const extra = { x: 1, y: 2, z: 3 };
const b: Point = extra;                  // line 2
```

- A: Both lines compile.
- B: Only line 1 is an error.
- C: Only line 2 is an error.
- D: Both lines are errors.

> An object literal written straight into a typed slot gets an excess property check: `z` is not in `Point`, which is probably a typo, so line 1 is an error. `extra` is a variable of type `{ x: number; y: number; z: number }`, and assigning it is an ordinary structural check: it has every property `Point` needs, and extra ones are allowed.

## typescript-basic-020
topic: interfaces-aliases
answer: D

With `strict: true`, what happens?

```typescript
interface User { name: string }
interface User { age: number }

type Pet = { name: string };
type Pet = { age: number };
```

- A: Both pairs merge, so `User` and `Pet` each have `name` and `age`.
- B: Both pairs are duplicate-identifier errors.
- C: In each pair the second declaration replaces the first.
- D: The two `User` interfaces merge; declaring `Pet` twice is a duplicate-identifier error.

> Interfaces with the same name in the same scope merge their members (declaration merging), so `User` has both `name` and `age`. A type alias is a single name for a type and cannot be declared twice, so the compiler reports a duplicate identifier `Pet`.

## typescript-basic-021
topic: interfaces-aliases
answer: C

With `strict: true`, what is the type of `c`?

```typescript
interface Options {
  color?: string;
  width: number;
}

function paint(opts: Options) {
  const c = opts.color;
}
```

- A: `string`
- B: `string | null`
- C: `string | undefined`
- D: `any`

> The `?` makes the property optional: an `Options` object may leave `color` out, and reading a property that is not there gives `undefined`. So under `strictNullChecks` (part of `strict`) the read has type `string | undefined`. Optional never means `null`.

## typescript-basic-022
topic: interfaces-aliases
answer: A
run: typescript

What does this program print?

```typescript
interface Options {
  color?: string;
  width: number;
}

const opts: Options = { width: 2 };
console.log(("color" in opts) + " " + opts.color);
```

- A: `false undefined`
- B: `true undefined`
- C: `false null`
- D: `true null`

> An optional property may simply be absent, and the interface does not add it: the object at runtime is exactly `{ width: 2 }`. So `"color" in opts` is `false`, and reading a missing property gives `undefined`.

## typescript-basic-023
topic: interfaces-aliases
answer: C
run: typescript

What does this program print?

```typescript
interface Frozen {
  readonly value: number;
}

const source = { value: 1 };
const view: Frozen = source;
source.value = 5;
console.log(view.value);
```

- A: `1`
- B: It does not compile: a mutable object cannot be assigned to a `readonly` type.
- C: `5`
- D: It throws a `TypeError` at `source.value = 5`.

> `readonly` only stops writes through that type: `view.value = 5` would be a compile error. It neither copies nor freezes anything, and a mutable object may be assigned to it. `view` and `source` are the same object, so the change made through `source` is what `view.value` reads.

## typescript-basic-024
topic: interfaces-aliases
answer: A, B

`User` is declared as `interface User { name: string }`. With `strict: true`, which of these declare an `Admin` type that has both `name` and `level: number`? Select all that apply.

- A: `interface Admin extends User { level: number }`
- B: `type Admin = User & { level: number };`
- C: `type Admin extends User { level: number }`
- D: `interface Admin = User & { level: number };`
- E: `type Admin = User | { level: number };`

> An interface extends another with `extends` (A); a type alias combines types with an intersection `&` (B). C and D mix the two syntaxes and do not parse: a type alias has no `extends` clause and an interface has no `=`. E is a union, a value that is *either* a `User` *or* has a `level`, so it is not guaranteed to have both.

## typescript-basic-025
topic: interfaces-aliases
answer: B

Which of these can be written as a type alias but not as an interface?

- A: An object type with an optional property
- B: A union such as `string | number`
- C: An object type with a call signature
- D: An object type with an index signature

> An interface always describes one object type, and an object type can have optional properties, call signatures (`(x: number): string`) and index signatures (`[key: string]: number`). A union of two types is not an object type, so only a type alias can name it: `type Id = string | number;`.
