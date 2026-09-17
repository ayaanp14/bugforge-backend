---
title: Integer arithmetic and bits
minutes: 15
---
Integer arithmetic in C++ compiles to the CPU's own add, multiply and shift instructions and nothing more: no range check, no promotion to a big integer, no exception. That is where the speed comes from, and it is why the rules at the edges are yours to know. Signed and unsigned types behave differently when a result does not fit, small types quietly become `int` before any arithmetic happens, division rounds in a definite direction, and the shift operators have holes the standard refuses to fill. This lesson states each rule, shows how to detect overflow without committing it, and covers the bit operators and the C++20 `<bit>` header that make masks and flags readable.

## Two's complement

Since C++20 signed integers are two's complement by definition: an n-bit type holds −2ⁿ⁻¹ … 2ⁿ⁻¹ − 1, the top bit is the sign, and negating a value is "invert every bit, add one". The range is asymmetric — one more negative value than positive — so `-x` and `std::abs(x)` have exactly one input that does not fit: `std::numeric_limits<int>::min()`. Every rule below follows from that picture.

## Signed overflow is undefined behaviour

```cpp
int big = std::numeric_limits<int>::max();   // 2147483647
int next = big + 1;                          // undefined behaviour — not "wraps to -2147483648"
```

The hardware would wrap, and an unoptimised build usually shows the wrapped value, but the language says the program has no meaning from that point on. The optimiser takes the promise literally: `if (x + 1 > x)` is folded to `true`, a loop bounded by `i * 2 < n` is rewritten on the assumption that `i * 2` never wrapped, and a check you wrote *after* the overflow is deleted as dead code. Overflow has to be detected **before** it happens, in one of three ways:

```cpp
// 1. Widen: do the arithmetic in a type that cannot overflow, then range-check.
long long wide = static_cast<long long>(a) + b;
bool fits = wide >= std::numeric_limits<int>::min() && wide <= std::numeric_limits<int>::max();

// 2. Compare against the limit first — the textbook form.
bool willOverflow = b > 0 ? a > std::numeric_limits<int>::max() - b
                          : a < std::numeric_limits<int>::min() - b;

// 3. Ask the compiler. GCC and Clang both provide this; the wrapped result is stored either way.
int result;
if (__builtin_add_overflow(a, b, &result)) { /* overflowed; result holds the wrapped value */ }
```

`__builtin_sub_overflow` and `__builtin_mul_overflow` are the siblings, and they work for `long long` too — multiplication is where widening runs out, because the product of two 64-bit values needs 128 bits. C++26 adds `std::add_sat` and friends, which clamp at the limit instead of overflowing; treat that as reading for now.

## Unsigned arithmetic wraps

Unsigned types are defined modulo 2ⁿ: `0u - 1` is 4 294 967 295, `4294967295u + 1` is 0, and neither is an error. That is the behaviour hashes, checksums and wrapping counters want. It is also the behaviour that turns `v.size() - 1` into 18 446 744 073 709 551 615 when the vector is empty, and makes `for (std::size_t i = n - 1; i >= 0; --i)` loop for ever, because an unsigned value is always ≥ 0 (Module 3 has the idioms). Prefer `std::ssize(v)` — C++20, returns a signed count — or `i + 1 < v.size()` over subtracting from a size.

## Integer promotion and the usual arithmetic conversions

No arithmetic is ever done in a type narrower than `int`. `bool`, `char`, `short` and their unsigned forms are **promoted** to `int` first:

```cpp
unsigned char a = 200, b = 100;
auto sum = a + b;      // int 300, not an unsigned char that wrapped to 44
short s = 30000;
int product = s * s;   // 900000000 — computed in int, fits
```

Then the **usual arithmetic conversions** bring two operands to one common type: the wider wins; at equal width the unsigned one wins, so `3u + (-5)` converts `-5` to unsigned and yields 4 294 967 294; a floating operand converts the integer one. The "unsigned wins" rule is what makes `-1 < 1u` false — lesson 4 returns to it.

## Division and remainder

`/` on integers truncates toward zero, `%` gives a remainder with the sign of the dividend, and `(a / b) * b + a % b == a` always holds:

| `a` | `b` | `a / b` | `a % b` |
| --- | --- | --- | --- |
| 7 | 2 | 3 | 1 |
| −7 | 2 | −3 | −1 |
| 7 | −2 | −3 | 1 |
| −7 | −2 | 3 | −1 |

Two cases are undefined: dividing by zero, and `std::numeric_limits<int>::min() / -1`, whose answer does not fit. A negative remainder is rarely what an index or a clock wants; the floor-modulo idiom `((a % m) + m) % m` gives 0 … m − 1 for any `a` and positive `m`.

## The bitwise operators

| Operator | Meaning | With `5` (`101`) and `3` (`011`) |
| --- | --- | --- |
| `a & b` | and | `1` |
| `a \| b` | or | `7` |
| `a ^ b` | exclusive or | `6` |
| `~a` | complement | `~5` is `-6` as `int`, `4294967290` as `unsigned` |
| `a << n` | shift left | `5 << 1` is `10` |
| `a >> n` | shift right | `5 >> 1` is `2` |

Precedence bites: `&` and `|` bind more loosely than `==`, so `x & 1 == 0` parses as `x & (1 == 0)` and is always 0. Parenthesise every bitwise test.

## Shifts and their holes

`x << n` multiplies by 2ⁿ and `x >> n` divides by 2ⁿ. C++20 nailed down two formerly grey cases: left-shifting a signed value is defined modulo 2ⁿ, so `1 << 31` is `-2147483648`; and right-shifting a negative value is arithmetic — the sign bit is copied in, so `-16 >> 2` is `-4`. Still undefined: a shift count that is negative or at least the width of the promoted type. `1 << 32` is undefined; so is `1 << 40` even when the result is assigned to a `long long`, because the `1` is an `int` — write `1LL << 40` or `1ull << 40`. The safe habit is to do bit work on unsigned types of a known width.

## Masks

```cpp
std::uint32_t flags = 0;
flags |= 1u << 3;                                   // set bit 3
flags &= ~(1u << 3);                                // clear bit 3
flags ^= 1u << 3;                                   // toggle bit 3
bool on = (flags >> 3) & 1u;                        // test bit 3
std::uint32_t x = 40;                               // 101000
bool powerOfTwo = x != 0 && (x & (x - 1)) == 0;     // x & (x - 1) clears the lowest set bit
std::uint32_t low = x & (~x + 1u);                  // isolates the lowest set bit
```

Name the bits — `constexpr std::uint32_t kVerbose = 1u << 3;` — and the same lines read as English. Lesson 6 shows the same idea with an enumeration.

## `<bit>` (C++20)

```cpp
#include <bit>
std::popcount(255u)        // 8  — set bits
std::bit_width(255u)       // 8  — bits needed; bit_width(256u) is 9
std::has_single_bit(64u)   // true — exactly one bit set, i.e. a power of two
std::countl_zero(1u)       // 31 — leading zeros in a 32-bit value
std::countr_zero(8u)       // 3  — trailing zeros
std::bit_ceil(17u)         // 32 — next power of two up; bit_floor(17u) is 16
std::rotl(0x80000001u, 1)  // 3  — rotate; the bit that falls off comes back at the other end
```

Every one of them takes an **unsigned** argument — pass an `int` and the call does not compile, which is the header's way of enforcing the rule above. Print a pattern with `std::format("{:b}", x)`, zero-padded with `{:08b}`, and in hex with `{:#x}`.

## Pitfalls

- `int` products: `n * (n + 1) / 2` for `n = 100000` overflows before the division. Compute in `long long`.
- `std::abs(std::numeric_limits<int>::min())` is undefined; so is `-x` for that one value.
- `x & 1 == 0` — precedence. Write `(x & 1) == 0`.
- `1 << 40` in an `int` expression, even when assigned to a `long long`.
- `-7 % 2` is `-1`, so `x % 2 == 1` misses negative odd numbers; test `x % 2 != 0`.

## Key takeaways

- Signed overflow is undefined behaviour and the optimiser assumes it never happens; detect it before it happens by widening, by comparing against `numeric_limits`, or with `__builtin_add_overflow`.
- Unsigned arithmetic wraps modulo 2ⁿ — right for hashes, fatal for `size() - 1`.
- Everything narrower than `int` is promoted to `int`; at equal width the unsigned operand wins.
- `/` truncates toward zero and `%` follows the dividend; `((a % m) + m) % m` for a non-negative result.
- Do bit manipulation on unsigned types; `<bit>` gives `popcount`, `bit_width`, `has_single_bit` and friends; parenthesise every mask test.
