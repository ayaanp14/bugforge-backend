---
title: Threads and Runnables — starting, joining, interrupting
minutes: 14
---
A thread is an independent path of execution with its own stack, sharing the heap with every other thread in the process. Java had threads in the language from day one — `Thread`, `Runnable`, `synchronized` — which is why so much of the platform, from servlet containers to the collections framework, assumes them. Everything higher-level (executors, futures, parallel streams) is built on what this lesson covers: creating a thread, giving it work, waiting for it, and stopping it politely.

## Creating a thread: `Runnable`, not a subclass

```java
Runnable work = () -> System.out.println("hello from " + Thread.currentThread().getName());
Thread t = new Thread(work, "worker-1");
t.start();          // schedules the thread; run() executes on it, some time later
t.join();           // waits for it to finish
```

`Runnable` is a functional interface with one method, `void run()`, so a lambda fits. Prefer passing a `Runnable` to a `Thread` over extending `Thread`: the task (what to do) and the thread (how to run it) are different concerns, a `Runnable` can be handed to an executor later, and your class keeps its inheritance slot. `Callable<V>` is the sibling that returns a value and may throw checked exceptions; plain threads cannot run one — that is what executors are for (lesson 4).

**`start()` versus `run()`**: `run()` is an ordinary method call on the *current* thread — nothing concurrent happens. Only `start()` creates the OS thread and calls `run()` on it. Calling `start()` twice throws `IllegalThreadStateException`. This is the first trick question of every concurrency interview.

## Joining: waiting for a result

A started thread runs whenever the scheduler gives it CPU; `main` does not wait for it unless told to. `join()` blocks the caller until the target thread terminates; `join(millis)` gives up after a timeout. The standard pattern — start every worker, then join every worker, then read the results — is what makes a multi-threaded program's output *deterministic*: nothing is printed until all the work is done, so scheduling order does not matter.

```java
int[] partial = new int[k];
Thread[] workers = new Thread[k];
for (int i = 0; i < k; i++) {
    final int slot = i;
    workers[i] = new Thread(() -> partial[slot] = sumOfSlice(data, slot, k));
    workers[i].start();
}
for (Thread w : workers) w.join();     // after this line every partial[i] is written and visible
int total = Arrays.stream(partial).sum();
```

`join()` also establishes *visibility*: every write the worker made before finishing is guaranteed visible to the joiner (lesson 3 explains why — `join` is a happens-before edge). Without a join or another synchronisation action, reading `partial` from `main` would be a data race.

## Sleeping, yielding and the interrupt protocol

`Thread.sleep(ms)` parks the current thread for at least that long; `Thread.yield()` hints the scheduler to run someone else (rarely useful). Both are static and act on the *current* thread — `t.sleep()` does not put `t` to sleep, a second classic trick.

There is no safe way to kill a thread. `Thread.stop()` is deprecated-for-removal because it releases every lock the thread held mid-operation, leaving shared objects half-updated. Instead threads are asked to stop through **interruption**: `t.interrupt()` sets the target's interrupt flag; a thread blocked in `sleep`, `wait`, `join` or a blocking queue wakes up with `InterruptedException` (and the flag cleared); a running thread must check `Thread.currentThread().isInterrupted()` itself.

```java
Thread worker = new Thread(() -> {
    try {
        while (!Thread.currentThread().isInterrupted()) {
            doOneUnitOfWork();
            Thread.sleep(100);
        }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();     // restore the flag for whoever is above you
    }
    cleanUp();
});
```

Two rules that separate correct code from folklore: **never swallow `InterruptedException`** with an empty catch — either propagate it or re-set the flag so the request is not lost; and design loops around the flag so a stop request is honoured within one iteration. Interruption is cooperative; a thread that ignores it cannot be stopped.

## Daemon threads and the end of the program

The JVM exits when the last **non-daemon** thread finishes. A daemon thread (`t.setDaemon(true)` before `start()`) does not keep the process alive — right for background housekeeping (cache eviction, metrics flushing), wrong for anything whose work must complete, because it is killed mid-run at exit with no `finally` blocks executed. The garbage collector's threads are daemons; your `main` thread is not.

## Thread states

A thread is `NEW` before `start()`, `RUNNABLE` when it is running or eligible to run, `BLOCKED` when waiting to enter a `synchronized` block held by another thread, `WAITING`/`TIMED_WAITING` when parked in `wait`, `join`, `sleep` or a lock's condition, and `TERMINATED` after `run()` returns. `t.getState()` reports it; a thread dump (`jstack <pid>` or `Ctrl-Break`) lists every thread's state and stack, and is the first thing to take when a program hangs — two threads `BLOCKED` on each other's locks is a deadlock in one screen.

## Names, priorities, uncaught exceptions

Name threads (`new Thread(task, "payment-worker-3")`): the name appears in every stack trace and thread dump, and "Thread-17" tells you nothing at three in the morning. Priorities (`setPriority`, 1–10) are hints the OS may ignore — never rely on them for correctness. An exception that escapes `run()` kills that thread only, printing a stack trace via the default `UncaughtExceptionHandler`; set one (`t.setUncaughtExceptionHandler(...)`) to log properly, because a silently dying worker is the second-hardest bug to find after a race.

## Cost, and why pools exist

A platform thread is an OS thread: about a megabyte of stack reserved, a system call to create, a context switch to run. A few hundred are fine; tens of thousands are not, and `new Thread` per request is how servers fall over under load (`OutOfMemoryError: unable to create native thread`). Reuse them through a pool — lesson 4 — and, since Java 21, consider **virtual threads** (module 19) for I/O-heavy work where a million blocked threads is the natural shape.

## Interview angle

- *"`start()` versus `run()`?"* `start()` creates a new thread that calls `run()`; calling `run()` directly runs it on the current thread.
- *"`Runnable` versus `Callable`?"* `run()` returns nothing and throws nothing checked; `call()` returns a value and may throw — needs an executor.
- *"How do you stop a thread?"* You cannot force it; interrupt it and have it check the flag / handle `InterruptedException`. `stop()` is unsafe.
- *"What does `join()` guarantee?"* The target has terminated and all its writes are visible to the caller.
- *"Daemon thread?"* Does not keep the JVM alive; killed at exit without cleanup.

## Key takeaways

- Task = `Runnable`/`Callable`; thread = `Thread`. Pass the task in; do not extend `Thread`.
- `start()` once; `run()` is just a method. Start all, join all, then read results.
- Stop cooperatively with `interrupt()`; never swallow `InterruptedException`; `Thread.stop` is gone for good reason.
- Daemons die with the JVM; name your threads; set an uncaught-exception handler.
- Platform threads are expensive — pool them, or go virtual for blocking I/O.
