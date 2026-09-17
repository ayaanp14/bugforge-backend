---
title: What C++ is, and why it looks the way it does
minutes: 12
---
C++ is a statically typed, compiled, multi-paradigm language built on one promise: you do not pay for what you do not use, and what you do use costs no more than the hand-written equivalent. Almost everything that makes C++ different from Java or Python — no garbage collector, no bounds checks unless you ask for them, values that are copied rather than shared, a whole category of mistakes the standard refuses to define — follows from that promise. This lesson is the map of those decisions; the other nineteen modules are the territory.

## Where it came from

In 1979 Bjarne Stroustrup, at Bell Labs, wanted Simula's classes with C's speed and started "C with Classes"; the name became C++ in 1983 (`++` is C's increment operator — one more than C). The first compiler, Cfront, translated C++ into C, which is why early C++ ran wherever C did. The language grew for fifteen years before its first ISO standard and has been revised on a three-year rhythm since 2011:

| Standard | Year | What it brought |
| --- | --- | --- |
| C++98 / C++03 | 1998 / 2003 | The first standard: templates, exceptions, namespaces, the STL; 03 was a bug-fix release |
| C++11 | 2011 | The "modern C++" reset: `auto`, lambdas, move semantics, `std::unique_ptr`, range-based `for`, `std::thread` |
| C++14 | 2014 | Polish: generic lambdas, return-type deduction, digit separators |
| C++17 | 2017 | Structured bindings, `std::optional`/`variant`/`string_view`, `if constexpr`, guaranteed copy elision |
| C++20 | 2020 | Concepts, ranges, `std::format`, `<=>`, `std::span`, modules and coroutines |
| C++23 | 2023 | `std::print`, `std::expected`, deducing `this`, `std::mdspan` |

"Modern C++" means the language as it has been since C++11. The idioms this track teaches — RAII, smart pointers, value semantics, algorithms over hand-written loops — are the C++11-and-later way, and much of what you will read online about C++ predates them.

## The zero-overhead principle

Stroustrup states it as two rules: *what you don't use, you don't pay for*, and *what you do use, you couldn't hand-code any better*. A `std::vector<int>` is a pointer, a size and a capacity — the same three words a hand-managed growable array needs — and indexing it is one multiply and one add, exactly the machine code a C array produces. A class with no virtual functions carries no hidden pointer; a destructor that does nothing costs nothing. The principle is why C++ has no garbage collector (you would pay for it whether or not you wanted it) and why `operator[]` on a vector does not check bounds (call `at()` when you want the check).

## Compiled to native code

There is no virtual machine. A C++ compiler reads your source and emits machine instructions for one CPU and one operating system; the result is an executable the OS loads directly.

```text
$ g++ -std=c++20 -O2 -Wall hello.cpp -o hello
$ ./hello
Hello, world
```

The program starts in microseconds and runs at the speed of the hardware; the compiler sees every type and can inline, unroll and fold across function boundaries; and the binary you built on Linux x86-64 will not run on an ARM Mac — you rebuild per platform. Lesson 2 walks through the pipeline stage by stage.

## Static typing

Every variable, parameter and expression has a type the compiler knows before the program runs, and the compiler refuses a program whose types do not fit. `int n = "seven";` is not a run-time error to be caught; it is a program that does not exist.

```cpp
int count = 3;
double ratio = count / 2;   // integer division: 1, then converted to 1.0
std::string s = count;      // error: no viable conversion from int to std::string
```

The second line compiles with a surprise — integer division — because C++ inherited C's implicit conversions among the arithmetic types; the third does not compile at all. Static typing is why so many bugs surface as a compile error rather than a 3 a.m. page. Module 2, Fundamental types, covers the types and their conversions.

## Value semantics

In Java, `b = a` makes two references to one object. In C++, `b = a` makes a second object with the same contents:

```cpp
#include <iostream>
#include <string>

int main() {
    std::string a = "hello";
    std::string b = a;        // a copy: separate characters, separate lifetime
    b += " world";
    std::cout << a << '\n';   // hello
    std::cout << b << '\n';   // hello world
    return 0;
}
```

Variables *are* objects; they are not handles to objects. Passing an argument copies it unless you ask for a reference (`const std::string&`), and assigning copies; sharing is explicit in the type. This is what lets a destructor run at a predictable moment — the object dies with its variable — and it is why Module 9, Copies, moves and the rule of five, exists: when copying is the default, what a copy *means* for a type that owns a resource has to be defined.

## Undefined behaviour as a design decision

The C++ standard leaves some operations **undefined**: signed integer overflow, indexing past the end of an array, reading an uninitialised variable, dereferencing a null pointer, using an object after it has been destroyed. Undefined does not mean "crashes"; it means the standard makes no promise at all, and the optimiser is allowed to assume it never happens. A bounds check you wrote *after* an out-of-bounds read may be deleted, because if the read happened the program was already outside the rules.

This is the zero-overhead principle applied to correctness: checking every index and every addition would cost every program something, so the language does not, and the responsibility is yours. Working C++ programmers cope with tools (`-Wall -Wextra`, the sanitizers — lesson 5), with habits (containers instead of raw arrays, brace initialisation, `at()` when the index comes from input) and with knowing the catalogue, which Module 19, Performance and undefined behaviour, lays out in full.

## C and C++

C++ began as an extension of C and still compiles most C. It adds classes, templates, references, overloading, namespaces, exceptions, the standard library, and `new`/`delete` in place of `malloc`/`free`. Modern C++ uses almost none of the C parts directly: `std::string` instead of `char` arrays, `std::vector` instead of `malloc`, `std::cout` instead of `printf`. "C/C++" on a job advert names two languages with different idioms, and an interviewer notices a C programmer writing C++ as C.

## Where C++ is used

The language is chosen where the cost model matters: game engines, browsers, databases, trading systems, embedded and automotive software, compilers (LLVM, GCC), the cores of machine-learning frameworks and operating-system components. All of them rely on the core this track teaches: the type system, ownership and RAII, the containers and algorithms, and what the compiler does with your code.

## What "C++20" means, and what this track runs on

A standard is a document; a compiler implements some version of it, and you ask for one with a flag. The three compilers that matter are GCC (`g++`), Clang (`clang++`) and Microsoft's MSVC (`cl`). The study judge behind every exercise in this track compiles with **Clang 18, `-std=c++20`, `-O2`, libstdc++ 14, on x86-64 Linux**, with 5 s of CPU and 256 MB of memory per run. Concepts, ranges, `std::format`, `std::span` and `<=>` all compile there; the C++23 additions (`std::print`, `std::expected`) do not, and the track teaches them as reading. Every exercise is a whole program: `int main()` reads standard input, prints to standard output and returns 0. A non-zero exit code or an uncaught exception is a runtime error, and only standard output is compared.

## Pitfalls on day one

- **Expecting a runtime to catch you.** There is no exception for an out-of-bounds index on a plain array; there is undefined behaviour. Use `std::vector` and `at()` until Module 6 shows you when a raw array is right.
- **Writing C in a `.cpp` file.** `char name[100]; scanf("%s", name);` compiles, and it is how buffer overflows are born. `std::string name; std::cin >> name;` is the C++.
- **`#include <bits/stdc++.h>`.** A GCC-specific header that pulls in the entire library: fine in a contest, meaningless to MSVC, and it hides which headers your code needs. Include the real ones.

## Key takeaways

- C++ (Stroustrup, 1979–83) is standardised every three years; C++11 reset the idioms, and C++20 is what this track compiles.
- The zero-overhead principle explains most of the design: no garbage collector, no default bounds checks, abstractions that compile away.
- Compiled to native code, statically typed, and values are values: `b = a` copies.
- Undefined behaviour is the price of not checking everything; you pay it with tools and habits, not with a slower program.
- The judge is Clang 18, `-std=c++20 -O2`, Linux x86-64; every exercise is `int main()` reading stdin and returning 0.
