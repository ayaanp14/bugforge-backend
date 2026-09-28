---
title: Checkpoint — Concurrency
minutes: 25
seo-title: C++ Concurrency Quiz: Threads, Mutexes and Atomics Practice
description: Test your C++ concurrency with 14 questions and three programs on threads, data races, mutexes, atomics, condition variables, futures and std::async.
q: Why is `++counter` from two threads undefined behaviour?
a: `++counter` is a load, an add and a store, and two threads doing it without synchronisation is a data race: one location, at least one write, nothing ordering the accesses. The standard makes that undefined behaviour, so the compiler may assume it never happens — lost increments are only the visible symptom.
q: What does `std::future::get()` do with an exception thrown in the task?
a: It rethrows it. The library catches the exception in the task, stores it in the future's shared state, and `get()` throws it on the calling thread with its dynamic type intact, so an ordinary `try`/`catch` around `get()` handles errors from another thread.
q: Why print only after every thread has been joined?
a: Output written from worker threads interleaves in an order the scheduler decides, so it differs from run to run. Joining every thread first also guarantees the main thread sees everything the workers wrote; it can then print aggregates in a fixed index order that is identical on every run.
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
