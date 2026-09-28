---
title: Checkpoint — Modern Java
minutes: 26
seo-title: Modern Java Quiz: var, Pattern Matching and Java 21 Practice
description: Test modern Java with 15 questions and three programs on LTS versions, var, pattern matching, sealed types, new APIs, virtual threads and the module system.
q: In which Java versions did var, records, sealed classes and virtual threads arrive?
a: `var` arrived in Java 10, text blocks were final in 15, records in 16, sealed classes in 17, and pattern matching for `switch` and virtual threads in 21. The LTS versions are 8, 11, 17, 21 and 25.
q: What does a sealed type buy an exhaustive switch?
a: Because a sealed type lists every permitted subtype, the compiler can prove a `switch` covers them all without a `default`, and adding a subtype makes every switch that misses it fail to compile.
q: How is a pattern variable scoped in Java?
a: A pattern variable such as `s` in `o instanceof String s` exists only where the match is certain: inside the `if` body, on the right of `&&`, and after an early return on the negated test — never on the right of `||`.
---
This checkpoint covers the release cadence and the LTS milestones, `var` and inference, pattern `instanceof`, pattern `switch` and record patterns with exhaustiveness, the library additions from 9 to 21, virtual threads and structured concurrency, and the module system with the modern toolchain.

**How it works.** Fifteen questions and three programs; 70% on the questions and every program accepted clears the module.

**Before you start**, make sure you can answer:

- Which versions are LTS, and which of records, sealed, `var`, text blocks, pattern switch and virtual threads arrived in each.
- Where `var` is not allowed, and what `var list = new ArrayList<>()` infers.
- How a pattern variable is scoped, and what sealed buys an exhaustive `switch`.
- `List.of` versus `Arrays.asList` versus `Collections.unmodifiableList`; `strip` versus `trim`.
- What a virtual thread is, when it helps, and what pinning means.
- `requires transitive`, `opens`, and what the unnamed module is.

The programs — which compile on the Java 17-level runtime — are a shape calculator over a sealed hierarchy with pattern `instanceof`, a modern text pipeline using the new `String` and `Stream` methods, and an immutable configuration built from the collection factories.
