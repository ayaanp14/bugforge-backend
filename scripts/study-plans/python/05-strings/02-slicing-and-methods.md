---
title: Slicing and the string methods
minutes: 14
---
Two things make Python string handling short: slicing, which extracts any substring, reversal or every-other-character in one expression, and a method set that covers case, whitespace, searching, splitting, joining, testing and padding without a library. This lesson gives the slice rule precisely — it is the same rule for lists and tuples — and then the methods grouped by what they do, with the return-value conventions (`find` returns −1, `index` raises) that decide which one to call.

## Slicing

`s[start:stop:step]` — `start` included, `stop` excluded, `step` the stride; each part optional; negative indexes count from the end; out-of-range bounds clip rather than raise.

```python
s = "abcdefg"
s[1:4]      # 'bcd'
s[:3]       # 'abc'    — from the start
s[3:]       # 'defg'   — to the end
s[-3:]      # 'efg'    — last three
s[:-1]      # 'abcdef' — all but the last
s[::2]      # 'aceg'   — every second
s[::-1]     # 'gfedcba' — reversed
s[1:100]    # 'bcdefg' — clipped, no error
s[5:2]      # ''       — empty, no error
```

The half-open rule means `s[:k] + s[k:] == s` for any `k`, and the length of `s[a:b]` is `b - a` when in range. `s[::-1]` is the idiom for reversing a string (and `"".join(reversed(s))` the readable alternative). A slice always returns a new string; slicing a list returns a new list (Module 6) — the syntax is identical.

## Case and whitespace

```python
"Hello World".lower()        # 'hello world'
"hello".upper()              # 'HELLO'
"hello world".title()        # 'Hello World'
"hello".capitalize()         # 'Hello'
"Straße".casefold()          # 'strasse' — the aggressive lowercase for comparisons
"  pad  ".strip()            # 'pad'
"  pad  ".lstrip()           # 'pad  '
"xxhixx".strip("x")          # 'hi'  — the argument is a *set* of characters, not a prefix
"file.txt".removesuffix(".txt")   # 'file' (3.9); removeprefix likewise
```

`strip()` with no argument removes all whitespace (spaces, tabs, newlines) from both ends. With an argument it removes any of those characters, repeatedly, from both ends — `"www.example.com".strip("w.")` gives `'example.com'`, and `"hello.py".strip(".py")` gives `'hello'` only by luck (`'happy.py'.strip('.py')` gives `'ha'`). For a literal prefix or suffix, `removeprefix`/`removesuffix`.

## Searching

```python
s = "banana"
s.find("an")        # 1   — first index, or -1
s.rfind("an")       # 3   — last
s.index("an")       # 1   — like find, but raises ValueError when absent
s.count("an")       # 2   — non-overlapping
s.startswith("ba")  # True
s.endswith(("na", "xa"))    # True — a tuple tests several suffixes
"an" in s           # True — the existence test; cheaper than find != -1
```

Use `in` when you only need yes/no; `find` when you need the position and absence is normal; `index` when absence is a bug you want raised. `find` and friends take optional `start`/`end` bounds: `s.find("a", 2)`.

## Splitting and joining

```python
"a b  c".split()             # ['a', 'b', 'c']   — any whitespace, runs collapsed, ends trimmed
"a,b,,c".split(",")          # ['a', 'b', '', 'c'] — exact separator, empties kept
"a,b,c".split(",", 1)        # ['a', 'b,c']       — at most 1 split
"a,b,c".rsplit(",", 1)       # ['a,b', 'c']       — from the right
"k=v=w".partition("=")       # ('k', '=', 'v=w')  — always a 3-tuple; ('k=v=w', '', '') if absent
"one\ntwo\n".splitlines()    # ['one', 'two']     — no trailing empty element
", ".join(["a", "b"])        # 'a, b'
"".join(reversed("abc"))     # 'cba'
```

`split()` with no argument is the tokeniser for whitespace-separated input; `split(sep)` is for delimited fields where empty fields matter (CSV-like lines). `partition` is the tool for "the part before the first `=` and the part after" and never raises. `join` requires an iterable of *strings*: `",".join([1, 2])` is a `TypeError`, so map with `str` first.

## Replacing and translating

```python
"a-b-c".replace("-", "+")        # 'a+b+c'
"a-b-c".replace("-", "+", 1)     # 'a+b-c' — at most once
table = str.maketrans("abc", "xyz")
"aabbcc".translate(table)        # 'xxyyzz' — character-for-character, in one pass
"hello".translate(str.maketrans("", "", "lo"))   # 'he' — the third argument deletes
```

`replace` is for substrings; `translate` is faster for many single-character substitutions or deletions (removing punctuation, for instance) because it makes one pass with a table.

## Testing

```python
"123".isdigit()      # True
"abc".isalpha()      # True
"ab1".isalnum()      # True
"  ".isspace()       # True
"Hello".isupper()    # False
"hello".islower()    # True
"Hello World".istitle()   # True
```

`isdigit` is true for `"²"` and false for `"-1"` and `"1.5"`, so it is a check for "all digit characters", not for "parses as a number" — for that, try `int()` and catch `ValueError` (Module 2 lesson 5). The next lesson separates `isdigit`, `isdecimal` and `isnumeric`.

## Padding and alignment

```python
"42".zfill(5)          # '00042'
"-42".zfill(5)         # '-0042' — sign-aware
"ab".ljust(5, ".")     # 'ab...'
"ab".rjust(5)          # '   ab'
"ab".center(6, "*")    # '**ab**'
```

Format specs (next lesson) do the same inside an f-string — `f"{'ab':.<5}"` — and are what you use when the padding is part of a larger line.

## Pitfalls

- `strip(".txt")` as a suffix remover. It strips *characters*; use `removesuffix`.
- `split(" ")` for whitespace tokenising — it keeps empty strings between consecutive spaces; use `split()`.
- `index` on a value that may be absent, raising `ValueError`; use `find` or `in`.
- `join` on a list of non-strings.
- `s.find(x) == True` — `find` returns a position; `1 == True` but `0 != True`.
- Expecting `title()` to handle apostrophes (`"it's"` → `"It'S"`).

## Key takeaways

- `s[a:b:c]` — half-open, negative indexes from the end, clipping bounds, `[::-1]` reverses.
- `strip`/`lstrip`/`rstrip` remove characters from a set at the ends; `removeprefix`/`removesuffix` remove a literal.
- `in` for existence, `find` for a position or −1, `index` to raise; `count`, `startswith`/`endswith` with tuples.
- `split()` tokenises whitespace, `split(sep)` keeps empties, `partition` is a 3-tuple, `join` needs strings.
- `replace` for substrings, `translate` for many characters; `is*` test character classes; `zfill`/`ljust`/`rjust`/`center` pad.
