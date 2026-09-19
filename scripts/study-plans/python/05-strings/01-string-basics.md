---
title: String basics — an immutable sequence of characters
minutes: 12
---
A Python `str` is an immutable sequence of Unicode characters. Each of those four words matters: *immutable* means every "change" makes a new string; *sequence* means indexing, slicing, `len`, `in` and iteration all work as they do on a list; *Unicode* means a character is a code point, not a byte, and `"é"` has length 1; and *string* means the type comes with the richest method set in the language. This lesson covers literals and escapes, the sequence operations, comparison, `str` versus `repr`, and the concatenation cost that decides how output should be built.

## Literals

```python
a = 'single'
b = "double"                      # same thing; pick one and be consistent
c = "it's"                        # the other quote avoids escaping
d = 'say "hi"'
e = "line one\nline two\ttabbed"  # escapes: \n newline, \t tab, \\ backslash, \" quote
f = r"C:\new\folder"              # raw: backslashes are literal (regexes, Windows paths)
g = """A multi-line
string keeps its newlines."""
h = "adjacent " "literals " "join"   # implicit concatenation at compile time
```

Escapes are interpreted in ordinary literals: `\n`, `\t`, `\\`, `\'`, `\"`, `\x41` (hex byte), `\u00e9` (Unicode code point), `\N{EURO SIGN}`. A raw string turns them off — except that a raw string still cannot end in an odd backslash. Triple-quoted strings span lines and are the docstring syntax. Adjacent literals are joined by the compiler, which is how a long message is split across lines inside parentheses without `+`.

## Sequence operations

```python
s = "python"
len(s)          # 6
s[0], s[-1]     # 'p', 'n'  — negative indexes count from the end
s[2:4]          # 'th'      — slicing, half-open (next lesson)
"th" in s       # True      — substring test
s + "3"         # 'python3'
"-" * 10        # '----------'
for ch in s:    # iterates characters
    ...
list(s)         # ['p', 'y', 't', 'h', 'o', 'n']
```

Indexing past the end raises `IndexError`; slicing past the end does not (it clips). There is no separate character type — `s[0]` is a string of length 1. `in` tests for a substring, not just a character: `"tho" in "python"` is `True`.

## Immutability

```python
s = "cat"
s[0] = "b"          # TypeError: 'str' object does not support item assignment
s = "b" + s[1:]     # 'bat' — a new string bound to the same name
```

Every method that appears to modify — `upper`, `replace`, `strip` — returns a new string and leaves the original alone; the classic bug is calling one and discarding the result (`s.upper()` on its own line does nothing). Immutability is what makes strings usable as dictionary keys and set members, and it is why building a long string by repeated `+=` is expensive: each step copies the whole accumulated string. Collect the pieces in a list and `"".join` them once (Module 3 lesson 5).

## Comparison

Strings compare by code point, left to right, first difference decides; a prefix sorts before the longer string:

```python
"apple" < "banana"    # True
"Zebra" < "apple"     # True — uppercase letters have smaller code points than lowercase
"abc" < "abd"         # True
"ab" < "abc"          # True
"10" < "9"            # True — text, not numbers
```

Case-insensitive comparison is `a.lower() == b.lower()` — or, correctly for every language, `a.casefold() == b.casefold()`. Comparing numeric strings as numbers means converting them first: `sorted(nums, key=int)`. `==` compares content, never identity; two equal strings may or may not be the same object, and `is` is not for strings.

## str and repr

`str(x)` is the readable form, what `print` shows; `repr(x)` is the unambiguous form, what the REPL shows and what you want in a debug message:

```python
s = "a\tb\n"
print(str(s))     # a	b   (a tab and a newline, invisible)
print(repr(s))    # 'a\tb\n'
print(f"{s!r}")   # the same, inside an f-string
```

`repr` of a string is a valid literal that would recreate it, quotes and escapes included. When a program's output is wrong by "nothing visible", `repr` shows the trailing newline or the tab.

## The methods, first pass

The next lesson goes through them; the ones every program needs are `strip()` (remove surrounding whitespace), `split()` (to a list of words), `join(iterable)` (from a list back to a string), `upper()`/`lower()`, `replace(old, new)`, `startswith`/`endswith`, `find`, and `count`. Note the direction of `join`: it is a method of the *separator* — `", ".join(names)` — because the separator is the one string that is always a string, while the pieces might be any iterable.

## Pitfalls

- `s.strip()` (or any method) called without keeping the result.
- `s[0] = "x"`. Build a new string.
- `"10" < "9"` and `sorted(["10", "9"])` — text order, not numeric.
- `+=` in a loop over many pieces; use a list and `join`.
- Treating `s[i]` as a char type: it is a `str`, and `s[i] == "a"` is the comparison.
- Confusing `str` and `repr` when printing a debug value.

## Key takeaways

- Strings are immutable sequences of code points: index, slice, `len`, `in`, iterate; every change is a new string.
- Literals: single or double quotes, escapes, raw strings for backslashes, triple quotes for multi-line, adjacent literals join.
- Comparison is by code point (uppercase before lowercase, text order for digits); `casefold` for case-insensitive.
- `str` is readable, `repr` is unambiguous — use `repr` when debugging whitespace.
- `sep.join(pieces)` builds a string; repeated `+=` copies every time.
