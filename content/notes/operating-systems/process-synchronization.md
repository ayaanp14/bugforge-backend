---
title: Process Synchronization
order: 4
minutes: 14
level: intermediate
updated: 2026-10-05
seo-title: Process Synchronization in OS: Semaphores, Mutex
description: Race conditions, the critical section problem and its three requirements, Peterson's solution, test-and-set, mutex locks, semaphores and monitors in the OS.
question: What is process synchronization in an operating system?
answer: Process synchronization is coordinating processes or threads that share data so that the result does not depend on the order in which they happen to run. Its core is the critical section problem: allow only one process at a time into code that touches shared data, while guaranteeing progress and bounded waiting. Tools include Peterson's algorithm, atomic hardware instructions, mutex locks, semaphores and monitors.
q: What is a race condition?
a: A race condition is when several processes or threads access shared data concurrently, at least one of them writes, and the final result depends on the exact interleaving of their instructions. The classic example is two threads incrementing one counter: both read the old value, both add one, and one update is lost.
q: What are the three requirements of a critical section solution?
a: Mutual exclusion: at most one process is inside its critical section at a time. Progress: if none is inside and some want to enter, one of them is chosen without indefinite delay, and processes outside the protocol cannot block the choice. Bounded waiting: after a process asks to enter, other processes can enter only a limited number of times before it does.
q: What is the difference between a mutex and a semaphore?
a: A mutex is a lock with an owner: the thread that locks it must unlock it, and it lets exactly one thread in. A semaphore is a counter with wait and signal operations and no owner, so one thread can signal what another waits on. A counting semaphore admits up to n threads, which makes it suitable for counting resources and for signalling.
q: What is the difference between binary and counting semaphores?
a: A binary semaphore takes only the values 0 and 1 and is used like a lock for mutual exclusion. A counting semaphore can take any non-negative value and is initialized to the number of identical resources, such as three printers; each wait takes one resource and each signal returns one.
q: What is busy waiting?
a: Busy waiting, or spinning, is a process repeatedly testing a condition in a loop until it becomes true, using the CPU the whole time. It wastes CPU cycles, but for very short waits on a multiprocessor it can be cheaper than blocking, because it avoids two context switches. A lock that busy-waits is called a spinlock.
q: What is a monitor in OS?
a: A monitor is a high-level synchronization construct that bundles shared data with the procedures that use it and guarantees that only one process is active inside it at a time. Processes that must wait for a condition use condition variables with wait and signal. Java's synchronized methods with wait and notify follow the monitor model.
---

Processes and threads that share data are **cooperating**: a producer fills a buffer a consumer empties, two threads update one bank balance. Because the scheduler can interrupt either of them between any two machine instructions, their steps can interleave in ways the programmer never intended. **Process synchronization** is the set of rules and tools that make shared data come out right whatever the interleaving. Every tool below solves the same problem, the critical section problem, at a different level.

## Race conditions

`counter++` looks like one step, but the CPU runs it as three: load the value into a register, add one, store it back. Suppose `counter` is 5, thread T1 runs `counter++` and thread T2 runs `counter--` at the same time:

| Step | Thread | Instruction | Register | counter |
| --- | --- | --- | --- | --- |
| 1 | T1 | r1 = counter | r1 = 5 | 5 |
| 2 | T1 | r1 = r1 + 1 | r1 = 6 | 5 |
| 3 | T2 | r2 = counter | r2 = 5 | 5 |
| 4 | T2 | r2 = r2 − 1 | r2 = 4 | 5 |
| 5 | T1 | counter = r1 | | 6 |
| 6 | T2 | counter = r2 | | 4 |

The right answer is 5, but this interleaving gives 4, and swapping steps 5 and 6 gives 6. A **race condition** is exactly this: the outcome depends on the timing of concurrent accesses to shared data where at least one is a write. Races are hard to find because most interleavings give the right answer.

## The critical section problem

A **critical section** is the part of a program that accesses shared data. Each process is structured as:

```text
while (true) {
    entry section        // ask permission to enter
        critical section // touch shared data
    exit section         // announce you have left
    remainder section    // everything else
}
```

A correct solution to the critical section problem must satisfy three requirements:

1. **Mutual exclusion.** If one process is in its critical section, no other process is in its own.
2. **Progress.** If no process is in its critical section and some want to enter, only processes that are not in their remainder section take part in choosing the next one, and the choice cannot be postponed forever.
3. **Bounded waiting.** Once a process has asked to enter, there is a limit on how many times others may enter before it does. This rules out starvation.

No assumption may be made about the relative speed of the processes, only that each makes progress when it runs.

A tempting broken attempt uses one shared `turn` variable: process i enters only when `turn == i` and sets `turn` to the other on exit. It gives mutual exclusion but violates **progress**: the processes must strictly alternate, so if P0 wants to enter twice while P1 is busy elsewhere, P0 waits for nothing.

## Peterson's solution

Peterson's algorithm solves the problem for two processes in software, with two shared variables: `flag[i]` says process i wants to enter, and `turn` says whose turn it is to give way.

```c
int flag[2] = {0, 0};        /* flag[i] == 1: process i wants to enter */
int turn;                    /* who must give way if both want to enter */

void enter(int i) {          /* i is 0 or 1 */
    int j = 1 - i;
    flag[i] = 1;             /* I want to enter */
    turn = j;                /* but you go first if you want to as well */
    while (flag[j] && turn == j)
        ;                    /* busy wait */
}

void leave(int i) {
    flag[i] = 0;             /* I am out */
}
```

Why it satisfies all three requirements:

- **Mutual exclusion.** Pi passes its loop only if `flag[j]` is 0 or `turn == i`. If both were inside, both flags would be 1, so `turn` would have to equal both 0 and 1 at once.
- **Progress.** If Pj does not want to enter, `flag[j]` is 0 and Pi enters at once. If both want to, `turn` holds one value, so exactly one of them gets in.
- **Bounded waiting.** When Pj leaves and tries to enter again, it sets `turn = i` itself, so Pi waits for at most one entry by Pj.

Peterson's solution is the textbook proof that the problem can be solved in software, but it is **not guaranteed to work on modern processors** as written. CPUs and compilers may reorder independent loads and stores, so Pi could read `flag[j]` before its own write to `flag[i]` is visible. Real code needs memory barriers or the atomic instructions below.

## Hardware support

**Disabling interrupts** around the critical section works on a single CPU, because nothing can preempt the running process. It fails on a multiprocessor, where another core keeps running, and it is far too dangerous to let user programs do.

Modern CPUs instead provide instructions that read and modify a memory word **atomically**, as one indivisible step.

**Test-and-set** sets a word to true and returns its old value:

```c
/* the hardware executes this as one atomic step */
bool test_and_set(bool *target) {
    bool old = *target;
    *target = true;
    return old;
}

bool lock = false;
void acquire(void) { while (test_and_set(&lock)) ; }   /* spin until it was false */
void release(void) { lock = false; }
```

**Compare-and-swap (CAS)** writes a new value only if the word still holds the expected one, and returns what it held:

```c
/* the hardware executes this as one atomic step */
int compare_and_swap(int *value, int expected, int new_value) {
    int old = *value;
    if (old == expected)
        *value = new_value;
    return old;
}

int lock = 0;
void acquire(void) { while (compare_and_swap(&lock, 0, 1) != 0) ; }
void release(void) { lock = 0; }
```

Both locks give mutual exclusion and progress but not bounded waiting: an unlucky process can keep losing the race. A version with a `waiting[]` array, where the leaving process hands the lock to the next waiter in cyclic order, adds bounded waiting. CAS is also the basis of **atomic variables** (`std::atomic`, Java's `AtomicInteger`) and lock-free data structures.

## Mutex locks

A **mutex** (mutual exclusion lock) wraps all this in two calls: `acquire()` before the critical section and `release()` after it. Only the thread that acquired a mutex may release it.

A mutex that waits by looping is a **spinlock**. One that waits by putting the thread to sleep until the lock is released is a **blocking** (sleeping) mutex. Spinning wastes CPU but avoids two context switches, so kernels use spinlocks for critical sections only a few instructions long on multiprocessors, and sleeping locks for anything that might take longer.

## Semaphores

A **semaphore** S, introduced by Dijkstra, is an integer accessed only through two atomic operations: **wait** (P, from the Dutch *proberen*, to test) and **signal** (V, *verhogen*, to increment). The simplest definition busy-waits:

```text
wait(S):   while (S <= 0) ;  // busy wait
           S--
signal(S): S++
```

Real implementations block instead, keeping a queue of waiting processes. The value may then go negative, and its magnitude is the number of processes waiting:

```text
wait(S):   S.value--
           if (S.value < 0) { add this process to S.queue; block() }
signal(S): S.value++
           if (S.value <= 0) { remove a process P from S.queue; wakeup(P) }
```

There are two kinds:

- A **binary semaphore** takes only 0 and 1 and is used like a lock: initialize it to 1, `wait` before the critical section and `signal` after it.
- A **counting semaphore** is initialized to the number of identical resources.

Worked trace: a counting semaphore for two printers starts at 2, and processes A, B, C and D each call `wait`, then A and B finish and call `signal`.

| Event | S.value | Queue | Effect |
| --- | --- | --- | --- |
| Start | 2 | empty | Two printers free |
| A: wait | 1 | empty | A gets a printer |
| B: wait | 0 | empty | B gets a printer |
| C: wait | −1 | C | C blocks |
| D: wait | −2 | C, D | D blocks |
| A: signal | −1 | D | C wakes and takes A's printer |
| B: signal | 0 | empty | D wakes and takes B's printer |

Semaphores also impose **ordering**. To make statement S2 in P2 run only after S1 in P1, share a semaphore `synch` initialized to 0: P1 runs S1 then `signal(synch)`; P2 runs `wait(synch)` then S2.

Semaphores are powerful but easy to misuse. Swapping `wait` and `signal` breaks mutual exclusion, writing `wait` twice deadlocks, and forgetting one breaks everything. Two processes doing `wait(S); wait(Q)` and `wait(Q); wait(S)` can **deadlock**, each holding one semaphore and waiting for the other.

## Monitors

A **monitor** is a language construct that groups shared data with the procedures that operate on it, and guarantees that **only one process is active inside the monitor at a time**. The compiler inserts the locking, so the programmer cannot forget it.

For waiting on a condition, a monitor has **condition variables**. `x.wait()` suspends the caller and releases the monitor; `x.signal()` resumes one process waiting on x, and **does nothing if none is waiting**. That is the key difference from a semaphore's `signal`, which is remembered in the count.

```text
monitor Account {
    int balance = 0
    condition funds

    procedure deposit(amount) {
        balance = balance + amount
        funds.signal()
    }
    procedure withdraw(amount) {
        while (balance < amount)
            funds.wait()         // releases the monitor while waiting
        balance = balance - amount
    }
}
```

After `signal`, either the signaller waits and the woken process runs at once (Hoare semantics, *signal-and-wait*) or the signaller continues and the woken process runs later (Mesa semantics, *signal-and-continue*). Most real systems, including Java and pthreads, use Mesa semantics, which is why the condition is rechecked in a `while` loop rather than an `if`. In Java, every object is a monitor: `synchronized` methods give the mutual exclusion, and `wait()`, `notify()` and `notifyAll()` act as one condition variable.

## Busy waiting vs blocking

| Aspect | Busy waiting (spinning) | Blocking (sleeping) |
| --- | --- | --- |
| CPU while waiting | Used, looping | Given to other processes |
| Cost of waking | None, notices at once | Two context switches |
| Best for | Very short waits on a multiprocessor | Long or unknown waits |
| On a single CPU | Wasteful: the holder cannot run until the spinner is preempted | Fine |
| Example | Spinlock, Peterson's loop | Blocking semaphore, sleeping mutex |

## Mutex vs semaphore

| Aspect | Mutex | Semaphore |
| --- | --- | --- |
| What it is | A lock: locked or unlocked | An integer counter |
| Ownership | Only the locking thread may unlock | No owner: any thread may signal |
| Threads allowed in | One | Up to the initial count |
| Main use | Mutual exclusion | Counting resources, signalling, ordering |
| Signal with nobody waiting | Not applicable | Remembered: the count goes up |

A related trap is **priority inversion**: a low-priority process holds a lock a high-priority process needs, and a medium-priority process preempts the low one, so the high-priority process waits on the medium one. The fix is **priority inheritance**: the lock holder temporarily runs at the priority of the highest process waiting for it. A priority inversion famously reset the Mars Pathfinder lander's computer in 1997 until engineers enabled priority inheritance remotely.

## Common mistakes

- Thinking `count++` is atomic because it is one line of code. It is a load, an add and a store.
- Listing the three requirements as "mutual exclusion, no deadlock, no starvation". The standard names are mutual exclusion, progress and bounded waiting.
- Saying a condition variable's `signal` works like a semaphore's. A condition signal with no waiter is lost; a semaphore signal is counted.
- Using `if` instead of `while` around a condition wait under Mesa semantics, so a woken thread acts on a condition that is no longer true.
- Claiming Peterson's algorithm works unchanged on modern multicore CPUs. Without memory barriers, reordering can break it.
- Treating a binary semaphore and a mutex as identical. The mutex has an owner; the semaphore does not.

## Interview questions

**What is the critical section problem?**
Designing a protocol so that when processes share data, at most one is executing code that accesses it at any time. A solution must give mutual exclusion, progress and bounded waiting, without assuming anything about relative process speeds.

**Explain Peterson's solution.**
Each of the two processes sets its own `flag` to say it wants to enter, then sets `turn` to the other process, and waits while the other wants to enter and it is the other's turn. Whoever wrote `turn` last waits, so exactly one enters, and each waits for at most one entry by the other.

**What does wait() do on a semaphore whose value is 0?**
In the blocking implementation the value becomes −1, the caller is added to the semaphore's queue and blocked. It stays blocked until another process calls `signal()`, which increments the value and wakes one waiting process.

**Why can disabling interrupts not be used for mutual exclusion on a multiprocessor?**
Disabling interrupts only stops preemption on the CPU that did it. Other cores continue to run and can enter the critical section, and disabling interrupts on every core is slow and unsafe.

**What is a spinlock, and when is it preferred?**
A lock whose waiters loop testing it instead of sleeping. It is preferred when critical sections are very short and the system has several cores, because spinning briefly costs less than two context switches.

**What is the difference between a monitor and a semaphore?**
A semaphore is a low-level counter the programmer must call correctly everywhere. A monitor is a language construct where mutual exclusion is automatic, with condition variables for waiting, which makes misuse much harder.

**What is priority inversion and how is it solved?**
A high-priority process waits for a lock held by a low-priority process, which in turn is preempted by medium-priority work, so the high-priority process is effectively delayed by lower ones. Priority inheritance raises the lock holder to the waiter's priority until it releases the lock.

Next, read [Classic Synchronization Problems](/notes/operating-systems/classic-synchronization-problems), or test yourself with the [Operating Systems (Intermediate) skill test](/skill-tests/os-intermediate).
