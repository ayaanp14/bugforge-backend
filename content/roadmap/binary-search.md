---
title: Binary Search
stage: binary-search
order: 1
minutes: 13
level: Beginner
hub: binary-search
practice: binary-search, search-insert-position, find-smallest-letter-greater-than-target, find-first-and-last-position, search-a-2d-matrix, find-peak-element, find-minimum-in-rotated-sorted-array, search-in-rotated-sorted-array
updated: 2026-10-03
seo-title: Binary Search: Template, Lower Bound and Rotated Arrays
description: Learn binary search with one template that never loops forever: lower and upper bound, rotated arrays, with code in C++, Java, Python and JavaScript.
question: What is binary search?
answer: Binary search finds a value in a sorted array by repeatedly halving the range that could contain it. It compares the target with the middle element: if the middle is smaller, the target can only lie to its right, otherwise to its left, so half of what remains is discarded at every step. It takes O(log n) time — about 20 comparisons for a million elements — and O(1) extra space.
q: Why does binary search need a sorted array?
a: Sorted order is what lets one comparison rule out half the array: if the middle value is less than the target, every value before it is less too, so none of them can be the target. On unsorted data that conclusion is false and the search can step over the answer. More generally, binary search works on any yes-or-no question whose answers switch from no to yes exactly once along the range.
q: What is the time complexity of binary search?
a: O(log n). Each comparison halves the range, so after k steps about n / 2ᵏ elements remain, which reaches one after roughly log₂ n steps — 20 for a million elements, 30 for a billion. The iterative version needs O(1) extra space; a recursive one uses O(log n) for its call stack.
q: Why write mid = lo + (hi - lo) / 2 instead of (lo + hi) / 2?
a: In C++ and Java, lo + hi can exceed the largest int, 2,147,483,647, when both are large; the sum wraps round to a negative number and the search reads a negative index. lo + (hi − lo) / 2 gives the same midpoint without ever forming the large sum. Python's integers cannot overflow, but the safe form costs nothing there either.
q: What is the difference between lower bound and upper bound?
a: Lower bound is the first index whose value is greater than or equal to the target; upper bound is the first index whose value is strictly greater. The copies of the target sit exactly between them, so the first occurrence is the lower bound, the last is the upper bound minus one, and their difference is the count. When the target is absent, both equal the index where it would be inserted.
q: Does JavaScript have a built-in binary search?
a: No. JavaScript arrays offer indexOf, includes and find, and all three scan from the start in O(n). You write binary search yourself, while C++ has std::lower_bound and std::upper_bound, Java has Arrays.binarySearch and Python has the bisect module.
q: Why does my binary search loop forever?
a: Almost always because an update does not shrink the range — setting lo = mid when mid can equal lo, or hi = mid inside a while (lo <= hi) loop. Use one template consistently. In this lesson's template the range is inclusive, the loop runs while lo <= hi, and every update is mid + 1 or mid − 1, so the range loses at least one element on every pass and the loop must end.
---
Looking up a word in a printed dictionary, nobody reads from page one. You open it near the middle, see that your word comes later, and never look at the first half again. **Binary search** is that habit made exact: in a sorted array, compare the target with the middle element, keep the half that could still contain it, and repeat. It is famous for being easy to get subtly wrong, so this lesson gives you one template and the reason for each of its lines.

## Why a linear scan is too slow

A scan is O(n) per search. With n = 10⁶ sorted prices and q = 10⁵ queries that is up to 10¹¹ steps, a thousand times what a judge allows in a second. It wastes the one fact that matters: in a **sorted** array, one comparison tells you about every element on one side of it.

@figure halving

## The idea: halve the range every step

Keep two indices, `lo` and `hi`, around the part of the array where the target could still be. In this lesson the range is **inclusive**: both `a[lo]` and `a[hi]` are candidates. Look at the middle element:

- **`nums[mid]` equals the target**: found.
- **`nums[mid]` is less than the target**: everything up to `mid` is too small, so `lo = mid + 1`.
- **`nums[mid]` is greater than the target**: everything from `mid` on is too big, so `hi = mid - 1`.

Stop when the range is empty, `lo > hi`: the target is not there.

@walkthrough

## Why it works: the invariant

One sentence stays true on every pass of the loop: **if the target is in the array, its index is between `lo` and `hi`.** It is true at the start, when the range is the whole array, and each update keeps it true, because an update only removes elements that sorted order has proved cannot be the target. The loop also ends: both updates drop `mid` itself, so the range loses at least one element every pass. When it is empty, the invariant says the target lies in an empty range — so it is absent.

@figure invariant

In an interview, be ready to say it out loud: *what is the invariant, and why does the range shrink?*

## One template you can trust

Most binary search bugs come from mixing conventions. This lesson uses one form everywhere:

```text
lo = 0, hi = n - 1             # inclusive: lo..hi are the candidates
ans = n                        # what to return if nothing qualifies
while lo <= hi:                # the range is not empty
    mid = lo + (hi - lo) / 2   # rounded down
    if condition(mid):         # mid qualifies
        ans = mid              # remember it ...
        hi = mid - 1           # ... and look for an earlier one
    else:
        lo = mid + 1           # mid and everything before it fail
return ans
```

It finds the **first index where a condition becomes true**, for any condition that is false for a while and then true to the end. "The value is at least the target" is one such condition; "this capacity is enough", in the next lesson, is another. Each line has a reason:

- **`while (lo <= hi)`**: when `lo == hi`, one candidate is left and still needs checking.
- **`mid + 1` and `mid - 1`, never `mid`**: dropping `mid` is what makes the range shrink. `hi = mid` inside this loop can leave a one-element range unchanged, and the loop spins for ever.
- **`ans`** remembers the best index so far, because a qualifying `mid` may not be the first. At the end `ans` equals `lo`.
- **`lo + (hi - lo) / 2`**: in C++ and Java, `lo + hi` overflows once both pass about 1.07 billion — a bug Java's own library carried for nine years until 2006. In JavaScript, wrap the division in `Math.floor`.

The other popular template — `hi = n`, `while (lo < hi)`, `hi = mid` — is also correct; it is the C++ standard library's `[first, last)` convention. The danger is only in mixing the two.

@figure lower-bound

## Lower bound, upper bound and the first and last occurrence

Two boundaries answer almost every question about a value in a sorted array: the **lower bound**, the first index with `nums[i] >= target`, and the **upper bound**, the first with `nums[i] > target`. Only the condition changes; the loop does not.

@figure bounds

### The code

The program prints the first and last position and the count for values that are present, and the insert position for values that are not.

```cpp
#include <iostream>
#include <vector>
using namespace std;

// First index i with a[i] >= target, or n when there is none.
// The live range is lo..hi with both ends included.
int lowerBound(const vector<int>& a, int target) {
    int lo = 0, hi = (int)a.size() - 1;
    int ans = (int)a.size();             // the answer if no value is big enough
    while (lo <= hi) {                   // the range lo..hi is not empty
        int mid = lo + (hi - lo) / 2;    // the middle, without overflowing
        if (a[mid] >= target) {
            ans = mid;                   // mid qualifies; look for an earlier one
            hi = mid - 1;
        } else {
            lo = mid + 1;                // mid and everything before it are too small
        }
    }
    return ans;
}

// First index i with a[i] > target, or n when there is none.
int upperBound(const vector<int>& a, int target) {
    int lo = 0, hi = (int)a.size() - 1;
    int ans = (int)a.size();
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] > target) {           // the only change: > instead of >=
            ans = mid;
            hi = mid - 1;
        } else {
            lo = mid + 1;
        }
    }
    return ans;
}

int main() {
    vector<int> nums = {1, 3, 3, 3, 5, 8, 8, 10};
    cout << "nums:";
    for (int x : nums) cout << " " << x;
    cout << "\n";
    for (int target : {3, 8, 4, 0, 11}) {
        int first = lowerBound(nums, target);
        int last = upperBound(nums, target) - 1;
        if (first < (int)nums.size() && nums[first] == target) {
            cout << "target " << target << ": first " << first << ", last " << last
                 << ", count " << last - first + 1 << "\n";
        } else {
            cout << "target " << target << ": absent, insert at " << first << "\n";
        }
    }
    return 0;
}
```

```java
public class Main {
    // First index i with a[i] >= target, or n when there is none.
    // The live range is lo..hi with both ends included.
    static int lowerBound(int[] a, int target) {
        int lo = 0, hi = a.length - 1;
        int ans = a.length;                  // the answer if no value is big enough
        while (lo <= hi) {                   // the range lo..hi is not empty
            int mid = lo + (hi - lo) / 2;    // the middle, without overflowing
            if (a[mid] >= target) {
                ans = mid;                   // mid qualifies; look for an earlier one
                hi = mid - 1;
            } else {
                lo = mid + 1;                // mid and everything before it are too small
            }
        }
        return ans;
    }

    // First index i with a[i] > target, or n when there is none.
    static int upperBound(int[] a, int target) {
        int lo = 0, hi = a.length - 1;
        int ans = a.length;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (a[mid] > target) {           // the only change: > instead of >=
                ans = mid;
                hi = mid - 1;
            } else {
                lo = mid + 1;
            }
        }
        return ans;
    }

    public static void main(String[] args) {
        int[] nums = {1, 3, 3, 3, 5, 8, 8, 10};
        StringBuilder line = new StringBuilder("nums:");
        for (int x : nums) line.append(" ").append(x);
        System.out.println(line);
        for (int target : new int[] {3, 8, 4, 0, 11}) {
            int first = lowerBound(nums, target);
            int last = upperBound(nums, target) - 1;
            if (first < nums.length && nums[first] == target) {
                System.out.println("target " + target + ": first " + first + ", last " + last
                        + ", count " + (last - first + 1));
            } else {
                System.out.println("target " + target + ": absent, insert at " + first);
            }
        }
    }
}
```

```python
def lower_bound(a, target):
    """First index i with a[i] >= target, or len(a) when there is none.
    The live range is lo..hi with both ends included."""
    lo, hi = 0, len(a) - 1
    ans = len(a)                     # the answer if no value is big enough
    while lo <= hi:                  # the range lo..hi is not empty
        mid = lo + (hi - lo) // 2    # the middle (Python ints never overflow)
        if a[mid] >= target:
            ans = mid                # mid qualifies; look for an earlier one
            hi = mid - 1
        else:
            lo = mid + 1             # mid and everything before it are too small
    return ans


def upper_bound(a, target):
    """First index i with a[i] > target, or len(a) when there is none."""
    lo, hi = 0, len(a) - 1
    ans = len(a)
    while lo <= hi:
        mid = lo + (hi - lo) // 2
        if a[mid] > target:          # the only change: > instead of >=
            ans = mid
            hi = mid - 1
        else:
            lo = mid + 1
    return ans


nums = [1, 3, 3, 3, 5, 8, 8, 10]
print("nums:", *nums)
for target in (3, 8, 4, 0, 11):
    first = lower_bound(nums, target)
    last = upper_bound(nums, target) - 1
    if first < len(nums) and nums[first] == target:
        print(f"target {target}: first {first}, last {last}, count {last - first + 1}")
    else:
        print(f"target {target}: absent, insert at {first}")
```

```javascript
// First index i with a[i] >= target, or a.length when there is none.
// The live range is lo..hi with both ends included.
function lowerBound(a, target) {
  let lo = 0;
  let hi = a.length - 1;
  let ans = a.length; // the answer if no value is big enough
  while (lo <= hi) {
    // the range lo..hi is not empty
    const mid = lo + Math.floor((hi - lo) / 2); // the middle, rounded down
    if (a[mid] >= target) {
      ans = mid; // mid qualifies; look for an earlier one
      hi = mid - 1;
    } else {
      lo = mid + 1; // mid and everything before it are too small
    }
  }
  return ans;
}

// First index i with a[i] > target, or a.length when there is none.
function upperBound(a, target) {
  let lo = 0;
  let hi = a.length - 1;
  let ans = a.length;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (a[mid] > target) {
      // the only change: > instead of >=
      ans = mid;
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }
  }
  return ans;
}

const nums = [1, 3, 3, 3, 5, 8, 8, 10];
console.log(`nums: ${nums.join(" ")}`);
for (const target of [3, 8, 4, 0, 11]) {
  const first = lowerBound(nums, target);
  const last = upperBound(nums, target) - 1;
  if (first < nums.length && nums[first] === target) {
    console.log(`target ${target}: first ${first}, last ${last}, count ${last - first + 1}`);
  } else {
    console.log(`target ${target}: absent, insert at ${first}`);
  }
}
```

```output
nums: 1 3 3 3 5 8 8 10
target 3: first 1, last 3, count 3
target 8: first 5, last 6, count 2
target 4: absent, insert at 4
target 0: absent, insert at 0
target 11: absent, insert at 8
```

Check `first < n` before reading `nums[first]`: when every value is smaller than the target, the lower bound is one past the end. The same program solves [Find First and Last Position of Element in Sorted Array](/problems/find-first-and-last-position), and [Binary Search](/problems/binary-search) is a lower bound plus one equality check.

## Search in a rotated sorted array

A **rotated** sorted array is a sorted array cut at some point with the two pieces swapped: `[0, 1, 2, 4, 5, 6, 7]` becomes `[4, 5, 6, 7, 0, 1, 2]`. One fact survives: **cut it anywhere, and at least one side is sorted.** If `nums[lo] <= nums[mid]`, `lo..mid` has no drop in it; otherwise `mid..hi` is the sorted side, and a sorted side tells you exactly whether it holds the target.

@figure rotated

Finding the **minimum**, where the rotation happened, is the template with a different condition: with distinct values, "`nums[i] <= nums[n - 1]`" is false on the left ramp and true on the right one.

@figure rotated-min

```cpp
#include <iostream>
#include <vector>
using namespace std;

// Index of the smallest value in a rotated sorted array of distinct values:
// the first index whose value is <= the last value.
int findMinIndex(const vector<int>& a) {
    int lo = 0, hi = (int)a.size() - 1;
    int ans = hi;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] <= a.back()) {        // mid is in the lower, rotated-in part
            ans = mid;
            hi = mid - 1;
        } else {
            lo = mid + 1;                // mid is in the upper part: minimum is right of it
        }
    }
    return ans;
}

// Index of target in a rotated sorted array of distinct values, or -1.
int searchRotated(const vector<int>& a, int target) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == target) return mid;
        if (a[lo] <= a[mid]) {                                 // lo..mid is sorted
            if (a[lo] <= target && target < a[mid]) hi = mid - 1;
            else lo = mid + 1;
        } else {                                               // mid..hi is sorted
            if (a[mid] < target && target <= a[hi]) lo = mid + 1;
            else hi = mid - 1;
        }
    }
    return -1;
}

int main() {
    vector<int> nums = {4, 5, 6, 7, 0, 1, 2};
    cout << "nums:";
    for (int x : nums) cout << " " << x;
    cout << "\n";
    int m = findMinIndex(nums);
    cout << "minimum " << nums[m] << " at index " << m << "\n";
    for (int target : {0, 5, 3}) {
        int i = searchRotated(nums, target);
        if (i == -1) cout << "target " << target << ": not found\n";
        else cout << "target " << target << ": found at index " << i << "\n";
    }
    return 0;
}
```

```java
public class Main {
    // Index of the smallest value in a rotated sorted array of distinct values:
    // the first index whose value is <= the last value.
    static int findMinIndex(int[] a) {
        int lo = 0, hi = a.length - 1;
        int ans = hi;
        int last = a[a.length - 1];
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (a[mid] <= last) {            // mid is in the lower, rotated-in part
                ans = mid;
                hi = mid - 1;
            } else {
                lo = mid + 1;                // mid is in the upper part: minimum is right of it
            }
        }
        return ans;
    }

    // Index of target in a rotated sorted array of distinct values, or -1.
    static int searchRotated(int[] a, int target) {
        int lo = 0, hi = a.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (a[mid] == target) return mid;
            if (a[lo] <= a[mid]) {                                 // lo..mid is sorted
                if (a[lo] <= target && target < a[mid]) hi = mid - 1;
                else lo = mid + 1;
            } else {                                               // mid..hi is sorted
                if (a[mid] < target && target <= a[hi]) lo = mid + 1;
                else hi = mid - 1;
            }
        }
        return -1;
    }

    public static void main(String[] args) {
        int[] nums = {4, 5, 6, 7, 0, 1, 2};
        StringBuilder line = new StringBuilder("nums:");
        for (int x : nums) line.append(" ").append(x);
        System.out.println(line);
        int m = findMinIndex(nums);
        System.out.println("minimum " + nums[m] + " at index " + m);
        for (int target : new int[] {0, 5, 3}) {
            int i = searchRotated(nums, target);
            if (i == -1) System.out.println("target " + target + ": not found");
            else System.out.println("target " + target + ": found at index " + i);
        }
    }
}
```

```python
def find_min_index(a):
    """Index of the smallest value in a rotated sorted list of distinct values:
    the first index whose value is <= the last value."""
    lo, hi = 0, len(a) - 1
    ans = hi
    while lo <= hi:
        mid = lo + (hi - lo) // 2
        if a[mid] <= a[-1]:          # mid is in the lower, rotated-in part
            ans = mid
            hi = mid - 1
        else:
            lo = mid + 1             # mid is in the upper part: minimum is right of it
    return ans


def search_rotated(a, target):
    """Index of target in a rotated sorted list of distinct values, or -1."""
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = lo + (hi - lo) // 2
        if a[mid] == target:
            return mid
        if a[lo] <= a[mid]:                          # lo..mid is sorted
            if a[lo] <= target < a[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:                                        # mid..hi is sorted
            if a[mid] < target <= a[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1


nums = [4, 5, 6, 7, 0, 1, 2]
print("nums:", *nums)
m = find_min_index(nums)
print(f"minimum {nums[m]} at index {m}")
for target in (0, 5, 3):
    i = search_rotated(nums, target)
    if i == -1:
        print(f"target {target}: not found")
    else:
        print(f"target {target}: found at index {i}")
```

```javascript
// Index of the smallest value in a rotated sorted array of distinct values:
// the first index whose value is <= the last value.
function findMinIndex(a) {
  let lo = 0;
  let hi = a.length - 1;
  let ans = hi;
  const last = a[a.length - 1];
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (a[mid] <= last) {
      // mid is in the lower, rotated-in part
      ans = mid;
      hi = mid - 1;
    } else {
      lo = mid + 1; // mid is in the upper part: minimum is right of it
    }
  }
  return ans;
}

// Index of target in a rotated sorted array of distinct values, or -1.
function searchRotated(a, target) {
  let lo = 0;
  let hi = a.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (a[mid] === target) return mid;
    if (a[lo] <= a[mid]) {
      // lo..mid is sorted
      if (a[lo] <= target && target < a[mid]) hi = mid - 1;
      else lo = mid + 1;
    } else {
      // mid..hi is sorted
      if (a[mid] < target && target <= a[hi]) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}

const nums = [4, 5, 6, 7, 0, 1, 2];
console.log(`nums: ${nums.join(" ")}`);
const m = findMinIndex(nums);
console.log(`minimum ${nums[m]} at index ${m}`);
for (const target of [0, 5, 3]) {
  const i = searchRotated(nums, target);
  if (i === -1) console.log(`target ${target}: not found`);
  else console.log(`target ${target}: found at index ${i}`);
}
```

```output
nums: 4 5 6 7 0 1 2
minimum 0 at index 4
target 0: found at index 4
target 5: found at index 1
target 3: not found
```

These are [Search in Rotated Sorted Array](/problems/search-in-rotated-sorted-array) and [Find Minimum in Rotated Sorted Array](/problems/find-minimum-in-rotated-sorted-array). Both need **distinct** values: with duplicates, `nums[lo] == nums[mid] == nums[hi]` hides the sorted half, and shrinking both ends by one makes the worst case O(n).

## Other shapes of the same search

Once binary search means "find where a condition flips", it appears beyond sorted arrays:

- **A sorted matrix**, read row by row, is one sorted array: index `k` is cell `(k / n, k % n)`. See [Search a 2D Matrix](/problems/search-a-2d-matrix) and the [matrix lesson](/roadmap/matrix).
- **Letters**: [Find Smallest Letter Greater Than Target](/problems/find-smallest-letter-greater-than-target) is an upper bound that wraps to the first letter.
- **A peak**: in [Find Peak Element](/problems/find-peak-element) nothing is sorted, yet if `nums[mid + 1]` is larger, the climb to the right must end at a peak.
- **The answer itself**: "the smallest capacity that works" is searched over candidate answers — the next lesson, [binary search on the answer](/roadmap/binary-search-on-answer).

## The library versions

| Language | Call | Returns |
| --- | --- | --- |
| C++ | `std::lower_bound` / `std::upper_bound` | iterator to the first element `>= x` / `> x`, or `end()` |
| Java | `Arrays.binarySearch(arr, x)` | an index of `x` (any copy), otherwise `-(insertion point) - 1` |
| Python | `bisect.bisect_left` / `bisect.bisect_right` | lower bound / upper bound |
| JavaScript | none | write the template; `indexOf` scans in O(n) |

Java does not promise *which* copy it finds, so first-or-last questions need the template.

## Time and space complexity

| Approach | Time per search | Extra space |
| --- | --- | --- |
| Linear scan | O(n) | O(1) |
| Binary search, iterative | O(log n) | O(1) |
| Binary search, recursive | O(log n) | O(log n) |
| Sort once, then q searches | O(n log n + q log n) | depends on the sort |
| Hash set lookups | O(1) on average | O(n) |

The price is the precondition: sorting costs O(n log n) (see [sorting algorithms](/roadmap/sorting-algorithms)), so for one search on unsorted data a scan is cheaper. A [hash set](/roadmap/hashing) answers "is it present?" faster, but not "what is the first value at least x?".

## How to recognise a binary search problem

- The input is **sorted**, and the question is about a value, a position or a count.
- The statement demands **O(log n)** time.
- It asks for the **first** or **last** position of something, or the smallest value **at least** some target.
- A yes-or-no question over a range of values switches **exactly once** — the sign that you can search the answer.

## Common mistakes

- **Mixing templates**: `hi = mid` inside `while (lo <= hi)` never shrinks a one-element range.
- **`(lo + hi) / 2` with ints** overflows past 2,147,483,647; in JavaScript an index of 3.5 reads `undefined`.
- **Stopping at the first match** when the question wants the first or last occurrence.
- **Reading past the end**: the lower bound can be `n`.
- **Searching unsorted data**, which returns wrong answers without any error.

## Practice in this order

1. [Binary Search](/problems/binary-search): the exact-match search.
2. [Search Insert Position](/problems/search-insert-position): the lower bound and nothing else.
3. [Find Smallest Letter Greater Than Target](/problems/find-smallest-letter-greater-than-target): an upper bound with a wrap-around.
4. [Find First and Last Position of Element in Sorted Array](/problems/find-first-and-last-position): both bounds.
5. [Search a 2D Matrix](/problems/search-a-2d-matrix): one sorted array in disguise.
6. [Find Peak Element](/problems/find-peak-element): a condition you have to justify.
7. [Find Minimum in Rotated Sorted Array](/problems/find-minimum-in-rotated-sorted-array): the template with an "at most the last value" condition.
8. [Search in Rotated Sorted Array](/problems/search-in-rotated-sorted-array): the sorted-half argument.

The [binary search problem list](/challenges/binary-search) has every problem in the catalogue that uses the technique. Next, [binary search on the answer](/roadmap/binary-search-on-answer), where the array disappears and you search the answer itself.
