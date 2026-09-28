---
title: Destructuring and spread — taking things apart and putting them together
minutes: 13
seo-title: JavaScript Destructuring and Spread Operator Explained
description: Destructuring binds variables from objects and arrays by shape, with defaults, renaming and rest; spread expands them. Swaps, named parameters and merges.
question: What is destructuring in JavaScript?
answer: Destructuring is JavaScript syntax that unpacks values from objects and arrays into variables by shape. Object patterns match by property name — `const { name, role = "guest" } = user` — with renaming, defaults and a `...rest`; array patterns match by position on any iterable — `const [head, ...tail] = list`. Defaults apply only when the value is `undefined`, and destructuring `null` or `undefined` throws.
q: What is the spread operator in JavaScript?
a: The spread operator `...` expands an iterable into separate values in a call or array literal — `Math.max(...nums)`, `[...a, ...b]` — and copies an object's own enumerable properties into an object literal, as in `{ ...defaults, ...options }`. Every copy it makes is shallow.
q: How do you swap two variables in JavaScript?
a: Use array destructuring: `[a, b] = [b, a]`. The right side builds a temporary array of the current values and the pattern assigns them back in the opposite order, with no temporary variable to declare.
q: How do you make named parameters in JavaScript?
a: Take one options object and destructure it in the signature with defaults: `function createUser({ name, role = "member" } = {})`. Callers name what they pass and omit the rest, and the `= {}` default lets the function be called with no argument at all.
q: Which value wins when spreading objects with duplicate keys?
a: The later one. In `{ ...a, ...b }` a key present in both takes its value from `b`, because properties are copied left to right, which is why `{ ...defaults, ...overrides }` is the config-merge idiom.
q: Why do I get "Cannot destructure property of undefined"?
a: Destructuring `null` or `undefined` throws a `TypeError`, for example when a function is called without the object it destructures. Default the container: `const { name } = user ?? {}`, or give a destructured parameter an `= {}` default.
---
Destructuring pulls values out of objects and arrays into variables by shape; spread does the reverse, pouring an iterable or an object's properties into a literal or a call. Together they replaced a huge amount of `const x = obj.x` and `Array.prototype.slice.call` boilerplate, and they are the syntax behind "named parameters", swapping variables, immutable updates, and half of every React component. This lesson covers both in full: defaults, renaming, nesting, rest, the parameter-list forms, and the places where the syntax has sharp edges.

## Object destructuring

```js
const user = { name: "Ada", born: 1815, address: { city: "London" } };
const { name, born } = user;                       // name = "Ada", born = 1815
const { name: fullName } = user;                   // rename: fullName = "Ada"
const { role = "guest" } = user;                   // default when the property is undefined
const { address: { city } } = user;                // nested: city = "London" (address itself is NOT bound)
const { name: n = "anon", ...rest } = user;        // rename + default + rest of the properties
let a, b;
({ a, b } = { a: 1, b: 2 });                       // assigning to existing variables needs parentheses
```

The pattern mirrors a literal: `{ prop }` binds `prop`; `{ prop: newName }` binds `newName`; `= default` applies when the value is `undefined` (not `null`); `...rest` collects the remaining own enumerable properties into a new object. Destructuring `null` or `undefined` throws (`Cannot destructure property 'name' of undefined`) — default the object itself when it may be missing: `const { name } = user ?? {}`.

## Array destructuring

```js
const [first, second] = [1, 2, 3];       // by position
const [, , third] = [1, 2, 3];           // skip with empty slots
const [head, ...tail] = [1, 2, 3];       // head = 1, tail = [2, 3]
const [x = 0, y = 0] = [5];              // y defaults to 0
[a, b] = [b, a];                         // swap — no temporary variable
const [k, v] = Object.entries(obj)[0];
for (const [key, value] of map) { }      // Map entries are [k, v] pairs
const [, year, month] = /(\d{4})-(\d{2})/.exec(text);   // regex groups
```

Array destructuring works on any **iterable**, not only arrays — strings, Maps, Sets, generators. Positions past the end give `undefined` (then the default). The trailing-rest element must be last.

## Destructuring parameters: named arguments

```js
function createUser({ name, role = "member", tags = [] } = {}) { /* … */ }
createUser({ name: "Ada" });
createUser();                                              // the = {} default makes the whole argument optional

const area = ({ width, height }) => width * height;
const sumPairs = ([a, b]) => a + b;
[[1, 2], [3, 4]].map(([a, b]) => a + b);                   // destructure in a callback
Object.entries(counts).map(([word, n]) => `${word}: ${n}`);
```

An options object with destructured, defaulted parameters is the idiomatic replacement for positional parameters past two or three: callers name what they pass, omit what they do not, and reorder freely. The `= {}` default on the whole parameter is what lets the function be called with no argument.

## Spread

```js
Math.max(...nums);                       // an iterable → separate arguments
const merged = [...a, ...b];             // concatenate arrays
const copy = [...arr];                   // shallow copy
const chars = [...str];                  // string → code points
const unique = [...new Set(arr)];        // dedupe
const withDefaults = { ...defaults, ...options };   // later properties win — the config-merge idiom
const updated = { ...user, born: 1816 };            // immutable update
f(...args);                                         // forward arguments
```

Array spread requires an iterable (an object throws: `{...}` is not iterable); object spread takes own enumerable properties of anything (arrays spread into `{0: …, 1: …}`; `null`/`undefined` spread to nothing without error). Order matters in object spread: the rightmost wins, which is exactly what you want for `{ ...defaults, ...overrides }`. Both are **shallow** (previous lesson).

## Rest versus spread, once more

Same three dots, opposite direction. **Rest** appears where names are bound — a parameter list (`(...args)`), a destructuring pattern (`[a, ...others]`, `{ x, ...rest }`) — and *collects*. **Spread** appears where values are supplied — a call (`f(...xs)`), an array or object literal — and *expands*. In a destructuring pattern the rest must be last; in an object literal spread can appear anywhere, several times.

## Sharp edges

- `const { a } = null` throws; `const { a } = maybe ?? {}` does not.
- Starting a statement with `{` destructuring assignment needs parentheses: `({ a } = obj);`.
- Defaults apply on `undefined` only — a `null` property stays `null`.
- Deep patterns bind only the leaves: `const { address: { city } } = user` gives `city`, not `address`.
- Array patterns on non-iterables throw; object patterns on primitives work through boxing (`const { length } = "abc"`).
- Rest in object patterns copies own enumerable properties only — no getters' *values* are recomputed later, no prototype properties.
- Spreading a huge array into `Math.max(...arr)` can overflow the argument limit (~100k); reduce instead.

## Idioms worth memorising

```js
const [min, max] = [Math.min(...xs), Math.max(...xs)];
const { data: { items = [] } = {} } = response;          // deep with defaults at every level
const pick = ({ id, name }) => ({ id, name });            // project an object to a few fields
const omit = ({ password, ...safe }) => safe;             // drop a field
const [{ name: firstName } = {}] = users;                 // first element, defaulted, renamed
```

## Interview angle

- *"What does destructuring do?"* Binds variables from an object's properties or an iterable's elements by shape, with renaming, defaults and rest.
- *"How do you swap two variables?"* `[a, b] = [b, a]`.
- *"How do you implement named/optional parameters?"* A destructured options object with defaults, defaulted to `{}`.
- *"`{ ...a, ...b }` — who wins on duplicate keys?"* The later spread, `b`.
- *"Is spread a deep copy?"* No — one level; nested objects are shared.

## Key takeaways

- Object patterns match by name (`{ a, b: renamed = default, ...rest }`); array patterns by position on any iterable (`[x, , y, ...more]`).
- Defaults fire on `undefined`; destructuring `null`/`undefined` throws — default the container.
- Destructured parameters give named, optional arguments; `= {}` makes the object itself optional.
- Spread expands iterables into calls/arrays and properties into objects; later wins; always shallow.
- Rest collects (last in a pattern), spread expands — same dots, opposite jobs.
