---
title: Modules and imports — files, namespaces and sys.modules
minutes: 14
---
A module is a file; importing it runs the file once and gives you an object whose attributes are the file's top-level names. That sentence covers most of what people find mysterious about imports — why a module's top-level code runs on first import and never again, why two `import`s of the same module give the same object, why `from x import y` copies a *binding* rather than linking to a variable, and why circular imports fail the way they do. This lesson covers the import forms, what `import` does step by step, the module cache, `__name__`, the import path, and the conventions for ordering and style.

## The forms

```python
import math                          # binds the name math to the module object
import numpy as np                   # an alias
from math import sqrt, pi            # binds sqrt and pi directly
from math import sqrt as root        # aliased
from os.path import join             # a name from a submodule
from math import *                   # every public name — avoid outside the REPL
```

`import math` gives one name and you write `math.sqrt`; `from math import sqrt` gives the function itself. The first keeps the origin visible at every use and cannot collide; the second is shorter. Convention: `import module` for modules you use many names from or whose names are generic (`os`, `json`, `re`), `from module import name` for a few specific names, and the alias forms only for the community-standard ones (`np`, `pd`) or to dodge a clash.

## What import does

`import x` performs, in order:

1. If `x` is already in `sys.modules` (the cache), bind the name to that object and stop.
2. Otherwise find the file: the current script's directory, then each entry of `sys.path` (`PYTHONPATH`, the standard library, `site-packages`).
3. Create an empty module object and put it in `sys.modules` *before* running the code (this is what makes circular imports partially work).
4. Execute the file top to bottom in the module's own namespace: every `def`, `class` and assignment binds a name on the module.
5. Bind `x` in the importing namespace.

So top-level code runs **once per process**, at the first import, wherever that happens. A module that prints or opens a file at top level does so at import time — one reason work belongs in functions and under `if __name__ == "__main__":`. Importing the same module again anywhere is a dictionary lookup.

## from-import copies a binding

```python
# config.py
DEBUG = False
def enable():
    global DEBUG
    DEBUG = True

# main.py
from config import DEBUG, enable
enable()
print(DEBUG)          # False — main's DEBUG still points at the old object

import config
config.enable()
print(config.DEBUG)   # True — reading through the module sees the rebinding
```

`from config import DEBUG` binds `main.DEBUG` to whatever object `config.DEBUG` was at import time. Rebinding `config.DEBUG` later does not touch `main.DEBUG`. Mutable objects are shared (a list imported by name reflects appends), rebinding is not. Access module-level state that changes through the module.

## __name__ and the main guard

Each module has `__name__`: its import name, or `"__main__"` for the script being run. The guard `if __name__ == "__main__":` (Module 1) is what lets one file be imported for its functions and run for its behaviour. `python -m package.module` runs a module as `__main__` by import name, which is what makes relative imports (next lesson) work in a script.

## The module object

```python
import math
type(math)                   # <class 'module'>
math.__name__                # 'math'
math.__file__                # the path (built-in modules like sys have none)
dir(math)                    # every attribute
math.__dict__                # the namespace as a dict
vars(math) is math.__dict__  # True
```

A module is a plain object: attributes can be read with `getattr`, added by assignment (a bad habit outside tests), and the namespace inspected. `importlib.import_module("pkg.mod")` imports by a string name — for plugins and dynamic loading; `importlib.reload(mod)` re-executes a module in place, which is a REPL convenience and not something a program should rely on.

## Circular imports

`a.py` imports `b`, and `b.py` imports `a`. Importing `a` puts a half-empty `a` in `sys.modules`, starts running `a`, hits `import b`, runs `b` — which finds `a` in the cache and gets the half-initialised object. If `b` only uses `a`'s names inside functions called later, it works; if `b` does `from a import something` at top level before `a` has defined it, `ImportError: cannot import name`. The fixes, in order of preference: move the shared thing into a third module both import; import inside the function that needs it; import the module (`import a`) and access `a.something` lazily. A cycle is usually a sign that two modules are one module or that a dependency points the wrong way.

## Style

- Imports at the top of the file, one per line, in three groups separated by blank lines: standard library, third-party, your own — each alphabetical. `isort` and `ruff` do this automatically (Module 15).
- No `import *` in modules: it hides where names come from and can shadow silently.
- No import inside a function unless breaking a cycle or deferring an expensive optional dependency.
- Names of modules are `lowercase`, short, without hyphens (a hyphen cannot be imported).
- Never name your file after a standard module (`random.py`, `test.py`, `json.py`): the script's directory comes first on the path, and `import random` will find *yours*.

## Pitfalls

- Top-level side effects that run at import.
- Expecting `from m import x` to track later rebindings of `m.x`.
- A file named like a standard module shadowing it.
- Circular top-level `from` imports.
- `import *` hiding a name collision.
- Relying on `reload` in a running program.

## Key takeaways

- A module is a file; `import` finds it, runs it once, caches it in `sys.modules` and binds a name; later imports are lookups.
- `import m` keeps names qualified; `from m import x` copies the binding at import time — rebinding through the module does not reach it.
- `__name__` is the import name or `"__main__"`; the guard separates library use from script use.
- Circular imports fail when a `from` import needs a name not yet defined; restructure, or import lazily.
- Imports at the top in three sorted groups; never `import *`; never shadow a standard module's name.
