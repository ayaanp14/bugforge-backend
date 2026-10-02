---
title: Heaps and Priority Queues
stage: heaps
order: 3
minutes: 12
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
Many problems keep asking **which item is the smallest right now?** — the next task by deadline, the closest point so far, the two heaviest stones left — while new items keep arriving, so sorting once does not help. A **heap** answers in O(1) and absorbs each new item in O(log n) by keeping far less order than a sorted list: just enough to know the minimum. It is the structure inside every priority queue.

## Why a sorted array or a plain array is too slow

An **unsorted array** adds in O(1) but scans everything for the minimum; a **sorted array** has the minimum at one end but shifts every new item into place. Either way one operation is linear, and 10⁵ additions plus 10⁵ removals cost around 5 × 10⁹ steps. A heap makes **both** O(log n), about 17 steps each.

| Operation | Unsorted array | Sorted array | Binary heap |
| --- | --- | --- | --- |
| Read the minimum | O(n) | O(1) | O(1) |
| Add an item | O(1) | O(n) | O(log n) |
| Remove the minimum | O(n) | O(1), kept in descending order | O(log n) |
| Build from n items | O(1) | O(n log n) | O(n) |

## How a heap is stored

A **min-heap** is a binary tree with two properties. The **heap property**: every parent is no larger than its children, so the root holds the minimum (a **max-heap** flips the rule). The **shape property**: the tree is **complete**, every level full except the last, which fills from the left. With no gaps, the tree fits exactly into an array:

@figure storage

A complete tree of n nodes has height ⌊log₂ n⌋: a million items stand 19 levels below the root. The rule is weaker than a [binary search tree](/roadmap/binary-search-tree)'s, which can find any value, and that missing order is what makes a heap cheap to maintain.

## The operations and their cost

**Push** puts the new value in the next free slot, keeping the tree complete, then swaps it upwards while its parent is larger: **sift-up**. **Pop** removes the root, moves the **last** value into its place and swaps it downwards while a child is smaller: **sift-down**. Each walks one root-to-leaf path, so both are O(log n); reading the minimum is `data[0]`, O(1).

@walkthrough

Why must sift-down pick the **smaller** child?

@figure smaller-child

### The code

The same hand-written `MinHeap` in all four languages, with the array exposed as `data`. The program pushes six values, prints the array, pops everything, then finds the k largest values (explained below).

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

The heap array `1 2 8 7 4 9` is not sorted, yet every pop returns the smallest value left. That contrast is the whole idea of a heap.

## Building a heap in O(n), and heap sort

Pushing n values one by one costs O(n log n). **Heapify** is faster: sift down every node that has children, from index n / 2 − 1 back to the root. Each node's subtrees are already heaps when it is sifted, so one sift-down fixes its subtree. It is linear because most nodes are near the bottom, where a sift-down is short:

@figure heapify-cost

Python's `heapq.heapify` and C++'s `std::make_heap` build in linear time. **Heap sort** follows: heapify as a **max-heap**, swap the maximum to its final place at the end, sift the new root down within what is left, repeat.

@figure heap-sort

```text
heapSort(a):                                  # ascending order, in place
    n = length(a)
    for i from n/2 - 1 down to 0:
        siftDown(a, i, n)                     # build a max-heap: O(n)
    for end from n - 1 down to 1:
        swap a[0] and a[end]                  # the largest left goes to its final place
        siftDown(a, 0, end)                   # repair the heap in a[0 .. end-1]
```

It is O(n log n) in every case with O(1) extra memory, but it is not stable and is unkind to the cache, so library sorts prefer other methods (see [sorting algorithms](/roadmap/sorting-algorithms)).

## Heaps in each language's library

You will mostly use the library's heap. The traps are the default order and the method names:

| Language | What to use | Default | For the other order |
| --- | --- | --- | --- |
| C++ | `std::priority_queue<T>` from `<queue>` | max-heap: `top()` is the largest | `priority_queue<T, vector<T>, greater<T>>` |
| Java | `java.util.PriorityQueue<E>` | min-heap: `peek()` is the smallest | `new PriorityQueue<>(Collections.reverseOrder())` |
| Python | `heapq` functions on a plain list | min-heap: `h[0]` is the smallest | push `-x`, negate again on the way out |
| JavaScript | nothing built in | | a small class like the one above, with a comparator |

C++'s `pop()` returns nothing, so read `top()` first.

## The patterns

Almost every heap problem is one of four shapes.

### The top k: a heap of size k

To find the k largest values, keep a **min-heap** of at most k and pop whenever it grows to k + 1. Its root is the weakest of the current top k, exactly the one a better value should push out — which is why the k **largest** use a **min**-heap:

@figure top-k

It costs O(n log k) time and O(k) memory, and works on a stream too large to store. The k smallest, or the [k closest points](/problems/k-closest-points-to-origin), use a **max**-heap of size k.

### Merging k sorted lists

Put each list's first item in a min-heap, tagged with its list; pop the smallest, write it out, push the next item from its list. The heap holds at most k items, so N items cost O(N log k). [Kth Smallest Element in a Sorted Matrix](/problems/kth-smallest-element-in-a-sorted-matrix) merges the rows.

### Two heaps: the running median

Split the numbers so far into a **max-heap** `low` for the smaller half and a **min-heap** `high` for the larger, with `low` the same size or one bigger; the median is then read from the tops in O(1).

@figure two-heaps

Why does it stay right? Whatever moves from `low` to `high` is the largest of `low` and the new value, so it is at least everything left behind, and the halves stay ordered. This program uses the library heaps, with negated values for Python's max-heap:

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

### Scheduling: the best option available now

Sort events by time; as time moves on, push what becomes available and pop the best of it — rooms by end time in [Meeting Rooms II](/problems/meeting-rooms-ii), ladders in [Furthest Building You Can Reach](/problems/furthest-building-you-can-reach). The same loop runs [Dijkstra's algorithm](/roadmap/dijkstras-algorithm) and Prim's [minimum spanning tree](/roadmap/minimum-spanning-tree). A heap cannot delete an arbitrary item cheaply, so [Sliding Window Maximum](/problems/sliding-window-maximum) uses **lazy deletion**: discard a stale entry when it reaches the top.

## Time and space complexity

| Operation or pattern | Time | Extra space |
| --- | --- | --- |
| Push, pop | O(log n) | O(1) beyond the heap |
| Heapify n values | O(n) | O(1), in place |
| Top k of n values | O(n log k) | O(k) |
| Merge k sorted lists of N items in total | O(N log k) | O(k) |
| Running median, per new value | O(log n), median read in O(1) | O(n) |
| Find or delete an arbitrary value | O(n) | O(1) |

## How to recognise a heap problem

- The **k largest, smallest, closest or most frequent**, or the kth of them.
- Repeatedly **take the smallest or largest, change it, put it back**: stones, sticks, piles.
- Items **arrive over time** and the best available must be served: tasks, meetings, orders.
- Several **sorted sequences** to merge, or numbers generated in increasing order.
- The **median** of a growing stream.

## Common mistakes

- **Assuming the default order**: `std::priority_queue` is a max-heap; Java's `PriorityQueue` and Python's `heapq` are min-heaps.
- **Overflowing comparators**: `(a, b) -> b - a` overflows in Java; use `Integer.compare(b, a)`.
- **The wrong heap for the top k**: the k largest need a min-heap of size k, not a max-heap of everything.
- **Expecting sorted iteration**: a heap prints its internal array; pop to get order.
- **Uncomparable ties in Python**: `(priority, item)` compares items on a tie; put a counter in the middle.
- **Popping an empty heap**: undefined in C++, `null` in Java, `IndexError` in Python.

## Practice in this order

1. [Last Stone Weight](/problems/last-stone-weight): a max-heap simulation.
2. [Relative Ranks](/problems/relative-ranks): pop the scores in order to hand out places.
3. [Kth Largest Element in an Array](/problems/kth-largest-element-in-an-array): a min-heap of size k.
4. [K Closest Points to Origin](/problems/k-closest-points-to-origin): a max-heap keyed on distance.
5. [Sort Characters By Frequency](/problems/sort-characters-by-frequency): count, then pop by count.
6. [Ugly Number II](/problems/ugly-number-ii): numbers in increasing order, skipping duplicates.
7. [Kth Smallest Element in a Sorted Matrix](/problems/kth-smallest-element-in-a-sorted-matrix): a k-way merge of the rows.
8. [Furthest Building You Can Reach](/problems/furthest-building-you-can-reach): a heap decides where the ladders go.
9. [Sliding Window Maximum](/problems/sliding-window-maximum): lazy deletion, then the faster monotonic deque.

The [heap problem list](/challenges/heap) has every heap problem in the catalogue. The last lesson of this stage is the [trie](/roadmap/trie), a tree with up to 26 children per node that answers questions about prefixes.
