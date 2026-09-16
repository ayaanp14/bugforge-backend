---
title: Integer arithmetic, overflow and the Math class
minutes: 14
---
Integer arithmetic in Java is exact, fast, and *silently wrong* the moment a result leaves the range of its type. Every programmer who has computed the average of two large numbers, or the sum of a big array, or a hash, has met this. The lesson covers what the JVM actually does on overflow, how to detect and avoid it, the rules of `/` and `%` with negative numbers, and the tools in `java.lang.Math`.

## Two's complement and wrap-around

An `int` is 32 bits interpreted in two's complement: the top bit is the sign. `Integer.MAX_VALUE` is `0x7FFFFFFF`; add one and the bits become `0x80000000`, which is `Integer.MIN_VALUE`. Nothing stops this — no exception, no flag, no warning:

```java
int max = Integer.MAX_VALUE;
System.out.println(max + 1);          // -2147483648
System.out.println(Integer.MIN_VALUE - 1);   // 2147483647
System.out.println(Math.abs(Integer.MIN_VALUE)); // -2147483648  (!)
System.out.println(-Integer.MIN_VALUE);          // -2147483648  (!)
System.out.println(1_000_000 * 1_000_000);       // -727379968
```

`Math.abs(Integer.MIN_VALUE)` is negative because `2 147 483 648` does not exist as an `int`. This exact fact has caused real outages (hash-to-bucket code doing `Math.abs(hash) % n` and getting a negative index).

Multiplication overflows the earliest: two 5-digit numbers can exceed `int`. The **fix is `long`** — and the cast must happen *before* the multiplication:

```java
int a = 100_000, b = 100_000;
long wrong = a * b;              // -1486618624: overflowed in int, then widened
long right = (long) a * b;       // 10000000000
long alsoRight = a * (long) b;
```

`long` overflows too, at 9.2 × 10¹⁸ — enough for most counting, not for a factorial of 21 or 2⁶⁴. Beyond that, `java.math.BigInteger`.

## Detecting overflow: `Math.*Exact`

Since Java 8, the `Math` class has versions that throw instead of wrapping:

```java
int sum = Math.addExact(a, b);           // ArithmeticException on overflow
int prod = Math.multiplyExact(a, b);
long big = Math.multiplyExact((long) a, b);
int neg = Math.negateExact(x);
int narrowed = Math.toIntExact(someLong);   // throws if it does not fit
```

Use these in financial code and anywhere silent wrap-around is worse than a crash. They JIT-compile to a single overflow-checked instruction, so the cost is negligible.

## The average-of-two-ints bug

```java
int mid = (low + high) / 2;              // overflows when low + high > MAX_VALUE
int mid = low + (high - low) / 2;        // safe when both are non-negative
int mid = (low + high) >>> 1;            // safe: unsigned shift treats the wrapped sum as a large positive
```

Binary search in the JDK itself had this bug for nine years. In an interview, writing `low + (high - low) / 2` without being asked is a signal.

## Division and remainder

Integer `/` **truncates toward zero**; `%` returns a result with **the sign of the dividend** (the left operand), such that `(a / b) * b + (a % b) == a` always holds:

```java
 7 / 2   →  3       7 % 2  →  1
-7 / 2   → -3      -7 % 2  → -1
 7 / -2  → -3       7 % -2 →  1
-7 / -2  →  3      -7 % -2 → -1
```

So `%` is a *remainder*, not a mathematical modulo. A negative index into a circular buffer, `(i - 1) % n`, is negative when `i` is 0. The safe forms:

```java
int mod = Math.floorMod(i - 1, n);       // always in [0, n) for positive n
int div = Math.floorDiv(-7, 2);          // -4: rounds toward negative infinity
int adhoc = ((i - 1) % n + n) % n;       // the pre-Java-8 idiom
```

Division by zero: for integers, `x / 0` and `x % 0` throw `ArithmeticException: / by zero`. For floating point they do not — `1.0 / 0` is `Infinity` and `0.0 / 0` is `NaN` (next lesson).

## Increment, decrement and evaluation order

```java
int i = 5;
int a = i++;      // a = 5, i = 6   (post-increment: use, then add)
int b = ++i;      // b = 7, i = 7   (pre-increment: add, then use)
int c = i++ + ++i;   // 7 + 9 = 16; i = 9. Legal, unreadable. Never write this.
```

Java evaluates operands **left to right**, always — unlike C, where such expressions are undefined. It is specified, so you can predict it, but code that relies on it is code reviewers reject.

## The `Math` class

Static methods, no import needed:

| Method | Note |
| --- | --- |
| `abs`, `max`, `min` | Overloaded for `int`, `long`, `float`, `double` |
| `pow(double, double)` | Returns `double` — `(int) Math.pow(2, 10)` is 1024, but beware precision for large results; prefer a loop or `1 << 10` for powers of two |
| `sqrt`, `cbrt`, `hypot` | `sqrt(-1)` is `NaN` |
| `floor`, `ceil`, `round`, `rint` | `round(double)` → `long`, `round(float)` → `int`; rounds half up (`round(-2.5)` is `-2`) |
| `floorDiv`, `floorMod` | The mathematical versions of `/` and `%` |
| `addExact` … `toIntExact` | Overflow-checked |
| `random()` | A `double` in [0, 1); for anything serious use `java.util.Random` or `ThreadLocalRandom` |
| `PI`, `E` | Constants |
| `sin`, `cos`, `log`, `log10`, `exp` | Standard transcendental functions |

`Math.pow` in integer code is a smell: it computes in floating point and `Math.pow(10, 15)` may not be exactly `1e15` when cast back. Use a loop, `Math.multiplyExact` in a loop, or `BigInteger.pow`.

## Bit tricks worth knowing

```java
x & 1               // 1 if odd
x >> 1              // x / 2 for non-negative x (floors for negative — differs from / )
x << 3              // x * 8 (until it overflows)
x & (x - 1)         // clears the lowest set bit; zero iff x is a power of two (x > 0)
Integer.bitCount(x) // popcount
Integer.MAX_VALUE == ~Integer.MIN_VALUE   // true
```

Shifts are covered in the operators lesson; they are here because interviewers ask "divide by two without `/`".

## `BigInteger` for the rest

```java
import java.math.BigInteger;
BigInteger f = BigInteger.ONE;
for (int i = 2; i <= 50; i++) f = f.multiply(BigInteger.valueOf(i));
System.out.println(f);   // 30414093201713378043612608166064768844377641568960512000000000000
```

Arbitrary precision, immutable (every operation returns a new object), with `add`, `subtract`, `multiply`, `divide`, `mod`, `pow`, `compareTo`, `gcd`, `isProbablePrime`. Slow relative to `long` — use it when you need it, not by default.

## Interview angle

- *"Result of `Integer.MAX_VALUE + 1`?"* `Integer.MIN_VALUE`. *"How do you detect that?"* `Math.addExact`, or check the sign flip, or compute in `long`.
- *"`-7 % 3`?"* `-1`. *"How do you get 2?"* `Math.floorMod(-7, 3)`.
- *"Why `low + (high - low) / 2`?"* Avoids overflow in `low + high`.
- *"Is `i = i++` a bug?"* Yes: `i` is unchanged — the post-increment value is overwritten by the assignment.

## Key takeaways

- Overflow wraps silently; `Math.abs(MIN_VALUE)` is negative; multiply in `long` by casting *an operand*.
- `Math.addExact` and friends throw on overflow.
- `/` truncates toward zero and `%` takes the dividend's sign; use `floorMod` for a true modulo.
- Integer division by zero throws; floating-point division by zero gives Infinity/NaN.
- `BigInteger` when `long` is not enough.
