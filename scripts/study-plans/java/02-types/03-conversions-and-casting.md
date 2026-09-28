---
title: Conversions, promotion and casting
minutes: 15
seo-title: Type Casting in Java: Widening, Narrowing and Promotion
description: Java widens numeric types automatically and narrows them only with a cast, which truncates or wraps. Promotion, integer division and the cast hidden in +=.
question: What is type casting in Java?
answer: Type casting in Java converts a value from one type to another. Widening conversions, such as `int` to `long` or `double`, happen automatically because the magnitude is preserved. Narrowing conversions, such as `double` to `int`, need an explicit cast like `(int) 3.99`, which truncates toward zero to 3; an integer cast to a smaller type keeps only its low-order bits.
q: Why does `byte c = a + b;` not compile in Java?
a: Binary numeric promotion turns both `byte` operands into `int` before adding, so `a + b` is an `int`, and assigning an `int` to a `byte` needs a cast: `byte c = (byte) (a + b);`. Arithmetic on `byte`, `short` and `char` always yields an `int`.
q: Why does `double d = 7 / 2` give 3.0 in Java?
a: Both operands are `int`, so the division is integer division and yields 3, which is only then widened to 3.0. Convert an operand before dividing, `7 / 2.0` or `(double) 7 / 2`, to get 3.5; `(double) (7 / 2)` is still 3.0.
q: Does casting to int round or truncate in Java?
a: It truncates toward zero: `(int) 3.99` is 3 and `(int) -3.99` is -3. To round, use `Math.round`, which returns a `long` for a `double` argument, so `(int) Math.round(x)` is the usual round-to-int.
q: Why does `x += 2.5` compile when `x = x + 2.5` does not?
a: A compound assignment includes a hidden cast: `x += y` means `x = (T) (x + y)`, where `T` is the type of `x`. For `int x = 10`, `x += 2.5` silently truncates to 12, while `x = x + 2.5` is refused as a lossy conversion from `double` to `int`.
q: How do I convert a String to an int in Java?
a: Call `Integer.parseInt("42")`, or `Long.parseLong` and `Double.parseDouble` for other types. Each throws `NumberFormatException` on text that is not a valid number, including `"4.0"`, `" 42"` with a space and the empty string; `String.valueOf(42)` goes the other way.
---
Java moves values between numeric types constantly — `int` into `long`, `char` into `int`, `double` into `int` — and it has precise rules for when that happens silently, when it needs a cast, and what is lost. Getting these rules right explains half of the "why is my answer wrong" questions in numeric code.

## Widening: automatic, safe

A value may be converted *implicitly* to a type that can hold everything it can:

```
byte → short → int → long → float → double
        char → int
```

```java
int i = 'A';         // 65
long l = i;          // fine
double d = l;        // fine
float f = l;         // allowed — but see below
```

Widening never throws and never needs a cast. One subtlety: `int → float` and `long → float`/`long → double` are widening by the rules but can **lose precision**, because a `float` has only 24 bits of mantissa and a `double` 53. `float f = 16_777_217;` stores 16 777 216. The language calls it widening because the *magnitude* is preserved.

## Narrowing: explicit, lossy

Going the other way requires a cast, and the cast tells the compiler "I accept the loss":

```java
int i = (int) 3.99;          // 3 — truncation toward zero, not rounding
int j = (int) -3.99;         // -3
byte b = (byte) 200;         // -56 — the low 8 bits, reinterpreted as signed
char c = (char) 65601;       // 'A' — 65601 mod 65536 = 65
int k = (int) 1e20;          // Integer.MAX_VALUE — saturates, does not wrap
long m = (long) Double.NaN;  // 0
```

The rules, precisely:

- **Floating → integral**: truncate toward zero; if the result is out of range, clamp to `MIN_VALUE`/`MAX_VALUE`; `NaN` becomes 0.
- **Integral → smaller integral**: keep the low-order bits and reinterpret. `(byte) 200` is `-56` because `200 = 0b11001000` and the top bit is now the sign.
- **`double` → `float`**: round to the nearest representable float.

`Math.round(3.99)` gives `4L` (a `long`, note); `(int) Math.round(x)` is the usual "round to int". `Math.floor`, `Math.ceil` return `double`.

## Compile-time constants get a pass

```java
byte b = 100;         // fine: 100 is a constant that fits in a byte
byte c = 200;         // error: possible lossy conversion from int to byte
int x = 100;
byte d = x;           // error: x is a variable, even though its value fits
final int y = 100;
byte e = y;           // fine: y is a constant expression
```

The compiler allows an `int` **constant expression** to narrow to `byte`, `short` or `char` when it can see the value fits. A variable, even a `final` one assigned at run time, gets no such pass.

## Binary numeric promotion

When an operator has two numeric operands, both are converted to a common type before the operation:

1. If either is `double`, both become `double`.
2. Else if either is `float`, both become `float`.
3. Else if either is `long`, both become `long`.
4. **Else both become `int`** — even if both were `byte`, `short` or `char`.

That last rule is the one that surprises:

```java
byte a = 10, b = 20;
byte c = a + b;          // error: a + b is an int
byte d = (byte) (a + b); // fine

char ch = 'a';
ch = ch + 1;             // error: int cannot be assigned to char
ch++;                    // fine — see compound assignment below
```

There is no `byte + byte` in the JVM instruction set; `iadd` works on `int`s. So arithmetic on the small types always yields `int`.

```java
int i = 7 / 2;           // 3 — both int, integer division
double d = 7 / 2;        // 3.0 — division happens in int, THEN widened
double e = 7 / 2.0;      // 3.5 — promotion to double before dividing
double f = (double) 7 / 2;   // 3.5 — cast binds tighter than /
double g = (double) (7 / 2); // 3.0 — cast applied to the int result
```

The second and last lines are the classic mistakes. Convert *before* the division.

## Compound assignment hides a cast

`x += y` is defined as `x = (T)(x + y)` where `T` is the type of `x`. The implicit cast is why:

```java
byte b = 10;
b += 5;           // fine — really b = (byte)(b + 5)
b = b + 5;        // error

int i = 10;
i += 3.7;         // fine — i = (int)(i + 3.7) = 13. Silent truncation!
i *= 1.5;         // 19 — also silent
```

The same applies to `++` and `--` on `byte`, `short` and `char`. Be aware that `+=` with a `double` on the right silently truncates; it is legal and occasionally intended, but usually a bug.

## Overflow is not a conversion error

```java
int big = Integer.MAX_VALUE;
int wrapped = big + 1;               // -2147483648, no exception
long correct = (long) big + 1;       // 2147483648
long stillWrong = big + 1L;          // 2147483648 — the 1L promotes big to long first
long alsoWrong = (long) (big + 1);   // -2147483648 — overflow happened in int, then widened
```

Overflow is the next lesson, but note now the pattern: the *placement* of the cast decides whether the arithmetic happens in `int` or `long`.

## Strings are not converted

There is no implicit conversion between numbers and `String` — except in `+`, where any operand being a `String` turns the whole thing into concatenation:

```java
String s = "Total: " + 1 + 2;   // "Total: 12" — left to right, string first
String t = "Total: " + (1 + 2); // "Total: 3"
String u = 1 + 2 + " items";    // "3 items" — int + int first, then string
```

To go from text to a number, call the parser: `Integer.parseInt("42")`, `Double.parseDouble("3.5")`, `Long.parseLong("9000000000")`. Each throws `NumberFormatException` on bad input (`parseInt("4.0")`, `parseInt(" 42")`, `parseInt("")` all throw). To go from a number to text: `String.valueOf(42)`, `Integer.toString(42)`, or `"" + 42`.

## Reference casts

Casting also exists for reference types (`(Dog) animal`) and means something completely different: a run-time check that the object really is that type, throwing `ClassCastException` if not. Nothing is converted — the same object is viewed through a narrower or wider type. Module 8 covers it; do not confuse the two uses of the same syntax.

## Interview angle

- *"What does `(int) 3.7` give?"* 3. *"And `Math.round(3.7)`?"* 4, as a `long`.
- *"Why does `byte b = a + b` fail?"* Binary numeric promotion: the sum is an `int`.
- *"`int x = 10; x += 2.5;` — compiles?"* Yes; `x` becomes 12 via the implicit cast in `+=`.
- *"`(byte) 130`?"* −126.

## Key takeaways

- Widening is implicit (byte→short→int→long→float→double, char→int); narrowing needs a cast and truncates or wraps.
- Arithmetic on `byte`/`short`/`char` produces an `int`; `int` with `long`/`float`/`double` promotes to the wider.
- Integer division happens *before* any widening: cast an operand, not the result.
- `+=` hides a cast to the left-hand type, silently truncating.
- Strings never convert implicitly except through `+`; use `parseInt`/`valueOf`.
