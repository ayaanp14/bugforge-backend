---
updated: 2026-10-03
question: What does the Operating Systems (Intermediate) skill test cover?
answer: It certifies the operating-system mechanisms an engineer reasons about at work, worked through on small, exact scenarios: preemptive and multilevel scheduling, semaphores, monitors and Peterson's algorithm, the banker's algorithm and deadlock detection, multi-level page tables and TLB timing, page replacement and working sets, inodes and file allocation, disk scheduling and RAID, and kernel design. Every question is multiple choice; there is no coding section.
q: How is the Intermediate OS test different from the Basic one?
a: Basic checks that you can run each standard algorithm once: FCFS, SJF, SRTF, priority and Round Robin schedules, FIFO, LRU and optimal page replacement, FCFS and SSTF disk scheduling, single-level paging and the four conditions for deadlock. Intermediate assumes all of that and goes further: multilevel feedback queues and aging, the banker's algorithm, multi-level page tables and TLB timing, working sets, C-SCAN and C-LOOK, and what breaks when a synchronization protocol is changed.
q: Which conventions do the computation questions assume?
a: Each question states the conventions its answer depends on: which way the disk head is moving, whether it travels to the last cylinder, whether a return jump counts as movement, whether a smaller priority number means a higher priority, what a preempted job's quantum becomes, how a working-set window is counted. Read those lines before you start; most wrong answers come from a convention assumed rather than read.
q: Is the test about Linux or about textbook operating systems?
a: Mostly the textbook mechanisms every operating-systems course teaches. Where a question needs a real system's behaviour, such as what fork() copies in a multithreaded process, what exec() keeps, when a pipe reports end of file, what ext4's ordered mode guarantees or a directory's link count, it names POSIX, Linux or ext4 and asks only about documented behaviour.
q: Do I need to write any code for the OS test?
a: No. The test is multiple choice only. A few questions show a short C fragment or semaphore pseudocode and ask what it does or what can go wrong, but you never write or run a program. The language skill tests are the ones with a coding round.
q: Are the numbers in the computation questions hard to work out by hand?
a: No. The scenarios are small on purpose: four processes, a dozen page references, eight disk requests, a matrix with three resource types. The arithmetic is powers of two, sums and a few products. What takes the time is setting the scenario up correctly, so work each one on paper, one step at a time.
---

Operating Systems (Intermediate) is for people who already know what a process, a page and a semaphore are, and now need to reason about them exactly. It assumes everything in the [Operating Systems (Basic)](/skill-tests/os-basic) test and asks the questions an interviewer or a kernel-adjacent job asks next: when does this job finish under a multilevel feedback queue, can this request be granted, how much memory do these page tables take, why can these threads deadlock.

Most questions give a small, complete scenario (a process table, a reference string, a request queue, a resource matrix, a few lines of pseudocode) and ask for its exact result or for what goes wrong. The rest ask why a mechanism is built the way it is. Either way, the answer is worked out, not remembered.

## What each topic examines

- **Processes and threads.** Counting the processes a chain of `fork()` calls creates, short-circuit operators included; what a child inherits from `fork()` and what survives `exec()`; how user threads map onto kernel threads and what `clone()` shares; and inter-process communication: a pipe's end-of-file rule, shared memory against message passing.
- **CPU scheduling.** Preemptive priority and shortest-remaining-time-first schedules drawn as a timeline, Round Robin and how the quantum trades response time against switching overhead, multilevel feedback queues, highest response ratio next, starvation and aging. A scheduler's ready queue is a priority queue, so the [heap lesson](/roadmap/heap) and [simulation problems](/challenges/simulation) are good practice for keeping a timeline straight.
- **Synchronization.** Semaphores in the bounded-buffer, readers–writers and dining-philosophers problems, and what a different order of `wait` and `signal` leads to; Peterson's algorithm and test-and-set locks, and which property a broken variant loses; monitors and condition variables; priority inversion and priority inheritance.
- **Deadlocks.** The banker's algorithm computed from small matrices: is the state safe, which sequence proves it, can a request be granted now. Deadlock detection with several instances per resource, lock ordering across several threads, and prevention, avoidance and recovery told apart by how they work. Detection is cycle-finding in a graph, which the [depth-first search lesson](/roadmap/depth-first-search) covers.
- **Memory management.** Multi-level page tables (levels, index bits, entry and table sizes for a given address width), splitting an address into its indices, effective access time with a TLB, inverted page tables, and how the page size trades table size against internal fragmentation. The [bit manipulation problems](/challenges/bit-manipulation) build the habit of reading an address as fields of bits.
- **Virtual memory.** FIFO replacement and Belady's anomaly, why stack algorithms such as LRU avoid it, the approximations of LRU real systems use, working sets and thrashing, page-fault frequency, the cost of a page fault, copy-on-write after `fork()`, and memory-mapped files.
- **File systems.** The largest file an inode can describe, disk reads needed to reach a given byte, contiguous, linked and indexed allocation, free-space bitmaps, directory link counts, what happens to a file deleted while it is open, renames and journaling.
- **Disk scheduling and I/O.** Total head movement and service order under SCAN, C-SCAN, LOOK and C-LOOK, and RAID 0, 1, 5 and 6: capacity, which failures each survives, and what a small write or a degraded read costs.
- **System calls and the kernel.** Mode switches against context switches, when a system call can be avoided altogether, how the kernel treats a pointer passed in from user space, interrupt handlers and deferred work, a signal that interrupts a blocked call, and monolithic kernels with loadable modules against microkernels.

## Working a scenario on paper

Every computation question can be done with a pencil in a few minutes, provided you set it up the same way each time. For a schedule, draw the timeline and mark every arrival on it before you place a single job; at each arrival and each completion, ask which job the policy picks now. For page replacement, write the frames as columns and fill one row per reference. For the banker's algorithm, compute Available and the Need matrix first, then look for a process whose need fits, add its allocation back and repeat. For disk scheduling, sort the requests either side of the head, then follow the direction you were given.

Then check the result against something you know. Waiting time is turnaround minus burst. The working sets of all running processes must fit in memory. A head that turns at the last request has moved less than one that went to the end of the disk. The [OS, DBMS & Networks MCQs](/aptitude/os-dbms-networks) are a quick way to drill the definitions these checks rest on.

## What trips people up

The usual mistakes are conventions assumed instead of read: sweeping the wrong way, sending the head to the last cylinder under LOOK, counting or not counting the C-SCAN return jump, reading a larger priority number as higher. The next most common are small omissions: forgetting the outer page table when totalling a two-level table, forgetting that a TLB miss also pays the lookup, forgetting the direct blocks of an inode, or comparing a newcomer under SRTF with a running job's original burst instead of the time it has left.

The synchronization questions reward tracing one interleaving carefully rather than reasoning in general terms. When a question changes one line of a known algorithm, find the order of events that breaks it: two processes running their entry sections one after the other, a thread that sleeps while holding a lock others need, a thread woken by a signal that another thread acts on first.

## How to prepare

Take each mechanism above and run it yourself on a small example you make up, then change one thing and run it again: a longer quantum, one more frame, a request from a different process, a head moving the other way. Seeing a result change is what fixes the rules in memory. For the conceptual questions, be able to say in one sentence what each mechanism costs: what a microkernel pays for isolation, what copy-on-write saves, what journaling does and does not promise.

## Sample question
topic: virtual-memory
answer: B

Second-chance (clock) replacement with 3 frames. In clock order the frames hold pages 4, 7 and 2, with reference bits 1, 0 and 1, and the hand points at page 4. A page's bit is set to 1 when it is loaded or referenced. On a fault the hand looks at its frame: a bit of 1 is cleared and the hand moves on; a bit of 0 means that page is replaced and the hand moves past the new page. Pages 9 and then 5 are referenced, and both fault. Which pages are evicted, in order?

- A: 4, then 7
- B: 7, then 4
- C: 7, then 2
- D: 4, then 2

> For page 9, the hand finds 4 with bit 1, clears it and moves on; 7 has bit 0, so 7 is replaced by 9 and the hand moves to 2. For page 5, 2 has bit 1, so it is cleared and spared; the hand reaches 4, whose bit was cleared on the first pass, and evicts it. A ignores the reference bits, C forgets that 2's bit was set, and D evicts pages whose bit is 1 instead of sparing them.
