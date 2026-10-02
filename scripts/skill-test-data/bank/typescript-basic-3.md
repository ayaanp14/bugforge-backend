---
skill: typescript
level: basic
---

## typescript-basic-051
topic: generics
answer: D

With `strict: true`, what happens?

```typescript
function lengthOf<T>(value: T): number {
  return value.length;
}
```

- A: It compiles; `lengthOf(5)` returns `undefined`.
- B: It compiles, because `T` is treated as `any` inside the function.
- C: It compiles; the error is reported only at a call such as `lengthOf(5)`.
- D: A compile error: `length` does not exist on type `T`.

> Inside a generic function `T` could be any type at all, including `number`, so the compiler only allows what every type has. It checks the body once, for every possible `T`, not at each call. To use `.length`, `T` must be restricted to types that have it (a constraint such as `T extends { length: number }`) or the parameter typed differently.

## typescript-basic-052
topic: generics
answer: A, D

With `strict: true`, which of these declarations compile? Select all that apply.

```typescript
interface Box<T> {
  value: T;
}
```

- A: `const a: Box<string> = { value: "x" };`
- B: `const b: Box<number> = { value: "1" };`
- C: `const c: Box = { value: 1 };`
- D: `const d: Box<string[]> = { value: [] };`

> `Box<string>` needs a string `value` (A), and `Box<string[]>` an array of strings, which an empty array is (D). `Box<number>` needs a number, and `"1"` is a string (B). A generic interface without a default type argument cannot be used bare: `Box` alone is an error, "Generic type `Box<T>` requires 1 type argument" (C).

## typescript-basic-053
topic: enums-literals
answer: B
run: typescript

What does this program print?

```typescript
enum Color {
  Red,
  Green = 5,
  Blue,
}

console.log(Color.Blue + " " + Color[5]);
```

- A: `2 Green`
- B: `6 Green`
- C: `6 Blue`
- D: `2 undefined`

> Numeric enum members count up from the previous member: `Red` is 0, `Green` is set to 5, so `Blue` is 6. A numeric enum also gets a reverse mapping at runtime, from each value back to its name, so `Color[5]` is `"Green"`.

## typescript-basic-054
topic: enums-literals
answer: C
run: typescript

What does this program print?

```typescript
enum Direction {
  Up = "UP",
  Down = "DOWN",
}

console.log(Direction.Up + " " + (Direction as any)["UP"]);
```

- A: `UP Up`
- B: `0 undefined`
- C: `UP undefined`
- D: `0 Up`

> A string enum member's value is the string it is given, so `Direction.Up` is `"UP"`. Only numeric members get a reverse mapping; the emitted object for a string enum is just `{ Up: "UP", Down: "DOWN" }`, so looking up the key `"UP"` finds nothing.

## typescript-basic-055
topic: enums-literals
answer: A
run: typescript

What does this program print?

```typescript
enum Level {
  Low,
  High,
}

console.log(Object.keys(Level).length);
```

- A: `4`
- B: `2`
- C: `0`
- D: It does not compile: an enum is not an object.

> A (non-`const`) enum compiles to a real object, so `Object.keys` works on it. A numeric enum stores both directions: `Low` and `High` map to 0 and 1, and `"0"` and `"1"` map back to the names. That is four keys, not two.

## typescript-basic-056
topic: enums-literals
answer: D
run: typescript

What does this program print?

```typescript
enum Size {
  Small = 1,
  Medium,
  Large,
}

function price(size: Size): number {
  switch (size) {
    case Size.Small:
      return 10;
    case Size.Medium:
      return 15;
    default:
      return 20;
  }
}

console.log(price(Size.Medium) + " " + Size.Large);
```

- A: `15 2`
- B: `20 3`
- C: `15 Large`
- D: `15 3`

> `Small` is set to 1, so `Medium` and `Large` follow as 2 and 3. `price(Size.Medium)` matches the second case and returns 15. A numeric enum member is a number at runtime, so `Size.Large` prints as `3`, not as its name.

## typescript-basic-057
topic: enums-literals
answer: A, D

With `strict: true`, which calls compile? Select all that apply.

```typescript
function move(steps: 1 | 2 | 3, dir: "left" | "right"): void {}
```

- A: `move(1, "left")`
- B: `move(4, "left")`
- C: `move(2, "Right")`
- D: `move(3, "right")`

> A literal type admits exactly the value it names, and a union of literals admits one of a fixed set. `4` is not among `1 | 2 | 3`, and string literals are case-sensitive, so `"Right"` is not `"right"`. A and D use only allowed values.

## typescript-basic-058
topic: enums-literals
answer: C

With `strict: true`, which lines are compile errors?

```typescript
type Mode = "light" | "dark";

function setMode(mode: Mode): void {}

const a = "dark";
let b = "dark";

setMode(a);       // line 1
setMode(b);       // line 2
setMode("dim");   // line 3
```

- A: Only line 3
- B: Only line 2
- C: Lines 2 and 3
- D: Lines 1, 2 and 3

> `const a` keeps the literal type `"dark"`, which is a `Mode`. `let b` is widened to `string`, because it could be reassigned to any string, and a `string` is not assignable to `Mode` even though its current value would fit. `"dim"` is not one of the two literals. Annotating `let b: Mode = "dark";` would make line 2 compile.

## typescript-basic-059
topic: enums-literals
answer: A, C

With `strict: true`, which of these compile? Select all that apply.

```typescript
enum Fruit {
  Apple = "apple",
  Pear = "pear",
}
```

- A: `const f1: Fruit = Fruit.Apple;`
- B: `const f2: Fruit = "apple";`
- C: `const s: string = Fruit.Pear;`
- D: `const f3: Fruit = "Apple";`

> A string enum member can be used wherever a `string` is expected (C), and of course where a `Fruit` is (A). The reverse is refused: a plain string literal is not assignable to a string enum, even one equal to a member's value (B), so code has to say `Fruit.Apple`. D is the member's name rather than its value, and is refused for the same reason.

## typescript-basic-060
topic: enums-literals
answer: B

What type does TypeScript infer for `shape`?

```typescript
const shape = { kind: "circle", radius: 2 };
```

- A: `{ kind: "circle"; radius: 2 }`
- B: `{ kind: string; radius: number }`
- C: `{ readonly kind: "circle"; readonly radius: 2 }`
- D: `object`

> `const` keeps a literal type only for the variable itself. The object's properties can still be reassigned (`shape.kind = "square"` is allowed), so they are widened to `string` and `number`, and they are not `readonly`. This is why passing `shape` where `{ kind: "circle" }` is required fails unless the property is annotated.

## typescript-basic-061
topic: enums-literals
answer: A

With `strict: true`, which enum declaration is a compile error?

- A: `enum Names { X = "x", Y }`
- B: `enum Codes { X, Y = 5, Z }`
- C: `enum Flags { X = 1, Y = 2 }`
- D: `enum Keys { X = "x", Y = "y" }`

> A member without an initialiser takes the previous numeric value plus one, or 0 if it is the first. After a string member there is nothing to count from, so `Y` in `Names` must have an initialiser. `Codes` counts on from 5 to give `Z` the value 6; `Flags` and `Keys` set every member explicitly.

## typescript-basic-062
topic: runtime
answer: C
run: typescript

What does this program print?

```typescript
const pair: [string, number] = ["age", 30];
console.log(Array.isArray(pair) + " " + pair.length + " " + typeof pair);
```

- A: `false 2 tuple`
- B: `true 2 tuple`
- C: `true 2 object`
- D: `false 2 object`

> A tuple type exists only for the compiler. At runtime `pair` is an ordinary two-element JavaScript array: `Array.isArray` is `true`, and `typeof` gives `"object"` for every array, since JavaScript has no `"tuple"` result.

## typescript-basic-063
topic: runtime
answer: B
run: typescript

What does this program print?

```typescript
const input: unknown = "42";
const n = input as number;
console.log(typeof n + " " + (n + 1));
```

- A: `number 43`
- B: `string 421`
- C: `string 43`
- D: `number 421`

> A type assertion only tells the compiler what to believe; it emits no conversion and no check. `n` is still the string `"42"` at runtime, so `typeof` says `"string"` and `+ 1` concatenates. Converting needs real code, such as `Number(input)`.

## typescript-basic-064
topic: runtime
answer: D
run: typescript

What does this program print?

```typescript
class Account {
  private balance = 100;
}

const acct = new Account();
console.log((acct as any).balance + " " + Object.keys(acct).length);
```

- A: `undefined 0`
- B: `100 0`
- C: `undefined 1`
- D: `100 1`

> `private` is checked by the compiler and erased from the output: `balance` becomes an ordinary property set in the constructor. Reading it through `any` skips the check and finds 100, and `Object.keys` lists it. A JavaScript `#balance` field is what hides a value at runtime.

## typescript-basic-065
topic: runtime
answer: A
run: typescript

What does this program print?

```typescript
interface Named {
  name: string;
}

const person = { name: "Ana", age: 30 };
const named: Named = person;
console.log(Object.keys(named).length);
```

- A: `2`
- B: `1`
- C: `0`
- D: It does not compile: `age` is not a property of `Named`.

> Assigning a variable (not a fresh object literal) gets no excess property check, so this compiles. A type annotation never copies or trims an object: `named` is the same object as `person`, and both of its properties are still there at runtime.

## typescript-basic-066
topic: runtime
answer: C
run: typescript

What does this program print?

```typescript
class Point {
  constructor(public x: number) {}
}

console.log(typeof Point + " " + typeof new Point(1));
```

- A: `class object`
- B: `object object`
- C: `function object`
- D: `Point Point`

> A TypeScript class is a JavaScript class (or, for older targets, a constructor function), and `typeof` any class is `"function"`. An instance is an object, and `typeof` never reports a class name.

## typescript-basic-067
topic: runtime
answer: B
run: typescript

What does this program print?

```typescript
interface User {
  name: string;
  age: number;
}

const user: User = JSON.parse('{"name":"Ana","age":"30"}');
console.log(user.age + 1);
```

- A: `31`
- B: `301`
- C: `NaN`
- D: It throws a `TypeError`: `age` is not a number.

> `JSON.parse` returns `any`, so the annotation is accepted without any check, and nothing at runtime compares the data to `User`. `age` is the string `"30"`, so `+ 1` concatenates. Data from outside the program has to be validated by code you write.

## typescript-basic-068
topic: runtime
answer: D

With `strict: true`, what happens?

```typescript
interface Named {
  name: string;
}

function check(value: object): boolean {
  return value instanceof Named;
}
```

- A: It compiles and checks whether `value` has a `name` property.
- B: It compiles, and always returns `false` at runtime.
- C: It compiles, but throws a `TypeError` when called.
- D: A compile error: `Named` is only a type, so there is nothing to test against at runtime.

> Interfaces are erased: the emitted JavaScript has no `Named`, so `instanceof` has nothing to look at, and the compiler reports that `Named` only refers to a type but is used as a value. A runtime check has to test the data itself, e.g. `"name" in value`, or use a class.

## typescript-basic-069
topic: runtime
answer: C, D

Compiled by `tsc` with default options, which of these declarations produce JavaScript in the output? Select all that apply.

- A: `interface Point { x: number }`
- B: `type Id = string | number;`
- C: `enum Status { On, Off }`
- D: `class Box { size = 1; }`

> Interfaces and type aliases exist only for the checker and leave nothing behind. An enum compiles to an object that holds its members (and, for numbers, the reverse mapping), and a class to a constructor with its property initialisers, so both produce code.

## typescript-basic-070
topic: config
answer: C

A project's `tsconfig.json` sets `"strict": true` and `"outDir": "dist"`, nothing else. `src/app.ts` contains `let n: number = "five";`. What happens when you run `tsc` in the project folder?

- A: `tsc` reports the error and writes no JavaScript.
- B: `tsc` writes the JavaScript without reporting anything, since type errors are warnings.
- C: `tsc` reports the error and still writes the JavaScript.
- D: `tsc` writes the JavaScript with the bad line removed.

> Type checking and emitting are separate steps, and by default a type error does not stop the output: `tsc` reports the error, exits with a failure code, and still writes the JavaScript with the annotation stripped. The `noEmitOnError` option turns this off.

## typescript-basic-071
topic: config
answer: B

TypeScript 5.x compiles this file with `--target es5`. What does it emit?

```typescript
let count = 1;
const double = (n: number) => n * 2;
```

- A: `let count = 1; const double = (n) => n * 2;`
- B: `var count = 1; var double = function (n) { return n * 2; };`
- C: `let count = 1; const double = (n: number) => n * 2;`
- D: An error: ES5 has no `let`, `const` or arrow functions.

> `target` chooses the JavaScript version of the output, and the compiler rewrites newer syntax for older targets: ES5 has no `let`, `const` or arrow functions, so they become `var` and a function expression. Type annotations are removed whatever the target, so C can never be the output.

## typescript-basic-072
topic: config
answer: D

`math.ts` contains:

```typescript
export default function add(a: number, b: number): number {
  return a + b;
}
export const PI = 3.14;
```

Which import in another file brings in the function as `add` and the constant as `PI`?

- A: `import { add, PI } from "./math";`
- B: `import add, PI from "./math";`
- C: `import * as add, { PI } from "./math";`
- D: `import add, { PI } from "./math";`

> A default export is imported without braces, under any name you choose, and named exports inside braces; both can share one statement, default first. A fails because the module has no export *named* `add`. B and C are not valid syntax: a named import needs braces, and a namespace import (`* as`) cannot be combined with braces.

## typescript-basic-073
topic: config
answer: A

Two files are compiled together. Neither has an `import` or an `export`.

```typescript
// a.ts
const total = 1;
```

```typescript
// b.ts
const total = 2;
```

With `strict: true`, what happens?

- A: A compile error: `total` is declared twice in one global scope; `export {}` in each file fixes it.
- B: It compiles: each file has its own scope.
- C: It compiles, and the `total` in `b.ts` replaces the one in `a.ts`.
- D: A compile error: a file with no `export` cannot declare a `const`.

> A file with no top-level `import` or `export` is a script, not a module, and scripts share one global scope, so the two `const total` declarations collide ("cannot redeclare block-scoped variable"). Any `import` or `export`, even an empty `export {}`, makes a file a module with its own scope.

## typescript-basic-074
topic: config
answer: B

A `tsconfig.json` sets `"strict": true` and `"target": "es2015"` and nothing else, and the project has no `@types` packages installed. What happens when a file calls `[1, 2, 3].includes(2)`?

- A: It compiles, and runs wherever `includes` exists.
- B: A compile error: `includes` is not in the ES2015 library typings, so `lib` (or `target`) must be raised.
- C: It compiles; `tsc` rewrites `includes` as `indexOf` for ES2015.
- D: It compiles, but `tsc` adds a polyfill for `includes`.

> Without a `lib` option, the built-in declarations the compiler loads follow `target`, and `Array.prototype.includes` arrived in ES2016, so the type-checker does not know it. `tsc` rewrites syntax for older targets, but it never rewrites or polyfills library methods. Setting `"lib": ["es2016", "dom"]` (if the runtime has `includes`) or a newer `target` fixes it. (Type packages can pull in newer library typings too: `@types/node` does, which is why the question rules them out.)

## typescript-basic-075
topic: config
answer: A

`user.ts` contains `export interface User { name: string }`. Another file is compiled with `tsc --module commonjs` and no other options:

```typescript
import { User } from "./user";

const u: User = { name: "Ana" };
console.log(u.name);
```

What happens to the `import` in the output?

- A: It is removed: `User` is only used as a type, so nothing is loaded at runtime.
- B: It becomes a `require("./user")` call that runs when the file loads.
- C: It stays, and `User` is `undefined` at runtime.
- D: A compile error: an interface cannot be imported.

> An interface has no runtime value, and an import whose names are used only as types is dropped from the emitted JavaScript, so the output has no `require` at all. Interfaces are imported and exported like any other declaration. (`import type { User }` states the intent explicitly; options such as `verbatimModuleSyntax` change how unmarked imports are treated.)
