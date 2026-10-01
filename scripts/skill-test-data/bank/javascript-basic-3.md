---
skill: javascript
level: basic
---

## javascript-basic-051
topic: types-coercion
answer: D
run: javascript

What does this program print?

```javascript
console.log("5" - 2, "5" + 2, "5" * "2");
```

- A: `3 7 10`
- B: `52 52 10`
- C: `3 52 52`
- D: `3 52 10`

> `+` concatenates as soon as either side is a string, so `"5" + 2` is `"52"`.
> `-` and `*` only mean arithmetic, so they convert both sides to numbers:
> `"5" - 2` is 3 and `"5" * "2"` is 10.

## javascript-basic-052
topic: scope-hoisting
answer: A
run: javascript

What does this program print?

```javascript
function setup() {
  var count = 10;
  if (true) {
    var inner = 1;
  }
  return typeof inner;
}
console.log(setup(), typeof count);
```

- A: `number undefined`
- B: `undefined undefined`
- C: `number number`
- D: `undefined number`

> `var` is scoped to the whole function, not to the block it is written in, so
> `inner` is visible after the `if` and holds 1. `count` belongs to `setup`'s
> scope and does not exist outside it; `typeof` on a name that is not declared
> gives `"undefined"` instead of throwing.

## javascript-basic-053
topic: functions-closures
answer: C
run: javascript

What does this program print?

```javascript
function twice(fn, x) {
  return fn(fn(x));
}
console.log(twice(n => n * 3, 2));
```

- A: `6`
- B: `12`
- C: `18`
- D: `9`

> Functions are values and can be passed as arguments. `twice` calls the
> function it was given on 2 (giving 6), then calls it again on that result
> (giving 18).

## javascript-basic-054
topic: arrays
answer: B
run: javascript

What does this program print?

```javascript
const a = [1, 2, 3];
a[5] = 6;
console.log(a.length);
```

- A: `4`
- B: `6`
- C: `3`
- D: `5`

> An array's `length` is one more than its highest index. Assigning to index 5
> makes the highest index 5, so `length` becomes 6; indexes 3 and 4 are left
> as empty slots.

## javascript-basic-055
topic: strings-numbers
answer: A
run: javascript

What does this program print?

```javascript
const price = (19.999).toFixed(2);
console.log(price + 1);
```

- A: `20.001`
- B: `21`
- C: `21.00`
- D: `19.991`

> `toFixed(2)` rounds to two decimals — 19.999 becomes `"20.00"` — and returns
> a string, not a number. `"20.00" + 1` is then string concatenation:
> `"20.001"`. Convert first (`Number(price) + 1`) to get 21.

## javascript-basic-056
topic: objects-prototypes
answer: D
run: javascript

What does this program print?

```javascript
const obj = {};
obj[1] = "a";
obj["1"] = "b";
console.log(Object.keys(obj).length, obj[1]);
```

- A: `2 a`
- B: `2 b`
- C: `1 a`
- D: `1 b`

> Ordinary object property keys are strings: the number 1 used as a key is
> converted to `"1"`. So `obj[1]` and `obj["1"]` are the same property, the
> second assignment overwrites the first, and the object has one key.

## javascript-basic-057
topic: modern
answer: B
run: javascript

What does this program print?

```javascript
function tally(label, ...values) {
  return label + ":" + values.length + ":" + values[0];
}
console.log(tally("x", 5, 6, 7));
```

- A: `x:4:x`
- B: `x:3:5`
- C: `x:3:6`
- D: `x:1:5,6,7`

> The first argument fills `label`; the rest parameter `...values` collects
> every remaining argument into a real array, `[5, 6, 7]`. Its length is 3 and
> its first element is 5.

## javascript-basic-058
topic: errors
answer: C
run: javascript

What does this program print?

```javascript
try {
  throw new TypeError("bad input");
} catch (err) {
  console.log(err.name, err.message, err instanceof Error);
}
```

- A: `Error bad input true`
- B: `TypeError bad input false`
- C: `TypeError bad input true`
- D: `TypeError TypeError: bad input true`

> `name` is the error's type, `"TypeError"`, and `message` is just the text
> passed to the constructor. `TypeError` is a subclass of `Error`, so
> `instanceof Error` is true. The `"TypeError: bad input"` form is what
> `String(err)` gives, not `message`.

## javascript-basic-059
topic: async
answer: A
run: javascript

What does this program print?

```javascript
const out = [];
setTimeout(() => out.push(1), 20);
setTimeout(() => out.push(2), 0);
setTimeout(() => out.push(3), 10);
setTimeout(() => console.log(out.join(" ")), 50);
```

- A: `2 3 1`
- B: `1 2 3`
- C: `2 1 3`
- D: `3 2 1`

> `setTimeout` does not run its callback at the point it is called; it
> schedules it to run after at least the given delay. All four timers are set
> up at almost the same moment, so they fire in order of delay — 0, 10, 20 ms
> — and the 50 ms one prints the result.

## javascript-basic-060
topic: types-coercion
answer: B
run: javascript

What does this program print?

```javascript
let result = "";
if ([]) result += "a";
if ({}) result += "b";
if ("") result += "c";
if (" ") result += "d";
console.log(result);
```

- A: `ab`
- B: `abd`
- C: `d`
- D: `abcd`

> Every object is truthy, including an empty array and an empty object, so
> `a` and `b` are added. The empty string is falsy, so `c` is skipped. A string
> holding a single space is not empty, so it is truthy and `d` is added.

## javascript-basic-061
topic: scope-hoisting
answer: D

What happens when this script runs?

```javascript
const settings = { theme: "dark" };
settings.theme = "light"; // line 2
settings = { theme: "blue" }; // line 3
```

- A: Line 2 throws a `TypeError`; line 3 never runs.
- B: Both lines run, and `settings.theme` ends up `"blue"`.
- C: Line 2 is ignored, and line 3 throws a `TypeError`.
- D: Line 2 works, and line 3 throws a `TypeError`.

> `const` stops the *variable* from being reassigned; it does not freeze the
> object it refers to. Changing a property (line 2) is allowed. Pointing
> `settings` at a new object (line 3) is a reassignment and throws
> `TypeError: Assignment to constant variable.`

## javascript-basic-062
topic: functions-closures
answer: C
run: javascript

What does this program print?

```javascript
function createWallet() {
  let balance = 0;
  return {
    deposit(n) {
      balance += n;
    },
    get() {
      return balance;
    },
  };
}
const w = createWallet();
w.deposit(50);
w.balance = 1000;
console.log(w.get());
```

- A: `1000`
- B: `1050`
- C: `50`
- D: `undefined`

> `balance` is a local variable of `createWallet`, reachable only through the
> closures `deposit` and `get`. `w.balance = 1000` creates an unrelated
> property on the returned object; it does not touch the variable. `get`
> returns the variable, which holds 50.

## javascript-basic-063
topic: arrays
answer: A
run: javascript

What does this program print?

```javascript
const users = [
  { name: "ana", age: 17 },
  { name: "ben", age: 21 },
  { name: "cy", age: 30 },
];
const found = users.find(u => u.age > 18);
const index = users.findIndex(u => u.age > 40);
console.log(found.name, index);
```

- A: `ben -1`
- B: `cy -1`
- C: `ben undefined`
- D: `ben,cy -1`

> `find` returns the first element that matches — one element, not all of
> them — so it stops at ben. `findIndex` returns -1 when nothing matches (it
> is `find` that returns `undefined` when nothing matches).

## javascript-basic-064
topic: strings-numbers
answer: D
run: javascript

What does this program print?

```javascript
const s = "JavaScript";
console.log(s.slice(0, 4), s.slice(-6), s.indexOf("S"), s.length);
```

- A: `Java Scrip 4 10`
- B: `Jav Script 5 10`
- C: `Java Script 4 9`
- D: `Java Script 4 10`

> `slice(0, 4)` takes indexes 0 to 3, `"Java"`. A negative start counts from
> the end, so `slice(-6)` is the last six characters, `"Script"`. Indexes start
> at 0, so the `S` is at index 4, and the string has 10 characters.

## javascript-basic-065
topic: objects-prototypes
answer: B
run: javascript

What does this program print?

```javascript
const animal = { speaks: true };
const dog = Object.create(animal);
dog.barks = true;
console.log(dog.speaks, Object.keys(dog).join(","));
```

- A: `undefined barks`
- B: `true barks`
- C: `true speaks,barks`
- D: `undefined speaks,barks`

> `Object.create(animal)` makes a new object whose prototype is `animal`.
> Reading `dog.speaks` does not find an own property, so the lookup continues
> to the prototype and finds `true`. `Object.keys` lists only the object's own
> properties, so it gives just `barks`.

## javascript-basic-066
topic: modern
answer: C
run: javascript

What does this program print?

```javascript
const defaults = { theme: "light", size: 12 };
const prefs = { size: 16 };
const merged = { ...defaults, ...prefs, theme: "dark" };
const reversed = { ...prefs, ...defaults };
console.log(merged.theme, merged.size, reversed.size);
```

- A: `light 16 12`
- B: `dark 12 16`
- C: `dark 16 12`
- D: `dark 16 16`

> Object spread copies properties in order, and a later property with the
> same name overwrites an earlier one. In `merged`, `prefs.size` (16) overwrites
> `defaults.size`, and the explicit `theme: "dark"` comes last. In `reversed`,
> `defaults` is spread last, so its `size` (12) wins.

## javascript-basic-067
topic: errors
answer: D
run: javascript

What does this program print?

```javascript
const limit = 5;
try {
  limit = 10;
} catch (e) {
  console.log(e.name);
}
```

- A: `SyntaxError`
- B: `ReferenceError`
- C: `Error`
- D: `TypeError`

> Assigning to a `const` is not caught when the code is parsed; it fails when
> the assignment runs, with `TypeError: Assignment to constant variable.` The
> `catch` receives that error, and its `name` is `"TypeError"`.

## javascript-basic-068
topic: this-binding
answer: A, C, D

```javascript
const user = {
  name: "Ana",
  greet() {
    return "Hi, " + this.name;
  },
};
const greet = user.greet;
```

Which of these expressions return `"Hi, Ana"`? Select all that apply.

- A: `user.greet()`
- B: `greet()`
- C: `greet.call(user)`
- D: `user["greet"]()`

> `this` is set by how the function is called. Calling it as a method of
> `user` — with a dot or with brackets — makes `this` be `user`. `call(user)`
> sets `this` to `user` explicitly. `greet()` is a plain call of the detached
> function, so `this` is not `user`: in strict mode it is `undefined` and the
> call throws, otherwise it is the global object and the name is not `"Ana"`.

## javascript-basic-069
topic: async
answer: C
run: javascript

What does this program print?

```javascript
const result = [];
Promise.resolve(1)
  .then(n => n + 1)
  .then(n => {
    throw new Error("at " + n);
  })
  .then(n => result.push("skipped " + n))
  .catch(e => e.message)
  .then(msg => console.log(msg, result.length));
```

- A: `at 1 0`
- B: `at 2 1`
- C: `at 2 0`
- D: `undefined 0`

> Each `then` receives the previous step's return value: 1, then 2. Throwing
> inside a `then` rejects the chain, so the next `then` (which only handles
> success) is skipped and nothing is pushed. `catch` handles the error and
> returns its message, which becomes the value passed to the last `then`.

## javascript-basic-070
topic: types-coercion
answer: A
run: javascript

What does this program print?

```javascript
console.log(Number(""), Number(" 7 "), Number(true), Number(null));
```

- A: `0 7 1 0`
- B: `NaN NaN 1 NaN`
- C: `0 NaN 1 0`
- D: `NaN 7 1 0`

> `Number` trims surrounding whitespace before converting, so `" 7 "` is 7, and
> an empty (or all-whitespace) string converts to 0, not `NaN`. `true` converts
> to 1 and `null` to 0. (`Number(undefined)` would be `NaN`.)

## javascript-basic-071
topic: functions-closures
answer: B
run: javascript

What does this program print?

```javascript
function add(a, b) {
  return a + b;
}
console.log(add(1), add(1, 2, 3));
```

- A: `1 3`
- B: `NaN 3`
- C: `NaN 6`
- D: `undefined 6`

> JavaScript does not check how many arguments a call passes. A missing
> parameter is `undefined`, and `1 + undefined` is `NaN`. Extra arguments are
> ignored by the named parameters, so `add(1, 2, 3)` adds only 1 and 2.

## javascript-basic-072
topic: arrays
answer: D
run: javascript

What does this program print?

```javascript
const scores = [70, 85, 92];
console.log(scores.some(s => s > 90), scores.every(s => s > 70));
```

- A: `true true`
- B: `false false`
- C: `false true`
- D: `true false`

> `some` is true if at least one element passes: 92 is greater than 90.
> `every` is true only if all of them pass, and 70 is not greater than 70, so
> it is false.

## javascript-basic-073
topic: strings-numbers
answer: B
run: javascript

What does this program print?

```javascript
const file = "report.final.pdf";
console.log(file.split(".").length, file.endsWith(".pdf"), file.lastIndexOf("."));
```

- A: `2 true 12`
- B: `3 true 12`
- C: `3 true 6`
- D: `3 false 12`

> Splitting on `"."` cuts at both dots, giving three pieces: `"report"`,
> `"final"` and `"pdf"`. The string does end with `".pdf"`. `lastIndexOf`
> finds the last dot, which sits at index 12 (`"report"` is indexes 0–5, the
> first dot is 6, `"final"` is 7–11).

## javascript-basic-074
topic: modern
answer: A

```javascript
let a = 1;
let b = 2;
```

Which statement swaps the values, so that `a` is 2 and `b` is 1?

- A: `[a, b] = [b, a];`
- B: `a, b = b, a;`
- C: `[a, b] = [a, b];`
- D: `a = b; b = a;`

> In A the right side builds the array `[2, 1]` first, then destructuring
> assigns its elements to `a` and `b`. B is not a swap in JavaScript: the comma
> operator makes it `a`, then `b = b`, then `a`, so nothing changes. C assigns
> each variable its own value. D sets `a` to 2 and then `b` to the new `a`,
> leaving both at 2.

## javascript-basic-075
topic: async
answer: C
run: javascript

What does this program print?

```javascript
let data;
setTimeout(() => {
  data = "loaded";
}, 0);
console.log(data);
```

- A: `loaded`
- B: `null`
- C: `undefined`
- D: It throws a `ReferenceError`.

> `setTimeout` only schedules the callback; even with a 0 ms delay it cannot
> run until the current script has finished. The `console.log` runs first,
> while `data` still has its initial value — a `let` declared without a value
> holds `undefined`.
