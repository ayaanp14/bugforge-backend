---
title: Greedy Algorithms
stage: greedy
order: 2
minutes: 13
level: Intermediate
hub: greedy
practice: assign-cookies, lemonade-change, maximum-units-on-a-truck, jump-game, jump-game-ii, non-overlapping-intervals, gas-station, partition-labels, candy
updated: 2026-10-03
seo-title: Greedy Algorithms: How They Work and How to Prove Them
description: Learn greedy algorithms: the greedy-choice property, exchange-argument proofs, activity selection and jump game, in C++, Java, Python and JavaScript.
question: What is a greedy algorithm?
answer: A greedy algorithm builds a solution one step at a time, always taking the choice that looks best right now and never revisiting it. It is correct only when the problem has the greedy-choice property — some optimal solution begins with the greedy choice — which is usually proved with an exchange argument. Greedy solutions are fast, typically a sort plus one pass in O(n log n).
q: How do I know if a greedy algorithm is correct?
a: Prove two things: that some optimal solution makes the same first choice as greedy (the greedy-choice property), and that after that choice what remains is a smaller copy of the same problem (optimal substructure). The usual tool is an exchange argument: take any optimal solution and swap its first choice for the greedy one without making it worse. If you cannot, test small cases against a brute force before trusting the greedy.
q: What is the difference between greedy and dynamic programming?
a: Greedy commits to one choice at each step and never reconsiders it, so it follows a single path. Dynamic programming tries every choice at each step and keeps the best result for each subproblem, which is slower but stays correct when the locally best choice is wrong. Coin change with coins 1, 3 and 4 is the classic case where greedy fails and dynamic programming is needed.
q: What is an exchange argument?
a: A way to prove a greedy algorithm optimal. Take any optimal solution that differs from the greedy one, find the first place they differ, and swap in the greedy choice, showing the result is still valid and no worse. Repeating the swap turns the optimal solution into the greedy one without losing anything, so the greedy solution is optimal too.
q: Why does activity selection sort by end time and not by start time?
a: Finishing earliest leaves the most room for everything after it, and an exchange argument proves that no schedule can do better. Sorting by start time fails because one long meeting that starts first can block several short ones. Sorting by duration fails too: a short meeting can overlap two others that would both have fitted.
q: Is greedy always faster than dynamic programming?
a: Usually, because greedy makes one decision per element — O(n log n) for a sort and O(n) for the pass — while dynamic programming fills a table of subproblems. But speed is worthless if the greedy answer is wrong. When the greedy-choice property does not hold, dynamic programming is the correct tool.
---
A cashier giving ₹80 in change hands over a ₹50 note, then a ₹20, then a ₹10: at each step, the largest note that still fits. Nobody plans the whole answer in advance, and nobody takes a note back. That is a **greedy algorithm**: build the solution one step at a time, take the choice that looks best at that moment, and never revisit it.

Greedy solutions are short and fast, often a sort and one loop. The difficulty is that they are just as short when they are wrong — the cashier's rule fails for coins of 1, 3 and 4 — so the skill has two halves: finding the right rule, and proving it before you trust it.

## Why trying every choice is too slow

Take **activity selection**: one meeting room and a list of meetings, each with a start and an end time. What is the largest number of meetings the room can hold without overlaps? The safe approach tries every subset — 2ⁿ of them, about a million for 20 meetings and 10¹⁵ for 50. [Dynamic programming](/roadmap/dynamic-programming) does better, but greedy does better still: sort by end time and sweep once, O(n log n), provably optimal.

## The idea: take the best step now, never look back

A greedy algorithm has three parts:

- **A rule for the next choice**: the meeting that ends first, the largest coin that fits, the jump that reaches farthest.
- **A commitment**: once made, a choice is final. No backtracking is what makes greedy fast.
- **A smaller problem left over**, to which the same rule applies.

The simplest example is [Jump Game](/problems/jump-game): each `nums[i]` is the longest jump from index i — can you reach the last index? Walk left to right keeping one number, `reach`, the farthest index any jump so far can land on. Every index up to it is reachable, since a shorter jump is always allowed; nothing else about the past matters.

@walkthrough

## When greedy is correct

A greedy algorithm is correct when the problem has two properties:

- **The greedy-choice property**: some optimal solution makes the greedy first choice, so the locally best option never loses.
- **Optimal substructure**: after that choice, an optimal solution of the smaller problem completes an optimal whole.

The first is the one to prove, and two patterns cover almost every interview problem. An **exchange argument** swaps any optimal solution's choice for the greedy one without making it worse. **Greedy stays ahead** shows that after every step greedy is at least as far along as any other solution. If you can find neither, compare your greedy with a brute force on small random inputs: greedy bugs are wrong ideas, and only a counterexample shows them.

## Activity selection: earliest finish first

Three rules look plausible: take the meeting that starts first, the shortest, or the one that ends first. Two small counterexamples settle it.

@figure rules

So sort by end time, and keep every meeting that starts once the room is free. A meeting may start the moment the previous one ends; if a problem says otherwise, change `>=` to `>`.

@figure activity

### Why earliest finish is optimal

Let g be the meeting that ends first, and take any optimal schedule whose first meeting f is not g. Since g ends no later than f, everything after f also starts after g ends, so replacing f with g creates no overlap and keeps the count. Some optimal schedule therefore begins with g, and the same argument applies to what is left. Repeated, it turns any optimal schedule into greedy's:

@figure exchange

The intuition worth keeping: the meeting that finishes first leaves the room free the longest for everything else.

### The code

```cpp
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

struct Meeting {
    int start, end;
};

string show(const Meeting& m) { return "(" + to_string(m.start) + "," + to_string(m.end) + ")"; }

// Most meetings one room can hold: always take the one that ends first.
int maxMeetings(vector<Meeting> meetings) {
    sort(meetings.begin(), meetings.end(), [](const Meeting& a, const Meeting& b) {
        if (a.end != b.end) return a.end < b.end;      // earliest finish first
        return a.start < b.start;                      // ties in a fixed order
    });
    cout << "sorted by end:";
    for (const Meeting& m : meetings) cout << " " << show(m);
    cout << "\n";
    int count = 0, freeAt = 0;                         // the room is free from time 0
    for (const Meeting& m : meetings) {
        if (m.start >= freeAt) {                       // fits after the last meeting taken
            cout << "take " << show(m) << "\n";
            count++;
            freeAt = m.end;
        } else {
            cout << "skip " << show(m) << ": starts before " << freeAt << "\n";
        }
    }
    return count;
}

int main() {
    vector<Meeting> meetings = {{5, 9}, {1, 2}, {5, 7}, {0, 6}, {8, 9}, {3, 4}};
    int best = maxMeetings(meetings);                  // prints its trace first
    cout << "most meetings: " << best << "\n";
    return 0;
}
```

```java
import java.util.Arrays;

public class Main {
    static String show(int[] m) {
        return "(" + m[0] + "," + m[1] + ")";
    }

    // Most meetings one room can hold: always take the one that ends first.
    static int maxMeetings(int[][] meetings) {
        int[][] sorted = meetings.clone();
        Arrays.sort(sorted, (a, b) -> a[1] != b[1]
                ? Integer.compare(a[1], b[1])          // earliest finish first
                : Integer.compare(a[0], b[0]));        // ties in a fixed order
        StringBuilder line = new StringBuilder("sorted by end:");
        for (int[] m : sorted) line.append(" ").append(show(m));
        System.out.println(line);
        int count = 0, freeAt = 0;                     // the room is free from time 0
        for (int[] m : sorted) {
            if (m[0] >= freeAt) {                      // fits after the last meeting taken
                System.out.println("take " + show(m));
                count++;
                freeAt = m[1];
            } else {
                System.out.println("skip " + show(m) + ": starts before " + freeAt);
            }
        }
        return count;
    }

    public static void main(String[] args) {
        int[][] meetings = {{5, 9}, {1, 2}, {5, 7}, {0, 6}, {8, 9}, {3, 4}};
        int best = maxMeetings(meetings);
        System.out.println("most meetings: " + best);
    }
}
```

```python
def show(m):
    return f"({m[0]},{m[1]})"


def max_meetings(meetings):
    """Most meetings one room can hold: always take the one that ends first."""
    ordered = sorted(meetings, key=lambda m: (m[1], m[0]))   # earliest finish; ties by start
    print("sorted by end:", " ".join(show(m) for m in ordered))
    count, free_at = 0, 0                      # the room is free from time 0
    for m in ordered:
        if m[0] >= free_at:                    # fits after the last meeting taken
            print("take", show(m))
            count += 1
            free_at = m[1]
        else:
            print(f"skip {show(m)}: starts before {free_at}")
    return count


meetings = [(5, 9), (1, 2), (5, 7), (0, 6), (8, 9), (3, 4)]
best = max_meetings(meetings)
print("most meetings:", best)
```

```javascript
const show = (m) => `(${m[0]},${m[1]})`;

// Most meetings one room can hold: always take the one that ends first.
function maxMeetings(meetings) {
  // earliest finish first; ties in a fixed order
  const sorted = meetings.slice().sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  console.log(`sorted by end: ${sorted.map(show).join(" ")}`);
  let count = 0;
  let freeAt = 0; // the room is free from time 0
  for (const m of sorted) {
    if (m[0] >= freeAt) {
      // fits after the last meeting taken
      console.log(`take ${show(m)}`);
      count++;
      freeAt = m[1];
    } else {
      console.log(`skip ${show(m)}: starts before ${freeAt}`);
    }
  }
  return count;
}

const meetings = [[5, 9], [1, 2], [5, 7], [0, 6], [8, 9], [3, 4]];
const best = maxMeetings(meetings);
console.log(`most meetings: ${best}`);
```

```output
sorted by end: (1,2) (3,4) (0,6) (5,7) (5,9) (8,9)
take (1,2)
take (3,4)
skip (0,6): starts before 4
take (5,7)
skip (5,9): starts before 7
take (8,9)
most meetings: 4
```

The same rule, turned round, solves [Non-overlapping Intervals](/problems/non-overlapping-intervals): the fewest intervals to remove is n minus the most you can keep. The whole family is the subject of the [intervals](/roadmap/intervals) lesson.

## Jump Game II: the fewest jumps

[Jump Game II](/problems/jump-game-ii) asks for the **fewest** jumps to the last index. Now the choice matters, and the obvious greedy — always jump as far as possible — is wrong. The right greedy thinks in **levels**: the indices reachable with exactly k jumps form one contiguous range, and the next range ends at the farthest landing from it.

@figure jump-levels

The scan keeps `end`, the last index of the current level, and `farthest`, the farthest landing from it; when `i` reaches `end`, it counts a jump and sets `end = farthest`. It is a [breadth-first search](/roadmap/breadth-first-search) over levels in two numbers, and its proof is "greedy stays ahead". If `farthest` cannot pass `i` when a level ends, the end is unreachable.

### The code

```cpp
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

// Fewest jumps from index 0 to the last index, or -1 if it cannot be reached.
int minJumps(const vector<int>& nums) {
    int n = (int)nums.size();
    int jumps = 0, end = 0, farthest = 0;
    for (int i = 0; i < n - 1; i++) {
        farthest = max(farthest, i + nums[i]);   // best landing point one jump from here
        if (i == end) {                          // the current jump's range is used up
            if (farthest <= i) return -1;        // nothing gets past i: stuck
            jumps++;
            end = farthest;                      // the next level reaches this far
        }
    }
    return jumps;
}

int main() {
    vector<vector<int>> tests = {{2, 3, 1, 1, 4}, {1, 3, 0, 0, 2, 0, 1}, {3, 2, 1, 0, 4}};
    for (const vector<int>& nums : tests) {
        cout << "nums";
        for (int x : nums) cout << " " << x;
        int jumps = minJumps(nums);
        if (jumps == -1) cout << ": the end cannot be reached\n";
        else cout << ": fewest jumps " << jumps << "\n";
    }
    return 0;
}
```

```java
public class Main {
    // Fewest jumps from index 0 to the last index, or -1 if it cannot be reached.
    static int minJumps(int[] nums) {
        int n = nums.length;
        int jumps = 0, end = 0, farthest = 0;
        for (int i = 0; i < n - 1; i++) {
            farthest = Math.max(farthest, i + nums[i]);   // best landing point one jump from here
            if (i == end) {                               // the current jump's range is used up
                if (farthest <= i) return -1;             // nothing gets past i: stuck
                jumps++;
                end = farthest;                           // the next level reaches this far
            }
        }
        return jumps;
    }

    public static void main(String[] args) {
        int[][] tests = {{2, 3, 1, 1, 4}, {1, 3, 0, 0, 2, 0, 1}, {3, 2, 1, 0, 4}};
        for (int[] nums : tests) {
            StringBuilder line = new StringBuilder("nums");
            for (int x : nums) line.append(" ").append(x);
            int jumps = minJumps(nums);
            if (jumps == -1) line.append(": the end cannot be reached");
            else line.append(": fewest jumps ").append(jumps);
            System.out.println(line);
        }
    }
}
```

```python
def min_jumps(nums):
    """Fewest jumps from index 0 to the last index, or -1 if it cannot be reached."""
    n = len(nums)
    jumps, end, farthest = 0, 0, 0
    for i in range(n - 1):
        farthest = max(farthest, i + nums[i])   # best landing point one jump from here
        if i == end:                            # the current jump's range is used up
            if farthest <= i:                   # nothing gets past i: stuck
                return -1
            jumps += 1
            end = farthest                      # the next level reaches this far
    return jumps


tests = [[2, 3, 1, 1, 4], [1, 3, 0, 0, 2, 0, 1], [3, 2, 1, 0, 4]]
for nums in tests:
    jumps = min_jumps(nums)
    label = "nums " + " ".join(str(x) for x in nums)
    if jumps == -1:
        print(f"{label}: the end cannot be reached")
    else:
        print(f"{label}: fewest jumps {jumps}")
```

```javascript
// Fewest jumps from index 0 to the last index, or -1 if it cannot be reached.
function minJumps(nums) {
  const n = nums.length;
  let jumps = 0;
  let end = 0;
  let farthest = 0;
  for (let i = 0; i < n - 1; i++) {
    farthest = Math.max(farthest, i + nums[i]); // best landing point one jump from here
    if (i === end) {
      // the current jump's range is used up
      if (farthest <= i) return -1; // nothing gets past i: stuck
      jumps++;
      end = farthest; // the next level reaches this far
    }
  }
  return jumps;
}

const tests = [[2, 3, 1, 1, 4], [1, 3, 0, 0, 2, 0, 1], [3, 2, 1, 0, 4]];
for (const nums of tests) {
  const jumps = minJumps(nums);
  const label = `nums ${nums.join(" ")}`;
  if (jumps === -1) console.log(`${label}: the end cannot be reached`);
  else console.log(`${label}: fewest jumps ${jumps}`);
}
```

```output
nums 2 3 1 1 4: fewest jumps 2
nums 1 3 0 0 2 0 1: fewest jumps 3
nums 3 2 1 0 4: the end cannot be reached
```

The second test is the array from the walkthrough: 0 to 1, 1 to 4, 4 to 6.

## Assign cookies: match smallest with smallest

In [Assign Cookies](/problems/assign-cookies) a child is content with a cookie at least their greed factor. Sort both lists and give each cookie, smallest first, to the least greedy child still waiting if it is big enough. The exchange argument: if an optimal assignment gives that child a bigger cookie than needed, swap it with the smallest that would do — whoever held that one is still content. Sorting first is what makes it a two-pointer sweep; see [sorting algorithms](/roadmap/sorting-algorithms).

## When greedy fails

Greedy has no safety net, so know the classic failures. **Coin change**: largest-first is optimal for coin systems like the rupee's, but not for arbitrary coins — [Coin Change](/problems/coin-change) needs [dynamic programming](/roadmap/dynamic-programming).

@figure coins

**Fractional versus 0/1 knapsack**: when you may take part of an item, best value per kilogram first is optimal; when items are whole, the same rule loses, because the exchange argument needs to swap part of an item. That is the [knapsack problem](/roadmap/knapsack-problem).

@figure knapsack

A greedy rule that sounds right is a hypothesis. Look for a counterexample with three or four items before you code it.

## More greedy shapes

- **[Lemonade Change](/problems/lemonade-change)**: for a $20, give $10 + $5 rather than three $5s, keeping the most flexible bills.
- **[Maximum Units on a Truck](/problems/maximum-units-on-a-truck)**: most units per box first.
- **[Gas Station](/problems/gas-station)**: if the tank goes negative between stations i and j, no station in between can be the start.
- **[Partition Labels](/problems/partition-labels)**: extend each piece to the last occurrence of every letter in it.
- **[Minimum Number of Platforms](/problems/minimum-number-of-platforms)**: sort arrivals and departures separately and sweep them.
- **[Candy](/problems/candy)**: two greedy passes, one per direction.

## Time and space complexity

| Problem | Brute force | Greedy | Extra space |
| --- | --- | --- | --- |
| Activity selection | O(2ⁿ × n) over all subsets | O(n log n): sort, then one sweep | O(1) beyond the sort |
| Jump Game | exponential over all paths | O(n): track the farthest reach | O(1) |
| Jump Game II | O(n²) dynamic programming | O(n): levels as two numbers | O(1) |
| Fractional knapsack | — | O(n log n): sort by value per weight | O(1) beyond the sort |
| Coin change, any coins | greedy is wrong | dynamic programming, O(amount × coins) | O(amount) |

Most greedy solutions cost what their sort costs, because the rule needs the input in some order; the sweep afterwards is linear.

## How to recognise a greedy problem

- A **maximum or minimum count** — the most meetings, the fewest jumps, the most children — where choices do not interact much beyond an obvious order.
- A natural **order** to process things in: by end time, size, deadline or ratio.
- A rule you can phrase as "**always take the … that leaves the most room**".
- A small **counterexample** is hard to find. (If you find one easily, think [dynamic programming](/roadmap/dynamic-programming).)
- Large constraints (n up to 10⁵) and a single number as the answer.

## Common mistakes

- **Trusting a rule without a proof or a test**: earliest start and largest coin first both sound right.
- **Sorting by the wrong key**: activity selection sorts by **end**; merging intervals by **start**.
- **Touching endpoints**: does a meeting ending at 4 clash with one starting at 4? Match `>=` or `>` to the statement.
- **Being greedy on the wrong quantity**: the longest single jump, not the level's farthest reach.
- **Forgetting the impossible case**: a zero you cannot pass, less fuel than cost.

## Practice in this order

1. [Assign Cookies](/problems/assign-cookies): sort both, match smallest with smallest.
2. [Lemonade Change](/problems/lemonade-change): keep the most useful bills.
3. [Maximum Units on a Truck](/problems/maximum-units-on-a-truck): best ratio first.
4. [Jump Game](/problems/jump-game): keep only the farthest reach.
5. [Jump Game II](/problems/jump-game-ii): count levels, the second program.
6. [Non-overlapping Intervals](/problems/non-overlapping-intervals): activity selection, counted the other way.
7. [Gas Station](/problems/gas-station): a one-pass greedy with a proof you must find.
8. [Partition Labels](/problems/partition-labels): extend to the farthest last occurrence.
9. [Candy](/problems/candy): two passes that together satisfy both neighbours.

The [greedy problem list](/challenges/greedy) has every greedy problem in the catalogue. Next on the road is [intervals](/roadmap/intervals), where sorting and greedy sweeps meet.
