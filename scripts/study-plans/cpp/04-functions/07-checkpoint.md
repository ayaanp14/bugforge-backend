---
title: Checkpoint — Functions
minutes: 25
seo-title: C++ Functions Quiz: Parameters, Recursion and Lambdas
description: Test your C++ functions knowledge with 14 questions and three programs on parameters, overloading, default arguments, recursion, lambda captures and static.
q: When should a parameter be `T`, `const T&` or `T&`?
a: `T` by value for small types such as `int`, `double` and pointers; `const T&` for anything larger that the function only reads, such as strings and vectors; and `T&` only when the function must modify the caller's object.
q: Given `f(int)` and `f(double)`, why is `f(3L)` a compile error?
a: Converting `long` to `int` and `long` to `double` are both standard conversions of the same rank, so neither overload is better and the call is ambiguous. The compiler refuses to guess rather than pick one.
q: What does a function-local `static` do on the second call?
a: It keeps the value the first call left, because it is initialised only once and lives until the program exits. A `static int counter = 0;` returned as `++counter` gives 1, then 2, then 3.
---
This checkpoint covers the whole module: declarations and definitions, the three ways to pass a parameter and returning by value, overloading and default arguments, recursion and memoisation, lambdas and captures, and scope, lifetime and linkage.

**How it works.** Fourteen questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- What is the difference between a declaration and a definition, and which error do you get when each is missing?
- When should a parameter be `T`, `const T&`, and `T&`?
- Given `f(int)` and `f(double)`, why is `f(3L)` a compile error?
- Where may a default argument be written, and why must it be trailing?
- What two things must every recursive function have, and what happens without them?
- What is the difference between `[x]` and `[&x]` in a capture list, and what does `mutable` change?
- What does a function-local `static` do on the second call, and what does `static` mean at namespace scope?

The three programs are a recursive permutation generator, a grade report built from small const-reference functions with a default argument and an overload, and a leaderboard sorted with a lambda and numbered by a function-local `static`. Read each input format carefully; the functions named in the prompt are the contract.
