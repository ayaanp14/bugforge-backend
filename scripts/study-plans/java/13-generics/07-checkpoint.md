---
title: Checkpoint — Generics
minutes: 24
seo-title: Java Generics Quiz: Wildcards, PECS and Type Erasure Test
description: Practise Java generics with 14 questions and two programs on generic classes and methods, bounded types, wildcards and PECS, type erasure and raw types.
q: What does `<T extends Comparable<? super T>>` mean, word by word?
a: `T` is a type parameter; `extends` gives it an upper bound; that bound says `T` implements `Comparable` of `T` or of some supertype of `T`. So `T` values can be compared with each other, even when `compareTo` is inherited from a parent class.
q: How does PECS apply to `copy(dest, src)`?
a: `src` produces the elements, so it takes `List<? extends T>`; `dest` consumes them, so it takes `List<? super T>`. That is the JDK's `Collections.copy(List<? super T> dest, List<? extends T> src)`.
q: Which of `new T()`, `new T[n]`, `instanceof List<String>` and a static `T` field are legal?
a: None of them. Erasure leaves no class to construct for `new T()` or `new T[n]`, the JVM cannot see the `String` in `List<String>` at run time, and one class serves every `T`, so a static field cannot have type `T`.
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
