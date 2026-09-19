import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "typing-and-quality",
  title: "Type hints and code quality",
  blurb: "The hint vocabulary from generics and unions to TypeVar, Generic, Literal and TypedDict; what a type checker verifies and how narrowing works; PEP 8 layout, naming and docstrings with ruff and black; logging with levels, loggers, handlers and formats; and the idioms that make code Pythonic.",
  icon: "modern",
  overview: `A program that runs is not yet a program others can work on. This module is about the layer that makes code maintainable: type hints precise enough for a checker to catch the \`None\` you forgot to test, a style that every reader already knows, logging that tells an operator what happened without a debugger, and the idioms that say what the code means rather than how it grinds through it. None of it is enforced by the interpreter; all of it is enforced by the tools a serious codebase runs on every commit.

Type hints in depth gives the vocabulary — built-in generics, \`Iterable\`/\`Sequence\`/\`Mapping\` for parameters, unions and \`Optional\`, \`Callable\`, \`TypeVar\` and \`Generic\`, \`ClassVar\`, \`Final\`, \`Literal\`, \`TypedDict\`, \`NewType\`, \`Any\`. Static analysis covers what \`mypy\` checks, narrowing, \`cast\`, \`reveal_type\`, \`TYPE_CHECKING\`, strictness and hints at run time. Code style covers PEP 8 layout and naming, PEP 257 docstrings, comments, and the \`ruff\`/\`black\`/\`pre-commit\` workflow. Logging covers levels, the module-logger idiom, \`basicConfig\`, the hierarchy, formats, lazy arguments, handlers, \`log.exception\` and the library rule. Writing idiomatic Python gathers the idioms and anti-patterns and works through a refactoring.

The exercises are whole programs: a generic \`Stack[T]\`, signatures rendered from \`inspect\`, hints observed at run time with and without the \`annotations\` future import, a validator that reads \`get_type_hints\` and understands unions and \`Literal\`, a naming and idiom linter, a docstring checker built on \`ast\`, a level-filtered logger writing to stdout, a logger with two handlers and two formats, the refactored totals report, and an idiom drill. The checkpoint adds a hint-driven validator with nested generics, a linter-lite over a source file, and a logging pipeline routed by level into two buffers.`,
  lessons: [
    {
      slug: "type-hints-in-depth",
      file: "01-type-hints-in-depth.md",
      exercises: [
        {
          title: "A generic stack",
          prompt: `Write \`Stack(Generic[T])\` with hinted \`push(item: T) -> None\`, \`pop() -> T\`, \`peek() -> T\` and \`__len__\`. Drive it with commands \`push v\`, \`pop\`, \`peek\`, \`len\` (\`empty\` when a pop or peek finds nothing). Before the commands, print \`str(Stack[int])\` to show the parameterised class, and after them print the annotations of \`push\` as \`name: hint\` pairs from \`__annotations__\`.

**Input:** commands.
**Output:** the class line, the command results, then the annotation lines.

\`\`\`text
push 1
push 2
peek
len
\`\`\`
prints
\`\`\`text
__main__.Stack[int]
2
2
item: ~T
return: None
\`\`\``,
          starter: String.raw`import sys
from typing import Generic, TypeVar

T = TypeVar("T")


class Stack(Generic[T]):
    def __init__(self) -> None:
        self._items: list[T] = []

    # TODO: push, pop, peek, __len__ with hints


print(Stack[int])
stack: Stack[int] = Stack()
for line in sys.stdin:
    cmd, *args = line.split()
    # TODO
for name, hint in Stack.push.__annotations__.items():
    print(f"{name}: {hint}")
`,
          solution: String.raw`import sys
from typing import Generic, TypeVar

T = TypeVar("T")


class Stack(Generic[T]):
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()

    def peek(self) -> T:
        return self._items[-1]

    def __len__(self) -> int:
        return len(self._items)


print(Stack[int])
stack: Stack[int] = Stack()
for line in sys.stdin:
    cmd, *args = line.split()
    if cmd == "push":
        stack.push(int(args[0]))
    elif cmd in ("pop", "peek"):
        print(getattr(stack, cmd)() if len(stack) else "empty")
    elif cmd == "len":
        print(len(stack))
for name, hint in Stack.push.__annotations__.items():
    print(f"{name}: {hint}")
`,
          hints: [
            "`Generic[T]` makes `Stack[int]` a valid subscript; at run time it prints as `__main__.Stack[int]`.",
            "A `TypeVar` prints as `~T`; the `return` key holds the return hint.",
          ],
          cases: [
            { stdin: "push 1\npush 2\npeek\nlen\n", expected: "__main__.Stack[int]\n2\n2\nitem: ~T\nreturn: None\n" },
            { stdin: "pop\npush 5\npop\nlen\n", expected: "__main__.Stack[int]\nempty\n5\n0\nitem: ~T\nreturn: None\n", hidden: true },
          ],
        },
        {
          title: "Signatures on display",
          prompt: `Four hinted functions are defined in the program. Read function names and print each one's signature exactly as \`str(inspect.signature(f))\` renders it (which includes the hints and defaults), or \`unknown\` for a name not defined.

**Input:** lines.
**Output:** one line per name.

\`\`\`text
total
lookup
nope
\`\`\`
prints
\`\`\`text
(xs: collections.abc.Iterable[float]) -> float
(table: collections.abc.Mapping[str, int], key: str, default: int | None = None) -> int | None
unknown
\`\`\``,
          starter: String.raw`import inspect
import sys
from collections.abc import Callable, Iterable, Mapping
from typing import Literal


def total(xs: Iterable[float]) -> float:
    return sum(xs)


def lookup(table: Mapping[str, int], key: str, default: int | None = None) -> int | None:
    return table.get(key, default)


def apply(f: Callable[[int], int], values: list[int]) -> list[int]:
    return [f(v) for v in values]


def open_mode(mode: Literal["r", "w"] = "r") -> str:
    return mode


FUNCTIONS = {"total": total, "lookup": lookup, "apply": apply, "open_mode": open_mode}
for line in sys.stdin:
    # TODO
    pass
`,
          solution: String.raw`import inspect
import sys
from collections.abc import Callable, Iterable, Mapping
from typing import Literal


def total(xs: Iterable[float]) -> float:
    return sum(xs)


def lookup(table: Mapping[str, int], key: str, default: int | None = None) -> int | None:
    return table.get(key, default)


def apply(f: Callable[[int], int], values: list[int]) -> list[int]:
    return [f(v) for v in values]


def open_mode(mode: Literal["r", "w"] = "r") -> str:
    return mode


FUNCTIONS = {"total": total, "lookup": lookup, "apply": apply, "open_mode": open_mode}
for line in sys.stdin:
    name = line.strip()
    f = FUNCTIONS.get(name)
    print(str(inspect.signature(f)) if f else "unknown")
`,
          hints: [
            "`inspect.signature` reads the annotations and defaults; its `str` is the text after the function name in a `def`.",
            "`Callable[[int], int]` and `Literal['r', 'w']` render with their own reprs.",
          ],
          cases: [
            { stdin: "total\nlookup\nnope\n", expected: "(xs: collections.abc.Iterable[float]) -> float\n(table: collections.abc.Mapping[str, int], key: str, default: int | None = None) -> int | None\nunknown\n" },
            { stdin: "apply\nopen_mode\n", expected: "(f: collections.abc.Callable[[int], int], values: list[int]) -> list[int]\n(mode: Literal['r', 'w'] = 'r') -> str\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which hint should a function that only loops over its argument use?",
          options: ["`list[int]`", "`Iterable[int]`", "`Sequence[int]`", "`Any`"],
          answer: 1,
          explanation: "Parameters as wide as the function allows: `Iterable` accepts lists, tuples, sets, generators and ranges.",
        },
        {
          prompt: "What does `Optional[int]` mean?",
          options: ["The parameter may be omitted", "`int | None`", "An int that may be unset later", "`int` or any other type"],
          answer: 1,
          explanation: "Optionality of a parameter comes from a default value; `Optional` is only about `None`.",
        },
        {
          prompt: "What does a `TypeVar` in a signature express?",
          options: ["Any type at all", "That the marked positions share one type — e.g. the element type in equals the return type out", "A class variable", "A constant"],
          answer: 1,
          explanation: "It links the types; a `TypeVar` used once links nothing and should be a plain type.",
        },
        {
          prompt: "What is `Literal[\"r\", \"w\"]` for?",
          options: ["Regular expressions", "Restricting a value to exactly those strings, checked statically", "String constants", "File modes only"],
          answer: 1,
          explanation: "The checker rejects `open_mode(\"x\")` at analysis time.",
        },
        {
          prompt: "What does `isinstance(x, list[int])` do?",
          options: ["Checks a list of ints", "Raises `TypeError` — subscripted generics cannot be used with `isinstance`", "Returns `True` for any list", "Returns `False`"],
          answer: 1,
          explanation: "Run-time checks use the plain class; element types are not checked by `isinstance`.",
        },
      ],
    },
    {
      slug: "static-analysis-with-mypy",
      file: "02-static-analysis-with-mypy.md",
      exercises: [
        {
          title: "Hints at run time",
          prompt: `With \`from __future__ import annotations\` in effect, define \`f(x: int, y: str | None = None) -> list[int]\`. Print \`f.__annotations__["y"]\` (a string under the future import), then the resolved hint from \`typing.get_type_hints(f)["y"]\`, then \`typing.TYPE_CHECKING\`. Then read a literal, apply \`typing.cast(int, value)\` and print the value's actual run-time type name to show that \`cast\` changes nothing.

**Input:** one literal line (parse with \`ast.literal_eval\`).
**Output:** \`raw <text>\`, \`resolved <hint>\`, \`type_checking <bool>\`, \`cast <value> is <type>\`.

\`\`\`text
"5"
\`\`\`
prints
\`\`\`text
raw str | None
resolved str | None
type_checking False
cast 5 is str
\`\`\``,
          starter: String.raw`from __future__ import annotations

import ast
import typing


def f(x: int, y: str | None = None) -> list[int]:
    return [x]


# TODO: the four lines
`,
          solution: String.raw`from __future__ import annotations

import ast
import typing


def f(x: int, y: str | None = None) -> list[int]:
    return [x]


print(f"raw {f.__annotations__['y']}")
print(f"resolved {typing.get_type_hints(f)['y']}")
print(f"type_checking {typing.TYPE_CHECKING}")
value = typing.cast(int, ast.literal_eval(input()))
print(f"cast {value} is {type(value).__name__}")
`,
          hints: [
            "Under the future import, annotations are stored as the literal source text; `get_type_hints` evaluates them.",
            "`cast` returns its argument unchanged — it speaks only to the checker.",
          ],
          cases: [
            { stdin: "\"5\"\n", expected: "raw str | None\nresolved str | None\ntype_checking False\ncast 5 is str\n" },
            { stdin: "5\n", expected: "raw str | None\nresolved str | None\ntype_checking False\ncast 5 is int\n", hidden: true },
            { stdin: "[1, 2]\n", expected: "raw str | None\nresolved str | None\ntype_checking False\ncast [1, 2] is list\n", hidden: true },
          ],
        },
        {
          title: "Narrow by hand",
          prompt: `Implement \`describe(v: int | str | list[int] | None) -> str\` using the narrowing tests a checker understands — \`is None\`, then \`isinstance\` for each branch — returning \`none\`, \`int <v>\`, \`str of <len>\` or \`list sum <s>\`; any other type returns \`unsupported <type name>\`. Read literals one per line and print the description.

**Input:** literal lines.
**Output:** one line per literal.

\`\`\`text
None
42
"hey"
[1, 2, 3]
2.5
\`\`\`
prints
\`\`\`text
none
int 42
str of 3
list sum 6
unsupported float
\`\`\``,
          starter: String.raw`import ast
import sys


def describe(v: int | str | list[int] | None) -> str:
    # TODO
    return ""


for line in sys.stdin:
    print(describe(ast.literal_eval(line.strip())))
`,
          solution: String.raw`import ast
import sys


def describe(v: int | str | list[int] | None) -> str:
    if v is None:
        return "none"
    if isinstance(v, bool):
        return "unsupported bool"
    if isinstance(v, int):
        return f"int {v}"
    if isinstance(v, str):
        return f"str of {len(v)}"
    if isinstance(v, list):
        return f"list sum {sum(v)}"
    return f"unsupported {type(v).__name__}"


for line in sys.stdin:
    print(describe(ast.literal_eval(line.strip())))
`,
          hints: [
            "Test `is None` first; each `isinstance` branch then leaves a narrower union for the next.",
            "`bool` is an `int`, so decide what to do with it before the `int` branch.",
          ],
          cases: [
            { stdin: "None\n42\n\"hey\"\n[1, 2, 3]\n2.5\n", expected: "none\nint 42\nstr of 3\nlist sum 6\nunsupported float\n" },
            { stdin: "True\n[]\n\"\"\n", expected: "unsupported bool\nlist sum 0\nstr of 0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does a type checker verify?",
          options: ["That the program produces correct output", "That types are used consistently — without running the code", "That tests pass", "That the code follows PEP 8"],
          answer: 1,
          explanation: "It checks shape, not state; an empty list or a missing file is invisible to it.",
        },
        {
          prompt: "After `if x is None: return 0`, what does the checker believe about `x: int | None`?",
          options: ["Still `int | None`", "`int` — the test narrowed it", "`None`", "`Any`"],
          answer: 1,
          explanation: "Narrowing follows `is None`, `isinstance`, `assert`, early returns and `match` patterns.",
        },
        {
          prompt: "What does `typing.cast(int, value)` do at run time?",
          options: ["Converts `value` to an int", "Returns `value` unchanged; only the checker is told the type", "Raises if `value` is not an int", "Rounds it"],
          answer: 1,
          explanation: "A wrong `cast` surfaces later as a run-time error elsewhere.",
        },
        {
          prompt: "What is `typing.TYPE_CHECKING` at run time?",
          options: ["`True`", "`False` — its `if` block imports only the checker sees", "`None`", "Undefined"],
          answer: 1,
          explanation: "It breaks import cycles and avoids heavy imports needed only for hints.",
        },
        {
          prompt: "What does `from __future__ import annotations` change?",
          options: ["Enables the checker", "Stores annotations as strings, evaluated lazily — allowing forward references", "Enforces hints at run time", "Disables `Any`"],
          answer: 1,
          explanation: "`get_type_hints` evaluates the strings back to objects when a library needs them.",
        },
      ],
    },
    {
      slug: "code-style-and-pep8",
      file: "03-code-style-and-pep8.md",
      exercises: [
        {
          title: "A naming and idiom linter",
          prompt: `Read Python source lines and report, per line, the first rule it breaks: \`tab\` (a tab in the indentation), \`long\` (more than 79 characters), \`def-name\` (a \`def\` whose name is not \`snake_case\`), \`class-name\` (a \`class\` whose name is not \`PascalCase\`), \`none-compare\` (\`== None\` or \`!= None\`), \`bool-compare\` (\`== True\` or \`== False\`), \`type-compare\` (\`type(...) ==\`), \`len-zero\` (\`len(...) == 0\`). Print \`line <n>: <rule>\` for each offending line, or \`clean\` if none.

**Input:** source lines.
**Output:** the report.

\`\`\`text
def getUser(x):
    if x == None:
        return None
class order_item:
    pass
\`\`\`
prints
\`\`\`text
line 1: def-name
line 2: none-compare
line 4: class-name
\`\`\``,
          starter: String.raw`import re
import sys

SNAKE = re.compile(r"[a-z_][a-z0-9_]*")
PASCAL = re.compile(r"[A-Z][A-Za-z0-9]*")


def check(line):
    # TODO: return the first broken rule name or None
    return None


found = False
for n, line in enumerate(sys.stdin, start=1):
    line = line.rstrip("\n")
    rule = check(line)
    if rule:
        print(f"line {n}: {rule}")
        found = True
if not found:
    print("clean")
`,
          solution: String.raw`import re
import sys

SNAKE = re.compile(r"[a-z_][a-z0-9_]*")
PASCAL = re.compile(r"[A-Z][A-Za-z0-9]*")


def check(line):
    indent = line[: len(line) - len(line.lstrip())]
    if "\t" in indent:
        return "tab"
    if len(line) > 79:
        return "long"
    m = re.match(r"\s*def\s+(\w+)", line)
    if m and not SNAKE.fullmatch(m.group(1)):
        return "def-name"
    m = re.match(r"\s*class\s+(\w+)", line)
    if m and not PASCAL.fullmatch(m.group(1)):
        return "class-name"
    if re.search(r"[=!]=\s*None\b", line):
        return "none-compare"
    if re.search(r"==\s*(True|False)\b", line):
        return "bool-compare"
    if re.search(r"\btype\([^)]*\)\s*==", line):
        return "type-compare"
    if re.search(r"\blen\([^)]*\)\s*==\s*0\b", line):
        return "len-zero"
    return None


found = False
for n, line in enumerate(sys.stdin, start=1):
    line = line.rstrip("\n")
    rule = check(line)
    if rule:
        print(f"line {n}: {rule}")
        found = True
if not found:
    print("clean")
`,
          hints: [
            "Check the rules in the listed order and return at the first hit.",
            "`fullmatch` against the naming patterns decides `def-name` and `class-name`; the other rules are `re.search`.",
          ],
          cases: [
            { stdin: "def getUser(x):\n    if x == None:\n        return None\nclass order_item:\n    pass\n", expected: "line 1: def-name\nline 2: none-compare\nline 4: class-name\n" },
            { stdin: "def load_user(x):\n    if x is None:\n        return None\n", expected: "clean\n", hidden: true },
            { stdin: "\tx = 1\nif flag == True:\nif type(x) == int:\nif len(xs) == 0:\n" + "y = " + "1 + ".repeat(30) + "1\n", expected: "line 1: tab\nline 2: bool-compare\nline 3: type-compare\nline 4: len-zero\nline 5: long\n", hidden: true },
          ],
        },
        {
          title: "Docstring checker",
          prompt: `Read a Python module's source from standard input, parse it with \`ast.parse\`, and for every top-level function and class (in source order) report on its docstring via \`ast.get_docstring\`: \`missing\` when there is none, \`no period\` when the first line does not end with \`.\`, \`lowercase\` when the first line does not start with an upper-case letter, otherwise \`ok\`. Then print \`documented <k>/<n>\`.

**Input:** Python source.
**Output:** \`<name>: <verdict>\` per definition, then the summary.

\`\`\`text
def area(w, h):
    """Return the area."""
    return w * h

def perimeter(w, h):
    return 2 * (w + h)

class Shape:
    """a shape"""
\`\`\`
prints
\`\`\`text
area: ok
perimeter: missing
Shape: no period
documented 1/3
\`\`\``,
          starter: String.raw`import ast
import sys

tree = ast.parse(sys.stdin.read())
ok = total = 0
for node in tree.body:
    if isinstance(node, (ast.FunctionDef, ast.ClassDef)):
        total += 1
        doc = ast.get_docstring(node)
        # TODO: verdict
print(f"documented {ok}/{total}")
`,
          solution: String.raw`import ast
import sys

tree = ast.parse(sys.stdin.read())
ok = total = 0
for node in tree.body:
    if isinstance(node, (ast.FunctionDef, ast.ClassDef)):
        total += 1
        doc = ast.get_docstring(node)
        if doc is None:
            verdict = "missing"
        else:
            first = doc.strip().splitlines()[0]
            if not first.endswith("."):
                verdict = "no period"
            elif not first[0].isupper():
                verdict = "lowercase"
            else:
                verdict = "ok"
                ok += 1
        print(f"{node.name}: {verdict}")
print(f"documented {ok}/{total}")
`,
          hints: [
            "`ast.get_docstring(node)` returns the cleaned docstring or `None`.",
            "Check the period before the capital, as the rule order in the prompt says.",
          ],
          cases: [
            { stdin: "def area(w, h):\n    \"\"\"Return the area.\"\"\"\n    return w * h\n\ndef perimeter(w, h):\n    return 2 * (w + h)\n\nclass Shape:\n    \"\"\"a shape\"\"\"\n", expected: "area: ok\nperimeter: missing\nShape: no period\ndocumented 1/3\n" },
            { stdin: "def f():\n    \"\"\"does things.\"\"\"\n", expected: "f: lowercase\ndocumented 0/1\n", hidden: true },
            { stdin: "x = 1\n", expected: "documented 0/0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which name follows PEP 8 for a function?",
          options: ["`getUserName`", "`get_user_name`", "`GetUserName`", "`GET_USER_NAME`"],
          answer: 1,
          explanation: "Functions and variables are `snake_case`; classes `PascalCase`; constants `UPPER_SNAKE`.",
        },
        {
          prompt: "What does a formatter such as `black` do?",
          options: ["Finds bugs", "Rewrites layout to one canonical style so formatting is never debated", "Checks types", "Runs tests"],
          answer: 1,
          explanation: "Linting (`ruff check`) finds problems; formatting (`black`/`ruff format`) normalises appearance.",
        },
        {
          prompt: "Which is the PEP 8 way to test for an empty list?",
          options: ["`if len(xs) == 0:`", "`if not xs:`", "`if xs == []:`", "`if xs.empty():`"],
          answer: 1,
          explanation: "Truthiness of containers is the idiom; the others say the same thing longer.",
        },
        {
          prompt: "What should a comment contain?",
          options: ["A restatement of the next line", "The *why* — a reason, a reference, an invariant, a warning", "Commented-out old code", "The author's name"],
          answer: 1,
          explanation: "The code says what; the comment says why. Version control remembers old code.",
        },
        {
          prompt: "What is the first line of a PEP 257 docstring?",
          options: ["The function's name", "An imperative summary ending in a full stop, on one line", "A list of parameters", "A blank line"],
          answer: 1,
          explanation: "Then a blank line, then details a caller needs.",
        },
      ],
    },
    {
      slug: "logging",
      file: "04-logging.md",
      exercises: [
        {
          title: "Levels and thresholds",
          prompt: `Configure logging once with a \`StreamHandler(sys.stdout)\` and the format \`%(levelname)s:%(name)s:%(message)s\` (no timestamps). Commands: \`level NAME\` sets the root logger's level; \`log LEVEL logger.name message words\` emits a record on the named logger (obtained with \`getLogger\`) at that level using a \`%s\` argument for the message. Records below the threshold are dropped by the machinery — you do not filter by hand.

**Input:** commands (the initial level is \`WARNING\`).
**Output:** the emitted records.

\`\`\`text
log info app.db connected
log warning app.db slow query
level DEBUG
log debug app.web request 1
\`\`\`
prints
\`\`\`text
WARNING:app.db:slow query
DEBUG:app.web:request 1
\`\`\``,
          starter: String.raw`import logging
import sys

handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(logging.Formatter("%(levelname)s:%(name)s:%(message)s"))
root = logging.getLogger()
root.addHandler(handler)
root.setLevel(logging.WARNING)

for line in sys.stdin:
    cmd, *args = line.rstrip("\n").split()
    # TODO: level / log
`,
          solution: String.raw`import logging
import sys

handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(logging.Formatter("%(levelname)s:%(name)s:%(message)s"))
root = logging.getLogger()
root.addHandler(handler)
root.setLevel(logging.WARNING)

for line in sys.stdin:
    cmd, *args = line.rstrip("\n").split()
    if cmd == "level":
        root.setLevel(getattr(logging, args[0]))
    elif cmd == "log":
        level, name, *words = args
        logging.getLogger(name).log(getattr(logging, level.upper()), "%s", " ".join(words))
`,
          hints: [
            "`logger.log(level, \"%s\", text)` emits at a numeric level; `getattr(logging, \"DEBUG\")` turns the name into the number.",
            "Child loggers inherit the root's level when their own is unset, so `level` on the root controls everything.",
          ],
          cases: [
            { stdin: "log info app.db connected\nlog warning app.db slow query\nlevel DEBUG\nlog debug app.web request 1\n", expected: "WARNING:app.db:slow query\nDEBUG:app.web:request 1\n" },
            { stdin: "log error x boom\nlevel CRITICAL\nlog error x hidden\nlog critical x shown\n", expected: "ERROR:x:boom\nCRITICAL:x:shown\n", hidden: true },
          ],
        },
        {
          title: "Two handlers, two formats",
          prompt: `Attach two handlers to the logger \`app\` (level \`DEBUG\`): a console handler on \`sys.stdout\` at \`INFO\` with the format \`%(levelname)s %(message)s\`, and a "file" handler on an \`io.StringIO\` at \`DEBUG\` with \`%(name)s|%(levelname)s|%(message)s\`. Emit records from \`log LEVEL message\` lines through \`app\` or its child \`app.child\` (\`log LEVEL child message\` — the message is the remaining words). Afterwards print \`--- file ---\` and the buffer's contents.

**Input:** lines.
**Output:** the console records, then the separator and the buffer.

\`\`\`text
log debug starting
log info loaded
log warning child slow
\`\`\`
prints
\`\`\`text
INFO loaded
WARNING slow
--- file ---
app|DEBUG|starting
app|INFO|loaded
app.child|WARNING|slow
\`\`\``,
          starter: String.raw`import io
import logging
import sys

app = logging.getLogger("app")
app.setLevel(logging.DEBUG)
buffer = io.StringIO()
# TODO: two handlers with their levels and formatters

for line in sys.stdin:
    _, level, *words = line.split()
    # TODO: pick the logger (child when the first word is "child") and emit
print("--- file ---")
print(buffer.getvalue(), end="")
`,
          solution: String.raw`import io
import logging
import sys

app = logging.getLogger("app")
app.setLevel(logging.DEBUG)
buffer = io.StringIO()
console = logging.StreamHandler(sys.stdout)
console.setLevel(logging.INFO)
console.setFormatter(logging.Formatter("%(levelname)s %(message)s"))
filelike = logging.StreamHandler(buffer)
filelike.setLevel(logging.DEBUG)
filelike.setFormatter(logging.Formatter("%(name)s|%(levelname)s|%(message)s"))
app.addHandler(console)
app.addHandler(filelike)

for line in sys.stdin:
    _, level, *words = line.split()
    logger = app
    if words and words[0] == "child":
        logger = logging.getLogger("app.child")
        words = words[1:]
    logger.log(getattr(logging, level.upper()), "%s", " ".join(words))
print("--- file ---")
print(buffer.getvalue(), end="")
`,
          hints: [
            "Each handler has its own level and formatter; a record is offered to every handler on the logger and its ancestors.",
            "`app.child` has no handlers of its own; its records propagate up to `app`'s handlers with the child's name intact.",
          ],
          cases: [
            { stdin: "log debug starting\nlog info loaded\nlog warning child slow\n", expected: "INFO loaded\nWARNING slow\n--- file ---\napp|DEBUG|starting\napp|INFO|loaded\napp.child|WARNING|slow\n" },
            { stdin: "log debug child quiet\n", expected: "--- file ---\napp.child|DEBUG|quiet\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is the default logging level when nothing is configured?",
          options: ["`DEBUG`", "`INFO`", "`WARNING`", "`ERROR`"],
          answer: 2,
          explanation: "That is why `log.info` prints nothing until `basicConfig(level=logging.INFO)`.",
        },
        {
          prompt: "Why is `logging.getLogger(__name__)` the convention?",
          options: ["It is faster", "The logger names then mirror the package hierarchy, so levels and handlers can be set per subtree", "It is required", "It avoids imports"],
          answer: 1,
          explanation: "`shop.pricing` is a child of `shop`; settings propagate down and records propagate up.",
        },
        {
          prompt: "Why write `log.debug(\"n=%d\", n)` rather than `log.debug(f\"n={n}\")`?",
          options: ["f-strings are not allowed", "The `%s` form is formatted only if the record is emitted, and aggregators can group by template", "It is shorter", "There is no difference"],
          answer: 1,
          explanation: "An f-string does its work even when `DEBUG` is off.",
        },
        {
          prompt: "Which call logs an exception with its traceback?",
          options: ["`log.error(e)`", "`log.exception(\"failed\")` inside the handler", "`print(e)`", "`log.traceback()`"],
          answer: 1,
          explanation: "It is `log.error(..., exc_info=True)` and must run while the exception is being handled.",
        },
        {
          prompt: "What must a library never do with logging?",
          options: ["Create a logger", "Call `basicConfig`, add handlers or set levels — that is the application's job", "Log at `DEBUG`", "Use `__name__`"],
          answer: 1,
          explanation: "Configuration by a library hijacks the application's output; a `NullHandler` is the polite default.",
        },
      ],
    },
    {
      slug: "writing-idiomatic-python",
      file: "05-writing-idiomatic-python.md",
      exercises: [
        {
          title: "The refactored report",
          prompt: `Implement the lesson's idiomatic \`report(records)\`: records are \`name category amount\` lines; total the amounts per category with a \`defaultdict\`, and return one string of \`<category>: <total>\` lines in category order joined with newlines (an empty string when there are no records). \`main\` reads, calls and prints — the function itself does no I/O.

**Input:** lines.
**Output:** the report, or \`(no records)\`.

\`\`\`text
ada food 500
bob travel 1200
cy food 300
\`\`\`
prints
\`\`\`text
food: 800
travel: 1200
\`\`\``,
          starter: String.raw`import sys
from collections import defaultdict


def report(records: list[tuple[str, str, int]]) -> str:
    # TODO
    return ""


def main() -> None:
    records = []
    for line in sys.stdin:
        name, category, amount = line.split()
        records.append((name, category, int(amount)))
    text = report(records)
    print(text if text else "(no records)")


if __name__ == "__main__":
    main()
`,
          solution: String.raw`import sys
from collections import defaultdict


def report(records: list[tuple[str, str, int]]) -> str:
    totals: dict[str, int] = defaultdict(int)
    for _, category, amount in records:
        totals[category] += amount
    return "\n".join(f"{category}: {totals[category]}" for category in sorted(totals))


def main() -> None:
    records = []
    for line in sys.stdin:
        name, category, amount = line.split()
        records.append((name, category, int(amount)))
    text = report(records)
    print(text if text else "(no records)")


if __name__ == "__main__":
    main()
`,
          hints: [
            "Unpack each record in the `for`; `_` marks the unused name.",
            "`\"\\n\".join(...)` over a generator with an f-string builds the whole output in one expression.",
          ],
          cases: [
            { stdin: "ada food 500\nbob travel 1200\ncy food 300\n", expected: "food: 800\ntravel: 1200\n" },
            { stdin: "", expected: "(no records)\n", hidden: true },
            { stdin: "x a -5\ny a 5\n", expected: "a: 0\n", hidden: true },
          ],
        },
        {
          title: "Idiom drill",
          prompt: `Read a line of words. Print, each from one idiomatic expression: the distinct words in first-seen order (\`dict.fromkeys\`); the words grouped by length as \`<len>: <words>\` lines in increasing length (\`defaultdict(list)\`, preserving order within a group); the longest word (\`max\` with \`key=len\`, first on ties); whether any word is capitalised (\`any\` over a generator with \`str.istitle\`); and the words with their positions swapped pairwise using tuple unpacking in a loop over \`zip(words[::2], words[1::2])\`, with an odd last word kept.

**Input:** one line.
**Output:** \`distinct …\`, the group lines, \`longest <w>\`, \`capitalised <bool>\`, \`swapped …\`.

\`\`\`text
to be or not to Be
\`\`\`
prints
\`\`\`text
distinct to be or not Be
2: to be or to Be
3: not
longest not
capitalised True
swapped be to not or Be to
\`\`\``,
          starter: String.raw`from collections import defaultdict

words = input().split()
# TODO: five outputs
`,
          solution: String.raw`from collections import defaultdict

words = input().split()
print("distinct", " ".join(dict.fromkeys(words)))
by_len: dict[int, list[str]] = defaultdict(list)
for w in words:
    by_len[len(w)].append(w)
for n in sorted(by_len):
    print(f"{n}: {' '.join(by_len[n])}")
print("longest", max(words, key=len))
print("capitalised", any(w.istitle() for w in words))
swapped = []
for a, b in zip(words[::2], words[1::2]):
    swapped += [b, a]
if len(words) % 2:
    swapped.append(words[-1])
print("swapped", " ".join(swapped))
`,
          hints: [
            "`zip(words[::2], words[1::2])` pairs neighbours; the odd tail is appended afterwards.",
            "`max(words, key=len)` returns the first of the longest, which is the tie rule wanted.",
          ],
          cases: [
            { stdin: "to be or not to Be\n", expected: "distinct to be or not Be\n2: to be or to Be\n3: not\nlongest not\ncapitalised True\nswapped be to not or Be to\n" },
            { stdin: "one\n", expected: "distinct one\n3: one\nlongest one\ncapitalised False\nswapped one\n", hidden: true },
            { stdin: "aa b aa ccc\n", expected: "distinct aa b ccc\n1: b\n2: aa aa\n3: ccc\nlongest ccc\ncapitalised False\nswapped b aa ccc aa\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which rewrite is idiomatic?",
          options: ["`for i in range(len(xs)): print(i, xs[i])`", "`for i, x in enumerate(xs): print(i, x)`", "`i = 0; for x in xs: print(i, x); i += 1`", "`for i in xs.keys(): …`"],
          answer: 1,
          explanation: "`enumerate` states the intent — element with index — without index arithmetic.",
        },
        {
          prompt: "Which of these hides a bug rather than merely looking foreign?",
          options: ["`if len(xs) == 0:`", "`def f(xs=[]):`", "`s = s + t`", "`for i in range(len(xs)):`"],
          answer: 1,
          explanation: "A mutable default is shared across calls; the others are just verbose.",
        },
        {
          prompt: "When should a class become a plain function?",
          options: ["When it has more than three methods", "When it holds no invariant and its only state exists to be returned", "Never", "When it is slow"],
          answer: 1,
          explanation: "A class without an invariant is a namespace for a function, or a dataclass for a record.",
        },
        {
          prompt: "What does `x or default` get wrong?",
          options: ["Nothing", "It replaces a legitimate falsy `x` — `0`, `\"\"`, `[]` — with the default", "It is slower than `if`", "It raises on `None`"],
          answer: 1,
          explanation: "Use `x if x is not None else default` when falsy values are meaningful.",
        },
        {
          prompt: "What is the goal of idiomatic code?",
          options: ["Fewest lines", "Clarity — brevity is a side effect", "Fastest execution", "Most features used"],
          answer: 1,
          explanation: "A compressed comprehension nobody can read is not idiomatic.",
        },
      ],
    },
    {
      slug: "typing-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "A validator that reads the hints",
          prompt: `Given hinted functions \`greet(name: str, times: int = 1)\`, \`scale(x: float, by: int | None = None)\`, \`open_mode(mode: Literal["r", "w"])\` and \`total(xs: list[int])\`, write \`check(f, *args)\` that reads \`typing.get_type_hints(f)\` and validates each positional argument: a plain class with \`isinstance\` (an \`int\` satisfies \`float\`; a \`bool\` never satisfies \`int\` or \`float\`); a union (\`get_origin\` is \`types.UnionType\`) if any member accepts; \`Literal\` if the value is one of \`get_args\`; \`list[T]\` if it is a list whose every element satisfies \`T\`. Missing arguments with defaults are fine. Each input line is a name followed by comma-separated argument literals; print \`ok <result>\` or \`type error: <param>\`.

**Input:** lines.
**Output:** one line per call.

\`\`\`text
greet "ada", 2
scale 3, None
open_mode "x"
total [1, 2, "3"]
\`\`\`
prints
\`\`\`text
ok Hello, ada! Hello, ada!
ok 3
type error: mode
type error: xs
\`\`\``,
          starter: String.raw`import ast
import sys
import types
import typing
from typing import Literal


def greet(name: str, times: int = 1) -> str:
    return " ".join([f"Hello, {name}!"] * times)


def scale(x: float, by: int | None = None) -> float:
    return x * (by if by is not None else 1)


def open_mode(mode: Literal["r", "w"]) -> str:
    return f"mode {mode}"


def total(xs: list[int]) -> int:
    return sum(xs)


FUNCTIONS = {"greet": greet, "scale": scale, "open_mode": open_mode, "total": total}


def accepts(value, hint) -> bool:
    # TODO: classes, unions, Literal, list[T]
    return True


def check(f, *args):
    hints = typing.get_type_hints(f)
    params = [p for p in hints if p != "return"]
    for param, value in zip(params, args):
        if not accepts(value, hints[param]):
            return f"type error: {param}"
    return f"ok {f(*args)}"


for line in sys.stdin:
    name, *rest = line.strip().split(maxsplit=1)
    args = list(ast.literal_eval(f"({rest[0]},)")) if rest else []
    print(check(FUNCTIONS[name], *args))
`,
          solution: String.raw`import ast
import sys
import types
import typing
from typing import Literal


def greet(name: str, times: int = 1) -> str:
    return " ".join([f"Hello, {name}!"] * times)


def scale(x: float, by: int | None = None) -> float:
    return x * (by if by is not None else 1)


def open_mode(mode: Literal["r", "w"]) -> str:
    return f"mode {mode}"


def total(xs: list[int]) -> int:
    return sum(xs)


FUNCTIONS = {"greet": greet, "scale": scale, "open_mode": open_mode, "total": total}


def accepts(value, hint) -> bool:
    origin = typing.get_origin(hint)
    if origin is types.UnionType or origin is typing.Union:
        return any(accepts(value, member) for member in typing.get_args(hint))
    if origin is Literal:
        return value in typing.get_args(hint)
    if origin is list:
        (inner,) = typing.get_args(hint)
        return isinstance(value, list) and all(accepts(v, inner) for v in value)
    if hint is type(None):
        return value is None
    if isinstance(value, bool):
        return hint is bool
    if hint is float:
        return isinstance(value, (int, float))
    return isinstance(value, hint)


def check(f, *args):
    hints = typing.get_type_hints(f)
    params = [p for p in hints if p != "return"]
    for param, value in zip(params, args):
        if not accepts(value, hints[param]):
            return f"type error: {param}"
    return f"ok {f(*args)}"


for line in sys.stdin:
    name, *rest = line.strip().split(maxsplit=1)
    args = list(ast.literal_eval(f"({rest[0]},)")) if rest else []
    print(check(FUNCTIONS[name], *args))
`,
          hints: [
            "`typing.get_origin` and `get_args` take a hint apart: a union's members, a `Literal`'s values, a `list[T]`'s element type.",
            "Recursion handles nesting — a union member may itself be `list[int]`.",
          ],
          cases: [
            { stdin: "greet \"ada\", 2\nscale 3, None\nopen_mode \"x\"\ntotal [1, 2, \"3\"]\n", expected: "ok Hello, ada! Hello, ada!\nok 3\ntype error: mode\ntype error: xs\n" },
            { stdin: "greet 5\nscale 2.5, 2\nopen_mode \"w\"\ntotal []\n", expected: "type error: name\nok 5.0\nok mode w\nok 0\n", hidden: true },
            { stdin: "scale True\ngreet \"x\", True\ntotal [True]\n", expected: "type error: x\ntype error: times\ntype error: xs\n", hidden: true },
          ],
        },
        {
          title: "Linter-lite",
          prompt: `Read a Python source and report, per line, every rule it breaks (comma-separated, in rule order): \`tab\`, \`long\` (over 79 characters), \`trailing-space\`, \`def-name\` (not \`snake_case\`), \`class-name\` (not \`PascalCase\`), \`none-compare\` (\`== None\`/\`!= None\`), \`bare-except\` (\`except:\`), \`mutable-default\` (\`=[]\`, \`={}\` or \`=set()\` inside a \`def\` line's parameters), \`star-import\` (\`import *\`). Print \`line <n>: <rules>\` for each offending line, then \`problems <total rules>\`.

**Input:** source lines.
**Output:** the report and the count.

\`\`\`text
from os import *
def Load(xs=[]):
    try:
        pass
    except:
        pass
\`\`\`
prints
\`\`\`text
line 1: star-import
line 2: def-name, mutable-default
line 5: bare-except
problems 4
\`\`\``,
          starter: String.raw`import re
import sys

RULES = [
    ("tab", lambda s: "\t" in s[: len(s) - len(s.lstrip())]),
    # TODO: the remaining rules as (name, predicate) pairs
]

problems = 0
for n, line in enumerate(sys.stdin, start=1):
    line = line.rstrip("\n")
    broken = [name for name, test in RULES if test(line)]
    if broken:
        problems += len(broken)
        print(f"line {n}: {', '.join(broken)}")
print(f"problems {problems}")
`,
          solution: String.raw`import re
import sys

RULES = [
    ("tab", lambda s: "\t" in s[: len(s) - len(s.lstrip())]),
    ("long", lambda s: len(s) > 79),
    ("trailing-space", lambda s: s != s.rstrip(" ")),
    ("def-name", lambda s: bool((m := re.match(r"\s*def\s+(\w+)", s)) and not re.fullmatch(r"[a-z_][a-z0-9_]*", m.group(1)))),
    ("class-name", lambda s: bool((m := re.match(r"\s*class\s+(\w+)", s)) and not re.fullmatch(r"[A-Z][A-Za-z0-9]*", m.group(1)))),
    ("none-compare", lambda s: re.search(r"[=!]=\s*None\b", s) is not None),
    ("bare-except", lambda s: re.match(r"\s*except\s*:", s) is not None),
    ("mutable-default", lambda s: re.match(r"\s*def\s", s) is not None and re.search(r"=\s*(\[\]|\{\}|set\(\))", s) is not None),
    ("star-import", lambda s: re.search(r"\bimport\s+\*", s) is not None),
]

problems = 0
for n, line in enumerate(sys.stdin, start=1):
    line = line.rstrip("\n")
    broken = [name for name, test in RULES if test(line)]
    if broken:
        problems += len(broken)
        print(f"line {n}: {', '.join(broken)}")
print(f"problems {problems}")
`,
          hints: [
            "A table of `(name, predicate)` pairs keeps the rules in order and the loop trivial — a strategy list.",
            "The `def-name` and `class-name` predicates need a match first; the walrus keeps them one expression.",
          ],
          cases: [
            { stdin: "from os import *\ndef Load(xs=[]):\n    try:\n        pass\n    except:\n        pass\n", expected: "line 1: star-import\nline 2: def-name, mutable-default\nline 5: bare-except\nproblems 4\n" },
            { stdin: "def load(xs=None):\n    return xs\n", expected: "problems 0\n", hidden: true },
            { stdin: "class item: \n\tx = 1\nif x == None: pass\n", expected: "line 1: trailing-space, class-name\nline 2: tab\nline 3: none-compare\nproblems 4\n", hidden: true },
          ],
        },
        {
          title: "Routed logging",
          prompt: `Build a logger \`svc\` at \`DEBUG\` with two \`StringIO\` handlers: \`errors\` at \`ERROR\` with format \`%(levelname)s %(name)s: %(message)s\`, and \`all\` at \`DEBUG\` with \`%(levelname)s: %(message)s\`. Process lines \`LEVEL message…\` through \`svc\`, with the special line \`fail message…\` raising and catching a \`RuntimeError\` and logging it with \`log.exception\` (which appends the traceback; count its records but print only their first line). Afterwards print \`--- errors ---\`, the first line of each record in the errors buffer, \`--- all ---\`, the first line of each record in the all buffer, then \`records <n>\` for the all buffer.

**Input:** lines.
**Output:** as described.

\`\`\`text
info started
debug detail
fail disk full
error plain error
\`\`\`
prints
\`\`\`text
--- errors ---
ERROR svc: disk full
ERROR svc: plain error
--- all ---
INFO: started
DEBUG: detail
ERROR: disk full
ERROR: plain error
records 4
\`\`\``,
          starter: String.raw`import io
import logging
import sys

log = logging.getLogger("svc")
log.setLevel(logging.DEBUG)
errors, everything = io.StringIO(), io.StringIO()
# TODO: handlers

for line in sys.stdin:
    level, *words = line.split()
    message = " ".join(words)
    # TODO: fail -> raise/catch/log.exception; otherwise log at the level


def first_lines(text):
    # a record with a traceback spans several lines; keep the first line of each record
    lines = text.splitlines()
    return [l for l in lines if l and not l.startswith(("Traceback", "  ", "RuntimeError"))]


print("--- errors ---")
print("\n".join(first_lines(errors.getvalue())))
print("--- all ---")
kept = first_lines(everything.getvalue())
print("\n".join(kept))
print(f"records {len(kept)}")
`,
          solution: String.raw`import io
import logging
import sys

log = logging.getLogger("svc")
log.setLevel(logging.DEBUG)
errors, everything = io.StringIO(), io.StringIO()
h_err = logging.StreamHandler(errors)
h_err.setLevel(logging.ERROR)
h_err.setFormatter(logging.Formatter("%(levelname)s %(name)s: %(message)s"))
h_all = logging.StreamHandler(everything)
h_all.setLevel(logging.DEBUG)
h_all.setFormatter(logging.Formatter("%(levelname)s: %(message)s"))
log.addHandler(h_err)
log.addHandler(h_all)

for line in sys.stdin:
    level, *words = line.split()
    message = " ".join(words)
    if level == "fail":
        try:
            raise RuntimeError(message)
        except RuntimeError:
            log.exception("%s", message)
    else:
        log.log(getattr(logging, level.upper()), "%s", message)


def first_lines(text):
    # a record with a traceback spans several lines; keep the first line of each record
    lines = text.splitlines()
    return [l for l in lines if l and not l.startswith(("Traceback", "  ", "RuntimeError"))]


print("--- errors ---")
print("\n".join(first_lines(errors.getvalue())))
print("--- all ---")
kept = first_lines(everything.getvalue())
print("\n".join(kept))
print(f"records {len(kept)}")
`,
          hints: [
            "`log.exception` logs at `ERROR` from inside the handler and appends the traceback lines, which the helper strips.",
            "Both handlers see every record; each applies its own level and format.",
          ],
          cases: [
            { stdin: "info started\ndebug detail\nfail disk full\nerror plain error\n", expected: "--- errors ---\nERROR svc: disk full\nERROR svc: plain error\n--- all ---\nINFO: started\nDEBUG: detail\nERROR: disk full\nERROR: plain error\nrecords 4\n" },
            { stdin: "warning only\n", expected: "--- errors ---\n\n--- all ---\nWARNING: only\nrecords 1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which hint is right for a function returning a generator of strings?",
          options: ["`list[str]`", "`Iterator[str]`", "`Generator`", "`str`"],
          answer: 1,
          explanation: "A generator function's return type is `Iterator[T]` (or `Generator[T, None, None]` when send/return types matter).",
        },
        {
          prompt: "What does `TypedDict` describe?",
          options: ["A dict with typed keys and values of one type", "A dict with a fixed set of string keys, each with its own value type", "A dataclass", "An ordered dict"],
          answer: 1,
          explanation: "It types JSON-shaped data without converting it to a class.",
        },
        {
          prompt: "What does `NewType(\"UserId\", int)` give you?",
          options: ["A subclass with methods", "A distinct type for the checker that is a plain int at run time", "A validated integer", "An enum"],
          answer: 1,
          explanation: "It prevents ids of different kinds being mixed, at zero run-time cost.",
        },
        {
          prompt: "Which test does *not* narrow a union for the checker?",
          options: ["`isinstance(x, int)`", "`x is None`", "A custom `is_int(x)` returning `bool`", "`assert isinstance(x, str)`"],
          answer: 2,
          explanation: "A custom predicate narrows only if declared with a `TypeGuard` return type.",
        },
        {
          prompt: "What does `# type: ignore[arg-type]` do?",
          options: ["Disables the checker for the file", "Suppresses that one error code on that line", "Fixes the type", "Marks a TODO"],
          answer: 1,
          explanation: "Always include the code; a bare ignore hides every future error on the line.",
        },
        {
          prompt: "Which tool rewrites layout to a canonical style?",
          options: ["`mypy`", "`black` / `ruff format`", "`pytest`", "`pip`"],
          answer: 1,
          explanation: "`ruff check` lints; `mypy` types; formatting is the formatter's job.",
        },
        {
          prompt: "Which is PEP 8-compliant?",
          options: ["`def f( a,b ):`", "`def f(a, b):`", "`def f (a, b) :`", "`def f(a , b):`"],
          answer: 1,
          explanation: "No space inside brackets or before the call's parentheses; a space after each comma.",
        },
        {
          prompt: "What does a `.setLevel(INFO)` on a *handler* do that the logger's level does not?",
          options: ["Nothing different", "Filters what reaches that one destination; the logger's level filters before any handler", "Changes the format", "Applies to child loggers"],
          answer: 1,
          explanation: "Logger level first, then each handler's level — two independent gates.",
        },
        {
          prompt: "Where does a child logger's record go if the child has no handlers?",
          options: ["Nowhere", "Up to its ancestors' handlers, keeping the child's name", "To stdout", "It raises"],
          answer: 1,
          explanation: "Propagation is what makes one root configuration serve a whole application.",
        },
        {
          prompt: "Which line is the idiomatic swap?",
          options: ["`tmp = a; a = b; b = tmp`", "`a, b = b, a`", "`a = b; b = a`", "`swap(a, b)`"],
          answer: 1,
          explanation: "Tuple packing evaluates the right side before binding.",
        },
        {
          prompt: "Which spelling of 'value or a default when the key is missing' is idiomatic?",
          options: ["`d[k] if k in d else default`", "`d.get(k, default)`", "`try: d[k] except: default`", "`d.setdefault(k)`"],
          answer: 1,
          explanation: "`get` does one lookup and states the intent; bare `except` is a bug in the third.",
        },
        {
          prompt: "What is the difference between a docstring and a comment?",
          options: ["None", "A docstring is the first statement, stored in `__doc__`, describing the contract; a comment is discarded and explains why", "Comments are stored; docstrings are not", "Docstrings use `#`"],
          answer: 1,
          explanation: "`help()` shows docstrings; nothing shows comments except the source.",
        },
      ],
    },
  ],
});
