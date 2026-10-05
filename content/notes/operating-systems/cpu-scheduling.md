---
title: CPU Scheduling Algorithms
order: 3
minutes: 15
level: intermediate
updated: 2026-10-05
seo-title: CPU Scheduling in OS: FCFS, SJF, SRTF, Round Robin
description: CPU scheduling in operating systems: FCFS, SJF, SRTF, priority with aging, Round Robin and multilevel queues, all run on one example with Gantt charts.
question: What is CPU scheduling in an operating system?
answer: CPU scheduling is how the operating system decides which ready process runs on the CPU next and for how long. The short-term scheduler picks a process from the ready queue using a policy such as FCFS, SJF, SRTF, priority or Round Robin, aiming to keep the CPU busy while keeping waiting, turnaround and response times low and treating processes fairly.
q: What is the difference between preemptive and non-preemptive scheduling?
a: In non-preemptive scheduling a process keeps the CPU until it finishes or blocks for I/O. In preemptive scheduling the OS can take the CPU away, for example when a time slice ends or a higher-priority process arrives. FCFS and SJF are non-preemptive; SRTF and Round Robin are preemptive; priority scheduling can be either.
q: How do you calculate turnaround time and waiting time?
a: Turnaround time is completion time minus arrival time. Waiting time is turnaround time minus burst time, which is the total time the process spent in the ready queue. Response time is the time of first execution minus arrival time. Averages are the sums divided by the number of processes.
q: Which CPU scheduling algorithm is the best?
a: None is best for every goal. SJF gives the minimum average waiting time for a set of processes that arrive together, and SRTF does the same when they arrive over time, but both need burst times nobody knows in advance and can starve long jobs. Round Robin gives the best response time for interactive work. Real systems combine ideas in multilevel feedback queues.
q: What is the convoy effect?
a: The convoy effect happens in FCFS when one long CPU-bound process holds the CPU while many short processes wait behind it, like cars stuck behind a slow truck. Average waiting time rises sharply and I/O devices sit idle, because the short I/O-bound processes cannot run to issue their next request.
q: What is aging in CPU scheduling?
a: Aging is gradually raising the priority of a process the longer it waits in the ready queue. It prevents starvation in priority scheduling: however low a process's priority starts, it eventually becomes high enough to run. A scheduler might, for example, raise a waiting process's priority by one level every few hundred milliseconds.
q: What happens if the time quantum in Round Robin is too large or too small?
a: If the quantum is larger than every burst, Round Robin behaves exactly like FCFS. If it is very small, the CPU spends a large share of its time on context switches instead of useful work. A common textbook rule of thumb is to choose a quantum longer than most CPU bursts, so that most processes finish a burst within one slice.
---

The **CPU scheduler** decides which process in the ready queue runs next. A process alternates between **CPU bursts** (computing) and **I/O bursts** (waiting for a disk, the network or the user); whenever the running process blocks or is interrupted, the scheduler has to choose again. The choice decides how long everyone waits, so it is the most-asked computation topic in operating systems. This note defines the measures, then runs one example through every standard algorithm.

## Scheduling criteria

| Measure | Definition | Goal |
| --- | --- | --- |
| CPU utilization | Fraction of time the CPU does useful work | Maximize |
| Throughput | Processes completed per unit time | Maximize |
| Turnaround time (TAT) | Completion time − arrival time | Minimize |
| Waiting time (WT) | Turnaround time − burst time (time spent in the ready queue) | Minimize |
| Response time (RT) | First time on the CPU − arrival time | Minimize |

Scheduling decisions happen when a process (1) switches from running to waiting, (2) is interrupted from running back to ready, (3) moves from waiting to ready, or (4) terminates. A **non-preemptive** scheduler only decides in cases 1 and 4: once a process has the CPU it keeps it until it blocks or ends. A **preemptive** scheduler can also take the CPU away in cases 2 and 3.

The **dispatcher** carries the decision out: it performs the context switch, switches to user mode and jumps into the chosen process. The time it takes is the **dispatch latency**.

## The example used throughout

Four processes, times in milliseconds. For priority scheduling a **smaller number means higher priority** (a convention; always check which one a question uses).

| Process | Arrival | Burst | Priority |
| --- | --- | --- | --- |
| P1 | 0 | 7 | 3 |
| P2 | 2 | 4 | 1 |
| P3 | 4 | 1 | 4 |
| P4 | 5 | 4 | 2 |

The total burst is 16, and the CPU is never idle, so every schedule below ends at time 16. Ties are broken by earlier arrival.

## First-Come, First-Served (FCFS)

The ready queue is a FIFO queue: whoever arrived first runs first, to completion. It is non-preemptive, simple and fair in the sense of order, but one long process makes everyone behind it wait.

```text
| P1 0-7 | P2 7-11 | P3 11-12 | P4 12-16 |
```

| Process | Completion | Turnaround | Waiting |
| --- | --- | --- | --- |
| P1 | 7 | 7 | 0 |
| P2 | 11 | 9 | 5 |
| P3 | 12 | 8 | 7 |
| P4 | 16 | 11 | 7 |
| Average | | 35/4 = 8.75 | 19/4 = 4.75 |

P3 needs one millisecond but waits seven. That is the **convoy effect**: short processes queue behind a long one, and the I/O devices sit idle because the I/O-bound processes cannot run to issue their next request.

## Shortest Job First (SJF)

When the CPU is free, run the ready process with the **shortest next CPU burst**. Non-preemptive SJF is provably optimal for average waiting time when all processes are available at once, because moving a short job ahead of a long one reduces the short job's wait more than it increases the long one's.

At time 0 only P1 has arrived, so it runs to 7. At 7, P2 (4), P3 (1) and P4 (4) are ready: P3 is shortest, then P2 and P4 tie at 4 and P2 arrived first.

```text
| P1 0-7 | P3 7-8 | P2 8-12 | P4 12-16 |
```

| Process | Completion | Turnaround | Waiting |
| --- | --- | --- | --- |
| P1 | 7 | 7 | 0 |
| P2 | 12 | 10 | 6 |
| P3 | 8 | 4 | 3 |
| P4 | 16 | 11 | 7 |
| Average | | 32/4 = 8 | 16/4 = 4 |

The catch is that the OS does not know the next burst. It predicts it with an **exponential average** of past bursts: τ(n+1) = α·t(n) + (1 − α)·τ(n), where t(n) is the burst just measured and τ(n) the previous guess. With α = 0.5, an initial guess of 10 and measured bursts of 6 and then 4, the predictions are 0.5·6 + 0.5·10 = 8 and then 0.5·4 + 0.5·8 = 6. SJF can also **starve** a long job if short ones keep arriving.

## Shortest Remaining Time First (SRTF)

SRTF is preemptive SJF: whenever a process arrives, compare its burst with the **remaining** time of the running process and switch if the newcomer is shorter.

- 0 to 2: P1 runs (remaining 5 at time 2).
- 2: P2 arrives with 4 < 5, so it preempts P1.
- 4: P3 arrives with 1 < P2's remaining 2, so P3 runs and finishes at 5.
- 5: P4 arrives with 4. Remaining times are P1 5, P2 2, P4 4, so P2 runs to 7.
- 7: P4 (4) beats P1 (5), so P4 runs to 11, then P1 runs to 16.

```text
| P1 0-2 | P2 2-4 | P3 4-5 | P2 5-7 | P4 7-11 | P1 11-16 |
```

| Process | Completion | Turnaround | Waiting | Response |
| --- | --- | --- | --- | --- |
| P1 | 16 | 16 | 9 | 0 |
| P2 | 7 | 5 | 1 | 0 |
| P3 | 5 | 1 | 0 | 0 |
| P4 | 11 | 6 | 2 | 2 |
| Average | | 28/4 = 7 | 12/4 = 3 | 2/4 = 0.5 |

SRTF gives the lowest average waiting time of any algorithm here, which is what theory predicts, but it makes the most context switches and has the same starvation risk as SJF.

## Priority scheduling

Each process has a priority and the CPU goes to the highest-priority ready process. SJF is the special case where priority is the predicted burst.

**Non-preemptive.** P1 runs 0 to 7. At 7, P2 (1), P4 (2) and P3 (4) are ready, in that priority order.

```text
| P1 0-7 | P2 7-11 | P4 11-15 | P3 15-16 |
```

**Preemptive.** P1 runs 0 to 2. P2 (priority 1) preempts it and runs 2 to 6; P3 and P4 arrive meanwhile but are lower. At 6, P4 (2) beats P1 (3) and P3 (4), runs 6 to 10, then P1 finishes at 15 and P3 at 16.

```text
| P1 0-2 | P2 2-6 | P4 6-10 | P1 10-15 | P3 15-16 |
```

| Process | Non-preemptive TAT | Non-preemptive WT | Preemptive TAT | Preemptive WT |
| --- | --- | --- | --- | --- |
| P1 | 7 | 0 | 15 | 8 |
| P2 | 9 | 5 | 4 | 0 |
| P3 | 12 | 11 | 12 | 11 |
| P4 | 10 | 6 | 5 | 1 |
| Average | 9.5 | 5.5 | 9 | 5 |

P3, the lowest priority, waits 11 ms in both versions. Under a steady stream of higher-priority work it could wait forever: that is **starvation** (indefinite blocking). The fix is **aging**: raise a process's priority the longer it waits, so it is eventually served.

## Round Robin (RR)

Round Robin is FCFS with preemption by a timer. Each process runs for at most one **time quantum** q, then goes to the back of the ready queue. It is the basis of time-sharing, because no process waits more than (n − 1)·q before its next turn when n processes are ready.

With q = 2, and the usual convention that a process arriving at the instant a quantum expires joins the queue **before** the preempted process:

| Time | Runs | Queue afterwards |
| --- | --- | --- |
| 0-2 | P1 | P2, P1 |
| 2-4 | P2 | P1, P3, P2 |
| 4-6 | P1 | P3, P2, P4, P1 |
| 6-7 | P3 (done) | P2, P4, P1 |
| 7-9 | P2 (done) | P4, P1 |
| 9-11 | P4 | P1, P4 |
| 11-13 | P1 | P4, P1 |
| 13-15 | P4 (done) | P1 |
| 15-16 | P1 (done) | empty |

| Process | Completion | Turnaround | Waiting | Response |
| --- | --- | --- | --- | --- |
| P1 | 16 | 16 | 9 | 0 |
| P2 | 9 | 7 | 3 | 0 |
| P3 | 7 | 3 | 2 | 2 |
| P4 | 15 | 10 | 6 | 4 |
| Average | | 36/4 = 9 | 20/4 = 5 | 6/4 = 1.5 |

**Choosing the quantum.** If q is larger than every burst, RR becomes FCFS. If q is tiny, most CPU time goes into context switches. A common textbook rule of thumb is that most CPU bursts (around 80%) should be shorter than q, while q stays much longer than a context switch. Average waiting time does not change smoothly with q either: on this example q = 2 gives 5, q = 3 gives 7 and q = 4 gives 4.5.

## Multilevel queue and multilevel feedback queue

A **multilevel queue** splits the ready queue into several queues by process type, for example system, interactive and batch, each with its own algorithm (RR for interactive, FCFS for batch). Queues are served in fixed priority order, or each gets a share of CPU time. A process stays in its queue for life.

A **multilevel feedback queue (MLFQ)** lets processes move between queues based on behaviour. A typical setup:

- Queue 0: RR with q = 8. Every new process starts here.
- Queue 1: RR with q = 16. A process that used its whole quantum in queue 0 drops here.
- Queue 2: FCFS, for processes that used their whole quantum in queue 1 too.

A lower queue runs only when all higher queues are empty. Short, interactive processes finish or block within a quantum and stay high; long CPU-bound ones sink. Aging moves a process that has waited too long back up. An MLFQ is defined by the number of queues, each queue's algorithm, and the rules for moving up and down.

Real kernels are not one textbook algorithm. Linux's CFS scheduler, succeeded by EEVDF in kernel 6.6, shares CPU time between tasks in proportion to their weights instead of using fixed queues, while Windows uses preemptive scheduling over 32 priority levels.

## Comparing the algorithms

The same four processes under each algorithm:

| Algorithm | Avg waiting | Avg turnaround | Avg response | Preemptive | Can starve |
| --- | --- | --- | --- | --- | --- |
| FCFS | 4.75 | 8.75 | 4.75 | No | No |
| SJF | 4 | 8 | 4 | No | Yes |
| SRTF | 3 | 7 | 0.5 | Yes | Yes |
| Priority (non-preemptive) | 5.5 | 9.5 | 5.5 | No | Yes |
| Priority (preemptive) | 5 | 9 | 3 | Yes | Yes |
| Round Robin, q = 2 | 5 | 9 | 1.5 | Yes | No |

Round Robin loses on waiting time to SJF and SRTF but nearly matches SRTF on response time, without needing to know any burst length.

## Simulating FCFS and Round Robin

This program replays the FCFS and Round Robin schedules above and prints the averages, using the same queueing rule for arrivals at a quantum boundary.

```cpp
#include <algorithm>
#include <cstdio>
#include <deque>
#include <string>
#include <vector>
using namespace std;

const vector<string> NAMES = {"P1", "P2", "P3", "P4"};
const vector<int> ARRIVAL = {0, 2, 4, 5};  // sorted by arrival
const vector<int> BURST = {7, 4, 1, 4};
const int N = 4;

void report(const string& name, const vector<string>& gantt, const vector<int>& finish) {
    double waiting = 0, turnaround = 0;
    for (int i = 0; i < N; i++) {
        int tat = finish[i] - ARRIVAL[i];
        turnaround += tat;
        waiting += tat - BURST[i];
    }
    string line;
    for (size_t k = 0; k < gantt.size(); k++) line += (k ? " | " : "") + gantt[k];
    printf("%s: %s\n", name.c_str(), line.c_str());
    printf("%s average waiting %.2f, turnaround %.2f\n", name.c_str(), waiting / N, turnaround / N);
}

string slice(int i, int from, int to) {
    return NAMES[i] + " " + to_string(from) + "-" + to_string(to);
}

void fcfs() {
    vector<string> gantt;
    vector<int> finish(N);
    int time = 0;
    for (int i = 0; i < N; i++) {
        time = max(time, ARRIVAL[i]);
        gantt.push_back(slice(i, time, time + BURST[i]));
        time += BURST[i];
        finish[i] = time;
    }
    report("FCFS", gantt, finish);
}

void roundRobin(int quantum) {
    vector<string> gantt;
    vector<int> left = BURST, finish(N);
    deque<int> ready;
    int next = 0, time = 0;
    while (next < N || !ready.empty()) {
        if (ready.empty()) time = max(time, ARRIVAL[next]);
        while (next < N && ARRIVAL[next] <= time) ready.push_back(next++);
        int i = ready.front();
        ready.pop_front();
        int run = min(quantum, left[i]);
        gantt.push_back(slice(i, time, time + run));
        time += run;
        left[i] -= run;
        // arrivals during the slice queue ahead of the preempted process
        while (next < N && ARRIVAL[next] <= time) ready.push_back(next++);
        if (left[i] > 0) ready.push_back(i);
        else finish[i] = time;
    }
    report("RR q=" + to_string(quantum), gantt, finish);
}

int main() {
    fcfs();
    roundRobin(2);
    return 0;
}
```

```java
import java.util.*;

public class Main {
    static final String[] NAMES = {"P1", "P2", "P3", "P4"};
    static final int[] ARRIVAL = {0, 2, 4, 5}; // sorted by arrival
    static final int[] BURST = {7, 4, 1, 4};
    static final int N = NAMES.length;

    static void report(String name, List<String> gantt, int[] finish) {
        double waiting = 0, turnaround = 0;
        for (int i = 0; i < N; i++) {
            int tat = finish[i] - ARRIVAL[i];
            turnaround += tat;
            waiting += tat - BURST[i];
        }
        System.out.println(name + ": " + String.join(" | ", gantt));
        System.out.println(String.format(Locale.ROOT, "%s average waiting %.2f, turnaround %.2f",
                name, waiting / N, turnaround / N));
    }

    static void fcfs() {
        List<String> gantt = new ArrayList<>();
        int[] finish = new int[N];
        int time = 0;
        for (int i = 0; i < N; i++) {
            time = Math.max(time, ARRIVAL[i]);
            gantt.add(NAMES[i] + " " + time + "-" + (time + BURST[i]));
            time += BURST[i];
            finish[i] = time;
        }
        report("FCFS", gantt, finish);
    }

    static void roundRobin(int quantum) {
        List<String> gantt = new ArrayList<>();
        int[] left = BURST.clone(), finish = new int[N];
        ArrayDeque<Integer> ready = new ArrayDeque<>();
        int next = 0, time = 0;
        while (next < N || !ready.isEmpty()) {
            if (ready.isEmpty()) time = Math.max(time, ARRIVAL[next]);
            while (next < N && ARRIVAL[next] <= time) ready.add(next++);
            int i = ready.poll();
            int run = Math.min(quantum, left[i]);
            gantt.add(NAMES[i] + " " + time + "-" + (time + run));
            time += run;
            left[i] -= run;
            // arrivals during the slice queue ahead of the preempted process
            while (next < N && ARRIVAL[next] <= time) ready.add(next++);
            if (left[i] > 0) ready.add(i);
            else finish[i] = time;
        }
        report("RR q=" + quantum, gantt, finish);
    }

    public static void main(String[] args) {
        fcfs();
        roundRobin(2);
    }
}
```

```python
from collections import deque

NAMES = ["P1", "P2", "P3", "P4"]
ARRIVAL = [0, 2, 4, 5]  # sorted by arrival
BURST = [7, 4, 1, 4]
N = len(NAMES)


def report(name, gantt, finish):
    turnaround = [finish[i] - ARRIVAL[i] for i in range(N)]
    waiting = [turnaround[i] - BURST[i] for i in range(N)]
    print(f"{name}: {' | '.join(gantt)}")
    print(f"{name} average waiting {sum(waiting) / N:.2f}, turnaround {sum(turnaround) / N:.2f}")


def fcfs():
    gantt, finish, time = [], [0] * N, 0
    for i in range(N):
        time = max(time, ARRIVAL[i])
        gantt.append(f"{NAMES[i]} {time}-{time + BURST[i]}")
        time += BURST[i]
        finish[i] = time
    report("FCFS", gantt, finish)


def round_robin(quantum):
    gantt, finish, left = [], [0] * N, BURST[:]
    ready, nxt, time = deque(), 0, 0
    while nxt < N or ready:
        if not ready:
            time = max(time, ARRIVAL[nxt])
        while nxt < N and ARRIVAL[nxt] <= time:
            ready.append(nxt)
            nxt += 1
        i = ready.popleft()
        run = min(quantum, left[i])
        gantt.append(f"{NAMES[i]} {time}-{time + run}")
        time += run
        left[i] -= run
        # arrivals during the slice queue ahead of the preempted process
        while nxt < N and ARRIVAL[nxt] <= time:
            ready.append(nxt)
            nxt += 1
        if left[i] > 0:
            ready.append(i)
        else:
            finish[i] = time
    report(f"RR q={quantum}", gantt, finish)


def main():
    fcfs()
    round_robin(2)


main()
```

```javascript
const NAMES = ["P1", "P2", "P3", "P4"];
const ARRIVAL = [0, 2, 4, 5]; // sorted by arrival
const BURST = [7, 4, 1, 4];
const N = NAMES.length;

function report(name, gantt, finish) {
  let waiting = 0, turnaround = 0;
  for (let i = 0; i < N; i++) {
    const tat = finish[i] - ARRIVAL[i];
    turnaround += tat;
    waiting += tat - BURST[i];
  }
  console.log(`${name}: ${gantt.join(" | ")}`);
  console.log(`${name} average waiting ${(waiting / N).toFixed(2)}, turnaround ${(turnaround / N).toFixed(2)}`);
}

function fcfs() {
  const gantt = [], finish = new Array(N).fill(0);
  let time = 0;
  for (let i = 0; i < N; i++) {
    time = Math.max(time, ARRIVAL[i]);
    gantt.push(`${NAMES[i]} ${time}-${time + BURST[i]}`);
    time += BURST[i];
    finish[i] = time;
  }
  report("FCFS", gantt, finish);
}

function roundRobin(quantum) {
  const gantt = [], finish = new Array(N).fill(0), left = BURST.slice(), ready = [];
  let next = 0, time = 0;
  while (next < N || ready.length > 0) {
    if (ready.length === 0) time = Math.max(time, ARRIVAL[next]);
    while (next < N && ARRIVAL[next] <= time) ready.push(next++);
    const i = ready.shift();
    const run = Math.min(quantum, left[i]);
    gantt.push(`${NAMES[i]} ${time}-${time + run}`);
    time += run;
    left[i] -= run;
    // arrivals during the slice queue ahead of the preempted process
    while (next < N && ARRIVAL[next] <= time) ready.push(next++);
    if (left[i] > 0) ready.push(i);
    else finish[i] = time;
  }
  report(`RR q=${quantum}`, gantt, finish);
}

function main() {
  fcfs();
  roundRobin(2);
}

main();
```

```output
FCFS: P1 0-7 | P2 7-11 | P3 11-12 | P4 12-16
FCFS average waiting 4.75, turnaround 8.75
RR q=2: P1 0-2 | P2 2-4 | P1 4-6 | P3 6-7 | P2 7-9 | P4 9-11 | P1 11-13 | P4 13-15 | P1 15-16
RR q=2 average waiting 5.00, turnaround 9.00
```

## Common mistakes

- Computing waiting time as start time − arrival time under a preemptive algorithm. That is response time; waiting time is turnaround − burst and counts every stretch in the ready queue.
- Comparing a newcomer under SRTF with the running process's **original** burst instead of its remaining time.
- Forgetting idle gaps: if no process has arrived yet, the CPU idles and the timeline jumps to the next arrival.
- Reading a larger priority number as higher priority without checking the question's convention.
- In Round Robin, putting the preempted process ahead of a process that arrived at the same instant; most textbooks queue the newcomer first, and the answer changes if you do not.
- Saying Round Robin cannot starve because it is fair, then claiming the same for SJF. SJF and priority scheduling can starve; FCFS and RR cannot.

## Interview questions

**Why is SJF optimal, and why is it not used directly?**
Running the shortest job first minimizes the total time everyone else spends waiting behind it, which gives the minimum average waiting time for a fixed set of jobs. It is impractical because the next CPU burst is unknown, so it must be predicted, and long jobs can starve.

**What is the difference between SJF and SRTF?**
SJF is non-preemptive: a chosen process runs its whole burst. SRTF is its preemptive version: a newly arrived process with a shorter burst than the running process's remaining time takes the CPU.

**How does the time quantum affect Round Robin?**
A very large quantum turns RR into FCFS and hurts response time. A very small quantum gives quick responses but wastes CPU time on context switches. The quantum should be large compared with the context-switch time and longer than most CPU bursts.

**What is starvation, and how does aging solve it?**
Starvation is a ready process waiting indefinitely because others are always preferred, as with a low-priority process in priority scheduling. Aging raises a process's priority the longer it waits, so it eventually reaches the top and runs.

**What is the difference between a multilevel queue and a multilevel feedback queue?**
In a multilevel queue a process is assigned to one queue permanently. In a multilevel feedback queue it moves: using a whole quantum pushes it down, and waiting too long (aging) can move it up, so the scheduler learns which processes are interactive.

**Which algorithms are preemptive?**
SRTF, Round Robin and preemptive priority scheduling. FCFS and SJF are non-preemptive, and multilevel queues are usually preemptive between queues.

**What is the difference between turnaround time and response time?**
Turnaround time runs from arrival to completion and matters for batch jobs. Response time runs from arrival to the first moment on the CPU and matters for interactive programs, where the user wants to see something start.

Next, read [Process Synchronization](/notes/operating-systems/process-synchronization), or practise these computations in the [Operating Systems (Intermediate) skill test](/skill-tests/os-intermediate).
