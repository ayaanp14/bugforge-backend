---
title: Checkpoint — Values, types and coercion
minutes: 24
---
This checkpoint covers the seven primitives and `typeof`, numbers as doubles with `NaN`, safe integers and `BigInt`, strings and their toolkit, truthiness, the coercion rules behind `==`, `+` and the comparison operators, the nullish operators, and `let`/`const`/`var` with hoisting and the temporal dead zone.

**How it works.** Twelve questions and three programs; 70% on the questions and every program accepted clears the module.

**Before you start**, make sure you can answer:

- The two `typeof` traps and how to test for `null` and for arrays.
- Why `0.1 + 0.2 !== 0.3`, how to test for `NaN`, and where exact integers end.
- `Number("42px")` versus `parseInt("42px", 10)`; `slice` versus `substring`; why an emoji has length 2.
- The eight falsy values; `||` versus `??`; the rules `==` applies in order.
- What `+` does when one side is a string, and how `<` compares two strings.
- `var` versus `let` in a loop with callbacks, and what the temporal dead zone is.

The programs are a type-inspector that classifies input tokens the way the language would, a safe-arithmetic calculator that switches to `BigInt` when a result would lose precision, and a coercion table generator that prints what `==`, `===` and `+` produce for pairs of values.
