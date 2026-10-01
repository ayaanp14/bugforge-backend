---
skill: dsa
level: intermediate
---

## dsa-intermediate-001
topic: trees
answer: C
run: python

This program builds a binary search tree, deletes the root, and prints the tree in preorder. What does it print?

```python
class Node:
    def __init__(self, key):
        self.key = key
        self.left = None
        self.right = None

def insert(root, key):
    if root is None:
        return Node(key)
    if key < root.key:
        root.left = insert(root.left, key)
    else:
        root.right = insert(root.right, key)
    return root

def delete(root, key):
    if root is None:
        return None
    if key < root.key:
        root.left = delete(root.left, key)
    elif key > root.key:
        root.right = delete(root.right, key)
    else:
        if root.left is None:
            return root.right
        if root.right is None:
            return root.left
        succ = root.right
        while succ.left is not None:
            succ = succ.left
        root.key = succ.key
        root.right = delete(root.right, succ.key)
    return root

def preorder(node, out):
    if node:
        out.append(node.key)
        preorder(node.left, out)
        preorder(node.right, out)
    return out

root = None
for k in [50, 30, 70, 20, 40, 60, 80, 65]:
    root = insert(root, k)
root = delete(root, 50)
print(*preorder(root, []))
```

- A: `40 30 20 70 60 65 80`
- B: `60 30 20 40 70 80`
- C: `60 30 20 40 70 65 80`
- D: `70 60 30 20 40 65 80`

> 50 has two children, so the code copies in its in-order successor: the
> minimum of the right subtree, found by going right to 70 and then left as far
> as possible, which is 60. It then deletes 60 from the right subtree; 60 has
> no left child, so its right child 65 takes its place under 70. The tree is
> 60 (30 (20, 40), 70 (65, 80)), and its preorder is `60 30 20 40 70 65 80`.
> Starting with 40 is the in-order *predecessor* variant, which this code does
> not use; dropping 65 forgets that the successor's right child is re-attached;
> starting with 70 promotes the right child, which is not what the code does.

## dsa-intermediate-002
topic: trees
answer: D

The keys 1 to 15 are inserted, in the order given, into an empty binary search tree that does no rebalancing. Which insertion order produces a tree of height 3 (height = number of edges on the longest root-to-leaf path)?

- A: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15
- B: 1, 15, 2, 14, 3, 13, 4, 12, 5, 11, 6, 10, 7, 9, 8
- C: 8, 1, 15, 2, 14, 3, 13, 4, 12, 5, 11, 6, 10, 7, 9
- D: 8, 4, 12, 2, 6, 10, 14, 1, 3, 5, 7, 9, 11, 13, 15

> Order D is the level order of the perfect tree on 1..15: the median 8 first,
> then the medians of each half, and so on, so every level fills before the next
> starts and 15 nodes fit in 4 levels (height 3). Sorted input (A) makes every
> key a right child: a chain of height 14. The zigzag order (B) also adds one
> level per key (each new key falls between the last two), height 14. Order C
> picks a good root but then builds a chain on each side (1→2→…→7 and
> 15→14→…→9), height 7.

## dsa-intermediate-003
topic: trees
answer: A
run: python

What does this program print?

```python
class Node:
    def __init__(self, key):
        self.key, self.left, self.right = key, None, None

def insert(root, key):
    if root is None:
        return Node(key)
    if key < root.key:
        root.left = insert(root.left, key)
    else:
        root.right = insert(root.right, key)
    return root

def lca(root, a, b):
    node = root
    while node:
        if a < node.key and b < node.key:
            node = node.left
        elif a > node.key and b > node.key:
            node = node.right
        else:
            return node.key

root = None
for k in [20, 10, 30, 5, 15, 25, 35, 12, 17]:
    root = insert(root, k)
print(lca(root, 12, 17), lca(root, 5, 17), lca(root, 12, 25), lca(root, 15, 17))
```

- A: `15 10 20 15`
- B: `15 10 20 10`
- C: `15 15 20 15`
- D: `12 10 20 15`

> The tree is 20 (10 (5, 15 (12, 17)), 30 (25, 35)). The loop walks down while
> both keys lie on the same side of the current node; the first node that
> separates them, or equals one of them, is the lowest common ancestor.
> (12, 17) separate at 15; (5, 17) at 10; (12, 25) at the root 20. For
> (15, 17), 15 is itself an ancestor of 17, and a node counts as its own
> ancestor, so the answer is 15, not its parent 10.

## dsa-intermediate-004
topic: trees
answer: D
run: python

This program performs a level-order traversal and records the last node of each level. What does it print?

```python
from collections import deque

class Node:
    def __init__(self, key, left=None, right=None):
        self.key, self.left, self.right = key, left, right

root = Node(1, Node(2, Node(4), Node(5, Node(8))), Node(3, None, Node(6)))

view = []
q = deque([root])
while q:
    size = len(q)
    for i in range(size):
        node = q.popleft()
        if i == size - 1:
            view.append(node.key)
        if node.left:
            q.append(node.left)
        if node.right:
            q.append(node.right)
print(view)
```

- A: `[1, 3, 6]`
- B: `[1, 2, 4, 8]`
- C: `[1, 2, 3, 4, 5, 6, 8]`
- D: `[1, 3, 6, 8]`

> Taking `len(q)` at the start of each round processes exactly one level per
> round. The levels are [1], [2, 3], [4, 5, 6] and [8], so the last node of each
> is 1, 3, 6, 8 (the tree seen from the right). 8 sits in the left subtree but
> is the only node at depth 3, so it is still visible from the right: following
> only right pointers (1, 3, 6) misses it. [1, 2, 4, 8] is the left view, and
> the full list is a plain level order.

## dsa-intermediate-005
topic: trees
answer: D

A function decides whether a binary tree is a binary search tree by checking only that, at every node, the left child's key is smaller and the right child's key is larger than the node's own key. Which tree passes this check but is NOT a valid binary search tree?

- A: Root 10 with children 5 (left) and 15 (right); 5 has a right child 8.
- B: Root 10 with children 5 (left) and 15 (right); 5 has a left child 7.
- C: Root 10 with children 5 (left) and 15 (right); 15 has a left child 12.
- D: Root 10 with children 5 (left) and 15 (right); 15 has a left child 7.

> The BST property is about whole subtrees: every key in the right subtree of
> 10 must exceed 10. In D, 7 is smaller than its parent 15, so the local check
> passes, but 7 sits in 10's right subtree, so the tree is not a BST. A and C
> are valid BSTs (8 is between 5 and 10; 12 is between 10 and 15). B fails the
> local check itself (7 is a left child larger than 5). The correct test passes
> a (low, high) range down the recursion, or checks that the in-order sequence
> is strictly increasing.

## dsa-intermediate-006
topic: trees
answer: A

To delete a node with two children from a binary search tree, a common method copies the in-order successor's key into the node and then deletes the successor from the right subtree. Why is that second deletion always one of the easy cases?

- A: The successor has no left child.
- B: The successor is always a leaf.
- C: The successor is always the node's right child.
- D: The successor has no right child.

> The successor is the minimum of the right subtree, found by following left
> links until there are none, so by construction it has no left child. It can
> still have a right child (so it is not always a leaf), which simply takes its
> place: a zero- or one-child deletion. It is the node's right child only when
> that child has no left subtree, and nothing stops it from having a right
> child.

## dsa-intermediate-007
topic: heaps
answer: A
run: python

What does this program print?

```python
import heapq

h = []
for x in [5, 3, 8, 1, 9, 2]:
    heapq.heappush(h, x)
heapq.heappop(h)
print(h)
```

- A: `[2, 3, 8, 5, 9]`
- B: `[2, 3, 5, 8, 9]`
- C: `[3, 5, 2, 8, 9]`
- D: `[8, 3, 2, 5, 9]`

> The six pushes, each sifting up, leave the array [1, 3, 2, 5, 9, 8]. The pop
> removes 1, moves the last element 8 to the root and sifts it down past its
> smaller child 2, giving [2, 3, 8, 5, 9]. A heap array is only partially
> ordered, so it is not the sorted list. Leaving 8 at the root skips the
> sift-down; always swapping with the left child gives [3, 5, 2, 8, 9], which
> breaks the heap (2 under 3).

## dsa-intermediate-008
topic: heaps
answer: B

Bottom-up heap construction (heapify) runs sift-down on every internal node, from the last internal node back to the root. What is its worst-case running time on an array of n elements?

- A: Θ(log n)
- B: Θ(n)
- C: Θ(n log n)
- D: Θ(n²)

> A node at height h sifts down at most h levels, and there are at most about
> n / 2^(h+1) nodes at height h. The sum over all heights of h · n / 2^(h+1) is
> at most n, so the total is Θ(n): most nodes sit near the bottom and move only
> a step or two. Θ(n log n) is the worst case for inserting the n elements one
> at a time with sift-up, where a node near the bottom may climb the full
> height.

## dsa-intermediate-009
topic: heaps
answer: C
run: python

What does this program print?

```python
import heapq

def kth_largest(nums, k):
    h = []
    for x in nums:
        heapq.heappush(h, x)
        if len(h) > k:
            heapq.heappop(h)
    return h[0]

print(kth_largest([4, 11, 2, 11, 6, 8, 1], 3))
```

- A: `11`
- B: `6`
- C: `8`
- D: `4`

> The min-heap is capped at k = 3 elements: whenever it grows past 3, the
> smallest is thrown away, so it always holds the 3 largest values seen so far
> and its root is the smallest of them. The three largest values are 11, 11
> and 8, so it returns 8. Duplicates count separately (6 would be the third
> largest *distinct* value); 11 is the largest, and 4 is the third smallest.
> The method runs in O(n log k).

## dsa-intermediate-010
topic: heaps
answer: D

A binary heap with n = 10 elements is stored in a 0-indexed array, with the children of index i at 2i + 1 and 2i + 2. Which indices hold the leaves?

- A: 4 through 9
- B: 6 through 9
- C: 3 through 9
- D: 5 through 9

> An index i is a leaf when its left child 2i + 1 is past the end, that is
> 2i + 1 ≥ 10, so i ≥ 5. Index 4 is the last internal node: its left child is
> index 9. So the leaves are 5..9, half the array, and the last internal node
> is at n/2 − 1, which is where heapify starts.

## dsa-intermediate-011
topic: heaps
answer: A

In a binary min-heap stored in an array, the key of the element at a known index i is decreased. What is the cheapest correct way to restore the heap property, and what does it cost?

- A: Sift the element up toward the root, O(log n).
- B: Sift the element down toward the leaves, O(log n).
- C: Rebuild the whole array with heapify, O(n); nothing cheaper is safe.
- D: Do nothing, because a smaller key cannot break a min-heap.

> Its children were at least the old key, and the new key is smaller, so the
> subtree below is still fine; the only possible violation is with the parent.
> Sifting up repairs that in at most the height of the tree, O(log n). Sifting
> down does nothing useful here (it is the fix for an *increased* key), and
> heapify works but costs O(n). Note the "known index": finding an element in
> a heap costs O(n), which is why Dijkstra implementations keep a position map
> or push a duplicate entry instead.

## dsa-intermediate-012
topic: graphs
answer: B
run: python

This program runs Dijkstra's algorithm from vertex 0 on a directed graph. What does it print?

```python
import heapq

n = 5
edges = [(0, 1, 4), (0, 2, 1), (2, 1, 2), (1, 3, 1), (2, 3, 5), (3, 4, 3)]
adj = [[] for _ in range(n)]
for u, v, w in edges:
    adj[u].append((v, w))

INF = float("inf")
dist = [INF] * n
dist[0] = 0
pq = [(0, 0)]
while pq:
    d, u = heapq.heappop(pq)
    if d > dist[u]:
        continue
    for v, w in adj[u]:
        if d + w < dist[v]:
            dist[v] = d + w
            heapq.heappush(pq, (dist[v], v))
print(dist)
```

- A: `[0, 4, 1, 5, 8]`
- B: `[0, 3, 1, 4, 7]`
- C: `[0, 1, 1, 2, 3]`
- D: `[0, 3, 1, 6, 9]`

> Vertex 2 is closest (1). Through 2, vertex 1 costs 1 + 2 = 3, cheaper than the
> direct edge of 4. Vertex 3 then costs 3 + 1 = 4 through 1 (going 2→3 directly
> would be 6), and vertex 4 costs 4 + 3 = 7. [0, 4, 1, 5, 8] keeps the first
> distance found for vertex 1; [0, 1, 1, 2, 3] counts edges, as BFS would;
> [0, 3, 1, 6, 9] reaches 3 only by the direct edge from 2.

## dsa-intermediate-013
topic: graphs
answer: C

Dijkstra's algorithm can return wrong distances on a directed graph that has a negative edge weight, even when the graph has no negative cycle. Why?

- A: Its priority queue cannot hold negative keys, so some distances are silently dropped.
- B: Any negative edge creates a negative cycle, so shortest paths stop being defined.
- C: It treats a popped node's distance as final, but a later negative edge could lower it.
- D: It visits nodes in order of edge count from the source, ignoring the edge weights.

> Dijkstra's correctness rests on one argument: when the node with the smallest
> tentative distance is popped, no other path can reach it more cheaply,
> because every other path must leave through a node with an equal or larger
> distance and can only grow from there. A negative edge breaks the "can only
> grow" part, so a finalised distance may be wrong. Priority queues handle
> negative keys fine, a negative edge does not imply a negative cycle, and the
> algorithm orders by distance, not edge count. Bellman–Ford (O(VE)) handles
> negative edges.

## dsa-intermediate-014
topic: graphs
answer: D
run: python

This program runs Kahn's topological sort, but always takes the smallest available vertex. What does it print?

```python
import heapq

n = 6
edges = [(5, 2), (5, 0), (4, 0), (4, 1), (2, 3), (3, 1)]
adj = [[] for _ in range(n)]
indeg = [0] * n
for u, v in edges:
    adj[u].append(v)
    indeg[v] += 1

ready = [v for v in range(n) if indeg[v] == 0]
heapq.heapify(ready)
order = []
while ready:
    u = heapq.heappop(ready)
    order.append(u)
    for v in adj[u]:
        indeg[v] -= 1
        if indeg[v] == 0:
            heapq.heappush(ready, v)
print(*order)
```

- A: `4 5 2 0 3 1`
- B: `5 4 2 3 1 0`
- C: `4 0 5 2 3 1`
- D: `4 5 0 2 3 1`

> Initially 4 and 5 have no incoming edges. 4 is taken first; it lowers the
> in-degrees of 0 and 1, but each still waits on another vertex (5 and 3). Then
> 5 frees both 2 and 0, and the heap hands out the smaller, 0, before 2; then 2
> frees 3, and 3 frees 1. `4 5 2 0 3 1` is what a plain FIFO queue would produce
> (also a valid order, but not this program's); `4 0 …` places 0 before its
> prerequisite 5.

## dsa-intermediate-015
topic: graphs
answer: A, C

A directed graph has the edges a→c, b→c, c→e, b→d, d→e, e→f and d→f. Which of these are valid topological orders? Select all that apply.

- A: a, b, c, d, e, f
- B: a, c, b, d, e, f
- C: b, d, a, c, e, f
- D: b, a, d, e, c, f
- E: a, b, d, c, f, e

> An order is topological when every edge points forward in it. A and C pass
> all seven edges. B puts c before b, breaking b→c. D puts e before c, breaking
> c→e. E puts f before e, breaking e→f. A DAG usually has many topological
> orders; only the precedence constraints matter.

## dsa-intermediate-016
topic: graphs
answer: B

In an unweighted graph, which task does breadth-first search solve directly that depth-first search, in general, does not?

- A: Deciding whether two given vertices are connected
- B: Finding a path with the fewest edges between two vertices
- C: Detecting whether a directed graph contains a cycle
- D: Counting the connected components of an undirected graph

> BFS discovers vertices in order of distance from the source, so the first
> time it reaches the target it has used the fewest edges. DFS reaches the
> target along whatever path it happens to follow, which can be much longer.
> Connectivity and component counting work with either traversal, and cycle
> detection in a directed graph is a classic DFS application (an edge back to a
> vertex still on the recursion stack).

## dsa-intermediate-017
topic: graphs
answer: A

DFS on a directed graph colours each vertex WHITE (not yet visited), GRAY (on the current recursion stack) or BLACK (finished). While exploring the edges of the current vertex, which kind of edge proves that the graph has a cycle?

- A: An edge to a GRAY vertex
- B: An edge to a BLACK vertex
- C: Any edge to a vertex that is not WHITE
- D: An edge to a WHITE vertex

> A GRAY vertex is an ancestor of the current vertex on the recursion stack, so
> an edge to it closes a path back to itself: a cycle (a back edge). An edge to
> a BLACK vertex leads into a part of the graph that is already finished, which
> happens in acyclic graphs too (two paths into the same vertex). "Any visited
> vertex" is the undirected-graph rule and would report false cycles here. An
> edge to a WHITE vertex is simply the next tree edge.

## dsa-intermediate-018
topic: graphs
answer: C
run: python

This program feeds edges of an undirected graph into a union-find structure. What does it print?

```python
parent = list(range(6))

def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]
        x = parent[x]
    return x

def union(a, b):
    ra, rb = find(a), find(b)
    if ra == rb:
        return False
    parent[ra] = rb
    return True

edges = [(1, 2), (3, 4), (2, 3), (1, 5), (4, 1), (5, 3)]
extra = [e for e in edges if not union(*e)]
print(extra)
```

- A: `[(4, 1)]`
- B: `[(2, 3), (4, 1)]`
- C: `[(4, 1), (5, 3)]`
- D: `[(5, 3)]`

> `union` returns False when both endpoints already have the same root, which
> means the edge would close a cycle. (1, 2), (3, 4) and (2, 3) join
> {1, 2, 3, 4}; (1, 5) adds 5. Then (4, 1) and (5, 3) both connect vertices
> that are already connected, so both are listed. Five connected vertices need
> only 4 tree edges, so 6 edges must leave exactly 2 extra.

## dsa-intermediate-019
topic: graphs
answer: C
run: python

This program runs Kruskal's algorithm on a weighted undirected graph. What does it print?

```python
edges = [(0, 1, 1), (1, 2, 2), (0, 2, 2), (2, 3, 3), (1, 3, 4), (3, 4, 5), (2, 4, 6)]
parent = list(range(5))

def find(x):
    while parent[x] != x:
        x = parent[x]
    return x

total = 0
for u, v, w in sorted(edges, key=lambda e: e[2]):
    ru, rv = find(u), find(v)
    if ru != rv:
        parent[ru] = rv
        total += w
print(total)
```

- A: `8`
- B: `10`
- C: `11`
- D: `12`

> Kruskal takes edges cheapest first and skips any whose endpoints are already
> connected. It takes 0–1 (1) and 1–2 (2), skips 0–2 (2) because 0 and 2 are
> already joined, takes 2–3 (3), skips 1–3 (4), and takes 3–4 (5): total 11 with
> four edges. Summing the four cheapest edges (8) ignores the cycle 0–1–2. The
> shortest-path tree from 0 (edges 0–1, 0–2, 2–3, 2–4) weighs 12: a
> shortest-path tree is not a minimum spanning tree.

## dsa-intermediate-020
topic: recursion-dp
answer: B
run: python

What does this program print?

```python
a, b = "SEQUENCE", "QUEENS"
m, n = len(a), len(b)
dp = [[0] * (n + 1) for _ in range(m + 1)]
for i in range(1, m + 1):
    for j in range(1, n + 1):
        if a[i - 1] == b[j - 1]:
            dp[i][j] = dp[i - 1][j - 1] + 1
        else:
            dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
print(dp[m][n])
```

- A: `3`
- B: `4`
- C: `5`
- D: `6`

> This is the longest common subsequence table, and `dp[m][n]` is the LCS
> length of the whole strings: 4, for example "QUEN" or "QUEE". "QUEEN" (5) is
> not a subsequence of "SEQUENCE": its only N comes before its last E. 3 is
> the longest common *substring* ("QUE"), which must be contiguous. 6 counts
> the shared letters with multiplicity but ignores their order.

## dsa-intermediate-021
topic: recursion-dp
answer: B
run: python

What does this program print?

```python
weights = [3, 4, 5]
values = [5, 6, 8]
W = 9
dp = [0] * (W + 1)
for w, v in zip(weights, values):
    for c in range(W, w - 1, -1):
        dp[c] = max(dp[c], dp[c - w] + v)
print(dp[W])
```

- A: `13`
- B: `14`
- C: `15`
- D: `19`

> This is 0/1 knapsack in one array. Because the capacity loop runs downward,
> `dp[c - w]` still holds the value from before the current item, so each item
> is used at most once. The best choice is the items of weight 4 and 5 (total
> weight 9, value 6 + 8 = 14). 15 is three copies of the weight-3 item, which is
> what the same code computes if the capacity loop runs upward (the unbounded
> version). 13 is the greedy pick by value per weight (3 then 5), and 19 takes
> every item, which weighs 12.

## dsa-intermediate-022
topic: recursion-dp
answer: B
run: python

This is the O(n log n) method for the longest increasing subsequence. What does it print?

```python
from bisect import bisect_left

nums = [2, 6, 8, 3, 4, 5, 1]
tails = []
for x in nums:
    i = bisect_left(tails, x)
    if i == len(tails):
        tails.append(x)
    else:
        tails[i] = x
print(tails, len(tails))
```

- A: `[2, 3, 4, 5] 4`
- B: `[1, 3, 4, 5] 4`
- C: `[2, 6, 8] 3`
- D: `[1] 1`

> `tails[k]` is the smallest possible last element of an increasing
> subsequence of length k + 1 seen so far. 2, 6, 8 append; 3 replaces 6; 4
> replaces 8; 5 appends; 1 replaces 2. The final list is [1, 3, 4, 5] and its
> length, 4, is the LIS length. The list itself is not a subsequence of the
> input (1 comes after 5): the actual LIS here is 2, 3, 4, 5, which is why this
> method needs parent links to reconstruct the sequence.

## dsa-intermediate-023
topic: recursion-dp
answer: C
run: python

This loop is meant to count the ways to make 5 from coins of value 1, 2 and 5. What does it print?

```python
coins = [1, 2, 5]
amount = 5
ways = [1] + [0] * amount
for a in range(1, amount + 1):
    for c in coins:
        if c <= a:
            ways[a] += ways[a - c]
print(ways[amount])
```

- A: `4`
- B: `5`
- C: `9`
- D: `10`

> With the amount in the outer loop, `ways[a]` sums over the *last* coin
> used, so it counts ordered sequences: 1+2+2, 2+1+2 and 2+2+1 are three
> different ways. The counts are 1, 1, 2, 3, 5 for amounts 0..4, and
> ways[5] = ways[4] + ways[3] + ways[0] = 5 + 3 + 1 = 9. The number of
> combinations (order ignored) is 4; getting it needs the coins in the outer
> loop, so each coin's uses are all added before the next coin is considered.
