---
title: Checkpoint — Prototypes and classes
minutes: 24
seo-title: JavaScript Classes Quiz: Prototypes, new and super Practice
description: Test JavaScript prototypes and classes with 12 questions and three programs: the prototype chain, new, private fields, extends, super and descriptors.
q: What happens when you assign to an inherited property in JavaScript?
a: The write creates or updates an own property on the object and never changes the prototype, so the new value shadows the inherited one; deleting the own property makes the inherited value visible again. The exception is a setter on the prototype, which runs instead.
q: What happens when a JavaScript constructor returns an object?
a: That object becomes the result of `new`, and the freshly created instance is discarded. A returned primitive is ignored, and `new` returns the new instance as usual.
q: Which method runs for `${x}` and which for `x + 1`?
a: If `Symbol.toPrimitive` is defined it runs for both, with the hint `"string"` for the template literal and `"default"` for `+`. Without it, `${x}` calls `toString` first and `x + 1` calls `valueOf` first.
---
This checkpoint covers the prototype chain and lookup, `Object.create`, shadowing, `instanceof`; constructor functions and the four steps of `new`; class syntax with fields, private members, accessors and statics; `extends`, `super`, construction order and extending built-ins; property descriptors and the conversion protocols.

**How it works.** Twelve questions and three programs; 70% on the questions and every program accepted clears the module.

**Before you start**, make sure you can answer:

- What a write to an inherited property does, and how `in`, `Object.hasOwn` and `Object.keys` differ.
- The four steps of `new`, and what happens when a constructor returns an object.
- Where fields, methods and statics live; what `#private` guarantees; why methods passed as callbacks lose `this`.
- Why `super()` must come first, when subclass fields initialise, and what `super.method()` looks up.
- The three descriptor flags and their defaults; which of `toString`/`valueOf`/`Symbol.toPrimitive` runs for `${x}` and for `x + 1`.

The programs are an inventory built from a small class hierarchy with private state and JSON output, an event emitter with `on`/`once`/`off`/`emit` semantics, and a linked list class with a `size` accessor, static `from`, and `toString`.
