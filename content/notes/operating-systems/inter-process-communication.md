---
title: Inter-Process Communication
order: 12
minutes: 11
level: intermediate
updated: 2026-10-05
seo-title: IPC in OS: Pipes, Shared Memory, Message Queues
description: Inter-process communication in OS: shared memory vs message passing, pipes and FIFOs, message queues, sockets and signals, compared, with C examples.
question: What is inter-process communication in an operating system?
answer: Inter-process communication (IPC) is the set of mechanisms an operating system provides for separate processes to exchange data and coordinate, since each process has its own protected address space. There are two basic models, shared memory and message passing. Common mechanisms are pipes, named pipes (FIFOs), message queues, shared memory segments, sockets and signals.
q: What are the two models of inter-process communication?
a: Shared memory, where processes map the same region of memory and read and write it directly, and message passing, where processes exchange messages through the kernel with send and receive operations. Shared memory is faster once set up but needs explicit synchronization; message passing is simpler, safer and works across machines.
q: Which IPC mechanism is the fastest?
a: Shared memory, because after it is set up processes read and write the same physical pages with ordinary memory instructions and no system calls. Pipes, message queues and sockets copy data into the kernel and out again on every transfer. The cost of shared memory is that the processes must synchronize access themselves, for example with semaphores.
q: What is the difference between a pipe and a named pipe?
a: An ordinary pipe has no name and exists only while processes hold its descriptors, so it can connect only related processes, typically a parent and its child that inherited it through fork. A named pipe, or FIFO, has a name in the file system, so any process with permission can open it, and the name persists until it is deleted.
q: What is a signal in an operating system?
a: A signal is a small asynchronous notification sent to a process by the kernel or another process, identified only by its number, such as SIGINT when you press Ctrl+C or SIGKILL to force termination. The process can ignore it, run a handler, or take the default action, except for SIGKILL and SIGSTOP, which can be neither caught nor ignored.
q: What is the difference between a message queue and a pipe?
a: A pipe carries an unstructured byte stream in one direction and its data disappears when the processes close it. A message queue carries discrete messages with boundaries, and often types or priorities, so a reader can pick particular messages, and the queue exists in the kernel until it is explicitly removed, even with no process attached.
---

Processes are isolated on purpose: each has its own address space, so one cannot read or overwrite another's memory. But programs often need to cooperate. A shell connects `ls` to `wc`, a web server hands requests to worker processes, a browser's tabs talk to its main process. **Inter-process communication (IPC)** is the set of kernel-provided channels that let processes exchange data and signal each other without giving up that isolation. This note covers the two underlying models and the mechanisms built on them.

## Why processes communicate

Cooperating processes are used for **information sharing** (several programs reading one data set), **computation speed-up** (splitting work across processes on several cores), **modularity** (building a system from separate programs, as Unix pipelines and microservices do) and **convenience** (a user editing, compiling and printing at once). Threads of one process share memory already, so they need synchronization but not IPC; separate processes need both.

## Shared memory vs message passing

Every IPC mechanism follows one of two models.

In **shared memory**, the processes ask the kernel to map one region of physical memory into each of their address spaces. After that setup, they exchange data by ordinary reads and writes, with no kernel involvement, which makes it the fastest form of IPC. The processes themselves are responsible for not writing at the same time: a race on shared memory is exactly the problem of [Process Synchronization](/notes/operating-systems/process-synchronization), usually solved with a semaphore or mutex placed in the shared region.

In **message passing**, the processes call `send(message)` and `receive(message)`, and the kernel copies the message from the sender to the receiver. It costs a system call and a copy per message, but there is nothing to corrupt, it is easier to get right, and the same model works between machines.

| Aspect | Shared memory | Message passing |
| --- | --- | --- |
| How data moves | Read and write a common region | The kernel copies each message |
| Speed | Fastest after setup | Slower: system call and copy per message |
| Synchronization | The programmer's job | Built in: receive waits for a message |
| Best for | Large or frequent data on one machine | Smaller messages, and communication between machines |
| Risk | Races, corrupted shared data | Kernel overhead |
| Examples | POSIX `shm_open` with `mmap`, System V `shmget` | Pipes, message queues, sockets |

### Design choices in message passing

- **Direct or indirect.** In direct communication, a process names its partner: `send(P, msg)`. In indirect communication, messages go to a **mailbox** (also called a port), and any process sharing the mailbox can receive them.
- **Blocking or non-blocking.** A blocking (synchronous) send waits until the message is received; a non-blocking send returns at once. A blocking receive waits until a message arrives; a non-blocking receive returns a message or nothing. When both sides block, the exchange is a **rendezvous**.
- **Buffering.** The link's queue has **zero capacity** (the sender must wait for the receiver, a rendezvous), **bounded capacity** (the sender waits only when the queue is full) or, in theory, **unbounded capacity** (the sender never waits).

## Pipes

An **ordinary pipe** (anonymous pipe) is a one-way byte stream inside the kernel. `pipe(fd)` creates it and returns two file descriptors: `fd[0]` is the read end and `fd[1]` the write end. Since it has no name, other processes can reach it only by inheriting the descriptors, so pipes connect **related processes**, typically a parent and the child it forks.

```c
#include <stdio.h>
#include <string.h>
#include <sys/wait.h>
#include <unistd.h>

int main(void) {
    int fd[2];                          /* fd[0]: read end, fd[1]: write end */
    if (pipe(fd) == -1) return 1;
    if (fork() == 0) {                  /* child: the reader */
        char buf[32];
        close(fd[1]);                   /* close the end it does not use */
        ssize_t n = read(fd[0], buf, sizeof buf - 1);
        buf[n > 0 ? n : 0] = '\0';
        printf("child read: %s\n", buf);
        return 0;
    }
    close(fd[0]);                       /* parent: the writer */
    write(fd[1], "hello", 5);
    close(fd[1]);                       /* the reader now sees end of file */
    wait(NULL);
    return 0;
}
```

Rules worth knowing:

- Each process should **close the end it does not use**. A reader sees end of file only when every write end is closed; a forgotten write end in the reader itself means it waits forever.
- Writing to a pipe whose read ends are all closed raises the signal **SIGPIPE** in the writer.
- The pipe has a fixed kernel buffer (64 KB by default on Linux). A writer blocks when it is full and a reader blocks when it is empty, which is the bounded buffer of [Classic Synchronization Problems](/notes/operating-systems/classic-synchronization-problems), done by the kernel.
- A shell pipeline such as `ls | wc -l` is two processes joined by an ordinary pipe: the shell creates the pipe, forks twice and connects one process's standard output to the other's standard input.

For two-way communication, use two pipes, one in each direction.

## Named pipes (FIFOs)

A **named pipe**, or **FIFO**, is a pipe with a name in the file system, created with `mkfifo`. Any process with permission can open the name, so FIFOs connect **unrelated processes** on the same machine. The name persists after the processes exit, until it is deleted, although the data inside does not. On Unix a FIFO is still one-way and byte-oriented, and opening one end blocks until the other end is opened too. Windows named pipes are different: they can be two-way and can even work between machines on a network.

```bash
mkfifo /tmp/jobs          # create the FIFO
cat /tmp/jobs &           # a reader waits on it
echo "build" > /tmp/jobs  # a writer in another process; the reader prints build
```

## Message queues

A **message queue** is a linked list of messages kept by the kernel. Unlike a pipe's byte stream, it preserves **message boundaries**: each receive returns one whole message. System V queues (`msgget`, `msgsnd`, `msgrcv`) give each message a **type**, so a receiver can ask for messages of one type; POSIX queues (`mq_open`, `mq_send`, `mq_receive`) give each a **priority**, and the highest-priority message is received first. A queue exists until it is explicitly removed, even if no process has it open, so a sender and a receiver need not run at the same time.

## Shared memory segments

With POSIX shared memory, one process creates a named object and both map it:

```c
#include <fcntl.h>
#include <string.h>
#include <sys/mman.h>
#include <unistd.h>

int main(void) {
    int fd = shm_open("/demo", O_CREAT | O_RDWR, 0600);   /* create or open by name */
    ftruncate(fd, 4096);                                   /* set its size */
    char *p = mmap(NULL, 4096, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
    strcpy(p, "hello from shared memory");                 /* a plain memory write */
    munmap(p, 4096);
    close(fd);
    return 0;               /* a reader maps "/demo" the same way; shm_unlink removes it */
}
```

Once mapped, the data never passes through the kernel again. The segment outlives the processes until `shm_unlink` (or System V's `shmctl` with `IPC_RMID`) removes it.

## Sockets

A **socket** is an endpoint for two-way communication, identified on a network by an **IP address and a port** (for example 192.168.1.10:8080). Sockets are the only common IPC mechanism that works **between machines**, and they are the foundation of client-server systems: web servers, databases and chat applications all use them.

- **Stream sockets** (TCP) give a reliable, ordered byte stream over a connection.
- **Datagram sockets** (UDP) send independent messages that may be lost or reordered.
- **Unix domain sockets** use a file-system path instead of an address and work only on one machine, faster than TCP over the loopback interface; many local services, such as database servers, offer one.

A server calls `socket`, `bind`, `listen` and `accept`; a client calls `socket` and `connect`; both then `send` and `recv`.

## Signals

A **signal** is an asynchronous notification sent to a process to tell it that an event happened. It carries no data beyond its number. Signals come from the kernel (an illegal memory access raises SIGSEGV), from other processes (`kill(pid, SIGTERM)`) or from the terminal (Ctrl+C sends SIGINT).

| Signal | Usual cause | Default action |
| --- | --- | --- |
| SIGINT | Ctrl+C in the terminal | Terminate |
| SIGTERM | A polite request to exit (`kill` with no option) | Terminate |
| SIGKILL | Forced termination (`kill -9`) | Terminate; cannot be caught or ignored |
| SIGSEGV | Invalid memory access | Terminate with a core dump |
| SIGCHLD | A child process stopped or exited | Ignore |
| SIGSTOP | Pause the process | Stop; cannot be caught or ignored |
| SIGPIPE | Writing to a pipe with no reader | Terminate |

A process can accept the default action, ignore the signal, or install a **handler** that runs when it arrives:

```c
#include <signal.h>
#include <stdio.h>
#include <unistd.h>

static volatile sig_atomic_t stop = 0;
static void on_sigint(int sig) { (void)sig; stop = 1; }    /* keep handlers tiny */

int main(void) {
    struct sigaction sa = {0};
    sa.sa_handler = on_sigint;
    sigaction(SIGINT, &sa, NULL);   /* Ctrl+C now runs on_sigint instead of killing us */
    while (!stop) pause();          /* sleep until a signal arrives */
    printf("caught SIGINT, shutting down cleanly\n");
    return 0;
}
```

Standard signals are not queued: if the same signal arrives twice before it is handled, the process may see it once. Signals suit notifications such as "reload your configuration" or "a child exited", never bulk data.

## Comparing the mechanisms

| Mechanism | Direction | Between | Data | Lives until |
| --- | --- | --- | --- | --- |
| Shared memory | Both ways | Processes on one machine that map it | Raw bytes, no structure | Explicitly removed |
| Ordinary pipe | One way | Related processes | Byte stream | All its descriptors are closed |
| Named pipe (FIFO) | One way on Unix | Any processes on one machine | Byte stream | The name is deleted |
| Message queue | Both ways | Any processes on one machine | Discrete messages with types or priorities | Explicitly removed |
| Socket | Both ways | Same or different machines | Stream (TCP) or datagrams (UDP) | Closed |
| Signal | One way | Any process you may signal | A signal number only | Delivered or discarded |

## Common mistakes

- Saying shared memory needs no synchronization because it is fast. Speed comes precisely from the kernel staying out, so the processes must coordinate themselves.
- Saying an ordinary pipe can connect any two processes. Without a name, only processes that inherit its descriptors can use it.
- Forgetting to close unused pipe ends, so the reader never sees end of file.
- Treating a pipe as two-way. A Unix pipe is one-way; use two pipes or a socket pair.
- Claiming SIGKILL can be handled. SIGKILL and SIGSTOP can be neither caught nor ignored.
- Assuming message boundaries survive in a pipe or TCP stream. Two writes may arrive as one read; message queues and UDP keep boundaries.

## Interview questions

**Why is shared memory faster than message passing?**
After the region is mapped, processes exchange data with ordinary memory instructions, without system calls or copies. Message passing enters the kernel and copies the data twice, from the sender into a kernel buffer and from there to the receiver, for every message.

**How does a shell implement `ls | wc -l`?**
It creates a pipe, forks a child for `ls` that makes the pipe's write end its standard output, and forks a child for `wc -l` that makes the read end its standard input. Each child closes the ends it does not use and calls `exec` on its program; the shell closes both ends and waits.

**When would you use a socket instead of a pipe?**
When the processes may be on different machines, when they are unrelated and need a two-way channel, or when a server must accept connections from many clients. For two related processes on one machine, a pipe is simpler.

**What happens when a process writes to a full pipe, or reads from an empty one?**
The writer blocks until a reader removes data, and the reader blocks until data arrives. If all write ends are closed, a read on an empty pipe returns end of file instead of blocking.

**What is the difference between blocking and non-blocking message passing?**
A blocking send waits until the message is received and a blocking receive waits until a message arrives. Non-blocking calls return at once, with the message or with nothing, and the process checks again later.

**Can signals be used to send data between processes?**
Not in any practical sense. A standard signal carries only its number and does not queue, so it is a notification mechanism. Data should go through a pipe, queue, socket or shared memory, with a signal at most announcing that it is there.

You have reached the end of the operating systems notes. Go back to the [Operating Systems notes](/notes/operating-systems) to revise any topic, then take the [Operating Systems (Basic)](/skill-tests/os-basic) and [Operating Systems (Intermediate)](/skill-tests/os-intermediate) skill tests.
