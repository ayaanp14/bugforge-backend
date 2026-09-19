---
title: Hashing and keys — what makes an object usable in a dict or set
minutes: 13
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
