---
title: Error codes, assertions and an error-handling strategy
minutes: 14
---
Exceptions are one channel for failure, and the previous lessons gave you two more — `std::optional` for "no value" and `std::variant` for "a value or a reason". This lesson settles the rest of the toolbox and when to use which: the return-code tradition C left behind and its modern form in `std::error_code`, the C++23 `std::expected` that unifies value and error, assertions for bugs as opposed to failures, and a strategy that assigns each layer of a program the mechanism that fits it. The strategy is what interviewers are asking about when they say "how do you handle errors in C++?"

## Return codes and errno: the C inheritance

C reports failure through the return value — `-1`, `NULL`, `EOF` — and through `errno`, a thread-local integer that library calls set and never clear:

```cpp
#include <cerrno>
#include <cstdlib>

errno = 0;                                         // must be cleared first: nobody else does
char* end = nullptr;
long value = std::strtol(text, &end, 10);
if (end == text)          { /* no digits at all */ }
else if (errno == ERANGE) { /* the value did not fit */ }
```

The weaknesses are structural. The check is optional, so it is forgotten. The error shares the channel with the value, so a function returning any `long` has no free value to spend. `errno` must be reset before the call and read before anything else overwrites it. And the code carries no context — `ERANGE` says "too big", not what was too big. Every C API — `fopen`, `read`, sockets — still works this way, so you need to read the pattern even if you never write it.

## enum class codes, done properly

The modern return code keeps what worked and fixes what did not: an `enum class` per subsystem, `[[nodiscard]]` so ignoring it is a warning, and the value on a separate channel.

```cpp
enum class CalcError { Ok, DivisionByZero, UnknownOperator, Overflow };

[[nodiscard]] CalcError compute(int a, char op, int b, long long& out) {
    switch (op) {
        case '+': out = static_cast<long long>(a) + b; break;
        case '/': if (b == 0) return CalcError::DivisionByZero;
                  out = static_cast<long long>(a) / b; break;
        default:  return CalcError::UnknownOperator;
    }
    if (out < std::numeric_limits<int>::min() || out > std::numeric_limits<int>::max()) return CalcError::Overflow;
    return CalcError::Ok;
}

const char* describe(CalcError e) {
    switch (e) {
        case CalcError::Ok: return "ok";
        case CalcError::DivisionByZero: return "division by zero";
        case CalcError::UnknownOperator: return "unknown operator";
        case CalcError::Overflow: return "overflow";
    }
    return "unknown error";
}
```

The `switch` in `describe` has no `default` on purpose: add a code to the enum and `-Wall`'s `-Wswitch` reports every `switch` that does not handle it. The output parameter is the honest C++20 shape when the value and the code must travel together; a small `struct Result { long long value; CalcError error; }` is the alternative when the pair is returned often.

## std::error_code

`<system_error>` generalises the enum into something libraries can share. A `std::error_code` is an integer plus a pointer to a *category* that knows what the integer means, so codes from the OS, from the C library and from your own subsystem travel through one type without colliding. `std::errc` is the portable enumeration of POSIX conditions, and `std::from_chars` is the standard function you will meet that reports through it:

```cpp
int value = 0;
auto [ptr, ec] = std::from_chars(text.data(), text.data() + text.size(), value);
if (ec == std::errc::invalid_argument)         { /* no digits */ }
else if (ec == std::errc::result_out_of_range) { /* too big for int */ }
else if (ptr != text.data() + text.size())     { /* digits, then junk */ }
```

`ec == std::errc{}` is success; `ptr` marks where parsing stopped, so "the whole token was a number" is a comparison with the end, not a guess. `ec.message()` renders the code as text — implementation-specific text, so on this track print your own. `std::system_error` is the exception that carries an `error_code` across a boundary, and `std::filesystem` (Module 18, lesson 5) offers every operation twice, throwing or taking an `std::error_code&` — the standard library's own acknowledgement that both styles have a place.

## std::expected (C++23, reading only)

`std::expected<T, E>` holds either a `T` or an `E`, never both, with the optional's interface on the value side and `error()` on the other:

```cpp
std::expected<int, ParseError> parseInt(std::string_view s);   // C++23

auto r = parseInt("42");
if (r) use(*r); else report(r.error());
return std::unexpected(ParseError::Empty);                    // how the function says no

int port = parseInt(text).and_then(checkRange).value_or(8080);
```

It is the type the return-code tradition was reaching for: value and error are one object, ignoring the error is impossible without ignoring the value, and the monadic members chain the happy path. This runtime is C++20 and does not have it. The C++20 spellings are `std::variant<T, E>` visited (lesson 4), or `std::optional<T>` beside a code — the checkpoint uses the first.

## Assertions

An *assertion* states a fact about your own code that cannot be false unless the program has a bug:

```cpp
#include <cassert>

int median(std::vector<int>& v) {
    assert(!v.empty() && "median of an empty range");   // a caller broke the precondition
    std::nth_element(v.begin(), v.begin() + v.size() / 2, v.end());
    return v[v.size() / 2];
}

static_assert(sizeof(long long) == 8, "this code assumes 64-bit long long");
```

`assert(expr)` aborts the process with the file and line when `expr` is false — a runtime error on the judge — and is compiled out *entirely* when `NDEBUG` is defined, expression included, so an assertion must never have a side effect. `-O2` does not define `NDEBUG`; release builds usually do. Hence the rule: assertions check *bugs* — invariants and preconditions inside code you control — and never validate input, because in release the check vanishes and the bad input sails through. `static_assert` is the compile-time form — free, always on, for facts about types and constants. C++26 adds contracts (`pre` and `post` on a declaration) as a configurable successor to `assert`; reading only.

## A strategy per layer

The question is never "exceptions or codes?" for a whole program but "which mechanism at this layer?". A processing pipeline has a natural shape:

```text
input line  ->  parse  ->  validate  ->  execute  ->  report
```

- **Parse** turns text into a structure. Malformed input is ordinary — it is what input does — so parse returns `std::optional<Request>`, and the caller handles the empty case in one `if`.
- **Validate** applies the rules of the domain. Violations are ordinary and enumerable, so validate returns an error code the caller can switch on.
- **Execute** performs the operation. Here a failure means the world refused — the account is short, the file is gone — and the code that discovers it is usually several calls below anyone who can decide what to do. It throws, with context, and the exception carries the failure up through frames that have nothing to add.
- **Report** is the boundary. It catches, translates to output and an exit code, and is the one place `catch (...)` is acceptable.

*Return values inside, throw at the boundary.* Two corollaries: do not catch what you cannot handle — a handler that only logs and swallows hides the failure from the layer that could act — and translate at module boundaries, so a caller sees `ConfigError`, not `std::out_of_range` from three libraries down.

## Logging versus failing

Diagnostics go to `std::cerr`; results go to `std::cout`. The judge reads only standard output, which makes `cerr` a free channel for the trace you use to debug a failing case. A message worth logging says what was attempted, what was found and what was expected — `line 7: expected an integer, found "ten"` — and the same three parts make a good exception message. Fail fast on bugs; recover from expected failures; never `catch (...) {}` silently — an empty handler is a bug with permission to hide.

## Choosing the mechanism

| Mechanism | Use it for |
| --- | --- |
| `std::optional<T>` | absence with no reason needed |
| `enum class` code / `std::error_code` | enumerable failures a caller switches on; C and OS boundaries |
| `std::variant<T, E>` / `std::expected` | a value or a reason, in one object |
| exception | rare failures the immediate caller cannot fix; constructors; deep chains |
| `assert` / `static_assert` | bugs, never input |

## Pitfalls

| Mistake | What happens |
| --- | --- |
| Reading `errno` without clearing it first | A stale code from an earlier call |
| Ignoring a returned code | Silent garbage; `[[nodiscard]]` turns it into a warning |
| `assert(read(fd, buf, n) > 0)` | The read disappears under `NDEBUG` |
| `assert` on user input | Aborts in debug, passes bad data in release |
| `catch (...) {}` | The failure vanishes; the next symptom is far away |
| Throwing from `parse` for every bad line | Microseconds per line; a return value is the shape of the job |

## Key takeaways

- C reports through return values and `errno`; the pattern survives in every C API, so know its rules: clear, call, check.
- A modern code is an `enum class` with `[[nodiscard]]` and a `switch` the compiler checks; `std::error_code` lets categories coexist, and `std::from_chars` reports through `std::errc`.
- `std::expected<T, E>` is C++23; on this runtime use `std::variant<T, E>` or `optional` plus a code.
- `assert` is for bugs and vanishes under `NDEBUG`; `static_assert` is compile-time; neither validates input.
- Return values inside a layer, throw at the boundary, catch where you can act, translate between modules.
- `cerr` for diagnostics, `cout` for answers; never swallow silently.
