---
title: Console input and output
minutes: 16
---
Every exercise in this track — and every coding-round harness, contest judge and command-line tool — is a program that reads standard input and writes standard output. The C++ streams do this well once you know three facts: `>>` reads whitespace-separated tokens and skips the whitespace around them; `std::getline` reads a whole line, spaces included, and consumes the newline; and switching from the first to the second leaves a newline behind that you must throw away. This lesson fixes those facts, the read-until-the-input-ends loops, and the output habits that keep a judged program fast and its output exact.

## The three streams

`<iostream>` declares `std::cin` (standard input), `std::cout` (standard output) and `std::cerr` (standard error). The judge feeds a test case to `cin` and compares only what you write to `cout`; `cerr` is shown to you as diagnostics and never marked wrong, so it is the place for debugging prints.

## `>>` reads tokens

```cpp
#include <iostream>

int main() {
    int n;
    std::cin >> n;
    long long total = 0;
    for (int i = 0; i < n; ++i) {
        long long x;
        std::cin >> x;
        total += x;
    }
    std::cout << total << '\n';
    return 0;
}
```

`std::cin >> x` skips any leading whitespace (spaces, tabs, newlines — any amount, across lines), then reads the characters that can belong to a value of `x`'s type and stops at the first that cannot. For an `int` that is an optional sign and digits; for a `std::string`, everything up to the next whitespace; for a `char`, exactly one non-space character. The input `3 10 20 30` and the input `3⏎10⏎20⏎30⏎` read identically, which is why "N then N numbers" never needs to know the line layout. Chains read left to right: `std::cin >> name >> age;`.

When the next characters cannot form the value (`abc` into an `int`), or there are none left, the extraction **fails**: the stream sets its fail bit, the variable is set to 0, and every later `>>` does nothing until you `std::cin.clear()` it. In exercises the input is well-formed, so a failed read means your reading order is wrong, not the input.

## `std::getline` reads lines

```cpp
#include <iostream>
#include <string>

int main() {
    std::string line;
    std::getline(std::cin, line);
    std::cout << "[" << line << "]\n";
    return 0;
}
```

`std::getline(std::cin, line)` reads everything up to the next newline into `line`, discards the newline and returns the stream. Leading spaces are kept, an empty line yields an empty string, and a name with a space in it arrives whole — which `>>` could never manage. A third argument changes the delimiter: `std::getline(stream, field, ',')` reads up to the next comma, the basis of every CSV parser (Module 5 lesson 4).

## Mixing them: the leftover newline

The most common input bug in C++:

```cpp
int n;
std::cin >> n;                    // input "2⏎Ada Lovelace⏎": reads 2, leaves "⏎Ada Lovelace⏎"
std::string name;
std::getline(std::cin, name);     // reads up to the first newline: name is "" (empty!)
```

`>>` stops at the newline after `2` and leaves it in the buffer; `getline` meets that newline immediately and returns an empty line. The fix is to discard the rest of the current line before the first `getline`:

```cpp
int n;
std::cin >> n;
std::cin.ignore();                // throw away one character: the newline
std::string name;
std::getline(std::cin, name);     // "Ada Lovelace"
```

`std::cin.ignore()` skips one character. When the line might carry trailing spaces after the number, the robust form is `std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');` (from `<limits>`), which skips everything up to and including the next newline. A third form, `std::getline(std::cin >> std::ws, name)`, skips *all* whitespace first — including empty lines, which is wrong when an empty line is meaningful. The rule: after `>>`, before `getline`, ignore the rest of the line.

## Reading until the end of input

`std::cin >> x` returns the stream, and a stream converts to `false` once a read has failed. That gives the two loops every "read everything" program uses:

```cpp
long long x;
while (std::cin >> x) {                    // one token at a time, any layout, until nothing is left
    total += x;
}

std::string line;
while (std::getline(std::cin, line)) {     // one line at a time, until the input ends
    ++lines;
}
```

There is no count to read first and no sentinel to look for: the loop ends when the input does. Do not write `while (!std::cin.eof())` — `eof()` becomes true only *after* a read has hit the end, so that loop processes the last value twice.

## A line, then the tokens inside it

When a line's *content* is a list of tokens and the line boundary matters, read the line and then treat it as a stream:

```cpp
#include <iostream>
#include <sstream>
#include <string>

int main() {
    std::string line;
    while (std::getline(std::cin, line)) {
        std::istringstream tokens(line);
        std::string word;
        int count = 0;
        while (tokens >> word) ++count;
        std::cout << count << '\n';
    }
    return 0;
}
```

`std::istringstream` (from `<sstream>`) gives a string the same `>>` interface as `cin`, so "how many words on each line" needs no hand parsing. Module 5 lesson 4 builds the full parsing toolkit on this idea.

## `<<` writes

`std::cout << a << b << c` writes each value in turn — numbers in decimal, `bool` as `1`/`0` (`std::boolalpha` switches to `true`/`false`), a `char` as its character (`'A'` prints `A`; `int('A')` prints `65`), a `std::string` or literal as its text. Nothing is inserted between values: `std::cout << 1 << 2` prints `12`, and separating spaces are your job.

```cpp
#include <iomanip>
#include <iostream>

int main() {
    double ratio = 200.0 / 3;
    std::cout << ratio << '\n';                                          // 66.6667 (six significant digits)
    std::cout << std::fixed << std::setprecision(2) << ratio << '\n';    // 66.67
    std::cout << std::setw(8) << 42 << '|' << std::left << std::setw(8) << "ab" << "|\n";   // "      42|ab      |"
    return 0;
}
```

Floating-point output must always be pinned with `std::fixed` and `std::setprecision(k)` before it is judged; the default format prints six significant digits, drops trailing zeros and switches to scientific notation for large values, none of which a test case can rely on. `std::fixed`, `setprecision` and `std::left` are *sticky* — set once, they stay; `std::setw` applies to the next value only. Module 5 lesson 5 covers formatting in full, including `std::format`.

## `'\n'` versus `std::endl`

Both end the line. `std::endl` also **flushes** the stream — forces the buffered text to be written out now — and a flush is a system call. In a loop printing a hundred thousand lines, `std::endl` costs a hundred thousand system calls and turns an accepted solution into a timeout. Write `'\n'`. The stream flushes on its own when its buffer fills and when the program ends, so nothing is lost.

## Fast I/O

```cpp
int main() {
    std::ios::sync_with_stdio(false);
    std::cin.tie(nullptr);
    // ... read and write as usual ...
    return 0;
}
```

By default the C++ streams are synchronised with C's `stdio`, so that `printf` and `std::cout` can be mixed, and `cin` flushes `cout` before every read. The first line switches the synchronisation off — after it, do not mix `scanf`/`printf` with the streams — and the second stops `cin` flushing `cout` on every read. Together they make the streams several times faster on large inputs, and they are the first two lines of every contest template (Module 20).

## The patterns, in one place

| Input format | Read it with |
| --- | --- |
| N, then N numbers in any layout | `std::cin >> n;` then a `for` of `std::cin >> x` |
| One line of text with spaces | `std::getline(std::cin, line)` |
| N, then N lines of text | `std::cin >> n; std::cin.ignore();` then N `getline`s |
| Numbers until the input ends | `while (std::cin >> x)` |
| Lines until the input ends | `while (std::getline(std::cin, line))` |
| A line whose tokens matter | `getline`, then `std::istringstream` and `>>` |

## Pitfalls

- **`getline` right after `>>`** returns an empty line. `std::cin.ignore()` first.
- **`std::endl` in a loop.** Use `'\n'`.
- **Unpinned floating-point output.** Set `std::fixed << std::setprecision(k)` once, before printing.
- **`while (!std::cin.eof())`** processes the last item twice; test the read itself.

## Key takeaways

- `>>` reads whitespace-separated tokens and ignores line boundaries; `std::getline` reads a whole line and eats the newline.
- After `>>`, before `getline`: `std::cin.ignore()`.
- `while (std::cin >> x)` and `while (std::getline(std::cin, line))` read until the input ends; never test `eof()` first.
- `'\n'`, not `std::endl`; `std::fixed << std::setprecision(k)` for every floating-point value that is judged.
- `std::ios::sync_with_stdio(false); std::cin.tie(nullptr);` for big inputs, and no C stdio after it.
