---
title: Symbols — unique keys and the language's extension points
minutes: 11
---
A symbol is a primitive whose only job is to be **unique**: `Symbol("id") !== Symbol("id")`. Used as a property key it cannot collide with any string key or any other symbol, it is skipped by `Object.keys`, `for…in` and `JSON.stringify`, and it lets two pieces of code attach data to the same object without knowing about each other. The language itself uses a fixed set of **well-known symbols** as hook names — `Symbol.iterator` is the one you have been using all module — so that your objects can plug into `for…of`, `instanceof`, string conversion and more without the language reserving any string names. This lesson covers the primitive, the global registry, symbols as keys, and the well-known symbols worth knowing by name.

## The primitive

```js
const id = Symbol("user id");           // the string is a description for debugging only
typeof id;                              // "symbol"
id.description;                         // "user id"
id.toString();                          // "Symbol(user id)"
String(id);                             // same; `${id}` and id + "" THROW — no implicit string conversion
Symbol("x") === Symbol("x");            // false — every call is a new symbol
```

Symbols cannot be `new`ed (`new Symbol()` throws), are never coerced to strings implicitly (a guard against accidentally turning a key into `"Symbol(x)"`), and are compared by identity. The seventh primitive type, after `string`, `number`, `bigint`, `boolean`, `undefined`, `null`.

## Symbols as property keys

```js
const HIDDEN = Symbol("hidden");
const obj = { visible: 1, [HIDDEN]: "secret" };   // computed key syntax
obj[HIDDEN];                                    // "secret" — must use brackets; obj.HIDDEN is the string key "HIDDEN"

Object.keys(obj);                     // ["visible"]
JSON.stringify(obj);                  // {"visible":1}
for (const k in obj) { }              // visible only
Object.getOwnPropertySymbols(obj);    // [Symbol(hidden)]
Reflect.ownKeys(obj);                 // ["visible", Symbol(hidden)] — everything, strings first
{ ...obj }                            // copies symbol keys too (own enumerable, any type)
Object.assign({}, obj)                // same
```

Symbol-keyed properties are **not** private — anyone with `Object.getOwnPropertySymbols` or the symbol itself can read them. They are *collision-free* and *invisible to the common enumeration paths*, which is a different, useful guarantee: a library can stamp `obj[Symbol("cached")]` on your objects without ever clashing with your fields or leaking into your JSON. For true privacy, `#fields` or a WeakMap.

## The global registry: `Symbol.for`

```js
Symbol.for("app.id") === Symbol.for("app.id");   // true — looked up (or created) in a process-wide registry
Symbol.keyFor(Symbol.for("app.id"));             // "app.id"
Symbol.keyFor(Symbol("local"));                  // undefined — not registered
```

`Symbol.for(key)` returns the same symbol for the same string everywhere in the realm — across modules, across bundles, across iframes. Use it when two independently loaded pieces of code must agree on a key (Node's own `Symbol.for("nodejs.util.inspect.custom")` is the canonical example). Use plain `Symbol()` when uniqueness is the point.

## Well-known symbols

Built-in symbols stored as static properties of `Symbol`; the language looks them up on your objects at specific moments:

| Symbol | The language calls it when… | You implement |
| --- | --- | --- |
| `Symbol.iterator` | `for…of`, spread, destructuring, `Array.from` | a method returning an iterator (usually a generator) |
| `Symbol.asyncIterator` | `for await…of` | an async generator or async iterator |
| `Symbol.toPrimitive` | conversion to a primitive (`+`, `${}`, `==`) | `(hint) => primitive` — overrides `valueOf`/`toString` |
| `Symbol.toStringTag` | `Object.prototype.toString.call(x)` | a getter returning the tag, giving `[object Tag]` |
| `Symbol.hasInstance` | `x instanceof C` | `static [Symbol.hasInstance](x)` — custom `instanceof` |
| `Symbol.species` | array/promise methods creating derived objects | a static getter returning the constructor to use |
| `Symbol.isConcatSpreadable` | `arr.concat(x)` | `true` to spread an array-like, `false` to keep an array whole |
| `Symbol.match/replace/search/split` | string methods given a non-RegExp | objects that act like patterns |
| `Symbol.unscopables` | `with` statements | ignore |

```js
class Even {
  static [Symbol.hasInstance](n) { return Number.isInteger(n) && n % 2 === 0; }
}
4 instanceof Even;      // true — no Even object was ever created

const arrayLike = { length: 2, 0: "a", 1: "b", [Symbol.isConcatSpreadable]: true };
[1].concat(arrayLike);  // [1, "a", "b"]
```

You will implement `Symbol.iterator` often, `Symbol.toPrimitive`/`toStringTag` sometimes, `hasInstance` and `species` almost never — but recognising them explains behaviour that otherwise looks magical (why `Stack extends Array` methods return `Stack`s: `species`).

## Enums and sentinels

Symbols make excellent **sentinel values** — `const MISSING = Symbol("missing")` can never be confused with a real value the way `null` or `-1` can — and readable enums (`const Color = Object.freeze({ Red: Symbol("red"), Green: Symbol("green") })`) whose members cannot be forged from strings. The cost: symbols do not serialise, so anything that crosses JSON needs a string mapping.

## Common mistakes

- `obj.SYM` instead of `obj[SYM]` (creates a string-keyed property).
- Expecting `JSON.stringify` or `Object.keys` to show symbol keys — or, the reverse, expecting symbol keys to be private.
- `` `${sym}` `` — throws; use `sym.description` or `String(sym)`.
- Using `Symbol()` where two modules need the *same* key (use `Symbol.for`), or `Symbol.for` where uniqueness matters.
- Storing symbols in something that will be serialised.

## Interview angle

- *"What is a symbol for?"* A unique, collision-free property key hidden from ordinary enumeration; and the language's hook names (well-known symbols).
- *"`Symbol()` versus `Symbol.for()`?"* Fresh and unique every call versus one shared symbol per string in a global registry.
- *"Are symbol properties private?"* No — hidden from `keys`/JSON/`for…in`, visible via `getOwnPropertySymbols`/`Reflect.ownKeys`.
- *"Name three well-known symbols."* `iterator`, `toPrimitive`, `hasInstance` (or `toStringTag`, `asyncIterator`, `species`).
- *"How would you customise `instanceof`?"* `static [Symbol.hasInstance](x)` on the class.

## Key takeaways

- `Symbol(desc)` is unique and never implicitly stringified; `typeof` is `"symbol"`.
- As keys: brackets to access; skipped by `keys`/`for…in`/JSON; found by `getOwnPropertySymbols`/`Reflect.ownKeys`; copied by spread.
- `Symbol.for` shares one symbol per string across the realm; `Symbol.keyFor` reads it back.
- Well-known symbols are hooks: `iterator`, `asyncIterator`, `toPrimitive`, `toStringTag`, `hasInstance`, `species`, `isConcatSpreadable`.
- Symbols are ideal sentinels and enum members, and do not survive JSON.
