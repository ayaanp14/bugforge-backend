---
title: Monotonic Stack
stage: stacks
order: 4
minutes: 12
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
Some questions ask the same thing about every element of an array: *what is the first larger number to its right?* *How many days until a warmer one?* *What is the nearest smaller value to its left?* Answering each separately costs O(n²) in all. A **monotonic stack** answers all of them in one pass, and pushed a little further it solves a classic hard problem: the largest rectangle in a histogram.

A monotonic stack is an ordinary [stack](/roadmap/stack) with one rule: its values are always sorted, **increasing** or **decreasing** from bottom to top.

## Why checking every pair is too slow

Take the **next greater element**: for each position, the first value to its right that is larger, or −1. The brute force scans right from every position until something larger appears. On a decreasing array no scan ever succeeds, so the inner loops run about n²/2 times — 5 × 10⁹ comparisons for n = 100,000. The waste is re-reading: when the scan for 3 passes a 1 and a 2 to reach a 7, it has learnt that 7 answers the 1 and the 2 as well, and throws that knowledge away.

## The idea: a stack that stays sorted

Turn the question round: scan left to right once and let each new element **answer** the earlier ones still waiting, kept on a stack of indices. When a new value arrives:

- **Pop** every waiting index whose value is smaller, and record the new value as its answer.
- **Push** the new index; it now waits for something larger.
- At the end, whatever is still on the stack never met a larger value: its answer is −1.

@walkthrough

The waiting values always **decrease** from bottom to top. Nobody enforces that separately: a value is only pushed after everything smaller has been popped, so it always lands on something at least as large. That is a monotonic decreasing stack.

## Why it works

**Each answer is right.** When index i pops index j, `nums[i]` is greater and to the right. It is the *first* such value because every index between them arrived while j was waiting and did not pop it, so none of them was greater.

@figure why-first

Popping looks like throwing information away, and the general reason it is safe is **domination**: an element leaves the stack the moment a newer element makes it useless for every question still to come — here, because it has its answer.

**It is O(n), despite the loop inside a loop.** The inner loop only pops, and each index is pushed exactly once, so it can be popped at most once.

@figure work

### The code

The stack stores **indices**, not values: an index gives the value and the distance, so one function answers both the next greater value and "how many days until a warmer one?", which is [Daily Temperatures](/problems/daily-temperatures).

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

The mirror question looks **left**: for each element, the nearest value before it that is smaller. You still scan left to right, but the answer for the *current* element is read from the top after popping, rather than handed to the popped ones.

@figure prev-smaller

An element j can go once a later element i is no larger: i is nearer to everything still to come and at least as small, so j can never again be anyone's nearest smaller value. The same scan answers [Nearest Smaller Element](/problems/nearest-smaller-element), and the [Stock Span Problem](/problems/stock-span-problem) is "previous greater" turned into a count of days.

## Which order answers which question

| Question | Stack order, bottom → top | Pop while the top is… | Where the answer comes from |
| --- | --- | --- | --- |
| Next greater element | decreasing | smaller than the current value | each popped index gets the current index |
| Next smaller element | increasing | greater than the current value | each popped index gets the current index |
| Previous greater element | decreasing | smaller than or equal to the current value | the top after popping |
| Previous smaller element | increasing | greater than or equal to the current value | the top after popping |

The memory aid: **to find greater elements keep the stack decreasing; to find smaller ones keep it increasing.** With repeated values, decide whether an equal value counts before choosing between `<` and `<=`: [Final Prices With a Special Discount in a Shop](/problems/final-prices-with-a-special-discount-in-a-shop) wants smaller *or equal*.

## Largest rectangle in a histogram

[Largest Rectangle in Histogram](/problems/largest-rectangle-in-histogram) asks for the largest rectangle under bars of width 1. Trying every pair of edges is O(n²). The key observation: the best rectangle's height is its **shortest bar**, so for each bar find the widest rectangle in which it is the shortest — from just after the **previous smaller** bar to just before the **next smaller** one.

One increasing stack gives both boundaries at once: the bar that pops bar j is its right boundary, and the bar left on top is its left one. A height-0 sentinel at the end pops everything left.

@figure histogram

With equal heights, the first of two equal bars is popped by the second and measured too narrow, but the second is popped later with the full width, so the maximum is unaffected.

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

The same "how far does this element reach as the minimum?" question drives [Sum of Subarray Minimums](/problems/sum-of-subarray-minimums): element i is the minimum of (i − prevSmaller) × (nextSmaller − i) subarrays. [Maximal Rectangle](/problems/maximal-rectangle) runs the histogram algorithm once per row of a binary matrix.

## The monotonic deque: sliding window maximum

[Sliding Window Maximum](/problems/sliding-window-maximum) asks for the maximum of every window of k elements. Rescanning each window is O(n × k) and a heap is O(n log n); a monotonic **deque** — a [queue](/roadmap/queue) that can also pop at the back — does it in O(n).

@figure window-max

The back is pruned by domination: an older value no larger than the newcomer leaves the window first and is never bigger while both are inside. The front is pruned by age. Each index enters and leaves once: O(n) time, O(k) space — the [sliding window](/roadmap/sliding-window) and the monotonic stack together.

## Other shapes of the idea

- **Circular arrays**: in [Next Greater Element II](/problems/next-greater-element-ii), scan the indices twice, reading `nums[i % n]`, and push only during the first pass.
- **Lookups for a subset**: [Next Greater Element I](/problems/next-greater-element-i) runs the scan once and keeps the answers in a hash map.
- **Greedy removal**: in [Remove K Digits](/problems/remove-k-digits), keep digits in an increasing stack and pop a larger digit when a smaller one arrives, while removals are left.
- **Contribution counting**: [Sum of Subarray Ranges](/problems/sum-of-subarray-ranges) counts how many subarrays each element is the minimum or maximum of.

## Time and space complexity

| Problem | Approach | Time | Extra space |
| --- | --- | --- | --- |
| Next greater element | Scan right from every index | O(n²) | O(1) |
| Next greater element | Monotonic stack | O(n) | O(n) |
| Largest rectangle in a histogram | Every pair of edges | O(n²) | O(1) |
| Largest rectangle in a histogram | Increasing stack with a sentinel | O(n) | O(n) |
| Sliding window maximum | Rescan each window | O(n × k) | O(1) |
| Sliding window maximum | Monotonic deque | O(n) | O(k) |

## How to recognise a monotonic stack problem

- For **every** element, the **nearest** element to its left or right that is **greater or smaller**: "next warmer", "how many days until", "span".
- A quantity limited by the **smallest** element in a range: rectangles under bars, subarray minimums.
- "**Smallest number after removing k digits**": greedy removal with an increasing stack.
- The **maximum or minimum of every window**: the monotonic deque.
- A brute force that reads "for each i, scan outwards until something bigger or smaller appears".

## Common mistakes

- **Storing values instead of indices**: you lose distances, widths and which equal value is which.
- **The wrong comparison for duplicates**: `<` and `<=` give different answers when values repeat.
- **Forgetting what is left on the stack**: those indices still need an answer — or a sentinel to flush them.
- **Choosing the wrong order**: if the answers come out farthest rather than nearest, the order is backwards.
- **Expiring the deque's front too late**: remove it once its index is `i - k` or less, before reading the maximum.

## Practice in this order

1. [Final Prices With a Special Discount in a Shop](/problems/final-prices-with-a-special-discount-in-a-shop): next smaller-or-equal, on a tiny array.
2. [Nearest Smaller Element](/problems/nearest-smaller-element): previous smaller, read from the top.
3. [Next Greater Element I](/problems/next-greater-element-i): the core scan plus a hash map.
4. [Daily Temperatures](/problems/daily-temperatures): the first program, answering with distances.
5. [Stock Span Problem](/problems/stock-span-problem): previous greater, turned into a count.
6. [Next Greater Element II](/problems/next-greater-element-ii): the same scan, circular.
7. [Remove K Digits](/problems/remove-k-digits): an increasing stack used greedily.
8. [Largest Rectangle in Histogram](/problems/largest-rectangle-in-histogram): both boundaries from one stack.
9. [Sliding Window Maximum](/problems/sliding-window-maximum): the monotonic deque.

The [monotonic stack problem list](/challenges/monotonic-stack) has every problem in the catalogue that uses it, and the [monotonic queue list](/challenges/monotonic-queue) has the deque problems. This lesson closes the stacks stage; next on the road is [Binary Search](/roadmap/binary-search).
