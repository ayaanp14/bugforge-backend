---
title: asyncio basics — coroutines, await, tasks and gather
minutes: 15
---
`asyncio` runs many waiting operations on one thread. An `async def` function is a *coroutine*: calling it builds an object that does nothing until the event loop drives it, and inside it `await` hands control back to the loop until the awaited thing is ready. The loop runs whichever coroutine can make progress, so ten downloads overlap on one thread — with no locks needed, because a switch happens only at `await`. This lesson covers the vocabulary (coroutine, task, event loop, awaitable), `asyncio.run`, `await` versus creating tasks, `gather` for ordered fan-out, `sleep` as the model of a wait, and the mistakes — calling without awaiting, blocking the loop — that every beginner makes once.

## Coroutines and the loop

```python
import asyncio

async def fetch(name, delay):
    await asyncio.sleep(delay)          # yield to the loop for `delay` seconds
    return f"{name} ready"

async def main():
    result = await fetch("a", 0.1)      # runs fetch to completion, then continues
    print(result)

asyncio.run(main())                     # creates the loop, runs main, closes the loop
```

`fetch("a", 0.1)` does not run anything — it returns a coroutine object. `await` runs it and produces its return value; while it is suspended in `asyncio.sleep`, the loop may run other coroutines. `asyncio.run(coro)` is the entry point: exactly one per program, at the top level, never inside a running loop. Everything that is awaited must be an *awaitable*: a coroutine, a `Task`, a `Future`, or an object with `__await__`.

## Sequential versus concurrent

```python
async def main():
    a = await fetch("a", 0.2)           # 0.2 s
    b = await fetch("b", 0.2)           # then another 0.2 s — sequential, 0.4 s total

async def main():
    a, b = await asyncio.gather(fetch("a", 0.2), fetch("b", 0.2))   # both at once, 0.2 s
```

`await` one thing at a time is sequential — the loop has nothing else to run. Concurrency comes from starting several before waiting: `gather(*awaitables)` schedules them all and returns their results *as a list in argument order*, whatever order they finished in. That ordering is what makes `gather` the deterministic tool, like `executor.map`.

## Tasks

```python
async def main():
    task = asyncio.create_task(fetch("a", 0.2))     # scheduled now; runs at the next await
    other = await do_something_else()
    result = await task                              # collect it later
```

`create_task(coro)` wraps a coroutine in a `Task` and schedules it; it starts running the first time the current coroutine awaits anything. A task is a `Future`: `done()`, `result()`, `cancel()`, `add_done_callback`. Keep a reference to every task you create (in a list or a set) — the loop holds tasks weakly, and a task with no reference may be garbage-collected mid-flight. `gather` creates tasks for the coroutines it is given, so the common pattern needs no explicit `create_task` at all.

## sleep(0) and the order of interleaving

```python
async def worker(name, log):
    log.append(f"{name} start")
    await asyncio.sleep(0)              # yield once: let the others reach this point
    log.append(f"{name} end")

async def main():
    log = []
    await asyncio.gather(worker("a", log), worker("b", log))
    print(log)                          # ['a start', 'b start', 'a end', 'b end']
```

`asyncio.sleep(0)` yields exactly once. The loop's scheduling is FIFO and deterministic: tasks run in the order they were created, each until its next `await`. That makes small asyncio traces reproducible — the sequence above is the same every run — unlike thread interleavings, which depend on the operating system. For judged exercises this is the model: control the order with `await` points, collect with `gather`, print after.

## The loop in one paragraph

The event loop is a queue of callbacks and a selector. `call_soon` appends a callback to the ready queue; each iteration runs every callback that was ready at the start, in order, then asks the operating system which sockets and timers are ready and queues their callbacks. A task is one callback that runs its coroutine until the next `await`; the awaited future, when it completes, calls `call_soon` for the task again. Nothing pre-empts anything: a coroutine keeps the loop until it awaits, which is why shared state is safe between awaits — and why a long computation starves every other task.

## Timeouts and cancellation

```python
try:
    result = await asyncio.wait_for(fetch("a", 5), timeout=1.0)
except asyncio.TimeoutError:
    result = "timed out"

task.cancel()                           # raises CancelledError inside the task at its next await
```

`wait_for` cancels the awaitable when the timeout expires. Cancellation is cooperative: `CancelledError` is thrown into the coroutine at its current `await`, and the coroutine may clean up in `finally` — but should not swallow the exception. 3.11 also has `asyncio.timeout()` as a context manager (`async with asyncio.timeout(1.0):`).

## Blocking the loop

`time.sleep(1)`, `requests.get(...)`, a CPU loop of a second, `input()` — anything that does not `await` — freezes every coroutine for its duration, because the loop is one thread. The replacements: `await asyncio.sleep`, an async HTTP client (`aiohttp`, `httpx`), and for something with no async version, `await asyncio.to_thread(blocking_fn, *args)`, which runs the call on a thread pool and awaits its result. A CPU-bound stage belongs in a `ProcessPoolExecutor` via `loop.run_in_executor`.

## Pitfalls

- Calling a coroutine without `await` — nothing runs, and Python warns "coroutine … was never awaited".
- `await` in a plain `def` — a syntax error; the caller must be `async def` too, all the way up to `asyncio.run`.
- A blocking call in a coroutine.
- Awaiting sequentially when the work is independent.
- Not keeping references to created tasks.
- `asyncio.run` inside a running loop (notebooks) — use `await` directly there.

## Key takeaways

- `async def` builds a coroutine; `await` runs it and yields to the loop while it waits; `asyncio.run` drives the top-level one.
- Sequential `await`s do not overlap; `gather(...)` runs awaitables concurrently and returns results in argument order.
- `create_task` schedules a coroutine to run at the next `await`; keep a reference; a task is a future.
- Scheduling is FIFO and reproducible: `sleep(0)` yields once, so small traces are deterministic.
- Never block the loop; `to_thread` and `run_in_executor` bridge to blocking and CPU-bound code; `wait_for`/`timeout` bound a wait, cancellation is cooperative.
