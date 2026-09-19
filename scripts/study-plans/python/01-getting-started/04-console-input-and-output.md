---
title: Console input and output — the patterns every exercise uses
minutes: 14
---
Every program in this track reads standard input and writes standard output, so the reading and printing idioms are worth fixing once, precisely. `input()` gives you one line as a string; `sys.stdin` gives you the whole stream; `print` writes objects separated by spaces with a newline at the end, and both of those defaults can be changed. The lesson ends with the five reading patterns that cover every input format the exercises use — copy them, and the I/O in an exercise stops being where the time goes.

## `input()`

`input()` reads one line from standard input, strips the trailing newline, and returns it as a `str`. It always returns a string: the digits `42` come back as `"42"`, and arithmetic on that raises `TypeError` until you convert.

```python
line = input()          # "3 4"
n = int(input())        # "7" -> 7
x = float(input())      # "2.5" -> 2.5
a, b = input().split()  # "3 4" -> "3", "4" — still strings
```

`int("  7\n")` tolerates surrounding whitespace, so `int(input())` is safe even if the line has stray spaces; `int("3.5")` and `int("")` raise `ValueError`. When the stream is exhausted, `input()` raises `EOFError` — the signal that there is no more input, and a way to loop "until the end":

```python
lines = []
try:
    while True:
        lines.append(input())
except EOFError:
    pass
```

Never pass a prompt: `input("n = ")` writes `n = ` to standard output first, and on the judge that text is part of your answer.

## Several values on one line

`str.split()` with no argument splits on any run of whitespace and drops leading and trailing whitespace, which is exactly what "numbers separated by spaces" needs. `map(int, …)` converts each token; `list(…)` materialises the result.

```python
nums = list(map(int, input().split()))         # "3 -1 4" -> [3, -1, 4]
a, b, c = map(int, input().split())            # exactly three tokens
words = input().split()                        # ["to", "be", "or"]
first, *rest = input().split()                 # one and the others
```

`split(",")` splits on an explicit separator and keeps empty fields (`"a,,b".split(",")` is `["a", "", "b"]`); `strip()` removes surrounding whitespace from a token. Module 5 covers parsing in depth.

## `sys.stdin`

For bulk input, `sys.stdin` is a file object: iterate it for lines (each keeps its `\n`, so `.rstrip("\n")` or `.split()` them), `read()` for everything at once, `readline()` for one line (an empty string at end of stream, where `input()` would raise).

```python
import sys

for line in sys.stdin:                  # until EOF
    print(line.rstrip("\n").upper())

data = sys.stdin.read().split()         # every whitespace-separated token in the input
```

`sys.stdin.read().split()` is the fastest way to read a large input: one system call, one split, then walk the tokens with an index or an iterator. It is also the most forgiving, because it does not care how the numbers are arranged into lines.

## `print`

`print(*objects, sep=" ", end="\n", file=sys.stdout, flush=False)` converts each object with `str()`, joins them with `sep`, and appends `end`.

```python
print("a", 1, 2.5)             # a 1 2.5
print("a", "b", sep="")        # ab
print("x", end="")             # no newline
print(*[1, 2, 3])              # 1 2 3   — unpack the list into arguments
print(*[1, 2, 3], sep=", ")    # 1, 2, 3
print("error", file=sys.stderr)
```

`print(nums)` for a list prints its `repr` — `[1, 2, 3]`, brackets and all — which is almost never the format an exercise asks for. To print elements separated by spaces use `print(*nums)`; to build the line yourself use `" ".join(map(str, nums))`, which is also how you print a list of strings as lines: `print("\n".join(lines))`.

Output is buffered when it goes to a pipe or file rather than a terminal. That is invisible for a judged program, which is flushed when it exits; it matters only when a program prints and then crashes (the crash's traceback on stderr may appear *before* buffered stdout on a terminal) or prints progress you want to see immediately — `print(..., flush=True)` or `python -u` forces it out.

## Formatting numbers

The two formats every exercise needs are a fixed number of decimals and padding to a width, both spelled inside an f-string:

```python
avg = 2 / 3
print(f"{avg:.2f}")          # 0.67
print(f"{42:5d}|")           # "   42|"
print(f"{'ab':<5}|")         # "ab   |"
print(f"{1234567:,}")        # 1,234,567
```

Module 5 lesson 3 has the whole format-spec mini-language; `.2f` is the one you must not print a float without, because `print(0.1 + 0.2)` gives `0.30000000000000004` and the expected output will not.

## The five reading patterns

**1. One number, then that many lines.**

```python
n = int(input())
rows = [input() for _ in range(n)]
```

**2. A count and a line of values.**

```python
n = int(input())
nums = list(map(int, input().split()))      # n values (trust the count or check len(nums) == n)
```

**3. Lines until end of input.**

```python
import sys
lines = [line.rstrip("\n") for line in sys.stdin]
```

**4. Tokens regardless of line breaks.**

```python
import sys
tokens = sys.stdin.read().split()
it = iter(tokens)
n = int(next(it))
values = [int(next(it)) for _ in range(n)]
```

**5. Records with a fixed shape per line.**

```python
n = int(input())
items = []
for _ in range(n):
    name, qty, price = input().split()
    items.append((name, int(qty), float(price)))
```

Pattern 3 is the one for "process every line"; pattern 4 is the one for large inputs and for inputs whose line structure does not matter. Reading everything first and computing second keeps the logic separate from the I/O, which is the shape the reference solutions in this track keep.

## Pitfalls

- Forgetting that `input()` returns a string. `input() + 1` is a `TypeError`; `input() * 2` doubles the text.
- `print(list)` when the expected output is space-separated values.
- Reading one line when the values are spread over several, or vice versa: read the input format twice before writing the first line.
- A prompt in `input()`.
- Trailing whitespace is forgiven by the judge; a missing newline between lines is not. `print` adds it; `sys.stdout.write` does not.

## Key takeaways

- `input()` returns one line as a string without its newline; `EOFError` marks the end.
- `int(input())`, `list(map(int, input().split()))` and `for line in sys.stdin` cover almost every format; `sys.stdin.read().split()` for bulk tokens.
- `print` joins with `sep` and ends with `end`; `print(*items)` spreads a list; `"\n".join(lines)` prints many lines at once.
- Format floats with `:.2f`; never print a raw float.
- Never prompt, never print a container's `repr` unless asked.
