---
title: Union-Find (Disjoint Set Union)
stage: graphs-advanced
order: 2
minutes: 13
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
Some problems are about groups that only ever **merge**: friends of friends become one circle, cables join computers into one network, adjacent land cells form one island. Between the merges you are asked the same question again and again — *are these two in the same group?* **Union-find**, also called **disjoint set union (DSU)**, is the data structure built for exactly that: it keeps every group as a small tree in one array, and answers each question and performs each merge in effectively constant time.

@figure forest

## Why searching the graph each time is too slow

Picture n computers and a stream of operations: "connect a and b", "can a reach b?". A fresh [breadth-first](/roadmap/breadth-first-search) or [depth-first search](/roadmap/depth-first-search) per question costs O(V + E): with 10⁵ computers, cables and questions, up to 2 × 10¹⁰ steps, far beyond the hundred million or so a judge allows in a second. A group label per element makes each question one comparison, but then a merge must relabel a whole group, O(n²) for n merges. Union-find never relabels anyone, and never searches the graph.

## The idea: every set is a tree

`parent[x]` points one step towards the **root** of x's tree, and a root points at itself. The root is the group's name: two elements are in the same group exactly when they reach the same root. At the start every element is its own one-node tree, `parent[i] = i`. Three operations work on those trees:

- **find(x)** follows parent pointers from x to the root and returns it.
- **union(a, b)** finds both roots. If they differ, it points one root at the other: one assignment merges two whole groups. If they are the same, nothing changes.
- **connected(a, b)** is `find(a) == find(b)`.

@walkthrough

## Keeping the trees short

Every operation costs as much as a find, and a find costs the depth of the tree. Left to the order of the calls, trees grow into chains. Two tricks prevent that, one in each operation.

**Union by size** always hangs the root of the smaller tree under the root of the larger one, keeping a `size` for every root. The same four unions, with and without it:

@figure chain-vs-size

Why it works is a doubling argument: a node sinks a level only when its tree goes under one at least as big, so its set at least doubles, and a set can double only log₂ n times before it holds everything. No node is ever deeper than log₂ n — 20 levels for a million elements.

@figure doubling

**Union by rank** compares an upper bound on height instead of the size and gives the same bound; size is handier, because problems often ask how big a group is.

**Path compression** works inside find. Once the root is known, every node on the walked path is pointed straight at it. That is safe because a node's group is decided by the root it reaches, not by the route it takes — and it means a slow find pays for itself by making the next ones fast.

@figure compression

Each trick alone gives O(log n) per operation. Together, as Robert Tarjan proved in 1975, m operations take O(m α(n)), where α is the **inverse Ackermann function** — at most 4 for any n that fits in a computer: effectively constant time.

### The code

The class also counts the sets: every union that really merges lowers the count, and what is left is the number of **connected components** — the answer to [Number of Provinces](/problems/number-of-provinces).

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

Step through the program and match each frame to the line it prints:

@figure dry-run

## Finding the edge that closes a cycle

A failed union is as useful as a successful one. Union the ends of each edge of an undirected graph in turn; if they already share a root, a path already joined them, so this edge closes a **cycle**. In [Redundant Connection](/problems/redundant-connection) — a tree on nodes 1 to n plus one extra edge, where you return the removable edge that comes last in the input — the first failing edge is the answer: every cycle edge before it was accepted, and it is the one that completes the cycle.

@figure cycle

This version finds the root with **path halving**: on the way up, each node is re-pointed at its grandparent. It needs no recursion, so a long chain cannot overflow the stack, and the bound is the same.

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

The same test answers [Graph Valid Tree](/problems/graph-valid-tree): n − 1 edges and no failed union. It needs undirected edges — 0 → 1, 0 → 2 and 1 → 2 hold no directed cycle, yet the third union fails — so for directed graphs use [Topological Sort](/roadmap/topological-sort) or a DFS with three colours.

## Where union-find shows up

- **Counting groups**: c components need c − 1 extra cables, and every failed union is a spare one you can move.
- **Connections over time**: sort the logs by time and union until one set is left — **dynamic connectivity** for a graph that only gains edges.
- **Kruskal's algorithm**: the [Minimum Spanning Tree](/roadmap/minimum-spanning-tree) keeps an edge only if its union succeeds, the cycle test above.
- **Offline queries**: sort the queries by their limit and union every edge below it before answering `connected(p, q)`.
- **Grids**: number cell (r, c) as r × cols + c and union neighbours; islands become sets. In [Smallest String With Swaps](/problems/smallest-string-with-swaps) the sets are indices that can swap.

## Time and space complexity

| Version | find | union | m operations on n elements |
| --- | --- | --- | --- |
| Group label per element | O(1) | O(n) | O(m × n) |
| Parent pointers, no tricks | O(n) | O(n) | O(m × n) |
| Union by size or rank only | O(log n) | O(log n) | O(m log n) |
| Path compression only | O(log n) amortised | O(log n) amortised | O(m log n) |
| Both tricks | O(α(n)) amortised | O(α(n)) amortised | O(m α(n)) |

**Amortised** means on average over a sequence: one find can walk a few levels, but it flattens what it walked. Space is O(n). For one question on a fixed graph, a BFS or DFS is just as fast; union-find wins when edges arrive between questions.

## How to recognise a union-find problem

- Things join **groups** through a symmetric, transitive relation: friends of friends, accounts that share an email.
- The question is **"are these two connected?"** or **"how many groups are there?"**, asked after merges.
- Edges or merges **arrive over time**, and you want the moment something becomes connected.
- You must find **the edge that creates a cycle**, or decide whether an undirected graph is a tree.
- Edges are **added in sorted order** of weight or time, as in Kruskal's algorithm and offline queries.

If it needs a shortest path, a direction or the route itself, use a search: union-find only knows "same set" or not, and cannot split a set once merged.

## Common mistakes

- **Linking elements instead of roots.** `parent[a] = b` moves a alone and leaves the rest of its tree behind. Always link `find(a)` to `find(b)`.
- **Comparing parents instead of roots.** `parent[a] == parent[b]` misses elements at different depths. Compare `find(a) == find(b)`.
- **Counting every union call.** Only a union that merges lowers the component count.
- **Off-by-one labels.** When nodes are labelled 1 to n, allocate n + 1 slots, as the second program does.
- **Deep recursion in find.** Without union by size, a recursive find on a chain of 10⁵ elements crashes Python. Keep union by size, or use path halving.

## Practice in this order

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
