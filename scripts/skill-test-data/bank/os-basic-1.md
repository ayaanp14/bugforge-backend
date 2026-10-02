---
skill: os
level: basic
---

## os-basic-001
topic: processes-threads
answer: A, C, E, F

Two threads belong to the same process. Which of these do they share? Select all that apply.

- A: The heap
- B: The stack
- C: Open file descriptors
- D: The program counter
- E: Global variables
- F: The program's code

> Threads of one process run in one address space, so the code, the global variables and the heap are common to all of them, and so are the process's resources such as open files. Each thread has its own execution state: its own stack (local variables and return addresses), its own program counter and its own registers. That private state is what lets the threads run independently inside the shared memory.

## os-basic-002
topic: processes-threads
answer: C

The same executable file is started twice, and both copies are running at the same moment. Each copy is single-threaded. Which description is correct?

- A: Two programs and two processes
- B: One program and one process
- C: One program and two processes
- D: Two programs and one process

> A program is the passive file of instructions on disk; a process is a program in execution, with its own process control block, address space, program counter and state. One file started twice is one program and two processes. Each process has its own memory, so a variable changed by one copy is not changed in the other.

## os-basic-003
topic: processes-threads
answer: B

A process in the running state asks to read a block from disk and cannot continue until the data arrives. Which state does it move to?

- A: Ready
- B: Waiting (blocked)
- C: New
- D: Terminated

> A process that must wait for an event, here the I/O completing, moves to the waiting state and gives up the CPU so another process can run. When the read finishes it moves to ready, and it runs again only when the scheduler picks it. Ready is for a process that could run but has no CPU, for example one whose time slice has just expired.

## os-basic-004
topic: processes-threads
answer: D

In the five-state process model (new, ready, running, waiting, terminated), which of these transitions never happens?

- A: Ready → running
- B: Running → ready
- C: Waiting → ready
- D: Waiting → running
- E: Running → waiting

> When the event a waiting process is waiting for occurs, the process becomes ready; it reaches running only when the scheduler dispatches it, like any other ready process. Ready → running is that dispatch, running → ready is a preemption (for example a timer interrupt ending the time slice), waiting → ready is the event completing, and running → waiting is a blocking request such as I/O.

## os-basic-005
topic: processes-threads
answer: A, B, D, F

Which of these are kept in a process's process control block (PCB)? Select all that apply.

- A: The saved program counter and CPU registers
- B: The process state, such as ready or waiting
- C: The contents of the process's stack
- D: The list of files the process has open
- E: The machine code of the program it runs
- F: Its scheduling priority

> The PCB is the kernel's record of a process: its identity, its state, the CPU context saved at the last context switch, scheduling information such as priority, memory-management information (for example a pointer to its page table) and I/O information such as its open files. The stack's contents and the program's code are in the process's own memory; the PCB records where that memory is, not what is in it.

## os-basic-006
topic: processes-threads
answer: A

On an operating system that schedules threads in the kernel, as Linux and Windows do, why is a switch between two threads of the same process usually cheaper than a switch between two processes?

- A: They share one address space, so the memory mappings and cached translations can stay.
- B: Threads have no registers of their own, so there is no CPU state to save or restore.
- C: Threads are switched by the program itself, so the kernel takes no part in the switch.
- D: Threads never block, so a switch between them happens only when a time slice ends.

> Both kinds of switch save one thread's registers and program counter and load another's. A process switch must also change the address space: the MMU is pointed at another page table, cached address translations (the TLB) are typically invalidated, and the new process starts with cold caches. Threads of one process share the address space, so that part is skipped. Each thread does have its own registers (B), and with kernel-scheduled threads the kernel performs the switch (C).

## os-basic-007
topic: processes-threads
answer: C

How many lines does this program print in total? Assume every `fork()` succeeds and each `printf` reaches the terminal immediately, with no output buffering.

```c
#include <stdio.h>
#include <unistd.h>

int main(void) {
    printf("A\n");
    fork();
    printf("B\n");
    fork();
    printf("C\n");
    return 0;
}
```

- A: 3
- B: 6
- C: 7
- D: 8

> Before any fork there is one process, so A is printed once. The first fork makes two processes and both print B (2 lines). Each of them forks again, giving four processes, and all four print C (4 lines). 1 + 2 + 4 = 7. A child starts at the instruction after the fork that created it; it does not run the code before it again. (The no-buffering assumption matters: if output went to a file, "A" could still sit in the stdio buffer at the fork and be copied into the child.)

## os-basic-008
topic: processes-threads
answer: B

How many `*` lines does this program print? Assume every `fork()` succeeds and there is no output buffering.

```c
#include <stdio.h>
#include <unistd.h>

int main(void) {
    for (int i = 0; i < 2; i++) {
        fork();
        printf("*\n");
    }
    return 0;
}
```

- A: 3
- B: 6
- C: 8
- D: 4

> With i = 0 the single process forks, and both resulting processes print: 2 lines. Each child carries a copy of i, so both processes go on to i = 1, where each forks again: 4 processes, each printing: 4 lines. 2 + 4 = 6. Counting 4 counts only the processes alive at the end and forgets the lines printed in the first iteration.

## os-basic-009
topic: processes-threads
answer: D

What does this program print, in order? Assume `fork()` succeeds.

```c
#include <stdio.h>
#include <sys/wait.h>
#include <unistd.h>

int main(void) {
    int x = 5;
    if (fork() == 0) {
        x = x + 10;
        printf("%d\n", x);
    } else {
        wait(NULL);
        x = x - 1;
        printf("%d\n", x);
    }
    return 0;
}
```

- A: `15` then `14`
- B: `4` then `15`
- C: `4` then `14`
- D: `15` then `4`

> fork gives the child its own copy of the parent's memory, so after the fork there are two separate variables named x, both 5. The child adds 10 to its copy and prints 15. The parent first waits for the child to exit, so its line comes second, then subtracts 1 from its own copy, which is still 5, and prints 4. Expecting 14 assumes the two processes share x; putting 4 first ignores the wait.

## os-basic-010
topic: kernel
answer: A

Before it gives the CPU to a user process, the operating system sets a hardware timer to raise an interrupt after a fixed interval. Why?

- A: So the OS gets control back even if the process loops forever without a system call.
- B: So the process is woken up when the disk has finished reading the data it asked for.
- C: So the machine's clock stays in step with the time kept by other computers on the network.
- D: So the process is stopped as soon as it uses more memory than its limit allows.

> While a user process runs, kernel code is not running; the kernel gets the CPU back only through a system call, an exception or an interrupt. A process stuck in a loop causes none of the first two, so the timer interrupt is what guarantees the kernel runs again, to preempt the process when its time slice ends. Loading the timer is a privileged instruction, so the process cannot switch it off. A finished disk read is signalled by the disk's own interrupt, and memory limits are checked by the MMU on every access.

## os-basic-011
topic: kernel
answer: D

How does a user program hand control to the kernel to make a system call such as `read()`?

- A: It jumps to the address of the kernel's read code, the same way it calls any function.
- B: It writes the request into a shared file that the kernel checks every few milliseconds.
- C: It sends a signal to process 1, which then performs the read on the program's behalf.
- D: It runs a trap instruction that enters kernel mode at a fixed kernel entry point.

> A user program cannot call kernel code directly: kernel memory is not accessible in user mode, so jumping there would fault. The library wrapper places the system-call number and arguments in registers and executes a trap (system-call) instruction; the hardware switches to kernel mode and jumps to an entry point the kernel registered at boot, so user code cannot choose where it enters. The kernel checks the arguments, does the work, and returns to user mode with the result.

## os-basic-012
topic: kernel
answer: A, C, E

On a POSIX system such as Linux, which of these are system calls (services the kernel performs), rather than functions that do their work in user mode inside the C library? Select all that apply.

- A: `fork()`
- B: `printf()`
- C: `open()`
- D: `strlen()`
- E: `write()`
- F: `malloc()`

> fork, open and write are system calls: creating a process, opening a file and writing to a file descriptor are things only the kernel can do. strlen never leaves user mode. printf formats its text in user space and calls write when it needs to output it. malloc manages the heap in user space and only occasionally asks the kernel for more memory through a system call such as brk or mmap.

## os-basic-013
topic: kernel
answer: B

How many processes, counting the original, print `Q`? Assume every `fork()` succeeds.

```c
#include <stdio.h>
#include <unistd.h>

int main(void) {
    if (fork() != 0) {
        fork();
        fork();
    }
    printf("Q\n");
    return 0;
}
```

- A: 4
- B: 5
- C: 6
- D: 8

> fork returns the child's PID (non-zero) in the parent and 0 in the child. The first fork creates a child that gets 0, skips the block and prints Q. The original gets a non-zero value and runs the two forks inside the block: the first makes two processes and the second doubles them to four. Those four print Q, and so does the first child: 5. 8 ignores the if; it would be right only if all three forks ran in every process.

## os-basic-014
topic: kernel
answer: C

In this program, `execlp` succeeds. What happens?

```c
#include <stdio.h>
#include <unistd.h>

int main(void) {
    execlp("ls", "ls", (char *)NULL);
    printf("after\n");
    return 0;
}
```

- A: `ls` runs in a new child process, and `after` is printed once `ls` finishes.
- B: `ls` runs in a new child process, and `after` is printed straight away.
- C: `ls` replaces the program in the same process, and `after` is never printed.
- D: `ls` replaces the program in the same process, and `after` is printed when `ls` exits.

> The exec family does not create a process. It loads a new program into the calling process, replacing its code, data and stack, while the process keeps its PID and open file descriptors. A successful exec never returns, so the printf after it runs only if exec fails. Running a command in a new process is fork followed by exec in the child, which is what a shell does.

## os-basic-015
topic: kernel
answer: A

A child process has exited. Its parent is still running but has not called `wait()` for it. What is the child now?

- A: A zombie
- B: An orphan
- C: A daemon
- D: A blocked process

> When a process exits, its memory is freed but its entry in the process table, holding its PID and exit status, is kept until the parent collects the status with wait(). Until then it is a zombie. An orphan is the opposite case: the parent exits while the child is still running, and the child is adopted by init (or a designated subreaper). A daemon is a background service process, and only a live process can be blocked.

## os-basic-016
topic: kernel
answer: A, C, F

Which of these events are caused by the instruction the CPU is currently executing (traps or exceptions), rather than by a device raising an interrupt? Select all that apply.

- A: A division by zero
- B: A key being pressed on the keyboard
- C: A program executing the system-call instruction
- D: The disk finishing a transfer
- E: The timer reaching the end of a time slice
- F: A reference to a page that is not in memory

> Traps and exceptions are synchronous: they occur at a particular instruction, every time it runs under the same conditions, as with a division by zero, a deliberate system-call trap or a page fault. Interrupts are asynchronous: a device such as the keyboard, the disk controller or the timer raises one when its event happens, whatever instruction the CPU is executing. Both make the CPU switch to kernel mode and run a handler.

## os-basic-017
topic: kernel
answer: B

In a microkernel operating system, where do services such as device drivers and file systems usually run?

- A: Inside the kernel in kernel mode, sharing one address space with the scheduler
- B: As separate user-mode server processes that communicate by message passing
- C: In the boot loader, which stays resident in memory after the kernel starts
- D: In each device's firmware, so the operating system never has to handle them

> A microkernel keeps only the minimum in kernel mode (scheduling, address spaces and inter-process communication) and runs drivers, file systems and network stacks as user-mode servers. A crashing driver then takes down one server rather than the whole system, at the cost of extra messages and mode switches. Option A describes a monolithic kernel such as Linux.

## os-basic-018
topic: kernel
answer: A, C, E

In the dual-mode (user and kernel) design, which of these must be privileged instructions that a user program cannot execute? Select all that apply.

- A: Loading a new value into the timer
- B: Executing the trap instruction that makes a system call
- C: Disabling interrupts
- D: Adding two registers together
- E: Issuing a command directly to a device controller

> Anything that would let a program take the machine away from the OS must be privileged: reloading the timer or disabling interrupts would let it keep the CPU forever, and talking to a device controller directly would let it read or overwrite anyone's data. The system-call trap must not be privileged, because it is the one sanctioned way for a user program to ask the kernel to do those things. Adding registers affects only the program itself.

## os-basic-019
topic: scheduling
answer: D

Four processes are scheduled first-come, first-served (FCFS):

| Process | Arrival (ms) | Burst (ms) |
| --- | --- | --- |
| P1 | 0 | 5 |
| P2 | 1 | 3 |
| P3 | 2 | 8 |
| P4 | 4 | 2 |

Waiting time is turnaround time minus burst time, and context switches take no time. What is the average waiting time?

- A: 3.75 ms
- B: 7.25 ms
- C: 10 ms
- D: 5.5 ms

> FCFS runs them in arrival order: P1 0–5, P2 5–8, P3 8–16, P4 16–18. Each runs once without interruption, so its waiting time is its start minus its arrival: P1 0, P2 4, P3 6, P4 12. The total is 22 and the average 5.5 ms. 7.25 forgets to subtract the arrival times (0 + 5 + 8 + 16 = 29), 10 is the average turnaround time, and 3.75 is what non-preemptive SJF would give.

## os-basic-020
topic: scheduling
answer: A

Four processes are scheduled with non-preemptive shortest-job-first (SJF). A tie in burst time goes to the process that arrived first, and context switches take no time.

| Process | Arrival (ms) | Burst (ms) |
| --- | --- | --- |
| P1 | 0 | 6 |
| P2 | 1 | 4 |
| P3 | 2 | 2 |
| P4 | 3 | 4 |

What is the average turnaround time?

- A: 9 ms
- B: 8 ms
- C: 9.5 ms
- D: 5 ms

> At time 0 only P1 has arrived, and non-preemptive SJF lets it run to completion: P1 0–6. At 6, P2 (4), P3 (2) and P4 (4) are all waiting: P3 runs 6–8, the tie between P2 and P4 goes to P2, which arrived first (8–12), then P4 runs 12–16. Turnaround is completion minus arrival: 6, 11, 6 and 13, so 36 / 4 = 9 ms. 8 is what preemptive SJF (SRTF) gives, 9.5 is FCFS, and 5 is the average waiting time.

## os-basic-021
topic: scheduling
answer: C

Four processes are scheduled with shortest-remaining-time-first (SRTF, preemptive SJF). A new arrival preempts the running process only if its burst is strictly shorter than the running process's remaining time; context switches take no time.

| Process | Arrival (ms) | Burst (ms) |
| --- | --- | --- |
| P1 | 0 | 7 |
| P2 | 1 | 3 |
| P3 | 2 | 1 |
| P4 | 4 | 5 |

What is the average waiting time?

- A: 4.75 ms
- B: 5.25 ms
- C: 2.75 ms
- D: 6.75 ms

> P1 runs 0–1. P2 (3) arrives with less than P1's remaining 6 and runs 1–2. P3 (1) is shorter than P2's remaining 2 and runs 2–3. P2 finishes 3–5 (P4, arriving at 4, needs 5, more than P2's remaining 1). Then P4 (5) beats P1 (6): P4 5–10, P1 10–16. Waiting = completion − arrival − burst: P1 16 − 0 − 7 = 9, P2 5 − 1 − 3 = 1, P3 3 − 2 − 1 = 0, P4 10 − 4 − 5 = 1, so 11 / 4 = 2.75 ms. Non-preemptive SJF gives 4.75, FCFS 5.25, and 6.75 is the SRTF average turnaround time.

## os-basic-022
topic: scheduling
answer: B

Four processes arrive at time 0 in the order P1, P2, P3, P4, with CPU bursts of 5, 4, 2 and 3 ms. They are scheduled round robin with a time quantum of 2 ms. A preempted process goes to the back of the ready queue, and context switches take no time. What is the average waiting time?

- A: 3 ms
- B: 7.75 ms
- C: 6.25 ms
- D: 11.25 ms

> The schedule is P1 0–2, P2 2–4, P3 4–6 (done), P4 6–8, P1 8–10, P2 10–12 (done), P4 12–13 (done), P1 13–14 (done). All arrive at 0, so waiting = completion − burst: P1 14 − 5 = 9, P2 12 − 4 = 8, P3 6 − 2 = 4, P4 13 − 3 = 10, and 31 / 4 = 7.75 ms. 3 is the average response time (first runs at 0, 2, 4 and 6), 6.25 is what FCFS gives, and 11.25 is the average turnaround time.

## os-basic-023
topic: scheduling
answer: A

Four processes are scheduled with preemptive priority scheduling, where a lower number means a higher priority. Context switches take no time.

| Process | Arrival (ms) | Burst (ms) | Priority |
| --- | --- | --- | --- |
| P1 | 0 | 4 | 3 |
| P2 | 1 | 3 | 1 |
| P3 | 2 | 5 | 4 |
| P4 | 3 | 2 | 2 |

What is the average waiting time?

- A: 3.25 ms
- B: 3.5 ms
- C: 4.25 ms
- D: 5.25 ms

> P1 runs 0–1. P2 (priority 1) arrives, preempts it and runs 1–4; P3 and P4 arrive meanwhile with lower priority than P2. At 4 the ready processes are P1 (3), P3 (4) and P4 (2), so P4 runs 4–6, P1 6–9 and P3 9–14. Waiting = completion − arrival − burst: P1 9 − 0 − 4 = 5, P2 4 − 1 − 3 = 0, P3 14 − 2 − 5 = 7, P4 6 − 3 − 2 = 1, so 13 / 4 = 3.25 ms. Non-preemptive priority gives 3.5, FCFS 4.25, and reading a higher number as a higher priority gives 5.25.

## os-basic-024
topic: scheduling
answer: D

Under FCFS scheduling, a long CPU-bound process gets the CPU just ahead of several short I/O-bound processes. They all wait behind it while the I/O devices sit idle, and the pattern repeats. What is this effect called?

- A: Starvation
- B: Thrashing
- C: Priority inversion
- D: The convoy effect

> In the convoy effect, short processes pile up behind one long process like cars behind a slow lorry, which inflates the average waiting time and leaves devices idle. It is not starvation: under FCFS the long process does finish and every process gets its turn. Thrashing is a paging problem, and priority inversion is a high-priority process waiting on a lock held by a low-priority one.

## os-basic-025
topic: scheduling
answer: B, D

Which of these scheduling algorithms can leave a process waiting indefinitely if suitable new processes keep arriving? Select all that apply.

- A: First-come, first-served
- B: Shortest-job-first (non-preemptive)
- C: Round robin
- D: Priority scheduling without aging

> SJF always picks the shortest waiting job, so a long job can wait forever while shorter ones keep arriving; priority scheduling does the same to a low-priority process. Aging, which raises a process's priority the longer it waits, cures it. FCFS serves in arrival order, so every process runs once those ahead of it finish, and round robin gives every ready process a quantum in each cycle.

## os-basic-026
topic: scheduling
answer: C

What happens to round-robin scheduling when the time quantum is made larger than every process's CPU burst?

- A: It behaves like shortest-job-first, since short jobs always finish first.
- B: Context-switch overhead grows, since the CPU switches processes more often.
- C: It behaves like first-come, first-served, since no process is ever preempted.
- D: Processes with long bursts starve, since they never finish within one quantum.

> Every burst ends before the quantum expires, so each process runs to completion in ready-queue order: that is FCFS. The opposite extreme, a very small quantum, improves response time but lets context switches dominate. A larger quantum means fewer switches, not more, and every burst now fits in one quantum, so nothing starves.

## os-basic-027
topic: scheduling
answer: A

A process arrives at time 2, first gets the CPU at time 5, and finishes at time 12. Its total CPU burst is 6 ms. What are its response time, waiting time and turnaround time?

- A: Response 3, waiting 4, turnaround 10
- B: Response 3, waiting 3, turnaround 10
- C: Response 5, waiting 6, turnaround 12
- D: Response 3, waiting 4, turnaround 7

> Turnaround = completion − arrival = 12 − 2 = 10. Waiting = turnaround − burst = 10 − 6 = 4: three units before its first run and one more after a preemption (it was on the CPU for 6 of the 7 units between 5 and 12). Response = first run − arrival = 5 − 2 = 3. B counts only the wait before the first run, C measures from time 0 instead of from arrival, and D measures turnaround from the first run.
