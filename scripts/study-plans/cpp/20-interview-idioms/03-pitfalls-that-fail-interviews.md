---
title: The pitfalls that fail interviews
minutes: 14
---
Most rejected C++ solutions are not wrong algorithms. They are right algorithms with an `int` that overflowed, a `size_t` that wrapped, a `%` that went negative, a `map[]` that inserted, or an iterator that was used after the container moved. Interviewers know the list; this lesson is that list, each item with the one-line fix, organised so you can run it as a review pass over your own code before you say "done". Nothing here is new — every item was taught earlier in the track, and most of them are undefined behaviour, which in C++ means the program may do anything, including appear to work on your machine — but seeing them together is what turns knowledge into a reflex.

## Arithmetic

1. **`int` products and sums.** `a[i] * a[j]` with values to 10⁵ is 10¹⁰; a sum of 10⁵ such values is 10¹⁰; `n * (n + 1) / 2` at 10⁵ is 5 × 10⁹. Signed overflow is undefined behaviour, and at `-O2` the optimiser may delete the check you wrote to detect it. Fix: `long long` for anything that accumulates or multiplies, and widen *before* the operation — `1LL * a * b`, not `(long long)(a * b)`, which casts a value that already overflowed.
2. **`%` on negatives.** `-7 % 3` is `-1`: the remainder takes the dividend's sign, and `/` truncates toward zero (`-7 / 2` is `-3`). Circular indexes, hashing and modular arithmetic need `((a % m) + m) % m`, which is always in `[0, m)`.
3. **`1 << 31`.** With a 32-bit `int` the bit lands in the sign position: undefined behaviour before C++20, and since C++20 defined to wrap to `INT_MIN` — either way not 2³¹, and `1 << 32` is undefined in every standard. The literal's type sets the width: `1LL << k` for a 64-bit power of two, `1u << 31` for a 32-bit mask.
4. **`pow` for integers.** `std::pow` returns a `double`; the standard promises no exactness for integer arguments, some libms return 99.999… for `pow(10, 2)`, and past 2⁵³ a `double` cannot hold the answer. An integer loop, or `1LL << k` for powers of two, or fast exponentiation with a modulus.
5. **Doubles compared with `==`.** `0.1 + 0.2 == 0.3` is `false`. Compare within a tolerance (`std::abs(a - b) < 1e-9`), or avoid doubles: money in `long long` cents, fractions as numerator and denominator, geometry with squared distances.
6. **Integer division where a fraction was meant.** `7 / 2` is `3`; `1 / 2 * x` is `0`. One operand must be a `double` before the division, not after.

## Unsigned arithmetic

7. **`size()` compared with an `int`.** `v.size()` is `size_t`, which is unsigned. In `i < v.size() - 1` on an empty vector, `size() - 1` wraps to 2⁶⁴ − 1 and the loop runs into memory it does not own. Write `i + 1 < v.size()`, or guard the empty case first. `-Wall` warns on signed/unsigned comparisons; the warning is right often enough to keep.
8. **`size() - t` when `t` may exceed the size.** Same wrap. Clamp first: `std::min(t, v.size())`.
9. **The unsigned countdown.** `for (size_t i = n - 1; i >= 0; --i)` never ends (Module 3). Count with `i-- > 0`, or index `v[i - 1]` with `i > 0`.
10. **Mixed signed/unsigned comparison.** `-1 < v.size()` is `false`: the `-1` converts to a huge unsigned value. Cast the size to `long long` or keep the signed value on both sides.

## Containers

11. **`map[]` in a lookup.** `if (m[key] > 0)` inserts `key` with `0`. Reads use `find`, `count` or `contains` (C++20); a `const` map has no `operator[]` for exactly this reason.
12. **Erasing while iterating.** `for (auto it = v.begin(); it != v.end(); ++it) if (…) v.erase(it);` increments an invalidated iterator: undefined behaviour. Write `it = v.erase(it)` in the erasing branch (and do not increment), or `std::erase_if(v, pred)` in one call.
13. **References into a vector that then grows.** `int& first = v[0]; v.push_back(…); use(first);` — the push may reallocate, and `first` refers to freed memory. Take a copy, or index after the push.
14. **`std::vector<bool>`.** A packed specialisation whose `operator[]` returns a proxy, not `bool&`: `auto& b = v[0]` fails, `&v[0]` is not a `bool*`, and the element cannot be shared between threads. `std::vector<char>` or `std::deque<bool>` when you need real elements.
15. **Iteration order of `unordered_map`.** Unspecified and different between implementations and runs; never let it reach the output. Sort the keys, or use `std::map`.
16. **Dereferencing `end()`.** `*std::max_element(v.begin(), v.end())` on an empty vector, `*m.find(k)` when the key is absent, `v.back()` on an empty vector: undefined behaviour every time. Check emptiness and the `end()` result.

## Language

17. **Uninitialised locals.** `int best; for (…) best = std::max(best, x);` reads an indeterminate value — undefined behaviour that happens to print zero on some runs. Brace-initialise: `int best{};`, `long long sum = 0;`, or start from the first element.
18. **Recursion depth.** The judge's stack takes 10⁵ frames comfortably (measured for this track); a DFS on a path of 10⁶ nodes or a naïve recursive sum of 10⁷ does not. Convert to iteration with an explicit `std::vector` stack when the depth is the input size.
19. **`std::endl` in a loop.** A flush per line: measured about 500 ms against about 40 ms for 10⁶ lines on the lab. `'\n'`.
20. **`auto` copies in range-for.** `for (auto s : names)` copies every string; `for (auto& p : pairs) p.second++` modifies in place while `for (auto p : pairs)` modifies copies and changes nothing. `const auto&` to read, `auto&` to modify.
21. **`std::string_view` into a temporary.** `std::string_view sv = s + "x";` — the temporary dies at the semicolon and `sv` dangles (Module 5).
22. **A path without `return`.** A non-`void` function that falls off the end is undefined behaviour, not a default value; `-Wall` warns "control reaches end of non-void function". Every branch returns.
23. **Comparator that is not a strict weak ordering.** `<=` instead of `<`, or `a.x < b.x || a.y < b.y`: `std::sort` may crash or loop. Use `std::tie`.

## The review pass

Before submitting, scan once per heading. *Arithmetic:* any `int` that multiplies or accumulates? Any `%` on a value that can be negative? A shift that should be `1LL`? *Unsigned:* any `size() - k`, any `int` compared with `size()`? *Containers:* a `map[]` in a condition? An `erase` inside a loop? A reference held across a `push_back`? *Language:* every local initialised, every function returning on every path, `'\n'` not `endl`, debug output on `cerr`? Thirty seconds, and it catches most "correct but rejected" submissions. In an interview, do it aloud — "the sum is at most 10¹⁴, so `long long`; the map lookup uses `find` so it does not insert" — that visible carefulness is what the interviewer is scoring.

## Interview angle

- *"Why is `int` overflow worse in C++ than in Java?"* Java wraps; C++ calls it undefined behaviour, so the optimiser may remove the overflow check or the loop that contains it.
- *"What does `-7 % 3` give, and how do you get `2`?"* `-1`; `((a % m) + m) % m`.
- *"Why did the loop over an empty vector crash?"* `size() - 1` is unsigned and wrapped.
- *"How would you remove elements from a vector while iterating?"* `it = v.erase(it)`, or the erase–remove idiom, or `std::erase_if`.

## Key takeaways

- Widen before you multiply (`1LL * a * b`); `long long` for sums and products; `%` on negatives needs normalising; `1 << 31` is not 2³¹.
- `size()` is unsigned: never subtract from it without a guard, never compare it with a negative.
- `map[]` inserts, `erase` invalidates, `push_back` may move everything, `vector<bool>` is not a vector of `bool`.
- Initialise every local, return on every path, `'\n'` not `endl`, iterate a `vector` by `const auto&`.
- Run the review pass aloud; it is the cheapest thirty seconds in the interview.
