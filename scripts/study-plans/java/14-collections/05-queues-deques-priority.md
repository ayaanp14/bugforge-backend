---
title: Queues, deques and PriorityQueue
minutes: 12
---
Queues process elements in an order decided by the structure: first-in-first-out for a plain queue, last-in-first-out for a stack, smallest-first for a priority queue. Java's `Queue` and `Deque` interfaces, `ArrayDeque` and `PriorityQueue` cover all three — and the legacy `Stack` class is the one you must know exists so you can avoid it. This lesson covers the interfaces' two method families, the implementations, and the algorithms (BFS, balanced brackets, top-k, scheduling) each is built for.

## `Queue`: two method families

Every `Queue` operation comes in a throwing form and a returning form:

| Purpose | Throws on failure | Returns special value |
| --- | --- | --- |
| Insert | `add(e)` → `IllegalStateException` if full | `offer(e)` → `false` |
| Remove head | `remove()` → `NoSuchElementException` if empty | `poll()` → `null` |
| Examine head | `element()` → `NoSuchElementException` | `peek()` → `null` |

Use `offer`/`poll`/`peek` for ordinary code — an empty queue is a normal condition, not an exception. The throwing forms are for bounded queues where "full" is a programming error. `poll` returning `null` means queues should not hold null elements (`ArrayDeque` forbids them; `LinkedList` allows and confuses).

## `Deque`: both ends

`Deque` (double-ended queue) adds `addFirst`/`addLast`, `offerFirst`/`offerLast`, `pollFirst`/`pollLast`, `peekFirst`/`peekLast`, plus stack aliases `push` (= `addFirst`), `pop` (= `removeFirst`), `peek` (= `peekFirst`).

```java
Deque<Integer> stack = new ArrayDeque<>();
stack.push(1); stack.push(2);
stack.peek();            // 2
stack.pop();             // 2

Deque<String> queue = new ArrayDeque<>();
queue.offer("a"); queue.offer("b");    // offer = offerLast
queue.poll();                          // "a" — poll = pollFirst
```

`ArrayDeque` is a circular array: O(1) at both ends, no nulls, no capacity limit (it doubles), faster than `LinkedList` for every deque operation and than `Stack` for every stack operation. It is the answer to "which class for a stack?" and "which class for a queue?".

## Why not `java.util.Stack`

`Stack extends Vector`: every method synchronised (slow), inherits `get(i)`/`insertElementAt` that break the stack abstraction, and iterates bottom-to-top (surprising). It survives for compatibility; the Javadoc itself says to use `Deque`. Interviewers ask about it precisely to hear this.

Note the iteration difference: iterating an `ArrayDeque` used as a stack yields top-first (`push` adds at the front); iterating a `Stack` yields bottom-first.

## Stack patterns

```java
// balanced brackets
Deque<Character> st = new ArrayDeque<>();
for (char c : s.toCharArray()) {
    if ("([{".indexOf(c) >= 0) st.push(c);
    else {
        if (st.isEmpty()) return false;
        char open = st.pop();
        if ("([{".indexOf(open) != ")]}".indexOf(c)) return false;
    }
}
return st.isEmpty();
```

Also: evaluating postfix expressions, undo stacks, DFS without recursion, "next greater element" (a monotonic stack), matching tags. Any recursion can be made iterative with an explicit `Deque` of frames.

## Queue patterns

```java
// breadth-first search over a grid
Deque<int[]> q = new ArrayDeque<>();
boolean[][] seen = new boolean[rows][cols];
q.offer(new int[] {sr, sc}); seen[sr][sc] = true;
while (!q.isEmpty()) {
    int[] cur = q.poll();
    for (int[] d : DIRS) {
        int nr = cur[0] + d[0], nc = cur[1] + d[1];
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || seen[nr][nc] || grid[nr][nc] == '#') continue;
        seen[nr][nc] = true;
        q.offer(new int[] {nr, nc});
    }
}
```

BFS, level-order tree traversal, task pipelines, sliding-window maximum (a monotonic deque), producer–consumer (with the concurrent `BlockingQueue` — Module 17).

## `PriorityQueue`

A binary **heap** over an array: `offer` and `poll` are O(log n), `peek` O(1), and `poll` always returns the **smallest** element by natural order or a supplied comparator.

```java
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
PriorityQueue<Task> byDeadline = new PriorityQueue<>(Comparator.comparing(Task::deadline));

minHeap.offer(5); minHeap.offer(1); minHeap.offer(3);
minHeap.poll();          // 1
minHeap.peek();          // 3
```

Facts that trip people:

- **Iteration is not sorted.** `for (x : pq)` and `pq.toString()` show heap order, not ascending order. To get elements in order, `poll` repeatedly (destructive) or copy and sort.
- **No nulls**; elements must be `Comparable` or a comparator must be given.
- `remove(Object)` and `contains` are O(n).
- Not thread-safe; `PriorityBlockingQueue` is the concurrent version.
- Changing an element's priority while it is in the queue corrupts the heap — remove, mutate, re-add.

Patterns: **top-k** (keep a min-heap of size k: offer each element, poll when size exceeds k — O(n log k)), merging k sorted streams, Dijkstra's algorithm, event simulation ordered by time, scheduling by deadline.

## Choosing

| Need | Use |
| --- | --- |
| Stack (LIFO) | `ArrayDeque` via `push`/`pop`/`peek` |
| Queue (FIFO) | `ArrayDeque` via `offer`/`poll`/`peek` |
| Both ends | `ArrayDeque` |
| Smallest/largest first | `PriorityQueue` (+ `reverseOrder` for largest) |
| Blocking, between threads | `ArrayBlockingQueue`, `LinkedBlockingQueue` (Module 17) |
| Legacy code | `Stack`, `LinkedList` — read them, do not write them |

## Interview angle

- *"Which class would you use for a stack in Java?"* `ArrayDeque` — `Stack` is a synchronised `Vector` with a broken abstraction.
- *"`add` vs `offer`?"* `add` throws when it cannot insert; `offer` returns false. Same for `remove`/`poll` and `element`/`peek`.
- *"Is a `PriorityQueue` sorted?"* Only its head is guaranteed; iteration order is heap order.
- *"How do you get the k largest elements efficiently?"* A min-heap of size k.
- *"Why does `ArrayDeque` reject null?"* `poll`/`peek` use null to mean empty.

## Key takeaways

- `offer`/`poll`/`peek` for everyday use; `add`/`remove`/`element` throw.
- `ArrayDeque` is the stack *and* the queue; `Stack` and `LinkedList` are legacy for these roles.
- `PriorityQueue` is a heap: O(log n) offer/poll, smallest first, unsorted iteration, no nulls, do not mutate priorities in place.
- Stacks for brackets/DFS/undo; queues for BFS/pipelines; heaps for top-k/scheduling/Dijkstra.
