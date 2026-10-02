---
title: Breadth-First Search (BFS)
stage: graphs
order: 2
minutes: 12
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
Drop a stone in a pond and the ripples spread out in rings. **Breadth-first search** (BFS) explores a graph the same way: from a start vertex it visits everything one edge away, then everything two edges away, and so on outwards. Because it reaches vertices in order of distance, the first route it finds to a vertex is a shortest one. That makes BFS the answer to every "fewest moves" question on an unweighted graph: the shortest way out of a maze, the fewest flights, the fewest single-letter changes from one word to another.

@figure rings

This lesson assumes you know how a graph is stored; if not, read [Graph Data Structure](/roadmap/graphs) first.

## Why trying every route is too slow

Listing every route and keeping the shortest fails because routes multiply: an open 8 × 8 grid has about 7.9 × 10¹¹ simple paths between opposite corners. BFS needs a few hundred steps: each of the 64 cells once, each of the 112 edges from both ends. It never asks "which route is shortest?", only "which cells are 1 step away? Which are 2?", and it settles each cell the first time it reaches it.

## The idea: a queue and a seen mark

- Put the start in a first-in, first-out **queue**, mark it seen and give it distance 0.
- Take the vertex at the front. Give each neighbour not seen yet a mark, a distance one more than the current vertex, and a **parent** (the current vertex), and add it to the back.
- Repeat until the queue is empty.

The queue keeps the rings in order: every vertex at distance 1 joins it before any vertex at distance 2. Swap it for a stack, which hands back the newest vertex first, and the search dives down one path instead: that is [depth-first search](/roadmap/depth-first-search).

@walkthrough

## Why BFS finds shortest paths

Two facts carry the proof. The queue is always sorted by distance and holds at most two distances at once, k at the front and k + 1 at the back, because taking a k only ever adds k + 1's. And no edge skips a ring, as the first figure showed: when the nearer end of an edge leaves the queue, the farther end is either seen already or labelled one more. So a vertex at true distance k is first reached from one at distance k − 1, and its label is exactly k.

The proof leans on every edge adding exactly 1 to a route's length. Give the edges weights and it breaks:

@figure weighted-trap

With weights you need [Dijkstra's algorithm](/roadmap/dijkstras-algorithm), which takes vertices in order of total weight rather than number of edges.

### Mark a vertex when you add it

It is tempting to mark a vertex when it leaves the queue, since that is when it is processed. The animation runs both versions side by side.

@figure mark-on-add

Marking on the way in costs nothing and is safe, because a vertex's distance is already final the first time it is discovered.

### Recovering the path

Distances answer "how far?". To answer "which way?", follow the parent links back from the target and reverse what you collect.

@figure path-back

### The code

The graph gains an eighth vertex, H, with no edges: its distance stays −1, the value that also means "not seen". Python's `collections.deque` takes from the front in O(1), unlike `list.pop(0)`; JavaScript's `shift()` can cost O(n) too, so that program keeps a `head` index instead.

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

## BFS on a grid: the shortest way through a maze

On a grid the loop is the same, with a cell (r, c) in place of a vertex and four direction offsets in place of the adjacency list. A 2D `dist` array does double duty: −1 means not seen, anything else is the distance.

@figure maze

The program prints the length and draws the route with stars. Each parent is stored as one number, r × cols + c, and the search stops as soon as E leaves the queue, since its distance is final by then. The bounds check comes before the maze is read, because `maze[-1][c]` is undefined behaviour in C++, an exception in Java and JavaScript, and a silent read of the last row in Python.

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

[Nearest Exit from Entrance in Maze](/problems/nearest-exit-from-entrance-in-maze) is this program with "any open border cell" as the exit.

## Multi-source BFS: many starts at once

In [Rotting Oranges](/problems/rotting-oranges) every rotten orange rots its fresh neighbours each minute. A separate BFS from each of k sources would cost O(k × R × C). Instead, put **all** the sources in the queue at distance 0 before the loop starts: the queue is then in order of distance from the *nearest* source, and one pass costs O(R × C). It is one BFS from an imaginary vertex joined to every source, with its first step skipped.

@figure rotting

To count minutes rather than cells, take exactly as many cells as the queue held when the minute began. Count the fresh oranges first, so that one nobody can reach shows up as −1. [01 Matrix](/problems/01-matrix) is the same idea with every 0 as a source.

## Other shapes of BFS

- **State graphs.** [Open the Lock](/problems/open-the-lock) and [Word Ladder](/problems/word-ladder) generate each configuration's neighbours as they go and keep seen states in a hash set.
- **Level-order traversal** of a [binary tree](/roadmap/binary-tree), with no seen set, since each node has one parent.
- **Bipartite check.** Colour each new vertex opposite to its parent; an edge between two of the same colour means no split exists: [Is Graph Bipartite?](/problems/is-graph-bipartite).
- **0-1 BFS.** When edges weigh 0 or 1, a double-ended queue puts 0-edges at the front and 1-edges at the back: [Minimum Obstacle Removal to Reach Corner](/problems/minimum-obstacle-removal-to-reach-corner).

## Time and space complexity

| Approach | Time | Extra space |
| --- | --- | --- |
| List every route, keep the shortest | exponential | O(V) |
| BFS on an adjacency list | O(V + E) | O(V) |
| BFS on an adjacency matrix | O(V²) | O(V) |
| BFS on an R × C grid | O(R × C) | O(R × C) |
| Dijkstra's algorithm, for weighted edges | O((V + E) log V) | O(V + E) |

Each vertex enters the queue once, because it is marked on the way in, and its adjacency list is read once when it leaves: O(V + E).

## How to recognise a BFS problem

- **"Minimum number of steps, moves or changes"**, "shortest path" or "nearest", with every move costing the same.
- A **grid** with moves in four or eight directions and a question about distance.
- Something that **spreads at the same time** from several places: multi-source BFS.
- **Configurations and moves** between them: BFS over a state graph.

If moves have different costs, use Dijkstra's algorithm. If the question is only whether something can be reached, depth-first search does as well.

## Common mistakes

- **Marking on the way out.** A vertex can then be added, and processed, many times.
- **A slow queue.** `list.pop(0)` and `shift()` can cost O(n) per call.
- **Reading the grid before checking bounds.**
- **BFS on a weighted graph.** It returns the fewest edges, not the cheapest route.
- **Forgetting the start.** Mark it before the loop, and handle a start that is the target and a target never reached.

## Practice in this order

1. [Flood Fill](/problems/flood-fill): BFS on a grid, and the trap when the new colour equals the old.
2. [Find if Path Exists in Graph](/problems/find-if-path-exists-in-graph): the plain loop on an adjacency list.
3. [Keys and Rooms](/problems/keys-and-rooms): reachability on a directed graph given as lists.
4. [Nearest Exit from Entrance in Maze](/problems/nearest-exit-from-entrance-in-maze): the maze program, exits on the border.
5. [Shortest Path in Binary Matrix](/problems/shortest-path-in-binary-matrix): grid BFS with eight directions.
6. [Rotting Oranges](/problems/rotting-oranges): multi-source BFS counted in levels.
7. [01 Matrix](/problems/01-matrix): multi-source BFS from every zero.
8. [Open the Lock](/problems/open-the-lock): a state graph with forbidden states.
9. [Word Ladder](/problems/word-ladder): a state graph whose edges you generate efficiently.

The [breadth-first search problem list](/challenges/breadth-first-search) has every BFS problem in the catalogue, easiest first. Next comes the other way to walk a graph, deep before wide: [depth-first search](/roadmap/depth-first-search).
