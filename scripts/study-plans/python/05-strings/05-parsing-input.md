---
title: Parsing input — from lines and tokens to values
minutes: 14
---
Input arrives as text and the program needs values, and everything between is parsing. Most of it is three methods — `split`, `strip`, `partition` — plus `int` and `float` with `ValueError` caught, arranged into a handful of shapes: tokens on a line, delimited fields, `key=value` pairs, a count followed by records, blocks separated by blank lines, and the occasional format that needs a small hand-written scanner. This lesson gives each shape a template, states the validation rule (convert strictly, reject clearly), and shows where the bulk-read idiom `sys.stdin.read().split()` beats reading line by line.

## Tokens on a line

```python
nums = list(map(int, input().split()))
a, b = map(int, input().split())        # exactly two — ValueError otherwise
first, *rest = input().split()          # at least one
```

`split()` without an argument handles any amount of whitespace and drops the ends. The unpacking forms are also validation: the wrong number of tokens raises `ValueError: not enough values to unpack` or `too many values`, which is the right failure for malformed input.

## Delimited fields

```python
line = "ada, 36, london"
name, age, city = [f.strip() for f in line.split(",")]
```

`split(",")` keeps empty fields, so `"a,,c"` has three; strip each field, because `", "` after a comma is common. When fields can contain the delimiter (quoted CSV), do not split by hand — the `csv` module (Module 14) handles quoting. A fixed number of fields can be unpacked; a variable number stays a list.

## key=value pairs

```python
settings = {}
for tok in "host=db port=5432 debug".split():
    key, sep, value = tok.partition("=")
    settings[key] = value if sep else True
```

`partition` splits at the *first* separator and returns three parts, with an empty separator when it is absent — so a `value` containing `=` survives (`"a=b=c"` → `("a", "=", "b=c")`), and a bare flag is detected by `sep` being empty. `split("=", 1)` is the two-element alternative but raises on unpacking when the separator is missing.

## A count, then records

```python
n = int(input())
rows = []
for _ in range(n):
    name, qty, price = input().split()
    rows.append((name, int(qty), float(price)))
```

Convert as you read so that a bad line fails at the line, not later in the middle of a calculation. When the count line is absent and the records run to the end of input, `for line in sys.stdin` replaces the `range`.

## Blocks separated by blank lines

```python
import sys
text = sys.stdin.read()
blocks = [b.splitlines() for b in text.strip().split("\n\n") if b.strip()]
```

Read everything, split on the double newline, then split each block into lines. `strip()` on the whole text first avoids a leading or trailing empty block. A variant, one record per block with `key: value` lines, is `dict(line.split(": ", 1) for line in block)`.

## Bulk tokens

```python
import sys
data = sys.stdin.read().split()
it = iter(data)
n = int(next(it))
values = [int(next(it)) for _ in range(n)]
```

When the input is large — tens of thousands of numbers — reading it in one call and walking an iterator is several times faster than `input()` per line, and it does not care how the numbers are wrapped across lines. `next(it)` raises `StopIteration` if the data runs out, which a wrapper can turn into a clear message. Module 20 uses this as the interview template.

## Validating

Convert strictly and catch the failure at the point of conversion:

```python
def parse_age(tok):
    try:
        age = int(tok)
    except ValueError:
        raise ValueError(f"age must be an integer, got {tok!r}") from None
    if not 0 <= age <= 150:
        raise ValueError(f"age out of range: {age}")
    return age
```

Two rules. Do not pre-check with `isdigit` — it rejects `-5` and accepts `²`; `int()` is the definition of "parses as an integer". And do not let a bad value through as `0` or `None` silently — either raise, or record the failure and report it (`bad lines: 3`), depending on what the program is for. In a judged exercise the prompt says which; "print `invalid` and continue" is the common contract.

## A hand-written scanner

Some formats are neither tokens nor fields: a number followed directly by a unit (`12kg`), an expression without spaces (`3+4*2`), a run-length code (`a3b2`). The tool is an index walked by hand, reading a run of characters of one class at a time:

```python
def scan_number_and_unit(s):
    i = 0
    while i < len(s) and (s[i].isdigit() or s[i] == "."):
        i += 1
    return float(s[:i]), s[i:].strip()

def run_length_decode(code):
    out, i = [], 0
    while i < len(code):
        ch = code[i]
        i += 1
        j = i
        while j < len(code) and code[j].isdigit():
            j += 1
        out.append(ch * int(code[i:j]))
        i = j
    return "".join(out)
```

The shape is always: a position `i`; a loop that advances `i` past one lexical unit; the slice `s[start:i]` as the token. Regular expressions (next lesson) express the same thing declaratively and are the better tool once the format has more than two token kinds.

## Pitfalls

- `split(" ")` for whitespace tokens — it keeps empties between double spaces.
- Forgetting to `strip()` fields after `split(",")`.
- `int(line)` where `line` came from `sys.stdin` iteration and still has `\n` — actually fine (`int` tolerates whitespace), but `line == "END"` is not; compare against `line.rstrip("\n")`.
- Reading `n` and then reading `n` *tokens* on one line with `input()` per token — `input()` reads a *line*.
- Checking `isdigit()` before `int()`.
- Silent defaults for unparsable values.

## Key takeaways

- `split()` for whitespace tokens, `split(sep)` for fields (strip each), `partition` for `key=value`.
- Unpacking validates token counts; `int`/`float` validate values — catch `ValueError`, never pre-check with `isdigit`.
- Count-then-records with `range(n)`; records to the end with `for line in sys.stdin`; blocks with `read().split("\n\n")`.
- `sys.stdin.read().split()` plus an iterator is the fast bulk reader.
- A hand scanner is an index advanced past one token class at a time; regexes take over when the grammar grows.
