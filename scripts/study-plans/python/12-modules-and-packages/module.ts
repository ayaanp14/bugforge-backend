import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "modules-and-packages",
  title: "Modules, packages and imports",
  blurb: "What import does and the sys.modules cache, from-imports copying bindings, packages with __init__.py and relative imports, the standard-library map, virtual environments with pip and pyproject.toml, and command-line scripts with argparse, streams and exit codes.",
  icon: "layers",
  overview: `A module is a file and a package is a directory, and everything else about Python's import system follows from how those two things are found, run once and cached. This module makes that mechanism explicit — the \`sys.modules\` cache, the difference between \`import m\` and \`from m import x\`, why top-level code runs at import time, why circular imports fail the way they do — and then covers the practical layer around it: package layout, relative imports and \`python -m\`, the standard library as a map to consult before writing anything, virtual environments and \`pyproject.toml\`, and the conventions that make a script a proper command-line tool.

Modules and imports covers the forms, the five steps of an import, binding-copy semantics, \`__name__\`, circular imports and style. Packages covers \`__init__.py\`, \`__all__\`, relative imports, \`python -m\`, \`__main__.py\`, the \`src/\` layout and \`importlib.resources\`. The standard-library map indexes the modules by job. Virtual environments and packaging covers \`venv\`, \`pip\`, version specifiers, \`pyproject.toml\`, editable installs and the tools. Scripts and the CLI covers \`argparse\`, the three streams, exit codes, environment variables and the testable \`main(argv)\` shape.

The exercises are whole programs: an import-order simulator with a cache, a real dynamically built module that shows binding copies, a package created on disk to show submodule attributes, a relative-import resolver, a census of imports against \`sys.stdlib_module_names\`, a module explorer, a requirements parser with version checks, a \`tomllib\` reader for \`pyproject.toml\`, an \`argparse\` driver fed from lines, and a \`main(argv)\` with exit codes. The checkpoint adds an import graph with cycle detection, a requirements checker, and a sub-command tool.`,
  lessons: [
    {
      slug: "modules-and-imports",
      file: "01-modules-and-imports.md",
      exercises: [
        {
          title: "Import order, simulated",
          prompt: `Simulate the import system. Lines \`module <name> imports <a> <b> …\` declare what each module imports at its top level (a module may import nothing). Lines \`run <name>\` import that module: a module not yet in the cache has its body started — print its name — and its imports are processed in order (each recursively) before the body finishes; a module already in the cache is not run again. For each \`run\`, print the names of the modules whose bodies started, in order, or \`(cached)\` if none.

**Input:** lines.
**Output:** one line per \`run\`.

\`\`\`text
module a imports b c
module b imports c
module c imports
run a
run c
run b
\`\`\`
prints
\`\`\`text
a b c
(cached)
(cached)
\`\`\``,
          starter: String.raw`import sys

imports = {}
cache = set()


def do_import(name, started):
    # TODO: if cached return; mark, record, import dependencies first
    pass


for line in sys.stdin:
    parts = line.split()
    if not parts:
        continue
    if parts[0] == "module":
        imports[parts[1]] = parts[3:]
    elif parts[0] == "run":
        started = []
        do_import(parts[1], started)
        print(" ".join(started) if started else "(cached)")
`,
          solution: String.raw`import sys

imports = {}
cache = set()


def do_import(name, started):
    if name in cache:
        return
    cache.add(name)
    started.append(name)
    for dep in imports.get(name, []):
        do_import(dep, started)


for line in sys.stdin:
    parts = line.split()
    if not parts:
        continue
    if parts[0] == "module":
        imports[parts[1]] = parts[3:]
    elif parts[0] == "run":
        started = []
        do_import(parts[1], started)
        print(" ".join(started) if started else "(cached)")
`,
          hints: [
            "Add the module to the cache *before* processing its imports — that is what lets a circular import terminate.",
            "The body 'starts' when the module is first seen; dependencies then run in declaration order.",
          ],
          cases: [
            { stdin: "module a imports b c\nmodule b imports c\nmodule c imports\nrun a\nrun c\nrun b\n", expected: "a b c\n(cached)\n(cached)\n" },
            { stdin: "module x imports y\nmodule y imports x\nrun y\n", expected: "y x\n", hidden: true },
            { stdin: "module m imports\nrun m\nrun m\n", expected: "m\n(cached)\n", hidden: true },
          ],
        },
        {
          title: "A binding is a copy",
          prompt: `Build a real module at run time: create \`types.ModuleType("config")\`, execute the source \`DEBUG = False\` plus an \`enable()\`/\`disable()\` pair that rebind the module-level \`DEBUG\` with \`global\`, register it in \`sys.modules\`, then do \`from config import DEBUG, enable, disable\` **and** \`import config\`. For each command line (\`enable\` or \`disable\`) call the function and print the imported name \`DEBUG\` next to \`config.DEBUG\`, showing that the from-import copied the binding.

**Input:** command lines.
**Output:** \`imported=<bool> module=<bool>\` per command.

\`\`\`text
enable
disable
\`\`\`
prints
\`\`\`text
imported=False module=True
imported=False module=False
\`\`\``,
          starter: String.raw`import sys
import types

SOURCE = """
DEBUG = False

def enable():
    global DEBUG
    DEBUG = True

def disable():
    global DEBUG
    DEBUG = False
"""

# TODO: module = types.ModuleType("config"); exec(SOURCE, module.__dict__); sys.modules["config"] = module
# TODO: from config import DEBUG, enable, disable ; import config

for line in sys.stdin:
    cmd = line.strip()
    # TODO: call, then print both views
`,
          solution: String.raw`import sys
import types

SOURCE = """
DEBUG = False

def enable():
    global DEBUG
    DEBUG = True

def disable():
    global DEBUG
    DEBUG = False
"""

module = types.ModuleType("config")
exec(SOURCE, module.__dict__)
sys.modules["config"] = module

from config import DEBUG, enable, disable  # noqa: E402
import config  # noqa: E402

for line in sys.stdin:
    cmd = line.strip()
    if cmd == "enable":
        enable()
    elif cmd == "disable":
        disable()
    print(f"imported={DEBUG} module={config.DEBUG}")
`,
          hints: [
            "Once the module object is in `sys.modules`, an ordinary `import config` finds it there — no file needed.",
            "`DEBUG` in this file was bound once, to the object `config.DEBUG` referred to at import time; `global DEBUG = True` rebinds the module's name, not yours.",
          ],
          cases: [
            { stdin: "enable\ndisable\n", expected: "imported=False module=True\nimported=False module=False\n" },
            { stdin: "disable\nenable\nenable\n", expected: "imported=False module=False\nimported=False module=True\nimported=False module=True\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "How many times does a module's top-level code run when it is imported from five places in one program?",
          options: ["Five", "Once — later imports find it in `sys.modules`", "Zero", "Depends on the import form"],
          answer: 1,
          explanation: "The cache is checked first; only the first import executes the file.",
        },
        {
          prompt: "After `from m import x`, `m.x = 5` is executed elsewhere. What is your `x`?",
          options: ["`5`", "Still the object it was bound to at import time", "`None`", "`NameError`"],
          answer: 1,
          explanation: "A from-import copies a binding; rebinding the module attribute does not reach it. Access changing state through the module.",
        },
        {
          prompt: "Why does naming your file `random.py` break `import random`?",
          options: ["It does not", "The script's directory is first on `sys.path`, so your file shadows the standard module", "Python forbids it", "Only on Windows"],
          answer: 1,
          explanation: "Never name a file after a standard module you or your dependencies import.",
        },
        {
          prompt: "What is `__name__` inside a module that was imported (not run)?",
          options: ["`\"__main__\"`", "The module's import name", "The file path", "`None`"],
          answer: 1,
          explanation: "Only the script being run gets `\"__main__\"`, which is what the main guard tests.",
        },
        {
          prompt: "Which is the preferred fix for a circular import?",
          options: ["`import *`", "Move the shared names into a third module both import, or import lazily inside the function", "`reload`", "Rename the modules"],
          answer: 1,
          explanation: "A cycle usually means a dependency points the wrong way; restructure first, defer the import second.",
        },
      ],
    },
    {
      slug: "packages",
      file: "02-packages.md",
      exercises: [
        {
          title: "A package on disk",
          prompt: `Create a real package next to this script at run time: a directory \`pkg_demo\` with an empty \`__init__.py\` and one module file per name on the first input line, each containing \`NAME = "<name>"\`. Then process commands: \`import pkg_demo\` (print \`imported pkg_demo\`), \`import pkg_demo.<x>\` (print \`imported pkg_demo.<x>\`), and \`has <x>\` — print whether \`pkg_demo\` currently has the attribute \`<x>\`, which is only true once that submodule has been imported. Remove the directory at the end.

**Input:** a line of module names, then commands.
**Output:** one line per command.

\`\`\`text
models pricing
import pkg_demo
has models
import pkg_demo.models
has models
has pricing
\`\`\`
prints
\`\`\`text
imported pkg_demo
False
imported pkg_demo.models
True
False
\`\`\``,
          starter: String.raw`import importlib
import os
import shutil
import sys

base = os.path.dirname(os.path.abspath(__file__))
pkg_dir = os.path.join(base, "pkg_demo")
names = input().split()
# TODO: create the package directory, __init__.py and the module files
if base not in sys.path:
    sys.path.insert(0, base)

try:
    for line in sys.stdin:
        cmd, *args = line.split()
        # TODO: import / has
        pass
finally:
    shutil.rmtree(pkg_dir, ignore_errors=True)
`,
          solution: String.raw`import importlib
import os
import shutil
import sys

base = os.path.dirname(os.path.abspath(__file__))
pkg_dir = os.path.join(base, "pkg_demo")
names = input().split()
os.makedirs(pkg_dir, exist_ok=True)
with open(os.path.join(pkg_dir, "__init__.py"), "w", encoding="utf-8") as f:
    f.write("")
for name in names:
    with open(os.path.join(pkg_dir, f"{name}.py"), "w", encoding="utf-8") as f:
        f.write(f'NAME = "{name}"\n')
if base not in sys.path:
    sys.path.insert(0, base)

try:
    for line in sys.stdin:
        cmd, *args = line.split()
        if cmd == "import":
            importlib.import_module(args[0])
            print(f"imported {args[0]}")
        elif cmd == "has":
            print(hasattr(sys.modules["pkg_demo"], args[0]))
finally:
    shutil.rmtree(pkg_dir, ignore_errors=True)
`,
          hints: [
            "`importlib.import_module(\"pkg_demo.models\")` imports the package first, then the submodule, and binds `models` on the package object.",
            "Importing the package alone runs only `__init__.py`; submodules are attributes only after they are imported.",
          ],
          cases: [
            { stdin: "models pricing\nimport pkg_demo\nhas models\nimport pkg_demo.models\nhas models\nhas pricing\n", expected: "imported pkg_demo\nFalse\nimported pkg_demo.models\nTrue\nFalse\n" },
            { stdin: "a\nimport pkg_demo.a\nhas a\n", expected: "imported pkg_demo.a\nTrue\n", hidden: true },
          ],
        },
        {
          title: "Resolve a relative import",
          prompt: `Given the dotted name of the **module** doing the import and a relative import target, compute the absolute module name. One leading dot means the module's own package; each additional dot goes up one package. The part after the dots (possibly empty) is appended. Going above the top-level package prints \`error: beyond top-level package\`; a module with no package at all (no dot in its name) cannot use relative imports — print the same error.

**Input:** lines \`<module> <target>\`.
**Output:** one line per input line.

\`\`\`text
shop.pricing .models
shop.utils.text ..models
shop.cli ...x
\`\`\`
prints
\`\`\`text
shop.models
shop.models
error: beyond top-level package
\`\`\``,
          starter: String.raw`import sys


def resolve(module, target):
    # TODO
    return ""


for line in sys.stdin:
    module, target = line.split()
    print(resolve(module, target))
`,
          solution: String.raw`import sys


def resolve(module, target):
    dots = len(target) - len(target.lstrip("."))
    rest = target[dots:]
    package_parts = module.split(".")[:-1]
    if not package_parts:
        return "error: beyond top-level package"
    up = dots - 1
    if up > len(package_parts) - 1:
        return "error: beyond top-level package"
    base = package_parts[: len(package_parts) - up]
    return ".".join(base + ([rest] if rest else []))


for line in sys.stdin:
    module, target = line.split()
    print(resolve(module, target))
`,
          hints: [
            "The package of `shop.utils.text` is `shop.utils`; one dot refers to it, two dots to `shop`.",
            "Count leading dots with `len(t) - len(t.lstrip('.'))`; the remainder is what to append.",
          ],
          cases: [
            { stdin: "shop.pricing .models\nshop.utils.text ..models\nshop.cli ...x\n", expected: "shop.models\nshop.models\nerror: beyond top-level package\n" },
            { stdin: "shop.utils.text .\nshop.utils.text ..\nmain .x\n", expected: "shop.utils\nshop\nerror: beyond top-level package\n", hidden: true },
            { stdin: "a.b.c.d ...e.f\n", expected: "a.e.f\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "After `import shop`, what is `shop.models` if nothing has imported the submodule?",
          options: ["The submodule, loaded lazily", "`AttributeError` — submodules are bound only when imported", "`None`", "An empty module"],
          answer: 1,
          explanation: "Importing a package runs `__init__.py` only; `from .models import …` there would bind it.",
        },
        {
          prompt: "What does `python -m shop.cli` do that `python shop/cli.py` does not?",
          options: ["Runs faster", "Imports `shop` first and runs `cli` as `__main__` with its package set, so relative imports work", "Skips `__init__.py`", "Nothing"],
          answer: 1,
          explanation: "Running by path puts the file's directory on the path and leaves `__package__` empty.",
        },
        {
          prompt: "What is `__all__` for?",
          options: ["Listing all files in the package", "Naming the public names `import *` exports and documenting the API", "Preventing imports", "Speeding up imports"],
          answer: 1,
          explanation: "Tools and readers use it as the package's declared surface.",
        },
        {
          prompt: "Why prefer the `src/` layout?",
          options: ["It is required by pip", "Tests import the installed package rather than the working directory by accident", "It makes imports faster", "It avoids `__init__.py`"],
          answer: 1,
          explanation: "With the package under `src/`, `import shop` only works after `pip install -e .`, exactly as it will for users.",
        },
        {
          prompt: "How should a package read a data file it ships?",
          options: ["`open(\"data.json\")`", "`importlib.resources.files(\"pkg\") / \"data.json\"`", "`os.getcwd() + \"/data.json\"`", "`sys.argv[0]`"],
          answer: 1,
          explanation: "The working directory is wherever the user ran the program; package resources are located relative to the package.",
        },
      ],
    },
    {
      slug: "the-standard-library-map",
      file: "03-the-standard-library-map.md",
      exercises: [
        {
          title: "Import census",
          prompt: `Read Python import statements — \`import a.b as c\`, \`import x, y\`, \`from p.q import r\` — and classify each imported **top-level** module as \`stdlib\` (its first component is in \`sys.stdlib_module_names\`) or \`other\`. Print the distinct top-level names of each group, sorted, then how many statements there were.

**Input:** import statements, one per line.
**Output:** \`stdlib: <names>\` (or \`stdlib: none\`), \`other: <names>\` (or \`other: none\`), \`statements <n>\`.

\`\`\`text
import os.path as osp
from collections import Counter
import numpy as np, json
from shop.models import Product
\`\`\`
prints
\`\`\`text
stdlib: collections json os
other: numpy shop
statements 4
\`\`\``,
          starter: String.raw`import sys


def top_levels(statement):
    # TODO: return the list of top-level module names the statement imports
    return []


stdlib, other, count = set(), set(), 0
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    count += 1
    for name in top_levels(line):
        (stdlib if name in sys.stdlib_module_names else other).add(name)
print("stdlib:", " ".join(sorted(stdlib)) if stdlib else "none")
print("other:", " ".join(sorted(other)) if other else "none")
print(f"statements {count}")
`,
          solution: String.raw`import sys


def top_levels(statement):
    if statement.startswith("from "):
        module = statement.split()[1]
        return [module.split(".")[0]]
    body = statement[len("import "):]
    names = []
    for part in body.split(","):
        dotted = part.strip().split()[0]      # drop "as alias"
        names.append(dotted.split(".")[0])
    return names


stdlib, other, count = set(), set(), 0
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    count += 1
    for name in top_levels(line):
        (stdlib if name in sys.stdlib_module_names else other).add(name)
print("stdlib:", " ".join(sorted(stdlib)) if stdlib else "none")
print("other:", " ".join(sorted(other)) if other else "none")
print(f"statements {count}")
`,
          hints: [
            "`sys.stdlib_module_names` (3.10) is a frozenset of every standard-library top-level name.",
            "An `import` line may list several modules separated by commas, each with an optional `as`.",
          ],
          cases: [
            { stdin: "import os.path as osp\nfrom collections import Counter\nimport numpy as np, json\nfrom shop.models import Product\n", expected: "stdlib: collections json os\nother: numpy shop\nstatements 4\n" },
            { stdin: "import re\n", expected: "stdlib: re\nother: none\nstatements 1\n", hidden: true },
            { stdin: "from requests import get\nimport pandas\n", expected: "stdlib: none\nother: pandas requests\nstatements 2\n", hidden: true },
          ],
        },
        {
          title: "Explore a module",
          prompt: `Read a standard-library module name and a prefix. Import the module with \`importlib.import_module\`, list its public names (\`dir\`, excluding names starting with \`_\`) that start with the prefix, and print the callables sorted, then the non-callables sorted (\`(none)\` for an empty group).

**Input:** \`module prefix\`.
**Output:** \`callable: …\` then \`other: …\`.

\`\`\`text
math is
\`\`\`
prints
\`\`\`text
callable: isclose isfinite isinf isnan isqrt
other: (none)
\`\`\``,
          starter: String.raw`import importlib

module_name, prefix = input().split()
mod = importlib.import_module(module_name)
# TODO
`,
          solution: String.raw`import importlib

module_name, prefix = input().split()
mod = importlib.import_module(module_name)
names = [n for n in dir(mod) if not n.startswith("_") and n.startswith(prefix)]
funcs = sorted(n for n in names if callable(getattr(mod, n)))
others = sorted(n for n in names if not callable(getattr(mod, n)))
print("callable:", " ".join(funcs) if funcs else "(none)")
print("other:", " ".join(others) if others else "(none)")
`,
          hints: [
            "`dir(mod)` lists attribute names; `getattr(mod, name)` fetches each to test `callable`.",
            "Sort explicitly — `dir` is sorted, but filtering and regrouping should not rely on it.",
          ],
          cases: [
            { stdin: "math is\n", expected: "callable: isclose isfinite isinf isnan isqrt\nother: (none)\n" },
            { stdin: "math p\n", expected: "callable: perm pow prod\nother: pi\n", hidden: true },
            { stdin: "string asc\n", expected: "callable: (none)\nother: ascii_letters ascii_lowercase ascii_uppercase\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which module holds `Counter`, `deque` and `defaultdict`?",
          options: ["`itertools`", "`collections`", "`functools`", "`types`"],
          answer: 1,
          explanation: "`itertools` is iterator tools, `functools` function tools; the containers live in `collections`.",
        },
        {
          prompt: "Which function should time a piece of code?",
          options: ["`time.time()`", "`time.perf_counter()`", "`datetime.now()`", "`time.ctime()`"],
          answer: 1,
          explanation: "`perf_counter` is a high-resolution monotonic clock; wall-clock time can jump.",
        },
        {
          prompt: "Why must `pickle.load` never be used on data from outside your program?",
          options: ["It is slow", "Unpickling can execute arbitrary code", "It only works on lists", "It is deprecated"],
          answer: 1,
          explanation: "Pickle is a serialisation of Python objects, including callables; use JSON for untrusted data.",
        },
        {
          prompt: "Which module reads TOML in 3.11?",
          options: ["`toml`", "`tomllib`", "`configparser`", "`json`"],
          answer: 1,
          explanation: "`tomllib` is read-only and standard since 3.11; `configparser` is for INI files.",
        },
        {
          prompt: "What is the fastest way to check what a standard function does?",
          options: ["Read the C source", "`help(function)` in the REPL and a two-line experiment", "Search a forum", "Guess"],
          answer: 1,
          explanation: "The docstring shows the signature and behaviour; a small call confirms the edge case you care about.",
        },
      ],
    },
    {
      slug: "virtual-environments-and-packaging",
      file: "04-virtual-environments-and-packaging.md",
      exercises: [
        {
          title: "Requirement specifiers",
          prompt: `Parse requirement lines of the form \`name\`, \`name==1.2.0\`, \`name>=1.4,<2\` (operators \`==\`, \`!=\`, \`>=\`, \`<=\`, \`>\`, \`<\`; versions are dotted integers). Then read \`installed name version\` lines and report for each requirement whether it is \`missing\`, \`ok\` or \`conflict\`, comparing versions as tuples of integers.

**Input:** requirement lines, a line \`--\`, then installed lines.
**Output:** \`<name>: ok|conflict|missing\` per requirement, in input order.

\`\`\`text
requests>=2.31,<3
numpy==1.26.4
flask
--
installed requests 2.32.0
installed numpy 2.0.0
\`\`\`
prints
\`\`\`text
requests: ok
numpy: conflict
flask: missing
\`\`\``,
          starter: String.raw`import re
import sys

SPEC = re.compile(r"(==|!=|>=|<=|>|<)\s*([\d.]+)")


def version(text):
    return tuple(int(p) for p in text.split("."))


def parse_requirement(line):
    # TODO: return (name, [(op, version_tuple), ...])
    return line, []


def satisfies(installed, constraints):
    # TODO
    return True


lines = [l.strip() for l in sys.stdin if l.strip()]
split = lines.index("--")
requirements = [parse_requirement(l) for l in lines[:split]]
installed = {}
for l in lines[split + 1:]:
    _, name, ver = l.split()
    installed[name] = version(ver)
for name, constraints in requirements:
    if name not in installed:
        print(f"{name}: missing")
    else:
        print(f"{name}: {'ok' if satisfies(installed[name], constraints) else 'conflict'}")
`,
          solution: String.raw`import operator
import re
import sys

SPEC = re.compile(r"(==|!=|>=|<=|>|<)\s*([\d.]+)")
OPS = {"==": operator.eq, "!=": operator.ne, ">=": operator.ge, "<=": operator.le, ">": operator.gt, "<": operator.lt}


def version(text):
    return tuple(int(p) for p in text.split("."))


def parse_requirement(line):
    m = re.match(r"[A-Za-z0-9_.-]+", line)
    name = m.group()
    constraints = [(op, version(ver)) for op, ver in SPEC.findall(line[m.end():])]
    return name, constraints


def satisfies(installed, constraints):
    return all(OPS[op](installed, ver) for op, ver in constraints)


lines = [l.strip() for l in sys.stdin if l.strip()]
split = lines.index("--")
requirements = [parse_requirement(l) for l in lines[:split]]
installed = {}
for l in lines[split + 1:]:
    _, name, ver = l.split()
    installed[name] = version(ver)
for name, constraints in requirements:
    if name not in installed:
        print(f"{name}: missing")
    else:
        print(f"{name}: {'ok' if satisfies(installed[name], constraints) else 'conflict'}")
`,
          hints: [
            "Compare versions as tuples of ints: `(2, 32, 0) < (3,)` is `True`, and `(1, 10) > (1, 9)` unlike the strings.",
            "Map each operator string to its `operator` function; a requirement with no constraints is satisfied by any version.",
          ],
          cases: [
            { stdin: "requests>=2.31,<3\nnumpy==1.26.4\nflask\n--\ninstalled requests 2.32.0\ninstalled numpy 2.0.0\n", expected: "requests: ok\nnumpy: conflict\nflask: missing\n" },
            { stdin: "a>1.9\nb!=2.0\n--\ninstalled a 1.10\ninstalled b 2.0\n", expected: "a: ok\nb: conflict\n", hidden: true },
            { stdin: "x<=1.0\n--\n", expected: "x: missing\n", hidden: true },
          ],
        },
        {
          title: "Read a pyproject",
          prompt: `Read a \`pyproject.toml\` document from standard input with \`tomllib.loads\` and print: the project name and version, \`requires-python\` (or \`any\`), the dependencies sorted (or \`none\`), and each optional-dependency group as \`<group>: <sorted packages>\` in group-name order.

**Input:** TOML text.
**Output:** \`name <n> version <v>\`, \`python <spec>\`, \`deps <list>\`, then the groups.

\`\`\`text
[project]
name = "shop"
version = "1.2.0"
requires-python = ">=3.11"
dependencies = ["requests>=2.31", "click"]

[project.optional-dependencies]
dev = ["pytest", "mypy"]
\`\`\`
prints
\`\`\`text
name shop version 1.2.0
python >=3.11
deps click requests>=2.31
dev: mypy pytest
\`\`\``,
          starter: String.raw`import sys
import tomllib

doc = tomllib.loads(sys.stdin.read())
project = doc["project"]
# TODO
`,
          solution: String.raw`import sys
import tomllib

doc = tomllib.loads(sys.stdin.read())
project = doc["project"]
print(f"name {project['name']} version {project['version']}")
print(f"python {project.get('requires-python', 'any')}")
deps = sorted(project.get("dependencies", []))
print("deps", " ".join(deps) if deps else "none")
for group, packages in sorted(project.get("optional-dependencies", {}).items()):
    print(f"{group}: {' '.join(sorted(packages))}")
`,
          hints: [
            "`tomllib.loads` returns nested dicts and lists; `[project.optional-dependencies]` is a dict under `project`.",
            "Use `.get` with defaults for the optional tables and keys.",
          ],
          cases: [
            { stdin: "[project]\nname = \"shop\"\nversion = \"1.2.0\"\nrequires-python = \">=3.11\"\ndependencies = [\"requests>=2.31\", \"click\"]\n\n[project.optional-dependencies]\ndev = [\"pytest\", \"mypy\"]\n", expected: "name shop version 1.2.0\npython >=3.11\ndeps click requests>=2.31\ndev: mypy pytest\n" },
            { stdin: "[project]\nname = \"tiny\"\nversion = \"0.1\"\n", expected: "name tiny version 0.1\npython any\ndeps none\n", hidden: true },
            { stdin: "[project]\nname = \"x\"\nversion = \"2\"\ndependencies = []\n[project.optional-dependencies]\nb = [\"z\"]\na = [\"y\", \"x\"]\n", expected: "name x version 2\npython any\ndeps none\na: x y\nb: z\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does activating a venv actually do?",
          options: ["Copies the interpreter", "Puts the venv's `bin`/`Scripts` first on `PATH` so `python` and `pip` resolve to its copies", "Changes `sys.version`", "Installs packages"],
          answer: 1,
          explanation: "Running `.venv/bin/python` directly has the same effect without activation.",
        },
        {
          prompt: "What does `pip freeze` produce?",
          options: ["A list of direct dependencies with loose constraints", "Every installed package pinned with `==` — a reproducible lock", "The `pyproject.toml`", "A wheel"],
          answer: 1,
          explanation: "It captures the exact current state; direct dependencies with ranges belong in `pyproject.toml`.",
        },
        {
          prompt: "What does `pip install -e .` do?",
          options: ["Installs the latest release from PyPI", "Installs the current project as a link to its source, so edits are live", "Exports requirements", "Creates a venv"],
          answer: 1,
          explanation: "Editable installs are how a project's own package becomes importable during development.",
        },
        {
          prompt: "Which specifier means 'any 1.x from 1.4 on'?",
          options: ["`==1.4`", "`>=1.4,<2`", "`>1.4`", "`~=2.0`"],
          answer: 1,
          explanation: "A range bounded by the next major version follows semantic versioning; `~=1.4` is equivalent.",
        },
        {
          prompt: "Why is `sudo pip install` a bad idea?",
          options: ["It is slow", "It installs into the system interpreter that the OS depends on, risking breakage", "It does not work", "It skips dependencies"],
          answer: 1,
          explanation: "Per-project venvs isolate packages; `pipx` isolates command-line tools.",
        },
      ],
    },
    {
      slug: "scripts-and-cli",
      file: "05-scripts-and-cli.md",
      exercises: [
        {
          title: "argparse from lines",
          prompt: `Build an \`argparse\` parser with sub-commands: \`add name --qty N\` (\`qty\` defaults to 1, must be an int), \`remove name --force\` (a flag) and \`list\`. Each input line is a command line; split it with \`shlex.split\` and parse it with \`parse_args(argv)\`. Print the parsed namespace as \`command=add name=bolt qty=3\` (attributes in the order \`command\`, \`name\`, \`qty\`, \`force\` — only those present). A line the parser rejects prints \`usage error\` — construct the parser with \`exit_on_error=False\` and catch both \`argparse.ArgumentError\` and \`SystemExit\`.

**Input:** command lines.
**Output:** one line per input line.

\`\`\`text
add bolt --qty 3
remove nut --force
list
add
add nut --qty x
\`\`\`
prints
\`\`\`text
command=add name=bolt qty=3
command=remove name=nut force=True
command=list
usage error
usage error
\`\`\``,
          starter: String.raw`import argparse
import contextlib
import io
import shlex
import sys


def build_parser():
    p = argparse.ArgumentParser(prog="inv", exit_on_error=False)
    sub = p.add_subparsers(dest="command", required=True)
    # TODO: add / remove / list
    return p


parser = build_parser()
for line in sys.stdin:
    argv = shlex.split(line)
    try:
        with contextlib.redirect_stderr(io.StringIO()):
            args = parser.parse_args(argv)
    except (argparse.ArgumentError, SystemExit):
        print("usage error")
        continue
    # TODO: print the namespace
`,
          solution: String.raw`import argparse
import contextlib
import io
import shlex
import sys


def build_parser():
    p = argparse.ArgumentParser(prog="inv", exit_on_error=False)
    sub = p.add_subparsers(dest="command", required=True)
    add = sub.add_parser("add", exit_on_error=False)
    add.add_argument("name")
    add.add_argument("--qty", type=int, default=1)
    remove = sub.add_parser("remove", exit_on_error=False)
    remove.add_argument("name")
    remove.add_argument("--force", action="store_true")
    sub.add_parser("list", exit_on_error=False)
    return p


parser = build_parser()
for line in sys.stdin:
    argv = shlex.split(line)
    try:
        with contextlib.redirect_stderr(io.StringIO()):
            args = parser.parse_args(argv)
    except (argparse.ArgumentError, SystemExit):
        print("usage error")
        continue
    parts = [f"{k}={v}" for k in ("command", "name", "qty", "force") if (v := getattr(args, k, None)) is not None]
    print(" ".join(parts))
`,
          hints: [
            "Sub-parsers are separate parsers; give each its own arguments (and `exit_on_error=False`).",
            "`parse_args(argv)` with an explicit list never touches `sys.argv` — that is what makes the parser testable.",
          ],
          cases: [
            { stdin: "add bolt --qty 3\nremove nut --force\nlist\nadd\nadd nut --qty x\n", expected: "command=add name=bolt qty=3\ncommand=remove name=nut force=True\ncommand=list\nusage error\nusage error\n" },
            { stdin: "add screw\nremove a\nfly\n", expected: "command=add name=screw qty=1\ncommand=remove name=a force=False\nusage error\n", hidden: true },
            { stdin: "add \"two words\" --qty 2\n", expected: "command=add name=two words qty=2\n", hidden: true },
          ],
        },
        {
          title: "main returns the exit code",
          prompt: `Write \`main(argv) -> int\` around an \`argparse\` parser with one sub-command \`sum\` taking any number of tokens and a \`--strict\` flag: without \`--strict\`, non-integer tokens are skipped with a message to **stderr** and the sum is printed to stdout, returning \`0\`; with \`--strict\`, the first non-integer token prints \`error: <token> is not an integer\` to stderr and returns \`1\` without printing a sum. A usage error returns \`2\`. Each input line is an \`argv\`; call \`main(shlex.split(line))\` and print \`exit <code>\`.

**Input:** argv lines.
**Output:** the sums on stdout and an \`exit <code>\` line per argv.

\`\`\`text
sum 1 2 x 3
sum --strict 1 x
bogus
\`\`\`
prints
\`\`\`text
6
exit 0
exit 1
exit 2
\`\`\``,
          starter: String.raw`import argparse
import contextlib
import io
import shlex
import sys


def main(argv):
    # TODO: parse (exit_on_error=False; catch ArgumentError/SystemExit -> return 2), then compute
    return 0


for line in sys.stdin:
    code = main(shlex.split(line))
    print(f"exit {code}")
`,
          solution: String.raw`import argparse
import contextlib
import io
import shlex
import sys


def build_parser():
    p = argparse.ArgumentParser(prog="tool", exit_on_error=False)
    sub = p.add_subparsers(dest="command", required=True)
    s = sub.add_parser("sum", exit_on_error=False)
    s.add_argument("tokens", nargs="*")
    s.add_argument("--strict", action="store_true")
    return p


def main(argv):
    try:
        with contextlib.redirect_stderr(io.StringIO()):
            args = build_parser().parse_args(argv)
    except (argparse.ArgumentError, SystemExit):
        return 2
    total = 0
    for tok in args.tokens:
        try:
            total += int(tok)
        except ValueError:
            if args.strict:
                print(f"error: {tok} is not an integer", file=sys.stderr)
                return 1
            print(f"skipping {tok}", file=sys.stderr)
    print(total)
    return 0


for line in sys.stdin:
    code = main(shlex.split(line))
    print(f"exit {code}")
`,
          hints: [
            "Messages go to `sys.stderr`; only the sum goes to stdout, so the judge sees just the results and exit lines.",
            "Return the code rather than calling `sys.exit` inside `main`, so the loop can keep going.",
          ],
          cases: [
            { stdin: "sum 1 2 x 3\nsum --strict 1 x\nbogus\n", expected: "6\nexit 0\nexit 1\nexit 2\n" },
            { stdin: "sum\nsum --strict 4 5\n", expected: "0\nexit 0\n9\nexit 0\n", hidden: true },
            { stdin: "sum --flag 1\nsum -3 3\n", expected: "exit 2\n0\nexit 0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which stream should progress messages use?",
          options: ["stdout", "stderr — so piped results stay clean", "A file", "Either"],
          answer: 1,
          explanation: "Results on stdout, messages on stderr is the convention every shell pipeline relies on.",
        },
        {
          prompt: "What exit status does `argparse` use for a usage error?",
          options: ["0", "1", "2", "127"],
          answer: 2,
          explanation: "Two is the conventional 'bad usage' status; one is a general failure.",
        },
        {
          prompt: "What does `add_argument(\"-v\", action=\"count\", default=0)` give for `-vvv`?",
          options: ["`True`", "`3`", "`\"vvv\"`", "An error"],
          answer: 1,
          explanation: "`count` increments per occurrence — the verbosity idiom.",
        },
        {
          prompt: "Why should `main` take `argv` and return an int?",
          options: ["Python requires it", "So it can be called in tests with a list and its status checked, without `sys.argv` or `sys.exit`", "For speed", "To avoid `argparse`"],
          answer: 1,
          explanation: "The guard does `sys.exit(main())`; everything else is an ordinary, testable function.",
        },
        {
          prompt: "Where should a secret such as an API key come from?",
          options: ["A command-line option", "The environment (`os.environ.get`), never printed or committed", "A global constant in the source", "`input()`"],
          answer: 1,
          explanation: "Command-line arguments are visible in process lists and shell history.",
        },
      ],
    },
    {
      slug: "modules-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Import graph",
          prompt: `Read lines \`<module>: <imports…>\` (possibly none) and an entry module on the last line \`entry <name>\`. Compute the order in which module bodies **finish** executing when the entry is imported — a depth-first walk where each module's imports complete before it does, each module once — and print it. If the walk meets a module that is currently being imported (a cycle), print \`cycle: a -> b -> … -> a\` for the first cycle found, using the path from that module back to itself, and stop.

**Input:** lines, then \`entry <name>\`.
**Output:** \`order: <names>\` or the \`cycle:\` line.

\`\`\`text
a: b c
b: c
c:
entry a
\`\`\`
prints
\`\`\`text
order: c b a
\`\`\``,
          starter: String.raw`import sys

graph = {}
entry = None
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    if line.startswith("entry "):
        entry = line.split()[1]
    else:
        name, _, rest = line.partition(":")
        graph[name.strip()] = rest.split()

done = []
in_progress = []   # the current import stack


def visit(name):
    # TODO: return a cycle path list if one is found, else None
    return None


cycle = visit(entry)
if cycle:
    print("cycle:", " -> ".join(cycle))
else:
    print("order:", " ".join(done))
`,
          solution: String.raw`import sys

graph = {}
entry = None
for line in sys.stdin:
    line = line.strip()
    if not line:
        continue
    if line.startswith("entry "):
        entry = line.split()[1]
    else:
        name, _, rest = line.partition(":")
        graph[name.strip()] = rest.split()

done = []
in_progress = []   # the current import stack


def visit(name):
    if name in done:
        return None
    if name in in_progress:
        start = in_progress.index(name)
        return in_progress[start:] + [name]
    in_progress.append(name)
    for dep in graph.get(name, []):
        cycle = visit(dep)
        if cycle:
            return cycle
    in_progress.pop()
    done.append(name)
    return None


cycle = visit(entry)
if cycle:
    print("cycle:", " -> ".join(cycle))
else:
    print("order:", " ".join(done))
`,
          hints: [
            "Keep the import stack; meeting a module that is on it means a cycle, and the stack from it onward is the cycle path.",
            "A module is appended to `done` only after all its imports finished — that is the finish order.",
          ],
          cases: [
            { stdin: "a: b c\nb: c\nc:\nentry a\n", expected: "order: c b a\n" },
            { stdin: "a: b\nb: c\nc: a\nentry a\n", expected: "cycle: a -> b -> c -> a\n", hidden: true },
            { stdin: "m:\nentry m\n", expected: "order: m\n", hidden: true },
            { stdin: "x: y z\ny:\nz: y\nentry x\n", expected: "order: y z x\n", hidden: true },
          ],
        },
        {
          title: "Requirements check",
          prompt: `Requirements arrive as \`name<specifiers>\` lines and the installed set as \`name==version\` lines after a \`--\` line. Specifiers are comma-separated \`op version\` pairs with \`==\`, \`!=\`, \`>=\`, \`<=\`, \`>\`, \`<\`, or \`~=\` (compatible release: \`~=1.4\` means \`>=1.4,<2\`; \`~=1.4.2\` means \`>=1.4.2,<1.5\`). Print each requirement's status and finish with \`problems <n>\` counting the missing and conflicting ones.

**Input:** lines, \`--\`, lines.
**Output:** \`<name>: ok|conflict|missing\` per requirement, then \`problems <n>\`.

\`\`\`text
requests~=2.31
numpy>=1.26,<2
mypy
--
requests==2.32.1
numpy==2.0.0
\`\`\`
prints
\`\`\`text
requests: ok
numpy: conflict
mypy: missing
problems 2
\`\`\``,
          starter: String.raw`import operator
import re
import sys

SPEC = re.compile(r"(~=|==|!=|>=|<=|>|<)\s*([\d.]+)")
OPS = {"==": operator.eq, "!=": operator.ne, ">=": operator.ge, "<=": operator.le, ">": operator.gt, "<": operator.lt}


def version(text):
    return tuple(int(p) for p in text.split("."))


def expand(op, ver):
    # TODO: turn "~=" into two constraints; others pass through as [(op, version(ver))]
    return [(op, version(ver))]


def parse(line):
    m = re.match(r"[A-Za-z0-9_.-]+", line)
    constraints = []
    for op, ver in SPEC.findall(line[m.end():]):
        constraints.extend(expand(op, ver))
    return m.group(), constraints


lines = [l.strip() for l in sys.stdin if l.strip()]
split = lines.index("--")
installed = {}
for l in lines[split + 1:]:
    name, _, ver = l.partition("==")
    installed[name] = version(ver)
problems = 0
for l in lines[:split]:
    name, constraints = parse(l)
    # TODO
print(f"problems {problems}")
`,
          solution: String.raw`import operator
import re
import sys

SPEC = re.compile(r"(~=|==|!=|>=|<=|>|<)\s*([\d.]+)")
OPS = {"==": operator.eq, "!=": operator.ne, ">=": operator.ge, "<=": operator.le, ">": operator.gt, "<": operator.lt}


def version(text):
    return tuple(int(p) for p in text.split("."))


def expand(op, ver):
    if op != "~=":
        return [(op, version(ver))]
    v = version(ver)
    upper = v[:-1]
    upper = upper[:-1] + (upper[-1] + 1,)
    return [(">=", v), ("<", upper)]


def parse(line):
    m = re.match(r"[A-Za-z0-9_.-]+", line)
    constraints = []
    for op, ver in SPEC.findall(line[m.end():]):
        constraints.extend(expand(op, ver))
    return m.group(), constraints


lines = [l.strip() for l in sys.stdin if l.strip()]
split = lines.index("--")
installed = {}
for l in lines[split + 1:]:
    name, _, ver = l.partition("==")
    installed[name] = version(ver)
problems = 0
for l in lines[:split]:
    name, constraints = parse(l)
    if name not in installed:
        status = "missing"
    elif all(OPS[op](installed[name], v) for op, v in constraints):
        status = "ok"
    else:
        status = "conflict"
    if status != "ok":
        problems += 1
    print(f"{name}: {status}")
print(f"problems {problems}")
`,
          hints: [
            "`~=X.Y` drops the last component and bumps the one before it for the upper bound: `~=1.4` → `<2`, `~=1.4.2` → `<1.5`.",
            "Tuple comparison handles `(2, 32, 1) < (3,)` correctly because a shorter tuple that is a prefix compares smaller.",
          ],
          cases: [
            { stdin: "requests~=2.31\nnumpy>=1.26,<2\nmypy\n--\nrequests==2.32.1\nnumpy==2.0.0\n", expected: "requests: ok\nnumpy: conflict\nmypy: missing\nproblems 2\n" },
            { stdin: "a~=1.4.2\nb~=1.4.2\n--\na==1.4.9\nb==1.5.0\n", expected: "a: ok\nb: conflict\nproblems 1\n", hidden: true },
            { stdin: "z\n--\nz==0.0.1\n", expected: "z: ok\nproblems 0\n", hidden: true },
          ],
        },
        {
          title: "An inventory command",
          prompt: `Build a sub-command tool with \`argparse\` (\`exit_on_error=False\`): \`add name --qty N\` (default 1), \`remove name [--all]\` (removes one unit, or every unit with \`--all\`), \`show\` (prints \`name qty\` lines in name order, or \`empty\`). Each input line is a command line split with \`shlex.split\`; a usage error prints \`usage error\`; removing an unknown item prints \`unknown item\`. Keep the state across lines.

**Input:** command lines.
**Output:** one line per \`show\` row, plus the error lines.

\`\`\`text
add bolt --qty 3
add nut
remove bolt
remove screw
show
remove nut --all
show
\`\`\`
prints
\`\`\`text
unknown item
bolt 2
nut 1
bolt 2
\`\`\``,
          starter: String.raw`import argparse
import contextlib
import io
import shlex
import sys


def build_parser():
    p = argparse.ArgumentParser(prog="inv", exit_on_error=False)
    sub = p.add_subparsers(dest="command", required=True)
    # TODO
    return p


stock = {}
parser = build_parser()
for line in sys.stdin:
    try:
        with contextlib.redirect_stderr(io.StringIO()):
            args = parser.parse_args(shlex.split(line))
    except (argparse.ArgumentError, SystemExit):
        print("usage error")
        continue
    # TODO: dispatch on args.command
`,
          solution: String.raw`import argparse
import contextlib
import io
import shlex
import sys


def build_parser():
    p = argparse.ArgumentParser(prog="inv", exit_on_error=False)
    sub = p.add_subparsers(dest="command", required=True)
    add = sub.add_parser("add", exit_on_error=False)
    add.add_argument("name")
    add.add_argument("--qty", type=int, default=1)
    remove = sub.add_parser("remove", exit_on_error=False)
    remove.add_argument("name")
    remove.add_argument("--all", action="store_true")
    sub.add_parser("show", exit_on_error=False)
    return p


stock = {}
parser = build_parser()
for line in sys.stdin:
    try:
        with contextlib.redirect_stderr(io.StringIO()):
            args = parser.parse_args(shlex.split(line))
    except (argparse.ArgumentError, SystemExit):
        print("usage error")
        continue
    if args.command == "add":
        stock[args.name] = stock.get(args.name, 0) + args.qty
    elif args.command == "remove":
        if args.name not in stock:
            print("unknown item")
        elif args.all or stock[args.name] == 1:
            del stock[args.name]
        else:
            stock[args.name] -= 1
    elif args.command == "show":
        if stock:
            for name in sorted(stock):
                print(name, stock[name])
        else:
            print("empty")
`,
          hints: [
            "The parser is built once; the state dict lives outside the loop.",
            "`--all` is a `store_true` flag on the `remove` sub-parser only.",
          ],
          cases: [
            { stdin: "add bolt --qty 3\nadd nut\nremove bolt\nremove screw\nshow\nremove nut --all\nshow\n", expected: "unknown item\nbolt 2\nnut 1\nbolt 2\n" },
            { stdin: "show\nadd x --qty q\nadd x\nremove x\nshow\n", expected: "empty\nusage error\nempty\n", hidden: true },
            { stdin: "add a --qty 2\nremove a --all\nremove a\nshow\n", expected: "unknown item\nempty\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What happens on the second `import json` in a program?",
          options: ["The file is re-read", "`sys.modules[\"json\"]` is returned; nothing runs", "An error", "A reload"],
          answer: 1,
          explanation: "Modules are cached by name in `sys.modules`.",
        },
        {
          prompt: "Which import form keeps the origin of a name visible at every use?",
          options: ["`from m import x`", "`import m` and `m.x`", "`from m import *`", "`import m as _`"],
          answer: 1,
          explanation: "Qualified access documents where `x` came from and cannot collide with local names.",
        },
        {
          prompt: "What does `__init__.py` do?",
          options: ["Nothing; it is optional decoration", "Marks the directory as a package and runs when the package is imported — typically re-exporting the API", "Lists the submodules", "Runs the tests"],
          answer: 1,
          explanation: "It may be empty, but it is what makes the directory a regular package.",
        },
        {
          prompt: "`shop/utils/text.py` contains `from ..models import Product`. What does it import?",
          options: ["`shop.utils.models`", "`shop.models`", "`models` from the top level", "It is an error"],
          answer: 1,
          explanation: "Two dots go from the package `shop.utils` up to `shop`.",
        },
        {
          prompt: "Which statement about `sys.stdlib_module_names` is true?",
          options: ["It lists installed third-party packages", "It is a frozenset of standard-library top-level module names (3.10+)", "It is a list of imported modules", "It does not exist"],
          answer: 1,
          explanation: "`sys.modules` is what has been imported; `stdlib_module_names` is what ships with the interpreter.",
        },
        {
          prompt: "What is a wheel?",
          options: ["A source archive", "A built distribution (`.whl`, a zip) that installs by unpacking, with no build step", "A virtual environment", "A lock file"],
          answer: 1,
          explanation: "Nearly every package on PyPI ships wheels so `pip install` needs no compiler.",
        },
        {
          prompt: "Where do a project's dependencies and tool settings live today?",
          options: ["`setup.py`", "`pyproject.toml`", "`requirements.txt` only", "`Makefile`"],
          answer: 1,
          explanation: "PEP 621 metadata, optional groups, scripts, the build system and `[tool.*]` tables are all in one file.",
        },
        {
          prompt: "What does `nargs=\"*\"` mean in `add_argument`?",
          options: ["Exactly one value", "Zero or more values, collected into a list", "A flag", "A required value"],
          answer: 1,
          explanation: "`+` is one or more, `?` is optional single; `*` is any number.",
        },
        {
          prompt: "Which exit code should a script return when it succeeded?",
          options: ["1", "0", "2", "-1"],
          answer: 1,
          explanation: "Zero is success everywhere; non-zero values are failures that shells and CI act on.",
        },
        {
          prompt: "What does `parse_args()` do with an invalid argument by default?",
          options: ["Returns `None`", "Prints usage to stderr and exits with status 2", "Raises `ValueError`", "Ignores it"],
          answer: 1,
          explanation: "`exit_on_error=False` makes it raise `ArgumentError` instead, for programs that must keep running.",
        },
        {
          prompt: "Which is the right way for a tool to accept input from a pipe?",
          options: ["Require a file argument", "Read `sys.stdin` when no file is given", "Use `input()` with a prompt", "Read the clipboard"],
          answer: 1,
          explanation: "That convention (often with `-` meaning stdin) is what makes tools composable.",
        },
        {
          prompt: "Why must `.venv` not be committed?",
          options: ["It is too small", "It is a machine-specific build artefact, reproducible from the requirements", "Git cannot store it", "It contains secrets"],
          answer: 1,
          explanation: "Commit the requirements or lock file; recreate the environment anywhere from it.",
        },
      ],
    },
  ],
});
