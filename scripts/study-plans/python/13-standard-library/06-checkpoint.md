---
title: Checkpoint — The standard library in depth
minutes: 22
---
This checkpoint covers the whole module: `math`, `statistics`, `Fraction`, `Decimal` and seeded `random`; `datetime` arithmetic, parsing and formatting, aware datetimes and `zoneinfo`; `deque`, `Counter` arithmetic, `OrderedDict` for an LRU cache, `ChainMap` and `namedtuple`; `textwrap`, `difflib`, `string.Template` and the deeper `re` features; and enums with `auto`, `IntEnum`, `StrEnum` and `Flag`.

**How it works.** Twelve questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- Which `statistics` function is the sample standard deviation, and what does an empty input do?
- Why is `Decimal("0.1")` right and `Decimal(0.1)` wrong, and what does `quantize` take?
- What does seeding `random.Random(42)` guarantee, and why prefer an instance to the module functions?
- What is the difference between `astimezone` and `replace(tzinfo=…)`?
- Which `OrderedDict` method makes an LRU cache possible?
- What does `Counter(a) - Counter(b)` drop?
- Why is `Status.ACTIVE == "active"` false for a plain `Enum`, and which enum class makes it true?

The three programs are a statistics report built with exact and rounded arithmetic, a schedule calculator that converts between time zones and adds durations, and an LRU cache on `OrderedDict` driven by commands with an enum for the operation names.
