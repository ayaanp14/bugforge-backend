---
title: Dynamic Programming
stage: dp-1d
order: 1
minutes: 12
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
Some problems ask for the best result of a sequence of choices, or the number of ways to reach one: the fewest coins that make an amount, the most money from a row of houses without robbing two neighbours, the ways up a staircase one or two steps at a time. Trying every sequence of choices is correct but exponential. **Dynamic programming** (DP) makes it fast by answering each smaller question once and storing the answer.

## Why plain recursion is too slow

The Fibonacci numbers are F(0) = 0, F(1) = 1 and F(n) = F(n − 1) + F(n − 2), and the definition turns straight into a recursive function. Watch what it does for fib(5).

@figure fib-tree

The waste grows fast: over 331 million calls for fib(40), yet there are only 41 different questions.

@figure call-growth

Two properties make the repetition avoidable, and every DP problem has both:

- **Overlapping subproblems.** The same smaller question is asked many times.
- **Optimal substructure.** The best answer is built from best answers to smaller questions of the same kind.

Merge sort also splits a problem, but its halves never overlap, so there is nothing to reuse: that is divide and conquer, covered in [Recursion](/roadmap/recursion).

## The idea: answer each subproblem once

- **Memoisation (top-down)** keeps the recursion and adds a cache: look an answer up before working it out, store it after. The tree's last frame is this version.
- **Tabulation (bottom-up)** drops the recursion: one cell per subproblem, base cases first, then an order that has every input ready before it is read.

@figure fib-table

The animation's last frame is worth making a habit: when a cell reads a fixed number of earlier cells or rows, keep only those. That is how the tables of the [0/1 knapsack](/roadmap/knapsack-problem) and the [longest common subsequence](/roadmap/longest-common-subsequence) shrink to one or two rows.

### The code

The program computes the same numbers four ways and counts the calls each recursive version makes.

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

The memo uses −1 for "not computed yet" because −1 is never a Fibonacci number; a marker that is also a real answer would make the cache lie. The values are 64-bit because F(47) overflows a 32-bit `int`, and JavaScript stops at fib(70) because its numbers are exact only up to 2⁵³.

## The recipe: five questions

Real problems do not hand you their recurrence. Every DP solution answers five questions, in this order:

1. **The state.** One cell's meaning, as a full sentence: "dp[a] is the fewest coins that make amount a exactly."
2. **The transition.** Think about the **last choice** (the last coin, the last house, the last move); each one leaves a smaller problem already solved.
3. **The base cases.** The cells that need no transition, usually the empty or smallest input.
4. **The order.** Every cell a transition reads must already be filled.
5. **The answer.** Usually the last cell; sometimes the best of all cells, as in the [longest increasing subsequence](/roadmap/longest-increasing-subsequence).

The first question decides everything: "dp[i] is the answer for i" is not a state, "dp[i] is the most money from houses 0 to i" is. Here is the recipe on [House Robber](/problems/house-robber).

@walkthrough

## Why it works

A DP table is correct by **induction**. The base cases are answered directly. If every cell before i is right, the transition tries every possible last choice, each added to a smaller cell already known to be right, so the best of them is right for cell i too.

That needs the transition to cover **every** option. Grouping the solutions by their last choice guarantees it: each solution falls into exactly one group, and each group is a smaller question. [Climbing Stairs](/problems/climbing-stairs) shows it plainly.

@figure last-move

Its base case, ways[0] = 1, counts the one way to stand at the bottom: doing nothing.

For a minimum or maximum, the induction also needs **optimal substructure**, proved by **cut and paste**: if the best plan for houses 0 to 4 robs house 4, the rest must be the best plan for houses 0 to 2, or pasting a better one in would beat the best. The longest simple path between two cities lacks it, because two longest halves may share a city; when parts of a solution interfere like that, the state is missing information.

## Coin change: a minimum over many last choices

What is the fewest coins that make an amount exactly, with unlimited coins of each value? This is [Coin Change](/problems/coin-change). The last coin is some c no larger than a, so dp[a] = 1 + the smallest dp[a − c], with dp[0] = 0.

@figure coin-table

Greedy commits to the largest coin and never looks back; DP commits to nothing, comparing every last coin against exact answers. Greedy is right for canonical coin systems such as 1, 2, 5, 10, 20, 50 and 100, which an exchange argument proves (see [greedy algorithms](/roadmap/greedy-algorithms)). Without such a proof, DP is the safe choice. The combining step follows the question: counting adds the options, a minimum takes the best one, "is it possible?" takes a logical OR.

### The code

The program fills the table, rebuilds the coins by walking back, compares the result with greedy and tries an amount that cannot be made.

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

"Impossible" is stored as amount + 1: no real answer needs more than `amount` coins, and adding 1 to it cannot overflow the way `INT_MAX + 1` would. Check for −1 before walking back.

## Top-down or bottom-up?

Both do the same work in the same big-O time. Top-down solves only the subproblems the question reaches and finds the order for you, but deep inputs overflow the stack (Python stops at 1,000 frames). Bottom-up has no depth limit and makes it easy to keep only the rows the transition reads. In an interview, write the memoised recursion first, then convert it to a table if depth or space matters.

## Time and space complexity

**Time = number of states × work per state**; space is the number of states kept.

| Problem and approach | Time | Space |
| --- | --- | --- |
| Fibonacci, plain recursion | O(1.618ⁿ) | O(n) call stack |
| Fibonacci, memoised or table | O(n) | O(n) |
| Fibonacci, two variables | O(n) | O(1) |
| Climbing stairs, house robber | O(n) | O(1) |
| Coin change, k coin values | O(amount × k) | O(amount) |

Coin change grows with the numeric value of the amount, not its number of digits: **pseudo-polynomial** time, which the [0/1 knapsack lesson](/roadmap/knapsack-problem) looks at closely. For reading these bounds, see [Big O notation](/roadmap/big-o-notation).

## How to recognise a DP problem

- It asks to **count the ways**, find a **minimum** or **maximum**, or decide whether something is **possible**.
- Each step offers a **choice** (take or skip, which coin), and earlier choices limit later ones.
- The brute-force recursion asks the **same smaller question** from different branches.
- The question makes sense for every **prefix** or smaller value: the first i houses, every amount up to the target.

If every solution must be listed, the output itself is exponential: that is [backtracking](/roadmap/backtracking).

## Common mistakes

- **A vague state.** "dp[i] = the answer for i" hides whether house i must be robbed or may be.
- **The wrong base case.** An off-by-one base shifts every cell after it.
- **Filling in the wrong order.** A cell read before it is filled contributes its initial value.
- **An infinity that overflows.** `INT_MAX + 1` wraps negative in C++ and Java and wins every `min`.
- **A memo marker that is also an answer.** If 0 means "not computed" but is a legal answer, the memo saves nothing.
- **Recursion that is too deep.** A memo on n = 10⁵ overflows most stacks; use a table.

## Practice in this order

1. [Fibonacci Number](/problems/fibonacci-number): the memoised, tabulated and two-variable versions.
2. [Climbing Stairs](/problems/climbing-stairs): counting ways, and why ways[0] is 1.
3. [Min Cost Climbing Stairs](/problems/min-cost-climbing-stairs): the same shape with a minimum.
4. [House Robber](/problems/house-robber): take or skip, from the walkthrough.
5. [House Robber II](/problems/house-robber-ii): a circle; run house robber without the first house, then without the last.
6. [Coin Change](/problems/coin-change): a minimum over many last choices.
7. [Decode Ways](/problems/decode-ways): the last choice is one digit or two, each with conditions.
8. [Word Break](/problems/word-break): an "is it possible" table over prefixes.

The [dynamic programming problem list](/challenges/dynamic-programming) has every DP problem in the catalogue. Next on the road is the [longest increasing subsequence](/roadmap/longest-increasing-subsequence), the first DP whose answer is not in the last cell.
