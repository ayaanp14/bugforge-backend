---
skill: javascript
level: basic
---

## javascript-basic-001
topic: types-coercion
answer: C
run: javascript

What does this program print?

```javascript
console.log(typeof null, typeof undefined, typeof NaN);
```

- A: `null undefined number`
- B: `object undefined NaN`
- C: `object undefined number`
- D: `object object number`

> `typeof null` is `"object"`, a quirk kept from the first version of the
> language. `typeof undefined` is `"undefined"`. `NaN` ("not a number") is still
> a value of the number type, so `typeof NaN` is `"number"`.

## javascript-basic-002
topic: scope-hoisting
answer: A
run: javascript

What does this program print?

```javascript
var level = "global";
function show() {
  const first = String(level);
  var level = "local";
  return first + " " + level;
}
console.log(show());
```

- A: `undefined local`
- B: `global local`
- C: `local local`
- D: It throws a `ReferenceError`.

> The `var level` inside `show` is hoisted to the top of the function: the
> declaration (not the assignment) happens first, and it is initialised to
> `undefined`. That local `level` shadows the global one for the whole function,
> so `first` is `"undefined"`, and after the assignment `level` is `"local"`.
> A `let` in the same place would have thrown a `ReferenceError` instead.

## javascript-basic-003
topic: functions-closures
answer: D
run: javascript

What does this program print?

```javascript
function makeCounter() {
  let count = 0;
  return function () {
    count += 1;
    return count;
  };
}
const a = makeCounter();
const b = makeCounter();
a();
a();
console.log(a(), b());
```

- A: `3 4`
- B: `1 1`
- C: `2 1`
- D: `3 1`

> Each call to `makeCounter` creates a new `count` variable, and the returned
> function closes over that one. `a` has been called twice before the
> `console.log`, so its third call returns 3. `b` has its own `count`, which
> starts at 0, so its first call returns 1.

## javascript-basic-004
topic: arrays
answer: B
run: javascript

What does this program print?

```javascript
const a = [1, 2, 3];
a.push(4);
a.shift();
a.unshift(0);
a.pop();
console.log(a.join(" "));
```

- A: `1 2 3`
- B: `0 2 3`
- C: `0 1 2 3`
- D: `2 3 4`

> `push(4)` adds to the end: `[1, 2, 3, 4]`. `shift()` removes the first
> element: `[2, 3, 4]`. `unshift(0)` adds to the front: `[0, 2, 3, 4]`. `pop()`
> removes the last element: `[0, 2, 3]`. Mixing up which end `shift` and `pop`
> work on gives `1 2 3`.

## javascript-basic-005
topic: strings-numbers
answer: C
run: javascript

What does this program print?

```javascript
const s = "banana";
const t = s.replace("a", "o");
s.slice(2);
console.log(s, t);
```

- A: `banana bonono`
- B: `nana bonana`
- C: `banana bonana`
- D: `bonana bonana`

> Strings are immutable: `replace` and `slice` return new strings and leave `s`
> as it was, so the discarded `s.slice(2)` changes nothing. `replace` with a
> string pattern replaces only the first match, so only the first `a` becomes
> `o` (`replaceAll`, or a regular expression with the `g` flag, would replace
> all three).

## javascript-basic-006
topic: objects-prototypes
answer: A
run: javascript

What does this program print?

```javascript
const a = { count: 1 };
const b = a;
b.count += 1;
console.log(a.count, a === b);
```

- A: `2 true`
- B: `1 true`
- C: `1 false`
- D: `2 false`

> `const b = a` copies the reference, not the object: both variables point at
> the same object. Changing `b.count` changes the one object, so `a.count` is 2,
> and `a === b` compares references, which are the same.

## javascript-basic-007
topic: modern
answer: D
run: javascript

What does this program print?

```javascript
const a = 3;
const b = 4;
console.log(`${a} + ${b} = ${a + b}`);
```

- A: `3 + 4 = 34`
- B: `${a} + ${b} = ${a + b}`
- C: `a + b = 7`
- D: `3 + 4 = 7`

> In a template literal (backticks), each `${...}` is evaluated as a
> JavaScript expression and the result is inserted. `a + b` adds two numbers,
> giving 7; the text outside the placeholders is kept as written.

## javascript-basic-008
topic: errors
answer: B
run: javascript

What does this program print?

```javascript
const log = [];
try {
  log.push("try");
  throw new Error("boom");
  log.push("after");
} catch (e) {
  log.push("catch:" + e.message);
} finally {
  log.push("finally");
}
console.log(log.join(" "));
```

- A: `try after catch:boom finally`
- B: `try catch:boom finally`
- C: `try catch:boom`
- D: `catch:boom finally`

> The `try` block runs until the `throw`; the line after it never runs. Control
> jumps to `catch`, whose `e.message` is `"boom"`. The `finally` block always
> runs last, whether or not an error was thrown.

## javascript-basic-009
topic: types-coercion
answer: A
run: javascript

What does this program print?

```javascript
console.log(1 + 2 + "3", "1" + 2 + 3);
```

- A: `33 123`
- B: `123 123`
- C: `6 123`
- D: `33 15`

> `+` is evaluated left to right. In `1 + 2 + "3"`, `1 + 2` is numeric addition
> (3), then `3 + "3"` meets a string and concatenates: `"33"`. In
> `"1" + 2 + 3`, the first `+` already has a string, so it concatenates
> (`"12"`), and so does the second: `"123"`.

## javascript-basic-010
topic: scope-hoisting
answer: C

What happens when this script runs?

```javascript
console.log(total);
let total = 10;
```

- A: It prints `undefined`.
- B: It prints `10`.
- C: It throws a `ReferenceError`.
- D: It prints `null`.

> A `let` (or `const`) binding exists from the start of its scope but is not
> initialised until its declaration line runs. Reading it before then — the
> "temporal dead zone" — throws `ReferenceError: Cannot access 'total' before
> initialization`. With `var` the same code would print `undefined`.

## javascript-basic-011
topic: functions-closures
answer: B
run: javascript

What does this program print?

```javascript
function size(n = 10) {
  return n;
}
console.log(size(null), size(), size(0));
```

- A: `10 10 10`
- B: `null 10 0`
- C: `10 10 0`
- D: `null 10 10`

> A default parameter is used only when the argument is `undefined` — missing,
> or passed as `undefined`. `null` and `0` are real arguments, even though they
> are falsy, so they are returned unchanged. Only `size()` gets the default 10.

## javascript-basic-012
topic: arrays
answer: D
run: javascript

What does this program print?

```javascript
const a = [10, 20, 30, 40, 50];
const s = a.slice(1, 3);
const t = a.splice(1, 3);
console.log(s.join(","), t.join(","), a.join(","));
```

- A: `20,30 20,30 10,40,50`
- B: `20,30,40 20,30,40 10,50`
- C: `20,30 20,30,40 10,20,30,40,50`
- D: `20,30 20,30,40 10,50`

> `slice(1, 3)` copies from index 1 up to (not including) index 3 — `[20, 30]` —
> and leaves `a` alone. `splice(1, 3)` means "at index 1, remove 3 elements": it
> returns the removed `[20, 30, 40]` and changes `a` itself to `[10, 50]`. The
> second argument of `slice` is an end index; the second argument of `splice`
> is a count.

## javascript-basic-013
topic: this-binding
answer: A
run: javascript

What does this program print?

```javascript
const counter = {
  count: 0,
  isSelf() {
    return this === counter;
  },
};
const detached = counter.isSelf;
console.log(counter.isSelf(), detached());
```

- A: `true false`
- B: `true true`
- C: `false false`
- D: `false true`

> `this` is decided by how a function is called, not where it was defined.
> `counter.isSelf()` is a method call, so `this` is `counter`. `detached()` is a
> plain call of the same function: `this` is `undefined` in strict mode, or the
> global object otherwise — never `counter`, so it returns `false`.

## javascript-basic-014
topic: strings-numbers
answer: D
run: javascript

What does this program print?

```javascript
const sum = 0.1 + 0.2;
console.log(sum === 0.3, sum.toFixed(2));
```

- A: `true 0.30`
- B: `false 0.3`
- C: `true 0.3`
- D: `false 0.30`

> Numbers are binary floating point, and neither 0.1 nor 0.2 is exact in
> binary, so the sum is `0.30000000000000004` and is not equal to `0.3`.
> `toFixed(2)` rounds to two decimals and returns a string, keeping the trailing
> zero: `"0.30"`.

## javascript-basic-015
topic: objects-prototypes
answer: C
run: javascript

What does this program print?

```javascript
const user = { name: "Ana", age: 30, city: "Pune" };
delete user.age;
user.role = "admin";
console.log(Object.keys(user).join(","));
```

- A: `name,age,city,role`
- B: `name,city`
- C: `name,city,role`
- D: `role,name,city`

> `delete` removes the property entirely (it does not leave it set to
> `undefined`), so `age` is no longer a key. Assigning to a new property adds
> it. `Object.keys` lists string keys in the order they were added, so `role`
> comes last.

## javascript-basic-016
topic: types-coercion
answer: A, D, E

Which of these values are falsy in JavaScript? Select all that apply.

- A: `0`
- B: `"0"`
- C: `[]`
- D: `""`
- E: `null`
- F: `"false"`

> The falsy values are `false`, `0`, `-0`, `0n`, `""`, `null`, `undefined` and
> `NaN`. Every other value is truthy — including any non-empty string (`"0"`,
> `"false"`) and every object, an empty array included.

## javascript-basic-017
topic: functions-closures
answer: B

Which statement about arrow functions is true?

- A: It can be called with `new` to construct a new object.
- B: With an expression body, it returns the value without `return`.
- C: It has its own `arguments` object, like a regular function.
- D: Assigned to a `const`, it can be called before that line runs.

> `x => x * 2` returns `x * 2` implicitly; only a braced body needs `return`.
> The others are false: arrow functions are not constructors (`new` throws a
> `TypeError`), they have no `arguments` of their own (use rest parameters), and
> a `const` is in the temporal dead zone until its line runs, so an early call
> throws a `ReferenceError`.

## javascript-basic-018
topic: async
answer: C
run: javascript

What does this program print?

```javascript
const out = [];
setTimeout(() => {
  out.push("timeout");
  console.log(out.join(" "));
}, 0);
Promise.resolve().then(() => out.push("then"));
out.push("sync");
```

- A: `timeout then sync`
- B: `sync timeout then`
- C: `sync then timeout`
- D: `then sync timeout`

> Synchronous code always runs to completion first, so `"sync"` is pushed
> before any callback. Then the promise callback runs: promise reactions
> (microtasks) are all handled before the next timer callback, even a 0 ms one.
> The timer runs last and prints.

## javascript-basic-019
topic: arrays
answer: A

Given `const nums = [1, 2, 3, 4];`, which expression returns a new array holding only the even numbers, and leaves `nums` unchanged?

- A: `nums.filter(n => n % 2 === 0)`
- B: `nums.map(n => n % 2 === 0)`
- C: `nums.find(n => n % 2 === 0)`
- D: `nums.forEach(n => n % 2 === 0)`

> `filter` keeps the elements for which the callback returns a truthy value:
> `[2, 4]`. `map` returns the callback's results, `[false, true, false, true]`.
> `find` returns only the first match, the number `2`. `forEach` always returns
> `undefined`.

## javascript-basic-020
topic: strings-numbers
answer: B

Which expression evaluates to `3`, the whole-number part of 7 divided by 2?

- A: `7 / 2`
- B: `Math.floor(7 / 2)`
- C: `7 % 2`
- D: `Math.round(7 / 2)`

> JavaScript has one number type and no integer division: `7 / 2` is `3.5`.
> `Math.floor(3.5)` rounds down to `3`. `7 % 2` is the remainder, `1`, and
> `Math.round(3.5)` rounds half up to `4`.

## javascript-basic-021
topic: modern
answer: C
run: javascript

What does this program print?

```javascript
const user = { name: "Ana", role: "admin" };
const { name: userName, age = 18, role } = user;
console.log(userName, age, role);
```

- A: `name 18 admin`
- B: `Ana undefined admin`
- C: `Ana 18 admin`
- D: `undefined 18 admin`

> `name: userName` reads `user.name` into a new variable called `userName`.
> `age = 18` is a default, used because `user.age` is `undefined`. `role` is
> shorthand for `role: role`. So the three variables hold `"Ana"`, `18` and
> `"admin"`.

## javascript-basic-022
topic: errors
answer: D

What happens when this script runs?

```javascript
const user = {};
console.log(user.profile.name);
```

- A: It prints `undefined`.
- B: It prints `null`.
- C: It throws a `ReferenceError`.
- D: It throws a `TypeError`.

> Reading a missing property is not an error: `user.profile` is `undefined`.
> But reading a property *of* `undefined` is: `undefined.name` throws
> `TypeError: Cannot read properties of undefined`. A `ReferenceError` is for a
> variable name that does not exist, and `user` does exist.

## javascript-basic-023
topic: types-coercion
answer: D

Which of these expressions evaluates to `false`?

- A: `null == undefined`
- B: `"" == 0`
- C: `"1" == 1`
- D: `null == 0`

> With loose equality, `null` and `undefined` equal each other and nothing
> else, so `null == 0` is `false` — `null` is not converted to a number by
> `==`. When a string meets a number, the string is converted: `""` becomes
> `0` and `"1"` becomes `1`, so B and C are `true`, and A is `true` by the
> `null`/`undefined` rule.

## javascript-basic-024
topic: objects-prototypes
answer: B

With `const field = "total";` in scope, which object literal creates an object whose only property is `total`, with the value `5`?

- A: `{ field: 5 }`
- B: `{ [field]: 5 }`
- C: `{ "field": 5 }`
- D: `{ (field): 5 }`

> A bare or quoted name is taken literally, so A and C both create a property
> called `field`. Square brackets make a computed property name: the expression
> inside is evaluated and its value, `"total"`, becomes the key. Parentheses are
> not allowed there and are a `SyntaxError`.

## javascript-basic-025
topic: scope-hoisting
answer: A
run: javascript

What does this program print?

```javascript
console.log(greet("Ana"));

function greet(name) {
  return "Hi " + name;
}
```

- A: `Hi Ana`
- B: `undefined`
- C: It throws a `ReferenceError`.
- D: It throws a `TypeError`.

> A function declaration is hoisted together with its body, so it can be
> called on a line above the one that declares it. (A function *expression*
> assigned to a `var` would throw a `TypeError` here, and one assigned to a
> `let` or `const` a `ReferenceError`.)
