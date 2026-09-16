---
title: Object literals — properties, keys, iteration and JSON
minutes: 13
---
An object in JavaScript is a bag of properties: string (or symbol) keys mapped to values, created most often with a literal `{ }`. There is no class needed, no schema, and any property can be added or removed at any time — which makes objects the language's universal record, dictionary and namespace. This lesson covers the literal syntax and its shorthands, the two ways to access a property and when each is required, the `in`/`hasOwn`/optional-chaining tests, the iteration order rules, and JSON as the wire format objects travel in.

## The literal and its shorthands

```js
const name = "Ada", born = 1815;
const key = "role";
const user = {
  name,                      // property shorthand: name: name
  born,
  "full name": "Ada Lovelace",   // any string as a key, quoted when not an identifier
  [key]: "mathematician",    // computed key: the value of `key`
  [`is${"Adult"}`]: true,    // computed from any expression
  greet() { return `Hi, ${this.name}`; },   // method shorthand
  get age() { return 2024 - this.born; },   // getter: read as a property, computed on access
  set age(v) { this.born = 2024 - v; },     // setter
  nested: { city: "London" },
  tags: ["math", "engine"],
};
```

Keys are always strings (or symbols) — `{ 1: "a" }` has the key `"1"`, and `obj[1]` and `obj["1"]` are the same property. Trailing commas are fine. Duplicate keys take the last value silently.

## Access: dot versus bracket

```js
user.name            // dot: the key is a literal identifier
user["full name"]    // bracket: the key has a space, or…
user[key]            // …the key is a variable, or…
user[1 + 1]          // …an expression. Brackets always take a string (after conversion).
user.missing         // undefined — not an error
user.missing.deep    // TypeError: Cannot read properties of undefined
user.missing?.deep   // undefined — optional chaining stops at the first nullish link
```

A missing property is `undefined`; reading a property *of* `undefined` throws. That asymmetry is the source of the most common runtime error, and `?.` is its cure.

## Adding, changing, deleting

```js
user.email = "ada@example.com";   // add
user.born = 1816;                 // change
delete user.tags;                 // remove the property entirely (returns true)
user.tags = undefined;            // the key still exists with value undefined — not the same thing
```

`delete` is slow-ish and rare in application code; setting to `undefined` or building a new object without the key is more common. Objects are mutable by default; `Object.freeze` (next lesson) stops changes.

## Testing for a property

```js
"name" in user                         // true — own or inherited
Object.hasOwn(user, "name")            // true — own only (2022; the old spelling is Object.prototype.hasOwnProperty.call(user, "name"))
user.name !== undefined                // false negative if the value IS undefined
user.name ?? "anonymous"               // default for missing or nullish
```

Use `Object.hasOwn` for "does this record have this field". `in` also sees prototype properties (`"toString" in {}` is `true`), which is almost never what you mean for data.

## Iterating

```js
Object.keys(user)      // ["name", "born", "full name", …] own enumerable string keys
Object.values(user)
Object.entries(user)   // [["name", "Ada"], …] — the one to use with for…of and destructuring
for (const [k, v] of Object.entries(user)) console.log(k, v);
for (const k in user) { }   // legacy: includes inherited enumerable props; avoid for data
Object.fromEntries(entries) // the inverse — build an object from pairs (handy after map/filter on entries)
```

**Order** is specified since 2015: integer-like keys first in ascending numeric order, then string keys in insertion order, then symbols. So `{ b: 1, 2: 1, a: 1, 1: 1 }` iterates as `1, 2, b, a`. Rely on insertion order for string keys; never on it for numeric keys — and if you need a real ordered map with arbitrary keys, `Map` (module 6).

## Objects as dictionaries — and why `Map` exists

A plain object works as a string-keyed map, with three caveats: keys are coerced to strings (`obj[1]` is `obj["1"]`, `obj[{}]` is `obj["[object Object]"]`); inherited names like `"constructor"` and `"toString"` are already "present" via the prototype (`obj["constructor"]` is a function — use `Object.hasOwn` or `Object.create(null)`); and `__proto__` as a key is a security hazard when keys come from user input (**prototype pollution**). For anything with non-string keys, hostile input, or frequent adds/removes, use `Map`.

## JSON

```js
const text = JSON.stringify(user);            // '{"name":"Ada",…}' — strings, numbers, booleans, null, arrays, objects
JSON.stringify(user, null, 2);                // pretty-printed with 2-space indent
JSON.stringify({ a: undefined, f() {}, d: new Date(0), n: NaN });   // '{"d":"1970-01-01T00:00:00.000Z","n":null}'
const back = JSON.parse(text);                // a plain object again — methods, Dates, undefined are gone
JSON.parse("{bad json}");                     // SyntaxError — always try/catch untrusted input
```

JSON is a *subset* of the literal syntax: keys must be double-quoted strings; no functions, `undefined`, `NaN`/`Infinity` (they become `null`), comments, or trailing commas; `Date`s become ISO strings and do not come back as `Date`s. `stringify` throws on cycles and on `BigInt`. The second argument of both is a **replacer/reviver** function for custom handling. `JSON.parse(JSON.stringify(x))` is the old deep-clone trick, with all of those losses.

## `Object` static helpers you will use

`Object.assign(target, ...sources)` (copy properties; shallow), `Object.freeze`/`isFrozen`, `Object.keys/values/entries/fromEntries`, `Object.hasOwn`, `Object.create(proto)` (module 5), `Object.getOwnPropertyNames` (includes non-enumerable), `Object.defineProperty` (fine-grained control: writable, enumerable, configurable — rarely in application code).

## Interview angle

- *"Dot versus bracket access?"* Dot for identifier-like literal keys; brackets for computed keys, variables, or keys with spaces — brackets convert to string.
- *"How do you check whether an object has a property?"* `Object.hasOwn(obj, key)` for own properties; `in` includes the prototype chain.
- *"What is the iteration order of object keys?"* Integer-like keys ascending, then strings in insertion order, then symbols.
- *"What does `JSON.stringify` drop?"* `undefined`, functions and symbols (omitted); `NaN`/`Infinity` become `null`; `Date`s become strings; `BigInt` and cycles throw.
- *"Why `Map` instead of an object as a dictionary?"* Any key type, no prototype collisions or pollution, size, insertion order, better for churn.

## Key takeaways

- Literal shorthands: `{ name }`, `[computed]`, `method() {}`, `get`/`set`. Keys are strings (or symbols).
- `a.b` for literal keys, `a[k]` for computed; missing → `undefined`, missing-of-missing → throw; `?.` guards.
- `Object.hasOwn` for own properties; `Object.entries` + `for…of` to iterate; order: integers, then insertion.
- Plain objects as dictionaries have string-only keys and prototype hazards — `Map` for real maps.
- JSON: double-quoted keys, no functions/undefined/Dates round-trip; `parse` untrusted input in `try`/`catch`.
