---
title: Checkpoint — Concurrency
minutes: 25
---
This checkpoint covers the whole module: starting and joining threads, data races and the RAII locks, atomics and compare-exchange, condition variables and the bounded queue, futures, promises and `std::async`, and the patterns — a thread pool, split-and-reduce, message passing — that keep concurrent programs correct and their output deterministic.

**How it works.** Fourteen questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- What happens when a joinable `std::thread` is destroyed, and how does `std::jthread` differ?
- Why is an unsynchronised `++counter` from two threads undefined behaviour rather than merely inaccurate?
- When does an atomic replace a mutex, and when does it not?
- What does `compare_exchange_weak` do to `expected` when it fails, and why must it sit in a loop?
- Why must `cv.wait` be given a predicate, and what is a lost wake-up?
- What does `std::future::get()` do with an exception thrown in the task?
- Why does a judged program print only after every thread has been joined?

The three programs are a prime census that splits a range across threads and counts with an atomic, a batch of divisions run through `std::async` where some throw, and a two-stage pipeline of bounded queues whose prefix sums must come out in order. Join everything before you print.
