---
title: Designing a class — invariants, interfaces and a worked example
minutes: 14
---
The mechanics of classes are the previous five lessons; this one is about judgement. A class earns its existence by protecting an *invariant* — a fact about its data that every method maintains and every caller may assume — and by presenting a *small interface* that says what the object does rather than how it stores things. This lesson works through the design of one class, `Inventory`, from the questions to ask before writing it, through representation, constructor, invariants and interface, to the tests that pin it, and ends with the checklist that separates a class that helps from a class that merely groups functions.

## The questions before the code

1. **What is the invariant?** For an inventory: quantities are never negative; every listed item has a name and a price; the total value equals the sum over items.
2. **Is it a value or an entity?** A `Money` is a value — equal if the amounts are equal, immutable, hashable. An `Inventory` is an entity — it has a life cycle, is mutated, is equal only to itself.
3. **What must callers be able to do?** Add stock, remove stock (and be told if there is not enough), ask what is there, ask the total value. That is the interface; everything else is internal.
4. **What must callers *not* do?** Set a quantity negative, corrupt the total, depend on the storage layout.

If there is no invariant and no behaviour — just fields — the answer is a dataclass, or a dict, not a class with methods.

## Representation

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class Item:                       # a value: what an item *is*
    name: str
    price_cents: int

class Inventory:                  # an entity: what the stock *does*
    def __init__(self):
        self._stock: dict[str, tuple[Item, int]] = {}   # name -> (item, quantity)
```

The storage is a dict keyed by name because lookups by name are what the operations need; it is prefixed with an underscore because no caller should touch it; the value type is a tuple of the item and its count. Prices are integer cents (Module 2). The representation is chosen for the *operations*, and it can change later without changing the interface.

## Constructor and invariants

```python
    def add(self, item: Item, quantity: int = 1) -> None:
        if quantity <= 0:
            raise ValueError(f"quantity must be positive, got {quantity}")
        _, current = self._stock.get(item.name, (item, 0))
        self._stock[item.name] = (item, current + quantity)

    def remove(self, name: str, quantity: int = 1) -> None:
        if name not in self._stock:
            raise KeyError(name)
        item, current = self._stock[name]
        if quantity > current:
            raise ValueError(f"only {current} {name} in stock, cannot remove {quantity}")
        if current == quantity:
            del self._stock[name]
        else:
            self._stock[name] = (item, current - quantity)
```

Every path that changes `_stock` checks the invariant before changing anything, so a failed call leaves the inventory exactly as it was — the *strong guarantee*, which is easy here because each method makes one assignment after all its checks. The exceptions are the built-in ones with the right meaning (`ValueError` for a bad value, `KeyError` for a missing key) and carry messages a caller can act on; Module 10 discusses custom exceptions for when these are not specific enough.

## Interface

```python
    def quantity(self, name: str) -> int:
        item_and_count = self._stock.get(name)
        return item_and_count[1] if item_and_count else 0

    def total_value_cents(self) -> int:
        return sum(item.price_cents * n for item, n in self._stock.values())

    def __len__(self) -> int:              # number of distinct items
        return len(self._stock)

    def __contains__(self, name: str) -> bool:
        return name in self._stock

    def __iter__(self):                    # (item, quantity) pairs, by name
        for name in sorted(self._stock):
            yield self._stock[name]

    def __repr__(self) -> str:
        return f"Inventory({len(self)} items, {self.total_value_cents()} cents)"
```

Queries are read-only methods with clear names; the dunders make the object usable with `len`, `in` and `for` (Module 8 lesson 2). Note what is *not* there: no `get_stock()` returning the dict (that would hand the invariant to the caller), no `set_quantity` (the operations are add and remove, which is what the domain has). Iteration sorts by name so that output is deterministic. A `report()` that prints would be a mistake — printing is the caller's job; the class returns data.

## Tests as the specification

```python
inv = Inventory()
bolt = Item("bolt", 5)
inv.add(bolt, 100)
inv.remove("bolt", 30)
assert inv.quantity("bolt") == 70
assert inv.total_value_cents() == 350
try:
    inv.remove("bolt", 1000)
except ValueError:
    pass
assert inv.quantity("bolt") == 70          # unchanged after the failed call
assert "bolt" in inv and len(inv) == 1
```

Each test is an invariant made executable: the failed removal did not change anything; the count and the value agree with the operations. Module 18 turns these into a real test suite; the point here is that the tests were written *from the invariants*, and a class whose invariants you cannot state is a class you cannot test.

## The checklist

- The class has a one-sentence purpose and an invariant you can write down.
- `__init__` establishes the invariant; every mutating method checks before it changes.
- Internal state has underscores; the interface is a handful of verbs (mutators) and nouns (queries).
- `__repr__` always; `__eq__`/`__hash__` for values, not for entities; the collection dunders when the object *is* a collection.
- Methods return data, never print; I/O stays in `main`.
- Value types are frozen dataclasses; an object with no behaviour is a dataclass or a dict.
- Composition over inheritance by default (Module 9): an `Inventory` *has* a dict, it is not one.

## Pitfalls

- A class that is a bag of loosely related functions with no shared state.
- Exposing the internal collection through a getter.
- Mutating state before validating, so a failed call leaves a half-updated object.
- Methods that print, making the class unusable in any other context.
- Inheriting from `dict` or `list` to "reuse" their methods — you inherit forty methods that can break the invariant.
- Naming by mechanism (`process`, `handle`, `data`) instead of by meaning (`remove`, `total_value_cents`).

## Key takeaways

- A class protects an invariant and offers a small interface; without an invariant, use a dataclass or a dict.
- Decide value versus entity first: values are frozen and compare by fields; entities are mutable and compare by identity.
- Check before changing, so a failed call changes nothing; raise the built-in exception with the right meaning.
- Hide the representation, expose verbs and queries, add the collection dunders when they fit, return data rather than printing.
- Write the tests from the invariants — they are the specification.
