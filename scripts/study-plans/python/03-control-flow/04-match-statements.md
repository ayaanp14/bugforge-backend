---
title: Match statements — structural pattern matching
minutes: 14
---
`match` arrived in Python 3.10 and is not a `switch`. A `switch` compares one value against constants; `match` compares a value against *patterns* that describe its shape — a list of three elements whose first is `"move"`, a dictionary with a `"type"` key, an instance of `Point` whose `x` is zero — and binds the parts it names. It replaces the `if isinstance(...) and len(...) == 3 and cmd[0] == ...` staircases that parse commands, walk JSON-like data and dispatch on message types. This lesson gives the pattern kinds, the guard, the capture-versus-value rule that catches everyone once, and where `match` is and is not the right tool.

## The statement

```python
match command.split():
    case ["quit"]:
        return "bye"
    case ["go", direction]:
        return f"going {direction}"
    case ["drop", *items]:
        return f"dropping {', '.join(items)}"
    case _:
        return "unknown"
```

The subject (`command.split()`) is evaluated once; the `case` patterns are tried top to bottom; the first that matches runs its block and the statement ends — there is no fall-through and no `break`. `case _:` is the wildcard, matching anything, and it must be last. If nothing matches and there is no wildcard, nothing happens (no error).

## The pattern kinds

| Pattern | Matches | Binds |
| --- | --- | --- |
| `42`, `"go"`, `None`, `True` | a value equal to the literal (`None`/`True`/`False` by identity) | — |
| `x` | anything | `x` |
| `_` | anything | — |
| `[a, b]`, `(a, b)` | a sequence of exactly two elements | `a`, `b` |
| `[first, *rest]` | a sequence of one or more | `first`, `rest` (a list) |
| `{"type": t}` | a mapping with key `"type"` (extra keys allowed) | `t` |
| `{"type": "add", **rest}` | a mapping whose `"type"` is `"add"` | `rest` (the other items) |
| `Point(x=0, y=y)` | an instance of `Point` with `x == 0` | `y` |
| `int()`, `str()` | an instance of that type | — |
| `"a" \| "b"` | either alternative | — |
| `[x, y] as pair` | the sequence pattern, and also the whole | `pair` |
| `case p if cond:` | pattern `p`, then the guard must be true | as `p` |

Sequence patterns match lists and tuples (but *not* strings, deliberately — a string would otherwise match as a sequence of characters). Mapping patterns match dicts, ignoring keys not mentioned. Class patterns use `isinstance` and then compare the named attributes; positional class patterns need `__match_args__`, which dataclasses define automatically (`case Point(0, y)`).

## Capture versus value — the rule that bites

A bare name in a pattern **captures**; it does not compare. `case RED:` binds `RED` to whatever the subject is and always matches. To compare against a named constant, the name must be *dotted* — an attribute lookup:

```python
class Colour:
    RED = 1

match code:
    case Colour.RED:      # value pattern: compared with ==
        ...
    case RED:             # capture pattern: matches anything, binds RED — a bug, usually
        ...
```

Literals, dotted names and the `|`-alternatives of those are value patterns; a plain identifier is a capture. A `case` with a capture pattern that makes later cases unreachable is a `SyntaxError` ("name capture makes remaining patterns unreachable"), which catches the worst version of the mistake.

## Guards

`case [x, y] if x == y:` matches the shape, binds the names, then evaluates the guard; if the guard is false the next case is tried, with the bindings discarded. Guards express the conditions a pattern cannot — ranges, relations between captured values, membership:

```python
match point:
    case (x, y) if x == 0 and y == 0:
        kind = "origin"
    case (x, 0) | (0, x):
        kind = "on an axis"
    case (x, y) if abs(x) == abs(y):
        kind = "diagonal"
    case _:
        kind = "elsewhere"
```

An or-pattern's alternatives must bind the same names (`x` in both), so that the body can use them.

## Matching structured data

The strongest use is data that arrives as nested lists and dicts — parsed JSON, event records, tokens:

```python
match event:
    case {"type": "click", "x": int(x), "y": int(y)}:
        handle_click(x, y)
    case {"type": "key", "key": str(key)} if len(key) == 1:
        handle_char(key)
    case {"type": "key", "key": key}:
        handle_special(key)
    case {"type": t}:
        raise ValueError(f"unknown event type {t!r}")
    case _:
        raise ValueError("not an event")
```

Each case reads as the shape it accepts, the type checks are inline (`int(x)` binds only if the value is an int), and the failure cases are explicit. The `if/elif` equivalent is three times longer and has the checks separated from the bindings.

## Where match is not the tool

A plain value switch — `match op: case "+": … case "-": …` — works, but a dictionary of functions (Module 3 lesson 1) is shorter and reusable when the cases only map keys to results. Two or three simple conditions are still an `if`. And `match` on the *type* of a value alone (`case int(): … case str(): …`) is fine for a small closed set but is what polymorphism and `functools.singledispatch` (Module 11) exist for when the set is open.

## Pitfalls

- `case CONSTANT:` capturing instead of comparing. Use a dotted name or a literal.
- Expecting a string to match `[a, b, c]`. Strings are excluded from sequence patterns.
- Expecting fall-through, or writing `break`.
- A `case _:` that is not last (`SyntaxError`).
- Forgetting that a mapping pattern ignores extra keys — use `**rest` if the extras matter.
- Different names in the alternatives of an or-pattern.

## Key takeaways

- `match` tests a subject against patterns in order, binds the parts they name, and runs the first case that fits — no fall-through.
- Patterns: literals and dotted names compare, bare names capture, `_` ignores, `[...]` and `{...}` destructure, `Class(...)` checks type and attributes, `|` offers alternatives, `as` keeps the whole.
- A guard `if` refines a case with any condition; a failed guard moves to the next case.
- It shines on nested data and command parsing; for value-to-value maps use a dict, for two conditions use `if`.
- A bare name in a `case` is a capture — the one rule to remember.
