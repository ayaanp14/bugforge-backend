---
title: Atomics — lock-free counters and compare-exchange
minutes: 14
---
A mutex around a single `++` is a heavy tool for a light job. `std::atomic<T>` makes the operations on one variable indivisible without a lock: a `fetch_add` is one instruction the CPU performs as a unit, and no other thread can see the value half-updated. This lesson covers what an atomic promises, the operations on `std::atomic<int>`, the compare-exchange loop that turns any read-modify-write into an atomic one, when an atomic can replace a mutex and when it cannot, the memory-ordering argument (and why the default is the one to use), `std::atomic_flag`, false sharing, and why atomics on `double` are a trap for judged programs.

## What atomic means

`std::atomic<int> n{0}; n.fetch_add(1);` is a read-modify-write that no other thread can interleave with: on x86-64 it compiles to a single `lock xadd` instruction. There is no torn read (a thread seeing half of a new value) and no lost update. Every operation on an atomic is also free of data races by definition, so the counter from lesson 2 becomes well defined by changing one type:

```cpp
#include <atomic>
#include <iostream>
#include <thread>

std::atomic<int> counter{0};
void bump() { for (int i = 0; i < 100000; ++i) counter.fetch_add(1); }

int main() {
    std::thread a(bump), b(bump);
    a.join(); b.join();
    std::cout << counter.load() << '\n';   // exactly 200000
    return 0;
}
```

`std::atomic<int>`, `<long long>`, `<bool>` and pointers are *lock-free* on every mainstream platform — `std::atomic<int>::is_always_lock_free` is `true` — meaning the hardware does the work. A `std::atomic<BigStruct>` still compiles, but the library implements it with a hidden lock, which is rarely what anyone wanted. Atomics cannot be copied or moved: an atomic member makes the class non-copyable, and a `std::vector<std::atomic<int>>` can be sized at construction but not `push_back`ed into.

## The operations

| Call | Meaning |
| --- | --- |
| `a.load()`, `a.store(v)` | Read, write; `int x = a;` and `a = v;` are the same |
| `a.fetch_add(v)`, `a.fetch_sub(v)` | Add or subtract; **returns the previous value** |
| `++a`, `a += v` | `fetch_add` that yields the new value |
| `a.exchange(v)` | Store `v`, return the old value |
| `a.compare_exchange_weak(expected, desired)` | If `a == expected` store `desired` and return `true`; else copy `a` into `expected` and return `false` |

The previous value returned by `fetch_add` is a ticket dispenser: `int mine = next.fetch_add(1);` gives every calling thread a distinct number, with no lock and no duplicates, which is how work is handed out dynamically (lesson 6).

## The check-then-act trap

An atomic makes each *operation* indivisible, not a sequence of them. `if (a.load() < limit) a.store(a.load() + 1);` reads twice and writes once, and another thread can run between any two of those steps; the result is a race in disguise — not undefined behaviour, since every access is atomic, but a wrong count and a limit that is overshot. Likewise two atomics that must change together (`items` and `total`) are two independent steps, and a reader can see one updated and the other not. The rule: one variable, one operation — an atomic; a compound update, or an invariant across variables — a mutex.

## compare_exchange: any update, atomically

When the new value depends on the old one and `fetch_add` does not express it — a maximum, a clamp, a claim that must not exceed a limit — the loop is:

```cpp
void update_max(std::atomic<int>& best, int candidate) {
    int cur = best.load();
    while (candidate > cur && !best.compare_exchange_weak(cur, candidate)) {
        // another thread changed best; cur now holds its value — decide again
    }
}
```

`compare_exchange_weak(expected, desired)` says: *if the atomic still holds `expected`, replace it with `desired`*. When it does, it returns `true` and the update is done. When some other thread got in first, it returns `false` and writes the current value into `expected`, so the next iteration decides again from fresh data. The `weak` form may also fail spuriously — return `false` even though the values matched — which is harmless inside a loop and cheaper on some processors; `compare_exchange_strong` never does, and is the one to use when there is no loop around it. The loop is *lock-free*: a thread descheduled in the middle of it holds nothing, and the others proceed.

Claiming numbered slots is the same shape with a bound:

```cpp
int cur = next.load();
while (cur < limit && !next.compare_exchange_weak(cur, cur + 1)) { }
// cur < limit: slot cur is ours; otherwise none were left
```

## Memory ordering, and why the default is fine

Every atomic operation takes an optional `std::memory_order`. The default, `memory_order_seq_cst`, gives a single global order that all threads agree on — the model you have in your head. `memory_order_relaxed` guarantees only that the operation itself is atomic, with no ordering relative to other memory; it is correct for a counter read only after every thread has been joined, because `join` itself synchronises. `memory_order_acquire`/`release` are the pair for publishing data through a flag: the writer stores the data then release-stores the flag; a reader that acquire-loads the flag as set is guaranteed to see the data. The speed difference is measurable on ARM and nearly nil on x86-64, and a wrong ordering is a bug that appears once a month on a customer's machine. Leave the default unless you can write down why a weaker order is correct.

## Flags and spinlocks

`std::atomic<bool> done{false};` is the standard stop signal: a worker loops `while (!done.load())`, and the main thread stores `true`. `std::atomic_flag` is the guaranteed-lock-free primitive underneath: `test_and_set()` sets it and returns the old value, `clear()` resets it, and a spinlock is nothing more:

```cpp
std::atomic_flag busy;                              // clear when default-constructed (C++20)
void enter() { while (busy.test_and_set()) { } }   // spin until we were the one to set it
void leave() { busy.clear(); }
```

Spinning burns a core while it waits, so a spinlock is only right when the wait is nanoseconds long. C++20 added `wait()`/`notify_one()` on atomics, which park the thread instead of spinning — condition-variable behaviour without the mutex.

## False sharing, in outline

CPUs move memory in 64-byte cache lines. Two atomics that sit in the same line — `std::atomic<int> a, b;` declared together, or adjacent elements of an array — are physically one unit, and two cores hammering them bounce the line back and forth even though they never touch the same variable. The symptom is a parallel program slower than the serial one. The fix is `alignas(64)` on each hot atomic (`std::hardware_destructive_interference_size` in `<new>` names the number), or, better, not to share at all: accumulate in a local and `fetch_add` the total once, so the atomic is touched once per thread rather than once per element.

## Atomics and determinism

`std::atomic<double>` supports `fetch_add` since C++20, and it is a trap for judged programs: floating-point addition is not associative, so the sum of contributions that arrive in scheduler order differs in its last bits from run to run. Integer counters are commutative and safe; for floating point, keep each thread's partial and add them on the main thread in index order — the parallel-sum shape from lesson 1.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `a.store(a.load() + 1)` | Two operations; increments are lost — use `fetch_add` |
| Two atomics that must agree | A reader can see one updated and not the other; use a mutex |
| `compare_exchange_weak` without a loop | A spurious failure skips the update |
| `std::memory_order_relaxed` to publish data through a flag | The reader may see the flag before the data |
| `push_back` on a `std::vector<std::atomic<int>>` | Compile error: atomics are not movable |
| `std::atomic<double>` accumulation in a judged program | Last-bit differences between runs |

## Key takeaways

- An atomic operation is indivisible and never a data race; `std::atomic<int>` is lock-free hardware, not a hidden mutex.
- `fetch_add` returns the previous value — a ticket dispenser with no lock.
- One variable, one operation: atomic. A compound update or an invariant across variables: mutex.
- `compare_exchange_weak` in a loop turns any read-modify-write into an atomic one; on failure it refreshes `expected`.
- Keep the default `seq_cst` ordering unless you can justify a weaker one; `relaxed` is fine for counters read after the join.
- Touch shared atomics once per thread, not once per element — it avoids false sharing and is simply faster.
