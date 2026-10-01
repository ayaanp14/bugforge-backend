---
skill: javascript
level: basic
---

## javascript-basic-026
topic: types-coercion
answer: B
run: javascript

What does this program print?

```javascript
console.log(0 == "0", 0 === "0", null == undefined, null === undefined);
```

- A: `true false false false`
- B: `true false true false`
- C: `false false true false`
- D: `true true true false`

> `==` converts before comparing: `"0"` becomes the number 0, so `0 == "0"` is
> true. `===` never converts, and a number is not a string, so it is false.
> `null == undefined` is true by a special rule of `==`, but they are different
> types, so `null === undefined` is false.

## javascript-basic-027
topic: scope-hoisting
answer: D
run: javascript

What does this program print?

```javascript
const fns = [];
for (var i = 0; i < 3; i++) {
  fns.push(() => i);
}
console.log(fns.map(f => f()).join(" "));
```

- A: `0 1 2`
- B: `2 2 2`
- C: `undefined undefined undefined`
- D: `3 3 3`

> `var` is function-scoped, so there is a single `i` shared by all three arrow
> functions. They read it only when called, after the loop has finished, and
> the loop stops when `i` reaches 3. With `let i`, each iteration gets its own
> binding and the program prints `0 1 2`.

## javascript-basic-028
topic: functions-closures
answer: A
run: javascript

What does this program print?

```javascript
const make = () => { value: 1 };
console.log(make());
```

- A: `undefined`
- B: `{ value: 1 }`
- C: `1`
- D: It throws a `SyntaxError`.

> A `{` right after `=>` starts a function body, not an object literal. Inside
> it, `value:` is read as a statement label and `1` as an expression statement,
> so the body is valid but has no `return`, and the call gives `undefined`. To
> return an object, wrap it in parentheses: `() => ({ value: 1 })`.

## javascript-basic-029
topic: arrays
answer: C
run: javascript

What does this program print?

```javascript
const nums = [1, 2, 3, 4, 5];
const result = nums
  .filter(n => n % 2 === 1)
  .map(n => n * n)
  .reduce((sum, n) => sum + n, 0);
console.log(result);
```

- A: `55`
- B: `20`
- C: `35`
- D: `9`

> `filter` keeps the odd numbers `[1, 3, 5]`, `map` squares them to
> `[1, 9, 25]`, and `reduce` adds them starting from 0: 35. Skipping the filter
> gives 55; keeping the even numbers instead gives 20.

## javascript-basic-030
topic: strings-numbers
answer: A
run: javascript

What does this program print?

```javascript
console.log(parseInt("42px"), Number("42px"), parseInt("3.99"), parseFloat("3.99kg"));
```

- A: `42 NaN 3 3.99`
- B: `42 42 3 3.99`
- C: `42 NaN 4 3.99`
- D: `NaN NaN 3 NaN`

> `parseInt` and `parseFloat` read as many leading digits as they can and stop
> at the first character that does not fit, so `"42px"` gives 42 and
> `"3.99kg"` gives 3.99. `parseInt` stops at the `.` and never rounds, so
> `"3.99"` gives 3. `Number` needs the whole string to be a number, so
> `Number("42px")` is `NaN`.

## javascript-basic-031
topic: objects-prototypes
answer: D
run: javascript

What does this program print?

```javascript
const key = "color";
const car = { color: "red", key: "plate" };
console.log(car[key], car.key);
```

- A: `red red`
- B: `plate plate`
- C: `plate red`
- D: `red plate`

> Bracket access evaluates what is inside the brackets: `car[key]` is
> `car["color"]`, which is `"red"`. Dot access uses the name as written:
> `car.key` reads the property literally called `key`, which is `"plate"`.

## javascript-basic-032
topic: modern
answer: B
run: javascript

What does this program print?

```javascript
const [first, , third = 30, fourth = 40] = [10, 20, undefined];
console.log(first, third, fourth);
```

- A: `10 20 40`
- B: `10 30 40`
- C: `10 undefined 40`
- D: `10 30 undefined`

> The empty slot between the commas skips the second element (20). `third`
> receives `undefined`, so its default 30 is used; `fourth` has no element at
> all, which is also `undefined`, so its default 40 is used. A default applies
> whenever the value is `undefined`.

## javascript-basic-033
topic: errors
answer: C
run: javascript

What does this program print?

```javascript
const steps = [];
function load() {
  try {
    steps.push("start");
    return "done";
  } finally {
    steps.push("cleanup");
  }
}
const result = load();
console.log(result, steps.join(","));
```

- A: `done start`
- B: `cleanup start,cleanup`
- C: `done start,cleanup`
- D: `undefined start,cleanup`

> A `finally` block runs even when the `try` block leaves with `return`. The
> return value `"done"` is decided first, then `finally` pushes `"cleanup"`,
> then the function returns `"done"`. A `finally` without its own `return` does
> not change the value returned.

## javascript-basic-034
topic: this-binding
answer: A
run: javascript

What does this program print?

```javascript
const team = {
  name: "Core",
  members: ["ana", "ben"],
  list() {
    return this.members.map(m => m + "@" + this.name).join(" ");
  },
};
console.log(team.list());
```

- A: `ana@Core ben@Core`
- B: `ana@undefined ben@undefined`
- C: `ana@ ben@`
- D: It throws a `TypeError`.

> `team.list()` is a method call, so `this` is `team` inside `list`. An arrow
> function has no `this` of its own: the callback uses the `this` of the
> surrounding `list`, so `this.name` is `"Core"`. Had the callback been a
> regular `function (m) { ... }`, its `this` would not have been `team`.

## javascript-basic-035
topic: types-coercion
answer: C
run: javascript

What does this program print?

```javascript
const x = NaN;
console.log(x === x, Number.isNaN(x), isNaN("hello"));
```

- A: `true true false`
- B: `false true false`
- C: `false true true`
- D: `true true true`

> `NaN` is the one value not equal to itself, so `x === x` is false.
> `Number.isNaN` is true only for the value `NaN` itself. The older global
> `isNaN` first converts its argument to a number, and `Number("hello")` is
> `NaN`, so `isNaN("hello")` is true (`Number.isNaN("hello")` would be false).

## javascript-basic-036
topic: scope-hoisting
answer: B

What happens when this script runs?

```javascript
console.log(sayHi());
var sayHi = function () {
  return "hi";
};
```

- A: It prints `hi`.
- B: It throws a `TypeError`.
- C: It prints `undefined`.
- D: It throws a `ReferenceError`.

> Only the declaration `var sayHi` is hoisted, initialised to `undefined`; the
> function is assigned when that line runs, which is after the call. Calling
> `undefined` throws `TypeError: sayHi is not a function`. A function
> declaration (`function sayHi() {}`) would have worked, and a `let`/`const`
> would have thrown a `ReferenceError`.

## javascript-basic-037
topic: functions-closures
answer: D
run: javascript

What does this program print?

```javascript
let message = "hello";
const say = () => message;
message = "bye";
console.log(say());
```

- A: `hello`
- B: `undefined`
- C: It throws a `ReferenceError`.
- D: `bye`

> A closure captures the variable, not a copy of its value at the time the
> function was created. `say` reads `message` when it is called, and by then
> it has been reassigned to `"bye"`.

## javascript-basic-038
topic: arrays
answer: B
run: javascript

What does this program print?

```javascript
const pets = ["cat", "dog", "cat"];
console.log(pets.indexOf("cat"), pets.lastIndexOf("cat"), pets.indexOf("cow"), pets.includes("dog"));
```

- A: `1 3 0 true`
- B: `0 2 -1 true`
- C: `0 2 undefined true`
- D: `0 0 -1 true`

> Indexes start at 0. `indexOf` returns the first position (0), `lastIndexOf`
> the last (2), and both return -1 — not `undefined` — when the value is not
> there. `includes` answers with a boolean.

## javascript-basic-039
topic: arrays
answer: A, D, E

Which of these array methods change the array they are called on? Select all that apply.

- A: `push`
- B: `slice`
- C: `map`
- D: `splice`
- E: `reverse`
- F: `concat`

> `push` adds to the array, `splice` removes or inserts in place, and `reverse`
> reverses it in place (and returns the same array). `slice`, `map` and
> `concat` leave the original alone and return a new array.

## javascript-basic-040
topic: objects-prototypes
answer: A
run: javascript

What does this program print?

```javascript
const p = { x: 1 };
const q = { x: 1 };
console.log(p === q, p.x === q.x, JSON.stringify(p) === JSON.stringify(q));
```

- A: `false true true`
- B: `true true true`
- C: `false true false`
- D: `false false true`

> Objects are compared by reference: `p` and `q` are two separate objects, so
> `p === q` is false even though they look the same. Their `x` values are both
> the number 1, and their JSON texts are both the string `{"x":1}`, so those
> comparisons are true.

## javascript-basic-041
topic: modern
answer: C
run: javascript

What does this program print?

```javascript
const a = [1, 2];
const b = [...a, 3];
const c = a;
c.push(9);
console.log(a.join("-"), b.join("-"));
```

- A: `1-2 1-2-3`
- B: `1-2-9 1-2-9-3`
- C: `1-2-9 1-2-3`
- D: `1-2 1-2-3-9`

> `[...a, 3]` builds a new array from the elements `a` held at that moment, so
> `b` is `[1, 2, 3]` and is not linked to `a`. `c = a` copies only the
> reference, so `c.push(9)` changes the array `a` names.

## javascript-basic-042
topic: async
answer: D

```javascript
async function getValue() {
  return 42;
}
const v = getValue();
```

What is `v` after this code runs?

- A: The number `42`
- B: `undefined`
- C: A Promise that resolves to `undefined`
- D: A Promise that resolves to `42`

> An `async` function always returns a Promise; the value after `return`
> becomes the value the Promise resolves to. To get the 42 itself you write
> `await getValue()` inside another async function, or
> `getValue().then(value => ...)`.

## javascript-basic-043
topic: types-coercion
answer: B

Which check is `true` for every array and `false` for every other value `v`?

- A: `typeof v === "array"`
- B: `Array.isArray(v)`
- C: `typeof v === "object"`
- D: `v instanceof Object`

> `typeof` never returns `"array"` — arrays are objects, so `typeof []` is
> `"object"` — which means A is never true. C and D are true for arrays but
> also for plain objects (and C for `null` too), so they do not single arrays
> out. `Array.isArray` is the check made for this.

## javascript-basic-044
topic: scope-hoisting
answer: C
run: javascript

What does this program print?

```javascript
var a = 1;
let b = 1;
if (true) {
  var a = 2;
  let b = 2;
}
console.log(a, b);
```

- A: `1 1`
- B: `2 2`
- C: `2 1`
- D: `1 2`

> A block does not create a scope for `var`: the inner `var a = 2` is the same
> variable as the outer `a`, so it is overwritten. `let` is block-scoped: the
> inner `let b` is a new variable that exists only inside the `if` block, and
> the outer `b` stays 1.

## javascript-basic-045
topic: functions-closures
answer: A

```javascript
function double(n) {
  n * 2;
}
const result = double(4);
```

What is the value of `result`?

- A: `undefined`
- B: `8`
- C: `4`
- D: `NaN`

> A regular function returns `undefined` unless it reaches a `return`
> statement. `n * 2` is computed and thrown away. (An arrow function with an
> expression body, `n => n * 2`, would return 8.)

## javascript-basic-046
topic: arrays
answer: D
run: javascript

What does this program print?

```javascript
const a = [10, 9, 1, 100];
a.sort();
console.log(a.join(" "));
```

- A: `1 9 10 100`
- B: `100 10 9 1`
- C: `10 9 1 100`
- D: `1 10 100 9`

> Without a compare function, `sort` converts the elements to strings and
> sorts them in dictionary order: `"1" < "10" < "100" < "9"`. To sort numbers
> by value, pass a compare function: `a.sort((x, y) => x - y)`.

## javascript-basic-047
topic: strings-numbers
answer: B

```javascript
let s = "cat";
```

Which statement leaves `s` holding `"Cat"`?

- A: `s[0] = "C";`
- B: `s = "C" + s.slice(1);`
- C: `s.replace("c", "C");`
- D: `s.charAt(0).toUpperCase();`

> Strings are immutable. Assigning to an index does nothing (in strict mode it
> throws a `TypeError`), and `replace` and `toUpperCase` return new strings,
> which C and D throw away. B builds a new string, `"C" + "at"`, and assigns
> it back to `s`.

## javascript-basic-048
topic: objects-prototypes
answer: C
run: javascript

What does this program print?

```javascript
function rename(person) {
  person.name = "Bo";
  person = { name: "Cy" };
}
const p = { name: "Al" };
rename(p);
console.log(p.name);
```

- A: `Al`
- B: `Cy`
- C: `Bo`
- D: `undefined`

> The parameter `person` starts out holding a reference to the same object as
> `p`, so `person.name = "Bo"` changes that object. Then `person` is pointed at
> a brand-new object; that only changes the local parameter, not `p`, which
> still refers to the original object, now named `"Bo"`.

## javascript-basic-049
topic: modern
answer: A

```javascript
const x = 1;
const y = 2;
const point = { x, y };
```

What does `point` hold?

- A: `{ x: 1, y: 2 }`
- B: `{ x: "x", y: "y" }`
- C: `[1, 2]`
- D: `{ 0: 1, 1: 2 }`

> Shorthand property names: `{ x, y }` means `{ x: x, y: y }` — each property
> is named after the variable and takes the variable's value. The result is an
> ordinary object, not an array.

## javascript-basic-050
topic: errors
answer: A, E

Each line below is run on its own, as a whole fresh script. Which of them throw a `ReferenceError`? Select all that apply.

- A: `console.log(notDeclared);`
- B: `const o = null; o.x;`
- C: `console.log(typeof notDeclared);`
- D: `let n = 1; n();`
- E: `y = 5; let y;`

> A reads a variable that was never declared: `ReferenceError`. E assigns to
> `y` while it is still in its temporal dead zone (the `let` has not run yet):
> also a `ReferenceError`. B reads a property of `null` and D calls a number,
> both `TypeError`s. `typeof` is safe on an undeclared name and gives
> `"undefined"`, so C prints that.
