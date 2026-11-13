---
title: Topological sort — Kahn's algorithm and DP on a DAG
minutes: 14
seo-title: Topological Sort in C++: Kahn's Algorithm and Longest Path DAG
description: Kahn's algorithm in C++ for contests: in-degrees, a queue or min-heap for the smallest order, cycle detection by count, and DP over a DAG for longest paths.
question: What is Kahn's algorithm for topological sort?
answer: Kahn's algorithm orders the vertices of a directed acyclic graph (DAG) so every edge points forwards. It counts each vertex's in-degree, queues every vertex with in-degree 0, and repeatedly removes one, appends it to the order and lowers its neighbours' in-degrees, queueing any that reach 0. It runs in O(V + E); fewer than V vertices placed means the graph has a cycle.
q: How do you get the lexicographically smallest topological order?
a: Run Kahn's algorithm with a min-heap — `priority_queue<int, vector<int>, greater<>>` — instead of a queue, so the smallest ready vertex is always taken next. It costs O((V + E) log V).
q: How does Kahn's algorithm detect a cycle?
a: Vertices on a cycle each wait for another vertex of the cycle, so none of them ever reaches in-degree 0. If the order ends with fewer than V vertices, the leftovers lie on a cycle or behind one, and no topological order exists.
q: How do you find the longest path in a DAG?
a: Process the vertices in topological order and relax each edge `u → v` with `best[v] = max(best[v], best[u] + w)`. Every path into `u` is final before `u` is processed, so one pass gives the answer in O(V + E), even though longest path is NP-hard on general graphs.
q: What is the difference between Kahn's algorithm and DFS topological sort?
a: Both run in O(V + E). Kahn's peels in-degree-0 vertices with a queue and detects a cycle by count; the DFS version outputs vertices in reverse post-order and detects a cycle by meeting a vertex still on the recursion stack. Kahn's has no recursion depth to worry about.
---
A **topological order** lists a DAG's vertices so every edge `a → b` has `a` before `b` — prerequisites before courses, tasks before what depends on them. It exists **exactly when there is no cycle**.

## Kahn's algorithm

- Count `indeg[v]`, the number of edges into `v`.
- Every vertex with `indeg == 0` is **ready**: nothing has to come before it.
- Take a ready vertex, append it, and cross off its out-edges; a neighbour that drops to 0 becomes ready.
- Ready set a `queue` → any valid order. A **min-heap** → the lexicographically smallest one.

```cpp
priority_queue<int, vector<int>, greater<>> ready;
for (int v = 1; v <= n; ++v) if (indeg[v] == 0) ready.push(v);
vector<int> order;
while (!ready.empty()) {
    int u = ready.top(); ready.pop();
    order.push_back(u);
    for (int v : adj[u]) if (--indeg[v] == 0) ready.push(v);
}
bool cycle = (int)order.size() < n;
```

@figure peel

## Cycles

- On a cycle every vertex waits for another of the cycle, so none reaches 0.
- `order.size() < n` **is** the cycle test — no separate DFS needed.

## DP on a DAG

The order is a schedule for dynamic programming: when `u` comes up, every path into it is already counted.

- Longest path: `best[v] = max(best[v], best[u] + w)` over edges in order — O(V + E), though NP-hard on general graphs.
- Number of paths `1 → n`: `ways[v] += ways[u]`, mod 10^9 + 7.
- Fewest semesters (any number of courses at once): `level[v] = max(level[v], level[u] + 1)`.

```game
type: order
title: Kahn's algorithm, step by step
prompt: Put the steps of Kahn's algorithm in order.
- Count the in-degree of every vertex
- Put every vertex with in-degree 0 into the ready set
- Take a ready vertex and append it to the order
- Lower each out-neighbour's in-degree; add those that reach 0
- Repeat until the ready set is empty
- If fewer than V vertices were placed, report a cycle
why: The counts come first, the ready set is seeded once, then take-and-cross-off repeats; only at the end does the count tell you whether a cycle blocked some vertices.
```

## Pitfalls

- A queue where the statement wants the **smallest** order — use the min-heap.
- Recursing in a DFS topo sort on a 10^5-vertex chain: stack overflow. Kahn's is iterative.
- Longest path with `int`: 10^5 edges of 10^9 needs `long long`.

## More practice

- [Course Schedule](/problems/course-schedule)
- [Course Schedule II](/problems/course-schedule-ii)
- [Parallel Courses](/problems/parallel-courses)
- [Find Eventual Safe States](/problems/find-eventual-safe-states)
- [Largest Color Value in a Directed Graph](/problems/largest-color-value-in-a-directed-graph)
