---
title: Disjoint set union — union by size and path compression
minutes: 14
seo-title: Disjoint Set Union in C++: Union by Size, Path Compression
description: DSU (union-find) in C++ for contests: a parent array, find with path compression, union by size, and the near-O(1) cost that makes connectivity queries cheap.
question: What is a disjoint set union (DSU)?
answer: A disjoint set union (DSU), also called union-find, keeps elements split into groups and answers "are a and b in the same group?" while groups merge. Each group is a tree stored in a parent array; `find` walks to the root that names the group and `unite` hangs one root under the other. With union by size and path compression both run in almost constant amortised time.
q: What is path compression in union-find?
a: During `find(x)`, every node on the walk from `x` to its root is re-pointed straight at the root, so the next `find` on any of them takes one step. It is one line in the recursive form: `return p[x] == x ? x : p[x] = find(p[x]);`.
q: Why use union by size or by rank?
a: Hanging the smaller tree under the larger one means an element only gets one link deeper when its group at least doubles, so no tree is ever taller than log2 n. Without it, uniting in a chain order builds a path of length n and every `find` costs O(n).
q: What is the time complexity of DSU with both optimisations?
a: O(α(n)) amortised per operation, where α is the inverse Ackermann function — at most 4 for any input that fits in memory. In practice, treat each `find` and `unite` as O(1); a contest with 2 × 10^5 operations runs in milliseconds.
q: How do you detect a cycle in an undirected graph with DSU?
a: Add the edges one at a time. Before uniting the endpoints of an edge, call `find` on both: if they already have the same root, the endpoints were connected before this edge, so the edge closes a cycle.
---
A DSU answers one question fast while groups keep merging: **are `a` and `b` connected yet?** Contest uses: components after each edge, cycle detection, Kruskal's minimum spanning tree, offline "merge these, then ask".

## The structure

- Each group is a **tree**; `p[x]` is one step from `x` towards its root, and a root is its own parent.
- The root **names** the group: `a` and `b` are together exactly when `find(a) == find(b)`.
- `sz[r]` is the number of elements under root `r` — read only at a root.

```cpp
struct DSU {
    vector<int> p, sz;
    DSU(int n) : p(n), sz(n, 1) { iota(p.begin(), p.end(), 0); }
    int find(int x) { return p[x] == x ? x : p[x] = find(p[x]); }
    bool unite(int a, int b) {
        a = find(a), b = find(b);
        if (a == b) return false;          // already together
        if (sz[a] < sz[b]) swap(a, b);     // a is the larger root
        p[b] = a;
        sz[a] += sz[b];
        return true;
    }
};
```

## Two rules keep it fast

- **Union by size**: the smaller root goes under the larger. An element only sinks one level when its group at least doubles, so a tree is never taller than log2 n.
- **Path compression**: `p[x] = find(p[x])` re-points every node it walks straight at the root.
- Together: amortised O(α(n)) per call — effectively constant. Either one alone is already O(log n).

@figure flatten

## Contest habits

- `unite` returning `false` **is** the cycle test: the edge joined two vertices that were already connected.
- Keep a running `components` counter: start at `n`, subtract one on every successful `unite`.
- The recursive `find` is fine at 2 × 10^5 *with* union by size (depth ≤ 18). Without it, a chain of 10^6 can overflow the stack.
- Index from 0 or convert 1-based input once at read time — never mix.

```game
type: pick
title: Will this DSU pass?
prompt: Each round describes a DSU. Pick what happens on 2 × 10^5 operations.
? Path compression only, no union by size.
* Fast: amortised O(log n) per operation
- Too slow: O(n) per find
> Path compression alone is already O(log n) amortised; adding union by size takes it to O(α(n)).
? Neither rule: unite(a, b) always sets p[find(b)] = find(a).
- Fast: the trees stay balanced by chance
* Too slow: uniting along a chain builds a path of length n
> unite(1,2), unite(1,3)… with the new root always under the old is fine, but the reverse order makes a path, and each find walks all of it.
? Union by size, recursive find, n = 2 × 10^5.
* Safe: no tree is taller than about 18
- Stack overflow: recursion is too deep
> Union by size bounds the height by log2 n, so the recursion depth is tiny.
? unite(a, b) returns false.
- a and b were in different sets
* a and b were already in the same set
> find gave both the same root, so nothing was merged — in a graph, the edge closed a cycle.
```

## More practice

- [Number of Provinces](/problems/number-of-provinces)
- [Redundant Connection](/problems/redundant-connection)
- [Number of Connected Components in an Undirected Graph](/problems/number-of-connected-components-in-an-undirected-graph)
- [Most Stones Removed with Same Row or Column](/problems/most-stones-removed-with-same-row-or-column)
- [Min Cost to Connect All Points](/problems/min-cost-to-connect-all-points)
