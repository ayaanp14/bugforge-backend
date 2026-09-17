---
title: From source to executable
minutes: 14
---
`g++ hello.cpp -o hello` looks like one step. It is four programs run in sequence — the preprocessor, the compiler proper, the assembler and the linker — and every C++ error message you will ever read comes from exactly one of them. Knowing which stage produced a message tells you where to look: a compiler error means a file does not make sense on its own; a linker error means the files made sense individually but do not fit together. This lesson walks a two-file program through the pipeline and settles the vocabulary the rest of the track uses: translation unit, declaration, definition, object file, symbol, the one-definition rule.

## A program in two files

```cpp
// mathlib.h — the interface: declarations only
int square(int x);
int cube(int x);
```

```cpp
// mathlib.cpp — the implementation: definitions
#include "mathlib.h"

int square(int x) { return x * x; }
int cube(int x) { return x * square(x); }
```

```cpp
// main.cpp
#include <iostream>
#include "mathlib.h"

int main() {
    std::cout << square(7) << ' ' << cube(3) << '\n';
    return 0;
}
```

Build and run:

```text
$ g++ -std=c++20 -O2 -Wall -c mathlib.cpp     # -> mathlib.o
$ g++ -std=c++20 -O2 -Wall -c main.cpp        # -> main.o
$ g++ mathlib.o main.o -o app                 # link
$ ./app
49 27
```

`-c` means "compile, do not link": each `.cpp` becomes an object file. The last command names no source file at all; it links the two objects into an executable. `g++ mathlib.cpp main.cpp -o app` does all of it in one go, but the three-command form is what a build system (Make, CMake, Ninja) actually runs, and it is why editing `mathlib.cpp` does not force `main.cpp` to be recompiled.

## Stage 1: the preprocessor

The preprocessor is a text tool that runs before the compiler has any idea what C++ is. It handles every line that starts with `#`: `#include "mathlib.h"` is replaced by the entire text of that file; `#define N 100` replaces later `N`s with `100`; `#ifdef`/`#endif` keep or drop regions. `g++ -E main.cpp` prints its output — for the `main.cpp` above, tens of thousands of lines, almost all from `<iostream>`, followed by your ten. That output is the **translation unit**: one `.cpp` file after preprocessing, the unit the compiler compiles at once, and the reason a header is included rather than compiled. Angle brackets (`<iostream>`) search the system include directories; quotes (`"mathlib.h"`) search the including file's directory first, then the same places.

Because inclusion is textual, a header included twice is defined twice, and a class defined twice in one translation unit is an error. Every header therefore guards itself:

```cpp
#pragma once            // or the classic #ifndef MATHLIB_H / #define MATHLIB_H ... #endif
int square(int x);
int cube(int x);
```

## Stage 2: the compiler

The compiler proper parses the translation unit, checks every type, resolves every name it can and generates assembly for the target CPU (`g++ -S main.cpp` writes `main.s` if you want to read it). This is where `-std=c++20` (which edition of the language to accept), `-O2` (how hard to optimise; `-O0` is not at all, `-O3` is hardest) and `-Wall` (report the common mistakes as warnings) matter. Everything the compiler knows comes from the one translation unit in front of it: when it sees `square(7)` in `main.cpp` it needs a **declaration** of `square` — a name and a type — to check the call; it does not need, and never sees, the body in `mathlib.cpp`. It emits a call to a symbol named `square(int)` and leaves a note for the linker: *someone else defines this*.

## Stage 3: the assembler

The assembler turns the assembly text into machine code and packages it as an **object file** (`main.o`; `.obj` on Windows). An object file is not runnable. It holds code and data, a table of the symbols it *defines* (`main`) and a table of the symbols it *needs* (`square(int)`, `cube(int)`, `std::cout`, `operator<<`). `nm main.o` lists both. C++ symbol names are *mangled* — `square(int)` is stored as `_Z6squarei` — so that overloads and namespaces can coexist; `nm -C` demangles them.

## Stage 4: the linker

The linker takes every object file and library, matches each needed symbol to exactly one definition, patches in the addresses and writes the executable. The standard library arrives here too: `std::cout` lives in `libstdc++.so`, which `g++` links automatically. Two things go wrong at this stage, and only at this stage:

```text
$ g++ main.cpp -o app          # forgot mathlib.cpp
/usr/bin/ld: main.o: in function `main':
main.cpp:(.text+0x5): undefined reference to `square(int)'
collect2: error: ld returned 1 exit status
```

**Undefined reference**: something was declared and used, but no object file defines it. The compiler was satisfied — the declaration in the header was all it needed — and the failure surfaces only when the pieces are put together. Causes: a `.cpp` left off the command line, a library not linked, a function declared and never written, or a definition whose signature does not match the declaration (`square(long)` is a different symbol from `square(int)`).

**Multiple definition**: two object files both define the same non-inline function or variable, and the linker refuses to choose. The usual cause is a function *defined* in a header that two `.cpp` files include.

## Declarations, definitions and the one-definition rule

A **declaration** introduces a name and its type: `int square(int x);`, `extern int counter;`, `class Widget;`. A **definition** is a declaration that also provides the thing: the function body, the variable's storage, the class's members. You may declare something as often as you like, and every use needs a declaration visible earlier in the translation unit. The **one-definition rule** (ODR) says a non-inline function or variable must be defined exactly once in the whole program, while a class, a template or an `inline` function may be defined in several translation units as long as every definition is token-for-token identical — which is what lets a class live in a header. Module 4 lesson 6 returns to `inline`, `static` and linkage; Module 8 lesson 6 puts the rule to work in the header/source split.

## The flags this track uses

```text
-std=c++20     the language edition; without it GCC 14 defaults to C++17
-O2            optimise; the judge uses it, so undefined behaviour is folded, not tolerated
-Wall -Wextra  the warnings worth reading (lesson 5)
-c             compile to an object file, do not link
-o name        name the output
-g             debug information for gdb and the sanitizers
```

## Pitfalls

- **A definition in a header.** `int helper() { ... }` in `util.h` included by two files is a multiple-definition link error. Declare in the header, define in one `.cpp` — or mark it `inline`.
- **Reading a linker error as a compiler error.** No line and column in *your* file, and the words `undefined reference` or `ld returned`, mean the compile succeeded; look at what you linked, not at your syntax.
- **Mismatched declaration and definition.** `void print(const std::string&)` declared and `void print(std::string)` defined are two overloads; the call binds to the declared one and the link fails.
- **Trusting `#include` to be more than text.** A header that uses `std::string` without including `<string>` works in one file and fails in the next.

## Key takeaways

- Preprocess (text: `#include`, `#define`) → compile (one translation unit → assembly) → assemble (object file) → link (resolve symbols → executable).
- A translation unit is a `.cpp` after preprocessing; headers are included, never compiled on their own.
- A declaration names a thing; a definition provides it. Declare in headers, define once in a `.cpp`.
- Compiler errors are per file and carry a line and column; `undefined reference` is the linker, and means no object file defines the symbol.
- The one-definition rule: one definition per program for functions and variables; identical definitions per translation unit for classes, templates and `inline`.
