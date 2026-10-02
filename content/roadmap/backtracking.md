---
title: Backtracking
stage: backtracking
order: 2
minutes: 26
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
Some questions do not ask for one answer but for **all** of them: every subset of a set, every ordering of a list, every way to make a total from a set of coins, every way to put eight queens on a chessboard so that no two attack each other. **Backtracking** answers them by building a solution one choice at a time. It makes a choice, explores everything that can follow from it, then takes the choice back and tries the next one — and the moment a partial solution breaks a rule, it abandons it without finishing it.

This lesson builds on [recursion](/roadmap/recursion), so read that first if a function calling itself still feels strange. It covers the template every backtracking solution follows, why undoing choices is what makes it correct, the standard problems (subsets, permutations, combination sum, N-Queens), how to stop duplicate answers, and how pruning turns a hopeless search into a fast one. Every example is shown in C++, Java, Python and JavaScript.

## Why generating everything and filtering is too slow

The brute-force way to solve a "find every valid arrangement" problem is to generate every complete candidate and check each one. Take **N-Queens**: place n queens on an n × n board so that no two share a row, a column or a diagonal. For n = 8 there are 92 solutions, and the number of candidates depends entirely on how cleverly you generate them:

| What is generated | How many for n = 8 |
| --- | --- |
| Any 8 of the 64 squares | C(64, 8) = 4,426,165,368 |
| One queen in each row | 8⁸ = 16,777,216 |
| One queen in each row and each column | 8! = 40,320 |
| Backtracking: a queen goes only on a square nothing attacks | 2,056 queens placed in the whole search |

Generating 4.4 billion boards to find 92 is hopeless. Even the 40,320 permutations waste most of their work, because most of them went wrong at the second or third queen. If the queens in rows 0 and 1 already share a diagonal, the board is dead, and so are all 720 ways of filling the remaining six rows. Brute force builds and checks all 720 anyway. Backtracking notices the conflict the moment the second queen goes down and never builds any of them.

That is the whole idea in one sentence: **check the rules on partial solutions, not on finished ones**, and stop extending a partial solution as soon as it fails.

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

The **state** is the partial solution: the subset built so far, the first few numbers of a permutation, the queens already on the board. The calls form a **state-space tree**: the root is the empty solution, each edge is one choice, each node is a partial solution, and the leaves are complete solutions or dead ends. Here is the tree for the permutations of [1, 2, 3]:

```text
                                []
             1 /               2 |               \ 3
            [1]                 [2]                [3]
         2 /   \ 3           1 /   \ 3          1 /   \ 2
      [1,2]    [1,3]      [2,1]    [2,3]     [3,1]    [3,2]
        | 3      | 2        | 3      | 1       | 2      | 1
    [1,2,3]  [1,3,2]    [2,1,3]  [2,3,1]   [3,1,2]  [3,2,1]
```

The program never stores this tree. It holds only the current path from the root, and the call stack remembers where to resume. The rules of the template:

- **Choose** changes the state in place: push a number onto the path, mark it used, put a queen on a square.
- **Explore** is one recursive call that handles everything below this choice.
- **Unchoose** reverses exactly what choose did, so the next iteration of the loop starts from the state the loop started with.
- **Prune** refuses a choice that cannot lead to a solution before the call is made, which removes its whole subtree in one comparison.
- **Record a copy.** The state keeps changing after it is recorded, so storing the list itself rather than a copy leaves you with many references to one list that ends up empty.

The figure below runs the template on a small problem: find the subsets of [1, 2, 3, 4] that add up to 5. Watch the path grow along a branch, a solution recorded when the sum reaches 5, and a branch abandoned — together with all its later siblings — the moment its sum passes 5.

@walkthrough

## Why it works

Two facts make backtracking correct, and both are worth being able to say out loud in an interview.

**Every solution is in the tree exactly once.** A solution is a sequence of choices, and the tree has one path for each sequence the loop allows. If the loop offers every legal choice at every node, every solution is a leaf of the tree, and the depth-first walk reaches every node it does not prune. Arranging the choices so that each solution has *only one* path — elements taken in increasing index order for subsets and combinations, a used array for permutations — is what keeps the same answer from appearing twice.

**Pruning never loses a solution.** A rule is safe to prune on when breaking it can never be repaired by making more choices. Two queens on one diagonal stay on that diagonal whatever is placed later; a sum already past the target, with only positive numbers left to add, can only grow. Every node below a pruned node breaks the same rule, so the subtree holds no solution, and skipping it loses nothing. A rule that later choices *could* repair — "the sum is still below the target" — is not a reason to prune.

The undo step has a correctness argument of its own, an **invariant**: when a call to `backtrack` returns, the state is exactly what it was when the call began. If every call keeps that promise, every iteration of a loop starts from the same state, as if the earlier siblings had never been tried. Forget one undo and the invariant breaks: the next sibling inherits a stale number or a stale queen, and the results go wrong in ways that are hard to trace.

## Subsets and combinations

The [recursion](/roadmap/recursion) lesson listed subsets by deciding "in or out" for one element per call. Backtracking usually writes it differently: at each node, loop over the elements that may come **next**, starting after the last one taken.

```text
backtrack(start, path):
    record a copy of path                 every node is a subset, not only the leaves
    for j from start to n − 1:
        path.push(nums[j])                choose
        backtrack(j + 1, path)            explore: only later elements from here on
        path.pop()                        unchoose
```

Taking elements in increasing index order gives every subset exactly one path: {1, 3} is built as 1 then 3, never as 3 then 1. Add a size condition — record the path when it holds k elements and go no deeper — and the same loop produces the combinations of size k, which is [Combinations](/problems/combinations). That version also has a natural bound: if fewer elements remain than the path still needs, no completion exists, so the loop can stop early. [Subsets](/problems/subsets) is the loop exactly as written, and [Letter Combinations of a Phone Number](/problems/letter-combinations-of-a-phone-number) is the same tree with a different set of choices at each level: the letters of the next digit.

## Permutations

In a permutation the order matters, so any unused element may come next, not only later ones. Instead of a start index, keep a `used` array: the loop tries every element, skips the ones already in the path, and marks and unmarks the one it chooses. Unmarking is the unchoose step, and it is what makes the element available again to the siblings and cousins that come later.

### Dry run

The first branches of the permutations of [1, 2, 3]:

| Step | path | used | Action |
| --- | --- | --- | --- |
| 1 | [] | none | choose 1 |
| 2 | [1] | 1 | 1 is in use, skip it; choose 2 |
| 3 | [1, 2] | 1, 2 | choose 3 |
| 4 | [1, 2, 3] | 1, 2, 3 | full: record [1, 2, 3], return |
| 5 | [1, 2] | 1, 2 | unchoose 3; nothing left to try, return |
| 6 | [1] | 1 | unchoose 2; choose 3 |
| 7 | [1, 3] | 1, 3 | choose 2 |
| 8 | [1, 3, 2] | 1, 2, 3 | full: record [1, 3, 2], return |
| 9 | [1, 3] | 1, 3 | unchoose 2; nothing left to try, return |
| 10 | [1] | 1 | unchoose 3; nothing left to try, return |
| 11 | [] | none | unchoose 1; choose 2, and the same again below it |

Every row's `used` column matches its `path` column — that is the invariant at work. The tree has 1 + 3 + 6 + 6 = 16 nodes. For n elements the bottom level alone has n! leaves and each takes n steps to print, so listing permutations costs O(n × n!). Ten elements already give 3,628,800 of them.

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

[Permutations](/problems/permutations) asks for exactly this list. [Generate Parentheses](/problems/generate-parentheses) is the same template with two choices per position — an open or a close bracket — and two pruning rules: no more than n open brackets, and no close bracket unless one is open and waiting for it.

## Combination sum: reuse, no reuse, and duplicates

[Combination Sum](/problems/combination-sum) gives distinct positive candidates and a target, and wants every combination that adds up to the target, where **a candidate may be used any number of times**. Start from the subsets loop and change two things: carry the amount still needed, and pass `j` rather than `j + 1` to the next call so the same candidate can be chosen again. Passing `j` and not `0` still matters: the next call never goes back to earlier candidates, so [2, 2, 3] is built once, and never again as [3, 2, 2] or [2, 3, 2].

Sorting the candidates first gives a strong prune. When a candidate is larger than the amount still needed, every candidate after it is larger too, so the loop can `break` instead of `continue` — one comparison removes all the remaining siblings and everything beneath them.

[Combination Sum II](/problems/combination-sum-ii) changes the rules in two ways: each candidate may be used **once**, so the next call gets `j + 1`, and the candidates may contain **duplicates**, which needs one more rule.

### Skipping duplicates: sort, then skip equal siblings

Take candidates [10, 1, 2, 7, 6, 1, 5] and target 8. The two 1s sit at different positions, so a naive search finds [1, 7] twice — once with each 1 — and [1, 2, 5] twice as well. The cure has two parts:

- **Sort**, so equal values sit next to each other: [1, 1, 2, 5, 6, 7, 10].
- **Skip equal siblings**: in the loop, `if j > start and cands[j] == cands[j − 1]: continue`.

```text
sorted: [1, 1, 2, 5, 6, 7, 10]     target 8

children of the root:        1   1   2   5   6   7   10
                             ^   ^
                         first   second: same value at the same level, skipped

children of the first 1:     1   2   5   6   7   10
                             ^
                             the second 1 is a child here, not a sibling: allowed
                             (this is how [1, 1, 6] is built)
```

Why skipping is safe: the subtree under the first 1 can use every later candidate, including the second 1, so it already finds every combination the second 1's subtree would find. The condition is `j > start`, not `j > 0`. A duplicate is skipped only as a **sibling** — a second try of the same value at the same position in the combination. As a **child**, the next value in the combination, it is a genuine new choice. The same two lines fix [Subsets II](/problems/subsets-ii). For [Permutations II](/problems/permutations-ii), where there is no start index, the rule becomes: skip `nums[j]` when it equals `nums[j − 1]` and `nums[j − 1]` is not currently in use, which forces equal values to be taken in left-to-right order.

### The code

One function solves both problems. The only difference between reuse and no reuse is the index passed down; the skip rule changes nothing when the candidates are distinct, so it can stay on for both.

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

Note the JavaScript sort comparator: without `(a, b) => a - b`, JavaScript sorts numbers as strings and puts 10 before 2, and the `break` then cuts off valid answers.

## N-Queens: constraint sets

N-Queens shows how to make the rule check itself cheap. Place the queens one **row** at a time, so each row gets exactly one queen and the row rule holds by construction; the choice in row r is a column c. The square (r, c) is attacked when an earlier queen sits in:

- the same **column** c;
- the same **diagonal** running down to the right — every square on it has the same r − c;
- the same **anti-diagonal** running down to the left — every square on it has the same r + c.

```text
r − c on a 4 × 4 board          r + c on a 4 × 4 board

  0  -1  -2  -3                   0   1   2   3
  1   0  -1  -2                   1   2   3   4
  2   1   0  -1                   2   3   4   5
  3   2   1   0                   3   4   5   6
```

So keep three boolean arrays: `cols` indexed by c, `diag` indexed by r − c + n − 1 (shifted so it is never negative) and `anti` indexed by r + c, the last two with 2n − 1 entries. Checking a square is three lookups, O(1), instead of comparing it with every queen already placed. Choose sets the three flags, unchoose clears them. The program counts the solutions for n = 4 to 8, and counts how many queens the search places in total, which shows how much the pruning saves.

### The code

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

For n = 8 the search places 2,056 queens to find all 92 solutions, against 40,320 complete permutations for the smartest brute force. The counts 2, 10, 4, 40, 92 are the well-known sequence (six queens really do have fewer solutions than five), and [N-Queens II](/problems/n-queens-ii) asks for exactly this number.

## Pruning: cut early, cut often

A pruned node takes its whole subtree with it, and subtrees near the root are the largest, so a check that fires one level earlier can save more than a check twice as fast. Four kinds of pruning cover almost every problem:

- **Constraint checks.** The choice breaks a rule now: an attacked square, a letter that does not match in [Word Search](/problems/word-search), a close bracket with nothing open.
- **Bound checks.** The choices left cannot reach a solution: the sum is already past the target, or fewer elements remain than the combination still needs.
- **Ordering.** Sort the choices so that one failed bound check ends the whole loop with `break`, as in combination sum. In puzzles such as Sudoku, fill the cell with the fewest legal options first, so dead ends show up near the root.
- **Duplicate skipping.** Equal siblings grow identical subtrees; explore one and skip the rest.

Word Search shows how naturally the template fits a grid. The state is the board plus the position in the word; choose marks the current cell as visited, explore tries its four neighbours for the next letter, and unchoose clears the mark so that another path may use the cell. The mismatch check prunes almost every branch at its first step, which is why a search that is exponential on paper finishes quickly on real boards.

## Time and space complexity

The time of a backtracking search is the number of nodes in its tree times the work at each node, and the extra space is the depth of the tree plus the current path — not counting the answers themselves.

| Problem | Size of the search | Time | Extra space |
| --- | --- | --- | --- |
| Subsets of n elements | 2ⁿ nodes | O(n × 2ⁿ) | O(n) |
| Combinations, k of n | C(n, k) leaves | O(k × C(n, k)) | O(k) |
| Permutations of n elements | about e × n! nodes | O(n × n!) | O(n) |
| Combination sum, target T, smallest candidate m | up to n^(T/m) leaves | exponential in T/m | O(T/m) |
| N-Queens on an n × n board | at most n! placements, far fewer after pruning | O(n!) | O(n) |
| Word search, m × n grid, word of length L | 4 × 3^(L − 1) paths from each cell | O(m × n × 3^L) | O(L) |

These numbers are why backtracking problems state small limits, and why the limits are a signal in themselves. 2²⁰ is about a million, so subsets are fine up to n ≈ 20. 10! is 3.6 million, so permutations are fine up to about 10. N-Queens II stops at n = 9. When you see n ≤ 15 or a 9 × 9 board, an exponential search is what the setter expects.

## How to recognise a backtracking problem

Read the statement for these signals:

- It asks for **all** of something: "return all subsets", "list every permutation", "generate all valid combinations", "find every way to partition".
- The constraints are **small**: n up to about 20 for subsets, about 10 for permutations, a board no bigger than 9 × 9.
- Choices are made **one at a time under rules**: no two queens attacking, each cell used once, brackets balanced, each number used once.
- It asks **whether any arrangement exists** and the input is small: backtrack, and return true up the stack the moment one is found.

If the question asks only **how many** or **the best**, and n is in the hundreds or more, backtracking is too slow: the same states recur, and [dynamic programming](/roadmap/dynamic-programming) counts them once. [Target Sum](/problems/target-sum) is the standard example — a backtracking solution works for its small inputs, but the intended solution is the [knapsack](/roadmap/knapsack-problem) counting recurrence.

## Common mistakes

- **Recording the path instead of a copy.** `result.add(path)` stores a reference to a list that keeps changing and ends up empty. Store `new ArrayList<>(path)`, `path[:]` or `[...path]`.
- **A missing or misplaced undo.** Every change made in choose must be reversed after explore, on every path out of the loop body. A `continue` or `return` between choose and unchoose leaves the state dirty.
- **Skipping duplicates with `j > 0`.** The condition must be `j > start`, or [1, 1, 6] is lost because the second 1 is refused even as a child.
- **Passing the wrong index.** `j + 1` means each element once, `j` means reuse, `0` means order matters. Passing `0` to a combination problem returns every combination several times, once per ordering.
- **`break` on unsorted input.** Ending the loop when a candidate is too large is only correct when every later candidate is at least as large. Sort first, and in JavaScript sort with a numeric comparator.
- **Copying more than needed.** Building a new string or list at every call works and needs no undo, but costs O(n) per call. In Java or C++, a shared `StringBuilder` or vector with an explicit undo is faster.

## Practice in this order

Start with the problems that are the template and nothing more, then add one new rule at a time:

1. [Subsets](/problems/subsets): the start-index loop, recording every node.
2. [Combinations](/problems/combinations): the same loop with a size limit and a bound check.
3. [Permutations](/problems/permutations): a used array instead of a start index.
4. [Letter Combinations of a Phone Number](/problems/letter-combinations-of-a-phone-number): one level per digit, its letters as the choices.
5. [Combination Sum](/problems/combination-sum): reuse by passing `j`, then sort and break.
6. [Subsets II](/problems/subsets-ii): sort and skip equal siblings.
7. [Generate Parentheses](/problems/generate-parentheses): pruning with a count of open brackets.
8. [Word Search](/problems/word-search): a grid as the state, with visited marks as choose and unchoose.
9. [N-Queens II](/problems/n-queens-ii): constraint sets for columns and both diagonals.

The [backtracking problem list](/challenges/backtracking) has every problem in the catalogue that uses the technique, from easy to hard. When the first six feel routine, the next stage of the roadmap takes the same depth-first idea to [graphs](/roadmap/graphs).
