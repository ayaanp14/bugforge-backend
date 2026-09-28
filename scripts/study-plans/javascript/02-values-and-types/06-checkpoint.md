---
title: Checkpoint — Values, types and coercion
minutes: 24
seo-title: JavaScript Types Quiz: Coercion, Equality and NaN Practice
description: Test your grasp of JavaScript values with 12 questions and three programs on typeof, NaN, BigInt, string methods, truthiness, == vs === and let vs var.
q: In what order does == convert its operands in JavaScript?
a: If the types match, `==` behaves like `===`. Otherwise `null` and `undefined` equal each other and nothing else; a string compared with a number becomes a number; a boolean becomes a number; and an object compared with a primitive is converted with `valueOf` or `toString`.
q: How does the less-than operator compare two strings in JavaScript?
a: When both sides are strings, `<` compares them by UTF-16 code units rather than numerically, so `"10" < "9"` and `"Z" < "a"` are both `true`. If either side is not a string, both are converted to numbers first.
q: Where do exact integers end in JavaScript?
a: At `Number.MAX_SAFE_INTEGER`, which is 2⁵³ − 1. Past it, doubles start skipping integers — `2 ** 53 + 1` evaluates to `2 ** 53` — so arithmetic silently rounds; a program that must stay exact should switch to `BigInt`.
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
