---
title: Class syntax — fields, methods, statics, private and accessors
minutes: 14
---
`class` gives the constructor-and-prototype machinery a shape that reads like every other language, plus things the old syntax could not express: real private members, class fields with initialisers, static blocks. It is still prototypes underneath — `typeof Point` is `"function"`, methods land on `Point.prototype` — but the syntax also changes a few semantics (strict mode, no hoisting, throw without `new`). This lesson covers the complete surface as it runs on Node 16, with the corners that trip people: field initialisation order, `this` in methods passed as callbacks, and what `#private` actually guarantees.

## The full surface

```js
class Account {
  static count = 0;                       // static field — on the class, not instances
  static #registry = new Map();           // private static
  #balance = 0;                           // private instance field, initialised per instance
  owner;                                  // public field, undefined until assigned
  history = [];                           // public field with initialiser — a NEW array per instance

  constructor(owner, opening = 0) {
    this.owner = owner;
    this.#balance = opening;
    Account.count++;
    Account.#registry.set(owner, this);
  }

  deposit(amount) {                       // method — lives on Account.prototype
    if (amount <= 0) throw new RangeError("amount must be positive");
    this.#balance += amount;
    this.history.push(["deposit", amount]);
    return this;                          // fluent
  }

  get balance() { return this.#balance; }          // accessor — read like a property
  set nickname(v) { this._nick = String(v).trim(); }

  #audit(kind) { /* private method */ }

  static open(owner) { return new Account(owner); }   // static method — factory idiom
  static lookup(owner) { return Account.#registry.get(owner); }

  toString() { return `${this.owner}: ${this.#balance}`; }
}
```

## What the syntax changes

- **Strict mode** inside the class body, always.
- **Not hoisted** like a function declaration: `new Account()` before the `class` line is a `ReferenceError` (temporal dead zone, like `let`).
- **Must be called with `new`** — a plain call throws.
- **Methods are non-enumerable**: `Object.keys(new Account("a"))` lists fields, not methods; `for…in` skips them.
- **No commas** between members; semicolons after fields are optional but conventional.

## Fields and initialisation order

Public fields (`history = []`) are assigned on the instance **before** the constructor body runs (for a base class) — each instance gets its own value from re-evaluating the initialiser, which is why `history = []` is safe where `Account.prototype.history = []` would be shared. In a subclass, fields initialise right after `super()` returns (next lesson). Field initialisers can reference `this` and earlier fields. Arrow-function fields (`handle = () => {…}`) capture `this` per instance — the standard fix for methods handed to event listeners, at the cost of one closure per instance instead of one shared method.

## Private members

`#balance` is private in the strong sense: not a naming convention, not `_balance`, but a name the language checks at parse time. Outside the class body `acct.#balance` is a **SyntaxError**, not `undefined`; `Object.keys`, `JSON.stringify`, `for…in`, `Reflect.ownKeys` and Proxies cannot see it; a subclass cannot reach a parent's `#field`. Two classes with a `#x` each have different `#x`s. `#x in obj` (Node 16.4+) tests whether an object has the brand — the safe way to check "is this really one of ours" inside a static method. Because privates are per-class brands, an object created by another copy of the same class (two versions of a library) fails the check — the same failure mode `instanceof` has.

## Accessors

`get balance()` defines a read-only computed property; add `set balance(v)` for writes. Accessors sit on the prototype like methods. Use them for derived values and validated writes, not for wrapping every field Java-style — a public field is an honest public field. Accessors run code on every read; do not put anything expensive there.

## Statics

`static` members belong to the class object: `Account.count`, `Account.open("x")`. Inside a static method `this` is the class, which matters for subclasses: `static create() { return new this(); }` makes a `SavingsAccount` when called as `SavingsAccount.create()`. `static { … }` blocks (Node 16.11+) run once when the class is evaluated — for setup that needs several statements.

## Class expressions and names

```js
const Temp = class Temperature { };     // named expression: Temp.name is "Temperature"
const Anon = class { };                 // Anon.name is "Anon" (inferred)
const mixin = (Base) => class extends Base { };   // classes are values — pass and return them
```

## Methods as callbacks — `this` again

`button.on("click", acct.deposit)` detaches the method; inside, `this` is `undefined` (strict) and `this.#balance` throws. Fixes, in order of preference: an arrow at the call site (`() => acct.deposit(10)`), `acct.deposit.bind(acct)`, or an arrow-function field on the class when the method is *always* used as a callback. Module 3's five rules apply unchanged.

## Classes versus objects and closures

A class earns its keep when there will be many instances sharing behaviour, when identity (`instanceof`, brand checks) matters, or when a framework expects one. A module that exports functions over a closed-over state is often simpler than a singleton class; a plain object literal beats a class with one instance and no methods. "Prefer composition" is not anti-class — it is anti-*hierarchy*.

## Common mistakes

- `this.history = []` inside a method meant to append — reassigning instead of `push`.
- Forgetting that fields with initialisers make a new value per instance, and putting the shared cache in a field instead of a `static`.
- Reading a private of another object of the same class as `other.#x` — this *is* allowed (same class body); reading it outside the class is not.
- Passing `obj.method` as a callback and losing `this`.
- Defining a getter and then trying to assign to it without a setter — silently ignored in sloppy mode, `TypeError` in strict (which classes are).

## Interview angle

- *"Are classes just syntactic sugar?"* Mostly — prototypes underneath — but with real additions: private members, strict mode, no hoisting, `new` required, non-enumerable methods.
- *"`#private` versus `_private`?"* Language-enforced (SyntaxError outside, invisible to reflection) versus a naming convention.
- *"Where do fields versus methods live?"* Fields on the instance, methods on the prototype, statics on the class.
- *"Why arrow-function fields?"* Per-instance `this` capture for callbacks; cost: one closure per instance.
- *"When is `this` the class?"* In static methods — so `new this()` builds the subclass that was called.

## Key takeaways

- The surface: fields (public/private/static), methods, accessors, statics, static blocks, private methods.
- Classes are strict, not hoisted, throw without `new`, and have non-enumerable methods.
- Field initialisers run per instance before the constructor body; `history = []` is safe, prototype arrays are shared.
- `#names` are enforced privacy and per-class brands; `#x in obj` tests them.
- Methods passed as callbacks lose `this` — arrow at the call site, `bind`, or an arrow field.
