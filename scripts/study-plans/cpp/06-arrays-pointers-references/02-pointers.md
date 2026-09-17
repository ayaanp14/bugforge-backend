---
title: Pointers — addresses, nullptr and the arrow
minutes: 14
---
Every object in a running C++ program sits at an address, and a pointer is a variable that holds one. That single idea is underneath half of the track: references are a disciplined pointer, iterators a generalised one, `std::vector` a pointer plus a size, and dynamic memory (Module 7, Memory, ownership and RAII) pointers with an ownership contract. This lesson settles the two operators, what a null pointer is, why you would want a pointer at all, and the one rule — check before you dereference — that keeps a program out of undefined behaviour.

## Address-of and dereference

```cpp
int x = 42;
int* p = &x;      // &x is the address of x; p now "points at" x
*p = 7;           // *p is the object p points at — this writes x
std::cout << x << ' ' << *p << '\n';   // 7 7
```

`&` applied to an object gives its address; `*` applied to a pointer gives the object at that address — an lvalue you can read or assign. The type `int*` is "pointer to `int`": it holds the address of an `int` and nothing else, so `double d; int* p = &d;` does not compile.

Read a declaration from the name outwards: `int* p` — *p is a pointer to int*. The asterisk binds to the name, not the type, which produces the oldest trap in the language:

```cpp
int* a, b;        // a is int*, b is int — the * belongs to a only
int *c, *d;       // both pointers, C style
int* e = nullptr; // one declaration per line: no ambiguity
```

## What a pointer's value is

A pointer holds an address: 8 bytes on this platform, whatever it points at. `std::cout << p` prints it in hexadecimal, and a judged program must never do so — the value changes between runs, machines and compilers. Two pointers compare equal exactly when they point at the same object, and *that* is the meaningful thing to print:

```cpp
int a = 1, b = 1;
int* p = &a;
int* q = &b;
std::cout << (*p == *q) << ' ' << (p == q) << '\n';   // 1 0 — same value, different objects
q = &a;
std::cout << (p == q) << '\n';                        // 1 — now the same object
```

The line `q = &a;` is **reseating**: a pointer variable can be assigned a new address at any time. Assigning to `q` changes where `q` points; assigning to `*q` changes the object it points at. Keeping those two apart is the whole skill.

## nullptr

A pointer that points at nothing holds the null pointer value, spelled `nullptr` (C++11). `NULL` and `0` are the C spellings and still compile; `nullptr` has its own type and cannot be mistaken for an integer.

```cpp
int* p = nullptr;
if (p) { /* not taken */ }
if (p == nullptr) std::cout << "nothing to read\n";
```

A pointer converts to `bool` — `nullptr` is `false`, anything else is `true` — so `if (p)` is the idiom for "do I have an object?". Dereferencing a null pointer is undefined behaviour: usually a segmentation fault on this platform, but the optimiser is allowed to assume it never happens and may delete a null check that comes *after* a dereference it has already seen. The rule is mechanical: **check before you dereference, never after.**

A pointer declared without an initialiser is worse than null: it holds an indeterminate value, and even reading it — not dereferencing, just `p == nullptr` — is undefined behaviour. `int* p = nullptr;` or `int* p = &x;`. Never a bare `int* p;`.

## Pointers to class objects: the arrow

```cpp
struct Point { int x; int y; };

Point pt{3, 4};
Point* pp = &pt;
(*pp).x = 10;     // dereference, then member — the parentheses are required
pp->y = 20;       // the same thing, spelled the way everyone spells it
std::cout << pt.x << ' ' << pt.y << '\n';   // 10 20
```

`a->b` is `(*a).b`. The parentheses matter because `.` binds tighter than `*`: `*pp.x` means `*(pp.x)`, and a pointer has no member `x`, so it does not compile. You will write `->` constantly with `this` (Module 8, Classes and objects) and with smart pointers (Module 7).

## Pointer to pointer

A pointer is an object too, so it has an address:

```cpp
int x = 1;
int* p = &x;
int** pp = &p;    // pointer to pointer to int
**pp = 5;         // x is 5
*pp = nullptr;    // p is now null; x is untouched
```

Two stars, two hops. In practice `int**` appears as `char** argv` in `main`'s full signature (an array of C strings, lesson 3) and in C APIs that hand a pointer back through an output parameter.

## Why a pointer at all?

References (lesson 4) are the default way to refer to another object, so a pointer needs a reason. There are four good ones:

1. **The object may be absent.** `void log(const Config* cfg)` can be called with `nullptr`; there is no null reference.
2. **You need to reseat.** A cursor, a "current" element, a parent link — anything that points at different objects over time.
3. **Arrays and C APIs.** A decayed array is a pointer, `argv` is a pointer, and every C library speaks pointers.
4. **Dynamic memory.** Objects created with `new` are reached only through pointers — wrapped in `std::unique_ptr` (Module 7) in modern code so that ownership is enforced.

If none of those applies, use a reference or a value.

## Pointers as parameters

```cpp
void swap_values(int* a, int* b) {
    int tmp = *a;
    *a = *b;
    *b = tmp;
}

int x = 1, y = 2;
swap_values(&x, &y);     // the & at the call site announces "this may be modified"
```

The callee reaches back into the caller's variables through the addresses. Compare the reference version in lesson 4, where the call site reads `swap_values(x, y)` and nothing marks the mutation: some codebases prefer pointers for out-parameters for exactly that visibility, the C++ Core Guidelines prefer references and a name that says what happens.

A function may also *return* a pointer, and returning `nullptr` is the natural way to say "not found":

```cpp
int* largest(int* values, int n) {
    if (n == 0) return nullptr;
    int* best = &values[0];
    for (int i = 1; i < n; ++i) {
        if (values[i] > *best) best = &values[i];
    }
    return best;
}

int* p = largest(scores, count);
if (p) *p = 0;              // check, then use
```

`best` is reseated each time a larger element appears; the caller gets the winner's address and may read or write through it — but must not keep `p` after `scores` is gone, because a pointer does not keep its object alive (Module 7).

## Pitfalls

| Mistake | What happens |
| --- | --- |
| `int* a, b;` | `b` is an `int`; later `*b` fails to compile with a confusing message |
| `int* p;` then `if (p)` | reading an indeterminate pointer — undefined behaviour |
| `*p` when `p` may be null | undefined behaviour; a crash if you are lucky |
| Testing `*p` before testing `p` | the dereference happens first; put the null check first |
| Returning `&local` from a function | the local is gone when the function returns — dangling |

## Key takeaways

- `&obj` is an address; `*ptr` is the object at that address; `ptr->m` is `(*ptr).m`.
- A pointer's *value* is an address you must never print in a judged program; compare pointers with `==` and print what they reach.
- `nullptr` means "no object"; check with `if (p)` before every dereference, and initialise every pointer.
- Assigning to `p` reseats it; assigning to `*p` writes the pointee.
- Use a pointer when the object may be absent, must be reseated, is a C array or is dynamically allocated; otherwise use a reference or a value.
