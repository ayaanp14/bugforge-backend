---
title: Packages — directories, __init__.py, relative imports and project layout
minutes: 14
---
A package is a directory of modules with an `__init__.py`, importable by its directory name with dots for the levels: `import app.models.user`. Packages are how a project grows past one file without the names colliding, and their rules are few: what `__init__.py` does, how `from . import x` resolves, why `python -m` matters for scripts inside a package, and how to lay a project out so that tests, entry points and the importable code all find each other. This lesson covers those rules, `__all__`, `__main__.py`, namespace packages, and the standard `src/` layout.

## A package

```text
shop/
    __init__.py
    models.py
    pricing.py
    cli.py
    utils/
        __init__.py
        text.py
```

```python
import shop.models                      # binds shop; shop.models is an attribute
from shop.models import Product         # a name from a submodule
from shop.utils import text             # a submodule from a subpackage
import shop.utils.text as textutils
```

Importing `shop.models` first imports `shop` (running `shop/__init__.py`), then `shop/models.py`, and binds `models` as an attribute on the `shop` module. `import shop` alone does **not** import its submodules — `shop.models` is an `AttributeError` until something imports it — unless `__init__.py` does so.

## __init__.py

The file runs when the package is imported. It may be empty (most are), or it may define the package's public interface by importing from submodules:

```python
# shop/__init__.py
from .models import Product, Order
from .pricing import price_of

__all__ = ["Product", "Order", "price_of"]
__version__ = "1.2.0"
```

Now `from shop import Product` works without callers knowing which file holds it, and the internal layout can change without breaking them. Keep `__init__.py` to re-exports and metadata: logic there runs on every import of any submodule and is hard to test. `__all__` lists the names `from shop import *` exports and documents the public surface; tools read it too.

## Relative imports

Inside a package, modules refer to their siblings with leading dots:

```python
# shop/pricing.py
from .models import Product             # sibling module
from .utils.text import slug            # a subpackage's module
from . import models                    # the sibling module object
from ..other import thing               # the parent package's sibling (two dots)
```

Relative imports are resolved against the module's `__package__`, so they work wherever the package is installed or placed on the path, and they say "this is internal" at a glance. Absolute imports (`from shop.models import Product`) are equally correct and preferred by some style guides for their clarity; pick one per project. Two limits: a relative import cannot go above the top-level package, and it does not work in a file run *as a script by path* — which is the next point.

## python -m and the script problem

Running `python shop/cli.py` sets `__name__` to `"__main__"` and `__package__` to nothing, puts `shop/` (not its parent) on the path, and every `from .models import …` fails with `ImportError: attempted relative import with no known parent package`. The fix is to run modules by import name from the project root:

```text
$ python -m shop.cli
```

`-m` imports `shop`, then runs `shop.cli` as `__main__` *with its package set*, so relative and absolute imports both work. A package can also define `shop/__main__.py`, which is what `python -m shop` runs — the conventional entry point for a package that is a command.

## Project layout

```text
myproject/
    pyproject.toml
    README.md
    src/
        shop/
            __init__.py
            models.py
            …
    tests/
        test_models.py
        test_pricing.py
```

The `src/` layout keeps the importable package out of the project root, so that tests import the *installed* package (`pip install -e .`, next lesson) rather than the working directory by accident — a class of "works on my machine" bugs disappears. Tests live outside the package, import it absolutely (`from shop.models import Product`), and are run with `python -m pytest` or `python -m unittest` from the root. The flat alternative (package directory beside `tests/` at the root) works for small projects; the `src/` layout scales.

## Namespace packages

A directory *without* `__init__.py` is still importable (since 3.3) as a *namespace package* — several such directories with the same name on the path merge into one package. This is for large organisations splitting one namespace across distributions (`company.tool_a`, `company.tool_b`). For your own code, always add `__init__.py`: it marks the directory as deliberate, makes the package findable by more tools, and avoids the merging behaviour when a stray same-named directory exists.

## Finding out what is where

```python
import shop
shop.__path__                # the directories that make up the package
shop.__file__                # its __init__.py
shop.models.__name__         # 'shop.models'
import importlib.resources   # read data files shipped inside a package
```

`importlib.resources.files("shop") / "data.json"` is the right way to open a file that lives *inside* a package, wherever it was installed — never a path relative to the current working directory, which is wherever the user happened to run the program.

## Pitfalls

- `import pkg` and expecting `pkg.sub` to exist without importing it.
- Logic in `__init__.py` that runs on every import.
- Running a module inside a package by path; use `-m`.
- Relative imports in the top-level script.
- Data files opened relative to the working directory.
- Missing `__init__.py` making a package a namespace package by accident.

## Key takeaways

- A package is a directory with `__init__.py`; `import a.b.c` imports each level and binds submodules as attributes only once imported.
- `__init__.py` re-exports the public API and sets `__all__`; keep logic out of it.
- `from .x import y` is a relative import inside a package; run package modules with `python -m pkg.mod`, never by path; `__main__.py` is `python -m pkg`.
- Use the `src/` layout with tests outside the package importing it absolutely.
- Package data is read with `importlib.resources`, not a working-directory path.
