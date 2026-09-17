---
title: Formatting output
minutes: 14
---
Output that must match a judge or line up in a report is a formatting problem before anything else: how wide is the column, which side is padded, how many decimals, zero-filled or hex. C++ has two toolkits. The stream manipulators in `<iomanip>` have been there from the start and are what most existing code uses; C++20's `std::format` says the same things in one compact specification and is the one for new code. This lesson settles both — including which stream settings are sticky and which apply once, the mistake that bites everyone — and shows how to build a table, and a string, before printing anything.

## Width, alignment and fill

```cpp
#include <iomanip>
#include <iostream>

int main() {
    std::cout << '[' << std::setw(6) << 42 << "]\n";                     // [    42]
    std::cout << '[' << std::setw(6) << std::left << 42 << "]\n";        // [42    ]
    std::cout << '[' << std::setw(6) << "ab" << "]\n";                   // [ab    ] - left is still on
    std::cout << std::right << std::setfill('0') << std::setw(5) << 7 << '\n';   // 00007
    std::cout << std::setw(3) << 1 << std::setw(3) << 2 << '\n';         // 001002 - fill is still '0'
    return 0;
}
```

`std::setw(n)` sets the minimum width of the **next insertion only**; the one after it is back to width 0. `std::left`, `std::right` and `std::setfill(c)` stay in force until changed, which is why the last line above zero-fills both numbers. Numbers and strings alike default to right alignment on a stream. A value wider than the field is never truncated; the field grows.

## Precision and the floating-point modes

```cpp
double x = 3.14159265;
std::cout << std::setprecision(3) << x << '\n';                       // 3.14     - 3 SIGNIFICANT digits
std::cout << std::setprecision(3) << 1234.5678 << '\n';               // 1.23e+03 - still 3 significant digits
std::cout << std::fixed << std::setprecision(3) << x << '\n';         // 3.142    - 3 digits AFTER the point
std::cout << std::fixed << std::setprecision(2) << 2.0 / 3 << '\n';   // 0.67
std::cout << std::scientific << x << '\n';                            // 3.14e+00 - precision 2 still applies
std::cout << std::defaultfloat << std::setprecision(6) << x << '\n';  // 3.14159  - back to the default
```

Without `std::fixed`, `setprecision` counts *significant* digits and the stream may switch to scientific notation for large or small values — hence `1.2e+03` for 1234.5 at `setprecision(2)`. With `std::fixed` it counts digits after the point, the mode every exercise with money or averages wants. Both are sticky; set them once at the top of `main`. Rounding is to nearest, so `2.0 / 3` at two decimals is `0.67`, while an exact tie such as `0.125` rounds to even and prints `0.12` — never build an expectation on a tie.

Integers have their own modes: `std::hex`, `std::oct` and `std::dec` change the base and stay changed, `std::showbase` adds `0x`, `std::uppercase` capitalises the digits. Forgetting to switch back to `std::dec` is a classic: every integer printed afterwards comes out in hex.

## Sticky or one-shot

| Manipulator | Effect | Lasts |
| --- | --- | --- |
| `std::setw(n)` | minimum width | next insertion only |
| `std::left` / `std::right` / `std::internal` | alignment within the width | until changed |
| `std::setfill(c)` | padding character | until changed |
| `std::fixed` / `std::scientific` / `std::defaultfloat` | floating-point mode | until changed |
| `std::setprecision(n)` | digits (meaning depends on the mode) | until changed |
| `std::hex` / `std::oct` / `std::dec` | integer base | until changed |
| `std::boolalpha` | `true`/`false` instead of `1`/`0` | until changed |

## std::format

```cpp
#include <format>

std::cout << std::format("{} scored {}\n", "Ada", 97);                        // Ada scored 97
std::cout << std::format("[{:>6}] [{:<6}] [{:^6}]\n", 42, 42, 42);            // [    42] [42    ] [  42  ]
std::cout << std::format("[{:6}] [{:6}]\n", 42, "ab");                        // [    42] [ab    ] - numbers right, text left
std::cout << std::format("{:05} {:+d} {:.3f} {:8.2f}\n", 42, 7, 3.14159, 2.5); // 00042 +7 3.142     2.50
std::cout << std::format("{:x} {:X} {:#x} {:08b} {:o}\n", 255, 255, 255, 5, 8); // ff FF 0xff 00000101 10
std::cout << std::format("{1} before {0}\n", "b", "a");                       // a before b
std::cout << std::format("{:*^11}\n", "mid");                                 // ****mid****
```

Each `{}` is replaced by the next argument; after a colon comes a specification in a fixed order: **fill and align** (`<` left, `>` right, `^` centre, optionally preceded by the fill character), **sign** (`+`), **`#`** for a base prefix, **`0`** for zero padding, **width**, **`.precision`**, and a **type** letter — `d`, `x`, `X`, `b`, `o` for integers, `f`, `e`, `g` for floating point, `s` for strings. Everything is optional; `{:8.2f}` reads "width 8, two decimals, fixed". Unlike streams, nothing is sticky: each placeholder says everything about itself, and the default alignment differs by kind — numbers right, text left, which is exactly what a table wants.

The format string must be known at compile time, because the compiler checks the placeholders against the argument types: `{:d}` with a `std::string` is a compile error, not a runtime surprise. For a string built at run time use `std::vformat(fmt, std::make_format_args(args...))`. `std::format` returns a `std::string`; `std::print` (C++23) writes straight to stdout but is not available on this runtime — write `std::cout << std::format(...)`.

## Building a string first

```cpp
#include <sstream>

std::ostringstream out;
out << std::fixed << std::setprecision(1);
for (int i = 1; i <= 3; ++i) out << i << ':' << i * 0.5 << ' ';
std::string text = out.str();       // "1:0.5 2:1.0 3:1.5 "
std::cout << text << '\n';
```

An `std::ostringstream` accepts everything `std::cout` does and hands the result back with `str()`: assemble a line before deciding whether to print it, measure a string's width before padding, or collect a large output and write it once. `std::format` covers the simple cases since it already returns a string; the stream wins when many pieces with shared settings accumulate in a loop.

## A table, done right

```cpp
struct Row { std::string name; int qty; double price; };

void print_table(const std::vector<Row>& rows) {
    std::cout << std::format("{:<10}{:>5}{:>10}\n", "item", "qty", "price");
    for (const Row& r : rows) {
        std::cout << std::format("{:<10}{:>5}{:>10.2f}\n", r.name, r.qty, r.price);
    }
}
```

```text
item        qty     price
pen           3      1.20
notebook     12     45.00
```

The rules that keep a table clean and a judge happy: right-align numbers so decimal points line up; put the left-aligned text column first so no line ends in padding; give each column a width that fits its widest value and use the same widths for the header. This judge ignores trailing spaces, but a left-aligned *last* column still produces them and other judges compare bytes — end each row with a right-aligned column and the problem never arises.

## Pitfalls

- `setw` is one-shot; `setprecision`, `fixed`, `left`, `setfill` and `hex` are sticky and stay on for the rest of the program.
- `setprecision(2)` without `fixed` means two *significant* digits: `1234.5` prints as `1.2e+03`.
- `std::hex` left on turns every later integer into hex; switch back with `std::dec`.
- The `std::format` string must be a compile-time constant; a `std::string` variable does not compile — use `std::vformat`.
- A left-aligned last column pads with spaces to the end of the line; put text columns first.
- Ties such as `0.125` round to even at two decimals; do not build an expectation on one.

## Key takeaways

- Streams: `setw` applies once; alignment, fill, precision, floating mode and base persist.
- `std::fixed` plus `setprecision(n)` is the deterministic way to print `n` decimals; without `fixed`, `n` counts significant digits.
- `std::format("{:>8.2f}")` reads fill/align, sign, `#`, `0`, width, precision, type — nothing is sticky, numbers right-align and text left-aligns by default.
- The format string is checked at compile time; it must be a literal.
- `std::ostringstream` collects output into a string via `str()`; `std::format` returns one directly.
- Put text columns first and right-align numbers so no line ends in padding.
