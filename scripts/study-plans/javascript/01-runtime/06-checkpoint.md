---
title: Checkpoint — JavaScript and its runtime
minutes: 24
seo-title: JavaScript Runtime Quiz: Node.js, ASI and Event Loop Practice
description: Test your JavaScript fundamentals with 12 questions and three programs on ECMAScript, V8, Node.js, reading stdin, semicolon insertion and event loop order.
q: What is the difference between JavaScript, ECMAScript and V8?
a: JavaScript is the language, ECMAScript is its specification, published every year by TC39, and V8 is one engine that implements that specification — the one inside Chrome, Edge, Node.js and Deno.
q: Why does splitting an empty string return one element in JavaScript?
a: Splitting an empty string on whitespace returns `[""]`, an array holding one empty string, not an empty array. Parsing empty input that way yields one bogus token, so check for empty input before you split it.
q: In what order do console.log, Promise.then and setTimeout 0 run?
a: Synchronous code runs first, then every promise callback, because microtasks drain completely after the current task, and then the `setTimeout(0)` callback, which is a task that waits for the next turn of the event loop.
q: Where does automatic semicolon insertion cause bugs?
a: In three places: `return` with its value on the next line, which returns `undefined`; a line beginning with `(`, `[` or a backtick, which continues the previous line; and `++` or `--` at the start of a line, which binds to that line rather than the one before.
---
This checkpoint covers what JavaScript is and how ECMAScript is specified, engines and the JIT pipeline, Node as a runtime with its globals, reading stdin and writing exact output, statements versus expressions and automatic semicolon insertion, strict mode, and the event loop's ordering of synchronous code, microtasks and tasks.

**How it works.** Twelve questions and three programs; 70% on the questions and every program accepted clears the module.

**Before you start**, make sure you can answer:

- The difference between JavaScript, ECMAScript and V8.
- The engine pipeline from source to machine code, and why predictable object shapes are fast.
- What `readFileSync(0, "utf8")` does and why `"".split(/\s+/)` needs a check.
- Why `console.log` of an array is wrong for a judge, and how to print many lines fast.
- The three places ASI bites, and what strict mode changes.
- The order of synchronous logs, promise callbacks and `setTimeout(0)` callbacks.

The programs are a token-cursor input parser that survives ragged lines, a report formatter that builds exact output, and an event-loop simulator that prints the order a script's logs would appear in.
