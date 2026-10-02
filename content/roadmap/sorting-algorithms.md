---
title: Sorting Algorithms
stage: greedy
order: 1
minutes: 14
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
Sorting is the most common first step in algorithm problems: once the data is in order, duplicates sit together, the closest values are neighbours, and two pointers and binary search become possible. Every language has a sort built in, but interviews ask you to write merge sort or quicksort, their inner ideas — merging, partitioning, counting — solve other problems, and you need to know whether your library's sort is stable and what it costs.

## Why sorting comes first

*What is the smallest difference between any two numbers in an array?* Comparing every pair costs n(n − 1)/2 checks, about five billion for n = 100,000. Sorting first costs about 1.7 million comparisons, and then only the n − 1 neighbouring pairs need checking.

## The idea: order puts related values side by side

Why only neighbours? If `a ≤ b ≤ c`, then `c − a = (c − b) + (b − a)`, which is at least either gap on its own: a pair that skips over a value can never be closer than the neighbours inside it. Sorting is what made that argument available.

@walkthrough

The same happens again and again: equal values become adjacent, sums become monotone for [two pointers](/roadmap/two-pointers) and [binary search](/roadmap/binary-search), [intervals](/roadmap/intervals) sorted by start merge in one sweep, and [greedy algorithms](/roadmap/greedy-algorithms) usually need the data in order first.

## The simple sorts: bubble, selection and insertion

These three are O(n²), and each is asked in interviews:

- **Bubble sort** swaps out-of-order neighbours pass after pass, carrying the largest value to the end; a pass with no swap ends it early. Stable.
- **Selection sort** swaps the smallest remaining value to the front, n − 1 times: always n(n − 1)/2 comparisons, at most n − 1 swaps. Unstable.
- **Insertion sort** grows a sorted prefix, shifting larger values right to make a gap.

@figure insertion

Each shift fixes one **inversion**, so insertion sort costs O(n + d) for d inversions. That, and its tiny constant factors, is why introsort and TimSort hand short pieces to it.

## Merge sort: divide, sort, merge

**Merge sort** sorts each half recursively and **merges** the two sorted halves. The merge is two pointers on two arrays: the smallest value not yet placed is at one of the two fronts, so take the smaller front.

@figure merge

It is O(n log n) on every input — about log₂ n levels, each touching every element once — and stable, because on equal fronts the merge takes the left one (`<=`, not `<`). Its cost is an O(n) buffer.

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

A value from the right half placed before `mid − i + 1` values still waiting on the left was out of order with all of them; summing those counts every inversion in O(n log n): [Count Inversions](/problems/count-inversions).

## Quicksort: partition around a pivot

**Quicksort** turns merge sort inside out: it **partitions** around a **pivot** first, so the pivot lands in its final place, then sorts the two sides — no merge, no buffer. **Lomuto's** partition is the read-and-write pointer pattern from two pointers.

@figure partition

**The pivot decides the speed.** Pivots near the middle give about log₂ n levels; a pivot that is always the smallest or largest leaves one side empty and costs about n²/2. The first or last element does exactly that on sorted input, so real quicksorts pick a random element, the middle one or the median of three.

@figure pivot-depth

Quicksort is **not stable**, and many equal values slow Lomuto's partition; a three-way partition, as in [Sort Colors](/problems/sort-colors), fixes that.

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

To find only the k-th largest value, partition and recurse into the *one* side that holds position k: O(n) on average. That is **quickselect**, for [Kth Largest Element in an Array](/problems/kth-largest-element-in-an-array) (a [heap](/roadmap/heap) is the other answer).

## Counting sort: no comparisons at all

When the values are small integers — marks, ages, letters — **counting sort** counts each value instead of comparing: O(n + k) for keys 0 to k − 1.

@figure counting

Being stable is what lets **radix sort** sort digit by digit. [Height Checker](/problems/height-checker) and [Relative Sort Array](/problems/relative-sort-array) are counting sorts in disguise; with keys up to 10⁹, use a comparison sort.

## Stability and sorting by several keys

A sort is **stable** if equal elements keep their input order — invisible for numbers, essential for records. To list students by score and alphabetically within a score, write **one comparator that breaks ties**, or **sort twice**: by name, then *stably* by score.

@figure stability

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

A comparator returns a negative number when the first argument comes first, positive when the second does, zero for a tie; C++ wants a strict "less than" instead. Prefer `Integer.compare(b, a)` to `b - a`, which can overflow. [Largest Number](/problems/largest-number) compares two numbers by which concatenation is bigger.

## What your language's sort actually does

| Call | Algorithm | Stable? |
| --- | --- | --- |
| C++ `std::sort` | introsort | no |
| C++ `std::stable_sort` | merge sort | yes |
| Java `Arrays.sort` on primitives | dual-pivot quicksort | no |
| Java `Arrays.sort` on objects, `Collections.sort` | TimSort | yes |
| Python `sorted`, `list.sort` | TimSort | yes |
| JavaScript `Array.prototype.sort` | TimSort in V8 | yes, since ES2019 |

**TimSort** merges runs that are already sorted, so sorted input costs O(n). **Introsort** is quicksort that falls back to heap sort when recursion gets too deep, and to insertion sort for small pieces. One JavaScript trap: `[10, 9, 1, 100].sort()` compares strings and gives `[1, 10, 100, 9]`; pass `(a, b) => a - b`.

## Why no comparison sort beats n log n

Every sort here except counting sort learns about the data only by comparing two elements.

@figure decision-tree

log₂(n!) is about n log₂ n − 1.44 n, so merge sort and heap sort are as good as comparing gets; counting sort escapes only by using values as indices.

## Time and space complexity

| Algorithm | Best | Worst | Extra space | Stable |
| --- | --- | --- | --- | --- |
| Bubble sort | O(n) | O(n²) | O(1) | yes |
| Selection sort | O(n²) | O(n²) | O(1) | no |
| Insertion sort | O(n) | O(n²) | O(1) | yes |
| Merge sort | O(n log n) | O(n log n) | O(n) | yes |
| Quicksort | O(n log n) | O(n²) | O(log n) | no |
| Heap sort | O(n log n) | O(n log n) | O(1) | no |
| Counting sort | O(n + k) | O(n + k) | O(n + k) | yes |
| TimSort | O(n) | O(n log n) | O(n) | yes |

Quicksort's average is O(n log n). In practice, use the library sort, and count instead of comparing when the keys are small integers.

## How to recognise a sorting problem

- The answer depends on **order**, not original positions: the closest pair, the largest perimeter, the k-th largest.
- You want to **pair things up** — smallest with smallest, largest with smallest.
- A greedy rule keeps needing "the next smallest" or "the earliest finishing" item.
- The values are **small integers** in a known range: count instead of compare.

## Common mistakes

- **Sorting numbers in JavaScript without a comparator**, so 100 lands before 9.
- **Overflowing comparators**: `a - b` near the integer limits returns the wrong sign.
- **Relying on stability you do not have**: `std::sort` and Java's primitive sort are not stable.
- **The first element as quicksort's pivot**, which makes sorted input O(n²).
- **Losing the original indices**: sort (value, index) pairs instead of values.

## Practice in this order

1. [Height Checker](/problems/height-checker): sort and compare — or count, since heights are small.
2. [Relative Sort Array](/problems/relative-sort-array): a custom order, neatly a counting sort.
3. [Sort Array by Increasing Frequency](/problems/sort-array-by-increasing-frequency): two keys, one ascending and one descending.
4. [Largest Perimeter Triangle](/problems/largest-perimeter-triangle): sort, then a greedy check on neighbours.
5. [Sort Colors](/problems/sort-colors): three-way partitioning in one pass.
6. [Sort an Array](/problems/sort-an-array): write merge sort or quicksort yourself.
7. [Kth Largest Element in an Array](/problems/kth-largest-element-in-an-array): quickselect.
8. [Largest Number](/problems/largest-number): a comparator on concatenations.
9. [Count Inversions](/problems/count-inversions): merge sort that counts while it merges.

The [sorting problem list](/challenges/sorting) has every problem in the catalogue that leans on sorting. Most greedy solutions begin with a sort, which is the next lesson of this stage: [greedy algorithms](/roadmap/greedy-algorithms).
