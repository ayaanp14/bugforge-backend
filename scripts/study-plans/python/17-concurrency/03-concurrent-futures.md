---
title: concurrent.futures — executors, futures, map and as_completed
minutes: 13
---
`concurrent.futures` is the interface most concurrent Python code should use: an *executor* runs callables on a pool of threads or processes, each call returns a *future* that will hold the result, and the same three methods — `submit`, `map`, `shutdown` — work for both pools. The result of a job is fetched with `future.result()`, which re-raises any exception the job raised, and `map` hands results back in submission order — the property that makes threaded output deterministic. This lesson covers the two executors, `submit` versus `map`, `as_completed` and `wait`, exceptions and timeouts, pool sizing, and when to switch from threads to processes.

## The executor and the future

```python
from concurrent.futures import ThreadPoolExecutor

def fetch(url):
    return len(download(url))

with ThreadPoolExecutor(max_workers=4) as pool:      # shutdown(wait=True) on exit
    future = pool.submit(fetch, "https://a")          # starts as soon as a worker is free
    ...
    size = future.result()                            # blocks until done; re-raises if fetch raised
```

`submit(fn, *args, **kwargs)` schedules one call and returns a `Future` immediately. `result(timeout=None)` waits for and returns the value; `exception()` returns the exception instead of raising; `done()`, `running()`, `cancel()` inspect and control it; `add_done_callback(fn)` runs `fn(future)` on completion. The `with` block waits for every submitted job before exiting, so results are always complete after it.

## map: ordered results

```python
with ThreadPoolExecutor(max_workers=4) as pool:
    sizes = list(pool.map(fetch, urls))               # results in the order of urls, whatever finished first
```

`map(fn, *iterables, timeout=None, chunksize=1)` submits every element and yields results *in input order*, blocking on each in turn. It is the one-line replacement for "start N threads, join them, read the slots" and the tool to reach for first. Its limitation: an exception from any element is raised when its position is reached, and iteration stops there — for per-job error handling, use `submit` and inspect each future.

## as_completed and wait

```python
from concurrent.futures import as_completed, wait, FIRST_COMPLETED

futures = {pool.submit(fetch, url): url for url in urls}
for future in as_completed(futures):                  # yields futures as they FINISH — arbitrary order
    url = futures[future]
    try:
        print(url, future.result())
    except Exception as e:
        print(url, "failed:", e)

done, pending = wait(futures, timeout=5, return_when=FIRST_COMPLETED)
```

`as_completed` is for showing progress or acting on results as they arrive; because its order is the completion order, anything it produces must be **sorted** before it is printed as an answer. `wait` blocks until all, or the first, or the first exception, with a timeout, and returns the two sets. Mapping futures back to their inputs with a dict, as above, is the standard idiom.

## Processes

```python
from concurrent.futures import ProcessPoolExecutor

def cpu_heavy(n):
    return sum(i * i for i in range(n))

if __name__ == "__main__":                            # required: workers import the main module
    with ProcessPoolExecutor() as pool:               # max_workers defaults to the CPU count
        totals = list(pool.map(cpu_heavy, [10**6] * 4, chunksize=1))
```

Same interface, separate interpreters, real parallelism for CPU-bound functions. The constraints: the function must be importable by name (a module-level `def`, not a lambda or a nested function), arguments and results must be picklable, the main module must guard its entry point (workers re-import it), and each task carries a fixed cost of pickling and process communication — batch small tasks with `chunksize` or they will be slower than a plain loop.

## Exceptions and timeouts

A job that raises does not crash the pool; the exception is stored in its future and re-raised by `result()` (or returned by `exception()`). `result(timeout=2)` raises `TimeoutError` if the job is not done in time — the job itself keeps running; futures cannot interrupt a running callable, only `cancel()` one that has not started. Design long jobs to check a stop flag or an `Event` themselves.

## Sizing the pool

For threads doing I/O, more workers than cores is normal — 10 to 50 for network calls, bounded by what the remote side tolerates; the default is `min(32, cpu_count + 4)`. For processes doing CPU work, the CPU count (the default) is the ceiling that helps. Too many workers on a rate-limited API produces failures, not speed; a `Semaphore` inside the job or a smaller pool is the fix. Measure with `perf_counter` around the whole `with` block.

## A pattern for deterministic output

```python
def process(item):
    return item, expensive(item)                      # return the key with the result

with ThreadPoolExecutor() as pool:
    results = dict(pool.map(process, items))          # or sorted(...) — order fixed by the data, not the schedule
for key in sorted(results):
    print(key, results[key])
```

Return the identity of the work with its result, collect everything inside the `with`, then print in an order defined by the data. This is the shape every judged exercise in this module takes.

## Pitfalls

- Printing inside the job.
- Reading `as_completed` results as if they were ordered.
- A lambda or nested function submitted to a process pool.
- No `if __name__ == "__main__":` around a process pool on Windows and macOS (recursive process spawning).
- `map` swallowing per-item errors into one raise at the failing position.
- A pool of 100 threads against an API that allows 5 concurrent requests.

## Key takeaways

- `ThreadPoolExecutor`/`ProcessPoolExecutor` with the same interface: `submit` → `Future`, `map` → ordered results, `with` waits for everything.
- `future.result()` blocks and re-raises; `exception()`, `done()`, `cancel()`, `add_done_callback` inspect and control.
- `map` preserves input order — the deterministic tool; `as_completed` yields by completion and needs sorting; `wait` handles first/all/timeout.
- Processes need importable, picklable work and a main guard; batch with `chunksize`.
- Return the key with the result, collect inside the `with`, print in data order.
