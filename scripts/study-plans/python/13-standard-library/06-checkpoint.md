---
title: Checkpoint — The standard library in depth
minutes: 22
seo-title: Python Standard Library Quiz: datetime, Decimal and Enums
description: Test yourself: 12 questions and three programs on Python's math, statistics, Decimal and random, datetime and zoneinfo, collections, text tools and enums.
q: Why is `Decimal("0.1")` right and `Decimal(0.1)` wrong?
a: `Decimal(0.1)` converts the float, which already carries binary error, so it holds 0.1000000000000000055511151231257827… exactly. `Decimal("0.1")` is exactly one tenth. Build decimals from strings, then round with `quantize(Decimal("0.01"))`, which takes a pattern for the number of places and an optional rounding mode.
q: Which `OrderedDict` method makes an LRU cache possible?
a: `move_to_end(key)`, which moves a key to the end in O(1), so the most recently used entry is always last. Together with `popitem(last=False)`, which removes the entry at the front, it gives O(1) updates and eviction; a plain dict has no `move_to_end`, and its `popitem` removes only the last entry.
q: What is the difference between `astimezone` and `replace(tzinfo=...)`?
a: `astimezone(zone)` converts an instant, changing the clock reading so it shows the same moment in another zone. `replace(tzinfo=zone)` keeps the reading and only labels it with a zone, which is right for attaching a zone to a naive value a user entered and wrong for converting.
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
