---
title: std::string_view — a window onto text
minutes: 13
---
Every `std::string` you pass, slice or compare costs a copy somewhere: a function taking `const std::string&` allocates when called with a literal, `substr` copies what it returns, and a parser that cuts a line into fields copies the whole line again in pieces. `std::string_view` (C++17) answers all three: a pointer and a length that *refer to* characters someone else owns. It is sixteen bytes on this platform, trivially copyable, its `substr` costs nothing — and it brings the one lifetime rule this lesson exists to make you respect.

## What it is

```cpp
#include <string_view>

std::string owner = "codekairo";
std::string_view whole = owner;              // implicit from std::string: points at owner's buffer
std::string_view lit = "literal";            // from a literal: strlen once, no copy
std::string_view part(owner.data() + 4, 5);  // pointer + length: "kairo"
std::cout << whole.size() << ' ' << part << ' ' << lit.substr(0, 3) << '\n';   // 9 kairo lit
```

A view holds `data()` and `size()` and nothing else — no buffer, no ownership, no null terminator of its own; copying one copies two words. It supports the whole *read-only* string interface: `size`, `empty`, `[]`, `at`, `front`, `back`, iteration, the `find` family, `substr`, `starts_with`/`ends_with`, `compare` and all six comparison operators, which compare content just as `std::string` does. Anything that would change the characters — `+=`, `push_back`, `insert`, `replace` — does not exist, because the view does not own them. Two operations exist only on views: `remove_prefix(n)` and `remove_suffix(n)` shrink the window from either end in O(1), and are how a view is trimmed.

```cpp
std::string_view v = "   padded   ";
v.remove_prefix(v.find_first_not_of(' '));                  // "padded   "
v.remove_suffix(v.size() - v.find_last_not_of(' ') - 1);    // "padded"
```

## substr in O(1)

```cpp
std::string line = "2026-09-17T10:15:00";
std::string_view sv = line;
std::string_view date = sv.substr(0, 10);     // "2026-09-17": a narrower window, no allocation
std::string_view time = sv.substr(11);        // "10:15:00"
```

`std::string::substr` allocates and copies; `std::string_view::substr` adjusts a pointer and a length in constant time. A tokeniser written with views allocates nothing until you decide to keep something:

```cpp
#include <vector>

std::vector<std::string_view> words(std::string_view text) {
    std::vector<std::string_view> out;
    std::size_t i = 0;
    while (i < text.size()) {
        while (i < text.size() && text[i] == ' ') ++i;         // skip separators
        const std::size_t start = i;
        while (i < text.size() && text[i] != ' ') ++i;         // run to the end of the word
        if (start < i) out.push_back(text.substr(start, i - start));
    }
    return out;
}
```

Every element of `out` points into `text`'s characters. That is the whole point, and the whole danger.

## The right parameter type for read-only text

| Parameter | Called with a literal | Called with a `std::string` | Knows its length | Null-terminated |
| --- | --- | --- | --- | --- |
| `const char*` | fine | needs `.c_str()` | no — `strlen` | yes |
| `const std::string&` | constructs a temporary `std::string` (allocates past 15 chars) | fine, no copy | yes | yes |
| `std::string_view` | fine, no copy | fine, no copy | yes | not guaranteed |

Take `std::string_view` **by value** — two words; a reference would be an indirection for nothing — whenever the function only reads text: counting, searching, parsing, printing. The caller passes a literal, a `std::string`, another view or a `(pointer, length)` pair and nothing is copied. Return a `std::string`, not a view, when the function *produces* text.

```cpp
int count_char(std::string_view text, char c) {
    int n = 0;
    for (char ch : text) if (ch == c) ++n;
    return n;
}

count_char("banana", 'a');          // 3 - no std::string was ever built
count_char(owner, 'k');             // 1 - no copy of owner
```

## The lifetime rule

A view is valid exactly as long as the characters it points at. Nothing in the language checks this, and the failures are undefined behaviour that often *appears* to work:

```cpp
std::string_view bad1 = std::string("temporary");     // the string dies at the ';' - dangling immediately
std::string_view bad2 = owner + "!";                  // same: + returns a temporary

std::string_view first_word() {
    std::string line;
    std::getline(std::cin, line);
    return std::string_view(line).substr(0, line.find(' '));   // line is destroyed on return
}

std::vector<std::string> names = {"ada"};
std::string_view n0 = names[0];
names.push_back("grace");                             // may reallocate: n0 now points at freed memory
```

The rule in one sentence: **a view must not outlive the string it looks at, and that string must not be modified while the view is in use**. In practice: take views as parameters and use them within the call; return a view only into something the caller gave you (the argument, never a local); never store a view in a struct or container unless the owner is guaranteed to live longer and stay put. `words()` above is fine because its caller still holds `text`; it becomes a bug the moment someone writes `auto ws = words(read_line());` — the temporary line is gone by the next statement.

One more: `data()` is not guaranteed to end in `'\0'`. A view of the middle of a string stops where `size()` says but the bytes continue, so `sv.data()` handed to a C function that expects a terminator reads past the window. Build a `std::string` first.

## Converting back

```cpp
std::string_view sv = "kairo";
std::string s1(sv);              // explicit construction: copies the characters
std::string s2 = sv;             // error: the conversion from a view is explicit
std::string s3;
s3 = sv;                         // fine: assignment from a view is allowed
s3 += sv;                        // fine: append accepts a view
std::string s4 = std::string(sv) + "!";   // build the string, then concatenate
```

The asymmetry is deliberate: `std::string` converts to a view silently because that is free; a view becomes a `std::string` only when you write it, because that allocates. To *keep* a piece of text — a map key, a struct member, anything that outlives the input — convert and store the `std::string`.

## constexpr views

```cpp
constexpr std::string_view kVersion = "1.4.2";
constexpr std::string_view kMajor = kVersion.substr(0, kVersion.find('.'));    // "1", at compile time
static_assert(kMajor == "1");
constexpr std::string_view kDays[] = {"mon", "tue", "wed", "thu", "fri", "sat", "sun"};
```

A view onto a literal is a `constexpr` value: the characters live in the program image for its whole run, so the lifetime rule holds automatically, and `find`, `substr` and `==` are `constexpr`. A `std::string` cannot be a `constexpr` variable in C++20 (its allocation must not escape compile-time evaluation), so a compile-time table of names is a table of views. Module 16, Modern C++, has more.

## When not to use it

- The function stores the text (a member, a container element, a key): take `std::string` by value and move it in (Module 9, Copies, moves and the rule of five).
- You need a null-terminated `const char*` for a C API: `std::string` and `c_str()`.
- The text will be modified: views are read-only windows.
- The source is a temporary or will change while the view is alive: copy instead.

## Pitfalls

- `std::string_view v = s + "x";` or `= std::string(...)` dangles before the next statement.
- Returning a view of a local, or of a `std::string` parameter taken by value, dangles.
- A view into a `std::vector<std::string>` element dies on `push_back`; into a `std::string` on any resize.
- `sv.data()` is not null-terminated; never hand it to `printf`, `fopen` or `strlen`.
- `remove_prefix(n)` with `n > size()` is undefined behaviour; compute `n` from a `find` that succeeded.

## Key takeaways

- `std::string_view` is a pointer and a length: non-owning, sixteen bytes, trivially copyable, read-only.
- `substr`, `remove_prefix` and `remove_suffix` are O(1) and never allocate; the `find` family and comparisons work as on `std::string`.
- Take it by value as the parameter type for any function that only reads text; return `std::string` when producing text.
- A view must not outlive its string or survive a modification of it; never view a temporary, never return a view of a local.
- Converting back is explicit — `std::string(sv)` — because it copies; `data()` is not null-terminated; views of literals are `constexpr`.
