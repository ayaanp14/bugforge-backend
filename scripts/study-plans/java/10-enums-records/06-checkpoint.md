---
title: Checkpoint — Enums & records
minutes: 22
seo-title: Java Enums and Records Quiz: EnumSet and EnumMap Practice
description: Test your Java enum and record skills with 12 questions and two programs on enum methods and behaviour, EnumSet, EnumMap, records and compact constructors.
q: What does `Day.valueOf("friday")` do when the constant is FRIDAY?
a: It throws `IllegalArgumentException`, because `valueOf` matches the exact, case-sensitive constant name. Normalise the input first with `trim().toUpperCase(Locale.ROOT)` and catch the exception, or write a lenient lookup method.
q: What does a Java record generate, and what does it forbid?
a: From its header a record generates a `private final` field per component, a canonical constructor, accessors named after the components, and `equals`, `hashCode` and `toString`. It forbids instance fields beyond the components and an `extends` clause; its fields are final, so it has no setters.
q: Why should a record copy its List components?
a: A record's fields are final, but a `List` it holds can still be changed by whoever passed it in. Copying it in the compact constructor with `members = List.copyOf(members)` stores an immutable copy, so the record stays immutable all the way down.
---
This checkpoint covers plain enums, enums with state and behaviour, `EnumSet`/`EnumMap`, records, and the practical record patterns.

**How it works.** Twelve questions and two programs; 70% on the questions and both programs accepted clears the module.

**Before you start**, make sure you can answer:

- Why `==` is right for enums, and what `valueOf("friday")` does.
- Why an enum constructor cannot read a static field, and how a `fromCode` lookup is built.
- What `EnumSet` and `EnumMap` are made of and why they beat hash collections.
- Everything a record generates, and the two things it forbids.
- What a compact constructor can do, and why a `List` component should be copied.

The programs are an enum with per-constant behaviour driving a small calculator, and a record-based model with validation and grouping into an `EnumMap`.
