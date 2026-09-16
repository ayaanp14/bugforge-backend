---
title: Executors, thread pools and Futures
minutes: 14
---
Creating a thread per task does not scale, and juggling `Thread` objects by hand — start, join, collect results, handle the one that threw — is repetitive and easy to get wrong. `java.util.concurrent` separates the *task* from the *thread that runs it*: you submit `Runnable`s and `Callable`s to an **`ExecutorService`**, a pool of reusable threads runs them, and each submission hands back a **`Future`** through which you collect the result or the exception. This lesson covers the pools, the two submission styles, the shutdown protocol everybody forgets, and what a `Future` actually promises.

## The executor model

```java
ExecutorService pool = Executors.newFixedThreadPool(4);
Future<Integer> f = pool.submit(() -> expensiveComputation(42));   // a Callable<Integer>
// … do other things …
int result = f.get();            // blocks until the task completes; rethrows its exception wrapped
pool.shutdown();
```

`execute(Runnable)` fires and forgets; `submit(Callable)` returns a `Future<V>`; `submit(Runnable)` returns a `Future<?>` that completes with `null`. Tasks queue up when every pool thread is busy and run in submission order per queue — but on *different threads*, so nothing about their relative timing is guaranteed.

## The factory methods, and when each is wrong

| Factory | Threads | Queue | Use | Danger |
| --- | --- | --- | --- | --- |
| `newFixedThreadPool(n)` | exactly `n` | unbounded | CPU-bound work, `n ≈ cores` | unbounded queue → memory grows under overload |
| `newCachedThreadPool()` | as many as needed, reused for 60 s | none (direct hand-off) | many short I/O tasks, bursty | unbounded threads → `unable to create native thread` |
| `newSingleThreadExecutor()` | 1 | unbounded | serialise access to a resource; ordered event processing | one slow task blocks everything |
| `newScheduledThreadPool(n)` | `n` | delayed | periodic jobs, timeouts | an exception kills the periodic task silently |
| `newWorkStealingPool()` | parallelism = cores | per-thread deques | a `ForkJoinPool` for many small tasks | no ordering; daemon threads |
| `newVirtualThreadPerTaskExecutor()` (21) | a virtual thread per task | none | blocking I/O at scale | not for CPU-bound work |

For production services the honest answer is the constructor underneath: `new ThreadPoolExecutor(core, max, keepAlive, unit, new ArrayBlockingQueue<>(capacity), factory, rejectionHandler)` — bounded queue, named threads, and an explicit policy (`CallerRunsPolicy`, `AbortPolicy`) for what happens when both are full. "Both the queue and the thread count are bounded" is the sentence that shows you have run one.

Sizing: CPU-bound → about the number of cores (`Runtime.getRuntime().availableProcessors()`); I/O-bound → more, roughly `cores × (1 + wait/compute)`, or virtual threads.

## Submitting many tasks

```java
List<Callable<Integer>> tasks = List.of(() -> work(1), () -> work(2), () -> work(3));
List<Future<Integer>> futures = pool.invokeAll(tasks);      // blocks until ALL are done; same order as tasks
for (Future<Integer> f : futures) System.out.println(f.get());
Integer first = pool.invokeAny(tasks);                      // the first to succeed; the rest are cancelled
```

`invokeAll` returns the futures **in the order of the task list**, regardless of which finished first — which is how a multi-threaded program prints deterministic output. `invokeAny` is for redundant requests (three replicas, take the fastest).

## What a `Future` gives you

- `get()` — block until done; returns the value, or throws `ExecutionException` **wrapping** the task's exception (`e.getCause()` is the real one), or `InterruptedException` if *you* were interrupted while waiting, or `CancellationException`.
- `get(timeout, unit)` — the same with a deadline; `TimeoutException` if it passes. Prefer this in anything user-facing.
- `isDone()`, `isCancelled()`; `cancel(mayInterruptIfRunning)` — removes a queued task, or interrupts a running one if you say so (and only helps if the task honours interruption).

A `Future` is *pull-based*: you ask and wait. It cannot be composed ("when this finishes, do that") — that is `CompletableFuture` (lesson 6). A task that throws does not print anything: the exception sits inside the `Future` until someone calls `get()`. **Uncollected futures hide failures**; either call `get()` or use an executor whose `afterExecute` logs them.

## Shutting down, properly

An `ExecutorService` keeps its threads alive; a pool you never shut down keeps the JVM alive (non-daemon threads) and is a resource leak in anything long-running.

```java
pool.shutdown();                                       // stop accepting tasks; let queued ones finish
if (!pool.awaitTermination(30, TimeUnit.SECONDS)) {    // wait for them
    pool.shutdownNow();                                // interrupt what is still running; returns the never-started tasks
}
```

`shutdown()` is graceful; `shutdownNow()` interrupts. Since Java 19 `ExecutorService` is `AutoCloseable`, so `try (var pool = Executors.newFixedThreadPool(4)) { … }` does shutdown-and-await for you. In a scheduled pool, remember that a periodic task that throws is **cancelled silently** — wrap the body in a try/catch that logs.

## Exceptions and thread death

In a pool, an exception escaping a `Runnable` given to `execute()` kills the worker thread (the pool replaces it) and reaches the uncaught-exception handler; the same exception from `submit()` is captured in the `Future` and *nothing is printed*. Choose deliberately: `execute` when you want loud failures, `submit` when you will look at the `Future`.

## `ThreadLocal` in pools — the classic leak

`ThreadLocal` gives each thread its own value (a per-request context, a non-thread-safe formatter). In a pool the thread outlives the task, so the value survives into the next unrelated task unless you `remove()` it in a `finally`. Always pair `set` with `remove`.

## Interview angle

- *"Why use an executor instead of `new Thread`?"* Reuse (thread creation is expensive), bounded concurrency, queuing, results via `Future`, a clean lifecycle.
- *"Fixed versus cached pool?"* Fixed: bounded threads, unbounded queue — for CPU work. Cached: unbounded threads — for short bursty I/O. Production: `ThreadPoolExecutor` with both bounded.
- *"What does `Future.get()` throw?"* `ExecutionException` wrapping the task's failure, `InterruptedException`, `CancellationException`, `TimeoutException` with a deadline.
- *"`shutdown` versus `shutdownNow`?"* Graceful (finish queued tasks) versus interrupt-and-return-the-rest.
- *"Why is `Callable` needed?"* `Runnable` cannot return or throw checked exceptions; `Callable<V>` does both.

## Key takeaways

- Task in, `Future` out; the pool owns the threads. `submit` for results, `execute` for fire-and-forget.
- Know the factories and their unbounded side; in production build a `ThreadPoolExecutor` with a bounded queue and a rejection policy.
- `invokeAll` returns futures in task order — deterministic output from parallel work.
- `get()` rethrows as `ExecutionException`; never leave futures uncollected; `get` with a timeout in user-facing code.
- `shutdown()` + `awaitTermination()` (+ `shutdownNow()`), or try-with-resources on 19+; `ThreadLocal.remove()` in a `finally`.
