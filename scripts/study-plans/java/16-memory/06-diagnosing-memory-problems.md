---
title: Diagnosing memory problems — leaks, dumps and bounded caches
minutes: 14
---
Everything so far has been the model. This lesson is what you do at two in the morning when the service falls over with `OutOfMemoryError`, and, more usefully, what you build in advance so it does not. The skills: reading the different OOM messages, taking and reading a heap dump, spotting the six leak shapes in code review, and writing the bounded structures — an LRU cache above all — that keep memory finite by construction.

## The messages, and what each means

| Message | Meaning | First move |
| --- | --- | --- |
| `Java heap space` | live objects exceed `-Xmx` | heap dump; find the biggest retained set |
| `GC overhead limit exceeded` | >98% of time in GC, <2% recovered — effectively the same as above | same |
| `Metaspace` | class metadata exhausted — classes loaded and never unloaded | class-loader leak: redeploys, dynamic proxies, generated classes |
| `unable to create native thread` | OS thread limit or per-thread stack memory exhausted | thread leak: unbounded `new Thread`, executors never shut down |
| `Direct buffer memory` | `ByteBuffer.allocateDirect` beyond `-XX:MaxDirectMemorySize` | buffers not released; NIO frameworks |
| `Requested array size exceeds VM limit` | asked for an array near `Integer.MAX_VALUE` | a size computation bug, or an unbounded read into one array |

Only the first two are about your objects; the others are about resources the heap size does not govern. Raising `-Xmx` fixes none of them and merely delays a leak.

## Taking the evidence

- `-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps` — the flags to have on *before* the incident. A dump is a snapshot of every object and reference; without it you are guessing.
- `jcmd <pid> GC.heap_dump /tmp/heap.hprof` — on demand, from a live process. `jmap -dump:live,format=b,file=…` is the older spelling; `live` forces a GC first so you see only reachable objects.
- `jcmd <pid> GC.class_histogram` (or `jmap -histo:live <pid>`) — the quick look: instance counts and bytes per class. If the top line is `[B` (byte arrays) or `String`, look at who *holds* them, not at the strings.
- `jstat -gcutil <pid> 1s` — live occupancy of each generation and GC counts per second. Old-generation occupancy that climbs after every full GC and never drops is the signature of a leak.
- **JFR** (`-XX:StartFlightRecording`) and **JDK Mission Control** — continuous low-overhead recording of allocations, GC, threads; the production-safe profiler.
- **Eclipse MAT** or **VisualVM** to open the dump: the *dominator tree* answers "which object keeps the most memory alive", and *path to GC roots* explains why it is still reachable.

## Reading a histogram

```
 num     #instances         #bytes  class name
   1:       1204411       57811728  [B
   2:       1204013       28896312  java.lang.String
   3:         12034       19311776  [Ljava.lang.Object;
   4:          9021        1010352  java.util.HashMap$Node
```

A million strings is not a diagnosis; who holds a million strings is. The `Object[]` at line 3 — 12 000 arrays averaging 1.6 KB — is likelier to be the interesting party: the backing arrays of `ArrayList`s. In the dominator tree you would find, say, one `ConcurrentHashMap` in a `static` field retaining 80 MB. That field is the leak.

## The six leak shapes to catch in review

1. **The growing static collection** — a cache, registry or "seen" set with `put` and no `remove`, no bound, no expiry.
2. **The unremoved listener** — `subject.addListener(this)` in a constructor with no matching removal; the long-lived subject keeps every short-lived listener.
3. **`ThreadLocal` in a pool** — set per request, never `remove()`d; the pooled thread lives for days.
4. **The unclosed resource** — streams, connections, `Scanner`s, `ExecutorService`s without `shutdown()`. Try-with-resources for the first three; an explicit lifecycle for the last.
5. **The captured outer** — a lambda or inner class stored in a static or a long-lived collection, dragging its enclosing object along.
6. **The mutable key** — a `HashMap` key whose `hashCode` changed after insertion: the entry is now unreachable through `get` and unremovable through `remove`, so it is a leak *and* a bug.

Each has a two-line fix. Finding them is a matter of asking, for every collection that lives longer than a request, "what removes things from this?"

## Bounded by construction: the LRU cache

The standard answer to "cache without leaking" is a bounded, least-recently-used map, and Java's `LinkedHashMap` was designed to be one:

```java
class Lru<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;
    Lru(int capacity) {
        super(16, 0.75f, true);          // accessOrder = true: get() moves the entry to the tail
        this.capacity = capacity;
    }
    @Override protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > capacity;        // called after every put; true evicts the head (least recent)
    }
}
```

`accessOrder = true` makes both `get` and `put` move an entry to the most-recent end; `removeEldestEntry` is consulted after each insertion. Twenty lines, O(1) per operation, and the interview's "design an LRU cache" solved with the standard library — then be ready to describe the hand-built version (a `HashMap` plus a doubly linked list) that it wraps. For a concurrent or expiry-based cache, use Caffeine; do not write one.

Other bounded shapes: a `Deque` trimmed to the last *n* events; a `PriorityQueue` kept at size *k* for top-k; `WeakHashMap` for metadata about objects you do not own; a `SoftReference` only when you have measured that it helps.

## Allocation hygiene in hot paths

- Prefer primitives and primitive arrays; `IntStream`, not `Stream<Integer>`; `int` counters, not `Integer`.
- Reuse buffers (`byte[]`, `StringBuilder.setLength(0)`) across iterations of a hot loop when the profiler says allocation matters — and only then; premature reuse is how shared mutable state is born.
- Pre-size collections when you know the count: `new ArrayList<>(n)`, `new HashMap<>(n * 4 / 3 + 1)`.
- Avoid `String.format` and regex in tight loops; both allocate freely.
- Stream `Files.lines` instead of `readAllLines` for large files; read a big input once with `readAllBytes` rather than line by line into a growing list you then join.

## Interview angle

- *"How would you find a memory leak?"* Watch old-gen occupancy with `jstat`; take a heap dump (`-XX:+HeapDumpOnOutOfMemoryError` or `jcmd`); open it in MAT; the dominator tree names the retaining collection; trace the path to GC roots.
- *"Name common leak causes."* Growing static collections, unremoved listeners, `ThreadLocal`s in pools, unclosed resources, captured outer instances, mutable keys.
- *"Design an LRU cache."* `LinkedHashMap` in access order with `removeEldestEntry`; or a `HashMap` + doubly linked list by hand, both O(1).
- *"What is `GC overhead limit exceeded`?"* The JVM spending almost all its time collecting and recovering almost nothing — the heap is full of live data.
- *"Does raising `-Xmx` fix an OOM?"* Only when the working set genuinely needs it; for a leak it postpones the crash.

## Key takeaways

- Read the OOM message: heap, Metaspace, threads and direct memory are different problems.
- Have dump-on-OOM on; `jcmd`, `jstat`, `jmap -histo`, JFR and MAT are the kit; the dominator tree names the culprit.
- Six leak shapes; the review question is "what removes entries from this?"
- Bound everything long-lived: LRU via `LinkedHashMap(accessOrder = true)` + `removeEldestEntry`.
- Allocate less in hot paths — primitives, pre-sizing, streaming input — after measuring.
