---
title: Formatting — f-strings and the format-spec mini-language
minutes: 14
---
Every judged exercise ends with output that must match exactly, and almost every real program prints a table, a report or a message with values in it. Python's f-string does both: an expression inside braces, an optional conversion, and a *format spec* after a colon that controls width, alignment, padding, sign, grouping, precision and type. The spec is a small language shared by `format()`, `str.format` and f-strings, and this lesson learns it once. It ends with the older `%` style, which you will read in existing code and should not write.

## f-strings

```python
name, n, price = "Ada", 3, 2.5
print(f"{name} bought {n} items for {n * price}")   # any expression inside the braces
print(f"{name!r} {name!s} {name!a}")                # conversions: repr, str, ascii
print(f"{n=}, {price=}")                            # 3.8: name=value, for debugging
print(f"{'nested'}")                                # a different quote style inside (3.11)
print(f"{{literal braces}}")                        # doubled braces print once
```

The braces take an expression, so calls, indexing, arithmetic and conditional expressions all work — but keep them short; a complex expression belongs in a variable above the f-string. `!r` applies `repr`, which is how a string is printed with its quotes. Until 3.12 the same quote character as the enclosing string cannot appear inside the braces; use the other one.

## The format spec

`{value:spec}` where `spec` is `[[fill]align][sign][#][0][width][grouping][.precision][type]`, every part optional:

| Part | Values | Effect |
| --- | --- | --- |
| fill + align | any char, then `<` `>` `^` `=` | pad to the width: left, right, centre; `=` puts padding after the sign |
| sign | `+` `-` ` ` | `+` shows a plus on positives; space leaves a space |
| `#` | | alternate form: `0x` prefix, `0b`, a decimal point on `.0f` |
| `0` | | zero-pad (numbers) — shorthand for `fill=0, align==` |
| width | integer | minimum field width |
| grouping | `,` `_` | thousands separator |
| `.precision` | integer | decimals for `f`, significant digits for `g`, max chars for strings |
| type | `d` `f` `e` `g` `%` `x` `X` `o` `b` `s` `c` | how to render |

```python
f"{42:5d}"        # '   42'      width 5, right-aligned (numbers default right)
f"{42:<5d}|"      # '42   |'     left
f"{42:^7d}|"      # '  42   |'   centred
f"{42:05d}"       # '00042'      zero-padded
f"{-42:05d}"      # '-0042'
f"{42:+d}"        # '+42'
f"{1234567:,}"    # '1,234,567'
f"{1234567:_d}"   # '1_234_567'
f"{255:x} {255:X} {255:#x} {5:08b}"   # 'ff FF 0xff 00000101'
f"{'ab':>5}|"     # '   ab|'     strings default left; > forces right
f"{'ab':*^6}"     # '**ab**'     fill character then align
f"{'abcdef':.3}"  # 'abc'        precision truncates a string
```

The width is a *minimum*: a value wider than the field is printed whole. The width and precision can themselves be expressions: `f"{x:{w}.{p}f}"`.

## Floats

```python
x = 3.14159
f"{x:.2f}"        # '3.14'       fixed, 2 decimals — the one every exercise uses
f"{x:8.3f}"       # '   3.142'   width 8
f"{x:e}"          # '3.141590e+00'
f"{x:.3g}"        # '3.14'       3 significant digits; switches to e-notation when large/small
f"{0.256:.1%}"    # '25.6%'      multiplies by 100
f"{2.0:.0f}"      # '2'
f"{1e6:,.2f}"     # '1,000,000.00'
f"{x}"            # '3.14159'    no spec: repr-like shortest form
```

`.Nf` rounds correctly to the nearest representable value (half-to-even on exact ties, but exact ties are rare in binary — Module 2). A float with no spec prints the shortest round-tripping form, which is never what a table wants; always give a precision.

## Tables

```python
rows = [("apple", 3, 0.5), ("watermelon", 1, 4.25)]
print(f"{'item':<12}{'qty':>4}{'price':>8}")
for name, qty, price in rows:
    print(f"{name:<12}{qty:>4}{price:>8.2f}")
```

```text
item         qty   price
apple          3    0.50
watermelon     1    4.25
```

Column widths are decided once; the same specs apply to the header (strings) and the rows. When the widest value is only known after reading the data, compute `w = max(len(r[0]) for r in rows)` and use `{name:<{w}}`.

## format() and str.format

`format(value, spec)` applies one spec to one value: `format(255, "08b")`. `"{} and {}".format(a, b)` is the pre-3.6 template style, still useful when the template is built separately from the values (a message loaded from a file, a format reused in a loop):

```python
template = "{name:<10}{score:>5}"
for name, score in rows:
    print(template.format(name=name, score=score))
```

Positional `{0}`, named `{name}`, and attribute/index access `{p.x}`, `{d[key]}` all work inside `str.format`.

## The % operator

`"%s scored %d (%.2f%%)" % (name, score, pct)` is the C-style formatting Python inherited; `%s` for anything, `%d` for integers, `%f` for floats, `%%` for a literal percent. It is what `logging` messages use (Module 15), because the formatting is deferred until the message is actually emitted, and it is everywhere in older code. Read it; write f-strings.

## Pitfalls

- A float printed without a precision.
- `f"{x:5}"` for a string aligns *left*, for a number *right*; be explicit with `<` or `>`.
- Expecting width to truncate: it does not; only `.precision` truncates strings.
- The same quote inside the braces on 3.11 (`f"{d["k"]}"` is a `SyntaxError` there; use `d['k']`).
- `f"{x:,.2f}"` versus `f"{x:.2f,}"` — grouping comes before precision.
- `%` formatting with a single tuple argument: `"%s" % (1, 2)` is a `TypeError`; wrap it `((1, 2),)`.

## Key takeaways

- f-strings evaluate expressions in braces; `!r` for repr, `=` for name=value, `{{ }}` for literal braces.
- The spec is `[fill][align][sign][#][0][width][,][.precision][type]`; numbers align right by default, strings left.
- `.2f` is the fixed-decimal spec; `,` groups thousands; `%` scales by 100; `x`/`b`/`o` change the base.
- Tables are the same specs applied to header and rows; widths can be variables.
- `str.format` is for templates separated from values; `%` is legacy — read it, do not write it.
