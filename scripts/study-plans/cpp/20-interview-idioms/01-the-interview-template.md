---
title: The interview template — the contest idioms and what they cost
minutes: 13
---
Every timed round starts the same way: a statement, an input format, a limit, and forty minutes. The candidates who do well have stopped thinking about the mechanics — the includes, the fast reader, which integer type — because they type a template from memory and spend the minutes on the problem. C++ has a well-known contest template, and nineteen modules of this track have told you not to write two lines of it. This lesson gives you the template, measures what each line buys and costs, and draws the boundary: these are idioms for a clock, and knowing *why* they stay out of production code is what an interviewer is listening for.

## The template

```cpp
#include <bits/stdc++.h>
using namespace std;
using ll = long long;

const ll MOD = 1'000'000'007;

#ifdef LOCAL
#define dbg(x) cerr << #x << " = " << (x) << '\n'
#else
#define dbg(x)
#endif

ll solve(const vector<ll>& a) {
    ll best = 0;
    for (ll x : a) best = max(best, x);
    return best;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<ll> a(n);
    for (auto& x : a) cin >> x;
    dbg(n);
    cout << solve(a) << '\n';
    return 0;
}
```

Type it until it takes ninety seconds. Every line is deliberate: `solve` is separate from I/O so the logic is readable and testable; every quantity that could pass two billion is `long long` from the start; the output is `'\n'`, never `endl`; `dbg` prints to `cerr` — which the judge ignores — and compiles to nothing unless you build with `-DLOCAL`.

## `#include <bits/stdc++.h>`

The header is not in the standard. It is an internal file of libstdc++, GCC's standard library, that includes every standard header at once — and because Clang on Linux uses libstdc++ by default it works there too, including on this track's judge (Clang 18, libstdc++ 14). It does not exist on MSVC or with libc++ (Apple Clang), so a solution that uses it is not portable C++.

The other cost is compile time. Measured on the lab's g++ 14 with `-O2`: a hello-world-sized program compiled in about 0.9 s with `<iostream>`, `<vector>`, `<algorithm>` and `<string>`, and in about 3 s with `bits/stdc++.h`. Three seconds is nothing once; across a thousand translation units that each pay it, it is the difference between a build you wait for and one you do not. Under a clock, "forgetting an include is impossible" wins; in a repository, portability, build time and a file that states its own dependencies win. Know both.

## `using namespace std;`

The directive makes every name in `std` visible unqualified. The cost is not style; it is that every one of those names is now a name you cannot safely declare yourself. Module 1 introduced the trade-off; here is what it looks like when it bites:

```cpp
#include <bits/stdc++.h>
using namespace std;
int count = 0;                                   // a natural name for a counter
int main() {
    vector<int> v{1, 2, 2};
    cout << count(v.begin(), v.end(), 2);        // error: reference to 'count' is ambiguous
}
```

Unqualified lookup finds your `count` and `std::count` in the same scope and refuses to choose. A function named `rank` clashes the same way with the type trait `std::rank`; `size`, `data`, `distance`, `next`, `prev`, `left`, `right`, `apply` and `reduce` are all in the library. (Separately, `<cmath>` drags C's `y1`, `j0` and `gamma` into the global namespace, so `double y1;` fails even without the directive.) In a 60-line solution with three variables none of this happens; in a header it happens to everyone who includes it. The rule is therefore simple: the directive never goes in a header, and in an interview you can use it while saying that sentence.

## The two fast-I/O lines

```cpp
ios::sync_with_stdio(false);
cin.tie(nullptr);
```

By default every `cin` read is synchronised with C's `stdin` so that `scanf` and `cin` can interleave; switching that off lets the C++ streams keep their own buffer. Measured on the lab reading a million integers: 400–470 ms synchronised, 155–195 ms not. The rule that comes with it: after the call, never mix `printf`/`scanf` with `cout`/`cin` — the two families no longer share a buffer, and output arrives out of order.

`cin.tie(nullptr)` unties `cin` from `cout`. A tied stream is flushed before every read so that a prompt appears before the program waits; a judge never reads prompts, so the flush is pure cost. Interactive problems — where you talk to a judge process — are the exception: there you flush explicitly after every query, and the statement says so.

## `long long` by default

`int` is 32 bits on this platform: about ±2.1 × 10⁹. A sum of 10⁵ values up to 10⁵ is 10¹⁰; a product of two values near 10⁵ is 10¹⁰; `n * (n - 1) / 2` for `n = 10⁵` is 5 × 10⁹. Every one of those overflows `int`, and signed overflow is undefined behaviour — not a wrong number, but a program the optimiser may transform on the assumption that it never happens (Module 19). `long long` holds ±9.2 × 10¹⁸, which covers every intermediate in a typical problem. So: `long long` for anything that accumulates or multiplies; `int` for indexes and loop variables.

The contest hack you will see is `#define int long long` with `signed main()`. It works. It also rewrites every `int` the preprocessor reaches — `sizeof`, overload choices, code pasted from elsewhere — and cannot be explained to an interviewer as anything but a trick. `using ll = long long;` costs the same keystrokes and says what you meant.

## Reading patterns

| Shape | Code |
| --- | --- |
| `n` then `n` values | `int n; cin >> n; vector<ll> a(n); for (auto& x : a) cin >> x;` |
| `T` test cases | `int T; cin >> T; while (T--) { … }` |
| Until end of input | `ll x; while (cin >> x) { … }` |
| A grid of characters | `vector<string> g(R); for (auto& row : g) cin >> row;` |
| A line with spaces | `cin >> n; cin.ignore(); getline(cin, line);` |

`cin >> row` reads one whitespace-free token, which is exactly one row of `.` and `#`, and `g[r][c]` then indexes it. The mixed case is Module 1's rule — `>>` leaves the newline behind, and a following `getline` returns an empty string unless you consume it.

## Printing

`'\n'` ends a line; `endl` ends a line *and flushes*, which is a system call. Measured on the lab printing a million lines: about 500 ms with `endl`, about 40 ms with `'\n'`. Buffered output leaves when the program exits, which is all a judge needs. Decimals are printed with `fixed << setprecision(k)`, which is sticky, so set it once. For a modular answer, `const ll MOD = 1'000'000'007;` at the top (the digit separators are C++14), reduce after every multiplication, and normalise a subtraction with `((x % MOD) + MOD) % MOD` — the pitfalls lesson returns to both.

## What goes wrong

| Mistake | What happens |
| --- | --- |
| `int total = n * n;` | Overflow in `int` before any widening: undefined behaviour |
| `scanf` after `sync_with_stdio(false)` | Input read twice or out of order |
| `endl` in a loop of 10⁶ lines | A flush per line — an order of magnitude slower |
| `while (!cin.eof())` | One extra iteration with a stale value |
| A global named `count`, `size` or `rank` | Ambiguous reference under `using namespace std;` |
| `dbg(x)` printing to `cout` | Debug text in the judged output: wrong answer |

## Key takeaways

- The template: `bits/stdc++.h`, `using namespace std;`, the two fast-I/O lines, `using ll = long long;`, `solve` separate from `main`, `'\n'` to print, `dbg` to `cerr` behind `#ifdef LOCAL`.
- `bits/stdc++.h` is a libstdc++ internal (GCC and Clang-with-libstdc++ only) that measured about three times the compile time; real headers in anything you keep.
- `using namespace std;` makes `count`, `size`, `rank` and hundreds more names unusable for your own declarations — fine in a 60-line file, never in a header.
- `sync_with_stdio(false)` roughly halved input time on the lab; after it, never mix C and C++ I/O. `cin.tie(nullptr)` removes a flush per read.
- `long long` for anything that sums or multiplies; `int` overflow is undefined behaviour, not a wrapped number.
