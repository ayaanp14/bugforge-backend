---
title: Object lifecycle, reachability and reference types
minutes: 14
---
An object is born at `new`, lives while something can reach it, and is reclaimed some time after nothing can. Java has no `delete`; you cannot free an object, you can only stop referring to it. That single rule — **reachability, not reference counting** — decides what a "memory leak" means in Java, why cycles are harmless, and why `WeakHashMap` and `SoftReference` exist. This lesson follows an object from allocation to collection and introduces the four strengths of reference.

## Reachability and GC roots

The collector starts from the **roots**: every local variable and operand on every thread's stack, every `static` field of every loaded class, JNI handles, and a few runtime internals. Anything a root points to is live; anything a live object points to is live; and so on transitively. Everything else is **garbage**, no matter how many other garbage objects point to it.

```java
Node a = new Node(); Node b = new Node();
a.next = b; b.next = a;      // a cycle
a = null; b = null;          // nothing on the stack reaches the pair: both are garbage
```

Reference counting would keep that cycle alive forever; tracing from roots does not — the count of incoming references is irrelevant, only the path from a root matters. This is the first thing to say when asked "does Java leak with circular references?": no.

## What a leak is, then

A Java leak is an object that is **reachable but never used again**. The collector cannot tell the difference between "still needed" and "forgotten in a collection", so the classic leaks are all forms of forgetting:

- A `static List` or `Map` that only ever grows (a cache with no eviction, a registry nothing unregisters from).
- Listeners and callbacks registered with a long-lived object and never removed — the subject keeps the observer alive, and the observer keeps everything it references alive.
- `ThreadLocal` values in a thread pool: the thread outlives the request, so does the value, unless `remove()` is called.
- Inner-class instances holding an implicit `this` to a large outer object (a lambda or anonymous class stored somewhere long-lived).
- Substrings before Java 7u6 shared the parent's `char[]`; a habit of keeping a two-character substring of a 10 MB string kept the 10 MB. Fixed now — but the shape of the bug, *a small handle retaining a large structure*, recurs everywhere (an `Iterator` kept alive, a `Map.Entry`, a view from `subList`).
- Unclosed resources: a `FileInputStream` that is not closed holds a native file descriptor the collector may take minutes to release.

The fix is always the same: remove the reference when you are done, or use a reference type the collector may clear.

## The four reference strengths

| Reference | Collected when… | Typical use |
| --- | --- | --- |
| **Strong** (`Object o = …`) | never, while reachable | everything by default |
| `SoftReference<T>` | memory is short — cleared before an `OutOfMemoryError` | memory-sensitive caches |
| `WeakReference<T>` | the next GC finds no strong refs | canonicalising maps, listener lists, `WeakHashMap` keys |
| `PhantomReference<T>` | after finalization, before memory reuse | resource cleanup scheduling (with a `ReferenceQueue`) |

```java
WeakReference<byte[]> ref = new WeakReference<>(new byte[1_000_000]);
byte[] data = ref.get();       // the array, or null if it has been collected
```

`get()` on a weak or soft reference returns `null` once the collector has cleared it; code using them must always handle that. A `ReferenceQueue` passed to the constructor is where the reference object itself is enqueued after clearing, so a cache can learn that an entry died without polling.

**`WeakHashMap`** holds its *keys* weakly: when a key is no longer strongly referenced elsewhere, the entry disappears at the next collection. It is right for metadata attached to objects you do not own (a map from `Thread` to some per-thread info) and wrong for anything whose keys are `String` literals or `Integer`s — those are interned or cached and never become unreachable, so the map never shrinks.

Soft references are a tempting cache but a poor one in practice: the JVM clears them all at once under pressure, giving a cache that is either full or empty. A bounded LRU (`LinkedHashMap` with `removeEldestEntry`, lesson 6) or a real cache library is nearly always better.

## Finalization is gone; use `Cleaner` or `try-with-resources`

`Object.finalize()` was deprecated in Java 9 and marked for removal in 18: it ran at an unpredictable time on an unspecified thread, could resurrect objects, slowed collection, and an exception in it was silently swallowed. Resource cleanup is the job of **`AutoCloseable` + try-with-resources**, deterministic and immediate. For the rare case where a class must clean up native memory even if a careless caller forgets `close()`, `java.lang.ref.Cleaner` registers a cleanup action that runs after the object becomes phantom-reachable:

```java
class Handle implements AutoCloseable {
    private static final Cleaner CLEANER = Cleaner.create();
    private final Cleaner.Cleanable cleanable;
    Handle(long nativePtr) { this.cleanable = CLEANER.register(this, () -> free(nativePtr)); }   // the action must not capture `this`
    @Override public void close() { cleanable.clean(); }
}
```

The safety net runs *eventually*; `close()` runs *now*. Always provide and prefer `close()`.

## The lifecycle, end to end

1. **Allocation** — `new` bumps a pointer in the thread's local allocation buffer (TLAB): a few instructions, no lock. This is why "allocation is expensive" is folklore from another language; in Java it is *collection* that costs, in proportion to how many objects survive.
2. **Use** — the object is strongly reachable from a root.
3. **Unreachable** — the last strong reference is overwritten or its frame is popped. Nothing happens yet.
4. **Discovered** — a collection runs, traces from roots, does not find the object. Weak references to it are cleared and enqueued.
5. **Reclaimed** — its memory is reused. If it had a `Cleaner`, the action runs on the cleaner thread.

Between 3 and 5 the memory is still occupied; `System.gc()` *suggests* a collection and is ignored by many collectors (`-XX:+DisableExplicitGC`). Code that depends on an object being collected at a particular moment is wrong by design.

## Interview angle

- *"How does Java decide what to collect?"* Reachability from GC roots — stack locals, statics, JNI handles — traced transitively; not reference counts.
- *"Can circular references leak?"* No; an unreachable cycle is garbage.
- *"What is a memory leak in Java?"* A reachable object no one will use again — static collections, unremoved listeners, `ThreadLocal`s in pools.
- *"Weak versus soft reference?"* Weak: cleared at the next GC once unreferenced. Soft: kept until memory is short.
- *"Why not `finalize()`?"* Unpredictable, slow, unsafe, deprecated; use try-with-resources, and `Cleaner` as a last-resort safety net.

## Key takeaways

- Live = reachable from a root; everything else is garbage, cycles included.
- Leaks are forgotten references: static collections, listeners, `ThreadLocal`s, small handles to big structures.
- Strong / soft / weak / phantom — decreasing strength, increasing willingness to be cleared; `get()` may return `null`.
- `WeakHashMap` weak-keys; useless with interned or cached keys.
- No `finalize`; `AutoCloseable` now, `Cleaner` as the safety net; never rely on *when* a collection happens.
