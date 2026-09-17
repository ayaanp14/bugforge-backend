---
title: Literals and enumerations
minutes: 14
---
A literal is a value spelled straight into the source, and each spelling has a type that the compiler settles before your variable gets a say — which is why `auto big = 3000000000;` is a `long`, why `1 << 40` is undefined but `1LL << 40` is fine, and why `"text"` is not a `std::string`. Enumerations give names to a set of integer constants, and the C++11 scoped form fixes the two problems the C form always had. This lesson is the reference for both.

## Integer literals

```cpp
int dec = 255;
int hex = 0xFF;           // 255
int bin = 0b1111'1111;    // 255  (binary since C++14; the ' is a digit separator, ignored)
int oct = 0377;           // 255  — a LEADING ZERO means octal; 017 is 15, and 08 is an error
long long big = 1'000'000'000'000LL;
```

The suffix fixes the type: `u`/`U` unsigned, `l`/`L` long, `ll`/`LL` long long, and combinations such as `ul` and `ull`. Without a suffix a decimal literal gets the first of `int`, `long`, `long long` that can hold it, so on this platform `2147483647` is an `int` and `2147483648` is a `long`. Hexadecimal and binary literals may also become `unsigned` before growing, which is why `0xFFFFFFFF` is an `unsigned int`, not a `long`. `-1` is not a literal at all; it is unary minus applied to `1`, which is why `-2147483648` does not have the type you expect (the `2147483648` is a `long` first).

## Floating literals

`1.5`, `1e3`, `1.5e-3`, `.5` and `5.` are all `double`. `1.5f` is a `float` and `1.5L` a `long double`. A literal with no dot and no exponent is an integer, so `1 / 2` is `0` and `1.0 / 2` is `0.5`; the fix for integer division is one `.0`. C++17 added hexadecimal floats (`0x1p-3` is 0.125), which you will read in numeric libraries and rarely write.

## Character literals and escape sequences

`'a'` is a `char` with the value 97. Characters that cannot be typed use an escape:

| Escape | Meaning | | Escape | Meaning |
| --- | --- | --- | --- | --- |
| `\n` | newline | | `\\` | backslash |
| `\t` | tab | | `\'` `\"` | quote characters |
| `\r` | carriage return | | `\0` | the null character, value 0 |
| `\x41` | hex code: `'A'` | | `\101` | octal code: `'A'` |

`'\0'` terminates C strings and is what an empty `char` variable holds after `char c{}`. A literal with several characters, `'ab'`, is an `int` with an implementation-defined value; compilers warn, and it is never what you meant. `u8'a'`, `u'a'`, `U'a'` and `L'a'` spell the other character types.

## String literals

```cpp
const char* s = "abc";                 // "abc" has type const char[4] — three characters and a '\0'
std::cout << "line one\n" "line two\n"; // adjacent literals are joined by the compiler
using namespace std::string_literals;
auto owned = "abc"s;                   // std::string, thanks to the s suffix
```

A string literal is an array of `const char` that ends in `'\0'`; it lives for the whole program and decays to a `const char*` when you take it by pointer (Module 6). `sizeof("abc")` is 4 and `std::strlen("abc")` is 3. Writing into a string literal is undefined behaviour, which is why the pointer type is `const char*`. The `s` suffix from `<string>` gives a real `std::string`, and `sv` a `std::string_view` (Module 5).

## Raw string literals

```cpp
std::cout << R"(C:\temp\new "quoted")" << '\n';      // C:\temp\new "quoted"  — no escapes processed
std::cout << R"delim(a )" b)delim" << '\n';          // a )" b  — a custom delimiter when the text contains )"
```

`R"(...)"` keeps backslashes, quotes and even newlines exactly as written. Regular expressions, Windows paths, JSON and SQL snippets go in raw literals; the alternative is a thicket of `\\`.

## The other literals

`true` and `false` are `bool`. `nullptr` is the null pointer literal, of type `std::nullptr_t`, and the only spelling you should use (Module 6 says why `0` and `NULL` are worse). User-defined literals such as `250ms` and `2h` come from `<chrono>` and from your own `operator""` (Module 11).

## Unscoped enumerations

```cpp
enum Colour { Red, Green = 5, Blue };   // Red 0, Green 5, Blue 6

Colour c = Green;
int n = Blue;             // implicit conversion to int: 6
bool same = c == 5;       // compiles — compares as int
Colour d = 5;             // error: no implicit int -> enum
Colour e = static_cast<Colour>(5);   // fine, and not checked: static_cast<Colour>(42) also "works"
```

The C-style `enum` has two problems. The names spill into the enclosing scope, so two enumerations in the same namespace cannot both have a `None`. And the values convert to `int` at the slightest excuse, so `Colour` and `Weekday` compare and add without complaint. The underlying type is implementation-chosen (`int` here unless every value fits a narrower type and you ask for it) and can be fixed: `enum Colour : std::uint8_t { … }`.

## Scoped enumerations

```cpp
enum class Level : std::uint8_t { Low = 1, Mid, High };   // Mid 2, High 3; one byte each

Level lv = Level::Mid;
int n = lv;                                   // error: no implicit conversion
int m = static_cast<int>(lv);                 // 2 — on purpose, in writing
Level from = static_cast<Level>(3);           // High; validate the integer first, the cast does not
bool ok = lv < Level::High;                   // comparison within one enum is allowed
std::underlying_type_t<Level> raw = static_cast<std::underlying_type_t<Level>>(lv);
```

`enum class` qualifies every name (`Level::Mid`), converts in neither direction implicitly, and defaults its underlying type to `int` unless you fix it. That is the whole difference, and it is enough to make `enum class` the default choice. C++23 adds `std::to_underlying(lv)` for the last line above; this track's runtime is C++20, so spell the cast. C++20's `using enum Level;` inside a block or a `switch` lets you write the bare names where they are unambiguous.

## Switching on an enumeration

```cpp
const char* label(Level lv) {
    switch (lv) {
        case Level::Low:  return "low";
        case Level::Mid:  return "mid";
        case Level::High: return "high";
    }
    return "?";   // reachable: a cast can produce any value
}
```

`switch` is Module 3's subject; the enum-specific points are these. With `-Wall`, `-Wswitch` warns when a `switch` over an enumeration without a `default` omits an enumerator — leave the `default` out and the compiler tells you when someone adds `Level::Critical`. And C++ has no built-in way to print an enumerator's *name*; a `switch` or an array of `const char*` indexed by the value is how every codebase does it.

## Enumerations as flags

```cpp
enum Permission : unsigned { Exec = 1u << 0, Write = 1u << 1, Read = 1u << 2 };

unsigned mode = Read | Write;                 // 6 — unscoped, so | works on the ints
bool canWrite = (mode & Write) != 0;
mode &= ~static_cast<unsigned>(Exec);         // clear a flag
```

One bit per enumerator, powers of two, combined with `|` and tested with `&` — lesson 2's masks with names. An unscoped enum with a fixed underlying type is the pragmatic choice because the operators work out of the box; with `enum class` you overload `operator|` and `operator&` yourself (Module 11) or cast at every use.

## Pitfalls

- `017` is 15, and `08` does not compile — a leading zero is octal.
- `1 << 40` is undefined; the `1` needs a suffix: `1LL << 40`.
- `"a"` is a `const char[2]`; `'a'` is a `char`. `"abc" + 1` is pointer arithmetic (Module 6), not concatenation.
- `static_cast<Level>(99)` compiles and produces a `Level` holding 99; validate before casting.
- Comparing two different unscoped enums compiles and means nothing.

## Key takeaways

- Every literal has a type: unsuffixed decimals are the smallest of `int`/`long`/`long long` that fits, `u`/`L`/`LL` fix it, `0x`/`0b`/leading-`0` set the base, `'` separates digits.
- `'a'` is a one-byte integer; `"a"` is a `const char` array ending in `'\0'`; raw strings `R"(...)"` take no escapes.
- Unscoped enums leak names and convert to `int`; `enum class` does neither and needs `static_cast` both ways.
- Fix the underlying type when the size matters; validate an integer before casting it to an enum.
- Flags are powers of two combined with `|` and tested with `&`; a `switch` without `default` lets `-Wswitch` catch a missing case.
