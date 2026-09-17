---
title: Floating point — representation, error and printing
minutes: 15
---
A `double` is not a real number. It is a 64-bit pattern that stands for one of a finite set of fractions, and every value between two of them is rounded to the nearer one before you ever get to use it. Almost every floating-point surprise — `0.1 + 0.2 != 0.3`, a total that is off by a cent, a loop that never terminates — is that rounding, seen from a distance. This lesson gives the representation in enough detail to predict the surprises, the comparison idiom that replaces `==`, the printing controls that make output deterministic, and the two cases where the right answer is not a `double` at all.

## The shape of a double

IEEE 754 binary64 spends its 64 bits as 1 sign bit, 11 exponent bits and 52 fraction bits; a hidden leading 1 makes 53 bits of precision. The value is ±1.*fraction* × 2^exponent. `float` (binary32) has 1, 8 and 23 bits for 24 bits of precision, and `long double` on this platform is the 80-bit x87 format with 64. Since 2⁵³ ≈ 9 × 10¹⁵, a `double` carries between 15 and 17 significant decimal digits: `std::numeric_limits<double>::digits10` is 15 (any 15-digit decimal survives a round trip) and `max_digits10` is 17 (the digits needed to print a double so that it reads back exactly). `float` gives 6 and 9.

```cpp
#include <bit>
std::uint32_t bits = std::bit_cast<std::uint32_t>(1.0f);     // 0x3F800000
std::cout << std::format("{:032b}\n", bits);                 // 0 01111111 00000000000000000000000
```

`std::bit_cast` (C++20) copies the bytes of one value into another type of the same size; it is the well-defined way to look at a float's bits.

## Representation error

Only fractions whose denominator is a power of two are exact: 0.5, 0.25, 0.375, 3.75. Everything else is rounded. The literal `0.1` is stored as 0.1000000000000000055511151231257827…, `0.2` is a little above 0.2 as well, and their sum rounds to 0.3000000000000000444, while the literal `0.3` rounds to 0.2999999999999999889. So:

```cpp
std::cout << (0.1 + 0.2 == 0.3) << '\n';                   // 0
std::cout << 0.1 + 0.2 << '\n';                             // 0.3        (6 significant digits hide it)
std::cout << std::setprecision(17) << 0.1 + 0.2 << '\n';    // 0.30000000000000004
```

The default stream precision prints 6 significant digits, which is why the error is invisible until you look for it. Integers up to 2⁵³ are exact, so a `double` is a fine container for a whole number that size — and a terrible one beyond it.

## Comparing: a tolerance, not `==`

```cpp
#include <cmath>
bool nearlyEqual(double a, double b, double relTol = 1e-9, double absTol = 1e-12) {
    double scale = std::max(std::fabs(a), std::fabs(b));
    return std::fabs(a - b) <= std::max(relTol * scale, absTol);
}
```

A *relative* tolerance scales with the magnitude — 1 part in 10⁹ is the right question for both 3.0 and 3 × 10¹² — but it collapses to nothing near zero, which is what the *absolute* term is for. `std::numeric_limits<double>::epsilon()` (2.22 × 10⁻¹⁶) is the gap between 1.0 and the next double, not a general tolerance: near 10⁶ the gap is already 1.16 × 10⁻¹⁰, so comparing values that size against `epsilon` is the same as `==`. The same rounding is why `for (double x = 0; x != 1.0; x += 0.1)` never terminates: count in integers and scale, `for (int i = 0; i <= 10; ++i) { double x = i / 10.0; … }`.

## Big integers and absorption

Beyond 2⁵³ = 9 007 199 254 740 992 doubles are spaced two apart, so `9007199254740993.0` prints as …992 and `1e16 + 1.0 == 1e16` is true: the 1 is *absorbed*. `float` loses whole numbers at 2²⁴ = 16 777 216 — `16777216.0f + 1.0f == 16777216.0f`. Never keep an id, a count or a currency amount in a floating type.

## Accumulation order

```cpp
float total = 0.0f;
for (int i = 0; i < 1'000'000; ++i) total += 0.1f;
std::cout << std::fixed << std::setprecision(1) << total << '\n';   // 100958.3, not 100000.0
```

Every addition rounds, and once `total` is large each 0.1 loses most of its bits before it is added. Rules that follow: sum in `double` even when the inputs are `float`; add small values before large ones; for serious work use compensated (Kahan) summation, or a `long double` accumulator, which on this platform has 11 more bits than `double`. Ten additions of `0.1` in `double` give 0.99999999999999989 — wrong, but wrong by 10⁻¹⁶ rather than 10³.

## Printing deterministically

The default `std::cout` format is "6 significant digits, scientific when the exponent gets large", which is not what a judge or a user wants:

```cpp
std::cout << 1234567.0 << ' ' << 1e6 << ' ' << 2.50 << '\n';                 // 1.23457e+06 1e+06 2.5
std::cout << std::setprecision(3) << 1234.5678 << '\n';                       // 1.23e+03  (3 SIGNIFICANT digits)
std::cout << std::fixed << std::setprecision(2) << 1e6 << ' ' << 1.0 / 3 << '\n';   // 1000000.00 0.33
std::cout << std::format("{:.2f} {:.3e} {}\n", 2.5, 1234.5, 0.1 + 0.2);      // 2.50 1.234e+03 0.30000000000000004
```

`std::fixed` makes the precision mean *decimals* and, like every stream manipulator, sticks until changed; `std::defaultfloat` restores the default. `std::format` sets the precision per placeholder: `{:.2f}` fixed, `{:.3e}` scientific, `{:g}` general. A bare `{}` prints the *shortest* text that reads back to the same double — `0.30000000000000004`, and `1e+05` for `100000.0` — so judged output always carries an explicit precision.

The printed digit is decided on the exact stored value. `2.675` is stored just below 2.675, so `{:.2f}` prints `2.67`; a genuine tie such as `0.125` (exactly representable) goes to the even digit, `0.12`. This is why money should not be a `double` — the fix is at the end of the lesson.

## Rounding functions

| Call | Result | Rule |
| --- | --- | --- |
| `std::round(2.5)` / `std::round(-2.5)` | `3` / `-3` | half away from zero |
| `std::floor(-2.5)` | `-3` | toward −∞ |
| `std::ceil(-2.5)` | `-2` | toward +∞ |
| `std::trunc(-2.5)` | `-2` | toward zero |
| `static_cast<int>(-2.5)` | `-2` | toward zero; undefined if out of range |
| `std::lround(2.5)` | `3L` | `round`, returned as `long` |

All live in `<cmath>` and, except `lround`/`llround`, return a `double` — `std::round(2.5)` prints `3`, but it is `3.0`.

## NaN and infinity

`1.0 / 0.0` is `inf` (floating division by zero is *defined*; integer division by zero is not), and `0.0 / 0.0` or `std::sqrt(-1.0)` is NaN, "not a number". NaN compares false with everything, including itself, so `x != x` is the classic test and `std::isnan(x)`, `std::isinf(x)` and `std::isfinite(x)` are the readable ones. A NaN silently poisons every calculation it touches, and printing one gives `nan` or `-nan` depending on a sign bit you did not choose — test for it, never print it. Negative zero exists too: `-0.0 == 0.0` is true, but it prints as `-0`.

## When the answer is not a `double`

`long double` buys headroom on x86-64 — 18 significant digits, sums of a million doubles without visible drift — at the cost of portability (on MSVC it is just `double`). When the values are exact by nature, use integers: money in `long long` cents, time in integer nanoseconds, coordinates in integer micro-degrees. The arithmetic is exact, the comparisons are `==`, and the output is assembled from integers:

```cpp
long long cents = 1725;
std::cout << std::format("{}.{:02}\n", cents / 100, cents % 100);   // 17.25
```

## Pitfalls

- `==` on computed doubles; `std::setprecision` without `std::fixed` (significant digits, not decimals).
- `float` accumulators and `float` in general — `double` costs nothing extra.
- A `double` holding an id or a count above 2⁵³, or a `float` above 2²⁴.
- Printing a NaN, or a value the default format will show in scientific notation.
- Rounding money in a `double` and being surprised by `2.67`.

## Key takeaways

- A `double` has 53 bits of precision, 15–17 decimal digits; only dyadic fractions are exact, so `0.1 + 0.2 != 0.3`.
- Compare with a relative tolerance plus an absolute floor; `epsilon()` is the spacing at 1.0, not a tolerance.
- Whole numbers are exact up to 2⁵³ (`float`: 2²⁴); beyond that small addends are absorbed. Sum small to large, in `double` or `long double`.
- Always print with an explicit precision: `std::fixed << std::setprecision(2)` or `std::format("{:.2f}")`; ties round on the exact stored value.
- NaN is unequal to itself and must be tested, not printed; exact quantities such as money belong in `long long` cents.
