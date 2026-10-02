---
title: Two Pointers Technique
stage: two-pointers
order: 1
minutes: 12
level: Beginner
hub: two-pointers
practice: reverse-string, move-zeroes, remove-duplicates-from-sorted-array, merge-sorted-array, squares-of-a-sorted-array, two-sum-ii-input-array-is-sorted, 3sum, container-with-most-water, trapping-rain-water
updated: 2026-10-03
seo-title: Two Pointers Technique: Explained with Examples & Code
description: Learn the two pointers technique: opposite-end and same-direction pointers, why they work, dry runs, and code in C++, Java, Python and JavaScript.
question: What is the two pointers technique?
answer: The two pointers technique walks two indices through an array or string in one coordinated pass instead of checking every pair with nested loops. The pointers either start at opposite ends and move towards each other, or start together and move in the same direction at different speeds. It turns many O(n²) pair searches into O(n) time with O(1) extra space.
q: When should I use two pointers?
a: Reach for two pointers when the input is sorted (or can be sorted) and the question is about a pair, a triplet or a range that meets a target, or when an array must be modified in place — removing duplicates, moving zeroes, partitioning. A palindrome check and merging two sorted lists are two-pointer problems too.
q: Is two pointers the same as sliding window?
a: Sliding window is a special case of same-direction two pointers: both pointers move left to right and the elements between them form a window whose sum, count or contents you track. Two pointers is the wider family; it also covers pointers that start at opposite ends and meet in the middle.
q: What is the time complexity of the two pointers technique?
a: Usually O(n): each step moves at least one pointer, and neither pointer ever moves backwards, so the pointers make at most n moves between them. Space is O(1) because only the two indices are stored. If the input has to be sorted first, sorting adds O(n log n).
q: Why does two pointers need a sorted array?
a: For opposite-end pointers, sorting is what makes it safe to discard an element: if the smallest remaining value plus the largest is already too big, the largest cannot be part of any pair, so the right pointer moves left. Without sorted order that conclusion does not hold. Same-direction pointers, such as moving zeroes, do not need sorting.
q: What are fast and slow pointers?
a: Fast and slow pointers move in the same direction at different speeds — the slow one by one step, the fast one by two. In a sequence that loops back on itself the fast pointer eventually laps the slow one, which is how Floyd's algorithm detects a cycle in a linked list or in a number sequence such as Happy Number.
---
Many array problems ask about **pairs**: two numbers that add up to a target, two lines that hold the most water, two characters that should match in a palindrome. Checking every pair takes two nested loops. The two pointers technique replaces them with two indices that move through the input in one coordinated pass — and it comes in two shapes.

@figure two-shapes

## Why nested loops are too slow

Take a sorted array and ask whether any pair adds up to a target. Trying every pair costs about n²/2 checks: five billion for n = 100,000, against the hundred million or so simple operations a judge allows in a second. The brute force is correct, but it ignores the one fact that matters — the array is **sorted**.

@figure growth

## Opposite ends: meet in the middle

Put `left` on the smallest value and `right` on the largest, and compare their sum with the target:

- **Too big**: move `right` one step left, to a smaller value.
- **Too small**: move `left` one step right, to a larger value.
- **Equal**: the pair is found.

Stop when the pointers meet. Each step moves one pointer inwards, so the loop runs at most n − 1 times.

@walkthrough

## Why moving a pointer is safe

Lay every pair out as a triangle of sums, left value by row and right value by column. When `arr[left] + arr[right]` is too big, `arr[left]` is the smallest value still in play, so **every** pair that uses `arr[right]` is too big: its whole column can go. When the sum is too small, every pair that uses `arr[left]` is too small: its whole row goes. Each comparison discards a row or a column — never the answer.

@figure pair-grid

That is the technique's **invariant**: *if a valid pair exists, both of its values lie between `left` and `right`*. It holds at the start, every move keeps it, and when the pointers meet with nothing found, it proves there is no pair. Facing a new two-pointer problem, the real work is finding the rule that lets you discard one end safely.

### The code

The function returns the indices of a pair, or a "not found" marker; the program tries a target that exists and one that does not.

```cpp
#include <iostream>
#include <utility>
#include <vector>
using namespace std;

// Indices of two values in a sorted array that add up to target,
// or {-1, -1} when no such pair exists.
pair<int, int> pairWithSum(const vector<int>& arr, int target) {
    int left = 0, right = (int)arr.size() - 1;
    while (left < right) {
        int sum = arr[left] + arr[right];
        if (sum == target) return {left, right};
        if (sum < target) left++;   // need a bigger sum: move the small end up
        else right--;               // need a smaller sum: move the big end down
    }
    return {-1, -1};
}

int main() {
    vector<int> arr = {1, 2, 3, 4, 6, 8, 11};
    for (int target : {10, 100}) {
        pair<int, int> p = pairWithSum(arr, target);
        if (p.first == -1) {
            cout << "No pair adds up to " << target << "\n";
        } else {
            cout << "Pair found: " << arr[p.first] << " + " << arr[p.second] << " = " << target
                 << " (indices " << p.first << " and " << p.second << ")\n";
        }
    }
    return 0;
}
```

```java
public class Main {
    // Indices of two values in a sorted array that add up to target,
    // or {-1, -1} when no such pair exists.
    static int[] pairWithSum(int[] arr, int target) {
        int left = 0, right = arr.length - 1;
        while (left < right) {
            int sum = arr[left] + arr[right];
            if (sum == target) return new int[] {left, right};
            if (sum < target) left++;   // need a bigger sum: move the small end up
            else right--;               // need a smaller sum: move the big end down
        }
        return new int[] {-1, -1};
    }

    public static void main(String[] args) {
        int[] arr = {1, 2, 3, 4, 6, 8, 11};
        for (int target : new int[] {10, 100}) {
            int[] p = pairWithSum(arr, target);
            if (p[0] == -1) {
                System.out.println("No pair adds up to " + target);
            } else {
                System.out.println("Pair found: " + arr[p[0]] + " + " + arr[p[1]] + " = " + target
                        + " (indices " + p[0] + " and " + p[1] + ")");
            }
        }
    }
}
```

```python
def pair_with_sum(arr, target):
    """Indices of two values in a sorted list that add up to target, or None."""
    left, right = 0, len(arr) - 1
    while left < right:
        total = arr[left] + arr[right]
        if total == target:
            return left, right
        if total < target:
            left += 1   # need a bigger sum: move the small end up
        else:
            right -= 1  # need a smaller sum: move the big end down
    return None


arr = [1, 2, 3, 4, 6, 8, 11]
for target in (10, 100):
    found = pair_with_sum(arr, target)
    if found is None:
        print(f"No pair adds up to {target}")
    else:
        i, j = found
        print(f"Pair found: {arr[i]} + {arr[j]} = {target} (indices {i} and {j})")
```

```javascript
// Indices of two values in a sorted array that add up to target, or null.
function pairWithSum(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  while (left < right) {
    const sum = arr[left] + arr[right];
    if (sum === target) return [left, right];
    if (sum < target) left++; // need a bigger sum: move the small end up
    else right--; // need a smaller sum: move the big end down
  }
  return null;
}

const arr = [1, 2, 3, 4, 6, 8, 11];
for (const target of [10, 100]) {
  const found = pairWithSum(arr, target);
  if (found === null) {
    console.log(`No pair adds up to ${target}`);
  } else {
    const [i, j] = found;
    console.log(`Pair found: ${arr[i]} + ${arr[j]} = ${target} (indices ${i} and ${j})`);
  }
}
```

```output
Pair found: 2 + 8 = 10 (indices 1 and 5)
No pair adds up to 100
```

The same skeleton solves [Two Sum II](/problems/two-sum-ii-input-array-is-sorted) almost word for word. [3Sum](/problems/3sum) fixes one number and runs this search on the rest, O(n²) instead of O(n³). [Container With Most Water](/problems/container-with-most-water) moves the shorter line, because the shorter line can never do better.

## Same direction: read and write pointers

Here both pointers move left to right. `read` visits every element; `write` marks where the next element worth keeping goes. Everything before `write` is the finished answer, so the array is changed **in place**, with no second array. In [Remove Duplicates from Sorted Array](/problems/remove-duplicates-from-sorted-array) a value is worth keeping when it differs from the last one kept, `nums[write - 1]`.

@figure read-write

```cpp
#include <iostream>
#include <vector>
using namespace std;

// Keeps one copy of each value at the front of a sorted array, in place.
// Returns how many values were kept.
int removeDuplicates(vector<int>& nums) {
    if (nums.empty()) return 0;
    int write = 1;                          // next free slot for a new value
    for (int read = 1; read < (int)nums.size(); read++) {
        if (nums[read] != nums[write - 1]) { // a value not kept yet
            nums[write] = nums[read];
            write++;
        }
    }
    return write;
}

int main() {
    vector<int> nums = {0, 0, 1, 1, 1, 2, 2, 3, 3, 4};
    int k = removeDuplicates(nums);
    cout << "Unique values: " << k << "\n";
    cout << "Front of the array:";
    for (int i = 0; i < k; i++) cout << " " << nums[i];
    cout << "\n";
    return 0;
}
```

```java
public class Main {
    // Keeps one copy of each value at the front of a sorted array, in place.
    // Returns how many values were kept.
    static int removeDuplicates(int[] nums) {
        if (nums.length == 0) return 0;
        int write = 1;                          // next free slot for a new value
        for (int read = 1; read < nums.length; read++) {
            if (nums[read] != nums[write - 1]) { // a value not kept yet
                nums[write] = nums[read];
                write++;
            }
        }
        return write;
    }

    public static void main(String[] args) {
        int[] nums = {0, 0, 1, 1, 1, 2, 2, 3, 3, 4};
        int k = removeDuplicates(nums);
        System.out.println("Unique values: " + k);
        StringBuilder front = new StringBuilder("Front of the array:");
        for (int i = 0; i < k; i++) front.append(" ").append(nums[i]);
        System.out.println(front);
    }
}
```

```python
def remove_duplicates(nums):
    """Keep one copy of each value at the front of a sorted list, in place.
    Return how many values were kept."""
    if not nums:
        return 0
    write = 1                          # next free slot for a new value
    for read in range(1, len(nums)):
        if nums[read] != nums[write - 1]:  # a value not kept yet
            nums[write] = nums[read]
            write += 1
    return write


nums = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]
k = remove_duplicates(nums)
print("Unique values:", k)
print("Front of the array:", *nums[:k])
```

```javascript
// Keeps one copy of each value at the front of a sorted array, in place.
// Returns how many values were kept.
function removeDuplicates(nums) {
  if (nums.length === 0) return 0;
  let write = 1; // next free slot for a new value
  for (let read = 1; read < nums.length; read++) {
    if (nums[read] !== nums[write - 1]) {
      // a value not kept yet
      nums[write] = nums[read];
      write++;
    }
  }
  return write;
}

const nums = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4];
const k = removeDuplicates(nums);
console.log(`Unique values: ${k}`);
console.log(`Front of the array: ${nums.slice(0, k).join(" ")}`);
```

```output
Unique values: 5
Front of the array: 0 1 2 3 4
```

Only the rule for "worth keeping" changes in [Move Zeroes](/problems/move-zeroes) (keep the non-zero values, then fill the tail with zeroes) and [Remove Element](/problems/remove-element) (keep everything that is not the given value).

## Fast and slow pointers

Move one pointer a step at a time and the other two. If the sequence loops back on itself, the fast pointer laps the slow one inside the loop and they meet; if it does not, fast simply reaches the end. This is Floyd's cycle detection, used on linked lists and on number sequences such as [Happy Number](/problems/happy-number).

@figure fast-slow

## Other shapes of the same idea

- **Two arrays**: one pointer in each, always taking the smaller front value — the merge step of merge sort, and [Merge Sorted Array](/problems/merge-sorted-array) filled from the back.
- **Squares of a sorted array**: with negatives, the largest square sits at one of the two ends, so the result fills from its back — see [Squares of a Sorted Array](/problems/squares-of-a-sorted-array).
- **Palindromes**: compare the first and last characters and move both inwards; any mismatch settles it.
- **Partitioning**: three pointers sort values below, equal to and above a pivot into three bands in one pass, as in [Sort Colors](/problems/sort-colors).

## Time and space complexity

| Approach | Time | Extra space |
| --- | --- | --- |
| Nested loops over all pairs | O(n²) | O(1) |
| Hash set of values seen | O(n) | O(n) |
| Two pointers on a sorted array | O(n) | O(1) |
| Sort first, then two pointers | O(n log n) | O(1) to O(n), depending on the sort |

Neither pointer ever moves backwards, so between them they make at most n moves. On unsorted input a hash set also finds a pair in O(n), at the cost of O(n) memory — see [Hashing](/roadmap/hashing). Two pointers wins when the input is already sorted, when extra memory is forbidden, or when the values must come back in order.

## How to recognise a two-pointer problem

- The input is **sorted**, or sorting it would not change the answer.
- The question is about a **pair or a triplet** meeting a condition: a sum, a difference, an area.
- The statement says **in place** or **O(1) extra space** — that nearly always means read and write pointers.
- A sequence is compared **with its own reverse**, or processed **from both ends**.

If the question is about a **contiguous run** — the longest substring without repeats, the smallest subarray with a sum of at least k — you want the [Sliding Window](/roadmap/sliding-window), the same-direction special case. If one value must be found many times, try [Binary Search](/roadmap/binary-search).

## Common mistakes

- **`left <= right` instead of `left < right`**: both pointers on one element pair a value with itself.
- **Forgetting to sort**: opposite-end pointers on unsorted data give wrong answers silently. To return original indices, sort (value, index) pairs.
- **Moving the wrong pointer**: a sum that is too big rules out the *larger* value, so `right` moves.
- **Duplicates in 3Sum**: skip equal values after recording a triplet, or the same triplet is reported twice.
- **Overflow**: two values near the integer limit overflow when added in C++ or Java; compare `arr[left]` with `target - arr[right]` instead.

## Practice in this order

1. [Reverse String](/problems/reverse-string): opposite ends, swap and move both.
2. [Move Zeroes](/problems/move-zeroes): read and write pointers.
3. [Remove Duplicates from Sorted Array](/problems/remove-duplicates-from-sorted-array): the animation above.
4. [Merge Sorted Array](/problems/merge-sorted-array): one pointer per array, filled from the back.
5. [Two Sum II](/problems/two-sum-ii-input-array-is-sorted): the first program above.
6. [3Sum](/problems/3sum): an outer loop around a two-pointer search, with duplicates to skip.
7. [Container With Most Water](/problems/container-with-most-water): a discard rule you have to prove.
8. [Trapping Rain Water](/problems/trapping-rain-water): two pointers that carry a running maximum each.

Every two-pointer problem in the catalogue is on the [two pointers problem list](/challenges/two-pointers), easiest first. When the first six feel routine, move on to the next stage of the roadmap: the [sliding window](/roadmap/sliding-window).
