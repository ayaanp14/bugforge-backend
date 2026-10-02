---
title: Sliding Window Technique
stage: sliding-window
order: 1
minutes: 22
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
Many array and string questions ask about a **contiguous** stretch of the input: the largest sum of k consecutive numbers, the longest substring with no repeated letter, the shortest run of numbers whose total reaches a target. The obvious solution examines every stretch separately and recomputes each one from scratch. The sliding window technique notices that neighbouring stretches share almost all of their elements. It keeps one stretch, the **window**, and updates what it knows about it as the edges move — one element in, one element out — so each step costs O(1) instead of O(k).

This lesson covers the two kinds of window, fixed and variable, the property that makes shrinking a window safe, why the technique is O(n) despite its loop inside a loop, the counting trick for "exactly K" questions, and the one situation — negative numbers — where it quietly gives wrong answers. It builds on [Two Pointers](/roadmap/two-pointers): a window is two pointers moving in the same direction with something tracked between them. Every example is shown in C++, Java, Python and JavaScript.

## Why recomputing every window is too slow

Start with the simplest question: *given an array and a number k, what is the largest sum of k consecutive elements?* The brute force tries every starting point and adds up the k elements from there.

```text
best = -infinity
for start in 0 .. n-k:
    sum = 0
    for i in start .. start+k-1:
        sum = sum + arr[i]
    best = max(best, sum)
```

There are n − k + 1 windows and each costs k additions. With n = 100,000 and k = 50,000 that is about 50,000 × 50,000 = 2.5 × 10⁹ additions, far beyond the hundred million or so simple operations a judge allows in a second. Questions without a fixed length are worse: the longest substring with no repeated character has about n²/2 substrings to try, and checking each one for repeats costs up to another n.

The waste is easy to see. The window starting at index 0 and the window starting at index 1 share k − 1 elements, and the brute force adds those k − 1 elements up again from nothing. The sliding window adds each element once.

## The idea: slide the window instead of rebuilding it

Keep a running sum of the current window. To move the window one step to the right, one element enters on the right and one leaves on the left, so the new sum is the old sum plus the newcomer minus the leaver.

```text
 index:    0   1   2   3   4   5
 arr:    [ 2,  1,  5,  1,  3,  2 ]          k = 3

          [ 2   1   5 ]                     sum = 2 + 1 + 5  = 8
              [ 1   5   1 ]                 sum = 8 - 2 + 1  = 7
                  [ 5   1   3 ]             sum = 7 - 1 + 3  = 9   best
                      [ 1   3   2 ]         sum = 9 - 5 + 2  = 6
```

That is a **fixed-size window**. Many questions do not give the length. They give a rule the window must obey ("no repeated character", "sum at least 7") and ask for the longest or shortest window that obeys it. A **variable-size window** handles those with two pointers, `left` and `right`, where the window is everything from `left` to `right` inclusive:

- **Grow.** Move `right` one step and add the new element to the window's state: a sum, a count of characters, a number of zeroes.
- **Shrink.** While the window breaks the rule, remove the element at `left` from the state and move `left` one step.
- **Record.** Once the window obeys the rule again, it is a candidate answer: compare its length with the best so far.

The state is whatever lets you check the rule in O(1): a running sum for a rule about sums, or a **count map** — each value mapped to how many times it is in the window — for rules about the window's contents. The figure below runs a variable window over "pwwkew" to find the longest substring without a repeated character. It uses a small refinement of the shrink step: a map of where each character was last seen lets `left` jump straight past the repeat instead of stepping one index at a time.

@walkthrough

## A fixed-size window

The fixed window is the easiest place to start because there is nothing to decide: build the first window once, then slide it to the end. The only subtlety is the indices. When `right` is the index entering, the element leaving is `arr[right - k]`, and the window now starts at `right - k + 1`.

### Dry run

The array `[2, 1, 5, 1, 3, 2]` with k = 3:

| right | enters | leaves | sum | window | best |
| --- | --- | --- | --- | --- | --- |
| 0 to 2 | 2, 1, 5 | — | 8 | 0 to 2 | 8 |
| 3 | 1 | 2 | 7 | 1 to 3 | 8 |
| 4 | 3 | 1 | 9 | 2 to 4 | 9 |
| 5 | 2 | 5 | 6 | 3 to 5 | 9 |

Every window after the first costs one addition and one subtraction, whatever the value of k.

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

The same slide answers [Maximum Sum Subarray of Size K](/problems/maximum-sum-subarray-of-size-k) directly. [Permutation in String](/problems/permutation-in-string) is a fixed window too: slide a window as long as the pattern across the text, keep a count of each letter inside it, and compare those counts with the pattern's.

## A variable-size window: grow, then shrink

Now the classic: *the length of the longest substring of s with no repeated character*, which is [Longest Substring Without Repeating Characters](/problems/longest-substring-without-repeating-characters). The rule is "no character appears twice", and the state is a count map from character to how many times it is in the window.

Every iteration of the outer loop moves `right` one step and adds `s[right]` to the map. If that makes its count 2, the window is broken — and only `s[right]` can have broken it. The window was valid a moment ago, so the one character that can now appear twice is the one that just arrived. The inner loop therefore removes characters from the left until that one count is back to 1. Then the window is valid again, and its length `right - left + 1` is a candidate.

## Why shrinking is safe

The loop never moves `left` backwards. That looks like a gamble: once `left` has passed an index, no later window can start there. Why can it not miss the answer?

The reason is a property of the rule, not of the code. "No repeated character" is **monotone**: if a window has no repeats, every smaller window inside it has none either; and if a window has a repeat, every larger window around it has that repeat too. Now fix a value of `right` and ask for the longest valid window that ends there. It starts at the smallest start that makes the window valid; call that start L(right).

When `right` moves one step on, L can only stay where it is or move forward. Suppose the best window ending at `right + 1` started before L(right). Drop its last character and you have a window ending at `right`, starting before L(right) — and that window is valid, because it sits inside a valid one. That contradicts L(right) being the smallest valid start. So the best starts never move backwards, and the code may carry `left` forward from one `right` to the next instead of searching again from index 0.

That gives the loop its **invariant**: *after the shrink loop, the window from `left` to `right` is the longest valid window that ends at `right`.* Every substring ends somewhere, so the best over all values of `right` is the best over all substrings. Shrinking only ever discards starts that cannot pair with this `right` or with any later one.

Ask the monotone question before you write any window: *does making a valid window smaller keep it valid?* If the answer is no — as with sums over arrays that hold negative numbers, below — the window is the wrong tool, however natural it looks.

### Dry run

The search on "abcabcbb", one row per step of `right`:

| right | char | shrink | window | length | best |
| --- | --- | --- | --- | --- | --- |
| 0 | a | — | a | 1 | 1 |
| 1 | b | — | ab | 2 | 2 |
| 2 | c | — | abc | 3 | 3 |
| 3 | a | drop a | bca | 3 | 3 |
| 4 | b | drop b | cab | 3 | 3 |
| 5 | c | drop c | abc | 3 | 3 |
| 6 | b | drop a, b | cb | 2 | 3 |
| 7 | b | drop c, b | b | 1 | 3 |

At steps 6 and 7 the repeated letter is not at the left edge, so the window drops two characters to get past it. That is the work the last-seen jump in the figure saves. It changes the constant, not the O(n).

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

When the alphabet is small and known, an array of counts indexed by character code (26 for lowercase letters, 128 for ASCII) does the same job as the map and is faster.

## The shortest window: shrink while it is still valid

Longest-window questions shrink while the window is **invalid** and record afterwards. Shortest-window questions turn this around: they shrink while the window is still **valid**, recording at every step, because each step makes a valid window shorter.

Take [Minimum Size Subarray Sum](/problems/minimum-size-subarray-sum): *given an array of positive integers and a target, find the length of the shortest contiguous subarray whose sum is at least the target.* Grow until the sum reaches the target. The window is then a candidate, so record it and drop the leftmost element to see whether a shorter window still works. Keep dropping until the sum falls below the target, then grow again.

Why is that enough? Before every grow step the sum is below the target, because the shrink loop ran until it was. With **positive** numbers, every window inside a window whose sum is too small has a sum that is too small as well. So when the sum first reaches the target at `right`, no window that starts at `left` or later and ends before `right` reaches it. The window from `left` to `right` is the shortest valid window starting at `left`, and the code records it before dropping `left`. Every start that has any valid window gets its shortest one recorded, so the minimum of those records is the answer.

### Dry run

nums = `[2, 3, 1, 2, 4, 3]`, target = 7:

| right | enters | sum after growing | shrinking | best length |
| --- | --- | --- | --- | --- |
| 0 | 2 | 2 | — | none |
| 1 | 3 | 5 | — | none |
| 2 | 1 | 6 | — | none |
| 3 | 2 | 8 | record 0 to 3, drop 2, sum 6 | 4 |
| 4 | 4 | 10 | record 1 to 4, drop 3, sum 7; record 2 to 4, drop 1, sum 6 | 3 |
| 5 | 3 | 9 | record 3 to 5, drop 2, sum 7; record 4 to 5, drop 4, sum 3 | 2 |

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

The same shrink-while-valid loop, with a count map in place of the sum, is the heart of [Minimum Window Substring](/problems/minimum-window-substring): grow until the window holds every character of the pattern, then shrink while it still does.

## Why it is O(n), not O(n²)

A loop inside a loop usually means O(n²), so count pointer moves instead of loop iterations. `right` moves n times. `left` moves only forwards and never passes `right + 1`, so across the **whole run** it moves at most n times, however those moves are spread over the outer iterations. Each move does O(1) work on the state, so the total is at most 2n steps: O(n). Put another way, every element **enters** the window once and **leaves** it at most once. One step of `right` can trigger many removals, but they add up to at most n over the run; spreading the cost of an occasional long inner loop over the cheap iterations around it is called **amortised** analysis.

## Counting windows: exactly K = at most K − at most (K − 1)

Some questions ask *how many* subarrays satisfy a rule. When the rule is monotone, the window counts them as easily as it finds the longest. After the shrink loop, the window from `left` to `right` is valid, so every window that ends at `right` and starts anywhere from `left` to `right` is valid too, because each sits inside it. That is `right - left + 1` windows, added once for every value of `right`.

"Exactly K distinct values" is not monotone. Shrinking a window with exactly K distinct values can drop it to K − 1, and growing it can push it to K + 1, so there is no single `left` that separates the good starts from the bad ones. The trick is to count something that is monotone, twice, and subtract:

```text
exactly(K) = atMost(K) - atMost(K - 1)

atMost(K):
    count = 0, left = 0, an empty count map
    for right in 0 .. n-1:
        add nums[right] to the map
        while the map holds more than K distinct values:
            remove nums[left] from the map, left = left + 1
        count = count + (right - left + 1)     # every start from left to right is valid
    return count
```

For nums = [1, 2, 1, 2, 3] and K = 2, atMost(2) adds 1 + 2 + 3 + 4 + 2 = 12 and atMost(1) adds 1 + 1 + 1 + 1 + 1 = 5, so exactly 12 − 5 = 7 subarrays hold two distinct values. The subtraction works because a subarray with at most K distinct values has either exactly K or at most K − 1, never both. That is [Subarrays with K Different Integers](/problems/subarrays-with-k-different-integers), and the same subtraction solves [Count Number of Nice Subarrays](/problems/count-number-of-nice-subarrays) and [Binary Subarrays With Sum](/problems/binary-subarrays-with-sum).

## When the window does not work: negative numbers

Every argument above leaned on monotonicity, and for sums that needs the numbers to be non-negative. Without it the window fails silently. Take nums = [−1, 4] and target 4. The window grows to the whole array, its sum is 3, and since the shrink loop only runs once the sum is big enough, it never runs: the code reports that no subarray reaches 4. Yet [4] alone does. Dropping the −1 would have *raised* the sum, and that is precisely the move the shrink rule never makes.

When an array can hold negative numbers, switch tools:

- **"How many subarrays sum to k?"** Use prefix sums with a hash map of how often each prefix sum has been seen; see [Prefix Sum](/roadmap/prefix-sum) and [Subarray Sum Equals K](/problems/subarray-sum-equals-k).
- **"The shortest subarray with sum at least k?"** Use prefix sums with a monotonic deque, as in [Shortest Subarray with Sum at Least K](/problems/shortest-subarray-with-sum-at-least-k).
- **"The largest sum of any subarray?"** That is not a window question at all; it is [Kadane's algorithm](/roadmap/kadanes-algorithm).

## Other shapes of the same idea

- **At most k bad elements.** [Max Consecutive Ones III](/problems/max-consecutive-ones-iii) asks for the longest run of 1s if you may flip k zeroes. Read it as "the longest window with at most k zeroes" and it is the grow-then-shrink loop with a zero counter.
- **The window's most common element.** [Longest Repeating Character Replacement](/problems/longest-repeating-character-replacement) keeps a window valid while its length minus the count of its most frequent letter is at most k: those are the letters you would have to replace.
- **A window of distance k.** [Contains Duplicate II](/problems/contains-duplicate-ii) keeps a set of the last k values; a value already in the set is a duplicate within distance k.
- **The window's maximum.** A running sum cannot tell you the largest value in the window, because when the maximum leaves you no longer know the next largest. [Sliding Window Maximum](/problems/sliding-window-maximum) keeps a deque of indices whose values decrease from front to back, which yields every window's maximum in O(1) amortised — the [monotonic stack](/roadmap/monotonic-stack) idea applied to a queue.

## Time and space complexity

| Approach | Time | Extra space |
| --- | --- | --- |
| Every window of length k, summed from scratch | O(n × k) | O(1) |
| Every substring, checked for repeats | O(n²) to O(n³) | O(alphabet) |
| Fixed-size sliding window | O(n) | O(1) |
| Variable-size window with a running sum | O(n) | O(1) |
| Variable-size window with a count map | O(n) | O(distinct values in the window) |

The space column is the window's state: two indices and a sum, or a map with one entry per distinct value inside the window. For lowercase letters that is at most 26 entries, which is O(1).

## How to recognise a sliding window problem

- The answer is a **contiguous** subarray or substring: "consecutive", "substring", "subarray", "window", "in a row".
- The question asks for the **longest**, the **shortest**, the **largest sum** or the **number** of such stretches.
- A length k is given: a fixed window. A rule is given instead ("at most k distinct", "sum at least target", "no repeats"): a variable window.
- The rule is **monotone**: a valid window stays valid when shrunk. For sums, check that the numbers cannot be negative.
- The window's state can be updated in O(1) when one element enters or leaves.

"Subsequence" is a warning sign. A subsequence may skip elements, so it is not a window; questions about subsequences usually want [dynamic programming](/roadmap/dynamic-programming) or two pointers walking two strings.

## Common mistakes

- **Using a window on negative numbers.** The shrink rule assumes that removing an element moves the sum one way. Check the constraints for negative values before reaching for a window.
- **Recording at the wrong moment.** Longest-window loops record *after* the shrink loop, when the window is valid again; shortest-window loops record *inside* it, before each removal. Swap them and you record invalid windows or miss the best one.
- **Off-by-one in the length.** The window from `left` to `right` inclusive holds `right - left + 1` elements, and in a fixed window the element leaving is `arr[right - k]`, not `arr[right - k + 1]`.
- **Not undoing the state exactly.** Every step of `left` must reverse what adding that element did: decrement its count, subtract it from the sum. A zero count left in the map is harmless, unless the code counts distinct values with the map's size — then delete the key.
- **Restarting `left` for every `right`.** That turns the O(n) window back into the O(n²) brute force. The monotone property is your licence to carry `left` forward.

## Practice in this order

Start with the fixed window, then the two kinds of variable window, then the counting trick:

1. [Maximum Sum Subarray of Size K](/problems/maximum-sum-subarray-of-size-k): the fixed window, exactly as above.
2. [Contains Duplicate II](/problems/contains-duplicate-ii): a fixed window whose state is a set.
3. [Longest Substring Without Repeating Characters](/problems/longest-substring-without-repeating-characters): grow, then shrink, with a count map.
4. [Minimum Size Subarray Sum](/problems/minimum-size-subarray-sum): the shortest window, shrinking while it stays valid.
5. [Max Consecutive Ones III](/problems/max-consecutive-ones-iii): rephrase the question as "at most k zeroes".
6. [Permutation in String](/problems/permutation-in-string): a fixed window compared by letter counts.
7. [Longest Repeating Character Replacement](/problems/longest-repeating-character-replacement): a validity rule built from the window's most common letter.
8. [Minimum Window Substring](/problems/minimum-window-substring): the shortest window with a count map, the classic hard one.
9. [Subarrays with K Different Integers](/problems/subarrays-with-k-different-integers): exactly K as at most K minus at most K − 1.

The [sliding window problem list](/challenges/sliding-window) has every problem in the catalogue that uses the technique, from easy to hard. Next on the road is [Prefix Sum](/roadmap/prefix-sum), the tool for the subarray questions a window cannot handle.
