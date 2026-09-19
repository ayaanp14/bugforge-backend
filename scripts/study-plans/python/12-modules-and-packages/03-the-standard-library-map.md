---
title: The standard library map — where to look before you write it
minutes: 14
---
"Batteries included" is Python's oldest slogan, and the batteries are the reason a Python program that parses a date, reads a CSV, hashes a file and serves it over HTTP is a hundred lines rather than a thousand. The skill is knowing the map: which module holds the thing you need, so that you look there before writing it yourself. This lesson is that map — the modules grouped by job, with the one or two functions each is used for — plus how to read the documentation and how to explore a module from the REPL. Later modules of this track go deep on the areas that matter most; this one is the index.

## Text

| Module | For |
| --- | --- |
| `string` | `ascii_letters`, `digits`, `punctuation`, `Template` |
| `re` | regular expressions (Module 5) |
| `textwrap` | `wrap`, `fill`, `dedent`, `shorten`, `indent` |
| `difflib` | `SequenceMatcher`, `unified_diff`, `get_close_matches` |
| `unicodedata` | `normalize`, `name`, `category` |
| `pprint` | `pprint`, `pformat` for nested data |

## Data structures and functional tools

| Module | For |
| --- | --- |
| `collections` | `Counter`, `defaultdict`, `deque`, `namedtuple`, `OrderedDict`, `ChainMap` |
| `itertools` | `chain`, `islice`, `groupby`, `product`, `combinations`, `accumulate` (Module 11) |
| `functools` | `cache`, `partial`, `reduce`, `wraps`, `singledispatch` (Module 11) |
| `operator` | `itemgetter`, `attrgetter`, the operators as functions |
| `heapq`, `bisect` | priority queues, binary search in sorted lists (Module 7) |
| `enum` | `Enum`, `IntEnum`, `Flag`, `auto` (Module 13) |
| `dataclasses` | `dataclass`, `field`, `asdict` (Module 8) |
| `copy` | `copy`, `deepcopy` |
| `array` | compact homogeneous numeric arrays |

## Numbers

| Module | For |
| --- | --- |
| `math` | `sqrt`, `gcd`, `lcm`, `isqrt`, `comb`, `factorial`, `log`, `floor`, `ceil`, `isclose`, `inf`, `pi` |
| `statistics` | `mean`, `median`, `mode`, `stdev`, `quantiles` |
| `fractions` | `Fraction` — exact rationals |
| `decimal` | `Decimal` — decimal floating point for money |
| `random` | `Random(seed)`, `randint`, `choice`, `shuffle`, `sample` |
| `secrets` | cryptographically strong tokens and choices |
| `numbers` | the numeric ABCs (`Number`, `Integral`) |

## Dates and times

| Module | For |
| --- | --- |
| `datetime` | `date`, `time`, `datetime`, `timedelta`, `strptime`/`strftime` (Module 13) |
| `zoneinfo` | IANA time zones: `ZoneInfo("Asia/Kolkata")` |
| `time` | `perf_counter`, `monotonic`, `sleep`, `time` |
| `calendar` | month tables, leap years, weekday names |

## Files, paths and the OS

| Module | For |
| --- | --- |
| `pathlib` | `Path` — the object-oriented file system API (Module 14) |
| `os` | `environ`, `getcwd`, `listdir`, process and OS calls |
| `os.path` | the older string-path functions |
| `shutil` | `copy`, `move`, `rmtree`, `which`, disk usage |
| `glob`, `fnmatch` | wildcard file matching |
| `tempfile` | `TemporaryDirectory`, `NamedTemporaryFile` |
| `io` | `StringIO`, `BytesIO` — in-memory files |
| `sys` | `argv`, `stdin`/`stdout`/`stderr`, `exit`, `path`, `version_info`, `setrecursionlimit` |
| `subprocess` | run other programs: `run(["ls", "-l"], capture_output=True, text=True)` |
| `argparse` | command-line parsing (lesson 5) |
| `logging` | structured logging (Module 15) |

## Data formats and persistence

| Module | For |
| --- | --- |
| `json` | `loads`/`dumps`, `load`/`dump` (Modules 7, 14) |
| `csv` | `reader`, `writer`, `DictReader`, `DictWriter` (Module 14) |
| `tomllib` | read TOML (3.11); writing needs a third-party package |
| `configparser` | INI files |
| `pickle` | Python-object serialisation — never load untrusted data |
| `sqlite3` | an embedded SQL database (Module 14) |
| `struct` | pack/unpack binary records |
| `base64`, `hashlib`, `hmac`, `zlib`, `gzip`, `zipfile`, `tarfile` | encodings, digests, compression, archives |
| `xml.etree.ElementTree`, `html` | XML parsing, HTML escaping |

## Concurrency and networking

| Module | For |
| --- | --- |
| `threading`, `queue` | threads, locks, thread-safe queues (Module 17) |
| `multiprocessing`, `concurrent.futures` | processes and pools (Module 17) |
| `asyncio` | the async event loop (Module 17) |
| `socket`, `ssl`, `selectors` | low-level networking |
| `http.client`, `http.server`, `urllib.request` | HTTP without third-party packages |
| `email`, `smtplib` | building and sending mail |

## Language, testing and tooling

| Module | For |
| --- | --- |
| `typing`, `abc`, `collections.abc` | hints, ABCs, protocols (Modules 9, 15) |
| `contextlib` | context-manager helpers (Module 10) |
| `unittest`, `unittest.mock`, `doctest` | testing (Module 18) |
| `traceback`, `warnings`, `pdb`, `inspect` | debugging and introspection |
| `timeit`, `cProfile`, `tracemalloc`, `dis` | measurement (Module 19) |
| `importlib` | import by name, package resources |
| `ast` | parse Python source; `literal_eval` |
| `venv`, `ensurepip` | environments (lesson 4) |

## Reading the documentation

Every module's page at `docs.python.org/3/library/` follows one shape: a summary, the functions and classes with their signatures and version notes ("Changed in version 3.10"), then examples. Read the signature, then the version note if you support older interpreters, then the example. In the REPL, `help(module)` prints the docstrings, `dir(module)` lists the names, and `help(module.function)` shows the signature — enough for most questions without leaving the terminal. For a function whose behaviour you are unsure of, the fastest check is to call it on a small value and look.

## The habit

Before writing a helper, ask: is this a text job (`textwrap`, `difflib`), a collection job (`collections`, `itertools`), a number job (`math`, `statistics`), a file job (`pathlib`, `shutil`), a format job (`json`, `csv`)? Ten minutes with the map saves an hour and a bug: the library's version has been tested on the edge cases you have not thought of yet.

## Pitfalls

- Writing a mean, a deque, a permutations generator or a CSV parser by hand.
- `pickle.load` on data from outside your program.
- `time.time` where `perf_counter` (timing) or `monotonic` (timeouts) was meant.
- `os.path` string juggling where `pathlib` reads better.
- Reaching for a third-party package before checking the standard library.
- Guessing at behaviour instead of a two-line REPL experiment.

## Key takeaways

- The standard library covers text, collections, numbers, dates, files, formats, concurrency, networking, testing and tooling; know the map before writing helpers.
- `collections`, `itertools`, `functools`, `pathlib`, `json`, `csv`, `datetime`, `re`, `math`, `logging`, `unittest` are the modules every program touches.
- `help()`, `dir()` and a small experiment in the REPL answer most questions; the docs show signature, version notes, examples.
- `pickle` is for trusted data only; `secrets` for anything security-related; `perf_counter` for timing.
- Prefer the library's tested implementation to a hand-written one.
