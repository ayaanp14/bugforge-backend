---
title: The fundamental types — bool, char, integers and floating point
minutes: 14
---
Every C++ variable has a type fixed at compile time, and the type decides three things: how many bytes the object occupies, which values those bytes can mean, and which machine operations the compiler emits for it. Java pins all of this in its specification; C++ leaves the sizes to the platform, which is why "how big is an `int`?" has the honest answer "it depends" and the practical answer "4 bytes everywhere this track runs". This lesson lays out the built-in types, their exact sizes on the x86-64 runtime the exercises use, where the limits live, and the initialisation form that keeps the compiler on your side.

## What a type decides

```cpp
int count = 3;          // 4 bytes, -2147483648 … 2147483647, integer instructions
double ratio = 0.75;    // 8 bytes, IEEE 754 binary64, floating-point instructions
bool done = false;      // 1 byte, true or false
char grade = 'B';       // 1 byte, a small integer the streams print as a character
```

Because the size is part of the type, the compiler can keep a local in a register or at a fixed stack offset and compute on it directly — the zero-overhead principle from Module 1 in its smallest form. The other side of the bargain is that nothing checks at run time whether a value fits. C++ trusts the type you chose, and the next lesson is about what happens when that trust is misplaced.

## bool

`bool` holds `true` or `false`, printed as `1` and `0` unless you switch the stream with `std::cout << std::boolalpha`. Any arithmetic or pointer value converts to `bool` — zero is `false`, everything else `true` — which is what makes `if (n)` and `if (ptr)` legal. Arithmetic on a `bool` promotes it to `int`: `true + true` is `2`, and `std::count_if` results are routinely summed that way.

## char and the character types

`char` is one byte and, on this platform, **signed**: it holds −128 to 127. It is an integer type that the streams happen to print as a character, so `'A' + 1` is the `int` 66 and `static_cast<char>('A' + 1)` is `'B'` — Module 5 builds digit and case arithmetic on exactly this. When you mean *a byte* rather than *a character*, say so with `unsigned char` or `std::uint8_t`; the value 200 does not fit in a signed `char`, and storing it there gives −56. `wchar_t`, `char16_t`, `char32_t` and C++20's `char8_t` exist for wide and Unicode text; this track stays with `char` and UTF-8 bytes.

## The integer family

| Type | Bytes on this platform | Range |
| --- | --- | --- |
| `short` | 2 | −32 768 … 32 767 |
| `int` | 4 | ±2.1 × 10⁹ |
| `long` | 8 | ±9.2 × 10¹⁸ |
| `long long` | 8 | ±9.2 × 10¹⁸ |

Each comes in `signed` (the default) and `unsigned` flavours, and `unsigned int` is usually written `unsigned`. The standard guarantees only an ordering and minimums (`int` at least 16 bits, `long` at least 32, `long long` at least 64); the numbers above are the x86-64 Linux ABI. `long` is the one that moves — it is 4 bytes on 64-bit Windows — which is why portable code writes `long long` when it needs 64 bits and reserves `long` for APIs that demand it.

Unsigned types hold 0 … 2ⁿ − 1 and never overflow: arithmetic wraps modulo 2ⁿ, which lesson 2 covers. Use them for bit patterns and for values that are counts *by definition* — `std::size_t`, the type of `sizeof` and of every container's `.size()`, is an 8-byte unsigned type here. Do not reach for `unsigned` merely because a value "can't be negative": the difference of two counts is negative half the time, and an unsigned result cannot say so.

## Fixed widths: `<cstdint>`

```cpp
#include <cstdint>
std::int32_t  id = 7;        // exactly 32 bits, two's complement
std::uint8_t  byte = 200;    // exactly 8 bits, 0 … 255
std::int64_t  total = 0;     // exactly 64 bits
std::uint64_t hash = 0;
```

When the width is part of the meaning — a file format, a network packet, a hash, a bitmask — name it. The aliases buy certainty, not new types: `std::int32_t` *is* `int` here, `std::int64_t` is `long`, and `std::uint8_t` is `unsigned char`. That last one is a trap: `std::cout << std::uint8_t{65}` prints `A`, because the stream sees a character type. Print bytes as numbers with `static_cast<int>(b)` or with the unary plus, `+b`, which promotes to `int`. `std::intmax_t`, `std::uintptr_t` (an integer wide enough for a pointer) and `std::ptrdiff_t` (the signed type of a pointer difference) round out the header.

## Floating point

`float` is 4 bytes with 24 bits of precision (about 7 decimal digits), `double` 8 bytes with 53 bits (15–17 digits), and `long double` 16 bytes on this platform, holding the x87 80-bit format with 64 bits of precision. Default to `double`: it is what the literals are (`0.5` is a `double`, `0.5f` a `float`), what `<cmath>` is written for, and no slower than `float` on a modern CPU unless you are filling memory with millions of them. Lesson 3 is about what these types cannot represent.

## `<limits>`: ask, don't remember

```cpp
#include <limits>
std::numeric_limits<int>::max()          // 2147483647
std::numeric_limits<int>::min()          // -2147483648
std::numeric_limits<double>::max()       // 1.79769e+308
std::numeric_limits<double>::lowest()    // -1.79769e+308  (min() is the smallest POSITIVE double)
std::numeric_limits<double>::digits10    // 15
std::numeric_limits<char>::is_signed     // true here
```

`std::numeric_limits<T>` is a template you query with a type. `max()` and `min()` are `constexpr`, so they cost nothing and belong in range checks and in "start the maximum search from the smallest possible value" initialisers. The C macros `INT_MAX` and `LLONG_MIN` from `<climits>` still work and are what older code uses.

## `sizeof` and the platform table

`sizeof(T)` is a compile-time constant of type `std::size_t` giving an object's size in bytes; `sizeof x` works on an expression too. Print it to describe the platform, never to build logic on:

```cpp
std::cout << "int " << sizeof(int) << ", long long " << sizeof(long long)
          << ", double " << sizeof(double) << ", pointer " << sizeof(void*) << '\n';
```

```text
int 4, long long 8, double 8, pointer 8
```

On this track's runtime: `bool` and `char` 1, `int` 4, `long` and `long long` 8, `double` 8, `long double` 16, `std::size_t` 8, every pointer 8.

## Initialisation forms — and why braces

```cpp
int a;          // no initialiser: an indeterminate value; reading it is undefined behaviour
int b = 5;      // copy-initialisation, the C form
int c(5);       // direct-initialisation
int d{5};       // list-initialisation ("brace-init"), since C++11
int e{};        // value-initialisation: zero
```

The first line is the one that bites. A local of a fundamental type with no initialiser holds whatever the memory held before, the compiler is allowed to assume you never read it, and the optimiser will cheerfully produce a program that prints 0 today and garbage after the next edit. Globals and `static` locals are zeroed before `main` runs; automatic locals are not.

Braces are the modern default for two reasons. `int e{}` gives a definite zero for any type, which makes "declare now, fill in later" safe. And brace-init refuses **narrowing**: `int x{3.7}`, `char c{300}` and `unsigned u{-1}` are compile errors where `int x = 3.7` silently stores 3 (lesson 4 has the full list). Write `T name{value};` unless you have a reason not to. The usual reason is a container: `std::vector<int> v{10}` is one element holding 10, not ten elements, so sizes still go in parentheses (Module 13).

## Choosing a type

- `int` for counts and indices that fit; `long long` for anything summed or multiplied; `std::size_t` when comparing with `.size()`.
- `double` for measurements; `float` only when memory says so.
- `std::uint8_t` or `unsigned char` for bytes, `char` for text, `bool` for flags — never `int` for any of them.
- A fixed-width type whenever the width is part of a format.

## Pitfalls

- `int x;` followed by `x += 1;` is undefined behaviour, and `-Wall` warns only when the compiler can see the read. Initialise.
- `std::cout << std::uint8_t{7}` prints a control character, not `7`.
- `long` is 8 bytes here and 4 on Windows; say `long long` when you mean 64 bits.
- `std::numeric_limits<double>::min()` is tiny and positive; the most negative double is `lowest()`.
- `char` is signed here: a byte value above 127 stored in a `char` is negative.

## Key takeaways

- A type fixes size, value set and operations at compile time; the sizes are the platform's, and on this track `int` is 4 bytes and `long long` is 8.
- `char` is a signed one-byte integer that prints as a character; `std::uint8_t` prints the same way, so cast bytes to `int` to see numbers.
- Use `<cstdint>` when the width matters and `<limits>` instead of remembering constants.
- An uninitialised local holds garbage and reading it is undefined behaviour; `T x{}` is the safe default, and braces reject narrowing.
- `int` by default, `long long` for sums and products, `std::size_t` for sizes, `double` for real numbers.
