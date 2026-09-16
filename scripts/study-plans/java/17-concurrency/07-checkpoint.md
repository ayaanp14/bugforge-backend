---
title: Checkpoint — Concurrency
minutes: 30
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
