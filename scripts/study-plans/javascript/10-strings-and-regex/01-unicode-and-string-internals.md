---
title: Unicode and how JavaScript strings really work
minutes: 13
seo-title: JavaScript Unicode Strings: UTF-16, Emoji Length and NFC
description: JavaScript strings are UTF-16 code units, so an emoji has length 2. Code points vs grapheme clusters, Intl.Segmenter, normalize NFC, case mapping and sorting.
question: Why is the length of an emoji 2 in JavaScript?
answer: JavaScript strings are sequences of UTF-16 code units, not characters, and `length` counts code units. An emoji such as the grinning face (U+1F600) lies above U+FFFF, so it is stored as a surrogate pair of two code units. Count code points with `[...str].length`, and count what a reader sees as one character with `Intl.Segmenter` at grapheme granularity.
q: How do you count characters in a JavaScript string correctly?
a: It depends on what "character" means. `str.length` counts UTF-16 code units; `[...str].length` counts code points, so an emoji counts once; and `Intl.Segmenter` with `granularity: "grapheme"` counts what a reader sees, so a family emoji of three people joined by zero-width joiners, five code points in all, counts as one.
q: Why are two identical-looking strings not equal in JavaScript?
a: Accented letters can be stored two ways: "é" as one precomposed code point (U+00E9) or as `e` followed by a combining acute accent (U+0301). They render identically but compare unequal and have different lengths. Call `normalize("NFC")` on both before comparing, hashing or storing user text.
q: How do you reverse a string with emoji in JavaScript?
a: Not with `str.split("").reverse().join("")`, which splits by code unit and breaks surrogate pairs into invalid characters. `[...str].reverse().join("")` reverses by code point and keeps a single emoji intact; only splitting into graphemes with `Intl.Segmenter` also keeps combining marks and multi-part emoji sequences together.
q: How do you sort strings alphabetically in JavaScript?
a: Not with a bare `sort()`, which compares UTF-16 code units, so `"Z"` sorts before `"a"` and accented letters go to the end. Use `a.localeCompare(b)`, or create one `Intl.Collator` and pass its `compare`, which is much faster in a loop; the `numeric: true` option sorts `"file2"` before `"file10"`.
---
A JavaScript string is a sequence of **UTF-16 code units**, not of characters — and every string bug that looks impossible ("length is 2 for one emoji", "reverse() broke my text", "these two identical strings are not equal") comes from that gap. This lesson gives you the three layers — code units, code points, grapheme clusters — the APIs that work at each, normalisation, case mapping and comparison across languages, and the rules for which layer a given task needs. It matters for anything that stores names, counts characters, truncates text, sorts, or searches.

## Three layers

| Layer | What it is | How JavaScript exposes it |
| --- | --- | --- |
| **Code unit** | 16-bit number; strings are made of these | `str.length`, `str[i]`, `charCodeAt`, `charAt`, `slice` indices |
| **Code point** | a Unicode scalar value, U+0000–U+10FFFF; one or two code units | `codePointAt`, `String.fromCodePoint`, `for…of`, `[...str]`, `\u{1F600}`, the regex `u` flag |
| **Grapheme cluster** | what a reader sees as one character (base + combining marks, emoji sequences) | `Intl.Segmenter` (granularity `grapheme`) — nothing else |

```js
const s = "😀";           // U+1F600
s.length;                  // 2 — two code units (a surrogate pair: 0xD83D 0xDE00)
[...s].length;             // 1 — one code point
s.codePointAt(0).toString(16);   // "1f600";  s.charCodeAt(0) is 0xd83d — the high surrogate
String.fromCodePoint(0x1f600) === s;   // true; String.fromCharCode needs both units

const family = "👨‍👩‍👧";      // man + ZWJ + woman + ZWJ + girl: 5 code points, 8 code units, ONE grapheme
[...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(family)].length;   // 1
```

Code points above U+FFFF (emoji, many CJK characters, mathematical symbols) take **two** code units, a *surrogate pair*. Indexing into the middle of one gives a lone surrogate — an invalid string that prints as �. `"abc😀".slice(0, 4)` cuts the emoji in half; `[...str].slice(0, n).join("")` truncates by code point; only a segmenter truncates by what the user sees.

## Iteration is by code point

`for (const ch of str)`, `[...str]`, `Array.from(str)` and the regex `u` flag all step by code point. `str.split("")`, `str[i]` and a `for` loop over `length` step by code unit. Use the former for anything that must treat an emoji or a rare character as a unit; use `length`/indices only for ASCII-known data or when you truly mean code units (storage limits in UTF-16).

## Combining marks and normalisation

"é" can be **one** code point (U+00E9, precomposed) or **two** (`e` U+0065 + combining acute U+0301). They render identically, compare unequal, and have different lengths:

```js
"é" === "é";                        // false
"é".normalize("NFC") === "é".normalize("NFC");   // true — NFC composes; NFD decomposes
```

Normalise (`NFC` is the usual choice) before comparing, hashing, deduplicating or storing user text; keyboards, operating systems and copy-paste produce both forms. `NFKC`/`NFKD` additionally fold compatibility characters (`ﬁ` → `fi`, full-width digits) — for search matching, not for storage.

## Case mapping

`toUpperCase`/`toLowerCase` are Unicode-aware and can change **length**: `"straße".toUpperCase()` is `"STRASSE"`. They are locale-independent; `toLocaleUpperCase("tr")` turns `i` into `İ` (dotted capital I). Case-insensitive comparison in general is `a.toLowerCase() === b.toLowerCase()` for ordinary text, or `Intl.Collator` with `sensitivity: "accent"`/`"base"` for user-facing matching. Note `.toLowerCase()` on user input is not a normaliser — normalise too.

## Comparing and sorting text

`<` and `sort()` compare code units — uppercase before lowercase, accents sorted to the end, `"Z" < "a"`. For human order:

```js
names.sort((a, b) => a.localeCompare(b));                          // locale-aware
const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });   // reuse: much faster than localeCompare in a loop
names.sort(collator.compare);                                      // "file2" before "file10"; "a" equal to "A" and "á"
```

`numeric: true` sorts embedded numbers naturally; `sensitivity: "base"` ignores case and accents. Always pass a locale in servers so results do not depend on the machine's default.

## Segmentation

`Intl.Segmenter` (Node 16+, all modern browsers) splits by `grapheme`, `word` or `sentence` according to Unicode rules — the only correct way to count visible characters, to truncate "at 20 characters", or to split words in languages without spaces:

```js
const words = [...new Intl.Segmenter("en", { granularity: "word" }).segment(text)].filter((s) => s.isWordLike).map((s) => s.segment);
```

`str.split(" ")` is fine for ASCII prose and wrong for Thai, Japanese, or text with punctuation.

## Immutability and building

Strings are immutable values: every method returns a new string; `str[0] = "x"` does nothing. Repeated `+=` in a loop is fine in modern engines for moderate sizes (they use ropes internally); for very large output collect parts in an array and `join("")` once, or write to a stream. Comparing strings with `===` is by value and O(n) worst case; interning is the engine's business.

## Escapes and literals

`"\n" "\t" "\\" "é" "\u{1F600}" "\x41"`; template literals keep raw newlines; `String.raw\`\n\`` keeps the backslash. A string can contain lone surrogates and other invalid sequences; `str.isWellFormed()`/`toWellFormed()` (Node 20) detect and repair them — on 16, check with a regex for unpaired surrogates if it matters (`/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/`).

## Common mistakes

- Counting or truncating with `length`/`slice` on text that may contain emoji or non-BMP characters.
- `str.split("").reverse().join("")` — breaks surrogate pairs and combining sequences.
- Comparing user text without `normalize("NFC")`.
- `sort()` on names; `toLowerCase()` as a full case-fold; assuming case mapping preserves length.
- Splitting words on spaces for non-Latin text; regexes without the `u` flag on Unicode text (next lessons).

## Interview angle

- *"Why is `'😀'.length` 2?"* Strings are UTF-16 code units; the emoji is a surrogate pair — one code point, two units.
- *"How do you count characters correctly?"* Code points with `[...str].length`; visible characters with `Intl.Segmenter` graphemes.
- *"Why are two visually identical strings unequal?"* Precomposed versus combining sequences — normalise with `NFC` before comparing.
- *"How do you sort strings for humans?"* `localeCompare` or a reused `Intl.Collator` with `numeric`/`sensitivity` options.
- *"Can `toUpperCase` change a string's length?"* Yes — `ß` → `SS`.

## Key takeaways

- Code units (`length`, indices) ≠ code points (`for…of`, spread, `codePointAt`) ≠ graphemes (`Intl.Segmenter`); pick the layer the task needs.
- Non-BMP characters are surrogate pairs; never slice through them; reverse and truncate by code point or grapheme.
- Normalise (`NFC`) before comparing or storing; `NFKC` for search folding.
- Case mapping is Unicode-aware and length-changing; locale matters (`tr`).
- Sort and compare with `Intl.Collator`/`localeCompare` and an explicit locale; segment words with `Intl.Segmenter`.
