---
title: Characters, code points, bytes and Unicode
minutes: 13
---
A Python string holds *code points* — abstract Unicode characters numbered from 0 to 1 114 111 — and a `bytes` object holds bytes. The two are different types, converted by *encoding* (str → bytes) and *decoding* (bytes → str) with a named encoding, almost always UTF-8. Keeping the distinction straight is the whole of Unicode handling in Python 3, and it dissolves the classic questions: why `len("é")` is 1 but the file is two bytes longer, why `"ß".upper()` is `"SS"`, why `"²".isdigit()` is true. This lesson covers `ord`/`chr`, the text/bytes boundary, the three digit tests, case and normalisation, and the `string` module constants.

## Code points

```python
ord("A")        # 65
ord("é")        # 233
ord("€")        # 8364
chr(65)         # 'A'
chr(0x1F600)    # '😀'
"\u00e9"        # 'é'  — escape by code point
"\N{GREEK SMALL LETTER ALPHA}"   # 'α' — by name
```

`ord` and `chr` convert between a one-character string and its code point; arithmetic on code points is how you shift letters — `chr(ord("a") + 3)` is `"d"` — and the Caesar cipher is the standard exercise. `unicodedata.name("é")` gives `'LATIN SMALL LETTER E WITH ACUTE'`, `unicodedata.category("é")` gives `'Ll'` (letter, lowercase). ASCII is the first 128 code points; everything you type on an English keyboard is there, and `"é"`, `"€"`, CJK characters and emoji are above it.

## str and bytes

```python
s = "café"
b = s.encode("utf-8")       # b'caf\xc3\xa9'
len(s), len(b)              # 4, 5 — é is two bytes in UTF-8
b.decode("utf-8")           # 'café'
b.decode("ascii")           # UnicodeDecodeError: byte 0xc3 is not ASCII
"é".encode("latin-1")       # b'\xe9' — a different encoding, one byte
```

A `bytes` literal is `b"..."` and may contain only ASCII; other values are written as `\x..` escapes. `bytes` supports most string methods (`split`, `strip`, `find`, `upper` on ASCII) and indexes to integers: `b"abc"[0]` is `97`. Files opened in text mode do the encoding for you (`open(path, encoding="utf-8")`, Module 14); sockets and binary files hand you bytes. The rule: **decode at the boundary, work in `str`, encode at the boundary.** Mixing the types is a `TypeError` (`"a" + b"b"`), which is a feature: Python 2's silent mixing was the source of every mojibake bug.

UTF-8 encodes ASCII in one byte, most European letters in two, CJK in three, emoji in four, and is the default nearly everywhere — including `sys.stdin`/`sys.stdout` on the judge. `sys.getdefaultencoding()` is `'utf-8'`; the *file system* and *console* encodings can differ on Windows, which is why `open` should always be given `encoding=`.

## Three digit tests

| Method | `"5"` | `"²"` | `"½"` | `"٣"` (Arabic-Indic 3) | `"-1"` |
| --- | --- | --- | --- | --- | --- |
| `isdecimal()` | True | False | False | True | False |
| `isdigit()` | True | True | False | True | False |
| `isnumeric()` | True | True | True | True | False |

`isdecimal` is "characters `int()` accepts as digits" — and `int("٣")` really is 3. `isdigit` adds superscripts and other digit-like symbols; `isnumeric` adds fractions and CJK numerals. None accepts a sign or a decimal point, so none is a test for "is a number"; that test is `try: int(s)` (Module 2). `isalpha` is true for letters in any script; `isascii()` (3.7) is true when every character is below 128.

## Case is not simple

```python
"straße".upper()          # 'STRASSE' — one character becomes two
"İ".lower()               # 'i̇' — two code points
"ǅ".title()               # 'ǅ' — a titlecase letter that is neither upper nor lower
"MASSE".lower() == "masse"          # True
"Maße".lower() == "masse"           # False
"Maße".casefold() == "masse"        # True — casefold is for comparison
```

`lower()` and `upper()` are for display; `casefold()` is for comparing and for dictionary keys that should ignore case. A string's length can change under a case mapping, so never index into `s.upper()` with positions from `s`.

## Normalisation

The same visible character can be one code point (`"é"`, U+00E9) or two (`"e"` + U+0301, a combining acute). They print identically and compare unequal:

```python
import unicodedata
a = "\u00e9"
b = "e\u0301"
a == b                                            # False
unicodedata.normalize("NFC", b) == a              # True — compose
len(unicodedata.normalize("NFD", a))              # 2 — decompose
```

Normalise (NFC) text that comes from users or files before comparing, deduplicating or hashing it. `unicodedata.normalize("NFKD", s)` followed by `s.encode("ascii", "ignore")` is the quick way to strip accents for a slug.

## The string module and character arithmetic

`string.ascii_lowercase`, `ascii_uppercase`, `ascii_letters`, `digits`, `punctuation`, `whitespace` are the ready-made alphabets. Rotating within one:

```python
import string
def caesar(text, k):
    lower = string.ascii_lowercase
    table = str.maketrans(lower + lower.upper(), lower[k:] + lower[:k] + (lower[k:] + lower[:k]).upper())
    return text.translate(table)
```

`translate` with a table from `maketrans` handles every character in one pass and leaves characters not in the table (spaces, digits, punctuation) unchanged.

## Pitfalls

- `len(s)` as the byte length. It is the code-point count; `len(s.encode())` is bytes.
- `open(path)` without `encoding="utf-8"` — the platform default may not be UTF-8.
- `isdigit()` as "is a number".
- `lower()` for comparison; `casefold()`.
- Comparing user input without NFC normalisation.
- `"a" + b"b"`. Decode first.

## Key takeaways

- A `str` is code points, a `bytes` is bytes; `encode`/`decode` with UTF-8 convert at the boundary and never mix.
- `ord`/`chr` map characters to code points; `unicodedata` names and normalises them.
- `isdecimal` ⊂ `isdigit` ⊂ `isnumeric`; none accepts a sign — parse with `int()` and catch `ValueError`.
- `lower`/`upper` can change length; `casefold` is the comparison form.
- Normalise (NFC) text from outside before comparing; `string` holds the alphabets; `translate` maps many characters in one pass.
