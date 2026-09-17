---
title: std::string — a value type for text
minutes: 13
---
C's text is an array of `char` ending in a zero byte — no length, no bounds, no ownership. C++ keeps that representation for literals and C APIs but builds `std::string` on top: an owning value type that knows its length, grows on demand, copies deeply, compares by content and frees its memory on scope exit. This lesson settles what a `std::string` is, how to build, index, grow and compare one, and where the C string boundary still shows through.

## A string is a value

```cpp
#include <iostream>
#include <string>

int main() {
    std::string a = "kairo";
    std::string b = a;          // a second string with its own copy of the characters
    b += "!";
    std::cout << a << ' ' << b << '\n';   // kairo kairo!
    std::cout << (a == b) << '\n';        // 0: == compares content, and it differs now
    return 0;
}
```

`b = a` copies the characters; changing `b` cannot touch `a`. That is **value semantics**, the rule an `int` follows and the opposite of Java or Python, where two names can share one string object. `==` compares characters, never addresses. The string owns its buffer — with this platform's libstdc++ up to 15 characters live inside the object (the *small string optimisation*), anything longer on the heap — and its destructor frees it the moment the string goes out of scope. That is RAII, which Module 7, Memory, ownership and RAII, treats in full.

## Constructing one

```cpp
std::string empty;                        // ""
std::string s1 = "hello";                 // copies the literal's characters
std::string s2("hello", 3);               // "hel"   - the first 3 characters
std::string s3(5, '-');                   // "-----" - count, then character
std::string s4(s1, 1);                    // "ello"  - a copy of s1 from index 1
std::string s5(s1, 1, 3);                 // "ell"   - from index 1, 3 characters
std::string s6 = std::to_string(42);      // "42"
std::string s7 = s1 + ", " + s6;          // "hello, 42"
```

Two forms that do not do what they look like. `std::string s{5, '-'}` with braces picks the `std::initializer_list<char>` constructor and builds a two-character string (code 5, then `'-'`); use parentheses for count-and-character. And `std::string s = 'a';` does not compile — there is no conversion from a single `char` — although `s = 'a';` on an existing string does.

## Size, emptiness and indexing

```cpp
std::string word = "delta";
std::cout << word.size() << ' ' << word.length() << '\n';   // 5 5 - identical
std::cout << word.empty() << '\n';                          // 0
std::cout << word[0] << word.back() << '\n';                // da
word[0] = 'D';                                              // elements are writable
word.at(10) = 'x';                                          // throws std::out_of_range
```

`size()` returns `std::size_t`, an unsigned type (Module 2, Fundamental types), so index loops use `std::size_t i` — an `int` draws a signed/unsigned warning — and `word.size() - 1` on an empty string is not `-1` but the largest `size_t` there is, the unsigned countdown trap from Module 3, Control flow.

`operator[]` does no bounds checking; an index past the end is undefined behaviour, with one carve-out: reading `s[s.size()]` yields `'\0'` (writing there is not allowed). `at()` checks and throws `std::out_of_range` — the right call when the index came from input. `front()` and `back()` are the first and last characters, undefined on an empty string, so check `empty()` first.

## Growing with + and +=

```cpp
std::string greeting = "Hello";
greeting += ", ";                 // append a C string
greeting += name;                 // append a std::string
greeting += '!';                  // append one character
greeting.push_back('\n');         // the same, for one character
greeting.append(3, '.');          // "..."
std::string line = greeting + " again";   // + builds a new string; the operands are untouched
```

`+=` appends in amortised constant time per character — the buffer grows geometrically, like a `std::vector` — so building output character by character is fine. `s = s + c` in a loop is not: every iteration copies the whole string, and a 100 000-character build becomes billions of copied bytes. Call `s.reserve(n)` when you know the final size.

Three expressions that look like concatenation and are not:

```cpp
std::string bad1 = "abc" + "def";     // error: two const char* cannot be added
const char* bad2 = "abc" + 1;         // pointer arithmetic: points at "bc"
std::string s = "x"; s += 65;         // appends 'A' - += accepts a char, and 65 converts to one
```

The first is refused; the other two compile, because a literal is a `const char*` and `+` on a pointer is arithmetic (Module 6, Arrays, pointers and references). Append a number's digits with `std::to_string`: `s += std::to_string(65)` gives `"x65"`. Once one operand is a `std::string`, `+` does the expected thing with a literal or a `char` on the other side: `std::string("a") + "b" + 'c'` is `"abc"`.

## Comparing

```cpp
std::string a = "apple", b = "Banana", c = "app";
std::cout << (b < a) << ' ' << (c < a) << ' ' << (a == "apple") << '\n';   // 1 1 1
std::cout << a.compare(b) << '\n';                                          // positive
```

All six comparison operators compare **lexicographically by character code**, treating each `char` as unsigned: digits (48–57) sort before capitals (65–90), which sort before lower-case letters (97–122), so `"Banana" < "apple"`. A prefix sorts before the longer string, so `"app" < "apple"`. This is the order `std::sort` and `std::map` use (Modules 13 and 14); for dictionary order that ignores case, normalise both sides first — lesson 2 shows how. `compare()` returns a negative, zero or positive `int` in the C tradition.

The trap: `if ("apple" < "banana")` compiles, warns, and compares two addresses. Both operands are pointers, and no operator overload is involved. Make one side a `std::string` and the content comparison you meant is what you get.

## std::string and C strings

A **C string** is a `const char*` pointing at characters that end with a `'\0'` byte; every literal is one. `std::string` stores its own length, so it may even contain `'\0'` in the middle and `size()` still counts correctly, where C's `std::strlen` would stop early.

```cpp
std::string path = "/tmp/out.txt";
std::FILE* f = std::fopen(path.c_str(), "w");   // C APIs want a const char*
```

`c_str()` returns a pointer into the string's own buffer, null-terminated, valid until the string is modified or destroyed — never keep it past that. Constructing a `std::string` from a literal copies every character, which is why a function taking `const std::string&` allocates when called with a literal longer than the small buffer; lesson 6's `std::string_view` is the parameter type that avoids the copy.

## Iterating by character

```cpp
for (char c : word) std::cout << static_cast<int>(c) << ' ';      // the codes: 68 101 108 116 97
for (char& c : word) c = static_cast<char>(std::toupper(static_cast<unsigned char>(c)));
std::string reversed(word.rbegin(), word.rend());                  // "ATLED"
```

`for (char c : s)` copies each element; `char&` changes it in place (Module 3, Range-for and iteration). The `unsigned char` cast around `std::toupper` is not decoration — lesson 3 explains it. The iterator-pair constructor builds a string from any range of characters, and reverse iterators make reversing a one-liner. A `std::string` is a sequence of *bytes*, not letters: `"é"` in a UTF-8 source is two `char`s and `size()` says 2; for the ASCII input this track's judge sends, byte and letter coincide.

## Pitfalls

- `int n = s.size() - 1;` on an empty string wraps to the largest `size_t` before the conversion; test `empty()` first.
- `s[s.size()]` is a legal read of `'\0'`; `s[s.size() + 1]` and any write past the end are undefined behaviour.
- `std::string s = 'a';` does not compile; `s += 65` compiles and appends `'A'`.
- `"a" + "b"` is an error, `"abc" + 1` is pointer arithmetic, and `"a" < "b"` compares addresses.
- Passing a `std::string` by value copies it; take `const std::string&` (Module 4, Functions) or `std::string_view` (lesson 6).

## Key takeaways

- `std::string` is an owning value type: copies are independent, `==` compares content, the destructor frees the buffer.
- `size()` is unsigned; index with `std::size_t`; `[]` is unchecked, `at()` throws.
- `+=` is cheap and amortised; `s = s + x` in a loop is quadratic.
- Comparisons are lexicographic by unsigned character code — capitals before lower case, a prefix before the longer string.
- A literal is a `const char*`: adding two is an error, comparing two compares addresses, and `c_str()` is valid only until the next modification.
