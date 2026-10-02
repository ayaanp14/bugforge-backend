---
title: Dijkstra's Algorithm
stage: graphs-advanced
order: 3
minutes: 13
level: Advanced
hub: shortest-path
practice: network-delay-time, path-with-minimum-effort, the-maze-ii, cheapest-flights-within-k-stops, find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance, number-of-ways-to-arrive-at-destination, minimum-obstacle-removal-to-reach-corner, swim-in-rising-water, minimum-cost-to-make-at-least-one-valid-path-in-a-grid
updated: 2026-10-03
seo-title: Dijkstra's Algorithm: Shortest Paths Explained with Code
description: Learn Dijkstra's algorithm: the priority-queue version, why negative edges break it, path rebuilding and Bellman–Ford, in C++, Java, Python and JavaScript.
question: What is Dijkstra's algorithm?
answer: Dijkstra's algorithm finds the shortest path from one source vertex to every other vertex in a graph whose edge weights are all non-negative. It keeps a tentative distance for each vertex, repeatedly settles the unsettled vertex with the smallest distance, and relaxes that vertex's outgoing edges. With a binary-heap priority queue it runs in O((V + E) log V) time.
q: Why does Dijkstra's algorithm not work with negative weights?
a: It treats the closest unsettled vertex as final and never revisits it, relying on the fact that any other route must continue through a vertex at least as far away and can only add weight. A negative edge breaks that: a route through a farther vertex can come back cheaper. For negative weights use Bellman–Ford, which also detects negative cycles.
q: What is the difference between Dijkstra's algorithm and BFS?
a: BFS finds shortest paths when every edge costs the same, because it reaches vertices in order of the number of edges. Dijkstra's algorithm handles any non-negative weights by replacing BFS's first-in, first-out queue with a priority queue ordered by distance. On an unweighted graph both give the same answer, and BFS is faster at O(V + E).
q: What is the time complexity of Dijkstra's algorithm?
a: With a binary heap and lazy deletion it is O((V + E) log V): every edge can push one heap entry and every push or pop costs O(log V). The version that scans an array for the closest vertex instead of using a heap is O(V²), which is better for dense graphs where E is close to V².
q: Does Dijkstra's algorithm work on undirected graphs?
a: Yes. Store each undirected edge as two directed edges, one in each direction, and run the algorithm unchanged. The only requirement is that every weight is non-negative; a single negative undirected edge is already a negative cycle, because you can walk it back and forth.
q: What is 0-1 BFS?
a: 0-1 BFS is Dijkstra's algorithm for graphs whose weights are only 0 or 1. A double-ended queue replaces the heap: a vertex reached by a 0-edge goes to the front, one reached by a 1-edge goes to the back. The deque stays sorted by distance, so the whole search runs in O(V + E).
---
A map app finding the fastest route, a router choosing where to forward a packet, a game character walking round obstacles: each is a **shortest path** question on a **weighted graph**, where every edge has a cost and a path's length is the sum of its weights. **Dijkstra's algorithm** (1959) finds the shortest path from one source to every other vertex, as long as no weight is negative. After BFS and DFS it is the graph algorithm interviews ask about most.

@figure weights

## Why BFS is not enough

[Breadth-First Search](/roadmap/breadth-first-search) finds shortest paths only when every edge costs the same: it counts edges, not weight. Trying every route is hopeless: about 1.7 × 10¹⁶ simple paths join two vertices of a complete graph on 20. Bellman–Ford, later in this lesson, costs O(V × E): 2 × 10¹⁰ steps for V = 10⁵ and E = 2 × 10⁵. Dijkstra's algorithm needs about (V + E) log V, around 5 × 10⁶ steps, because it looks at each vertex's edges once.

## The idea: settle the closest vertex first

Every vertex carries a **tentative distance**, the best route to it found so far: 0 for the source, ∞ for the rest. Then:

- **Pick** the unsettled vertex with the smallest tentative distance. Its distance is now final; the vertex is **settled**.
- **Relax** each of its edges u → v with weight w: if dist[u] + w < dist[v], going through u is shorter, so set dist[v] = dist[u] + w and remember prev[v] = u.
- **Repeat** until every reachable vertex is settled.

Picking the smallest distance quickly is a job for a min-heap — see the [Heap](/roadmap/heap) lesson.

@walkthrough

## Why it works

The algorithm is greedy: it commits to a vertex's distance the moment that vertex is the closest unsettled one, and never revisits it. That is safe because any route it has not seen must leave the settled region somewhere, already at least as far as the vertex being settled, and the rest of the route can only add weight:

@figure why-final

Induction carries the argument from each settled vertex to the next, starting from the source at 0, so when the heap empties every reachable vertex holds its true distance.

### Why a negative edge breaks it

The proof used non-negative weights exactly once. Take them away and a vertex can be settled before a cheaper route through a farther vertex is found:

@figure negative

The lazy-heap code below would push B again and repair this small case, but the guarantee is gone: on bad graphs a vertex is reopened exponentially often, and a **negative cycle** — a loop of negative total weight — makes distances fall for ever. Use Bellman–Ford instead.

### The code

The standard heaps have no "decrease key", so the code uses **lazy deletion**: when dist[v] improves it pushes a new entry and leaves the old one in place; a popped entry larger than dist[v] is **stale** and skipped. JavaScript has no heap in its standard library, so its program carries a small one.

```cpp
#include <algorithm>
#include <climits>
#include <functional>
#include <iostream>
#include <queue>
#include <string>
#include <utility>
#include <vector>
using namespace std;

const string NAMES = "ABCDEF";
const int INF = INT_MAX;

// Dijkstra from source (all weights non-negative). Fills dist and prev
// (the vertex before each one on its shortest path) and returns the
// vertices in the order they were settled.
vector<int> dijkstra(const vector<vector<pair<int, int>>>& adj, int source, vector<int>& dist, vector<int>& prev) {
    int n = adj.size();
    dist.assign(n, INF);
    prev.assign(n, -1);
    vector<int> order;
    // std::priority_queue is a max-heap; greater<> turns it into a min-heap
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> heap;
    dist[source] = 0;
    heap.push({0, source});
    while (!heap.empty()) {
        auto [d, u] = heap.top();
        heap.pop();
        if (d > dist[u]) continue;          // stale: u was settled with a smaller distance
        order.push_back(u);                 // d is final: no later path can be shorter
        for (auto [v, w] : adj[u]) {
            if (d + w < dist[v]) {          // relax the edge u -> v
                dist[v] = d + w;
                prev[v] = u;
                heap.push({dist[v], v});
            }
        }
    }
    return order;
}

int main() {
    int edges[][3] = {{0, 1, 4}, {0, 2, 2}, {2, 1, 1}, {1, 3, 5}, {2, 3, 8},
                      {2, 4, 10}, {3, 4, 2}, {3, 5, 3}, {4, 5, 2}};
    vector<vector<pair<int, int>>> adj(6);
    for (auto& e : edges) adj[e[0]].push_back({e[1], e[2]});
    vector<int> dist, prev;
    vector<int> order = dijkstra(adj, 0, dist, prev);

    cout << "Settled in order:";
    for (int v : order) cout << " " << NAMES[v];
    cout << "\nDistances from A:";
    for (int v = 0; v < 6; v++) cout << " " << NAMES[v] << "=" << dist[v];
    vector<int> path;
    for (int v = 5; v != -1; v = prev[v]) path.push_back(v);  // walk back from F
    reverse(path.begin(), path.end());
    cout << "\nPath to F:";
    for (size_t i = 0; i < path.size(); i++) cout << (i > 0 ? " -> " : " ") << NAMES[path[i]];
    cout << " (cost " << dist[5] << ")\n";
    return 0;
}
```

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.PriorityQueue;

public class Main {
    static final String NAMES = "ABCDEF";
    static final int INF = Integer.MAX_VALUE;
    static int[] dist, prev;

    // Dijkstra from source (all weights non-negative). Fills dist and prev
    // (the vertex before each one on its shortest path) and returns the
    // vertices in the order they were settled.
    static List<Integer> dijkstra(List<List<int[]>> adj, int source) {
        int n = adj.size();
        dist = new int[n];
        prev = new int[n];
        Arrays.fill(dist, INF);
        Arrays.fill(prev, -1);
        List<Integer> order = new ArrayList<>();
        // entries are {distance, vertex}: smallest distance first, then smallest vertex
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1]));
        dist[source] = 0;
        heap.add(new int[] {0, source});
        while (!heap.isEmpty()) {
            int[] top = heap.poll();
            int d = top[0], u = top[1];
            if (d > dist[u]) continue;          // stale: u was settled with a smaller distance
            order.add(u);                       // d is final: no later path can be shorter
            for (int[] e : adj.get(u)) {
                int v = e[0], w = e[1];
                if (d + w < dist[v]) {          // relax the edge u -> v
                    dist[v] = d + w;
                    prev[v] = u;
                    heap.add(new int[] {dist[v], v});
                }
            }
        }
        return order;
    }

    public static void main(String[] args) {
        int[][] edges = {{0, 1, 4}, {0, 2, 2}, {2, 1, 1}, {1, 3, 5}, {2, 3, 8},
                         {2, 4, 10}, {3, 4, 2}, {3, 5, 3}, {4, 5, 2}};
        List<List<int[]>> adj = new ArrayList<>();
        for (int i = 0; i < 6; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) adj.get(e[0]).add(new int[] {e[1], e[2]});
        List<Integer> order = dijkstra(adj, 0);

        StringBuilder out = new StringBuilder("Settled in order:");
        for (int v : order) out.append(" ").append(NAMES.charAt(v));
        out.append("\nDistances from A:");
        for (int v = 0; v < 6; v++) out.append(" ").append(NAMES.charAt(v)).append("=").append(dist[v]);
        List<Integer> path = new ArrayList<>();
        for (int v = 5; v != -1; v = prev[v]) path.add(v);      // walk back from F
        Collections.reverse(path);
        out.append("\nPath to F:");
        for (int i = 0; i < path.size(); i++) out.append(i > 0 ? " -> " : " ").append(NAMES.charAt(path.get(i)));
        out.append(" (cost ").append(dist[5]).append(")");
        System.out.println(out);
    }
}
```

```python
import heapq

NAMES = "ABCDEF"
INF = float("inf")


def dijkstra(adj, source):
    """Dijkstra from source (all weights non-negative). Returns dist, prev
    (the vertex before each one on its shortest path) and the settle order."""
    n = len(adj)
    dist = [INF] * n
    prev = [-1] * n
    order = []
    heap = [(0, source)]  # (distance, vertex); heapq is a min-heap
    dist[source] = 0
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:  # stale: u was settled with a smaller distance
            continue
        order.append(u)  # d is final: no later path can be shorter
        for v, w in adj[u]:
            if d + w < dist[v]:  # relax the edge u -> v
                dist[v] = d + w
                prev[v] = u
                heapq.heappush(heap, (dist[v], v))
    return dist, prev, order


edges = [(0, 1, 4), (0, 2, 2), (2, 1, 1), (1, 3, 5), (2, 3, 8),
         (2, 4, 10), (3, 4, 2), (3, 5, 3), (4, 5, 2)]
adj = [[] for _ in range(6)]
for u, v, w in edges:
    adj[u].append((v, w))
dist, prev, order = dijkstra(adj, 0)

print("Settled in order:", *(NAMES[v] for v in order))
print("Distances from A:", *(f"{NAMES[v]}={dist[v]}" for v in range(6)))
path = []
v = 5
while v != -1:  # walk back from F
    path.append(v)
    v = prev[v]
path.reverse()
print("Path to F:", " -> ".join(NAMES[v] for v in path), f"(cost {dist[5]})")
```

```javascript
// JavaScript has no priority queue, so here is a small binary min-heap
// of [distance, vertex] pairs, ordered by distance, then by vertex.
class MinHeap {
  constructor() {
    this.items = [];
  }
  less(i, j) {
    const a = this.items[i], b = this.items[j];
    return a[0] !== b[0] ? a[0] < b[0] : a[1] < b[1];
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

// Dijkstra from source (all weights non-negative): dist, prev (the vertex
// before each one on its shortest path) and the settle order.
function dijkstra(adj, source) {
  const n = adj.length;
  const dist = new Array(n).fill(Infinity);
  const prev = new Array(n).fill(-1);
  const order = [];
  const heap = new MinHeap();
  dist[source] = 0;
  heap.push([0, source]);
  while (heap.items.length > 0) {
    const [d, u] = heap.pop();
    if (d > dist[u]) continue; // stale: u was settled with a smaller distance
    order.push(u); // d is final: no later path can be shorter
    for (const [v, w] of adj[u]) {
      if (d + w < dist[v]) { // relax the edge u -> v
        dist[v] = d + w;
        prev[v] = u;
        heap.push([dist[v], v]);
      }
    }
  }
  return { dist, prev, order };
}

const edges = [[0, 1, 4], [0, 2, 2], [2, 1, 1], [1, 3, 5], [2, 3, 8], [2, 4, 10], [3, 4, 2], [3, 5, 3], [4, 5, 2]];
const adj = Array.from({ length: 6 }, () => []);
for (const [u, v, w] of edges) adj[u].push([v, w]);
const { dist, prev, order } = dijkstra(adj, 0);

console.log(`Settled in order: ${order.map((v) => NAMES[v]).join(" ")}`);
console.log(`Distances from A: ${dist.map((d, v) => `${NAMES[v]}=${d}`).join(" ")}`);
const path = [];
for (let v = 5; v !== -1; v = prev[v]) path.push(v); // walk back from F
path.reverse();
console.log(`Path to F: ${path.map((v) => NAMES[v]).join(" -> ")} (cost ${dist[5]})`);
```

```output
Settled in order: A C B D E F
Distances from A: A=0 B=3 C=2 D=8 E=10 F=11
Path to F: A -> C -> B -> D -> F (cost 11)
```

The program's heap, entry by entry — stale entries are greyed out while they wait:

@figure heap-run

[Network Delay Time](/problems/network-delay-time) is this program almost unchanged: run it from the given node and answer with the largest distance, or −1 if any is still ∞.

## Rebuilding the path

`prev[v]` changes only when `dist[v]` improves, so at the end it names the vertex whose relaxation set v's final distance — and that vertex was itself final by then. Following `prev` from any vertex therefore walks back to the source along a shortest path, and together the pointers form a **shortest-path tree**.

@figure prev-tree

## Negative weights: Bellman–Ford

**Bellman–Ford** gives up the greedy choice: it relaxes *every* edge, in any order, and repeats that V − 1 times. That is enough because, without a negative cycle, a shortest path never repeats a vertex, so it has at most V − 1 edges — and after round k, every vertex whose shortest path has at most k edges holds its correct distance. It also gives the **negative-cycle test**: one more pass over the edges. If anything still improves, a negative cycle is reachable from the source and "shortest path" has no meaning.

@figure bellman-ford

The program prints the distances after each round, then repeats the run with the extra edge C → B weighing −8.

```cpp
#include <algorithm>
#include <climits>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

const string NAMES = "SABCD";
const int INF = INT_MAX;

// Bellman-Ford from source; weights may be negative. Fills dist and prev and
// returns true when a negative cycle is reachable from the source.
bool bellmanFord(int n, const vector<vector<int>>& edges, int source, bool trace, vector<int>& dist, vector<int>& prev) {
    dist.assign(n, INF);
    prev.assign(n, -1);
    dist[source] = 0;
    for (int round = 1; round < n; round++) {          // V - 1 rounds are always enough
        for (const auto& e : edges) {
            int u = e[0], v = e[1], w = e[2];
            if (dist[u] != INF && dist[u] + w < dist[v]) {  // never add to infinity
                dist[v] = dist[u] + w;
                prev[v] = u;
            }
        }
        if (trace) {
            cout << "Round " << round << ":";
            for (int x = 0; x < n; x++) cout << " " << NAMES[x] << "=" << (dist[x] == INF ? string("inf") : to_string(dist[x]));
            cout << "\n";
        }
    }
    for (const auto& e : edges)                        // one more pass: any improvement means a negative cycle
        if (dist[e[0]] != INF && dist[e[0]] + e[2] < dist[e[1]]) return true;
    return false;
}

int main() {
    vector<vector<int>> edges = {{3, 4, 2}, {1, 3, 3}, {2, 3, 4}, {2, 1, -3}, {0, 1, 4}, {0, 2, 5}};
    vector<int> dist, prev;
    bellmanFord(5, edges, 0, true, dist, prev);
    vector<int> path;
    for (int v = 4; v != -1; v = prev[v]) path.push_back(v);  // walk back from D
    reverse(path.begin(), path.end());
    cout << "Path to D:";
    for (size_t i = 0; i < path.size(); i++) cout << (i > 0 ? " -> " : " ") << NAMES[path[i]];
    cout << " (cost " << dist[4] << ")\n";

    edges.push_back({3, 2, -8});                       // C -> B closes B -> A -> C -> B, total -8
    bool cycle = bellmanFord(5, edges, 0, false, dist, prev);
    cout << "With C -> B weighing -8: " << (cycle ? "negative cycle reachable from S" : "no negative cycle") << "\n";
    return 0;
}
```

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class Main {
    static final String NAMES = "SABCD";
    static final int INF = Integer.MAX_VALUE;
    static int[] dist, prev;

    // Bellman-Ford from source; weights may be negative. Fills dist and prev and
    // returns true when a negative cycle is reachable from the source.
    static boolean bellmanFord(int n, List<int[]> edges, int source, boolean trace) {
        dist = new int[n];
        prev = new int[n];
        Arrays.fill(dist, INF);
        Arrays.fill(prev, -1);
        dist[source] = 0;
        for (int round = 1; round < n; round++) {          // V - 1 rounds are always enough
            for (int[] e : edges) {
                int u = e[0], v = e[1], w = e[2];
                if (dist[u] != INF && dist[u] + w < dist[v]) {  // never add to infinity
                    dist[v] = dist[u] + w;
                    prev[v] = u;
                }
            }
            if (trace) {
                StringBuilder line = new StringBuilder("Round " + round + ":");
                for (int x = 0; x < n; x++) line.append(" ").append(NAMES.charAt(x)).append("=").append(dist[x] == INF ? "inf" : String.valueOf(dist[x]));
                System.out.println(line);
            }
        }
        for (int[] e : edges)                              // one more pass: any improvement means a negative cycle
            if (dist[e[0]] != INF && dist[e[0]] + e[2] < dist[e[1]]) return true;
        return false;
    }

    public static void main(String[] args) {
        List<int[]> edges = new ArrayList<>(Arrays.asList(
            new int[] {3, 4, 2}, new int[] {1, 3, 3}, new int[] {2, 3, 4},
            new int[] {2, 1, -3}, new int[] {0, 1, 4}, new int[] {0, 2, 5}));
        bellmanFord(5, edges, 0, true);
        List<Integer> path = new ArrayList<>();
        for (int v = 4; v != -1; v = prev[v]) path.add(v);       // walk back from D
        Collections.reverse(path);
        StringBuilder line = new StringBuilder("Path to D:");
        for (int i = 0; i < path.size(); i++) line.append(i > 0 ? " -> " : " ").append(NAMES.charAt(path.get(i)));
        System.out.println(line + " (cost " + dist[4] + ")");

        edges.add(new int[] {3, 2, -8});                   // C -> B closes B -> A -> C -> B, total -8
        boolean cycle = bellmanFord(5, edges, 0, false);
        System.out.println("With C -> B weighing -8: " + (cycle ? "negative cycle reachable from S" : "no negative cycle"));
    }
}
```

```python
NAMES = "SABCD"
INF = float("inf")


def bellman_ford(n, edges, source, trace):
    """Bellman-Ford from source; weights may be negative. Returns dist, prev
    and whether a negative cycle is reachable from the source."""
    dist = [INF] * n
    prev = [-1] * n
    dist[source] = 0
    for rnd in range(1, n):  # V - 1 rounds are always enough
        for u, v, w in edges:
            if dist[u] != INF and dist[u] + w < dist[v]:  # never add to infinity
                dist[v] = dist[u] + w
                prev[v] = u
        if trace:
            shown = ("inf" if d == INF else str(d) for d in dist)
            print(f"Round {rnd}:", *(f"{NAMES[x]}={s}" for x, s in enumerate(shown)))
    for u, v, w in edges:  # one more pass: any improvement means a negative cycle
        if dist[u] != INF and dist[u] + w < dist[v]:
            return dist, prev, True
    return dist, prev, False


edges = [(3, 4, 2), (1, 3, 3), (2, 3, 4), (2, 1, -3), (0, 1, 4), (0, 2, 5)]
dist, prev, _ = bellman_ford(5, edges, 0, True)
path = []
v = 4
while v != -1:  # walk back from D
    path.append(v)
    v = prev[v]
path.reverse()
print("Path to D:", " -> ".join(NAMES[v] for v in path), f"(cost {dist[4]})")

edges.append((3, 2, -8))  # C -> B closes B -> A -> C -> B, total -8
_, _, cycle = bellman_ford(5, edges, 0, False)
print("With C -> B weighing -8:", "negative cycle reachable from S" if cycle else "no negative cycle")
```

```javascript
const NAMES = "SABCD";

// Bellman-Ford from source; weights may be negative. Returns dist, prev and
// whether a negative cycle is reachable from the source.
function bellmanFord(n, edges, source, trace) {
  const dist = new Array(n).fill(Infinity);
  const prev = new Array(n).fill(-1);
  dist[source] = 0;
  for (let round = 1; round < n; round++) { // V - 1 rounds are always enough
    for (const [u, v, w] of edges) {
      if (dist[u] !== Infinity && dist[u] + w < dist[v]) { // never add to infinity
        dist[v] = dist[u] + w;
        prev[v] = u;
      }
    }
    if (trace) {
      const shown = dist.map((d, x) => `${NAMES[x]}=${d === Infinity ? "inf" : d}`);
      console.log(`Round ${round}: ${shown.join(" ")}`);
    }
  }
  for (const [u, v, w] of edges) { // one more pass: any improvement means a negative cycle
    if (dist[u] !== Infinity && dist[u] + w < dist[v]) return { dist, prev, cycle: true };
  }
  return { dist, prev, cycle: false };
}

const edges = [[3, 4, 2], [1, 3, 3], [2, 3, 4], [2, 1, -3], [0, 1, 4], [0, 2, 5]];
const { dist, prev } = bellmanFord(5, edges, 0, true);
const path = [];
for (let v = 4; v !== -1; v = prev[v]) path.push(v); // walk back from D
path.reverse();
console.log(`Path to D: ${path.map((v) => NAMES[v]).join(" -> ")} (cost ${dist[4]})`);

edges.push([3, 2, -8]); // C -> B closes B -> A -> C -> B, total -8
const { cycle } = bellmanFord(5, edges, 0, false);
console.log(`With C -> B weighing -8: ${cycle ? "negative cycle reachable from S" : "no negative cycle"}`);
```

```output
Round 1: S=0 A=4 B=5 C=inf D=inf
Round 2: S=0 A=2 B=5 C=7 D=inf
Round 3: S=0 A=2 B=5 C=5 D=9
Round 4: S=0 A=2 B=5 C=5 D=7
Path to D: S -> B -> A -> C -> D (cost 7)
With C -> B weighing -8: negative cycle reachable from S
```

The `dist[u] != INF` test matters in C++ and Java: adding a weight to `INT_MAX` overflows into a large negative number, which would look like a wonderful shortcut. Stopping early when a whole round changes nothing gives the same answer and finishes sparse inputs much sooner.

## Other shapes of the same idea

- **0-1 BFS**: with weights of only 0 and 1, a deque replaces the heap — 0-edges to the front, 1-edges to the back — and stays sorted in O(V + E), as in [Minimum Obstacle Removal to Reach Corner](/problems/minimum-obstacle-removal-to-reach-corner).
- **Grids**: each cell is a vertex; in [The Maze II](/problems/the-maze-ii) each roll is one edge weighted by the cells it crosses.
- **Minimax paths**: when a route costs its *largest* step, as in [Path With Minimum Effort](/problems/path-with-minimum-effort), relax with `max(dist[u], w)`. A route's cost still never falls as it grows, the property the proof really needs.
- **Counting shortest paths**: keep `ways[v]` beside `dist[v]`; a strictly shorter distance copies `ways[u]`, an equal one adds it.
- **At most k edges**: [Cheapest Flights Within K Stops](/problems/cheapest-flights-within-k-stops) runs k + 1 Bellman–Ford rounds, each relaxing from a *copy* of the previous round.
- **All pairs**: Dijkstra from every vertex, or Floyd–Warshall in O(V³).

## Time and space complexity

| Algorithm | Allowed weights | Time | Extra space |
| --- | --- | --- | --- |
| BFS | all equal | O(V + E) | O(V) |
| 0-1 BFS with a deque | 0 or 1 | O(V + E) | O(V + E) |
| Dijkstra, binary heap with lazy deletion | non-negative | O((V + E) log V) | O(V + E) |
| Dijkstra, array scan | non-negative | O(V²) | O(V) |
| Bellman–Ford | any; detects negative cycles | O(V × E) | O(V) |
| Floyd–Warshall, all pairs | any, without negative cycles | O(V³) | O(V²) |

Each edge pushes at most one heap entry, and each push or pop costs O(log E), under 2 log V. Scanning an array instead of a heap costs O(V²), better when E is close to V².

## How to recognise a shortest-path problem

- It asks for the **minimum time, cost, distance or effort** to get from one place to another, and moves have **different costs**.
- It asks how long until something **reaches every node**: the largest shortest distance.
- The costs pick the algorithm: all equal means BFS, only 0 and 1 means 0-1 BFS, non-negative means Dijkstra, possibly negative means Bellman–Ford.
- There is an **extra limit**, such as at most k stops: count rounds with Bellman–Ford or put the count in the state.

Connecting *everything* at the lowest total cost is a different problem, the minimum spanning tree.

## Common mistakes

- **Negative weights.** Dijkstra's algorithm silently gives wrong answers, or never stops on a negative cycle. Check the constraints first.
- **Marking vertices when pushed instead of when popped.** A vertex is final only when it comes off the heap.
- **A max-heap by accident.** `std::priority_queue` is a max-heap; use `greater<>` or push negated distances. Java's `PriorityQueue` and Python's `heapq` are min-heaps.
- **Overflow.** `INT_MAX + w` wraps round to a negative number; relax only from finite distances.
- **Forgetting the reverse edge.** In an undirected graph, add every edge in both directions.

## Practice in this order

1. [Network Delay Time](/problems/network-delay-time): the algorithm unchanged; answer with the largest distance.
2. [Path With Minimum Effort](/problems/path-with-minimum-effort): the minimax relaxation on a grid.
3. [The Maze II](/problems/the-maze-ii): rolls as weighted edges.
4. [Cheapest Flights Within K Stops](/problems/cheapest-flights-within-k-stops): Bellman–Ford rounds over a copy.
5. [Find the City With the Smallest Number of Neighbors at a Threshold Distance](/problems/find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance): distances between all pairs.
6. [Number of Ways to Arrive at Destination](/problems/number-of-ways-to-arrive-at-destination): count shortest paths alongside the distances.
7. [Minimum Obstacle Removal to Reach Corner](/problems/minimum-obstacle-removal-to-reach-corner): 0-1 BFS.
8. [Swim in Rising Water](/problems/swim-in-rising-water): the minimax idea on heights.
9. [Minimum Cost to Make at Least One Valid Path in a Grid](/problems/minimum-cost-to-make-at-least-one-valid-path-in-a-grid): 0-1 BFS where an edge's cost depends on a sign.

The [shortest path problem list](/challenges/shortest-path) has every problem in the catalogue that uses these algorithms. Next on the road is the [Minimum Spanning Tree](/roadmap/minimum-spanning-tree), which connects every vertex as cheaply as possible.
