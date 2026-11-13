import { defineModule } from "../../dsl.js";
import { CANDY_CASES, TOUR_CASES, WINDOW_JUMP_CASES } from "./cases.js";

export default defineModule(import.meta.url, {
  slug: "dp-optimisations",
  title: "DP optimisations",
  blurb: "Make the transition cheap: prefix sums over the previous row, a monotonic deque for a sliding-window maximum, and bitmask DP over subsets of up to twenty items.",
  icon: "grid",
  overview: `A dynamic programme costs its number of states times the cost of one transition. The states are usually fixed by the problem; the transition is where an O(n · k) solution becomes O(n) — the difference between 10¹⁰ steps and 10⁵.

The lesson shows the three speed-ups that come up most. When a state sums a contiguous range of the previous row, **prefix sums** of that row read the range in O(1). When it takes the maximum over the last k states, a **monotonic deque** keeps only the candidates that can still win, so each index enters and leaves once. And when the state is a subset of at most twenty items, a **bitmask** indexes it — the travelling-salesman DP over 2ⁿ · n states.

The exercises are the jumping game with a window of k (the deque) and sharing sweets among children with caps (prefix sums under a modulus). The timed checkpoint is the shortest round trip through up to twelve cities.`,
  lessons: [
    {
      slug: "dp-optimisation-techniques",
      file: "01-dp-optimisation-techniques.md",
      exercises: [
        {
          title: "Jumps within a window",
          prompt: `You stand on cell 1 of a row of \`n\` cells and must reach cell \`n\`. Each move goes forward by **1 to k** cells. Your score is the sum of \`a[i]\` over every cell you stand on, the first and the last included. Print the largest possible score.

\`dp[i] = a[i] + max(dp[i−k..i−1])\` is O(n · k); keep a **monotonic deque** of indices with decreasing dp values to make it O(n).

**Constraints:** \`1 ≤ n, k ≤ 10^5\`, \`|a[i]| ≤ 10^4\`.
**Input:** \`n k\`, then the \`n\` values.
**Output:** the best score.

\`\`\`text
6 2
1 -1 -2 4 -7 3
\`\`\`
prints \`7\` — the cells 1, −1, 4, 3.`,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    cin >> n >> k;
    vector<ll> a(n);
    for (auto& x : a) cin >> x;
    vector<ll> dp(n);
    dp[0] = a[0];
    deque<int> dq;   // indices, dp values decreasing from front to back
    dq.push_back(0);
    for (int i = 1; i < n; ++i) {
        // TODO: drop indices older than i - k from the front
        // TODO: dp[i] = a[i] + dp[front]
        // TODO: pop back entries that are no better than dp[i], then push i
    }
    cout << dp[n - 1] << '\n';
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, k;
    cin >> n >> k;
    vector<ll> a(n);
    for (auto& x : a) cin >> x;
    vector<ll> dp(n);
    dp[0] = a[0];
    deque<int> dq;
    dq.push_back(0);
    for (int i = 1; i < n; ++i) {
        while (dq.front() < i - k) dq.pop_front();
        dp[i] = a[i] + dp[dq.front()];
        while (!dq.empty() && dp[dq.back()] <= dp[i]) dq.pop_back();
        dq.push_back(i);
    }
    cout << dp[n - 1] << '\n';
    return 0;
}
`,
          hints: [
            "The window for cell i is i − k .. i − 1. The deque is never empty when you read it: index i − 1 is always inside.",
            "An index at the back with dp no larger than dp[i] is older and no better, so it can never be a window's maximum again — pop it.",
            "The answer can be as low as 10^5 · −10^4 = −10^9 and as high as 10^9; long long keeps the arithmetic clear of the edge.",
          ],
          cases: WINDOW_JUMP_CASES,
        },
        {
          title: "Sharing sweets with caps",
          prompt: `Share exactly \`K\` identical sweets among \`n\` children so that child \`i\` gets between \`0\` and \`a[i]\` sweets. Print the number of ways **modulo 10^9 + 7**.

\`dp[i][k] = dp[i−1][k−a[i]] + … + dp[i−1][k]\` is a contiguous range of the previous row: keep its **prefix sums** so each state costs O(1), and the whole table O(n · K).

**Constraints:** \`1 ≤ n ≤ 100\`, \`0 ≤ K ≤ 10^5\`, \`0 ≤ a[i] ≤ K\`.
**Input:** \`n K\`, then \`a[1..n]\`.
**Output:** the count modulo \`1 000 000 007\`.

\`\`\`text
3 4
1 2 3
\`\`\`
prints \`5\`: (0, 1, 3), (0, 2, 2), (1, 0, 3), (1, 1, 2) and (1, 2, 1).`,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;
const ll MOD = 1'000'000'007;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, K;
    cin >> n >> K;
    vector<ll> dp(K + 1, 0);
    dp[0] = 1;
    for (int i = 0; i < n; ++i) {
        int c;
        cin >> c;
        // TODO: prefix sums P of dp (P[k + 1] = P[k] + dp[k], mod MOD)
        // TODO: new dp[k] = P[k + 1] - P[max(0, k - c)], kept non-negative
    }
    cout << dp[K] << '\n';
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
    int n, K;
    cin >> n >> K;
    vector<ll> dp(K + 1, 0), pre(K + 2, 0);
    dp[0] = 1;
    for (int i = 0; i < n; ++i) {
        int c;
        cin >> c;
        pre[0] = 0;
        for (int k = 0; k <= K; ++k) pre[k + 1] = (pre[k] + dp[k]) % MOD;
        for (int k = 0; k <= K; ++k) dp[k] = (pre[k + 1] - pre[max(0, k - c)] + MOD) % MOD;
    }
    cout << dp[K] << '\n';
    return 0;
}
`,
          hints: [
            "Child i taking t sweets leaves k − t for the earlier children, so dp[i][k] adds dp[i−1][k − t] for t = 0..a[i]: the slice k − a[i] .. k of the previous row.",
            "With P[j] = dp[0] + … + dp[j − 1], the slice is P[k + 1] − P[max(0, k − a[i])]. Build P before overwriting dp.",
            "A difference of two values reduced mod p can be negative: add MOD before the final %. The direct triple loop is 100 · 10^5 · 10^5 — far too slow.",
          ],
          cases: CANDY_CASES,
        },
      ],
      quiz: [
        {
          prompt: "`dp[i] = a[i] + max(dp[i−k..i−1])` with n = k = 10^5. What does the monotonic deque change?",
          options: [
            "O(n · k) ≈ 10^10 becomes O(n), because each index is pushed and popped at most once",
            "Nothing — it is still O(n · k)",
            "O(n · k) becomes O(n log n)",
            "It reduces the memory, not the time",
          ],
          answer: 0,
          explanation: "The amortised argument: n pushes and at most n pops across the whole run, plus O(1) work to read the front. A `std::multiset` of the window would give O(n log n); the deque gives O(n).",
        },
        {
          prompt: "The deque holds indices with dp values 9, 6, 4 (front to back). The new dp[i] is 7. What happens before pushing i?",
          options: ["Pop the 4 and the 6; the deque becomes 9, 7", "Pop the 9", "Push without popping: 9, 6, 4, 7", "Clear the deque"],
          answer: 0,
          explanation: "Back entries with a value ≤ 7 are older and no better, so they can never be a window's maximum while i is in the window. 9 is better and stays — it may still win until it leaves the window.",
        },
        {
          prompt: "Under a modulus, why is `(P[k+1] - P[k-c] + MOD) % MOD` written with `+ MOD`?",
          options: [
            "Both prefixes are reduced mod p, so the smaller-looking one can be the larger number: the difference can be negative, and `%` keeps the sign in C++",
            "To avoid overflow of `long long`",
            "Because `MOD` is prime",
            "It is not needed",
          ],
          answer: 0,
          explanation: "`-3 % 7` is `-3` in C++, not 4. Adding MOD once brings any difference of two reduced values into 0..2p−2, and `%` finishes it.",
        },
        {
          prompt: "How many `dp[mask][v]` states does the TSP bitmask DP have at n = 12?",
          options: ["2^12 · 12 = 49 152", "12! ≈ 4.8 × 10^8", "12^2 = 144", "2^12 = 4096"],
          answer: 0,
          explanation: "A mask for every subset times an end city. Each state has up to 12 moves, about 600 000 transitions — against 12! orders for trying every tour.",
        },
      ],
    },
    {
      slug: "dp-optimisations-checkpoint",
      file: "02-checkpoint.md",
      kind: "test",
      passMark: 70,
      timeLimitMin: 60,
      exercises: [
        {
          title: "Shortest round trip",
          prompt: `There are \`n\` cities and \`d[i][j]\`, the cost of travelling from city \`i\` to city \`j\` (not necessarily equal to \`d[j][i]\`). Starting at city 0, visit every city exactly once and return to city 0. Print the smallest total cost (\`0\` when \`n = 1\`).

Use **bitmask DP**: \`dp[mask][v]\` = cheapest path from 0 that has visited exactly \`mask\` and ends at \`v\`.

**Constraints:** \`1 ≤ n ≤ 12\`, \`0 ≤ d[i][j] ≤ 1000\`, \`d[i][i] = 0\`.
**Input:** \`n\`, then \`n\` rows of \`n\` integers.
**Output:** the cost.

\`\`\`text
4
0 10 15 20
10 0 35 25
15 35 0 30
20 25 30 0
\`\`\`
prints \`80\` — 0 → 1 → 3 → 2 → 0.`,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<vector<ll>> d(n, vector<ll>(n));
    for (auto& row : d)
        for (auto& x : row) cin >> x;
    // TODO: n == 1 -> 0
    // TODO: dp over (1 << n) masks x n cities, dp[1][0] = 0
    // TODO: answer = min over v of dp[full][v] + d[v][0]
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<vector<ll>> d(n, vector<ll>(n));
    for (auto& row : d)
        for (auto& x : row) cin >> x;
    if (n == 1) {
        cout << 0 << '\n';
        return 0;
    }
    const ll INF = LLONG_MAX / 4;
    const int FULL = 1 << n;
    vector<vector<ll>> dp(FULL, vector<ll>(n, INF));
    dp[1][0] = 0;
    for (int mask = 1; mask < FULL; ++mask) {
        if (!(mask & 1)) continue;                 // every path starts at city 0
        for (int v = 0; v < n; ++v) {
            if (dp[mask][v] >= INF) continue;
            for (int u = 0; u < n; ++u) {
                if (mask >> u & 1) continue;
                int next = mask | 1 << u;
                dp[next][u] = min(dp[next][u], dp[mask][v] + d[v][u]);
            }
        }
    }
    ll best = INF;
    for (int v = 1; v < n; ++v) best = min(best, dp[FULL - 1][v] + d[v][0]);
    cout << best << '\n';
    return 0;
}
`,
          hints: [
            "Bit u of mask is mask >> u & 1; adding city u is mask | 1 << u. Masks only grow, so looping mask upwards finishes each state before it is extended.",
            "Start from dp[1][0] = 0 (only city 0 visited) and skip masks without bit 0 — no path can reach them.",
            "Close the tour at the end: the answer is the minimum over v ≥ 1 of dp[(1 << n) − 1][v] + d[v][0]. n = 1 has no v ≥ 1, so answer it first.",
          ],
          cases: TOUR_CASES,
        },
      ],
      quiz: [
        {
          prompt: "`dp[i][k] = dp[i−1][k−c] + … + dp[i−1][k]` for n = 100 rows, K = 10^5, c up to K. Without prefix sums the table costs about…",
          options: ["10^12 additions — too slow", "10^7 additions — fine", "10^5 additions", "10^9 additions — borderline"],
          answer: 0,
          explanation: "100 · 10^5 states, each summing up to 10^5 values: 10^12. With prefix sums every state is O(1) and the table is 10^7.",
        },
        {
          prompt: "Which prefix-sum read gives `dp[i−1][lo] + … + dp[i−1][hi]` when `P[j] = dp[i−1][0] + … + dp[i−1][j−1]`?",
          options: ["`P[hi + 1] - P[lo]`", "`P[hi] - P[lo]`", "`P[hi] - P[lo - 1]`", "`P[hi + 1] - P[lo + 1]`"],
          answer: 0,
          explanation: "With the one-shifted convention P[j] covers indexes 0..j−1, so the slice lo..hi is P[hi + 1] − P[lo]. The shift is what makes lo = 0 need no special case.",
        },
        {
          prompt: "In the sliding-window-maximum deque, when is the **front** popped?",
          options: ["When its index has left the window", "When a larger value arrives", "After every read", "Never — only the back is popped"],
          answer: 0,
          explanation: "The back is popped for being dominated; the front is popped for being too old. The front is always the window's maximum, so it leaves only by expiring.",
        },
        {
          prompt: "Why may a back entry with `dp[back] <= dp[i]` be discarded for good?",
          options: [
            "It is older than i, so it leaves every future window first, and it is never larger than dp[i] while both are inside",
            "Its value will be recomputed later",
            "The deque has a fixed capacity",
            "Because dp values only increase",
          ],
          answer: 0,
          explanation: "Any window that contains the old index also contains i, and there i is at least as good. So the old index can never be the unique maximum again.",
        },
        {
          prompt: "What does `mask >> j & 1` test?",
          options: ["Whether bit j of mask is set — item j is in the subset", "Whether mask is odd", "Whether mask has j bits set", "The j-th lowest set bit"],
          answer: 0,
          explanation: "Shift bit j down to position 0 and keep only it. `>>` binds tighter than `&`, so no parentheses are needed — though many people add them for the reader.",
        },
        {
          prompt: "How is subset `mask` without item j written?",
          options: ["`mask & ~(1 << j)`", "`mask ^ j`", "`mask - j`", "`mask | ~(1 << j)`"],
          answer: 0,
          explanation: "`~(1 << j)` has every bit set except j; AND clears exactly that bit. `mask ^ (1 << j)` also works, but only when the bit is known to be set.",
        },
        {
          prompt: "TSP bitmask DP is O(2^n · n²). Roughly the largest n that fits in a second (~10^8 simple steps)?",
          options: ["About 17–18", "About 30", "About 12 only", "About 25"],
          answer: 0,
          explanation: "2^17 · 17² ≈ 3.8 × 10^7 and 2^18 · 18² ≈ 8.5 × 10^7; at 20 it is 4.2 × 10^8. Memory for dp[2^n][n] of `long long` also grows — at n = 20 it is 160 MB.",
        },
        {
          prompt: "In the TSP DP, why is it safe to loop masks in increasing numeric order?",
          options: [
            "Every transition sets a new bit, so it goes from a mask to a strictly larger one",
            "Because masks are visited in order of their popcount",
            "It is not safe; masks must be sorted by popcount first",
            "Because city 0 is bit 0",
          ],
          answer: 0,
          explanation: "`mask | 1 << u` with u not in mask is mask + 2^u > mask. Numeric order therefore respects every dependency — sorting by popcount is unnecessary.",
        },
        {
          prompt: "Counting sweets: with K = 0 and every cap 0, how many ways are there?",
          options: ["1 — everyone gets nothing", "0", "n", "Undefined"],
          answer: 0,
          explanation: "The empty distribution is one way. That is exactly dp[0][0] = 1, the base case every row is built from.",
        },
        {
          prompt: "A DP needs `dp[i] = cost[i] + min(dp[j])` over **all** `j < i`. What is the cheapest speed-up?",
          options: ["Keep a running minimum as i grows: O(1) per state", "A monotonic deque", "Bitmask DP", "A segment tree"],
          answer: 0,
          explanation: "A window that only grows never loses an element, so one variable holding the minimum so far is enough. The deque is for windows that also shrink from the left.",
        },
      ],
    },
  ],
});
