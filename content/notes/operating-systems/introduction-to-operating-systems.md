---
title: Introduction to Operating Systems
order: 1
minutes: 11
level: beginner
updated: 2026-10-05
seo-title: What Is an Operating System? Kernel, System Calls
description: What an operating system does, kernel mode vs user mode, how a system call works, the types of OS from batch to real-time, and monolithic vs microkernel.
question: What is an operating system?
answer: An operating system is the software that manages a computer's hardware and gives programs a safe, simpler interface to it. It shares the CPU, memory, storage and devices among programs, keeps them from interfering with each other, and offers services such as files and processes through system calls. Its core, the kernel, runs in a privileged CPU mode that ordinary programs cannot enter.
q: What is the difference between an operating system and a kernel?
a: The kernel is the part of the operating system that runs in privileged mode and manages the CPU, memory and devices directly. The operating system is the kernel plus everything shipped around it: system libraries, the shell, utilities, services and often a graphical interface. Linux on its own is a kernel; Ubuntu or Android is an operating system built on it.
q: Why do we need an operating system?
a: Without one, every program would have to drive the disk, screen and network itself and would trust every other program not to overwrite its memory. The operating system does that work once, shares the hardware fairly among many programs, and protects them from each other and the hardware from them.
q: What is a system call in simple words?
a: A system call is a request from a program to the kernel for something only the kernel may do, such as reading a file, creating a process or sending data on a socket. The program executes a special trap instruction, the CPU switches to kernel mode, the kernel does the work, and control returns to the program in user mode.
q: What are the main functions of an operating system?
a: Process management (creating, scheduling and ending programs), memory management (giving each process its own address space), file management, device and I/O management, protection and security, and networking. Most systems also provide a user interface, either a command shell or a graphical desktop, though that part runs outside the kernel.
q: Is Linux a monolithic kernel or a microkernel?
a: Linux is a monolithic kernel: the scheduler, memory manager, file systems, network stack and device drivers all run together in kernel mode in one address space. It is modular, though, because drivers and file systems can be loaded and unloaded at run time as kernel modules, without rebooting.
q: What is the difference between multiprogramming and multitasking?
a: Multiprogramming keeps several programs in memory and switches the CPU to another one when the running program waits for I/O, so the CPU is kept busy. Multitasking, or time-sharing, also switches on a timer every few milliseconds, so many interactive users or programs each get quick responses. Multitasking is multiprogramming with preemption added.
---

An operating system (OS) is the layer of software between the hardware and the programs you run. A program wants to say "open this file" or "give me more memory"; the hardware only understands disk sectors, page tables and device registers. The OS bridges that gap, and it also decides who gets the hardware when many programs want it at once. Every later topic in these notes, from scheduling to file systems, is one part of that job.

## What an operating system does

There are two classic ways to describe the OS, and an interviewer is happy with either.

- **A resource manager.** The CPU, memory, disks and network cards are shared. The OS decides which process runs next, how much memory each one gets and in what order disk requests are served, and it keeps one program from taking everything.
- **An extended machine.** The OS hides ugly hardware behind clean abstractions: a *file* instead of disk blocks, a *process* instead of raw CPU registers, an *address space* instead of physical RAM, a *socket* instead of a network card.

Its main functions follow from that:

| Function | What it covers | Note |
| --- | --- | --- |
| Process management | Create, schedule, suspend and end processes and threads | [Processes and Threads](/notes/operating-systems/processes-and-threads) |
| CPU scheduling | Pick which ready process runs next | [CPU Scheduling Algorithms](/notes/operating-systems/cpu-scheduling) |
| Synchronization | Coordinate processes that share data | [Process Synchronization](/notes/operating-systems/process-synchronization) |
| Memory management | Give each process its own address space, map it to RAM | [Memory Management](/notes/operating-systems/memory-management) |
| File management | Files, directories, permissions on top of raw blocks | [File Systems](/notes/operating-systems/file-systems) |
| Device and I/O management | Drivers, buffering, disk scheduling | [Disk Scheduling Algorithms](/notes/operating-systems/disk-scheduling) |
| Protection and security | Keep processes and users from harming each other | — |

When the machine powers on, firmware (BIOS or, on modern PCs, UEFI) runs first, finds a boot loader on the disk, and the boot loader loads the kernel into memory. The kernel sets up memory management and devices, then starts the first user process (on most Linux systems, `systemd`), which starts everything else.

## Kernel mode and user mode

The **kernel** is the core of the OS that stays in memory and runs with full control of the hardware. Ordinary programs must not have that control, or a bug in one program could wipe the disk or read another program's memory. The CPU enforces the split with a **mode bit**:

- **Kernel mode** (supervisor mode, ring 0 on x86): every instruction is allowed.
- **User mode** (ring 3 on x86): **privileged instructions** are refused. These include direct I/O, changing the page tables, disabling interrupts, setting the timer and halting the CPU.

If a user program tries a privileged instruction, the CPU raises an exception and the kernel usually terminates the program. The only ways into kernel mode are:

1. **System calls**, a deliberate trap instruction from a program.
2. **Interrupts**, signals from hardware (a key pressed, a disk read finished, the timer ticking).
3. **Exceptions**, errors the CPU detects while running an instruction (divide by zero, a page fault, an illegal instruction).

The **timer interrupt** matters most. The kernel programs a hardware timer before handing the CPU to a process; when it fires, control returns to the kernel even if the program is stuck in an infinite loop. That is what makes preemptive multitasking possible.

## System calls

A **system call** is the interface through which a program asks the kernel for a service. Programmers rarely issue one directly; they call a library function (`printf`, `fopen`, `malloc`) that makes the call when it needs one.

What happens on Linux for a `read()`:

1. The C library wrapper puts the system call number for `read` and its arguments in CPU registers.
2. It executes the trap instruction (`syscall` on x86-64). The CPU switches to kernel mode and jumps to a fixed kernel entry point.
3. The kernel looks the number up in its **system call table**, checks the arguments (a pointer from user space must point into the caller's own memory) and runs the handler.
4. The result goes back in a register, the CPU returns to user mode, and the wrapper returns it to the program (or sets `errno` on failure).

Arguments travel in registers, in a block of memory whose address is passed in a register, or on the stack. A system call costs a **mode switch**, which is much cheaper than a full context switch to another process.

```c
#include <unistd.h>

int main(void) {
    const char msg[] = "hello\n";
    write(1, msg, sizeof msg - 1);   /* system call: write 6 bytes to file descriptor 1 (stdout) */
    return 0;
}
```

System calls are grouped into six categories:

| Category | What it does | Unix examples | Windows examples |
| --- | --- | --- | --- |
| Process control | Create, end, wait for, load programs | `fork`, `exec`, `exit`, `wait` | `CreateProcess`, `ExitProcess`, `WaitForSingleObject` |
| File management | Create, open, read, write, close files | `open`, `read`, `write`, `close` | `CreateFile`, `ReadFile`, `WriteFile`, `CloseHandle` |
| Device management | Request, release, control devices | `ioctl`, `read`, `write` | `SetConsoleMode`, `ReadConsole`, `WriteConsole` |
| Information maintenance | Get or set time, process attributes | `getpid`, `alarm`, `sleep` | `GetCurrentProcessId`, `SetTimer`, `Sleep` |
| Communication | Pipes, shared memory, messages | `pipe`, `shmget`, `mmap` | `CreatePipe`, `CreateFileMapping`, `MapViewOfFile` |
| Protection | Permissions and ownership | `chmod`, `umask`, `chown` | `SetFileSecurity`, `SetSecurityDescriptorGroup` |

## Types of operating systems

Operating systems grew in stages, and each stage fixed a weakness of the one before. Interviewers ask for these as definitions.

- **Batch OS.** Jobs with similar needs were collected and run one after another without user interaction. The CPU sat idle whenever a job waited for slow I/O.
- **Multiprogramming OS.** Several jobs are kept in memory at once. When the running job waits for I/O, the OS switches the CPU to another job. The goal is **CPU utilization**; there is still no interaction.
- **Multitasking or time-sharing OS.** Multiprogramming plus a timer: each process gets a short **time slice** (a few milliseconds) and is then preempted, so many users or programs each get quick responses. The goal is **response time**. Unix, Linux, Windows and macOS are all time-sharing systems.
- **Real-time OS (RTOS).** Correctness depends on meeting deadlines. In a **hard** real-time system a missed deadline is a failure (airbag control, pacemakers, industrial controllers); in a **soft** real-time system it only lowers quality (a dropped video frame). Examples: FreeRTOS, VxWorks, QNX.
- **Distributed OS.** Several networked computers are managed so that users see one system: resources, files and computation are shared across machines. Research systems such as Amoeba explored it; today the idea mostly lives in cluster software rather than in an OS you install.
- **Multiprocessor OS.** One machine with several CPUs or cores sharing memory. In **symmetric multiprocessing (SMP)**, which every modern desktop OS uses, every core runs the kernel and schedules its own work.

| Type | Key idea | Main goal |
| --- | --- | --- |
| Batch | Run grouped jobs one by one | Throughput, no operator delays |
| Multiprogramming | Switch to another job on I/O wait | CPU utilization |
| Time-sharing | Switch on a timer as well | Response time |
| Real-time | Guarantee deadlines | Predictability |
| Distributed | Many machines, one system image | Resource sharing, reliability |

## Monolithic kernel vs microkernel

How much code runs in kernel mode is a design choice.

A **monolithic kernel** puts the scheduler, memory manager, file systems, network stack and device drivers in one program running in kernel mode, in one address space. Components call each other as ordinary functions, so it is fast. The cost is that a bug in any driver can crash or compromise the whole system. Linux and the BSDs are monolithic; Linux softens the rigidity with **loadable kernel modules**, so a driver can be added at run time.

A **microkernel** keeps only the minimum in kernel mode: address spaces, thread scheduling and **inter-process communication (IPC)**. File systems, drivers and the network stack run as separate user-mode server processes that talk by messages. A crashed driver can be restarted without a reboot, and the small kernel is easier to verify (seL4 has a formal proof of correctness). The cost is the extra message passing and mode switches on every service request. MINIX 3, QNX and seL4 are microkernels.

Most mainstream systems sit between: Windows NT and macOS (XNU, built from the Mach microkernel and BSD code) are usually called **hybrid** kernels, with a microkernel-like structure but most services still in kernel mode for speed.

| Aspect | Monolithic kernel | Microkernel |
| --- | --- | --- |
| In kernel mode | Almost all OS services and drivers | Only IPC, scheduling, basic memory |
| Communication | Function calls | Messages between processes |
| Speed | Faster | Slower (more IPC and mode switches) |
| Fault isolation | A driver bug can crash the kernel | A crashed server can be restarted |
| Size of trusted code | Large | Small, easier to verify |
| Examples | Linux, FreeBSD | MINIX 3, QNX, seL4 |

## Common mistakes

- Calling the kernel "the operating system": the kernel is one part of it; the shell, libraries and utilities are the rest.
- Saying `printf` is a system call. It is a library function; the system call it eventually makes is `write`.
- Treating a system call as a context switch. It is a mode switch inside the same process; a context switch changes which process runs.
- Mixing up multiprogramming and multitasking: only multitasking preempts on a timer.
- Calling any fast system "real-time". Real-time means deadlines are guaranteed, not that the system is quick on average.
- Saying a microkernel is always better. It trades speed for isolation, which is why most desktop kernels are monolithic or hybrid.

## Interview questions

**What is the difference between kernel mode and user mode?**
In kernel mode the CPU executes every instruction, including privileged ones such as I/O and changing page tables. In user mode those are refused, so a program can only reach the hardware by asking the kernel through a system call. A mode bit in the CPU records which mode is active.

**What happens when a program makes a system call?**
The library wrapper places the call number and arguments in registers and executes a trap instruction. The CPU switches to kernel mode, the kernel dispatches through its system call table, checks the arguments and does the work. It then returns the result and switches back to user mode.

**What is the difference between an interrupt, a trap and an exception?**
An interrupt comes from hardware and is asynchronous to the running program, such as a disk finishing a read. A trap is a deliberate, synchronous entry into the kernel, such as a system call. An exception is a synchronous error caught by the CPU, such as division by zero or a page fault; some books group traps and exceptions together.

**Why is the timer interrupt important?**
It guarantees the kernel regains the CPU periodically, even from a program in an infinite loop. Without it a process could keep the CPU forever, and preemptive scheduling would be impossible.

**What are privileged instructions? Give examples.**
Instructions that may only run in kernel mode because misuse would break protection: starting I/O directly, loading the page table base register, disabling interrupts, setting the timer and halting the CPU. Reading the clock or adding two numbers is not privileged.

**What is a hybrid kernel?**
A kernel structured like a microkernel, with separate subsystems and message-style interfaces, but with most services kept in kernel mode for performance. Windows NT and macOS's XNU are the usual examples.

**What is the role of the boot loader?**
Firmware cannot load a large kernel by itself, so it runs a small boot loader (such as GRUB) from the disk. The boot loader loads the kernel image into memory and jumps to it; the kernel then starts the first user process.

Next, read [Processes and Threads](/notes/operating-systems/processes-and-threads), or check yourself with the [Operating Systems (Basic) skill test](/skill-tests/os-basic).
