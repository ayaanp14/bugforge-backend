---
title: Running Python — the REPL, scripts, modules and the judge
minutes: 12
---
There are four ways to hand code to the interpreter, and knowing which one you are in explains a whole class of "it works here but not there" confusions: the REPL, a script file, a module run with `-m`, and a one-liner with `-c`. This lesson walks through each, fixes the `if __name__ == "__main__":` idiom that every serious script uses, explains exit codes, and describes exactly how the study judge runs the programs you write in this track.

## The REPL

Type `python` (or `python3` on systems where `python` is still Python 2) with no arguments and you get the read–eval–print loop:

```text
$ python
Python 3.11.13 (main) [GCC 13.3.0] on linux
>>> 2 ** 10
1024
>>> name = "Ada"
>>> f"Hello, {name}"
'Hello, Ada'
>>> _
'Hello, Ada'
```

The REPL evaluates each line and prints the value of an expression automatically, using `repr` — which is why the string comes back with quotes. `_` holds the last printed value. Statements (`name = "Ada"`) print nothing. The REPL is where you check what a method does or what an expression is before committing it to a file; `help(str.split)` and `dir(str)` answer most questions faster than a search. Leave with `exit()` or Ctrl-D.

## Scripts

A script is a file run top to bottom:

```text
$ python greet.py
```

```python
# greet.py
name = "Ada"
print(f"Hello, {name}")
```

Nothing is printed unless you `print` it — the REPL's automatic echo is a REPL feature. The interpreter compiles the whole file first (a syntax error on any line stops everything), then executes statements in order. A `def` or `class` statement *defines* a function or class when it is reached; the body runs only when called. This is why a script that calls a function before its `def` fails with `NameError`: at the time of the call, the name has not been bound yet.

## Modules and `-m`

Every Python file is a *module*; importing it runs its top-level code once and binds its names. `python -m package.module` runs a module *as a script* by its import name rather than its file path, which is how the standard library's tools are invoked:

```text
$ python -m json.tool data.json      # pretty-print JSON
$ python -m http.server 8000         # serve the current directory
$ python -m venv .venv               # create a virtual environment
$ python -m pip install requests     # pip for *this* interpreter
```

The `-m` form finds the module on the import path and sets things up as if it were the main script, which matters for packages with relative imports (Module 12). `python -c "print(2 ** 64)"` runs a one-liner; `python -i script.py` runs the script and then drops into the REPL with its names still defined — the quickest way to poke at a program's state.

## `__name__` and the main guard

When a file runs as a script, the interpreter sets the module's `__name__` to the string `"__main__"`. When the same file is imported, `__name__` is the module's name (`"greet"`). The idiom that keeps a file usable both ways:

```python
def total(nums):
    return sum(nums)

def main():
    nums = list(map(int, input().split()))
    print(total(nums))

if __name__ == "__main__":
    main()
```

Run as a script, `main()` executes. Imported by a test file that wants `total`, it does not — no input is read, nothing is printed. Two habits come with the idiom: put the program's work in a `main()` function rather than at top level, so that the names it creates are local and the file has one obvious entry point; and keep the guard at the bottom, after every definition it needs.

## Exit codes

A process ends with an integer status: `0` means success, anything else means failure, and shells, CI systems and the study judge read it. A Python program that reaches the end of the file exits `0`. `sys.exit(2)` exits with `2`; `sys.exit("message")` prints the message to stderr and exits `1`; an uncaught exception prints a traceback to stderr and exits `1`.

```python
import sys

if len(sys.argv) < 2:
    print("usage: tool.py <file>", file=sys.stderr)
    sys.exit(2)
```

Errors go to standard error, not standard output, so that a program whose output is piped somewhere does not corrupt it with messages.

## How the judge runs your program

Every exercise in this track is a whole program. The judge writes your source to `Main.py`, runs it once per test case with that case's input on **standard input**, captures **standard output**, and compares it with the expected output after ignoring trailing spaces on each line and trailing blank lines. Three consequences:

1. **Standard error is ignored** for the comparison — but a non-zero exit code is a *runtime error* verdict, so an uncaught exception fails the case even if the right output was printed first, and `sys.exit(1)` fails it too.
2. **Read with `input()` or `sys.stdin`, never with a prompt.** `input("Enter n: ")` writes `Enter n: ` to standard output, which becomes part of your answer and fails the comparison. Bare `input()` is the rule.
3. **There is a time limit** of about a second per case. Every exercise here is designed to run in milliseconds; a program that takes seconds has the wrong algorithm.

The interpreter is CPython 3.11 on Linux. Features newer than 3.11 do not exist there, and the lesson text marks them.

## Useful flags

| Flag | Effect |
| --- | --- |
| `-i` | Enter the REPL after the script finishes (or fails) |
| `-c "code"` | Run the string as a program |
| `-m mod` | Run a module as a script |
| `-X dev` | Development mode: extra warnings, `ResourceWarning` for unclosed files |
| `-O` | Strip `assert` statements (Module 10 explains why that matters) |
| `-u` | Unbuffered stdout, so prints appear immediately when piped |
| `-W error` | Turn warnings into exceptions |
| `--version` | Print the version and exit |

## Pitfalls

- Expecting a script to echo expression values like the REPL does. Only `print` prints in a script.
- Calling a function above its `def`. Definitions are executed in order; the call must come after.
- Putting work at module top level in a file you also import. The main guard exists for this.
- Using `input("prompt")` in a judged program. The prompt is output.
- `python` pointing at a different interpreter than `pip`. `python -m pip` always matches.

## Key takeaways

- The REPL echoes expression values; scripts print only what you `print`.
- `python -m module` runs a module as a script by its import name; `-c` runs a string; `-i` keeps the REPL open afterwards.
- `__name__ == "__main__"` is true only when the file runs as the script; keep the work in `main()` under that guard.
- Exit `0` is success; an uncaught exception or `sys.exit(non-zero)` is failure — and a runtime error on the judge.
- Judged programs read from stdin with bare `input()`/`sys.stdin`, print to stdout, and finish within a second.
