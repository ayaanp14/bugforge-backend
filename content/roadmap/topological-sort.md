---
title: Topological Sort
stage: graphs-advanced
order: 1
minutes: 22
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
Many problems hand you a list of jobs and a list of rules of the form **"this must happen before that"**: take Data Structures before Algorithms, compile a library before the program that uses it, pour the foundations before building the walls. A **topological sort** puts the jobs in an order that obeys every rule. It is the standard tool for scheduling with dependencies, and it doubles as the standard test of whether the rules contradict each other.

This lesson explains what a topological order is and when one exists, walks through Kahn's algorithm step by step, proves it correct, shows how it detects a cycle, and then covers the depth-first version and the problems that use each. It builds on [Graphs](/roadmap/graphs), [Breadth-First Search](/roadmap/breadth-first-search) and [Depth-First Search](/roadmap/depth-first-search). Every program is shown in C++, Java, Python and JavaScript.

## What a topological order is

Draw each job as a vertex and each rule as a directed edge: an edge **u → v** means *u must come before v*. A **topological order** is a list of all the vertices in which every edge points forwards — for every edge u → v, u appears earlier in the list than v.

Here are six courses, numbered 0 to 5, with six prerequisite rules:

```text
   5 ────► 2 ────► 3
   │               │
   ▼               ▼
   0 ◄──── 4 ────► 1

 edges: 5→2, 5→0, 4→0, 4→1, 2→3, 3→1
```

The list 4, 5, 2, 0, 3, 1 is a topological order: pick any edge, say 2 → 3, and its first vertex comes first. So is 5, 4, 2, 3, 1, 0. The list 5, 2, 3, 1, 4, 0 is not, because the edge 4 → 1 points backwards: course 1 would be taken before its prerequisite, course 4.

Two facts decide when an order exists:

- **A cycle makes an order impossible.** If 1 → 2 → 3 → 1, then 1 must come before 2, 2 before 3 and 3 before 1 — so 1 must come before itself. No list can manage that.
- **Without a cycle, an order always exists.** A directed graph with no cycle is a **DAG** (directed acyclic graph), and every DAG has a vertex with no incoming edge. To find one, start anywhere and keep walking backwards along incoming edges. With no cycle you never meet a vertex twice, and the graph is finite, so the walk must stop — at a vertex with nothing coming in. That vertex can safely go first. Remove it, and what is left is still a DAG, so repeat.

That second argument is already the whole algorithm. The rest of the lesson is about doing it fast.

## Why trying orders is too slow

The most naive approach tries every ordering of the vertices and checks each one against the edges. There are V! orderings: 3.6 million for V = 10 and about 2.4 × 10¹⁸ for V = 20. That is hopeless beyond toy sizes.

A smarter but still slow approach follows the argument above literally: scan all the vertices for one whose prerequisites are all placed, place it, then scan again. Each scan rechecks every edge, so it costs O(V + E), and there are V scans: O(V × (V + E)) in all. With 10⁵ courses and 10⁵ rules that is about 2 × 10¹⁰ steps — minutes of work, for a judge that allows about a second. The waste is in the rescanning. Placing one vertex changes the situation of only the vertices it points to, so keep a running count per vertex and update just those counts.

## The idea: Kahn's algorithm

The count is the vertex's **in-degree**: the number of edges coming into it, which starts as the number of its prerequisites and falls as they are placed. Kahn's algorithm (published by Arthur Kahn in 1962) keeps those counts and a queue of vertices that are ready to go:

```text
 vertex:     0  1  2  3  4  5
 in-degree:  2  2  1  1  0  0        ready queue: [4, 5]
```

- **Count.** Compute every vertex's in-degree from the edge list.
- **Seed.** Put every vertex with in-degree 0 in a queue. They have no prerequisites, so any of them may go first.
- **Take.** Remove a vertex u from the front of the queue and append it to the order.
- **Release.** For every edge u → v, lower v's in-degree by one, because one of v's prerequisites has now been placed. If the count reaches 0, u was v's last unplaced prerequisite, so v joins the queue.
- **Check.** When the queue is empty, the order holds every vertex if and only if the graph has no cycle.

@walkthrough

## Why it works

Two things need showing: every edge points forwards in the order Kahn's algorithm produces, and the order contains every vertex whenever the graph is a DAG.

**Every edge points forwards.** A vertex v joins the queue only when its count reaches 0, and the count falls by one exactly when one of v's predecessors is appended to the order. So by the time v itself is appended, *every* vertex with an edge into v is already in the order. That is precisely the definition of a topological order.

**Nothing gets stuck in a DAG.** Suppose the queue runs empty while some vertices are still unplaced. The unplaced vertices and the edges between them form a smaller graph. If the original graph has no cycle, neither does this one, so by the backwards-walk argument some unplaced vertex has no incoming edge from another unplaced vertex. All of its prerequisites are placed, so its count is 0, so it was put in the queue — which contradicts the queue being empty. Hence, in a DAG, all V vertices come out.

**A cycle is caught for free.** On a cycle, each vertex waits for the one before it, so none of them ever reaches a count of 0 and none is ever placed. Neither is anything downstream of the cycle. So if fewer than V vertices come out, the graph has a cycle, and the vertices left over are exactly those on a cycle or reachable from one. That is the whole of [Course Schedule](/problems/course-schedule): "can you finish every course?" means "does Kahn's algorithm place all of them?"

### Dry run

Kahn's algorithm on the six courses, taking vertices from the front of the queue and each vertex's edges in the order they were listed:

| Step | Take | Order so far | Counts lowered | Joins the queue | Queue after |
| --- | --- | --- | --- | --- | --- |
| start | — | — | — | 4, 5 | 4, 5 |
| 1 | 4 | 4 | course 0 from 2 to 1, course 1 from 2 to 1 | none | 5 |
| 2 | 5 | 4 5 | course 2 from 1 to 0, course 0 from 1 to 0 | 2, 0 | 2, 0 |
| 3 | 2 | 4 5 2 | course 3 from 1 to 0 | 3 | 0, 3 |
| 4 | 0 | 4 5 2 0 | none | none | 3 |
| 5 | 3 | 4 5 2 0 3 | course 1 from 1 to 0 | 1 | 1 |
| 6 | 1 | 4 5 2 0 3 1 | none | none | empty |

All six vertices came out, so there is no cycle. Notice course 0 in step 2: it had two prerequisites, 4 and 5, and it joined the queue only when the second of them was placed.

### The code

The function builds an adjacency list and the in-degree counts from the edge list, runs the queue, and returns the order; the caller compares its length with V. The program runs it on the six courses and then on a second graph, 0 → 1 → 2 → 3 → 1, whose last edge closes a cycle.

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

In the second graph only vertex 0 starts with in-degree 0. Placing it lowers vertex 1 from 2 to 1 — the edge 3 → 1 still holds it — and the queue is empty. Vertices 1, 2 and 3 each wait for another of the three, for ever.

One warning before you use this on [Course Schedule II](/problems/course-schedule-ii): there, the pair [a, b] means *b* comes before *a*, so the edge is b → a. Reading it the other way round is the most common slip in these problems.

## The DFS version: reverse post-order

[Depth-first search](/roadmap/depth-first-search) gives a second topological sort that is just as fast. Run a DFS from every unvisited vertex, and append each vertex to a list at the moment it **finishes** — after everything it points to has been explored. That list is the **post-order**, and reversed it is a topological order.

To see why, take any edge u → v and look at the moment the DFS, exploring u, looks along it. The vertex v is in one of three states:

- **Unvisited (white).** The DFS visits v now, from inside u's call, so v finishes before u does.
- **Finished (black).** v has already finished, so it is earlier in the post-order than u will be.
- **In progress (grey).** v is still on the recursion stack, which means the DFS reached u from v. So there is a path from v to u, and together with the edge u → v that is a cycle.

In a DAG the third case cannot happen, so for every edge u → v, v finishes before u. Reverse the finishing order and u comes before v: every edge points forwards. The third case is also the cycle test. Meeting a grey vertex means a cycle, and the edge that met it is the **back edge** that closes it.

This is why the DFS needs three colours rather than a visited flag. Reaching a finished vertex again is harmless: in the six courses, vertex 0 is reached from 4 and again from 5, two separate routes and no cycle. Reaching a vertex that is still in progress is a cycle. One visited flag cannot tell the two apart, so it either reports the harmless diamond as a cycle or misses real ones. (Undirected graphs are different: there, any visited neighbour other than the parent closes a cycle — and [Union-Find](/roadmap/union-find) often does the job more simply.)

### Dry run

The DFS tries start vertices 0, 1, 2, … in index order and follows each vertex's edges in input order:

| Event | Grey (on the stack) | Post-order so far |
| --- | --- | --- |
| visit 0: no edges, finish 0 | none | 0 |
| visit 1: no edges, finish 1 | none | 0 1 |
| visit 2, follow 2 → 3, visit 3 | 2, 3 | 0 1 |
| 3 → 1: 1 is finished; finish 3 | 2 | 0 1 3 |
| finish 2 | none | 0 1 3 2 |
| visit 4: 0 and 1 are finished; finish 4 | none | 0 1 3 2 4 |
| visit 5: 2 and 0 are finished; finish 5 | none | 0 1 3 2 4 5 |

Reversed, that is 5 4 2 3 1 0. It differs from Kahn's 4 5 2 0 3 1, and both are valid: a DAG usually has many topological orders.

### The code

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

On the second graph the DFS goes 0 → 1 → 2 → 3 with all four vertices grey, then finds the edge 3 → 1 pointing at a grey vertex. Kahn's algorithm told you *which* vertices were stuck; the DFS tells you *which edge* closes a cycle. Use whichever answer the problem asks for.

## When the order is unique

Kahn's algorithm makes a choice whenever the queue holds two or more vertices: any of them could go next, and each choice leads to a different valid order. So the topological order is **unique exactly when the queue never holds more than one vertex**.

There is an equivalent test you can read off the order itself: it is unique exactly when every two neighbours in the order are joined by an edge, so the order is a single path through every vertex. If the queue only ever holds one vertex, each vertex entered it at the moment the previous one was placed, which needs an edge from the previous one. Conversely, if consecutive vertices are joined by edges, those edges pin every vertex to its position.

The six courses fail the test at once: the queue starts with both 4 and 5, so 5, 4, 2, 0, 3, 1 is as valid as Kahn's answer. Course Schedule II removes the ambiguity a different way — it asks for the **lexicographically smallest** order. Replace the queue with a min-[heap](/roadmap/heap) so that the smallest ready vertex always goes next. On the six courses this gives 4, 5, 0, 2, 3, 1 instead of 4, 5, 2, 0, 3, 1. The greedy choice is right because two orders are compared at the first position where they differ: no valid order can put anything smaller than the smallest *ready* vertex in that position, and placing a vertex only ever makes more vertices ready, never fewer. The heap costs O(log V) per operation, so the total becomes O(V log V + E).

## Other shapes of the same idea

- **Levels, or semesters.** In [Parallel Courses](/problems/parallel-courses) you may take any number of courses at once. Run Kahn's algorithm one level at a time — everything in the queue now is one semester — and count the levels. On the six courses the levels are {4, 5}, {2, 0}, {3} and {1}: four semesters, which is the number of vertices on the longest path, 5 → 2 → 3 → 1.
- **Dynamic programming on a DAG.** In a topological order every vertex comes after all its predecessors, so any value built from predecessors — a longest path, an earliest finishing time, a count of paths — can be filled in with one pass. [Parallel Courses III](/problems/parallel-courses-iii) computes each course's earliest finishing time this way, and [Largest Color Value in a Directed Graph](/problems/largest-color-value-in-a-directed-graph) carries a count per colour along the order while Kahn's count doubles as its cycle check. See [Dynamic Programming](/roadmap/dynamic-programming).
- **Reachability.** [All Ancestors of a Node in a DAG](/problems/all-ancestors-of-a-node-in-a-directed-acyclic-graph) and [Course Schedule IV](/problems/course-schedule-iv) pass each vertex's set of ancestors forward along its edges, in topological order, so every set is complete before it is copied on.
- **Reversed edges.** In [Find Eventual Safe States](/problems/find-eventual-safe-states) a node is safe when every path from it ends at a terminal node. Reverse every edge and run Kahn's algorithm starting from the terminal nodes; the nodes that come out are the safe ones, and the nodes left behind are on a cycle or lead into one.
- **Peeling leaves.** [Minimum Height Trees](/problems/minimum-height-trees) uses the same idea on an undirected tree: remove every leaf (degree 1) at once, layer by layer, like a queue of in-degree-0 vertices. The last one or two vertices standing are the centres.
- **Shortest paths in a DAG.** Relaxing edges in topological order finds shortest paths from a source in O(V + E), even with negative weights — something [Dijkstra's Algorithm](/roadmap/dijkstras-algorithm) cannot handle.

## Time and space complexity

| Approach | Time | Extra space |
| --- | --- | --- |
| Try every ordering | O(V! × E) | O(V) |
| Rescan for a ready vertex each round | O(V × (V + E)) | O(V) |
| Kahn's algorithm with a queue | O(V + E) | O(V + E) |
| DFS, reverse post-order | O(V + E) | O(V + E), plus the recursion stack |
| Kahn's algorithm with a min-heap | O(V log V + E) | O(V + E) |

Kahn's algorithm is O(V + E) because each vertex enters and leaves the queue at most once and each edge is looked at exactly once, when its starting vertex leaves the queue. The adjacency list accounts for the O(V + E) memory. The DFS visits each vertex and edge once too, but its recursion can go V calls deep: on a chain of 10⁵ vertices Python's default recursion limit of 1,000 is hit long before the end, and Java's default stack may overflow as well. For large inputs, prefer Kahn's algorithm or a DFS with an explicit stack.

## How to recognise a topological sort problem

Read the statement for these signals:

- It describes **dependencies**: prerequisites, "must be done before", "depends on", a build order, an install order, tasks that wait for other tasks.
- It asks whether every task **can be finished**, or for **any valid order** — both are cycle detection in a directed graph.
- It asks for the **minimum number of rounds**, semesters or stages when independent tasks can run in parallel. That is Kahn's algorithm level by level.
- It asks for a **longest path**, an earliest finishing time or a number of paths in a graph that is guaranteed to have no cycle. That is dynamic programming in topological order.
- An ordering of letters or items must be **inferred from comparisons**, as in the "alien dictionary" family: each comparison contributes one edge.

If the edges have no direction (friendships, cables) and the question is who is connected to whom, you want [Union-Find](/roadmap/union-find) or a plain search instead. If the edges carry weights and the question is the cheapest route, look at Dijkstra's algorithm.

## Common mistakes

- **Reading a pair the wrong way round.** In Course Schedule, [a, b] means b before a, so the edge is b → a. Reverse it and you get a reversed order — a valid answer to a different question.
- **Forgetting the cycle check.** Kahn's loop ends quietly when the queue empties. If you return the order without comparing its length with V, a graph with a cycle produces a confident partial answer.
- **Seeding the queue with one vertex.** Every vertex with in-degree 0 must start in the queue, including isolated vertices that appear in no edge at all. Size the in-degree array by V, not by the vertices named in the edges.
- **One visited flag in the DFS.** Directed graphs need three states. A finished vertex reached by a second route is not a cycle; only a vertex still on the stack is.
- **Appending on entry instead of on finish.** The order in which a DFS *enters* vertices is not a topological order: starting from 0 it lists 0 before 4, although 4 → 0. Only the reversed finishing order works.
- **Using `shift()` as a queue in JavaScript.** It moves every remaining element, so the loop quietly becomes O(V²). Read from a head index instead, as the code above does.

## Practice in this order

Start with the problems where the plain algorithm is the answer, then move to the ones that build something on top of the order:

1. [Course Schedule](/problems/course-schedule): Kahn's count as a cycle test.
2. [Course Schedule II](/problems/course-schedule-ii): return the order itself — the smallest one, with a min-heap.
3. [Parallel Courses](/problems/parallel-courses): Kahn's algorithm one level at a time.
4. [Find Eventual Safe States](/problems/find-eventual-safe-states): reverse the edges and start from the terminal nodes.
5. [All Ancestors of a Node in a DAG](/problems/all-ancestors-of-a-node-in-a-directed-acyclic-graph): carry sets forward along the order.
6. [Course Schedule IV](/problems/course-schedule-iv): answer many "is a a prerequisite of b?" queries.
7. [Minimum Height Trees](/problems/minimum-height-trees): peel the leaves of an undirected tree.
8. [Parallel Courses III](/problems/parallel-courses-iii): earliest finishing times, dynamic programming in topological order.
9. [Largest Color Value in a Directed Graph](/problems/largest-color-value-in-a-directed-graph): a count per colour and a cycle check in the same pass.

The [topological sort problem list](/challenges/topological-sort) has every problem in the catalogue that uses it. Next on the road is [Union-Find](/roadmap/union-find), for the undirected question of who is connected to whom.
