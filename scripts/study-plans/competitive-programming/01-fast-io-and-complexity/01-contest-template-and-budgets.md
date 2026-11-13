---
title: The contest template and complexity budgets
minutes: 15
seo-title: Time Complexity in Competitive Programming: The 10^8 Rule
description: Turn a problem's constraints into the complexity that passes a 1-second limit at about 10^8 operations, and start every C++ solution from a fast-I/O template.
question: How do I know which time complexity will pass in competitive programming?
answer: Put the largest n from the constraints into each idea's complexity and compare it with about 10^8 simple operations per second of time limit. Under the line it passes. So n ≤ 10^6 allows O(n log n), n ≤ 10^4 allows O(n²), n ≤ 400 allows O(n³) and n ≤ 25 allows O(2ⁿ).
q: How many operations per second does a judge run?
a: Roughly 10^8 simple operations — additions, comparisons, array reads in a tight loop. It is a rule of thumb, not a constant: divisions, cache misses and heavy STL containers are slower, plain loops can be faster. It is the right order of magnitude to budget with.
q: Why use long long in competitive programming?
a: An `int` holds about ±2.1 × 10^9, and contest sums, products and pair counts pass that routinely — 10^5 values of 10^9 add up to 10^14. Signed overflow is undefined behaviour and usually a wrong answer, so values and totals go in `long long`, which holds about ±9.2 × 10^18.
q: What do ios::sync_with_stdio(false) and cin.tie(nullptr) do?
a: The first stops `cin` and `cout` synchronising with C's stdio, so they keep their own fast buffers; the second stops `cout` being flushed before every read. With large input they make reading and printing several times faster. Afterwards, do not mix `scanf`/`printf` with `cin`/`cout`.
q: What does n ≤ 10^5 tell me about the solution?
a: That O(n²), about 10^10 operations, is too slow, and the intended solution is O(n log n) or O(n) — sorting, binary search, prefix sums, two pointers or a hash map. The constraint is a hint the setter gives you on purpose.
---
A contest problem is judged twice: is the answer right, and did it arrive within the time limit? This lesson settles the second question before you write a line.

## The template

```cpp
#include <bits/stdc++.h>
using namespace std;
using ll = long long;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    cin >> n;
    vector<ll> a(n);
    for (auto& x : a) cin >> x;
    // solve
    cout << answer << '\n';
}
```

- `bits/stdc++.h` includes the whole standard library at once (GCC's libstdc++, which judges use). Fine for a contest, never in a project.
- `using namespace std` saves typing in a one-file solution.
- The two fast-I/O lines make `cin`/`cout` fast enough for 10⁶ numbers. After them, never mix in `scanf`/`printf`.
- `ll` — **long long by default**. An `int` stops at about 2.1 × 10⁹; a sum of 10⁵ values of 10⁹ is 10¹⁴.
- Print `'\n'`, not `endl`: `endl` flushes on every line.

## Read the constraints first

A judge runs roughly **10⁸ simple operations per second**. Put the largest n into your idea's complexity:

- n ≤ 10⁵ and an O(n²) idea → 10¹⁰ operations, a hundred times over. Too slow.
- n ≤ 10⁵ and O(n log n) → about 1.7 × 10⁶. Passes easily.

So the constraint on n names the slowest algorithm the setter allows. Watch the bars move as n grows:

@figure budget

The table to keep in your head, every row computed at 10⁸:

- n ≤ 11 → O(n!) · n ≤ 25 → O(2ⁿ) · n ≤ 400 → O(n³)
- n ≤ 10⁴ → O(n²) · n ≤ 10⁶ → O(n log n) · n ≤ 10⁸ → O(n)
- n up to 10¹⁸ → O(log n) or a formula

```game
type: pick
title: Will it pass in 1 second?
prompt: Pick the slowest complexity that still fits about 10^8 operations.
? n ≤ 10
* O(n!)
- O(2ⁿ)
- O(n²)
> 10! is about 3.6 × 10^6, well inside. With n this small, even trying every order passes.
? n ≤ 20
- O(n!)
* O(2ⁿ · n)
- O(n³)
> 2^20 · 20 ≈ 2.1 × 10^7 fits; 20! ≈ 2.4 × 10^18 does not. Twenty is the bitmask number.
? n ≤ 300
- O(n⁴)
* O(n³)
- O(n² log n)
> 300³ = 2.7 × 10^7 fits; 300⁴ = 8.1 × 10^9 is eighty times over.
? n ≤ 5000
- O(n³)
* O(n²)
- O(n log n)
> 5000² = 2.5 × 10^7 fits; 5000³ = 1.25 × 10^11 does not.
? n ≤ 2 · 10^5
- O(n²)
* O(n log n)
- O(n)
> (2 · 10^5)² = 4 × 10^10 is far over; n log n ≈ 3.5 × 10^6 fits.
? n ≤ 10^7
- O(n log n)
* O(n)
- O(n²)
> n log n ≈ 2.3 × 10^8 is over the line; a single pass, 10^7 steps, fits.
? n ≤ 10^18
- O(n)
- O(√n)
* O(log n)
> √(10^18) = 10^9 is already ten times over. Only a logarithm or a formula survives.
```

## Habits that save a verdict

- Read the constraints **before** the idea. They are a hint.
- Use the worst case, not the example: the hidden tests are at the limit.
- Two seconds doubles the budget; it does not turn O(n²) at n = 10⁵ into a pass.
- `1LL * a * b`, not `a * b`, when `a` and `b` are `int`.

## More practice

- [Two Sum](/problems/two-sum) — O(n²) is the trap, a hash map is O(n).
- [Contains Duplicate](/problems/contains-duplicate) — sort or hash.
- [Maximum Subarray](/problems/maximum-subarray) — O(n) after spotting O(n²).
- [Sort an Array](/problems/sort-an-array) — O(n log n) or bust.
