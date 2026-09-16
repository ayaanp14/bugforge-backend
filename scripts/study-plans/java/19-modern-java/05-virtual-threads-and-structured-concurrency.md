---
title: Virtual threads and structured concurrency
minutes: 13
---
Java 21's headline feature answers a problem the concurrency module left open: a platform thread is an operating-system thread, costs about a megabyte and a system call, and a server that blocks one per request tops out at a few thousand concurrent requests. The industry's answer was reactive programming — callbacks and `CompletableFuture` chains that never block — at the cost of code nobody could read. **Virtual threads** (Project Loom, JEP 444) keep the blocking style and make threads cheap: millions of them, scheduled by the JVM onto a small pool of carrier threads. **Structured concurrency** (still in preview) then gives concurrent code the shape of a block: subtasks that start together, finish together and fail together. This lesson is conceptual — the exercises run on a Java 18 runtime, where none of this compiles — and it is what "what's new in Java 21?" is really asking about.

## What a virtual thread is

A virtual thread is a `java.lang.Thread` whose stack lives on the **heap** as a small, growable object rather than in a fixed megabyte of native stack. The JVM runs virtual threads on a `ForkJoinPool` of **carrier** platform threads, one per core. When a virtual thread blocks — on a socket read, `Thread.sleep`, a `BlockingQueue.take`, a lock — the JVM **unmounts** it from its carrier, parks the tiny stack, and mounts another virtual thread. Blocking becomes free; the carrier is never idle. A million virtual threads sleeping costs a few hundred megabytes; a million platform threads is impossible.

```java
Thread vt = Thread.ofVirtual().name("req-", 0).start(() -> handle(request));
Thread.startVirtualThread(() -> …);
try (ExecutorService pool = Executors.newVirtualThreadPerTaskExecutor()) {
    for (Request r : requests) pool.submit(() -> handle(r));      // one virtual thread per task — no pool sizing
}                                                                   // close() waits for every task (19+: ExecutorService is AutoCloseable)
```

The API is the same `Thread`. Existing blocking code — JDBC, `HttpClient.send`, `InputStream.read` — runs unchanged and scales. Virtual threads are always **daemon** and have no meaningful priority.

## When they help, and when they do not

Virtual threads make **blocking I/O** cheap; they do not make **CPU work** faster — there are still only as many cores. The rule from the JEP: *never pool virtual threads*; create one per task, and let the JVM schedule. They are a win for servers handling many concurrent requests that mostly wait (databases, downstream calls), for fan-out (call five services in parallel and wait), and for replacing reactive code with straight-line code. They are neutral for a CPU-bound batch job and irrelevant for a single-threaded CLI.

Two costs to know. **Pinning**: a virtual thread inside a `synchronized` block, or in a native call, cannot unmount — it pins its carrier while blocked. In 21 this means "prefer `ReentrantLock` to `synchronized` around blocking calls"; Java 24 (JEP 491) removed the `synchronized` pinning. **`ThreadLocal`**: still works, but a million threads each holding a per-thread cache is a million caches — hence **scoped values** (`ScopedValue`, preview in 21, final in 25), an immutable per-call-tree value that child threads inherit and that costs nothing.

## Structured concurrency (preview)

Unstructured concurrency is `executor.submit` here, `future.get` there, a forgotten task leaking in between. **Structured concurrency** (JEP 453 and successors) makes the lifetime of subtasks match a block of code, the way a `try` block scopes a resource:

```java
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    Subtask<User>  user  = scope.fork(() -> fetchUser(id));        // each fork runs in a new virtual thread
    Subtask<Order> order = scope.fork(() -> fetchOrder(id));
    scope.join().throwIfFailed();                                  // wait for both; if either failed, cancel the other and throw
    return new Profile(user.get(), order.get());
}                                                                  // leaving the block guarantees no subtask is still running
```

The rules: a subtask cannot outlive its scope; if one fails, the others are cancelled (`ShutdownOnFailure`) or the first success wins and the rest are cancelled (`ShutdownOnSuccess`); cancellation propagates through interruption; and a thread dump shows the parent–child tree. Compare the same fan-out with `CompletableFuture.allOf` — which cannot cancel the siblings when one fails and leaves nothing in the stack trace to say which request spawned which task. The API is still evolving (renamed and reshaped in 25), so learn the idea rather than the method names.

## How this changes the concurrency answers

- *"How would you handle 10 000 concurrent requests?"* Before 21: an async, non-blocking stack (Netty, WebFlux) with careful pool sizing. Now: virtual threads with plain blocking code, one per request.
- *"How do you size a thread pool?"* For virtual threads you do not; for CPU-bound platform pools, still about the core count.
- *"Is `synchronized` still fine?"* Yes for short critical sections; around blocking I/O on virtual threads prefer `ReentrantLock` (until 24).
- *"What replaces `ThreadLocal`?"* `ScopedValue` for request context passed down a call tree.

## Migration checklist

1. Start with the server framework's switch (Spring Boot 3.2+: `spring.threads.virtual.enabled=true`; Helidon, Quarkus, Tomcat and Jetty have equivalents).
2. Find `synchronized` around blocking calls; consider `ReentrantLock`.
3. Find `ThreadLocal`s that cache heavy objects; bound them or move to scoped values.
4. Remove thread-pool tuning that no longer means anything; keep bounded pools where the *downstream* (a database) is the limit — a `Semaphore` is the right limiter now.
5. Use JFR's `jdk.VirtualThreadPinned` event to find pinning in production.

## Interview angle

- *"What is a virtual thread?"* A JVM-scheduled thread with a heap-allocated stack, mounted on a small pool of carrier threads; blocking unmounts it, so millions can block cheaply.
- *"When do virtual threads not help?"* CPU-bound work; and avoid pooling them.
- *"What is pinning?"* A blocked virtual thread that cannot unmount — inside `synchronized` (before 24) or native code — holding its carrier.
- *"What is structured concurrency?"* Subtasks scoped to a block: they finish or are cancelled before the block exits, and failures propagate — `StructuredTaskScope`, preview.
- *"Which Java?"* Virtual threads final in 21; structured concurrency and scoped values preview in 21, scoped values final in 25.

## Key takeaways

- Virtual threads: same `Thread` API, heap stacks, carriers per core; blocking unmounts. One per task, never pooled.
- Big win for I/O-bound concurrency and readability; no gain for CPU-bound work.
- Pinning (`synchronized` around blocking, before 24) and heavy `ThreadLocal`s are the two things to audit; `ScopedValue` is the successor.
- Structured concurrency scopes subtasks to a block with fail-fast cancellation and a readable thread dump — still preview.
- The JDK 21 story: blocking code that scales, without reactive frameworks.
