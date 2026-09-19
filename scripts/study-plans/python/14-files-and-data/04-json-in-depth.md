---
title: JSON in depth — custom encoders, decoders, dataclasses and config files
minutes: 13
---
Module 7 covered `json.loads`/`dumps` and the mapping between JSON and Python values. This lesson is about the edges: the objects JSON cannot serialise and the `default=` hook and `JSONEncoder` subclass that teach it to; `object_hook` and `object_pairs_hook` for turning parsed dicts back into your types; dataclasses in and out via `asdict`; dates as ISO strings; `JSONDecodeError` and validation; JSON Lines for streams; and the two other configuration formats in the standard library, TOML via `tomllib` and INI via `configparser`, with the rule for choosing among them.

## Serialising what JSON does not know

```python
import json
from datetime import date
from decimal import Decimal

json.dumps({"when": date(2024, 5, 1)})          # TypeError: Object of type date is not JSON serializable

def to_json(o):
    if isinstance(o, date):
        return o.isoformat()
    if isinstance(o, Decimal):
        return str(o)
    if isinstance(o, set):
        return sorted(o)
    raise TypeError(f"not serializable: {type(o).__name__}")

json.dumps({"when": date(2024, 5, 1), "tags": {"b", "a"}}, default=to_json)
# '{"when": "2024-05-01", "tags": ["a", "b"]}'
```

`default` is called for any object the encoder cannot handle and must return something it can; raising `TypeError` for the rest keeps mistakes loud. A `JSONEncoder` subclass with `default(self, o)` is the class-based form, passed as `cls=`. Sets become sorted lists (deterministic and valid JSON), dates become ISO strings, `Decimal` becomes a string to preserve its exactness (a number would round-trip as a float).

## Dataclasses

```python
from dataclasses import dataclass, asdict

@dataclass
class Item:
    name: str
    qty: int

json.dumps(asdict(Item("bolt", 3)))            # '{"name": "bolt", "qty": 3}'
json.dumps([asdict(i) for i in items], indent=2)
Item(**json.loads('{"name": "nut", "qty": 5}'))  # back again
```

`asdict` produces a plain dict (recursively), and `Cls(**d)` rebuilds an instance — the whole round trip for flat records. For nested dataclasses, rebuild inside out, or use a `from_dict` class method that knows the shape. Third-party libraries (`pydantic`, `attrs`, `marshmallow`) automate this with validation; the standard library gives you the two calls.

## Decoding into your types

```python
def as_item(d):
    if d.keys() == {"name", "qty"}:
        return Item(d["name"], d["qty"])
    return d

json.loads(text, object_hook=as_item)          # every JSON object is passed through as_item, innermost first
json.loads(text, object_pairs_hook=OrderedDict)   # receives the pairs in order (a plain dict already keeps order)
json.loads("1.5", parse_float=Decimal)         # numbers as Decimal instead of float
```

`object_hook` sees every object in the document, bottom-up, so it must return the dict unchanged when it does not recognise the shape. `parse_float=Decimal` is the way to read money from JSON without float error.

## Validation

`json.loads` guarantees syntax, not shape. After parsing, check the shape once at the boundary — with `match` patterns (Module 3), explicit tests, or a dataclass `__post_init__` — and raise a clear error:

```python
try:
    doc = json.loads(text)
except json.JSONDecodeError as e:
    raise ValueError(f"invalid JSON at line {e.lineno}, column {e.colno}: {e.msg}") from None
match doc:
    case {"name": str(name), "qty": int(qty)} if qty >= 0:
        ...
    case _:
        raise ValueError("expected {name: str, qty: int >= 0}")
```

`JSONDecodeError` carries `lineno`, `colno` and `msg`; it is a subclass of `ValueError`, so a broad `except ValueError` catches it too.

## Deterministic and pretty

`sort_keys=True` makes equal dicts serialise identically (Module 7); `indent=2` is for humans; `separators=(",", ":")` is the compact form for storage and transmission; `ensure_ascii=False` keeps non-ASCII characters readable. `python -m json.tool file.json` pretty-prints from the command line.

## JSON Lines

One JSON value per line — `{"id": 1}\n{"id": 2}\n` — is the format for logs and streams: appendable, splittable, readable one record at a time with `for line in f: record = json.loads(line)`, and writable with `f.write(json.dumps(record) + "\n")`. A single huge JSON array cannot be processed until it has been read entirely; JSON Lines can.

## TOML and INI

```python
import tomllib
with open("pyproject.toml", "rb") as f:          # tomllib wants bytes
    cfg = tomllib.load(f)
cfg["project"]["name"]

import configparser
parser = configparser.ConfigParser()
parser.read("settings.ini")
parser["server"]["port"]                         # always a string
parser["server"].getint("port")
```

TOML (3.11, read-only in the standard library) is typed — strings, ints, floats, booleans, dates, arrays, tables — and is the format for `pyproject.toml` and modern configuration. INI via `configparser` is older, untyped (everything is a string, with `getint`/`getboolean` helpers) and still common. The rule: JSON for data exchanged with programs, TOML for configuration written by people, INI when a system already uses it, and never `pickle` for anything that crosses a trust boundary.

## Large documents

`json.load` parses the whole document into memory — several times its byte size, since every value becomes an object. For a file of hundreds of megabytes that is the wrong tool: switch the producer to JSON Lines and stream it line by line, or use an incremental parser (`ijson`, third-party) that yields values as it reads. The same reasoning applies to `json.dumps` of a huge structure: write records one at a time rather than building one giant string.

## Pitfalls

- `json.dumps` on a set, date, `Decimal` or dataclass without `default=`/`asdict`.
- Reading money as floats — `parse_float=Decimal`.
- Trusting shape after `loads`; validate at the boundary.
- `tomllib.load` on a text-mode file (it wants `"rb"`).
- Expecting `configparser` values to be numbers.
- A single giant JSON array where JSON Lines would stream.

## Key takeaways

- `default=` (or a `JSONEncoder` subclass) serialises dates as ISO strings, `Decimal` as strings, sets as sorted lists.
- `asdict` and `Cls(**d)` round-trip flat dataclasses; `object_hook` and `parse_float` shape the decode.
- `JSONDecodeError` has line and column; validate the shape after parsing with `match` or explicit checks.
- `sort_keys` for determinism, `indent` for people, compact separators for storage; JSON Lines for streams.
- `tomllib` (bytes, read-only) for typed configuration; `configparser` for INI; JSON for exchange.
