---
title: Checkpoint — Generics
minutes: 24
---
This checkpoint covers the purpose of generics, generic classes and methods, bounded type parameters, wildcards and PECS, type erasure and its consequences, and the practical idioms.

**How it works.** Fourteen questions and two programs; 70% on the questions and both programs accepted clears the module.

**Before you start**, make sure you can answer:

- Why `List<Integer>` is not a `List<Number>`, and which wildcard fixes a read-only parameter.
- What `<T extends Comparable<? super T>>` means, word by word.
- Which of `new T()`, `T[]`, `instanceof List<String>`, `static T` are legal, and why not.
- What PECS stands for and how to apply it to `copy(dest, src)`.
- What a raw type does to type safety.

The programs are a generic bounded container with a PECS-correct method, and a generic utility set whose signatures the compiler must accept for several element types.
