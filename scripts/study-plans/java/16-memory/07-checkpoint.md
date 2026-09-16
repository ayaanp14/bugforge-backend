---
title: Checkpoint — Memory and the JVM runtime
minutes: 30
---
This checkpoint covers the stack and the heap, aliasing and pass-by-value, object layout, reachability and the four reference strengths, the leak shapes, generational garbage collection and the collectors, the string pool and the Integer cache, `StringBuilder` growth, class loading and initialisation order, the JIT, and the diagnosis toolkit with the LRU cache.

**How it works.** Fifteen questions and three programs; 70% on the questions and every program accepted clears the module.

**Before you start**, make sure you can answer:

- Where a local `int`, a local reference and the object it points to each live.
- Why two references to one array are an alias, and what a method can and cannot do to a caller's variable.
- What makes an object garbage, and why a cycle does not keep it alive.
- Weak versus soft references, and why `WeakHashMap` with `String` literal keys never shrinks.
- Minor versus full GC, and what a log full of `Pause Full` lines means.
- Why `"a" == "a"` but `new String("a") != "a"`, and where the Integer cache ends.
- The exact order of static and instance initialisers for `new Child()`.
- The two-line `LinkedHashMap` recipe for an LRU cache.

The programs are a tracing collector that decides what reference counting would have leaked, a bounded LRU cache with hit statistics, and an intern table that reports every hit and miss.
