---
title: math, statistics, fractions, decimal and random
minutes: 14
---
The numeric modules divide the work cleanly: `math` for functions on ints and floats, `statistics` for descriptive statistics done correctly, `fractions` and `decimal` for the two kinds of exact arithmetic, `random` for reproducible pseudo-randomness and `secrets` for the unpredictable kind. This lesson goes through each with the functions that matter, the precision rules that decide which to use, and the two facts about `random` that judged and tested programs depend on: seeding makes it deterministic, and the module-level functions share one global generator.

## math

```python
import math

math.sqrt(2), math.isqrt(17)          # 1.4142135623730951, 4  — float root, exact integer root
math.gcd(12, 18), math.lcm(4, 6)      # 6, 12  (gcd takes any number of arguments since 3.9)
math.comb(5, 2), math.perm(5, 2)      # 10, 20
math.factorial(20)                    # 2432902008176640000 — exact int
math.floor(-2.5), math.ceil(-2.5)     # -3, -2  — ints
math.trunc(-2.5)                      # -2 — toward zero, like int()
math.log(100, 10), math.log2(1024), math.log10(1000), math.exp(1)
math.prod([2, 3, 4])                  # 24 — the multiplicative sum
math.fsum([0.1] * 10)                 # 1.0 — accurate float summation
math.hypot(3, 4), math.dist((0, 0), (3, 4))   # 5.0, 5.0
math.isclose(0.1 + 0.2, 0.3)          # True
math.pi, math.e, math.tau, math.inf, math.nan
math.radians(180), math.degrees(math.pi), math.sin, math.cos, math.atan2(y, x)
```

Integer functions (`isqrt`, `gcd`, `lcm`, `comb`, `perm`, `factorial`) return exact ints of any size; the float functions return floats and raise `ValueError` on domain errors (`math.sqrt(-1)`) and `OverflowError` on results too large. `math.pow` is always float — use `**` for integer powers. `math.isqrt(n) ** 2 == n` is the perfect-square test; `math.comb` replaces the factorial formula and never overflows.

## statistics

```python
import statistics as st

st.mean([1, 2, 3, 4])            # 2.5
st.fmean([1, 2, 3, 4])           # 2.5 as a float, faster
st.median([3, 1, 2])             # 2
st.median([1, 2, 3, 4])          # 2.5 — the mean of the middle two
st.mode("aabbbc")                # 'b'
st.multimode([1, 1, 2, 2])       # [1, 2]
st.stdev([2, 4, 4, 4, 5, 5, 7, 9])    # sample standard deviation (n − 1)
st.pstdev(...)                   # population standard deviation (n)
st.variance, st.pvariance
st.quantiles([1, 2, 3, 4, 5], n=4)    # quartile cut points
```

`mean` of ints may return a `Fraction`-exact result converted to float; `median` of an even count averages the two middle values; `stdev` is the sample form — the one with `n − 1` — and `pstdev` the population form; interviews ask which is which. All raise `StatisticsError` on empty input. These functions are correct on the edge cases a hand-written loop misses (mixed `int`/`Fraction`/`Decimal` input, catastrophic cancellation in variance).

## fractions

```python
from fractions import Fraction

Fraction(1, 3) + Fraction(1, 6)       # Fraction(1, 2)
Fraction("0.1") + Fraction("0.2")     # Fraction(3, 10) — exact
Fraction(0.1)                         # Fraction(3602879701896397, 36028797018963968) — the float's true value
Fraction(3, 4).numerator, Fraction(3, 4).denominator
float(Fraction(1, 3)), round(Fraction(7, 3))       # 0.333…, 2
Fraction(5, 10)                       # Fraction(1, 2) — always reduced
Fraction(1, 3).limit_denominator(100) # the closest fraction with denominator ≤ 100
```

Exact rational arithmetic: sums of fractions are fractions, comparisons are exact, and probability and ratio computations come out as `3/8` rather than `0.375000001`. Construct from strings or int pairs, not floats. It is slow relative to floats and is used where exactness matters more than speed.

## decimal

```python
from decimal import Decimal, getcontext, ROUND_HALF_UP, ROUND_HALF_EVEN

getcontext().prec = 28                        # significant digits (default 28)
Decimal("0.1") + Decimal("0.2")               # Decimal('0.3')
Decimal("1") / Decimal("3")                   # Decimal('0.3333333333333333333333333333')
Decimal("2.675").quantize(Decimal("0.01"))    # Decimal('2.68') — ROUND_HALF_EVEN by default: 2.68 (even)
Decimal("2.665").quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)   # Decimal('2.67')
Decimal("1.10") + Decimal("2.20")             # Decimal('3.30') — trailing zeros are significant
Decimal("100").sqrt(), Decimal("2").ln()
```

Decimal floating point with a *context* (precision and rounding mode) — the arithmetic finance and invoicing require. `quantize` rounds to a pattern (`Decimal("0.01")` for cents) with a stated rounding rule; the default is banker's rounding, and `ROUND_HALF_UP` is what accounting usually wants. `localcontext()` sets precision for a block. Construct from strings; `Decimal(0.1)` carries the float's error.

## random

```python
import random

rng = random.Random(42)              # a private generator with a fixed seed — reproducible
rng.random()                         # a float in [0, 1)
rng.randint(1, 6)                    # inclusive both ends
rng.randrange(0, 10, 2)              # like range
rng.choice(["a", "b", "c"])
rng.choices(items, weights=[5, 1], k=3)   # with replacement, weighted
rng.sample(items, k=3)               # without replacement
rng.shuffle(xs)                      # in place
rng.uniform(1.5, 2.5), rng.gauss(0, 1)
random.seed(42); random.randint(1, 6)     # the module-level functions share ONE global generator
```

Two rules. **Seed it and it is deterministic**: the same seed gives the same sequence on every run and every platform for a given algorithm version, which is what tests and judged exercises need. **Prefer a `Random(seed)` instance** to the module functions: it cannot be disturbed by another part of the program calling `random.random()`. `random` is a Mersenne Twister — statistically fine, cryptographically useless: for tokens, passwords and anything an attacker may guess, `secrets.token_hex(16)`, `secrets.choice`, `secrets.randbelow`.

## Choosing

| Need | Use |
| --- | --- |
| Integer arithmetic, combinatorics, exact roots | `int` and `math`'s integer functions |
| Scientific/geometric computation | `float` and `math` |
| Money, invoices, rounding rules | `Decimal` from strings with `quantize`, or integer cents |
| Ratios and probabilities that must be exact | `Fraction` |
| Descriptive statistics | `statistics` |
| Reproducible randomness | `random.Random(seed)` |
| Security-relevant randomness | `secrets` |

## Pitfalls

- `math.sqrt` for integer roots (`isqrt`); `math.pow` for integer powers (`**`).
- `stdev` where `pstdev` was meant, or the reverse.
- `Decimal(0.1)` and `Fraction(0.1)`.
- `random` for anything security-related.
- Module-level `random.seed` in a library, resetting the caller's generator.
- Expecting `round(2.675, 2)` to give `2.68` — use `Decimal` and `quantize`.

## Key takeaways

- `math`: exact integer functions (`isqrt`, `gcd`, `lcm`, `comb`, `factorial`), float functions that raise on domain errors, `fsum`, `isclose`, `prod`.
- `statistics`: `mean`/`fmean`, `median`, `mode`, sample `stdev` versus population `pstdev`, `quantiles`; empty input raises.
- `Fraction` for exact ratios, `Decimal` with `quantize` and a rounding mode for money — both built from strings.
- `random.Random(seed)` is reproducible and isolated; the module functions share one global state; `secrets` for anything guessable.
- Pick the numeric type by the guarantee you need, not by habit.
