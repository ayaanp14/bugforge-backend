---
title: Checkpoint — Enums & records
minutes: 22
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
