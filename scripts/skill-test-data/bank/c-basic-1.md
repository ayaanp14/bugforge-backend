---
skill: c
level: basic
---

## c-basic-001
topic: basics
answer: C
run: c

What does this program print?

```c
#include <stdio.h>

int main(void) {
    int a = -7, b = 2;
    printf("%d %d\n", a / b, a % b);
    return 0;
}
```

- A: `-4 1`
- B: `-3 1`
- C: `-3 -1`
- D: `-4 -1`

> Since C99, integer division truncates toward zero, so `-7 / 2` is `-3`, not
> `-4` (that is floor division, which Python uses). The remainder is defined so
> that `(a / b) * b + a % b == a`: `-3 * 2 + r == -7` gives `r == -1`. In C the
> result of `%` takes the sign of the left operand.

## c-basic-002
topic: basics
answer: A
run: c

On a 64-bit Linux system, where `int` is 4 bytes, what does this program print?

```c
#include <stdio.h>

int main(void) {
    char c = 'a';
    printf("%zu %zu\n", sizeof(c), sizeof('a'));
    return 0;
}
```

- A: `1 4`
- B: `1 1`
- C: `4 4`
- D: `1 2`

> `sizeof(char)` is 1 by definition. But in C a character constant such as
> `'a'` has type `int`, not `char`, so `sizeof('a')` is `sizeof(int)`, which is
> 4 here. (C++ differs: there `'a'` is a `char` and the answer would be `1 1`.)
> `%zu` is the conversion for the `size_t` that `sizeof` yields.

## c-basic-003
topic: basics
answer: D

On a 64-bit Linux system, where `short` is 2 bytes, `int` 4 and `long` 8, a variable must hold the value 3,000,000,000 (three billion) and is never negative. Which is the narrowest of these types that can hold it?

- A: `unsigned short`
- B: `int`
- C: `long`
- D: `unsigned int`

> A 4-byte `int` holds at most 2,147,483,647, so three billion does not fit. An
> `unsigned int` of the same size uses the sign bit for magnitude and reaches
> 4,294,967,295, so it fits, and since the value is never negative nothing is
> lost. `long` would also hold it but takes 8 bytes; `unsigned short` tops out
> at 65,535.

## c-basic-004
topic: operators-control
answer: B
run: c

What does this program print?

```c
#include <stdio.h>

int main(void) {
    int n = 3, total = 0;
    switch (n) {
    case 1:
        total += 1;
    case 3:
        total += 3;
    case 5:
        total += 5;
        break;
    default:
        total += 100;
    }
    printf("%d\n", total);
    return 0;
}
```

- A: `3`
- B: `8`
- C: `108`
- D: `9`

> The `switch` jumps straight to `case 3`, so `case 1` never runs. With no
> `break` after `case 3`, execution falls through into `case 5`, adding 5, and
> that `break` leaves the switch before `default`. Total: 3 + 5 = 8.

## c-basic-005
topic: operators-control
answer: D
run: c

What does this program print?

```c
#include <stdio.h>

int main(void) {
    int a = 0, b = 0;
    int r1 = a++ && b++;
    int r2 = a++ || b++;
    printf("%d %d %d %d\n", a, b, r1, r2);
    return 0;
}
```

- A: `2 2 0 1`
- B: `2 1 0 1`
- C: `2 0 1 1`
- D: `2 0 0 1`

> `&&` and `||` evaluate their right operand only when the left one has not
> already decided the result. In the first line `a++` yields 0 (then `a` is 1),
> so `&&` is false without touching `b`: `r1` is 0. In the second, `a++` yields
> 1 (then `a` is 2), so `||` is true without touching `b`: `r2` is 1. `b` is
> never incremented.

## c-basic-006
topic: functions
answer: B
run: c

What does this program print?

```c
#include <stdio.h>

void swap(int a, int b) {
    int t = a;
    a = b;
    b = t;
}

int main(void) {
    int x = 1, y = 2;
    swap(x, y);
    printf("%d %d\n", x, y);
    return 0;
}
```

- A: `2 1`
- B: `1 2`
- C: `2 2`
- D: `1 1`

> C passes every argument by value: `a` and `b` are copies of `x` and `y`, and
> swapping the copies leaves the caller's variables alone. To swap the caller's
> variables, the function must take their addresses (`int *a, int *b`) and be
> called as `swap(&x, &y)`.

## c-basic-007
topic: functions
answer: A

A file declares `double area(double r);` before `main`, and `main` calls `area(2)`. What happens to the argument?

- A: The `int` 2 is converted to the `double` 2.0 before the call.
- B: It does not compile: the argument must already be a `double`.
- C: The `int`'s bits are reinterpreted as a `double`, giving garbage.
- D: `r` holds 2, and the body then does integer arithmetic.

> With a prototype in scope, each argument is converted, as if by assignment,
> to the type of its parameter. So `area(2)` passes 2.0 and `r` is an ordinary
> `double` inside the function. No cast is needed, and nothing is reinterpreted
> bit for bit. The danger the prototype prevents is calling a function with no
> declaration in scope.

## c-basic-008
topic: arrays
answer: C
run: c

What does this program print?

```c
#include <stdio.h>

int main(void) {
    int a[5] = {3, 1};
    int sum = 0;
    for (int i = 0; i < 5; i++)
        sum += a[i];
    printf("%d %d\n", sum, a[4]);
    return 0;
}
```

- A: `7 1`
- B: Unpredictable: `a[2]` to `a[4]` were never given values.
- C: `4 0`
- D: `11 3`

> When an array has an initializer with fewer values than elements, the
> remaining elements are initialised to zero, even for a local array. So `a` is
> `{3, 1, 0, 0, 0}`: the sum is 4 and `a[4]` is 0. Nothing repeats the last
> value or the pattern. Only an array with no initializer at all would start
> with indeterminate values.

## c-basic-009
topic: arrays
answer: D

Inside a function:

```c
int a[3] = {1, 2, 3};
int b[3];
b = a;
```

What does the last line do?

- A: It copies all three elements of `a` into `b`.
- B: It makes `b` refer to the same storage as `a`.
- C: It copies only the first element, `a[0]`, into `b[0]`.
- D: It does not compile: an array cannot be assigned to.

> An array is not a modifiable lvalue in C, so it cannot appear on the left of
> `=`; the compiler rejects the line. To copy the elements, use a loop or
> `memcpy(b, a, sizeof a)`. (An array inside a struct is copied when the struct
> is assigned, which is a different thing.)

## c-basic-010
topic: strings
answer: A
run: c

What does this program print?

```c
#include <stdio.h>
#include <string.h>

int main(void) {
    char s[] = "ab\0cd";
    printf("%zu %zu\n", sizeof(s), strlen(s));
    return 0;
}
```

- A: `6 2`
- B: `6 4`
- C: `5 2`
- D: `5 4`

> The literal holds five characters (`a`, `b`, a null character, `c`, `d`) and
> the compiler adds the terminating `'\0'`, so the array has 6 `char`s and
> `sizeof(s)` is 6. `strlen` counts characters up to the first null character,
> which comes after `ab`: 2. The bytes after it are in the array but invisible
> to the string functions.

## c-basic-011
topic: strings
answer: B

Inside a function:

```c
char *p = "hello";
char q[] = "hello";
p[0] = 'J';   /* line 1 */
q[0] = 'J';   /* line 2 */
```

Which statement about lines 1 and 2 is true?

- A: Both are fine: each changes its own copy of `"hello"`.
- B: Line 2 is fine; line 1 writes to a string literal, which is undefined.
- C: Line 1 is fine; line 2 does not compile, because array elements are read-only.
- D: Neither compiles, because both strings are constants.

> `q` is an array initialised with a copy of the literal's characters, and it
> is the program's to change. `p` points at the string literal itself, and
> modifying a string literal is undefined behaviour; on most systems literals
> sit in read-only memory and the write crashes. C does not make `char *p =
> "hello"` an error, which is why `const char *p` is the safer declaration.

## c-basic-012
topic: pointers
answer: C
run: c

What does this program print?

```c
#include <stdio.h>

int main(void) {
    int a[] = {10, 20, 30};
    int *p = a;
    int x = *p++;
    int y = (*p)++;
    printf("%d %d %d %d\n", x, y, a[1], *p);
    return 0;
}
```

- A: `10 11 20 12`
- B: `10 21 21 21`
- C: `10 20 21 21`
- D: `10 20 20 30`

> Postfix `++` binds tighter than `*`, so `*p++` is `*(p++)`: it reads `a[0]`
> (10) and moves `p` to `a[1]`. `(*p)++` increments the value `p` points at,
> yielding the old value: `y` is 20 and `a[1]` becomes 21. `p` still points at
> `a[1]`, so `*p` is 21.

## c-basic-013
topic: pointers
answer: A

What does this declaration create?

```c
int* p, q;
```

- A: `p` is a pointer to `int`; `q` is a plain `int`.
- B: Both `p` and `q` are pointers to `int`.
- C: `p` is a plain `int`; `q` is a pointer to `int`.
- D: It does not compile: the `*` must touch each name.

> In a declaration the `*` belongs to the declarator that follows it, not to
> the type: the line reads as `int *p, q;`. To declare two pointers, write
> `int *p, *q;`. Spacing around the `*` makes no difference to the compiler.

## c-basic-014
topic: memory
answer: D
run: c

What does this program print?

```c
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int *a = calloc(4, sizeof *a);
    if (a == NULL)
        return 1;
    a[1] = 7;
    int sum = 0;
    for (int i = 0; i < 4; i++)
        sum += a[i];
    printf("%d\n", sum);
    free(a);
    return 0;
}
```

- A: `0`
- B: The output is unpredictable: `calloc` leaves the memory uninitialised.
- C: The behaviour is undefined: the block holds only 4 bytes, so `a[1]` is out of range.
- D: `7`

> `calloc(count, size)` allocates room for `count` objects of `size` bytes each,
> here four `int`s, and sets every byte to zero. So the block is `{0, 7, 0, 0}`
> after the assignment and the sum is 7. It is `malloc` that leaves the memory
> uninitialised.

## c-basic-015
topic: memory
answer: C

What is wrong with this code?

```c
char *buf = malloc(100);
buf = malloc(200);
free(buf);
```

- A: The 200-byte block is freed twice.
- B: `free(buf)` releases both blocks, since both came from `buf`.
- C: The 100-byte block leaks: its only pointer was overwritten.
- D: Nothing: the second `malloc` grows the first block to 200 bytes.

> Each `malloc` returns a separate block. Assigning the second result to `buf`
> discards the only copy of the first block's address, so that block can never
> be freed: a memory leak. `free` releases exactly the one block it is given.
> Growing a block is what `realloc` does, and it is given the old pointer.

## c-basic-016
topic: structs
answer: A
run: c

What does this program print?

```c
#include <stdio.h>

struct point {
    int x;
    int y;
};

int main(void) {
    struct point a = {1, 2};
    struct point b = a;
    b.x = 10;
    printf("%d %d\n", a.x, b.x);
    return 0;
}
```

- A: `1 10`
- B: `10 10`
- C: `1 1`
- D: `10 1`

> Initialising or assigning one struct from another copies every member, so
> `b` is an independent copy of `a`. Changing `b.x` leaves `a.x` at 1. Structs
> behave like values in C, unlike arrays, which cannot be assigned at all.

## c-basic-017
topic: structs
answer: B

Given `struct point a = {1, 2}, b = {1, 2};` (a struct of two `int`s), what does `if (a == b)` do?

- A: It is true, because both structs hold the same values.
- B: It does not compile: C has no `==` for structs.
- C: It is false, because `a` and `b` are different objects.
- D: It compares only the first members, `a.x` and `b.x`.

> The equality operators work on arithmetic types and pointers, not on
> structs, so the compiler rejects the comparison. Compare the members
> yourself (`a.x == b.x && a.y == b.y`). `memcmp` is not a safe substitute in
> general, because padding bytes between members can differ.

## c-basic-018
topic: storage-classes
answer: C
run: c

What does this program print?

```c
#include <stdio.h>

void tick(void) {
    static int s = 0;
    int a = 0;
    s++;
    a++;
    printf("%d%d ", s, a);
}

int main(void) {
    tick();
    tick();
    tick();
    printf("\n");
    return 0;
}
```

- A: `11 11 11`
- B: `11 22 33`
- C: `11 21 31`
- D: `11 12 13`

> A `static` local is initialised once, before the program starts, and keeps
> its value between calls, so `s` is 1, 2 and 3 on the three calls. The
> automatic local `a` is created and set to 0 on every call, so it is always 1
> when printed. Each call prints `s` then `a` with no space between them.

## c-basic-019
topic: storage-classes
answer: D

A source file contains this line at file scope:

```c
extern int limit;
```

What does it do?

- A: It defines `limit` here and initialises it to 0.
- B: It makes `limit` visible only inside this file.
- C: It makes `limit` read-only within this file.
- D: It declares a `limit` that is defined elsewhere.

> `extern` without an initializer makes a declaration, not a definition: it
> tells the compiler that an `int` named `limit` exists and lets this file use
> it, while the storage is created by a definition such as `int limit = 10;` in
> one place in the program. Visibility limited to one file is what `static` at
> file scope gives; read-only is `const`.

## c-basic-020
topic: preprocessor
answer: B
run: c

What does this program print?

```c
#include <stdio.h>

#define SQUARE(x) x * x

int main(void) {
    int a = 3;
    printf("%d %d\n", SQUARE(a), SQUARE(a + 1));
    return 0;
}
```

- A: `9 16`
- B: `9 7`
- C: `9 13`
- D: It does not compile: a macro argument cannot be an expression.

> A macro substitutes text before compilation. `SQUARE(a)` becomes `a * a`,
> which is 9, but `SQUARE(a + 1)` becomes `a + 1 * a + 1`, and `*` binds
> tighter than `+`: 3 + 3 + 1 = 7. Parenthesising the parameter and the whole
> body, `#define SQUARE(x) ((x) * (x))`, gives 16.

## c-basic-021
topic: preprocessor
answer: A

These lines wrap the whole of the header `shapes.h`:

```c
#ifndef SHAPES_H
#define SHAPES_H

struct circle {
    double r;
};

#endif
```

What do they achieve?

- A: A second `#include "shapes.h"` in the same source file adds nothing.
- B: No source file other than `shapes.c` can include `shapes.h`.
- C: Every function declared in the header becomes `static`.
- D: The header is compiled only once for the whole program, not once per file.

> This is an include guard. The first time the header is included, `SHAPES_H`
> is not yet defined, so the contents are kept and the macro is defined; any
> later inclusion in the same translation unit skips to `#endif`. Without it,
> including the header twice (often indirectly) would define `struct circle`
> twice, which is an error. Every source file that includes the header still
> sees it once.

## c-basic-022
topic: bitwise
answer: D
run: c

What does this program print?

```c
#include <stdio.h>

int main(void) {
    int a = 12, b = 10;
    printf("%d %d %d\n", a & b, a | b, a ^ b);
    return 0;
}
```

- A: `1 1 0`
- B: `8 14 2`
- C: `6 14 8`
- D: `8 14 6`

> In binary, 12 is `1100` and 10 is `1010`. AND keeps the bits set in both:
> `1000` = 8. OR keeps the bits set in either: `1110` = 14. XOR keeps the bits
> set in exactly one: `0110` = 6. `1 1 0` treats each number as a single truth
> value (both are true), which is what `&&` and `||` do, not `&`, `|` and `^`.

## c-basic-023
topic: bitwise
answer: C

Which expression is nonzero exactly when bit 2 (the bit worth 4) of `unsigned int x` is set?

- A: `x && 4`
- B: `x | 4`
- C: `x & 4`
- D: `x ^ 4`

> `x & 4` keeps only bit 2 of `x`: it is 4 when that bit is set and 0 when it
> is not. `x && 4` is a logical test, true whenever `x` is nonzero at all.
> `x | 4` is never zero because it sets the bit. `x ^ 4` is zero only when `x`
> is exactly 4.

## c-basic-024
topic: undefined-behaviour
answer: B

What can be said about this program?

```c
#include <stdio.h>

int main(void) {
    int a[5] = {1, 2, 3, 4, 5};
    int sum = 0;
    for (int i = 0; i <= 5; i++)
        sum += a[i];
    printf("%d\n", sum);
    return 0;
}
```

- A: It prints `15`: the loop stops at the last element.
- B: Reading `a[5]` is undefined behaviour, so no output is guaranteed.
- C: It prints `15`, because `a[5]` reads as 0.
- D: It does not compile: the compiler rejects the index 5 as out of range.

> The condition `i <= 5` lets the loop run with `i == 5`, and `a[5]` is one past
> the last element. Reading it is undefined behaviour: the standard places no
> requirement on the program at all, so it may print 15, some other number, or
> crash. C does no bounds checking, and compilers are not required to reject
> the index. The fix is `i < 5`.

## c-basic-025
topic: undefined-behaviour
answer: A

What can be said about this program?

```c
#include <stdio.h>

int main(void) {
    int total;
    for (int i = 1; i <= 3; i++)
        total += i;
    printf("%d\n", total);
    return 0;
}
```

- A: Its behaviour is undefined: `total` is read before it is set.
- B: It prints `6`, because local variables start at 0.
- C: It does not compile: `total` must be initialised where it is declared.
- D: It prints `6`, because `+=` treats an unset variable as 0.

> An automatic (local) variable without an initializer starts with an
> indeterminate value, and `total += i` reads it. Reading an uninitialised
> local whose address is never taken is undefined behaviour, so the output is
> not defined; in practice it is often whatever was left in that memory. Only
> variables with static storage (globals and `static` locals) start at zero.
> Compilers usually warn but must accept the code. Write `int total = 0;`.
