---
title: Graph Data Structure
stage: graphs
order: 1
minutes: 20
level: Beginner
hub: graph
practice: find-center-of-star-graph, find-the-town-judge, find-champion-ii, find-if-path-exists-in-graph, minimum-number-of-vertices-to-reach-all-nodes, maximal-network-rank, keys-and-rooms, number-of-provinces
updated: 2026-10-03
seo-title: Graph Data Structure: Terms, Representations and Code
description: Learn the graph data structure: directed and weighted graphs, degree, adjacency lists and matrices, with code in C++, Java, Python and JavaScript.
question: What is a graph data structure?
answer: A graph is a set of vertices (nodes) joined by edges (connections). Edges can be directed or undirected and can carry weights. In code a graph is usually stored as an adjacency list, which gives each vertex the list of its neighbours in O(V + E) space, or as an adjacency matrix, a V × V table that answers "is there an edge?" in O(1) but needs O(V²) space.
q: What is the difference between a tree and a graph?
a: A tree is a connected graph with no cycles, so it has exactly V − 1 edges and exactly one path between any two vertices. A general graph can have cycles, several separate components and any number of edges. Every tree is a graph, but most graphs are not trees.
q: Should I use an adjacency list or an adjacency matrix?
a: Use an adjacency list by default: it takes O(V + E) memory and lists a vertex's neighbours in time proportional to its degree, which is what BFS and DFS need. Use a matrix when the graph is small and dense, when the input already is one, or when you need many O(1) "is u joined to v?" checks.
q: What is the degree of a vertex?
a: The degree is the number of edges touching a vertex. In a directed graph it splits into the in-degree, edges arriving, and the out-degree, edges leaving. In an undirected graph the degrees add up to exactly twice the number of edges, because every edge has two ends.
q: What is a directed acyclic graph (DAG)?
a: A DAG is a directed graph with no directed cycle: follow the arrows from any vertex and you can never return to it. DAGs model dependencies such as course prerequisites and build steps, and every DAG has a topological order in which all edges point forwards.
q: Is a grid a graph?
a: Yes. Each cell is a vertex, joined to the cells directly above, below, left and right of it when they are inside the grid and passable. You do not build an adjacency list for a grid; you work out a cell's neighbours on the fly with direction offsets, and a traversal costs O(rows × columns).
q: How many edges can a graph have?
a: A simple undirected graph on V vertices has at most V × (V − 1) / 2 edges, and a simple directed graph at most V × (V − 1). A graph near that limit is called dense; one whose edge count is close to V is sparse. Interview graphs are nearly always sparse, which is why adjacency lists are the default.
---
A **graph** is the data structure for anything made of things and the connections between them: cities joined by roads, people joined by friendships, courses joined by prerequisites, web pages joined by links. An array lines its items up in a row and a tree hangs them from a single root; a graph lets any item connect to any other. That freedom is why so many interview questions are graph problems in disguise, and why the [breadth-first search](/roadmap/breadth-first-search) and [depth-first search](/roadmap/depth-first-search) lessons that follow this one matter so much.

This lesson is about the structure itself: the vocabulary every graph problem uses, the three ways to store a graph in memory and what each one costs, how to build the standard one from the input a problem hands you, and how to spot a graph in a statement that never uses the word. Every example is shown in C++, Java, Python and JavaScript.

## What a graph is

A graph is a set of **vertices** (also called nodes) and a set of **edges**, each edge joining two vertices. In complexity formulas V and E also stand for how many there are, so an algorithm that runs in O(V + E) does work in proportion to the number of vertices plus the number of edges.

Problems usually number the vertices 0 to n − 1, sometimes 1 to n, and hand you the edges as a list of pairs:

```text
 n = 5, edges = [[0,1], [0,2], [1,2], [1,3], [2,4], [3,4]]

          1 ------- 3
         / |        |
        0  |        |
         \ |        |
          2 ------- 4
```

Two vertices joined by an edge are **adjacent**: they are each other's **neighbours**. Here the neighbours of 1 are 0, 2 and 3. Where the vertices sit on the page means nothing. The graph is only the record of who is joined to whom, and two drawings with the same edges are the same graph.

## The words every graph problem uses

### Directed and undirected

An **undirected** edge works both ways: if 0–1 is a friendship, 1 is a friend of 0 and 0 is a friend of 1. A **directed** edge, written 0 → 1, goes one way only: a one-way street, a follow on a social network, "course 0 must be taken before course 1". Read the statement carefully, because in code the difference is one line: an undirected edge is stored from both ends, a directed one only from the vertex it leaves.

### Weighted

A **weighted** graph puts a number on each edge: a distance, a price, a travel time. In an unweighted graph every edge counts as 1, so the length of a route is just its number of edges. The difference decides the algorithm. "Fewest edges" is a breadth-first search question; "cheapest total weight" is a question for [Dijkstra's algorithm](/roadmap/dijkstras-algorithm), because a route with more edges can still cost less.

### Degree

The **degree** of a vertex is the number of edges touching it. In the graph above, 1 and 2 have degree 3 and the other three vertices degree 2. Add the degrees up and you get 12, exactly twice the 6 edges, and that is no accident: every edge has two ends and adds 1 to the degree of each. This is the **handshake lemma**, the sum of the degrees is 2E, and it is why an adjacency list for an undirected graph holds 2E entries.

In a directed graph each vertex has an **out-degree**, the edges leaving it, and an **in-degree**, the edges arriving at it. Every edge leaves exactly one vertex and arrives at exactly one, so the out-degrees add up to E and so do the in-degrees. Degrees solve some problems on their own. The champion in [Find Champion II](/problems/find-champion-ii) is the only vertex with in-degree 0, and the judge in [Find the Town Judge](/problems/find-the-town-judge) is the vertex with in-degree n − 1 and out-degree 0.

### Paths and cycles

A **path** is a sequence of vertices in which each one is joined to the next: 0 → 1 → 3 → 4 is a path of length 3, since length counts edges, not vertices. A path that never repeats a vertex is a **simple path**. A **cycle** is a path that comes back to where it started without reusing an edge: 0 → 1 → 2 → 0 is one. In an undirected graph a cycle needs at least three vertices, because 0 → 1 → 0 only walks the same edge back again.

### Connectivity and components

An undirected graph is **connected** when there is a path between every pair of vertices. When there is not, it falls apart into **connected components**: the largest groups of vertices that can all reach each other. Counting components is the whole of [Number of Provinces](/problems/number-of-provinces), and "can a reach b?" is the whole of [Find if Path Exists in Graph](/problems/find-if-path-exists-in-graph). In a directed graph reachability is one-way, so the idea splits in two; a **strongly connected** graph has a directed path from every vertex to every other.

### DAGs and trees

A **directed acyclic graph**, or DAG, is a directed graph with no directed cycle: follow the arrows from any vertex and you never get back to it. DAGs model dependencies such as prerequisites, build steps and spreadsheet formulas, and every DAG can be laid out in a [topological order](/roadmap/topological-sort) in which every edge points forwards. A cycle in a dependency graph means the tasks can never all be finished, which is exactly what [Course Schedule](/problems/course-schedule) asks you to detect.

A **tree** is a connected undirected graph with no cycles, and it always has exactly V − 1 edges. Here is why. Start with V vertices and no edges: V components. An edge between two different components merges them into one, so reaching a single component takes exactly V − 1 such edges. Any further edge would join two vertices that are already connected, and the existing path plus the new edge is a cycle. The same argument shows there is exactly one path between any two vertices of a tree. The [binary tree](/roadmap/binary-tree) is a tree with a chosen root and at most two children per vertex, and [Graph Valid Tree](/problems/graph-valid-tree) asks you to check these conditions on an edge list.

Two more terms turn up in constraints. A **self-loop** is an edge from a vertex to itself, and **parallel edges** join the same pair twice; most problems promise there are neither. A graph with close to the most edges it could have, V × (V − 1) / 2 for a simple undirected graph, is **dense**; one with E about the size of V is **sparse**. Interview graphs are almost always sparse.

## How a graph is stored

A problem hands you the edges as a list. Before you can search the graph you need a structure that answers the one question every traversal asks over and over: *who are the neighbours of u?* There are three standard choices.

**Edge list.** Keep the pairs as they came. It costs O(E) memory and nothing to build, but finding the neighbours of u means scanning every edge. A breadth-first search asks that question once for every vertex, so on a graph with V = 10⁵ and E = 2 × 10⁵ it would scan 10⁵ × 2 × 10⁵ = 2 × 10¹⁰ edges: minutes of work for what should take milliseconds. Keep a plain edge list only when you process edges in bulk, as Kruskal's [minimum spanning tree](/roadmap/minimum-spanning-tree) algorithm does after sorting them by weight.

**Adjacency matrix.** A V × V table in which `matrix[u][v]` is 1, or the edge's weight, when there is an edge from u to v, and 0 otherwise. Checking for one edge is a single lookup, O(1). The price is memory: V² cells however few edges there are. For V = 10⁵ that is 10¹⁰ cells, about 40 GB of 4-byte integers, to describe a graph that might have a few hundred thousand edges. Listing the neighbours of u means reading its whole row, O(V), even when it has only two.

**Adjacency list.** One list per vertex: `adj[u]` holds the neighbours of u. It takes O(V + E) memory, V lists holding 2E entries between them for an undirected graph, and listing the neighbours of u takes O(deg(u)): exactly as long as there are neighbours to list. This is the default for almost every graph problem.

Here is the example graph in all three forms:

```text
 Edge list (6 pairs):   [0,1] [0,2] [1,2] [1,3] [2,4] [3,4]

 Adjacency matrix (5 × 5):          Adjacency list:
        0  1  2  3  4
    0   .  1  1  .  .               adj[0] = [1, 2]
    1   1  .  1  1  .               adj[1] = [0, 2, 3]
    2   1  1  .  .  1               adj[2] = [0, 1, 4]
    3   .  1  .  .  1               adj[3] = [1, 4]
    4   .  .  1  1  .               adj[4] = [2, 3]
```

The matrix of an undirected graph is symmetric about its diagonal, because the edge 0–1 sets both `matrix[0][1]` and `matrix[1][0]`. The matrix of a directed graph need not be.

@walkthrough

## The operations and their cost

| Operation | Edge list | Adjacency matrix | Adjacency list |
| --- | --- | --- | --- |
| Memory | O(E) | O(V²) | O(V + E) |
| Is there an edge from u to v? | O(E) | O(1) | O(deg(u)) |
| List the neighbours of u | O(E) | O(V) | O(deg(u)) |
| A whole BFS or DFS | O(V × E) | O(V²) | O(V + E) |
| Add an edge | O(1) | O(1) | O(1) |
| Remove an edge | O(E) | O(1) | O(deg(u)) |

The row that matters most is the fourth. A traversal lists the neighbours of every vertex once. On an adjacency list that costs the sum of all the degrees, which the handshake lemma says is 2E, plus V for visiting the vertices themselves: O(V + E). On a matrix the same traversal reads V rows of V cells, O(V²), which is no worse only when the graph is dense.

So use an adjacency list unless you have a reason not to. The good reasons for a matrix are a small, dense graph (V up to a thousand or two), an input that already is one, as in [Number of Provinces](/problems/number-of-provinces), many "is u joined to v?" checks, as in [Maximal Network Rank](/problems/maximal-network-rank), or an algorithm built on one, such as Floyd–Warshall for all-pairs shortest paths. If you need fast edge checks on a big sparse graph, give each vertex a hash set instead of a list: O(1) expected checks for O(V + E) memory, as the [hashing](/roadmap/hashing) lesson explains.

### Dry run

Building the adjacency list for the example, one edge at a time. Each undirected edge u–v appends v to `adj[u]` and u to `adj[v]`:

| Edge read | adj[0] | adj[1] | adj[2] | adj[3] | adj[4] |
| --- | --- | --- | --- | --- | --- |
| 0–1 | 1 | 0 | empty | empty | empty |
| 0–2 | 1 2 | 0 | 0 | empty | empty |
| 1–2 | 1 2 | 0 2 | 0 1 | empty | empty |
| 1–3 | 1 2 | 0 2 3 | 0 1 | 1 | empty |
| 2–4 | 1 2 | 0 2 3 | 0 1 4 | 1 | 2 |
| 3–4 | 1 2 | 0 2 3 | 0 1 4 | 1 4 | 2 3 |

Six edges made twelve entries, and each list's length is its vertex's degree: 2, 3, 3, 2 and 2. Each edge touched only the two lists it names, so building took O(V + E): O(V) to create the empty lists and O(1) per edge to append.

### The code

The program builds the adjacency list from the edge list and prints each vertex's neighbours and degree. The lists are sorted once they are built, because the order inside a list is only the order the edges happened to arrive in; sorting makes the output the same whatever that order was. Two language traps sit in the first line of the builder. In Python, `[[]] * n` makes n references to one shared list, so every append would land in every vertex; use a comprehension. In JavaScript, `new Array(n).fill([])` has the same flaw; use `Array.from` with a function, which creates a fresh array per vertex.

```cpp
#include <algorithm>
#include <iostream>
#include <vector>
using namespace std;

// One list per vertex: adj[u] holds the neighbours of u.
vector<vector<int>> buildAdjacencyList(int n, const vector<vector<int>>& edges) {
    vector<vector<int>> adj(n);
    for (const vector<int>& e : edges) {
        adj[e[0]].push_back(e[1]);  // undirected: store the edge from both ends
        adj[e[1]].push_back(e[0]);
    }
    for (vector<int>& list : adj) sort(list.begin(), list.end());  // the order edges arrived in means nothing
    return adj;
}

int main() {
    int n = 5;
    vector<vector<int>> edges = {{0, 1}, {0, 2}, {1, 2}, {1, 3}, {2, 4}, {3, 4}};
    vector<vector<int>> adj = buildAdjacencyList(n, edges);
    int degreeSum = 0;
    for (int u = 0; u < n; u++) {
        // A vertex's degree is the length of its list.
        cout << "Vertex " << u << ": neighbours";
        for (int v : adj[u]) cout << " " << v;
        cout << ", degree " << adj[u].size() << "\n";
        degreeSum += (int)adj[u].size();
    }
    cout << "Sum of degrees: " << degreeSum << " (twice the " << edges.size() << " edges)\n";
    return 0;
}
```

```java
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Main {
    // One list per vertex: adj.get(u) holds the neighbours of u.
    static List<List<Integer>> buildAdjacencyList(int n, int[][] edges) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int u = 0; u < n; u++) adj.add(new ArrayList<>());
        for (int[] e : edges) {
            adj.get(e[0]).add(e[1]); // undirected: store the edge from both ends
            adj.get(e[1]).add(e[0]);
        }
        for (List<Integer> list : adj) Collections.sort(list); // the order edges arrived in means nothing
        return adj;
    }

    public static void main(String[] args) {
        int n = 5;
        int[][] edges = {{0, 1}, {0, 2}, {1, 2}, {1, 3}, {2, 4}, {3, 4}};
        List<List<Integer>> adj = buildAdjacencyList(n, edges);
        int degreeSum = 0;
        for (int u = 0; u < n; u++) {
            // A vertex's degree is the length of its list.
            StringBuilder line = new StringBuilder("Vertex " + u + ": neighbours");
            for (int v : adj.get(u)) line.append(" ").append(v);
            line.append(", degree ").append(adj.get(u).size());
            System.out.println(line);
            degreeSum += adj.get(u).size();
        }
        System.out.println("Sum of degrees: " + degreeSum + " (twice the " + edges.length + " edges)");
    }
}
```

```python
def build_adjacency_list(n, edges):
    """One list per vertex: adj[u] holds the neighbours of u."""
    adj = [[] for _ in range(n)]  # never [[]] * n, which shares one list
    for u, v in edges:
        adj[u].append(v)  # undirected: store the edge from both ends
        adj[v].append(u)
    for neighbours in adj:
        neighbours.sort()  # the order edges arrived in means nothing
    return adj


n = 5
edges = [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 4]]
adj = build_adjacency_list(n, edges)
degree_sum = 0
for u in range(n):
    # A vertex's degree is the length of its list.
    print(f"Vertex {u}: neighbours {' '.join(map(str, adj[u]))}, degree {len(adj[u])}")
    degree_sum += len(adj[u])
print(f"Sum of degrees: {degree_sum} (twice the {len(edges)} edges)")
```

```javascript
// One list per vertex: adj[u] holds the neighbours of u.
function buildAdjacencyList(n, edges) {
  const adj = Array.from({ length: n }, () => []); // never new Array(n).fill([])
  for (const [u, v] of edges) {
    adj[u].push(v); // undirected: store the edge from both ends
    adj[v].push(u);
  }
  for (const list of adj) list.sort((a, b) => a - b); // the order edges arrived in means nothing
  return adj;
}

const n = 5;
const edges = [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 4]];
const adj = buildAdjacencyList(n, edges);
let degreeSum = 0;
for (let u = 0; u < n; u++) {
  // A vertex's degree is the length of its list.
  console.log(`Vertex ${u}: neighbours ${adj[u].join(" ")}, degree ${adj[u].length}`);
  degreeSum += adj[u].length;
}
console.log(`Sum of degrees: ${degreeSum} (twice the ${edges.length} edges)`);
```

```output
Vertex 0: neighbours 1 2, degree 2
Vertex 1: neighbours 0 2 3, degree 3
Vertex 2: neighbours 0 1 4, degree 3
Vertex 3: neighbours 1 4, degree 2
Vertex 4: neighbours 2 3, degree 2
Sum of degrees: 12 (twice the 6 edges)
```

Note the comparator in the JavaScript sort. Without it, `sort` compares numbers as strings, so 10 would come before 9 as soon as a graph had ten vertices.

## Directed and weighted graphs in a matrix

A weighted graph stores the weight where an unweighted one stores 1, and a directed graph fills only the cell of the edge's direction, so its matrix is no longer symmetric. The program stores five one-way roads with their lengths, prints the matrix with a dot for "no road", reads each vertex's out-degree from its row and its in-degree from its column, and checks two edges with one lookup each. The checks show what direction means: there is a road from 2 to 1, but none from 1 to 2.

Zero stands for "no edge" here because every weight is positive. When a weight of 0 is possible, mark missing edges with a value no edge can have, such as a very large number standing for infinity, which is also what shortest-path algorithms on a matrix expect.

```cpp
#include <iomanip>
#include <iostream>
#include <vector>
using namespace std;

const int NO_EDGE = 0;  // safe because every weight here is positive

int main() {
    int n = 4;
    // {from, to, weight}: one-way roads and their lengths
    vector<vector<int>> edges = {{0, 1, 4}, {0, 2, 1}, {2, 1, 2}, {1, 3, 5}, {2, 3, 8}};

    vector<vector<int>> matrix(n, vector<int>(n, NO_EDGE));
    for (const vector<int>& e : edges) matrix[e[0]][e[1]] = e[2];  // directed: only the u -> v cell

    cout << "  ";
    for (int v = 0; v < n; v++) cout << setw(3) << v;
    cout << "\n";
    for (int u = 0; u < n; u++) {
        cout << u << " ";
        for (int v = 0; v < n; v++) {
            if (matrix[u][v] == NO_EDGE) cout << setw(3) << ".";
            else cout << setw(3) << matrix[u][v];
        }
        cout << "\n";
    }

    for (int u = 0; u < n; u++) {
        int outDegree = 0, inDegree = 0;
        for (int v = 0; v < n; v++) {
            if (matrix[u][v] != NO_EDGE) outDegree++;  // row u: edges leaving u
            if (matrix[v][u] != NO_EDGE) inDegree++;   // column u: edges arriving at u
        }
        cout << "Vertex " << u << ": out-degree " << outDegree << ", in-degree " << inDegree << "\n";
    }

    int checks[2][2] = {{2, 1}, {1, 2}};
    for (const auto& q : checks) {
        int w = matrix[q[0]][q[1]];  // one cell: an O(1) check
        cout << "Edge " << q[0] << " -> " << q[1] << ": ";
        if (w == NO_EDGE) cout << "no\n";
        else cout << "yes, weight " << w << "\n";
    }
    return 0;
}
```

```java
public class Main {
    static final int NO_EDGE = 0; // safe because every weight here is positive

    public static void main(String[] args) {
        int n = 4;
        // {from, to, weight}: one-way roads and their lengths
        int[][] edges = {{0, 1, 4}, {0, 2, 1}, {2, 1, 2}, {1, 3, 5}, {2, 3, 8}};

        int[][] matrix = new int[n][n]; // Java fills it with 0, which is NO_EDGE
        for (int[] e : edges) matrix[e[0]][e[1]] = e[2]; // directed: only the u -> v cell

        StringBuilder header = new StringBuilder("  ");
        for (int v = 0; v < n; v++) header.append(String.format("%3d", v));
        System.out.println(header);
        for (int u = 0; u < n; u++) {
            StringBuilder row = new StringBuilder(u + " ");
            for (int v = 0; v < n; v++) {
                row.append(String.format("%3s", matrix[u][v] == NO_EDGE ? "." : String.valueOf(matrix[u][v])));
            }
            System.out.println(row);
        }

        for (int u = 0; u < n; u++) {
            int outDegree = 0, inDegree = 0;
            for (int v = 0; v < n; v++) {
                if (matrix[u][v] != NO_EDGE) outDegree++; // row u: edges leaving u
                if (matrix[v][u] != NO_EDGE) inDegree++;  // column u: edges arriving at u
            }
            System.out.println("Vertex " + u + ": out-degree " + outDegree + ", in-degree " + inDegree);
        }

        int[][] checks = {{2, 1}, {1, 2}};
        for (int[] q : checks) {
            int w = matrix[q[0]][q[1]]; // one cell: an O(1) check
            System.out.println("Edge " + q[0] + " -> " + q[1] + ": " + (w == NO_EDGE ? "no" : "yes, weight " + w));
        }
    }
}
```

```python
NO_EDGE = 0  # safe because every weight here is positive

n = 4
# (from, to, weight): one-way roads and their lengths
edges = [(0, 1, 4), (0, 2, 1), (2, 1, 2), (1, 3, 5), (2, 3, 8)]

matrix = [[NO_EDGE] * n for _ in range(n)]
for u, v, w in edges:
    matrix[u][v] = w  # directed: only the u -> v cell

print("  " + "".join(f"{v:>3}" for v in range(n)))
for u in range(n):
    cells = ("." if matrix[u][v] == NO_EDGE else str(matrix[u][v]) for v in range(n))
    print(f"{u} " + "".join(f"{c:>3}" for c in cells))

for u in range(n):
    out_degree = sum(1 for v in range(n) if matrix[u][v] != NO_EDGE)  # row u: edges leaving u
    in_degree = sum(1 for v in range(n) if matrix[v][u] != NO_EDGE)   # column u: edges arriving at u
    print(f"Vertex {u}: out-degree {out_degree}, in-degree {in_degree}")

for u, v in [(2, 1), (1, 2)]:
    w = matrix[u][v]  # one cell: an O(1) check
    print(f"Edge {u} -> {v}: " + ("no" if w == NO_EDGE else f"yes, weight {w}"))
```

```javascript
const NO_EDGE = 0; // safe because every weight here is positive

const n = 4;
// [from, to, weight]: one-way roads and their lengths
const edges = [[0, 1, 4], [0, 2, 1], [2, 1, 2], [1, 3, 5], [2, 3, 8]];

const matrix = Array.from({ length: n }, () => new Array(n).fill(NO_EDGE));
for (const [u, v, w] of edges) matrix[u][v] = w; // directed: only the u -> v cell

let header = "  ";
for (let v = 0; v < n; v++) header += String(v).padStart(3);
console.log(header);
for (let u = 0; u < n; u++) {
  let row = `${u} `;
  for (let v = 0; v < n; v++) row += (matrix[u][v] === NO_EDGE ? "." : String(matrix[u][v])).padStart(3);
  console.log(row);
}

for (let u = 0; u < n; u++) {
  let outDegree = 0;
  let inDegree = 0;
  for (let v = 0; v < n; v++) {
    if (matrix[u][v] !== NO_EDGE) outDegree++; // row u: edges leaving u
    if (matrix[v][u] !== NO_EDGE) inDegree++; // column u: edges arriving at u
  }
  console.log(`Vertex ${u}: out-degree ${outDegree}, in-degree ${inDegree}`);
}

for (const [u, v] of [[2, 1], [1, 2]]) {
  const w = matrix[u][v]; // one cell: an O(1) check
  console.log(`Edge ${u} -> ${v}: ${w === NO_EDGE ? "no" : `yes, weight ${w}`}`);
}
```

```output
    0  1  2  3
0   .  4  1  .
1   .  .  .  5
2   .  2  .  8
3   .  .  .  .
Vertex 0: out-degree 2, in-degree 0
Vertex 1: out-degree 1, in-degree 2
Vertex 2: out-degree 2, in-degree 1
Vertex 3: out-degree 0, in-degree 2
Edge 2 -> 1: yes, weight 2
Edge 1 -> 2: no
```

The out-degrees add up to 5 and so do the in-degrees: one each per edge. Vertex 0 has in-degree 0, so nothing leads to it, and vertex 3 has out-degree 0, so nothing leads out of it. In a dependency graph those are the tasks that can start at once and the tasks that nothing else waits for. The adjacency-list form of a weighted graph stores pairs instead of plain vertices: `adj[u]` holds (v, weight) for every edge leaving u, which is the form Dijkstra's algorithm reads.

## Grids and other hidden graphs

Many graph problems never say "graph". The commonest disguise is a **grid**. Each cell is a vertex, joined to the cells directly above, below, left and right of it, as long as they are inside the grid and passable. You never build an adjacency list for a grid; you work out the neighbours when you need them, with a small table of direction offsets:

```text
 directions = up (-1, 0), down (1, 0), left (0, -1), right (0, 1)

 for each (dr, dc) in directions:
     nr, nc = r + dr, c + dc
     if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] is open:
         (nr, nc) is a neighbour of (r, c)
```

The bounds check comes before the grid lookup on purpose: reading `grid[-1][c]` is undefined behaviour in C++, an exception in Java and JavaScript, and a silent read of the last row in Python. An R × C grid is a graph with V = R × C vertices and fewer than 2 × R × C edges, so a traversal of it costs O(R × C). Some problems allow diagonal moves too, which makes eight directions instead of four; [Shortest Path in Binary Matrix](/problems/shortest-path-in-binary-matrix) is one. The [matrix](/roadmap/matrix) lesson covers grid indexing in more depth.

The second disguise is a **state graph**. When a problem asks for the fewest moves that turn one configuration into another, each configuration is a vertex and each legal move is an edge. In [Open the Lock](/problems/open-the-lock) the vertices are the 10,000 four-digit codes, and each code leads to 8 others by turning one of its four wheels up or down. In [Word Ladder](/problems/word-ladder) the words are the vertices, and two words are joined when they differ in exactly one letter. The graph is never written down; the neighbours are generated on the fly, just as in a grid.

The third disguise is a relation that already sits in the input. [Keys and Rooms](/problems/keys-and-rooms) gives you, for each room, the keys lying in it. That is an adjacency list already: a directed edge from each room to every room its keys unlock.

## How to recognise a graph problem

Read the statement for these signals:

- The input is a list of pairs `[a, b]`, often with an `n` for the number of items.
- The words connection, network, friend, road, flight, link, neighbour or reachable.
- Dependencies: "must be done before", "prerequisite", "depends on". That is a directed graph, very likely meant to be a DAG.
- A grid of cells you move through up, down, left and right, or regions of touching cells.
- "The fewest moves, steps or changes" from one configuration to another: a state graph.

Then the question tells you which tool to reach for:

| The question asks | The tool |
| --- | --- |
| Can a reach b? How many separate groups are there? | Breadth-first or depth-first search |
| The fewest edges from a to b | Breadth-first search |
| The cheapest route when edges have weights | Dijkstra's algorithm |
| An order that respects dependencies, or whether one exists | Topological sort |
| Groups that merge as connections arrive | [Union-find](/roadmap/union-find) |
| The cheapest set of edges that connects everything | Minimum spanning tree |

## Common mistakes

- **Storing an undirected edge once.** Append to both lists. Otherwise the search can walk the edge in one direction and not the other, and half the answers come out wrong.
- **Sharing one list between all the vertices.** `[[]] * n` in Python and `new Array(n).fill([])` in JavaScript create one list and refer to it n times, so every append appears in every vertex's list.
- **Off-by-one labels.** When vertices are numbered 1 to n, size the arrays n + 1 or subtract 1 from each label as you read it. Mixing the two conventions is a classic wrong answer.
- **A matrix for a large sparse graph.** With V = 10⁵ a matrix cannot fit in memory. Check the constraints before choosing.
- **Assuming the graph is connected.** Unless the statement promises it, some vertices may have no edges at all and never appear in the edge list. Loop over every vertex from 0 to n − 1, not only the ones you have seen.
- **Miscounting self-loops and repeated edges.** In an undirected graph a self-loop adds 2 to its vertex's degree and a repeated edge counts twice. If the constraints allow them, decide what the problem wants before you count.

## Practice in this order

These start with problems that need nothing but degrees and end with your first traversals:

1. [Find Center of Star Graph](/problems/find-center-of-star-graph): degree alone; the centre is the vertex on every edge.
2. [Find the Town Judge](/problems/find-the-town-judge): in-degree and out-degree of a directed graph.
3. [Find Champion II](/problems/find-champion-ii): the vertex with in-degree 0, and what it means when there are two.
4. [Find if Path Exists in Graph](/problems/find-if-path-exists-in-graph): build an adjacency list, then a first traversal.
5. [Minimum Number of Vertices to Reach All Nodes](/problems/minimum-number-of-vertices-to-reach-all-nodes): why every vertex with in-degree 0 must be chosen, and why that is enough.
6. [Maximal Network Rank](/problems/maximal-network-rank): degrees plus a constant-time edge check.
7. [Keys and Rooms](/problems/keys-and-rooms): an adjacency list hiding in the input.
8. [Number of Provinces](/problems/number-of-provinces): counting the components of a graph given as a matrix.

The [graph problem list](/challenges/graph) has every graph problem in the catalogue, from easy to hard. Once building a graph feels automatic, move on to the first way of searching one: [breadth-first search](/roadmap/breadth-first-search).
