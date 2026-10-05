---
title: Page Replacement Algorithms
order: 9
minutes: 14
level: intermediate
updated: 2026-10-05
seo-title: Page Replacement in OS: FIFO, LRU, Optimal, Belady
description: Page replacement algorithms in OS: FIFO, Optimal, LRU and clock worked frame by frame, their fault counts, and Belady's anomaly with 3 vs 4 frames.
question: What is a page replacement algorithm?
answer: A page replacement algorithm decides which page in memory to evict when a page fault occurs and no frame is free. The goal is the fewest page faults. FIFO evicts the oldest loaded page, Optimal evicts the page not needed for the longest time, LRU evicts the page unused for the longest time, and the clock algorithm approximates LRU cheaply with reference bits.
q: Which page replacement algorithm is the best?
a: The Optimal algorithm gives the fewest page faults possible, but it needs to know future references, so it cannot be implemented and serves only as a benchmark. LRU comes closest among practical policies, and real systems use cheap approximations of it, such as the clock or second-chance algorithm, because exact LRU needs work on every memory access.
q: What is Belady's anomaly?
a: Belady's anomaly is when giving a process more frames increases its number of page faults. It happens with FIFO: the reference string 1 2 3 4 1 2 5 1 2 3 4 5 causes 9 faults with 3 frames but 10 with 4 frames. LRU and Optimal never show it, because they are stack algorithms.
q: Why does LRU not suffer from Belady's anomaly?
a: LRU is a stack algorithm: the set of pages in memory with n frames is always a subset of the set it would hold with n + 1 frames, because both are simply the n or n + 1 most recently used pages. Adding a frame can therefore only turn faults into hits, never the reverse. FIFO lacks this property.
q: How is LRU implemented in practice?
a: Exact LRU needs either a timestamp written on every memory reference or a stack of pages reordered on every reference, both too slow without special hardware. Operating systems approximate it with the hardware reference bit: the clock or second-chance algorithm, the additional-reference-bits (aging) method, or Linux-style active and inactive lists.
q: What is the second chance algorithm?
a: Second chance is FIFO with a reference bit. When the oldest page is chosen as a victim, its reference bit is checked: if it is 1, the bit is cleared and the page is skipped, getting a second chance; if it is 0, the page is evicted. Implemented with a circular list and a moving pointer, it is called the clock algorithm.
---

When a page fault occurs and every frame is in use, the operating system must evict a page to make room. Which page it picks decides how soon the next fault comes, and with a page fault costing thousands of times more than a memory access, that choice dominates performance (the arithmetic is in [Virtual Memory and Demand Paging](/notes/operating-systems/virtual-memory)). Page replacement questions are almost always the same exercise: a reference string, a number of frames, and "how many page faults?". This note works one string through every algorithm, then shows Belady's anomaly.

## The setup

A **reference string** is the sequence of page numbers a process accesses. Repeated references to the same page in a row are collapsed, since only the first can fault. A **page fault** happens whenever the referenced page is not in a frame; the first reference to each page always faults (a *compulsory* or *cold* fault), including while frames are still empty. Some books count only the faults after the frames fill up, so always state which you mean: here every fault counts.

Throughout this note:

- Reference string: **2 3 2 1 5 2 4 5 3 2 5 2** (12 references, 5 distinct pages)
- Frames: **3**, initially empty

The tables show the frame contents after each reference, in fixed slots: a new page takes the slot of the page it evicts.

## FIFO (First-In, First-Out)

Evict the page that has been in memory the **longest**, regardless of how often it is used. It needs only a queue of pages in load order.

| Step | Ref | Frames | Result |
| --- | --- | --- | --- |
| 1 | 2 | 2 - - | Fault |
| 2 | 3 | 2 3 - | Fault |
| 3 | 2 | 2 3 - | Hit |
| 4 | 1 | 2 3 1 | Fault |
| 5 | 5 | 5 3 1 | Fault, evict 2 (oldest) |
| 6 | 2 | 5 2 1 | Fault, evict 3 |
| 7 | 4 | 5 2 4 | Fault, evict 1 |
| 8 | 5 | 5 2 4 | Hit |
| 9 | 3 | 3 2 4 | Fault, evict 5 |
| 10 | 2 | 3 2 4 | Hit |
| 11 | 5 | 3 5 4 | Fault, evict 2 |
| 12 | 2 | 3 5 2 | Fault, evict 4 |

**FIFO: 9 faults, 3 hits.** Step 5 shows the weakness: page 2 is evicted because it was loaded first, even though it was used two steps earlier and is needed again at once.

## Optimal (OPT or MIN)

Evict the page that will **not be used for the longest time** in the future. It gives the lowest possible number of faults for any reference string and number of frames, but it needs the future, so no operating system can run it. It is the yardstick other algorithms are measured against.

| Step | Ref | Frames | Result |
| --- | --- | --- | --- |
| 1 | 2 | 2 - - | Fault |
| 2 | 3 | 2 3 - | Fault |
| 3 | 2 | 2 3 - | Hit |
| 4 | 1 | 2 3 1 | Fault |
| 5 | 5 | 2 3 5 | Fault, evict 1 (never used again) |
| 6 | 2 | 2 3 5 | Hit |
| 7 | 4 | 4 3 5 | Fault, evict 2 (next used at step 10, the farthest) |
| 8 | 5 | 4 3 5 | Hit |
| 9 | 3 | 4 3 5 | Hit |
| 10 | 2 | 2 3 5 | Fault, evict 4 (never used again) |
| 11 | 5 | 2 3 5 | Hit |
| 12 | 2 | 2 3 5 | Hit |

**Optimal: 6 faults, 6 hits.** At step 7 the next uses are page 2 at step 10, page 3 at step 9 and page 5 at step 8, so 2 goes. At step 10 neither 4 nor 3 is used again; either may go, and the count is the same.

## LRU (Least Recently Used)

Evict the page that has **not been used for the longest time** in the past. It uses the recent past as a prediction of the near future, which is what locality of reference suggests.

| Step | Ref | Frames | Result |
| --- | --- | --- | --- |
| 1 | 2 | 2 - - | Fault |
| 2 | 3 | 2 3 - | Fault |
| 3 | 2 | 2 3 - | Hit |
| 4 | 1 | 2 3 1 | Fault |
| 5 | 5 | 2 5 1 | Fault, evict 3 (last used at step 2) |
| 6 | 2 | 2 5 1 | Hit |
| 7 | 4 | 2 5 4 | Fault, evict 1 (last used at step 4) |
| 8 | 5 | 2 5 4 | Hit |
| 9 | 3 | 3 5 4 | Fault, evict 2 (last used at step 6) |
| 10 | 2 | 3 5 2 | Fault, evict 4 (last used at step 7) |
| 11 | 5 | 3 5 2 | Hit |
| 12 | 2 | 3 5 2 | Hit |

**LRU: 7 faults, 5 hits.** At step 5, LRU keeps page 2 because it was just used, which FIFO did not.

**Implementing exact LRU** needs help on every memory access: either a **counter** (a timestamp stored in the page-table entry at each reference, with the smallest timestamp evicted) or a **stack** of page numbers where a referenced page moves to the top and the bottom is the victim. Both are too expensive in software, so real systems approximate LRU.

## LRU approximations: second chance and clock

Most hardware sets a **reference bit** in a page's entry whenever the page is accessed. The OS can clear these bits and later see which pages were used since.

- **Additional-reference-bits (aging).** Keep a byte per page. On every timer interrupt, shift the byte right and copy the reference bit into its top bit, then clear the reference bit. The page with the smallest byte, read as a number, is the least recently used, approximately.
- **Second chance.** FIFO, but when the oldest page's reference bit is 1, clear it and move on instead of evicting it. A page used since the last pass survives one more round.
- **Clock.** Second chance with the pages in a circular list and a **hand** pointing at the next candidate. On a fault, the hand clears 1 bits and advances until it finds a 0 bit, evicts that page, loads the new one with its bit set to 1, and moves one step on. On a hit, the page's bit is set to 1.

The clock algorithm on the same string and three frames, with each page's reference bit in brackets and the hand's position after the step:

| Step | Ref | Frames (bit) | Hand at | Result |
| --- | --- | --- | --- | --- |
| 1 | 2 | 2(1) - - | slot 2 | Fault |
| 2 | 3 | 2(1) 3(1) - | slot 3 | Fault |
| 3 | 2 | 2(1) 3(1) - | slot 3 | Hit |
| 4 | 1 | 2(1) 3(1) 1(1) | slot 1 | Fault |
| 5 | 5 | 5(1) 3(0) 1(0) | slot 2 | Fault: all bits 1, a full sweep clears them, evict 2 |
| 6 | 2 | 5(1) 2(1) 1(0) | slot 3 | Fault, evict 3 (bit 0) |
| 7 | 4 | 5(1) 2(1) 4(1) | slot 1 | Fault, evict 1 (bit 0) |
| 8 | 5 | 5(1) 2(1) 4(1) | slot 1 | Hit |
| 9 | 3 | 3(1) 2(0) 4(0) | slot 2 | Fault: full sweep again, evict 5 |
| 10 | 2 | 3(1) 2(1) 4(0) | slot 2 | Hit |
| 11 | 5 | 3(1) 2(0) 5(1) | slot 1 | Fault: 2's bit cleared, evict 4 |
| 12 | 2 | 3(1) 2(1) 5(1) | slot 1 | Hit |

**Clock: 8 faults**, between FIFO's 9 and LRU's 7. When every bit is 1, as at steps 5 and 9, the clock sweeps the whole circle and degenerates into FIFO for that fault.

The **enhanced second-chance** algorithm also uses the **modify (dirty) bit** and prefers to evict, in order: not referenced and not modified (0, 0), then (0, 1), then (1, 0), then (1, 1), because a clean page can be dropped without writing it to disk. Linux approximates LRU with active and inactive page lists, in the same spirit.

Two counting policies also appear in textbooks: **LFU** (evict the least frequently used page) and **MFU** (evict the most frequently used, on the theory that a low count means a page was just loaded). Neither is common, as both approximate Optimal poorly.

## Belady's anomaly

You would expect more frames to mean fewer faults. With FIFO that is not guaranteed. The classic string is **1 2 3 4 1 2 5 1 2 3 4 5**:

| Step | Ref | FIFO, 3 frames | FIFO, 4 frames |
| --- | --- | --- | --- |
| 1 | 1 | 1 - - (fault) | 1 - - - (fault) |
| 2 | 2 | 1 2 - (fault) | 1 2 - - (fault) |
| 3 | 3 | 1 2 3 (fault) | 1 2 3 - (fault) |
| 4 | 4 | 4 2 3 (fault) | 1 2 3 4 (fault) |
| 5 | 1 | 4 1 3 (fault) | 1 2 3 4 (hit) |
| 6 | 2 | 4 1 2 (fault) | 1 2 3 4 (hit) |
| 7 | 5 | 5 1 2 (fault) | 5 2 3 4 (fault) |
| 8 | 1 | 5 1 2 (hit) | 5 1 3 4 (fault) |
| 9 | 2 | 5 1 2 (hit) | 5 1 2 4 (fault) |
| 10 | 3 | 5 3 2 (fault) | 5 1 2 3 (fault) |
| 11 | 4 | 5 3 4 (fault) | 4 1 2 3 (fault) |
| 12 | 5 | 5 3 4 (hit) | 4 5 2 3 (fault) |
| Faults | | **9** | **10** |

Four frames give **10 faults, one more than three frames**. Look at step 7: with three frames memory holds {5, 1, 2}; with four it holds {5, 2, 3, 4}. Page 1 is in the smaller memory but not the larger one, so the next references to 1 and 2 hit with three frames and fault with four.

**Stack algorithms** cannot show the anomaly. An algorithm is a stack algorithm if the pages in memory with n frames are always a subset of the pages it would hold with n + 1 frames. LRU qualifies (memory always holds the n most recently used pages) and so does Optimal; FIFO does not, as step 7 shows. On this same string LRU gives 10 faults with three frames and 8 with four.

## Simulating the algorithms

This program counts the faults for each policy and frame count used above; its numbers match the tables.

```cpp
#include <algorithm>
#include <cstdio>
#include <string>
#include <vector>
using namespace std;

// Index of the next reference to page after time t; never used again counts as farthest.
int nextUse(const vector<int>& refs, int page, int t) {
    for (int k = t + 1; k < (int)refs.size(); k++) if (refs[k] == page) return k;
    return (int)refs.size();
}

// FIFO keeps frames in load order, LRU in order of last use; the victim is frames[0].
int countFaults(const vector<int>& refs, int n, const string& policy) {
    vector<int> frames;
    int faults = 0;
    for (int t = 0; t < (int)refs.size(); t++) {
        int page = refs[t];
        auto it = find(frames.begin(), frames.end(), page);
        if (it != frames.end()) {
            if (policy == "LRU") { frames.erase(it); frames.push_back(page); }  // now most recently used
            continue;
        }
        faults++;
        if ((int)frames.size() == n) {
            int victim = 0;
            if (policy == "OPT")  // evict the page whose next use is farthest away
                for (int i = 1; i < n; i++)
                    if (nextUse(refs, frames[i], t) > nextUse(refs, frames[victim], t)) victim = i;
            frames.erase(frames.begin() + victim);
        }
        frames.push_back(page);
    }
    return faults;
}

string join(const vector<int>& v) {
    string s;
    for (size_t i = 0; i < v.size(); i++) s += (i ? " " : "") + to_string(v[i]);
    return s;
}

int main() {
    vector<int> refs = {2, 3, 2, 1, 5, 2, 4, 5, 3, 2, 5, 2};
    printf("Reference string: %s\n", join(refs).c_str());
    const char* policies[3][2] = {{"FIFO", "FIFO"}, {"LRU", "LRU"}, {"OPT", "Optimal"}};
    for (auto& p : policies) printf("%s, 3 frames: %d faults\n", p[1], countFaults(refs, 3, p[0]));
    vector<int> belady = {1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5};
    printf("Belady string: %s\n", join(belady).c_str());
    for (string policy : {"FIFO", "LRU"})
        for (int n = 3; n <= 4; n++) printf("%s, %d frames: %d faults\n", policy.c_str(), n, countFaults(belady, n, policy));
    return 0;
}
```

```java
import java.util.*;

public class Main {
    // FIFO keeps frames in load order, LRU in order of last use; the victim is index 0.
    static int countFaults(int[] refs, int n, String policy) {
        List<Integer> frames = new ArrayList<>();
        int faults = 0;
        for (int t = 0; t < refs.length; t++) {
            Integer page = refs[t];
            if (frames.contains(page)) {
                if (policy.equals("LRU")) { frames.remove(page); frames.add(page); } // now most recently used
                continue;
            }
            faults++;
            if (frames.size() == n) {
                int victim = 0;
                if (policy.equals("OPT")) // evict the page whose next use is farthest away
                    for (int i = 1; i < n; i++)
                        if (nextUse(refs, frames.get(i), t) > nextUse(refs, frames.get(victim), t)) victim = i;
                frames.remove(victim);
            }
            frames.add(page);
        }
        return faults;
    }

    // Index of the next reference to page after time t; never used again counts as farthest.
    static int nextUse(int[] refs, int page, int t) {
        for (int k = t + 1; k < refs.length; k++) if (refs[k] == page) return k;
        return refs.length;
    }

    static String join(int[] v) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < v.length; i++) sb.append(i > 0 ? " " : "").append(v[i]);
        return sb.toString();
    }

    public static void main(String[] args) {
        int[] refs = {2, 3, 2, 1, 5, 2, 4, 5, 3, 2, 5, 2};
        System.out.println("Reference string: " + join(refs));
        String[][] policies = {{"FIFO", "FIFO"}, {"LRU", "LRU"}, {"OPT", "Optimal"}};
        for (String[] p : policies)
            System.out.println(p[1] + ", 3 frames: " + countFaults(refs, 3, p[0]) + " faults");
        int[] belady = {1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5};
        System.out.println("Belady string: " + join(belady));
        for (String policy : new String[]{"FIFO", "LRU"})
            for (int n = 3; n <= 4; n++)
                System.out.println(policy + ", " + n + " frames: " + countFaults(belady, n, policy) + " faults");
    }
}
```

```python
def next_use(refs, page, t):
    """Index of the next reference to page after time t; never used again counts as farthest."""
    for k in range(t + 1, len(refs)):
        if refs[k] == page:
            return k
    return len(refs)


def count_faults(refs, n, policy):
    """FIFO keeps frames in load order, LRU in order of last use; the victim is frames[0]."""
    frames, faults = [], 0
    for t, page in enumerate(refs):
        if page in frames:
            if policy == "LRU":
                frames.remove(page)
                frames.append(page)  # now most recently used
            continue
        faults += 1
        if len(frames) == n:
            victim = 0
            if policy == "OPT":  # evict the page whose next use is farthest away
                for i in range(1, n):
                    if next_use(refs, frames[i], t) > next_use(refs, frames[victim], t):
                        victim = i
            frames.pop(victim)
        frames.append(page)
    return faults


def main():
    refs = [2, 3, 2, 1, 5, 2, 4, 5, 3, 2, 5, 2]
    print("Reference string: " + " ".join(map(str, refs)))
    for policy, name in (("FIFO", "FIFO"), ("LRU", "LRU"), ("OPT", "Optimal")):
        print(f"{name}, 3 frames: {count_faults(refs, 3, policy)} faults")
    belady = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5]
    print("Belady string: " + " ".join(map(str, belady)))
    for policy in ("FIFO", "LRU"):
        for n in (3, 4):
            print(f"{policy}, {n} frames: {count_faults(belady, n, policy)} faults")


main()
```

```javascript
// Index of the next reference to page after time t; never used again counts as farthest.
function nextUse(refs, page, t) {
  const k = refs.indexOf(page, t + 1);
  return k === -1 ? refs.length : k;
}

// FIFO keeps frames in load order, LRU in order of last use; the victim is frames[0].
function countFaults(refs, n, policy) {
  const frames = [];
  let faults = 0;
  refs.forEach((page, t) => {
    const at = frames.indexOf(page);
    if (at !== -1) {
      if (policy === "LRU") frames.push(frames.splice(at, 1)[0]); // now most recently used
      return;
    }
    faults++;
    if (frames.length === n) {
      let victim = 0;
      if (policy === "OPT") { // evict the page whose next use is farthest away
        for (let i = 1; i < n; i++) if (nextUse(refs, frames[i], t) > nextUse(refs, frames[victim], t)) victim = i;
      }
      frames.splice(victim, 1);
    }
    frames.push(page);
  });
  return faults;
}

function main() {
  const refs = [2, 3, 2, 1, 5, 2, 4, 5, 3, 2, 5, 2];
  console.log("Reference string: " + refs.join(" "));
  for (const [policy, name] of [["FIFO", "FIFO"], ["LRU", "LRU"], ["OPT", "Optimal"]]) {
    console.log(`${name}, 3 frames: ${countFaults(refs, 3, policy)} faults`);
  }
  const belady = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5];
  console.log("Belady string: " + belady.join(" "));
  for (const policy of ["FIFO", "LRU"]) {
    for (const n of [3, 4]) console.log(`${policy}, ${n} frames: ${countFaults(belady, n, policy)} faults`);
  }
}

main();
```

```output
Reference string: 2 3 2 1 5 2 4 5 3 2 5 2
FIFO, 3 frames: 9 faults
LRU, 3 frames: 7 faults
Optimal, 3 frames: 6 faults
Belady string: 1 2 3 4 1 2 5 1 2 3 4 5
FIFO, 3 frames: 9 faults
FIFO, 4 frames: 10 faults
LRU, 3 frames: 10 faults
LRU, 4 frames: 8 faults
```

## FIFO vs LRU vs Optimal vs clock

| Aspect | FIFO | Optimal | LRU | Clock |
| --- | --- | --- | --- | --- |
| Evicts | Oldest loaded page | Page used farthest in the future | Page unused longest | First page found with reference bit 0 |
| Faults on the example | 9 | 6 | 7 | 8 |
| Implementable | Yes, a queue | No, needs the future | Yes, but costly per access | Yes, cheaply |
| Belady's anomaly | Possible | Never | Never | Possible |
| Used for | Teaching, simple systems | Benchmark | Ideal real systems approximate | Real systems |

A related choice is **global** replacement (the victim may belong to any process, which gives better throughput) versus **local** replacement (only the faulting process's own frames, which keeps one process's behaviour from hurting others). Most general-purpose systems use global replacement.

## Common mistakes

- Forgetting to count the faults that fill the empty frames. Unless a question says otherwise, they count.
- In LRU, evicting by load time instead of last use: a hit must update the page's recency.
- In FIFO, updating the queue on a hit. FIFO ignores hits completely.
- In Optimal, looking backwards instead of forwards, which turns it into LRU.
- Claiming Belady's anomaly happens with LRU. It cannot; only non-stack algorithms such as FIFO show it.
- Thinking the anomaly happens for every string under FIFO. It needs particular strings; usually more frames still help.

## Interview questions

**Why is the Optimal algorithm not used in real operating systems?**
It needs to know which page will be referenced farthest in the future, which the OS cannot know when the fault happens. It is used offline, on recorded reference strings, as a lower bound to compare real algorithms against.

**What is Belady's anomaly, and which algorithms suffer from it?**
It is an increase in page faults when more frames are given. FIFO shows it, for example 9 faults with 3 frames and 10 with 4 on the string 1 2 3 4 1 2 5 1 2 3 4 5. Stack algorithms such as LRU and Optimal never do.

**How does the clock algorithm approximate LRU?**
Every page has a reference bit set by hardware on access. The clock hand sweeps the circular list of frames, clearing bits that are 1 and evicting the first page whose bit is already 0, so pages used since the last sweep survive.

**Why prefer evicting a clean page over a dirty one?**
A dirty page has been modified and must be written back to disk before its frame can be reused, which doubles the I/O for that fault. A clean page can simply be discarded, since an identical copy is already on disk.

**What is a stack algorithm?**
An algorithm for which the pages in memory with n frames are always a subset of those with n + 1 frames. Adding frames can then only turn faults into hits, so the algorithm is immune to Belady's anomaly.

**How many page faults does LRU give for the string 7 0 1 2 0 3 0 4 with three frames?**
Six. The first four references fault while filling and then evicting 7. Page 0 hits, 3 faults and evicts 1, 0 hits, and 4 faults and evicts 2, the least recently used at that point.

Next, read [File Systems](/notes/operating-systems/file-systems), or try these on the clock in the [Operating Systems (Intermediate) skill test](/skill-tests/os-intermediate).
