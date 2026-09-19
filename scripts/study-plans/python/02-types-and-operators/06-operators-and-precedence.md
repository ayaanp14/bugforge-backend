---
title: Operators and precedence
minutes: 13
---
Python's operators are the usual set plus a few of its own — `//`, `**`, `in`, `is`, `@`, the walrus — and the precedence table is short enough to learn. What is worth learning precisely is the handful of places where the table produces something a reader does not expect: `-2 ** 2`, `not a == b`, `a & b == c`, and the bitwise operators applied to arbitrary-precision integers. This lesson gives the table, the semantics of the bitwise operators on unbounded ints, and the operator module that lets you pass an operator as a function.

## The table, highest first

| Precedence | Operators | Notes |
| --- | --- | --- |
| 1 | `(…)`, `[…]`, `{…}` | grouping and literals |
| 2 | `x[i]`, `x[a:b]`, `f(…)`, `x.attr` | subscript, slice, call, attribute |
| 3 | `await x` | |
| 4 | `**` | right-associative; binds tighter than unary minus on its **left** |
| 5 | `+x`, `-x`, `~x` | unary |
| 6 | `*`, `@`, `/`, `//`, `%` | |
| 7 | `+`, `-` | binary |
| 8 | `<<`, `>>` | shifts |
| 9 | `&` | bitwise and |
| 10 | `^` | bitwise xor |
| 11 | `\|` | bitwise or |
| 12 | `in`, `not in`, `is`, `is not`, `<`, `<=`, `>`, `>=`, `!=`, `==` | comparisons — all one level, and they chain |
| 13 | `not x` | |
| 14 | `and` | |
| 15 | `or` | |
| 16 | `x if c else y` | conditional expression |
| 17 | `lambda` | |
| 18 | `:=` | walrus |

Three consequences are worth memorising. `**` is right-associative: `2 ** 3 ** 2` is `2 ** 9 = 512`, not `64`. `-2 ** 2` is `-(2 ** 2) = -4`, because the unary minus is *lower* than `**`; but `2 ** -1` is `0.5`, because the exponent position takes a unary expression. And the bitwise operators sit *above* comparisons, so `a & b == c` parses as `a & (b == c)` — parenthesise every bitwise sub-expression inside a comparison. Comparisons sit above `not`, so `not a == b` is `not (a == b)`, which is what you meant; `not a in xs` works the same way but `a not in xs` is the readable spelling.

Everything else associates left to right: `10 - 4 - 3` is `3`, `100 / 10 / 2` is `5.0`, `a % b % c` is `(a % b) % c`.

## Arithmetic

`+ - * / // % **` are the previous lessons' subject; `@` is matrix multiplication, defined by NumPy arrays and by your own classes through `__matmul__`, and unused by the built-in types. `+` on sequences concatenates (`[1] + [2]`, `"a" + "b"`) and `*` with an int repeats (`[0] * 5`, `"-" * 20`). The augmented forms `+=`, `-=`, `*=`, `/=`, `//=`, `%=`, `**=`, `&=`, `|=`, `^=`, `<<=`, `>>=` exist for every binary operator; there is no `++` or `--` (`++n` parses as `+(+n)`, a no-op, silently).

## Bitwise operators on unbounded integers

`&`, `|`, `^`, `~`, `<<`, `>>` treat an `int` as a two's-complement number with *infinitely many* bits. Positive numbers behave as in any language: `0b1100 & 0b1010` is `0b1000`, `1 << 40` is `1099511627776` (no overflow), `x >> 1` halves toward negative infinity. `~x` is `-x - 1`, so `~5` is `-6`, and a negative number has an infinite run of leading ones, which is why `-1 & 0xFF` is `255` — masking selects the low bits exactly as you would want.

The idioms interviews expect:

```python
x & 1                # 1 if odd
x & (x - 1)          # clears the lowest set bit; zero iff x is a power of two (x > 0)
x & -x               # isolates the lowest set bit
x | (1 << k)         # set bit k
x & ~(1 << k)        # clear bit k
x ^ (1 << k)         # toggle bit k
(x >> k) & 1         # read bit k
x.bit_count()        # number of set bits (3.10); bin(x).count("1") before that
x.bit_length()       # bits needed: (255).bit_length() == 8
```

Flags are sets of bits: `READ, WRITE, EXEC = 1, 2, 4`; a permission set is `READ | EXEC`; testing is `perms & WRITE`, which is `0` or `WRITE` — truthy either way for `if`, but compare with `!= 0` or `== WRITE` when a boolean must be stored. `enum.Flag` gives these a type (Module 13).

## Comparisons, membership, identity

`==`, `!=`, `<`, `<=`, `>`, `>=` compare values and chain (`0 <= i < n`). `in` and `not in` test membership — of an element in a container, a substring in a string, a key in a dict. `is` and `is not` test identity (Module 2 lesson 3). Comparing different types with `<` raises `TypeError` (`3 < "3"`); `==` between different types is simply `False`. Sequences compare lexicographically: `[1, 2] < [1, 3]`, `"abc" < "abd"`, `(1, "b") < (1, "c")` — the rule that makes sorting tuples by several keys work (Module 6).

## The operator module

Every operator has a named function in `operator`: `operator.add`, `mul`, `floordiv`, `neg`, `lt`, `eq`, `and_`, `or_`, `contains`, `getitem`. They are what you pass to `functools.reduce`, `map` or `sorted(key=…)` when a lambda would only wrap an operator: `reduce(operator.mul, xs, 1)` is the product. `operator.itemgetter(1)` and `attrgetter("name")` build key functions (Module 11).

## Evaluating from text

An expression written as a string can be evaluated with `eval`, and a program that reads expressions from untrusted input must not — `eval("__import__('os').system('rm -rf /')")` is why. For arithmetic on trusted, small input it is a reasonable tool, and `ast.literal_eval` safely parses *literals only* (numbers, strings, tuples, lists, dicts) without evaluating code, which is the right way to turn `"[1, 2, 3]"` back into a list.

## Pitfalls

- `-2 ** 2` is −4; `2 ** 3 ** 2` is 512.
- `a & mask == 0` compares first; write `(a & mask) == 0`.
- `++i` does nothing; `i += 1`.
- `3 < "3"` is a `TypeError`; parse first.
- `x is not None and x > 0` needs no parentheses, but `not x in xs` should be `x not in xs`.
- `eval` on input you did not write.

## Key takeaways

- `**` binds tightest among arithmetic and associates right; unary minus is below it; bitwise operators are above comparisons.
- Comparisons chain and sit above `not`, `and`, `or`, which sit above the conditional expression.
- Bitwise operators work on infinite two's-complement integers; `x & (x - 1)`, `1 << k`, `bit_count` are the idioms.
- `==` across types is `False`, `<` across types is an error; sequences compare lexicographically.
- `operator` names every operator as a function; `ast.literal_eval` parses literals safely.
