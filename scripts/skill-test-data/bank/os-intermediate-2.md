---
skill: os
level: intermediate
---

## os-intermediate-028
topic: deadlocks
answer: D

Banker's algorithm. Resource types A, B and C have 6, 5 and 4 instances in total.

| Process | Allocation (A B C) | Max (A B C) |
| --- | --- | --- |
| P0 | 1 1 0 | 4 3 2 |
| P1 | 2 0 1 | 3 1 2 |
| P2 | 1 2 1 | 5 2 3 |
| P3 | 0 1 1 | 2 2 2 |

Which of these is a safe sequence?

- A: P1, P0, P3, P2
- B: P3, P0, P1, P2
- C: P2, P1, P3, P0
- D: P1, P3, P0, P2

> Available = (6, 5, 4) − (4, 4, 3) = (2, 1, 1). Need = Max − Allocation: P0 (3, 2, 2), P1 (1, 1, 1), P2 (4, 0, 2), P3 (2, 1, 1). In D, P1 fits and frees its allocation, giving (4, 1, 2); P3 fits, giving (4, 2, 3); P0 fits, giving (5, 3, 3); P2 fits. A fails at P0, which needs 2 of B when 1 is free; B fails at P0, which needs 3 of A when work is (2, 2, 2); C fails at once, since P2 needs 4 of A.

## os-intermediate-029
topic: deadlocks
answer: C

Banker's algorithm. Resource types A and B have 5 and 4 instances in total.

| Process | Allocation (A B) | Max (A B) |
| --- | --- | --- |
| P0 | 1 1 | 3 2 |
| P1 | 2 0 | 3 1 |
| P2 | 1 2 | 2 4 |

Each request below arrives on its own, in this state. Which one is granted immediately?

- A: P0 requests (0, 1)
- B: P2 requests (1, 0)
- C: P1 requests (1, 0)
- D: P2 requests (0, 2)

> Available is (1, 1); Need is P0 (2, 1), P1 (1, 1), P2 (1, 2). Granting C leaves (0, 1) free and P1 needing (0, 1): P1 finishes and frees (3, 1), then P0 and P2 can finish, so the state is safe. A leaves (1, 0) free against needs (2, 0), (1, 1) and (1, 2), and B leaves (0, 1) against (2, 1), (1, 1) and (0, 2): no process can finish, so both states are unsafe and the requests wait. D asks for 2 of B when only 1 is free, so it must wait too.

## os-intermediate-030
topic: deadlocks
answer: B

One resource type with 14 units, managed by the banker's algorithm, which grants a request only if the state after it is safe.

| Process | Holds | Max |
| --- | --- | --- |
| P0 | 4 | 9 |
| P1 | 3 | 5 |
| P2 | 3 | 8 |
| P3 | 1 | 6 |

P0 asks for more units. What is the largest number the banker can grant it now?

- A: 0
- B: 1
- C: 2
- D: 3

> 11 units are held, so 3 are free; the remaining needs are 5, 2, 5 and 5. Grant P0 one unit and 2 are free: P1 (needing 2) can finish and free 5, then P0 (needing 4), P2 and P3 can finish in turn, so the state is safe. Grant 2 and only 1 is free, less than any process still needs, so the state is unsafe; granting all 3 is worse.

## os-intermediate-031
topic: deadlocks
answer: C

Deadlock detection. Resource types A, B and C have 2, 1 and 2 instances, and none is free.

| Process | Allocation (A B C) | Request (A B C) |
| --- | --- | --- |
| P0 | 1 0 0 | 0 1 0 |
| P1 | 0 1 0 | 2 0 0 |
| P2 | 0 0 1 | 0 0 1 |
| P3 | 1 0 1 | 0 0 0 |

Which processes are deadlocked?

- A: None; the system is not deadlocked
- B: P2 only
- C: P0 and P1
- D: P0, P1 and P2

> P3 requests nothing, so it can finish and free (1, 0, 1). P2's request for one C now fits; it finishes, leaving (1, 0, 2) free. P0 wants the only B, which P1 holds; P1 wants 2 of A, but only 1 is free and P0 holds the other. Neither can ever proceed. D counts P2 because nothing is free at the start; A assumes P1 is satisfied once P3 frees one A.

## os-intermediate-032
topic: deadlocks
answer: D

Every resource has a single instance. P1 holds R2 and requests R1. P2 holds R1 and requests R3. P3 holds R4 and requests R1. P4 holds R3 and requests R2. P5 holds R5 and requests nothing. Which processes can never finish?

- A: None, since P5 can finish and free R5
- B: P1, P2 and P4
- C: All five
- D: P1, P2, P3 and P4

> In the wait-for graph P1 waits for P2 (R1), P2 for P4 (R3) and P4 for P1 (R2): a cycle, so those three are deadlocked. P3 is not on the cycle, but it waits for R1, which P2 will never release, so it can never finish either; the detection algorithm leaves it unfinished too. P5 needs nothing, so it finishes and frees R5, which nobody is waiting for.

## os-intermediate-033
topic: deadlocks
answer: A, B, E

Which of these are deadlock prevention, making one of the four necessary conditions impossible without examining the state at each request? Select all that apply.

- A: Number all resource types and require every process to request them in increasing order
- B: Require a process to request all of its resources at once, before it starts
- C: Run the banker's algorithm on every request and grant only those that leave a safe state
- D: Periodically search the wait-for graph for cycles and abort one process in each cycle
- E: When a process holding resources is refused a new one, make it release everything it holds

> Ordering (A) breaks circular wait, B breaks hold-and-wait, and E breaks no-preemption, all by rule, whatever the current state. C is avoidance: it needs each process's maximum claim and checks the state on every request. D is detection and recovery: it lets deadlocks happen and then breaks them.

## os-intermediate-034
topic: deadlocks
answer: A

Three threads each take two locks, then release both:

```text
T1: lock(A); lock(B); ... unlock(B); unlock(A);
T2: lock(B); lock(C); ... unlock(C); unlock(B);
T3: lock(C); lock(A); ... unlock(A); unlock(C);
```

Can they deadlock?

- A: Yes, since each can hold its first lock while waiting for the next thread's
- B: No, since no two threads take the same two locks in opposite orders
- C: Only T1 and T3 can, since they are the only pair that share a lock
- D: No, since no thread ever holds more than two locks at once

> If T1 takes A, T2 takes B and T3 takes C, then T1 waits for B (held by T2), T2 waits for C (held by T3) and T3 waits for A (held by T1): a cycle of three, which checking pairs of threads misses. A global order fixes it, for example A before B before C, which means T3 must take A first. C is wrong as well: T1 and T2 share B, and T2 and T3 share C.

## os-intermediate-035
topic: deadlocks
answer: D

A system recovers from deadlock by rolling back one victim, always choosing the process that has used the least CPU time so far. One short job is chosen and restarted again and again. What is this, and what is the usual fix?

- A: Livelock; make every process request its resources in one fixed order
- B: Priority inversion; let the victim inherit the priority of the processes it blocks
- C: Thrashing; reduce the degree of multiprogramming until it stops
- D: Starvation; count the number of rollbacks in the cost used to choose a victim

> A cost-based choice of victim can pick the same process every time, so it never finishes while the others do: starvation. Adding how often a process has already been rolled back to the cost means it can be chosen only a bounded number of times. The other options name real problems with real fixes, but not this one.

## os-intermediate-036
topic: deadlocks
answer: B

Under the banker's algorithm, the system has reached an unsafe state. Which statement is true?

- A: At least one process is already deadlocked and cannot proceed
- B: Deadlock is possible but not certain; processes may release early
- C: Some process has asked for more resources than its declared maximum
- D: The OS must abort one process to get back to a safe state

> Unsafe means there is no order in which every process could be given its full declared maximum and finish, so the OS can no longer guarantee to avoid deadlock. Processes may never ask for their maximum, or may release resources early, so deadlock is possible, not certain. A request above the declared maximum is an error, not a state, and the banker avoids unsafe states rather than repairing them.

## os-intermediate-037
topic: memory-management
answer: C

A 48-bit virtual address space, 4 KiB pages and 8-byte page-table entries. Every page table, at every level, fits exactly in one page. How many levels of page table are needed?

- A: 2
- B: 3
- C: 4
- D: 5

> The page offset takes 12 bits, leaving 36 bits of page number. A 4 KiB table holds 4096 / 8 = 512 entries, so each level resolves 9 bits: 36 / 9 = 4 levels, as on x86-64. Three levels would need 12 bits per level, which forgets that each entry is 8 bytes; five levels is what x86-64 uses for 57-bit addresses.

## os-intermediate-038
topic: memory-management
answer: B

Physical memory is 64 GiB and pages are 8 KiB. Each page-table entry holds a frame number plus a valid bit, a dirty bit, a referenced bit and three protection bits (read, write, execute). What is the smallest number of bits an entry can have?

- A: 23
- B: 29
- C: 32
- D: 42

> 64 GiB / 8 KiB = 2³⁶ / 2¹³ = 2²³ frames, so the frame number needs 23 bits; the six flag bits make 29. 23 leaves out the flags; 42 stores a full 36-bit physical address instead of a frame number (the low 13 bits are the offset, which comes from the virtual address); 32 is the word size a real system would round up to, not the minimum.

## os-intermediate-039
topic: memory-management
answer: B

32-bit virtual addresses, 4 KiB pages, 4-byte entries, and a two-level page table with a 10-bit outer index, a 10-bit inner index and a 12-bit offset; every table takes one page. A process uses only the addresses 0x00000000–0x007FFFFF and 0xFFC00000–0xFFFFFFFF, and inner tables exist only where needed. How much memory do its page tables take?

- A: 12 KiB
- B: 16 KiB
- C: 4 MiB
- D: 4 MiB + 4 KiB

> Each inner table maps 1024 pages × 4 KiB = 4 MiB. The low 8 MiB needs two inner tables (outer entries 0 and 1) and the top 4 MiB one more (entry 1023): three inner tables plus the outer table make four pages, 16 KiB. 12 KiB forgets the outer table; 4 MiB is a flat single-level table; 4 MiB + 4 KiB allocates every inner table, which is what two levels avoid.

## os-intermediate-040
topic: memory-management
answer: D

A TLB with a 95% hit ratio and a 10 ns lookup; a memory access takes 80 ns. The TLB is searched first, so a miss pays the lookup too; a miss then reads both levels of a two-level page table from memory before the data access. There are no caches. What is the effective memory-access time?

- A: 88 ns
- B: 94 ns
- C: 97.5 ns
- D: 98 ns

> A hit costs 10 + 80 = 90 ns. A miss costs 10 for the lookup, 80 for each of the two page-table levels and 80 for the data: 250 ns. 0.95 × 90 + 0.05 × 250 = 85.5 + 12.5 = 98 ns. 94 assumes a one-level table, 97.5 leaves the lookup out of the miss, and 88 ignores the TLB's time entirely.

## os-intermediate-041
topic: memory-management
answer: C

A TLB lookup takes 10 ns and is paid on every access, hit or miss. A memory access takes 100 ns, and the page table is single-level and in memory. What is the lowest TLB hit ratio that keeps the effective access time at or below 130 ns?

- A: 20%
- B: 70%
- C: 80%
- D: 90%

> With hit ratio h: EAT = h × 110 + (1 − h) × 210 = 210 − 100h. Setting 210 − 100h ≤ 130 gives h ≥ 0.8. Ignoring the lookup time gives 70%, a two-level table would need 90%, and 20% is the highest miss ratio allowed rather than the hit ratio.

## os-intermediate-042
topic: memory-management
answer: D

A machine with 64-bit virtual addresses and 8 GiB of physical memory uses 4 KiB pages and an inverted page table with 16-byte entries. How large is the inverted page table?

- A: 32 MiB for each running process
- B: 16 MiB for the whole system
- C: 2⁵² × 16 bytes for each process
- D: 32 MiB for the whole system

> An inverted table has one entry per physical frame, not per virtual page: 8 GiB / 4 KiB = 2²¹ frames × 16 bytes = 32 MiB, shared by every process (each entry records which process and virtual page own the frame). C is a flat per-process table for a 64-bit space, the cost the inverted table avoids; 16 MiB counts 2²⁰ frames. The price is lookup: the table is indexed by frame, so translation needs a hash.

## os-intermediate-043
topic: memory-management
answer: A

32-bit virtual addresses, 4 KiB pages, and a two-level page table with a 10-bit outer index, a 10-bit inner index and a 12-bit offset. For the virtual address 0x00403ABC, what are (outer index, inner index, offset)?

- A: (1, 3, 0xABC)
- B: (4, 3, 0xABC)
- C: (1, 1027, 0xABC)
- D: (0, 1027, 0xABC)

> In binary the address is 0000000001 0000000011 101010111100. The top ten bits are 1, the next ten are 3 and the low twelve are 0xABC. B and D split the hexadecimal digits of the page number (0x00403) instead of its bits; C takes the whole page number, 0x403 = 1027, as the inner index without removing the outer index's bit.

## os-intermediate-044
topic: memory-management
answer: B, C, E

With everything else fixed, the page size is doubled from 4 KiB to 8 KiB. Which of these follow? Select all that apply.

- A: The page offset has one bit fewer
- B: A single-level page table has half as many entries
- C: The average internal fragmentation per process grows
- D: External fragmentation of physical memory appears
- E: The TLB's reach, the memory it can map at once, doubles

> Twice the page size means one more offset bit and one fewer page-number bit, so half as many entries. A process wastes on average half a page at the end of each region, so internal fragmentation grows. Reach is entries × page size, so it doubles. Paging has no external fragmentation at any page size, since any free frame fits any page.

## os-intermediate-045
topic: memory-management
answer: C

A TLB has 64 entries. A program loops over a 100 MiB array and misses the TLB constantly with 4 KiB pages. Of the page sizes 4 KiB, 64 KiB, 2 MiB and 1 GiB, which is the smallest that lets this TLB map the whole array at once?

- A: 4 KiB
- B: 64 KiB
- C: 2 MiB
- D: 1 GiB

> TLB reach is entries × page size: 256 KiB, 4 MiB, 128 MiB and 64 GiB for the four sizes. 2 MiB is the smallest whose reach, 128 MiB, covers 100 MiB (even unaligned, the array spans at most 51 such pages). 1 GiB pages also cover it, but they are not the smallest that do.

## os-intermediate-046
topic: virtual-memory
answer: B

FIFO page replacement on the reference string 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5, with all frames initially empty. How many page faults occur with 3 frames, and with 4 frames?

- A: 9 and 8
- B: 9 and 10
- C: 10 and 8
- D: 10 and 9

> With 3 frames: 1, 2, 3, 4, 1, 2 and 5 all fault; 1 and 2 hit; 3 and 4 fault; 5 hits: 9 faults. With 4 frames: 1 to 4 fault, 1 and 2 hit, then 5, 1, 2, 3, 4 and 5 all fault, each evicting the page the next reference needs: 10 faults. More frames, more faults: Belady's anomaly. 10 and 8 is what LRU does with the same string.

## os-intermediate-047
topic: virtual-memory
answer: A

Why can LRU never show Belady's anomaly, while FIFO can?

- A: With n frames it holds a subset of the pages it would hold with n + 1 frames
- B: LRU evicts the page that will be used furthest in the future, which is optimal
- C: LRU keeps pages in the order they were loaded, so the newest page is never evicted
- D: LRU faults only on the first reference to each page, whatever the number of frames

> LRU is a stack algorithm: with n frames it holds the n most recently used pages, which are always among the n + 1 most recently used, so every hit with n frames is also a hit with n + 1. FIFO's resident set with more frames need not contain its set with fewer. B describes the optimal algorithm; C describes FIFO's ordering; D is false for any algorithm once the pages outnumber the frames.

## os-intermediate-048
topic: virtual-memory
answer: B

An OS approximates LRU with the aging algorithm. Each page has an 8-bit counter, initially 0. At every clock tick each counter is shifted right by one bit, the page's reference bit is copied into the leftmost bit, and the reference bit is cleared. At ticks 1 to 4 the reference bits were set as follows: page A's at ticks 1 and 4, page B's at ticks 2 and 3, page C's at ticks 1, 2 and 3. After tick 4 the page with the smallest counter is evicted. Which page is it?

- A: Page A
- B: Page B
- C: Page C
- D: Pages A and B tie, with two references each

> After four ticks the latest tick is the leftmost bit: A = 10010000 (144), B = 01100000 (96), C = 01110000 (112). B has the smallest counter and is evicted. Counting references alone would tie A and B, but A was used at the latest tick, and C was used at every tick B was plus one more.

## os-intermediate-049
topic: virtual-memory
answer: B

The working set W(t, Δ) is the set of distinct pages among the Δ most recent references, up to and including reference t. For the reference string below (t = 1 to 15), what is W(11, 5)?

3, 1, 4, 1, 5, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3

- A: {3, 5, 8}
- B: {3, 5, 6, 8}
- C: {2, 3, 5, 6, 8}
- D: {3, 5, 8, 9}

> References 7 to 11 are 6, 5, 3, 5, 8, so W(11, 5) = {3, 5, 6, 8}. A uses only four references (8 to 11), C uses six (6 to 11), and D is the window ending at reference 12.

## os-intermediate-050
topic: virtual-memory
answer: A

Four processes have working sets of 12, 15, 9 and 8 frames, and 40 frames are available to them. What should an OS using the working-set model do?

- A: Suspend (swap out) a process, since the working sets total 44 frames, more than 40
- B: Give each process 10 frames, since equal shares are fair and fit exactly
- C: Admit another process, since CPU utilisation will drop while these ones page
- D: Nothing, since 40 frames is more than any single process's working set

> The total demand is 12 + 15 + 9 + 8 = 44 frames. With only 40, some process cannot keep its working set and will thrash, dragging the others with it, so the OS should lower the degree of multiprogramming. Equal shares of 10 leave the 12- and 15-frame processes short; admitting more processes is the thrashing spiral itself; and it is the sum that matters, not any single working set.

## os-intermediate-051
topic: virtual-memory
answer: D

A page-fault-frequency (PFF) policy keeps an upper and a lower bound on each process's fault rate. One process's rate rises above the upper bound, and no frames are free. What does the policy do?

- A: Takes frames from that process, since a high fault rate means it is wasting them
- B: Lowers the upper bound until that process falls back under it
- C: Switches that process from LRU replacement to FIFO replacement
- D: Gives that process more frames, taking them from a process it suspends

> A fault rate above the upper bound means the process has too few frames; below the lower bound, too many, and frames are taken away. When it needs more and none are free, PFF suspends a process and hands its frames out. Taking frames from the faulting process would make it fault even more.

## os-intermediate-052
topic: virtual-memory
answer: C

A process with 100 resident pages calls `fork()`, and the OS uses copy-on-write. Before either process calls `exec()`, the child writes to 3 distinct pages and the parent writes to 2 other pages, and these are the only writes either makes. How many pages are copied?

- A: 0
- B: 3
- C: 5
- D: 100

> `fork()` shares every frame, marked read-only and copy-on-write. The first write by either process to a shared page traps, and the kernel gives the writer its own copy: 3 for the child and 2 for the parent, 5 in all. 100 is a fork without copy-on-write, and 0 would leave the written pages shared, so each process would see the other's writes; 3 forgets that the parent's writes are trapped too, because the parent's pages were shared as well.

## os-intermediate-053
topic: virtual-memory
answer: D

Process A maps a file with `mmap(..., MAP_PRIVATE, ...)`, and process B maps the same file with `MAP_SHARED`. Each then writes a different byte of its mapping. Which statement is true?

- A: Both writes reach the file, but only after each process calls `msync()`
- B: A's write reaches the file; B's write stays private until B calls `munmap()`
- C: Neither write reaches the file, because only `write()` changes a file's contents
- D: B's write reaches the file and other shared mappings; A's stays in A's private copy

> A private mapping is copy-on-write: A's first store gives it its own copy of that page, which is never written back to the file. A shared mapping writes into the file's page-cache page itself, so B's store is visible at once to other shared mappings and to `read()`, and reaches the disk with normal writeback (`msync()` only forces it sooner).

## os-intermediate-054
topic: virtual-memory
answer: C

A memory access takes 100 ns. A page fault takes 5 ms to service in all, including the restarted access. If 1 access in 1,000 faults, what is the effective access time, roughly?

- A: 105 ns
- B: 0.6 µs
- C: 5.1 µs
- D: 5 ms

> 0.999 × 100 ns + 0.001 × 5,000,000 ns = 99.9 + 5,000 ≈ 5,100 ns, about 5.1 µs: one fault in a thousand makes memory about fifty times slower. 0.6 µs is the result for 1 fault in 10,000, 105 ns reads 5 ms as 5 µs, and 5 ms is the cost of one fault, not the average.
