---
title: Queues and Deques
stage: stacks
order: 3
minutes: 18
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
A **queue** is a line at a counter. People join at the back and are served from the front, so whoever arrived first leaves first. That rule is called **first in, first out**, or FIFO, and it is the mirror image of the [stack](/roadmap/stack)'s last in, first out. Whenever work must be handled in the order it arrived — print jobs, network packets, requests to a server, the nodes of a graph discovered one layer at a time — a queue is the structure doing it.

This lesson covers how a queue is stored so that both ends are O(1) (the circular buffer), the **deque** that works at both ends, how each language spells them and the traps in each, building a queue from two stacks, and where queues appear in interview problems. Every example is a whole program in C++, Java, Python and JavaScript.

## Why a plain array is the wrong queue

The obvious queue is an array: append at the end, remove from index 0. Appending is cheap, but removing from the front of an array shifts every remaining element one place left. A queue that holds n items and serves them all does n + (n − 1) + … + 1 moves, about n² / 2. For a breadth-first search over 100,000 nodes that is around 5 × 10⁹ element moves — a program that should finish in milliseconds runs for many seconds, and the only cause is the choice of container.

This is not a theoretical trap. Python's `list.pop(0)` and JavaScript's `array.shift()` both look like innocent one-liners and both do this shifting. The fix is not to move the elements at all: leave them where they are and move the **front** instead.

## The idea: first in, first out

A queue offers two main operations:

- **Enqueue** puts an item at the back.
- **Dequeue** removes and returns the item at the front.

Plus **peek** (read the front without removing it) and a size or empty check. Because nobody can jump the line, the order things come out is exactly the order they went in.

Round-robin scheduling shows why that order is useful. An operating system has several tasks to run and gives each a short slice of time, a **quantum**, in turn. The task at the front runs for one quantum; if it is not finished, it rejoins at the back. Every task waits at most one round before running again, so none is starved. With tasks A, B, C and D needing 3, 5, 2 and 4 units and a quantum of 2, C finishes first at time 6, then A at 9, D at 13 and B at 14.

@walkthrough

## How a queue is stored: the circular buffer

The fast array-based queue keeps the elements still, and keeps two numbers: `head`, the index of the front element, and `size`, how many elements there are. Dequeue reads `slots[head]` and moves `head` one place on. Enqueue writes into the first free slot after the last element.

The problem is that `head` creeps to the right, and the slots it leaves behind are wasted. The fix is to treat the array as a **ring**: after the last slot comes slot 0 again. Taking every index **modulo the capacity** does exactly that.

```text
 capacity 5, after enqueue 1..5, dequeue twice, enqueue 6:

 index:   0   1   2   3   4
 slots: [ 6,  _,  3,  4,  5 ]        head = 2, size = 4
          ^       ^
         back    front               order: 3, 4, 5, 6

 back = (head + size - 1) mod capacity = (2 + 4 - 1) mod 5 = 0
 next free slot = (head + size) mod capacity = 1
```

The rules are short:

- **Enqueue x:** if `size == capacity` the queue is full. Otherwise write `slots[(head + size) mod capacity] = x` and add one to `size`.
- **Dequeue:** read `slots[head]`, set `head = (head + 1) mod capacity`, subtract one from `size`.
- **Peek:** read `slots[head]`.

Why it is correct: the queue's elements are always the `size` slots starting at `head` and wrapping round the end of the array, in queue order. Enqueue adds a slot at the end of that run and dequeue removes one from its start, so the run stays contiguous on the ring and never overlaps itself as long as `size` stays within the capacity. Nothing is ever shifted, so both operations are O(1).

Keeping `size` rather than a separate `tail` index is a deliberate choice. With only `head` and `tail`, an empty queue and a full one both have `head == tail`, and you would have to leave one slot permanently unused to tell them apart. A count settles it directly. A queue that must grow copies its elements into a larger array in queue order — starting at `head`, not at index 0 — which keeps enqueue O(1) amortised, as with a growing [stack](/roadmap/stack).

A queue can also be a singly [linked list](/roadmap/linked-list) with pointers to both ends: enqueue links a node after the tail, dequeue removes the head. Both are O(1), at the cost of one allocation per item.

### Dry run

A queue with capacity 3, running the program below:

| Operation | Slot used | head after | size after | slots |
| --- | --- | --- | --- | --- |
| enqueue 1 | write (0 + 0) mod 3 = 0 | 0 | 1 | 1 _ _ |
| enqueue 2 | write (0 + 1) mod 3 = 1 | 0 | 2 | 1 2 _ |
| enqueue 3 | write (0 + 2) mod 3 = 2 | 0 | 3 | 1 2 3 |
| enqueue 4 | full, refused | 0 | 3 | 1 2 3 |
| dequeue | read slot 0, returns 1 | 1 | 2 | _ 2 3 |
| enqueue 4 | write (1 + 2) mod 3 = 0 | 1 | 3 | 4 2 3 |

The last enqueue wrapped round into slot 0, freed by the dequeue. The slots now read 4 2 3, but the queue order, starting from `head`, is 2 3 4.

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
| Memory per item | one slot | one node with a pointer | one slot |

The last column is the trap from the start of the lesson: everything looks fine except the one operation a queue does all the time.

## Deques: both ends at once

A **deque** (double-ended queue, pronounced "deck") lets you add and remove at both the front and the back in O(1). A circular buffer gives you one almost for free: adding at the front steps `head` back one place, `head = (head − 1 + capacity) mod capacity`, writes there and adds one to `size`; removing from the back only subtracts one from `size`. The `+ capacity` keeps the index from going negative, since `%` on a negative number is negative in C++, Java and JavaScript.

Because it works at both ends, a deque is a stack and a queue at once, and some problems need exactly that:

- **Sliding window maximum.** Keep a deque of indices whose values decrease from front to back. New indices enter at the back after popping smaller values there; indices that fall out of the window leave from the front. The front is always the window's maximum. This **monotonic deque** is covered in the [Monotonic Stack](/roadmap/monotonic-stack) lesson and solves [Sliding Window Maximum](/problems/sliding-window-maximum) in O(n) — see also [Sliding Window](/roadmap/sliding-window).
- **0-1 BFS.** On a graph whose edges weigh 0 or 1, push a node reached by a 0-edge to the front and one reached by a 1-edge to the back, and the deque yields nodes in order of distance without a heap.
- **Palindrome checks and rotations,** where you take from either end as you go.

## Queues and deques in each language

| Language | Queue | Enqueue | Dequeue | Peek | Deque type |
| --- | --- | --- | --- | --- | --- |
| C++ | `std::queue<T>` | `push(x)` | `pop()` (returns nothing) | `front()` | `std::deque<T>` |
| Java | `Queue<T> q = new ArrayDeque<>()` | `offer(x)` | `poll()` | `peek()` | `ArrayDeque<T>` via `Deque<T>` |
| Python | `collections.deque` | `append(x)` | `popleft()` | `q[0]` | the same `deque` |
| JavaScript | an array and a head index | `push(x)` | `q[head++]` | `q[head]` | none built in |

Each has a detail worth knowing:

- **C++.** `std::queue` is an adapter over `std::deque` by default. As with `std::stack`, `pop()` returns nothing, so read `front()` first, and both are undefined behaviour on an empty queue. `std::deque` itself offers `push_front`, `push_back`, `pop_front` and `pop_back`, all O(1), plus O(1) indexing.
- **Java.** Prefer `ArrayDeque` for both queues and deques. `offer`, `poll` and `peek` return `false` or `null` when they cannot proceed; `add`, `remove` and `element` throw instead. `LinkedList` also implements `Queue`, but allocates a node per item and is slower. `PriorityQueue` is not FIFO at all — it is a [heap](/roadmap/heap).
- **Python.** Use `collections.deque`: `append` and `popleft` are O(1), as are `appendleft` and `pop`. Never use `list.pop(0)` as a dequeue — it is O(n). `deque(maxlen=k)` keeps only the last k items, dropping from the other end automatically. `queue.Queue` is a thread-safe queue with locks, meant for passing work between threads, not for algorithms.
- **JavaScript.** There is no queue type, and `array.shift()` re-indexes every remaining element, which is O(n) in general (engines optimise some small cases, but you cannot rely on it). Keep a head index instead:

```text
let queue = [];
let head = 0;
queue.push(x);                   // enqueue at the back
const front = queue[head++];     // dequeue: read and move the front on, nothing shifts
const size = queue.length - head;
```

The slots before `head` are never reused, so a long-running queue can free them now and then with `queue = queue.slice(head); head = 0` once `head` passes half the length. For a short-lived queue such as one BFS, the simple version is fine. A circular buffer like the one above is the other choice.

## A queue from two stacks

A favourite interview question asks for a FIFO queue built only from LIFO stacks. One stack reverses order; two reversals restore it. Keep an **inbox** that receives every new item and an **outbox** that serves dequeues:

- **Enqueue:** push onto the inbox.
- **Dequeue:** if the outbox is empty, pop every item from the inbox and push it onto the outbox. Then pop the outbox.

Moving the inbox into the outbox reverses it, so the oldest item ends on top of the outbox, ready to leave first. The rule that you refill **only when the outbox is empty** is what keeps the order right: if you poured new items on top of an outbox that still held older ones, the newcomers would be served first and jump the line.

### Why it is O(1) amortised

A single dequeue can be expensive: if the inbox holds k items, that dequeue moves all k. But follow one item through its life instead of one operation: it is pushed onto the inbox once, popped from the inbox once, pushed onto the outbox once and popped from the outbox once. Four O(1) steps per item, never more, because an item in the outbox is never moved back. So any sequence of n operations costs O(n) in total — **O(1) amortised** per operation, even though an individual dequeue is occasionally O(n).

### Dry run

| Operation | inbox (bottom → top) | outbox (bottom → top) | Returns |
| --- | --- | --- | --- |
| enqueue 1, 2, 3 | 1 2 3 | empty | — |
| dequeue | empty | 3 2 | 1 (outbox was empty: 3 items moved, then pop) |
| enqueue 4, 5 | 4 5 | 3 2 | — |
| dequeue | 4 5 | 3 | 2 |
| dequeue | 4 5 | empty | 3 |
| dequeue | empty | 5 | 4 (outbox was empty: 2 items moved, then pop) |
| dequeue | empty | empty | 5 |

Five items, five moves in total, and they came out in the order they went in.

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

The reverse question, a stack from queues, also has an answer — after each push, rotate the queue so the new item is at the front — but the simple versions make either push or pop O(n).

## Where queues appear

- **Breadth-first search.** BFS explores a graph or grid in layers: every node at distance d before any node at distance d + 1. A queue gives that order for free, because nodes are processed in the order they were discovered, and the nodes discovered from layer d all join behind the rest of layer d. This is why BFS finds shortest paths in unweighted graphs. See [Breadth-First Search](/roadmap/breadth-first-search).
- **Scheduling.** Round robin as in the figure, a printer's job list, requests waiting for a worker. FIFO is the simplest fair order.
- **Streams and buffers.** Data arriving faster than it is used waits in a queue, often a fixed-size circular buffer, between the producer and the consumer. "Calls in the last 3,000 milliseconds" is a queue of timestamps: new ones join at the back, expired ones leave from the front.
- **Simulations.** People in line, cards moved to the bottom of a deck, players in a circle. When the statement says "goes to the back of the line", simulate it with a queue.

## Time and space complexity

| Task | Approach | Time | Extra space |
| --- | --- | --- | --- |
| n enqueues and n dequeues | Array, removing from index 0 | O(n²) | O(n) |
| n enqueues and n dequeues | Circular buffer or deque | O(n) | O(n) |
| n enqueues and n dequeues | Two stacks | O(n) total, O(1) amortised each | O(n) |
| Push or pop at either end | Deque | O(1) each | O(n) |
| Breadth-first search | Queue of discovered nodes | O(V + E) | O(V) |

## How to recognise a queue problem

- The statement describes a **line**: "goes to the back", "the person at the front", "in the order they arrived".
- Things happen in **rounds or turns**, and whoever acted rejoins at the end.
- You need the **shortest number of steps** in an unweighted grid or graph: BFS with a queue.
- Data arrives as a **stream**, and old items expire after a time or a count.
- You need the **maximum or minimum of a moving window**, or to add and remove at both ends: a deque.

## Common mistakes

- **Dequeuing with `list.pop(0)` or `array.shift()`.** Each call is O(n), and the program becomes O(n²). Use `collections.deque` in Python and a head index or circular buffer in JavaScript.
- **Telling full from empty with only head and tail.** Both look like `head == tail`. Keep a count, or leave one slot unused on purpose.
- **A negative index when stepping back.** In C++, Java and JavaScript, `(head - 1) % capacity` is −1 when `head` is 0. Add the capacity first: `(head - 1 + capacity) % capacity`.
- **Refilling the outbox too early.** In the two-stack queue, move items only when the outbox is empty, or newer items overtake older ones.
- **Mistaking a priority queue for a queue.** Java's `PriorityQueue` and Python's `heapq` hand out the smallest item, not the oldest.
- **Ignoring the C++ `pop()` signature.** `std::queue::pop()` returns nothing; read `front()` first, and check `empty()` before either.

## Practice in this order

1. [Time Needed to Buy Tickets](/problems/time-needed-to-buy-tickets): people rejoin the back of the line after each ticket — round robin.
2. [Number of Students Unable to Eat Lunch](/problems/number-of-students-unable-to-eat-lunch): a queue of students against a stack of sandwiches.
3. [First Unique Character in a String](/problems/first-unique-character-in-a-string): keep candidates in arrival order and drop from the front any that repeat.
4. [Find the Winner of the Circular Game](/problems/find-the-winner-of-the-circular-game): a circle as a queue — move k − 1 people to the back, remove the next.
5. [Reveal Cards In Increasing Order](/problems/reveal-cards-in-increasing-order): replay the reveal process on a queue of positions.
6. [Dota2 Senate](/problems/dota2-senate): two queues of turn numbers; the earlier senator bans the other and rejoins for the next round.
7. [Number of People Aware of a Secret](/problems/number-of-people-aware-of-a-secret): people grouped by the day they learned, leaving from the front when they forget.

The [queue problem list](/challenges/queue) has every queue problem in the catalogue. Next in this stage is the [monotonic stack](/roadmap/monotonic-stack), which also introduces the monotonic deque.
