---
title: Locks, atomics and the concurrent collections
minutes: 15
---
`synchronized` is a blunt instrument: one lock, no timeout, no fairness, no way to try and back off. `java.util.concurrent` provides sharper ones. **`ReentrantLock`** is `synchronized` with options; **`ReadWriteLock`** lets many readers share; the **atomic** classes update a single variable without any lock at all, using the CPU's compare-and-swap; and the **concurrent collections** — `ConcurrentHashMap` above all — bake thread-safety into the data structure so most code never needs an explicit lock. This lesson is the toolbox, and the rule for reaching into it: the highest-level thing that fits.

## `ReentrantLock`: `synchronized` with a manual

```java
private final ReentrantLock lock = new ReentrantLock();     // or new ReentrantLock(true) for fairness

void transfer(Account from, Account to, int amount) {
    lock.lock();
    try {
        from.debit(amount); to.credit(amount);
    } finally {
        lock.unlock();                                       // ALWAYS in finally — an exception must not leak the lock
    }
}
```

What it adds over `synchronized`: `tryLock()` (return `false` instead of waiting — the way out of deadlock), `tryLock(timeout, unit)`, `lockInterruptibly()` (a waiting thread can be interrupted), *fairness* (longest-waiting thread gets it next; slower, but no starvation), and **multiple `Condition`s** per lock (`lock.newCondition()`: separate "not empty" and "not full" queues instead of one `notifyAll` waking everyone). What it costs: you must unlock by hand, so the `try/finally` is not optional. When you need none of the extras, `synchronized` is shorter and the JIT optimises it well.

Deadlock avoidance with `tryLock`:

```java
while (true) {
    if (a.lock.tryLock()) {
        try { if (b.lock.tryLock()) { try { doBoth(); return; } finally { b.lock.unlock(); } } }
        finally { a.lock.unlock(); }
    }
    Thread.onSpinWait();   // back off and retry (add a small random sleep in real code)
}
```

## `ReadWriteLock`: many readers, one writer

```java
private final ReadWriteLock rw = new ReentrantReadWriteLock();
V get(K k) { rw.readLock().lock(); try { return map.get(k); } finally { rw.readLock().unlock(); } }
void put(K k, V v) { rw.writeLock().lock(); try { map.put(k, v); } finally { rw.writeLock().unlock(); } }
```

Any number of readers may hold the read lock together; a writer needs the write lock exclusively. It pays when reads greatly outnumber writes and the guarded operation is not trivial; for a simple map, `ConcurrentHashMap` beats it. `StampedLock` (Java 8) is the faster, non-reentrant variant with *optimistic reads* for experts.

## Atomics: lock-free single-variable updates

```java
AtomicInteger hits = new AtomicInteger();
hits.incrementAndGet();                        // atomic ++, returns the new value
hits.addAndGet(5);
hits.compareAndSet(expected, newValue);        // the primitive everything is built on: CAS
hits.updateAndGet(x -> Math.max(x, candidate));       // any pure function, retried on contention
hits.accumulateAndGet(v, Integer::sum);
AtomicReference<Node> head = new AtomicReference<>();  // lock-free stacks and queues start here
AtomicLong, AtomicBoolean, AtomicIntegerArray
```

An atomic operation is a **compare-and-swap** loop: read the value, compute the new one, write it only if nothing changed in between, otherwise retry. No lock, no blocking, no deadlock; under heavy contention many threads retry, which is where **`LongAdder`** comes in — it keeps per-thread cells and sums them on `sum()`, so a hot counter (requests served) scales linearly. Use `AtomicInteger` when you need the current value after each update; `LongAdder` when you increment often and read rarely.

Atomics fix `count++`; they do not fix compound invariants across *two* variables (`if (a.get() > 0) b.incrementAndGet()` is still a race). For that, a lock.

## `ConcurrentHashMap`: the workhorse

```java
ConcurrentHashMap<String, Integer> counts = new ConcurrentHashMap<>();
counts.merge(word, 1, Integer::sum);                       // atomic per key: the thread-safe frequency count
counts.computeIfAbsent(key, k -> expensive(k));            // atomic: expensive() runs once per key
counts.putIfAbsent(k, v);
counts.getOrDefault(k, 0);
long total = counts.reduceValuesToLong(1, Integer::longValue, 0, Long::sum);   // parallel bulk ops
```

Internally the table is split so that updates to different buckets do not block each other (Java 8 replaced the old segment locks with per-bin CAS/synchronisation), reads never lock, and iteration is **weakly consistent** — it never throws `ConcurrentModificationException`, reflecting some state between start and end. The compound operations (`merge`, `compute*`, `putIfAbsent`) are atomic per key, which is exactly what makes the check-then-act races of a synchronised `HashMap` disappear. It rejects `null` keys and values, and `size()` is an estimate under concurrent updates. Never do `if (!map.containsKey(k)) map.put(k, v)` on it — the atomic method exists for that.

`Collections.synchronizedMap(new HashMap<>())` is the old alternative: one lock around every call, no atomic compound ops, and iteration requires you to hold the lock yourself. Use it only to wrap something `ConcurrentHashMap` cannot replace (a `TreeMap` → `ConcurrentSkipListMap` exists for that too).

## The other concurrent collections

| Need | Class | Note |
| --- | --- | --- |
| sorted concurrent map/set | `ConcurrentSkipListMap` / `ConcurrentSkipListSet` | lock-free; O(log n) |
| read-mostly list (listeners) | `CopyOnWriteArrayList` | every write copies the array; iteration is a snapshot, never fails |
| producer–consumer queue | `ArrayBlockingQueue` (bounded), `LinkedBlockingQueue`, `PriorityBlockingQueue` | `put` blocks when full, `take` when empty |
| hand-off with no buffer | `SynchronousQueue` | what `newCachedThreadPool` uses |
| delayed tasks | `DelayQueue` | elements become available at their time |
| lock-free queue/deque | `ConcurrentLinkedQueue` / `ConcurrentLinkedDeque` | non-blocking; `poll` returns null when empty |

`BlockingQueue` is the backbone of the producer–consumer pattern (next lesson): producers `put`, consumers `take`, the queue does all the waiting and waking that `wait`/`notify` used to.

## Choosing

1. Can you avoid sharing? Confine to one thread, or make it immutable.
2. Is it one variable? An atomic.
3. Is it a map, list or queue? The concurrent collection.
4. Is it a compound invariant across several fields? `synchronized`, or `ReentrantLock` if you need `tryLock`, conditions or fairness.
5. Read-heavy with slow reads? `ReadWriteLock`.

In interviews, saying the order aloud is worth more than knowing every class.

## Interview angle

- *"`ReentrantLock` versus `synchronized`?"* Same mutual exclusion; the lock adds `tryLock`, timeouts, interruptible waits, fairness and multiple conditions, at the cost of manual `unlock` in `finally`.
- *"How does `AtomicInteger` work?"* A compare-and-swap loop — no lock; `LongAdder` for hot counters.
- *"How is `ConcurrentHashMap` different from `Hashtable`/`synchronizedMap`?"* Fine-grained per-bin locking, lock-free reads, atomic `merge`/`compute*`, weakly consistent iteration; not one global lock.
- *"Is `ConcurrentHashMap.size()` exact?"* An estimate under concurrent modification.
- *"When `CopyOnWriteArrayList`?"* Many reads, very few writes — listener lists.

## Key takeaways

- `ReentrantLock` when you need `tryLock`, timeouts, fairness or several `Condition`s; `unlock()` in `finally`, always.
- Atomics are CAS loops: `incrementAndGet`, `compareAndSet`, `updateAndGet`; `LongAdder` for contended counters; they do not cover multi-variable invariants.
- `ConcurrentHashMap` with `merge`/`computeIfAbsent`/`putIfAbsent` replaces every check-then-act race; no nulls, weakly consistent iteration.
- `BlockingQueue` for producer–consumer; `CopyOnWriteArrayList` for read-mostly; `ConcurrentSkipListMap` for sorted.
- Highest-level tool that fits: confine → immutable → atomic → concurrent collection → lock.
