---
title: CompletableFuture and the coordination tools
minutes: 15
---
A `Future` lets you wait; it does not let you say *what happens next*. `CompletableFuture` does: it is a future you can complete by hand, chain transformations onto, combine with other futures, and recover when it fails — asynchronous code that reads like a stream pipeline. Around it sit the **synchronisers** that coordinate threads without a lock on shared data: `CountDownLatch` (wait until *n* things have happened), `CyclicBarrier` (everyone waits for everyone, repeatedly), `Semaphore` (at most *n* at once), and the `BlockingQueue` that makes producer–consumer a one-liner. This lesson covers all of them with the one question that matters for each: *what thread does the work?*

## `CompletableFuture`: a future with `then`

```java
CompletableFuture<Integer> price = CompletableFuture.supplyAsync(() -> fetchPrice("AAPL"));   // runs on the common pool
CompletableFuture<Integer> withTax = price.thenApply(p -> p * 118 / 100);                       // transform
CompletableFuture<Void> shown = withTax.thenAccept(System.out::println);                          // consume
CompletableFuture<Integer> total = withTax.thenCombine(fetchShipping(), Integer::sum);           // two futures → one
CompletableFuture<Order> order = total.thenCompose(t -> placeOrderAsync(t));                      // a stage that returns a future
Integer value = total.join();                                                                     // like get(), but unchecked exceptions
```

- `supplyAsync(Supplier)` / `runAsync(Runnable)` start work on the **common ForkJoinPool** unless you pass an executor — always pass one for blocking I/O, or you starve parallel streams and everyone else.
- `thenApply` = `map`; `thenCompose` = `flatMap` (the function returns a future — avoid `CompletableFuture<CompletableFuture<T>>`); `thenCombine` joins two; `thenAccept`/`thenRun` end the chain with a side effect.
- Each `thenX` runs **on whatever thread completed the previous stage** (or immediately on the caller if it was already complete). The `thenXAsync` variants re-dispatch to a pool. This matters when the previous stage was your UI or event-loop thread.
- `join()` throws `CompletionException` (unchecked) wrapping the cause; `get()` throws the checked `ExecutionException`.

## Failure and recovery

```java
CompletableFuture<Integer> safe = supplyAsync(() -> parse(text))
    .exceptionally(ex -> 0)                                   // recover with a value
    .thenApply(x -> x * 2);

CompletableFuture<String> reported = supplyAsync(() -> risky())
    .handle((value, ex) -> ex == null ? "ok " + value : "failed: " + ex.getCause().getMessage())   // both branches
    .whenComplete((v, ex) -> log(v, ex));                      // observe without changing the result
```

An exception in any stage skips every following `thenX` and lands in the next `exceptionally`/`handle`/`whenComplete` — exactly like a thrown exception skipping statements to a `catch`. The cause is wrapped in `CompletionException`; unwrap with `getCause()`. Since Java 12, `exceptionallyCompose` recovers with another future, and `orTimeout(1, SECONDS)` / `completeOnTimeout(default, …)` (Java 9) give you deadlines without a watchdog thread.

## Waiting for many

```java
List<CompletableFuture<Integer>> parts = ids.stream().map(id -> supplyAsync(() -> load(id), pool)).toList();
CompletableFuture<Void> all = CompletableFuture.allOf(parts.toArray(CompletableFuture[]::new));
List<Integer> results = all.thenApply(v -> parts.stream().map(CompletableFuture::join).toList()).join();  // join() is instant here: all are done
Object first = CompletableFuture.anyOf(a, b, c).join();      // the first to complete (or fail)
```

`allOf` returns `CompletableFuture<Void>` — it tells you *when*, not *what*; collect the values from the original futures afterwards. Failure of any part fails `allOf`.

You can also complete one by hand: `new CompletableFuture<T>()` then `complete(value)` / `completeExceptionally(ex)` from a callback — the bridge from callback-style APIs into the futures world.

## `CountDownLatch`: wait for *n* events

```java
CountDownLatch ready = new CountDownLatch(workers);
for (int i = 0; i < workers; i++) pool.execute(() -> { prepare(); ready.countDown(); });
ready.await();          // blocks until the count reaches zero; then everything the workers wrote is visible
```

One-shot: the count never resets. Uses: wait for *n* threads to finish or to reach a starting line (a latch of 1 that `main` counts down to start everyone at once — the fairest way to begin a benchmark). `await(timeout, unit)` returns `false` on timeout instead of waiting forever.

## `CyclicBarrier`: everyone waits for everyone, again and again

```java
CyclicBarrier round = new CyclicBarrier(k, () -> System.out.println("round done: " + total.sum()));  // action runs once per trip, by the last to arrive
// each worker, per round:  doMyPart(); round.await();
```

`await()` blocks until `k` threads have called it, runs the optional barrier action on the last arriving thread, releases all, and **resets** for the next round — the natural shape of a simulation with phases. A thread that leaves breaks the barrier for everyone (`BrokenBarrierException`). `Phaser` is the flexible version with a variable number of parties.

## `Semaphore`: at most *n* at a time

```java
Semaphore permits = new Semaphore(10);
permits.acquire();  try { callRateLimitedApi(); } finally { permits.release(); }
```

A counting semaphore limits concurrency to a resource: connection slots, API rate, a bounded pool of hand-made objects. `tryAcquire()` for non-blocking, a fair constructor for FIFO. Note `release()` does not check that the caller ever acquired — a semaphore is a counter, not a lock.

## Producer–consumer with a `BlockingQueue`

```java
BlockingQueue<Integer> queue = new ArrayBlockingQueue<>(100);
Thread producer = new Thread(() -> { for (int i = 1; i <= n; i++) queue.put(i); queue.put(POISON); });
Thread consumer = new Thread(() -> { for (int x; (x = queue.take()) != POISON; ) consume(x); });
```

`put` blocks when the queue is full (back-pressure: a slow consumer throttles the producer), `take` blocks when empty. The **poison pill** — a sentinel value the consumer recognises — is the standard way to say "no more"; with several consumers, send one pill per consumer. `offer(x, timeout, unit)` and `poll(timeout, unit)` give up instead of blocking forever. Every hand-off through the queue is a happens-before edge, so whatever the producer built before `put` is visible to the consumer after `take` with no other synchronisation.

## Fork/join

`ForkJoinPool` runs **`RecursiveTask`s** that split themselves (`fork()`) and join their halves — the engine under parallel streams and `CompletableFuture`'s async methods. Work-stealing lets idle threads take tasks from busy ones' deques. You rarely write a `RecursiveTask` by hand today; you should know that the common pool has `cores − 1` threads and that blocking inside it is the cardinal sin.

## Interview angle

- *"`Future` versus `CompletableFuture`?"* Pull versus push: `CompletableFuture` composes (`thenApply`, `thenCompose`, `thenCombine`, `allOf`), recovers (`exceptionally`, `handle`) and can be completed manually.
- *"`thenApply` versus `thenCompose`?"* `map` versus `flatMap` — compose when the function returns a future.
- *"`CountDownLatch` versus `CyclicBarrier`?"* One-shot count-to-zero waited on by others versus a reusable meeting point for the parties themselves.
- *"How do you stop a consumer thread cleanly?"* A poison pill through the queue, or interruption.
- *"What thread runs `thenApply`?"* The one that completed the previous stage (or the caller if already complete); `thenApplyAsync` re-dispatches.

## Key takeaways

- `supplyAsync` → `thenApply`/`thenCompose`/`thenCombine` → `join`; pass an executor for blocking work; `Async` variants change threads.
- Failures skip to `exceptionally`/`handle`; `allOf` for many, `anyOf` for the first; `orTimeout` for deadlines.
- Latch: wait for *n* one-off events. Barrier: *k* parties meet repeatedly, with an action per trip. Semaphore: *n* permits.
- `BlockingQueue` + poison pill = producer–consumer with back-pressure and built-in visibility.
- The common pool is shared: never block in it.
