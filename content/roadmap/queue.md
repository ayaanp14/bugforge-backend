---
title: Queues and Deques
stage: stacks
order: 3
minutes: 12
level: Beginner
hub: queue
practice: time-needed-to-buy-tickets, number-of-students-unable-to-eat-lunch, first-unique-character-in-a-string, find-the-winner-of-the-circular-game, reveal-cards-in-increasing-order, dota2-senate, number-of-people-aware-of-a-secret
updated: 2026-10-03
seo-title: Queue Data Structure: FIFO, Circular Buffer and Deque
description: Learn queues and deques: FIFO, the circular buffer, a queue from two stacks and each language's API, with code in C++, Java, Python and JavaScript.
question: What is a queue data structure?
answer: A queue is a collection where the first item added is the first one removed — first in, first out (FIFO), like a line at a counter. Items join at the back (enqueue) and leave from the front (dequeue), both in O(1) time when the queue is a circular buffer or a linked list. Queues drive breadth-first search, scheduling and buffering.
q: What is the difference between a stack and a queue?
a: A stack is last in, first out: the newest item leaves first, and everything happens at one end. A queue is first in, first out: items join at the back and the oldest leaves from the front. Use a stack when the most recent unfinished item must be handled first, and a queue when items must be handled in the order they arrived.
q: What is a deque?
a: A deque, short for double-ended queue and pronounced "deck", lets you add and remove items at both the front and the back in O(1). It can act as a stack, a queue or both at once, and it is the structure behind the monotonic deque used for sliding-window maximum.
q: Why is list.pop(0) slow in Python?
a: A Python list is a dynamic array, so removing the first element shifts every remaining element one place to the left, which is O(n). A queue that dequeues this way turns an O(n) algorithm into O(n²). Use collections.deque, whose append and popleft are both O(1).
q: How do you implement a queue using two stacks?
a: Push new items onto an inbox stack. To dequeue, take from an outbox stack; when the outbox is empty, first pop everything from the inbox and push it onto the outbox, which reverses the order and puts the oldest item on top. Each item is moved at most once, so every operation is O(1) amortised.
q: What is a circular queue?
a: A circular queue stores its items in a fixed array and treats the end of the array as joined to the start. It keeps the index of the front item and a count; the back is (front + count) mod capacity. Neither enqueue nor dequeue shifts anything, so both are O(1), and slots freed at the front are reused.
---
A **queue** is a line at a counter: people join at the back and are served from the front, so whoever arrived first leaves first. That rule is **first in, first out**, or FIFO, the mirror image of the [stack](/roadmap/stack)'s last in, first out. Whenever work must be handled in the order it arrived — print jobs, network packets, requests to a server, the nodes of a graph discovered one layer at a time — a queue is doing it.

## Why a plain array is the wrong queue

The obvious queue is an array: append at the back, remove from index 0. But removing index 0 shifts every remaining element one place left, so serving n items costs about n²/2 moves — around 5 × 10⁹ for a breadth-first search over 100,000 nodes. Python's `list.pop(0)` and JavaScript's `array.shift()` look innocent and do exactly this. The fix is not to move the elements at all, but to move the **front**.

@figure shift-cost

## The idea: first in, first out

A queue offers **enqueue** (put an item at the back), **dequeue** (remove and return the front), **peek** (read the front) and a size check. Because nobody can jump the line, items come out in exactly the order they went in.

Round-robin scheduling shows why that order is useful. Each task runs for a short slice of time, a **quantum**; if it is not finished, it rejoins at the back. Every task waits at most one round before running again, so none is starved.

@walkthrough

## How a queue is stored: the circular buffer

The fast array-based queue keeps its elements still and stores two numbers: `head`, the index of the front, and `size`. Taking every index **modulo the capacity** turns the array into a ring, so the slots `head` leaves behind are reused.

@figure ring

Why it is correct: the queue is always the `size` slots starting at `head`, wrapping past the end. Enqueue adds a slot at the end of that run and dequeue removes one from its start, so the run stays contiguous and never overlaps itself while `size` is within the capacity. Nothing shifts: both are O(1). Keeping `size` rather than a `tail` index is deliberate.

@figure full-empty

A queue that must grow copies its elements into a larger array in queue order, starting at `head`, which keeps enqueue O(1) amortised. A [linked list](/roadmap/linked-list) with pointers to both ends also works, at one allocation per item.

### The code

```cpp
#include <iostream>
#include <vector>
using namespace std;

// A fixed-capacity FIFO queue on a circular buffer.
class CircularQueue {
    vector<int> slots;
    int capacity;
    int head = 0;  // index of the front element
    int size = 0;  // how many elements are stored
public:
    explicit CircularQueue(int cap) : slots(cap), capacity(cap) {}
    bool isEmpty() const { return size == 0; }
    bool isFull() const { return size == capacity; }

    bool enqueue(int x) {
        if (isFull()) return false;
        slots[(head + size) % capacity] = x;  // first free slot, wrapping past the end
        size++;
        return true;
    }
    int dequeue() {  // the caller checks isEmpty() first
        int x = slots[head];
        head = (head + 1) % capacity;  // the front moves on; nothing is shifted
        size--;
        return x;
    }
    void print() const {
        cout << "slots:";
        for (int x : slots) cout << " " << x;
        cout << " (head at index " << head << ")\nqueue:";
        for (int i = 0; i < size; i++) cout << " " << slots[(head + i) % capacity];
        cout << "\n";
    }
};

int main() {
    CircularQueue q(3);
    for (int x : {1, 2, 3, 4}) cout << "enqueue " << x << ": " << (q.enqueue(x) ? "ok" : "full") << "\n";
    cout << "dequeue: " << q.dequeue() << "\n";
    cout << "enqueue 4: " << (q.enqueue(4) ? "ok" : "full") << "\n";
    q.print();
    while (!q.isEmpty()) cout << "dequeue: " << q.dequeue() << "\n";
    return 0;
}
```

```java
public class Main {
    // A fixed-capacity FIFO queue on a circular buffer.
    static class CircularQueue {
        private final int[] slots;
        private final int capacity;
        private int head = 0;  // index of the front element
        private int size = 0;  // how many elements are stored

        CircularQueue(int cap) { slots = new int[cap]; capacity = cap; }
        boolean isEmpty() { return size == 0; }
        boolean isFull() { return size == capacity; }

        boolean enqueue(int x) {
            if (isFull()) return false;
            slots[(head + size) % capacity] = x;  // first free slot, wrapping past the end
            size++;
            return true;
        }
        int dequeue() {  // the caller checks isEmpty() first
            int x = slots[head];
            head = (head + 1) % capacity;  // the front moves on; nothing is shifted
            size--;
            return x;
        }
        void print() {
            StringBuilder line = new StringBuilder("slots:");
            for (int x : slots) line.append(" ").append(x);
            line.append(" (head at index ").append(head).append(")\nqueue:");
            for (int i = 0; i < size; i++) line.append(" ").append(slots[(head + i) % capacity]);
            System.out.println(line);
        }
    }

    public static void main(String[] args) {
        CircularQueue q = new CircularQueue(3);
        for (int x : new int[] {1, 2, 3, 4}) System.out.println("enqueue " + x + ": " + (q.enqueue(x) ? "ok" : "full"));
        System.out.println("dequeue: " + q.dequeue());
        System.out.println("enqueue 4: " + (q.enqueue(4) ? "ok" : "full"));
        q.print();
        while (!q.isEmpty()) System.out.println("dequeue: " + q.dequeue());
    }
}
```

```python
class CircularQueue:
    """A fixed-capacity FIFO queue on a circular buffer."""

    def __init__(self, capacity):
        self.slots = [0] * capacity
        self.capacity = capacity
        self.head = 0  # index of the front element
        self.size = 0  # how many elements are stored

    def is_empty(self):
        return self.size == 0

    def is_full(self):
        return self.size == self.capacity

    def enqueue(self, x):
        if self.is_full():
            return False
        self.slots[(self.head + self.size) % self.capacity] = x  # first free slot, wrapping
        self.size += 1
        return True

    def dequeue(self):  # the caller checks is_empty() first
        x = self.slots[self.head]
        self.head = (self.head + 1) % self.capacity  # the front moves on; nothing is shifted
        self.size -= 1
        return x

    def print(self):
        print("slots:", *self.slots, f"(head at index {self.head})")
        print("queue:", *(self.slots[(self.head + i) % self.capacity] for i in range(self.size)))


q = CircularQueue(3)
for x in [1, 2, 3, 4]:
    print(f"enqueue {x}: {'ok' if q.enqueue(x) else 'full'}")
print("dequeue:", q.dequeue())
print(f"enqueue 4: {'ok' if q.enqueue(4) else 'full'}")
q.print()
while not q.is_empty():
    print("dequeue:", q.dequeue())
```

```javascript
// A fixed-capacity FIFO queue on a circular buffer.
class CircularQueue {
  constructor(capacity) {
    this.slots = new Array(capacity).fill(0);
    this.capacity = capacity;
    this.head = 0; // index of the front element
    this.size = 0; // how many elements are stored
  }
  isEmpty() {
    return this.size === 0;
  }
  isFull() {
    return this.size === this.capacity;
  }
  enqueue(x) {
    if (this.isFull()) return false;
    this.slots[(this.head + this.size) % this.capacity] = x; // first free slot, wrapping
    this.size++;
    return true;
  }
  dequeue() {
    // the caller checks isEmpty() first
    const x = this.slots[this.head];
    this.head = (this.head + 1) % this.capacity; // the front moves on; nothing is shifted
    this.size--;
    return x;
  }
  print() {
    console.log(`slots: ${this.slots.join(" ")} (head at index ${this.head})`);
    const order = [];
    for (let i = 0; i < this.size; i++) order.push(this.slots[(this.head + i) % this.capacity]);
    console.log(`queue: ${order.join(" ")}`);
  }
}

const q = new CircularQueue(3);
for (const x of [1, 2, 3, 4]) console.log(`enqueue ${x}: ${q.enqueue(x) ? "ok" : "full"}`);
console.log(`dequeue: ${q.dequeue()}`);
console.log(`enqueue 4: ${q.enqueue(4) ? "ok" : "full"}`);
q.print();
while (!q.isEmpty()) console.log(`dequeue: ${q.dequeue()}`);
```

```output
enqueue 1: ok
enqueue 2: ok
enqueue 3: ok
enqueue 4: full
dequeue: 1
enqueue 4: ok
slots: 4 2 3 (head at index 1)
queue: 2 3 4
dequeue: 2
dequeue: 3
dequeue: 4
```

## The operations and their cost

| Operation | Circular buffer | Linked list with head and tail | Array, removing from index 0 |
| --- | --- | --- | --- |
| Enqueue at the back | O(1), amortised if it grows | O(1) | O(1) amortised |
| Dequeue from the front | O(1) | O(1) | O(n) |
| Peek at the front | O(1) | O(1) | O(1) |
| Read the i-th item | O(1) | O(n) | O(1) |

The last column is the trap: everything looks fine except the one operation a queue does all the time.

## Deques: both ends at once

A **deque** (double-ended queue, pronounced "deck") adds and removes at both the front and the back in O(1). A circular buffer gives you one almost for free: adding at the front steps `head` back one place.

@figure deque

Because it works at both ends, a deque is a stack and a queue at once, and some problems need exactly that:

- **Sliding window maximum**: the **monotonic deque** of the [Monotonic Stack](/roadmap/monotonic-stack) lesson solves [Sliding Window Maximum](/problems/sliding-window-maximum) in O(n) — see also [Sliding Window](/roadmap/sliding-window).
- **0-1 BFS**: on edges weighing 0 or 1, push a node reached by a 0-edge to the front and by a 1-edge to the back, and nodes come out in order of distance without a heap.

## Queues and deques in each language

| Language | Queue | Enqueue | Dequeue | Peek | Deque type |
| --- | --- | --- | --- | --- | --- |
| C++ | `std::queue<T>` | `push(x)` | `pop()` (returns nothing) | `front()` | `std::deque<T>` |
| Java | `Queue<T> q = new ArrayDeque<>()` | `offer(x)` | `poll()` | `peek()` | `ArrayDeque<T>` via `Deque<T>` |
| Python | `collections.deque` | `append(x)` | `popleft()` | `q[0]` | the same `deque` |
| JavaScript | an array and a head index | `push(x)` | `q[head++]` | `q[head]` | none built in |

In C++, read `front()` before `pop()`, and check `empty()` first. In Java, prefer `ArrayDeque`; `PriorityQueue` is not FIFO at all but a [heap](/roadmap/heap). In Python, `deque` makes both ends O(1), while `queue.Queue` is a locked queue for threads, not for algorithms. JavaScript has no queue type, and `shift()` is O(n), so keep a head index:

```text
let queue = [];
let head = 0;
queue.push(x);                   // enqueue at the back
const front = queue[head++];     // dequeue: read and move the front on, nothing shifts
const size = queue.length - head;
```

## A queue from two stacks

A favourite interview question builds a FIFO queue from LIFO stacks. One stack reverses order; two reversals restore it. An **inbox** receives every new item and an **outbox** serves dequeues, refilled from the inbox only when it is empty.

@figure two-stacks

The refill rule is what keeps the order right: pouring new items on top of older ones still in the outbox would let the newcomers jump the line. And although one dequeue can move k items, follow a single item instead: it is pushed and popped once on each stack and never moved back. Four O(1) steps per item, so n operations cost O(n) in total — **O(1) amortised** each.

### The code

```cpp
#include <iostream>
#include <stack>
using namespace std;

// FIFO from two LIFO stacks: new items go into inbox; outbox holds the oldest on top.
class TwoStackQueue {
    stack<int> inbox, outbox;
    void refill() {
        if (!outbox.empty()) return;  // refill only when empty, or newer items jump the line
        while (!inbox.empty()) {
            outbox.push(inbox.top());  // reversing the inbox puts its oldest item on top
            inbox.pop();
            moves++;
        }
    }
public:
    int moves = 0;  // items moved from inbox to outbox, to show each moves once
    void enqueue(int x) { inbox.push(x); }
    int dequeue() {
        refill();
        int x = outbox.top();
        outbox.pop();
        return x;
    }
    bool isEmpty() const { return inbox.empty() && outbox.empty(); }
};

int main() {
    TwoStackQueue q;
    for (int x : {1, 2, 3}) q.enqueue(x);
    cout << "dequeue: " << q.dequeue() << "\n";
    for (int x : {4, 5}) q.enqueue(x);
    while (!q.isEmpty()) cout << "dequeue: " << q.dequeue() << "\n";
    cout << "items moved from inbox to outbox: " << q.moves << "\n";
    return 0;
}
```

```java
import java.util.ArrayDeque;
import java.util.Deque;

public class Main {
    // FIFO from two LIFO stacks: new items go into inbox; outbox holds the oldest on top.
    static class TwoStackQueue {
        private final Deque<Integer> inbox = new ArrayDeque<>();
        private final Deque<Integer> outbox = new ArrayDeque<>();
        int moves = 0;  // items moved from inbox to outbox, to show each moves once

        private void refill() {
            if (!outbox.isEmpty()) return;  // refill only when empty, or newer items jump the line
            while (!inbox.isEmpty()) {
                outbox.push(inbox.pop());  // reversing the inbox puts its oldest item on top
                moves++;
            }
        }
        void enqueue(int x) { inbox.push(x); }
        int dequeue() {
            refill();
            return outbox.pop();
        }
        boolean isEmpty() { return inbox.isEmpty() && outbox.isEmpty(); }
    }

    public static void main(String[] args) {
        TwoStackQueue q = new TwoStackQueue();
        for (int x : new int[] {1, 2, 3}) q.enqueue(x);
        System.out.println("dequeue: " + q.dequeue());
        for (int x : new int[] {4, 5}) q.enqueue(x);
        while (!q.isEmpty()) System.out.println("dequeue: " + q.dequeue());
        System.out.println("items moved from inbox to outbox: " + q.moves);
    }
}
```

```python
class TwoStackQueue:
    """FIFO from two LIFO stacks: new items go into inbox; outbox holds the oldest on top."""

    def __init__(self):
        self.inbox = []
        self.outbox = []
        self.moves = 0  # items moved from inbox to outbox, to show each moves once

    def _refill(self):
        if self.outbox:
            return  # refill only when empty, or newer items jump the line
        while self.inbox:
            self.outbox.append(self.inbox.pop())  # reversing the inbox puts its oldest on top
            self.moves += 1

    def enqueue(self, x):
        self.inbox.append(x)

    def dequeue(self):
        self._refill()
        return self.outbox.pop()

    def is_empty(self):
        return not self.inbox and not self.outbox


q = TwoStackQueue()
for x in [1, 2, 3]:
    q.enqueue(x)
print("dequeue:", q.dequeue())
for x in [4, 5]:
    q.enqueue(x)
while not q.is_empty():
    print("dequeue:", q.dequeue())
print("items moved from inbox to outbox:", q.moves)
```

```javascript
// FIFO from two LIFO stacks: new items go into inbox; outbox holds the oldest on top.
class TwoStackQueue {
  constructor() {
    this.inbox = [];
    this.outbox = [];
    this.moves = 0; // items moved from inbox to outbox, to show each moves once
  }
  refill() {
    if (this.outbox.length > 0) return; // refill only when empty, or newer items jump the line
    while (this.inbox.length > 0) {
      this.outbox.push(this.inbox.pop()); // reversing the inbox puts its oldest item on top
      this.moves++;
    }
  }
  enqueue(x) {
    this.inbox.push(x);
  }
  dequeue() {
    this.refill();
    return this.outbox.pop();
  }
  isEmpty() {
    return this.inbox.length === 0 && this.outbox.length === 0;
  }
}

const q = new TwoStackQueue();
for (const x of [1, 2, 3]) q.enqueue(x);
console.log(`dequeue: ${q.dequeue()}`);
for (const x of [4, 5]) q.enqueue(x);
while (!q.isEmpty()) console.log(`dequeue: ${q.dequeue()}`);
console.log(`items moved from inbox to outbox: ${q.moves}`);
```

```output
dequeue: 1
dequeue: 2
dequeue: 3
dequeue: 4
dequeue: 5
items moved from inbox to outbox: 5
```

The reverse question, a stack from queues, also has an answer — after each push, rotate the queue so the new item is at the front — but it makes one of the operations O(n).

## Where queues appear

- **Breadth-first search**: nodes are processed in the order they were discovered, so every node at distance d comes before any at d + 1. That is why BFS finds shortest paths in unweighted graphs — see [Breadth-First Search](/roadmap/breadth-first-search).
- **Scheduling**: round robin, a printer's job list, requests waiting for a worker.
- **Streams and buffers**: data arriving faster than it is used waits in a queue; "calls in the last 3,000 milliseconds" is a queue of timestamps that expire from the front.
- **Simulations**: when the statement says "goes to the back of the line", simulate it with a queue.

## Time and space complexity

| Task | Approach | Time | Extra space |
| --- | --- | --- | --- |
| n enqueues and n dequeues | Array, removing from index 0 | O(n²) | O(n) |
| n enqueues and n dequeues | Circular buffer or deque | O(n) | O(n) |
| n enqueues and n dequeues | Two stacks | O(n) total, O(1) amortised each | O(n) |
| Breadth-first search | Queue of discovered nodes | O(V + E) | O(V) |

## How to recognise a queue problem

- The statement describes a **line**: "goes to the back", "the person at the front", "in the order they arrived".
- Things happen in **rounds or turns**, and whoever acted rejoins at the end.
- You need the **fewest steps** in an unweighted grid or graph: BFS.
- Data arrives as a **stream**, and old items expire.
- You need the **maximum or minimum of a moving window**: a deque.

## Common mistakes

- **Dequeuing with `list.pop(0)` or `array.shift()`**: O(n) each, O(n²) in all.
- **Telling full from empty with only head and tail**: keep a count.
- **A negative index when stepping back**: `(head - 1) % capacity` is −1 in C++, Java and JavaScript; add the capacity first.
- **Refilling the outbox too early** in the two-stack queue.
- **Mistaking a priority queue for a queue**: it hands out the smallest item, not the oldest.

## Practice in this order

1. [Time Needed to Buy Tickets](/problems/time-needed-to-buy-tickets): round robin at a ticket counter.
2. [Number of Students Unable to Eat Lunch](/problems/number-of-students-unable-to-eat-lunch): a queue against a stack.
3. [First Unique Character in a String](/problems/first-unique-character-in-a-string): candidates in arrival order.
4. [Find the Winner of the Circular Game](/problems/find-the-winner-of-the-circular-game): a circle as a queue.
5. [Reveal Cards In Increasing Order](/problems/reveal-cards-in-increasing-order): replay the reveal on a queue of positions.
6. [Dota2 Senate](/problems/dota2-senate): two queues of turn numbers.
7. [Number of People Aware of a Secret](/problems/number-of-people-aware-of-a-secret): people leave the front when they forget.

The [queue problem list](/challenges/queue) has every queue problem in the catalogue. Next in this stage is the [monotonic stack](/roadmap/monotonic-stack), which also introduces the monotonic deque.
