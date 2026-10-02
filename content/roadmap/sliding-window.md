---
title: Sliding Window Technique
stage: sliding-window
order: 1
minutes: 14
level: Beginner
hub: sliding-window
practice: maximum-sum-subarray-of-size-k, contains-duplicate-ii, longest-substring-without-repeating-characters, minimum-size-subarray-sum, max-consecutive-ones-iii, permutation-in-string, longest-repeating-character-replacement, minimum-window-substring, subarrays-with-k-different-integers
updated: 2026-10-03
seo-title: Sliding Window Technique: Fixed & Variable Windows Explained
description: Learn the sliding window technique: fixed and variable windows, why shrinking is safe, the exactly-K trick, and code in C++, Java, Python and JavaScript.
question: What is the sliding window technique?
answer: The sliding window technique keeps one contiguous stretch of an array or string, the window, and updates its sum, count or contents as its edges move, instead of recomputing every subarray from scratch. A fixed window slides one step at a time; a variable window grows on the right and shrinks on the left. Each element enters and leaves the window at most once, so the scan takes O(n) time.
q: When should I use the sliding window technique?
a: Use it when the question asks about a contiguous subarray or substring — the longest, the shortest, the largest sum, or how many — and the window's state can be updated when one element enters and another leaves. Words such as "consecutive", "substring" and "subarray of length k" are the usual signals.
q: What is the difference between sliding window and two pointers?
a: A sliding window is a special case of same-direction two pointers: both pointers move left to right, never backwards, and you track something about the elements between them, such as a sum or a count of characters. Two pointers is the wider family; it also covers pointers that start at opposite ends of a sorted array and meet in the middle.
q: Why is a sliding window O(n) when it has a loop inside a loop?
a: The inner loop only moves the left pointer forwards, and the left pointer never passes the right one, so across the whole run it moves at most n times in total. Add the right pointer's n moves and the work is at most 2n steps: each element enters the window once and leaves it at most once.
q: Does the sliding window work with negative numbers?
a: Not for conditions on a sum. Shrinking is safe only when removing an element always moves the sum the same way, which needs the numbers to be non-negative. With negatives, use prefix sums with a hash map for "subarray sum equals k", or prefix sums with a monotonic deque for "shortest subarray with sum at least k".
q: How do you count subarrays with exactly K distinct elements?
a: Count the subarrays with at most K distinct elements and subtract those with at most K − 1. "At most K" can be counted with a sliding window, adding right − left + 1 for every position of the right pointer; "exactly K" cannot, because shrinking such a window can break it, but it is the difference of two counts that can.
---
Many questions ask about a **contiguous** stretch of the input: the largest sum of k consecutive numbers, the longest substring with no repeated letter. Neighbouring stretches share almost all their elements, so the sliding window technique keeps one stretch, the **window**, and updates it as the edges move — O(1) a step instead of O(k). It is [two pointers](/roadmap/two-pointers) moving the same way, in two kinds:

@figure two-kinds

## Why recomputing every window is too slow

Summing every window of k from scratch is n − k + 1 windows of k additions: about 2.5 × 10⁹ for n = 100,000 and k = 50,000, against roughly 10⁸ simple steps a second. Without a fixed length it is worse — about n²/2 substrings, each checked for repeats. Yet neighbouring windows share k − 1 elements, added up again every time.

## The idea: slide the window instead of rebuilding it

A **fixed-size window** keeps a running sum: old sum + newcomer − leaver. Given a rule instead of a length, a **variable-size window** from `left` to `right` follows three rules:

- **Grow.** Move `right` one step and add the new element to the window's state.
- **Shrink.** While the window breaks the rule, remove the element at `left` and move `left` on.
- **Record.** Once the window obeys the rule again, compare it with the best so far.

The state is whatever checks the rule in O(1): a running sum, or a **count map** of how often each value is inside. Below, the longest substring without a repeat in "pwwkew" — where a map of last-seen positions lets `left` jump straight past a repeat.

@walkthrough

## A fixed-size window

There is nothing to decide: build the first window once, then slide it to the end. When `right` enters, the element leaving is `arr[right - k]` and the window starts at `right - k + 1`.

@figure fixed-slide

### The code

The program runs the same array with k = 3 and k = 2. With k = 2 two windows tie at 6; the strict `>` keeps the first one.

```cpp
#include <iostream>
#include <utility>
#include <vector>
using namespace std;

// Largest sum of k consecutive elements, and the index where that window starts.
pair<int, int> maxWindowSum(const vector<int>& arr, int k) {
    int sum = 0;
    for (int i = 0; i < k; i++) sum += arr[i];   // the first window, built once
    int best = sum, bestStart = 0;
    for (int right = k; right < (int)arr.size(); right++) {
        sum += arr[right] - arr[right - k];       // one element enters, one leaves
        if (sum > best) {
            best = sum;
            bestStart = right - k + 1;
        }
    }
    return {best, bestStart};
}

int main() {
    vector<int> arr = {2, 1, 5, 1, 3, 2};
    for (int k : {3, 2}) {
        pair<int, int> r = maxWindowSum(arr, k);
        cout << "k = " << k << ": best sum " << r.first << " (indices " << r.second
             << " to " << r.second + k - 1 << ")\n";
    }
    return 0;
}
```

```java
public class Main {
    // Largest sum of k consecutive elements, and the index where that window starts.
    static int[] maxWindowSum(int[] arr, int k) {
        int sum = 0;
        for (int i = 0; i < k; i++) sum += arr[i];   // the first window, built once
        int best = sum, bestStart = 0;
        for (int right = k; right < arr.length; right++) {
            sum += arr[right] - arr[right - k];       // one element enters, one leaves
            if (sum > best) {
                best = sum;
                bestStart = right - k + 1;
            }
        }
        return new int[] {best, bestStart};
    }

    public static void main(String[] args) {
        int[] arr = {2, 1, 5, 1, 3, 2};
        for (int k : new int[] {3, 2}) {
            int[] r = maxWindowSum(arr, k);
            System.out.println("k = " + k + ": best sum " + r[0] + " (indices " + r[1]
                    + " to " + (r[1] + k - 1) + ")");
        }
    }
}
```

```python
def max_window_sum(arr, k):
    """Largest sum of k consecutive elements, and the index where that window starts."""
    total = sum(arr[:k])                      # the first window, built once
    best, best_start = total, 0
    for right in range(k, len(arr)):
        total += arr[right] - arr[right - k]  # one element enters, one leaves
        if total > best:
            best = total
            best_start = right - k + 1
    return best, best_start


arr = [2, 1, 5, 1, 3, 2]
for k in (3, 2):
    best, start = max_window_sum(arr, k)
    print(f"k = {k}: best sum {best} (indices {start} to {start + k - 1})")
```

```javascript
// Largest sum of k consecutive elements, and the index where that window starts.
function maxWindowSum(arr, k) {
  let sum = 0;
  for (let i = 0; i < k; i++) sum += arr[i]; // the first window, built once
  let best = sum;
  let bestStart = 0;
  for (let right = k; right < arr.length; right++) {
    sum += arr[right] - arr[right - k]; // one element enters, one leaves
    if (sum > best) {
      best = sum;
      bestStart = right - k + 1;
    }
  }
  return [best, bestStart];
}

const arr = [2, 1, 5, 1, 3, 2];
for (const k of [3, 2]) {
  const [best, start] = maxWindowSum(arr, k);
  console.log(`k = ${k}: best sum ${best} (indices ${start} to ${start + k - 1})`);
}
```

```output
k = 3: best sum 9 (indices 2 to 4)
k = 2: best sum 6 (indices 1 to 2)
```

The same slide answers [Maximum Sum Subarray of Size K](/problems/maximum-sum-subarray-of-size-k). [Permutation in String](/problems/permutation-in-string) is a fixed window too: slide a pattern-length window across the text and compare its letter counts with the pattern's.

## A variable-size window: grow, then shrink

The classic is [Longest Substring Without Repeating Characters](/problems/longest-substring-without-repeating-characters), with a count map as the state. The window was valid before `s[right]` arrived, so a count of 2 can only be the newcomer's: shrink until it is 1 again. This is the program's loop, without the last-seen jump:

@figure grow-shrink

## Why shrinking is safe

`left` never moves back, so once it passes an index no later window starts there. That cannot miss the answer because the rule is **monotone**: a repeat-free window stays so when shrunk, and a window with a repeat keeps it when grown:

@figure valid-starts

That is the loop's **invariant**: *after the shrink loop, the window from `left` to `right` is the longest valid window ending at `right`.* Every substring ends somewhere, so the best over all `right` is the best overall. Before writing any window, ask: *does shrinking a valid window keep it valid?* If not, the window is the wrong tool.

### The code

The program records only a strictly longer window, so for "pwwkew" it reports "wke", the first of the two longest answers.

```cpp
#include <iostream>
#include <string>
#include <unordered_map>
using namespace std;

// Longest substring of s with no repeated character, found by grow-then-shrink.
string longestDistinct(const string& s) {
    unordered_map<char, int> count;   // how many times each character is in the window
    int left = 0, bestLeft = 0, bestLen = 0;
    for (int right = 0; right < (int)s.size(); right++) {
        count[s[right]]++;                     // grow: s[right] enters
        while (count[s[right]] > 1) {          // shrink until the window is valid again
            count[s[left]]--;
            left++;
        }
        if (right - left + 1 > bestLen) {      // valid here: record it
            bestLen = right - left + 1;
            bestLeft = left;
        }
    }
    return s.substr(bestLeft, bestLen);
}

int main() {
    for (string s : {"abcabcbb", "bbbbb", "pwwkew"}) {
        string best = longestDistinct(s);
        cout << "\"" << s << "\" -> " << best.size() << " (\"" << best << "\")\n";
    }
    return 0;
}
```

```java
import java.util.HashMap;
import java.util.Map;

public class Main {
    // Longest substring of s with no repeated character, found by grow-then-shrink.
    static String longestDistinct(String s) {
        Map<Character, Integer> count = new HashMap<>(); // how many times each character is in the window
        int left = 0, bestLeft = 0, bestLen = 0;
        for (int right = 0; right < s.length(); right++) {
            char in = s.charAt(right);
            count.merge(in, 1, Integer::sum);            // grow: s[right] enters
            while (count.get(in) > 1) {                  // shrink until the window is valid again
                count.merge(s.charAt(left), -1, Integer::sum);
                left++;
            }
            if (right - left + 1 > bestLen) {            // valid here: record it
                bestLen = right - left + 1;
                bestLeft = left;
            }
        }
        return s.substring(bestLeft, bestLeft + bestLen);
    }

    public static void main(String[] args) {
        for (String s : new String[] {"abcabcbb", "bbbbb", "pwwkew"}) {
            String best = longestDistinct(s);
            System.out.println("\"" + s + "\" -> " + best.length() + " (\"" + best + "\")");
        }
    }
}
```

```python
def longest_distinct(s):
    """Longest substring of s with no repeated character, found by grow-then-shrink."""
    count = {}                     # how many times each character is in the window
    left = best_left = best_len = 0
    for right, ch in enumerate(s):
        count[ch] = count.get(ch, 0) + 1   # grow: s[right] enters
        while count[ch] > 1:               # shrink until the window is valid again
            count[s[left]] -= 1
            left += 1
        if right - left + 1 > best_len:    # valid here: record it
            best_len = right - left + 1
            best_left = left
    return s[best_left:best_left + best_len]


for s in ("abcabcbb", "bbbbb", "pwwkew"):
    best = longest_distinct(s)
    print(f'"{s}" -> {len(best)} ("{best}")')
```

```javascript
// Longest substring of s with no repeated character, found by grow-then-shrink.
function longestDistinct(s) {
  const count = new Map(); // how many times each character is in the window
  let left = 0;
  let bestLeft = 0;
  let bestLen = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    count.set(ch, (count.get(ch) || 0) + 1); // grow: s[right] enters
    while (count.get(ch) > 1) {
      // shrink until the window is valid again
      count.set(s[left], count.get(s[left]) - 1);
      left++;
    }
    if (right - left + 1 > bestLen) {
      // valid here: record it
      bestLen = right - left + 1;
      bestLeft = left;
    }
  }
  return s.slice(bestLeft, bestLeft + bestLen);
}

for (const s of ["abcabcbb", "bbbbb", "pwwkew"]) {
  const best = longestDistinct(s);
  console.log(`"${s}" -> ${best.length} ("${best}")`);
}
```

```output
"abcabcbb" -> 3 ("abc")
"bbbbb" -> 1 ("b")
"pwwkew" -> 3 ("wke")
```

For a small known alphabet, an array of counts indexed by character code (26 or 128 slots) does the map's job faster.

## The shortest window: shrink while it is still valid

Longest-window loops shrink while the window is **invalid**, then record. Shortest-window loops shrink while it is still **valid**, recording each step. [Minimum Size Subarray Sum](/problems/minimum-size-subarray-sum) wants the shortest run of positive numbers summing to at least a target:

@figure shortest-window

That is enough because before every grow the sum is below the target, and with **positive** numbers every window inside a too-small one is too small too — so each start's shortest valid window is recorded before `left` moves past it.

### The code

```cpp
#include <iostream>
#include <utility>
#include <vector>
using namespace std;

// Shortest stretch of positive numbers whose sum is at least target.
// Returns {length, start}, or {0, -1} when no stretch reaches it.
pair<int, int> shortestWithSum(const vector<int>& nums, int target) {
    int left = 0, sum = 0, bestLen = 0, bestStart = -1;
    for (int right = 0; right < (int)nums.size(); right++) {
        sum += nums[right];                               // grow
        while (sum >= target) {                           // valid: record, then try shorter
            if (bestLen == 0 || right - left + 1 < bestLen) {
                bestLen = right - left + 1;
                bestStart = left;
            }
            sum -= nums[left];                            // shrink
            left++;
        }
    }
    return {bestLen, bestStart};
}

int main() {
    vector<int> nums = {2, 3, 1, 2, 4, 3};
    for (int target : {7, 100}) {
        pair<int, int> r = shortestWithSum(nums, target);
        if (r.first == 0) {
            cout << "No subarray reaches " << target << "\n";
        } else {
            cout << "Shortest subarray with sum >= " << target << ": length " << r.first
                 << " (indices " << r.second << " to " << r.second + r.first - 1 << ")\n";
        }
    }
    return 0;
}
```

```java
public class Main {
    // Shortest stretch of positive numbers whose sum is at least target.
    // Returns {length, start}, or {0, -1} when no stretch reaches it.
    static int[] shortestWithSum(int[] nums, int target) {
        int left = 0, sum = 0, bestLen = 0, bestStart = -1;
        for (int right = 0; right < nums.length; right++) {
            sum += nums[right];                               // grow
            while (sum >= target) {                           // valid: record, then try shorter
                if (bestLen == 0 || right - left + 1 < bestLen) {
                    bestLen = right - left + 1;
                    bestStart = left;
                }
                sum -= nums[left];                            // shrink
                left++;
            }
        }
        return new int[] {bestLen, bestStart};
    }

    public static void main(String[] args) {
        int[] nums = {2, 3, 1, 2, 4, 3};
        for (int target : new int[] {7, 100}) {
            int[] r = shortestWithSum(nums, target);
            if (r[0] == 0) {
                System.out.println("No subarray reaches " + target);
            } else {
                System.out.println("Shortest subarray with sum >= " + target + ": length " + r[0]
                        + " (indices " + r[1] + " to " + (r[1] + r[0] - 1) + ")");
            }
        }
    }
}
```

```python
def shortest_with_sum(nums, target):
    """Shortest stretch of positive numbers whose sum is at least target.
    Return (length, start), or (0, -1) when no stretch reaches it."""
    left = total = best_len = 0
    best_start = -1
    for right in range(len(nums)):
        total += nums[right]                  # grow
        while total >= target:                # valid: record, then try shorter
            if best_len == 0 or right - left + 1 < best_len:
                best_len = right - left + 1
                best_start = left
            total -= nums[left]               # shrink
            left += 1
    return best_len, best_start


nums = [2, 3, 1, 2, 4, 3]
for target in (7, 100):
    length, start = shortest_with_sum(nums, target)
    if length == 0:
        print(f"No subarray reaches {target}")
    else:
        print(f"Shortest subarray with sum >= {target}: length {length} "
              f"(indices {start} to {start + length - 1})")
```

```javascript
// Shortest stretch of positive numbers whose sum is at least target.
// Returns [length, start], or [0, -1] when no stretch reaches it.
function shortestWithSum(nums, target) {
  let left = 0;
  let sum = 0;
  let bestLen = 0;
  let bestStart = -1;
  for (let right = 0; right < nums.length; right++) {
    sum += nums[right]; // grow
    while (sum >= target) {
      // valid: record, then try shorter
      if (bestLen === 0 || right - left + 1 < bestLen) {
        bestLen = right - left + 1;
        bestStart = left;
      }
      sum -= nums[left]; // shrink
      left++;
    }
  }
  return [bestLen, bestStart];
}

const nums = [2, 3, 1, 2, 4, 3];
for (const target of [7, 100]) {
  const [length, start] = shortestWithSum(nums, target);
  if (length === 0) {
    console.log(`No subarray reaches ${target}`);
  } else {
    console.log(`Shortest subarray with sum >= ${target}: length ${length} (indices ${start} to ${start + length - 1})`);
  }
}
```

```output
Shortest subarray with sum >= 7: length 2 (indices 4 to 5)
No subarray reaches 100
```

With a count map instead of a sum, the same loop is the heart of [Minimum Window Substring](/problems/minimum-window-substring): grow until the window holds every pattern character, then shrink while it still does.

## Why it is O(n), not O(n²)

Count pointer moves, not loop iterations. `right` moves n times; `left` only moves forwards, so across the **whole run** it moves at most n times. Every element enters once and leaves at most once: at most 2n steps, **amortised** over the run.

## Counting windows: exactly K = at most K − at most (K − 1)

To count subarrays under a monotone rule, add `right - left + 1` after each shrink: every start from `left` to `right` is valid. "Exactly K distinct" is not monotone, so count two things that are, and subtract:

@figure exactly-k

That is [Subarrays with K Different Integers](/problems/subarrays-with-k-different-integers), and the same subtraction solves [Count Number of Nice Subarrays](/problems/count-number-of-nice-subarrays) and [Binary Subarrays With Sum](/problems/binary-subarrays-with-sum).

## When the window does not work: negative numbers

Every argument above leaned on monotonicity, and for sums that needs non-negative numbers. Without it the window fails silently:

@figure negative-fail

When an array can hold negatives, switch tools:

- **"How many subarrays sum to k?"** Prefix sums with a hash map — see [Prefix Sum](/roadmap/prefix-sum) and [Subarray Sum Equals K](/problems/subarray-sum-equals-k).
- **"The shortest subarray with sum at least k?"** Prefix sums with a monotonic deque, as in [Shortest Subarray with Sum at Least K](/problems/shortest-subarray-with-sum-at-least-k).
- **"The largest sum of any subarray?"** Not a window question: [Kadane's algorithm](/roadmap/kadanes-algorithm).

## Other shapes of the same idea

- **At most k bad elements**: [Max Consecutive Ones III](/problems/max-consecutive-ones-iii), the longest window with at most k zeroes.
- **A window of distance k**: [Contains Duplicate II](/problems/contains-duplicate-ii), a set of the last k values.
- **The window's maximum**: [Sliding Window Maximum](/problems/sliding-window-maximum), a deque of decreasing values — the [monotonic stack](/roadmap/monotonic-stack) idea on a queue.

## Time and space complexity

| Approach | Time | Extra space |
| --- | --- | --- |
| Every window of length k, summed from scratch | O(n × k) | O(1) |
| Every substring, checked for repeats | O(n²) to O(n³) | O(alphabet) |
| Fixed-size sliding window | O(n) | O(1) |
| Variable-size window with a running sum | O(n) | O(1) |
| Variable-size window with a count map | O(n) | O(distinct values in the window) |

## How to recognise a sliding window problem

- The answer is a **contiguous** subarray or substring: "consecutive", "substring", "subarray", "in a row".
- It asks for the **longest**, **shortest**, **largest sum** or **number** of such stretches.
- A length k is given: a fixed window. A rule is given: a variable window.
- The rule is **monotone**; for sums, the numbers cannot be negative.

"Subsequence" is a warning sign: it may skip elements, so it is not a window — think [dynamic programming](/roadmap/dynamic-programming).

## Common mistakes

- **A window on negative numbers.** Check the constraints first.
- **Recording at the wrong moment.** Longest: after the shrink loop. Shortest: inside it, before each removal.
- **Off by one.** The window holds `right - left + 1` elements; in a fixed window the leaver is `arr[right - k]`.
- **Not undoing the state exactly.** Each step of `left` must reverse what adding that element did; delete zero counts if you use the map's size.
- **Restarting `left` for every `right`.** That is the O(n²) brute force again.

## Practice in this order

1. [Maximum Sum Subarray of Size K](/problems/maximum-sum-subarray-of-size-k): the fixed window.
2. [Contains Duplicate II](/problems/contains-duplicate-ii): a fixed window whose state is a set.
3. [Longest Substring Without Repeating Characters](/problems/longest-substring-without-repeating-characters): grow, then shrink.
4. [Minimum Size Subarray Sum](/problems/minimum-size-subarray-sum): shrink while valid.
5. [Max Consecutive Ones III](/problems/max-consecutive-ones-iii): "at most k zeroes".
6. [Permutation in String](/problems/permutation-in-string): a fixed window of letter counts.
7. [Longest Repeating Character Replacement](/problems/longest-repeating-character-replacement): a rule built from the top letter.
8. [Minimum Window Substring](/problems/minimum-window-substring): the classic hard one.
9. [Subarrays with K Different Integers](/problems/subarrays-with-k-different-integers): exactly K by subtraction.

Every window problem is on the [sliding window problem list](/challenges/sliding-window). Next on the road: [Prefix Sum](/roadmap/prefix-sum), for the subarray questions a window cannot handle.
