---
title: Linked Lists
stage: stacks
order: 1
minutes: 22
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
An array keeps its elements side by side in one block of memory. That is why `arr[i]` is instant, and also why putting a new element at the front means shifting every other element along by one. A **linked list** makes the opposite trade. Each element lives in its own small object, a **node**, which holds the value and a pointer to the next node. The nodes can sit anywhere in memory; the pointers are what put them in order.

That one change makes inserting and deleting cheap once you are at the right place, and makes reaching the i-th element slow. Linked lists are also where interviewers check that you can rewire pointers without losing half the list, so a few techniques come up again and again: the dummy head, three-pointer reversal, and fast and slow pointers. This lesson covers each one with a dry run, the reason it is correct, and code in C++, Java, Python and JavaScript.

## Why not just use an array

Arrays are the right default for most problems, but take a program that keeps a history of events and always puts the newest one first. In an array, inserting at index 0 means moving each of the n existing elements one place to the right before writing the new one. Do that 100,000 times and the moves add up to 1 + 2 + … + 100,000, about 5 × 10⁹ — far beyond the hundred million or so simple steps a judge allows in a second. Deleting from the front of an array costs the same.

With a linked list, putting a node at the front is two pointer writes: point the new node at the old first node, then make the new node the head. Nothing else moves, however long the list is, so 100,000 insertions take 100,000 steps.

The price is paid elsewhere. A list has no index arithmetic: to reach the 50,000th node you start at the head and follow 49,999 pointers. So the rule of thumb is simple. Use an array when you read by position; use a linked list when you insert and delete a lot at places you already have a pointer to — the front, the back, or next to a node you have just visited.

## How a linked list is stored

A node is a tiny object with two fields: `val`, the value, and `next`, a pointer to the following node. The list itself is nothing more than a pointer to the first node, called the **head**. The last node's `next` is null, which is how a walk knows where to stop.

```text
 head
  |
  v
+---+---+    +---+---+    +---+---+    +---+------+
| 1 | o-+--->| 2 | o-+--->| 3 | o-+--->| 4 | null |
+---+---+    +---+---+    +---+---+    +---+------+
 val next
```

Every operation on a list is built from one loop, the walk:

```text
cur = head
while cur is not null:
    visit cur.val
    cur = cur.next
```

There are three common shapes:

- **Singly linked list.** Each node points to the next one only, as above. You can walk forwards and nowhere else.
- **Doubly linked list.** Each node also has a `prev` pointer to the node before it. That costs one more pointer per node and twice the rewiring per change, but you can walk backwards, and you can delete a node when you hold only that node, because it knows its own predecessor.
- **Circular linked list.** The last node points back to the first instead of to null. It models anything that goes round in turns: a round-robin scheduler, or players standing in a circle as in [Find the Winner of the Circular Game](/problems/find-the-winner-of-the-circular-game).

One more fact matters in practice. Each node is allocated on its own, so neighbouring nodes are usually far apart in memory. A processor fetches memory in cache lines of 64 bytes: walking an array uses every byte fetched, while walking a list jumps to a fresh line for almost every node. Both walks are O(n), but the list is often several times slower, which is why real code reaches for a dynamic array first.

## The operations and their cost

| Operation | Dynamic array | Singly linked list | Doubly linked list |
| --- | --- | --- | --- |
| Read the i-th element | O(1) | O(n) | O(n) |
| Search for a value | O(n) | O(n) | O(n) |
| Insert or delete at the front | O(n) | O(1) | O(1) |
| Insert at the back | O(1) amortised | O(1) with a tail pointer | O(1) with a tail pointer |
| Delete at the back | O(1) | O(n) | O(1) with a tail pointer |
| Insert after a node you hold | O(n) | O(1) | O(1) |
| Delete a node you hold | O(n) | O(n), to find the node before it | O(1) |
| Extra memory per element | none | one pointer | two pointers |

Read the O(1) entries carefully: they are O(1) *once you hold the node*. Inserting at position 5,000 is still O(n) overall, because you walk 5,000 nodes to get there. Linked lists win when the walk is already happening — you are visiting each node anyway and decide to insert or delete as you go.

Deleting the last node of a singly linked list is O(n) even with a tail pointer, because the node before the tail must become the new tail, and only a walk from the head finds it.

### Inserting and deleting

To insert a new node after a node `node`, the order of the two assignments matters:

```text
insert after node:            delete the node after prev:
    fresh.next = node.next        prev.next = prev.next.next
    node.next = fresh

insert at the front:          delete at the front:
    fresh.next = head             head = head.next
    head = fresh
```

If you set `node.next = fresh` first, the only pointer to the rest of the list is gone, and `fresh.next = node.next` would point the new node at itself. Always connect the new node to what follows before you connect what comes before to it.

Deletion has its own twist. To remove a node, the node *before* it must be pointed past it, and in a singly linked list a node does not know who points at it. So you never "delete this node"; you "delete the node after `prev`", carrying a `prev` pointer as you walk. In C++ you also `delete` the unlinked node; the other three languages free it once nothing refers to it.

### The dummy head trick

The two "front" cases above are special cases: deleting the first node changes `head` itself, and inserting into an empty list must set `head`. Code that handles them separately is where most linked-list bugs live.

A **dummy head** (also called a sentinel) removes the special case. It is an extra node placed before the real first node, whose value is never read. Now every real node has a predecessor, including the first, so "delete the node after `prev`" works everywhere. When you are done, the answer is `dummy.next`. Here it is removing every node with a given value:

```text
dummy = new Node(0)
dummy.next = head
prev = dummy
while prev.next is not null:
    if prev.next.val == target:
        prev.next = prev.next.next   # unlink it; prev stays where it is
    else:
        prev = prev.next
return dummy.next
```

Notice that `prev` does not move after a deletion: the node that slid into `prev.next` has not been checked yet, and it might hold the target too. The `build` function in the code below uses the same trick to create a list from an array without treating the first node differently.

## Reversing a linked list

Reversal is the most asked linked-list question, and the one that shows whether you can rewire pointers safely. The task: turn `1 → 2 → 3 → 4 → 5` into `5 → 4 → 3 → 2 → 1` without creating new nodes. Every node's arrow has to point the other way.

The difficulty is that the moment you point `cur.next` backwards, you have lost the only pointer to the rest of the list. So you save it first, and that is why the method needs three pointers:

- `prev` — the head of the part already reversed. It starts as null, because the first node becomes the last and must point to null.
- `cur` — the node being turned round.
- `next` — the rest of the list, saved before `cur.next` is overwritten.

```text
 after two steps:

 null <- 1 <- 2      3 -> 4 -> 5 -> null
              ^      ^
            prev    cur
```

Why it is correct: at every step the nodes form two separate lists. `prev` heads a correctly reversed list of everything visited so far, and `cur` heads the untouched remainder. Each step moves one node from the front of the remainder to the front of the reversed part. When `cur` is null the remainder is empty, so `prev` heads the whole list, reversed. The loop does one step per node: O(n) time and O(1) extra space.

### Dry run

Reversing `1 → 2 → 3 → 4 → 5`:

| Step | cur | next (saved) | cur.next becomes | prev after | cur after |
| --- | --- | --- | --- | --- | --- |
| 1 | 1 | 2 | null | 1 | 2 |
| 2 | 2 | 3 | 1 | 2 | 3 |
| 3 | 3 | 4 | 2 | 3 | 4 |
| 4 | 4 | 5 | 3 | 4 | 5 |
| 5 | 5 | null | 4 | 5 | null |

`cur` is null, so the loop stops and returns `prev`, the node holding 5.

## Finding the middle with fast and slow pointers

The obvious way to find the middle node is two passes: count the nodes, then walk half that many. **Fast and slow pointers** do it in one pass. Both start at the head; on every step `slow` moves one node and `fast` moves two. When `fast` cannot move any further, it has covered the whole list and `slow` has covered half of it, so `slow` is at the middle.

For `1 → 2 → 3 → 4 → 5`:

| Step | slow | fast | Can fast move two more? |
| --- | --- | --- | --- |
| start | 1 | 1 | yes |
| 1 | 2 | 3 | yes |
| 2 | 3 | 5 | no, 5 is the last node |

The loop condition is `fast != null && fast.next != null`. The first half stops on an even-length list, where `fast` steps off the end; the second stops on an odd-length one, where `fast` lands on the last node. Check `fast` before `fast.next`, or the test itself dereferences null.

On an even-length list there are two middle nodes, and this loop returns the **second** one: for six nodes it stops at node 4. If you need the first middle instead — splitting a list into two halves for merge sort is the usual reason — start `fast` at `head.next`.

### The code

The program builds a list from an array, prints it, finds its middle, reverses it and prints it again, then finds the middle of a six-node list to show the even case.

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

A list has a **cycle** when some node's `next` points back to an earlier node. A walk then never reaches null; it goes round the loop forever. The first idea most people have is to remember every node visited in a hash set and stop at the first repeat. That works in O(n) time, but it costs O(n) memory.

**Floyd's cycle detection**, also called the tortoise and the hare, needs no memory at all. Run the same two pointers as for the middle: `slow` one step at a time, `fast` two. If `fast` reaches null, the list ends and there is no cycle. If there is a cycle, the two pointers are certain to land on the same node.

```text
 1 -> 2 -> 3 -> 4
           ^    |
           |    v
           6 <- 5        tail: 1, 2      loop: 3, 4, 5, 6
```

### Why the pointers must meet

`fast` reaches the loop first and then goes round it. Once `slow` enters the loop too, measure the gap: how many steps forwards `fast` would need to reach `slow`. On every step `slow` moves one node further on and `fast` moves two, so the gap shrinks by exactly one. A whole number that drops by exactly one per step cannot jump over zero; it reaches zero, and at that moment both pointers are on the same node. The gap starts below the loop's length, so they meet before `slow` completes one lap. `slow` needs at most n steps to enter the loop and less than one lap after that, so the whole search is O(n) time with two pointers of memory.

The speeds matter. With speeds 1 and 3 the gap would shrink by two each step, and on a loop of even length an odd gap would skip over zero forever. A difference of one is what makes the meeting certain.

### Finding where the cycle starts

Often the question is not only whether there is a cycle but which node starts it. Floyd's algorithm has a second phase for that: put one pointer back at the head, leave the other at the meeting point, and move both **one** step at a time. They meet exactly at the first node of the loop.

Here is why. Say the tail before the loop has μ nodes and the loop has L nodes, and the pointers first met after `slow` had made k moves. `fast` had made 2k. Both were on the same node, so the extra k moves `fast` made were whole laps of the loop: k is a multiple of L. `slow` entered the loop after μ moves, so the meeting point is k − μ steps past the loop's entrance. Walk μ more steps from there and you have gone k steps past the entrance — a whole number of laps, so you are back at the entrance. Meanwhile the pointer from the head also walks μ steps and arrives at the entrance. They meet there, and nowhere earlier, because the head pointer is not in the loop before that.

### Dry run

The list above: values 1 to 6, with 6 pointing back to 3. So μ = 2 and L = 4.

| Step | slow | fast | Same node? |
| --- | --- | --- | --- |
| start | 1 | 1 | — |
| 1 | 2 | 3 | no |
| 2 | 3 | 5 | no |
| 3 | 4 | 3 | no, fast went 5 → 6 → 3 |
| 4 | 5 | 5 | yes: they meet at 5 after k = 4 moves |

k = 4 is a multiple of L = 4, as promised. Phase two: one pointer at 1, one at 5. After one step they are at 2 and 6; after two steps both are at 3, the start of the loop.

Comparing node identities, not values, matters here: two different nodes can hold the same value, and only the same node proves a loop.

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

Floyd's algorithm works on anything where each item decides the next one, not only on nodes. In [Happy Number](/problems/happy-number), replacing a number by the sum of the squares of its digits either reaches 1 and stays there or loops for ever among other numbers; fast and slow pointers find the loop, and the number is happy if they meet at 1, all without storing the numbers seen. In [Find the Duplicate Number](/problems/find-the-duplicate-number), read each index i as a node whose `next` is `nums[i]` and start at index 0, which no value points to: the duplicated value has two arrows pointing into it, which makes it exactly the first node of a loop, and phase two finds it in O(1) extra space.

## Merging two sorted lists

Given two sorted lists, produce one sorted list containing every node. Keep a pointer into each list and a `tail` for the result, starting at a dummy head. Repeatedly compare the two front nodes, link the smaller one after `tail`, and advance in the list it came from.

```text
dummy = new Node(0)
tail = dummy
while a is not null and b is not null:
    if a.val <= b.val:
        tail.next = a; a = a.next
    else:
        tail.next = b; b = b.next
    tail = tail.next
tail.next = a if a is not null else b    # the rest is already sorted and linked
return dummy.next
```

The dummy head again saves the special case of choosing the first node. The last line is where lists beat arrays: when one list runs out, the rest of the other is attached with one pointer write instead of being copied. The merge takes O(n + m) time and O(1) extra space, because it re-links existing nodes rather than creating new ones, and taking from the first list on a tie (`<=`) keeps equal values in their original order.

This is the merge step of merge sort, the usual way to sort a linked list because it never jumps to an index — see [Sorting Algorithms](/roadmap/sorting-algorithms). [Merge Sorted Array](/problems/merge-sorted-array) is the same idea on arrays.

## Linked lists in each language

Every language in this lesson either ships a linked list or has an obvious stand-in:

- **C++** has `std::list`, a doubly linked list, and `std::forward_list`, a singly linked one. Both splice in O(1), and an iterator to an element stays valid while other elements are inserted or erased.
- **Java** has `java.util.LinkedList`, a doubly linked list that implements both `List` and `Deque`. Its `get(i)` walks from whichever end is nearer, so it is O(n).
- **Python** has no linked-list type. `collections.deque`, built from linked blocks of elements, gives O(1) work at both ends; for node-by-node work you write a small class, as above.
- **JavaScript** has none built in either: write a class, or use plain objects shaped `{ val, next }`.

In an interview the library classes are almost never what is wanted. A linked-list question hands you a node class and the head, and asks you to rewire the `next` pointers yourself, usually in O(1) extra space. Copying the values into an array, solving it there and building a new list gives the right answer with O(n) memory, and skips the skill being tested.

Outside interviews, linked lists earn their place as building blocks: hash tables that chain colliding keys, and the classic LRU cache, which pairs a hash map with a doubly linked list so it can move any entry to the front in O(1).

## Time and space complexity

| Task | Approach | Time | Extra space |
| --- | --- | --- | --- |
| Reverse a list | Copy into an array and rebuild | O(n) | O(n) |
| Reverse a list | Three pointers in place | O(n) | O(1) |
| Find the middle | Count, then walk half | O(n), two passes | O(1) |
| Find the middle | Fast and slow pointers | O(n), one pass | O(1) |
| Detect a cycle | Hash set of nodes seen | O(n) | O(n) |
| Detect a cycle and its start | Floyd's two phases | O(n) | O(1) |
| Merge two sorted lists | Re-link with a dummy head | O(n + m) | O(1) |

Every in-place technique here uses a constant number of pointers: a linked list lets you restructure a sequence without allocating a second one.

## How to recognise a linked-list problem

The obvious signal is a statement that gives you a `ListNode` and a head. Beyond that, these phrases point at a particular technique:

- **"In place"** or **"O(1) extra space"** on a list: rewire pointers, usually with a dummy head and a `prev` pointer.
- **"Reverse"**, all of a list or a part of it: the three-pointer loop, applied to the part.
- **"Middle"**, **"split in half"** or **"is it a palindrome"**: fast and slow pointers to find the middle, then often reverse the second half.
- **"Cycle"**, **"loop"**, or a sequence where each value determines the next: Floyd's algorithm.
- **"Remove the k-th node from the end"**: two pointers that start k nodes apart and move together.
- **Two sorted lists** to combine: the merge loop.

If the operations you need are only at the ends — add at the back, take from the front, or add and take at the top — you are really using a list as a [stack](/roadmap/stack) or a [queue](/roadmap/queue), the next two lessons in this stage.

## Common mistakes

- **Losing the rest of the list.** Writing `cur.next = prev` before saving `cur.next` cuts the list in two with no way back. Save first, then overwrite.
- **Dereferencing null.** `fast.next.next` crashes when `fast` or `fast.next` is null. Test `fast` first, then `fast.next`, in that order.
- **Special-casing the head, and getting it wrong.** Deleting the first node or inserting into an empty list are the cases that break. Put a dummy head in front and return `dummy.next`.
- **Comparing values instead of nodes.** In cycle detection, two different nodes may hold the same value. Compare the pointers or references themselves.
- **Creating a cycle by accident.** When you move nodes around, the new last node must point to null. A forgotten `tail.next = null` turns the next walk into an infinite loop.
- **Indexing a library list in a loop.** In Java, calling `list.get(i)` on a `LinkedList` inside a loop over i walks the list each time, turning an O(n) pass into O(n²). Use an iterator or a for-each loop.

## Practice in this order

The catalogue's judge passes arrays, strings and numbers, so it has no problems that hand you a list node. These problems practise the same ideas on arrays and number sequences, from easiest to hardest:

1. [Reverse String](/problems/reverse-string): reversal in place — the array cousin of the three-pointer loop.
2. [Remove Element](/problems/remove-element): deleting as you walk, keeping a pointer to where the kept part ends.
3. [Merge Sorted Array](/problems/merge-sorted-array): the merge loop, with one pointer per input.
4. [Happy Number](/problems/happy-number): Floyd's cycle detection on a number sequence.
5. [Rotate Array](/problems/rotate-array): rotation by k, which on a linked list is a re-link: join the tail to the head, then cut the circle k nodes from the end.
6. [Find the Winner of the Circular Game](/problems/find-the-winner-of-the-circular-game): a circular list, where each removal re-links two neighbours.
7. [Find the Duplicate Number](/problems/find-the-duplicate-number): both phases of Floyd's algorithm, with indices as nodes.

Fast and slow pointers are a member of the larger family in [Two Pointers](/roadmap/two-pointers), and the [two pointers problem list](/challenges/two-pointers) has more to practise them on. When the pointer work above feels routine, move on to the [stack](/roadmap/stack), the first data structure built on top of these ideas.
