---
title: Pointer arithmetic and arrays
minutes: 14
---
A pointer into an array can be moved. `p + 1` is the next element, `q - p` is how many elements apart two pointers are, and `p[i]` is nothing more than `*(p + i)`. That is how arrays and pointers are the same thing at the machine level, how every C string is walked, and — through `begin` and `end` — how the entire standard library expresses "a range of elements". This lesson settles the arithmetic, the half-open range convention, the one pointer you may form but never dereference, and the C string.

## p + i moves by elements

```cpp
int a[5] = {10, 20, 30, 40, 50};
int* p = a;                        // decay: p points at a[0]
std::cout << *(p + 2) << '\n';     // 30
++p;                               // p now points at a[1]
std::cout << *p << ' ' << p[1] << '\n';   // 20 30
```

Adding `i` to a `T*` moves it `i` *elements*, not `i` bytes: the compiler multiplies by `sizeof(T)` for you. `p + 2` on an `int*` advances 8 bytes; on a `double*` 16; on a `char*` 2. `++p`, `--p`, `p += n` and `p - n` all work the same way.

The subscript operator is defined in terms of this: `p[i]` **is** `*(p + i)`, for pointers and built-in arrays alike. So `a[3]` is `*(a + 3)` — and, because addition commutes, `3[a]` compiles too. Do not write it; do understand why it works.

## The difference of two pointers

```cpp
#include <cstddef>
int* first = a;
int* third = a + 2;
std::ptrdiff_t gap = third - first;   // 2 — elements, not bytes
```

Subtracting two pointers into the same array gives the number of elements between them as a `std::ptrdiff_t` — a signed 8-byte integer on this platform. It is negative if the left operand comes first. The practical use is recovering an **index** from a pointer: if `p` points into `a`, `p - a` is its index — what you print when an exercise asks "where", never the address.

Subtracting pointers into two different arrays is undefined behaviour, even though the compiler will happily emit the subtraction.

## The half-open range [begin, end)

```cpp
int* begin = a;
int* end = a + 5;                 // one past the last element
for (int* p = begin; p != end; ++p) std::cout << *p << ' ';
```

`a + 5` does not point at an element — there is no `a[5]` — but the language guarantees you may **form** the one-past-the-end pointer, compare with it and subtract it. You may not dereference it, and you may not go further: `a + 6` is undefined behaviour before you even read it, and so is `a - 1`.

The pair `[begin, end)` — first element included, `end` excluded — is the convention for describing a sequence in C++. Its properties are why:

- The length is `end - begin`, with no `+ 1`.
- An empty range is `begin == end`, and a loop `while (p != end)` runs zero times without a special case.
- Splitting a range at `mid` gives `[begin, mid)` and `[mid, end)` with nothing lost or counted twice.

`std::begin(a)` and `std::end(a)` (from `<iterator>`) give exactly these two pointers for a built-in array, and iterators that behave the same way for a `std::vector`. Every algorithm in `<algorithm>` (Module 14, Algorithms and lambdas) takes such a pair; a function taking `(const int* begin, const int* end)` *is* an algorithm:

```cpp
long long sum(const int* begin, const int* end) {
    long long total = 0;
    for (const int* p = begin; p != end; ++p) total += *p;
    return total;
}

const int* find_negative(const int* begin, const int* end) {
    for (const int* p = begin; p != end; ++p) {
        if (*p < 0) return p;
    }
    return end;                                   // "not found" is the end pointer
}
```

Returning `end` for "not found" is the library's convention too (`std::find`), and the caller tests `if (it != end)`. `const int*` because neither function modifies an element — lesson 5.

## Passing an array with its length

Because an array decays, a function that receives one must be told the size. Two spellings:

```cpp
void show(const int* values, std::size_t count);    // pointer + count
void show(const int* begin, const int* end);         // a range

int a[4] = {1, 2, 3, 4};
show(a, std::size(a));
show(a, a + std::size(a));
std::vector<int> v{1, 2, 3};
show(v.data(), v.size());                            // a vector hands out the same kind of pointer
```

`v.data()` is a pointer to the vector's first element and `v.data() + v.size()` its end; for an empty vector `data()` may be null, and adding zero to a null pointer is defined, so the range is still empty and valid. C++20's `std::span<const int>` (Module 16, Modern C++) carries pointer and count as one parameter.

## Ordering

Pointers into the same array order like their elements, so `<` works: `while (lo < hi)` is Module 3's two-pointer sweep with pointers instead of indices:

```cpp
void reverse(int* lo, int* hi) {      // hi is one past the end
    while (lo < hi) {
        --hi;                         // step inside the range before touching it
        int tmp = *lo;
        *lo = *hi;
        *hi = tmp;
        ++lo;
    }
}
```

## C strings and the terminating '\0'

Before `std::string` there was the C string: an array of `char` whose end is marked by a `'\0'` character (the byte 0) rather than by a stored length. A string literal is such an array:

```cpp
const char* s = "hello";   // points at an array of 6 chars: h e l l o \0
```

Every C string function walks until it finds the terminator. `strlen` from `<cstring>` is, in essence:

```cpp
std::size_t my_strlen(const char* s) {
    const char* p = s;
    while (*p != '\0') ++p;
    return static_cast<std::size_t>(p - s);   // elements walked = characters before the terminator
}
```

The loop condition can be written `while (*p)` because `'\0'` is the only false `char`. Reading a line into a fixed buffer safely uses `std::cin.getline(buf, sizeof buf)`, which stops before the buffer overflows and always writes the terminator:

```cpp
char buf[256] = {};
std::cin.getline(buf, sizeof buf);
std::cout << my_strlen(buf) << '\n';
```

A `std::string` (Module 5, Strings) does all of this for you and knows its length; `s.c_str()` hands you the terminated array when a C API needs one. Write C strings only when you are talking to C.

## Pitfalls

- **Dereferencing `end`.** `*end`, `end[0]`, `for (p = begin; p <= end; ++p)` — all read past the array.
- **Forming a pointer outside `[a, a + N]`.** `a + N + 1` and `a - 1` are undefined even unread.
- **Subtracting unrelated pointers.** Only pointers into the same array.
- **A missing terminator.** `char name[5] = "hello";` does not fit the `'\0'` — a compile error in C++ — and `char name[5] = {'h', 'e', 'l', 'l', 'o'};` compiles with no terminator, so `strlen(name)` runs off the end.
- **`sizeof` on the pointer.** `sizeof s` for a `const char* s` is 8, never the length.

## Key takeaways

- `p + i` moves by `i` elements; `p[i]` is `*(p + i)`; `q - p` counts elements and is how you turn a pointer back into an index.
- `[begin, end)` is the range convention: `end` is one past the last element — form it, compare with it, never dereference it.
- Empty range: `begin == end`; length: `end - begin`; "not found": return `end`.
- A decayed array needs its length passed alongside; `std::vector::data()` gives the same kind of pointer.
- A C string ends at `'\0'`; walking to it is `strlen`, and `std::string` exists so you rarely have to.
