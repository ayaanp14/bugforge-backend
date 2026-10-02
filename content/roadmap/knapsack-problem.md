---
title: 0/1 Knapsack Problem
stage: dp-2d
order: 1
minutes: 21
level: Intermediate
hub: dynamic-programming
practice: partition-equal-subset-sum, target-sum, last-stone-weight-ii, coin-change-ii, combination-sum-iv, ones-and-zeroes, number-of-dice-rolls-with-target-sum, maximum-value-of-k-coins-from-piles
updated: 2026-10-03
seo-title: 0/1 Knapsack Problem: DP Table, 1D Array and Subset Sum
description: Learn the 0/1 knapsack problem: the take-or-skip DP table, the one-row version, subset sum and counting ways, with code in C++, Java, Python and JavaScript.
question: What is the 0/1 knapsack problem?
answer: The 0/1 knapsack problem gives you items with weights and values and a bag of fixed capacity, and asks for the most total value you can carry when each item is either taken whole or left behind. Dynamic programming solves it with a table where dp[i][w] is the best value using the first i items within capacity w, deciding take or skip for each item, in O(n × W) time.
q: Why does greedy not work for the 0/1 knapsack?
a: Taking items in order of value per unit weight can leave capacity that no remaining item fits. With capacity 7 and items of weight 1, 3, 4 and 5 worth 1, 4, 5 and 7, the best ratio picks weights 5 and 1 for a value of 8, while weights 3 and 4 fill the bag exactly for 9. Greedy is optimal only for the fractional knapsack, where items can be split.
q: What is the difference between 0/1 and unbounded knapsack?
a: In the 0/1 knapsack each item can be taken at most once; in the unbounded knapsack every item can be taken any number of times. In the one-row DP the only difference is the direction of the capacity loop: downwards for 0/1, so an item's new value never feeds itself, and upwards for unbounded, where reusing it is exactly what you want.
q: Why is the knapsack DP called pseudo-polynomial?
a: Its running time, O(n × W), grows with the numeric value of the capacity W rather than with the number of digits needed to write it. Adding one digit to W multiplies the work by ten. The DP is fast when W is a few thousand and hopeless when it is a billion, and no polynomial-time algorithm for the general problem is known.
q: How is subset sum related to the knapsack problem?
a: Subset sum asks whether some subset of numbers adds up to exactly a target. It is a knapsack in which each number is both the weight and the value and the question is yes or no, so the table holds booleans: dp[s] is true when some subset reaches sum s. Partition Equal Subset Sum is subset sum with the target set to half the total.
q: Why does loop order matter when counting coin combinations?
a: With the coin loop outside, every combination is built in a fixed coin order, so each multiset of coins is counted once: that counts combinations. With the amount loop outside, each amount may end with any coin, so 1 + 2 and 2 + 1 are counted separately: that counts ordered sequences. Coin Change II wants the first, Combination Sum IV the second.
---
You have a bag that holds at most 7 kilograms and four items to choose from. Each item has a weight and a value, and you cannot cut an item in half: it goes in the bag whole or stays behind. Which items should you take to carry the most value? This is the **0/1 knapsack problem**, named for the two choices per item, 0 (leave it) or 1 (take it), and it is the model for a whole family of interview questions: splitting an array into two equal halves, reaching a target sum, counting the ways to make change.

This lesson fills the knapsack table by hand, proves the take-or-skip rule correct, rebuilds the chosen items, and then shrinks the table to a single row, where the direction of one loop decides whether items can be reused. It then covers subset sum, partition and counting the ways, including the loop-order trap that separates combinations from permutations. Every program is in C++, Java, Python and JavaScript.

The example used throughout:

| Item | Weight | Value | Value per kg |
| --- | --- | --- | --- |
| A | 1 | 1 | 1.00 |
| B | 3 | 4 | 1.33 |
| C | 4 | 5 | 1.25 |
| D | 5 | 7 | 1.40 |

Capacity W = 7.

## Why greedy and brute force both fail

The tempting rule is greedy: take the item with the best value per kilogram, then the next best that still fits, and so on. D has the best ratio, so it goes in (5 kg, value 7). Two kilograms remain; B and C do not fit, A does (1 kg, value 1). Total value 8, with a kilogram of space left over. But B and C together weigh exactly 7 and are worth 4 + 5 = 9. Greedy loses. Other greedy rules fail too: most valuable first takes D then A, again 8; lightest first takes A then B, value 5, with no room left for C or D.

The failure has a clear cause. Greedy commits to D early, and D leaves an awkward 2 kg gap that only a poor item fits. Whether D is a good choice depends on what else fits beside it, which a one-item-at-a-time rule cannot see.

Greedy *is* correct for the **fractional knapsack**, where you may take part of an item. There you fill the bag with D, then 2 kg of B (two thirds of it, worth 2.67), for 9.67. No capacity is ever wasted, and an exchange argument proves the ratio order optimal: replacing a kilogram of a lower-ratio item with a kilogram of a higher-ratio one can only raise the value. The [greedy algorithms](/roadmap/greedy-algorithms) lesson works through that proof. Indivisible items break it, because the leftover space can no longer be filled exactly.

Brute force tries every subset: 2ⁿ of them. With 4 items that is 16, but with 100 items it is about 1.27 × 10³⁰. The structure that rescues us is the same as in every [dynamic programming](/roadmap/dynamic-programming) problem: the same smaller question, "the best value from these items within this capacity", comes up again and again.

## The table: take it or skip it

Decide the items one at a time. After deciding the first i items, what matters for the rest is only how much capacity is left. That gives the state:

- **State:** dp[i][w] is the best total value using only the first i items, with total weight at most w.
- **Transition:** item i (weight wt, value v) is either skipped or taken.
  - Skip it: the best is dp[i − 1][w], the same capacity with one item fewer.
  - Take it (only if wt ≤ w): it adds v and uses wt of the capacity, leaving dp[i − 1][w − wt] for the earlier items.
  - dp[i][w] = max(dp[i − 1][w], dp[i − 1][w − wt] + v).
- **Base cases:** dp[0][w] = 0 for every w (no items, no value), and dp[i][0] = 0 (no capacity).
- **Order:** row by row, since each row reads only the row above it.
- **Answer:** dp[n][W], the bottom-right cell.

```text
                       w − wt              w
 row i − 1:   ...   [ take from here ]  [ skip: copy this ]   ...
                              \            |
                               \  + v      |
 row i:       ...                       [ dp[i][w] = the larger ]
```

Both options read from row i − 1, the row *without* item i. That is what makes this the 0/1 knapsack: once item i is taken, the rest of the bag is filled from items that do not include it, so it can never be taken twice.

## Why it works

Look at the best selection from the first i items within capacity w. Either it contains item i or it does not; there is no third case.

- If it does not, it is a selection from the first i − 1 items within capacity w, so its value is at most dp[i − 1][w].
- If it does, removing item i leaves a selection from the first i − 1 items weighing at most w − wt. That remainder must be the *best* such selection: if a better one existed, swapping it in would improve the whole, which contradicts it being best. So its value is dp[i − 1][w − wt] + v.

The transition takes the larger of exactly these two possibilities, so it cannot miss the best selection, and both options it considers are real selections, so it cannot overshoot. By induction on i, every cell is right.

### Dry run

Rows are the items considered so far, columns the capacity from 0 to 7:

| Row (items) | w=0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 0 (none) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 1 (+A: 1 kg, 1) | 0 | 1 | 1 | 1 | 1 | 1 | 1 | 1 |
| 2 (+B: 3 kg, 4) | 0 | 1 | 1 | 4 | 5 | 5 | 5 | 5 |
| 3 (+C: 4 kg, 5) | 0 | 1 | 1 | 4 | 5 | 6 | 6 | 9 |
| 4 (+D: 5 kg, 7) | 0 | 1 | 1 | 4 | 5 | 7 | 8 | 9 |

A few cells worked out:

- dp[2][4] = max(skip: dp[1][4] = 1, take B: dp[1][1] + 4 = 5) = 5. A and B together.
- dp[3][7] = max(skip: dp[2][7] = 5, take C: dp[2][3] + 5 = 4 + 5 = 9) = 9. B and C.
- dp[4][7] = max(skip: dp[3][7] = 9, take D: dp[3][2] + 7 = 1 + 7 = 8) = 9. Taking D is worse here, exactly the trap greedy fell into.

The answer is dp[4][7] = 9.

### Rebuilding the chosen items

Walk back from the answer cell. At row i, if dp[i][w] equals dp[i − 1][w], skipping item i achieved the best, so item i is not needed; move up a row. Otherwise item i was taken: record it, subtract its weight from w, and move up.

- Row 4, w = 7: 9 equals the 9 above, so D is skipped.
- Row 3, w = 7: 9 differs from the 5 above, so C is taken; w becomes 3.
- Row 2, w = 3: 4 differs from the 1 above, so B is taken; w becomes 0.
- Row 1, w = 0: 0 equals 0, so A is skipped.

The bag holds B and C: 7 kg, value 9. Rebuilding needs the whole table, which matters for the space optimisation below.

### The code

```cpp
#include <iostream>
#include <string>
#include <vector>
using namespace std;

// dp[i][w] = best value from the first i items with total weight at most w.
vector<vector<int>> knapsackTable(const vector<int>& weight, const vector<int>& value, int W) {
    int n = weight.size();
    vector<vector<int>> dp(n + 1, vector<int>(W + 1, 0));  // row 0: no items, value 0
    for (int i = 1; i <= n; i++) {
        int wt = weight[i - 1], v = value[i - 1];
        for (int w = 0; w <= W; w++) {
            dp[i][w] = dp[i - 1][w];                                       // skip item i
            if (wt <= w) dp[i][w] = max(dp[i][w], dp[i - 1][w - wt] + v);  // take it
        }
    }
    return dp;
}

int main() {
    vector<string> names = {"A", "B", "C", "D"};
    vector<int> weight = {1, 3, 4, 5};
    vector<int> value = {1, 4, 5, 7};
    int n = weight.size(), W = 7;
    vector<vector<int>> dp = knapsackTable(weight, value, W);
    for (int i = 0; i <= n; i++) {
        cout << "Row " << i << (i == 0 ? " (no items):" : " (" + names[i - 1] + "):");
        for (int w = 0; w <= W; w++) cout << " " << dp[i][w];
        cout << "\n";
    }

    string taken;  // walk back: a value that differs from the row above means item i was taken
    int w = W, used = 0;
    for (int i = n; i >= 1; i--) {
        if (dp[i][w] != dp[i - 1][w]) {
            taken = names[i - 1] + (taken.empty() ? "" : " " + taken);
            w -= weight[i - 1];
            used += weight[i - 1];
        }
    }
    cout << "Best value " << dp[n][W] << ": take " << taken << ", weight " << used << "\n";
    return 0;
}
```

```java
public class Main {
    // dp[i][w] = best value from the first i items with total weight at most w.
    static int[][] knapsackTable(int[] weight, int[] value, int W) {
        int n = weight.length;
        int[][] dp = new int[n + 1][W + 1];  // row 0: no items, value 0
        for (int i = 1; i <= n; i++) {
            int wt = weight[i - 1], v = value[i - 1];
            for (int w = 0; w <= W; w++) {
                dp[i][w] = dp[i - 1][w];                                            // skip item i
                if (wt <= w) dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - wt] + v);  // take it
            }
        }
        return dp;
    }

    public static void main(String[] args) {
        String[] names = {"A", "B", "C", "D"};
        int[] weight = {1, 3, 4, 5};
        int[] value = {1, 4, 5, 7};
        int n = weight.length, W = 7;
        int[][] dp = knapsackTable(weight, value, W);
        for (int i = 0; i <= n; i++) {
            StringBuilder row = new StringBuilder("Row " + i + (i == 0 ? " (no items):" : " (" + names[i - 1] + "):"));
            for (int w = 0; w <= W; w++) row.append(" ").append(dp[i][w]);
            System.out.println(row);
        }

        String taken = "";  // walk back: a value that differs from the row above means item i was taken
        int w = W, used = 0;
        for (int i = n; i >= 1; i--) {
            if (dp[i][w] != dp[i - 1][w]) {
                taken = names[i - 1] + (taken.isEmpty() ? "" : " " + taken);
                w -= weight[i - 1];
                used += weight[i - 1];
            }
        }
        System.out.println("Best value " + dp[n][W] + ": take " + taken + ", weight " + used);
    }
}
```

```python
def knapsack_table(weight, value, W):
    """dp[i][w] = best value from the first i items with total weight at most w."""
    n = len(weight)
    dp = [[0] * (W + 1) for _ in range(n + 1)]  # row 0: no items, value 0
    for i in range(1, n + 1):
        wt, v = weight[i - 1], value[i - 1]
        for w in range(W + 1):
            dp[i][w] = dp[i - 1][w]                                  # skip item i
            if wt <= w:
                dp[i][w] = max(dp[i][w], dp[i - 1][w - wt] + v)      # take it
    return dp


names = ["A", "B", "C", "D"]
weight = [1, 3, 4, 5]
value = [1, 4, 5, 7]
n, W = len(weight), 7
dp = knapsack_table(weight, value, W)
for i in range(n + 1):
    label = " (no items):" if i == 0 else f" ({names[i - 1]}):"
    print(f"Row {i}{label}", *dp[i])

taken = []  # walk back: a value that differs from the row above means item i was taken
w, used = W, 0
for i in range(n, 0, -1):
    if dp[i][w] != dp[i - 1][w]:
        taken.insert(0, names[i - 1])
        w -= weight[i - 1]
        used += weight[i - 1]
print(f"Best value {dp[n][W]}: take {' '.join(taken)}, weight {used}")
```

```javascript
// dp[i][w] = best value from the first i items with total weight at most w.
function knapsackTable(weight, value, W) {
  const n = weight.length;
  const dp = [];
  for (let i = 0; i <= n; i++) dp.push(new Array(W + 1).fill(0)); // row 0: no items, value 0
  for (let i = 1; i <= n; i++) {
    const wt = weight[i - 1];
    const v = value[i - 1];
    for (let w = 0; w <= W; w++) {
      dp[i][w] = dp[i - 1][w]; // skip item i
      if (wt <= w) dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - wt] + v); // take it
    }
  }
  return dp;
}

const names = ["A", "B", "C", "D"];
const weight = [1, 3, 4, 5];
const value = [1, 4, 5, 7];
const n = weight.length;
const W = 7;
const dp = knapsackTable(weight, value, W);
for (let i = 0; i <= n; i++) {
  const label = i === 0 ? " (no items):" : ` (${names[i - 1]}):`;
  console.log(`Row ${i}${label} ${dp[i].join(" ")}`);
}

const taken = []; // walk back: a value that differs from the row above means item i was taken
let w = W;
let used = 0;
for (let i = n; i >= 1; i--) {
  if (dp[i][w] !== dp[i - 1][w]) {
    taken.unshift(names[i - 1]);
    w -= weight[i - 1];
    used += weight[i - 1];
  }
}
console.log(`Best value ${dp[n][W]}: take ${taken.join(" ")}, weight ${used}`);
```

```output
Row 0 (no items): 0 0 0 0 0 0 0 0
Row 1 (A): 0 1 1 1 1 1 1 1
Row 2 (B): 0 1 1 4 5 5 5 5
Row 3 (C): 0 1 1 4 5 6 6 9
Row 4 (D): 0 1 1 4 5 7 8 9
Best value 9: take B C, weight 7
```

## One row is enough: loop the capacity downwards

Row i reads only row i − 1. So instead of n + 1 rows you can keep a single array `dp[w]` and update it in place for each item: before item i is processed it holds row i − 1, afterwards row i. The space falls from O(n × W) to O(W).

The update for item i reads two cells of the old row: dp[w] (the skip option, which is the cell being overwritten, so that is fine) and dp[w − wt] (the take option). The second one is the catch. It must still hold the **old** value, from before item i. So the capacity loop has to run **downwards**, from W to wt:

```text
for each item (wt, v):
    for w from W down to wt:
        dp[w] = max(dp[w], dp[w - wt] + v)   // dp[w - wt] is still last row's value
```

Going downwards, w − wt is smaller than w and has not been updated yet in this pass, so it really is row i − 1. Going **upwards**, dp[w − wt] has already been updated for item i, and it may already contain item i. Taking item i again on top of it uses the item twice.

Here is the difference on a tiny case: one item of weight 3 and value 4, capacity 6.

| Loop | w = 3 | w = 6 | Meaning |
| --- | --- | --- | --- |
| Downwards (6, 5, 4, 3) | dp[3] = dp[0] + 4 = 4 | computed first, when dp[3] was still 0: 4 | the item once: 4 |
| Upwards (3, 4, 5, 6) | dp[3] = dp[0] + 4 = 4 | dp[6] = dp[3] + 4 = 8, reading the new dp[3] | the item twice: 8 |

The upward loop is not a bug in every problem: it is exactly the **unbounded knapsack**, where each item may be taken any number of times. In two-dimensional form the unbounded recurrence is dp[i][w] = max(dp[i − 1][w], dp[i][w − wt] + v), reading the take option from row i itself, which still offers item i. One loop direction is the whole difference between the two problems, so it is worth knowing why rather than memorising it.

The one-row version gives up one thing: the earlier rows are gone, so the walk back that recovers the chosen items no longer works. Keep the full table, or a separate record of decisions, when the items themselves are wanted.

## Subset sum and partition equal subset sum

**Subset sum** asks whether some subset of the numbers adds up to exactly a target. It is a knapsack in which each number is both its weight and its value, and the question is yes or no, so the table holds booleans:

- **State:** reachable[s] is true when some subset of the numbers seen so far adds up to exactly s.
- **Transition:** for each number x, a sum s becomes reachable if s − x was reachable before x arrived. Loop s downwards, for the same reason as above: each number is used at most once.
- **Base case:** reachable[0] is true. The empty subset adds up to 0.
- **Answer:** reachable[target].

[Partition Equal Subset Sum](/problems/partition-equal-subset-sum) asks whether an array can be split into two parts with equal sums. If the total is odd, it cannot. If it is even, the two parts each sum to total / 2, and finding one part is enough, because the leftover numbers automatically form the other. So the question is subset sum with target total / 2.

### Dry run

`[1, 5, 11, 5]` has total 22, so the target is 11. The reachable sums from 0 to 11 after each number:

| After | Newly reachable | Reachable sums |
| --- | --- | --- |
| start | 0 | 0 |
| 1 | 1 (from 0) | 0, 1 |
| 5 | 6 (from 1), 5 (from 0) | 0, 1, 5, 6 |
| 11 | 11 (from 0) | 0, 1, 5, 6, 11 |
| 5 | 10 (from 5); 11 and 6 already were | 0, 1, 5, 6, 10, 11 |

11 is reachable (by 11 alone, or 1 + 5 + 5), so the array splits as `[11]` and `[1, 5, 5]`.

### The code

```cpp
#include <iostream>
#include <string>
#include <vector>
using namespace std;

// reachable[s] = some subset of nums adds up to exactly s, for s from 0 to target.
vector<bool> subsetSums(const vector<int>& nums, int target) {
    vector<bool> reachable(target + 1, false);
    reachable[0] = true;                     // the empty subset
    for (int x : nums) {
        for (int s = target; s >= x; s--) {  // downwards, so x is used at most once
            if (reachable[s - x]) reachable[s] = true;
        }
    }
    return reachable;
}

string joined(const vector<int>& values) {
    string s;
    for (int v : values) s += (s.empty() ? "" : " ") + to_string(v);
    return s;
}

void partition(const vector<int>& nums) {
    int total = 0;
    for (int x : nums) total += x;
    if (total % 2 != 0) {
        cout << joined(nums) << ": total " << total << " is odd, no equal split\n";
        return;
    }
    bool ok = subsetSums(nums, total / 2)[total / 2];
    cout << joined(nums) << ": total " << total << ", two halves of " << total / 2 << ": "
         << (ok ? "yes" : "no") << "\n";
}

int main() {
    vector<bool> reachable = subsetSums({1, 5, 11, 5}, 11);
    cout << "Sums up to 11 from 1 5 11 5:";
    for (int s = 0; s <= 11; s++)
        if (reachable[s]) cout << " " << s;
    cout << "\n";
    partition({1, 5, 11, 5});
    partition({1, 2, 3, 5});
    partition({2, 2, 3, 5});
    return 0;
}
```

```java
public class Main {
    // reachable[s] = some subset of nums adds up to exactly s, for s from 0 to target.
    static boolean[] subsetSums(int[] nums, int target) {
        boolean[] reachable = new boolean[target + 1];
        reachable[0] = true;                     // the empty subset
        for (int x : nums) {
            for (int s = target; s >= x; s--) {  // downwards, so x is used at most once
                if (reachable[s - x]) reachable[s] = true;
            }
        }
        return reachable;
    }

    static String joined(int[] values) {
        StringBuilder s = new StringBuilder();
        for (int v : values) s.append(s.length() == 0 ? "" : " ").append(v);
        return s.toString();
    }

    static void partition(int[] nums) {
        int total = 0;
        for (int x : nums) total += x;
        if (total % 2 != 0) {
            System.out.println(joined(nums) + ": total " + total + " is odd, no equal split");
            return;
        }
        boolean ok = subsetSums(nums, total / 2)[total / 2];
        System.out.println(joined(nums) + ": total " + total + ", two halves of " + total / 2 + ": "
                + (ok ? "yes" : "no"));
    }

    public static void main(String[] args) {
        boolean[] reachable = subsetSums(new int[] {1, 5, 11, 5}, 11);
        StringBuilder line = new StringBuilder("Sums up to 11 from 1 5 11 5:");
        for (int s = 0; s <= 11; s++)
            if (reachable[s]) line.append(" ").append(s);
        System.out.println(line);
        partition(new int[] {1, 5, 11, 5});
        partition(new int[] {1, 2, 3, 5});
        partition(new int[] {2, 2, 3, 5});
    }
}
```

```python
def subset_sums(nums, target):
    """reachable[s] = some subset of nums adds up to exactly s, for s from 0 to target."""
    reachable = [False] * (target + 1)
    reachable[0] = True                      # the empty subset
    for x in nums:
        for s in range(target, x - 1, -1):   # downwards, so x is used at most once
            if reachable[s - x]:
                reachable[s] = True
    return reachable


def joined(values):
    return " ".join(map(str, values))


def partition(nums):
    total = sum(nums)
    if total % 2 != 0:
        print(f"{joined(nums)}: total {total} is odd, no equal split")
        return
    ok = subset_sums(nums, total // 2)[total // 2]
    print(f"{joined(nums)}: total {total}, two halves of {total // 2}: {'yes' if ok else 'no'}")


reachable = subset_sums([1, 5, 11, 5], 11)
print("Sums up to 11 from 1 5 11 5:", *[s for s in range(12) if reachable[s]])
partition([1, 5, 11, 5])
partition([1, 2, 3, 5])
partition([2, 2, 3, 5])
```

```javascript
// reachable[s] = some subset of nums adds up to exactly s, for s from 0 to target.
function subsetSums(nums, target) {
  const reachable = new Array(target + 1).fill(false);
  reachable[0] = true; // the empty subset
  for (const x of nums) {
    for (let s = target; s >= x; s--) {
      // downwards, so x is used at most once
      if (reachable[s - x]) reachable[s] = true;
    }
  }
  return reachable;
}

const joined = (values) => values.join(" ");

function partition(nums) {
  const total = nums.reduce((a, b) => a + b, 0);
  if (total % 2 !== 0) {
    console.log(`${joined(nums)}: total ${total} is odd, no equal split`);
    return;
  }
  const ok = subsetSums(nums, total / 2)[total / 2];
  console.log(`${joined(nums)}: total ${total}, two halves of ${total / 2}: ${ok ? "yes" : "no"}`);
}

const reachable = subsetSums([1, 5, 11, 5], 11);
const sums = [];
for (let s = 0; s <= 11; s++) if (reachable[s]) sums.push(s);
console.log(`Sums up to 11 from 1 5 11 5: ${sums.join(" ")}`);
partition([1, 5, 11, 5]);
partition([1, 2, 3, 5]);
partition([2, 2, 3, 5]);
```

```output
Sums up to 11 from 1 5 11 5: 0 1 5 6 10 11
1 5 11 5: total 22, two halves of 11: yes
1 2 3 5: total 11 is odd, no equal split
2 2 3 5: total 12, two halves of 6: no
```

The last line is worth a look: an even total is necessary but not enough. The subsets of `[2, 2, 3, 5]` reach 0, 2, 3, 4, 5, 7 and more, but never 6.

## Counting the ways, and why loop order matters

Change the question from "is it possible?" to "how many ways?" and the booleans become counts: ways[0] = 1 (one way to make 0: take nothing) and each option adds instead of OR-ing. [Coin Change II](/problems/coin-change-ii) asks how many **combinations** of coins make an amount, with unlimited coins of each value, so the amount loop runs upwards, as in the unbounded knapsack.

There is a second loop-order question here, and it changes the answer. Take coins 1, 2 and 3 and amount 4.

- **Coins outside, amounts inside** counts **combinations**. All the 1s are placed before any 2 is considered, and all the 2s before any 3, so every combination is built in one fixed order and counted once: 1+1+1+1, 1+1+2, 2+2, 1+3. Four ways.
- **Amounts outside, coins inside** counts **ordered sequences**. For each amount, the last coin can be any coin, so 1+3 and 3+1 are different ways to end. There are seven: 1+1+1+1, 1+1+2, 1+2+1, 2+1+1, 2+2, 1+3, 3+1. That is what [Combination Sum IV](/problems/combination-sum-iv) asks for, despite its name.

```text
combinations:  for coin in coins:        for amount from coin to target:   ways[amount] += ways[amount - coin]
sequences:     for amount 1 to target:   for coin in coins (coin <= amount): ways[amount] += ways[amount - coin]
```

The combination table, coin by coin, for amounts 0 to 4: start 1 0 0 0 0; after coin 1, 1 1 1 1 1; after coin 2, 1 1 2 2 3; after coin 3, 1 1 2 3 4. The sequence table, amount by amount: 1, 1, 2, 4, 7, each the sum of the three before it. Same additions, different order, different meaning.

### The code

```cpp
#include <iostream>
#include <vector>
using namespace std;

// Coin loop outside: each multiset of coins is built in one order, so counted once.
long long combinations(const vector<int>& coins, int amount) {
    vector<long long> ways(amount + 1, 0);
    ways[0] = 1;  // one way to make 0: no coins
    for (int c : coins)
        for (int a = c; a <= amount; a++) ways[a] += ways[a - c];  // upwards: coins reusable
    return ways[amount];
}

// Amount loop outside: any coin may come last, so every order is counted.
long long sequences(const vector<int>& coins, int amount) {
    vector<long long> ways(amount + 1, 0);
    ways[0] = 1;
    for (int a = 1; a <= amount; a++)
        for (int c : coins)
            if (c <= a) ways[a] += ways[a - c];
    return ways[amount];
}

int main() {
    vector<int> coins = {1, 2, 3};
    cout << "Coins 1 2 3, amount 4\n";
    cout << "Combinations (coin loop outside): " << combinations(coins, 4) << "\n";
    cout << "Ordered sequences (amount loop outside): " << sequences(coins, 4) << "\n";
    return 0;
}
```

```java
public class Main {
    // Coin loop outside: each multiset of coins is built in one order, so counted once.
    static long combinations(int[] coins, int amount) {
        long[] ways = new long[amount + 1];
        ways[0] = 1;  // one way to make 0: no coins
        for (int c : coins)
            for (int a = c; a <= amount; a++) ways[a] += ways[a - c];  // upwards: coins reusable
        return ways[amount];
    }

    // Amount loop outside: any coin may come last, so every order is counted.
    static long sequences(int[] coins, int amount) {
        long[] ways = new long[amount + 1];
        ways[0] = 1;
        for (int a = 1; a <= amount; a++)
            for (int c : coins)
                if (c <= a) ways[a] += ways[a - c];
        return ways[amount];
    }

    public static void main(String[] args) {
        int[] coins = {1, 2, 3};
        System.out.println("Coins 1 2 3, amount 4");
        System.out.println("Combinations (coin loop outside): " + combinations(coins, 4));
        System.out.println("Ordered sequences (amount loop outside): " + sequences(coins, 4));
    }
}
```

```python
def combinations(coins, amount):
    """Coin loop outside: each multiset of coins is built in one order, so counted once."""
    ways = [0] * (amount + 1)
    ways[0] = 1  # one way to make 0: no coins
    for c in coins:
        for a in range(c, amount + 1):  # upwards: coins reusable
            ways[a] += ways[a - c]
    return ways[amount]


def sequences(coins, amount):
    """Amount loop outside: any coin may come last, so every order is counted."""
    ways = [0] * (amount + 1)
    ways[0] = 1
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a:
                ways[a] += ways[a - c]
    return ways[amount]


coins = [1, 2, 3]
print("Coins 1 2 3, amount 4")
print("Combinations (coin loop outside):", combinations(coins, 4))
print("Ordered sequences (amount loop outside):", sequences(coins, 4))
```

```javascript
// Coin loop outside: each multiset of coins is built in one order, so counted once.
function combinations(coins, amount) {
  const ways = new Array(amount + 1).fill(0);
  ways[0] = 1; // one way to make 0: no coins
  for (const c of coins) {
    for (let a = c; a <= amount; a++) ways[a] += ways[a - c]; // upwards: coins reusable
  }
  return ways[amount];
}

// Amount loop outside: any coin may come last, so every order is counted.
function sequences(coins, amount) {
  const ways = new Array(amount + 1).fill(0);
  ways[0] = 1;
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) if (c <= a) ways[a] += ways[a - c];
  }
  return ways[amount];
}

const coins = [1, 2, 3];
console.log("Coins 1 2 3, amount 4");
console.log(`Combinations (coin loop outside): ${combinations(coins, 4)}`);
console.log(`Ordered sequences (amount loop outside): ${sequences(coins, 4)}`);
```

```output
Coins 1 2 3, amount 4
Combinations (coin loop outside): 4
Ordered sequences (amount loop outside): 7
```

Counts grow fast, which is why these programs use 64-bit integers and why many problems ask for the answer modulo 10⁹ + 7.

## Other knapsack shapes

The same take-or-skip table, sometimes with a twist in the state, solves a long list of problems:

- **Plus and minus signs.** [Target Sum](/problems/target-sum) puts + or − before every number to reach a target. If P is the sum of the plus numbers and N of the minus numbers, P − N = target and P + N = total, so P = (total + target) / 2. The question becomes: how many subsets sum to P? If total + target is odd or negative, the answer is 0.
- **The closest split.** [Last Stone Weight II](/problems/last-stone-weight-ii) wants two groups with sums as close as possible. Run subset sum up to total / 2, take the largest reachable sum s, and the answer is total − 2 × s.
- **Two capacities.** [Ones and Zeroes](/problems/ones-and-zeroes) limits both the number of 0s and the number of 1s. The state gets one dimension per budget, dp[zeros][ones], and both loops run downwards.
- **Exactly one item from each group.** [Number of Dice Rolls With Target Sum](/problems/number-of-dice-rolls-with-target-sum) picks one face per die, and [Maximum Value of K Coins From Piles](/problems/maximum-value-of-k-coins-from-piles) picks how many coins to take from the top of each pile. Each group becomes a row, and the transition tries every option within the group.
- **At most W or exactly W.** Initialising every dp[w] to 0 means "weight at most w". Initialising dp[0] to 0 and the rest to minus infinity means "weight exactly w", which is what a problem that insists on filling the bag needs.

## Pseudo-polynomial time and complexity

The table has (n + 1) × (W + 1) cells and each takes constant work, so the 0/1 knapsack costs O(n × W) time. That looks polynomial, but W is a number, and the input writes it with only about log₁₀ W digits. Adding one digit to W multiplies the work by ten. An algorithm like this, polynomial in the numeric value of the input rather than its length, is called **pseudo-polynomial**. With n = 100 and W = 10⁴ the table has a million cells, which is instant; with W = 10⁹ it has 10¹¹, which is not.

That is not a weakness of this particular solution. The 0/1 knapsack is NP-hard, and no algorithm polynomial in n and the number of digits of W is known. When W is huge but the values are small, swap the roles: let dp[v] be the least weight that reaches value v exactly, which costs O(n × total value). When n is at most about 40, splitting the items into two halves and combining the 2²⁰ subsets of each, called meet in the middle, also works.

| Problem | Time | Space, full table | Space, one row |
| --- | --- | --- | --- |
| Every subset by brute force | O(2ⁿ × n) | O(n) | — |
| 0/1 knapsack | O(n × W) | O(n × W) | O(W) |
| Unbounded knapsack | O(n × W) | O(n × W) | O(W) |
| Subset sum or partition | O(n × target) | O(n × target) | O(target) |
| Counting coin combinations | O(k × amount) | O(k × amount) | O(amount) |

## How to recognise a knapsack problem

- You **choose a subset** of items, each used at most once, under a **budget**: a weight limit, a sum, a count of zeros and ones.
- The question is the **best value**, whether a target is **reachable**, or **how many ways** reach it.
- Phrases like "split into two groups with equal sum", "assign + or −", "make exactly", "closest to half".
- The budget is a **small number**: sums up to 10⁴ or so, small enough to be an array index. That is the signal that a table over sums or capacities fits.
- If items may be reused ("unlimited supply", "any number of times"), it is the unbounded version: loop the capacity upwards.

## Common mistakes

- **Looping the capacity upwards in a 0/1 problem.** The one-row array then reuses items, and the program quietly solves the unbounded knapsack instead.
- **Swapping the loops when counting.** Coins outside counts combinations; amounts outside counts ordered sequences. Read the problem to see which it wants.
- **Skipping the feasibility checks.** An odd total cannot be split in half, and in Target Sum a negative or odd total + target means no solution; without the check the code indexes outside the array.
- **Rebuilding items from the one-row array.** The earlier rows are overwritten; keep the 2D table when the chosen items are needed.
- **The wrong initial values.** Zeros everywhere means "at most w"; zero only at dp[0] with minus infinity elsewhere means "exactly w". Mixing them up gives answers for the wrong question.
- **Using this DP when W is huge.** A capacity of 10⁹ makes the table impossible. Look for small values, small n, or a different structure.

## Practice in this order

1. [Partition Equal Subset Sum](/problems/partition-equal-subset-sum): subset sum with target total / 2.
2. [Target Sum](/problems/target-sum): turn the signs into a subset-sum count.
3. [Last Stone Weight II](/problems/last-stone-weight-ii): the reachable sum closest to half.
4. [Coin Change II](/problems/coin-change-ii): counting combinations, coin loop outside.
5. [Combination Sum IV](/problems/combination-sum-iv): counting ordered sequences, amount loop outside.
6. [Ones and Zeroes](/problems/ones-and-zeroes): a knapsack with two capacities.
7. [Number of Dice Rolls With Target Sum](/problems/number-of-dice-rolls-with-target-sum): exactly one choice from each group, counted modulo 10⁹ + 7.
8. [Maximum Value of K Coins From Piles](/problems/maximum-value-of-k-coins-from-piles): a group knapsack where each pile offers several options.

The [dynamic programming problem list](/challenges/dynamic-programming) has the rest. The next lesson builds a two-dimensional table over two strings: the [longest common subsequence and edit distance](/roadmap/longest-common-subsequence).
