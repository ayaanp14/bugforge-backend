---
title: Dijkstra's Algorithm
stage: graphs-advanced
order: 3
minutes: 25
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
A map app working out the fastest route, a router deciding where to forward a packet, a game character finding its way round obstacles: each is a **shortest path** question on a **weighted graph**, where every edge has a cost — a distance, a time, a price — and a path's length is the sum of its edge weights. **Dijkstra's algorithm**, published by Edsger Dijkstra in 1959, finds the shortest path from one source to every other vertex, as long as no weight is negative. After BFS and DFS it is the graph algorithm interviews ask about most.

This lesson shows why BFS is not enough, how Dijkstra's algorithm works with a priority queue, the proof that its greedy choice is safe and the exact line of that proof a negative edge breaks, how to rebuild the path itself, and the variations: Bellman–Ford for negative weights, 0-1 BFS and the shapes the catalogue's problems take. It assumes [Breadth-First Search](/roadmap/breadth-first-search) and the [Heap](/roadmap/heap). Every program is shown in C++, Java, Python and JavaScript.

## Why BFS is not enough

BFS finds shortest paths when every edge costs the same. It explores vertices in order of how many edges away they are, so the first time it reaches a vertex, it has used the fewest edges. With weights, fewest edges is no longer cheapest:

```text
     A ───── 10 ─────► C
     │                 ▲
     2                 3
     ▼                 │
     B ────────────────┘
```

BFS reaches C straight from A: one edge, cost 10. The path A → B → C uses two edges and costs 5.

The brute force tries every simple path and keeps the cheapest, but the number of paths explodes: between two vertices of a complete graph on 20 vertices there are about 1.7 × 10¹⁶ of them. A cleverer method, Bellman–Ford (later in this lesson), relaxes every edge V − 1 times for O(V × E); with V = 10⁵ and E = 2 × 10⁵ that is 2 × 10¹⁰ steps. Dijkstra's algorithm needs about (V + E) log V, around 5 × 10⁶ steps for the same graph, because it never looks at a vertex's edges more than once.

## The idea: settle the closest vertex first

Every vertex carries a **tentative distance**: the length of the best path to it found so far. The source starts at 0 and every other vertex at ∞. Then:

- **Pick.** Among the vertices not yet settled, take the one with the smallest tentative distance. Its distance is now final; the vertex is **settled**.
- **Relax.** For each edge u → v with weight w, if dist[u] + w < dist[v], going through u is a shorter route to v: set dist[v] = dist[u] + w and remember prev[v] = u.
- **Repeat** until every reachable vertex is settled.

Picking the smallest distance quickly is a job for a priority queue — a min-heap. The simplest correct way to use one is **lazy deletion**. Whenever dist[v] improves, push the pair (dist[v], v), and leave v's older, larger entry where it is. When an entry is popped, compare its distance with dist[v]: if it is larger, the entry is **stale** — v was already settled with a smaller distance — and it is skipped. This avoids a "decrease key" operation, which the standard heaps in C++, Java and Python do not offer.

The example graph has six vertices and nine directed edges:

```text
 A → B  4        B → D  5        D → E  2
 A → C  2        C → D  8        D → F  3
 C → B  1        C → E 10        E → F  2
```

@walkthrough

## Why it works

The algorithm is greedy: it commits to a vertex's distance the moment that vertex is the closest unsettled one, and never revisits it. The proof shows that commitment is safe.

**Claim.** When u is picked with tentative distance d, no path from the source to u is shorter than d.

Assume every vertex settled before u has its correct distance (true for the source, at distance 0; the argument below carries it forward). Take any path P from the source to u. It starts at a settled vertex and ends at u, which is not settled yet, so somewhere it steps for the first time from a settled vertex x to an unsettled vertex y. (y may be u itself.) Three facts follow:

- When x was settled, its edges were relaxed, so dist[y] ≤ dist[x] + w(x, y). Since dist[x] is the true distance to x, this is at most the length of P up to y.
- The algorithm picked u rather than y, so d = dist[u] ≤ dist[y].
- The rest of P, from y to u, has length at least 0, because **every weight is non-negative**.

Chaining them: length of P = (P up to y) + (rest of P) ≥ dist[y] + 0 ≥ d. No path beats d, so u's distance is final, and the assumption holds for the next vertex too. When the queue empties, every reachable vertex holds its true distance.

### Why a negative edge breaks it

The proof used non-negative weights exactly once — "the rest of the path cannot make it shorter". Take that away and the commitment fails:

```text
     A ── 2 ──► B
     │          ▲        Settling A gives B = 2 and C = 3.
     3          │ −2     B is the smaller, so B is settled at 2.
     ▼          │        Then C is settled at 3, and C → B costs 3 − 2 = 1.
     C ─────────┘        The true distance to B is 1, but B was already final.
```

The textbook algorithm, which never reopens a settled vertex, answers 2 for B, and anything computed from B's distance afterwards is wrong as well. The lazy-heap code in this lesson would notice the improvement, push B again and repair this small case, but the guarantee has gone: on bad graphs a vertex can be reopened an exponential number of times. And with a **negative cycle** — a loop whose weights add up to less than zero — distances fall for ever and the loop never ends. For negative weights, use Bellman–Ford.

### Dry run

The heap on the six-vertex graph, with each entry written as (distance, vertex) and the heap's contents listed smallest first:

| Step | Pop | Action | Distances changed | Heap after |
| --- | --- | --- | --- | --- |
| start | none | dist[A] = 0 | A 0 | (0, A) |
| 1 | (0, A) | settle A | B 4, C 2 | (2, C) (4, B) |
| 2 | (2, C) | settle C | B 3, D 10, E 12 | (3, B) (4, B) (10, D) (12, E) |
| 3 | (3, B) | settle B | D 8 | (4, B) (8, D) (10, D) (12, E) |
| 4 | (4, B) | stale: dist[B] is 3, skip | none | (8, D) (10, D) (12, E) |
| 5 | (8, D) | settle D | E 10, F 11 | (10, D) (10, E) (11, F) (12, E) |
| 6 | (10, D) | stale: dist[D] is 8, skip | none | (10, E) (11, F) (12, E) |
| 7 | (10, E) | settle E; E → F would give 12, not better than 11 | none | (11, F) (12, E) |
| 8 | (11, F) | settle F | none | (12, E) |
| 9 | (12, E) | stale: dist[E] is 10, skip | none | empty |

Look at step 2: B's distance drops from 4 to 3, because the two-edge path A → C → B is shorter than the direct edge. The vertices are settled in the order A, C, B, D, E, F — by distance, not by name — and three of the nine heap entries turn out stale.

### The code

The function returns the distances, the `prev` array and the order in which vertices were settled; the program then rebuilds the path to F. C++, Java and Python have a heap in the standard library. JavaScript does not, so its program carries a small binary min-heap of its own.

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

[Network Delay Time](/problems/network-delay-time) is this program almost unchanged: run it from the given node and answer with the largest distance, or −1 if any distance is still ∞.

## Rebuilding the path

Each time a distance improves, the code records `prev[v] = u`, the vertex just before v on the best path found so far. `prev[v]` changes only when `dist[v]` improves, so when the algorithm ends it names the vertex whose relaxation set v's final distance — and that vertex's own distance was already final when it was settled. Following `prev` from any vertex therefore walks back to the source along a shortest path. Together, the `prev` pointers form a **shortest-path tree** rooted at the source.

To print a path, start at the target, follow `prev` until it reaches −1 (the source has no predecessor), and reverse what you collected: F ← D ← B ← C ← A becomes A → C → B → D → F. Check the target first. An unreachable vertex keeps distance ∞ and `prev` −1, and walking from it would print a one-vertex "path" that does not exist.

## Negative weights: Bellman–Ford

When some weights are negative, use **Bellman–Ford**. It gives up the greedy choice altogether: it relaxes *every* edge, in any order, and repeats that V − 1 times.

Why V − 1 rounds are enough: if there is no negative cycle, a shortest path never needs to repeat a vertex, so it has at most V − 1 edges. After round k, every vertex whose shortest path has at most k edges holds its correct distance. (By induction: the last edge of such a path is relaxed during round k, and by then the vertex before it already had its correct distance from round k − 1.) So after V − 1 rounds every distance is correct.

That also gives the **negative-cycle test**. Run one extra pass over the edges. Without a negative cycle every distance is already final, so nothing can improve. If something still improves, a negative cycle is reachable from the source, and "shortest path" has no meaning for the vertices it reaches — you can loop round the cycle as often as you like.

### Dry run

Five vertices S, A, B, C, D, where B → A weighs −3, with the edges listed in the worst possible order: C → D 2, A → C 3, B → C 4, B → A −3, S → A 4, S → B 5.

| Round | Changes, in edge order | S | A | B | C | D |
| --- | --- | --- | --- | --- | --- | --- |
| start | none | 0 | ∞ | ∞ | ∞ | ∞ |
| 1 | S → A gives 4; S → B gives 5 | 0 | 4 | 5 | ∞ | ∞ |
| 2 | A → C gives 7; B → A gives 2 | 0 | 2 | 5 | 7 | ∞ |
| 3 | C → D gives 9; A → C gives 5 | 0 | 2 | 5 | 5 | 9 |
| 4 | C → D gives 7 | 0 | 2 | 5 | 5 | 7 |

The shortest path to D, S → B → A → C → D, has four edges, and in this edge order each round fixes exactly one more of them — so all V − 1 = 4 rounds are needed. In the lucky order S → B, B → A, A → C, C → D, one round would have done. Bellman–Ford always pays for the worst order. Dijkstra's algorithm would get this graph wrong: it settles A at 4 before B, because 4 is less than 5, and never learns about the cheaper route through B.

### The code

The function runs V − 1 rounds, optionally printing the distances after each, then makes the extra pass. The program then adds an edge C → B weighing −8, which creates the cycle B → A → C → B with total weight −3 + 3 − 8 = −8.

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

The `dist[u] != INF` test matters in C++ and Java: adding a weight to `INT_MAX` overflows into a large negative number, which would then look like a wonderful shortcut. A common optimisation is to stop early when a whole round changes nothing; the answer is the same and sparse inputs finish much sooner.

## Other shapes of the same idea

- **0-1 BFS.** When every weight is 0 or 1, a double-ended queue replaces the heap. Pop from the front; push a vertex reached by a 0-edge onto the front and one reached by a 1-edge onto the back. The deque only ever holds distances d and d + 1, in order, so it behaves as a perfectly sorted priority queue in O(V + E). [Minimum Obstacle Removal to Reach Corner](/problems/minimum-obstacle-removal-to-reach-corner) (an empty cell costs 0, an obstacle 1) and [Minimum Cost to Make at Least One Valid Path in a Grid](/problems/minimum-cost-to-make-at-least-one-valid-path-in-a-grid) (following a sign costs 0, changing it 1) are both 0-1 BFS.
- **Grids and implicit graphs.** Each cell is a vertex and the moves are its edges; nothing needs building. In [The Maze II](/problems/the-maze-ii) a ball rolls until it hits a wall, so each roll is one edge whose weight is the number of cells travelled.
- **Minimax paths.** In [Path With Minimum Effort](/problems/path-with-minimum-effort) a route costs its *largest* step, not the sum of its steps. Dijkstra's algorithm still works with the relaxation `max(dist[u], w)`, because a route's cost can never fall as it gets longer — the property the proof really needs. [Swim in Rising Water](/problems/swim-in-rising-water) is the same idea with cell heights.
- **Counting shortest paths.** [Number of Ways to Arrive at Destination](/problems/number-of-ways-to-arrive-at-destination) keeps `ways[v]` beside `dist[v]`: a strictly shorter distance copies `ways[u]`, an equal one adds it.
- **A limit on the number of edges.** [Cheapest Flights Within K Stops](/problems/cheapest-flights-within-k-stops) allows at most k + 1 flights, so plain Dijkstra may find a cheaper route that uses too many. Run k + 1 Bellman–Ford rounds, each relaxing from a *copy* of the previous round's distances so that one round adds at most one edge to any path.
- **All pairs.** [Find the City With the Smallest Number of Neighbors at a Threshold Distance](/problems/find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance) needs the distance between every pair of cities: run Dijkstra from every vertex, or use Floyd–Warshall, three nested loops in O(V³), which is fine for a few hundred vertices.
- **Dense graphs.** Without a heap, scan an array for the closest unsettled vertex each time: O(V²) in all, which beats the heap when E is close to V².

## Time and space complexity

| Algorithm | Allowed weights | Time | Extra space |
| --- | --- | --- | --- |
| BFS | all equal | O(V + E) | O(V) |
| 0-1 BFS with a deque | 0 or 1 | O(V + E) | O(V + E) |
| Dijkstra, binary heap with lazy deletion | non-negative | O((V + E) log V) | O(V + E) |
| Dijkstra, array scan | non-negative | O(V²) | O(V) |
| Bellman–Ford | any; detects negative cycles | O(V × E) | O(V) |
| Floyd–Warshall, all pairs | any, without negative cycles | O(V³) | O(V²) |

The heap version settles each vertex once and relaxes each edge once. A relaxation can push one entry, so the heap holds at most E + 1 entries, and each push or pop costs O(log E). Since a simple graph has fewer than V² edges, log E is less than 2 log V, which is why the bound is written O((V + E) log V). The adjacency list itself takes O(V + E) memory.

## How to recognise a shortest-path problem

Read the statement for these signals:

- It asks for the **minimum time, cost, distance or effort** to get from one place to another, and moves have **different costs**.
- It asks how long until something **reaches every node** — a signal, an infection, a rumour. That is the largest of the shortest distances.
- The costs decide the algorithm: all equal means BFS, only 0 and 1 means 0-1 BFS, non-negative means Dijkstra, possibly negative means Bellman–Ford.
- There is an **extra limit**, such as at most k stops: count rounds with Bellman–Ford or put the count in the state.
- A route's cost is its **worst single step** rather than its total: minimax Dijkstra, or the union-find approach from the [Minimum Spanning Tree](/roadmap/minimum-spanning-tree) lesson.

Do not confuse this with connecting *everything* at the lowest total cost. That is a minimum spanning tree, and the two usually pick different edges.

## Common mistakes

- **Negative weights.** Dijkstra's algorithm silently gives wrong answers, or never stops if there is a negative cycle. Check the constraints before you choose it.
- **Marking vertices when pushed instead of when popped.** A vertex pushed early with a large distance would then be locked out of later improvements. A vertex is final only when it comes off the heap.
- **A max-heap by accident.** `std::priority_queue` in C++ is a max-heap by default; use `greater<>` as above, or push negated distances. Java's `PriorityQueue` and Python's `heapq` are min-heaps.
- **Skipping the stale check.** The answers stay correct, but every stale entry rescans all of its vertex's edges, and on dense graphs that multiplies the work.
- **Overflow.** In C++ and Java, `INT_MAX + w` wraps round to a negative number. Only relax from finite distances, or use a smaller infinity such as 10⁹ with `long` arithmetic.
- **Forgetting the reverse edge.** In an undirected graph, add every edge in both directions.

## Practice in this order

Start with the algorithm as written, then the variations that change what a distance means:

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
