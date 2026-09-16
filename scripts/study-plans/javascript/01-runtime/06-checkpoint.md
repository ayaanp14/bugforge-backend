---
title: Checkpoint — JavaScript and its runtime
minutes: 24
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
