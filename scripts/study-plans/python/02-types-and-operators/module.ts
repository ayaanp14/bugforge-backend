import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "types-and-operators",
  title: "Values, types and operators",
  blurb: "Arbitrary-precision integers and floor division, floating point and the rules for comparing and printing it, truthiness and what and/or return, names bound to objects, explicit conversions and their errors, and operator precedence with the bitwise idioms.",
  icon: "type",
  overview: `Python's values are objects and its variables are names, and the whole module is a consequence of taking those two facts seriously. An integer never overflows because the object grows; a float is a binary double and \`0.1 + 0.2\` shows it; every object is truthy or falsy and \`and\`/\`or\` hand back an operand rather than a boolean; assignment binds a name and never copies, so whether a change is shared depends on whether the object is mutable; and nothing converts between text and numbers unless you call the type. Learners who arrive from C or Java carry a box model and a truncating division, and this module replaces both.

The six lessons take the built-in scalar types in turn. Numbers fixes the semantics of \`/\`, \`//\`, \`%\` and \`**\`, the half-to-even \`round\`, and the \`math\` integer functions. Floating point explains representation error once and gives the three rules — \`math.isclose\` instead of \`==\`, format on output, \`fsum\` or integer cents when accumulating — plus \`Decimal\` and \`Fraction\` for exactness. Booleans and truthiness gives the table, the operand-returning \`and\`/\`or\`, \`None\` and \`is\`. Names and binding builds the rebinding-versus-mutation model that Module 6 relies on. Conversions lists what \`int\`, \`float\`, \`str\` and the container constructors accept and raise. Operators and precedence gives the table and the bitwise idioms on unbounded integers.

The exercises are whole programs that make each rule observable: floor versus truncating division across every sign combination, a big-power report, a three-way sum that shows \`sum\`, \`fsum\` and \`Decimal\` disagreeing, money kept in cents, a truthiness classifier over Python literals, chained comparisons with missing values, a tiny binding machine that distinguishes aliases from copies, a walrus-driven reader, a token classifier, a base converter, a permission mask, and an evaluator that contrasts precedence with left-to-right reading. The checkpoint adds a digit-and-bit report, a formatted temperature table, and an exact-change calculator.`,
  lessons: [
    {
      slug: "numbers",
      file: "01-numbers.md",
      exercises: [
        {
          title: "Floor versus truncation",
          prompt: `Show the difference between Python's floor division and the truncating division of C and Java. For each pair \`a b\` (with \`b\` never zero) print Python's \`a // b\` and \`a % b\`, then the truncating quotient (rounded toward zero) and the remainder that goes with it, \`a - b * tq\`. Compute the truncating quotient with integer arithmetic on absolute values — no floats.

**Input:** \`n\`, then \`n\` lines \`a b\`.
**Output:** one line per pair: \`<a> <b>: floor <q> <r> | trunc <tq> <tr>\`.

\`\`\`text
2
7 2
-7 2
\`\`\`
prints
\`\`\`text
7 2: floor 3 1 | trunc 3 1
-7 2: floor -4 1 | trunc -3 -1
\`\`\``,
          starter: String.raw`n = int(input())
for _ in range(n):
    a, b = map(int, input().split())
    q, r = divmod(a, b)
    # TODO: compute the truncating quotient tq (toward zero) and tr = a - b * tq
    tq = 0
    tr = 0
    print(f"{a} {b}: floor {q} {r} | trunc {tq} {tr}")
`,
          solution: String.raw`n = int(input())
for _ in range(n):
    a, b = map(int, input().split())
    q, r = divmod(a, b)
    tq = abs(a) // abs(b)
    if (a < 0) != (b < 0):
        tq = -tq
    tr = a - b * tq
    print(f"{a} {b}: floor {q} {r} | trunc {tq} {tr}")
`,
          hints: [
            "`divmod(a, b)` gives Python's floor quotient and remainder in one call.",
            "The magnitude of the truncating quotient is `abs(a) // abs(b)`; it is negative exactly when the signs differ.",
            "The remainder that pairs with any quotient is `a - b * quotient`.",
          ],
          cases: [
            { stdin: "2\n7 2\n-7 2\n", expected: "7 2: floor 3 1 | trunc 3 1\n-7 2: floor -4 1 | trunc -3 -1\n" },
            { stdin: "2\n7 -2\n-7 -2\n", expected: "7 -2: floor -4 -1 | trunc -3 1\n-7 -2: floor 3 -1 | trunc 3 -1\n" },
            { stdin: "3\n10 3\n0 5\n-9 3\n", expected: "10 3: floor 3 1 | trunc 3 1\n0 5: floor 0 0 | trunc 0 0\n-9 3: floor -3 0 | trunc -3 0\n", hidden: true },
            { stdin: "2\n1 -4\n-1 4\n", expected: "1 -4: floor -1 -3 | trunc 0 1\n-1 4: floor -1 3 | trunc 0 -1\n", hidden: true },
          ],
        },
        {
          title: "Big powers",
          prompt: `Integers do not overflow. Read \`n\` and \`k\` and compute \`n ** k\` exactly, then report the number of decimal digits, the last four digits (zero-padded), the number of bits needed (\`int.bit_length\`) and the number of set bits (\`int.bit_count\`).

**Input:** one line \`n k\` with \`n >= 1\`, \`k >= 0\`.
**Output:** four lines: \`digits <d>\`, \`last4 <dddd>\`, \`bits <b>\`, \`ones <c>\`.

\`\`\`text
2 100
\`\`\`
prints
\`\`\`text
digits 31
last4 5376
bits 101
ones 1
\`\`\``,
          starter: String.raw`n, k = map(int, input().split())
value = n ** k
# TODO: print the four lines
`,
          solution: String.raw`n, k = map(int, input().split())
value = n ** k
print(f"digits {len(str(value))}")
print(f"last4 {value % 10_000:04d}")
print(f"bits {value.bit_length()}")
print(f"ones {value.bit_count()}")
`,
          hints: [
            "`len(str(value))` counts decimal digits of a non-negative integer.",
            "`value % 10_000` keeps the last four digits; the `:04d` spec pads them with zeros.",
            "`bit_length()` and `bit_count()` are methods on every int.",
          ],
          cases: [
            { stdin: "2 100\n", expected: "digits 31\nlast4 5376\nbits 101\nones 1\n" },
            { stdin: "7 1\n", expected: "digits 1\nlast4 0007\nbits 3\nones 3\n" },
            { stdin: "12 34\n", expected: "digits 37\nlast4 8064\nbits 122\nones 29\n", hidden: true },
            { stdin: "3 200\n", expected: "digits 96\nlast4 4001\nbits 317\nones 178\n", hidden: true },
            { stdin: "10 10\n", expected: "digits 11\nlast4 0000\nbits 34\nones 11\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `print(-7 // 2, -7 % 2)` print?",
          options: ["`-3 -1`", "`-4 1`", "`-3 1`", "`-4 -1`"],
          answer: 1,
          explanation: "Floor division rounds toward negative infinity, so −3.5 becomes −4, and the remainder takes the sign of the divisor so that `2 * -4 + 1 == -7`. `-3 -1` is what a truncating language gives.",
        },
        {
          prompt: "What is `type(6 / 3)`?",
          options: ["`int`", "`float`", "It depends on whether the division is exact", "`Fraction`"],
          answer: 1,
          explanation: "True division always returns a float in Python 3, exact or not: `6 / 3` is `2.0`. Use `//` when an integer is wanted.",
        },
        {
          prompt: "What does `print(round(2.5), round(3.5))` print?",
          options: ["`3 4`", "`2 4`", "`2 3`", "`3 3`"],
          answer: 1,
          explanation: "`round` uses round-half-to-even: 2.5 goes to the even neighbour 2, 3.5 to the even neighbour 4. Always rounding halves up would bias sums upward.",
        },
        {
          prompt: "Which expression computes `3 ** 100000 % 1000000007` fastest?",
          options: ["`3 ** 100000 % 1000000007`", "`pow(3, 100000, 1000000007)`", "`(3 % 1000000007) ** 100000`", "`math.pow(3, 100000) % 1000000007`"],
          answer: 1,
          explanation: "Three-argument `pow` does modular exponentiation without ever building the 47 000-digit intermediate. The first option is correct but builds it; the third still builds it; `math.pow` returns a float and overflows.",
        },
        {
          prompt: "What is `-2 ** 2`?",
          options: ["`4`", "`-4`", "`SyntaxError`", "`0`"],
          answer: 1,
          explanation: "`**` binds tighter than unary minus, so the expression is `-(2 ** 2)`. Parenthesise `(-2) ** 2` to square a negative number.",
        },
        {
          prompt: "Which is the exact test for whether a large integer `n` is a perfect square?",
          options: ["`int(math.sqrt(n)) ** 2 == n`", "`math.isqrt(n) ** 2 == n`", "`math.sqrt(n) == int(math.sqrt(n))`", "`n ** 0.5 == int(n ** 0.5)`"],
          answer: 1,
          explanation: "`math.isqrt` computes the integer square root exactly for any size of int. The float-based tests lose precision above 2⁵³ and can report a near-square as a square.",
        },
      ],
    },
    {
      slug: "floating-point",
      file: "02-floating-point.md",
      exercises: [
        {
          title: "Three ways to add",
          prompt: `Read one line of decimal numbers written as text and add them three ways: as floats with the built-in \`sum\`, as floats with \`math.fsum\`, and as \`decimal.Decimal\` values constructed **from the strings**. Print each result exactly as Python prints it (\`print(x)\` — no format spec), so that the representation error is visible where it exists.

**Input:** one line of decimal numbers.
**Output:** three lines: \`float <sum>\`, \`fsum <fsum>\`, \`decimal <sum>\`.

\`\`\`text
0.1 0.2 0.3
\`\`\`
prints
\`\`\`text
float 0.6000000000000001
fsum 0.6
decimal 0.6
\`\`\``,
          starter: String.raw`import math
from decimal import Decimal

tokens = input().split()
# TODO: three sums; print each with a plain print (no format spec)
`,
          solution: String.raw`import math
from decimal import Decimal

tokens = input().split()
floats = [float(t) for t in tokens]
print(f"float {sum(floats)}")
print(f"fsum {math.fsum(floats)}")
print(f"decimal {sum(Decimal(t) for t in tokens)}")
`,
          hints: [
            "Build the list of floats once and pass it to both `sum` and `math.fsum`.",
            "`Decimal(t)` from the *string* token is exact; `Decimal(float(t))` would copy the float's error.",
            "An f-string with no format spec prints the value the same way `print` does.",
          ],
          cases: [
            { stdin: "0.1 0.2 0.3\n", expected: "float 0.6000000000000001\nfsum 0.6\ndecimal 0.6\n" },
            { stdin: "0.1 0.1 0.1 0.1 0.1 0.1 0.1 0.1 0.1 0.1\n", expected: "float 0.9999999999999999\nfsum 1.0\ndecimal 1.0\n" },
            { stdin: "1.5 2.25\n", expected: "float 3.75\nfsum 3.75\ndecimal 3.75\n", hidden: true },
            { stdin: "10.00 0.10\n", expected: "float 10.1\nfsum 10.1\ndecimal 10.10\n", hidden: true },
          ],
        },
        {
          title: "Money in cents",
          prompt: `Prices are text with exactly two decimals. Add up an order **without ever creating a float**: convert each price to integer cents by splitting on the dot, multiply by the quantity, sum, and print the total formatted back as pounds and pence.

**Input:** \`n\`, then \`n\` lines \`price qty\`.
**Output:** \`total <pounds>.<pence>\` with two digits of pence.

\`\`\`text
3
0.10 3
0.20 3
19.99 1
\`\`\`
prints
\`\`\`text
total 20.89
\`\`\``,
          starter: String.raw`n = int(input())
cents = 0
for _ in range(n):
    price, qty = input().split()
    # TODO: pounds, pence = price.split("."); accumulate integer cents
print(f"total {cents // 100}.{cents % 100:02d}")
`,
          solution: String.raw`n = int(input())
cents = 0
for _ in range(n):
    price, qty = input().split()
    pounds, pence = price.split(".")
    cents += (int(pounds) * 100 + int(pence)) * int(qty)
print(f"total {cents // 100}.{cents % 100:02d}")
`,
          hints: [
            "`price.split(\".\")` gives the pounds and the two pence digits as strings.",
            "Integer cents are `int(pounds) * 100 + int(pence)`; multiply by the quantity and add.",
            "`cents // 100` and `cents % 100` split the total back; `:02d` keeps the leading zero in `.05`.",
          ],
          cases: [
            { stdin: "3\n0.10 3\n0.20 3\n19.99 1\n", expected: "total 20.89\n" },
            { stdin: "1\n0.05 3\n", expected: "total 0.15\n", hidden: true },
            { stdin: "2\n100.00 2\n0.01 1\n", expected: "total 200.01\n", hidden: true },
            { stdin: "0\n", expected: "total 0.00\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Why is `0.1 + 0.2 == 0.3` false?",
          options: [
            "Python's addition is imprecise for small numbers",
            "None of 0.1, 0.2 and 0.3 is exactly representable in binary, and the rounded sum of the first two is a different double from the rounded 0.3",
            "The `==` operator compares floats by identity",
            "Because `0.3` is parsed as a `Decimal`",
          ],
          answer: 1,
          explanation: "Every language with IEEE doubles has the same result; it is representation error in the inputs, not a flaw in addition. `math.isclose` is the comparison to use.",
        },
        {
          prompt: "What does `f\"{2.675:.2f}\"` evaluate to?",
          options: ["`'2.68'`", "`'2.67'`", "`'2.675'`", "`'2.7'`"],
          answer: 1,
          explanation: "The double nearest 2.675 is slightly below it (2.67499999…), so correct rounding of the stored value gives 2.67. When half-up rounding of a decimal is required, use `Decimal(\"2.675\").quantize(...)`.",
        },
        {
          prompt: "Which expression is exactly one tenth?",
          options: ["`Decimal(0.1)`", "`Decimal(\"0.1\")`", "`float(\"0.1\")`", "`round(0.1, 1)`"],
          answer: 1,
          explanation: "Constructing a `Decimal` from the string parses the decimal digits exactly. `Decimal(0.1)` faithfully copies the float's binary approximation, and the two float options are the approximation itself.",
        },
        {
          prompt: "What does `print(sum([0.1] * 10), math.fsum([0.1] * 10))` print?",
          options: ["`1.0 1.0`", "`0.9999999999999999 1.0`", "`1.0 0.9999999999999999`", "`0.9999999999999999 0.9999999999999999`"],
          answer: 1,
          explanation: "Left-to-right float addition accumulates rounding error; `fsum` tracks the lost low-order bits and returns the correctly rounded result, which is exactly 1.0.",
        },
        {
          prompt: "What is `float(\"nan\") == float(\"nan\")`?",
          options: ["`True`", "`False`", "It raises `ValueError`", "`None`"],
          answer: 1,
          explanation: "NaN compares unequal to everything, including itself, by the IEEE rules. `math.isnan(x)` is the readable test; `x != x` is the classic one.",
        },
        {
          prompt: "What happens on `1.0 / 0`?",
          options: ["`inf`", "`nan`", "`ZeroDivisionError`", "`OverflowError`"],
          answer: 2,
          explanation: "Unlike C, Python raises on float division by zero rather than producing infinity. Overflowing multiplication (`1e308 * 10`) does give `inf`, and `**` overflow raises `OverflowError`.",
        },
      ],
    },
    {
      slug: "booleans-and-truthiness",
      file: "03-booleans-and-truthiness.md",
      exercises: [
        {
          title: "Truthy or falsy",
          prompt: `Read \`n\` Python literals, one per line — numbers, strings in quotes, lists, tuples, dicts, \`None\`, \`True\`/\`False\` — turn each into a value with \`ast.literal_eval\` (which parses literals without running code) and report its truth value.

**Input:** \`n\`, then \`n\` literals.
**Output:** \`<literal as written> is truthy\` or \`... is falsy\`.

\`\`\`text
4
0
""
[0]
"False"
\`\`\`
prints
\`\`\`text
0 is falsy
"" is falsy
[0] is truthy
"False" is truthy
\`\`\``,
          starter: String.raw`import ast

n = int(input())
for _ in range(n):
    text = input()
    value = ast.literal_eval(text)
    # TODO: print whether value is truthy or falsy
`,
          solution: String.raw`import ast

n = int(input())
for _ in range(n):
    text = input()
    value = ast.literal_eval(text)
    word = "truthy" if value else "falsy"
    print(f"{text} is {word}")
`,
          hints: [
            "`bool(value)` or simply `if value:` applies the truthiness rules.",
            "Print the original text, not the parsed value — `\"\"` must stay as typed.",
          ],
          cases: [
            { stdin: "5\n0\n\"\"\n[]\n[0]\nNone\n", expected: "0 is falsy\n\"\" is falsy\n[] is falsy\n[0] is truthy\nNone is falsy\n" },
            { stdin: "4\n\"False\"\n0.0\n{}\n-1\n", expected: "\"False\" is truthy\n0.0 is falsy\n{} is falsy\n-1 is truthy\n" },
            { stdin: "4\n\" \"\n(0,)\n{0: 0}\nFalse\n", expected: "\" \" is truthy\n(0,) is truthy\n{0: 0} is truthy\nFalse is falsy\n", hidden: true },
            { stdin: "3\n0j\n\"0\"\n()\n", expected: "0j is falsy\n\"0\" is truthy\n() is falsy\n", hidden: true },
          ],
        },
        {
          title: "Chained comparison with missing values",
          prompt: `Each line holds three values \`a b c\`, each an integer or \`-\` meaning missing. Decide whether \`a < b < c\` holds using a **chained comparison**; when any value is missing the answer is \`unknown\`. Represent a missing value as \`None\` and test for it with \`is None\`.

**Input:** \`n\`, then \`n\` lines.
**Output:** \`True\`, \`False\` or \`unknown\` per line.

\`\`\`text
4
1 2 3
3 2 1
1 - 3
2 2 3
\`\`\`
prints
\`\`\`text
True
False
unknown
False
\`\`\``,
          starter: String.raw`def parse(tok):
    # TODO: return None for "-", otherwise the integer
    return None


n = int(input())
for _ in range(n):
    a, b, c = (parse(tok) for tok in input().split())
    # TODO: print unknown when any is None, else the chained comparison
`,
          solution: String.raw`def parse(tok):
    return None if tok == "-" else int(tok)


n = int(input())
for _ in range(n):
    a, b, c = (parse(tok) for tok in input().split())
    if a is None or b is None or c is None:
        print("unknown")
    else:
        print(a < b < c)
`,
          hints: [
            "A conditional expression turns `-` into `None` and anything else into `int(tok)`.",
            "`print(a < b < c)` prints the boolean directly as `True` or `False`.",
            "Test `is None`, not truthiness — `0` is a legitimate value here.",
          ],
          cases: [
            { stdin: "4\n1 2 3\n3 2 1\n1 - 3\n2 2 3\n", expected: "True\nFalse\nunknown\nFalse\n" },
            { stdin: "3\n-5 0 5\n- - -\n1 3 2\n", expected: "True\nunknown\nFalse\n", hidden: true },
            { stdin: "2\n0 0 0\n-1 0 1\n", expected: "False\nTrue\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which of these values is truthy?",
          options: ["`\"\"`", "`[0]`", "`0.0`", "`None`"],
          answer: 1,
          explanation: "A non-empty list is truthy regardless of what it contains — `[0]`, `[None]`, `[[]]` are all true. The empty string, zero of any numeric type and `None` are falsy.",
        },
        {
          prompt: "What does `print(0 or \"x\", 3 and 0, \"\" and 5)` print?",
          options: ["`True False False`", "`x 0 `", "`x 0 5`", "`0 3 5`"],
          answer: 1,
          explanation: "`or` returns the first truthy operand or the last one (`\"x\"`); `and` returns the first falsy operand or the last one — `0` for `3 and 0`, and the empty string for `\"\" and 5`. They return operands, not booleans.",
        },
        {
          prompt: "Why should `x is None` be used rather than `x == None`?",
          options: [
            "`==` cannot compare with `None`",
            "`is` is faster and a class could define `__eq__` to say it equals `None`; identity asks the exact question",
            "`x == None` is a syntax error",
            "There is no difference",
          ],
          answer: 1,
          explanation: "`None` is a singleton, so identity is exact and cannot be overridden by a custom `__eq__`. Equality works most of the time, which is what makes the rare surprise hard to find.",
        },
        {
          prompt: "What does `0 <= i < len(xs)` mean?",
          options: ["`(0 <= i) < len(xs)`", "`0 <= i and i < len(xs)`, with `i` evaluated once", "`0 <= (i < len(xs))`", "A syntax error"],
          answer: 1,
          explanation: "Comparison operators chain: each adjacent pair is compared with `and` between them. This is the idiomatic bounds check; in C the same text would compare a boolean with a length.",
        },
        {
          prompt: "What does `print(True + True, sum([True, False, True]))` print?",
          options: ["`TypeError`", "`2 2`", "`True 2`", "`2 True`"],
          answer: 1,
          explanation: "`bool` is a subclass of `int` with values 1 and 0, so booleans add and sum like integers. Counting matches with `sum(cond for ...)` relies on exactly this.",
        },
        {
          prompt: "`count = 0` is a genuine result. What is wrong with `value = count or 10`?",
          options: [
            "Nothing — it gives 0",
            "It gives 10, because 0 is falsy and `or` moves on to the fallback",
            "It raises `TypeError`",
            "It gives `True`",
          ],
          answer: 1,
          explanation: "`or` cannot tell a missing value from a falsy one. When zero, an empty string or an empty list is meaningful, write `count if count is not None else 10`.",
        },
      ],
    },
    {
      slug: "variables-and-binding",
      file: "04-variables-and-binding.md",
      exercises: [
        {
          title: "A tiny binding machine",
          prompt: `Simulate names bound to list objects. Read commands until the end of input: \`new X\` binds \`X\` to a fresh empty list; \`alias Y X\` binds \`Y\` to **the same object** as \`X\`; \`copy Y X\` binds \`Y\` to a **shallow copy** of \`X\`'s list; \`push X v\` appends the integer \`v\` to \`X\`'s list; \`show X\` prints the list. The point is that a push through an alias is visible through the original, and a push through a copy is not.

**Input:** commands, one per line.
**Output:** for every \`show\`: \`<name>: <elements separated by spaces>\` or \`<name>: (empty)\`.

\`\`\`text
new a
alias b a
push b 1
copy c a
push a 2
show a
show b
show c
\`\`\`
prints
\`\`\`text
a: 1 2
b: 1 2
c: 1
\`\`\``,
          starter: String.raw`import sys

names = {}
for line in sys.stdin:
    parts = line.split()
    if not parts:
        continue
    cmd = parts[0]
    # TODO: implement new, alias, copy, push, show
`,
          solution: String.raw`import sys

names = {}
for line in sys.stdin:
    parts = line.split()
    if not parts:
        continue
    cmd = parts[0]
    if cmd == "new":
        names[parts[1]] = []
    elif cmd == "alias":
        names[parts[1]] = names[parts[2]]
    elif cmd == "copy":
        names[parts[1]] = list(names[parts[2]])
    elif cmd == "push":
        names[parts[1]].append(int(parts[2]))
    elif cmd == "show":
        items = names[parts[1]]
        body = " ".join(map(str, items)) if items else "(empty)"
        print(f"{parts[1]}: {body}")
`,
          hints: [
            "Keep a dict from name to list; `alias` stores the very same list object under a second key.",
            "`list(xs)` (or `xs.copy()`) makes an independent shallow copy for `copy`.",
            "`\" \".join(map(str, items))` prints the elements; check emptiness first.",
          ],
          cases: [
            { stdin: "new a\nalias b a\npush b 1\ncopy c a\npush a 2\nshow a\nshow b\nshow c\n", expected: "a: 1 2\nb: 1 2\nc: 1\n" },
            { stdin: "new x\nshow x\nalias y x\npush x 5\ncopy z y\npush z 6\nshow y\nshow z\n", expected: "x: (empty)\ny: 5\nz: 5 6\n", hidden: true },
            { stdin: "new a\ncopy b a\npush a 1\npush b 2\nalias c b\npush c 3\nshow a\nshow b\nshow c\n", expected: "a: 1\nb: 2 3\nc: 2 3\n", hidden: true },
          ],
        },
        {
          title: "Walrus reads",
          prompt: `Read lines until a line that is exactly \`END\` using a single \`while\` whose condition assigns and tests with the walrus operator: \`while (line := input()) != "END":\`. Print the length of every line before \`END\`, then the number of lines read.

**Input:** lines, the last of which is \`END\` (anything after it is ignored).
**Output:** one length per line, then \`count: <n>\`.

\`\`\`text
hello
hi
END
\`\`\`
prints
\`\`\`text
5
2
count: 2
\`\`\``,
          starter: String.raw`count = 0
# TODO: while (line := input()) != "END": ...
print(f"count: {count}")
`,
          solution: String.raw`count = 0
while (line := input()) != "END":
    print(len(line))
    count += 1
print(f"count: {count}")
`,
          hints: [
            "The walrus binds `line` and the comparison uses the same value in one expression.",
            "The parentheses around the assignment expression are required in this position.",
          ],
          cases: [
            { stdin: "hello\nhi\nEND\n", expected: "5\n2\ncount: 2\n" },
            { stdin: "END\n", expected: "count: 0\n", hidden: true },
            { stdin: "a b c\n\nEND\nignored\n", expected: "5\n0\ncount: 2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this print?\n\n```python\na = [1, 2]\nb = a\nb = b + [3]\nprint(a)\n```",
          options: ["`[1, 2, 3]`", "`[1, 2]`", "`[3]`", "`[1, 2, [3]]`"],
          answer: 1,
          explanation: "`b + [3]` builds a new list and the assignment rebinds `b` to it; `a` still labels the original. Had the line been `b += [3]`, the list would have been extended in place and `a` would show `[1, 2, 3]`.",
        },
        {
          prompt: "What does this print?\n\n```python\ndef bump(n):\n    n += 1\n\nx = 5\nbump(x)\nprint(x)\n```",
          options: ["`6`", "`5`", "`None`", "`TypeError`"],
          answer: 1,
          explanation: "Integers are immutable; `n += 1` rebinds the local name `n` to a new int and the caller's binding is untouched. The function would need to `return n` and the caller to assign it.",
        },
        {
          prompt: "After `x = y = []` and `x.append(1)`, what is `y`?",
          options: ["`[]`", "`[1]`", "`None`", "`NameError`"],
          answer: 1,
          explanation: "Chained assignment binds both names to the one list object created on the right. Mutating it through `x` is visible through `y`. For two independent lists write two assignments.",
        },
        {
          prompt: "Which statement about mutability is correct?",
          options: [
            "Strings are mutable; `s.upper()` changes `s` in place",
            "Tuples are immutable, but a list inside a tuple can still be mutated",
            "Lists are immutable once passed to a function",
            "Integers are mutable; `n += 1` changes the object",
          ],
          answer: 1,
          explanation: "A tuple cannot be rebound element-wise, but it holds references, and a mutable element such as a list can be changed through it: `t = ([],); t[0].append(1)` works. Strings and ints never change in place; every apparent change is a new object.",
        },
        {
          prompt: "What does `if (n := len(xs)) > 3: print(n)` do?",
          options: [
            "Syntax error — assignment is not allowed in a condition",
            "Binds `n` to the length and prints it when it exceeds 3",
            "Compares `len(xs)` with 3 and prints `True`",
            "Binds `n` to `True` or `False`",
          ],
          answer: 1,
          explanation: "The walrus operator is an assignment *expression*: it binds `n` and evaluates to the bound value, so the comparison uses the length and the body can reuse `n`. Ordinary `=` in that position would be the syntax error.",
        },
      ],
    },
    {
      slug: "conversions",
      file: "05-conversions.md",
      exercises: [
        {
          title: "Parse or reject",
          prompt: `Classify every token on a line by trying the strict conversion first: if \`int(tok)\` succeeds it is an \`int\`; otherwise if \`float(tok)\` succeeds it is a \`float\`; otherwise it is \`text\`. Print the parsed value for numbers (a float prints as Python prints it) and the token itself for text.

**Input:** one line of whitespace-separated tokens.
**Output:** one line per token: \`int <v>\`, \`float <v>\` or \`text <tok>\`.

\`\`\`text
42 3.5 1e3 abc 0x1f -7 inf
\`\`\`
prints
\`\`\`text
int 42
float 3.5
float 1000.0
text abc
text 0x1f
int -7
float inf
\`\`\``,
          starter: String.raw`def classify(tok):
    # TODO: try int, then float, catching ValueError; return ("int", value) etc.
    return "text", tok


for tok in input().split():
    kind, value = classify(tok)
    print(kind, value)
`,
          solution: String.raw`def classify(tok):
    try:
        return "int", int(tok)
    except ValueError:
        pass
    try:
        return "float", float(tok)
    except ValueError:
        return "text", tok


for tok in input().split():
    kind, value = classify(tok)
    print(kind, value)
`,
          hints: [
            "`int(\"3.5\")` raises `ValueError`; catch it and move on to `float`.",
            "Return a pair `(kind, value)` from the helper so the printing is one line.",
          ],
          cases: [
            { stdin: "42 3.5 1e3 abc 0x1f -7 inf\n", expected: "int 42\nfloat 3.5\nfloat 1000.0\ntext abc\ntext 0x1f\nint -7\nfloat inf\n" },
            { stdin: "1_000 3. .5 - +9 nan\n", expected: "int 1000\nfloat 3.0\nfloat 0.5\ntext -\nint 9\nfloat nan\n", hidden: true },
            { stdin: "007 1e400 2e-3\n", expected: "int 7\nfloat inf\nfloat 0.002\n", hidden: true },
          ],
        },
        {
          title: "Bases",
          prompt: `Each line holds a number written in some base and the base (2–36). Parse it with \`int(text, base)\` and print its value in decimal, then with \`bin\`, \`oct\` and \`hex\` (which keep their prefixes and the sign).

**Input:** \`n\`, then \`n\` lines \`text base\`.
**Output:** \`<decimal> <bin> <oct> <hex>\` per line.

\`\`\`text
2
ff 16
101 2
\`\`\`
prints
\`\`\`text
255 0b11111111 0o377 0xff
5 0b101 0o5 0x5
\`\`\``,
          starter: String.raw`n = int(input())
for _ in range(n):
    text, base = input().split()
    # TODO: value = int(text, int(base)); print the four forms
`,
          solution: String.raw`n = int(input())
for _ in range(n):
    text, base = input().split()
    value = int(text, int(base))
    print(value, bin(value), oct(value), hex(value))
`,
          hints: [
            "The second argument of `int` is the base; it must itself be an int.",
            "`bin`, `oct` and `hex` return strings with `0b`, `0o`, `0x` prefixes — print them as they are.",
          ],
          cases: [
            { stdin: "2\nff 16\n101 2\n", expected: "255 0b11111111 0o377 0xff\n5 0b101 0o5 0x5\n" },
            { stdin: "3\n777 8\nz 36\n-1010 2\n", expected: "511 0b111111111 0o777 0x1ff\n35 0b100011 0o43 0x23\n-10 -0b1010 -0o12 -0xa\n", hidden: true },
            { stdin: "2\n0 10\n1_000 10\n", expected: "0 0b0 0o0 0x0\n1000 0b1111101000 0o1750 0x3e8\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `int(\"3.0\")` do?",
          options: ["Returns `3`", "Returns `3.0`", "Raises `ValueError`", "Raises `TypeError`"],
          answer: 2,
          explanation: "`int` parses integer literals only; a decimal point is not accepted. Parse with `float` first and truncate with `int(float(s))` if an integer is wanted. `TypeError` would need a non-string, non-number argument such as a list.",
        },
        {
          prompt: "What does `\"3\" * 3` evaluate to?",
          options: ["`9`", "`\"9\"`", "`\"333\"`", "`TypeError`"],
          answer: 2,
          explanation: "A string times an integer is repetition. No implicit conversion to a number happens; `int(\"3\") * 3` gives 9.",
        },
        {
          prompt: "What does `int(-3.9)` return?",
          options: ["`-4`", "`-3`", "`-3.0`", "`ValueError`"],
          answer: 1,
          explanation: "`int()` on a float truncates toward zero. `math.floor(-3.9)` gives −4 and `round(-3.9)` gives −4; choose the rounding you mean.",
        },
        {
          prompt: "Which expression turns the text `\"1f\"` into the integer 31?",
          options: ["`int(\"1f\")`", "`int(\"1f\", 16)`", "`hex(\"1f\")`", "`int(\"0x1f\")`"],
          answer: 1,
          explanation: "With an explicit base, `int` parses digits in that base. Base 10 rejects both `1f` and `0x1f`; `hex` goes the other way, from an int to a string.",
        },
        {
          prompt: "What does `str([1, 2, 3])` produce?",
          options: ["`'1 2 3'`", "`'1, 2, 3'`", "`'[1, 2, 3]'`", "`'123'`"],
          answer: 2,
          explanation: "`str` of a list is its `repr`, brackets and commas included. To print elements space-separated use `\" \".join(map(str, xs))` or `print(*xs)`.",
        },
      ],
    },
    {
      slug: "operators-and-precedence",
      file: "06-operators-and-precedence.md",
      exercises: [
        {
          title: "Permission flags",
          prompt: `Model a permission set as bits: \`read\` is 1, \`write\` is 2, \`exec\` is 4. The first line lists the permissions initially granted (possibly none). Then \`n\` commands follow: \`has <perm>\` prints \`yes\` or \`no\` using \`&\`; \`add <perm>\` sets a bit with \`|\`; \`remove <perm>\` clears it with \`& ~\`; \`show\` prints the mask as three binary digits.

**Input:** a line of permissions, then \`n\`, then \`n\` commands.
**Output:** one line per \`has\` and \`show\`.

\`\`\`text
read exec
4
show
has write
add write
show
\`\`\`
prints
\`\`\`text
mask 101
no
mask 111
\`\`\``,
          starter: String.raw`BITS = {"read": 1, "write": 2, "exec": 4}

mask = 0
for perm in input().split():
    mask |= BITS[perm]

n = int(input())
for _ in range(n):
    parts = input().split()
    # TODO: has / add / remove / show
`,
          solution: String.raw`BITS = {"read": 1, "write": 2, "exec": 4}

mask = 0
for perm in input().split():
    mask |= BITS[perm]

n = int(input())
for _ in range(n):
    parts = input().split()
    cmd = parts[0]
    if cmd == "show":
        print(f"mask {mask:03b}")
    elif cmd == "has":
        print("yes" if mask & BITS[parts[1]] else "no")
    elif cmd == "add":
        mask |= BITS[parts[1]]
    elif cmd == "remove":
        mask &= ~BITS[parts[1]]
`,
          hints: [
            "`mask & bit` is non-zero exactly when the bit is set — truthy in a conditional expression.",
            "`mask &= ~bit` clears one bit; `~` works on Python's unbounded ints because the mask is small and positive.",
            "The `:03b` spec prints three binary digits with leading zeros.",
          ],
          cases: [
            { stdin: "read exec\n4\nshow\nhas write\nadd write\nshow\n", expected: "mask 101\nno\nmask 111\n" },
            { stdin: "\n3\nshow\nremove read\nhas read\n", expected: "mask 000\nno\n", hidden: true },
            { stdin: "read write exec\n4\nremove exec\nhas exec\nhas read\nshow\n", expected: "no\nyes\nmask 011\n", hidden: true },
          ],
        },
        {
          title: "Precedence versus left to right",
          prompt: `Read integer expressions written with spaces between tokens, using the operators \`+ - * // % **\`. For each, print the value Python gives (evaluate it with \`eval\` — the input is trusted here) and the value a strictly left-to-right reading would give, applying each operator as it is met with no precedence at all.

**Input:** \`n\`, then \`n\` expressions.
**Output:** \`<expression>: precedence <p>, left-to-right <l>\` per line.

\`\`\`text
2
2 + 3 * 4
2 ** 3 ** 2
\`\`\`
prints
\`\`\`text
2 + 3 * 4: precedence 14, left-to-right 20
2 ** 3 ** 2: precedence 512, left-to-right 64
\`\`\``,
          starter: String.raw`import operator

OPS = {
    "+": operator.add,
    "-": operator.sub,
    "*": operator.mul,
    "//": operator.floordiv,
    "%": operator.mod,
    "**": operator.pow,
}


def left_to_right(tokens):
    # TODO: fold the tokens from the left: value op value op value ...
    return 0


n = int(input())
for _ in range(n):
    expr = input()
    tokens = expr.split()
    print(f"{expr}: precedence {eval(expr)}, left-to-right {left_to_right(tokens)}")
`,
          solution: String.raw`import operator

OPS = {
    "+": operator.add,
    "-": operator.sub,
    "*": operator.mul,
    "//": operator.floordiv,
    "%": operator.mod,
    "**": operator.pow,
}


def left_to_right(tokens):
    value = int(tokens[0])
    for i in range(1, len(tokens), 2):
        fn = OPS[tokens[i]]
        value = fn(value, int(tokens[i + 1]))
    return value


n = int(input())
for _ in range(n):
    expr = input()
    tokens = expr.split()
    print(f"{expr}: precedence {eval(expr)}, left-to-right {left_to_right(tokens)}")
`,
          hints: [
            "Tokens alternate number, operator, number, ...; step through them two at a time.",
            "The `operator` module gives each operator as a function, so the table maps a symbol to a callable.",
          ],
          cases: [
            { stdin: "2\n2 + 3 * 4\n2 ** 3 ** 2\n", expected: "2 + 3 * 4: precedence 14, left-to-right 20\n2 ** 3 ** 2: precedence 512, left-to-right 64\n" },
            { stdin: "3\n10 - 4 - 3\n1 + 2 ** 2 * 3\n7 + 3 % 2\n", expected: "10 - 4 - 3: precedence 3, left-to-right 3\n1 + 2 ** 2 * 3: precedence 13, left-to-right 27\n7 + 3 % 2: precedence 8, left-to-right 0\n", hidden: true },
            { stdin: "2\n100 // 10 // 2\n2 * 3 % 4\n", expected: "100 // 10 // 2: precedence 5, left-to-right 5\n2 * 3 % 4: precedence 2, left-to-right 2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is `2 ** 3 ** 2`?",
          options: ["`64`", "`512`", "`36`", "`SyntaxError`"],
          answer: 1,
          explanation: "`**` is right-associative, so it is `2 ** (3 ** 2) = 2 ** 9`. Every other arithmetic operator associates left.",
        },
        {
          prompt: "How does `x & 1 == 0` parse?",
          options: ["`(x & 1) == 0`", "`x & (1 == 0)`", "It is a syntax error", "`x & 1` then compared with `0` left to right"],
          answer: 1,
          explanation: "Comparisons sit *below* the bitwise operators in Python's table, so `1 == 0` (which is `False`) is computed first and then anded with `x`. Always parenthesise a bitwise sub-expression inside a comparison.",
        },
        {
          prompt: "What does `x & (x - 1) == 0` test for a positive integer `x` (once parenthesised as `(x & (x - 1)) == 0`)?",
          options: ["`x` is even", "`x` is a power of two", "`x` is odd", "`x` has exactly two set bits"],
          answer: 1,
          explanation: "Subtracting one flips the lowest set bit and everything below it; anding with the original clears that lowest set bit. The result is zero only when there was exactly one set bit — a power of two.",
        },
        {
          prompt: "What does `~5` evaluate to?",
          options: ["`-5`", "`-6`", "`250`", "`2`"],
          answer: 1,
          explanation: "Python integers behave as infinite two's-complement values, and `~x` is `-x - 1`. There is no fixed width, so `250` (an 8-bit complement) is not what you get.",
        },
        {
          prompt: "What does `3 < \"3\"` do?",
          options: ["Returns `True`", "Returns `False`", "Raises `TypeError`", "Compares the strings `\"3\"` and `\"3\"`"],
          answer: 2,
          explanation: "Ordering comparisons between unrelated types are not defined in Python 3 and raise `TypeError`. Only `==`/`!=` work across types, and they simply report inequality.",
        },
        {
          prompt: "Which is the safe way to turn the text `\"[1, 2, 3]\"` into a list?",
          options: ["`eval(text)`", "`ast.literal_eval(text)`", "`list(text)`", "`text.split(\", \")`"],
          answer: 1,
          explanation: "`literal_eval` parses literals only and never runs code, unlike `eval`. `list(text)` gives the characters, and splitting leaves brackets and strings rather than integers.",
        },
      ],
    },
    {
      slug: "types-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Digit and bit report",
          prompt: `Read a non-negative integer (it may be very large) and print six facts about it: its number of decimal digits, the sum of its digits, its digital root (sum the digits repeatedly until one digit remains; the root of 0 is 0), its binary form without the \`0b\` prefix, the number of one bits, and the number of bits needed to hold it (\`bit_length\`, which is 0 for 0).

**Input:** one integer.
**Output:** six lines: \`digits\`, \`digit-sum\`, \`digital-root\`, \`binary\`, \`ones\`, \`bits\`, each followed by a space and the value.

\`\`\`text
12345
\`\`\`
prints
\`\`\`text
digits 5
digit-sum 15
digital-root 6
binary 11000000111001
ones 6
bits 14
\`\`\``,
          starter: String.raw`n = int(input())
# TODO: compute and print the six lines
`,
          solution: String.raw`n = int(input())
text = str(n)
digit_sum = sum(int(d) for d in text)
root = n
while root >= 10:
    root = sum(int(d) for d in str(root))
print(f"digits {len(text)}")
print(f"digit-sum {digit_sum}")
print(f"digital-root {root}")
print(f"binary {n:b}")
print(f"ones {n.bit_count()}")
print(f"bits {n.bit_length()}")
`,
          hints: [
            "Digits are characters of `str(n)`; `sum(int(d) for d in text)` adds them.",
            "Repeat the digit sum while the value is 10 or more.",
            "`f\"{n:b}\"` prints binary without a prefix; `bit_count` and `bit_length` are int methods.",
          ],
          cases: [
            { stdin: "12345\n", expected: "digits 5\ndigit-sum 15\ndigital-root 6\nbinary 11000000111001\nones 6\nbits 14\n" },
            { stdin: "0\n", expected: "digits 1\ndigit-sum 0\ndigital-root 0\nbinary 0\nones 0\nbits 0\n", hidden: true },
            { stdin: "999\n", expected: "digits 3\ndigit-sum 27\ndigital-root 9\nbinary 1111100111\nones 8\nbits 10\n", hidden: true },
            { stdin: "1267650600228229401496703205376\n", expected: "digits 31\ndigit-sum 115\ndigital-root 7\nbinary 1" + "0".repeat(100) + "\nones 1\nbits 101\n", hidden: true },
          ],
        },
        {
          title: "Temperature table",
          prompt: `Read Celsius temperatures, one per line, until the end of input, and print a table row for each: the Celsius value and the Fahrenheit value (\`c * 9 / 5 + 32\`) both right-aligned in 7 characters with one decimal, then two spaces and a label — \`freezing\` when \`c <= 0\`, \`cold\` when \`0 < c < 15\`, \`warm\` when \`15 <= c < 25\`, \`hot\` otherwise. Use chained comparisons for the bands.

**Input:** zero or more numbers.
**Output:** one row per number.

\`\`\`text
-3
22
\`\`\`
prints
\`\`\`text
   -3.0    26.6  freezing
   22.0    71.6  warm
\`\`\``,
          starter: String.raw`import sys


def label(c):
    # TODO: freezing / cold / warm / hot with chained comparisons
    return ""


for line in sys.stdin:
    c = float(line)
    f = c * 9 / 5 + 32
    # TODO: print the formatted row
`,
          solution: String.raw`import sys


def label(c):
    if c <= 0:
        return "freezing"
    if 0 < c < 15:
        return "cold"
    if 15 <= c < 25:
        return "warm"
    return "hot"


for line in sys.stdin:
    c = float(line)
    f = c * 9 / 5 + 32
    print(f"{c:7.1f} {f:7.1f}  {label(c)}")
`,
          hints: [
            "`f\"{x:7.1f}\"` right-aligns in a field of 7 with one decimal.",
            "Each band is one chained comparison; the last one is what remains.",
          ],
          cases: [
            { stdin: "-3\n0\n14.9\n22\n30\n", expected: "   -3.0    26.6  freezing\n    0.0    32.0  freezing\n   14.9    58.8  cold\n   22.0    71.6  warm\n   30.0    86.0  hot\n" },
            { stdin: "100\n-40\n", expected: "  100.0   212.0  hot\n  -40.0   -40.0  freezing\n", hidden: true },
            { stdin: "15\n25\n24.99\n", expected: "   15.0    59.0  warm\n   25.0    77.0  hot\n   25.0    77.0  warm\n", hidden: true },
          ],
        },
        {
          title: "Exact change",
          prompt: `A customer pays for an item; compute the change in coins using integer cents throughout. Denominations, in cents: 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1. Use the greedy method (largest coin first). If the payment is smaller than the price print \`insufficient\`.

**Input:** one line \`paid price\`, both with exactly two decimals.
**Output:** \`change <amount>\` with two decimals, then one line per denomination used, largest first: \`<coin with two decimals> x <count>\`.

\`\`\`text
20.00 13.45
\`\`\`
prints
\`\`\`text
change 6.55
5.00 x 1
1.00 x 1
0.50 x 1
0.05 x 1
\`\`\``,
          starter: String.raw`COINS = [2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1]


def to_cents(text):
    # TODO: "13.45" -> 1345 without floats
    return 0


def money(cents):
    return f"{cents // 100}.{cents % 100:02d}"


paid, price = input().split()
# TODO: compute change and the greedy coin counts
`,
          solution: String.raw`COINS = [2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1]


def to_cents(text):
    pounds, pence = text.split(".")
    return int(pounds) * 100 + int(pence)


def money(cents):
    return f"{cents // 100}.{cents % 100:02d}"


paid, price = input().split()
change = to_cents(paid) - to_cents(price)
if change < 0:
    print("insufficient")
else:
    print(f"change {money(change)}")
    for coin in COINS:
        count, change = divmod(change, coin)
        if count:
            print(f"{money(coin)} x {count}")
`,
          hints: [
            "Split each amount on the dot and combine pounds and pence into one integer.",
            "`divmod(remaining, coin)` gives how many of this coin and what is left in one step.",
            "Reuse the same `money()` helper to print both the change and each coin.",
          ],
          cases: [
            { stdin: "20.00 13.45\n", expected: "change 6.55\n5.00 x 1\n1.00 x 1\n0.50 x 1\n0.05 x 1\n" },
            { stdin: "5.00 5.00\n", expected: "change 0.00\n", hidden: true },
            { stdin: "1.00 2.50\n", expected: "insufficient\n", hidden: true },
            { stdin: "100.00 0.01\n", expected: "change 99.99\n20.00 x 4\n10.00 x 1\n5.00 x 1\n2.00 x 2\n0.50 x 1\n0.20 x 2\n0.05 x 1\n0.02 x 2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `print(7 // -2, 7 % -2)` print?",
          options: ["`-3 1`", "`-4 -1`", "`-3 -1`", "`-4 1`"],
          answer: 1,
          explanation: "Floor of −3.5 is −4, and the remainder takes the divisor's sign: `-2 * -4 + (-1) == 7`.",
        },
        {
          prompt: "Which comparison of two computed floats is correct?",
          options: ["`a == b`", "`abs(a - b) == 0`", "`math.isclose(a, b)`", "`str(a) == str(b)`"],
          answer: 2,
          explanation: "`isclose` allows a relative tolerance (and an absolute one near zero); the other three all reduce to exact equality of values that carry rounding error.",
        },
        {
          prompt: "What does `print(0 or [], [] or 0, 1 and 2)` print?",
          options: ["`False False True`", "`[] 0 2`", "`0 [] 1`", "`[] [] 2`"],
          answer: 1,
          explanation: "`or` returns the last operand when the first is falsy: `[]` then `0`. `and` returns the second operand when the first is truthy: `2`.",
        },
        {
          prompt: "After `a = [1]; b = a; b += [2]; b = b + [3]`, what is `a`?",
          options: ["`[1]`", "`[1, 2]`", "`[1, 2, 3]`", "`[1, 3]`"],
          answer: 1,
          explanation: "`+=` extends the shared list in place, so `a` sees `2`; `b + [3]` creates a new list bound only to `b`.",
        },
        {
          prompt: "What does `int(\" 42 \")` return?",
          options: ["`42`", "`ValueError`", "`\" 42 \"`", "`4`"],
          answer: 0,
          explanation: "Surrounding whitespace is allowed by `int`. Inner whitespace (`\"4 2\"`) and a decimal point are not.",
        },
        {
          prompt: "What is `2 ** -1`?",
          options: ["`0`", "`0.5`", "`-2`", "`ValueError`"],
          answer: 1,
          explanation: "A negative exponent on integers yields a float reciprocal. Only non-negative integer exponents keep the result an int.",
        },
        {
          prompt: "Which value is falsy?",
          options: ["`\"0\"`", "`[None]`", "`0.0`", "`-1`"],
          answer: 2,
          explanation: "Zero of any numeric type is falsy. A non-empty string or list is truthy whatever it contains, and every non-zero number is truthy.",
        },
        {
          prompt: "What does `x = 5; x is 5` do, and why is it discouraged?",
          options: [
            "It is `False` because `is` compares types",
            "It happens to be `True` because CPython caches small ints, but identity is not the right question for values — use `==`",
            "It raises `TypeError`",
            "It is always `True` for every integer",
          ],
          answer: 1,
          explanation: "Small integers are cached so the identity test passes by accident; for `1000` it may not. The interpreter emits `SyntaxWarning` for `is` with a literal. `is` is for `None` and sentinels.",
        },
        {
          prompt: "Which produces the string `'0b101'`?",
          options: ["`format(5, \"b\")`", "`bin(5)`", "`f\"{5:b}\"`", "`str(5, 2)`"],
          answer: 1,
          explanation: "`bin` includes the `0b` prefix; the format specs give bare digits `101`; `str(5, 2)` is a `TypeError` (that signature decodes bytes).",
        },
        {
          prompt: "What does `Decimal(\"0.1\") + Decimal(\"0.2\") == Decimal(\"0.3\")` evaluate to?",
          options: ["`True`", "`False`", "`TypeError`", "`Decimal('0.3')`"],
          answer: 0,
          explanation: "Decimal arithmetic on values constructed from strings is exact at these precisions, so the sum is exactly three tenths. `==` returns a bool, not a Decimal.",
        },
        {
          prompt: "What does `(1 << 3) | 1` evaluate to?",
          options: ["`8`", "`9`", "`3`", "`16`"],
          answer: 1,
          explanation: "`1 << 3` is 8 (binary 1000); or-ing in bit 0 gives 1001, which is 9.",
        },
        {
          prompt: "A function receives a list and does `xs.append(1)`; another receives a string and does `s += \"!\"`. Which caller sees a change?",
          options: ["Both", "Neither", "Only the list's caller", "Only the string's caller"],
          answer: 2,
          explanation: "`append` mutates the shared list object. `s += \"!\"` creates a new string and rebinds the local name only; strings are immutable and the caller's binding is untouched.",
        },
      ],
    },
  ],
});
