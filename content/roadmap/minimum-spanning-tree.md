---
title: Minimum Spanning Tree: Kruskal's and Prim's Algorithms
stage: graphs-advanced
order: 4
minutes: 25
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
Suppose you must lay cable between six offices so that every office can reach every other, and each possible link has its own cost. You want the cheapest network that does the job. One observation shapes the whole problem: you would never pay for a link that closes a loop, because removing it leaves everything still connected and saves its cost. So the cheapest network has no cycles — it is a **tree** that touches every vertex, a **spanning tree**, and you want the one of least total weight: the **minimum spanning tree (MST)**.

Two classic algorithms find it. **Kruskal's algorithm** (1956) takes the cheapest edges first and skips any that would close a cycle. **Prim's algorithm** (1957, found earlier by Vojtěch Jarník in 1930) grows a single tree outwards from one vertex. Both are greedy, and greedy choices are usually wrong for graph problems — this lesson proves why they are right here, then traces both algorithms, compares them and shows the problems that use them. It builds on [Union-Find](/roadmap/union-find) and the [Heap](/roadmap/heap). Every program is shown in C++, Java, Python and JavaScript.

## What a spanning tree is

Take a connected, undirected graph whose edges have weights. A **spanning tree** is a set of its edges that connects all V vertices and contains no cycle. Three facts about spanning trees come up again and again:

- **It has exactly V − 1 edges.** Start with V separate vertices. An edge that closes no cycle always joins two separate pieces, lowering the number of pieces by one, and you need to get from V pieces down to 1.
- **Adding any other edge creates exactly one cycle**, made of the new edge and the tree path between its ends.
- **Removing any tree edge splits the tree into two pieces.**

The example graph has six vertices and nine edges:

```text
 A–B 4    B–C 1    C–D 4    D–E 7    E–F 8
 A–C 3    B–D 2    C–E 5    D–F 6
```

Its minimum spanning tree uses five edges and weighs 17:

```text
   A ─3─ C ─1─ B ─2─ D ─6─ F
         │
         5
         │
         E
```

## Why trying every tree is too slow

A brute force would list every spanning tree and keep the cheapest, but there are far too many. A complete graph on n vertices has n raised to the power n − 2 spanning trees (Cayley's formula): 10⁸ for 10 vertices and about 2.6 × 10²³ for 20. Even sparse graphs usually have exponentially many. Something must let you commit to edges one at a time without ever reconsidering, and that something is the cut property.

## The cut property: why greedy works here

A **cut** splits the vertices into two non-empty groups. An edge **crosses** the cut when its two ends lie in different groups. Every spanning tree contains at least one crossing edge for every cut; otherwise the two groups would not be connected to each other.

**The cut property.** For any cut, a lightest edge crossing it belongs to some minimum spanning tree. If it is strictly lighter than every other crossing edge, it belongs to every minimum spanning tree.

The proof is an **exchange argument**. Let e be a lightest edge crossing the cut, and suppose T is a minimum spanning tree that does not contain e.

- Add e to T. That creates exactly one cycle.
- The cycle crosses from one side of the cut to the other through e, and to close the loop it must cross back somewhere else. So the cycle contains a second crossing edge f, and f weighs at least as much as e, because e is a lightest crossing edge.
- Remove f. Removing an edge of the cycle keeps everything connected, and the count is back to V − 1 edges, so T + e − f is a spanning tree. Its weight is weight(T) + w(e) − w(f), which is no more than weight(T).

So T + e − f is a minimum spanning tree that contains e. If e is strictly lighter than f, T + e − f would be strictly lighter than T, which is impossible for a minimum — so then every MST contains e. The argument also works when some edges have already been chosen, as long as none of them crosses the cut: f crosses it, so f is not one of them, and swapping it out keeps every chosen edge.

The mirror image is the **cycle property**: on any cycle, an edge strictly heavier than all the others on it is in no minimum spanning tree. That is why an algorithm may throw away an edge that would close a cycle when every other edge on that cycle is lighter or equal.

Kruskal's and Prim's algorithms are both the cut property applied V − 1 times. They differ only in which cut they look at.

## Kruskal's algorithm

Kruskal's algorithm treats the edges like a shopping list sorted by price:

- **Sort** the edges by weight, cheapest first.
- **Scan** them in order. For an edge u–v, if u and v are in different components, keep the edge and merge the two components. If they are already in one component, skip it: it would close a cycle.
- **Stop** once V − 1 edges have been kept.

"Are u and v in the same component?" is exactly what [union-find](/roadmap/union-find) answers, in near-constant time: `find(u) == find(v)` tests it and `union(u, v)` merges.

Why each kept edge is safe: when Kruskal keeps e = u–v, look at the cut between u's current component and all the other vertices. Every lighter edge has already been scanned, and whether it was kept or skipped, its two ends now lie in one component — so no lighter edge crosses this cut. The edge e does cross it, because v is in another component. So e is a lightest crossing edge, none of the edges kept so far crosses the cut, and the cut property says the kept edges plus e still fit inside a minimum spanning tree.

@walkthrough

### Dry run

The edges sorted by weight, with ties in input order, scanned until five are kept:

| Edge | Weight | Already in one component? | Decision | Total |
| --- | --- | --- | --- | --- |
| B–C | 1 | no | take | 1 |
| B–D | 2 | no | take | 3 |
| A–C | 3 | no | take | 6 |
| A–B | 4 | yes, through A–C–B | skip | 6 |
| C–D | 4 | yes, through C–B–D | skip | 6 |
| C–E | 5 | no | take | 11 |
| D–F | 6 | no | take: five edges, stop | 17 |

The last two edges, D–E (7) and E–F (8), are never even looked at: a spanning tree of six vertices is complete at five edges. The two skipped edges weigh 4, and each was the heaviest edge on the cycle it would have closed, as the cycle property says.

### The code

The program sorts the edges, prints each decision, and returns the total — or −1 if fewer than V − 1 edges were kept, which means the graph is not connected. The sort is stable, so equal weights keep their input order and all four languages print the same lines.

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

Prim's algorithm grows one tree instead of a forest:

- **Start** from any vertex; on its own it is the tree.
- **Collect** the edges that leave the tree in a min-heap, keyed by weight.
- **Pop** the cheapest. If its far end is already in the tree, the entry is stale — skip it. Otherwise add that vertex and the edge, and push the new vertex's edges to vertices still outside.
- **Stop** when all V vertices are in the tree.

Why each added edge is safe: the cut is now the tree against everything else. The heap holds every edge crossing that cut (plus stale entries, which are skipped), so the first valid edge popped is a lightest crossing edge, and the cut property applies directly.

If this looks like [Dijkstra's Algorithm](/roadmap/dijkstras-algorithm), it is the same loop with one difference in the key. Dijkstra orders vertices by their total distance from the start, dist[u] + w; Prim orders them by the weight w of the single edge that would connect them. That small change is why Prim's algorithm does not care about negative weights and Dijkstra's does.

### Dry run

Prim's algorithm from A, with heap entries written as (weight, vertex, reached from):

| Step | Pop | Action | Pushed | Total |
| --- | --- | --- | --- | --- |
| start | none | A is the tree | (3, C, A), (4, B, A) | 0 |
| 1 | (3, C, A) | add C by A–C | (1, B, C), (4, D, C), (5, E, C) | 3 |
| 2 | (1, B, C) | add B by C–B | (2, D, B) | 4 |
| 3 | (2, D, B) | add D by B–D | (6, F, D), (7, E, D) | 6 |
| 4 | (4, B, A) | stale: B is in the tree | none | 6 |
| 5 | (4, D, C) | stale: D is in the tree | none | 6 |
| 6 | (5, E, C) | add E by C–E | (8, F, E) | 11 |
| 7 | (6, F, D) | add F by D–F: all six in, stop | none | 17 |

Prim's algorithm adds the edges in a different order from Kruskal's — A–C first, because it must start at A — but it ends with the same five edges and the same total.

### The code

The program builds an adjacency list with every edge in both directions, runs Prim's algorithm from A, and prints the edges in the order they joined. JavaScript again carries its own small binary heap.

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

## Kruskal or Prim?

Both are correct on every connected graph, so the choice is about the input's shape and size:

- **An edge list, or a sparse graph:** Kruskal. It works straight from the list, and its cost is the sort, O(E log E). Since E is less than V², log E is less than 2 log V, so that is O(E log V).
- **An adjacency list:** Prim with a heap, O(E log V), is just as good, and it needs no global sort.
- **A dense graph, especially a complete one whose edges are implied rather than listed:** Prim with a plain array instead of a heap. It keeps, for every vertex outside the tree, the cheapest known edge into the tree, and scans that array for the minimum: O(V²) time and O(V) memory, with no edge list at all. When E is close to V², that beats both heap-based versions.
- **When edges must be processed in sorted order anyway**, or the graph may be disconnected, Kruskal is the natural fit: it handles a forest without any change.

## When the minimum spanning tree is unique

**If every edge weight is different, the MST is unique.** Suppose two different minimum spanning trees T₁ and T₂ existed. Among the edges that belong to exactly one of them, let e be the lightest, and say it is in T₁. Adding e to T₂ creates a cycle, and that cycle must contain an edge f that is not in T₁ — otherwise T₁ would contain the whole cycle. So f belongs to exactly one tree, and since e is the lightest such edge and weights are distinct, f is heavier than e. Then T₂ + e − f is a spanning tree lighter than T₂, which contradicts T₂ being minimum.

When weights repeat, there can be several minimum spanning trees, but they always have the same total weight. A square whose four sides all weigh 1 has four, one for each side you leave out. Repeated weights do not *force* several trees, though: the example graph has two edges of weight 4, both on cycles with lighter edges, and its MST is still unique. Distinct weights are enough for uniqueness, not necessary.

## Connecting points: a dense graph

[Min Cost to Connect All Points](/problems/min-cost-to-connect-all-points) gives points on a plane, where joining two points costs their Manhattan distance, |x₁ − x₂| + |y₁ − y₂|. Every pair can be joined, so the graph is complete: n points mean n(n − 1)/2 possible edges, about 500,000 for 1,000 points.

Kruskal's algorithm works — generate every pair, sort, scan — but it stores and sorts all those edges. Prim's array version never builds them:

```text
best[v] = cheapest known edge from the tree to v   (0 for the start, ∞ for the rest)
repeat n times:
    u = the vertex outside the tree with the smallest best[u]
    add u to the tree; total += best[u]
    for every vertex v outside the tree:
        best[v] = min(best[v], distance(u, v))
```

That is n scans of n entries — 10⁶ steps for 1,000 points, with O(n) memory. For the example points (0,0), (2,2), (3,10), (5,2) and (7,0), the answer is 20.

## Other shapes of the same idea

- **Is it already a spanning tree?** [Graph Valid Tree](/problems/graph-valid-tree) checks the definition directly: n − 1 edges and no cycle. [Number of Operations to Make Network Connected](/problems/number-of-operations-to-make-network-connected) counts how far a graph is from one: with c components you need c − 1 extra cables, and every edge that closes a cycle is a spare.
- **Kruskal in time order.** In [The Earliest Moment When Everyone Become Friends](/problems/the-earliest-moment-when-everyone-become-friends) the timestamps play the part of weights: process the logs in time order with union-find, and the answer is the time of the union that leaves one component.
- **Minimax paths.** The path between two vertices inside a minimum spanning tree has the smallest possible *largest* edge of any path between them. So "the least effort, where effort is the worst single step" is Kruskal's algorithm stopped as soon as the start and the end are connected — the edge that connected them is the answer. [Path With Minimum Effort](/problems/path-with-minimum-effort) can be solved this way, and Dijkstra-style too.
- **Offline thresholds.** In [Checking Existence of Edge Length Limited Paths](/problems/checking-existence-of-edge-length-limited-paths), sort the queries by limit and grow Kruskal's forest edge by edge: every query is answered by the forest built from the edges below its limit.
- **Two forests at once.** [Remove Max Number of Edges to Keep Graph Fully Traversable](/problems/remove-max-number-of-edges-to-keep-graph-fully-traversable) runs Kruskal's greedy for two people with two union-finds, adding the edges both can use first, because one shared edge does the work of two.
- **Which edges matter.** In [Find Critical and Pseudo-Critical Edges in Minimum Spanning Tree](/problems/find-critical-and-pseudo-critical-edges-in-minimum-spanning-tree), an edge is critical if leaving it out makes the MST heavier, and pseudo-critical if forcing it in keeps the minimum weight. Rerunning Kruskal's algorithm per edge decides both.
- **Clustering.** Stop Kruskal's algorithm when k components remain, and you have split the points into k clusters that are as far apart from each other as possible.

## Time and space complexity

| Approach | Time | Extra space | Best for |
| --- | --- | --- | --- |
| Try every spanning tree | exponential | O(V) | nothing |
| Kruskal: sort plus union-find | O(E log E) = O(E log V) | O(V), plus the sorted edges | edge lists, sparse graphs |
| Prim with a binary heap | O(E log V) | O(V + E) | adjacency lists |
| Prim with an array | O(V²) | O(V) | dense and complete graphs |

In Kruskal's algorithm the sort dominates: the union-find work for E edges is O(E α(V)), nearly linear. In Prim's heap version every edge can push one entry and every push or pop costs O(log V). The array version replaces the heap with V scans of V entries each.

## How to recognise a minimum spanning tree problem

Read the statement for these signals:

- **Connect everything at the lowest total cost**: cables, roads, pipes, points on a plane, cities.
- The links are **undirected** and each has a cost, and the cost you pay is the **sum of the links you choose**, not the length of a route.
- The answer must have **exactly one path between every pair**, or "no redundant connections" — that is a tree.
- The question asks to minimise the **largest edge** on a route or in a network: a bottleneck, which is an MST property.
- Edges are added **in increasing order** of weight or time until something becomes connected.

If the question is the cheapest route from one place to another, it is a shortest path problem instead; see Dijkstra's algorithm.

## Common mistakes

- **Using an MST for a shortest path.** The tree minimises the total, not each route. In the example, the tree's route from D to E is D–B–C–E, weight 8, while the direct edge D–E weighs 7.
- **Applying it to a directed graph.** Kruskal's and Prim's algorithms assume undirected edges. The directed version, a minimum spanning arborescence, needs a different algorithm (Chu–Liu/Edmonds).
- **Not checking connectivity.** If fewer than V − 1 edges are kept, there is no spanning tree. Return −1 or whatever the problem asks for, rather than the weight of a forest.
- **Marking a vertex as in the tree when it is pushed.** In Prim's algorithm a vertex joins only when its entry is popped; marking it at push time locks in whichever edge reached it first, not the cheapest.
- **A comparator that subtracts.** In Java, `(a, b) -> a[2] - b[2]` overflows when weights are large or negative. Use `Integer.compare`.
- **Building every edge of a huge complete graph.** For thousands of points, the n(n − 1)/2 edges may not fit in memory. Prim's array version needs none of them.

## Practice in this order

Start with the structure of a spanning tree, then the algorithms themselves, then the problems that use their properties:

1. [Graph Valid Tree](/problems/graph-valid-tree): what makes a set of edges a spanning tree.
2. [Number of Operations to Make Network Connected](/problems/number-of-operations-to-make-network-connected): V − 1 edges and spare cables.
3. [Min Cost to Connect All Points](/problems/min-cost-to-connect-all-points): the MST itself, on a complete graph.
4. [The Earliest Moment When Everyone Become Friends](/problems/the-earliest-moment-when-everyone-become-friends): Kruskal's algorithm in time order.
5. [Path With Minimum Effort](/problems/path-with-minimum-effort): a minimax path from Kruskal's process.
6. [Checking Existence of Edge Length Limited Paths](/problems/checking-existence-of-edge-length-limited-paths): Kruskal's forest at each threshold.
7. [Remove Max Number of Edges to Keep Graph Fully Traversable](/problems/remove-max-number-of-edges-to-keep-graph-fully-traversable): two spanning forests, shared edges first.
8. [Find Critical and Pseudo-Critical Edges in Minimum Spanning Tree](/problems/find-critical-and-pseudo-critical-edges-in-minimum-spanning-tree): which edges every MST needs.

The [minimum spanning tree problem list](/challenges/minimum-spanning-tree) has every problem in the catalogue on the topic, and the [union-find list](/challenges/union-find) has many more that use the same machinery. This completes the advanced graph stage; next on the road is [Dynamic Programming](/roadmap/dynamic-programming).
