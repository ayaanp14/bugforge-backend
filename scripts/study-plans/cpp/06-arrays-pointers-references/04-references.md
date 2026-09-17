---
title: References — an alias with a rulebook
minutes: 14
---
A reference is another name for an existing object. Write `int& r = x;` and from then on `r` *is* `x`: reading `r` reads `x`, assigning to `r` assigns to `x`, and `&r == &x`. The rest of the lesson is the rulebook that follows — must be initialised, cannot be reseated, cannot be null — the two places references matter most, parameters and return values, the failure mode every C++ programmer meets, the dangling reference, and the table that decides between a reference and a pointer.

## An alias, not an object

```cpp
int x = 5;
int& r = x;       // r is an alias for x
r = 7;            // x is now 7
++r;              // x is now 8
std::cout << x << ' ' << r << '\n';   // 8 8
int y = 100;
r = y;            // NOT a rebind: copies y's value into x — x is 100, r still names x
std::cout << x << ' ' << (&r == &x) << '\n';   // 100 1
```

The line `r = y;` is the one that separates references from pointers. It does not make `r` refer to `y`; there is no syntax that does. Once bound, a reference names the same object for its whole life. The compiler may implement it as a hidden pointer, but the language treats it as the object itself: no `*`, no `->`, no arithmetic.

The rules, all consequences of "it is the object":

- **Must be initialised.** `int& r;` is a compile error — a name for nothing is meaningless.
- **Cannot be reseated.** Assignment goes through to the referent.
- **Cannot be null.** A legitimately obtained reference always refers to an object; `int& r = *p;` with a null `p` is undefined behaviour, not a null reference.
- **No references to references, arrays of references or pointers to references.** `&r` is the address of the referent, `&x`.

## Reference parameters

```cpp
void swap_values(int& a, int& b) {
    int tmp = a;
    a = b;
    b = tmp;
}

int x = 1, y = 2;
swap_values(x, y);     // x is 2, y is 1 — no & at the call site
```

A `T&` parameter lets the callee modify the caller's object. Compared with the pointer version in lesson 2 there are no stars in the body and no ampersands at the call site — cleaner, and less visible, so the function's name has to say that its arguments change (`swap_values`, `sort_in_place`, `read_into`).

The read-only form is the workhorse of the language: `long long total(const std::vector<int>& values)` reads the vector without copying it and cannot modify it. Module 4 (Functions) gave the rule: by value when the type is small (`int`, `double`, a pointer) or you need your own copy; by `const T&` for anything larger that you only read; by `T&` when the function's job is to change it. `const T&` on a `std::vector` of a million elements costs eight bytes; by value costs a million copies.

## const T& binds to temporaries

```cpp
const int& r = 5;                     // OK: a temporary int holds 5; r refers to it
const std::string& s = "hello";       // OK: a temporary std::string is built from the literal
int& bad = 5;                         // error: a non-const lvalue reference cannot bind to a temporary
```

A non-const `T&` must bind to an *lvalue* — a named object. A `const T&` may also bind to a temporary, and when the reference is a local the temporary lives as long as it does (lifetime extension). This is what lets `void greet(const std::string& name)` be called as `greet("Ada")`: a `std::string` is made for the call and destroyed after it. It is also why `void f(int& n)` cannot be called as `f(5)` — there is no `n` in the caller to modify. Module 9 (Copies, moves and the rule of five) introduces the third kind, `T&&`, which binds only to temporaries.

## Returning a reference

```cpp
int& at_index(std::vector<int>& v, std::size_t i) { return v[i]; }

std::vector<int> v{1, 2, 3};
at_index(v, 1) = 20;      // the call is an lvalue: assign through it — v is {1, 20, 3}
```

A function that returns `T&` hands back an alias to something that already exists — an element of a container the caller passed, a member of `*this` (Module 8), a `static`. `std::vector::operator[]` and `std::map::operator[]` return references; that is why `v[i] = x` works. The one rule: **the object must outlive the call.**

## Dangling references

```cpp
int& broken() {
    int local = 3;
    return local;        // warning: reference to local variable 'local' returned
}
int& r = broken();       // r names an object that no longer exists: undefined behaviour to read
```

`local` is destroyed when `broken` returns; the reference outlives it and reads memory that now belongs to whichever function is called next. GCC and Clang warn — treat the warning as an error. A by-value parameter is a local too, so returning a reference to one is the same bug.

The second classic is subtler, because nothing is returned:

```cpp
std::vector<int> v{1, 2, 3};
int& first = v[0];
v.push_back(4);          // may reallocate: the elements move to a new block, the old one is freed
first = 9;               // undefined behaviour if it did — first refers to freed memory
```

A reference (or pointer, or iterator) into a `std::vector` is valid only until the next operation that may move the elements: `push_back`, `insert`, `resize`, `reserve`. This is **invalidation**, and Module 13 lesson 6 gives the table per container. The habit: use a reference into a container before the container changes, or hold an index, which survives.

## References in range-for

```cpp
std::vector<int> v{1, 2, 3};
for (int x : v) x *= 2;                    // x is a copy; v is unchanged
for (int& x : v) x *= 2;                   // x aliases each element; v is {2, 4, 6}
for (const auto& x : v) std::cout << x;    // read-only, no copy — the default for anything big
```

The same rule extends to `auto`: `auto x = v[0];` copies, `auto& x = v[0];` aliases.

## References versus pointers

| | Reference `T&` | Pointer `T*` |
| --- | --- | --- |
| Can be null | no | yes (`nullptr`) |
| Must be initialised | yes | should be; the language does not force it |
| Can be reseated | no | yes |
| Syntax at use | as the object itself | `*p`, `p->m` |
| Arithmetic | none | `p + i`, `q - p` |
| Mutation visible at the call site | no (`f(x)`) | yes (`f(&x)`) |
| Use it for | parameters, aliases, `operator[]` returns | optional values, cursors, arrays, owning dynamic memory |

Default to a reference; reach for a pointer when the object may be absent, must be reseated, or is an array or dynamic memory.

## Pitfalls

- **`auto` copies.** `auto x = v[0]; x = 5;` changes a copy. Write `auto&`.
- **Returning a reference to a local**, or to a parameter passed by value (also a local).
- **Holding a reference across `push_back`.** Re-read it afterwards, or use an index.
- **`const` on the reference, not the object.** `const int& r = x; x = 9;` — `r` sees 9; the `const` only forbids writing *through `r`*.

## Key takeaways

- A reference is an alias: bound once at initialisation, never reseated, never null.
- Parameters: `T` for small or owned, `const T&` for read-only, `T&` for in-out; name the function so the mutation is visible.
- `const T&` binds to temporaries (lifetime-extended when local); `T&` binds only to lvalues.
- Return a reference only to something that outlives the call — never a local, and remember a `std::vector` can move its elements.
- Reference by default; pointer when absence, reseating or arrays are involved.
