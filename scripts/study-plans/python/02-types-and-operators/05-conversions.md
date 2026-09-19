---
title: Conversions — between text, numbers and containers
minutes: 12
---
Python converts between types only when asked, and the asking is done by calling the target type: `int("42")`, `str(3.5)`, `list("abc")`, `float(7)`. Each conversion has precise rules about what it accepts and what it raises, and half the `ValueError`s in a beginner's program come from one of them being fed something it does not take. This lesson lists the conversions that matter, the failures each produces, the two implicit conversions that *do* exist (numeric widening and truth testing), and the cases — `"1" + 1`, `int("3.0")`, `float` to `int` — where the interpreter will not guess.

## Strings to numbers

`int(s)` parses an optional sign, decimal digits and underscores, ignoring surrounding whitespace. Everything else is a `ValueError` with the offending text in the message:

```python
int("42")        # 42
int("  -7\n")    # -7
int("1_000")     # 1000
int("3.0")       # ValueError: invalid literal for int() with base 10: '3.0'
int("")          # ValueError
int("0x1f")      # ValueError — base 10 does not know prefixes
int("0x1f", 16)  # 31 — with the base, a matching prefix is allowed
int("1f", 16)    # 31
int("101", 2)    # 5
int("0o17", 0)   # 15 — base 0 reads the prefix
```

`float(s)` parses decimal notation, exponents, `inf`, `nan`, with sign and whitespace: `float("2.5")`, `float("1e3")` → `1000.0`, `float("-inf")`. It also accepts what `int` accepts, so `float("7")` is `7.0`. A string that is a valid float but not a valid int is common input (`"3.0"`): read it with `float` and truncate with `int(float(s))` if an integer is wanted, or reject it, but do not pass it to `int`.

The recipe for classifying a token is to try the strict parse first:

```python
def classify(tok):
    try:
        return "int", int(tok)
    except ValueError:
        pass
    try:
        return "float", float(tok)
    except ValueError:
        return "text", tok
```

`str.isdigit()` is *not* a substitute — it is false for `"-7"` and true for `"²"` — and Module 5 lesson 4 explains the three `is*` methods it is often confused with.

## Numbers to strings

`str(x)` and `f"{x}"` produce the same text as `print` would: `str(42)` is `"42"`, `str(2.5)` is `"2.5"`, `str(1e21)` is `"1e+21"`, `str(0.1 + 0.2)` is `"0.30000000000000004"`. `repr(x)` is the same for numbers and differs for strings (`repr("a")` is `"'a'"`, with quotes). Format specs control the shape: `f"{x:.2f}"`, `f"{n:05d}"`, `f"{n:x}"`, `f"{n:,}"`. `bin(n)`, `oct(n)`, `hex(n)` give prefixed strings; `format(n, "b")` gives digits only; `int(bin(n), 2)` round-trips.

## Between numbers

`float(n)` widens an int exactly up to 2⁵³ and rounds above it. `int(x)` truncates a float toward zero — `int(3.9)` is 3, `int(-3.9)` is −3 — and raises `ValueError` on `nan` and `OverflowError` on `inf`. `round(x)` gives the nearest int (half to even); `math.floor` and `math.ceil` round down and up. `bool(x)` applies the truthiness table; `int(True)` is 1. `complex(2, 3)` is `(2+3j)`, and no conversion goes from complex back to real without `.real`/`.imag`.

Two implicit conversions exist. Arithmetic widens `int → float → complex` as needed. And any object is converted to a truth value when tested in `if`, `while`, `and`, `or`, `not`. There is no implicit `int ↔ str`: `"1" + 1` is a `TypeError`, `"1" * 3` is `"111"` (repetition, not multiplication), and concatenating a number into text needs `str(n)` or an f-string.

## Characters and code points

`ord("A")` is `65`; `chr(65)` is `"A"`. Arithmetic on code points is how you shift letters: `chr(ord("a") + 3)` is `"d"`, and `ord(c) - ord("0")` turns a digit character into its value (though `int(c)` is clearer). Module 5 lesson 4 covers the encoding side, `str.encode` and `bytes.decode`.

## Containers

The container constructors take any iterable:

```python
list("abc")            # ['a', 'b', 'c']
tuple([1, 2])          # (1, 2)
set([1, 1, 2])         # {1, 2}
list(range(3))         # [0, 1, 2]
dict([("a", 1)])       # {'a': 1}
dict(zip(keys, vals))  # pairs into a mapping
"".join(["a", "b"])    # 'ab' — the string constructor is join, not str()
str([1, 2])            # '[1, 2]' — the repr, not the elements
```

`str(container)` is almost never what you want in output; `" ".join(map(str, xs))` is. `list(x)` on a list makes a shallow copy; on a dict it gives the keys; on a string the characters; on a file the lines.

## Conversions your own types can define

The built-in constructors ask the object: `int(x)` calls `x.__int__()` (or `__index__`), `float(x)` calls `__float__`, `str(x)` calls `__str__`, `bool(x)` calls `__bool__` then `__len__`, `list(x)` iterates `__iter__`. A class that implements these participates in the same conversions (Module 8 and Module 16). `Decimal("0.1")` and `Fraction("1/3")` are ordinary classes whose constructors parse strings — the pattern is not special to the built-ins.

## Pitfalls

- `int("3.0")`. Parse with `float` first.
- `int(x)` truncating toward zero when you wanted the floor of a negative number.
- `"1" + 1` and `"total: " + n`. Use an f-string.
- `str(xs)` to print a list's elements.
- `int(s)` on input with a stray non-digit — surrounding whitespace is fine, an inner space is not.
- Checking `s.isdigit()` before `int(s)` and rejecting negative numbers.

## Key takeaways

- Conversion is explicit: call the target type; `int`, `float` and friends raise `ValueError` on text they cannot parse and `TypeError` on the wrong kind of object.
- `int(s, base)` parses other bases; `bin`/`oct`/`hex` and format specs print them.
- `int(x)` truncates a float; `round`, `floor`, `ceil` are the other roundings; numeric arithmetic widens implicitly, nothing else does.
- `ord`/`chr` map characters to code points; container constructors take any iterable; `join` builds a string from parts.
- Try the strict conversion first and catch `ValueError` to classify a token.
