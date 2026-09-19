---
title: multiprocessing — Process, Pool, pickling, queues and shared state
minutes: 13
---
`multiprocessing` is the lower-level module under `ProcessPoolExecutor`: it starts interpreter processes, runs functions in them, and moves data between them. It exists because processes are how CPU-bound Python gets parallel, and its constraints — everything crosses the boundary by pickling, the main module is re-imported by workers, start-up costs tens of milliseconds — are the constraints of that design. This lesson covers `Process` and `Pool`, the `map`/`imap`/`starmap` family, what can and cannot be pickled, the start methods and the main guard, `Queue`/`Pipe` for messages, `Value`/`Array`/`Manager` for shared state in outline, and the cost model that decides when a pool pays.

## Process

```python
from multiprocessing import Process, Queue

def work(n, out):
    out.put((n, sum(i * i for i in range(n))))

if __name__ == "__main__":
    out = Queue()
    procs = [Process(target=work, args=(n, out)) for n in (10**5, 2 * 10**5)]
    for p in procs: p.start()
    results = sorted(out.get() for _ in procs)     # collect, then order by the key
    for p in procs: p.join()
    print(results)
```

Same shape as `Thread` — `target`, `args`, `start`, `join` — but the function runs in a new interpreter with its own memory. `Process` has `pid`, `exitcode`, `is_alive()`, `terminate()`. Results come back through a `Queue` (or a return value via a pool), never through a shared variable: a global the child modifies is the child's copy.

## Pool

```python
from multiprocessing import Pool

def square(n):
    return n * n

def power(base, exp):
    return base ** exp

if __name__ == "__main__":
    with Pool(processes=4) as pool:
        pool.map(square, range(10))                          # ordered list; blocks
        pool.map(square, range(10**6), chunksize=1000)       # batch small tasks
        list(pool.imap(square, range(10)))                   # lazy, ordered
        list(pool.imap_unordered(square, range(10)))         # lazy, completion order — sort it
        pool.starmap(power, [(2, 3), (3, 2)])                # unpack argument tuples
        pool.apply_async(square, (7,)).get(timeout=5)        # one job, a result handle
```

`Pool.map` is `ProcessPoolExecutor.map` with more knobs; `imap` streams results; `starmap` takes argument tuples. `chunksize` is the lever that matters: each task costs a pickle round trip and a queue hop, so a million tiny tasks need batching into thousands. The `with` block terminates the workers on exit; `pool.close(); pool.join()` is the explicit form that waits for them.

## Pickling

Everything that crosses to a worker — the function, its arguments, its result — is serialised with `pickle`. That works for built-in types, dataclasses, plain classes defined at module level, and functions defined at module level; it fails for lambdas, nested functions, bound methods of unpicklable objects, open files, locks, database connections and generators. The error is `PicklingError` or `AttributeError: Can't pickle local object`. The fixes: define the worker function at module level; pass data, not resources (open the file *inside* the worker); use `functools.partial` on a module-level function instead of a lambda; and for large arrays, prefer shared memory (`multiprocessing.shared_memory`, NumPy) or have the worker load its own data rather than shipping it.

## Start methods and the main guard

A worker process must obtain the code to run. With `fork` (Linux default) it inherits a copy of the parent's memory; with `spawn` (macOS and Windows default) it starts a fresh interpreter and *imports the main module* to find the function. That import re-executes top-level code, so a script that creates a pool at top level spawns workers that create pools that spawn workers. Hence the rule: everything that starts processes lives under `if __name__ == "__main__":`. `multiprocessing.set_start_method("spawn")` chooses explicitly; `fork` is faster but unsafe with threads already running.

## Queue and Pipe

`multiprocessing.Queue` is the cross-process version of `queue.Queue`: `put`/`get` with blocking and timeouts, pickling underneath. `Pipe()` returns two connected `Connection` objects for two-party messaging (`send`/`recv`). Both are for streaming work and results between long-running processes; a pool's `map` is simpler when the work is a batch.

## Shared state, in outline

`Value("i", 0)` and `Array("d", 10)` allocate typed memory shared between processes, with a `.get_lock()` for compound updates; `Manager()` starts a server process holding proxies for a dict or list that several processes may modify (slow, but general). Both are last resorts: the design that scales is no shared state — each worker computes from its inputs and returns a result, and the parent aggregates.

## The cost model

Starting a process costs 10–100 ms; pickling costs time proportional to the data's size; a result must be pickled back. A pool pays when each task is at least milliseconds of CPU work and its data is small relative to the work, or when the data is loaded inside the worker. It does not pay for a hundred tiny tasks, for tasks that ship large arguments, or for I/O-bound work (threads or asyncio are cheaper). On the judge two cores exist, so a pool of two can genuinely halve a CPU-bound computation — and every result must still be collected and ordered before printing.

## Pitfalls

- No main guard: recursive spawning on macOS/Windows.
- A lambda or nested function as the worker.
- Expecting a global modified in a worker to change in the parent.
- Shipping a large object to every task instead of loading it in the worker.
- A million tiny tasks without `chunksize`.
- `imap_unordered` output printed in arrival order.

## Key takeaways

- `Process(target=…)` mirrors `Thread` but in a separate interpreter; results return through a `Queue` or a pool, never shared variables.
- `Pool.map`/`imap`/`starmap` run batches; `chunksize` amortises the per-task pickling cost; `imap_unordered` must be sorted.
- Workers and their arguments are pickled: module-level functions, plain data, no lambdas or resources.
- Workers re-import the main module under `spawn`, so process creation lives under the main guard.
- Shared memory and managers exist; returning results and aggregating in the parent is the design to prefer.
