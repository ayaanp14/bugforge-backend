---
title: Union-Find (Disjoint Set Union)
stage: graphs-advanced
order: 2
minutes: 20
level: Intermediate
hub: union-find
practice: find-if-path-exists-in-graph, number-of-provinces, number-of-connected-components-in-an-undirected-graph, redundant-connection, graph-valid-tree, number-of-operations-to-make-network-connected, the-earliest-moment-when-everyone-become-friends, min-cost-to-connect-all-points, checking-existence-of-edge-length-limited-paths
updated: 2026-10-03
seo-title: Union-Find (Disjoint Set Union) Explained with Code
description: Learn union-find: find and union, path compression, union by size, counting components and finding cycles, with code in C++, Java, Python and JavaScript.
question: What is union-find (disjoint set union)?
answer: Union-find, also called disjoint set union (DSU), keeps elements in non-overlapping groups and supports two operations: find, which names the group an element belongs to, and union, which merges two groups. Each group is a tree of parent pointers whose root names it. With path compression and union by size, m operations take O(m α(n)) time — effectively constant per operation.
q: What is the difference between union by rank and union by size?
a: Both attach the root of the smaller tree under the root of the larger one so that trees stay shallow. Union by size compares element counts; union by rank compares an upper bound on each tree's height. Each gives O(log n) height on its own and the same near-constant bound with path compression. Size is often handier, because the size of every group is then available for free.
q: What is the inverse Ackermann function in union-find?
a: α(n) is the inverse of the Ackermann function, which grows faster than any tower of exponents, so α(n) grows almost unimaginably slowly: it is at most 4 for any input that could fit in a computer. Tarjan proved that union-find with path compression and union by rank or size takes O(m α(n)) for m operations, which is why each operation is treated as constant time.
q: When should I use union-find instead of BFS or DFS?
a: Use union-find when edges arrive over time and connectivity questions come in between, when you process edges in sorted order as in Kruskal's algorithm, or when you need the edge that closes a cycle in an undirected graph. For a single question about a fixed graph, BFS or DFS is just as fast, and only a search can give you the actual path or a distance.
q: Can union-find detect a cycle in a directed graph?
a: No. Union-find ignores direction and only knows whether two vertices are connected. The edges 0 → 1, 0 → 2 and 1 → 2 contain no directed cycle, yet union-find reports one on the third edge because 1 and 2 are already connected. For directed graphs, use a DFS with three colours or Kahn's topological sort.
q: Can union-find delete an edge or split a set?
a: Not efficiently. Once two sets are merged, and especially once path compression has re-pointed nodes, there is no cheap way to separate them again. When all the operations are known in advance, a common trick is to process them in reverse, so that deletions become additions.
---
Some problems are about groups that only ever **merge**: friends of friends become one circle, cables join computers into one network, adjacent land cells form one island. Between the merges, you are asked the same question again and again — *are these two in the same group?* **Union-find**, also called **disjoint set union (DSU)**, is the data structure built for exactly that. It answers each question and performs each merge in what is, for every practical input, constant time.

This lesson shows how union-find stores its groups, the two tricks that keep it fast and why they work, how it counts connected components and finds the edge that closes a cycle, and when a plain [breadth-first](/roadmap/breadth-first-search) or [depth-first search](/roadmap/depth-first-search) is the simpler choice. Every program is shown in C++, Java, Python and JavaScript.

## Why searching the graph each time is too slow

Picture n computers and a stream of operations: "connect a and b", "can a reach b?". The obvious answer to each question is a fresh BFS or DFS over the cables added so far, which costs O(V + E). With 10⁵ computers, 10⁵ cables and 10⁵ questions interleaved, that is up to 10⁵ searches of 2 × 10⁵ steps each: 2 × 10¹⁰ steps, far beyond the hundred million or so a judge allows in a second.

The next idea is to store a group label per element, so that a question is one comparison, `label[a] == label[b]`. Questions are now O(1), but a merge must relabel every member of one group — O(n) per merge, O(n²) for n merges. Union-find sits between these: it never relabels anyone, and it never searches the graph.

## The idea: every set is a tree

Union-find stores each group as a tree in a single array. `parent[x]` points one step towards the **root** of x's tree, and a root points at itself. The root is the group's name: two elements are in the same group exactly when their trees have the same root.

```text
 groups:   {0, 1, 2, 3}              {4, 5}

 trees:         0                       4
              /   \                     |
             1     2                    5
                   |
                   3

 index:    0  1  2  3  4  5
 parent:   0  0  0  2  4  4          a root is its own parent
```

Three operations work on those trees:

- **find(x)** follows parent pointers from x until it reaches a root, and returns that root. Above, find(3) walks 3 → 2 → 0 and returns 0.
- **union(a, b)** finds both roots. If they differ, it points one root at the other, which merges the two trees — and with them every element in both groups — in a single assignment. If they are the same, a and b were already together and nothing changes.
- **connected(a, b)** is `find(a) == find(b)`.

At the start every element is its own one-node tree: `parent[i] = i` for every i.

@walkthrough

## Keeping the trees short

Everything costs as much as a find, and a find costs the depth of the tree. Left to chance, trees can grow into long chains — union(1, 0), union(2, 1), union(3, 2), … each putting the old tree under a lone new node — and then a find is O(n), no better than the label array. Two tricks prevent that, one in each operation.

**Union by size.** When merging, always attach the root of the *smaller* tree under the root of the larger one, and keep a `size` per root. The reason this keeps trees short is a doubling argument. An element's depth increases by one only when the root of its tree goes under another root, and with union by size that happens only when its tree was the smaller (or equal) one. The merged tree is then at least twice the size of the element's old tree. A tree can double at most log₂ n times before it holds all n elements, so no element is ever deeper than log₂ n — 20 levels for a million elements. **Union by rank** is the same idea using an upper bound on height, called the rank, instead of the size. It gives the same bound; size is usually more useful, because problems often ask how big a group is.

**Path compression.** During a find, once the root is known, point every node on the walked path directly at it. This is allowed because a node's group is decided by the root it reaches, not by the route it takes: re-pointing a node at another node higher up in the same tree changes nothing about which group it is in, but every later find through that node takes one hop. A slow find therefore pays for itself by making the next ones fast.

Each trick alone gives O(log n) per operation. Together they give something much better. In 1975 Robert Tarjan proved that any sequence of m operations on n elements then takes O(m α(n)) time, where α is the **inverse Ackermann function**. The Ackermann function grows so explosively that its inverse is at most 4 for any n that could fit in a computer. You do not need the proof for an interview. You do need to know that the two tricks together earn the bound, and that it means "effectively constant time per operation".

### Dry run

The first program below runs union by size and path compression on 8 elements. Ties in size go the same way every time: the second root goes under the first.

| Operation | Roots found | What happens | parent after (elements 0–7) | Sets |
| --- | --- | --- | --- | --- |
| start | none | every element is a root | 0 1 2 3 4 5 6 7 | 8 |
| union(0, 1) | 0 and 1 | sizes 1 and 1: 1 goes under 0 | 0 0 2 3 4 5 6 7 | 7 |
| union(2, 3) | 2 and 3 | 3 goes under 2 | 0 0 2 2 4 5 6 7 | 6 |
| union(1, 3) | 0 and 2 | sizes 2 and 2: 2 goes under 0 | 0 0 0 2 4 5 6 7 | 5 |
| union(4, 5) | 4 and 5 | 5 goes under 4 | 0 0 0 2 4 4 6 7 | 4 |
| union(6, 7) | 6 and 7 | 7 goes under 6 | 0 0 0 2 4 4 6 6 | 3 |
| union(5, 7) | 4 and 6 | sizes 2 and 2: 6 goes under 4 | 0 0 0 2 4 4 4 6 | 2 |
| union(3, 0) | 0 and 0 | find(3) walks 3 → 2 → 0 and re-points 3 at 0; same root, no merge | 0 0 0 0 4 4 4 6 | 2 |
| connected(7, 4) | 4 and 4 | find(7) walks 7 → 6 → 4 and re-points 7 at 4: true | 0 0 0 0 4 4 4 4 | 2 |
| connected(1, 6) | 0 and 4 | different roots: false | 0 0 0 0 4 4 4 4 | 2 |

Two things to notice. The union of 3 and 0 changed nothing about the groups, but its find still flattened the path from 3. And at the end every element points straight at its root, so every later find is a single hop.

### The code

The class keeps the parent and size arrays and a count of sets, which falls by one on every union that really merges. That count is the number of **connected components**, the answer to [Number of Connected Components in an Undirected Graph](/problems/number-of-connected-components-in-an-undirected-graph) and [Number of Provinces](/problems/number-of-provinces).

```cpp
#include <iostream>
#include <numeric>
#include <utility>
#include <vector>
using namespace std;

class DSU {
public:
    vector<int> parent, size;
    int sets;

    DSU(int n) : parent(n), size(n, 1), sets(n) {
        iota(parent.begin(), parent.end(), 0);   // every element starts as its own root
    }

    int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);  // path compression
        return parent[x];
    }

    // Merges the sets of a and b; false when they were already one set.
    // (Named unite because union is a keyword in C++.)
    bool unite(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;
        if (size[ra] < size[rb]) swap(ra, rb);   // union by size: small tree under big root
        parent[rb] = ra;
        size[ra] += size[rb];
        sets--;
        return true;
    }

    bool connected(int a, int b) { return find(a) == find(b); }
};

int main() {
    DSU dsu(8);
    int edges[][2] = {{0, 1}, {2, 3}, {1, 3}, {4, 5}, {6, 7}, {5, 7}, {3, 0}};
    for (auto& e : edges) {
        cout << "union(" << e[0] << ", " << e[1] << "): ";
        if (dsu.unite(e[0], e[1])) cout << "merged, " << dsu.sets << " sets left\n";
        else cout << "already in one set\n";
    }
    int queries[][2] = {{7, 4}, {1, 6}};
    for (auto& q : queries)
        cout << "connected(" << q[0] << ", " << q[1] << ") = " << (dsu.connected(q[0], q[1]) ? "true" : "false") << "\n";
    cout << "parent after compression:";
    for (int p : dsu.parent) cout << " " << p;
    cout << "\n";
    return 0;
}
```

```java
public class Main {
    static class DSU {
        int[] parent, size;
        int sets;

        DSU(int n) {
            parent = new int[n];
            size = new int[n];
            sets = n;
            for (int i = 0; i < n; i++) {
                parent[i] = i;                   // every element starts as its own root
                size[i] = 1;
            }
        }

        int find(int x) {
            if (parent[x] != x) parent[x] = find(parent[x]);  // path compression
            return parent[x];
        }

        // Merges the sets of a and b; false when they were already one set.
        boolean union(int a, int b) {
            int ra = find(a), rb = find(b);
            if (ra == rb) return false;
            if (size[ra] < size[rb]) { int t = ra; ra = rb; rb = t; }  // union by size: small tree under big root
            parent[rb] = ra;
            size[ra] += size[rb];
            sets--;
            return true;
        }

        boolean connected(int a, int b) { return find(a) == find(b); }
    }

    public static void main(String[] args) {
        DSU dsu = new DSU(8);
        int[][] edges = {{0, 1}, {2, 3}, {1, 3}, {4, 5}, {6, 7}, {5, 7}, {3, 0}};
        for (int[] e : edges) {
            String head = "union(" + e[0] + ", " + e[1] + "): ";
            if (dsu.union(e[0], e[1])) System.out.println(head + "merged, " + dsu.sets + " sets left");
            else System.out.println(head + "already in one set");
        }
        int[][] queries = {{7, 4}, {1, 6}};
        for (int[] q : queries)
            System.out.println("connected(" + q[0] + ", " + q[1] + ") = " + dsu.connected(q[0], q[1]));
        StringBuilder line = new StringBuilder("parent after compression:");
        for (int p : dsu.parent) line.append(" ").append(p);
        System.out.println(line);
    }
}
```

```python
class DSU:
    def __init__(self, n):
        self.parent = list(range(n))  # every element starts as its own root
        self.size = [1] * n
        self.sets = n

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])  # path compression
        return self.parent[x]

    def union(self, a, b):
        """Merge the sets of a and b; False when they were already one set."""
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False
        if self.size[ra] < self.size[rb]:  # union by size: small tree under big root
            ra, rb = rb, ra
        self.parent[rb] = ra
        self.size[ra] += self.size[rb]
        self.sets -= 1
        return True

    def connected(self, a, b):
        return self.find(a) == self.find(b)


dsu = DSU(8)
for a, b in [(0, 1), (2, 3), (1, 3), (4, 5), (6, 7), (5, 7), (3, 0)]:
    if dsu.union(a, b):
        print(f"union({a}, {b}): merged, {dsu.sets} sets left")
    else:
        print(f"union({a}, {b}): already in one set")
for a, b in [(7, 4), (1, 6)]:
    answer = "true" if dsu.connected(a, b) else "false"
    print(f"connected({a}, {b}) = {answer}")
print("parent after compression:", *dsu.parent)
```

```javascript
class DSU {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i); // every element starts as its own root
    this.size = new Array(n).fill(1);
    this.sets = n;
  }

  find(x) {
    if (this.parent[x] !== x) this.parent[x] = this.find(this.parent[x]); // path compression
    return this.parent[x];
  }

  // Merges the sets of a and b; false when they were already one set.
  union(a, b) {
    let ra = this.find(a);
    let rb = this.find(b);
    if (ra === rb) return false;
    if (this.size[ra] < this.size[rb]) [ra, rb] = [rb, ra]; // union by size: small tree under big root
    this.parent[rb] = ra;
    this.size[ra] += this.size[rb];
    this.sets--;
    return true;
  }

  connected(a, b) {
    return this.find(a) === this.find(b);
  }
}

const dsu = new DSU(8);
for (const [a, b] of [[0, 1], [2, 3], [1, 3], [4, 5], [6, 7], [5, 7], [3, 0]]) {
  if (dsu.union(a, b)) console.log(`union(${a}, ${b}): merged, ${dsu.sets} sets left`);
  else console.log(`union(${a}, ${b}): already in one set`);
}
for (const [a, b] of [[7, 4], [1, 6]]) console.log(`connected(${a}, ${b}) = ${dsu.connected(a, b)}`);
console.log(`parent after compression: ${dsu.parent.join(" ")}`);
```

```output
union(0, 1): merged, 7 sets left
union(2, 3): merged, 6 sets left
union(1, 3): merged, 5 sets left
union(4, 5): merged, 4 sets left
union(6, 7): merged, 3 sets left
union(5, 7): merged, 2 sets left
union(3, 0): already in one set
connected(7, 4) = true
connected(1, 6) = false
parent after compression: 0 0 0 0 4 4 4 4
```

## Finding the edge that closes a cycle

The failed union is as useful as the successful ones. Read the edges of an undirected graph one at a time and union their endpoints. If an edge's two endpoints already have the same root, there was already a path between them, so this edge closes a **cycle**.

That is the whole of [Redundant Connection](/problems/redundant-connection). A tree on n nodes, labelled 1 to n, has had one extra edge added, and you must return an edge whose removal leaves a tree — the one that occurs last in the input if several would do. The first edge whose union fails is that answer. The graph has exactly one cycle, and every edge on it could be removed. All the cycle's edges before the failing one were accepted, because without the failing edge they form no cycle; the failing edge is the one that completes it, so it is the cycle edge that comes last in the input. Edges after it are never needed.

### Dry run

On the edges [1, 2], [2, 3], [3, 4], [1, 4], [1, 5]:

| Edge | find(a) | find(b) | Result |
| --- | --- | --- | --- |
| [1, 2] | 1 | 2 | different roots: union, 2 goes under 1 |
| [2, 3] | 1 | 3 | different roots: union, 3 goes under 1 |
| [3, 4] | 1 | 4 | different roots: union, 4 goes under 1 |
| [1, 4] | 1 | 1 | same root: 1 and 4 were already connected, so return [1, 4] |

The cycle is 1–2–3–4–1, and [1, 4] is the last of its edges in the input.

### The code

This version uses a compact iterative find with **path halving**: on the way up, each node is re-pointed at its grandparent. It needs no recursion, so a long chain cannot overflow the stack, and it gives the same O(α(n)) bound as full path compression when combined with union by size.

```cpp
#include <iostream>
#include <utility>
#include <vector>
using namespace std;

vector<int> parent, sz;

int findRoot(int x) {
    while (parent[x] != x) {
        parent[x] = parent[parent[x]];    // path halving: skip a level on the way up
        x = parent[x];
    }
    return x;
}

// The edge that closes the cycle when a tree on nodes 1..n gets one extra edge.
vector<int> findRedundant(const vector<vector<int>>& edges) {
    int n = edges.size();
    parent.assign(n + 1, 0);               // labels start at 1, so slot 0 is unused
    sz.assign(n + 1, 1);
    for (int i = 0; i <= n; i++) parent[i] = i;
    for (const auto& e : edges) {
        int ra = findRoot(e[0]), rb = findRoot(e[1]);
        if (ra == rb) return e;            // already connected: this edge closes a cycle
        if (sz[ra] < sz[rb]) swap(ra, rb);
        parent[rb] = ra;
        sz[ra] += sz[rb];
    }
    return {};
}

int main() {
    vector<vector<vector<int>>> examples = {
        {{1, 2}, {1, 3}, {2, 3}},
        {{1, 2}, {2, 3}, {3, 4}, {1, 4}, {1, 5}},
    };
    for (const auto& edges : examples) {
        vector<int> e = findRedundant(edges);
        cout << "Redundant edge: [" << e[0] << ", " << e[1] << "]\n";
    }
    return 0;
}
```

```java
public class Main {
    static int[] parent, size;

    static int findRoot(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];    // path halving: skip a level on the way up
            x = parent[x];
        }
        return x;
    }

    // The edge that closes the cycle when a tree on nodes 1..n gets one extra edge.
    static int[] findRedundant(int[][] edges) {
        int n = edges.length;
        parent = new int[n + 1];               // labels start at 1, so slot 0 is unused
        size = new int[n + 1];
        for (int i = 0; i <= n; i++) {
            parent[i] = i;
            size[i] = 1;
        }
        for (int[] e : edges) {
            int ra = findRoot(e[0]), rb = findRoot(e[1]);
            if (ra == rb) return e;            // already connected: this edge closes a cycle
            if (size[ra] < size[rb]) { int t = ra; ra = rb; rb = t; }
            parent[rb] = ra;
            size[ra] += size[rb];
        }
        return new int[0];
    }

    public static void main(String[] args) {
        int[][][] examples = {
            {{1, 2}, {1, 3}, {2, 3}},
            {{1, 2}, {2, 3}, {3, 4}, {1, 4}, {1, 5}},
        };
        for (int[][] edges : examples) {
            int[] e = findRedundant(edges);
            System.out.println("Redundant edge: [" + e[0] + ", " + e[1] + "]");
        }
    }
}
```

```python
def find_redundant(edges):
    """The edge that closes the cycle when a tree on nodes 1..n gets one extra edge."""
    n = len(edges)
    parent = list(range(n + 1))  # labels start at 1, so slot 0 is unused
    size = [1] * (n + 1)

    def find_root(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]  # path halving: skip a level on the way up
            x = parent[x]
        return x

    for a, b in edges:
        ra, rb = find_root(a), find_root(b)
        if ra == rb:
            return [a, b]  # already connected: this edge closes a cycle
        if size[ra] < size[rb]:
            ra, rb = rb, ra
        parent[rb] = ra
        size[ra] += size[rb]
    return []


examples = [
    [[1, 2], [1, 3], [2, 3]],
    [[1, 2], [2, 3], [3, 4], [1, 4], [1, 5]],
]
for edges in examples:
    a, b = find_redundant(edges)
    print(f"Redundant edge: [{a}, {b}]")
```

```javascript
// The edge that closes the cycle when a tree on nodes 1..n gets one extra edge.
function findRedundant(edges) {
  const n = edges.length;
  const parent = Array.from({ length: n + 1 }, (_, i) => i); // labels start at 1, so slot 0 is unused
  const size = new Array(n + 1).fill(1);

  function findRoot(x) {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]]; // path halving: skip a level on the way up
      x = parent[x];
    }
    return x;
  }

  for (const [a, b] of edges) {
    let ra = findRoot(a);
    let rb = findRoot(b);
    if (ra === rb) return [a, b]; // already connected: this edge closes a cycle
    if (size[ra] < size[rb]) [ra, rb] = [rb, ra];
    parent[rb] = ra;
    size[ra] += size[rb];
  }
  return [];
}

const examples = [
  [[1, 2], [1, 3], [2, 3]],
  [[1, 2], [2, 3], [3, 4], [1, 4], [1, 5]],
];
for (const edges of examples) {
  const [a, b] = findRedundant(edges);
  console.log(`Redundant edge: [${a}, ${b}]`);
}
```

```output
Redundant edge: [2, 3]
Redundant edge: [1, 4]
```

The same test answers [Graph Valid Tree](/problems/graph-valid-tree): a graph on n vertices is a tree exactly when it has n − 1 edges and no union fails. No failed union means no cycle, and an acyclic graph with n − 1 edges on n vertices has exactly one component, so it is connected.

This works only because the edges are undirected. Union-find ignores direction: the edges 0 → 1, 0 → 2 and 1 → 2 contain no directed cycle, yet the third union fails. For directed graphs use [Topological Sort](/roadmap/topological-sort) or a DFS with three colours.

## Where union-find shows up

- **Counting groups.** Start with n sets and let each successful union lower the count. [Number of Operations to Make Network Connected](/problems/number-of-operations-to-make-network-connected) adds one twist: with c components you need c − 1 cables, and every failed union is a spare cable you can move.
- **Connections that arrive over time.** In [The Earliest Moment When Everyone Become Friends](/problems/the-earliest-moment-when-everyone-become-friends), sort the logs by time and union as you go; the answer is the timestamp at which the set count reaches 1. Rerunning a search after each log would cost O(V + E) a time; union-find costs almost nothing per log. This is **dynamic connectivity** for a graph that only gains edges.
- **Kruskal's algorithm.** The [Minimum Spanning Tree](/roadmap/minimum-spanning-tree) lesson sorts edges by weight and keeps an edge only if its union succeeds — the same cycle test as above. [Min Cost to Connect All Points](/problems/min-cost-to-connect-all-points) is the standard exercise.
- **Offline queries sorted by a limit.** In [Checking Existence of Edge Length Limited Paths](/problems/checking-existence-of-edge-length-limited-paths), sort the queries by their limit and the edges by length. Before answering each query, union every edge shorter than its limit; then the answer is `connected(p, q)`. Each edge is added once in all.
- **Grids and other implicit graphs.** Give cell (r, c) the number r × cols + c and union neighbouring cells; islands become sets. The elements need not be places at all: in [Smallest String With Swaps](/problems/smallest-string-with-swaps) the indices that can be swapped form sets, and each set's characters can be sorted independently.

## Union-find or BFS and DFS?

Union-find is not always the right tool, and an interviewer will notice if you reach for it out of habit.

- **A fixed graph and one question** — count the components, is there a path from a to b — is answered by a single BFS or DFS in O(V + E), with no extra structure. Union-find is just as fast here, so use whichever you write more reliably.
- **Edges that arrive one at a time, with questions in between,** favour union-find: a search would have to start again after every new edge.
- **The actual path, a distance or a direction** needs a search. Union-find only ever knows "same set" or "different sets".
- **Deleting edges** suits neither cheaply, and union-find cannot split a set at all. If every operation is known in advance, process them in reverse so deletions become additions.

## Time and space complexity

| Version | find | union | m operations on n elements |
| --- | --- | --- | --- |
| Group label per element | O(1) | O(n) | O(m × n) |
| Parent pointers, no tricks | O(n) | O(n) | O(m × n) |
| Union by size or rank only | O(log n) | O(log n) | O(m log n) |
| Path compression only | O(log n) amortised | O(log n) amortised | O(m log n) |
| Both tricks | O(α(n)) amortised | O(α(n)) amortised | O(m α(n)) |

**Amortised** means the bound holds for the average over a sequence of operations: a single find can still walk a few levels, but it flattens what it walked, so the total stays small. Space is O(n) for the parent and size arrays. A problem that builds the structure from E edges and answers Q questions costs O((E + Q) α(n)), which beats a BFS per question as soon as there is more than a handful of questions.

## How to recognise a union-find problem

Read the statement for these signals:

- Things join **groups** through a relation that is symmetric and transitive: friends of friends, accounts that share an email, equations such as a == b, stones that share a row.
- The question is **"are these two connected?"** or **"how many groups are there?"**, asked after merges.
- Edges or merges **arrive over time**, and you want the moment something becomes connected.
- You must find **the edge that creates a cycle**, or decide whether an undirected graph is a tree.
- Edges are **added in sorted order** of weight or time, as in Kruskal's algorithm and offline queries.

If the question needs a shortest path, a direction or the route itself, use a search instead. If the graph is directed and the question is about cycles or ordering, use topological sort.

## Common mistakes

- **Linking elements instead of roots.** `parent[a] = b` moves a alone and leaves the rest of a's tree behind. Always link `find(a)` to `find(b)`.
- **Comparing parents instead of roots.** `parent[a] == parent[b]` is true only when both sit directly under the same node. Compare `find(a) == find(b)`.
- **Counting every union call.** Only a union that merges two different sets lowers the number of components. Decrement inside the branch that merges.
- **Off-by-one labels.** When nodes are labelled 1 to n, allocate n + 1 slots, as the second program does.
- **Using it on a directed graph.** Union-find has no notion of direction, so it reports cycles that do not exist.
- **Deep recursion in find.** Without union by size, a chain of 10⁵ elements makes the recursive find recurse 10⁵ deep before compression helps — fine in C++, a crash in Python. Keep union by size, or use the iterative path halving shown above.

## Practice in this order

Start with problems where union-find is the whole solution, then move to ones where it is one part of a bigger idea:

1. [Find if Path Exists in Graph](/problems/find-if-path-exists-in-graph): union every edge, then ask one question.
2. [Number of Provinces](/problems/number-of-provinces): count the sets, from an adjacency matrix.
3. [Number of Connected Components in an Undirected Graph](/problems/number-of-connected-components-in-an-undirected-graph): count the sets, from an edge list.
4. [Redundant Connection](/problems/redundant-connection): the first union that fails.
5. [Graph Valid Tree](/problems/graph-valid-tree): n − 1 edges and no failed union.
6. [Number of Operations to Make Network Connected](/problems/number-of-operations-to-make-network-connected): count components and spare cables.
7. [The Earliest Moment When Everyone Become Friends](/problems/the-earliest-moment-when-everyone-become-friends): unions in time order until one set is left.
8. [Min Cost to Connect All Points](/problems/min-cost-to-connect-all-points): union-find inside Kruskal's algorithm.
9. [Checking Existence of Edge Length Limited Paths](/problems/checking-existence-of-edge-length-limited-paths): offline queries sorted by their limit.

The [union-find problem list](/challenges/union-find) has every problem in the catalogue that uses it. Next on the road is [Dijkstra's Algorithm](/roadmap/dijkstras-algorithm), for the shortest route through a weighted graph.
