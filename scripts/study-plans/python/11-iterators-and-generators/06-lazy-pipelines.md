---
title: Lazy pipelines — a worked log-processing example
minutes: 14
---
The previous lessons gave the parts; this one assembles them into the shape that real data-processing code takes in Python: a chain of generator stages, each taking an iterable and yielding, that reads a source once and streams every record through parse, filter, transform and aggregate steps without ever holding the whole input. The worked example processes a web-server log — the kind of task that is a script in every company — and the design points are the ones that make a pipeline maintainable: one job per stage, stages that are independently testable, materialisation only at the end, and errors handled at the stage that can name them.

## The source

```python
import sys

def read_lines(stream):
    for line in stream:
        line = line.rstrip("\n")
        if line:
            yield line
```

The first stage adapts the input — a file, `sys.stdin`, a list of strings in a test — into a stream of clean lines. It does nothing else; in particular it does not parse. Because it yields, a file of a gigabyte is read line by line and never stored.

## Parse

```python
import re
from dataclasses import dataclass

LINE = re.compile(r'(?P<ip>\S+) \S+ \S+ \[(?P<ts>[^\]]+)\] "(?P<method>\w+) (?P<path>\S+)[^"]*" (?P<status>\d{3}) (?P<size>\d+|-)')

@dataclass(frozen=True)
class Hit:
    ip: str
    method: str
    path: str
    status: int
    size: int

def parse(lines):
    for n, line in enumerate(lines, start=1):
        m = LINE.match(line)
        if m is None:
            print(f"skip line {n}", file=sys.stderr)      # report, do not stop
            continue
        size = m["size"]
        yield Hit(m["ip"], m["method"], m["path"], int(m["status"]), 0 if size == "-" else int(size))
```

The parse stage turns text into typed records — a frozen dataclass, so downstream code cannot accidentally mutate a shared object — and decides what to do with malformed input *here*, where the line number is known. Reporting to stderr and continuing is the right default for a log processor; raising would be right for a config loader. Either way the decision is local to this stage.

## Filter and transform

```python
def only(hits, *, status=None, method=None):
    for hit in hits:
        if status is not None and hit.status != status:
            continue
        if method is not None and hit.method != method:
            continue
        yield hit

def without_query(hits):
    for hit in hits:
        yield hit if "?" not in hit.path else hit.__class__(hit.ip, hit.method, hit.path.split("?")[0], hit.status, hit.size)
```

Filters yield a subset; transforms yield a modified record (a *new* one, since the dataclass is frozen — `dataclasses.replace` is the cleaner spelling). Each is a few lines, has a name that says what it does, and can be dropped into or out of the chain. Keyword-only options keep the call sites readable.

## Aggregate

```python
from collections import Counter

def summarise(hits):
    by_status = Counter()
    by_path = Counter()
    bytes_total = 0
    for hit in hits:
        by_status[hit.status] += 1
        by_path[hit.path] += 1
        bytes_total += hit.size
    return by_status, by_path, bytes_total
```

The terminal stage is the one place the stream is consumed to a result. It is an ordinary function, not a generator: it pulls every record through every stage above it, and only its accumulators live in memory. Several aggregates in one pass — as here — beat several passes over a re-read file.

## Assembling

```python
def main():
    hits = parse(read_lines(sys.stdin))
    hits = only(hits, method="GET")
    hits = without_query(hits)
    by_status, by_path, total = summarise(hits)
    for status, n in sorted(by_status.items()):
        print(f"{status} {n}")
    for path, n in sorted(by_path.items(), key=lambda kv: (-kv[1], kv[0]))[:3]:
        print(f"{n:5} {path}")
    print(f"bytes {total}")
```

Reads top to bottom as the data flows; every stage is lazy, so nothing runs until `summarise` starts pulling, and then each line goes through the whole chain before the next is read. Reassigning `hits` at each step keeps the chain flat. `main` owns I/O and output formatting; the stages know nothing of printing (the one stderr line in `parse` is a diagnostic, not output).

## Testing a stage

Because each stage takes any iterable, a test feeds a list and checks the list it gets back:

```python
sample = ['1.1.1.1 - - [x] "GET /a?q=1 HTTP/1.1" 200 10', 'garbage']
hits = list(parse(sample))
assert len(hits) == 1
assert list(without_query(hits))[0].path == "/a"
assert summarise(only(hits, status=404)) == (Counter(), Counter(), 0)
```

No files, no stdin, no mocking: the stage's contract is "iterable in, iterable out", and lists satisfy it. Module 18 turns these into a test suite.

## Design points

- **One job per stage**, named for the job. A stage that parses *and* filters cannot be reused for the other.
- **Records over tuples** once there are more than two fields — `hit.status` reads, `hit[3]` does not.
- **Immutable records** (frozen dataclass) so that a transform must create a new one and a bug cannot corrupt an upstream stage's object.
- **Handle errors in the stage that has the context** — the parser knows the line number; the aggregator does not.
- **Materialise at the end**, or with `list()` at exactly the point where two passes are needed.
- **Keep `main` as the only stage that reads real input or prints.**

When the pipeline needs branching (one stream into two consumers), `itertools.tee` or a single pass that computes both, as `summarise` does, avoids re-reading. When it needs to run in parallel, the same stage functions map onto `concurrent.futures` or `asyncio` with no change to their contracts (Module 17).

## Pitfalls

- A stage that returns a list "for convenience", turning the whole chain eager.
- Parsing and filtering in one stage.
- Mutating records shared with an upstream stage.
- Swallowing malformed lines silently, so a format change goes unnoticed.
- Consuming the stream twice by accident (`len(list(hits))` then iterating `hits`).
- Printing from the middle of the chain.

## Key takeaways

- A pipeline is a chain of generator stages — source, parse, filter, transform — ending in one aggregating consumer.
- Each stage takes an iterable and yields; that contract makes stages composable and testable with plain lists.
- Parse into frozen records; handle bad input where the context is; report or raise deliberately.
- Nothing runs until the consumer pulls; one pass, constant memory; materialise only where a second pass is needed.
- `main` reads and prints; stages compute.
