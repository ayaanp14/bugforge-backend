---
title: Constructor functions and what `new` really does
minutes: 12
---
Before `class` (2015) every "class" in JavaScript was a plain function called with `new`, and that machinery is still what `class` compiles down to. Understanding it explains the odd vocabulary — why functions have a `.prototype` property, what `constructor` is, why forgetting `new` used to silently corrupt the global object — and it is the direct answer to a favourite interview question: *implement `new` yourself*. This lesson does exactly that, then compares constructors with the factory-function alternative so you can argue for either.

## A function used as a constructor

```js
function Point(x, y) {
  this.x = x;
  this.y = y;
}
Point.prototype.dist = function () { return Math.hypot(this.x, this.y); };

const p = new Point(3, 4);
p.dist();                                   // 5
Object.getPrototypeOf(p) === Point.prototype;   // true
p.constructor === Point;                    // true — inherited from Point.prototype.constructor
```

Nothing marks `Point` as special; capitalising it is a convention that says "call me with `new`". Every function created with `function` gets a `.prototype` property automatically — a plain object holding one property, `constructor`, pointing back at the function. Methods go on that object once and are shared by every instance through the chain. Arrow functions and methods have no `.prototype` and cannot be `new`ed.

## The four steps of `new`

`new F(args)` does, precisely:

1. Create a fresh object whose prototype is `F.prototype`.
2. Call `F` with `this` bound to that object and the arguments passed.
3. If `F` returns an **object**, that object is the result.
4. Otherwise (it returned `undefined` or a primitive) the fresh object is the result.

Written out:

```js
function construct(F, ...args) {
  const obj = Object.create(F.prototype);        // step 1
  const result = F.apply(obj, args);             // step 2
  return result !== null && (typeof result === "object" || typeof result === "function") ? result : obj;   // 3 and 4
}
```

Step 3 is the trapdoor: a constructor that `return`s an object hands back *that* object — the instance is discarded. Used rarely and deliberately (returning a cached instance, a proxy), it is otherwise a bug. A returned primitive is ignored. Modern code would write `Reflect.construct(F, args)` instead of the hand version, but the hand version is what the interviewer wants to see.

## `new.target`, and the forgotten `new`

Call `Point(1, 2)` without `new` and `this` is `undefined` in strict mode — `this.x = x` throws. In sloppy mode `this` was the global object, so `x` and `y` quietly became globals: the classic pre-2015 bug. `new.target` inside a function is the constructor being `new`ed, or `undefined` when called plainly — the guard, if you want one:

```js
function Point(x, y) {
  if (!new.target) return new Point(x, y);      // tolerate a missing new
  this.x = x; this.y = y;
}
```

Classes refuse outright: calling a class without `new` throws `TypeError: Class constructor Point cannot be invoked without 'new'`.

## The `constructor` property

`Point.prototype.constructor === Point` by default, and instances inherit it — `p.constructor.name` is `"Point"`, and `new p.constructor(0, 0)` makes another of "whatever `p` is". It is only a convention: replacing the whole prototype object (`Point.prototype = { dist() {} }`) loses it unless you put it back, and nothing stops anyone assigning `p.constructor = Array`. Do not use it for type checks; use `instanceof`, or better, duck typing.

## Factory functions — the other way

```js
function makePoint(x, y) {
  return { x, y, dist() { return Math.hypot(x, y); } };
}
const q = makePoint(3, 4);
```

No `new`, no `this`, no prototype — the object is built and returned. Trade-offs:

| | constructor / class | factory |
| --- | --- | --- |
| Methods | shared on the prototype — one copy | recreated per object (closures) — memory per instance |
| Privacy | `#fields` (classes) | free — closure variables are private |
| `instanceof` | works | no (duck type instead) |
| Forgetting `new` | throws (class) or corrupts (sloppy function) | not an issue |
| `this` pitfalls | detached methods lose `this` | none — closures capture what they need |

Factories are excellent for small objects and for anything passed around as callbacks; classes win when many instances share behaviour and identity matters. Both are idiomatic; know why you picked one.

## Prototype gotchas that survive into classes

- Shared mutable state on the prototype (`Point.prototype.tags = []`) is shared by *every* instance — one `push` shows everywhere. Per-instance data goes in the constructor.
- Adding a method to `Point.prototype` after instances exist works — instances look up live.
- Replacing `Point.prototype` after instances exist does **not** re-link the old instances.
- `Point.prototype` is not the prototype *of* `Point`; `Object.getPrototypeOf(Point)` is `Function.prototype`. Two different links.

## Common mistakes

- Putting methods inside the constructor body (`this.dist = function…`) — a copy per instance for no reason (unless you need the closure).
- Checking type with `x.constructor === Foo` instead of `instanceof` or a duck-typed check.
- Returning `this` explicitly (harmless) — or accidentally returning an object literal (replaces the instance).
- Believing `new` is slow or "not real JavaScript" — it is a small, well-optimised protocol.

## Interview angle

- *"What does `new` do?"* Creates an object linked to `F.prototype`, calls `F` with it as `this`, returns the object unless `F` returned an object.
- *"Implement `new` without using it."* `Object.create(F.prototype)` + `F.apply` + the object-return check.
- *"Constructor versus factory?"* Shared prototype methods and `instanceof` versus closure privacy and no `this`.
- *"What is `new.target`?"* The constructor invoked with `new`, or `undefined` for a plain call.
- *"Why is `Function.prototype.prototype` `undefined`?"* Only ordinary `function`s and classes get a `.prototype` object; arrows and methods do not.

## Key takeaways

- A constructor is a plain function; `F.prototype` is the object its instances link to; `constructor` points back.
- `new`: create linked object → call with `this` → return it unless an object was returned.
- Strict mode/classes make a forgotten `new` throw; `new.target` detects it.
- Methods on the prototype are shared; per-instance state belongs in the constructor; never share mutable defaults on the prototype.
- Factories trade `instanceof` and shared methods for closure privacy and no `this`.
