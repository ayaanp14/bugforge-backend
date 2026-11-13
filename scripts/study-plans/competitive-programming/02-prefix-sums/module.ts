import { defineModule } from "../../dsl.js";
import { pattern, peakCase, rangeAddCase, rangeSumCase, rangesOf, updatesOf } from "./cases.js";

const TEMPLATE = String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
`;

const BIG = Array.from({ length: 4000 }, () => 1_000_000_000);

export default defineModule(import.meta.url, {
  slug: "prefix-sums",
  title: "Prefix sums and difference arrays",
  blurb: "Answer any range sum in O(1) after one O(n) pass, and apply many range updates with two writes each — the two halves of one idea.",
  icon: "layers",
  overview: `Summing a range element by element is O(n) per query; with 10⁵ queries over 10⁵ numbers that is 10¹⁰ steps. A prefix array, built once in O(n), answers every range sum with one subtraction.

Run the idea backwards and you get the difference array: to add v to a whole range, write +v where it starts and −v just after it ends, then one prefix sum at the end applies every update at once. Together they turn "many queries" and "many updates" problems from O(n · q) into O(n + q).

The exercises are both halves at contest sizes — range-sum queries with sums past 2³¹, and thousands of range additions — and the checkpoint finds the busiest hour of a booking timeline a million hours long.`,
  lessons: [
    {
      slug: "prefix-sums-and-difference-arrays",
      file: "01-prefix-sums-and-difference-arrays.md",
      exercises: [
        {
          title: "Range sum queries",
          prompt: `Read an array of \`n\` integers and answer \`q\` queries: each gives \`l r\` (1-indexed) — print \`a[l] + … + a[r]\`.

**Constraints:** \`1 ≤ n, q ≤ 2·10⁵\`, \`-10⁹ ≤ aᵢ ≤ 10⁹\`, \`1 ≤ l ≤ r ≤ n\`.

**Input:** \`n q\`, the array, then \`q\` lines \`l r\`.
**Output:** one sum per line.

\`\`\`text
5 3
1 2 3 4 5
1 5
2 3
4 4
\`\`\`
prints
\`\`\`text
15
5
4
\`\`\``,
          starter: TEMPLATE + String.raw`    int n, q;
    cin >> n >> q;
    vector<ll> a(n + 1);
    for (int i = 1; i <= n; ++i) cin >> a[i];
    // TODO: build p with p[0] = 0 and p[i] = p[i - 1] + a[i]
    // TODO: answer each query as p[r] - p[l - 1]
    return 0;
}
`,
          solution: TEMPLATE + String.raw`    int n, q;
    cin >> n >> q;
    vector<ll> p(n + 1, 0);
    for (int i = 1; i <= n; ++i) {
        ll x;
        cin >> x;
        p[i] = p[i - 1] + x;
    }
    while (q--) {
        int l, r;
        cin >> l >> r;
        cout << p[r] - p[l - 1] << '\n';
    }
    return 0;
}
`,
          hints: [
            "Summing each range directly is O(n) per query: 4·10¹⁰ steps at the limits.",
            "Make p one longer than the array, with p[0] = 0, so a range starting at 1 needs no special case.",
            "a[l..r] = p[r] − p[l − 1]. The sums reach 2·10¹⁴ — p must be long long.",
          ],
          cases: [
            rangeSumCase([1, 2, 3, 4, 5], [[1, 5], [2, 3], [4, 4]], false),
            rangeSumCase([-7], [[1, 1]]),
            rangeSumCase(BIG, [[1, 4000], [1, 1], [4000, 4000], [2, 3999]]),
            rangeSumCase(pattern(3000, 999_983, 17, 2_000_000_001, -1_000_000_000), rangesOf(3000, 2000, 7919, 104_729)),
          ],
        },
        {
          title: "Many range additions",
          prompt: `An array of \`n\` zeros receives \`m\` updates. Update \`l r v\` adds \`v\` to every element from \`l\` to \`r\` (1-indexed). Print the array after all of them.

**Constraints:** \`1 ≤ n, m ≤ 2·10⁵\`, \`1 ≤ l ≤ r ≤ n\`, \`-10⁹ ≤ v ≤ 10⁹\`.

**Input:** \`n m\`, then \`m\` lines \`l r v\`.
**Output:** the \`n\` final values on one line, separated by spaces.

\`\`\`text
5 3
1 3 2
2 5 3
5 5 -1
\`\`\`
prints
\`\`\`text
2 5 5 3 2
\`\`\``,
          starter: TEMPLATE + String.raw`    int n, m;
    cin >> n >> m;
    vector<ll> d(n + 2, 0);
    for (int k = 0; k < m; ++k) {
        int l, r;
        ll v;
        cin >> l >> r >> v;
        // TODO: two writes per update
    }
    // TODO: one running sum over d gives the array; print it
    return 0;
}
`,
          solution: TEMPLATE + String.raw`    int n, m;
    cin >> n >> m;
    vector<ll> d(n + 2, 0);
    for (int k = 0; k < m; ++k) {
        int l, r;
        ll v;
        cin >> l >> r >> v;
        d[l] += v;
        d[r + 1] -= v;
    }
    ll run = 0;
    for (int i = 1; i <= n; ++i) {
        run += d[i];
        cout << run << (i == n ? '\n' : ' ');
    }
    return 0;
}
`,
          hints: [
            "Applying each update element by element is O(n · m) — 4·10¹⁰ at the limits.",
            "d[l] += v starts the change, d[r + 1] -= v stops it. d needs n + 2 slots so r = n has somewhere to stop.",
            "The final a[i] is d[1] + … + d[i]: one running sum. Totals reach 2·10¹⁴, so long long.",
          ],
          cases: [
            rangeAddCase(5, [[1, 3, 2], [2, 5, 3], [5, 5, -1]], false),
            rangeAddCase(1, [[1, 1, -1_000_000_000]]),
            rangeAddCase(4, [[1, 4, 1_000_000_000], [1, 4, 1_000_000_000], [2, 3, -1_000_000_000], [1, 1, 1_000_000_000], [4, 4, 1_000_000_000]]),
            rangeAddCase(5000, updatesOf(5000, 3000, 9, -4)),
          ],
        },
      ],
      quiz: [
        {
          prompt: "With `p[0] = 0` and `p[i] = p[i - 1] + a[i]` (1-indexed), the sum `a[l] + … + a[r]` is…",
          options: ["`p[r] - p[l]`", "`p[r] - p[l - 1]`", "`p[r + 1] - p[l]`", "`p[r] + p[l - 1]`"],
          answer: 1,
          explanation: "p[r] holds everything up to r, p[l − 1] everything before l; their difference is exactly l..r. `p[r] - p[l]` drops a[l] — the classic off-by-one.",
        },
        {
          prompt: "To add `v` to every element of `[l, r]` with a difference array `d`, you write…",
          options: ["`d[l] += v; d[r] -= v;`", "`d[l] += v; d[r + 1] -= v;`", "`d[l - 1] += v; d[r] -= v;`", "`d[i] += v` for every i in l..r"],
          answer: 1,
          explanation: "The running sum picks up +v at l and carries it to every later index; −v at r + 1 cancels it right after the range. Cancelling at r would leave a[r] without the update.",
        },
        {
          prompt: "n = 10⁵ values and q = 10⁵ range-sum queries, no updates. Which costs the least?",
          options: ["Sum each range directly: O(n · q)", "Prefix array: O(n + q)", "Sort first: O(n log n + q · n)", "A difference array"],
          answer: 1,
          explanation: "One O(n) pass builds the prefix array, and each query is then two lookups. Directly summing is up to 10¹⁰ steps. A difference array is for many updates, not many queries.",
        },
        {
          prompt: "Updates and range-sum queries arrive interleaved — query, update, query… Does a plain prefix array still work?",
          options: ["Yes, in O(1) each", "No — one update changes O(n) prefix values, so each update costs O(n); a Fenwick or segment tree handles both in O(log n)", "Yes, if you use long long", "Only for positive values"],
          answer: 1,
          explanation: "Prefix sums and difference arrays shine when all the updates come before all the reads (or there are none). Mixed online operations need a tree, later in this track.",
        },
      ],
    },
    {
      slug: "prefix-sums-checkpoint",
      file: "02-checkpoint.md",
      kind: "test",
      passMark: 70,
      timeLimitMin: 45,
      exercises: [
        {
          title: "The busiest hour",
          prompt: `A venue's timeline has hours \`1\` to \`10⁶\`. Each of \`m\` bookings \`s e p\` brings \`p\` people for every hour from \`s\` to \`e\`, both included. Print the largest number of people present in any one hour, and the earliest hour at which it happens.

**Constraints:** \`1 ≤ m ≤ 2·10⁵\`, \`1 ≤ s ≤ e ≤ 10⁶\`, \`1 ≤ p ≤ 10⁹\`.

**Input:** \`m\`, then \`m\` lines \`s e p\`.
**Output:** \`<people> <hour>\`.

\`\`\`text
3
1 4 2
3 6 5
6 6 1
\`\`\`
prints
\`\`\`text
7 3
\`\`\`
(hours 3 and 4 hold 2 + 5 = 7 people; hour 3 is earlier.)`,
          starter: TEMPLATE + String.raw`    const int H = 1000000;
    int m;
    cin >> m;
    vector<ll> d(H + 2, 0);
    // TODO: each booking is a range addition on the timeline
    // TODO: one running sum over the hours; keep the first hour with the largest total
    return 0;
}
`,
          solution: TEMPLATE + String.raw`    const int H = 1000000;
    int m;
    cin >> m;
    vector<ll> d(H + 2, 0);
    for (int k = 0; k < m; ++k) {
        int s, e;
        ll p;
        cin >> s >> e >> p;
        d[s] += p;
        d[e + 1] -= p;
    }
    ll run = 0, best = -1;
    int at = 0;
    for (int h = 1; h <= H; ++h) {
        run += d[h];
        if (run > best) {
            best = run;
            at = h;
        }
    }
    cout << best << ' ' << at << '\n';
    return 0;
}
`,
          hints: [
            "Adding p to every hour of every booking is O(m · 10⁶) — far over budget.",
            "Each booking is d[s] += p and d[e + 1] −= p; the timeline is the running sum of d.",
            "Compare with > (not ≥) while scanning upwards, so the first hour with the largest total is kept. Totals reach 2·10¹⁴: long long.",
          ],
          cases: [
            peakCase([[1, 4, 2], [3, 6, 5], [6, 6, 1]], false),
            peakCase([[1_000_000, 1_000_000, 1_000_000_000]]),
            peakCase([[1, 1_000_000, 3], [500_000, 500_000, 1], [2, 999_999, 1], [1_000_000, 1_000_000, 1]]),
            peakCase(Array.from({ length: 2500 }, (_, i): [number, number, number] => [i + 1, 1_000_000, 1_000_000_000])),
            peakCase(
              Array.from({ length: 2200 }, (_, i): [number, number, number] => {
                const s = ((i * 7919 + 1) % 1_000_000) + 1;
                return [s, Math.min(1_000_000, s + ((i * 104_729) % 50_000)), ((i * 999_983) % 1_000_000_000) + 1];
              }),
            ),
          ],
        },
      ],
      quiz: [
        {
          prompt: "a = [3, 1, 4, 1, 5] (1-indexed). What is p[4] in the prefix array with p[0] = 0?",
          options: ["4", "8", "9", "14"],
          answer: 2,
          explanation: "p[4] = 3 + 1 + 4 + 1 = 9. p[5] would be 14.",
        },
        {
          prompt: "Same array. Which expression gives a[2] + a[3] + a[4]?",
          options: ["p[4] − p[2]", "p[4] − p[1]", "p[3] − p[1]", "p[5] − p[2]"],
          answer: 1,
          explanation: "p[4] − p[1] = 9 − 3 = 6 = 1 + 4 + 1. The lower index is l − 1 = 1.",
        },
        {
          prompt: "Why does the prefix array have n + 1 slots, with p[0] = 0?",
          options: ["Alignment", "So a range starting at index 1 is p[r] − p[0] like every other range — no special case", "To store the length", "It does not need one"],
          answer: 1,
          explanation: "p[0] is the sum of no elements. Without it, every query with l = 1 needs an if.",
        },
        {
          prompt: "Why does the difference array need a slot n + 1?",
          options: ["It does not", "An update ending at r = n writes −v at d[n + 1]; without that slot it writes past the end", "For the answer", "To hold the total"],
          answer: 1,
          explanation: "d[r + 1] −= v with r = n touches index n + 1. That slot is never read when rebuilding a[1..n] — it only gives the update a place to stop.",
        },
        {
          prompt: "d = [0, 2, 3, 0, −2, −3] for indexes 0..5 (d[0] unused). What is the array a[1..4] after the running sum?",
          options: ["2 5 5 3", "2 3 0 −2", "2 5 3 0", "5 5 5 5"],
          answer: 0,
          explanation: "Running sums of d[1..4]: 2, 2 + 3 = 5, 5 + 0 = 5, 5 − 2 = 3.",
        },
        {
          prompt: "n = 10⁵ and q = 10⁵ range-sum queries, each answered by summing the range directly. Roughly how many steps in the worst case?",
          options: ["10⁵", "2·10⁵", "10¹⁰", "10¹⁵"],
          answer: 2,
          explanation: "Each query can cover all n elements: n · q = 10¹⁰, about a hundred seconds at 10⁸ a second. With a prefix array it is n + q = 2·10⁵.",
        },
        {
          prompt: "All updates come first, then you print the array once. The right tool is…",
          options: ["A prefix array", "A difference array", "Sorting", "A hash map"],
          answer: 1,
          explanation: "Two writes per update, then one running sum: O(n + m). The prefix array is the read-side twin — many queries, no updates.",
        },
        {
          prompt: "Values up to 10⁹, n up to 2·10⁵. What type must the prefix array be?",
          options: ["`int`", "`long long`", "`unsigned int`", "`short`"],
          answer: 1,
          explanation: "A prefix can reach 2·10¹⁴, far past int's 2.1·10⁹ (and unsigned int's 4.3·10⁹).",
        },
        {
          prompt: "Subarrays summing to exactly k (values may be negative) can be counted in O(n) by…",
          options: [
            "Sliding a window",
            "Walking the prefix sums and counting, in a hash map, how often each earlier prefix equals the current prefix − k",
            "Sorting the array",
            "A difference array",
          ],
          answer: 1,
          explanation: "a[l..r] = k means p[r] − p[l − 1] = k, so p[l − 1] = p[r] − k: look it up among the prefixes seen so far. A sliding window needs all values non-negative.",
        },
        {
          prompt: "In 2D, the sum of the rectangle with rows r1..r2 and columns c1..c2 from a prefix table P (with a zero row and column) is…",
          options: [
            "P[r2][c2] − P[r1 − 1][c1 − 1]",
            "P[r2][c2] − P[r1 − 1][c2] − P[r2][c1 − 1] + P[r1 − 1][c1 − 1]",
            "P[r2][c2] − P[r1][c2] − P[r2][c1]",
            "P[r2][c2] + P[r1 − 1][c1 − 1]",
          ],
          answer: 1,
          explanation: "Take the big block, subtract the strip above and the strip to the left, then add back the corner both strips removed — inclusion–exclusion.",
        },
        {
          prompt: "Updates and queries are mixed — each update must be visible to the next query. Prefix sums alone cost…",
          options: ["O(1) per operation", "O(n) per update, because every later prefix changes", "O(log n) per operation", "Nothing extra"],
          answer: 1,
          explanation: "One changed element shifts every prefix after it. Interleaved updates and queries are the job of a Fenwick or segment tree, O(log n) each.",
        },
      ],
    },
  ],
});
