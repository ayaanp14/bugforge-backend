---
title: Monotonic Stack
stage: stacks
order: 4
minutes: 19
level: Intermediate
hub: monotonic-stack
practice: final-prices-with-a-special-discount-in-a-shop, nearest-smaller-element, next-greater-element-i, daily-temperatures, stock-span-problem, next-greater-element-ii, remove-k-digits, largest-rectangle-in-histogram, sliding-window-maximum
updated: 2026-10-03
seo-title: Monotonic Stack: Next Greater Element and Histogram
description: Learn the monotonic stack: next greater and previous smaller elements, largest rectangle in a histogram, with code in C++, Java, Python and JavaScript.
question: What is a monotonic stack?
answer: A monotonic stack is a stack whose values are kept in sorted order — always increasing or always decreasing from bottom to top. Before pushing a new element you pop everything that would break the order, and each pop answers a question such as "what is the next greater element?". Every index is pushed and popped at most once, so a whole pass takes O(n) time.
q: When should I use a monotonic stack?
a: Use it when every element needs the nearest element to its left or right that is greater or smaller than it — next greater element, previous smaller element, days until a warmer temperature, stock span. It also solves problems built on those boundaries, such as the largest rectangle in a histogram and the sum of subarray minimums.
q: How do you find the next greater element for every element of an array?
a: Scan left to right with a stack of indices still waiting for an answer. When a new value arrives, pop every waiting index whose value is smaller and record the new value as its answer, then push the new index. Indices left on the stack at the end have no greater element, so their answer is -1. The whole scan is O(n).
q: Why is a monotonic stack O(n) when it has a loop inside a loop?
a: The inner while loop only pops, and each index is pushed exactly once, so it can be popped at most once. Over the whole scan there are at most n pushes and n pops, 2n operations in total. One step may pop many items, but that only uses up pops that later steps can no longer make, so the cost is O(n) amortised.
q: Should a monotonic stack be increasing or decreasing?
a: Keep it decreasing from bottom to top to find greater elements, and increasing to find smaller ones. The stack holds the elements still waiting for an answer, or still able to be one, and an element stops waiting the moment a value that beats it arrives, which is when it is popped.
q: What is a monotonic deque?
a: A monotonic deque is the same idea with removal at both ends. For sliding window maximum, it keeps indices whose values decrease from front to back: new indices pop smaller values at the back, and indices that fall out of the window leave from the front. The front is always the window's maximum, giving O(n) for the whole array.
---
Some questions ask the same thing about every element of an array: *what is the first larger number to its right?* *How many days until a warmer one?* *What is the nearest smaller value to its left?* Answering each separately with a scan costs O(n) per element, O(n²) in all. A **monotonic stack** answers all of them in a single pass, and the same idea, pushed a little further, solves one of the classic hard problems: the largest rectangle in a histogram.

A monotonic stack is an ordinary [stack](/roadmap/stack) with one rule: its values are always sorted — **increasing** or **decreasing** from bottom to top. This lesson shows why that rule makes the answers fall out as you pop, why the double loop is still O(n), which order answers which question, and the monotonic deque that extends it to sliding windows. Every program is in C++, Java, Python and JavaScript.

## Why checking every pair is too slow

Take the **next greater element**: for each position, the first value to its right that is larger, or −1 if there is none. The brute force looks right from each position until it finds something larger:

```text
for i in 0 .. n-1:
    answer[i] = -1
    for j in i+1 .. n-1:
        if nums[j] > nums[i]: answer[i] = nums[j]; break
```

On a decreasing array such as 100,000, 99,999, …, 1, no element ever finds an answer, so every inner loop runs to the end: about n² / 2, or 5 × 10⁹ comparisons for n = 100,000. The waste is that the inner loops keep re-reading the same elements. When the scan for 3 passes over a 1 and a 2 to reach a 7, it has learnt that 7 is also the answer for that 1 and that 2 — and then throws the knowledge away.

## The idea: a stack that stays sorted

Turn the question round. Instead of each element searching right for its answer, scan left to right once and let each new element **answer** the earlier ones that are still waiting.

Keep a stack of the indices that have not found their next greater element yet. When a new value arrives:

- **Pop** every waiting index whose value is smaller than the new one. The new value is the first greater value to the right of each of them, so record it as their answer.
- **Push** the new index. It now waits for something larger than itself.
- When the scan ends, whatever is still on the stack never met a larger value: its answer is −1.

```text
 nums = [2, 1, 5, 6, 2, 3]           scanning i = 2, value 5

 waiting (bottom -> top):  2  1       5 > 1: pop, answer for index 1 is 5
                           2          5 > 2: pop, answer for index 0 is 5
                           (empty)    push 5
```

Look at the waiting values at any moment: they **decrease** from bottom to top. That is not a rule you enforce separately; it is a consequence. A value is only pushed after everything smaller than it above it has been popped, so it always lands on something at least as large. A stack kept sorted this way is called **monotonic**, and this one is a monotonic decreasing stack.

@walkthrough

## Why it works

Two things need checking: that each recorded answer is right, and that the loop is fast.

**The answers are right.** Suppose index i pops index j. Then `nums[i] > nums[j]`, so `nums[i]` is a greater value to the right of j. Is it the *first* one? Every index between j and i arrived while j was waiting on the stack, and none of them popped j — so none of them was greater than `nums[j]`. So i is the first greater element after j. And an index left on the stack at the end was never popped, so nothing after it was greater: −1 is right.

**Popped elements are never needed again.** Popping looks like throwing information away, so it is worth seeing why it is safe. A waiting index j leaves the stack only when it has its answer, and an answered index is never asked about again. The general principle, which every monotonic-stack problem relies on, is **domination**: an element is discarded the moment a newer element makes it useless for every question still to come.

**It is O(n), despite the loop inside a loop.** The inner `while` loop only pops. Each index is pushed exactly once, so it can be popped at most once. Over the whole scan there are at most n pushes and at most n pops — 2n stack operations however they are spread out. One step may pop many items, but those pops are then used up and no later step can make them. That is **amortised** O(n): the expensive steps are paid for by the cheap ones. Extra space is O(n), for the stack.

### Dry run

`nums = [2, 1, 5, 6, 2, 3]`, the example in the figure above:

| i | Value | Pops (index: value → answer) | Stack after, as values | answers so far |
| --- | --- | --- | --- | --- |
| 0 | 2 | none, stack empty | 2 | _ _ _ _ _ _ |
| 1 | 1 | none, 1 is not greater than 2 | 2 1 | _ _ _ _ _ _ |
| 2 | 5 | 1: 1 → 5, then 0: 2 → 5 | 5 | 5 5 _ _ _ _ |
| 3 | 6 | 2: 5 → 6 | 6 | 5 5 6 _ _ _ |
| 4 | 2 | none, 2 is not greater than 6 | 6 2 | 5 5 6 _ _ _ |
| 5 | 3 | 4: 2 → 3; stops at 6 | 6 3 | 5 5 6 _ 3 _ |
| end | — | 3 and 5 never answered | — | 5 5 6 −1 3 −1 |

Six pushes, four pops during the scan, two left over: no index is touched more than twice.

### The code

The stack stores **indices**, not values. An index gives you the value (`nums[j]`) and the distance (`i − j`), so one function answers both "what is the next greater value?" and "how many days until a warmer one?", which is [Daily Temperatures](/problems/daily-temperatures).

```cpp
#include <iostream>
#include <string>
#include <vector>
using namespace std;

// For each index, the index of the first greater value to its right, or -1.
vector<int> nextGreaterIndex(const vector<int>& nums) {
    int n = nums.size();
    vector<int> answer(n, -1);
    vector<int> stack;  // indices still waiting; their values decrease bottom to top
    for (int i = 0; i < n; i++) {
        while (!stack.empty() && nums[stack.back()] < nums[i]) {
            answer[stack.back()] = i;  // nums[i] is the first greater value after it
            stack.pop_back();
        }
        stack.push_back(i);  // wait for something greater than nums[i]
    }
    return answer;  // indices never popped keep -1
}

void printRow(const string& label, const vector<int>& row) {
    cout << label;
    for (int x : row) cout << " " << x;
    cout << "\n";
}

int main() {
    vector<int> nums = {2, 1, 5, 6, 2, 3};
    vector<int> next = nextGreaterIndex(nums), values;
    for (int j : next) values.push_back(j == -1 ? -1 : nums[j]);
    printRow("nums:        ", nums);
    printRow("next greater:", values);

    vector<int> temps = {73, 74, 75, 71, 69, 72, 76, 73};
    vector<int> warmer = nextGreaterIndex(temps), waits;
    for (int i = 0; i < (int)temps.size(); i++) waits.push_back(warmer[i] == -1 ? 0 : warmer[i] - i);
    printRow("temperatures:", temps);
    printRow("days to wait:", waits);
    return 0;
}
```

```java
import java.util.ArrayDeque;
import java.util.Arrays;
import java.util.Deque;

public class Main {
    // For each index, the index of the first greater value to its right, or -1.
    static int[] nextGreaterIndex(int[] nums) {
        int n = nums.length;
        int[] answer = new int[n];
        Arrays.fill(answer, -1);
        Deque<Integer> stack = new ArrayDeque<>();  // indices still waiting; their values decrease bottom to top
        for (int i = 0; i < n; i++) {
            while (!stack.isEmpty() && nums[stack.peek()] < nums[i]) {
                answer[stack.pop()] = i;  // nums[i] is the first greater value after it
            }
            stack.push(i);  // wait for something greater than nums[i]
        }
        return answer;  // indices never popped keep -1
    }

    static void printRow(String label, int[] row) {
        StringBuilder line = new StringBuilder(label);
        for (int x : row) line.append(" ").append(x);
        System.out.println(line);
    }

    public static void main(String[] args) {
        int[] nums = {2, 1, 5, 6, 2, 3};
        int[] next = nextGreaterIndex(nums);
        int[] values = new int[nums.length];
        for (int i = 0; i < nums.length; i++) values[i] = next[i] == -1 ? -1 : nums[next[i]];
        printRow("nums:        ", nums);
        printRow("next greater:", values);

        int[] temps = {73, 74, 75, 71, 69, 72, 76, 73};
        int[] warmer = nextGreaterIndex(temps);
        int[] waits = new int[temps.length];
        for (int i = 0; i < temps.length; i++) waits[i] = warmer[i] == -1 ? 0 : warmer[i] - i;
        printRow("temperatures:", temps);
        printRow("days to wait:", waits);
    }
}
```

```python
def next_greater_index(nums):
    """For each index, the index of the first greater value to its right, or -1."""
    answer = [-1] * len(nums)
    stack = []  # indices still waiting; their values decrease bottom to top
    for i, value in enumerate(nums):
        while stack and nums[stack[-1]] < value:
            answer[stack.pop()] = i  # nums[i] is the first greater value after it
        stack.append(i)  # wait for something greater than nums[i]
    return answer  # indices never popped keep -1


def print_row(label, row):
    print(label, *row)


nums = [2, 1, 5, 6, 2, 3]
nxt = next_greater_index(nums)
print_row("nums:        ", nums)
print_row("next greater:", [-1 if j == -1 else nums[j] for j in nxt])

temps = [73, 74, 75, 71, 69, 72, 76, 73]
warmer = next_greater_index(temps)
print_row("temperatures:", temps)
print_row("days to wait:", [0 if j == -1 else j - i for i, j in enumerate(warmer)])
```

```javascript
// For each index, the index of the first greater value to its right, or -1.
function nextGreaterIndex(nums) {
  const answer = new Array(nums.length).fill(-1);
  const stack = []; // indices still waiting; their values decrease bottom to top
  for (let i = 0; i < nums.length; i++) {
    while (stack.length > 0 && nums[stack[stack.length - 1]] < nums[i]) {
      answer[stack.pop()] = i; // nums[i] is the first greater value after it
    }
    stack.push(i); // wait for something greater than nums[i]
  }
  return answer; // indices never popped keep -1
}

function printRow(label, row) {
  console.log(label + " " + row.join(" "));
}

const nums = [2, 1, 5, 6, 2, 3];
const next = nextGreaterIndex(nums);
printRow("nums:        ", nums);
printRow("next greater:", next.map((j) => (j === -1 ? -1 : nums[j])));

const temps = [73, 74, 75, 71, 69, 72, 76, 73];
const warmer = nextGreaterIndex(temps);
printRow("temperatures:", temps);
printRow("days to wait:", warmer.map((j, i) => (j === -1 ? 0 : j - i)));
```

```output
nums:         2 1 5 6 2 3
next greater: 5 5 6 -1 3 -1
temperatures: 73 74 75 71 69 72 76 73
days to wait: 1 1 4 2 1 1 0 0
```

## Previous smaller element

The mirror question looks **left**: for each element, the nearest value before it that is smaller, or −1. You still scan left to right, but now the answer for the *current* element is read from the stack rather than given to the popped ones.

```text
for i in 0 .. n-1:
    while stack is not empty and arr[top] >= arr[i]:
        pop                          # top is no smaller than arr[i], and further away
    answer[i] = arr[top] if the stack is not empty, else -1
    push i
```

Why can the popped elements go? Take j < i with `arr[j] >= arr[i]`. For any later position k, index i is nearer to k than j is, and `arr[i]` is no larger than `arr[j]`. So whenever `arr[j]` would be smaller than `arr[k]`, `arr[i]` is too, and it is found first. j is dominated: it can never be anyone's nearest smaller element again. What survives is increasing from bottom to top, and the top is always the nearest smaller candidate.

For `arr = [4, 5, 2, 10, 8]`:

| i | Value | Popped | Answer (top after popping) | Stack after, as values |
| --- | --- | --- | --- | --- |
| 0 | 4 | — | −1 | 4 |
| 1 | 5 | — | 4 | 4 5 |
| 2 | 2 | 5, 4 | −1 | 2 |
| 3 | 10 | — | 2 | 2 10 |
| 4 | 8 | 10 | 2 | 2 8 |

The answers are −1, 4, −1, 2, 2, as in [Nearest Smaller Element](/problems/nearest-smaller-element). The [Stock Span Problem](/problems/stock-span-problem) is the same scan with "previous greater": a day's span reaches back to the previous strictly higher price.

## Which order answers which question

There are four questions, and two choices decide each: whether the stack is increasing or decreasing, and whether the answer is handed to the popped element or read from the top.

| Question | Stack order, bottom → top | Pop while the top is… | Where the answer comes from |
| --- | --- | --- | --- |
| Next greater element | decreasing | smaller than the current value | each popped index gets the current index |
| Next smaller element | increasing | greater than the current value | each popped index gets the current index |
| Previous greater element | decreasing | smaller than or equal to the current value | the top after popping |
| Previous smaller element | increasing | greater than or equal to the current value | the top after popping |

The memory aid: **to find greater elements keep the stack decreasing; to find smaller ones keep it increasing.** The stack holds the elements still waiting for an answer (or still able to be one), and an element stops waiting at the moment a value that beats it arrives.

Strictness matters when values repeat. "Next greater" pops on a strict `<`, so equal values do not answer each other; [Final Prices With a Special Discount in a Shop](/problems/final-prices-with-a-special-discount-in-a-shop) wants the next value that is smaller *or equal*, so it pops on `>=`. Decide what an equal value should do before choosing the comparison.

## Largest rectangle in a histogram

[Largest Rectangle in Histogram](/problems/largest-rectangle-in-histogram) gives bar heights of width 1 and asks for the largest rectangle that fits under them. With heights `[2, 1, 5, 6, 2, 3]` the answer is 10: height 5 across the bars of height 5 and 6.

Trying every pair of left and right edges is O(n²) even with a running minimum. The key observation is that the best rectangle's height equals the height of its **shortest bar**. So ask, for each bar i: what is the widest rectangle in which bar i is the shortest? It stretches left until the **previous smaller** bar and right until the **next smaller** bar, and stops just inside both.

```text
 area with bar i as the shortest = heights[i] × (nextSmaller[i] - prevSmaller[i] - 1)
```

Both boundaries come from one increasing stack. When bar i pops bar j because `heights[i]` is smaller or equal, bar i is j's right boundary, and the bar left on top after the pop is j's left boundary — the stack is increasing, so it is the nearest shorter bar before j (or −1 if the stack is empty). A bar of height 0 added after the last one pops everything left, so every bar gets measured.

With equal heights, the first of two equal bars is popped by the second and measured too narrow, but the second one is popped later with the full width, so the maximum is unaffected.

### Dry run

`heights = [2, 1, 5, 6, 2, 3]`, then the height-0 bar at i = 6:

| i | Height | Popped bar (height) | Left boundary | Width | Area |
| --- | --- | --- | --- | --- | --- |
| 1 | 1 | 0 (2) | −1 | 1 − (−1) − 1 = 1 | 2 |
| 4 | 2 | 3 (6) | 2 | 4 − 2 − 1 = 1 | 6 |
| 4 | 2 | 2 (5) | 1 | 4 − 1 − 1 = 2 | **10** |
| 6 | 0 | 5 (3) | 4 | 6 − 4 − 1 = 1 | 3 |
| 6 | 0 | 4 (2) | 1 | 6 − 1 − 1 = 4 | 8 |
| 6 | 0 | 1 (1) | −1 | 6 − (−1) − 1 = 6 | 6 |

Bars 2, 3 and 5 were pushed at i = 2, 3 and 5 without popping anything. Every bar is measured exactly once, when it is popped, and the largest area is 10.

### The code

```cpp
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

int largestRectangle(const vector<int>& heights) {
    int n = heights.size();
    vector<int> stack;  // indices of bars, heights increasing bottom to top
    int best = 0;
    for (int i = 0; i <= n; i++) {
        int h = (i == n) ? 0 : heights[i];  // a height-0 bar at the end flushes the stack
        while (!stack.empty() && heights[stack.back()] >= h) {
            int bar = stack.back();
            stack.pop_back();
            int left = stack.empty() ? -1 : stack.back();  // the previous smaller bar
            int width = i - left - 1;                       // i is the next smaller (or equal) bar
            best = max(best, heights[bar] * width);
        }
        stack.push_back(i);
    }
    return best;
}

int main() {
    vector<vector<int>> tests = {{2, 1, 5, 6, 2, 3}, {2, 4}, {6, 2, 5, 4, 5, 1, 6}};
    for (const vector<int>& heights : tests) {
        cout << "heights";
        for (int h : heights) cout << " " << h;
        cout << " -> largest rectangle " << largestRectangle(heights) << "\n";
    }
    return 0;
}
```

```java
import java.util.ArrayDeque;
import java.util.Deque;

public class Main {
    static int largestRectangle(int[] heights) {
        int n = heights.length;
        Deque<Integer> stack = new ArrayDeque<>();  // indices of bars, heights increasing bottom to top
        int best = 0;
        for (int i = 0; i <= n; i++) {
            int h = (i == n) ? 0 : heights[i];  // a height-0 bar at the end flushes the stack
            while (!stack.isEmpty() && heights[stack.peek()] >= h) {
                int bar = stack.pop();
                int left = stack.isEmpty() ? -1 : stack.peek();  // the previous smaller bar
                int width = i - left - 1;                         // i is the next smaller (or equal) bar
                best = Math.max(best, heights[bar] * width);
            }
            stack.push(i);
        }
        return best;
    }

    public static void main(String[] args) {
        int[][] tests = {{2, 1, 5, 6, 2, 3}, {2, 4}, {6, 2, 5, 4, 5, 1, 6}};
        for (int[] heights : tests) {
            StringBuilder line = new StringBuilder("heights");
            for (int h : heights) line.append(" ").append(h);
            line.append(" -> largest rectangle ").append(largestRectangle(heights));
            System.out.println(line);
        }
    }
}
```

```python
def largest_rectangle(heights):
    n = len(heights)
    stack = []  # indices of bars, heights increasing bottom to top
    best = 0
    for i in range(n + 1):
        h = 0 if i == n else heights[i]  # a height-0 bar at the end flushes the stack
        while stack and heights[stack[-1]] >= h:
            bar = stack.pop()
            left = stack[-1] if stack else -1  # the previous smaller bar
            width = i - left - 1               # i is the next smaller (or equal) bar
            best = max(best, heights[bar] * width)
        stack.append(i)
    return best


tests = [[2, 1, 5, 6, 2, 3], [2, 4], [6, 2, 5, 4, 5, 1, 6]]
for heights in tests:
    print("heights", *heights, "-> largest rectangle", largest_rectangle(heights))
```

```javascript
function largestRectangle(heights) {
  const n = heights.length;
  const stack = []; // indices of bars, heights increasing bottom to top
  let best = 0;
  for (let i = 0; i <= n; i++) {
    const h = i === n ? 0 : heights[i]; // a height-0 bar at the end flushes the stack
    while (stack.length > 0 && heights[stack[stack.length - 1]] >= h) {
      const bar = stack.pop();
      const left = stack.length > 0 ? stack[stack.length - 1] : -1; // the previous smaller bar
      const width = i - left - 1; // i is the next smaller (or equal) bar
      best = Math.max(best, heights[bar] * width);
    }
    stack.push(i);
  }
  return best;
}

const tests = [[2, 1, 5, 6, 2, 3], [2, 4], [6, 2, 5, 4, 5, 1, 6]];
for (const heights of tests) {
  console.log(`heights ${heights.join(" ")} -> largest rectangle ${largestRectangle(heights)}`);
}
```

```output
heights 2 1 5 6 2 3 -> largest rectangle 10
heights 2 4 -> largest rectangle 4
heights 6 2 5 4 5 1 6 -> largest rectangle 12
```

The same "how far does this element reach as the minimum?" question drives [Sum of Subarray Minimums](/problems/sum-of-subarray-minimums): element i is the minimum of (i − prevSmaller) × (nextSmaller − i) subarrays, so its contribution is its value times that count (with equal values counted as smaller on one side only, so no subarray is counted twice). [Maximal Rectangle](/problems/maximal-rectangle) runs the histogram algorithm once per row of a binary matrix.

## The monotonic deque: sliding window maximum

[Sliding Window Maximum](/problems/sliding-window-maximum) asks for the maximum of every window of k consecutive elements. Recomputing each window is O(n × k); a heap that discards stale entries lazily brings it to O(n log n). A monotonic **deque** — a [queue](/roadmap/queue) that can also pop at the back — does it in O(n).

Keep a deque of indices whose values **decrease from front to back**. For each new index i:

```text
while deque not empty and nums[back] <= nums[i]:
    pop back                   # an older, smaller value can never be a window maximum again
push i at the back
if front <= i - k:
    pop front                  # the front has slid out of the window
if i >= k - 1:
    window maximum = nums[front]
```

The back is pruned by domination, exactly as before: an older value that is not larger than `nums[i]` will leave the window before i does, and while both are inside, `nums[i]` is at least as large. So it can never be a maximum again. The front is pruned by age. What remains is the window's candidates in decreasing order, so the front is the maximum. Each index enters and leaves once: O(n) time and O(k) space.

For `nums = [1, 3, -1, -3, 5, 3, 6, 7]` and k = 3, the deque's values after each step are `1`, `3`, `3 -1`, `3 -1 -3`, `5`, `5 3`, `6`, `7`, giving window maxima 3, 3, 5, 5, 6, 7. The window-maintenance half of this is the [sliding window](/roadmap/sliding-window) technique; the ordering half is the monotonic stack.

## Other shapes of the idea

- **Circular arrays.** In [Next Greater Element II](/problems/next-greater-element-ii) the search wraps round, so scan the indices twice (i from 0 to 2n − 1, reading `nums[i % n]`) and push only during the first pass.
- **Lookups for a subset.** [Next Greater Element I](/problems/next-greater-element-i) runs the scan over one array and stores the answers in a hash map for the queries.
- **Greedy removal.** In [Remove K Digits](/problems/remove-k-digits), keep the digits in an increasing stack and, while removals are left, pop a larger digit when a smaller one arrives: a smaller digit earlier always makes a smaller number.
- **Contribution counting.** [Sum of Subarray Minimums](/problems/sum-of-subarray-minimums) and [Sum of Subarray Ranges](/problems/sum-of-subarray-ranges) count how many subarrays each element is the minimum or maximum of, using both boundaries.

## Time and space complexity

| Problem | Approach | Time | Extra space |
| --- | --- | --- | --- |
| Next greater element | Scan right from every index | O(n²) | O(1) |
| Next greater element | Monotonic stack | O(n) | O(n) |
| Largest rectangle in a histogram | Every pair of edges, running minimum | O(n²) | O(1) |
| Largest rectangle in a histogram | Increasing stack with a sentinel | O(n) | O(n) |
| Sliding window maximum | Rescan each window | O(n × k) | O(1) |
| Sliding window maximum | Heap with lazy deletion | O(n log n) | O(n) |
| Sliding window maximum | Monotonic deque | O(n) | O(k) |

## How to recognise a monotonic stack problem

- The question asks, for **every** element, about the **nearest** element to its left or right that is **greater or smaller**.
- Words like "next warmer", "next higher price", "how many days until", "span", "can see over", "visible".
- A quantity limited by the **smallest** (or largest) element in a range: rectangles under bars, the minimum of every subarray.
- **"Smallest number after removing k digits"** or "lexicographically smallest subsequence": greedy removal with an increasing stack.
- The **maximum or minimum of every window**: the monotonic deque.

If the brute force is "for each i, scan outwards until something bigger or smaller appears", a monotonic stack almost certainly brings it to O(n).

## Common mistakes

- **Storing values instead of indices.** Values lose the position, so you cannot compute distances or widths, and you cannot tell which equal value is which. Push indices and look the values up.
- **The wrong comparison for duplicates.** `<` and `<=` give different answers when values repeat. Decide whether an equal value counts as "greater" for this problem before writing the loop.
- **Forgetting what is left on the stack.** Indices never popped still need an answer: −1, 0 or the array's end. In the histogram, the height-0 sentinel does this flushing for you.
- **Choosing the wrong order.** Finding greater elements needs a decreasing stack, smaller elements an increasing one. If your answers come out as the farthest rather than the nearest, the order is backwards.
- **Assuming the double loop is O(n²).** It is O(n) because each index is pushed and popped at most once; do not "optimise" it into something more complicated.
- **Expiring the deque's front too late.** In sliding window maximum, remove the front once its index is `i - k` or less, before reading the maximum.

## Practice in this order

1. [Final Prices With a Special Discount in a Shop](/problems/final-prices-with-a-special-discount-in-a-shop): next smaller-or-equal element, on a tiny array.
2. [Nearest Smaller Element](/problems/nearest-smaller-element): previous smaller element, read from the top.
3. [Next Greater Element I](/problems/next-greater-element-i): the core scan plus a hash map for the queries.
4. [Daily Temperatures](/problems/daily-temperatures): the first example, answering with distances.
5. [Stock Span Problem](/problems/stock-span-problem): previous greater element, turned into a count of days.
6. [Next Greater Element II](/problems/next-greater-element-ii): the same scan over a circular array.
7. [Remove K Digits](/problems/remove-k-digits): an increasing stack used greedily.
8. [Largest Rectangle in Histogram](/problems/largest-rectangle-in-histogram): both boundaries from one stack.
9. [Sliding Window Maximum](/problems/sliding-window-maximum): the monotonic deque.

The [monotonic stack problem list](/challenges/monotonic-stack) has every problem in the catalogue that uses it, and the [monotonic queue list](/challenges/monotonic-queue) has the deque problems. This lesson closes the stacks stage; next on the road is [Binary Search](/roadmap/binary-search).
