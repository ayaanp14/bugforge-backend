---
title: Threads — Thread, Lock, Event, Queue and the race you must see once
minutes: 15
---
A thread is a second flow of control inside the same process, sharing every object with the first. `threading.Thread` starts one; `join` waits for it; a `Lock` serialises access to shared state; a `queue.Queue` moves work between threads safely; an `Event` signals. The lesson's centrepiece is the race condition: two threads incrementing one counter and losing updates — shown, explained at the bytecode level, and fixed — because until you have seen it you will not believe a one-line `+=` can be wrong. It ends with the recipes that keep threaded programs deterministic: per-thread result slots, one lock per shared structure, join before reading.

## Starting and joining

```python
import threading

def work(name, results, i):
    results[i] = f"{name} done"          # each thread writes its own slot

results = [None] * 3
threads = [threading.Thread(target=work, args=(f"t{i}", results, i)) for i in range(3)]
for t in threads:
    t.start()
for t in threads:
    t.join()                              # wait for every thread before reading
print(results)                            # ['t0 done', 't1 done', 't2 done'] — deterministic
```

`Thread(target=fn, args=(...), kwargs={...}, name=..., daemon=False)`; `start()` runs `fn` in the new thread; `join(timeout=None)` blocks until it finishes. A *daemon* thread is killed when the main thread exits — right for a background heartbeat, wrong for anything that writes. `threading.current_thread().name` identifies the running thread. Subclassing `Thread` and overriding `run` is the older style; `target=` is clearer.

## The race

```python
counter = 0

def bump(n):
    global counter
    for _ in range(n):
        counter += 1

threads = [threading.Thread(target=bump, args=(100_000,)) for _ in range(4)]
for t in threads: t.start()
for t in threads: t.join()
print(counter)          # often less than 400000 — updates lost
```

`counter += 1` compiles to *load* `counter`, *add* 1, *store* `counter` — three bytecodes. The GIL can switch threads between any two of them: thread A loads 41, thread B loads 41, both store 42, and one increment is gone. (On 3.11 the switch interval makes the loss visible only with many iterations; on the judge the loss is real but its *size* varies, so an exercise must never print the racy value.) Any read-modify-write on shared state — `+=`, `d[k] = d[k] + 1`, `if x not in s: s.add(x)`, `xs.append` followed by `len(xs)` — is the same bug.

## Locks

```python
lock = threading.Lock()

def bump(n):
    global counter
    for _ in range(n):
        with lock:                        # acquire … release, even on exception
            counter += 1
```

A `Lock` is held by one thread at a time; `with lock:` acquires it on entry and releases on exit. Inside the block the read-modify-write is *atomic with respect to other holders of the same lock*. Rules: one lock per shared structure, held for the shortest possible time, never while doing I/O or calling unknown code, and always acquired in the same order when a thread needs two (lock ordering is the cure for deadlock). `RLock` may be re-acquired by the thread that holds it — for recursive code — and `lock.acquire(timeout=1.0)` avoids waiting forever.

Some operations *are* atomic under the GIL — a single `list.append`, `dict[k] = v`, reading one attribute — but compound operations built from them are not, and relying on the atomicity of individual operations is how programs become correct by accident and wrong after a refactor. Lock the compound operation.

## Queue: the safe way to share

```python
import queue

q = queue.Queue()

def producer(items):
    for item in items:
        q.put(item)
    q.put(None)                           # a sentinel: no more work

def consumer(results):
    while (item := q.get()) is not None:
        results.append(item * 2)
        q.task_done()
```

`queue.Queue` is thread-safe: `put` and `get` are locked internally, `get` blocks until an item is available (or `timeout=`), `maxsize` makes `put` block when full (back-pressure), and `join()` waits until every item has been `task_done()`. A queue turns "shared state with locks" into "messages between owners", which is the design that scales: each thread owns its data and communicates by passing values. `LifoQueue` and `PriorityQueue` are the stack and heap variants.

## Event, Semaphore, Barrier

```python
stop = threading.Event()
def poll():
    while not stop.is_set():
        check_once()
        stop.wait(0.5)                    # sleeps, but wakes early when set
stop.set()                                # from the main thread: tell pollers to finish

limit = threading.Semaphore(3)            # at most three at once
with limit:
    call_api()

sync = threading.Barrier(4)               # four threads wait for each other, then all proceed
sync.wait()
```

`Event` is a one-bit flag threads wait on; the graceful-shutdown signal. `Semaphore(n)` is a counting lock — a rate limiter for a shared resource. `Barrier(n)` synchronises a phase. `threading.local()` gives each thread its own attribute namespace for state that must not be shared (a per-thread connection).

## Deterministic recipes

- **Per-thread result slots**: `results[i] = …` with `i` fixed at creation; no shared counter to race on.
- **One aggregation after join**: sum, sort, merge the slots in the main thread.
- **Pool the work**: `ThreadPoolExecutor.map` (next lesson) gives results in submission order.
- **Lock the compound operations** on anything genuinely shared, and print nothing from inside a thread.
- **Sleep is not synchronisation**: `time.sleep` to "let the other thread finish" is a race with extra steps; `join`, `Event` and `Queue.join` are the tools.

## Pitfalls

- `x += 1` on shared state without a lock.
- Two locks acquired in different orders by different threads — deadlock.
- Holding a lock during I/O, serialising the whole program.
- A daemon thread that writes files.
- Printing from threads and reading the interleaving as meaningful.
- Reading results before `join`.

## Key takeaways

- `Thread(target=…)`, `start()`, `join()`; daemon threads die with the process; join before reading results.
- `counter += 1` is three bytecodes; two threads lose updates — the race — and `with lock:` makes the compound operation atomic.
- One lock per shared structure, held briefly, acquired in a fixed order; `RLock` for re-entrancy.
- `queue.Queue` passes work between threads safely with blocking `get`/`put`, sentinels and `join`; `Event`, `Semaphore`, `Barrier` signal, limit and synchronise.
- Give each thread its own result slot, aggregate after the join, never print from a worker.
