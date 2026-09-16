---
title: Reading stack traces and decoding the errors you will see most
minutes: 12
---
A stack trace is the single most useful diagnostic you will ever get for free, and most developers read only its first line. This lesson teaches the whole thing — the frame format, top-down order, which frames are yours, why async traces are short, what source maps do — and then decodes the dozen error messages that account for the majority of JavaScript bugs, each with its one-sentence cause and the fix. It closes with the debugging tools that beat `console.log` and the habit that beats all of them: reproduce, then read.

## Anatomy of a stack trace

```
TypeError: Cannot read properties of undefined (reading 'name')
    at greet (/app/src/greet.js:12:22)
    at Array.map (<anonymous>)
    at renderList (/app/src/list.js:40:15)
    at main (/app/src/index.js:8:3)
    at Module._compile (node:internal/modules/cjs/loader:1105:14)
```

Line one: `name: message`. Then one **frame** per active function, **innermost first** — the top frame is where the error was created, the bottom is the entry point. Each frame is `at <function> (<file>:<line>:<column>)`; frames with no function name read `at <file>:line:col`; native frames say `<anonymous>` or `node:internal/…`. Reading order: start at the top, skip down to the first frame in **your** code (here `greet.js:12:22`), open that line and column, and ask what was `undefined`. The column matters — `a.b.c` has two property reads and the column tells you which one failed.

Node prints frames from `node:internal` for its own machinery; browsers show framework frames. Neither is where the bug is, but the frames *between* yours show how you got there — the `Array.map` frame above says `greet` was a callback, so the bad element came from `renderList`'s array.

## Traces you cannot trust

- **The stack is captured at `new Error()`**, not at `throw`. An error created in a helper and thrown elsewhere points at the helper.
- **Async gaps.** After an `await` or inside a `.then` callback, the frames that led to the original call are gone — the callback runs from the event loop. V8 stitches some `await` frames back together ("async stack traces", default since Node 12), which helps for `async`/`await` and not at all for callbacks (module 8).
- **Minified or bundled code** gives `main.js:1:48213`. A **source map** (`//# sourceMappingURL=`) maps that back to the original file, line and function; browsers apply it automatically in devtools, Node needs `--enable-source-maps`. Production error trackers upload source maps for this reason.
- **`Error.stackTraceLimit`** defaults to 10 frames; deep recursion traces are cut. Raise it while debugging.
- A wrapped error shows the wrapper's trace; the original is in `err.cause` — log the chain.

## The errors you will see most

| Message (V8) | What it means | Look for |
| --- | --- | --- |
| `Cannot read properties of undefined (reading 'x')` | something before `.x` is `undefined` | the expression to the *left* of `.x`; an unawaited promise, a missing key, a misspelled property, `find` returning `undefined` |
| `x is not a function` | you called something that is not a function | the wrong import (`default` vs named), a property that is data, a method on the wrong object, calling the result instead of the function |
| `x is not defined` | an identifier does not exist in scope | a typo, a missing `import`/`require`, a variable declared in another block |
| `Cannot access 'x' before initialization` | `let`/`const`/`class` used in its temporal dead zone | code order; circular imports |
| `Assignment to constant variable.` | reassigning a `const` | you meant `let`, or you meant to mutate a property |
| `Maximum call stack size exceeded` | unbounded recursion (a `RangeError`) | a missing base case; a getter/setter calling itself; `toJSON` returning `this` |
| `Unexpected token } in JSON at position 42` | `JSON.parse` on text that is not JSON | an HTML error page, a trailing comma, single quotes, an empty response |
| `Unexpected end of JSON input` | `JSON.parse("")` or truncated text | an empty body |
| `Cannot set properties of undefined (setting 'x')` | assigning through `undefined` | an uninitialised object, `arr[i]` past the end |
| `Converting circular structure to JSON` | `JSON.stringify` on a cycle | parent/child links; use a replacer or `toJSON` |
| `Class constructor X cannot be invoked without 'new'` | called a class as a function | add `new`; or you passed the class where an instance was expected |
| `Invalid array length` | `new Array(-1)` or `length = 2**32` | a negative or huge computed size |
| `Cannot use import statement outside a module` | ESM syntax in a CommonJS file | `"type": "module"`, `.mjs`, or `require` (module 9) |
| `EADDRINUSE`, `ENOENT`, `ECONNREFUSED` | Node I/O errors with a `code` | a port in use, a missing path, nothing listening |

Two habits: read the *identifier* in the message (it is the name from your source), and read the **column**.

## `console.error`, `util.inspect` and friends

`console.log(err)` prints the stack and any own enumerable properties (your `code`, `field`); `console.log(err.message)` loses everything else. Use `console.error` for errors — it writes to stderr, which lets you separate diagnostics from program output. `util.inspect(obj, { depth: null, colors: true })` prints nested objects fully where `console.log` stops at depth 2 and prints `[Object]`. `console.table(rows)` for arrays of records; `console.dir(obj, { depth: null })` as a shortcut.

## Beyond `console.log`

- **`debugger;`** statement + `node inspect app.js` or `node --inspect-brk app.js` and Chrome's `chrome://inspect` — breakpoints, step, watch, call stack, scope variables. Faster than log-and-rerun once the bug takes more than two prints to find.
- **Conditional breakpoints** (right-click a breakpoint in devtools) — stop only when `id === 42`.
- **`Error.captureStackTrace(obj)`** — V8: attach a `stack` to any object, hiding frames above a given function; used by libraries to make custom errors point at the caller.
- **`node --trace-uncaught`**, `--trace-warnings`, `--enable-source-maps`.
- **`process.on("warning")`** and `NODE_OPTIONS=--trace-deprecation` to find deprecated calls.

## The habit

Reproduce first — a failing input, a test, a one-line script. Then read the top frame in your code and the column. Then form a hypothesis and check it with one print or breakpoint. Random edits without a reproduction are how a one-hour bug becomes a one-day bug.

## Common mistakes

- Reading only the first line of a trace; ignoring the column.
- Searching the message text on the web before opening the line it points at.
- Blaming the framework frame at the top when your frame is three lines down.
- `console.log(err.message)` in a catch — the stack and fields are gone.
- Debugging minified code without source maps.

## Interview angle

- *"How do you read a stack trace?"* Top line is type and message; frames are innermost first; find the first frame in your code, open the line and column.
- *"Why are async stack traces short?"* The callback runs from the event loop; the original call frames have returned — V8 reconstructs some for `await`.
- *"`Cannot read properties of undefined (reading 'x')` — what is wrong?"* The expression left of `.x` is `undefined`, not `x`.
- *"What is a source map?"* A file mapping minified positions back to original source; devtools apply it, Node needs `--enable-source-maps`.
- *"`x is not a function` — likely causes?"* Wrong import shape, data instead of method, wrong receiver, calling a result.

## Key takeaways

- Frames are innermost first; find your first frame, read line **and column**; native frames explain the route, not the bug.
- Stacks are captured at construction; async and minified traces need `await`-stitching and source maps; log the `cause` chain.
- Know the fourteen messages: most say "something to the left is undefined", "this is not a function", or "this name does not exist".
- `console.error(err)` (not `.message`), `util.inspect` with `depth: null`, `debugger` + `--inspect-brk`.
- Reproduce, read the frame, hypothesise, verify — in that order.
