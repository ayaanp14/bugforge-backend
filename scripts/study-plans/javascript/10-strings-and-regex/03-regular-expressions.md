---
title: Regular expressions — syntax, flags, groups and the five methods
minutes: 14
---
A regular expression is a small program for matching text, and JavaScript's engine is a good one: full backtracking, lookaround, named groups, Unicode. The syntax is dense but finite; this lesson covers all of it that matters — literals and the constructor, the seven flags, character classes and quantifiers, greedy versus lazy, anchors and boundaries, capturing/non-capturing/named groups, alternation and backreferences — then the five methods you call (`test`, `exec`, `match`, `matchAll`, `replace`) and the one stateful trap (`lastIndex` with the `g` flag) that has cost everyone an afternoon.

## Creating a regex

```js
const re1 = /\d+/g;                          // literal — compiled once when the code loads
const re2 = new RegExp("\\d+", "g");         // constructor — for patterns built at runtime; note the doubled backslash
const re3 = new RegExp(`^${escapeRegExp(userText)}$`, "i");   // user input MUST be escaped (lesson 4)
```

A regex object holds the pattern, the flags and, for `g`/`y`, a `lastIndex`. Literals inside a function are recreated per evaluation cheaply (engines cache compiled patterns); hoist them only for clarity.

## Flags

| Flag | Name | Effect |
| --- | --- | --- |
| `g` | global | find all matches; makes `test`/`exec` stateful via `lastIndex`; required by `matchAll` and `replaceAll` |
| `i` | ignore case | case-insensitive (Unicode-aware with `u`) |
| `m` | multiline | `^`/`$` match at line starts/ends, not only string ends |
| `s` | dotAll | `.` matches newlines too |
| `u` | unicode | pattern works in code points: `.` matches an emoji, `\u{1F600}` and `\p{…}` work, case folding is correct — **use it on any Unicode text** |
| `y` | sticky | match only at exactly `lastIndex` — tokenizers |
| `d` | indices | `exec` results carry `.indices` with start/end of each group (Node 16+) |

## Atoms: what a position can match

```
.            any char except line terminators (all with s)
\d \w \s     digit [0-9]; word [A-Za-z0-9_]; whitespace     \D \W \S  their complements
[abc] [a-z] [^0-9]     a set, a range, a negated set; inside [] most metachars are literal, escape ] \ ^ -
\p{L} \p{Lu} \p{Script=Greek} \P{N}    Unicode properties — letters, uppercase letters, a script, non-numbers (needs u)
\b \B        word boundary / non-boundary (between \w and \W); ASCII-based even with u
^ $          start/end of input (of line with m)
\t \n \r é \u{1F600} \x41 \0      escapes; \. \* \( etc. escape metacharacters
```

`\w` and `\b` are ASCII: `\w` does not match `é`. For letters in any language use `\p{L}` with `u`.

## Quantifiers

```
a*  a+  a?  a{3}  a{2,5}  a{2,}      zero+, one+, optional, exactly, range, at least — all GREEDY (take as much as possible, give back on failure)
a*?  a+?  a??  a{2,5}?               LAZY — take as little as possible, extend on failure
```

Greedy `<.+>` on `<a><b>` matches the whole thing; lazy `<.+?>` matches `<a>`. Neither is "correct" — the negated class `<[^>]+>` is usually what you meant, and it never backtracks across a `>`. Prefer a negated class or a specific class over `.*?` when you can name what must not appear.

## Groups

```
(abc)          capturing: numbered left to right by opening parenthesis; $1, m[1]
(?:abc)        non-capturing: grouping only — use for alternation and quantifiers you do not need to extract
(?<year>\d{4}) named: m.groups.year, $<year> in replacements, \k<year> to backreference
(a|b|cd)       alternation — tries left to right; order matters when alternatives overlap (put longer first)
\1  \k<name>   backreference: match the same text again — (\w)\1 finds doubled letters; (['"]).*?\1 a quoted string with matching quotes
```

A group inside a quantifier captures the **last** iteration only (`(\d,)+` on `1,2,3,` captures `3,`). Use `matchAll` for all of them.

## The five methods (and two more)

```js
const re = /(?<key>\w+)=(?<val>\d+)/g;
const text = "a=1 b=22 c=333";

re.test(text);                 // true — with g, advances lastIndex! see below
re.exec(text);                 // one match: ["a=1", "a", "1", index: 0, input, groups: { key: "a", val: "1" }] — call again for the next with g
text.match(re);                // with g: ["a=1", "b=22", "c=333"] — full matches only, no groups; without g: same shape as exec
[...text.matchAll(re)];        // every match WITH groups and indices; requires g; the modern way to iterate
text.replace(re, "$<key>:$<val>");            // "a:1 b:22 c:333" — $1 $<name> $& (whole) $` $' (before/after) $$ (dollar)
text.replace(re, (m, key, val, offset, whole, groups) => `${key}(${val.length})`);   // a function gets every part
text.replaceAll(re, …);                       // same with g required; string patterns replace every occurrence
text.split(/\s+/);  text.search(/\d/);        // split on a pattern; index of the first match or -1
```

Prefer `matchAll` for extraction, `replace` with a function for transformation, `test` for yes/no. `exec` in a `while` loop is the pre-2020 form of `matchAll`.

## The `lastIndex` trap

A regex with `g` or `y` remembers where the last match ended in `lastIndex`, and `test`/`exec` start from there:

```js
const re = /a/g;
re.test("a");    // true  — lastIndex is now 1
re.test("a");    // false — starts at 1, finds nothing, resets lastIndex to 0
```

Reusing one global regex for `test` across different strings gives alternating results — the classic "works every other time" bug. Fixes: do not put `g` on a regex you only `test`; or create the regex inside the function; or reset `re.lastIndex = 0` before each use. `match`, `matchAll`, `replace` and `split` handle `lastIndex` themselves.

## Reading a pattern aloud

`^(?<user>[\w.+-]+)@(?<host>[\w-]+(?:\.[\w-]+)+)$` — "start; a name of word chars, dots, plus or minus; an at sign; a host of one or more dot-separated labels; end." Naming the groups and writing the regex on several lines (in a comment, or via `new RegExp` with a template literal and stripped whitespace) turns a wall of punctuation into something a reviewer can check.

## Common mistakes

- Forgetting to escape `.` (`\d+.\d+` matches `1x2`), `+`, `?`, `(`, `[`, `\` (doubled in strings).
- `.*` greedy across the whole line when a negated class was meant; `.` not matching newlines without `s`.
- `\w`/`\b` on non-ASCII text; no `u` flag on Unicode text.
- A global regex reused with `test`; `match` with `g` when you needed groups (use `matchAll`).
- Capturing when you only needed grouping — `(?:…)` — and then miscounting `$n`.
- Alternation order: `/a|ab/` on `ab` matches just `a`.

## Interview angle

- *"Greedy versus lazy?"* Greedy takes the maximum and backtracks; lazy takes the minimum and extends; a negated class is often better than either.
- *"What does the `g` flag change?"* All matches for `match`/`replace`; `matchAll`/`replaceAll` require it; `test`/`exec` become stateful through `lastIndex`.
- *"Named groups?"* `(?<name>…)`, read as `m.groups.name`, replaced as `$<name>`, backreferenced as `\k<name>`.
- *"How do you get all matches with their groups?"* `for (const m of str.matchAll(re))` (regex needs `g`).
- *"Why use the `u` flag?"* Code-point semantics: `.` and classes match astral characters, `\p{…}` works, case-insensitivity is correct.

## Key takeaways

- Literal for fixed patterns, `new RegExp` (escaped) for dynamic ones; flags `g i m s u y d`; `u` on Unicode text.
- Classes, `\p{L}`, anchors, greedy/lazy quantifiers — prefer negated classes to `.*?`.
- Groups: capturing, `(?:…)`, `(?<name>…)`; alternation tries left to right; backreferences `\1`/`\k<name>`.
- `test` (yes/no), `matchAll` (extract), `replace` with `$<name>` or a function (transform), `split`, `search`.
- `g`/`y` make `test`/`exec` stateful via `lastIndex` — never reuse a global regex for `test` across strings.
