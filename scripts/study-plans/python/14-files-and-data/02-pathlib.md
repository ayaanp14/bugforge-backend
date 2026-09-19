---
title: pathlib — paths as objects
minutes: 13
---
A path is not a string. It has a directory part, a name, a stem and a suffix; it can be joined, made absolute, tested for existence, listed, created and removed; and the separator differs between operating systems. `pathlib.Path` (3.4) models all of that as an object with methods, replacing the string juggling of `os.path` with `/` for joining and readable names for everything else. This lesson covers constructing and joining paths, the parts, the queries, reading and writing through a path, listing and searching a tree, creating and deleting, and the pure-path classes that manipulate paths without touching the file system.

## Constructing and joining

```python
from pathlib import Path

p = Path("data") / "reports" / "q1.csv"       # / joins, on every platform
p                                             # PosixPath('data/reports/q1.csv') (WindowsPath on Windows)
str(p)                                        # 'data/reports/q1.csv' — for APIs that want a string
Path.cwd(), Path.home()                       # the working directory, the home directory
Path(__file__).parent                         # the directory this script lives in
p.resolve()                                   # absolute, symlinks resolved
Path("a/b/../c")                              # not simplified; resolve() does that
```

`Path("dir") / "file"` is the idiom; the operator takes strings or paths on the right. Paths are immutable and hashable, so they work as dict keys and set members. Nearly every function that takes a filename (`open`, `os.remove`, `shutil.copy`, `json.load` via `open`) accepts a `Path`.

## The parts

```python
p = Path("/home/ada/data/report.tar.gz")
p.name          # 'report.tar.gz'
p.stem          # 'report.tar'
p.suffix        # '.gz'
p.suffixes      # ['.tar', '.gz']
p.parent        # PosixPath('/home/ada/data')
p.parents[1]    # PosixPath('/home/ada')
p.parts         # ('/', 'home', 'ada', 'data', 'report.tar.gz')
p.anchor        # '/'
p.with_suffix(".zip")        # PosixPath('/home/ada/data/report.tar.zip') — replaces the LAST suffix
p.with_name("summary.txt")
p.with_stem("report2")       # 3.9
p.is_absolute()
p.relative_to("/home/ada")   # PosixPath('data/report.tar.gz'); ValueError if not under it
```

`stem` and `suffix` split at the last dot, which is right for `report.csv` and surprising for `report.tar.gz`; `suffixes` has them all.

## Queries

```python
p.exists(), p.is_file(), p.is_dir(), p.is_symlink()
p.stat().st_size                 # bytes
p.stat().st_mtime                # modification time (a timestamp)
p.samefile(other)
```

These touch the file system; the ones above did not. As always, a check followed by an action has a window; prefer trying the action and catching `OSError` when the outcome matters.

## Reading and writing through a path

```python
text = p.read_text(encoding="utf-8")          # the whole file
p.write_text("hello\n", encoding="utf-8")     # creates or truncates
data = p.read_bytes(); p.write_bytes(b"...")
with p.open(encoding="utf-8") as f:           # the same as open(p, ...)
    for line in f:
        ...
```

`read_text`/`write_text` are the two-liners for small files; `open` remains the tool for streaming. State the encoding here too.

## Listing and searching

```python
for child in sorted(Path("data").iterdir()):     # direct children, files and directories — sort for a defined order
    print(child.name)
list(Path("data").glob("*.csv"))                  # matching names in one directory
list(Path("data").rglob("*.csv"))                 # recursively, every depth
list(Path("data").glob("**/*.csv"))               # the same as rglob
[p for p in Path("src").rglob("*.py") if "test" not in p.parts]
```

`iterdir`, `glob` and `rglob` yield in *file-system order*, which is arbitrary — sort before printing or relying on it. Patterns are shell-style (`*`, `?`, `[abc]`), and `rglob` walks directories, which can be slow on large trees; `os.walk` is the lower-level alternative that yields `(dirpath, dirnames, filenames)` and lets you prune `dirnames` in place.

## Creating, moving, deleting

```python
Path("out/logs").mkdir(parents=True, exist_ok=True)   # like mkdir -p
p.touch()                                              # create empty or update mtime
p.rename("new_name.txt")                               # or replace() to overwrite an existing target
p.unlink(missing_ok=True)                              # delete a file (3.8 for missing_ok)
Path("empty_dir").rmdir()                              # only if empty
import shutil
shutil.rmtree("tree")                                  # delete recursively — no undo
shutil.copy(src, dst); shutil.move(src, dst)
```

`mkdir(parents=True, exist_ok=True)` is the form that never raises for an existing directory; `rmtree` is the one call to think twice about.

## Pure paths

`PurePosixPath` and `PureWindowsPath` do the parsing, joining and parts without ever touching a disk — for manipulating paths *for* another system, or in tests that must not depend on the file system:

```python
from pathlib import PurePosixPath, PureWindowsPath
PurePosixPath("/srv/app") / "logs" / "x.log"          # PurePosixPath('/srv/app/logs/x.log')
PureWindowsPath(r"C:\Users\ada").parts                 # ('C:\\', 'Users', 'ada')
```

## os.path, for reading old code

`os.path.join(a, b)`, `os.path.basename`, `dirname`, `splitext`, `exists`, `abspath` are the string-based ancestors; each has a `Path` equivalent (`/`, `.name`, `.parent`, `.stem`/`.suffix`, `.exists()`, `.resolve()`). New code uses `pathlib`; `os.path` still appears everywhere and reads easily once the mapping is known.

## A worked example: renaming by pattern

```python
for path in sorted(Path("photos").glob("IMG_*.jpg")):
    number = path.stem.removeprefix("IMG_")
    target = path.with_name(f"holiday_{int(number):04d}{path.suffix}")
    if not target.exists():
        path.rename(target)
```

Every step is a path operation: `glob` finds the candidates, `stem` and `suffix` take the name apart, `with_name` builds the new one beside the old, `exists` guards against clobbering, `rename` moves. No string slicing, no separators, and the same code runs on every platform.

## Pitfalls

- Building paths with `+` and hard-coded slashes.
- `p.suffix` on a double extension.
- Relying on the order of `iterdir`/`glob` — sort.
- `mkdir` without `parents=True, exist_ok=True` in a setup step that may run twice.
- `rmtree` on a path built from user input without checking what it resolves to.
- Passing a `Path` to a library that insists on `str` — `str(p)` or `os.fspath(p)`.

## Key takeaways

- `Path(...) / "part"` joins; `.name`, `.stem`, `.suffix`, `.parent`, `.parts`, `.with_suffix` decompose and rebuild.
- `.exists()`, `.is_file()`, `.stat()` query; `.read_text`/`.write_text` (with an encoding) and `.open()` do I/O.
- `iterdir`, `glob`, `rglob` list — sort the results; `mkdir(parents=True, exist_ok=True)`, `unlink`, `rename`, `shutil.rmtree` change the tree.
- Pure paths manipulate without touching the disk.
- Paths are immutable, hashable and accepted wherever a filename is.
