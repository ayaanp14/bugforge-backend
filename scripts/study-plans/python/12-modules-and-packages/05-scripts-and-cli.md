---
title: Scripts and the command line — argv, argparse, exit codes and streams
minutes: 14
---
A script is a program meant to be run from a shell, and a good one follows the conventions every other command-line tool follows: arguments and options parsed properly, `--help` that explains them, output on stdout and messages on stderr, an exit status that says whether it worked, and a structure that keeps the logic testable apart from the parsing. This lesson covers `sys.argv`, `argparse` with its argument kinds and sub-commands, the three streams and why errors go to stderr, exit codes, reading from a file or stdin interchangeably, environment variables, and the `main(argv)` shape that makes a script importable and testable.

## sys.argv

```python
import sys
print(sys.argv)         # ['tool.py', 'input.txt', '--verbose']
```

`sys.argv[0]` is the script path; the rest are the arguments as strings, split by the shell. For one or two positional arguments, reading `sys.argv[1:]` directly is fine. Anything with options, defaults or help wants `argparse`.

## argparse

```python
import argparse

def build_parser():
    p = argparse.ArgumentParser(prog="wc", description="Count lines, words and characters.")
    p.add_argument("files", nargs="*", help="input files (default: stdin)")
    p.add_argument("-l", "--lines", action="store_true", help="count lines only")
    p.add_argument("-n", "--top", type=int, default=10, metavar="N", help="show the top N words")
    p.add_argument("--format", choices=["text", "json"], default="text")
    p.add_argument("-v", "--verbose", action="count", default=0)
    return p

args = build_parser().parse_args()
args.files, args.lines, args.top, args.format, args.verbose
```

Positional arguments are named without dashes; options with `-x`/`--long`. `type=int` converts and validates (a bad value gives a clean error and exit status 2); `choices` restricts; `default` fills; `action="store_true"` makes a flag; `action="count"` makes `-vvv` a number; `nargs="*"`/`"+"`/`"?"` take several or optional values. `--help` is generated from the `help` strings, and a wrong invocation prints usage to stderr and exits with `2`. `parse_args(argv)` takes an explicit list, which is how a parser is tested without a real command line.

Sub-commands (`git commit`, `git push`) are `subparsers`:

```python
sub = p.add_subparsers(dest="command", required=True)
add = sub.add_parser("add", help="add an item")
add.add_argument("name")
add.add_argument("--qty", type=int, default=1)
sub.add_parser("list", help="list items")
```

`args.command` says which ran; a `set_defaults(func=handler)` on each sub-parser lets `main` call `args.func(args)`.

## The three streams

`stdin` is for data in, `stdout` for *results*, `stderr` for *messages* — progress, warnings, errors. The separation is what lets `tool input.txt > out.json` capture results while errors still reach the terminal, and lets `tool a | tool b` pipe results without messages corrupting them.

```python
print(result)                               # stdout
print("warning: skipped 3 lines", file=sys.stderr)
sys.exit("error: no input files")           # prints to stderr and exits 1
```

A program that reads either files or stdin uses `sys.stdin` when no file is named — the `-` convention — so it works in a pipeline:

```python
import fileinput
for line in fileinput.input(args.files or ("-",)):     # each named file in turn, or stdin
    ...
```

## Exit codes

`0` success; `1` a general failure; `2` bad usage (argparse's choice); other small numbers by convention of the program. Shells, `make`, CI and callers test it: `tool && next` runs `next` only on success. `sys.exit(n)` sets it; an uncaught exception gives `1` plus a traceback, which is fine for bugs and wrong for expected failures — catch those at the top level and exit with a message:

```python
def main(argv=None):
    args = build_parser().parse_args(argv)
    try:
        run(args)
    except FileNotFoundError as e:
        print(f"error: {e.filename} not found", file=sys.stderr)
        return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())
```

`main` returns the code and the guard passes it to `sys.exit`, so the function can be called in a test with a list of arguments and its return value checked.

## Environment variables

`os.environ["HOME"]` reads one (`KeyError` if unset); `os.environ.get("LOG_LEVEL", "INFO")` with a default; `os.getenv` is the same. Configuration that should not be on the command line — credentials, paths that differ per machine — comes from the environment, with the command line overriding it and a default under both. Never print a secret from the environment; never commit a `.env` file.

## Structure

- `build_parser()` builds the parser; `main(argv=None)` parses and dispatches; `run(args)` or per-command handlers do the work with plain arguments; the guard is one line.
- Logic never calls `sys.exit` or reads `sys.argv` directly — it takes values and returns or raises, so it can be imported and tested.
- Output formatting is a function of the data; `--format json` is a different formatter, not a different computation.
- Progress and diagnostics go to stderr or `logging` (Module 15); results go to stdout.

`python -m shop.cli` runs it in a package (Module 12 lesson 2); a `[project.scripts]` entry (lesson 4) installs it as a command.

## Testing a command-line tool

Because `build_parser()` and `main(argv)` take their input as arguments, a test is a plain function call: `main(["sum", "1", "2"])` returns `0`, and `contextlib.redirect_stdout(io.StringIO())` captures what it printed. Usage errors are testable too — construct the parser with `exit_on_error=False` (3.9) so bad input raises `argparse.ArgumentError` instead of exiting, or assert that `SystemExit` is raised with code 2. A tool whose logic lives in functions that never touch `sys.argv`, `sys.exit` or the real streams is one that a test suite can exercise completely without spawning a process.

## Pitfalls

- Errors printed to stdout, corrupting piped output.
- `sys.exit` from deep inside the logic.
- Parsing `sys.argv` by hand once options appear.
- A script that cannot read stdin, so it cannot be used in a pipeline.
- Secrets on the command line (visible in `ps` and shell history).
- `main()` that takes no arguments and cannot be tested.

## Key takeaways

- `sys.argv[1:]` for trivial scripts; `argparse` for options, types, defaults, choices, flags and sub-commands, with `--help` for free.
- Results to stdout, messages to stderr; read stdin when no file is given so the tool works in pipelines.
- Exit `0` on success, `1` on failure, `2` on usage errors; `main(argv=None) -> int` under `sys.exit(main())`.
- Configuration from the environment via `os.environ.get`, overridable by options; never expose secrets.
- Parser, `main`, and the logic are separate functions; the logic never touches `argv` or `exit`.
