import { defineModule } from "../../dsl.js";
import { INVERSION_CASES, POINT_QUERY_CASES, RANGE_ADD_CASES } from "./cases.js";

export default defineModule(import.meta.url, {
  slug: "segment-tree-and-fenwick",
  title: "Segment trees and Fenwick trees",
  blurb: "Range queries with updates in O(log n): a segment tree for sums and minimums, a Fenwick tree in ten lines with i & -i, and counting inversions by value.",
  icon: "tree",
  overview: `Prefix sums answer a range in O(1) only while the array stands still. The moment updates and queries interleave — the shape of most data-structure problems at n, q = 2 × 10⁵ — you need both operations in O(log n).

The lesson builds the two structures contests use for that. A **segment tree** keeps the answer for every half-split range of the array, so a point update rewrites one leaf and its ancestors and a range query collects a handful of whole nodes; it works for any associative operation, minimum and maximum included. A **Fenwick tree** keeps prefix sums in one array where cell \`i\` covers the \`i & -i\` positions ending at \`i\` — ten lines, and the tool for counting when it is indexed by value instead of position.

The exercises are a segment tree answering sums and minimums under point updates and an inversion count with a Fenwick tree over compressed values. The timed checkpoint adds range add with range sum on two Fenwick trees.`,
  lessons: [
    {
      slug: "segment-trees-and-fenwick-trees",
      file: "01-segment-trees-and-fenwick-trees.md",
      exercises: [
        {
          title: "Point updates, range sums and minimums",
          prompt: `Read an array of \`n\` integers and answer \`q\` operations, each one of:

- \`1 i v\` — set \`a[i] = v\`;
- \`2 l r\` — print the sum and the minimum of \`a[l..r]\`, separated by a space.

Positions are 1-indexed. Build a **segment tree** that stores both the sum and the minimum of every node's range: each operation in O(log n).

**Constraints:** \`1 ≤ n, q ≤ 2 × 10^5\`, \`|a[i]|, |v| ≤ 10^9\`, \`1 ≤ l ≤ r ≤ n\`.
**Input:** \`n q\`, the \`n\` values, then \`q\` lines.
**Output:** one line per type-2 operation.

\`\`\`text
5 5
5 3 7 2 6
2 1 5
2 2 4
1 4 9
2 2 4
2 4 4
\`\`\`
prints
\`\`\`text
23 2
12 2
19 3
9 9
\`\`\``,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

int n;
vector<ll> sm, mn;   // 4n slots each; node v has children 2v and 2v + 1

void build(int v, int lo, int hi, const vector<ll>& a) {
    // TODO: a leaf takes a[lo]; otherwise build both halves and combine
}

void update(int v, int lo, int hi, int pos, ll val) {
    // TODO: walk down to the leaf, set it, recompute on the way back up
}

pair<ll, ll> query(int v, int lo, int hi, int l, int r) {
    // TODO: outside -> {0, LLONG_MAX}; inside -> the node; partial -> both children
    return {0, LLONG_MAX};
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int q;
    cin >> n >> q;
    vector<ll> a(n);
    for (auto& x : a) cin >> x;
    sm.assign(4 * n, 0);
    mn.assign(4 * n, LLONG_MAX);
    build(1, 0, n - 1, a);
    // TODO: read each operation and answer the type-2 ones
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

int n;
vector<ll> sm, mn;

void build(int v, int lo, int hi, const vector<ll>& a) {
    if (lo == hi) {
        sm[v] = mn[v] = a[lo];
        return;
    }
    int mid = (lo + hi) / 2;
    build(2 * v, lo, mid, a);
    build(2 * v + 1, mid + 1, hi, a);
    sm[v] = sm[2 * v] + sm[2 * v + 1];
    mn[v] = min(mn[2 * v], mn[2 * v + 1]);
}

void update(int v, int lo, int hi, int pos, ll val) {
    if (lo == hi) {
        sm[v] = mn[v] = val;
        return;
    }
    int mid = (lo + hi) / 2;
    if (pos <= mid) update(2 * v, lo, mid, pos, val);
    else update(2 * v + 1, mid + 1, hi, pos, val);
    sm[v] = sm[2 * v] + sm[2 * v + 1];
    mn[v] = min(mn[2 * v], mn[2 * v + 1]);
}

pair<ll, ll> query(int v, int lo, int hi, int l, int r) {
    if (r < lo || hi < l) return {0, LLONG_MAX};
    if (l <= lo && hi <= r) return {sm[v], mn[v]};
    int mid = (lo + hi) / 2;
    auto [s1, m1] = query(2 * v, lo, mid, l, r);
    auto [s2, m2] = query(2 * v + 1, mid + 1, hi, l, r);
    return {s1 + s2, min(m1, m2)};
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int q;
    cin >> n >> q;
    vector<ll> a(n);
    for (auto& x : a) cin >> x;
    sm.assign(4 * n, 0);
    mn.assign(4 * n, LLONG_MAX);
    build(1, 0, n - 1, a);
    while (q--) {
        int type;
        ll x, y;
        cin >> type >> x >> y;
        if (type == 1) {
            update(1, 0, n - 1, static_cast<int>(x) - 1, y);
        } else {
            auto [s, m] = query(1, 0, n - 1, static_cast<int>(x) - 1, static_cast<int>(y) - 1);
            cout << s << ' ' << m << '\n';
        }
    }
    return 0;
}
`,
          hints: [
            "Keep two arrays of 4n: one combines children with +, the other with min. Build, update and query walk the same nodes for both.",
            "An outside node must not disturb the answer: it returns 0 for the sum and LLONG_MAX for the minimum — each operation's identity.",
            "Sums of 2 × 10^5 values up to 10^9 reach 2 × 10^14, so the sums are long long; update in place after recursing so the parent sees the new children.",
          ],
          cases: POINT_QUERY_CASES,
        },
        {
          title: "Count inversions with a Fenwick tree",
          prompt: `Read \`n\` integers and print the number of **inversions**: pairs \`i < j\` with \`a[i] > a[j]\`.

Compress the values to ranks, then scan left to right with a **Fenwick tree** indexed by rank: before recording \`a[j]\`, the earlier elements greater than it are \`j − sum(rank(a[j]))\`. O(n log n) in all.

**Constraints:** \`1 ≤ n ≤ 2 × 10^5\`, \`1 ≤ a[i] ≤ 10^9\` (values may repeat; equal values are not an inversion).
**Input:** \`n\`, then the values.
**Output:** the count.

\`\`\`text
5
2 4 1 3 5
\`\`\`
prints \`3\` — the pairs (2, 1), (4, 1) and (4, 3).`,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

struct BIT {
    int n;
    vector<ll> f;
    BIT(int n) : n(n), f(n + 1, 0) {}
    void add(int i, ll x) { /* TODO: climb with i += i & -i */ }
    ll sum(int i) { /* TODO: descend with i -= i & -i */ return 0; }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<ll> a(n);
    for (auto& x : a) cin >> x;
    // TODO: sorted distinct copy of a; rank = lower_bound position + 1
    // TODO: for each a[j], add j - sum(rank) to the answer, then add(rank, 1)
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

struct BIT {
    int n;
    vector<ll> f;
    BIT(int n) : n(n), f(n + 1, 0) {}
    void add(int i, ll x) {
        for (; i <= n; i += i & -i) f[i] += x;
    }
    ll sum(int i) {
        ll s = 0;
        for (; i > 0; i -= i & -i) s += f[i];
        return s;
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<ll> a(n);
    for (auto& x : a) cin >> x;
    vector<ll> vals = a;
    sort(vals.begin(), vals.end());
    vals.erase(unique(vals.begin(), vals.end()), vals.end());
    BIT bit(static_cast<int>(vals.size()));
    ll inversions = 0;
    for (int j = 0; j < n; ++j) {
        int r = static_cast<int>(lower_bound(vals.begin(), vals.end(), a[j]) - vals.begin()) + 1;
        inversions += j - bit.sum(r);   // earlier elements strictly greater than a[j]
        bit.add(r, 1);
    }
    cout << inversions << '\n';
    return 0;
}
`,
          hints: [
            "Values up to 10^9 cannot index an array; sort a copy, unique it, and use lower_bound + 1 as a 1-based rank.",
            "sum(r) counts earlier elements with rank ≤ r — the ones that are not inversions with a[j], equal values included. The other j are.",
            "n = 2 × 10^5 gives up to about 2 × 10^10 inversions, which overflows int: keep the answer in long long.",
          ],
          cases: INVERSION_CASES,
        },
      ],
      quiz: [
        {
          prompt: "A segment tree over `n = 8` values answers `sum(1, 6)` (0-indexed). Which nodes does the query take whole?",
          options: ["`[1]`, `[2..3]`, `[4..5]`, `[6]`", "`[0..7]` minus `[0]` and `[7]`", "All eight leaves from 1 to 6", "`[0..3]` and `[4..7]`"],
          answer: 0,
          explanation: "The range splits into the largest nodes that fit inside it: leaf 1 (its sibling 0 is outside), node `[2..3]`, node `[4..5]` and leaf 6. A segment tree never subtracts, so `[0..7]` minus the ends is not how it works; taking every leaf would be O(n).",
        },
        {
          prompt: "What is `12 & -12`?",
          options: ["`4`", "`12`", "`8`", "`-12`"],
          answer: 0,
          explanation: "12 is `1100` in binary; in two's complement `-12` is `...0100`, so the AND keeps only the lowest set bit, `100` = 4. Fenwick cell 12 therefore covers the four positions 9..12.",
        },
        {
          prompt: "In a Fenwick tree with `n = 8`, which cells does `add(5, x)` change?",
          options: ["5, 6, 8", "5, 4, 0", "5 only", "1, 2, 4, 8"],
          answer: 0,
          explanation: "Climb with `i += i & -i`: 5 (lowest bit 1) → 6 (lowest bit 2) → 8 → 16, past n. Those are exactly the cells whose ranges contain position 5. Descending (5 → 4 → 0) is what `sum(5)` does.",
        },
        {
          prompt: "Why can't a Fenwick tree answer range **minimum** as `query(r) − query(l − 1)`, the way it answers sums?",
          options: [
            "A minimum cannot be undone: knowing the minimum of `1..r` and of `1..l−1` does not give the minimum of `l..r`",
            "Fenwick trees only store non-negative values",
            "`i & -i` is undefined for minimums",
            "It can; the subtraction just needs `long long`",
          ],
          answer: 0,
          explanation: "Range answers from prefixes need an inverse operation — subtraction for sums, XOR for XOR. Minimum has none: if the prefix minimum sits before `l`, it tells you nothing about `l..r`. That is the segment tree's job.",
        },
      ],
    },
    {
      slug: "segment-tree-and-fenwick-checkpoint",
      file: "02-checkpoint.md",
      kind: "test",
      passMark: 70,
      timeLimitMin: 60,
      exercises: [
        {
          title: "Range add, range sum",
          prompt: `Answer \`q\` operations on an array of \`n\` integers:

- \`1 l r v\` — add \`v\` to every \`a[i]\` with \`l ≤ i ≤ r\`;
- \`2 l r\` — print \`a[l] + … + a[r]\`.

Positions are 1-indexed. Use **two Fenwick trees** \`B1\`, \`B2\`: a range add is \`B1.add(l, v)\`, \`B1.add(r+1, −v)\`, \`B2.add(l, v·(l−1))\`, \`B2.add(r+1, −v·r)\`, and the prefix sum up to \`i\` is \`B1.sum(i)·i − B2.sum(i)\` plus the original prefix.

**Constraints:** \`1 ≤ n, q ≤ 2 × 10^5\`, \`|a[i]|, |v| ≤ 10^6\`.
**Input:** \`n q\`, the values, then \`q\` lines.
**Output:** one line per type-2 operation.

\`\`\`text
5 6
1 2 3 4 5
2 1 5
1 2 4 10
2 1 5
2 3 3
1 1 5 -1
2 4 5
\`\`\`
prints \`15\`, \`45\`, \`13\` and \`17\` on four lines.`,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

struct BIT {
    int n;
    vector<ll> f;
    BIT(int n) : n(n), f(n + 2, 0) {}
    void add(int i, ll x) { for (; i <= n; i += i & -i) f[i] += x; }
    ll sum(int i) { ll s = 0; for (; i > 0; i -= i & -i) s += f[i]; return s; }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, q;
    cin >> n >> q;
    // TODO: original prefix sums, two BITs, rangeAdd and prefix helpers
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

struct BIT {
    int n;
    vector<ll> f;
    BIT(int n) : n(n), f(n + 2, 0) {}
    void add(int i, ll x) {
        for (; i <= n; i += i & -i) f[i] += x;
    }
    ll sum(int i) {
        ll s = 0;
        for (; i > 0; i -= i & -i) s += f[i];
        return s;
    }
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, q;
    cin >> n >> q;
    vector<ll> pre(n + 1, 0);
    for (int i = 1; i <= n; ++i) {
        ll x;
        cin >> x;
        pre[i] = pre[i - 1] + x;
    }
    BIT b1(n), b2(n);
    auto prefix = [&](int i) { return pre[i] + b1.sum(i) * i - b2.sum(i); };
    while (q--) {
        int type, l, r;
        cin >> type >> l >> r;
        if (type == 1) {
            ll v;
            cin >> v;
            b1.add(l, v);
            b1.add(r + 1, -v);
            b2.add(l, v * (l - 1));
            b2.add(r + 1, -v * r);
        } else {
            cout << prefix(r) - prefix(l - 1) << '\n';
        }
    }
    return 0;
}
`,
          hints: [
            "B1 alone is the difference array of the additions: B1.sum(i) is how much has been added to position i.",
            "The added total over 1..i is B1.sum(i) · i minus a correction for the part of each add before its l — that correction is what B2 stores.",
            "add(r + 1, …) may reach n + 1; the loop's i <= n bound simply skips it. Keep v · r in long long.",
          ],
          cases: RANGE_ADD_CASES,
        },
      ],
      quiz: [
        {
          prompt: "Updates and queries interleave, n = q = 2 × 10^5. Why is rebuilding a prefix-sum array after each update too slow?",
          options: [
            "Each rebuild is O(n), so 2 × 10^5 of them is about 4 × 10^10 steps — far past the ~10^8 a second allows",
            "Prefix sums overflow `long long`",
            "Prefix sums cannot be stored for n above 10^5",
            "It is not too slow; O(n) per update is fine",
          ],
          answer: 0,
          explanation: "The budget lesson again: q · n = 4 × 10^10. O(log n) per operation is about 2 × 10^5 · 18 ≈ 3.6 × 10^6 steps.",
        },
        {
          prompt: "In a recursive segment tree for a **minimum**, what should a node completely outside the query range return?",
          options: ["The largest value the type holds (+∞)", "0", "The node's own minimum", "-1"],
          answer: 0,
          explanation: "An outside node must not change the combined answer, so it returns the identity of `min`: +∞ (`LLONG_MAX`). Returning 0 would wrongly win whenever every real value is positive.",
        },
        {
          prompt: "Why are `4n` slots allocated for a recursive segment tree with root 1?",
          options: [
            "The deepest index is below 2^(⌈log2 n⌉ + 1), which is always less than 4n",
            "Each element appears in exactly four nodes",
            "It stores four values per node",
            "2n would be enough; 4n is only tradition",
          ],
          answer: 0,
          explanation: "When n is not a power of two the tree is as deep as one over the next power, up to 2n leaves' worth; heap indexes then reach just under 4n. The bottom-up iterative layout is the one that fits in exactly 2n.",
        },
        {
          prompt: "How many nodes does a segment tree query visit, at most, per level?",
          options: ["About four", "Exactly one", "All nodes at that level", "log n"],
          answer: 0,
          explanation: "At each level at most two nodes are partially covered (the ones holding l and r), and each sends the query to two children, so about four are visited — O(log n) in all.",
        },
        {
          prompt: "Fenwick tree, n = 8. Which cells does `sum(7)` read?",
          options: ["7, 6, 4", "7, 8", "1 through 7", "4, 6, 7, 8"],
          answer: 0,
          explanation: "Descend with `i -= i & -i`: 7 → 6 → 4 → 0. Cell 7 covers 7, cell 6 covers 5..6, cell 4 covers 1..4: three disjoint ranges tiling 1..7.",
        },
        {
          prompt: "A Fenwick tree over positions 1..n. What does `sum(r) - sum(l - 1)` give?",
          options: ["The sum of `a[l..r]`", "The sum of `a[l+1..r]`", "The sum of `a[l..r-1]`", "Only `a[r] - a[l]`"],
          answer: 0,
          explanation: "`sum(r)` covers 1..r and `sum(l − 1)` covers 1..l−1; the difference is exactly l..r. Using `sum(l)` would drop `a[l]`.",
        },
        {
          prompt: "Counting inversions with a Fenwick tree, why compress the values to ranks first?",
          options: [
            "The tree is indexed by value, and values up to 10^9 would need a 10^9-cell array; ranks 1..n keep it at n cells",
            "Compression sorts the array, which removes the inversions",
            "Fenwick trees cannot hold duplicates",
            "It makes the answer fit in `int`",
          ],
          answer: 0,
          explanation: "Only the relative order matters for an inversion, so replacing each value by its rank among the distinct values keeps every comparison and shrinks the index range to at most n.",
        },
        {
          prompt: "Which operation can a plain Fenwick tree answer over a range `[l, r]` with point updates?",
          options: ["XOR of `a[l..r]`", "Maximum of `a[l..r]`", "GCD of `a[l..r]`", "Number of distinct values in `a[l..r]`"],
          answer: 0,
          explanation: "XOR is its own inverse, so `prefix(r) ^ prefix(l − 1)` is the range. Maximum and GCD cannot be undone, and distinct counts need an offline trick — segment-tree territory.",
        },
        {
          prompt: "Point update **and** range maximum, n = q = 2 × 10^5. The right tool is…",
          options: ["A segment tree", "A Fenwick tree with subtraction", "A prefix-maximum array", "A `std::map` of values"],
          answer: 0,
          explanation: "Maximum is associative but not invertible, which is exactly what a segment tree needs and a Fenwick range query cannot use. A prefix-maximum array breaks on the first update that lowers a value.",
        },
        {
          prompt: "In range-add/range-sum with two Fenwick trees, adding `v` to `[l, r]` does what to `B1`?",
          options: ["`B1.add(l, v)` and `B1.add(r + 1, -v)`", "`B1.add(l, v)` for every position in the range", "`B1.add(r, v)` only", "`B1.add(l, v * l)`"],
          answer: 0,
          explanation: "B1 is the difference array of the additions: +v where the range starts, −v just past where it ends. Its prefix sum at i is how much was added to position i. B2 carries the `v·(l−1)` / `−v·r` corrections.",
        },
      ],
    },
  ],
});
