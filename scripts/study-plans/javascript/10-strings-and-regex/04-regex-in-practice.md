---
title: Regex in practice — lookarounds, Unicode properties, escaping input, ReDoS, and knowing when to stop
minutes: 13
---
The syntax lesson makes regexes *possible*; this one makes them *safe and useful*. Lookarounds let you assert context without consuming it (thousands separators, password rules, "a word not followed by…"); Unicode property escapes replace `[A-Za-z]` with something that works for every language; a function replacer turns `replace` into a small compiler. Then the two hazards every production regex must be checked for: user input pasted into a pattern (escape it), and **catastrophic backtracking** — patterns that take seconds or hours on a crafted input and can knock a server over. The lesson ends with the honest list of things a regex should not be asked to do.

## Lookarounds

```
(?=…)   positive lookahead:  x(?=y) matches x only if y follows      — not consumed
(?!…)   negative lookahead:  x(?!y) matches x only if y does NOT follow
(?<=…)  positive lookbehind: (?<=y)x matches x only if y precedes    — ES2018, Node 9+
(?<!…)  negative lookbehind
```

```js
"1234567".replace(/\B(?=(\d{3})+(?!\d))/g, ",");           // "1,234,567" — insert a comma before each group of three at a non-boundary
/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(pw);          // password: at least one digit, lower, upper, 8+ chars — independent lookaheads
"price: $42, cost: $7".match(/(?<=\$)\d+/g);               // ["42", "7"] — digits preceded by $, without capturing the $
"foo.js foo.test.js".match(/\b\w+(?<!\.test)\.js\b/g);     // files ending .js but not .test.js
```

Lookarounds are zero-width: they check and do not advance. Multiple lookaheads at the start of a pattern express "all of these must hold somewhere" — the standard shape for validation rules. Lookbehind must have a bounded length in some engines; V8 allows variable length.

## Unicode property escapes (with `u`)

```js
/\p{L}+/gu                    // letters in any script — "café", "日本語", "Ελληνικά"
/\p{Lu}/u  /\p{Ll}/u          // uppercase / lowercase letters
/\p{N}/u   /\p{Nd}/u          // any numeric / decimal digits (incl. non-ASCII digits)
/\p{Script=Han}/u             // a specific script
/\p{Emoji_Presentation}/u     // emoji shown as pictures (approximately — emoji is a rabbit hole)
/[\p{L}\p{M}]+/u              // letters plus combining marks — a "word" that survives decomposed accents
```

`\w`, `\d`, `\b` stay ASCII even with `u`. For "a word" in user text, `[\p{L}\p{M}\p{N}_]+` with `u` is the honest replacement; for splitting into words in any language, `Intl.Segmenter` (lesson 1) is better still.

## `replace` with a function — a small compiler

```js
const vars = { name: "Ada", n: 3 };
"Hi {{name}}, you have {{n}} items {{missing}}".replace(/\{\{(\w+)\}\}/g, (_, key) => (key in vars ? String(vars[key]) : `{{${key}}}`));
// "Hi Ada, you have 3 items {{missing}}"

text.replace(/\b(\w)(\w*)\b/g, (_, first, rest) => first.toUpperCase() + rest);   // title case (ASCII)
csv.replace(/"((?:[^"]|"")*)"/g, (_, inner) => inner.replace(/""/g, '"'));         // unquote CSV fields
```

The callback receives `(match, ...groups, offset, input, namedGroups)` and returns the replacement text; `$` sequences are **not** interpreted in its return value, which is exactly why it is the safe form for replacement text that comes from data.

## Escaping user input

```js
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const re = new RegExp(`\\b${escapeRegExp(query)}\\b`, "iu");
```

Any string from outside placed into `new RegExp` must be escaped, or `.` matches anything, `(` throws a `SyntaxError`, and `(a+)+$` (below) takes the server down. `RegExp.escape` is a 2025 addition; on Node 16 the one-liner above is the standard.

## Catastrophic backtracking (ReDoS)

```js
/^(\w+\s?)*$/.test("a ".repeat(30) + "!");     // seconds; each extra character doubles the time
/(a+)+b/.test("a".repeat(40));                  // same disease
```

When a pattern has **nested quantifiers**, or **adjacent quantified parts that can match the same text** (`\w+\s?` repeated: is `"ab"` one `\w+` or two?), a failing match makes the engine try every way to split the input — exponential time. A single request with a 40-character string can pin a CPU for minutes: a denial-of-service with one HTTP call. Rules:

- No nested quantifiers over overlapping parts: `(\w+\s?)*` → `\w+(\s\w+)*` or `(\w+\s)*\w+` — make each repetition **consume something unambiguous**.
- Prefer negated classes to `.*`: `"[^"]*"` cannot backtrack across a quote.
- Anchor patterns (`^…$`) so failure is detected early rather than retried at every start position.
- Bound repetition where the format allows (`\d{1,5}` not `\d+`).
- Test suspicious patterns against long adversarial strings; tools (`safe-regex`, `recheck`) flag the classic shapes.
- Keep regexes that run on **untrusted input** simple; validate length first (`if (s.length > 200) reject`).

## Common patterns, pragmatically

| Need | Pattern | Note |
| --- | --- | --- |
| Integer | `^-?\d+$` | `Number.isInteger(Number(s))` is often clearer |
| Decimal | `^-?\d+(\.\d+)?$` | |
| Hex colour | `^#(?:[0-9a-f]{3}){1,2}$` with `i` | |
| ISO date | `^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$` | validates shape, not calendar — `Date` for that |
| IPv4 | `^(?:(?:25[0-5]\|2[0-4]\d\|1?\d?\d)\.){3}(?:25[0-5]\|2[0-4]\d\|1?\d?\d)$` | |
| Email | `^[^\s@]+@[^\s@]+\.[^\s@]+$` | deliberately loose — the RFC grammar is not worth encoding; send a confirmation mail |
| Slug | `^[a-z0-9]+(?:-[a-z0-9]+)*$` | |
| Trim internal spaces | `replace(/\s+/g, " ")` | |

Validation regexes answer "does this look right"; a parser or the real API (`new URL(s)`, `Date`) answers "is it right".

## When a regex is the wrong tool

- **HTML/XML**: nested, contextual — use a parser (browsers have `DOMParser`; Node has `cheerio`/`parse5`). `/<b>(.*?)<\/b>/` breaks on attributes, nesting, whitespace and comments.
- **JSON**: `JSON.parse`. **URLs**: `new URL`. **Dates**: a date library or `Date` with a fixed format.
- **Programming languages / templates with nesting**: a tokenizer plus a recursive-descent parser (next lesson).
- **Anything you cannot explain in one sentence**: split it into two passes or write the loop.

The sticky flag makes regexes excellent **tokenizers** — one anchored alternation of token patterns advanced by `lastIndex` — and that is the right division of labour: regex for the tokens, code for the structure.

## Common mistakes

- Unescaped user input in `new RegExp`.
- `(\w+\s?)*`-shaped patterns on request data.
- `\w` for "letters" in international text; `[A-Za-z]` in a product used outside one language.
- A 300-character email regex that rejects valid addresses and accepts invalid ones.
- Parsing HTML with regex; extracting balanced parentheses with regex (impossible in general).
- `$1` in a replacement string when the replacement comes from data (use a function).

## Interview angle

- *"What is a lookahead?"* A zero-width assertion that the following text matches (or, negative, does not) without consuming it.
- *"How do you insert thousands separators with a regex?"* `\B(?=(\d{3})+(?!\d))` → `,`.
- *"What is catastrophic backtracking?"* Exponential matching time from nested or overlapping quantifiers on a failing input — a DoS vector; fix by making repetitions unambiguous.
- *"How do you safely build a regex from user input?"* Escape metacharacters first.
- *"Should you parse HTML with regex?"* No — nesting and context need a parser; regex for tokens only.

## Key takeaways

- Lookarounds assert context without consuming: `(?=)` `(?!)` `(?<=)` `(?<!)`; stack lookaheads for multi-rule validation.
- `\p{L}`/`\p{N}` with `u` for international text; `\w`/`\b` stay ASCII.
- `replace` with a function is a mini compiler and the safe form for data-driven replacements; escape input before `new RegExp`.
- ReDoS: no nested/overlapping quantifiers, negated classes over `.*`, anchors, bounded repeats, length checks on untrusted input.
- Regex for tokens and shapes; parsers for structure (HTML, JSON, URLs, languages).
