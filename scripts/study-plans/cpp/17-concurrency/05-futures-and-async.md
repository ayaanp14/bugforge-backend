---
title: Futures, promises and std::async — results that arrive later
minutes: 15
---
A thread that computes a value has nowhere to put it: `std::thread` returns nothing, and an exception inside its body terminates the whole program. The `<future>` header fixes both with one idea. A **future** is a one-shot channel that will hold either a value or an exception; whoever produces it is elsewhere, and `get()` waits for it and hands it over — or rethrows. This lesson covers the three producers of a future — `std::async`, `std::promise` and `std::packaged_task` — the launch policies and the trap in `std::async`'s destructor, how an exception crosses a thread boundary, and a parallel sum that collects its partial results in a fixed order.

## std::async and std::future

```cpp
#include <future>
#include <iostream>

long long sum_to(long long n) {
    long long s = 0;
    for (long long i = 1; i <= n; ++i) s += i;
    return s;
}

int main() {
    std::future<long long> f = std::async(std::launch::async, sum_to, 1'000'000);
    // … other work here runs in parallel with sum_to …
    std::cout << f.get() << '\n';   // waits if needed: 500000500000
    return 0;
}
```

`std::async` takes a callable and its arguments the way `std::thread` does — copied, `std::ref` for references — and returns a `std::future<R>` for the callable's return type. `get()` blocks until the result exists, then moves it out; a future can be `get()` exactly once, and `valid()` is false afterwards (a second `get()` throws `std::future_error`). `wait()` blocks without taking the value; `wait_for(duration)` returns a `std::future_status` — `ready`, `timeout` or `deferred`. When several threads need the same result, `f.share()` turns it into a `std::shared_future`, which may be copied and read many times.

## Launch policies

The first argument decides where the work runs. `std::launch::async` starts a new thread now. `std::launch::deferred` runs the function lazily, on the thread that calls `get()`, and not at all if nobody does — a lazy value, not concurrency. The default, `std::launch::async | std::launch::deferred`, lets the implementation choose; libstdc++ picks a thread, but code that needs parallelism should say so: always write `std::launch::async` when the point is to run in parallel.

The trap is the destructor. A future obtained from `std::async` — and only that kind — **blocks in its destructor** until the task finishes. So this loop is sequential:

```cpp
for (int i = 0; i < 4; ++i)
    std::async(std::launch::async, work, i);   // temporary future destroyed at once: waits
```

Each temporary waits for its task before the next starts. Keep the futures — `std::vector<std::future<int>>` — and the tasks overlap.

## Exceptions cross threads through the future

If the callable throws, the exception is caught by the library, stored in the shared state, and rethrown by `get()` on whichever thread calls it. That is the whole mechanism for error handling across threads, and it is the only one: an exception that escapes a plain `std::thread` body calls `std::terminate`.

```cpp
int parse_positive(const std::string& s) {
    const int v = std::stoi(s);                      // may throw std::invalid_argument
    if (v <= 0) throw std::out_of_range("not positive: " + s);
    return v;
}

auto f = std::async(std::launch::async, parse_positive, std::string("-3"));
try {
    std::cout << f.get() << '\n';
} catch (const std::exception& e) {
    std::cout << "error: " << e.what() << '\n';      // error: not positive: -3
}
```

Catch by `const&` at the `get()`, as in Module 15; the dynamic type is preserved, so a `std::out_of_range` handler matches only that.

## std::promise: setting the value by hand

`std::async` produces the value by returning it. A `std::promise<T>` lets any code, on any thread, put a value into a future explicitly — once:

```cpp
#include <future>
#include <thread>

void find_first(const std::vector<int>& v, int target, std::promise<int> result) {
    for (std::size_t i = 0; i < v.size(); ++i) {
        if (v[i] == target) { result.set_value(static_cast<int>(i)); return; }
    }
    result.set_exception(std::make_exception_ptr(std::runtime_error("not found")));
}

std::promise<int> p;
std::future<int> f = p.get_future();               // get_future() once, before moving p
std::thread worker(find_first, std::cref(v), 42, std::move(p));
const int index = f.get();                         // or throws runtime_error
worker.join();
```

`set_value` or `set_exception` is called exactly once; a second call throws `std::future_error` (`promise_already_satisfied`). A promise destroyed without either call stores a `std::future_error` with `broken_promise`, so the waiter does not hang. `std::promise<void>` carries no value and is a one-shot signal — "the worker has initialised". Inside a `catch` block, `std::current_exception()` captures whatever was thrown, ready for `set_exception`. Promises are move-only, so they travel into the thread with `std::move`.

## std::packaged_task: a callable with a future attached

A `std::packaged_task<R(Args...)>` wraps a callable; calling the task runs it and stores the return value or exception in a future obtained beforehand:

```cpp
std::packaged_task<long long(long long)> task(sum_to);
std::future<long long> f = task.get_future();
std::thread t(std::move(task), 1000);   // run it on another thread …
t.join();
std::cout << f.get() << '\n';           // 500500
```

The task can be called on any thread, later, by anyone who holds it — which is exactly what a thread pool needs: the pool stores tasks in a queue, a worker calls them, and the submitter already holds the future (lesson 6). Like promises, packaged tasks are move-only.

## A parallel sum, joined deterministically

```cpp
std::vector<std::future<long long>> parts;
for (std::size_t i = 0; i < t; ++i) {
    const std::size_t lo = i * v.size() / t, hi = (i + 1) * v.size() / t;
    parts.push_back(std::async(std::launch::async, [&v, lo, hi] {
        long long s = 0;
        for (std::size_t k = lo; k < hi; ++k) s += v[k];
        return s;
    }));
}
long long total = 0;
for (auto& p : parts) total += p.get();   // index order, whatever finished first
```

The threads finish in whatever order the scheduler decides; the `get()` loop consumes them in index order, so the merge is the same on every run — and `parts[i].get()` is the per-thread partial, printable as "thread i". A future per chunk (not per element) keeps thread creation cheap, and the vector of futures does the joining, since each `get()` waits.

## Which one when

| Tool | Who produces the value | Typical use |
| --- | --- | --- |
| `std::async` | The function's return | Run a function in parallel and collect its result |
| `std::packaged_task` | The wrapped callable, when someone calls the task | Queued work: thread pools |
| `std::promise` | Explicit `set_value`/`set_exception` | Hand-built protocols, a signal, a result produced mid-function |
| `std::thread` + `std::ref` | You write into a slot | Fire-and-join workers with no error path |

## Pitfalls

| Mistake | What happens |
| --- | --- |
| Discarding the future from `std::async` | Its destructor waits; the loop runs sequentially |
| Omitting the launch policy and expecting a thread | Allowed to be deferred; runs at `get()` |
| `get()` twice | `std::future_error`; use `std::shared_future` for several readers |
| A promise destroyed without a value | The waiter gets `broken_promise` |
| Calling `get_future()` after moving the promise | The moved-from promise has no shared state |
| Throwing inside a `std::thread` body | No future to carry it — `std::terminate` |

## Key takeaways

- A future is a one-shot channel for a value *or* an exception; `get()` waits, moves the value out, and rethrows what the producer threw.
- `std::async(std::launch::async, f, args…)` runs `f` on a new thread; name the policy, and keep the future — an `std::async` future's destructor blocks.
- `std::promise` sets a result by hand (`set_value`/`set_exception`, exactly once); `std::packaged_task` attaches a future to any callable.
- Exceptions cross threads only through futures; an exception escaping a `std::thread` terminates the program.
- Collect futures in a vector and `get()` them in index order: deterministic merging whatever finished first.
