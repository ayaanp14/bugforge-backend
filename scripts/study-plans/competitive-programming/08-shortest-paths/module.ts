import { defineModule } from "../../dsl.js";
import { countPaths, dijkstra, gridBfs, zeroOne } from "./cases.js";

export default defineModule(import.meta.url, {
  slug: "shortest-paths",
  title: "Shortest paths: BFS, 0-1 BFS, Dijkstra",
  blurb: "Choose the algorithm from the weights — BFS for equal edges, 0-1 BFS with a deque, Dijkstra with a priority_queue and lazy deletion — and write it right under a clock.",
  icon: "branch",
  overview: `Shortest-path problems are the most common graph problems in contests, and most of them are lost on the choice of algorithm or on one line of Dijkstra. This module makes the choice a table — equal weights take BFS, 0/1 weights take 0-1 BFS, non-negative weights take Dijkstra, negative ones take Bellman–Ford — and then drills the contest Dijkstra until it is automatic: a \`priority_queue\` of \`{distance, vertex}\` with \`greater<>\`, lazy deletion with \`d > dist[u]\`, \`long long\` sums.

The lesson animates Dijkstra's frontier on six vertices — the heap's pairs, each vertex settling, the stale pairs thrown away — and plays a matching game on which algorithm a graph needs.

The exercises are a grid maze with BFS and a 0/1-weighted graph with a deque. The timed checkpoint asks for Dijkstra's distances to every vertex at weights up to 10^9, and the number of shortest paths modulo 10^9 + 7.`,
  lessons: [
    {
      slug: "dijkstra-and-0-1-bfs",
      file: "01-dijkstra-and-0-1-bfs.md",
      exercises: [
        {
          title: "Escape the grid",
          prompt: `A grid of \`R\` rows and \`C\` columns holds \`.\` (open), \`#\` (wall), exactly one \`S\` and exactly one \`T\`. Each move goes one cell up, down, left or right, onto any cell that is not a wall. Print the fewest moves from \`S\` to \`T\`, or \`-1\` if \`T\` cannot be reached.

**Input:** \`R C\`, then \`R\` lines of \`C\` characters (\`1 ≤ R, C ≤ 1000\`).
**Output:** one integer.

\`\`\`text
4 5
S..#.
.#...
...#T
.#...
\`\`\`
prints
\`\`\`text
6
\`\`\``,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int R, C;
    cin >> R >> C;
    vector<string> g(R);
    for (auto& row : g) cin >> row;
    // TODO: BFS from S over the four neighbours; dist = -1 means not seen yet
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int R, C;
    cin >> R >> C;
    vector<string> g(R);
    for (auto& row : g) cin >> row;
    int sr = 0, sc = 0, tr = 0, tc = 0;
    for (int r = 0; r < R; ++r)
        for (int c = 0; c < C; ++c) {
            if (g[r][c] == 'S') sr = r, sc = c;
            if (g[r][c] == 'T') tr = r, tc = c;
        }
    vector<vector<int>> dist(R, vector<int>(C, -1));
    queue<pair<int, int>> q;
    dist[sr][sc] = 0;
    q.push({sr, sc});
    const int dr[] = {1, -1, 0, 0}, dc[] = {0, 0, 1, -1};
    while (!q.empty()) {
        auto [r, c] = q.front();
        q.pop();
        for (int k = 0; k < 4; ++k) {
            int nr = r + dr[k], nc = c + dc[k];
            if (nr < 0 || nc < 0 || nr >= R || nc >= C || g[nr][nc] == '#' || dist[nr][nc] != -1) continue;
            dist[nr][nc] = dist[r][c] + 1;
            q.push({nr, nc});
        }
    }
    cout << dist[tr][tc] << '\n';
    return 0;
}
`,
          hints: [
            "Every move costs 1, so BFS from S gives the answer — no heap needed.",
            "Mark a cell's distance when you push it, not when you pop it, so no cell enters the queue twice.",
            "Two arrays `dr` and `dc` for the four directions keep the neighbour loop to one line; check the bounds before indexing.",
          ],
          cases: gridBfs,
        },
        {
          title: "Free corridors, paid doors",
          prompt: `A directed graph has vertices \`1\` to \`n\` and \`m\` edges, each of weight \`0\` or \`1\`. Print the shortest distance from vertex \`1\` to every vertex, \`-1\` for one that cannot be reached.

**Input:** \`n m\`, then \`m\` lines \`u v w\` with \`w\` in \`{0, 1}\` (\`1 ≤ n ≤ 2·10^5\`, \`0 ≤ m ≤ 2·10^5\`).
**Output:** \`n\` integers on one line, separated by spaces.

\`\`\`text
5 6
1 2 1
1 3 0
3 2 0
2 4 1
3 4 1
4 5 0
\`\`\`
prints
\`\`\`text
0 0 0 1 1
\`\`\``,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<vector<pair<int, int>>> adj(n + 1);
    for (int i = 0; i < m; ++i) {
        int u, v, w;
        cin >> u >> v >> w;
        adj[u].push_back({v, w});
    }
    // TODO: 0-1 BFS with a deque — a 0-edge to the front, a 1-edge to the back
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
    vector<vector<pair<int, int>>> adj(n + 1);
    for (int i = 0; i < m; ++i) {
        int u, v, w;
        cin >> u >> v >> w;
        adj[u].push_back({v, w});
    }
    const int INF = INT_MAX;
    vector<int> dist(n + 1, INF);
    deque<int> dq{1};
    dist[1] = 0;
    while (!dq.empty()) {
        int u = dq.front();
        dq.pop_front();
        for (auto [v, w] : adj[u])
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                if (w == 0) dq.push_front(v);
                else dq.push_back(v);
            }
    }
    for (int v = 1; v <= n; ++v) cout << (dist[v] == INF ? -1 : dist[v]) << (v == n ? '\n' : ' ');
    return 0;
}
`,
          hints: [
            "Dijkstra would work, but with only 0 and 1 weights a deque does it in O(V + E).",
            "A 0-edge leaves the distance unchanged, so the neighbour belongs at the front; a 1-edge adds one, so it goes to the back.",
            "Relax with `dist[u] + w < dist[v]` before pushing; a vertex may be pushed twice, and the check keeps that harmless. Print INF as -1.",
          ],
          cases: zeroOne,
        },
      ],
      quiz: [
        {
          prompt: "Every edge weighs 7. Which algorithm is the cheapest correct choice for shortest paths?",
          options: ["BFS, then multiply edge counts by 7", "Dijkstra", "Bellman–Ford", "0-1 BFS"],
          answer: 0,
          explanation: "With all weights equal, the fewest edges is the cheapest route, so BFS's edge counts times 7 are the distances in O(V + E). Dijkstra is correct but pays a log factor; Bellman–Ford is far slower; 0-1 BFS needs 0/1 weights.",
        },
        {
          prompt: "In `priority_queue<pair<ll,int>, vector<pair<ll,int>>, greater<>>`, what does `greater<>` do?",
          options: ["Makes `top()` the smallest pair", "Makes `top()` the largest pair", "Removes duplicates", "Sorts by the second member"],
          answer: 0,
          explanation: "The default `less` gives a max-heap; `greater` reverses it into a min-heap, so `top()` is the pair with the smallest distance (ties broken by vertex). Pairs still compare first member first.",
        },
        {
          prompt: "Dijkstra pops `(9, v)` but `dist[v]` is already `6`. What should happen?",
          options: ["Relax v's edges with 9", "Skip it: the pair is stale", "Set dist[v] = 9", "Stop the algorithm"],
          answer: 1,
          explanation: "A better pair `(6, v)` was pushed later and already processed. `(9, v)` is a leftover of lazy deletion; `if (d > dist[u]) continue;` skips it.",
        },
        {
          prompt: "In 0-1 BFS, where does a neighbour reached by a weight-0 edge go?",
          options: ["The back of the deque", "The front of the deque", "A separate priority_queue", "Nowhere until the deque empties"],
          answer: 1,
          explanation: "It has the same distance as the vertex just popped, which is the smallest in the deque, so it belongs at the front. A weight-1 neighbour goes to the back.",
        },
      ],
    },
    {
      slug: "shortest-paths-checkpoint",
      file: "02-checkpoint.md",
      kind: "test",
      passMark: 70,
      timeLimitMin: 45,
      exercises: [
        {
          title: "Dijkstra to every vertex",
          prompt: `A directed graph has vertices \`1\` to \`n\` and \`m\` weighted edges. Print the shortest distance from vertex \`1\` to every vertex, \`-1\` for one that cannot be reached.

**Input:** \`n m\`, then \`m\` lines \`u v w\` (\`1 ≤ n ≤ 10^5\`, \`0 ≤ m ≤ 2·10^5\`, \`1 ≤ w ≤ 10^9\`).
**Output:** \`n\` integers on one line, separated by spaces.

\`\`\`text
5 6
1 2 4
1 3 1
3 2 2
2 4 5
3 4 8
4 5 3
\`\`\`
prints
\`\`\`text
0 3 1 8 11
\`\`\``,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    // TODO: adjacency list, dist in long long, a min-heap of {dist, vertex}, lazy deletion
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
    for (int i = 0; i < m; ++i) {
        int u, v;
        ll w;
        cin >> u >> v >> w;
        adj[u].push_back({v, w});
    }
    vector<ll> dist(n + 1, LLONG_MAX);
    priority_queue<pair<ll, int>, vector<pair<ll, int>>, greater<>> pq;
    dist[1] = 0;
    pq.push({0, 1});
    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        if (d > dist[u]) continue;
        for (auto [v, w] : adj[u])
            if (d + w < dist[v]) {
                dist[v] = d + w;
                pq.push({dist[v], v});
            }
    }
    for (int v = 1; v <= n; ++v) cout << (dist[v] == LLONG_MAX ? -1 : dist[v]) << (v == n ? '\n' : ' ');
    return 0;
}
`,
          hints: [
            "Weights differ and are non-negative: Dijkstra with a priority_queue.",
            "Put the distance first in the pair and use greater<> so the smallest distance is on top.",
            "A path can be 10^5 edges of 10^9 — long long. Skip popped pairs with d > dist[u], and print LLONG_MAX as -1.",
          ],
          cases: dijkstra,
        },
        {
          title: "How many shortest routes",
          prompt: `A directed graph has vertices \`1\` to \`n\` and \`m\` weighted edges. Print the length of the shortest path from \`1\` to \`n\` and the number of different shortest paths modulo \`10^9 + 7\` (two paths differ when their edge sequences differ), separated by a space. Print \`-1\` alone if \`n\` cannot be reached.

**Input:** \`n m\`, then \`m\` lines \`u v w\` (\`1 ≤ n ≤ 10^5\`, \`0 ≤ m ≤ 2·10^5\`, \`1 ≤ w ≤ 10^9\`).
**Output:** one line.

\`\`\`text
4 5
1 2 1
1 3 1
2 4 1
3 4 1
1 4 3
\`\`\`
prints
\`\`\`text
2 2
\`\`\``,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;
const ll MOD = 1'000'000'007;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    // TODO: Dijkstra with ways[] beside dist[]: a shorter path copies ways[u], an equal one adds it
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
    vector<vector<pair<int, ll>>> adj(n + 1);
    for (int i = 0; i < m; ++i) {
        int u, v;
        ll w;
        cin >> u >> v >> w;
        adj[u].push_back({v, w});
    }
    vector<ll> dist(n + 1, LLONG_MAX), ways(n + 1, 0);
    priority_queue<pair<ll, int>, vector<pair<ll, int>>, greater<>> pq;
    dist[1] = 0;
    ways[1] = 1;
    pq.push({0, 1});
    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        if (d > dist[u]) continue;
        for (auto [v, w] : adj[u]) {
            if (d + w < dist[v]) {
                dist[v] = d + w;
                ways[v] = ways[u];
                pq.push({dist[v], v});
            } else if (d + w == dist[v]) {
                ways[v] = (ways[v] + ways[u]) % MOD;
            }
        }
    }
    if (dist[n] == LLONG_MAX) cout << -1 << '\n';
    else cout << dist[n] << ' ' << ways[n] << '\n';
    return 0;
}
`,
          hints: [
            "Run Dijkstra and keep ways[v] beside dist[v]; ways[1] = 1.",
            "Relaxing u → v: a strictly shorter distance replaces ways[v] with ways[u]; an equal distance adds ways[u] to it.",
            "Weights are positive, so every vertex that leads into u at the shortest distance is settled before u is popped — ways[u] is final when you use it.",
          ],
          cases: countPaths,
        },
      ],
      quiz: [
        {
          prompt: "Which weights make Dijkstra's algorithm give wrong answers?",
          options: ["Weights of 0", "Very large weights", "Negative weights", "Equal weights"],
          answer: 2,
          explanation: "Dijkstra settles the closest vertex for good; a negative edge found later could make a settled distance shorter. Zero, equal and large non-negative weights are all fine (large ones need long long).",
        },
        {
          prompt: "What is the time complexity of the contest Dijkstra with a binary heap and lazy deletion?",
          options: ["O(V + E)", "O((V + E) log V)", "O(V · E)", "O(V^2 log V)"],
          answer: 1,
          explanation: "Each edge can push one pair, so the heap sees O(E) pushes and pops at O(log E) = O(log V) each, plus O(V + E) for the scans.",
        },
        {
          prompt: "`pq.push({v, dist[v]})` with `greater<>` — what goes wrong?",
          options: ["Nothing", "The heap orders by vertex number, so vertices settle in the wrong order", "It does not compile", "It only fails when weights are 0"],
          answer: 1,
          explanation: "Pairs compare their first member first. With the vertex first, the smallest vertex number pops first, not the closest vertex, and the settled distances can be wrong.",
        },
        {
          prompt: "How many pairs can the lazy-deletion heap hold at most?",
          options: ["V", "About E (one push per successful relaxation, plus the source)", "V^2", "log V"],
          answer: 1,
          explanation: "A push happens only when an edge improves a distance, and each edge is relaxed once from its settled tail, so at most E + 1 pairs.",
        },
        {
          prompt: "A grid maze, moves cost 1, 10^6 cells. Which is the best choice?",
          options: ["BFS with a queue", "Dijkstra with a priority_queue", "Bellman–Ford", "DFS"],
          answer: 0,
          explanation: "Equal weights: BFS is O(cells) and gives distances directly. Dijkstra adds a log factor; DFS does not find shortest paths at all.",
        },
        {
          prompt: "In BFS on a grid, when should a cell's distance be set?",
          options: ["When it is pushed", "When it is popped", "After the BFS ends", "Only for the target"],
          answer: 0,
          explanation: "Setting it when pushed marks the cell as seen, so it never enters the queue twice. Setting it on pop lets the same cell be queued many times.",
        },
        {
          prompt: "What does 0-1 BFS keep true about its deque?",
          options: [
            "It is sorted by distance and holds at most two distinct values",
            "It holds every vertex exactly once",
            "Its back is always the closest vertex",
            "It is empty after the first pop",
          ],
          answer: 0,
          explanation: "Front pushes have distance d and back pushes d + 1, so the deque is ordered with values d and d + 1 only — its front is always a closest vertex. A vertex can be pushed more than once.",
        },
        {
          prompt: "A path has up to 10^5 edges of weight up to 10^9. Which type holds `dist`?",
          options: ["int", "long long", "float", "short"],
          answer: 1,
          explanation: "The sum can reach 10^14, past int's 2.1 × 10^9; float is inexact. long long holds up to about 9.2 × 10^18.",
        },
        {
          prompt: "You need shortest distances from many sources to one target in a directed graph. What is the standard trick?",
          options: [
            "Run Dijkstra from the target on the reversed graph",
            "Run Dijkstra from every source",
            "Use BFS",
            "Sort the edges",
          ],
          answer: 0,
          explanation: "Reversing every edge turns \"from v to target\" into \"from target to v\", so one Dijkstra gives every source's distance.",
        },
        {
          prompt: "When counting shortest paths with Dijkstra, relaxing `u → v` gives `d + w == dist[v]`. What do you do?",
          options: ["ways[v] = ways[u]", "ways[v] += ways[u]", "Push (dist[v], v) again", "Nothing"],
          answer: 1,
          explanation: "Another shortest route into v has been found through u, so its count adds to v's. Replacing is only for a strictly shorter distance, and no push is needed because the distance did not change.",
        },
      ],
    },
  ],
});
