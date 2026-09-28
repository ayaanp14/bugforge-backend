---
title: Checkpoint — Memory and the JVM runtime
minutes: 30
seo-title: Java Memory Quiz: Heap, GC and String Pool Practice Test
description: Test Java memory management with 15 questions and three programs: stack and heap, references, garbage collection, the string pool and class loading.
q: Where do a local int, a local reference and its object live in Java?
a: The local `int` and the local reference both sit in the method's frame on the running thread's stack. The object the reference points to lives on the shared heap, like every object and array.
q: Why does a WeakHashMap with String literal keys never shrink?
a: String literals are interned in the string pool and stay reachable from the classes that use them, so the keys never lose their last strong reference and the collector never removes the entries.
q: What does a GC log full of Pause Full lines mean?
a: The old generation keeps filling up, or something keeps calling `System.gc()`. Frequent full pauses point to a memory leak, a heap too small for the live data, or medium-lived objects promoted prematurely out of the young generation.
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
