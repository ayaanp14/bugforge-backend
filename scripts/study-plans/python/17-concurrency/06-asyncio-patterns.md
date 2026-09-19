---
title: asyncio patterns — TaskGroup, queues, semaphores, async iteration and bridging
minutes: 14
---
The basics give you coroutines and `gather`; real programs need the shapes built on them: a group of tasks that fails together, a bounded number of concurrent requests, a producer feeding consumers through a queue, an `async for` over a stream, an `async with` around a connection, and a way to call the synchronous world without freezing the loop. This lesson covers `TaskGroup` (new in 3.11), `Semaphore` for rate limiting, `asyncio.Queue` workers, `as_completed` and its ordering caveat, async iterators, generators and context managers, `to_thread` and `run_in_executor`, and the guidance on when asyncio is the wrong tool.

## TaskGroup

```python
async def main():
    async with asyncio.TaskGroup() as tg:              # 3.11+
        t1 = tg.create_task(fetch("a", 0.2))
        t2 = tg.create_task(fetch("b", 0.1))
    print(t1.result(), t2.result())                    # both done when the block exits
```

A `TaskGroup` owns the tasks created inside it: the `async with` block waits for all of them, and if one raises, the others are *cancelled* and the exceptions are raised together as an `ExceptionGroup` (`except*` catches by type). This is structured concurrency — no task outlives its block, no exception is lost — and it is the replacement for `gather` when tasks should fail together. `gather(..., return_exceptions=True)` is the other choice: run everything, collect exceptions as values.

## Bounding concurrency

```python
sem = asyncio.Semaphore(5)                            # at most five in flight

async def fetch_limited(url):
    async with sem:
        return await fetch(url)

results = await asyncio.gather(*(fetch_limited(u) for u in urls))
```

A thousand coroutines are free to *create*; a thousand simultaneous connections are not free for the server. `Semaphore(n)` is the standard limiter, and `gather` still returns the results in order. `asyncio.Lock`, `Event` and `Condition` mirror their threading namesakes; they exist for coordination between coroutines and are needed less often, because no switch can occur between two plain statements.

## Producer and consumers with a queue

```python
async def producer(q, items):
    for item in items:
        await q.put(item)
    await q.put(None)

async def consumer(q, out):
    while (item := await q.get()) is not None:
        out.append(item * 2)
        q.task_done()

async def main():
    q = asyncio.Queue(maxsize=10)                     # maxsize: back-pressure on the producer
    out = []
    await asyncio.gather(producer(q, range(5)), consumer(q, out))
    print(out)                                        # [0, 2, 4, 6, 8]
```

`asyncio.Queue` is the coroutine version of `queue.Queue`: `await q.put`, `await q.get`, `task_done`, `await q.join()`. With several consumers, each needs a sentinel (or the parent cancels the workers after `q.join()`), and each consumer's results should go into its own slot and be merged in order afterwards.

## as_completed

```python
for coro in asyncio.as_completed([fetch("a", 0.3), fetch("b", 0.1)]):
    result = await coro                                # "b ready" first
```

For progress reporting; not for ordered answers. Sort before printing, or use `gather`.

## Async iteration and context managers

```python
async def ticker(n):                                   # an async generator
    for i in range(n):
        await asyncio.sleep(0)
        yield i

async def main():
    async for i in ticker(3):                          # await between items
        print(i)
    squares = [i * i async for i in ticker(3)]         # async comprehension

    async with aiohttp.ClientSession() as session:     # __aenter__/__aexit__ may await
        ...
```

`async for` drives an object with `__aiter__`/`__anext__` (an async generator is the easy way to write one); `async with` drives `__aenter__`/`__aexit__`. Both exist because the protocol methods need to `await` — a database cursor fetching rows, a connection being opened and closed. `contextlib.asynccontextmanager` writes an async context manager from an async generator with one `yield`, exactly like its sync twin.

## Bridging to blocking and CPU-bound code

```python
data = await asyncio.to_thread(read_big_file, path)                 # blocking I/O → a worker thread

loop = asyncio.get_running_loop()
total = await loop.run_in_executor(process_pool, cpu_heavy, n)      # CPU → a process pool
```

`to_thread` (3.9+) is the everyday bridge for a library with no async version; `run_in_executor` accepts a specific executor, including a process pool for CPU work. Both return awaitables, so the loop keeps serving other coroutines while the work runs elsewhere. The reverse direction — calling into a running loop from a thread — is `asyncio.run_coroutine_threadsafe(coro, loop)` or `loop.call_soon_threadsafe`.

## Choosing asyncio

Reach for asyncio when the program is mostly waiting on many things at once and the libraries involved are async-native — web servers and clients, websockets, chat, scrapers, anything with thousands of connections. Prefer threads when the count is small and the libraries are blocking (a handful of `requests` calls, a database driver with no async version): `ThreadPoolExecutor.map` is three lines and needs no rewrite. Prefer processes for CPU. Mixing is normal: an async web handler that hands a CPU stage to a process pool with `run_in_executor` is the standard shape.

## Pitfalls

- A `TaskGroup` task's exception silently cancelling siblings that were expected to finish — use `gather(return_exceptions=True)` when independence matters.
- Unbounded fan-out against a rate-limited service.
- Consumers that never get a sentinel and wait forever.
- Printing from `as_completed` and expecting input order.
- `for` instead of `async for` on an async generator (`TypeError: 'async_generator' object is not iterable`).
- A blocking library call inside a coroutine because "it's fast".

## Key takeaways

- `TaskGroup` gives structured concurrency: the block waits for its tasks, one failure cancels the rest, errors arrive as an `ExceptionGroup`.
- `Semaphore(n)` bounds concurrency while `gather` keeps result order; `Lock`/`Event`/`Condition` mirror threading.
- `asyncio.Queue` with sentinels connects producers and consumers; `maxsize` gives back-pressure.
- `async for`/`async with` drive awaitable protocols; async generators and `asynccontextmanager` write them.
- `to_thread` and `run_in_executor` keep the loop alive while blocking or CPU work runs elsewhere; asyncio is for many async-native waits, threads for a few blocking ones, processes for CPU.
