---
title: Linked Lists
stage: stacks
order: 1
minutes: 13
level: Beginner
practice: reverse-string, remove-element, merge-sorted-array, happy-number, rotate-array, find-the-winner-of-the-circular-game, find-the-duplicate-number
updated: 2026-10-03
seo-title: Linked List Data Structure: Reversal, Middle and Cycles
description: Learn linked lists: nodes and pointers, costs against arrays, reversal, fast and slow pointers and cycle detection, in C++, Java, Python and JavaScript.
question: What is a linked list?
answer: A linked list is a sequence of nodes in which each node holds a value and a pointer to the next node, so the elements need not sit side by side in memory. Inserting or deleting next to a node you already hold takes O(1) time because only pointers change, but reaching the i-th element means walking from the head, which takes O(n).
q: What is the difference between an array and a linked list?
a: An array stores its elements in one contiguous block, so reading index i is O(1) but inserting or deleting in the middle shifts everything after it, which is O(n). A linked list stores each element in its own node joined by pointers, so inserting or deleting at a node you hold is O(1) but reaching index i is O(n). Arrays also make far better use of the CPU cache.
q: What is the difference between a singly and a doubly linked list?
a: In a singly linked list each node points only to the next one, so you can walk forwards only and must know a node's predecessor to delete it. A doubly linked list adds a pointer to the previous node, which costs memory but lets you walk both ways and delete any node you hold in O(1).
q: How do you reverse a linked list?
a: Walk the list with three pointers: prev (the head of the part already reversed, initially null), cur (the node being processed) and next (the rest of the list, saved before it is lost). For each node, save cur.next, point cur.next at prev, then move prev and cur one step on. When cur is null, prev is the new head. It takes O(n) time and O(1) space.
q: How does Floyd's cycle detection algorithm work?
a: Move a slow pointer one node at a time and a fast pointer two nodes at a time. If the list ends, the fast pointer reaches null and there is no cycle. If there is a cycle, the fast pointer gains one node per step on the slow one inside the loop, so the gap shrinks to zero and they meet, in O(n) time and O(1) space.
q: Should I use std::list or java.util.LinkedList in coding interviews?
a: Not for linked-list questions. Those give you a node class and the head, and expect you to rewire the next pointers yourself, usually in O(1) extra space. The library classes are doubly linked lists that are useful in real code, but copying a list into one, or into an array, avoids the very skill the question is testing.
---
An array keeps its elements side by side in one block of memory, so `arr[i]` is instant but a new first element shifts every other one along. A **linked list** makes the opposite trade: each element lives in its own small object, a **node**, holding the value and a pointer to the next node. The nodes sit anywhere; the pointers put them in order.

@figure layout

Inserting and deleting become cheap and reaching the i-th element slow, and interviews test whether you can rewire pointers safely: the dummy head, reversal, and fast and slow pointers.

## Why not just use an array

Keep a history with the newest event first. Each insert at index 0 of an array moves every element one place right, so 100,000 inserts cost about 5 × 10⁹ moves, far over a one-second limit. A list needs two pointer writes, however long it is.

@figure front-insert

The price: no index arithmetic, so reaching the 50,000th node means following 49,999 pointers. Use an array to read by position, and a list to insert and delete where you already hold a pointer.

## How a linked list is stored

A node has two fields, `val` and `next`; the list is just a pointer to the first node, the **head**, and the last node's `next` is null, which is where a walk stops. A **singly linked** list, as in the figure, walks forwards only. A **doubly linked** list adds a `prev` pointer per node, so it can walk backwards and delete a node it holds. A **circular** list's last node points back to the first, like the players in [Find the Winner of the Circular Game](/problems/find-the-winner-of-the-circular-game).

Nodes allocated one by one usually sit far apart, so a walk jumps to a fresh cache line almost every node. Both walks are O(n), but the list's is often several times slower — why real code reaches for an array first.

## The operations and their cost

| Operation | Dynamic array | Singly linked list | Doubly linked list |
| --- | --- | --- | --- |
| Read the i-th element | O(1) | O(n) | O(n) |
| Insert or delete at the front | O(n) | O(1) | O(1) |
| Delete at the back | O(1) | O(n) | O(1) with a tail pointer |
| Insert after a node you hold | O(n) | O(1) | O(1) |
| Delete a node you hold | O(n) | O(n), to find the one before it | O(1) |

The O(1) entries hold *once you have the node*: inserting at position 5,000 still walks 5,000 nodes first. Two rules keep rewiring safe: link the new node to what follows **first**, and delete "the node after `prev`", since a node does not know who points at it.

@figure insert-delete

### The dummy head

Deleting the first node changes `head` itself, and code that special-cases it is where most list bugs live. A **dummy head** is an extra node in front whose value is never read: every real node now has a predecessor, one deletion rule works everywhere, and the answer is `dummy.next`.

@figure dummy-head

## Reversing a linked list

Reversal is the most asked list question: turn every arrow round without making new nodes. Pointing `cur.next` backwards destroys the only pointer to the rest, so it is saved first — hence three pointers.

@figure reverse

Why it is correct: at every step `prev` heads a correctly reversed list of everything visited and `cur` heads the untouched rest. Each step moves one node across, so when `cur` is null, `prev` heads the whole list reversed: O(n) time, O(1) space.

## Finding the middle with fast and slow pointers

Counting nodes and then walking half way takes two passes. **Fast and slow pointers** take one: `slow` moves one node per step and `fast` two, so when `fast` runs out, `slow` is half way.

@figure middle

Test `fast != null` before `fast.next != null`, or the test itself dereferences null. On an even-length list the loop returns the **second** middle; start `fast` at `head.next` for the first, as when splitting a list for merge sort.

### The code

The program builds a list with a dummy head, finds its middle, reverses it, and finds the middle of a six-node list.

```cpp
#include <iostream>
#include <string>
#include <vector>
using namespace std;

struct Node {
    int val;
    Node* next;
    Node(int v) : val(v), next(nullptr) {}
};

// Builds a list from an array; the dummy head means the first node needs no special case.
Node* build(const vector<int>& values) {
    Node dummy(0);
    Node* tail = &dummy;
    for (int v : values) {
        tail->next = new Node(v);
        tail = tail->next;
    }
    return dummy.next;
}

void printList(const string& label, Node* head) {
    cout << label;
    for (Node* cur = head; cur != nullptr; cur = cur->next) {
        cout << cur->val << (cur->next != nullptr ? " -> " : "");
    }
    cout << "\n";
}

// Reverses the list in place with three pointers and returns the new head.
Node* reverseList(Node* head) {
    Node* prev = nullptr;
    Node* cur = head;
    while (cur != nullptr) {
        Node* next = cur->next;  // save the rest before the link is overwritten
        cur->next = prev;        // turn this node's arrow round
        prev = cur;
        cur = next;
    }
    return prev;
}

// Fast moves two steps for each step of slow, so slow is halfway when fast runs out.
Node* middleNode(Node* head) {
    Node* slow = head;
    Node* fast = head;
    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;
    }
    return slow;
}

void freeList(Node* head) {
    while (head != nullptr) {
        Node* next = head->next;
        delete head;
        head = next;
    }
}

int main() {
    Node* head = build({1, 2, 3, 4, 5});
    printList("List:     ", head);
    cout << "Middle:   " << middleNode(head)->val << "\n";
    head = reverseList(head);
    printList("Reversed: ", head);
    Node* even = build({1, 2, 3, 4, 5, 6});
    cout << "Middle of 6 nodes: " << middleNode(even)->val << "\n";
    freeList(head);
    freeList(even);
    return 0;
}
```

```java
public class Main {
    static class Node {
        int val;
        Node next;
        Node(int val) { this.val = val; }
    }

    // Builds a list from an array; the dummy head means the first node needs no special case.
    static Node build(int[] values) {
        Node dummy = new Node(0);
        Node tail = dummy;
        for (int v : values) {
            tail.next = new Node(v);
            tail = tail.next;
        }
        return dummy.next;
    }

    static void printList(String label, Node head) {
        StringBuilder line = new StringBuilder(label);
        for (Node cur = head; cur != null; cur = cur.next) {
            line.append(cur.val).append(cur.next != null ? " -> " : "");
        }
        System.out.println(line);
    }

    // Reverses the list in place with three pointers and returns the new head.
    static Node reverseList(Node head) {
        Node prev = null;
        Node cur = head;
        while (cur != null) {
            Node next = cur.next;  // save the rest before the link is overwritten
            cur.next = prev;       // turn this node's arrow round
            prev = cur;
            cur = next;
        }
        return prev;
    }

    // Fast moves two steps for each step of slow, so slow is halfway when fast runs out.
    static Node middleNode(Node head) {
        Node slow = head;
        Node fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }
        return slow;
    }

    public static void main(String[] args) {
        Node head = build(new int[] {1, 2, 3, 4, 5});
        printList("List:     ", head);
        System.out.println("Middle:   " + middleNode(head).val);
        head = reverseList(head);
        printList("Reversed: ", head);
        Node even = build(new int[] {1, 2, 3, 4, 5, 6});
        System.out.println("Middle of 6 nodes: " + middleNode(even).val);
    }
}
```

```python
class Node:
    def __init__(self, val):
        self.val = val
        self.next = None


def build(values):
    """Build a list from a Python list; the dummy head means the first node needs no special case."""
    dummy = Node(0)
    tail = dummy
    for v in values:
        tail.next = Node(v)
        tail = tail.next
    return dummy.next


def print_list(label, head):
    parts = []
    cur = head
    while cur is not None:
        parts.append(str(cur.val))
        cur = cur.next
    print(label + " -> ".join(parts))


def reverse_list(head):
    """Reverse the list in place with three pointers and return the new head."""
    prev = None
    cur = head
    while cur is not None:
        nxt = cur.next   # save the rest before the link is overwritten
        cur.next = prev  # turn this node's arrow round
        prev = cur
        cur = nxt
    return prev


def middle_node(head):
    """Fast moves two steps for each step of slow, so slow is halfway when fast runs out."""
    slow = fast = head
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
    return slow


head = build([1, 2, 3, 4, 5])
print_list("List:     ", head)
print("Middle:   " + str(middle_node(head).val))
head = reverse_list(head)
print_list("Reversed: ", head)
even = build([1, 2, 3, 4, 5, 6])
print("Middle of 6 nodes: " + str(middle_node(even).val))
```

```javascript
class Node {
  constructor(val) {
    this.val = val;
    this.next = null;
  }
}

// Builds a list from an array; the dummy head means the first node needs no special case.
function build(values) {
  const dummy = new Node(0);
  let tail = dummy;
  for (const v of values) {
    tail.next = new Node(v);
    tail = tail.next;
  }
  return dummy.next;
}

function printList(label, head) {
  const parts = [];
  for (let cur = head; cur !== null; cur = cur.next) parts.push(cur.val);
  console.log(label + parts.join(" -> "));
}

// Reverses the list in place with three pointers and returns the new head.
function reverseList(head) {
  let prev = null;
  let cur = head;
  while (cur !== null) {
    const next = cur.next; // save the rest before the link is overwritten
    cur.next = prev; // turn this node's arrow round
    prev = cur;
    cur = next;
  }
  return prev;
}

// Fast moves two steps for each step of slow, so slow is halfway when fast runs out.
function middleNode(head) {
  let slow = head;
  let fast = head;
  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow;
}

let head = build([1, 2, 3, 4, 5]);
printList("List:     ", head);
console.log("Middle:   " + middleNode(head).val);
head = reverseList(head);
printList("Reversed: ", head);
const even = build([1, 2, 3, 4, 5, 6]);
console.log("Middle of 6 nodes: " + middleNode(even).val);
```

```output
List:     1 -> 2 -> 3 -> 4 -> 5
Middle:   3
Reversed: 5 -> 4 -> 3 -> 2 -> 1
Middle of 6 nodes: 4
```

## Detecting a cycle with Floyd's algorithm

A list has a **cycle** when some node points back to an earlier one, so a walk never ends. A hash set of visited nodes finds it with O(n) memory; **Floyd's cycle detection** needs only `slow` and `fast`. If `fast` reaches null there is no cycle; otherwise they meet, and a second phase finds where the loop starts.

@figure floyd

They must meet because, once both are in the loop, the gap from `fast` round to `slow` shrinks by exactly one per step, and a whole number falling by one cannot skip zero. With speeds 1 and 3 the gap would fall by two and could jump over it.

Phase two works by arithmetic: if the tail has μ nodes and `slow` made k moves, `fast` made 2k, and the extra k were whole laps. The meeting point is k − μ steps past the entrance, so μ more steps make k — whole laps — and reach the entrance, just as a pointer walking μ steps from the head does. Compare nodes, never values.

### The code

```cpp
#include <iostream>
#include <vector>
using namespace std;

struct Node {
    int val;
    Node* next;
    Node(int v) : val(v), next(nullptr) {}
};

// Phase 1: slow moves one step, fast two. Returns where they meet, or nullptr if the list ends.
Node* meetingPoint(Node* head) {
    Node* slow = head;
    Node* fast = head;
    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) return slow;  // the same node, not just the same value
    }
    return nullptr;
}

// Phase 2: one pointer from the head, one from the meeting point, one step each.
Node* cycleStart(Node* head) {
    Node* meet = meetingPoint(head);
    if (meet == nullptr) return nullptr;
    Node* a = head;
    Node* b = meet;
    while (a != b) {  // both are mu steps from the loop's first node
        a = a->next;
        b = b->next;
    }
    return a;
}

int main() {
    vector<Node*> nodes;
    for (int v = 1; v <= 6; v++) nodes.push_back(new Node(v));
    for (int i = 0; i + 1 < (int)nodes.size(); i++) nodes[i]->next = nodes[i + 1];
    Node* head = nodes[0];

    cout << "Straight list: " << (cycleStart(head) == nullptr ? "no cycle" : "cycle") << "\n";

    nodes.back()->next = nodes[2];  // 6 now points back to 3
    cout << "Tail linked back to 3: pointers meet at " << meetingPoint(head)->val
         << ", cycle starts at " << cycleStart(head)->val << "\n";

    for (Node* n : nodes) delete n;  // the vector, not the looped list, lists each node once
    return 0;
}
```

```java
import java.util.ArrayList;
import java.util.List;

public class Main {
    static class Node {
        int val;
        Node next;
        Node(int val) { this.val = val; }
    }

    // Phase 1: slow moves one step, fast two. Returns where they meet, or null if the list ends.
    static Node meetingPoint(Node head) {
        Node slow = head;
        Node fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) return slow;  // the same node, not just the same value
        }
        return null;
    }

    // Phase 2: one pointer from the head, one from the meeting point, one step each.
    static Node cycleStart(Node head) {
        Node meet = meetingPoint(head);
        if (meet == null) return null;
        Node a = head;
        Node b = meet;
        while (a != b) {  // both are mu steps from the loop's first node
            a = a.next;
            b = b.next;
        }
        return a;
    }

    public static void main(String[] args) {
        List<Node> nodes = new ArrayList<>();
        for (int v = 1; v <= 6; v++) nodes.add(new Node(v));
        for (int i = 0; i + 1 < nodes.size(); i++) nodes.get(i).next = nodes.get(i + 1);
        Node head = nodes.get(0);

        System.out.println("Straight list: " + (cycleStart(head) == null ? "no cycle" : "cycle"));

        nodes.get(5).next = nodes.get(2);  // 6 now points back to 3
        System.out.println("Tail linked back to 3: pointers meet at " + meetingPoint(head).val
                + ", cycle starts at " + cycleStart(head).val);
    }
}
```

```python
class Node:
    def __init__(self, val):
        self.val = val
        self.next = None


def meeting_point(head):
    """Phase 1: slow moves one step, fast two. Return where they meet, or None if the list ends."""
    slow = fast = head
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:  # the same node, not just the same value
            return slow
    return None


def cycle_start(head):
    """Phase 2: one pointer from the head, one from the meeting point, one step each."""
    meet = meeting_point(head)
    if meet is None:
        return None
    a, b = head, meet
    while a is not b:  # both are mu steps from the loop's first node
        a = a.next
        b = b.next
    return a


nodes = [Node(v) for v in range(1, 7)]
for i in range(len(nodes) - 1):
    nodes[i].next = nodes[i + 1]
head = nodes[0]

print("Straight list: " + ("no cycle" if cycle_start(head) is None else "cycle"))

nodes[5].next = nodes[2]  # 6 now points back to 3
print(f"Tail linked back to 3: pointers meet at {meeting_point(head).val}, "
      f"cycle starts at {cycle_start(head).val}")
```

```javascript
class Node {
  constructor(val) {
    this.val = val;
    this.next = null;
  }
}

// Phase 1: slow moves one step, fast two. Returns where they meet, or null if the list ends.
function meetingPoint(head) {
  let slow = head;
  let fast = head;
  while (fast !== null && fast.next !== null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return slow; // the same node, not just the same value
  }
  return null;
}

// Phase 2: one pointer from the head, one from the meeting point, one step each.
function cycleStart(head) {
  const meet = meetingPoint(head);
  if (meet === null) return null;
  let a = head;
  let b = meet;
  while (a !== b) {
    // both are mu steps from the loop's first node
    a = a.next;
    b = b.next;
  }
  return a;
}

const nodes = [];
for (let v = 1; v <= 6; v++) nodes.push(new Node(v));
for (let i = 0; i + 1 < nodes.length; i++) nodes[i].next = nodes[i + 1];
const head = nodes[0];

console.log("Straight list: " + (cycleStart(head) === null ? "no cycle" : "cycle"));

nodes[5].next = nodes[2]; // 6 now points back to 3
console.log(`Tail linked back to 3: pointers meet at ${meetingPoint(head).val}, cycle starts at ${cycleStart(head).val}`);
```

```output
Straight list: no cycle
Tail linked back to 3: pointers meet at 5, cycle starts at 3
```

Floyd's algorithm works wherever each item decides the next one. [Happy Number](/problems/happy-number) detects the loop of digit-square sums without storing them, and [Find the Duplicate Number](/problems/find-the-duplicate-number) reads index i as a node whose `next` is `nums[i]`: the duplicate has two arrows into it, so it is where the loop starts.

## Merging two sorted lists

Keep a pointer into each sorted list and a `tail` for the result, starting at a dummy head, and repeatedly link the smaller front node after `tail`.

@figure merge

The leftover run is attached with one write instead of being copied: O(n + m) time, O(1) extra space. It is the merge step of merge sort, the usual way to sort a list — see [Sorting Algorithms](/roadmap/sorting-algorithms).

## Linked lists in each language

C++ has `std::list` and `std::forward_list`, Java has `java.util.LinkedList`, and Python and JavaScript have none, so you write a small node class. Interviews hand you the node class and the head and expect you to rewire the pointers yourself; copying the values into an array skips the skill being tested.

## Time and space complexity

| Task | Approach | Time | Extra space |
| --- | --- | --- | --- |
| Reverse a list | Copy into an array and rebuild | O(n) | O(n) |
| Reverse a list | Three pointers in place | O(n) | O(1) |
| Find the middle | Fast and slow pointers | O(n), one pass | O(1) |
| Detect a cycle | Hash set of nodes seen | O(n) | O(n) |
| Detect a cycle and its start | Floyd's two phases | O(n) | O(1) |
| Merge two sorted lists | Re-link with a dummy head | O(n + m) | O(1) |

## How to recognise a linked-list problem

- A `ListNode` and a head, **in place**: rewire pointers, with a dummy head.
- **Reverse** all or part of a list: the three-pointer loop.
- **Middle**, **split in half** or **palindrome**: fast and slow pointers, then often reverse the second half.
- **Cycle**, **loop**, or a sequence where each value decides the next: Floyd's algorithm.
- **The k-th node from the end**: two pointers k nodes apart, moving together.

If you only ever work at the ends, you are really using a [stack](/roadmap/stack) or a [queue](/roadmap/queue).

## Common mistakes

- **Losing the rest of the list**: overwriting `cur.next` before saving it.
- **Dereferencing null**: `fast.next.next` when `fast` or `fast.next` is null.
- **Special-casing the head, and getting it wrong**: use a dummy head.
- **Comparing values instead of nodes** in cycle detection.
- **Creating a cycle by accident**: the new last node must point to null.
- **Indexing a library list in a loop**: Java's `LinkedList.get(i)` makes an O(n) pass O(n²).

## Practice in this order

The judge passes arrays and numbers, not nodes, so these practise the same ideas on arrays:

1. [Reverse String](/problems/reverse-string): reversal in place.
2. [Remove Element](/problems/remove-element): deleting as you walk.
3. [Merge Sorted Array](/problems/merge-sorted-array): the merge loop, one pointer per input.
4. [Happy Number](/problems/happy-number): Floyd's cycle detection on numbers.
5. [Rotate Array](/problems/rotate-array): on a list, join the tail to the head and cut k nodes from the end.
6. [Find the Winner of the Circular Game](/problems/find-the-winner-of-the-circular-game): a circular list, re-linked at each removal.
7. [Find the Duplicate Number](/problems/find-the-duplicate-number): both phases of Floyd's algorithm.

Fast and slow pointers belong to the [two pointers](/roadmap/two-pointers) family; the [two pointers problem list](/challenges/two-pointers) has more. Next is the [stack](/roadmap/stack).
