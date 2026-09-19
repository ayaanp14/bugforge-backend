---
title: Dictionaries — the mapping at the centre of Python
minutes: 14
---
The dictionary is the data structure Python itself is built on — module namespaces, object attributes, keyword arguments are all dicts — and it is the one you will reach for most often: a mapping from keys to values with constant-time lookup, insertion and deletion, keeping the order in which keys were added. This lesson covers construction, the access methods and which one to use when a key may be missing, the views, iteration, updating and merging, dict comprehensions, and the rule against changing a dict's size while iterating it.

## Building

```python
empty = {}
ages = {"ada": 36, "grace": 45}
from_pairs = dict([("a", 1), ("b", 2)])
from_zip = dict(zip(names, scores))
from_kwargs = dict(x=1, y=2)                  # keys must be identifiers
defaults = dict.fromkeys(["a", "b"], 0)       # {'a': 0, 'b': 0} — one shared value object
squares = {n: n * n for n in range(4)}        # comprehension
```

Keys must be *hashable* — immutable, in practice: strings, numbers, tuples of hashables, frozensets (lesson 4). A list as a key is `TypeError: unhashable type: 'list'`. Values can be anything. Duplicate keys in a literal keep the last value.

## Reading

```python
ages["ada"]              # 36
ages["bob"]              # KeyError: 'bob'
ages.get("bob")          # None — no exception
ages.get("bob", 0)       # 0 — a default
"bob" in ages            # False — the membership test is on keys, O(1)
len(ages)                # 2
```

`d[k]` when the key *must* exist — its `KeyError` is the right failure for a bug. `d.get(k, default)` when absence is normal. `k in d` when only presence matters. The idiom `if k in d: v = d[k]` does two lookups where `get` does one; the idiom `d.get(k) or default` is the truthiness trap from Module 2 (a stored `0` or `""` is replaced).

## Writing

```python
ages["bob"] = 30            # insert or overwrite
ages["ada"] += 1            # read, add, write back — KeyError if absent
del ages["bob"]             # KeyError if absent
ages.pop("bob")             # remove and return; KeyError if absent
ages.pop("bob", None)       # remove and return, or the default
ages.popitem()              # remove and return the *last* inserted (key, value)
ages.setdefault("cy", 0)    # insert 0 only if absent; return the value either way
ages.update({"dee": 1}, ed=2)   # merge in pairs from a mapping / iterable / keywords
ages.clear()
```

`setdefault` is the one-line "insert if missing, then use": `d.setdefault(key, []).append(x)` groups values under a key without an `if`. The next lesson replaces that with `defaultdict`, which is clearer when every key gets the same kind of default.

## Merging

```python
merged = {**a, **b}          # 3.5: a new dict; b's values win on shared keys
merged = a | b               # 3.9: the same, as an operator
a |= b                       # update a in place
a.update(b)                  # the same as |=
```

Merges are left-to-right: later mappings overwrite earlier ones.

## Views and iteration

```python
for k in d:                  # keys, in insertion order
for k in d.keys():           # the same, explicit
for v in d.values():
for k, v in d.items():       # pairs — the usual loop

list(d)                      # the keys as a list
sorted(d)                    # keys sorted
sorted(d.items(), key=lambda kv: kv[1], reverse=True)   # pairs by value, descending
max(d, key=d.get)            # the key with the largest value
```

`keys()`, `values()` and `items()` return *views*: live windows onto the dict that reflect later changes, support `len` and `in`, and — for keys and items — behave like sets (`a.keys() & b.keys()` is the common keys). They are not lists: index them with `list(d.values())[0]`, or `next(iter(d))` for the first key. Since 3.7 insertion order is guaranteed by the language, so a dict doubles as an ordered record of arrival; `reversed(d)` iterates the keys backwards (3.8).

## Changing size during iteration

```python
for k in d:
    if bad(k):
        del d[k]             # RuntimeError: dictionary changed size during iteration
```

Iterate over a copy of the keys (`for k in list(d):`), or build a new dict with a comprehension (`{k: v for k, v in d.items() if not bad(k)}`). Changing a *value* during iteration (`d[k] = …` for an existing `k`) is fine.

## Nested dictionaries

```python
users = {"ada": {"age": 36, "langs": ["python"]}}
users["ada"]["langs"].append("c")
users.setdefault("bob", {})["age"] = 30
users.get("cy", {}).get("age")          # None — safe navigation with defaults
```

Two-level access is common enough that the pattern `d.get(k1, {}).get(k2)` is worth knowing, and `defaultdict(dict)` (next lesson) removes the `setdefault`. JSON documents arrive as nested dicts and lists (lesson 5).

## Dicts as records and as tables

A dict with fixed, known keys (`{"name": …, "age": …}`) is a *record* — a lighter `dataclass` (Module 8), fine for JSON and quick scripts. A dict with keys that vary with the data (`counts[word]`) is a *table* — the lookup structure. Both are dicts, but the first is usually better as a class once it has behaviour, and the second is where `get`, `setdefault` and the counting idioms live.

## Pitfalls

- `d[k]` where `k` may be absent; `get` or `in`.
- `d.get(k) or default` when the stored value can be falsy.
- A list as a key.
- `dict.fromkeys(keys, [])` — one shared list for every key.
- Deleting from a dict while iterating it.
- Assuming `d.keys()` is a list (`d.keys()[0]` is a `TypeError`).

## Key takeaways

- Dicts map hashable keys to any values with O(1) lookup and insertion, in insertion order.
- `d[k]` raises `KeyError`, `d.get(k, default)` does not, `k in d` tests presence; `setdefault` inserts a default and returns it.
- `pop`, `del`, `popitem`, `update`, `|` and `|=` change or merge; later mappings win.
- `keys()`/`values()`/`items()` are live views; iterate `items()` for pairs; sort with a key on `items()`.
- Never change a dict's size while iterating it; iterate `list(d)` or build a new dict.
