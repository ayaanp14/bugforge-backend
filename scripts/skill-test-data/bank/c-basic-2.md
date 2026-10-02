---
skill: c
level: basic
---

## c-basic-026
topic: basics
answer: C
run: c

What does this program print?

```c
#include <stdio.h>

int main(void) {
    unsigned char a = 200, b = 100;
    int sum = a + b;
    unsigned char c = a + b;
    printf("%d %d\n", sum, c);
    return 0;
}
```

- A: `300 300`
- B: `44 44`
- C: `300 44`
- D: `44 300`

> Before arithmetic, operands narrower than `int` are promoted to `int`, so
> `a + b` is computed as the `int` 300 and `sum` keeps it. Storing 300 in an
> `unsigned char` (0 to 255) reduces it modulo 256, which is well defined for
> unsigned types: 300 - 256 = 44. `printf` receives `c` promoted back to `int`,
> so `%d` prints 44.

## c-basic-027
topic: basics
answer: B, D, F

On a 64-bit Linux system, where `long` is 8 bytes, these variables are declared:

```c
long big = 5000000000;
unsigned int u = 7;
double d = 2.5;
size_t n = sizeof d;
```

Which of these `printf` calls use the right conversion for their argument? Select all that apply.

- A: `printf("%d\n", big);`
- B: `printf("%u\n", u);`
- C: `printf("%f\n", u);`
- D: `printf("%zu\n", n);`
- E: `printf("%d\n", d);`
- F: `printf("%ld\n", big);`

> Each conversion expects one type: `%u` an `unsigned int` (B), `%zu` a
> `size_t` (D), `%ld` a `long` (F). `%d` expects an `int`, so passing a `long`
> (A) or a `double` (E) is undefined behaviour, and `%f` expects a `double`, not
> an `unsigned int` (C). `printf` cannot convert its arguments to fit, because a
> variadic function does not know the types it was given.

## c-basic-028
topic: operators-control
answer: A
run: c

What does this program print?

```c
#include <stdio.h>

int main(void) {
    int x = 6;
    if (x & 1 == 0)
        printf("even\n");
    else
        printf("odd\n");
    return 0;
}
```

- A: `odd`
- B: `even`
- C: It does not compile: `x & 1 == 0` needs parentheses.

> `==` has higher precedence than `&`, so the condition is `x & (1 == 0)`, which
> is `x & 0`, which is 0. The `else` branch runs and prints `odd` even though 6
> is even. It compiles (compilers may warn); the intended test is
> `(x & 1) == 0`.

## c-basic-029
topic: operators-control
answer: D

A loop body contains this line:

```c
if (count = 0) { reset(); }
```

What does the `if` do each time it runs?

- A: It compares `count` with 0, exactly as `count == 0` would.
- B: It does not compile: an assignment cannot be used as a condition.
- C: It stores 0 in `count` and always calls `reset()`.
- D: It stores 0 in `count` and never calls `reset()`.

> `=` is assignment, and an assignment is an expression whose value is the
> value assigned. So the condition sets `count` to 0 and then tests 0, which is
> false: `reset()` never runs, and `count` is wiped every time. The code is
> legal C; compilers warn and suggest extra parentheses if the assignment was
> intended.

## c-basic-030
topic: operators-control
answer: B

In a `switch` on an `int` expression, which of these is a valid `case` label? (`n` is an `int` variable.)

- A: `case n:`
- B: `case 'y':`
- C: `case "yes":`
- D: `case 1.5:`

> A `case` label must be an integer constant expression. `'y'` is a character
> constant, which in C has type `int`, so it qualifies. A variable is not a
> constant expression (not even a `const int` in C), a string literal is an
> array rather than an integer, and `1.5` is a floating constant.

## c-basic-031
topic: functions
answer: D
run: c

What does this program print?

```c
#include <stdio.h>

int f(int n) {
    if (n <= 1)
        return 1;
    return n + f(n - 2);
}

int main(void) {
    printf("%d\n", f(7));
    return 0;
}
```

- A: `28`
- B: `15`
- C: `12`
- D: `16`

> Each call steps down by 2: `f(7) = 7 + f(5)`, `f(5) = 5 + f(3)`,
> `f(3) = 3 + f(1)`, and `f(1)` hits the base case and returns 1. So the result
> is 7 + 5 + 3 + 1 = 16. Stepping down by 1 would give 28; a base case that
> returned 0 would give 15.

## c-basic-032
topic: functions
answer: C

A call to `int largest(int a, int b)` reaches the function's closing `}` without executing a `return` statement, and the caller uses the value the call returns. What does the C standard say happens?

- A: The function returns 0 on that path.
- B: It does not compile: every path must return a value.
- C: The behaviour is undefined.
- D: The function returns the value of the last expression it evaluated.

> In C, falling off the end of a non-`void` function is allowed by itself, but
> if the caller uses the returned value the behaviour is undefined. Compilers
> warn about it and still compile the code. Whatever happens to be in the
> return register is not a value the standard promises. Only `main` is special:
> reaching its closing `}` returns 0.

## c-basic-033
topic: arrays
answer: B
run: c

On a 64-bit Linux system, where `int` is 4 bytes and pointers 8, what does this program print?

```c
#include <stdio.h>

void show(int a[10]) {
    printf("%zu ", sizeof(a));
}

int main(void) {
    int a[10] = {0};
    show(a);
    printf("%zu\n", sizeof(a));
    return 0;
}
```

- A: `40 40`
- B: `8 40`
- C: `10 10`
- D: `8 8`

> A parameter written as an array, even with a size, is adjusted to a pointer:
> `int a[10]` in the parameter list means `int *a`. So inside `show`,
> `sizeof(a)` is the size of a pointer, 8. In `main`, `a` is a real array of
> ten 4-byte `int`s, so `sizeof(a)` is 40. This is why functions that take
> arrays also take the length.

## c-basic-034
topic: arrays
answer: A, B, D

Given `int a[5] = {10, 20, 30, 40, 50};`, which of these expressions have the value 30? Select all that apply.

- A: `a[2]`
- B: `*(a + 2)`
- C: `*(a + 8)`
- D: `2[a]`
- E: `*a + 2`

> `a[i]` is defined as `*(a + i)`, and pointer arithmetic counts elements, not
> bytes: `a + 2` points at the third element, 30 (A, B). Because addition
> commutes, `2[a]` is `*(2 + a)`, the same element (D), legal if unusual.
> `*(a + 8)` is eight elements on, far past the end, so reading it is undefined
> (it is not "8 bytes on"). `*a + 2` is `a[0] + 2`, which is 12.

## c-basic-035
topic: strings
answer: D
run: c

What does this program print?

```c
#include <stdio.h>
#include <string.h>

int main(void) {
    char a[] = "hi";
    char b[] = "hi";
    printf("%s %s\n", a == b ? "same" : "different",
           strcmp(a, b) == 0 ? "same" : "different");
    return 0;
}
```

- A: `same same`
- B: `different different`
- C: `same different`
- D: `different same`

> In `a == b` both arrays convert to pointers to their first elements, so `==`
> compares two addresses. `a` and `b` are separate arrays, so the addresses
> differ. `strcmp` compares the characters and returns 0 when they match. To
> compare the contents of two strings in C, always use `strcmp`.

## c-basic-036
topic: strings
answer: A

Which statement about `strcmp(s, t)` is true?

- A: It returns 0 when the strings are equal; otherwise its sign says which sorts first.
- B: It returns 1 when the strings are equal and 0 when they differ.
- C: It returns exactly -1, 0 or 1, so `== -1` is the portable test for "s sorts first".
- D: It returns how many leading characters the two strings have in common.

> `strcmp` compares the strings character by character (as `unsigned char`
> values) and returns zero for equal strings, a negative value if `s` sorts
> first and a positive value if `t` does. Only the sign is specified, not the
> magnitude, so portable code tests `< 0`, `== 0` or `> 0`. Note that
> `if (strcmp(s, t))` is true when the strings differ.

## c-basic-037
topic: pointers
answer: C
run: c

What does this program print?

```c
#include <stdio.h>

int main(void) {
    int a[6] = {0, 1, 2, 3, 4, 5};
    int *p = &a[1];
    int *q = &a[5];
    printf("%d %d\n", (int)(q - p), *(p + 2));
    return 0;
}
```

- A: `16 3`
- B: `4 2`
- C: `4 3`
- D: `5 3`

> Subtracting two pointers into the same array gives the distance in elements,
> not bytes: from index 1 to index 5 is 4. `p + 2` moves two elements on from
> `a[1]`, to `a[3]`, which holds 3. Pointer arithmetic scales by the size of
> the pointed-to type, so `16` (the distance in bytes) never appears.

## c-basic-038
topic: pointers
answer: A, D, E

Inside a function:

```c
int a = 1, b = 2;
const int *p = &a;
int *const q = &a;
```

Which of these statements compile? Select all that apply.

- A: `p = &b;`
- B: `*p = 3;`
- C: `q = &b;`
- D: `*q = 3;`
- E: `a = 3;`

> Read the declarations from the name outwards. `p` is a pointer to a
> `const int`: the pointer may be moved (A) but cannot be used to change what
> it points at (B fails). `q` is a `const` pointer to `int`: it cannot be moved
> (C fails) but can change the `int` (D). `a` itself was never declared
> `const`, so assigning it directly is fine (E).

## c-basic-039
topic: memory
answer: B
run: c

On a 64-bit Linux system, where `int` is 4 bytes and pointers 8, what does this program print?

```c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int *p = malloc(10 * sizeof(int));
    if (p == NULL)
        return 1;
    printf("%zu %zu\n", sizeof(p), sizeof(*p));
    free(p);
    return 0;
}
```

- A: `40 4`
- B: `8 4`
- C: `8 40`
- D: `10 4`

> `sizeof` looks only at types, at compile time. `p` is an `int *`, so
> `sizeof(p)` is the size of a pointer, 8, however much memory it points to;
> `*p` is an `int`, so `sizeof(*p)` is 4. Nothing can recover the 40 bytes that
> were requested from the pointer, so a program must keep the count itself.

## c-basic-040
topic: memory
answer: B, C, E

On a 64-bit system where `int` is 4 bytes and pointers are 8, which of these request exactly enough memory for `n` `int`s? Select all that apply.

- A: `int *p = malloc(n);`
- B: `int *p = malloc(n * sizeof(int));`
- C: `int *p = calloc(n, sizeof(int));`
- D: `int *p = malloc(n * sizeof p);`
- E: `int *p = malloc(n * sizeof *p);`

> `malloc` takes a size in bytes, so it needs the count times the size of one
> element: `n * sizeof(int)` (B), or `n * sizeof *p` (E), which is the same
> because `*p` is an `int` and `sizeof` does not evaluate it. `calloc` takes
> the count and the element size separately (C). `malloc(n)` is only `n`
> bytes (A), and `sizeof p` is the size of the pointer, 8, so D asks for twice
> as much as needed.

## c-basic-041
topic: structs
answer: A
run: c

What does this program print?

```c
#include <stdio.h>

struct counter {
    int n;
};

void bump_copy(struct counter c) {
    c.n++;
}

void bump(struct counter *c) {
    c->n++;
}

int main(void) {
    struct counter c = {0};
    bump_copy(c);
    bump(&c);
    bump(&c);
    printf("%d\n", c.n);
    return 0;
}
```

- A: `2`
- B: `3`
- C: `0`
- D: `1`

> A struct passed by value is copied, so `bump_copy` increments its own copy
> and the caller's `c` stays 0. `bump` receives the address, and `c->n++`
> (shorthand for `(*c).n++`) changes the caller's struct. Two calls to `bump`
> leave `c.n` at 2.

## c-basic-042
topic: structs
answer: A, B, D

Inside a function:

```c
struct point { int x, y; };
struct point p = {3, 4};
struct point *pp = &p;
```

Which of these expressions are the member `x` of `p`? Select all that apply.

- A: `pp->x`
- B: `(*pp).x`
- C: `*pp.x`
- D: `p.x`
- E: `p->x`

> `.` selects a member of a struct (D), and `->` selects a member through a
> pointer to a struct (A); `pp->x` is shorthand for `(*pp).x` (B). Without the
> parentheses, `*pp.x` parses as `*(pp.x)` because `.` binds tighter than `*`,
> and `pp` is a pointer, which has no members, so it does not compile. `p->x`
> fails because `p` is a struct, not a pointer.

## c-basic-043
topic: storage-classes
answer: C
run: c

What does this program print?

```c
#include <stdio.h>

int total;

void add(int n) {
    total += n;
}

int main(void) {
    int total = 50;
    add(5);
    add(7);
    printf("%d\n", total);
    return 0;
}
```

- A: `62`
- B: `12`
- C: `50`
- D: Unpredictable: the global `total` is never initialised.

> Inside `main`, the local `total` hides the global one, so `printf` prints the
> local, which nothing changes: 50. `add` sees only the global `total`, which
> starts at 0 because objects with static storage are zero-initialised, and it
> ends at 12, but that value is never printed.

## c-basic-044
topic: storage-classes
answer: A, B, D, E

```c
#include <stdlib.h>

int g;
static int sg;

void f(void) {
    int a;
    static int s;
    int arr[3] = {0};
    int *p = malloc(sizeof *p);
    /* here */
}
```

Nothing else in the program writes to these variables. The first time `f` runs, which of them are guaranteed to be zero at the comment `/* here */`? Select all that apply.

- A: `g`
- B: `sg`
- C: `a`
- D: `s`
- E: `arr[2]`
- F: `*p` (when `malloc` succeeds)

> Every object with static storage duration (file-scope variables, with or
> without `static`, and `static` locals) is zero-initialised before the
> program starts (A, B, D). An array with an initializer has its remaining
> elements set to zero, so `arr[2]` is 0 (E). A local without an initializer
> (C) and the memory `malloc` returns (F) both start indeterminate; `calloc`
> would have zeroed the block.

## c-basic-045
topic: preprocessor
answer: D
run: c

What does this program print?

```c
#include <stdio.h>

#define DEBUG
#define LEVEL 2

int main(void) {
#ifdef DEBUG
    printf("debug ");
#endif
#if LEVEL > 2
    printf("verbose ");
#elif LEVEL == 2
    printf("normal ");
#endif
#ifndef RELEASE
    printf("dev");
#endif
    printf("\n");
    return 0;
}
```

- A: `debug verbose normal dev`
- B: `normal dev`
- C: `debug normal`
- D: `debug normal dev`

> `#ifdef` asks only whether a macro is defined, and `DEBUG` is, even with no
> value. `LEVEL` expands to 2, so `#if 2 > 2` is false and the `#elif` keeps
> `normal`; only one branch of an `#if`/`#elif` chain survives. `RELEASE` is
> never defined, so `#ifndef RELEASE` keeps `dev`. The discarded lines are
> removed before the compiler sees the code.

## c-basic-046
topic: preprocessor
answer: A

With GCC and Clang, how does `#include "util.h"` differ from `#include <util.h>`?

- A: Quotes look in the including file's own directory first, then where `<>` looks.
- B: Quotes include the file only once; angle brackets allow it to be included again.
- C: Angle brackets are for `.h` files; quotes are for `.c` files.
- D: Angle brackets look in the current directory first; quotes look only in system directories.

> The standard leaves the search to the implementation, and GCC and Clang (like
> most compilers) do this: the quoted form searches the directory of the file
> containing the `#include` first, then falls back to the same list the
> angle-bracket form uses (the `-I` directories and the system headers). So
> project headers use quotes and library headers use angle brackets. Neither
> form prevents a second inclusion; that is what include guards do.

## c-basic-047
topic: bitwise
answer: B
run: c

What does this program print?

```c
#include <stdio.h>

int main(void) {
    unsigned int flags = 0;
    flags |= 1u << 3;
    flags |= 1u << 0;
    flags &= ~(1u << 3);
    flags ^= 1u << 2;
    printf("%u\n", flags);
    return 0;
}
```

- A: `13`
- B: `5`
- C: `1`
- D: `4`

> `|=` sets a bit, `&= ~mask` clears it and `^=` toggles it. Setting bits 3 and
> 0 gives 8 + 1 = 9; clearing bit 3 leaves 1; toggling bit 2 (worth 4) turns
> it on: 1 + 4 = 5. If the clear had no effect the result would be 13.

## c-basic-048
topic: bitwise
answer: C

For an `unsigned int x`, which expression gives `x` with its lowest set bit cleared (for example, 12 becomes 8)?

- A: `x & -x`
- B: `x | (x - 1)`
- C: `x & (x - 1)`
- D: `x >> 1`

> Subtracting 1 turns the lowest set bit off and every bit below it on:
> 12 is `1100` and 11 is `1011`. ANDing the two clears that bit and keeps the
> rest: `1000` = 8. `x & -x` does the opposite and keeps only the lowest set bit
> (4); `x | (x - 1)` gives `1111` = 15; `x >> 1` halves the number to 6.

## c-basic-049
topic: undefined-behaviour
answer: A, C, E

Which of these statements have undefined behaviour? Select all that apply. (`<limits.h>` and `<stddef.h>` are included.)

- A: `int x = INT_MAX; x = x + 1;`
- B: `unsigned int u = UINT_MAX; u = u + 1;`
- C: `int i = 3; i = i++ + 1;`
- D: `int q = -7 / 2;`
- E: `int *p = NULL; int v = *p;`

> Signed integer overflow is undefined (A); unsigned arithmetic is defined to
> wrap modulo 2^N, so `u` becomes 0 (B). In C, `i = i++ + 1` modifies `i`
> twice with no sequence point between the two changes, which is undefined
> (C). `-7 / 2` is simply -3 (D). Dereferencing a null pointer is undefined
> (E).

## c-basic-050
topic: undefined-behaviour
answer: A

What can be said about this program?

```c
#include <stdio.h>

int main(void) {
    int n = 1;
    printf("%d %d\n", n, n++);
    return 0;
}
```

- A: Undefined: `n` is read and modified in unsequenced arguments.
- B: It prints `1 1`, because arguments are evaluated left to right.
- C: It prints `2 1`, because arguments are evaluated right to left.
- D: It prints `1 2`, because `n++` takes effect before the call.

> C does not fix the order in which a function's arguments are evaluated, and
> the arguments are not sequenced with respect to each other. Here one
> argument reads `n` and another modifies it, with nothing ordering the two,
> which the standard makes undefined behaviour. Different compilers print
> different things. Increment on a statement of its own first.
