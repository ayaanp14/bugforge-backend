---
title: Virtual environments and packaging — venv, pip and pyproject.toml
minutes: 13
---
Two projects on one machine need two different versions of the same library, and the interpreter's global `site-packages` can hold only one. The virtual environment solves that: a private directory with its own `python`, its own `pip` and its own packages, activated per project. Around it sits the packaging toolchain — `pip` to install, `requirements.txt` or `pyproject.toml` to declare what to install, and the build system that turns your package into something `pip` can install. This lesson covers creating and using a venv, `pip`'s commands and pinning, `pyproject.toml` as the one project file, editable installs, version specifiers, and the tools that automate it.

## Virtual environments

```text
$ python -m venv .venv                 # create: a directory with bin/ (Scripts\ on Windows), lib/, pyvenv.cfg
$ source .venv/bin/activate            # activate (bash/zsh);  .venv\Scripts\activate on Windows
(.venv) $ python -c "import sys; print(sys.prefix)"   # points inside .venv
(.venv) $ pip install requests
(.venv) $ deactivate
```

Activation only edits `PATH` so that `python` and `pip` resolve to the venv's copies; the same effect comes from running `.venv/bin/python` directly, which is what scripts and CI usually do. Each venv is tied to the interpreter that created it; delete and recreate it rather than trying to move it. `.venv` is never committed — it is a build artefact, reproducible from the requirements. The rule that follows: **never `pip install` into the system interpreter** (`sudo pip` is how operating systems get broken), and never trust `python` without knowing which one it is; `python -m pip` always matches the interpreter you ran.

## pip

```text
pip install requests                   # latest compatible
pip install "requests>=2.31,<3"        # a version constraint
pip install -r requirements.txt        # from a file
pip install -e .                       # this project, editable (see below)
pip uninstall requests
pip list                               # what is installed
pip show requests                      # version, location, dependencies
pip freeze > requirements.txt          # pin exactly what is installed now
```

`pip freeze` writes every installed package with `==` versions — a *lock*: anyone who installs from it gets identical versions. Distinguish two files: the *direct* dependencies you chose, with loose constraints (`requests>=2.31`), and the *frozen* full set for reproducible deployment. Small projects keep one `requirements.txt`; larger ones separate them, or use a tool that manages a lock file.

## Version specifiers

| Specifier | Meaning |
| --- | --- |
| `==1.4.2` | exactly |
| `>=1.4` | at least |
| `>=1.4,<2` | a range — the common form for a library dependency |
| `~=1.4` | compatible release: `>=1.4, ==1.*` |
| `!=1.5.0` | exclude one |

Semantic versioning — `MAJOR.MINOR.PATCH`, where a major bump may break compatibility — is a convention most packages follow, which is why `>=1.4,<2` is the usual way to say "any 1.x from 1.4 on".

## pyproject.toml

Since PEP 621 one file declares a project's metadata, dependencies and build system:

```toml
[project]
name = "shop"
version = "1.2.0"
description = "Inventory and pricing"
requires-python = ">=3.11"
dependencies = [
    "requests>=2.31,<3",
]

[project.optional-dependencies]
dev = ["pytest>=8", "mypy", "ruff"]

[project.scripts]
shop = "shop.cli:main"          # installs a `shop` command that calls shop.cli.main()

[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

[tool.ruff]
line-length = 100
```

`pip install .` builds and installs the package from it; `pip install -e .` installs it *editable* — a link to the source directory, so edits are live without reinstalling — which is how a project's own package is made importable during development (and why the `src/` layout works). `pip install ".[dev]"` adds the optional group. Tools read their settings from `[tool.*]` tables, so `pyproject.toml` replaces `setup.py`, `setup.cfg`, `requirements-dev.txt`, `.flake8` and the rest. `tomllib` (3.11) reads it from Python: `tomllib.load(open("pyproject.toml", "rb"))`.

## Building and publishing, in outline

`python -m build` produces a *source distribution* (`.tar.gz`) and a *wheel* (`.whl`, a zip of the built package) in `dist/`; `twine upload dist/*` publishes them to PyPI, from where `pip install shop` fetches them. A wheel installs by unpacking, with no build step, which is why nearly everything on PyPI ships one. Version numbers come from `pyproject.toml` (or a plugin that reads git tags); a package name must be unique on PyPI.

## The tools that automate it

`pip` + `venv` are always there and enough. `pipx` installs command-line tools (`black`, `httpie`) each in its own venv with the command on your path. `uv`, `poetry`, `pdm` and `hatch` manage the venv, the lock file and the build from `pyproject.toml` in one command and are what larger projects standardise on; `uv` in particular replaces `pip` and `venv` with a much faster implementation of the same operations. Whatever the tool, the artefacts are the same: a `pyproject.toml` you edit, a lock file you commit, a `.venv` you do not.

## Pitfalls

- Installing into the system Python, or into the wrong venv because `pip` and `python` disagree — use `python -m pip`.
- Committing `.venv`.
- No pins at all in deployment, so a fresh install pulls a breaking release.
- Pinning `==` in a *library's* dependencies, so it cannot coexist with anything else.
- Running tests against the working-directory package instead of the installed one; `pip install -e .` and the `src/` layout.
- Naming a project after an existing PyPI package.

## Key takeaways

- One venv per project: `python -m venv .venv`, activate or call its `python` directly; never install into the system interpreter.
- `pip install/uninstall/list/show`; `pip freeze` pins the full set; `-r` installs from a file; `-e .` installs your own package editable.
- `>=x,<y` for library dependencies; `==` in a lock file for deployment.
- `pyproject.toml` holds metadata, dependencies, optional groups, scripts, build system and tool settings.
- `build` and `twine` make and publish wheels; `pipx`, `uv`, `poetry` automate the workflow around the same files.
