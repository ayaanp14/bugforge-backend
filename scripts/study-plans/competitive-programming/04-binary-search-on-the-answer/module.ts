import { defineModule, type QuizSeed } from "../../dsl.js";
import { COWS_CASES, FACTORY_CASES, SPLIT_CASES } from "./cases.js";

/** Questions are written with the right option first; rotate each one so the key lands in varied positions. */
const spread = (qs: QuizSeed[]): QuizSeed[] =>
  qs.map((q, i) => {
    const r = (i * 3 + 1) % q.options.length;
    return { ...q, options: [...q.options.slice(r), ...q.options.slice(0, r)], answer: (q.answer - r + q.options.length) % q.options.length };
  });

export default defineModule(import.meta.url, {
  slug: "binary-search-on-the-answer",
  title: "Binary search on the answer",
  blurb: "Minimise the maximum, maximise the minimum: write a yes/no check for one guess, prove it monotone, and let about sixty halvings find the best value — with long long ranges and checks that cannot overflow.",
  icon: "branch",
  overview: `Some contest problems ask for the best value directly — the smallest possible largest part, the largest possible smallest gap, the earliest time something can be done — and computing it head-on is hard. Checking one guess is easy. When the answers to "does X work?" are monotone (no, no, …, yes, yes), binary search over the *range of answers* finds the boundary in log₂(range) checks: thirty for 10⁹, sixty for 10¹⁸.

The lesson shows the range halving on a real split, gives the two templates (first yes and last yes, and why \`mid\` rounds up in the second), and names the traps that fail solutions at the limits: sums in \`int\`, unprovable bounds and a check that overflows before it answers. The exercises are the two classics — split an array into k parts and aggressive cows — with hidden cases at 4 000 values up to 10⁹. The timed checkpoint is a factory of machines where the answer reaches 10¹⁸ and the check must stop counting before \`long long\` runs out.`,
  lessons: [
    {
      slug: "searching-the-answer-space",
      file: "01-searching-the-answer-space.md",
      exercises: [
        {
          title: "Split the array into k parts",
          prompt: `Split an array of \`n\` positive integers into \`k\` non-empty **contiguous** parts so that the largest part sum is as small as possible. Print that smallest possible largest sum.

**Input:** \`n k\` (\`1 ≤ k ≤ n ≤ 10^5\`), then \`n\` integers \`a_i\` (\`1 ≤ a_i ≤ 10^9\`).
**Output:** one integer.

\`\`\`text
5 2
7 2 5 10 8
\`\`\`
prints
\`\`\`text
18
\`\`\`

\`[7, 2, 5]\` and \`[10, 8]\` have sums 14 and 18; no split has a smaller maximum. Sums reach 10¹⁴, and the hidden cases are at the limits.`,
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
    // TODO: ok(limit) = the greedy sweep needs at most k parts when no part may exceed limit
    // TODO: binary search the first limit in [max(a), sum(a)] where ok is true
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

    // Parts needed when no part may exceed limit (limit >= every element).
    auto parts = [&](ll limit) {
        int count = 1;
        ll sum = 0;
        for (ll x : a) {
            if (sum + x > limit) {
                ++count;
                sum = 0;
            }
            sum += x;
        }
        return count;
    };

    ll lo = *max_element(a.begin(), a.end());
    ll hi = accumulate(a.begin(), a.end(), 0LL);
    while (lo < hi) {
        ll mid = lo + (hi - lo) / 2;
        if (parts(mid) <= k) hi = mid;
        else lo = mid + 1;
    }
    cout << lo << '\n';
    return 0;
}
`,
          hints: [
            "Fix a limit X. Can you tell, in one left-to-right pass, how few parts are needed so that no part sum exceeds X?",
            "Greedy: keep adding to the current part until the next number would push it past X, then start a new part. If that needs at most k parts, X is achievable — fewer parts can always be split further.",
            "The answer lies in [max(a), sum(a)]. Binary search for the first X where the part count is at most k, with every sum in long long.",
          ],
          cases: SPLIT_CASES,
        },
        {
          title: "Aggressive cows",
          prompt: `There are \`n\` stalls at distinct positions on a line and \`c\` cows. Put the cows in \`c\` different stalls so that the **smallest distance between any two cows** is as large as possible. Print that distance.

**Input:** \`n c\` (\`2 ≤ c ≤ n ≤ 10^5\`), then \`n\` distinct positions \`x_i\` (\`0 ≤ x_i ≤ 10^9\`), in any order.
**Output:** one integer.

\`\`\`text
5 3
1 2 8 4 9
\`\`\`
prints
\`\`\`text
3
\`\`\`

Cows at 1, 4 and 8 (or 9) are at least 3 apart; no placement does better.`,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, c;
    cin >> n >> c;
    vector<ll> x(n);
    for (auto& v : x) cin >> v;
    // TODO: sort the stalls
    // TODO: fits(d) = placing greedily from the left, at least c cows get a stall >= d after the last one
    // TODO: binary search the LAST d where fits is true (round mid up)
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, c;
    cin >> n >> c;
    vector<ll> x(n);
    for (auto& v : x) cin >> v;
    sort(x.begin(), x.end());

    // Can c cows stand at least d apart? Greedy: first stall, then the next one far enough.
    auto fits = [&](ll d) {
        int placed = 1;
        ll last = x[0];
        for (int i = 1; i < n && placed < c; ++i) {
            if (x[i] - last >= d) {
                ++placed;
                last = x[i];
            }
        }
        return placed >= c;
    };

    ll lo = 0, hi = x.back() - x.front();
    while (lo < hi) {
        ll mid = lo + (hi - lo + 1) / 2;   // round up: the update is lo = mid
        if (fits(mid)) lo = mid;
        else hi = mid - 1;
    }
    cout << lo << '\n';
    return 0;
}
`,
          hints: [
            "Fix a distance d. Is it possible to place all c cows at least d apart? A bigger d only makes that harder — the predicate is monotone.",
            "To check d, sort the stalls, put a cow in the first one, then each next cow in the first stall at least d past the previous cow.",
            "This time you want the LAST d that fits: lo = mid on a yes, hi = mid - 1 on a no, and mid = lo + (hi - lo + 1) / 2 so the loop always moves.",
          ],
          cases: COWS_CASES,
        },
      ],
      quiz: spread([
        {
          prompt: "Which property must the check `ok(X)` have for binary search on the answer to be correct when minimising X?",
          options: [
            "If ok(X) is true then ok(Y) is true for every Y > X",
            "ok(X) must run in O(1)",
            "ok(X) must be true for exactly one X",
            "The input array must be sorted",
          ],
          answer: 0,
          explanation: "Monotonicity is what turns the answers into a sorted row of booleans (no … no yes … yes), which is the shape binary search needs. The check may take O(n) — that is the usual case — and the input itself need not be sorted.",
        },
        {
          prompt: "Searching for the **last** X with `ok(X)` true, the loop is `while (lo < hi) { mid = lo + (hi - lo) / 2; if (ok(mid)) lo = mid; else hi = mid - 1; }`. With `lo = 4, hi = 5` and `ok(5)` true, what happens?",
          options: [
            "It loops forever",
            "It returns 5",
            "It returns 4",
            "It reads out of bounds",
          ],
          answer: 0,
          explanation: "mid rounds down to 4; if ok(4) is true, lo = mid = 4 and nothing changed, so the loop never ends. With `lo = mid` the midpoint must round up: `lo + (hi - lo + 1) / 2` gives 5.",
        },
        {
          prompt: "Splitting `n = 10^5` values, each up to `10^9`, into k parts: why must `lo`, `hi`, `mid` and the running sum be `long long`?",
          options: [
            "The total can reach 10^14, far past int's 2.1 × 10^9",
            "Binary search needs 64-bit indexes",
            "`long long` arithmetic is faster than `int`",
            "Because `accumulate` only accepts `long long`",
          ],
          answer: 0,
          explanation: "The upper bound is the total sum, up to 10^5 × 10^9 = 10^14. In int it overflows (undefined behaviour). Note that `accumulate(a.begin(), a.end(), 0)` would also sum in int — the initial value decides the type, hence `0LL`.",
        },
        {
          prompt: "For a minimise-the-maximum search over answers up to 10^18 with an O(n) check and n = 2 × 10^5, roughly how many operations does the whole search cost?",
          options: [
            "About 1.2 × 10^7",
            "About 2 × 10^5",
            "About 10^18",
            "About 4 × 10^10",
          ],
          answer: 0,
          explanation: "log2(10^18) ≈ 60 checks, each O(n) = 2 × 10^5, so about 1.2 × 10^7 — comfortably inside a one-second limit.",
        },
      ]),
    },
    {
      slug: "binary-search-on-the-answer-checkpoint",
      file: "02-checkpoint.md",
      kind: "test",
      passMark: 70,
      timeLimitMin: 45,
      exercises: [
        {
          title: "Factory machines",
          prompt: `A factory has \`n\` machines. Machine \`i\` makes one product every \`k_i\` seconds, and all machines work at the same time. What is the shortest time in which they can make \`t\` products together?

**Input:** \`n t\` (\`1 ≤ n ≤ 2·10^5\`, \`1 ≤ t ≤ 10^9\`), then \`n\` integers \`k_i\` (\`1 ≤ k_i ≤ 10^9\`).
**Output:** one integer, the minimum time in seconds.

\`\`\`text
3 7
3 2 5
\`\`\`
prints
\`\`\`text
8
\`\`\`

In 8 seconds the machines make 2 + 4 + 1 = 7 products; in 7 seconds only 2 + 3 + 1 = 6. The answer can reach 10¹⁸ — and adding up \`T / k_i\` over every machine can overflow even \`long long\`.`,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    ll t;
    cin >> n >> t;
    vector<ll> k(n);
    for (auto& x : k) cin >> x;
    // TODO: enough(T) = the machines make at least t products in T seconds (stop counting early!)
    // TODO: binary search the first T in [1, min(k) * t]
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
    ll t;
    cin >> n >> t;
    vector<ll> k(n);
    for (auto& x : k) cin >> x;

    // Products made in T seconds reach t? Stop as soon as they do: the sum of
    // T / k_i over 2·10^5 machines could pass the long long range otherwise.
    auto enough = [&](ll T) {
        ll made = 0;
        for (ll x : k) {
            made += T / x;
            if (made >= t) return true;
        }
        return false;
    };

    ll lo = 1;
    ll hi = *min_element(k.begin(), k.end()) * t;   // the fastest machine alone: at most 10^18
    while (lo < hi) {
        ll mid = lo + (hi - lo) / 2;
        if (enough(mid)) hi = mid;
        else lo = mid + 1;
    }
    cout << lo << '\n';
    return 0;
}
`,
          hints: [
            "If the machines can make t products in T seconds, they can in T + 1 seconds too. Binary search on T.",
            "The fastest machine alone makes t products in min(k) * t seconds, so that is a safe hi; lo is 1.",
            "In the check, each T / k_i can be close to 10^18. Return true the moment the running total reaches t, before it can overflow.",
          ],
          cases: FACTORY_CASES,
        },
      ],
      quiz: spread([
        {
          prompt: "Which statement wording most strongly suggests binary search on the answer?",
          options: [
            "Minimise the maximum load over all workers",
            "Count the subarrays with sum exactly k",
            "Find the shortest path between two cities",
            "Print the array in sorted order",
          ],
          answer: 0,
          explanation: "\"Minimise the maximum\" (and \"maximise the minimum\") is the signature: a guessed bound is easy to check and the answers are monotone in it.",
        },
        {
          prompt: "In the factory problem, why is `hi = min(k) * t` a correct upper bound?",
          options: [
            "The fastest machine alone makes t products in that time, so the answer is no larger",
            "It is the sum of all k_i",
            "It is the largest value long long can hold",
            "Because every machine must make t products",
          ],
          answer: 0,
          explanation: "The answer is the earliest time all machines together reach t. The fastest one by itself reaches t at min(k) · t, and the others can only help, so that time is feasible — exactly what hi must be.",
        },
        {
          prompt: "Why does the factory check return as soon as the count reaches `t`?",
          options: [
            "Adding T / k_i for every machine can overflow long long when T is near 10^18",
            "It is required for correctness of binary search in general",
            "To make the predicate monotone",
            "Because the judge counts loop iterations",
          ],
          answer: 0,
          explanation: "With T up to 10^18 and k_i = 1, a single term is 10^18 and two of them already pass 9.2 × 10^18. Stopping once the target is met keeps the running total below 2 × 10^18. Monotonicity holds either way.",
        },
        {
          prompt: "For aggressive cows (maximise the smallest gap), which update pair is right?",
          options: [
            "fits(mid) → lo = mid; otherwise hi = mid - 1, with mid rounded up",
            "fits(mid) → hi = mid; otherwise lo = mid + 1, with mid rounded down",
            "fits(mid) → lo = mid + 1; otherwise hi = mid",
            "fits(mid) → hi = mid - 1; otherwise lo = mid",
          ],
          answer: 0,
          explanation: "A gap that fits means the answer is at least mid, so keep mid (lo = mid); a gap that does not fit rules mid out (hi = mid - 1). Keeping mid on the lo side needs mid rounded up.",
        },
        {
          prompt: "What does `lo + (hi - lo) / 2` avoid that `(lo + hi) / 2` does not?",
          options: [
            "Overflow when lo and hi are both close to the type's maximum",
            "Rounding towards zero",
            "An infinite loop when hi = lo + 1",
            "Negative midpoints",
          ],
          answer: 0,
          explanation: "`lo + hi` can exceed the type's range when both are near 10^18; `hi - lo` never does. It still rounds down, so it does not fix an infinite loop caused by `lo = mid`.",
        },
        {
          prompt: "A range of candidate answers is 1 … 10^9. How many checks does the search make, at most?",
          options: ["About 30", "About 10", "About 1000", "About 10^9"],
          answer: 0,
          explanation: "Each check halves the range: log2(10^9) ≈ 29.9, so 30 checks.",
        },
        {
          prompt: "Splitting `[7, 2, 5, 10, 8]` into 2 parts, the search checks `X = 15`. How many parts does the greedy sweep make, and what does the search do?",
          options: [
            "3 parts, so lo = 16",
            "2 parts, so hi = 15",
            "3 parts, so hi = 15",
            "4 parts, so lo = 16",
          ],
          answer: 0,
          explanation: "7 + 2 + 5 = 14, then 10 would make 24 > 15, so a new part [10]; 10 + 8 = 18 > 15, a third part [8]. 3 > 2, so 15 fails and lo becomes 16.",
        },
        {
          prompt: "Why may the split check count \"at most k parts\" rather than \"exactly k\"?",
          options: [
            "A split into fewer parts can always be cut further without raising the maximum, as long as k ≤ n",
            "Because the judge accepts fewer parts",
            "Because binary search ignores the exact count",
            "It may not — it must be exactly k",
          ],
          answer: 0,
          explanation: "Cutting a part into two never increases any part's sum, so any split into fewer than k parts can be refined to exactly k with the same or smaller maximum.",
        },
        {
          prompt: "A check `ok(X)` takes O(n log n) because it sorts. With n = 10^5 and answers up to 10^9, about how much work is the search?",
          options: [
            "About 30 × 1.7 × 10^6 ≈ 5 × 10^7",
            "About 10^5",
            "About 10^14",
            "About 1.7 × 10^6",
          ],
          answer: 0,
          explanation: "30 checks × n log n ≈ 30 × 10^5 × 17. If the sort does not depend on X, do it once outside the search and the check becomes O(n).",
        },
        {
          prompt: "Which problem is **not** solved by binary search on the answer?",
          options: [
            "Count how many pairs in an array sum to k",
            "Koko's minimum eating speed to finish in h hours",
            "Ship packages within D days with the least capacity",
            "Place balls in baskets to maximise the minimum magnetic force",
          ],
          answer: 0,
          explanation: "Counting pairs has no answer to guess and no monotone yes/no check; it is a hashing or two-pointer problem. The other three are classic minimise-the-max or maximise-the-min searches.",
        },
      ]),
    },
  ],
});
