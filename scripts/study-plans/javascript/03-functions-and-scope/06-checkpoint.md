---
title: Checkpoint — Functions, scope and closures
minutes: 24
---
This checkpoint covers the three ways to define a function and how they hoist, parameters with defaults, rest and spread, lexical scope and the scope chain, closures and their patterns and pitfalls, the five rules for `this` with `call`/`apply`/`bind`, and higher-order functions — composition, currying and the callback convention.

**How it works.** Twelve questions and three programs; 70% on the questions and every program accepted clears the module.

**Before you start**, make sure you can answer:

- Why a function declaration can be called above its line and a `const` arrow cannot.
- When a default parameter applies, and the difference between rest and spread.
- What a closure captures (variables, not values) and why `for (var …)` callbacks all see the last value.
- The five `this` rules in precedence order, and the three ways to fix a detached method.
- What `bind` returns and why it cannot rebind an arrow.
- How `pipe` and `compose` differ, and why `["1","2"].map(parseInt)` fails.

The programs are a counter factory with private state and an audit log, a `this`-binding tracer that prints which rule decided each call, and a small function-pipeline interpreter built from `pipe`, `curry` and `once`.
