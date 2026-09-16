---
title: The prototype chain — how JavaScript objects inherit
minutes: 13
---
JavaScript has no classes in the Java sense — `class` is syntax over something older and simpler. Every object has a hidden link to another object, its **prototype**; when you read a property the object does not have, the engine follows the link and looks there, then at *that* object's prototype, and so on until it hits `null`. That walk is the whole inheritance system. Methods live once on a shared prototype rather than being copied into every instance, `instanceof` is a question about that chain, and half the "why does `toString` exist on my empty object" surprises are answered by drawing it. This lesson makes the chain explicit: how to read and set it, how lookup and shadowing work, and the built-in chains you are already standing on.

## Every object has a prototype

```js
const animal = { eats: true, describe() { return `${this.name} eats: ${this.eats}`; } };
const rabbit = Object.create(animal);          // rabbit's prototype is animal
rabbit.name = "Peter";

rabbit.eats;                    // true — not on rabbit; found on animal
rabbit.describe();              // "Peter eats: true" — this is rabbit, the object the call started from
Object.getPrototypeOf(rabbit) === animal;      // true
Object.getPrototypeOf(animal) === Object.prototype;   // true — literals inherit from Object.prototype
Object.getPrototypeOf(Object.prototype);       // null — the end of every chain
```

`Object.create(proto)` makes an empty object whose prototype is `proto`. `Object.getPrototypeOf(obj)` reads the link; `Object.setPrototypeOf(obj, proto)` rewrites it (slow — engines deoptimise objects whose prototype changes after creation; set it at creation instead). The `__proto__` accessor (`rabbit.__proto__`) is the legacy spelling of the same link; read it in the console, do not write it in code.

## Lookup and shadowing

Reading `obj.x` checks `obj`'s **own** properties first, then walks up. Writing `obj.x = v` always creates or updates an own property on `obj` — it never modifies the prototype — so a write on an instance **shadows** the inherited value:

```js
rabbit.eats = false;    // own property now; animal.eats is still true
delete rabbit.eats;     // the shadow goes; rabbit.eats reads true again from animal
```

That asymmetry is why `Object.hasOwn(obj, key)` and `in` give different answers: `"eats" in rabbit` is `true` (found on the chain), `Object.hasOwn(rabbit, "eats")` is `false` until it is shadowed. `for…in` walks inherited *enumerable* properties too — one more reason `Object.keys` (own, enumerable) is the loop you want.

Two subtleties. Getters and setters on the prototype run with `this` set to the receiver — a prototype setter does not create a shadow; it runs. And a method found up the chain is called with `this` being the object you started from, which is exactly what makes shared methods work on per-instance data.

## The chains you already use

```js
Object.getPrototypeOf([]) === Array.prototype;             // then Object.prototype, then null
Object.getPrototypeOf(function () {}) === Function.prototype;
Object.getPrototypeOf("s") === String.prototype;           // primitives are boxed for the lookup
Object.getPrototypeOf(Object.create(null));                // null — an object with NO prototype
```

`[1, 2].map` is found on `Array.prototype`; `"abc".toUpperCase` on `String.prototype` after a temporary box; `{}.toString` on `Object.prototype`. `Object.create(null)` produces a true dictionary with nothing inherited — no `toString`, no `constructor`, no `__proto__` hazard — which is why it appears in code that maps untrusted keys.

## `instanceof` is a chain question

`x instanceof F` asks: does `F.prototype` appear anywhere in `x`'s prototype chain? Nothing about "type", nothing about how `x` was made:

```js
rabbit instanceof Object;   // true — Object.prototype is on the chain
[] instanceof Array;        // true
Object.create(null) instanceof Object;   // false — empty chain
```

The next lesson connects this to constructor functions (`F.prototype` is the object `new F()` installs as the prototype). `Symbol.hasInstance` lets a class customise the check — rare, but it is why `instanceof` can lie.

## Modifying built-in prototypes

`Array.prototype.last = function () { return this[this.length - 1]; }` works — every array gains `last`. It is also how libraries have broken each other for twenty years: two of them define `last` differently, a future standard adds a real `last` with other semantics, `for…in` over arrays starts yielding `"last"`. Polyfills (adding a *standard* method that an old engine lacks) are the accepted exception; anything else is a hazard. Write a function that takes the array.

## Prototype pollution

When object keys come from user input — `settings[userKey] = value`, a deep merge of a parsed JSON body — a key of `"__proto__"` can write to `Object.prototype` itself, and every object in the process suddenly has that property. Guards: `Object.create(null)` for dictionaries, `Map` for anything keyed by input, and merge functions that skip `__proto__`, `constructor` and `prototype`. Several real CVEs in popular libraries were exactly this.

## Common mistakes

- Expecting `obj.x = 1` to change the prototype's `x` — it shadows on the instance.
- Using `for…in` on objects that have (or might gain) inherited enumerable properties.
- `Object.setPrototypeOf` on hot objects — set the prototype at creation.
- Extending `Object.prototype` or `Array.prototype` with helpers.
- Thinking `instanceof` checks a class name; it checks a prototype object, which fails across two copies of a library.

## Interview angle

- *"How does inheritance work in JavaScript?"* Delegation: every object links to a prototype; missing properties are looked up along the chain to `null`.
- *"Difference between `__proto__` and `prototype`?"* `__proto__` is an object's link to its prototype; `prototype` is a property of functions — the object `new F()` will link to. (Next lesson.)
- *"What does `instanceof` check?"* Whether `F.prototype` is on the object's chain.
- *"How do you create an object with no prototype, and why?"* `Object.create(null)` — a clean dictionary immune to inherited names and pollution.
- *"What is prototype pollution?"* Writing through `__proto__` from untrusted keys so `Object.prototype` gains properties.

## Key takeaways

- Every object has a prototype link; reads walk it, writes never do — they shadow on the instance.
- `Object.create(proto)`, `Object.getPrototypeOf`, `Object.hasOwn` versus `in`, `Object.keys` for own enumerable.
- Built-ins: arrays → `Array.prototype` → `Object.prototype` → `null`; primitives box for the lookup.
- `instanceof` = "is `F.prototype` on the chain"; `Object.create(null)` has an empty chain.
- Never extend built-in prototypes; guard user-supplied keys against `__proto__`.
