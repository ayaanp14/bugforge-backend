---
updated: 2026-10-03
question: What does the JavaScript (Basic) skill test cover?
answer: It checks that you can read short JavaScript programs and say exactly what they do: how values convert between types, how var, let and const are scoped, closures, objects and arrays, string and number methods, destructuring and spread, errors, and when timer and promise callbacks run. Multiple-choice questions come first, then a coding problem you solve in JavaScript.
q: Are classes on the JavaScript Basic test?
a: Not the `class` syntax. Basic works with plain objects: literals, property access, references and how a property is found on an object's prototype. Classes, `extends`, `static` members and how `this` behaves inside class code are examined on the [JavaScript (Intermediate)](/skill-tests/javascript-intermediate) test.
q: Do I need to understand the event loop for the JavaScript Basic test?
a: Only at the level of everyday code: you should be able to put synchronous code, promise callbacks and timer callbacks in the order they run. Microtask queues in detail, `await` continuations and Node.js's `process.nextTick` belong to the Intermediate test, where the event loop is a topic of its own.
q: Is the JavaScript Basic coding problem run in a browser or in Node.js?
a: In Node.js on the judge, not in a browser. The editor gives you a function to complete; the judge calls it once per test case and compares what it returns. There is no DOM and no input to read, so use the core language and its built-in objects, and return the answer instead of printing it.
q: Does knowing TypeScript help with the JavaScript Basic test?
a: Yes, since TypeScript compiles to JavaScript and keeps its runtime behaviour, but the test itself is plain JavaScript with no type annotations, and the coding problem must be answered in JavaScript. TypeScript has its own credential, starting with [TypeScript (Basic)](/skill-tests/typescript-basic).
q: What should I study if I fail the JavaScript Basic test?
a: Start from the result, which breaks your score down by topic, weakest first, with a link to practise each one. The matching modules of the [JavaScript study plan](/study-plans/javascript) teach those topics with exercises checked on a judge, and you can sit the test again once the cooldown shown on this page has passed.
---

JavaScript rarely stops you. It turns a string into a number without being asked, lets you read a variable before the line that assigns it, and runs a callback long after the code around it has finished. That forgiveness is why a JavaScript program can work for the wrong reason and break on the next small change. The JavaScript (Basic) test checks that you know the reasons: most questions put a few lines of JavaScript in front of you and ask exactly what they print.

It suits anyone who has used the language for a few months — a course, scripts for a small website, practice problems — and wants a credential that shows they understand what their code does, not only that it runs. The multiple-choice section comes first; a few of its questions ask you to select every correct option, and only the exact set scores. A coding section follows, with a problem to solve in JavaScript against hidden test cases. Nothing on the test touches the browser: there is no DOM, no `fetch` and no framework, only the language and its built-in objects.

## The topics, in plain terms

Each area below is a topic on your result, so a weak one shows up by name. The [JavaScript study plan](/study-plans/javascript) teaches all of them, with exercises that run on a judge.

- **Types and coercion.** Which operators convert their operands and to what, how loose and strict equality differ, which values count as false in a condition, and what `typeof` reports. You should be able to explain, for example, why `true + true` is `2`.
- **Scope and hoisting.** How `var`, `let` and `const` differ in scope, what is hoisted and in what state, and what a name refers to when an inner scope declares the same name.
- **Functions and closures.** Default and rest parameters, functions passed around as values, how arrow functions differ from `function`, and closures: a function that keeps using variables from the scope it was created in after that scope has finished.
- **`this` and binding.** How the way a function is called decides what `this` is, and why an arrow function behaves differently. Basic stays with methods on plain objects; binding in depth is Intermediate material.
- **Objects and prototypes.** Object literals, dot and bracket access, adding and deleting properties, listing keys, the difference between two references to one object and two objects that merely look alike, and how a property is found on an object's prototype.
- **Arrays.** The everyday methods, from `push` and `slice` to `map`, `filter`, `reduce` and `sort`: what each one returns, and whether it changes the array it was called on.
- **Strings and numbers.** String methods and indexes, converting text to numbers, why decimal arithmetic is not exact in binary floating point, and rounding and formatting a number for display.
- **Modern syntax.** Template literals, destructuring with defaults, spread and rest, and shorthand and computed property names.
- **Errors.** How control moves through `try`, `catch` and `finally`, what an error object carries, and which built-in error type a given mistake raises.
- **Promises and async.** Scheduling with `setTimeout`, promise chains with `then` and `catch`, and what an `async` function gives back. You need the order in which synchronous code, promise callbacks and timers run, not the event loop in full.

## Practising the way the test reads code

Predict, then run. Take a short snippet — from the study plan, from your own code, from a problem you have solved — write down exactly what it will print, and only then run it in Node.js or a browser console. When you were wrong, find the rule that explains the difference before moving on; a rule you looked up after a wrong guess is easier to remember than one you only read about. Do this little and often. It is the same habit the test rewards: reading each line for what it does.

In the [JavaScript study plan](/study-plans/javascript), the modules that line up with this test are Values, types and coercion; Functions, scope and closures; Objects, arrays and destructuring; Errors and error handling; and the first lessons of Asynchronous JavaScript. Every lesson has a quiz and exercises checked on a judge, so you can see where you stand topic by topic before you sit the test.

For the coding section, solve easy problems in JavaScript from [Arrays](/challenges/arrays), [Strings](/challenges/strings) and [Hash table](/challenges/hash-table); the roadmap lessons on [arrays](/roadmap/arrays) and [hashing](/roadmap/hashing) explain the techniques those problems lean on. In the sitting, the editor gives you a function to complete. Return the answer rather than printing it — the judge calls the function for each test case and compares what comes back. Run checks the visible cases, Submit runs every hidden case, and each case passed earns its share of the marks, so a solution that misses one edge case still scores most of them. Pasting into the editor is switched off during a sitting, so practise writing solutions from an empty function rather than adapting code you have copied.

## Habits that cost marks

Most lost marks come from a few reading habits rather than from gaps in knowledge.

- **Answering from intent.** One option is often what the author of the code probably wanted, and another is what the code actually does. Trace the code, line by line, and trust the trace.
- **Losing track of what changed.** When two names refer to the same object, or a method changes its array in place, every later line sees the change. As you read, keep a note of which values are shared.
- **Assuming code runs where it is written.** A callback handed to `setTimeout`, `then` or an array method runs when it is called, not when the line that mentions it is read.
- **Skimming the multi-answer questions.** "Select all that apply" questions score only when the whole set is right. Decide each option on its own, true or false, before you look at the set you have chosen.
- **Leaving blanks.** There is no negative marking, so an answer you are unsure of costs nothing. Mark your best option and move on rather than spending minutes on one question.

## What the Intermediate test adds

The [JavaScript (Intermediate)](/skill-tests/javascript-intermediate) test assumes everything here and goes further: `call`, `apply` and `bind`, and `this` inside classes; prototype chains and class syntax in full; the event loop as a topic of its own, with microtasks and Node.js's `process.nextTick`; `Promise.all` and the other combinators; iterators, generators and `Map`; and coding problems that reach medium difficulty. If the questions here felt comfortable, that is the next step.

## Sample question
topic: types-coercion
answer: B
run: javascript

What does this program print?

```javascript
const a = [1, 2];
const b = [3, 4];
const c = a + b;
console.log(c, typeof c, c.length);
```

- A: `1,2,3,4 object 4`
- B: `1,23,4 string 6`
- C: `1,2,3,4 string 7`
- D: `4,6 object 2`

> `+` does not join arrays or add them element by element. When an operand is an
> object, `+` first converts it to a primitive, and an array converts to the
> string its `join(",")` gives: `"1,2"` and `"3,4"`. With strings on both sides,
> `+` concatenates, and nothing puts a comma between the `2` and the `3`, so `c`
> is the six-character string `"1,23,4"`. To combine two arrays, use
> `[...a, ...b]` or `a.concat(b)`.
