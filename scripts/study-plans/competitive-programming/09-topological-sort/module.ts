import { defineModule } from "../../dsl.js";
import { dagPaths, lexTopo, longestDag, semesters } from "./cases.js";

export default defineModule(import.meta.url, {
  slug: "topological-sort",
  title: "Topological sort and DAGs",
  blurb: "Kahn's algorithm with in-degrees, a min-heap for the smallest order, the cycle test by count, and dynamic programming in topological order: longest paths, path counts, semesters.",
  icon: "layers",
  overview: `Whenever a statement says "a must come before b" — courses and prerequisites, build steps, tasks with dependencies — the graph is directed and the question is about a topological order. One exists exactly when there is no cycle, and Kahn's algorithm finds one, or proves there is none, in O(V + E).

The lesson animates Kahn's algorithm peeling six courses with a min-heap — the in-degrees falling, each course joining the ready set the moment it has nothing left to wait for — and then turns the order into a schedule for dynamic programming: longest path, number of paths and fewest semesters are each one relaxation per edge. A game puts the algorithm's steps back in order.

The exercises print the lexicographically smallest course order or \`IMPOSSIBLE\`, and the longest weighted path in a DAG. The timed checkpoint asks for the fewest semesters and the number of paths from 1 to n modulo 10^9 + 7.`,
  lessons: [
    {
      slug: "kahns-algorithm",
      file: "01-kahns-algorithm.md",
      exercises: [
        {
          title: "The smallest course order",
          prompt: `There are \`n\` courses \`1\` to \`n\` and \`m\` rules \`a b\`, each meaning course \`a\` must be taken before course \`b\`. Print an order that takes every course after all of its prerequisites; among all such orders, print the lexicographically smallest (compare the first course, then the second, …). Print \`IMPOSSIBLE\` if no order exists.

**Input:** \`n m\`, then \`m\` lines \`a b\` (\`1 ≤ n ≤ 10^5\`, \`0 ≤ m ≤ 2·10^5\`, \`a ≠ b\`).
**Output:** the \`n\` courses on one line separated by spaces, or \`IMPOSSIBLE\`.

\`\`\`text
6 7
3 1
3 4
2 4
4 6
1 6
6 5
1 5
\`\`\`
prints
\`\`\`text
2 3 1 4 6 5
\`\`\``,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    vector<int> indeg(n + 1, 0);
    // TODO: read the rules, then Kahn's algorithm with a min-heap of ready courses
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    vector<int> indeg(n + 1, 0);
    for (int i = 0; i < m; ++i) {
        int a, b;
        cin >> a >> b;
        adj[a].push_back(b);
        ++indeg[b];
    }
    priority_queue<int, vector<int>, greater<>> ready;
    for (int v = 1; v <= n; ++v)
        if (indeg[v] == 0) ready.push(v);
    vector<int> order;
    order.reserve(n);
    while (!ready.empty()) {
        int u = ready.top();
        ready.pop();
        order.push_back(u);
        for (int v : adj[u])
            if (--indeg[v] == 0) ready.push(v);
    }
    if ((int)order.size() < n) {
        cout << "IMPOSSIBLE\n";
        return 0;
    }
    for (int i = 0; i < n; ++i) cout << order[i] << (i + 1 == n ? '\n' : ' ');
    return 0;
}
`,
          hints: [
            "A course is ready when all its prerequisites are taken — when its in-degree among the remaining courses is 0.",
            "To make the order lexicographically smallest, always take the smallest ready course: a min-heap, `priority_queue<int, vector<int>, greater<>>`.",
            "If the heap empties before all n courses are placed, the rest sit on a cycle: print IMPOSSIBLE.",
          ],
          cases: lexTopo,
        },
        {
          title: "The longest path in a DAG",
          prompt: `A directed acyclic graph has vertices \`1\` to \`n\` and \`m\` weighted edges. Print the largest total weight of any path (a path may start and end anywhere; a single vertex is a path of weight \`0\`).

**Input:** \`n m\`, then \`m\` lines \`u v w\` (\`1 ≤ n ≤ 10^5\`, \`0 ≤ m ≤ 2·10^5\`, \`1 ≤ w ≤ 10^9\`). The graph has no cycle.
**Output:** one integer.

\`\`\`text
5 6
1 2 3
1 3 2
2 4 4
3 4 6
4 5 1
2 5 2
\`\`\`
prints
\`\`\`text
9
\`\`\`
The path \`1 → 3 → 4 → 5\` weighs 2 + 6 + 1.`,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    // TODO: a topological order (Kahn), then best[v] = max(best[v], best[u] + w) along it
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<vector<pair<int, ll>>> adj(n + 1);
    vector<int> indeg(n + 1, 0);
    for (int i = 0; i < m; ++i) {
        int u, v;
        ll w;
        cin >> u >> v >> w;
        adj[u].push_back({v, w});
        ++indeg[v];
    }
    queue<int> q;
    for (int v = 1; v <= n; ++v)
        if (indeg[v] == 0) q.push(v);
    vector<ll> best(n + 1, 0);
    ll answer = 0;
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        answer = max(answer, best[u]);
        for (auto [v, w] : adj[u]) {
            best[v] = max(best[v], best[u] + w);
            if (--indeg[v] == 0) q.push(v);
        }
    }
    cout << answer << '\n';
    return 0;
}
`,
          hints: [
            "Longest path is hard on general graphs but easy on a DAG: process vertices in topological order.",
            "best[v] is the heaviest path ending at v. Starting anywhere means every best starts at 0.",
            "When u is popped, every edge into u has been relaxed, so best[u] is final. Sums reach 10^14: long long.",
          ],
          cases: longestDag,
        },
      ],
      quiz: [
        {
          prompt: "A directed graph has a topological order exactly when…",
          options: ["it has no cycle", "it is connected", "every vertex has an out-edge", "it has no vertex of in-degree 0"],
          answer: 0,
          explanation: "On a cycle each vertex must come before the next, which is impossible all the way round; without a cycle Kahn's algorithm always finds an order. Connectivity is irrelevant, and a DAG always has an in-degree-0 vertex.",
        },
        {
          prompt: "Kahn's algorithm placed 7 of 10 vertices and the ready set is empty. What does that mean?",
          options: ["The graph has a cycle", "Three vertices are isolated", "The order is still valid", "The heap was the wrong type"],
          answer: 0,
          explanation: "Isolated vertices have in-degree 0 and would have been placed. The three left over each still wait for an edge from another leftover — they lie on a cycle or behind one.",
        },
        {
          prompt: "Which ready set makes Kahn's algorithm print the lexicographically smallest order?",
          options: ["A FIFO queue", "A stack", "A min-heap", "A max-heap"],
          answer: 2,
          explanation: "Taking the smallest ready vertex every time is the greedy choice that makes each position as small as possible. A queue or stack gives some valid order, not necessarily the smallest.",
        },
        {
          prompt: "Edges `1→2 (5)`, `1→3 (1)`, `3→2 (7)`. What is the longest path weight from 1?",
          options: ["5", "7", "8", "13"],
          answer: 2,
          explanation: "`1 → 3 → 2` weighs 1 + 7 = 8, more than `1 → 2` at 5. Relaxing in the order 1, 3, 2 finds it because 3 comes before 2.",
        },
      ],
    },
    {
      slug: "topological-sort-checkpoint",
      file: "02-checkpoint.md",
      kind: "test",
      passMark: 70,
      timeLimitMin: 45,
      exercises: [
        {
          title: "Fewest semesters",
          prompt: `There are \`n\` courses \`1\` to \`n\` and \`m\` rules \`a b\` (course \`a\` must be finished in an earlier semester than course \`b\`). Any number of courses can be taken in one semester. Print the fewest semesters needed to finish every course, or \`-1\` if it is impossible.

**Input:** \`n m\`, then \`m\` lines \`a b\` (\`1 ≤ n ≤ 10^5\`, \`0 ≤ m ≤ 2·10^5\`, \`a ≠ b\`).
**Output:** one integer.

\`\`\`text
5 4
1 3
2 3
3 4
2 5
\`\`\`
prints
\`\`\`text
3
\`\`\`
Semester 1: courses 1 and 2; semester 2: 3 and 5; semester 3: 4.`,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    // TODO: Kahn's algorithm with level[v] = max(level[v], level[u] + 1); -1 if a cycle blocks a course
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    vector<int> indeg(n + 1, 0);
    for (int i = 0; i < m; ++i) {
        int a, b;
        cin >> a >> b;
        adj[a].push_back(b);
        ++indeg[b];
    }
    queue<int> q;
    vector<int> level(n + 1, 1);
    for (int v = 1; v <= n; ++v)
        if (indeg[v] == 0) q.push(v);
    int placed = 0, answer = 0;
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        ++placed;
        answer = max(answer, level[u]);
        for (int v : adj[u]) {
            level[v] = max(level[v], level[u] + 1);
            if (--indeg[v] == 0) q.push(v);
        }
    }
    cout << (placed < n ? -1 : answer) << '\n';
    return 0;
}
`,
          hints: [
            "A course's semester is one more than the latest semester among its prerequisites.",
            "Compute it in topological order: when u is popped its level is final, so relax level[v] = max(level[v], level[u] + 1).",
            "Count the courses placed; fewer than n means a cycle, and the answer is -1.",
          ],
          cases: semesters,
        },
        {
          title: "Count the paths",
          prompt: `A directed acyclic graph has vertices \`1\` to \`n\` and \`m\` edges (no two edges are the same). Print the number of different paths from vertex \`1\` to vertex \`n\`, modulo \`10^9 + 7\`. (With \`n = 1\` there is one path, the empty one.)

**Input:** \`n m\`, then \`m\` lines \`u v\` (\`1 ≤ n ≤ 10^5\`, \`0 ≤ m ≤ 2·10^5\`). The graph has no cycle.
**Output:** one integer.

\`\`\`text
5 6
1 2
1 3
2 4
3 4
4 5
2 5
\`\`\`
prints
\`\`\`text
3
\`\`\`
The paths are \`1-2-4-5\`, \`1-3-4-5\` and \`1-2-5\`.`,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;
const ll MOD = 1'000'000'007;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    // TODO: ways[1] = 1, then add ways[u] into ways[v] along a topological order
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;
const ll MOD = 1'000'000'007;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<vector<int>> adj(n + 1);
    vector<int> indeg(n + 1, 0);
    for (int i = 0; i < m; ++i) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
        ++indeg[v];
    }
    queue<int> q;
    for (int v = 1; v <= n; ++v)
        if (indeg[v] == 0) q.push(v);
    vector<ll> ways(n + 1, 0);
    ways[1] = 1;
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        for (int v : adj[u]) {
            ways[v] = (ways[v] + ways[u]) % MOD;
            if (--indeg[v] == 0) q.push(v);
        }
    }
    cout << ways[n] << '\n';
    return 0;
}
`,
          hints: [
            "Every path to v ends with one edge u → v, so ways[v] is the sum of ways[u] over its in-edges.",
            "Process in topological order so ways[u] is complete before it is added anywhere. Vertices not reachable from 1 simply carry 0.",
            "Reduce modulo 10^9 + 7 after every addition; the counts grow exponentially.",
          ],
          cases: dagPaths,
        },
      ],
      quiz: [
        {
          prompt: "What is the time complexity of Kahn's algorithm with a FIFO queue?",
          options: ["O(V + E)", "O(V log V)", "O(V · E)", "O(E log E)"],
          answer: 0,
          explanation: "Each vertex is pushed and popped once and each edge decrements one in-degree once. A min-heap adds a log V factor.",
        },
        {
          prompt: "Why does a vertex on a cycle never reach in-degree 0 in Kahn's algorithm?",
          options: [
            "Its in-edge from the previous cycle vertex is only removed when that vertex is placed, and that vertex waits the same way",
            "Kahn's algorithm skips cycles on purpose",
            "Cycle vertices have no in-edges",
            "The queue overflows",
          ],
          answer: 0,
          explanation: "Every vertex of the cycle waits for its predecessor on the cycle, which waits for its own — no one goes first, so the count of placed vertices ends short.",
        },
        {
          prompt: "Rules `1→2`, `3→2`. Which order does Kahn's algorithm with a min-heap print?",
          options: ["1 3 2", "3 1 2", "1 2 3", "2 1 3"],
          answer: 0,
          explanation: "1 and 3 start ready; the heap gives 1 first, then 3, which brings 2's in-degree to 0. `1 2 3` breaks the rule 3 → 2.",
        },
        {
          prompt: "Longest path is NP-hard on general graphs. Why is it O(V + E) on a DAG?",
          options: [
            "In topological order every path into u is complete before u's edges are relaxed",
            "DAGs have at most V edges",
            "All DAG edges have weight 1",
            "Dijkstra works for longest paths on DAGs",
          ],
          answer: 0,
          explanation: "The order is a schedule for DP: best[u] is final when u comes up, so one relaxation per edge suffices. DAGs can have many edges, any weights, and Dijkstra's greedy settling does not work for maximisation.",
        },
        {
          prompt: "Rules `1→2`, `2→3`, `1→3`. Fewest semesters to take all three?",
          options: ["1", "2", "3", "Impossible"],
          answer: 2,
          explanation: "3 needs 2, which needs 1: levels 1, 2, 3. The extra rule 1 → 3 changes nothing.",
        },
        {
          prompt: "A DFS-based topological sort on a chain of 10^5 vertices crashes. The most likely cause?",
          options: ["Stack overflow from recursion depth 10^5", "Integer overflow", "The graph has a cycle", "The heap is too big"],
          answer: 0,
          explanation: "Recursive DFS goes one frame per vertex down the chain; a default stack often cannot hold 10^5 frames. Kahn's algorithm is iterative and has no such limit.",
        },
        {
          prompt: "Counting paths `1 → n` in a DAG, which update is right for edge `u → v`?",
          options: ["ways[v] += ways[u]", "ways[v] = max(ways[v], ways[u] + 1)", "ways[v] = ways[u]", "ways[u] += ways[v]"],
          answer: 0,
          explanation: "Each path to u extends by the edge into a path to v, and paths through different last edges are different, so the counts add.",
        },
        {
          prompt: "Kahn's algorithm, edges `5→1`, `5→2`, `1→2`, FIFO queue. What is `indeg[2]` at the start?",
          options: ["0", "1", "2", "3"],
          answer: 2,
          explanation: "Two edges point into 2: from 5 and from 1.",
        },
        {
          prompt: "Which problem is NOT a topological-sort problem?",
          options: [
            "Order build steps with dependencies",
            "Check whether course prerequisites are satisfiable",
            "Find the shortest path in an undirected weighted graph with cycles",
            "Count paths in a DAG",
          ],
          answer: 2,
          explanation: "Undirected graphs with cycles have no topological order; that is Dijkstra's territory. The others are all orders or DP over a DAG.",
        },
        {
          prompt: "You need any valid order and n = 10^6. Queue or min-heap?",
          options: ["A queue: O(V + E), and any order is accepted", "A min-heap: it is always required", "Either costs the same", "Neither works at that size"],
          answer: 0,
          explanation: "Only the lexicographically smallest order needs the heap and its log factor. When any order is accepted, a plain queue is faster.",
        },
      ],
    },
  ],
});
