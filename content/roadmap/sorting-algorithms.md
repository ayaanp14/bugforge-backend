---
title: Sorting Algorithms
stage: greedy
order: 1
minutes: 26
level: Beginner
hub: sorting
practice: height-checker, relative-sort-array, sort-array-by-increasing-frequency, largest-perimeter-triangle, sort-colors, sort-an-array, kth-largest-element-in-an-array, largest-number, count-inversions
updated: 2026-10-03
seo-title: Sorting Algorithms Explained: Merge Sort, Quicksort & More
description: Learn bubble, insertion, merge, quick and counting sort, stability and custom comparators, with code in C++, Java, Python and JavaScript.
question: What are the main sorting algorithms?
answer: The main sorting algorithms are the simple O(n²) sorts — bubble, selection and insertion sort — and the O(n log n) ones: merge sort, which sorts both halves and merges them; quicksort, which partitions around a pivot; and heap sort. Counting sort runs in O(n + k) for small integer keys. Library sorts such as introsort and TimSort combine these ideas.
q: Which sorting algorithm is the fastest?
a: No single one wins everywhere. For general data, your language's library sort is the right choice: introsort in C++, dual-pivot quicksort or TimSort in Java, TimSort in Python and in V8's JavaScript. Quicksort is usually fastest in practice on arrays of numbers, merge sort guarantees O(n log n) and stability, and counting sort beats both when the values are small integers.
q: What is a stable sort?
a: A sort is stable when elements that compare equal keep their original relative order. It matters when records are sorted by one key after another: sorting by name and then stably by score leaves students with equal scores in name order. Merge sort, insertion sort, counting sort and TimSort are stable; quicksort, heap sort and selection sort are not.
q: Why is quicksort O(n²) in the worst case?
a: Quicksort is fast when each pivot splits the range into two similar parts, giving about log n levels of work. If the pivot is always the smallest or largest value — the first element of an already sorted array, for instance — one side is empty every time, there are n levels, and the comparisons add up to about n²/2. A random or middle pivot makes that worst case very unlikely in practice.
q: Can sorting be faster than O(n log n)?
a: Not by comparing elements. Any comparison sort must tell apart all n! possible orders of the input, and each comparison has only two outcomes, so it needs at least log₂(n!) ≈ n log₂ n comparisons in the worst case. Sorts that do not compare, such as counting sort and radix sort, run in linear time when the keys are small integers.
q: When should I use insertion sort?
a: On small arrays, up to a few dozen elements, and on arrays that are nearly sorted. Its cost is O(n + d), where d is the number of pairs out of order, so a nearly sorted array takes close to linear time. That is why introsort and TimSort hand short pieces to insertion sort.
q: How do I sort by two keys?
a: Use one comparator that compares the first key and falls back to the second on a tie, or sort by the secondary key first and then stably by the primary key. In Python a tuple key such as (-score, name) does it in one call; in C++, Java and JavaScript write the comparator.
---
Sorting is the most common first step in algorithm problems. Once the data is in order, duplicates sit next to each other, the closest pair of values is a pair of neighbours, two pointers can walk in from both ends, and binary search becomes possible. Many "hard" problems turn into a sort followed by one simple pass.

Every language has a sort built in, so why learn the algorithms? Three reasons. Interviews ask you to write merge sort or quicksort, or to explain their costs. The ideas inside them — merging two sorted runs, partitioning around a pivot, counting instead of comparing — are the solutions to other problems, from counting inversions to finding the k-th largest element. And you need to know what your library actually does: whether it is stable, what it costs in the worst case, and how to give it a comparator. This lesson covers all three, with every program shown in C++, Java, Python and JavaScript.

## Why sorting comes first

Take a simple question: *in an array of numbers, what is the smallest difference between any two of them?* The direct answer compares every pair.

```text
best = infinity
for i in 0 .. n-1:
    for j in i+1 .. n-1:
        best = min(best, |a[i] - a[j]|)
```

That is n × (n − 1) / 2 pairs: about five billion for n = 100,000, far beyond the hundred million or so simple steps a judge allows in a second. Sorting first changes the question. In sorted order, the closest value to any element is one of its two neighbours, so only the n − 1 neighbouring pairs need checking. Sorting costs O(n log n) — about 1.7 million comparisons for n = 100,000 — and the scan costs O(n). The whole solution runs in a fraction of a second.

## The idea: order puts related values side by side

```text
 input:    [ 19,  4, 27, 11,  8, 33 ]     15 pairs to compare
 sorted:   [  4,  8, 11, 19, 27, 33 ]
 gaps:         4   3   8   8   6          5 neighbouring gaps; the smallest is 3
```

Why only neighbours? If `a ≤ b ≤ c` in sorted order, then `c − a = (c − b) + (b − a)`, which is at least either gap on its own. A pair that skips over an element can never be closer than the pair of neighbours inside it. Sorting is what made that argument available. The same thing happens over and over:

- **Equal values become adjacent**, so finding or removing duplicates is one pass.
- **Pairs and sums become monotone**, so [two pointers](/roadmap/two-pointers) and [binary search](/roadmap/binary-search) apply.
- **Intervals sorted by start** can be merged in one sweep — see [intervals](/roadmap/intervals).
- **A greedy choice** often needs the data in some order first: the smallest cookie, the earliest finish, the heaviest item. That is why this lesson comes before [greedy algorithms](/roadmap/greedy-algorithms) on the road.

@walkthrough

## The simple sorts: bubble, selection and insertion

These three are O(n²). You will rarely use the first two, but each is asked in interviews, and insertion sort is genuinely used inside the fast library sorts.

- **Bubble sort** walks the array repeatedly, swapping neighbours that are out of order. Each pass carries the largest remaining value to the end, like a bubble rising. If a pass makes no swap, the array is sorted and you can stop, so an already sorted array costs one pass, O(n). It swaps only when the left value is strictly larger, so equal values never pass each other: it is stable.
- **Selection sort** finds the smallest value in the unsorted part and swaps it to the front, n − 1 times. It always makes n × (n − 1) / 2 comparisons, even on sorted input, but at most n − 1 swaps — its one virtue when writing to memory is expensive. The long-distance swap makes it unstable: in `[4a, 4b, 1]` the first swap moves `4a` behind `4b`.
- **Insertion sort** grows a sorted prefix one element at a time. It takes the next element, shifts every larger value in the prefix one place right, and drops the element into the gap — the way most people sort a hand of cards.

Insertion sort's cost depends on the input. Each shift fixes exactly one pair of elements that were out of order (an **inversion**), so the total work is O(n + d), where d is the number of inversions. A reversed array has n × (n − 1) / 2 inversions and costs O(n²); a nearly sorted array has few and costs close to O(n). Insertion sort also has tiny constant factors. That is why C++'s introsort and Python's TimSort switch to insertion sort for pieces shorter than a few dozen elements: on small or nearly sorted inputs, it beats the clever algorithms.

### Dry run

Insertion sort on `[5, 2, 4, 6, 1, 3]`:

| Step | Element taken | Larger values shifted right | Array afterwards |
| --- | --- | --- | --- |
| 1 | 2 | 5 | 2 5 4 6 1 3 |
| 2 | 4 | 5 | 2 4 5 6 1 3 |
| 3 | 6 | none | 2 4 5 6 1 3 |
| 4 | 1 | 6, 5, 4, 2 | 1 2 4 5 6 3 |
| 5 | 3 | 6, 5, 4 | 1 2 3 4 5 6 |

Nine shifts in all, and the input has exactly nine inversions: the cost tracks how unsorted the data is.

## Merge sort: divide, sort, merge

**Merge sort** splits the array into two halves, sorts each half recursively, and then **merges** the two sorted halves into one. An array of one element is already sorted, which is where the recursion stops.

The merge is the part that does the work, and it is the two pointers idea on two arrays. Keep one pointer at the front of each sorted half. The smallest value not yet placed must be at one of the two fronts, because each half is sorted, so take the smaller front, place it, and advance that pointer. When one half runs out, copy the rest of the other. Each value is placed once, so merging two halves of total length m costs O(m).

```text
 [38 27 43 3 9 82 10]
 [38 27 43 3]          [9 82 10]           split until pieces have one element
 [38 27] [43 3]        [9 82] [10]
 [27 38] [3 43]        [9 82] [10]         merge pairs of sorted pieces
 [3 27 38 43]          [9 10 82]
 [3 9 10 27 38 43 82]                      the last merge
```

**Why it is O(n log n).** Each level of splitting halves the pieces, so there are about log₂ n levels. At every level, the merges together touch each of the n elements once. That is n work per level times log n levels — and it is the same for every input, sorted or not, so merge sort's worst case is O(n log n) too.

**Why it is stable.** When the two fronts are equal, the merge takes the one from the left half first (`<=`, not `<`). Equal values therefore keep their original order.

**Its cost** is memory: merging needs a buffer of n elements, so merge sort uses O(n) extra space, against quicksort's O(log n). That is the trade-off between the two.

### The code

The program prints every merge, so you can watch the sorted runs grow.

```cpp
#include <iostream>
#include <string>
#include <vector>
using namespace std;

string join(const vector<int>& a, int from, int to) {    // a[from..to] as "x y z"
    string out;
    for (int i = from; i <= to; i++) out += (i > from ? " " : "") + to_string(a[i]);
    return out;
}

// Merges the sorted runs a[lo..mid] and a[mid+1..hi] into one sorted run.
void merge(vector<int>& a, int lo, int mid, int hi, vector<int>& tmp) {
    int i = lo, j = mid + 1, k = lo;
    while (i <= mid && j <= hi) {
        if (a[i] <= a[j]) tmp[k++] = a[i++];   // <= takes the left value on a tie: stable
        else tmp[k++] = a[j++];
    }
    while (i <= mid) tmp[k++] = a[i++];        // copy whichever run is left over
    while (j <= hi) tmp[k++] = a[j++];
    cout << "merge [" << join(a, lo, mid) << "] + [" << join(a, mid + 1, hi) << "] -> ["
         << join(tmp, lo, hi) << "]\n";
    for (k = lo; k <= hi; k++) a[k] = tmp[k];
}

// Sorts a[lo..hi], both ends included.
void mergeSort(vector<int>& a, int lo, int hi, vector<int>& tmp) {
    if (lo >= hi) return;                      // one element (or none) is already sorted
    int mid = lo + (hi - lo) / 2;
    mergeSort(a, lo, mid, tmp);                // sort the left half
    mergeSort(a, mid + 1, hi, tmp);            // sort the right half
    merge(a, lo, mid, hi, tmp);                // combine the two sorted halves
}

int main() {
    vector<int> nums = {38, 27, 43, 3, 9, 82, 10};
    int n = (int)nums.size();
    cout << "before: " << join(nums, 0, n - 1) << "\n";
    vector<int> tmp(n);
    mergeSort(nums, 0, n - 1, tmp);
    cout << "after:  " << join(nums, 0, n - 1) << "\n";
    return 0;
}
```

```java
public class Main {
    static String join(int[] a, int from, int to) {          // a[from..to] as "x y z"
        StringBuilder out = new StringBuilder();
        for (int i = from; i <= to; i++) out.append(i > from ? " " : "").append(a[i]);
        return out.toString();
    }

    // Merges the sorted runs a[lo..mid] and a[mid+1..hi] into one sorted run.
    static void merge(int[] a, int lo, int mid, int hi, int[] tmp) {
        int i = lo, j = mid + 1, k = lo;
        while (i <= mid && j <= hi) {
            if (a[i] <= a[j]) tmp[k++] = a[i++];   // <= takes the left value on a tie: stable
            else tmp[k++] = a[j++];
        }
        while (i <= mid) tmp[k++] = a[i++];        // copy whichever run is left over
        while (j <= hi) tmp[k++] = a[j++];
        System.out.println("merge [" + join(a, lo, mid) + "] + [" + join(a, mid + 1, hi) + "] -> ["
                + join(tmp, lo, hi) + "]");
        for (k = lo; k <= hi; k++) a[k] = tmp[k];
    }

    // Sorts a[lo..hi], both ends included.
    static void mergeSort(int[] a, int lo, int hi, int[] tmp) {
        if (lo >= hi) return;                      // one element (or none) is already sorted
        int mid = lo + (hi - lo) / 2;
        mergeSort(a, lo, mid, tmp);                // sort the left half
        mergeSort(a, mid + 1, hi, tmp);            // sort the right half
        merge(a, lo, mid, hi, tmp);                // combine the two sorted halves
    }

    public static void main(String[] args) {
        int[] nums = {38, 27, 43, 3, 9, 82, 10};
        int n = nums.length;
        System.out.println("before: " + join(nums, 0, n - 1));
        mergeSort(nums, 0, n - 1, new int[n]);
        System.out.println("after:  " + join(nums, 0, n - 1));
    }
}
```

```python
def join(a, lo, hi):
    """a[lo..hi] as "x y z"."""
    return " ".join(str(x) for x in a[lo:hi + 1])


def merge(a, lo, mid, hi, tmp):
    """Merge the sorted runs a[lo..mid] and a[mid+1..hi] into one sorted run."""
    i, j, k = lo, mid + 1, lo
    while i <= mid and j <= hi:
        if a[i] <= a[j]:                       # <= takes the left value on a tie: stable
            tmp[k] = a[i]
            i += 1
        else:
            tmp[k] = a[j]
            j += 1
        k += 1
    tmp[k:hi + 1] = a[i:mid + 1] + a[j:hi + 1]  # copy whichever run is left over
    print(f"merge [{join(a, lo, mid)}] + [{join(a, mid + 1, hi)}] -> [{join(tmp, lo, hi)}]")
    a[lo:hi + 1] = tmp[lo:hi + 1]


def merge_sort(a, lo, hi, tmp):
    """Sort a[lo..hi], both ends included."""
    if lo >= hi:                               # one element (or none) is already sorted
        return
    mid = lo + (hi - lo) // 2
    merge_sort(a, lo, mid, tmp)                # sort the left half
    merge_sort(a, mid + 1, hi, tmp)            # sort the right half
    merge(a, lo, mid, hi, tmp)                 # combine the two sorted halves


nums = [38, 27, 43, 3, 9, 82, 10]
n = len(nums)
print("before:", join(nums, 0, n - 1))
merge_sort(nums, 0, n - 1, [0] * n)
print("after: ", join(nums, 0, n - 1))
```

```javascript
// a[from..to] as "x y z"
function join(a, from, to) {
  return a.slice(from, to + 1).join(" ");
}

// Merges the sorted runs a[lo..mid] and a[mid+1..hi] into one sorted run.
function merge(a, lo, mid, hi, tmp) {
  let i = lo;
  let j = mid + 1;
  let k = lo;
  while (i <= mid && j <= hi) {
    if (a[i] <= a[j]) tmp[k++] = a[i++]; // <= takes the left value on a tie: stable
    else tmp[k++] = a[j++];
  }
  while (i <= mid) tmp[k++] = a[i++]; // copy whichever run is left over
  while (j <= hi) tmp[k++] = a[j++];
  console.log(`merge [${join(a, lo, mid)}] + [${join(a, mid + 1, hi)}] -> [${join(tmp, lo, hi)}]`);
  for (k = lo; k <= hi; k++) a[k] = tmp[k];
}

// Sorts a[lo..hi], both ends included.
function mergeSort(a, lo, hi, tmp) {
  if (lo >= hi) return; // one element (or none) is already sorted
  const mid = lo + Math.floor((hi - lo) / 2);
  mergeSort(a, lo, mid, tmp); // sort the left half
  mergeSort(a, mid + 1, hi, tmp); // sort the right half
  merge(a, lo, mid, hi, tmp); // combine the two sorted halves
}

const nums = [38, 27, 43, 3, 9, 82, 10];
const n = nums.length;
console.log(`before: ${join(nums, 0, n - 1)}`);
mergeSort(nums, 0, n - 1, new Array(n));
console.log(`after:  ${join(nums, 0, n - 1)}`);
```

```output
before: 38 27 43 3 9 82 10
merge [38] + [27] -> [27 38]
merge [43] + [3] -> [3 43]
merge [27 38] + [3 43] -> [3 27 38 43]
merge [9] + [82] -> [9 82]
merge [9 82] + [10] -> [9 10 82]
merge [3 27 38 43] + [9 10 82] -> [3 9 10 27 38 43 82]
after:  3 9 10 27 38 43 82
```

The merge step is useful on its own. While merging, every time a value from the right half is placed before values still waiting in the left half, it was out of order with all of them — adding `mid − i + 1` at that moment counts every inversion in O(n log n). That is [Count Inversions](/problems/count-inversions).

## Quicksort: partition around a pivot

**Quicksort** turns merge sort inside out. Instead of sorting halves and then combining them, it first **partitions**: it picks a value called the **pivot** and rearranges the range so that everything smaller than the pivot comes before it and everything else after it. The pivot is then in its final place, and the two sides are sorted recursively. No merge is needed — and no buffer.

The partition used here is **Lomuto's**. Park the pivot at the end of the range. Keep an index `store`: everything before `store` is known to be smaller than the pivot. Walk `i` across the range; whenever `a[i]` is smaller than the pivot, swap it to `store` and advance `store`. Finally swap the pivot into `store`. At every step the range reads "smaller than pivot | not smaller | not yet seen", which is the invariant that makes it correct. This is the read-and-write pointer pattern from the two pointers lesson.

**Choosing the pivot** decides the speed. If every pivot lands near the middle of its range, there are about log₂ n levels of O(n) partitioning: O(n log n). If every pivot is the smallest or largest value, one side is empty each time, there are n levels, and the work is about n²/2 — O(n²). Taking the first or last element as the pivot hits that worst case on an array that is already sorted, which is common in real data. Production quicksorts therefore pick a **random** element, the middle element, or the median of three, and swap it to the end before partitioning; with a random pivot the expected cost is O(n log n) for every input. The code below uses the middle element, which handles sorted input well and keeps the output easy to follow.

Two more facts worth knowing: quicksort is **not stable** (the long swaps jump equal values past each other), and its recursion uses O(log n) stack space on average. Many equal values slow Lomuto's partition down, because equal values all land on one side; a three-way partition into smaller, equal and larger — the Dutch national flag partition of [Sort Colors](/problems/sort-colors) — fixes that.

### Dry run

Partitioning `[7, 2, 9, 4, 1, 8, 3]`. The middle element, 4, is swapped to the end, giving `[7, 2, 9, 3, 1, 8, 4]`:

| i | a[i] | Smaller than 4? | Action | Array afterwards | store |
| --- | --- | --- | --- | --- | --- |
| 0 | 7 | no | none | 7 2 9 3 1 8 4 | 0 |
| 1 | 2 | yes | swap a[1] with a[0] | 2 7 9 3 1 8 4 | 1 |
| 2 | 9 | no | none | 2 7 9 3 1 8 4 | 1 |
| 3 | 3 | yes | swap a[3] with a[1] | 2 3 9 7 1 8 4 | 2 |
| 4 | 1 | yes | swap a[4] with a[2] | 2 3 1 7 9 8 4 | 3 |
| 5 | 8 | no | none | 2 3 1 7 9 8 4 | 3 |
| end | | | swap pivot into a[3] | 2 3 1 4 9 8 7 | 3 |

The 4 is now exactly where it belongs in the sorted array, with the three smaller values on its left.

### The code

```cpp
#include <iostream>
#include <string>
#include <utility>
#include <vector>
using namespace std;

string join(const vector<int>& a, int from, int to) {    // a[from..to] as "x y z"
    string out;
    for (int i = from; i <= to; i++) out += (i > from ? " " : "") + to_string(a[i]);
    return out;
}

// Lomuto partition of a[lo..hi]: returns the pivot's final index.
int partition(vector<int>& a, int lo, int hi) {
    int mid = lo + (hi - lo) / 2;
    swap(a[mid], a[hi]);                       // pivot: the middle element, parked at the end
    int pivot = a[hi];
    int store = lo;                            // a[lo..store-1] holds values < pivot
    for (int i = lo; i < hi; i++) {
        if (a[i] < pivot) {
            swap(a[i], a[store]);
            store++;
        }
    }
    swap(a[store], a[hi]);                     // the pivot drops into its final place
    return store;
}

void quickSort(vector<int>& a, int lo, int hi) {
    if (lo >= hi) return;
    int p = partition(a, lo, hi);
    cout << "pivot " << a[p] << ": [" << join(a, lo, p - 1) << "] " << a[p] << " ["
         << join(a, p + 1, hi) << "]\n";
    quickSort(a, lo, p - 1);                   // sort the smaller values
    quickSort(a, p + 1, hi);                   // sort the larger values
}

int main() {
    vector<int> nums = {7, 2, 9, 4, 1, 8, 3};
    int n = (int)nums.size();
    cout << "before: " << join(nums, 0, n - 1) << "\n";
    quickSort(nums, 0, n - 1);
    cout << "after:  " << join(nums, 0, n - 1) << "\n";
    return 0;
}
```

```java
public class Main {
    static String join(int[] a, int from, int to) {          // a[from..to] as "x y z"
        StringBuilder out = new StringBuilder();
        for (int i = from; i <= to; i++) out.append(i > from ? " " : "").append(a[i]);
        return out.toString();
    }

    static void swap(int[] a, int i, int j) {
        int t = a[i];
        a[i] = a[j];
        a[j] = t;
    }

    // Lomuto partition of a[lo..hi]: returns the pivot's final index.
    static int partition(int[] a, int lo, int hi) {
        int mid = lo + (hi - lo) / 2;
        swap(a, mid, hi);                          // pivot: the middle element, parked at the end
        int pivot = a[hi];
        int store = lo;                            // a[lo..store-1] holds values < pivot
        for (int i = lo; i < hi; i++) {
            if (a[i] < pivot) {
                swap(a, i, store);
                store++;
            }
        }
        swap(a, store, hi);                        // the pivot drops into its final place
        return store;
    }

    static void quickSort(int[] a, int lo, int hi) {
        if (lo >= hi) return;
        int p = partition(a, lo, hi);
        System.out.println("pivot " + a[p] + ": [" + join(a, lo, p - 1) + "] " + a[p] + " ["
                + join(a, p + 1, hi) + "]");
        quickSort(a, lo, p - 1);                   // sort the smaller values
        quickSort(a, p + 1, hi);                   // sort the larger values
    }

    public static void main(String[] args) {
        int[] nums = {7, 2, 9, 4, 1, 8, 3};
        int n = nums.length;
        System.out.println("before: " + join(nums, 0, n - 1));
        quickSort(nums, 0, n - 1);
        System.out.println("after:  " + join(nums, 0, n - 1));
    }
}
```

```python
def join(a, lo, hi):
    """a[lo..hi] as "x y z"."""
    return " ".join(str(x) for x in a[lo:hi + 1])


def partition(a, lo, hi):
    """Lomuto partition of a[lo..hi]: return the pivot's final index."""
    mid = lo + (hi - lo) // 2
    a[mid], a[hi] = a[hi], a[mid]              # pivot: the middle element, parked at the end
    pivot = a[hi]
    store = lo                                 # a[lo..store-1] holds values < pivot
    for i in range(lo, hi):
        if a[i] < pivot:
            a[i], a[store] = a[store], a[i]
            store += 1
    a[store], a[hi] = a[hi], a[store]          # the pivot drops into its final place
    return store


def quick_sort(a, lo, hi):
    if lo >= hi:
        return
    p = partition(a, lo, hi)
    print(f"pivot {a[p]}: [{join(a, lo, p - 1)}] {a[p]} [{join(a, p + 1, hi)}]")
    quick_sort(a, lo, p - 1)                   # sort the smaller values
    quick_sort(a, p + 1, hi)                   # sort the larger values


nums = [7, 2, 9, 4, 1, 8, 3]
n = len(nums)
print("before:", join(nums, 0, n - 1))
quick_sort(nums, 0, n - 1)
print("after: ", join(nums, 0, n - 1))
```

```javascript
// a[from..to] as "x y z"
function join(a, from, to) {
  return a.slice(from, to + 1).join(" ");
}

function swap(a, i, j) {
  const t = a[i];
  a[i] = a[j];
  a[j] = t;
}

// Lomuto partition of a[lo..hi]: returns the pivot's final index.
function partition(a, lo, hi) {
  const mid = lo + Math.floor((hi - lo) / 2);
  swap(a, mid, hi); // pivot: the middle element, parked at the end
  const pivot = a[hi];
  let store = lo; // a[lo..store-1] holds values < pivot
  for (let i = lo; i < hi; i++) {
    if (a[i] < pivot) {
      swap(a, i, store);
      store++;
    }
  }
  swap(a, store, hi); // the pivot drops into its final place
  return store;
}

function quickSort(a, lo, hi) {
  if (lo >= hi) return;
  const p = partition(a, lo, hi);
  console.log(`pivot ${a[p]}: [${join(a, lo, p - 1)}] ${a[p]} [${join(a, p + 1, hi)}]`);
  quickSort(a, lo, p - 1); // sort the smaller values
  quickSort(a, p + 1, hi); // sort the larger values
}

const nums = [7, 2, 9, 4, 1, 8, 3];
const n = nums.length;
console.log(`before: ${join(nums, 0, n - 1)}`);
quickSort(nums, 0, n - 1);
console.log(`after:  ${join(nums, 0, n - 1)}`);
```

```output
before: 7 2 9 4 1 8 3
pivot 4: [2 3 1] 4 [9 8 7]
pivot 3: [2 1] 3 []
pivot 2: [1] 2 []
pivot 8: [7] 8 [9]
after:  1 2 3 4 7 8 9
```

Partitioning alone is enough when you need only one position of the sorted order. To find the k-th largest value, partition once and recurse into the *one* side that contains position k; on average that costs O(n), not O(n log n). The algorithm is called **quickselect**, and it solves [Kth Largest Element in an Array](/problems/kth-largest-element-in-an-array) (a [heap](/roadmap/heap) is the other standard answer).

## Counting sort: no comparisons at all

When the values are small integers — exam marks from 0 to 100, ages, letters — you do not need to compare them. **Counting sort** counts how many times each value occurs, then writes the values out in order:

```text
values in 0 .. k-1
count[v] += 1 for every value v              O(n)
for v in 0 .. k-1: write v, count[v] times   O(n + k)
```

That is O(n + k) time and O(k) extra space, which beats O(n log n) whenever k is not much larger than n. To sort records by a small integer key rather than bare numbers, turn the counts into starting positions (a running total: the slot for key v starts after all smaller keys) and place each record at its key's next free slot while walking the input from left to right. Records with equal keys come out in input order, so this version is stable — the property that lets **radix sort** sort numbers digit by digit with a counting sort per digit. [Height Checker](/problems/height-checker) and [Relative Sort Array](/problems/relative-sort-array) are counting sorts in disguise. When k is huge (values up to 10⁹), counting sort's array is too big, and a comparison sort is the right tool.

## Stability and sorting by several keys

A sort is **stable** if elements that compare as equal keep the order they had in the input. For bare numbers this cannot be observed — one 7 looks like another. For records it is visible and often essential.

Suppose students must be listed by score, highest first, and alphabetically among equal scores. There are two correct ways:

- **One comparator that breaks ties.** Compare the scores; only when they are equal, compare the names. Any sort, stable or not, gives the right answer, because no two students compare as equal.
- **Two passes with a stable sort.** Sort by name, then *stably* by score. The second sort keeps the alphabetical order within each score, because a stable sort never reorders equal elements. This is how spreadsheets sort by several columns: the last sort is the main key.

With an unstable sort the second method breaks: the students on 82 could come out in any order. The program shows a stable sort by score alone (ties stay in input order), then both methods giving the same, correct list.

### The code

```cpp
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

struct Student {
    string name;
    int score;
};

string show(const vector<Student>& list) {
    string out;
    for (size_t i = 0; i < list.size(); i++)
        out += (i > 0 ? ", " : "") + list[i].name + " " + to_string(list[i].score);
    return out;
}

int main() {
    vector<Student> students = {{"Ravi", 82}, {"Asha", 91}, {"Meena", 82},
                                {"Kiran", 75}, {"Dev", 91}, {"Anil", 82}};
    auto byScoreDesc = [](const Student& a, const Student& b) { return a.score > b.score; };
    auto byName = [](const Student& a, const Student& b) { return a.name < b.name; };

    vector<Student> scoreOnly = students;
    stable_sort(scoreOnly.begin(), scoreOnly.end(), byScoreDesc);   // ties keep input order
    cout << "score only, stable: " << show(scoreOnly) << "\n";

    vector<Student> one = students;
    sort(one.begin(), one.end(), [](const Student& a, const Student& b) {
        if (a.score != b.score) return a.score > b.score;           // main key: score, high first
        return a.name < b.name;                                      // tie: name, A to Z
    });
    cout << "one comparator:     " << show(one) << "\n";

    vector<Student> two = students;
    stable_sort(two.begin(), two.end(), byName);         // secondary key first ...
    stable_sort(two.begin(), two.end(), byScoreDesc);    // ... then stably by the main key
    cout << "two stable sorts:   " << show(two) << "\n";
    return 0;
}
```

```java
import java.util.Arrays;
import java.util.Comparator;

public class Main {
    static class Student {
        final String name;
        final int score;

        Student(String name, int score) {
            this.name = name;
            this.score = score;
        }
    }

    static String show(Student[] list) {
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < list.length; i++)
            out.append(i > 0 ? ", " : "").append(list[i].name).append(" ").append(list[i].score);
        return out.toString();
    }

    public static void main(String[] args) {
        Student[] students = {new Student("Ravi", 82), new Student("Asha", 91), new Student("Meena", 82),
                              new Student("Kiran", 75), new Student("Dev", 91), new Student("Anil", 82)};
        Comparator<Student> byScoreDesc = (a, b) -> Integer.compare(b.score, a.score);
        Comparator<Student> byName = (a, b) -> a.name.compareTo(b.name);

        Student[] scoreOnly = students.clone();
        Arrays.sort(scoreOnly, byScoreDesc);              // objects use TimSort: stable
        System.out.println("score only, stable: " + show(scoreOnly));

        Student[] one = students.clone();
        Arrays.sort(one, byScoreDesc.thenComparing(byName));   // main key, then name on a tie
        System.out.println("one comparator:     " + show(one));

        Student[] two = students.clone();
        Arrays.sort(two, byName);                         // secondary key first ...
        Arrays.sort(two, byScoreDesc);                    // ... then stably by the main key
        System.out.println("two stable sorts:   " + show(two));
    }
}
```

```python
students = [("Ravi", 82), ("Asha", 91), ("Meena", 82),
            ("Kiran", 75), ("Dev", 91), ("Anil", 82)]


def show(rows):
    return ", ".join(f"{name} {score}" for name, score in rows)


score_only = sorted(students, key=lambda s: -s[1])      # sorted() is stable: ties keep input order
print(f"score only, stable: {show(score_only)}")

one = sorted(students, key=lambda s: (-s[1], s[0]))     # main key, then name on a tie
print(f"one comparator:     {show(one)}")

two = sorted(students, key=lambda s: s[0])              # secondary key first ...
two = sorted(two, key=lambda s: -s[1])                  # ... then stably by the main key
print(f"two stable sorts:   {show(two)}")
```

```javascript
const students = [
  { name: "Ravi", score: 82 }, { name: "Asha", score: 91 }, { name: "Meena", score: 82 },
  { name: "Kiran", score: 75 }, { name: "Dev", score: 91 }, { name: "Anil", score: 82 },
];
const byScoreDesc = (a, b) => b.score - a.score;
const byName = (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
const show = (list) => list.map((s) => `${s.name} ${s.score}`).join(", ");

const scoreOnly = students.slice().sort(byScoreDesc); // stable since ES2019: ties keep input order
console.log(`score only, stable: ${show(scoreOnly)}`);

const one = students.slice().sort((a, b) => byScoreDesc(a, b) || byName(a, b)); // main key, then name
console.log(`one comparator:     ${show(one)}`);

const two = students.slice().sort(byName).sort(byScoreDesc); // secondary key first, then the main key
console.log(`two stable sorts:   ${show(two)}`);
```

```output
score only, stable: Asha 91, Dev 91, Ravi 82, Meena 82, Anil 82, Kiran 75
one comparator:     Asha 91, Dev 91, Anil 82, Meena 82, Ravi 82, Kiran 75
two stable sorts:   Asha 91, Dev 91, Anil 82, Meena 82, Ravi 82, Kiran 75
```

A comparator returns a negative number when the first argument should come first, a positive one when the second should, and zero for a tie (C++ instead wants a "less than" that returns `true` or `false`). Two rules keep comparators correct. They must be consistent — if a comes before b and b before c, then a comes before c — or the sort may crash or loop. And `b - a` for descending order can overflow in Java when values are near the integer limits; `Integer.compare(b, a)` cannot. Custom orders are whole problems in their own right: [Sort Array by Increasing Frequency](/problems/sort-array-by-increasing-frequency) sorts by two keys, and [Largest Number](/problems/largest-number) compares two numbers by which concatenation is bigger.

## What your language's sort actually does

| Call | Algorithm | Stable? |
| --- | --- | --- |
| C++ `std::sort` | introsort (in GCC's library): quicksort that switches to heap sort if recursion gets too deep, and insertion sort for small pieces; O(n log n) worst case | no |
| C++ `std::stable_sort` | merge sort | yes |
| Java `Arrays.sort(int[])` and other primitives | dual-pivot quicksort | no (equal numbers are indistinguishable) |
| Java `Arrays.sort(Object[])`, `Collections.sort`, `List.sort` | TimSort | yes |
| Python `sorted`, `list.sort` | TimSort | yes |
| JavaScript `Array.prototype.sort` | TimSort in V8 (Node, Chrome) | yes, required since ES2019 |

**TimSort** is a merge sort designed for real data, which is often partly ordered already. It finds the runs that are already sorted (reversing descending ones), extends short runs with insertion sort, and merges runs cleverly, so an already sorted input costs O(n) and the worst case is O(n log n). **Introsort** starts as quicksort for speed and falls back to heap sort if the recursion grows deeper than about 2 log n, which caps the worst case at O(n log n).

One JavaScript trap deserves its own line: `[10, 9, 1, 100].sort()` gives `[1, 10, 100, 9]`, because without a comparator JavaScript converts the values to strings and compares those. Always pass `(a, b) => a - b` to sort numbers.

## Why no comparison sort beats n log n

Every algorithm in this lesson except counting sort learns about the data only by comparing two elements. Picture its run as a tree of questions: each comparison is a node with two outcomes, and each leaf is one final order. The input could be any of the n! orderings of n distinct values, and each must end at a different leaf, or two different inputs would be "sorted" by the same rearrangement. A binary tree with n! leaves has height at least log₂(n!), and log₂(n!) is about n log₂ n − 1.44 n. So every comparison sort needs on the order of n log n comparisons in the worst case. For n = 10, that is at least 22 comparisons, since 2²¹ is less than 10! = 3,628,800. Merge sort and heap sort meet this bound; nothing that only compares can beat it. Counting sort escapes only because it reads values as array indices instead of comparing them.

## Time and space complexity

| Algorithm | Best | Average | Worst | Extra space | Stable |
| --- | --- | --- | --- | --- | --- |
| Bubble sort (stops when a pass makes no swap) | O(n) | O(n²) | O(n²) | O(1) | yes |
| Selection sort | O(n²) | O(n²) | O(n²) | O(1) | no |
| Insertion sort | O(n) | O(n²) | O(n²) | O(1) | yes |
| Merge sort | O(n log n) | O(n log n) | O(n log n) | O(n) | yes |
| Quicksort | O(n log n) | O(n log n) | O(n²) | O(log n) average | no |
| Heap sort | O(n log n) | O(n log n) | O(n log n) | O(1) | no |
| Counting sort (keys 0..k−1) | O(n + k) | O(n + k) | O(n + k) | O(n + k) | yes |
| TimSort | O(n) | O(n log n) | O(n log n) | O(n) | yes |
| Introsort | O(n log n) | O(n log n) | O(n log n) | O(log n) | no |

In practice: use the library sort; know that it is O(n log n); and reach for counting sort when the keys are small integers. The O(n²) sorts belong to interviews and to tiny inputs — at n = 10⁵ they take billions of steps.

## How to recognise a sorting problem

- The answer depends on **order**, not on original positions: the closest pair, the largest perimeter, the k-th largest, "return the result in any order".
- You want to **pair things up** — the smallest with the smallest, the largest with the smallest — as in assigning cookies or boats.
- **Duplicates or groups** must be found, counted or removed.
- **Intervals or events** must be processed in time order.
- A greedy rule needs "the next smallest" or "the earliest finishing" item again and again.
- The values are **small integers** in a known range: count instead of compare.
- The statement says "return the indices": sort pairs of value and index, so the indices travel with their values.

## Common mistakes

- **Sorting numbers in JavaScript without a comparator.** The default sort compares strings, so 100 lands before 9. Pass `(a, b) => a - b`.
- **Overflowing comparators.** `a - b` in Java or C++ overflows for values near the integer limits and returns the wrong sign. Use `Integer.compare(a, b)` or plain comparisons.
- **Relying on stability you do not have.** `std::sort` and Java's primitive sort are not stable. If ties must keep their order, use `std::stable_sort`, a tie-breaking comparator, or Java's object sort.
- **An inconsistent comparator.** A C++ comparator must be a strict "less than": returning `true` for equal elements (`<=`) is undefined behaviour and can crash `std::sort`.
- **Choosing the first element as quicksort's pivot.** Sorted input then costs O(n²). Use the middle, a random element or the median of three.
- **Losing the original indices.** Sorting values alone forgets where they came from; sort (value, index) pairs instead.

## Practice in this order

Start with problems that only need the right sort call, then move to the ones that need a custom order or a sorting algorithm's inner idea:

1. [Height Checker](/problems/height-checker): sort, compare with the original — or count, since heights are small.
2. [Relative Sort Array](/problems/relative-sort-array): a custom order, solved neatly by counting sort.
3. [Sort Array by Increasing Frequency](/problems/sort-array-by-increasing-frequency): two keys, one ascending and one descending.
4. [Largest Perimeter Triangle](/problems/largest-perimeter-triangle): sort, then a greedy check on neighbours.
5. [Sort Colors](/problems/sort-colors): three-way partitioning, quicksort's partition in one pass.
6. [Sort an Array](/problems/sort-an-array): write merge sort or quicksort yourself, without the library.
7. [Kth Largest Element in an Array](/problems/kth-largest-element-in-an-array): quickselect, the partition without the full sort.
8. [Largest Number](/problems/largest-number): a comparator that compares concatenations.
9. [Count Inversions](/problems/count-inversions): merge sort that counts while it merges.

The [sorting problem list](/challenges/sorting) has every problem in the catalogue that leans on sorting. Sorting is also where most greedy solutions begin, which is the next lesson of this stage: [greedy algorithms](/roadmap/greedy-algorithms).
