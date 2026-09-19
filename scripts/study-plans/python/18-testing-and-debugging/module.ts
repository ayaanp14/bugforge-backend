import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "testing-and-debugging",
  title: "Testing and debugging",
  blurb: "The testing mindset and designing for testability; unittest with its assertion family, fixtures, subTest and in-process runs; pytest's fixtures and parametrize and the mechanisms behind them; test doubles with Mock, side_effect and patch; and debugging by reading tracebacks, logging, pdb and the reproduce–minimise–bisect method.",
  icon: "memory",
  overview: `A test is a program that runs your code with known inputs and checks the outputs, so that a machine catches a regression before a user does. Everything in this module follows from that: tests pin behaviour, not implementation; they cover edges and errors; they are fast, isolated and deterministic; and the code they exercise is written so the world — the clock, randomness, the network, a sender — can be passed in and replaced. Debugging is the same discipline in reverse: reading what the interpreter already reports, recording the path the program took, and shrinking the mystery until the cause is one line.

The testing mindset gives the kinds of test, arrange–act–assert, what to test and the injection moves that make code testable. unittest covers \`TestCase\`, the assertion family, \`setUp\`/\`tearDown\`, \`subTest\`, skipping, and running a suite in-process to read its result. pytest in outline covers plain asserts, fixtures, \`parametrize\`, \`raises\`, markers and the command line — and rebuilds parametrisation and yield-fixtures in plain Python, since pytest is not on the judge. Mocking covers stubs, fakes, spies and mocks, the \`Mock\` API, \`side_effect\`, \`patch\` in its forms and the rule about where to patch, \`spec\` and \`autospec\`. Debugging covers reading tracebacks bottom-up, chained exceptions, \`logging\`, \`pdb\`, \`assert\` and the dev switches, and the method.

The exercises are whole programs: a test harness over a table of cases, an injected clock, a \`unittest\` suite that must catch an injected bug by name, a \`subTest\` table, a plain-Python \`parametrize\` and yield fixture, a spied notifier, a patched network call with a scripted \`side_effect\`, a logging pipeline with a counting filter, and a traceback parser. The checkpoint adds a bank-account suite against three injected bugs, a retry helper against a scripted mock, and a counting log handler.`,
  lessons: [
    {
      slug: "testing-mindset",
      file: "01-testing-mindset.md",
      exercises: [
        {
          title: "A table of cases",
          prompt: `Implement \`parse_duration(text)\` returning seconds for strings made of optional \`<n>h\`, \`<n>m\` and \`<n>s\` parts in that order (\`1h30m\`, \`45s\`, \`2h\`), raising \`ValueError\` for anything else. Then read lines \`<input> <expected>\` until EOF, where \`expected\` is an integer or the word \`error\`, and run each through the function: print \`ok <input> -> <got>\` when the result (or \`error\` when it raised) matches, else \`FAIL <input>: expected <expected>, got <got>\`. Finish with \`passed <x> of <y>\`.

**Input:** one case per line.
**Output:** one line per case, then the summary.

\`\`\`text
1h 3600
30m 1800
1h30m 5400
45s 45
2h 7000
x error
\`\`\`
prints
\`\`\`text
ok 1h -> 3600
ok 30m -> 1800
ok 1h30m -> 5400
ok 45s -> 45
FAIL 2h: expected 7000, got 7200
ok x -> error
passed 5 of 6
\`\`\``,
          starter: String.raw`import re
import sys

PATTERN = re.compile(r"(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?")


def parse_duration(text):
    # TODO: fullmatch, else ValueError
    return 0


def run_case(text):
    """Return the result as a string: the seconds, or 'error' when it raised."""
    # TODO
    return ""


passed = total = 0
for line in sys.stdin:
    parts = line.split()
    if len(parts) != 2:
        continue
    text, expected = parts
    # TODO: compare, print, count

print(f"passed {passed} of {total}")
`,
          solution: String.raw`import re
import sys

PATTERN = re.compile(r"(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?")


def parse_duration(text):
    match = PATTERN.fullmatch(text)
    if match is None:
        raise ValueError(f"bad duration: {text!r}")
    hours, minutes, seconds = (int(part) if part else 0 for part in match.groups())
    return hours * 3600 + minutes * 60 + seconds


def run_case(text):
    """Return the result as a string: the seconds, or 'error' when it raised."""
    try:
        return str(parse_duration(text))
    except ValueError:
        return "error"


passed = total = 0
for line in sys.stdin:
    parts = line.split()
    if len(parts) != 2:
        continue
    text, expected = parts
    got = run_case(text)
    total += 1
    if got == expected:
        passed += 1
        print(f"ok {text} -> {got}")
    else:
        print(f"FAIL {text}: expected {expected}, got {got}")

print(f"passed {passed} of {total}")
`,
          hints: [
            "`PATTERN.fullmatch(text)` returns `None` unless the whole string is hours-minutes-seconds in order; each group is `None` when its part is absent.",
            "Turning both the raised case and the numeric case into strings makes the comparison one `==`.",
          ],
          cases: [
            { stdin: "1h 3600\n30m 1800\n1h30m 5400\n45s 45\n2h 7000\nx error\n", expected: "ok 1h -> 3600\nok 30m -> 1800\nok 1h30m -> 5400\nok 45s -> 45\nFAIL 2h: expected 7000, got 7200\nok x -> error\npassed 5 of 6\n" },
            { stdin: "0s 0\n1m1s 61\nabc error\n", expected: "ok 0s -> 0\nok 1m1s -> 61\nok abc -> error\npassed 3 of 3\n", hidden: true },
            { stdin: "1h error\n5m 300\n", expected: "FAIL 1h: expected error, got 3600\nok 5m -> 300\npassed 1 of 2\n", hidden: true },
          ],
        },
        {
          title: "Inject the clock",
          prompt: `Write \`status(due, today)\` taking two \`datetime.date\` values and returning \`overdue by <n> day(s)\` when \`due\` is before \`today\`, \`due today\` when equal, and \`due in <n> day(s)\` otherwise — with \`day\` for 1 and \`days\` otherwise. Read \`today\` as an ISO date on the first line, then lines \`<name> <YYYY-MM-DD>\` until EOF; print \`<name>: <status>\` per line, then \`overdue <count>\`. The date is a parameter, never \`date.today()\`, so the program is testable.

**Input:** the date, then one item per line.
**Output:** one line per item, then the count.

\`\`\`text
2024-03-10
tax 2024-03-01
rent 2024-03-10
gym 2024-03-15
\`\`\`
prints
\`\`\`text
tax: overdue by 9 days
rent: due today
gym: due in 5 days
overdue 1
\`\`\``,
          starter: String.raw`import sys
from datetime import date


def days(n):
    return f"{n} day" if n == 1 else f"{n} days"


def status(due, today):
    # TODO
    return ""


today = date.fromisoformat(sys.stdin.readline().strip())
overdue = 0
for line in sys.stdin:
    parts = line.split()
    if len(parts) != 2:
        continue
    name, due = parts[0], date.fromisoformat(parts[1])
    # TODO

print("overdue", overdue)
`,
          solution: String.raw`import sys
from datetime import date


def days(n):
    return f"{n} day" if n == 1 else f"{n} days"


def status(due, today):
    delta = (due - today).days
    if delta < 0:
        return f"overdue by {days(-delta)}"
    if delta == 0:
        return "due today"
    return f"due in {days(delta)}"


today = date.fromisoformat(sys.stdin.readline().strip())
overdue = 0
for line in sys.stdin:
    parts = line.split()
    if len(parts) != 2:
        continue
    name, due = parts[0], date.fromisoformat(parts[1])
    text = status(due, today)
    if text.startswith("overdue"):
        overdue += 1
    print(f"{name}: {text}")

print("overdue", overdue)
`,
          hints: [
            "`(due - today).days` is negative for the past, zero for today, positive for the future.",
            "Because `today` comes from the input, the same program can be checked against any date — that is the point of injecting the clock.",
          ],
          cases: [
            { stdin: "2024-03-10\ntax 2024-03-01\nrent 2024-03-10\ngym 2024-03-15\n", expected: "tax: overdue by 9 days\nrent: due today\ngym: due in 5 days\noverdue 1\n" },
            { stdin: "2024-02-28\nleap 2024-03-01\n", expected: "leap: due in 2 days\noverdue 0\n", hidden: true },
            { stdin: "2023-01-01\nold 2022-12-25\na 2023-01-02\n", expected: "old: overdue by 7 days\na: due in 1 day\noverdue 1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What are the three parts of a well-shaped test, in order?",
          options: ["Setup, run, cleanup", "Arrange, act, assert", "Import, call, print", "Mock, call, verify"],
          answer: 1,
          explanation: "Build the inputs, make one call, check one behaviour.",
        },
        {
          prompt: "Which is worth a unit test?",
          options: ["That `list.append` works", "The boundary where a discount starts applying", "A private helper's exact call sequence", "A trivial getter"],
          answer: 1,
          explanation: "Edges, errors and fixed bugs are where regressions live; the standard library and implementation details are not.",
        },
        {
          prompt: "Why is a flaky test worse than no test?",
          options: ["It is slow", "It trains people to ignore failures, so a real one is missed", "It uses memory", "It cannot be deleted"],
          answer: 1,
          explanation: "Determinism is a property of a trustworthy suite.",
        },
        {
          prompt: "How do you make a function that uses the current date testable?",
          options: ["Mock `datetime` everywhere", "Pass `today` as a parameter and let the caller supply `date.today()`", "Freeze the system clock", "Avoid dates"],
          answer: 1,
          explanation: "Functional core, imperative shell: the world is passed in.",
        },
        {
          prompt: "What does 100 % line coverage prove?",
          options: ["The code is correct", "Every line executed under some test — not that its behaviour was checked", "There are no bugs", "The tests are fast"],
          answer: 1,
          explanation: "Coverage is a signal about untested lines, not a goal.",
        },
      ],
    },
    {
      slug: "unittest",
      file: "02-unittest.md",
      exercises: [
        {
          title: "Catch the injected bug",
          prompt: `The starter defines \`Stack\` with a bug injected according to the first input line: \`none\`, \`pop\` (pops from the wrong end), \`peek\` (peeks at the wrong end) or \`empty\` (pop on an empty stack returns \`None\` instead of raising). Write \`TestStack(unittest.TestCase)\` with exactly these tests: \`test_push_then_pop\` (push 1 and 2, expect \`pop()\` to give 2 then 1), \`test_peek_does_not_remove\` (push 1 and 2, expect \`peek()\` 2 and \`len\` 2), \`test_pop_empty_raises\` (\`assertRaises(IndexError)\` around \`pop()\` on a new stack) and \`test_len_and_is_empty\` (new stack: \`is_empty()\` and \`len\` 0; after \`push(5)\`: \`len\` 1 and not empty). Run the suite with a \`TextTestRunner\` on a \`StringIO\` stream and print \`ran <n>\`, \`failures <f>\`, \`errors <e>\`, \`ok <True/False>\`, then \`failed <method name>\` for each failure, sorted.

**Input:** the bug name.
**Output:** four lines, then any failed test names.

\`\`\`text
none
\`\`\`
prints
\`\`\`text
ran 4
failures 0
errors 0
ok True
\`\`\``,
          starter: String.raw`import io
import unittest

BUG = input().strip()


class Stack:
    def __init__(self):
        self._items = []

    def push(self, item):
        self._items.append(item)

    def pop(self):
        if not self._items:
            if BUG == "empty":
                return None
            raise IndexError("pop from empty stack")
        return self._items.pop(0) if BUG == "pop" else self._items.pop()

    def peek(self):
        if not self._items:
            raise IndexError("peek at empty stack")
        return self._items[0] if BUG == "peek" else self._items[-1]

    def is_empty(self):
        return not self._items

    def __len__(self):
        return len(self._items)


class TestStack(unittest.TestCase):
    # TODO: the four tests
    pass


# TODO: load, run on a StringIO stream, print the summary
`,
          solution: String.raw`import io
import unittest

BUG = input().strip()


class Stack:
    def __init__(self):
        self._items = []

    def push(self, item):
        self._items.append(item)

    def pop(self):
        if not self._items:
            if BUG == "empty":
                return None
            raise IndexError("pop from empty stack")
        return self._items.pop(0) if BUG == "pop" else self._items.pop()

    def peek(self):
        if not self._items:
            raise IndexError("peek at empty stack")
        return self._items[0] if BUG == "peek" else self._items[-1]

    def is_empty(self):
        return not self._items

    def __len__(self):
        return len(self._items)


class TestStack(unittest.TestCase):
    def setUp(self):
        self.stack = Stack()

    def test_push_then_pop(self):
        self.stack.push(1)
        self.stack.push(2)
        self.assertEqual(self.stack.pop(), 2)
        self.assertEqual(self.stack.pop(), 1)

    def test_peek_does_not_remove(self):
        self.stack.push(1)
        self.stack.push(2)
        self.assertEqual(self.stack.peek(), 2)
        self.assertEqual(len(self.stack), 2)

    def test_pop_empty_raises(self):
        with self.assertRaises(IndexError):
            self.stack.pop()

    def test_len_and_is_empty(self):
        self.assertTrue(self.stack.is_empty())
        self.assertEqual(len(self.stack), 0)
        self.stack.push(5)
        self.assertEqual(len(self.stack), 1)
        self.assertFalse(self.stack.is_empty())


suite = unittest.defaultTestLoader.loadTestsFromTestCase(TestStack)
result = unittest.TextTestRunner(stream=io.StringIO(), verbosity=0).run(suite)
print("ran", result.testsRun)
print("failures", len(result.failures))
print("errors", len(result.errors))
print("ok", result.wasSuccessful())
for name in sorted(test.id().rsplit(".", 1)[-1] for test, _ in result.failures):
    print("failed", name)
`,
          hints: [
            "`setUp` gives every test a fresh `Stack`; the four methods then read as arrange–act–assert.",
            "`result.failures` is a list of `(test, traceback)`; `test.id()` ends with the method name.",
          ],
          cases: [
            { stdin: "none\n", expected: "ran 4\nfailures 0\nerrors 0\nok True\n" },
            { stdin: "pop\n", expected: "ran 4\nfailures 1\nerrors 0\nok False\nfailed test_push_then_pop\n", hidden: true },
            { stdin: "empty\n", expected: "ran 4\nfailures 1\nerrors 0\nok False\nfailed test_pop_empty_raises\n", hidden: true },
            { stdin: "peek\n", expected: "ran 4\nfailures 1\nerrors 0\nok False\nfailed test_peek_does_not_remove\n", hidden: true },
          ],
        },
        {
          title: "A subTest table",
          prompt: `Write \`checked_div(a, b)\` returning \`a / b\` and raising \`ZeroDivisionError\` when \`b\` is 0. Read rows \`a b expected\` until EOF, where \`expected\` is a number or the word \`raises\`. Write a \`TestCase\` with \`test_table\`, which loops over the numeric rows inside \`with self.subTest(a=a, b=b):\` asserting \`checked_div(a, b) == float(expected)\`, and \`test_raises\`, which loops over the \`raises\` rows inside \`subTest\` asserting \`assertRaises(ZeroDivisionError)\`. Run the suite on a \`StringIO\` stream and print \`ran <n>\`, \`failures <f>\`, \`errors <e>\`, \`ok <True/False>\`.

**Input:** one row per line.
**Output:** four lines.

\`\`\`text
10 2 5
7 2 3.5
1 0 raises
9 3 4
\`\`\`
prints
\`\`\`text
ran 2
failures 1
errors 0
ok False
\`\`\``,
          starter: String.raw`import io
import sys
import unittest

ROWS = [line.split() for line in sys.stdin if len(line.split()) == 3]
NUMERIC = [(int(a), int(b), float(e)) for a, b, e in ROWS if e != "raises"]
RAISING = [(int(a), int(b)) for a, b, e in ROWS if e == "raises"]


def checked_div(a, b):
    # TODO
    return 0


class TestDiv(unittest.TestCase):
    def test_table(self):
        # TODO: subTest over NUMERIC
        pass

    def test_raises(self):
        # TODO: subTest over RAISING
        pass


# TODO: run and print
`,
          solution: String.raw`import io
import sys
import unittest

ROWS = [line.split() for line in sys.stdin if len(line.split()) == 3]
NUMERIC = [(int(a), int(b), float(e)) for a, b, e in ROWS if e != "raises"]
RAISING = [(int(a), int(b)) for a, b, e in ROWS if e == "raises"]


def checked_div(a, b):
    if b == 0:
        raise ZeroDivisionError("b must not be zero")
    return a / b


class TestDiv(unittest.TestCase):
    def test_table(self):
        for a, b, expected in NUMERIC:
            with self.subTest(a=a, b=b):
                self.assertEqual(checked_div(a, b), expected)

    def test_raises(self):
        for a, b in RAISING:
            with self.subTest(a=a, b=b):
                with self.assertRaises(ZeroDivisionError):
                    checked_div(a, b)


suite = unittest.defaultTestLoader.loadTestsFromTestCase(TestDiv)
result = unittest.TextTestRunner(stream=io.StringIO(), verbosity=0).run(suite)
print("ran", result.testsRun)
print("failures", len(result.failures))
print("errors", len(result.errors))
print("ok", result.wasSuccessful())
`,
          hints: [
            "Each failing `subTest` block becomes one entry in `result.failures` while `testsRun` stays at the number of test methods.",
            "`assertRaises` as a context manager fails when the block returns without raising — that is how a wrong `raises` row is caught.",
          ],
          cases: [
            { stdin: "10 2 5\n7 2 3.5\n1 0 raises\n9 3 4\n", expected: "ran 2\nfailures 1\nerrors 0\nok False\n" },
            { stdin: "8 4 2\n5 0 raises\n", expected: "ran 2\nfailures 0\nerrors 0\nok True\n", hidden: true },
            { stdin: "6 3 2\n6 2 raises\n1 4 0.25\n", expected: "ran 2\nfailures 1\nerrors 0\nok False\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which methods does `unittest` run as tests?",
          options: ["Every method of a `TestCase`", "Methods whose names start with `test`", "Methods decorated with `@test`", "Methods named in `__tests__`"],
          answer: 1,
          explanation: "A method named `check_total` is silently never run.",
        },
        {
          prompt: "Why prefer `assertEqual(a, b)` over `assertTrue(a == b)`?",
          options: ["It is faster", "Its failure message shows both values and a diff", "It handles floats", "It is the only one that works"],
          answer: 1,
          explanation: "`assertTrue` can only say \"False is not true\".",
        },
        {
          prompt: "When does `setUp` run?",
          options: ["Once per class", "Before every test method", "Once per module", "Only if called"],
          answer: 1,
          explanation: "Every test starts from fresh state; `setUpClass` is the once-per-class hook.",
        },
        {
          prompt: "What is the effect of `subTest` on a failing table?",
          options: ["The loop stops at the first failure", "Every row is checked and each failure is reported with its parameters", "Failures are ignored", "Each row counts in `testsRun`"],
          answer: 1,
          explanation: "The method is one test in `testsRun`; each failing subtest is its own entry in `failures`.",
        },
        {
          prompt: "Why run a suite with `TextTestRunner(stream=io.StringIO())` in a program?",
          options: ["It is faster", "To keep the runner's report (with its timing) off stdout and read the `TestResult` instead", "To skip failing tests", "It is required"],
          answer: 1,
          explanation: "`unittest.main()` also calls `sys.exit`, which a program that continues does not want.",
        },
      ],
    },
    {
      slug: "pytest-in-outline",
      file: "03-pytest-in-outline.md",
      exercises: [
        {
          title: "parametrize in plain Python",
          prompt: `Read rows \`a b expected\` until EOF. Write a decorator \`cases(*rows)\` that stores the rows on the function as \`fn.cases\`, and a runner \`run(*tests)\` that, for each test function and each of its rows in order, calls \`fn(*row)\`; on success it prints \`<name>[<i>] PASS\`, on \`AssertionError\` it prints \`<name>[<i>] FAIL <message>\`. Define \`add(a, b)\`, then \`test_add(a, b, expected)\` asserting \`add(a, b) == expected\` with the message \`got <result>\`, and \`test_commutes(a, b, expected)\` asserting \`add(a, b) == add(b, a)\`; decorate both with the rows and run them. Finish with \`<p> passed, <f> failed\`.

**Input:** one row per line.
**Output:** one line per test and row, then the summary.

\`\`\`text
1 2 3
2 2 5
0 0 0
\`\`\`
prints
\`\`\`text
test_add[0] PASS
test_add[1] FAIL got 4
test_add[2] PASS
test_commutes[0] PASS
test_commutes[1] PASS
test_commutes[2] PASS
5 passed, 1 failed
\`\`\``,
          starter: String.raw`import sys

ROWS = [tuple(int(x) for x in line.split()) for line in sys.stdin if len(line.split()) == 3]


def cases(*rows):
    # TODO: decorator storing rows on the function
    def decorator(fn):
        return fn
    return decorator


def run(*tests):
    # TODO: call each test once per row, print, return (passed, failed)
    return 0, 0


def add(a, b):
    return a + b


@cases(*ROWS)
def test_add(a, b, expected):
    result = add(a, b)
    assert result == expected, f"got {result}"


@cases(*ROWS)
def test_commutes(a, b, expected):
    assert add(a, b) == add(b, a)


passed, failed = run(test_add, test_commutes)
print(f"{passed} passed, {failed} failed")
`,
          solution: String.raw`import sys

ROWS = [tuple(int(x) for x in line.split()) for line in sys.stdin if len(line.split()) == 3]


def cases(*rows):
    def decorator(fn):
        fn.cases = list(rows)
        return fn
    return decorator


def run(*tests):
    passed = failed = 0
    for fn in tests:
        for i, row in enumerate(fn.cases):
            try:
                fn(*row)
            except AssertionError as e:
                failed += 1
                print(f"{fn.__name__}[{i}] FAIL {e}")
            else:
                passed += 1
                print(f"{fn.__name__}[{i}] PASS")
    return passed, failed


def add(a, b):
    return a + b


@cases(*ROWS)
def test_add(a, b, expected):
    result = add(a, b)
    assert result == expected, f"got {result}"


@cases(*ROWS)
def test_commutes(a, b, expected):
    assert add(a, b) == add(b, a)


passed, failed = run(test_add, test_commutes)
print(f"{passed} passed, {failed} failed")
`,
          hints: [
            "The decorator returns the same function with an attribute attached — nothing is wrapped.",
            "`try / except AssertionError / else` separates the failing and passing paths; `str(e)` is the assertion message.",
          ],
          cases: [
            { stdin: "1 2 3\n2 2 5\n0 0 0\n", expected: "test_add[0] PASS\ntest_add[1] FAIL got 4\ntest_add[2] PASS\ntest_commutes[0] PASS\ntest_commutes[1] PASS\ntest_commutes[2] PASS\n5 passed, 1 failed\n" },
            { stdin: "5 5 10\n", expected: "test_add[0] PASS\ntest_commutes[0] PASS\n2 passed, 0 failed\n", hidden: true },
            { stdin: "-1 1 1\n3 4 7\n", expected: "test_add[0] FAIL got 0\ntest_add[1] PASS\ntest_commutes[0] PASS\ntest_commutes[1] PASS\n3 passed, 1 failed\n", hidden: true },
          ],
        },
        {
          title: "A yield fixture",
          prompt: `Write a generator fixture \`connection()\` that prints \`setup\`, yields the dict \`{"open": True}\`, then sets \`"open"\` to \`False\` and prints \`teardown\`. Write \`run_with(fixture, test)\` that drives the generator with \`next\`, calls \`test(value)\`, prints \`<test name> PASS\` or \`<test name> FAIL <message>\` on \`AssertionError\`, and always runs the teardown in a \`finally\`. Read lines \`ok\` or \`fail\` until EOF and build one test per line named \`test_<i>\` (use a factory so each has its own name via \`__name__\`) that asserts \`conn["open"]\` and, for \`fail\`, then \`assert False, "forced failure"\`. Run them in order and finish with \`<p> passed, <f> failed\`.

**Input:** one marker per line.
**Output:** setup/result/teardown per test, then the summary.

\`\`\`text
ok
fail
\`\`\`
prints
\`\`\`text
setup
test_0 PASS
teardown
setup
test_1 FAIL forced failure
teardown
1 passed, 1 failed
\`\`\``,
          starter: String.raw`import sys


def connection():
    # TODO: print setup, yield {"open": True}, then close and print teardown
    yield {}


def run_with(fixture, test):
    """Return True when the test passed."""
    # TODO
    return False


def make_test(i, should_fail):
    def test(conn):
        assert conn["open"]
        if should_fail:
            assert False, "forced failure"
    test.__name__ = f"test_{i}"
    return test


markers = [line.strip() for line in sys.stdin if line.strip()]
tests = [make_test(i, marker == "fail") for i, marker in enumerate(markers)]
results = [run_with(connection, test) for test in tests]
print(f"{sum(results)} passed, {len(results) - sum(results)} failed")
`,
          solution: String.raw`import sys


def connection():
    print("setup")
    conn = {"open": True}
    yield conn
    conn["open"] = False
    print("teardown")


def run_with(fixture, test):
    """Return True when the test passed."""
    gen = fixture()
    value = next(gen)
    try:
        test(value)
    except AssertionError as e:
        print(f"{test.__name__} FAIL {e}")
        return False
    else:
        print(f"{test.__name__} PASS")
        return True
    finally:
        next(gen, None)


def make_test(i, should_fail):
    def test(conn):
        assert conn["open"]
        if should_fail:
            assert False, "forced failure"
    test.__name__ = f"test_{i}"
    return test


markers = [line.strip() for line in sys.stdin if line.strip()]
tests = [make_test(i, marker == "fail") for i, marker in enumerate(markers)]
results = [run_with(connection, test) for test in tests]
print(f"{sum(results)} passed, {len(results) - sum(results)} failed")
`,
          hints: [
            "`next(gen)` runs the fixture up to its `yield` and hands you the value; the second `next` resumes it for the teardown.",
            "`finally` runs after the `return` in both branches, so the teardown line comes after the PASS/FAIL line whatever happened.",
          ],
          cases: [
            { stdin: "ok\nfail\n", expected: "setup\ntest_0 PASS\nteardown\nsetup\ntest_1 FAIL forced failure\nteardown\n1 passed, 1 failed\n" },
            { stdin: "ok\nok\nok\n", expected: "setup\ntest_0 PASS\nteardown\nsetup\ntest_1 PASS\nteardown\nsetup\ntest_2 PASS\nteardown\n3 passed, 0 failed\n", hidden: true },
            { stdin: "fail\n", expected: "setup\ntest_0 FAIL forced failure\nteardown\n0 passed, 1 failed\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "How does pytest show useful failure messages from a plain `assert`?",
          options: ["It cannot", "It rewrites the assertion at import time to report each sub-expression's value", "It requires `assertEqual`", "It uses `repr` of the function"],
          answer: 1,
          explanation: "Assertion rewriting is why pytest needs no assertion family.",
        },
        {
          prompt: "How does a test receive a fixture?",
          options: ["By importing it", "By naming it as a parameter", "By calling it", "Through `self`"],
          answer: 1,
          explanation: "Injection by name; fixtures can depend on other fixtures the same way.",
        },
        {
          prompt: "Which fixture form runs teardown?",
          options: ["One that `return`s", "One that `yield`s — the code after the `yield` runs after the test", "Any fixture", "One with `scope=\"session\"`"],
          answer: 1,
          explanation: "The runner resumes the generator after the test, whether it passed or failed.",
        },
        {
          prompt: "What does `@pytest.mark.parametrize(\"a, b\", [(1, 2), (3, 4)])` produce?",
          options: ["One test run twice inside a loop", "Two independent tests, each reported and failing on its own", "A skipped test", "A fixture"],
          answer: 1,
          explanation: "That is `subTest` with proper per-case identity.",
        },
        {
          prompt: "Which flag reruns only the tests that failed last time?",
          options: ["`-x`", "`--lf`", "`-k`", "`-s`"],
          answer: 1,
          explanation: "`-x` stops at the first failure; `-k` selects by name; `-s` shows prints.",
        },
      ],
    },
    {
      slug: "mocking-and-test-doubles",
      file: "04-mocking-and-test-doubles.md",
      exercises: [
        {
          title: "Spy on the notifier",
          prompt: `Write \`OrderService\` taking a \`sender\` in \`__init__\`; its \`place(order_id, amount)\` calls \`sender.notify(order_id, amount)\` when \`amount\` is at least 100 and returns \`amount\`. Create the service with a \`unittest.mock.Mock()\` as the sender, read lines \`<id> <amount>\` (integers) until EOF and place each order. Then print \`notified <sender.notify.call_count>\`, one line \`call <id> <amount>\` per entry of \`call_args_list\` (use \`.args\`), and \`total <sum of the amounts returned>\`.

**Input:** one order per line.
**Output:** the count, the recorded calls, the total.

\`\`\`text
1 50
2 150
3 100
\`\`\`
prints
\`\`\`text
notified 2
call 2 150
call 3 100
total 300
\`\`\``,
          starter: String.raw`import sys
from unittest.mock import Mock


class OrderService:
    def __init__(self, sender):
        self.sender = sender

    def place(self, order_id, amount):
        # TODO: notify at 100 or more, return amount
        return amount


sender = Mock()
service = OrderService(sender)
total = 0
for line in sys.stdin:
    parts = line.split()
    if len(parts) != 2:
        continue
    total += service.place(int(parts[0]), int(parts[1]))

# TODO: print notified, the calls, the total
`,
          solution: String.raw`import sys
from unittest.mock import Mock


class OrderService:
    def __init__(self, sender):
        self.sender = sender

    def place(self, order_id, amount):
        if amount >= 100:
            self.sender.notify(order_id, amount)
        return amount


sender = Mock()
service = OrderService(sender)
total = 0
for line in sys.stdin:
    parts = line.split()
    if len(parts) != 2:
        continue
    total += service.place(int(parts[0]), int(parts[1]))

print("notified", sender.notify.call_count)
for recorded in sender.notify.call_args_list:
    order_id, amount = recorded.args
    print(f"call {order_id} {amount}")
print("total", total)
`,
          hints: [
            "`sender.notify` is created on first access and records every call; `call_args_list` is the full record in order.",
            "Each recorded call has `.args` (a tuple) and `.kwargs`; unpack the tuple to print it.",
          ],
          cases: [
            { stdin: "1 50\n2 150\n3 100\n", expected: "notified 2\ncall 2 150\ncall 3 100\ntotal 300\n" },
            { stdin: "9 10\n", expected: "notified 0\ntotal 10\n", hidden: true },
            { stdin: "4 100\n5 99\n6 1000\n", expected: "notified 2\ncall 4 100\ncall 6 1000\ntotal 1199\n", hidden: true },
          ],
        },
        {
          title: "Script the network with side_effect",
          prompt: `The starter's \`fetch_price(symbol)\` raises \`RuntimeError("network")\` — the real thing must never run in a test. Write \`average_price(symbol, n)\` that calls \`fetch_price(symbol)\` \`n\` times and returns the mean. Read a symbol on the first line and prices on the second; inside \`with patch("__main__.fetch_price", side_effect=prices) as mock:\` compute the average of \`len(prices)\` fetches and print \`average <x.2f>\`, \`calls <mock.call_count>\` and \`called with <mock.call_args.args[0]>\`. After the block, call the real \`fetch_price\` inside \`try\` and print \`real restored\` when it raises \`RuntimeError\`.

**Input:** the symbol, then the prices.
**Output:** four lines.

\`\`\`text
acme
10 20 30
\`\`\`
prints
\`\`\`text
average 20.00
calls 3
called with acme
real restored
\`\`\``,
          starter: String.raw`from unittest.mock import patch


def fetch_price(symbol):
    raise RuntimeError("network")


def average_price(symbol, n):
    # TODO: n calls to fetch_price, mean
    return 0.0


symbol = input().strip()
prices = [float(x) for x in input().split()]

# TODO: patch __main__.fetch_price with side_effect=prices, print the four lines
`,
          solution: String.raw`from unittest.mock import patch


def fetch_price(symbol):
    raise RuntimeError("network")


def average_price(symbol, n):
    total = sum(fetch_price(symbol) for _ in range(n))
    return total / n


symbol = input().strip()
prices = [float(x) for x in input().split()]

with patch("__main__.fetch_price", side_effect=prices) as mock:
    average = average_price(symbol, len(prices))
    print(f"average {average:.2f}")
    print("calls", mock.call_count)
    print("called with", mock.call_args.args[0])

try:
    fetch_price(symbol)
except RuntimeError:
    print("real restored")
`,
          hints: [
            "`side_effect` given a list returns the items one per call, so the mock plays back the scripted prices in order.",
            "`average_price` looks `fetch_price` up in `__main__` at call time, which is why patching that name works.",
          ],
          cases: [
            { stdin: "acme\n10 20 30\n", expected: "average 20.00\ncalls 3\ncalled with acme\nreal restored\n" },
            { stdin: "x\n5\n", expected: "average 5.00\ncalls 1\ncalled with x\nreal restored\n", hidden: true },
            { stdin: "zz\n1 2\n", expected: "average 1.50\ncalls 2\ncalled with zz\nreal restored\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `Mock().anything(1, 2)` do?",
          options: ["Raises `AttributeError`", "Creates the attribute, accepts the call, records it, and returns another `Mock`", "Returns `None`", "Calls the real method"],
          answer: 1,
          explanation: "A bare `Mock` accepts everything — which is why `spec` exists.",
        },
        {
          prompt: "What does `Mock(side_effect=[ValueError(), 3])` do across two calls?",
          options: ["Returns the list", "Raises `ValueError` on the first call, returns 3 on the second", "Returns 3 twice", "Raises twice"],
          answer: 1,
          explanation: "A list is played back one item per call; exception instances are raised.",
        },
        {
          prompt: "`billing.py` does `from rates import fetch_rate`. Which target patches what `billing` calls?",
          options: ["`rates.fetch_rate`", "`billing.fetch_rate`", "Either", "`__main__.fetch_rate`"],
          answer: 1,
          explanation: "Patch where the name is looked up — the module under test — not where it is defined.",
        },
        {
          prompt: "What does `autospec=True` add to `patch`?",
          options: ["Speed", "The mock has only the real attributes and enforces the real call signatures", "Automatic return values", "Nothing"],
          answer: 1,
          explanation: "A typo or a wrong argument count fails instead of being accepted silently.",
        },
        {
          prompt: "When is a fake better than a mock?",
          options: ["Never", "When the collaborator has state and the outcome, not the interaction, is what the test should check", "For the network", "For the clock"],
          answer: 1,
          explanation: "An in-memory repository survives refactors; a mock of every method asserts the implementation.",
        },
      ],
    },
    {
      slug: "debugging",
      file: "05-debugging.md",
      exercises: [
        {
          title: "A logging pipeline",
          prompt: `Read a threshold level name on the first line (\`DEBUG\`, \`INFO\`, \`WARNING\`, \`ERROR\` or \`CRITICAL\`), then lines \`<LEVEL> <message>\` until EOF. Configure a logger named \`app\` (with \`propagate = False\`) that has a \`StreamHandler\` on \`sys.stdout\` using the format \`%(levelname)s %(name)s: %(message)s\`, set to the threshold; attach a \`logging.Filter\` subclass that counts the records that reach the handler. Emit each line with \`logger.log(level, message)\`, then print \`emitted <count> of <total>\`.

**Input:** the threshold, then records.
**Output:** the records at or above the threshold, then the count.

\`\`\`text
WARNING
INFO starting
WARNING disk at 91%
ERROR write failed
DEBUG payload {}
\`\`\`
prints
\`\`\`text
WARNING app: disk at 91%
ERROR app: write failed
emitted 2 of 4
\`\`\``,
          starter: String.raw`import logging
import sys


class Counting(logging.Filter):
    def __init__(self):
        super().__init__()
        self.count = 0

    def filter(self, record):
        # TODO: count and let the record through
        return True


threshold = sys.stdin.readline().strip()
logger = logging.getLogger("app")
logger.propagate = False
# TODO: level, handler with the format, the filter

total = 0
for line in sys.stdin:
    level, _, message = line.rstrip().partition(" ")
    if not level:
        continue
    total += 1
    # TODO: logger.log

# TODO: emitted line
`,
          solution: String.raw`import logging
import sys


class Counting(logging.Filter):
    def __init__(self):
        super().__init__()
        self.count = 0

    def filter(self, record):
        self.count += 1
        return True


threshold = sys.stdin.readline().strip()
logger = logging.getLogger("app")
logger.propagate = False
logger.setLevel(getattr(logging, threshold))
handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(logging.Formatter("%(levelname)s %(name)s: %(message)s"))
counting = Counting()
handler.addFilter(counting)
logger.addHandler(handler)

total = 0
for line in sys.stdin:
    level, _, message = line.rstrip().partition(" ")
    if not level:
        continue
    total += 1
    logger.log(getattr(logging, level), message)

print(f"emitted {counting.count} of {total}")
`,
          hints: [
            "`getattr(logging, \"WARNING\")` is the integer level; `logger.setLevel` drops records below it before any handler sees them.",
            "A filter on the handler sees exactly the records that will be written, so counting there matches the lines printed.",
          ],
          cases: [
            { stdin: "WARNING\nINFO starting\nWARNING disk at 91%\nERROR write failed\nDEBUG payload {}\n", expected: "WARNING app: disk at 91%\nERROR app: write failed\nemitted 2 of 4\n" },
            { stdin: "DEBUG\nDEBUG x\nINFO y\n", expected: "DEBUG app: x\nINFO app: y\nemitted 2 of 2\n", hidden: true },
            { stdin: "CRITICAL\nERROR e\nCRITICAL c\n", expected: "CRITICAL app: c\nemitted 1 of 2\n", hidden: true },
          ],
        },
        {
          title: "Traceback reader",
          prompt: `Read a Python traceback from standard input (possibly a chained one with two sections). Consider only the last section — the text after the final \`Traceback (most recent call last):\`. Extract its frames from lines of the form \`File "<file>", line <n>, in <func>\` and the final exception line. Print \`error <type>: <message>\` (or \`error <type>\` when there is no message), \`raised at <file>:<line> in <func>\` for the last frame, \`frames <count>\`, and \`chained <True/False>\` — true when the text contains \`During handling of the above exception\` or \`The above exception was the direct cause\`.

**Input:** a traceback.
**Output:** four lines.

\`\`\`text
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
\`\`\`
prints
\`\`\`text
error ValueError: invalid literal for int() with base 10: 'n/a'
raised at app.py:5 in parse
frames 4
chained False
\`\`\``,
          starter: String.raw`import re
import sys

FRAME = re.compile(r'^\s*File "(.+?)", line (\d+), in (.+)$')
HEADER = "Traceback (most recent call last):"
CHAIN_MARKERS = ("During handling of the above exception", "The above exception was the direct cause")

text = sys.stdin.read()
last_section = text.rsplit(HEADER, 1)[-1]
lines = [line.rstrip() for line in last_section.splitlines() if line.strip()]

# TODO: frames, the exception line, chained
`,
          solution: String.raw`import re
import sys

FRAME = re.compile(r'^\s*File "(.+?)", line (\d+), in (.+)$')
HEADER = "Traceback (most recent call last):"
CHAIN_MARKERS = ("During handling of the above exception", "The above exception was the direct cause")

text = sys.stdin.read()
last_section = text.rsplit(HEADER, 1)[-1]
lines = [line.rstrip() for line in last_section.splitlines() if line.strip()]

frames = [m.groups() for m in map(FRAME.match, lines) if m]
exc_line = lines[-1].strip()
exc_type, sep, message = exc_line.partition(": ")
chained = any(marker in text for marker in CHAIN_MARKERS)

print(f"error {exc_type}: {message}" if sep else f"error {exc_type}")
file, line_no, func = frames[-1]
print(f"raised at {file}:{line_no} in {func}")
print("frames", len(frames))
print("chained", chained)
`,
          hints: [
            "`text.rsplit(HEADER, 1)[-1]` is everything after the last header — the traceback that actually terminated the program.",
            "`partition(\": \")` splits the exception line once; a message that itself contains `: ` stays intact.",
          ],
          cases: [
            { stdin: "Traceback (most recent call last):\n  File \"app.py\", line 21, in <module>\n    main()\n  File \"app.py\", line 17, in main\n    report(load(\"data.csv\"))\n  File \"app.py\", line 9, in load\n    return [parse(line) for line in f]\n  File \"app.py\", line 5, in parse\n    return int(line.split(\",\")[1])\nValueError: invalid literal for int() with base 10: 'n/a'\n", expected: "error ValueError: invalid literal for int() with base 10: 'n/a'\nraised at app.py:5 in parse\nframes 4\nchained False\n" },
            { stdin: "Traceback (most recent call last):\n  File \"app.py\", line 12, in fetch\n    return cache[key]\nKeyError: 'user:7'\n\nDuring handling of the above exception, another exception occurred:\n\nTraceback (most recent call last):\n  File \"app.py\", line 20, in <module>\n    fetch(\"user:7\")\n  File \"app.py\", line 14, in fetch\n    return db.get(key)\nConnectionError: database unavailable\n", expected: "error ConnectionError: database unavailable\nraised at app.py:14 in fetch\nframes 2\nchained True\n", hidden: true },
            { stdin: "Traceback (most recent call last):\n  File \"run.py\", line 3, in <module>\n    loop()\nKeyboardInterrupt\n", expected: "error KeyboardInterrupt\nraised at run.py:3 in <module>\nframes 1\nchained False\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "In a traceback, where is the line that raised the exception?",
          options: ["The first frame listed", "The last frame, just above the exception line", "The `<module>` frame", "It is not shown"],
          answer: 1,
          explanation: "Frames are listed outermost first; read from the bottom.",
        },
        {
          prompt: "What does \"During handling of the above exception, another exception occurred\" mean?",
          options: ["The exception was re-raised", "A second exception was raised inside the `except` block handling the first", "The exception was suppressed", "Two threads crashed"],
          answer: 1,
          explanation: "\"The above exception was the direct cause\" is the `raise … from e` form.",
        },
        {
          prompt: "Why not validate user input with `assert`?",
          options: ["It is slow", "`python -O` removes every `assert`, so the check disappears", "It raises the wrong type", "It cannot take a message"],
          answer: 1,
          explanation: "Asserts document your own invariants; input validation raises `ValueError`.",
        },
        {
          prompt: "Which `pdb` command steps *into* a function call?",
          options: ["`n`", "`s`", "`c`", "`w`"],
          answer: 1,
          explanation: "`n` steps over, `c` continues, `w` shows the stack.",
        },
        {
          prompt: "What is the first step of the debugging method?",
          options: ["Add prints everywhere", "Reproduce the failure reliably", "Change the suspected line", "Bisect"],
          answer: 1,
          explanation: "Then minimise, hypothesise, bisect if the failure is new, fix, and add the regression test.",
        },
      ],
    },
    {
      slug: "testing-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "A suite against injected bugs",
          prompt: `The starter defines \`BankAccount\` with a bug injected by the first input line: \`none\`, \`negative\` (deposit accepts non-positive amounts), \`overdraw\` (withdraw allows going below zero) or \`interest\` (\`add_interest\` adds the rate instead of the percentage). Write \`TestBankAccount\` with exactly: \`test_deposit_increases_balance\` (100 + deposit 50 → 150), \`test_deposit_rejects_non_positive\` (\`assertRaises(ValueError)\` for \`deposit(0)\` and for \`deposit(-5)\`), \`test_withdraw_rejects_overdraw\` (balance 100, \`assertRaises(ValueError)\` for \`withdraw(150)\`) and \`test_interest\` (balance 200, \`add_interest(0.05)\`, \`assertAlmostEqual\` 210). Run on a \`StringIO\` stream and print \`ran <n>\`, \`failures <f>\`, \`errors <e>\`, \`ok <bool>\`, then \`failed <name>\` per failure, sorted.

**Input:** the bug name.
**Output:** four lines, then any failed names.

\`\`\`text
none
\`\`\`
prints
\`\`\`text
ran 4
failures 0
errors 0
ok True
\`\`\``,
          starter: String.raw`import io
import unittest

BUG = input().strip()


class BankAccount:
    def __init__(self, balance=0):
        self.balance = balance

    def deposit(self, amount):
        if amount <= 0 and BUG != "negative":
            raise ValueError("amount must be positive")
        self.balance += amount

    def withdraw(self, amount):
        if amount > self.balance and BUG != "overdraw":
            raise ValueError("insufficient funds")
        self.balance -= amount

    def add_interest(self, rate):
        if BUG == "interest":
            self.balance += rate
        else:
            self.balance += self.balance * rate


class TestBankAccount(unittest.TestCase):
    # TODO: the four tests
    pass


# TODO: run and report
`,
          solution: String.raw`import io
import unittest

BUG = input().strip()


class BankAccount:
    def __init__(self, balance=0):
        self.balance = balance

    def deposit(self, amount):
        if amount <= 0 and BUG != "negative":
            raise ValueError("amount must be positive")
        self.balance += amount

    def withdraw(self, amount):
        if amount > self.balance and BUG != "overdraw":
            raise ValueError("insufficient funds")
        self.balance -= amount

    def add_interest(self, rate):
        if BUG == "interest":
            self.balance += rate
        else:
            self.balance += self.balance * rate


class TestBankAccount(unittest.TestCase):
    def test_deposit_increases_balance(self):
        account = BankAccount(100)
        account.deposit(50)
        self.assertEqual(account.balance, 150)

    def test_deposit_rejects_non_positive(self):
        account = BankAccount(100)
        with self.assertRaises(ValueError):
            account.deposit(0)
        with self.assertRaises(ValueError):
            account.deposit(-5)

    def test_withdraw_rejects_overdraw(self):
        account = BankAccount(100)
        with self.assertRaises(ValueError):
            account.withdraw(150)

    def test_interest(self):
        account = BankAccount(200)
        account.add_interest(0.05)
        self.assertAlmostEqual(account.balance, 210)


suite = unittest.defaultTestLoader.loadTestsFromTestCase(TestBankAccount)
result = unittest.TextTestRunner(stream=io.StringIO(), verbosity=0).run(suite)
print("ran", result.testsRun)
print("failures", len(result.failures))
print("errors", len(result.errors))
print("ok", result.wasSuccessful())
for name in sorted(test.id().rsplit(".", 1)[-1] for test, _ in result.failures):
    print("failed", name)
`,
          hints: [
            "Each injected bug breaks exactly one of the four behaviours, so a correct suite reports exactly one failure for it.",
            "`assertAlmostEqual` is the float comparison; `assertRaises` as a context manager fails when nothing is raised.",
          ],
          cases: [
            { stdin: "none\n", expected: "ran 4\nfailures 0\nerrors 0\nok True\n" },
            { stdin: "negative\n", expected: "ran 4\nfailures 1\nerrors 0\nok False\nfailed test_deposit_rejects_non_positive\n", hidden: true },
            { stdin: "overdraw\n", expected: "ran 4\nfailures 1\nerrors 0\nok False\nfailed test_withdraw_rejects_overdraw\n", hidden: true },
            { stdin: "interest\n", expected: "ran 4\nfailures 1\nerrors 0\nok False\nfailed test_interest\n", hidden: true },
          ],
        },
        {
          title: "Retry against a scripted mock",
          prompt: `Write \`retry(fn, attempts)\` that calls \`fn()\` up to \`attempts\` times, returning the first result and swallowing \`ConnectionError\` between tries; when every attempt fails it raises the last error. Read \`attempts\` on the first line and a script on the second: tokens that are \`fail\` (a \`ConnectionError("down")\`) or an integer (a result). Build \`Mock(side_effect=script)\`, call \`retry\` and print \`result <value>\` or \`gave up after <attempts>\`, then \`calls <mock.call_count>\`.

**Input:** the attempt count, then the script.
**Output:** two lines.

\`\`\`text
3
fail fail 42
\`\`\`
prints
\`\`\`text
result 42
calls 3
\`\`\``,
          starter: String.raw`from unittest.mock import Mock


def retry(fn, attempts):
    # TODO
    return fn()


attempts = int(input())
script = [ConnectionError("down") if tok == "fail" else int(tok) for tok in input().split()]
fetch = Mock(side_effect=script)
# TODO: call retry, print result or gave up, then calls
`,
          solution: String.raw`from unittest.mock import Mock


def retry(fn, attempts):
    last = None
    for _ in range(attempts):
        try:
            return fn()
        except ConnectionError as e:
            last = e
    raise last


attempts = int(input())
script = [ConnectionError("down") if tok == "fail" else int(tok) for tok in input().split()]
fetch = Mock(side_effect=script)
try:
    print("result", retry(fetch, attempts))
except ConnectionError:
    print("gave up after", attempts)
print("calls", fetch.call_count)
`,
          hints: [
            "`return fn()` inside the `try` leaves the loop on the first success; the `except` records the error and continues.",
            "The mock plays the script one item per call, so `call_count` tells you how many attempts the helper really made.",
          ],
          cases: [
            { stdin: "3\nfail fail 42\n", expected: "result 42\ncalls 3\n" },
            { stdin: "2\nfail fail 42\n", expected: "gave up after 2\ncalls 2\n", hidden: true },
            { stdin: "3\n7 fail\n", expected: "result 7\ncalls 1\n", hidden: true },
          ],
        },
        {
          title: "A counting handler",
          prompt: `Subclass \`logging.Handler\` as \`Counting\`: its \`emit(record)\` counts records per \`levelname\` and keeps \`(levelname, message)\` for records at \`WARNING\` or above. Read a threshold level on the first line, then lines \`<LEVEL> <message>\` until EOF; attach the handler to a logger named \`app\` (\`propagate = False\`) set to \`DEBUG\` so every record reaches it, and emit each line with \`logger.log\`. Print \`counts DEBUG=<n> INFO=<n> WARNING=<n> ERROR=<n> CRITICAL=<n>\`, then \`at <threshold>: <k> shown\` where \`k\` counts records whose level is at least the threshold, then one line \`<LEVEL>: <message>\` per kept record in order.

**Input:** the threshold, then records.
**Output:** the counts, the threshold line, the kept records.

\`\`\`text
INFO
DEBUG a
INFO b
WARNING c
ERROR d
\`\`\`
prints
\`\`\`text
counts DEBUG=1 INFO=1 WARNING=1 ERROR=1 CRITICAL=0
at INFO: 3 shown
WARNING: c
ERROR: d
\`\`\``,
          starter: String.raw`import logging
import sys

LEVELS = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]


class Counting(logging.Handler):
    def __init__(self):
        super().__init__()
        self.counts = {name: 0 for name in LEVELS}
        self.kept = []

    def emit(self, record):
        # TODO
        pass


threshold = sys.stdin.readline().strip()
logger = logging.getLogger("app")
logger.propagate = False
logger.setLevel(logging.DEBUG)
handler = Counting()
logger.addHandler(handler)

for line in sys.stdin:
    level, _, message = line.rstrip().partition(" ")
    if level:
        logger.log(getattr(logging, level), message)

# TODO: the three kinds of output line
`,
          solution: String.raw`import logging
import sys

LEVELS = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]


class Counting(logging.Handler):
    def __init__(self):
        super().__init__()
        self.counts = {name: 0 for name in LEVELS}
        self.kept = []

    def emit(self, record):
        self.counts[record.levelname] += 1
        if record.levelno >= logging.WARNING:
            self.kept.append((record.levelname, record.getMessage()))


threshold = sys.stdin.readline().strip()
logger = logging.getLogger("app")
logger.propagate = False
logger.setLevel(logging.DEBUG)
handler = Counting()
logger.addHandler(handler)

for line in sys.stdin:
    level, _, message = line.rstrip().partition(" ")
    if level:
        logger.log(getattr(logging, level), message)

print("counts " + " ".join(f"{name}={handler.counts[name]}" for name in LEVELS))
shown = sum(handler.counts[name] for name in LEVELS if getattr(logging, name) >= getattr(logging, threshold))
print(f"at {threshold}: {shown} shown")
for name, message in handler.kept:
    print(f"{name}: {message}")
`,
          hints: [
            "`record.levelname` is the string, `record.levelno` the integer, `record.getMessage()` the formatted text.",
            "Compare levels as integers with `getattr(logging, name)`; the names in `LEVELS` are already in ascending order.",
          ],
          cases: [
            { stdin: "INFO\nDEBUG a\nINFO b\nWARNING c\nERROR d\n", expected: "counts DEBUG=1 INFO=1 WARNING=1 ERROR=1 CRITICAL=0\nat INFO: 3 shown\nWARNING: c\nERROR: d\n" },
            { stdin: "ERROR\nINFO x\n", expected: "counts DEBUG=0 INFO=1 WARNING=0 ERROR=0 CRITICAL=0\nat ERROR: 0 shown\n", hidden: true },
            { stdin: "DEBUG\nCRITICAL boom\nDEBUG t\n", expected: "counts DEBUG=1 INFO=0 WARNING=0 ERROR=0 CRITICAL=1\nat DEBUG: 2 shown\nCRITICAL: boom\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which test belongs at the bottom of the pyramid, in the greatest number?",
          options: ["End-to-end", "Integration", "Unit", "Manual"],
          answer: 2,
          explanation: "Unit tests are fastest and point at the failing line.",
        },
        {
          prompt: "Why one behaviour per test?",
          options: ["Style", "A failure's name is a diagnosis, and one failing assertion does not hide the others", "Speed", "unittest requires it"],
          answer: 1,
          explanation: "A test checking five unrelated things stops at the first failure.",
        },
        {
          prompt: "Which assertion is right for `0.1 + 0.2` against `0.3`?",
          options: ["`assertEqual`", "`assertAlmostEqual`", "`assertTrue`", "`assertIs`"],
          answer: 1,
          explanation: "Floats compare by rounded difference.",
        },
        {
          prompt: "`assertRaises(IndexError)` as a context manager and the block returns normally. Result?",
          options: ["Pass", "The test fails — nothing was raised", "Error", "Skipped"],
          answer: 1,
          explanation: "That is how a suite catches a function that stopped raising.",
        },
        {
          prompt: "A `subTest` loop has five rows and two fail. How many entries in `result.failures` and how much in `testsRun`?",
          options: ["2 and 5", "2 and 1", "1 and 1", "5 and 5"],
          answer: 1,
          explanation: "The method is one test; each failing subtest is reported separately.",
        },
        {
          prompt: "What does a pytest `yield` fixture guarantee that a `return` fixture does not?",
          options: ["A value", "Teardown after the test, even on failure", "Speed", "Isolation"],
          answer: 1,
          explanation: "The runner resumes the generator after the test; a returned value has no after.",
        },
        {
          prompt: "What is `@pytest.mark.parametrize` mechanically?",
          options: ["A loop inside the test", "Rows attached to the function, each run and reported as its own test", "A fixture", "A marker with no effect"],
          answer: 1,
          explanation: "Small enough to rebuild in plain Python when pytest is absent.",
        },
        {
          prompt: "What does `mock.assert_called_once_with(1, 2)` check?",
          options: ["That the mock exists", "Exactly one call, with arguments `(1, 2)`", "At least one call", "That the return value is `(1, 2)`"],
          answer: 1,
          explanation: "`assert_called_with` checks only the last call; `assert_any_call` any call.",
        },
        {
          prompt: "A patch has no effect on the code under test. The most likely cause?",
          options: ["Mocks are disabled", "The target names where the function is defined, not where the module under test looks it up", "The test is async", "`spec` was used"],
          answer: 1,
          explanation: "Patch the name in the module under test.",
        },
        {
          prompt: "Which is a fake rather than a mock?",
          options: ["`Mock(return_value=3)`", "An in-memory dict-backed class with the repository's methods", "`patch(\"x.y\")`", "`assert_called`"],
          answer: 1,
          explanation: "A fake works; a mock records and asserts interactions.",
        },
        {
          prompt: "Which log level threshold shows WARNING and ERROR but not INFO?",
          options: ["`DEBUG`", "`INFO`", "`WARNING`", "`CRITICAL`"],
          answer: 2,
          explanation: "A record passes when its level is at least the threshold.",
        },
        {
          prompt: "After a crash, what does `pdb.pm()` give you?",
          options: ["A fresh run under the debugger", "The frames of the exception that just happened, with their local variables", "A log file", "A profile"],
          answer: 1,
          explanation: "Post-mortem inspection at the point of failure — faster than adding breakpoints.",
        },
      ],
    },
  ],
});
