---
skill: c
level: intermediate
---

## c-intermediate-025
topic: strings
answer: C

What is true of this code?

```c
char name[4];
strncpy(name, "hello", sizeof name);
printf("%s\n", name);
```

- A: It prints `hell`, because `strncpy` stops after four characters.
- B: It prints `hel`, because `strncpy` keeps the last byte for `'\0'`.
- C: `name` gets no terminator, so `printf` reads past its end: undefined.
- D: It does not compile, because the source is longer than the buffer.

> `strncpy` copies at most `n` bytes and adds a terminator only if the source
> ends within them. "hello" does not fit in 4, so `name` holds `h`, `e`, `l`,
> `l` and no `'\0'`, and `%s` keeps reading beyond the array — undefined
> behaviour. `strncpy` does not reserve a byte (that is `snprintf`), and the
> compiler does not check lengths. Set `name[sizeof name - 1] = '\0'` after
> the call, or use `snprintf`.

## c-intermediate-026
topic: strings
answer: A
run: c

What does this program print?

```c
#include <stdio.h>
#include <string.h>

int main(void) {
    char buf[8];
    memset(buf, 'x', sizeof buf);
    strncpy(buf, "ab", 5);
    for (int i = 0; i < 8; i++)
        putchar(buf[i] ? buf[i] : '.');
    putchar('\n');
    return 0;
}
```

- A: `ab...xxx`
- B: `ab.xxxxx`
- C: `ab......`
- D: `abxxxxxx`

> When the source is shorter than `n`, `strncpy` copies it and then pads with
> `'\0'` until exactly `n` bytes have been written. So bytes 0–1 are `ab`,
> bytes 2–4 are zero (shown as dots), and bytes 5–7, beyond the 5 written,
> keep the `x` from `memset`. `strcpy` would have written only one `'\0'`.

## c-intermediate-027
topic: strings
answer: D
run: c

What does this program print?

```c
#include <stdio.h>

int main(void) {
    char buf[5];
    int n = snprintf(buf, sizeof buf, "%d-%d", 123, 45);
    printf("%d %s\n", n, buf);
    return 0;
}
```

- A: `4 123-`
- B: `5 123-4`
- C: `6 123-4`
- D: `6 123-`

> `snprintf` writes at most `size - 1` characters and always terminates, so
> the 5-byte buffer receives `123-` and a `'\0'`. Its return value is the
> length the full output would have had, 6 for `123-45`, not the number of
> characters stored. A return value of `size` or more is how a caller detects
> truncation.

## c-intermediate-028
topic: strings
answer: B
run: c

What does this program print?

```c
#include <stdio.h>
#include <string.h>

int main(void) {
    const char *path = "usr/local/bin";
    const char *first = strchr(path, '/');
    const char *last = strrchr(path, '/');
    printf("%d %d %s\n", (int)(first - path), (int)(last - path), last + 1);
    return 0;
}
```

- A: `3 9 /bin`
- B: `3 9 bin`
- C: `4 10 bin`
- D: `9 3 bin`

> `strchr` returns a pointer to the first `/`, at index 3, and `strrchr` to
> the last, at index 9; subtracting the start gives the zero-based index.
> `last` points at the `/` itself, so `last + 1` is the text after it, `bin`.

## c-intermediate-029
topic: strings
answer: A

What is the smallest `N` for which this code is safe?

```c
char buf[N];
strcpy(buf, "key");
strcat(buf, "=");
strcat(buf, "value");
```

- A: 10
- B: 9
- C: 11
- D: 12

> The result is `key=value`, 3 + 1 + 5 = 9 characters, and the string needs
> one more byte for its terminating `'\0'`: 10. Each `strcat` overwrites the
> previous terminator rather than keeping it, so the three literals' own
> terminators do not add up (that count gives 12).

## c-intermediate-030
topic: strings
answer: C

This function is meant to count the bytes from 128 to 255 in a string:

```c
int count_high(const char *s) {
    int n = 0;
    for (; *s; s++)
        if (*s >= 128)
            n++;
    return n;
}
```

On x86-64 Linux, where plain `char` is signed, what does it return?

- A: The number of bytes from 128 to 255, as intended.
- B: It depends on whether the input is UTF-8 or Latin-1.
- C: 0 for every input, since a signed `char` never reaches 128.
- D: Nothing defined, since comparing a `char` with 128 overflows.

> Whether plain `char` is signed is implementation-defined: signed on x86,
> unsigned on ARM Linux. Where it is signed, its values run from -128 to 127,
> so a byte such as 0xC3 reads as a negative number and `*s >= 128` is never
> true. The comparison itself is ordinary `int` arithmetic, not an overflow.
> Portable byte handling converts first: `(unsigned char)*s >= 128`.

## c-intermediate-031
topic: pointers
answer: D
run: c

What does this program print?

```c
#include <stdio.h>

static void skip_a(const char *p) {
    while (*p == '-')
        p++;
}

static void skip_b(const char **pp) {
    while (**pp == '-')
        (*pp)++;
}

int main(void) {
    const char *s = "--hi";
    const char *t = "--hi";
    skip_a(s);
    skip_b(&t);
    printf("[%s] [%s]\n", s, t);
    return 0;
}
```

- A: `[hi] [hi]`
- B: `[--hi] [--hi]`
- C: `[hi] [--hi]`
- D: `[--hi] [hi]`

> C passes everything by value, pointers included. `skip_a` advances its own
> copy `p`, and `s` in `main` is unchanged. `skip_b` receives the address of
> `t`, so `(*pp)++` advances `t` itself past the dashes. To let a function
> move the caller's pointer, pass a pointer to that pointer.

## c-intermediate-032
topic: pointers
answer: B, C, E

Given these declarations, which statements compile? Select all that apply.

```c
int x = 1, y = 2;
const int *p = &x;
int *const q = &x;
```

- A: `*p = 5;`
- B: `p = &y;`
- C: `x = 5;`
- D: `q = &y;`
- E: `*q = 5;`

> `const int *p` is a pointer to `const int`: the pointer may be re-aimed (B)
> but may not be used to write (A). `int *const q` is a constant pointer to a
> modifiable `int`: writing through it is fine (E), re-aiming it is not (D).
> Neither declaration makes `x` itself constant, so `x = 5` compiles (C) —
> `p` only promises not to change `x` through `p`.

## c-intermediate-033
topic: pointers
answer: B
run: c

What does this program print?

```c
#include <stdio.h>

int main(void) {
    int a[] = {10, 20, 30};
    int *p = a;
    int x = *p++;
    int y = (*p)++;
    int z = ++*p;
    printf("%d %d %d %d\n", x, y, z, a[1]);
    return 0;
}
```

- A: `10 21 22 22`
- B: `10 20 22 22`
- C: `10 20 30 21`
- D: `11 21 22 22`

> Postfix `++` binds more tightly than unary `*`, so `*p++` is `*(p++)`: it
> reads `a[0]` (10) and moves `p` to `a[1]`. `(*p)++` increments `a[1]` and
> yields its old value, 20, leaving it 21. `++*p` is `++(*p)`: `a[1]` becomes
> 22 and that is the value. `p` stays on `a[1]` after the first line.

## c-intermediate-034
topic: pointers
answer: A
run: c

What does this program print?

```c
#include <stdio.h>
#include <string.h>

int main(void) {
    const char *words[] = {"red", "green", "blue", NULL};
    const char **w = words;
    size_t total = 0;
    while (*w)
        total += strlen(*w++);
    printf("%zu %c %d\n", total, **(w - 1), (int)(w - words));
    return 0;
}
```

- A: `12 b 3`
- B: `12 r 3`
- C: `12 b 4`
- D: `15 b 3`

> `w` walks the array of pointers until it reaches the `NULL` entry: 3 + 5 + 4
> = 12 characters, since `strlen` does not count terminators. The loop stops
> with `w` on the `NULL` at index 3, so `w - words` is 3 and `w - 1` is the
> entry for `"blue"`; dereferencing twice gives its first character, `b`.

## c-intermediate-035
topic: pointers
answer: C
run: c

On a 64-bit system, where `int` is 4 bytes and pointers are 8, what does this program print?

```c
#include <stdio.h>

int main(void) {
    int **g = NULL;
    printf("%zu %zu %zu\n", sizeof g, sizeof *g, sizeof **g);
    return 0;
}
```

- A: `8 4 4`
- B: `8 8 8`
- C: `8 8 4`
- D: It crashes: `*g` dereferences a null pointer.

> The operand of `sizeof` is not evaluated (unless it is a variable-length
> array); only its type matters, so nothing is dereferenced and there is no
> crash. `g` is an `int **` (8), `*g` an `int *` (8), `**g` an `int` (4). The
> idiom `p = malloc(n * sizeof *p)` relies on the same rule.

## c-intermediate-036
topic: pointers
answer: D

`int arr[3];` — which declaration gives `p` the type of `&arr`, a pointer to an array of three `int`s?

- A: `int *p[3];`
- B: `int **p;`
- C: `int *p;`
- D: `int (*p)[3];`

> The parentheses bind `*` to `p` first, so `p` is a pointer, and what it
> points to is `int [3]`. Without them, `int *p[3]` is an array of three
> pointers to `int`, because `[]` binds more tightly than `*`. `int **p` is a
> pointer to a pointer, and `int *p` points to a single `int` (the type of
> `arr` after decay, not of `&arr`).

## c-intermediate-037
topic: pointers
answer: B

Which statement about `void *` in standard C is true?

- A: Arithmetic such as `vp + 1` advances the pointer by one byte.
- B: Any object pointer converts to `void *` and back without a cast.
- C: Dereferencing `*vp` reads the first byte that it points to.
- D: The result of `malloc` must be cast before it is assigned.

> C converts between `void *` and any object pointer type implicitly, both
> ways, and a pointer converted to `void *` and back compares equal to the
> original. That is why `int *a = malloc(...)` needs no cast in C (C++ does
> require one). Arithmetic on `void *` is a GCC extension, not standard C,
> and `void` has no value to read, so `*vp` cannot be used as one.

## c-intermediate-038
topic: memory
answer: A

Assuming both allocations succeed, what is true of the assignment through `alias`?

```c
int *a = malloc(4 * sizeof *a);
int *alias = a;
int *grown = realloc(a, 1000 * sizeof *a);
if (grown) {
    a = grown;
    alias[0] = 1;
}
```

- A: It is undefined if `realloc` moved the block, as it is allowed to.
- B: It is fine, because `realloc` always grows a block where it stands.
- C: It is fine, because `realloc` updates every pointer to the old block.
- D: It is fine, because the old block stays valid until it is freed.

> `realloc` may grow the block in place or allocate a new one, copy the
> contents and free the old one. In the second case every pointer into the
> old block, `alias` included, is dangling, and writing through it is
> undefined. No pointer but the return value is updated; after a `realloc`,
> re-derive any aliases from the new pointer.

## c-intermediate-039
topic: memory
answer: C

What is wrong with this growth step?

```c
char *buf = malloc(64);
/* ... */
buf = realloc(buf, 4096);
if (buf == NULL)
    return -1;
```

- A: If `realloc` fails it frees the old block, so the data is lost.
- B: `realloc` can only shrink a block; growing needs `malloc` and `memcpy`.
- C: If `realloc` fails, the old block leaks: its only pointer is lost.
- D: Nothing, since on success `realloc` always returns the same pointer.

> On failure `realloc` returns `NULL` and leaves the original block untouched
> and still allocated. Assigning the result straight to `buf` overwrites the
> only pointer to that block, so it can never be freed: a leak (and the data
> is unreachable too). Assign to a temporary, check it, and only then replace
> `buf`. `realloc` grows as well as shrinks, and it may move the block.

## c-intermediate-040
topic: memory
answer: D
run: c

What does this program print?

```c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    size_t cap = 1, len = 0;
    int grows = 0;
    int *v = malloc(cap * sizeof *v);
    if (!v)
        return 1;
    for (int i = 0; i < 10; i++) {
        if (len == cap) {
            int *t = realloc(v, 2 * cap * sizeof *t);
            if (!t) {
                free(v);
                return 1;
            }
            v = t;
            cap *= 2;
            grows++;
        }
        v[len++] = i * i;
    }
    printf("%zu %zu %d %d\n", len, cap, grows, v[9]);
    free(v);
    return 0;
}
```

- A: `10 16 5 81`
- B: `10 10 4 81`
- C: `10 8 3 81`
- D: `10 16 4 81`

> The buffer grows only when it is full: at lengths 1, 2, 4 and 8 the capacity
> doubles to 2, 4, 8 and 16 — four `realloc` calls for ten elements. The ninth
> and tenth elements fit in the 16 slots, so capacity ends at 16 with length
> 10. `realloc` keeps the old contents, so `v[9]` is 9 × 9 = 81.

## c-intermediate-041
topic: memory
answer: A, C, D

`char *p = malloc(16);` has succeeded. Which of these are undefined behaviour? Select all that apply.

- A: `free(p); free(p);`
- B: `free(NULL);`
- C: `free(p + 1);`
- D: `free(p); printf("%d\n", p[0]);`
- E: `free(p); p = NULL; free(p);`

> Freeing the same block twice (A) and freeing a pointer that `malloc` did not
> return (C, the middle of a block) are undefined, and so is reading memory
> after it has been freed (D). `free(NULL)` is defined to do nothing, which is
> why setting a pointer to `NULL` after freeing it makes a second `free`
> harmless (E).

## c-intermediate-042
topic: memory
answer: B

What is wrong with `copy`?

```c
char *copy(const char *src) {
    char *dst = malloc(strlen(src));
    if (dst)
        strcpy(dst, src);
    return dst;
}
```

- A: `strlen` counts the terminator, so it allocates one byte too many.
- B: It allocates one byte too few: `strcpy` also writes the `'\0'`.
- C: `malloc` needs the length multiplied by `sizeof(char *)`.
- D: Nothing; this is the usual way to duplicate a string in C.

> `strlen` counts the characters before the terminator, not the terminator,
> but `strcpy` copies the terminator too. So `strcpy` writes one byte past the
> end of the block — a heap overflow, undefined behaviour that often goes
> unnoticed until it corrupts the allocator. Allocate `strlen(src) + 1`.
> `sizeof(char)` is 1 by definition; `sizeof(char *)` would be the size of a
> pointer.

## c-intermediate-043
topic: memory
answer: A
run: c

What does this program print?

```c
#include <stdio.h>
#include <string.h>

int main(void) {
    char s[] = "abcdef";
    memmove(s + 2, s, 3);
    printf("%s\n", s);
    return 0;
}
```

- A: `ababcf`
- B: `ababaf`
- C: `abcabc`
- D: `aabcef`

> `memmove` copies as if through a temporary buffer, so overlapping source and
> destination are handled: the three bytes `abc` land at indexes 2–4, giving
> `ab` + `abc` + `f`. A naive front-to-back byte copy would read index 2 after
> overwriting it and produce `ababaf`; `memcpy` with overlapping regions is
> undefined for exactly that reason.

## c-intermediate-044
topic: memory
answer: D
run: c

On a system with 4-byte two's-complement `int`, what does this program print?

```c
#include <stdio.h>
#include <string.h>

int main(void) {
    int a[3], b[3];
    memset(a, 1, sizeof a);
    memset(b, 0xFF, sizeof b);
    printf("%d %d\n", a[2], b[0]);
    return 0;
}
```

- A: `1 -1`
- B: `1 255`
- C: `16843009 255`
- D: `16843009 -1`

> `memset` sets every **byte** to the value, not every element. Each `int` in
> `a` becomes the bytes 01 01 01 01, which is 0x01010101 = 16843009 whatever
> the byte order. In `b` every bit is set, which in two's complement is -1.
> That is why `memset` is used on `int` arrays only with 0 (and sometimes -1).

## c-intermediate-045
topic: structs
answer: C
run: c

On a 64-bit Linux system, where `int` is 4 bytes and 4-byte aligned, what does this program print?

```c
#include <stdio.h>

struct a { char c; int i; char d; };
struct b { int i; char c; char d; };

int main(void) {
    printf("%zu %zu\n", sizeof(struct a), sizeof(struct b));
    return 0;
}
```

- A: `6 6`
- B: `12 12`
- C: `12 8`
- D: `8 8`

> Members are laid out in declaration order, each at an offset that suits its
> alignment. In `struct a`, `c` is at 0, three padding bytes put `i` at 4, and
> `d` is at 8; the size is then rounded up to a multiple of 4 so that every
> element of an array is aligned: 12. In `struct b`, `i` is at 0 and the two
> `char`s at 4 and 5, rounded up to 8. Ordering members from largest to
> smallest alignment saves the padding.

## c-intermediate-046
topic: structs
answer: A, D, E

For `struct rec { char tag; int value; };`, which of these does the C standard guarantee on every platform? Select all that apply.

- A: `offsetof(struct rec, tag) == 0`
- B: `sizeof(struct rec) == sizeof(char) + sizeof(int)`
- C: `offsetof(struct rec, value) == 4`
- D: `offsetof(struct rec, value) > offsetof(struct rec, tag)`
- E: `sizeof(struct rec) >= sizeof(char) + sizeof(int)`

> The standard allows padding between members and at the end but never at the
> beginning, so the first member is at offset 0 (A). Members get increasing
> addresses in declaration order (D), and they do not overlap, so the struct is
> at least as large as its members together (E). How much padding there is
> depends on the ABI: `value` is at offset 4 and the size is 8 on common
> 64-bit systems, but neither is guaranteed (B, C).

## c-intermediate-047
topic: structs
answer: B

`union num { int i; double d; };` — which statement is true in C?

- A: Its size is `sizeof(int) + sizeof(double)`, one member after the other.
- B: All members start at offset 0; its size is at least `sizeof(double)`.
- C: Each member has its own storage, so writing `d` leaves `i` unchanged.
- D: Only its first member, `i`, can be given a value in an initialiser.

> A union's members overlap: all of them start at the beginning, and the union
> is as large as its largest member plus any padding its alignment needs. So
> writing `d` overwrites the bytes `i` occupies. A plain initialiser
> `{ 3 }` initialises the first member, but a designated one,
> `{ .d = 1.5 }`, can initialise any member.

## c-intermediate-048
topic: structs
answer: A
run: c

What does this program print?

```c
#include <stdio.h>

struct box {
    int n;
    int data[3];
    int *ext;
};

int main(void) {
    int shared = 7;
    struct box a = {3, {1, 2, 3}, &shared};
    struct box b = a;
    b.n = 9;
    b.data[0] = 100;
    *b.ext = 50;
    printf("%d %d %d\n", a.n, a.data[0], *a.ext);
    return 0;
}
```

- A: `3 1 50`
- B: `3 100 50`
- C: `9 100 50`
- D: `3 1 7`

> Struct assignment copies every member, and an array member is copied
> element by element, so `b.n` and `b.data` are independent of `a`'s. A
> pointer member is copied as an address: `b.ext` and `a.ext` both point at
> `shared`, so writing through one is seen through the other. The copy is
> shallow for what the struct points to, deep for what it contains.

## c-intermediate-049
topic: structs
answer: D
run: c

What does this program print?

```c
#include <stdio.h>

struct flags {
    unsigned int mode : 3;
    unsigned int level : 2;
};

int main(void) {
    struct flags f = {0, 0};
    f.mode = 9;
    f.level = 6;
    printf("%d %d\n", f.mode, f.level);
    return 0;
}
```

- A: `9 6`
- B: `7 3`
- C: `4 3`
- D: `1 2`

> An unsigned bit-field of width w holds values modulo 2^w, like any unsigned
> type: a 3-bit field keeps 9 mod 8 = 1 (the low bits of 1001), and a 2-bit
> field keeps 6 mod 4 = 2 (the low bits of 110). Nothing saturates at the
> maximum. In an expression the small fields are promoted to `int`, which is
> why `%d` prints them.

## c-intermediate-050
topic: structs
answer: C

Which statement about this code is true in C?

```c
enum level { LOW = 1, MID, HIGH = 10, TOP };
enum level lv = 7;
```

- A: `MID` is 2 and `TOP` is 11, but `lv = 7` is a compile error in C.
- B: `MID` is 2 and `TOP` is 4, as a constant without `=` counts its position.
- C: `MID` is 2 and `TOP` is 11, and `lv = 7` compiles though no constant is 7.
- D: `MID` is 1 and `TOP` is 10, as a constant without `=` repeats the last one.

> A constant without `=` is one more than the constant before it: `MID` is
> `LOW + 1` = 2, and `TOP` is `HIGH + 1` = 11. Enumeration constants have
> type `int`, and C converts integers to and from an enum type implicitly, so
> an enum variable can hold a value no constant names — `lv = 7` compiles.
> (C++ would reject it without a cast.)
