---
skill: dsa
level: basic
---

## dsa-basic-001
topic: complexity
answer: C

Which is the tightest bound on the running time of `count_pairs(n)`?

```python
def count_pairs(n):
    count = 0
    for i in range(n):
        for j in range(i, n):
            count += 1
    return count
```

- A: O(n)
- B: O(n log n)
- C: O(n²)
- D: O(n³)

> The inner loop runs n - i times, so the body runs n + (n-1) + … + 1 =
> n(n+1)/2 times. Starting the inner loop at i roughly halves the work, but
> halving is a constant factor: the growth is still quadratic. It is not
> n log n, because the inner loop shrinks by one each time, not by half.

## dsa-basic-002
topic: complexity
answer: A

Which is the tightest bound on the running time of `halvings(n)`, as a function of the argument `n`?

```python
def halvings(n):
    steps = 0
    while n > 1:
        n = n // 2
        steps += 1
    return steps
```

- A: O(log n)
- B: O(1)
- C: O(√n)
- D: O(n)

> Each pass halves n, so after k passes it is about n / 2^k, and the loop
> stops once that reaches 1: k is about log₂ n. A loop that divides its
> variable by a constant each time is logarithmic; one that subtracts a
> constant each time would be linear.

## dsa-basic-003
topic: complexity
answer: B
run: python

What does this program print?

```python
count = 0
i = 1
while i < 100:
    i = i * 3
    count += 1
print(count)
```

- A: `4`
- B: `5`
- C: `6`
- D: `33`

> i takes the values 1, 3, 9, 27, 81 at the top of the loop — all below 100 —
> and becomes 243 on the fifth pass, which ends the loop. A loop that
> multiplies its variable by 3 runs about log₃ n times, not n / 3 times
> (which is where 33 comes from).

## dsa-basic-004
topic: complexity
answer: D

A linear search checks the items of an unsorted list of n items one at a time, from the front, and stops at the first match. Counting comparisons, which is correct?

- A: Best case 1, worst case log n
- B: Best case n/2, worst case n
- C: Best case n, worst case n
- D: Best case 1, worst case n

> Best case: the target is the first item, one comparison. Worst case: the
> target is last or absent, n comparisons. n/2 is the average when the target
> is present at a uniformly random position, not the best case; log n needs
> sorted data and binary search, which a front-to-back scan does not use.

## dsa-basic-005
topic: complexity
answer: C

What is the space complexity of `total(n)`, as a function of `n`?

```python
def total(n):
    if n == 0:
        return 0
    return n + total(n - 1)
```

- A: O(1)
- B: O(log n)
- C: O(n)
- D: O(n²)

> The function builds no list, but every call waits for the call below it to
> return, so total(n) has n + 1 frames on the call stack at its deepest
> point. Recursion depth is memory: a loop adding 1..n would be O(1) space,
> this recursion is O(n).

## dsa-basic-006
topic: complexity
answer: D

`a` holds n items and `b` holds m items. Which is the tightest bound on the running time of `show(a, b)`?

```python
def show(a, b):
    for x in a:
        print(x)
    for y in b:
        print(y)
```

- A: O(n)
- B: O(m)
- C: O(n · m)
- D: O(n + m)

> The loops run one after the other, not one inside the other: n steps, then
> m steps, n + m in all. Sequential loops add; only nested loops multiply.
> O(n) alone or O(m) alone is not a bound at all, because the other list can
> be arbitrarily long.

## dsa-basic-007
topic: complexity
answer: D

Python's `list` is a dynamic array. Which is the tightest bound on the running time of `build(n)`?

```python
def build(n):
    items = []
    for i in range(n):
        items.insert(0, i)
    return items
```

- A: O(log n)
- B: O(n)
- C: O(n log n)
- D: O(n²)

> Inserting at index 0 of an array shifts every element already there one
> place right, so the i-th insert costs about i steps. 0 + 1 + … + (n-1) is
> about n²/2. Appending at the end (amortised O(1)) and reversing once would
> make the whole thing O(n).

## dsa-basic-008
topic: complexity
answer: C

Which is the tightest bound on the running time of `work(n)`?

```python
def work(n):
    for i in range(n):
        j = n
        while j > 1:
            j = j // 2
```

- A: O(log n)
- B: O(n)
- C: O(n log n)
- D: O(n²)

> The outer loop runs n times. Each time, the inner loop starts again at n and
> halves it until it reaches 1, which takes about log₂ n steps. n times
> log n is n log n. It is not n², because the inner loop does not walk j down
> one step at a time.

## dsa-basic-009
topic: arrays-strings
answer: B
run: python

What does this program print?

```python
a = [1, 4, 7]
b = [2, 3, 8, 9]
i = j = 0
out = []
while i < len(a) and j < len(b):
    if a[i] <= b[j]:
        out.append(a[i])
        i += 1
    else:
        out.append(b[j])
        j += 1
print(out)
```

- A: `[1, 2, 3, 4, 7, 8, 9]`
- B: `[1, 2, 3, 4, 7]`
- C: `[1, 4, 7, 2, 3, 8, 9]`
- D: `[1, 2, 3, 4, 7, 8]`

> The two pointers take the smaller front item each time: 1, 2, 3, 4, 7. After
> 7 is taken, i equals len(a) and the loop condition is false, so 8 and 9 are
> never copied. A correct merge appends whatever is left of either list after
> the loop; forgetting that tail is the classic merge bug.

## dsa-basic-010
topic: arrays-strings
answer: A

`prefix` is built from `nums` so that `prefix[k]` is the sum of the first k items (`prefix[0]` is 0):

```python
prefix = [0]
for x in nums:
    prefix.append(prefix[-1] + x)
```

Which expression equals `nums[i] + nums[i+1] + … + nums[j]` (both ends included, `0 <= i <= j < len(nums)`)?

- A: `prefix[j + 1] - prefix[i]`
- B: `prefix[j] - prefix[i]`
- C: `prefix[j + 1] - prefix[i + 1]`
- D: `prefix[j] - prefix[i - 1]`

> prefix[j + 1] is nums[0] + … + nums[j], and prefix[i] is nums[0] + … +
> nums[i-1]; subtracting leaves exactly nums[i..j]. prefix[j] - prefix[i]
> drops nums[j], prefix[j+1] - prefix[i+1] drops nums[i], and
> prefix[j] - prefix[i-1] is shifted one place left (and at i = 0 reads
> prefix[-1], the last element).

## dsa-basic-011
topic: arrays-strings
answer: C
run: python

What does this program print?

```python
def reverse(a, lo, hi):
    while lo < hi:
        a[lo], a[hi] = a[hi], a[lo]
        lo += 1
        hi -= 1

a = [1, 2, 3, 4, 5, 6, 7]
k = 3
reverse(a, 0, len(a) - 1)
reverse(a, 0, k - 1)
reverse(a, k, len(a) - 1)
print(a)
```

- A: `[4, 5, 6, 7, 1, 2, 3]`
- B: `[7, 6, 5, 4, 3, 2, 1]`
- C: `[5, 6, 7, 1, 2, 3, 4]`
- D: `[3, 2, 1, 7, 6, 5, 4]`

> Reversing the whole list gives [7, 6, 5, 4, 3, 2, 1]; reversing the first
> three gives [5, 6, 7, 4, 3, 2, 1]; reversing the rest gives
> [5, 6, 7, 1, 2, 3, 4]. Three in-place reversals rotate the list right by k
> with O(1) extra memory. [4, 5, 6, 7, 1, 2, 3] would be a rotation left.

## dsa-basic-012
topic: arrays-strings
answer: A

For a list of length n, how many swaps does `reverse` make, and how much extra memory does it use beyond the list itself?

```python
def reverse(a):
    lo, hi = 0, len(a) - 1
    while lo < hi:
        a[lo], a[hi] = a[hi], a[lo]
        lo += 1
        hi -= 1
```

- A: `n // 2` swaps, O(1) extra memory
- B: `n` swaps, O(1) extra memory
- C: `n // 2` swaps, O(n) extra memory
- D: `(n + 1) // 2` swaps, O(1) extra memory

> Each swap puts two elements in their final places and the pointers meet in
> the middle, so there are n // 2 swaps; in an odd-length list the middle
> element never moves (lo < hi is false there), so it is not (n + 1) // 2.
> Only two indices are kept, so the extra memory is constant. Doing n swaps
> would swap every pair twice and undo the reversal.

## dsa-basic-013
topic: arrays-strings
answer: A

`has_pair` should return `True` exactly when two items at different positions add up to `target`. For which inputs is it guaranteed to answer correctly?

```python
def has_pair(nums, target):
    i, j = 0, len(nums) - 1
    while i < j:
        s = nums[i] + nums[j]
        if s == target:
            return True
        if s < target:
            i += 1
        else:
            j -= 1
    return False
```

- A: Lists sorted in ascending order
- B: Any list of integers
- C: Lists with no duplicate values
- D: Lists of non-negative integers

> Moving i right is only safe because, in a sorted list, nums[i] cannot pair
> with anything at or left of j once nums[i] + nums[j] is too small (and the
> mirror argument for moving j). Without sorting the pointer moves throw
> pairs away: [1, 5, 2, 4] with target 6 has no duplicates and no negatives,
> yet the function returns False although 1 + 5 = 6.

## dsa-basic-014
topic: arrays-strings
answer: B
run: python

What does this program print?

```python
nums = [1, 1, 2, 3, 3, 3, 4]
w = 1
for r in range(1, len(nums)):
    if nums[r] != nums[w - 1]:
        nums[w] = nums[r]
        w += 1
print(w, nums)
```

- A: `4 [1, 2, 3, 4]`
- B: `4 [1, 2, 3, 4, 3, 3, 4]`
- C: `3 [1, 2, 3, 4, 3, 3, 4]`
- D: `4 [1, 2, 3, 4, 0, 0, 0]`

> The read pointer r scans every item and the write pointer w copies each new
> value forward: 2 to index 1, 3 to index 2, 4 to index 3, ending with w = 4
> (the count of distinct values, the first one included). The list is never
> shortened or cleared: positions from w on keep their old values, which is
> why in-place "remove duplicates" returns the new length.

## dsa-basic-015
topic: hashing
answer: D
run: python

What does this program print?

```python
s = "abacabad"
counts = {}
for ch in s:
    counts[ch] = counts.get(ch, 0) + 1
for i, ch in enumerate(s):
    if counts[ch] == 1:
        print(i, ch)
        break
```

- A: `0 a`
- B: `1 b`
- C: `7 d`
- D: `3 c`

> The first pass counts every character: a 4, b 2, c 1, d 1. The second pass
> walks the string in order and stops at the first character whose total
> count is 1, which is c at index 3. d is also unique but comes later. The
> counts must be complete before the second pass, which is why it takes two.

## dsa-basic-016
topic: hashing
answer: A
run: python

What does this program print?

```python
nums = [4, 7, 1, 9, 3, 6]
target = 10
seen = {}
for i, x in enumerate(nums):
    if target - x in seen:
        print(seen[target - x], i)
        break
    seen[x] = i
```

- A: `2 3`
- B: `1 4`
- C: `0 5`
- D: `3 2`

> Three pairs sum to 10 (4+6, 7+3, 1+9), but the one-pass method reports the
> pair whose second item comes first. At i = 3, x = 9 and 10 - 9 = 1 is
> already in the map at index 2, so it prints the stored index then the
> current one: 2 3. The pairs ending at indices 4 and 5 are never reached.

## dsa-basic-017
topic: hashing
answer: C

A hash table resolves collisions by separate chaining, each bucket holding a plain linked list. A badly chosen hash function sends all n keys to the same bucket. What is the worst-case time to look up one key?

- A: O(1)
- B: O(log n)
- C: O(n)
- D: O(n²)

> All n keys sit in one unsorted chain, so a lookup may compare against every
> one of them: O(n), the same as a linear search. The O(1) average holds only
> when the hash function spreads keys evenly and the load factor is bounded;
> a plain linked list cannot be searched in O(log n).

## dsa-basic-018
topic: hashing
answer: A, C, E

Which statements about collisions in a hash table are true? Select all that apply.

- A: Two different keys can land in the same bucket even with a good hash function.
- B: When two keys collide, the one inserted first is overwritten and lost.
- C: With separate chaining, keys that collide are kept together in that bucket's list.
- D: Collisions can only happen once every bucket already holds a key.
- E: With linear probing, a new key whose bucket is taken goes to the next free slot.

> There are far more possible keys than buckets, so some distinct keys must
> share a bucket however good the hash is (A), and that can happen while most
> buckets are still empty (D is false). Collision handling exists precisely
> so that no key is lost (B is false): chaining keeps both keys in the
> bucket's list (C), and linear probing walks forward to the next free slot
> (E).

## dsa-basic-019
topic: hashing
answer: D

Strings `s` and `t` each have length n. Which approach decides whether they are anagrams of each other both correctly and in O(n) expected time?

- A: Sort both with a comparison sort and compare the results
- B: Compare the sum of the character codes of s with that of t
- C: For each character of s, find and remove one occurrence of it in t
- D: Count the characters of s in a hash map, decrement for t, check all are 0

> Counting is one pass over each string with O(1) expected hash-map
> operations, so O(n), and equal counts are exactly what "anagram" means.
> Sorting is correct but O(n log n); find-and-remove is correct but O(n²).
> Summing codes is fast but wrong: "ad" and "bc" have the same sum (97 + 100 =
> 98 + 99) and are not anagrams.

## dsa-basic-020
topic: linked-lists
answer: D
run: python

What does this program print?

```python
class Node:
    def __init__(self, val, next=None):
        self.val = val
        self.next = next

def reverse(head):
    prev = None
    cur = head
    while cur:
        nxt = cur.next
        cur.next = prev
        prev = cur
        cur = nxt
    return prev

head = Node(1, Node(2, Node(3, Node(4))))
new_head = reverse(head)
print(new_head.val, head.val, head.next)
```

- A: `1 4 None`
- B: `4 1 2`
- C: `4 4 None`
- D: `4 1 None`

> reverse points each node's next at the node before it and returns the old
> tail, 4. The variable head still refers to node 1, which is now the last
> node, so its next is None. Reversal re-links the nodes; it does not move
> values or update the caller's head variable.

## dsa-basic-021
topic: linked-lists
answer: B
run: python

What does this program print?

```python
class Node:
    def __init__(self, val, next=None):
        self.val = val
        self.next = next

def build(values):
    head = None
    for v in reversed(values):
        head = Node(v, head)
    return head

def middle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return slow.val

print(middle(build([1, 2, 3, 4, 5])), middle(build([1, 2, 3, 4, 5, 6])))
```

- A: `3 3`
- B: `3 4`
- C: `2 3`
- D: `4 4`

> fast moves two nodes for each one slow moves, so slow is halfway when fast
> runs out. For 5 nodes fast stops on node 5 (no next) with slow on 3. For 6
> nodes slow steps 2, 3, 4 while fast steps 3, 5, then None: with this loop
> condition an even-length list gives the second of the two middle nodes.

## dsa-basic-022
topic: linked-lists
answer: B, D, E

A singly linked list holds n nodes and keeps a pointer to its first node (head) and to its last node (tail); each node has only a `next` pointer. Which operations take O(1) time in the worst case? Select all that apply.

- A: Delete the last node
- B: Insert a new node at the front
- C: Check whether a given value is in the list
- D: Insert a new node at the end
- E: Delete the first node

> Front insert and delete only touch head (B, E); end insert links
> tail.next to the new node and moves tail (D). Deleting the last node needs
> the node before it, to set its next to None and make it the new tail, and
> without back pointers that means walking from head: O(n). Searching for a
> value is a linear scan, O(n).

## dsa-basic-023
topic: linked-lists
answer: B

Floyd's cycle check starts two pointers at the head of a singly linked list: `slow` moves one node per step and `fast` moves two. If the list contains a cycle, what happens?

- A: fast reaches the end (None) within n steps
- B: slow and fast end up on the same node
- C: they meet only if the cycle's length is even
- D: they never meet, because fast stays ahead

> In a cycle there is no end, so fast never reaches None. Once both pointers
> are inside the cycle, fast gains exactly one node on slow per step, so the
> gap between them shrinks by one each step and must reach zero — it cannot
> jump over slow. That holds for any cycle length.

## dsa-basic-024
topic: linked-lists
answer: A
run: python

What does this program print?

```python
class Node:
    def __init__(self, val, next=None):
        self.val = val
        self.next = next

head = Node(1, Node(2, Node(3)))
cur = head
while cur:
    if cur.val % 2 == 1:
        cur.next = Node(cur.val, cur.next)
        cur = cur.next.next
    else:
        cur = cur.next

out = []
cur = head
while cur:
    out.append(cur.val)
    cur = cur.next
print(out)
```

- A: `[1, 1, 2, 3, 3]`
- B: `[1, 2, 3, 1, 3]`
- C: `[1, 1, 2, 3]`
- D: It never finishes.

> Inserting after cur is two link changes: the new node points at cur's old
> next, and cur points at the new node — O(1), nothing shifts. The loop then
> jumps over the copy (cur.next.next), so the odd copy is never visited and
> copied again; 1 gets a copy before 2, and 3 gets one at the end.
