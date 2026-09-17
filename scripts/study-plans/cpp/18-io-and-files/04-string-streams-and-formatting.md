---
title: String streams and formatting — building text in memory
minutes: 14
---
A string stream is the third member of the family: the same formatter as `std::cin` and `std::cout`, with a `std::string` as the buffer. Reading from one turns a line you already hold into tokens; writing to one builds a report in memory that you can measure, inspect and print in a single call. Module 5 met `std::istringstream` as a line splitter and `std::ostringstream` as a string builder; this lesson covers what that left out — reusing a stream without the state bug that bites everyone once, round-tripping strings that contain spaces with `std::quoted`, and `std::format` as the modern way to build formatted text, including formatting straight into an existing string.

## Three classes, one header

`<sstream>` declares `std::istringstream` (read from a string), `std::ostringstream` (write into one) and `std::stringstream` (both). `str()` with no argument returns a *copy* of the buffer; `str(s)` replaces it. The copy matters: `oss.str().size()` is fine, but a loop that calls `oss.str()` on every iteration copies the whole report every time. Take it once into a variable.

```cpp
std::ostringstream report;
report << "Total: " << std::fixed << std::setprecision(2) << 1234.5 << '\n';
const std::string text = report.str();
std::cout << text << "length=" << text.size() << '\n';
```

Every manipulator works — `std::setw`, `std::left`, `std::fixed`, `std::setprecision` from `<iomanip>` behave exactly as on `std::cout` (Module 5, lesson 5), and they are just as sticky. Building in memory is what makes it possible to know a report's line count or length *before* printing it, and it is the fast way to emit a large output: one `std::cout << text` instead of a million small writes.

## Reusing a stream

The trap. A stream that has been read to its end has `eofbit` and `failbit` set; giving it a new buffer does not clear them, so the next read fails immediately:

```cpp
std::istringstream in("10");
int v;
in >> v;              // 10; the stream is now at the end (eofbit set by the lookahead)
in >> v;              // fails: failbit
in.str("20");         // new contents, OLD state
in >> v;              // still fails
in.clear();           // now it reads
in.str("30");
in >> v;              // 30
```

The idiom is always the pair: `in.clear(); in.str(newText);`. The same applies to an `ostringstream` emptied with `oss.str("")` — `clear()` is harmless when nothing was set, so write both every time and the bug cannot happen. For a per-line parser it is usually simpler to construct a fresh `std::istringstream` inside the loop (lesson 2, Shape 4); the object is cheap.

## `std::quoted`

`>>` into a string stops at whitespace, which is fine until a field is a name with spaces in it. `std::quoted` (`<iomanip>`) is the standard library's answer: on output it wraps a string in double quotes and escapes any embedded `"` or `\` with a backslash; on input it reads a quoted string as one token, spaces included, undoing the escapes.

```cpp
std::ostringstream out;
out << std::quoted("Ada Lovelace") << ' ' << std::quoted("say \"hi\"") << ' ' << 36;
// "Ada Lovelace" "say \"hi\"" 36

std::istringstream in(out.str());
std::string name, phrase;
int age;
in >> std::quoted(name) >> std::quoted(phrase) >> age;
// name == Ada Lovelace, phrase == say "hi", age == 36
```

It is a round trip by construction: whatever `<< std::quoted(s)` wrote, `>> std::quoted(t)` reads back into an equal string, whatever `s` contained. A string without quotes in the input reads as an ordinary token, so the manipulator is forgiving of unquoted single words. Both the delimiter and the escape character can be changed (`std::quoted(s, '\'', '\\')`), which is how a single-quoted format is handled. It is the simplest correct serialisation of free text into a whitespace-separated record.

## `std::format`

C++20's `<format>` builds a `std::string` from a format string and arguments, with the specification mini-language Module 5 introduced: `{}` in order, `{:>8}` right-aligned in eight, `{:<10}` left, `{:^7}` centred, `{:*^9}` with a fill character, `{:.2f}` two decimals, `{:06.2f}` zero-padded, `{:+d}` always signed, `{:#x}` hexadecimal with a prefix, and `{:>{}}` taking the width from the next argument:

```cpp
#include <format>

const int width = 12;
std::string row = std::format("{:<{}}{:>6}{:>10.2f}\n", "widget", width, 3, 4.5);
// "widget      "  "     3"  "      4.50"
```

Three differences from the stream manipulators. Nothing is sticky: each `{}` is formatted from its own specification and the next call starts clean. The format string is checked at compile time when it is a literal — `std::format("{} {}", 1)` is a compile error, not a run-time surprise — and a format string only known at run time must go through `std::vformat` with `std::make_format_args`. And the result is a value: pass it to `std::cout <<`, append it to a string, put it in a container.

For building a long text, `std::format_to` writes into an output iterator instead of allocating a new string per call:

```cpp
std::string report;
for (const auto& [name, qty] : items) {
    std::format_to(std::back_inserter(report), "{:<10}{:>5}\n", name, qty);
}
std::cout << report;
```

`std::format_to_n` caps the number of characters written, for a fixed buffer. C++23 adds `std::print` and `std::println`, which format straight to `stdout` with no `<<` at all; the study runtime is C++20, so that is reading only — `std::cout << std::format(...)` is the equivalent here.

## Building a report

A table is a two-pass job whichever tool you use. The first pass reads the records and finds the widths — the longest name, the widest number — with `std::max`; the second formats every row with those widths. Compute the totals in the first pass too (`long long` for sums, `double` only for money already given as decimals), then write the header, the rows and the total line into an `ostringstream` or through `format_to`, and print once. The reason to build in memory rather than print as you go is that the header often depends on what follows: the column width, the row count, whether there was anything at all.

```cpp
std::size_t nameWidth = 4;                                   // "Item"
for (const auto& r : rows) nameWidth = std::max(nameWidth, r.name.size());
std::string out = std::format("{:<{}}{:>6}{:>10}\n", "Item", nameWidth, "Qty", "Total");
for (const auto& r : rows) {
    std::format_to(std::back_inserter(out), "{:<{}}{:>6}{:>10.2f}\n", r.name, nameWidth, r.qty, r.qty * r.price);
}
```

## Numbers to text and back

`std::to_string(3.14159)` gives `3.141590` — six decimals, no control. `std::format("{:.2f}", x)` or an `ostringstream` with `std::fixed << std::setprecision(2)` gives the precision you asked for, and both are what a judged answer needs, because the compare is exact. In the other direction, an `istringstream` reading into a `double` accepts the same forms `std::stod` does and reports failure through the state instead of an exception; `std::from_chars` (Module 5, lesson 3) is the fastest and strictest of the three.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `in.str(next)` without `in.clear()` | Reads keep failing: the old `failbit` is still set. |
| `oss.str()` in a loop | A full copy of the buffer every iteration. |
| `>>` into a string for a field with spaces | Splits at the first space; use `std::quoted` or `getline`. |
| Expecting `std::format` to remember a width | Nothing is sticky; every `{}` states its own spec. |
| `std::format(runtimeString, x)` | Compile error: a non-literal format string needs `std::vformat`. |
| `std::to_string` for a fixed-precision answer | Always six decimals; use `{:.2f}` or `setprecision`. |

## Key takeaways

- String streams are the console formatter over a `std::string`; `str()` copies, `str(s)` replaces.
- Reuse means `clear()` **and** `str(...)`; a fresh `istringstream` per line is the simpler habit.
- `std::quoted` writes a quoted, escaped string and reads it back intact — a round trip for text with spaces.
- `std::format` returns a string, checks a literal format string at compile time and is never sticky; `std::format_to` appends into an existing string.
- Build reports in memory in two passes — measure, then format — and print once.
