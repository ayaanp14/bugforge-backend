---
title: Stream operators — printing and reading your own types
minutes: 14
---
`std::cout << total` works for `int` and `std::string` because the library wrote an `operator<<` for each; it works for your `Money` the moment you write one too, and then every stream — `std::cout`, a file, an `std::ostringstream` — can print it. The reverse, `std::cin >> m`, is the same idea with a harder contract, because input can be malformed and the stream has a state the reader is expected to check. This lesson settles the two signatures, why they are free functions, what "return the stream" and "respect the stream's state" mean in practice, how to read a structured value back safely, and where `std::format` fits.

## operator<<

```cpp
#include <iostream>

class Money {
public:
    explicit Money(long long cents) : cents_(cents) {}
    friend std::ostream& operator<<(std::ostream& os, const Money& m);
private:
    long long cents_;
};

std::ostream& operator<<(std::ostream& os, const Money& m) {
    long long c = m.cents_;
    if (c < 0) { os << '-'; c = -c; }
    os << c / 100 << '.';
    if (c % 100 < 10) os << '0';
    return os << c % 100;
}

Money price(1999);
std::cout << "price: " << price << '\n';   // price: 19.99
```

The left operand is the stream, a class you cannot add members to, so `operator<<` is necessarily a free function: `std::ostream&` in, `const T&` in, `std::ostream&` out. Returning the stream is what makes chaining work — `std::cout << a << b` is `operator<<(operator<<(std::cout, a), b)`, and the inner call must yield something the outer one can insert into. It is a `friend` only because it reads `cents_`; with a public accessor it needs no friendship at all. Two habits matter. Insert into the `os` you were given, never into `std::cout`, or the operator silently misbehaves for files and string streams. And do not print a trailing newline: the caller decides how the value sits in its line.

## operator>>

```cpp
std::istream& operator>>(std::istream& is, Point& p) {
    char open, comma, close;
    int x, y;
    if (is >> open && open == '(' && is >> x >> comma && comma == ',' && is >> y >> close && close == ')') {
        p = Point{x, y};                    // assign only once the whole value has been read
    } else {
        is.setstate(std::ios::failbit);     // leave the stream failed and the target untouched
    }
    return is;
}

Point p;
if (std::cin >> p) { /* p is valid */ } else { /* bad or exhausted input */ }
```

Input has a contract that output does not. The reader must read into *locals*, validate, and assign to the target only when the whole value is good, so a half-read `(3,` never leaves `p` with a new `x` and an old `y`. On a malformed token it sets `failbit` — the same signal the built-in `>>` gives when `int` meets `"abc"` — and returns the stream, so `if (std::cin >> p)` and `while (std::cin >> p)` work exactly as they do for `int`. Whitespace is skipped by each `>>` into a `char` or a number, which is why `(3, 4)` and `(3,4)` both parse; if a format must reject spaces, read with `is.get()` instead. For a token-shaped value, the simplest robust reader takes a `std::string` with `is >> tok` and parses it by hand — then the stream is already positioned after the token and the only decision left is whether to set `failbit`.

## Respecting the stream's state

A stream carries formatting state — `width`, `fill`, `precision`, the `fixed`/`hex`/`left` flags — that the *caller* set and expects to keep. Two rules follow.

First, `std::setw` is one-shot: it applies to the next single insertion and then resets to 0. So `std::cout << std::setw(10) << price` widens only whatever the operator inserts first — the `'-'` or the units — and the rest of the value follows unpadded. If a type should honour `setw`, the operator must build the whole text and insert it in **one** operation:

```cpp
#include <sstream>
#include <iomanip>

std::ostream& operator<<(std::ostream& os, const Money& m) {
    std::ostringstream out;                                  // a private stream with default state
    long long c = m.cents();
    if (c < 0) { out << '-'; c = -c; }
    out << c / 100 << '.' << std::setw(2) << std::setfill('0') << c % 100;
    return os << out.str();                                  // one insertion: setw on os applies to all of it
}

std::cout << '[' << std::setw(10) << Money(-1999) << "]\n";   // [    -19.99]
```

Second, sticky state must be put back. `std::setfill('0')` and `std::setprecision(2)` stay in force after the operator returns, and a caller who then prints an `int` gets it zero-padded. Either apply such manipulators to a temporary `std::ostringstream`, as above, or save and restore: `const auto fill = os.fill('0'); … os.fill(fill);`, and `os.flags(saved)` for the flag set. An operator that changes the caller's stream is a bug that surfaces three print statements later.

## Reading a value back

Print and read should be inverses: whatever `<<` writes, `>>` accepts. For `Money` that means `>>` parses `19.99`, `-0.05` and `7` (no fraction), and pads a single decimal — `7.5` is 750 cents — while rejecting `1.2.3` and `12.345` with `failbit`. Writing the two together, and testing them by printing a value, reading it into a second object and comparing, is the discipline that keeps a serialised format honest.

```cpp
std::istream& operator>>(std::istream& is, Money& m) {
    std::string tok;
    if (!(is >> tok)) return is;                    // EOF or an earlier failure: nothing to parse
    long long cents = 0;
    if (!parseCents(tok, cents)) { is.setstate(std::ios::failbit); return is; }
    m = Money(cents);
    return is;
}
```

## std::format and a formatter specialisation

`std::format("{:>10}", price)` does not compile until `std::formatter<Money>` exists. The shortest correct specialisation inherits the string formatter, which already understands width, alignment and fill, and hands it the text:

```cpp
#include <format>

template <>
struct std::formatter<Money> : std::formatter<std::string> {
    auto format(const Money& m, std::format_context& ctx) const {
        return std::formatter<std::string>::format(toString(m), ctx);   // toString builds "19.99"
    }
};

std::cout << std::format("[{:>10}]", Money(1999)) << '\n';   // [     19.99]
```

This compiles on the C++20 judge, but treat it as reading: `std::format` has no input counterpart, so a type that must round-trip still needs `>>`, and `<<` remains what `std::ostringstream`, files and every logging library call.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `operator<<` as a member | The left operand would have to be your type: `m << std::cout` |
| Returning `void` from `<<` | `std::cout << m << '\n'` does not compile |
| Writing to `std::cout` inside the operator | Wrong output for files and string streams |
| Assigning to the target before validation in `>>` | A failed read leaves a half-updated object |
| Not setting `failbit` on bad input | The caller's `if (is >> x)` says success for garbage |
| `std::setfill('0')` applied to the caller's stream | Every later number is zero-padded |
| Printing `'\n'` inside `<<` | The caller cannot put the value mid-line |
| `-` from `c / 100` when `-5 < c < 0` | `-5 / 100` is `0`: the sign is lost unless printed explicitly |

## Key takeaways

- `std::ostream& operator<<(std::ostream&, const T&)` and `std::istream& operator>>(std::istream&, T&)` are free functions (friends when they need private members) that return the stream for chaining.
- Insert into the stream you were given, never `std::cout`, and never a trailing newline.
- In `>>`, read into locals, validate, assign on success only, and `setstate(failbit)` otherwise so `if (is >> x)` keeps its meaning.
- `setw` is one-shot: build the text in an `std::ostringstream` and insert it once so callers can pad your type; restore any sticky fill or precision you change.
- Make `<<` and `>>` inverses and test the round trip.
- `std::formatter<T>` inheriting `std::formatter<std::string>` enables `std::format` with width and alignment — useful, but not a replacement for `>>`.
