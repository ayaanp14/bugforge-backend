---
title: Checkpoint — Prototypes and classes
minutes: 24
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
