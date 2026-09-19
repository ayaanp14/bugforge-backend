---
title: The GIL and the three models — threads, processes, asyncio
minutes: 14
---
Python has three ways to do more than one thing at a time, and choosing among them starts from one fact about CPython: the *global interpreter lock* allows only one thread to execute Python bytecode at any moment. Threads therefore do not speed up CPU-bound Python code, but they do speed up code that *waits* — on the network, the disk, a subprocess — because a waiting thread releases the lock. Processes sidestep the lock with separate interpreters; asyncio gives waiting a single-threaded, explicit form. This lesson explains the GIL and its consequences, classifies work as CPU-bound or I/O-bound, gives the decision table for the three models, and states the rule that keeps concurrent programs testable and judgeable: collect results in a defined order, then print.

## The GIL

CPython's memory management is reference counting, and updating a count from two threads at once would corrupt it; the GIL is the mutex that prevents that by serialising bytecode execution. A thread holds the lock while running Python code, and *releases it* when it blocks on I/O (a socket read, a file read, `time.sleep`) or when a C extension explicitly drops it (NumPy's numerical loops, `hashlib`, `zlib`). Every 5 ms (`sys.getswitchinterval()`) a running thread is asked to yield so others can run.

Consequences:

- Two threads doing pure-Python arithmetic take as long as one thread doing both — sometimes longer, from contention.
- Two threads each waiting on a network response overlap almost perfectly: while one waits, the other runs.
- Thread switches can happen between any two bytecodes, so `count += 1` from two threads is a *race* — the read and the write are separate operations (lesson 2).

Python 3.12 gave each sub-interpreter its own GIL and 3.13 ships an experimental free-threaded build (`--disable-gil`); both are reading for this track — on 3.11 the GIL is simply there.

## CPU-bound versus I/O-bound

| Work | Examples | Bottleneck | Model |
| --- | --- | --- | --- |
| CPU-bound | parsing, hashing in Python, image processing in pure Python, simulation | the processor | processes (`multiprocessing`, `ProcessPoolExecutor`), or a C extension that releases the GIL |
| I/O-bound, few tasks | reading a handful of files, a few HTTP calls, a subprocess | waiting | threads (`threading`, `ThreadPoolExecutor`) |
| I/O-bound, many tasks | thousands of connections, a chat server, a scraper with high concurrency | waiting, at scale | `asyncio` |
| Mixed | fetch then compute | both | asyncio or threads for the fetch, a process pool for the compute |

The test is: if the program had infinitely fast I/O, would it still be slow? Then it is CPU-bound and threads will not help. `time.perf_counter` around the work versus around the waiting tells you which.

## The three models

**Threads** share memory: one process, several threads, every object visible to all. Cheap to start, simple to reason about for a handful of workers, and dangerous exactly because everything is shared — the lock discipline of the next lesson is mandatory. Blocking calls just work.

**Processes** share nothing: each is a separate interpreter with its own GIL and memory. True parallelism for CPU work at the cost of start-up time (tens of milliseconds each), and of passing data by *pickling* it — arguments and results must be picklable, and copying a large object to a worker can cost more than the work. `concurrent.futures.ProcessPoolExecutor` hides most of the mechanics.

**asyncio** is one thread with an event loop: coroutines (`async def`) run until they `await` something that is not ready, hand control back to the loop, and are resumed when it is. No parallelism at all — one thing runs at a time — but tens of thousands of concurrent waits with almost no memory, and switches happen only at `await`, which makes shared state safe *between* awaits. The cost: every blocking call in the program must be an `await`able one; a single `time.sleep(1)` freezes the whole loop.

## The determinism rule

Concurrent programs are nondeterministic *in scheduling*: which thread runs first, which task finishes first, the order in which messages interleave. Output that depends on that order differs from run to run and cannot be tested or judged. The rule for every exercise in this module, and for well-designed programs generally:

1. Give each worker a slot for its result — an index into a list, a key in a dict, a return value collected by `map` in submission order.
2. **Join** every worker (or `gather` every task) before reading results.
3. Print the aggregated, ordered results *after* the join, from the main thread.

`executor.map` returns results in the order the inputs were submitted regardless of completion order; `asyncio.gather` does the same for coroutines; `as_completed` does not, and its results must be sorted before printing. A worker that prints directly interleaves with others and the interleaving is arbitrary.

## What to say in an interview

The GIL serialises bytecode, so threads are for I/O and processes for CPU; asyncio is cooperative single-threaded concurrency for many I/O waits; a race is two threads touching one object between bytecodes; a lock makes a compound operation atomic; a deadlock is two locks acquired in different orders; the fix for shared state is to not share it — queues, immutable messages, results returned rather than written. Those six sentences are the whole of what most interviewers want, and the rest of this module is the practice behind them.

## Pitfalls

- Threads for a CPU-bound loop, then surprise that nothing got faster.
- A blocking call (`requests.get`, `time.sleep`, a file read) inside an `async def`.
- Printing from workers and expecting a stable order.
- Reading results before the join.
- Passing an unpicklable object (a lambda, an open file, a lock) to a process pool.
- Assuming `x += 1` is atomic.

## Key takeaways

- The GIL lets one thread run Python bytecode at a time; it is released during I/O and in some C extensions.
- CPU-bound work wants processes (or a GIL-releasing extension); I/O-bound work wants threads for a few tasks and asyncio for many.
- Threads share memory and need locks; processes share nothing and pickle data; asyncio switches only at `await` and must never block.
- Collect results into ordered slots, join everything, then print — the only way concurrent output is deterministic.
- `x += 1` is not atomic; a race is a switch between its read and its write.
