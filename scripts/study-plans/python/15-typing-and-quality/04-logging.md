---
title: logging — levels, loggers, handlers and formats
minutes: 14
---
`print` is for a program's output; `logging` is for its diary — what it did, what went wrong, in what order — written to stderr, a file, or a service, at a verbosity the operator chooses without editing the code. The module has more parts than it first appears to need, and this lesson explains them in the order they matter: levels, the module-level logger idiom, `basicConfig` with a format, the logger hierarchy, handlers and formatters, `logging.exception` for tracebacks, lazy `%s` formatting, and the reason a library never configures logging.

## Levels and the first call

```python
import logging

logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s:%(message)s")
log = logging.getLogger(__name__)

log.debug("cache size %d", len(cache))        # below INFO: dropped
log.info("loaded %d rows", n)                 # INFO:__main__:loaded 42 rows
log.warning("retrying %s", url)
log.error("failed to save %s", path)
log.critical("out of disk")
```

Five levels, `DEBUG` (10) < `INFO` (20) < `WARNING` (30) < `ERROR` (40) < `CRITICAL` (50). A logger drops messages below its threshold, so a program logs `debug` details freely and an operator turns them on with one setting when needed. The default level is `WARNING`, which is why `log.info` prints nothing until `basicConfig` sets `INFO`.

## Loggers and the hierarchy

`logging.getLogger(__name__)` at the top of every module gives it a logger named after its import path — `shop.pricing`, `shop.utils.text`. Names form a tree by the dots: a setting on `shop` applies to `shop.pricing`; the root logger (`logging.getLogger()`) is the top. That is how an operator says "everything at `WARNING`, but `shop.pricing` at `DEBUG`":

```python
logging.getLogger("shop.pricing").setLevel(logging.DEBUG)
```

Messages propagate up the tree to the handlers attached at each level, which is why one `basicConfig` on the root is enough for a whole program. Never `getLogger("myapp")` with a hand-written name in every module — `__name__` is the convention that makes the hierarchy match the code.

## Format

```python
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-8s %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
```

The format string uses `%`-style attributes of the log record: `asctime`, `levelname`, `name`, `message`, `filename`, `lineno`, `funcName`, `process`, `thread`. For a judged or tested program, leave `asctime` out — a timestamp is not reproducible — and use a format like `%(levelname)s:%(name)s:%(message)s`.

## Lazy arguments

```python
log.debug("user %s has %d items", user, len(items))    # right: formatted only if emitted
log.debug(f"user {user} has {len(items)} items")        # wrong: the f-string is built even when DEBUG is off
```

The message and its arguments are stored and formatted only when a handler actually writes the record. With f-strings the work is done on every call, at every level, and the `%s` form also lets log aggregators group identical messages by template.

## Handlers and formatters

```python
logger = logging.getLogger("shop")
logger.setLevel(logging.DEBUG)

console = logging.StreamHandler(sys.stdout)            # default is stderr
console.setLevel(logging.INFO)
console.setFormatter(logging.Formatter("%(levelname)s: %(message)s"))

file = logging.FileHandler("shop.log", encoding="utf-8")
file.setLevel(logging.DEBUG)
file.setFormatter(logging.Formatter("%(asctime)s %(name)s %(levelname)s %(message)s"))

logger.addHandler(console)
logger.addHandler(file)
```

A logger can have several handlers, each with its own level and formatter: brief messages to the console, everything to a file. `RotatingFileHandler` and `TimedRotatingFileHandler` cap file sizes; `NullHandler` silences a library by default; `QueueHandler` moves logging off a hot thread. `logging.config.dictConfig` sets all of this from a dict (loaded from TOML or JSON) so that deployment, not code, decides the destinations.

## Exceptions

```python
try:
    process(record)
except Exception:
    log.exception("failed on record %s", record.id)     # ERROR level, with the traceback appended
    raise
```

`log.exception` must be called from inside a handler; it is `log.error(..., exc_info=True)`. This is what a boundary handler does instead of `print(e)`: the type, message and full traceback go to the log, and the exception can still be re-raised or recorded.

## Libraries versus applications

A library calls `getLogger(__name__)` and logs; it **never** calls `basicConfig`, adds handlers or sets levels — those decisions belong to the application that imports it. The application configures logging once, at start-up in `main`, from its settings. A library that configures logging hijacks the application's output; the `NullHandler` on its top logger is the polite default so that no "no handlers found" warning appears if the application configures nothing.

## When to log what

`DEBUG`: values and steps useful only when diagnosing. `INFO`: milestones an operator wants to see once — started, loaded 42 rows, finished in 3 s. `WARNING`: something unexpected that the program handled. `ERROR`: an operation failed. `CRITICAL`: the program cannot continue. Do not log secrets (tokens, passwords, personal data); do not log in tight loops at `INFO`; do log the identifiers (`record.id`, `order_id`) that let someone find the problem later.

## print versus logging

`print` writes the program's *result* to stdout. `logging` writes its *narrative* to wherever it is configured, with levels, timestamps, names and a switch. A script that prints "loading…" mixes narrative into results and cannot be piped; converting those prints to `log.info` fixes it in one line each.

## Pitfalls

- `basicConfig` in a library.
- f-strings in log calls.
- `print(e)` at a boundary instead of `log.exception`.
- A hand-written logger name instead of `__name__`.
- Timestamps in a format string for output that must be reproducible.
- Logging at `INFO` inside a loop that runs a million times.

## Key takeaways

- `logging.getLogger(__name__)` per module; levels `DEBUG` < `INFO` < `WARNING` < `ERROR` < `CRITICAL`; the default threshold is `WARNING`.
- `basicConfig(level=, format=)` once in the application's `main`; never in a library.
- Loggers form a tree by name; settings and handlers on a parent apply to children; messages propagate up.
- `%s` arguments are formatted lazily; `log.exception` records the traceback; handlers and formatters route output.
- `print` is for results, `logging` for the narrative.
