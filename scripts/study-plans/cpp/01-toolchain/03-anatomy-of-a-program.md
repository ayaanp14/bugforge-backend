---
title: Anatomy of a C++ program
minutes: 13
---
Every C++ program you will write in this track has the same skeleton: some `#include` lines, perhaps a few functions, and `int main()`, inside which statements run from the first brace to the last. This lesson takes that skeleton apart — what an include is, what `main` must look like, why `std::` is everywhere and when `using` is acceptable, what counts as a statement, how blocks make scopes, and what the number `main` returns means to the world outside the program.

## The smallest complete program

```cpp
#include <iostream>

int main() {
    std::cout << "Hello, world\n";
    return 0;
}
```

Line by line. `#include <iostream>` pastes in the declarations of the standard streams (lesson 2 explained why it is a paste). `int main()` is the function the operating system calls; every program must define it, and its name and return type are fixed. `std::cout << "Hello, world\n";` is a statement: `std::cout` is the standard output stream, `<<` sends the string to it, and the `\n` inside the literal is a newline. `return 0;` hands the exit code back to whoever ran the program.

`main` has two legal signatures — `int main()` and `int main(int argc, char* argv[])`, the second receiving the command-line arguments as an array of C strings — and it must return `int`; `void main()` is a compiler extension the standard rejects. Uniquely, `main` may omit its `return`: falling off the closing brace returns 0. Any other non-void function that falls off its end is undefined behaviour, which is why `-Wall` warns about it (`-Wreturn-type`).

## Headers you will include

Each standard facility lives in a header, and nothing is available until it is included:

| Header | Provides |
| --- | --- |
| `<iostream>` | `std::cin`, `std::cout`, `std::cerr` |
| `<string>` | `std::string`, `std::getline`, `std::to_string` |
| `<vector>`, `<array>`, `<map>`, `<set>` | the containers |
| `<algorithm>`, `<numeric>` | `std::sort`, `std::max`, `std::accumulate`, … |
| `<iomanip>` | `std::setw`, `std::setprecision`, `std::fixed` |
| `<cmath>` | `std::sqrt`, `std::pow`, `std::abs` on doubles |

Include what you use, even when it happens to compile without: one standard library's `<iostream>` pulls in `<string>` and another's does not, and code that depended on the accident breaks when the compiler changes. The C headers are spelt with a `c` prefix and no `.h` (`<cmath>`, `<cstdio>`), which puts their names inside `std::`.

## Namespaces and `std::`

Every name in the standard library — `cout`, `string`, `vector`, `sort` — sits inside the namespace `std`, and `std::cout` reads as "the `cout` inside `std`". `::` is the scope-resolution operator. A namespace is a named scope whose only purpose is to keep names apart: your `max` and the library's `std::max` can coexist, and so can two libraries that both define a `Logger`.

```cpp
namespace geometry {
    double area(double w, double h) { return w * h; }
}

namespace finance {
    double area(double principal, double rate) { return principal * rate; }   // a different function
}

int main() {
    double a = geometry::area(3.0, 4.0);    // 12
    double b = finance::area(100.0, 0.05);  // 5
    return 0;
}
```

There are two ways to shorten `std::`:

```cpp
using std::cout;        // a using-declaration: this one name, in this scope
using namespace std;    // a using-directive: every name in std, in this scope
```

The declaration is precise and safe. The directive is the one you will see in tutorials and contest code, and it works — until it does not. `std` contains `count`, `size`, `max`, `min`, `swap`, `left`, `right` and `hex`; a variable of your own called `count` then either hides the library's or, when both are visible, is *ambiguous*, a compile error that appears only when you add the include that brings the clash in. Inside a header the directive is unforgivable: it forces itself on every file that includes the header. This track writes `std::` explicitly everywhere except Module 20, which explains the contest trade-off. Five characters is a small price for never guessing where a name came from.

## Statements and expressions

An **expression** computes a value: `x + 1`, `square(7)`, `a = b` (assignment is an expression whose value is the assigned value, which is why `a = b = 0` works). A **statement** is a unit of execution; it ends in `;` or is a block. Most statements are one of:

- an *expression statement* — any expression followed by `;`: `total += x;`, `std::cout << x;`, `square(7);` (result discarded), and even `x + 1;`, which is legal, does nothing and earns a `-Wunused-value` warning;
- a *declaration statement* — `int n = 0;`, `std::string line;`;
- a *compound statement* or **block** — zero or more statements in braces;
- a control statement — `if`, `for`, `while`, `switch`, `return` (Module 3).

`;` on its own is the empty statement, which is how `for (...);` becomes a loop with no body.

## Blocks and scope

A name is visible from its declaration to the end of the block that contains it. Blocks nest, and an inner declaration of the same name **shadows** the outer one until the inner block closes:

```cpp
#include <iostream>

int main() {
    int x = 1;
    {
        int x = 2;            // a different x, shadowing the outer one
        std::cout << x;       // 2
    }                         // the inner x is destroyed here
    std::cout << x << '\n';   // 1 -> the program prints "21"
    return 0;
}
```

Loop variables, `if`-initialiser variables and function parameters follow the same rule: they live in the block they belong to and die at its end. Declare a variable at the latest point you can, in the smallest block that needs it; it is the C++ habit that makes lifetimes obvious, and Module 7 shows how much depends on an object's lifetime being exactly its block. `-Wshadow` (not part of `-Wall`) reports shadowing when you want it flagged.

## Functions before use

The compiler reads a translation unit top to bottom and must see a declaration of a function before a call to it. Define helpers above `main`, or declare them above and define them below:

```cpp
#include <iostream>

long long square(long long x);   // declaration (a prototype)

int main() {
    std::cout << square(1'000'000) << '\n';   // 1000000000000: long long, or it overflows
    return 0;
}

long long square(long long x) { return x * x; }   // definition
```

`1'000'000` uses a digit separator (C++14); the compiler ignores the apostrophes. Module 4 covers functions properly.

## Comments

`//` runs to the end of the line; `/* ... */` spans lines and does not nest. Comments explain *why* — the invariant a loop keeps, the reason for a limit — not what the code visibly does. `// increment i` is noise; `// n is at most 10^5, so i * i fits in int` is a comment the next reader will thank you for.

## What `main` returns

The `int` from `main` is the process's **exit code**. Zero means success; anything else means failure, and shells, build tools and the study judge all read it: a program that prints the right answer and then executes `return 1;` is marked as a runtime error, because the judge trusts the exit code before it trusts the output. `<cstdlib>` names the conventional values `EXIT_SUCCESS` and `EXIT_FAILURE`. An uncaught exception ends the program with a non-zero code as well (Module 15). For everything in this track: compute, print, `return 0`.

## Pitfalls

- **`using namespace std;` in a header**, or above code that defines its own `count`, `size` or `max`.
- **A missing `return` in a non-void function.** Legal for `main`, undefined behaviour anywhere else, and the optimiser will happily produce nonsense. Read the `-Wreturn-type` warning.
- **A stray semicolon.** `if (x > 0);` and `for (int i = 0; i < n; ++i);` both compile and do nothing useful.
- **Calling a function defined lower in the file** with no declaration above the call: `'square' was not declared in this scope`.

## Key takeaways

- A program is includes, functions and `int main()`; `main` returns the exit code, and it alone may omit `return` (yielding 0).
- Library names live in `std`; write `std::`, and reserve `using namespace std;` for contest scratch, never for headers.
- Expressions produce values; statements execute; `x + 1;` compiles and does nothing.
- Names live from their declaration to the end of their block; inner declarations shadow outer ones; declare before use.
- A non-zero exit code means failure everywhere, including on the judge.
