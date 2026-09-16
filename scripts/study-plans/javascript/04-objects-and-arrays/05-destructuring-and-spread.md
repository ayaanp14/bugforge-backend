---
title: Destructuring and spread — taking things apart and putting them together
minutes: 13
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
