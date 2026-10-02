---
skill: typescript
level: basic
---

## typescript-basic-026
topic: interfaces-aliases
answer: D
run: typescript

What does this program print?

```typescript
interface Scores {
  [name: string]: number;
}

const scores: Scores = { ana: 3 };
scores.ben = 4;
scores["cai"] = 5;
console.log(Object.keys(scores).join(","));
```

- A: `ana`
- B: `ana,cai`
- C: It does not compile: `ben` is not declared in `Scores`.
- D: `ana,ben,cai`

> An index signature, `[name: string]: number`, says the object may have any string key as long as its value is a number. So adding `ben` (with dot syntax) and `cai` (with brackets) both compile, and at runtime they are ordinary properties, listed in the order they were added.

## typescript-basic-027
topic: interfaces-aliases
answer: B

With `strict: true`, what happens on the last line?

```typescript
interface Celsius {
  value: number;
}
interface Fahrenheit {
  value: number;
}

const inside: Celsius = { value: 20 };
const outside: Fahrenheit = inside;
```

- A: A compile error: `Celsius` is not assignable to `Fahrenheit`.
- B: It compiles: both interfaces describe the same shape.
- C: It compiles only with an assertion, `inside as Fahrenheit`.
- D: It compiles only if `Fahrenheit` extends `Celsius`.

> TypeScript's type system is structural: assignability depends on the members a type has, not on its name or on any declared relationship. Both interfaces require exactly a `value: number`, so a `Celsius` is a `Fahrenheit` as far as the compiler is concerned. Keeping the two apart needs a difference in shape, such as a distinct property on each.

## typescript-basic-028
topic: functions
answer: C
run: typescript

What does this program print?

```typescript
function greet(name: string, greeting: string = "Hi", mark?: string): string {
  return greeting + " " + name + (mark || ".");
}

console.log(greet("Ana") + " " + greet("Ben", undefined, "!"));
```

- A: `Hi Ana. undefined Ben!`
- B: `Hi Ana. Ben!`
- C: `Hi Ana. Hi Ben!`
- D: It does not compile: `undefined` cannot be passed for `greeting`.

> A parameter with a default is optional to callers, so its type for them includes `undefined`, and passing `undefined` explicitly is how you skip it to reach a later argument. The default applies whenever the argument is `undefined`, so both calls greet with `"Hi"`. The missing `mark` makes the first call end with `"."`.

## typescript-basic-029
topic: functions
answer: D

With `strict: true`, which of these function declarations compiles?

- A: `function f(a?: number, b: number) {}`
- B: `function f(a?: number = 1) {}`
- C: `function f(a?: number, b?: string, c: boolean) {}`
- D: `function f(a: number, b?: number) {}`

> Optional parameters must come after the required ones, so A and C are errors ("a required parameter cannot follow an optional parameter"). B marks the parameter optional twice: a default already makes it optional, and `?` together with an initialiser is an error. D has its required parameter first and the optional one last.

## typescript-basic-030
topic: functions
answer: A

Given this function type, which assignment is a compile error with `strict: true`?

```typescript
type Combine = (a: number, b: number) => number;
```

- A: `const f: Combine = (x, y, z) => x + y + z;`
- B: `const f: Combine = (x, y) => x + y;`
- C: `const f: Combine = (x) => x * 2;`
- D: `const f: Combine = () => 0;`

> A function that takes fewer parameters than the type describes is fine: callers will pass two arguments, and a function may ignore extra arguments (this is why `arr.map((x) => …)` works). A function that needs a third parameter is not: `Combine` callers never supply one, so the compiler rejects it.

## typescript-basic-031
topic: functions
answer: B
run: typescript

What does this program print?

```typescript
type Callback = () => void;

const getAnswer: Callback = () => 42;
const result = getAnswer();
console.log(result);
```

- A: `undefined`
- B: `42`
- C: `void`
- D: It does not compile: a `() => void` function cannot return `42`.

> A function *type* that returns `void` accepts functions that return something; it only promises callers that they should not use the result. That is what lets you pass `(x) => arr.push(x)` to `forEach`. The type is erased, so at runtime the arrow function still returns `42`. (A function *declared* as `function f(): void { return 42; }` would be an error.)

## typescript-basic-032
topic: functions
answer: A

With `strict: true`, what happens?

```typescript
function sign(n: number): string {
  if (n > 0) return "positive";
  if (n < 0) return "negative";
}
```

- A: A compile error: the function can reach its end without returning a `string`.
- B: It compiles, and `sign(0)` returns `undefined`.
- C: It compiles, and `sign(0)` returns `""`.
- D: It compiles, and `sign(0)` throws at runtime.

> For `n === 0` neither `if` returns, so the function falls off its end and would return `undefined`, which is not a `string`. With `strictNullChecks` (part of `strict`) the compiler reports that the function lacks an ending return statement and its return type does not include `undefined`. A final `return "zero";` fixes it.

## typescript-basic-033
topic: functions
answer: C
run: typescript

What does this program print?

```typescript
function total(label: string, ...nums: number[]): string {
  let sum = 0;
  for (let i = 0; i < nums.length; i++) {
    sum += nums[i];
  }
  return label + nums.length + ":" + sum;
}

console.log(total("x") + " " + total("y", 1, 2, 3));
```

- A: `x0:0 y4:6`
- B: It throws a `TypeError`: `nums` is `undefined` in `total("x")`.
- C: `x0:0 y3:6`
- D: It does not compile: `total("x")` passes no `nums`.

> A rest parameter collects the remaining arguments into an array, and it is optional to callers: with none it is an empty array, never `undefined`. `total("x")` has 0 numbers summing to 0; `total("y", 1, 2, 3)` collects `[1, 2, 3]` (the label is not included), 3 numbers summing to 6.

## typescript-basic-034
topic: functions
answer: D
run: typescript

What does this program print?

```typescript
function add(a: number, b = a * 2): number {
  return a + b;
}

console.log(add(3) + " " + add(3, 0));
```

- A: `9 9`
- B: `3 3`
- C: It does not compile: `b` has no type annotation.
- D: `9 3`

> A default may use earlier parameters, and the parameter's type is inferred from it, so `b` is a `number` and needs no annotation. `add(3)` uses the default `3 * 2 = 6` and returns 9. The default only replaces `undefined`: `add(3, 0)` passes `0`, so it returns `3 + 0 = 3`.

## typescript-basic-035
topic: functions
answer: A, B, C

With `strict: true`, which calls compile? Select all that apply.

```typescript
function pad(width?: number): string {
  return width === undefined ? "default" : "custom";
}
```

- A: `pad()`
- B: `pad(4)`
- C: `pad(undefined)`
- D: `pad(null)`
- E: `pad("4")`

> An optional parameter may be left out (A) or given a value of its type (B); its type is `number | undefined`, so passing `undefined` explicitly is also allowed (C). Under `strictNullChecks` `null` is a separate type that `number | undefined` does not include (D), and a string is not a number (E).

## typescript-basic-036
topic: classes
answer: A
run: typescript

What does this program print?

```typescript
class Point {
  constructor(public x: number, private y: number) {}

  sum(): number {
    return this.x + this.y;
  }
}

const p = new Point(2, 3);
console.log(p.x + " " + p.sum());
```

- A: `2 5`
- B: `2 NaN`
- C: `undefined NaN`
- D: It does not compile: `x` and `y` are never declared as properties.

> A constructor parameter with an access modifier (`public`, `private`, `protected` or `readonly`) is a parameter property: it declares the property and assigns the argument to it. So `x` is 2 and `y` is 3; `private` only stops code outside the class from reading `y`, and `sum` is inside the class.

## typescript-basic-037
topic: classes
answer: C

With `strict: true`, which lines are compile errors?

```typescript
class Base {
  protected count = 1;
}

class Child extends Base {
  show(): number {
    return this.count;    // line 1
  }
}

const c = new Child();
c.show();                 // line 2
console.log(c.count);     // line 3
```

- A: Only line 1
- B: Lines 1 and 3
- C: Only line 3
- D: Only line 2

> A `protected` member is visible inside the class that declares it and inside its subclasses, so `Child` may read `this.count` (line 1). Outside the classes it is as hidden as `private`, so reading `c.count` from top-level code (line 3) is an error. `show` is public, so line 2 is fine.

## typescript-basic-038
topic: classes
answer: B

With `strict: true`, which lines are compile errors?

```typescript
class Ticket {
  readonly id: number;

  constructor(id: number) {
    this.id = id;    // line 1
  }

  reset(): void {
    this.id = 0;     // line 2
  }
}
```

- A: Only line 1
- B: Only line 2
- C: Both lines
- D: Neither line

> A `readonly` property may be assigned where it is declared or in the constructor, which is how it gets its value. After construction it cannot be assigned again, so the assignment in `reset` is an error, even though it is inside the class.

## typescript-basic-039
topic: classes
answer: D
run: typescript

What does this program print?

```typescript
class Counter {
  count = 0;

  increment(): Counter {
    this.count++;
    return this;
  }
}

const c = new Counter();
c.increment().increment();
c.count += 10;
console.log(c.count);
```

- A: `2`
- B: `10`
- C: It does not compile: `count` is private because it has no modifier.
- D: `12`

> A class member without an access modifier is `public`, so code outside the class may change `count`. Each `increment` returns the same object, so the chained calls add 2, and `+= 10` brings it to 12.

## typescript-basic-040
topic: classes
answer: A

With `strict: true`, which lines are compile errors?

```typescript
abstract class Shape {
  abstract area(): number;

  describe(): string {
    return "area " + this.area();
  }
}

class Square extends Shape {
  constructor(private side: number) {
    super();
  }

  area(): number {
    return this.side * this.side;
  }
}

const a = new Square(2);    // line 1
const b = new Shape();      // line 2
const c: Shape = a;         // line 3
```

- A: Only line 2
- B: Lines 2 and 3
- C: Only line 3
- D: Lines 1 and 2

> An abstract class cannot be instantiated, so `new Shape()` is an error. A subclass that implements every abstract member is an ordinary class (line 1), and a `Square` may be stored in a variable of type `Shape`, because it is one (line 3). Abstract classes are used as types all the time; only `new` is refused.

## typescript-basic-041
topic: classes
answer: C
run: typescript

What does this program print?

```typescript
class Widget {
  static created = 0;

  constructor() {
    Widget.created++;
  }
}

new Widget();
new Widget();
const w = new Widget();
console.log(Widget.created + " " + (w as any).created);
```

- A: `3 3`
- B: `1 undefined`
- C: `3 undefined`
- D: `0 undefined`

> A `static` property belongs to the class itself, shared by all instances, so the three constructions count up to 3. It is not copied onto instances: `w.created` would be a compile error, and reading it past the checker with `as any` finds no such property, so it is `undefined`.

## typescript-basic-042
topic: classes
answer: D

With `strict: true`, what happens?

```typescript
interface Shape {
  name: string;
  area(): number;
}

class Square implements Shape {
  constructor(public side: number) {}

  area(): number {
    return this.side * this.side;
  }
}
```

- A: It compiles; `implements` only documents intent.
- B: It compiles; `Square` gets a `name` property that is `undefined`.
- C: A compile error: a class cannot implement an interface that declares properties.
- D: A compile error: `Square` lacks the `name` property that `Shape` requires.

> `implements` is checked: the class must have every member the interface requires, with compatible types. `Square` has `area` but no `name`, so the compiler reports that it incorrectly implements `Shape`. It adds nothing to the class, and interfaces with properties can be implemented like any other.

## typescript-basic-043
topic: classes
answer: B
run: typescript

What does this program print?

```typescript
class Animal {
  constructor(protected name: string) {}

  speak(): string {
    return this.name + " makes a sound";
  }
}

class Dog extends Animal {
  speak(): string {
    return super.speak() + " and barks";
  }
}

console.log(new Dog("Rex").speak());
```

- A: `Rex and barks`
- B: `Rex makes a sound and barks`
- C: `undefined makes a sound and barks`
- D: It does not compile: `Dog` must declare its own constructor.

> A subclass without a constructor inherits its parent's, so `new Dog("Rex")` runs `Animal`'s and sets `name`. `Dog.speak` overrides the parent's method and calls it through `super.speak()`, then appends its own text.

## typescript-basic-044
topic: classes
answer: A
run: typescript

What does this program print?

```typescript
class Meters {
  constructor(public value: number) {}
}
class Feet {
  constructor(public value: number) {}
}

const m: Meters = new Feet(3);
console.log((m instanceof Meters) + " " + m.value);
```

- A: `false 3`
- B: `true 3`
- C: `false undefined`
- D: It does not compile: a `Feet` is not a `Meters`.

> Classes are compared structurally too: `Feet` has the same public members as `Meters`, so the assignment compiles. The annotation changes nothing at runtime, though. The object was made by `Feet`, so `instanceof Meters` is `false`, and its `value` is 3.

## typescript-basic-045
topic: generics
answer: B
run: typescript

What does this program print?

```typescript
function identity<T>(value: T): T {
  return value;
}

const a = identity("7");
const b = identity<number>(7);
console.log(a + b);
```

- A: `14`
- B: `77`
- C: `7`
- D: It does not compile: `a` and `b` have different types.

> For `identity("7")` TypeScript infers `T` from the argument, so `a` is a string; for `b` the type argument is given, so it is a number. `string + number` is allowed and concatenates, just as in JavaScript, so the result is `"77"`.

## typescript-basic-046
topic: generics
answer: C

With `strict: true`, which call is a compile error?

```typescript
function identity<T>(value: T): T {
  return value;
}
```

- A: `identity(5)`
- B: `identity<number>(5)`
- C: `identity<string>(5)`
- D: `identity<string | number>(5)`

> When you write the type argument yourself, the parameter's type is fixed by it: `identity<string>` expects a `string`, and `5` is not one. Without an explicit argument (A) `T` is inferred from `5`; `number` (B) and `string | number` (D) both accept `5`.

## typescript-basic-047
topic: generics
answer: A
run: typescript

What does this program print?

```typescript
function first<T>(items: T[]): T | undefined {
  return items[0];
}

const empty: number[] = [];
console.log(first([10, 20]) + " " + first(empty));
```

- A: `10 undefined`
- B: `10 null`
- C: `10 0`
- D: It throws a `TypeError` for the empty array.

> Reading index 0 of an empty array does not throw in JavaScript; it gives `undefined`, which is why the return type says `T | undefined`. Nothing converts it to `null` or `0`, so it prints as `undefined`.

## typescript-basic-048
topic: generics
answer: D

Which type is the same as `string[]`?

- A: `[string]`
- B: `Array[string]`
- C: `Array<string[]>`
- D: `Array<string>`

> `T[]` is shorthand for the generic type `Array<T>`, so `string[]` and `Array<string>` are the same type. `[string]` is a tuple of exactly one string; `Array<string[]>` is an array of string arrays; and `Array[string]` is not valid, because `Array` needs a type argument in angle brackets.

## typescript-basic-049
topic: generics
answer: B
run: typescript

What does this program print?

```typescript
class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  size(): number {
    return this.items.length;
  }
}

const s = new Stack<number>();
s.push(1);
s.push(2);
s.push(3);
s.pop();
console.log(s.size() + " " + s.pop());
```

- A: `2 3`
- B: `2 2`
- C: `3 3`
- D: `2 1`

> `pop` removes the last item pushed. The first `pop` removes 3, leaving `[1, 2]`, so `size()` is 2. The expression is evaluated left to right, so the second `pop` runs after `size()` and returns 2.

## typescript-basic-050
topic: generics
answer: C

What type does TypeScript infer for `p`?

```typescript
function pair<A, B>(first: A, second: B): [A, B] {
  return [first, second];
}

const p = pair("id", 42);
```

- A: `[A, B]`
- B: `(string | number)[]`
- C: `[string, number]`
- D: `["id", 42]`

> The type parameters are inferred from the arguments, `A` as `string` and `B` as `number`, and the declared return type turns them into a tuple. Here the literals `"id"` and `42` are widened to `string` and `number`: assigning `p` to a variable of type `["id", 42]` is an error. The result is a tuple, not an array of either type, and the names `A` and `B` never appear in the result.
