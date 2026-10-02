---
title: Interval Problems: Merge, Insert and Sweep
stage: intervals
order: 1
minutes: 12
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
An **interval** is a range on a line with a start and an end: a meeting, a train at a platform, a hotel booking. Interval questions come in a few shapes — merge the ones that overlap, fit a new one into a schedule, count how many run at the busiest moment, remove the fewest so that nothing clashes — and almost all of them are solved by the same two moves: **sort**, then **sweep** once from left to right. Each interval is a pair `[start, end]`, so the input is a 2D array.

Everything starts with one question: do two intervals overlap? It is easier to say when they do **not** — one ends before the other starts — and the overlap test is the negation of that.

@figure overlap-test

Settle what the end point means before you write a comparison. A **closed** interval `[start, end]` includes both ends, so [1, 4] and [4, 5] overlap, as in Merge Intervals. A **half-open** interval `[start, end)` stops just before its end, so a meeting ending at 10 frees the room for one starting at 10, as in the meeting-room problems. A phrase such as "touching intervals merge" tells you which you have.

## Why comparing every pair is too slow

The direct way to merge compares every pair, combines any two that overlap, and repeats until nothing changes. One round is n × (n − 1) / 2 comparisons — five billion for n = 100,000 — and one round is not enough, because merging creates new overlaps: [1, 3] misses [5, 8], but once [2, 6] joins it, [1, 6] reaches [5, 8]. In the order given, overlapping intervals can sit anywhere in the list. Sorting fixes exactly that.

## The idea: sort by start, then sweep

- **Sort by start**, and keep one **open block**: the merged interval being built.
- If the next interval **starts at or before the block's end**, it overlaps: the end becomes `max(end, its end)`, so an interval lying inside the block cannot shrink it.
- Otherwise the block is **finished**: output it and open a new one.

The sort is O(n log n) and the sweep looks at each interval once: about two million steps for n = 100,000 instead of billions.

@walkthrough

## Why one pass is enough

The sweep closes a block the moment a start passes its end and never looks at it again. That is safe only because of the sort: every interval still to come starts at that start or later, so none can reach back.

@figure one-pass

That gives the sweep its **invariant**: *after the first k intervals in sorted order, the output holds exactly their merged groups, and every block already output is final.* The decision for each interval needs only the one block still open — the shape of every sweep in this lesson: sort so that everything behind you fits in a variable or two.

### The code

The open block is simply the last interval in the output list. The second input tests both boundaries: [1, 4] and [4, 5] touch, and [2, 3] lies inside [1, 4].

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

Change `<=` to `<` and touching intervals stay apart — right for half-open meetings, wrong for [Merge Intervals](/problems/merge-intervals).

## Inserting and intersecting sorted lists

When the input is already sorted, the sweep alone is the job. [Insert Interval](/problems/insert-interval) adds one interval to a sorted, non-overlapping list in O(n): copy what ends before it, absorb what overlaps it, copy the rest. The absorbed intervals are consecutive because the list is sorted.

@figure insert

[Interval List Intersections](/problems/interval-list-intersections) asks for every stretch covered by both of two sorted lists: a walk with [two pointers](/roadmap/two-pointers), one per list. The interval that ends first can meet nothing else in the other list, whose later intervals all start after it ends, so its pointer moves. That makes the walk O(n + m).

@figure intersections

## Meeting rooms: counting the overlap

[Meeting Rooms](/problems/meeting-rooms) asks whether one person can attend everything: sort by start and compare each meeting with the one before it. Neighbours are enough, because if any two meetings overlap, the first also overlaps the meeting straight after it.

[Meeting Rooms II](/problems/meeting-rooms-ii) asks how many rooms are needed: the largest number of meetings running at one moment. That many are necessary, since those meetings run at once, and enough, because a new room opens only when every room is busy. So you want the peak of a running count — a **sweep line**, +1 at every start and −1 at every end. Only *when* matters, not *which* meeting, so starts and ends are sorted as separate lists.

@figure sweep-line

Ties carry the boundary rule: for half-open meetings an end at t goes before a start at t; for closed intervals, as in [Minimum Number of Platforms](/problems/minimum-number-of-platforms), the start goes first. The function takes that rule as a flag.

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

A [min-heap](/roadmap/heap) of the rooms' end times gives the same answer in O(n log n) and can say which room each meeting gets. [Car Pooling](/problems/car-pooling) is the sweep with weights, and with small whole-number stops a difference array — the [prefix sum](/roadmap/prefix-sum) idea run backwards — does it without sorting.

## Removing overlaps: keep the interval that ends first

[Non-overlapping Intervals](/problems/non-overlapping-intervals) asks for the fewest removals so that nothing overlaps — the same as keeping the most. Sorting by start fails here; the [greedy algorithm](/roadmap/greedy-algorithms) that works **sorts by end** and keeps each interval that starts at or after the last kept end.

@figure earliest-end

The proof is an **exchange argument**: in any best selection, swap the first interval for the one that ends earliest overall. Everything else started after the old first one ended, so also after the new one ends — still valid, same size. Repeat on the rest. With closed ends and a strict comparison, the same loop counts the arrows in [Minimum Number of Arrows to Burst Balloons](/problems/minimum-number-of-arrows).

## Time and space complexity

| Problem | Approach | Time | Extra space |
| --- | --- | --- | --- |
| Merge | compare every pair, repeat | O(n²) per round | O(n) |
| Merge | sort by start, sweep | O(n log n) | O(n) output |
| Insert | three phases, already sorted | O(n) | O(n) output |
| Intersect two lists | two pointers | O(n + m) | O(n + m) output |
| Meeting rooms | sorted starts and ends | O(n log n) | O(n) |
| Fewest removals | sort by end, greedy | O(n log n) | O(1) beyond the sort |

The sort is nearly always the expensive part; when the input arrives sorted, the sweep alone is the cost.

## How to recognise an interval problem

- The input is **pairs that are ranges**: `[start, end]`, arrival and departure times.
- The statement says **overlap**, **conflict**, **merge**, **book** or **schedule**.
- It asks for a **maximum at any moment** — rooms, platforms: a sweep line.
- It asks for the **most you can keep** or the **fewest to remove**: the earliest-end greedy.
- Two **sorted lists of ranges** must be combined: two pointers.

## Common mistakes

- **Closed against half-open**: `<=` or `<` decides whether [1, 4] and [4, 5] merge.
- **No max when extending**: [1, 10] then [2, 3] must not become [1, 3].
- **Dropping the last block** when the open block lives in its own variable.
- **The wrong sort key**: merging sorts by start, keeping the most sorts by end.
- **A broken comparator**: JavaScript's bare `sort()` compares pairs as strings; Java's `a[0] - b[0]` can overflow, `Integer.compare` cannot.

## Practice in this order

1. [Meeting Rooms](/problems/meeting-rooms): sort and compare neighbours.
2. [Merge Intervals](/problems/merge-intervals): the sort-and-sweep above.
3. [Insert Interval](/problems/insert-interval): three phases, no sort needed.
4. [Interval List Intersections](/problems/interval-list-intersections): two pointers.
5. [Meeting Rooms II](/problems/meeting-rooms-ii): the sweep line.
6. [Minimum Number of Platforms](/problems/minimum-number-of-platforms): the count with closed intervals.
7. [Non-overlapping Intervals](/problems/non-overlapping-intervals): the earliest-end greedy.
8. [Minimum Number of Arrows to Burst Balloons](/problems/minimum-number-of-arrows): the greedy with closed ends.
9. [Car Pooling](/problems/car-pooling): a weighted sweep against a capacity.

The [intervals problem list](/challenges/intervals) has every interval problem in the catalogue, easiest first. When the first five feel routine, the next stage is the [heap](/roadmap/heap): a second way to solve Meeting Rooms II and a tool for every "keep the k best" question.
