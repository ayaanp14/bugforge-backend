---
title: Text-processing tools — textwrap, difflib, string.Template and re in depth
minutes: 14
---
Beyond the string methods and the regular-expression basics of Module 5, the standard library has a second tier of text tools that turn common jobs into a call: wrapping and indenting paragraphs, computing what changed between two versions, fuzzy-matching a typed name against the valid ones, filling templates safely, and the parts of `re` — named groups, lookarounds, `sub` with a function, `VERBOSE` — that make a regex readable. This lesson covers `textwrap`, `difflib`, `string.Template` and `unicodedata`, then the regex features in depth.

## textwrap

```python
import textwrap

text = "The quick brown fox jumps over the lazy dog and keeps running."
textwrap.wrap(text, width=20)          # ['The quick brown fox', 'jumps over the lazy', 'dog and keeps', 'running.']
print(textwrap.fill(text, width=20))   # the same, joined with newlines
textwrap.shorten(text, width=25, placeholder="…")   # 'The quick brown fox…'
textwrap.indent("a\nb", "> ")          # '> a\n> b'
textwrap.dedent("""\
    def f():
        pass
""")                                   # removes the common leading whitespace — for code in triple-quoted strings
```

`wrap` breaks on whitespace and never splits a word unless it exceeds the width (`break_long_words=False` to forbid even that); `initial_indent`/`subsequent_indent` make hanging paragraphs. `dedent` is the fix for indented multi-line strings inside functions.

## difflib

```python
import difflib

a = "the cat sat on the mat".split()
b = "the cat lay on a mat".split()
difflib.SequenceMatcher(None, a, b).ratio()           # 0.8333… similarity in [0, 1]
for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b).get_opcodes():
    print(tag, a[i1:i2], b[j1:j2])                    # equal / replace / delete / insert with the slices
list(difflib.unified_diff(old_lines, new_lines, lineterm=""))   # a patch-style diff, like `diff -u`
difflib.get_close_matches("appel", ["apple", "ample", "apply"], n=2, cutoff=0.6)   # ['apple', 'apply']
```

`SequenceMatcher` works on any sequences (characters, words, lines) and its `ratio` is the standard "how similar" number; `get_close_matches` is the "did you mean?" helper; `unified_diff` and `ndiff` render changes for humans. `HtmlDiff` produces a side-by-side table.

## string.Template

```python
from string import Template

t = Template("Hello, $name! You owe $$${amount}.")
t.substitute(name="Ada", amount="12.50")         # 'Hello, Ada! You owe $12.50.'
t.safe_substitute(name="Ada")                     # leaves $amount in place instead of raising KeyError
```

`$identifier` placeholders and `$$` for a literal dollar — deliberately less powerful than f-strings and `str.format`, which is the point when the template comes from a user or a file: it cannot call methods or read attributes, so it cannot be abused. `string` also holds `ascii_letters`, `digits`, `punctuation`, `whitespace` and `capwords`.

## unicodedata

```python
import unicodedata

unicodedata.normalize("NFC", s)        # compose accents (compare and store in this form)
unicodedata.normalize("NFKD", "ﬁ")     # 'fi' — compatibility decomposition
unicodedata.name("€")                  # 'EURO SIGN'
unicodedata.category("A")              # 'Lu' — letter, uppercase
"".join(c for c in unicodedata.normalize("NFKD", "café") if not unicodedata.combining(c))   # 'cafe'
```

The last line strips accents — the usual step before slugifying or comparing names loosely (Module 5).

## re in depth

**Named groups and groupdict.**

```python
m = re.search(r"(?P<key>\w+)\s*=\s*(?P<value>.*)", "port = 8080")
m["key"], m["value"], m.groupdict()          # 'port', '8080', {'key': 'port', 'value': '8080'}
```

**Lookarounds** assert without consuming:

```python
re.findall(r"\d+(?= kg)", "5 kg, 12 lb, 7 kg")       # ['5', '7'] — followed by " kg"
re.findall(r"(?<=\$)\d+", "cost $40 or $55")          # ['40', '55'] — preceded by "$"
re.sub(r"(?<!\d)0+(?=\d)", "", "007 and 0042")        # '7 and 42' — strip leading zeros
re.findall(r"\b(?!the\b)\w+", "the cat the dog")      # words that are not "the"
```

`(?=…)` positive lookahead, `(?!…)` negative lookahead, `(?<=…)` positive lookbehind (fixed width), `(?<!…)` negative lookbehind. They let a pattern match *at a position* without including the context in the match — the tool for "a number followed by a unit, but only the number".

**sub with a function** transforms each match:

```python
re.sub(r"\d+", lambda m: str(int(m.group()) * 2), "a1 b22")      # 'a2 b44'
re.sub(r"\b(\w)(\w*)", lambda m: m.group(1).upper() + m.group(2), "hello big world")   # title-case by regex
```

**VERBOSE** makes a long pattern readable:

```python
DATE = re.compile(r"""
    (?P<year>\d{4}) -      # year
    (?P<month>\d{2}) -     # month
    (?P<day>\d{2})         # day
""", re.VERBOSE)
```

Whitespace and `#` comments are ignored in the pattern (escape a literal space as `\ ` or `[ ]`).

**Other tools.** `re.split(r"[,;]\s*", text)` splits on a pattern; `re.finditer` yields `Match` objects with `.start()`/`.end()`/`.span()`; `re.escape(s)` quotes a literal for use inside a pattern; `re.fullmatch` for validation; `re.compile(...).pattern` and `.flags` for introspection; `(?i)` inline flags; non-greedy `*?`/`+?`/`??`; `{n,m}?`.

**Backreferences** `\1` and `(?P=name)` match a repeat of a group: `r"(\w+) \1"` finds a doubled word.

## Choosing between them

The string methods stay the first choice: `split`, `partition`, `startswith`, `replace` and `strip` are faster and clearer than any regex for a fixed delimiter or prefix. A regex earns its place when the *shape* matters — digits followed by a unit, a key with optional spaces around `=`, several alternatives at once — and `re.VERBOSE` with comments keeps such a pattern maintainable. `difflib` is for comparing and suggesting, `textwrap` for presenting, `Template` for text that came from outside; none of them is a substitute for a parser when the input has nested structure.

## Pitfalls

- `textwrap.wrap` on text with existing newlines — it treats them as spaces unless `replace_whitespace=False`.
- Using `ratio()` thresholds without `cutoff` in `get_close_matches`.
- `Template.substitute` raising `KeyError` for a missing placeholder when `safe_substitute` was wanted.
- Variable-width lookbehind (`(?<=\d+)`) — not allowed; fixed width only.
- `re.VERBOSE` swallowing a significant space in the pattern.
- Forgetting `re.escape` when building a pattern from user text.

## Key takeaways

- `textwrap`: `wrap`, `fill`, `shorten`, `indent`, `dedent`; `difflib`: `SequenceMatcher.ratio`, `get_opcodes`, `unified_diff`, `get_close_matches`.
- `string.Template` for user-supplied templates; `unicodedata` for normalisation and accent stripping.
- Named groups with `groupdict`; lookarounds assert context without consuming; `sub` with a function transforms matches.
- `re.VERBOSE` for readable patterns; `re.escape` for literals; backreferences for repeats.
- Reach for these before writing a wrapper, a diff or a fuzzy match by hand.
