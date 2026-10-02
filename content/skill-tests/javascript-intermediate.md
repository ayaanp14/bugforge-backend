---
updated: 2026-10-03
question: What does the JavaScript (Intermediate) skill test cover?
answer: It examines JavaScript as production code uses it: how the this keyword is bound by call, apply, bind and classes, prototype chains and class syntax, closures, promise combinators and async/await, the event loop's task and microtask order, iterators, generators and Map, and edge cases in coercion, arrays and numbers. Multiple-choice questions come first, then coding problems up to medium difficulty, solved in JavaScript.
q: Does the JavaScript Intermediate test assume Node.js or the browser?
a: The language rules are the same in both, and most questions depend on nothing else. Where the runtime matters, as with `process.nextTick`, the question says it is about Node.js and names the version if the behaviour changed between releases. Nothing on the test uses the DOM or other browser APIs.
q: Does the JavaScript Intermediate test cover regular expressions, modules or the DOM?
a: No. The questions stay with the core language and its standard built-ins: functions, objects, classes, promises, collections and iteration. Regular expressions, `import` and `export`, browser APIs and frameworks are not examined, though the [JavaScript study plan](/study-plans/javascript) teaches all of them.
q: How well do I need to know classes for the JavaScript Intermediate test?
a: Well enough to say what class syntax builds underneath: where methods, fields and static members live, what `extends` connects, and how `this` behaves inside class code. Private `#name` fields and decorators are not examined.
q: Is TypeScript part of the JavaScript Intermediate test?
a: No. Every question and the coding section use plain JavaScript, and type annotations would be a syntax error in a coding answer. The runtime rules examined here apply unchanged to TypeScript code; the type system itself has its own credential, [TypeScript (Intermediate)](/skill-tests/typescript-intermediate).
q: Do I have to pass JavaScript Basic before sitting Intermediate?
a: No, either test can be sat first. Take Basic first if scope, coercion or the array methods still need thought, because Intermediate questions build on them: a gap there costs marks on harder questions too, and the Basic result shows exactly where the gap is.
---

The JavaScript (Intermediate) test is about what the language does once code stops being one script read from top to bottom: functions handed from one place to another, objects that inherit from other objects, and work that finishes later than the line that started it. Its questions examine how `this` is bound, how the prototype chain is searched, how errors travel through promises and exactly when asynchronous code runs.

The questions are short programs, rarely more than a dozen lines, and most ask what they print. Answering them means running the program in your head with the language's actual rules rather than an approximation of them. A few ask you to choose every correct option, scored only when the set is exact. The coding section that follows must be answered in JavaScript and is judged on hidden test cases.

## Is this your level?

Sit Intermediate if JavaScript is a language you use every week: building front ends, writing Node.js services, or preparing for interviews where JavaScript is the language you will code in. It assumes what the [JavaScript (Basic)](/skill-tests/javascript-basic) test covers — scope and hoisting, coercion, the array and string methods, and the basic order of timers and promises — because the harder questions stand on that ground.

If you have used JavaScript for years but mostly through a framework, expect the event-loop and prototype questions to be the unfamiliar part. Framework code rarely makes you think about either, and both are examined here directly.

## Where the questions dig deeper

Every area is a topic on your result. The [JavaScript study plan](/study-plans/javascript) covers them all; its modules on functions, scope and closures, prototypes and classes, collections and iteration, and asynchronous JavaScript matter most at this level.

- **`this` and binding.** `call`, `apply` and `bind`; arrow functions; methods passed as callbacks or to timers; and `this` inside class methods, class fields and static methods.
- **Objects and prototypes.** The prototype chain and how property reads and writes use it, own versus inherited properties, property attributes and freezing, and what `class` and `extends` actually build.
- **Functions and closures.** Closures as a design tool: private state, functions that build other functions, wrappers that change how a function is called, and closures created inside loops.
- **Promises and async/await.** What each step of a promise chain passes on, how errors travel through a chain and out of an `async` function, when asynchronous work starts compared with when it is awaited, and the four combinators `Promise.all`, `allSettled`, `race` and `any`.
- **The event loop.** The order in which synchronous code, microtasks and timer callbacks run, in browsers and in Node.js, including where `queueMicrotask`, `await` and `process.nextTick` fit.
- **Modern syntax and built-ins.** Optional chaining and nullish coalescing, iterators and generators, `Map` and `WeakMap`, object spread, accessors and tagged templates.
- **Types and coercion.** The equality algorithms — loose, strict and `Object.is` — special values such as `NaN` and `-0`, and comparisons involving `null` and `undefined`.
- **Arrays.** Sorting with and without a comparator, `reduce` with and without a starting value, sparse arrays, and building arrays with `fill` and `Array.from`.
- **Errors.** Custom error classes, `finally`, errors thrown from code that runs later, and what Node.js does with a promise rejection that has no handler.
- **Strings and numbers.** Floating-point comparison, the limit of safe integers and `BigInt`, and parsing numbers out of text.

## Tracing asynchronous code by hand

Questions about execution order reward a method more than intuition. Read the script once from top to bottom and keep three lists as you go: code that runs now, the microtask queue and the timer queue. Write each callback into the list it joins at the moment it is scheduled — which is not always the line where it is written — and only then work out the order in which the lists are emptied. Writing the lists down turns a guess into a trace, and it shows you exactly which rule you are unsure of.

The rules themselves — how the queues are drained, and where `await`, `queueMicrotask` and `process.nextTick` place their work — are taught in the Asynchronous JavaScript module of the study plan. Practise them by writing a few lines, predicting the output and running them in Node.js. Keep each experiment small enough that you can account for every line it prints; when one surprises you, cut it down until only the surprising part is left.

The same discipline helps with `this` and prototype questions. For `this`, ask how the function is called on that exact line, unless it is an arrow function, which takes `this` from the code around it. For a property, ask whether the object has it as its own property or reaches it through the chain, and whether the line reads it or writes it.

## Medium problems, solved in JavaScript

The coding section draws from the problem catalogue and reaches medium difficulty, where choosing the right algorithm matters as much as writing correct code. Submit runs every hidden case, so an approach that is fast enough for the visible examples can still lose marks. Review costs with the [Big-O notation](/roadmap/big-o-notation) lesson, then practise the patterns medium problems lean on — [hashing](/roadmap/hashing), [two pointers](/roadmap/two-pointers), [sliding window](/roadmap/sliding-window) and [binary search](/roadmap/binary-search) — with problems from [Hash table](/challenges/hash-table), [Two pointers](/challenges/two-pointers) and [Sliding window](/challenges/sliding-window).

In the sitting, the editor gives you a function to complete: return the answer rather than printing it, since the judge compares what the function returns. Reach for a `Map` or `Set` when you need constant-time lookups. Pasting is switched off, so practise writing solutions from an empty function. Your best submission for each problem is the one that counts, with partial credit for every hidden case it passes.

## Sample question
topic: errors
answer: C
run: javascript

What does this program print?

```javascript
const inputs = ['{"id":7}', "{id:7}", "null"];
const out = inputs.map((text) => {
  try {
    return JSON.parse(text).id;
  } catch (e) {
    return e.name;
  }
});
console.log(out.join(" "));
```

- A: `7 7 undefined`
- B: `7 SyntaxError undefined`
- C: `7 SyntaxError TypeError`
- D: `7 SyntaxError SyntaxError`

> JSON is stricter than JavaScript's object literals: keys must be double-quoted
> strings, so `{id:7}` is not valid JSON and `JSON.parse` throws a `SyntaxError`.
> `"null"`, on the other hand, is valid JSON — it parses to the value `null` — and
> the error comes one step later, when `.id` is read from `null`, which throws a
> `TypeError`. Both happen inside the `try` block, so both are caught, and the
> callback returns each error's `name`.
