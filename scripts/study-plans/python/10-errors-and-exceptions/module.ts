import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "errors-and-exceptions",
  title: "Errors and exceptions",
  blurb: "The try statement with else and finally, the hierarchy and matching, raise and chaining, custom exception classes, EAFP with suppress and sentinels, context managers as classes and generators, exception groups with except* and add_note, and assertions versus boundary validation.",
  icon: "alert",
  overview: `Python signals every failure by raising — a missing key, the end of an iterator, a file that is not there — so exception handling is not an edge-case skill but the ordinary texture of the language. This module makes it precise: what the four clauses of \`try\` do, how a handler matches, what \`raise\` and \`from\` mean, how to design exception classes that callers can act on, and the EAFP style that the standard library assumes. It then covers the two structures that grew out of exceptions — context managers, which guarantee cleanup, and exception groups, which report several failures at once — and closes with the rule that separates assertions from validation.

Exceptions covers the statement, the hierarchy, \`raise\`, re-raising and chaining, and the difference between catching and hiding. Custom exceptions covers subclassing, data attributes, a base per package and when a built-in is the honest choice. EAFP covers the cost model, the library's defaulted forms, \`contextlib.suppress\`, return-versus-raise, sentinels and retries. Context managers covers \`with\`, \`__enter__\`/\`__exit__\`, \`@contextmanager\`, and the \`contextlib\` helpers including \`ExitStack\`. Exception groups covers \`ExceptionGroup\`, \`except*\`, \`add_note\`, the \`traceback\` module and warnings. Assertions covers \`assert\` under \`-O\`, boundary validation and fail-fast design.

The exercises are whole programs: a clause tracer, chained division errors, an application error hierarchy, an exception carrying data, a first-or-default with a sentinel, a capped retry loop, a commit-or-rollback transaction manager, a generator manager that always runs its teardown, a validator that collects failures into a group, traceback text from evaluated expressions, boundary validation of a configuration, and a stack machine with asserted invariants. The checkpoint adds a record loader reporting every failure through \`except*\`, nested savepoints, and a calculator caught at exactly the right level of its hierarchy.`,
  lessons: [
    {
      slug: "exceptions-basics",
      file: "01-exceptions-basics.md",
      exercises: [
        {
          title: "Trace the clauses",
          prompt: `For each command, run an operation inside one \`try\` statement that has an \`except ValueError\`, an \`except KeyError\`, an \`else\` and a \`finally\`, and print the names of the parts that actually ran, in order, on one line. \`ok\` runs an operation that succeeds; \`value\` runs \`int("x")\`; \`key\` runs \`{}["k"]\`; \`zero\` runs \`1 / 0\` — which no handler matches, so record \`finally\` and then let it propagate to an outer handler that prints \`propagated ZeroDivisionError\`.

**Input:** commands.
**Output:** one line per command (two for \`zero\`).

\`\`\`text
ok
value
zero
\`\`\`
prints
\`\`\`text
try else finally
try except:ValueError finally
try finally
propagated ZeroDivisionError
\`\`\``,
          starter: String.raw`import sys

OPS = {
    "ok": lambda: 1,
    "value": lambda: int("x"),
    "key": lambda: {}["k"],
    "zero": lambda: 1 / 0,
}


def run(op):
    parts = ["try"]
    # TODO: try / except ValueError / except KeyError / else / finally, appending part names;
    #       print the joined parts in the finally clause
    return parts


for line in sys.stdin:
    try:
        run(OPS[line.strip()])
    except ZeroDivisionError as e:
        print(f"propagated {type(e).__name__}")
`,
          solution: String.raw`import sys

OPS = {
    "ok": lambda: 1,
    "value": lambda: int("x"),
    "key": lambda: {}["k"],
    "zero": lambda: 1 / 0,
}


def run(op):
    parts = ["try"]
    try:
        op()
    except ValueError:
        parts.append("except:ValueError")
    except KeyError:
        parts.append("except:KeyError")
    else:
        parts.append("else")
    finally:
        parts.append("finally")
        print(" ".join(parts))
    return parts


for line in sys.stdin:
    try:
        run(OPS[line.strip()])
    except ZeroDivisionError as e:
        print(f"propagated {type(e).__name__}")
`,
          hints: [
            "`else` runs only when the `try` block raised nothing; `finally` runs in every case, including when the exception matches no handler.",
            "Printing inside `finally` guarantees the trace appears before the exception propagates.",
          ],
          cases: [
            { stdin: "ok\nvalue\nzero\n", expected: "try else finally\ntry except:ValueError finally\ntry finally\npropagated ZeroDivisionError\n" },
            { stdin: "key\nok\n", expected: "try except:KeyError finally\ntry else finally\n", hidden: true },
            { stdin: "zero\nzero\n", expected: "try finally\npropagated ZeroDivisionError\ntry finally\npropagated ZeroDivisionError\n", hidden: true },
          ],
        },
        {
          title: "Chained causes",
          prompt: `Write \`ratio(a, b)\` that returns \`a / b\` but, on \`ZeroDivisionError\`, raises \`ValueError("cannot divide by zero")\` **from** the original exception. For each input line \`a b\`, print the result with two decimals, or — catching the \`ValueError\` — print its message and the type name of its \`__cause__\`. A non-numeric token should propagate as a plain \`ValueError\` with no cause: print \`bad input\` for that (its \`__cause__\` is \`None\`).

**Input:** lines \`a b\`.
**Output:** \`<ratio>\`, or \`error: <message> (caused by ZeroDivisionError)\`, or \`bad input\`.

\`\`\`text
1 4
1 0
x 2
\`\`\`
prints
\`\`\`text
0.25
error: cannot divide by zero (caused by ZeroDivisionError)
bad input
\`\`\``,
          starter: String.raw`import sys


def ratio(a, b):
    # TODO: raise ValueError(...) from the ZeroDivisionError
    return a / b


for line in sys.stdin:
    try:
        a, b = map(float, line.split())
        print(f"{ratio(a, b):.2f}")
    except ValueError as e:
        # TODO: distinguish a chained error from a plain one via e.__cause__
        pass
`,
          solution: String.raw`import sys


def ratio(a, b):
    try:
        return a / b
    except ZeroDivisionError as e:
        raise ValueError("cannot divide by zero") from e


for line in sys.stdin:
    try:
        a, b = map(float, line.split())
        print(f"{ratio(a, b):.2f}")
    except ValueError as e:
        if e.__cause__ is not None:
            print(f"error: {e} (caused by {type(e.__cause__).__name__})")
        else:
            print("bad input")
`,
          hints: [
            "`raise X from e` stores `e` in `X.__cause__`; a plain `ValueError` from `float(\"x\")` has no cause.",
            "`type(e.__cause__).__name__` gives the original exception's class name.",
          ],
          cases: [
            { stdin: "1 4\n1 0\nx 2\n", expected: "0.25\nerror: cannot divide by zero (caused by ZeroDivisionError)\nbad input\n" },
            { stdin: "-3 2\n0 0\n", expected: "-1.50\nerror: cannot divide by zero (caused by ZeroDivisionError)\n", hidden: true },
            { stdin: "5\n", expected: "bad input\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "When does the `else` clause of a `try` statement run?",
          options: ["Always", "Only when the `try` block raised no exception", "Only after an `except` handler ran", "When `finally` is absent"],
          answer: 1,
          explanation: "`else` is the success branch; it keeps code that should not be covered by the handlers out of the `try` block.",
        },
        {
          prompt: "What is wrong with this order?\n\n```python\ntry:\n    ...\nexcept Exception:\n    ...\nexcept ValueError:\n    ...\n```",
          options: ["Nothing", "The `ValueError` handler is unreachable — `Exception` matches it first", "It is a syntax error", "`ValueError` is not an `Exception`"],
          answer: 1,
          explanation: "Handlers match subclasses and are tried in order; put specific classes before general ones.",
        },
        {
          prompt: "What does a bare `except:` catch that `except Exception:` does not?",
          options: ["Nothing", "`KeyboardInterrupt` and `SystemExit`, which is why it makes programs unstoppable", "Only `ValueError`", "Warnings"],
          answer: 1,
          explanation: "Those derive from `BaseException` directly; catching them by accident swallows Ctrl-C and `sys.exit`.",
        },
        {
          prompt: "Inside an `except` block, what is the difference between `raise` and `raise e`?",
          options: ["None", "`raise` re-raises with the original traceback; `raise e` restarts the traceback at the handler", "`raise e` is a syntax error", "`raise` creates a new exception"],
          answer: 1,
          explanation: "Bare `raise` preserves where the exception was originally raised, which is what you want in a log.",
        },
        {
          prompt: "What does `raise ConfigError(\"bad\") from None` do?",
          options: ["Raises with no message", "Raises `ConfigError` and suppresses the automatic 'during handling…' chain", "Raises `None`", "Re-raises the original exception"],
          answer: 1,
          explanation: "`from None` sets `__suppress_context__`, hiding the exception being handled when it is only noise.",
        },
      ],
    },
    {
      slug: "custom-exceptions",
      file: "02-custom-exceptions.md",
      exercises: [
        {
          title: "An application hierarchy",
          prompt: `Define \`AppError(Exception)\`, \`ValidationError(AppError)\` with a \`field\` attribute and a message \`<field>: <problem>\`, and \`NotFound(AppError)\`. \`lookup(text)\` raises \`ValidationError("id", "must be a positive integer")\` when the text is not a positive integer, \`NotFound(f"user {n} not found")\` when the integer exceeds 100, and otherwise returns \`f"user {n}"\`. Handle each line with three handlers — \`ValidationError\` (print \`invalid <field>: <message>\`), \`NotFound\` (print \`missing: <message>\`), then \`AppError\` as a fallback that never fires here — and print the result otherwise.

**Input:** lines.
**Output:** one line per input line.

\`\`\`text
7
abc
500
\`\`\`
prints
\`\`\`text
user 7
invalid id: id: must be a positive integer
missing: user 500 not found
\`\`\``,
          starter: String.raw`import sys


# TODO: AppError, ValidationError(field, problem), NotFound


def lookup(text):
    # TODO
    return ""


for line in sys.stdin:
    try:
        print(lookup(line.strip()))
    # TODO: handlers, specific first
    except Exception as e:
        print(e)
`,
          solution: String.raw`import sys


class AppError(Exception):
    pass


class ValidationError(AppError):
    def __init__(self, field, problem):
        super().__init__(f"{field}: {problem}")
        self.field = field


class NotFound(AppError):
    pass


def lookup(text):
    if not text.isdigit() or int(text) <= 0:
        raise ValidationError("id", "must be a positive integer")
    n = int(text)
    if n > 100:
        raise NotFound(f"user {n} not found")
    return f"user {n}"


for line in sys.stdin:
    try:
        print(lookup(line.strip()))
    except ValidationError as e:
        print(f"invalid {e.field}: {e}")
    except NotFound as e:
        print(f"missing: {e}")
    except AppError as e:
        print(f"app error: {e}")
`,
          hints: [
            "`super().__init__(message)` sets what `str(e)` returns; then store `field` as an attribute.",
            "Order the handlers from the most specific subclass to the base.",
          ],
          cases: [
            { stdin: "7\nabc\n500\n", expected: "user 7\ninvalid id: id: must be a positive integer\nmissing: user 500 not found\n" },
            { stdin: "0\n100\n101\n", expected: "invalid id: id: must be a positive integer\nuser 100\nmissing: user 101 not found\n", hidden: true },
            { stdin: "-5\n", expected: "invalid id: id: must be a positive integer\n", hidden: true },
          ],
        },
        {
          title: "An exception that carries data",
          prompt: `Define \`InsufficientFunds(Exception)\` taking \`balance\` and \`requested\`, storing both, passing the message \`balance <b>, requested <r>\` to \`super().__init__\`, and exposing a \`shortfall\` property. Process \`withdraw amount\` commands against a balance read from the first line; a successful withdrawal prints the new balance, a failed one is caught and prints \`declined: <message>; short by <shortfall>\` — read from the exception's attributes, not by parsing the message.

**Input:** the starting balance, then \`withdraw n\` lines.
**Output:** one line per command.

\`\`\`text
100
withdraw 30
withdraw 100
\`\`\`
prints
\`\`\`text
70
declined: balance 70, requested 100; short by 30
\`\`\``,
          starter: String.raw`import sys


class InsufficientFunds(Exception):
    # TODO
    pass


balance = int(input())
for line in sys.stdin:
    _, amount = line.split()
    amount = int(amount)
    # TODO: withdraw or catch
`,
          solution: String.raw`import sys


class InsufficientFunds(Exception):
    def __init__(self, balance, requested):
        super().__init__(f"balance {balance}, requested {requested}")
        self.balance = balance
        self.requested = requested

    @property
    def shortfall(self):
        return self.requested - self.balance


def withdraw(balance, amount):
    if amount > balance:
        raise InsufficientFunds(balance, amount)
    return balance - amount


balance = int(input())
for line in sys.stdin:
    _, amount = line.split()
    amount = int(amount)
    try:
        balance = withdraw(balance, amount)
        print(balance)
    except InsufficientFunds as e:
        print(f"declined: {e}; short by {e.shortfall}")
`,
          hints: [
            "The handler uses `e.shortfall` — data on the exception object — and `str(e)` for the message.",
            "A failed withdrawal must leave the balance unchanged.",
          ],
          cases: [
            { stdin: "100\nwithdraw 30\nwithdraw 100\n", expected: "70\ndeclined: balance 70, requested 100; short by 30\n" },
            { stdin: "0\nwithdraw 1\nwithdraw 0\n", expected: "declined: balance 0, requested 1; short by 1\n0\n", hidden: true },
            { stdin: "5\nwithdraw 5\nwithdraw 5\n", expected: "0\ndeclined: balance 0, requested 5; short by 5\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which base should a custom exception subclass?",
          options: ["`BaseException`", "`Exception`", "`object`", "`RuntimeError` always"],
          answer: 1,
          explanation: "`BaseException` is reserved for interpreter-level signals; subclassing it would escape `except Exception`.",
        },
        {
          prompt: "What does forgetting `super().__init__(message)` in a custom `__init__` cause?",
          options: ["A syntax error", "`str(e)` is empty and `e.args` is `()`", "The exception cannot be raised", "The exception is uncatchable"],
          answer: 1,
          explanation: "The base initialiser stores the message in `args`, which `str()` and tracebacks read.",
        },
        {
          prompt: "Why give a package one base exception class?",
          options: ["Python requires it", "So a boundary can catch everything the package raises deliberately, separately from bugs", "For faster matching", "To avoid `finally`"],
          answer: 1,
          explanation: "`except AppError` catches intentional failures; a `TypeError` from a typo is not an `AppError` and surfaces as a bug.",
        },
        {
          prompt: "When should details go on the exception as attributes rather than only in the message?",
          options: ["Never", "When handlers need to act on them — parsing `str(e)` is fragile", "Only for `ValueError`", "When the message is long"],
          answer: 1,
          explanation: "Attributes are structured data; the message is for humans reading a traceback.",
        },
        {
          prompt: "What does `class ConfigKeyError(ConfigError, KeyError)` achieve?",
          options: ["Nothing — multiple inheritance is not allowed for exceptions", "It is caught by both `except ConfigError` and `except KeyError`", "It becomes uncatchable", "It suppresses tracebacks"],
          answer: 1,
          explanation: "An exception that is a kind of built-in error too keeps old handlers working while offering a specific class.",
        },
      ],
    },
    {
      slug: "eafp-and-exception-driven-flow",
      file: "03-eafp-and-exception-driven-flow.md",
      exercises: [
        {
          title: "First, or a default, or an error",
          prompt: `Write \`first(iterable, default=_MISSING)\` using a private sentinel \`_MISSING = object()\`: return the first element; if the iterable is empty, return \`default\` when one was given (even \`None\`) or raise \`ValueError("empty")\` when it was not. Implement it with \`next()\` and \`StopIteration\`. Each input line is a list of integers optionally followed by \`| <default>\` where the default may be the word \`None\`.

**Input:** lines.
**Output:** the first element, the default, or \`ValueError\`.

\`\`\`text
3 1 2
| 9
| None

\`\`\`
prints
\`\`\`text
3
9
None
ValueError
\`\`\``,
          starter: String.raw`import sys

_MISSING = object()


def first(iterable, default=_MISSING):
    # TODO
    pass


for line in sys.stdin:
    head, sep, tail = line.rstrip("\n").partition("|")
    items = [int(t) for t in head.split()]
    tail = tail.strip()
    try:
        if not sep:
            print(first(items))
        else:
            print(first(items, None if tail == "None" else int(tail)))
    except ValueError as e:
        print(type(e).__name__)
`,
          solution: String.raw`import sys

_MISSING = object()


def first(iterable, default=_MISSING):
    try:
        return next(iter(iterable))
    except StopIteration:
        if default is _MISSING:
            raise ValueError("empty") from None
        return default


for line in sys.stdin:
    head, sep, tail = line.rstrip("\n").partition("|")
    items = [int(t) for t in head.split()]
    tail = tail.strip()
    try:
        if not sep:
            print(first(items))
        else:
            print(first(items, None if tail == "None" else int(tail)))
    except ValueError as e:
        print(type(e).__name__)
`,
          hints: [
            "`next(iter(x))` raises `StopIteration` on an empty iterable — that is the EAFP signal.",
            "Compare the default with `is _MISSING`; `None` must count as a real default.",
          ],
          cases: [
            { stdin: "3 1 2\n| 9\n| None\n\n", expected: "3\n9\nNone\nValueError\n" },
            { stdin: "5 | 1\n| 0\n", expected: "5\n0\n", hidden: true },
            { stdin: "\n\n", expected: "ValueError\nValueError\n", hidden: true },
          ],
        },
        {
          title: "Retry with a cap",
          prompt: `Simulate an unreliable operation: it raises \`TransientError\` on its first \`fails\` calls and then succeeds, returning \`"done"\`. Write \`with_retries(fn, attempts)\` that calls \`fn\` up to \`attempts\` times, printing \`attempt <n> failed\` for each transient failure, returns the result on success (print \`success on attempt <n>\`), and re-raises the last \`TransientError\` when every attempt failed (the caller prints \`gave up after <attempts>\`). A \`PermanentError\` must not be retried: it propagates immediately (the caller prints \`permanent\`).

**Input:** one line \`fails attempts\`; a negative \`fails\` means the operation raises \`PermanentError\` at once.
**Output:** the attempt log and the outcome.

\`\`\`text
2 3
\`\`\`
prints
\`\`\`text
attempt 1 failed
attempt 2 failed
success on attempt 3
\`\`\``,
          starter: String.raw`class TransientError(Exception):
    pass


class PermanentError(Exception):
    pass


def make_operation(fails):
    calls = 0

    def operation():
        nonlocal calls
        if fails < 0:
            raise PermanentError("broken")
        calls += 1
        if calls <= fails:
            raise TransientError(f"try again ({calls})")
        return "done"

    return operation


def with_retries(fn, attempts):
    # TODO
    pass


fails, attempts = map(int, input().split())
try:
    with_retries(make_operation(fails), attempts)
except TransientError:
    print(f"gave up after {attempts}")
except PermanentError:
    print("permanent")
`,
          solution: String.raw`class TransientError(Exception):
    pass


class PermanentError(Exception):
    pass


def make_operation(fails):
    calls = 0

    def operation():
        nonlocal calls
        if fails < 0:
            raise PermanentError("broken")
        calls += 1
        if calls <= fails:
            raise TransientError(f"try again ({calls})")
        return "done"

    return operation


def with_retries(fn, attempts):
    for attempt in range(1, attempts + 1):
        try:
            result = fn()
        except TransientError:
            print(f"attempt {attempt} failed")
            if attempt == attempts:
                raise
        else:
            print(f"success on attempt {attempt}")
            return result


fails, attempts = map(int, input().split())
try:
    with_retries(make_operation(fails), attempts)
except TransientError:
    print(f"gave up after {attempts}")
except PermanentError:
    print("permanent")
`,
          hints: [
            "Catch only `TransientError`; anything else propagates through the loop untouched.",
            "On the last attempt, bare `raise` hands the final failure to the caller.",
          ],
          cases: [
            { stdin: "2 3\n", expected: "attempt 1 failed\nattempt 2 failed\nsuccess on attempt 3\n" },
            { stdin: "5 3\n", expected: "attempt 1 failed\nattempt 2 failed\nattempt 3 failed\ngave up after 3\n", hidden: true },
            { stdin: "0 1\n", expected: "success on attempt 1\n", hidden: true },
            { stdin: "-1 4\n", expected: "permanent\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which is true of the cost of exceptions in CPython 3.11?",
          options: ["Entering a `try` is expensive", "Entering a `try` is free; raising and catching costs about a microsecond", "Raising is free", "Both are free"],
          answer: 1,
          explanation: "The handler table is static, so `try` costs nothing at run time; the cost is in building and unwinding a raised exception.",
        },
        {
          prompt: "Which built-in already expresses 'first element or a default'?",
          options: ["`iter(x, default)`", "`next(iterator, default)`", "`x.first(default)`", "`x[0] or default`"],
          answer: 1,
          explanation: "`next` takes a default returned when the iterator is exhausted, avoiding a hand-written `StopIteration` handler.",
        },
        {
          prompt: "What is `contextlib.suppress(FileNotFoundError)` equivalent to?",
          options: ["`try: … except: pass`", "`try: … except FileNotFoundError: pass` around the block", "`if os.path.exists(...)`", "`finally: pass`"],
          answer: 1,
          explanation: "It names the exception, so it cannot degrade into a bare `except`, and reads as intent.",
        },
        {
          prompt: "When should a lookup function return `None` rather than raise?",
          options: ["Always", "When absence is a normal outcome the caller expects to test", "When the caller is another module", "Never"],
          answer: 1,
          explanation: "Raise when absence is exceptional, so a forgotten check fails loudly rather than as a later `NoneType` error.",
        },
        {
          prompt: "Why use `_MISSING = object()` as a default?",
          options: ["It is faster than `None`", "To distinguish 'no argument given' from an explicit `None`", "Because `None` cannot be a default", "To make the function hashable"],
          answer: 1,
          explanation: "A fresh `object()` is unique and compared by identity, so it can never collide with a real value.",
        },
      ],
    },
    {
      slug: "context-managers",
      file: "04-context-managers.md",
      exercises: [
        {
          title: "Commit or roll back",
          prompt: `Write a class-based context manager \`Transaction(account)\` where \`account\` is a one-element list holding a balance. \`__enter__\` records the starting balance and returns the account; \`__exit__\` restores it if the block raised (and lets the exception propagate) and otherwise keeps the changes; in both cases it prints \`commit <balance>\` or \`rollback <balance>\`. Input blocks run between \`begin\` and \`end\`: \`add n\` changes the balance, \`fail\` raises \`RuntimeError\` inside the block (caught outside the \`with\`, printing \`caught\`).

**Input:** commands.
**Output:** one line per block end, plus \`caught\` after a failed block.

\`\`\`text
begin
add 5
add -3
end
begin
add 10
fail
end
\`\`\`
prints
\`\`\`text
commit 2
rollback 2
caught
\`\`\``,
          starter: String.raw`import sys


class Transaction:
    def __init__(self, account):
        self.account = account

    # TODO: __enter__, __exit__


account = [0]
lines = [line.split() for line in sys.stdin]
i = 0
while i < len(lines):
    if lines[i] and lines[i][0] == "begin":
        j = i + 1
        block = []
        while lines[j][0] != "end":
            block.append(lines[j])
            j += 1
        try:
            with Transaction(account) as acct:
                for cmd in block:
                    if cmd[0] == "add":
                        acct[0] += int(cmd[1])
                    elif cmd[0] == "fail":
                        raise RuntimeError("failed")
        except RuntimeError:
            print("caught")
        i = j + 1
    else:
        i += 1
`,
          solution: String.raw`import sys


class Transaction:
    def __init__(self, account):
        self.account = account

    def __enter__(self):
        self.saved = self.account[0]
        return self.account

    def __exit__(self, exc_type, exc, tb):
        if exc_type is None:
            print(f"commit {self.account[0]}")
        else:
            self.account[0] = self.saved
            print(f"rollback {self.account[0]}")
        return False


account = [0]
lines = [line.split() for line in sys.stdin]
i = 0
while i < len(lines):
    if lines[i] and lines[i][0] == "begin":
        j = i + 1
        block = []
        while lines[j][0] != "end":
            block.append(lines[j])
            j += 1
        try:
            with Transaction(account) as acct:
                for cmd in block:
                    if cmd[0] == "add":
                        acct[0] += int(cmd[1])
                    elif cmd[0] == "fail":
                        raise RuntimeError("failed")
        except RuntimeError:
            print("caught")
        i = j + 1
    else:
        i += 1
`,
          hints: [
            "`exc_type is None` in `__exit__` means the block completed normally.",
            "Return `False` so the `RuntimeError` reaches the `except` outside the `with`.",
          ],
          cases: [
            { stdin: "begin\nadd 5\nadd -3\nend\nbegin\nadd 10\nfail\nend\n", expected: "commit 2\nrollback 2\ncaught\n" },
            { stdin: "begin\nfail\nend\nbegin\nend\n", expected: "rollback 0\ncaught\ncommit 0\n", hidden: true },
            { stdin: "begin\nadd 1\nend\nbegin\nadd 1\nend\nbegin\nadd 5\nfail\nend\n", expected: "commit 1\ncommit 2\nrollback 2\ncaught\n", hidden: true },
          ],
        },
        {
          title: "A generator manager with guaranteed teardown",
          prompt: `Write \`section(name)\` with \`@contextlib.contextmanager\`: it prints \`begin <name>\`, yields, and prints \`end <name>\` — **even when the block raises** (the teardown belongs in a \`finally\` around the \`yield\`). Each input line is \`<name> ok\` or \`<name> fail\`; a failing block raises \`ValueError\` inside the \`with\`, which the caller catches and reports as \`caught <name>\`.

**Input:** lines.
**Output:** \`begin\`/\`end\` pairs, with \`caught\` lines after failures.

\`\`\`text
load ok
parse fail
\`\`\`
prints
\`\`\`text
begin load
end load
begin parse
end parse
caught parse
\`\`\``,
          starter: String.raw`import sys
from contextlib import contextmanager


@contextmanager
def section(name):
    # TODO: begin, yield inside try/finally, end
    yield


for line in sys.stdin:
    name, outcome = line.split()
    try:
        with section(name):
            if outcome == "fail":
                raise ValueError(name)
    except ValueError as e:
        print(f"caught {e}")
`,
          solution: String.raw`import sys
from contextlib import contextmanager


@contextmanager
def section(name):
    print(f"begin {name}")
    try:
        yield
    finally:
        print(f"end {name}")


for line in sys.stdin:
    name, outcome = line.split()
    try:
        with section(name):
            if outcome == "fail":
                raise ValueError(name)
    except ValueError as e:
        print(f"caught {e}")
`,
          hints: [
            "An exception in the block is re-raised at the `yield`; without `try`/`finally` the code after it never runs.",
            "The manager does not catch the exception — it only guarantees the teardown, then lets it propagate.",
          ],
          cases: [
            { stdin: "load ok\nparse fail\n", expected: "begin load\nend load\nbegin parse\nend parse\ncaught parse\n" },
            { stdin: "a fail\nb fail\n", expected: "begin a\nend a\ncaught a\nbegin b\nend b\ncaught b\n", hidden: true },
            { stdin: "x ok\n", expected: "begin x\nend x\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `__exit__` receive when the block completed normally?",
          options: ["Nothing", "Three `None` values", "The return value of the block", "`True`"],
          answer: 1,
          explanation: "`exc_type`, `exc` and `tb` are all `None` on normal completion; on an exception they describe it.",
        },
        {
          prompt: "What does returning `True` from `__exit__` do?",
          options: ["Re-raises the exception", "Suppresses the exception so the code after the `with` continues", "Marks the block as committed", "Nothing"],
          answer: 1,
          explanation: "A truthy return swallows the exception; most managers return `False` (or `None`) to let it propagate after cleanup.",
        },
        {
          prompt: "In a `@contextmanager` generator, why wrap the `yield` in `try`/`finally`?",
          options: ["It is required syntax", "Because an exception in the block is raised at the `yield`, and without `finally` the teardown after it is skipped", "To return a value", "To allow two yields"],
          answer: 1,
          explanation: "The generator resumes with the exception thrown in; `finally` guarantees the cleanup runs regardless.",
        },
        {
          prompt: "Which helper enters a variable number of context managers and exits them all?",
          options: ["`suppress`", "`ExitStack`", "`closing`", "`nullcontext`"],
          answer: 1,
          explanation: "`ExitStack.enter_context` registers each manager; they are exited in reverse order when the stack exits.",
        },
        {
          prompt: "Does `__exit__` run when the block executes `return`?",
          options: ["No", "Yes — on every way out of the block", "Only with `finally`", "Only if the manager is a generator"],
          answer: 1,
          explanation: "`with` is a `try`/`finally` in disguise; `return`, `break`, `continue` and exceptions all trigger the exit.",
        },
      ],
    },
    {
      slug: "exception-groups-and-notes",
      file: "05-exception-groups-and-notes.md",
      exercises: [
        {
          title: "Collect every failure",
          prompt: `Validate rows \`name age\`: a non-integer age raises \`ValueError\`, a negative one \`RangeError(ValueError)\` (define it). Validate **every** row, attach a note \`row <n>\` to each exception with \`add_note\`, and if any failed raise one \`ExceptionGroup("invalid rows", errors)\`. Handle it with \`except*\`: one clause for \`RangeError\` printing \`range: <k>\` and one for the remaining \`ValueError\`s printing \`value: <k>\`, each followed by the notes of its members, one per line. If nothing failed print \`all valid\`.

**Input:** lines.
**Output:** the summary lines with their notes, or \`all valid\`.

\`\`\`text
ada 36
bob x
cy -1
dee y
\`\`\`
prints
\`\`\`text
range: 1
row 3
value: 2
row 2
row 4
\`\`\``,
          starter: String.raw`import sys


class RangeError(ValueError):
    pass


def validate(row):
    name, age = row.split()
    # TODO: raise ValueError for a non-integer, RangeError for a negative
    return name, int(age)


rows = [line.strip() for line in sys.stdin if line.strip()]
errors = []
for n, row in enumerate(rows, start=1):
    # TODO: try validate; on ValueError add a note and collect
    pass


def report(label, group):
    print(f"{label}: {len(group.exceptions)}")
    for e in group.exceptions:
        print(e.__notes__[0])


try:
    if errors:
        raise ExceptionGroup("invalid rows", errors)
    print("all valid")
except* RangeError as g:
    report("range", g)
except* ValueError as g:
    report("value", g)
`,
          solution: String.raw`import sys


class RangeError(ValueError):
    pass


def validate(row):
    name, age = row.split()
    try:
        value = int(age)
    except ValueError:
        raise ValueError(f"age {age!r} is not an integer") from None
    if value < 0:
        raise RangeError(f"age {value} is negative")
    return name, value


rows = [line.strip() for line in sys.stdin if line.strip()]
errors = []
for n, row in enumerate(rows, start=1):
    try:
        validate(row)
    except ValueError as e:
        e.add_note(f"row {n}")
        errors.append(e)


def report(label, group):
    print(f"{label}: {len(group.exceptions)}")
    for e in group.exceptions:
        print(e.__notes__[0])


try:
    if errors:
        raise ExceptionGroup("invalid rows", errors)
    print("all valid")
except* RangeError as g:
    report("range", g)
except* ValueError as g:
    report("value", g)
`,
          hints: [
            "`except* RangeError` takes the `RangeError` members out of the group first; the later `except* ValueError` sees only what is left.",
            "`e.__notes__` is the list of notes added with `add_note`.",
          ],
          cases: [
            { stdin: "ada 36\nbob x\ncy -1\ndee y\n", expected: "range: 1\nrow 3\nvalue: 2\nrow 2\nrow 4\n" },
            { stdin: "a 1\nb 2\n", expected: "all valid\n", hidden: true },
            { stdin: "a -1\nb -2\n", expected: "range: 2\nrow 1\nrow 2\n", hidden: true },
            { stdin: "a q\n", expected: "value: 1\nrow 1\n", hidden: true },
          ],
        },
        {
          title: "The last line of a traceback",
          prompt: `Evaluate each input line as an expression. When it raises, print exactly the last line a traceback would show — using \`traceback.format_exception_only(e)\` and stripping the newline — then, after adding a note \`expr: <the expression>\` with \`add_note\`, print the note count and the note. When it succeeds, print \`ok <repr of the value>\`.

**Input:** expression lines.
**Output:** \`ok …\`, or the exception line followed by \`notes 1\` and the note.

\`\`\`text
1 + 1
int("x")
\`\`\`
prints
\`\`\`text
ok 2
ValueError: invalid literal for int() with base 10: 'x'
notes 1
expr: int("x")
\`\`\``,
          starter: String.raw`import sys
import traceback

for line in sys.stdin:
    expr = line.rstrip("\n")
    try:
        value = eval(expr)
    except Exception as e:
        # TODO: format_exception_only, add_note, print
        pass
    else:
        print(f"ok {value!r}")
`,
          solution: String.raw`import sys
import traceback

for line in sys.stdin:
    expr = line.rstrip("\n")
    try:
        value = eval(expr)
    except Exception as e:
        print("".join(traceback.format_exception_only(e)).rstrip("\n").splitlines()[0])
        e.add_note(f"expr: {expr}")
        print(f"notes {len(e.__notes__)}")
        print(e.__notes__[0])
    else:
        print(f"ok {value!r}")
`,
          hints: [
            "`format_exception_only(e)` returns a list of lines; the first is `Type: message`.",
            "Notes added after formatting do not appear in that text, which is why they are printed separately here.",
          ],
          cases: [
            { stdin: "1 + 1\nint(\"x\")\n", expected: "ok 2\nValueError: invalid literal for int() with base 10: 'x'\nnotes 1\nexpr: int(\"x\")\n" },
            { stdin: "{}[\"k\"]\n[1][3]\n", expected: "KeyError: 'k'\nnotes 1\nexpr: {}[\"k\"]\nIndexError: list index out of range\nnotes 1\nexpr: [1][3]\n", hidden: true },
            { stdin: "\"a\" * 2\n", expected: "ok 'aa'\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `except* ValueError as g` bind?",
          options: ["The first `ValueError`", "An `ExceptionGroup` holding the matching members, even if there is only one", "A list of exceptions", "The whole original group"],
          answer: 1,
          explanation: "`except*` always hands the handler a group; use `g.exceptions` for the members.",
        },
        {
          prompt: "How many `except*` clauses can run for one raised group?",
          options: ["Exactly one", "Every clause whose type matches some member", "None", "At most two"],
          answer: 1,
          explanation: "Unlike `except`, the clauses partition the group by type; unmatched members are re-raised afterwards.",
        },
        {
          prompt: "What does `e.add_note(\"row 3\")` change?",
          options: ["The exception's type", "Nothing visible", "The traceback now shows the note beneath the exception; the type and origin are unchanged", "The message"],
          answer: 2,
          explanation: "Notes add context without wrapping or re-typing the exception, so existing handlers still match.",
        },
        {
          prompt: "Which call captures the current traceback as a string inside a handler?",
          options: ["`str(e)`", "`traceback.format_exc()`", "`repr(e)`", "`sys.exc_info()[0]`"],
          answer: 1,
          explanation: "`str(e)` loses the type and the location; `format_exc()` is what a log should record.",
        },
        {
          prompt: "What does `python -W error` do?",
          options: ["Disables warnings", "Turns warnings into exceptions", "Prints warnings twice", "Only affects `DeprecationWarning`"],
          answer: 1,
          explanation: "Promoting warnings to errors is how a test suite fails on deprecations before they become breakages.",
        },
      ],
    },
    {
      slug: "assertions-and-defensive-code",
      file: "06-assertions-and-defensive-code.md",
      exercises: [
        {
          title: "Validate at the boundary",
          prompt: `Write \`set_port(value)\` and \`set_host(value)\` that validate like a library boundary: \`port\` must be an \`int\` (not a \`bool\`) — otherwise \`TypeError("port must be an int, got <type name>")\` — in \`1..65535\` — otherwise \`ValueError("port must be 1-65535, got <value>")\`; \`host\` must be a non-empty string without spaces — \`TypeError("host must be a str, got <type name>")\` or \`ValueError("host must be non-empty without spaces, got <repr>")\`. Each input line is \`port <literal>\` or \`host <literal>\` (parsed with \`ast.literal_eval\`); print \`ok\` or \`<ExceptionType>: <message>\`.

**Input:** lines.
**Output:** one line per input line.

\`\`\`text
port 8080
port 70000
port True
host ""
\`\`\`
prints
\`\`\`text
ok
ValueError: port must be 1-65535, got 70000
TypeError: port must be an int, got bool
ValueError: host must be non-empty without spaces, got ''
\`\`\``,
          starter: String.raw`import ast
import sys


def set_port(value):
    # TODO
    pass


def set_host(value):
    # TODO
    pass


for line in sys.stdin:
    field, literal = line.split(maxsplit=1)
    value = ast.literal_eval(literal.strip())
    try:
        (set_port if field == "port" else set_host)(value)
        print("ok")
    except (TypeError, ValueError) as e:
        print(f"{type(e).__name__}: {e}")
`,
          solution: String.raw`import ast
import sys


def set_port(value):
    if not isinstance(value, int) or isinstance(value, bool):
        raise TypeError(f"port must be an int, got {type(value).__name__}")
    if not 1 <= value <= 65535:
        raise ValueError(f"port must be 1-65535, got {value}")


def set_host(value):
    if not isinstance(value, str):
        raise TypeError(f"host must be a str, got {type(value).__name__}")
    if not value or " " in value:
        raise ValueError(f"host must be non-empty without spaces, got {value!r}")


for line in sys.stdin:
    field, literal = line.split(maxsplit=1)
    value = ast.literal_eval(literal.strip())
    try:
        (set_port if field == "port" else set_host)(value)
        print("ok")
    except (TypeError, ValueError) as e:
        print(f"{type(e).__name__}: {e}")
`,
          hints: [
            "`bool` is a subclass of `int`, so exclude it explicitly.",
            "Type first (`TypeError`), then value (`ValueError`); the message names the expected and the actual.",
          ],
          cases: [
            { stdin: "port 8080\nport 70000\nport True\nhost \"\"\n", expected: "ok\nValueError: port must be 1-65535, got 70000\nTypeError: port must be an int, got bool\nValueError: host must be non-empty without spaces, got ''\n" },
            { stdin: "port \"80\"\nport 0\nhost \"db local\"\nhost 5\nhost \"db\"\n", expected: "TypeError: port must be an int, got str\nValueError: port must be 1-65535, got 0\nValueError: host must be non-empty without spaces, got 'db local'\nTypeError: host must be a str, got int\nok\n", hidden: true },
            { stdin: "port 65535\nport 65536\n", expected: "ok\nValueError: port must be 1-65535, got 65536\n", hidden: true },
          ],
        },
        {
          title: "A stack machine with invariants",
          prompt: `Run a tiny stack machine. Input errors are **validated**: \`push x\` with a non-integer, \`pop\`/\`add\`/\`mul\` on too few operands, or an unknown instruction each print \`error: <message>\` and continue. The machine's own invariants are **asserted**: after every instruction \`assert len(stack) >= 0\` (trivially) and, after \`add\`/\`mul\`, that the result equals the recomputed value — so an assertion can only fail if the implementation is wrong. \`print\` prints the top of the stack. At the end print \`size <n>\`.

**Input:** instructions.
**Output:** error and print lines, then the size.

\`\`\`text
push 2
push 3
add
print
pop
pop
mul
\`\`\`
prints
\`\`\`text
5
error: pop from empty stack
error: mul needs 2 operands
size 0
\`\`\``,
          starter: String.raw`import sys

stack = []
for line in sys.stdin:
    op, *args = line.split()
    # TODO: validate input with ValueError messages; assert invariants
print(f"size {len(stack)}")
`,
          solution: String.raw`import sys

stack = []


def need(n, op):
    if len(stack) < n:
        raise ValueError(f"{op} needs {n} operands" if n > 1 else "pop from empty stack")


for line in sys.stdin:
    op, *args = line.split()
    try:
        if op == "push":
            try:
                stack.append(int(args[0]))
            except (IndexError, ValueError):
                raise ValueError("push needs an integer") from None
        elif op == "pop":
            need(1, op)
            stack.pop()
        elif op in ("add", "mul"):
            need(2, op)
            b, a = stack.pop(), stack.pop()
            result = a + b if op == "add" else a * b
            stack.append(result)
            assert stack[-1] == (a + b if op == "add" else a * b), "arithmetic invariant"
        elif op == "print":
            need(1, op)
            print(stack[-1])
        else:
            raise ValueError(f"unknown instruction {op}")
        assert len(stack) >= 0
    except ValueError as e:
        print(f"error: {e}")
print(f"size {len(stack)}")
`,
          hints: [
            "Input problems are `ValueError`s that the loop reports and survives; assertions are for the implementation's own promises.",
            "`raise … from None` keeps the traceback clean when translating an `IndexError` into your own message.",
          ],
          cases: [
            { stdin: "push 2\npush 3\nadd\nprint\npop\npop\nmul\n", expected: "5\nerror: pop from empty stack\nerror: mul needs 2 operands\nsize 0\n" },
            { stdin: "push x\npush\njump\nprint\n", expected: "error: push needs an integer\nerror: push needs an integer\nerror: unknown instruction jump\nerror: pop from empty stack\nsize 0\n", hidden: true },
            { stdin: "push 4\npush 5\nmul\npush 1\nadd\nprint\n", expected: "21\nsize 1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `python -O` do to `assert` statements?",
          options: ["Makes them raise `SystemExit`", "Removes them entirely from the bytecode", "Prints them as warnings", "Nothing"],
          answer: 1,
          explanation: "Assertions exist only when `__debug__` is true, which is why they must never guard input.",
        },
        {
          prompt: "What is wrong with `assert (x > 0, \"x must be positive\")`?",
          options: ["Nothing", "The parentheses make a non-empty tuple, which is always true, so it never fires", "It raises `SyntaxError`", "The message is ignored"],
          answer: 1,
          explanation: "Write `assert x > 0, \"message\"` without parentheses.",
        },
        {
          prompt: "Which exception fits `set_age(\"ten\")` when an int was required?",
          options: ["`ValueError`", "`TypeError`", "`AssertionError`", "`KeyError`"],
          answer: 1,
          explanation: "The wrong *kind* of object is `TypeError`; the right kind with a bad value (`set_age(-1)`) is `ValueError`.",
        },
        {
          prompt: "Where should external input be validated?",
          options: ["At every function that touches it", "Once, at the boundary where it enters, with a clear exception", "Never — use `assert`", "Only in tests"],
          answer: 1,
          explanation: "Interior code can then assert the established property rather than re-checking it everywhere.",
        },
        {
          prompt: "Why is `assert xs.pop() == 3` dangerous?",
          options: ["`pop` cannot be used in asserts", "The side effect disappears under `-O` along with the check", "It always fails", "It is slow"],
          answer: 1,
          explanation: "Assertions must be pure; when stripped, the `pop` never happens and the program's behaviour changes.",
        },
      ],
    },
    {
      slug: "errors-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Record loader",
          prompt: `Load records \`name;age;email\`. Define \`MissingField(Exception)\` (raised when a line has fewer than three fields) and use \`ValueError\` for a non-integer or negative age. Validate every line, add a note \`line <n>\` to each failure, and raise a single \`ExceptionGroup\` if any failed. Handle it with \`except* MissingField\` and \`except* ValueError\`, printing \`missing: <n>\` / \`invalid: <n>\` followed by the notes in order. Finally print \`loaded <k>\` with the number of valid records.

**Input:** lines.
**Output:** the group summaries (if any), then \`loaded <k>\`.

\`\`\`text
ada;36;a@x
bob;x;b@x
cy;1
dee;-2;d@x
\`\`\`
prints
\`\`\`text
missing: 1
line 3
invalid: 2
line 2
line 4
loaded 1
\`\`\``,
          starter: String.raw`import sys


class MissingField(Exception):
    pass


def parse(line):
    # TODO: split on ';', check the field count, convert and range-check the age
    return None


records = []
errors = []
for n, line in enumerate((l.strip() for l in sys.stdin if l.strip()), start=1):
    # TODO
    pass

try:
    if errors:
        raise ExceptionGroup("load failed", errors)
# TODO: except* clauses
finally:
    print(f"loaded {len(records)}")
`,
          solution: String.raw`import sys


class MissingField(Exception):
    pass


def parse(line):
    parts = line.split(";")
    if len(parts) < 3:
        raise MissingField(f"expected 3 fields, got {len(parts)}")
    name, age, email = parts[:3]
    age = int(age)
    if age < 0:
        raise ValueError(f"age {age} is negative")
    return name, age, email


records = []
errors = []
for n, line in enumerate((l.strip() for l in sys.stdin if l.strip()), start=1):
    try:
        records.append(parse(line))
    except (MissingField, ValueError) as e:
        e.add_note(f"line {n}")
        errors.append(e)


def report(label, group):
    print(f"{label}: {len(group.exceptions)}")
    for e in group.exceptions:
        print(e.__notes__[0])


try:
    if errors:
        raise ExceptionGroup("load failed", errors)
except* MissingField as g:
    report("missing", g)
except* ValueError as g:
    report("invalid", g)
finally:
    print(f"loaded {len(records)}")
`,
          hints: [
            "`int(\"x\")` already raises `ValueError`; only the negative case needs an explicit raise.",
            "`finally` prints the count whether or not a group was raised.",
          ],
          cases: [
            { stdin: "ada;36;a@x\nbob;x;b@x\ncy;1\ndee;-2;d@x\n", expected: "missing: 1\nline 3\ninvalid: 2\nline 2\nline 4\nloaded 1\n" },
            { stdin: "a;1;e\nb;2;f\n", expected: "loaded 2\n", hidden: true },
            { stdin: "only\n", expected: "missing: 1\nline 1\nloaded 0\n", hidden: true },
          ],
        },
        {
          title: "Savepoints",
          prompt: `Implement \`Savepoint(state)\` as a context manager over a list of integers: on entry it copies the list; on an exception it restores the copy and prints \`rollback\`, otherwise prints \`commit\`; it never suppresses the exception. Input is a nested script: \`begin\` opens a savepoint (nesting allowed), \`end\` closes it, \`append n\` appends, \`fail\` raises \`RuntimeError\` — which propagates through every open savepoint until the outermost \`begin\` … \`end\` block's caller catches it and prints \`caught\`. After the script print the state.

**Input:** commands.
**Output:** \`commit\`/\`rollback\`/\`caught\` lines, then \`state <values>\` (or \`state empty\`).

\`\`\`text
begin
append 1
begin
append 2
fail
end
append 3
end
\`\`\`
prints
\`\`\`text
rollback
rollback
caught
state empty
\`\`\``,
          starter: String.raw`import sys


class Savepoint:
    def __init__(self, state):
        self.state = state

    # TODO: __enter__ copies; __exit__ restores on error


def run(commands, state, i):
    """Execute from index i until the matching 'end'; return the next index."""
    while i < len(commands):
        cmd = commands[i]
        if cmd[0] == "begin":
            with Savepoint(state):
                i = run(commands, state, i + 1)
        elif cmd[0] == "end":
            return i + 1
        elif cmd[0] == "append":
            state.append(int(cmd[1]))
            i += 1
        elif cmd[0] == "fail":
            raise RuntimeError("fail")
    return i


commands = [line.split() for line in sys.stdin if line.strip()]
state = []
i = 0
while i < len(commands):
    try:
        i = run(commands, state, i)
    except RuntimeError:
        print("caught")
        depth = 0
        while i < len(commands):          # skip to the end of the outermost block
            if commands[i][0] == "begin":
                depth += 1
            elif commands[i][0] == "end":
                depth -= 1
                if depth == 0:
                    i += 1
                    break
            i += 1
print("state", " ".join(map(str, state)) if state else "empty")
`,
          solution: String.raw`import sys


class Savepoint:
    def __init__(self, state):
        self.state = state

    def __enter__(self):
        self.saved = list(self.state)
        return self.state

    def __exit__(self, exc_type, exc, tb):
        if exc_type is None:
            print("commit")
        else:
            self.state[:] = self.saved
            print("rollback")
        return False


def run(commands, state, i):
    """Execute from index i until the matching 'end'; return the next index."""
    while i < len(commands):
        cmd = commands[i]
        if cmd[0] == "begin":
            with Savepoint(state):
                i = run(commands, state, i + 1)
        elif cmd[0] == "end":
            return i + 1
        elif cmd[0] == "append":
            state.append(int(cmd[1]))
            i += 1
        elif cmd[0] == "fail":
            raise RuntimeError("fail")
    return i


commands = [line.split() for line in sys.stdin if line.strip()]
state = []
i = 0
while i < len(commands):
    try:
        i = run(commands, state, i)
    except RuntimeError:
        print("caught")
        depth = 0
        while i < len(commands):          # skip to the end of the outermost block
            if commands[i][0] == "begin":
                depth += 1
            elif commands[i][0] == "end":
                depth -= 1
                if depth == 0:
                    i += 1
                    break
            i += 1
print("state", " ".join(map(str, state)) if state else "empty")
`,
          hints: [
            "Restore with slice assignment `self.state[:] = self.saved` so the same list object is updated in place.",
            "Returning `False` lets the exception unwind through the outer savepoints, each of which rolls back in turn.",
          ],
          cases: [
            { stdin: "begin\nappend 1\nbegin\nappend 2\nfail\nend\nappend 3\nend\n", expected: "rollback\nrollback\ncaught\nstate empty\n" },
            { stdin: "begin\nappend 1\nbegin\nappend 2\nend\nappend 3\nend\n", expected: "commit\ncommit\nstate 1 2 3\n", hidden: true },
            { stdin: "append 9\nbegin\nappend 1\nfail\nend\nbegin\nappend 2\nend\n", expected: "rollback\ncaught\ncommit\nstate 9 2\n", hidden: true },
          ],
        },
        {
          title: "Calculator with a hierarchy",
          prompt: `Define \`CalcError(Exception)\`, \`ParseError(CalcError)\` and \`DivisionError(CalcError, ZeroDivisionError)\`. \`evaluate(line)\` parses \`a op b\` (integers, \`+ - * /\`) — a malformed line raises \`ParseError\`, division by zero raises \`DivisionError\`; \`/\` is integer division. Handle each line with, in this order: \`except DivisionError\` → \`division: <msg>\`, \`except ParseError\` → \`parse: <msg>\`, \`except CalcError\` → \`calc: <msg>\`. Then show that the multiple inheritance works: a second \`try\` evaluates the same line and catches only \`ZeroDivisionError\`, printing \`also a ZeroDivisionError\` when that fires.

**Input:** lines.
**Output:** the result or the handled message; plus the extra line for division errors.

\`\`\`text
6 / 3
1 / 0
1 + x
\`\`\`
prints
\`\`\`text
2
division: division by zero
also a ZeroDivisionError
parse: bad operand 'x'
\`\`\``,
          starter: String.raw`import sys


class CalcError(Exception):
    pass


class ParseError(CalcError):
    pass


class DivisionError(CalcError, ZeroDivisionError):
    pass


def evaluate(line):
    # TODO
    return 0


for line in sys.stdin:
    line = line.strip()
    # TODO: the two try statements
`,
          solution: String.raw`import sys


class CalcError(Exception):
    pass


class ParseError(CalcError):
    pass


class DivisionError(CalcError, ZeroDivisionError):
    pass


def evaluate(line):
    parts = line.split()
    if len(parts) != 3:
        raise ParseError(f"expected 'a op b', got {line!r}")
    a, op, b = parts
    try:
        x, y = int(a), int(b)
    except ValueError as e:
        bad = a if not a.lstrip("-").isdigit() else b
        raise ParseError(f"bad operand {bad!r}") from e
    if op == "+":
        return x + y
    if op == "-":
        return x - y
    if op == "*":
        return x * y
    if op == "/":
        if y == 0:
            raise DivisionError("division by zero")
        return x // y
    raise ParseError(f"unknown operator {op!r}")


for line in sys.stdin:
    line = line.strip()
    try:
        print(evaluate(line))
    except DivisionError as e:
        print(f"division: {e}")
    except ParseError as e:
        print(f"parse: {e}")
    except CalcError as e:
        print(f"calc: {e}")
    try:
        evaluate(line)
    except ZeroDivisionError:
        print("also a ZeroDivisionError")
    except CalcError:
        pass
`,
          hints: [
            "`DivisionError` inherits from both bases, so `except ZeroDivisionError` matches it as well as `except CalcError`.",
            "Handlers go from the leaves of the hierarchy to the root.",
          ],
          cases: [
            { stdin: "6 / 3\n1 / 0\n1 + x\n", expected: "2\ndivision: division by zero\nalso a ZeroDivisionError\nparse: bad operand 'x'\n" },
            { stdin: "2 ^ 3\n7 - 10\n", expected: "parse: unknown operator '^'\n-3\n", hidden: true },
            { stdin: "1 2\n-8 / 3\n", expected: "parse: expected 'a op b', got '1 2'\n-3\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `finally` guarantee?",
          options: ["It runs only on success", "It runs on every exit from the `try` — success, handled exception, unhandled exception, or `return`", "It runs only when an exception was handled", "It runs before the `try` block"],
          answer: 1,
          explanation: "That is what makes it the place for cleanup — and what `with` packages into a type.",
        },
        {
          prompt: "Which handler catches both `IndexError` and `KeyError` in one clause?",
          options: ["`except IndexError`", "`except LookupError`", "`except ValueError`", "`except BaseException`"],
          answer: 1,
          explanation: "Both are subclasses of `LookupError`; a parent class matches its children.",
        },
        {
          prompt: "What does `raise` with no argument do outside any `except` block?",
          options: ["Re-raises the last exception", "`RuntimeError: No active exception to reraise`", "Raises `Exception`", "Nothing"],
          answer: 1,
          explanation: "Bare `raise` needs an exception currently being handled.",
        },
        {
          prompt: "A custom exception should store handler-relevant values as…",
          options: ["Parts of the message string", "Attributes set in `__init__`", "Global variables", "Return values"],
          answer: 1,
          explanation: "Handlers read attributes; parsing a message is fragile and breaks when wording changes.",
        },
        {
          prompt: "Which is the EAFP way to use a possibly-missing attribute?",
          options: ["`if hasattr(o, \"x\"): use(o.x)`", "`try: use(o.x) except AttributeError: fallback()`", "`if \"x\" in dir(o): …`", "`assert hasattr(o, \"x\")`"],
          answer: 1,
          explanation: "Attempt, then handle the specific failure.",
        },
        {
          prompt: "What must a `@contextmanager` generator do exactly once?",
          options: ["`return`", "`yield`", "`raise`", "`print`"],
          answer: 1,
          explanation: "The single `yield` separates setup from teardown; a second one raises `RuntimeError`.",
        },
        {
          prompt: "How does `with a, b:` order the exits?",
          options: ["`a` then `b`", "`b` then `a` — reverse of entry", "Simultaneously", "Undefined"],
          answer: 1,
          explanation: "Managers are nested: the last entered is the first exited.",
        },
        {
          prompt: "What happens to members of an `ExceptionGroup` matched by no `except*` clause?",
          options: ["They are discarded", "They are re-raised as a smaller group after the handlers run", "They are printed", "They become warnings"],
          answer: 1,
          explanation: "`except*` handles what it names and propagates the rest.",
        },
        {
          prompt: "Which is a legitimate use of `assert`?",
          options: ["Checking that user input is an integer", "Stating a postcondition that only a bug could violate", "Verifying a file exists", "Popping from a list"],
          answer: 1,
          explanation: "Assertions document invariants and vanish under `-O`; input validation must raise a real exception.",
        },
        {
          prompt: "What does `e.__cause__` hold after `raise B(\"x\") from a`?",
          options: ["`None`", "The exception `a`", "The string `\"x\"`", "The traceback"],
          answer: 1,
          explanation: "`from` sets the explicit cause, printed as 'The above exception was the direct cause'.",
        },
        {
          prompt: "Why is `except Exception: return 0` inside a computation harmful?",
          options: ["It is slow", "It converts any bug into a silent wrong answer", "`return` is not allowed in handlers", "It leaks memory"],
          answer: 1,
          explanation: "A handler must recover, translate, report or clean up; hiding the failure moves the damage somewhere less visible.",
        },
        {
          prompt: "What does `contextlib.redirect_stdout(buf)` enable?",
          options: ["Faster printing", "Capturing everything printed inside the block into `buf` — useful in tests", "Printing to stderr", "Disabling output permanently"],
          answer: 1,
          explanation: "With an `io.StringIO`, `buf.getvalue()` holds the output after the block.",
        },
      ],
    },
  ],
});
