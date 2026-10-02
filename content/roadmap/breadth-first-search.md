---
title: Breadth-First Search (BFS)
stage: graphs
order: 2
minutes: 22
level: Beginner
hub: breadth-first-search
practice: flood-fill, find-if-path-exists-in-graph, keys-and-rooms, nearest-exit-from-entrance-in-maze, shortest-path-in-binary-matrix, rotting-oranges, 01-matrix, open-the-lock, word-ladder
updated: 2026-10-03
seo-title: Breadth-First Search (BFS): Shortest Paths, Grids & Code
description: Learn breadth-first search: the queue, level-by-level order, shortest paths, grid mazes and multi-source BFS, with code in C++, Java, Python and JavaScript.
question: What is breadth-first search (BFS)?
answer: Breadth-first search is a graph traversal that visits vertices in order of their distance from a start vertex: first the start, then all its neighbours, then their unvisited neighbours, and so on. It keeps the frontier in a first-in, first-out queue and marks each vertex when it is added. BFS runs in O(V + E) time and finds shortest paths in unweighted graphs.
q: Why does BFS find the shortest path?
a: BFS takes vertices out of its queue in order of distance: every vertex one edge away, then every vertex two edges away, and so on. So the first time it reaches a vertex, it has come along a route with the fewest possible edges. This only holds when every edge counts the same; with weights, use Dijkstra's algorithm.
q: Does BFS work on weighted graphs?
a: Not for shortest paths. BFS counts edges, and with weights a route with more edges can cost less, so the first route BFS finds may not be the cheapest. Use Dijkstra's algorithm for non-negative weights, or 0-1 BFS with a double-ended queue when every weight is 0 or 1.
q: Why mark a vertex visited when it is added to the queue?
a: If you mark it only when it is taken out, every neighbour that reaches it in the meantime adds it again, so the queue can grow from V entries to about 2E and duplicates get processed twice. Marking on the way in guarantees each vertex enters the queue exactly once, and it is safe because a vertex's distance is already final when it is first discovered.
q: What is multi-source BFS?
a: Multi-source BFS starts with several vertices in the queue, all at distance 0, instead of one. One pass then gives every vertex its distance to the nearest source in O(V + E). Rotting Oranges, where every rotten orange spreads at once, and 01 Matrix, the distance to the nearest zero, are solved this way.
q: What is the time complexity of BFS?
a: O(V + E) on an adjacency list: each vertex enters and leaves the queue once, and each adjacency list is read once, which is 2E entries for an undirected graph. On an adjacency matrix it is O(V²), and on an R × C grid O(R × C). The queue and the distance array take O(V) extra space.
q: What is the difference between BFS and DFS?
a: BFS explores level by level with a queue and finds shortest paths in unweighted graphs. DFS follows one path as deep as it goes with a stack or recursion, then backtracks. Both visit every vertex and edge once in O(V + E); BFS suits "fewest steps" questions, DFS suits components, cycles and ordering.
---
Drop a stone in a pond and the ripples spread out in rings: first the water touching the stone, then the water touching that, one ring at a time. **Breadth-first search** (BFS) explores a graph the same way. From a start vertex it visits everything one edge away, then everything two edges away, and so on outwards. Because it reaches vertices in order of their distance, the first time it reaches a vertex is along a shortest route, and that one property makes BFS the answer to every "fewest moves" question on an unweighted graph: the shortest way out of a maze, the fewest flights between two cities, the fewest single-letter changes from one word to another.

This lesson builds BFS from its two ingredients, a queue and a record of what has been seen, proves why it finds shortest paths, and then puts it to work on the shapes interviews use: recovering the path itself, searching a grid, and starting from many places at once. It assumes you know how a graph is stored; if not, read [Graph Data Structure](/roadmap/graphs) first. Every example is shown in C++, Java, Python and JavaScript.

## Why trying every route is too slow

The obvious way to find the shortest route from a start to a target is to list every route and keep the shortest. The trouble is how many routes there are. Even counting only simple paths, which never visit a cell twice, an open 8 × 8 grid has 789,360,053,252 paths from one corner to the opposite corner: about 7.9 × 10¹¹. A 9 × 9 grid has more than 3 × 10¹⁵. The count grows exponentially with the size of the grid, so no amount of faster hardware rescues this approach.

BFS looks at each of the 64 cells once and at each of the 112 edges between neighbouring cells from both ends: a few hundred steps in all. It gets away with that because it never asks "which route is shortest?". It asks "which cells are 1 step away? Which are 2?", and each cell's answer is settled the first time the search reaches it.

## The idea: explore in rings, with a queue

Here is the graph the walkthrough below uses, with its vertices grouped by their distance from A:

```text
 edges: A–B, A–C, B–D, C–D, C–E, D–F, E–F, F–G

 level 0:  A
 level 1:  B  C        the neighbours of A
 level 2:  D  E        new neighbours of B and C
 level 3:  F           new neighbours of D and E
 level 4:  G           the new neighbour of F
```

BFS produces exactly these levels, in this order, using three rules:

- Put the start in a **queue**, mark it seen, and give it distance 0.
- Take the vertex at the front of the queue. For each neighbour not seen yet, mark it seen, give it distance one more than the current vertex, remember the current vertex as its **parent**, and add it to the back of the queue.
- Repeat until the queue is empty.

```text
dist[start] = 0;  queue = [start]
while queue is not empty:
    u = take from the front of queue
    for each neighbour v of u:
        if v has not been seen:
            dist[v] = dist[u] + 1      # seen now, at its final distance
            parent[v] = u
            add v to the back of queue
```

The queue is what keeps the order. It is first in, first out, so every vertex at distance 1 was added before any vertex at distance 2, and every one of them comes out first. Swap the queue for a stack, which hands back the newest vertex first, and the search stops spreading in rings and dives down one path instead: that is [depth-first search](/roadmap/depth-first-search).

@walkthrough

## Why BFS finds shortest paths

Write d(v) for the true shortest distance from the start s to a vertex v, and dist[v] for the number BFS writes down. Two facts carry the proof.

**Fact 1: the queue is sorted by distance and holds at most two distances at once.** At first it holds only s, at distance 0. Suppose that at some moment its front part holds vertices at distance k and its back part vertices at distance k + 1. BFS takes a vertex at distance k from the front and adds its new neighbours, at distance k + 1, to the back, so that shape is kept. When the k's run out, the front holds k + 1's and the new arrivals are k + 2's: the same shape, one level on. So vertices leave the queue in order: every vertex labelled 0, then every vertex labelled 1, then every vertex labelled 2.

**Fact 2: every label is the true distance.** A label is the length of a real path, the chain of parents back to s, so dist[v] can never be smaller than d(v). To see that it is never larger either, prove it for distance 0, then 1, then 2, and so on. The start is labelled 0, correctly. Now take a vertex v at true distance k and a shortest path to it. The vertex u just before v on that path is at true distance k − 1, so it was labelled correctly, k − 1. When u leaves the queue, either v has not been seen, and u labels it k, or v was seen earlier, by a vertex w that left the queue before u. By fact 1, w's label is at most u's, which is k − 1, so v's label is at most k. Either way dist[v] = k.

The proof also says when BFS fails. It relies on every edge adding exactly 1 to a route's length. Give the edges weights, say a direct edge A–C of weight 5 beside A–B and B–C of weight 1 each, and BFS still reaches C first along the single heavy edge and reports the wrong cost. With weights you need [Dijkstra's algorithm](/roadmap/dijkstras-algorithm), which takes vertices in order of total weight rather than number of edges.

### Mark a vertex when you add it, not when you take it out

It is tempting to mark a vertex as visited when it leaves the queue, since that is when it is processed. Look at D in the example to see why not. D is a neighbour of both B and C. Marked on the way in, D is marked the moment B discovers it, so when C looks at D a moment later it is already seen and D enters the queue once. Marked on the way out, D is still unmarked when C looks, so C adds it a second time.

In general a vertex is added once for every neighbour that reaches it before it is processed, so the queue can swell from at most V entries to about 2E, and each copy, unless you skip it, has its whole adjacency list scanned again. On a big grid, where most cells have four neighbours, that is the difference between passing and running out of time or memory. Marking on the way in costs nothing and is safe: fact 2 says a vertex's distance is already final the first time it is discovered, so there is nothing to gain by waiting.

### Dry run

BFS from A on the example graph, with each vertex's neighbours taken in alphabetical order:

| Step | Taken from the front | Its distance | Newly seen (distance, parent) | Queue afterwards |
| --- | --- | --- | --- | --- |
| start | none | none | A (0) | A |
| 1 | A | 0 | B (1, A), C (1, A) | B C |
| 2 | B | 1 | D (2, B) | C D |
| 3 | C | 1 | E (2, C); D was already seen | D E |
| 4 | D | 2 | F (3, D) | E F |
| 5 | E | 2 | none; C and F were already seen | F |
| 6 | F | 3 | G (4, F) | G |
| 7 | G | 4 | none | empty |

Fact 1 is visible in the last column: the queue never holds more than two distances, and the smaller one is always at the front. Step 3 is where marking on the way in pays off, because D is not added twice.

### Recovering the path

Distances answer "how far?". To answer "which way?", BFS records the parent each vertex was discovered from. Each parent is one step closer to the start than its child, so the parent links form a tree of shortest paths, the **BFS tree**. To recover a shortest path to G, follow the links back: G's parent is F, F's is D, D's is B and B's is A. That is the path backwards; reversed, it is A → B → D → F → G, 4 edges, matching dist[G]. A shortest path is rarely unique (A → C → E → F → G is just as short), and BFS returns the one its neighbour order finds first.

### The code

The program runs BFS from A on this graph plus an eighth vertex, H, with no edges at all, to show what "unreachable" looks like: its distance stays at −1, the value that also means "not seen yet". Each language needs a real queue. C++ has `std::queue` and Java `ArrayDeque`. Python's `collections.deque` removes from the front in O(1), whereas `list.pop(0)` shifts every remaining element and costs O(n). JavaScript has no queue class and its `shift()` can also cost O(n), so the program keeps a `head` index into an array instead.

```cpp
#include <algorithm>
#include <iostream>
#include <queue>
#include <string>
#include <vector>
using namespace std;

const string NAMES = "ABCDEFGH";

// Breadth-first search from start: each vertex's distance in edges (-1 if
// unreachable), the vertex it was discovered from, and the visiting order.
void bfs(const vector<vector<int>>& adj, int start, vector<int>& dist, vector<int>& parent, vector<int>& order) {
    dist.assign(adj.size(), -1);
    parent.assign(adj.size(), -1);
    queue<int> q;
    dist[start] = 0;
    q.push(start);
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        order.push_back(u);
        for (int v : adj[u]) {
            if (dist[v] == -1) {
                dist[v] = dist[u] + 1;  // mark on enqueue: v joins the queue once
                parent[v] = u;
                q.push(v);
            }
        }
    }
}

// Walks the parent links back from target, then reverses them.
vector<int> pathTo(const vector<int>& parent, int target) {
    vector<int> path;
    for (int v = target; v != -1; v = parent[v]) path.push_back(v);
    reverse(path.begin(), path.end());
    return path;
}

int main() {
    // A-B, A-C, B-D, C-D, C-E, D-F, E-F, F-G; H has no edges at all.
    int n = 8;
    vector<vector<int>> edges = {{0, 1}, {0, 2}, {1, 3}, {2, 3}, {2, 4}, {3, 5}, {4, 5}, {5, 6}};
    vector<vector<int>> adj(n);
    for (const vector<int>& e : edges) {
        adj[e[0]].push_back(e[1]);
        adj[e[1]].push_back(e[0]);
    }

    vector<int> dist, parent, order;
    bfs(adj, 0, dist, parent, order);
    cout << "Visit order:";
    for (int v : order) cout << " " << NAMES[v];
    cout << "\nDistances from A:";
    for (int v = 0; v < n; v++) cout << " " << NAMES[v] << "=" << dist[v];
    cout << "\n";
    for (int target : {6, 7}) {
        if (dist[target] == -1) {
            cout << "No path from A to " << NAMES[target] << "\n";
        } else {
            vector<int> path = pathTo(parent, target);
            cout << "Shortest path A to " << NAMES[target] << ":";
            for (size_t i = 0; i < path.size(); i++) cout << (i > 0 ? " -> " : " ") << NAMES[path[i]];
            cout << " (" << dist[target] << " edges)\n";
        }
    }
    return 0;
}
```

```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class Main {
    static final String NAMES = "ABCDEFGH";
    static int[] dist, parent;
    static List<Integer> order = new ArrayList<>();

    // Breadth-first search from start: each vertex's distance in edges (-1 if
    // unreachable), the vertex it was discovered from, and the visiting order.
    static void bfs(List<List<Integer>> adj, int start) {
        dist = new int[adj.size()];
        parent = new int[adj.size()];
        Arrays.fill(dist, -1);
        Arrays.fill(parent, -1);
        ArrayDeque<Integer> queue = new ArrayDeque<>();
        dist[start] = 0;
        queue.add(start);
        while (!queue.isEmpty()) {
            int u = queue.poll();
            order.add(u);
            for (int v : adj.get(u)) {
                if (dist[v] == -1) {
                    dist[v] = dist[u] + 1; // mark on enqueue: v joins the queue once
                    parent[v] = u;
                    queue.add(v);
                }
            }
        }
    }

    // Walks the parent links back from target, then reverses them.
    static List<Integer> pathTo(int target) {
        List<Integer> path = new ArrayList<>();
        for (int v = target; v != -1; v = parent[v]) path.add(v);
        Collections.reverse(path);
        return path;
    }

    public static void main(String[] args) {
        // A-B, A-C, B-D, C-D, C-E, D-F, E-F, F-G; H has no edges at all.
        int n = 8;
        int[][] edges = {{0, 1}, {0, 2}, {1, 3}, {2, 3}, {2, 4}, {3, 5}, {4, 5}, {5, 6}};
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) {
            adj.get(e[0]).add(e[1]);
            adj.get(e[1]).add(e[0]);
        }

        bfs(adj, 0);
        StringBuilder line = new StringBuilder("Visit order:");
        for (int v : order) line.append(" ").append(NAMES.charAt(v));
        System.out.println(line);
        line = new StringBuilder("Distances from A:");
        for (int v = 0; v < n; v++) line.append(" ").append(NAMES.charAt(v)).append("=").append(dist[v]);
        System.out.println(line);
        for (int target : new int[] {6, 7}) {
            if (dist[target] == -1) {
                System.out.println("No path from A to " + NAMES.charAt(target));
            } else {
                List<Integer> path = pathTo(target);
                line = new StringBuilder("Shortest path A to " + NAMES.charAt(target) + ":");
                for (int i = 0; i < path.size(); i++) line.append(i > 0 ? " -> " : " ").append(NAMES.charAt(path.get(i)));
                System.out.println(line + " (" + dist[target] + " edges)");
            }
        }
    }
}
```

```python
from collections import deque

NAMES = "ABCDEFGH"


def bfs(adj, start):
    """Breadth-first search from start: each vertex's distance in edges (-1 if
    unreachable), the vertex it was discovered from, and the visiting order."""
    dist = [-1] * len(adj)
    parent = [-1] * len(adj)
    order = []
    queue = deque([start])
    dist[start] = 0
    while queue:
        u = queue.popleft()  # O(1), unlike list.pop(0)
        order.append(u)
        for v in adj[u]:
            if dist[v] == -1:
                dist[v] = dist[u] + 1  # mark on enqueue: v joins the queue once
                parent[v] = u
                queue.append(v)
    return dist, parent, order


def path_to(parent, target):
    """Walk the parent links back from target, then reverse them."""
    path = []
    v = target
    while v != -1:
        path.append(v)
        v = parent[v]
    return path[::-1]


# A-B, A-C, B-D, C-D, C-E, D-F, E-F, F-G; H has no edges at all.
n = 8
edges = [(0, 1), (0, 2), (1, 3), (2, 3), (2, 4), (3, 5), (4, 5), (5, 6)]
adj = [[] for _ in range(n)]
for u, v in edges:
    adj[u].append(v)
    adj[v].append(u)

dist, parent, order = bfs(adj, 0)
print("Visit order:", " ".join(NAMES[v] for v in order))
print("Distances from A:", " ".join(f"{NAMES[v]}={dist[v]}" for v in range(n)))
for target in (6, 7):
    if dist[target] == -1:
        print(f"No path from A to {NAMES[target]}")
    else:
        route = " -> ".join(NAMES[v] for v in path_to(parent, target))
        print(f"Shortest path A to {NAMES[target]}: {route} ({dist[target]} edges)")
```

```javascript
const NAMES = "ABCDEFGH";

// Breadth-first search from start: each vertex's distance in edges (-1 if
// unreachable), the vertex it was discovered from, and the visiting order.
function bfs(adj, start) {
  const dist = new Array(adj.length).fill(-1);
  const parent = new Array(adj.length).fill(-1);
  const order = [];
  const queue = [start];
  let head = 0; // queue[head] is the front; shift() can cost O(n) per call
  dist[start] = 0;
  while (head < queue.length) {
    const u = queue[head++];
    order.push(u);
    for (const v of adj[u]) {
      if (dist[v] === -1) {
        dist[v] = dist[u] + 1; // mark on enqueue: v joins the queue once
        parent[v] = u;
        queue.push(v);
      }
    }
  }
  return { dist, parent, order };
}

// Walks the parent links back from target, then reverses them.
function pathTo(parent, target) {
  const path = [];
  for (let v = target; v !== -1; v = parent[v]) path.push(v);
  return path.reverse();
}

// A-B, A-C, B-D, C-D, C-E, D-F, E-F, F-G; H has no edges at all.
const n = 8;
const edges = [[0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [3, 5], [4, 5], [5, 6]];
const adj = Array.from({ length: n }, () => []);
for (const [u, v] of edges) {
  adj[u].push(v);
  adj[v].push(u);
}

const { dist, parent, order } = bfs(adj, 0);
console.log(`Visit order: ${order.map((v) => NAMES[v]).join(" ")}`);
console.log(`Distances from A: ${dist.map((d, v) => `${NAMES[v]}=${d}`).join(" ")}`);
for (const target of [6, 7]) {
  if (dist[target] === -1) {
    console.log(`No path from A to ${NAMES[target]}`);
  } else {
    const route = pathTo(parent, target).map((v) => NAMES[v]).join(" -> ");
    console.log(`Shortest path A to ${NAMES[target]}: ${route} (${dist[target]} edges)`);
  }
}
```

```output
Visit order: A B C D E F G
Distances from A: A=0 B=1 C=1 D=2 E=2 F=3 G=4 H=-1
Shortest path A to G: A -> B -> D -> F -> G (4 edges)
No path from A to H
```

The visit order is exactly the levels from the diagram, read left to right, and H never enters the queue because no edge leads to it. Running BFS once from A answers "how far is every vertex from A?" in one O(V + E) pass, so when a problem asks many questions about the same start, run it once and read the answers off `dist`.

## BFS on a grid: the shortest way through a maze

A grid is a graph whose edges you never store: each open cell is a vertex, joined to the open cells above, below, left and right of it. BFS on a grid is the same loop, with a cell (r, c) in place of a vertex and four direction offsets in place of the adjacency list. A 2D `dist` array does double duty, as before: −1 means not seen yet, anything else is the distance from the start.

The maze below has two routes from S to the exit E. The one along the top row takes 15 steps; the lower one takes 13. BFS reaches E along the lower one, because it reaches every cell 13 steps away before any cell 14 steps away. The program prints the length and draws the route with stars, found by following parent links back from E. Each parent is stored as one number, r × cols + c, so the four programs stay alike. The search stops as soon as E leaves the queue, since by then its distance is final and the rest of the maze cannot change it.

```cpp
#include <iostream>
#include <queue>
#include <string>
#include <utility>
#include <vector>
using namespace std;

const int DR[4] = {-1, 1, 0, 0};  // up, down, left, right
const int DC[4] = {0, 0, -1, 1};

int main() {
    vector<string> maze = {
        "S.#.....",
        ".##.###.",
        "....#...",
        ".##...#.",
        "...#.#.E",
    };
    int rows = maze.size(), cols = maze[0].size();
    int sr = 0, sc = 0, er = 0, ec = 0;
    for (int r = 0; r < rows; r++)
        for (int c = 0; c < cols; c++) {
            if (maze[r][c] == 'S') sr = r, sc = c;
            if (maze[r][c] == 'E') er = r, ec = c;
        }

    vector<vector<int>> dist(rows, vector<int>(cols, -1));    // -1: not seen yet
    vector<vector<int>> parent(rows, vector<int>(cols, -1));  // previous cell as r * cols + c
    queue<pair<int, int>> q;
    dist[sr][sc] = 0;
    q.push({sr, sc});
    while (!q.empty()) {
        int r = q.front().first, c = q.front().second;
        q.pop();
        if (r == er && c == ec) break;  // the exit's distance is final: stop here
        for (int d = 0; d < 4; d++) {
            int nr = r + DR[d], nc = c + DC[d];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;  // bounds first
            if (maze[nr][nc] == '#' || dist[nr][nc] != -1) continue;     // a wall, or seen
            dist[nr][nc] = dist[r][c] + 1;
            parent[nr][nc] = r * cols + c;
            q.push({nr, nc});
        }
    }

    if (dist[er][ec] == -1) {
        cout << "No way out\n";
        return 0;
    }
    cout << "Shortest path: " << dist[er][ec] << " steps\n";
    for (int at = parent[er][ec]; at != sr * cols + sc; at = parent[at / cols][at % cols])
        maze[at / cols][at % cols] = '*';  // walk back from the exit, marking the route
    for (const string& row : maze) cout << row << "\n";
    return 0;
}
```

```java
import java.util.ArrayDeque;
import java.util.Arrays;

public class Main {
    static final int[] DR = {-1, 1, 0, 0}; // up, down, left, right
    static final int[] DC = {0, 0, -1, 1};

    public static void main(String[] args) {
        String[] lines = {
            "S.#.....",
            ".##.###.",
            "....#...",
            ".##...#.",
            "...#.#.E",
        };
        int rows = lines.length, cols = lines[0].length();
        char[][] maze = new char[rows][];
        int sr = 0, sc = 0, er = 0, ec = 0;
        for (int r = 0; r < rows; r++) {
            maze[r] = lines[r].toCharArray();
            for (int c = 0; c < cols; c++) {
                if (maze[r][c] == 'S') { sr = r; sc = c; }
                if (maze[r][c] == 'E') { er = r; ec = c; }
            }
        }

        int[][] dist = new int[rows][cols];   // -1: not seen yet
        int[][] parent = new int[rows][cols]; // previous cell as r * cols + c
        for (int[] row : dist) Arrays.fill(row, -1);
        ArrayDeque<int[]> queue = new ArrayDeque<>();
        dist[sr][sc] = 0;
        queue.add(new int[] {sr, sc});
        while (!queue.isEmpty()) {
            int[] cell = queue.poll();
            int r = cell[0], c = cell[1];
            if (r == er && c == ec) break; // the exit's distance is final: stop here
            for (int d = 0; d < 4; d++) {
                int nr = r + DR[d], nc = c + DC[d];
                if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue; // bounds first
                if (maze[nr][nc] == '#' || dist[nr][nc] != -1) continue;    // a wall, or seen
                dist[nr][nc] = dist[r][c] + 1;
                parent[nr][nc] = r * cols + c;
                queue.add(new int[] {nr, nc});
            }
        }

        if (dist[er][ec] == -1) {
            System.out.println("No way out");
            return;
        }
        System.out.println("Shortest path: " + dist[er][ec] + " steps");
        for (int at = parent[er][ec]; at != sr * cols + sc; at = parent[at / cols][at % cols])
            maze[at / cols][at % cols] = '*'; // walk back from the exit, marking the route
        for (char[] row : maze) System.out.println(new String(row));
    }
}
```

```python
from collections import deque

DR = [-1, 1, 0, 0]  # up, down, left, right
DC = [0, 0, -1, 1]

maze = [list(row) for row in [
    "S.#.....",
    ".##.###.",
    "....#...",
    ".##...#.",
    "...#.#.E",
]]
rows, cols = len(maze), len(maze[0])
for r in range(rows):
    for c in range(cols):
        if maze[r][c] == "S":
            sr, sc = r, c
        if maze[r][c] == "E":
            er, ec = r, c

dist = [[-1] * cols for _ in range(rows)]    # -1: not seen yet
parent = [[-1] * cols for _ in range(rows)]  # previous cell as r * cols + c
queue = deque([(sr, sc)])
dist[sr][sc] = 0
while queue:
    r, c = queue.popleft()
    if r == er and c == ec:
        break  # the exit's distance is final: stop here
    for d in range(4):
        nr, nc = r + DR[d], c + DC[d]
        if nr < 0 or nr >= rows or nc < 0 or nc >= cols:
            continue  # bounds first
        if maze[nr][nc] == "#" or dist[nr][nc] != -1:
            continue  # a wall, or seen
        dist[nr][nc] = dist[r][c] + 1
        parent[nr][nc] = r * cols + c
        queue.append((nr, nc))

if dist[er][ec] == -1:
    print("No way out")
else:
    print(f"Shortest path: {dist[er][ec]} steps")
    at = parent[er][ec]
    while at != sr * cols + sc:  # walk back from the exit, marking the route
        r, c = divmod(at, cols)
        maze[r][c] = "*"
        at = parent[r][c]
    for row in maze:
        print("".join(row))
```

```javascript
const DR = [-1, 1, 0, 0]; // up, down, left, right
const DC = [0, 0, -1, 1];

const maze = [
  "S.#.....",
  ".##.###.",
  "....#...",
  ".##...#.",
  "...#.#.E",
].map((row) => row.split(""));
const rows = maze.length;
const cols = maze[0].length;
let sr = 0, sc = 0, er = 0, ec = 0;
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    if (maze[r][c] === "S") [sr, sc] = [r, c];
    if (maze[r][c] === "E") [er, ec] = [r, c];
  }
}

const dist = Array.from({ length: rows }, () => new Array(cols).fill(-1)); // -1: not seen yet
const parent = Array.from({ length: rows }, () => new Array(cols).fill(-1)); // previous cell as r * cols + c
const queue = [[sr, sc]];
let head = 0;
dist[sr][sc] = 0;
while (head < queue.length) {
  const [r, c] = queue[head++];
  if (r === er && c === ec) break; // the exit's distance is final: stop here
  for (let d = 0; d < 4; d++) {
    const nr = r + DR[d];
    const nc = c + DC[d];
    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue; // bounds first
    if (maze[nr][nc] === "#" || dist[nr][nc] !== -1) continue; // a wall, or seen
    dist[nr][nc] = dist[r][c] + 1;
    parent[nr][nc] = r * cols + c;
    queue.push([nr, nc]);
  }
}

if (dist[er][ec] === -1) {
  console.log("No way out");
} else {
  console.log(`Shortest path: ${dist[er][ec]} steps`);
  for (let at = parent[er][ec]; at !== sr * cols + sc; at = parent[Math.floor(at / cols)][at % cols]) {
    maze[Math.floor(at / cols)][at % cols] = "*"; // walk back from the exit, marking the route
  }
  for (const row of maze) console.log(row.join(""));
}
```

```output
Shortest path: 13 steps
S.#.....
*##.###.
****#***
.##***#*
...#.#.E
```

Two details in the loop deserve a second look. The bounds check comes before the maze is read, because `maze[-1][c]` is undefined behaviour in C++, an exception in Java and JavaScript, and quietly a cell of the last row in Python. And walls and seen cells are rejected in the same test, before anything is marked, so a wall never enters the queue. [Nearest Exit from Entrance in Maze](/problems/nearest-exit-from-entrance-in-maze) is this program with "any open border cell" as the exit.

## Multi-source BFS: many starts at once

Some problems spread from several places at once. In [Rotting Oranges](/problems/rotting-oranges) every rotten orange makes its fresh neighbours rot each minute, and the question is when the last fresh orange rots. Running a separate BFS from each of k rotten oranges and keeping the minimum for every cell would cost O(k × R × C). Instead, put **all** the sources in the queue at distance 0 before the loop starts. The queue is then in order of distance from the *nearest* source, and one BFS answers the question in O(R × C).

Why that is correct: imagine one extra vertex joined by an edge to every source. A single BFS from that extra vertex would give every source distance 1 and every other cell 1 plus its distance to the nearest source. Starting with all the sources already in the queue is that same search with its first step skipped.

Here is the problem's example, 2 for rotten, 1 for fresh and 0 for empty, minute by minute. Each minute is one level of the BFS:

```text
 minute 0    minute 1    minute 2    minute 3    minute 4
  2 1 1       2 2 1       2 2 2       2 2 2       2 2 2
  1 1 0       2 1 0       2 2 0       2 2 0       2 2 0
  0 1 1       0 1 1       0 1 1       0 2 1       0 2 2
```

The answer is 4. To count minutes rather than cells, process the queue one level at a time, taking exactly as many cells as it held when the minute began:

```text
minutes = 0
while queue is not empty and fresh > 0:
    repeat size(queue) times:           # exactly one level
        take a cell from the front
        for each fresh neighbour: make it rotten, add it to the back, fresh -= 1
    minutes += 1
return minutes if fresh == 0 else -1
```

Counting the fresh oranges first is what catches the unreachable case: a fresh orange walled off by empty cells never rots, so `fresh` is still above zero when the queue runs dry and the answer is −1. [01 Matrix](/problems/01-matrix), which asks for every cell's distance to the nearest 0, is the same idea with every 0 as a source.

## Other shapes of BFS

- **State graphs.** [Open the Lock](/problems/open-the-lock) and [Word Ladder](/problems/word-ladder) are BFS over configurations whose neighbours you generate as you go: the eight codes one wheel-turn away, or the words one letter away. Seen states go in a hash set, since there is no grid to index.
- **Level-order traversal.** BFS on a [binary tree](/roadmap/binary-tree) visits it level by level. It needs no seen set, because each node of a tree is reached from exactly one parent.
- **Bipartite check.** Give the start one colour and each newly seen vertex the opposite colour of its parent. An edge between two vertices of the same colour means an odd cycle, so the graph cannot be split into two sides: [Is Graph Bipartite?](/problems/is-graph-bipartite).
- **0-1 BFS.** When every edge weighs 0 or 1, use a double-ended queue: a neighbour reached by a 0 edge goes to the front, one reached by a 1 edge to the back, and a vertex is updated whenever a shorter distance turns up. The deque stays sorted by distance, as fact 1 needs. [Minimum Obstacle Removal to Reach Corner](/problems/minimum-obstacle-removal-to-reach-corner) is the classic case.
- **Topological order.** Kahn's algorithm is a BFS that lets a vertex into the queue only once everything it depends on is done: see [topological sort](/roadmap/topological-sort).
- **Bidirectional BFS.** Search from the start and the target at once and stop when the two frontiers meet. Two searches of half the depth explore far fewer states than one search of the full depth when each state has many neighbours, which is why it speeds up Word Ladder.

## Time and space complexity

| Approach | Time | Extra space |
| --- | --- | --- |
| List every route, keep the shortest | exponential | O(V) for the current route |
| BFS on an adjacency list | O(V + E) | O(V) |
| BFS on an adjacency matrix | O(V²) | O(V) |
| BFS on an R × C grid | O(R × C) | O(R × C) |
| Multi-source BFS, any number of sources | O(V + E) | O(V) |
| Dijkstra's algorithm, for weighted edges | O((V + E) log V) | O(V + E) |

Each vertex enters the queue once, because it is marked on the way in, and leaves once; when it leaves, its adjacency list is read once. So the work is V queue operations plus the total length of all the lists, which is 2E for an undirected graph and E for a directed one: O(V + E). The queue and the distance array hold at most V entries each. On a matrix, reading a vertex's neighbours means reading its whole row, which is where O(V²) comes from.

## How to recognise a BFS problem

Read the statement for these signals:

- **"Minimum number of steps, moves, operations or changes"**, "shortest path" or "nearest", where every move costs the same.
- A **grid** with moves in four or eight directions and a question about distance.
- Something that **spreads at the same time** from several places, minute by minute or round by round: rot, fire, infection, a signal. That is multi-source BFS.
- **"Level by level"**, "layer", "the nodes at distance k".
- **Configurations and moves** between them, with the question asking for the fewest moves. That is BFS over a state graph.

If the moves have different costs, the problem is weighted and wants Dijkstra's algorithm. If the question is only whether something can be reached, or it is about the structure of the graph (cycles, components, an order), depth-first search does the job just as well and is often shorter to write.

## Common mistakes

- **Marking on the way out.** Mark a vertex when you add it to the queue, or it can be added many times and processed many times.
- **A slow queue.** `list.pop(0)` in Python and `shift()` in JavaScript can cost O(n) per call, which turns O(V + E) into O(V²) on a large input. Use `collections.deque` or a head index.
- **Reading the grid before checking bounds.** Check `0 <= nr < rows` and `0 <= nc < cols` first, then look at the cell.
- **BFS on a weighted graph.** It returns the route with the fewest edges, which is not the cheapest one once edges have different weights.
- **Forgetting the start.** Mark the start before the loop, or its neighbours add it back. Handle a start that is already the target (distance 0) and a target that is never reached (return −1) on purpose rather than by accident.
- **Off-by-one levels.** In multi-source problems, count a level only when it changes something, and check for anything left unreached at the end.

## Practice in this order

1. [Flood Fill](/problems/flood-fill): BFS on a grid, plus the trap when the new colour equals the old one.
2. [Find if Path Exists in Graph](/problems/find-if-path-exists-in-graph): the plain BFS loop on an adjacency list.
3. [Keys and Rooms](/problems/keys-and-rooms): reachability on a directed graph the input gives as lists.
4. [Nearest Exit from Entrance in Maze](/problems/nearest-exit-from-entrance-in-maze): the maze program above, with exits on the border.
5. [Shortest Path in Binary Matrix](/problems/shortest-path-in-binary-matrix): grid BFS with eight directions.
6. [Rotting Oranges](/problems/rotting-oranges): multi-source BFS counted in levels.
7. [01 Matrix](/problems/01-matrix): multi-source BFS from every zero.
8. [Open the Lock](/problems/open-the-lock): BFS over a state graph with forbidden states.
9. [Word Ladder](/problems/word-ladder): a state graph whose edges you have to generate efficiently.

The [breadth-first search problem list](/challenges/breadth-first-search) has every BFS problem in the catalogue, from easy to hard. Next comes the other way to walk a graph, which goes deep before it goes wide: [depth-first search](/roadmap/depth-first-search).
