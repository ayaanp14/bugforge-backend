---
title: Depth-First Search (DFS)
stage: graphs
order: 3
minutes: 24
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
Explore a maze with a stick of chalk and one rule: keep walking into corridors you have not chalked yet, and when you reach a dead end, walk back to the last junction that still has an unchalked corridor. You will see every room you can reach, each one once. That is **depth-first search** (DFS): follow one path as deep as it goes, then backtrack and try the next. Where [breadth-first search](/roadmap/breadth-first-search) spreads out in rings, DFS dives.

DFS is the traversal behind counting islands, finding connected components, detecting cycles and ordering tasks with dependencies. It is the same recursion as [backtracking](/roadmap/backtracking) with one change: a vertex, once visited, stays visited. This lesson covers the recursive and iterative versions, why every vertex is reached exactly once, the island and component problems, cycle detection in undirected and directed graphs, the entry and exit order later algorithms rely on, and what goes wrong on very deep inputs. It assumes you know how a [graph](/roadmap/graphs) is stored. Every example is shown in C++, Java, Python and JavaScript.

## Why a traversal must remember where it has been

A walk that just keeps moving to neighbours never ends on a graph with a cycle: A → B → C → A → B and round again. The first fix people reach for is the backtracking one: refuse to step onto a vertex that is already on the *current* path, and unmark it when you step back. That does finish, but it explores every simple path rather than every vertex, and paths vastly outnumber vertices. In a graph of only 15 vertices, each joined to every other, there are about 2.4 × 10¹¹ simple paths starting from one vertex.

DFS marks a vertex when it first arrives and never unmarks it. Each vertex is then entered once and each edge looked at from its two ends: for those 15 vertices and 105 edges, a few hundred steps. Backtracking keeps its marks per path because it wants every path, such as every permutation; DFS keeps them for good because it only wants every vertex.

## The idea: go deep, then backtrack

Here is the graph the walkthrough below uses:

```text
             A
            / \
           B   C
          / \   \
         D---E   F

 edges: A–B, A–C, B–D, B–E, C–F, D–E
```

DFS follows three rules:

- When you arrive at a vertex, mark it visited.
- Take its neighbours one at a time. For each one not visited yet, go there at once, and finish that whole branch before looking at the next neighbour.
- When no unvisited neighbour is left, return to the vertex you came from. That return is the **backtrack**.

```text
dfs(u):
    visited[u] = true              # mark on arrival
    for each neighbour v of u:
        if not visited[v]:
            dfs(v)                 # go deep now; u's other neighbours wait
    # nothing left to try: returning to the caller is the backtrack
```

Recursion does the bookkeeping for you. While dfs(E) runs, the calls dfs(A), dfs(B) and dfs(D) are paused beneath it on the call stack, each waiting to try its next neighbour. That stack is always the path from the start to the vertex being explored, and returning from a call is the walk back to the previous junction.

@walkthrough

## Why it works

Two claims make DFS correct: no vertex is visited twice, and every vertex reachable from the start is visited.

The first is the easy one. dfs(v) is called only when v is unvisited, and its first act is to mark v, so no second call for v can ever happen.

The second is a short argument by contradiction. Suppose a vertex v can be reached from the start s, but DFS never visits it. Walk along a path from s to v and stop at the first vertex DFS did not visit; call it x, and call the vertex just before it w. Since w was visited, dfs(w) ran, and dfs(w) loops over every neighbour of w, x included. At that moment x was unvisited, because it never gets visited, so dfs(w) would have called dfs(x). That contradiction means no such v exists.

Together the two claims give the cost. dfs runs once per reachable vertex, and each run reads its vertex's adjacency list once, so the total work is O(V + E), the same as BFS. The order in which DFS visits vertices depends on the order of the adjacency lists; the set it visits does not.

### Dry run

DFS from A on the example, with each vertex's neighbours in alphabetical order:

| Step | What happens | Call stack afterwards | Discovered so far |
| --- | --- | --- | --- |
| 1 | dfs(A) is called; A is discovered | A | A |
| 2 | A's first neighbour, B, is new: dfs(B) | A B | A B |
| 3 | B's neighbour A is visited; D is new: dfs(D) | A B D | A B D |
| 4 | D's neighbour B is visited; E is new: dfs(E) | A B D E | A B D E |
| 5 | E's neighbours B and D are both visited: dfs(E) returns | A B D | A B D E |
| 6 | D has nothing left: dfs(D) returns | A B | A B D E |
| 7 | B's last neighbour, E, is visited: dfs(B) returns | A | A B D E |
| 8 | A's next neighbour, C, is new: dfs(C) | A C | A B D E C |
| 9 | C's neighbour F is new: dfs(F) | A C F | A B D E C F |
| 10 | F, then C, then A return | empty | A B D E C F |

The discovery order is A B D E C F, and the calls finish in the order E D B F C A. Step 5 deserves a second look: E finds B already visited, and B is not the vertex E came from. In an undirected graph that is the sign of a cycle, here B–D–E–B.

### Recursive and iterative DFS

Recursion is the natural way to write DFS, but the same search works with a stack you manage yourself, which is what you need when the recursion would go too deep. Push the start; then repeatedly pop a vertex, skip it if it is already visited, and otherwise mark it and push its unvisited neighbours. Pushing them in reverse order makes the first neighbour come off the stack first, so the visiting order is the same as the recursive one:

```text
stack = [start]
while stack is not empty:
    u = pop from stack
    if visited[u]: continue        # pushed more than once; already handled
    visited[u] = true              # mark when popped, as recursion marks on arrival
    for each neighbour v of u, in reverse order:
        if not visited[v]:
            push v
```

Notice that a vertex is marked when it is popped, not when it is pushed, so it can sit on the stack more than once; the `continue` throws the extra copies away, and the stack can grow to O(E) entries. If you mark on push instead, as BFS does, every vertex is pushed only once and still every reachable vertex is visited, which is fine for counting islands or components. But the order stops being a true depth-first order: a vertex marked while it waits on the stack cannot be reached later as part of a deeper branch. Cycle detection and topological order depend on the true order, so for them use recursion, or a stack of (vertex, index of the next neighbour to try) pairs that imitates the call stack exactly.

## Connected components and islands

One dfs from a start visits exactly one connected component: everything that can be reached from there. To find all the components, loop over every vertex and start a new DFS from each one that is still unvisited. Each new start is a new component, and because the marks are never cleared, the whole loop still enters every vertex once: O(V + E) in total, not O(V) searches of O(V + E) each. [Number of Provinces](/problems/number-of-provinces) is exactly this loop.

A grid of land and water is the same problem in disguise. Land cells are vertices, joined to the land cells above, below, left and right of them, so each DFS from an unvisited land cell sweeps up one island, and counting DFS starts counts islands: [Number of Islands](/problems/number-of-islands). Two habits make the code short. The visited marks can live in the grid itself: turn each land cell into water as you visit it, which is called **sinking** the island. And the recursion can return how many cells it sank, which gives each island's area, the whole of [Max Area of Island](/problems/max-area-of-island).

```text
 1 1 0 0 0         a a . . .
 1 1 0 1 1         a a . b b
 0 0 0 0 1         . . . . b
 0 1 0 0 0         . c . . .
 1 1 1 0 1         c c c . d
```

The grid on the left has four islands, labelled on the right. Cells touch only along a side, so the bottom-right cell is an island of its own: the cell above it is water. The order of the first two lines of the recursion matters. Check that the cell is inside the grid and is land *before* reading or changing it, and sink it *before* making the recursive calls. Sink it afterwards and its neighbour's call comes straight back to it, which calls the neighbour again, until the stack overflows.

### The code

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

The outer loop visits every cell once and each `sink` call does constant work apart from its recursive calls, which happen once per land cell, so the whole program is O(R × C). If the grid must not be changed, keep a separate `visited` array instead of sinking: the same cost, plus O(R × C) memory.

## Cycle detection

### Undirected graphs: a visited neighbour that is not the parent

In an undirected graph every edge is stored from both ends, so when DFS stands at E having come from D, D is a visited neighbour of E, but only because of the edge DFS arrived by. Any *other* visited neighbour means there is a second way to reach it, and the two routes together close a cycle. So the rule is: a cycle exists if DFS finds a neighbour that is visited and is not the vertex it came from, its **parent**. In the dry run, step 5 found B from E while E's parent was D, which exposed the cycle B–D–E–B. [Graph Valid Tree](/problems/graph-valid-tree) combines this test with "every vertex was reached". If the input may contain two parallel edges between the same pair, they form a cycle of length 2, and the rule has to compare edges rather than vertices.

### Directed graphs: white, grey and black

The undirected rule fails on a directed graph. Take 0 → 1, 0 → 2, 1 → 3 and 2 → 3. DFS goes 0, 1, 3, back to 0, then on to 2, where it finds 3 already visited and not its parent. Yet there is no cycle: two arrows meet at 3, but nothing leads back from 3. Being visited is not enough; what matters is whether the vertex you meet is still on the current path. So DFS gives every vertex one of three colours:

- **White**: not visited yet.
- **Grey**: visited, and its call is still running, so it lies on the current path from the start.
- **Black**: finished; everything reachable from it has been explored.

An edge to a **grey** vertex points back to an ancestor on the current path. It is called a **back edge**, and the path from that ancestor down to the current vertex, plus the edge, is a cycle. An edge to a **black** vertex is harmless: that vertex is fully explored, and if any route led from it back to the current path, DFS would already have met that route as a grey edge. An edge to a white vertex is simply the next step down.

Why a cycle can never slip past the test: take any directed cycle and let v be the first of its vertices that DFS discovers. At that moment the rest of the cycle is white and reachable from v, and everything reachable from v along white vertices is discovered before dfs(v) returns. In particular, the vertex u just before v on the cycle is explored while v is still grey, and when dfs(u) looks along its edge u → v, it finds v grey: a back edge. And the test never reports a cycle that is not there, because a grey vertex really is an ancestor with a real path down to the current vertex.

### The code

The program checks two directed graphs of four vertices each. Graph 1 is the diamond above: 3 is met twice, but the second time it is black, so there is no cycle. Graph 2 contains 1 → 2 → 3 → 1. When the search finds an edge from u to a grey vertex v, it walks the parent links from u back up to v to print the cycle. The outer loop starts a search from every vertex that is still white, because in a directed graph one start may not reach every vertex, and a cycle could sit in the part it misses.

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

For graph 1 the program also prints the order in which the calls finished, and that order reversed. The reversed finish order is a **topological order**: every edge points from an earlier vertex to a later one (0 → 2, 0 → 1, 2 → 3, 1 → 3). That is no coincidence, and it is the subject of the [topological sort](/roadmap/topological-sort) lesson: when there is no cycle, for every edge u → v, v finishes before u. [Course Schedule](/problems/course-schedule) is this program with courses for vertices and prerequisites for edges.

## Entry and exit order

Every vertex has two moments in a DFS: when its call starts, its **entry** or discovery, and when its call returns, its **exit** or finish. Number both moments with one clock and the intervals nest like brackets: if v is discovered while u's call is running, v finishes before u does. In the dry run, A enters at 1, B at 2, D at 3 and E at 4; then E exits at 5, D at 6 and B at 7; C enters at 8 and F at 9; F exits at 10, C at 11 and A at 12. Written as brackets, that is (A (B (D (E E) D) B) (C (F F) C) A).

Three tools come out of this:

- **Entry order is preorder.** It lists each vertex before everything below it, the order for copying or printing a tree from the top down.
- **Exit order is postorder.** A vertex finishes only after everything below it, which is the moment to combine the children's answers: subtree sizes, the deepest path below a vertex, whether a subtree contains something.
- **Reversed exit order of a DAG is a topological order**, as the cycle program showed.

The edges get names from the same picture. A **tree edge** is one DFS followed to a new vertex. A **back edge** leads to a grey ancestor and means a cycle. In a directed graph an edge can also lead to a black vertex, a **forward edge** to a finished descendant or a **cross edge** to another finished branch, and neither of those ever means a cycle.

## How deep can the recursion go?

Each pending call takes a frame on the call stack, and the pending calls are the current path, so the depth is the length of the longest path DFS follows, up to V. On a 1,000 × 1,000 grid of all land, DFS winds down one column, up the next and so on through every cell before it ever backtracks: a path a million calls deep. Default stacks do not allow that:

- **Python** stops at 1,000 frames by default and raises `RecursionError`. Raising the limit with `sys.setrecursionlimit` only moves the check; the interpreter's own C stack can still overflow and crash the process.
- **JavaScript** in Node.js throws `RangeError: Maximum call stack size exceeded` after roughly ten thousand frames, depending on their size.
- **Java** throws `StackOverflowError`; a default thread stack fits tens of thousands of small frames, not millions.
- **C++** has no check at all: the program dies with a segmentation fault once the stack, commonly between 1 and 8 MB, is used up.

So when the constraints allow a path longer than about ten thousand vertices, such as a grid bigger than 100 × 100 or a chain of 10⁵ nodes, use the explicit stack from earlier, or BFS when only reachability matters. Most interview grids are small enough for recursion and interviewers accept it, but say out loud that you know where the limit is.

## Other shapes of DFS

- **Search from the border.** [Number of Enclaves](/problems/number-of-enclaves) and [Surrounded Regions](/problems/surrounded-regions) ask which cells can *not* reach the edge of the grid. Turn the question round: sink or mark everything reachable from the border cells first, and whatever is left over is the answer.
- **Search from the destination.** In [Pacific Atlantic Water Flow](/problems/pacific-atlantic-water-flow), checking every cell's downhill routes separately is slow. Search uphill from each ocean's border instead, once per ocean, and keep the cells both searches reach.
- **Return values.** A DFS that returns something, such as the island size above or the height of a subtree, solves the problem in the same pass that explores it.
- **Every path.** Unmark a vertex when its call returns and DFS becomes backtracking, which lists every path or arrangement: [All Paths From Source to Target](/problems/all-paths-from-source-to-target) and [Word Search](/problems/word-search). The cost becomes exponential, so do it only when the problem truly wants every path.
- **Two-colouring.** Give each newly visited vertex the opposite colour of its parent; meeting a neighbour of the same colour means the graph is not bipartite: [Possible Bipartition](/problems/possible-bipartition).

## BFS or DFS?

| | Breadth-first search | Depth-first search |
| --- | --- | --- |
| Keeps its frontier in | a queue | the call stack, or a stack |
| Visiting order | level by level, nearest first | one path to its end, then back |
| Shortest path in an unweighted graph | yes | no, just some path |
| Time | O(V + E) | O(V + E) |
| Extra memory | the widest level, up to O(V) | the deepest path, up to O(V) |
| Risk on huge inputs | a large queue | stack overflow, if recursive |
| Typical uses | fewest steps, spreading, levels | components, islands, cycles, ordering, all paths |

For plain reachability, such as whether b can be reached or how many islands there are, both are right and you can use whichever you write faster. The choice matters when the question has a shape. "Fewest steps" means BFS. Anything about cycles, the order in which things finish, or exploring every path means DFS.

## Time and space complexity

| Approach | Time | Extra space |
| --- | --- | --- |
| Marks kept only on the current path (backtracking) | exponential | O(V) |
| DFS on an adjacency list | O(V + E) | O(V) for the marks and the stack |
| DFS on an adjacency matrix | O(V²) | O(V) |
| DFS over an R × C grid | O(R × C) | O(R × C) for the stack in the worst case |
| Every component, with the outer loop | O(V + E) | O(V) |
| Cycle detection with three colours | O(V + E) | O(V) |

Every version is O(V + E) for the same reason: each vertex is entered once, because it is marked on arrival and never unmarked, and each adjacency list is read once, when its vertex is entered. The outer loop over all vertices adds O(V) checks but no repeated work, since a vertex visited by an earlier search is skipped.

## How to recognise a DFS problem

Read the statement for these signals:

- **Regions**: islands, provinces, groups, "connected", "enclosed by". Count or measure the components.
- **Reachability**: "can every room be visited", "which cells can reach the border". Often easier searched backwards from the target.
- **Cycles and dependencies**: "is it possible to finish all courses", "valid tree", "deadlock". A directed graph wants the three colours.
- **Every path or arrangement**: list all routes, find a word in a grid. DFS with backtracking.
- **Answers built from below**: subtree sizes, the longest path in a tree. That is postorder.

If the question asks for the fewest steps, it is a [breadth-first search](/roadmap/breadth-first-search) problem instead; if groups merge as edges arrive one at a time, [union-find](/roadmap/union-find) is usually simpler.

## Common mistakes

- **Marking after the recursive calls.** Mark a vertex as soon as you arrive, before recursing, or two neighbours call each other forever.
- **Reading the grid before checking bounds.** Check that the cell is inside the grid first, then look at it.
- **A plain visited check for directed cycles.** In the diamond 0 → 1 → 3, 0 → 2 → 3, vertex 3 is visited twice with no cycle. Use white, grey and black.
- **Mixing up the two cycle rules.** Without the parent check, every undirected edge looks like a cycle, because the vertex you came from is always a visited neighbour. With it, a directed graph's cycles are judged wrongly.
- **Starting only from vertex 0.** Unless the graph is known to be connected, loop over every vertex and start a new search from each unvisited one, or you miss components and cycles.
- **Unmarking on return by accident.** That turns DFS into backtracking, and the running time from O(V + E) into exponential.

## Practice in this order

1. [Flood Fill](/problems/flood-fill): one DFS from one cell, and the trap when the new colour equals the old one.
2. [Number of Islands](/problems/number-of-islands): the components loop on a grid, with sinking.
3. [Max Area of Island](/problems/max-area-of-island): a DFS that returns the size it explored.
4. [Number of Provinces](/problems/number-of-provinces): components of a graph given as an adjacency matrix.
5. [Number of Enclaves](/problems/number-of-enclaves): search from the border first, then count what is left.
6. [Surrounded Regions](/problems/surrounded-regions): the same border trick, then flip the rest.
7. [Pacific Atlantic Water Flow](/problems/pacific-atlantic-water-flow): two uphill searches and their overlap.
8. [Graph Valid Tree](/problems/graph-valid-tree): undirected cycle detection plus connectivity.
9. [Course Schedule](/problems/course-schedule): directed cycle detection with three colours.

The [depth-first search problem list](/challenges/depth-first-search) has every DFS problem in the catalogue, from easy to hard. With both traversals in hand, the next stage of the roadmap builds on them: topological sort, union-find and shortest paths with weights.
