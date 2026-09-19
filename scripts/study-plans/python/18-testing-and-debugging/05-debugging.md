---
title: Debugging — reading tracebacks, logging, pdb and the method
minutes: 15
---
Debugging is finding out why the program did something other than what you believed it would, and most of the skill is in reading what Python already tells you: a traceback names the exact line and the chain of calls that reached it, an exception chain records what was being handled when the second error occurred, and a logger records the path the program took without stopping it. When that is not enough, `pdb` stops the program at a line and lets you inspect it. This lesson covers reading a traceback bottom-up, chained exceptions, `traceback` and `logging` as diagnostic tools, `breakpoint()` and the debugger commands, `assert` and the `-X dev` and `-W error` switches, and the method — reproduce, minimise, hypothesise, bisect — that turns a mystery into a fix.

## Reading a traceback

```text
Traceback (most recent call last):
  File "app.py", line 21, in <module>
    main()
  File "app.py", line 17, in main
    report(load("data.csv"))
  File "app.py", line 9, in load
    return [parse(line) for line in f]
  File "app.py", line 5, in parse
    return int(line.split(",")[1])
ValueError: invalid literal for int() with base 10: 'n/a'
```

Read from the bottom: the last line is the exception type and message — the *what*. The frame above it is *where* it was raised (`parse`, line 5). The frames above that are *how* execution got there, outermost first. Each frame shows file, line number, function and the source line. Your own code's frames are the ones to focus on; frames inside site-packages usually mean your code passed something wrong to a library, and the frame of yours nearest the bottom is the suspect. The message is the second clue: `'n/a'` says which input broke the assumption.

## Chained exceptions

```text
Traceback (most recent call last):
  File "app.py", line 12, in fetch
    return cache[key]
KeyError: 'user:7'

During handling of the above exception, another exception occurred:

Traceback (most recent call last):
  ...
  File "app.py", line 14, in fetch
    return db.get(key)
ConnectionError: database unavailable
```

"During handling of the above exception" means the second error happened inside an `except` block; "The above exception was the direct cause" means `raise X from e`. Both tracebacks matter: the first explains why the handler ran, the second why it failed. `raise ... from None` suppresses the chain when the first error is an implementation detail.

## traceback and logging

```python
import logging, traceback

log = logging.getLogger("app")

try:
    run()
except Exception:
    log.exception("run failed")            # message + full traceback at ERROR level
    text = traceback.format_exc()          # the traceback as a string, for a report
```

`logging` is the diagnostic channel of a program that keeps running: `basicConfig(level=logging.DEBUG, format="%(levelname)s %(name)s: %(message)s")` sets up a handler to stderr; `log.debug/info/warning/error/critical` emit at levels; the threshold decides what is shown, so debug detail can stay in the code and be switched on in the field. Loggers are hierarchical by dotted name; a handler can be a file, a stream or your own `Handler` subclass with an `emit(record)` method. `print` is for the program's output; `logging` is for its diary. In a judged program a `StreamHandler(sys.stdout)` with a format that has no timestamp is deterministic; `%(asctime)s` is not.

## pdb

```python
def parse(line):
    breakpoint()                            # stops here; PYTHONBREAKPOINT=0 disables
    return int(line.split(",")[1])
```

`breakpoint()` opens `pdb` at that line. The commands: `n` (next line), `s` (step into a call), `c` (continue), `r` (return from the function), `l` (list source), `ll` (whole function), `p expr` / `pp expr` (print), `w` (where — the stack), `u`/`d` (up/down a frame), `b file:line` (set a breakpoint), `q` (quit). `python -m pdb app.py` starts under the debugger; `python -c "import pdb, app; pdb.pm()"` after a crash, or `pdb.post_mortem()` in an `except`, inspects the frames of the exception that just happened — the fastest way to see local variables at the point of failure.

## assert, -X dev, -W error

`assert cond, "message"` documents an invariant and raises `AssertionError` when it is false; `python -O` removes every assert, so it is for checking *your own* logic, never for validating input. `python -X dev` turns on development mode: warnings shown, `ResourceWarning` for unclosed files, extra checks in `asyncio`. `python -W error` turns warnings into exceptions so a deprecation cannot be ignored. `python -X faulthandler` (or `faulthandler.enable()`) prints a traceback on a hard crash such as a segfault in a C extension.

## The method

1. **Reproduce** it: a command or a test that fails every time. An intermittent failure is a different bug (usually a race or an unseeded random).
2. **Minimise**: the smallest input and the fewest lines that still fail. Halving the input repeatedly finds the offending record; deleting code that is not involved shrinks the search.
3. **Hypothesise**: from the traceback and the message, one specific claim ("`parse` assumes column 1 is numeric"). Check it with a print of `f"{line=}"` or a breakpoint — one variable, not twenty.
4. **Bisect** across history when the failure is new: `git bisect` between the last good and first bad commit finds the change in log₂ steps.
5. **Fix, then add the regression test** from step 1, then remove the prints.

`print(f"{x=}")` (the `=` specifier prints the expression and its `repr`) is the humble tool that solves most bugs; the discipline is to print `repr`, not `str`, so `'1 '` with a trailing space is visible.

## Pitfalls

- Reading only the last line of a traceback and guessing where.
- Ignoring the first traceback of a chain.
- `except Exception: pass` hiding the error that would have explained everything.
- Validation with `assert` (disappears under `-O`).
- Debug prints of `str(x)` that hide whitespace and types.
- Changing three things at once and not knowing which one fixed it.

## Key takeaways

- Read a traceback bottom-up: type and message, then the raising frame, then the path; your own nearest frame is the suspect.
- Chained tracebacks show the error that was being handled and the one that followed; `from` and `from None` control the chain.
- `logging` is the running program's diary with levels and handlers; `log.exception` and `traceback.format_exc` capture tracebacks.
- `breakpoint()` and `pdb.pm()` inspect live frames; `n s c p w u d` are the commands.
- Reproduce, minimise, hypothesise, bisect, fix, regression-test; print `repr`, never validate with `assert`.
