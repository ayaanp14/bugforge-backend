---
title: Backtracking
stage: backtracking
order: 2
minutes: 13
level: Intermediate
hub: backtracking
practice: subsets, combinations, permutations, letter-combinations-of-a-phone-number, combination-sum, subsets-ii, generate-parentheses, word-search, n-queens-ii
updated: 2026-10-03
seo-title: Backtracking Algorithm: Template, Examples and Code
description: Learn backtracking: the choose–explore–unchoose template, subsets, permutations, combination sum and N-Queens, with code in C++, Java, Python and JavaScript.
question: What is backtracking in programming?
answer: Backtracking builds a solution one choice at a time. It makes a choice, recursively explores everything that can follow from it, then undoes the choice and tries the next option, abandoning any partial solution that already breaks a rule. It is a depth-first search of the tree of partial solutions, and its cost is usually exponential: O(n × 2ⁿ) for subsets, O(n × n!) for permutations.
q: What is the difference between backtracking and recursion?
a: Recursion is the mechanism: a function calling itself on a smaller input. Backtracking is a search strategy built on it, in which each call makes one choice, recurses to extend the partial solution, and then undoes the choice so the next option starts from the same state. Factorial is recursive but does no backtracking; N-Queens is both.
q: Is backtracking the same as depth-first search?
a: Backtracking is a depth-first search of the tree of partial solutions, with two differences from a graph search: the tree is never stored, only the current path through it, and branches that break a rule are cut off before they are explored. Depth-first search on a graph walks nodes that already exist; backtracking creates its nodes as it goes.
q: What is the time complexity of backtracking?
a: It is set by the size of the search tree: O(n × 2ⁿ) for subsets, O(n × n!) for permutations and O(k × C(n, k)) for combinations of size k, because each answer takes up to its length to copy out. Pruning cuts the work in practice, but the worst case usually stays exponential, which is why backtracking problems come with small inputs.
q: How do you avoid duplicate results in backtracking?
a: Sort the input so that equal values sit next to each other, then at each level skip a value equal to the one just tried at the same level: if j > start and nums[j] == nums[j − 1], continue. Equal siblings would grow identical subtrees, so only the first is explored. For permutations, skip a value when its equal twin to the left is not currently in use.
q: What is the difference between backtracking and dynamic programming?
a: Backtracking walks every candidate and cuts the branches that break a rule; use it when you need the solutions themselves. Dynamic programming counts or optimises by reusing the answers to repeated subproblems; use it when you need a number and the same states recur. A backtracking solution that only counts, and whose calls repeat the same arguments, usually becomes dynamic programming once it is memoised.
---
Some questions ask not for one answer but for **all** of them: every subset of a set, every ordering of a list, every way to put eight queens on a chessboard so that none attacks another. **Backtracking** builds a solution one choice at a time: it makes a choice, explores everything that can follow, then takes the choice back and tries the next — and abandons a partial solution the moment it breaks a rule. It builds on [recursion](/roadmap/recursion), so read that first if a function calling itself still feels strange.

## Why generating everything and filtering is too slow

The brute force builds every complete candidate and checks each one. In **N-Queens** — n queens on an n × n board, no two sharing a row, column or diagonal — that wastes almost everything: if the queens in rows 0 and 1 already share a diagonal, all 720 ways of filling the other six rows are dead, and brute force builds them anyway.

@figure brute-vs-prune

So **check the rules on partial solutions, not finished ones**, and stop extending a partial solution the moment it fails.

## The idea: choose, explore, unchoose

Every backtracking solution has the same skeleton:

```text
backtrack(state):
    if state is a complete solution:
        record a copy of it
        return
    for each choice available from state:
        if the choice breaks a rule: skip it        <- prune
        apply the choice to state                   <- choose
        backtrack(state)                            <- explore
        undo the choice                             <- unchoose
```

The calls form a **state-space tree**: the root is the empty solution, each edge one choice, the leaves complete solutions or dead ends. The program never stores it — only the current path.

- **Choose** changes the state in place; **unchoose** reverses exactly that.
- **Explore** is one recursive call for everything below the choice.
- **Prune** refuses a choice before the call, removing its whole subtree in one comparison.
- **Record a copy**, because the state keeps changing.

The walkthrough finds the subsets of [1, 2, 3, 4] that add up to 5; watch a branch die, with all its later siblings, the moment its sum passes 5.

@walkthrough

## Why it works

**Every solution is in the tree exactly once.** A solution is a sequence of choices, the tree has one path per sequence the loop allows, and the depth-first walk reaches every node it does not prune. Increasing indices for subsets and a used array for permutations give each answer only one path.

**Pruning never loses a solution**, as long as you prune only on a rule no later choice can repair — two queens on a diagonal stay there, and a sum past the target only grows. Every node below breaks the same rule.

**Undo keeps an invariant**: when a call returns, the state is exactly as it was when the call began, so each sibling starts clean. Forget one undo and the next sibling inherits a stale number or queen.

## Subsets and combinations

Instead of deciding "in or out" per element, backtracking usually loops over the elements that may come **next**, starting after the last one taken — and records every node, not just the leaves.

@figure subsets-loop

Record the path only at k elements and the same loop gives [Combinations](/problems/combinations), with a bound for free: stop if fewer elements remain than the path still needs. [Letter Combinations of a Phone Number](/problems/letter-combinations-of-a-phone-number) is the same tree with the next digit's letters as the choices.

## Permutations

Order matters in a permutation, so any unused element may come next. Instead of a start index, keep a `used` array: the loop tries every element, skips those in the path, and marks and unmarks the one it chooses.

@figure template-tree

### The code

```cpp
#include <iostream>
#include <vector>
using namespace std;

void print(const vector<int>& path) {
    cout << "[";
    for (size_t k = 0; k < path.size(); k++) cout << (k ? ", " : "") << path[k];
    cout << "]\n";
}

// Extends path with each unused number in turn and prints every full ordering.
// Returns how many permutations it printed.
int permute(const vector<int>& nums, vector<bool>& used, vector<int>& path) {
    if (path.size() == nums.size()) {         // a leaf: every position is filled
        print(path);
        return 1;
    }
    int found = 0;
    for (size_t j = 0; j < nums.size(); j++) {
        if (used[j]) continue;                // already in the path: not a choice
        used[j] = true;                       // choose
        path.push_back(nums[j]);
        found += permute(nums, used, path);   // explore
        path.pop_back();                      // unchoose: put the state back
        used[j] = false;
    }
    return found;
}

int main() {
    vector<int> nums = {1, 2, 3};
    vector<bool> used(nums.size(), false);
    vector<int> path;
    int total = permute(nums, used, path);
    cout << total << " permutations\n";
    return 0;
}
```

```java
import java.util.ArrayList;
import java.util.List;

public class Main {
    // Extends path with each unused number in turn and prints every full ordering.
    // Returns how many permutations it printed.
    static int permute(int[] nums, boolean[] used, List<Integer> path) {
        if (path.size() == nums.length) {         // a leaf: every position is filled
            System.out.println(path);
            return 1;
        }
        int found = 0;
        for (int j = 0; j < nums.length; j++) {
            if (used[j]) continue;                // already in the path: not a choice
            used[j] = true;                       // choose
            path.add(nums[j]);
            found += permute(nums, used, path);   // explore
            path.remove(path.size() - 1);         // unchoose: put the state back
            used[j] = false;
        }
        return found;
    }

    public static void main(String[] args) {
        int[] nums = {1, 2, 3};
        int total = permute(nums, new boolean[nums.length], new ArrayList<>());
        System.out.println(total + " permutations");
    }
}
```

```python
def permute(nums, used, path):
    """Extend path with each unused number in turn and print every full ordering.
    Return how many permutations were printed."""
    if len(path) == len(nums):                # a leaf: every position is filled
        print(path)
        return 1
    found = 0
    for j in range(len(nums)):
        if used[j]:
            continue                          # already in the path: not a choice
        used[j] = True                        # choose
        path.append(nums[j])
        found += permute(nums, used, path)    # explore
        path.pop()                            # unchoose: put the state back
        used[j] = False
    return found


nums = [1, 2, 3]
total = permute(nums, [False] * len(nums), [])
print(f"{total} permutations")
```

```javascript
// Extends path with each unused number in turn and prints every full ordering.
// Returns how many permutations it printed.
function permute(nums, used, path) {
  if (path.length === nums.length) {
    // a leaf: every position is filled
    console.log(`[${path.join(", ")}]`);
    return 1;
  }
  let found = 0;
  for (let j = 0; j < nums.length; j++) {
    if (used[j]) continue; // already in the path: not a choice
    used[j] = true; // choose
    path.push(nums[j]);
    found += permute(nums, used, path); // explore
    path.pop(); // unchoose: put the state back
    used[j] = false;
  }
  return found;
}

const nums = [1, 2, 3];
const total = permute(nums, new Array(nums.length).fill(false), []);
console.log(`${total} permutations`);
```

```output
[1, 2, 3]
[1, 3, 2]
[2, 1, 3]
[2, 3, 1]
[3, 1, 2]
[3, 2, 1]
6 permutations
```

[Generate Parentheses](/problems/generate-parentheses) is the same template with two choices per position and two prunes: at most n open brackets, and no close bracket without an open one waiting.

## Combination sum: reuse, no reuse, and duplicates

[Combination Sum](/problems/combination-sum) reuses candidates freely: carry the amount still needed and pass `j`, not `j + 1`, so a candidate can be chosen again — never `0`, or [2, 2, 3] comes back as [3, 2, 2]. Sort first, and a candidate larger than the amount left lets the loop `break`.

[Combination Sum II](/problems/combination-sum-ii) uses each candidate once (`j + 1`) but allows duplicate candidates, which would find [1, 7] twice. Sort, then skip a value equal to the one just tried at the same level: `if j > start and cands[j] == cands[j − 1]: continue`.

@figure dup-skip

The same two lines fix [Subsets II](/problems/subsets-ii). One function solves both problems; only the index passed down differs.

```cpp
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

string show(const vector<int>& v) {
    string s = "[";
    for (size_t k = 0; k < v.size(); k++) s += (k ? ", " : "") + to_string(v[k]);
    return s + "]";
}

// Prints every combination from cands[start..] that adds up to remaining.
// cands is sorted; reuse says whether a candidate may be taken again.
void combine(const vector<int>& cands, int start, int remaining, bool reuse, vector<int>& path) {
    if (remaining == 0) {                                    // the path adds up: record it
        cout << "  " << show(path) << "\n";
        return;
    }
    for (int j = start; j < (int)cands.size(); j++) {
        if (cands[j] > remaining) break;                     // sorted: every later one is too big
        if (j > start && cands[j] == cands[j - 1]) continue; // equal sibling: same subtree again
        path.push_back(cands[j]);                            // choose
        combine(cands, reuse ? j : j + 1, remaining - cands[j], reuse, path); // explore
        path.pop_back();                                     // unchoose
    }
}

void run(vector<int> cands, int target, bool reuse) {
    cout << "Target " << target << " from " << show(cands)
         << (reuse ? ", reuse allowed:" : ", each used once:") << "\n";
    sort(cands.begin(), cands.end());
    vector<int> path;
    combine(cands, 0, target, reuse, path);
}

int main() {
    run({2, 3, 6, 7}, 7, true);
    run({10, 1, 2, 7, 6, 1, 5}, 8, false);
    return 0;
}
```

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Main {
    // Prints every combination from cands[start..] that adds up to remaining.
    // cands is sorted; reuse says whether a candidate may be taken again.
    static void combine(int[] cands, int start, int remaining, boolean reuse, List<Integer> path) {
        if (remaining == 0) {                                    // the path adds up: record it
            System.out.println("  " + path);
            return;
        }
        for (int j = start; j < cands.length; j++) {
            if (cands[j] > remaining) break;                     // sorted: every later one is too big
            if (j > start && cands[j] == cands[j - 1]) continue; // equal sibling: same subtree again
            path.add(cands[j]);                                  // choose
            combine(cands, reuse ? j : j + 1, remaining - cands[j], reuse, path); // explore
            path.remove(path.size() - 1);                        // unchoose
        }
    }

    static void run(int[] cands, int target, boolean reuse) {
        System.out.println("Target " + target + " from " + Arrays.toString(cands)
                + (reuse ? ", reuse allowed:" : ", each used once:"));
        int[] sorted = cands.clone();
        Arrays.sort(sorted);
        combine(sorted, 0, target, reuse, new ArrayList<>());
    }

    public static void main(String[] args) {
        run(new int[] {2, 3, 6, 7}, 7, true);
        run(new int[] {10, 1, 2, 7, 6, 1, 5}, 8, false);
    }
}
```

```python
def combine(cands, start, remaining, reuse, path):
    """Print every combination from cands[start:] that adds up to remaining.
    cands is sorted; reuse says whether a candidate may be taken again."""
    if remaining == 0:                                   # the path adds up: record it
        print(f"  {path}")
        return
    for j in range(start, len(cands)):
        if cands[j] > remaining:
            break                                        # sorted: every later one is too big
        if j > start and cands[j] == cands[j - 1]:
            continue                                     # equal sibling: same subtree again
        path.append(cands[j])                            # choose
        combine(cands, j if reuse else j + 1, remaining - cands[j], reuse, path)  # explore
        path.pop()                                       # unchoose


def run(cands, target, reuse):
    rule = "reuse allowed" if reuse else "each used once"
    print(f"Target {target} from {cands}, {rule}:")
    combine(sorted(cands), 0, target, reuse, [])


run([2, 3, 6, 7], 7, True)
run([10, 1, 2, 7, 6, 1, 5], 8, False)
```

```javascript
const show = (v) => `[${v.join(", ")}]`;

// Prints every combination from cands[start..] that adds up to remaining.
// cands is sorted; reuse says whether a candidate may be taken again.
function combine(cands, start, remaining, reuse, path) {
  if (remaining === 0) {
    // the path adds up: record it
    console.log(`  ${show(path)}`);
    return;
  }
  for (let j = start; j < cands.length; j++) {
    if (cands[j] > remaining) break; // sorted: every later one is too big
    if (j > start && cands[j] === cands[j - 1]) continue; // equal sibling: same subtree again
    path.push(cands[j]); // choose
    combine(cands, reuse ? j : j + 1, remaining - cands[j], reuse, path); // explore
    path.pop(); // unchoose
  }
}

function run(cands, target, reuse) {
  console.log(`Target ${target} from ${show(cands)}, ${reuse ? "reuse allowed" : "each used once"}:`);
  const sorted = [...cands].sort((a, b) => a - b);
  combine(sorted, 0, target, reuse, []);
}

run([2, 3, 6, 7], 7, true);
run([10, 1, 2, 7, 6, 1, 5], 8, false);
```

```output
Target 7 from [2, 3, 6, 7], reuse allowed:
  [2, 2, 3]
  [7]
Target 8 from [10, 1, 2, 7, 6, 1, 5], each used once:
  [1, 1, 6]
  [1, 2, 5]
  [1, 7]
  [2, 6]
```

In JavaScript, sort with `(a, b) => a - b`: the default sorts numbers as strings, and the `break` then cuts off valid answers.

## N-Queens: constraint sets

Place queens one **row** at a time, so the row rule holds by construction and the choice in row r is a column c. Square (r, c) is attacked through its column, its diagonal — all of whose squares share r − c — or its anti-diagonal, which share r + c. Three boolean arrays make each check three lookups.

@figure queens

### The code

The program counts the solutions for n = 4 to 8, and the queens placed in the whole search.

```cpp
#include <iostream>
#include <vector>
using namespace std;

vector<bool> cols, diag, anti; // which columns and diagonals already hold a queen
long long placed = 0;          // queens put on the board during the whole search

// Places one queen in each of rows row..n-1; returns how many boards it completes.
int solve(int row, int n) {
    if (row == n) return 1;                          // a queen in every row: one solution
    int found = 0;
    for (int c = 0; c < n; c++) {
        int d = row - c + n - 1, a = row + c;        // this square's two diagonals
        if (cols[c] || diag[d] || anti[a]) continue; // attacked: prune the whole subtree
        cols[c] = diag[d] = anti[a] = true;          // choose
        placed++;
        found += solve(row + 1, n);                  // explore
        cols[c] = diag[d] = anti[a] = false;         // unchoose
    }
    return found;
}

int main() {
    for (int n = 4; n <= 8; n++) {
        cols.assign(n, false);
        diag.assign(2 * n - 1, false);
        anti.assign(2 * n - 1, false);
        placed = 0;
        int solutions = solve(0, n);
        cout << "n = " << n << ": " << solutions << " solutions, " << placed << " queens placed\n";
    }
    return 0;
}
```

```java
public class Main {
    static boolean[] cols, diag, anti; // which columns and diagonals already hold a queen
    static long placed = 0;            // queens put on the board during the whole search

    // Places one queen in each of rows row..n-1; returns how many boards it completes.
    static int solve(int row, int n) {
        if (row == n) return 1;                          // a queen in every row: one solution
        int found = 0;
        for (int c = 0; c < n; c++) {
            int d = row - c + n - 1, a = row + c;        // this square's two diagonals
            if (cols[c] || diag[d] || anti[a]) continue; // attacked: prune the whole subtree
            cols[c] = diag[d] = anti[a] = true;          // choose
            placed++;
            found += solve(row + 1, n);                  // explore
            cols[c] = diag[d] = anti[a] = false;         // unchoose
        }
        return found;
    }

    public static void main(String[] args) {
        for (int n = 4; n <= 8; n++) {
            cols = new boolean[n];
            diag = new boolean[2 * n - 1];
            anti = new boolean[2 * n - 1];
            placed = 0;
            int solutions = solve(0, n);
            System.out.println("n = " + n + ": " + solutions + " solutions, " + placed + " queens placed");
        }
    }
}
```

```python
cols, diag, anti = [], [], []  # which columns and diagonals already hold a queen
placed = 0                     # queens put on the board during the whole search


def solve(row, n):
    """Place one queen in each of rows row..n-1; return how many boards are completed."""
    global placed
    if row == n:
        return 1                                     # a queen in every row: one solution
    found = 0
    for c in range(n):
        d, a = row - c + n - 1, row + c              # this square's two diagonals
        if cols[c] or diag[d] or anti[a]:
            continue                                 # attacked: prune the whole subtree
        cols[c] = diag[d] = anti[a] = True           # choose
        placed += 1
        found += solve(row + 1, n)                   # explore
        cols[c] = diag[d] = anti[a] = False          # unchoose
    return found


for n in range(4, 9):
    cols = [False] * n
    diag = [False] * (2 * n - 1)
    anti = [False] * (2 * n - 1)
    placed = 0
    solutions = solve(0, n)
    print(f"n = {n}: {solutions} solutions, {placed} queens placed")
```

```javascript
let cols, diag, anti; // which columns and diagonals already hold a queen
let placed = 0; // queens put on the board during the whole search

// Places one queen in each of rows row..n-1; returns how many boards it completes.
function solve(row, n) {
  if (row === n) return 1; // a queen in every row: one solution
  let found = 0;
  for (let c = 0; c < n; c++) {
    const d = row - c + n - 1;
    const a = row + c; // this square's two diagonals
    if (cols[c] || diag[d] || anti[a]) continue; // attacked: prune the whole subtree
    cols[c] = diag[d] = anti[a] = true; // choose
    placed++;
    found += solve(row + 1, n); // explore
    cols[c] = diag[d] = anti[a] = false; // unchoose
  }
  return found;
}

for (let n = 4; n <= 8; n++) {
  cols = new Array(n).fill(false);
  diag = new Array(2 * n - 1).fill(false);
  anti = new Array(2 * n - 1).fill(false);
  placed = 0;
  const solutions = solve(0, n);
  console.log(`n = ${n}: ${solutions} solutions, ${placed} queens placed`);
}
```

```output
n = 4: 2 solutions, 16 queens placed
n = 5: 10 solutions, 53 queens placed
n = 6: 4 solutions, 152 queens placed
n = 7: 40 solutions, 551 queens placed
n = 8: 92 solutions, 2056 queens placed
```

Six queens really have fewer solutions than five, and [N-Queens II](/problems/n-queens-ii) asks for exactly these counts.

## Pruning: cut early, cut often

A pruned node takes its whole subtree, and subtrees near the root are the largest, so a check that fires a level earlier beats a faster one.

- **Constraint checks**: an attacked square, a mismatched letter in [Word Search](/problems/word-search).
- **Bound checks**: the choices left cannot reach a solution.
- **Ordering**: sort so one failed bound ends the loop; fill the most constrained cell first.
- **Duplicate skipping**: equal siblings grow identical subtrees.

In Word Search, choose marks a cell visited, explore tries its four neighbours, and unchoose clears the mark.

## Time and space complexity

Time is the number of nodes in the tree times the work at each; extra space is the depth plus the current path.

| Problem | Size of the search | Time | Extra space |
| --- | --- | --- | --- |
| Subsets of n elements | 2ⁿ nodes | O(n × 2ⁿ) | O(n) |
| Combinations, k of n | C(n, k) leaves | O(k × C(n, k)) | O(k) |
| Permutations of n elements | about e × n! nodes | O(n × n!) | O(n) |
| N-Queens, n × n | far fewer than n! after pruning | O(n!) | O(n) |

That is why backtracking problems state small limits — subsets to n ≈ 20, permutations to about 10 — and why such a limit is a signal in itself.

## How to recognise a backtracking problem

- It asks for **all** of something: every subset, permutation or valid combination.
- The constraints are **small**: n up to about 20, a board up to 9 × 9.
- Choices are made **one at a time under rules**.
- It asks **whether any arrangement exists** on a small input.

If it asks only **how many** or **the best** with n in the hundreds, the states recur and [dynamic programming](/roadmap/dynamic-programming) counts them once — as in [Target Sum](/problems/target-sum), a [knapsack](/roadmap/knapsack-problem) in disguise.

## Common mistakes

- **Recording the path instead of a copy**: every stored answer ends up the same empty list.
- **A missing undo**: a `continue` or `return` between choose and unchoose leaves the state dirty.
- **Skipping duplicates with `j > 0`**: it must be `j > start`, or [1, 1, 6] is lost.
- **The wrong index**: `j + 1` is once, `j` is reuse, `0` makes order matter.
- **`break` on unsorted input**: sort first, numerically.

## Practice in this order

1. [Subsets](/problems/subsets): the start-index loop.
2. [Combinations](/problems/combinations): a size limit and a bound.
3. [Permutations](/problems/permutations): a used array.
4. [Letter Combinations of a Phone Number](/problems/letter-combinations-of-a-phone-number): one level per digit.
5. [Combination Sum](/problems/combination-sum): reuse, then sort and break.
6. [Subsets II](/problems/subsets-ii): skip equal siblings.
7. [Generate Parentheses](/problems/generate-parentheses): pruning with a count.
8. [Word Search](/problems/word-search): visited marks as choose and unchoose.
9. [N-Queens II](/problems/n-queens-ii): constraint sets.

The [backtracking problem list](/challenges/backtracking) has every problem in the catalogue that uses the technique, from easy to hard. When the first six feel routine, the next stage takes the same depth-first idea to [graphs](/roadmap/graphs).
