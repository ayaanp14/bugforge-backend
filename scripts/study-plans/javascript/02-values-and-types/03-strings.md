---
title: Strings — immutable text, template literals and the method toolkit
minutes: 14
seo-title: JavaScript Strings: Template Literals, slice vs substring
description: JavaScript strings are immutable UTF-16 sequences. Template literals, slice vs substring vs substr, replace vs replaceAll, and why an emoji has length 2.
question: Are strings immutable in JavaScript?
answer: Yes. A JavaScript string is an immutable sequence of UTF-16 code units: every method that seems to change one, such as `toUpperCase`, `replace` or `trim`, returns a new string and leaves the original as it was, so you must assign the result — `s = s.toUpperCase()`. Immutability is also why strings compare by value with `===` and are safe to share and to use as object keys.
q: What is the difference between slice and substring in JavaScript?
a: Both return part of a string from a start index up to an exclusive end. `slice` accepts negative indexes that count from the end, so `s.slice(-3)` is the last three units, while `substring` turns negatives into 0 and swaps its arguments when start is greater than end. Prefer `slice`; `substr` is deprecated.
q: How do you replace all occurrences of a string in JavaScript?
a: Use `s.replaceAll("a", "b")` (ES2021) or `replace` with a regular expression that has the `g` flag. Plain `replace` with a string pattern replaces only the first occurrence, which is the trap people hit most often.
q: Why is the length of an emoji 2 in JavaScript?
a: `length` counts UTF-16 code units, not characters, and characters outside the Basic Multilingual Plane, such as most emoji, are stored as a surrogate pair of two units. Iterate with `for…of` or spread `[...s]` to work by code point; `split("")` breaks emoji apart.
q: How do you sort strings alphabetically in JavaScript?
a: Use `arr.sort((x, y) => x.localeCompare(y))`. The default sort and the `<` operator compare UTF-16 code units, so upper case sorts before lower case and `"10"` comes before `"9"`; `localeCompare` with `{ numeric: true }` also puts `"file10"` after `"file9"`.
q: What are template literals in JavaScript?
a: Template literals are strings written in backticks that interpolate any expression with `${…}` and may span several lines, keeping the newlines as written. A tag function placed before one makes a tagged template, which libraries use for SQL, GraphQL and styled components.
---
Strings are the most-used values in most programs, and JavaScript's are simple in shape — immutable sequences of UTF-16 code units — with a rich, mostly consistent method set. The things that go wrong are predictable: forgetting immutability (`s.toUpperCase()` with no assignment), confusing `slice` and `substring` and `substr`, treating `length` as a character count when emoji are present, and reaching for the wrong search method. This lesson is the toolkit, organised by what you want to do, with the traps marked.

## Literals and template literals

```js
const a = 'single', b = "double";                 // identical; pick one style (Prettier chooses double)
const t = `sum: ${1 + 2}, upper: ${a.toUpperCase()}`;   // template literal: any expression inside ${}
const multi = `line one
line two`;                                          // newlines are kept as written
const esc = "tab\tnewline\nquote\"backslash\\ unicodeé";
```

Template literals also allow **tagged templates** — `` tag`text ${x}` `` calls `tag` with the literal parts and values (used by libraries for SQL, GraphQL, styled components) — a topic for the strings module later. `String.raw` is one such tag that leaves escapes alone.

## Immutability

Every "modifying" method returns a new string; the original never changes.

```js
let s = "hello";
s.toUpperCase();            // returns "HELLO", s is still "hello"
s = s.toUpperCase();        // now s is "HELLO"
s[0] = "j";                 // ignored in sloppy mode; a TypeError in strict mode, modules and classes
```

Because they are immutable, strings are safe to share, compare by value with `===`, and use as object keys; and building a long string in a loop with `+=` is fine in modern engines (they use ropes internally), unlike Java — `array.join` is still clearer for many pieces.

## Indexing, length and Unicode

`s.length` counts **UTF-16 code units**, `s[i]` and `s.charAt(i)` read one unit, `s.at(-1)` reads from the end (2022). Characters outside the Basic Multilingual Plane — emoji, some CJK, mathematical symbols — take **two** units:

```js
"héllo".length        // 5
"😀".length           // 2  — one character, two code units (a surrogate pair)
[..."😀a"].length     // 2  — spreading iterates by code point
"😀".codePointAt(0)   // 128512
String.fromCodePoint(128512)   // "😀"
```

Iterate with `for (const ch of s)` or `[...s]` when characters matter; `s.split("")` splits by unit and corrupts emoji. `normalize("NFC")` before comparing text that may contain composed versus decomposed accents.

## The toolkit, by task

**Search**

```js
s.includes("lo")           // boolean
s.indexOf("l"), s.lastIndexOf("l")   // -1 when absent
s.startsWith("he"), s.endsWith("lo")
s.search(/l+/)             // regex, index or -1
s.match(/l/g)              // ["l", "l"] or null;   s.matchAll(/l/g) for iterator with groups
```

**Slice**

```js
s.slice(1, 3)      // "el"   — end exclusive; negatives count from the end: s.slice(-3) === "llo"
s.substring(1, 3)  // "el"   — swaps arguments if start > end; negatives become 0 — prefer slice
s.substr(1, 2)     // deprecated (start, length) — do not use
```

**Transform**

```js
s.toUpperCase(), s.toLowerCase()         // toLocaleUpperCase for locale rules
s.trim(), s.trimStart(), s.trimEnd()
s.padStart(8, "0"), s.padEnd(8)          // "000hello"
s.repeat(3)
s.replace("l", "L")                      // FIRST occurrence only when given a string
s.replaceAll("l", "L")                   // every occurrence (2021); or s.replace(/l/g, "L")
s.split(","), s.split(/\s+/), s.split("", 3)
"a,b".concat("!")                        // same as + ; rarely used
```

The `replace`-with-a-string-replaces-once rule is the trap people hit weekly; `replaceAll` or a `/g` regex is the fix. In the replacement string `$&` is the match and `$1` a group; a function replacer `(match, g1) => …` computes the replacement.

**Compare**

```js
"a" < "b"                        // true — code unit order; "Z" < "a" is true, "10" < "9" is true
"ä".localeCompare("z", "de")     // -1: locale-aware order for sorting user-visible text
arr.sort((x, y) => x.localeCompare(y))
```

Default `<`/`>` on strings compares code units, so upper case sorts before lower case and digit strings compare lexically. For human-facing sort use `localeCompare`, optionally with `{ numeric: true }` to make `"file10"` follow `"file9"`.

## Conversions

`String(x)` handles every value (`String(null)` is `"null"`, `String([1,2])` is `"1,2"`, `String({})` is `"[object Object]"`); `x.toString()` fails on `null`/`undefined`; `` `${x}` `` is `String(x)`; `JSON.stringify(x)` gives a JSON encoding (quotes around strings, `"[1,2]"` for arrays). Number to string with a radix: `(255).toString(16)` is `"ff"`. String to number: previous lesson.

## Building strings

For a few pieces, template literals. For many pieces in a loop, either `+=` (fine in V8) or push to an array and `join` — the join form makes the separator explicit and avoids the trailing-separator problem. `Array(n).fill("-").join("")` or `"-".repeat(n)` for runs.

## Interview angle

- *"Are strings mutable?"* No — every method returns a new string; assign the result.
- *"`slice` versus `substring` versus `substr`?"* `slice` supports negatives and is the one to use; `substring` swaps and clamps; `substr` is deprecated.
- *"Why is `\"😀\".length` 2?"* UTF-16 code units; a surrogate pair. Iterate with `for…of` or spread for code points.
- *"How do you replace all occurrences?"* `replaceAll` or `replace` with a `/g` regex — plain `replace(string)` does one.
- *"Why does `[\"b\", \"a\", \"B\"].sort()` put `B` first?"* Code-unit order; use `localeCompare` for human sorting.

## Key takeaways

- Immutable UTF-16 sequences; template literals interpolate any expression.
- `length`/indexing count code units; emoji are two; `for…of`/spread iterate characters.
- `slice` (negatives ok), never `substr`; `includes`/`startsWith`/`indexOf` to search; `replaceAll` for every match.
- `<` compares code units; `localeCompare` for people; `{ numeric: true }` for `file10`.
- `String(x)` converts anything; `join` an array for many pieces.
