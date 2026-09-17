import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "stl-algorithms",
  title: "Algorithms and lambdas",
  blurb: "The half-open range and predicate interface of <algorithm> and <numeric>, sorting with comparators and binary search, transform/accumulate/partition, lambdas as closure objects with std::function, and C++20 ranges with lazy views.",
  icon: "lambda",
  overview: `Module 3 catalogued the loops; this module retires most of them. \`<algorithm>\` and \`<numeric>\` hold over a hundred named functions — find, count, sort, transform, accumulate, partition — that take a half-open iterator range and, usually, a callable, and do what a hand loop would do with the edge cases already right and the library free to optimise. The lambda is the callable that made them usable: a function written where it is needed, carrying the values it needs. C++20 completes the picture with ranges, which take the container instead of two iterators, and views, which chain into lazy pipelines with no intermediate copies.

The five lessons move from interface to composition. The algorithm library fixes the conventions — \`[first, last)\`, predicates, iterators as results — through \`find\`, \`count\`, \`minmax_element\`, \`fill\` and \`iota\`. Sorting and searching covers comparators as strict weak orderings, tie-breaks, \`std::stable_sort\`, \`partial_sort\`, \`nth_element\` and \`lower_bound\`/\`upper_bound\` on sorted ranges. Transforming and reducing covers \`transform\`, \`accumulate\` and the \`0LL\` rule, \`reduce\`, the yes/no reductions, \`copy_if\`, the erase–remove idiom, \`partition\` and prefix sums. Lambdas in depth opens the closure object: capture defaults, init-captures, \`mutable\`, \`this\`, generic and immediately invoked lambdas, \`std::function\` and its cost, recursion, and comparators stored in containers. Ranges and views closes with projections, \`filter\`/\`transform\`/\`take\`/\`drop\`/\`iota\`/\`reverse\`, laziness, and how a pipeline is materialised on a C++20 runtime.

The exercises are whole programs, each built on its lesson's algorithm: \`find_if\` and \`count_if\` over invoice records, \`minmax_element\` with positions, a leaderboard sorted by score with a name tie-break, range counting with \`lower_bound\`/\`upper_bound\`, line totals through \`transform\` and \`accumulate\` with \`0LL\`, a ticket queue cleaned with \`remove_if\` and split with \`partition\`, a sequence counter that owns its state through an init-capture, a stack machine driven by a \`std::function\` dispatch table, a \`filter | transform | take\` pipeline copied into a vector, and a \`std::ranges::sort\` with a tuple projection. The checkpoint adds a \`stable_sort\` task list, a median by \`nth_element\`, and a nested-list walker written as a recursive lambda.`,
  lessons: [
    {
      slug: "the-algorithm-library",
      file: "01-the-algorithm-library.md",
      exercises: [
        {
          title: "First overdue invoice",
          prompt: `Read an integer \`n\`, then \`n\` lines each holding an invoice: an id (one word), an amount and the number of days it has been open (both integers). Then read a threshold \`t\`. An invoice is **overdue** when its days are strictly greater than \`t\`.

Store the invoices in a \`std::vector\` of a struct and answer with one predicate lambda and two algorithms: \`std::count_if\` for how many are overdue and \`std::find_if\` for the first overdue invoice in input order. No hand-written loop over the vector.

**Input:** \`n\`, then \`n\` lines of \`id amount days\`, then \`t\`.
**Output:** \`overdue: <count>\`, then \`first: <id> <amount>\` for the first overdue invoice or \`first: none\` when there is none.

\`\`\`text
4
A1 120 45
B2 80 10
C3 200 31
D4 50 90
30
\`\`\`
prints
\`\`\`text
overdue: 3
first: A1 120
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

struct Invoice {
    std::string id;
    int amount;
    int days;
};

int main() {
    int n;
    std::cin >> n;
    std::vector<Invoice> invoices(n);
    for (auto& inv : invoices) std::cin >> inv.id >> inv.amount >> inv.days;
    int threshold;
    std::cin >> threshold;
    // TODO: one predicate lambda; std::count_if for the count, std::find_if for the first
    std::cout << "overdue: " << 0 << '\n';
    std::cout << "first: none\n";
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

struct Invoice {
    std::string id;
    int amount;
    int days;
};

int main() {
    int n;
    std::cin >> n;
    std::vector<Invoice> invoices(n);
    for (auto& inv : invoices) std::cin >> inv.id >> inv.amount >> inv.days;
    int threshold;
    std::cin >> threshold;

    const auto overdue = [threshold](const Invoice& inv) { return inv.days > threshold; };
    const auto count = std::count_if(invoices.begin(), invoices.end(), overdue);
    std::cout << "overdue: " << count << '\n';

    const auto first = std::find_if(invoices.begin(), invoices.end(), overdue);
    if (first == invoices.end()) {
        std::cout << "first: none\n";
    } else {
        std::cout << "first: " << first->id << ' ' << first->amount << '\n';
    }
    return 0;
}
`,
          hints: [
            "Capture the threshold by value in one lambda and pass the same lambda to both algorithms.",
            "std::count_if returns a signed count; hold it in auto.",
            "std::find_if returns invoices.end() when nothing matches — test that before using -> on the iterator.",
          ],
          cases: [
            { stdin: "4\nA1 120 45\nB2 80 10\nC3 200 31\nD4 50 90\n30\n", expected: "overdue: 3\nfirst: A1 120\n" },
            { stdin: "3\nX 10 5\nY 20 7\nZ 30 9\n30\n", expected: "overdue: 0\nfirst: none\n" },
            { stdin: "0\n30\n", expected: "overdue: 0\nfirst: none\n", hidden: true },
            { stdin: "3\nP 5 30\nQ 6 31\nR 7 30\n30\n", expected: "overdue: 1\nfirst: Q 6\n", hidden: true },
            { stdin: "2\nM 1 100\nN 2 200\n0\n", expected: "overdue: 2\nfirst: M 1\n", hidden: true },
          ],
        },
        {
          title: "Readings at the extremes",
          prompt: `Read an integer \`n\` (at least 1), then \`n\` integer readings. With **one** call to \`std::minmax_element\` find the smallest and the largest reading and print their values and 0-based positions, computed as the distance of each iterator from \`begin()\`. \`std::minmax_element\` returns the **first** occurrence of the minimum and the **last** occurrence of the maximum — print exactly those positions. Then print the spread, the maximum minus the minimum, computed in \`long long\`.

**Input:** \`n\`, then \`n\` integers.
**Output:** three lines: \`min <value> at <index>\`, \`max <value> at <index>\`, \`spread <value>\`.

Example: \`5\` then \`3 9 1 9 4\` →
\`\`\`text
min 1 at 2
max 9 at 3
spread 8
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    int n;
    std::cin >> n;
    std::vector<int> readings(n);
    for (int& r : readings) std::cin >> r;
    // TODO: std::minmax_element once; a structured binding names the two iterators
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    int n;
    std::cin >> n;
    std::vector<int> readings(n);
    for (int& r : readings) std::cin >> r;

    const auto [lo, hi] = std::minmax_element(readings.begin(), readings.end());
    std::cout << "min " << *lo << " at " << (lo - readings.begin()) << '\n';
    std::cout << "max " << *hi << " at " << (hi - readings.begin()) << '\n';
    std::cout << "spread " << (static_cast<long long>(*hi) - *lo) << '\n';
    return 0;
}
`,
          hints: [
            "auto [lo, hi] = std::minmax_element(begin, end); gives two iterators.",
            "An iterator minus begin() is the index for a std::vector.",
            "Cast one operand to long long before subtracting so 2000000000 - (-2000000000) cannot overflow int.",
          ],
          cases: [
            { stdin: "5\n3 9 1 9 4\n", expected: "min 1 at 2\nmax 9 at 3\nspread 8\n" },
            { stdin: "4\n-5 -2 -9 -2\n", expected: "min -9 at 2\nmax -2 at 3\nspread 7\n" },
            { stdin: "1\n42\n", expected: "min 42 at 0\nmax 42 at 0\nspread 0\n", hidden: true },
            { stdin: "3\n7 7 7\n", expected: "min 7 at 0\nmax 7 at 2\nspread 0\n", hidden: true },
            { stdin: "6\n2000000000 -2000000000 5 5 -2000000000 2000000000\n", expected: "min -2000000000 at 1\nmax 2000000000 at 5\nspread 4000000000\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `std::find(v.begin(), v.end(), 7)` return when no element equals 7?",
          options: ["`-1`", "`v.end()`", "`nullptr`", "It throws `std::out_of_range`"],
          answer: 1,
          explanation: "Algorithms report \"not found\" as the `last` iterator of the range they were given — never a sentinel integer or an exception. That is why the result must be compared with `end()` before it is dereferenced.",
        },
        {
          prompt: `What does this print?

\`\`\`cpp
std::vector<int> v{4, 9, 2, 9, 1};
auto [lo, hi] = std::minmax_element(v.begin(), v.end());
std::cout << (lo - v.begin()) << ' ' << (hi - v.begin()) << '\n';
\`\`\``,
          options: ["`4 1`", "`4 3`", "`2 1`", "`2 3`"],
          answer: 1,
          explanation: "`minmax_element` returns the first minimum (1, at index 4) and the **last** maximum (the second 9, at index 3). `max_element` on its own would have returned index 1 — the two functions settle ties differently.",
        },
        {
          prompt: "What happens with `std::max(3, 4.5)`?",
          options: ["It returns `4.5`", "It returns `4`", "Compile error: `T` is deduced as both `int` and `double`", "Undefined behaviour"],
          answer: 2,
          explanation: "`std::max` is `template <class T> const T& max(const T&, const T&)`; deduction from `3` gives `int` and from `4.5` gives `double`, and the conflict is an error. `std::max<double>(3, 4.5)` or `std::max(3.0, 4.5)` fixes it.",
        },
        {
          prompt: "Which header declares `std::iota` and `std::accumulate`?",
          options: ["`<algorithm>`", "`<numeric>`", "`<iterator>`", "`<functional>`"],
          answer: 1,
          explanation: "The arithmetic algorithms — `iota`, `accumulate`, `reduce`, `partial_sum`, `inner_product`, `gcd` — live in `<numeric>`. `<algorithm>` has the searching, counting and rearranging ones; forgetting `<numeric>` gives \"`iota` is not a member of `std`\".",
        },
        {
          prompt: "What is the return type of `std::count_if` over a `std::vector<int>`?",
          options: ["`int`", "`std::size_t`", "The iterator's `difference_type` — a signed integer, `std::ptrdiff_t` here", "`bool`"],
          answer: 2,
          explanation: "Counts are returned as the iterator's `difference_type`, which is signed. Holding it in `auto` or `long long` is right; `int` narrows on a huge range and `std::size_t` invites the signed/unsigned comparison warning.",
        },
        {
          prompt: `What does this print?

\`\`\`cpp
std::vector<int> v(5);
std::iota(v.begin(), v.end(), 3);
std::reverse(v.begin(), v.end());
std::cout << v.front() << ' ' << v.back() << '\n';
\`\`\``,
          options: ["`3 7`", "`7 3`", "`0 4`", "`4 0`"],
          answer: 1,
          explanation: "`iota` writes 3 4 5 6 7 into the five slots; `reverse` turns that into 7 6 5 4 3, so the front is 7 and the back is 3.",
        },
        {
          prompt: "Which statement about algorithms versus hand-written loops is correct?",
          options: [
            "Algorithms only work on sorted data",
            "An algorithm call names the loop's intent, has the edge cases already right, and lets the library specialise — `std::copy` of trivially copyable elements becomes `memmove`",
            "Hand loops are always faster because they avoid a function call",
            "`std::find` on a `std::map` runs in O(log n)",
          ],
          answer: 1,
          explanation: "Intent, correctness and optimisation are the three reasons. The lambda is inlined, so there is no call overhead to avoid; only the binary-search family needs sorted data; and `std::find` on a map is a linear walk — the member `find` is the O(log n) one.",
        },
      ],
    },
    {
      slug: "sorting-and-searching",
      file: "02-sorting-and-searching.md",
      exercises: [
        {
          title: "Leaderboard",
          prompt: `Read an integer \`n\`, then \`n\` lines of \`name score\` (names are distinct single words, scores are integers). Sort the players with \`std::sort\` and a comparator lambda that orders by score **descending** and breaks ties by name **ascending**, so that the order is total and the output unique. Print the ranking as \`<rank>. <name> <score>\`, ranks starting at 1.

Take the elements by \`const&\` in the comparator, and write the tie-break so the comparator stays a strict weak ordering (never \`<=\`).

**Input:** \`n\`, then \`n\` lines.
**Output:** \`n\` lines.

\`\`\`text
4
ada 90
bob 75
cy 90
dee 60
\`\`\`
prints
\`\`\`text
1. ada 90
2. cy 90
3. bob 75
4. dee 60
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

struct Player {
    std::string name;
    int score;
};

int main() {
    int n;
    std::cin >> n;
    std::vector<Player> players(n);
    for (auto& p : players) std::cin >> p.name >> p.score;
    // TODO: std::sort with a comparator: score descending, then name ascending
    for (std::size_t i = 0; i < players.size(); ++i) {
        std::cout << (i + 1) << ". " << players[i].name << ' ' << players[i].score << '\n';
    }
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

struct Player {
    std::string name;
    int score;
};

int main() {
    int n;
    std::cin >> n;
    std::vector<Player> players(n);
    for (auto& p : players) std::cin >> p.name >> p.score;

    std::sort(players.begin(), players.end(), [](const Player& a, const Player& b) {
        if (a.score != b.score) return a.score > b.score;
        return a.name < b.name;
    });

    for (std::size_t i = 0; i < players.size(); ++i) {
        std::cout << (i + 1) << ". " << players[i].name << ' ' << players[i].score << '\n';
    }
    return 0;
}
`,
          hints: [
            "The comparator answers \"must a come before b?\": a higher score comes first.",
            "When the scores are equal, fall through to comparing the names with <.",
            "std::tie(b.score, a.name) < std::tie(a.score, b.name) is the same comparator in one line.",
          ],
          cases: [
            { stdin: "4\nada 90\nbob 75\ncy 90\ndee 60\n", expected: "1. ada 90\n2. cy 90\n3. bob 75\n4. dee 60\n" },
            { stdin: "3\nzed 10\namy 10\nmax 10\n", expected: "1. amy 10\n2. max 10\n3. zed 10\n" },
            { stdin: "1\nsolo 5\n", expected: "1. solo 5\n", hidden: true },
            { stdin: "3\na -1\nb -5\nc 0\n", expected: "1. c 0\n2. a -1\n3. b -5\n", hidden: true },
            { stdin: "5\ne 3\nd 3\nc 3\nb 4\na 4\n", expected: "1. a 4\n2. b 4\n3. c 3\n4. d 3\n5. e 3\n", hidden: true },
          ],
        },
        {
          title: "How many in range",
          prompt: `Read an integer \`n\`, then \`n\` integers in no particular order, then an integer \`q\`, then \`q\` queries \`lo hi\` (with \`lo <= hi\`). Sort the values **once**; then answer each query with two binary searches — \`std::lower_bound\` for \`lo\` and \`std::upper_bound\` for \`hi\` — and print the number of values in the closed interval \`[lo, hi]\` as the distance between the two iterators. No loop over the data per query.

**Input:** \`n\`, the values, \`q\`, then \`q\` lines of \`lo hi\`.
**Output:** \`q\` lines, one count each.

\`\`\`text
6
5 1 9 3 5 7
3
3 7
5 5
10 20
\`\`\`
prints
\`\`\`text
4
2
0
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    int n;
    std::cin >> n;
    std::vector<int> values(n);
    for (int& v : values) std::cin >> v;
    // TODO: sort once
    int q;
    std::cin >> q;
    for (int i = 0; i < q; ++i) {
        int lo, hi;
        std::cin >> lo >> hi;
        // TODO: lower_bound(lo), upper_bound(hi), print the distance
        std::cout << 0 << '\n';
    }
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    int n;
    std::cin >> n;
    std::vector<int> values(n);
    for (int& v : values) std::cin >> v;
    std::sort(values.begin(), values.end());

    int q;
    std::cin >> q;
    for (int i = 0; i < q; ++i) {
        int lo, hi;
        std::cin >> lo >> hi;
        const auto first = std::lower_bound(values.begin(), values.end(), lo);
        const auto last = std::upper_bound(values.begin(), values.end(), hi);
        std::cout << (last - first) << '\n';
    }
    return 0;
}
`,
          hints: [
            "lower_bound(lo) is the first element that is not less than lo; upper_bound(hi) is the first element greater than hi.",
            "Everything between those two iterators is inside [lo, hi]; subtract them for the count.",
            "Both searches need the vector sorted ascending with the default < — sort before the query loop, not inside it.",
          ],
          cases: [
            { stdin: "6\n5 1 9 3 5 7\n3\n3 7\n5 5\n10 20\n", expected: "4\n2\n0\n" },
            { stdin: "4\n-3 0 2 8\n2\n-10 -1\n0 8\n", expected: "1\n3\n" },
            { stdin: "1\n4\n2\n4 4\n5 9\n", expected: "1\n0\n", hidden: true },
            { stdin: "0\n1\n1 10\n", expected: "0\n", hidden: true },
            { stdin: "5\n2 2 2 2 2\n2\n2 2\n1 3\n", expected: "5\n5\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`std::list<int> lst{3, 1, 2}; std::sort(lst.begin(), lst.end());` — what happens?",
          options: ["The list is sorted", "Compile error: `std::sort` needs random-access iterators; use `lst.sort()`", "It compiles but the order is unspecified", "It sorts in O(n²)"],
          answer: 1,
          explanation: "Introsort indexes into the range, so it requires random access; a list's bidirectional iterators do not satisfy the algorithm and the call fails to compile. `std::list` provides its own `sort()` member that relinks nodes.",
        },
        {
          prompt: "A comparator passed to `std::sort` is written `[](int a, int b) { return a <= b; }`. What does the standard say?",
          options: ["It sorts ascending, like `<`", "It sorts descending", "Undefined behaviour: `<=` is not a strict weak ordering, and the sort may read past the end or never finish", "Compile error"],
          answer: 2,
          explanation: "A comparator must be irreflexive — `comp(a, a)` false — and `<=` says an element comes before itself. Introsort relies on that guarantee to stop its scans, so the result is undefined behaviour, which in practice means crashes on inputs with equal elements.",
        },
        {
          prompt: "What does `std::lower_bound(v.begin(), v.end(), x)` return on a sorted vector?",
          options: ["An iterator to the last element less than `x`", "An iterator to the first element that is **not less than** `x`, or `end()`", "An iterator to the first element greater than `x`", "`true` or `false`"],
          answer: 1,
          explanation: "`lower_bound` is the first position where `x` could be inserted without breaking the order — the first element ≥ `x`. `upper_bound` is the first element > `x`; `binary_search` is the one that returns a `bool`.",
        },
        {
          prompt: `\`v\` is sorted. Which expression is the number of elements equal to \`x\`?`,
          options: [
            "`std::upper_bound(v.begin(), v.end(), x) - std::lower_bound(v.begin(), v.end(), x)`",
            "`std::lower_bound(v.begin(), v.end(), x) - std::upper_bound(v.begin(), v.end(), x)`",
            "`std::binary_search(v.begin(), v.end(), x)`",
            "`std::find(v.begin(), v.end(), x) - v.begin()`",
          ],
          answer: 0,
          explanation: "The elements equal to `x` occupy `[lower_bound, upper_bound)`, so the difference is their count — two O(log n) searches. `binary_search` returns only a `bool`, and `find` gives the index of the first match after a linear scan.",
        },
        {
          prompt: `After this code, what is \`v[2]\`?

\`\`\`cpp
std::vector<int> v{9, 1, 8, 3, 7};
std::nth_element(v.begin(), v.begin() + 2, v.end());
\`\`\``,
          options: ["`8`", "`7`", "`3`", "Unspecified"],
          answer: 1,
          explanation: "`nth_element` puts at position 2 the element a full sort would put there: sorted, the vector is 1 3 7 8 9, so `v[2]` is 7. Only the other positions are unspecified — they are partitioned around 7 but not sorted.",
        },
        {
          prompt: "You sort support tickets by priority and must keep tickets of equal priority in the order they arrived. Which is correct?",
          options: [
            "`std::sort` — it never reorders equal elements",
            "`std::stable_sort`, or `std::sort` with a tie-break on the arrival index",
            "`std::partial_sort` with the full range",
            "`std::nth_element` at every position",
          ],
          answer: 1,
          explanation: "`std::sort` makes no promise about equal elements, and the order may differ between library versions. `std::stable_sort` preserves input order among equals; adding the arrival index as a second key makes the order total, which also works.",
        },
        {
          prompt: `What is \`v.size()\` after this?

\`\`\`cpp
std::vector<int> v{1, 1, 2, 1};
v.erase(std::unique(v.begin(), v.end()), v.end());
\`\`\``,
          options: ["`2`", "`3`", "`4`", "`1`"],
          answer: 1,
          explanation: "`unique` removes only **consecutive** duplicates: 1 1 2 1 becomes 1 2 1, three elements. Sorting first would have made every duplicate adjacent and left two.",
        },
      ],
    },
    {
      slug: "transforming-and-reducing",
      file: "03-transforming-and-reducing.md",
      exercises: [
        {
          title: "Order total",
          prompt: `Read an integer \`n\` (at least 1), then \`n\` lines of \`qty price\` — two integers; a negative quantity is a refund line. Build a \`std::vector<long long>\` of line totals (\`qty * price\`, multiplied in \`long long\` — cast one operand before multiplying) with \`std::transform\` writing through \`std::back_inserter\`. Then reduce: \`std::accumulate\` with the initial value \`0LL\` for the grand total, and \`std::max_element\` for the largest line total.

**Input:** \`n\`, then \`n\` lines.
**Output:** \`total <sum>\` and \`largest <max line total>\`.

Example: \`3\` then \`2 250\`, \`1 999\`, \`4 10\` →
\`\`\`text
total 1539
largest 999
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <iostream>
#include <iterator>
#include <numeric>
#include <utility>
#include <vector>

int main() {
    int n;
    std::cin >> n;
    std::vector<std::pair<int, int>> lines(n);
    for (auto& [qty, price] : lines) std::cin >> qty >> price;
    std::vector<long long> totals;
    // TODO: std::transform into std::back_inserter(totals), multiplying in long long
    // TODO: std::accumulate with 0LL and std::max_element
    std::cout << "total " << 0 << '\n';
    std::cout << "largest " << 0 << '\n';
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <iostream>
#include <iterator>
#include <numeric>
#include <utility>
#include <vector>

int main() {
    int n;
    std::cin >> n;
    std::vector<std::pair<int, int>> lines(n);
    for (auto& [qty, price] : lines) std::cin >> qty >> price;

    std::vector<long long> totals;
    totals.reserve(lines.size());
    std::transform(lines.begin(), lines.end(), std::back_inserter(totals),
                   [](const std::pair<int, int>& line) {
                       return static_cast<long long>(line.first) * line.second;
                   });

    const long long total = std::accumulate(totals.begin(), totals.end(), 0LL);
    const auto largest = std::max_element(totals.begin(), totals.end());
    std::cout << "total " << total << '\n';
    std::cout << "largest " << *largest << '\n';
    return 0;
}
`,
          hints: [
            "std::back_inserter(totals) grows the vector as transform writes; the lambda returns one long long per line.",
            "static_cast<long long>(qty) * price multiplies in 64 bits; qty * price would overflow int first.",
            "The initial value's type is the accumulator's type: 0LL, not 0 — three lines of 1000000000 overflow an int sum.",
          ],
          cases: [
            { stdin: "3\n2 250\n1 999\n4 10\n", expected: "total 1539\nlargest 999\n" },
            { stdin: "2\n100000 100000\n1 1\n", expected: "total 10000000001\nlargest 10000000000\n" },
            { stdin: "3\n1 1000000000\n1 1000000000\n1 1000000000\n", expected: "total 3000000000\nlargest 1000000000\n", hidden: true },
            { stdin: "1\n0 5\n", expected: "total 0\nlargest 0\n", hidden: true },
            { stdin: "2\n-3 4\n2 5\n", expected: "total -2\nlargest 10\n", hidden: true },
          ],
        },
        {
          title: "Triage the ticket queue",
          prompt: `Read an integer \`n\`, then \`n\` lines of \`name priority\` (distinct single-word names; priority is an integer, 0 or more). Process the queue with three algorithms:

1. Drop every **closed** ticket (priority \`0\`) with \`std::remove_if\` followed by \`erase\` (or \`std::erase_if\`), and print \`removed <k>\`.
2. \`std::partition\` the rest so that **urgent** tickets (priority 5 or more) come first. The iterator it returns is the end of the urgent group.
3. \`std::sort\` each group by name — \`partition\` scrambles the order inside a group, and sorting both halves makes the output unique.

**Input:** \`n\`, then \`n\` lines.
**Output:** \`removed <k>\`, then \`urgent <count>\` followed by one \`name priority\` line per urgent ticket in name order, then \`normal <count>\` followed by the rest likewise.

\`\`\`text
6
ann 7
bob 3
cy 0
dan 9
eve 4
fay 0
\`\`\`
prints
\`\`\`text
removed 2
urgent 2
ann 7
dan 9
normal 2
bob 3
eve 4
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

struct Ticket {
    std::string name;
    int priority;
};

int main() {
    int n;
    std::cin >> n;
    std::vector<Ticket> tickets(n);
    for (auto& t : tickets) std::cin >> t.name >> t.priority;
    // TODO: remove_if + erase the priority-0 tickets; print "removed <k>"
    // TODO: partition (priority >= 5 first); sort each side by name
    // TODO: print "urgent <count>", the urgent lines, "normal <count>", the rest
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

struct Ticket {
    std::string name;
    int priority;
};

int main() {
    int n;
    std::cin >> n;
    std::vector<Ticket> tickets(n);
    for (auto& t : tickets) std::cin >> t.name >> t.priority;

    const auto closed = std::remove_if(tickets.begin(), tickets.end(),
                                       [](const Ticket& t) { return t.priority == 0; });
    const auto removed = tickets.end() - closed;
    tickets.erase(closed, tickets.end());
    std::cout << "removed " << removed << '\n';

    const auto boundary = std::partition(tickets.begin(), tickets.end(),
                                         [](const Ticket& t) { return t.priority >= 5; });
    const auto byName = [](const Ticket& a, const Ticket& b) { return a.name < b.name; };
    std::sort(tickets.begin(), boundary, byName);
    std::sort(boundary, tickets.end(), byName);

    std::cout << "urgent " << (boundary - tickets.begin()) << '\n';
    for (auto it = tickets.begin(); it != boundary; ++it) {
        std::cout << it->name << ' ' << it->priority << '\n';
    }
    std::cout << "normal " << (tickets.end() - boundary) << '\n';
    for (auto it = boundary; it != tickets.end(); ++it) {
        std::cout << it->name << ' ' << it->priority << '\n';
    }
    return 0;
}
`,
          hints: [
            "remove_if returns the new logical end; the removed count is end() minus that iterator, measured before erase.",
            "partition returns the first element of the second group — use it as the end of one sort and the start of the other.",
            "Iterate [begin, boundary) for the urgent group and [boundary, end) for the rest.",
          ],
          cases: [
            { stdin: "6\nann 7\nbob 3\ncy 0\ndan 9\neve 4\nfay 0\n", expected: "removed 2\nurgent 2\nann 7\ndan 9\nnormal 2\nbob 3\neve 4\n" },
            { stdin: "3\nx 5\ny 5\nz 5\n", expected: "removed 0\nurgent 3\nx 5\ny 5\nz 5\nnormal 0\n" },
            { stdin: "2\na 0\nb 0\n", expected: "removed 2\nurgent 0\nnormal 0\n", hidden: true },
            { stdin: "0\n", expected: "removed 0\nurgent 0\nnormal 0\n", hidden: true },
            { stdin: "4\nq 1\np 2\no 0\nn 5\n", expected: "removed 1\nurgent 1\nn 5\nnormal 2\np 2\nq 1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: `What does this print?

\`\`\`cpp
std::vector<long long> v{2000000000, 2000000000};
std::cout << std::accumulate(v.begin(), v.end(), 0) << '\n';
\`\`\``,
          options: ["`4000000000`", "`-294967296`", "Undefined behaviour: the sum is computed in `int` because the initial value is an `int`", "Compile error: `0` is not a `long long`"],
          answer: 2,
          explanation: "The accumulator has the type of the third argument, and `0` is an `int`, so the two `long long` elements are added into an `int` and overflow — undefined behaviour, whatever number happens to appear. `0LL` makes the accumulator `long long`.",
        },
        {
          prompt: `What does this print?

\`\`\`cpp
std::vector<int> v{1, 2, 3, 4};
std::remove_if(v.begin(), v.end(), [](int x) { return x % 2 == 0; });
std::cout << v.size() << '\n';
\`\`\``,
          options: ["`2`", "`4`", "`0`", "Compile error"],
          answer: 1,
          explanation: "An algorithm cannot change a container's size — it only moves elements. `remove_if` shifts 1 and 3 to the front and returns the new logical end; without `v.erase(newEnd, v.end())` the size stays 4 and the tail holds unspecified values.",
        },
        {
          prompt: "What does `std::all_of(v.begin(), v.end(), pred)` return when `v` is empty?",
          options: ["`false`", "`true`", "Undefined behaviour", "It throws"],
          answer: 1,
          explanation: "On an empty range `all_of` and `none_of` are vacuously `true` and `any_of` is `false` — the same answers a `for` loop with a flag would give, because no element ever fails the test.",
        },
        {
          prompt: "`std::vector<int> out; std::transform(v.begin(), v.end(), out.begin(), f);` — what is wrong?",
          options: ["Nothing: `transform` grows `out`", "It writes through `out.begin()` into space that does not exist — undefined behaviour; size `out` first or use `std::back_inserter(out)`", "Compile error: `out` must be `const`", "`f` is called twice per element"],
          answer: 1,
          explanation: "`transform` assigns through whatever output iterator it is given, and an empty vector's `begin()` points at nothing. Either `out.resize(v.size())` first or pass `std::back_inserter(out)`, which turns each write into `push_back`.",
        },
        {
          prompt: "Which reduction is **unsafe** with `std::reduce`?",
          options: ["Summing a `std::vector<long long>` with `0LL`", "Joining a `std::vector<std::string>` into one string with `+`", "Multiplying a `std::vector<int>` with `1LL` and `std::multiplies<>{}`", "Finding a maximum with a lambda that returns the larger of two values"],
          answer: 1,
          explanation: "`std::reduce` may combine the elements in any order and grouping, so the operation must be associative and commutative. String concatenation is not commutative — `\"a\" + \"b\"` differs from `\"b\" + \"a\"` — so use `std::accumulate`, which folds left to right.",
        },
        {
          prompt: "What does `std::partition(first, last, pred)` return, and what is the order inside each group?",
          options: [
            "The number of elements satisfying `pred`; both groups keep input order",
            "An iterator to the first element of the group that fails `pred`; the order inside each group is unspecified",
            "`true` if any element satisfies `pred`",
            "An iterator to the last element satisfying `pred`; both groups are sorted",
          ],
          answer: 1,
          explanation: "`partition` returns the boundary between the two groups — an iterator usable as the end of the first and the start of the second. It makes no promise about order within a group; `std::stable_partition` does, at the cost of a buffer.",
        },
        {
          prompt: "`std::vector<int> big` holds values near two billion. `std::partial_sum(big.begin(), big.end(), out.begin())` writes into a `std::vector<long long> out`. What happens?",
          options: [
            "The running sum is computed in `long long` because `out` is `long long`",
            "The running sum is computed in `int` — `partial_sum`'s accumulator has the input's value type — so it overflows",
            "Compile error: the value types differ",
            "The output is truncated to `int`",
          ],
          answer: 1,
          explanation: "Unlike `accumulate`, `partial_sum` takes no initial value: its accumulator is the input iterator's `value_type`, here `int`. Convert the input to `long long` first, or use `std::inclusive_scan` with an explicit `0LL` init.",
        },
      ],
    },
    {
      slug: "lambdas-in-depth",
      file: "04-lambdas-in-depth.md",
      exercises: [
        {
          title: "A sequence counter",
          prompt: `Write \`makeCounter(int start, int step)\`, a function that returns a lambda. The lambda must own its state through an **init-capture** — \`[value = start, step]\` — be \`mutable\`, and on each call return the current value and then advance it by \`step\`. No variable outside the lambda may hold the count.

Read \`start step\` from the first line, then lines of text until the input ends (ignore empty lines). Print each line prefixed with the counter's next value in square brackets, then a final line \`next=<value>\` — one more call to the same counter object.

**Input:** \`start step\`, then zero or more lines.
**Output:** one line per input line, then \`next=<value>\`.

\`\`\`text
100 5
boot
load config
ready
\`\`\`
prints
\`\`\`text
[100] boot
[105] load config
[110] ready
next=115
\`\`\``,
          starter: String.raw`#include <iostream>
#include <string>

auto makeCounter(int start, int step) {
    // TODO: return a mutable lambda with an init-capture that owns the running value
    return [start, step]() { return start + step; };
}

int main() {
    int start, step;
    std::cin >> start >> step;
    std::cin.ignore();
    auto next = makeCounter(start, step);
    std::string line;
    while (std::getline(std::cin, line)) {
        if (line.empty()) continue;
        // TODO: print "[<next()>] <line>"
    }
    std::cout << "next=" << next() << '\n';
    return 0;
}
`,
          solution: String.raw`#include <iostream>
#include <string>

auto makeCounter(int start, int step) {
    return [value = start, step]() mutable {
        const int current = value;
        value += step;
        return current;
    };
}

int main() {
    int start, step;
    std::cin >> start >> step;
    std::cin.ignore();
    auto next = makeCounter(start, step);
    std::string line;
    while (std::getline(std::cin, line)) {
        if (line.empty()) continue;
        std::cout << '[' << next() << "] " << line << '\n';
    }
    std::cout << "next=" << next() << '\n';
    return 0;
}
`,
          hints: [
            "[value = start, step]() mutable { ... } — value is a member of the closure, initialised once when makeCounter runs.",
            "Save the current value, add step to the member, return the saved copy.",
            "Without mutable the body cannot assign to value: operator() is const by default.",
          ],
          cases: [
            { stdin: "100 5\nboot\nload config\nready\n", expected: "[100] boot\n[105] load config\n[110] ready\nnext=115\n" },
            { stdin: "1 1\nonly\n", expected: "[1] only\nnext=2\n" },
            { stdin: "0 10\n", expected: "next=0\n", hidden: true },
            { stdin: "-4 2\na\nb\nc\nd\n", expected: "[-4] a\n[-2] b\n[0] c\n[2] d\nnext=4\n", hidden: true },
            { stdin: "7 -3\nx\ny\n", expected: "[7] x\n[4] y\nnext=1\n", hidden: true },
          ],
        },
        {
          title: "A stack machine with a command table",
          prompt: `Build a tiny stack machine whose commands live in a \`std::map<std::string, std::function<void()>>\`. The handlers are lambdas that capture the stack (a \`std::vector<long long>\`) by reference; the \`push\` handler reads its own integer argument from \`std::cin\`. Read words with \`std::cin >>\` until the input ends and look each one up in the table:

- \`push <x>\` — push the integer \`x\`
- \`pop\` — discard the top
- \`add\` / \`mul\` — pop two values and push their sum / product
- \`neg\` — negate the top
- \`print\` — print the top on its own line

A command that needs more values than the stack holds prints \`error: stack underflow\` and leaves the stack unchanged. A word that is not in the table prints \`unknown: <word>\` (such words carry no argument).

**Input:** commands until end of input.
**Output:** whatever \`print\` and the errors produce.

\`\`\`text
push 3
push 4
add
print
push 5
mul
print
\`\`\`
prints
\`\`\`text
7
35
\`\`\``,
          starter: String.raw`#include <functional>
#include <iostream>
#include <map>
#include <string>
#include <vector>

int main() {
    std::vector<long long> stack;
    std::map<std::string, std::function<void()>> commands;
    // TODO: one handler per command, capturing stack by reference
    // commands["push"] = [&stack]() { long long x; std::cin >> x; stack.push_back(x); };

    std::string word;
    while (std::cin >> word) {
        const auto it = commands.find(word);
        if (it == commands.end()) {
            std::cout << "unknown: " << word << '\n';
        } else {
            it->second();
        }
    }
    return 0;
}
`,
          solution: String.raw`#include <functional>
#include <iostream>
#include <map>
#include <string>
#include <vector>

int main() {
    std::vector<long long> stack;
    const auto need = [&stack](std::size_t count) {
        if (stack.size() >= count) return true;
        std::cout << "error: stack underflow\n";
        return false;
    };
    const auto pop = [&stack]() {
        const long long top = stack.back();
        stack.pop_back();
        return top;
    };

    std::map<std::string, std::function<void()>> commands;
    commands["push"] = [&stack]() {
        long long x;
        std::cin >> x;
        stack.push_back(x);
    };
    commands["pop"] = [&]() {
        if (need(1)) pop();
    };
    commands["add"] = [&]() {
        if (need(2)) {
            const long long b = pop();
            const long long a = pop();
            stack.push_back(a + b);
        }
    };
    commands["mul"] = [&]() {
        if (need(2)) {
            const long long b = pop();
            const long long a = pop();
            stack.push_back(a * b);
        }
    };
    commands["neg"] = [&]() {
        if (need(1)) stack.back() = -stack.back();
    };
    commands["print"] = [&]() {
        if (need(1)) std::cout << stack.back() << '\n';
    };

    std::string word;
    while (std::cin >> word) {
        const auto it = commands.find(word);
        if (it == commands.end()) {
            std::cout << "unknown: " << word << '\n';
        } else {
            it->second();
        }
    }
    return 0;
}
`,
          hints: [
            "Every handler has the same signature, void(), so they all fit one std::function type and one map.",
            "A helper lambda need(k) that prints the error and returns false when the stack is short keeps every handler to two lines.",
            "Capture by reference is safe here: the stack and the helpers outlive every call, because main owns them.",
          ],
          cases: [
            { stdin: "push 3\npush 4\nadd\nprint\npush 5\nmul\nprint\n", expected: "7\n35\n" },
            { stdin: "print\npop\nfoo\npush 2\nneg\nprint\n", expected: "error: stack underflow\nerror: stack underflow\nunknown: foo\n-2\n" },
            { stdin: "push 1000000000\npush 1000000000\nmul\nprint\n", expected: "1000000000000000000\n", hidden: true },
            { stdin: "push 1\nadd\nprint\n", expected: "error: stack underflow\n1\n", hidden: true },
            { stdin: "push -5\nneg\nneg\nprint\npop\nprint\n", expected: "-5\nerror: stack underflow\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: `What does this print?

\`\`\`cpp
int x = 1;
auto f = [x]() mutable { return ++x; };
f();
f();
std::cout << x << f() << '\n';
\`\`\``,
          options: ["`13`", "`33`", "`14`", "Compile error"],
          answer: 2,
          explanation: "The closure holds its own copy of `x`, which `mutable` lets it change: the two calls take the copy to 2 and 3, and the third call returns 4. The outer `x` is never touched and prints 1 — since C++17 a chain of `<<` evaluates left to right, so the output is `14`. `33` would need the capture to be by reference.",
        },
        {
          prompt: `A function returns \`[&]() { return total * 2; }\` where \`total\` is one of its local variables. What happens when the returned lambda is called?`,
          options: ["It returns twice the last value of `total`", "Undefined behaviour: the closure holds a reference to a local that no longer exists", "Compile error: a lambda cannot be returned", "The lambda keeps `total` alive"],
          answer: 1,
          explanation: "`[&]` stores references to the enclosing locals, and those locals are destroyed when the function returns. Nothing keeps them alive; calling the lambda reads a dead object. Capture by copy — `[total]` or `[t = total]` — for any lambda that outlives its scope.",
        },
        {
          prompt: "`std::function<int(int)> f; std::cout << f(2);` — what happens?",
          options: ["Prints `0`", "Prints `2`", "Throws `std::bad_function_call`", "Compile error"],
          answer: 2,
          explanation: "A default-constructed `std::function` is empty, and calling an empty one throws `std::bad_function_call`. Test with `if (f)` before calling a callback that may not have been set.",
        },
        {
          prompt: "Which situation genuinely needs `std::function` rather than `auto` or a template parameter?",
          options: [
            "Passing a comparator to `std::sort`",
            "Storing handlers with different capture lists in one `std::map<std::string, ...>` of callbacks",
            "Calling a generic lambda with two different argument types",
            "Capturing a variable by value",
          ],
          answer: 1,
          explanation: "Every lambda has its own type, so a container needs one common type to hold several of them — that is type erasure, and `std::function` provides it. A comparator passed straight into `std::sort` is deduced as a template parameter and pays no indirection.",
        },
        {
          prompt: "`auto fact = [&fact](int n) -> int { return n <= 1 ? 1 : n * fact(n - 1); };` — what happens?",
          options: [
            "It compiles and computes factorials",
            "Compile error: `fact` is used in its own initialiser before its type is deduced",
            "Stack overflow at run time",
            "It compiles but always returns 1",
          ],
          answer: 1,
          explanation: "A variable declared `auto` has no type until its initialiser is complete, and the initialiser here names the variable. Declare it as `std::function<int(int)>`, or write a generic lambda that receives itself: `[](auto&& self, int n) -> int { ... self(self, n - 1) ... }`.",
        },
        {
          prompt: "A lambda is written `[p = std::make_unique<int>(5)]() { return *p; }`. Which statement is correct?",
          options: [
            "Compile error: a `std::unique_ptr` cannot be captured",
            "It compiles; the closure is move-only, so it works with `auto` but cannot be stored in a `std::function`",
            "It compiles and the closure is freely copyable",
            "Undefined behaviour: the pointer dangles",
          ],
          answer: 1,
          explanation: "An init-capture moves the `unique_ptr` into the closure, which therefore has a move-only member and is itself move-only. `std::function` requires a copyable callable, so storing it there fails to compile; C++23's `std::move_only_function` exists for this and is reading only on this runtime.",
        },
        {
          prompt: "Why write `const std::vector<int> table = [] { std::vector<int> t(10); std::iota(t.begin(), t.end(), 1); return t; }();`?",
          options: [
            "It is the only way to call `std::iota`",
            "The immediately invoked lambda lets a variable that needs several statements to build be `const` from its first moment",
            "It runs at compile time",
            "It avoids allocating the vector",
          ],
          answer: 1,
          explanation: "A `const` variable must be fully initialised in its declaration, and an `if`/`else` or a loop cannot appear there. Wrapping the steps in a lambda and calling it at once yields the finished value in one expression; the vector is still built at run time.",
        },
      ],
    },
    {
      slug: "ranges-and-views",
      file: "05-ranges-and-views.md",
      exercises: [
        {
          title: "First k squares of the positives",
          prompt: `Read an integer \`n\`, then \`n\` integers, then an integer \`k\`. Build **one** pipeline over the vector: \`std::views::filter\` keeps the strictly positive values, \`std::views::transform\` squares each as a \`long long\`, and \`std::views::take\` keeps the first \`k\`. Materialise it with \`std::ranges::copy\` into a \`std::vector<long long>\` through \`std::back_inserter\` (\`std::ranges::to\` is C++23 and not available here).

Print the vector's values on one line separated by single spaces, or \`none\` when it is empty; then \`sum=<total>\` from \`std::accumulate\` with \`0LL\`.

**Input:** \`n\`, the values, \`k\`.
**Output:** two lines.

Example: \`7\` then \`3 -1 4 0 5 -9 2\` then \`3\` →
\`\`\`text
9 16 25
sum=50
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <iostream>
#include <iterator>
#include <numeric>
#include <ranges>
#include <vector>

int main() {
    int n;
    std::cin >> n;
    std::vector<int> values(n);
    for (int& v : values) std::cin >> v;
    int k;
    std::cin >> k;
    std::vector<long long> squares;
    // TODO: values | filter | transform | take, then std::ranges::copy into std::back_inserter(squares)
    // TODO: print the values or "none", then "sum=<accumulate with 0LL>"
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <iostream>
#include <iterator>
#include <numeric>
#include <ranges>
#include <vector>

int main() {
    int n;
    std::cin >> n;
    std::vector<int> values(n);
    for (int& v : values) std::cin >> v;
    int k;
    std::cin >> k;

    auto pipeline = values
        | std::views::filter([](int x) { return x > 0; })
        | std::views::transform([](int x) { return static_cast<long long>(x) * x; })
        | std::views::take(k);
    std::vector<long long> squares;
    std::ranges::copy(pipeline, std::back_inserter(squares));

    if (squares.empty()) {
        std::cout << "none\n";
    } else {
        for (std::size_t i = 0; i < squares.size(); ++i) {
            if (i > 0) std::cout << ' ';
            std::cout << squares[i];
        }
        std::cout << '\n';
    }
    std::cout << "sum=" << std::accumulate(squares.begin(), squares.end(), 0LL) << '\n';
    return 0;
}
`,
          hints: [
            "values | std::views::filter(pred) | std::views::transform(f) | std::views::take(k) is one expression; nothing runs until it is walked.",
            "std::ranges::copy(pipeline, std::back_inserter(squares)) walks it once and pushes each result.",
            "Square in long long — 50000 * 50000 does not fit an int.",
          ],
          cases: [
            { stdin: "7\n3 -1 4 0 5 -9 2\n3\n", expected: "9 16 25\nsum=50\n" },
            { stdin: "4\n-2 -3 -4 -5\n2\n", expected: "none\nsum=0\n" },
            { stdin: "3\n50000 1 2\n5\n", expected: "2500000000 1 4\nsum=2500000005\n", hidden: true },
            { stdin: "0\n3\n", expected: "none\nsum=0\n", hidden: true },
            { stdin: "5\n1 2 3 4 5\n0\n", expected: "none\nsum=0\n", hidden: true },
          ],
        },
        {
          title: "Youngest and oldest by projection",
          prompt: `Read an integer \`n\`, then \`n\` lines of \`name age\` (distinct single-word names, integer ages), then an integer \`k\`. Sort the people with \`std::ranges::sort\` and a **projection** — a lambda returning \`std::tie(p.age, p.name)\` so that equal ages are ordered by name — with the default comparator (\`{}\`), not a comparator lambda. Then print \`youngest\` followed by the first \`k\` people through \`people | std::views::take(k)\`, and \`oldest\` followed by the first \`k\` of \`people | std::views::reverse\`. When \`k\` exceeds \`n\`, each list is everyone.

**Input:** \`n\`, then \`n\` lines, then \`k\`.
**Output:** \`youngest\`, up to \`k\` lines of \`name age\`, \`oldest\`, up to \`k\` lines.

\`\`\`text
5
ann 19
zed 71
bob 23
yan 65
max 40
2
\`\`\`
prints
\`\`\`text
youngest
ann 19
bob 23
oldest
zed 71
yan 65
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <iostream>
#include <ranges>
#include <string>
#include <tuple>
#include <vector>

struct Person {
    std::string name;
    int age;
};

int main() {
    int n;
    std::cin >> n;
    std::vector<Person> people(n);
    for (auto& p : people) std::cin >> p.name >> p.age;
    int k;
    std::cin >> k;
    // TODO: std::ranges::sort(people, {}, <projection returning std::tie(age, name)>)
    std::cout << "youngest\n";
    // TODO: people | std::views::take(k)
    std::cout << "oldest\n";
    // TODO: people | std::views::reverse | std::views::take(k)
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <iostream>
#include <ranges>
#include <string>
#include <tuple>
#include <vector>

struct Person {
    std::string name;
    int age;
};

int main() {
    int n;
    std::cin >> n;
    std::vector<Person> people(n);
    for (auto& p : people) std::cin >> p.name >> p.age;
    int k;
    std::cin >> k;

    std::ranges::sort(people, {}, [](const Person& p) { return std::tie(p.age, p.name); });

    std::cout << "youngest\n";
    for (const Person& p : people | std::views::take(k)) {
        std::cout << p.name << ' ' << p.age << '\n';
    }
    std::cout << "oldest\n";
    for (const Person& p : people | std::views::reverse | std::views::take(k)) {
        std::cout << p.name << ' ' << p.age << '\n';
    }
    return 0;
}
`,
          hints: [
            "The projection is the third argument; {} in the second position keeps std::ranges::less as the comparator.",
            "std::tie(p.age, p.name) builds a tuple of references that compares age first, then name.",
            "views::take(k) on a range shorter than k simply yields the whole range.",
          ],
          cases: [
            { stdin: "5\nann 19\nzed 71\nbob 23\nyan 65\nmax 40\n2\n", expected: "youngest\nann 19\nbob 23\noldest\nzed 71\nyan 65\n" },
            { stdin: "3\nc 30\na 30\nb 30\n2\n", expected: "youngest\na 30\nb 30\noldest\nc 30\nb 30\n" },
            { stdin: "1\nsolo 50\n3\n", expected: "youngest\nsolo 50\noldest\nsolo 50\n", hidden: true },
            { stdin: "4\nd 4\nc 3\nb 2\na 1\n0\n", expected: "youngest\noldest\n", hidden: true },
            { stdin: "3\nx 10\ny -1\nz 0\n1\n", expected: "youngest\ny -1\noldest\nx 10\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "In `std::ranges::sort(people, {}, &Person::age)`, what are the second and third arguments?",
          options: [
            "The begin and end iterators",
            "The default comparator (`std::ranges::less`) and a projection applied to each element before comparing",
            "A comparator and an execution policy",
            "An empty initialiser list and a member pointer that selects which members to sort",
          ],
          answer: 1,
          explanation: "Ranges algorithms take the range, then a comparator (`{}` means the default `std::ranges::less`), then a projection. `&Person::age` is invoked on each element, so the comparator compares ages while the whole `Person` objects are moved.",
        },
        {
          prompt: "`v` has ten elements and `f` is expensive. After `auto r = v | std::views::transform(f);` how many times has `f` run?",
          options: ["10", "0", "1", "20"],
          answer: 1,
          explanation: "Views are lazy: creating one stores the function and a reference to the source, nothing more. `f` runs only when an element is read — ten times for one full walk, twenty for two, and never if the view is discarded.",
        },
        {
          prompt: `What does this print?

\`\`\`cpp
auto r = std::views::iota(1) | std::views::filter([](int x) { return x % 2 == 1; }) | std::views::take(3);
for (int x : r) std::cout << x << ' ';
\`\`\``,
          options: ["`1 3 5`", "It never terminates: `iota(1)` is infinite", "`1 2 3`", "Compile error: `iota` needs an upper bound"],
          answer: 0,
          explanation: "`iota(1)` is unbounded, but `take(3)` stops asking after three elements, and the filter yields only the odd ones on the way. Laziness is what makes an infinite source usable.",
        },
        {
          prompt: "`r` is `v | std::views::filter(pred) | std::views::take(k)`. Which line copies its elements into a `std::vector<int> out` on this C++20 runtime?",
          options: [
            "`auto out = r | std::ranges::to<std::vector>();`",
            "`std::vector<int> out(r.begin(), r.end());`",
            "`std::vector<int> out; std::ranges::copy(r, std::back_inserter(out));`",
            "`std::vector<int> out = r;`",
          ],
          answer: 2,
          explanation: "`ranges::to` is C++23 and does not compile here. The iterator-pair constructor fails because `take` over `filter` has a sentinel `end()` whose type differs from `begin()`; a view does not convert to a vector. `std::ranges::copy` into a `back_inserter` walks the view once and pushes each element.",
        },
        {
          prompt: `Does this compile?

\`\`\`cpp
const auto evens = v | std::views::filter([](int x) { return x % 2 == 0; });
for (int x : evens) std::cout << x;
\`\`\``,
          options: ["Yes, it prints the even elements", "No: a `filter_view`'s `begin()` is not `const`, because it caches the first match", "No: views cannot be range-for iterated", "Yes, but it prints nothing"],
          answer: 1,
          explanation: "`filter_view` remembers where its first passing element is, so `begin()` mutates the view and is declared non-`const`. A `const` filter view has no usable `begin()`, and the loop fails to compile. Drop the `const`.",
        },
        {
          prompt: "Which of these is C++23 and therefore **unavailable** on this track's C++20 runtime?",
          options: ["`std::views::drop`", "`std::views::enumerate`", "`std::views::iota`", "`std::views::take_while`"],
          answer: 1,
          explanation: "`enumerate`, `zip`, `chunk`, `adjacent` and `ranges::to` arrived in C++23. `drop`, `iota` and `take_while` are C++20 and compile here.",
        },
        {
          prompt: "What does a ranges pipeline change about the cost of an algorithm?",
          options: [
            "`std::ranges::sort` is O(n) because it uses a projection",
            "Nothing — the same algorithms and complexities sit underneath; the pipeline removes intermediate containers and changes the spelling",
            "Views make every algorithm lazy, including `sort`",
            "Ranges algorithms run in parallel by default",
          ],
          answer: 1,
          explanation: "`std::ranges::sort` is still introsort and `std::ranges::find` is still a linear scan. What ranges save is the copies between steps and the boilerplate; a view is lazy, but an algorithm such as `sort` still does its whole job when called.",
        },
      ],
    },
    {
      slug: "algorithms-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Tasks by priority, arrival order kept",
          prompt: `Read an integer \`n\`, then \`n\` lines of \`task priority\` (single-word task names, integer priorities). Order the tasks by priority **descending** with \`std::stable_sort\`, so that tasks of equal priority keep the order in which they were read — the comparator compares priority only. Print each task as \`<task> (<priority>)\`.

**Input:** \`n\`, then \`n\` lines.
**Output:** \`n\` lines.

\`\`\`text
5
write 2
test 3
lint 2
deploy 3
docs 1
\`\`\`
prints
\`\`\`text
test (3)
deploy (3)
write (2)
lint (2)
docs (1)
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

struct Task {
    std::string name;
    int priority;
};

int main() {
    int n;
    std::cin >> n;
    std::vector<Task> tasks(n);
    for (auto& t : tasks) std::cin >> t.name >> t.priority;
    // TODO: std::stable_sort by priority descending
    for (const Task& t : tasks) std::cout << t.name << " (" << t.priority << ")\n";
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <iostream>
#include <string>
#include <vector>

struct Task {
    std::string name;
    int priority;
};

int main() {
    int n;
    std::cin >> n;
    std::vector<Task> tasks(n);
    for (auto& t : tasks) std::cin >> t.name >> t.priority;

    std::stable_sort(tasks.begin(), tasks.end(),
                     [](const Task& a, const Task& b) { return a.priority > b.priority; });

    for (const Task& t : tasks) std::cout << t.name << " (" << t.priority << ")\n";
    return 0;
}
`,
          hints: [
            "std::stable_sort takes the same arguments as std::sort and preserves the relative order of equal elements.",
            "\"Descending\" means the comparator returns true when a.priority > b.priority — never >=.",
          ],
          cases: [
            { stdin: "5\nwrite 2\ntest 3\nlint 2\ndeploy 3\ndocs 1\n", expected: "test (3)\ndeploy (3)\nwrite (2)\nlint (2)\ndocs (1)\n" },
            { stdin: "3\na 1\nb 1\nc 1\n", expected: "a (1)\nb (1)\nc (1)\n" },
            { stdin: "1\nx 9\n", expected: "x (9)\n", hidden: true },
            { stdin: "4\np 0\nq -1\nr 0\ns 5\n", expected: "s (5)\np (0)\nr (0)\nq (-1)\n", hidden: true },
            { stdin: "6\nf 2\ne 2\nd 2\nc 1\nb 1\na 1\n", expected: "f (2)\ne (2)\nd (2)\nc (1)\nb (1)\na (1)\n", hidden: true },
          ],
        },
        {
          title: "Median without sorting",
          prompt: `Read an integer \`n\` (at least 1), then \`n\` integers, then an integer \`q\`, then \`q\` integers \`k\` (each between 1 and \`n\`). Print the median with \`std::nth_element\` — no full sort: for odd \`n\` it is the element that lands at index \`n / 2\`; for even \`n\` it is the mean of that element and the largest element before it (\`std::max_element\` over the left part, which \`nth_element\` guarantees holds nothing greater). Print it with one decimal place (\`std::fixed\`, \`std::setprecision(1)\`). Then, for each \`k\`, print the \`k\`-th smallest value using \`std::nth_element\` again.

**Input:** \`n\`, the values, \`q\`, the queries.
**Output:** \`median=<value>\`, then \`q\` lines.

Example: \`5\` then \`7 1 9 3 5\` then \`2\` then \`1\` and \`4\` →
\`\`\`text
median=5.0
1
7
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <iomanip>
#include <iostream>
#include <vector>

int main() {
    int n;
    std::cin >> n;
    std::vector<int> values(n);
    for (int& v : values) std::cin >> v;
    // TODO: nth_element at n / 2; for even n average with the max of the left part
    std::cout << std::fixed << std::setprecision(1) << "median=" << 0.0 << '\n';
    int q;
    std::cin >> q;
    for (int i = 0; i < q; ++i) {
        int k;
        std::cin >> k;
        // TODO: nth_element at k - 1 and print that element
        std::cout << 0 << '\n';
    }
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <iomanip>
#include <iostream>
#include <vector>

int main() {
    int n;
    std::cin >> n;
    std::vector<int> values(n);
    for (int& v : values) std::cin >> v;

    const auto middle = values.begin() + n / 2;
    std::nth_element(values.begin(), middle, values.end());
    double median = *middle;
    if (n % 2 == 0) {
        const int lower = *std::max_element(values.begin(), middle);
        median = (static_cast<double>(lower) + *middle) / 2.0;
    }
    std::cout << std::fixed << std::setprecision(1) << "median=" << median << '\n';

    int q;
    std::cin >> q;
    for (int i = 0; i < q; ++i) {
        int k;
        std::cin >> k;
        const auto kth = values.begin() + (k - 1);
        std::nth_element(values.begin(), kth, values.end());
        std::cout << *kth << '\n';
    }
    return 0;
}
`,
          hints: [
            "After nth_element(begin, begin + n / 2, end), everything before the middle is <= the middle element.",
            "For even n the lower middle is therefore the max of [begin, middle) — one max_element call.",
            "The k-th smallest is what nth_element leaves at index k - 1; the earlier rearrangement does not matter.",
          ],
          cases: [
            { stdin: "5\n7 1 9 3 5\n2\n1\n4\n", expected: "median=5.0\n1\n7\n" },
            { stdin: "4\n10 2 8 4\n1\n2\n", expected: "median=6.0\n4\n" },
            { stdin: "1\n42\n1\n1\n", expected: "median=42.0\n42\n", hidden: true },
            { stdin: "6\n-5 -1 -3 -2 -4 -6\n2\n6\n3\n", expected: "median=-3.5\n-1\n-4\n", hidden: true },
            { stdin: "2\n1 2\n1\n2\n", expected: "median=1.5\n2\n", hidden: true },
          ],
        },
        {
          title: "Walk a nested list with a recursive lambda",
          prompt: `The input is one nested list written as space-separated tokens: \`[\` opens a list, \`]\` closes it, and every other token is an integer. Example: \`[ 1 [ 2 3 ] [ 4 [ 5 ] ] ]\`. Walk it with a **recursive lambda** — a generic lambda that receives itself as its first parameter (\`auto&& self\`) with an explicit \`-> void\` return type, or a \`std::function\` — reading tokens with \`std::cin >>\`: an integer is added to the running sum and counted, a \`[\` recurses one level deeper, a \`]\` returns. Report the sum (in \`long long\`), the number of integers, and the deepest nesting, where the outermost list is depth 1.

**Input:** one line.
**Output:** \`sum=<total>\`, \`count=<integers>\`, \`depth=<max depth>\`.

Example: \`[ 1 [ 2 3 ] [ 4 [ 5 ] ] ]\` →
\`\`\`text
sum=15
count=5
depth=3
\`\`\``,
          starter: String.raw`#include <algorithm>
#include <iostream>
#include <string>

int main() {
    long long sum = 0;
    int count = 0;
    int maxDepth = 0;

    // TODO: a recursive lambda walk(self, depth) that reads tokens until "]"
    //       "[" -> self(self, depth + 1); otherwise sum += std::stoll(token), ++count

    std::string opening;
    std::cin >> opening;          // the outermost "["
    // TODO: walk(walk, 1);

    std::cout << "sum=" << sum << '\n';
    std::cout << "count=" << count << '\n';
    std::cout << "depth=" << maxDepth << '\n';
    return 0;
}
`,
          solution: String.raw`#include <algorithm>
#include <iostream>
#include <string>

int main() {
    long long sum = 0;
    int count = 0;
    int maxDepth = 0;

    auto walk = [&](auto&& self, int depth) -> void {
        maxDepth = std::max(maxDepth, depth);
        std::string token;
        while (std::cin >> token && token != "]") {
            if (token == "[") {
                self(self, depth + 1);
            } else {
                sum += std::stoll(token);
                ++count;
            }
        }
    };

    std::string opening;
    std::cin >> opening;          // the outermost "["
    walk(walk, 1);

    std::cout << "sum=" << sum << '\n';
    std::cout << "count=" << count << '\n';
    std::cout << "depth=" << maxDepth << '\n';
    return 0;
}
`,
          hints: [
            "auto walk = [&](auto&& self, int depth) -> void { ... }; and call it as walk(walk, 1).",
            "Inside, loop while (std::cin >> token && token != \"]\"): the closing bracket ends this level.",
            "Record std::max(maxDepth, depth) on entry; the sum and count are captured by reference, so no return value is needed.",
          ],
          cases: [
            { stdin: "[ 1 [ 2 3 ] [ 4 [ 5 ] ] ]\n", expected: "sum=15\ncount=5\ndepth=3\n" },
            { stdin: "[ 10 20 30 ]\n", expected: "sum=60\ncount=3\ndepth=1\n" },
            { stdin: "[ ]\n", expected: "sum=0\ncount=0\ndepth=1\n", hidden: true },
            { stdin: "[ -3 [ 4 [ [ 100 ] ] ] ]\n", expected: "sum=101\ncount=3\ndepth=4\n", hidden: true },
            { stdin: "[ 2000000000 2000000000 ]\n", expected: "sum=4000000000\ncount=2\ndepth=1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "`auto it = std::find_if(v.begin(), v.end(), pred);` — what must happen before `*it` is used?",
          options: ["Nothing; `find_if` always finds something", "Compare `it` with `v.end()`; dereferencing `end()` is undefined behaviour", "Check `it != nullptr`", "Call `it.valid()`"],
          answer: 1,
          explanation: "An algorithm signals \"no match\" by returning the `last` iterator it was given. That iterator points past the end, so dereferencing it is undefined behaviour; the `!= end()` test is the idiom.",
        },
        {
          prompt: "`std::max_element` and `std::minmax_element` both run on `{2, 9, 9, 1}`. Which indices do they report for the maximum?",
          options: ["Both report 1", "Both report 2", "`max_element` reports 1 (the first 9); `minmax_element` reports 2 (the last 9)", "`max_element` reports 2; `minmax_element` reports 1"],
          answer: 2,
          explanation: "`max_element` returns the first of equal maxima; `minmax_element` returns the first minimum but the **last** maximum, a consequence of its pairwise comparison scheme.",
        },
        {
          prompt: "Why is `std::max(1, 2.5)` a compile error?",
          options: ["`std::max` only accepts integers", "Template argument deduction finds `T = int` from one argument and `T = double` from the other", "`2.5` cannot be converted to `int`", "`std::max` needs three arguments"],
          answer: 1,
          explanation: "Both parameters are `const T&` with the same `T`, and the two arguments disagree on what `T` is. Supply it explicitly — `std::max<double>(1, 2.5)` — or make the literals agree.",
        },
        {
          prompt: "A comparator for `std::sort` returns `a.score >= b.score`. What is the consequence?",
          options: ["A correct descending sort", "Undefined behaviour: `>=` is not a strict weak ordering, and equal scores can make the sort read past the end", "A compile error", "The sort is stable"],
          answer: 1,
          explanation: "A strict weak ordering must be irreflexive, and `>=` reports that an element precedes itself. Introsort's inner loops rely on the guarantee to stop; with equal elements they can run off the array. Use `>`.",
        },
        {
          prompt: "What is the average complexity of `std::nth_element` on `n` elements, and what does it guarantee afterwards?",
          options: [
            "O(n log n); the whole range is sorted",
            "O(n); the nth position holds the sorted value, everything before is no greater, everything after no smaller",
            "O(log n); it returns the value without moving anything",
            "O(n²); only the nth position is correct",
          ],
          answer: 1,
          explanation: "`nth_element` is a selection algorithm, linear on average, that partitions around the nth position rather than sorting. That partition property is what makes the median — and the lower middle for an even count — readable in linear time.",
        },
        {
          prompt: "`v` is sorted ascending. `std::upper_bound(v.begin(), v.end(), 10) - std::lower_bound(v.begin(), v.end(), 5)` computes…",
          options: ["The number of elements in the closed interval `[5, 10]`", "The number of elements strictly between 5 and 10", "The index of the first 10", "Undefined behaviour"],
          answer: 0,
          explanation: "`lower_bound(5)` is the first element ≥ 5 and `upper_bound(10)` the first element > 10; everything in between is in `[5, 10]`, and the iterator difference is the count.",
        },
        {
          prompt: "`std::vector<long long> v{3000000000, 3000000000}; auto s = std::accumulate(v.begin(), v.end(), 0);` What is the type of the accumulator, and why?",
          options: ["`long long`, from the element type", "`int`, from the initial value `0`", "`double`, the widest available", "`auto` — it is deduced from the largest element"],
          answer: 1,
          explanation: "`accumulate` deduces its accumulator type from the third argument alone. `0` is an `int`, so both elements are added into an `int` and overflow; `0LL` is the one-character fix.",
        },
        {
          prompt: "Which single C++20 call removes every element matching `pred` from a `std::vector<int> v` — no erase needed afterwards?",
          options: ["`std::remove_if(v.begin(), v.end(), pred)`", "`std::erase_if(v, pred)`", "`v.remove_if(pred)`", "`std::filter(v, pred)`"],
          answer: 1,
          explanation: "`std::erase_if` (C++20, declared in `<vector>`) performs the erase–remove idiom in one call and returns the number of elements removed. `remove_if` alone only shifts survivors; `remove_if` as a member exists on `std::list`, not `std::vector`.",
        },
        {
          prompt: "`std::any_of(v.begin(), v.end(), pred)` on an empty `v` returns…",
          options: ["`true`", "`false`", "Undefined behaviour", "It throws"],
          answer: 1,
          explanation: "No element satisfies the predicate because there is no element, so `any_of` is `false`; `all_of` and `none_of` are vacuously `true` on the same empty range.",
        },
        {
          prompt: `What does this print?

\`\`\`cpp
auto next = [n = 0]() mutable { return ++n; };
auto copy = next;
next(); next();
std::cout << next() << copy() << '\n';
\`\`\``,
          options: ["`33`", "`31`", "`34`", "`11`"],
          answer: 1,
          explanation: "The closure's state is a data member, and copying the closure copies it: `copy` took a snapshot when `n` was 0. `next` advances to 3; `copy`'s first call returns 1.",
        },
        {
          prompt: "Calling a default-constructed `std::function<void()>`…",
          options: ["Does nothing", "Throws `std::bad_function_call`", "Is a compile error", "Calls a default lambda"],
          answer: 1,
          explanation: "An empty `std::function` has no target; invoking it throws `std::bad_function_call`. Test `if (f)` first when a callback may be unset.",
        },
        {
          prompt: "A member function stores `[&]() { use(counter); }` in a member for later; `counter` is a local of that member function. The stored lambda is called after the function returns. What is the result?",
          options: ["It uses the last value `counter` had", "Undefined behaviour: `[&]` captured a reference to a local that has been destroyed", "Compile error", "The lambda keeps `counter` alive until it runs"],
          answer: 1,
          explanation: "A lambda stored past the enclosing scope must capture by copy. `[&]` leaves a reference to a dead stack variable, and nothing in C++ extends a local's lifetime for a closure.",
        },
        {
          prompt: "After `auto r = std::views::iota(1) | std::views::transform(square) | std::views::take(5);` and before any loop, how much work has been done?",
          options: ["Five squares have been computed", "None: views are lazy; `square` runs only as elements are read, and `take` stops the infinite `iota` after five", "The whole infinite sequence is being computed in the background", "Compile error: `iota` needs two arguments"],
          answer: 1,
          explanation: "Building a pipeline stores adaptors, not results. Iterating `r` pulls five elements through `transform`, and `take` never asks the unbounded `iota` for a sixth.",
        },
        {
          prompt: "Which line materialises a filtered pipeline `r` into a vector on this C++20 runtime?",
          options: [
            "`auto out = r | std::ranges::to<std::vector>();`",
            "`std::vector<int> out(r.begin(), r.end());`",
            "`std::vector<int> out; std::ranges::copy(r, std::back_inserter(out));`",
            "`std::vector<int> out = std::vector(r);`",
          ],
          answer: 2,
          explanation: "`ranges::to` is C++23. The iterator-pair constructor needs `begin()` and `end()` of the same type, and a filter's `end()` is a sentinel. Copying through `std::back_inserter` works on any input range.",
        },
      ],
    },
  ],
});
