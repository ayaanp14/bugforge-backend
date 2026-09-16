---
title: The Java theory drill — thirty questions, thirty answers
minutes: 16
---
Every Java interview has a theory section, and the questions have not changed in a decade. This lesson is the drill: the thirty questions you will be asked, each with the two-sentence answer an interviewer wants to hear and a pointer to the module that explains it in depth. Read it twice a week before interviews. The answers are deliberately compact — the skill being tested is saying the essential thing first, then stopping so the interviewer can ask the follow-up.

## Platform and language basics

1. **JDK vs JRE vs JVM?** The JVM executes bytecode; the JRE is the JVM plus the standard library; the JDK is the JRE plus compiler and tools. *(Module 1)*
2. **Why is Java "write once, run anywhere"?** Source compiles to platform-neutral bytecode; each platform's JVM interprets and JIT-compiles it. *(1)*
3. **Is Java pass-by-value or pass-by-reference?** Strictly pass-by-value; for objects the value copied is the reference, so callees can mutate the object but not rebind the caller's variable. *(5, 16)*
4. **Why are strings immutable?** Safety (they are everywhere — class names, keys, security), the string pool needs sharing, hash code caching, and thread safety for free. *(3, 16)*
5. **`==` vs `equals`?** Reference identity versus logical equality; `equals` for strings and boxed numbers, always. *(3, 20)*
6. **`final`, `finally`, `finalize`?** Constant/non-overridable/non-extensible; the always-runs block after `try`; the deprecated GC hook — never use. *(7, 12, 16)*
7. **Checked vs unchecked exceptions?** Checked must be declared or caught (recoverable conditions the caller should handle); unchecked (`RuntimeException`) signal programming errors. *(12)*
8. **`String`, `StringBuilder`, `StringBuffer`?** Immutable; mutable and fast; mutable and synchronised (legacy). Builder in loops. *(3)*
9. **Autoboxing pitfalls?** `Integer` cache −128..127 makes `==` lie; boxing allocates; `remove(int)` vs `remove(Object)`; unboxing `null` is an NPE. *(2, 16)*
10. **`static` means?** Belongs to the class, one copy, no `this`; static methods cannot be overridden (they hide). *(7)*

## Object orientation

11. **Overloading vs overriding?** Same name different parameters, resolved at compile time by static types; same signature in a subclass, dispatched at run time by the object's class. *(5, 8)*
12. **Abstract class vs interface?** A class with state and partial implementation, single inheritance; a contract, multiple implementation, `default` methods but no instance state. Prefer interfaces; abstract classes for shared state. *(8, 9)*
13. **Can a constructor be overridden? Called virtually?** No — constructors are not inherited; and calling an overridable method from a constructor sees the subclass's fields uninitialised. *(7, 8)*
14. **What is polymorphism in Java?** A reference of a supertype invoking the runtime type's override — dynamic dispatch through the vtable. *(8)*
15. **Composition vs inheritance?** Has-a versus is-a; prefer composition — inheritance couples to the parent's implementation and breaks encapsulation. *(8)*
16. **What do records give you?** Immutable value classes with `equals`/`hashCode`/`toString`/accessors generated; compact constructors for validation. *(10)*
17. **Sealed classes?** A fixed set of permitted subtypes, enabling exhaustive switches. *(9, 19)*

## Generics and collections

18. **Type erasure?** Generics exist only at compile time; at run time `List<String>` is `List` — no `new T[]`, no `instanceof List<String>`, one class for all instantiations. *(13)*
19. **`? extends` vs `? super`?** Producer extends (read), consumer super (write) — PECS. *(13)*
20. **How does `HashMap` work?** Hash → spread → bucket; chain or tree on collision; resize at 0.75 load; needs consistent `equals`/`hashCode`; O(1) average. *(14)*
21. **`ArrayList` vs `LinkedList`?** Array-backed, O(1) index, amortised O(1) append; node-backed, O(n) index, poor cache behaviour — almost always `ArrayList`. *(14)*
22. **`HashMap` vs `TreeMap` vs `LinkedHashMap`?** Unordered O(1); sorted O(log n) with navigation; insertion (or access) order O(1). *(14)*
23. **Fail-fast iteration?** Modifying a collection while iterating throws `ConcurrentModificationException`; use the iterator's `remove` or `removeIf`. *(14)*
24. **`Comparable` vs `Comparator`?** Natural order on the type versus an external order per use; `Integer.compare`, never subtraction. *(9, 20)*

## Streams, memory, concurrency

25. **Intermediate vs terminal operations?** Lazy, return a stream, do nothing until a terminal; the terminal runs the pipeline once. Streams are single-use. *(15)*
26. **Where do objects and locals live?** Heap and thread stack respectively; `StackOverflowError` versus `OutOfMemoryError`. *(16)*
27. **How does garbage collection work?** Reachability from roots, generational (young/old), stop-the-world pauses reduced by concurrent collectors (G1 default, ZGC). *(16)*
28. **Thread vs Runnable; `start` vs `run`?** Pass a `Runnable` to a `Thread`; `start` spawns a thread that calls `run`; `run` directly is a plain call. *(17)*
29. **`synchronized` vs `volatile`?** Mutual exclusion plus visibility, for compound updates; visibility only, for a flag or a published immutable reference. *(17)*
30. **What is a deadlock and how do you avoid it?** Threads waiting on each other's locks forever; consistent lock ordering, one lock, or `tryLock` with back-off. *(17)*

## The follow-ups they actually ask

- After 4: *"Then how does `StringBuilder` exist?"* — a separate mutable class; `String` shares nothing with it.
- After 9: *"So is `Integer.valueOf(127) == Integer.valueOf(127)` true?"* — yes; 128, no.
- After 11: *"What is printed?"* — a snippet with an overloaded `describe(Animal)`/`describe(Dog)` called with an `Animal` reference to a `Dog`: the `Animal` overload (static type), while `a.speak()` is the `Dog` override (runtime type). Fields are never polymorphic.
- After 18: *"Then how does `List<String>.get` return a `String`?"* — the compiler inserts the cast.
- After 20: *"What if `hashCode` always returns 1?"* — everything in one bucket; O(n) lookups, or O(log n) once it treeifies (Java 8+, if keys are `Comparable`).
- After 25: *"Can you reuse a stream?"* — no; `IllegalStateException`.
- After 29: *"Is `volatile int count; count++` safe?"* — no; `AtomicInteger`.

## How to answer theory questions

Lead with the one-sentence definition, add the one consequence that matters, stop. If you know a version number or a class name, say it — "`ConcurrentHashMap`, since Java 8 with per-bin locking" beats "there's a concurrent map". Never guess a fact you are unsure of; "I believe it is X, but I would check" is a fine answer and a wrong confident answer is not. When you do not know, connect it to what you do: "I have not used `StampedLock`, but I know `ReadWriteLock` and would expect it to be the faster, non-reentrant variant."

## Key takeaways

- Thirty questions cover almost every Java theory round; know the two-sentence answer to each.
- Lead with the definition, add one consequence, stop; name classes and versions.
- Expect the follow-up: the cache boundary, the overload-versus-override snippet, the all-ones `hashCode`.
- Never bluff; connect the unknown to the known.
