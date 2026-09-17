---
title: Compilers, warnings and reading error messages
minutes: 14
---
A C++ compiler is the most thorough reviewer your code will ever have, and it works for free — if you read what it says. This lesson teaches the shape of a diagnostic so that you can read it like a stack trace: which file, which line and column, what kind of message, and what the notes underneath are pointing at. It also covers the warning flags worth turning on, what a template error and a linker error look like, and the two run-time tools — sanitizers and a debugger — that catch what the compiler cannot.

## The three compilers

| Compiler | Driver | Where | Notes |
| --- | --- | --- | --- |
| GCC | `g++` | Linux default, MinGW on Windows | Ships libstdc++, the standard library most Linux C++ uses |
| Clang | `clang++` | macOS default (Apple Clang), Linux, Windows | LLVM-based; famously readable diagnostics; uses libstdc++ or its own libc++ |
| MSVC | `cl` | Windows, Visual Studio | Different flag syntax (`/W4`, `/std:c++20`) and a different message format |

GCC and Clang accept the same flags and produce diagnostics in the same `file:line:col: kind: message` shape, so what you learn on one transfers. The study judge is **Clang 18 with libstdc++ 14**, `-std=c++20 -O2`; the local gate this track was written against is GCC 14 with `-Wall -Wextra`. Code that is clean on either compiles on the other unless it leans on a compiler extension — variable-length arrays, `__int128`, `#include <bits/stdc++.h>` — which is why the track avoids them.

## Anatomy of a compile error

```cpp
#include <iostream>

int main() {
    int total = 0;
    for (int i = 0; i < 3; ++i) {
        totl += i;
    }
    std::cout << total << '\n';
}
```

```text
main.cpp:6:9: error: use of undeclared identifier 'totl'; did you mean 'total'?
    6 |         totl += i;
      |         ^~~~
      |         total
main.cpp:4:9: note: 'total' declared here
    4 |     int total = 0;
      |         ^
1 error generated.
```

Read it left to right. `main.cpp:6:9` — file, line 6, column 9; every editor can jump there. `error` — the severity: an *error* stops the build, a *warning* does not, a *note* is not a problem at all but context for the message above it. Then the message, often with a suggestion. The source line and the caret show exactly which token, and the `note:` says where the related declaration is. `1 error generated.` is Clang's summary; GCC ends with nothing.

Two habits: **fix the first error first**, because one missing semicolon or unknown type cascades into dozens of nonsense errors below it; and **read the notes**, because for an overload or template failure the note chain (`candidate function not viable: ...`) is the actual explanation.

## Warnings, and which flags to turn on

A warning is the compiler saying "this is legal and probably wrong". `-Wall` enables the ones almost always worth fixing; `-Wextra` adds a second tier; `-Wpedantic` complains about extensions the standard does not allow; `-Werror` turns every warning into an error, so a build with warnings fails — which is how teams keep the count at zero.

| Warning (flag) | What it catches | Why it matters |
| --- | --- | --- |
| unused variable (`-Wunused-variable`) | a name declared and never read | usually a typo elsewhere, or dead code |
| may be used uninitialised (`-Wuninitialized`, `-Wmaybe-uninitialized`) | a read before any write | undefined behaviour; initialise with `{}` |
| control reaches end of non-void function (`-Wreturn-type`) | a missing `return` on some path | undefined behaviour, and `-O2` makes it bite |
| comparison of integers of different signs (`-Wsign-compare`) | `i < v.size()` with `int i` | the `int` converts to unsigned; `-1 < v.size()` is false |
| unused value (`-Wunused-value`) | `x + 1;` | a statement with no effect |
| `-Wshadow` (not in `-Wall`) | an inner variable hiding an outer one | the bug from lesson 3 |
| `-Wconversion` (not in `-Wall`) | `int x = 3.7;`, `long` into `int` | silent narrowing |

Build with `-Wall -Wextra` from day one. A warning you have decided is harmless is noise that hides the next real one; fix it, or silence that one case deliberately, never by lowering the flags.

## A template error

Template errors are long because the compiler reports the failure where it happened — deep in the library — and then the chain of instantiations that led there. Sorting a vector of a type that has no `<`:

```text
/usr/include/c++/14/bits/predefined_ops.h:45:23: error: no match for 'operator<' (operand types are 'const Point' and 'const Point')
   45 |       { return *__it1 < *__it2; }
      |                ~~~~~~~^~~~~~~~
main.cpp:12:14:   required from here
   12 |     std::sort(points.begin(), points.end());
      |     ~~~~~~~~~^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

Read the **first line** for the actual problem (`no match for 'operator<'` on two `Point`s) and the **`required from here`** line (Clang says `in instantiation of ... requested here`) for *your* line that triggered it. Everything in between is the library's plumbing. C++20 concepts (Module 12 lesson 5) exist largely to turn this wall of text into one line: `constraints not satisfied`.

## A linker error

```text
/usr/bin/ld: main.o: in function `main':
main.cpp:(.text+0x1a): undefined reference to `compute(int)'
collect2: error: ld returned 1 exit status
```

No `error:` with a column, `ld` or `collect2` in the text, and `undefined reference` (or `undefined symbol` from Clang's `lld`): the compile stage passed, and the linker cannot find a definition. Lesson 2 listed the causes — a file not on the command line, a library not linked, a declaration whose definition was never written or does not match.

## Sanitizers: the checks the compiler cannot do

Undefined behaviour is invisible at compile time by design. The sanitizers add the checks at run time:

```text
$ g++ -std=c++20 -g -O1 -fsanitize=address,undefined main.cpp -o main
$ ./main
main.cpp:7:14: runtime error: signed integer overflow: 2147483647 + 1 cannot be represented in type 'int'
=================================================================
==4242==ERROR: AddressSanitizer: heap-buffer-overflow on address 0x602000000034
READ of size 4 at 0x602000000034 thread T0
    #0 0x55d4 in main main.cpp:9
```

**AddressSanitizer** (ASan) reports out-of-bounds reads and writes, use-after-free, double free and leaks, with a stack trace naming your line. **UndefinedBehaviorSanitizer** (UBSan) reports signed overflow, bad shifts, null dereference and misaligned access. `-g` gives the reports line numbers. The program runs two to three times slower, so these are development flags, never release ones — and the judge, which compiles with plain `-O2`, cannot tell you *why* a run failed, only that it did. Module 7 lesson 6 and Module 19 use them on the memory-error catalogue.

## A debugger, in outline

Build with `-g -O0` (debug information, no optimisation, so variables and lines are where you expect them), then:

```text
$ gdb ./main
(gdb) break main.cpp:9        # stop at line 9
(gdb) run < input.txt         # start, feeding the file as stdin
(gdb) next                    # execute one line, stepping over calls
(gdb) step                    # execute one line, stepping into calls
(gdb) print total             # show a variable
(gdb) backtrace               # the call stack: where am I, and how did I get here
(gdb) continue                # run to the next breakpoint
```

`lldb` (Clang's debugger) has the same commands with slightly different spellings, and every IDE wraps one of the two. The one command to know from memory is `backtrace` after a crash: it names the line that failed and the calls that led to it.

## Pitfalls

- **Reading only the first word of the first error** and guessing. Read the location, the message and the note.
- **Fixing the last error first.** The first is the cause; the rest are often its consequences.
- **A warning-free build with `-w`.** That flag suppresses all warnings; it is how bugs become invisible.
- **Debugging optimised code.** At `-O2` variables vanish and lines reorder; build with `-O0 -g` to debug.

## Key takeaways

- A diagnostic is `file:line:col: severity: message`, followed by the source line, a caret and notes; errors stop the build, warnings do not, notes explain.
- Fix the first error first and read the notes; for a template error, the first line and `required from here`.
- `-Wall -Wextra` always; `-Werror` to keep a codebase at zero warnings; never `-w`.
- `undefined reference` with `ld` in the text is the linker, not the compiler.
- `-fsanitize=address,undefined` with `-g` finds memory errors and UB at run time; the judge (Clang 18, `-std=c++20 -O2`) has no sanitizers, so test locally with them.
