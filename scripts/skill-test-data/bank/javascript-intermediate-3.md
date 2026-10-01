---
skill: javascript
level: intermediate
---

## javascript-intermediate-051
topic: types-coercion
answer: B

Which of these expressions evaluates to `true`?

- A: `null == false`
- B: `"0" == false`
- C: `undefined == 0`
- D: `NaN == NaN`

> When one side of `==` is a boolean, it is converted to a number first: `false` becomes `0`, the string `"0"` also becomes `0`, so B is true. `null` and `undefined` are loosely equal only to each other, so A and C are false, and `NaN` is not equal to anything, itself included.

## javascript-intermediate-052
topic: arrays
answer: C
run: javascript

What does this script print?

```javascript
console.log([10, 9, 1, 100, 25].sort().join(" "));
```

- A: `1 9 10 25 100`
- B: `100 25 10 9 1`
- C: `1 10 100 25 9`
- D: `10 9 1 100 25`

> Without a comparator, `sort` converts the elements to strings and orders them by UTF-16 code units, so `"10"` and `"100"` come before `"25"`, and `"9"` comes last. To sort numbers, pass a comparator such as `(a, b) => a - b`.

## javascript-intermediate-053
topic: arrays
answer: A
run: javascript

What does this script print?

```javascript
const original = [5, 1, 4];
const sorted = original.sort((a, b) => b - a);
sorted.push(0);
console.log(original.join(","), sorted === original);
```

- A: `5,4,1,0 true`
- B: `5,1,4 false`
- C: `5,1,4,0 true`
- D: `1,4,5,0 true`

> `sort` sorts the array in place and returns that same array, not a copy, so `sorted` and `original` are one object and the `push` shows up in both. The comparator `b - a` sorts in descending order.

## javascript-intermediate-054
topic: arrays
answer: D
run: javascript

What does this script print?

```javascript
const items = [{ qty: 2 }, { qty: 3 }];
const a = items.reduce((sum, item) => sum + item.qty, 0);
const b = items.reduce((sum, item) => sum + item.qty);
console.log(a, b);
```

- A: `5 5`
- B: `5 NaN`
- C: `5 [object Object]23`
- D: `5 [object Object]3`

> Without an initial value, `reduce` uses the first element as the starting accumulator and begins with the second — the first element is not visited again. So `sum` is the object `{ qty: 2 }`, and `object + 3` converts the object to the string `"[object Object]"` and concatenates. Pass an initial value whenever the accumulator's type differs from the elements'.

## javascript-intermediate-055
topic: arrays
answer: B
run: javascript

What does this script print?

```javascript
const grid = new Array(2).fill([]);
grid[0].push("x");
console.log(grid[0].length, grid[1].length, grid[0] === grid[1]);
```

- A: `1 0 false`
- B: `1 1 true`
- C: `1 0 true`
- D: `0 0 false`

> The argument to `fill` is evaluated once, and that one array is stored in every slot, so both rows are the same object and a `push` through either is seen through both. Build independent rows with `Array.from({ length: 2 }, () => [])`, which calls the function once per slot.

## javascript-intermediate-056
topic: arrays
answer: C
run: javascript

What does this script print?

```javascript
const arr = [1, , 3];
let visits = 0;
arr.forEach(() => visits++);
console.log(arr.length, visits, arr.map((x) => x * 2).length, 1 in arr, Object.keys(arr).length);
```

- A: `3 3 3 true 3`
- B: `2 2 2 false 2`
- C: `3 2 3 false 2`
- D: `3 2 2 false 2`

> `[1, , 3]` has length 3 but no element at index 1 — a hole, not an `undefined` value. `forEach` and `map` skip holes (`map` keeps the length and leaves the hole in place), `in` reports that index 1 does not exist, and `Object.keys` lists only `"0"` and `"2"`.

## javascript-intermediate-057
topic: arrays
answer: A
run: javascript

What does this script print?

```javascript
const a = Array(3).map((_, i) => i);
const b = Array.from({ length: 3 }, (_, i) => i);
console.log(JSON.stringify(a), JSON.stringify(b));
```

- A: `[null,null,null] [0,1,2]`
- B: `[0,1,2] [0,1,2]`
- C: `[] [0,1,2]`
- D: `[undefined,undefined,undefined] [0,1,2]`

> `Array(3)` creates an array of three holes, and `map` skips holes, so its result is three holes too; `JSON.stringify` writes holes (like `undefined` elements) as `null`. `Array.from` visits every index from `0` to `length - 1` and calls the mapping function for each.

## javascript-intermediate-058
topic: arrays
answer: B, D, E

Given `const arr = [3, 1, 2];`, which of these calls change `arr` itself? Select all that apply.

- A: `arr.slice(1)`
- B: `arr.sort()`
- C: `arr.concat([4])`
- D: `arr.reverse()`
- E: `arr.splice(0, 1)`
- F: `arr.map((x) => x * 2)`

> `sort`, `reverse` and `splice` work in place (`sort` and `reverse` even return the same array). `slice`, `concat` and `map` leave `arr` untouched and return a new array.

## javascript-intermediate-059
topic: modern
answer: D
run: javascript

What does this script print?

```javascript
const s = { retries: 0, label: "", timeout: null };
console.log(JSON.stringify([s.retries || 3, s.retries ?? 3, s.label ?? "none", s.timeout ?? 1000]));
```

- A: `[3,3,"none",1000]`
- B: `[0,0,"",null]`
- C: `[3,0,"none",1000]`
- D: `[3,0,"",1000]`

> `||` falls back on any falsy value, so `0 || 3` is `3`. `??` falls back only on `null` or `undefined`, so `0` and `""` are kept, while `null ?? 1000` is `1000`.

## javascript-intermediate-060
topic: modern
answer: B
run: javascript

What does this script print?

```javascript
const user = {
  profile: null,
  getName() {
    return "Ada";
  },
};
console.log(
  String(user.profile?.email),
  String(user.settings?.theme.color),
  user.getName?.(),
  String(user.getAge?.())
);
```

- A: `null undefined Ada undefined`
- B: `undefined undefined Ada undefined`
- C: It throws a `TypeError` when it reads `.theme.color`.
- D: `null null Ada undefined`

> `?.` produces `undefined` (never `null`) when the value before it is `null` or `undefined`, and it short-circuits the *whole* rest of the chain: `user.settings?.theme.color` never evaluates `.theme.color`, so there is no `TypeError`. `?.()` calls a method only if it exists.

## javascript-intermediate-061
topic: modern
answer: C
run: javascript

What does this script print?

```javascript
function* gen() {
  const x = yield 1;
  const y = yield x * 2;
  return x + y;
}
const it = gen();
const a = it.next().value;
const b = it.next(5).value;
const c = it.next(10);
const d = it.next();
console.log(a, b, c.value, c.done, d.value, d.done);
```

- A: `1 2 3 false undefined true`
- B: `1 NaN NaN true undefined true`
- C: `1 10 15 true undefined true`
- D: `1 10 15 false 15 true`

> The argument of `next(v)` becomes the value of the `yield` the generator is paused at: `x` is `5`, so the second `yield` produces `10`; then `y` is `10`, and `return` completes with `{ value: 15, done: true }`. A finished generator keeps answering `{ value: undefined, done: true }`.

## javascript-intermediate-062
topic: modern
answer: A
run: javascript

What does this script print?

```javascript
class Range {
  constructor(from, to) {
    this.from = from;
    this.to = to;
  }
  *[Symbol.iterator]() {
    for (let i = this.from; i <= this.to; i++) yield i;
  }
}
const r = new Range(2, 4);
console.log([...r].join(","), Math.max(...r), [...r].length + Array.from(r).length);
```

- A: `2,3,4 4 6`
- B: `2,3,4 -Infinity 0`
- C: `2,3,4 4 3`
- D: It throws a `TypeError`.

> Spread syntax, `Array.from` and `for...of` all call `r[Symbol.iterator]()`, and because that method is a generator, each call returns a fresh iterator — so the object can be iterated any number of times. An object whose `[Symbol.iterator]` returned the *same* iterator every time would be exhausted after the first spread.

## javascript-intermediate-063
topic: modern
answer: D
run: javascript

What does this script print?

```javascript
const m = new Map();
const o = {};
const k1 = { id: 1 };
const k2 = { id: 2 };
m.set(k1, "a").set(k2, "b");
o[k1] = "a";
o[k2] = "b";
m.set(1, "num").set("1", "str");
console.log(m.size, Object.keys(o).length, o[k1], m.get(1));
```

- A: `4 2 a num`
- B: `3 1 b str`
- C: `4 2 b num`
- D: `4 1 b num`

> A `Map` keeps keys as they are: two distinct objects, the number `1` and the string `"1"` are four separate entries. A plain object converts every key to a string, and both objects become `"[object Object]"`, so the second assignment overwrites the first.

## javascript-intermediate-064
topic: modern
answer: C

You cache computed data for objects that other code creates and later discards. Why choose a `WeakMap` over a `Map` for that cache?

- A: Its lookups are faster, because its keys are compared by identity.
- B: It accepts primitive keys such as strings, which `Map` does not.
- C: Its entries do not stop their keys from being garbage-collected.
- D: It can be iterated in insertion order, which makes eviction easy.

> A `Map` holds strong references to its keys, so a cached object can never be garbage-collected while the map lives — a leak. A `WeakMap` holds its keys weakly: once nothing else references a key object, its entry can be collected. In exchange, `WeakMap` keys must be objects (B has it backwards) and it cannot be iterated or sized (D); `Map` compares object keys by identity too (A).

## javascript-intermediate-065
topic: modern
answer: B
run: javascript

What does this script print?

```javascript
const original = { name: "cfg", nested: { level: 1 }, list: [1] };
const copy = { ...original };
copy.name = "copy";
copy.nested.level = 2;
copy.list = [...copy.list, 2];
console.log(original.name, original.nested.level, original.list.length);
```

- A: `cfg 1 1`
- B: `cfg 2 1`
- C: `copy 2 2`
- D: `cfg 2 2`

> Object spread copies only the top level: `copy.nested` is the same object as `original.nested`, so changing `level` through it is visible from both. Reassigning `copy.name` or `copy.list` replaces the copy's own property and leaves `original` untouched.

## javascript-intermediate-066
topic: modern
answer: A
run: javascript

What does this script print?

```javascript
const temp = {
  _c: 25,
  get f() {
    return (this._c * 9) / 5 + 32;
  },
  set f(value) {
    this._c = ((value - 32) * 5) / 9;
  },
};
temp.f = 212;
const copy = { ...temp };
temp.f = 32;
console.log(temp._c, copy.f, typeof Object.getOwnPropertyDescriptor(copy, "f").get);
```

- A: `0 212 undefined`
- B: `0 32 function`
- C: `100 212 function`
- D: `0 212 function`

> Assigning to `f` runs the setter: `212` sets `_c` to `100`, and `32` later sets it to `0`. Spread reads each property's *value* — calling the getter — and copies it as a plain data property, so `copy.f` is the number `212`, it does not follow `temp`, and its descriptor has no `get` function.

## javascript-intermediate-067
topic: modern
answer: D
run: javascript

What does this script print?

```javascript
function tag(strings, ...values) {
  return strings.length + ":" + values.length + ":" + strings.join("|");
}
const a = 1;
const b = 2;
console.log(tag`x${a}y${b}`);
```

- A: `2:2:x|y`
- B: `3:2:x|y`
- C: `2:2:x|y|`
- D: `3:2:x|y|`

> A tag function receives the literal text split around each substitution, so there is always exactly one more string than there are values. This template ends with the `b` substitution, so the last string is empty — the strings are `"x"`, `"y"` and `""` — and joining them gives `x|y|`.

## javascript-intermediate-068
topic: errors
answer: C
run: javascript

What does this script print?

```javascript
class NotFoundError extends Error {
  constructor(what) {
    super(what + " not found");
    this.status = 404;
  }
}
const err = new NotFoundError("user");
console.log(err instanceof NotFoundError, err.name, err.message, err.status);
```

- A: `true NotFoundError user not found 404`
- B: `false Error user not found 404`
- C: `true Error user not found 404`
- D: `true Error undefined 404`

> Extending `Error` with `class` gives a real subclass, so `instanceof` works, and `super(message)` sets `message`. But `name` is not taken from the class: it is inherited from `Error.prototype.name`, which is `"Error"`, unless the subclass sets `this.name` itself.

## javascript-intermediate-069
topic: errors
answer: B
run: javascript

What does this script print?

```javascript
function f() {
  try {
    return "try";
  } finally {
    return "final";
  }
}
function g() {
  try {
    throw new Error("boom");
  } catch (e) {
    return "catch";
  } finally {
    return "final";
  }
}
console.log(f(), g());
```

- A: `try catch`
- B: `final final`
- C: `try final`
- D: `final catch`

> A `return` inside `finally` replaces whatever the `try` or `catch` block was completing with — a pending return value, or even a pending exception. Both functions therefore return `"final"`, which is why linters flag `return` in a `finally` block.

## javascript-intermediate-070
topic: errors
answer: D

In Node.js 15 or later, with default settings and no `unhandledRejection` listener, a promise is rejected and no handler is ever attached to it. What happens?

- A: Nothing: the rejection is silently ignored.
- B: A warning is printed, and the process keeps running.
- C: The promise is retried once, and then the rejection is ignored.
- D: The process exits with an error, as for an uncaught exception.

> Since Node.js 15 the default `--unhandled-rejections` mode is `throw`: an unhandled rejection is raised as an uncaught exception, which — with no `uncaughtException` handler either — ends the process with a non-zero exit code. Only a warning (B) was the behaviour of older versions. Promises are never retried.

## javascript-intermediate-071
topic: errors
answer: A

What happens when this script runs in Node.js?

```javascript
try {
  setTimeout(() => {
    throw new Error("late");
  }, 0);
} catch (e) {
  console.log("caught " + e.message);
}
console.log("done");
```

- A: It prints `done`, then crashes with an uncaught `Error: late`.
- B: It prints `caught late`, then `done`, and exits normally.
- C: It prints `done`, then `caught late`, and exits normally.
- D: It crashes with an uncaught `Error: late` before printing anything.

> `try...catch` only covers code that runs while the `try` block is on the call stack. Here the `try` block merely schedules the callback and finishes; the callback throws later, from the event loop, where nothing catches it — an uncaught exception, which ends the process after `done` has been printed.

## javascript-intermediate-072
topic: strings-numbers
answer: C
run: javascript

What does this script print?

```javascript
const sum = 0.1 + 0.2;
console.log(sum === 0.3, sum.toFixed(2), Math.abs(sum - 0.3) < Number.EPSILON);
```

- A: `true 0.30 true`
- B: `false 0.3 false`
- C: `false 0.30 true`
- D: `false 0.30 false`

> `0.1` and `0.2` have no exact binary representation, and their sum is `0.30000000000000004`, so `===` with `0.3` is false. `toFixed(2)` rounds to a string with exactly two decimals (`"0.30"`), and the difference is about `5.6e-17`, smaller than `Number.EPSILON` (about `2.2e-16`).

## javascript-intermediate-073
topic: strings-numbers
answer: B
run: javascript

What does this script print?

```javascript
const max = Number.MAX_SAFE_INTEGER;
console.log(max + 1 === max + 2, String(BigInt(max) + 2n), typeof 10n);
```

- A: `false 9007199254740993 bigint`
- B: `true 9007199254740993 bigint`
- C: `true 9007199254740992 number`
- D: `false 9007199254740993 number`

> Above `Number.MAX_SAFE_INTEGER` (2^53 - 1) not every integer can be represented as a double: `max + 2` rounds to the same value as `max + 1`, so they compare equal. A `BigInt` holds integers of any size exactly, and `typeof` reports it as `"bigint"`.

## javascript-intermediate-074
topic: strings-numbers
answer: D
run: javascript

What does this script print?

```javascript
console.log(["1", "2", "3"].map(parseInt).join(" "), parseInt("08"), parseInt("0x1F"), parseInt("12px"));
```

- A: `1 2 3 8 31 12`
- B: `1 NaN NaN 0 31 NaN`
- C: `1 2 3 0 0 12`
- D: `1 NaN NaN 8 31 12`

> `map` passes `(value, index)`, so the calls are `parseInt("1", 0)` (radix 0 means "default": 1), `parseInt("2", 1)` (radix 1 is invalid: `NaN`) and `parseInt("3", 2)` (`3` is not a binary digit: `NaN`). Without a radix, a leading `0x` means hexadecimal but a leading `0` is plain decimal (since ES5), and parsing stops at the first character that is not a digit.

## javascript-intermediate-075
topic: strings-numbers
answer: A
run: javascript

What does this script print?

```javascript
let sum;
try {
  sum = 10n + 5;
} catch (e) {
  sum = e.name;
}
console.log(sum, String(7n / 2n), 2n == 2, 2n === 2);
```

- A: `TypeError 3 true false`
- B: `15 3.5 true true`
- C: `15n 3 true false`
- D: `TypeError 3.5 false false`

> Arithmetic cannot mix `BigInt` and `Number` operands: `10n + 5` throws a `TypeError` instead of guessing a conversion. `BigInt` division truncates toward zero, so `7n / 2n` is `3n`. Loose equality compares the mathematical values (`2n == 2` is true), while strict equality also compares the types.
