---
title: The idiom sheet — the one-liners worth knowing by heart, and the traps inside them
minutes: 11
---
Every language has a set of small moves that experienced practitioners write without thinking, and an interviewer notices when you have them: they free your attention for the problem, and they signal fluency more reliably than any theory answer. This is the JavaScript sheet — collection idioms, string idioms, object idioms, number idioms — each with the trap that catches people who half-remember it. Read it once for recognition, then let the exercises make them yours.

## Collections

```js
const freq = new Map(); for (const x of xs) freq.set(x, (freq.get(x) ?? 0) + 1);   // count
const groups = new Map(); for (const x of xs) (groups.get(key(x)) ?? groups.set(key(x), []).get(key(x))).push(x);   // group by
const unique = [...new Set(xs)];                                   // dedupe primitives (SameValueZero: one NaN)
const byKey = [...new Map(xs.map((x) => [x.id, x])).values()];      // dedupe objects by a key — last one wins
const sorted = [...xs].sort((a, b) => a.age - b.age || a.name.localeCompare(b.name));   // multi-key, non-mutating copy
const top = [...freq].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, k);   // top-k with a deterministic tie-break
const chunks = Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n));
const zipped = a.map((x, i) => [x, b[i]]);                          // zip (length of a)
const range = Array.from({ length: n }, (_, i) => start + i);
const flat = nested.flat(Infinity);
const [min, max] = xs.reduce(([lo, hi], x) => [Math.min(lo, x), Math.max(hi, x)], [Infinity, -Infinity]);   // never Math.max(...xs) for 10⁵+ items
const sum = xs.reduce((a, b) => a + b, 0);                          // always pass the initial value
const last = xs.at(-1);
const shuffled = xs.map((x) => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map(([, x]) => x);   // or Fisher–Yates for O(n)
```

Traps: `sort()` without a comparator sorts numbers as strings and **mutates**; `Math.max(...big)` throws `RangeError` on argument-count limits; `reduce` on an empty array with no initial value throws; `Array(3).map(f)` does nothing (holes are skipped — use `Array.from({ length: 3 }, f)`); `new Set` deduplicates by SameValueZero, so two equal-looking objects stay.

## Strings

```js
const chars = [...s];                                               // code points, not UTF-16 units
const reversed = [...s].reverse().join("");
const isPalindrome = (s) => { const t = s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, ""); return t === [...t].reverse().join(""); };
const words = s.trim().split(/\s+/).filter(Boolean);
const title = words.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(" ");
const camel = kebab.replace(/-(\w)/g, (_, c) => c.toUpperCase());
const kebab = camel.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
const padded = String(n).padStart(3, "0");
const count = (s.match(/a/g) ?? []).length;                         // or [...s].filter(c => c === "a").length
const truncate = (s, n) => ([...s].length <= n ? s : [...s].slice(0, n - 1).join("") + "…");
const rle = s.replace(/(.)\1*/gs, (run, c) => run.length + c);      // run-length encode
const template = `${name} has ${count} item${count === 1 ? "" : "s"}`;
```

Traps: `s.length` counts UTF-16 units (`"👍".length === 2`); `s[0]` on an empty string is `undefined`, not an error; `split("")` splits surrogate pairs; `replace` with a string pattern replaces the first occurrence only (`replaceAll` or a `/g` regex); `"b" + "a" + +"a" + "a"` is `"baNaNa"` — unary plus on a non-numeric string is `NaN`.

## Objects

```js
const { a, b: renamed = 2, ...rest } = obj;                          // pick, rename, default, rest
const picked = Object.fromEntries(Object.entries(obj).filter(([k]) => keys.includes(k)));
const inverted = Object.fromEntries(Object.entries(obj).map(([k, v]) => [v, k]));
const merged = { ...defaults, ...overrides };                        // shallow; later wins
const shallow = { ...obj }, deep = structuredClone(obj);             // Node 17+/browsers; JSON round trip loses Dates, undefined, Map, cycles
const has = Object.hasOwn(obj, key);                                 // not `key in obj` (inherited) and not obj.hasOwnProperty (shadowable)
const isEmpty = Object.keys(obj).length === 0;
const byId = Object.fromEntries(list.map((x) => [x.id, x]));
const frozen = Object.freeze({ ...obj });                            // shallow
const safeGet = obj?.a?.b ?? fallback;
```

Traps: object keys are strings or symbols — `obj[1]` and `obj["1"]` are the same key, and integer-like keys enumerate first in ascending order; spread copies own enumerable properties only (no prototype, getters become values); `JSON.parse(JSON.stringify(x))` drops `undefined`, functions and `Map`/`Set`, turns `Date` into a string and `NaN` into `null`, and throws on cycles; `Object.freeze` is shallow.

## Numbers

```js
const isInt = Number.isInteger(x);                                   // not x % 1 === 0 (fails for Infinity)
const rounded = Math.round(x * 100) / 100;                           // toFixed returns a string and rounds half-to-even-ish (binary)
const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
const safe = Number.isSafeInteger(n);                                // beyond 2⁵³ use BigInt
const parsed = Number(str);                                          // strict; parseInt("12px") is 12, Number("12px") is NaN
const digits = [...String(n)].map(Number);
const mod = ((a % m) + m) % m;                                       // % keeps the sign of the dividend
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
```

Traps: `0.1 + 0.2 !== 0.3` (compare with `Math.abs(a - b) < Number.EPSILON` or work in integers); `parseInt` with `map` passes the index as the radix (`["1","2","3"].map(parseInt)` → `[1, NaN, NaN]`); `typeof NaN === "number"` and `NaN !== NaN` — use `Number.isNaN`; `-7 % 3 === -1`; `~~x`/`x | 0` truncate to 32 bits.

## Functions

```js
const once = (fn) => { let done = false, v; return (...a) => (done ? v : ((done = true), (v = fn(...a)))); };
const memo = (fn) => { const c = new Map(); return (x) => (c.has(x) ? c.get(x) : (c.set(x, fn(x)), c.get(x))); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const pipe = (...fns) => (x) => fns.reduce((v, f) => f(v), x);
const tryCatch = (fn, fallback) => { try { return fn(); } catch { return fallback; } };
```

Traps: arrow functions have no `this`/`arguments` of their own and cannot be constructors; a memoiser keyed by a single argument breaks for several (join them, or nest Maps); `debounce` returning a new function per render means the timer is never shared.

## Common mistakes

- `sort()` without a comparator; `Math.max(...huge)`; `Array(n).map`; `reduce` with no seed.
- `s.length`/`s[i]` for characters; `split("")` on emoji; `replace` without `/g`.
- `key in obj` for own properties; JSON round trips as a deep clone of anything with Dates or `undefined`.
- `parseInt` as a `map` callback; `x % 1 === 0`; `toFixed` treated as rounding a number.
- Memoising with a single-key Map for multi-argument functions.

## What the interviewer is listening for

- Whether the small moves are automatic — the comparator appears without a pause, the queue is a pointer, the string is spread before it is reversed.
- Whether you know *why* the idiom is shaped that way (the trap it avoids) — that is the difference between fluency and copy-paste.
- Whether you reach for `Map`/`Set` and `Object.fromEntries`/`entries` transformations rather than manual loops for everything.

## Key takeaways

- Collections: `Map` counting and grouping, `Set` dedupe, comparator sorts on copies, `Array.from` for chunks/ranges/tables, `reduce` with a seed.
- Strings: spread for code points, regex with `/g` and `/u`, `padStart`, run-length via backreference.
- Objects: destructuring with rename/default/rest, `entries`/`fromEntries` transforms, `Object.hasOwn`, shallow spread versus a real deep clone.
- Numbers: `Number.isInteger`/`isNaN`/`isSafeInteger`, epsilon comparison, sign-safe modulo, `Number()` over `parseInt`.
- Know the trap behind each idiom; it is what the interviewer will ask about.
