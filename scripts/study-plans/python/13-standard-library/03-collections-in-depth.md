---
title: collections in depth — deque, Counter, OrderedDict, ChainMap and the User classes
minutes: 13
---
`collections` has appeared in five modules already: `Counter` and `defaultdict` for counting and grouping, `deque` for queues and windows, `namedtuple` for records, `UserDict` for subclassing a mapping. This lesson gathers the rest of what each can do — `deque.rotate` and `maxlen`, `Counter` arithmetic and `most_common` semantics, `OrderedDict.move_to_end` as the basis of an LRU cache, `ChainMap` for layered configuration, `namedtuple`'s `_replace`/`_asdict`/`_make` and the `User*` classes — so that when a problem is "a bounded history", "a cache with eviction" or "settings with defaults and overrides", the answer is one class rather than a hand-written structure.

## deque

```python
from collections import deque

d = deque([1, 2, 3], maxlen=5)
d.append(4); d.appendleft(0)         # both ends, O(1)
d.pop(); d.popleft()
d.rotate(1)                          # [3, 1, 2] → the last element moves to the front
d.rotate(-1)                         # the opposite
d.extend([7, 8]); d.extendleft([9])  # extendleft reverses the order it inserts
d[0], d[-1], len(d), 2 in d          # indexing the ends is O(1); the middle is O(n)
list(d)
```

`maxlen` makes a bounded buffer that discards from the far end — the last-`n`-lines log, the moving window. `rotate` gives circular behaviour: a round-robin scheduler is `d.rotate(-1); d[-1]`, a Caesar-style shift of a sequence is a rotation. A deque has no slicing; convert when you need it.

## Counter, fully

```python
from collections import Counter

c = Counter("mississippi")
c.most_common()             # [('i', 4), ('s', 4), ('p', 2), ('m', 1)] — count desc, ties in first-seen order
c.most_common(2)
c.total()                   # 11 (3.10)
c.elements()                # an iterator: m, i, i, i, i, s, s, s, s, p, p (in insertion order of keys)
c["z"]                      # 0, and the key is NOT inserted
c.update("miss"); c.subtract("ss")
+c                          # a new Counter with only positive counts
Counter(a=3, b=1) - Counter(a=1, b=5)      # Counter({'a': 2}) — negatives dropped
Counter(a=3) & Counter(a=1, b=2)           # min per key: Counter({'a': 1})
Counter(a=3) | Counter(a=1, b=2)           # max per key
Counter(a=1) == Counter(a=1, b=0)          # True (3.10): missing and zero compare equal
```

The arithmetic makes multiset problems one-liners: "can `word` be built from the letters of `tiles`" is `not (Counter(word) - Counter(tiles))`; the letters two words share is `Counter(a) & Counter(b)`.

## OrderedDict and the LRU cache

A plain dict keeps insertion order, so `OrderedDict` survives for one operation it alone has: `move_to_end(key, last=True)`, which re-orders in O(1). That is exactly what a least-recently-used cache needs:

```python
from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self._data = OrderedDict()

    def get(self, key):
        if key not in self._data:
            return None
        self._data.move_to_end(key)             # most recently used → the end
        return self._data[key]

    def put(self, key, value):
        self._data[key] = value
        self._data.move_to_end(key)
        if len(self._data) > self.capacity:
            self._data.popitem(last=False)      # evict the least recently used → the front
```

`popitem(last=False)` pops from the front; a plain dict's `popitem` pops only the last. This class is the standard interview answer to "design an LRU cache" (Module 20 implements it with a linked list as well); `functools.lru_cache` is the same idea applied to a function.

## ChainMap

```python
from collections import ChainMap

defaults = {"colour": "blue", "size": 10}
config_file = {"size": 12}
command_line = {"colour": "red"}
settings = ChainMap(command_line, config_file, defaults)
settings["colour"], settings["size"]     # 'red', 12 — the first mapping that has the key wins
settings["debug"] = True                 # writes go to the FIRST mapping only
settings.maps                            # the list of underlying dicts
settings.new_child({"tmp": 1})           # a new ChainMap with one more layer in front
```

A `ChainMap` is a view over several dicts searched in order — layered configuration, nested scopes in an interpreter — with no copying, so a change to an underlying dict is visible immediately. `dict(settings)` flattens it.

## namedtuple, fully

```python
from collections import namedtuple

Point = namedtuple("Point", "x y", defaults=[0])      # defaults apply to the rightmost fields
p = Point(3)                                            # Point(x=3, y=0)
p._replace(y=4)                                         # a new Point
p._asdict()                                             # {'x': 3, 'y': 0}
Point._make([1, 2])                                     # from an iterable
Point._fields                                           # ('x', 'y')
Point._field_defaults                                   # {'y': 0}
```

`typing.NamedTuple` adds hints and methods (Module 6). Both are tuples first: `p == (3, 0)` is `True`, which is the reason a `dataclass` is the better choice when that equality would be a bug.

## UserDict, UserList, UserString

Written in Python so that every operation goes through the basic methods (`__getitem__`, `__setitem__`, `__delitem__`, `__len__`, `__iter__`), which is what makes an overridden method take effect in `update`, `pop`, slicing and the rest — the problem with subclassing the built-ins directly (Module 9). The wrapped object is `.data`. Use them for a mapping or sequence with a rule applied to every access; use `collections.abc.MutableMapping` when the storage is not a dict at all.

## Choosing, again

- Bounded history / sliding window / queue / round-robin: `deque`.
- Multiset counting and comparison: `Counter`.
- Cache with eviction by recency: `OrderedDict` (or `lru_cache` for a function).
- Layered lookups without copying: `ChainMap`.
- Small immutable record: `namedtuple`; with behaviour or defaults that are mutable: `dataclass`.
- A mapping with a rule on every access: `UserDict`.

## Pitfalls

- Slicing a `deque`.
- `extendleft` reversing the order of what it inserts.
- Reading `c["missing"]` and expecting the key to appear (it does not; `c["missing"] += 0` would insert it).
- Relying on `most_common` tie order when the spec wants alphabetical.
- Writing through a `ChainMap` and expecting it to update a lower layer.
- `popitem()` on an `OrderedDict` without `last=False` for the LRU eviction.

## Key takeaways

- `deque`: O(1) at both ends, `rotate`, `maxlen`; no slicing.
- `Counter`: `most_common`, `total`, `elements`, `update`/`subtract`, `+ − & |` as multiset operations.
- `OrderedDict.move_to_end` and `popitem(last=False)` make an LRU cache; a plain dict cannot re-order.
- `ChainMap` searches layers in order and writes to the first; `namedtuple` has `_replace`, `_asdict`, `_make`, `defaults`.
- `UserDict`/`UserList`/`UserString` are the subclassable containers.
