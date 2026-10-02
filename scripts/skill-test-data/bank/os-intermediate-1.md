---
skill: os
level: intermediate
---

## os-intermediate-001
topic: processes-threads
answer: C

How many times does this program print `x`? Assume every `fork()` succeeds.

```c
#include <stdio.h>
#include <unistd.h>

int main(void) {
    fork();
    fork() && fork();
    printf("x\n");
    return 0;
}
```

- A: 3
- B: 4
- C: 6
- D: 8

> The first `fork()` leaves two processes. Each of them then evaluates `fork() && fork()`: the left `fork()` makes a child, which sees 0, so `&&` short-circuits and the child skips the right `fork()`; the parent sees the child's PID (non-zero) and runs the right `fork()`, making one more process. Each of the two processes therefore becomes three: 6 processes, each printing once. Ignoring the short-circuit gives 2 × 2 × 2 = 8; forgetting the first line gives 3.

## os-intermediate-002
topic: processes-threads
answer: A

`out.txt` does not exist beforehand; headers and error checks are omitted.

```c
int fd = open("out.txt", O_WRONLY | O_CREAT | O_TRUNC, 0644);
if (fork() == 0) {
    write(fd, "child\n", 6);
    _exit(0);
}
wait(NULL);
write(fd, "parent\n", 7);
close(fd);
```

What does `out.txt` contain when the program ends?

- A: `child` then `parent`, one per line
- B: Only `parent`, written over the child's line
- C: Only `child`, since the child's exit closed the shared descriptor
- D: `parent` then `child`, one per line

> After `fork()` both descriptors refer to the same open file description, and the file offset lives there, not in the descriptor. The child's write moves the shared offset to 6, so the parent, which waited for the child, writes from 6 on. Had each process called `open()` itself, each would have its own offset starting at 0, and the parent's 7 bytes would cover the child's 6: only `parent`. `_exit` closes the child's copy of the descriptor, not the parent's.

## os-intermediate-003
topic: processes-threads
answer: A, C, E

After a successful `fork()` on Linux, which of these does the child get from its parent? Select all that apply.

- A: Its open file descriptors, sharing the same file offsets
- B: Its set of pending signals
- C: The signal handlers it installed
- D: Its process ID
- E: A copy of its heap and stack contents

> The child gets a duplicate of the descriptor table (each entry pointing at the same open file description, so offsets are shared), the parent's signal dispositions, and a logical copy of the whole address space, shared copy-on-write. It gets a new PID, and its set of pending signals starts empty, as fork(2) documents, so a signal sent to the parent before the fork is not delivered twice.

## os-intermediate-004
topic: processes-threads
answer: D

A user-level thread library runs four threads of a process on a single kernel thread (the many-to-one model), and it does not wrap or replace system calls. One of the four threads calls a blocking `read()` on a socket that has no data. What happens?

- A: Only that thread blocks, and the library runs the other three meanwhile
- B: The kernel moves the other three threads onto new kernel threads
- C: `read()` returns at once with an error, because user threads cannot block
- D: The whole process blocks: the kernel sees one thread, asleep in `read()`

> The kernel knows nothing about the library's threads: it schedules the one kernel thread, and that thread is now asleep inside `read()`. None of the other user threads can run until it returns. The same reason stops many-to-one threads from using two cores at once. The one-to-one model (each thread a kernel thread, as in Linux's NPTL) avoids both problems.

## os-intermediate-005
topic: processes-threads
answer: A, D

A process calls `execve()` successfully to run a new program. Which of these carry over into the new program? Select all that apply.

- A: The process ID
- B: The contents of the heap
- C: A handler function installed for `SIGINT` with `sigaction`
- D: Open file descriptors not marked close-on-exec
- E: The code (text) of the old program

> `exec` replaces the address space (text, data, heap and stack) but not the process: the PID stays, and open file descriptors stay open unless marked `FD_CLOEXEC`, which is how a shell sets up redirections between `fork()` and `exec()`. A caught signal is reset to its default action, because the handler's address means nothing in the new program (an ignored signal stays ignored).

## os-intermediate-006
topic: processes-threads
answer: B

In this fragment (headers and error checks omitted), the child forgets to close its copy of `fd[1]`.

```c
int fd[2];
pipe(fd);
if (fork() == 0) {                 /* child: the reader */
    char buf[64];
    while (read(fd[0], buf, sizeof buf) > 0)
        ;                          /* consume */
    exit(0);
}
close(fd[0]);                      /* parent: the writer */
write(fd[1], "hello", 5);
close(fd[1]);
wait(NULL);
```

What happens?

- A: The child reads the five bytes, then `read` returns 0 and both processes exit normally
- B: The child reads the five bytes, then it blocks in `read` and the parent in `wait`, forever
- C: The parent's `write` fails with `EPIPE`, because the parent closed its read end
- D: The child's `read` returns -1 with an error as soon as the parent closes its write end

> `read` on a pipe returns 0 (end of file) only when every write end in every process is closed. The child's own `fd[1]` is still open, so once the five bytes are drained its `read` blocks, waiting for data that only it could write, and the parent waits for the child forever. `EPIPE` needs every read end closed; the child still holds `fd[0]`. The fix is for the child to close `fd[1]` first thing.

## os-intermediate-007
topic: processes-threads
answer: D

Two processes exchange a large stream of records. Compared with message passing (pipes or message queues), what is true of shared memory once the region is set up?

- A: Each transfer still needs a system call, but the kernel copies the data only once
- B: The kernel serializes every access to the region, so no locking is needed
- C: It works only between threads of one process, never between processes
- D: Accesses are plain loads and stores, so the processes must synchronize themselves

> After `shmget`/`shmat` or `mmap(MAP_SHARED)`, both processes map the same physical frames, and data moves with plain loads and stores: no system call and no copy through the kernel. That speed comes without any synchronization, so the processes must add their own (a semaphore or mutex in the region). Message passing costs a system call and a copy per message, but `send` and `receive` synchronize the two sides for free.

## os-intermediate-008
topic: processes-threads
answer: D

On Linux, `pthread_create()` and `fork()` both create the new task with the `clone()` system call. What makes the new task a thread of the caller rather than a new process?

- A: A flag giving it a copy-on-write copy of the caller's memory instead
- B: It runs in kernel mode, while a new process runs in user mode
- C: It is scheduled by the C library, while processes are scheduled by the kernel
- D: Flags telling it to share the caller's memory, open files and signal handlers

> `clone()` takes flags saying what the new task shares: `CLONE_VM` (the address space), `CLONE_FILES`, `CLONE_FS`, `CLONE_SIGHAND` and `CLONE_THREAD` (the same thread group, so the same PID as far as user space can see). `fork()` passes none of them and gets a copy-on-write copy instead. Either way the kernel schedules the new task itself, since Linux threads are one-to-one, and both run in user mode.

## os-intermediate-009
topic: processes-threads
answer: D

A process has four threads. Thread 2 calls `fork()` (POSIX). How many threads does the child process start with?

- A: 4, copies of every thread
- B: 3, every thread except the caller
- C: 0, none until the child calls `exec()`
- D: 1, a copy of the thread that called `fork()`

> POSIX `fork()` copies the whole address space but only the calling thread. Any lock another thread held at that moment is copied in its locked state with no thread left to release it, which is why a multithreaded program should call only async-signal-safe functions in the child before `exec()`, and why `pthread_atfork` exists.

## os-intermediate-010
topic: scheduling
answer: B

Preemptive priority scheduling, where a smaller number means a higher priority, with Round Robin (quantum 2) among processes of equal priority. A newly arrived process preempts the running one only if its priority is strictly higher. Processes that arrive together join their queue in index order, and a process whose quantum ends goes to the tail of its priority's queue. Context switches take no time.

| Process | Arrival | Burst | Priority |
| --- | --- | --- | --- |
| P1 | 0 | 4 | 2 |
| P2 | 0 | 3 | 1 |
| P3 | 0 | 5 | 2 |
| P4 | 1 | 2 | 1 |

What is the average waiting time?

- A: 4.0
- B: 4.75
- C: 7.0
- D: 8.25

> Priority 1 goes first. P2 runs 0–2; P4 arrived at 1, so when P2's quantum ends the queue is P4, P2: P4 runs 2–4 and finishes, then P2 runs 4–5 and finishes. The priority-2 pair then alternates: P1 5–7, P3 7–9, P1 9–11 (done), P3 11–14 (done). Waiting times: P1 11 − 4 = 7, P2 5 − 3 = 2, P3 14 − 5 = 9, P4 4 − 1 − 2 = 1; 19 / 4 = 4.75. Serving equal priorities first-come, first-served gives 4.0; Round Robin that ignores priority gives 7.0; 8.25 is the average turnaround time.

## os-intermediate-011
topic: scheduling
answer: C

Shortest-remaining-time-first (preemptive SJF). A new arrival preempts the running process only if its burst is strictly shorter than the running process's remaining time.

| Process | Arrival | Burst |
| --- | --- | --- |
| P1 | 0 | 9 |
| P2 | 1 | 4 |
| P3 | 2 | 2 |
| P4 | 6 | 3 |

How many context switches occur, counting every change of the running process but not the first dispatch at time 0?

- A: 3
- B: 4
- C: 5
- D: 6

> The schedule is P1 0–1, P2 1–2, P3 2–4, P2 4–7, P4 7–10, P1 10–18: five changes of the running process. P3 preempts P2 at 2 because 2 < 3, while P4 does not preempt P2 at 6 because 3 > 1. Missing the preemption at 2 gives 4; non-preemptive SJF (P1, P3, P4, P2) gives 3; 6 counts the first dispatch. Each preemption is a switch a non-preemptive policy would not pay, the cost of SRTF's lower average waiting time.

## os-intermediate-012
topic: scheduling
answer: A

Three CPU-bound processes arrive at time 0 in the order P1, P2, P3, with bursts 8, 3 and 5. Under Round Robin, ignoring context-switch time, what is the average turnaround time with a quantum of 2, of 3 and of 4, in that order?

- A: 13.00, 12.00 and 12.67
- B: 13.00, 12.67 and 12.00
- C: 12.00, 12.67 and 13.00
- D: 7.67, 6.67 and 7.33

> Quantum 2: P2 finishes at 9, P3 at 14, P1 at 16, average 39 / 3 = 13.00. Quantum 3: P1 0–3, P2 3–6, P3 6–9, P1 9–12, P3 12–14, P1 14–16, so (16 + 6 + 14) / 3 = 12.00. Quantum 4: P1 0–4, P2 4–7, P3 7–11, P1 11–15, P3 15–16, so (15 + 7 + 16) / 3 = 12.67. Average turnaround does not fall steadily as the quantum grows; it depends on how many bursts finish within one quantum. D lists the average waiting times.

## os-intermediate-013
topic: scheduling
answer: C

A multilevel feedback queue has three queues: Q0 (Round Robin, quantum 4), Q1 (Round Robin, quantum 8) and Q2 (FCFS). New jobs enter Q0. A job that uses its whole quantum moves down one queue. A job in a higher queue preempts a job in a lower queue at once; the preempted job goes to the tail of its own queue and gets a fresh full quantum when it next runs. Job A arrives at time 0 needing 15 units of CPU; job B arrives at time 6 needing 5. Neither does I/O. At what time does B finish?

- A: 11
- B: 17
- C: 19
- D: 20

> A runs 0–4 in Q0, uses its quantum and drops to Q1, where it runs from 4. B arrives in Q0 at 6 and preempts A (9 units left). B runs 6–10, uses its quantum with 1 unit left, and drops to Q1 behind A. A gets a fresh quantum of 8 and runs 10–18 (1 left, drops to Q2). B runs 18–19 and finishes; A finishes at 20. 17 is what you get if A only finishes its interrupted quantum or if B never preempts it; 11 lets B finish in Q0.

## os-intermediate-014
topic: scheduling
answer: B

Preemptive priority scheduling, where a smaller number means a higher priority; a process preempts the running one only if its priority is strictly higher. Process L arrives at time 0 with priority 10. Jobs of priority 5 arrive at times 0, 4, 8, 12 and so on, and each needs exactly 4 units, so one of them is always ready. Aging lowers L's priority number by 1 for every 3 units it has waited (at times 3, 6, 9 and so on); the priority-5 jobs never wait, so they never age. When does L first get the CPU?

- A: 15
- B: 18
- C: 20
- D: Never

> L's number at time t is 10 − ⌊t / 3⌋: it reaches 5 at time 15, which only ties the running job, and 4 at time 18, which is strictly higher, so L preempts the job that started at 16. Breaking ties in L's favour gives 15; waiting for the running job to finish, as a non-preemptive scheduler would, gives 20; without aging, L starves and never runs.

## os-intermediate-015
topic: scheduling
answer: D

The CPU becomes free under non-preemptive Highest Response Ratio Next. Three processes are waiting:

| Process | Time waited so far | Burst |
| --- | --- | --- |
| A | 12 | 6 |
| B | 1 | 1 |
| C | 9 | 3 |

Which one runs next?

- A: A, which has waited longest
- B: B, which has the shortest burst
- C: B, which has the highest response ratio
- D: C, which has the highest response ratio

> The response ratio is (time waited + burst) / burst: A (12 + 6) / 6 = 3, B (1 + 1) / 1 = 2, C (9 + 3) / 3 = 4. C runs. Option C inverts the ratio (burst over the total). FCFS would pick A and SJF would pick B; HRRN favours short jobs, but a job's ratio grows the longer it waits, which is a built-in form of aging.

## os-intermediate-016
topic: scheduling
answer: B

Round Robin with a 10 ms quantum, and a 1 ms context switch at every dispatch. Every process is I/O-bound: it runs for 3 ms, then blocks for I/O. Assuming a ready process is always available, what fraction of CPU time does useful work?

- A: 30%
- B: 75%
- C: 90%
- D: 90.9%

> Each dispatch costs 1 ms of switching and gets 3 ms of work, because the process blocks long before its quantum expires and the next one is dispatched at once: 3 / (3 + 1) = 75%. 90.9% (10 / 11) assumes every process uses its full quantum; 90% subtracts the switch from the quantum; 30% treats the unused part of the quantum as idle time.

## os-intermediate-017
topic: scheduling
answer: C

Round Robin with six processes that are always ready, a 10 ms quantum and a 2 ms context switch between every two consecutive quanta. Every process uses its full quantum. After P1's quantum ends, how long is it until P1 starts running again?

- A: 50 ms
- B: 60 ms
- C: 62 ms
- D: 72 ms

> The other five processes each run a quantum (50 ms), and there are six switches: P1 to P2, P2 to P3, and so on up to P6 back to P1 (12 ms), so 62 ms. 60 counts only five switches, 72 adds a sixth quantum, and 50 ignores switching. This delay grows as n × (q + s), which is why the quantum cannot simply be made large.

## os-intermediate-018
topic: scheduling
answer: D

A multilevel feedback queue demotes a job only when it uses up a whole quantum; a job that gives up the CPU early keeps its level. A CPU-bound program issues a tiny I/O request just before each quantum would end. What happens, and what closes the loophole?

- A: It is demoted anyway, because issuing the I/O request counts as using up its quantum; no fix is needed
- B: It stays in the top queue, but Round Robin there limits it to a fair share; no fix is needed
- C: It is demoted and then starves below; the fix is to boost every job to the top queue periodically
- D: It stays on top and hogs the CPU; the fix is to charge its total time at a level against an allotment

> Because it never uses a full quantum, the rule never demotes it, so a CPU-bound job runs at top priority alongside interactive jobs and starves everything below. The fix (as in OSTEP's MLFQ) is to account for the total CPU time a job uses at a level, however many times it gives up the CPU, and demote it once that allotment is used. A periodic boost solves a different problem: starvation and jobs that change behaviour.

## os-intermediate-019
topic: synchronization
answer: A

A bounded buffer of N slots. The producer takes `mutex` before `empty`:

```text
semaphore mutex = 1, empty = N, full = 0;

producer:                  consumer:
  item = produce();          wait(full);
  wait(mutex);               wait(mutex);
  wait(empty);               item = take();
  put(item);                 signal(mutex);
  signal(mutex);             signal(empty);
  signal(full);              consume(item);
```

What can go wrong?

- A: When the buffer is full, a producer sleeps on `empty` holding `mutex`, and consumers block on `mutex`: deadlock
- B: When the buffer is empty, a consumer sleeps on `full` holding `mutex`, and producers block on `mutex`: deadlock
- C: Two producers can write the same slot, because `mutex` is released too early
- D: Nothing, because the order of two `wait` calls never matters, only the order of `signal` calls

> With the buffer full, `empty` is 0: a producer takes `mutex`, then sleeps on `empty` without releasing it. The only thing that could raise `empty` is a consumer, and every consumer now blocks on `mutex`. The consumer is safe as written, because it waits on `full` before it takes `mutex`. Swapping two `wait` calls is exactly what causes this; swapping two `signal` calls is harmless.

## os-intermediate-020
topic: synchronization
answer: A, E

Semaphores `x = 1` and `y = 0`. Three threads each run once, concurrently:

```text
T1: wait(x); print("1"); signal(y);
T2: wait(y); print("2"); signal(x);
T3: wait(x); print("3"); signal(y);
```

Which outputs are possible? Select all that apply.

- A: `123`
- B: `132`
- C: `213`
- D: `312`
- E: `321`

> `x = 1` lets exactly one of T1 and T3 print first; it then signals `y`. T2, which can only start after a `signal(y)`, prints 2 and signals `x`, and only then can the other of T1 and T3 print. So 2 is always in the middle: `123` or `321`. `213` is impossible because `y` starts at 0, and `132`/`312` because the second of T1 and T3 needs the `x` that only T2 gives back.

## os-intermediate-021
topic: synchronization
answer: A

This is the classic first readers–writers solution:

```text
semaphore mutex = 1, wrt = 1;  int readcount = 0;

reader:                             writer:
  wait(mutex);                        wait(wrt);
  readcount++;                        write();
  if (readcount == 1) wait(wrt);      signal(wrt);
  signal(mutex);
  read();
  wait(mutex);
  readcount--;
  if (readcount == 0) signal(wrt);
  signal(mutex);
```

Readers arrive so often that at least one is always reading. What happens to a writer that arrives?

- A: It waits on `wrt` indefinitely, because new readers keep joining and `readcount` never drops to 0
- B: It gets in once the current readers finish, because `wait(wrt)` queues it ahead of new readers
- C: It writes at once, because `wrt` only keeps other writers out, never readers
- D: It writes while the readers are reading, because readers hold only `mutex`, not `wrt`

> Only the first reader of a group takes `wrt`, and only the last one releases it. Later readers just increment `readcount`; they never touch `wrt`, so they do not queue behind the waiting writer. As long as readers overlap, `wrt` stays held and the writer starves. This is the reader-preference variant; writer-preference or a fair (FIFO) entry semaphore fixes it.

## os-intermediate-022
topic: synchronization
answer: A

The same readers–writers solution:

```text
semaphore mutex = 1, wrt = 1;  int readcount = 0;

reader:                             writer:
  wait(mutex);                        wait(wrt);
  readcount++;                        write();
  if (readcount == 1) wait(wrt);      signal(wrt);
  signal(mutex);
  read();
  wait(mutex);
  readcount--;
  if (readcount == 0) signal(wrt);
  signal(mutex);
```

A writer is inside `write()`. Reader R1 arrives, then reader R2. Where is each one blocked?

- A: R1 on `wrt`, while holding `mutex`; R2 on `mutex`
- B: R1 and R2 both on `wrt`
- C: R1 on `mutex`; R2 on `wrt`, while holding `mutex`
- D: R1 and R2 both on `mutex`

> R1 takes `mutex`, makes `readcount` 1 and, as the first reader, waits on `wrt`, still holding `mutex`. R2 then blocks on `mutex`. When the writer signals `wrt`, R1 proceeds and releases `mutex`; R2 takes it, sees `readcount` become 2 and goes straight to reading without touching `wrt`.

## os-intermediate-023
topic: synchronization
answer: B, C, E

Five philosophers sit at a round table with five chopsticks, one between each pair; each chopstick is a semaphore initialised to 1. Each philosopher runs `wait(left); wait(right); eat(); signal(left); signal(right);`, which can deadlock. Which changes make deadlock impossible? Select all that apply.

- A: Each philosopher waits a random delay before picking up the left chopstick
- B: A counting semaphore initialised to 4 lets at most four philosophers reach for chopsticks at a time
- C: Philosopher 4 picks up the right chopstick first; the other four still pick up the left first
- D: Every philosopher picks up the right chopstick first instead of the left
- E: Inside a monitor, a philosopher picks up both chopsticks only when both are free

> Deadlock needs all five holding one chopstick and waiting for the next: a circular wait. With at most four contending for five chopsticks, at least one of them can get both (B). One philosopher taking them in the opposite order breaks the cycle (C), and taking both at once removes hold-and-wait (E). A random delay only makes the bad timing less likely, and having everyone start with the right is the same deadlock in a mirror.

## os-intermediate-024
topic: synchronization
answer: A

A variant of Peterson's algorithm for two processes:

```text
// shared: bool flag[2] = {false, false};  int turn;
// process i, where j = 1 - i:
flag[i] = true;
turn = i;                     // Peterson's algorithm has turn = j here
while (flag[j] && turn == j)
    ;                         // busy-wait
/* critical section */
flag[i] = false;
```

Assuming sequentially consistent memory, which property of a correct solution does this variant lose?

- A: Mutual exclusion: both processes can be in the critical section at once
- B: Progress: both processes can spin forever in the entry section
- C: Bounded waiting only: one process can be overtaken forever, though never both inside at once
- D: None: the variant is still correct

> Let P0 run its whole entry section alone: `flag[0] = true`, `turn = 0`, and `flag[1]` is false, so it enters. Now P1 sets `flag[1] = true` and `turn = 1`, then tests `flag[0] && turn == 0`; `turn` is 1, so the test is false and P1 enters too. In Peterson's algorithm each process sets `turn` to the other ("you go first"), so the one that writes `turn` last is the one that waits.

## os-intermediate-025
topic: synchronization
answer: C

`test_and_set(&lock)` atomically sets `lock` to true and returns its old value. Several threads run:

```text
// shared: bool lock = false;
while (true) {
    while (test_and_set(&lock))
        ;               // spin
    /* critical section */
    lock = false;
    /* remainder section */
}
```

Which requirement of the critical-section problem does this lock fail to guarantee?

- A: Mutual exclusion
- B: Progress
- C: Bounded waiting
- D: None; it guarantees all three

> Only the thread whose `test_and_set` returns false enters, so mutual exclusion holds, and whenever the lock is free some spinning thread's next `test_and_set` succeeds, so progress holds. But nothing orders the spinners: a thread can lose the race every time the lock is released and wait without bound. A ticket lock, or the textbook version that hands the lock to the next waiting thread in turn, adds bounded waiting.

## os-intermediate-026
topic: synchronization
answer: A

A monitor uses signal-and-continue (Mesa) semantics. A consumer is written as:

```text
if (count == 0)
    wait(notEmpty);
item = remove();
```

Why should the `if` be a `while`?

- A: Another consumer may empty the buffer before the woken one re-enters the monitor
- B: `wait()` keeps holding the monitor lock, so the consumer must poll the condition
- C: `signal()` wakes every waiting consumer, and a loop lets only one of them through
- D: A condition variable counts signals like a semaphore, and the loop uses up extras

> Under Mesa semantics `signal()` only moves a waiter to the ready set; the signaller keeps running, and by the time the woken consumer re-acquires the monitor, another thread may have taken the item. POSIX condition variables also allow spurious wakeups. `wait()` releases the monitor lock atomically, `signal()` wakes at most one waiter (broadcast wakes all), and a condition variable has no memory: a signal with no waiter is lost.

## os-intermediate-027
topic: synchronization
answer: A

One CPU, fixed-priority preemptive scheduling, with priorities H > M > L. Locking and unlocking take no time.

- L arrives at 0, runs 1 unit, locks mutex R, needs 3 more units before it unlocks R, then exits.
- H arrives at 2, runs 1 unit, then needs R for 1 unit, then exits.
- M arrives at 3 and needs 5 units, with no locks.

When does H finish without priority inheritance, and when with it?

- A: 11 without, 6 with
- B: 11 without, 11 with
- C: 8 without, 6 with
- D: 6 without, 6 with

> Without inheritance: L runs 0–2 (it locks R at 1), H preempts and runs 2–3, then blocks on R at 3. M (above L) arrives at 3 and runs 3–8; only then does L finish its critical section, 8–10, and H runs 10–11. H waited on M, a task it shares nothing with: priority inversion. With inheritance, L runs at H's priority from 3, so M cannot preempt it: L 3–5 releases R, H runs 5–6, then M runs 6–11.
