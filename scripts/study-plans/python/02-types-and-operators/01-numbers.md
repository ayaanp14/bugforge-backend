---
title: Numbers — int, float and the arithmetic that surprises
minutes: 13
seo-title: Python Integer Division, Modulo and Big Integers Explained
description: Python ints never overflow, / always returns a float, // floors toward negative infinity and % takes the divisor's sign. Plus pow, round and math tools.
question: What is the difference between `/` and `//` in Python?
answer: In Python, `/` is true division and always returns a `float` — `7 / 2` is `3.5` and `6 / 3` is `2.0` — while `//` is floor division, which rounds toward negative infinity: `7 // 2` is `3` and `-7 // 2` is `-4`. On two ints `//` returns an int, so use it for indexes and counts; `%` gives the matching remainder, with the divisor's sign.
q: Does Python have a maximum integer size?
a: No. Python's `int` is arbitrary-precision: the object grows as the value needs, so `2 ** 64` and `10 ** 100` are exact and nothing overflows; huge values are only slower. `sys.maxsize` is the largest size a container can have, not a limit on `int`.
q: How does modulo work with negative numbers in Python?
a: Python's `%` takes the sign of the divisor, because `//` floors: `-7 % 2` is `1` and `7 % -2` is `-1`. The identity `a == b * (a // b) + a % b` always holds, so `x % n` for a positive `n` is always between 0 and `n - 1`, which makes wrapping an index simple.
q: Why does round(2.5) return 2 in Python?
a: Python's `round` uses round half to even, also called banker's rounding: a value exactly halfway rounds to the nearest even integer, so `round(2.5)` is `2` and `round(3.5)` is `4`. This avoids the upward bias of always rounding halves up. `int()` instead truncates toward zero.
q: How do I calculate a power modulo a number in Python?
a: Call `pow(base, exp, mod)`, which computes `base ** exp % mod` by modular exponentiation without building the full power. `pow(2, 10 ** 6, 10 ** 9 + 7)` finishes instantly, whereas `2 ** 10 ** 6 % m` first builds a number of about 300 000 digits.
q: How do I check if a number is a perfect square in Python?
a: Use `math.isqrt(n)`, the exact integer square root: `math.isqrt(n) ** 2 == n` is true only for perfect squares. `int(math.sqrt(n))` goes through a float and can give the wrong answer for large `n`.
---
Python has three numeric types and one of them is unlike anything in C or Java: `int` has no upper limit. `2 ** 1000` is an ordinary integer, factorials of hundreds do not overflow, and the questions that fill C++ interviews — "does this product fit in 64 bits?" — simply do not arise. What does arise is the *semantics* of division and remainder, which Python defines carefully and differently from most languages, and the difference between the exact `int` and the approximate `float`. This lesson settles the integer side; the next one is about floating point.

## The integer type

An `int` literal is a run of digits, optionally with underscores for readability and a prefix for another base:

```python
million = 1_000_000
mask = 0b1010_1010     # binary
perm = 0o755           # octal
colour = 0xFF_80_00    # hexadecimal
print(million, mask, perm, colour)   # 1000000 170 493 16744448
```

Integers are arbitrary-precision: the object grows as the value needs. `2 ** 64` is `18446744073709551616`, `10 ** 100` has a hundred zeros, and arithmetic on them is exact — slower than machine integers (roughly proportional to the number of digits), but correct. `sys.maxsize` exists (the largest size a container can have, 2⁶³ − 1 on 64-bit builds), but it is not a limit on `int`.

## Division, three ways

| Expression | Result | Type | Rule |
| --- | --- | --- | --- |
| `7 / 2` | `3.5` | `float` | true division, always a float |
| `7 // 2` | `3` | `int` | floor division: round **toward negative infinity** |
| `7 % 2` | `1` | `int` | remainder, with the **sign of the divisor** |
| `-7 // 2` | `-4` | `int` | floor of −3.5 is −4 |
| `-7 % 2` | `1` | `int` | −7 = 2 × (−4) + 1 |
| `7 % -2` | `-1` | `int` | 7 = (−2) × (−4) + (−1) |

Two things here differ from C, Java and JavaScript. `/` on two integers is a `float` — `6 / 3` is `2.0`, not `2` — so an index or a count computed with `/` is a bug; use `//`. And `//` floors rather than truncating, which makes `%` take the divisor's sign. The invariant `a == b * (a // b) + a % b` holds for every sign combination, and the practical payoff is that `x % n` for positive `n` is always in `0 … n-1`: wrapping an index with `(i - 1) % len(xs)` gives `len(xs) - 1` for `i == 0`, exactly the "previous element, cyclically" that a truncating language needs a special case for. `divmod(a, b)` returns both `(a // b, a % b)` in one call.

## Powers and the rest

`**` is exponentiation and binds tighter than unary minus: `-2 ** 2` is `-4` (it parses as `-(2 ** 2)`); write `(-2) ** 2` for 4. `2 ** -1` is `0.5` — a negative exponent makes a float. `pow(base, exp, mod)` computes `base ** exp % mod` efficiently by modular exponentiation and is the right tool whenever a result is wanted modulo something: `pow(2, 10 ** 6, 10 ** 9 + 7)` finishes instantly where `2 ** 10 ** 6 % m` would first build a 300 000-digit number.

`abs(x)`, `min`, `max`, `sum` work as expected; `round(x, n)` rounds to `n` decimals and, with no `n`, returns an `int`. Its tie rule surprises people: `round(2.5)` is `2` and `round(3.5)` is `4` — **round half to even** ("banker's rounding"), which avoids the upward bias of always rounding halves up. `int(x)` on a float truncates toward zero (`int(-3.7)` is `-3`); `math.floor` and `math.ceil` go down and up and return ints.

The `math` module supplies the integer functions interviews use — `math.gcd(a, b)`, `math.lcm(a, b)`, `math.isqrt(n)` (exact integer square root, never a float), `math.comb(n, k)`, `math.perm(n, k)`, `math.factorial(n)` — and `math.sqrt`, `math.log`, `math.log2`, `math.log10` return floats. `math.isqrt(n) ** 2 == n` is the exact test for a perfect square; `int(math.sqrt(n))` is not, for large `n`.

## Mixed arithmetic

Arithmetic between an `int` and a `float` produces a `float`; the int is converted first. `3 + 0.5` is `3.5`; `10 * 1.0` is `10.0`. A `bool` is a subtype of `int` (`True` is 1), so `True + True` is `2` and `sum(flags)` counts true values — an idiom, not a trick. `complex` completes the tower: `1j` is the imaginary unit, `(1 + 2j) * (3 - 1j)` is `(5+5j)`, and `abs` of a complex number is its magnitude. Between numbers Python converts up the tower `int → float → complex` and never the other way without an explicit call.

## Reading and printing numbers

`int("42")` parses decimal digits with optional sign and surrounding whitespace, and accepts underscores; `int("42", 16)` parses in another base; `int("0x2a", 0)` picks the base from the prefix. `int("3.0")` is a `ValueError` — parse the float and truncate if that is what you mean. `str(n)` and `f"{n}"` print in decimal; `bin`, `oct`, `hex` print with prefixes (`bin(10)` is `'0b1010'`); the format specs `{n:b}`, `{n:o}`, `{n:x}`, `{n:08b}` print without. Digit counting is `len(str(n))` for non-negative `n`; `bin(n).count("1")` or `n.bit_count()` (3.10) counts set bits; `n.bit_length()` is the number of bits needed.

## Pitfalls

- `len(xs) / 2` as an index. It is a float; `xs[len(xs) / 2]` is a `TypeError`. Use `//`.
- Expecting `-7 // 2` to be `-3` and `-7 % 2` to be `-1`. Python floors.
- `-2 ** 2` meaning 4. It is −4.
- `round(2.5)` being 3. Half-to-even gives 2.
- `int(math.sqrt(n))` for a perfect-square test on large numbers. Use `math.isqrt`.
- Building `a ** b` and then `% m` for large exponents. `pow(a, b, m)`.

## Key takeaways

- `int` is arbitrary-precision; overflow does not exist, only slowness for huge values.
- `/` is always a float; `//` floors toward negative infinity; `%` takes the divisor's sign; `divmod` gives both.
- `**` binds tighter than unary minus; `pow(a, b, m)` is modular exponentiation.
- `round` is half-to-even; `int()` truncates; `math.floor`/`ceil` round down/up to ints.
- `math.gcd`, `lcm`, `isqrt`, `comb`, `factorial` are the integer tools; `bin`/`hex` and the `b`/`x` format specs print other bases.
