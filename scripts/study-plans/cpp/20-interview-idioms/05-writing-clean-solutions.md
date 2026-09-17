---
title: Writing clean solutions under time pressure
minutes: 12
---
Two candidates solve the same problem correctly in the same forty minutes, and one is hired. The difference is almost always what the interviewer could *see*: a structure that made the correctness obvious, names that said what things were, edge cases handled in visible lines, `const` and `long long` in the right places, and a complexity stated without prompting. Clean code in an interview is not style points; it is how you make your thinking legible to someone deciding whether to trust you with a codebase. These are the C++ habits that produce that legibility without costing minutes.

## Structure: read, solve, print

```cpp
optional<size_t> firstFault(string_view s);          // pure: input in, answer out

int main() {
    string line;
    while (getline(cin, line)) {
        if (auto at = firstFault(line)) cout << "unbalanced at " << *at << '\n';
        else cout << "balanced\n";
    }
    return 0;
}
```

`main` reads and prints; the function computes and touches no stream and no global. The interviewer reads the algorithm without wading through parsing; you can check `firstFault("(]")` in your head without typing input; and when the input format changes, only `main` changes. A function that both computes and prints is twice as hard to reason about.

Take input by `const&` or `string_view` and return the answer by value: the copy is elided (Module 9 lesson 5). An output parameter — `void solve(const vector<ll>& a, ll& answer)` — is the C habit the interviewer hopes not to see. Return the right thing, too: `std::optional<T>` for "maybe an answer" rather than a `-1` sentinel that a legitimate negative result will collide with, and a `std::pair` or a two-field `struct` for two results, unpacked with a structured binding at the call.

## Helpers with one job

`isOpener(c)`, `matches(open, close)`, `inBounds(r, c)`, `neighbours(node)` — a five-line helper costs fifteen seconds and removes a nested block from the main logic. It also lets you *say* the plan before typing it: "a predicate for openers, a predicate for matching pairs, then a stack walk." In C++ the helpers go above `main` as free functions, or get a one-line declaration at the top and their bodies below; a function used before it is declared is a compile error.

## Names that carry the invariant

`lo`/`hi` for a binary search, `left`/`right` for two pointers, `seen`, `prefix`, `best`, `openers` — the conventional names are documentation because every reader has met them. Beyond those, a name says what is true: `firstUnsortedIndex`, `windowSum`, `remainingBudget`; never `temp`, `data`, `flag`. C++ adds a rule the other tracks do not have: under `using namespace std;` the names `count`, `size`, `rank`, `distance`, `next`, `prev`, `left` and `right` belong to the library, so a function called `rank` is an ambiguous reference — write `rankEntries`, `countPairs`. A variable that needs a comment to say what it holds needs a better name.

## `const` and `auto` where they help

```cpp
for (const auto& s : names) …            // read: no copy
for (auto& p : pairs) ++p.second;         // modify in place
for (long long x : v) sum += x * x;      // widen before the multiply
const char c = s[i];                      // will not change: say so
```

`const` on a local that never changes is a sentence the reader does not have to verify; `const T&` on a parameter is a promise not to modify the caller's object; a `const` member function is the same promise for `this`. `auto` earns its place for iterators, lambdas, structured bindings and map entries — wherever the spelled type is long and adds nothing. It does not earn its place where the type *is* the point: `auto total = 0;` is an `int`, the overflow from the pitfalls lesson in disguise; `long long total = 0;` says what you meant. The range-`for` rule: `const auto&` to read, `auto&` to modify, plain `auto` only when you want a copy; `long long x : v` over a `vector<int>` widens each element before it is used.

## Make the edge cases visible

```cpp
if (v.empty()) return 0;                  // no elements
if (v.size() == 1) return v[0];           // one element
```

Guard clauses at the top, one per line, each a sentence the interviewer can tick off. They keep the main loop free of special cases, and in C++ an early return is safe: RAII means nothing leaks on the way out, so the single-exit rule is a C-era habit you may drop. While writing the loop, state the invariant once — "at the top of each iteration `openers` holds every unmatched opener, innermost last" — which convinces the interviewer, and you, without tracing.

## Comments: why, not what

`// increment i` is noise. `// v is sorted, so once v[i] > target no later pair can work` justifies a `break` that would otherwise look like a bug. Comment the non-obvious decision, the invariant, the reason a special case exists. Delete the debugging prints before saying "done": a stray `cout` is a wrong answer.

## Say the complexity, then the trade-off

"O(n log n) for the sort, then O(n) for the sweep, O(n) extra for the map. A hash set would make it O(n) on average but lose the ordered output, so I would keep the tree unless n is large." That sentence, unprompted, is the highest-leverage thing you can say: it shows you know what you built and that you weighed the alternative — which is the job.

## Test in your head, in order

1. The example from the statement — trace it; do not glance at it.
2. The smallest input: empty, one element, a single line.
3. A boundary: the window exactly `k` wide, the target equal to the first element.
4. An adversarial one: all equal, all negative, sorted descending, a value that overflows `int`.

Then the review pass from the pitfalls lesson — `int` products, `size()` arithmetic, `map[]`, `erase` in a loop, uninitialised locals, `endl`. Tracing a four-element input aloud takes a minute and finds most off-by-ones.

## When you are stuck

Say what you know: "I need better than O(n²); sorting gives me order, but I do not yet see how to use it." Then simplify — small n, the sorted case, one query — and grow the solution. A brute force written cleanly and *labelled* as the baseline earns partial credit and usually shows where the optimisation is: the repeated scan becomes a sort, the repeated lookup a map.

## What interviewers score

| Dimension | What it looks like in C++ |
| --- | --- |
| Correctness | The example and the edge cases pass; no undefined behaviour in the hidden cases |
| Complexity | Stated unprompted, with the trade-off |
| Ownership and types | `const&` parameters, `long long` where it matters, no raw `new`, nothing dangling |
| Structure | read → solve → print, helpers with one job, names that carry meaning |
| Communication | The plan before the code, the invariant during, the review pass after |

The last row is where C++ candidates most often lose: interviewers cannot score what they do not hear.

## Pitfalls

- `auto total = 0;` is an `int`; write the type when the type is the point.
- `for (auto s : names)` copies every string; `for (auto p : pairs) p.second++` modifies copies.
- A helper named `rank`, `count` or `size` under the using-directive is ambiguous.
- Debug output on `cout`, or a `cerr` left inside a hot loop.

## Key takeaways

- Read → solve (pure, `const&` in, value out) → print; helpers with one job above `main`.
- Conventional names, invariant-carrying names elsewhere; not the library's names under `using namespace std;`.
- `const auto&` to read, `auto&` to modify, `long long` where it accumulates; `const` on anything that does not change.
- Guard clauses for edge cases, a stated invariant for the loop, comments for *why*.
- Say the complexity and the trade-off unprompted; trace the example and the smallest inputs aloud; when stuck, write the labelled brute force.
