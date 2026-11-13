import { defineModule } from "../../dsl.js";
import { atMostCase, pairsCase, pattern, sumMaxCase } from "./cases.js";

const TEMPLATE = String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
`;

export default defineModule(import.meta.url, {
  slug: "fast-io-and-complexity",
  title: "Fast I/O and complexity budgets",
  blurb: "The contest template, fast input and output, long long by default, and reading the constraints to know which complexity will pass in one second.",
  icon: "clock",
  overview: `Every contest problem is two problems: find an idea, and find one that is fast enough. This module settles the second one before you write a line. A judge runs roughly 10⁸ simple operations a second, so the largest n in the constraints already names the slowest algorithm that can pass — n ≤ 10⁵ rules out O(n²), n ≤ 20 invites O(2ⁿ).

It also gives you the template the rest of the track starts from: \`bits/stdc++.h\`, \`using namespace std\`, the two fast-I/O lines and \`long long\` for anything that sums or multiplies. The exercises are judged at the limits: a sum that overflows an \`int\`, and a pair count where n reaches 10⁹ and only the counting idea fits in time.`,
  lessons: [
    {
      slug: "contest-template-and-budgets",
      file: "01-contest-template-and-budgets.md",
      exercises: [
        {
          title: "Sum and maximum, fast",
          prompt: `Read \`n\` and then \`n\` integers. Print their sum and their maximum, separated by a space.

**Constraints:** \`1 ≤ n ≤ 2·10⁵\`, \`-10⁹ ≤ aᵢ ≤ 10⁹\`.

**Input:** \`n\` on the first line, the values on the second.
**Output:** \`<sum> <max>\`.

\`\`\`text
5
3 -1 4 1 5
\`\`\`
prints
\`\`\`text
12 5
\`\`\``,
          starter: TEMPLATE + String.raw`    int n;
    cin >> n;
    // TODO: read n values, keep the sum and the maximum
    // (which type can hold 2·10^5 values of 10^9 added up?)
    return 0;
}
`,
          solution: TEMPLATE + String.raw`    int n;
    cin >> n;
    ll sum = 0, best = LLONG_MIN;
    for (int i = 0; i < n; ++i) {
        ll x;
        cin >> x;
        sum += x;
        best = max(best, x);
    }
    cout << sum << ' ' << best << '\n';
    return 0;
}
`,
          hints: [
            "2·10⁵ values of 10⁹ add up to 2·10¹⁴, far past the 2.1·10⁹ an int holds — keep the sum in long long.",
            "Start the maximum at LLONG_MIN (or at the first value), not at 0: every value may be negative.",
            "Keep the two fast-I/O lines at the top of main and print with '\\n', never endl.",
          ],
          cases: [
            sumMaxCase([3, -1, 4, 1, 5], false),
            sumMaxCase([-1_000_000_000]),
            sumMaxCase(Array.from({ length: 4500 }, () => 1_000_000_000)),
            sumMaxCase(Array.from({ length: 4500 }, () => -1_000_000_000)),
            sumMaxCase(pattern(5000, 999_983, 13, 2_000_000_001, -1_000_000_000)),
          ],
        },
        {
          title: "Pairs that add up to a multiple of k",
          prompt: `Count the pairs \`(i, j)\` with \`1 ≤ i < j ≤ n\` whose sum \`i + j\` is divisible by \`k\`.

**Constraints:** \`1 ≤ n ≤ 10⁹\`, \`1 ≤ k ≤ 10⁶\`. Time limit about one second.

**Input:** \`n k\`.
**Output:** the number of pairs.

\`\`\`text
5 3
\`\`\`
prints
\`\`\`text
4
\`\`\`
(the pairs are 1+2, 1+5, 2+4 and 4+5.)

Read the constraints before you code: trying every pair is O(n²), and n reaches 10⁹.`,
          starter: TEMPLATE + String.raw`    ll n, k;
    cin >> n >> k;
    // Trying every pair is O(n^2) = 10^18 operations: far over budget.
    // TODO: count how many of 1..n have each remainder r mod k,
    //       then pair remainder r with remainder (k - r) % k
    return 0;
}
`,
          solution: TEMPLATE + String.raw`    ll n, k;
    cin >> n >> k;
    // How many of 1..n leave remainder r when divided by k.
    auto cnt = [&](ll r) -> ll { return n / k + ((r >= 1 && r <= n % k) ? 1 : 0); };
    auto pairsWithin = [](ll c) -> ll { return c * (c - 1) / 2; };
    ll total = pairsWithin(cnt(0));
    for (ll r = 1; r < k - r; ++r) total += cnt(r) * cnt(k - r);
    if (k % 2 == 0) total += pairsWithin(cnt(k / 2));
    cout << total << '\n';
    return 0;
}
`,
          hints: [
            "Only the remainders matter: i + j is divisible by k exactly when (i mod k) + (j mod k) is 0 or k.",
            "Among 1..n, remainder r appears n / k times, plus one more when 1 ≤ r ≤ n mod k.",
            "Pair remainder r with k − r for r < k − r; remainders 0 and k / 2 (when k is even) pair with themselves, giving c·(c − 1)/2 pairs.",
            "The loop is O(k) ≤ 10⁶ steps. The answer can reach 5·10¹⁷ — long long.",
          ],
          cases: [pairsCase(5, 3, false), pairsCase(1, 1), pairsCase(2000, 7), pairsCase(1_000_000_000, 1), pairsCase(1_000_000_000, 1_000_000), pairsCase(999_999_999, 999_983)],
        },
      ],
      quiz: [
        {
          prompt: "n ≤ 10⁵ and your idea compares every pair of elements. Will it pass a 1-second limit?",
          options: ["Yes — 10⁵ is small", "No — about n²/2 = 5·10⁹ comparisons, roughly 50 times the ~10⁸ a judge does in a second", "Only with fast I/O", "Only in C++"],
          answer: 1,
          explanation: "Put the largest n into the complexity: (10⁵)² / 2 = 5·10⁹. At about 10⁸ simple operations per second that is close to a minute. Fast I/O speeds up reading the input, not the algorithm — n ≤ 10⁵ is asking for O(n log n) or O(n).",
        },
        {
          prompt: "What do `ios::sync_with_stdio(false);` and `cin.tie(nullptr);` buy you?",
          options: [
            "The first stops cin/cout synchronising with C's stdio, the second stops cout being flushed before every read — together they make large input and output several times faster",
            "They make the algorithm run in O(n)",
            "They enable 64-bit integers",
            "Nothing on a modern compiler",
          ],
          answer: 0,
          explanation: "Synchronisation with stdio and the flush before each read are both per-operation costs; with 10⁵–10⁶ numbers in the input they add up to a real share of the time limit. After the first line, do not mix `scanf`/`printf` with `cin`/`cout`.",
        },
        {
          prompt: "`int s = 0;` then 2·10⁵ values, each up to 10⁹, are added to `s`. What goes wrong?",
          options: ["Nothing", "The sum reaches 2·10¹⁴, past an int's 2.1·10⁹: signed overflow, which is undefined behaviour and in practice a wrong answer", "It is too slow", "The compiler refuses it"],
          answer: 1,
          explanation: "An `int` holds about ±2.1·10⁹. Anything that sums or multiplies large values goes in `long long` (±9.2·10¹⁸), which is why the template has `using ll = long long;`.",
        },
        {
          prompt: "Why print with `'\\n'` rather than `endl` when the output has 10⁵ lines?",
          options: ["`endl` is not standard", "`endl` also flushes the stream every time — 10⁵ system calls instead of a few large writes", "`'\\n'` is shorter to type", "There is no difference"],
          answer: 1,
          explanation: "A newline character goes into the buffer, which is written out in large chunks. `endl` writes the newline and then forces a flush, so a loop printing with it pays a write per line.",
        },
      ],
    },
    {
      slug: "fast-io-and-complexity-checkpoint",
      file: "02-checkpoint.md",
      kind: "test",
      passMark: 70,
      timeLimitMin: 45,
      exercises: [
        {
          title: "How many are at most x",
          prompt: `Read \`n\` values and then answer \`q\` queries: for each query value \`x\`, print how many of the values are \`≤ x\`.

**Constraints:** \`1 ≤ n, q ≤ 2·10⁵\`, \`0 ≤ aᵢ, x ≤ 10⁹\`.

**Input:** \`n q\`, then the \`n\` values, then \`q\` lines with one \`x\` each.
**Output:** \`q\` lines, one answer each.

\`\`\`text
5 3
4 1 7 4 2
4
0
10
\`\`\`
prints
\`\`\`text
4
0
5
\`\`\`

Scanning all n values per query is O(n · q) = 4·10¹⁰ at the limits — budget first.`,
          starter: TEMPLATE + String.raw`    int n, q;
    cin >> n >> q;
    vector<ll> a(n);
    for (auto& x : a) cin >> x;
    // TODO: make each query cost O(log n), not O(n)
    return 0;
}
`,
          solution: TEMPLATE + String.raw`    int n, q;
    cin >> n >> q;
    vector<ll> a(n);
    for (auto& x : a) cin >> x;
    sort(a.begin(), a.end());
    while (q--) {
        ll x;
        cin >> x;
        cout << (upper_bound(a.begin(), a.end(), x) - a.begin()) << '\n';
    }
    return 0;
}
`,
          hints: [
            "n · q = 4·10¹⁰ is far over budget, so a query cannot look at every value.",
            "Sort once, O(n log n). In a sorted array the values ≤ x are a prefix.",
            "upper_bound(a.begin(), a.end(), x) points at the first value > x; its distance from begin() is the answer.",
          ],
          cases: [
            atMostCase([4, 1, 7, 4, 2], [4, 0, 10], false),
            atMostCase([1_000_000_000], [999_999_999, 1_000_000_000, 0]),
            atMostCase(pattern(4000, 7919, 13, 100_003), pattern(4000, 104_729, 7, 100_100)),
            atMostCase(Array.from({ length: 6000 }, () => 5), [4, 5, 6, 0, 1_000_000_000]),
          ],
        },
      ],
      quiz: [
        {
          prompt: "n ≤ 20. Which is the slowest complexity that still fits in about 10⁸ operations?",
          options: ["O(n!)", "O(2ⁿ · n)", "O(n⁴ · 2ⁿ)"],
          answer: 1,
          explanation: "2²⁰ · 20 ≈ 2.1·10⁷ fits. 20! ≈ 2.4·10¹⁸ and 20⁴ · 2²⁰ ≈ 1.7·10¹¹ do not. n around 20 is the classic sign of a bitmask or subset search.",
        },
        {
          prompt: "n ≤ 5000. Which fits?",
          options: ["O(n³)", "O(n²)", "Neither"],
          answer: 1,
          explanation: "5000² = 2.5·10⁷ fits; 5000³ = 1.25·10¹¹ is about a thousand times over.",
        },
        {
          prompt: "n ≤ 10⁶. Which fits?",
          options: ["O(n²)", "O(n√n)", "O(n log n)"],
          answer: 2,
          explanation: "10⁶ · log₂ 10⁶ ≈ 2·10⁷ fits. n√n = 10⁹ and n² = 10¹² do not.",
        },
        {
          prompt: "n ≤ 10¹⁸. What can the solution afford?",
          options: ["O(n)", "O(√n)", "O(log n)"],
          answer: 2,
          explanation: "√(10¹⁸) = 10⁹ is already ten times over the budget. Only O(log n) or a formula works — binary search, fast exponentiation, digit-by-digit counting.",
        },
        {
          prompt: "n ≤ 400. Which is the slowest complexity that fits?",
          options: ["O(n³)", "O(n⁴)", "O(2ⁿ)"],
          answer: 0,
          explanation: "400³ = 6.4·10⁷ fits; 400⁴ = 2.56·10¹⁰ does not; 2⁴⁰⁰ is astronomically large. A few hundred usually means O(n³) — Floyd–Warshall or an interval DP.",
        },
        {
          prompt: "Which line belongs in a contest template but never in a header file of a real project?",
          options: ["`using namespace std;`", "`int main()`", "`return 0;`", "`#include <vector>`"],
          answer: 0,
          explanation: "In a one-file solution it saves typing; in a header it pulls every `std` name into every file that includes it, where it can collide with your own names.",
        },
        {
          prompt: "After `ios::sync_with_stdio(false);`, which is safe?",
          options: ["Mixing `printf` and `cout`", "Using only `cin`/`cout`", "Mixing `scanf` and `cin`", "All of them"],
          answer: 1,
          explanation: "With synchronisation off, the C++ streams and C's stdio keep separate buffers, so interleaving them can print or read out of order. Pick one family.",
        },
        {
          prompt: "`int a = 100000, b = 100000; long long c = a * b;` — what is `c`?",
          options: ["10¹⁰", "Undefined behaviour: `a * b` is computed in int and overflows before it is converted", "0", "A compile error"],
          answer: 1,
          explanation: "The type of the destination does not change the type of the multiplication. Write `1LL * a * b` or make `a` and `b` `long long`.",
        },
        {
          prompt: "Which of these is about 10⁸?",
          options: ["The simple operations a judge runs in roughly one second", "The largest int", "The number of bytes in a 256 MB memory limit", "The largest n any problem allows"],
          answer: 0,
          explanation: "It is a rule of thumb, not a constant — a tight loop of additions does more, cache misses or divisions fewer — but it is the right order of magnitude to budget with. The largest int is about 2.1·10⁹, and 256 MB is about 2.7·10⁸ bytes.",
        },
        {
          prompt: "The time limit is 2 seconds and n ≤ 10⁵. Your idea is O(n log² n). Is it worth coding?",
          options: ["No, log² is too slow", "Yes — 10⁵ · 17² ≈ 2.9·10⁷, well inside the budget", "Only if n ≤ 10⁴", "Only with a faster language"],
          answer: 1,
          explanation: "log₂ 10⁵ ≈ 17, so the extra log factor costs about 17×. 2.9·10⁷ operations is comfortably within two seconds.",
        },
        {
          prompt: "Why is `long long` the default in the template rather than `int`?",
          options: [
            "It is faster",
            "Sums, products and counts in contest problems routinely pass 2.1·10⁹; a wrong answer from overflow costs far more than the few bytes",
            "`int` is not allowed on judges",
            "Because `cin` cannot read ints",
          ],
          answer: 1,
          explanation: "Counting pairs of 10⁵ elements already gives 5·10⁹. Use `long long` for values and totals, and keep `int` for indexes and loop counters.",
        },
      ],
    },
  ],
});
