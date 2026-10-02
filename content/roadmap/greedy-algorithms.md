---
title: Greedy Algorithms
stage: greedy
order: 2
minutes: 22
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

Greedy solutions are short and fast — often a sort and a single loop — and they answer a large share of interview questions about scheduling, assigning and reaching. The difficulty is that they are just as short when they are wrong. The same cashier's rule fails for a currency with coins of 1, 3 and 4. So this lesson is about both halves of the skill: finding the right greedy rule, and proving it correct with an exchange argument before you trust it. Every example is shown in C++, Java, Python and JavaScript.

## Why trying every choice is too slow

Take the classic **activity selection** problem: you have one meeting room and a list of meetings, each with a start and an end time. What is the largest number of meetings the room can hold without any two overlapping?

The safe approach tries every subset of meetings, keeps those with no overlap, and reports the largest. With n meetings there are 2ⁿ subsets. For 20 meetings that is about a million, already slow; for 50 it is about 10¹⁵, which no computer will finish. A smarter search with [dynamic programming](/roadmap/dynamic-programming) gets this down to O(n log n) or O(n²) with a table, but greedy does better still: sort the meetings by end time, sweep once, and keep every meeting that fits. That is O(n log n) for the sort and O(n) for the sweep, and it is provably optimal.

## The idea: take the best step now, never look back

A greedy algorithm has three parts:

- **A rule for the next choice** — the meeting that ends first, the largest coin that fits, the jump that reaches farthest.
- **A commitment.** Once a choice is made it is final. There is no backtracking, which is what makes greedy fast.
- **A smaller problem left over.** After the choice, what remains is the same kind of problem on less input, and the same rule applies to it.

The simplest example is [Jump Game](/problems/jump-game). Each `nums[i]` is the longest jump you can make from index `i`; can you reach the last index from index 0? You never need to decide *which* jumps to take. Walk left to right and keep one number, `reach`: the farthest index any jump seen so far can land on.

```text
 index:   0  1  2  3  4
 nums:  [ 3, 2, 1, 0, 4 ]
 i = 0: reach = max(0, 0 + 3) = 3
 i = 1: reach = max(3, 1 + 2) = 3
 i = 2: reach = max(3, 2 + 1) = 3
 i = 3: reach = max(3, 3 + 0) = 3
 i = 4: 4 > reach              stuck: index 4 cannot be reached
```

Every index up to `reach` can be reached, because some earlier index jumps past it and you can always jump shorter than the maximum. If the walk ever stands on an index beyond `reach`, nothing before it gets there, and the answer is no. The greedy choice is "remember only the farthest reach"; nothing else about the past matters.

@walkthrough

## When greedy is correct

A greedy algorithm is correct when the problem has two properties:

- **The greedy-choice property.** There is an optimal solution that makes the greedy first choice. You never lose by taking the locally best option.
- **Optimal substructure.** After the greedy choice, an optimal solution of the remaining smaller problem, combined with that choice, is optimal for the whole problem.

The second property is shared with [dynamic programming](/roadmap/dynamic-programming). The first is what greedy adds, and it is the one to prove. Two proof patterns cover almost every interview problem:

- **Exchange argument.** Take any optimal solution. If it does not make the greedy choice, swap its choice for the greedy one, and show the result is still valid and no worse. Then an optimal solution with the greedy choice exists.
- **Greedy stays ahead.** Show that after every step, the greedy solution is at least as good as any other solution after the same number of steps — it has reached at least as far, finished at least as early, shipped at least as much. If it is never behind, it cannot lose at the end.

When you cannot find either proof, do not guess. Write a brute force for tiny inputs and compare it with your greedy on a few hundred random cases. Greedy bugs are not off-by-ones; they are wrong ideas, and only a counterexample shows them.

## Activity selection: earliest finish first

Back to the meeting room. Three rules look plausible: take the meeting that starts first, the shortest meeting, or the meeting that ends first. Only the last is correct, and counterexamples dispose of the other two quickly:

- **Earliest start fails.** Meetings `(0,10)`, `(1,2)`, `(3,4)`: starting first picks `(0,10)`, which blocks both others. The answer is 2.
- **Shortest first fails.** Meetings `(1,5)`, `(4,7)`, `(6,10)`: the shortest, `(4,7)`, overlaps both others. The answer is 2, from `(1,5)` and `(6,10)`.

**Earliest finish works**, and the exchange argument shows why. Let `g` be the meeting that ends first of all. Take any optimal schedule and let `f` be its first meeting. Since `g` ends no later than any meeting, `end(g) ≤ end(f)`. Every other meeting in the schedule starts at or after the time `f` ends, so also at or after the time `g` ends. Replace `f` with `g`: no new overlap appears, and the schedule has the same number of meetings. So some optimal schedule starts with `g` — the greedy-choice property. What is left is the same problem on the meetings that start after `g` ends, and the same argument applies to it. By repeating it, greedy's whole schedule is optimal.

The intuition is worth keeping: the meeting that finishes first leaves the room free the longest for everything else.

### Dry run

Meetings `(5,9)`, `(1,2)`, `(5,7)`, `(0,6)`, `(8,9)`, `(3,4)`, sorted by end time (ties by start). A meeting may start at the moment the previous one ends; if a problem says otherwise, change `>=` to `>`.

| Meeting | Room free at | Starts at or after it? | Decision | Taken so far |
| --- | --- | --- | --- | --- |
| (1,2) | 0 | yes | take | 1 |
| (3,4) | 2 | yes | take | 2 |
| (0,6) | 4 | no | skip | 2 |
| (5,7) | 4 | yes | take | 3 |
| (5,9) | 7 | no | skip | 3 |
| (8,9) | 7 | yes | take | 4 |

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

The same rule, turned round, solves [Non-overlapping Intervals](/problems/non-overlapping-intervals): the fewest intervals to remove is n minus the most you can keep. Shooting balloons with the fewest arrows is the same sweep again. The whole family is the subject of the [intervals](/roadmap/intervals) lesson.

## Jump Game II: the fewest jumps

[Jump Game II](/problems/jump-game-ii) keeps the same input but asks for the **fewest** jumps to the last index. Now the choice of jump matters, and the obvious greedy rule — always jump as far as possible — is wrong: from `[2, 3, 1, 1, 4]` the longest first jump lands on index 2, whose value 1 is a poor springboard, while the shorter jump to index 1 reaches the end in one more step.

The right greedy thinks in **levels**. With zero jumps you are at index 0. With one jump you can be anywhere in `1..nums[0]`. With two jumps you can be anywhere up to the farthest landing point of any index in that first range — and so on. Each level is a contiguous range, because you can always jump shorter than the maximum. So scan left to right, keeping:

- `end`, the last index reachable with the current number of jumps;
- `farthest`, the farthest index reachable with one more jump from anything seen so far.

When the scan reaches `end`, the current level is used up: take one more jump and extend `end` to `farthest`. This is a breadth-first search over levels — see [breadth-first search](/roadmap/breadth-first-search) — compressed into two numbers. Its proof is "greedy stays ahead": after k jumps, no strategy can be beyond index `end`, because `end` is by construction the farthest point any k-jump path reaches. So the first level containing the last index gives the fewest jumps. If `farthest` cannot pass the current index when a level ends, the walk is stuck and the end is unreachable.

### Dry run

`nums = [2, 3, 1, 1, 4]`; the loop stops before the last index, since there is no need to jump from it.

| i | nums[i] | i + nums[i] | farthest | i == end? | jumps | end afterwards |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 2 | 2 | 2 | yes, jump | 1 | 2 |
| 1 | 3 | 4 | 4 | no | 1 | 2 |
| 2 | 1 | 3 | 4 | yes, jump | 2 | 4 |
| 3 | 1 | 4 | 4 | no | 2 | 4 |

Two jumps: index 0 to 1, then 1 to 4. Note that the algorithm never decides *which* index to jump from; it only counts levels, which is why it never makes the "longest first jump" mistake.

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

The second test is the array from the animation above: 0 to 1, 1 to 4, 4 to 6.

## Assign cookies: match smallest with smallest

[Assign Cookies](/problems/assign-cookies) gives each child a greed factor and each cookie a size; a child is content with a cookie at least as big as their greed, and each child gets at most one cookie. Maximise the number of content children.

Sort both lists. Walk the cookies from smallest to largest, and give each cookie to the least greedy child still waiting if it satisfies them; otherwise the cookie is too small for everyone left, so discard it. The exchange argument: suppose an optimal assignment gives the least greedy child a cookie `c` larger than the smallest cookie `s` that would satisfy them. Swap: give the child `s`, and give `c` to whoever had `s` (if anyone). That person is still content, since `c` is bigger than `s`. The number of content children is unchanged, so matching smallest with smallest is never worse. Sorting is what makes the rule a two-pointer sweep — see [sorting algorithms](/roadmap/sorting-algorithms) for why that first step is so often the whole trick.

## When greedy fails

Greedy has no safety net, so it pays to know the classic failures.

**Coin change.** Make 6 from coins of 1, 3 and 4 with as few coins as possible. Greedy takes the largest coin that fits: 4, then 1, then 1 — three coins. But 3 + 3 is two. Taking the 4 felt best and was not, and greedy never reconsiders. For a coin system like 1, 2, 5, 10, 20, 50 the largest-first rule happens to be optimal (such systems are called *canonical*), which is why it feels natural at a till. For arbitrary coins, [Coin Change](/problems/coin-change) needs [dynamic programming](/roadmap/dynamic-programming): the best answer for every amount from 1 up, built from the best answers for smaller amounts.

**Fractional versus 0/1 knapsack.** A bag holds 50 kg; the items are worth 60, 100 and 120 and weigh 10, 20 and 30 kg, so their value per kilogram is 6, 5 and 4.

- If you may take **fractions** of an item (gold dust, not gold bars), greedy by value per kilogram is optimal: all of the first two items (30 kg, worth 160), then 20 kg of the third, worth 80 — 240 in all. An exchange argument proves it: any kilogram of a lower-ratio item could be swapped for a kilogram of a higher-ratio one without losing value.
- If each item must be taken **whole or not at all**, the same rule takes the first two items for 160 and cannot fit the third. The best answer is the second and third items: 50 kg worth 220. The exchange argument breaks because you cannot swap part of an item. This is the [knapsack problem](/roadmap/knapsack-problem), a dynamic programming problem.

The lesson: a greedy rule that sounds right is a hypothesis. Look for a counterexample with three or four items before you code it.

## More greedy shapes

- **[Lemonade Change](/problems/lemonade-change).** When a customer pays with a $20 bill, give a $10 and a $5 as change rather than three $5s, because the $5s can serve more future customers. Keep the most flexible bills for later.
- **[Maximum Units on a Truck](/problems/maximum-units-on-a-truck).** Load the boxes with the most units first: the fractional knapsack with whole boxes of identical size, where greedy is safe.
- **[Gas Station](/problems/gas-station).** If the tank goes negative between stations i and j, no station in between can be the start either, so jump the start past j. One pass, O(n).
- **[Partition Labels](/problems/partition-labels).** Extend the current piece to the last occurrence of every letter in it; cut when the scan reaches the piece's end. The same "extend to the farthest reach" idea as the jump games.
- **[Minimum Number of Platforms](/problems/minimum-number-of-platforms).** Sort arrivals and departures separately and sweep them with two pointers, counting trains in the station.
- **[Candy](/problems/candy).** Two greedy passes, left to right and right to left, each fixing one direction of the rule; take the larger value at each child.

## Time and space complexity

| Problem | Brute force | Greedy | Extra space |
| --- | --- | --- | --- |
| Activity selection | O(2ⁿ × n) over all subsets | O(n log n): sort, then one sweep | O(1) beyond the sort |
| Jump Game | exponential over all paths | O(n): track the farthest reach | O(1) |
| Jump Game II | O(n²) dynamic programming | O(n): levels as two numbers | O(1) |
| Assign cookies | try all matchings | O(n log n + m log m): sort both | O(1) beyond the sorts |
| Fractional knapsack | — | O(n log n): sort by value per weight | O(1) beyond the sort |
| Coin change, any coins | greedy is wrong | use dynamic programming, O(amount × coins) | O(amount) |

Most greedy solutions cost what their sort costs, O(n log n), because the rule needs the input in some order — by end time, by size, by ratio. The sweep afterwards is linear. When no sort is needed, as in the jump games, greedy is O(n).

## How to recognise a greedy problem

- The question asks for a **maximum or minimum count** — the most meetings, the fewest jumps, the fewest arrows, the most children — and choices do not interact much beyond an obvious order.
- There is a natural **order** to process things in: by end time, by size, by deadline, by ratio. Sorting by it makes the decision at each step obvious.
- You can phrase the rule as "**always take the ... that leaves the most room**" — the meeting ending first, the smallest cookie that fits.
- A small **counterexample** to the rule is hard to find. (If you find one easily, think [dynamic programming](/roadmap/dynamic-programming).)
- The constraints are large (n up to 10⁵) and the answer is a single number, which rules out searching over subsets.

## Common mistakes

- **Trusting a rule without a proof or a test.** Earliest start, shortest first and largest coin first all sound right. Check a three-item counterexample, or compare with a brute force on small random inputs.
- **Sorting by the wrong key.** Activity selection sorts by **end** time, not start time; merging intervals sorts by **start**. Know which one your proof uses.
- **Getting touching endpoints wrong.** Does a meeting ending at 4 conflict with one starting at 4? Read the statement, and use `>=` or `>` to match.
- **Being greedy on the wrong quantity.** In Jump Game II the longest single jump is the wrong choice; the farthest reach of the whole level is the right one.
- **Forgetting the impossible case.** A jump array with a zero you cannot pass, a gas circuit with less fuel than cost in total — check for it and return the agreed value.
- **Using greedy where only fractions make it work.** The fractional knapsack is greedy; the 0/1 knapsack is not.

## Practice in this order

Start with rules you can prove in one sentence, then move to ones that need an argument:

1. [Assign Cookies](/problems/assign-cookies): sort both, match smallest with smallest.
2. [Lemonade Change](/problems/lemonade-change): keep the most useful bills for later customers.
3. [Maximum Units on a Truck](/problems/maximum-units-on-a-truck): best ratio first, the fractional idea with whole boxes.
4. [Jump Game](/problems/jump-game): keep only the farthest reach.
5. [Jump Game II](/problems/jump-game-ii): count levels, the second program above.
6. [Non-overlapping Intervals](/problems/non-overlapping-intervals): activity selection, counted the other way.
7. [Gas Station](/problems/gas-station): a one-pass greedy with a proof you must find.
8. [Partition Labels](/problems/partition-labels): extend to the farthest last occurrence.
9. [Candy](/problems/candy): two greedy passes that together satisfy both neighbours.

The [greedy problem list](/challenges/greedy) has every problem in the catalogue tagged greedy. When these feel routine, the next stage of the road is [intervals](/roadmap/intervals), where sorting and greedy sweeps meet.
