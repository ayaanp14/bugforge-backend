---
title: Checkpoint — Interfaces
minutes: 22
---
This checkpoint covers interface basics, default/static/private methods and conflict resolution, functional interfaces, `Comparable` and `Iterable`, and sealed interfaces.

**How it works.** Twelve questions and two programs; 70% on the questions and both programs accepted clears the module.

**Before you start**, make sure you can answer:

- What an interface may contain, and why implementing methods must be `public`.
- The three rules for resolving two defaults with the same signature.
- What makes an interface functional, and what `@FunctionalInterface` enforces.
- Why `compareTo` should agree with `equals`, and which collections rely on it.
- What `Iterable` requires, and what `next()` must do past the end.
- What `sealed … permits` buys, and the modifiers a permitted type needs.

The programs are an `Iterable` type with a natural order, and a strategy-style interface implemented by several small classes and a lambda.
