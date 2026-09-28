---
title: Checkpoint — Concurrency
minutes: 25
seo-title: Python Concurrency Quiz: GIL, Threads, Processes and asyncio
description: Test your Python concurrency with 12 questions and three programs on the GIL, threads and locks, queues, executors, multiprocessing and asyncio gather.
q: Why do threads not speed up a CPU-bound loop in CPython?
a: The GIL lets only one thread execute Python bytecode at a time, so CPU-bound threads take turns rather than run in parallel. Processes, through `ProcessPoolExecutor` or `multiprocessing`, or a C extension that releases the GIL, do speed it up.
q: What does `asyncio.gather` return, and in what order?
a: A list of the awaitables' results in the order the arguments were given, regardless of which finished first. An exception propagates to the caller unless `return_exceptions=True` collects it as a value in the list.
q: What is the one way to make a threaded program's output deterministic?
a: Give every worker its own result slot, join all threads before reading, and print the aggregated, ordered results from the main thread afterwards. A worker that prints directly interleaves with the others in an arbitrary order.
---
This checkpoint covers the whole module: the GIL and the three models, threads with `Lock`, `Queue` and `Event`, the race and its fix, `concurrent.futures` executors with ordered `map` and unordered `as_completed`, `multiprocessing` with pickling and the main guard, and asyncio from coroutines and `gather` through `TaskGroup`, semaphores, queues and bridging to blocking code — plus the determinism rule that every judged program obeys.

**How it works.** Twelve questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- Why do threads not speed up a CPU-bound loop in CPython, and what does speed it up?
- What are the three bytecodes behind `counter += 1`, and where can the switch happen?
- What is the difference between `executor.map` and `as_completed` in the order of results?
- Why must code that starts processes live under `if __name__ == "__main__":`?
- What happens when a coroutine is called without `await`?
- What does `asyncio.gather` return, and in what order?
- What is the one way to make a threaded program's output deterministic?

The three programs are a threaded word counter whose workers fill per-thread slots and are merged after `join`, a pipeline of workers reading a `Queue` with sentinels whose per-worker results are merged in order, and an asyncio job runner with a semaphore that records a deterministic trace through `sleep(0)` yields and reports results with `gather`.
