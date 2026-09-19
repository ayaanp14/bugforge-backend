import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "getting-started",
  title: "Python and the interpreter",
  blurb: "What CPython is and how it runs a file, the REPL, scripts and -m, the anatomy of a program, the console I/O patterns every exercise uses, and how to read a syntax error and a traceback.",
  icon: "cpu",
  overview: `Python is the language most people can read before they have written a line of it, and this module explains why that is a design rather than an accident: an interpreter that compiles to bytecode and executes it, an object model in which every value is an object and every name a label, indentation that is the block structure rather than decoration, and a small set of conventions — the main guard, imports at the top, one function per job — that make a file look the same whoever wrote it. It fixes the vocabulary the rest of the track relies on: statement and expression, block, docstring, module, exit code, traceback.

The five lessons move from the language to the machine and back. What Python is settles dynamic and strong typing, "everything is an object", the version timeline and what this track's CPython 3.11 runtime does and does not have. Running Python covers the REPL, scripts, \`python -m\`, \`__name__\`, exit codes, and precisely how the study judge runs a program. Anatomy of a program names the parts. Console I/O sets out the five reading patterns that cover every exercise input format and the \`print\` and f-string idioms that produce the expected output exactly. Errors and tracebacks teaches the bottom-up reading of a traceback, the eight exceptions of the first month, and the debugging habit of \`print(repr(x))\` on standard error.

Every exercise is a whole program that reads standard input and prints standard output — a greeting that counts letters, a feature checker that compares the running interpreter's version to a table, a classifier of interpreter invocations, a script built around a \`main()\` guard, an indentation checker and a line classifier, a summary of a count-then-values input, a line numberer that reverses words, an exception namer that evaluates expressions, and a traceback parser. The checkpoint adds a receipt with fixed-decimal totals, a calculator that reports exception names instead of crashing, and a word-count utility that reads to the end of input.`,
  lessons: [
    {
      slug: "what-is-python",
      file: "01-what-is-python.md",
      exercises: [
        {
          title: "Hello, whoever you are",
          prompt: `Read one line holding a name (it may have spaces around it) and print a greeting followed by how many **letters** the name contains — characters for which \`str.isalpha()\` is true, so digits, spaces and hyphens do not count. Use \`letter\` when the count is exactly 1 and \`letters\` otherwise.

**Input:** one line.
**Output:** two lines: \`Hello, <name>!\` with the surrounding whitespace removed, then \`Your name has <n> letters.\`

\`\`\`text
Grace Hopper
\`\`\`
prints
\`\`\`text
Hello, Grace Hopper!
Your name has 11 letters.
\`\`\``,
          starter: String.raw`name = input().strip()
# TODO: count the alphabetic characters, then print the two lines
`,
          solution: String.raw`name = input().strip()
letters = sum(1 for c in name if c.isalpha())
print(f"Hello, {name}!")
noun = "letter" if letters == 1 else "letters"
print(f"Your name has {letters} {noun}.")
`,
          hints: [
            "`input()` returns the line as a string; `.strip()` removes the whitespace at both ends.",
            "A generator expression inside `sum(...)` can count the characters that satisfy a condition.",
            "Pick the word with a conditional expression: `\"letter\" if n == 1 else \"letters\"`.",
          ],
          cases: [
            { stdin: "Grace Hopper\n", expected: "Hello, Grace Hopper!\nYour name has 11 letters.\n" },
            { stdin: "Ada\n", expected: "Hello, Ada!\nYour name has 3 letters.\n" },
            { stdin: "   Linus   \n", expected: "Hello, Linus!\nYour name has 5 letters.\n", hidden: true },
            { stdin: "R2-D2\n", expected: "Hello, R2-D2!\nYour name has 2 letters.\n", hidden: true },
            { stdin: "X\n", expected: "Hello, X!\nYour name has 1 letter.\n", hidden: true },
          ],
        },
        {
          title: "Does this interpreter have it?",
          prompt: `The interpreter you are running on has a version, and every language feature arrived in a particular one. The starter holds a table of features and the \`(major, minor)\` version that introduced each. Read \`n\` feature names and, for each, compare the table entry with the running interpreter's \`sys.version_info\` and report whether the feature is available.

**Input:** \`n\`, then \`n\` lines each holding a feature name.
**Output:** one line per feature: \`<name>: yes (<major>.<minor>)\` when the interpreter's version is at least the feature's, \`<name>: no (needs <major>.<minor>)\` when it is older, and \`<name>: unknown\` for a name not in the table.

\`\`\`text
3
match
type-statement
walrus
\`\`\`
prints (on CPython 3.11)
\`\`\`text
match: yes (3.10)
type-statement: no (needs 3.12)
walrus: yes (3.8)
\`\`\``,
          starter: String.raw`import sys

FEATURES = {
    "f-strings": (3, 6),
    "dataclasses": (3, 7),
    "walrus": (3, 8),
    "match": (3, 10),
    "except-star": (3, 11),
    "type-statement": (3, 12),
    "batched": (3, 12),
    "free-threading": (3, 13),
}

n = int(input())
for _ in range(n):
    name = input().strip()
    # TODO: look the feature up and compare with sys.version_info
`,
          solution: String.raw`import sys

FEATURES = {
    "f-strings": (3, 6),
    "dataclasses": (3, 7),
    "walrus": (3, 8),
    "match": (3, 10),
    "except-star": (3, 11),
    "type-statement": (3, 12),
    "batched": (3, 12),
    "free-threading": (3, 13),
}

running = (sys.version_info.major, sys.version_info.minor)

n = int(input())
for _ in range(n):
    name = input().strip()
    if name not in FEATURES:
        print(f"{name}: unknown")
        continue
    major, minor = FEATURES[name]
    if running >= (major, minor):
        print(f"{name}: yes ({major}.{minor})")
    else:
        print(f"{name}: no (needs {major}.{minor})")
`,
          hints: [
            "`sys.version_info.major` and `.minor` are integers; put them in a tuple and compare tuples — Python compares them element by element.",
            "Check `name in FEATURES` before indexing, or you will raise `KeyError` on an unknown name.",
            "Unpack the table entry with `major, minor = FEATURES[name]` and build the text with an f-string.",
          ],
          cases: [
            { stdin: "3\nmatch\ntype-statement\nwalrus\n", expected: "match: yes (3.10)\ntype-statement: no (needs 3.12)\nwalrus: yes (3.8)\n" },
            { stdin: "2\nexcept-star\nfree-threading\n", expected: "except-star: yes (3.11)\nfree-threading: no (needs 3.13)\n" },
            { stdin: "2\nf-strings\nhyperloop\n", expected: "f-strings: yes (3.6)\nhyperloop: unknown\n", hidden: true },
            { stdin: "1\nbatched\n", expected: "batched: no (needs 3.12)\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does CPython do with `program.py` before the first statement runs?",
          options: [
            "Nothing — it reads and executes one line at a time, so a syntax error on line 40 only matters when line 40 is reached",
            "It compiles the whole file to bytecode; a syntax error anywhere stops the program before line 1 runs",
            "It compiles the file to native machine code",
            "It type-checks every variable and refuses to run if a name changes type",
          ],
          answer: 1,
          explanation: "Compilation to bytecode is a whole-file step, which is why a syntax error at the end of a file prevents the beginning from running. There is no native code and no static type check: types belong to objects and are examined only when an operation runs.",
        },
        {
          prompt: "What does this print?\n\n```python\nx = 5\nx = \"five\"\nprint(type(x).__name__)\n```",
          options: ["`int`", "`str`", "It raises `TypeError` because `x` is already an `int`", "`object`"],
          answer: 1,
          explanation: "A name has no type; it is rebound to whatever object is assigned. After the second assignment `x` labels a `str`. Nothing about the first binding constrains the second.",
        },
        {
          prompt: "What does `\"1\" + 1` do?",
          options: ["Produces `\"11\"`", "Produces `2`", "Raises `TypeError`", "Produces `\"2\"`"],
          answer: 2,
          explanation: "Python is strongly typed: a `str` and an `int` are not silently converted to each other. `str.__add__` refuses an `int` and the result is `TypeError: can only concatenate str (not \"int\") to str`. Convert explicitly with `int(\"1\") + 1` or `\"1\" + str(1)`.",
        },
        {
          prompt: "What does this print?\n\n```python\na = [1]\nb = a\nb.append(2)\nprint(a)\n```",
          options: ["`[1]`", "`[1, 2]`", "`[2]`", "It raises an error because `a` was not modified through its own name"],
          answer: 1,
          explanation: "Assignment binds a second name to the same list object; it copies nothing. Appending through `b` changes the one list that `a` also labels. To get an independent copy you would write `b = a.copy()` or `b = list(a)`.",
        },
        {
          prompt: "Which statement about indentation in Python is correct?",
          options: [
            "Indentation is a style convention; braces define blocks",
            "Indentation defines blocks, and mixing tabs and spaces within one block is an error",
            "Any indentation works as long as each block uses exactly four spaces",
            "Indentation matters only inside functions",
          ],
          answer: 1,
          explanation: "There are no braces: the indented lines after a colon are the block. The interpreter accepts any consistent width per block but refuses a tab/space mix with `TabError`; four spaces is the PEP 8 convention, not a rule the grammar enforces.",
        },
      ],
    },
    {
      slug: "running-python",
      file: "02-running-python.md",
      exercises: [
        {
          title: "Classify the invocation",
          prompt: `Read \`n\` command lines, each starting with \`python\` or \`python3\`, and say how the interpreter would run: with no arguments it opens the **REPL**; \`-c\` runs a **command**; \`-m <name>\` runs a **module**; \`-i <file>\` runs a **script** and then opens the REPL; a bare file name runs a **script**. Anything after the module or file name (extra arguments) is ignored.

**Input:** \`n\`, then \`n\` command lines.
**Output:** one line per command: \`REPL\`, \`command\`, \`module <name>\`, \`script <file> then REPL\` or \`script <file>\`.

\`\`\`text
4
python app.py
python -m json.tool
python
python -c "print(1)"
\`\`\`
prints
\`\`\`text
script app.py
module json.tool
REPL
command
\`\`\``,
          starter: String.raw`n = int(input())
for _ in range(n):
    parts = input().split()
    # parts[0] is "python" or "python3"; look at what follows it
    # TODO: print the classification
`,
          solution: String.raw`n = int(input())
for _ in range(n):
    parts = input().split()
    args = parts[1:]
    if not args:
        print("REPL")
    elif args[0] == "-c":
        print("command")
    elif args[0] == "-m":
        print(f"module {args[1]}")
    elif args[0] == "-i":
        print(f"script {args[1]} then REPL")
    else:
        print(f"script {args[0]}")
`,
          hints: [
            "`input().split()` gives the tokens; drop the first one and look at what is left.",
            "An empty argument list is the REPL; otherwise the first argument decides which branch you are in.",
            "For `-m` and `-i` the interesting name is the *second* argument.",
          ],
          cases: [
            { stdin: "4\npython app.py\npython -m json.tool\npython\npython -c \"print(1)\"\n", expected: "script app.py\nmodule json.tool\nREPL\ncommand\n" },
            { stdin: "2\npython3 -i debug.py\npython3 -m http.server 8000\n", expected: "script debug.py then REPL\nmodule http.server\n", hidden: true },
            { stdin: "3\npython -c print(2**64)\npython3\npython tool.py --verbose input.txt\n", expected: "command\nREPL\nscript tool.py\n", hidden: true },
          ],
        },
        {
          title: "A script with a main guard",
          prompt: `Write a program in the shape every serious script has: a function \`total(nums)\` that returns the sum of a list of integers, a \`main()\` that does all the reading and printing, and the \`if __name__ == "__main__":\` guard as the only top-level statement that runs code. \`main()\` reads lines until the end of input; each line holds integers separated by spaces. Print the sum of each line, then a final line \`total: <sum of everything>\`.

**Input:** zero or more lines of integers.
**Output:** one sum per input line, then \`total: <n>\`.

\`\`\`text
1 2 3
10 20
\`\`\`
prints
\`\`\`text
6
30
total: 36
\`\`\``,
          starter: String.raw`import sys


def total(nums):
    # TODO: return the sum of the list
    return 0


def main():
    # TODO: read every line from sys.stdin, print each line's sum,
    #       then print the grand total
    pass


if __name__ == "__main__":
    main()
`,
          solution: String.raw`import sys


def total(nums):
    return sum(nums)


def main():
    grand = 0
    for line in sys.stdin:
        nums = [int(tok) for tok in line.split()]
        line_sum = total(nums)
        grand += line_sum
        print(line_sum)
    print(f"total: {grand}")


if __name__ == "__main__":
    main()
`,
          hints: [
            "`for line in sys.stdin:` visits every line until the end of input; `line.split()` gives the tokens.",
            "Convert the tokens with a list comprehension or `map(int, ...)` before summing.",
            "Keep a running grand total in `main()` and print it after the loop.",
          ],
          cases: [
            { stdin: "1 2 3\n10 20\n", expected: "6\n30\ntotal: 36\n" },
            { stdin: "-5\n", expected: "-5\ntotal: -5\n" },
            { stdin: "", expected: "total: 0\n", hidden: true },
            { stdin: "7 -7\n0\n100 200 300\n", expected: "0\n0\n600\ntotal: 600\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `python -m json.tool data.json` do?",
          options: [
            "Imports `json.tool` into the REPL and waits for input",
            "Runs the `json.tool` module as a script, found by its import name rather than a file path",
            "Compiles `json/tool.py` to bytecode without running it",
            "Runs `data.json` as a Python program using the `json.tool` interpreter",
          ],
          answer: 1,
          explanation: "`-m` locates a module on the import path and runs it as the main program, which is how the standard library's command-line tools (`json.tool`, `http.server`, `venv`, `pip`) are invoked. Nothing is compiled without running, and JSON is data, not a program.",
        },
        {
          prompt: "When is the expression `__name__ == \"__main__\"` true?",
          options: [
            "Whenever a function called `main` is defined in the file",
            "When the file is being run directly as the program, rather than imported",
            "Always — every module's `__name__` is `\"__main__\"`",
            "Only when the file is named `main.py`",
          ],
          answer: 1,
          explanation: "The interpreter sets the running script's `__name__` to `\"__main__\"`; an imported module's `__name__` is its module name. The file's name and whether it defines `main()` are irrelevant. That is what lets one file be both a script and an importable module.",
        },
        {
          prompt: "This file is run with `python calc.py`. What is printed?\n\n```python\nprint(2 + 2)\n3 + 3\n```",
          options: ["`4` then `6`", "`4` only", "`6` only", "Nothing — expression statements are errors in a script"],
          answer: 1,
          explanation: "Only the REPL echoes expression values. In a script `3 + 3` is evaluated and discarded, so the only output is the `print`. It is not an error: an expression statement is legal, just useless here.",
        },
        {
          prompt: "A judged program prints the correct answer and then calls `sys.exit(3)`. What verdict does it get?",
          options: [
            "Accepted — the output matched",
            "Wrong answer — `3` is appended to the output",
            "Runtime error — a non-zero exit status is a failure regardless of what was printed",
            "Time limit exceeded",
          ],
          answer: 2,
          explanation: "The judge reads the exit status as well as stdout. Anything other than `0` — `sys.exit(3)`, an uncaught exception — is reported as a runtime error even when the right text was printed first. `sys.exit` does not print the number.",
        },
        {
          prompt: "What happens on the judge when a program reads with `n = int(input(\"Enter n: \"))`?",
          options: [
            "Nothing special — prompts go to stderr, which is ignored",
            "The prompt `Enter n: ` is written to standard output and becomes part of the answer, which then does not match",
            "It raises `EOFError` because the judge cannot answer prompts",
            "The prompt is shown to the learner in the editor and the program waits",
          ],
          answer: 1,
          explanation: "`input(prompt)` writes the prompt to stdout, not stderr, before reading. The judge compares everything on stdout, so the answer is prefixed with the prompt text and fails as a wrong answer. Bare `input()` is the rule.",
        },
      ],
    },
    {
      slug: "anatomy-of-a-program",
      file: "03-anatomy-of-a-program.md",
      exercises: [
        {
          title: "Indentation check",
          prompt: `Write a checker for the one rule the interpreter enforces before anything else. Read lines of source code until the end of input and check each line's leading whitespace: a line whose leading whitespace contains a tab is bad, and so is a line whose leading spaces are not a multiple of four. Blank lines (only whitespace) are ignored. Report the **first** bad line, or \`ok\` if there is none.

**Input:** zero or more lines of code.
**Output:** \`ok\`, or \`line <n>: tab\`, or \`line <n>: indent <k>\` where \`k\` is the number of leading spaces (lines are numbered from 1).

\`\`\`text
def f():
   return 1
\`\`\`
prints
\`\`\`text
line 2: indent 3
\`\`\``,
          starter: String.raw`import sys

for number, line in enumerate(sys.stdin, start=1):
    line = line.rstrip("\n")
    if not line.strip():
        continue
    # TODO: measure the leading whitespace and report the first bad line
print("ok")
`,
          solution: String.raw`import sys

for number, line in enumerate(sys.stdin, start=1):
    line = line.rstrip("\n")
    if not line.strip():
        continue
    leading = line[: len(line) - len(line.lstrip())]
    if "\t" in leading:
        print(f"line {number}: tab")
        break
    if len(leading) % 4 != 0:
        print(f"line {number}: indent {len(leading)}")
        break
else:
    print("ok")
`,
          hints: [
            "The leading whitespace is `line[:len(line) - len(line.lstrip())]`.",
            "Check for a tab first, then the length modulo 4; stop at the first bad line with `break`.",
            "A `for ... else` runs the `else` only when the loop was not broken — the place for `ok`.",
          ],
          cases: [
            { stdin: "def f():\n    return 1\n", expected: "ok\n" },
            { stdin: "def f():\n   return 1\n", expected: "line 2: indent 3\n" },
            { stdin: "if x:\n\tpass\n", expected: "line 2: tab\n", hidden: true },
            { stdin: "a = 1\n\n      b = 2\n        c = 3\n", expected: "line 3: indent 6\n", hidden: true },
            { stdin: "", expected: "ok\n", hidden: true },
          ],
        },
        {
          title: "Count the kinds of line",
          prompt: `Read source lines until the end of input and classify each one: **blank** if it contains only whitespace, **comment** if its first non-whitespace character is \`#\`, **code** otherwise (a line of code with a trailing comment is code). Print the three counts.

**Input:** zero or more lines.
**Output:** three lines: \`code <n>\`, \`comment <n>\`, \`blank <n>\`.

\`\`\`text
# header
x = 1

y = 2  # trailing
\`\`\`
prints
\`\`\`text
code 2
comment 1
blank 1
\`\`\``,
          starter: String.raw`import sys

code = comment = blank = 0
for line in sys.stdin:
    stripped = line.strip()
    # TODO: decide which kind of line this is and count it
print(f"code {code}")
print(f"comment {comment}")
print(f"blank {blank}")
`,
          solution: String.raw`import sys

code = comment = blank = 0
for line in sys.stdin:
    stripped = line.strip()
    if not stripped:
        blank += 1
    elif stripped.startswith("#"):
        comment += 1
    else:
        code += 1
print(f"code {code}")
print(f"comment {comment}")
print(f"blank {blank}")
`,
          hints: [
            "After `strip()`, an empty string means the line was blank.",
            "`stripped.startswith(\"#\")` identifies a comment line; test blank first, then comment, then everything else.",
          ],
          cases: [
            { stdin: "# header\nx = 1\n\ny = 2  # trailing\n", expected: "code 2\ncomment 1\nblank 1\n" },
            { stdin: "def f():\n    return 1\n", expected: "code 2\ncomment 0\nblank 0\n" },
            { stdin: "", expected: "code 0\ncomment 0\nblank 0\n", hidden: true },
            { stdin: "   \n#\n   #  \n", expected: "code 0\ncomment 2\nblank 1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which of these is an expression?",
          options: ["`x = 1`", "`pass`", "`x if c else y`", "`import os`"],
          answer: 2,
          explanation: "The conditional expression produces a value and can appear inside a call or on the right of an assignment. Assignment, `pass` and `import` are statements: they do something and have no value.",
        },
        {
          prompt: "What happens when this file runs?\n\n```python\nx = 3\nif x > 0:\nprint(\"positive\")\n```",
          options: ["Prints `positive`", "Prints nothing", "`IndentationError: expected an indented block`", "`NameError`"],
          answer: 2,
          explanation: "A colon opens a block, and the block must be indented. A line at the same level as the `if` is not its body, so the compiler reports the missing block before anything runs. `pass` fills a block that is meant to be empty.",
        },
        {
          prompt: "What does this print?\n\n```python\nlist = [1, 2]\nprint(list((3, 4)))\n```",
          options: ["`[3, 4]`", "`[1, 2, 3, 4]`", "`TypeError: 'list' object is not callable`", "`[1, 2]`"],
          answer: 2,
          explanation: "`list` is a built-in name, not a keyword, so the assignment shadows it with a list object. Calling `list(...)` then tries to call that list, which is not callable. Never name a variable after a built-in you still need.",
        },
        {
          prompt: "Where must a docstring appear to be stored in `__doc__`?",
          options: [
            "Anywhere in the function body",
            "As the first statement of the module, function or class",
            "On the line immediately above the `def`",
            "Inside a comment starting with `#:`",
          ],
          answer: 1,
          explanation: "Only a string literal that is the *first* statement is a docstring. A string elsewhere in the body is an expression statement that evaluates to itself and is discarded; comments are ignored by the compiler entirely.",
        },
        {
          prompt: "Which way of continuing a long statement onto the next line is preferred?",
          options: [
            "A backslash at the end of the line",
            "A semicolon at the end of the line",
            "Breaking inside open brackets — parentheses, square or curly",
            "Indenting the continuation by eight spaces with no other marker",
          ],
          answer: 2,
          explanation: "A statement continues automatically until its brackets close, which is robust and what PEP 8 recommends. A backslash works but breaks if followed by a space; a semicolon separates statements rather than continuing one; indentation alone is a syntax error.",
        },
      ],
    },
    {
      slug: "console-input-and-output",
      file: "04-console-input-and-output.md",
      exercises: [
        {
          title: "A count, then the values",
          prompt: `Read the most common input shape — a count on the first line, that many integers on the second — and print a summary. The mean is printed with exactly two decimals.

**Input:** \`n\` (at least 1), then a line of \`n\` integers.
**Output:** four lines: \`sum <s>\`, \`min <a>\`, \`max <b>\`, \`mean <m>\` with \`m\` to two decimals.

\`\`\`text
5
3 -1 4 1 5
\`\`\`
prints
\`\`\`text
sum 12
min -1
max 5
mean 2.40
\`\`\``,
          starter: String.raw`n = int(input())
nums = list(map(int, input().split()))
# TODO: print sum, min, max and the mean to two decimals
`,
          solution: String.raw`n = int(input())
nums = list(map(int, input().split()))
total = sum(nums)
print(f"sum {total}")
print(f"min {min(nums)}")
print(f"max {max(nums)}")
print(f"mean {total / n:.2f}")
`,
          hints: [
            "`sum`, `min` and `max` are built-in functions that take the list directly.",
            "`f\"{value:.2f}\"` formats a float with two decimals; `total / n` is a float even when it divides exactly.",
          ],
          cases: [
            { stdin: "5\n3 -1 4 1 5\n", expected: "sum 12\nmin -1\nmax 5\nmean 2.40\n" },
            { stdin: "1\n7\n", expected: "sum 7\nmin 7\nmax 7\nmean 7.00\n", hidden: true },
            { stdin: "3\n-2 -2 -2\n", expected: "sum -6\nmin -2\nmax -2\nmean -2.00\n", hidden: true },
            { stdin: "4\n1 2 3 4\n", expected: "sum 10\nmin 1\nmax 4\nmean 2.50\n", hidden: true },
          ],
        },
        {
          title: "Numbered, with the words reversed",
          prompt: `Read lines until the end of input with \`sys.stdin\`. Print each line numbered from 1 with its **words in reverse order** (words are whitespace-separated; extra spaces are not preserved), then a final line with the count.

**Input:** zero or more lines.
**Output:** \`<i>: <words reversed>\` per line, then \`lines: <n>\`.

\`\`\`text
to be or
not to be
\`\`\`
prints
\`\`\`text
1: or be to
2: be to not
lines: 2
\`\`\``,
          starter: String.raw`import sys

count = 0
for line in sys.stdin:
    # TODO: number the line, reverse its words, print it
    pass
print(f"lines: {count}")
`,
          solution: String.raw`import sys

count = 0
for line in sys.stdin:
    count += 1
    words = line.split()
    print(f"{count}: {' '.join(reversed(words))}")
print(f"lines: {count}")
`,
          hints: [
            "`line.split()` drops the newline and every extra space at once.",
            "`reversed(words)` walks the list backwards; `' '.join(...)` puts spaces back between the words.",
            "Count inside the loop — `enumerate(sys.stdin, start=1)` does it for you.",
          ],
          cases: [
            { stdin: "to be or\nnot to be\n", expected: "1: or be to\n2: be to not\nlines: 2\n" },
            { stdin: "  single  \n", expected: "1: single\nlines: 1\n", hidden: true },
            { stdin: "", expected: "lines: 0\n", hidden: true },
            { stdin: "a b\n\nc d e\n", expected: "1: b a\n2: \n3: e d c\nlines: 3\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "The input line is `4`. What does this print?\n\n```python\nn = input()\nprint(n * 2)\n```",
          options: ["`8`", "`44`", "`TypeError`", "`4 4`"],
          answer: 1,
          explanation: "`input()` returns the string `\"4\"`, and multiplying a string by an integer repeats it. Converting with `int(input())` first would give `8`. There is no error: `str * int` is defined.",
        },
        {
          prompt: "What does `print(*[1, 2, 3], sep=\"-\")` print?",
          options: ["`[1, 2, 3]`", "`1-2-3`", "`1 2 3`", "`-1-2-3-`"],
          answer: 1,
          explanation: "The star spreads the list into three separate arguments, and `sep` is placed between arguments. Without the star, `print([1, 2, 3])` prints the list's `repr` with brackets; the separator is never added before the first or after the last item.",
        },
        {
          prompt: "What is `\"a,,b\".split(\",\")`?",
          options: ["`['a', 'b']`", "`['a', '', 'b']`", "`['a', ',', 'b']`", "`['a,,b']`"],
          answer: 1,
          explanation: "Splitting on an explicit separator keeps empty fields, so the two commas produce an empty string between them. Only the no-argument form `split()` collapses runs of whitespace and drops empties.",
        },
        {
          prompt: "What does `print(0.1 + 0.2)` print?",
          options: ["`0.3`", "`0.30`", "`0.30000000000000004`", "`0.3000000000000000166`"],
          answer: 2,
          explanation: "Neither 0.1 nor 0.2 is exactly representable in binary floating point, and their sum's shortest round-tripping representation is `0.30000000000000004`. Format with `f\"{x:.2f}\"` when a fixed number of decimals is expected.",
        },
        {
          prompt: "How do `input()` and `sys.stdin.readline()` signal the end of input?",
          options: [
            "Both return `None`",
            "`input()` raises `EOFError`; `readline()` returns an empty string `\"\"`",
            "Both raise `EOFError`",
            "`input()` returns `\"\"`; `readline()` raises `StopIteration`",
          ],
          answer: 1,
          explanation: "`input()` raises `EOFError` when there is no more data, which is why a read-until-EOF loop wraps it in `try`. The file-object method returns an empty string — an actual empty line is `\"\\n\"`, so the two are distinguishable.",
        },
      ],
    },
    {
      slug: "errors-and-tracebacks",
      file: "05-errors-and-tracebacks.md",
      exercises: [
        {
          title: "Name that exception",
          prompt: `Learn the exception names by triggering them. Read \`n\` Python expressions, one per line, and evaluate each with \`eval\`. If evaluation raises, print the exception class's name (\`type(e).__name__\`); otherwise print the \`repr\` of the value.

**Input:** \`n\`, then \`n\` expressions.
**Output:** one line per expression: \`<expression> => <name or repr>\`.

\`\`\`text
3
1/0
2 + 3
"a" * 3
\`\`\`
prints
\`\`\`text
1/0 => ZeroDivisionError
2 + 3 => 5
"a" * 3 => 'aaa'
\`\`\``,
          starter: String.raw`n = int(input())
for _ in range(n):
    expr = input()
    # TODO: try eval(expr); print the exception name or the repr of the value
`,
          solution: String.raw`n = int(input())
for _ in range(n):
    expr = input()
    try:
        value = eval(expr)
    except Exception as e:
        print(f"{expr} => {type(e).__name__}")
    else:
        print(f"{expr} => {value!r}")
`,
          hints: [
            "Wrap the `eval` in `try:` / `except Exception as e:`.",
            "`type(e).__name__` is the class name without the module; `repr(value)` or `{value!r}` gives the repr.",
            "An `else:` clause on `try` runs only when nothing was raised — the right place for the success line.",
          ],
          cases: [
            { stdin: "5\n1/0\nint(\"x\")\n[1, 2][5]\n{}[\"k\"]\nlen(5)\n", expected: "1/0 => ZeroDivisionError\nint(\"x\") => ValueError\n[1, 2][5] => IndexError\n{}[\"k\"] => KeyError\nlen(5) => TypeError\n" },
            { stdin: "3\n2 + 3\nundefined_name\nNone.x\n", expected: "2 + 3 => 5\nundefined_name => NameError\nNone.x => AttributeError\n" },
            { stdin: "2\n\"a\" * 3\n\"a\" + 1\n", expected: "\"a\" * 3 => 'aaa'\n\"a\" + 1 => TypeError\n", hidden: true },
            { stdin: "3\n(1, 2, 3)[3]\nabs(-4.5)\n[1, 2].index(3)\n", expected: "(1, 2, 3)[3] => IndexError\nabs(-4.5) => 4.5\n[1, 2].index(3) => ValueError\n", hidden: true },
          ],
        },
        {
          title: "Read the traceback",
          prompt: `A traceback arrives on standard input. Extract the three facts a reader needs: the exception type and message from the last line, and the innermost frame — the **last** line that starts with \`  File "\` — with its line number and function name. The last line has the form \`Type: message\` (split on the first \`: \` only; the message may itself contain a colon) or just \`Type\` with no message.

**Input:** the traceback, one or more lines.
**Output:** three lines: \`type: <Type>\`, \`message: <message>\` (or \`message: (none)\`), \`where: line <n> in <function>\`.

\`\`\`text
Traceback (most recent call last):
  File "Main.py", line 9, in main
    print(average(scores))
  File "Main.py", line 4, in average
    return sum(values) / len(values)
ZeroDivisionError: division by zero
\`\`\`
prints
\`\`\`text
type: ZeroDivisionError
message: division by zero
where: line 4 in average
\`\`\``,
          starter: String.raw`import sys

lines = [line.rstrip("\n") for line in sys.stdin]
last = lines[-1]
# TODO: split the last line into type and message,
#       find the last '  File "' line and pull out the line number and function
`,
          solution: String.raw`import sys

lines = [line.rstrip("\n") for line in sys.stdin]
last = lines[-1]
if ": " in last:
    kind, message = last.split(": ", 1)
else:
    kind, message = last, "(none)"

frame = [line for line in lines if line.startswith('  File "')][-1]
# '  File "Main.py", line 4, in average'
_, rest = frame.split(", line ", 1)
number, function = rest.split(", in ", 1)

print(f"type: {kind}")
print(f"message: {message}")
print(f"where: line {number} in {function}")
`,
          hints: [
            "`last.split(\": \", 1)` splits only at the first `: `, keeping any later colon in the message.",
            "Filter the lines with `startswith('  File \"')` and take the last one; that is the innermost frame.",
            "The frame line contains `, line N, in NAME` — split on those two separators.",
          ],
          cases: [
            {
              stdin: "Traceback (most recent call last):\n  File \"Main.py\", line 12, in <module>\n    main()\n  File \"Main.py\", line 9, in main\n    print(average(scores))\n  File \"Main.py\", line 4, in average\n    return sum(values) / len(values)\nZeroDivisionError: division by zero\n",
              expected: "type: ZeroDivisionError\nmessage: division by zero\nwhere: line 4 in average\n",
            },
            {
              stdin: "Traceback (most recent call last):\n  File \"Main.py\", line 2, in <module>\n    print(data[\"name\"])\nKeyError: 'name'\n",
              expected: "type: KeyError\nmessage: 'name'\nwhere: line 2 in <module>\n",
            },
            {
              stdin: "Traceback (most recent call last):\n  File \"app.py\", line 30, in <module>\n    run()\n  File \"app.py\", line 21, in run\n    parse(line)\n  File \"app.py\", line 7, in parse\n    return int(text)\nValueError: invalid literal for int() with base 10: 'abc'\n",
              expected: "type: ValueError\nmessage: invalid literal for int() with base 10: 'abc'\nwhere: line 7 in parse\n",
              hidden: true,
            },
            {
              stdin: "Traceback (most recent call last):\n  File \"x.py\", line 1, in <module>\n    raise RuntimeError\nRuntimeError\n",
              expected: "type: RuntimeError\nmessage: (none)\nwhere: line 1 in <module>\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "In a traceback, which line tells you *where* the exception was raised?",
          options: [
            "The first `File` line, because the traceback is printed outermost-first",
            "The `File` line directly above the final `Type: message` line — the innermost frame",
            "The line that says `Traceback (most recent call last)`",
            "The final line — it includes the line number",
          ],
          answer: 1,
          explanation: "\"Most recent call last\" means the innermost frame is at the bottom, just above the exception line. The final line names the type and message but not the location; the first `File` line is the outermost caller.",
        },
        {
          prompt: "What does this do?\n\n```python\nxs = [3, 1, 2]\nxs = xs.sort()\nprint(xs[0])\n```",
          options: ["Prints `1`", "Prints `3`", "`TypeError: 'NoneType' object is not subscriptable`", "`AttributeError`"],
          answer: 2,
          explanation: "`list.sort()` sorts in place and returns `None`, so the assignment rebinds `xs` to `None` and indexing it fails. Either call `xs.sort()` without assigning, or use `xs = sorted(xs)`, which returns a new list.",
        },
        {
          prompt: "Which exception does `int(\"3.5\")` raise?",
          options: ["`TypeError`", "`ValueError`", "`SyntaxError`", "None — it returns `3`"],
          answer: 1,
          explanation: "The argument has the right type (a string) but a value `int` cannot parse as an integer, which is `ValueError` by definition. `TypeError` is for the wrong kind of object, such as `int([1])`. `int(3.5)` on a float truncates to `3`, but that is a different call.",
        },
        {
          prompt: "The compiler reports `SyntaxError` on line 5, but line 5 looks correct. What is the most likely cause?",
          options: [
            "A bracket opened on an earlier line was never closed, and the parser gave up on line 5",
            "Line 5 contains a keyword used as a variable name",
            "Line 5 is indented with spaces instead of tabs",
            "The file has Windows line endings",
          ],
          answer: 0,
          explanation: "An unclosed `(` or `[` makes the parser keep reading the next line as part of the same statement, and the error surfaces where it finally cannot continue. Modern messages usually say which line the bracket was opened on; look one line up regardless.",
        },
        {
          prompt: "What does this raise?\n\n```python\nd = {}\nprint(d[\"k\"])\n```",
          options: ["`IndexError`", "`KeyError: 'k'`", "`AttributeError`", "Nothing — it prints `None`"],
          answer: 1,
          explanation: "Subscripting a dictionary with a missing key raises `KeyError`; `IndexError` is for sequences. To get `None` (or a default) without an exception, use `d.get(\"k\")`.",
        },
      ],
    },
    {
      slug: "getting-started-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Receipt",
          prompt: `Read \`n\` purchase records and print a receipt. Each record is a name, an integer quantity and a unit price. Print one line per item and a total, all prices with exactly two decimals.

**Input:** \`n\`, then \`n\` lines \`name qty price\`.
**Output:** \`<name> x<qty> @ <price> = <qty * price>\` per item, then \`total = <sum>\`.

\`\`\`text
2
apple 3 0.5
bread 1 2.25
\`\`\`
prints
\`\`\`text
apple x3 @ 0.50 = 1.50
bread x1 @ 2.25 = 2.25
total = 3.75
\`\`\``,
          starter: String.raw`n = int(input())
total = 0.0
for _ in range(n):
    name, qty, price = input().split()
    # TODO: convert, print the item line, accumulate the total
print(f"total = {total:.2f}")
`,
          solution: String.raw`n = int(input())
total = 0.0
for _ in range(n):
    name, qty, price = input().split()
    qty = int(qty)
    price = float(price)
    line_total = qty * price
    total += line_total
    print(f"{name} x{qty} @ {price:.2f} = {line_total:.2f}")
print(f"total = {total:.2f}")
`,
          hints: [
            "Unpack the three tokens, then convert the quantity with `int` and the price with `float`.",
            "Every money value goes through `:.2f` — the raw float would print `0.5`, not `0.50`.",
          ],
          cases: [
            { stdin: "2\napple 3 0.5\nbread 1 2.25\n", expected: "apple x3 @ 0.50 = 1.50\nbread x1 @ 2.25 = 2.25\ntotal = 3.75\n" },
            { stdin: "1\nmilk 2 1.25\n", expected: "milk x2 @ 1.25 = 2.50\ntotal = 2.50\n", hidden: true },
            { stdin: "0\n", expected: "total = 0.00\n", hidden: true },
            { stdin: "3\na 10 0.1\nb 10 0.1\nc 10 0.1\n", expected: "a x10 @ 0.10 = 1.00\nb x10 @ 0.10 = 1.00\nc x10 @ 0.10 = 1.00\ntotal = 3.00\n", hidden: true },
          ],
        },
        {
          title: "A calculator that never crashes",
          prompt: `Read lines until the end of input, each meant to be \`a op b\` with integer operands and one of the operators \`+ - * / // % **\`. Print the result of each line — an integer for every operator except \`/\`, whose result is printed with two decimals. When a line cannot be computed, print the name of the exception instead of crashing: dividing by zero is \`ZeroDivisionError\`; a non-integer operand, an unknown operator, or a line without exactly three tokens is \`ValueError\`.

**Input:** zero or more lines.
**Output:** one line per input line.

\`\`\`text
7 + 2
7 / 2
7 // 0
7 ^ 2
\`\`\`
prints
\`\`\`text
9
3.50
ZeroDivisionError
ValueError
\`\`\``,
          starter: String.raw`import sys


def compute(line):
    # TODO: parse "a op b" and return the result; raise ValueError for a bad operator
    pass


for line in sys.stdin:
    # TODO: call compute inside try/except and print the result or the exception name
    pass
`,
          solution: String.raw`import sys


def compute(line):
    a, op, b = line.split()
    a, b = int(a), int(b)
    if op == "+":
        return a + b
    if op == "-":
        return a - b
    if op == "*":
        return a * b
    if op == "/":
        return a / b
    if op == "//":
        return a // b
    if op == "%":
        return a % b
    if op == "**":
        return a ** b
    raise ValueError(f"unknown operator {op}")


for line in sys.stdin:
    try:
        result = compute(line)
    except (ValueError, ZeroDivisionError) as e:
        print(type(e).__name__)
    else:
        if isinstance(result, float):
            print(f"{result:.2f}")
        else:
            print(result)
`,
          hints: [
            "`a, op, b = line.split()` raises `ValueError` by itself when the token count is wrong — let it.",
            "`int(a)` raises `ValueError` for a non-integer; a bad operator needs an explicit `raise ValueError(...)`.",
            "Only `/` returns a float; test with `isinstance(result, float)` to decide the format.",
          ],
          cases: [
            { stdin: "7 + 2\n7 / 2\n7 // 0\n7 ^ 2\n", expected: "9\n3.50\nZeroDivisionError\nValueError\n" },
            { stdin: "x * 2\n-7 // 2\n-7 % 3\n2 ** 10\n", expected: "ValueError\n-4\n2\n1024\n", hidden: true },
            { stdin: "1 / 3\n3 %\n5 % 0\n", expected: "0.33\nValueError\nZeroDivisionError\n", hidden: true },
            { stdin: "0 ** 0\n-3 - -3\n", expected: "1\n0\n", hidden: true },
          ],
        },
        {
          title: "wc",
          prompt: `Write the classic word-count utility. Read **all** of standard input and print the number of lines, words and characters. Lines are what \`str.splitlines()\` yields, words are whitespace-separated tokens, and characters are every character including newlines.

**Input:** any text, possibly empty.
**Output:** three lines: \`lines <n>\`, \`words <n>\`, \`chars <n>\`.

\`\`\`text
hello world
foo
\`\`\`
prints
\`\`\`text
lines 2
words 3
chars 16
\`\`\``,
          starter: String.raw`import sys

data = sys.stdin.read()
# TODO: count and print
`,
          solution: String.raw`import sys

data = sys.stdin.read()
print(f"lines {len(data.splitlines())}")
print(f"words {len(data.split())}")
print(f"chars {len(data)}")
`,
          hints: [
            "`sys.stdin.read()` returns the whole input as one string, newlines included.",
            "`splitlines()` and `split()` give lists whose lengths are the two counts; `len(data)` is the third.",
          ],
          cases: [
            { stdin: "hello world\nfoo\n", expected: "lines 2\nwords 3\nchars 16\n" },
            { stdin: "", expected: "lines 0\nwords 0\nchars 0\n", hidden: true },
            { stdin: "  a  b  \n\n c\n", expected: "lines 3\nwords 3\nchars 13\n", hidden: true },
            { stdin: "one", expected: "lines 1\nwords 1\nchars 3\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which statement about how CPython runs a program is correct?",
          options: [
            "It compiles the source to bytecode and then interprets that bytecode",
            "It interprets the source text directly, one character at a time",
            "It compiles the source to machine code once and caches the binary",
            "It runs the program twice: once to check types and once for real",
          ],
          answer: 0,
          explanation: "Bytecode compilation followed by interpretation in the evaluation loop is the CPython model; the `.pyc` files in `__pycache__` are cached bytecode, not machine code. There is no separate type-checking pass.",
        },
        {
          prompt: "What does `print(type(3 / 1).__name__)` print?",
          options: ["`int`", "`float`", "`Fraction`", "`decimal`"],
          answer: 1,
          explanation: "In Python 3 the `/` operator always produces a `float`, even when the division is exact. Floor division `//` on two integers produces an `int`.",
        },
        {
          prompt: "What is printed when this script runs?\n\n```python\ndef f():\n    return 5\n\nf()\nprint(f())\n```",
          options: ["`5` twice", "`5` once", "Nothing", "`None`"],
          answer: 1,
          explanation: "The bare call `f()` evaluates to 5 and discards it — only the REPL would echo it. The `print` call prints the second result once.",
        },
        {
          prompt: "What does `f\"{7 / 2:.1f}\"` evaluate to?",
          options: ["`'3.5'`", "`'3'`", "`'3.50'`", "`'4'`"],
          answer: 0,
          explanation: "`7 / 2` is `3.5`, and `.1f` formats with exactly one decimal place. `.2f` would give `3.50`; `//` would be needed to get `3`.",
        },
        {
          prompt: "What does `print(\"a\", \"b\", sep=\"\")` print?",
          options: ["`a b`", "`ab`", "`a,b`", "`a\\nb`"],
          answer: 1,
          explanation: "`sep` is the string placed between arguments; the empty string joins them directly. The default separator is one space.",
        },
        {
          prompt: "In `for line in sys.stdin:`, what is true of each `line`?",
          options: [
            "It has the trailing newline already removed",
            "It keeps its trailing newline, so `rstrip(\"\\n\")` or `split()` is needed",
            "It is a list of the line's words",
            "It is `None` on the last iteration",
          ],
          answer: 1,
          explanation: "Iterating a file object yields raw lines including the `\\n`, unlike `input()`, which strips it. The loop simply ends at EOF; there is no `None` sentinel.",
        },
        {
          prompt: "The input line is `1 2 3`. What happens?\n\n```python\na, b = input().split()\n```",
          options: [
            "`a` is `\"1\"` and `b` is `\"2 3\"`",
            "`a` is `\"1\"` and `b` is `\"2\"`; the `3` is dropped",
            "`ValueError: too many values to unpack (expected 2)`",
            "`TypeError`",
          ],
          answer: 2,
          explanation: "Unpacking requires the exact number of values unless a starred target absorbs the rest (`a, *b = ...`). Three tokens into two names is a `ValueError`.",
        },
        {
          prompt: "What does a function return when it has no `return` statement?",
          options: ["`0`", "`False`", "`None`", "An empty string"],
          answer: 2,
          explanation: "Falling off the end of a function returns `None`. This is the source of many `AttributeError: 'NoneType' object has no attribute ...` messages: a helper that forgot to `return` its result.",
        },
        {
          prompt: "The input line is `hi ` (with one trailing space). What does `print(len(input()))` print?",
          options: ["`2`", "`3`", "`4`", "`1`"],
          answer: 1,
          explanation: "`input()` strips only the trailing newline, not spaces, so the string is `\"hi \"` with length 3. Use `.strip()` when surrounding whitespace should not count.",
        },
        {
          prompt: "What error does mixing a tab and spaces in the indentation of one block produce?",
          options: ["`SyntaxError: unexpected indent`", "`TabError: inconsistent use of tabs and spaces in indentation`", "No error — tabs are expanded to 8 spaces", "`IndentationError: unindent does not match`"],
          answer: 1,
          explanation: "Python 3 refuses inconsistent tab/space mixing outright with `TabError`, a subclass of `IndentationError`. The other messages describe different indentation faults: a line indented for no reason, or a dedent to a level that matches no open block.",
        },
        {
          prompt: "Which interpreter flag removes `assert` statements from the program?",
          options: ["`-i`", "`-m`", "`-O`", "`-u`"],
          answer: 2,
          explanation: "`-O` (optimise) sets `__debug__` to `False` and strips asserts, which is why an `assert` must never guard something the program needs. `-i` opens the REPL afterwards, `-m` runs a module, `-u` unbuffers output.",
        },
        {
          prompt: "A program raises an exception that nothing catches. What exit status does the process end with?",
          options: ["`0`", "`1`", "`-1`", "The exception's line number"],
          answer: 1,
          explanation: "An uncaught exception prints the traceback to stderr and exits with status 1, which shells, CI and the judge read as failure. Only reaching the end of the file, or `sys.exit(0)`, gives 0.",
        },
      ],
    },
  ],
});
