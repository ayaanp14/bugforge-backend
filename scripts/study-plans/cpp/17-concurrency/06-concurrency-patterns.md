---
title: Concurrency patterns — pools, reductions and the deterministic-output rule
minutes: 15
---
The earlier lessons gave the primitives; this one gives the shapes they are combined into, because production concurrency is a handful of patterns applied carefully rather than clever synchronisation. A thread pool turns "a thread per task" into "a queue and a fixed number of workers". Work splitting and reduction is the shape of every parallel loop. Immutable data and message passing remove most locks by removing the sharing. A short list of rules avoids deadlock in practice. The lesson ends with the interview answer to "threads or async?" and the checklist that keeps a judged concurrent program deterministic.

## A minimal thread pool

Starting a thread per task is expensive and unbounded. A pool starts `w` workers once; each loops taking the next task from a queue guarded by a mutex and a condition variable; `submit` wraps the caller's function in a `std::packaged_task`, keeps the future for the caller, and pushes the task; the destructor flips a stop flag, wakes everyone and joins. The version below runs tasks that return `long long`; a generic `submit` template is the same code with `std::invoke_result_t` for the return type.

```cpp
#include <condition_variable>
#include <deque>
#include <functional>
#include <future>
#include <mutex>
#include <thread>
#include <vector>

class ThreadPool {
public:
    explicit ThreadPool(int workers) {
        for (int i = 0; i < workers; ++i) threads_.emplace_back([this] { run(); });
    }
    ~ThreadPool() {
        { std::lock_guard<std::mutex> lock(m_); stopping_ = true; }
        cv_.notify_all();
        for (auto& t : threads_) t.join();
    }
    std::future<long long> submit(std::function<long long()> f) {
        std::packaged_task<long long()> task(std::move(f));
        std::future<long long> result = task.get_future();
        { std::lock_guard<std::mutex> lock(m_); tasks_.push_back(std::move(task)); }
        cv_.notify_one();
        return result;
    }
private:
    void run() {
        while (true) {
            std::packaged_task<long long()> task;
            {
                std::unique_lock<std::mutex> lock(m_);
                cv_.wait(lock, [this] { return stopping_ || !tasks_.empty(); });
                if (tasks_.empty()) return;             // stopping and drained
                task = std::move(tasks_.front());
                tasks_.pop_front();
            }
            task();                                     // outside the lock
        }
    }
    std::vector<std::thread> threads_;
    std::deque<std::packaged_task<long long()>> tasks_;   // guarded by m_
    std::mutex m_;
    std::condition_variable cv_;
    bool stopping_ = false;
};
```

Three details carry the design. The task runs *outside* the lock, so workers overlap. The destructor drains the queue before the workers exit — `return` only when `tasks_` is empty — because a task thrown away would leave its future with a `broken_promise`. And the futures come back in submission order, so `for (auto& f : results) f.get()` yields results in the order the tasks were submitted, whatever order the workers finished them. Real pools add a generic `submit`, priorities and per-thread queues; the skeleton is what interviews ask for.

## Work splitting and reduction

A parallel loop has two halves. **Split**: give each thread a contiguous chunk — `[i * n / t, (i + 1) * n / t)` — rather than every `t`-th element, because a contiguous chunk walks memory in order and stays in one cache line at a time. Static chunks are right when every element costs the same; when costs vary (primality tests, path searches) a dynamic split hands out the next index or the next block through `next.fetch_add(1)`, so a fast thread takes more. **Reduce**: each thread accumulates into a local; after the join, the main thread combines the locals in index order. For integers, addition, counting, minimum and maximum are associative and commutative, so the result is the same whichever thread got which chunk. Floating-point addition is not, which is why a parallel `double` sum is reduced in a fixed order on the main thread and never through a shared atomic.

## Immutable data and message passing

Every lock in this module guards *mutation*. Data that no thread writes needs no lock: a `const std::vector<int>&` read by eight threads is safe, and so is a lookup table built before the first thread starts. The design move is to make as much as possible immutable while threads run — build the input, freeze it, hand out slices — and to give each thread exclusive ownership of its output. When threads must talk, prefer passing messages through a queue to sharing a structure: a producer moves an item into a `BoundedQueue`, the consumer moves it out, and at no moment do two threads hold the same object. That is the discipline Go's slogan describes — share memory by communicating — and it is available in C++ with `std::move` and a queue.

## Deadlock avoidance rules

1. Prefer no shared mutable state; then no lock is needed.
2. Hold one lock at a time; if two, `std::scoped_lock` or one fixed global order.
3. Never call unknown code — a callback, a virtual function, a user-supplied comparator — while holding a lock.
4. Keep critical sections to the update itself; never block inside one (no I/O, no `join`, no waiting on another thread).
5. Every waiter has a way out: a stop flag with `notify_all`, a closed queue, a timeout.
6. Join every thread in a known place; a thread nobody joins is a thread that can still be running when its data is destroyed.

## Threads or async? The interview answer

`std::thread` (or `std::jthread`) is a *resource*: you own it, join it, and communicate through memory you arrange yourself. `std::async` with a future is a *result*: fire a function, collect its value or its exception, no join to write. Use threads for long-lived workers with a lifecycle — a pool, a consumer loop, a server — and `std::async` for a fixed set of independent computations whose answers you want back. In both cases the safe shape is the same: split, compute privately, reduce on one thread. The follow-up questions are about primitives, and the one-line answers are: a data race is two unordered accesses with a write and is undefined behaviour; a mutex protects a compound update, an atomic a single one; a condition variable waits for a state change without spinning; `join` synchronises, so after it the main thread sees everything the worker wrote.

## The deterministic-output rule for judged programs

The judge runs your program once per case and compares stdout byte for byte, so anything that varies with scheduling fails the case. The checklist:

- Threads write into their own slots or return through futures; nothing prints until every thread has been joined.
- Print in index order, or in submission order for futures — never in completion order.
- Print aggregates that do not depend on interleaving: sums, counts, maxima, sorted merges.
- Never print `hardware_concurrency()`, `std::this_thread::get_id()`, a duration, a queue's high-water mark or "which thread did it".
- Reduce floating point on the main thread in a fixed order.
- Every worker must exit: close queues, set stop flags, `notify_all`, join.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| Pool destructor that stops without draining | Pending futures throw `broken_promise` |
| Running a task while holding the queue's lock | One worker at a time — a serial program with extra steps |
| Interleaved split (`i, i + t, i + 2t, …`) for a numeric loop | Cache lines shared between threads; slower than contiguous chunks |
| Reducing `double`s through a shared atomic | Different last bits on different runs |
| Printing results in completion order | Output depends on the scheduler |
| A pool with more CPU-bound workers than cores | No speed-up, more context switches |

## Key takeaways

- A thread pool is a queue, a condition variable, `w` workers and `std::packaged_task`; futures return in submission order.
- Split into contiguous chunks (or hand out indices with `fetch_add`), compute into locals, reduce on the main thread in a fixed order.
- Immutable input needs no lock; give each thread its own output; pass messages instead of sharing structures.
- Deadlock is avoided by discipline: one lock at a time, fixed order, no unknown code under a lock, every waiter has an exit.
- Threads for long-lived workers with a lifecycle; `std::async` for independent results with an error path.
- Judged output: join everything, print in index order, aggregates only, nothing that depends on scheduling.
