---
title: Dynamic Programming
stage: dp-1d
order: 1
minutes: 21
level: Intermediate
hub: dynamic-programming
practice: fibonacci-number, climbing-stairs, min-cost-climbing-stairs, house-robber, house-robber-ii, coin-change, decode-ways, word-break
updated: 2026-10-03
seo-title: Dynamic Programming: Memoisation, Tabulation and Examples
description: Learn dynamic programming from scratch: memoisation, tabulation, a five-step recipe, worked tables and code in C++, Java, Python and JavaScript.
question: What is dynamic programming?
answer: Dynamic programming solves a problem by splitting it into smaller overlapping subproblems, solving each subproblem once and storing its answer so it is reused rather than recomputed. It applies when the best answer is built from best answers to smaller versions of the same question. Memoisation stores answers during recursion (top-down); tabulation fills a table from the base cases upwards (bottom-up). It turns exponential brute force into polynomial time.
q: What is the difference between memoisation and tabulation?
a: Memoisation keeps the natural recursion and adds a cache, so each subproblem is solved the first time it is asked for and looked up afterwards. Tabulation drops the recursion and fills a table in an order that guarantees every value a cell needs is already there. Both do the same work; tabulation avoids deep recursion and makes it easy to keep only the rows still needed.
q: How do I know a problem needs dynamic programming?
a: Look for a question that asks to count the ways, find a minimum or maximum, or decide whether something is possible, where each step offers a choice that affects later steps. If a brute-force recursion would ask the same smaller question more than once, dynamic programming will make it fast.
q: Is dynamic programming the same as recursion?
a: No. Recursion is a way of writing code; dynamic programming is the idea of solving each distinct subproblem once and reusing its answer. A memoised solution is recursive, but a tabulated one uses plain loops. Plain recursion without a cache is often exponential exactly because it solves the same subproblems again and again.
q: Why does greedy fail for coin change?
a: Greedy takes the largest coin that fits and never reconsiders. With coins 1, 3 and 4 and amount 6 it takes 4, 1 and 1, three coins, while 3 + 3 needs only two. Dynamic programming compares every possible last coin against the exact best answer for what remains, so it cannot be misled by a choice that looks good locally.
q: What is the time complexity of a dynamic programming solution?
a: Multiply the number of distinct states by the work done for each state. Climbing stairs has n states with constant work each, so it is O(n). Coin change has amount + 1 states and tries every coin at each, so it is O(amount × number of coins). Space is the number of states, or less if only recent rows are kept.
---
Some problems ask you to make a sequence of choices and want either the best possible result or the number of ways to reach it: the fewest coins that make an amount, the most money you can take from a row of houses without robbing two neighbours, the number of ways to climb a staircase taking one or two steps at a time. Trying every sequence of choices is correct, but the number of sequences grows exponentially with the input. **Dynamic programming** (DP) is the technique that makes these problems fast. It notices that the brute force keeps asking the same smaller question, answers each smaller question once, and stores the answer.

This lesson builds the idea from one tiny example, the Fibonacci numbers, then turns it into a five-step recipe and uses the recipe on three classic problems with their tables filled in by hand. It finishes with how to recognise a DP problem in an interview and the mistakes that cost the most marks. Every program is shown in C++, Java, Python and JavaScript.

## Why plain recursion is too slow

The Fibonacci numbers are defined by F(0) = 0, F(1) = 1 and F(n) = F(n − 1) + F(n − 2). The definition translates straight into a recursive function, and that function is a good picture of what goes wrong. Here is every call it makes to compute fib(5):

```text
                           fib(5)
                 /                       \
            fib(4)                        fib(3)
          /        \                    /        \
     fib(3)        fib(2)          fib(2)        fib(1)
     /    \        /    \          /    \
 fib(2)  fib(1) fib(1) fib(0)  fib(1) fib(0)
 /    \
fib(1) fib(0)
```

Fifteen calls, but only six different questions: fib(0) to fib(5). fib(3) is solved twice from scratch, fib(2) three times, fib(1) five times. Each call spawns two more, so the number of calls grows by a factor of about 1.6 every time n goes up by one. The exact count is 2 × F(n + 1) − 1 calls: fib(40) makes 331,160,281 of them, and fib(50) makes over 40 billion, minutes of work for a number with eleven digits. Yet there are only 51 different questions between fib(0) and fib(50). Nearly all of that work is repetition.

Two properties of the problem make the repetition avoidable, and they are the two properties every DP problem has:

- **Overlapping subproblems.** The same smaller question is asked many times. fib(3) turns up in several branches of the tree.
- **Optimal substructure.** The answer to the big question is built from the answers to smaller questions of the same kind. For Fibonacci that is just the definition; for an optimisation problem it means the best overall solution is made of best solutions to its parts.

Both matter. Merge sort splits a problem into smaller ones too, but its two halves never overlap, so there is nothing to reuse; that is plain divide and conquer, covered in [Recursion](/roadmap/recursion). DP is what you reach for when the pieces repeat.

## The idea: answer each subproblem once

There are two ways to make sure each subproblem is solved only once.

**Memoisation (top-down).** Keep the recursion exactly as it is and add a cache. Before computing fib(k), check whether its answer is already stored; if so, return it. Otherwise compute it, store it, then return it. Each of the n + 1 subproblems is computed once, and every repeated call becomes a lookup. The tree above collapses into a single path down the left side, and the number of calls falls from exponential to 2n − 1.

**Tabulation (bottom-up).** Drop the recursion. Make a table `dp` with one cell per subproblem, fill in the base cases, then fill the rest in an order that guarantees every cell's inputs are already there. For Fibonacci that order is simply left to right:

```text
 i:       0   1   2   3   4   5   6   7
 dp[i]:   0   1   1   2   3   5   8  13
                      ^   ^   ^
          dp[5] = dp[4] + dp[3], and both were filled earlier
```

**Keeping only what the transition reads.** Look at what each step actually needs: dp[i] reads dp[i − 1] and dp[i − 2], nothing older. Once dp[i] is computed, every cell before i − 1 will never be read again. So two variables are enough, and the space drops from O(n) to O(1). This is worth looking for in every DP: when a cell depends on a fixed number of previous cells or rows, keep only those. It is how two-dimensional tables in [the 0/1 knapsack](/roadmap/knapsack-problem) and [longest common subsequence](/roadmap/longest-common-subsequence) shrink to one or two rows.

### The code

The program computes the same numbers four ways and counts the calls the two recursive versions make, so you can see the repeated work disappear.

```cpp
#include <iostream>
#include <vector>
using namespace std;

long long calls = 0;  // how many times a recursive fib was entered

// Plain recursion: solves the same subproblems again and again.
long long fibNaive(int n) {
    calls++;
    if (n <= 1) return n;
    return fibNaive(n - 1) + fibNaive(n - 2);
}

// Top-down: the same recursion, but each answer is stored the first time.
long long fibMemo(int n, vector<long long>& memo) {
    calls++;
    if (n <= 1) return n;
    if (memo[n] != -1) return memo[n];  // solved before: reuse the answer
    memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
    return memo[n];
}

// Bottom-up: fill a table from the base cases upwards.
long long fibTable(int n) {
    if (n <= 1) return n;
    vector<long long> dp(n + 1);
    dp[0] = 0;
    dp[1] = 1;
    for (int i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];  // both already filled
    return dp[n];
}

// Each step reads only the last two values, so keep just those.
long long fibTwo(int n) {
    if (n <= 1) return n;
    long long prev = 0, cur = 1;  // F(0) and F(1)
    for (int i = 2; i <= n; i++) {
        long long next = prev + cur;
        prev = cur;
        cur = next;
    }
    return cur;
}

int main() {
    calls = 0;
    long long naive = fibNaive(25);
    cout << "Plain recursion: fib(25) = " << naive << " after " << calls << " calls\n";
    calls = 0;
    vector<long long> memo(26, -1);
    long long memoised = fibMemo(25, memo);
    cout << "Memoised:        fib(25) = " << memoised << " after " << calls << " calls\n";
    cout << "Table:           fib(50) = " << fibTable(50) << "\n";
    cout << "Two variables:   fib(70) = " << fibTwo(70) << "\n";
    return 0;
}
```

```java
import java.util.Arrays;

public class Main {
    static long calls = 0;  // how many times a recursive fib was entered

    // Plain recursion: solves the same subproblems again and again.
    static long fibNaive(int n) {
        calls++;
        if (n <= 1) return n;
        return fibNaive(n - 1) + fibNaive(n - 2);
    }

    // Top-down: the same recursion, but each answer is stored the first time.
    static long fibMemo(int n, long[] memo) {
        calls++;
        if (n <= 1) return n;
        if (memo[n] != -1) return memo[n];  // solved before: reuse the answer
        memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
        return memo[n];
    }

    // Bottom-up: fill a table from the base cases upwards.
    static long fibTable(int n) {
        if (n <= 1) return n;
        long[] dp = new long[n + 1];
        dp[0] = 0;
        dp[1] = 1;
        for (int i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];  // both already filled
        return dp[n];
    }

    // Each step reads only the last two values, so keep just those.
    static long fibTwo(int n) {
        if (n <= 1) return n;
        long prev = 0, cur = 1;  // F(0) and F(1)
        for (int i = 2; i <= n; i++) {
            long next = prev + cur;
            prev = cur;
            cur = next;
        }
        return cur;
    }

    public static void main(String[] args) {
        calls = 0;
        long naive = fibNaive(25);
        System.out.println("Plain recursion: fib(25) = " + naive + " after " + calls + " calls");
        calls = 0;
        long[] memo = new long[26];
        Arrays.fill(memo, -1);
        long memoised = fibMemo(25, memo);
        System.out.println("Memoised:        fib(25) = " + memoised + " after " + calls + " calls");
        System.out.println("Table:           fib(50) = " + fibTable(50));
        System.out.println("Two variables:   fib(70) = " + fibTwo(70));
    }
}
```

```python
calls = 0  # how many times a recursive fib was entered


def fib_naive(n):
    """Plain recursion: solves the same subproblems again and again."""
    global calls
    calls += 1
    if n <= 1:
        return n
    return fib_naive(n - 1) + fib_naive(n - 2)


def fib_memo(n, memo):
    """Top-down: the same recursion, but each answer is stored the first time."""
    global calls
    calls += 1
    if n <= 1:
        return n
    if memo[n] != -1:  # solved before: reuse the answer
        return memo[n]
    memo[n] = fib_memo(n - 1, memo) + fib_memo(n - 2, memo)
    return memo[n]


def fib_table(n):
    """Bottom-up: fill a table from the base cases upwards."""
    if n <= 1:
        return n
    dp = [0] * (n + 1)
    dp[1] = 1
    for i in range(2, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]  # both already filled
    return dp[n]


def fib_two(n):
    """Each step reads only the last two values, so keep just those."""
    if n <= 1:
        return n
    prev, cur = 0, 1  # F(0) and F(1)
    for _ in range(2, n + 1):
        prev, cur = cur, prev + cur
    return cur


calls = 0
naive = fib_naive(25)
print(f"Plain recursion: fib(25) = {naive} after {calls} calls")
calls = 0
memoised = fib_memo(25, [-1] * 26)
print(f"Memoised:        fib(25) = {memoised} after {calls} calls")
print(f"Table:           fib(50) = {fib_table(50)}")
print(f"Two variables:   fib(70) = {fib_two(70)}")
```

```javascript
let calls = 0; // how many times a recursive fib was entered

// Plain recursion: solves the same subproblems again and again.
function fibNaive(n) {
  calls++;
  if (n <= 1) return n;
  return fibNaive(n - 1) + fibNaive(n - 2);
}

// Top-down: the same recursion, but each answer is stored the first time.
function fibMemo(n, memo) {
  calls++;
  if (n <= 1) return n;
  if (memo[n] !== -1) return memo[n]; // solved before: reuse the answer
  memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
  return memo[n];
}

// Bottom-up: fill a table from the base cases upwards.
function fibTable(n) {
  if (n <= 1) return n;
  const dp = new Array(n + 1).fill(0);
  dp[1] = 1;
  for (let i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2]; // both already filled
  return dp[n];
}

// Each step reads only the last two values, so keep just those.
function fibTwo(n) {
  if (n <= 1) return n;
  let prev = 0;
  let cur = 1; // F(0) and F(1)
  for (let i = 2; i <= n; i++) {
    const next = prev + cur;
    prev = cur;
    cur = next;
  }
  return cur;
}

calls = 0;
const naive = fibNaive(25);
console.log(`Plain recursion: fib(25) = ${naive} after ${calls} calls`);
calls = 0;
const memoised = fibMemo(25, new Array(26).fill(-1));
console.log(`Memoised:        fib(25) = ${memoised} after ${calls} calls`);
console.log(`Table:           fib(50) = ${fibTable(50)}`);
console.log(`Two variables:   fib(70) = ${fibTwo(70)}`);
```

```output
Plain recursion: fib(25) = 75025 after 242785 calls
Memoised:        fib(25) = 75025 after 49 calls
Table:           fib(50) = 12586269025
Two variables:   fib(70) = 190392490709135
```

The same answer, 242,785 calls against 49. The memo uses −1 for "not computed yet" because −1 can never be a Fibonacci number; a marker that is also a valid answer would make the cache lie. The values are 64-bit because F(47) = 2,971,215,073 no longer fits in a 32-bit `int`. JavaScript numbers are exact only up to 2⁵³, and F(78) is the last Fibonacci number below that, which is why the last line stops at fib(70).

## The recipe: five questions

Fibonacci hands you its recurrence. Real problems do not, so you need a way to find one. Every DP solution answers the same five questions, in this order:

1. **The state.** What does one cell mean? Write it as a full sentence: "dp[a] is the fewest coins that make amount a exactly." The state must hold everything the rest of the problem needs to know about the choices made so far.
2. **The transition.** How is a cell built from smaller cells? The reliable trick is to think about the **last choice**: the last coin used, whether the last house was robbed, whether the last step was one stair or two. Each possible last choice leaves a smaller problem you have already solved.
3. **The base cases.** Which cells are answered without the transition? Usually the empty or smallest input: amount 0 needs zero coins.
4. **The order.** Fill cells so that every cell a transition reads is already filled. If dp[i] reads smaller indices, go from small to large.
5. **The answer.** Which cell holds it? Often the last one, dp[n]; sometimes the best over all cells, as in the [longest increasing subsequence](/roadmap/longest-increasing-subsequence).

The first question is the one people skip and the one that decides everything. "dp[i] is the answer for i" is not a state; "dp[i] is the most money from houses 0 to i" is. Once the sentence is precise, the transition usually follows from asking what the last choice could have been.

The figure below runs the recipe on House Robber, which is worked through in full later in this lesson: one cell per house, filled left to right, each cell choosing between skipping the house and robbing it.

@walkthrough

## Why it works

A DP table is correct by **induction**. The base cases are right because they are answered directly. Now suppose every cell before cell i is right. The transition for cell i considers every possible last choice, and for each one it adds that choice to the best answer for what remains, which is a cell already known to be right. The best of those options is therefore the best answer for cell i. Filling the table in order extends "every cell so far is right" one cell at a time, all the way to the answer.

That argument leans on two facts, and both should be checked when you design a state.

- **The transition covers every option.** If the best solution ends with a choice the transition does not consider, the table can never find it. Listing the possible last choices explicitly is how you make sure none is missed.
- **Optimal substructure.** The remainder of a best solution must itself be a best solution of its smaller problem. This is proved by a **cut-and-paste** argument. Suppose the best plan for houses 0 to 4 robs house 4. The rest of that plan is a plan for houses 0 to 2. If it were not the best plan for houses 0 to 2, you could cut it out, paste the better one in, and get a better plan for houses 0 to 4, which contradicts the plan being best.

Optimal substructure is not automatic. The longest simple path between two cities in a road network does not have it: the longest path from A to C through B is not built from the longest path from A to B and the longest path from B to C, because those two may visit the same city twice. When the parts of a solution can interfere with each other like that, the state is missing information, and either a richer state fixes it or the problem is not a DP problem at all.

## Three classic problems, table by table

### Climbing stairs

You climb a staircase of n steps, one or two steps at a time. In how many distinct ways can you reach the top? This is [Climbing Stairs](/problems/climbing-stairs).

- **State:** ways[i] is the number of distinct ways to stand on step i.
- **Transition:** the last move onto step i was either one step from i − 1 or two steps from i − 2. Those two groups of routes do not overlap, because their last moves differ, so the counts add: ways[i] = ways[i − 1] + ways[i − 2].
- **Base cases:** ways[0] = 1 (there is exactly one way to be at the bottom: do nothing) and ways[1] = 1.
- **Order and answer:** fill upwards; the answer is ways[n].

| i | ways[i − 1] | ways[i − 2] | ways[i] | Routes |
| --- | --- | --- | --- | --- |
| 0 | — | — | 1 | (stay) |
| 1 | — | — | 1 | 1 |
| 2 | 1 | 1 | 2 | 1+1, 2 |
| 3 | 2 | 1 | 3 | 1+1+1, 1+2, 2+1 |
| 4 | 3 | 2 | 5 | |
| 5 | 5 | 3 | 8 | |

It is Fibonacci again, shifted by one place: ways[n] = F(n + 1). The base case ways[0] = 1 often looks wrong at first, but setting it to 0 would make ways[2] equal 1 and miss the single two-step route.

### House robber

A row of houses holds `nums[i]` money each, and you may not rob two neighbouring houses. What is the most you can take? This is [House Robber](/problems/house-robber), the figure above.

- **State:** dp[i] is the most money from houses 0 to i with no two neighbours robbed.
- **Transition:** either house i is skipped, and the best is dp[i − 1], or it is robbed, so house i − 1 must be left alone and the best is dp[i − 2] + nums[i]. Take the larger: dp[i] = max(dp[i − 1], dp[i − 2] + nums[i]).
- **Base cases:** dp[0] = nums[0] and dp[1] = max(nums[0], nums[1]).
- **Order and answer:** left to right; the answer is the last cell.

For `nums = [2, 7, 9, 3, 1]`:

| i | nums[i] | Skip: dp[i − 1] | Rob: dp[i − 2] + nums[i] | dp[i] |
| --- | --- | --- | --- | --- |
| 0 | 2 | — | 2 | 2 |
| 1 | 7 | 2 | 7 | 7 |
| 2 | 9 | 7 | 2 + 9 = 11 | 11 |
| 3 | 3 | 11 | 7 + 3 = 10 | 11 |
| 4 | 1 | 11 | 11 + 1 = 12 | 12 |

The answer is 12, from houses 0, 2 and 4. A tempting shortcut is to take either every even house or every odd house, whichever sums higher; on `[2, 1, 1, 2]` that gives 3, while robbing the first and last houses gives 4. The table never guesses a pattern, so it is never fooled. Like Fibonacci, each cell reads only the two before it, so two variables are enough.

### Minimum coins

Given coin values and an amount, what is the fewest coins that make the amount exactly, with as many of each coin as you like? Return −1 if it cannot be made. This is [Coin Change](/problems/coin-change).

- **State:** dp[a] is the fewest coins that make amount a exactly, or infinity if a cannot be made.
- **Transition:** the last coin used was some coin c no larger than a, and the rest of the coins make a − c as cheaply as possible. Try every coin: dp[a] = 1 + min(dp[a − c]) over the coins c ≤ a.
- **Base case:** dp[0] = 0.
- **Order and answer:** amounts from 1 upwards, since a − c is always smaller than a; the answer is dp[amount], or −1 if it is still infinity.

Notice how the transition's combining step follows the question. Counting ways adds the options, as in climbing stairs. A minimum or maximum takes the best option. "Is it possible?" would take a logical OR. The shape of the table stays the same.

### Dry run

Coins 1, 3 and 4, amount 6. Each column is one choice of last coin; a dash means the coin is too big.

| a | Last coin 1: dp[a − 1] + 1 | Last coin 3: dp[a − 3] + 1 | Last coin 4: dp[a − 4] + 1 | dp[a] |
| --- | --- | --- | --- | --- |
| 0 | — | — | — | 0 |
| 1 | 0 + 1 = 1 | — | — | 1 |
| 2 | 1 + 1 = 2 | — | — | 2 |
| 3 | 2 + 1 = 3 | 0 + 1 = 1 | — | 1 |
| 4 | 1 + 1 = 2 | 1 + 1 = 2 | 0 + 1 = 1 | 1 |
| 5 | 1 + 1 = 2 | 2 + 1 = 3 | 1 + 1 = 2 | 2 |
| 6 | 2 + 1 = 3 | 1 + 1 = 2 | 2 + 1 = 3 | 2 |

The answer is 2. To find *which* coins, walk backwards: at amount 6, a coin c with dp[6 − c] = dp[6] − 1 is a valid last coin. Coin 3 works (dp[3] = 1), leaving amount 3, where coin 3 works again (dp[0] = 0). So 6 = 3 + 3.

### The code

The program fills the table, rebuilds the coins by walking back, compares the answer with the "largest coin first" greedy rule, and shows the impossible case.

```cpp
#include <iostream>
#include <string>
#include <vector>
using namespace std;

// dp[a] = fewest coins that make amount a; amount + 1 stands for "impossible".
vector<int> coinTable(const vector<int>& coins, int amount) {
    vector<int> dp(amount + 1, amount + 1);
    dp[0] = 0;                                        // zero coins make zero
    for (int a = 1; a <= amount; a++) {
        for (int c : coins) {
            if (c <= a) dp[a] = min(dp[a], dp[a - c] + 1);  // c is the last coin
        }
    }
    return dp;
}

int main() {
    vector<int> coins = {1, 3, 4};
    int amount = 6;
    vector<int> dp = coinTable(coins, amount);
    cout << "dp:";
    for (int v : dp) cout << " " << v;
    cout << "\n";

    string used;                                      // walk back through the table
    for (int a = amount; a > 0;) {
        for (int c : coins) {
            if (c <= a && dp[a - c] == dp[a] - 1) {
                used += (used.empty() ? "" : " + ") + to_string(c);
                a -= c;
                break;
            }
        }
    }
    cout << "Fewest coins for " << amount << ": " << dp[amount] << " = " << used << "\n";

    string greedy;                                    // largest coin that fits, never reconsidered
    int count = 0;
    for (int i = (int)coins.size() - 1, left = amount; i >= 0; i--) {
        while (coins[i] <= left) {
            greedy += (greedy.empty() ? "" : " + ") + to_string(coins[i]);
            left -= coins[i];
            count++;
        }
    }
    cout << "Largest coin first: " << count << " = " << greedy << "\n";

    vector<int> evens = coinTable({2, 4}, 7);
    cout << "Amount 7 with coins 2 and 4: " << (evens[7] > 7 ? -1 : evens[7]) << "\n";
    return 0;
}
```

```java
import java.util.Arrays;

public class Main {
    // dp[a] = fewest coins that make amount a; amount + 1 stands for "impossible".
    static int[] coinTable(int[] coins, int amount) {
        int[] dp = new int[amount + 1];
        Arrays.fill(dp, amount + 1);
        dp[0] = 0;                                        // zero coins make zero
        for (int a = 1; a <= amount; a++) {
            for (int c : coins) {
                if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);  // c is the last coin
            }
        }
        return dp;
    }

    public static void main(String[] args) {
        int[] coins = {1, 3, 4};
        int amount = 6;
        int[] dp = coinTable(coins, amount);
        StringBuilder row = new StringBuilder("dp:");
        for (int v : dp) row.append(" ").append(v);
        System.out.println(row);

        StringBuilder used = new StringBuilder();         // walk back through the table
        for (int a = amount; a > 0;) {
            for (int c : coins) {
                if (c <= a && dp[a - c] == dp[a] - 1) {
                    used.append(used.length() == 0 ? "" : " + ").append(c);
                    a -= c;
                    break;
                }
            }
        }
        System.out.println("Fewest coins for " + amount + ": " + dp[amount] + " = " + used);

        StringBuilder greedy = new StringBuilder();       // largest coin that fits, never reconsidered
        int count = 0;
        for (int i = coins.length - 1, left = amount; i >= 0; i--) {
            while (coins[i] <= left) {
                greedy.append(greedy.length() == 0 ? "" : " + ").append(coins[i]);
                left -= coins[i];
                count++;
            }
        }
        System.out.println("Largest coin first: " + count + " = " + greedy);

        int[] evens = coinTable(new int[] {2, 4}, 7);
        System.out.println("Amount 7 with coins 2 and 4: " + (evens[7] > 7 ? -1 : evens[7]));
    }
}
```

```python
def coin_table(coins, amount):
    """dp[a] = fewest coins that make amount a; amount + 1 stands for "impossible"."""
    dp = [amount + 1] * (amount + 1)
    dp[0] = 0                                         # zero coins make zero
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a:
                dp[a] = min(dp[a], dp[a - c] + 1)     # c is the last coin
    return dp


coins = [1, 3, 4]
amount = 6
dp = coin_table(coins, amount)
print("dp:", *dp)

used = []                                             # walk back through the table
a = amount
while a > 0:
    for c in coins:
        if c <= a and dp[a - c] == dp[a] - 1:
            used.append(c)
            a -= c
            break
print(f"Fewest coins for {amount}: {dp[amount]} = {' + '.join(map(str, used))}")

greedy = []                                           # largest coin that fits, never reconsidered
left = amount
for c in reversed(coins):
    while c <= left:
        greedy.append(c)
        left -= c
print(f"Largest coin first: {len(greedy)} = {' + '.join(map(str, greedy))}")

evens = coin_table([2, 4], 7)
print("Amount 7 with coins 2 and 4:", -1 if evens[7] > 7 else evens[7])
```

```javascript
// dp[a] = fewest coins that make amount a; amount + 1 stands for "impossible".
function coinTable(coins, amount) {
  const dp = new Array(amount + 1).fill(amount + 1);
  dp[0] = 0; // zero coins make zero
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1); // c is the last coin
    }
  }
  return dp;
}

const coins = [1, 3, 4];
const amount = 6;
const dp = coinTable(coins, amount);
console.log(`dp: ${dp.join(" ")}`);

const used = []; // walk back through the table
for (let a = amount; a > 0; ) {
  for (const c of coins) {
    if (c <= a && dp[a - c] === dp[a] - 1) {
      used.push(c);
      a -= c;
      break;
    }
  }
}
console.log(`Fewest coins for ${amount}: ${dp[amount]} = ${used.join(" + ")}`);

const greedy = []; // largest coin that fits, never reconsidered
for (let i = coins.length - 1, left = amount; i >= 0; i--) {
  while (coins[i] <= left) {
    greedy.push(coins[i]);
    left -= coins[i];
  }
}
console.log(`Largest coin first: ${greedy.length} = ${greedy.join(" + ")}`);

const evens = coinTable([2, 4], 7);
console.log(`Amount 7 with coins 2 and 4: ${evens[7] > 7 ? -1 : evens[7]}`);
```

```output
dp: 0 1 2 1 1 2 2
Fewest coins for 6: 2 = 3 + 3
Largest coin first: 3 = 4 + 1 + 1
Amount 7 with coins 2 and 4: -1
```

"Impossible" is stored as amount + 1 rather than the largest integer. No real answer can need more than `amount` coins (that would be all ones), so amount + 1 is safely larger than any real answer, and adding 1 to it cannot overflow the way `INT_MAX + 1` would. The walk back only works if it starts from a reachable amount; check for −1 before reconstructing.

## Top-down or bottom-up?

Both versions do the same work in the same big-O time. They differ in what is easy:

| | Top-down (memoisation) | Bottom-up (tabulation) |
| --- | --- | --- |
| How it is written | The brute-force recursion plus a cache | Loops that fill a table |
| Order of subproblems | Found by the recursion for you | You must choose an order that has every input ready |
| Which subproblems are solved | Only those the question actually reaches | All of them, even ones never needed |
| Overhead | A function call per state, and recursion depth | None beyond the loops |
| Deep inputs | Can overflow the stack; Python stops at 1,000 frames by default | No limit beyond memory |
| Saving space | Hard: the cache must hold everything | Easy: keep only the rows the transition reads |

A practical route in an interview: write the recursion that tries every last choice, add a memo, and check it on the example. If the interviewer asks for better space, or the input is deep enough to break the stack, convert it to a table. The table fills cells in the order in which the recursion finishes them: the smallest subproblems first.

## Why greedy fails where DP works

Return to coins 1, 3 and 4 and amount 6. The greedy rule "take the largest coin that fits" takes 4, then 1, then 1: three coins. The program above prints that line. The best answer is 3 + 3, two coins. Greedy went wrong at its first step, taking the 4, and greedy never revisits a choice, so it could not recover.

DP does not commit to anything. At amount 6 it compares all three possible last coins, and each comparison uses the *exact* best answer for what remains, already in the table. The 4 is considered and loses, 3 coins against 2. That is the general difference: greedy makes one locally attractive choice and needs a proof that it is safe, while DP tries every choice and needs only that the subproblems are small enough to tabulate.

Greedy is not wrong in general. For coin systems like 1, 2, 5, 10, 20, 50, 100, the largest coin first is always optimal; such systems are called canonical, and an exchange argument proves it. The lesson on [greedy algorithms](/roadmap/greedy-algorithms) shows how to make that kind of proof. When you cannot find one, and the number of states is small enough to fill a table, DP is the safe choice.

## Time and space complexity

The rule for any DP: **time = number of states × work per state**, and **space = the number of states kept**.

| Problem and approach | States | Work per state | Time | Space |
| --- | --- | --- | --- | --- |
| Fibonacci, plain recursion | — | — | O(1.618ⁿ) | O(n) call stack |
| Fibonacci, memoised | n + 1 | O(1) | O(n) | O(n) |
| Fibonacci, table | n + 1 | O(1) | O(n) | O(n) |
| Fibonacci, two variables | n + 1 | O(1) | O(n) | O(1) |
| Climbing stairs | n + 1 | O(1) | O(n) | O(1) |
| House robber | n | O(1) | O(n) | O(1) |
| Coin change, k coin values | amount + 1 | O(k) | O(amount × k) | O(amount) |

Coin change's cost depends on the numeric value of the amount, not on how many digits it has; that is called **pseudo-polynomial** time, and it is why a coin-change problem with an amount of 10⁹ needs a different idea. The [0/1 knapsack lesson](/roadmap/knapsack-problem) looks at this more closely. For a refresher on reading these bounds, see [Big O notation](/roadmap/big-o-notation).

## How to recognise a DP problem

Read the statement for these signals:

- It asks you to **count the ways**, find the **minimum** or **maximum**, or decide whether something is **possible**. Words like "number of ways", "fewest", "longest", "maximum profit" and "can you reach" are the usual giveaways.
- Each step offers a **choice** (take or skip, one step or two, which coin), and earlier choices limit later ones.
- A brute-force recursion is easy to write, and you can see it asking the **same smaller question** from different branches.
- The input is a sequence or a number and the question makes sense for every **prefix** or every smaller value: the best for the first i houses, the fewest coins for every amount up to the target.
- The limits fit a table: n up to a few thousand suggests O(n²) states and transitions; n up to 10⁵ suggests O(n) states with constant work each.

If the question wants every solution listed (all subsets, all permutations), DP does not help, because the output itself is exponential; that is [backtracking](/roadmap/backtracking). If a single local rule provably works, greedy is simpler.

## Common mistakes

- **A vague state.** "dp[i] = the answer for i" does not say whether house i must be robbed, may be robbed, or is the last house considered. Write the sentence in full before writing any code.
- **The wrong base case.** ways[0] = 1 in climbing stairs and dp[0] = 0 in coin change are both easy to get wrong, and an off-by-one base case shifts every cell after it.
- **Filling in the wrong order.** A cell read before it is filled silently contributes its initial value. If dp[i] reads dp[i + 1], the loop must run downwards.
- **An infinity that overflows.** `INT_MAX + 1` wraps to a negative number in C++ and Java and then wins every `min`. Use a sentinel just larger than any real answer, such as amount + 1, or check before adding.
- **A memo marker that is also an answer.** If 0 means "not computed" but 0 is a legal answer, those states are recomputed every time and the memo saves nothing. Use −1, `null` or a separate visited array.
- **Recursion that is too deep.** A memoised solution on n = 10⁵ recurses 10⁵ levels deep, which overflows the stack in most languages and fails at 1,000 frames in Python. Convert to a table.

## Practice in this order

Start with problems whose recurrence is almost given, then move to ones where you have to design the state yourself:

1. [Fibonacci Number](/problems/fibonacci-number): write the memoised, tabulated and two-variable versions from this lesson.
2. [Climbing Stairs](/problems/climbing-stairs): counting ways, and why ways[0] is 1.
3. [Min Cost Climbing Stairs](/problems/min-cost-climbing-stairs): the same shape, taking a minimum of costs instead of adding counts.
4. [House Robber](/problems/house-robber): the take-or-skip transition from the figure.
5. [House Robber II](/problems/house-robber-ii): houses in a circle; run house robber twice, once without the first house and once without the last.
6. [Coin Change](/problems/coin-change): a minimum over many last choices, with an impossible state.
7. [Decode Ways](/problems/decode-ways): counting where the last choice is one digit or two, each with conditions.
8. [Word Break](/problems/word-break): an "is it possible" table over prefixes of a string.

The [dynamic programming problem list](/challenges/dynamic-programming) has every DP problem in the catalogue, from easy to hard. Next on the road is the [longest increasing subsequence](/roadmap/longest-increasing-subsequence), the first DP whose answer is not in the last cell.
