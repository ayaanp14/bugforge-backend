import { defineModule } from "../../dsl.js";
import { componentsAfter, connQueries, firstCycle, kruskal } from "./cases.js";

const DSU = String.raw`struct DSU {
    vector<int> p, sz;
    DSU(int n) : p(n + 1), sz(n + 1, 1) { iota(p.begin(), p.end(), 0); }
    int find(int x) { return p[x] == x ? x : p[x] = find(p[x]); }
    bool unite(int a, int b) {
        a = find(a), b = find(b);
        if (a == b) return false;
        if (sz[a] < sz[b]) swap(a, b);
        p[b] = a;
        sz[a] += sz[b];
        return true;
    }
};`;

export default defineModule(import.meta.url, {
  slug: "disjoint-set-union",
  title: "Disjoint set union (DSU)",
  blurb: "Union-find in twelve lines: a parent array, path compression and union by size — components, cycle detection and Kruskal's minimum spanning tree at contest limits.",
  icon: "tree",
  overview: `Many graph problems only ever ask one question while edges keep arriving: are these two vertices connected yet? Running a BFS per question is O(n) each time; a disjoint set union answers it in effectively constant time.

The lesson builds the contest DSU — a parent array where each group is a tree named by its root, \`find\` with path compression, \`unite\` by size — and animates both rules on seven elements, so you can see a tree flatten. Then the habits: \`unite\` returning \`false\` is a cycle test, a running component counter, and why the recursive \`find\` is safe once union by size bounds the height.

The exercises count components and the largest group after every union, and find the first edge that closes a cycle. The timed checkpoint is Kruskal's minimum spanning tree with weights up to 10^9 and a stream of online "same set?" queries.`,
  lessons: [
    {
      slug: "dsu-union-by-size",
      file: "01-dsu-union-by-size.md",
      exercises: [
        {
          title: "Components after every union",
          prompt: `There are \`n\` people, numbered \`1\` to \`n\`, each in a group of their own. \`q\` times, two people \`u\` and \`v\` join groups (if they are already in the same group, nothing changes). After every join, print two numbers: how many groups there are, and the size of the largest group.

**Input:** \`n q\`, then \`q\` lines \`u v\` (\`1 ≤ n ≤ 2·10^5\`, \`1 ≤ q ≤ 2·10^5\`, \`1 ≤ u, v ≤ n\`; \`u = v\` is allowed).
**Output:** \`q\` lines \`<groups> <largest>\`.

\`\`\`text
6 5
1 2
3 4
2 1
2 4
5 6
\`\`\`
prints
\`\`\`text
5 2
4 2
4 2
3 4
2 4
\`\`\``,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;

// TODO: a DSU with find (path compression) and unite (by size) that returns whether it merged

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, q;
    cin >> n >> q;
    // TODO: groups starts at n and drops on every successful unite; largest only grows
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;

${DSU}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, q;
    cin >> n >> q;
    DSU d(n);
    int groups = n, largest = 1;
    while (q--) {
        int u, v;
        cin >> u >> v;
        if (d.unite(u, v)) {
            --groups;
            largest = max(largest, d.sz[d.find(u)]);
        }
        cout << groups << ' ' << largest << '\n';
    }
    return 0;
}
`,
          hints: [
            "Recomputing the groups with a BFS after every join is O(n) per query — far too slow at 2·10^5. Keep counters instead.",
            "A successful unite merges two groups into one, so the group count drops by exactly one; a failed unite changes nothing.",
            "Groups only merge, so the largest group never shrinks: compare it with the new root's size after each successful unite.",
          ],
          cases: componentsAfter,
        },
        {
          title: "The first edge that closes a cycle",
          prompt: `An undirected graph on vertices \`1\` to \`n\` receives \`m\` edges one at a time. Print the 1-based index of the first edge whose two endpoints were already connected before it arrived — the first edge that closes a cycle. A self-loop \`v v\` closes a cycle at once. Print \`-1\` when no edge does.

**Input:** \`n m\`, then \`m\` lines \`u v\` (\`1 ≤ n ≤ 2·10^5\`, \`0 ≤ m ≤ 2·10^5\`).
**Output:** one integer.

\`\`\`text
5 6
1 2
2 3
4 5
3 4
1 3
2 5
\`\`\`
prints
\`\`\`text
5
\`\`\`
Edge 5 (\`1 3\`) arrives after \`1 2\` and \`2 3\` have already connected 1 and 3.`,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    // TODO: read the edges in order; the first one whose unite fails is the answer
    cout << -1 << '\n';
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;

${DSU}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    DSU d(n);
    for (int i = 1; i <= m; ++i) {
        int u, v;
        cin >> u >> v;
        if (!d.unite(u, v)) {
            cout << i << '\n';
            return 0;
        }
    }
    cout << -1 << '\n';
    return 0;
}
`,
          hints: [
            "Two vertices are already connected exactly when find gives them the same root.",
            "unite already computes both roots — let it return false when they are equal, and that edge is the answer.",
            "A self-loop: find(v) == find(v), so the same test catches it without a special case. You may stop reading at the answer.",
          ],
          cases: firstCycle,
        },
      ],
      quiz: [
        {
          prompt: "After `p[x] = find(p[x])` runs on the walk `5 → 3 → 1 → 0` (0 the root), what is `p[5]`?",
          options: ["3", "1", "0", "5"],
          answer: 2,
          explanation: "Path compression re-points every node it walked at the root, so `p[5]`, `p[3]` and `p[1]` all become `0`. `3` was the old parent; `5` would make 5 a root of its own.",
        },
        {
          prompt: "Why does union by size keep every tree at most log2 n tall?",
          options: [
            "An element only sinks one level when its group at least doubles, which can happen at most log2 n times",
            "It sorts the elements before uniting them",
            "Path compression is applied to every element after each union",
            "It limits each root to two children",
          ],
          answer: 0,
          explanation: "When `x`'s root goes under another, the new group is at least twice the size of `x`'s old one. A group cannot double more than log2 n times before holding all n elements. No sorting or child limit is involved, and the bound holds without path compression.",
        },
        {
          prompt: "Edges arrive one at a time. Which test tells you edge `(u, v)` closes a cycle?",
          options: ["`sz[u] == sz[v]`", "`find(u) == find(v)` before uniting", "`p[u] == v`", "`find(u) != find(v)` after uniting"],
          answer: 1,
          explanation: "Same root before the edge means u and v were already connected, so the edge adds a second route — a cycle. Equal sizes say nothing about connection; `p[u] == v` checks one direct link only; after uniting, the roots are always equal.",
        },
        {
          prompt: "Starting from `n` singletons, you perform `k` calls of `unite` and `s` of them return `true`. How many groups are there?",
          options: ["`n - k`", "`n - s`", "`k - s`", "`n`"],
          answer: 1,
          explanation: "Only a successful unite merges two groups into one; a failed one (already together) changes nothing. So the count is `n - s`, not `n - k`.",
        },
      ],
    },
    {
      slug: "disjoint-set-union-checkpoint",
      file: "02-checkpoint.md",
      kind: "test",
      passMark: 70,
      timeLimitMin: 45,
      exercises: [
        {
          title: "Kruskal's minimum spanning tree",
          prompt: `A weighted undirected graph has vertices \`1\` to \`n\` and \`m\` edges. Print the total weight of a minimum spanning tree, or \`IMPOSSIBLE\` when the graph is not connected. (With \`n = 1\` the tree has no edges and weighs \`0\`.)

**Input:** \`n m\`, then \`m\` lines \`u v w\` (\`1 ≤ n ≤ 10^5\`, \`0 ≤ m ≤ 2·10^5\`, \`1 ≤ w ≤ 10^9\`; self-loops and parallel edges may appear).
**Output:** one line.

\`\`\`text
4 5
1 2 3
2 3 1
3 4 4
1 4 2
1 3 5
\`\`\`
prints
\`\`\`text
6
\`\`\`
The tree takes \`2-3\` (1), \`1-4\` (2) and \`1-2\` (3).`,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    // TODO: sort the edges by weight, unite cheapest first, count the edges taken
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

${DSU}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    cin >> n >> m;
    vector<array<int, 3>> edges(m);
    for (auto& [w, u, v] : edges) cin >> u >> v >> w;
    sort(edges.begin(), edges.end());
    DSU d(n);
    ll total = 0;
    int taken = 0;
    for (auto& [w, u, v] : edges)
        if (d.unite(u, v)) {
            total += w;
            ++taken;
        }
    if (taken == n - 1) cout << total << '\n';
    else cout << "IMPOSSIBLE\n";
    return 0;
}
`,
          hints: [
            "Kruskal: take edges cheapest first, and keep one only if it joins two different components.",
            "Store each edge with the weight first (`array<int,3>{w,u,v}`) so a plain sort orders by weight.",
            "The total of n − 1 weights up to 10^9 needs long long. The graph is connected exactly when n − 1 edges were taken.",
          ],
          cases: kruskal,
        },
        {
          title: "Union and query, online",
          prompt: `There are \`n\` elements \`1\` to \`n\`, each in its own set. Process \`q\` operations in order:

- \`U a b\` — merge the sets of \`a\` and \`b\`;
- \`Q a b\` — print \`YES\` if \`a\` and \`b\` are in the same set right now, \`NO\` otherwise.

**Input:** \`n q\`, then \`q\` lines (\`1 ≤ n, q ≤ 2·10^5\`). There is at least one \`Q\`.
**Output:** one line per \`Q\`.

\`\`\`text
5 6
Q 1 2
U 1 2
U 3 4
Q 2 1
U 2 4
Q 1 3
\`\`\`
prints
\`\`\`text
NO
YES
YES
\`\`\``,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, q;
    cin >> n >> q;
    // TODO: a DSU; U unites, Q compares roots
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;

${DSU}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, q;
    cin >> n >> q;
    DSU d(n);
    while (q--) {
        char op;
        int a, b;
        cin >> op >> a >> b;
        if (op == 'U') d.unite(a, b);
        else cout << (d.find(a) == d.find(b) ? "YES" : "NO") << '\n';
    }
    return 0;
}
`,
          hints: [
            "Read the operation as a char, then the two numbers.",
            "Same set means same root: compare find(a) and find(b).",
          ],
          cases: connQueries,
        },
      ],
      quiz: [
        {
          prompt: "In the contest DSU, what does `p[r] == r` mean?",
          options: ["r is a root and names its set", "r has no elements under it", "r has been deleted", "r was never united"],
          answer: 0,
          explanation: "A root is its own parent; it is the set's name. It may have many elements under it, and it may have been the winning side of many unites.",
        },
        {
          prompt: "What is the amortised cost per operation of a DSU with both path compression and union by size?",
          options: ["O(log n)", "O(α(n)), effectively constant", "O(1) worst case for every call", "O(n)"],
          answer: 1,
          explanation: "The inverse Ackermann bound α(n) is at most 4 for any realistic n. A single call can still walk a few links, so it is amortised, not worst-case O(1); either rule alone gives O(log n).",
        },
        {
          prompt: "Which `unite` makes a chain of length n when called as `unite(2,1), unite(3,2), …, unite(n,n-1)`?",
          options: [
            "One that always hangs the second argument's root under the first's",
            "One that hangs the smaller set's root under the larger's",
            "One with path compression and union by size",
            "None of them can build a chain",
          ],
          answer: 0,
          explanation: "Always putting `find(b)` under `find(a)` makes 1 under 2, 2 under 3, … — a path. Union by size would keep hanging the singleton under the big root, giving a star.",
        },
        {
          prompt: "`sz[x]` is correct for which elements?",
          options: ["Every element", "Only roots", "Only leaves", "Only elements united at least once"],
          answer: 1,
          explanation: "`unite` updates the size only at the surviving root; a non-root's `sz` is a stale value from when it was a root. Always read `sz[find(x)]`.",
        },
        {
          prompt: "Kruskal's algorithm on a graph with n vertices took only n − 3 edges. What do you know?",
          options: ["The graph has a cycle", "The graph has exactly 3 connected components", "The tree is still minimum; print the total", "An edge weight was negative"],
          answer: 1,
          explanation: "Each taken edge merges two components: n − (n − 3) = 3 components remain, so there is no spanning tree. Cycles only cause rejected edges, and negative weights are fine for Kruskal.",
        },
        {
          prompt: "Why does the recursive `find` not overflow the stack at n = 2·10^5 here?",
          options: [
            "The compiler always turns it into a loop",
            "Union by size keeps the depth at most about log2 n ≈ 18",
            "Path compression runs before the recursion",
            "The stack is unlimited on the judge",
          ],
          answer: 1,
          explanation: "With union by size no walk is longer than about 18 links, so the recursion is shallow. The recursive form is not tail-recursive (it assigns after the call), and stacks are limited.",
        },
        {
          prompt: "Edges `(1,2) (2,3) (3,1) (4,5)` arrive in that order. Which edge is the first to close a cycle?",
          options: ["the 2nd", "the 3rd", "the 4th", "none"],
          answer: 1,
          explanation: "After `(1,2)` and `(2,3)`, vertices 1 and 3 share a root, so `(3,1)` — the 3rd edge — finds them already connected.",
        },
        {
          prompt: "Kruskal sorts edges of weight up to 10^9 on n = 10^5 vertices. Which type should the total be?",
          options: ["int", "long long", "double", "unsigned int"],
          answer: 1,
          explanation: "Up to 10^5 − 1 edges of 10^9 sum to about 10^14, far past int and unsigned int; double would lose exactness past 2^53 in general. long long holds it exactly.",
        },
        {
          prompt: "You need the number of components after each of q edge additions. What is the total cost with a DSU?",
          options: ["O(q · n)", "O(q α(n)) plus O(n) to initialise", "O(n^2)", "O(q log q) for sorting"],
          answer: 1,
          explanation: "Each addition is one unite and a counter update — near-constant time. No sorting is needed, and no per-query BFS.",
        },
        {
          prompt: "Which problem can a plain DSU NOT answer as edges are added?",
          options: [
            "Are u and v connected?",
            "How large is u's component?",
            "Did this edge close a cycle?",
            "What is the shortest path from u to v?",
          ],
          answer: 3,
          explanation: "A DSU only knows which component an element is in and how big it is. Distances need a traversal — BFS or Dijkstra, the next module.",
        },
      ],
    },
  ],
});
