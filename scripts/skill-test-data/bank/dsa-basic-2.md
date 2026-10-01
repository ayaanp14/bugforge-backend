---
skill: dsa
level: basic
---

## dsa-basic-025
topic: stacks-queues
answer: A
run: python

What does this program print?

```python
from collections import deque

stack = []
queue = deque()
from_stack, from_queue = [], []
for x in [1, 2, 3, 4]:
    stack.append(x)
    queue.append(x)
    if x % 2 == 0:
        from_stack.append(stack.pop())
        from_queue.append(queue.popleft())
print(from_stack, from_queue)
```

- A: `[2, 4] [1, 2]`
- B: `[2, 4] [2, 4]`
- C: `[1, 2] [2, 4]`
- D: `[1, 2] [1, 2]`

> After 1 and 2 go in, the stack gives back the newest item (2) and the queue
> the oldest (1). After 3 and 4 go in, the stack holds [1, 3, 4] and gives 4;
> the queue holds 2, 3, 4 and gives 2. LIFO returns what came in last, FIFO
> what has waited longest.

## dsa-basic-026
topic: stacks-queues
answer: C
run: python

What does this program print?

```python
def balanced(s):
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in "([{":
            stack.append(ch)
        elif ch in pairs:
            if not stack or stack.pop() != pairs[ch]:
                return False
    return not stack

tests = ["([]{})", "([)]", "((", "{[()]}"]
print(*[balanced(t) for t in tests])
```

- A: `True True False True`
- B: `True False True True`
- C: `True False False True`
- D: `True True True True`

> "([)]" has equal numbers of each bracket but closes ")" while "[" is on top
> of the stack, so it fails: counting brackets is not enough, the order must
> nest. "((" never sees a mismatch, but two openers are left on the stack, and
> the final `not stack` check rejects it. The other two nest correctly.

## dsa-basic-027
topic: stacks-queues
answer: C

A queue is built from two stacks. `enqueue` pushes onto `inbox`. `dequeue` pops from `outbox`, but whenever `outbox` is empty it first pops every item off `inbox` and pushes it onto `outbox`. Starting from an empty queue, which statement about the worst case is correct? (Each bound is tight.)

- A: Every dequeue is O(1); n operations cost O(n) in total.
- B: One dequeue can cost O(n); n operations can cost O(n²) in total.
- C: One dequeue can cost O(n); n operations cost O(n) in total.
- D: Every dequeue is O(log n); n operations cost O(n log n) in total.

> A dequeue that finds outbox empty moves everything in inbox, so after n - 1
> enqueues one dequeue does O(n) work. But each item is moved at most once:
> pushed to inbox, popped from inbox, pushed to outbox, popped from outbox —
> four stack operations over its whole life. So any n operations do O(n) work
> in total, amortised O(1) each; the expensive dequeues cannot keep happening.

## dsa-basic-028
topic: stacks-queues
answer: D
run: python

What does this program print?

```python
inbox, outbox = [], []

def enqueue(x):
    inbox.append(x)

def dequeue():
    if not outbox:
        while inbox:
            outbox.append(inbox.pop())
    return outbox.pop()

enqueue(1)
enqueue(2)
enqueue(3)
a = dequeue()
enqueue(4)
b = dequeue()
c = dequeue()
print(a, b, c, outbox, inbox)
```

- A: `1 2 3 [4] []`
- B: `1 2 4 [3] []`
- C: `3 4 2 [] [1]`
- D: `1 2 3 [] [4]`

> The first dequeue moves 3, 2, 1 into outbox, reversing them, so outbox is
> [3, 2, 1] and pop gives 1. 4 then goes into inbox, and is not moved while
> outbox still holds items: the next two dequeues give 2 and 3 from outbox.
> The queue behaves FIFO (1, 2, 3) and 4 waits in inbox.

## dsa-basic-029
topic: stacks-queues
answer: A
run: python

What does this program print?

```python
tokens = "3 4 + 2 * 5 -".split()
stack = []
for t in tokens:
    if t in ("+", "-", "*"):
        b = stack.pop()
        a = stack.pop()
        if t == "+":
            stack.append(a + b)
        elif t == "-":
            stack.append(a - b)
        else:
            stack.append(a * b)
    else:
        stack.append(int(t))
print(stack[-1])
```

- A: `9`
- B: `-9`
- C: `14`
- D: `6`

> Postfix evaluation: 3 4 + leaves 7; 2 * leaves 14; 5 - pops b = 5 and
> a = 14 and pushes 14 - 5 = 9. The operand popped first is the right-hand
> one; subtracting the other way round gives -9. Reading the tokens with infix
> precedence (3 + 4 × 2 - 5) would give 6.

## dsa-basic-030
topic: stacks-queues
answer: C

The numbers 1, 2, 3, 4 are pushed onto an empty stack in that order. A pop may happen at any time between pushes or after the last one, until all four have been popped. Which order of popped numbers is impossible?

- A: `2 1 4 3`
- B: `4 3 2 1`
- C: `3 1 2 4`
- D: `2 4 3 1`

> To pop 3 first, 1 and 2 must already be on the stack with 2 on top, so the
> next pop of 1 or 2 must be 2, never 1. The others work: 2 1 4 3 is push 1,
> push 2, pop, pop, push 3, push 4, pop, pop; 4 3 2 1 is four pushes then four
> pops; 2 4 3 1 is push 1, push 2, pop, push 3, push 4, pop, pop, pop.

## dsa-basic-031
topic: sorting-searching
answer: D
run: python

What does this program print?

```python
a = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
target = 23
lo, hi = 0, len(a) - 1
mids = []
while lo <= hi:
    mid = (lo + hi) // 2
    mids.append(mid)
    if a[mid] == target:
        break
    elif a[mid] < target:
        lo = mid + 1
    else:
        hi = mid - 1
print(mids)
```

- A: `[4, 6, 5]`
- B: `[5]`
- C: `[4, 7, 6, 5]`
- D: `[4, 7, 5]`

> lo = 0, hi = 9: mid 4 holds 16, too small, so lo = 5. lo = 5, hi = 9: mid 7
> holds 56, too big, so hi = 6. lo = 5, hi = 6: mid 5 holds 23, found. The
> middle index rounds down ((5 + 6) // 2 = 5), which is why 6 is never probed.

## dsa-basic-032
topic: sorting-searching
answer: B
run: python

What does this program print?

```python
def binary_search(a, target):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == target:
            return mid
        if a[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1

data = [7, 2, 9, 4, 1]
print(binary_search(data, 4), binary_search(data, 9))
```

- A: `3 2`
- B: `-1 2`
- C: `-1 -1`
- D: `3 -1`

> Binary search assumes the list is sorted. Searching for 4: mid 2 holds 9,
> greater than 4, so it discards indices 2–4 — including index 3, where 4
> actually is — then checks 7 at index 0 and gives up with -1. 9 is found only
> because it happens to sit at the first midpoint. On unsorted input the
> answer is unreliable, not uniformly wrong.

## dsa-basic-033
topic: sorting-searching
answer: A

These `(name, age)` records are sorted by age alone, smallest first, using a stable sort:

```python
[("Ann", 25), ("Bob", 20), ("Cid", 25), ("Dee", 20)]
```

In what order are the names afterwards?

- A: Bob, Dee, Ann, Cid
- B: Dee, Bob, Cid, Ann
- C: Bob, Dee, Cid, Ann
- D: Dee, Bob, Ann, Cid

> The 20s come before the 25s. A stable sort keeps records with equal keys in
> their original relative order: Bob was before Dee, and Ann before Cid, so
> the result is Bob, Dee, Ann, Cid. An unstable sort could return any of the
> four orders; stability is what makes sorting by one key after another work.

## dsa-basic-034
topic: sorting-searching
answer: B, D

Which of these sorting algorithms run in O(n log n) time in the worst case? Select all that apply.

- A: Insertion sort
- B: Merge sort
- C: Quicksort that always picks the first element as the pivot
- D: Heap sort
- E: Bubble sort

> Merge sort always splits in half and merges in linear time, and heap sort
> does n heap removals of O(log n) each, whatever the input. Quicksort is
> O(n log n) on average, but with a first-element pivot an already sorted
> list splits into sizes 0 and n - 1 every time, which is O(n²). Insertion
> and bubble sort are O(n²) on reverse-sorted input.

## dsa-basic-035
topic: sorting-searching
answer: D
run: python

What does this program print?

```python
a = [5, 1, 4, 2, 8, 3]
n = len(a)
for p in range(2):
    for i in range(n - 1 - p):
        if a[i] > a[i + 1]:
            a[i], a[i + 1] = a[i + 1], a[i]
print(a)
```

- A: `[1, 4, 2, 5, 3, 8]`
- B: `[1, 2, 3, 4, 5, 8]`
- C: `[1, 2, 4, 5, 3, 8]`
- D: `[1, 2, 4, 3, 5, 8]`

> Pass 1 carries 5 right until it meets 8, then carries 8 to the end:
> [1, 4, 2, 5, 3, 8]. Pass 2 swaps 4 and 2, leaves 4 and 5, then swaps 5 and
> 3: [1, 2, 4, 3, 5, 8]. Each pass fixes only the largest remaining item at
> the end; two passes are not enough to sort this list.

## dsa-basic-036
topic: sorting-searching
answer: A
run: python

What does this program print?

```python
a = [1, 3, 3, 3, 5, 8]
lo, hi = 0, len(a)
while lo < hi:
    mid = (lo + hi) // 2
    if a[mid] < 3:
        lo = mid + 1
    else:
        hi = mid
print(lo)
```

- A: `1`
- B: `2`
- C: `3`
- D: `4`

> This binary search does not stop when it sees a 3: on a[mid] >= 3 it keeps
> mid as a candidate (hi = mid) and keeps looking left. lo = 0, hi = 6: mid 3
> is 3, so hi = 3; mid 1 is 3, so hi = 1; mid 0 is 1 < 3, so lo = 1. It
> returns the first index whose value is at least 3 — the first occurrence.

## dsa-basic-037
topic: sorting-searching
answer: B

Which is the tightest bound on the running time of `insertion_sort` when the list of n items it is given is already in ascending order?

```python
def insertion_sort(a):
    for i in range(1, len(a)):
        key = a[i]
        j = i - 1
        while j >= 0 and a[j] > key:
            a[j + 1] = a[j]
            j -= 1
        a[j + 1] = key
```

- A: O(log n)
- B: O(n)
- C: O(n log n)
- D: O(n²)

> On sorted input, a[i - 1] > key is false straight away for every i, so the
> inner loop does one comparison and no shifts: n - 1 comparisons in all.
> Insertion sort's O(n²) is its worst case (reverse-sorted input, where every
> item shifts past all the items before it); its best case is linear.

## dsa-basic-038
topic: recursion-dp
answer: C
run: python

What does this program print?

```python
calls = 0

def fib(n):
    global calls
    calls += 1
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

print(fib(5), calls)
```

- A: `5 6`
- B: `5 9`
- C: `5 15`
- D: `8 15`

> fib(5) = 5 (0, 1, 1, 2, 3, 5). The calls follow calls(n) = 1 + calls(n-1) +
> calls(n-2) with calls(0) = calls(1) = 1: 3, 5, 9, 15 for n = 2…5. Only six
> different values 0…5 are ever asked for, but fib(3) is computed twice, fib(2)
> three times, and so on — the call tree grows exponentially with n.

## dsa-basic-039
topic: recursion-dp
answer: B
run: python

What does this program print?

```python
calls = 0
memo = {}

def fib(n):
    global calls
    calls += 1
    if n in memo:
        return memo[n]
    if n < 2:
        result = n
    else:
        result = fib(n - 1) + fib(n - 2)
    memo[n] = result
    return result

print(fib(5), calls)
```

- A: `5 6`
- B: `5 9`
- C: `5 15`
- D: `5 11`

> Each of fib(5), fib(4), …, fib(0) is computed once: six calls that do real
> work. fib(5), fib(4) and fib(3) then each make a second recursive call
> (to fib(3), fib(2) and fib(1)) that finds its answer in the memo: three
> more calls that return at once. 6 + 3 = 9, against 15 without the memo; the
> count now grows linearly (2n - 1).

## dsa-basic-040
topic: recursion-dp
answer: D

What happens when this Python program runs?

```python
def steps(n):
    if n == 0:
        return 0
    return 1 + steps(n - 2)

print(steps(5))
```

- A: It prints 2.
- B: It prints 3.
- C: It runs forever without any error.
- D: It raises a RecursionError.

> n goes 5, 3, 1, -1, -3, … and never equals 0, so the base case is never
> reached. Every call adds a stack frame, and Python stops at its recursion
> limit (1000 frames by default) with a RecursionError rather than running
> forever. A base case has to catch every path, here `n <= 0`.

## dsa-basic-041
topic: recursion-dp
answer: A

Naive recursive Fibonacci takes exponential time, but caching each result the first time it is computed (memoization) makes it linear. Why does memoization help so much here?

- A: The recursion solves the same subproblems again and again
- B: The recursion has a base case that stops it
- C: Each call makes two recursive calls instead of one
- D: The recursion is never more than n calls deep

> fib(n) calls fib(n-1) and fib(n-2), and fib(n-1) calls fib(n-2) again, and
> so on: there are only n + 1 distinct subproblems, each solved an
> exponential number of times. A cache turns every repeat into a lookup.
> Merge sort also has a base case, two calls per step and bounded depth, yet
> memoizing it gains nothing, because its subproblems never repeat.

## dsa-basic-042
topic: trees
answer: D
run: python

What does this program print? (`root` is 1, with left child 2 and right child 3; 2 has children 4 and 5; 3 has only a right child, 6.)

```python
class Node:
    def __init__(self, val, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def visit(node, out):
    if node:
        visit(node.left, out)
        visit(node.right, out)
        out.append(node.val)
    return out

root = Node(1, Node(2, Node(4), Node(5)), Node(3, None, Node(6)))
print(visit(root, []))
```

- A: `[1, 2, 4, 5, 3, 6]`
- B: `[4, 2, 5, 1, 3, 6]`
- C: `[1, 2, 3, 4, 5, 6]`
- D: `[4, 5, 2, 6, 3, 1]`

> A node's value is appended after both of its subtrees: this is a postorder
> traversal (left, right, node). 2's subtree gives 4, 5, 2; 3's gives 6, 3;
> the root comes last. Appending before the recursive calls would give the
> preorder [1, 2, 4, 5, 3, 6], and between them the inorder
> [4, 2, 5, 1, 3, 6].

## dsa-basic-043
topic: trees
answer: B

The keys 50, 30, 70, 20, 40, 60, 80 are inserted in that order into an empty binary search tree (smaller keys go left, larger keys go right). Then 35 is inserted. Where does 35 end up?

- A: The right child of 30
- B: The left child of 40
- C: The right child of 20
- D: The left child of 60

> Insertion follows the search path: 35 < 50, go left to 30; 35 > 30, go right
> to 40; 35 < 40, and 40 has no left child, so 35 becomes it. 30 already has a
> right child (40), and 20 and 60 are off the search path for 35, so placing
> it there would break the ordering of the tree.

## dsa-basic-044
topic: trees
answer: B
run: python

What does this program print?

```python
class Node:
    def __init__(self, val):
        self.val = val
        self.left = None
        self.right = None

def insert(node, val):
    if node is None:
        return Node(val)
    if val < node.val:
        node.left = insert(node.left, val)
    else:
        node.right = insert(node.right, val)
    return node

def height(node):
    if node is None:
        return 0
    return 1 + max(height(node.left), height(node.right))

def build(values):
    root = None
    for v in values:
        root = insert(root, v)
    return root

print(height(build([5, 3, 8, 1, 4, 9, 10])), height(build([1, 2, 3, 4, 5])))
```

- A: `3 4`
- B: `4 5`
- C: `4 3`
- D: `3 3`

> height counts nodes on the longest root-to-leaf path (an empty tree is 0).
> The first tree's longest path is 5, 8, 9, 10: 4. Inserting 1 to 5 in sorted
> order makes every key the right child of the one before, a chain of 5. A
> plain BST's shape depends on insertion order; nothing balances it.

## dsa-basic-045
topic: trees
answer: C

A binary search tree with n nodes is built by plain insertion, with no rebalancing. What is the worst-case time to search it for a key?

- A: O(1)
- B: O(log n)
- C: O(n)
- D: O(n log n)

> A search walks one root-to-leaf path, so it costs the tree's height. With no
> rebalancing, keys inserted in sorted order produce a chain whose height is
> n, so the worst case is O(n). O(log n) needs the tree to stay balanced,
> which is what AVL and red-black trees guarantee.
