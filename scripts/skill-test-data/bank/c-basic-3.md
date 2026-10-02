---
skill: c
level: basic
---

## c-basic-051
topic: basics
answer: B
run: c

On a 64-bit Linux system, what does this program print?

```c
#include <stdio.h>

int main(void) {
    int n = -1;
    if (n < sizeof(int))
        printf("smaller\n");
    else
        printf("not smaller\n");
    return 0;
}
```

- A: `smaller`
- B: `not smaller`
- C: It does not compile: an `int` cannot be compared with a `size_t`.
- D: The behaviour is undefined: -1 has no `size_t` value.

> `sizeof` yields a `size_t`, an unsigned type (`unsigned long` here). When an
> `int` meets a wider unsigned type, the usual arithmetic conversions turn the
> `int` into that unsigned type, and converting -1 to an unsigned type is well
> defined: it becomes the largest value, 18446744073709551615. That is not less
> than 4, so the `else` branch runs. Compilers can warn about the
> signed/unsigned comparison but accept it.

## c-basic-052
topic: basics
answer: C
run: c

What does this program print?

```c
#include <stdio.h>

int main(void) {
    int a = 010, b = 0x10, c = 10;
    printf("%d %d %d\n", a, b, c);
    return 0;
}
```

- A: `10 16 10`
- B: `8 10 10`
- C: `8 16 10`
- D: `2 16 10`

> An integer constant that starts with `0` is octal, so `010` is 8; one that
> starts with `0x` is hexadecimal, so `0x10` is 16; anything else is decimal.
> `%d` prints all three in decimal. Padding a number with a leading zero to
> line up a column is a classic way to change its value by accident. (Standard
> C17 has no binary literal.)

## c-basic-053
topic: operators-control
answer: D
run: c

What does this program print?

```c
#include <stdio.h>

int main(void) {
    int sum = 0;
    for (int i = 1; i <= 10; i++) {
        if (i % 3 == 0)
            continue;
        if (i == 8)
            break;
        sum += i;
    }
    printf("%d\n", sum);
    return 0;
}
```

- A: `27`
- B: `29`
- C: `3`
- D: `19`

> `continue` skips the rest of this iteration (and still runs `i++`), so the
> multiples of 3 are skipped; `break` leaves the loop entirely. The loop adds
> 1, 2, 4, 5 and 7, then reaches `i == 8` and stops before adding it:
> 1 + 2 + 4 + 5 + 7 = 19. Treating `break` like `continue` would give 29, and
> treating `continue` like `break` would give 3.

## c-basic-054
topic: operators-control
answer: A

Which condition is true exactly when the `int` `n` is between 1 and 10, inclusive?

- A: `n >= 1 && n <= 10`
- B: `1 <= n <= 10`
- C: `n >= 1 || n <= 10`
- D: `!(n < 1 && n > 10)`

> C has no chained comparison: `1 <= n <= 10` groups as `(1 <= n) <= 10`, and
> `1 <= n` is 0 or 1, both of which are `<= 10`, so it is always true. With
> `||` every integer passes one side or the other. `n < 1 && n > 10` can never
> be true, so its negation is always true. Only the `&&` of the two bounds
> tests the range.

## c-basic-055
topic: functions
answer: D
run: c

What does this program print?

```c
#include <stdio.h>

void doubled(int a[], int n) {
    for (int i = 0; i < n; i++)
        a[i] *= 2;
}

void reset(int v) {
    v = 0;
}

int main(void) {
    int arr[3] = {1, 2, 3};
    doubled(arr, 3);
    reset(arr[0]);
    printf("%d %d %d\n", arr[0], arr[1], arr[2]);
    return 0;
}
```

- A: `1 2 3`
- B: `0 4 6`
- C: `0 2 3`
- D: `2 4 6`

> Passing `arr` passes a pointer to its first element (the pointer itself is
> copied), so `doubled` writes into the caller's array: `{2, 4, 6}`.
> `reset(arr[0])` passes a copy of one `int`, and setting the parameter `v` to
> 0 changes only that copy. Arguments are always passed by value; with an
> array, the value passed is an address.

## c-basic-056
topic: functions
answer: A
run: c

What does this program print?

```c
#include <stdio.h>

void show(int n) {
    if (n == 0)
        return;
    show(n - 1);
    printf("%d ", n);
}

int main(void) {
    show(3);
    printf("\n");
    return 0;
}
```

- A: `1 2 3`
- B: `3 2 1`
- C: `0 1 2 3`
- D: `3 2 1 0`

> Each call makes the recursive call first and prints only after it returns.
> `show(3)` calls `show(2)`, which calls `show(1)`, which calls `show(0)`;
> that returns without printing. Then the calls finish in reverse order:
> `show(1)` prints 1, `show(2)` prints 2, `show(3)` prints 3. Printing before
> the recursive call would give `3 2 1`.

## c-basic-057
topic: arrays
answer: D

`int a[8];` and `int i;` are declared, and each loop body reads `a[i]`. Which loop reads every element exactly once and nothing outside the array?

- A: `for (i = 0; i <= 8; i++)`
- B: `for (i = 1; i <= 8; i++)`
- C: `for (i = 0; i < sizeof a; i++)`
- D: `for (i = 0; i < 8; i++)`

> An array of 8 elements has indices 0 to 7. A starts right but also reads
> `a[8]`, one past the end; B skips `a[0]` and reads `a[8]`. C uses
> `sizeof a`, which is the size in bytes (8 × `sizeof(int)`, 32 with 4-byte
> `int`s), not the number of elements, so it runs far past the end. The element
> count is `sizeof a / sizeof a[0]`.

## c-basic-058
topic: arrays
answer: B
run: c

What does this program print?

```c
#include <stdio.h>

int main(void) {
    int g[2][3] = {1, 2, 3, 4, 5, 6};
    printf("%d %d\n", g[1][0], g[0][2]);
    return 0;
}
```

- A: `2 5`
- B: `4 3`
- C: `3 4`
- D: `5 3`

> C stores a two-dimensional array row by row, and a flat list of initializers
> fills it in that order: row 0 is `{1, 2, 3}` and row 1 is `{4, 5, 6}`. So
> `g[1][0]` (row 1, column 0) is 4 and `g[0][2]` (row 0, column 2) is 3.
> Filling column by column would give `2 5`.

## c-basic-059
topic: strings
answer: A, B

Inside a function, `char a[10];` is declared and not yet given any values. Which of these are guaranteed to leave `a` holding the string `"hi"`? Select all that apply.

- A: `strcpy(a, "hi");`
- B: `a[0] = 'h'; a[1] = 'i'; a[2] = '\0';`
- C: `a[0] = 'h'; a[1] = 'i';`
- D: `strcat(a, "hi");`

> A C string is the characters followed by a `'\0'`. `strcpy` copies the
> terminator along with the letters (A), and B writes it by hand. C stores the
> letters but leaves `a[2]` indeterminate, so nothing ends the string. `strcat`
> appends after the string already in `a`, and an uninitialised array holds no
> string, so it would search memory for a terminator (D).

## c-basic-060
topic: strings
answer: C
run: c

What does this program print?

```c
#include <stdio.h>
#include <string.h>

int main(void) {
    char buf[20] = "net";
    strcat(buf, "work");
    strcpy(buf + 3, "s");
    printf("%s %zu\n", buf, strlen(buf));
    return 0;
}
```

- A: `network 7`
- B: `netsork 7`
- C: `nets 4`
- D: `netswork 8`

> `strcat` appends: `buf` holds `"network"`. `strcpy(buf + 3, "s")` writes
> starting at index 3, and it copies the terminator too: `buf[3]` becomes `'s'`
> and `buf[4]` becomes `'\0'`. The string now ends after `"nets"`, so `%s`
> prints `nets` and `strlen` is 4; the leftover `"rk"` after the terminator is
> ignored.

## c-basic-061
topic: strings
answer: B

Inside a function:

```c
char s[5] = "hello";
size_t n = strlen(s);
```

What is true of these lines in C?

- A: They do not compile: the array is one element too small for the literal.
- B: They compile, but `s` has no terminator, so `strlen` reads past it.
- C: The compiler makes `s` six elements long so the terminator fits.
- D: The last letter is dropped to make room, so `s` holds `"hell"`.

> C allows a character array to be initialised with a literal that exactly
> fills it: the five letters are stored and the terminating `'\0'` is simply
> left out. `s` is then not a string, and `strlen` keeps reading past the end
> of the array looking for a zero byte, which is undefined behaviour. (C++
> rejects this initialisation; C does not.) `char s[] = "hello";` lets the
> compiler count 6.

## c-basic-062
topic: pointers
answer: C
run: c

What does this program print?

```c
#include <stdio.h>

int main(void) {
    int a[] = {2, 4, 6, 8};
    int sum = 0;
    for (int *p = a; p < a + 4; p += 2)
        sum += *p;
    printf("%d\n", sum);
    return 0;
}
```

- A: `20`
- B: `12`
- C: `8`
- D: `6`

> `p` starts at `a[0]`, and `p += 2` moves it two elements (not two bytes) each
> time: it visits `a[0]` and `a[2]`, then reaches `a + 4`, one past the end,
> where the loop stops. A pointer may point one past the end as long as it is
> not dereferenced. The sum is 2 + 6 = 8.

## c-basic-063
topic: pointers
answer: B

On a system where `int` is 4 bytes and pointers are 8, an `int *p` holds the address 1000. What address does `p + 3` hold?

- A: 1003
- B: 1012
- C: 1024
- D: 1004

> Adding an integer to a pointer moves it by that many objects of the type it
> points to. `p` points to 4-byte `int`s, so `p + 3` is 3 × 4 = 12 bytes on:
> 1012. The size of the pointer itself (8) plays no part, and the address does
> not move by 3 bytes.

## c-basic-064
topic: memory
answer: A
run: c

What does this program print?

```c
#include <stdio.h>
#include <stdlib.h>

int *squares(int n) {
    int *p = malloc(n * sizeof *p);
    if (p == NULL)
        return NULL;
    for (int i = 0; i < n; i++)
        p[i] = i * i;
    return p;
}

int main(void) {
    int *sq = squares(5);
    if (sq == NULL)
        return 1;
    printf("%d %d\n", sq[2], sq[4]);
    free(sq);
    return 0;
}
```

- A: `4 16`
- B: `9 25`
- C: `2 4`
- D: Undefined: the block is released when `squares` returns.

> Memory from `malloc` lives until it is passed to `free`, not until the
> function that allocated it returns. So returning the pointer is safe, and
> the caller owns the block and frees it. The elements are `i * i` for `i`
> from 0 to 4, so `sq[2]` is 4 and `sq[4]` is 16. A local array, by contrast,
> would die with the function.

## c-basic-065
topic: memory
answer: B, C

Which of these functions return a pointer that the caller may still use after the function returns (assume `malloc` succeeds)? Select all that apply.

- A: `int *f(void) { int x = 5; return &x; }`
- B: `int *f(void) { static int x = 5; return &x; }`
- C: `int *f(void) { int *p = malloc(sizeof *p); if (p) *p = 5; return p; }`
- D: `int *f(void) { int a[1] = {5}; return a; }`

> A local variable without `static` (A) or a local array (D) has automatic
> storage: it ends when the function returns, and the returned pointer dangles,
> so using it is undefined. A `static` local lives for the whole program (B),
> and a `malloc` block lives until it is freed (C), so both pointers stay
> valid; the caller must later `free` the one from C.

## c-basic-066
topic: structs
answer: D
run: c

What does this program print?

```c
#include <stdio.h>

enum level { LOW, MID = 5, HIGH, MAX = 2, OVER };

int main(void) {
    printf("%d %d %d\n", LOW, HIGH, OVER);
    return 0;
}
```

- A: `1 6 3`
- B: `0 2 4`
- C: `0 6 7`
- D: `0 6 3`

> The first enumerator is 0 unless given a value, and each one without a value
> is one more than the enumerator before it. So `LOW` is 0, `MID` is set to 5,
> `HIGH` is 6, `MAX` is set back to 2 and `OVER` is 3. Values may repeat or go
> down; the position in the list is not the value.

## c-basic-067
topic: structs
answer: B
run: c

What does this program print?

```c
#include <stdio.h>

struct item {
    int id;
    int qty;
    double price;
};

int main(void) {
    struct item it = { .qty = 4 };
    printf("%d %d %.1f\n", it.id, it.qty, it.price);
    return 0;
}
```

- A: `4 0 0.0`
- B: `0 4 0.0`
- C: `0 4 4.0`
- D: Unpredictable: `id` and `price` were never given values.

> A designated initializer `.qty = 4` sets that member by name, whatever its
> position. As with arrays, once a struct has an initializer, every member it
> does not mention is zero-initialised, even in a local variable: `id` is 0 and
> `price` is 0.0.

## c-basic-068
topic: storage-classes
answer: C
run: c

What does this program print?

```c
#include <stdio.h>

int main(void) {
    int x = 1;
    {
        int x = 2;
        x += 10;
    }
    for (int x = 0; x < 3; x++) {
    }
    printf("%d\n", x);
    return 0;
}
```

- A: `12`
- B: `3`
- C: `1`
- D: `13`

> A block and a `for` statement each start a new scope, and a name declared in
> an inner scope hides the outer one until that scope ends. The inner `x` that
> becomes 12 and the loop's `x` that reaches 3 are separate variables, and
> both are gone by the `printf`, which sees the outer `x`, still 1.

## c-basic-069
topic: storage-classes
answer: A

What does `static` mean on a function defined at file scope, as in `static int helper(void) { /* ... */ }`?

- A: Only code in its own source file can call `helper` by name.
- B: `helper`'s local variables keep their values between calls.
- C: `helper` is placed in read-only memory and cannot recurse.
- D: `helper` is expanded inline at every place where it is called.

> At file scope, `static` gives a function (or variable) internal linkage: its
> name is visible only within its own translation unit, so another `.c` file
> cannot call it by name, and two files may each have their own `helper`.
> Local variables keep their values only if each is itself declared `static`.

## c-basic-070
topic: preprocessor
answer: D
run: c

What does this program print?

```c
#include <stdio.h>

#define NAME "Ada"
#define N 3

int main(void) {
    printf("NAME has N letters: %d\n", N);
    return 0;
}
```

- A: `Ada has 3 letters: 3`
- B: `NAME has 3 letters: 3`
- C: `"Ada" has 3 letters: 3`
- D: `NAME has N letters: 3`

> The preprocessor replaces macro names only where they appear as separate
> tokens in the code. Text inside a string literal is one token, so `NAME` and
> `N` in the format string are left alone. The `N` passed as an argument is a
> token of its own and becomes 3.

## c-basic-071
topic: preprocessor
answer: C
run: c

What does this program print?

```c
#include <stdio.h>

#define WIDTH 4
#define AREA WIDTH * HEIGHT
#define HEIGHT 5

int main(void) {
    int a = AREA;
#undef WIDTH
#define WIDTH 10
    int b = AREA;
    printf("%d %d\n", a, b);
    return 0;
}
```

- A: `20 20`
- B: `50 50`
- C: `20 50`
- D: It does not compile: `HEIGHT` is used before it is defined.

> A macro's body is stored as text and expanded where the macro is used, with
> the definitions in force at that point. At the first use both `WIDTH` (4) and
> `HEIGHT` (5) are defined, so `a` is 20; defining `HEIGHT` after `AREA` is
> fine. `#undef` and the new `#define` change `WIDTH` for every later line, so
> the second `AREA` is 10 * 5 = 50.

## c-basic-072
topic: bitwise
answer: B
run: c

What does this program print?

```c
#include <stdio.h>

int main(void) {
    unsigned int x = 5;
    printf("%u %u\n", x << 3, x >> 1);
    return 0;
}
```

- A: `15 2`
- B: `40 2`
- C: `40 10`
- D: `20 2`

> Shifting left by `k` multiplies an unsigned value by 2 to the power `k`
> (while no bits fall off the top): 5 << 3 is 5 × 8 = 40. Shifting right by 1
> divides by 2 and discards the remainder: 5 >> 1 is 2. The shift count is an
> exponent of 2, not a multiplier, so 5 << 3 is not 5 × 3.

## c-basic-073
topic: bitwise
answer: A
run: c

On a system where `unsigned int` is 32 bits, what does this program print?

```c
#include <stdio.h>

int main(void) {
    unsigned int x = 0;
    printf("%u %X\n", ~x, ~x & 0xFF);
    return 0;
}
```

- A: `4294967295 FF`
- B: `-1 FF`
- C: `4294967295 FFFFFFFF`
- D: `1 1`

> `~` flips every bit, so `~0u` has all 32 bits set: as an unsigned value that
> is 2^32 - 1 = 4294967295, and `%u` never prints a sign. ANDing with `0xFF`
> keeps the low 8 bits, 255, which `%X` prints in hexadecimal as `FF`. `~` is
> bitwise NOT, not logical `!`, which would give 1.

## c-basic-074
topic: undefined-behaviour
answer: C

What can be said about this program?

```c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int *p = malloc(sizeof *p);
    if (p == NULL)
        return 1;
    *p = 5;
    free(p);
    printf("%d\n", *p);
    return 0;
}
```

- A: It prints `5`, because `free` only marks the block as available.
- B: It prints `0`, because `free` clears the block before releasing it.
- C: Its behaviour is undefined: `p` is used after its block was freed.
- D: It is guaranteed to stop with a segmentation fault at the `printf`.

> After `free(p)` the block no longer belongs to the program, but `p` still
> holds its old address: a dangling pointer. Reading through it is undefined
> behaviour. It may print 5, another number, or crash, and none of those is
> guaranteed, which is what makes the bug hard to find. Setting `p = NULL`
> after `free` turns a later mistake into a reliable crash.

## c-basic-075
topic: undefined-behaviour
answer: A

```c
int a = 10, b = 0;
double r = a / b;
```

What can be said about these lines?

- A: The behaviour is undefined: this is integer division by zero.
- B: `r` is infinity, because the result is stored in a `double`.
- C: `r` is 0, because division by zero yields 0 in C.
- D: It does not compile: the compiler rejects division by a variable that is 0.

> `a / b` divides two `int`s, so it is integer division, decided before the
> result is converted for `r`. Integer division by zero is undefined
> behaviour; on many machines it stops the program with a signal. Infinity
> comes only from floating-point division under IEEE 754, as in `10.0 / 0.0`.
> It compiles: a division by zero is not an error the compiler must report,
> and at most it warns.
