---
title: Exceptions — throw, try, catch and the standard hierarchy
minutes: 14
---
A function that cannot do what it was asked can return a special value, set a flag, or throw. The first two leave every caller to check, and a caller that forgets carries on with garbage. An exception cannot be ignored: `throw` abandons the current function, destroys everything on the way out and lands in the nearest handler that can deal with the failure — or, if there is none, ends the program. This lesson settles what a `throw` does, how a handler is chosen, what the standard library throws, what `what()` promises, and what stack unwinding runs.

## Throwing and catching

```cpp
#include <iostream>
#include <stdexcept>

double ratio(int numerator, int denominator) {
    if (denominator == 0) {
        throw std::invalid_argument("ratio: denominator is zero");
    }
    return static_cast<double>(numerator) / denominator;
}

int main() {
    try {
        std::cout << ratio(6, 3) << '\n';
        std::cout << ratio(1, 0) << '\n';   // throws: nothing after this line in the block runs
        std::cout << "unreachable\n";
    } catch (const std::invalid_argument& e) {
        std::cout << "invalid: " << e.what() << '\n';
    }
    std::cout << "still running\n";
    return 0;
}
```

```text
2
invalid: ratio: denominator is zero
still running
```

`throw` takes an expression of any type and creates the *exception object* from it — a copy or move into storage that survives the unwinding, so throwing a local is safe. The runtime then walks up the call stack looking for a `try` block with a handler that matches the object's type. When it finds one, every frame in between is discarded, the handler runs, and execution continues after the whole `try`/`catch` statement — never at the line that threw. Handlers are tested top to bottom and the first match wins; `catch (...)` matches anything and belongs only at the very top of a program. Throw objects derived from `std::exception`: `throw 42;` compiles, but leaves the catcher nothing to call `what()` on and no category to catch by.

## Catch by const reference, most derived first

`catch (const std::exception& e)` is the form to use every time. Catching by value copies the exception object and, worse, *slices* it (Module 10, lesson 4): a `std::out_of_range` caught as a `std::exception` by value is a plain `std::exception` inside the handler — `what()` survives, the dynamic type and every derived member do not — and `throw e;` from there throws that slice. (A bare `throw;` still rethrows the original object, because the parameter is only a copy of it; both compilers warn about the by-value catch regardless.) A reference binds to the real object, keeps its dynamic type and costs nothing.

A handler for a base class matches every derived type, so order matters: with `catch (const std::exception&)` written before `catch (const std::out_of_range&)`, the second handler can never run, and both GCC and Clang warn that the exception "will be caught by earlier handler". Most derived first, most general last.

## The standard hierarchy

Every exception the standard library throws derives from `std::exception` (`<exception>`); the useful subclasses live in `<stdexcept>`.

| Type | Base | Thrown by |
| --- | --- | --- |
| `std::logic_error` | `exception` | a precondition the caller should have checked |
| `std::invalid_argument` | `logic_error` | `std::stoi("abc")`, `std::bitset` built from a bad string |
| `std::out_of_range` | `logic_error` | `at()` on a vector, string or map; `std::stoi("99999999999")` |
| `std::runtime_error` | `exception` | a failure only detectable while running |
| `std::overflow_error`, `range_error` | `runtime_error` | arithmetic results; `std::bitset::to_ulong` |
| `std::system_error` | `runtime_error` | the OS said no; carries a `std::error_code` (lesson 5) |
| `std::bad_alloc` | `exception` | `new` cannot get memory |
| `std::bad_optional_access`, `std::bad_variant_access` | `exception` | lessons 3 and 4 |

The split at the top is the one to remember. A `logic_error` says *the program is wrong* — an argument was outside its documented range, and a check before the call would have avoided it. A `runtime_error` says *the world is wrong* — a file was missing, a number in the input did not fit. Derive your own types from `std::runtime_error` unless you mean "this is a bug".

## Which calls throw, and which do not

- `v.at(i)`, `s.at(i)` and `m.at(key)` throw `std::out_of_range`; `v[i]` and `s[i]` never throw — an index out of range is undefined behaviour — and `m[key]` silently inserts.
- `std::stoi`, `stol`, `stoll` and `stod` throw `std::invalid_argument` when no digits can be read and `std::out_of_range` when the value does not fit; `std::from_chars` throws nothing (Module 5, lesson 3).
- `new T` throws `std::bad_alloc` when memory runs out, so every container operation that allocates can throw it too.
- `std::cin >> n` never throws by default: a bad token sets the fail bit and leaves `n` zero (Module 18, lesson 1).

## what() and the message

`what()` returns a `const char*`. For `std::runtime_error`, `std::logic_error` and their subclasses the standard promises it is the string you passed to the constructor, so an exception you built carries exactly your words. For the exceptions the library throws itself, the text is whatever the implementation chose: libstdc++ says `stoi` where MSVC says `invalid stoi argument`. Code whose output must be exact — every exercise in this track — catches the library's exceptions and prints its own fixed text, and prints `what()` only for exceptions it threw itself.

## Your own exception types

```cpp
#include <stdexcept>
#include <string>

class BankError : public std::runtime_error {
public:
    using std::runtime_error::runtime_error;   // inherit the constructor that takes the message
};

class InsufficientFunds : public BankError {
public:
    InsufficientFunds(long long needed, long long available)
        : BankError("insufficient funds"), needed_(needed), available_(available) {}
    long long needed() const noexcept { return needed_; }
    long long available() const noexcept { return available_; }
private:
    long long needed_;
    long long available_;
};
```

A small hierarchy lets each caller catch at the level it can handle: the teller loop catches `InsufficientFunds` and asks for a smaller amount, the layer above catches `BankError` and abandons the transaction, `main` catches `std::exception` and reports. Data members carry what a message cannot — the numbers a handler needs in order to act.

## Rethrowing and translating

```cpp
try {
    applyLine(line);
} catch (const std::out_of_range&) {
    throw ConfigError("line " + std::to_string(lineNo) + ": index out of range");   // translate
} catch (const std::exception& e) {
    std::cerr << "line " << lineNo << ": " << e.what() << '\n';
    throw;                                                                            // rethrow the same object
}
```

`throw;` with no operand rethrows the exception currently being handled — the original object, dynamic type intact. `throw e;` throws a *copy* of `e`, sliced if `e` was caught as a base reference. The first handler shows *translation*: a low-level exception is caught at a module boundary and rethrown as a type that means something to the caller, with context added.

## Stack unwinding

Between the `throw` and the handler, every automatic object in every abandoned frame is destroyed, in reverse order of construction, exactly as if each function had returned. This is *stack unwinding*, and it is why destructors — not `finally` blocks — are where C++ cleans up:

```cpp
struct Trace {
    const char* name;
    ~Trace() { std::cout << "leave " << name << '\n'; }
};

void inner() { Trace t{"inner"}; throw std::runtime_error("boom"); }
void outer() { Trace t{"outer"}; inner(); std::cout << "after inner\n"; }

int main() {
    try { outer(); } catch (const std::runtime_error& e) { std::cout << "caught " << e.what() << '\n'; }
}
```

```text
leave inner
leave outer
caught boom
```

`after inner` never prints: the throw leaves `inner`, then `outer`, running both destructors before the handler's first statement. An exception nobody catches calls `std::terminate()`, which aborts the process — the judge reports it as a runtime error — and whether the destructors run before that is implementation-defined, so "an uncaught exception will still close my file" is not a promise you have. `main` gets no handler for free.

Compilers implement exceptions with tables, not checks: a `try` block that never throws costs nothing, while a `throw` that happens costs microseconds — a thousand times a `return`. Exceptions are for the *exceptional* path, not for "key not found" inside a loop; lesson 5 turns that into a strategy per layer.

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `catch (std::exception e)` by value | A copy, sliced to the base; the compiler warns, and `throw e;` from inside throws the slice |
| General handler before a specific one | The specific handler is unreachable; the compiler warns |
| `throw e;` to rethrow | Copies, and slices if `e` is a base reference; use `throw;` |
| Printing `what()` of `std::stoi`'s exception | Implementation-specific text; print your own |
| Expecting `v[i]` to throw | It is undefined behaviour; only `at()` throws |
| No `try` in `main` | An uncaught exception terminates the program |

## Key takeaways

- `throw` creates an exception object and unwinds to the first matching handler; execution resumes after the `try`/`catch`, never at the throw.
- Catch by `const&`, most derived first; a base handler matches every derived type.
- `logic_error` means the program is wrong, `runtime_error` means the world is; `at()`, `stoi` and `new` throw, `[]`, `from_chars` and `>>` do not.
- `what()` is your text for your exceptions and unspecified text for the library's — print your own.
- `throw;` rethrows the original; `throw e;` copies and slices.
- Unwinding runs destructors in reverse; an uncaught exception calls `std::terminate`.
