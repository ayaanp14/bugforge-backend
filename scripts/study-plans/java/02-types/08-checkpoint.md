---
title: Checkpoint — Types & operators
minutes: 25
seo-title: Java Types and Operators Quiz: Casting and Overflow Practice
description: Fifteen questions and two programs on Java primitive types, casting, integer overflow, floating-point precision, money, operators and wrapper classes.
q: What does `Integer.MAX_VALUE + 1` give in Java?
a: `Integer.MIN_VALUE`, which is -2,147,483,648. `int` arithmetic wraps around silently in two's complement, with no exception; use `Math.addExact` to throw on overflow, or compute in `long`.
q: What do `(int) 3.99`, `Math.round(3.5)` and `-7 % 3` evaluate to?
a: `(int) 3.99` is 3, because a cast truncates toward zero; `Math.round(3.5)` is 4, returned as a `long`; `-7 % 3` is -1, because `%` takes the sign of the dividend. `Math.floorMod(-7, 3)` gives 2.
q: Why does `byte b = a + b` fail but `b += a` compile?
a: Arithmetic on `byte` values is done in `int`, so `a + b` is an `int` that needs a cast to go back into a `byte`. A compound assignment such as `b += a` contains that cast implicitly: it means `b = (byte) (b + a)`.
---
This checkpoint covers the eight primitives, variables and constants, conversions and promotion, integer arithmetic and overflow, floating point, operators and precedence, and the wrapper classes.

**How it works.** Fifteen questions and two programs; 70% on the questions and both programs accepted clears the module. Retake as often as you like — the best score counts.

**Before you start**, make sure these are automatic:

- The ranges of `int` and `long`, and what `Integer.MAX_VALUE + 1` gives.
- Why `byte b = a + b` fails and `b += a` compiles.
- What `(int) 3.99`, `Math.round(3.5)` and `-7 % 3` evaluate to.
- Why `0.1 + 0.2 != 0.3`, and what to use for money.
- The difference between `&&` and `&`, `>>` and `>>>`.
- When `Integer == Integer` is true and when it is not.

The programs exercise exactly the traps above: one is about doing arithmetic in the right type, the other about reading and formatting decimals without losing cents.
