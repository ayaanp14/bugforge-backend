---
title: Visibility, volatile and the Java Memory Model
minutes: 15
---
Mutual exclusion is half of concurrency. The other half is **visibility**: when thread A writes a variable, when — if ever — does thread B see the new value? The intuitive answer, "immediately", is wrong. Compilers reorder statements, CPUs keep values in registers and per-core caches, and the JIT hoists a read out of a loop if nothing tells it the value can change. The **Java Memory Model** (JMM) is the contract that says exactly which writes a read is guaranteed to see, and `volatile`, `final`, locks and the other *synchronisation actions* are how you invoke it. This lesson makes that contract usable.

## The bug that motivates everything

```java
class Worker implements Runnable {
    boolean running = true;                  // no volatile
    public void run() { while (running) { work(); } }
}
// main: worker.running = false;   → the worker may loop forever
```

The JIT sees that `running` is never written inside the loop, hoists the read, and compiles `while (true)`. Or the core running the worker keeps the old value in its cache. The write from `main` is real; it is simply not *required* to be seen. This is not a theoretical hazard — it reproduces reliably in a two-line program with `-server` mode.

## Happens-before

The JMM does not talk about time or caches. It defines a partial order, **happens-before** (hb): if action X hb action Y, then Y sees X's effects. The sources of hb edges that you actually use:

| Action A | happens-before |
| --- | --- |
| each statement in a thread | the next statement in that thread (program order) |
| unlock of a monitor | every later lock of the same monitor |
| write to a `volatile` field | every later read of that field |
| `Thread.start()` | every action in the started thread |
| every action in a thread | a `join()` on that thread returning |
| the end of a constructor writing `final` fields | any read of those fields through a properly published reference |
| `ExecutorService.submit`, `CountDownLatch.countDown`, `BlockingQueue.put`, `Future.get`, … | the corresponding release/acquire on the other side (all documented in `java.util.concurrent`) |

hb is transitive. So: main writes `partial[i]`? No — worker writes `partial[i]`, then terminates; `join()` returns in main; therefore main's read sees the write. The pattern *write → release → acquire → read* is the whole theory: get an edge between the writer and the reader and the write is visible; have none and it is a **data race**, whose outcome is undefined (the JMM allows a reader to see a stale value or, for `long`/`double` before Java 17 on 32-bit systems, half of one).

## `volatile`: visibility without a lock

A `volatile` field is never cached in a register or hoisted; every read goes to shared memory and sees the latest write, and a write to it hb any subsequent read of it. In the example, `volatile boolean running` fixes the loop.

```java
private volatile boolean running = true;         // stop flag: perfect
private volatile Config current;                 // safely publishes a fully built immutable object
private volatile int count;  count++;            // WRONG: still read-modify-write — not atomic
```

`volatile` gives **visibility and ordering**, not **atomicity**. `count++` on a volatile is still a race; use `AtomicInteger`. The rule: `volatile` for a single flag or a reference to an immutable object that one thread writes and others read; a lock or an atomic for anything compound. Also note that a volatile write publishes everything written *before* it — build the object fully, then assign the volatile reference — which is what makes it a *publication* mechanism, not just a flag.

## Safe publication

An object is **safely published** when other threads are guaranteed to see its fully constructed state. Handing a reference across threads through a plain field is not safe: the reader may see the reference before the fields it points to. The safe routes are: a `volatile` or `AtomicReference` field; a `synchronized` block on both sides; a static initialiser (class-init lock); a `final` field of a properly published object; or any `java.util.concurrent` hand-off (queue, latch, executor submission, future). Making the object **immutable** — every field `final`, no leaks of `this` from the constructor — lets it ride any of these safely and removes a whole class of bugs.

## Double-checked locking, done right

The classic lazy singleton without `volatile` is broken: a second thread can see `instance != null` before the object's fields are written. With `volatile` on the field it is correct since Java 5:

```java
private static volatile Registry instance;
static Registry get() {
    Registry r = instance;                      // one volatile read on the fast path
    if (r == null) {
        synchronized (Registry.class) {
            r = instance;
            if (r == null) instance = r = new Registry();
        }
    }
    return r;
}
```

And still prefer the holder idiom from the memory module — simpler, and the JVM does the locking.

## `final` fields and immutability

The JMM gives `final` fields a special guarantee: once a constructor finishes, any thread that obtains a reference to the object *without a data race on the reference itself* sees the final fields correctly initialised — even with no synchronisation. This is why immutable objects (`String`, records, `Integer`) can be shared freely, and why "make it `final`" is concurrency advice, not just style. The guarantee does not extend to what the final field *points to* if that is mutable: a `final List` you keep adding to is not immutable.

## Reordering: what the compiler may do

Within one thread, the JIT may reorder any two operations that do not depend on each other, as long as *that thread* cannot tell. Other threads can. The hb rules above are the only fences you have: a `volatile` write acts as a release (nothing before it moves after it), a `volatile` read as an acquire (nothing after it moves before it), and monitor exit/enter likewise. `Thread.sleep` and `System.out.println` are **not** synchronisation actions — "it works when I add a print" is the JMM telling you that you have a race.

## Atomicity of primitives

Reads and writes of references and 32-bit primitives are atomic (you never see a torn value); `long` and `double` are guaranteed atomic only when `volatile` on older or 32-bit JVMs. Compound operations — `++`, `+=`, check-then-act — are never atomic without a lock or an atomic class.

## Interview angle

- *"What does `volatile` do?"* Guarantees visibility and ordering for that field's reads and writes; not atomicity.
- *"Can `volatile` replace `synchronized`?"* For a single flag or a published immutable reference, yes; for compound updates, no.
- *"What is happens-before?"* The JMM's order: if A hb B, B sees A's writes. Edges come from locks, volatiles, `start`/`join`, and the `java.util.concurrent` classes.
- *"Why do you need `volatile` in double-checked locking?"* Without it a thread can see the reference before the object's fields are initialised.
- *"Why are immutable objects thread-safe?"* Final fields are guaranteed visible after construction; nothing changes afterwards, so there is nothing to race on.

## Key takeaways

- Writes are not automatically visible to other threads; the JIT hoists and CPUs cache. A program that "works with a print" has a race.
- Happens-before is the contract: unlock→lock, volatile write→read, start, join, and every `j.u.c` hand-off.
- `volatile` = visibility + ordering, no atomicity; right for flags and publishing immutable objects.
- Safe publication through volatile, locks, static init, `final`, or `j.u.c`; immutability makes publication trivially safe.
- DCL needs `volatile`; the holder idiom needs nothing.
