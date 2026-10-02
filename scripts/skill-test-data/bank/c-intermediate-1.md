---
skill: c
level: intermediate
---

## c-intermediate-001
topic: basics
answer: B
run: c

On a 64-bit Linux system, where `int` is 4 bytes and `long` is 8, what does this program print?

```c
#include <stdio.h>

int main(void) {
    printf("%d %d\n", -1 < 1u, -1L < 1u);
    return 0;
}
```

- A: `1 1`
- B: `0 1`
- C: `0 0`
- D: `1 0`

> In `-1 < 1u` the operands are `int` and `unsigned int`, which have the same
> rank, so the `int` is converted to `unsigned int`: -1 becomes 4294967295,
> and the comparison is false. In `-1L < 1u` the signed operand is a `long`,
> and an 8-byte `long` can represent every `unsigned int` value, so `1u` is
> converted to `long` instead and the comparison is the mathematical one,
> true. Where `long` is also 4 bytes (64-bit Windows), both would be converted
> to `unsigned long` and the second result would be 0 as well.

## c-intermediate-002
topic: basics
answer: D
run: c

What does this program print?

```c
#include <stdio.h>

int main(void) {
    unsigned char a = 200, b = 100;
    unsigned char sum = a + b;
    int wide = a + b;
    printf("%d %d %d\n", sum, wide, sum < a);
    return 0;
}
```

- A: `44 44 1`
- B: `300 300 0`
- C: `255 300 0`
- D: `44 300 1`

> Both operands are promoted to `int` before the addition, so `a + b` is the
> `int` 300. Stored in `wide` it stays 300. Stored in an `unsigned char` it is
> reduced modulo 256 to 44 — conversion to an unsigned type wraps, it never
> saturates at 255. So `sum < a` compares 44 with 200 and is 1.

## c-intermediate-003
topic: basics
answer: A
run: c

On a system where `int` is 4 bytes, what does this program print?

```c
#include <stdio.h>

int main(void) {
    char c = 'a';
    printf("%zu %zu %zu\n", sizeof 'a', sizeof c, sizeof(c + 1));
    return 0;
}
```

- A: `4 1 4`
- B: `1 1 1`
- C: `1 1 4`
- D: `4 1 1`

> In C a character constant such as `'a'` has type `int`, so `sizeof 'a'` is
> `sizeof(int)`, 4 (in C++ it is a `char`, and the answer would be 1). The
> variable `c` is a `char`, size 1. In `c + 1` the `char` is promoted to `int`
> before the addition, so the expression is an `int`, size 4.

## c-intermediate-004
topic: basics
answer: C
run: c

With IEEE 754 `float` and `double`, as on every mainstream platform, what does this program print?

```c
#include <stdio.h>

int main(void) {
    float f = 0.1;
    double d = 0.1;
    printf("%d %d %d\n", f == 0.1, f == 0.1f, d == 0.1);
    return 0;
}
```

- A: `1 1 1`
- B: `0 0 1`
- C: `0 1 1`
- D: `1 0 1`

> 0.1 has no exact binary form. `f` holds the nearest `float`, which differs
> from the nearest `double`. In `f == 0.1` the `float` is converted to
> `double`, but the conversion keeps the `float`'s rounding error, so the
> values differ: 0. `0.1f` is the same nearest `float`, so `f == 0.1f` is 1,
> and `d == 0.1` compares a `double` with the same `double` constant: 1.

## c-intermediate-005
topic: basics
answer: D

This function is meant to print an array backwards. What happens when it is called with `n` equal to 3?

```c
void print_reversed(const int *a, size_t n) {
    for (size_t i = n - 1; i >= 0; i--)
        printf("%d ", a[i]);
}
```

- A: It prints `a[2] a[1] a[0]` and then returns normally.
- B: It prints nothing, because the condition is false at the start.
- C: It does not compile, because `size_t` cannot be compared with `0`.
- D: `i >= 0` always holds for an unsigned `i`, so it runs off the array.

> `size_t` is unsigned, so `i >= 0` can never be false. After printing
> `a[0]`, `i--` takes `i` from 0 to `SIZE_MAX` (unsigned arithmetic wraps),
> and `a[SIZE_MAX]` is far outside the array — undefined behaviour, typically
> a crash. It compiles (at most with a warning that the comparison is always
> true). A correct loop is `for (size_t i = n; i-- > 0; )`, which also handles
> `n == 0`.

## c-intermediate-006
topic: basics
answer: B

A signal handler sets a flag that the main program polls:

```c
#include <signal.h>

static volatile sig_atomic_t stop = 0;

static void on_sigint(int sig) { (void)sig; stop = 1; }

int main(void) {
    signal(SIGINT, on_sigint);
    while (!stop) {
        /* spin */
    }
    return 0;
}
```

What does `volatile` contribute here?

- A: It makes every access to `stop` atomic, so threads can share it without locks.
- B: It forces each read of `stop` to load it again, so the loop sees the handler's write.
- C: It gives `stop` static storage duration, so it outlives the call to `main`.
- D: It keeps code in other translation units from reading or writing `stop`.

> Nothing in the loop body changes `stop`, so without `volatile` the compiler
> may read it once and turn the loop into an infinite one. `volatile` makes
> every access a real access, so each test loads the value the handler wrote.
> It does not make accesses atomic or synchronise threads — `sig_atomic_t` is
> what guarantees the handler's write cannot be torn, and threads need
> `_Atomic` or a mutex. Static storage and internal linkage come from `static`.

## c-intermediate-007
topic: operators-control
answer: A
run: c

What does this program print?

```c
#include <stdio.h>

int main(void) {
    int a = -7, b = 2;
    printf("%d %d %d %d\n", a / b, a % b, 7 / -2, 7 % -2);
    return 0;
}
```

- A: `-3 -1 -3 1`
- B: `-4 1 -4 -1`
- C: `-3 1 -3 1`
- D: `-3 -1 -3 -1`

> Since C99, integer division truncates toward zero, so -7 / 2 and 7 / -2 are
> both -3 (B is floor division, as in Python). The remainder is defined by
> `(a / b) * b + a % b == a`, so it takes the sign of the dividend: -7 % 2 is
> -7 - (-6) = -1, and 7 % -2 is 7 - 6 = 1.

## c-intermediate-008
topic: operators-control
answer: C
run: c

What does this program print?

```c
#include <stdio.h>

int main(void) {
    int a = 0, b = 5, c;
    c = a++ && b++;
    c += a || b++;
    c += a-- && --b;
    printf("%d %d %d\n", a, b, c);
    return 0;
}
```

- A: `0 6 2`
- B: `1 4 2`
- C: `0 4 2`
- D: `0 4 1`

> `&&` and `||` evaluate their right operand only when the left does not settle
> the result. Line 1: `a++` yields 0, so `b++` is skipped; `a` is 1, `c` is 0.
> Line 2: `a` is 1, so `||` is already true and `b++` is skipped again; `c`
> is 1. Line 3: `a--` yields 1 (and `a` becomes 0), so `--b` runs, making `b`
> 4, which is true; `c` is 2. Evaluating every operand would give A.

## c-intermediate-009
topic: operators-control
answer: D
run: c

What does this program print?

```c
#include <stdio.h>

int main(void) {
    int i, s;
    for (i = 0, s = 0; i < 5; i++, s += i)
        ;
    printf("%d %d\n", i, s);
    return 0;
}
```

- A: `5 10`
- B: `4 10`
- C: `6 21`
- D: `5 15`

> The comma operator evaluates its left operand completely, side effects
> included, before its right one. So in `i++, s += i` the increment has
> already happened when `i` is added: `s` collects 1 + 2 + 3 + 4 + 5 = 15. The
> loop stops when the test `i < 5` first fails, with `i` equal to 5.

## c-intermediate-010
topic: operators-control
answer: B
run: c

What does this program print?

```c
#include <stdio.h>

int main(void) {
    int n = 0;
    for (int x = 1; x <= 3; x++) {
        switch (x) {
        default: n += 100;
        case 1:  n += 10;
                 break;
        case 2:  n += 1;
        }
    }
    printf("%d\n", n);
    return 0;
}
```

- A: `111`
- B: `121`
- C: `11`
- D: `221`

> `switch` jumps to the matching label wherever it is written; `default` is
> taken only when no `case` matches, even when it comes first. x = 1 adds 10
> and breaks; x = 2 adds 1 and reaches the end. x = 3 matches no case, so
> control enters at `default`, adds 100 and then falls through into `case 1`,
> adding 10 before the `break`: 10 + 1 + 110 = 121. A forgets that fall-through.

## c-intermediate-011
topic: operators-control
answer: A

For which arguments does `in_range` return 1?

```c
int in_range(int x) {
    return 0 < x < 10;
}
```

- A: For every `int` argument.
- B: Only for 1 to 9.
- C: Only for positive arguments.
- D: For none; it always returns 0.

> Relational operators group left to right and yield an `int`, 0 or 1. So the
> expression is `(0 < x) < 10`, and both 0 and 1 are less than 10: it is
> always 1. The range test has to be written `0 < x && x < 10`.

## c-intermediate-012
topic: operators-control
answer: C

With `#define MASK 0x30`, a developer writes this to test that every bit of `MASK` is set in `flags`:

```c
if (flags & MASK == MASK) {
    /* ... */
}
```

What does the condition actually test?

- A: That every bit of `MASK` is set in `flags`.
- B: That at least one bit of `MASK` is set in `flags`.
- C: Only whether bit 0 of `flags` is set.
- D: Whether `flags` equals `MASK` exactly.

> `==` binds more tightly than `&`, so the expression is
> `flags & (MASK == MASK)`, which is `flags & 1`. The intended test needs
> parentheses: `(flags & MASK) == MASK`. The same trap catches `^` and `|`,
> which also rank below the comparison operators.

## c-intermediate-013
topic: functions
answer: D
run: c

On a 64-bit system, where pointers are 8 bytes, what does this program print?

```c
#include <stdio.h>

static int add(int a, int b) { return a + b; }
static int mul(int a, int b) { return a * b; }
static int sub(int a, int b) { return a - b; }

int main(void) {
    int (*ops[])(int, int) = { add, mul, sub };
    int r = 2;
    for (int i = 0; i < 3; i++)
        r = ops[i](r, 3);
    printf("%d %zu\n", r, sizeof ops / sizeof ops[0]);
    return 0;
}
```

- A: `0 3`
- B: `15 3`
- C: `12 24`
- D: `12 3`

> `ops` is an array of three pointers to functions taking two `int`s. The loop
> applies them in index order: add(2, 3) = 5, mul(5, 3) = 15, sub(15, 3) = 12.
> `sizeof ops` is 24 bytes (three 8-byte pointers), and dividing by the size of
> one element gives the count, 3. Applying them in reverse would give 0.

## c-intermediate-014
topic: functions
answer: A
run: c

What does this program print?

```c
#include <stdio.h>
#include <stdlib.h>

static int by_last_digit(const void *pa, const void *pb) {
    int a = *(const int *)pa % 10;
    int b = *(const int *)pb % 10;
    return (a > b) - (a < b);
}

int main(void) {
    int v[] = {23, 41, 12, 35, 50};
    qsort(v, 5, sizeof v[0], by_last_digit);
    for (int i = 0; i < 5; i++)
        printf("%d ", v[i]);
    printf("\n");
    return 0;
}
```

- A: `50 41 12 23 35`
- B: `12 23 35 41 50`
- C: `35 23 12 41 50`
- D: `50 41 35 23 12`

> `qsort` orders elements by whatever the comparator says. This one compares
> last digits and returns negative, zero or positive as the first is smaller,
> equal or larger, so the order is ascending by last digit: 0, 1, 2, 3, 5,
> that is 50, 41, 12, 23, 35. No two last digits are equal, so qsort's lack of
> stability does not matter here.

## c-intermediate-015
topic: functions
answer: B

Why is this comparator unsafe for sorting arbitrary `int` values with `qsort`?

```c
int cmp(const void *a, const void *b) {
    return *(const int *)a - *(const int *)b;
}
```

- A: `qsort` needs a result of exactly -1, 0 or 1 from it.
- B: The subtraction can overflow and so report the wrong sign.
- C: The casts discard `const`, which makes the call undefined.
- D: It sorts in descending order rather than in ascending order.

> `qsort` only looks at the sign of the result, so any negative or positive
> value is fine (A is wrong). But comparing, say, `INT_MIN` with 1 computes
> `INT_MIN - 1`, a signed overflow: undefined, and in practice it wraps to a
> large positive number, telling qsort the smaller value is larger. The safe
> form is `(x > y) - (x < y)`. The casts keep `const`, and a negative result
> for a smaller first argument means ascending order.

## c-intermediate-016
topic: functions
answer: C

What does the C standard say this program prints?

```c
#include <stdio.h>

static int counter = 0;
static int next(void) { return ++counter; }

int main(void) {
    printf("%d %d\n", next(), next());
    return 0;
}
```

- A: `1 2`, because arguments are evaluated left to right.
- B: `2 1`, because arguments are pushed right to left.
- C: Either `1 2` or `2 1`: the order of evaluation is unspecified.
- D: Nothing defined: the two calls modify `counter` unsequenced.

> C does not fix the order in which a function's arguments are evaluated, so
> either call may run first. It is not undefined, though: function calls are
> indeterminately sequenced — each call runs completely before or after the
> other, never interleaved — so the result is one of the two outputs, and a
> compiler need not pick the same one every time. `printf("%d %d", i++, i++)`
> is different: two unsequenced side effects on one object are undefined.

## c-intermediate-017
topic: functions
answer: A
run: c

What does this program print?

```c
#include <stdarg.h>
#include <stdio.h>

static int sum(int count, ...) {
    va_list ap;
    va_start(ap, count);
    int total = 0;
    for (int i = 0; i < count; i++)
        total += va_arg(ap, int);
    va_end(ap);
    return total;
}

int main(void) {
    printf("%d\n", sum(3, 4, 5, 6, 7));
    return 0;
}
```

- A: `15`
- B: `22`
- C: `25`
- D: `18`

> A variadic function cannot tell how many arguments it was given; it reads as
> many as its own logic asks for. `count` is 3, so `va_arg` reads 4, 5 and 6,
> and the 7 is never looked at: 15. Reading more arguments than were passed is
> undefined, which is why `printf` relies on its format string matching.

## c-intermediate-018
topic: functions
answer: D

What is `f` in this declaration?

```c
int *(*f)(const char *);
```

- A: A function taking `const char *` and returning `int **`.
- B: A pointer to a function taking `const char *` and returning `int`.
- C: A function taking `const char *` and returning a function pointer.
- D: A pointer to a function taking `const char *` and returning `int *`.

> Read from the name outwards: `(*f)` makes `f` a pointer; the `(const char *)`
> after it makes that a pointer to a function taking a `const char *`; and what
> remains, `int *`, is the function's return type. Without the parentheses,
> `int **f(const char *)` would declare a function returning `int **`.

## c-intermediate-019
topic: arrays
answer: C
run: c

On a 64-bit system, where `int` is 4 bytes and pointers are 8, what does this program print?

```c
#include <stdio.h>

static size_t count(int a[10]) {
    return sizeof a / sizeof a[0];
}

int main(void) {
    int a[10] = {0};
    printf("%zu %zu\n", sizeof a / sizeof a[0], count(a));
    return 0;
}
```

- A: `10 10`
- B: `40 8`
- C: `10 2`
- D: `10 1`

> In `main`, `a` is a real array of 40 bytes, so the division gives 10. A
> parameter declared as an array is adjusted to a pointer: `int a[10]` in the
> parameter list means `int *a`, and the 10 is ignored. Inside `count`,
> `sizeof a` is the pointer's 8 bytes, and 8 / 4 is 2. A function that needs
> the length has to be passed it.

## c-intermediate-020
topic: arrays
answer: A, C, F

Given `int a[4];`, in which of these is an array **not** converted to a pointer to its first element? Select all that apply.

- A: `sizeof a`
- B: `a + 1`
- C: `&a`
- D: `a[2]`
- E: `int *p = a;`
- F: `"abc"` as the initialiser in `char s[] = "abc";`

> An array expression decays to a pointer to its first element except as the
> operand of `sizeof` (which measures the whole array), of unary `&` (which
> gives a pointer to the whole array, type `int (*)[4]`), and when a string
> literal initialises an array (its characters are copied in). `a + 1`,
> `a[2]` — defined as `*(a + 2)` — and the initialisation of `p` all use the
> decayed pointer.

## c-intermediate-021
topic: arrays
answer: B
run: c

What does this program print?

```c
#include <stdio.h>

int main(void) {
    int a[6] = { [1] = 5, 7, [4] = 9 };
    for (int i = 0; i < 6; i++)
        printf("%d ", a[i]);
    printf("\n");
    return 0;
}
```

- A: `5 7 9 0 0 0`
- B: `0 5 7 0 9 0`
- C: `0 5 0 0 9 0`
- D: `0 7 0 0 9 0`

> A designator such as `[1] =` sets where initialisation continues, and an
> initialiser without one goes to the element after the previous one. So 5
> goes to index 1, the plain 7 to index 2, and 9 to index 4. Every element not
> initialised explicitly is zero, so indexes 0, 3 and 5 are 0.

## c-intermediate-022
topic: arrays
answer: D

`int a[5];` begins at address 1000, and `int` is 4 bytes. Which addresses do `a + 1` and `&a + 1` hold?

- A: `a + 1` is 1004 and `&a + 1` is 1004.
- B: `a + 1` is 1001 and `&a + 1` is 1005.
- C: `a + 1` is 1020 and `&a + 1` is 1004.
- D: `a + 1` is 1004 and `&a + 1` is 1020.

> Pointer arithmetic moves in units of the pointed-to type. `a` decays to an
> `int *`, so `a + 1` moves one `int`, 4 bytes, to 1004. `&a` is a pointer to
> the whole array, type `int (*)[5]`, so `&a + 1` moves 5 × 4 = 20 bytes, to
> 1020 — one past the end of the array, which may be formed and compared but
> not dereferenced.

## c-intermediate-023
topic: arrays
answer: A

A function is called as `fill(grid)` with `int grid[3][4];`. Which parameter declaration matches the argument?

- A: `void fill(int g[][4])`
- B: `void fill(int **g)`
- C: `void fill(int g[3][])`
- D: `void fill(int *g[4])`

> `grid` decays to a pointer to its first row, type `int (*)[4]`, and
> `int g[][4]` is adjusted to exactly that. Only the first dimension may be
> left out, because the compiler needs the row length to find `g[i][j]`, so C
> is invalid. `int **g` and `int *g[4]` both mean a pointer to pointers to
> `int`: a different type and a different memory layout, so indexing through
> it would read the array's integers as addresses.

## c-intermediate-024
topic: arrays
answer: B
run: c

On a 64-bit system, where pointers are 8 bytes, what does this program print?

```c
#include <stdio.h>
#include <string.h>

int main(void) {
    char grid[][6] = {"ab", "cde", "f"};
    const char *list[] = {"ab", "cde", "f"};
    printf("%zu %zu %zu\n", sizeof grid, sizeof list, strlen(grid[1]));
    return 0;
}
```

- A: `18 18 3`
- B: `18 24 3`
- C: `9 24 3`
- D: `18 24 6`

> `grid` is a two-dimensional array: three rows of 6 `char`s each, 18 bytes,
> however short the strings in them. `list` is an array of three pointers,
> 3 × 8 = 24 bytes; the strings live elsewhere. `strlen(grid[1])` counts the
> characters of `"cde"` up to its terminator, 3, not the row's 6 bytes.
