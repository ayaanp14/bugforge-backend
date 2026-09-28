---
title: Checkpoint — Methods
minutes: 22
seo-title: Java Methods Quiz: Overloading, Varargs and Recursion Test
description: Twelve questions and two programs on Java methods: static versus instance, pass-by-value, overload resolution, varargs, recursion and variable scope.
q: What does `fill(int[] a) { a[0] = 9; a = new int[1]; }` do to the caller's array?
a: It sets the caller's first element to 9 and nothing else. The parameter holds a copy of the reference, so writing through it changes the shared array, while `a = new int[1]` only points the local copy at a new array; the caller's variable is untouched.
q: Which overload does `f(5)` pick among `f(long)`, `f(Integer)` and `f(int...)`?
a: `f(long)`. The compiler tries widening before boxing and boxing before varargs, stopping at the first phase with a match, and widening `int` to `long` succeeds in the first phase. Without `f(long)` it would pick `f(Integer)`, and only without both `f(int...)`.
q: Why can't `main` call an instance method directly?
a: `main` is static, so it runs without an object and has no `this`, while an instance method needs an object to run on. Create one and call the method on it, as in `new App().run()`, or make the method static if it uses no instance state.
---
This checkpoint covers method declarations and calls, static versus instance, pass-by-value, overloading and its resolution rules, varargs, recursion, and scope.

**How it works.** Twelve questions and two programs; 70% on the questions and both programs accepted clears the module.

**Before you start**, make sure you can answer:

- What a method signature consists of, and what it excludes.
- What `fill(int[] a) { a[0] = 9; a = new int[1]; }` does to the caller's array.
- Which overload `f(5)` picks among `f(long)`, `f(Integer)` and `f(int...)`.
- What `print(null)` does to `print(String...)`.
- What every recursion needs, and what happens without it.
- Why `main` cannot call an instance method directly.

The programs are a recursion with a helper and an accumulator, and a small overloaded utility exercised through a fixed input format.
