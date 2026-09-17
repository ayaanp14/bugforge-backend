---
title: Declarations and definitions — the shape of a function
minutes: 12
---
A C++ program is a set of functions calling each other, and `main` is only the one the runtime calls first. This lesson settles the vocabulary (signature, parameter, argument, prototype), the difference between *declaring* a function and *defining* it, why the order of functions in a file matters and how a forward declaration lifts the constraint, what `void` and the implicit `return 0` of `main` mean, and why small functions are the unit that testing, reuse and reading are built on.

## Anatomy of a function

```cpp
long long cube(long long x) {   // head: return type, name, parameter list
    return x * x * x;           // body: statements, ending in a return
}
```

The **return type** says what the call evaluates to. The **parameters** are the local variables the call initialises from the caller's **arguments** — `cube(3)` copies `3` into `x`: the parameter is the variable in the definition, the argument is the value at the call site.

A function's **signature** is its name plus the types of its parameters — `cube(long long)`. The return type is not part of it, which is why two functions cannot differ only in what they return (Lesson 3 returns to this when overloading). Everything after the head is the **body**, one block whose statements run top to bottom until a `return` or the closing brace.

## Declaration versus definition

A **declaration** tells the compiler a name exists and what type it has. A **definition** provides the thing itself. For a function the declaration is the head followed by a semicolon — a **prototype** — and the definition is the head followed by a body:

```cpp
long long cube(long long x);   // declaration: "there is a function with this signature"
long long cube(long long);     // the same declaration — parameter names are optional here

long long cube(long long x) {  // definition: the code
    return x * x * x;
}
```

A definition is also a declaration. A program may declare a function as many times as it likes, in as many translation units as it likes, but must define it exactly once across the whole program — the one-definition rule from Module 1, lesson 2. The two halves fail in different places when they are missing:

```text
main.cpp:7:18: error: 'cube' was not declared in this scope
```

is the *compiler* refusing a call to a name it has not seen — a missing declaration.

```text
/usr/bin/ld: main.o: in function `main': undefined reference to `cube(long long)'
```

is the *linker* failing to find the code — a declaration was seen, a definition never was. The `(long long)` in the message is the signature; a definition of `cube(int)` would not satisfy it, which is the most common way a "but I did define it" turns out to be a mismatched parameter type.

## Order in the file

The compiler reads a translation unit from top to bottom and must have seen a declaration of a function before the first call to it. That leaves two layouts. Bottom-up puts every helper above `main`, definitions only, so a reader meets the pieces before the whole. Top-down puts prototypes at the top and `main` first, so the file reads like a table of contents followed by the chapters:

```cpp
#include <iostream>

bool isEven(int n);      // the interface, at a glance
int halve(int n);

int main() {
    int n = 0;
    std::cin >> n;
    if (isEven(n)) std::cout << halve(n) << '\n';
    else std::cout << "odd\n";
}

bool isEven(int n) { return n % 2 == 0; }
int halve(int n) { return n / 2; }
```

The prototype form scales: a header file is nothing but a list of prototypes any source file can `#include` (Module 8, lesson 6 builds one), and two functions that call each other — `isEven` written in terms of `isOdd` and back — need a forward declaration, because whichever comes first needs the other. The exercises in this module use this layout: the reading scaffold in `main` stays at the top and the functions you write sit below it.

## `void`, `return`, and the exit code of `main`

A function that produces no value has return type `void`. Its body may end without a `return`, or use a bare `return;` to leave early:

```cpp
void printBanner(const std::string& title) {
    if (title.empty()) return;          // nothing to print
    std::cout << "== " << title << " ==\n";
}
```

A non-`void` function must return a value on every path. Falling off the end of one is not a compile error — it is **undefined behaviour**, and the optimiser may assume it never happens. `-Wall` reports it as `control reaches end of non-void function`; treat that warning as an error.

`main` is the one exception: if control reaches its closing brace, the program returns `0`. That value is the process's **exit code**; zero means success, anything else failure, and the study judge marks a non-zero exit as a runtime error however correct the output looked. Write `return 0;` or leave it out — both are fine — but never `return 1;` on a path that succeeded.

## `[[nodiscard]]`

Some results are the whole point of the call. A function that reports success, computes a value, or hands back an error state should not be callable as a bare statement by mistake:

```cpp
[[nodiscard]] bool tryParse(const std::string& text, int& out);

tryParse(line, value);            // warning: ignoring return value of 'tryParse', declared with attribute 'nodiscard'
if (tryParse(line, value)) { /* use value */ }
```

The attribute goes before the return type on the declaration and turns a silently ignored result into a warning. `std::vector::empty()` is `[[nodiscard]]` since C++20 because `v.empty();` as a statement is nearly always someone who meant `v.clear()`. Put it on predicates and pure computations; leave it off functions called for their side effect.

## Functions are the unit of testing

A function with one job, whose result depends only on its parameters, can be checked in isolation: call it with a known input, compare with the known answer. That is what "unit" in unit test means, and it is why the exercises in this track name the functions they want: a `clamp(value, lo, hi)` can be tested with three calls; a `main` that does the clamping inline in a loop cannot be tested without running the whole program.

```cpp
bool check(const std::string& name, int actual, int expected) {
    if (actual == expected) { std::cout << "PASS " << name << '\n'; return true; }
    std::cout << "FAIL " << name << ": expected " << expected << " got " << actual << '\n';
    return false;
}
```

Ten lines like this are a test harness. Prefer functions that are **pure** — no globals, no printing, no hidden state — because they are the ones a harness can check; keep the I/O in `main`. Name a function for what it does or answers: verbs for actions (`readGrid`), `is`/`has` for predicates (`isPrime`), nouns for computations (`mean`); a function that needs "and" in its name is two functions.

## Pitfalls

- **Semicolon after the head of a definition.** `int f(int x); { return x; }` declares `f` and then presents a stray block; the compiler reports the `return` as being outside any function.
- **Calling before declaring.** The error names the function as "not declared in this scope" even though it is defined twenty lines lower. Move it up or add a prototype.
- **Definition inside a function.** C++ has no nested functions; the closest thing is a lambda (Lesson 5).
- **Missing return.** Undefined behaviour, not an error. Compile with `-Wall` and read the warnings.

## Key takeaways

- A signature is the name plus the parameter types; the return type is not part of it.
- Declare as often as you like; define exactly once. "Not declared in this scope" is a compiler error, "undefined reference" is a linker error.
- A function must be declared before the point of use — prototypes at the top let `main` come first and make mutual recursion possible.
- A non-`void` function must return on every path (falling off the end is undefined behaviour); `main` alone returns `0` implicitly, and that number is the exit code.
- `[[nodiscard]]` turns an ignored result into a warning; small pure functions are what unit tests check.
