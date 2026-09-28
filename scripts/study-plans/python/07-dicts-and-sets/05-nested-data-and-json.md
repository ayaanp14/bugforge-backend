---
title: Nested data and JSON
minutes: 14
seo-title: Python JSON: loads vs load, dumps Options and Nested Data
description: Python's json module maps JSON onto dicts, lists, strings, numbers, booleans and None. loads vs load, pretty printing with sorted keys, and walking nested data.
question: How do I parse JSON in Python?
answer: Parse JSON in Python with the standard `json` module: `json.loads(text)` turns a JSON string into Python objects and `json.load(f)` reads from a file object. Objects become dicts with string keys, arrays become lists, `true` and `false` become `True` and `False`, and `null` becomes `None`. `json.dumps` and `json.dump` go the other way.
q: What is the difference between json.load and json.loads?
a: `json.loads` parses a string — the s stands for string — while `json.load` reads from a file object such as an open file or `sys.stdin`. Likewise, `json.dumps` returns a string and `json.dump` writes to a file.
q: How do I pretty-print JSON in Python?
a: Pass `indent=2` to `json.dumps` for output nested by two spaces, and add `sort_keys=True` so that equal dicts built in different orders print identically. For any Python object, `pprint.pprint` does the same job without JSON's restrictions.
q: How do I safely access a nested dictionary key in Python?
a: Chain `get` calls with an empty default of the right type: `doc.get("address", {}).get("city")` returns `None` instead of raising `KeyError` at either level. When a missing field would be a bug, index directly and let the `KeyError` report it.
q: Why does json.dumps turn tuples into lists and int keys into strings?
a: JSON has only arrays and objects with string keys, so a tuple is written as an array and read back as a list, and `{1: "a"}` comes back as `{"1": "a"}`. Convert on the way back, for example with `{int(k): v for k, v in loaded.items()}`.
q: What does TypeError: Object of type set is not JSON serializable mean?
a: Sets, dates, `Decimal` values and class instances have no JSON form, so `json.dumps` raises `TypeError` for them. Convert the value first, such as `sorted(s)` for a set, or pass a `default=` function that turns unknown objects into something JSON can hold.
---
Real data is nested: a list of records, each a dict, some values themselves lists of dicts. JSON is the text form of exactly that shape — objects, arrays, strings, numbers, booleans and null — and Python's `json` module maps it onto dicts, lists, `str`, `int`/`float`, `bool` and `None` with no loss. This lesson covers walking nested structures safely, `json.loads`/`dumps` and their options, the round trip and what it does not preserve, deterministic output with `sort_keys`, `pprint`, and the recursive walk that handles a document of unknown depth.

## The mapping

| JSON | Python |
| --- | --- |
| object `{"k": v}` | `dict` (keys are always strings) |
| array `[…]` | `list` |
| string | `str` |
| number | `int` if it has no fraction or exponent, else `float` |
| `true` / `false` | `True` / `False` |
| `null` | `None` |

```python
import json
doc = json.loads('{"name": "ada", "langs": ["python", "c"], "age": 36, "active": true, "boss": null}')
doc["langs"][0]                    # 'python'
doc["boss"] is None                # True
json.dumps(doc)                    # '{"name": "ada", "langs": ["python", "c"], "age": 36, "active": true, "boss": null}'
```

`loads`/`dumps` work on strings; `load`/`dump` on file objects (`json.load(sys.stdin)` reads a whole document from standard input). Tuples serialise as arrays and come back as lists; sets, dates, `Decimal` and class instances have no JSON form and raise `TypeError` unless you supply `default=` (Module 14).

## dumps options

```python
json.dumps(doc, indent=2)                  # pretty-printed, nested by two spaces
json.dumps(doc, sort_keys=True)            # keys in sorted order — deterministic output
json.dumps(doc, separators=(",", ":"))     # compact: no spaces
json.dumps("café", ensure_ascii=False)     # '"café"' rather than '"caf\\u00e9"'
```

`sort_keys=True` is the option to remember for judged output and for comparing documents: two equal dicts built in different orders serialise identically. `indent` with `sort_keys` is the standard "show me this structure" combination; `pprint.pprint(doc)` does the same for any Python object (sorting dict keys by default) without JSON's restrictions.

## Walking with defaults

```python
doc.get("address", {}).get("city")                  # None instead of KeyError at either level
langs = doc.get("langs") or []                      # missing or null -> empty list
first = doc["langs"][0] if doc.get("langs") else None
```

Chained `get` with an empty default of the right type is the safe navigation idiom. When a missing field is a *bug* rather than an option, index directly and let `KeyError` say so. `match` (Module 3) is the cleanest way to validate a document's shape when several shapes are possible:

```python
match event:
    case {"type": "click", "pos": [int(x), int(y)]}: ...
    case {"type": "key", "key": str(k)}: ...
    case _: raise ValueError("unknown event")
```

## Recursive walks

A document of unknown depth is walked with a recursive function that dispatches on the type of the current node:

```python
def walk(node, path=""):
    if isinstance(node, dict):
        for key, value in node.items():
            yield from walk(value, f"{path}.{key}" if path else key)
    elif isinstance(node, list):
        for i, value in enumerate(node):
            yield from walk(value, f"{path}[{i}]")
    else:
        yield path, node

for path, leaf in walk(doc):
    print(path, "=", leaf)
```

```text
name = ada
langs[0] = python
langs[1] = c
age = 36
active = True
boss = None
```

The same skeleton counts leaves, finds every value under a given key, computes depth, or rewrites values in place (return a new structure rather than mutating while walking). `yield from` (Module 11) makes the recursion produce a flat stream.

## Building nested structures

```python
report = {"total": 0, "items": []}
for name, qty in rows:
    report["items"].append({"name": name, "qty": qty})
    report["total"] += qty

by_dept = defaultdict(list)                    # then
doc = {"departments": [{"name": d, "staff": sorted(v)} for d, v in sorted(by_dept.items())]}
```

Build dicts and lists as the data dictates, then serialise once. Sorting keys and lists before `dumps` is what makes the output stable when the source order was not.

## The round trip and its limits

`json.loads(json.dumps(x)) == x` holds for dicts with string keys, lists, strings, ints, floats (within float precision), booleans and `None`. It does **not** hold for: tuples (become lists), non-string keys (`{1: "a"}` becomes `{"1": "a"}`), `float("nan")`/`inf` (emitted as `NaN`/`Infinity`, which is not valid JSON, unless `allow_nan=False` raises), and any custom object. When keys are integers, convert on the way back (`{int(k): v for k, v in loaded.items()}`).

Parse errors raise `json.JSONDecodeError` (a `ValueError`) with the line and column: trailing commas, single quotes and comments are all invalid JSON, however common they are in JavaScript.

## Pitfalls

- `json.loads` on a file object or `json.load` on a string (swap them).
- Expecting tuples, sets or int keys to survive the round trip.
- Printing a nested structure without `sort_keys` and comparing against expected output built in another order.
- `doc["a"]["b"]` on a document that may lack `"a"`; chain `get`s or catch `KeyError`.
- Mutating a list while walking it recursively.
- Single quotes or trailing commas in hand-written JSON.

## Key takeaways

- JSON objects, arrays, strings, numbers, booleans and null map to dict, list, str, int/float, bool and None; keys are always strings.
- `loads`/`dumps` for strings, `load`/`dump` for files; `indent`, `sort_keys=True` and `ensure_ascii=False` control the text.
- Navigate optional fields with chained `get` and typed defaults; validate shapes with `match`.
- Walk unknown depth with a recursive function dispatching on `dict` / `list` / leaf.
- The round trip loses tuples and non-string keys; sort keys and lists for deterministic output.
