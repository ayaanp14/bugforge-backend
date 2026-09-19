---
title: Checkpoint — Iterators, generators and itertools
minutes: 25
---
This checkpoint covers the whole module: the iteration protocol with `iter`, `next` and `StopIteration`, generators with `yield`, `yield from` and laziness, generator expressions and the short-circuit consumers, the `itertools` toolkit with `groupby`'s consecutive-run rule and the combinatoric generators, `functools` and `operator`, and the design of lazy pipelines.

**How it works.** Twelve questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- What is the difference between an iterable and an iterator, and which one is `zip(a, b)`?
- What happens the first time a generator function is called, and when does its body run?
- Why is `sum(x for x in xs)` preferable to `sum([x for x in xs])`, and when is a list comprehension still right?
- What does `groupby` do on unsorted input?
- What are `product`, `permutations` and `combinations`, and how do their sizes grow?
- What does `@cache` require of a function?
- In a pipeline, which stage should handle a malformed record, and why?

The three programs are a run-length codec built on `groupby`, a subset-sum search over `combinations` that stops at the first hit, and a log pipeline of generator stages that parses, filters and aggregates in one pass.
