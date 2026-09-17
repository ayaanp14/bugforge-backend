---
title: Characters and conversions
minutes: 14
---
A `char` is a number that the stream prints as a letter. Hold on to that and everything here follows: why `'7' - '0'` is 7, why `c + 1` is an `int`, why `<cctype>` needs an `unsigned char` cast most tutorials omit, and how text becomes a number and back — `std::to_string`, the `std::stoi` family that throws, and C++17's `std::from_chars` that does not. Parsing a token that might not be a number is where text programs fail their hidden cases; this lesson gives two correct ways to do it.

## char is a small integer

```cpp
char c = 'A';
std::cout << c << ' ' << static_cast<int>(c) << ' ' << c + 1 << '\n';   // A 65 66
std::cout << static_cast<char>(c + 1) << '\n';                           // B
```

`'A'` is the integer 65 with type `char`. Arithmetic promotes a `char` to `int` (Module 2, Integers and bits), so `c + 1` is the `int` 66 and prints as digits; cast back to `char` to print a letter. On this platform `char` is signed, −128 to 127, so bytes above 127 — present the moment input is not ASCII — are *negative*. That fact is behind the cast in the next section.

## cctype and the unsigned char cast

| Function | True for |
| --- | --- |
| `std::isdigit(c)` | `'0'`–`'9'` |
| `std::isalpha(c)` | letters |
| `std::isalnum(c)` | letters or digits |
| `std::isspace(c)` | space, tab, newline, carriage return, form feed, vertical tab |
| `std::isupper(c)` / `std::islower(c)` | capitals / lower case |
| `std::ispunct(c)` | printable, not alphanumeric, not space |
| `std::toupper(c)` / `std::tolower(c)` | returns the converted character (as `int`) |

Every function takes and returns an `int`, and the argument must be representable as `unsigned char` or be `EOF`. A negative `char` is neither, and passing one is undefined behaviour — a crash on some libraries, silently wrong on others. Cast first:

```cpp
#include <cctype>

bool is_digit(char c) { return std::isdigit(static_cast<unsigned char>(c)) != 0; }
char upper(char c)    { return static_cast<char>(std::toupper(static_cast<unsigned char>(c))); }
```

Two casts for the case functions: `unsigned char` on the way in, `char` on the way out because they return `int`. Wrap them once in helpers and the rest of the program stays clean. The classification functions return a non-zero `int`, not `bool` — hence the `!= 0`.

## Digit and letter arithmetic

```cpp
int d = '7' - '0';                          // 7   - the digits are consecutive codes 48..57
char c = static_cast<char>('0' + 3);        // '3'
int index = 'k' - 'a';                      // 10  - letters are consecutive too (in ASCII)
char shifted = static_cast<char>('a' + (index + 3) % 26);   // 'n' - a Caesar shift
```

Digit characters have consecutive codes, so `c - '0'` converts a digit to its value and `'0' + d` converts back. The same holds for `'a'`–`'z'` and `'A'`–`'Z'`, which is how a letter becomes an index into a 26-element count array (`count[c - 'a']`). Check with `isdigit`/`isalpha` before subtracting — `'x' - '0'` is 72 and nobody will stop you using it.

Building a number by hand is the loop every parser reduces to:

```cpp
long long value = 0;
for (char c : text) {
    if (!is_digit(c)) break;
    value = value * 10 + (c - '0');
}
```

Use `long long` for the accumulator: ten digits overflow `int`, and signed overflow is undefined behaviour (Module 2). The hand-rolled loop also shows why the library functions matter — sign, whitespace, overflow and trailing text all need handling.

## Number to text: std::to_string

```cpp
std::string a = std::to_string(42);          // "42"
std::string b = std::to_string(-7LL);        // "-7"
std::string c = std::to_string(3.5);         // "3.500000" - always six decimals, like printf's %f
std::string d = std::to_string(1e20);        // "100000000000000000000.000000"
```

Integers convert exactly as printed. For floating point `std::to_string` behaves like `%f` — six decimals, not adjustable, enormous for large values — so use `std::format("{:.2f}", x)` (lesson 5) or a stream with `std::setprecision` whenever the format matters.

## Text to number: the stoi family

```cpp
#include <string>

int i = std::stoi("42");                          // 42
int j = std::stoi("  -17xyz");                    // -17: leading whitespace skipped, parsing stops at 'x'
long l = std::stol("123456789012");
long long ll = std::stoll("-9000000000000000000");
double d = std::stod("2.5e3");                    // 2500.0
std::size_t used = 0;
int k = std::stoi("123abc", &used);               // k = 123, used = 3 - how many characters were consumed
```

`std::stoi`, `stol`, `stoll`, `stoul`, `stoull`, `stof`, `stod` and `stold` wrap C's `strtol` family: they skip leading whitespace, accept a sign, parse the longest valid prefix and *ignore the rest*. The optional second argument receives the count of characters consumed — the only way to notice trailing junk. Two things go wrong loudly:

```cpp
try {
    int v = std::stoi(token);
    std::cout << v << '\n';
} catch (const std::invalid_argument&) {    // no digits at all: "abc", "", "  "
    std::cout << "not a number\n";
} catch (const std::out_of_range&) {        // digits, but the value does not fit an int
    std::cout << "too big\n";
}
```

An uncaught exception ends the program with a non-zero exit code — a runtime error on the judge, not a wrong answer — so any `stoi` on input you do not control sits inside a `try`. Module 15, Errors and exceptions, covers the mechanism; here the two catch clauses are enough.

## Text to number without exceptions: std::from_chars

```cpp
#include <charconv>
#include <string>
#include <system_error>

bool parse_int(const std::string& text, int& out) {
    const char* first = text.data();
    const char* last = first + text.size();
    auto [ptr, ec] = std::from_chars(first, last, out);
    return ec == std::errc() && ptr == last;      // no error, and the whole token was consumed
}
```

`std::from_chars` (C++17, `<charconv>`) parses a character range into a number and reports through a result struct: `ptr` points just past what it consumed, and `ec` is `std::errc()` on success, `std::errc::invalid_argument` when no number starts at `first`, or `std::errc::result_out_of_range` when the digits are valid but the value does not fit. It never throws, never allocates, skips no whitespace and accepts no `+` — only an optional `-` for signed targets. Checking `ptr == last` turns "starts with a number" into "is a number", the check the exercises need. It is the fastest conversion in the library, and because it takes a pointer range it works on a `std::string_view` (lesson 6) too, so a token sliced from a line parses without a copy. `std::to_chars` is the mirror image; `std::format` is usually more convenient.

| | `std::stoi` | `std::from_chars` |
| --- | --- | --- |
| Leading whitespace | skipped | error |
| `+` sign | accepted | error |
| Trailing text | ignored (see the `pos` argument) | reported through `ptr` |
| Not a number | throws `invalid_argument` | `ec == errc::invalid_argument` |
| Too large | throws `out_of_range` | `ec == errc::result_out_of_range` |
| Base | argument (default 10) | argument (default 10) |

## Pitfalls

- `std::isdigit(c)` on a plain `char` is undefined behaviour for bytes over 127; cast to `unsigned char` first.
- `std::toupper` returns `int`; assigning to a `char` without a cast is a silent narrowing, so cast explicitly.
- `std::stoi("42abc")` is 42, not an error; check the consumed count or use `from_chars` with `ptr == last`.
- `std::stoi("")` and `std::stoi("abc")` throw `std::invalid_argument`; `std::stoi("99999999999")` throws `std::out_of_range`; an uncaught throw is a runtime error on the judge.
- `std::from_chars` rejects `" 42"` and `"+42"`; trim first and decide whether a `+` is allowed.

## Key takeaways

- `char` is an integer; arithmetic promotes to `int`, and `'0' + d` / `c - '0'` convert between digit characters and values.
- Every `<cctype>` call takes `static_cast<unsigned char>(c)`; the case functions return `int`.
- `std::to_string` is exact for integers and fixed at six decimals for floating point.
- The `stoi` family skips whitespace, parses a prefix and throws on failure; catch `invalid_argument` and `out_of_range`.
- `std::from_chars` reports through `ptr` and `ec`, never throws, and `ptr == last` means the whole token was a number.
