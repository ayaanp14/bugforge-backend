---
title: Mutexes and locks — making shared writes safe
minutes: 15
---
The moment two threads write the same variable, the program stops being the program you wrote. This lesson defines the data race precisely — it is undefined behaviour, not merely a wrong count — and then covers the tools that remove it: `std::mutex` and the RAII lock types (`std::lock_guard`, `std::scoped_lock`, `std::unique_lock`), the discipline of small critical sections, the deadlock that two locks taken in opposite orders produce and the ordering rules that prevent it, and `std::shared_mutex` for data that is read far more often than it is written.

## What a data race is

`++counter` looks like one step. To the CPU it is three — load the value, add one, store it back — and two threads can interleave them: both load 41, both store 42, and one increment is lost. Losing increments is the visible symptom, but the language rule is stronger. Two threads access the same memory location, at least one of them writes, and nothing orders the accesses: that is a **data race**, and the standard says a program containing one has undefined behaviour. The compiler assumes there is no race, so it may keep `counter` in a register for the whole loop and store it once at the end; a thread might then never see the other's writes at all. The program below is broken, and it stays broken however many times it happens to print 200000:

```cpp
// BROKEN: a data race — undefined behaviour
#include <iostream>
#include <thread>

int counter = 0;
void bump() { for (int i = 0; i < 100000; ++i) ++counter; }

int main() {
    std::thread a(bump), b(bump);
    a.join(); b.join();
    std::cout << counter << '\n';   // often below 200000; formally, anything
    return 0;
}
```

Reads alone never race: any number of threads may read a `const` table at once. The race needs a write, and the cure is to make sure no thread can touch the location while another is in the middle of writing it.

## std::mutex and std::lock_guard

A mutex (*mutual exclusion*) is a lock exactly one thread can hold. `lock()` blocks until the holder calls `unlock()`; the code between the two calls is a **critical section**, and only one thread at a time is inside it. Never call the pair by hand: an early `return` or an exception between them leaves the mutex locked forever, and every other thread blocks on it until the judge kills the process. The RAII lock types (Module 7, lesson 3) unlock in their destructor on every path:

```cpp
#include <mutex>

std::mutex m;
int counter = 0;

void bump() {
    for (int i = 0; i < 100000; ++i) {
        std::lock_guard<std::mutex> lock(m);   // locked here
        ++counter;
    }                                          // unlocked here
}
```

Now the final value is exactly 200000, on every run. The mutex also establishes a *happens-before* edge: whatever a thread wrote before unlocking is visible to the next thread that locks, so the lock protects not just the increment but every variable touched inside the section.

Give the lock a name. `std::lock_guard<std::mutex>{m};` compiles, creates a temporary, and destroys it at the semicolon — the critical section is unprotected and no warning says so. And keep the mutex next to the data it guards, in a class, with a comment saying which members it covers:

```cpp
class Tally {
public:
    void add(long long x) { std::lock_guard<std::mutex> lock(m_); value_ += x; }
    long long value() const { std::lock_guard<std::mutex> lock(m_); return value_; }
private:
    mutable std::mutex m_;   // guards value_
    long long value_ = 0;
};
```

`mutable` lets a `const` member function lock (Module 8, lesson 3). Note that `value()` locks too: a read that skips the lock races with `add`, and the rule is symmetric — every access to the guarded data, reads included, goes through the mutex.

## Keep the critical section small

A lock serialises: whatever happens inside it runs one thread at a time, and the more of the program that is inside, the less parallelism is left. The pattern is to compute on private data and lock only to publish:

```cpp
void tally(const std::vector<int>& v, std::size_t lo, std::size_t hi,
           long long& total, std::mutex& m) {
    long long local = 0;
    for (std::size_t i = lo; i < hi; ++i) local += v[i];   // no lock: local is ours
    std::lock_guard<std::mutex> lock(m);
    total += local;                                         // one lock per thread
}
```

Same answer as locking around every `+=`, with one lock per thread instead of one per element. An uncontended lock costs about twenty nanoseconds; a contended one can cost a context switch, thousands of times more. Never do I/O, heavy allocation or a call into unknown code while holding a lock.

## std::scoped_lock: several mutexes at once

Moving money between two accounts needs both accounts locked. Taking them one after the other invites the classic deadlock: thread 1 locks A then waits for B, thread 2 locks B then waits for A, and both wait forever. `std::scoped_lock` (C++17) takes any number of mutexes and acquires all of them with a deadlock-avoiding algorithm, whatever order the arguments come in; it needs no template argument thanks to class template argument deduction:

```cpp
struct Account {
    std::mutex m;             // guards balance
    long long balance = 0;
};

void transfer(Account& from, Account& to, long long amount) {
    std::scoped_lock lock(from.m, to.m);   // both, or neither — never one
    from.balance -= amount;
    to.balance += amount;
}
```

With one mutex, `std::scoped_lock` is `std::lock_guard` under a better name, and modern code uses it for both. One caveat: `from` and `to` must be different objects — locking a `std::mutex` a thread already holds is undefined behaviour, and in practice a deadlock — so a self-transfer must be rejected before the lock.

## std::unique_lock

`std::unique_lock` is the flexible one: it can be constructed without locking (`std::defer_lock`), unlocked early and re-locked, moved to another owner, and it is the lock type `std::condition_variable` requires (lesson 4). The price is a flag saying whether it currently holds the mutex. Use it when you need one of those features; otherwise `std::scoped_lock`.

```cpp
std::unique_lock<std::mutex> lock(m);
const auto snapshot = shared;   // copy under the lock
lock.unlock();                  // release before the slow part
process(snapshot);
```

## Deadlock and lock ordering

A deadlock needs a cycle of waiting: each thread holds something another one wants. Four rules break the cycle. Hold one lock at a time whenever you can. When you must hold two, take them in one fixed global order — by account number, by address — in every thread, or let `std::scoped_lock` acquire them together. Never call code you do not control (a callback, a virtual function) while holding a lock: it may lock something of its own. And keep sections short, so that contention stays rare. `std::recursive_mutex`, which one thread may lock repeatedly, exists for legacy designs; needing it usually means the class's locking is tangled.

## std::shared_mutex in brief

A `std::shared_mutex` has two modes: many readers at once under `std::shared_lock`, or one writer under `std::unique_lock`. It suits a configuration table read on every request and changed once an hour. For data written often it is slower than a plain `std::mutex`, because both modes do more bookkeeping.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `std::lock_guard<std::mutex>{m};` (an unnamed temporary) | Unlocked at the semicolon; the section is unprotected |
| Locking on the write path but not the read path | Still a data race — reads must lock too |
| Two mutexes taken in different orders by two threads | Deadlock; the program hangs until the judge kills it |
| Locking a `std::mutex` the thread already holds | Undefined behaviour; a deadlock in practice |
| Holding a lock while doing the real work | Threads run one at a time; no speed-up |
| `lock()`/`unlock()` by hand around a `return` or a `throw` | The unlock is skipped; every other thread waits forever |

## Key takeaways

- A data race — two threads, one location, at least one write, no ordering — is undefined behaviour, whatever the count happens to print.
- `std::mutex` plus a named RAII lock (`std::scoped_lock`, `std::lock_guard`) makes a critical section that unlocks on every path.
- Every access to guarded data, reads included, takes the lock; keep the mutex beside the data it guards.
- Compute on private data and lock only to publish; small sections are what keep threads parallel.
- Several mutexes: `std::scoped_lock` takes them all at once; otherwise one fixed order everywhere.
- `std::unique_lock` when you need to unlock early or wait on a condition; `std::shared_mutex` for read-mostly data.
