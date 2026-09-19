---
title: Regular expressions — the re module
minutes: 15
---
A regular expression describes a set of strings by a pattern — "one or more digits", "a word, a colon, then anything" — and the `re` module finds, extracts, replaces and splits by such patterns. It is the right tool when the format is more than one delimiter deep, when you need "the numbers anywhere in this text", or when validation is a shape rather than a value. It is the wrong tool for anything `split` or `startswith` can do, and for parsing nested structures. This lesson gives the syntax that covers most uses, the six functions, groups, flags, and the greedy-versus-lazy rule.

## The functions

```python
import re
text = "order 66 shipped 2024-05-01 to ada"

re.search(r"\d+", text)              # first match anywhere: <re.Match ... match='66'>
re.match(r"\w+", text)               # match only at the *start*: 'order'
re.fullmatch(r"\w+", "order")        # the whole string must match
re.findall(r"\d+", text)             # every match as a list: ['66', '2024', '05', '01']
re.finditer(r"\d+", text)            # every match as Match objects, lazily
re.sub(r"\d", "#", text)             # replace: 'order ## shipped ####-##-## to ada'
re.split(r"[\s-]+", text)            # split on a pattern
```

`search`, `match` and `fullmatch` return a `Match` object or `None` — always test before using it. `m.group()` is the matched text, `m.start()`/`m.end()` its position, `m.group(1)` the first parenthesised group. Patterns are written as raw strings (`r"..."`) so that backslashes reach the regex engine intact.

## The syntax

| Pattern | Matches |
| --- | --- |
| `.` | any character except newline |
| `\d` `\w` `\s` | digit, word character (letters, digits, `_`), whitespace |
| `\D` `\W` `\S` | the complements |
| `[abc]` `[a-z]` `[^0-9]` | a set, a range, a negated set |
| `^` `$` | start and end of the string (or line, with `re.M`) |
| `\b` | a word boundary |
| `x*` `x+` `x?` | zero or more, one or more, zero or one |
| `x{3}` `x{2,5}` `x{2,}` | exactly, between, at least |
| `a\|b` | alternation |
| `(...)` | a group: captures, and groups a quantifier |
| `(?:...)` | a non-capturing group |
| `(?P<name>...)` | a named group |
| `(?=...)` `(?!...)` | lookahead: followed by / not followed by, without consuming |
| `\.` `\(` `\\` | a literal special character |

```python
re.fullmatch(r"[A-Z]{3}-\d{4}", "ABC-1234")            # a plate
re.search(r"\b(\w+)\s+\1\b", "the the cat")            # a repeated word (\1 = group 1 again)
re.findall(r"[\w.]+@[\w.]+\.\w+", text)                # email-shaped things (not validation)
```

## Groups

```python
m = re.search(r"(\d{4})-(\d{2})-(\d{2})", text)
m.group(0)              # '2024-05-01' — the whole match
m.group(1), m.group(3)  # '2024', '01'
m.groups()              # ('2024', '05', '01')

m = re.search(r"(?P<year>\d{4})-(?P<month>\d{2})", text)
m.group("year")         # '2024'
m.groupdict()           # {'year': '2024', 'month': '05'}
```

`findall` returns the groups as tuples when the pattern has groups (and just group 1 when it has one), which surprises people who wanted the whole match — use `(?:...)` for grouping without capturing, or `finditer` and `m.group()`.

## Substitution

```python
re.sub(r"(\w+)@(\w+)", r"\2 at \1", "ada@example")        # 'example at ada' — backreferences
re.sub(r"\d+", lambda m: str(int(m.group()) * 2), "a1 b22")  # 'a2 b44' — a function per match
re.sub(r"\s+", " ", "  many   spaces  ").strip()            # 'many spaces'
```

The replacement string understands `\1` and `\g<name>`; a function receives the `Match` and returns the replacement, which is how a transformation (upper-casing, arithmetic) is applied to each match.

## Greedy and lazy

Quantifiers are greedy: they match as much as possible and back off only if the rest of the pattern fails. `<.*>` on `<a><b>` matches the *whole* string. Add `?` to make a quantifier lazy — `<.*?>` matches `<a>` — or, usually better, forbid the closing character in the set: `<[^>]*>`. The negated set is faster and clearer than laziness.

## Flags and compiling

```python
re.findall(r"^\w+", text, flags=re.M)       # ^ and $ per line
re.search(r"hello", "HELLO", re.I)          # ignore case
re.compile(r"""
    (?P<key>\w+)   # the key
    \s*=\s*
    (?P<val>.*)    # the value
""", re.X)                                  # verbose: whitespace and comments ignored
```

`re.compile(pattern)` returns a pattern object with the same methods (`p.search(s)`); the module functions cache recent patterns, so compiling is about readability and reuse, not speed, except in a tight loop. `re.S` (dotall) lets `.` match newlines.

## When not to use a regex

`s.startswith("x")`, `"," in s`, `s.split(",")`, `s.isdigit()` and `s.replace(a, b)` are each clearer and faster than the equivalent regex. Nested or balanced structure (matching brackets, HTML) is beyond regular languages; use a parser. Validation of real-world formats (emails, URLs) with a regex is a rough filter, never a proof. And a regex that took ten minutes to write will take the next reader ten minutes to read — the `re.X` flag with comments is the mitigation.

## Pitfalls

- Forgetting the `r` prefix and losing `\b` (backspace) or `\1`.
- Using the result of `search`/`match` without checking for `None`.
- `match` when `search` was meant — `match` anchors at the start.
- `findall` with groups returning tuples instead of whole matches.
- A greedy `.*` spanning far more than intended.
- Special characters unescaped: `.` matches anything, `+` quantifies; `re.escape(s)` escapes a literal.

## Key takeaways

- `search` finds anywhere, `match` at the start, `fullmatch` the whole; all return `Match` or `None` — test it.
- `findall`/`finditer` for all matches, `sub` (with backreferences or a function) to replace, `split` on a pattern.
- Groups capture with `(...)`, name with `(?P<n>...)`, skip capturing with `(?:...)`; `\1` refers back.
- Quantifiers are greedy; `?` makes them lazy; a negated set `[^>]*` is usually better than either.
- Raw strings always; flags `I`, `M`, `S`, `X`; prefer a string method when one does the job.
