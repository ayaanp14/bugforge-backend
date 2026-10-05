---
title: Disk Scheduling Algorithms
order: 11
minutes: 11
level: intermediate
updated: 2026-10-05
seo-title: Disk Scheduling in OS: FCFS, SSTF, SCAN, C-SCAN, LOOK
description: Disk scheduling in OS: seek time and rotational latency, then FCFS, SSTF, SCAN, C-SCAN, LOOK and C-LOOK on one queue with total head movement.
question: What is disk scheduling in an operating system?
answer: Disk scheduling is how the operating system orders pending read and write requests for a hard disk to reduce the time spent moving the read-write head. Because seek time dominates a disk access, algorithms such as SSTF, SCAN, C-SCAN, LOOK and C-LOOK reorder the queue to cut total head movement, trading it against fairness and starvation, while FCFS serves requests in arrival order.
q: Which disk scheduling algorithm is best?
a: There is no single best one. SSTF usually gives the least head movement but can starve requests far from the head. SCAN and LOOK give good throughput with no starvation, and C-SCAN and C-LOOK give the most uniform waiting times. LOOK or C-LOOK is a common choice for a busy hard disk; for an SSD, which has no head, simple FCFS ordering is enough.
q: What is the difference between SCAN and LOOK?
a: SCAN moves the head all the way to the last cylinder in its direction of travel before reversing, even if no request lies there. LOOK reverses as soon as it has served the last request in that direction. LOOK therefore never travels further than SCAN and usually less.
q: What is the difference between SCAN and C-SCAN?
a: SCAN serves requests in both directions, sweeping up and then back down like a lift. C-SCAN serves requests in one direction only: after reaching the end it jumps straight back to the other end without serving anything and starts again. C-SCAN gives more uniform waiting times, because cylinders in the middle are not visited twice as often as the edges.
q: What are seek time and rotational latency?
a: Seek time is the time for the disk arm to move the head to the cylinder holding the data. Rotational latency is the time for the wanted sector to rotate under the head once it is there, on average half a rotation. Together with the transfer time they make up the access time of a hard disk request.
q: Why does SSTF cause starvation?
a: SSTF always serves the pending request closest to the current head position. If new requests keep arriving near the head, a request at a far cylinder is never the closest, so it can wait indefinitely. SCAN-family algorithms avoid this because the head sweeps across the whole disk in order.
---

A hard disk serves one request at a time, and the slow part of each request is mechanical: moving the arm to the right track. When many processes have I/O requests pending, the order in which the operating system serves them can change the total time by several times. **Disk scheduling** is choosing that order. Interviewers give a request queue and a starting head position and ask for the total head movement under each algorithm, so this note works one queue through all six.

## How a disk access is timed

A hard disk has spinning **platters**, each divided into concentric **tracks**, and each track into **sectors**. The tracks at the same position on every platter form a **cylinder**. One arm moves all the read-write heads together, so requests are described by cylinder number.

Serving one request costs three things:

| Component | Meaning |
| --- | --- |
| Seek time | Moving the arm to the right cylinder; it grows with the distance moved |
| Rotational latency | Waiting for the wanted sector to spin under the head; half a rotation on average |
| Transfer time | Reading or writing the data as it passes under the head |

**Access time = seek time + rotational latency + transfer time.**

**Worked example.** A disk spins at 7,200 RPM, has an average seek time of 9 ms and transfers 100 MB/s (100 × 10⁶ bytes per second). One rotation takes 60 ÷ 7,200 s = 8.33 ms, so the average rotational latency is 8.33 ÷ 2 = 4.17 ms. Transferring a 4 KB block takes 4,096 ÷ 100,000,000 s = 0.04 ms. The average access time is 9 + 4.17 + 0.04 ≈ **13.2 ms**, almost all of it mechanical. That is why the schedulers below minimize **head movement**: the total number of cylinders the head travels, used as a stand-in for seek time.

## The example used throughout

- Cylinders numbered **0 to 199**.
- The head is at cylinder **70**, and for the sweeping algorithms it is moving **towards higher numbers** (towards 199).
- The request queue, in arrival order: **120, 35, 180, 10, 95, 160, 50, 130**.

Sorted, the requests above the head are 95, 120, 130, 160, 180, and below it 50, 35, 10.

Always check a question's conventions: which way the head is moving, whether SCAN goes to the last cylinder, and whether the return jump of C-SCAN and C-LOOK is counted.

## FCFS (First-Come, First-Served)

Serve requests in the order they arrived. It is fair and never starves anyone, but the head swings wildly across the disk.

```text
70 → 120 → 35 → 180 → 10 → 95 → 160 → 50 → 130
```

Movement: 50 + 85 + 145 + 170 + 85 + 65 + 110 + 80 = **790 cylinders**.

## SSTF (Shortest Seek Time First)

Always serve the pending request **closest** to the current head position, whatever direction it lies in.

From 70, the nearest request is 50 (20 away, against 95 at 25). From 50 the nearest is 35, then 10. Only then does the head turn and go up through 95, 120, 130, 160 and 180.

```text
70 → 50 → 35 → 10 → 95 → 120 → 130 → 160 → 180
```

Movement: 20 + 15 + 25 + 85 + 25 + 10 + 30 + 20 = **230 cylinders**.

SSTF is the SJF of disks: it greatly reduces movement, but a request far from the head can **starve** while new requests keep arriving near it. It is not optimal either: its greedy choices can make the head zig-zag, and on some queues a planned sweep moves less.

## SCAN (the elevator algorithm)

The head moves in one direction serving every request it passes, goes on **to the end of the disk**, then reverses and serves the requests on the way back, like a lift that goes to the top floor before coming down.

```text
70 → 95 → 120 → 130 → 160 → 180 → 199 → 50 → 35 → 10
```

Movement: up from 70 to 199 is 129, then down from 199 to 10 is 189, so **318 cylinders**.

SCAN cannot starve a request: every cylinder is passed within two sweeps. Its weakness is uneven waiting. Just after the head turns, the requests right behind it were served moments ago, while those at the far end have waited longest; cylinders near the middle are passed twice as often as those at the edges.

## C-SCAN (Circular SCAN)

Serve requests in **one direction only**. On reaching the end of the disk, the head returns to cylinder 0 **without serving anything** and sweeps upward again, treating the cylinders as a circle.

```text
70 → 95 → 120 → 130 → 160 → 180 → 199 → (return to 0) → 10 → 35 → 50
```

Movement: 70 to 199 is 129, the return from 199 to 0 is 199, and 0 to 50 is 50, so **378 cylinders** counting the return, or **179** if the return jump is not counted. Textbooks differ on this; say which you use.

C-SCAN moves more than SCAN but gives **more uniform waiting times**, because every cylinder is visited once per cycle in the same direction.

## LOOK and C-LOOK

LOOK and C-LOOK are SCAN and C-SCAN with one change: the head goes only **as far as the last request** in its direction, never to the physical end of the disk.

**LOOK**: up to the highest request, then reverse.

```text
70 → 95 → 120 → 130 → 160 → 180 → 50 → 35 → 10
```

Movement: 70 to 180 is 110, then 180 down to 10 is 170, so **280 cylinders**.

**C-LOOK**: up to the highest request, then jump to the **lowest pending request** and sweep up again.

```text
70 → 95 → 120 → 130 → 160 → 180 → (jump to 10) → 10 → 35 → 50
```

Movement: 70 to 180 is 110, the jump from 180 to 10 is 170, and 10 to 50 is 40, so **320 cylinders** counting the jump, or **150** without it.

## Comparing the algorithms

| Algorithm | Service order after 70 | Total movement | Starvation | Waiting-time spread |
| --- | --- | --- | --- | --- |
| FCFS | 120, 35, 180, 10, 95, 160, 50, 130 | 790 | No | High |
| SSTF | 50, 35, 10, 95, 120, 130, 160, 180 | 230 | Possible | High |
| SCAN | 95, 120, 130, 160, 180, (199), 50, 35, 10 | 318 | No | Medium |
| C-SCAN | 95, 120, 130, 160, 180, (199, 0), 10, 35, 50 | 378 (179 without the return) | No | Low |
| LOOK | 95, 120, 130, 160, 180, 50, 35, 10 | 280 | No | Medium |
| C-LOOK | 95, 120, 130, 160, 180, 10, 35, 50 | 320 (150 without the jump) | No | Low |

SSTF moves least on this queue, LOOK beats SCAN and C-LOOK beats C-SCAN because neither travels to an edge with no request there, and FCFS is worst by a wide margin. The ranking depends on the queue; the pattern of LOOK ≤ SCAN and C-LOOK ≤ C-SCAN always holds.

## Computing the totals

This program builds each algorithm's service order from the same queue and adds up the head movement, counting the return jumps of C-SCAN and C-LOOK.

```cpp
#include <algorithm>
#include <cstdio>
#include <cstdlib>
#include <string>
#include <vector>
using namespace std;

const int HEAD = 70, LAST = 199;  // head position, last cylinder; the head is moving up
const vector<int> QUEUE = {120, 35, 180, 10, 95, 160, 50, 130};

vector<int> sstf() {
    vector<int> left = QUEUE, path = {HEAD};
    int at = HEAD;
    while (!left.empty()) {
        size_t best = 0;  // closest request; a tie goes to the lower cylinder
        for (size_t i = 1; i < left.size(); i++) {
            int d = abs(left[i] - at), b = abs(left[best] - at);
            if (d < b || (d == b && left[i] < left[best])) best = i;
        }
        at = left[best];
        left.erase(left.begin() + best);
        path.push_back(at);
    }
    return path;
}

void print(const string& name, const vector<int>& path) {
    int total = 0;
    string s;
    for (size_t i = 0; i < path.size(); i++) {
        if (i > 0) total += abs(path[i] - path[i - 1]);
        s += (i ? " " : "") + to_string(path[i]);
    }
    printf("%s: %s | total %d\n", name.c_str(), s.c_str(), total);
}

vector<int> concat(initializer_list<vector<int>> parts) {
    vector<int> out;
    for (const auto& p : parts) out.insert(out.end(), p.begin(), p.end());
    return out;
}

int main() {
    vector<int> up, down;
    for (int c : QUEUE) (c >= HEAD ? up : down).push_back(c);
    sort(up.begin(), up.end());                        // served on the way up
    sort(down.rbegin(), down.rend());                  // below the head, nearest first
    vector<int> lowFirst(down.rbegin(), down.rend());  // below the head, lowest first
    print("FCFS", concat({{HEAD}, QUEUE}));
    print("SSTF", sstf());
    print("SCAN", concat({{HEAD}, up, {LAST}, down}));
    print("C-SCAN", concat({{HEAD}, up, {LAST, 0}, lowFirst}));
    print("LOOK", concat({{HEAD}, up, down}));
    print("C-LOOK", concat({{HEAD}, up, lowFirst}));
    return 0;
}
```

```java
import java.util.*;

public class Main {
    static final int HEAD = 70, LAST = 199; // head position, last cylinder; the head is moving up
    static final int[] QUEUE = {120, 35, 180, 10, 95, 160, 50, 130};

    static List<Integer> sstf() {
        List<Integer> left = new ArrayList<>(), path = new ArrayList<>(List.of(HEAD));
        for (int c : QUEUE) left.add(c);
        int at = HEAD;
        while (!left.isEmpty()) {
            int best = 0; // closest request; a tie goes to the lower cylinder
            for (int i = 1; i < left.size(); i++) {
                int d = Math.abs(left.get(i) - at), b = Math.abs(left.get(best) - at);
                if (d < b || (d == b && left.get(i) < left.get(best))) best = i;
            }
            at = left.remove(best);
            path.add(at);
        }
        return path;
    }

    static void print(String name, List<Integer> path) {
        int total = 0;
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < path.size(); i++) {
            if (i > 0) total += Math.abs(path.get(i) - path.get(i - 1));
            sb.append(i > 0 ? " " : "").append(path.get(i));
        }
        System.out.println(name + ": " + sb + " | total " + total);
    }

    static List<Integer> path(Object... parts) {
        List<Integer> out = new ArrayList<>();
        for (Object p : parts) {
            if (p instanceof Integer) out.add((Integer) p);
            else for (Object c : (List<?>) p) out.add((Integer) c);
        }
        return out;
    }

    public static void main(String[] args) {
        List<Integer> up = new ArrayList<>(), down = new ArrayList<>(), fcfs = new ArrayList<>();
        for (int c : QUEUE) {
            fcfs.add(c);
            (c >= HEAD ? up : down).add(c);
        }
        Collections.sort(up);                     // served on the way up
        down.sort(Collections.reverseOrder());    // below the head, nearest first
        List<Integer> lowFirst = new ArrayList<>(down);
        Collections.reverse(lowFirst);            // below the head, lowest first
        print("FCFS", path(HEAD, fcfs));
        print("SSTF", sstf());
        print("SCAN", path(HEAD, up, LAST, down));
        print("C-SCAN", path(HEAD, up, LAST, 0, lowFirst));
        print("LOOK", path(HEAD, up, down));
        print("C-LOOK", path(HEAD, up, lowFirst));
    }
}
```

```python
HEAD, LAST = 70, 199  # head position, last cylinder; the head is moving up
QUEUE = [120, 35, 180, 10, 95, 160, 50, 130]


def sstf():
    left, path, at = QUEUE[:], [HEAD], HEAD
    while left:
        nearest = min(left, key=lambda c: (abs(c - at), c))  # a tie goes to the lower cylinder
        left.remove(nearest)
        path.append(nearest)
        at = nearest
    return path


def main():
    up = sorted(c for c in QUEUE if c >= HEAD)                   # served on the way up
    down = sorted((c for c in QUEUE if c < HEAD), reverse=True)  # below the head, nearest first
    low_first = down[::-1]                                        # below the head, lowest first
    paths = [
        ("FCFS", [HEAD] + QUEUE),
        ("SSTF", sstf()),
        ("SCAN", [HEAD] + up + [LAST] + down),
        ("C-SCAN", [HEAD] + up + [LAST, 0] + low_first),
        ("LOOK", [HEAD] + up + down),
        ("C-LOOK", [HEAD] + up + low_first),
    ]
    for name, path in paths:
        total = sum(abs(b - a) for a, b in zip(path, path[1:]))
        print(f"{name}: {' '.join(map(str, path))} | total {total}")


main()
```

```javascript
const HEAD = 70, LAST = 199; // head position, last cylinder; the head is moving up
const QUEUE = [120, 35, 180, 10, 95, 160, 50, 130];

function sstf() {
  const left = QUEUE.slice(), path = [HEAD];
  let at = HEAD;
  while (left.length > 0) {
    let best = 0; // closest request; a tie goes to the lower cylinder
    for (let i = 1; i < left.length; i++) {
      const d = Math.abs(left[i] - at), b = Math.abs(left[best] - at);
      if (d < b || (d === b && left[i] < left[best])) best = i;
    }
    at = left.splice(best, 1)[0];
    path.push(at);
  }
  return path;
}

function main() {
  const up = QUEUE.filter((c) => c >= HEAD).sort((a, b) => a - b); // served on the way up
  const down = QUEUE.filter((c) => c < HEAD).sort((a, b) => b - a); // below the head, nearest first
  const lowFirst = down.slice().reverse(); // below the head, lowest first
  const paths = [
    ["FCFS", [HEAD, ...QUEUE]],
    ["SSTF", sstf()],
    ["SCAN", [HEAD, ...up, LAST, ...down]],
    ["C-SCAN", [HEAD, ...up, LAST, 0, ...lowFirst]],
    ["LOOK", [HEAD, ...up, ...down]],
    ["C-LOOK", [HEAD, ...up, ...lowFirst]],
  ];
  for (const [name, path] of paths) {
    let total = 0;
    for (let i = 1; i < path.length; i++) total += Math.abs(path[i] - path[i - 1]);
    console.log(`${name}: ${path.join(" ")} | total ${total}`);
  }
}

main();
```

```output
FCFS: 70 120 35 180 10 95 160 50 130 | total 790
SSTF: 70 50 35 10 95 120 130 160 180 | total 230
SCAN: 70 95 120 130 160 180 199 50 35 10 | total 318
C-SCAN: 70 95 120 130 160 180 199 0 10 35 50 | total 378
LOOK: 70 95 120 130 160 180 50 35 10 | total 280
C-LOOK: 70 95 120 130 160 180 10 35 50 | total 320
```

## Choosing an algorithm in practice

For a lightly loaded disk the queue is rarely longer than one or two requests, and every algorithm behaves like FCFS. Under heavy load, SCAN-family algorithms avoid starvation and keep throughput high; textbooks traditionally name SSTF or LOOK as a reasonable default, with C-LOOK where uniform waiting matters. Real schedulers also weigh deadlines, so a read a process is blocked on is not held back too long, and the disk's own controller reorders requests internally.

**Solid-state drives** have no arm and no rotation, so the time of a request barely depends on its address and head-movement scheduling buys nothing. Linux, for example, offers several block-layer schedulers, including `mq-deadline`, `bfq`, `kyber` and `none`, and fast NVMe SSDs commonly run with `none`, simply passing requests through in order.

## Common mistakes

- Running SCAN in the wrong direction. The direction is part of the question; going down first from 70 gives a different total.
- Sending LOOK to cylinder 199 or 0. LOOK turns at the last request; only SCAN and C-SCAN touch the ends.
- Counting or not counting the C-SCAN and C-LOOK return jump without saying so. State the convention every time.
- Serving requests on the return sweep of C-SCAN. The return is a single jump with no service.
- Breaking an SSTF tie arbitrarily and getting a different answer from the key. When two requests are equally close, follow the question's rule (often the lower cylinder, or the current direction).
- Assuming SSTF is optimal. It is greedy, and on some queues a planned sweep moves less.

## Interview questions

**What is the difference between seek time and rotational latency?**
Seek time is the time to move the arm to the right cylinder and depends on the distance moved. Rotational latency is the wait for the sector to spin under the head, on average half a rotation, about 4.17 ms at 7,200 RPM.

**Why is SCAN called the elevator algorithm?**
It works like a lift: the head travels in one direction serving every request on the way, goes to the end, then reverses and serves the requests in the other direction.

**Why does C-SCAN give more uniform waiting time than SCAN?**
In SCAN, after the head reverses, it first serves the cylinders it has just passed, while requests at the far end have been waiting longest. C-SCAN always sweeps the same way and returns to the start, so every cylinder is visited once per cycle at regular intervals.

**Can SSTF cause starvation? How do SCAN-type algorithms avoid it?**
Yes. A request far from the head can be skipped forever if closer requests keep arriving. SCAN-type algorithms sweep the full range in order, so every pending request is reached within one or two sweeps.

**Which algorithm gives the minimum head movement?**
On a particular queue it is often SSTF, but no simple rule always gives the minimum, and SSTF's greedy choices can cost more on some queues. LOOK never moves more than SCAN, and C-LOOK never more than C-SCAN.

**Does disk scheduling matter for SSDs?**
Much less. An SSD has no moving head, so access time hardly depends on location, and reordering by address does not help. Schedulers for SSDs focus on fairness and latency between processes, or simply pass requests through.

Next, read [Inter-Process Communication](/notes/operating-systems/inter-process-communication), or test yourself with the [Operating Systems (Intermediate) skill test](/skill-tests/os-intermediate).
