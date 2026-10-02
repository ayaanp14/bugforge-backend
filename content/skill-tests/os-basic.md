---
updated: 2026-10-03
question: What does the Operating Systems (Basic) skill test cover?
answer: It covers processes, threads and their states, system calls and fork(), CPU scheduling worked through on small process tables, race conditions and the critical section, mutexes and semaphores, the four deadlock conditions, paging and fragmentation, page faults under FIFO, LRU and Optimal, inodes and links, and disk head movement under FCFS and SSTF — asked as what happens, not what a term stands for.
q: Do I need to write C code for the Operating Systems Basic test?
a: No. Every question is multiple choice. A few show a short C program that calls fork() and ask how many lines or processes it produces, so you need to read a loop and an if statement in C, but you never write or compile anything.
q: Which conventions do the CPU scheduling questions use?
a: Each question states the ones it needs: turnaround time is completion minus arrival, waiting time is turnaround minus burst, and context switches take no time unless the question says otherwise. When two processes could tie, the question says how the tie is broken, for example by earlier arrival. Check whether the algorithm is preemptive before you draw the chart.
q: Is the banker's algorithm on the Basic test?
a: No. The Basic test asks for the four conditions a deadlock needs, which design rule removes which condition, and whether a small resource-allocation graph is deadlocked. The banker's algorithm and safe states belong to the [Operating Systems (Intermediate)](/skill-tests/os-intermediate) test, along with Peterson's solution, monitors and the classic synchronization problems.
q: How should I practise page-replacement questions?
a: Draw one column per frame and walk the reference string a page at a time, marking every hit and fault, for FIFO, LRU and Optimal on the same string. With three frames a dozen references take a minute or two. Do enough of them that you never lose track of which page is oldest and which was used longest ago.
q: Should I take the networks test before or after this one?
a: The two are independent, so the order is yours to choose, and they prepare well side by side: [Computer Networks (Basic)](/skill-tests/networks-basic) covers layers, addressing and protocols at the same level as this test covers the operating system.
---

The Operating Systems (Basic) test checks that you understand what the operating system does between a program and the hardware: how it turns a program into running processes and threads, how it shares one CPU among them, how it stops them corrupting shared data or blocking each other forever, how it gives each one memory, and how it keeps files and drives the disk.

It is the material of a first course in operating systems, examined by asking what happens rather than what a term means. You should be able to say how many lines print after two calls to `fork()`, work out the average waiting time of four processes under round robin, count the page faults a reference string causes with three frames, and add up how far the disk head travels under SSTF.

## What each topic examines

The questions are spread across nine topics. The [OS, DBMS & Networks MCQs](/aptitude/os-dbms-networks) are the place to practise all of them.

- **Processes and threads.** A program against a process against a thread; what the threads of one process share and what each keeps for itself; the process states and the moves between them; what the process control block records; why a context switch costs time; and how many processes, or printed lines, a short program with `fork()` produces.
- **System calls and the kernel.** User mode and kernel mode, which instructions are privileged and what happens when a user program tries one, how a system call enters the kernel, traps against interrupts, what `fork()`, `exec()` and `wait()` do, zombie and orphan processes, and how a microkernel differs from a monolithic kernel.
- **CPU scheduling.** FCFS, shortest-job-first, shortest-remaining-time-first, round robin and priority scheduling, each worked on a small process table to an average waiting or turnaround time; response time; preemptive against non-preemptive; which algorithms can starve a process and how aging prevents it; and what the quantum does to round robin. Round robin's ready queue is a plain [queue](/roadmap/queue), and SJF and priority scheduling take from what is in effect a [heap](/roadmap/heap).
- **Synchronization.** Race conditions and how an unprotected increment loses updates, the three requirements of a critical-section solution, why a lock needs an atomic instruction, mutexes against semaphores, how a counting semaphore's value moves and who blocks, and when spinning beats sleeping.
- **Deadlocks.** The four necessary conditions and which prevention rule removes which, lock ordering, resource-allocation graphs and when a cycle means deadlock, deadlock against starvation, and prevention, avoidance and detection as strategies. Finding a deadlock is finding a cycle in a directed [graph](/roadmap/graphs).
- **Memory management.** Logical against physical addresses and the MMU, base and limit registers, pages and frames, splitting an address into page number and offset and translating it through a page table, internal against external fragmentation, compaction, and first, best and worst fit. The split itself is a shift and a mask, the subject of [bit manipulation](/roadmap/bit-manipulation).
- **Virtual memory and page replacement.** Demand paging, what the OS does on a page fault, the dirty bit, locality of reference, and page faults under FIFO, LRU and Optimal for a short reference string. An LRU cache in code is the classic pairing of a [hash map](/roadmap/hashing) with a [linked list](/roadmap/linked-list).
- **File systems.** What an inode holds and what a directory holds, hard links against symbolic links, how a path is resolved, file descriptors, Unix permission bits, and how files fill whole blocks.
- **Disk scheduling and I/O.** Total head movement under FCFS and SSTF, the order SSTF serves requests in and why it can starve one, seek time against rotational latency, DMA, interrupts against polling, and spooling.

## How the scenario questions are set

Many questions give a small scenario and ask for its exact result. A scheduling question gives a table of processes with arrival and burst times and names the algorithm: draw the Gantt chart, read off each completion time, and only then compute the averages. A `fork()` question shows a complete C program, and unless it says otherwise every call succeeds and output is not buffered. A paging question gives sizes in bytes, so 1 KB is 1,024. A disk question gives the starting cylinder and the queue in arrival order.

The wrong options are the answers the usual slips produce: forgetting to subtract arrival times, giving turnaround when waiting was asked, treating 1 KB as 1,000 bytes, counting hits instead of faults, or measuring every request's distance from where the head started. If your answer is not among the options, the slip is almost always in your working, so redraw the chart rather than picking the nearest number.

The other questions ask how a mechanism works and why: what the kernel does when a page fault arrives, why a lock built from an ordinary variable fails, why switching between threads is cheaper than switching between processes. A few ask you to select every correct option, and only the exact set scores.

## How to prepare

Work the scenarios by hand until they are routine. Take four processes with arrival and burst times and schedule them five ways: FCFS, SJF, SRTF, round robin with a quantum of 2, and priority. SRTF should give the lowest average waiting time of the five, which is a free check on your charts. Run FIFO, LRU and Optimal on one reference string of a dozen pages with three frames; Optimal can never fault more than the other two. Add up the head movement for a disk queue under FCFS and then SSTF.

Then run the small programs the questions are built from. On Linux or macOS, a C file with two or three calls to `fork()` and a `printf` shows exactly how processes multiply; print `getpid()` on each line to see which process wrote it. In C, two threads incrementing a shared counter a million times without a lock will lose updates on most runs. Writing a scheduler or a page-replacement simulator in a language you know is good practice in itself, and [simulation problems](/challenges/simulation) build the same habit of stepping a system forward one event at a time.

Finally, be able to explain each mechanism in two or three sentences, as you would to an interviewer: what the process control block holds, what happens between a system call and its return, why a cycle among single-instance resources is a deadlock.

## Where candidates lose marks

- Waiting time computed from the wrong point. It is turnaround minus burst; a process that is preempted and resumed waits more than once.
- A non-preemptive scheduler allowed to preempt. Under SJF the running process finishes its burst even when a shorter one arrives; only SRTF and preemptive priority switch mid-burst.
- A forked child run from the top. A child starts at the instruction after the `fork()` that created it, with its own copy of the parent's variables, so a change in one process never shows in another.
- Decimal page sizes. Page and block sizes are powers of two, and the offset is the low bits of the address.
- The wrong deadlock condition. Requesting everything up front removes hold and wait; acquiring locks in one global order removes circular wait.
- FIFO and LRU swapped. LRU evicts the page used longest ago, not the page loaded longest ago: a hit refreshes a page under LRU but changes nothing under FIFO.

## What changes at Intermediate

The [Operating Systems (Intermediate)](/skill-tests/os-intermediate) test assumes everything here and goes further on the same ground: semaphores in the classic producer-consumer, readers-writers and dining-philosophers problems, Peterson's solution and monitors, the banker's algorithm, multi-level page tables, the TLB and effective access time, Belady's anomaly and thrashing, file allocation methods, the SCAN family of disk schedulers, and RAID. The [skill tests index](/skill-tests) lists the other fundamentals tests.

## Sample question
topic: scheduling
answer: B

Three processes arrive at time 0 in the order P1, P2, P3, with CPU bursts of 3, 5 and 2 ms. They are scheduled round robin with a 2 ms quantum, and a preempted process goes to the back of the ready queue. Count a context switch each time the CPU passes from one process to a different one; the first dispatch at time 0 does not count. How many context switches occur?

- A: 3
- B: 4
- C: 5
- D: 6

> The schedule is P1 0–2, P2 2–4, P3 4–6 (done), P1 6–7 (done), P2 7–9, P2 9–10 (done). The CPU changes process at 2 (P1 to P2), 4 (P2 to P3), 6 (P3 to P1) and 7 (P1 to P2): 4 switches. At 9 P2's quantum expires, but it is the only process left, so it simply carries on. Counting that as a switch gives 5, and counting every dispatch, the first included, gives 6.
