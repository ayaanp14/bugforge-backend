---
title: Garbage collection — generations, pauses and the collectors
minutes: 15
seo-title: Java Garbage Collection Explained: Generations, G1 and ZGC
description: How Java garbage collection works: mark, sweep, copy and compact, young and old generations, minor vs full GC, stop-the-world pauses, G1, ZGC and GC logs.
question: How does garbage collection work in Java?
answer: Garbage collection in Java finds the objects still reachable from GC roots, marks them live and reclaims the memory of everything else, usually compacting the survivors. Because most objects die young, the heap is split into a young generation, collected often and cheaply by copying, and an old generation, collected rarely. G1 has been the default collector since Java 9.
q: What is the difference between minor and major GC in Java?
a: A minor GC collects only the young generation; it is frequent and fast because most of Eden is already dead. A major or full GC collects the whole heap, old generation included; it is slower and should be rare. Frequent full GCs point to a leak, an undersized heap or premature promotion.
q: What is a stop-the-world pause in garbage collection?
a: A stop-the-world pause halts every application thread at a safepoint so the collector can trace the object graph safely. Classic collectors pause for the whole collection; G1 and ZGC do most of their marking concurrently and stop the world only briefly, trading some throughput for shorter pauses.
q: Which garbage collector does Java use by default?
a: G1 (Garbage-First) has been the default since Java 9. It divides the heap into equal regions and collects the ones with the most garbage first, aiming at a pause target set by `-XX:MaxGCPauseMillis`, 200 ms by default. ZGC suits very large heaps where pauses must stay sub-millisecond.
q: Does System.gc() force garbage collection?
a: No — `System.gc()` only suggests a collection. The JVM may ignore it, and `-XX:+DisableExplicitGC` turns it into a no-op; when it is honoured it is usually a full pause, so production code should not call it.
q: What does GC overhead limit exceeded mean?
a: The JVM throws `OutOfMemoryError: GC overhead limit exceeded` when it has spent more than 98% of recent time collecting and recovered less than 2% of the heap. The heap is effectively full of live data: look for a leak, or give the program the memory it genuinely needs.
---
The garbage collector is the part of the JVM people are most often asked about and least often understand beyond "it frees memory". The good news: the ideas are few. Every collector must *find* the live objects (mark), *reclaim* the rest (sweep or copy), and usually *defragment* (compact). The generational hypothesis says most objects die young, so the heap is split by age and the young part is collected often and cheaply. The differences between Serial, Parallel, G1 and ZGC are about **how many threads** do that work and **how long the application is paused** while they do. This lesson gives you the model and the vocabulary to read a GC log.

## Three primitive algorithms

- **Mark–sweep.** Trace from the roots and mark every live object; then walk the heap and free everything unmarked. Simple; leaves the free space fragmented, so a later large allocation may fail although the total free memory is enough.
- **Mark–compact.** Mark, then slide the live objects together to one end and update every reference to them. No fragmentation, allocation becomes a pointer bump, but every survivor is moved.
- **Copying.** Divide space in two; copy live objects from the active half to the empty half, leaving garbage behind; swap. Cost is proportional to *live* data, not heap size — which is superb when most objects are dead, and terrible when most are alive.

Every real collector is a combination: copying for the young generation (few survivors), mark–sweep or mark–compact for the old (many survivors).

## The generational hypothesis

Measured across decades of programs: **most objects die almost immediately** (an iterator, a temporary string, a boxed integer), and objects that survive a while tend to survive a long time (the cache, the session, the connection pool). So the heap is divided:

- **Young generation**: *Eden*, where everything is allocated, plus two *survivor* spaces. A **minor GC** copies Eden's survivors to a survivor space, incrementing each object's *age* in its header. Objects that reach the tenuring threshold (default 15, adjusted dynamically) are **promoted** to the old generation.
- **Old generation** (tenured): long-lived objects. Collected by a **major** (or *full*) GC — rarer, larger, slower.

Minor collections are frequent and fast precisely because Eden is mostly dead by the time it fills. A **premature promotion** problem — survivor spaces too small, medium-lived objects promoted and then dying in the old generation — makes full GCs frequent; that is the commonest tuning issue in practice.

## Stop-the-world, and why pauses matter

To trace the object graph safely the collector must stop application threads at a **safepoint** — every thread reaches a point where its stack is well described and pauses. The classic collectors stop the world for the whole collection; a full GC of a 30 GB heap can pause for seconds. Modern collectors do most of the marking **concurrently** with the application and stop the world only briefly, trading throughput (CPU spent on GC) for latency (pause length). Which trade is right depends on the program: a batch job wants throughput; a trading system wants a bounded pause.

## The collectors you will be asked about

| Collector | Flag | Threads | Pauses | Use when |
| --- | --- | --- | --- | --- |
| **Serial** | `-XX:+UseSerialGC` | one | stop-the-world | small heaps, single-core containers, client tools |
| **Parallel** (throughput) | `-XX:+UseParallelGC` | many, for young and old | stop-the-world but shorter | batch jobs where total throughput matters, pauses do not |
| **G1** (Garbage-First) | `-XX:+UseG1GC` (default since 9) | many; concurrent marking | short, targeted by `-XX:MaxGCPauseMillis` (200 ms default) | the general-purpose default: multi-GB heaps, servers |
| **ZGC** | `-XX:+UseZGC` (production since 15) | concurrent almost everything | sub-millisecond, independent of heap size | very large heaps, latency-sensitive services |
| **Shenandoah** | `-XX:+UseShenandoahGC` | concurrent compaction | low, like ZGC | same niche; Red Hat's collector |

**G1** divides the heap into equal regions (1–32 MB) rather than fixed contiguous generations; regions are young or old by role, collection picks the regions with the most garbage first ("garbage first"), and marking of the old generation runs concurrently. It is the right default answer to "which collector would you use?" — with "ZGC if the heap is huge and pauses must stay tiny".

## Reading a GC log

Turn logging on with `-Xlog:gc` (Java 9+; `-verbose:gc` still works):

```
[0.512s][info][gc] GC(3) Pause Young (Normal) (G1 Evacuation Pause) 124M->31M(512M) 8.412ms
[2.130s][info][gc] GC(7) Pause Full (System.gc()) 240M->88M(512M) 141.207ms
```

Read: at 0.512 s, the fourth collection, a young pause; heap went from 124 MB used to 31 MB used, of a 512 MB heap, in 8.4 ms. A log full of short `Pause Young` lines is healthy. `Pause Full` lines mean the old generation filled (or someone called `System.gc()`); frequent ones mean a leak, an undersized heap, or premature promotion. Use `-Xlog:gc*` for details and `jstat -gcutil <pid> 1s` for a live view.

## Sizing and the flags that matter

- `-Xms` / `-Xmx` — initial and maximum heap. Setting them equal avoids resize pauses on servers. In a container, `-XX:MaxRAMPercentage=75` is usually better than a fixed number.
- `-Xmn` or `-XX:NewRatio` — young generation size. Larger young = fewer minor GCs and less premature promotion.
- `-XX:MaxGCPauseMillis` — G1's target; tighter targets cost throughput.
- `-XX:+HeapDumpOnOutOfMemoryError` — always on in production; a dump is the only way to diagnose the OOM after the fact.
- `-XX:+DisableExplicitGC` — turn `System.gc()` into a no-op; libraries that call it are a known source of pauses.

The most effective tuning is not a flag: allocate less. Fewer temporaries, primitive arrays instead of boxed lists, reused buffers, `StringBuilder` instead of concatenation in a loop.

## What the collector cannot fix

- A **leak** — reachable objects no one uses. The GC will faithfully keep them and eventually throw `OutOfMemoryError`.
- **Off-heap** memory: direct `ByteBuffer`s, native libraries, thread stacks, Metaspace (class metadata). `OutOfMemoryError: Metaspace` means classes are being loaded and never unloaded — usually a class-loader leak in a redeploying container.
- **`GC overhead limit exceeded`**: the JVM spent more than 98% of recent time collecting and recovered under 2% — the heap is effectively full of live data.

## Interview angle

- *"Explain generational GC."* Most objects die young; Eden + survivors collected often by copying, promotion to old after surviving several minors; old collected rarely.
- *"Minor versus major GC?"* Minor: young generation only, fast, frequent. Major/full: whole heap, slow, should be rare.
- *"What is stop-the-world?"* All application threads paused at a safepoint while the collector works; modern collectors make most of it concurrent.
- *"Which collector is the default?"* G1 since Java 9; ZGC for huge heaps with tight latency.
- *"Does `System.gc()` collect?"* It suggests; it may be ignored, and it is a full pause when honoured — do not call it.

## Key takeaways

- Mark, then sweep / compact / copy; real collectors copy the young and mark–compact the old.
- Generational: Eden → survivors (age) → old; minor GCs cheap, full GCs expensive; premature promotion is the common problem.
- Serial (one thread), Parallel (throughput), G1 (default, region-based, pause target), ZGC/Shenandoah (concurrent, sub-ms).
- `-Xlog:gc` and `jstat` show the story; `Pause Full` lines are the alarm.
- Tune by allocating less; the GC cannot fix a leak or off-heap growth.
