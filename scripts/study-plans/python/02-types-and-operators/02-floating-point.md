---
title: Floating point — why 0.1 + 0.2 is not 0.3, and what to do about it
minutes: 14
---
A Python `float` is an IEEE 754 double: 64 bits, of which 53 are the significand, giving about 15–17 significant decimal digits. Every language with doubles has the same behaviour, but Python makes it more visible than most because `print` shows the *shortest decimal that round-trips to the same double* rather than rounding to six places the way C's `printf("%f")` does. `0.1 + 0.2` therefore prints `0.30000000000000004` and a beginner concludes Python cannot add. This lesson explains the representation once, gives the three rules for comparing and printing floats, and names the two exact alternatives for the cases — money, mostly — where approximation is not acceptable.

## Representation error

A double stores a value as a sign, a 53-bit binary fraction and a power of two. Numbers that are sums of powers of two — `0.5`, `0.25`, `3.75`, every integer below 2⁵³ — are exact. `0.1` is not: in binary it is `0.0001100110011…` repeating, and the nearest double is `0.1000000000000000055511151231257827…`. `0.2` and `0.3` are likewise slightly off, and the sum of the two rounded inputs is not the same double as the rounded `0.3`:

```python
print(0.1 + 0.2 == 0.3)          # False
print(0.1 + 0.2)                 # 0.30000000000000004
print(f"{0.1:.20f}")             # 0.10000000000000000555
print((0.1).hex())               # 0x1.999999999999ap-4
```

The error is about one part in 10¹⁶ per operation. It becomes visible when it is *compared* (`==`), *accumulated* (a million additions), or *magnified* (subtracting two nearly equal numbers). It never becomes visible if you format to a sensible number of decimals.

## Rule 1: never compare floats with ==

Test closeness instead. `math.isclose(a, b)` uses a relative tolerance of 10⁻⁹ by default and accepts an absolute one for comparisons near zero:

```python
import math
print(math.isclose(0.1 + 0.2, 0.3))                     # True
print(math.isclose(1e-10, 0.0, abs_tol=1e-9))           # True — relative tolerance alone fails at zero
```

Or avoid floats altogether where the quantities are really integers: compare `3 * x == y` rather than `x == y / 3`, work in cents rather than in pounds.

## Rule 2: format on output

`print(x)` shows the shortest round-tripping decimal, which is exact but ugly. Every judged exercise expects a fixed precision, and `f"{x:.2f}"` rounds *correctly* to the nearest representable two-decimal value:

```python
x = 2 / 3
print(x)             # 0.6666666666666666
print(f"{x:.2f}")    # 0.67
print(f"{x:.0f}")    # 1
print(f"{1e21:.0f}") # 1000000000000000000000
print(f"{x:e}")      # 6.666667e-01
print(f"{x:g}")      # 0.666667
```

`round(x, 2)` returns a float that is again only *nearly* `0.67`; use it for arithmetic, use the format spec for display. One trap: `.2f` rounds the *binary* value, so `f"{2.675:.2f}"` is `2.67`, because 2.675 is stored as 2.67499999…; if a value must round half up at two decimals, it must not be a float.

## Rule 3: accumulate carefully

Adding many floats accumulates error, and the order matters. `sum` adds left to right; `math.fsum` tracks the lost bits and returns the correctly rounded sum:

```python
import math
xs = [0.1] * 10
print(sum(xs))          # 0.9999999999999999
print(math.fsum(xs))    # 1.0
```

For means and statistics, `statistics.fmean` and `statistics.mean` are similarly careful. When the sum is of decimal strings — prices, percentages — the better answer is not a cleverer float sum but no floats at all.

## Special values

`float("inf")`, `float("-inf")` and `float("nan")` exist (`math.inf`, `math.nan`). Infinity compares greater than everything and is a useful initial value for a running minimum. NaN compares unequal to *everything, including itself*: `nan == nan` is `False`, so `x != x` is the classic NaN test and `math.isnan` is the readable one. Division by zero on floats raises `ZeroDivisionError` in Python (it does not produce infinity as in C), and overflow in `**` raises `OverflowError`, while `1e308 * 10` gives `inf`.

## When you need exactness

**`decimal.Decimal`** is decimal floating point with a configurable precision (28 significant digits by default) and explicit rounding modes. Construct it from a *string* — `Decimal("0.1")` is exactly a tenth, while `Decimal(0.1)` faithfully copies the float's error:

```python
from decimal import Decimal, ROUND_HALF_UP
total = Decimal("0.10") + Decimal("0.20")
print(total)                                              # 0.30
print(Decimal("2.675").quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))   # 2.68
```

`quantize` rounds to a given number of places with the rounding you name — the correct tool for money. **`fractions.Fraction`** is exact rational arithmetic: `Fraction(1, 3) + Fraction(1, 6)` is `Fraction(1, 2)`, and `Fraction("0.1")` is one tenth. It is the right type for probabilities and ratios that must be exact, and slow enough that it is never the default.

The other exact tool is the plain `int`: represent money as integer cents, percentages as basis points, and convert only at the edges. `int(s.replace(".", ""))` for a two-decimal price string, `f"{cents // 100}.{cents % 100:02d}"` to print it back. Most "floating-point bugs" in real code are money held in floats, and this is the fix.

## Pitfalls

- `x == 0.3` for a computed `x`. Use `math.isclose` or restructure.
- Printing a raw float when two decimals were asked for.
- `round(2.675, 2)` expecting `2.68`. The binary value is below the half.
- `Decimal(0.1)` instead of `Decimal("0.1")`.
- `sum` of a long list of decimals when `math.fsum` or integer cents would be exact.
- Using `float` for currency.

## Key takeaways

- A `float` is a binary double; most decimal fractions are approximations and `print` shows the exact shortest form.
- Never `==` on computed floats; `math.isclose` with an `abs_tol` near zero.
- Format for display with `:.2f`; `round` is for arithmetic and is still a float.
- `math.fsum` sums accurately; NaN is unequal to itself; float division by zero raises.
- `Decimal` from strings with `quantize` for money, `Fraction` for exact ratios, integer cents when possible.
