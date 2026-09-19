import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "control-flow",
  title: "Control flow",
  blurb: "if/elif/else and guard clauses, while with break, continue and else, for over any iterable with range, enumerate and zip, structural pattern matching with match, and the loop patterns interviews are built from.",
  icon: "branch",
  overview: `Python has one conditional statement and two loops, and the craft is in the shapes: a guard clause that returns early instead of nesting, a \`while True\` whose exit is in the middle, a \`for\` that walks the elements rather than the indices, a \`match\` that takes a command line apart by its structure. This module teaches the statements and, with each one, the shape a fluent Python programmer reaches for and the built-in that replaces the loop altogether — \`sum\`, \`max\` with a key, \`any\`, \`in\`, \`enumerate\`, \`zip\`.

Conditionals covers truth testing in a condition, guard clauses, membership and identity tests, the conditional expression and the dictionary that replaces an \`elif\` chain. While loops covers the sentinel and EOF loops, \`break\` and \`continue\`, and the loop \`else\` that only Python has. For loops fixes \`range\`'s half-open rule, \`enumerate\`, \`zip\` with \`strict=True\`, dictionary iteration and the rule against modifying a collection you are iterating. Match statements gives the pattern kinds, guards, and the capture-versus-value rule. Loop patterns catalogues accumulate, count, extreme, search, running state, two pointers, prefix sums and building output.

The exercises are whole programs: a leap-year rule, a triangle classifier with guard clauses, the Collatz sequence, a \`while … else\` search, a multiplication table, a ranked list built with \`enumerate\` over a strict \`zip\`, a command dispatcher and a shape calculator written with \`match\`, a longest-streak finder and a two-pointer pair search. The checkpoint adds a configurable FizzBuzz, a prime lister on trial division with \`for … else\`, and a bank account whose commands are dispatched with patterns and guards.`,
  lessons: [
    {
      slug: "conditionals",
      file: "01-conditionals.md",
      exercises: [
        {
          title: "Leap years",
          prompt: `A year is a leap year when it is divisible by 4, except that years divisible by 100 are not — unless they are also divisible by 400. Read \`n\` years and classify each with one boolean expression built from \`and\`, \`or\` and \`not\` (no nested \`if\`s).

**Input:** \`n\`, then \`n\` years.
**Output:** \`<year> leap\` or \`<year> common\` per year.

\`\`\`text
3
2000
1900
2024
\`\`\`
prints
\`\`\`text
2000 leap
1900 common
2024 leap
\`\`\``,
          starter: String.raw`def is_leap(year):
    # TODO: one expression with and / or / not
    return False


n = int(input())
for _ in range(n):
    year = int(input())
    print(year, "leap" if is_leap(year) else "common")
`,
          solution: String.raw`def is_leap(year):
    return year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)


n = int(input())
for _ in range(n):
    year = int(input())
    print(year, "leap" if is_leap(year) else "common")
`,
          hints: [
            "Divisible by 4 is necessary; then the century exception needs an `or`.",
            "`year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)` — the parentheses matter because `and` binds tighter than `or`.",
          ],
          cases: [
            { stdin: "3\n2000\n1900\n2024\n", expected: "2000 leap\n1900 common\n2024 leap\n" },
            { stdin: "3\n2023\n2100\n1600\n", expected: "2023 common\n2100 common\n1600 leap\n", hidden: true },
            { stdin: "2\n4\n100\n", expected: "4 leap\n100 common\n", hidden: true },
          ],
        },
        {
          title: "Triangle classifier",
          prompt: `Read three integer side lengths and classify the triangle. Use guard clauses: if any side is not positive, or the two shorter sides do not add up to more than the longest, print \`invalid\` and stop. Otherwise print \`equilateral\`, \`isosceles\` or \`scalene\`, followed by \` right\` when the sides satisfy \`a² + b² = c²\` with \`c\` the longest.

**Input:** one line \`a b c\`.
**Output:** one line.

\`\`\`text
3 4 5
\`\`\`
prints
\`\`\`text
scalene right
\`\`\``,
          starter: String.raw`a, b, c = sorted(map(int, input().split()))
# TODO: guard clauses for invalid input, then the classification
`,
          solution: String.raw`a, b, c = sorted(map(int, input().split()))
if a <= 0 or a + b <= c:
    print("invalid")
else:
    if a == b == c:
        kind = "equilateral"
    elif a == b or b == c:
        kind = "isosceles"
    else:
        kind = "scalene"
    if a * a + b * b == c * c:
        kind += " right"
    print(kind)
`,
          hints: [
            "Sorting the sides first makes `c` the longest, so one comparison checks the triangle inequality and one checks Pythagoras.",
            "After sorting, `a <= 0` covers every non-positive side.",
            "`a == b == c` chains; isosceles is `a == b or b == c` once sorted.",
          ],
          cases: [
            { stdin: "3 4 5\n", expected: "scalene right\n" },
            { stdin: "2 2 2\n", expected: "equilateral\n" },
            { stdin: "1 2 3\n", expected: "invalid\n", hidden: true },
            { stdin: "8 5 5\n", expected: "isosceles\n", hidden: true },
            { stdin: "10 6 8\n", expected: "scalene right\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this print?\n\n```python\nxs = []\nif xs:\n    print(\"some\")\nelif xs == []:\n    print(\"empty list\")\nelse:\n    print(\"other\")\n```",
          options: ["`some`", "`empty list`", "`other`", "Nothing"],
          answer: 1,
          explanation: "An empty list is falsy, so the first branch is skipped; the `elif` compares by value and matches. Only the first true branch runs.",
        },
        {
          prompt: "Which rewrite of `if cmd == \"q\" or cmd == \"quit\" or cmd == \"exit\":` is idiomatic?",
          options: ["`if cmd in (\"q\", \"quit\", \"exit\"):`", "`if cmd == (\"q\" or \"quit\" or \"exit\"):`", "`if cmd == \"q\" | \"quit\" | \"exit\":`", "`if cmd is \"q\" or \"quit\" or \"exit\":`"],
          answer: 0,
          explanation: "Membership in a tuple tests each alternative. `\"q\" or \"quit\"` evaluates to `\"q\"` alone, `|` on strings is a `TypeError`, and `cmd is \"q\" or \"quit\"` is always truthy because the second operand is a non-empty string.",
        },
        {
          prompt: "What is a guard clause?",
          options: [
            "A `try` block around risky code",
            "An early `return`, `continue` or `raise` that handles an exceptional case so the main path stays unindented",
            "An `else` at the end of an `if` chain",
            "A condition wrapped in parentheses",
          ],
          answer: 1,
          explanation: "Handling the exits first means the rest of the function can assume the happy path, which flattens nesting. The other options are unrelated constructs.",
        },
        {
          prompt: "What does `print(\"yes\" if 0 else \"no\")` print?",
          options: ["`yes`", "`no`", "`0`", "`SyntaxError`"],
          answer: 1,
          explanation: "The conditional expression tests its middle operand; `0` is falsy so the `else` value is chosen.",
        },
        {
          prompt: "What is wrong with `if is_valid:` where `is_valid` is a function?",
          options: [
            "Nothing — Python calls it automatically",
            "A function object is always truthy, so the branch always runs; the call `is_valid()` was meant",
            "It raises `TypeError`",
            "It is a syntax error",
          ],
          answer: 1,
          explanation: "Without parentheses the name refers to the function itself, which is truthy like any object without `__bool__`. The bug is silent, which is what makes it worth remembering.",
        },
      ],
    },
    {
      slug: "while-loops",
      file: "02-while-loops.md",
      exercises: [
        {
          title: "Collatz",
          prompt: `Starting from \`n\`, repeatedly replace it with \`n // 2\` if it is even and \`3 * n + 1\` if it is odd, until it reaches 1. Count the steps and track the largest value seen (including the start). The count is unknown in advance — this is a \`while\` loop.

**Input:** one integer \`n >= 1\`.
**Output:** \`steps <count>\` then \`peak <max>\`.

\`\`\`text
6
\`\`\`
prints
\`\`\`text
steps 8
peak 16
\`\`\``,
          starter: String.raw`n = int(input())
steps = 0
peak = n
# TODO: while n != 1: ...
print(f"steps {steps}")
print(f"peak {peak}")
`,
          solution: String.raw`n = int(input())
steps = 0
peak = n
while n != 1:
    n = n // 2 if n % 2 == 0 else 3 * n + 1
    steps += 1
    peak = max(peak, n)
print(f"steps {steps}")
print(f"peak {peak}")
`,
          hints: [
            "The condition is `n != 1`; the body updates `n`, the counter and the peak.",
            "A conditional expression chooses between the two update rules in one line.",
          ],
          cases: [
            { stdin: "6\n", expected: "steps 8\npeak 16\n" },
            { stdin: "27\n", expected: "steps 111\npeak 9232\n" },
            { stdin: "1\n", expected: "steps 0\npeak 1\n", hidden: true },
            { stdin: "7\n", expected: "steps 16\npeak 52\n", hidden: true },
          ],
        },
        {
          title: "Search with while–else",
          prompt: `Find the first position of a target in a list using an index-driven \`while\` loop that \`break\`s when it finds it, and a loop \`else\` that reports the failure — no flag variable.

**Input:** the target on the first line, then a line of integers (possibly empty).
**Output:** \`found at <index>\` or \`not found\`.

\`\`\`text
4
1 3 4 4 9
\`\`\`
prints
\`\`\`text
found at 2
\`\`\``,
          starter: String.raw`target = int(input())
xs = list(map(int, input().split()))
i = 0
# TODO: while i < len(xs): ... break ... else: ...
`,
          solution: String.raw`target = int(input())
xs = list(map(int, input().split()))
i = 0
while i < len(xs):
    if xs[i] == target:
        print(f"found at {i}")
        break
    i += 1
else:
    print("not found")
`,
          hints: [
            "Increment `i` at the end of the body; the `break` skips it, which is fine.",
            "The `else` belongs to the `while`, at the same indentation, and runs only when the condition became false.",
          ],
          cases: [
            { stdin: "4\n1 3 4 4 9\n", expected: "found at 2\n" },
            { stdin: "7\n1 2\n", expected: "not found\n" },
            { stdin: "5\n\n", expected: "not found\n", hidden: true },
            { stdin: "1\n1\n", expected: "found at 0\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "How many times does the body run?\n\n```python\nn = 0\nwhile n > 0:\n    n -= 1\n```",
          options: ["Once", "Zero times", "Forever", "It is a syntax error"],
          answer: 1,
          explanation: "The condition is tested before the first iteration and `0 > 0` is false, so the body never runs. Python has no `do … while` that would run it once.",
        },
        {
          prompt: "When does the `else` block of a `while` loop run?",
          options: [
            "After every iteration",
            "When the loop exits because its condition became false — not after a `break`",
            "Only after a `break`",
            "When the condition was false the first time it was tested",
          ],
          answer: 1,
          explanation: "The `else` is the normal-completion branch. A `break` skips it, which is what makes it the natural place for \"not found\". It also runs when the loop ran zero times, since that is a normal exit too — so the last option is incomplete rather than wrong.",
        },
        {
          prompt: "What does this print?\n\n```python\ni = 0\nwhile True:\n    i += 1\n    if i % 2:\n        continue\n    if i > 6:\n        break\n    print(i, end=\" \")\n```",
          options: ["`2 4 6`", "`1 2 3 4 5 6`", "`2 4 6 8`", "`1 3 5`"],
          answer: 0,
          explanation: "Odd values are skipped by `continue`; even ones print until `i` exceeds 6, when the `break` fires before printing 8.",
        },
        {
          prompt: "A judged program loops with `while True: line = input()` inside a `try/except EOFError` that wraps only the `input()` call and does nothing. What happens at end of input?",
          options: [
            "The loop ends normally",
            "It spins forever raising and swallowing `EOFError`, and the judge reports a time limit",
            "`input()` returns `\"\"` and the loop continues with empty lines",
            "The program exits with status 1",
          ],
          answer: 1,
          explanation: "Swallowing the exception inside the loop hides the only signal that input is exhausted, so the loop never terminates. The `try` must enclose the whole loop, or the handler must `break`.",
        },
        {
          prompt: "Which loop is the idiomatic spelling of 'repeat exactly n times'?",
          options: ["`i = 0\\nwhile i < n:\\n    ...\\n    i += 1`", "`for _ in range(n):\\n    ...`", "`while n:\\n    ...\\n    n -= 1`", "`for i in n:\\n    ...`"],
          answer: 1,
          explanation: "A known count is a `for` over `range`; the underscore says the value is unused. The `while` versions work but invite forgotten increments, and `for i in n` is a `TypeError` because an int is not iterable.",
        },
      ],
    },
    {
      slug: "for-loops-and-range",
      file: "03-for-loops-and-range.md",
      exercises: [
        {
          title: "Multiplication table",
          prompt: `Print the \`n × n\` multiplication table with nested \`for\` loops over \`range(1, n + 1)\`. Every entry is right-aligned in a field as wide as the largest product, and entries on a row are separated by one space.

**Input:** \`n\` (1–12).
**Output:** \`n\` rows.

\`\`\`text
4
\`\`\`
prints
\`\`\`text
 1  2  3  4
 2  4  6  8
 3  6  9 12
 4  8 12 16
\`\`\``,
          starter: String.raw`n = int(input())
width = len(str(n * n))
# TODO: nested loops; f"{value:{width}}" right-aligns in the field
`,
          solution: String.raw`n = int(input())
width = len(str(n * n))
for r in range(1, n + 1):
    row = [f"{r * c:{width}}" for c in range(1, n + 1)]
    print(" ".join(row))
`,
          hints: [
            "`range(1, n + 1)` runs from 1 to n inclusive — the stop is excluded.",
            "A nested format spec `f\"{v:{width}}\"` takes the width from a variable.",
            "Build each row as a list of strings and `\" \".join` it.",
          ],
          cases: [
            { stdin: "4\n", expected: " 1  2  3  4\n 2  4  6  8\n 3  6  9 12\n 4  8 12 16\n" },
            { stdin: "3\n", expected: "1 2 3\n2 4 6\n3 6 9\n" },
            { stdin: "1\n", expected: "1\n", hidden: true },
            { stdin: "5\n", expected: " 1  2  3  4  5\n 2  4  6  8 10\n 3  6  9 12 15\n 4  8 12 16 20\n 5 10 15 20 25\n", hidden: true },
          ],
        },
        {
          title: "Ranked pairs",
          prompt: `Two lines hold names and integer scores in matching order. Print them numbered from 1 using \`enumerate\` over \`zip(names, scores, strict=True)\`, then the name with the highest score (the first one on a tie). If the two lines have different lengths, \`strict=True\` raises \`ValueError\` — catch it and print \`length mismatch\` instead.

**Input:** a line of names, then a line of integers.
**Output:** \`<i>. <name> <score>\` per pair, then \`best: <name>\`; or the single line \`length mismatch\`.

\`\`\`text
ada grace linus
90 95 88
\`\`\`
prints
\`\`\`text
1. ada 90
2. grace 95
3. linus 88
best: grace
\`\`\``,
          starter: String.raw`names = input().split()
scores = list(map(int, input().split()))
try:
    pairs = list(zip(names, scores, strict=True))
except ValueError:
    print("length mismatch")
else:
    # TODO: numbered lines with enumerate(..., start=1), then the best
    pass
`,
          solution: String.raw`names = input().split()
scores = list(map(int, input().split()))
try:
    pairs = list(zip(names, scores, strict=True))
except ValueError:
    print("length mismatch")
else:
    for i, (name, score) in enumerate(pairs, start=1):
        print(f"{i}. {name} {score}")
    best_name, _ = max(pairs, key=lambda p: p[1])
    print(f"best: {best_name}")
`,
          hints: [
            "`list(zip(...))` forces the strict check to happen inside the `try`.",
            "`enumerate(pairs, start=1)` yields `(i, (name, score))` — unpack with nested parentheses.",
            "`max(pairs, key=lambda p: p[1])` returns the first pair with the highest score.",
          ],
          cases: [
            { stdin: "ada grace linus\n90 95 88\n", expected: "1. ada 90\n2. grace 95\n3. linus 88\nbest: grace\n" },
            { stdin: "solo\n7\n", expected: "1. solo 7\nbest: solo\n", hidden: true },
            { stdin: "a b c\n5 5 1\n", expected: "1. a 5\n2. b 5\n3. c 1\nbest: a\n", hidden: true },
            { stdin: "a b\n1 2 3\n", expected: "length mismatch\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is `list(range(2, 10, 3))`?",
          options: ["`[2, 5, 8]`", "`[2, 5, 8, 11]`", "`[3, 6, 9]`", "`[2, 4, 6, 8, 10]`"],
          answer: 0,
          explanation: "Start at 2, step by 3, stop before 10: 2, 5, 8. The stop value is never included.",
        },
        {
          prompt: "What does this print?\n\n```python\nfor i in range(3):\n    i = 10\nprint(i)\n```",
          options: ["`10`", "`2`", "`3`", "`NameError`"],
          answer: 0,
          explanation: "Rebinding the loop variable inside the body does not affect the iteration (the next value comes from the range), and the variable survives the loop with its last binding, which was `10` in the final iteration.",
        },
        {
          prompt: "What does `list(zip([1, 2, 3], \"ab\"))` produce?",
          options: ["`[(1, 'a'), (2, 'b'), (3, None)]`", "`[(1, 'a'), (2, 'b')]`", "`ValueError`", "`[(1, 'a', 'b')]`"],
          answer: 1,
          explanation: "`zip` stops at the shortest input silently. `strict=True` would raise; `itertools.zip_longest` would pad with `None`.",
        },
        {
          prompt: "Which loop prints each element with its 1-based position?",
          options: ["`for i, x in enumerate(xs, start=1):`", "`for i, x in enumerate(xs) + 1:`", "`for x, i in enumerate(xs):`", "`for i in range(1, len(xs)):`"],
          answer: 0,
          explanation: "`enumerate` yields `(index, element)` and `start` sets the first index. The second is a `TypeError`, the third swaps the names, and the last skips the first element.",
        },
        {
          prompt: "What happens here?\n\n```python\nxs = [1, 2, 3, 4]\nfor x in xs:\n    if x % 2 == 0:\n        xs.remove(x)\nprint(xs)\n```",
          options: ["`[1, 3]`", "`[1, 3, 4]` or another surprising result — removing shifts the elements the loop is walking", "`RuntimeError`", "`[2, 4]`"],
          answer: 1,
          explanation: "Removing an element during iteration shifts later elements down, so the loop skips the one that moved into the removed slot. Lists do not raise (dicts do). Build a new list with a comprehension instead.",
        },
        {
          prompt: "What does `for k in {\"a\": 1, \"b\": 2}: print(k)` print?",
          options: ["`a` then `b`", "`1` then `2`", "`('a', 1)` then `('b', 2)`", "`TypeError`"],
          answer: 0,
          explanation: "Iterating a dictionary yields its keys, in insertion order. `.values()` gives values and `.items()` gives pairs.",
        },
      ],
    },
    {
      slug: "match-statements",
      file: "04-match-statements.md",
      exercises: [
        {
          title: "Command dispatcher",
          prompt: `Read commands until the end of input and dispatch each with a single \`match\` on \`line.split()\`: \`move x y\` (two integers) prints \`moved to (x, y)\`; \`say\` followed by one or more words prints \`said: <the words>\`; \`color name\` prints \`color set to <name>\`; \`quit\` prints \`bye\` and stops reading; anything else prints \`unknown: <the line>\`.

**Input:** commands, one per line.
**Output:** one line per command, ending at \`quit\` if present.

\`\`\`text
move 3 4
say hello world
jump
quit
move 1 1
\`\`\`
prints
\`\`\`text
moved to (3, 4)
said: hello world
unknown: jump
bye
\`\`\``,
          starter: String.raw`import sys

for line in sys.stdin:
    line = line.rstrip("\n")
    match line.split():
        # TODO: case ["move", x, y]: ...
        # TODO: case ["say", first, *rest]: ...
        # TODO: case ["color", name]: ...
        # TODO: case ["quit"]: print bye and break
        case _:
            print(f"unknown: {line}")
`,
          solution: String.raw`import sys

for line in sys.stdin:
    line = line.rstrip("\n")
    match line.split():
        case ["move", x, y]:
            print(f"moved to ({int(x)}, {int(y)})")
        case ["say", first, *rest]:
            print("said:", " ".join([first, *rest]))
        case ["color", name]:
            print(f"color set to {name}")
        case ["quit"]:
            print("bye")
            break
        case _:
            print(f"unknown: {line}")
`,
          hints: [
            "A sequence pattern with exactly three elements matches `move x y`; convert `x` and `y` with `int` in the body.",
            "`[\"say\", first, *rest]` requires at least one word; a bare `say` falls through to the wildcard.",
            "`break` inside the `case` leaves the `for` loop — `match` itself has no fall-through to escape.",
          ],
          cases: [
            { stdin: "move 3 4\nsay hello world\njump\nquit\nmove 1 1\n", expected: "moved to (3, 4)\nsaid: hello world\nunknown: jump\nbye\n" },
            { stdin: "color red\nsay hi\n", expected: "color set to red\nsaid: hi\n" },
            { stdin: "say\nmove 1\ncolor\nmove -2 7\n", expected: "unknown: say\nunknown: move 1\nunknown: color\nmoved to (-2, 7)\n", hidden: true },
            { stdin: "quit\n", expected: "bye\n", hidden: true },
          ],
        },
        {
          title: "Shapes by pattern",
          prompt: `Each line describes a shape: \`circle r\`, \`rect w h\`, \`square s\` or \`triangle a b c\`, with decimal numbers. Print \`<kind> area <value>\` with two decimals. Use \`match\` with a **guard** so that a \`rect\` whose sides are equal is reported as a \`square\`, and a \`triangle\` whose sides cannot form a triangle prints \`invalid triangle\` (use Heron's formula for a valid one). Anything else prints \`unsupported\`.

**Input:** lines until the end of input.
**Output:** one line per input line.

\`\`\`text
circle 1
rect 3 4
rect 2 2
triangle 3 4 5
hexagon 2
\`\`\`
prints
\`\`\`text
circle area 3.14
rect area 12.00
square area 4.00
triangle area 6.00
unsupported
\`\`\``,
          starter: String.raw`import math
import sys


def is_triangle(a, b, c):
    a, b, c = sorted((a, b, c))
    return a > 0 and a + b > c


for line in sys.stdin:
    parts = line.split()
    nums = [float(p) for p in parts[1:]]
    match [parts[0], *nums] if parts else []:
        # TODO: circle / rect (with a guard for squares) / square / triangle (with a guard) / _
        case _:
            print("unsupported")
`,
          solution: String.raw`import math
import sys


def is_triangle(a, b, c):
    a, b, c = sorted((a, b, c))
    return a > 0 and a + b > c


for line in sys.stdin:
    parts = line.split()
    nums = [float(p) for p in parts[1:]]
    match [parts[0], *nums] if parts else []:
        case ["circle", r]:
            print(f"circle area {math.pi * r * r:.2f}")
        case ["rect", w, h] if w == h:
            print(f"square area {w * w:.2f}")
        case ["rect", w, h]:
            print(f"rect area {w * h:.2f}")
        case ["square", s]:
            print(f"square area {s * s:.2f}")
        case ["triangle", a, b, c] if is_triangle(a, b, c):
            s = (a + b + c) / 2
            print(f"triangle area {math.sqrt(s * (s - a) * (s - b) * (s - c)):.2f}")
        case ["triangle", _, _, _]:
            print("invalid triangle")
        case _:
            print("unsupported")
`,
          hints: [
            "Put the guarded `rect` case before the plain one — cases are tried in order.",
            "A second `triangle` case with `_` placeholders catches the invalid ones after the guarded case fails.",
            "The subject is a list whose first element is the word and the rest are floats.",
          ],
          cases: [
            { stdin: "circle 1\nrect 3 4\nrect 2 2\ntriangle 3 4 5\nhexagon 2\n", expected: "circle area 3.14\nrect area 12.00\nsquare area 4.00\ntriangle area 6.00\nunsupported\n" },
            { stdin: "square 5\ntriangle 1 1 3\n", expected: "square area 25.00\ninvalid triangle\n", hidden: true },
            { stdin: "rect 2.5 2\ncircle 0\ncircle 1 2\n", expected: "rect area 5.00\ncircle area 0.00\nunsupported\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this print?\n\n```python\nRED = 1\ncode = 2\nmatch code:\n    case RED:\n        print(\"red\")\n    case _:\n        print(\"other\")\n```",
          options: ["`other`", "`red`", "`SyntaxError`", "`NameError`"],
          answer: 2,
          explanation: "A bare name in a pattern is a capture that matches anything, so `case RED:` would make the wildcard unreachable — and Python reports that as a `SyntaxError`. To compare with the constant, write a dotted name such as `Colour.RED`.",
        },
        {
          prompt: "Which subject does the pattern `[first, *rest]` match?",
          options: ["Any list or tuple with at least one element", "Any list with exactly two elements", "Any string with at least one character", "Only lists, never tuples"],
          answer: 0,
          explanation: "A sequence pattern with a starred name matches sequences of at least the number of fixed elements; tuples and lists both count, strings are deliberately excluded from sequence patterns.",
        },
        {
          prompt: "What is true of `case {\"type\": t}:` against the dict `{\"type\": \"a\", \"size\": 3}`?",
          options: ["It fails because `size` is not in the pattern", "It matches and binds `t` to `\"a\"`; extra keys are ignored", "It matches only if the dict has exactly one key", "It raises `KeyError`"],
          answer: 1,
          explanation: "Mapping patterns require the named keys and ignore the rest; `**rest` captures the extras if they are needed.",
        },
        {
          prompt: "In `case (x, y) if x == y:`, what happens when the shape matches but `x != y`?",
          options: ["The body runs with the bindings", "The bindings are discarded and the next case is tried", "A `ValueError` is raised", "The `match` statement ends with no case run"],
          answer: 1,
          explanation: "A guard is evaluated after the pattern binds; a false guard means this case did not match, and matching continues downward.",
        },
        {
          prompt: "Does `match` fall through to the next `case` after a matching body?",
          options: ["Yes, unless `break` is used", "No — exactly one case runs and the statement ends", "Only for literal patterns", "Only when the body is empty"],
          answer: 1,
          explanation: "Unlike a C `switch`, there is no fall-through and `break` has no role in `match` (a `break` inside a case refers to an enclosing loop).",
        },
        {
          prompt: "Which pattern matches an instance of `Point` whose `x` attribute is 0 and binds its `y`?",
          options: ["`case Point(x=0, y=y):`", "`case Point[0, y]:`", "`case Point(0, y) if Point.__match_args__ is None:`", "`case {\"x\": 0, \"y\": y}:`"],
          answer: 0,
          explanation: "A class pattern with keyword sub-patterns checks `isinstance` and compares attributes. Positional `Point(0, y)` also works when `__match_args__` is defined (dataclasses do it). The mapping pattern is for dicts.",
        },
      ],
    },
    {
      slug: "loop-patterns",
      file: "05-loop-patterns.md",
      exercises: [
        {
          title: "Longest streak",
          prompt: `Find the longest run of equal consecutive values in a line of integers — the running-state pattern: carry the current value and its run length from one element to the next. On a tie, the earliest streak wins.

**Input:** one line of integers (possibly empty).
**Output:** \`value <v> length <n>\`, or \`empty\` for no values.

\`\`\`text
1 1 2 2 2 3
\`\`\`
prints
\`\`\`text
value 2 length 3
\`\`\``,
          starter: String.raw`xs = list(map(int, input().split()))
if not xs:
    print("empty")
else:
    best_val = cur_val = xs[0]
    best_len = cur_len = 1
    for x in xs[1:]:
        # TODO: extend the current run or start a new one; update the best
        pass
    print(f"value {best_val} length {best_len}")
`,
          solution: String.raw`xs = list(map(int, input().split()))
if not xs:
    print("empty")
else:
    best_val = cur_val = xs[0]
    best_len = cur_len = 1
    for x in xs[1:]:
        if x == cur_val:
            cur_len += 1
        else:
            cur_val, cur_len = x, 1
        if cur_len > best_len:
            best_val, best_len = cur_val, cur_len
    print(f"value {best_val} length {best_len}")
`,
          hints: [
            "Compare each element with the current run's value; either extend the run or start a new one.",
            "Update the best only when the current run is strictly longer, so the earliest streak wins ties.",
          ],
          cases: [
            { stdin: "1 1 2 2 2 3\n", expected: "value 2 length 3\n" },
            { stdin: "5\n", expected: "value 5 length 1\n", hidden: true },
            { stdin: "\n", expected: "empty\n", hidden: true },
            { stdin: "4 4 7 7 1 1 1 9 9 9\n", expected: "value 1 length 3\n", hidden: true },
          ],
        },
        {
          title: "Two-pointer pair sum",
          prompt: `Given a target and a list of integers **sorted in ascending order**, find two indices \`i < j\` with \`xs[i] + xs[j] == target\` using the two-pointer sweep: one index from each end, moving the left one up when the sum is too small and the right one down when it is too large. Print the first pair the sweep finds.

**Input:** the target, then a line of sorted integers.
**Output:** \`<i> <j>\` or \`none\`.

\`\`\`text
9
1 2 4 5 7 8
\`\`\`
prints
\`\`\`text
0 5
\`\`\``,
          starter: String.raw`target = int(input())
xs = list(map(int, input().split()))
i, j = 0, len(xs) - 1
# TODO: while i < j: ...
`,
          solution: String.raw`target = int(input())
xs = list(map(int, input().split()))
i, j = 0, len(xs) - 1
while i < j:
    s = xs[i] + xs[j]
    if s == target:
        print(i, j)
        break
    if s < target:
        i += 1
    else:
        j -= 1
else:
    print("none")
`,
          hints: [
            "Every branch must move one pointer, or the loop never ends.",
            "The loop `else` prints `none` when the pointers cross without a hit.",
          ],
          cases: [
            { stdin: "9\n1 2 4 5 7 8\n", expected: "0 5\n" },
            { stdin: "10\n1 2 3\n", expected: "none\n" },
            { stdin: "6\n3 3\n", expected: "0 1\n", hidden: true },
            { stdin: "8\n1 2 3 4 5\n", expected: "2 4\n", hidden: true },
            { stdin: "5\n\n", expected: "none\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which single expression counts the even numbers in `xs`?",
          options: ["`sum(x % 2 == 0 for x in xs)`", "`len(x for x in xs if x % 2 == 0)`", "`count(xs, even)`", "`xs.count(x % 2 == 0)`"],
          answer: 0,
          explanation: "Booleans sum as 0 and 1. `len` does not accept a generator, `count` is not a built-in, and `xs.count` looks for a specific value.",
        },
        {
          prompt: "What is the bug?\n\n```python\nbest = 0\nfor x in xs:\n    if x > best:\n        best = x\n```",
          options: ["`best` should start at `xs[0]`, `None` or `-inf`: for an all-negative list the answer is wrong", "`>` should be `>=`", "It should use `while`", "There is no bug"],
          answer: 0,
          explanation: "Starting at 0 silently assumes a non-negative maximum exists. `max(xs)` raises on an empty list and is otherwise correct; a hand loop should start from the first element or negative infinity.",
        },
        {
          prompt: "What does `next((x for x in xs if x < 0), None)` return?",
          options: ["The first negative element, or `None` if there is none", "A list of the negatives", "`True` if any element is negative", "`StopIteration`"],
          answer: 0,
          explanation: "`next` on a generator with a default returns the first produced value or the default when the generator is exhausted. `any` would give the boolean; a list comprehension the list.",
        },
        {
          prompt: "With `prefix = [0, 3, 8, 10]` built from `xs = [3, 5, 2]`, what is `sum(xs[1:3])`?",
          options: ["`prefix[3] - prefix[1]` = 7", "`prefix[2] - prefix[1]` = 5", "`prefix[3]` = 10", "`prefix[1] + prefix[3]` = 13"],
          answer: 0,
          explanation: "With the leading zero, the sum of `xs[a:b]` is `prefix[b] - prefix[a]`: 10 − 3 = 7 = 5 + 2.",
        },
        {
          prompt: "Why is `\"\\n\".join(lines)` preferred to `s += line + \"\\n\"` in a loop?",
          options: [
            "Because `+=` does not work on strings",
            "Because each `+=` copies the whole growing string, while `join` allocates once",
            "Because `join` sorts the lines",
            "There is no difference",
          ],
          answer: 1,
          explanation: "Strings are immutable, so repeated concatenation is quadratic in the total length; `join` computes the final size and copies each piece once.",
        },
      ],
    },
    {
      slug: "control-flow-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "FizzBuzz, configured",
          prompt: `Print the numbers from 1 to \`n\`, except that multiples of \`a\` print \`Fizz\`, multiples of \`b\` print \`Buzz\`, and multiples of both print \`FizzBuzz\`.

**Input:** one line \`n a b\` with \`n >= 1\` and \`a, b >= 1\`.
**Output:** \`n\` lines.

\`\`\`text
6 2 3
\`\`\`
prints
\`\`\`text
1
Fizz
Buzz
Fizz
5
FizzBuzz
\`\`\``,
          starter: String.raw`n, a, b = map(int, input().split())
for i in range(1, n + 1):
    # TODO
    pass
`,
          solution: String.raw`n, a, b = map(int, input().split())
for i in range(1, n + 1):
    word = ""
    if i % a == 0:
        word += "Fizz"
    if i % b == 0:
        word += "Buzz"
    print(word or i)
`,
          hints: [
            "Build the word from two independent tests, then print the number when the word is empty.",
            "`print(word or i)` uses `or` returning an operand — the empty string is falsy.",
          ],
          cases: [
            { stdin: "6 2 3\n", expected: "1\nFizz\nBuzz\nFizz\n5\nFizzBuzz\n" },
            { stdin: "15 3 5\n", expected: "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz\n", hidden: true },
            { stdin: "1 2 2\n", expected: "1\n", hidden: true },
            { stdin: "4 1 4\n", expected: "Fizz\nFizz\nFizz\nFizzBuzz\n", hidden: true },
          ],
        },
        {
          title: "Primes up to n",
          prompt: `List every prime up to and including \`n\`. Test each candidate by trial division in a \`for\` loop over the possible divisors from 2 up to its square root, using the loop's \`else\` clause to record that no divisor was found.

**Input:** one integer \`n >= 0\`.
**Output:** \`primes: <space-separated primes>\` (or \`primes: none\`), then \`count: <k>\`.

\`\`\`text
10
\`\`\`
prints
\`\`\`text
primes: 2 3 5 7
count: 4
\`\`\``,
          starter: String.raw`import math

n = int(input())
primes = []
for candidate in range(2, n + 1):
    # TODO: for d in range(2, math.isqrt(candidate) + 1): ... break ... else: primes.append(candidate)
    pass
# TODO: print the two lines
`,
          solution: String.raw`import math

n = int(input())
primes = []
for candidate in range(2, n + 1):
    for d in range(2, math.isqrt(candidate) + 1):
        if candidate % d == 0:
            break
    else:
        primes.append(candidate)
print("primes:", " ".join(map(str, primes)) if primes else "none")
print(f"count: {len(primes)}")
`,
          hints: [
            "`math.isqrt(candidate)` is the largest divisor worth testing; `range` needs `+ 1` to include it.",
            "The inner `else` runs only when no `break` happened — the candidate is prime.",
          ],
          cases: [
            { stdin: "10\n", expected: "primes: 2 3 5 7\ncount: 4\n" },
            { stdin: "1\n", expected: "primes: none\ncount: 0\n", hidden: true },
            { stdin: "2\n", expected: "primes: 2\ncount: 1\n", hidden: true },
            { stdin: "30\n", expected: "primes: 2 3 5 7 11 13 17 19 23 29\ncount: 10\n", hidden: true },
          ],
        },
        {
          title: "Bank account",
          prompt: `Run a bank account from commands read until the end of input, dispatching each with \`match\` on \`line.split()\`. \`deposit n\` adds \`n\` and prints \`ok <balance>\`; \`withdraw n\` subtracts \`n\` and prints \`ok <balance>\`, or \`insufficient funds\` if the balance would go negative; \`balance\` prints \`balance <balance>\`. A deposit or withdrawal whose amount is not positive prints \`invalid amount\` (use a guard). Anything else prints \`unknown: <line>\`. Amounts are integers.

**Input:** commands, one per line.
**Output:** one line per command.

\`\`\`text
deposit 100
withdraw 30
balance
withdraw 100
deposit -5
foo
\`\`\`
prints
\`\`\`text
ok 100
ok 70
balance 70
insufficient funds
invalid amount
unknown: foo
\`\`\``,
          starter: String.raw`import sys

balance = 0
for line in sys.stdin:
    line = line.rstrip("\n")
    parts = line.split()
    if len(parts) == 2 and parts[0] in ("deposit", "withdraw"):
        parts[1] = int(parts[1])
    match parts:
        # TODO: guarded cases for non-positive amounts, then deposit / withdraw / balance / _
        case _:
            print(f"unknown: {line}")
`,
          solution: String.raw`import sys

balance = 0
for line in sys.stdin:
    line = line.rstrip("\n")
    parts = line.split()
    if len(parts) == 2 and parts[0] in ("deposit", "withdraw"):
        parts[1] = int(parts[1])
    match parts:
        case ["deposit" | "withdraw", amount] if amount <= 0:
            print("invalid amount")
        case ["deposit", amount]:
            balance += amount
            print(f"ok {balance}")
        case ["withdraw", amount] if amount > balance:
            print("insufficient funds")
        case ["withdraw", amount]:
            balance -= amount
            print(f"ok {balance}")
        case ["balance"]:
            print(f"balance {balance}")
        case _:
            print(f"unknown: {line}")
`,
          hints: [
            "An or-pattern `\"deposit\" | \"withdraw\"` with a guard handles the invalid amount once for both commands.",
            "Guarded cases go before the unguarded ones with the same shape.",
          ],
          cases: [
            { stdin: "deposit 100\nwithdraw 30\nbalance\nwithdraw 100\ndeposit -5\nfoo\n", expected: "ok 100\nok 70\nbalance 70\ninsufficient funds\ninvalid amount\nunknown: foo\n" },
            { stdin: "balance\nwithdraw 1\n", expected: "balance 0\ninsufficient funds\n", hidden: true },
            { stdin: "deposit 5\ndeposit 5\nwithdraw 10\nbalance\nwithdraw 0\n", expected: "ok 5\nok 10\nok 0\nbalance 0\ninvalid amount\n", hidden: true },
            { stdin: "deposit\nbalance now\n", expected: "unknown: deposit\nunknown: balance now\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this print?\n\n```python\nfor i in range(5):\n    if i == 3:\n        break\nelse:\n    print(\"done\")\nprint(i)\n```",
          options: ["`done` then `3`", "`3`", "`done` then `4`", "`4`"],
          answer: 1,
          explanation: "The `break` skips the loop's `else`, and the loop variable keeps the value it had when the loop was left.",
        },
        {
          prompt: "What is `list(range(10, 0, -3))`?",
          options: ["`[10, 7, 4, 1]`", "`[10, 7, 4, 1, 0]`", "`[]`", "`[9, 6, 3, 0]`"],
          answer: 0,
          explanation: "Counting down by 3 from 10 while staying above the excluded stop 0 gives 10, 7, 4, 1.",
        },
        {
          prompt: "Which condition tests whether `x` lies in the closed range 1–10?",
          options: ["`1 <= x <= 10`", "`1 <= x and <= 10`", "`x in [1, 10]`", "`x >= 1 or x <= 10`"],
          answer: 0,
          explanation: "Comparison chaining reads as mathematics. The second is a syntax error, the third tests membership in a two-element list, and the fourth is true for every number.",
        },
        {
          prompt: "What does this print?\n\n```python\nn = 10\nwhile n:\n    n //= 2\n    print(n, end=\" \")\n```",
          options: ["`5 2 1 0`", "`5 2 1`", "`10 5 2 1 0`", "It loops forever"],
          answer: 0,
          explanation: "The loop runs while `n` is truthy (non-zero); each pass halves and prints, including the final `0`, after which the condition is false.",
        },
        {
          prompt: "Which loop visits every element of `xs` together with its index?",
          options: ["`for i, x in enumerate(xs):`", "`for x, i in xs:`", "`for i in xs.index():`", "`for x in xs[i]:`"],
          answer: 0,
          explanation: "`enumerate` is the idiom; the others are errors or nonsense (`xs.index()` needs an argument; `xs[i]` needs `i` defined).",
        },
        {
          prompt: "In a `match`, which pattern compares the subject with the constant `Status.OK` rather than capturing it?",
          options: ["`case Status.OK:`", "`case OK:`", "`case \"Status.OK\":`", "`case status_ok:`"],
          answer: 0,
          explanation: "A dotted name is a value pattern. Bare identifiers capture; the quoted form compares with a string, which is a different value.",
        },
        {
          prompt: "What does `zip(names, scores, strict=True)` do when `names` has 3 elements and `scores` has 2?",
          options: ["Raises `ValueError` when the mismatch is reached", "Pads with `None`", "Truncates silently", "Raises `IndexError` immediately"],
          answer: 0,
          explanation: "`strict=True` (3.10) raises `ValueError` once one iterable is exhausted before the others. The default truncates; `zip_longest` pads.",
        },
        {
          prompt: "Which is the correct way to remove the even numbers from `xs`?",
          options: ["`xs = [x for x in xs if x % 2]`", "`for x in xs: if x % 2 == 0: xs.remove(x)`", "`for i in range(len(xs)): del xs[i]`", "`xs.remove(x % 2 == 0)`"],
          answer: 0,
          explanation: "Build a new list; removing while iterating skips elements, deleting by index shifts the rest and eventually raises `IndexError`, and the last removes the value `False`.",
        },
        {
          prompt: "What does `\" \".join(str(x) for x in [1, 2, 3])` produce?",
          options: ["`'1 2 3'`", "`'[1, 2, 3]'`", "`TypeError`", "`'123'`"],
          answer: 0,
          explanation: "`join` takes an iterable of strings; the generator converts each int. Joining ints directly would be the `TypeError`.",
        },
        {
          prompt: "In the two-pointer pair-sum loop over a sorted list, why does moving the left pointer up when the sum is too small never miss an answer?",
          options: [
            "Because the right element is the largest remaining, so no pair using the current left element can reach the target",
            "Because sums are always increasing",
            "Because the list has no duplicates",
            "It can miss answers; the algorithm is a heuristic",
          ],
          answer: 0,
          explanation: "With `xs[j]` the largest candidate partner and the sum still too small, every pair with `xs[i]` is too small; discarding `i` loses nothing. The symmetric argument justifies moving `j` down.",
        },
        {
          prompt: "What does `case [\"go\", *rest] if rest:` require?",
          options: ["A list starting with `\"go\"` followed by at least one more element", "Exactly `[\"go\"]`", "Any list containing `\"go\"`", "A string starting with `go`"],
          answer: 0,
          explanation: "The starred name captures the remainder as a list, and the guard requires it to be non-empty. Strings never match sequence patterns.",
        },
        {
          prompt: "What does `sum(1 for _ in range(4))` evaluate to?",
          options: ["`4`", "`6`", "`10`", "`TypeError`"],
          answer: 0,
          explanation: "The generator yields `1` four times; summing counts the iterations. `_` marks the unused loop variable.",
        },
      ],
    },
  ],
});
