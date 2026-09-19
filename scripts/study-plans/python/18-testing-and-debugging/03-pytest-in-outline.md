---
title: pytest in outline — plain asserts, fixtures, parametrize and the command line
minutes: 13
---
pytest is the test runner most Python projects use: tests are plain functions named `test_*`, assertions are the `assert` statement with the failing expression's values shown on failure, fixtures are functions whose return value is injected by parameter name, and `@pytest.mark.parametrize` turns one test into a table. It is a third-party package (`pip install pytest`) and the judge does not have it, so this lesson is reading and the exercises rebuild its two central mechanisms — parametrisation and fixtures with teardown — in plain Python, which is the best way to understand what pytest does for you. It covers the assert rewriting, fixtures and their scopes, `parametrize`, `raises`, markers and the command-line flags you use daily, and how pytest runs `unittest` suites unchanged.

## A test file

```python
# test_slugify.py
from slugify import slugify

def test_lowercases_and_joins():
    assert slugify("Hello World") == "hello-world"

def test_collapses_whitespace():
    assert slugify("  a   b ") == "a-b"
```

`pytest` in the project directory finds `test_*.py` and `*_test.py` files, collects `test_*` functions and `Test*` classes (no base class needed), runs them, and prints a dot per pass. On failure it shows the assertion with every sub-expression's value:

```text
    def test_collapses_whitespace():
>       assert slugify("  a   b ") == "a-b"
E       AssertionError: assert 'a--b' == 'a-b'
E         - a-b
E         + a--b
```

That is *assertion rewriting*: pytest recompiles test modules so a plain `assert` reports like a specialised method. There is no assertion family to learn.

## Fixtures

```python
import pytest

@pytest.fixture
def inventory():
    inv = Inventory()
    inv.add("bolt", 10)
    yield inv                      # the test runs here
    inv.close()                    # teardown, even if the test failed

def test_remove(inventory):        # injected by parameter name
    inventory.remove("bolt", 4)
    assert inventory.count("bolt") == 6
```

A fixture is a function decorated with `@pytest.fixture`; a test that names it as a parameter receives its value. A fixture that `yield`s runs its remainder as teardown. Fixtures can use other fixtures, and `scope="module"` or `"session"` makes one instance serve many tests (a database connection). Fixtures in `conftest.py` are available to every test in that directory tree without imports. Built-in fixtures: `tmp_path` (a fresh temporary directory as a `Path`), `monkeypatch` (`monkeypatch.setattr(obj, "name", value)`, `setenv`, all undone afterwards), `capsys` (captured stdout/stderr via `capsys.readouterr()`), `caplog` (captured log records).

## parametrize

```python
@pytest.mark.parametrize("text, expected", [
    ("1h", 3600),
    ("30m", 1800),
    ("1h30m", 5400),
    pytest.param("", 0, id="empty"),
])
def test_parse_duration(text, expected):
    assert parse_duration(text) == expected
```

One function, four tests, each reported separately as `test_parse_duration[1h-3600]`, and each failing independently. Stacking two `parametrize` decorators produces the cross product. This is `subTest` without the indentation and with proper per-case identity.

## raises, approx, markers

```python
with pytest.raises(ValueError, match="name"):
    User(name="")

assert total == pytest.approx(99.0)                  # float tolerance

@pytest.mark.skipif(sys.platform == "win32", reason="posix only")
@pytest.mark.xfail(reason="bug #42")
@pytest.mark.slow                                    # custom marker; select with -m slow
```

`pytest.raises` is the `assertRaises` twin, `match` is a regex on the message; `approx` compares floats and sequences of floats with relative tolerance; markers tag tests for selection, skipping and expected failure.

## The command line

| Flag | Effect |
| --- | --- |
| `pytest -x` | stop at the first failure |
| `pytest -k "slug and not empty"` | select by name expression |
| `pytest path/test_x.py::test_name` | one test |
| `pytest --lf` / `--ff` | rerun last failures / failures first |
| `pytest -v` / `-q` | verbose / quiet |
| `pytest -s` | do not capture stdout (see prints) |
| `pytest --pdb` | drop into the debugger on failure |
| `pytest -m slow` / `-m "not slow"` | by marker |
| `pytest --durations=10` | the slowest tests |

Configuration lives in `pyproject.toml` under `[tool.pytest.ini_options]` (`testpaths`, `addopts`, registered `markers`). Plugins add flags: `pytest-cov` for coverage, `pytest-xdist` for `-n auto` parallel runs, `pytest-asyncio` for `async def` tests.

## unittest under pytest

pytest runs `unittest.TestCase` classes as they are — `setUp`, assertion methods and all — so a code base can migrate one file at a time, and a new test file beside old ones can use the plain style. The two styles differ in fixtures (methods versus injected functions) and assertions (methods versus `assert`); the discipline of the previous lesson — one behaviour per test, edges and errors, fresh state — is identical.

## Rebuilding the mechanisms

Both of pytest's central ideas are small. Parametrisation is a decorator that attaches a list of argument tuples to a function, and a runner that calls the function once per tuple, catching `AssertionError` and reporting each case by name. A yield-fixture is a generator: the runner calls `next()` to get the value, runs the test, then calls `next()` again inside a `finally` so teardown runs whether the test passed or not. The exercises build exactly these, which is also what you would write to run a table of checks in a script with no framework available.

## Pitfalls

- A fixture that does setup with `return` and expects teardown to run — only `yield` fixtures tear down.
- `assert` in production code for validation — `python -O` strips it; use exceptions.
- A parametrize id that is unreadable in the report — `pytest.param(..., id="…")`.
- Tests that pass only because of a session-scoped fixture's leftover state.
- Forgetting `-s` and wondering where the prints went.
- Mixing `unittest` assertion methods into plain functions (`self` does not exist there).

## Key takeaways

- pytest collects `test_*` functions and reports plain `assert` with values; no base class, no assertion family.
- Fixtures are injected by parameter name; `yield` fixtures tear down; `tmp_path`, `monkeypatch`, `capsys` are built in; `conftest.py` shares them.
- `@pytest.mark.parametrize` makes a table into independent tests; `raises`, `approx` and markers cover exceptions, floats and selection.
- `-x`, `-k`, `--lf`, `-s`, `--pdb` are the daily flags; configuration lives in `pyproject.toml`.
- Parametrisation is "call once per tuple"; a yield fixture is a generator driven by `next()` around the test — small enough to rebuild when pytest is not there.
