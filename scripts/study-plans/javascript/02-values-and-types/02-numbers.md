---
title: Numbers — doubles, NaN, safe integers and BigInt
minutes: 14
---
Every JavaScript `number` is a 64-bit floating-point value. There is no `int`, no `long`, no `decimal` — `7 / 2` is `3.5`, `2 ** 53 + 1` is `2 ** 53`, and `0.1 + 0.2` is `0.30000000000000004`. Most number bugs in the language follow from forgetting one of those three facts. This lesson covers the representation, the special values (`NaN`, the infinities, `-0`), the conversion functions and their differences, integer arithmetic and its limit, the `Math` toolkit, and `BigInt` for when 2⁵³ is not enough.

## One representation: IEEE-754 double

A double has 53 bits of significand, so it represents every integer up to `2 ** 53 = 9007199254740992` exactly and then starts skipping. `Number.MAX_SAFE_INTEGER` (2⁵³ − 1) is the last integer where `n + 1 !== n` is guaranteed; `Number.isSafeInteger(x)` checks. Fractions are binary fractions, so decimal values like 0.1 are approximations — `0.1 + 0.2 === 0.3` is `false`, and `(0.1 + 0.2).toFixed(2)` is the honest way to print it. Compare doubles with a tolerance (`Math.abs(a - b) < Number.EPSILON * k` or a domain-appropriate epsilon), or work in integers (cents, not dollars).

## The special values

- `Infinity` and `-Infinity`: `1 / 0`, overflow (`1e308 * 10`). `Number.isFinite(x)` rejects them and `NaN`.
- **`NaN`** (not a number): the result of any undefined operation — `0 / 0`, `Math.sqrt(-1)`, `Number("abc")`, `undefined + 1`. It is the only value in the language not equal to itself: `NaN === NaN` is `false`, so test with **`Number.isNaN(x)`** (strict: is it the value NaN?) — not the global `isNaN(x)`, which coerces first and reports `isNaN("abc")` as `true`. `Object.is(x, NaN)` also works.
- **`-0`**: `-0 === 0` is `true` and `Object.is(-0, 0)` is `false`; `1 / -0` is `-Infinity`. It appears from `-1 * 0` or `Math.round(-0.4)` and matters almost never — except in `Object.is` and in printing (`String(-0)` is `"0"`).

## Converting to number

| From `"42px"` | From `""` | From `" 12 "` | From `"0x1f"` | From `"1e3"` | From `null` | From `undefined` | From `[]` | From `true` |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `Number(...)` → `NaN` | `0` | `12` | `31` | `1000` | `0` | `NaN` | `0` | `1` |
| `parseInt(..., 10)` → `42` | `NaN` | `12` | `0` (radix 10) | `1` | `NaN` | `NaN` | `NaN` | `NaN` |
| `parseFloat(...)` → `42` | `NaN` | `12` | `0` | `1000` | `NaN` | `NaN` | `NaN` | `NaN` |

`Number(x)` (identical to unary `+x`) converts the *whole* string or fails with `NaN`; `parseInt`/`parseFloat` read the longest valid **prefix** and ignore the rest. Always pass the radix to `parseInt` — `parseInt("08")` is `8` today but was `0` in old engines, and `parseInt("0x1f")` with no radix reads hex. For user input, `Number` plus a `Number.isFinite` check is the safe default; `parseInt` is for "the number at the start of this string".

## Integer arithmetic, and where it lies

`+ - *` on integers are exact below 2⁵³. Division is not integer division: `7 / 2` is `3.5`; use `Math.floor(a / b)` (toward −∞), `Math.trunc(a / b)` (toward 0) or `~~(a / b)` (32-bit truncation, avoid). `%` is a **remainder** with the sign of the dividend: `-7 % 3` is `-1`; a true modulo is `((a % b) + b) % b`. `**` is exponentiation (`2 ** 10`); `Math.pow` is the same. Above 2⁵³, `+` silently loses precision — `9007199254740992 + 1` is `9007199254740992` — which is why IDs and money in large systems arrive as strings and why `BigInt` exists.

**Bitwise operators (`& | ^ ~ << >> >>>`) work on 32-bit integers**: the operand is converted to a signed 32-bit int first, so `2 ** 31 | 0` is `-2147483648` and `(2 ** 32) | 0` is `0`. Useful for flags and for the `x | 0` truncation idiom on small values; a trap for anything larger.

## The `Math` toolkit

`Math.floor/ceil/round/trunc` (note `Math.round(-2.5)` is `-2` — rounds half toward +∞, unlike Java), `Math.abs`, `Math.min/max(...values)` (spread an array: `Math.max(...arr)`; empty gives `-Infinity`), `Math.sqrt`, `Math.hypot`, `Math.pow`, `Math.sign`, `Math.log2/log10`, `Math.random()` (0 ≤ r < 1, not cryptographic — `crypto.randomInt` for that), `Math.PI`, `Math.E`.

## Formatting

`x.toFixed(d)` gives a string with `d` decimals (rounding is by decimal expansion; `(1.005).toFixed(2)` is `"1.00"` because 1.005 is really 1.00499…). `x.toPrecision(n)`, `x.toString(2)` (binary), `x.toString(16)`, `Number.parseFloat`. `toLocaleString("en-US")` for grouping. Large and tiny numbers print in exponent form (`1e21`, `1e-7`) — a surprise for money code that forgot to fix decimals.

## BigInt

```js
const big = 9007199254740993n;             // literal with n
const fromString = BigInt("123456789012345678901234567890");
big + 1n; big * 2n; big / 2n;               // / truncates toward zero: 7n / 2n === 3n
big ** 20n;
typeof big;                                 // "bigint"
Number(big);                                // back to double — may lose precision
big + 1                                     // TypeError: cannot mix BigInt and other types
big > 1                                     // comparisons across the types are allowed: true
JSON.stringify({ big })                     // TypeError — BigInt has no JSON form; convert to string first
```

Arbitrary precision, integers only, no `Math`, explicit conversion at every boundary. Use it for factorials, 64-bit IDs, cryptography-sized arithmetic; use `number` for everything else — it is far faster.

## Interview angle

- *"Why is `0.1 + 0.2 !== 0.3`?"* Binary doubles cannot represent decimal tenths exactly; compare with a tolerance or use integer units.
- *"How do you check for `NaN`?"* `Number.isNaN(x)` — `NaN !== NaN`, and global `isNaN` coerces.
- *"`Number(\"42px\")` versus `parseInt(\"42px\")`?"* `NaN` versus `42` — whole-string versus prefix parsing.
- *"Largest exact integer?"* `Number.MAX_SAFE_INTEGER` = 2⁵³ − 1; beyond it use `BigInt`.
- *"What is `-7 % 3`?"* `-1` — remainder keeps the dividend's sign; `((a % b) + b) % b` for a true modulo.

## Key takeaways

- One `number` type: a double. Exact integers to 2⁵³ − 1; decimal fractions are approximate.
- `NaN` is unequal to itself — `Number.isNaN`; `Infinity` from overflow and `/ 0`; `-0` exists.
- `Number`/`+x` converts whole strings (or `NaN`); `parseInt(s, 10)`/`parseFloat` read a prefix.
- `/` is floating; `Math.floor`/`trunc` for integer division; `%` keeps the dividend's sign; bitwise ops are 32-bit.
- `BigInt` for big whole numbers; never mixes with `number` implicitly; no `Math`, no JSON.
