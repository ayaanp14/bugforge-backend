---
title: unittest — TestCase, assertions, fixtures, subTest and running suites
minutes: 15
---
`unittest` is the test framework in the standard library: tests are methods named `test_*` on a `TestCase` subclass, assertions are methods (`assertEqual`, `assertRaises`, …) that produce readable failure messages, `setUp` and `tearDown` build and clear state around each test, and `python -m unittest` discovers and runs them. It is more verbose than pytest (next lesson) and it is everywhere — CI images, older code bases, environments where nothing can be installed — so knowing it well is not optional. This lesson covers the class, the assertion family, fixtures at three scopes, `subTest` for tables, skipping and expected failures, and running a suite in-process so a program can report its own results.

## The shape

```python
import unittest

def slugify(text):
    return "-".join(text.lower().split())

class TestSlugify(unittest.TestCase):
    def test_lowercases_and_joins(self):
        self.assertEqual(slugify("Hello World"), "hello-world")

    def test_collapses_whitespace(self):
        self.assertEqual(slugify("  a   b "), "a-b")

    def test_empty(self):
        self.assertEqual(slugify(""), "")

if __name__ == "__main__":
    unittest.main()
```

Run with `python test_slugify.py` or `python -m unittest test_slugify` (or `python -m unittest` alone to discover `test*.py` files). Output: a dot per passing test, `F` for a failure (an assertion was false), `E` for an error (an unexpected exception), then a summary.

## The assertion family

| Method | Checks |
| --- | --- |
| `assertEqual(a, b)` / `assertNotEqual` | `a == b`, with a diff for strings, lists and dicts |
| `assertTrue(x)` / `assertFalse(x)` | truthiness — prefer a more specific assertion when one exists |
| `assertIs(a, b)` / `assertIsNone(x)` | identity |
| `assertIn(x, xs)` / `assertNotIn` | membership |
| `assertIsInstance(x, cls)` | type |
| `assertAlmostEqual(a, b, places=7)` | floats, rounded difference |
| `assertGreater`, `assertLess`, `assertGreaterEqual`, … | comparisons |
| `assertRaises(Exc)` | as a context manager: the block raises `Exc` |
| `assertRaisesRegex(Exc, pattern)` | and its message matches |
| `assertCountEqual(a, b)` | same elements in any order |
| `assertDictEqual`, `assertListEqual`, … | explicit, with diffs |

Every method takes a final `msg=` argument added to the failure output. The specific methods matter because their messages are specific: `assertEqual([1, 2], [1, 3])` shows where the lists differ; `assertTrue([1, 2] == [1, 3])` says only "False is not true".

```python
def test_rejects_empty_name(self):
    with self.assertRaises(ValueError) as ctx:
        User(name="")
    self.assertIn("name", str(ctx.exception))
```

## Fixtures: setUp, tearDown and class-level

```python
class TestInventory(unittest.TestCase):
    @classmethod
    def setUpClass(cls):                    # once per class — expensive shared state
        cls.catalogue = load_catalogue()

    def setUp(self):                        # before EVERY test — fresh state
        self.inv = Inventory(self.catalogue)
        self.inv.add("bolt", 10)

    def tearDown(self):                     # after every test, even a failing one
        self.inv.close()

    def test_remove(self):
        self.inv.remove("bolt", 4)
        self.assertEqual(self.inv.count("bolt"), 6)
```

`setUp` runs before each test method and `tearDown` after, so every test starts from the same state and no test sees another's leftovers. `setUpClass`/`tearDownClass` bracket the whole class; `setUpModule` the module. `self.addCleanup(fn)` registers a callback run after `tearDown` — the safest way to release something acquired mid-test. Temporary files belong in `tempfile.TemporaryDirectory()` opened in `setUp` and cleaned in `tearDown`.

## subTest: tables without a method per row

```python
def test_parse_durations(self):
    cases = [("1h", 3600), ("30m", 1800), ("1h30m", 5400), ("45s", 45)]
    for text, expected in cases:
        with self.subTest(text=text):
            self.assertEqual(parse_duration(text), expected)
```

Without `subTest`, the loop stops at the first failing row; with it, every row is checked and each failure is reported with its parameters. The method still counts as one test in `testsRun`, but each failing subtest appears as its own entry in the failures list.

## Skipping and expected failures

`@unittest.skip("reason")`, `@unittest.skipIf(cond, "reason")`, `@unittest.skipUnless(cond, "reason")` skip a test or a whole class; `self.skipTest("reason")` skips from inside. `@unittest.expectedFailure` marks a known bug: the test passing becomes an "unexpected success". Skips are reported in the summary and are not failures — a suite that silently skips half its tests on CI because a dependency is missing is a common way to ship a regression.

## Running in-process

```python
import io, unittest

suite = unittest.defaultTestLoader.loadTestsFromTestCase(TestSlugify)
result = unittest.TextTestRunner(stream=io.StringIO(), verbosity=0).run(suite)
print("ran", result.testsRun)
print("failures", len(result.failures), "errors", len(result.errors))
print("ok", result.wasSuccessful())
for test, _traceback in result.failures:
    print("failed", test.id().rsplit(".", 1)[-1])
```

`unittest.main()` calls `sys.exit` with the result, which is right for a test file and wrong for a program that wants to keep going; loading a suite and running it with a `TextTestRunner` on a `StringIO` stream keeps the report ("Ran 3 tests in 0.001s", whose timing is not reproducible) off stdout and gives you the `TestResult` to print from. `unittest.main(argv=["prog"], exit=False)` is the shorter form when the module-level discovery is wanted. `result.failures` and `result.errors` are lists of `(test, traceback_text)`; `test.id()` is `module.Class.method`.

## Organising a suite

One test module per source module (`test_slugify.py` beside or under `tests/` for `slugify.py`), one `TestCase` per class or cohesive function group, and names that read as sentences: `TestSlugify.test_collapses_whitespace`. `python -m unittest discover -s tests -p "test_*.py"` finds them; `-v` prints each name; `-k slug` runs the ones whose names match; `--failfast` stops at the first failure. Keep the tests importable without side effects — no network calls or file writes at module level — because discovery imports every test module before running anything.

## Pitfalls

- `assertTrue(a == b)` instead of `assertEqual(a, b)` — the failure message says nothing.
- State created in `__init__` or at class level instead of `setUp`, shared between tests.
- A test method not starting with `test_` — silently never run.
- `assertRaises(Exception)` — too broad; name the exception.
- `unittest.main()` inside a program that must continue.
- Comparing floats with `assertEqual`.

## Key takeaways

- Tests are `test_*` methods on a `TestCase`; run with `python -m unittest` or `unittest.main()`.
- Use the specific assertion (`assertEqual`, `assertIn`, `assertRaises` as a context manager, `assertAlmostEqual`) for a message that explains the failure.
- `setUp`/`tearDown` give every test fresh state; `setUpClass` shares expensive state; `addCleanup` releases resources.
- `subTest` checks every row of a table and reports each failure with its parameters.
- Run in-process with `TextTestRunner(stream=StringIO())` and read `testsRun`, `failures`, `errors`, `wasSuccessful()` from the result.
