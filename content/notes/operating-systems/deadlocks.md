---
title: Deadlocks in Operating Systems
order: 6
minutes: 15
level: intermediate
updated: 2026-10-05
seo-title: Deadlock in OS: Conditions and Banker's Algorithm
description: Deadlocks in OS: the four Coffman conditions, resource allocation graphs, prevention, avoidance with a worked Banker's algorithm, detection and recovery.
question: What is a deadlock in an operating system?
answer: A deadlock is a state in which a set of processes are all blocked, each holding at least one resource and waiting for a resource held by another process in the set, so none of them can ever continue. It can occur only when four conditions hold together: mutual exclusion, hold and wait, no preemption and circular wait. Operating systems handle it by prevention, avoidance, detection and recovery, or by ignoring it.
q: What are the four necessary conditions for deadlock?
a: Mutual exclusion: a resource can be held by only one process at a time. Hold and wait: a process holds resources while waiting for more. No preemption: a resource cannot be taken away, only released voluntarily. Circular wait: a cycle of processes exists in which each waits for a resource held by the next. All four must hold at once.
q: What is the difference between deadlock prevention and deadlock avoidance?
a: Prevention makes deadlock structurally impossible by ensuring at least one of the four conditions can never hold, for example by ordering resources so circular wait cannot form. Avoidance allows all four conditions but checks every request at run time, granting it only if the system stays in a safe state, as the Banker's algorithm does.
q: What is a safe state in the Banker's algorithm?
a: A state is safe if there is at least one order, a safe sequence, in which every process can obtain its remaining maximum need from the available resources plus those released by the processes before it, and finish. A safe state cannot lead to deadlock. An unsafe state is not yet a deadlock, but it may lead to one.
q: Does a cycle in a resource allocation graph always mean deadlock?
a: Only if every resource in the cycle has a single instance. With several instances per resource type, a cycle is necessary but not sufficient: a process outside the cycle may hold an instance, finish and release it, which breaks the cycle. With single instances, a cycle means deadlock.
q: How do Linux and Windows handle deadlocks?
a: Neither prevents or avoids deadlocks between user processes. They take the so-called ostrich approach and leave it to applications, because the general mechanisms cost too much for a rare event. Inside the kernel, developers follow lock-ordering rules, and Linux has a debugging tool called lockdep that reports lock orders that could deadlock.
---

A **deadlock** is a standstill: a set of processes in which every process is waiting for something that only another process in the set can provide. Process P1 holds the printer and wants the scanner; P2 holds the scanner and wants the printer. Neither will release what it has, so both wait forever. Deadlocks come from ordinary, correct-looking code that grabs locks or devices in different orders, which is why every operating systems interview asks about them and many ask you to run the Banker's algorithm on paper.

## The system model

Resources come in **types** (CPU cycles, memory space, files, locks, printers), and each type has one or more identical **instances**. A process uses a resource in three steps: **request** it (waiting if it is not available), **use** it, and **release** it. A set of processes is deadlocked when every process in it is waiting for an event, usually a release, that only another process in the set can cause.

## The four necessary conditions

Coffman and his colleagues showed in 1971 that a deadlock can arise only if four conditions hold **at the same time**:

1. **Mutual exclusion.** At least one resource is non-shareable: only one process can use it at a time.
2. **Hold and wait.** A process holds at least one resource while waiting for others.
3. **No preemption.** A resource cannot be taken from a process; it is released only voluntarily.
4. **Circular wait.** There is a cycle P0 → P1 → … → Pn → P0 in which each process waits for a resource held by the next.

These are *necessary* conditions: remove any one and deadlock is impossible.

## The resource allocation graph

A **resource allocation graph (RAG)** shows the state at one moment. Processes are circles, resource types are rectangles with one dot per instance, a **request edge** P → R means P is waiting for R, and an **assignment edge** R → P means an instance of R is held by P.

- **No cycle**: no deadlock.
- **A cycle, and every resource in it has one instance**: deadlock.
- **A cycle with multi-instance resources**: possibly a deadlock, possibly not.

```text
Single instances:   P1 → R1 → P2 → R2 → P1        a cycle: P1 and P2 are deadlocked
```

For the multi-instance case, suppose R1 and R2 each have two instances. R1 is held by P2 and P3, R2 by P1 and P4, P1 requests R1 and P3 requests R2. The graph has the cycle P1 → R1 → P3 → R2 → P1, yet there is no deadlock: P4 needs nothing more, finishes and releases its R2, P3 takes it and finishes, and its R1 goes to P1.

When every resource has a single instance, the graph can be collapsed into a **wait-for graph** with only processes: an edge Pi → Pj means Pi waits for a resource Pj holds. Then a deadlock exists if and only if the wait-for graph has a cycle.

## Handling deadlocks

There are four strategies:

| Strategy | Idea | Cost |
| --- | --- | --- |
| Prevention | Make one of the four conditions impossible | Lower resource utilization, awkward programming rules |
| Avoidance | Grant a request only if the system stays safe | Needs every process's maximum claim in advance |
| Detection and recovery | Let deadlocks happen, find them, break them | Detection overhead, lost work on recovery |
| Ignore it | Assume deadlocks are rare (the "ostrich algorithm") | Occasional manual restarts |

General-purpose systems such as Linux and Windows take the last approach for user processes and leave deadlock handling to applications and databases.

## Deadlock prevention

Prevention attacks the conditions one at a time:

| Condition | How to break it | Drawback |
| --- | --- | --- |
| Mutual exclusion | Make resources shareable: read-only files, spooling for printers | Most resources, such as locks, are inherently exclusive |
| Hold and wait | Request every resource at once before starting, or release everything before asking for more | Poor utilization; a process needing many popular resources can starve |
| No preemption | If a request cannot be granted, release what you hold, or let the OS take resources from a waiting process | Works only for resources whose state can be saved, such as CPU registers and memory |
| Circular wait | Number the resource types and always request them in increasing order | Every programmer must follow the order |

Ordering is the method used most in practice: if every thread locks account A before account B whenever A's number is smaller, no cycle can ever form. A cycle would need some process to hold a higher-numbered resource while requesting a lower one, which the rule forbids.

## Deadlock avoidance

Avoidance needs extra information: each process declares in advance the **maximum** number of instances of each resource type it may ever need. The OS then grants a request only if the resulting state is **safe**.

A state is **safe** if there is a **safe sequence**: an order of all processes such that each one's remaining need can be met by the currently available resources plus everything released by the processes before it. If such an order exists, the OS can always run the processes to completion in that order, so no deadlock can happen.

An **unsafe** state is not a deadlock. It only means the OS can no longer guarantee to avoid one if processes request their maximums. Avoidance stays out of unsafe states altogether.

For single-instance resources, avoidance can use the RAG with **claim edges** (dashed P → R edges for future requests): a request is granted only if turning its claim edge into an assignment edge creates no cycle. For multiple instances, it uses the Banker's algorithm.

## The Banker's algorithm

Named after a banker who never lends cash in a way that leaves him unable to satisfy all his customers' credit limits. For n processes and m resource types it keeps:

- **Available[m]**: free instances of each type.
- **Max[n][m]**: each process's declared maximum.
- **Allocation[n][m]**: what each process holds now.
- **Need[n][m] = Max − Allocation**: what each process may still request.

**Safety algorithm.**

1. Set Work = Available and Finish[i] = false for every process.
2. Find a process i with Finish[i] = false and Need[i] ≤ Work (in every resource type). If none exists, go to step 4.
3. Pretend it runs to completion: Work = Work + Allocation[i], Finish[i] = true. Go to step 2.
4. The state is safe if every Finish[i] is true.

**Resource-request algorithm**, when process i asks for Request[i]:

1. If Request[i] > Need[i], it is an error: the process asked for more than it declared.
2. If Request[i] > Available, the process must wait: the resources are not free.
3. Otherwise pretend to grant it (Available −= Request, Allocation[i] += Request, Need[i] −= Request) and run the safety algorithm. If the new state is safe, grant the request; if not, restore the old state and make the process wait.

The safety check costs O(m × n²) per request.

## Worked example: Banker's algorithm

Five processes and three resource types with 8 instances of A, 6 of B and 7 of C.

| Process | Allocation (A B C) | Max (A B C) | Need = Max − Allocation |
| --- | --- | --- | --- |
| P0 | 1 1 0 | 4 3 2 | 3 2 2 |
| P1 | 2 0 1 | 3 2 2 | 1 2 1 |
| P2 | 1 2 1 | 3 4 3 | 2 2 2 |
| P3 | 0 1 2 | 1 3 4 | 1 2 2 |
| P4 | 2 0 0 | 5 2 3 | 3 2 3 |
| Total allocated | 6 4 4 | | |

Available = total − allocated = (8 6 7) − (6 4 4) = **(2 2 3)**.

**Is the state safe?** Each step picks the lowest-numbered unfinished process whose Need fits in Work:

| Step | Work before | Chosen | Need | Allocation released | Work after |
| --- | --- | --- | --- | --- | --- |
| 1 | 2 2 3 | P1 (P0 needs 3 A) | 1 2 1 | 2 0 1 | 4 2 4 |
| 2 | 4 2 4 | P0 | 3 2 2 | 1 1 0 | 5 3 4 |
| 3 | 5 3 4 | P2 | 2 2 2 | 1 2 1 | 6 5 5 |
| 4 | 6 5 5 | P3 | 1 2 2 | 0 1 2 | 6 6 7 |
| 5 | 6 6 7 | P4 | 3 2 3 | 2 0 0 | 8 6 7 |

Every process finishes, so the state is **safe** with the sequence P1, P0, P2, P3, P4. The final Work equals the total (8 6 7), a useful check. Other safe sequences exist too, such as P1, P3, P0, P2, P4; any one proves safety.

**Request 1: P4 asks for (1 0 1).** It is within P4's Need (3 2 3) and within Available (2 2 3). Pretend to grant it: Available becomes (1 2 2), P4's Allocation (3 0 1) and its Need (2 2 2). Safety check: P1's need (1 2 1) fits (1 2 2), so Work becomes (3 2 3); then P0 → (4 3 3), P2 → (5 5 4), P3 → (5 6 6) and P4 → (8 6 7). The new state is safe, so the request is **granted**.

**Request 2: P0 asks for (1 2 0),** starting again from the original state. It is within P0's Need (3 2 2) and within Available (2 2 3), so the resources are physically free. Pretend to grant it: Available becomes (1 0 3), P0's Need becomes (2 0 2). Now no process fits: P0 needs 2 of A but only 1 is free, and P1, P2, P3 and P4 each need 2 of B while none is free. The state would be **unsafe**, so the request is **denied** and P0 waits, even though the resources were there.

Two more requests show the first two checks: P4 asking for (3 0 0) must wait, because only 2 of A are available; P1 asking for (2 0 0) is an error, because its Need for A is only 1.

This program runs the same checks and prints the same answers:

```cpp
#include <cstdio>
#include <string>
#include <vector>
using namespace std;
using Matrix = vector<vector<int>>;

const Matrix MAX = {{4, 3, 2}, {3, 2, 2}, {3, 4, 3}, {1, 3, 4}, {5, 2, 3}};
const Matrix ALLOCATION = {{1, 1, 0}, {2, 0, 1}, {1, 2, 1}, {0, 1, 2}, {2, 0, 0}};
const vector<int> AVAILABLE = {2, 2, 3};
const int N = 5, M = 3;

bool fits(const vector<int>& a, const vector<int>& b) {
    for (int j = 0; j < M; j++) if (a[j] > b[j]) return false;
    return true;
}

vector<int> need(const Matrix& alloc, int i) {
    vector<int> row(M);
    for (int j = 0; j < M; j++) row[j] = MAX[i][j] - alloc[i][j];
    return row;
}

string join(const vector<int>& v) {
    string s;
    for (int j = 0; j < (int)v.size(); j++) s += (j ? " " : "") + to_string(v[j]);
    return s;
}

// Fills order with a safe sequence; returns false if the state is unsafe.
bool safeSequence(const Matrix& alloc, vector<int> work, string& order) {
    vector<bool> finished(N, false);
    for (int done = 0; done < N; done++) {
        int pick = -1;  // lowest-numbered unfinished process whose need fits in work
        for (int i = 0; i < N && pick == -1; i++)
            if (!finished[i] && fits(need(alloc, i), work)) pick = i;
        if (pick == -1) return false;
        for (int j = 0; j < M; j++) work[j] += alloc[pick][j];  // it finishes and releases
        finished[pick] = true;
        order += (done ? " P" : "P") + to_string(pick);
    }
    return true;
}

void request(int p, const vector<int>& req) {
    string label = "P" + to_string(p) + " requests " + join(req) + ": ";
    if (!fits(req, need(ALLOCATION, p))) { printf("%serror, more than its declared maximum\n", label.c_str()); return; }
    if (!fits(req, AVAILABLE)) { printf("%smust wait, not enough available\n", label.c_str()); return; }
    Matrix alloc = ALLOCATION;
    vector<int> avail = AVAILABLE;
    for (int j = 0; j < M; j++) { alloc[p][j] += req[j]; avail[j] -= req[j]; }
    string order;
    if (safeSequence(alloc, avail, order)) printf("%sgranted, safe sequence %s\n", label.c_str(), order.c_str());
    else printf("%sdenied, the state would be unsafe\n", label.c_str());
}

int main() {
    string rows;
    for (int i = 0; i < N; i++) rows += (i ? " | P" : "P") + to_string(i) + " " + join(need(ALLOCATION, i));
    printf("Need: %s\n", rows.c_str());
    string order;
    if (safeSequence(ALLOCATION, AVAILABLE, order)) printf("Initial state is safe: %s\n", order.c_str());
    else printf("Initial state is unsafe\n");
    request(4, {1, 0, 1});
    request(0, {1, 2, 0});
    request(4, {3, 0, 0});
    request(1, {2, 0, 0});
    return 0;
}
```

```java
import java.util.*;

public class Main {
    static final int[][] MAX = {{4, 3, 2}, {3, 2, 2}, {3, 4, 3}, {1, 3, 4}, {5, 2, 3}};
    static final int[][] ALLOCATION = {{1, 1, 0}, {2, 0, 1}, {1, 2, 1}, {0, 1, 2}, {2, 0, 0}};
    static final int[] AVAILABLE = {2, 2, 3};
    static final int N = MAX.length, M = AVAILABLE.length;

    static boolean fits(int[] a, int[] b) {
        for (int j = 0; j < M; j++) if (a[j] > b[j]) return false;
        return true;
    }

    static int[] need(int[][] alloc, int i) {
        int[] row = new int[M];
        for (int j = 0; j < M; j++) row[j] = MAX[i][j] - alloc[i][j];
        return row;
    }

    // Returns a safe sequence, or null if the state is unsafe.
    static List<String> safeSequence(int[][] alloc, int[] avail) {
        int[] work = avail.clone();
        boolean[] finished = new boolean[N];
        List<String> order = new ArrayList<>();
        while (order.size() < N) {
            int pick = -1; // lowest-numbered unfinished process whose need fits in work
            for (int i = 0; i < N && pick == -1; i++)
                if (!finished[i] && fits(need(alloc, i), work)) pick = i;
            if (pick == -1) return null;
            for (int j = 0; j < M; j++) work[j] += alloc[pick][j]; // it finishes and releases
            finished[pick] = true;
            order.add("P" + pick);
        }
        return order;
    }

    static String join(int[] v) {
        StringBuilder sb = new StringBuilder();
        for (int j = 0; j < v.length; j++) sb.append(j > 0 ? " " : "").append(v[j]);
        return sb.toString();
    }

    static void request(int p, int[] req) {
        String label = "P" + p + " requests " + join(req) + ": ";
        if (!fits(req, need(ALLOCATION, p))) { System.out.println(label + "error, more than its declared maximum"); return; }
        if (!fits(req, AVAILABLE)) { System.out.println(label + "must wait, not enough available"); return; }
        int[][] alloc = new int[N][];
        for (int i = 0; i < N; i++) alloc[i] = ALLOCATION[i].clone();
        int[] avail = AVAILABLE.clone();
        for (int j = 0; j < M; j++) { alloc[p][j] += req[j]; avail[j] -= req[j]; }
        List<String> order = safeSequence(alloc, avail);
        System.out.println(label + (order != null ? "granted, safe sequence " + String.join(" ", order)
                : "denied, the state would be unsafe"));
    }

    public static void main(String[] args) {
        List<String> need = new ArrayList<>();
        for (int i = 0; i < N; i++) need.add("P" + i + " " + join(need(ALLOCATION, i)));
        System.out.println("Need: " + String.join(" | ", need));
        List<String> order = safeSequence(ALLOCATION, AVAILABLE);
        System.out.println(order != null ? "Initial state is safe: " + String.join(" ", order) : "Initial state is unsafe");
        request(4, new int[]{1, 0, 1});
        request(0, new int[]{1, 2, 0});
        request(4, new int[]{3, 0, 0});
        request(1, new int[]{2, 0, 0});
    }
}
```

```python
MAX = [[4, 3, 2], [3, 2, 2], [3, 4, 3], [1, 3, 4], [5, 2, 3]]
ALLOCATION = [[1, 1, 0], [2, 0, 1], [1, 2, 1], [0, 1, 2], [2, 0, 0]]
AVAILABLE = [2, 2, 3]
N, M = len(MAX), len(AVAILABLE)


def fits(a, b):
    return all(x <= y for x, y in zip(a, b))


def need(alloc, i):
    return [MAX[i][j] - alloc[i][j] for j in range(M)]


def safe_sequence(alloc, avail):
    """A safe sequence, or None if the state is unsafe."""
    work, finished, order = avail[:], [False] * N, []
    while len(order) < N:
        # lowest-numbered unfinished process whose need fits in work
        pick = next((i for i in range(N) if not finished[i] and fits(need(alloc, i), work)), None)
        if pick is None:
            return None
        work = [w + a for w, a in zip(work, alloc[pick])]  # it finishes and releases
        finished[pick] = True
        order.append(f"P{pick}")
    return order


def request(p, req):
    label = f"P{p} requests {' '.join(map(str, req))}: "
    if not fits(req, need(ALLOCATION, p)):
        print(label + "error, more than its declared maximum")
        return
    if not fits(req, AVAILABLE):
        print(label + "must wait, not enough available")
        return
    alloc = [row[:] for row in ALLOCATION]
    alloc[p] = [a + r for a, r in zip(alloc[p], req)]
    avail = [a - r for a, r in zip(AVAILABLE, req)]
    order = safe_sequence(alloc, avail)
    print(label + ("granted, safe sequence " + " ".join(order) if order else "denied, the state would be unsafe"))


def main():
    rows = [f"P{i} " + " ".join(map(str, need(ALLOCATION, i))) for i in range(N)]
    print("Need: " + " | ".join(rows))
    order = safe_sequence(ALLOCATION, AVAILABLE)
    print("Initial state is safe: " + " ".join(order) if order else "Initial state is unsafe")
    request(4, [1, 0, 1])
    request(0, [1, 2, 0])
    request(4, [3, 0, 0])
    request(1, [2, 0, 0])


main()
```

```javascript
const MAX = [[4, 3, 2], [3, 2, 2], [3, 4, 3], [1, 3, 4], [5, 2, 3]];
const ALLOCATION = [[1, 1, 0], [2, 0, 1], [1, 2, 1], [0, 1, 2], [2, 0, 0]];
const AVAILABLE = [2, 2, 3];
const N = MAX.length, M = AVAILABLE.length;

const fits = (a, b) => a.every((x, j) => x <= b[j]);
const need = (alloc, i) => MAX[i].map((x, j) => x - alloc[i][j]);

// Returns a safe sequence, or null if the state is unsafe.
function safeSequence(alloc, avail) {
  const work = avail.slice(), finished = new Array(N).fill(false), order = [];
  while (order.length < N) {
    // lowest-numbered unfinished process whose need fits in work
    let pick = -1;
    for (let i = 0; i < N && pick === -1; i++) if (!finished[i] && fits(need(alloc, i), work)) pick = i;
    if (pick === -1) return null;
    for (let j = 0; j < M; j++) work[j] += alloc[pick][j]; // it finishes and releases
    finished[pick] = true;
    order.push("P" + pick);
  }
  return order;
}

function request(p, req) {
  const label = `P${p} requests ${req.join(" ")}: `;
  if (!fits(req, need(ALLOCATION, p))) return console.log(label + "error, more than its declared maximum");
  if (!fits(req, AVAILABLE)) return console.log(label + "must wait, not enough available");
  const alloc = ALLOCATION.map((row, i) => (i === p ? row.map((x, j) => x + req[j]) : row.slice()));
  const avail = AVAILABLE.map((x, j) => x - req[j]);
  const order = safeSequence(alloc, avail);
  console.log(label + (order ? "granted, safe sequence " + order.join(" ") : "denied, the state would be unsafe"));
}

function main() {
  const rows = [];
  for (let i = 0; i < N; i++) rows.push("P" + i + " " + need(ALLOCATION, i).join(" "));
  console.log("Need: " + rows.join(" | "));
  const order = safeSequence(ALLOCATION, AVAILABLE);
  console.log(order ? "Initial state is safe: " + order.join(" ") : "Initial state is unsafe");
  request(4, [1, 0, 1]);
  request(0, [1, 2, 0]);
  request(4, [3, 0, 0]);
  request(1, [2, 0, 0]);
}

main();
```

```output
Need: P0 3 2 2 | P1 1 2 1 | P2 2 2 2 | P3 1 2 2 | P4 3 2 3
Initial state is safe: P1 P0 P2 P3 P4
P4 requests 1 0 1: granted, safe sequence P1 P0 P2 P3 P4
P0 requests 1 2 0: denied, the state would be unsafe
P4 requests 3 0 0: must wait, not enough available
P1 requests 2 0 0: error, more than its declared maximum
```

The Banker's algorithm is rarely used as is in real systems: processes seldom know their maximum needs, the number of processes changes all the time, and checking every request is expensive. It is the standard way to explain what "safe" means.

## Deadlock detection and recovery

**Detection.** With single-instance resources, keep a wait-for graph and search it for a cycle, which takes O(n²) for n processes. With multiple instances, run an algorithm shaped like the safety algorithm, using each process's current **Request** instead of its Need, and starting with Finish[i] = true for any process that holds nothing. Every process left unfinished at the end is deadlocked.

A tiny example with two resource types and nothing available, (0 0):

| Process | Allocation | Request |
| --- | --- | --- |
| P0 | 1 0 | 0 1 |
| P1 | 0 1 | 1 0 |
| P2 | 1 1 | 0 0 |

P2 requests nothing, so it can finish and release (1 1); then P0's request fits, then P1's. No deadlock. If P2 instead requested (1 0), no process's request would fit (0 0), and all three would be deadlocked.

Running detection on every request is expensive, so systems run it periodically or when CPU utilization drops, a typical symptom of many blocked processes.

**Recovery** has two options:

- **Terminate processes**: abort all deadlocked processes (simple, but loses all their work), or abort one at a time and rerun detection after each. The victim is chosen by cost: priority, how long it has run, how many resources it holds, and whether it is interactive.
- **Preempt resources**: take resources from a victim and give them to others. The victim must be **rolled back** to a safe earlier state, often a full restart. To avoid starving the same victim repeatedly, the cost should include how many times it has already been rolled back.

## Deadlock vs starvation vs livelock

| Aspect | Deadlock | Starvation | Livelock |
| --- | --- | --- | --- |
| What happens | A set of processes block, each waiting on another | One process waits indefinitely while others run | Processes keep reacting to each other and never progress |
| State of the processes | Blocked | The victim waits; the rest progress | Running, changing state |
| CPU | Idle for those processes | Used by the others | Busy doing useless work |
| Typical cause | Circular wait on resources | Unfair scheduling or locking policy | Symmetric retry and back-off logic |
| Resolves on its own | Never | Possibly, if the load drops | Possibly, with random delays |
| Fix | Prevention, avoidance or detection | Aging, fair queues | Randomized back-off, ordering |

A livelock looks like two people in a corridor who both step aside the same way, again and again. In code, two threads that each release their first lock and retry whenever they cannot get the second one can keep doing so in step forever.

## Common mistakes

- Saying an unsafe state is a deadlock. It only means deadlock is possible; a safe state means it is impossible.
- Claiming any cycle in a RAG means deadlock. That is true only when each resource in the cycle has one instance.
- Forgetting the first two checks of the request algorithm: a request above Need is an error, and a request above Available simply waits.
- Computing Need as Max − Available instead of Max − Allocation.
- Thinking a safe sequence is unique. Several orders may work; finding one is enough.
- Calling the four conditions sufficient. They are necessary; with multi-instance resources they can all hold without a deadlock.

## Interview questions

**What is a deadlock? Give a real example.**
A set of processes each holding a resource and waiting for one held by another in the set, so none can proceed. Two threads that lock mutexes A then B and B then A respectively, at the same moment, deadlock this way.

**How can you prevent deadlock in a program that uses several locks?**
Impose a global order on the locks and always acquire them in that order, which makes circular wait impossible. Other options are acquiring all locks at once, or using try-lock with time-outs and releasing everything on failure.

**What information does the Banker's algorithm need, and why is that a limitation?**
It needs each process's maximum demand for each resource type in advance, plus a fixed set of processes and resources. Real programs rarely know their maximum needs, and processes come and go, which is why the algorithm is mostly used for teaching.

**What is the difference between deadlock avoidance and detection?**
Avoidance checks every request before granting it and keeps the system in safe states, so deadlock never happens. Detection grants requests freely, periodically checks whether a deadlock has formed, and then recovers by terminating processes or preempting resources.

**Can a system be in an unsafe state and not deadlock?**
Yes. Unsafe means the OS cannot guarantee completion if every process asks for its declared maximum. If processes request less, or release resources early, they may all finish.

**What is the difference between deadlock and starvation?**
In a deadlock no process in the set can ever proceed, because they wait on each other. In starvation the system as a whole progresses, but one process is repeatedly passed over; aging or fair queueing fixes it.

Next, read [Memory Management](/notes/operating-systems/memory-management), or work through the [Operating Systems (Intermediate) skill test](/skill-tests/os-intermediate).
