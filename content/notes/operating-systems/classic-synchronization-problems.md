---
title: Classic Synchronization Problems
order: 5
minutes: 10
level: intermediate
updated: 2026-10-05
seo-title: Producer-Consumer, Readers-Writers, Dining Philosophers
description: Classic OS synchronization problems with semaphores: bounded-buffer producer-consumer, readers-writers starvation, dining philosophers without deadlock.
question: What are the classic problems of synchronization in operating systems?
answer: The three classic synchronization problems are the bounded-buffer (producer-consumer) problem, the readers-writers problem and the dining philosophers problem. Each models a real pattern: passing items through a fixed-size buffer, letting many readers but only one writer at a time use shared data, and processes that each need several shared resources at once. They are used to test any new synchronization tool, usually semaphores or monitors.
q: How is the producer-consumer problem solved using semaphores?
a: Use three semaphores: mutex initialized to 1 to protect the buffer, empty initialized to the buffer size to count free slots, and full initialized to 0 to count filled slots. The producer waits on empty then mutex, inserts, and signals mutex then full. The consumer waits on full then mutex, removes, and signals mutex then empty.
q: Why does the order of wait operations matter in the bounded buffer problem?
a: If the producer calls wait(mutex) before wait(empty) when the buffer is full, it blocks on empty while holding mutex. The consumer then blocks on mutex and can never remove an item to free a slot, so both wait forever. Always wait on the counting semaphore first and the mutex second.
q: What is the readers-writers problem?
a: Several processes share data; readers only read it and writers modify it. Any number of readers may read at the same time, but a writer needs exclusive access, with no other writer or reader present. The problem is to enforce this while keeping either readers or writers from waiting forever.
q: How can deadlock be avoided in the dining philosophers problem?
a: Break one of the deadlock conditions. Allow at most four philosophers to try to eat at once, make each philosopher pick up the lower-numbered chopstick first so no cycle can form, or let a philosopher pick up chopsticks only when both are free, checked inside a critical section or monitor.
q: Does the first readers-writers solution cause starvation?
a: Yes. It gives readers preference: a writer can enter only when no reader is active, so a steady stream of overlapping readers keeps the read count above zero and the writer waits indefinitely. The second variant prefers writers and can starve readers instead; a fair variant serves readers and writers in arrival order.
---

Every new synchronization tool is tested on the same few problems. They are not puzzles for their own sake: each is a small model of something operating systems and servers do all the time, and each has a classic trap. Interviewers ask you to write the semaphore solution and then explain what goes wrong if one line moves. The tools used here, semaphores and monitors, are explained in [Process Synchronization](/notes/operating-systems/process-synchronization).

## The producer-consumer (bounded-buffer) problem

A **producer** creates items and puts them into a buffer of n slots; a **consumer** takes them out. The producer must wait when the buffer is full, the consumer must wait when it is empty, and the two must never modify the buffer at the same time. Pipes between processes, print queues and work queues all have this shape.

The solution uses three semaphores:

| Semaphore | Initial value | Meaning |
| --- | --- | --- |
| mutex | 1 | Only one process touches the buffer at a time |
| empty | n | Number of free slots |
| full | 0 | Number of filled slots |

```text
producer:
while (true) {
    item = produce()
    wait(empty)        // wait for a free slot
    wait(mutex)
    insert(item)
    signal(mutex)
    signal(full)       // one more filled slot
}

consumer:
while (true) {
    wait(full)         // wait for a filled slot
    wait(mutex)
    item = remove()
    signal(mutex)
    signal(empty)      // one more free slot
    consume(item)
}
```

`empty` and `full` do the counting and make processes wait; `mutex` only protects the buffer's internal pointers. At any moment empty + full equals n, except while a process is between its two operations.

A short trace with n = 2, where the producer makes three items before the consumer runs:

| Step | Action | empty | full | Buffer |
| --- | --- | --- | --- | --- |
| 0 | Start | 2 | 0 | empty |
| 1 | Producer inserts A | 1 | 1 | A |
| 2 | Producer inserts B | 0 | 2 | A B |
| 3 | Producer calls wait(empty) for C and blocks | 0 | 2 | A B |
| 4 | Consumer removes A; its signal(empty) wakes the producer | 0 | 1 | B |
| 5 | Producer inserts C and signals full | 0 | 2 | B C |

In step 4 the freed slot is handed straight to the blocked producer, so `empty` is back at 0. The table shows the busy-wait view of the counters; in the blocking implementation `empty` would read −1 at step 3, meaning one process is waiting.

**The trap: the order of the waits.** Suppose the producer called `wait(mutex)` before `wait(empty)`. With a full buffer it would take the mutex and then block on `empty`. The consumer would then block on `wait(mutex)` and could never free a slot. Both wait forever: a **deadlock**. Always wait on the counting semaphore first. The order of the two `signal` calls, by contrast, does not affect correctness.

## The readers-writers problem

Shared data, such as a database table or a configuration file, is read by many processes and occasionally updated. Any number of **readers** may read at once, because reading changes nothing, but a **writer** needs exclusive access: no other writer and no reader.

### First variant: readers have priority

No reader waits unless a writer already has the data.

```text
semaphore rw_mutex = 1   // held by one writer, or by the readers as a group
semaphore mutex = 1      // protects read_count
int read_count = 0

writer:
    wait(rw_mutex)
    ... write ...
    signal(rw_mutex)

reader:
    wait(mutex)
    read_count++
    if (read_count == 1) wait(rw_mutex)    // first reader locks writers out
    signal(mutex)
    ... read ...
    wait(mutex)
    read_count--
    if (read_count == 0) signal(rw_mutex)  // last reader lets writers in
    signal(mutex)
```

Only the **first** reader competes with writers for `rw_mutex`; later readers just increment the count and walk in. `mutex` exists because `read_count++` is itself a race condition. If a writer is writing and several readers arrive, the first reader blocks on `rw_mutex` while holding `mutex`, and the others queue on `mutex`.

The cost is **writer starvation**: if readers keep arriving so that `read_count` never falls to 0, a writer waits forever.

### Second variant and the fair solution

The **second variant** gives writers priority: once a writer is waiting, no new reader may start. It needs extra counters and semaphores, and now readers can starve under a steady stream of writers.

A **fair** solution adds one semaphore, `queue`, initialized to 1, that every reader and writer must pass through first:

```text
writer:                         reader:
    wait(queue)                     wait(queue)
    wait(rw_mutex)                  wait(mutex)
    signal(queue)                   read_count++
    ... write ...                   if (read_count == 1) wait(rw_mutex)
    signal(rw_mutex)                signal(mutex)
                                    signal(queue)
                                    ... read ...
                                    (leave as in the first variant)
```

A writer waiting in `queue` stops new readers from slipping past it, so processes are served roughly in arrival order (exactly, if the semaphore's queue is first-in, first-out). Real systems offer this as a **reader-writer lock**, such as POSIX `pthread_rwlock_t` or Java's `ReentrantReadWriteLock`, whose fairness policy varies by implementation.

## The dining philosophers problem

Five philosophers sit at a round table with one bowl of rice each and five chopsticks, one between each pair of neighbours. A philosopher alternates between thinking and eating, and needs **both** neighbouring chopsticks to eat. It models processes that need several shared resources at once.

The obvious solution gives each chopstick a semaphore:

```text
semaphore chopstick[5] = {1, 1, 1, 1, 1}

philosopher i:
while (true) {
    think()
    wait(chopstick[i])              // left
    wait(chopstick[(i + 1) % 5])    // right
    eat()
    signal(chopstick[(i + 1) % 5])
    signal(chopstick[i])
}
```

No two neighbours can eat at once, but it can **deadlock**: if all five pick up their left chopstick at the same moment, each waits for its right one, held by its neighbour. Every philosopher holds one resource and waits for another in a circle, which is exactly the circular wait described in [Deadlocks in Operating Systems](/notes/operating-systems/deadlocks).

### Deadlock-free fixes

1. **At most four at the table.** A counting semaphore `seats` initialized to 4 is taken before the first chopstick. With four philosophers and five chopsticks, at least one of them can get both.
2. **Order the resources.** Each philosopher picks up the **lower-numbered** chopstick first. Philosophers 0 to 3 take their left first, but philosopher 4 needs chopsticks 4 and 0, so takes 0 first. No cycle of waiting can form. An equivalent rule: odd-numbered philosophers take left first, even-numbered take right first.
3. **Both or neither.** A philosopher picks up chopsticks only when both are free, with the check and the pick-up done inside a critical section, as in the monitor below.

```text
monitor DiningPhilosophers {
    enum { THINKING, HUNGRY, EATING } state[5]
    condition self[5]

    pickup(i):
        state[i] = HUNGRY
        test(i)
        if (state[i] != EATING) self[i].wait()

    putdown(i):
        state[i] = THINKING
        test((i + 4) % 5)        // the left neighbour may eat now
        test((i + 1) % 5)        // the right neighbour may eat now

    test(i):
        if (state[(i + 4) % 5] != EATING and state[i] == HUNGRY
            and state[(i + 1) % 5] != EATING) {
            state[i] = EATING
            self[i].signal()
        }
}
```

A philosopher eats only when neither neighbour is eating, so no one ever holds one chopstick while waiting for the other, and deadlock is impossible. **Starvation is still possible**: two neighbours who take turns eating can keep the philosopher between them hungry forever. Preventing that needs an extra rule, such as letting a philosopher who has waited too long go first.

## The three problems side by side

| Problem | What it models | Synchronization | The trap |
| --- | --- | --- | --- |
| Bounded buffer | Pipes, print and work queues | mutex, empty, full | Waiting on mutex before empty or full deadlocks |
| Readers-writers | Databases, caches, shared configuration | rw_mutex, mutex, read_count | Writers starve (first variant) or readers starve (second) |
| Dining philosophers | Processes needing several resources | One semaphore per resource | Everyone takes one and waits: deadlock |

The **sleeping barber** problem, a barber who sleeps when there are no customers and a waiting room with n chairs, is a fourth classic sometimes asked; it is the bounded buffer again, with customers as producers and the barber as the consumer.

## Common mistakes

- Swapping `wait(empty)` and `wait(mutex)` in the producer, or `wait(full)` and `wait(mutex)` in the consumer, which can deadlock.
- Using only a mutex for the bounded buffer: it prevents corruption but cannot make the producer wait for space.
- Forgetting that `read_count` needs its own mutex: incrementing it is a race condition like any other.
- Saying the first readers-writers solution is starvation-free. Writers can starve.
- Claiming the monitor solution for dining philosophers prevents starvation. It prevents deadlock only.
- Mixing up which side does what: the producer waits on `empty` and signals `full`; the consumer waits on `full` and signals `empty`.

## Interview questions

**Why does the bounded buffer need three semaphores and not one?**
The mutex only gives exclusive access to the buffer. The producer must also wait while the buffer is full and the consumer while it is empty, which needs counters of free and filled slots. `empty` and `full` are those counters, and blocking on them is how waiting happens.

**What happens if the consumer signals `full` instead of `empty` after removing an item?**
The count of filled slots goes up although one was emptied, so consumers will try to remove items that do not exist, and producers never learn a slot was freed. The buffer state and the semaphores drift apart and the program breaks.

**In the first readers-writers solution, why do only the first and last readers touch `rw_mutex`?**
Readers lock writers out as a group. The first reader to arrive acquires `rw_mutex` on behalf of all readers, and the last one to leave releases it; readers in between only update `read_count`.

**How would you avoid starvation of writers?**
Give writers priority once one is waiting, so new readers are held back, or serve all processes in arrival order with an extra `queue` semaphore that both readers and writers must pass first.

**Which deadlock condition does each dining-philosophers fix break?**
Ordering chopsticks breaks circular wait. Taking both or neither breaks hold-and-wait. Limiting the table to four keeps a cycle from closing, since one philosopher can always finish and release.

**Is the dining philosophers problem only about deadlock?**
No. A solution must also avoid starvation, and the simple deadlock-free solutions do not guarantee that. It also asks for concurrency: two non-neighbouring philosophers should be able to eat at the same time.

Next, read [Deadlocks in Operating Systems](/notes/operating-systems/deadlocks), or try the [Operating Systems (Intermediate) skill test](/skill-tests/os-intermediate).
