---
title: Floating point — doubles, precision and BigDecimal
minutes: 15
---
`0.1 + 0.2 == 0.3` is `false` in Java, as in every language that uses IEEE 754 binary floating point. This is not a bug and not a Java quirk — it is what happens when you store base-10 fractions in base-2 — but a programmer who does not understand *why* will write money code that loses cents, comparisons that fail randomly, and loops that never terminate. This lesson makes floating point predictable.

## How a `double` stores a number

A `double` is 64 bits: 1 sign bit, 11 exponent bits, 52 fraction bits (plus an implicit leading 1, so 53 bits of precision). The value is `±1.fraction × 2^exponent`. Consequences:

- It can represent exactly any number of the form `m × 2^e` with `m` fitting in 53 bits: 0.5, 0.25, 3.0, 1 099 511 627 776, and every integer up to 2⁵³ (about 9 × 10¹⁵).
- It **cannot** represent 0.1, 0.2 or 0.3 exactly, because they are not sums of powers of two. `0.1` is stored as `0.1000000000000000055511151231257827…`.
- 15–17 significant decimal digits survive a round trip; beyond that, digits are noise.

```java
System.out.println(0.1 + 0.2);            // 0.30000000000000004
System.out.println(0.1 + 0.2 == 0.3);     // false
System.out.println(1.0 / 3);              // 0.3333333333333333
System.out.println((0.1 + 0.2) - 0.3);    // 5.551115123125783E-17
System.out.println(100.0 * 1.1);          // 110.00000000000001
```

`float` is the same design with 24 bits of precision (~7 digits). It exists for memory and graphics; for arithmetic use `double`.

## Comparing doubles

Never `==` on computed values. Compare with a tolerance appropriate to the magnitude:

```java
static boolean nearlyEqual(double a, double b, double eps) {
    return Math.abs(a - b) <= eps * Math.max(1.0, Math.max(Math.abs(a), Math.abs(b)));
}
nearlyEqual(0.1 + 0.2, 0.3, 1e-9);   // true
```

`Double.compare(a, b)` gives a total order (−1, 0, 1) that also handles `NaN` and `-0.0` consistently — use it in comparators. `==` is fine for values that were *assigned*, not computed (`x == 0.0` after `double x = 0.0`).

Loop counters must be integers:

```java
for (double d = 0; d != 1.0; d += 0.1) { … }   // never terminates: d skips over 1.0
for (int i = 0; i < 10; i++) { double d = i / 10.0; … }   // right
```

## Special values

| Expression | Result |
| --- | --- |
| `1.0 / 0` | `Infinity` |
| `-1.0 / 0` | `-Infinity` |
| `0.0 / 0` | `NaN` |
| `Math.sqrt(-1)` | `NaN` |
| `Double.MAX_VALUE * 2` | `Infinity` |
| `1e-400` | `0.0` (underflow) |

`NaN` (not a number) is *unordered*: every comparison with it is `false`, including `NaN == NaN`. Test with `Double.isNaN(x)` (or `x != x`, the idiom the method uses). `NaN` is sticky — any arithmetic involving it gives `NaN` — which is how a single bad input silently poisons an average.

There are two zeros: `0.0` and `-0.0`. They are `==` but `Double.compare` orders `-0.0` first and `1 / -0.0` is `-Infinity`. You will meet `-0.0` when a negative number rounds to zero; formatting it prints `-0.0`, which surprises users.

## Formatting

`System.out.println(double)` prints the *shortest* decimal that round-trips to the same double, hence `0.30000000000000004`. For display, format:

```java
String.format("%.2f", 2.675)     // "2.68"
String.format("%.2f", 0.125)     // "0.13"
String.format("%.1f", 0.25)      // "0.3"
String.format("%10.3f", Math.PI) // "     3.142"
String.format("%e", 123456.789)  // "1.234568e+05"
```

A detail that differs from C: Java's `%f` rounds the **shortest decimal representation** of the double (the digits `Double.toString` would print) with `HALF_UP`, not the exact binary value. So `2.675` — stored as 2.67499999999999982… — still formats as `2.68`, because its shortest representation is `2.675`. C's `printf` would print `2.67`. `Math.round(x * 100) / 100.0` is the other common idiom for two places and *does* see the binary value: `Math.round(2.675 * 100)` is `Math.round(267.49999…)` = 267, giving 2.67. For money, neither is the tool — see below.

## Money: never `double`

```java
double price = 19.99;
double total = price * 3;          // 59.97000000000001
```

Accumulate that across a million transactions and cents disappear. Two correct approaches:

1. **Integers in the smallest unit** — store cents as `long`. Fast, exact, and what most payment systems do. `1999L * 3 == 5997L`.
2. **`java.math.BigDecimal`** — exact decimal arithmetic with explicit rounding:

```java
import java.math.BigDecimal;
import java.math.RoundingMode;

BigDecimal price = new BigDecimal("19.99");      // from a String — never from a double
BigDecimal total = price.multiply(BigDecimal.valueOf(3));            // 59.97
BigDecimal tax = total.multiply(new BigDecimal("0.18")).setScale(2, RoundingMode.HALF_UP);   // 10.79
BigDecimal share = total.divide(BigDecimal.valueOf(7), 2, RoundingMode.HALF_EVEN);           // 8.57
```

Rules of `BigDecimal`:

- Construct from a **String** or `BigDecimal.valueOf(double)`; `new BigDecimal(0.1)` gives the exact binary value, 0.1000000000000000055511….
- `divide` without a scale and rounding mode throws `ArithmeticException` when the result does not terminate (`1/3`).
- `equals` compares **scale too**: `new BigDecimal("2.0").equals(new BigDecimal("2.00"))` is `false`. Use `compareTo` for numeric equality.
- Immutable: every operation returns a new object; `setScale` returns the rounded copy.
- `RoundingMode.HALF_EVEN` ("banker's rounding") is what accounting usually wants; `HALF_UP` is what schools teach.

## Parsing and printing

`Double.parseDouble("3.14")`, `Double.valueOf`, `Double.toString(x)`. `parseDouble` accepts `"1e3"`, `"  3.5 "` (whitespace is trimmed), `"NaN"`, `"Infinity"`, and hex floats; it rejects commas. It always uses the dot, whatever the locale — `Scanner.nextDouble` does not.

## Performance note

Floating-point arithmetic is fast — as fast as integer arithmetic on modern CPUs. What is slow is `BigDecimal` (heap allocation per operation, roughly 100× slower) and `Math.pow` relative to a multiply. Do not avoid `double` for speed; avoid it for exactness.

## `strictfp`

Historically, `strictfp` forced IEEE-exact results on hardware that used extended precision. Since Java 17 all floating-point arithmetic is strict and the keyword does nothing. If an interviewer mentions it, that is the answer.

## Interview angle

- *"Why is `0.1 + 0.2 != 0.3`?"* Binary fractions cannot represent 0.1 exactly; the two rounding errors do not cancel.
- *"How do you compare doubles?"* With a tolerance, or `Double.compare` for ordering.
- *"How do you represent money?"* `long` cents or `BigDecimal` from a String; never `double`.
- *"`NaN == NaN`?"* `false`. `Double.isNaN`.
- *"What is `Double.MIN_VALUE`?"* The smallest *positive* double (4.9e-324), not the most negative — that is `-Double.MAX_VALUE`. A classic trick question.

## Key takeaways

- Doubles are binary; 0.1 is not exact; 15–17 digits are meaningful.
- Compare with a tolerance or `Double.compare`; never loop on a double counter.
- `NaN` compares false to everything; `Infinity` results from division by zero.
- Money: `long` in cents or `BigDecimal` built from strings with explicit rounding.
- `Double.MIN_VALUE` is tiny and positive.
