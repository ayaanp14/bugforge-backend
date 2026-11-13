---
title: Shortest paths — BFS, 0-1 BFS and Dijkstra
minutes: 16
seo-title: Dijkstra's Algorithm in C++ for Contests: BFS and 0-1 BFS
description: Pick the shortest-path algorithm from the weights: BFS for unit edges, 0-1 BFS with a deque, Dijkstra with a priority queue and lazy deletion in C++.
question: How do you implement Dijkstra's algorithm in C++?
answer: Dijkstra's algorithm finds shortest distances from one source when every edge weight is non-negative. In C++ keep a `dist` array at infinity, push `{0, source}` into a `priority_queue` ordered smallest first, and repeatedly pop the closest pair: skip it if its distance is stale, otherwise relax each out-edge and push any improved neighbour. It runs in O((V + E) log V).
q: When should I use BFS instead of Dijkstra?
a: When every edge has the same weight. BFS visits vertices in order of edge count, which is exactly the distance then, in O(V + E) with a plain queue. Dijkstra gives the same answer but pays a log factor for the heap.
q: What is 0-1 BFS?
a: A shortest-path algorithm for graphs whose edge weights are only 0 or 1. It keeps a deque: a 0-weight edge pushes the neighbour to the front and a 1-weight edge to the back, so the deque always holds at most two distance values in order. It runs in O(V + E).
q: Why does Dijkstra fail with negative edge weights?
a: Dijkstra settles the closest vertex for good, assuming no later path can be shorter. A negative edge reached later can make one shorter, so a settled distance would be wrong. Use Bellman–Ford, or SPFA, when weights can be negative.
q: What is lazy deletion in Dijkstra?
a: `std::priority_queue` cannot lower a key, so when a distance improves you push a new pair and leave the old one. When an old pair is popped, `d > dist[v]` shows it is stale and you skip it. The heap holds at most E pairs.
---
Pick the algorithm from the **edge weights**, never from habit:

| Weights | Algorithm | Cost |
| --- | --- | --- |
| all equal (grid moves) | BFS, `queue` | O(V + E) |
| only 0 or 1 | 0-1 BFS, `deque` | O(V + E) |
| non-negative | Dijkstra, `priority_queue` | O((V + E) log V) |
| some negative | Bellman–Ford | O(V · E) |

## BFS and 0-1 BFS

- BFS pops vertices in order of edge count; set `dist[v]` when `v` is **first pushed**, and a cell is never queued twice.
- 0-1 BFS: a 0-edge `push_front`s the neighbour, a 1-edge `push_back`s it. The deque holds at most two distance values, in order, so its front is always a closest vertex.

```cpp
deque<int> dq{src};
dist[src] = 0;
while (!dq.empty()) {
    int u = dq.front(); dq.pop_front();
    for (auto [v, w] : adj[u])
        if (dist[u] + w < dist[v]) {
            dist[v] = dist[u] + w;
            w == 0 ? dq.push_front(v) : dq.push_back(v);
        }
}
```

## Dijkstra, the contest way

```cpp
vector<ll> dist(n + 1, LLONG_MAX);
priority_queue<pair<ll,int>, vector<pair<ll,int>>, greater<>> pq;
dist[src] = 0;
pq.push({0, src});
while (!pq.empty()) {
    auto [d, u] = pq.top(); pq.pop();
    if (d > dist[u]) continue;              // stale pair: lazy deletion
    for (auto [v, w] : adj[u])
        if (d + w < dist[v]) {
            dist[v] = d + w;
            pq.push({dist[v], v});
        }
}
```

- `greater<>` turns the max-heap into a min-heap; the distance goes **first** in the pair so it decides the order.
- The heap cannot lower a key, so an improvement pushes a new pair; the old one is skipped later by `d > dist[u]`.
- Path sums are `long long`: a path of 10^5 edges of 10^9 is 10^14.

@figure frontier

```game
type: match
title: Weights to algorithm
prompt: Match each graph to the algorithm a contest solution uses.
- A grid where every move costs 1 => BFS with a queue
- Doors cost 1, corridors cost 0 => 0-1 BFS with a deque
- Roads with lengths up to 10^9 => Dijkstra with a priority_queue
- A few edges have negative weights => Bellman–Ford
why: The cheapest correct tool depends only on the weights: equal, 0/1, non-negative, or possibly negative.
```

## Pitfalls

- Printing `LLONG_MAX` for an unreachable vertex — map it to `-1` (or what the statement asks).
- `pq.push({v, dist[v]})` — the vertex first sorts by vertex number, not distance.
- Forgetting the stale check: still correct, but a vertex's edges are scanned many times — TLE on dense graphs.

## More practice

- [Network Delay Time](/problems/network-delay-time)
- [Shortest Path in Binary Matrix](/problems/shortest-path-in-binary-matrix)
- [Path With Minimum Effort](/problems/path-with-minimum-effort)
- [Minimum Obstacle Removal to Reach Corner](/problems/minimum-obstacle-removal-to-reach-corner)
- [Number of Ways to Arrive at Destination](/problems/number-of-ways-to-arrive-at-destination)
