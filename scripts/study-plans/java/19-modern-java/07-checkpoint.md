---
title: Checkpoint — Modern Java
minutes: 26
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
