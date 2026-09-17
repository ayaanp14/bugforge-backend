---
title: Condition variables — waiting without spinning
minutes: 14
---
A mutex answers "who may touch this now?". It does not answer "when will there be something to take?". A consumer that finds the queue empty could unlock, check again, unlock, check again — burning a core to discover nothing has changed — or sleep for a millisecond and add that millisecond to every hand-off. `std::condition_variable` is the third option: the thread sleeps until another thread says the state has changed. This lesson covers the protocol (a mutex, a state, a predicate), spurious and lost wake-ups, `notify_one` against `notify_all`, a bounded producer–consumer queue, and shutting such a queue down so that every thread exits.

## The protocol

A condition variable is always used with three things: a `std::mutex`, some state protected by that mutex, and a predicate over the state that says whether the waiter may proceed. The waiter takes a `std::unique_lock`, then calls `wait(lock, predicate)`:

```cpp
#include <condition_variable>
#include <mutex>

std::mutex m;
std::condition_variable cv;
bool ready = false;       // the state; guarded by m

void consumer() {
    std::unique_lock<std::mutex> lock(m);
    cv.wait(lock, [] { return ready; });   // sleeps until ready is true
    // lock is held again here, and ready is true
}

void producer() {
    {
        std::lock_guard<std::mutex> lock(m);
        ready = true;                      // change the state under the mutex
    }
    cv.notify_one();                       // then wake a waiter
}
```

`wait` atomically releases the mutex and puts the thread to sleep; when the thread is woken it re-acquires the mutex before `wait` returns. The two-argument form is exactly `while (!predicate()) wait(lock);` — the predicate is checked with the lock held, before sleeping and after every wake-up. That loop is not optional, for two reasons.

## Spurious and lost wake-ups

A **spurious wake-up** is a return from `wait` that nobody asked for; operating systems permit them, and a waiter that treats "I woke up" as "the condition holds" will read an empty queue. The predicate form re-checks and goes back to sleep. A **lost wake-up** is the opposite: the producer sets `ready` and notifies *before* the consumer has started waiting, so nobody is there to receive it. That is why the state lives under the mutex and the predicate is tested with the mutex held — a consumer that arrives late sees `ready == true` and never waits at all. The notify itself carries no information; only the state does. A `notify_one` with nothing changed wakes a thread that checks the predicate and sleeps again.

`wait` requires a `std::unique_lock<std::mutex>`, not a `std::lock_guard`, because it must unlock and re-lock. `std::condition_variable_any` accepts any lock type and, in C++20, a `std::stop_token`; the plain one is faster and is what you want with a `std::mutex`.

## notify_one and notify_all

`notify_one` wakes one waiter — right when any one of them can consume the change, such as one item pushed to a queue with several consumers. `notify_all` wakes every waiter — right when the change concerns all of them: a "shutting down" flag, a "go" signal for a group of workers, or when different waiters wait on different predicates and you cannot tell which the change satisfies. Waking everyone when one would do is a "thundering herd" — the others check, find nothing, and sleep again — but it is merely slow, never wrong. Notifying while still holding the mutex is correct; releasing first, as in `producer` above, lets the woken thread acquire the mutex without immediately blocking on it.

## A bounded producer–consumer queue

The queue below is the workhorse of concurrent programs: producers `push` and block when it is full, consumers `pop` and block when it is empty, and two condition variables keep the two kinds of waiter apart.

```cpp
#include <condition_variable>
#include <mutex>
#include <optional>
#include <queue>

class BoundedQueue {
public:
    explicit BoundedQueue(std::size_t capacity) : capacity_(capacity) {}

    void push(long long v) {
        std::unique_lock<std::mutex> lock(m_);
        notFull_.wait(lock, [this] { return items_.size() < capacity_; });
        items_.push(v);
        lock.unlock();
        notEmpty_.notify_one();
    }

    std::optional<long long> pop() {
        std::unique_lock<std::mutex> lock(m_);
        notEmpty_.wait(lock, [this] { return !items_.empty() || closed_; });
        if (items_.empty()) return std::nullopt;       // closed and drained
        long long v = items_.front();
        items_.pop();
        lock.unlock();
        notFull_.notify_one();
        return v;
    }

    void close() {
        { std::lock_guard<std::mutex> lock(m_); closed_ = true; }
        notEmpty_.notify_all();
    }

private:
    std::mutex m_;                          // guards everything below
    std::condition_variable notFull_;
    std::condition_variable notEmpty_;
    std::queue<long long> items_;
    std::size_t capacity_;
    bool closed_ = false;
};
```

A `capacity` of 1 makes the producer and consumer strictly alternate; a larger one lets a fast producer run ahead by that many items. The bound is the point: an unbounded queue lets a producer outrun a slow consumer until memory runs out, and *back-pressure* — the producer sleeping in `push` — is what a bound provides.

## Shutting down cleanly

The hardest part of a queue is the end. A consumer blocked in `pop` on an empty queue sleeps forever unless something wakes it, and a program with a sleeping thread never exits — the judge reports a timeout. `close()` is that something: it sets `closed_` under the mutex and calls `notify_all`, so *every* consumer wakes; the predicate `!items_.empty() || closed_` lets them through; and `pop` returns the remaining items first, `std::nullopt` only once the queue is drained. The consumer's loop is then `while (auto item = q.pop())`, and the whole program is:

```cpp
int main() {
    BoundedQueue q(4);
    long long total = 0;
    std::thread consumer([&q, &total] {
        while (auto item = q.pop()) total += *item;    // ends on nullopt
    });
    std::thread producer([&q] {
        for (long long i = 1; i <= 100; ++i) q.push(i);
        q.close();
    });
    producer.join();
    consumer.join();
    std::cout << total << '\n';                         // 5050, every run
    return 0;
}
```

The consumer's total is deterministic because the *set* of items is fixed by the producer, and integer addition does not care about the order in which the scheduler let them through. What is not deterministic — how full the queue got, how often each side waited — must never be printed.

## Turn-taking with a condition variable

The same protocol imposes an order between threads when one is needed. With `int turn` under the mutex, thread `i` waits for `turn % k == i`, does its step, increments `turn`, and calls `notify_all`; the threads then run strictly round-robin, and a sequence they build together comes out identical every time. It is a demonstration, not a design — threads forced to alternate might as well be one — but it shows that a condition variable is a general "wait until the state says so", not only a queue signal.

## Timeouts, and the C++20 additions

`wait_for(lock, duration, predicate)` and `wait_until` return `false` if the deadline passes with the predicate still false, which is how a thread avoids waiting forever on a producer that died. C++20 adds three simpler primitives for common special cases: `std::latch` (a countdown that opens once), `std::barrier` (a reusable rendezvous for a fixed group) and `std::counting_semaphore` (a permit count). They cover "wait for all workers to be ready" and "at most four at a time" without a mutex or a predicate; the condition variable remains the general tool.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `wait(lock)` with no predicate | A spurious wake-up proceeds on a false condition |
| Changing the state without the mutex | A lost wake-up; the waiter sleeps forever |
| Forgetting `close()`/`notify_all` at the end | Consumers never exit; the judge times out |
| Holding the lock while processing the item | Producers and other consumers all wait on the processing |
| `notify_one` for a change that concerns every waiter | Some threads never wake |
| `std::lock_guard` with `wait` | Compile error: `wait` needs `std::unique_lock` |

## Key takeaways

- A condition variable is used with a mutex, a state and a predicate; `wait(lock, pred)` re-checks the predicate after every wake-up.
- Change the state under the mutex, then notify; the state carries the information, the notify only says "look again".
- `notify_one` when any one waiter can act; `notify_all` for shutdown, group signals and mixed predicates.
- A bounded queue blocks producers when full and consumers when empty; the bound is back-pressure.
- Shut down with a closed flag and `notify_all`, drain the remaining items, and return "nothing" only when empty and closed.
- Totals over a fixed set of items are deterministic; queue depths and wait counts are not, so never print them.
