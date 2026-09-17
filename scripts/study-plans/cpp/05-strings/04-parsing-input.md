---
title: Parsing input
minutes: 14
---
Every program in this track starts the same way: text arrives on standard input and must become numbers, names and records before any logic runs. The judge never sends malformed input by accident, but it does send the edges — a blank line, spaces around a token, an empty field, a count of zero — and a parser that assumes the happy path fails there. This lesson settles the reading patterns: tokens versus lines, splitting on whitespace with `std::istringstream`, splitting on a delimiter with `std::getline` or a `find` loop, trimming, "N then N lines", `key=value` pairs, and validating what you read.

## Tokens, lines and the newline between them

`std::cin >> x` skips leading whitespace, reads one token and stops at the next whitespace — it never consumes the newline that ends the line. `std::getline(std::cin, line)` reads everything up to the newline, consumes the newline and stores the rest. Use one after the other and `getline` returns the empty remainder of the line that `>>` was on:

```cpp
int n = 0;
std::cin >> n;
std::cin.ignore();                   // drop the newline that >> left behind
std::string first;
std::getline(std::cin, first);       // now the next real line
```

`std::cin.ignore()` discards exactly one character; `std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n')` (from `<limits>`) discards the rest of the line however long — safer when the count could be followed by spaces. Module 1, Console I/O, introduced this; every pattern below uses one of the two.

## Splitting a line on whitespace

```cpp
#include <sstream>

std::string line;
std::getline(std::cin, line);              //   ada   36 london
std::istringstream iss(line);
std::string word;
while (iss >> word) {
    std::cout << '[' << word << "]\n";     // [ada] [36] [london]
}
```

An `std::istringstream` is a stream over a string: `>>` behaves exactly as on `std::cin`, skipping any amount of whitespace, so runs of spaces, tabs and leading or trailing blanks all disappear — the right tool whenever fields are separated by "one or more spaces". Reading a number the same way also validates it:

```cpp
std::istringstream iss("42 apples");
int count = 0;
std::string what;
if (iss >> count >> what) { /* both read: 42 and "apples" */ }

std::istringstream bad("forty");
if (!(bad >> count)) { /* "forty" is not an integer: count is now 0 and the stream has failed */ }
```

A failed `>>` sets the stream's fail bit and, since C++11, writes 0 to the target; every later `>>` on that stream fails until `clear()` is called. Module 18, Streams and files, goes deeper; for parsing, "the read failed, so the token was not a number" is enough. Two shapes of one loop cover most inputs: `while (std::cin >> x)` reads tokens to the end of input and `while (std::getline(std::cin, line))` reads lines — the condition is the stream itself, which converts to `false` once a read has failed.

## Splitting on a delimiter

Comma-, colon- or pipe-separated fields need a different cut, because whitespace is now part of the data and empty fields are meaningful. `std::getline` takes a third argument, the delimiter:

```cpp
std::istringstream iss("ada,,london");
std::string field;
while (std::getline(iss, field, ',')) {
    std::cout << '[' << field << "]\n";     // [ada] [] [london]
}
```

An empty field between two commas comes out as an empty string, which is right. But a delimiter at the very *end* is followed by nothing: the final `getline` hits end of input without extracting a character and fails, so `"a,b,"` yields two fields, not three. When a trailing delimiter must mean a trailing empty field, use the `find` loop:

```cpp
#include <vector>

std::vector<std::string> split(const std::string& text, char delim) {
    std::vector<std::string> parts;
    std::size_t start = 0;
    while (true) {
        const std::size_t at = text.find(delim, start);
        if (at == std::string::npos) {
            parts.push_back(text.substr(start));       // the last field, possibly empty
            return parts;
        }
        parts.push_back(text.substr(start, at - start));
        start = at + 1;
    }
}
```

`split("a,b,", ',')` gives `{"a", "b", ""}` and `split("", ',')` one empty field — a definition, so state it when it matters. Lesson 6 rewrites this with `std::string_view` so no field is copied.

## Trimming every field

Fields split on a delimiter keep their spaces: `"ada , 36"` splits into `"ada "` and `" 36"`. Lesson 2's `trim` fixes each one:

```cpp
std::string trim(const std::string& s) {
    const std::size_t start = s.find_first_not_of(" \t");
    if (start == std::string::npos) return "";
    const std::size_t end = s.find_last_not_of(" \t");
    return s.substr(start, end - start + 1);
}
```

Trim *before* testing for emptiness or converting to a number: `std::from_chars` (lesson 3) rejects a leading space outright, and `" "` is not an empty field until it has been trimmed.

## N then N lines

```cpp
int n = 0;
std::cin >> n;
std::cin.ignore();
for (int i = 0; i < n; ++i) {
    std::string line;
    std::getline(std::cin, line);
    // parse line
}
```

The shape behind most exercises: a count, then that many records. Trust the count, not the end of input — a second section (queries, say) may follow. When the records are single tokens rather than lines, `std::cin >> token` needs no `ignore()` at all, because `>>` skips newlines itself.

## key=value pairs

```cpp
std::string line = " timeout = 30 ";
const std::size_t eq = line.find('=');
if (eq == std::string::npos) {
    std::cout << "invalid: no '='\n";
} else {
    std::string key = trim(line.substr(0, eq));       // "timeout"
    std::string value = trim(line.substr(eq + 1));    // "30"
    if (key.empty()) std::cout << "invalid: empty key\n";
}
```

Cut on the *first* `=` so a value may itself contain one (`url = a?b=c`). Store the pairs in a `std::map<std::string, std::string>` — Module 3 iterated one; Module 13, STL containers, covers it — and let later lines overwrite earlier ones with `settings[key] = value`. Empty lines and lines starting with `#` are skipped before any of this runs.

## Validating tokens

Reading is not done until every token has been checked. Decide in advance: what is the delimiter, are runs of it one separator or several (whitespace: one; commas: several), are surrounding blanks significant, may a field be empty, what range may a number have, and what happens on a bad line — skip, report, or stop. A parser that prints `line 3: invalid` and carries on beats one that crashes on the first surprise; on the judge a crash is a runtime error, not a wrong answer.

```cpp
int lineno = 0;
std::string line;
while (std::getline(std::cin, line)) {
    ++lineno;
    if (!line.empty() && line.back() == '\r') line.pop_back();    // Windows line endings
    const std::string token = trim(line);
    if (token.empty()) continue;                                  // blank lines carry nothing
    int value = 0;
    if (!parse_int(token, value)) {                               // lesson 3's from_chars helper
        std::cout << "line " << lineno << ": invalid\n";
        continue;
    }
    // use value
}
```

The `'\r'` check costs one comparison and saves an afternoon when a file was edited on Windows; this judge sends `\n` only, but real input promises nothing.

## Pitfalls

- `std::getline` straight after `std::cin >> n` reads the empty rest of the count's line; `ignore()` first.
- `std::getline(iss, f, ',')` drops a trailing empty field; the `find` loop keeps it — pick one and say so.
- `>>` on a non-number sets the fail bit and every later read on that stream fails until `clear()`.
- Fields split on a delimiter keep their surrounding spaces; trim before comparing or converting.
- Cut `key=value` on the first `=`, not the last, so values may contain `=`.

## Key takeaways

- `>>` reads tokens and skips whitespace; `getline` reads lines; an `ignore()` sits between them.
- `std::istringstream` turns a line into a stream so `>>` splits it on whitespace and validates numbers.
- `getline` with a delimiter and a `find`/`substr` loop split on a character; they differ on a trailing delimiter.
- Trim every field, then test for empty, then convert.
- Read "N then N lines" by the count, and `while (std::getline(...))` when the input runs to the end.
- Validate every token and report bad lines; a crash is a runtime error on the judge.
