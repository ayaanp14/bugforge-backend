---
title: Binary Search
stage: binary-search
order: 1
minutes: 22
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
Looking up a word in a printed dictionary, nobody reads from page one. You open it near the middle, see that your word comes later, and never look at the first half again. **Binary search** is that habit made exact: in a sorted array, compare the target with the middle element, keep the half that could still contain it, and repeat. Each comparison throws away half of what is left, so a million elements take about twenty comparisons.

The idea fits in one sentence, yet binary search is famous for being easy to get subtly wrong — a boundary off by one, a loop that never ends, an overflow that waits years to fire. This lesson gives you one template, explains why each of its lines is there, and then uses it for the questions interviews actually ask: the first and last position of a value, where a value would be inserted, and searching an array that has been rotated. Every example is shown in C++, Java, Python and JavaScript.

## Why a linear scan is too slow

Scanning an array for a value checks every element in the worst case: O(n) per search. That is fine once. It is not fine when the same sorted data is searched many times. A placement question might give you n = 10⁶ sorted prices and q = 10⁵ queries; scanning for each query costs up to 10⁶ × 10⁵ = 10¹¹ steps, a thousand times what a judge allows in a second. Binary search answers each query in at most 20 comparisons, so all 10⁵ queries cost about two million steps.

The scan wastes the one fact that matters: the array is **sorted**. A single comparison with a sorted array tells you not just about that element but about every element on one side of it. Binary search is how you collect that information.

## The idea: halve the range every step

Keep two indices, `lo` and `hi`, that mark the part of the array where the target could still be. In this lesson the range is **inclusive**: both `a[lo]` and `a[hi]` are still candidates. Look at the element in the middle:

```text
 index:   0   1   2   3   4   5   6   7   8
 nums:  [ 2,  5,  8, 12, 16, 23, 38, 56, 72 ]      target = 23
          ^               ^               ^
         lo              mid             hi        nums[4] = 16 < 23: drop 0..4
                              ^   ^       ^
                             lo  mid     hi        lo = 5, mid = 6, hi = 8
```

The comparison decides which half survives:

- **`nums[mid]` equals the target.** Found.
- **`nums[mid]` is less than the target.** Every element at or before `mid` is at most `nums[mid]`, so too small. Set `lo = mid + 1`.
- **`nums[mid]` is greater than the target.** Every element at or after `mid` is too big. Set `hi = mid - 1`.

Stop when the range is empty, which in an inclusive range means `lo > hi`. Then the target is not there. Each step at least halves the range, so a range of n elements is empty after about log₂ n steps.

@walkthrough

## Why it works: the invariant

Binary search is correct because of one sentence that stays true on every pass of the loop:

**If the target is in the array, its index is between `lo` and `hi`, inclusive.**

At the start `lo = 0` and `hi = n - 1`, so the sentence is true: the range is the whole array. Each update keeps it true, because the only elements an update removes are ones the sorted order has proved cannot be the target. When `nums[mid] < target`, every index up to `mid` holds a value no larger than `nums[mid]`, so the target is not among them, and moving `lo` past `mid` loses nothing. The other case is the mirror image.

The second half of the proof is that the loop ends. `mid` always lies inside `lo..hi`, and both updates remove `mid` itself as well as one side, so the range loses at least one element on every pass. A range that shrinks every time must become empty. When it does, the invariant says the target, if present, lies in an empty range — so it is absent. That is the whole argument, and it is worth being able to say out loud in an interview: *what is the invariant, and why does the range shrink?*

## One template you can trust

Most binary search bugs come from mixing conventions: an inclusive range with an exclusive update, or a loop condition from one tutorial with a midpoint from another. Pick one form and use it everywhere. This lesson uses this one:

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

This finds the **first index where a condition becomes true**, for any condition that is false for a while and then true for the rest of the array. "The value is at least the target" is such a condition on a sorted array. So is "the value is at most the last element" on a rotated array, and, in the next lesson, "this capacity is enough to ship everything in time". One template covers all of them.

Each line has a reason:

- **`while (lo <= hi)`** because the range is inclusive: when `lo == hi` one candidate is left and it still needs checking.
- **`mid + 1` and `mid - 1`, never `mid`.** Both updates drop `mid`, which is what guarantees the range shrinks. Writing `hi = mid` in this loop can leave the range unchanged when `lo == hi`, and the loop spins for ever.
- **`ans` remembers the best index seen.** When `mid` qualifies you still look left, because an earlier index might qualify too. `ans` is in fact always equal to `hi + 1`, and when the loop ends `lo == hi + 1`, so `lo` holds the same answer; the variable just makes it readable.
- **`mid = lo + (hi - lo) / 2`, not `(lo + hi) / 2`.** In C++ and Java an `int` holds at most 2,147,483,647. If `lo` and `hi` are both above about 1.07 billion, `lo + hi` overflows to a negative number, and the search reads a negative index. Arrays that large are rare, but the next lesson searches ranges of answers up to 10⁹ and beyond, where the sum overflows easily. In 2006 Joshua Bloch, who wrote the binary search in Java's standard library, reported that it had carried exactly this bug for about nine years. `hi - lo` never overflows, so the safe form is free. Python's integers cannot overflow; JavaScript needs `Math.floor` because its division returns fractions.

There is a second popular template with an **exclusive** end: `hi = n`, `while (lo < hi)`, `hi = mid` and `lo = mid + 1`. It is also correct — it is the convention of the C++ standard library, whose ranges are `[first, last)`. The danger is only in mixing the two. If you learn one, learn it completely.

### Dry run

The **lower bound** of a target is the first index whose value is at least the target. Here is the template finding the lower bound of 3 in `[1, 3, 3, 3, 5, 8, 8, 10]`:

| Step | lo | hi | mid | nums[mid] | nums[mid] ≥ 3? | Action |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 0 | 7 | 3 | 3 | yes | ans = 3, hi = 2 |
| 2 | 0 | 2 | 1 | 3 | yes | ans = 1, hi = 0 |
| 3 | 0 | 0 | 0 | 1 | no | lo = 1 |
| end | 1 | 0 | | | | range empty, answer 1 |

Step 1 lands on a 3, but not the first one, which is why the template keeps looking left instead of stopping. Three comparisons find the first 3 among eight elements.

## Lower bound, upper bound and the first and last occurrence

Two boundaries answer almost every question about a value in a sorted array:

- **Lower bound**: the first index with `nums[i] >= target`.
- **Upper bound**: the first index with `nums[i] > target`.

All copies of the target sit between them. So the **first occurrence** is the lower bound (if the value there really is the target), the **last occurrence** is the upper bound minus one, and the **count** of the target is upper bound minus lower bound — two searches, O(log n), however many copies there are. When the target is absent, both bounds equal the index where it would have to be inserted to keep the array sorted, which is exactly [Search Insert Position](/problems/search-insert-position).

The two functions differ in a single character: `>=` against `>`. That is a good sign that the template is the right abstraction — the condition changes, the loop does not.

### The code

The program prints the first and last position and the count for values that are present, and the insert position for values that are not, including one smaller than everything and one larger than everything.

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

Note the check `first < n` before reading `nums[first]`: when every value is smaller than the target the lower bound is `n`, one past the end. The same program solves [Find First and Last Position of Element in Sorted Array](/problems/find-first-and-last-position), and the plain "is it there?" question of [Binary Search](/problems/binary-search) is the lower bound followed by one equality check.

## Search in a rotated sorted array

A **rotated** sorted array is a sorted array cut at some point with the two pieces swapped: `[0, 1, 2, 4, 5, 6, 7]` rotated at index 4 becomes `[4, 5, 6, 7, 0, 1, 2]`. The whole array is no longer sorted, so the plain comparison with `nums[mid]` no longer tells you which side the target is on. But one fact survives, and it is enough:

**Cut a rotated sorted array anywhere, and at least one of the two halves is sorted.**

The rotation point can only be on one side of `mid`. Compare `nums[lo]` with `nums[mid]`: if `nums[lo] <= nums[mid]`, the stretch `lo..mid` contains no drop, so it is sorted; otherwise the drop is inside it and `mid..hi` is the sorted half. For the sorted half you can tell exactly whether the target is inside it, because a sorted stretch holds precisely the values between its two ends. If the target is inside, search there; if not, it can only be in the other half. Either way half the range goes, and the invariant from before still holds.

Finding the **minimum** (where the rotation happened) is the template from the last section with a different condition. With distinct values, every element of the lower, rotated-in part is at most the last element, and every element of the upper part is greater than it. So "`nums[i] <= nums[n - 1]`" is false, false, …, then true for the rest — and the first true index is the minimum.

### Dry run

Searching for 0 in `[4, 5, 6, 7, 0, 1, 2]`:

| Step | lo | hi | mid | nums[mid] | Sorted half | Target inside it? | Action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 0 | 6 | 3 | 7 | lo..mid: 4 to 7 | no | lo = 4 |
| 2 | 4 | 6 | 5 | 1 | lo..mid: 0 to 1 | yes | hi = 4 |
| 3 | 4 | 4 | 4 | 0 | | | found at index 4 |

### The code

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

These are [Search in Rotated Sorted Array](/problems/search-in-rotated-sorted-array) and [Find Minimum in Rotated Sorted Array](/problems/find-minimum-in-rotated-sorted-array). Both rely on the values being **distinct**. With duplicates, as in [Search in Rotated Sorted Array II](/problems/search-in-rotated-sorted-array-ii), `nums[lo] == nums[mid] == nums[hi]` tells you nothing about which half is sorted; the usual fix is to shrink both ends by one, which keeps the answer correct but makes the worst case O(n).

## Other shapes of the same search

Once you see binary search as "find where a condition flips", it turns up well beyond sorted arrays:

- **A sorted matrix.** If each row is sorted and each row starts after the previous one ends, the matrix is one sorted array of m × n cells read row by row; index `k` is cell `(k / n, k % n)`. See [Search a 2D Matrix](/problems/search-a-2d-matrix) and the [matrix lesson](/roadmap/matrix).
- **Letters and other ordered values.** [Find Smallest Letter Greater Than Target](/problems/find-smallest-letter-greater-than-target) is an upper bound on characters, wrapping to the first letter when the bound is `n`.
- **A peak.** In [Find Peak Element](/problems/find-peak-element) the array is not sorted at all, yet comparing `nums[mid]` with `nums[mid + 1]` tells you which side is guaranteed to hold a peak: if the next value is larger, the climb continues to the right and must end at a peak there.
- **The answer itself.** When the question is "what is the smallest capacity, speed or value that works?", you binary search over candidate answers rather than over an array. That is important enough to have its own lesson: [binary search on the answer](/roadmap/binary-search-on-answer).

## The library versions

Every language except JavaScript ships a binary search. Know exactly what each returns, because they differ:

| Language | Call | Returns |
| --- | --- | --- |
| C++ | `std::lower_bound(v.begin(), v.end(), x)` | iterator to the first element `>= x`, or `end()` |
| C++ | `std::upper_bound(v.begin(), v.end(), x)` | iterator to the first element `> x`, or `end()` |
| C++ | `std::binary_search(v.begin(), v.end(), x)` | `true` or `false` only |
| Java | `Arrays.binarySearch(arr, x)` | an index of `x` if present (any one of several copies), otherwise `-(insertion point) - 1` |
| Python | `bisect.bisect_left(a, x)` | the first index `i` with `a[i] >= x` (lower bound) |
| Python | `bisect.bisect_right(a, x)` | the first index `i` with `a[i] > x` (upper bound) |
| JavaScript | none | write the template; `indexOf` and `includes` scan in O(n) |

Subtract `v.begin()` from a C++ iterator to get an index. Java's negative return encodes the insertion point so that "not found" is never confused with index 0: a result of −5 means "absent, would be inserted at 4". Java does not promise *which* copy it finds when there are duplicates, so it cannot answer first-or-last-occurrence questions; write the template. All of these require the data to be sorted already, by the same order you search with.

## Time and space complexity

| Approach | Time per search | Extra space |
| --- | --- | --- |
| Linear scan | O(n) | O(1) |
| Binary search, iterative | O(log n) | O(1) |
| Binary search, recursive | O(log n) | O(log n) for the call stack |
| Sort once, then q binary searches | O(n log n + q log n) | depends on the sort |
| Hash set lookups | O(1) on average | O(n) |

Why log n: after one comparison n/2 candidates remain, after two n/4, after k steps n / 2ᵏ. The search ends when that reaches one, at k = log₂ n. Doubling the array adds a single step; a billion elements need only about 30. The cost is the precondition — sorted data — and sorting costs O(n log n) (see [sorting algorithms](/roadmap/sorting-algorithms)), so for one search on unsorted data a plain scan is cheaper. A [hash set](/roadmap/hashing) answers "is it present?" faster still, but it cannot answer "what is the first value at least x?" or "how many values lie between a and b?", which binary search answers with two bounds.

## How to recognise a binary search problem

- The input is **sorted**, and the question is about finding a value, a position or a count.
- The statement demands **O(log n)** time. That nearly always means binary search.
- You are asked for the **first** or **last** position of something, or the smallest value **at least** or largest value **at most** some target.
- The array is "sorted but rotated", or sorted by rows, or sorted in some other recognisable way.
- There is a yes-or-no question over a range of values that is false and then true (or true and then false) with a single switch — the sign that you can binary search the answer.

## Common mistakes

- **Mixing templates.** `hi = mid` belongs to the exclusive-end template with `while (lo < hi)`. Put it inside `while (lo <= hi)` and a one-element range never shrinks: an infinite loop.
- **Computing `(lo + hi) / 2` with ints.** It overflows once the sum passes 2,147,483,647. Use `lo + (hi - lo) / 2`, and in JavaScript wrap the division in `Math.floor` — an index of 3.5 reads `undefined`.
- **Stopping at the first match.** For the first or last occurrence, a match at `mid` is only a candidate; record it and keep searching on the correct side.
- **Reading past the end.** The lower bound can be `n`. Check `index < n` before reading `nums[index]`.
- **Searching unsorted data.** Binary search on an unsorted array returns wrong answers without any error. If the problem needs original indices, sort pairs of value and index.
- **Forgetting duplicates in rotated arrays.** The sorted-half test assumes distinct values; with duplicates, handle `nums[lo] == nums[mid]` separately.

## Practice in this order

Start where the template is the whole solution, then move to problems where you must find the condition that flips:

1. [Binary Search](/problems/binary-search): the exact-match search, the walkthrough above.
2. [Search Insert Position](/problems/search-insert-position): the lower bound and nothing else.
3. [Find Smallest Letter Greater Than Target](/problems/find-smallest-letter-greater-than-target): an upper bound with a wrap-around.
4. [Find First and Last Position of Element in Sorted Array](/problems/find-first-and-last-position): both bounds, the first program above.
5. [Search a 2D Matrix](/problems/search-a-2d-matrix): one sorted array in disguise.
6. [Find Peak Element](/problems/find-peak-element): binary search on an unsorted array, with a condition you have to justify.
7. [Find Minimum in Rotated Sorted Array](/problems/find-minimum-in-rotated-sorted-array): the template with a "less than or equal to the last value" condition.
8. [Search in Rotated Sorted Array](/problems/search-in-rotated-sorted-array): the sorted-half argument.

The [binary search problem list](/challenges/binary-search) has every problem in the catalogue that uses the technique, from easy to hard. When these feel routine, read the next lesson, [binary search on the answer](/roadmap/binary-search-on-answer), where the array disappears and you search the answer itself.
