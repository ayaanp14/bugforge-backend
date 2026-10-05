---
title: Processes and Threads
order: 2
minutes: 12
level: beginner
updated: 2026-10-05
seo-title: Process vs Thread in OS: PCB, States, fork()
description: What a process and a thread are, what a PCB holds, the process state diagram, how a context switch works, fork() and exec(), and the multithreading models.
question: What is the difference between a process and a thread?
answer: A process is a program in execution with its own address space, open files and resources. A thread is a single path of execution inside a process; threads of the same process share its code, data, heap and open files but each has its own program counter, registers and stack. Creating and switching threads is therefore cheaper than for processes, but a bug in one thread can corrupt the others.
q: What is the difference between a program and a process?
a: A program is a passive file of instructions on disk. A process is that program loaded into memory and running, with a program counter, registers, a stack, a heap and resources such as open files. One program can run as many processes at once, for example several browser or terminal windows.
q: What is a PCB in an operating system?
a: The process control block is the kernel's record of one process. It holds the process ID, state, saved program counter and registers, scheduling information, memory-management information, accounting data and the list of open files. On a context switch the kernel saves the running process's CPU state into its PCB and loads the next one's.
q: What are the states of a process?
a: The five-state model has New, Ready, Running, Waiting (also called Blocked) and Terminated. A process is admitted to Ready, dispatched to Running, preempted back to Ready, moved to Waiting when it needs I/O or an event, returned to Ready when that completes, and moved to Terminated when it exits.
q: What is a context switch?
a: A context switch is the kernel saving the CPU state of the running process or thread into its control block and loading the saved state of another, so the CPU continues the second one where it left off. It is pure overhead, because no useful work is done during the switch, and it also leaves caches and the TLB cold.
q: What does fork() return?
a: fork() creates a child process that is a copy of the caller. It returns twice: 0 in the child, and the child's process ID in the parent. If no child could be created it returns -1 in the parent only. Both processes continue from the instruction after the call.
q: Why are threads called lightweight processes?
a: Because creating, switching and destroying a thread costs much less than doing the same for a process. Threads share their process's address space and resources, so the kernel does not set up a new page table or copy any memory, and switching between threads of one process keeps the same address space.
---

A **process** is a program in execution: the code plus everything that changes while it runs. A **thread** is one flow of execution inside a process. Every program you start becomes at least one process with one thread, and the operating system's job of "running many programs at once" is really the job of creating, switching and ending processes and threads. This note covers what the kernel keeps about each, how it moves between them, and why threads exist at all.

## What a process is

A program is a passive file on disk; a process is that program loaded into memory and running. One program can be several processes at the same time, each with its own state.

Each process gets its own **address space** in four parts: **text** (the machine code, read-only), **data** (global and static variables), the **heap** (memory allocated at run time with `malloc` or `new`, growing upward) and the **stack** (one frame per active function call, growing downward).

@figure address-space

Besides memory, a process owns resources the kernel tracks for it: open files, network connections, a current directory, a user identity and signal handlers.

## The process control block

The kernel describes every process with a **process control block (PCB)**, also called a task control block. On Linux it is the `task_struct`. The PCB is what lets a process stop and later continue exactly where it was.

| PCB field | What it holds |
| --- | --- |
| Process ID | A unique number (PID), plus the parent's PID |
| Process state | New, ready, running, waiting or terminated |
| Program counter | Address of the next instruction to run |
| CPU registers | Saved general registers, stack pointer, flags |
| Scheduling information | Priority, pointers into scheduling queues, time used |
| Memory-management information | Page table base or segment table, memory limits |
| Accounting information | CPU time used, start time, limits |
| I/O status information | Open file descriptors, devices allocated |

## Process states

A process moves through states as it runs. The standard five-state model:

- **New**: being created; the PCB is being set up.
- **Ready**: in memory, able to run, waiting only for a CPU.
- **Running**: its instructions are executing on a CPU. With one core, at most one process is running.
- **Waiting** (Blocked): cannot continue until something happens, such as an I/O completion, a lock or a child exiting.
- **Terminated**: finished; the kernel is cleaning up.

@figure states

Two transitions do **not** exist: Waiting never goes straight to Running (it must queue in Ready first), and Ready never goes to Waiting (only a running process can ask for I/O).

Systems that swap processes out of memory add two **suspended** states, *ready-suspended* and *blocked-suspended*. Three schedulers manage the whole picture: the **long-term scheduler** decides which new jobs are admitted, the **short-term (CPU) scheduler** picks the next ready process many times a second, and the **medium-term scheduler** swaps processes out and back in to control memory pressure.

## Context switch

A **context switch** moves the CPU from one process (or thread) to another. Something enters the kernel (a timer interrupt, an I/O request, a blocking system call), and the kernel saves the running process's state into its PCB and loads the next one's:

@figure context-switch

A context switch is pure **overhead**: the CPU does no useful work for either process during it. The direct cost is small, typically microseconds, but the indirect cost is larger: the new process finds the caches and the TLB filled with the old process's data. Switching between two threads of the *same* process skips the address-space switch, which is one reason threads are cheaper.

## Creating processes: fork() and exec()

On Unix-like systems, `fork()` creates a new process by duplicating the caller. The new **child** gets a copy of the parent's address space, open files and registers. `fork()` returns **0 in the child**, the **child's PID in the parent**, and **-1** in the parent if it failed. `exec()` then replaces the child's program with a new one, and `wait()` lets the parent collect the child's exit status.

```c
#include <stdio.h>
#include <sys/wait.h>
#include <unistd.h>

int main(void) {
    pid_t pid = fork();
    if (pid < 0) {
        perror("fork");                      /* no child was created */
        return 1;
    }
    if (pid == 0) {                          /* child */
        printf("child %d, parent %d\n", getpid(), getppid());
        execlp("ls", "ls", "-l", (char *)NULL);
        perror("execlp");                    /* reached only if exec failed */
        return 1;
    }
    waitpid(pid, NULL, 0);                   /* parent waits and reaps the child */
    printf("parent: child %d finished\n", pid);
    return 0;
}
```

Copying a whole address space would be wasteful when the child calls `exec` at once, so modern kernels use **copy-on-write**: parent and child share the same physical pages, marked read-only, and a page is copied only when one of them writes to it.

Counting is a favourite question. Each `fork()` doubles the number of processes running past it, so three `fork()` calls in a row give 2³ = 8 processes (7 new ones), and a `printf` after them prints 8 times.

@figure fork-tree

Two special cases:

- A **zombie** is a child that has exited but whose parent has not yet called `wait()`. Its memory is freed, but its PCB entry stays so the parent can read the exit status.
- An **orphan** is a child whose parent exited first. On Linux it is re-parented to `init` (PID 1) or a designated subreaper, which reaps it when it exits.

## Threads

A **thread** is the unit the CPU actually schedules: a program counter, a set of registers and a stack. A process with several threads runs several paths through the same program at once.

@figure threads

Why use threads: **responsiveness** (a UI thread stays live while a worker computes), **resource sharing** (threads share memory without any IPC), **economy** (creating a thread is far cheaper than a process) and **scalability** (threads run in parallel on multiple cores). The price is that shared memory needs synchronization, covered in [Process Synchronization](/notes/operating-systems/process-synchronization).

### User threads vs kernel threads

| Aspect | User-level threads | Kernel-level threads |
| --- | --- | --- |
| Managed by | A library in user space | The kernel |
| Kernel aware of them | No, it sees one process | Yes, it schedules each |
| Create and switch | Very fast, no system call | Slower, needs the kernel |
| One thread blocks in a system call | Whole process may block | Only that thread blocks |
| Run on several cores at once | No | Yes |

### Multithreading models

User threads must eventually run on kernel threads. The mapping is the **multithreading model**:

@figure threading-models

- **Many-to-one**: switching is cheap, but one blocking call stops every thread and there is no parallelism. Early Java "green threads" worked this way.
- **One-to-one**: true parallelism and independent blocking, at the cost of a kernel thread per user thread. Linux (NPTL pthreads) and Windows use this model.
- **Many-to-many**: cheap threads with parallelism, but the runtime is harder to build. Go's goroutines and Java's virtual threads are runtime-level versions of it.
- **Two-level**: many-to-many, but a chosen user thread can also be bound to its own kernel thread.

## Process vs thread

| Aspect | Process | Thread |
| --- | --- | --- |
| Definition | A program in execution | A path of execution within a process |
| Address space | Its own | Shared with the process's other threads |
| Creation cost | High (new address space, PCB) | Low (stack and registers only) |
| Context switch | Slower, changes address space | Faster within one process |
| Communication | Needs IPC: pipes, sockets, shared memory | Directly through shared memory |
| Isolation | A crash usually affects only that process | A crash can bring down the whole process |
| Kernel record | PCB | Thread control block (TCB) |

## Common mistakes

- Saying threads share the stack. Each thread has its own stack; they share the heap and globals.
- Answering that `fork()` returns the parent's PID to the child. The child gets 0; it calls `getppid()` for the parent.
- Drawing a Waiting → Running arrow. A woken process always goes to Ready first.
- Thinking a zombie still uses CPU or memory. Only its PCB entry and exit status remain.
- Assuming more threads always means faster. Past the number of cores, extra CPU-bound threads add switching and contention.
- Calling a mode switch (a system call) a context switch.

## Interview questions

**What is the difference between a process and a program?**
A program is a passive set of instructions in a file. A process is an active instance of it with a program counter, registers, an address space and resources. The same program can run as many independent processes.

**What is stored in a PCB, and when is it used?**
The PID, state, saved program counter and registers, scheduling data, memory-management data, accounting data and open files. The kernel writes the CPU state into it when the process leaves the CPU and reads it back when the process is dispatched again.

**How many processes does `fork(); fork(); fork();` create?**
Eight processes in total, the original plus seven new ones, because each call doubles the processes that execute past it: 2³ = 8.

**How many processes does `fork() && fork() || fork();` create?**
Five in total. The parent's first fork is non-zero, so it runs the second fork and the `||` is skipped. The first child sees 0, skips the second fork and runs the third. The second child sees 0 from its fork and runs the third one too. That makes the parent plus four children.

**What is a zombie process and how do you avoid one?**
A child that has exited but has not been reaped by its parent, so its entry stays in the process table. The parent avoids it by calling `wait()` or `waitpid()`, or by handling `SIGCHLD`; if the parent exits, `init` adopts and reaps the child.

**Why is a thread switch cheaper than a process switch?**
Threads of one process share the address space, so the kernel does not change the page table base and the TLB and caches stay useful. Only the registers, program counter and stack pointer change.

**Which multithreading model does Linux use?**
One-to-one: every pthread is a kernel-scheduled task created with the `clone()` system call, sharing the address space with the other threads of its process.

**When would you use processes instead of threads?**
When isolation matters more than sharing: a crash in one process does not take down the others, and their memory cannot be corrupted by each other. Modern browsers run web pages in separate processes for this reason.

Next, read [CPU Scheduling Algorithms](/notes/operating-systems/cpu-scheduling), or test yourself with the [Operating Systems (Basic) skill test](/skill-tests/os-basic).
