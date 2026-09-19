---
title: Counting and grouping — Counter, defaultdict and the accumulation idioms
minutes: 13
---
Half of all dictionary code does one of two things: counts how often each key occurs, or collects the items that share a key into a list. Both have a plain-dict spelling, a `setdefault` spelling, and a `collections` type that says exactly what is meant — `Counter` for counting, `defaultdict` for grouping. This lesson gives all three for each job, the `Counter` API (`most_common`, arithmetic, `elements`), `defaultdict` with different factories including nested ones, inverting a mapping, and the reason `itertools.groupby` is *not* the grouping tool it sounds like.

## Counting

```python
counts = {}
for word in words:
    if word in counts:               # plain dict, verbose
        counts[word] += 1
    else:
        counts[word] = 1

counts[word] = counts.get(word, 0) + 1          # plain dict, one line

from collections import Counter
counts = Counter(words)                         # the type that means "count"
```

`Counter` is a dict subclass whose missing keys read as `0` (never `KeyError`) and which is built from any iterable or mapping:

```python
c = Counter("mississippi")
c["s"]                  # 4
c["z"]                  # 0 — no KeyError
c.most_common(2)        # [('i', 4), ('s', 4)] — ties keep first-seen order
c.total()               # 11 (3.10)
c.update("miss")        # add counts
c.subtract("ss")        # subtract counts (can go negative)
list(c.elements())      # each key repeated by its count
Counter(a) + Counter(b) # add counts; & is min, | is max; - drops non-positive
sorted(c.items())       # deterministic order for output
```

`most_common()` with no argument returns everything sorted by count descending, with ties in insertion order — which is the deterministic ordering to print when the tie-break does not matter; when it does, sort explicitly: `sorted(c.items(), key=lambda kv: (-kv[1], kv[0]))` for count descending then key ascending.

## Grouping

```python
groups = {}
for name, dept in staff:
    groups.setdefault(dept, []).append(name)     # plain dict

from collections import defaultdict
groups = defaultdict(list)
for name, dept in staff:
    groups[dept].append(name)                    # the type that means "group"
```

`defaultdict(factory)` calls `factory()` to create the value for a missing key *on first access* and stores it; afterwards it is an ordinary dict. The factory is any zero-argument callable: `list`, `set`, `int` (counting), `dict`, `lambda: [0, 0]`, or a class. Nested groupings compose: `defaultdict(lambda: defaultdict(int))` counts pairs as `table[a][b] += 1`.

Two behaviours to know. Reading a missing key *creates* it (`groups["x"]` inserts an empty list), so use `in` to test presence without side effects. And `defaultdict` prints as `defaultdict(<class 'list'>, {...})`; convert with `dict(groups)` for a clean display, and sort the keys for output.

## Inverting and indexing

```python
inverse = {v: k for k, v in d.items()}             # one-to-one only: later keys overwrite

by_value = defaultdict(list)                       # many-to-one: group keys by value
for k, v in d.items():
    by_value[v].append(k)

index = defaultdict(list)                          # a word index: word -> line numbers
for n, line in enumerate(lines, start=1):
    for word in set(line.split()):
        index[word].append(n)
```

The comprehension inverts a mapping whose values are unique; when several keys share a value, the grouping form keeps them all.

## Accumulating other things

The same shape works for any per-key accumulation:

```python
totals = defaultdict(float)
for name, amount in transactions:
    totals[name] += amount

best = {}
for name, score in results:
    best[name] = max(best.get(name, float("-inf")), score)

first_seen = {}
for i, key in enumerate(keys):
    first_seen.setdefault(key, i)               # keeps the first, ignores later
```

Counting with `defaultdict(int)` and with `Counter` are equivalent; `Counter` adds the API and reads as intent.

## Counting pairs and combinations

A key can be a tuple, so co-occurrence counts need no nesting: `Counter((a, b) for a, b in pairs)` tallies each ordered pair, `Counter(frozenset((a, b)) for a, b in pairs)` each unordered one, and `Counter(zip(words, words[1:]))` counts adjacent word pairs — bigrams — in one line. `most_common` then answers "which pair is commonest" directly.

## itertools.groupby is not this

`itertools.groupby(iterable, key)` groups *consecutive* elements with equal keys — it is a run-length tool, and on unsorted input it produces one group per run, not per key. It groups whole data only after a `sorted(..., key=key)`, and even then yields iterators that must be consumed immediately. For "group all items by key", `defaultdict(list)` is the tool; `groupby` is for runs, or for already-sorted data streamed in one pass (Module 11).

## Printing counts and groups

Output must be deterministic, and a dict's order is insertion order — fine when the input order is meaningful, but usually you want sorted keys or descending counts:

```python
for key in sorted(groups):
    print(key, ", ".join(groups[key]))

for key, n in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0])):
    print(f"{key}: {n}")
```

Never print a `set` or iterate one into output (lesson 3); a `Counter`'s `most_common` is fine because its order is defined.

## Pitfalls

- `counts[k] += 1` on a plain dict for a new key — `KeyError`; use `get`, `defaultdict(int)` or `Counter`.
- Testing `if key in groups` after a `groups[key]` read — the read already created it.
- `{v: k …}` inverting a many-to-one mapping and losing keys.
- `groupby` on unsorted data.
- Printing a `defaultdict` or a `Counter` directly and getting the class name in the output.
- Relying on `most_common` tie order when the spec says ties break alphabetically.

## Key takeaways

- Count with `Counter(iterable)`; missing keys read as 0; `most_common`, `update`, `+`/`-`/`&`/`|`, `total`, `elements`.
- Group with `defaultdict(list)`; any zero-argument factory works, including nested defaultdicts.
- `get(k, 0) + 1` and `setdefault(k, []).append(x)` are the plain-dict spellings.
- Invert with a comprehension when values are unique, with grouping when they are not.
- `itertools.groupby` groups consecutive runs only; sort first or use `defaultdict`.
