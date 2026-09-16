---
title: Property descriptors and the object protocols — toString, valueOf, toJSON, Symbol.toPrimitive
minutes: 13
---
Two more layers sit under ordinary property access. Every property has a **descriptor** — is it writable, does it show up in loops, can it be deleted or redefined — and `Object.defineProperty` lets you set those bits, which is how `Object.freeze`, non-enumerable class methods and read-only constants are built. And the language consults a handful of **well-known methods** when it needs to turn your object into something else: `toString` for strings, `valueOf` for numbers, `toJSON` for `JSON.stringify`, `Symbol.toPrimitive` to take over all of it, `Symbol.toStringTag` for the `[object X]` label. Implement them and your class plugs into template literals, `+`, sorting, JSON and logging without callers doing anything special.

## Descriptors

```js
const o = { a: 1 };
Object.getOwnPropertyDescriptor(o, "a");
// { value: 1, writable: true, enumerable: true, configurable: true }

Object.defineProperty(o, "id", { value: 42 });          // defaults are all FALSE: read-only, hidden, permanent
Object.defineProperty(o, "double", { get() { return this.a * 2; }, enumerable: true });
Object.keys(o);              // ["a", "double"] — id is non-enumerable
JSON.stringify(o);           // {"a":1,"double":2} — same rule
o.id = 7;                    // strict mode: TypeError; sloppy: silently ignored
delete o.id;                 // false / TypeError — non-configurable
```

Three flags on a data property: **writable** (can the value change), **enumerable** (does it appear in `for…in`, `Object.keys`, spread, `JSON.stringify`), **configurable** (can it be deleted or have its descriptor changed; a non-configurable property can still go from writable to non-writable — one-way). Accessor properties replace `value`/`writable` with `get`/`set`. Properties created by assignment or literals are all-true; `defineProperty` defaults to all-false, which is the surprise.

`Object.defineProperties(obj, {…})` sets several; `Object.getOwnPropertyDescriptors(obj)` reads all — the correct way to copy accessors, since `{...obj}` and `Object.assign` **invoke** getters and copy the resulting values.

## The lock-down trio

- `Object.preventExtensions(o)` — no new properties.
- `Object.seal(o)` — plus every property non-configurable (no deletes, no redefinition); values still writable.
- `Object.freeze(o)` — plus non-writable. Shallow, as module 4 said. `Object.isFrozen/isSealed/isExtensible` read the state.

Class methods are defined non-enumerable, which is why they do not appear in `Object.keys(instance)` or in JSON — and why spreading an instance drops its methods.

## `toString` and `valueOf`

When an object meets a string context (`${obj}`, `String(obj)`, `"" + obj` for the string case) or a numeric one (`+obj`, `obj * 2`, `obj < other`), the engine converts it via **ToPrimitive** with a hint — `"string"`, `"number"` or `"default"`. Without `Symbol.toPrimitive`, hint `"string"` tries `toString` then `valueOf`; hints `"number"` and `"default"` try `valueOf` then `toString`. `+` uses `"default"` (so `valueOf` first — that is why `date1 - date2` is a number of milliseconds while `${date}` is a readable string); `==` with a primitive uses `"default"`; `Date` is the one built-in whose `"default"` behaves like `"string"`.

```js
class Money {
  constructor(cents, currency = "USD") { this.cents = cents; this.currency = currency; }
  valueOf() { return this.cents; }                       // numeric contexts
  toString() { return `${(this.cents / 100).toFixed(2)} ${this.currency}`; }
}
const m = new Money(1250);
`${m}`;          // "12.50 USD"  (hint string → toString)
m + 1;           // 1251         (hint default → valueOf)
m > new Money(1000);   // true    (relational → number → valueOf)
[new Money(300), new Money(100)].sort((a, b) => a - b);   // valueOf makes the comparator trivial
```

## `Symbol.toPrimitive` — one method, all hints

```js
class Temperature {
  constructor(c) { this.c = c; }
  [Symbol.toPrimitive](hint) {
    if (hint === "number") return this.c;
    if (hint === "string") return `${this.c}°C`;
    return this.c;                     // "default": + and ==
  }
}
```

When present it wins over both `toString` and `valueOf`. Returning a non-primitive throws a `TypeError`. Use it when the two-method dance is not expressive enough (a default that differs from number), otherwise `toString`/`valueOf` read more plainly.

## `toJSON`

`JSON.stringify` calls `toJSON()` if present and serialises **its return value** instead of the object — `Date` uses this to emit an ISO string. Return a plain object or a primitive; return `undefined` to omit the value entirely. This is also how you expose a class's private state to JSON deliberately (`#fields` are invisible otherwise), and how you drop derived or sensitive fields.

```js
class User {
  #passwordHash;
  constructor(name, hash) { this.name = name; this.#passwordHash = hash; }
  toJSON() { return { name: this.name, kind: "user" }; }
}
JSON.stringify([new User("ada", "…")]);   // [{"name":"ada","kind":"user"}]
```

The second argument of `JSON.stringify` (a **replacer** function or an allow-list array) and of `JSON.parse` (a **reviver**) do the same job from the outside — `JSON.parse(text, (k, v) => k === "when" ? new Date(v) : v)` is how dates come back to life.

## `Symbol.toStringTag` and inspection

`Object.prototype.toString.call(x)` returns `"[object Array]"`, `"[object Date]"`, `"[object Null]"` — the most reliable built-in type test there is, and it reads a class's `get [Symbol.toStringTag]() { return "Money"; }` to give `"[object Money]"`. Node's `console.log` and `util.inspect` also honour a custom `[Symbol.for("nodejs.util.inspect.custom")]` method for how an instance prints in the REPL. Neither replaces `instanceof`; they make logs readable.

## Common mistakes

- `defineProperty` without `enumerable: true`/`writable: true` when you wanted a normal property.
- Copying an object with getters via spread and being surprised the copy has plain values.
- `toString` returning a non-string, or `valueOf` returning an object (falls through to `toString` — confusing).
- Relying on `+` calling `toString` (it calls `valueOf` first).
- Assuming `JSON.stringify` will see private fields or methods.

## Interview angle

- *"What are the property attributes?"* `writable`, `enumerable`, `configurable` (plus `get`/`set` for accessors); `defineProperty` defaults them to false.
- *"`Object.freeze` versus `seal` versus `preventExtensions`?"* No writes/no deletes/no adds versus no deletes/no adds versus no adds.
- *"How does `${obj}` decide what to print?"* ToPrimitive with hint string: `Symbol.toPrimitive` if any, else `toString`, else `valueOf`.
- *"How do you customise `JSON.stringify` for a class?"* `toJSON()` returning the shape to serialise; a replacer from outside.
- *"Why does `Object.keys(instance)` not list methods?"* Class methods are defined non-enumerable on the prototype.

## Key takeaways

- Descriptors: `writable`/`enumerable`/`configurable`; literals default true, `defineProperty` defaults false; accessors have `get`/`set`.
- `preventExtensions` ⊂ `seal` ⊂ `freeze`, all shallow; class methods are non-enumerable.
- ToPrimitive: `Symbol.toPrimitive(hint)` wins; else string hint → `toString` first, number/default → `valueOf` first; `+` and `==` use default.
- `toJSON` decides what `JSON.stringify` sees; replacers and revivers do it from outside.
- `Symbol.toStringTag` labels `[object X]`; none of these replace `instanceof`.
