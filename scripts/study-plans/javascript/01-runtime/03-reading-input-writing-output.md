---
title: Reading input and writing output in Node
minutes: 13
seo-title: How to Read Input in Node.js: stdin, readline and Output
description: Read all of stdin in Node.js with fs.readFileSync(0, "utf8") or line by line with readline, then print exact output fast by joining lines into one console.log.
question: How do you read input from stdin in Node.js?
answer: In Node.js, `require("fs").readFileSync(0, "utf8")` reads all of standard input as one string, because file descriptor 0 is stdin. Trim it, split it on whitespace into tokens and convert each with `Number`. For input that arrives over time, the `readline` module's `line` and `close` events, or the `process.stdin` stream, deliver it in callbacks instead.
q: How do I read input line by line in Node.js?
a: Create an interface with `require("readline").createInterface({ input: process.stdin })`, collect each line in its `line` handler, and solve inside the `close` handler, which fires at end of input. Code outside the handlers runs before any line has arrived.
q: Why is console.log slow in a loop?
a: Each `console.log` call is a synchronous write, so printing a hundred thousand lines one call at a time can exceed a judge's time limit. Collect the lines in an array, join them with newlines and print the result in a single `console.log`.
q: What is the difference between Number and parseInt in JavaScript?
a: `Number` needs the whole string to be numeric, so `Number("12px")` is `NaN`, while `parseInt("12px", 10)` reads the leading digits and returns `12`. That prefix reading also makes `parseInt("1e3")` return `1` where `Number` gives `1000`.
q: How do I print an array without brackets in JavaScript?
a: Join it into a string first: `console.log(arr.join(" "))` prints `1 2 3`, whereas `console.log([1, 2, 3])` prints the human-readable `[ 1, 2, 3 ]`, which a judge comparing exact text rejects.
q: How do I get command-line arguments in Node.js?
a: `process.argv` holds the Node binary's path, the script's path and then the user's arguments, so `process.argv.slice(2)` is what was typed after the script name. Environment variables are in `process.env`, as strings or `undefined`.
---
Every exercise in this plan is a program that reads standard input and prints to standard output — the same contract as any coding judge. Node has three ways to read stdin, two ways to write stdout, and a handful of formatting habits that keep the output exactly right. This lesson gives you the template you will use ninety times and explains the alternatives so you recognise them in other people's code.

## The template: read everything at once

```js
"use strict";
const input = require("fs").readFileSync(0, "utf8");   // file descriptor 0 is stdin
const lines = input.split("\n");                        // by line…
const tokens = input.trim().split(/\s+/);                // …or by whitespace-separated token

let pos = 0;
const next = () => tokens[pos++];                        // a cursor over the tokens
const nextInt = () => Number(next());

const n = nextInt();
let sum = 0;
for (let i = 0; i < n; i++) sum += nextInt();
console.log(sum);
```

`readFileSync(0, "utf8")` blocks until stdin is closed and returns the whole text — fine for anything under a few tens of megabytes, which is every judge. `trim()` removes the trailing newline so the last token is not an empty string; `split(/\s+/)` splits on any run of whitespace, so the input's line structure does not matter. Watch the one edge case: `"".split(/\s+/)` gives `[""]`, not `[]`, so check for empty input before parsing.

`Number(token)` converts a numeric string; `parseInt(token, 10)` stops at the first non-digit (useful for `"12px"`, dangerous for `"1e3"`); `+token` is the terse form of `Number`. For numbers beyond 2⁵³ use `BigInt(token)` — module 2 explains why.

## Line by line: `readline`

When input arrives over time (an interactive tool, a pipe that never closes), the event-based reader is the tool:

```js
const rl = require("readline").createInterface({ input: process.stdin });
const lines = [];
rl.on("line", (line) => lines.push(line));
rl.on("close", () => {
  // all input has arrived; solve here
  console.log(lines.length);
});
```

Nothing after `createInterface` waits — the callbacks run later, when lines arrive, and `close` fires at end of input. This is the asynchronous style the whole runtime is built on (lesson 5 and module 8), and the reason the *solve* code lives inside the `close` handler: outside it, `lines` is still empty. For judged exercises, the synchronous template is simpler and never wrong.

## Streams, for completeness

```js
let data = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (data += chunk));
process.stdin.on("end", () => solve(data));
```

Chunks arrive in arbitrary sizes; only at `end` do you have the whole input. Same shape as `readline`, lower level. You will see it in older competitive code.

## Writing output

`console.log(a, b, c)` prints its arguments separated by spaces with a newline, formatting objects readably (`{ x: 1 }`, `[ 1, 2 ]`) — good for humans, wrong for judges that want exact text. For exact output, build strings yourself:

```js
console.log(`${name} scored ${score}`);           // template literal
console.log([1, 2, 3].join(" "));                  // "1 2 3", not "[ 1, 2, 3 ]"
console.log(String(x));                            // explicit conversion
process.stdout.write("no newline");               // raw write, you add "\n"
```

**Performance:** `console.log` in a loop of 10⁵ lines is slow — each call is a synchronous write. Collect lines in an array and print once: `console.log(out.join("\n"))`. That single change is the difference between "time limit exceeded" and passing on large outputs.

`console.error` writes to **stderr**, which a judge ignores — use it for debugging without corrupting the answer.

## Formatting numbers and text

| Need | Write |
| --- | --- |
| two decimals | `x.toFixed(2)` → `"3.14"` (a **string**, rounded half away from zero... mostly — see module 2) |
| padding | `String(n).padStart(3, "0")` → `"007"`; `name.padEnd(10)` |
| thousands separators | `n.toLocaleString("en-US")` → `"1,234,567"` |
| integer division | `Math.floor(a / b)` or `Math.trunc(a / b)` — `/` is always floating point |
| booleans | `String(true)` → `"true"` |
| join with separator | `arr.join(", ")` |
| repeat | `"-".repeat(20)` |

`toFixed` and `toLocaleString` return strings; arithmetic on them concatenates. Convert back with `Number(...)` if you must compute further — or, better, keep numbers as numbers until the final print.

## Arguments and environment

`process.argv` is `[nodePath, scriptPath, ...userArgs]`; `process.argv.slice(2)` is what the user typed after the script name. `process.env.HOME` and friends are environment variables (strings or `undefined`). Judges pass nothing through either, so exercises here use stdin only — but a CLI you write yourself will use both.

## Exit codes

A script that runs to completion exits `0`. An uncaught exception exits `1` and prints the stack trace to stderr. `process.exit(2)` ends immediately with code 2 — and skips anything still buffered for stdout in some cases, so prefer `process.exitCode = 2` and let the program end naturally.

## A checklist for judged output

1. Read once with `readFileSync(0, "utf8")`; `trim()` then split.
2. Handle empty input if the statement allows it.
3. Convert tokens with `Number`; use `BigInt` past 2⁵³.
4. Build exact strings; join arrays yourself; never `console.log` an object or array directly.
5. Collect many lines and print once.
6. Debug to `console.error`.

## Interview angle

- *"How do you read stdin in Node?"* `fs.readFileSync(0, "utf8")` for everything at once; `readline` or the `process.stdin` stream for incremental input.
- *"What does `console.log([1, 2])` print?"* `[ 1, 2 ]` — a human format; join for exact output.
- *"Why is `console.log` in a loop slow?"* A synchronous write per call; batch into one string.
- *"`Number("12px")` versus `parseInt("12px")`?"* `NaN` versus `12` — `Number` needs the whole string to be numeric.
- *"How does a Node process signal failure?"* A non-zero exit code: uncaught error → 1, or `process.exitCode`.

## Key takeaways

- Template: `readFileSync(0, "utf8")`, `trim`, `split(/\s+/)`, a token cursor, `Number`.
- `readline`/streams deliver input in callbacks — solve inside the `close`/`end` handler.
- Exact output means strings you built; `join`, `toFixed`, `padStart`; one big `console.log` for large outputs.
- `console.error` for debugging; exit codes via `process.exitCode`.
- Empty input and `"".split(...)` are the edge cases.
