---
title: Checkpoint — Modules, packages and imports
minutes: 22
---
This checkpoint covers the whole module: what `import` does and the `sys.modules` cache, `from`-imports copying bindings, `__name__` and circular imports, packages with `__init__.py`, relative imports and `python -m`, the standard-library map, virtual environments with `pip` and `pyproject.toml`, and command-line scripts with `argparse`, the three streams and exit codes.

**How it works.** Twelve questions and three programs. You need 70% on the questions and every program accepted to clear the module. You can retake it as often as you like; your best score counts.

**Before you start**, make sure you can answer these from memory:

- How many times does a module's top-level code run in one process, and why?
- After `from config import DEBUG`, what does rebinding `config.DEBUG` do to your `DEBUG`?
- What does `import shop` do about `shop.models`?
- Why does `python shop/cli.py` break relative imports, and what is the fix?
- What is the difference between `requests>=2.31,<3` in `pyproject.toml` and `requests==2.31.0` in a lock file?
- Which stream do error messages go to, and what exit code does argparse use for bad usage?
- Where does a data file inside a package get opened from?

The three programs are a dependency resolver that orders modules by their imports and detects cycles, a requirements parser that checks installed versions against specifiers, and a command-line tool whose arguments are parsed by `argparse` from lines of input.
