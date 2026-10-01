---
skill: javascript
level: intermediate
---

## javascript-intermediate-001
topic: this-binding
answer: C
run: javascript

What does this script print?

```javascript
class Greeter {
  constructor(name) {
    this.name = name;
  }
  greet() {
    return "Hi " + this.name;
  }
}
const g = new Greeter("Ada");
const greet = g.greet;
try {
  console.log(greet());
} catch (e) {
  console.log(e.constructor.name);
}
```

- A: `Hi Ada`
- B: `Hi undefined`
- C: `TypeError`
- D: `ReferenceError`

> `greet` is called as a plain function, so `this` is not `g`. Code inside a class body is always strict mode, so `this` is `undefined` rather than the global object, and reading `this.name` on `undefined` throws a `TypeError`. `Hi undefined` would be the sloppy-mode outcome for an ordinary function, where `this` falls back to the global object.

## javascript-intermediate-002
topic: this-binding
answer: B
run: javascript

What does this script print?

```javascript
"use strict";
const team = {
  name: "core",
  withArrow() {
    return ["a"].map((m) => m + "@" + this.name)[0];
  },
  withFunction() {
    return ["a"].map(function (m) {
      return m + "@" + (this ? this.name : "none");
    })[0];
  },
};
console.log(team.withArrow(), team.withFunction());
```

- A: `a@core a@core`
- B: `a@core a@none`
- C: `a@none a@core`
- D: `a@none a@none`

> An arrow function has no `this` of its own: it uses the `this` of the enclosing `withArrow` call, which is `team`. The regular function is called by `map` with `this` set to `map`'s optional second argument; none was given, so in strict mode `this` is `undefined` and the `"none"` fallback is used.

## javascript-intermediate-003
topic: this-binding
answer: A
run: javascript

What does this script print?

```javascript
function who() {
  return this.id;
}
const a = { id: "a" };
const b = { id: "b" };
const bound = who.bind(a);
const rebound = bound.bind(b);
console.log(bound.call(b), rebound());
```

- A: `a a`
- B: `b b`
- C: `a b`
- D: `b a`

> A bound function's `this` is fixed for good. `call`, `apply` and a second `bind` cannot change it (a second `bind` can only pre-fill more arguments), so both calls run `who` with `this === a`.

## javascript-intermediate-004
topic: this-binding
answer: D
run: javascript

What does this script print?

```javascript
function Point(x) {
  this.x = x;
}
const target = { x: "target" };
const BoundPoint = Point.bind(target, 7);
const p = new BoundPoint();
console.log(p.x, target.x);
```

- A: `target 7`
- B: `7 7`
- C: `undefined target`
- D: `7 target`

> Calling a bound function with `new` ignores the bound `this`: a fresh object is created and becomes `this`, while the pre-filled argument `7` is still passed. So `p.x` is `7`, and `target` is never touched.

## javascript-intermediate-005
topic: this-binding
answer: B
run: javascript

What does this script print?

```javascript
const make = function () {
  return () => this.tag;
};
const arrow = make.call({ tag: "outer" });
console.log(arrow.call({ tag: "inner" }), arrow.bind({ tag: "bound" })());
```

- A: `inner bound`
- B: `outer outer`
- C: `outer bound`
- D: `inner inner`

> The arrow function took its `this` from the `make` call, where `call` set it to `{ tag: "outer" }`. An arrow function's `this` is lexical: `call`, `apply` and `bind` can still pass arguments to it, but they cannot change its `this`.

## javascript-intermediate-006
topic: this-binding
answer: B, D, E

Given this function:

```javascript
function total(a, b, c) {
  return this.base + a + b + c;
}
const ctx = { base: 100 };
```

Which of these calls return `106`? Select all that apply.

- A: `total.call(ctx, [1, 2, 3])`
- B: `total.call(ctx, 1, 2, 3)`
- C: `total.apply(ctx, 1, 2, 3)`
- D: `total.apply(ctx, [1, 2, 3])`
- E: `total.bind(ctx, 1)(2, 3)`

> `call` takes the arguments one by one, `apply` takes them as a single array, and `bind` returns a function with `this` and any leading arguments fixed — so B, D and E all run `total` with `this === ctx` and `1, 2, 3`. A passes the whole array as `a`, and `100 + [1, 2, 3]` is string concatenation (`"1001,2,3undefinedundefined"`). C throws a `TypeError`, because `apply`'s second argument must be array-like.

## javascript-intermediate-007
topic: this-binding
answer: C
run: javascript

What does this script print?

```javascript
class Button {
  label = "save";
  onClickMethod() {
    return this ? this.label : "lost";
  }
  onClickArrow = () => (this ? this.label : "lost");
}
const button = new Button();
function fire(handler) {
  return handler();
}
console.log(fire(button.onClickMethod), fire(button.onClickArrow));
```

- A: `save save`
- B: `save lost`
- C: `lost save`
- D: `lost lost`

> `onClickMethod` lives on the prototype and `fire` calls it as a plain function; class code is strict, so `this` is `undefined`. `onClickArrow` is a class field: an arrow function created by the constructor for each instance, so its `this` is lexically that instance wherever it is called from.

## javascript-intermediate-008
topic: this-binding
answer: A
run: javascript

What does this script print?

```javascript
class Repo {
  static create() {
    return new this();
  }
  describe() {
    return this.constructor.name;
  }
}
class UserRepo extends Repo {}
console.log(UserRepo.create().describe(), Repo.create().describe());
```

- A: `UserRepo Repo`
- B: `Repo Repo`
- C: `UserRepo UserRepo`
- D: It throws a `TypeError`.

> In a static method `this` is whatever the method was called on. `UserRepo` inherits `create` from `Repo` (a subclass constructor's prototype is the parent constructor), and `UserRepo.create()` runs with `this === UserRepo`, so `new this()` builds a `UserRepo`. `Repo.create()` builds a `Repo`.

## javascript-intermediate-009
topic: this-binding
answer: A, D, E

When this timer fires, the instance's `count` is not incremented:

```javascript
class Clock {
  count = 0;
  start() {
    setTimeout(this.tick, 1000);
  }
  tick() {
    this.count++;
  }
}
```

Which changes make `tick` run one second later with `this` set to the `Clock` instance? Select all that apply.

- A: In `start`, use `setTimeout(() => this.tick(), 1000);`
- B: In `start`, use `setTimeout(this.tick.call(this), 1000);`
- C: In `start`, use `setTimeout(function () { this.tick(); }, 1000);`
- D: In `start`, use `setTimeout(this.tick.bind(this), 1000);`
- E: Leave `start` alone and declare `tick = () => { this.count++; };` as a class field.

> `this.tick` hands over the function alone, so the timer later calls it without the instance. An arrow wrapper (A) uses `start`'s `this`, `bind` (D) returns a function whose `this` is fixed, and an arrow-function class field (E) is created per instance with `this` captured lexically. B calls `tick` immediately and passes its return value (`undefined`) to `setTimeout`; in C the regular function gets the timer's own `this`, not the instance.

## javascript-intermediate-010
topic: objects-prototypes
answer: D
run: javascript

What does this script print?

```javascript
const base = {
  kind: "base",
  describe() {
    return this.kind;
  },
};
const child = Object.create(base);
child.kind = "child";
console.log(child.describe(), base.describe());
```

- A: `base base`
- B: `child child`
- C: `base child`
- D: `child base`

> `child` has no `describe` of its own, so the lookup walks up the prototype chain to `base` — but `this` is still the object the method was called on. `child.describe()` reads `child.kind`, an own property that shadows the inherited one; `base.describe()` reads `base.kind`.

## javascript-intermediate-011
topic: objects-prototypes
answer: C
run: javascript

What does this script print?

```javascript
const proto = { shared: 1 };
const obj = Object.create(proto);
obj.own = 2;
const seen = [];
for (const key in obj) seen.push(key);
console.log(Object.keys(obj).length, seen.length, "shared" in obj, obj.hasOwnProperty("shared"));
```

- A: `2 2 true true`
- B: `1 1 false false`
- C: `1 2 true false`
- D: `1 2 false false`

> `Object.keys` lists only own enumerable properties (`own`), while `for...in` also visits enumerable inherited ones (`own` and `shared`). The `in` operator searches the whole prototype chain; `hasOwnProperty` checks only the object itself.

## javascript-intermediate-012
topic: objects-prototypes
answer: A
run: javascript

What does this script print?

```javascript
"use strict";
const config = Object.freeze({ port: 80, tags: ["a"] });
config.tags.push("b");
let result;
try {
  config.port = 8080;
  result = "assigned";
} catch (e) {
  result = e.name;
}
console.log(result, config.port, config.tags.length);
```

- A: `TypeError 80 2`
- B: `TypeError 80 1`
- C: `assigned 80 2`
- D: `assigned 8080 1`

> `Object.freeze` is shallow: the `tags` array is a separate object and stays mutable, so `push` works. Assigning to a property of the frozen object fails, and in strict mode that failure is a `TypeError` (sloppy mode would ignore it silently).

## javascript-intermediate-013
topic: objects-prototypes
answer: B
run: javascript

What does this script print?

```javascript
class Base {
  constructor() {
    this.log = [];
    this.init();
  }
  init() {
    this.log.push("base");
  }
}
class Derived extends Base {
  label = "derived";
  init() {
    this.log.push("derived:" + this.label);
  }
}
console.log(new Derived().log.join(","));
```

- A: `derived:derived`
- B: `derived:undefined`
- C: `base`
- D: `base,derived:derived`

> The base constructor calls `this.init()`, which dispatches to `Derived`'s override because `this` is already a `Derived` instance. But a derived class's fields are initialised only after `super()` returns, so `label` does not exist yet while the base constructor is running.

## javascript-intermediate-014
topic: objects-prototypes
answer: D
run: javascript

What does this script print?

```javascript
const o = {};
Object.defineProperty(o, "id", { value: 1 });
const d = Object.getOwnPropertyDescriptor(o, "id");
console.log(d.writable, d.enumerable, d.configurable, JSON.stringify(o));
```

- A: `true true true {"id":1}`
- B: `false true false {"id":1}`
- C: `true false true {}`
- D: `false false false {}`

> Attributes left out of an `Object.defineProperty` descriptor default to `false`, so `id` is read-only, non-enumerable and non-configurable. `JSON.stringify`, like `Object.keys`, skips non-enumerable properties, so it prints `{}`. A plain assignment `o.id = 1` would have made all three attributes `true`.

## javascript-intermediate-015
topic: objects-prototypes
answer: C
run: javascript

What does this script print?

```javascript
function Car() {}
const before = new Car();
Car.prototype = { wheels: 4 };
const after = new Car();
console.log(before instanceof Car, after instanceof Car, before.wheels, after.wheels);
```

- A: `true true 4 4`
- B: `true true undefined 4`
- C: `false true undefined 4`
- D: `false false undefined 4`

> An object's prototype is fixed when it is created, so `before` still links to the old `Car.prototype` object. `instanceof` asks whether the *current* `Car.prototype` is on the object's chain, which is true only for `after` — and only `after` inherits `wheels`.

## javascript-intermediate-016
topic: objects-prototypes
answer: B, D

Given `class Animal {}` and `class Dog extends Animal {}`, which of these expressions are `true`? Select all that apply.

- A: `Dog.prototype.constructor === Animal`
- B: `Object.getPrototypeOf(Dog.prototype) === Animal.prototype`
- C: `Object.getPrototypeOf(new Dog()) === Animal.prototype`
- D: `Object.getPrototypeOf(Dog) === Animal`

> `extends` links two chains: the one instances use (`Dog.prototype` inherits from `Animal.prototype`, B) and the constructors themselves (`Dog` inherits from `Animal`, D — which is how static methods are inherited). A `Dog` instance's own prototype is `Dog.prototype`, not `Animal.prototype` (C), and `Dog.prototype.constructor` is `Dog` (A).

## javascript-intermediate-017
topic: objects-prototypes
answer: A
run: javascript

What does this script print?

```javascript
const proto = { list: [], count: 0 };
const a = Object.create(proto);
const b = Object.create(proto);
a.list.push("x");
a.count++;
console.log(b.list.length, b.count, a.hasOwnProperty("list"), a.hasOwnProperty("count"));
```

- A: `1 0 false true`
- B: `0 0 false true`
- C: `1 1 false false`
- D: `0 0 true true`

> `a.list.push(...)` only *reads* `list`: it finds the one array on `proto` and mutates it, so `b` sees the change. `a.count++` *assigns*, and assignment creates an own property on `a` that shadows the inherited `count`; `proto.count`, which `b` reads, stays `0`.

## javascript-intermediate-018
topic: objects-prototypes
answer: B

Given this class:

```javascript
class Account {
  balance = 0;
  deposit(amount) {
    this.balance += amount;
  }
  static open() {
    return new Account();
  }
}
const acc = new Account();
```

Which expression is `true`?

- A: `acc.hasOwnProperty("deposit")`
- B: `acc.hasOwnProperty("balance")`
- C: `Account.prototype.hasOwnProperty("balance")`
- D: `Account.prototype.hasOwnProperty("open")`

> Class fields are created on each instance when it is constructed, so `balance` is an own property of `acc` and not of the prototype. Methods are defined once on `Account.prototype` and inherited, so `deposit` is not an own property of `acc`; static methods live on the `Account` constructor itself, not on its prototype.

## javascript-intermediate-019
topic: functions-closures
answer: D
run: javascript

What does this script print?

```javascript
const out = [];
for (var i = 0; i < 3; i++) {
  setTimeout(() => out.push(i), 0);
}
for (let j = 0; j < 3; j++) {
  setTimeout(() => out.push(j), 0);
}
setTimeout(() => console.log(out.join(" ")), 0);
```

- A: `0 1 2 0 1 2`
- B: `3 3 3 3 3 3`
- C: `0 1 2 3 3 3`
- D: `3 3 3 0 1 2`

> `var` creates one function-scoped `i` shared by all three callbacks, and by the time the timers run the loop has left it at `3`. `let` in a `for` header creates a fresh binding for every iteration, so each callback closes over its own `j`. Timers with the same delay run in the order they were scheduled.

## javascript-intermediate-020
topic: functions-closures
answer: C
run: javascript

What does this script print?

```javascript
function makeCounter() {
  let n = 0;
  return { inc: () => ++n, get: () => n };
}
const a = makeCounter();
const b = makeCounter();
a.inc();
a.inc();
b.inc();
const { inc } = a;
inc();
console.log(a.get(), b.get());
```

- A: `2 1`
- B: `4 4`
- C: `3 1`
- D: `3 3`

> Each `makeCounter()` call creates a new `n`, so `a` and `b` count separately. Destructuring `inc` out of `a` changes nothing: it is an arrow function that closes over `a`'s `n` and never used `this`, so the third increment still lands on `a`'s counter.

## javascript-intermediate-021
topic: functions-closures
answer: A
run: javascript

What does this script print?

```javascript
var fns = [];
for (var i = 0; i < 3; i++) {
  (function (k) {
    fns.push(function () {
      return k * 10;
    });
  })(i);
}
console.log(fns.map(function (f) { return f(); }).join(" "));
```

- A: `0 10 20`
- B: `30 30 30`
- C: `0 0 0`
- D: `20 20 20`

> The immediately invoked function expression runs once per iteration and receives the current value of `i` as its own parameter `k`. Each pushed function closes over a different `k` (0, 1, 2) instead of the shared `var i`, which ends at 3 — the classic fix for loop closures before `let` existed.

## javascript-intermediate-022
topic: functions-closures
answer: B
run: javascript

What does this script print?

```javascript
function curry(fn) {
  return function curried(...args) {
    return args.length >= fn.length
      ? fn(...args)
      : (...more) => curried(...args, ...more);
  };
}
const add = curry((a, b, c) => a + b + c);
const greet = curry((greeting, name = "you") => greeting + ", " + name);
console.log(add(1)(2)(3) + " | " + greet("Hi"));
```

- A: `6 | Hi, undefined`
- B: `6 | Hi, you`
- C: `6 | (...more) => curried(...args, ...more)`
- D: It throws a `TypeError`.

> `fn.length` counts only the parameters before the first one with a default value, so `greet`'s function has a length of 1. `greet("Hi")` therefore already has enough arguments: the function is called at once and the default fills `name`. Had the length been 2, `greet("Hi")` would have returned the partial function, and the concatenation would print its source text (C).

## javascript-intermediate-023
topic: functions-closures
answer: D
run: javascript

What does this script print?

```javascript
function memoize(fn) {
  const cache = {};
  return (arg) => {
    if (!(arg in cache)) cache[arg] = fn(arg);
    return cache[arg];
  };
}
let calls = 0;
const kind = memoize((x) => {
  calls++;
  return typeof x;
});
console.log(kind(1), kind("1"), calls);
```

- A: `number string 2`
- B: `number string 1`
- C: `string string 1`
- D: `number number 1`

> Plain-object property keys are always strings (or symbols), so `1` and `"1"` both become the key `"1"`. The second call finds the cached `"number"` and never calls `fn`. A `Map`, which keeps the number `1` and the string `"1"` apart, would have printed `number string 2`.

## javascript-intermediate-024
topic: functions-closures
answer: C
run: javascript

What does this script print?

```javascript
let x = "global";
function outer() {
  const read = () => x;
  let x = "outer";
  return read();
}
console.log(outer());
```

- A: `global`
- B: `undefined`
- C: `outer`
- D: It throws a `ReferenceError`.

> Inside `read`, `x` resolves lexically to the nearest enclosing declaration, which is `outer`'s `let x` — it shadows the global `x` for the whole function body. A closure captures the binding, not a value, and `read` is only *called* after `let x = "outer"` has run, so the temporal dead zone is already over.

## javascript-intermediate-025
topic: functions-closures
answer: A
run: javascript

What does this script print?

```javascript
function once(fn) {
  let done = false;
  let result;
  return function (...args) {
    if (!done) {
      done = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}
let total = 0;
const init = once((x) => (total += x));
console.log(init(5), init(10), total);
```

- A: `5 5 5`
- B: `5 10 15`
- C: `5 undefined 5`
- D: `5 10 5`

> `done` and `result` live in the closure created by the single `once(...)` call, so every call of `init` shares them. The first call runs `fn` and stores `5`; later calls skip `fn` and return the stored result, so `total` is increased only once.
