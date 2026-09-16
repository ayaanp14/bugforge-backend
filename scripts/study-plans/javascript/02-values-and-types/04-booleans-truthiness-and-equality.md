---
title: Truthiness, coercion and the two equalities
minutes: 14
---
JavaScript will happily compare a string to a number, add a number to a string, and treat an empty array as true and an empty string as false. The rules behind those conversions are precise, small in number, and mostly ignored — which is why `==` has a reputation and `"1" + 1` is a meme. This lesson states the rules: what is falsy, how `==` decides, what `+` does, what the comparison operators do to mixed types, and the modern operators (`??`, `?.`, `||=`) that let you write the common cases without thinking about any of it.

## Truthy and falsy

Exactly **eight** values are falsy: `false`, `0`, `-0`, `0n`, `""`, `null`, `undefined`, `NaN`. Everything else is truthy — including `"0"`, `"false"`, `[]`, `{}`, and any function. Conditions (`if`, `while`, `? :`, `!`, `&&`, `||`) apply this rule, and `Boolean(x)` or `!!x` makes it explicit.

```js
if ([]) console.log("an empty array is truthy");     // prints
if ("") console.log("never");
if ("0") console.log("a non-empty string is truthy"); // prints
```

The trap: `if (count)` is wrong when `0` is a valid count; write `if (count !== undefined)` or `if (count != null)`.

## `&&`, `||`, `??` return operands, not booleans

`a && b` returns `a` if `a` is falsy, else `b`. `a || b` returns `a` if truthy, else `b`. Both short-circuit — the right side is not evaluated when the left decides. This is why they double as control flow:

```js
const name = input || "anonymous";        // default — but "" and 0 are replaced too
const name2 = input ?? "anonymous";       // nullish coalescing (2020): only null/undefined are replaced
user && user.save();                      // call only if user is truthy
user?.save();                             // optional call (2020): only if user is not null/undefined
config.retries ??= 3;                     // logical assignment (2021): set if nullish
flags.verbose ||= false;  cache.hit &&= true;
```

Use `??` for defaults whenever `0`, `""` or `false` are legitimate values — which is most of the time. `?.` works for properties (`a?.b`), computed access (`a?.[k]`) and calls (`f?.()`), and short-circuits the *rest of the chain*: `a?.b.c` is `undefined` when `a` is nullish, without evaluating `.c`.

## `===` and `==`

**Strict equality `===`**: same type and same value; no conversion. Objects by identity. `NaN !== NaN`; `+0 === -0`. **`Object.is`** is `===` except that it distinguishes `-0` and treats `NaN` as equal to itself.

**Loose equality `==`** converts operands by these rules, in order:

1. Same type → same as `===`.
2. `null == undefined` → `true` (and neither equals anything else).
3. number vs string → convert the string to a number: `1 == "1"`.
4. boolean vs anything → convert the boolean to a number: `true == 1`, `true == "1"`, `false == ""`, `false == "0"`.
5. object vs primitive → convert the object with `valueOf`/`toString`: `[1] == 1`, `[] == ""`, `[] == 0`, `{} == "[object Object]"`.

Hence the famous table: `"" == 0` (true), `"0" == 0` (true), `"" == "0"` (false — same type, different value), `null == 0` (false — rule 2 stops null), `[] == ![]` (true — `![]` is `false`, `false` → `0`, `[]` → `""` → `0`). None of this is random; all of it is avoidable: **use `===`**, and the single idiomatic `==`: `x == null` to test for null-or-undefined.

## Relational operators

`< > <= >=` convert to numbers **unless both sides are strings**, in which case they compare code units:

```js
"10" < "9"        // true — string comparison
10 < "9"          // false — "9" becomes 9
"abc" < 5         // false — "abc" becomes NaN, and every comparison with NaN is false
null < 1          // true — null becomes 0
undefined < 1     // false — undefined becomes NaN
```

Sorting an array of numeric strings with `<` or the default `sort()` gives `["1", "10", "2", "9"]`; convert or pass a comparator.

## `+` is the odd one out

If **either** operand is a string, `+` concatenates; otherwise it adds numbers. Every other arithmetic operator (`- * / %`) converts to numbers.

```js
1 + "2"       // "12"
"3" - 1       // 2
"3" * "4"     // 12
1 + 2 + "3"   // "33" — left to right: 3 + "3"
"1" + 2 + 3   // "123"
[] + {}       // "[object Object]" — both become strings
+"42"         // 42 — unary plus converts
```

## The conversion algorithm, briefly

Converting an object to a primitive calls `Symbol.toPrimitive` if present, else `valueOf` then `toString` (for numeric contexts) or `toString` then `valueOf` (for string contexts). `Date` prefers strings in `+`; arrays' `toString` is `join(",")`; plain objects give `"[object Object]"`. You can define `toString`/`valueOf` on your own classes to control this — rarely wise, occasionally elegant (a `Money` class that formats itself).

## Conditions that read well

```js
if (list.length === 0)            // not: if (!list.length)  — explicit intent
if (value == null)                // the one accepted ==
if (typeof x === "string" && x !== "")
const port = Number(process.env.PORT ?? 3000);
const label = user?.profile?.displayName ?? user?.email ?? "guest";
```

Reviewers read `===` as competence and `==` as a bug unless it is the null check. Reach for `??` over `||` unless you specifically want to replace empty strings and zeros.

## Interview angle

- *"What is falsy in JavaScript?"* `false, 0, -0, 0n, "", null, undefined, NaN` — and nothing else; `[]` and `{}` are truthy.
- *"`==` versus `===`?"* Loose equality converts by fixed rules (null/undefined equal; strings to numbers; booleans to numbers; objects to primitives); strict compares type and value. Use `===`; `== null` is the one idiom.
- *"`||` versus `??`?"* `||` replaces any falsy left side; `??` only `null`/`undefined`.
- *"Why is `1 + \"2\"` `\"12\"` but `\"3\" - 1` is `2`?"* `+` concatenates if either side is a string; the other operators convert to numbers.
- *"Is `[] == ![]` true?"* Yes — and the derivation is the interviewer's point; the answer is to never write it.

## Key takeaways

- Eight falsy values; everything else truthy — including `[]`, `{}` and `"0"`.
- `&&`/`||`/`??` return operands and short-circuit; `??` and `?.` handle only nullish values.
- `===` always; `== null` is the one idiomatic loose equality; know the coercion rules to explain, not to use.
- `+` concatenates when a string is involved; `- * / %` convert to numbers; strings compare by code unit.
- `Object.is` for `NaN` and `-0`; `Number.isNaN` for `NaN`.
