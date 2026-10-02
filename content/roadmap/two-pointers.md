---
title: Two Pointers Technique
stage: two-pointers
order: 1
minutes: 18
level: Beginner
hub: two-pointers
practice: reverse-string, move-zeroes, remove-duplicates-from-sorted-array, merge-sorted-array, squares-of-a-sorted-array, two-sum-ii-input-array-is-sorted, 3sum, container-with-most-water, trapping-rain-water
updated: 2026-10-02
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
Many array problems ask about **pairs**: two numbers that add up to a target, two lines that hold the most water, two characters that should match in a palindrome. The obvious solution checks every pair with two nested loops. The two pointers technique replaces those loops with two indices that move through the input in a single coordinated pass, and it is one of the first patterns every interview round expects you to know.

This lesson explains the two shapes the technique takes, why it is correct and not just fast, how to recognise a problem that wants it, and the mistakes that sink an otherwise right idea. Every example is shown in C++, Java, Python and JavaScript.

## Why nested loops are too slow

Take the classic question: *given a sorted array, is there a pair of values that adds up to a target?* The brute-force answer tries every pair.

```text
for i in 0 .. n-1:
    for j in i+1 .. n-1:
        if arr[i] + arr[j] == target: return (i, j)
```

That is about n × n / 2 comparisons. With n = 100,000 it is roughly five billion additions — far more than the hundred million or so simple operations a judge allows in a second. The brute force is correct, but it ignores the most useful fact in the question: the array is **sorted**. Two pointers is how you use that fact.

## The idea: two indices instead of two loops

Put one pointer at each end of the sorted array and look at the sum of the two values they point to.

```text
 index:   0   1   2   3   4   5   6
 arr:   [ 1,  2,  3,  4,  6,  8, 11 ]      target = 10
          ^                       ^
        left                    right      1 + 11 = 12, too big
```

The sum compared with the target tells you which pointer to move:

- **The sum is too big.** The only way to make it smaller is to use a smaller value, so move `right` one step left.
- **The sum is too small.** The only way to make it bigger is to use a larger value, so move `left` one step right.
- **The sum equals the target.** You have found the pair.

Stop when the pointers meet: there is no pair left to try. Each step moves one pointer inwards, so the loop runs at most n − 1 times. A question that took five billion steps now takes a hundred thousand.

@walkthrough

## Why moving a pointer is safe

Speed is worthless if the algorithm can skip the right answer, so it is worth seeing why it never does. The argument is short and it is the heart of every two-pointer solution.

Suppose `arr[left] + arr[right]` is **too big**. Every value still in play is at least `arr[left]`, because the array is sorted and everything left of `left` has already been ruled out. So `arr[right]` plus *any* remaining partner is at least `arr[left] + arr[right]`, which is already too big. The value at `right` cannot belong to any valid pair, and dropping it loses nothing.

The same reasoning, mirrored, shows that when the sum is **too small** the value at `left` cannot belong to any valid pair either: its largest possible partner, `arr[right]`, is not enough.

So every step discards one element that provably cannot be part of the answer. This is called an **invariant**: *if a valid pair exists, both of its elements lie between `left` and `right`*. It is true at the start, every move keeps it true, and when the pointers meet without finding a pair, the invariant says none exists. When you meet a new two-pointer problem, the work is finding the rule that lets you discard one end safely. Once you have it, the code is short.

### Dry run

Here is the search for target 10 in `[1, 2, 3, 4, 6, 8, 11]`, step by step:

| Step | left | right | arr[left] + arr[right] | Decision |
| --- | --- | --- | --- | --- |
| 1 | 0 | 6 | 1 + 11 = 12 | too big, move right to 5 |
| 2 | 0 | 5 | 1 + 8 = 9 | too small, move left to 1 |
| 3 | 1 | 5 | 2 + 8 = 10 | equal, pair found |

Three steps instead of up to twenty-one pair checks. Notice that 4 + 6 = 10 is also a valid pair; the technique finds *a* pair, and a problem that wants all of them simply records the pair and moves both pointers inwards instead of stopping.

### The code

The function returns the indices of the pair, or a "not found" marker. The program runs it for a target that exists and one that does not.

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

The same skeleton solves [Two Sum II](/problems/two-sum-ii-input-array-is-sorted) almost word for word. [3Sum](/problems/3sum) fixes one number with an outer loop and runs this search on the rest, which makes it O(n²) instead of O(n³). [Container With Most Water](/problems/container-with-most-water) uses the same "discard the end that cannot help" argument with a different rule: the shorter line can never do better, so it is the one that moves.

## Same direction: read and write pointers

The second shape keeps both pointers moving **left to right**. One pointer, often called `read` or `fast`, visits every element. The other, `write` or `slow`, marks where the next element worth keeping should go. Everything before `write` is the finished part of the answer; everything from `read` onwards has not been looked at yet.

This is how you modify an array **in place** without a second array. Take [Remove Duplicates from Sorted Array](/problems/remove-duplicates-from-sorted-array): keep one copy of each value at the front of a sorted array and return how many there are.

```text
 nums:  [ 0, 0, 1, 1, 1, 2, 2, 3, 3, 4 ]
             ^  ^
         write  read      nums[read] == nums[write-1]: a duplicate, skip it
```

Because the array is sorted, a value is new exactly when it differs from the last value kept, `nums[write - 1]`. When `read` finds a new value it copies it to `nums[write]` and advances `write`. Duplicates are skipped by moving `read` alone. When `read` reaches the end, the first `write` slots hold every distinct value in order.

### Dry run

| read | nums[read] | last kept | Action | write after |
| --- | --- | --- | --- | --- |
| 1 | 0 | 0 | duplicate, skip | 1 |
| 2 | 1 | 0 | new: copy to index 1 | 2 |
| 3 | 1 | 1 | duplicate, skip | 2 |
| 5 | 2 | 1 | new: copy to index 2 | 3 |
| 7 | 3 | 2 | new: copy to index 3 | 4 |
| 9 | 4 | 3 | new: copy to index 4 | 5 |

(Rows 4, 6 and 8 are duplicates and are skipped like row 3.) The answer is 5, and the array begins `0 1 2 3 4`.

### The code

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

The same read-and-write loop solves [Move Zeroes](/problems/move-zeroes) (keep the non-zero values, then fill the tail with zeroes) and [Remove Element](/problems/remove-element) (keep everything that is not the given value). Only the rule for "worth keeping" changes.

## Other shapes of the same idea

Once the two basic shapes are familiar, the technique turns up in several disguises:

- **Two pointers on two arrays.** Merging two sorted arrays keeps one pointer in each and always takes the smaller front value. It is the merge step of merge sort and the whole of [Merge Sorted Array](/problems/merge-sorted-array), where filling from the back avoids overwriting values not yet read.
- **Squares of a sorted array.** With negative numbers the largest square sits at one of the two ends, so pointers at both ends fill the result from its back. See [Squares of a Sorted Array](/problems/squares-of-a-sorted-array).
- **Palindromes.** Compare the first and last characters and move both inwards; any mismatch settles it. Skipping punctuation is one extra `while` per pointer.
- **Fast and slow pointers.** Move one pointer one step at a time and the other two steps. If the sequence ever loops, the fast pointer catches the slow one inside the loop. This is Floyd's cycle detection, used on linked lists and on sequences such as [Happy Number](/problems/happy-number).
- **Partitioning.** Dutch national flag partitioning, as in [Sort Colors](/problems/sort-colors), keeps three pointers so that values smaller than the pivot, equal to it and larger than it end up in three bands in a single pass.

## Time and space complexity

| Approach | Time | Extra space |
| --- | --- | --- |
| Nested loops over all pairs | O(n²) | O(1) |
| Hash set of values seen | O(n) | O(n) |
| Two pointers on a sorted array | O(n) | O(1) |
| Sort first, then two pointers | O(n log n) | O(1) to O(n), depending on the sort |

Two pointers is O(n) because neither pointer ever moves backwards: between them they make at most n moves. When the input is not sorted, a hash set also gives O(n) for a pair sum, at the cost of O(n) memory — see [Hashing](/roadmap/hashing). Two pointers wins when the input is already sorted, when the problem forbids extra memory, or when you must return the values in order.

## How to recognise a two-pointer problem

Read the statement for these signals:

- The input is **sorted**, or sorting it would not change the answer. "Return any pair", "count the triplets" and "find the closest sum" usually allow sorting.
- The question is about a **pair or a triplet** meeting a condition: a sum, a difference, a product, an area.
- The problem says **in place** or **O(1) extra space**. That nearly always means read and write pointers.
- You are asked to compare a sequence **with its own reverse**, such as a palindrome, or to process it **from both ends**.
- Two **sorted inputs** must be combined, intersected or compared.

If the question is instead about a **contiguous run** of elements — the longest substring without repeats, the smallest subarray with a sum at least k — you want the same-direction special case called the [Sliding Window](/roadmap/sliding-window) technique. If one value must be searched for many times, [Binary Search](/roadmap/binary-search) may fit better.

## Common mistakes

- **Using `<=` instead of `<` in the loop.** When `left == right` both pointers name the same element, and pairing a value with itself is usually wrong.
- **Forgetting to sort.** Opposite-end pointers on unsorted data give wrong answers silently. If the problem wants original indices, sort pairs of value and index, not just the values.
- **Moving the wrong pointer.** Write down which end is ruled out before coding: a sum that is too big rules out the *larger* value, so `right` moves.
- **Skipping duplicates inconsistently.** In 3Sum, skip equal values *after* recording a triplet and for the fixed outer value, or the same triplet is reported twice.
- **Integer overflow.** Two values near the integer limit can overflow when added in C++ or Java. Use `long` or compare `arr[left]` with `target - arr[right]` instead.
- **Reading the write slot before checking it.** In read-and-write loops, compare with `nums[write - 1]`, the last value kept, not with `nums[read - 1]` once values have been moved.

## Practice in this order

Start with the problems where the pattern is the whole solution, then move to ones where you have to find the discard rule yourself:

1. [Reverse String](/problems/reverse-string): opposite ends, swap and move both.
2. [Move Zeroes](/problems/move-zeroes): read and write pointers.
3. [Remove Duplicates from Sorted Array](/problems/remove-duplicates-from-sorted-array): the example above.
4. [Merge Sorted Array](/problems/merge-sorted-array): one pointer per array, filled from the back.
5. [Two Sum II](/problems/two-sum-ii-input-array-is-sorted): the first example above.
6. [3Sum](/problems/3sum): an outer loop around a two-pointer search, with duplicates to skip.
7. [Container With Most Water](/problems/container-with-most-water): a discard rule you have to prove.
8. [Trapping Rain Water](/problems/trapping-rain-water): two pointers that carry a running maximum each.

The [two pointers problem list](/challenges/two-pointers) has every problem in the catalogue that uses the technique, from easy to hard. When the first six feel routine, move on to the next stage of the roadmap: the sliding window.
