---
updated: 2026-10-03
question: What does the C (Basic) skill test cover?
answer: It checks that you can read short C programs and say exactly what they do: types and conversions, operators and control flow, functions and recursion, arrays, strings, pointers, malloc and free, structs and enums, scope and storage classes, the preprocessor, bitwise operators and the common kinds of undefined behaviour. Then you solve one easy problem in C.
q: Which compiler and platform do the C Basic questions assume?
a: Standard C17 on a 64-bit Linux system, where int is 4 bytes and long and pointers are 8. A question whose answer depends on a size says so in its prompt. No question depends on whether plain char is signed, which varies between machines, and no output question relies on undefined or unspecified behaviour.
q: Do I need to know malloc and free for the C Basic test?
a: Yes, at the level of everyday use: what malloc and calloc return, how to size a request with sizeof, how long heap memory lives, that free releases a block but leaves the pointer holding its old address, and what a leak is. The harder dynamic-memory mistakes are left to the Intermediate test.
q: Can I write the coding problem in C++ instead of C?
a: No. On a language test the coding section accepts only that language, so the editor offers C alone and a solution in another language is refused. You complete a C function, and the judge runs it on hidden test cases, with credit for each case it passes.
q: Is undefined behaviour really examined at Basic level?
a: Yes, because recognising it is part of reading C correctly. You should spot an index one past the end of an array, a local variable read before it is set, signed overflow, a write to a string literal and a pointer used after free, and know that undefined means the program has no guaranteed behaviour at all.
---

The C (Basic) test is for anyone who has written C for a few months, whether in a first programming course, for embedded work or to prepare for interviews where C is the expected language, and wants a credential that says they read it accurately. It is built around one skill: looking at a short program and saying exactly what it prints, or whether it has a defined meaning at all. C rewards that precision more than most languages, because so much of its behaviour comes from rules the code does not spell out: integer promotion, the order in which operators bind, the difference between an array and a pointer, and what the standard leaves undefined.

The paper has multiple-choice questions, then a coding problem. Many questions show a complete program and ask what it prints; others ask which lines compile, which expression does a job, or what the standard says about a piece of code. A few ask you to select every correct option, and only the exact set scores.

## What each topic examines

- **Types and basics.** Sizes on a 64-bit system and which type a value needs, integer division and `%` with negative operands, integer promotion and the usual arithmetic conversions (including what happens when a signed value meets an unsigned one), octal and hexadecimal constants, and matching `printf` conversions such as `%d`, `%u`, `%ld`, `%zu` and `%f` to their arguments.
- **Operators and control flow.** Precedence and associativity (`&`, `^` and `|` bind more loosely than `==`), short-circuit evaluation with `&&` and `||`, an assignment where a comparison was meant, `switch` fall-through, and `break` against `continue`.
- **Functions and recursion.** Call by value, why a function given an array can still change its elements, how a prototype converts the arguments, and tracing a recursive call to its result. The [recursion lesson](/roadmap/recursion) and the [recursion problems](/challenges/recursion) are good practice.
- **Arrays.** Initialisation (elements without a value are zero), indexing and its bounds, `sizeof` on an array against `sizeof` on a parameter declared as one, and two-dimensional arrays stored row by row. The [arrays lesson](/roadmap/arrays) covers the patterns.
- **Strings.** A string is a `char` array that ends in `'\0'`: `strlen` against `sizeof`, comparing with `strcmp` rather than `==`, exactly what `strcpy` and `strcat` write, and why a string literal must never be modified.
- **Pointers.** `&` and `*`, pointer arithmetic over an array (it counts elements, not bytes), what `*p++` increments, the difference of two pointers, and reading `const` in a declaration.
- **Dynamic memory.** `malloc`, `calloc` and `free`, sizing a request with `sizeof`, how long a block lives, and what a leak looks like.
- **Structs and enums.** Member access with `.` and `->`, structs copied by assignment and when passed by value, designated initializers, and how enumerators get their values.
- **Scope and storage classes.** Block scope and shadowing, `static` locals that keep their value between calls, which variables are guaranteed to start at zero, and what `extern` and a file-scope `static` mean.
- **The preprocessor.** Object-like and function-like `#define`s and why their parameters need parentheses, conditional compilation with `#if` and `#ifdef`, include guards, and `#include` with quotes or angle brackets.
- **Bitwise operations.** `&`, `|`, `^`, `~` and the shifts on unsigned values, and setting, clearing, toggling and testing a single bit. The [bit manipulation lesson](/roadmap/bit-manipulation) and its [problems](/challenges/bit-manipulation) use the same tricks.
- **Undefined behaviour.** Recognising the common cases, and telling them apart from code that is merely surprising but well defined, such as unsigned arithmetic wrapping round.

## How to prepare

Write small programs and predict their output before you run them. When the prediction is wrong, find the rule that explains the difference instead of moving on: that habit is what the questions measure. Compile with warnings switched on (`-Wall -Wextra` with GCC or Clang) and read every warning, because many of the traps here, such as an assignment inside a condition or a comparison between signed and unsigned values, are exactly what those warnings report.

The [Programming Fundamentals MCQs](/aptitude/programming-fundamentals) drill the same kind of reasoning about types, operators and control flow, and the [pseudocode questions](/aptitude/pseudocode) practise tracing a program by hand. For the coding problem, solve a few easy problems in C from the [arrays](/challenges/arrays) and [strings](/challenges/strings) hubs. Get used to passing an array together with its length, ending every string you build with a terminator, and keeping each index inside the array.

## What trips people up

- **Treating `sizeof` as a length.** It is a size in bytes, worked out from the type at compile time. On a pointer, including an array parameter, it is the size of the pointer.
- **Expecting floor division.** C rounds integer division toward zero, so `-9 / 4` is -2 and `-9 % 4` is -1. Python gives -3 and 3.
- **Forgetting the terminator.** Every string function looks for `'\0'`. An array that holds the letters but not the terminator is not a string, and passing it to `strlen` or `printf("%s")` reads past its end.
- **Reading undefined as "unpredictable".** Undefined behaviour does not mean the program prints some random number. It means the standard places no requirement on the program at all, so a question about it is answered by recognising it, not by guessing an output.
- **Leaning on what one machine does.** Whether plain `char` is signed, the order in which function arguments are evaluated, and the exact size of `long` differ between platforms. The test states its assumptions, and good C does not depend on the rest.

## What changes at Intermediate

The [C (Intermediate)](/skill-tests/c-intermediate) test assumes everything here and goes further: pointers to pointers and function pointers, the mistakes dynamic memory invites, unions, linkage across several source files, the pitfalls of macros, and library functions such as `qsort`, with a harder coding round. If this paper's questions feel routine, that is the one to take next.

## Sample question
topic: operators-control
answer: B
run: c

What does this program print?

```c
#include <stdio.h>

int main(void) {
    int i, n = 0;
    for (i = 0; i < 5; i++);
        n++;
    printf("%d %d\n", i, n);
    return 0;
}
```

- A: `5 5`
- B: `5 1`
- C: `4 1`
- D: `5 0`

> The semicolon straight after the `for (...)` is an empty statement, and it is
> the whole body of the loop. The loop runs five times doing nothing, leaving
> `i` at 5, the first value that fails `i < 5`. The indented `n++;` is not part
> of the loop: indentation means nothing to the compiler, so it runs once
> afterwards and `n` is 1.
