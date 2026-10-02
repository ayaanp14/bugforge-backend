---
updated: 2026-10-03
question: What does the C (Intermediate) skill test cover?
answer: It examines C the way working code uses it: pointers to pointers and const pointers, function pointers and qsort comparators, malloc, realloc and free and how they fail, struct padding, unions and enums, linkage across files, macros, bit manipulation, string.h traps and undefined behaviour. Most questions show a short program and ask what it prints; then you solve coding problems in C.
q: Which compiler and platform do the C Intermediate questions assume?
a: C17 as Clang compiles it on a 64-bit Linux system, where int is 4 bytes and long and pointers are 8. A question whose answer depends on sizes or alignment says which model it assumes, and no answer depends on whether plain char is signed, because that differs between x86 and ARM.
q: Do I need to quote the C standard to pass the C Intermediate test?
a: No clause numbers are asked. You do need to tell undefined behaviour, such as signed overflow, unsequenced side effects or a pointer past the end of an array, from behaviour that is only implementation-defined or unspecified, such as the signedness of plain char or the order in which function arguments are evaluated. Several questions turn on exactly that difference.
q: Is knowing C++ enough for the C Intermediate test?
a: Much of it carries over, but C and C++ differ in places the test visits: the type of a character constant, what may initialise a static local variable, conversions to and from void pointers, what an enum variable may hold, and the sequencing rules C++17 tightened. If you mostly write C++, check those differences before you sit.
q: Should I take C Basic before C Intermediate?
a: Not necessarily; each credential stands on its own. The Basic test covers types, operators, loops, functions, arrays, simple strings and single pointers. If those are settled and you write C at work or in a systems course, start here. If pointer arithmetic or string termination still needs careful thought, sit Basic first.
q: What is the coding section of the C Intermediate test like?
a: You solve problems from the catalogue, and the editor accepts only C for this test. Run checks the visible cases and Submit runs every hidden one, with credit for each case passed. C has no containers in its library, so expect to size arrays, handle strings and write helpers such as a qsort comparator yourself.
---

The C (Intermediate) test is for people who write C beyond exercises: systems and embedded code, a university course in operating systems or compilers, or interviews for roles where C is the working language. It assumes the basics are settled and asks what happens at the edges — when a pointer is passed by value, when `realloc` moves a block, when a macro expands into something its author did not mean, and when the standard stops promising anything at all.

The paper is multiple-choice questions, then coding problems answered in C. Most questions show a short, complete program and ask exactly what it prints. Others show a fragment and ask what is wrong with it, whether it compiles, or which of several statements the standard guarantees; a few ask you to select every correct option. Programs assume C17 on a 64-bit Linux system, and any question that depends on sizes or struct layout names the model it uses.

## What each topic examines

The questions are spread across twelve topics, and your result breaks the score down by them.

- **Types and basics.** The usual arithmetic conversions when signed meets unsigned, the promotion of small integer types before arithmetic, what `sizeof` measures, comparing floating-point values, and what `volatile` does and does not promise.
- **Operators and control flow.** Truncating division and the sign of `%`, short-circuit evaluation with side effects, the comma operator, precedence traps such as `&` against `==`, and `switch` fall-through.
- **Functions.** Function pointers and tables of them, `qsort` comparators that are correct for every input, variadic functions with `stdarg.h`, reading declarations that mix pointers and functions, and what C leaves open about argument evaluation.
- **Arrays.** When an array decays to a pointer and when it does not, array parameters, designated initialisers, pointer arithmetic on `a` and on `&a`, and passing two-dimensional arrays. [Array problems](/challenges/arrays) and [matrix problems](/challenges/matrix) solved in C are good practice.
- **Strings.** What `strncpy`, `snprintf`, `strchr` and `strrchr` actually do, sizing a buffer with room for its terminator, and why plain `char` is a poor type for raw bytes. Work through [string problems](/challenges/strings) without a string class to lean on.
- **Pointers.** Pointers to pointers, `const` on either side of the `*`, `*p++` and its relatives, `void *`, and walking NULL-terminated arrays of pointers. A [linked list](/roadmap/linked-list) written in C exercises most of it.
- **Dynamic memory.** `malloc`, `calloc`, `realloc` and `free`, how each one fails, growing a buffer by doubling, `memmove` against `memcpy`, and what byte-wise functions do to an array of `int`.
- **Structs, unions and enums.** Padding and alignment, what `offsetof` does and does not guarantee, what struct assignment copies, bit-fields, unions and enumeration constants.
- **Scope and storage classes.** `static` locals, shadowing, `extern` declarations against definitions, internal and external linkage across files, and which objects start at zero.
- **The preprocessor.** Parenthesising macros, arguments evaluated twice, the `#` and `##` operators, X-macros, include guards and conditional compilation.
- **Bitwise operations.** Setting, clearing, toggling and testing bits, isolating the lowest set bit, power-of-two checks, extracting bytes and which shifts are undefined. The [bit manipulation lesson](/roadmap/bit-manipulation) and its [practice problems](/challenges/bit-manipulation) cover the idioms.
- **Undefined behaviour.** Recognising it — signed overflow, unsequenced side effects, dangling pointers, type punning through casts, pointers past the end of an array — and knowing what an optimising compiler may do once it is there.

## How to prepare

Write and run small programs rather than only reading rules. When you are unsure what an expression does, predict the output, then compile it with warnings on (`-Wall -Wextra`) and compare. Build the same programs with `-fsanitize=address,undefined`: the sanitizers report out-of-bounds access, use after free and signed overflow at the line where they happen, and seeing a report for code you believed was fine is the fastest way to learn where the edges are.

Learn the contracts of the library functions you use, not just their names. For each function in `string.h` and `stdlib.h`, know what it returns on failure, whether it always writes a terminator, what its return value counts, and whether it allows its source and destination to overlap. Most memory and string questions come down to one of those four facts.

Practise reading declarations from the name outwards until a pointer to a function returning a pointer reads as easily as an `int`. Do the same with macros: expand them by hand, textually, before deciding what they compute.

For output prediction in general, the [Programming Fundamentals](/aptitude/programming-fundamentals) questions include C programs to trace. For the coding section, solve a few [sorting problems](/challenges/sorting) in C with `qsort` and your own comparator, and time yourself, since there is no library container to fall back on.

## What trips people up

**Mixing signed and unsigned.** A `size_t` loop counter that counts down, or a comparison between an `int` and an `unsigned`, silently changes meaning. Know which operand converts to which type, and when.

**"It worked when I ran it."** Undefined behaviour often produces the answer you expected, until the optimisation level, the compiler or the input changes. The test asks what the standard says, so a program that happens to print something on one machine is not the same as one that is defined to print it.

**Trusting a function's name.** `strncpy` is not a safe `strcpy`, `realloc` is not guaranteed to grow a block in place, and `memset` does not set elements. Each does exactly what its specification says and no more.

**Assuming one platform.** Plain `char` is signed on x86 and unsigned on ARM Linux, `long` is 8 bytes on 64-bit Linux and 4 on 64-bit Windows, and struct padding follows the ABI. Questions that depend on such a choice name it; your own code should not depend on it at all.

**C++ habits.** C and C++ share a syntax but not every rule. If you mostly write C++, read up on where they part ways, especially around initialisation, implicit conversions and sequencing.

## How it differs from C (Basic)

[C (Basic)](/skill-tests/c-basic) checks the language a few months of use teaches: types, operators, loops, functions, arrays, simple strings and single pointers, read in short programs. Intermediate takes those as given. Its pointer questions are about pointers to pointers and `const`, its string questions about the library's exact contracts, and it adds what Basic leaves out — managing memory, struct layout, linkage across files, the preprocessor, bit manipulation and undefined behaviour. If you are deciding between languages rather than levels, [C++ (Intermediate)](/skill-tests/cpp-intermediate) covers the same ground with the C++ object model and library on top; [all skill tests](/skill-tests) are listed on one page.

## Sample question
topic: strings
answer: B
run: c

What does this program print?

```c
#include <stdio.h>
#include <string.h>

int main(void) {
    char line[] = "a,,b,c";
    int count = 0;
    for (char *tok = strtok(line, ","); tok; tok = strtok(NULL, ","))
        count++;
    printf("%d %zu\n", count, strlen(line));
    return 0;
}
```

- A: `4 6`
- B: `3 1`
- C: `3 6`
- D: `4 1`

> `strtok` treats a run of delimiters as one separator, so `,,` produces no
> empty token: the tokens are `a`, `b` and `c`, and the count is 3. It also
> writes into the string, replacing the delimiter that ends each token with
> `'\0'`. After the first call, `line[1]` is a terminator, so `strlen(line)`
> is 1. That is why `strtok` cannot be called on a string literal, and why
> code that needs empty fields or the original text has to scan the string
> itself.
