---
skill: os
level: basic
---

## os-basic-028
topic: synchronization
answer: B, C

A shared variable `count` starts at 0. Two threads each run `count = count + 1;` once, with no lock. Each increment is three separate steps: load `count` into a register, add 1 to the register, store the register back. Which final values of `count` are possible? Select all that apply.

- A: `0`
- B: `1`
- C: `2`
- D: `3`

> If one thread's three steps all happen before the other thread loads, the result is 2. If both threads load 0 before either stores, both store 1 and one increment is lost, leaving 1. A result that depends on how the threads interleave is a race condition. 0 is impossible, because whichever store comes last writes a loaded value (at least 0) plus 1; 3 would need a third increment.

## os-basic-029
topic: synchronization
answer: B

A correct solution to the critical-section problem must satisfy three requirements. Which three?

- A: Mutual exclusion, hold and wait, circular wait
- B: Mutual exclusion, progress, bounded waiting
- C: Atomicity, consistency, isolation
- D: Progress, no preemption, bounded waiting

> Mutual exclusion: at most one process is in its critical section at a time. Progress: if no process is inside and some want to enter, only those trying to enter take part in deciding who goes next, and the decision cannot be put off indefinitely. Bounded waiting: once a process has asked to enter, other processes can enter only a bounded number of times before it does. Hold and wait, circular wait and no preemption are conditions for deadlock; atomicity, consistency and isolation are properties of database transactions.

## os-basic-030
topic: synchronization
answer: C

Two threads, numbered i = 0 and i = 1 (with j = 1 − i), protect a critical section using a shared variable `turn` that starts at 0. Each thread runs:

```c
while (turn != i) { }   /* wait for my turn */
/* critical section */
turn = j;               /* give the turn to the other thread */
/* remainder section */
```

Thread 0 leaves its critical section and immediately wants to enter again, while thread 1 is in its remainder section and will not try to enter for a long time. Which requirement does this scheme violate?

- A: Mutual exclusion
- B: Bounded waiting
- C: Progress

> Mutual exclusion holds: a thread enters only when turn equals its own number, and turn has one value at a time. Progress fails: the critical section is free, yet thread 0 cannot enter, because turn is 1 and only thread 1, which is not even trying to enter, will ever set it back. Strict alternation lets a thread outside the critical section block one that wants in. Bounded waiting is not what breaks: no other thread is entering ahead of thread 0 at all.

## os-basic-031
topic: synchronization
answer: A

What is the essential difference between a mutex and a binary semaphore?

- A: A mutex has an owner, and only it should unlock it; any thread may signal a semaphore.
- B: A mutex can count up to any value, while a binary semaphore can only ever hold the values 0 or 1.
- C: A semaphore never puts a waiting thread to sleep, so a thread waiting on one can only busy-wait.
- D: A mutex can only be shared between processes, while a semaphore can only be shared between threads.

> A mutex is a lock: the thread that acquires it owns it and is the one that releases it, which is what lets implementations detect misuse and apply priority inheritance. A semaphore is a counter with no owner: one thread can wait on it and another signal it, which is why semaphores are used for signalling between threads ("the data is ready"). Neither counts the other way round, both can block a waiting thread, and both exist for threads and for processes.

## os-basic-032
topic: synchronization
answer: B

A counting semaphore `S` starts at 3. Five processes call `wait(S)` one after another, and none of them has called `signal(S)` yet. Then one of the processes that got through calls `signal(S)`. How many processes are blocked on `S` now?

- A: 0
- B: 1
- C: 2
- D: 3

> The first three wait() calls find S positive and take it down to 0; the fourth and fifth find it at 0 and block, so two are blocked. A signal() while processes are waiting wakes one of them (in the textbook implementation the value goes from -2 to -1), so one process is still blocked.

## os-basic-033
topic: synchronization
answer: D

A counting semaphore starts at 7. In some order, processes perform 5 `wait()` (P) operations and 3 `signal()` (V) operations on it, and every operation completes. What is the semaphore's final value?

- A: 9
- B: 2
- C: 15
- D: 5

> Each completed wait() decrements the value and each signal() increments it, so the final value is 7 - 5 + 3 = 5. Because the value starts at 7 and there are only five waits, no wait() ever finds it at 0, whatever the order, so no process blocks along the way. 9 swaps the meanings of P and V, and 2 ignores the signals.

## os-basic-034
topic: synchronization
answer: C

A spinlock makes a waiting thread loop, testing the lock until it is free, instead of putting the thread to sleep. When is a spinlock the sensible choice?

- A: On a single-CPU machine, since the waiter spins only until the holder releases the lock
- B: When the critical section reads from disk, since such a wait is too long to justify sleeping
- C: On a multiprocessor, when the lock is held only for less time than a context switch takes
- D: When the holder may sleep inside the critical section, since spinning avoids a missed wakeup

> Sleeping costs two context switches; spinning costs the CPU time spent looping. On a multiprocessor the holder runs on another CPU and releases a briefly held lock quickly, so spinning is cheaper. On a single CPU the holder cannot run while the waiter spins, so the spinner wastes its whole time slice (A). Long waits, such as disk I/O or a holder that sleeps, make a spinner burn CPU time for nothing (B, D).

## os-basic-035
topic: synchronization
answer: A

This lock is meant to give two threads mutual exclusion. `locked` is shared and starts at 0, and every read and write of it goes to memory.

```c
void acquire(void) {
    while (locked) { }   /* wait while the lock is held */
    locked = 1;
}

void release(void) {
    locked = 0;
}
```

Why does it not guarantee mutual exclusion?

- A: Both threads can see `locked` as 0 before either one sets it to 1, so both enter.
- B: The empty loop busy-waits, so it burns CPU time for as long as the lock is held.
- C: A thread can be preempted inside its critical section while it holds the lock.
- D: On a single CPU the waiting loop never ends, since the holder can never run again.

> Testing locked and setting it are two separate steps. Thread 1 can read 0 and leave the loop, then be preempted (or simply be overtaken by another CPU) before it stores 1; thread 2 also reads 0 and leaves the loop, and both are in the critical section. The fix is an atomic instruction such as test-and-set or compare-and-swap, which tests and sets in one indivisible step. Busy-waiting is a cost, not a correctness bug; being preempted while holding a lock is allowed; and on one CPU the holder runs again when the spinner's time slice ends.

## os-basic-036
topic: synchronization
answer: B, C, D

`balance` is shared and starts at 100. Thread 1 runs the code below once with `amount = 80`, and thread 2 runs it once with `amount = 50`, with no lock. The numbered steps of the two threads can interleave in any order.

```c
if (balance >= amount) {        /* step 1: read balance and compare */
    int tmp = balance;          /* step 2: read balance again */
    balance = tmp - amount;     /* step 3: write the new balance */
}
```

Which final values of `balance` are possible? Select all that apply.

- A: `100`
- B: `50`
- C: `20`
- D: `-30`

> Run one after the other, the first withdrawal succeeds and the second fails its check: 20 if thread 1 goes first, 50 if thread 2 does. If both pass the check before either writes, both withdrawals happen: when one thread's step 2 reads the other's result, the balance ends at 100 - 80 - 50 = -30; when both read 100 in step 2, the later write wins and one withdrawal is lost, leaving 20 or 50. 100 is impossible: the first check to run sees 100, which covers either amount, so at least one write happens. The check and the update belong in one critical section.

## os-basic-037
topic: deadlocks
answer: D

Which four conditions must all hold at the same time for a deadlock to occur?

- A: Mutual exclusion, progress, bounded waiting, circular wait
- B: Hold and wait, starvation, preemption, circular wait
- C: Mutual exclusion, hold and wait, preemption, starvation
- D: Mutual exclusion, hold and wait, no preemption, circular wait

> These are Coffman's conditions. Mutual exclusion: a resource is held by one process at a time. Hold and wait: a process holds some resources while waiting for others. No preemption: a resource is released only voluntarily by its holder. Circular wait: a cycle of processes, each waiting for a resource held by the next. A deadlock needs all four, which is why removing any one prevents it. Progress and bounded waiting are critical-section requirements, starvation is a different problem, and allowing preemption breaks deadlocks rather than causing them.

## os-basic-038
topic: deadlocks
answer: B

To prevent deadlock, a system makes every process request all the resources it will ever need at once, before it starts, and grants them all together or none at all. Which deadlock condition does this remove?

- A: Mutual exclusion
- B: Hold and wait
- C: No preemption
- D: Circular wait

> A process that is given everything up front never holds some resources while waiting for more, so hold and wait cannot occur. The price is poor utilisation, since resources sit allocated long before they are used, and possible starvation of a process that needs several popular resources at once.

## os-basic-039
topic: deadlocks
answer: C

Two threads each need mutexes A and B:

```c
/* thread 1 */            /* thread 2 */
lock(A);                  lock(B);
lock(B);                  lock(A);
/* ... work ... */        /* ... work ... */
unlock(B);                unlock(A);
unlock(A);                unlock(B);
```

Which single change makes a deadlock between them impossible?

- A: Add a short sleep in thread 1 between `lock(A)` and `lock(B)`.
- B: Give thread 1 a higher scheduling priority than thread 2.
- C: Make thread 2 lock A before B, in the same order as thread 1.
- D: Make thread 2 unlock B before A, in the same order as thread 1.

> The deadlock is thread 1 holding A and waiting for B while thread 2 holds B and waits for A: a circular wait. If both threads lock in the same order, A then B, a thread can hold B only after it already holds A, so no thread can ever hold B while waiting for A, and the cycle cannot form. Unlocking never blocks, so the release order does not matter; a sleep makes the bad interleaving more likely; and a priority does not stop each thread from taking its first lock.

## os-basic-040
topic: deadlocks
answer: A, B, C

Each resource has exactly one instance, and no process releases a resource until it finishes. The current state is:

| Process | Holds | Waiting for |
| --- | --- | --- |
| P1 | R1 | R2 |
| P2 | R2 | R1 |
| P3 | R3 | R1 |
| P4 | R4 | nothing |

Which processes can never finish unless the operating system intervenes? Select all that apply.

- A: P1
- B: P2
- C: P3
- D: P4

> P1 waits for R2, held by P2, which waits for R1, held by P1: a cycle over single-instance resources, so P1 and P2 are deadlocked. P3 waits for R1, which P1 will never release, so P3 is stuck as well even though it is not on the cycle. P4 waits for nothing, so it runs to completion and releases R4, which nobody needs.

## os-basic-041
topic: deadlocks
answer: A

A resource-allocation graph contains a cycle. When does that cycle guarantee that the processes on it are deadlocked?

- A: When every resource type on the cycle has exactly one instance
- B: Always, since a cycle in the graph is what a deadlock means
- C: Only when the cycle passes through three or more processes
- D: Only when every process in the system lies on the cycle

> With one instance per resource, each process on the cycle waits for the single instance held by the next one, so none of them can proceed: a deadlock. With several instances a cycle is necessary but not sufficient, because another instance may be held by a process off the cycle that can finish and release it, breaking the cycle. Two processes are enough for a deadlock, and processes elsewhere in the system make no difference.

## os-basic-042
topic: deadlocks
answer: D

Three processes share a pool of identical tape drives. Each process acquires drives one at a time, needs at most 3 at once, and releases them only when it finishes. What is the smallest number of drives for which deadlock is impossible?

- A: 6
- B: 8
- C: 9
- D: 7

> The worst case is every process holding one drive fewer than it needs: 3 × 2 = 6 drives, with all three waiting and none able to finish, so 6 drives can deadlock. With 7, when all three hold 2 there is still one free drive, so some process gets its third, finishes and frees all three. In general, n processes that each need k drives need n(k - 1) + 1. 9, every process's maximum at once, is enough but not the smallest.

## os-basic-043
topic: deadlocks
answer: C

How does starvation differ from deadlock?

- A: Starvation is a cycle of processes waiting on each other; deadlock is one process waiting for a slow device.
- B: Starvation can only happen with semaphores, while deadlock can only happen with mutexes.
- C: A starving process waits indefinitely while others progress; deadlocked processes all wait on each other.
- D: Starvation ends when the time slice expires, while deadlock ends when the busy device frees up.

> In starvation the system as a whole keeps working, but one process is passed over indefinitely, such as a low-priority process under priority scheduling or a long job under SJF. In a deadlock every process in a set waits for something only another member of the set can release, so none of them progresses, and it lasts until the OS intervenes. A swaps the two definitions; neither problem depends on the kind of lock, and neither ends by itself.

## os-basic-044
topic: deadlocks
answer: B

An operating system lets processes request resources freely. Every few seconds it searches the wait-for graph for a cycle, and when it finds one it terminates a process on the cycle. Which deadlock-handling strategy is this?

- A: Deadlock prevention
- B: Deadlock detection and recovery
- C: Deadlock avoidance
- D: Ignoring deadlock (the ostrich approach)

> The system does not stop deadlocks from forming; it finds them afterwards, as a cycle in the wait-for graph, and recovers by terminating a process or preempting resources. Prevention removes one of the four necessary conditions by design. Avoidance examines each request in advance and refuses any that could lead to an unsafe state. Ignoring deadlock means doing none of these.

## os-basic-045
topic: deadlocks
answer: A

One way to prevent deadlock is to allow preemption: take a resource away from a process and give it back later. For which of these resources is that practical?

- A: A frame of main memory, whose page can be written to disk and read back later
- B: A printer halfway through a print job, handed to another job straight away
- C: A mutex protecting a half-updated linked list, taken away from its holder
- D: A tape drive in the middle of writing a file, lent to another process for a while

> Preemption works for a resource whose state can be saved and restored: a page can be written out to disk and brought back later, just as the CPU itself is taken from a process at every time slice. Taking a printer mid-job mixes two jobs' pages together, taking a mutex mid-update exposes a half-changed list, and taking a tape drive mid-write corrupts the file, so those resources cannot be preempted safely.

## os-basic-046
topic: memory-management
answer: D

A system uses 16-bit logical addresses and 1 KB (1,024-byte) pages. What are the page number and offset of logical address `0x1A3C`, in decimal?

- A: Page 26, offset 60
- B: Page 104, offset 60
- C: Page 1, offset 2620
- D: Page 6, offset 572

> 1,024 is 2 to the power 10, so the low 10 bits are the offset and the high 6 bits the page number. 0x1A3C is 0001 1010 0011 1100 in binary: the top six bits 000110 are 6, and the low ten bits 10 0011 1100 are 0x23C = 572. Check: 6 × 1024 + 572 = 6716 = 0x1A3C. A splits at the byte, as for 256-byte pages; B swaps the 6 and 10 bit fields; C uses 4 KB pages.

## os-basic-047
topic: memory-management
answer: C

Pages are 1,024 bytes, and a process's page table is:

| Page | Frame |
| --- | --- |
| 0 | 4 |
| 1 | 5 |
| 2 | 7 |
| 3 | 0 |

Which physical address does logical address 2,100 translate to?

- A: 7,100
- B: 9,268
- C: 7,220
- D: 7,168

> The page number is 2100 div 1024 = 2 and the offset is 2100 - 2048 = 52. Page 2 is in frame 7, which starts at 7 × 1024 = 7168, so the physical address is 7168 + 52 = 7220; the offset is carried over unchanged. 7,100 treats a page as 1,000 bytes, 9,268 adds the whole logical address instead of the offset, and 7,168 leaves the offset out.

## os-basic-048
topic: memory-management
answer: A

A system has 32-bit logical addresses, 4 KB pages and 4-byte page-table entries. How large is one process's page table if it is a single flat table with an entry for every page?

- A: 4 MB
- B: 1 MB
- C: 16 KB
- D: 4 GB

> 4 KB is 2 to the power 12, so 12 bits of the address are the offset and the other 20 are the page number: 2^20 pages, one entry each. 2^20 entries × 4 bytes = 4 MB. 1 MB counts entries instead of bytes, 16 KB uses 2^12 entries (the offset bits), and 4 GB is the whole address space. A table this large for every process is why real systems split page tables into levels.

## os-basic-049
topic: memory-management
answer: B

Pages are 4 KB. A process needs 13 KB of memory. How much memory is lost to internal fragmentation when the process is paged?

- A: 1 KB
- B: 3 KB
- C: 4 KB
- D: 0 KB

> 13 KB needs 4 pages (13 / 4 rounded up), which occupy 16 KB of frames. The last page holds only 1 KB of the process, so the other 3 KB of its frame is allocated but unused: internal fragmentation, which paging cannot avoid. 1 KB is the used part of the last page, not the wasted part.

## os-basic-050
topic: memory-management
answer: D

Which statement about fragmentation is correct?

- A: Paging removes internal fragmentation, but free frames scattered through memory cause external fragmentation.
- B: Paging removes both kinds, because every page fits exactly into any free frame.
- C: Variable-size partitions cause internal fragmentation, while paging causes external fragmentation.
- D: Paging removes external fragmentation, but a process's last page can be partly unused.

> Any free frame can hold any page, so scattered free frames are all usable and there is no external fragmentation. But a process rarely fills a whole number of pages, and the unused part of its last page is internal fragmentation. Variable-size partitions are the other way round: each process gets exactly the size it asks for, so there is no internal fragmentation, but the holes left between processes cause external fragmentation.

## os-basic-051
topic: memory-management
answer: C

Free memory consists of holes of 400, 250, 550, 650 and 200 KB, in that address order. Requests for 150, 300, 560 and 420 KB arrive in that order and are placed one at a time; a hole that is used shrinks by the size placed in it. Which statement is true?

- A: Only first fit places all four requests.
- B: Only worst fit places all four requests.
- C: Only best fit places all four requests.
- D: First fit and best fit both place all four requests.

> First fit: 150 goes into 400 (250 left), 300 into 550 (250 left), 560 into 650 (90 left); the holes are now 250, 250, 250, 90 and 200, so 420 must wait. Best fit: 150 into 200, 300 into 400, 560 into 650, 420 into 550, so all four are placed. Worst fit: 150 into 650 (500 left), 300 into 550 (250 left); the largest hole is now 500, so 560 must wait.

## os-basic-052
topic: memory-management
answer: A

With contiguous allocation, free memory totals 500 KB, split into three separate holes of 150, 200 and 150 KB. A request for 300 KB cannot be satisfied. What is the problem, and what fixes it?

- A: External fragmentation, fixed by compaction: moving processes so the free space forms one block
- B: Internal fragmentation, fixed by using smaller partitions so that less space is wasted in each
- C: External fragmentation, fixed by switching to best fit so that the holes are used more tightly
- D: Thrashing, fixed by giving the process more frames so that it stops faulting so often

> Enough memory is free, but not in one contiguous piece: that is external fragmentation. Compaction relocates processes so the holes merge into one 500 KB block (it needs addresses that can be relocated at run time, such as base registers). Best fit only chooses among the existing holes, and none is 300 KB, so it cannot help. Internal fragmentation is waste inside an allocated block, and thrashing is a paging problem.

## os-basic-053
topic: memory-management
answer: B

While a process runs, what translates each logical address it uses into a physical address?

- A: The compiler, when it produces the executable file
- B: The memory-management unit (MMU), in hardware, on every access
- C: The kernel, in software, on every memory access the process makes
- D: The linker, when it joins the object files into one program

> Translation happens on every memory access, so it has to be done in hardware by the MMU, using the page table (or base and limit registers) that the OS set up for the running process. The kernel steps in only when the MMU cannot translate an address, on a page fault or a protection error. The compiler and linker produce logical addresses; they cannot know where in physical memory the process will be placed.

## os-basic-054
topic: memory-management
answer: D

A process is loaded with relocation (base) register 14000 and limit register 3000, so its legal logical addresses are 0 to 2999. What happens to logical addresses 2500 and 3200?

- A: 2500 maps to 16500, and 3200 maps to 17200.
- B: 2500 maps to 11500, and 3200 causes a trap.
- C: Both cause a trap, since each relocated address exceeds the limit.
- D: 2500 maps to 16500, and 3200 causes a trap.

> The hardware first compares the logical address with the limit: 2500 is less than 3000, so it passes and is relocated to 14000 + 2500 = 16500. 3200 is not less than 3000, so the hardware traps to the OS with an addressing error before memory is touched. The limit is checked against the logical address, not the relocated one; A skips the check, and B subtracts the base instead of adding it.
