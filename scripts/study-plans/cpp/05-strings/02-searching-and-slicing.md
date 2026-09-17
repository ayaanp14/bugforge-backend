---
title: Searching and slicing
minutes: 14
---
Most string work is finding a position and cutting at it: the extension after the last dot, the value after the `=`, every occurrence of a word. `std::string` gives you a family of `find` functions that all answer with an index, the sentinel `npos` for "not there", and `substr`, `erase`, `insert` and `replace` to act on the index. This lesson settles how those pieces fit, the one idiom that keeps `npos` from turning into a bug, and the two loops — count every occurrence, replace every occurrence — that every text program eventually needs.

## The find family

```cpp
#include <iostream>
#include <string>

int main() {
    std::string s = "one two three two";
    std::cout << s.find("two") << '\n';               // 4  - first occurrence
    std::cout << s.rfind("two") << '\n';              // 14 - last occurrence
    std::cout << s.find("two", 5) << '\n';            // 14 - first occurrence at or after index 5
    std::cout << s.find('t') << '\n';                 // 4  - a single character works too
    std::cout << s.find_first_of("aeiou") << '\n';    // 0  - first character that is any of these
    std::cout << s.find_last_of("aeiou") << '\n';     // 16
    std::cout << s.find_first_not_of("one ") << '\n'; // 4  - first character that is none of these
    return 0;
}
```

`find` searches for a whole substring (or one character) left to right, `rfind` right to left; both take an optional start position. The `_of` variants treat their argument as a *set* of characters and find the first (or last) character that is in the set — or, with `_not_of`, the first that is not. `find_first_not_of(" \t")` is how you skip leading whitespace; `find_last_not_of(" \t")` finds where the trailing whitespace begins. Every one of them returns a `std::size_t` index.

## npos and the one idiom

When nothing matches, every `find` returns `std::string::npos`, a `static` constant equal to the largest `std::size_t` — `static_cast<std::size_t>(-1)`, which is 18 446 744 073 709 551 615 on this platform. The idiom is to compare against it, and nothing else:

```cpp
const std::size_t at = s.find("three");
if (at != std::string::npos) {
    std::cout << "found at " << at << '\n';
}
```

Two ways to get this wrong. `if (s.find("x") >= 0)` is always true — `size_t` is unsigned, so *every* value is at least zero, and the compiler warns. `int at = s.find("x");` turns `npos` into `-1`, and a later `at < 0` test catches it only by accident of the conversion. Keep the result in `std::size_t` (or `auto`) and compare with `npos`.

## substr

```cpp
std::string s = "codekairo.cpp";
std::string ext  = s.substr(10);        // "cpp"       - from index 10 to the end
std::string stem = s.substr(0, 9);      // "codekairo" - from index 0, at most 9 characters
std::string tail = s.substr(9, 100);    // ".cpp"      - a count past the end is clamped
std::string boom = s.substr(20);        // throws std::out_of_range: pos > size()
```

`substr(pos, count)` copies `count` characters from `pos` into a **new string** — O(count), and it allocates. The count may run past the end and is clamped; the position may not, and `pos > size()` throws (`pos == size()` gives `""`). Combine it with `find` to cut on a delimiter:

```cpp
std::string entry = "name=Ada Lovelace";
const std::size_t eq = entry.find('=');
if (eq != std::string::npos) {
    std::string key = entry.substr(0, eq);        // "name"
    std::string value = entry.substr(eq + 1);     // "Ada Lovelace"
}
```

Lesson 6's `std::string_view::substr` does the same slice in O(1) without copying; when you only need to *look* at the slice, that is the tool.

## Counting every occurrence

```cpp
int count_of(const std::string& text, const std::string& needle) {
    int count = 0;
    for (std::size_t pos = text.find(needle); pos != std::string::npos; pos = text.find(needle, pos + needle.size())) {
        ++count;
    }
    return count;
}
```

The loop restarts each search *after* the match it just found — `pos + needle.size()` — so `count_of("aaaa", "aa")` is 2, the non-overlapping count; restart at `pos + 1` and overlapping matches count too: 3. Interview questions usually mean non-overlapping. The needle must not be empty: `find("")` matches at every position and the loop never advances.

## erase, insert and replace

```cpp
std::string s = "hello world";
s.erase(5, 1);              // "helloworld"  - erase 1 character at index 5
s.erase(5);                 // "hello"       - erase from index 5 to the end
s.insert(0, ">> ");         // ">> hello"    - insert before index 0
s.replace(3, 5, "HELLO");   // ">> HELLO"    - replace 5 characters at index 3 with the text
s.replace(3, 5, "hi");      // ">> hi"       - the replacement may be a different length
```

All three take a position (and, for `erase` and `replace`, a count), modify the string in place and return a reference to it, so calls chain. C++20 adds two free functions for whole-string cases: `std::erase(s, ' ')` removes every space and `std::erase_if(s, pred)` every character the predicate accepts.

Replacing every occurrence is the loop that most often turns into an infinite one:

```cpp
std::string replace_all(std::string text, const std::string& from, const std::string& to) {
    std::size_t pos = 0;
    while ((pos = text.find(from, pos)) != std::string::npos) {
        text.replace(pos, from.size(), to);
        pos += to.size();               // continue AFTER the inserted text
    }
    return text;
}
```

Restarting the search at `pos` would find the text just inserted whenever `to` contains `from` — replacing `"a"` with `"aa"` never terminates. Advancing by `to.size()` skips the insertion and handles a shorter or empty replacement too. `text` is taken by value on purpose: the function modifies its own copy and the caller's string stays intact.

## starts_with and ends_with

```cpp
std::string file = "report.final.pdf";
bool pdf = file.ends_with(".pdf");        // true   (C++20)
bool tmp = file.starts_with("tmp_");      // false
bool dot = file.starts_with('.');         // a single character works too
```

Before C++20 the idiom was `file.compare(0, 4, "tmp_") == 0` or `file.rfind("tmp_", 0) == 0`, both of which you will still meet. `contains()` is C++23 and not available on this track's runtime — write `file.find("final") != std::string::npos`.

## Trimming

```cpp
std::string trim(const std::string& s) {
    const std::size_t start = s.find_first_not_of(" \t");
    if (start == std::string::npos) return "";               // all whitespace, or empty
    const std::size_t end = s.find_last_not_of(" \t");
    return s.substr(start, end - start + 1);
}
```

The `npos` check must come first: on an all-whitespace line `find_first_not_of` fails, and `substr(npos, …)` would throw. Lesson 4 applies `trim` to every field it parses.

## Case-insensitive comparison

There is no case-insensitive `==`; the honest approach is to normalise both sides and compare the results:

```cpp
#include <cctype>

std::string lower(std::string s) {
    for (char& c : s) c = static_cast<char>(std::tolower(static_cast<unsigned char>(c)));
    return s;
}

bool same_word(const std::string& a, const std::string& b) {
    return lower(a) == lower(b);
}
```

This is ASCII-only — `std::tolower` knows nothing of `'É'` — and the `unsigned char` cast is required, as lesson 3 explains. The same normalisation makes a case-insensitive search: lower-case the haystack once, lower-case the needle, then `find`.

## Pitfalls

- `s.find(x) >= 0` is always true; compare with `std::string::npos`, and keep the result in `std::size_t`.
- `substr(pos, n)` clamps `n` but throws when `pos > size()`; check the `find` result before slicing with it.
- A replace-all loop must advance past the *replacement*, not the match, or `"a"` to `"aa"` never ends.
- `find("")` succeeds at every position; reject an empty needle before counting or replacing.
- `contains` is C++23; on C++20 write `find(...) != npos`.

## Key takeaways

- `find`/`rfind` locate substrings; the `_of`/`_not_of` variants locate characters from a set; all return an index or `npos`.
- `npos` is the largest `size_t`; the only correct test is `!= std::string::npos`.
- `substr` copies and is O(n); the count is clamped, the position is checked.
- `erase`, `insert`, `replace` edit in place; C++20 `std::erase` and `std::erase_if` clear characters across the whole string.
- Count occurrences by restarting the search after the match; replace all by restarting after the replacement.
- `starts_with`/`ends_with` are C++20; normalise to lower case for case-insensitive comparison.
