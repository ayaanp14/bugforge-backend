---
title: Writing clean solutions — structure, names, edges first and the code you can read aloud
minutes: 13
---
Two solutions to the same problem can both pass and score very differently, because the interviewer is reading the code as a sample of how you write for colleagues. Clean does not mean long: it means a `main` that reads and prints, a solve function whose name is the idea, helpers that are pure and small, names that say what they hold, edge cases handled first, and nothing clever that needs a comment to decode. This lesson gives the structure, the naming rules, the edge-first habit, how type hints and dataclasses serve as documentation, how to test inside the file, and a before-and-after that shows the difference.

## The structure

```python
import sys
from dataclasses import dataclass

@dataclass(frozen=True)
class Player:
    name: str
    score: int

def parse(lines: list[str]) -> list[Player]:
    return [Player(name, int(score)) for name, score in (line.split() for line in lines)]

def rank(players: list[Player]) -> list[tuple[int, Player]]:
    """Dense ranks: equal scores share a rank; the next distinct score takes the next rank."""
    ordered = sorted(players, key=lambda p: (-p.score, p.name))
    ranks, current, previous = [], 0, None
    for player in ordered:
        if player.score != previous:
            current += 1
            previous = player.score
        ranks.append((current, player))
    return ranks

def main() -> None:
    players = parse(sys.stdin.read().splitlines())
    for position, player in rank(players):
        print(position, player.name, player.score)

if __name__ == "__main__":
    main()
```

Reading and printing live in `main`; `parse` turns text into typed values; `rank` is the idea and touches no I/O, so it can be called in a test with a literal list. The dataclass gives the record a name and its fields names — `p.score` instead of `p[1]`. A one-line docstring states the rule that is not obvious from the code (dense versus competition ranking).

## Names

Variables hold what their names say: `players`, not `data`; `count_by_word`, not `d`; `start`, `end`, not `i`, `j` — except in the tightest loops where `i` is the index and everyone knows it. Functions are verbs or questions: `parse`, `rank`, `is_balanced`, `next_greater`. Booleans read as conditions: `is_empty`, `has_cycle`, `seen`. Constants are upper case at module level: `PAIRS = {")": "(", "]": "[", "}": "{"}`. A name that needs a comment is the wrong name.

## Edges first

```python
def is_balanced(s: str) -> bool:
    if not s:
        return True
    ...

def median(xs: list[float]) -> float:
    if not xs:
        raise ValueError("median of empty list")
    ...
```

Handle the empty input, the single element and the invalid input at the top with an early return or a raise, so the main body reads without guards. State which you chose — "empty is balanced; median of nothing raises" — because that is the question you asked in step one of the round.

## Pure helpers, small functions

A function that takes values and returns values, with no prints and no globals, is testable by calling it and reusable inside the solve. Each helper does one thing and fits on a screen; the solve function reads as a sequence of named steps. `global` is a smell; a mutable module-level container that helpers modify is the same smell with a different spelling. Pass state in, return results out.

## Type hints and dataclasses as documentation

`def rank(players: list[Player]) -> list[tuple[int, Player]]` tells the reader the shapes without a comment; `@dataclass(frozen=True)` says the record is a value; an `Enum` names the states. None of it is checked at run time, and all of it is read at review time. Hints on the public functions, not on every local.

## Avoiding cleverness

```python
# clever
result = [x for xs in (a if c else b for a, b, c in rows) for x in xs if x]
# clear
result = []
for a, b, c in rows:
    chosen = a if c else b
    result.extend(x for x in chosen if x)
```

A nested comprehension with a conditional expression inside it is shorter and slower to read; the loop names the intermediate. Prefer the version a colleague understands on first reading — the interviewer is that colleague. Likewise: no one-letter lambdas that span a line, no `reduce` where a loop is clear, no walrus in a comprehension that already has a condition.

## Tests in the file

```python
def _test() -> None:
    assert is_balanced("") is True
    assert is_balanced("([])") is True
    assert is_balanced("(]") is False
    assert rank([Player("a", 5), Player("b", 5), Player("c", 1)])[2][0] == 2

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        _test()
    else:
        main()
```

Three `assert` lines with the edge cases, runnable with a flag, show the interviewer you test without being asked. In a judged submission they stay dormant behind the flag; in a real repository they become a `test_*.py` file (Module 18).

## Before and after

```python
# before
d = {}
for l in sys.stdin:
    w = l.split()
    for x in w:
        if x in d: d[x] += 1
        else: d[x] = 1
for k in sorted(d, key=lambda k: (-d[k], k))[:3]: print(k, d[k])

# after
def top_words(text: str, k: int = 3) -> list[tuple[str, int]]:
    counts = Counter(text.split())
    return sorted(counts.items(), key=lambda item: (-item[1], item[0]))[:k]

def main() -> None:
    for word, count in top_words(sys.stdin.read()):
        print(word, count)
```

Same output; the second names the idea, uses the built-in, separates I/O, and can be tested with a string.

## Pitfalls

- All the logic in module scope, with prints inside the computation.
- `d`, `l`, `x` for things that have names.
- Edge cases handled by a guard deep inside the loop, or not at all.
- A comprehension that needs a comment.
- Globals mutated by helpers.
- No test, no docstring on the one non-obvious rule.

## Key takeaways

- `main` reads and prints; `parse` types the input; `solve` is the idea; helpers are pure and small.
- Names say what they hold; functions are verbs; booleans are conditions; constants are upper case.
- Edges first with early returns or raises, and say which you chose.
- Hints and dataclasses document shapes; avoid cleverness that costs a reader a second look.
- Three asserts behind a flag show testing without being asked.
