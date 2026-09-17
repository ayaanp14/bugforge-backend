---
title: Threads — std::thread, std::jthread and the join rule
minutes: 14
---
A thread is a second flow of control inside the same process: it has its own stack and its own position in the code, and it shares everything else — the heap, globals, static locals, open files — with every other thread. Since C++11 threads are part of the standard library (`<thread>`), portable across operating systems. This lesson covers how a thread starts, how arguments travel into it, `join` versus `detach`, the C++20 `std::jthread` that joins itself, how to split a vector across threads without a lock, and the rule every judged program in this module obeys: threads compute, the main thread joins them all, and only then does anything get printed.

## Starting a thread

```cpp
#include <iostream>
#include <thread>

void work(int id, int reps, long long& out) {
    long long acc = 0;
    for (int i = 0; i < reps; ++i) acc += id;
    out = acc;
}

int main() {
    long long result = 0;
    std::thread t(work, 7, 1000, std::ref(result));   // running from this line on
    t.join();                                          // wait for it to finish
    std::cout << result << '\n';                       // 7000
    return 0;
}
```

Constructing a `std::thread` with a callable and its arguments starts the thread immediately; there is no separate `start()`. `join()` blocks the calling thread until the function returns, and after it the object is no longer *joinable*. The rule the destructor enforces is harsh: destroying a `std::thread` that is still joinable calls `std::terminate`. The library refuses to guess whether you meant "wait for it" or "abandon it", and an aborted program is easier to diagnose than a thread silently running past the end of `main`. Every `std::thread` must therefore be joined (or detached) on every path out of the scope that owns it — including the path an exception takes, which is the case `std::jthread` was added for.

## How arguments travel

The constructor *copies* the callable and each argument into storage owned by the new thread, then invokes the callable with those copies as rvalues. A parameter taken by value receives the copy, as expected. A parameter declared `T&` cannot bind to an rvalue, so passing a plain variable to it is a compile error — libstdc++ says "std::thread arguments must be invocable after conversion to rvalues" — and the fix is `std::ref(x)`, a `std::reference_wrapper` the invocation unwraps; that is why `result` above is wrapped. A `const T&` parameter compiles without help but binds to the thread's private copy, so a large vector is still copied once; `std::cref(v)` passes the original. The copy rule is a safety feature: a thread that copied its arguments cannot be surprised by the caller changing them. Whenever you write `std::ref`, you take on the obligation that the referenced object outlives the thread — trivially true when the same scope joins it.

## Lambdas as thread bodies

Most thread bodies are lambdas, and the same rules apply to captures. Capturing by reference is safe *because* the owning scope joins the thread before the captured objects are destroyed:

```cpp
std::vector<int> data(1000, 3);
long long evens = 0;
std::thread t([&data, &evens] {
    for (int x : data) if (x % 2 == 0) evens += x;
});
t.join();          // data and evens are alive until here, so the references were valid
```

The trap is a loop variable. If four threads are started in a loop and each captures `i` by reference, every thread reads `i` whenever it happens to run — after the loop has moved on — and a thread reading a variable the loop is writing is a data race (lesson 2). Capture the index by value and the shared containers by reference: `[&partial, &data, i]`.

## join, detach and joinable

`join()` waits and then makes the object non-joinable; calling it a second time throws `std::system_error`. `detach()` also makes it non-joinable, but by disowning the thread: it keeps running with nothing waiting for it. When `main` returns the process ends and every detached thread is killed wherever it happens to be, and any reference it holds to a local of its starting scope dangles the moment that scope exits. Detached threads have their uses in servers; a program that reads input, computes and prints has none, and a judged program must never detach. The habit is *one owner, one join*: the scope that creates the threads joins them, in a `std::vector<std::thread>` walked with `for (auto& w : workers) w.join();`.

## std::jthread

C++20's `std::jthread` is a `std::thread` whose destructor joins: nothing terminates, an early `return` or an exception still waits for the worker, and a `std::vector<std::jthread>` joins every element when it is destroyed. It also carries a cooperative stop mechanism: if the callable's first parameter is a `std::stop_token`, the thread receives one, and `request_stop()` — called explicitly, or by the destructor before it joins — flips it.

```cpp
#include <stop_token>
#include <thread>

std::jthread worker([](std::stop_token st, int step) {
    long long acc = 0;
    while (!st.stop_requested() && acc < 1'000'000) acc += step;
}, 5);
// the destructor calls worker.request_stop(), then join()
```

Polling `stop_requested()` is the thread's own responsibility — nothing is interrupted by force, which is the only safe design when the thread may be holding a lock or half-way through a write. Prefer `std::jthread` in new code; this module uses `std::thread` where the join is the point being made.

## Splitting work without a lock

The parallel sum below is the shape of most exercises in this module. The vector is split into contiguous chunks, `[i * n / t, (i + 1) * n / t)`, a formula that spreads the remainder without a special case and produces empty ranges when `n < t`. Each thread writes its answer into its own element of a results vector sized *before* the threads started, so no two threads touch the same memory and no lock is needed; the merge — the only place the results meet — happens on the main thread after every join.

```cpp
#include <iostream>
#include <thread>
#include <vector>

int main() {
    std::vector<int> v(10'000, 3);
    const std::size_t t = 4;
    std::vector<long long> partial(t, 0);
    {
        std::vector<std::jthread> workers;
        for (std::size_t i = 0; i < t; ++i) {
            const std::size_t lo = i * v.size() / t;
            const std::size_t hi = (i + 1) * v.size() / t;
            workers.emplace_back([&v, &partial, i, lo, hi] {
                long long s = 0;
                for (std::size_t k = lo; k < hi; ++k) s += v[k];
                partial[i] = s;
            });
        }
    }                                   // every worker joined here
    long long total = 0;
    for (long long p : partial) total += p;
    std::cout << total << '\n';         // 30000
    return 0;
}
```

Reading `v` from four threads at once is fine — reads never race with reads. Sizing `partial` first matters: a `push_back` from inside a thread could reallocate the buffer under another thread's feet. Note the local `s`: accumulating in a register and storing once is faster and cleaner than writing `partial[i] += v[k]` on every step.

## hardware_concurrency and what a thread costs

`std::thread::hardware_concurrency()` returns the number of threads the hardware can run at once — a hint, and 0 when unknown. On the judge it is 2, so two threads doing arithmetic finish in about half the time and eight finish no sooner, only interleaved. Starting a thread costs tens of microseconds plus a stack (8 MB reserved on Linux), so spawn one per chunk, never one per element. And never print the value — it differs from machine to machine, and the judge compares output exactly.

## The judge rule: compute, join, then print

`std::cout` is one shared object. The standard promises that concurrent `<<` calls are not a data race, but it also says characters may interleave, and which thread's line appears first depends on the scheduler — a different answer on every run. A judged program must print exactly the same bytes every time, so the rule is mechanical: threads write into their own slots; the main thread joins every worker; the main thread prints in index order. It is also good design — computation and presentation kept apart — and every exercise in this module is built on it.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| A `std::thread` destroyed while joinable | `std::terminate` — the program aborts |
| Passing a variable to a `T&` parameter without `std::ref` | Compile error: the thread's copy is an rvalue |
| Capturing the loop index by reference | Every thread may read a changed `i` — a data race and the wrong slot |
| `detach()` in a program that then returns from `main` | The thread is killed mid-work; references to locals dangle |
| Printing from inside a thread | Interleaved, order-dependent output the judge rejects |
| One thread per element | Thousands of thread starts; slower than the serial loop |

## Key takeaways

- Constructing a `std::thread` starts it; every joinable thread must be joined (or detached) before it is destroyed, or the program terminates.
- Arguments are copied into the thread and passed as rvalues: use `std::ref`/`std::cref` for references, and keep the referenced objects alive until the join.
- Capture loop indices by value; capture shared data by reference only when the owning scope joins the thread.
- `std::jthread` joins in its destructor and offers a cooperative `std::stop_token`; prefer it in new code.
- Split work into contiguous chunks, give each thread its own slot in a pre-sized results vector, and merge on the main thread after joining.
- Threads compute; the main thread joins them all and prints aggregated results in a fixed order — never print from a worker.
