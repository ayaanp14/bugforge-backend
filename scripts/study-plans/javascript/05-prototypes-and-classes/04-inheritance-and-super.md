---
title: Inheritance — extends, super, overriding and extending built-ins
minutes: 13
---
`extends` links two prototype chains: the subclass's prototype inherits from the parent's prototype (so instances find parent methods), and the subclass constructor inherits from the parent constructor (so statics are found too). `super` is the keyword for reaching the parent from either place. The rules are few but strict — call `super()` before touching `this`, fields initialise after it, `super.method()` uses the *home object* not the receiver — and the lesson closes with the two things people actually do with inheritance in JavaScript: extend `Error`, `Map` and `Array`, and prefer composition for everything else.

## The two chains `extends` creates

```js
class Shape {
  constructor(name) { this.name = name; }
  area() { return 0; }
  describe() { return `${this.name} with area ${this.area().toFixed(2)}`; }
  static create(...args) { return new this(...args); }
}
class Circle extends Shape {
  constructor(r) {
    super("circle");        // must run before any use of this
    this.r = r;
  }
  area() { return Math.PI * this.r ** 2; }                        // override
  describe() { return super.describe() + ` (r=${this.r})`; }      // extend the parent's version
}

const c = new Circle(1);
Object.getPrototypeOf(Circle.prototype) === Shape.prototype;   // instance chain: c → Circle.prototype → Shape.prototype → Object.prototype
Object.getPrototypeOf(Circle) === Shape;                       // static chain: Circle → Shape → Function.prototype
Circle.create(2) instanceof Circle;                            // true — static this is Circle
c instanceof Shape;                                            // true
```

Overriding is just shadowing on the nearer prototype: `c.area` finds `Circle.prototype.area` first. `describe`, found on `Shape.prototype`, calls `this.area()` — and `this` is `c`, so it dispatches to the override. That late binding is the entire point of polymorphism, and it needs no annotations.

## `super()` and construction order

In a derived class the `this` object is created by the **base** constructor — `super()` is the call that creates it — so:

- A derived constructor **must** call `super()` before reading or writing `this` (`ReferenceError: Must call super constructor in derived class before accessing 'this'`).
- A derived class with no constructor gets `constructor(...args) { super(...args); }` for free.
- The derived class's **fields initialise right after `super()` returns**, before the rest of the constructor body. So if a base constructor calls an overridden method, that method runs before the subclass's fields exist:

```js
class Base { constructor() { this.init(); } init() {} }
class Derived extends Base {
  value = 42;
  init() { console.log(this.value); }     // logs undefined — field not yet initialised
}
new Derived();
```

The fix is a design rule, not a trick: base constructors do not call overridable methods.

## `super.method()` and the home object

`super.describe()` looks up `describe` on the **prototype of the class where the method was written** (the *home object*), not on `this`'s prototype. That is what makes two levels of overriding work — each `super` call climbs exactly one level from where it was written, regardless of how deep the receiver's class is. It also means `super` in a method copied to another object still refers to the original parent. Static methods can use `super.staticMethod()` too, climbing the static chain.

## Extending built-ins

```js
class HttpError extends Error {
  constructor(status, message) {
    super(message);                       // sets message and captures the stack
    this.name = "HttpError";              // otherwise the stack says "Error"
    this.status = status;
  }
}
try { throw new HttpError(404, "no such page"); }
catch (e) { e instanceof HttpError && e instanceof Error; }   // true

class DefaultMap extends Map {
  constructor(makeDefault) { super(); this.makeDefault = makeDefault; }
  get(key) { if (!this.has(key)) this.set(key, this.makeDefault()); return super.get(key); }
}

class Stack extends Array {
  peek() { return this[this.length - 1]; }
}
const s = Stack.from([1, 2, 3]);
s.map((x) => x * 2) instanceof Stack;     // true — array methods build the subclass via Symbol.species
Array.isArray(s);                         // true
```

Subclassing `Error` is the one inheritance every codebase needs (module 7 goes deep). `Map`/`Set` subclasses work cleanly. `Array` subclasses work but carry the `Symbol.species` machinery (methods return the subclass) and were impossible before 2015 — prefer a class that *holds* an array unless you truly want array behaviour. `Promise` subclasses are legal and almost never worth it.

## Mixins: multiple inheritance by function

JavaScript has single inheritance; a mixin is a function from class to class:

```js
const Serializable = (Base) => class extends Base {
  toJSON() { return { ...this, kind: this.constructor.name }; }
};
const Comparable = (Base) => class extends Base {
  compareTo(other) { return this.valueOf() - other.valueOf(); }
};
class Money extends Serializable(Comparable(Object)) { /* … */ }
```

Each application inserts one prototype into the chain. Use sparingly — three mixins deep and nobody knows where a method comes from.

## Composition over inheritance

A class hierarchy is right when subclasses are genuinely *kinds of* the parent, share most behaviour, and the hierarchy is shallow (one or two levels). It is wrong when you reach for it to share a utility method, when the "is-a" is a stretch (`Button extends Rectangle`), or when the tree keeps growing sideways. The alternative is holding an instance of the thing and delegating (`this.logger.log(...)`), or passing behaviour in as functions. Most production JavaScript has few deep hierarchies and many small classes that *contain* other objects.

## Common mistakes

- Using `this` before `super()`; forgetting `super(...args)` when you add a constructor.
- Base constructors calling methods the subclass overrides (fields are not ready).
- Forgetting `this.name = "…"` in an `Error` subclass, so logs say `Error`.
- Overriding a method without calling `super.method()` when the parent's version did required work.
- Deep hierarchies for code reuse; `extends Array` when an array field would do.

## Interview angle

- *"What does `extends` set up?"* Two prototype links: `Sub.prototype → Base.prototype` for instances and `Sub → Base` for statics.
- *"Why must `super()` be called first?"* The base constructor creates `this`; before it there is no object.
- *"How does method overriding dispatch?"* Property lookup finds the nearest prototype's version; `this` is the receiver, so parent code calls child overrides.
- *"How do you make a custom error?"* `class X extends Error`, `super(message)`, set `name`, add fields.
- *"Inheritance versus composition?"* Extend for real is-a relationships, shallow; otherwise hold and delegate.

## Key takeaways

- `extends` links instance and static chains; `instanceof` follows the instance chain.
- `super()` first in derived constructors; fields initialise after it; base constructors should not call overridables.
- `super.method()` climbs one level from where the method was written (home object).
- Extend `Error` (set `name`), `Map`/`Set` freely; `Array` works via `Symbol.species` but usually hold an array instead.
- Mixins are functions from class to class; prefer composition for sharing behaviour.
