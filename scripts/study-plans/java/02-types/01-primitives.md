---
title: The eight primitive types
minutes: 14
---
Java has exactly eight primitive types, and there will never be a ninth. Everything else — every class, array, enum, record, interface — is a reference type. Knowing the eight cold, including their sizes, ranges and literal syntax, is the foundation of every numeric bug you will ever debug.

## The table to memorise

| Type | Size | Range | Default | Literal |
| --- | --- | --- | --- | --- |
| `byte` | 8-bit signed | −128 … 127 | `0` | `(byte) 7` |
| `short` | 16-bit signed | −32 768 … 32 767 | `0` | `(short) 7` |
| `int` | 32-bit signed | −2 147 483 648 … 2 147 483 647 | `0` | `7` |
| `long` | 64-bit signed | ±9.22 × 10¹⁸ | `0L` | `7L` |
| `float` | 32-bit IEEE 754 | ~±3.4 × 10³⁸, ~7 significant digits | `0.0f` | `7.0f` |
| `double` | 64-bit IEEE 754 | ~±1.8 × 10³⁰⁸, ~15–16 significant digits | `0.0` | `7.0` |
| `char` | 16-bit unsigned | 0 … 65 535 (UTF-16 code unit) | `'\u0000'` | `'A'` |
| `boolean` | 1 bit of information (size unspecified) | `true` / `false` | `false` | `true` |

Two numbers worth knowing by heart: `Integer.MAX_VALUE` is **2 147 483 647** (about 2.1 billion — a phone number or a file size in bytes can exceed it), and `Long.MAX_VALUE` is **9 223 372 036 854 775 807** (about 9.2 quintillion). All integral types are signed two's complement; there is no `unsigned int` in Java, though `Integer.toUnsignedString` and friends exist for when you need to *interpret* bits that way.

The defaults matter only for **fields** (and array elements). A local variable has no default: reading it before assignment is a compile error, not a zero.

## Integer literals

```java
int decimal = 42;
int hex     = 0x2A;        // 42
int binary  = 0b101010;    // 42 (Java 7+)
int octal   = 052;         // 42 — a leading zero means octal; a classic trap
long big    = 3_000_000_000L;   // underscores anywhere between digits
int million = 1_000_000;
```

A plain integer literal is an `int`. `3000000000` without the `L` is a compile error ("integer number too large") because it does not fit in an `int`. The suffix can be lower-case `l` but never write it — `3000000000l` looks like 30000000001.

Underscores are for readability only and are removed by the compiler; they cannot start or end a literal or sit next to the `0x`/`0b` prefix or the `L` suffix.

## Floating-point literals

```java
double d = 3.14;      // double by default
float  f = 3.14f;     // the f is required; 3.14 alone is a double and will not fit
double e = 1e-9;      // scientific notation
double h = 0x1.8p1;   // hexadecimal floating point: 1.5 × 2¹ = 3.0 (rare)
```

`float f = 3.14;` fails with "possible lossy conversion from double to float". Use `double` unless you have a measured reason (graphics, huge arrays) to use `float`.

## `char`: a number in disguise

```java
char c = 'A';          // 65
char d = 65;           // also 'A' — an int constant that fits
char e = '\u0041';     // Unicode escape, also 'A'
char nl = '\n';        // escapes: \n \t \r \\ \' \" \0 \b \f
int code = c;          // 65, widening
char next = (char) (c + 1);   // 'B' — c + 1 is an int, so the cast is needed
```

`char` is unsigned 16-bit and arithmetic on it yields `int`. `'a' + 1` is `98`, not `'b'`. The classic use in interviews:

```java
int digitValue = ch - '0';           // '7' → 7
int letterIndex = ch - 'a';          // 'c' → 2
char upper = (char) (ch - 'a' + 'A');
```

Since Java is UTF-16, a `char` is a *code unit*, not necessarily a whole character — an emoji is two `char`s. Module 3 returns to this.

## `boolean`: not a number

Unlike C, `boolean` does not convert to or from integers. `if (x)` where `x` is an `int` is a compile error; write `if (x != 0)`. `true` and `false` are the only values, and `Boolean.parseBoolean("TRUE")` is how you get one from text (anything but a case-insensitive "true" is `false`).

## Why primitives exist at all

Java's designers wanted "everything is an object" but measured the cost: an `int` in a register is one machine word and one instruction to add; an `Integer` object is a heap allocation, a header, a pointer indirection, and garbage-collector work. For loops, arrays and arithmetic — the hot paths of every program — primitives are the difference between fast and unusable. The compromise is the eight primitives plus the wrapper classes (`Integer`, `Double`, …) for when an object is required, with **autoboxing** converting between them (a later lesson, and a rich source of bugs).

A consequence you feel constantly: generics cannot hold primitives. `List<int>` is a compile error; it must be `List<Integer>`. `int[]` on the other hand is a real array of primitives, contiguous and fast.

## Choosing a type

- Counting, indexing, most arithmetic → `int`.
- Anything that can reach billions — timestamps in milliseconds, file sizes, money in the smallest unit, products of two `int`s → `long`.
- Measurements and science → `double`. **Never money** (Module 2, lesson 5).
- `byte` and `short` are for arrays of them (binary data, memory-tight structures), not for "small numbers": arithmetic on them promotes to `int` anyway.
- `float` only for graphics APIs or huge datasets where memory halves.

## Sizes are guaranteed

In C, `int` is "at least 16 bits" and varies by platform. In Java, `int` is 32 bits everywhere — the same `.class` file computes the same result on every JVM. This is part of the portability promise and why Java arithmetic is *specified* down to overflow behaviour (next lessons).

## Interview angle

- *"What is the size of `boolean`?"* Unspecified by the language; HotSpot uses one byte in fields and arrays.
- *"Is `char` signed?"* No — it is the only unsigned primitive.
- *"What does `0.1f == 0.1` give?"* `false`: the `float` is widened to a `double`, and the two roundings of 0.1 differ.
- *"Why is `int i = 3_000_000_000;` an error?"* The literal exceeds `Integer.MAX_VALUE`; it needs `L` and a `long`.

## Key takeaways

- Eight primitives: four integral (`byte`, `short`, `int`, `long`), two floating (`float`, `double`), `char`, `boolean`. Fixed sizes everywhere.
- Integer literals are `int` unless suffixed `L`; decimal literals are `double` unless suffixed `f`.
- `char` is an unsigned 16-bit number; arithmetic on it gives `int`.
- `boolean` never converts to a number. Fields default to zero/false/null; locals have no default.
