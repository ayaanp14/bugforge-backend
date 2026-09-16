---
title: Shared state, races and synchronized
minutes: 15
---
Two threads and one variable is all it takes. `count++` looks atomic and is three operations — read, add, write — so two threads incrementing a shared counter a million times each end up with something less than two million, a different something each run. That is a **race condition**, and everything in this module is a way to avoid one. The oldest and still most common tool is `synchronized`: a block that only one thread at a time may execute, guarded by a lock that every object carries. This lesson is what a race is, what `synchronized` guarantees, how to use it without deadlocking, and the `wait`/`notify` protocol that lives on the same locks.

## The anatomy of a race

```java
class Counter { int count; void increment() { count++; } }
// two threads, 100 000 increments each → 200 000 expected; observed: 137 412, 158 990, …
```

Thread A reads `count` (5), thread B reads `count` (5), A writes 6, B writes 6: one increment is lost. The window is nanoseconds wide, which is why the bug appears only under load, only in production, only on Tuesdays. Any **check-then-act** (`if (!map.containsKey(k)) map.put(k, v)`) or **read-modify-write** (`count++`, `balance -= amount`, `list.add` on an `ArrayList`) on shared mutable state without synchronisation is a race. The fix is always one of: do not share, do not mutate, or coordinate access — and `synchronized` is coordination.

## `synchronized`: mutual exclusion on an intrinsic lock

Every Java object has an **intrinsic lock** (monitor). A `synchronized` block acquires the lock of the object named, runs, and releases it — even if the body throws. While one thread holds it, any other thread reaching a block synchronised on the *same object* blocks.

```java
class Counter {
    private int count;
    public synchronized void increment() { count++; }          // locks `this`
    public synchronized int get() { return count; }             // also locks `this`: reads need the lock too
}

class Registry {
    private final Object lock = new Object();                    // a private lock object
    private final Map<String, Integer> map = new HashMap<>();
    public void put(String k, int v) {
        synchronized (lock) { map.put(k, v); }
    }
}
```

A `synchronized` instance method locks `this`; a `synchronized static` method locks the `Class` object; a `synchronized (obj)` block locks whatever you name. **Both writers and readers** must synchronise on the same lock: a `get()` without the lock may see a stale or half-written value (lesson 3), so "only the writes need synchronising" is a bug.

Two guarantees come with the lock: **atomicity** (the block runs as one indivisible step relative to other blocks on the same lock) and **visibility** (everything written before a release is visible to whoever acquires the lock next). The lock is **reentrant**: a thread that holds it may acquire it again (a synchronised method calling another synchronised method on the same object) without deadlocking itself.

## Choosing the lock

Prefer a **private final lock object** over `this` for classes others can see: anyone with a reference to your object can `synchronized (yourObject)` and interfere with, or deadlock, your internal locking. Never lock on a `String` literal (interned, shared with the whole JVM), a boxed primitive (cached), or any value-based class — you would be sharing a lock with strangers. Lock on one object per independent piece of state; lock on the same object for state that must change together.

## Granularity: how much to lock

```java
// too coarse: the network call holds the lock for milliseconds
synchronized (lock) { data = fetchFromNetwork(); cache.put(k, data); }
// right: compute outside, publish inside
Data d = fetchFromNetwork();
synchronized (lock) { cache.put(k, d); }
```

Hold locks for as short a time as possible and never while doing I/O, sleeping, or calling out to code you do not control (a listener might try to acquire another lock). A lock held for a long time serialises the whole program onto one thread; a lock held for a few instructions costs almost nothing when uncontended — modern JVMs take an uncontended `synchronized` in a few nanoseconds.

## Deadlock, and the one rule that prevents it

```java
// thread 1: synchronized (a) { synchronized (b) { … } }
// thread 2: synchronized (b) { synchronized (a) { … } }   → each holds one, waits for the other, forever
```

Deadlock needs two or more locks acquired in different orders. The rule: **acquire locks in a global, consistent order** — sort the objects by some key (account id, `System.identityHashCode` as a last resort) and always lock the smaller first. Or use one lock for both. Or use `tryLock` with a timeout (lesson 5). A thread dump shows a deadlock as two threads `BLOCKED`, each "waiting to lock" what the other "locked"; `jstack` even prints "Found one Java-level deadlock".

## `wait` / `notify`: waiting for a condition

Mutual exclusion says "not at the same time"; sometimes a thread needs "not until something is true" — a consumer waiting for a non-empty queue. `Object.wait()` releases the lock and parks the thread; `notify()`/`notifyAll()` wakes waiters, who re-acquire the lock and continue. All three must be called while holding the monitor, or you get `IllegalMonitorStateException`.

```java
synchronized (queue) {
    while (queue.isEmpty()) queue.wait();     // ALWAYS in a loop: spurious wake-ups and other consumers
    item = queue.remove();
}
synchronized (queue) { queue.add(x); queue.notifyAll(); }
```

Always `while`, never `if`: a thread can wake spuriously, or another consumer may have taken the item first. Prefer `notifyAll` unless you can prove one waiter suffices. And in practice prefer `java.util.concurrent` — a `BlockingQueue`, a `CountDownLatch`, a `Condition` — over hand-written `wait`/`notify`; the library versions are the same protocol without the mistakes.

## What `synchronized` does not do

It does not make a *sequence* of synchronised calls atomic: `if (map.get(k) == null) map.put(k, v)` on a `Collections.synchronizedMap` is still a check-then-act race across two atomic calls — you need one block around both, or `putIfAbsent`. It does not help if some access bypasses it. It does not scale to many cores contending on one hot lock — for a counter, `AtomicInteger` or `LongAdder` (lesson 5) is faster. And it cannot be interrupted or time out — a thread waiting for a monitor waits until it gets it.

## Interview angle

- *"What is a race condition?"* Unsynchronised access to shared mutable state where the result depends on timing — `count++` from two threads.
- *"What does `synchronized` guarantee?"* Mutual exclusion on the monitor and visibility of writes at release/acquire; it is reentrant.
- *"Synchronised method versus block?"* Method locks `this` (or the class for static); a block names the lock and can be narrower.
- *"How do you avoid deadlock?"* Consistent lock ordering, one lock, or `tryLock` with timeout; never hold a lock while calling unknown code.
- *"Why `while` around `wait()`?"* Spurious wake-ups and competing waiters; the condition must be rechecked.

## Key takeaways

- `count++` is three steps; every read-modify-write or check-then-act on shared state is a race.
- `synchronized` = one thread at a time on a monitor + visibility on release/acquire; readers lock too; reentrant.
- Lock a private object, briefly, never around I/O or foreign calls; one lock per unit of related state.
- Deadlock = inconsistent lock order; fix with ordering, a single lock, or `tryLock`.
- `wait` in a `while`, `notifyAll` unless proven otherwise — and reach for `java.util.concurrent` first.
