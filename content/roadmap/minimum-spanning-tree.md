---
title: Minimum Spanning Tree: Kruskal's and Prim's Algorithms
stage: graphs-advanced
order: 4
minutes: 13
level: Advanced
hub: minimum-spanning-tree
practice: graph-valid-tree, number-of-operations-to-make-network-connected, min-cost-to-connect-all-points, the-earliest-moment-when-everyone-become-friends, path-with-minimum-effort, checking-existence-of-edge-length-limited-paths, remove-max-number-of-edges-to-keep-graph-fully-traversable, find-critical-and-pseudo-critical-edges-in-minimum-spanning-tree
updated: 2026-10-03
seo-title: Minimum Spanning Tree: Kruskal and Prim Explained
description: Learn minimum spanning trees: the cut property, Kruskal's with union-find, Prim's with a heap and when to use each, in C++, Java, Python and JavaScript.
question: What is a minimum spanning tree?
answer: A minimum spanning tree (MST) of a connected, weighted, undirected graph is a set of V − 1 edges that connects every vertex without forming a cycle and has the smallest possible total weight. Kruskal's algorithm adds the cheapest edges that do not close a cycle, using union-find; Prim's algorithm grows one tree from a start vertex with a priority queue. Both run in O(E log V).
q: What is the difference between Kruskal's and Prim's algorithm?
a: Kruskal's algorithm sorts all the edges and keeps each one that joins two different components, so it grows a forest that merges into one tree. Prim's algorithm grows a single tree from a start vertex, always adding the cheapest edge that leaves it. Both are O(E log V); Kruskal's is simplest with an edge list, while Prim's suits adjacency lists and, in its O(V²) array form, dense graphs.
q: Is the minimum spanning tree unique?
a: If all edge weights are different, yes: there is exactly one MST. When weights repeat there can be several, but they all have the same total weight. A square whose four sides all weigh 1 has four minimum spanning trees, one for each side you leave out.
q: What is the difference between a minimum spanning tree and a shortest path?
a: A minimum spanning tree minimises the total weight of all the edges needed to connect every vertex. A shortest path minimises the weight of one route between two vertices. The two usually disagree: the route between two vertices inside an MST can be longer than the direct edge between them, because the MST only cares about the total.
q: Can a minimum spanning tree have negative edge weights?
a: Yes. Kruskal's and Prim's algorithms only compare weights, they never add them along a route, so negative weights cause no trouble — unlike Dijkstra's algorithm. Adding the same constant to every weight does not change which tree is minimum either, because every spanning tree has exactly V − 1 edges.
q: What happens if the graph is not connected?
a: Then no spanning tree exists. Kruskal's algorithm still produces a minimum spanning forest, one tree per component, and you can detect the situation because it keeps fewer than V − 1 edges. Prim's algorithm from one vertex only ever reaches that vertex's component, so it adds fewer than V − 1 edges too.
---
Suppose you must lay cable between six offices so that every office can reach every other, and each possible link has its own cost. You would never pay for a link that closes a loop: removing it leaves everything connected and saves its cost. So the cheapest network is a **tree** that touches every vertex — a **spanning tree** — and you want the one of least total weight, the **minimum spanning tree (MST)**. **Kruskal's algorithm** takes the cheapest edges first and skips any that would close a cycle; **Prim's algorithm** grows one tree outwards from a vertex. Both build on [Union-Find](/roadmap/union-find) and the [Heap](/roadmap/heap).

@figure spanning-trees

## Why trying every tree is too slow

A complete graph on n vertices has n raised to the power n − 2 spanning trees (Cayley's formula): 10⁸ for 10 vertices and about 2.6 × 10²³ for 20. Even sparse graphs usually have exponentially many. Something must let you commit to edges one at a time without ever reconsidering, and greedy choices are usually wrong for graph problems. Here they are right, and the cut property is why.

## The cut property: why greedy works here

A **cut** splits the vertices into two non-empty groups, and an edge **crosses** it when its ends lie on different sides. **The cut property**: for any cut, a lightest crossing edge belongs to some minimum spanning tree — and to every one, if it is strictly lighter than the other crossing edges. The proof is an **exchange argument**: any spanning tree without that edge can swap it in for a heavier crossing edge and get no heavier.

@figure cut-property

The swap never removes an edge chosen earlier, as long as none of those crosses the cut, so the argument holds step after step. The mirror image is the **cycle property**: an edge strictly heavier than every other edge on some cycle is in no MST. Kruskal's and Prim's algorithms both apply the cut property V − 1 times; they differ only in which cut they look at.

## Kruskal's algorithm

- **Sort** the edges by weight, cheapest first.
- **Scan** them in order. If an edge's ends are in different components, keep it and merge the components; if they are already in one, skip it — it would close a cycle.
- **Stop** once V − 1 edges are kept.

"Are u and v in the same component?" is what union-find answers in near-constant time. Each kept edge is safe: cut u's component from everything else. Every lighter edge was already scanned and lies inside one component, so u–v is a lightest crossing edge.

@walkthrough

The program prints each decision, and returns −1 if fewer than V − 1 edges were kept: the graph is not connected.

```cpp
#include <algorithm>
#include <iostream>
#include <string>
#include <utility>
#include <vector>
using namespace std;

const string NAMES = "ABCDEF";
vector<int> parent, sz;

int findRoot(int x) {
    while (parent[x] != x) {
        parent[x] = parent[parent[x]];   // path halving
        x = parent[x];
    }
    return x;
}

// Kruskal: cheapest edges first, skipping any edge whose ends are already connected.
// Returns the total weight, or -1 when the graph is not connected.
int kruskal(int n, vector<vector<int>> edges) {
    // stable, so edges of equal weight keep their input order
    stable_sort(edges.begin(), edges.end(), [](const vector<int>& a, const vector<int>& b) { return a[2] < b[2]; });
    parent.resize(n);
    sz.assign(n, 1);
    for (int i = 0; i < n; i++) parent[i] = i;
    int total = 0, used = 0;
    for (const auto& e : edges) {
        if (used == n - 1) break;            // a spanning tree has exactly n - 1 edges
        int u = e[0], v = e[1], w = e[2];
        string name = string(1, NAMES[u]) + "-" + NAMES[v] + " (" + to_string(w) + ")";
        int ru = findRoot(u), rv = findRoot(v);
        if (ru == rv) {                      // one component already: this edge would close a cycle
            cout << "Skip " << name << ": " << NAMES[u] << " and " << NAMES[v] << " are already connected\n";
            continue;
        }
        if (sz[ru] < sz[rv]) swap(ru, rv);
        parent[rv] = ru;
        sz[ru] += sz[rv];
        total += w;
        used++;
        cout << "Take " << name << "\n";
    }
    return used == n - 1 ? total : -1;
}

int main() {
    vector<vector<int>> edges = {{0, 1, 4}, {0, 2, 3}, {1, 2, 1}, {1, 3, 2}, {2, 3, 4},
                                 {2, 4, 5}, {3, 4, 7}, {3, 5, 6}, {4, 5, 8}};
    int total = kruskal(6, edges);
    cout << "Total weight: " << total << "\n";
    return 0;
}
```

```java
import java.util.Arrays;

public class Main {
    static final String NAMES = "ABCDEF";
    static int[] parent, size;

    static int findRoot(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];   // path halving
            x = parent[x];
        }
        return x;
    }

    // Kruskal: cheapest edges first, skipping any edge whose ends are already connected.
    // Returns the total weight, or -1 when the graph is not connected.
    static int kruskal(int n, int[][] edges) {
        int[][] sorted = edges.clone();
        Arrays.sort(sorted, (a, b) -> Integer.compare(a[2], b[2]));  // stable: equal weights keep input order
        parent = new int[n];
        size = new int[n];
        for (int i = 0; i < n; i++) {
            parent[i] = i;
            size[i] = 1;
        }
        int total = 0, used = 0;
        for (int[] e : sorted) {
            if (used == n - 1) break;            // a spanning tree has exactly n - 1 edges
            int u = e[0], v = e[1], w = e[2];
            String name = NAMES.charAt(u) + "-" + NAMES.charAt(v) + " (" + w + ")";
            int ru = findRoot(u), rv = findRoot(v);
            if (ru == rv) {                      // one component already: this edge would close a cycle
                System.out.println("Skip " + name + ": " + NAMES.charAt(u) + " and " + NAMES.charAt(v) + " are already connected");
                continue;
            }
            if (size[ru] < size[rv]) { int t = ru; ru = rv; rv = t; }
            parent[rv] = ru;
            size[ru] += size[rv];
            total += w;
            used++;
            System.out.println("Take " + name);
        }
        return used == n - 1 ? total : -1;
    }

    public static void main(String[] args) {
        int[][] edges = {{0, 1, 4}, {0, 2, 3}, {1, 2, 1}, {1, 3, 2}, {2, 3, 4},
                         {2, 4, 5}, {3, 4, 7}, {3, 5, 6}, {4, 5, 8}};
        int total = kruskal(6, edges);
        System.out.println("Total weight: " + total);
    }
}
```

```python
NAMES = "ABCDEF"


def kruskal(n, edges):
    """Cheapest edges first, skipping any edge whose ends are already connected.
    Returns the total weight, or -1 when the graph is not connected."""
    parent = list(range(n))
    size = [1] * n

    def find_root(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]  # path halving
            x = parent[x]
        return x

    total = used = 0
    for u, v, w in sorted(edges, key=lambda e: e[2]):  # stable: equal weights keep input order
        if used == n - 1:  # a spanning tree has exactly n - 1 edges
            break
        name = f"{NAMES[u]}-{NAMES[v]} ({w})"
        ru, rv = find_root(u), find_root(v)
        if ru == rv:  # one component already: this edge would close a cycle
            print(f"Skip {name}: {NAMES[u]} and {NAMES[v]} are already connected")
            continue
        if size[ru] < size[rv]:
            ru, rv = rv, ru
        parent[rv] = ru
        size[ru] += size[rv]
        total += w
        used += 1
        print(f"Take {name}")
    return total if used == n - 1 else -1


edges = [(0, 1, 4), (0, 2, 3), (1, 2, 1), (1, 3, 2), (2, 3, 4),
         (2, 4, 5), (3, 4, 7), (3, 5, 6), (4, 5, 8)]
total = kruskal(6, edges)
print("Total weight:", total)
```

```javascript
const NAMES = "ABCDEF";

// Kruskal: cheapest edges first, skipping any edge whose ends are already connected.
// Returns the total weight, or -1 when the graph is not connected.
function kruskal(n, edges) {
  const parent = Array.from({ length: n }, (_, i) => i);
  const size = new Array(n).fill(1);
  const findRoot = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]]; // path halving
      x = parent[x];
    }
    return x;
  };
  const sorted = [...edges].sort((a, b) => a[2] - b[2]); // stable: equal weights keep input order
  let total = 0;
  let used = 0;
  for (const [u, v, w] of sorted) {
    if (used === n - 1) break; // a spanning tree has exactly n - 1 edges
    const name = `${NAMES[u]}-${NAMES[v]} (${w})`;
    let ru = findRoot(u);
    let rv = findRoot(v);
    if (ru === rv) { // one component already: this edge would close a cycle
      console.log(`Skip ${name}: ${NAMES[u]} and ${NAMES[v]} are already connected`);
      continue;
    }
    if (size[ru] < size[rv]) [ru, rv] = [rv, ru];
    parent[rv] = ru;
    size[ru] += size[rv];
    total += w;
    used++;
    console.log(`Take ${name}`);
  }
  return used === n - 1 ? total : -1;
}

const edges = [[0, 1, 4], [0, 2, 3], [1, 2, 1], [1, 3, 2], [2, 3, 4], [2, 4, 5], [3, 4, 7], [3, 5, 6], [4, 5, 8]];
const total = kruskal(6, edges);
console.log(`Total weight: ${total}`);
```

```output
Take B-C (1)
Take B-D (2)
Take A-C (3)
Skip A-B (4): A and B are already connected
Skip C-D (4): C and D are already connected
Take C-E (5)
Take D-F (6)
Total weight: 17
```

## Prim's algorithm

- **Start** from any vertex; on its own it is the tree.
- **Collect** the edges leaving the tree in a min-heap, keyed by weight.
- **Pop** the cheapest. If its far end is already in the tree, the entry is stale; skip it. Otherwise add the vertex and the edge, and push the new vertex's edges to vertices still outside.
- **Stop** when all V vertices are in.

Here the cut is the tree against everything else, and the first valid edge popped is a lightest edge crossing it.

@figure prim

The program stores every edge in both directions and prints the edges in the order they joined; JavaScript carries its own small heap.

```cpp
#include <functional>
#include <iostream>
#include <queue>
#include <string>
#include <tuple>
#include <utility>
#include <vector>
using namespace std;

const string NAMES = "ABCDEF";

// Prim: grow one tree from start, always adding the cheapest edge that leaves it.
// Returns the total weight, or -1 when some vertex cannot be reached.
int prim(int n, const vector<vector<int>>& edges, int start) {
    vector<vector<pair<int, int>>> adj(n);        // (neighbour, weight), both directions
    for (const auto& e : edges) {
        adj[e[0]].push_back({e[1], e[2]});
        adj[e[1]].push_back({e[0], e[2]});
    }
    vector<bool> inTree(n, false);
    // min-heap of (weight, vertex outside the tree, vertex inside it)
    priority_queue<tuple<int, int, int>, vector<tuple<int, int, int>>, greater<tuple<int, int, int>>> heap;
    inTree[start] = true;
    for (auto [v, w] : adj[start]) heap.push({w, v, start});
    int total = 0, added = 1;
    string joins;
    while (!heap.empty() && added < n) {
        auto [w, v, from] = heap.top();
        heap.pop();
        if (inTree[v]) continue;                    // stale: v already joined by a cheaper edge
        inTree[v] = true;                           // the cheapest edge leaving the tree is safe
        total += w;
        added++;
        joins += string(joins.empty() ? "" : ", ") + NAMES[from] + "-" + NAMES[v] + " (" + to_string(w) + ")";
        for (auto [x, wx] : adj[v])
            if (!inTree[x]) heap.push({wx, x, v});
    }
    cout << "Prim from " << NAMES[start] << " adds " << joins << "\n";
    return added == n ? total : -1;
}

int main() {
    vector<vector<int>> edges = {{0, 1, 4}, {0, 2, 3}, {1, 2, 1}, {1, 3, 2}, {2, 3, 4},
                                 {2, 4, 5}, {3, 4, 7}, {3, 5, 6}, {4, 5, 8}};
    int total = prim(6, edges, 0);
    cout << "Total weight: " << total << "\n";
    return 0;
}
```

```java
import java.util.ArrayList;
import java.util.List;
import java.util.PriorityQueue;

public class Main {
    static final String NAMES = "ABCDEF";

    // Prim: grow one tree from start, always adding the cheapest edge that leaves it.
    // Returns the total weight, or -1 when some vertex cannot be reached.
    static int prim(int n, int[][] edges, int start) {
        List<List<int[]>> adj = new ArrayList<>();           // {neighbour, weight}, both directions
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) {
            adj.get(e[0]).add(new int[] {e[1], e[2]});
            adj.get(e[1]).add(new int[] {e[0], e[2]});
        }
        boolean[] inTree = new boolean[n];
        // entries are {weight, vertex outside the tree, vertex inside it}, compared in that order
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) ->
            a[0] != b[0] ? Integer.compare(a[0], b[0]) : a[1] != b[1] ? Integer.compare(a[1], b[1]) : Integer.compare(a[2], b[2]));
        inTree[start] = true;
        for (int[] e : adj.get(start)) heap.add(new int[] {e[1], e[0], start});
        int total = 0, added = 1;
        List<String> joins = new ArrayList<>();
        while (!heap.isEmpty() && added < n) {
            int[] top = heap.poll();
            int w = top[0], v = top[1], from = top[2];
            if (inTree[v]) continue;                         // stale: v already joined by a cheaper edge
            inTree[v] = true;                                // the cheapest edge leaving the tree is safe
            total += w;
            added++;
            joins.add(NAMES.charAt(from) + "-" + NAMES.charAt(v) + " (" + w + ")");
            for (int[] e : adj.get(v))
                if (!inTree[e[0]]) heap.add(new int[] {e[1], e[0], v});
        }
        System.out.println("Prim from " + NAMES.charAt(start) + " adds " + String.join(", ", joins));
        return added == n ? total : -1;
    }

    public static void main(String[] args) {
        int[][] edges = {{0, 1, 4}, {0, 2, 3}, {1, 2, 1}, {1, 3, 2}, {2, 3, 4},
                         {2, 4, 5}, {3, 4, 7}, {3, 5, 6}, {4, 5, 8}};
        int total = prim(6, edges, 0);
        System.out.println("Total weight: " + total);
    }
}
```

```python
import heapq

NAMES = "ABCDEF"


def prim(n, edges, start):
    """Grow one tree from start, always adding the cheapest edge that leaves it.
    Returns the total weight, or -1 when some vertex cannot be reached."""
    adj = [[] for _ in range(n)]  # (neighbour, weight), both directions
    for u, v, w in edges:
        adj[u].append((v, w))
        adj[v].append((u, w))
    in_tree = [False] * n
    # entries are (weight, vertex outside the tree, vertex inside it)
    heap = [(w, v, start) for v, w in adj[start]]
    heapq.heapify(heap)
    in_tree[start] = True
    total, added, joins = 0, 1, []
    while heap and added < n:
        w, v, frm = heapq.heappop(heap)
        if in_tree[v]:  # stale: v already joined by a cheaper edge
            continue
        in_tree[v] = True  # the cheapest edge leaving the tree is safe
        total += w
        added += 1
        joins.append(f"{NAMES[frm]}-{NAMES[v]} ({w})")
        for x, wx in adj[v]:
            if not in_tree[x]:
                heapq.heappush(heap, (wx, x, v))
    print(f"Prim from {NAMES[start]} adds", ", ".join(joins))
    return total if added == n else -1


edges = [(0, 1, 4), (0, 2, 3), (1, 2, 1), (1, 3, 2), (2, 3, 4),
         (2, 4, 5), (3, 4, 7), (3, 5, 6), (4, 5, 8)]
total = prim(6, edges, 0)
print("Total weight:", total)
```

```javascript
// JavaScript has no priority queue: a small binary min-heap of arrays,
// compared element by element ([weight, vertex outside, vertex inside]).
class MinHeap {
  constructor() {
    this.items = [];
  }
  less(i, j) {
    const a = this.items[i], b = this.items[j];
    for (let k = 0; k < a.length; k++) if (a[k] !== b[k]) return a[k] < b[k];
    return false;
  }
  swap(i, j) {
    [this.items[i], this.items[j]] = [this.items[j], this.items[i]];
  }
  push(item) {
    this.items.push(item);
    let i = this.items.length - 1;
    while (i > 0 && this.less(i, (i - 1) >> 1)) { // sift up past larger parents
      this.swap(i, (i - 1) >> 1);
      i = (i - 1) >> 1;
    }
  }
  pop() {
    const top = this.items[0];
    const last = this.items.pop();
    if (this.items.length > 0) {
      this.items[0] = last;
      let i = 0;
      for (;;) { // sift down towards the smaller child
        let m = i;
        for (const c of [2 * i + 1, 2 * i + 2]) if (c < this.items.length && this.less(c, m)) m = c;
        if (m === i) break;
        this.swap(i, m);
        i = m;
      }
    }
    return top;
  }
}

const NAMES = "ABCDEF";

// Prim: grow one tree from start, always adding the cheapest edge that leaves it.
// Returns the total weight, or -1 when some vertex cannot be reached.
function prim(n, edges, start) {
  const adj = Array.from({ length: n }, () => []); // [neighbour, weight], both directions
  for (const [u, v, w] of edges) {
    adj[u].push([v, w]);
    adj[v].push([u, w]);
  }
  const inTree = new Array(n).fill(false);
  const heap = new MinHeap();
  inTree[start] = true;
  for (const [v, w] of adj[start]) heap.push([w, v, start]);
  let total = 0;
  let added = 1;
  const joins = [];
  while (heap.items.length > 0 && added < n) {
    const [w, v, from] = heap.pop();
    if (inTree[v]) continue; // stale: v already joined by a cheaper edge
    inTree[v] = true; // the cheapest edge leaving the tree is safe
    total += w;
    added++;
    joins.push(`${NAMES[from]}-${NAMES[v]} (${w})`);
    for (const [x, wx] of adj[v]) if (!inTree[x]) heap.push([wx, x, v]);
  }
  console.log(`Prim from ${NAMES[start]} adds ${joins.join(", ")}`);
  return added === n ? total : -1;
}

const edges = [[0, 1, 4], [0, 2, 3], [1, 2, 1], [1, 3, 2], [2, 3, 4], [2, 4, 5], [3, 4, 7], [3, 5, 6], [4, 5, 8]];
const total = prim(6, edges, 0);
console.log(`Total weight: ${total}`);
```

```output
Prim from A adds A-C (3), C-B (1), B-D (2), C-E (5), D-F (6)
Total weight: 17
```

Prim is [Dijkstra's Algorithm](/roadmap/dijkstras-algorithm) with a different key: Dijkstra orders vertices by their whole distance, dist[u] + w; Prim by the weight w of the one edge that would connect them. That is why Prim does not mind negative weights, and why the two build different trees:

@figure prim-vs-dijkstra

## Kruskal or Prim?

- **An edge list, or a sparse graph:** Kruskal. Its cost is the sort, O(E log E), which is O(E log V) because E is less than V².
- **An adjacency list:** Prim with a heap, O(E log V), with no global sort.
- **A dense or complete graph, whose edges are implied rather than listed:** Prim with a plain array, O(V²) time and O(V) memory, with no edge list at all.
- **Edges that must be processed in sorted order anyway, or a graph that may be disconnected:** Kruskal, which handles a forest without change.

## When the minimum spanning tree is unique

**If every edge weight is different, the MST is unique**: if two existed, the lightest edge in only one of them could be swapped into the other for a heavier edge, making it lighter — impossible. With repeated weights there can be several, always with the same total:

@figure square

Repeated weights do not *force* several trees, though: the six-office graph has two edges of weight 4, both on cycles with lighter edges, and its MST is unique.

## Connecting points: a dense graph

[Min Cost to Connect All Points](/problems/min-cost-to-connect-all-points) gives points on a plane, where joining two costs their Manhattan distance. Every pair can be joined, so 1,000 points mean about 500,000 possible edges. Kruskal works, but it stores and sorts them all; Prim's array version never builds them:

```text
best[v] = cheapest known edge from the tree to v   (0 for the start, ∞ for the rest)
repeat n times:
    u = the vertex outside the tree with the smallest best[u]
    add u to the tree; total += best[u]
    for every vertex v outside the tree:
        best[v] = min(best[v], distance(u, v))
```

@figure points

## Other shapes of the same idea

- **Kruskal in time order.** Timestamps play the weights; the answer is the union that leaves one component.
- **Minimax paths.** The path between two vertices inside an MST has the smallest possible *largest* edge, so Kruskal stopped once the start and end connect answers [Path With Minimum Effort](/problems/path-with-minimum-effort).
- **Offline thresholds.** Grow Kruskal's forest edge by edge and answer each query from the edges below its limit.
- **Which edges matter.** Rerun Kruskal with each edge left out or forced in.
- **Clustering.** Stop Kruskal when k components remain: k clusters as far apart as possible.

## Time and space complexity

| Approach | Time | Extra space | Best for |
| --- | --- | --- | --- |
| Try every spanning tree | exponential | O(V) | nothing |
| Kruskal: sort plus union-find | O(E log E) = O(E log V) | O(V), plus the sorted edges | edge lists, sparse graphs |
| Prim with a binary heap | O(E log V) | O(V + E) | adjacency lists |
| Prim with an array | O(V²) | O(V) | dense and complete graphs |

In Kruskal the sort dominates; the union-find work is O(E α(V)), nearly linear.

## How to recognise a minimum spanning tree problem

- **Connect everything at the lowest total cost**: cables, roads, pipes, points on a plane.
- The links are **undirected**, and you pay the **sum of the links you choose**, not the length of a route.
- The answer must have **exactly one path between every pair**, or no redundant connections.
- The question minimises the **largest edge** on a route or in a network: a bottleneck.

If the question is the cheapest route from one place to another, it is a shortest path problem instead.

## Common mistakes

- **Using an MST for a shortest path.** In the example, the tree's route from D to E weighs 8, while the direct edge weighs 7.
- **Applying it to a directed graph.** The directed version needs a different algorithm (Chu–Liu/Edmonds).
- **Not checking connectivity.** Fewer than V − 1 kept edges means there is no spanning tree.
- **Marking a vertex as in the tree when it is pushed.** In Prim a vertex joins only when its entry is popped.
- **A comparator that subtracts.** In Java, `(a, b) -> a[2] - b[2]` overflows; use `Integer.compare`.

## Practice in this order

1. [Graph Valid Tree](/problems/graph-valid-tree): what makes a set of edges a spanning tree.
2. [Number of Operations to Make Network Connected](/problems/number-of-operations-to-make-network-connected): V − 1 edges and spare cables.
3. [Min Cost to Connect All Points](/problems/min-cost-to-connect-all-points): the MST itself, on a complete graph.
4. [The Earliest Moment When Everyone Become Friends](/problems/the-earliest-moment-when-everyone-become-friends): Kruskal's algorithm in time order.
5. [Path With Minimum Effort](/problems/path-with-minimum-effort): a minimax path from Kruskal's process.
6. [Checking Existence of Edge Length Limited Paths](/problems/checking-existence-of-edge-length-limited-paths): Kruskal's forest at each threshold.
7. [Remove Max Number of Edges to Keep Graph Fully Traversable](/problems/remove-max-number-of-edges-to-keep-graph-fully-traversable): two spanning forests, shared edges first.
8. [Find Critical and Pseudo-Critical Edges in Minimum Spanning Tree](/problems/find-critical-and-pseudo-critical-edges-in-minimum-spanning-tree): which edges every MST needs.

The [minimum spanning tree problem list](/challenges/minimum-spanning-tree) has every problem in the catalogue on the topic, and the [union-find list](/challenges/union-find) has many more that use the same machinery. This completes the advanced graph stage; next on the road is [Dynamic Programming](/roadmap/dynamic-programming).
