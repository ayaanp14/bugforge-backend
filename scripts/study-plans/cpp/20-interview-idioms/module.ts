import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "interview-idioms",
  title: "Interview idioms",
  blurb: "The contest template and what it costs, the STL idiom sheet, the pitfalls that fail interviews, implementing vector and a hash map by hand, clean solutions under pressure, and the C++ theory drill.",
  icon: "trophy",
  overview: `Nineteen modules taught the language. This one teaches the round: how a C++ interview or contest is actually conducted, what is actually judged, and the small set of habits that turn knowing C++ into passing.

It opens with the template — \`#include <bits/stdc++.h>\`, \`using namespace std;\`, the two fast-I/O lines, \`long long\` by default — presented honestly as contest idioms with a measured cost, so you can use them under a clock and explain in the same breath why production code does not. The idiom sheet names the shapes interview problems take and the two-to-six-line STL for each: sort–unique–erase, \`lower_bound\` for "first ≥", counting with \`std::map\`, a \`std::priority_queue\` of pairs, \`std::tuple\` for a multi-key sort. The pitfalls lesson is the review pass — \`int\` products, unsigned \`size()\`, \`1 << 31\`, \`%\` on negatives, \`std::endl\`, \`map[]\`, invalidated iterators — that catches most "correct but rejected" solutions. Implement-the-built-in is the question every senior C++ interview asks in some form: a \`Vec<T>\` with the rule of five and doubling growth, a \`UniquePtr<T>\`, a chaining hash map, and a string with SSO in outline. Clean solutions is about legibility; the theory drill is thirty questions with the answers an interviewer wants to hear.

The exercises are the problems interviewers set, written the way the module says to write them: statistics with the template, a character grid, distinct values with \`lower_bound\` queries, the k rarest words through a bounded heap, a fixer for four broken idioms, fifteen expressions to predict before running, the vector and the hash map by hand, balanced brackets with pure helpers, a leaderboard with tuple keys, and a dispatch drill. The final checkpoint — an LRU cache, a shunting-yard evaluator and a polymorphic shape store — closes the plan.`,
  lessons: [
    {
      slug: "the-interview-template",
      file: "01-the-interview-template.md",
      exercises: [
        {
          title: "Statistics with the template",
          prompt: `Using the contest template from the lesson — \`#include <bits/stdc++.h>\`, \`using namespace std;\`, the two fast-I/O lines and \`long long\` for every value — read an integer \`n\` and then \`n\` integers, each between \`-10^12\` and \`10^12\`. Print one line:

\`count=<n> sum=<sum> min=<min> max=<max> mean=<sum / n to 2 decimals>\`

When \`n\` is \`0\` print just \`count=0\`.

**Input:** \`n\`, then \`n\` integers separated by whitespace (any line layout).
**Output:** one line.

\`\`\`text
5
3 9 -2 7 1
\`\`\`
prints
\`\`\`text
count=5 sum=18 min=-2 max=9 mean=3.60
\`\`\``,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    // TODO: read n values into long longs, track sum, min and max
    // TODO: print count=0 when n is 0, otherwise the full line (mean fixed to 2 decimals)
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
    ll sum = 0, lo = LLONG_MAX, hi = LLONG_MIN;
    for (int i = 0; i < n; ++i) {
        ll x;
        cin >> x;
        sum += x;
        lo = min(lo, x);
        hi = max(hi, x);
    }
    if (n == 0) {
        cout << "count=0\n";
        return 0;
    }
    cout << "count=" << n << " sum=" << sum << " min=" << lo << " max=" << hi
         << " mean=" << fixed << setprecision(2) << static_cast<double>(sum) / n << '\n';
    return 0;
}
`,
          hints: [
            "The values do not fit in int: 10^12 is far past 2.1 x 10^9, so read into long long.",
            "LLONG_MAX and LLONG_MIN are safe sentinels here because the n == 0 case is answered separately.",
            "fixed << setprecision(2) is sticky; set it right before printing the mean.",
          ],
          cases: [
            { stdin: "5\n3 9 -2 7 1\n", expected: "count=5 sum=18 min=-2 max=9 mean=3.60\n" },
            { stdin: "0\n", expected: "count=0\n" },
            { stdin: "3\n1000000000000 1000000000000 -5\n", expected: "count=3 sum=1999999999995 min=-5 max=1000000000000 mean=666666666665.00\n", hidden: true },
            { stdin: "1\n-42\n", expected: "count=1 sum=-42 min=-42 max=-42 mean=-42.00\n", hidden: true },
            { stdin: "4\n2 2\n2 3\n", expected: "count=4 sum=9 min=2 max=3 mean=2.25\n", hidden: true },
          ],
        },
        {
          title: "A grid of characters",
          prompt: `Read \`R\` and \`C\`, then \`R\` rows of exactly \`C\` characters, each \`.\` or \`#\`. Use the template's grid pattern — a \`vector<string>\` with one \`cin >> row\` per row — and print:

- one line per row, \`row <r>: <number of # in that row>\` (rows numbered from 0),
- \`total=<number of # in the grid>\`,
- \`busiest column=<index of the column holding the most #>\`, the lowest index on a tie (so \`0\` when the grid is empty of \`#\`).

**Input:** \`R C\`, then \`R\` lines.
**Output:** \`R + 2\` lines.

\`\`\`text
3 4
.#..
##.#
....
\`\`\`
prints
\`\`\`text
row 0: 1
row 1: 3
row 2: 0
total=4
busiest column=1
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
    // TODO: per-row counts, a per-column tally, the total, and the busiest column
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
    int total = 0;
    vector<int> perColumn(C, 0);
    for (int r = 0; r < R; ++r) {
        int here = 0;
        for (int c = 0; c < C; ++c) {
            if (g[r][c] == '#') {
                ++here;
                ++perColumn[c];
            }
        }
        total += here;
        cout << "row " << r << ": " << here << '\n';
    }
    int busiest = static_cast<int>(max_element(perColumn.begin(), perColumn.end()) - perColumn.begin());
    cout << "total=" << total << '\n';
    cout << "busiest column=" << busiest << '\n';
    return 0;
}
`,
          hints: [
            "cin >> row reads one whitespace-free token, which is exactly one grid row.",
            "Keep a vector<int> of C column counts and bump it as you scan each row.",
            "max_element returns the first largest element, which is the tie rule you need; subtract begin() for the index.",
          ],
          cases: [
            { stdin: "3 4\n.#..\n##.#\n....\n", expected: "row 0: 1\nrow 1: 3\nrow 2: 0\ntotal=4\nbusiest column=1\n" },
            { stdin: "1 1\n#\n", expected: "row 0: 1\ntotal=1\nbusiest column=0\n" },
            { stdin: "2 3\n...\n...\n", expected: "row 0: 0\nrow 1: 0\ntotal=0\nbusiest column=0\n", hidden: true },
            { stdin: "4 2\n#.\n.#\n#.\n.#\n", expected: "row 0: 1\nrow 1: 1\nrow 2: 1\nrow 3: 1\ntotal=4\nbusiest column=0\n", hidden: true },
            { stdin: "2 5\n....#\n...##\n", expected: "row 0: 1\nrow 1: 2\ntotal=3\nbusiest column=4\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What happens here?\n\n```cpp\n#include <bits/stdc++.h>\nusing namespace std;\nint count = 0;\nint main() {\n    vector<int> v{1, 2, 2};\n    cout << count(v.begin(), v.end(), 2) << '\\n';\n}\n```",
          options: ["Prints `2`", "Prints `0`", "Compile error: reference to `count` is ambiguous", "Undefined behaviour"],
          answer: 2,
          explanation: "The using-directive makes `std::count` visible at global scope beside your own `count`, and unqualified lookup finds both — g++ 14 reports \"reference to 'count' is ambiguous\". That is the real cost of `using namespace std;`: every name in the library becomes a name you cannot safely reuse (`size`, `data`, `distance`, `next`, `left` are the usual victims).",
        },
        {
          prompt: "What does `ios::sync_with_stdio(false);` do, and what rule comes with it?",
          options: [
            "Unsynchronises the C++ streams from C's `stdio`, so `cin`/`cout` keep their own buffers and run about twice as fast — after it, never mix `scanf`/`printf` with `cin`/`cout`",
            "Disables output buffering so every `<<` is written immediately",
            "Makes `cin >> x` read whole lines instead of tokens",
            "Is required before `long long` can be read with `>>`",
          ],
          answer: 0,
          explanation: "By default every `cin` read is synchronised with `stdin` so C and C++ I/O can interleave; switching that off measured 155–195 ms versus 400–470 ms for a million integers on the lab. The price is that the two I/O families no longer share a buffer, so mixing them reorders or loses data.",
        },
        {
          prompt: "And `cin.tie(nullptr);`?",
          options: [
            "Stops `cin` flushing `cout` before every read — harmless on a judge, but in an interactive program a prompt may not appear until you flush",
            "Closes `cout` so only `cerr` can print",
            "Makes `cin` skip leading whitespace",
            "Ties `cin` to `cerr` for error reporting",
          ],
          answer: 0,
          explanation: "`cin` is tied to `cout` so a prompt printed before a read is visible; untying removes a flush per read. Judges do not read prompts, so the flush is pure cost there — and the reason interactive problems tell you to flush explicitly.",
        },
        {
          prompt: "`#include <bits/stdc++.h>` is…",
          options: [
            "A standard header every compiler provides",
            "A libstdc++ internal that includes every standard header — works on GCC and on Clang using libstdc++, not on MSVC, and measured about three times the compile time of the real headers on the lab",
            "Faster to compile than the real headers because it is precompiled",
            "Required before `using namespace std;` will compile",
          ],
          answer: 1,
          explanation: "It is not part of the standard: it lives in GCC's library and Clang picks it up only when it uses that library, which the study judge does. A hello-world-sized program took about 3 s to compile with it and under 1 s with `<iostream>`, `<vector>`, `<algorithm>` and `<string>` — fine in a contest, a bad habit in a codebase.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nint n = 100000;\nlong long total = n * n;\nstd::cout << total;\n```",
          options: ["`10000000000`", "Undefined behaviour — `n * n` overflows `int` before the result is widened", "`1410065408`", "Compile error"],
          answer: 1,
          explanation: "The multiplication happens in `int` and 10¹⁰ does not fit; signed overflow is undefined behaviour, and at `-O2` the optimiser may produce anything. Widen an operand first: `1LL * n * n` or `static_cast<long long>(n) * n`. Java would print `1410065408`; C++ promises nothing.",
        },
        {
          prompt: "`#define int long long` with `signed main()` is…",
          options: [
            "Standard practice — keep it in every solution",
            "A contest hack that silently rewrites every `int` the macro sees, including in `sizeof`, overloads and code copied from elsewhere; write `using ll = long long;` and choose the type deliberately",
            "A compile error, because `main` must return `int`",
            "The only way to get 64-bit arithmetic in C++",
          ],
          answer: 1,
          explanation: "It works — `signed` is `int` spelt without the macro's reach — but it doubles every counter's size, changes which overload is chosen, and cannot be explained to an interviewer as anything but a trick. A type alias costs the same keystrokes and says what you meant.",
        },
        {
          prompt: "The loop that reads integers until the end of input is…",
          options: ["`while (!cin.eof()) { cin >> x; use(x); }`", "`while (cin >> x) { use(x); }`", "`for (;;) { cin >> x; if (x == 0) break; use(x); }`", "`while (cin.good()) { cin >> x; use(x); }`"],
          answer: 1,
          explanation: "`cin >> x` returns the stream, which converts to `false` once a read fails; the extraction and the test are one step. The `eof()` and `good()` forms test *before* reading and process the last value twice (or a zero) when the input ends without a trailing token; the sentinel form needs a sentinel the problem never promised.",
        },
      ],
    },
    {
      slug: "the-stl-idiom-sheet",
      file: "02-the-stl-idiom-sheet.md",
      exercises: [
        {
          title: "Distinct values and first-not-below queries",
          prompt: `Read an integer \`n\` and \`n\` integers (up to \`10^12\` in magnitude, so \`long long\`), then an integer \`q\` and \`q\` query values. Deduplicate with the **sort + unique + erase** idiom, then answer each query with **\`std::lower_bound\`** — the first distinct value that is \`≥ x\`.

**Output:**
- \`distinct=<number of distinct values>\`
- \`values=<the distinct values ascending, space-separated>\`, or \`values=none\` when there are none
- for each query, \`<x>: <value> at <index into the distinct list>\` or \`<x>: none\` when every value is below \`x\`

\`\`\`text
7
5 3 9 3 1 5 9
3
4
9
10
\`\`\`
prints
\`\`\`text
distinct=4
values=1 3 5 9
4: 5 at 2
9: 9 at 3
10: none
\`\`\``,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<ll> v(n);
    for (auto& x : v) cin >> x;
    // TODO: sort, unique, erase; print distinct= and values=
    int q;
    cin >> q;
    while (q--) {
        ll x;
        cin >> x;
        // TODO: lower_bound; print "<x>: <value> at <index>" or "<x>: none"
    }
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
    vector<ll> v(n);
    for (auto& x : v) cin >> x;
    sort(v.begin(), v.end());
    v.erase(unique(v.begin(), v.end()), v.end());
    cout << "distinct=" << v.size() << '\n';
    cout << "values=";
    if (v.empty()) cout << "none";
    for (size_t i = 0; i < v.size(); ++i) cout << (i ? " " : "") << v[i];
    cout << '\n';
    int q;
    cin >> q;
    while (q--) {
        ll x;
        cin >> x;
        auto it = lower_bound(v.begin(), v.end(), x);
        if (it == v.end()) cout << x << ": none\n";
        else cout << x << ": " << *it << " at " << (it - v.begin()) << '\n';
    }
    return 0;
}
`,
          hints: [
            "unique only moves the survivors to the front and returns the new end; the erase from that iterator to end() is what shrinks the vector.",
            "lower_bound returns end() when nothing is >= x; test that before dereferencing.",
            "The index is the iterator's distance from begin(): it - v.begin().",
          ],
          cases: [
            { stdin: "7\n5 3 9 3 1 5 9\n3\n4\n9\n10\n", expected: "distinct=4\nvalues=1 3 5 9\n4: 5 at 2\n9: 9 at 3\n10: none\n" },
            { stdin: "0\n2\n1\n-5\n", expected: "distinct=0\nvalues=none\n1: none\n-5: none\n" },
            { stdin: "4\n-2 -2 -2 -2\n2\n-3\n-2\n", expected: "distinct=1\nvalues=-2\n-3: -2 at 0\n-2: -2 at 0\n", hidden: true },
            { stdin: "5\n10 20 30 40 50\n3\n0\n25\n50\n", expected: "distinct=5\nvalues=10 20 30 40 50\n0: 10 at 0\n25: 30 at 2\n50: 50 at 4\n", hidden: true },
            { stdin: "3\n5000000000 1 5000000000\n1\n4999999999\n", expected: "distinct=2\nvalues=1 5000000000\n4999999999: 5000000000 at 1\n", hidden: true },
          ],
        },
        {
          title: "Word counts and the k rarest",
          prompt: `Read an integer \`n\`, then \`n\` words, then an integer \`k\` (\`k ≥ 1\`). Count the words with a **\`std::map<std::string, int>\`** through \`++freq[word]\` and print every \`<word> <count>\` in the map's (alphabetical) order. Then find the \`k\` rarest words with a **\`std::priority_queue\` of \`pair<int, string>\`** (a max-heap): push every \`(count, word)\` and, whenever the heap holds more than \`k\` entries, pop the top — so the largest pairs are evicted and the \`k\` smallest survive. Print the survivors smallest count first, ties alphabetical, as \`rarest=<word>(<count>) …\`. When \`k\` is at least the number of distinct words, every word appears.

\`\`\`text
7
b a c a b a d
2
\`\`\`
prints
\`\`\`text
a 3
b 2
c 1
d 1
rarest=c(1) d(1)
\`\`\``,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    map<string, int> freq;
    for (int i = 0; i < n; ++i) {
        string w;
        cin >> w;
        // TODO: count
    }
    int k;
    cin >> k;
    // TODO: print the table in map order
    priority_queue<pair<int, string>> heap;   // largest (count, word) on top
    // TODO: bounded heap of size k, then print the survivors ascending
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    map<string, int> freq;
    for (int i = 0; i < n; ++i) {
        string w;
        cin >> w;
        ++freq[w];
    }
    int k;
    cin >> k;
    for (const auto& [word, cnt] : freq) cout << word << ' ' << cnt << '\n';

    priority_queue<pair<int, string>> heap;   // largest (count, word) on top
    for (const auto& [word, cnt] : freq) {
        heap.emplace(cnt, word);
        if (static_cast<int>(heap.size()) > k) heap.pop();   // evict the largest survivor
    }
    vector<pair<int, string>> rare;
    while (!heap.empty()) {
        rare.push_back(heap.top());
        heap.pop();
    }
    sort(rare.begin(), rare.end());                        // pairs compare (count, then word)
    cout << "rarest=";
    for (size_t i = 0; i < rare.size(); ++i) {
        cout << (i ? " " : "") << rare[i].second << '(' << rare[i].first << ')';
    }
    cout << '\n';
    return 0;
}
`,
          hints: [
            "++freq[w] inserts the word with 0 and increments it in one step — that is the counting idiom.",
            "A max-heap capped at k keeps the k smallest: after every push, pop when the size exceeds k.",
            "The heap's own order is largest-first; move the survivors into a vector and sort it to print ascending. Pair comparison is lexicographic, so ties fall to the alphabetically earlier word.",
          ],
          cases: [
            { stdin: "7\nb a c a b a d\n2\n", expected: "a 3\nb 2\nc 1\nd 1\nrarest=c(1) d(1)\n" },
            { stdin: "3\nx x x\n5\n", expected: "x 3\nrarest=x(3)\n" },
            { stdin: "6\nq q p p r s\n3\n", expected: "p 2\nq 2\nr 1\ns 1\nrarest=r(1) s(1) p(2)\n", hidden: true },
            { stdin: "5\nzz aa zz bb aa\n1\n", expected: "aa 2\nbb 1\nzz 2\nrarest=bb(1)\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "After `std::sort(v.begin(), v.end()); std::unique(v.begin(), v.end());` — and nothing else — `v` is…",
          options: ["Deduplicated", "Still the same size: `unique` moves the survivors to the front and returns the new logical end, which you must pass to `erase`", "Sorted descending", "Empty"],
          answer: 1,
          explanation: "Algorithms never change a container's size — they only see iterators. The idiom is `v.erase(std::unique(v.begin(), v.end()), v.end());` and the elements past the returned iterator are unspecified until then.",
        },
        {
          prompt: "On a sorted `v`, `std::lower_bound(v.begin(), v.end(), x)` returns an iterator to…",
          options: ["The first element `≥ x`, or `end()`", "The first element `> x`, or `end()`", "The last element `≤ x`", "`true` if `x` is present"],
          answer: 0,
          explanation: "`lower_bound` is \"first not less than\"; `upper_bound` is \"first greater than\"; the two together bound the run of elements equal to `x`, so `upper - lower` counts occurrences. `std::binary_search` is the yes/no form.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nstd::map<std::string, int> m;\nif (m[\"a\"] == 0) std::cout << m.size();\n```",
          options: ["`0`", "`1`", "Compile error", "Undefined behaviour"],
          answer: 1,
          explanation: "`operator[]` inserts a value-initialised entry when the key is absent, so reading `m[\"a\"]` created it. That is what makes `++freq[w]` a one-line counter, and what makes `[]` wrong for a lookup that must not insert — use `find`, `count` or `contains`.",
        },
        {
          prompt: "A min-heap of `int` is spelt…",
          options: ["`std::priority_queue<int>`", "`std::priority_queue<int, std::vector<int>, std::greater<>>`", "`std::priority_queue<int, std::less<>>`", "`std::priority_queue<int, std::deque<int>>`"],
          answer: 1,
          explanation: "The default comparator is `std::less`, which puts the largest on top. The comparator is the third template argument, so the container must be named too; `std::greater<>` (transparent) flips it. The second option in the list would fail because `std::less<>` is not a container.",
        },
        {
          prompt: "`std::accumulate(v.begin(), v.end(), 0)` over 10⁵ values up to 10⁹ each…",
          options: ["Is correct — `accumulate` promotes to `long long`", "Overflows: the accumulator has the type of the initial value, `int`; pass `0LL`", "Does not compile", "Returns a `double`"],
          answer: 1,
          explanation: "The third parameter's deduced type is the running sum's type, whatever the elements are. `0LL` (or `long long{0}`) makes it 64-bit; the same trap hits `std::reduce`.",
        },
        {
          prompt: "What happens here?\n\n```cpp\nauto [lo, hi] = std::minmax(3, 7);\nstd::cout << lo << ' ' << hi;\n```",
          options: ["Prints `3 7`", "Undefined behaviour — `minmax(const T&, const T&)` returns references to the two temporaries, which are destroyed at the end of the declaration", "Compile error", "Prints `7 3`"],
          answer: 1,
          explanation: "The two-argument overload returns `std::pair<const T&, const T&>`; with prvalue arguments those references dangle immediately. With named variables it is fine; with temporaries use the initializer-list form `std::minmax({3, 7})`, which returns a `pair<T, T>` by value.",
        },
        {
          prompt: "To sort by `score` descending, then `name` ascending, the comparator is…",
          options: [
            "`std::tie(a.score, a.name) < std::tie(b.score, b.name)`",
            "`std::tie(b.score, a.name) < std::tie(a.score, b.name)`",
            "`a.score > b.score && a.name < b.name`",
            "`std::tie(a.name, a.score) > std::tie(b.name, b.score)`",
          ],
          answer: 1,
          explanation: "Tuples compare lexicographically; swapping `a` and `b` in one slot reverses that key alone. The `&&` form is not a strict weak ordering (two entries with equal scores compare unordered both ways), and the last option sorts by name first.",
        },
      ],
    },
    {
      slug: "pitfalls-that-fail-interviews",
      file: "03-pitfalls-that-fail-interviews.md",
      exercises: [
        {
          title: "Fix the idioms",
          prompt: `Four idioms a candidate wrote are broken. Their *intent* is given; write the program that produces the correct results.

Read \`n\` and \`n\` integers \`a\` (each \`|a_i| ≤ 10^9\`), then \`m\` (\`1 ≤ m ≤ 10^9\`), \`k\` (\`0 ≤ k ≤ 62\`) and \`t\` (\`0 ≤ t ≤ 10^9\`). Print:

- \`product=<the product of all a_i modulo 1000000007, in [0, MOD)>\` — the candidate wrote \`int p = 1; p = p * x % MOD;\`, which overflows and can go negative; \`1\` for an empty list.
- \`mods=<each a_i mod m, in [0, m), space-separated>\` — the candidate wrote \`x % m\`, which is negative for negative \`x\`; \`mods=none\` for an empty list.
- \`pow2=<2^k>\` — the candidate wrote \`1 << k\`, which is wrong from \`k = 31\`.
- \`tail=<the last t elements in order>\`, all of them when \`t ≥ n\`, \`tail=none\` when nothing is printed — the candidate wrote \`for (int i = a.size() - t; i < a.size(); ++i)\`, which wraps when \`t > n\`.
- \`pairs=<the number of adjacent pairs, n - 1, or 0 for an empty list>\` — the candidate wrote \`a.size() - 1\`, which wraps when \`n = 0\`.

\`\`\`text
4
3 -4 5 2
3
31
2
\`\`\`
prints
\`\`\`text
product=999999887
mods=0 2 2 2
pow2=2147483648
tail=5 2
pairs=3
\`\`\``,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;
const ll MOD = 1'000'000'007;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<ll> a(n);
    for (auto& x : a) cin >> x;
    ll m, k, t;
    cin >> m >> k >> t;
    // TODO: product (long long, normalised to [0, MOD))
    // TODO: mods (normalised to [0, m))
    // TODO: pow2 (1LL << k)
    // TODO: tail (clamp t to the size before subtracting)
    // TODO: pairs (guard the empty case)
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;
const ll MOD = 1'000'000'007;

ll floorMod(ll a, ll m) { return ((a % m) + m) % m; }   // always in [0, m)

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<ll> a(n);
    for (auto& x : a) cin >> x;
    ll m, k, t;
    cin >> m >> k >> t;

    ll product = 1;
    for (ll x : a) product = floorMod(product * floorMod(x, MOD), MOD);   // both factors < MOD, so the product fits
    cout << "product=" << product << '\n';

    cout << "mods=";
    if (a.empty()) cout << "none";
    for (size_t i = 0; i < a.size(); ++i) cout << (i ? " " : "") << floorMod(a[i], m);
    cout << '\n';

    cout << "pow2=" << (1LL << k) << '\n';

    const size_t take = min(static_cast<size_t>(t), a.size());   // clamp before subtracting
    cout << "tail=";
    if (take == 0) cout << "none";
    for (size_t i = a.size() - take; i < a.size(); ++i) cout << (i > a.size() - take ? " " : "") << a[i];
    cout << '\n';

    cout << "pairs=" << (a.empty() ? 0 : static_cast<ll>(a.size()) - 1) << '\n';
    return 0;
}
`,
          hints: [
            "Reduce each factor into [0, MOD) first; then two values below 10^9+7 multiply to under 10^18, which long long holds.",
            "((x % m) + m) % m is the non-negative remainder; % alone takes the dividend's sign.",
            "Never subtract from a size_t without checking it is large enough: clamp t with min, and answer the empty case before computing size() - 1.",
          ],
          cases: [
            { stdin: "4\n3 -4 5 2\n3\n31\n2\n", expected: "product=999999887\nmods=0 2 2 2\npow2=2147483648\ntail=5 2\npairs=3\n" },
            { stdin: "0\n7\n0\n5\n", expected: "product=1\nmods=none\npow2=1\ntail=none\npairs=0\n" },
            { stdin: "3\n1000000000 1000000000 -1\n1000000000\n62\n10\n", expected: "product=999999958\nmods=0 0 999999999\npow2=4611686018427387904\ntail=1000000000 1000000000 -1\npairs=2\n", hidden: true },
            { stdin: "2\n-7 7\n5\n1\n0\n", expected: "product=999999958\nmods=3 2\npow2=2\ntail=none\npairs=1\n", hidden: true },
          ],
        },
        {
          title: "Predict, then verify",
          prompt: `Read an integer \`k\` and \`k\` expression ids in \`1..15\`. For each id print \`<id>: <value>\`, where the value is what C++ computes for the expression below — write each expression literally (do not hard-code the answers), print \`bool\`s as \`true\`/\`false\` with \`std::boolalpha\`, and **predict every line before you run it**:

| id | expression | | id | expression |
| --- | --- | --- | --- | --- |
| 1 | \`7 / 2\` | | 9 | \`'7' - '0'\` |
| 2 | \`-7 / 2\` | | 10 | \`0.1 + 0.2 == 0.3\` |
| 3 | \`-7 % 3\` | | 11 | \`5u - 10\` |
| 4 | \`10 % -3\` | | 12 | \`std::string("abc").size() - 4\` |
| 5 | \`7 / 2.0\` | | 13 | \`INT_MAX + 1LL\` |
| 6 | \`static_cast<int>(-3.99)\` | | 14 | \`1LL << 40\` |
| 7 | \`'a' + 1\` | | 15 | \`100000 * 100000LL\` |
| 8 | \`char('a' + 1)\` | | | |

Every expression is well-defined C++20 (none overflows a signed type). Example: \`3\` then \`1 5 13\` →
\`\`\`text
1: 3
5: 3.5
13: 2147483648
\`\`\``,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;

string eval(int id) {
    ostringstream out;
    out << boolalpha;
    switch (id) {
        case 1: out << 7 / 2; break;
        // TODO: 2..15
        default: out << '?';
    }
    return out.str();
}

int main() {
    int k;
    cin >> k;
    for (int i = 0; i < k; ++i) {
        int id;
        cin >> id;
        cout << id << ": " << eval(id) << '\n';
    }
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;

string eval(int id) {
    ostringstream out;
    out << boolalpha;
    switch (id) {
        case 1: out << 7 / 2; break;
        case 2: out << -7 / 2; break;
        case 3: out << -7 % 3; break;
        case 4: out << 10 % -3; break;
        case 5: out << 7 / 2.0; break;
        case 6: out << static_cast<int>(-3.99); break;
        case 7: out << 'a' + 1; break;
        case 8: out << char('a' + 1); break;
        case 9: out << '7' - '0'; break;
        case 10: out << (0.1 + 0.2 == 0.3); break;
        case 11: out << 5u - 10; break;
        case 12: out << string("abc").size() - 4; break;
        case 13: out << INT_MAX + 1LL; break;
        case 14: out << (1LL << 40); break;
        case 15: out << 100000 * 100000LL; break;
        default: out << '?';
    }
    return out.str();
}

int main() {
    int k;
    cin >> k;
    for (int i = 0; i < k; ++i) {
        int id;
        cin >> id;
        cout << id << ": " << eval(id) << '\n';
    }
    return 0;
}
`,
          hints: [
            "Arithmetic binds tighter than <<, so out << 'a' + 1 prints the sum; a shift or a comparison needs its own parentheses.",
            "Division truncates toward zero and % takes the dividend's sign; unsigned subtraction wraps modulo 2^32 or 2^64.",
            "'a' + 1 is an int (98); only the explicit char(...) prints a letter.",
          ],
          cases: [
            { stdin: "3\n1 5 13\n", expected: "1: 3\n5: 3.5\n13: 2147483648\n" },
            { stdin: "6\n2 3 4 6 7 8\n", expected: "2: -3\n3: -1\n4: 1\n6: -3\n7: 98\n8: b\n" },
            { stdin: "6\n9 10 11 12 14 15\n", expected: "9: 7\n10: false\n11: 4294967291\n12: 18446744073709551615\n14: 1099511627776\n15: 10000000000\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What happens here?\n\n```cpp\nstd::vector<int> v;\nfor (std::size_t i = 0; i < v.size() - 1; ++i) std::cout << i;\n```",
          options: ["Prints nothing", "Undefined behaviour — `v.size() - 1` wraps to 2⁶⁴ − 1 on an empty vector, so the loop runs and reads out of range", "Compile error", "Prints `0`"],
          answer: 1,
          explanation: "`size()` is unsigned; subtracting from zero wraps rather than going negative. Write `i + 1 < v.size()` (addition never wraps here) or guard the empty case first. The same wrap is why `size() - t` is wrong when `t` may exceed the size.",
        },
        {
          prompt: "`-7 % 3` in C++ is…",
          options: ["`2`", "`-1` — the remainder takes the dividend's sign; `((a % m) + m) % m` gives the non-negative remainder", "`1`", "Implementation-defined"],
          answer: 1,
          explanation: "Since C++11 `/` truncates toward zero and `a % b == a - (a / b) * b`, so `-7 / 3` is `-2` and the remainder `-1`. Circular indexes and modular arithmetic need the normalised form; `std::abs` on the result is a different (wrong) function.",
        },
        {
          prompt: "`1 << 31` with a 32-bit `int`, compiled as C++20, is…",
          options: ["`2147483648`", "`-2147483648` — the result wraps to `INT_MIN` (and was undefined behaviour before C++20); for 2³¹ write `1LL << 31`", "A compile error", "`1`"],
          answer: 1,
          explanation: "C++20 defines signed left shift modulo 2ᴺ, so the bit lands in the sign position; shifting by 32 or more is still undefined. The intent is almost always a 64-bit power of two, and the literal's type is what fixes it.",
        },
        {
          prompt: "For an integer power such as 10⁹, `std::pow(10, 9)`…",
          options: ["Is exactly `1000000000` on every platform", "Returns a `double` that a libm may compute a hair under the true value, so `static_cast<int>` can give `999999999`; use an integer loop, or `1LL << k` for powers of two", "Does not compile", "Returns an `int`"],
          answer: 1,
          explanation: "`pow` is a floating-point function with no exactness guarantee for integral arguments in the standard; glibc happens to be exact for these, other libms are not, and past 2⁵³ a `double` cannot hold the answer at all. Integer arithmetic is the idiom.",
        },
        {
          prompt: "Printing 10⁶ lines with `std::endl` instead of `'\\n'`…",
          options: ["Costs the same", "Flushes on every line — measured about 500 ms against about 40 ms on the lab, a dozen times slower", "Is faster because the buffer stays small", "Does not compile with `sync_with_stdio(false)`"],
          answer: 1,
          explanation: "`std::endl` is `'\\n'` plus a flush, and a flush is a system call. Buffered output is written once when the program ends; a judge that times you never needs to see a partial line.",
        },
        {
          prompt: "What happens here?\n\n```cpp\nstd::vector<int> v{1, 2, 3, 4};\nfor (auto it = v.begin(); it != v.end(); ++it)\n    if (*it % 2 == 0) v.erase(it);\n```",
          options: ["Removes the even numbers", "Undefined behaviour — `erase` invalidates `it` and the loop then increments it; write `it = v.erase(it)` without the `++`, or use `std::erase_if`", "Compile error", "Removes only the `2`"],
          answer: 1,
          explanation: "Every iterator at or after an erased position is invalid. `erase` returns the iterator to the next element, which is the value the loop must continue from; C++20's `std::erase_if(v, pred)` does the whole thing in one call.",
        },
        {
          prompt: "`0.1 + 0.2 == 0.3` is…",
          options: ["`true`", "`false` — compare with a tolerance such as `std::abs(a - b) < 1e-9`, or keep the values as scaled integers", "A compile error", "Undefined behaviour"],
          answer: 1,
          explanation: "Neither `0.1` nor `0.2` is representable in binary, and the rounding errors do not cancel. Money in `long long` cents and exact fractions as numerator/denominator sidestep it; when doubles are unavoidable, compare within an epsilon that suits the magnitude.",
        },
      ],
    },
    {
      slug: "implement-the-built-in",
      file: "04-implement-the-built-in.md",
      exercises: [
        {
          title: "Vec<T> with the rule of five",
          prompt: `Implement \`template <typename T> class Vec\` — a growable array with a raw \`T*\` buffer, \`size()\`, \`capacity()\`, \`push_back\`, \`pop_back\`, \`operator[]\`, and the **rule of five** written by hand (destructor, copy constructor, copy assignment, move constructor, move assignment). Growth policy: capacity starts at \`0\`; a push into a full vector reallocates to \`1\` when the capacity is \`0\` and to **double** otherwise. A copy allocates exactly the source's size (so its capacity equals its size); a moved-from \`Vec\` is left empty with capacity \`0\`; \`pop_back\` never shrinks.

Drive a \`Vec<long long>\` with \`n\` commands:

- \`push x\` — append; \`pop\` — remove the last, or print \`empty\` when there is none
- \`get i\` — print element \`i\`, or \`out of range\`
- \`stats\` — print \`size=<s> capacity=<c>\`
- \`print\` — the elements space-separated, or \`empty\`
- \`copy\` — copy-construct a second \`Vec\`, push \`-1\` onto the copy, then print \`original: <elements> (size=<s> capacity=<c>)\` and \`copy: <elements> (size=<s> capacity=<c>)\`
- \`move\` — move-construct a second \`Vec\` from the current one, print \`moved: size=<s> capacity=<c>\` and \`source: size=<s> capacity=<c>\`; the current \`Vec\` stays in its moved-from state for later commands

\`\`\`text
9
push 1
push 2
push 3
stats
print
get 1
get 3
pop
stats
\`\`\`
prints
\`\`\`text
size=3 capacity=4
1 2 3
2
out of range
size=2 capacity=4
\`\`\``,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;

template <typename T>
class Vec {
    T* data_ = nullptr;
    size_t size_ = 0;
    size_t cap_ = 0;

    void grow() {
        // TODO: new capacity 1 or double; move the elements across; delete[] the old buffer
    }

public:
    Vec() = default;
    ~Vec() { delete[] data_; }
    // TODO: copy constructor (capacity = size), copy assignment, move constructor, move assignment

    size_t size() const { return size_; }
    size_t capacity() const { return cap_; }
    bool empty() const { return size_ == 0; }
    void push_back(T v) {
        // TODO
    }
    void pop_back() { --size_; }
    T& operator[](size_t i) { return data_[i]; }
    const T& operator[](size_t i) const { return data_[i]; }
};

template <typename T>
void printElements(const Vec<T>& v) {
    if (v.empty()) cout << "empty";
    for (size_t i = 0; i < v.size(); ++i) cout << (i ? " " : "") << v[i];
}

int main() {
    int n;
    cin >> n;
    Vec<long long> v;
    for (int i = 0; i < n; ++i) {
        string cmd;
        cin >> cmd;
        // TODO: push, pop, get, stats, print, copy, move
    }
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;

template <typename T>
class Vec {
    T* data_ = nullptr;
    size_t size_ = 0;
    size_t cap_ = 0;

    void grow() {
        const size_t next = cap_ == 0 ? 1 : cap_ * 2;
        T* fresh = new T[next];
        for (size_t i = 0; i < size_; ++i) fresh[i] = std::move(data_[i]);
        delete[] data_;
        data_ = fresh;
        cap_ = next;
    }

public:
    Vec() = default;
    ~Vec() { delete[] data_; }

    Vec(const Vec& o) : data_(o.size_ ? new T[o.size_] : nullptr), size_(o.size_), cap_(o.size_) {
        std::copy(o.data_, o.data_ + o.size_, data_);
    }
    Vec(Vec&& o) noexcept : data_(o.data_), size_(o.size_), cap_(o.cap_) {
        o.data_ = nullptr;
        o.size_ = o.cap_ = 0;
    }
    Vec& operator=(const Vec& o) {          // copy-and-swap: strong guarantee, self-assignment safe
        Vec tmp(o);
        swap(tmp);
        return *this;
    }
    Vec& operator=(Vec&& o) noexcept {
        if (this != &o) {
            delete[] data_;
            data_ = o.data_;
            size_ = o.size_;
            cap_ = o.cap_;
            o.data_ = nullptr;
            o.size_ = o.cap_ = 0;
        }
        return *this;
    }
    void swap(Vec& o) noexcept {
        std::swap(data_, o.data_);
        std::swap(size_, o.size_);
        std::swap(cap_, o.cap_);
    }

    size_t size() const { return size_; }
    size_t capacity() const { return cap_; }
    bool empty() const { return size_ == 0; }
    void push_back(T v) {                   // by value: v is already a copy if it aliased an element
        if (size_ == cap_) grow();
        data_[size_++] = std::move(v);
    }
    void pop_back() { --size_; }
    T& operator[](size_t i) { return data_[i]; }
    const T& operator[](size_t i) const { return data_[i]; }
};

template <typename T>
void printElements(const Vec<T>& v) {
    if (v.empty()) cout << "empty";
    for (size_t i = 0; i < v.size(); ++i) cout << (i ? " " : "") << v[i];
}

int main() {
    int n;
    cin >> n;
    Vec<long long> v;
    for (int i = 0; i < n; ++i) {
        string cmd;
        cin >> cmd;
        if (cmd == "push") {
            long long x;
            cin >> x;
            v.push_back(x);
        } else if (cmd == "pop") {
            if (v.empty()) cout << "empty\n";
            else v.pop_back();
        } else if (cmd == "get") {
            size_t idx;
            cin >> idx;
            if (idx < v.size()) cout << v[idx] << '\n';
            else cout << "out of range\n";
        } else if (cmd == "stats") {
            cout << "size=" << v.size() << " capacity=" << v.capacity() << '\n';
        } else if (cmd == "print") {
            printElements(v);
            cout << '\n';
        } else if (cmd == "copy") {
            Vec<long long> c = v;
            c.push_back(-1);
            cout << "original: ";
            printElements(v);
            cout << " (size=" << v.size() << " capacity=" << v.capacity() << ")\n";
            cout << "copy: ";
            printElements(c);
            cout << " (size=" << c.size() << " capacity=" << c.capacity() << ")\n";
        } else if (cmd == "move") {
            Vec<long long> taken = std::move(v);
            cout << "moved: size=" << taken.size() << " capacity=" << taken.capacity() << '\n';
            cout << "source: size=" << v.size() << " capacity=" << v.capacity() << '\n';
        }
    }
    return 0;
}
`,
          hints: [
            "grow() allocates the new buffer, moves size_ elements across, deletes the old one and only then updates data_ and cap_.",
            "The copy constructor allocates exactly o.size_ and std::copy's the elements; the move constructor steals the three members and zeroes the source.",
            "Copy assignment as copy-and-swap (Vec tmp(o); swap(tmp);) is short and handles self-assignment; move assignment must guard this != &o before deleting.",
          ],
          cases: [
            { stdin: "9\npush 1\npush 2\npush 3\nstats\nprint\nget 1\nget 3\npop\nstats\n", expected: "size=3 capacity=4\n1 2 3\n2\nout of range\nsize=2 capacity=4\n" },
            { stdin: "5\nstats\npop\nprint\npush 7\ncopy\n", expected: "size=0 capacity=0\nempty\nempty\noriginal: 7 (size=1 capacity=1)\ncopy: 7 -1 (size=2 capacity=2)\n" },
            { stdin: "7\npush 5\npush 6\npush 7\npush 8\npush 9\nmove\nprint\n", expected: "moved: size=5 capacity=8\nsource: size=0 capacity=0\nempty\n", hidden: true },
            { stdin: "6\npush -1\ncopy\npush 2\npush 3\nstats\nprint\n", expected: "original: -1 (size=1 capacity=1)\ncopy: -1 -1 (size=2 capacity=2)\nsize=3 capacity=4\n-1 2 3\n", hidden: true },
            { stdin: "4\npush 4\npop\npop\nstats\n", expected: "empty\nsize=0 capacity=1\n", hidden: true },
          ],
        },
        {
          title: "A chaining hash map",
          prompt: `Implement a hash map from \`std::string\` to \`int\` with **separate chaining**: a \`vector\` of \`B\` buckets, each a \`vector<pair<string, int>>\`. The hash is fixed so the buckets are deterministic: start with \`h = 0\` and, for each character \`c\` of the key taken as an \`unsigned char\`, set \`h = (h * 31 + c) % B\`. A new key is **appended** to the end of its chain; overwriting an existing key keeps its position.

Read \`B\` (\`1 ≤ B ≤ 64\`), then \`n\`, then \`n\` commands:

- \`put key value\` — insert or overwrite; prints nothing
- \`get key\` — print the value, or \`missing\`
- \`del key\` — print \`deleted\` or \`missing\`
- \`dump\` — one line per bucket, \`<b>: k=v k=v …\` in chain order or \`<b>: -\` when empty, then \`size=<number of keys>\`

\`\`\`text
4
7
put ab 1
put cd 2
put ab 3
get ab
get zz
dump
del cd
\`\`\`
prints
\`\`\`text
3
missing
0: -
1: ab=3 cd=2
2: -
3: -
size=2
deleted
\`\`\`
(\`ab\` hashes to \`((97 % 4) * 31 + 98) % 4 = 1\`; so does \`cd\`, and it joins the chain behind \`ab\`.)`,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;

class HashMap {
    vector<vector<pair<string, int>>> buckets_;
    size_t size_ = 0;

    size_t bucketOf(const string& key) const {
        size_t h = 0;
        // TODO: h = (h * 31 + c) % B over the unsigned chars of key
        return h;
    }

public:
    explicit HashMap(size_t buckets) : buckets_(buckets) {}
    void put(const string& key, int value) {
        // TODO: overwrite in place or append to the chain
    }
    optional<int> get(const string& key) const {
        // TODO
        return nullopt;
    }
    bool erase(const string& key) {
        // TODO
        return false;
    }
    size_t size() const { return size_; }
    void dump() const {
        // TODO: one line per bucket, then size=
    }
};

int main() {
    size_t B;
    int n;
    cin >> B >> n;
    HashMap table(B);
    for (int i = 0; i < n; ++i) {
        string cmd;
        cin >> cmd;
        // TODO: put, get, del, dump
    }
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;

class HashMap {
    vector<vector<pair<string, int>>> buckets_;
    size_t size_ = 0;

    size_t bucketOf(const string& key) const {
        size_t h = 0;
        for (unsigned char c : key) h = (h * 31 + c) % buckets_.size();
        return h;
    }

public:
    explicit HashMap(size_t buckets) : buckets_(buckets) {}

    void put(const string& key, int value) {
        auto& chain = buckets_[bucketOf(key)];
        for (auto& [k, v] : chain) {
            if (k == key) {
                v = value;
                return;
            }
        }
        chain.emplace_back(key, value);
        ++size_;
    }

    optional<int> get(const string& key) const {
        const auto& chain = buckets_[bucketOf(key)];
        for (const auto& [k, v] : chain) {
            if (k == key) return v;
        }
        return nullopt;
    }

    bool erase(const string& key) {
        auto& chain = buckets_[bucketOf(key)];
        for (auto it = chain.begin(); it != chain.end(); ++it) {
            if (it->first == key) {
                chain.erase(it);
                --size_;
                return true;
            }
        }
        return false;
    }

    size_t size() const { return size_; }

    void dump() const {
        for (size_t b = 0; b < buckets_.size(); ++b) {
            cout << b << ':';
            if (buckets_[b].empty()) cout << " -";
            for (const auto& [k, v] : buckets_[b]) cout << ' ' << k << '=' << v;
            cout << '\n';
        }
        cout << "size=" << size_ << '\n';
    }
};

int main() {
    size_t B;
    int n;
    cin >> B >> n;
    HashMap table(B);
    for (int i = 0; i < n; ++i) {
        string cmd;
        cin >> cmd;
        if (cmd == "put") {
            string key;
            int value;
            cin >> key >> value;
            table.put(key, value);
        } else if (cmd == "get") {
            string key;
            cin >> key;
            if (auto v = table.get(key)) cout << *v << '\n';
            else cout << "missing\n";
        } else if (cmd == "del") {
            string key;
            cin >> key;
            cout << (table.erase(key) ? "deleted" : "missing") << '\n';
        } else if (cmd == "dump") {
            table.dump();
        }
    }
    return 0;
}
`,
          hints: [
            "Reduce modulo B at every step; the intermediate then never exceeds 31 * 63 + 255 and cannot overflow.",
            "put walks the chain first: a hit assigns through the reference and returns, a miss appends and bumps size_.",
            "Return straight after the chain's erase: leaving the loop means the invalidated iterator is never incremented.",
          ],
          cases: [
            { stdin: "4\n7\nput ab 1\nput cd 2\nput ab 3\nget ab\nget zz\ndump\ndel cd\n", expected: "3\nmissing\n0: -\n1: ab=3 cd=2\n2: -\n3: -\nsize=2\ndeleted\n" },
            { stdin: "1\n5\nput x 1\nput y 2\nput z 3\ndel y\ndump\n", expected: "deleted\n0: x=1 z=3\nsize=2\n" },
            { stdin: "8\n9\nput apple 5\nput pear 7\nput plum 9\nget plum\ndel fig\ndel pear\nget pear\ndump\nget apple\n", expected: "9\nmissing\ndeleted\nmissing\n0: -\n1: -\n2: apple=5\n3: -\n4: plum=9\n5: -\n6: -\n7: -\nsize=2\n5\n", hidden: true },
            { stdin: "3\n6\nput a 1\nput b 2\nput a 9\ndump\ndel a\ndump\n", expected: "0: -\n1: a=9\n2: b=2\nsize=2\ndeleted\n0: -\n1: -\n2: b=2\nsize=1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "The rule of five says…",
          options: [
            "Every class must declare five constructors",
            "A class that needs a user-defined destructor, copy constructor or copy assignment almost certainly needs all three, and should also define the move constructor and move assignment — or it silently loses moves",
            "Five is the maximum number of members a class should have",
            "Templates need five special members, other classes three",
          ],
          answer: 1,
          explanation: "Declaring a destructor or a copy operation suppresses the implicit moves, so a resource-owning class without hand-written moves copies where `std::vector` would have moved. The rule of zero is the alternative: let `std::vector`, `std::string` and `std::unique_ptr` members own the resources and write none of the five.",
        },
        {
          prompt: "Growth by doubling makes `push_back` amortised O(1) because…",
          options: [
            "Each push copies at most one element",
            "Over `n` pushes the copies total at most 1 + 2 + 4 + … < 2n, so the average per push is constant even though one push may copy everything",
            "The allocator is O(1)",
            "Doubling is O(log n) per push",
          ],
          answer: 1,
          explanation: "The geometric series bounds the total work; growing by a constant amount instead (say +16) makes the copies sum to O(n²). `std::vector` in libstdc++ doubles; other libraries use 1.5.",
        },
        {
          prompt: "A `Vec` whose `push_back(const T& v)` calls `grow()` and then writes `data_[size_++] = v;` is used as `v.push_back(v[0])` while full. What happens?",
          options: ["Works as expected", "Undefined behaviour — `v` refers into the old buffer, which `grow()` freed before the assignment; take the parameter by value or copy it before growing", "Compile error", "Pushes `0`"],
          answer: 1,
          explanation: "The reference was formed before the reallocation and dangles after it. `std::vector` guarantees `v.push_back(v[0])` works, which is exactly why a by-hand implementation must copy first; passing by value makes the copy happen at the call, before `grow()` runs.",
        },
        {
          prompt: "Why should `Vec`'s move constructor be `noexcept`?",
          options: [
            "It is a language requirement for move constructors",
            "`std::vector<Vec>` moves its elements on reallocation only when the move constructor is `noexcept`; otherwise it copies them to keep the strong exception guarantee",
            "It makes the move faster",
            "It disables the copy constructor",
          ],
          answer: 1,
          explanation: "`std::move_if_noexcept` is what `vector` uses: a throwing move half-way through a reallocation would leave both buffers partly moved, so it falls back to copying. Stealing three pointers cannot throw, so say so.",
        },
        {
          prompt: "Lookup in a chaining hash map with `n` keys and `B` buckets costs…",
          options: ["Always O(1)", "O(1 + n/B) on average — constant when the load factor is bounded — and O(n) in the worst case when every key lands in one bucket", "O(log n)", "O(B)"],
          answer: 1,
          explanation: "You hash to a bucket in O(1) and then walk its chain, whose expected length is the load factor. `std::unordered_map` rehashes to keep that near 1; with a fixed `B` and a bad hash the chains grow linearly.",
        },
        {
          prompt: "A `UniquePtr<T>`'s copy constructor should be…",
          options: ["`= default`", "`= delete` — ownership is exclusive, so transfer is by move only", "A deep copy of the pointee", "Left undeclared so the compiler generates it"],
          answer: 1,
          explanation: "Two owners would `delete` the same object twice. Deleting the copy operations makes the mistake a compile error; the move constructor steals the pointer and nulls the source, and the destructor deletes whatever it still holds.",
        },
        {
          prompt: "Copy-and-swap assignment — `Vec& operator=(const Vec& o) { Vec tmp(o); swap(tmp); return *this; }` — gives you…",
          options: [
            "Nothing over a hand-written loop",
            "Self-assignment safety and the strong exception guarantee for free: the copy is complete before anything in `*this` changes, and `tmp` destroys the old buffer on the way out",
            "A compile error, because `swap` is not defined",
            "A move where a copy was requested",
          ],
          answer: 1,
          explanation: "If the allocation in `tmp` throws, `*this` is untouched; if `o` is `*this`, the copy is of a valid object and the swap is harmless. The cost is one extra allocation compared with reusing existing capacity, which for a reference implementation is the right trade.",
        },
      ],
    },
    {
      slug: "writing-clean-solutions",
      file: "05-writing-clean-solutions.md",
      exercises: [
        {
          title: "Balanced brackets, cleanly",
          prompt: `Read lines until the end of input. For each line decide whether its brackets \`()[]{}\` are balanced (every other character is ignored). Print \`balanced\`, or \`unbalanced at <index>\` where the index is the position of the first closing bracket that does not match — or, if some opening brackets are never closed, the position of the **earliest** unclosed opener.

Structure the solution the way the lesson says: small pure helpers \`isOpener(char)\` and \`matches(char open, char close)\`, and a pure \`firstFault(std::string_view)\` that returns \`std::optional<std::size_t>\` — \`std::nullopt\` when balanced. \`main\` only reads and prints.

\`\`\`text
{a[b](c)}
(]
((x)
\`\`\`
prints
\`\`\`text
balanced
unbalanced at 1
unbalanced at 0
\`\`\``,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;

bool isOpener(char c) { return c == '(' || c == '[' || c == '{'; }
bool isCloser(char c) { return c == ')' || c == ']' || c == '}'; }
bool matches(char open, char close) {
    // TODO
    return false;
}

// The index of the first offending bracket, or nullopt when balanced.
optional<size_t> firstFault(string_view s) {
    // TODO: a stack of opener indexes
    return nullopt;
}

int main() {
    string line;
    while (getline(cin, line)) {
        if (auto at = firstFault(line)) cout << "unbalanced at " << *at << '\n';
        else cout << "balanced\n";
    }
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;

bool isOpener(char c) { return c == '(' || c == '[' || c == '{'; }
bool isCloser(char c) { return c == ')' || c == ']' || c == '}'; }
bool matches(char open, char close) {
    return (open == '(' && close == ')') || (open == '[' && close == ']') || (open == '{' && close == '}');
}

// The index of the first offending bracket, or nullopt when balanced.
optional<size_t> firstFault(string_view s) {
    vector<size_t> openers;                       // indexes of unmatched openers, innermost last
    for (size_t i = 0; i < s.size(); ++i) {
        const char c = s[i];
        if (isOpener(c)) {
            openers.push_back(i);
        } else if (isCloser(c)) {
            if (openers.empty() || !matches(s[openers.back()], c)) return i;
            openers.pop_back();
        }
    }
    if (openers.empty()) return nullopt;
    return openers.front();                       // the earliest unclosed opener is the bottom of the stack
}

int main() {
    string line;
    while (getline(cin, line)) {
        if (auto at = firstFault(line)) cout << "unbalanced at " << *at << '\n';
        else cout << "balanced\n";
    }
    return 0;
}
`,
          hints: [
            "Push indexes, not characters — the index is what you report, and s[index] gives the character back.",
            "A closer with an empty stack, or one that does not match the top, is the fault at the closer's index.",
            "With a vector used as a stack, front() is the bottom: the earliest opener still open.",
          ],
          cases: [
            { stdin: "{a[b](c)}\n(]\n((x)\n", expected: "balanced\nunbalanced at 1\nunbalanced at 0\n" },
            { stdin: "\n)\n", expected: "balanced\nunbalanced at 0\n" },
            { stdin: "[({})]\n[(])\nabc[\n", expected: "balanced\nunbalanced at 2\nunbalanced at 3\n", hidden: true },
            { stdin: "((\nx)y(\n", expected: "unbalanced at 0\nunbalanced at 1\n", hidden: true },
          ],
        },
        {
          title: "A leaderboard with tuple keys",
          prompt: `Read an integer \`n\` and \`n\` lines \`name score seconds\` (\`score\` and \`seconds\` are non-negative integers that may exceed \`int\`). Rank the entries by **score descending, then seconds ascending, then name ascending**, using a \`std::tie\` / \`std::tuple\` comparison rather than a chain of \`if\`s. Print \`<rank>. <name> <score> <seconds>\` for each entry, then \`winner=<name of rank 1>\`.

Structure it: a \`struct Entry\`, a \`readEntries(int n)\` that returns a \`vector<Entry>\`, a \`rankEntries(vector<Entry>&)\` that sorts in place (the name \`rank\` would be ambiguous with \`std::rank\` under the using-directive), and a \`main\` that only wires them together.

\`\`\`text
4
ann 90 120
bob 95 300
cy 90 100
dee 95 300
\`\`\`
prints
\`\`\`text
1. bob 95 300
2. dee 95 300
3. cy 90 100
4. ann 90 120
winner=bob
\`\`\``,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;

struct Entry {
    string name;
    long long score;
    long long seconds;
};

vector<Entry> readEntries(int n) {
    vector<Entry> out;
    out.reserve(n);
    // TODO
    return out;
}

void rankEntries(vector<Entry>& entries) {
    // TODO: sort with a std::tie comparison
}

int main() {
    int n;
    cin >> n;
    vector<Entry> entries = readEntries(n);
    rankEntries(entries);
    // TODO: print the ranking and the winner
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;

struct Entry {
    string name;
    long long score;
    long long seconds;
};

vector<Entry> readEntries(int n) {
    vector<Entry> out;
    out.reserve(n);
    for (int i = 0; i < n; ++i) {
        Entry e;
        cin >> e.name >> e.score >> e.seconds;
        out.push_back(std::move(e));
    }
    return out;
}

void rankEntries(vector<Entry>& entries) {
    sort(entries.begin(), entries.end(), [](const Entry& a, const Entry& b) {
        // score descending (b before a in that slot), then seconds and name ascending
        return tie(b.score, a.seconds, a.name) < tie(a.score, b.seconds, b.name);
    });
}

int main() {
    int n;
    cin >> n;
    vector<Entry> entries = readEntries(n);
    rankEntries(entries);
    for (size_t i = 0; i < entries.size(); ++i) {
        const Entry& e = entries[i];
        cout << i + 1 << ". " << e.name << ' ' << e.score << ' ' << e.seconds << '\n';
    }
    if (!entries.empty()) cout << "winner=" << entries.front().name << '\n';
    return 0;
}
`,
          hints: [
            "std::tie builds a tuple of references; tuples compare element by element, left to right.",
            "To reverse one key, swap a and b in that slot only: tie(b.score, a.seconds, a.name) < tie(a.score, b.seconds, b.name).",
            "The alternative is make_tuple(-a.score, a.seconds, a.name) < make_tuple(-b.score, …) — fine while negation cannot overflow.",
          ],
          cases: [
            { stdin: "4\nann 90 120\nbob 95 300\ncy 90 100\ndee 95 300\n", expected: "1. bob 95 300\n2. dee 95 300\n3. cy 90 100\n4. ann 90 120\nwinner=bob\n" },
            { stdin: "1\nsolo 0 0\n", expected: "1. solo 0 0\nwinner=solo\n" },
            { stdin: "3\nz 10 5\ny 10 5\nx 10 5\n", expected: "1. x 10 5\n2. y 10 5\n3. z 10 5\nwinner=x\n", hidden: true },
            { stdin: "3\na 1 999\nb 2 1\nc 2 2\n", expected: "1. b 2 1\n2. c 2 2\n3. a 1 999\nwinner=b\n", hidden: true },
            { stdin: "2\nbig 10000000000 1\nsmall 9999999999 0\n", expected: "1. big 10000000000 1\n2. small 9999999999 0\nwinner=big\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Keeping `solve()` separate from `main`'s reading and printing mainly buys…",
          options: ["Speed", "Testability, readability, and an easy change when the input source changes — a pure function can be checked in your head and reused", "Fewer includes", "Nothing measurable"],
          answer: 1,
          explanation: "The interviewer reads the algorithm without wading through parsing, and when the question changes (\"now the numbers arrive one per line\") only `main` changes. A function that both computes and prints is twice as hard to reason about.",
        },
        {
          prompt: "A guard clause such as `if (v.empty()) return 0;` at the top of a function…",
          options: ["Is poor style — one exit point only", "Makes the edge case visible in one line and keeps the main algorithm free of special cases", "Slows the function", "Belongs in a `catch`"],
          answer: 1,
          explanation: "One line per edge case, each a sentence the interviewer can tick off. The single-exit rule is a C-era habit that RAII made unnecessary in C++ — nothing leaks on an early return.",
        },
        {
          prompt: "The highest-leverage sentence to say unprompted after coding is…",
          options: ["\"I think it works\"", "The time and space complexity, and the trade-off you considered", "\"C++ is fast\"", "The line count"],
          answer: 1,
          explanation: "It shows you know what you built and that you weighed the alternative — \"O(n log n) for the sort; a hash set would make it O(n) but lose the ordered output\". Interviewers score reasoning, not typing.",
        },
        {
          prompt: "A good comment in a solution explains…",
          options: ["What each line does", "Why a non-obvious decision is correct or which invariant holds", "The language syntax", "Nothing — solutions should have no comments"],
          answer: 1,
          explanation: "`// v is sorted, so once v[i] > target no later pair can work` justifies a `break`; `// increment i` is noise. Delete the debugging prints before saying \"done\" — a stray `cerr` is harmless, a stray `cout` is a wrong answer.",
        },
        {
          prompt: "Which is the clean C++ for \"sum of squares of a `vector<int>`\" when the sum may exceed `int`?",
          options: [
            "`int s = 0; for (auto x : v) s += x * x;`",
            "`long long s = 0; for (long long x : v) s += x * x;`",
            "`std::accumulate(v.begin(), v.end(), 0, [](int a, int x) { return a + x * x; })`",
            "`double s = 0; for (auto x : v) s += x * x;`",
          ],
          answer: 1,
          explanation: "Naming the loop variable `long long` widens each element before the multiplication, so both the square and the sum are 64-bit. The first two alternatives compute `x * x` in `int` (undefined on overflow); `double` loses exactness past 2⁵³.",
        },
        {
          prompt: "`for (const auto& s : names)` over a `std::vector<std::string>`…",
          options: ["Copies each string", "Reads each string through a reference without copying; plain `auto` would copy every element", "Does not compile", "Allows `s` to be modified"],
          answer: 1,
          explanation: "`auto` deduces a value and so copies; `const auto&` binds to the element in place. The rule of thumb: `const auto&` to read, `auto&` to modify, `auto` only when you want a copy.",
        },
        {
          prompt: "When stuck in an interview, the right move is…",
          options: ["Silence until the optimal solution appears", "Say what you know, write a clean, labelled brute force, then look for the redundant work in it", "Give up on the question", "Ask for the answer"],
          answer: 1,
          explanation: "A working O(n²) with a stated complexity earns partial credit and, often, shows where the O(n log n) is hiding — the repeated scan becomes a sort, the repeated lookup becomes a map.",
        },
      ],
    },
    {
      slug: "cpp-theory-drill",
      file: "06-cpp-theory-drill.md",
      exercises: [
        {
          title: "Static versus dynamic dispatch",
          prompt: `Write \`struct Animal\` with a virtual destructor, \`virtual std::string speak() const\` returning \`...\`, and a **non-virtual** \`std::string kind() const\` returning \`animal\`. Derive \`Dog\` (\`speak\` overrides to \`Woof\`; \`kind\` is redeclared to return \`dog\` — hiding, not overriding) and \`Cat\` (\`Meow\`, \`cat\`). Add three free overloads \`describe(const Animal&)\`, \`describe(const Dog&)\`, \`describe(const Cat&)\` returning \`describe(Animal)\`, \`describe(Dog)\` and \`describe(Cat)\`.

Read \`n\` and \`n\` words \`dog\`/\`cat\`. For each, create the animal in a \`std::unique_ptr<Animal>\` and print one line:

\`<word>: speak=<a->speak()> describe=<describe(*a)> cast=<describe(...) after a dynamic_cast to the real type> kind=<a->kind()> sliced=<speak() of an Animal copy-constructed from *a>\`

Predict before running: the override is chosen at run time, the overload at compile time, the non-virtual call by the static type, and the slice keeps only the base.

\`\`\`text
2
dog cat
\`\`\`
prints
\`\`\`text
dog: speak=Woof describe=describe(Animal) cast=describe(Dog) kind=animal sliced=...
cat: speak=Meow describe=describe(Animal) cast=describe(Cat) kind=animal sliced=...
\`\`\``,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;

struct Animal {
    virtual ~Animal() = default;
    virtual string speak() const { return "..."; }
    string kind() const { return "animal"; }
};
// TODO: Dog and Cat

string describe(const Animal&) { return "describe(Animal)"; }
// TODO: describe(const Dog&), describe(const Cat&)

int main() {
    int n;
    cin >> n;
    for (int i = 0; i < n; ++i) {
        string word;
        cin >> word;
        unique_ptr<Animal> a;
        // TODO: make the right animal, then print the line
    }
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;

struct Animal {
    virtual ~Animal() = default;
    virtual string speak() const { return "..."; }
    string kind() const { return "animal"; }
};
struct Dog : Animal {
    string speak() const override { return "Woof"; }
    string kind() const { return "dog"; }            // hides Animal::kind; not virtual, so never dispatched
};
struct Cat : Animal {
    string speak() const override { return "Meow"; }
    string kind() const { return "cat"; }
};

string describe(const Animal&) { return "describe(Animal)"; }
string describe(const Dog&) { return "describe(Dog)"; }
string describe(const Cat&) { return "describe(Cat)"; }

int main() {
    int n;
    cin >> n;
    for (int i = 0; i < n; ++i) {
        string word;
        cin >> word;
        unique_ptr<Animal> a;
        if (word == "dog") a = make_unique<Dog>();
        else a = make_unique<Cat>();

        string cast;
        if (auto* d = dynamic_cast<Dog*>(a.get())) cast = describe(*d);
        else cast = describe(*dynamic_cast<Cat*>(a.get()));

        Animal sliced = *a;                              // copies the Animal part only
        cout << word << ": speak=" << a->speak()
             << " describe=" << describe(*a)
             << " cast=" << cast
             << " kind=" << a->kind()
             << " sliced=" << sliced.speak() << '\n';
    }
    return 0;
}
`,
          hints: [
            "Overload resolution uses the static type of the argument: describe(*a) with an Animal& always picks describe(const Animal&).",
            "dynamic_cast<Dog*> yields nullptr for a Cat; test it in an if-with-initialiser and fall through to the Cat cast.",
            "Animal sliced = *a; runs Animal's copy constructor, so sliced.speak() is the base version whatever *a really was.",
          ],
          cases: [
            { stdin: "2\ndog cat\n", expected: "dog: speak=Woof describe=describe(Animal) cast=describe(Dog) kind=animal sliced=...\ncat: speak=Meow describe=describe(Animal) cast=describe(Cat) kind=animal sliced=...\n" },
            { stdin: "1\ncat\n", expected: "cat: speak=Meow describe=describe(Animal) cast=describe(Cat) kind=animal sliced=...\n" },
            { stdin: "3\ndog dog cat\n", expected: "dog: speak=Woof describe=describe(Animal) cast=describe(Dog) kind=animal sliced=...\ndog: speak=Woof describe=describe(Animal) cast=describe(Dog) kind=animal sliced=...\ncat: speak=Meow describe=describe(Animal) cast=describe(Cat) kind=animal sliced=...\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "The rule of five, in one sentence:",
          options: [
            "Every class needs five constructors",
            "If you write any of destructor, copy constructor or copy assignment, write all three plus the move constructor and move assignment — or write none and let members own the resources (rule of zero)",
            "Five is the number of access specifiers",
            "It only applies to templates",
          ],
          answer: 1,
          explanation: "Lead with the definition, add the consequence: a user-declared destructor or copy suppresses the implicit moves, so an owning class without them copies when it could move. Then name the alternative.",
        },
        {
          prompt: "`std::unique_ptr` versus `std::shared_ptr`:",
          options: [
            "They are interchangeable",
            "Exclusive ownership, zero overhead, move-only; versus shared ownership through a reference-counted control block, copyable, with atomic count updates and the cycle hazard `weak_ptr` exists to break",
            "`shared_ptr` is faster",
            "`unique_ptr` cannot hold arrays",
          ],
          answer: 1,
          explanation: "The default is `unique_ptr`; `shared_ptr` is for genuinely shared lifetime, and `make_shared` puts object and control block in one allocation. Two `shared_ptr`s pointing at each other never reach zero — hence `weak_ptr`.",
        },
        {
          prompt: "`const` versus `constexpr`:",
          options: [
            "Synonyms",
            "`const` means the value will not change after initialisation (possibly at run time); `constexpr` means it is computable at compile time and may be used where a constant expression is required — array bounds, template arguments, `static_assert`",
            "`constexpr` is slower",
            "`const` only applies to pointers",
          ],
          answer: 1,
          explanation: "`const int n = read();` is legal and run-time; `constexpr int n = read();` is not. A `constexpr` function may still run at run time when called with run-time arguments.",
        },
        {
          prompt: "`std::map` versus `std::unordered_map`:",
          options: [
            "Same complexity, different names",
            "A balanced tree: O(log n), ordered iteration, `lower_bound`, needs `<`; versus a hash table: O(1) average, O(n) worst, unspecified order, needs a hash and `==`",
            "`unordered_map` is always faster",
            "`map` cannot hold strings",
          ],
          answer: 1,
          explanation: "Choose by the operation the problem needs: range or ordered output says tree; pure lookup says hash. Say both facts and the hazards — `[]` inserts in both, and unordered iteration order must never reach the output.",
        },
        {
          prompt: "References versus pointers:",
          options: [
            "No difference after compilation, so no difference at all",
            "A reference is an alias that must be bound at initialisation, cannot be reseated and cannot be null; a pointer is a value that can be null, reseated and used for arithmetic — use references for parameters and pointers for optional or reseatable relationships",
            "Pointers are safer",
            "References can be null too",
          ],
          answer: 1,
          explanation: "Both can dangle. The choice is about what the code says: a `T&` parameter promises an object; a `T*` says \"may be absent\" or \"may change what it points to\"; `std::optional` and smart pointers cover the ownership cases.",
        },
        {
          prompt: "What does `std::move` do?",
          options: [
            "Moves the object",
            "Nothing at run time: it is a cast to an rvalue reference that lets overload resolution pick the move constructor or move assignment; the source is left valid but unspecified",
            "Copies the object and deletes the original",
            "Zeroes the source",
          ],
          answer: 1,
          explanation: "The move happens in the constructor that receives the rvalue. `std::move` on a `const` object silently selects the copy, and `return std::move(local)` defeats copy elision.",
        },
        {
          prompt: "What does this print?\n\n```cpp\nstruct Base { virtual std::string f() const { return \"base\"; } };\nstruct Derived : Base { std::string f() const override { return \"derived\"; } };\nint main() {\n    Derived d;\n    Base b = d;\n    Base& r = d;\n    std::cout << b.f() << ' ' << r.f();\n}\n```",
          options: ["`derived derived`", "`base derived` — `b` is a sliced copy holding only the `Base` part; `r` refers to the whole `Derived`", "`base base`", "Compile error"],
          answer: 1,
          explanation: "Dynamic dispatch needs an object of the derived type behind a base reference or pointer. Copying into a `Base` value slices the derived part away, so the virtual call has nothing to dispatch to.",
        },
        {
          prompt: "Templates versus inheritance for polymorphism:",
          options: [
            "Always inheritance",
            "Templates give static polymorphism — resolved at compile time, inlinable, no vtable, but one instantiation per type and errors at instantiation; virtual functions give dynamic polymorphism — one compiled function, a container of mixed types through a base pointer, an indirect call per invocation",
            "Templates are slower",
            "Inheritance cannot express interfaces",
          ],
          answer: 1,
          explanation: "`std::sort` with a comparator is the template style; a `std::vector<std::unique_ptr<Shape>>` is the virtual style. Concepts (Module 12) give templates the readable interface the virtual style always had.",
        },
        {
          prompt: "Undefined behaviour is…",
          options: [
            "A run-time error the program reports",
            "A construct the standard places no requirements on — signed overflow, an out-of-range index, a dangling reference, a data race — so the compiler may assume it never happens and optimise on that assumption",
            "Behaviour that differs between compilers but is documented",
            "Only possible with pointers",
          ],
          answer: 1,
          explanation: "That last clause is the interview answer: `if (x + 1 < x)` can be deleted because signed overflow \"cannot\" occur. Distinguish it from implementation-defined (documented, e.g. `sizeof(int)`) and unspecified (one of several, e.g. evaluation order of function arguments).",
        },
      ],
    },
    {
      slug: "interview-idioms-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "An LRU cache",
          prompt: `Implement a least-recently-used cache with O(1) \`get\` and \`put\` from a \`std::list<std::pair<int, int>>\` in recency order (front = most recent) and a \`std::unordered_map<int, std::list<...>::iterator>\` from key to node. A \`get\` on a present key moves its node to the front with \`splice\`; a \`put\` on a present key updates the value and moves it to the front; a \`put\` of a new key into a full cache first evicts the node at the back.

Read the capacity \`C\` (\`C ≥ 1\`), then \`n\`, then \`n\` commands \`get <key>\` or \`put <key> <value>\`. For each \`get\` print \`hit <value>\` or \`miss\`. After all commands print \`hits=<h> misses=<m>\` and \`cache=<keys most recent first, space-separated>\` (or \`cache=empty\`).

\`\`\`text
2
7
put 1 1
put 2 2
get 1
put 3 3
get 2
get 3
get 1
\`\`\`
prints
\`\`\`text
hit 1
miss
hit 3
hit 1
hits=3 misses=1
cache=1 3
\`\`\``,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;

class LruCache {
    size_t cap_;
    list<pair<int, int>> order_;                                 // front = most recently used
    unordered_map<int, list<pair<int, int>>::iterator> where_;

public:
    explicit LruCache(size_t cap) : cap_(cap) {}
    optional<int> get(int key) {
        // TODO: find, splice to the front, return the value
        return nullopt;
    }
    void put(int key, int value) {
        // TODO: update-and-front, or evict-then-insert
    }
    const list<pair<int, int>>& order() const { return order_; }
};

int main() {
    size_t C;
    int n;
    cin >> C >> n;
    LruCache cache(C);
    int hits = 0, misses = 0;
    for (int i = 0; i < n; ++i) {
        string cmd;
        cin >> cmd;
        // TODO
    }
    cout << "hits=" << hits << " misses=" << misses << '\n';
    // TODO: cache=
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;

class LruCache {
    size_t cap_;
    list<pair<int, int>> order_;                                 // front = most recently used
    unordered_map<int, list<pair<int, int>>::iterator> where_;

public:
    explicit LruCache(size_t cap) : cap_(cap) {}

    optional<int> get(int key) {
        auto it = where_.find(key);
        if (it == where_.end()) return nullopt;
        order_.splice(order_.begin(), order_, it->second);     // relink in place: the iterator stays valid
        return it->second->second;
    }

    void put(int key, int value) {
        if (auto it = where_.find(key); it != where_.end()) {
            it->second->second = value;
            order_.splice(order_.begin(), order_, it->second);
            return;
        }
        if (order_.size() == cap_) {
            where_.erase(order_.back().first);
            order_.pop_back();
        }
        order_.emplace_front(key, value);
        where_[key] = order_.begin();
    }

    const list<pair<int, int>>& order() const { return order_; }
};

int main() {
    size_t C;
    int n;
    cin >> C >> n;
    LruCache cache(C);
    int hits = 0, misses = 0;
    for (int i = 0; i < n; ++i) {
        string cmd;
        cin >> cmd;
        if (cmd == "get") {
            int key;
            cin >> key;
            if (auto v = cache.get(key)) {
                ++hits;
                cout << "hit " << *v << '\n';
            } else {
                ++misses;
                cout << "miss\n";
            }
        } else {
            int key, value;
            cin >> key >> value;
            cache.put(key, value);
        }
    }
    cout << "hits=" << hits << " misses=" << misses << '\n';
    cout << "cache=";
    if (cache.order().empty()) cout << "empty";
    bool first = true;
    for (const auto& [key, value] : cache.order()) {
        cout << (first ? "" : " ") << key;
        first = false;
    }
    cout << '\n';
    return 0;
}
`,
          hints: [
            "list::splice(order_.begin(), order_, it) moves one node to the front without invalidating any iterator — that is why std::list, not std::vector.",
            "Evict before inserting: erase the back's key from the map, pop_back, then emplace_front and record begin().",
            "Printing the list from the front gives most-recent-first; the map's order is never printed.",
          ],
          cases: [
            { stdin: "2\n7\nput 1 1\nput 2 2\nget 1\nput 3 3\nget 2\nget 3\nget 1\n", expected: "hit 1\nmiss\nhit 3\nhit 1\nhits=3 misses=1\ncache=1 3\n" },
            { stdin: "1\n5\nput 5 50\nget 5\nput 6 60\nget 5\nget 6\n", expected: "hit 50\nmiss\nhit 60\nhits=2 misses=1\ncache=6\n" },
            { stdin: "2\n6\nput 1 1\nput 2 2\nput 1 10\nput 3 3\nget 1\nget 2\n", expected: "hit 10\nmiss\nhits=1 misses=1\ncache=1 3\n", hidden: true },
            { stdin: "3\n4\nget 9\nput 9 1\nget 9\nget 9\n", expected: "miss\nhit 1\nhit 1\nhits=2 misses=1\ncache=9\n", hidden: true },
            { stdin: "2\n1\nget 4\n", expected: "miss\nhits=0 misses=1\ncache=empty\n", hidden: true },
          ],
        },
        {
          title: "A shunting-yard evaluator",
          prompt: `Read lines until the end of input; each is an arithmetic expression over non-negative integer literals with \`+ - * / %\`, parentheses and optional spaces (the input is always well-formed; there is no unary minus). Evaluate it in \`long long\` with the **shunting-yard** two-stack method — a value stack and an operator stack; \`* / %\` bind tighter than \`+ -\`, every operator is left-associative, and an operator is applied whenever the one on top of the stack has precedence at least as high as the incoming one. Division truncates toward zero. Print the value, or \`error\` if a division or modulo by zero occurs anywhere in the expression.

\`\`\`text
1 + 2 * 3
(1 + 2) * 3
10 / 3
\`\`\`
prints
\`\`\`text
7
9
3
\`\`\``,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

int precedence(char op) { return (op == '+' || op == '-') ? 1 : 2; }

// Pops two values, applies op, pushes the result; false on division by zero.
bool applyOperator(vector<ll>& values, char op) {
    // TODO
    return false;
}

optional<ll> evaluate(const string& s) {
    vector<ll> values;
    vector<char> ops;
    // TODO: scan tokens; numbers push, '(' pushes, ')' reduces to the '(', operators reduce while top has >= precedence
    return nullopt;
}

int main() {
    string line;
    while (getline(cin, line)) {
        if (auto v = evaluate(line)) cout << *v << '\n';
        else cout << "error\n";
    }
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;
using ll = long long;

int precedence(char op) { return (op == '+' || op == '-') ? 1 : 2; }

// Pops two values, applies op, pushes the result; false on division by zero.
bool applyOperator(vector<ll>& values, char op) {
    const ll b = values.back(); values.pop_back();
    const ll a = values.back(); values.pop_back();
    ll r = 0;
    switch (op) {
        case '+': r = a + b; break;
        case '-': r = a - b; break;
        case '*': r = a * b; break;
        case '/': if (b == 0) return false; r = a / b; break;
        default:  if (b == 0) return false; r = a % b; break;
    }
    values.push_back(r);
    return true;
}

optional<ll> evaluate(const string& s) {
    vector<ll> values;
    vector<char> ops;
    auto applyTop = [&]() {
        const char op = ops.back();
        ops.pop_back();
        return applyOperator(values, op);
    };
    for (size_t i = 0; i < s.size(); ++i) {
        const char c = s[i];
        if (isspace(static_cast<unsigned char>(c))) continue;
        if (isdigit(static_cast<unsigned char>(c))) {
            ll v = 0;
            while (i < s.size() && isdigit(static_cast<unsigned char>(s[i]))) v = v * 10 + (s[i++] - '0');
            --i;                                              // the for loop steps past the last digit
            values.push_back(v);
        } else if (c == '(') {
            ops.push_back(c);
        } else if (c == ')') {
            while (ops.back() != '(') if (!applyTop()) return nullopt;
            ops.pop_back();                                   // drop the '('
        } else {
            while (!ops.empty() && ops.back() != '(' && precedence(ops.back()) >= precedence(c)) {
                if (!applyTop()) return nullopt;
            }
            ops.push_back(c);
        }
    }
    while (!ops.empty()) if (!applyTop()) return nullopt;
    return values.back();
}

int main() {
    string line;
    while (getline(cin, line)) {
        if (auto v = evaluate(line)) cout << *v << '\n';
        else cout << "error\n";
    }
    return 0;
}
`,
          hints: [
            "Read a whole number at once (accumulate digits), then step back one so the loop's ++i lands on the next character.",
            "On an operator, reduce while the stack's top is not '(' and has precedence >= the incoming operator; that is what makes 7 - 2 - 1 left-associative.",
            "A ')' reduces until the matching '(' and discards it; at the end reduce everything left. The remaining value is the answer.",
          ],
          cases: [
            { stdin: "1 + 2 * 3\n(1 + 2) * 3\n10 / 3\n", expected: "7\n9\n3\n" },
            { stdin: "7 - 2 - 1\n8 / (3 - 3)\n", expected: "4\nerror\n" },
            { stdin: "2 * (3 + 4) * 5 - 6 % 4\n100000 * 100000\n", expected: "68\n10000000000\n", hidden: true },
            { stdin: "((42))\n1+2+3+4+5\n", expected: "42\n15\n", hidden: true },
            { stdin: "2 * 3 % 4\n(8 - 10) * 3\n", expected: "2\n-6\n", hidden: true },
          ],
        },
        {
          title: "Shapes behind unique_ptr",
          prompt: `Write an abstract \`Shape\` with a virtual destructor and pure virtual \`name()\`, \`area()\` and \`perimeter()\`; derive \`Circle(r)\`, \`Rect(w, h)\` and \`Square(s)\` (mark the leaves \`final\` and every override \`override\`). Keep them in a \`std::vector<std::unique_ptr<Shape>>\` and run \`n\` commands:

- \`circle r\`, \`rect w h\`, \`square s\` — add a shape (dimensions are decimals)
- \`list\` — one line per shape, \`<index>: <name> area=<a> perimeter=<p>\`
- \`total\` — \`total area=<sum of areas>\`
- \`largest\` — \`largest=<name> <area>\` for the largest area (earliest on a tie), or \`largest=none\`
- \`remove i\` — erase the shape at index \`i\`, or print \`no such shape\`

Use \`std::numbers::pi\` and print every number with exactly two decimals.

\`\`\`text
5
circle 1
rect 2 3
square 2
list
total
\`\`\`
prints
\`\`\`text
0: circle area=3.14 perimeter=6.28
1: rect area=6.00 perimeter=10.00
2: square area=4.00 perimeter=8.00
total area=13.14
\`\`\``,
          starter: String.raw`#include <bits/stdc++.h>
using namespace std;

struct Shape {
    virtual ~Shape() = default;
    virtual string name() const = 0;
    virtual double area() const = 0;
    virtual double perimeter() const = 0;
};
// TODO: Circle, Rect, Square

int main() {
    cout << fixed << setprecision(2);
    int n;
    cin >> n;
    vector<unique_ptr<Shape>> shapes;
    for (int i = 0; i < n; ++i) {
        string cmd;
        cin >> cmd;
        // TODO
    }
    return 0;
}
`,
          solution: String.raw`#include <bits/stdc++.h>
using namespace std;

struct Shape {
    virtual ~Shape() = default;
    virtual string name() const = 0;
    virtual double area() const = 0;
    virtual double perimeter() const = 0;
};

class Circle final : public Shape {
    double r_;
public:
    explicit Circle(double r) : r_(r) {}
    string name() const override { return "circle"; }
    double area() const override { return numbers::pi * r_ * r_; }
    double perimeter() const override { return 2 * numbers::pi * r_; }
};

class Rect final : public Shape {
    double w_, h_;
public:
    Rect(double w, double h) : w_(w), h_(h) {}
    string name() const override { return "rect"; }
    double area() const override { return w_ * h_; }
    double perimeter() const override { return 2 * (w_ + h_); }
};

class Square final : public Shape {
    double s_;
public:
    explicit Square(double s) : s_(s) {}
    string name() const override { return "square"; }
    double area() const override { return s_ * s_; }
    double perimeter() const override { return 4 * s_; }
};

int main() {
    cout << fixed << setprecision(2);
    int n;
    cin >> n;
    vector<unique_ptr<Shape>> shapes;
    for (int i = 0; i < n; ++i) {
        string cmd;
        cin >> cmd;
        if (cmd == "circle") {
            double r;
            cin >> r;
            shapes.push_back(make_unique<Circle>(r));
        } else if (cmd == "rect") {
            double w, h;
            cin >> w >> h;
            shapes.push_back(make_unique<Rect>(w, h));
        } else if (cmd == "square") {
            double s;
            cin >> s;
            shapes.push_back(make_unique<Square>(s));
        } else if (cmd == "list") {
            for (size_t k = 0; k < shapes.size(); ++k) {
                cout << k << ": " << shapes[k]->name() << " area=" << shapes[k]->area()
                     << " perimeter=" << shapes[k]->perimeter() << '\n';
            }
        } else if (cmd == "total") {
            double total = 0;
            for (const auto& s : shapes) total += s->area();
            cout << "total area=" << total << '\n';
        } else if (cmd == "largest") {
            if (shapes.empty()) {
                cout << "largest=none\n";
            } else {
                auto it = max_element(shapes.begin(), shapes.end(),
                                      [](const auto& a, const auto& b) { return a->area() < b->area(); });
                cout << "largest=" << (*it)->name() << ' ' << (*it)->area() << '\n';
            }
        } else if (cmd == "remove") {
            size_t idx;
            cin >> idx;
            if (idx < shapes.size()) shapes.erase(shapes.begin() + static_cast<ptrdiff_t>(idx));
            else cout << "no such shape\n";
        }
    }
    return 0;
}
`,
          hints: [
            "make_unique<Circle>(r) converts to unique_ptr<Shape> on push_back; the virtual destructor is what makes deleting through the base pointer correct.",
            "max_element with a comparator on area() returns the first maximum — the tie rule for free.",
            "fixed << setprecision(2) set once at the top of main applies to every later double.",
          ],
          cases: [
            { stdin: "5\ncircle 1\nrect 2 3\nsquare 2\nlist\ntotal\n", expected: "0: circle area=3.14 perimeter=6.28\n1: rect area=6.00 perimeter=10.00\n2: square area=4.00 perimeter=8.00\ntotal area=13.14\n" },
            { stdin: "3\nlargest\nsquare 3\nlargest\n", expected: "largest=none\nlargest=square 9.00\n" },
            { stdin: "6\nrect 1 1\ncircle 2\nremove 0\nremove 5\nlist\nlargest\n", expected: "no such shape\n0: circle area=12.57 perimeter=12.57\nlargest=circle 12.57\n", hidden: true },
            { stdin: "5\nsquare 2\nrect 2 2\nlargest\nremove 0\nlist\n", expected: "largest=square 4.00\n0: rect area=4.00 perimeter=8.00\n", hidden: true },
            { stdin: "4\nrect 0.5 0.5\ncircle 0.5\ntotal\nlist\n", expected: "total area=1.04\n0: rect area=0.25 perimeter=2.00\n1: circle area=0.79 perimeter=3.14\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "With `using namespace std;` in force, declaring a global `int count;` and then calling `count(v.begin(), v.end(), 3)`…",
          options: ["Works — the global wins", "Is a compile error: the reference to `count` is ambiguous between your variable and `std::count`", "Calls `std::count`", "Is undefined behaviour"],
          answer: 1,
          explanation: "A using-directive puts every `std` name into the lookup set of the enclosing scope; a clash with your own name at the same scope is ambiguous. This is the concrete cost of the contest idiom, and why it stays out of headers and production code.",
        },
        {
          prompt: "`int n = 100000; long long sq = n * n;` is fixed by…",
          options: ["`long long sq = (long long)(n * n);`", "`long long sq = 1LL * n * n;` — widen an operand *before* the multiplication", "`unsigned sq = n * n;`", "Nothing; it already works"],
          answer: 1,
          explanation: "The cast after the multiplication is too late: the overflow, and the undefined behaviour, already happened in `int`. Multiplying by `1LL` first converts `n` to `long long` and the rest follows the usual arithmetic conversions.",
        },
        {
          prompt: "To read integers until the input ends you write…",
          options: ["`while (!cin.eof()) { cin >> x; … }`", "`while (cin >> x) { … }`", "`while (cin.peek() != EOF) …`", "`do { cin >> x; } while (x);`"],
          answer: 1,
          explanation: "The extraction's result *is* the loop test. The `eof()` form runs one extra iteration with a stale `x` when the input ends after whitespace.",
        },
        {
          prompt: "The complete deduplication idiom for a `std::vector<int> v` is…",
          options: ["`std::unique(v.begin(), v.end());`", "`std::sort(v.begin(), v.end()); v.erase(std::unique(v.begin(), v.end()), v.end());`", "`std::sort(v.begin(), v.end()); std::unique(v.begin(), v.end());`", "`v.erase(std::unique(v.begin(), v.end()));`"],
          answer: 1,
          explanation: "`unique` removes only *adjacent* duplicates and only returns the new end; the sort brings equal values together and the erase shrinks the container.",
        },
        {
          prompt: "`std::lower_bound` versus `std::upper_bound` on a sorted range:",
          options: ["Same thing", "First element `≥ x` versus first element `> x`; their difference is the count of `x`", "Last element `≤ x` versus last element `< x`", "`lower_bound` works on unsorted ranges"],
          answer: 1,
          explanation: "Both are O(log n) on a random-access range and both return `end()` when nothing qualifies — check before dereferencing. On a `std::set` or `std::map` use the *member* `lower_bound`, which is O(log n); the free algorithm on a set walks its iterators linearly.",
        },
        {
          prompt: "`if (m[key] > 0)` on a `std::map<std::string, int> m`…",
          options: ["Only reads", "Inserts `key` with `0` when absent — use `find`, `count` or `contains` for a read that must not insert", "Throws when the key is absent", "Does not compile on a `const` map only"],
          answer: 1,
          explanation: "`operator[]` returns a reference to the mapped value, creating it if necessary; on a `const` map it does not exist at all, which is the compiler telling you the same thing.",
        },
        {
          prompt: "`-7 / 2` and `-7 % 3` are…",
          options: ["`-4` and `2`", "`-3` and `-1` — division truncates toward zero and the remainder takes the dividend's sign", "`-3` and `2`", "`-4` and `-1`"],
          answer: 1,
          explanation: "Fixed since C++11. Floor division needs `(a - ((a % b) + b) % b) / b` or `std::floor` on doubles; a non-negative remainder needs `((a % m) + m) % m`.",
        },
        {
          prompt: "`for (int i = 0; i < v.size() - 1; ++i)` on an empty vector…",
          options: ["Runs zero times", "Runs until it reads out of range: `v.size() - 1` is `size_t` and wraps to 2⁶⁴ − 1, and the signed `i` converts to unsigned for the comparison", "Is a compile error", "Runs once"],
          answer: 1,
          explanation: "`-Wall` warns about the signed/unsigned comparison, which is the hint. `i + 1 < v.size()` cannot wrap; so does guarding the empty case first.",
        },
        {
          prompt: "`std::endl` differs from `'\\n'` in that it…",
          options: ["Prints a platform-specific line ending", "Also flushes the stream — a system call per line, measured about a dozen times slower over 10⁶ lines", "Is faster", "Works only with `std::cout`"],
          answer: 1,
          explanation: "The line ending is the same character. Buffered output leaves once, when the program exits or the buffer fills; flush explicitly only for interactive protocols.",
        },
        {
          prompt: "A class with a raw owning pointer and only a hand-written destructor…",
          options: ["Is complete", "Double-deletes on copy: the implicit copy constructor copies the pointer; write the copy operations (or delete them) and the moves — the rule of five — or hold the resource in a `unique_ptr` (the rule of zero)", "Cannot be instantiated", "Is fine as long as it is never returned"],
          answer: 1,
          explanation: "Returning it, passing it by value or storing it in a `std::vector` copies it; two objects then own one buffer. The compiler generates the copy silently, which is why the rule exists.",
        },
        {
          prompt: "Doubling capacity on every reallocation gives `push_back`…",
          options: ["O(1) always", "Amortised O(1): total copies over `n` pushes stay below `2n`, although the push that triggers a reallocation is O(n)", "O(log n)", "O(n) always"],
          answer: 1,
          explanation: "Growth by a constant increment gives O(n²) total; geometric growth is what makes `std::vector` the default container. `reserve` when you know the final size removes even the amortised copies.",
        },
        {
          prompt: "An O(1) LRU cache is built from…",
          options: ["A `std::vector` scanned on every access", "A `std::list` in recency order plus an `unordered_map` from key to list iterator, with `splice` moving a node to the front without invalidating anything", "A `std::map` ordered by timestamp", "Two `std::stack`s"],
          answer: 1,
          explanation: "The map finds the node in O(1); the list moves and evicts in O(1); list iterators stay valid across `splice`, which a vector's would not. It is the standard \"which container and why\" question.",
        },
        {
          prompt: "In the shunting-yard method, on reading a binary operator you first…",
          options: ["Push it unconditionally", "Apply operators from the stack while the top is not `(` and has precedence at least as high as the new one (for left-associativity), then push", "Apply every operator on the stack", "Discard the value stack"],
          answer: 1,
          explanation: "The `≥` is what makes `7 - 2 - 1` evaluate left to right; `>` would make it right-associative. A `)` reduces down to its `(`, and the end of input reduces everything.",
        },
        {
          prompt: "A `std::vector<std::unique_ptr<Shape>>` requires `Shape` to have…",
          options: ["A default constructor", "A virtual destructor — `unique_ptr<Shape>` deletes through the base pointer, and without it destroying a `Circle` that way is undefined behaviour", "A copy constructor", "No pure virtual functions"],
          answer: 1,
          explanation: "`= default` is enough; it makes the delete dispatch to the most-derived destructor. The same rule applies to any polymorphic base, whether or not smart pointers are involved.",
        },
        {
          prompt: "Before saying \"done\" in a C++ interview you should…",
          options: ["Add more features", "Run the pitfalls pass — `int` products, unsigned `size()` arithmetic, `%` on negatives, `map[]`, invalidated iterators, `endl` — remove debug output, and state the complexity", "Replace every loop with an algorithm", "Switch to `#define int long long`"],
          answer: 1,
          explanation: "Thirty seconds that catches most \"correct but rejected\" submissions and shows visible carefulness. Doing it aloud — \"the sum is at most 10¹⁴, so `long long`\" — is what gets people hired.",
        },
      ],
    },
  ],
});
