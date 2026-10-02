---
title: Topological Sort
stage: graphs-advanced
order: 1
minutes: 12
level: Intermediate
hub: topological-sort
practice: course-schedule, course-schedule-ii, parallel-courses, find-eventual-safe-states, all-ancestors-of-a-node-in-a-directed-acyclic-graph, course-schedule-iv, minimum-height-trees, parallel-courses-iii, largest-color-value-in-a-directed-graph
updated: 2026-10-03
seo-title: Topological Sort: Kahn's Algorithm and DFS Explained
description: Learn topological sort: Kahn's algorithm with in-degrees, the DFS version, cycle detection and course schedule, with code in C++, Java, Python and JavaScript.
question: What is topological sort?
answer: A topological sort lists the vertices of a directed acyclic graph so that every edge u → v has u before v, the way prerequisites come before the courses that need them. Kahn's algorithm repeatedly takes a vertex with no remaining incoming edges; the DFS version lists vertices in reverse order of finishing. Both run in O(V + E), and both detect a cycle, in which case no order exists.
q: Can every directed graph be topologically sorted?
a: Only a directed acyclic graph (DAG). If the graph has a cycle, each vertex on it must come before the next one round the loop, so some vertex would have to come before itself. Kahn's algorithm reports this when fewer than V vertices come out; the DFS version reports it when an edge leads to a vertex that is still on the recursion stack.
q: Is the topological order unique?
a: Usually not. Whenever two vertices are ready at the same moment, either can go next, and each choice gives a different valid order. The order is unique exactly when Kahn's queue never holds more than one vertex, which is the same as every pair of neighbours in the order being joined by an edge.
q: What is the time complexity of topological sort?
a: O(V + E) for both Kahn's algorithm and the DFS version: every vertex is placed once and every edge is looked at once. The adjacency list takes O(V + E) memory. If you need the lexicographically smallest order, a min-heap replaces the queue and the cost becomes O(V log V + E).
q: Should I use Kahn's algorithm or DFS for topological sort?
a: Kahn's algorithm is the safer default in interviews: it is iterative, so deep graphs cannot overflow the stack, its cycle check is a simple count, and it gives levels and the smallest order with small changes. The DFS version is shorter if you already have a DFS written, but it needs three colours to detect cycles correctly.
q: Where is topological sort used in real life?
a: Anywhere one job must wait for others. Build tools compile a module after the modules it imports, package managers install dependencies before the packages that need them, spreadsheets recalculate a cell after the cells it refers to, and university timetables place a course after its prerequisites.
---
Many problems hand you a list of jobs and rules of the form **"this must happen before that"**: take Data Structures before Algorithms, compile a library before the program that uses it, pour the foundations before the walls. A **topological sort** puts the jobs in an order that obeys every rule. Draw each job as a vertex and each rule as a directed edge u → v, meaning *u must come before v*; a **topological order** lists every vertex so that all the edges point forwards.

@figure forwards

It schedules dependencies and tests whether the rules contradict each other. It builds on [Graphs](/roadmap/graphs), [Breadth-First Search](/roadmap/breadth-first-search) and [Depth-First Search](/roadmap/depth-first-search).

## When an order exists

**A cycle makes an order impossible.** If 1 must come before 2, 2 before 3 and 3 before 1, no list can satisfy all three, whichever way you try.

@figure cycle-blocks

**Without a cycle, an order always exists.** A directed graph with no cycle is a **DAG** (directed acyclic graph), and every DAG has a vertex with nothing coming in, which can safely go first. Remove it, and what is left is still a DAG, so repeat.

@figure backwards-walk

## Why trying orders is too slow

Trying every ordering means V! of them: 2.4 × 10¹⁸ for V = 20. Following the argument literally, rescanning for a vertex whose prerequisites are all placed, costs O(V + E) per scan and V scans: about 2 × 10¹⁰ steps for 10⁵ courses and 10⁵ rules. But placing a vertex changes only the vertices it points to, so keep a running count per vertex and update just those.

## The idea: Kahn's algorithm

The count is the vertex's **in-degree**: the number of edges coming into it, its prerequisites not yet placed. Kahn's algorithm (Arthur Kahn, 1962) keeps those counts and a queue of vertices that are ready:

- **Count** every vertex's in-degree from the edge list.
- **Seed** a queue with every vertex of in-degree 0.
- **Take** a vertex u from the front and append it to the order.
- **Release**: for every edge u → v, lower v's count by one; if it reaches 0, u was v's last prerequisite, so v joins the queue.
- **Check**: when the queue is empty, the order holds every vertex if and only if there is no cycle.

@walkthrough

## Why it works

**Every edge points forwards.** A vertex joins the queue only when its count reaches 0, which happens only once every vertex with an edge into it is in the order.

**Nothing gets stuck in a DAG.** If the queue ran empty with vertices unplaced, the unplaced ones would form a smaller DAG, which has a vertex with nothing coming in from the others. All its prerequisites are placed, so its count reached 0 and it joined the queue and was placed: a contradiction.

**A cycle is caught for free.** On a cycle each vertex waits for the one before it, so none of them reaches 0, and nor does anything downstream.

@figure kahn-stuck

That is the whole of [Course Schedule](/problems/course-schedule): "can you finish every course?" means "does Kahn's algorithm place all of them?"

### The code

The function builds the adjacency list and the counts, runs the queue and returns the order; the caller compares its length with V. The program runs it on the six courses and on the cycle above.

```cpp
#include <iostream>
#include <queue>
#include <vector>
using namespace std;

// Kahn's algorithm. An edge {u, v} means u must come before v.
// Returns the order; it holds fewer than n vertices when there is a cycle.
vector<int> topoSort(int n, const vector<vector<int>>& edges) {
    vector<vector<int>> adj(n);
    vector<int> indegree(n, 0);
    for (const auto& e : edges) {
        adj[e[0]].push_back(e[1]);
        indegree[e[1]]++;
    }
    queue<int> ready;
    for (int v = 0; v < n; v++)
        if (indegree[v] == 0) ready.push(v);        // no prerequisites at all
    vector<int> order;
    while (!ready.empty()) {
        int u = ready.front();
        ready.pop();
        order.push_back(u);
        for (int v : adj[u])
            if (--indegree[v] == 0) ready.push(v);  // u was v's last prerequisite
    }
    return order;
}

void report(int n, const vector<vector<int>>& edges) {
    vector<int> order = topoSort(n, edges);
    if ((int)order.size() == n) {
        cout << "Order:";
        for (int v : order) cout << " " << v;
        cout << "\n";
        return;
    }
    vector<bool> placed(n, false);
    for (int v : order) placed[v] = true;
    cout << "Cycle: only " << order.size() << " of " << n << " vertices placed; stuck:";
    for (int v = 0; v < n; v++)
        if (!placed[v]) cout << " " << v;
    cout << "\n";
}

int main() {
    report(6, {{5, 2}, {5, 0}, {4, 0}, {4, 1}, {2, 3}, {3, 1}});
    report(4, {{0, 1}, {1, 2}, {2, 3}, {3, 1}});
    return 0;
}
```

```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.List;

public class Main {
    // Kahn's algorithm. An edge {u, v} means u must come before v.
    // Returns the order; it holds fewer than n vertices when there is a cycle.
    static List<Integer> topoSort(int n, int[][] edges) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int v = 0; v < n; v++) adj.add(new ArrayList<>());
        int[] indegree = new int[n];
        for (int[] e : edges) {
            adj.get(e[0]).add(e[1]);
            indegree[e[1]]++;
        }
        ArrayDeque<Integer> ready = new ArrayDeque<>();
        for (int v = 0; v < n; v++)
            if (indegree[v] == 0) ready.add(v);        // no prerequisites at all
        List<Integer> order = new ArrayList<>();
        while (!ready.isEmpty()) {
            int u = ready.poll();
            order.add(u);
            for (int v : adj.get(u))
                if (--indegree[v] == 0) ready.add(v);  // u was v's last prerequisite
        }
        return order;
    }

    static void report(int n, int[][] edges) {
        List<Integer> order = topoSort(n, edges);
        StringBuilder line = new StringBuilder();
        if (order.size() == n) {
            line.append("Order:");
            for (int v : order) line.append(" ").append(v);
        } else {
            boolean[] placed = new boolean[n];
            for (int v : order) placed[v] = true;
            line.append("Cycle: only ").append(order.size()).append(" of ").append(n).append(" vertices placed; stuck:");
            for (int v = 0; v < n; v++)
                if (!placed[v]) line.append(" ").append(v);
        }
        System.out.println(line);
    }

    public static void main(String[] args) {
        report(6, new int[][] {{5, 2}, {5, 0}, {4, 0}, {4, 1}, {2, 3}, {3, 1}});
        report(4, new int[][] {{0, 1}, {1, 2}, {2, 3}, {3, 1}});
    }
}
```

```python
from collections import deque


def topo_sort(n, edges):
    """Kahn's algorithm. An edge (u, v) means u must come before v.
    Returns the order; it holds fewer than n vertices when there is a cycle."""
    adj = [[] for _ in range(n)]
    indegree = [0] * n
    for u, v in edges:
        adj[u].append(v)
        indegree[v] += 1
    ready = deque(v for v in range(n) if indegree[v] == 0)  # no prerequisites at all
    order = []
    while ready:
        u = ready.popleft()
        order.append(u)
        for v in adj[u]:
            indegree[v] -= 1
            if indegree[v] == 0:  # u was v's last prerequisite
                ready.append(v)
    return order


def report(n, edges):
    order = topo_sort(n, edges)
    if len(order) == n:
        print("Order:", *order)
        return
    placed = [False] * n
    for v in order:
        placed[v] = True
    stuck = [v for v in range(n) if not placed[v]]
    print(f"Cycle: only {len(order)} of {n} vertices placed; stuck:", *stuck)


report(6, [(5, 2), (5, 0), (4, 0), (4, 1), (2, 3), (3, 1)])
report(4, [(0, 1), (1, 2), (2, 3), (3, 1)])
```

```javascript
// Kahn's algorithm. An edge [u, v] means u must come before v.
// Returns the order; it holds fewer than n vertices when there is a cycle.
function topoSort(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  const indegree = new Array(n).fill(0);
  for (const [u, v] of edges) {
    adj[u].push(v);
    indegree[v]++;
  }
  const ready = []; // the queue: read from a head index, so taking is O(1)
  for (let v = 0; v < n; v++) if (indegree[v] === 0) ready.push(v); // no prerequisites at all
  const order = [];
  for (let head = 0; head < ready.length; head++) {
    const u = ready[head];
    order.push(u);
    for (const v of adj[u]) {
      indegree[v]--;
      if (indegree[v] === 0) ready.push(v); // u was v's last prerequisite
    }
  }
  return order;
}

function report(n, edges) {
  const order = topoSort(n, edges);
  if (order.length === n) {
    console.log(`Order: ${order.join(" ")}`);
    return;
  }
  const placed = new Array(n).fill(false);
  for (const v of order) placed[v] = true;
  const stuck = [];
  for (let v = 0; v < n; v++) if (!placed[v]) stuck.push(v);
  console.log(`Cycle: only ${order.length} of ${n} vertices placed; stuck: ${stuck.join(" ")}`);
}

report(6, [[5, 2], [5, 0], [4, 0], [4, 1], [2, 3], [3, 1]]);
report(4, [[0, 1], [1, 2], [2, 3], [3, 1]]);
```

```output
Order: 4 5 2 0 3 1
Cycle: only 1 of 4 vertices placed; stuck: 1 2 3
```

In [Course Schedule II](/problems/course-schedule-ii) the pair [a, b] means *b* comes before *a*, so the edge is b → a: the most common slip in these problems.

## The DFS version: reverse post-order

Run a [depth-first search](/roadmap/depth-first-search) from every unvisited vertex and append each vertex to a list when it **finishes**, after everything it points to. That list is the **post-order**; reversed, it is a topological order. Take any edge u → v at the moment the search, inside u's call, looks along it:

- **v is white** (unvisited): DFS visits it now, so v finishes before u.
- **v is black** (finished): v is already in the post-order, before u.
- **v is grey** (on the stack): the search reached u from v, so there is a path v to u, and with u → v that is a cycle.

In a DAG the third case never happens, so v finishes before u for every edge, and reversing puts u first.

@figure dfs-postorder

The third case is also the cycle test, which is why the DFS needs three colours rather than a visited flag: reaching a black vertex by a second route is harmless (0 is reached from both 4 and 5), and only a grey one means a cycle.

```cpp
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

const int WHITE = 0, GREY = 1, BLACK = 2;  // unvisited, on the stack, finished
vector<vector<int>> adj;
vector<int> colour, post;
int backFrom = -1, backTo = -1;

// Explores u; returns false as soon as an edge leads back to a grey vertex.
bool visit(int u) {
    colour[u] = GREY;
    for (int v : adj[u]) {
        if (colour[v] == GREY) {               // v is still being explored: a cycle
            backFrom = u;
            backTo = v;
            return false;
        }
        if (colour[v] == WHITE && !visit(v)) return false;
    }
    colour[u] = BLACK;
    post.push_back(u);                         // u finishes after everything it points to
    return true;
}

void report(int n, const vector<vector<int>>& edges) {
    adj.assign(n, vector<int>());
    for (const auto& e : edges) adj[e[0]].push_back(e[1]);
    colour.assign(n, WHITE);
    post.clear();
    for (int s = 0; s < n; s++) {
        if (colour[s] == WHITE && !visit(s)) {
            cout << "Cycle: the edge " << backFrom << " -> " << backTo << " leads back to a vertex still on the stack\n";
            return;
        }
    }
    reverse(post.begin(), post.end());
    cout << "Reverse post-order:";
    for (int v : post) cout << " " << v;
    cout << "\n";
}

int main() {
    report(6, {{5, 2}, {5, 0}, {4, 0}, {4, 1}, {2, 3}, {3, 1}});
    report(4, {{0, 1}, {1, 2}, {2, 3}, {3, 1}});
    return 0;
}
```

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Main {
    static final int WHITE = 0, GREY = 1, BLACK = 2;  // unvisited, on the stack, finished
    static List<List<Integer>> adj;
    static int[] colour;
    static List<Integer> post;
    static int backFrom = -1, backTo = -1;

    // Explores u; returns false as soon as an edge leads back to a grey vertex.
    static boolean visit(int u) {
        colour[u] = GREY;
        for (int v : adj.get(u)) {
            if (colour[v] == GREY) {                // v is still being explored: a cycle
                backFrom = u;
                backTo = v;
                return false;
            }
            if (colour[v] == WHITE && !visit(v)) return false;
        }
        colour[u] = BLACK;
        post.add(u);                                // u finishes after everything it points to
        return true;
    }

    static void report(int n, int[][] edges) {
        adj = new ArrayList<>();
        for (int v = 0; v < n; v++) adj.add(new ArrayList<>());
        for (int[] e : edges) adj.get(e[0]).add(e[1]);
        colour = new int[n];
        post = new ArrayList<>();
        for (int s = 0; s < n; s++) {
            if (colour[s] == WHITE && !visit(s)) {
                System.out.println("Cycle: the edge " + backFrom + " -> " + backTo + " leads back to a vertex still on the stack");
                return;
            }
        }
        Collections.reverse(post);
        StringBuilder line = new StringBuilder("Reverse post-order:");
        for (int v : post) line.append(" ").append(v);
        System.out.println(line);
    }

    public static void main(String[] args) {
        report(6, new int[][] {{5, 2}, {5, 0}, {4, 0}, {4, 1}, {2, 3}, {3, 1}});
        report(4, new int[][] {{0, 1}, {1, 2}, {2, 3}, {3, 1}});
    }
}
```

```python
WHITE, GREY, BLACK = 0, 1, 2  # unvisited, on the stack, finished


def report(n, edges):
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
    colour = [WHITE] * n
    post = []
    back = []

    def visit(u):
        """Explore u; return False as soon as an edge leads back to a grey vertex."""
        colour[u] = GREY
        for v in adj[u]:
            if colour[v] == GREY:  # v is still being explored: a cycle
                back.extend((u, v))
                return False
            if colour[v] == WHITE and not visit(v):
                return False
        colour[u] = BLACK
        post.append(u)  # u finishes after everything it points to
        return True

    for s in range(n):
        if colour[s] == WHITE and not visit(s):
            print(f"Cycle: the edge {back[0]} -> {back[1]} leads back to a vertex still on the stack")
            return
    post.reverse()
    print("Reverse post-order:", *post)


report(6, [(5, 2), (5, 0), (4, 0), (4, 1), (2, 3), (3, 1)])
report(4, [(0, 1), (1, 2), (2, 3), (3, 1)])
```

```javascript
const WHITE = 0, GREY = 1, BLACK = 2; // unvisited, on the stack, finished

function report(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) adj[u].push(v);
  const colour = new Array(n).fill(WHITE);
  const post = [];
  let back = null;

  // Explores u; returns false as soon as an edge leads back to a grey vertex.
  function visit(u) {
    colour[u] = GREY;
    for (const v of adj[u]) {
      if (colour[v] === GREY) {
        back = [u, v]; // v is still being explored: a cycle
        return false;
      }
      if (colour[v] === WHITE && !visit(v)) return false;
    }
    colour[u] = BLACK;
    post.push(u); // u finishes after everything it points to
    return true;
  }

  for (let s = 0; s < n; s++) {
    if (colour[s] === WHITE && !visit(s)) {
      console.log(`Cycle: the edge ${back[0]} -> ${back[1]} leads back to a vertex still on the stack`);
      return;
    }
  }
  post.reverse();
  console.log(`Reverse post-order: ${post.join(" ")}`);
}

report(6, [[5, 2], [5, 0], [4, 0], [4, 1], [2, 3], [3, 1]]);
report(4, [[0, 1], [1, 2], [2, 3], [3, 1]]);
```

```output
Reverse post-order: 5 4 2 3 1 0
Cycle: the edge 3 -> 1 leads back to a vertex still on the stack
```

## When the order is unique

Whenever Kahn's queue holds two or more vertices, either could go next, so the order is **unique exactly when the queue never holds more than one**. For the **lexicographically smallest** order, replace the queue with a min-[heap](/roadmap/heap): 4, 5, 0, 2, 3, 1 on the six courses, in O(V log V + E). The greedy choice is safe because placing a vertex only ever makes more vertices ready, never fewer.

## Other shapes of the same idea

Run Kahn's algorithm one level at a time, taking everything in the queue at once, and the levels are rounds in which independent jobs run together:

@figure levels

- **Semesters.** [Parallel Courses](/problems/parallel-courses) counts those levels.
- **Dynamic programming on a DAG.** A longest path, earliest finishing time or count of paths fills in one pass along the order: [Parallel Courses III](/problems/parallel-courses-iii), and [Dynamic Programming](/roadmap/dynamic-programming).
- **Reversed edges.** In [Find Eventual Safe States](/problems/find-eventual-safe-states), reverse every edge and run Kahn's algorithm from the terminal nodes; whatever comes out is safe.
- **Peeling leaves.** [Minimum Height Trees](/problems/minimum-height-trees) strips an undirected tree's leaves layer by layer.

## Time and space complexity

| Approach | Time | Extra space |
| --- | --- | --- |
| Try every ordering | O(V! × E) | O(V) |
| Rescan for a ready vertex each round | O(V × (V + E)) | O(V) |
| Kahn's algorithm with a queue | O(V + E) | O(V + E) |
| DFS, reverse post-order | O(V + E) | O(V + E), plus the recursion stack |
| Kahn's algorithm with a min-heap | O(V log V + E) | O(V + E) |

Each vertex enters Kahn's queue once and each edge is looked at once. The DFS is as fast, but its recursion can go V calls deep, so for large inputs prefer Kahn's algorithm.

## How to recognise a topological sort problem

- **Dependencies**: prerequisites, "must be done before", "depends on", a build or install order.
- Whether every task **can be finished**, or **any valid order**: cycle detection in a directed graph.
- The **fewest rounds** or semesters when independent tasks run in parallel: Kahn's algorithm by levels.
- A **longest path** or earliest finishing time in a graph with no cycle: dynamic programming in topological order.
- An order **inferred from comparisons**, as in the "alien dictionary" family: each comparison is one edge.

## Common mistakes

- **Reading a pair the wrong way round.** In Course Schedule, [a, b] means b before a.
- **Forgetting the cycle check.** Kahn's loop ends quietly; compare the order's length with V.
- **Seeding the queue with one vertex.** Every vertex of in-degree 0 must start in it, including isolated ones; size the counts by V.
- **One visited flag in the DFS.** Only a grey vertex means a cycle.
- **Appending on entry instead of on finish.** Entry order is not a topological order: from 0 it lists 0 before 4, although 4 → 0.

## Practice in this order

1. [Course Schedule](/problems/course-schedule): Kahn's count as a cycle test.
2. [Course Schedule II](/problems/course-schedule-ii): return the order itself, the smallest one with a min-heap.
3. [Parallel Courses](/problems/parallel-courses): Kahn's algorithm one level at a time.
4. [Find Eventual Safe States](/problems/find-eventual-safe-states): reverse the edges, start from the terminal nodes.
5. [All Ancestors of a Node in a DAG](/problems/all-ancestors-of-a-node-in-a-directed-acyclic-graph): carry sets forward along the order.
6. [Course Schedule IV](/problems/course-schedule-iv): many "is a a prerequisite of b?" queries.
7. [Minimum Height Trees](/problems/minimum-height-trees): peel the leaves of an undirected tree.
8. [Parallel Courses III](/problems/parallel-courses-iii): earliest finishing times in topological order.
9. [Largest Color Value in a Directed Graph](/problems/largest-color-value-in-a-directed-graph): a count per colour and a cycle check in one pass.

The [topological sort problem list](/challenges/topological-sort) has every problem in the catalogue that uses it. Next on the road is [Union-Find](/roadmap/union-find), for the undirected question of who is connected to whom.
