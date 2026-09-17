---
title: Streams in depth — state, recovery and the character API
minutes: 15
---
Module 1 taught the two reading habits — `>>` for tokens, `std::getline` for lines — and promised that every input in this track is well-formed. Real input is not. A stream that meets `abc` where it expected a number does not throw and does not skip: it sets a flag, leaves the characters where they were, and silently refuses every later read until you reset it. Programs that "stop reading half way for no reason" are almost always this. This lesson opens the stream up: the buffer, the state bits, exactly what a failed `>>` leaves behind, how to recover, and the character-level calls — `peek`, `get`, `ignore` — that let you write a tokeniser instead of hoping `>>` splits the input the way you need.

## A stream is a formatter over a buffer

`std::cin` is a `std::istream`; `std::cout` is a `std::ostream`. Neither owns a file or a terminal. Each holds a pointer to a `std::streambuf`, the object that moves bytes to and from the operating system in chunks, and the stream's own job is *formatting*: turning `42` into the characters `4` `2` on the way out and back into an `int` on the way in. That split is why `std::ifstream` (lesson 3) and `std::istringstream` (lesson 4) have exactly the same interface as `std::cin` — the same formatter over a different buffer — so everything here works on all three. The buffer is also why output appears late: `std::cout << x` writes into memory, and the bytes leave when the buffer fills, on a flush (`std::flush`, `std::endl`), when the tied `std::cin` reads, or at normal exit. `std::cerr` flushes after every write, so a diagnostic there appears at once while `cout` text is still waiting.

## The four state bits

Every stream carries three flag bits; a fourth name, `goodbit`, means none is set.

| Bit | Set when | Query |
| --- | --- | --- |
| `goodbit` | nothing has gone wrong | `good()` |
| `eofbit` | a read tried to go past the end of the input | `eof()` |
| `failbit` | a read or write could not do what was asked (a bad token, a missing file) | `fail()` |
| `badbit` | the underlying buffer broke (disk error, closed pipe) | `bad()` |

The conversions matter more than the queries. `if (stream)` and `while (std::cin >> x)` use `operator bool`, which is `!fail()` — true as long as neither `failbit` nor `badbit` is set, and silent about `eofbit`. `good()` is true only when all three are clear.

`eof()` is the one people misuse. It becomes true when a read *bumps into* the end, not when the last item has been consumed. The input `12` with no trailing newline reads `12` successfully and sets `eofbit` in the same call, because the extraction looked for a thirteenth character to see whether the number continued. The read was fine — `operator bool` still says so. That is why `while (std::cin >> x)` is right and `while (!std::cin.eof())` runs once too often (Module 3, lesson 5).

## What a failed `>>` leaves behind

```cpp
#include <iostream>

int main() {
    int x = 42;
    std::cin >> x;                       // input: "abc 5"
    std::cout << x << ' ' << std::cin.fail() << ' ' << std::cin.eof() << '\n';
    int y = 7;
    std::cin >> y;                       // does nothing: the stream is in a failed state
    std::cout << y << '\n';
    return 0;
}
```

```text
0 1 0
7
```

Three things happen. The stream sets `failbit`. The variable is set to `0` — required since C++11 whenever characters were examined and could not form a value; when the stream was already at the end before the read began, the conversion never runs and the variable keeps its old value, so never rely on the value after a failed read either way. And the characters `abc` are **not consumed**: they are still the next thing in the buffer. Every later `>>` sees `failbit`, gives up without touching the buffer, and leaves its variable alone — `y` stays `7`. The stream is *stuck* until something clears the state. An out-of-range number is the one variation: `99999999999` into an `int` sets `failbit`, stores the largest representable value (`2147483647`) and *does* consume the digits.

## Recovering

```cpp
std::cin.clear();                                                       // reset every bit to goodbit
std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');     // discard the rest of the line
```

`clear()` sets the state to `goodbit` (with an argument — `clear(std::ios::failbit)` — it *sets* that bit; the no-argument form is the reset). It does nothing to the buffer, so the offending characters are still waiting, and the second step decides what to do with them. `ignore(n, delim)` discards up to `n` characters or through the first `delim`, whichever comes first; with `std::numeric_limits<std::streamsize>::max()` (`<limits>`) as `n` it means "the rest of the line". `ignore()` with no arguments discards exactly one character — the form Module 1 used to drop the newline after `std::cin >> n`. The third option is to extract the bad token as a string and count it:

```cpp
long long sum = 0;
int rejected = 0;
for (;;) {
    int x;
    if (std::cin >> x) { sum += x; continue; }
    if (std::cin.eof()) break;             // nothing left: a clean stop
    std::cin.clear();                      // a bad token: reset the state...
    std::string junk;
    std::cin >> junk;                      // ...consume the token that caused it...
    ++rejected;                            // ...and carry on
}
```

The order of the two tests is the whole trick. `eof()` is checked *before* clearing, because `clear()` would erase the evidence; a read that failed without reaching the end is, by elimination, a bad token. `std::cin >> junk` cannot fail here — the bad characters are non-whitespace, so a string extraction takes them — and the loop resumes on the next token. Note what "token" means to this loop: `12abc` reads as the number `12` followed by the bad token `abc`, because `>>` stops at the first character that cannot continue the number. A reader that wants the whole word rejected reads a string first and converts it (Module 5, lesson 3), or checks `peek()` after the number.

The stricter alternative, `std::cin.exceptions(std::ios::failbit)`, makes the stream throw `std::ios_base::failure` the moment the bit is set — right when malformed input is fatal, wrong for a read-until-EOF loop, where the end of input sets `failbit` too.

## The character-level API

`>>` works in tokens and skips whitespace first. When the grammar is finer than "whitespace-separated" — an expression like `x1=42+foo*(7-y)` where `*` and `(` are tokens of their own — you read one character at a time:

| Call | Effect |
| --- | --- |
| `int c = in.peek();` | Returns the next character **without** consuming it, or `EOF` (`-1`) at the end |
| `int c = in.get();` | Consumes and returns the next character, or `EOF`; sets `eofbit` and `failbit` at the end |
| `in.unget();` | Steps back one character |
| `in >> std::ws;` | Skips whitespace and nothing else |

`peek()` and `get()` return `int`, not `char`, precisely so that `EOF` can be told apart from every real character; compare against `EOF` before converting. Because whitespace is *not* skipped, these calls see the newlines and spaces that `>>` hides — which is what a tokeniser wants, and what makes `std::getline(std::cin >> std::ws, line)` the tidy way to skip blank lines before reading one. A tokeniser built on them has one shape: peek at the next character, decide what kind of token starts there, then consume exactly that token.

```cpp
int c;
while ((c = std::cin.peek()) != EOF) {
    if (std::isspace(c)) { std::cin.get(); continue; }                   // skip
    if (c == '#') { std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n'); continue; }
    if (std::isdigit(c)) {
        std::string digits;
        while (std::isdigit(std::cin.peek())) digits += static_cast<char>(std::cin.get());
        std::cout << "NUMBER " << digits << '\n';
        continue;
    }
    std::cout << "OP " << static_cast<char>(std::cin.get()) << '\n';    // anything else: one character
}
```

`std::isdigit(std::cin.peek())` is safe because `peek()` returns either `EOF` or a value in the `unsigned char` range — exactly the two things `<cctype>` accepts (Module 5, lesson 3). A name token is the same inner loop with `isalnum`.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| Reading `x` after `std::cin >> x` failed | `0`, or the old value: never meaningful. Test the stream. |
| `while (!std::cin.eof())` | One extra iteration with a failed read. |
| Forgetting `clear()` before the next read | Every read is a silent no-op for the rest of the program. |
| `clear()` without discarding the bad characters | The same token fails again: an infinite loop. |
| `char c = std::cin.get();` then `c == EOF` | `EOF` is `-1`; keep the result in an `int`. |

## Key takeaways

- A stream is a formatter over a `streambuf`; `cin`, an `ifstream` and an `istringstream` share one interface and one state model.
- `operator bool` is `!fail()`; `eof()` means a read bumped the end, which the last successful read also does.
- A failed `>>` sets `failbit`, zeroes (or leaves) the variable, consumes nothing, and sticks until `clear()`.
- Recover with `clear()` and then discard the bad characters — `ignore(max, '\n')` or an extraction into a string; test `eof()` before clearing.
- `peek()`, `get()` and `ignore()` see every character, whitespace included, and return `int` so `EOF` is distinguishable.
