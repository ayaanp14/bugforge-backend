---
title: Depth-First Search (DFS)
stage: graphs
order: 3
minutes: 12
level: Beginner
hub: depth-first-search
practice: flood-fill, number-of-islands, max-area-of-island, number-of-provinces, number-of-enclaves, surrounded-regions, pacific-atlantic-water-flow, graph-valid-tree, course-schedule
updated: 2026-10-03
seo-title: Depth-First Search (DFS): Islands, Cycles and Code
description: Learn depth-first search: recursive and stack-based DFS, islands, connected components and cycle detection, with code in C++, Java, Python and JavaScript.
question: What is depth-first search (DFS)?
answer: Depth-first search is a graph traversal that follows one path as far as it can go, then backtracks to the most recent vertex with an unvisited neighbour and carries on from there. It is written with recursion or an explicit stack, marks each vertex visited so it is processed once, and runs in O(V + E) time. It powers island counting, connected components, cycle detection and topological sort.
q: Should I write DFS recursively or with a stack?
a: Recursion is shorter and gives you the moment each vertex is entered and left, which cycle detection and topological sort need. But every pending call takes stack space, and a path of tens of thousands of vertices can overflow the call stack; Python stops at 1,000 frames by default. An explicit stack has no such limit.
q: Does DFS find the shortest path?
a: No. DFS returns the first path it happens to follow, which depends on the order of the neighbours and can be much longer than the shortest one. For the fewest edges in an unweighted graph use breadth-first search; with non-negative weights use Dijkstra's algorithm.
q: How do you detect a cycle with DFS?
a: In an undirected graph, a cycle exists when DFS meets a visited neighbour that is not the vertex it came from. In a directed graph, colour vertices white (unvisited), grey (on the current path) and black (finished); an edge to a grey vertex is a back edge and closes a cycle, while an edge to a black vertex never does.
q: What is the time complexity of DFS?
a: O(V + E) on an adjacency list: each vertex is entered once and each adjacency list is read once. On an adjacency matrix it is O(V²), and on an R × C grid O(R × C). Extra space is O(V) for the visited marks plus the stack, which can be as deep as the number of vertices.
q: When should I use DFS instead of BFS?
a: Use DFS to explore everything reachable, such as islands, components and flood fill, or when you need the structure of the search: cycles, the order vertices finish in, or every path. Use BFS when the question asks for the fewest steps. For plain reachability either is correct.
---
Explore a maze with a stick of chalk and one rule: keep walking into corridors you have not chalked yet, and at a dead end walk back to the last junction with an unchalked corridor. You will see every room you can reach, each once. That is **depth-first search** (DFS): follow one path as deep as it goes, then backtrack and try the next. Where [breadth-first search](/roadmap/breadth-first-search) spreads out in rings, DFS dives.

@figure dive-vs-ripple

DFS is behind counting islands, connected components, cycle detection and ordering tasks. It is the recursion of [backtracking](/roadmap/backtracking) with one change: a vertex, once visited, stays visited. It assumes you know how a [graph](/roadmap/graphs) is stored.

## Why a traversal must remember where it has been

A walk that just keeps moving to neighbours never ends on a graph with a cycle. Marking only the *current* path, and unmarking on the way back, does finish, but it explores every simple path rather than every vertex: about 2.4 × 10¹¹ of them from one start in a graph of 15 vertices all joined to each other. DFS never unmarks, so each vertex is entered once and each edge looked at from both ends: a few hundred steps.

## The idea: go deep, then backtrack

- When you arrive at a vertex, mark it visited.
- Take its neighbours one at a time. For each one not visited yet, go there at once and finish that whole branch before looking at the next.
- When no unvisited neighbour is left, return to the vertex you came from: the **backtrack**.

Recursion does the bookkeeping: the call stack always holds the path from the start to the vertex being explored.

@walkthrough

## Why it works

No vertex is visited twice, because dfs(v) is called only when v is unvisited and its first act is to mark it. And every reachable vertex is visited. Suppose one were missed: on a path from the start to it, take the first unvisited vertex x and the vertex w before it. dfs(w) ran and looped over every neighbour of w, so it would have called dfs(x), a contradiction. Each call reads one adjacency list once: O(V + E) in all, the same as BFS.

### Recursion or an explicit stack

The same search works with a stack you manage yourself, which is what you need when recursion would go too deep. Pushing the neighbours in reverse order makes the first one come off first, so the order matches the recursive one.

@figure explicit-stack

Marking on push instead, as BFS does, still reaches everything, which is fine for counting islands, but the order stops being truly depth-first, and cycle detection depends on it.

## Connected components and islands

One DFS visits exactly one connected component. Loop over every vertex and start a new search from each one still unvisited: each start is a new component, and since marks are never cleared the loop is still O(V + E), as in [Number of Provinces](/problems/number-of-provinces). On a grid, each search from unvisited land sweeps up one island; the marks can live in the grid itself, by **sinking** each cell as you visit it.

@figure islands

Check that the cell is inside the grid and is land *before* touching it, and sink it *before* the recursive calls; sink it afterwards and two neighbours call each other until the stack overflows.

```cpp
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

const int DR[4] = {-1, 1, 0, 0};  // up, down, left, right
const int DC[4] = {0, 0, -1, 1};
vector<string> grid = {"11000", "11011", "00001", "01000", "11101"};
int rows = grid.size(), cols = grid[0].size();

// Sinks the island that contains (r, c) and returns how many cells it had.
int sink(int r, int c) {
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] != '1') return 0;  // off the grid, water, or sunk
    grid[r][c] = '0';  // mark before going deeper, or the neighbours would call back here forever
    int size = 1;
    for (int d = 0; d < 4; d++) size += sink(r + DR[d], c + DC[d]);
    return size;
}

int main() {
    int islands = 0, largest = 0;
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (grid[r][c] == '1') {  // land that no earlier search sank: a new island
                islands++;
                int size = sink(r, c);
                largest = max(largest, size);
                cout << "Island " << islands << " found at (" << r << ", " << c << "), size " << size << "\n";
            }
        }
    }
    cout << "Number of islands: " << islands << "\n";
    cout << "Largest island: " << largest << " cells\n";
    return 0;
}
```

```java
public class Main {
    static final int[] DR = {-1, 1, 0, 0}; // up, down, left, right
    static final int[] DC = {0, 0, -1, 1};
    static char[][] grid;
    static int rows, cols;

    // Sinks the island that contains (r, c) and returns how many cells it had.
    static int sink(int r, int c) {
        if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] != '1') return 0; // off the grid, water, or sunk
        grid[r][c] = '0'; // mark before going deeper, or the neighbours would call back here forever
        int size = 1;
        for (int d = 0; d < 4; d++) size += sink(r + DR[d], c + DC[d]);
        return size;
    }

    public static void main(String[] args) {
        String[] lines = {"11000", "11011", "00001", "01000", "11101"};
        rows = lines.length;
        cols = lines[0].length();
        grid = new char[rows][];
        for (int r = 0; r < rows; r++) grid[r] = lines[r].toCharArray();

        int islands = 0, largest = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (grid[r][c] == '1') { // land that no earlier search sank: a new island
                    islands++;
                    int size = sink(r, c);
                    largest = Math.max(largest, size);
                    System.out.println("Island " + islands + " found at (" + r + ", " + c + "), size " + size);
                }
            }
        }
        System.out.println("Number of islands: " + islands);
        System.out.println("Largest island: " + largest + " cells");
    }
}
```

```python
DR = [-1, 1, 0, 0]  # up, down, left, right
DC = [0, 0, -1, 1]
grid = [list(row) for row in ["11000", "11011", "00001", "01000", "11101"]]
rows, cols = len(grid), len(grid[0])


def sink(r, c):
    """Sink the island that contains (r, c) and return how many cells it had."""
    if r < 0 or r >= rows or c < 0 or c >= cols or grid[r][c] != "1":
        return 0  # off the grid, water, or sunk
    grid[r][c] = "0"  # mark before going deeper, or the neighbours would call back here forever
    size = 1
    for d in range(4):
        size += sink(r + DR[d], c + DC[d])
    return size


islands = 0
largest = 0
for r in range(rows):
    for c in range(cols):
        if grid[r][c] == "1":  # land that no earlier search sank: a new island
            islands += 1
            size = sink(r, c)
            largest = max(largest, size)
            print(f"Island {islands} found at ({r}, {c}), size {size}")
print(f"Number of islands: {islands}")
print(f"Largest island: {largest} cells")
```

```javascript
const DR = [-1, 1, 0, 0]; // up, down, left, right
const DC = [0, 0, -1, 1];
const grid = ["11000", "11011", "00001", "01000", "11101"].map((row) => row.split(""));
const rows = grid.length;
const cols = grid[0].length;

// Sinks the island that contains (r, c) and returns how many cells it had.
function sink(r, c) {
  if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] !== "1") return 0; // off the grid, water, or sunk
  grid[r][c] = "0"; // mark before going deeper, or the neighbours would call back here forever
  let size = 1;
  for (let d = 0; d < 4; d++) size += sink(r + DR[d], c + DC[d]);
  return size;
}

let islands = 0;
let largest = 0;
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    if (grid[r][c] === "1") {
      // land that no earlier search sank: a new island
      islands++;
      const size = sink(r, c);
      largest = Math.max(largest, size);
      console.log(`Island ${islands} found at (${r}, ${c}), size ${size}`);
    }
  }
}
console.log(`Number of islands: ${islands}`);
console.log(`Largest island: ${largest} cells`);
```

```output
Island 1 found at (0, 0), size 4
Island 2 found at (1, 3), size 3
Island 3 found at (3, 1), size 4
Island 4 found at (4, 4), size 1
Number of islands: 4
Largest island: 4 cells
```

## Cycle detection

In an undirected graph the vertex you came from is always a visited neighbour. Any *other* visited neighbour means a second route to it, so a cycle exists when DFS meets a visited neighbour that is not its **parent**, as [Graph Valid Tree](/problems/graph-valid-tree) checks.

On a directed graph that rule fails: two arrows can meet at a vertex with no way back. What matters is whether the vertex met is still on the current path, so each vertex is **white** (not visited), **grey** (its call still running) or **black** (finished).

@figure three-colours

An edge to a grey vertex is a **back edge** and always closes a cycle. An edge to a black vertex never does: if any route led from it back to the current path, DFS would already have found that route while exploring it. And no cycle slips past: on any cycle, the first vertex discovered stays grey while everything reachable from it is explored, including the vertex just before it on the cycle, whose edge then finds it grey.

The program prints the cycle by walking parent links back from the back edge, and starts from every white vertex, since one start may not reach a cycle.

```cpp
#include <algorithm>
#include <iostream>
#include <string>
#include <vector>
using namespace std;

const int WHITE = 0, GREY = 1, BLACK = 2;  // unvisited, on the current path, finished
vector<vector<int>> adj;
vector<int> colour, parent, finishOrder, cycle;

// Returns true as soon as an edge leads back to a grey vertex.
bool dfs(int u) {
    colour[u] = GREY;
    for (int v : adj[u]) {
        if (colour[v] == GREY) {  // v is on the current path: this back edge closes a cycle
            for (int x = u; x != v; x = parent[x]) cycle.push_back(x);
            cycle.push_back(v);
            reverse(cycle.begin(), cycle.end());
            cycle.push_back(v);
            return true;
        }
        if (colour[v] == WHITE) {
            parent[v] = u;
            if (dfs(v)) return true;
        }
        // BLACK: finished earlier with no way back to the path, so skip it
    }
    colour[u] = BLACK;
    finishOrder.push_back(u);  // exit order
    return false;
}

void report(const string& name, int n, const vector<vector<int>>& edges) {
    adj.assign(n, vector<int>());
    for (const vector<int>& e : edges) adj[e[0]].push_back(e[1]);  // directed: stored from the tail only
    colour.assign(n, WHITE);
    parent.assign(n, -1);
    finishOrder.clear();
    cycle.clear();
    bool found = false;
    for (int u = 0; u < n && !found; u++) {
        if (colour[u] == WHITE) found = dfs(u);  // every vertex, not only 0
    }
    if (found) {
        cout << name << ": cycle";
        for (size_t i = 0; i < cycle.size(); i++) cout << (i > 0 ? " -> " : " ") << cycle[i];
        cout << "\n";
    } else {
        cout << name << ": no cycle\nFinish order:";
        for (int u : finishOrder) cout << " " << u;
        cout << "\nTopological order:";
        for (int i = n - 1; i >= 0; i--) cout << " " << finishOrder[i];
        cout << "\n";
    }
}

int main() {
    report("Graph 1", 4, {{0, 1}, {0, 2}, {1, 3}, {2, 3}});
    report("Graph 2", 4, {{0, 1}, {1, 2}, {2, 3}, {3, 1}});
    return 0;
}
```

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class Main {
    static final int WHITE = 0, GREY = 1, BLACK = 2; // unvisited, on the current path, finished
    static List<List<Integer>> adj;
    static int[] colour, parent;
    static List<Integer> finishOrder, cycle;

    // Returns true as soon as an edge leads back to a grey vertex.
    static boolean dfs(int u) {
        colour[u] = GREY;
        for (int v : adj.get(u)) {
            if (colour[v] == GREY) { // v is on the current path: this back edge closes a cycle
                for (int x = u; x != v; x = parent[x]) cycle.add(x);
                cycle.add(v);
                Collections.reverse(cycle);
                cycle.add(v);
                return true;
            }
            if (colour[v] == WHITE) {
                parent[v] = u;
                if (dfs(v)) return true;
            }
            // BLACK: finished earlier with no way back to the path, so skip it
        }
        colour[u] = BLACK;
        finishOrder.add(u); // exit order
        return false;
    }

    static void report(String name, int n, int[][] edges) {
        adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        for (int[] e : edges) adj.get(e[0]).add(e[1]); // directed: stored from the tail only
        colour = new int[n]; // every vertex starts WHITE (0)
        parent = new int[n];
        Arrays.fill(parent, -1);
        finishOrder = new ArrayList<>();
        cycle = new ArrayList<>();
        boolean found = false;
        for (int u = 0; u < n && !found; u++) {
            if (colour[u] == WHITE) found = dfs(u); // every vertex, not only 0
        }
        StringBuilder line = new StringBuilder(name + ":");
        if (found) {
            line.append(" cycle");
            for (int i = 0; i < cycle.size(); i++) line.append(i > 0 ? " -> " : " ").append(cycle.get(i));
            System.out.println(line);
        } else {
            System.out.println(line.append(" no cycle"));
            StringBuilder finish = new StringBuilder("Finish order:");
            for (int u : finishOrder) finish.append(" ").append(u);
            System.out.println(finish);
            StringBuilder topo = new StringBuilder("Topological order:");
            for (int i = n - 1; i >= 0; i--) topo.append(" ").append(finishOrder.get(i));
            System.out.println(topo);
        }
    }

    public static void main(String[] args) {
        report("Graph 1", 4, new int[][] {{0, 1}, {0, 2}, {1, 3}, {2, 3}});
        report("Graph 2", 4, new int[][] {{0, 1}, {1, 2}, {2, 3}, {3, 1}});
    }
}
```

```python
WHITE, GREY, BLACK = 0, 1, 2  # unvisited, on the current path, finished


def report(name, n, edges):
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)  # directed: stored from the tail only
    colour = [WHITE] * n
    parent = [-1] * n
    finish_order = []
    cycle = []

    def dfs(u):
        """Return True as soon as an edge leads back to a grey vertex."""
        colour[u] = GREY
        for v in adj[u]:
            if colour[v] == GREY:  # v is on the current path: this back edge closes a cycle
                x = u
                while x != v:
                    cycle.append(x)
                    x = parent[x]
                cycle.append(v)
                cycle.reverse()
                cycle.append(v)
                return True
            if colour[v] == WHITE:
                parent[v] = u
                if dfs(v):
                    return True
            # BLACK: finished earlier with no way back to the path, so skip it
        colour[u] = BLACK
        finish_order.append(u)  # exit order
        return False

    found = False
    for u in range(n):
        if colour[u] == WHITE and dfs(u):  # every vertex, not only 0
            found = True
            break
    if found:
        print(f"{name}: cycle {' -> '.join(map(str, cycle))}")
    else:
        print(f"{name}: no cycle")
        print("Finish order:", *finish_order)
        print("Topological order:", *reversed(finish_order))


report("Graph 1", 4, [(0, 1), (0, 2), (1, 3), (2, 3)])
report("Graph 2", 4, [(0, 1), (1, 2), (2, 3), (3, 1)])
```

```javascript
const WHITE = 0, GREY = 1, BLACK = 2; // unvisited, on the current path, finished

function report(name, n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v] of edges) adj[u].push(v); // directed: stored from the tail only
  const colour = new Array(n).fill(WHITE);
  const parent = new Array(n).fill(-1);
  const finishOrder = [];
  const cycle = [];

  // Returns true as soon as an edge leads back to a grey vertex.
  function dfs(u) {
    colour[u] = GREY;
    for (const v of adj[u]) {
      if (colour[v] === GREY) {
        // v is on the current path: this back edge closes a cycle
        for (let x = u; x !== v; x = parent[x]) cycle.push(x);
        cycle.push(v);
        cycle.reverse();
        cycle.push(v);
        return true;
      }
      if (colour[v] === WHITE) {
        parent[v] = u;
        if (dfs(v)) return true;
      }
      // BLACK: finished earlier with no way back to the path, so skip it
    }
    colour[u] = BLACK;
    finishOrder.push(u); // exit order
    return false;
  }

  let found = false;
  for (let u = 0; u < n && !found; u++) {
    if (colour[u] === WHITE) found = dfs(u); // every vertex, not only 0
  }
  if (found) {
    console.log(`${name}: cycle ${cycle.join(" -> ")}`);
  } else {
    console.log(`${name}: no cycle`);
    console.log(`Finish order: ${finishOrder.join(" ")}`);
    console.log(`Topological order: ${finishOrder.slice().reverse().join(" ")}`);
  }
}

report("Graph 1", 4, [[0, 1], [0, 2], [1, 3], [2, 3]]);
report("Graph 2", 4, [[0, 1], [1, 2], [2, 3], [3, 1]]);
```

```output
Graph 1: no cycle
Finish order: 3 1 2 0
Topological order: 0 2 1 3
Graph 2: cycle 1 -> 2 -> 3 -> 1
```

Graph 1's reversed finish order is a **topological order**, every edge pointing forwards, the subject of the [topological sort](/roadmap/topological-sort) lesson. [Course Schedule](/problems/course-schedule) is this program with courses for vertices.

## Entry and exit order

Every vertex has two moments in a DFS: its **entry**, when its call starts, and its **exit**, when it returns. Number both with one clock and the intervals nest like brackets.

@figure entry-exit

Entry order is preorder, the order for copying a tree from the top down. Exit order is postorder: a vertex finishes only after everything below it, the moment to combine its children's answers, such as subtree sizes or the deepest path below it.

## How deep can the recursion go?

The pending calls are the current path, so recursion can go V calls deep.

@figure deep-snake

Python stops at 1,000 frames with `RecursionError`; Node.js throws `RangeError` after roughly ten thousand, Java `StackOverflowError` after tens of thousands, and C++ simply crashes. When a path of more than about ten thousand vertices is possible, use the explicit stack.

## Other shapes of DFS

- **Search from the border.** [Number of Enclaves](/problems/number-of-enclaves) and [Surrounded Regions](/problems/surrounded-regions) sink everything reachable from the edge first; what is left is the answer.
- **Search from the destination.** [Pacific Atlantic Water Flow](/problems/pacific-atlantic-water-flow) searches uphill from each ocean once and keeps the cells both reach.
- **Every path.** Unmark a vertex when its call returns and DFS becomes backtracking: [All Paths From Source to Target](/problems/all-paths-from-source-to-target). The cost becomes exponential.

## Time and space complexity

| Approach | Time | Extra space |
| --- | --- | --- |
| Marks only on the current path (backtracking) | exponential | O(V) |
| DFS on an adjacency list | O(V + E) | O(V) |
| DFS on an adjacency matrix | O(V²) | O(V) |
| DFS over an R × C grid | O(R × C) | O(R × C) |
| Cycle detection with three colours | O(V + E) | O(V) |

## How to recognise a DFS problem

- **Regions**: islands, provinces, groups, "connected", "enclosed by".
- **Reachability**: "can every room be visited", "which cells can reach the border".
- **Cycles and dependencies**: "can all courses be finished", "valid tree". A directed graph wants three colours.
- **Every path or arrangement**: DFS with backtracking.
- **Answers built from below**, such as subtree sizes: postorder.

## Common mistakes

- **Marking after the recursive calls.** Two neighbours then call each other forever.
- **Reading the grid before checking bounds.**
- **A plain visited flag for directed cycles.** A diamond is not a cycle; use three colours.
- **Leaving out the parent check in an undirected graph.** Every edge then looks like a cycle.
- **Starting only from vertex 0.** Loop over every vertex, or you miss components and cycles.

## Practice in this order

1. [Flood Fill](/problems/flood-fill): one DFS from one cell, and the trap when the new colour equals the old.
2. [Number of Islands](/problems/number-of-islands): the components loop on a grid, with sinking.
3. [Max Area of Island](/problems/max-area-of-island): a DFS that returns the size it explored.
4. [Number of Provinces](/problems/number-of-provinces): components of a graph given as a matrix.
5. [Number of Enclaves](/problems/number-of-enclaves): search from the border, then count what is left.
6. [Surrounded Regions](/problems/surrounded-regions): the same border trick, then flip the rest.
7. [Pacific Atlantic Water Flow](/problems/pacific-atlantic-water-flow): two uphill searches and their overlap.
8. [Graph Valid Tree](/problems/graph-valid-tree): undirected cycle detection plus connectivity.
9. [Course Schedule](/problems/course-schedule): directed cycle detection with three colours.

The [depth-first search problem list](/challenges/depth-first-search) has every DFS problem in the catalogue, easiest first. With both traversals in hand, the next stage of the roadmap builds on them: [topological sort](/roadmap/topological-sort), union-find and shortest paths with weights.
