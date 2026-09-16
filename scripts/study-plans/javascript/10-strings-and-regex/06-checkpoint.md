---
title: Checkpoint — Strings, Unicode, regular expressions and parsing
minutes: 25
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
