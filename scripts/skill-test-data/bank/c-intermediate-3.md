---
skill: c
level: intermediate
---

## c-intermediate-051
topic: storage-classes
answer: D
run: c

What does this program print?

```c
#include <stdio.h>

static int tick(void) {
    static int calls = 0;
    int local = 0;
    calls++;
    local++;
    return calls * 10 + local;
}

int main(void) {
    int a = tick();
    int b = tick();
    int c = tick();
    printf("%d %d %d\n", a, b, c);
    return 0;
}
```

- A: `11 11 11`
- B: `11 22 33`
- C: `10 20 30`
- D: `11 21 31`

> A `static` local has static storage duration: it is initialised once, before
> the program starts, and keeps its value between calls, so `calls` is 1, 2,
> then 3. `local` is an ordinary automatic variable, created and set to 0 on
> every call, so it is always 1 when the result is computed.

## c-intermediate-052
topic: storage-classes
answer: A
run: c

What does this program print?

```c
#include <stdio.h>

int x = 1;

static void show(void) {
    printf("%d ", x);
}

int main(void) {
    int x = 2;
    show();
    {
        int x = 3;
        printf("%d ", x);
    }
    printf("%d\n", x);
    return 0;
}
```

- A: `1 3 2`
- B: `2 3 2`
- C: `2 3 3`
- D: `1 3 3`

> Scope in C is lexical: a name refers to the declaration visible where the
> code is written, not where it is called from. `show` can only see the
> file-scope `x`, so it prints 1 even when called from inside `main`. The
> inner block's `x` hides `main`'s until the block ends, after which `main`'s
> `x`, still 2, is visible again.

## c-intermediate-053
topic: storage-classes
answer: C

A program is built from two files:

```c
/* counter.c */
static int count = 0;
void bump(void) { count++; }
```

```c
/* main.c */
#include <stdio.h>
extern int count;
void bump(void);
int main(void) { bump(); printf("%d\n", count); return 0; }
```

What happens when the two are compiled and linked together?

- A: It prints `1`, since `extern` gives `main.c` access to `count`.
- B: It prints `0`, since `main.c` gets its own zero-initialised `count`.
- C: Linking fails, because `count` has internal linkage in `counter.c`.
- D: `counter.c` fails to compile: a non-static function uses a static variable.

> `static` at file scope gives `count` internal linkage: the name is private to
> `counter.c`. `extern int count;` in `main.c` only declares an object with
> external linkage and expects another file to define it; none does, so the
> linker reports an undefined reference. A function may use any variable in
> its file, static or not. Removing `static` (or adding an accessor function)
> makes it link and print 1.

## c-intermediate-054
topic: storage-classes
answer: B

At file scope, which of these declares `n` without defining it?

- A: `int n;`
- B: `extern int n;`
- C: `int n = 0;`
- D: `static int n;`

> `extern` without an initialiser only declares: it says an `int` named `n`
> is defined somewhere, usually in another file. `int n;` and `static int n;`
> at file scope are tentative definitions — if no other definition appears in
> the file, they define `n`, initialised to 0. An initialiser always makes a
> definition, even `extern int n = 0;`.

## c-intermediate-055
topic: storage-classes
answer: D

What happens when this is compiled as C?

```c
#include <time.h>

void log_event(void) {
    static time_t start = time(NULL);
    /* ... */
}
```

- A: It compiles; `time` runs once, on the first call to `log_event`.
- B: It compiles; `time` runs again on every call to `log_event`.
- C: It compiles, but `start` stays 0, since statics are zero-initialised.
- D: It does not compile: a `static` object needs a constant initialiser.

> An object with static storage duration is initialised before the program
> starts, so in C its initialiser must be a constant expression, and a
> function call is not one. A is what C++ does (it initialises a function's
> static local on the first call), which is why the code looks plausible. In
> C, set it on first use: `static time_t start; if (!start) start = time(NULL);`.

## c-intermediate-056
topic: storage-classes
answer: B, D, E

Which of these start out as zero without being assigned? Select all that apply.

- A: `int count;` declared inside a function
- B: `int total;` declared at file scope
- C: every `int` in a block from `malloc(10 * sizeof(int))`
- D: `static int hits;` declared inside a function
- E: `arr[3]` after `int arr[5] = {1};` inside a function

> Objects with static storage duration — file-scope variables and `static`
> locals — are zero-initialised when they have no initialiser (B, D). An array
> initialised with fewer values than elements has the rest set to zero, even
> inside a function (E). An automatic variable with no initialiser (A) and
> memory from `malloc` (C) have indeterminate values; `calloc` zeroes its
> block.

## c-intermediate-057
topic: preprocessor
answer: A

Which definition gives the intended result for both `SQUARE(a + 1)` and `100 / SQUARE(5)`?

- A: `#define SQUARE(x) ((x) * (x))`
- B: `#define SQUARE(x) x * x`
- C: `#define SQUARE(x) (x) * (x)`
- D: `#define SQUARE(x) (x * x)`

> A macro substitutes text, so precedence decides what the expansion means.
> B turns `SQUARE(a + 1)` into `a + 1 * a + 1`; D into `(a + 1 * a + 1)`.
> C handles the argument but not the context: `100 / SQUARE(5)` becomes
> `100 / (5) * (5)`, which is 100. Only A parenthesises each use of the
> parameter and the whole body. (It still evaluates its argument twice.)

## c-intermediate-058
topic: preprocessor
answer: C
run: c

What does this program print?

```c
#include <stdio.h>

#define MAX(a, b) ((a) > (b) ? (a) : (b))

int main(void) {
    int i = 3, j = 2;
    int m = MAX(i++, j);
    printf("%d %d\n", m, i);
    return 0;
}
```

- A: `3 4`
- B: `4 4`
- C: `4 5`
- D: `3 5`

> The call expands to `((i++) > (j) ? (i++) : (j))`. The condition compares 3
> with 2 and leaves `i` at 4; the `?:` operator sequences the condition before
> the chosen branch, and that branch is `(i++)` again, which yields 4 and
> leaves `i` at 5. A macro argument with a side effect runs once per
> appearance in the body; an inline function would evaluate it once.

## c-intermediate-059
topic: preprocessor
answer: B
run: c

What does this program print?

```c
#include <stdio.h>

#define STR(x) #x
#define XSTR(x) STR(x)
#define LIMIT 64

int main(void) {
    printf("%s %s\n", STR(LIMIT), XSTR(LIMIT));
    return 0;
}
```

- A: `64 64`
- B: `LIMIT 64`
- C: `LIMIT LIMIT`
- D: `64 LIMIT`

> An argument used with `#` is stringised exactly as written, without being
> macro-expanded first, so `STR(LIMIT)` is `"LIMIT"`. `XSTR` does not use `#`
> itself, so its argument is fully expanded before substitution: `XSTR(LIMIT)`
> becomes `STR(64)`, then `"64"`. That extra level is the standard way to
> stringise a macro's value; the same applies to `##`.

## c-intermediate-060
topic: preprocessor
answer: D
run: c

What does this program print?

```c
#include <stdio.h>

#define COLORS X(RED) X(GREEN) X(BLUE)

#define X(name) name,
enum color { COLORS COLOR_COUNT };
#undef X

#define X(name) #name,
static const char *color_names[] = { COLORS };
#undef X

int main(void) {
    printf("%d %s\n", COLOR_COUNT, color_names[GREEN]);
    return 0;
}
```

- A: `2 GREEN`
- B: `3 BLUE`
- C: `4 GREEN`
- D: `3 GREEN`

> This is an X-macro: one list, expanded twice with different definitions of
> `X`. The first expansion gives `enum color { RED, GREEN, BLUE, COLOR_COUNT };`
> so `GREEN` is 1 and `COLOR_COUNT` is 3, the number of entries. The second
> gives `{ "RED", "GREEN", "BLUE", }`, so index 1 is `"GREEN"`. The enum and
> the name table cannot drift apart, because both come from `COLORS`.

## c-intermediate-061
topic: preprocessor
answer: A
run: c

What does this program print?

```c
#include <stdio.h>

#define DEBUG 0

int main(void) {
#ifdef DEBUG
    printf("A");
#endif
#if DEBUG
    printf("B");
#endif
#if defined(TRACE) || UNKNOWN_NAME == 0
    printf("C");
#endif
    printf("\n");
    return 0;
}
```

- A: `AC`
- B: `A`
- C: `ABC`
- D: `C`

> `#ifdef` asks only whether the name is defined, and `DEBUG` is — with the
> value 0 — so `"A"` is printed. `#if DEBUG` evaluates that value, 0, so
> `"B"` is not. In an `#if`, an identifier that is not a macro is replaced by
> 0, so `UNKNOWN_NAME == 0` is true and `"C"` is printed even though `TRACE`
> is undefined. That silent 0 is why a misspelt macro name in `#if` goes
> unnoticed.

## c-intermediate-062
topic: preprocessor
answer: C

What does the guard in this header achieve?

```c
/* point.h */
#ifndef POINT_H
#define POINT_H
struct point { int x, y; };
#endif
```

- A: The header is compiled once for the whole program, however many `.c` files include it.
- B: `struct point` is defined only by the first `.c` file that includes the header.
- C: Including it twice in one translation unit does not define `struct point` twice.
- D: It stops the linker from seeing two definitions of `struct point`.

> The preprocessor handles each `.c` file separately. Within one, the first
> inclusion defines `POINT_H` and the struct, and any later inclusion — often
> indirect, through another header — skips the body, avoiding a redefinition
> error. Every `.c` file that includes the header still gets the struct, which
> it needs. A struct definition is not a linker symbol, so the linker never
> sees it.

## c-intermediate-063
topic: preprocessor
answer: B

What happens when this code is compiled?

```c
#define SWAP(a, b) { int t = a; a = b; b = t; }

if (x > y)
    SWAP(x, y);
else
    y = 0;
```

- A: It swaps `x` and `y` when `x > y`, and sets `y` to 0 otherwise.
- B: It does not compile: the `;` ends the `if`, leaving `else` unmatched.
- C: It compiles, but `else` pairs with the block, so `y = 0` always runs.
- D: It does not compile: a macro body cannot contain a declaration.

> The expansion is `if (x > y) { ... };` — the braces are the whole `if`
> statement, and the `;` after them is a separate empty statement, so the
> `else` that follows has no `if` to belong to: a syntax error. The standard
> fix is to wrap the body as `do { ... } while (0)`, which is one statement
> that takes the caller's semicolon. Declarations inside a macro body are fine.

## c-intermediate-064
topic: bitwise
answer: D
run: c

On a system with 32-bit two's-complement `int`, what does this program print?

```c
#include <stdio.h>

int main(void) {
    unsigned char x = 0x0F;
    unsigned char y = ~x;
    printf("%d %d %d\n", ~x, y, (~x & 0xFF) == y);
    return 0;
}
```

- A: `240 240 1`
- B: `-15 240 1`
- C: `-16 240 0`
- D: `-16 240 1`

> `x` is promoted to `int` before `~` is applied, so `~x` flips all 32 bits of
> 15, giving 0xFFFFFFF0, which is -16. Storing it in an `unsigned char` keeps
> the low 8 bits, 0xF0 = 240. Masking `~x` with 0xFF keeps those same 8 bits,
> so the comparison is true. Code that complements a small unsigned value has
> to mask or cast the result for this reason.

## c-intermediate-065
topic: bitwise
answer: A
run: c

What does this program print?

```c
#include <stdio.h>

int main(void) {
    unsigned flags = 0x5A;
    flags |= 1u << 0;
    flags &= ~(1u << 3);
    flags ^= 1u << 6;
    printf("%#x %u\n", flags, (flags >> 4) & 1u);
    return 0;
}
```

- A: `0x13 1`
- B: `0x53 1`
- C: `0x1b 1`
- D: `0x13 0`

> 0x5A is binary 0101 1010. Setting bit 0 gives 0101 1011 (0x5B); clearing
> bit 3 gives 0101 0011 (0x53); toggling bit 6, which is set, clears it:
> 0001 0011 (0x13). Bit 4 of that is 1. `%#x` prints the `0x` prefix. B
> forgets the toggle and C forgets the clear.

## c-intermediate-066
topic: bitwise
answer: C

This function is used as "is `n` a power of two":

```c
int is_pow2(unsigned n) {
    return (n & (n - 1)) == 0;
}
```

With 32-bit `unsigned`, for which argument does it give the wrong answer?

- A: `1`
- B: `2147483648u`
- C: `0`
- D: `4294967295u`

> `n & (n - 1)` clears the lowest set bit, so it is 0 exactly when `n` has at
> most one bit set. For 1 (2 to the 0) and 2147483648 (2 to the 31) that is
> correct, and 4294967295 has 32 bits set and is correctly rejected. But 0
> has no bits set: `0 & 0xFFFFFFFF` is 0, so 0 is reported as a power of two.
> The full test is `n != 0 && (n & (n - 1)) == 0`.

## c-intermediate-067
topic: bitwise
answer: B
run: c

What does this program print?

```c
#include <stdio.h>

int main(void) {
    unsigned x = 40;
    printf("%u %u\n", x & -x, x & (x - 1));
    return 0;
}
```

- A: `32 8`
- B: `8 32`
- C: `8 40`
- D: `40 39`

> 40 is binary 101000. For an unsigned `x`, `-x` is 2^32 − x, the two's
> complement, which keeps the lowest set bit and inverts everything above it,
> so `x & -x` isolates that bit: 8. `x - 1` is 100111, which clears the lowest
> set bit and sets the ones below it, so `x & (x - 1)` removes it: 32.

## c-intermediate-068
topic: bitwise
answer: A, C, E

With 32-bit `int`, which of these expressions have undefined behaviour in C? Select all that apply.

- A: `1 << 31`
- B: `1u << 31`
- C: `1u << 32`
- D: `-8 >> 1`
- E: `-1 << 1`

> For a signed left operand, `<<` is defined only when the operand is
> non-negative and the result fits: 2^31 does not fit in a 32-bit `int` (A),
> and a negative operand is undefined outright (E). Shifting by the type's
> width or more is undefined for any type (C). `1u << 31` is an ordinary
> unsigned value. Right-shifting a negative value is implementation-defined,
> not undefined (D): nearly every compiler shifts in sign bits.

## c-intermediate-069
topic: bitwise
answer: D
run: c

What does this program print?

```c
#include <stdio.h>

int main(void) {
    unsigned x = 0x12345678u;
    unsigned second = (x >> 8) & 0xFFu;
    unsigned swapped = ((x & 0xFFu) << 24) | (x >> 24);
    printf("%x %x\n", second, swapped);
    return 0;
}
```

- A: `34 78000012`
- B: `56 12000078`
- C: `65 78000012`
- D: `56 78000012`

> Shifts and masks work on the value, so the answer does not depend on byte
> order in memory. `x >> 8` is 0x123456, and masking with 0xFF keeps 0x56.
> `(x & 0xFF) << 24` moves the lowest byte, 0x78, to the top, and `x >> 24`
> brings the top byte, 0x12, to the bottom; the middle is zero: 0x78000012.

## c-intermediate-070
topic: undefined-behaviour
answer: A

What does the C standard say about the last line?

```c
int a[4] = {0};
int i = 1;
a[i] = i++;
```

- A: It is undefined: `i` is modified and read for the index, unsequenced.
- B: It stores 1 in `a[1]`, because the right side is evaluated first.
- C: It stores 1 in `a[2]`, because `i++` happens before the store.
- D: It is implementation-defined, and the compiler documents which.

> In C the operands of `=` are unsequenced relative to each other, so the
> side effect of `i++` on `i` is unsequenced against the read of `i` that
> computes the index. Modifying an object and reading it, unsequenced, for
> another purpose is undefined behaviour. (C++17 made the right side sequenced
> first, which is why B looks right to some readers; C has no such rule.)

## c-intermediate-071
topic: undefined-behaviour
answer: B

Clang and GCC at `-O2` compile this function to `return 0;`. Why are they allowed to?

```c
int will_overflow(int x) {
    return x + 1 < x;
}
```

- A: Because `x + 1` is computed in `long`, which cannot overflow here.
- B: Because signed overflow is undefined, so they may assume it never happens.
- C: Because comparing an expression with its own operand is undefined.
- D: Because `INT_MAX + 1` saturates at `INT_MAX`, which is not less than `x`.

> Signed integer overflow is undefined, so the compiler may assume `x + 1`
> never overflows; for every `x` where it does not, `x + 1 < x` is false, so
> the function can return 0. The check therefore checks nothing. Test before
> the arithmetic instead — `x == INT_MAX` — or use unsigned types, whose
> arithmetic wraps by definition. `int` arithmetic is done in `int`, and
> nothing saturates.

## c-intermediate-072
topic: undefined-behaviour
answer: C

What does the C standard say this program does?

```c
#include <stdio.h>

static int *make_counter(void) {
    int count = 0;
    return &count;
}

int main(void) {
    int *c = make_counter();
    *c = 5;
    printf("%d\n", *c);
    return 0;
}
```

- A: It prints `5`, since `count` lives on until `main` returns.
- B: It prints `0`, since `count` is set up again each time it is read.
- C: It is undefined: `count`'s lifetime ended when the function returned.
- D: It does not compile: a function cannot return a local's address.

> `count` is automatic: its lifetime ends when `make_counter` returns, and the
> pointer to it becomes indeterminate. Writing and reading through it is
> undefined — it may well print 5, or a value the next call left on the stack.
> Compilers warn about returning a local's address but accept it. Return the
> value, use a `static`, or allocate the counter.

## c-intermediate-073
topic: undefined-behaviour
answer: D

`float f` and `uint32_t u` are both 4 bytes. Which statement copies the bit pattern of `f` into `u` without undefined behaviour?

- A: `u = *(uint32_t *)&f;`
- B: `u = (uint32_t)f;`
- C: `u = *(uint32_t *)(void *)&f;`
- D: `memcpy(&u, &f, sizeof u);`

> Reading a `float` object through a `uint32_t` lvalue breaks the effective
> type ("strict aliasing") rules, so A is undefined, and the detour through
> `void *` in C changes nothing. B is defined but converts the value — 1.5f
> becomes 1 — rather than copying bits. `memcpy` copies the bytes and is
> always defined; compilers turn it into a single move. (Reading the other
> member of a union is also allowed in C.)

## c-intermediate-074
topic: undefined-behaviour
answer: B, E

`int i = 0;` is declared before each of these. Which are well-defined? Select all that apply.

- A: `i = i++;`
- B: `i++ && i++;`
- C: `printf("%d %d\n", i++, i++);`
- D: `int x = i++ + i++;`
- E: `i++, i++;`

> `&&` and the comma operator both sequence their left operand completely
> before their right one, so B and E modify `i` twice in a defined order. In
> A, C and D two modifications of `i` are unsequenced — the assignment's
> store against `i++`, the two arguments, the two operands of `+` — which is
> undefined behaviour in C, not merely an unknown result.

## c-intermediate-075
topic: undefined-behaviour
answer: B

With `int a[4];` declared, which of these statements has undefined behaviour?

- A: `unsigned u = UINT_MAX; u++;`
- B: `int *past = a + 5;`
- C: `int *end = a + 4;`
- D: `long long n = INT_MAX + 1LL;`

> Pointer arithmetic is defined only within an array and one element past
> its end, so merely computing `a + 5` is undefined, even if it is never
> dereferenced. `a + 4` is the one-past-the-end pointer, which may be formed
> and compared. Unsigned arithmetic wraps by definition, and `INT_MAX + 1LL`
> is computed in `long long`, where it fits.
