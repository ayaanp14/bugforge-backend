---
title: Hashing and keys — what makes an object usable in a dict or set
minutes: 13
seo-title: What Is Hashable in Python? Why Lists Cannot Be Dict Keys
description: Dicts and sets hash a key to a slot, so equal keys must hash equally and never change. Why lists are unhashable, and how to make your own class a valid key.
question: What does hashable mean in Python?
answer: An object is hashable in Python when it has a hash value that never changes while it is in use and it compares with `==`, so that equal objects hash equally. Dicts and sets use that hash to find a key's slot in O(1) average time. Immutable built-ins such as `int`, `str`, `frozenset` and tuples of hashables are hashable; `list`, `dict` and `set` are not.
q: Why can't a list be a dictionary key in Python?
a: A list is mutable, so its hash would change whenever its contents did, and a dict that stored it under the old hash could never find it again. Python therefore makes lists unhashable and raises `TypeError: unhashable type: 'list'`; use a tuple as the key instead.
q: How do I make a custom class hashable in Python?
a: Define `__hash__` alongside `__eq__`, returning the hash of a tuple of exactly the fields `__eq__` compares, such as `hash((self.x, self.y))`. Defining `__eq__` alone sets `__hash__` to `None` and makes instances unhashable; `@dataclass(frozen=True)` writes both methods for you.
q: How does a Python dictionary work internally?
a: A dict is a hash table. Inserting a key computes `hash(key)`, reduces it to a slot index and stores the key and value there, probing onward on a collision; a lookup repeats the calculation and compares with `==` only in the probed slots. The table resizes as it fills, so operations stay O(1) on average.
q: Why does hash() of a string change between runs?
a: CPython salts string hashing with a random seed at start-up to defeat collision attacks, so `hash("a")` is stable within one process but differs between processes. Never print, store or compare string hashes across runs; ints and tuples of ints hash the same every time.
q: Why does `{1: "a", True: "b"}` have only one key?
a: Because `1 == True` and `hash(1) == hash(True)`, the dict treats them as the same key: the second value replaces the first and the key stays `1`. The same goes for `1.0`, which also equals 1 and hashes equally.
---
Dictionaries and sets are fast because they do not search; they *hash*. A key's hash — an integer computed from its value — picks a slot in a table, and equality is checked only against the one or two keys that landed there. That design imposes one rule on keys, explains why lists cannot be keys and tuples can, decides how your own classes behave as keys, and is the reason string hashes are randomised. This lesson explains the mechanism at the level an interviewer expects, states the hash/equality contract, shows what the built-in types do, and what to define in a class of your own.

## The mechanism

```text
d["ada"]:  hash("ada") -> 3 971 …  -> slot 7 of the table -> is the key there == "ada"?  -> yes -> its value
```

A dict is an array of slots. Inserting a key computes `hash(key)`, reduces it to an index, and stores the key and value there (probing to the next slot on a collision). Looking up repeats the computation and compares with `==` only against keys in the probed slots. On average that is O(1) whatever the size; the table is resized when it gets too full, so amortised insertion stays O(1). Since 3.6 CPython keeps a separate dense array of entries in insertion order, which is why iteration order is insertion order at no cost.

The worst case — every key hashing to the same slot — degrades to O(n) per operation, which is why hash functions are chosen to spread keys, and why a key type with a constant `__hash__` is a performance bug.

## The contract

For hashing to work, two objects that are equal must hash equally:

> If `a == b` then `hash(a) == hash(b)`.

The converse is not required (unequal objects may collide). And a key's hash must **not change** while it is in a table — the table stored it under the old hash and would never find it again. That is why keys must be immutable in the respects that affect equality, and why a class that is mutable should not be hashable at all.

## What the built-ins do

| Type | Hashable? | Why |
| --- | --- | --- |
| `int`, `float`, `bool`, `str`, `bytes`, `None` | yes | immutable; `hash(1) == hash(1.0) == hash(True)` because they compare equal |
| `tuple` | yes, if every element is | its hash combines the elements' hashes |
| `frozenset` | yes | immutable |
| `list`, `dict`, `set`, `bytearray` | **no** | mutable — the hash would change |
| user-defined class instances | yes, by default | hashed by *identity* (`id`), and equal only to themselves |

`hash(1) == hash(1.0)` and `1 == 1.0` together mean `{1: "a", 1.0: "b"}` has one key. `hash("a")` is stable within one process and different between processes: CPython salts string hashing with a random seed at start-up to defeat collision attacks on web servers, so `hash("a")` is not a value to print, store or compare across runs. Set iteration order for strings follows from this (lesson 3).

## Your own classes as keys

By default an instance hashes by identity and `==` is identity, so two `Point(1, 2)` objects are different keys. Defining `__eq__` to compare by value **removes** the default `__hash__` — Python sets it to `None`, because value equality with identity hashing would break the contract — and instances become unhashable until you define `__hash__` too:

```python
class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __eq__(self, other):
        if not isinstance(other, Point):
            return NotImplemented
        return (self.x, self.y) == (other.x, other.y)

    def __hash__(self):
        return hash((self.x, self.y))       # combine the fields that define equality
```

The pattern: hash the tuple of exactly the attributes that `__eq__` compares. A `@dataclass(frozen=True)` (Module 8) writes both methods for you and makes the fields read-only, which is the safest way to get a value-type key; `@dataclass(eq=True)` without `frozen` gives `__eq__` and an *unhashable* class, by the same rule.

## Keys in practice

- **Tuples as compound keys.** `visited[(r, c)]`, `distances[(a, b)]`, `counts[(word, year)]` — cheap, ordered, hashable. The parentheses are optional in a subscript: `d[r, c]` is `d[(r, c)]`.
- **Normalised strings.** `d[name.casefold()]` so that "Ada" and "ada" share an entry; normalise once at the boundary.
- **frozenset for unordered groups.** A key that means "these three people, in any order".
- **Never floats that are computed.** `d[0.1 + 0.2]` and `d[0.3]` are different keys (Module 2); round or use integer cents.
- **Never a mutable object**, even one you promise not to change.

## hash() and the dunders

`hash(x)` calls `x.__hash__()`. `hash` of a tuple of hashables combines them deterministically for a given process (ints and tuples of ints are stable across runs; anything containing a string is not). `__eq__` returning `NotImplemented` for a foreign type lets Python try the reflected comparison and finally fall back to identity, which is the correct behaviour for `point == 5`.

## Pitfalls

- A list, set or dict as a key or set element.
- Defining `__eq__` without `__hash__` and then using the instances as keys — `TypeError: unhashable type`.
- Hashing attributes that `__eq__` does not compare (or the reverse) — breaks the contract.
- Mutating an object after using it as a key.
- Printing or persisting `hash("text")`.
- `{1: "a", True: "b"}` having one key.

## Key takeaways

- Dicts and sets hash a key to a slot and compare with `==` only there: O(1) average, O(n) only under pathological collisions.
- Contract: equal objects hash equal; a key's hash must not change while stored — hence immutable keys.
- Immutable built-ins and tuples/frozensets of them are hashable; lists, dicts, sets are not; instances hash by identity unless `__eq__`/`__hash__` say otherwise.
- Define `__hash__` as `hash(tuple_of_the_compared_fields)` alongside `__eq__`, or use `@dataclass(frozen=True)`.
- String hashes are randomised per process — never print, store or order by them.
