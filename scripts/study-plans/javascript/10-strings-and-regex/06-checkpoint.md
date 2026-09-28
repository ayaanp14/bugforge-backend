---
title: Checkpoint — Strings, Unicode, regular expressions and parsing
minutes: 25
seo-title: JavaScript Regex and Unicode Strings Quiz: Practice Test
description: Test your JavaScript strings with 12 questions and three programs on UTF-16 and Unicode, string methods, Intl, regex flags and groups, lookarounds and parsing.
q: Can toUpperCase change the length of a string in JavaScript?
a: Yes. Case mapping is Unicode-aware, so `"straße".toUpperCase()` returns `"STRASSE"`, one character longer. It is also locale-independent: Turkish text needs `toLocaleUpperCase("tr")` to turn `i` into a dotted capital `İ`.
q: Why are nested regex quantifiers dangerous?
a: A pattern that repeats a group whose parts can match the same text, such as a word followed by optional whitespace, repeated, gives the engine exponentially many ways to split a failing input, so matching time doubles with each extra character. That catastrophic backtracking lets one crafted request pin a CPU; rewrite the pattern so each repetition consumes something unambiguous.
q: Where does operator precedence live in a recursive-descent parser?
a: In the structure of the grammar, not in the order of `if` statements: the lowest-precedence rule sits at the top and calls the next rule for its operands, so `expr` handles `+` and `-` by calling `term`, which handles `*` and `/` by calling `factor`. Deeper rules bind tighter.
---
This checkpoint covers UTF-16 code units versus code points versus grapheme clusters, normalisation, case mapping and locale-aware comparison; the string toolbox, template literals, tagged templates and `Intl` formatting; regular-expression syntax, flags, groups, the five methods and `lastIndex`; lookarounds, Unicode property escapes, escaping input and catastrophic backtracking; and hand-written parsing with sticky tokenizers, recursive descent and CSV quoting.

**How it works.** Twelve questions and three programs; 70% on the questions and every program accepted clears the module.

**Before you start**, make sure you can answer:

- Why `"😀".length` is 2; how to count code points and graphemes; what `normalize("NFC")` fixes; how `toUpperCase` can change length.
- `slice` versus `substring`; what `"".split(",")` returns; what a tag function receives; why `Intl` formatters are created once.
- Which flag makes `test` stateful; greedy versus lazy versus a negated class; how to get every match with groups.
- What a lookahead is; why `(\w+\s?)*` is dangerous; how to escape user input for `new RegExp`.
- Why the sticky flag suits tokenizers; where precedence lives in a recursive-descent parser; why `split(",")` cannot parse CSV.

The programs are a Unicode-aware word-statistics tool, a template renderer with filters and conditionals built on `replace` with a function, and an expression evaluator with variables, a sticky tokenizer and positioned errors.
