import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "strings",
  title: "Strings and text",
  blurb: "Strings as immutable sequences, slicing and the method set, f-strings and the format-spec mini-language, code points versus bytes with the digit tests, the parsing shapes for every input format, and regular expressions with groups and substitution.",
  icon: "text",
  overview: `Text is what every program reads and writes, and Python's \`str\` — an immutable sequence of Unicode code points with the richest method set in the language — is why Python programs that handle text are short. This module makes that method set second nature, fixes the slice rule that lists and tuples share, and learns the format-spec mini-language once so that tables, fixed decimals and padded fields never cost a search again. It also draws the line between text and bytes that Python 3 enforces, and explains the three digit tests, case folding and normalisation that decide whether two strings are "the same".

String basics covers literals, escapes, raw strings, the sequence operations, comparison by code point and \`repr\`. Slicing and methods gives \`[a:b:c]\`, the case and whitespace methods, searching (\`in\`, \`find\`, \`index\`), splitting, joining, \`partition\`, \`replace\` and \`translate\`, the \`is*\` tests and padding. Formatting is f-strings and the spec grammar, floats, tables, \`str.format\` and the legacy \`%\`. Characters and Unicode covers \`ord\`/\`chr\`, \`encode\`/\`decode\`, \`isdecimal\`/\`isdigit\`/\`isnumeric\`, \`casefold\` and NFC. Parsing input gives a template for each input shape and the rule to convert strictly and reject clearly. Regular expressions covers the six \`re\` functions, the syntax, groups, substitution, greediness and flags.

The exercises are whole programs: a palindrome test over normalised text, text versus numeric ordering, a slicing command interpreter, a slug maker, an invoice table, a number-format row, a Caesar cipher through \`translate\`, a character report with byte lengths and digit tests, a typed configuration parser, a run-length codec written as a hand scanner, a number extractor and a log-line parser with named groups. The checkpoint adds a text-statistics table, a query-string parser with typed values and duplicate detection, and an access-log summary driven by one regular expression.`,
  lessons: [
    {
      slug: "string-basics",
      file: "01-string-basics.md",
      exercises: [
        {
          title: "Palindromes, normalised",
          prompt: `Read lines until the end of input and decide whether each is a palindrome when only letters and digits are considered and case is ignored: build the normalised string with \`casefold()\` and a filter on \`isalnum()\`, then compare it with its reverse \`[::-1]\`.

**Input:** lines of text.
**Output:** \`yes\` or \`no\` per line.

\`\`\`text
A man, a plan, a canal: Panama
hello
\`\`\`
prints
\`\`\`text
yes
no
\`\`\``,
          starter: String.raw`import sys


def is_palindrome(text):
    # TODO: normalise, then compare with the reverse
    return False


for line in sys.stdin:
    print("yes" if is_palindrome(line.rstrip("\n")) else "no")
`,
          solution: String.raw`import sys


def is_palindrome(text):
    core = "".join(ch for ch in text.casefold() if ch.isalnum())
    return core == core[::-1]


for line in sys.stdin:
    print("yes" if is_palindrome(line.rstrip("\n")) else "no")
`,
          hints: [
            "A generator expression inside `\"\".join(...)` keeps only the characters you want.",
            "`s[::-1]` is the reversed string; an empty string equals its own reverse.",
          ],
          cases: [
            { stdin: "A man, a plan, a canal: Panama\nhello\n", expected: "yes\nno\n" },
            { stdin: "Was it a car or a cat I saw?\nNo lemon, no melon\nabc\n", expected: "yes\nyes\nno\n", hidden: true },
            { stdin: "12321\n12 3 21\n\n", expected: "yes\nyes\nyes\n", hidden: true },
          ],
        },
        {
          title: "Text order versus numeric order",
          prompt: `Strings compare by code point, which is not numeric order and puts uppercase before lowercase. Read a line of tokens and print them sorted as text; then, if every token parses as an integer, print them sorted numerically as well (using \`key=int\`), otherwise print \`numeric: n/a\`.

**Input:** one line of tokens.
**Output:** \`text: <tokens>\` then \`numeric: <tokens>\` or \`numeric: n/a\`.

\`\`\`text
10 9 100
\`\`\`
prints
\`\`\`text
text: 10 100 9
numeric: 9 10 100
\`\`\``,
          starter: String.raw`tokens = input().split()
print("text:", " ".join(sorted(tokens)))
# TODO: numeric order when every token is an int, else n/a
`,
          solution: String.raw`tokens = input().split()
print("text:", " ".join(sorted(tokens)))
try:
    numeric = sorted(tokens, key=int)
except ValueError:
    print("numeric: n/a")
else:
    print("numeric:", " ".join(numeric))
`,
          hints: [
            "`sorted(tokens, key=int)` compares the integer values but returns the original strings.",
            "A token that is not an integer makes `int` raise `ValueError` — catch it around the sort.",
          ],
          cases: [
            { stdin: "10 9 100\n", expected: "text: 10 100 9\nnumeric: 9 10 100\n" },
            { stdin: "b a B\n", expected: "text: B a b\nnumeric: n/a\n", hidden: true },
            { stdin: "-5 3 -10 0\n", expected: "text: -10 -5 0 3\nnumeric: -10 -5 0 3\n", hidden: true },
            { stdin: "Zebra apple 7\n", expected: "text: 7 Zebra apple\nnumeric: n/a\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does this do?\n\n```python\ns = \"cat\"\ns[0] = \"b\"\n```",
          options: ["`s` becomes `\"bat\"`", "`TypeError` — strings are immutable", "`s` becomes `\"bcat\"`", "`IndexError`"],
          answer: 1,
          explanation: "A string cannot be changed in place; build a new one with `\"b\" + s[1:]`. Every string method likewise returns a new string.",
        },
        {
          prompt: "What is `\"Zebra\" < \"apple\"`?",
          options: ["`False`", "`True`", "`TypeError`", "Depends on the locale"],
          answer: 1,
          explanation: "Comparison is by code point, and uppercase letters (65–90) come before lowercase (97–122). Use `key=str.casefold` for a case-insensitive order.",
        },
        {
          prompt: "What does `print(repr(\"a\\tb\"))` print?",
          options: ["`a	b`", "`'a\\tb'`", "`a\\tb`", "`\"a\\tb\"`"],
          answer: 1,
          explanation: "`repr` returns a quoted literal with escapes visible, which is why it is the form to print when debugging whitespace. `str` would show the actual tab.",
        },
        {
          prompt: "Why is `\"\".join(parts)` preferred to `s += part` in a loop?",
          options: ["Because `+=` is not defined for strings", "Because each `+=` copies the whole string so far, making the loop quadratic", "Because `join` deduplicates", "There is no difference"],
          answer: 1,
          explanation: "Immutability means concatenation allocates a new string every time; `join` measures the total once and copies each piece once.",
        },
        {
          prompt: "What is `r\"\\n\"`?",
          options: ["A newline character", "A two-character string: backslash and `n`", "A syntax error", "An empty string"],
          answer: 1,
          explanation: "A raw literal leaves backslashes alone, which is what regular expressions and Windows paths need. Its length is 2.",
        },
      ],
    },
    {
      slug: "slicing-and-methods",
      file: "02-slicing-and-methods.md",
      exercises: [
        {
          title: "Slice commands",
          prompt: `Read a string, then \`n\` commands, and print the result of each slice: \`rev\` reverses; \`every k\` takes every k-th character from the start; \`first k\` and \`last k\` take that many characters; \`drop k\` removes the first k; \`mid\` removes the first and last character. Every answer is one slice expression.

**Input:** the string, then \`n\`, then \`n\` commands.
**Output:** one line per command (an empty result prints \`(empty)\`).

\`\`\`text
abcdefg
4
rev
every 2
last 3
drop 2
\`\`\`
prints
\`\`\`text
gfedcba
aceg
efg
cdefg
\`\`\``,
          starter: String.raw`s = input()
n = int(input())
for _ in range(n):
    cmd, *arg = input().split()
    k = int(arg[0]) if arg else 0
    # TODO: pick the slice
    result = s
    print(result if result else "(empty)")
`,
          solution: String.raw`s = input()
n = int(input())
for _ in range(n):
    cmd, *arg = input().split()
    k = int(arg[0]) if arg else 0
    if cmd == "rev":
        result = s[::-1]
    elif cmd == "every":
        result = s[::k]
    elif cmd == "first":
        result = s[:k]
    elif cmd == "last":
        result = s[-k:] if k else ""
    elif cmd == "drop":
        result = s[k:]
    else:
        result = s[1:-1]
    print(result if result else "(empty)")
`,
          hints: [
            "`s[-k:]` is the last k characters — but `s[-0:]` is the whole string, so guard `k == 0`.",
            "`s[1:-1]` drops one character from each end and is empty for strings shorter than 3.",
          ],
          cases: [
            { stdin: "abcdefg\n4\nrev\nevery 2\nlast 3\ndrop 2\n", expected: "gfedcba\naceg\nefg\ncdefg\n" },
            { stdin: "ab\n3\nmid\nfirst 5\nevery 3\n", expected: "(empty)\nab\na\n", hidden: true },
            { stdin: "python\n3\nlast 0\ndrop 6\nrev\n", expected: "(empty)\n(empty)\nnohtyp\n", hidden: true },
          ],
        },
        {
          title: "Slugs",
          prompt: `Turn titles into URL slugs without regular expressions: casefold the text, replace every character that is not a letter or digit with a hyphen, collapse runs of hyphens into one, and strip hyphens from both ends. Build the result character by character or with \`split\`/\`join\`.

**Input:** lines of titles.
**Output:** one slug per line, or \`(empty)\` when nothing remains.

\`\`\`text
Hello, World!
  Python  3.11 is here
\`\`\`
prints
\`\`\`text
hello-world
python-3-11-is-here
\`\`\``,
          starter: String.raw`import sys


def slugify(title):
    # TODO
    return title


for line in sys.stdin:
    slug = slugify(line.rstrip("\n"))
    print(slug if slug else "(empty)")
`,
          solution: String.raw`import sys


def slugify(title):
    replaced = "".join(ch if ch.isalnum() else "-" for ch in title.casefold())
    return "-".join(part for part in replaced.split("-") if part)


for line in sys.stdin:
    slug = slugify(line.rstrip("\n"))
    print(slug if slug else "(empty)")
`,
          hints: [
            "Map each character to itself or a hyphen with a conditional expression inside `join`.",
            "Splitting on `-` and dropping the empty parts collapses runs and strips the ends in one step.",
          ],
          cases: [
            { stdin: "Hello, World!\n  Python  3.11 is here\n", expected: "hello-world\npython-3-11-is-here\n" },
            { stdin: "---\nCafé au Lait\n", expected: "(empty)\ncafé-au-lait\n", hidden: true },
            { stdin: "already-a-slug\nA\n", expected: "already-a-slug\na\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is `\"abcdef\"[1:5:2]`?",
          options: ["`'bd'`", "`'bdf'`", "`'ace'`", "`'bcde'`"],
          answer: 0,
          explanation: "Start at index 1 (`b`), step 2, stop before index 5: indexes 1 and 3 — `b` and `d`.",
        },
        {
          prompt: "What does `\"happy.py\".strip(\".py\")` return?",
          options: ["`'happy'`", "`'ha'`", "`'happy.py'`", "`ValueError`"],
          answer: 1,
          explanation: "`strip` removes any of the given *characters* from both ends repeatedly: `p`, `y` and `.` are stripped until `a` stops it. `removesuffix(\".py\")` removes the literal suffix.",
        },
        {
          prompt: "What is `\"a b  c\".split(\" \")`?",
          options: ["`['a', 'b', 'c']`", "`['a', 'b', '', 'c']`", "`['a', 'b', ' ', 'c']`", "`['a b  c']`"],
          answer: 1,
          explanation: "With an explicit separator, consecutive separators produce empty strings. The no-argument `split()` collapses whitespace runs.",
        },
        {
          prompt: "Which expression tells you *where* `\"x\"` occurs in `s`, giving −1 when absent?",
          options: ["`s.index(\"x\")`", "`s.find(\"x\")`", "`\"x\" in s`", "`s.count(\"x\")`"],
          answer: 1,
          explanation: "`find` returns the position or −1; `index` raises `ValueError` when absent; `in` gives a boolean; `count` gives how many.",
        },
        {
          prompt: "What does `\"-\".join([1, 2, 3])` do?",
          options: ["Returns `'1-2-3'`", "Raises `TypeError` — join needs strings", "Returns `'[1, 2, 3]'`", "Returns `'-1-2-3-'`"],
          answer: 1,
          explanation: "`join` accepts only an iterable of strings. Convert first: `\"-\".join(map(str, [1, 2, 3]))`.",
        },
        {
          prompt: "What is `\"k=v=w\".partition(\"=\")`?",
          options: ["`('k', 'v', 'w')`", "`('k', '=', 'v=w')`", "`['k', 'v=w']`", "`('k=v', '=', 'w')`"],
          answer: 1,
          explanation: "`partition` splits at the first occurrence and always returns a 3-tuple including the separator; `rpartition` splits at the last.",
        },
      ],
    },
    {
      slug: "formatting",
      file: "03-formatting.md",
      exercises: [
        {
          title: "Invoice table",
          prompt: `Read \`n\` rows \`item qty price\` and print an aligned table: a header, one row per item, and a total line. Columns: item left-aligned in 10, qty right-aligned in 5, price and line total right-aligned in 10 with two decimals. The total line puts \`TOTAL\` in the item column and the grand total in the last column, with the middle columns blank.

**Input:** \`n\`, then \`n\` lines.
**Output:** \`n + 2\` lines.

\`\`\`text
2
apple 3 0.5
melon 1 4.25
\`\`\`
prints
\`\`\`text
item        qty     price     total
apple         3      0.50      1.50
melon         1      4.25      4.25
TOTAL                          5.75
\`\`\``,
          starter: String.raw`n = int(input())
print(f"{'item':<10}{'qty':>5}{'price':>10}{'total':>10}")
grand = 0.0
for _ in range(n):
    item, qty, price = input().split()
    qty, price = int(qty), float(price)
    # TODO: the row
print(f"{'TOTAL':<10}{'':>5}{'':>10}{grand:>10.2f}")
`,
          solution: String.raw`n = int(input())
print(f"{'item':<10}{'qty':>5}{'price':>10}{'total':>10}")
grand = 0.0
for _ in range(n):
    item, qty, price = input().split()
    qty, price = int(qty), float(price)
    line = qty * price
    grand += line
    print(f"{item:<10}{qty:>5}{price:>10.2f}{line:>10.2f}")
print(f"{'TOTAL':<10}{'':>5}{'':>10}{grand:>10.2f}")
`,
          hints: [
            "Use the same widths in the header and the rows; strings need `<` or `>` explicitly.",
            "`{price:>10.2f}` combines width, alignment and precision.",
          ],
          cases: [
            { stdin: "2\napple 3 0.5\nmelon 1 4.25\n", expected: "item        qty     price     total\napple         3      0.50      1.50\nmelon         1      4.25      4.25\nTOTAL                          5.75\n" },
            { stdin: "1\nwatermelon 10 1.5\n", expected: "item        qty     price     total\nwatermelon   10      1.50     15.00\nTOTAL                         15.00\n", hidden: true },
            { stdin: "0\n", expected: "item        qty     price     total\nTOTAL                          0.00\n", hidden: true },
          ],
        },
        {
          title: "Number formats",
          prompt: `For each integer print five renderings on one line separated by single spaces: decimal, lowercase hexadecimal, binary zero-padded to width 8, decimal zero-padded to width 5, and decimal with thousands separators.

**Input:** \`n\`, then \`n\` integers.
**Output:** one line per integer.

\`\`\`text
2
255
1234567
\`\`\`
prints
\`\`\`text
255 ff 11111111 00255 255
1234567 12d687 100101101011010000111 1234567 1,234,567
\`\`\``,
          starter: String.raw`n = int(input())
for _ in range(n):
    x = int(input())
    # TODO: f"{x:d} {x:x} {x:08b} {x:05d} {x:,}"
`,
          solution: String.raw`n = int(input())
for _ in range(n):
    x = int(input())
    print(f"{x:d} {x:x} {x:08b} {x:05d} {x:,}")
`,
          hints: [
            "Each rendering is one format spec; the width is a minimum, so wide values print whole.",
            "Zero-padding of a negative number puts the zeros after the sign.",
          ],
          cases: [
            { stdin: "2\n255\n1234567\n", expected: "255 ff 11111111 00255 255\n1234567 12d687 100101101011010000111 1234567 1,234,567\n" },
            { stdin: "2\n-42\n0\n", expected: "-42 -2a -0101010 -0042 -42\n0 0 00000000 00000 0\n", hidden: true },
            { stdin: "1\n65536\n", expected: "65536 10000 10000000000000000 65536 65,536\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `f\"{42:06d}\"` produce?",
          options: ["`'000042'`", "`'42    '`", "`'    42'`", "`'42'`"],
          answer: 0,
          explanation: "The `0` flag zero-pads a number to the width. Width alone would right-align with spaces.",
        },
        {
          prompt: "What does `f\"{'ab':5}|\"` produce?",
          options: ["`'   ab|'`", "`'ab   |'`", "`'ab|'`", "`'  ab |'`"],
          answer: 1,
          explanation: "Strings align left by default (numbers right). Use `>` to right-align a string.",
        },
        {
          prompt: "What is `f\"{0.256:.1%}\"`?",
          options: ["`'0.3%'`", "`'25.6%'`", "`'26%'`", "`'0.256%'`"],
          answer: 1,
          explanation: "The `%` type multiplies by 100, appends a percent sign and applies the precision to the decimals.",
        },
        {
          prompt: "What does `f\"{x=}\"` do for `x = 5`?",
          options: ["Raises `SyntaxError`", "Produces `'x=5'`", "Assigns 5 to the string", "Produces `'5'`"],
          answer: 1,
          explanation: "The `=` specifier (3.8) prints the expression text and its value — a debugging convenience.",
        },
        {
          prompt: "Which spec prints `1234567.891` as `1,234,567.89`?",
          options: ["`{:.2f,}`", "`{:,.2f}`", "`{:2,f}`", "`{:,2f}`"],
          answer: 1,
          explanation: "Grouping comes before precision in the spec grammar: `[width][,][.precision][type]`.",
        },
        {
          prompt: "How is a literal `{` written inside an f-string?",
          options: ["`\\{`", "`{{`", "`{'{'}`", "It cannot be"],
          answer: 1,
          explanation: "Doubled braces print one brace. (`{'{'}` also works, as an expression, but the doubled form is the convention.)",
        },
      ],
    },
    {
      slug: "characters-and-unicode",
      file: "04-characters-and-unicode.md",
      exercises: [
        {
          title: "Caesar cipher",
          prompt: `Shift every ASCII letter by \`k\` positions (wrapping around the alphabet), preserving case and leaving every other character alone. Build a translation table once with \`str.maketrans\` and apply it with \`translate\`. \`k\` may be negative or larger than 26.

**Input:** \`k\`, then lines of text.
**Output:** each line shifted.

\`\`\`text
3
Hello, World!
\`\`\`
prints
\`\`\`text
Khoor, Zruog!
\`\`\``,
          starter: String.raw`import string
import sys

k = int(input()) % 26
lower = string.ascii_lowercase
upper = string.ascii_uppercase
# TODO: table = str.maketrans(lower + upper, shifted_lower + shifted_upper)
table = str.maketrans("", "")
for line in sys.stdin:
    print(line.rstrip("\n").translate(table))
`,
          solution: String.raw`import string
import sys

k = int(input()) % 26
lower = string.ascii_lowercase
upper = string.ascii_uppercase
shifted_lower = lower[k:] + lower[:k]
shifted_upper = upper[k:] + upper[:k]
table = str.maketrans(lower + upper, shifted_lower + shifted_upper)
for line in sys.stdin:
    print(line.rstrip("\n").translate(table))
`,
          hints: [
            "`k % 26` normalises any shift, negative included, into 0–25.",
            "The shifted alphabet is a rotation: `lower[k:] + lower[:k]`.",
            "Characters not in the table pass through `translate` unchanged.",
          ],
          cases: [
            { stdin: "3\nHello, World!\n", expected: "Khoor, Zruog!\n" },
            { stdin: "-3\nKhoor, Zruog!\n", expected: "Hello, World!\n", hidden: true },
            { stdin: "26\nabc XYZ 123\n", expected: "abc XYZ 123\n", hidden: true },
            { stdin: "13\nUryyb\nJbeyq\n", expected: "Hello\nWorld\n", hidden: true },
          ],
        },
        {
          title: "Character report",
          prompt: `For each whitespace-separated token print its length in characters, its length in bytes when encoded as UTF-8, and the results of \`isdecimal()\` and \`isdigit()\`.

**Input:** one line of tokens.
**Output:** \`<token> chars=<n> bytes=<n> decimal=<bool> digit=<bool>\` per token.

\`\`\`text
café 42
\`\`\`
prints
\`\`\`text
café chars=4 bytes=5 decimal=False digit=False
42 chars=2 bytes=2 decimal=True digit=True
\`\`\``,
          starter: String.raw`for tok in input().split():
    # TODO
    pass
`,
          solution: String.raw`for tok in input().split():
    print(f"{tok} chars={len(tok)} bytes={len(tok.encode('utf-8'))} decimal={tok.isdecimal()} digit={tok.isdigit()}")
`,
          hints: [
            "`len(tok)` counts code points; `len(tok.encode())` counts bytes.",
            "The boolean methods print as `True`/`False` inside the f-string.",
          ],
          cases: [
            { stdin: "café 42\n", expected: "café chars=4 bytes=5 decimal=False digit=False\n42 chars=2 bytes=2 decimal=True digit=True\n" },
            { stdin: "² € -1\n", expected: "² chars=1 bytes=2 decimal=False digit=True\n€ chars=1 bytes=3 decimal=False digit=False\n-1 chars=2 bytes=2 decimal=False digit=False\n", hidden: true },
            { stdin: "½ 😀 007\n", expected: "½ chars=1 bytes=2 decimal=False digit=False\n😀 chars=1 bytes=4 decimal=False digit=False\n007 chars=3 bytes=3 decimal=True digit=True\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What are `len(\"é\")` and `len(\"é\".encode(\"utf-8\"))`?",
          options: ["`1` and `1`", "`1` and `2`", "`2` and `2`", "`2` and `1`"],
          answer: 1,
          explanation: "A `str` counts code points — one — while UTF-8 encodes U+00E9 in two bytes.",
        },
        {
          prompt: "What does `\"a\" + b\"b\"` do?",
          options: ["Returns `\"ab\"`", "Returns `b\"ab\"`", "Raises `TypeError`", "Returns `\"ab\"` after decoding"],
          answer: 2,
          explanation: "Text and bytes never mix implicitly in Python 3; decode the bytes first. The strictness prevents the encoding bugs Python 2 was known for.",
        },
        {
          prompt: "Which method should be used to compare strings case-insensitively across languages?",
          options: ["`lower()`", "`casefold()`", "`upper()`", "`title()`"],
          answer: 1,
          explanation: "`casefold` applies the full Unicode case folding (`ß` → `ss`), designed for comparison; `lower` is for display and misses such cases.",
        },
        {
          prompt: "What is `\"²\".isdigit()` and `\"²\".isdecimal()`?",
          options: ["`True`, `True`", "`True`, `False`", "`False`, `False`", "`False`, `True`"],
          answer: 1,
          explanation: "Superscripts are digits but not decimals; `int(\"²\")` fails. Neither method accepts a sign, so neither is a test for 'parses as an integer'.",
        },
        {
          prompt: "Why can `\"\\u00e9\" == \"e\\u0301\"` be `False` even though both display as é?",
          options: [
            "Because one is a byte string",
            "Because they are different code-point sequences — a precomposed character versus a base plus a combining accent; normalise with NFC",
            "Because string comparison is by length only",
            "It is always `True`",
          ],
          answer: 1,
          explanation: "Unicode allows the same visible character to be encoded two ways; `unicodedata.normalize(\"NFC\", s)` composes them so equality works.",
        },
      ],
    },
    {
      slug: "parsing-input",
      file: "05-parsing-input.md",
      exercises: [
        {
          title: "Config parser",
          prompt: `Parse a configuration read until the end of input. Blank lines and lines starting with \`#\` are ignored. Every other line must be \`key = value\` (spaces around \`=\` optional) — split with \`partition\`, and print \`invalid: <line>\` when there is no \`=\`. Type each value: an integer, else a float, else \`true\`/\`false\` (any case) as a boolean, else a string. Print the entries in input order.

**Input:** lines.
**Output:** \`<key>: <type> <value>\` per entry (types \`int\`, \`float\`, \`bool\`, \`str\`; booleans print as \`True\`/\`False\`).

\`\`\`text
# server
host = localhost
port=8080
ratio = 0.75
debug = true
name
\`\`\`
prints
\`\`\`text
host: str localhost
port: int 8080
ratio: float 0.75
debug: bool True
invalid: name
\`\`\``,
          starter: String.raw`import sys


def typed(text):
    # TODO: int, then float, then bool, else str — return (type name, value)
    return "str", text


for line in sys.stdin:
    line = line.strip()
    if not line or line.startswith("#"):
        continue
    key, sep, value = line.partition("=")
    # TODO: invalid when sep is empty; otherwise strip and type the value
`,
          solution: String.raw`import sys


def typed(text):
    try:
        return "int", int(text)
    except ValueError:
        pass
    try:
        return "float", float(text)
    except ValueError:
        pass
    if text.lower() in ("true", "false"):
        return "bool", text.lower() == "true"
    return "str", text


for line in sys.stdin:
    line = line.strip()
    if not line or line.startswith("#"):
        continue
    key, sep, value = line.partition("=")
    if not sep:
        print(f"invalid: {line}")
        continue
    kind, val = typed(value.strip())
    print(f"{key.strip()}: {kind} {val}")
`,
          hints: [
            "`partition(\"=\")` gives an empty separator when the line has no `=` — that is the invalid case.",
            "Try `int` first, then `float`, then the boolean words; the string is what remains.",
          ],
          cases: [
            { stdin: "# server\nhost = localhost\nport=8080\nratio = 0.75\ndebug = true\nname\n", expected: "host: str localhost\nport: int 8080\nratio: float 0.75\ndebug: bool True\ninvalid: name\n" },
            { stdin: "\n\nurl = http://x/?a=1\nverbose = FALSE\n", expected: "url: str http://x/?a=1\nverbose: bool False\n", hidden: true },
            { stdin: "n=-3\nx = 1e3\nempty =\n", expected: "n: int -3\nx: float 1000.0\nempty: str \n", hidden: true },
          ],
        },
        {
          title: "Run-length codec",
          prompt: `Each line is \`E <text>\` (encode) or \`D <code>\` (decode). Encoding turns runs of a repeated character into the character followed by its count (\`aaabcc\` → \`a3b1c2\`). Decoding reverses it; counts may have several digits (\`x10\`). Write the decoder as a hand scanner: an index that reads one character, then the run of digits after it. Text after the command is taken literally (it may contain spaces).

**Input:** lines.
**Output:** one line per input line (an empty result prints \`(empty)\`).

\`\`\`text
E aaabcc
D a3b1c2
\`\`\`
prints
\`\`\`text
a3b1c2
aaabcc
\`\`\``,
          starter: String.raw`import sys


def encode(text):
    # TODO: walk runs of equal characters
    return text


def decode(code):
    # TODO: scanner: character, then digits
    return code


for line in sys.stdin:
    line = line.rstrip("\n")
    cmd, _, rest = line.partition(" ")
    result = encode(rest) if cmd == "E" else decode(rest)
    print(result if result else "(empty)")
`,
          solution: String.raw`import sys


def encode(text):
    out = []
    i = 0
    while i < len(text):
        j = i
        while j < len(text) and text[j] == text[i]:
            j += 1
        out.append(f"{text[i]}{j - i}")
        i = j
    return "".join(out)


def decode(code):
    out = []
    i = 0
    while i < len(code):
        ch = code[i]
        i += 1
        j = i
        while j < len(code) and code[j].isdigit():
            j += 1
        out.append(ch * int(code[i:j]))
        i = j
    return "".join(out)


for line in sys.stdin:
    line = line.rstrip("\n")
    cmd, _, rest = line.partition(" ")
    result = encode(rest) if cmd == "E" else decode(rest)
    print(result if result else "(empty)")
`,
          hints: [
            "Both directions share the shape: an index `i`, an inner loop that advances `j` past one unit, then `i = j`.",
            "In `decode` the character comes first and the digits follow; `code[i:j]` is the count.",
          ],
          cases: [
            { stdin: "E aaabcc\nD a3b1c2\n", expected: "a3b1c2\naaabcc\n" },
            { stdin: "D x10\nE \nE a\n", expected: "xxxxxxxxxx\n(empty)\na1\n", hidden: true },
            { stdin: "E aa bb\nD  2a1\n", expected: "a2 1b2\n  a\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which reads two integers from one line?",
          options: ["`a, b = input()`", "`a, b = map(int, input().split())`", "`a = int(input()); b = int(input())`", "`a, b = int(input().split())`"],
          answer: 1,
          explanation: "Split the line, convert each token, unpack. The first unpacks characters; the third reads two *lines*; the last calls `int` on a list.",
        },
        {
          prompt: "What does `\"flag\".partition(\"=\")` return?",
          options: ["`('flag', '', '')`", "`('flag',)`", "`ValueError`", "`('', '', 'flag')`"],
          answer: 0,
          explanation: "When the separator is absent, the head is the whole string and the other two parts are empty — so testing the separator part tells you whether `=` was present.",
        },
        {
          prompt: "Why is `if s.isdigit(): n = int(s)` a poor validation?",
          options: [
            "`isdigit` is slow",
            "It rejects negative numbers and accepts characters like `²` that `int` rejects; try `int(s)` and catch `ValueError` instead",
            "`isdigit` returns a string",
            "It is correct",
          ],
          answer: 1,
          explanation: "`int()` is the definition of 'parses as an integer'; the character test is neither necessary nor sufficient.",
        },
        {
          prompt: "What is the fastest way to read a large whitespace-separated input?",
          options: ["`input()` in a loop", "`sys.stdin.read().split()` once, then walk the tokens", "`sys.stdin.readline()` per token", "`open(0).readlines()` then `split` each line"],
          answer: 1,
          explanation: "One read and one split are a handful of C-level operations; per-line calls pay Python overhead on each line. It also ignores how the tokens are wrapped.",
        },
        {
          prompt: "What does `text.strip().split(\"\\n\\n\")` give for text made of paragraphs separated by blank lines?",
          options: ["A list of paragraphs, each still containing its internal newlines", "A list of lines", "A single string", "A list of words"],
          answer: 0,
          explanation: "Splitting on the double newline separates blocks; `splitlines()` on each block then gives its lines. Stripping first avoids empty leading or trailing blocks.",
        },
      ],
    },
    {
      slug: "regular-expressions",
      file: "06-regular-expressions.md",
      exercises: [
        {
          title: "Extract the numbers",
          prompt: `For each line of text, find every number — an optional minus sign, digits, and optionally a decimal point with more digits — with one \`re.findall\` pattern that uses a non-capturing group for the fraction. Print the matched texts and their sum (as floats, two decimals).

**Input:** lines of text.
**Output:** \`found: <matches>\` (or \`found: none\`) then \`sum: <total>\`, per line.

\`\`\`text
Order 66 costs 12.50, tax 2.5
no digits here
\`\`\`
prints
\`\`\`text
found: 66 12.50 2.5
sum: 81.00
found: none
sum: 0.00
\`\`\``,
          starter: String.raw`import re
import sys

NUMBER = re.compile(r"")  # TODO: -?\d+ with an optional (?:\.\d+)

for line in sys.stdin:
    found = NUMBER.findall(line)
    # TODO: print the two lines
`,
          solution: String.raw`import re
import sys

NUMBER = re.compile(r"-?\d+(?:\.\d+)?")

for line in sys.stdin:
    found = NUMBER.findall(line)
    print("found:", " ".join(found) if found else "none")
    print(f"sum: {sum(float(x) for x in found):.2f}")
`,
          hints: [
            "`(?:\\.\\d+)?` groups the fraction without capturing, so `findall` returns whole matches.",
            "With a capturing group, `findall` would return only the group — that is the classic surprise.",
          ],
          cases: [
            { stdin: "Order 66 costs 12.50, tax 2.5\nno digits here\n", expected: "found: 66 12.50 2.5\nsum: 81.00\nfound: none\nsum: 0.00\n" },
            { stdin: "-3 and 3\nv1.2.3\n", expected: "found: -3 3\nsum: 0.00\nfound: 1.2 3\nsum: 4.20\n", hidden: true },
            { stdin: "1,000 items\n", expected: "found: 1 000\nsum: 1.00\n", hidden: true },
          ],
        },
        {
          title: "Log lines with named groups",
          prompt: `A log line looks like \`2024-05-01 12:30:45 [ERROR] Disk full on /dev/sda1\`. Write one pattern with named groups \`date\`, \`time\`, \`level\` and \`msg\`, apply it with \`fullmatch\`, and print \`<level> @ <time>: <msg>\` for matching lines and \`skip\` for the others. After all lines, print the count per level in alphabetical order as \`levels: ERROR=1 INFO=2\` (or \`levels: none\`).

**Input:** lines.
**Output:** one line per input line, then the summary.

\`\`\`text
2024-05-01 12:30:45 [ERROR] Disk full on /dev/sda1
2024-05-01 12:31:00 [INFO] Retrying
garbage
\`\`\`
prints
\`\`\`text
ERROR @ 12:30:45: Disk full on /dev/sda1
INFO @ 12:31:00: Retrying
skip
levels: ERROR=1 INFO=1
\`\`\``,
          starter: String.raw`import re
import sys

LINE = re.compile(r"")  # TODO: named groups date, time, level, msg

counts = {}
for line in sys.stdin:
    m = LINE.fullmatch(line.rstrip("\n"))
    if m is None:
        print("skip")
        continue
    # TODO: print and count
# TODO: summary
`,
          solution: String.raw`import re
import sys

LINE = re.compile(r"(?P<date>\d{4}-\d{2}-\d{2}) (?P<time>\d{2}:\d{2}:\d{2}) \[(?P<level>[A-Z]+)\] (?P<msg>.*)")

counts = {}
for line in sys.stdin:
    m = LINE.fullmatch(line.rstrip("\n"))
    if m is None:
        print("skip")
        continue
    level = m.group("level")
    print(f"{level} @ {m.group('time')}: {m.group('msg')}")
    counts[level] = counts.get(level, 0) + 1
if counts:
    print("levels:", " ".join(f"{k}={counts[k]}" for k in sorted(counts)))
else:
    print("levels: none")
`,
          hints: [
            "Escape the square brackets around the level — `\\[` and `\\]` — or they form a character set.",
            "`m.group(\"name\")` reads a named group; `fullmatch` returns `None` for a line that does not fit entirely.",
          ],
          cases: [
            { stdin: "2024-05-01 12:30:45 [ERROR] Disk full on /dev/sda1\n2024-05-01 12:31:00 [INFO] Retrying\ngarbage\n", expected: "ERROR @ 12:30:45: Disk full on /dev/sda1\nINFO @ 12:31:00: Retrying\nskip\nlevels: ERROR=1 INFO=1\n" },
            { stdin: "nothing\n", expected: "skip\nlevels: none\n", hidden: true },
            { stdin: "2024-01-02 00:00:00 [WARN] a\n2024-01-02 00:00:01 [WARN] b [x]\n2024-01-02 00:00:02 [info] lower\n", expected: "WARN @ 00:00:00: a\nWARN @ 00:00:01: b [x]\nskip\nlevels: WARN=2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `re.match(r\"\\d+\", \"abc 123\")` return?",
          options: ["A match for `123`", "`None` — `match` anchors at the start of the string", "`['123']`", "`ValueError`"],
          answer: 1,
          explanation: "`match` succeeds only if the pattern matches at position 0. `search` would find `123`.",
        },
        {
          prompt: "What is `re.findall(r\"(\\d)-(\\d)\", \"1-2 3-4\")`?",
          options: ["`['1-2', '3-4']`", "`[('1', '2'), ('3', '4')]`", "`['1', '2', '3', '4']`", "`[<Match>, <Match>]`"],
          answer: 1,
          explanation: "With capturing groups, `findall` returns tuples of the groups, not the whole matches. Use `(?:...)` or `finditer` for the full text.",
        },
        {
          prompt: "On `\"<a><b>\"`, what does `re.search(r\"<.*>\", s).group()` match?",
          options: ["`<a>`", "`<a><b>` — the quantifier is greedy", "`<b>`", "`<>`"],
          answer: 1,
          explanation: "`.*` takes as much as it can while the rest still matches. `<.*?>` or, better, `<[^>]*>` matches just `<a>`.",
        },
        {
          prompt: "Why write patterns as raw strings?",
          options: ["They run faster", "So that backslashes reach the regex engine intact — `\"\\b\"` in a normal string is a backspace", "Raw strings allow `{}` in patterns", "It is only convention"],
          answer: 1,
          explanation: "Python's own escape processing would consume or alter sequences like `\\b` and `\\1`; the `r` prefix turns it off.",
        },
        {
          prompt: "What does `re.sub(r\"(\\w+) (\\w+)\", r\"\\2 \\1\", \"ada lovelace\")` return?",
          options: ["`'lovelace ada'`", "`'ada lovelace'`", "`'\\2 \\1'`", "`TypeError`"],
          answer: 0,
          explanation: "Backreferences in the replacement insert the captured groups in the new order.",
        },
        {
          prompt: "Which task should *not* be done with a regular expression?",
          options: ["Finding every date in free text", "Checking that a string ends with `.txt`", "Extracting `key=value` pairs from a line", "Validating a plate format like `ABC-1234`"],
          answer: 1,
          explanation: "`s.endswith(\".txt\")` is clearer and faster; regexes earn their place when the shape is more than a fixed prefix, suffix or delimiter.",
        },
      ],
    },
    {
      slug: "strings-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Text statistics",
          prompt: `Read all of standard input and report, as a two-column table with labels left-aligned in 14 characters and values right-aligned in 8: \`lines\` (from \`splitlines\`), \`words\` (whitespace tokens), \`chars\` (every character), \`unique\` (distinct words after \`casefold\` and stripping punctuation from both ends; empty results do not count), \`longest\` (the first longest cleaned word, left-aligned like the labels' column but printed in the value column right-aligned), and \`avg length\` (mean length of cleaned words, two decimals, \`0.00\` for none).

**Input:** any text.
**Output:** six table rows.

\`\`\`text
The cat sat. The cat ran!
\`\`\`
prints
\`\`\`text
lines                1
words                6
chars               26
unique               4
longest            the
avg length        3.00
\`\`\``,
          starter: String.raw`import string
import sys

data = sys.stdin.read()
words = data.split()
cleaned = [w.casefold().strip(string.punctuation) for w in words]
cleaned = [w for w in cleaned if w]
# TODO: compute and print the six rows with f"{label:<14}{value:>8}"
`,
          solution: String.raw`import string
import sys

data = sys.stdin.read()
words = data.split()
cleaned = [w.casefold().strip(string.punctuation) for w in words]
cleaned = [w for w in cleaned if w]
longest = max(cleaned, key=len) if cleaned else "-"
avg = sum(len(w) for w in cleaned) / len(cleaned) if cleaned else 0.0
print(f"{'lines':<14}{len(data.splitlines()):>8}")
print(f"{'words':<14}{len(words):>8}")
print(f"{'chars':<14}{len(data):>8}")
print(f"{'unique':<14}{len(set(cleaned)):>8}")
print(f"{'longest':<14}{longest:>8}")
print(f"{'avg length':<14}{avg:>8.2f}")
`,
          hints: [
            "`max(cleaned, key=len)` returns the first longest word; guard the empty case.",
            "`len(set(cleaned))` counts distinct words — the set is only counted, never printed.",
          ],
          cases: [
            { stdin: "The cat sat. The cat ran!\n", expected: "lines                1\nwords                6\nchars               26\nunique               4\nlongest            the\navg length        3.00\n" },
            { stdin: "", expected: "lines                0\nwords                0\nchars                0\nunique               0\nlongest              -\navg length        0.00\n", hidden: true },
            { stdin: "Hello, hello!\n\n... world\n", expected: "lines                3\nwords                4\nchars               25\nunique               2\nlongest          hello\navg length        5.00\n", hidden: true },
          ],
        },
        {
          title: "Query strings",
          prompt: `Parse query strings, one per line: fields separated by \`&\`, each \`key=value\` or a bare \`key\` (a flag). A \`+\` in a value stands for a space. Type each value as in the config parser (\`int\`, \`float\`, \`bool\` for \`true\`/\`false\`, else \`str\`); a value containing commas is a \`list\` of strings printed joined with \`|\`; a bare key is \`bool True\`. A key seen twice on the same line prints \`duplicate: <key>\` instead of a second entry. Print a blank-free block per line: the entries in order, then \`--\`.

**Input:** lines.
**Output:** per line, the entries then \`--\`.

\`\`\`text
name=ada+lovelace&age=36&tags=a,b,c&admin&age=1
\`\`\`
prints
\`\`\`text
name: str ada lovelace
age: int 36
tags: list a|b|c
admin: bool True
duplicate: age
--
\`\`\``,
          starter: String.raw`import sys


def typed(text):
    # TODO: list (commas), int, float, bool, str
    return "str", text


for line in sys.stdin:
    seen = set()
    for field in line.strip().split("&"):
        if not field:
            continue
        key, sep, value = field.partition("=")
        # TODO: duplicates, flags, typed values
    print("--")
`,
          solution: String.raw`import sys


def typed(text):
    if "," in text:
        return "list", "|".join(text.split(","))
    try:
        return "int", int(text)
    except ValueError:
        pass
    try:
        return "float", float(text)
    except ValueError:
        pass
    if text.lower() in ("true", "false"):
        return "bool", text.lower() == "true"
    return "str", text


for line in sys.stdin:
    seen = set()
    for field in line.strip().split("&"):
        if not field:
            continue
        key, sep, value = field.partition("=")
        if key in seen:
            print(f"duplicate: {key}")
            continue
        seen.add(key)
        if not sep:
            print(f"{key}: bool True")
            continue
        kind, val = typed(value.replace("+", " "))
        print(f"{key}: {kind} {val}")
    print("--")
`,
          hints: [
            "A set of keys seen so far detects duplicates; it is never printed, so its order does not matter.",
            "Replace `+` with a space before typing the value; test for commas before trying `int`.",
          ],
          cases: [
            { stdin: "name=ada+lovelace&age=36&tags=a,b,c&admin&age=1\n", expected: "name: str ada lovelace\nage: int 36\ntags: list a|b|c\nadmin: bool True\nduplicate: age\n--\n" },
            { stdin: "x=1.5&y=false\n\nq=hello+big+world&&z\n", expected: "x: float 1.5\ny: bool False\n--\n--\nq: str hello big world\nz: bool True\n--\n", hidden: true },
            { stdin: "a&a&a=2\n", expected: "a: bool True\nduplicate: a\nduplicate: a\n--\n", hidden: true },
          ],
        },
        {
          title: "Access-log summary",
          prompt: `Each line of an access log is \`<ip> - - [<timestamp>] "<method> <path> HTTP/1.1" <status> <bytes>\`. With one regular expression using named groups, parse every line (skip lines that do not match) and print: the number of requests per status code in ascending numeric order, the total bytes, and the most requested path (ties broken alphabetically).

**Input:** lines.
**Output:** \`status <code>: <count>\` lines, then \`bytes: <total>\`, then \`top: <path>\` (or \`top: none\`).

\`\`\`text
10.0.0.1 - - [01/May/2024:12:00:00 +0000] "GET /index.html HTTP/1.1" 200 512
10.0.0.2 - - [01/May/2024:12:00:01 +0000] "GET /missing HTTP/1.1" 404 0
10.0.0.1 - - [01/May/2024:12:00:02 +0000] "POST /index.html HTTP/1.1" 200 128
not a log line
\`\`\`
prints
\`\`\`text
status 200: 2
status 404: 1
bytes: 640
top: /index.html
\`\`\``,
          starter: String.raw`import re
import sys

LOG = re.compile(r"")  # TODO: groups ip, ts, method, path, status, bytes

statuses = {}
paths = {}
total = 0
for line in sys.stdin:
    m = LOG.fullmatch(line.rstrip("\n"))
    if not m:
        continue
    # TODO: count
# TODO: print
`,
          solution: String.raw`import re
import sys

LOG = re.compile(
    r'(?P<ip>\S+) - - \[(?P<ts>[^\]]+)\] "(?P<method>[A-Z]+) (?P<path>\S+) HTTP/1\.1" (?P<status>\d{3}) (?P<bytes>\d+)'
)

statuses = {}
paths = {}
total = 0
for line in sys.stdin:
    m = LOG.fullmatch(line.rstrip("\n"))
    if not m:
        continue
    status = int(m.group("status"))
    statuses[status] = statuses.get(status, 0) + 1
    path = m.group("path")
    paths[path] = paths.get(path, 0) + 1
    total += int(m.group("bytes"))

for status in sorted(statuses):
    print(f"status {status}: {statuses[status]}")
print(f"bytes: {total}")
if paths:
    top = min(paths, key=lambda p: (-paths[p], p))
    print(f"top: {top}")
else:
    print("top: none")
`,
          hints: [
            "`[^\\]]+` matches everything up to the closing bracket of the timestamp; escape the brackets themselves.",
            "The key `(-count, path)` with `min` picks the highest count and the alphabetically first path on ties.",
          ],
          cases: [
            {
              stdin: "10.0.0.1 - - [01/May/2024:12:00:00 +0000] \"GET /index.html HTTP/1.1\" 200 512\n10.0.0.2 - - [01/May/2024:12:00:01 +0000] \"GET /missing HTTP/1.1\" 404 0\n10.0.0.1 - - [01/May/2024:12:00:02 +0000] \"POST /index.html HTTP/1.1\" 200 128\nnot a log line\n",
              expected: "status 200: 2\nstatus 404: 1\nbytes: 640\ntop: /index.html\n",
            },
            { stdin: "junk\n", expected: "bytes: 0\ntop: none\n", hidden: true },
            {
              stdin: "1.1.1.1 - - [x] \"GET /b HTTP/1.1\" 500 10\n1.1.1.1 - - [x] \"GET /a HTTP/1.1\" 301 20\n",
              expected: "status 301: 1\nstatus 500: 1\nbytes: 30\ntop: /a\n",
              hidden: true,
            },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is `\"hello\"[::-1]`?",
          options: ["`'olleh'`", "`'hello'`", "`'h'`", "`IndexError`"],
          answer: 0,
          explanation: "A step of −1 walks from the end to the start — the reversal idiom.",
        },
        {
          prompt: "What does `\"a,b,,c\".split(\",\")` return?",
          options: ["`['a', 'b', 'c']`", "`['a', 'b', '', 'c']`", "`['a', 'b', ',', 'c']`", "`['a,b,,c']`"],
          answer: 1,
          explanation: "An explicit separator keeps empty fields; only `split()` with no argument collapses runs.",
        },
        {
          prompt: "What does `f\"{3.14159:8.2f}|\"` produce?",
          options: ["`'3.14    |'`", "`'    3.14|'`", "`'3.14|'`", "`'00003.14|'`"],
          answer: 1,
          explanation: "Numbers right-align in the width by default; two decimals in a field of eight gives four leading spaces.",
        },
        {
          prompt: "Which expression gives the number of bytes in `s` as UTF-8?",
          options: ["`len(s)`", "`len(s.encode(\"utf-8\"))`", "`s.__sizeof__()`", "`len(bytes(s))`"],
          answer: 1,
          explanation: "`len(s)` counts code points; encoding produces the bytes. `bytes(s)` without an encoding is a `TypeError`.",
        },
        {
          prompt: "What is `\"ß\".upper()`?",
          options: ["`'ß'`", "`'SS'`", "`'ẞ'`", "`UnicodeError`"],
          answer: 1,
          explanation: "Case mapping can change the length of a string; the German sharp s uppercases to two letters. `casefold` gives `'ss'` for comparison.",
        },
        {
          prompt: "What does `\"k=v\".split(\"=\", 1)` return, and what happens on `\"k\"`?",
          options: ["`['k', 'v']`; `['k']`", "`('k', 'v')`; `('k',)`", "`['k', 'v']`; `ValueError`", "`['k', '=', 'v']`; `['k']`"],
          answer: 0,
          explanation: "`split` with a maxsplit returns a list of at most two parts; with no separator present the list has one element, so unpacking into two names would fail — which is why `partition` is often safer.",
        },
        {
          prompt: "What does `re.search(r\"\\d+\", \"abc\")` return?",
          options: ["`''`", "`None`", "`[]`", "It raises `ValueError`"],
          answer: 1,
          explanation: "No match gives `None`, which is why the result must be tested before calling `.group()`.",
        },
        {
          prompt: "Which pattern matches a whole line that is exactly three uppercase letters?",
          options: ["`re.search(r\"[A-Z]{3}\", s)`", "`re.fullmatch(r\"[A-Z]{3}\", s)`", "`re.match(r\"[A-Z]{3}\", s)`", "`re.findall(r\"[A-Z]\", s)`"],
          answer: 1,
          explanation: "`fullmatch` requires the pattern to cover the entire string; `match` only anchors the start, and `search` anywhere.",
        },
        {
          prompt: "What does `\"x\".join([\"a\", \"b\", \"c\"])` produce?",
          options: ["`'axbxc'`", "`'xaxbxcx'`", "`'abc'`", "`'a b c'`"],
          answer: 0,
          explanation: "`join` places the separator between elements, never at the ends.",
        },
        {
          prompt: "What is `\"Hello World\".title().swapcase()`?",
          options: ["`'hELLO wORLD'`", "`'HELLO WORLD'`", "`'hello world'`", "`'Hello World'`"],
          answer: 0,
          explanation: "`title` capitalises each word; `swapcase` then flips every letter's case.",
        },
        {
          prompt: "What does `re.sub(r\"\\s+\", \" \", \"  a   b \").strip()` return?",
          options: ["`'a b'`", "`' a b '`", "`'ab'`", "`'  a   b '`"],
          answer: 0,
          explanation: "Runs of whitespace collapse to single spaces; `strip` removes the ends. The same result as `\" \".join(s.split())`.",
        },
        {
          prompt: "Which is true of `\"²\".isdecimal()`?",
          options: ["`True`", "`False`", "It raises `UnicodeError`", "It depends on the locale"],
          answer: 1,
          explanation: "`isdecimal` accepts only characters usable to form base-10 numbers with `int()`; a superscript is a digit (`isdigit` is true) but not a decimal.",
        },
      ],
    },
  ],
});
