---
title: Checkpoint — Functions
minutes: 25
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
