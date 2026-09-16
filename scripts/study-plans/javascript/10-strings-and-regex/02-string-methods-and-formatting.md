---
title: The string toolbox, template literals, tagged templates and Intl formatting
minutes: 12
---
Most string work is a dozen methods used well: find, slice, split, join, trim, pad, replace. The rest is *formatting* — turning numbers, dates and lists into text that is right for a reader — which is where hand-written code goes wrong in every locale but the author's, and where `Intl` gets it right for free. This lesson covers the methods with their exact semantics (`slice` versus `substring`, `indexOf` versus `includes`, `split` corner cases), template literals and the tagged-template mechanism that lets a function process a literal (the basis of `html`, `sql` and `css` tags), and the `Intl` formatters for numbers, currencies, dates and lists.

## The methods, precisely

```js
s.slice(2, 5); s.slice(-3);               // [start, end) — negatives count from the end; the one to use
s.substring(2, 5);                        // swaps arguments if start > end; treats negatives as 0 — legacy
s.indexOf("x"); s.lastIndexOf("x"); s.includes("x"); s.startsWith("x", from); s.endsWith("x", to);
s.at(-1);                                 // last code unit (Node 16.6+)
s.split(",");  s.split(",", 2);  s.split("");  s.split(/\s+/);
"a,b,".split(",");                        // ["a", "b", ""] — a trailing separator yields an empty last element
"".split(",");                            // [""] — not []
s.trim(); s.trimStart(); s.trimEnd();     // whitespace incl. Unicode spaces and line terminators
s.padStart(8, "0"); s.padEnd(20);         // to a target LENGTH (code units), truncating the pad if needed
s.repeat(3);                              // RangeError for negative or Infinity
s.replace("a", "b");                      // first occurrence only for a string pattern; $& $1 $<name> in the replacement
s.replaceAll("a", "b");                   // all (Node 15+); with a regex it must have the g flag
s.toUpperCase(); s.toLowerCase(); s.localeCompare(t); s.normalize();
s.concat(t) === s + t;  s.charAt(i) === s[i] (but "" instead of undefined out of range)
```

`split` with a regex containing a capture group includes the captures in the result — `"a1b2c".split(/(\d)/)` is `["a", "1", "b", "2", "c"]`, occasionally useful. `replace` with a string pattern and a string replacement interprets `$` sequences (`$$` for a literal dollar) — pass a function (`() => text`) when the replacement is user data.

## Template literals

```js
const line = `${user.name} has ${items.length} item${items.length === 1 ? "" : "s"}`;
const multi = `first line
second line`;                                            // real newlines preserved
`${1 + 1}`;  `${obj}`  /* calls toString */;  `${[1, 2]}` /* "1,2" */;  `${null}` /* "null" */
```

Interpolation calls `String(value)` (via the ToPrimitive rules of module 5): objects print `[object Object]` unless they define `toString`, arrays join with commas, `undefined` prints as `undefined`. For anything shown to users, format explicitly — an interpolated `Date` prints its long default form; an interpolated number prints without separators.

## Tagged templates

A function placed before a template literal receives the **literal parts** and the **values** separately, before any concatenation:

```js
function html(strings, ...values) {
  return strings.reduce((out, str, i) => out + str + (i < values.length ? escapeHtml(values[i]) : ""), "");
}
const safe = html`<p>${userInput}</p>`;      // strings = ["<p>", "</p>"], values = [userInput] — escaped automatically
String.raw`C:\new\table`;                    // "C:\\new\\table" — the raw text; strings.raw holds it in any tag
```

The tag decides what interpolation means: escaping (`html`), parameterising (`sql\`… WHERE id = ${id}\`` → placeholders + parameters, no injection), styling (`css`, `styled.div`), localisation, GraphQL parsing. `strings` has a `.raw` property with the unescaped source text. Because the literal parts are known statically, a tag can cache parsing per call site — `strings` is the same frozen array object on every evaluation of the same literal.

## Intl: numbers, currency, dates, lists

```js
new Intl.NumberFormat("en-US").format(1234567.891);                              // "1,234,567.891"
new Intl.NumberFormat("de-DE").format(1234567.891);                              // "1.234.567,891"
new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" }).format(9.5);   // "€9.50"
new Intl.NumberFormat("en", { notation: "compact" }).format(1_500_000);          // "1.5M"
new Intl.NumberFormat("en", { style: "percent", maximumFractionDigits: 1 }).format(0.1234);   // "12.3%"
new Intl.NumberFormat("en", { style: "unit", unit: "kilometer-per-hour" }).format(88);         // "88 km/h"
new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: "UTC" }).format(date);     // "15 January 2024"
new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(-1, "day");        // "yesterday"
new Intl.ListFormat("en", { type: "conjunction" }).format(["a", "b", "c"]);      // "a, b, and c"
new Intl.PluralRules("en").select(1);                                             // "one" — pick the right message form
(1234.5).toLocaleString("en-US", { minimumFractionDigits: 2 });                   // shortcut to NumberFormat
```

Create a formatter **once** and reuse it — construction is expensive, `format` is cheap. Always pass a locale and, for dates, a `timeZone`; defaults come from the machine and differ between your laptop and the server. `toFixed(2)` is for machine-facing decimals (and rounds half-away-from-zero on the binary value, so `(1.005).toFixed(2)` is `"1.00"`); `Intl` is for humans.

## Building text

Concatenation with `+`/`+=` and template literals is fine for ordinary sizes. For thousands of pieces, `parts.push(…)` then `parts.join("\n")` is clearer and allocation-friendly; for output measured in megabytes, write to a stream. `Array.prototype.join` on numbers calls `String` on each; `[1, null, undefined].join("-")` is `"1--"` — nullish elements become empty strings.

## Escaping

Text inserted into another language needs that language's escaping: HTML (`& < > " '` → entities), URLs (`encodeURIComponent` for components — never `encodeURI` for a value, never hand-rolled), shell (do not — use argument arrays), SQL (parameters, never strings), regex (`escapeRegExp`, module 10 lesson 4), JSON (`JSON.stringify`, which also gives you a correctly quoted string literal). A tagged template per target language is the tidy way to make escaping automatic.

## Common mistakes

- `substring` with negative arguments or reversed indices (silently "fixed") — use `slice`.
- `"".split(",")` expected to be `[]`; a trailing separator's empty element ignored.
- `replace` when all occurrences were meant; `$` sequences in a replacement built from user data.
- Formatting numbers/dates by hand (`toFixed`, manual comma insertion) for a UI; creating an `Intl` formatter per call in a loop.
- Interpolating objects/dates into templates and shipping `[object Object]` or a machine-locale date.
- Escaping for the wrong target, or not at all, when building HTML/URLs.

## Interview angle

- *"`slice` versus `substring`?"* `slice` supports negatives and returns `""` for reversed indices; `substring` clamps negatives to 0 and swaps reversed indices.
- *"What is a tagged template?"* A function called with the literal's string parts and interpolated values, so it can escape, parameterise or transform them — `html`, `sql`, `styled`.
- *"How do you format 1234567.891 for German users?"* `new Intl.NumberFormat("de-DE").format(n)` — never manual.
- *"`replace` versus `replaceAll`?"* String pattern: first occurrence versus all; with a regex, `replaceAll` requires `g`.
- *"Why cache `Intl` formatters?"* Construction is slow (locale data), `format` is fast.

## Key takeaways

- `slice`, `includes`/`startsWith`, `split` (know the empty-string cases), `trim`, `padStart`, `replaceAll`, `at`.
- Template literals interpolate via `String()`; format explicitly for users.
- Tagged templates receive `(strings, ...values)` — the mechanism behind `html`/`sql`/`css` tags and `String.raw`.
- `Intl.NumberFormat`/`DateTimeFormat`/`RelativeTimeFormat`/`ListFormat`/`PluralRules` with an explicit locale (and timeZone), created once.
- Escape for the target language — entities, `encodeURIComponent`, parameters, `escapeRegExp` — or use a tag that does it.
