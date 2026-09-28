---
title: Checkpoint — Concurrency
minutes: 30
seo-title: Java Concurrency Quiz: Threads, Locks and Executors Practice
description: Test Java concurrency with 15 questions and three programs on threads, synchronized, volatile, executors, atomics, ConcurrentHashMap and CompletableFuture.
q: Which happens-before edge makes a worker's results visible after join()?
a: Every action in a thread happens-before another thread's `join()` on it returns. So once `join()` returns, everything the worker wrote — an array slot, a field — is visible to the joining thread without any further synchronisation.
q: Why does ConcurrentHashMap merge remove the check-then-act race?
a: `merge` reads the current value, applies the function and writes the result as one atomic operation per key. With a synchronised `HashMap`, `get` and `put` are two separately locked calls, and another thread can update the key between them.
q: How do you transfer money between two accounts without deadlock?
a: Lock both accounts in one global order — for example the smaller account id first — whichever direction the money moves. Two transfers in opposite directions then request the locks in the same order and cannot each hold one while waiting for the other.
---
This checkpoint covers threads and the interrupt protocol, races and `synchronized`, the Java Memory Model with `volatile` and safe publication, executors and `Future`s, `ReentrantLock`, atomics and the concurrent collections, `CompletableFuture`, and the coordination tools — latch, barrier, semaphore and blocking queue.

**How it works.** Fifteen questions and three programs; 70% on the questions and every program accepted clears the module.

**Before you start**, make sure you can answer:

- `start()` versus `run()`, and how a thread is stopped politely.
- Why `count++` is a race, and the two guarantees `synchronized` gives.
- What `volatile` does and does not do, and why double-checked locking needs it.
- Which happens-before edge makes results written by a worker visible after `join()`.
- Fixed versus cached pool, what `Future.get()` throws, and the shutdown sequence.
- Why `ConcurrentHashMap.merge` removes the check-then-act race a synchronised `HashMap` has.
- `thenApply` versus `thenCompose`, and which thread runs a `thenX` stage.
- `CountDownLatch` versus `CyclicBarrier`, and how a poison pill ends a consumer.

The programs are a parallel row-sum on a fixed pool with results in order, a bank that transfers money between accounts under per-account locks acquired in a global order, and a phased simulation on a `CyclicBarrier` whose barrier action reports each round.
