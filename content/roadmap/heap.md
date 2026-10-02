---
title: Heaps and Priority Queues
stage: heaps
order: 3
minutes: 22
level: Intermediate
hub: heap
practice: last-stone-weight, relative-ranks, kth-largest-element-in-an-array, k-closest-points-to-origin, sort-characters-by-frequency, ugly-number-ii, kth-smallest-element-in-a-sorted-matrix, furthest-building-you-can-reach, sliding-window-maximum
updated: 2026-10-03
seo-title: Heap Data Structure: Min-Heap, Max-Heap and Priority Queue
description: Learn heaps and priority queues: sift-up, sift-down, O(n) heapify, heap sort, top-k and two heaps for a running median, in C++, Java, Python and JavaScript.
question: What is a heap data structure?
answer: A heap is a complete binary tree, stored in an array, in which every parent is no larger than its children (a min-heap) or no smaller (a max-heap), so the smallest or largest item always sits at the root. Adding an item and removing the root each repair one root-to-leaf path in O(log n) time, which makes the heap the standard way to implement a priority queue.
q: Is a priority queue the same as a heap?
a: A priority queue is the job: add items, and always take out the most urgent one first. A binary heap is the usual way to do that job, which is why the libraries name their heap-backed classes priority queues — std::priority_queue in C++ and PriorityQueue in Java. A sorted list or a balanced search tree could do the same job, but with a slower insert or more memory.
q: Is std::priority_queue a min-heap or a max-heap?
a: A max-heap: top() returns the largest element by default. For a min-heap, give it the greater comparator — priority_queue<int, vector<int>, greater<int>>. Java's PriorityQueue and Python's heapq are the other way round: both are min-heaps by default.
q: How do I make a max-heap in Python?
a: The heapq functions keep a min-heap, so push each value negated and negate it again when you pop it; for tuples, negate the priority field. Python 3.14 added max-heap functions such as heappush_max and heappop_max, but many judges run older versions, so negation is the portable habit.
q: Why is building a heap O(n) and not O(n log n)?
a: Bottom-up heapify sifts down every parent, from the last one back to the root. Half the nodes are leaves and do nothing, a quarter can sink at most one level, an eighth at most two, and that sum stays below n swaps in total. Pushing the items one at a time is O(n log n) in the worst case, because the many nodes near the bottom may each climb the whole height.
q: When should I use a heap instead of sorting?
a: Use a heap when items keep arriving, when the best item changes after each step, or when you need only the top k. Sorting answers once in O(n log n); a heap hands over the next smallest item at any moment in O(log n), and keeping the top k in a heap of size k costs O(n log k) time and O(k) memory, so it works on a stream too large to hold.
---
Many problems keep asking the same question: **which item is the smallest right now?** The next task by deadline, the closest of the points seen so far, the cheapest road out of the cities reached, the two heaviest stones left. New items keep arriving between the questions, so sorting once at the start does not help.

A **heap** answers that question in O(1) and absorbs each new item in O(log n). It manages this by keeping far less order than a sorted list — just enough to know the minimum — and it is the structure inside every priority queue. This lesson shows how a heap is stored, the two operations that keep it valid, why building one takes only linear time, heap sort, each language's library heap, and the four patterns that cover most heap problems. Every example is shown in C++, Java, Python and JavaScript.

## Why a sorted array or a plain array is too slow

Consider the two obvious ways to keep a collection from which you repeatedly remove the minimum. An **unsorted array** adds an item in O(1), but finding the minimum means scanning everything: O(n). A **sorted array** has the minimum at one end, but each new item must be shifted into place: O(n).

Either way, one of the two operations is linear. With 100,000 additions and 100,000 removals, that is around 5 × 10⁹ steps — far beyond the hundred million or so a judge allows in a second. A heap makes **both** operations O(log n): about 17 steps each when n = 10⁵, so the same workload takes a few million steps.

| Operation | Unsorted array | Sorted array | Binary heap |
| --- | --- | --- | --- |
| Read the minimum | O(n) | O(1) | O(1) |
| Add an item | O(1) | O(n) | O(log n) |
| Remove the minimum | O(n) | O(1), kept in descending order | O(log n) |
| Build from n items | O(1) | O(n log n) | O(n) |

## How a heap is stored

A **min-heap** is a binary tree with two properties:

- **The heap property**: every parent is less than or equal to each of its children. Following any path down from the root, values never decrease, so the root holds the minimum. A **max-heap** flips the rule, and its root holds the maximum.
- **The shape property**: the tree is **complete** — every level is full except possibly the last, which is filled from the left with no gaps.

The shape property is what makes a heap cheap to store. Number the nodes level by level, left to right, starting from 0. Because there are no gaps, those numbers run from 0 to n − 1 with nothing missing, so the tree fits exactly into an array — no pointers at all. The links are arithmetic:

- the children of index i are at **2i + 1** and **2i + 2**;
- the parent of index i is at **(i − 1) / 2**, rounded down.

```text
                2                    index:  0  1  2  3  4  5  6
             /     \                 array: [2, 5, 3, 7, 9, 6, 8]
            5       3
           / \     / \               children of 1 (value 5): 3 and 4 (values 7, 9)
          7   9   6   8              parent of 5 (value 6):   (5 - 1) / 2 = 2 (value 3)
```

A complete tree with n nodes has height ⌊log₂ n⌋, so a million items stand only 19 levels below the root. Note what a heap is **not**: it is not sorted. The rule only orders parents against their children, so siblings and cousins may be in any order — above, 5 sits before 3 in the array. That missing order is exactly what makes a heap cheaper to maintain than a sorted list. (It is also a different rule from a [binary search tree](/roadmap/binary-search-tree)'s, which orders left against right and so can find any value, not just the minimum.)

## The operations and their cost

**Push.** Put the new value in the next free slot — the end of the array — which keeps the tree complete. Now only one place can break the heap property: between the new value and its parent. If the parent is larger, swap them, and repeat one level up. This is **sift-up**. It stops when the parent is smaller or the value reaches the root.

**Pop.** The minimum is at the root, so remove it — but that leaves a hole at the top. Move the **last** value of the array into the root, which keeps the tree complete, and the only possible violation is now between the root and its children. If the value is larger than a child, swap it with the **smaller** of its two children and repeat one level down. This is **sift-down**.

Why the smaller child? After the swap, that child becomes the parent of its former sibling. It is the smaller of the two, so it is no larger than the sibling, and the heap property holds at that node. Swapping with the larger child would put a larger value above a smaller one and break it.

Each operation walks one path between the root and a leaf, doing a constant amount of work per level, so push and pop are both O(log n). Reading the minimum is O(1): it is `data[0]`. The figure below pushes 4 into the heap above and then pops the minimum, showing the tree and the array together.

@walkthrough

### Dry run

Push 4 into `[2, 5, 3, 7, 9, 6, 8]`: it lands at index 7, then climbs.

| Step | Index of 4 | Parent index | Parent value | Action | Array afterwards |
| --- | --- | --- | --- | --- | --- |
| 1 | 7 | 3 | 7 | 4 < 7, swap | [2, 5, 3, 4, 9, 6, 8, 7] |
| 2 | 3 | 1 | 5 | 4 < 5, swap | [2, 4, 3, 5, 9, 6, 8, 7] |
| 3 | 1 | 0 | 2 | 4 > 2, stop | [2, 4, 3, 5, 9, 6, 8, 7] |

Now pop: the minimum 2 leaves, and the last value, 7, moves into the root of `[7, 4, 3, 5, 9, 6, 8]`.

| Step | Index of 7 | Children's values | Smaller child | Action | Array afterwards |
| --- | --- | --- | --- | --- | --- |
| 1 | 0 | 4, 3 | 3 at index 2 | 7 > 3, swap | [3, 4, 7, 5, 9, 6, 8] |
| 2 | 2 | 6, 8 | 6 at index 5 | 7 > 6, swap | [3, 4, 6, 5, 9, 7, 8] |
| 3 | 5 | none | | a leaf, stop | [3, 4, 6, 5, 9, 7, 8] |

The new minimum, 3, is at the root after two swaps.

### The code

The same hand-written `MinHeap` in all four languages, so the programs stay parallel: `push`, `pop`, `peek` and `size`, with the array exposed as `data`. The program pushes six values, prints the array (not sorted), pops everything (sorted), and then uses the heap for the most common heap pattern, the k largest values, explained below.

```cpp
#include <iostream>
#include <string>
#include <utility>
#include <vector>
using namespace std;

// A min-heap: every parent is no larger than its children, so data[0] is the minimum.
class MinHeap {
public:
    vector<int> data;                             // the tree, read level by level

    int size() const { return (int)data.size(); }
    int peek() const { return data[0]; }

    void push(int value) {
        data.push_back(value);                    // the next free slot keeps the tree complete
        int i = size() - 1;
        while (i > 0 && data[(i - 1) / 2] > data[i]) {
            swap(data[(i - 1) / 2], data[i]);     // sift up past a larger parent
            i = (i - 1) / 2;
        }
    }

    int pop() {
        int top = data[0];
        int last = data.back();
        data.pop_back();
        if (!data.empty()) data[0] = last;        // the last value fills the root
        int i = 0;
        while (true) {
            int smallest = i, l = 2 * i + 1, r = 2 * i + 2;
            if (l < size() && data[l] < data[smallest]) smallest = l;
            if (r < size() && data[r] < data[smallest]) smallest = r;
            if (smallest == i) break;             // no child is smaller: it has settled
            swap(data[i], data[smallest]);        // sift down towards the smaller child
            i = smallest;
        }
        return top;
    }
};

// The k largest values: a min-heap of size k, whose root is the weakest of them.
vector<int> topK(const vector<int>& nums, int k) {
    MinHeap heap;
    for (int x : nums) {
        heap.push(x);
        if (heap.size() > k) heap.pop();          // evict the smallest of the k + 1
    }
    vector<int> out;
    while (heap.size() > 0) out.push_back(heap.pop());
    return out;
}

void print(const string& label, const vector<int>& values) {
    cout << label << ":";
    for (int v : values) cout << " " << v;
    cout << "\n";
}

int main() {
    MinHeap heap;
    for (int x : {7, 2, 9, 4, 1, 8}) heap.push(x);
    print("Heap array", heap.data);
    cout << "Minimum: " << heap.peek() << "\n";
    vector<int> order;
    while (heap.size() > 0) order.push_back(heap.pop());
    print("Popped in order", order);
    print("3 largest of 3 1 9 4 7 2 8 6", topK({3, 1, 9, 4, 7, 2, 8, 6}, 3));
    return 0;
}
```

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Main {
    // A min-heap: every parent is no larger than its children, so data.get(0) is the minimum.
    static class MinHeap {
        final List<Integer> data = new ArrayList<>(); // the tree, read level by level

        int size() { return data.size(); }
        int peek() { return data.get(0); }

        void push(int value) {
            data.add(value);                          // the next free slot keeps the tree complete
            int i = size() - 1;
            while (i > 0 && data.get((i - 1) / 2) > data.get(i)) {
                Collections.swap(data, (i - 1) / 2, i); // sift up past a larger parent
                i = (i - 1) / 2;
            }
        }

        int pop() {
            int top = data.get(0);
            int last = data.remove(size() - 1);
            if (size() > 0) data.set(0, last);        // the last value fills the root
            int i = 0;
            while (true) {
                int smallest = i, l = 2 * i + 1, r = 2 * i + 2;
                if (l < size() && data.get(l) < data.get(smallest)) smallest = l;
                if (r < size() && data.get(r) < data.get(smallest)) smallest = r;
                if (smallest == i) break;             // no child is smaller: it has settled
                Collections.swap(data, i, smallest);  // sift down towards the smaller child
                i = smallest;
            }
            return top;
        }
    }

    // The k largest values: a min-heap of size k, whose root is the weakest of them.
    static List<Integer> topK(int[] nums, int k) {
        MinHeap heap = new MinHeap();
        for (int x : nums) {
            heap.push(x);
            if (heap.size() > k) heap.pop();          // evict the smallest of the k + 1
        }
        List<Integer> out = new ArrayList<>();
        while (heap.size() > 0) out.add(heap.pop());
        return out;
    }

    static void print(String label, List<Integer> values) {
        StringBuilder line = new StringBuilder(label + ":");
        for (int v : values) line.append(" ").append(v);
        System.out.println(line);
    }

    public static void main(String[] args) {
        MinHeap heap = new MinHeap();
        for (int x : new int[] {7, 2, 9, 4, 1, 8}) heap.push(x);
        print("Heap array", heap.data);
        System.out.println("Minimum: " + heap.peek());
        List<Integer> order = new ArrayList<>();
        while (heap.size() > 0) order.add(heap.pop());
        print("Popped in order", order);
        print("3 largest of 3 1 9 4 7 2 8 6", topK(new int[] {3, 1, 9, 4, 7, 2, 8, 6}, 3));
    }
}
```

```python
class MinHeap:
    """Every parent is no larger than its children, so data[0] is the minimum."""

    def __init__(self):
        self.data = []                            # the tree, read level by level

    def size(self):
        return len(self.data)

    def peek(self):
        return self.data[0]

    def push(self, value):
        d = self.data
        d.append(value)                           # the next free slot keeps the tree complete
        i = len(d) - 1
        while i > 0 and d[(i - 1) // 2] > d[i]:
            p = (i - 1) // 2
            d[p], d[i] = d[i], d[p]               # sift up past a larger parent
            i = p

    def pop(self):
        d = self.data
        top = d[0]
        last = d.pop()
        if d:
            d[0] = last                           # the last value fills the root
        i = 0
        while True:
            smallest, l, r = i, 2 * i + 1, 2 * i + 2
            if l < len(d) and d[l] < d[smallest]:
                smallest = l
            if r < len(d) and d[r] < d[smallest]:
                smallest = r
            if smallest == i:                     # no child is smaller: it has settled
                break
            d[i], d[smallest] = d[smallest], d[i]  # sift down towards the smaller child
            i = smallest
        return top


def top_k(nums, k):
    """The k largest values: a min-heap of size k, whose root is the weakest of them."""
    heap = MinHeap()
    for x in nums:
        heap.push(x)
        if heap.size() > k:
            heap.pop()                            # evict the smallest of the k + 1
    out = []
    while heap.size() > 0:
        out.append(heap.pop())
    return out


heap = MinHeap()
for x in [7, 2, 9, 4, 1, 8]:
    heap.push(x)
print("Heap array:", *heap.data)
print("Minimum:", heap.peek())
order = []
while heap.size() > 0:
    order.append(heap.pop())
print("Popped in order:", *order)
print("3 largest of 3 1 9 4 7 2 8 6:", *top_k([3, 1, 9, 4, 7, 2, 8, 6], 3))
```

```javascript
// A min-heap: every parent is no larger than its children, so data[0] is the minimum.
class MinHeap {
  constructor() {
    this.data = []; // the tree, read level by level
  }

  size() { return this.data.length; }
  peek() { return this.data[0]; }

  push(value) {
    const d = this.data;
    d.push(value); // the next free slot keeps the tree complete
    let i = d.length - 1;
    while (i > 0 && d[Math.floor((i - 1) / 2)] > d[i]) {
      const p = Math.floor((i - 1) / 2);
      [d[p], d[i]] = [d[i], d[p]]; // sift up past a larger parent
      i = p;
    }
  }

  pop() {
    const d = this.data;
    const top = d[0];
    const last = d.pop();
    if (d.length > 0) d[0] = last; // the last value fills the root
    let i = 0;
    for (;;) {
      let smallest = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < d.length && d[l] < d[smallest]) smallest = l;
      if (r < d.length && d[r] < d[smallest]) smallest = r;
      if (smallest === i) break; // no child is smaller: it has settled
      [d[i], d[smallest]] = [d[smallest], d[i]]; // sift down towards the smaller child
      i = smallest;
    }
    return top;
  }
}

// The k largest values: a min-heap of size k, whose root is the weakest of them.
function topK(nums, k) {
  const heap = new MinHeap();
  for (const x of nums) {
    heap.push(x);
    if (heap.size() > k) heap.pop(); // evict the smallest of the k + 1
  }
  const out = [];
  while (heap.size() > 0) out.push(heap.pop());
  return out;
}

const heap = new MinHeap();
for (const x of [7, 2, 9, 4, 1, 8]) heap.push(x);
console.log(`Heap array: ${heap.data.join(" ")}`);
console.log(`Minimum: ${heap.peek()}`);
const order = [];
while (heap.size() > 0) order.push(heap.pop());
console.log(`Popped in order: ${order.join(" ")}`);
console.log(`3 largest of 3 1 9 4 7 2 8 6: ${topK([3, 1, 9, 4, 7, 2, 8, 6], 3).join(" ")}`);
```

```output
Heap array: 1 2 8 7 4 9
Minimum: 1
Popped in order: 1 2 4 7 8 9
3 largest of 3 1 9 4 7 2 8 6: 7 8 9
```

The heap array `1 2 8 7 4 9` is not sorted, yet every pop returns the smallest remaining value. That contrast is the whole idea of a heap.

## Building a heap in O(n), and heap sort

To turn an unsorted array of n values into a heap, you could push them one by one: n pushes at O(log n) each, O(n log n). There is a faster way, **heapify**: leave the values where they are and sift down every node that has children, starting from the last one, index n / 2 − 1, and working back to the root. When a node is sifted down, both of its subtrees are already heaps, so one sift-down makes its own subtree a heap; by the time the root is done, the whole array is.

Why is that O(n) and not O(n log n)? A sift-down costs at most the node's height above the leaves, and most nodes are low:

| Height above the leaves | Nodes, about | Swaps each, at most | Swaps in total, at most |
| --- | --- | --- | --- |
| 0 (the leaves) | n / 2 | 0 | 0 |
| 1 | n / 4 | 1 | n / 4 |
| 2 | n / 8 | 2 | n / 4 |
| 3 | n / 16 | 3 | 3n / 16 |
| h | n / 2ʰ⁺¹ | h | hn / 2ʰ⁺¹ |

The last column adds up to n × (1/4 + 2/8 + 3/16 + …), and that series sums to exactly 1, so heapify does at most about n swaps. Pushing one at a time is slower for the opposite reason: the many nodes at the **bottom** are the ones that may have to climb the whole height. Python's `heapq.heapify` and C++'s `std::make_heap` both build in linear time.

**Heap sort** follows directly. Heapify the array as a **max-heap**. The maximum is at index 0, so swap it with the last element — its final position — and sift the new root down within the remaining n − 1 elements. Repeat, shrinking the heap by one each time.

```text
heapSort(a):                                  # ascending order, in place
    n = length(a)
    for i from n/2 - 1 down to 0:
        siftDown(a, i, n)                     # build a max-heap: O(n)
    for end from n - 1 down to 1:
        swap a[0] and a[end]                  # the largest left goes to its final place
        siftDown(a, 0, end)                   # repair the heap in a[0 .. end-1]
```

It runs in O(n log n) in every case, with O(1) extra memory, which neither quicksort (O(n²) worst case) nor merge sort (O(n) extra) can both claim. It is not stable, and its jumps around the array are unkind to the cache, which is why library sorts prefer other methods; see [sorting algorithms](/roadmap/sorting-algorithms). In interviews, heap sort matters mostly as the proof that you understand sift-down.

## Heaps in each language's library

You will write a heap by hand rarely; you will use the library's constantly. The traps are the default order and the method names:

| Language | What to use | Default | For the other order |
| --- | --- | --- | --- |
| C++ | `std::priority_queue<T>` from `<queue>` | max-heap: `top()` is the largest | `priority_queue<T, vector<T>, greater<T>>` |
| Java | `java.util.PriorityQueue<E>` | min-heap: `peek()` is the smallest | `new PriorityQueue<>(Collections.reverseOrder())` |
| Python | `heapq` functions on a plain list | min-heap: `h[0]` is the smallest | push `-x`, negate again on the way out |
| JavaScript | nothing built in | | a small class like the one above, with a comparator |

- **C++**: `push(x)`, `top()`, `pop()`, `size()`, `empty()`. `pop()` returns nothing, so read `top()` first. For pairs, the comparison is by the first element, then the second.
- **Java**: `add(x)` or `offer(x)`, `peek()`, `poll()` (both return `null` on an empty queue), `size()`. Pass a comparator for objects: `(a, b) -> Integer.compare(a[0], b[0])`.
- **Python**: `heapq.heappush(h, x)`, `heapq.heappop(h)`, `h[0]` to look, `heapq.heapify(h)` in O(n), and `heapq.nlargest(k, items)` for a one-off top k. Push tuples `(priority, tiebreak, item)` to order records.

Iterating over any of them — printing a Java `PriorityQueue`, looping over a `heapq` list — gives the internal array order, not sorted order.

## The patterns

Almost every heap problem is one of four shapes.

### The top k: a heap of size k

To find the k largest of n values, keep a **min-heap** holding at most k of them. Push each value; whenever the heap grows to k + 1, pop. The root is always the smallest of the values kept — the weakest member of the current top k — so it is exactly the one a better value should push out. That is why the k **largest** use a **min**-heap. Here is the `topK` call from the program above:

| Value | After pushing | Evicted | Kept |
| --- | --- | --- | --- |
| 3, 1, 9 | 1, 3, 9 | | 1, 3, 9 |
| 4 | 1, 3, 4, 9 | 1 | 3, 4, 9 |
| 7 | 3, 4, 7, 9 | 3 | 4, 7, 9 |
| 2 | 2, 4, 7, 9 | 2 | 4, 7, 9 |
| 8 | 4, 7, 8, 9 | 4 | 7, 8, 9 |
| 6 | 6, 7, 8, 9 | 6 | 7, 8, 9 |

Cost: O(n log k) time and O(k) memory, better than sorting when k is small, and possible on a stream you cannot store. The k smallest, or the [k closest points](/problems/k-closest-points-to-origin), use a **max**-heap of size k by the same argument. [Kth Largest Element in an Array](/problems/kth-largest-element-in-an-array) is the root at the end; [quickselect](/challenges/quickselect) solves it in O(n) on average.

### Merging k sorted lists

To merge k sorted lists, put the **first** item of each list into a min-heap, tagged with the list it came from. Pop the smallest, write it out, and push the next item from the same list. The heap never holds more than k items, so merging N items in total costs O(N log k). [Kth Smallest Element in a Sorted Matrix](/problems/kth-smallest-element-in-a-sorted-matrix) treats each row as a sorted list and pops k times. [Ugly Number II](/problems/ugly-number-ii) is the same idea generating its own lists: pop the smallest ugly number, push it times 2, 3 and 5, and skip duplicates.

### Two heaps: the running median

To report the median of a stream after every new number, split the numbers seen so far into two halves: a **max-heap** `low` holding the smaller half and a **min-heap** `high` holding the larger half. Keep two promises: every value in `low` is at most every value in `high`, and `low` holds the same number of values as `high` or one more. Then the median is the top of `low` when the count is odd, and the average of the two tops when it is even — O(1) to read.

To add x: push it into `low`, then move `low`'s largest value to `high`. Whatever moves is the largest of `low` together with x, so it is at least everything that stays, and the first promise holds. If `high` is now bigger than `low`, move `high`'s smallest value back, which restores the second. Each step is a constant number of heap operations: O(log n).

| Add | low (smaller half) | high (larger half) | Median |
| --- | --- | --- | --- |
| 5 | 5 | | 5.0 |
| 15 | 5 | 15 | 10.0 |
| 1 | 1, 5 | 15 | 5.0 |
| 3 | 1, 3 | 5, 15 | 4.0 |
| 8 | 1, 3, 5 | 8, 15 | 5.0 |
| 7 | 1, 3, 5 | 7, 8, 15 | 6.0 |
| 9 | 1, 3, 5, 7 | 8, 9, 15 | 7.0 |
| 10 | 1, 3, 5, 7 | 8, 9, 10, 15 | 7.5 |

This version uses the library heaps where they exist — a max-heap and a min-heap in C++ and Java, negated values for the max-heap in Python — and a small comparator heap in JavaScript.

```cpp
#include <iomanip>
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

priority_queue<int> low;                              // max-heap: the smaller half
priority_queue<int, vector<int>, greater<int>> high;  // min-heap: the larger half

void add(int x) {
    low.push(x);
    high.push(low.top());                             // the largest of the small half moves up
    low.pop();
    if (high.size() > low.size()) {                   // keep low the same size or one bigger
        low.push(high.top());
        high.pop();
    }
}

double median() {
    if (low.size() > high.size()) return low.top();
    return ((long long)low.top() + high.top()) / 2.0; // 64-bit: two big ints can overflow
}

int main() {
    cout << fixed << setprecision(1);
    for (int x : {5, 15, 1, 3, 8, 7, 9, 10}) {
        add(x);
        cout << "After " << x << ": median " << median() << "\n";
    }
    return 0;
}
```

```java
import java.util.Collections;
import java.util.PriorityQueue;

public class Main {
    static PriorityQueue<Integer> low = new PriorityQueue<>(Collections.reverseOrder()); // max-heap: the smaller half
    static PriorityQueue<Integer> high = new PriorityQueue<>();                         // min-heap: the larger half

    static void add(int x) {
        low.add(x);
        high.add(low.poll());                             // the largest of the small half moves up
        if (high.size() > low.size()) low.add(high.poll()); // keep low the same size or one bigger
    }

    static double median() {
        if (low.size() > high.size()) return low.peek();
        return ((long) low.peek() + high.peek()) / 2.0;   // 64-bit: two big ints can overflow
    }

    public static void main(String[] args) {
        for (int x : new int[] {5, 15, 1, 3, 8, 7, 9, 10}) {
            add(x);
            System.out.println("After " + x + ": median " + String.format("%.1f", median()));
        }
    }
}
```

```python
import heapq

low = []    # max-heap of the smaller half, stored negated because heapq is a min-heap
high = []   # min-heap of the larger half


def add(x):
    heapq.heappush(low, -x)
    heapq.heappush(high, -heapq.heappop(low))   # the largest of the small half moves up
    if len(high) > len(low):                    # keep low the same size or one bigger
        heapq.heappush(low, -heapq.heappop(high))


def median():
    if len(low) > len(high):
        return -low[0]
    return (-low[0] + high[0]) / 2


for x in [5, 15, 1, 3, 8, 7, 9, 10]:
    add(x)
    print(f"After {x}: median {median():.1f}")
```

```javascript
// JavaScript has no heap, so here is a small one that takes a comparator.
class Heap {
  constructor(before) {
    this.data = [];
    this.before = before; // before(a, b) is true when a belongs nearer the root
  }
  size() { return this.data.length; }
  peek() { return this.data[0]; }
  push(value) {
    const d = this.data;
    d.push(value);
    let i = d.length - 1;
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (!this.before(d[i], d[p])) break;
      [d[i], d[p]] = [d[p], d[i]];
      i = p;
    }
  }
  pop() {
    const d = this.data;
    const top = d[0];
    const last = d.pop();
    if (d.length > 0) d[0] = last;
    let i = 0;
    for (;;) {
      let best = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < d.length && this.before(d[l], d[best])) best = l;
      if (r < d.length && this.before(d[r], d[best])) best = r;
      if (best === i) break;
      [d[i], d[best]] = [d[best], d[i]];
      i = best;
    }
    return top;
  }
}

const low = new Heap((a, b) => a > b); // max-heap: the smaller half
const high = new Heap((a, b) => a < b); // min-heap: the larger half

function add(x) {
  low.push(x);
  high.push(low.pop()); // the largest of the small half moves up
  if (high.size() > low.size()) low.push(high.pop()); // keep low the same size or one bigger
}

function median() {
  if (low.size() > high.size()) return low.peek();
  return (low.peek() + high.peek()) / 2;
}

for (const x of [5, 15, 1, 3, 8, 7, 9, 10]) {
  add(x);
  console.log(`After ${x}: median ${median().toFixed(1)}`);
}
```

```output
After 5: median 5.0
After 15: median 10.0
After 1: median 5.0
After 3: median 4.0
After 8: median 5.0
After 7: median 6.0
After 9: median 7.0
After 10: median 7.5
```

### Scheduling: always take the best option available now

The fourth shape uses a heap as a to-do list ordered by urgency. Sort the events by time, and as time moves forward, push what becomes available and pop the best of it. To count meeting rooms, sort the meetings by start time and keep a min-heap of the end times of rooms in use (see [Meeting Rooms II](/problems/meeting-rooms-ii)): if the earliest-ending room is free when a meeting starts, pop it and reuse it; the heap's largest size is the number of rooms needed. [Furthest Building You Can Reach](/problems/furthest-building-you-can-reach) keeps the climbs covered by ladders in a min-heap, and when there are more climbs than ladders, the smallest one is paid for with bricks instead. [Last Stone Weight](/problems/last-stone-weight) is the plainest version: a max-heap, pop the two heaviest, push back the difference. The same "cheapest next step" loop runs [Dijkstra's algorithm](/roadmap/dijkstras-algorithm) and Prim's [minimum spanning tree](/roadmap/minimum-spanning-tree).

One limitation shapes these solutions: a heap cannot remove an arbitrary item cheaply, because finding it is O(n). The standard workaround is **lazy deletion** — leave a stale entry in the heap and throw it away when it reaches the top. [Sliding Window Maximum](/problems/sliding-window-maximum) can store (value, index) pairs in a max-heap and pop the top while its index has left the window; a [monotonic deque](/roadmap/monotonic-stack) does the same job in O(n).

## Time and space complexity

| Operation or pattern | Time | Extra space |
| --- | --- | --- |
| Peek at the minimum | O(1) | O(1) |
| Push, pop | O(log n) | O(1) beyond the heap |
| Heapify n values | O(n) | O(1), in place |
| Heap sort | O(n log n) in every case | O(1) |
| Top k of n values | O(n log k) | O(k) |
| Merge k sorted lists of N items in total | O(N log k) | O(k) |
| Running median, per new value | O(log n), median read in O(1) | O(n) |
| Find or delete an arbitrary value | O(n) | O(1) |

The heap itself takes O(n) space for n items, in a plain array with no pointers.

## How to recognise a heap problem

- The statement asks for the **k largest, smallest, closest or most frequent**, or the kth of them.
- You repeatedly **take the smallest or largest, change it, and put it back**: stones smashed, sticks joined, gifts taken from the richest pile.
- Items **arrive over time** and you must always serve the best one available: tasks for a CPU, meetings for rooms, orders in a backlog.
- Several **sorted sequences** must be merged, or numbers must be produced in increasing order from rules.
- The question wants the **median** or another order statistic of a stream that keeps growing.
- A graph problem asks for the **cheapest** path or connection with weights on the edges.

## Common mistakes

- **Assuming the default order.** `std::priority_queue` is a max-heap; Java's `PriorityQueue` and Python's `heapq` are min-heaps. Decide which end you need before writing the declaration.
- **Overflowing comparators.** In Java, `(a, b) -> b - a` overflows when the values are large or of opposite signs and then orders them wrongly. Use `Integer.compare(b, a)` or `Collections.reverseOrder()`.
- **Using the wrong heap for the top k.** The k largest need a min-heap of size k, not a max-heap of everything. A max-heap of all n values works but costs O(n) memory and O(n log n) time.
- **Expecting sorted iteration.** Printing or looping over a heap shows its internal array. Pop repeatedly to get sorted order.
- **Uncomparable ties in Python.** Pushing `(priority, item)` compares the items when two priorities are equal, which fails for dictionaries or custom objects. Put a counter in the middle: `(priority, count, item)`.
- **Popping an empty heap.** C++ `top()` and `pop()` on an empty queue are undefined behaviour, Java's `poll()` returns `null`, and Python raises `IndexError`. Check the size first.

## Practice in this order

Start with problems where the heap is the whole solution, then move to ones where you have to choose the key and the pattern:

1. [Last Stone Weight](/problems/last-stone-weight): a max-heap simulation — pop two, push the difference.
2. [Relative Ranks](/problems/relative-ranks): pop the scores in order to hand out the places.
3. [Kth Largest Element in an Array](/problems/kth-largest-element-in-an-array): a min-heap of size k; its root is the answer.
4. [K Closest Points to Origin](/problems/k-closest-points-to-origin): the same pattern with a max-heap keyed on distance.
5. [Sort Characters By Frequency](/problems/sort-characters-by-frequency): count first, then pop characters by count.
6. [Ugly Number II](/problems/ugly-number-ii): generate numbers in increasing order from a heap, skipping duplicates.
7. [Kth Smallest Element in a Sorted Matrix](/problems/kth-smallest-element-in-a-sorted-matrix): a k-way merge of the rows.
8. [Furthest Building You Can Reach](/problems/furthest-building-you-can-reach): a heap that decides greedily where the ladders go.
9. [Sliding Window Maximum](/problems/sliding-window-maximum): a heap with lazy deletion, then the faster monotonic deque.

The [heap problem list](/challenges/heap) has every heap problem in the catalogue, from easy to hard. The last lesson of this stage is the [trie](/roadmap/trie), a tree with up to 26 children per node that answers questions about prefixes.
