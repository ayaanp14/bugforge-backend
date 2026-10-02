---
title: Interval Problems: Merge, Insert and Sweep
stage: intervals
order: 1
minutes: 22
level: Intermediate
hub: intervals
practice: meeting-rooms, merge-intervals, insert-interval, interval-list-intersections, meeting-rooms-ii, minimum-number-of-platforms, non-overlapping-intervals, minimum-number-of-arrows, car-pooling
updated: 2026-10-03
seo-title: Interval Problems: Merge Intervals, Meeting Rooms & Code
description: Learn interval problems: the overlap test, merge and insert intervals, meeting rooms with a sweep line, with code in C++, Java, Python and JavaScript.
question: How do you solve interval problems such as merge intervals?
answer: Interval problems ask about ranges on a line, such as meetings or bookings. The core move is to sort the intervals by start and sweep once from left to right: an interval that starts before the current group ends overlaps it and joins it, otherwise a new group begins. Sorting costs O(n log n) and the sweep O(n), against O(n²) for comparing every pair.
q: How do you check if two intervals overlap?
a: Two closed intervals [a, b] and [c, d] overlap when a ≤ d and c ≤ b, that is, each one starts no later than the other ends. It is the negation of the only two ways they can miss: one ends before the other starts. For half-open intervals, where the end point is not included, use a strict < in both comparisons.
q: Why do you sort intervals by start time?
a: After sorting by start, every interval that overlaps the group being built comes straight after it in the list, so one left-to-right pass finds every merge. In the order given, overlapping intervals can sit far apart, and you would have to compare every pair.
q: What is the time complexity of merge intervals?
a: O(n log n) for the sort plus O(n) for the sweep, so O(n log n) in all. The output takes O(n) space in the worst case, when no two intervals overlap. If the input already arrives sorted, as in Insert Interval, the whole job is O(n).
q: How do you find the minimum number of meeting rooms?
a: The answer is the largest number of meetings in progress at the same moment. Sort the start times and the end times separately, sweep through both, add one at every start and subtract one at every end, and keep the peak. A min-heap of end times gives the same answer, also in O(n log n).
q: Should I sort by start or by end for non-overlapping intervals?
a: To keep the most intervals, or remove the fewest, sort by end and keep each interval that starts at or after the end of the last one kept. The interval that finishes first leaves the most room for the rest, which an exchange argument proves optimal. Merging and meeting-room problems sort by start instead.
---
An **interval** is a range on a line with a start and an end: a meeting from 9:00 to 10:30, a train at a platform from 9:50 to 11:20, a hotel booking, a block of reserved seat numbers. Interview questions about intervals come in a few recurring shapes. Do any of them overlap? Merge the ones that do. Fit a new one into a schedule. How many are running at the busiest moment? How few must go so that the rest never clash? They look different, but almost all of them are solved by the same two moves: **sort**, then **sweep** once from left to right.

This lesson builds those moves from the ground up: the overlap test and the boundary question that trips everyone up (does [1, 4] overlap [4, 5]?), merging with a proof that one pass is enough, inserting into a sorted list, intersecting two lists, the meeting-rooms family and the greedy rule for removing overlaps. Every program is shown in C++, Java, Python and JavaScript.

## Representing an interval and testing overlap

Store an interval as a pair `[start, end]` with start ≤ end: a `vector<int>` or `pair<int, int>` in C++, an `int[]` in Java, a list or tuple in Python, a two-element array in JavaScript. A list of intervals is then a 2D array, which is how almost every problem hands it to you.

Before any algorithm, settle what the end point means, because problems disagree:

- A **closed** interval `[start, end]` includes both ends. [1, 4] and [4, 5] share the point 4, so they overlap. Merge Intervals and the balloon-and-arrow problem use closed intervals.
- A **half-open** interval `[start, end)` includes the start but not the end. A meeting `[9, 10)` is over at 10, so a meeting starting at 10 does not clash with it. The meeting-room problems use half-open intervals.

Phrases such as "touching intervals merge", "a meeting may start exactly when another ends" or "a train arriving as another departs needs its own platform" tell you which kind you have. Find that sentence before you write a single comparison.

Now the test itself. It is easier to say when two intervals do **not** overlap: one of them ends before the other starts. For closed intervals a and b that is `a.end < b.start` or `b.end < a.start`. Negate both conditions and you get the overlap test:

```text
closed:     overlap  <=>  a.start <= b.end  and  b.start <= a.end
half-open:  overlap  <=>  a.start <  b.end  and  b.start <  a.end
```

The test covers every arrangement with no special cases, including one interval lying inside the other:

| a | b | a.start ≤ b.end | b.start ≤ a.end | Closed overlap? |
| --- | --- | --- | --- | --- |
| [1, 3] | [5, 8] | yes | no | no, a ends first |
| [1, 4] | [4, 5] | yes | yes | yes, they touch at 4 |
| [1, 6] | [4, 9] | yes | yes | yes, they share [4, 6] |
| [2, 9] | [3, 5] | yes | yes | yes, b lies inside a |
| [7, 9] | [1, 3] | no | yes | no, b ends first |

When two intervals do overlap, their common part is `[max(a.start, b.start), min(a.end, b.end)]`: the later start and the earlier end. That gives a second way to write the same test. The common part is non-empty exactly when the later start is at most the earlier end (strictly less for half-open intervals). You will use that form to intersect two lists.

## Why comparing every pair is too slow

The direct way to merge overlapping intervals is to compare every pair, combine any two that overlap, and repeat until nothing changes. One round alone is n × (n − 1) / 2 comparisons: with n = 100,000 that is about five billion, fifty times more than a judge allows in a second. One round is not even enough, because merging creates new overlaps. [1, 3] and [5, 8] do not overlap, but once [2, 6] joins [1, 3], the result [1, 6] reaches [5, 8].

The underlying trouble is that, in the order given, intervals that overlap can sit anywhere in the list. Sorting fixes exactly that.

## The idea: sort by start, then sweep

Sort the intervals by start. Then walk through them once, keeping one **open block**, the merged interval being built, and compare each new interval's start with the block's end:

```text
 0   2   4   6   8   10  12  14  16  18
 |---|---|---|---|---|---|---|---|---|
   [===]                                [1, 3]    opens the block
     [=======]                          [2, 6]    2 <= 3: extend the block to [1, 6]
                 [===]                  [8, 10]   8 > 6: [1, 6] is final, open [8, 10]
                   [=====]              [9, 12]   9 <= 10: extend the block to [8, 12]
                               [=====]  [15, 18]  15 > 12: [8, 12] is final, open [15, 18]
```

The rules:

- **Sort by start.** Intervals with equal starts can come in either order; the `max` below handles them.
- **It starts at or before the block's end** (`start <= end` for closed intervals): it overlaps, so the block's end becomes `max(end, its end)`. The `max` matters when the new interval lies entirely inside the block: [2, 3] inside [1, 10] must not shrink it to [1, 3].
- **It starts after the block's end:** the block is finished. Output it and open a new block with this interval.
- When the list runs out, output the last open block.

The sort is O(n log n) and the sweep looks at each interval once, so the whole merge is O(n log n): about two million steps for n = 100,000 instead of billions.

@walkthrough

## Why one pass is enough

The sweep closes a block for good the moment it meets an interval that starts after the block's end, and it never looks at that block again. That is a bold move, so it is worth being sure nothing later could have joined it.

Say the block ends at `end` and the next interval in sorted order starts at `s`, with `s > end`. Every interval after it in the list starts at `s` or later, because the list is sorted by start. So every remaining interval starts after `end`, and by the overlap test none of them can touch the block. The block is final.

Inside a block the opposite holds: an interval with `start <= end` overlaps the block, so it belongs to the same merged group, and the group now reaches as far as the further of the two ends. Together these give the sweep an **invariant**: *after the first k intervals in sorted order, the output holds exactly the merged groups of those k intervals, and every block already output is final.* It is true after the first interval, every step keeps it true, and after the last step it is the answer.

Notice what sorting bought. The decision for each interval needs only the one block that is still open, not the whole output. That is the shape of every sweep in this lesson: sort so that everything behind you can be summarised in a variable or two.

### Dry run

The walkthrough's input, `[[2, 6], [8, 10], [1, 3], [15, 18], [9, 12]]`, sorted by start, is `[1, 3], [2, 6], [8, 10], [9, 12], [15, 18]`:

| Interval | Open block before | Compare | Action | Output so far |
| --- | --- | --- | --- | --- |
| [1, 3] | none | none | open [1, 3] | empty |
| [2, 6] | [1, 3] | 2 ≤ 3 | extend to [1, max(3, 6)] = [1, 6] | empty |
| [8, 10] | [1, 6] | 8 > 6 | close [1, 6], open [8, 10] | [1, 6] |
| [9, 12] | [8, 10] | 9 ≤ 10 | extend to [8, max(10, 12)] = [8, 12] | [1, 6] |
| [15, 18] | [8, 12] | 15 > 12 | close [8, 12], open [15, 18] | [1, 6] [8, 12] |
| end | [15, 18] | none | close [15, 18] | [1, 6] [8, 12] [15, 18] |

In the code the open block is simply the last interval in the output list, which saves a separate variable and the step after the loop: each interval either extends the last output interval or is appended as a new one.

### The code

The program merges the walkthrough's example and a second input built to test both boundary cases: [1, 4] and [4, 5] touch, and [2, 3] lies inside [1, 4].

```cpp
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

// Merges every group of overlapping closed intervals ([1, 4] and [4, 5] touch, so they merge).
vector<vector<int>> mergeIntervals(vector<vector<int>> intervals) {
    sort(intervals.begin(), intervals.end(),
         [](const vector<int>& a, const vector<int>& b) { return a[0] < b[0]; });
    vector<vector<int>> merged;
    for (const vector<int>& iv : intervals) {
        if (!merged.empty() && iv[0] <= merged.back()[1]) {
            // starts inside the open block: extend it (max, in case iv lies wholly inside)
            merged.back()[1] = max(merged.back()[1], iv[1]);
        } else {
            merged.push_back(iv);  // starts after the block ends: nothing later can reach back
        }
    }
    return merged;
}

string show(const vector<vector<int>>& list) {
    string out;
    for (const vector<int>& iv : list) {
        if (!out.empty()) out += " ";
        out += "[" + to_string(iv[0]) + ", " + to_string(iv[1]) + "]";
    }
    return out;
}

int main() {
    vector<vector<vector<int>>> inputs = {
        {{2, 6}, {8, 10}, {1, 3}, {15, 18}, {9, 12}},
        {{1, 4}, {4, 5}, {2, 3}},
    };
    for (const vector<vector<int>>& intervals : inputs) {
        cout << "Input:  " << show(intervals) << "\n";
        cout << "Merged: " << show(mergeIntervals(intervals)) << "\n";
    }
    return 0;
}
```

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Main {
    // Merges every group of overlapping closed intervals ([1, 4] and [4, 5] touch, so they merge).
    static List<int[]> mergeIntervals(int[][] intervals) {
        int[][] sorted = intervals.clone();
        Arrays.sort(sorted, (a, b) -> Integer.compare(a[0], b[0]));
        List<int[]> merged = new ArrayList<>();
        for (int[] iv : sorted) {
            if (!merged.isEmpty() && iv[0] <= merged.get(merged.size() - 1)[1]) {
                // starts inside the open block: extend it (max, in case iv lies wholly inside)
                int[] last = merged.get(merged.size() - 1);
                last[1] = Math.max(last[1], iv[1]);
            } else {
                merged.add(new int[] {iv[0], iv[1]}); // a copy, so extending it never edits the input
            }
        }
        return merged;
    }

    static String show(List<int[]> list) {
        StringBuilder out = new StringBuilder();
        for (int[] iv : list) {
            if (out.length() > 0) out.append(" ");
            out.append("[").append(iv[0]).append(", ").append(iv[1]).append("]");
        }
        return out.toString();
    }

    public static void main(String[] args) {
        int[][][] inputs = {
            {{2, 6}, {8, 10}, {1, 3}, {15, 18}, {9, 12}},
            {{1, 4}, {4, 5}, {2, 3}},
        };
        for (int[][] intervals : inputs) {
            System.out.println("Input:  " + show(Arrays.asList(intervals)));
            System.out.println("Merged: " + show(mergeIntervals(intervals)));
        }
    }
}
```

```python
def merge_intervals(intervals):
    """Merge every group of overlapping closed intervals ([1, 4] and [4, 5] touch, so they merge)."""
    merged = []
    for start, end in sorted(intervals, key=lambda iv: iv[0]):
        if merged and start <= merged[-1][1]:
            # starts inside the open block: extend it (max, in case it lies wholly inside)
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])  # starts after the block ends: nothing later can reach back
    return merged


def show(intervals):
    return " ".join(f"[{s}, {e}]" for s, e in intervals)


inputs = [
    [[2, 6], [8, 10], [1, 3], [15, 18], [9, 12]],
    [[1, 4], [4, 5], [2, 3]],
]
for intervals in inputs:
    print("Input: ", show(intervals))
    print("Merged:", show(merge_intervals(intervals)))
```

```javascript
// Merges every group of overlapping closed intervals ([1, 4] and [4, 5] touch, so they merge).
function mergeIntervals(intervals) {
  const sorted = intervals.slice().sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [start, end] of sorted) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) {
      // starts inside the open block: extend it (max, in case it lies wholly inside)
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]); // starts after the block ends: nothing later can reach back
    }
  }
  return merged;
}

const show = (list) => list.map(([s, e]) => `[${s}, ${e}]`).join(" ");

const inputs = [
  [[2, 6], [8, 10], [1, 3], [15, 18], [9, 12]],
  [[1, 4], [4, 5], [2, 3]],
];
for (const intervals of inputs) {
  console.log(`Input:  ${show(intervals)}`);
  console.log(`Merged: ${show(mergeIntervals(intervals))}`);
}
```

```output
Input:  [2, 6] [8, 10] [1, 3] [15, 18] [9, 12]
Merged: [1, 6] [8, 12] [15, 18]
Input:  [1, 4] [4, 5] [2, 3]
Merged: [1, 5]
```

The second input shows both boundary rules at work. After sorting, [2, 3] comes second and is absorbed without moving the end, thanks to the `max`. Then [4, 5] starts exactly at the block's end and, because these are closed intervals, extends it to [1, 5]. Change `<=` to `<` and the program would keep touching intervals apart, which is right for half-open meetings and wrong for [Merge Intervals](/problems/merge-intervals).

## Inserting an interval into a sorted list

[Insert Interval](/problems/insert-interval) gives you intervals that are already sorted and non-overlapping, plus one new interval to add. You could append it and run the merge above in O(n log n), but the list is sorted already, so a single pass in three phases does it in O(n):

```text
result = [], i = 0
while i < n and intervals[i].end < new.start:      # ends before the new one starts: untouched
    result.append(intervals[i]); i += 1
while i < n and intervals[i].start <= new.end:     # overlaps the new one: absorb it
    new.start = min(new.start, intervals[i].start)
    new.end   = max(new.end,   intervals[i].end)
    i += 1
result.append(new)
while i < n:                                       # starts after the new one ends: untouched
    result.append(intervals[i]); i += 1
```

The phases follow from the overlap test and the sorted order. An interval in the first phase ends before the new one starts, so it cannot overlap it. The second phase absorbs every interval that starts no later than the new end, and because the list is sorted those intervals are consecutive. Once one interval starts after the new end, every interval after it does too, which is the third phase. Inserting [4, 8] into `[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]` copies [1, 2], absorbs [3, 5], [6, 7] and [8, 10] into [3, 10], and copies [12, 16].

## Intersecting two sorted lists

[Interval List Intersections](/problems/interval-list-intersections) gives two lists of closed intervals, each sorted and disjoint, and asks for every stretch covered by both. Each list is sorted, so this is a merge-style walk with [two pointers](/roadmap/two-pointers), one in each list:

```text
i = 0, j = 0
while i < len(A) and j < len(B):
    lo = max(A[i].start, B[j].start)          # the later start
    hi = min(A[i].end,   B[j].end)            # the earlier end
    if lo <= hi: output [lo, hi]              # non-empty: this is the common part
    if A[i].end < B[j].end: i += 1            # drop the interval that ends first
    else: j += 1
```

Why drop the interval that ends first? Suppose `A[i]` ends no later than `B[j]`. Every later interval in B starts after `B[j]` ends, because B is sorted and disjoint, so it also starts after `A[i]` ends. `A[i]` can meet nothing else in B and is finished. `B[j]`, which reaches further, may still overlap `A[i + 1]`, so it stays. It is the same safe-discard argument as two pointers on a sorted array, and it makes the walk O(n + m).

## Meeting rooms: counting the overlap

The meeting-room problems ask how much overlap there is instead of merging it. Both use half-open meetings: one that ends at 10 frees its room for one that starts at 10.

**Can one person attend every meeting?** That is [Meeting Rooms](/problems/meeting-rooms): yes, exactly when no two meetings overlap. Sort by start and compare each meeting only with the one before it: if `meetings[i].start < meetings[i - 1].end`, there is a clash. Neighbours are enough because if any two meetings a and c overlap, with a first in sorted order, then the meeting b straight after a overlaps a as well: b starts no earlier than a and no later than c, and c starts before a ends.

**How many rooms are needed?** That is [Meeting Rooms II](/problems/meeting-rooms-ii), and the answer is the largest number of meetings in progress at any single moment. That many rooms are clearly necessary, since those meetings all run at once. They are also enough: take the meetings in order of start and give each a free room if there is one; a new room is opened only when every room is busy, which means that many meetings are running right then, so the count never passes the peak.

So you need the peak of a running count, and that is a **sweep line**: walk along the time axis, add one at every start, subtract one at every end, and remember the highest value.

```text
 time  0    5    10   15   20   25   30   35
       |----|----|----|----|----|----|----|
       [=============================)        [0, 30)
            [====)                            [5, 10)
                 [=========)                  [10, 20)
                      [=========)             [15, 25)
                           [==============)   [20, 35)
in use 1    2    2    3    3    2    1    0
```

The trick that makes it cheap is that the count does not care *which* meeting starts or ends, only *when*. So pull the start times into one sorted list and the end times into another, and walk both like the merge step of merge sort, taking the earlier event each time. A tie is where the boundary rule lives. With half-open meetings an end at time t goes before a start at t, so the room is freed first. With closed intervals the start goes first. That is the rule in [Minimum Number of Platforms](/problems/minimum-number-of-platforms), where a train arriving as another departs still needs its own platform.

### Dry run

Starts sorted: 0, 5, 10, 15, 20. Ends sorted: 10, 20, 25, 30, 35. The meetings are half-open, so an end wins a tie.

| Next start | Next end | Event | In use | Peak |
| --- | --- | --- | --- | --- |
| 0 | 10 | 0 < 10: a start | 1 | 1 |
| 5 | 10 | 5 < 10: a start | 2 | 2 |
| 10 | 10 | tie: the end goes first | 1 | 2 |
| 10 | 20 | 10 < 20: a start | 2 | 2 |
| 15 | 20 | 15 < 20: a start | 3 | 3 |
| 20 | 20 | tie: the end goes first | 2 | 3 |
| 20 | 25 | 20 < 25: a start | 3 | 3 |

Once every start has been seen the count can only fall, so the loop stops there: three rooms. Treat the same five intervals as closed and both ties go to the start instead. The count then reaches 4 at time 20, because [0, 30], [10, 20], [15, 25] and [20, 35] all contain the point 20, and four platforms are needed.

### The code

The function takes a flag for the boundary rule, and the program prints both answers for the same five intervals.

```cpp
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

// The most intervals in progress at one moment: the rooms (or platforms) needed.
// closed = true: an interval ending at t still clashes with one starting at t.
int minRooms(const vector<vector<int>>& intervals, bool closed) {
    vector<int> starts, ends;
    for (const vector<int>& iv : intervals) {
        starts.push_back(iv[0]);
        ends.push_back(iv[1]);
    }
    sort(starts.begin(), starts.end());  // only the times matter, not which meeting they
    sort(ends.begin(), ends.end());      // belong to, so starts and ends are sorted apart
    int n = (int)starts.size(), i = 0, j = 0, inUse = 0, peak = 0;
    while (i < n) {
        // on a tie, a half-open meeting leaves before the next arrives; a closed one stays
        bool startFirst = closed ? starts[i] <= ends[j] : starts[i] < ends[j];
        if (startFirst) {
            inUse++;
            i++;
            peak = max(peak, inUse);
        } else {
            inUse--;
            j++;
        }
    }
    return peak;
}

int main() {
    vector<vector<int>> meetings = {{0, 30}, {5, 10}, {10, 20}, {15, 25}, {20, 35}};
    cout << "Meetings:";
    for (const vector<int>& m : meetings) cout << " [" << m[0] << ", " << m[1] << "]";
    cout << "\n";
    cout << "Rooms, half-open [start, end): " << minRooms(meetings, false) << "\n";
    cout << "Platforms, closed [start, end]: " << minRooms(meetings, true) << "\n";
    return 0;
}
```

```java
import java.util.Arrays;

public class Main {
    // The most intervals in progress at one moment: the rooms (or platforms) needed.
    // closed = true: an interval ending at t still clashes with one starting at t.
    static int minRooms(int[][] intervals, boolean closed) {
        int n = intervals.length;
        int[] starts = new int[n], ends = new int[n];
        for (int k = 0; k < n; k++) {
            starts[k] = intervals[k][0];
            ends[k] = intervals[k][1];
        }
        Arrays.sort(starts); // only the times matter, not which meeting they
        Arrays.sort(ends);   // belong to, so starts and ends are sorted apart
        int i = 0, j = 0, inUse = 0, peak = 0;
        while (i < n) {
            // on a tie, a half-open meeting leaves before the next arrives; a closed one stays
            boolean startFirst = closed ? starts[i] <= ends[j] : starts[i] < ends[j];
            if (startFirst) {
                inUse++;
                i++;
                peak = Math.max(peak, inUse);
            } else {
                inUse--;
                j++;
            }
        }
        return peak;
    }

    public static void main(String[] args) {
        int[][] meetings = {{0, 30}, {5, 10}, {10, 20}, {15, 25}, {20, 35}};
        StringBuilder line = new StringBuilder("Meetings:");
        for (int[] m : meetings) line.append(" [").append(m[0]).append(", ").append(m[1]).append("]");
        System.out.println(line);
        System.out.println("Rooms, half-open [start, end): " + minRooms(meetings, false));
        System.out.println("Platforms, closed [start, end]: " + minRooms(meetings, true));
    }
}
```

```python
def min_rooms(intervals, closed):
    """The most intervals in progress at one moment: the rooms (or platforms) needed.
    closed=True: an interval ending at t still clashes with one starting at t."""
    starts = sorted(s for s, _ in intervals)  # only the times matter, not which meeting they
    ends = sorted(e for _, e in intervals)    # belong to, so starts and ends are sorted apart
    i = j = in_use = peak = 0
    while i < len(starts):
        # on a tie, a half-open meeting leaves before the next arrives; a closed one stays
        start_first = starts[i] <= ends[j] if closed else starts[i] < ends[j]
        if start_first:
            in_use += 1
            i += 1
            peak = max(peak, in_use)
        else:
            in_use -= 1
            j += 1
    return peak


meetings = [[0, 30], [5, 10], [10, 20], [15, 25], [20, 35]]
print("Meetings:", " ".join(f"[{s}, {e}]" for s, e in meetings))
print("Rooms, half-open [start, end):", min_rooms(meetings, False))
print("Platforms, closed [start, end]:", min_rooms(meetings, True))
```

```javascript
// The most intervals in progress at one moment: the rooms (or platforms) needed.
// closed = true: an interval ending at t still clashes with one starting at t.
function minRooms(intervals, closed) {
  const starts = intervals.map((iv) => iv[0]).sort((a, b) => a - b); // only the times matter, not which
  const ends = intervals.map((iv) => iv[1]).sort((a, b) => a - b); // meeting they belong to
  let i = 0;
  let j = 0;
  let inUse = 0;
  let peak = 0;
  while (i < starts.length) {
    // on a tie, a half-open meeting leaves before the next arrives; a closed one stays
    const startFirst = closed ? starts[i] <= ends[j] : starts[i] < ends[j];
    if (startFirst) {
      inUse++;
      i++;
      peak = Math.max(peak, inUse);
    } else {
      inUse--;
      j++;
    }
  }
  return peak;
}

const meetings = [[0, 30], [5, 10], [10, 20], [15, 25], [20, 35]];
console.log(`Meetings: ${meetings.map(([s, e]) => `[${s}, ${e}]`).join(" ")}`);
console.log(`Rooms, half-open [start, end): ${minRooms(meetings, false)}`);
console.log(`Platforms, closed [start, end]: ${minRooms(meetings, true)}`);
```

```output
Meetings: [0, 30] [5, 10] [10, 20] [15, 25] [20, 35]
Rooms, half-open [start, end): 3
Platforms, closed [start, end]: 4
```

**The heap version.** Many solutions keep a [min-heap](/roadmap/heap) of the end times of the rooms in use instead. Sort the meetings by start. For each one, if the smallest end in the heap is at or before its start, that room is free again, so pop it; then push the meeting's own end. The heap never shrinks overall, and its final size is the answer. It is also O(n log n), and it has one advantage: each pop is a real room being reused, so the same loop can say which room every meeting gets. The two-list sweep is shorter and needs only arrays.

**Weighted sweeps.** [Car Pooling](/problems/car-pooling) is the same sweep with weights: a trip adds its passengers at `from`, removes them at `to`, and the question is whether the running total ever passes the car's capacity. Because the stops are small whole numbers, a difference array (the [prefix sum](/roadmap/prefix-sum) idea run backwards) does it without any sorting.

## Removing overlaps: keep the interval that ends first

[Non-overlapping Intervals](/problems/non-overlapping-intervals) asks for the fewest intervals to remove so that the rest never overlap, which is the same as keeping the most. Here sorting by start leads you astray. Sort `[[1, 100], [2, 3], [4, 5], [6, 7]]` by start, keep each interval that does not clash with the last one kept, and you keep [1, 100] and must reject the other three. The best answer keeps three: [2, 3], [4, 5] and [6, 7].

The fix is a [greedy algorithm](/roadmap/greedy-algorithms) with a different order: **sort by end**, keep each interval that starts at or after the end of the last one kept, and count what you skip.

```text
sort intervals by end
kept_end = -infinity, removed = 0
for each interval in that order:
    if interval.start >= kept_end: kept_end = interval.end    # fits: keep it
    else: removed += 1                                         # clashes: remove it
```

Why is the earliest end a safe first choice? Use an **exchange argument**. Take any best selection of non-overlapping intervals and look at the first one in it. The interval with the earliest end overall, call it e, ends no later than that first one. Swap e in for it: everything else in the selection starts after the old first interval ended, so also after e ends, and nothing clashes. The selection is still valid, still the same size, and now begins with the greedy choice. Apply the same argument to what remains, and the greedy selection is as large as the best one.

The same loop with closed intervals solves [Minimum Number of Arrows to Burst Balloons](/problems/minimum-number-of-arrows). Shoot the first arrow at the end of the balloon that ends first: that bursts every balloon starting at or before that point. Shoot again only when a balloon starts strictly after the last arrow. The arrows are the balloons the loop keeps.

## Time and space complexity

| Problem | Approach | Time | Extra space |
| --- | --- | --- | --- |
| Merge intervals | compare every pair, repeat | O(n²) per round, several rounds | O(n) |
| Merge intervals | sort by start, one sweep | O(n log n) | O(n) for the output |
| Insert interval | three phases over the sorted list | O(n) | O(n) for the output |
| Intersect two lists | two pointers | O(n + m) | O(n + m) for the output |
| Can attend all meetings | sort, compare neighbours | O(n log n) | O(1) to O(n), for the sort |
| Minimum meeting rooms | sorted starts and ends, sweep | O(n log n) | O(n) |
| Minimum meeting rooms | sort, min-heap of end times | O(n log n) | O(n) |
| Fewest removals, arrows | sort by end, greedy | O(n log n) | O(1) to O(n), for the sort |

In almost every row the sort is the expensive part and the sweep after it is linear. When the input already arrives sorted, as in Insert Interval and Interval List Intersections, the sweep alone is the whole cost. The output itself can need O(n) space, because in the worst case nothing merges.

## How to recognise an interval problem

Read the statement for these signals:

- The input is a list of **pairs that are ranges**: `[start, end]`, `[from, to]`, arrival and departure times, a balloon's left and right edge.
- The question uses words like **overlap**, **conflict**, **clash**, **merge**, **cover**, **book**, **schedule**, **free time** or **gaps**.
- It asks for a **maximum at any moment**: rooms, platforms, seats, servers, people online. That is a sweep line over sorted starts and ends.
- It asks for the **most you can keep** or the **fewest you must remove** so that nothing overlaps. That is the earliest-end greedy.
- Two **sorted lists of ranges** must be combined or compared. That is two pointers.

If the ranges are positions in an array and the question is about the sums over them, a difference array or prefix sum is often simpler than a sweep, as in Car Pooling.

## Common mistakes

- **Mixing up closed and half-open.** `<=` against `<` is the whole difference between merging [1, 4] with [4, 5] and keeping them apart. Find the sentence in the statement that settles touching ends, and write the comparison from it.
- **Forgetting the max when extending.** Writing `end = interval.end` instead of `end = max(end, interval.end)` shrinks a block when a short interval sits inside a long one: [1, 10] followed by [2, 3] would become [1, 3].
- **Dropping the last block.** If the open block lives in its own variable instead of at the end of the output list, it has to be added after the loop. Without that line the final group vanishes.
- **Sorting by the wrong key.** Merging, inserting and meeting rooms sort by start; keeping the most intervals and the arrow problem sort by end. The `[[1, 100], [2, 3], [4, 5], [6, 7]]` example is the quick check.
- **A broken comparator.** In JavaScript, `intervals.sort()` with no comparator sorts the pairs as strings, so [10, 12] comes before [9, 11]. In Java, `(a, b) -> a[0] - b[0]` overflows when one start is near −2³¹ and the other is positive; `Integer.compare(a[0], b[0])` never does.
- **Editing the input by accident.** In Java and JavaScript, pushing the input's own pair into the output and then extending its end changes the input too. Copy the pair when you open a block, as the programs above do.

## Practice in this order

Start with the problems where the sweep is the whole solution, then move to the ones that need a counting or greedy argument:

1. [Meeting Rooms](/problems/meeting-rooms): sort and compare neighbours, the overlap test on its own.
2. [Merge Intervals](/problems/merge-intervals): the sort-and-sweep from this lesson.
3. [Insert Interval](/problems/insert-interval): three phases over a sorted list, no sort needed.
4. [Interval List Intersections](/problems/interval-list-intersections): two pointers and the drop-the-earlier-end rule.
5. [Meeting Rooms II](/problems/meeting-rooms-ii): the sweep line over sorted starts and ends.
6. [Minimum Number of Platforms](/problems/minimum-number-of-platforms): the same count with closed intervals.
7. [Non-overlapping Intervals](/problems/non-overlapping-intervals): the earliest-end greedy.
8. [Minimum Number of Arrows to Burst Balloons](/problems/minimum-number-of-arrows): the greedy again, with closed ends.
9. [Car Pooling](/problems/car-pooling): a weighted sweep against a capacity.

The [intervals problem list](/challenges/intervals) has every interval problem in the catalogue, from easy to hard. When the first five feel routine, the next stage of the roadmap is the heap, which gives you a second way to solve Meeting Rooms II and a tool for every "keep the k best" question.
