---
title: Graph Data Structure
stage: graphs
order: 1
minutes: 12
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
A **graph** is the data structure for things and the connections between them: cities joined by roads, people joined by friendships, courses joined by prerequisites. An array lines its items up in a row and a tree hangs them from one root; a graph lets any item connect to any other. That is why so many interview questions are graph problems in disguise, and why the [breadth-first search](/roadmap/breadth-first-search) and [depth-first search](/roadmap/depth-first-search) lessons that follow this one matter so much.

A graph is a set of **vertices** (or nodes) and a set of **edges**, each joining two vertices. Problems usually number the vertices 0 to n − 1 and hand you the edges as a list of pairs. In formulas V and E stand for how many there are, so O(V + E) means work in proportion to both.

@figure vocabulary

Where the vertices sit on the page means nothing: a graph is only the record of who is joined to whom.

## The words every graph problem uses

Two vertices joined by an edge are **neighbours**, and a vertex's **degree** is the number of edges touching it. The sum in the figure is the **handshake lemma**: every edge adds 1 to the degree of each of its two ends, so the degrees always add up to 2E.

An **undirected** edge works both ways, like a friendship. A **directed** edge, 0 → 1, goes one way only, like a one-way street or "take course 0 before course 1", and each vertex then has an **in-degree** (edges arriving) and an **out-degree** (edges leaving). A **weighted** edge carries a number: a distance, a price, a time.

@figure kinds

The difference decides the algorithm. "Fewest edges" is a breadth-first search question; "cheapest total weight" belongs to [Dijkstra's algorithm](/roadmap/dijkstras-algorithm), because a route with more edges can cost less. Degrees alone solve some problems: the judge in [Find the Town Judge](/problems/find-the-town-judge) has in-degree n − 1 and out-degree 0.

- A **path** is a sequence of vertices, each joined to the next; its length counts edges. A **cycle** is a path that returns to its start without reusing an edge.
- A graph is **connected** when every vertex can reach every other; otherwise it falls apart into **connected components**, which is what [Number of Provinces](/problems/number-of-provinces) counts.
- A **DAG**, a directed acyclic graph, has no directed cycle. DAGs model dependencies, and every DAG has a [topological order](/roadmap/topological-sort).
- A **tree** is a connected undirected graph with no cycles, and it always has exactly V − 1 edges.

@figure tree-edges

A graph with close to V × (V − 1) / 2 edges is **dense**; one with E about the size of V is **sparse**, and interview graphs nearly always are.

## How a graph is stored

Every traversal asks one question over and over: *who are the neighbours of u?* The three standard layouts answer it at very different prices.

@figure three-stores

The edge list's O(E) scan is fatal in a search, which asks once per vertex: with V = 10⁵ and E = 2 × 10⁵ that is 2 × 10¹⁰ steps. The matrix's V² cells are fatal in memory: for V = 10⁵, about 40 GB. The **adjacency list** takes O(V + E) memory and answers in O(deg(u)), so it is the default for almost every graph problem. Building it is one pass over the edges, appending each undirected edge from both ends:

@walkthrough

## The operations and their cost

| Operation | Edge list | Adjacency matrix | Adjacency list |
| --- | --- | --- | --- |
| Memory | O(E) | O(V²) | O(V + E) |
| Is there an edge from u to v? | O(E) | O(1) | O(deg(u)) |
| List the neighbours of u | O(E) | O(V) | O(deg(u)) |
| A whole BFS or DFS | O(V × E) | O(V²) | O(V + E) |
| Add an edge | O(1) | O(1) | O(1) |

A traversal lists every vertex's neighbours once. On a list that costs the sum of the degrees, 2E, plus V for the vertices: O(V + E). On a matrix it reads V rows of V cells, O(V²). Reach for a matrix only for a small dense graph, an input that already is one, or many "is u joined to v?" checks, as in [Maximal Network Rank](/problems/maximal-network-rank).

### The code

The program builds the adjacency list and prints each vertex's neighbours and degree, sorting each list because the order inside it is only the order the edges arrived in. Watch the first line of the builder: in Python `[[]] * n`, and in JavaScript `new Array(n).fill([])`, would create one list shared by every vertex.

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

## Directed and weighted graphs in a matrix

A weighted graph stores the weight where an unweighted one stores 1, and a directed graph fills only the cell of the edge's direction, so its rows and columns answer different questions.

@figure directed-matrix

The program prints the matrix, reads out-degrees from rows and in-degrees from columns, and checks two edges with one lookup each. Zero means "no edge" only because every weight is positive; when 0 is a possible weight, mark missing edges with a value no edge can have, such as a large number standing for infinity. In list form a weighted graph stores pairs: `adj[u]` holds (v, weight), which is what Dijkstra's algorithm reads.

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

## Grids and other hidden graphs

Many graph problems never say "graph". The commonest disguise is a **grid**: each open cell is a vertex, and you work out its neighbours on the fly with four direction offsets.

@figure grid-graph

Check the bounds before you read the cell: `grid[-1][c]` is undefined behaviour in C++, an exception in Java and JavaScript, and a silent read of the last row in Python. A traversal of an R × C grid costs O(R × C); the [matrix](/roadmap/matrix) lesson covers grid indexing.

The second disguise is a **state graph**: each configuration is a vertex and each legal move an edge. In [Open the Lock](/problems/open-the-lock) the vertices are the 10,000 four-digit codes, each leading to 8 others.

## How to recognise a graph problem

- The input is a list of pairs `[a, b]`, often with an `n` for the number of items.
- The words connection, network, friend, road, flight, neighbour or reachable.
- Dependencies: "must be done before", "prerequisite". That is a directed graph, very likely a DAG.
- A grid of cells you move through, or "the fewest moves" from one configuration to another.

Then the question picks the tool:

| The question asks | The tool |
| --- | --- |
| Can a reach b? How many separate groups? | Breadth-first or depth-first search |
| The fewest edges from a to b | Breadth-first search |
| The cheapest route with weighted edges | Dijkstra's algorithm |
| An order that respects dependencies | Topological sort |
| Groups that merge as connections arrive | [Union-find](/roadmap/union-find) |

## Common mistakes

- **Storing an undirected edge once.** Append to both lists, or a search can cross the edge one way only.
- **Sharing one list between all the vertices.** Create a fresh list per vertex.
- **Off-by-one labels.** When vertices are numbered 1 to n, size the arrays n + 1.
- **A matrix for a large sparse graph.** With V = 10⁵ it cannot fit in memory.
- **Assuming the graph is connected.** Vertices with no edges never appear in the edge list; loop over every vertex from 0 to n − 1.

## Practice in this order

1. [Find Center of Star Graph](/problems/find-center-of-star-graph): degree alone; the centre is on every edge.
2. [Find the Town Judge](/problems/find-the-town-judge): in-degree and out-degree.
3. [Find Champion II](/problems/find-champion-ii): the vertex with in-degree 0, and what two of them mean.
4. [Find if Path Exists in Graph](/problems/find-if-path-exists-in-graph): build an adjacency list, then a first traversal.
5. [Minimum Number of Vertices to Reach All Nodes](/problems/minimum-number-of-vertices-to-reach-all-nodes): why every vertex with in-degree 0 must be chosen.
6. [Maximal Network Rank](/problems/maximal-network-rank): degrees plus a constant-time edge check.
7. [Keys and Rooms](/problems/keys-and-rooms): an adjacency list hiding in the input.
8. [Number of Provinces](/problems/number-of-provinces): components of a graph given as a matrix.

The [graph problem list](/challenges/graph) has every graph problem in the catalogue, easiest first. Next comes the first way of searching one: [breadth-first search](/roadmap/breadth-first-search).
