---
title: Checkpoint — Streams
minutes: 30
---
This checkpoint covers the stream model (sources, lazy intermediates, one terminal), every intermediate operation including `flatMap`, `sorted`, `distinct`, `limit`/`skip` and `takeWhile`, the terminals with the three forms of `reduce`, the collectors — `toMap`, `joining`, `groupingBy` with downstreams, `partitioningBy`, `teeing` — `Optional` as a return type, the primitive streams, and parallel execution with its rules.

**How it works.** Fifteen questions and three programs; 70% on the questions and every program accepted clears the module.

**Before you start**, make sure you can answer:

- Why a pipeline with no terminal does nothing, and why a stream cannot be reused.
- When `map` is wrong and `flatMap` is right.
- What the one-argument `reduce` returns, and what a wrong identity does in parallel.
- How `toMap` fails on duplicate keys, and how to fix it.
- The shape of `groupingBy(classifier, mapFactory, downstream)`.
- `orElse` versus `orElseGet`; where `Optional` does not belong.
- Why `Stream<Integer>` is slower than `IntStream`, and what `sum()` of an empty stream is.
- The four things a lambda must not do inside a parallel pipeline.

The programs are a sales report built from `groupingBy` and `teeing`, a text analyser over `chars()` and `flatMap`, and a scheduler that finds the first free slot with `takeWhile`, `IntStream` and `Optional`.
