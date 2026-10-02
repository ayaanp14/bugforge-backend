---
title: 0/1 Knapsack Problem
stage: dp-2d
order: 1
minutes: 12
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
You have a bag that holds at most 7 kilograms and four items, each with a weight and a value. An item goes in whole or stays behind. Which items carry the most value? This is the **0/1 knapsack problem**, named for the two choices per item, 0 (leave it) or 1 (take it), and it is the model for a family of interview questions: splitting an array into two equal halves, reaching a target sum, counting the ways to make change.

## Why greedy and brute force both fail

The tempting rule is greedy: best value per kilogram first. Watch it on the example.

@figure greedy-bag

Whether D is a good choice depends on what fits beside it, which a one-item-at-a-time rule cannot see. For the **fractional knapsack**, where items can be cut, greedy is optimal, and an exchange argument proves it (see [greedy algorithms](/roadmap/greedy-algorithms)); indivisible items break it.

Brute force tries all 2ⁿ subsets: 16 for four items, about 1.27 × 10³⁰ for a hundred. What rescues us is the mark of every [dynamic programming](/roadmap/dynamic-programming) problem: the same smaller question, "the best value from these items within this capacity", comes up again and again.

## The table: take it or skip it

Decide the items one at a time; after the first i, all that matters is the capacity left:

- **State:** dp[i][w] is the best value using only the first i items with total weight at most w.
- **Transition:** item i (weight wt, value v) is skipped, giving dp[i − 1][w], or taken if it fits, giving dp[i − 1][w − wt] + v. dp[i][w] is the larger.
- **Base case:** row 0 is all zeros: no items, no value.
- **Answer:** dp[n][W], the bottom-right cell.

Both options read row i − 1, the row *without* item i. That is what makes it the 0/1 knapsack: once item i is taken, the rest of the bag comes from items that do not include it, so it can never be taken twice.

@figure table

## Why it works

The best selection from the first i items either contains item i or does not; there is no third case. Without it, it is a selection from the first i − 1 items within w, worth at most dp[i − 1][w]. With it, removing item i leaves a selection within w − wt that must itself be the best one, or swapping in a better one would improve the whole. So the transition compares exactly the two groups every selection falls into:

@figure why-subsets

### The code

The program prints every row, then walks back from the answer cell to recover the items.

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

The walk back needs the whole table, which matters for the space saving that comes next.

## One row is enough: loop the capacity downwards

Row i reads only row i − 1, so a single array `dp[w]` can be updated in place for each item: before item i it holds row i − 1, afterwards row i. Space falls from O(n × W) to O(W). The catch is the take option, dp[w − wt], which must still hold the value from *before* item i:

```text
for each item (wt, v):
    for w from W down to wt:
        dp[w] = max(dp[w], dp[w - wt] + v)   // dp[w - wt] is still last row's value
```

@figure one-row

The upward loop is exactly the **unbounded knapsack**, where each item may be taken any number of times: in two dimensions, dp[i][w] = max(dp[i − 1][w], dp[i][w − wt] + v), reading the take option from row i itself. The one row gives up the walk back, since the earlier rows are gone.

## Subset sum and partition equal subset sum

**Subset sum** asks whether some subset of numbers adds up to exactly a target: a knapsack where each number is both weight and value and the answer is yes or no. The table holds booleans, reachable[s], with reachable[0] true for the empty subset; a number x makes s reachable when s − x was, and s loops downwards so each number counts once.

[Partition Equal Subset Sum](/problems/partition-equal-subset-sum) asks whether an array splits into two parts with equal sums. An odd total cannot; an even one needs one subset summing to total / 2, because the leftover numbers form the other half.

@figure subset-sum

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

The last line is worth a look: an even total is necessary but not enough. The subsets of `[2, 2, 3, 5]` reach 0, 2, 3, 4, 5 and 7, but never 6.

## Counting the ways, and why loop order matters

Change "is it possible?" to "how many ways?" and the booleans become counts: ways[0] = 1 (one way to make 0: take nothing), and each option adds instead of OR-ing. [Coin Change II](/problems/coin-change-ii) counts the **combinations** of coins that make an amount, with unlimited coins, so the amount loop runs upwards as in the unbounded knapsack. A second loop-order question changes the answer itself:

@figure loop-order

[Combination Sum IV](/problems/combination-sum-iv), despite its name, wants the ordered sequences. Counts grow fast, so use 64-bit integers or the modulus 10⁹ + 7 that many problems ask for.

## Other knapsack shapes

- **Plus and minus signs.** In [Target Sum](/problems/target-sum) the plus numbers sum to (total + target) / 2: count those subsets.
- **The closest split.** [Last Stone Weight II](/problems/last-stone-weight-ii): run subset sum up to total / 2, take the largest reachable s, and answer total − 2 × s.
- **Two capacities.** [Ones and Zeroes](/problems/ones-and-zeroes) limits both 0s and 1s: dp[zeros][ones], both loops downwards.
- **One choice per group.** [Number of Dice Rolls With Target Sum](/problems/number-of-dice-rolls-with-target-sum) and [Maximum Value of K Coins From Piles](/problems/maximum-value-of-k-coins-from-piles): each group is a row that tries every option in it.
- **At most W or exactly W.** Zeros everywhere mean "weight at most w"; 0 at dp[0] and minus infinity elsewhere mean "exactly w".

## Pseudo-polynomial time and complexity

The table has (n + 1) × (W + 1) cells of constant work: O(n × W) time. That looks polynomial, but W is written with only about log₁₀ W digits, and each extra digit multiplies the work by ten: **pseudo-polynomial** time. W = 10⁴ is instant; W = 10⁹ is hopeless. The problem is NP-hard, so nothing polynomial in the digits of W is known; when values are small, swap the roles and let dp[v] be the least weight reaching value v.

| Problem | Time | Space, full table | Space, one row |
| --- | --- | --- | --- |
| Every subset by brute force | O(2ⁿ × n) | O(n) | — |
| 0/1 or unbounded knapsack | O(n × W) | O(n × W) | O(W) |
| Subset sum or partition | O(n × target) | O(n × target) | O(target) |
| Counting coin combinations | O(k × amount) | O(k × amount) | O(amount) |

## How to recognise a knapsack problem

- You **choose a subset** of items, each used at most once, under a **budget**: a weight, a sum, a count.
- The question is the **best value**, whether a target is **reachable**, or **how many ways** reach it.
- Phrases like "split into two equal groups", "assign + or −", "make exactly".
- The budget is **small enough to be an array index**, sums up to 10⁴ or so. If items may be reused, it is the unbounded version: loop upwards.

## Common mistakes

- **Looping the capacity upwards in a 0/1 problem.** The one-row array then reuses items and quietly solves the unbounded knapsack.
- **Swapping the loops when counting.** Coins outside counts combinations; amounts outside counts ordered sequences.
- **Skipping the feasibility checks.** An odd total cannot be halved, and in Target Sum a negative or odd total + target has no answer.
- **Using this DP when W is huge.** A capacity of 10⁹ makes the table impossible.

## Practice in this order

1. [Partition Equal Subset Sum](/problems/partition-equal-subset-sum): subset sum with target total / 2.
2. [Target Sum](/problems/target-sum): turn the signs into a subset count.
3. [Last Stone Weight II](/problems/last-stone-weight-ii): the reachable sum closest to half.
4. [Coin Change II](/problems/coin-change-ii): combinations, coin loop outside.
5. [Combination Sum IV](/problems/combination-sum-iv): ordered sequences, amount loop outside.
6. [Ones and Zeroes](/problems/ones-and-zeroes): two capacities.
7. [Number of Dice Rolls With Target Sum](/problems/number-of-dice-rolls-with-target-sum): one choice per group.
8. [Maximum Value of K Coins From Piles](/problems/maximum-value-of-k-coins-from-piles): a group knapsack.

The [dynamic programming problem list](/challenges/dynamic-programming) has the rest. The next lesson builds a two-dimensional table over two strings: the [longest common subsequence and edit distance](/roadmap/longest-common-subsequence).
