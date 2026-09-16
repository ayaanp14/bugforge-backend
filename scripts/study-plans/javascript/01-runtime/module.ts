import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "runtime",
  title: "JavaScript and its runtime",
  blurb: "What the language is and who defines it, engines and the JIT, Node as a host, reading stdin and writing exact output, statements versus expressions and ASI, strict mode, and a first look at the event loop.",
  icon: "cpu",
  overview: `JavaScript is the language of the browser, the server and most of the tooling in between, and it looks the way it does because of five early decisions: dynamic types, first-class functions, prototypes, a single thread with an event loop, and forgiving semantics. This module makes those decisions visible before any of them can surprise you.

It covers what JavaScript, ECMAScript and V8 each are; how an engine parses, interprets and JIT-compiles code and why predictable object shapes are fast; what Node adds around the engine and how a program starts and stops; the three ways to read standard input and the habits that make output exact; statements versus expressions with the automatic-semicolon-insertion traps spelled out; strict mode; and the event loop — one stack, a task queue, a microtask queue that drains first — far enough to predict the order of logs in code with timers and promises.

Every exercise is a Node program reading stdin and printing stdout, judged on Node 16. The template from lesson 3 is the one you will reuse throughout the plan.`,
  lessons: [
    {
      slug: "what-is-javascript",
      file: "01-what-is-javascript.md",
      exercises: [
        {
          title: "Hello, strictly",
          prompt: `Write a strict-mode program that reads an integer \`n\` and \`n\` names, prints \`Hello, <name>!\` for each using a template literal, then \`Greeted <n> person\` or \`Greeted <n> people\`. Use \`const\` for anything that does not change and \`let\` only for the loop counter.

Example: \`2\` then \`Ada Linus\` →
\`\`\`
Hello, Ada!
Hello, Linus!
Greeted 2 people
\`\`\``,
          starterFile: "code/hello.starter.js",
          solutionFile: "code/hello.solution.js",
          hints: ["Tokens 1..n are the names; token 0 was the count.", "A conditional expression inside the template literal picks the word."],
          cases: [
            { stdin: "2\nAda Linus\n", expected: "Hello, Ada!\nHello, Linus!\nGreeted 2 people\n" },
            { stdin: "1\nGrace\n", expected: "Hello, Grace!\nGreeted 1 person\n" },
            { stdin: "0\n", expected: "Greeted 0 people\n", hidden: true },
          ],
        },
        {
          title: "Which edition?",
          prompt: `Build a \`Map\` from feature name to the ECMAScript year that shipped it: \`let-const\` 2015, \`arrow-functions\` 2015, \`promises\` 2015, \`async-await\` 2017, \`flat\` 2019, \`optional-chaining\` 2020, \`nullish-coalescing\` 2020, \`bigint\` 2020, \`replaceAll\` 2021, \`class-fields\` 2022, \`at\` 2022, \`top-level-await\` 2022. Read \`n\` feature names and print \`<feature>: ES<year>\` or \`<feature>: unknown\`, then \`es6=<how many of the queried features are from 2015>\`.

Example: \`3\` then \`arrow-functions at jsx\` →
\`\`\`
arrow-functions: ES2015
at: ES2022
jsx: unknown
es6=1
\`\`\``,
          starterFile: "code/edition.starter.js",
          solutionFile: "code/edition.solution.js",
          hints: ["Map.get returns undefined for a missing key — test with === undefined.", "A Map built from an array of [key, value] pairs is the idiomatic lookup table."],
          cases: [
            { stdin: "3\narrow-functions at jsx\n", expected: "arrow-functions: ES2015\nat: ES2022\njsx: unknown\nes6=1\n" },
            { stdin: "2\npromises let-const\n", expected: "promises: ES2015\nlet-const: ES2015\nes6=2\n" },
            { stdin: "4\nbigint flat async-await decorators\n", expected: "bigint: ES2020\nflat: ES2019\nasync-await: ES2017\ndecorators: unknown\nes6=0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "JavaScript, ECMAScript and V8 are, respectively…",
          options: ["Three names for the same thing", "The language, its specification, and an engine that implements it", "A browser, a server, a compiler", "Old, new and future versions"],
          answer: 1,
          explanation: "TC39 publishes ECMAScript yearly; V8 (Chrome, Node), SpiderMonkey and JavaScriptCore implement it.",
        },
        {
          prompt: "Which design decision explains why JavaScript needs no locks for shared state?",
          options: ["Dynamic typing", "One thread with an event loop", "Prototypes", "Automatic semicolon insertion"],
          answer: 1,
          explanation: "A task runs to completion before any other callback runs, so two callbacks never interleave.",
        },
        {
          prompt: "`\"use strict\"` at the top of a file…",
          options: ["Makes the code faster only", "Turns silent mistakes — such as assigning to an undeclared name — into thrown errors", "Disables `var`", "Is required by Node"],
          answer: 1,
          explanation: "Modules and class bodies are strict automatically; scripts must opt in.",
        },
        {
          prompt: "Which host object exists in Node but not in a browser?",
          options: ["`console`", "`Promise`", "`process`", "`Math`"],
          answer: 2,
          explanation: "`console` and the language built-ins are everywhere; `process`, `require` and `Buffer` are Node's; `document` and `window` are the browser's.",
        },
        {
          prompt: "ES2015 (ES6) introduced…",
          options: ["`async`/`await`", "`let`/`const`, arrows, classes, promises, destructuring and modules", "Optional chaining", "Class fields"],
          answer: 1,
          explanation: "`async`/`await` came in 2017, `?.` and `??` in 2020, class fields in 2022.",
        },
      ],
    },
    {
      slug: "engines-and-runtimes",
      file: "02-engines-and-runtimes.md",
      exercises: [
        {
          title: "Language, Node or browser?",
          prompt: `Read \`n\` global names and classify each: \`language\` for built-ins the specification defines (\`Array\`, \`Math\`, \`JSON\`, \`Promise\`, \`Map\`, \`Object\`, \`Number\`, \`String\`), \`node\` for Node's host globals (\`process\`, \`require\`, \`Buffer\`, \`__dirname\`, \`module\`), \`browser\` for the browser's (\`document\`, \`window\`, \`localStorage\`, \`navigator\`, \`alert\`), \`both\` for globals every host provides (\`console\`, \`setTimeout\`, \`setInterval\`, \`queueMicrotask\`), and \`unknown\` otherwise. Print \`<name>: <class>\`.

Example: \`4\` then \`process document Math console\` →
\`\`\`
process: node
document: browser
Math: language
console: both
\`\`\``,
          starterFile: "code/host.starter.js",
          solutionFile: "code/host.solution.js",
          hints: ["Object.entries turns the table into [group, names] pairs you can search.", "Array.prototype.includes answers membership."],
          cases: [
            { stdin: "4\nprocess document Math console\n", expected: "process: node\ndocument: browser\nMath: language\nconsole: both\n" },
            { stdin: "2\nBuffer fetch\n", expected: "Buffer: node\nfetch: unknown\n" },
            { stdin: "3\nsetTimeout window JSON\n", expected: "setTimeout: both\nwindow: browser\nJSON: language\n", hidden: true },
          ],
        },
        {
          title: "Read the stack trace",
          prompt: `Read a Node stack trace from stdin (until end of input). The first line is \`<ErrorName>: <message>\`; each following line is a frame of the form \`    at <function> (<file>:<line>:<col>)\` or \`    at <file>:<line>:<col>\`. Print \`error=<ErrorName>\`, \`message=<message>\`, \`frames=<count>\`, and \`user=<file>:<line>\` for the **first** frame whose file does not start with \`node:\` (or \`user=none\`).

Example input
\`\`\`
TypeError: Cannot read properties of undefined (reading 'x')
    at total (/workspace/main.js:12:18)
    at Module._compile (node:internal/modules/cjs/loader:1126:14)
\`\`\`
→
\`\`\`
error=TypeError
message=Cannot read properties of undefined (reading 'x')
frames=2
user=/workspace/main.js:12
\`\`\``,
          starterFile: "code/stack-trace.starter.js",
          solutionFile: "code/stack-trace.solution.js",
          hints: ["The location is always the last thing on a frame line: file:line:col, with or without parentheses.", "A regular expression with two captures pulls the file and line out in one step."],
          cases: [
            { stdin: "TypeError: Cannot read properties of undefined (reading 'x')\n    at total (/workspace/main.js:12:18)\n    at Module._compile (node:internal/modules/cjs/loader:1126:14)\n", expected: "error=TypeError\nmessage=Cannot read properties of undefined (reading 'x')\nframes=2\nuser=/workspace/main.js:12\n" },
            { stdin: "ReferenceError: x is not defined\n    at node:internal/main/run_main_module:17:47\n", expected: "error=ReferenceError\nmessage=x is not defined\nframes=1\nuser=none\n" },
            { stdin: "RangeError: Maximum call stack size exceeded\n    at f (/app/deep.js:3:10)\n    at f (/app/deep.js:3:10)\n    at Object.<anonymous> (/app/deep.js:5:1)\n", expected: "error=RangeError\nmessage=Maximum call stack size exceeded\nframes=3\nuser=/app/deep.js:3\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "V8 makes hot code fast by…",
          options: ["Interpreting it twice", "Profiling types at run time and JIT-compiling to machine code, deoptimising if a speculation fails", "Caching the source file", "Running it on a second thread"],
          answer: 1,
          explanation: "Ignition interprets bytecode; TurboFan compiles hot, type-stable functions.",
        },
        {
          prompt: "Node.js is…",
          options: ["A different language from browser JavaScript", "The V8 engine plus libuv (event loop and async I/O) plus a standard library, outside the browser", "A browser without a window", "A JavaScript compiler"],
          answer: 1,
          explanation: "Same language and engine; different host APIs.",
        },
        {
          prompt: "A Node process exits when…",
          options: ["The last line of the file runs", "The event loop has nothing pending — no timers, sockets or reads — or `process.exit` is called", "`return` is executed at top level", "Memory runs out"],
          answer: 1,
          explanation: "A server stays alive because its listening socket is pending work.",
        },
        {
          prompt: "Objects created with the same properties in the same order are faster because…",
          options: ["They use less memory only", "They share a hidden class, so the JIT can emit monomorphic, inline-cached property access", "V8 sorts them", "They are frozen"],
          answer: 1,
          explanation: "Predictable shapes are the single most effective performance habit in engine-level terms.",
        },
        {
          prompt: "`TypeError: Cannot read properties of undefined (reading 'x')` means…",
          options: ["`x` was never declared", "You accessed `.x` on a value that is `undefined`", "`x` is a reserved word", "A syntax error"],
          answer: 1,
          explanation: "A `ReferenceError` is the undeclared-name case; this one is the most common runtime error in JavaScript.",
        },
      ],
    },
    {
      slug: "reading-input-writing-output",
      file: "03-reading-input-writing-output.md",
      exercises: [
        {
          title: "A cursor over ragged input",
          prompt: `Read an integer \`n\` followed by \`n\` integers that may be spread over any number of lines with any spacing. Use the token-cursor pattern (\`readFileSync(0)\`, \`trim\`, \`split(/\\s+/)\`, a \`next()\` helper). Print \`sum=<s> min=<lo> max=<hi>\`, or \`empty\` when \`n\` is 0.

Example (three lines): \`5\`, \`3    9\`, \`-2 7 1\` →
\`\`\`
sum=18 min=-2 max=9
\`\`\``,
          starterFile: "code/cursor.starter.js",
          solutionFile: "code/cursor.solution.js",
          hints: ["split(/\\s+/) does not care about line breaks, so the cursor just walks tokens.", "Infinity and -Infinity are safe starting values for min and max."],
          cases: [
            { stdin: "5\n3    9\n-2 7 1\n", expected: "sum=18 min=-2 max=9\n" },
            { stdin: "0\n", expected: "empty\n" },
            { stdin: "3 1000000000\n\n1000000000 1000000000\n", expected: "sum=3000000000 min=1000000000 max=1000000000\n", hidden: true },
          ],
        },
        {
          title: "Exact columns",
          prompt: `Read an integer \`n\` and \`n\` lines \`<name> <score>\` (scores are decimals). Print a table: each row is the name left-aligned in 10 characters (\`padEnd\`) followed by the score with two decimals right-aligned in 8 (\`toFixed(2).padStart(8)\`); then a rule of 18 dashes; then \`TOTAL\` formatted the same way with the sum. Collect every line in an array and print once with \`join("\\n")\`.

Example: \`2\` then \`ada 91.5\`, \`bob 78\` →
\`\`\`
ada          91.50
bob          78.00
------------------
TOTAL       169.50
\`\`\``,
          starterFile: "code/columns.starter.js",
          solutionFile: "code/columns.solution.js",
          hints: ["toFixed returns a string; padStart then aligns it.", "One console.log at the end is both faster and easier to get exactly right."],
          cases: [
            { stdin: "2\nada 91.5\nbob 78\n", expected: "ada          91.50\nbob          78.00\n------------------\nTOTAL       169.50\n" },
            { stdin: "1\nzed 0\n", expected: "zed           0.00\n------------------\nTOTAL         0.00\n" },
            { stdin: "3\na 1.005\nb 2.5\nc 100\n", expected: "a             1.00\nb             2.50\nc           100.00\n------------------\nTOTAL       103.50\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`require(\"fs\").readFileSync(0, \"utf8\")`…",
          options: ["Reads the first line only", "Reads all of standard input as one string, blocking until it is closed", "Reads a file named `0`", "Returns a Buffer of bytes"],
          answer: 1,
          explanation: "File descriptor 0 is stdin; the encoding argument makes it a string rather than a Buffer.",
        },
        {
          prompt: "`\"\".trim().split(/\\s+/)` evaluates to…",
          options: ["`[]`", "`[\"\"]` — one empty string, so empty input needs a check", "`undefined`", "Throws"],
          answer: 1,
          explanation: "`split` always yields at least one element.",
        },
        {
          prompt: "`console.log([1, 2, 3])` prints…",
          options: ["`1 2 3`", "`[ 1, 2, 3 ]` — a human-readable format; use `join` for exact output", "`1,2,3`", "`[1,2,3]`"],
          answer: 1,
          explanation: "Node's inspector formatting is for people, not judges.",
        },
        {
          prompt: "Printing 100 000 lines fastest is done by…",
          options: ["`console.log` in a loop", "Pushing into an array and one `console.log(out.join(\"\\n\"))`", "`process.stdout.write` per line", "`alert`"],
          answer: 1,
          explanation: "Each `console.log` is a synchronous write; one big write is orders of magnitude faster.",
        },
        {
          prompt: "`Number(\"12px\")` and `parseInt(\"12px\", 10)` are…",
          options: ["`12` and `12`", "`NaN` and `12`", "`12` and `NaN`", "Both throw"],
          answer: 1,
          explanation: "`Number` requires the whole string to be numeric; `parseInt` reads a leading integer and stops.",
        },
      ],
    },
    {
      slug: "statements-and-semicolons",
      file: "04-statements-and-semicolons.md",
      exercises: [
        {
          title: "Grades, as expressions",
          prompt: `Read \`n\` integer scores. Write \`const grade = (s) => …\` with an **expression body** — a chain of conditional operators, no \`if\`, no braces: 90 and above \`A\`, 75–89 \`B\`, 50–74 \`C\`, otherwise \`F\`. Print \`<score> <grade>\` per line, then \`passed=<count of A, B and C>\` computed with \`filter\` and an arrow expression body.

Example: \`4\` then \`95 80 50 20\` →
\`\`\`
95 A
80 B
50 C
20 F
passed=3
\`\`\``,
          starterFile: "code/grades.starter.js",
          solutionFile: "code/grades.solution.js",
          hints: ["Nested ? : reads top to bottom like an if-else chain and is an expression, so it can be an arrow body.", "map(Number) converts a whole array of strings in one call."],
          cases: [
            { stdin: "4\n95 80 50 20\n", expected: "95 A\n80 B\n50 C\n20 F\npassed=3\n" },
            { stdin: "3\n90 75 49\n", expected: "90 A\n75 B\n49 F\npassed=2\n" },
            { stdin: "1\n100\n", expected: "100 A\npassed=1\n", hidden: true },
          ],
        },
        {
          title: "What strict mode catches",
          prompt: `Read \`n\` names of mistakes and, for each, perform it inside \`try\`/\`catch\` in strict mode, printing \`<name>: <error class name>\` or \`<name>: no error\`: \`undeclared\` (assign to a name that was never declared), \`frozen\` (assign a property on \`Object.freeze({})\`), \`delete-builtin\` (\`delete Object.prototype\`), \`this-plain-call\` (call a plain function that returns \`this\` — print \`this-plain-call: undefined\` when it is, else \`this-plain-call: defined\`), \`nan-math\` (\`Math.sqrt(-1)\` — no error, print as such).

Example: \`3\` then \`undeclared frozen nan-math\` →
\`\`\`
undeclared: ReferenceError
frozen: TypeError
nan-math: no error
\`\`\``,
          starterFile: "code/strict.starter.js",
          solutionFile: "code/strict.solution.js",
          hints: ["In sloppy mode all of these would pass silently — strict mode is what makes them throw.", "e.constructor.name gives the error class as text."],
          cases: [
            { stdin: "3\nundeclared frozen nan-math\n", expected: "undeclared: ReferenceError\nfrozen: TypeError\nnan-math: no error\n" },
            { stdin: "2\nthis-plain-call delete-builtin\n", expected: "this-plain-call: undefined\ndelete-builtin: TypeError\n" },
            { stdin: "1\nfrozen\n", expected: "frozen: TypeError\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Predict the output:\n```js\nfunction f() {\n  return\n    { ok: true };\n}\nconsole.log(f());\n```",
          options: ["`{ ok: true }`", "`undefined` — ASI ends the `return` at the line break", "A syntax error", "`true`"],
          answer: 1,
          explanation: "Keep the returned value on the same line as `return`.",
        },
        {
          prompt: "Which line is dangerous without a leading semicolon in semicolon-free code?",
          options: ["`const x = 1`", "`[1, 2].forEach(f)` — it continues the previous line as an index", "`if (x) y()`", "`let y`"],
          answer: 1,
          explanation: "Lines starting with `(`, `[`, a template literal, `+`, `-` or `/` continue the previous statement.",
        },
        {
          prompt: "An arrow function with an expression body…",
          options: ["Needs `return`", "Returns the expression's value implicitly: `x => x * 2`", "Cannot use the conditional operator", "Must have braces"],
          answer: 1,
          explanation: "With braces it is a block body and needs an explicit `return`.",
        },
        {
          prompt: "In strict mode, `this` inside a plain function call is…",
          options: ["The global object", "`undefined`", "The function itself", "`null`"],
          answer: 1,
          explanation: "Sloppy mode substitutes the global object — one of the silent behaviours strict mode removes.",
        },
        {
          prompt: "`const obj = { class: 1 }; obj.class`…",
          options: ["Is a syntax error — `class` is reserved", "Is fine: reserved words may be property names, just not variable names", "Returns `undefined`", "Creates a class"],
          answer: 1,
          explanation: "`const class = 1` would be the error.",
        },
      ],
    },
    {
      slug: "the-event-loop-preview",
      file: "05-the-event-loop-preview.md",
      exercises: [
        {
          title: "Schedule it for real",
          prompt: `Read \`n\` tokens of the form \`<kind>:<label>\` where kind is \`sync\`, \`micro\` or \`timeout\`. Process them in order: \`sync\` logs its label immediately; \`micro\` schedules \`console.log(label)\` with \`Promise.resolve().then(...)\`; \`timeout\` schedules it with \`setTimeout(..., 0)\`. Let the runtime run and observe the order: every \`sync\`, then every \`micro\` in order, then every \`timeout\` in order — regardless of how the tokens were interleaved.

Example: \`4\` then \`timeout:t1 sync:s1 micro:m1 sync:s2\` →
\`\`\`
s1
s2
m1
t1
\`\`\``,
          starterFile: "code/schedule.starter.js",
          solutionFile: "code/schedule.solution.js",
          hints: ["Nothing you schedule runs until the loop that schedules it has finished.", "Microtasks drain before any timer callback runs."],
          cases: [
            { stdin: "4\ntimeout:t1 sync:s1 micro:m1 sync:s2\n", expected: "s1\ns2\nm1\nt1\n" },
            { stdin: "3\nmicro:a micro:b timeout:c\n", expected: "a\nb\nc\n" },
            { stdin: "5\ntimeout:x timeout:y micro:p sync:q micro:r\n", expected: "q\np\nr\nx\ny\n", hidden: true },
          ],
        },
        {
          title: "Simulate the loop",
          prompt: `The same input as before — \`n\` tokens \`sync:<label>\`, \`micro:<label>\`, \`timeout:<label>\` — but this time compute the order **without scheduling anything**: walk the tokens once, printing \`sync\` labels immediately and collecting \`micro\` labels into one list and \`timeout\` labels into another; then print the microtask list, then the timeout list. Finish with \`order=<all labels in output order, joined by ,>\`.

Example: \`4\` then \`timeout:t1 sync:s1 micro:m1 sync:s2\` →
\`\`\`
s1
s2
m1
t1
order=s1,s2,m1,t1
\`\`\``,
          starterFile: "code/simulate.starter.js",
          solutionFile: "code/simulate.solution.js",
          hints: ["The model is two queues drained in a fixed order after the synchronous pass.", "Both queues are FIFO — push at the end, print from the front."],
          cases: [
            { stdin: "4\ntimeout:t1 sync:s1 micro:m1 sync:s2\n", expected: "s1\ns2\nm1\nt1\norder=s1,s2,m1,t1\n" },
            { stdin: "2\ntimeout:only sync:first\n", expected: "first\nonly\norder=first,only\n" },
            { stdin: "3\nmicro:c micro:b micro:a\n", expected: "c\nb\na\norder=c,b,a\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Predict the output order:\n```js\nconsole.log(1);\nsetTimeout(() => console.log(2), 0);\nPromise.resolve().then(() => console.log(3));\nconsole.log(4);\n```",
          options: ["1 2 3 4", "1 4 3 2", "1 4 2 3", "1 3 4 2"],
          answer: 1,
          explanation: "Synchronous logs first, then the microtask (promise), then the task (timeout).",
        },
        {
          prompt: "`setTimeout(fn, 0)` guarantees that `fn` runs…",
          options: ["Immediately", "After the current task and all pending microtasks — the delay is a minimum", "Exactly 0 ms later", "Before any promise callback"],
          answer: 1,
          explanation: "A busy stack delays every timer.",
        },
        {
          prompt: "Microtasks queued by a microtask run…",
          options: ["In the next task", "Before the next task — the microtask queue drains completely", "Never", "Only in browsers"],
          answer: 1,
          explanation: "Which is why a promise chain of ten `then`s finishes before one `setTimeout(0)`.",
        },
        {
          prompt: "Why does `while (true) {}` freeze a page?",
          options: ["It uses too much memory", "The call stack never empties, so no event — click, timer, response — can be handled", "It throws after a while", "It blocks the network only"],
          answer: 1,
          explanation: "One thread: whatever is on the stack must finish first.",
        },
        {
          prompt: "Two `setTimeout` callbacks with the same delay run…",
          options: ["In random order", "In the order they were scheduled", "Simultaneously", "In reverse order"],
          answer: 1,
          explanation: "The task queue is FIFO for equal due times.",
        },
      ],
    },
    {
      slug: "runtime-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Ragged input census",
          prompt: `Read all of standard input. Print \`lines=<number of non-blank lines>\`, \`tokens=<number of whitespace-separated tokens>\`, \`numbers=<how many tokens are finite numbers by Number()>\` and \`sum=<sum of those numbers>\` (print integers without a decimal point, otherwise up to 2 decimals via \`Number(x.toFixed(2))\`). Empty input prints all zeros.

Example input
\`\`\`
3 apples   4.5
  and 2 more

\`\`\`
→
\`\`\`
lines=2
tokens=6
numbers=3
sum=9.5
\`\`\``,
          starterFile: "code/census.starter.js",
          solutionFile: "code/census.solution.js",
          hints: [
            "Filter blank lines with trim() !== \"\".",
            "Number(t) is finite for numeric tokens and NaN for words; Number.isFinite rejects NaN.",
            "Guard the empty-input case before splitting.",
          ],
          cases: [
            { stdin: "3 apples   4.5\n  and 2 more\n\n", expected: "lines=2\ntokens=6\nnumbers=3\nsum=9.5\n" },
            { stdin: "\n", expected: "lines=0\ntokens=0\nnumbers=0\nsum=0\n" },
            { stdin: "1e3 0x10 abc -2.25\n0\n", expected: "lines=2\ntokens=5\nnumbers=4\nsum=1013.75\n", hidden: true },
          ],
        },
        {
          title: "Report card",
          prompt: `Read \`n\` and \`n\` lines \`<name> <s1> <s2> <s3>\`. For each print the name left-aligned in 8, the three scores each right-aligned in 4, and the average with one decimal right-aligned in 6 — e.g. \`ada       90  80  70  80.0\`. Then a line \`best=<name with the highest average; first on ties>\`. Build all lines first and print once.

Example: \`2\` then \`ada 90 80 70\`, \`bob 100 100 95\` →
\`\`\`
ada       90  80  70  80.0
bob      100 100  95  98.3
best=bob
\`\`\``,
          starterFile: "code/report-card.starter.js",
          solutionFile: "code/report-card.solution.js",
          hints: [
            "padEnd for the name, padStart for every number.",
            "Strictly greater keeps the first of equal averages.",
            "toFixed(1) rounds and returns a string ready for padStart.",
          ],
          cases: [
            { stdin: "2\nada 90 80 70\nbob 100 100 95\n", expected: "ada       90  80  70  80.0\nbob      100 100  95  98.3\nbest=bob\n" },
            { stdin: "1\nz 0 0 0\n", expected: "z          0   0   0   0.0\nbest=z\n" },
            { stdin: "3\na 50 50 50\nb 50 50 50\nc 49 51 50\n", expected: "a         50  50  50  50.0\nb         50  50  50  50.0\nc         49  51  50  50.0\nbest=a\n", hidden: true },
          ],
        },
        {
          title: "Event loop simulator, nested",
          prompt: `Simulate the ordering rules with nested scheduling. Read \`n\` tokens; each is \`<kind>:<label>\` or \`<kind>:<label>><kind>:<label>\` — the part after \`>\` is what the callback schedules when it runs (one level deep). Kinds: \`sync\`, \`micro\`, \`timeout\`. Rules: run the script (sync labels print immediately; scheduled items join their queues); drain the microtask queue fully (a microtask that schedules a microtask adds it to the **end** of the same drain; one that schedules a timeout adds to the task queue); then run tasks one at a time, draining microtasks after **each**. Print the labels in order, then \`order=<joined by ,>\`.

Example: \`3\` then \`timeout:t1>micro:m2 micro:m1>timeout:t2 sync:s\` →
\`\`\`
s
m1
t1
m2
t2
order=s,m1,t1,m2,t2
\`\`\``,
          starterFile: "code/loop-nested.starter.js",
          solutionFile: "code/loop-nested.solution.js",
          hints: [
            "Model each scheduled item as its label plus what it schedules when run.",
            "Draining microtasks is a while loop over a queue that may grow while you drain it.",
            "After every task, drain microtasks again before taking the next task.",
          ],
          cases: [
            { stdin: "3\ntimeout:t1>micro:m2 micro:m1>timeout:t2 sync:s\n", expected: "s\nm1\nt1\nm2\nt2\norder=s,m1,t1,m2,t2\n" },
            { stdin: "2\nmicro:a>micro:b micro:c\n", expected: "a\nc\nb\norder=a,c,b\n" },
            { stdin: "3\ntimeout:x>timeout:y timeout:z sync:w>micro:v\n", expected: "w\nv\nx\nz\ny\norder=w,v,x,z,y\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "TC39 is…",
          options: ["A JavaScript engine", "The committee that specifies ECMAScript in yearly editions", "Node's package registry", "A testing framework"],
          answer: 1,
          explanation: "Features pass through four stages before landing in a yearly edition.",
        },
        {
          prompt: "The engine pipeline, in order, is…",
          options: ["JIT → parse → interpret", "Parse → bytecode interpreted → profile → JIT-compile hot code → deoptimise on failed speculation", "Compile ahead of time → run", "Interpret only"],
          answer: 1,
          explanation: "Fast start-up from the interpreter, peak speed from the optimising compiler.",
        },
        {
          prompt: "Which is **not** a Node host global?",
          options: ["`process`", "`Buffer`", "`document`", "`require`"],
          answer: 2,
          explanation: "`document` belongs to the browser's DOM.",
        },
        {
          prompt: "`readFileSync(0, \"utf8\")` returns…",
          options: ["A line", "All of stdin as a string", "A Buffer", "An array of tokens"],
          answer: 1,
          explanation: "`trim().split(/\\s+/)` turns it into tokens.",
        },
        {
          prompt: "To print exactly `1 2 3` from an array…",
          options: ["`console.log(arr)`", "`console.log(arr.join(\" \"))`", "`console.log(String(arr))`", "`console.log(...arr, \"\")`"],
          answer: 1,
          explanation: "`console.log(arr)` gives `[ 1, 2, 3 ]`; `String(arr)` gives `1,2,3`.",
        },
        {
          prompt: "`x.toFixed(2)` returns…",
          options: ["A number", "A string", "An integer", "A BigInt"],
          answer: 1,
          explanation: "Arithmetic on it would concatenate; convert back with `Number` if needed.",
        },
        {
          prompt: "Predict: `const f = () => { return\n 42; }; f()`",
          options: ["`42`", "`undefined`", "A syntax error", "`null`"],
          answer: 1,
          explanation: "ASI terminates `return` at the newline.",
        },
        {
          prompt: "Strict mode makes `undeclaredName = 5`…",
          options: ["Create a global", "Throw a `ReferenceError`", "Throw a `TypeError`", "Be ignored"],
          answer: 1,
          explanation: "In sloppy mode it silently creates a global variable.",
        },
        {
          prompt: "Predict the order: `setTimeout(a, 0); Promise.resolve().then(b); c();`",
          options: ["a b c", "c b a", "c a b", "b c a"],
          answer: 1,
          explanation: "Synchronous `c`, then the microtask `b`, then the timer `a`.",
        },
        {
          prompt: "A microtask that queues another microtask…",
          options: ["Runs it in the next task", "Runs it in the same drain, before any timer", "Runs it immediately, recursively", "Is an error"],
          answer: 1,
          explanation: "The microtask queue is drained to empty before the loop proceeds.",
        },
        {
          prompt: "Node stays alive after the script ends when…",
          options: ["Always", "Something is pending — a timer, a server socket, an unfinished read", "`\"use strict\"` is set", "Never"],
          answer: 1,
          explanation: "`process.exit` ends it regardless.",
        },
        {
          prompt: "`const` in JavaScript means…",
          options: ["The value is immutable", "The binding cannot be reassigned; an object it points to can still change", "Compile-time constant only", "Same as `var`"],
          answer: 1,
          explanation: "`const o = {}; o.x = 1` is fine; `o = {}` is not.",
        },
      ],
    },
  ],
});
