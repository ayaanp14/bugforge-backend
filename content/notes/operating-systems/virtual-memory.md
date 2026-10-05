---
title: Virtual Memory and Demand Paging
order: 8
minutes: 13
level: intermediate
updated: 2026-10-05
seo-title: Virtual Memory in OS: Demand Paging, TLB, Thrashing
description: Virtual memory in operating systems: demand paging, how a page fault is handled, TLB effective access time worked out, multi-level page tables and thrashing.
question: What is virtual memory in an operating system?
answer: Virtual memory is a technique that separates a process's logical address space from physical memory, so a program can run with only part of it in RAM. Pages are loaded on demand when first touched, and a page fault brings in a missing page from disk. It lets programs be larger than physical memory, lets more processes run at once, and makes sharing and copy-on-write easy.
q: What is demand paging?
a: Demand paging loads a page into memory only when the process first accesses it, instead of loading the whole program at start. Pages never used are never loaded, which saves memory and start-up time. A reference to a page that is not in memory causes a page fault, and the operating system then reads the page from disk.
q: What is a page fault?
a: A page fault is the trap raised when a process accesses a page whose page-table entry is marked invalid, usually because the page is not in physical memory. The operating system checks the access is legal, finds a free frame, reads the page in from disk, updates the page table and restarts the instruction. An illegal access instead ends in a segmentation fault.
q: What is a TLB and why is it needed?
a: The translation look-aside buffer is a small, fast hardware cache of recent page-number to frame-number translations. Without it, every memory reference would need an extra memory access to read the page table, doubling access time. With a high hit ratio, most translations come from the TLB and the average access time stays close to a single memory access.
q: What is thrashing in an operating system?
a: Thrashing is when processes spend more time paging than executing, because they do not have enough frames for the pages they are actively using. Each fault evicts a page another process needs soon, so faults cascade, CPU utilization collapses and the disk is saturated. It is cured by reducing the number of processes in memory or giving each enough frames for its working set.
q: What is the working set model?
a: The working set of a process is the set of pages it referenced in its most recent window of delta references, an approximation of its current locality. The operating system tries to keep each process's working set in memory and, if the sum of all working set sizes exceeds the number of frames, suspends a process to prevent thrashing.
q: Why are multi-level page tables used?
a: A single-level page table for a 32-bit address space with 4 KB pages has a million entries, about 4 MB per process, mostly describing unused addresses. A multi-level table pages the page table itself: only the parts covering addresses the process actually uses are allocated, which cuts the memory needed to a few kilobytes for a small process.
---

**Virtual memory** lets a process behave as if it had a large, private, contiguous memory of its own, while the operating system keeps only the parts currently in use in physical RAM and the rest on disk. It is built on paging, explained in [Memory Management](/notes/operating-systems/memory-management): because pages can live in any frame, they can also live in no frame at all until needed. This note covers how missing pages are brought in, what that costs, how the TLB and multi-level page tables keep translation fast and small, and what happens when memory runs short: thrashing.

## Why virtual memory

Programs rarely need all their code and data at once. Error handlers, rarely used features and oversized arrays sit untouched. Virtual memory exploits this:

- A program can be **larger than physical memory**.
- More processes fit in memory at once, raising **CPU utilization** and throughput.
- Programs start faster, because less has to be read from disk.
- **Sharing** is cheap: shared libraries are mapped into many processes, and after `fork()` parent and child share pages **copy-on-write** until one of them writes.
- Files can be **memory-mapped**, read and written as ordinary memory.

It works because of **locality of reference**: in any short period a program touches a small set of pages (a loop's code, the array it is scanning, the top of the stack), and that set changes slowly.

## Demand paging

With **demand paging**, a page is loaded only when it is first referenced. Each page-table entry has a **valid-invalid bit**: valid means the page is in memory, invalid means it is either not part of the process or not loaded yet. **Pure demand paging** starts a process with no pages at all and faults in every one as it is touched.

### Handling a page fault

When a process touches a page marked invalid, the MMU raises a **page fault** trap and the OS brings the page in:

@figure page-fault

If no frame is free, a replacement policy picks a victim frame first, and the victim is written back to disk only if it has been modified (its **dirty bit** is set). A fault that needs a disk read is a **major** fault; one resolved without I/O, for example a page already in memory for another process, is a **minor** fault. Choosing the victim is the subject of [Page Replacement Algorithms](/notes/operating-systems/page-replacement-algorithms).

### Cost of a page fault

Let p be the page-fault rate (0 ≤ p ≤ 1). Then:

**Effective access time = (1 − p) × memory access time + p × page-fault service time**

Take a memory access of 200 ns and a page-fault service time of 8 ms (8,000,000 ns), dominated by the disk:

- EAT = (1 − p) × 200 + p × 8,000,000 = 200 + 7,999,800 × p ns.
- With one fault in every 1,000 accesses (p = 0.001): EAT = 200 + 7,999.8 = **8,199.8 ns**, about 41 times slower than memory.
- To keep the slowdown under 10%, EAT must stay below 220 ns: 7,999,800 × p < 20, so p < 0.0000025, fewer than **one fault in about 400,000 accesses**.

The lesson interviewers want: the fault rate must be extremely low, so the replacement policy and the number of frames per process matter enormously.

## The TLB and effective access time

The page table lives in memory, so a naive translation costs one memory access for the page-table entry and another for the data. The **translation look-aside buffer (TLB)** is a small, fast associative cache, typically tens to a few thousand entries, holding recent page → frame translations. On a **TLB hit** the frame number comes straight from the TLB; on a **miss** the hardware or the OS walks the page table and then caches the translation. Entries are tagged with an **address-space identifier** on many CPUs, so a context switch need not flush the whole TLB.

With TLB lookup time t, memory access time m and hit ratio h, for a single-level page table:

**EAT = h × (t + m) + (1 − h) × (t + 2m)**

@figure tlb-path

**Worked example**, with t = 20 ns and m = 100 ns, so a hit costs 120 ns and a miss 220 ns:

| Case | Hit ratio | Calculation | EAT |
| --- | --- | --- | --- |
| No TLB | — | 100 + 100 | 200 ns |
| Single-level table | 0.80 | 0.80 × 120 + 0.20 × 220 = 96 + 44 | 140 ns |
| Single-level table | 0.98 | 0.98 × 120 + 0.02 × 220 = 117.6 + 4.4 | 122 ns |
| Two-level table (miss = 20 + 3 × 100) | 0.98 | 0.98 × 120 + 0.02 × 320 = 117.6 + 6.4 | 124 ns |

A 98% hit ratio brings the cost within 22% of a bare memory access, and the deeper page table hardly matters because misses are rare. Some textbooks treat the TLB lookup as free (t = 0); then the 0.80 case is 0.80 × 100 + 0.20 × 200 = 120 ns. Read which convention a question uses.

## Multi-level page tables

A 32-bit address space with 4 KB pages needs 2²⁰ page-table entries; at 4 bytes each that is **4 MB per process**, nearly all describing addresses the process never uses. The fix is to page the page table itself.

In a **two-level** scheme, the 32-bit address splits into 10 + 10 + 12 bits: the top 10 index the outer table, the next 10 an inner table, and the low 12 are the offset in the page.

@figure two-level

The outer table is 1,024 × 4 B = 4 KB, and each inner table is also 4 KB and maps 4 MB of address space. Inner tables are allocated only for regions in use. A process with 8 MB of code and data at the bottom of its space and a 4 MB stack at the top needs one outer table and 2 + 1 = 3 inner tables: 4 × 4 KB = **16 KB** instead of 4 MB.

The price is one memory access per level on a TLB miss. x86-64 uses **four levels** of 9 bits each over 48-bit virtual addresses (4 × 9 + 12 = 48), and newer processors support five levels for 57-bit addresses, which is only practical because TLB hit ratios are high. Alternatives for very large address spaces are **hashed page tables** and **inverted page tables**, which keep one entry per physical frame instead of per virtual page.

## Thrashing

If a process does not have enough frames for the pages it is actively using, it faults, evicts a page it needs again moments later, faults again, and so on. When the system as a whole spends more time servicing page faults than executing, it is **thrashing**.

The classic way it starts:

1. Processes have too few frames, so the page-fault rate rises.
2. They queue for the paging disk, so CPU utilization drops.
3. The long-term scheduler sees an idle CPU and admits **more** processes.
4. Each new process takes frames from the others, so the fault rate rises further.

Plotted against the degree of multiprogramming, CPU utilization climbs, peaks, then falls off sharply: that cliff is thrashing. The cure is to give each process the frames it needs, and to **reduce** the number of processes in memory, by suspending some, when there are not enough frames for all. **Local replacement**, where a process may evict only its own pages, keeps one thrashing process from dragging others down, though it does not cure that process.

## The working-set model

The **working set** WS(t, Δ) of a process is the set of distinct pages it referenced in its last Δ references, the **working-set window**. It approximates the process's current locality.

Worked example with Δ = 4 and this reference string:

| Time | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Page | 1 | 2 | 3 | 1 | 2 | 4 | 4 | 4 | 5 | 5 | 4 | 5 |

@figure working-set

| At time | Last 4 references | Working set | Size |
| --- | --- | --- | --- |
| 4 | 1 2 3 1 | {1, 2, 3} | 3 |
| 8 | 2 4 4 4 | {2, 4} | 2 |
| 12 | 5 5 4 5 | {4, 5} | 2 |

The working set shrinks and moves as the process settles into a new locality. If the window is too small it misses part of the locality; if too large it spans several; an infinite window is every page ever touched.

Let WSSᵢ be the working-set size of process i and D = Σ WSSᵢ the total demand for frames. If D exceeds the number of available frames, some process lacks its working set and thrashing follows, so the OS **suspends** a process and gives its frames to the others. Keeping exact working sets is expensive, so systems approximate them with reference bits sampled on a timer.

A more direct control is **page-fault frequency (PFF)**: set an upper and a lower bound on each process's fault rate. Above the upper bound, give the process more frames; below the lower bound, take some away; if no frames are free, suspend a process.

## Common mistakes

- Treating every page fault as an error. Most are normal demand paging; only an access to an address outside the process ends in a segmentation fault.
- Forgetting the dirty bit: a clean victim page need not be written back, which halves the cost of that fault.
- Writing EAT with a TLB miss costing t + m instead of t + 2m for a single-level page table: a miss reads the page table and then the data.
- Saying multi-level page tables make translation faster. They save memory; a TLB miss gets slower, one access per level.
- Saying more processes always means better CPU utilization. Past the thrashing point, utilization falls.
- Confusing the working set with the resident set: the working set is what the process recently used, the resident set is what happens to be in memory.

## Interview questions

**What are the steps in handling a page fault?**
Trap to the OS, check the reference is legal, find a free frame or evict a victim (writing it back if dirty), read the page from disk while another process runs, update the page table and valid bit, then restart the faulting instruction.

**How does the TLB reduce effective memory access time?**
It caches recent page-to-frame translations, so a hit skips the page-table read. With a 98% hit ratio, a 20 ns TLB and 100 ns memory, the average access is 122 ns instead of 200 ns without a TLB.

**What causes thrashing and how do you stop it?**
The total working sets of the running processes exceed physical memory, so processes keep stealing each other's active pages. Stop it by reducing the degree of multiprogramming, using the working-set model or page-fault frequency to give each process enough frames, and using local replacement.

**What is the difference between virtual memory and physical memory?**
Physical memory is the installed RAM. Virtual memory is the address space each process sees, which can be larger than RAM; it is mapped onto RAM page by page, with the rest kept on disk.

**What is copy-on-write?**
After `fork()`, parent and child share the same physical pages, marked read-only. Only when one of them writes to a page does the kernel copy that page, so a child that immediately calls `exec()` copies almost nothing.

**Why is the effective access time so sensitive to the page-fault rate?**
In the textbook figures a fault costs 8 ms against 200 ns for a memory access, 40,000 times more, so even one fault in a thousand accesses makes memory about 41 times slower on average. Only fault rates of a few per million accesses keep the overhead small.

Next, read [Page Replacement Algorithms](/notes/operating-systems/page-replacement-algorithms), or test yourself with the [Operating Systems (Intermediate) skill test](/skill-tests/os-intermediate).
