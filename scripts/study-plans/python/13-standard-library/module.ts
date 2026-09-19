import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "standard-library",
  title: "The standard library in depth",
  blurb: "math, statistics, Fraction, Decimal and seeded random; datetime arithmetic, parsing and time zones with zoneinfo; deque, Counter, OrderedDict, ChainMap and namedtuple in depth; textwrap, difflib, Template and the deeper re; and enums with auto, IntEnum, StrEnum and Flag.",
  icon: "plug",
  overview: `The map of Module 12 said where things are; this module goes deep on the five areas of the standard library that every program touches and every interview probes: numbers beyond the basics, dates and times done correctly, the \`collections\` types in full, the second tier of text tools, and enumerations. Each lesson is organised around the guarantees a tool gives — exactness, calendar correctness, O(1) at both ends, reproducibility — because choosing the right tool is choosing the guarantee the problem needs.

Math and numbers covers \`math\`'s integer and float functions, \`statistics\` with sample versus population deviation, \`Fraction\` and \`Decimal\` with \`quantize\`, and \`random.Random(seed)\` versus \`secrets\`. Dates and times covers the four types, calendar arithmetic, ISO and \`strftime\`/\`strptime\`, naive versus aware, \`zoneinfo\`, timestamps and the store-UTC rule. Collections in depth covers \`deque.rotate\`/\`maxlen\`, \`Counter\` arithmetic, \`OrderedDict.move_to_end\` as an LRU cache, \`ChainMap\`, \`namedtuple\`'s helpers and the \`User*\` classes. Text-processing tools covers \`textwrap\`, \`difflib\`, \`string.Template\`, \`unicodedata\` and regex named groups, lookarounds, \`sub\` with a function and \`VERBOSE\`. Enums covers \`Enum\`, \`auto\`, lookup, methods, \`IntEnum\`/\`StrEnum\`, \`Flag\` and enums in \`match\`.

The exercises are whole programs: an integer and statistics report, seeded dice that are reproducible, calendar arithmetic across leap years, time-zone conversion with daylight saving, multiset operations on \`Counter\`, an LRU cache on \`OrderedDict\`, wrapping and fuzzy matching, regex extraction with named groups and lookarounds, a status enum with transitions, and typed permission flags. The checkpoint adds a statistics report with exact totals, a schedule converted between zones, and an LRU cache driven by an enum of operations.`,
  lessons: [
    {
      slug: "math-and-numbers",
      file: "01-math-and-numbers.md",
      exercises: [
        {
          title: "Number report",
          prompt: `Read a line of positive integers and print: the gcd and lcm of all of them (\`math.gcd\`/\`math.lcm\` accept many arguments), the integer square root of the largest, which values are perfect squares (\`isqrt(n) ** 2 == n\`), \`math.comb(n, 2)\` for \`n\` = the count of values, and the sample and population standard deviations from \`statistics\` with three decimals (\`n/a\` for the sample deviation when there is only one value).

**Input:** one line of positive integers (at least one).
**Output:** \`gcd <g> lcm <l>\`, \`isqrt <r>\`, \`squares <values or none>\`, \`pairs <c>\`, \`stdev <s> pstdev <p>\`.

\`\`\`text
12 18 36
\`\`\`
prints
\`\`\`text
gcd 6 lcm 36
isqrt 6
squares 36
pairs 3
stdev 12.490 pstdev 10.198
\`\`\``,
          starter: String.raw`import math
import statistics

xs = list(map(int, input().split()))
# TODO
`,
          solution: String.raw`import math
import statistics

xs = list(map(int, input().split()))
print(f"gcd {math.gcd(*xs)} lcm {math.lcm(*xs)}")
print(f"isqrt {math.isqrt(max(xs))}")
squares = [x for x in xs if math.isqrt(x) ** 2 == x]
print("squares", " ".join(map(str, squares)) if squares else "none")
print(f"pairs {math.comb(len(xs), 2)}")
sample = f"{statistics.stdev(xs):.3f}" if len(xs) > 1 else "n/a"
print(f"stdev {sample} pstdev {statistics.pstdev(xs):.3f}")
`,
          hints: [
            "`math.gcd(*xs)` spreads the list into arguments; `math.lcm` likewise (3.9).",
            "`statistics.stdev` needs at least two values and raises `StatisticsError` otherwise — guard it.",
          ],
          cases: [
            { stdin: "12 18 36\n", expected: "gcd 6 lcm 36\nisqrt 6\nsquares 36\npairs 3\nstdev 12.490 pstdev 10.198\n" },
            { stdin: "49\n", expected: "gcd 49 lcm 49\nisqrt 7\nsquares 49\npairs 0\nstdev n/a pstdev 0.000\n", hidden: true },
            { stdin: "2 3 5 7\n", expected: "gcd 1 lcm 210\nisqrt 2\nsquares none\npairs 6\nstdev 2.217 pstdev 1.920\n", hidden: true },
          ],
        },
        {
          title: "Seeded dice",
          prompt: `Randomness must be reproducible in a judged program. Read a seed and \`n\`; create \`random.Random(seed)\`; print \`n\` rolls of \`randint(1, 6)\`, then a shuffled copy of \`[1, 2, 3, 4, 5]\` (\`shuffle\` in place on a copy), then \`sample(range(100), 3)\`, then a \`choice\` from \`"abc"\`. Every value comes from the **same** generator in that order.

**Input:** \`seed n\`.
**Output:** \`rolls …\`, \`shuffled …\`, \`sample …\`, \`choice <c>\`.

\`\`\`text
42 5
\`\`\`
prints
\`\`\`text
rolls 6 1 1 6 3
shuffled 4 3 1 5 2
sample 86 94 69
choice a
\`\`\``,
          starter: String.raw`import random

seed, n = map(int, input().split())
rng = random.Random(seed)
# TODO
`,
          solution: String.raw`import random

seed, n = map(int, input().split())
rng = random.Random(seed)
print("rolls", " ".join(str(rng.randint(1, 6)) for _ in range(n)))
deck = [1, 2, 3, 4, 5]
rng.shuffle(deck)
print("shuffled", " ".join(map(str, deck)))
print("sample", " ".join(map(str, rng.sample(range(100), 3))))
print("choice", rng.choice("abc"))
`,
          hints: [
            "A `Random(seed)` instance is independent of the module-level generator and of everything else.",
            "The order of the calls matters — the sequence is fixed by the seed, so consume it exactly as specified.",
          ],
          cases: [
            { stdin: "42 5\n", expected: "rolls 6 1 1 6 3\nshuffled 4 3 1 5 2\nsample 86 94 69\nchoice a\n" },
            { stdin: "7 3\n", expected: "rolls 3 2 4\nshuffled 2 4 3 5 1\nsample 46 74 7\nchoice c\n", hidden: true },
            { stdin: "0 1\n", expected: "rolls 4\nshuffled 5 3 2 1 4\nsample 51 38 61\nchoice b\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which is the exact integer square root?",
          options: ["`int(math.sqrt(n))`", "`math.isqrt(n)`", "`round(n ** 0.5)`", "`math.floor(math.sqrt(n))`"],
          answer: 1,
          explanation: "`isqrt` works on integers of any size; the float forms lose precision above 2⁵³.",
        },
        {
          prompt: "Which `statistics` function divides by n − 1?",
          options: ["`pstdev`", "`stdev`", "`variance` and `pvariance` both", "`mean`"],
          answer: 1,
          explanation: "`stdev`/`variance` are the sample forms; `pstdev`/`pvariance` the population forms.",
        },
        {
          prompt: "What does `Decimal(\"2.675\").quantize(Decimal(\"0.01\"))` give by default?",
          options: ["`2.68`", "`2.67`", "`2.7`", "`2.675`"],
          answer: 0,
          explanation: "The default context rounds half to even, and 2.675 exactly is a tie whose even neighbour is 2.68. (The float `2.675` is below the tie, which is why `round(2.675, 2)` is `2.67`.)",
        },
        {
          prompt: "Why prefer `random.Random(seed)` to `random.seed(seed)`?",
          options: ["It is faster", "The instance has its own state, isolated from any other code calling the module functions", "The module functions cannot be seeded", "There is no difference"],
          answer: 1,
          explanation: "The module functions share one global generator that any library call can advance.",
        },
        {
          prompt: "Which module generates a password-reset token?",
          options: ["`random`", "`secrets`", "`hashlib`", "`uuid` only"],
          answer: 1,
          explanation: "`random` is predictable by design; `secrets` uses the OS's cryptographic source.",
        },
      ],
    },
    {
      slug: "dates-and-times",
      file: "02-dates-and-times.md",
      exercises: [
        {
          title: "Calendar arithmetic",
          prompt: `Read pairs of ISO dates \`a b\`. For each print the number of days from \`a\` to \`b\` (negative if \`b\` is earlier), the weekday name of \`a\` (\`%A\`), the date 30 days after \`a\`, and whether \`a\`'s year is a leap year (\`calendar.isleap\`).

**Input:** lines \`a b\`.
**Output:** \`days <n> weekday <name> plus30 <date> leap <bool>\` per line.

\`\`\`text
2024-02-28 2024-03-01
\`\`\`
prints
\`\`\`text
days 2 weekday Wednesday plus30 2024-03-29 leap True
\`\`\``,
          starter: String.raw`import calendar
import sys
from datetime import date, timedelta

for line in sys.stdin:
    a, b = (date.fromisoformat(t) for t in line.split())
    # TODO
`,
          solution: String.raw`import calendar
import sys
from datetime import date, timedelta

for line in sys.stdin:
    a, b = (date.fromisoformat(t) for t in line.split())
    days = (b - a).days
    print(f"days {days} weekday {a.strftime('%A')} plus30 {(a + timedelta(days=30)).isoformat()} leap {calendar.isleap(a.year)}")
`,
          hints: [
            "Subtracting dates gives a `timedelta`; `.days` is the signed whole-day count.",
            "`timedelta(days=30)` is calendar-correct across month ends and leap days.",
          ],
          cases: [
            { stdin: "2024-02-28 2024-03-01\n", expected: "days 2 weekday Wednesday plus30 2024-03-29 leap True\n" },
            { stdin: "2023-02-28 2023-03-01\n2024-12-31 2024-01-01\n", expected: "days 1 weekday Tuesday plus30 2023-03-30 leap False\ndays -365 weekday Tuesday plus30 2025-01-30 leap True\n", hidden: true },
            { stdin: "1900-01-01 1900-01-01\n", expected: "days 0 weekday Monday plus30 1900-01-31 leap False\n", hidden: true },
          ],
        },
        {
          title: "Across time zones",
          prompt: `The first line names a zone (IANA name such as \`Asia/Kolkata\`). Each following line is either \`utc <ISO datetime>\` — an instant in UTC to convert into the zone — or \`local <ISO datetime>\` — a wall-clock reading in the zone to convert to UTC. Print the converted value in ISO format with its offset, using aware datetimes only (\`timezone.utc\` and \`ZoneInfo\`).

**Input:** the zone, then lines.
**Output:** one ISO datetime per line.

\`\`\`text
Europe/London
utc 2024-07-01T12:00:00
local 2024-01-15T09:00:00
\`\`\`
prints
\`\`\`text
2024-07-01T13:00:00+01:00
2024-01-15T09:00:00+00:00
\`\`\``,
          starter: String.raw`import sys
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

zone = ZoneInfo(input().strip())
for line in sys.stdin:
    kind, text = line.split()
    naive = datetime.fromisoformat(text)
    # TODO: attach the right zone with replace(tzinfo=...), then astimezone(...)
`,
          solution: String.raw`import sys
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

zone = ZoneInfo(input().strip())
for line in sys.stdin:
    kind, text = line.split()
    naive = datetime.fromisoformat(text)
    if kind == "utc":
        print(naive.replace(tzinfo=timezone.utc).astimezone(zone).isoformat())
    else:
        print(naive.replace(tzinfo=zone).astimezone(timezone.utc).isoformat())
`,
          hints: [
            "`replace(tzinfo=…)` labels a naive reading with the zone it was taken in; `astimezone` then converts the instant.",
            "London is +01:00 in summer and +00:00 in winter — `ZoneInfo` applies the daylight-saving rules for you.",
          ],
          cases: [
            { stdin: "Europe/London\nutc 2024-07-01T12:00:00\nlocal 2024-01-15T09:00:00\n", expected: "2024-07-01T13:00:00+01:00\n2024-01-15T09:00:00+00:00\n" },
            { stdin: "Asia/Kolkata\nutc 2024-05-01T04:00:00\nlocal 2024-05-01T09:30:00\n", expected: "2024-05-01T09:30:00+05:30\n2024-05-01T04:00:00+00:00\n", hidden: true },
            { stdin: "America/New_York\nutc 2024-12-31T23:30:00\nlocal 2024-07-04T12:00:00\n", expected: "2024-12-31T18:30:00-05:00\n2024-07-04T16:00:00+00:00\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Why is there no `timedelta(months=1)`?",
          options: ["It was forgotten", "A month has no fixed length, so it cannot be a duration", "Months are handled by `time`", "It exists"],
          answer: 1,
          explanation: "`timedelta` holds days, seconds and microseconds; month arithmetic needs `replace` or `dateutil`.",
        },
        {
          prompt: "What happens when a naive and an aware datetime are compared?",
          options: ["The naive one is assumed UTC", "`TypeError`", "They compare by wall-clock", "`False`"],
          answer: 1,
          explanation: "The two are different kinds of value; attach a zone first with `replace(tzinfo=…)`.",
        },
        {
          prompt: "Which converts an instant from one zone to another?",
          options: ["`dt.replace(tzinfo=z)`", "`dt.astimezone(z)`", "`dt.tzinfo = z`", "`dt + z`"],
          answer: 1,
          explanation: "`replace` only relabels; `astimezone` adjusts the clock reading to the new zone.",
        },
        {
          prompt: "What does `datetime.fromtimestamp(ts)` without `tz` use?",
          options: ["UTC", "The machine's local zone — a classic source of off-by-hours bugs", "The zone in `ts`", "No zone; it raises"],
          answer: 1,
          explanation: "Always pass `tz=timezone.utc` (or the intended zone).",
        },
        {
          prompt: "What is the recommended storage form for instants?",
          options: ["Local naive datetimes", "Aware UTC datetimes, converted to the user's zone only for display", "Strings in `%d/%m/%Y`", "Floats of hours"],
          answer: 1,
          explanation: "One reference frame for all computation removes DST and zone ambiguity from the logic.",
        },
      ],
    },
    {
      slug: "collections-in-depth",
      file: "03-collections-in-depth.md",
      exercises: [
        {
          title: "Multisets",
          prompt: `Two lines hold a word bank (\`tiles\`) and a target word. Using \`Counter\` arithmetic only, print whether the word can be built from the tiles (\`Counter(word) - Counter(tiles)\` is empty), the letters they share as a sorted string of \`(Counter(word) & Counter(tiles)).elements()\`, the tiles left over after building it (or after removing what can be matched, if it cannot be built), sorted, and the most common tile with its count (ties by first appearance in the tile line).

**Input:** two lines.
**Output:** \`buildable <bool>\`, \`shared <letters>\`, \`left <letters or none>\`, \`top <letter> <count>\`.

\`\`\`text
aabbbc
abc
\`\`\`
prints
\`\`\`text
buildable True
shared abc
left abb
top b 3
\`\`\``,
          starter: String.raw`from collections import Counter

tiles = Counter(input().strip())
word = Counter(input().strip())
# TODO
`,
          solution: String.raw`from collections import Counter

tiles = Counter(input().strip())
word = Counter(input().strip())
missing = word - tiles
print(f"buildable {not missing}")
print("shared", "".join(sorted((word & tiles).elements())))
left = tiles - word
print("left", "".join(sorted(left.elements())) if left else "none")
letter, count = tiles.most_common(1)[0]
print(f"top {letter} {count}")
`,
          hints: [
            "`-` on Counters drops zero and negative counts, so an empty result means every letter was available.",
            "`elements()` repeats each key by its count; sort the result for a deterministic string.",
          ],
          cases: [
            { stdin: "aabbbc\nabc\n", expected: "buildable True\nshared abc\nleft abb\ntop b 3\n" },
            { stdin: "abc\nabcd\n", expected: "buildable False\nshared abc\nleft none\ntop a 1\n", hidden: true },
            { stdin: "zzzy\nyy\n", expected: "buildable False\nshared y\nleft zzz\ntop z 3\n", hidden: true },
          ],
        },
        {
          title: "LRU cache on OrderedDict",
          prompt: `Implement \`LRUCache(capacity)\` on an \`OrderedDict\`: \`get(key)\` returns the value and marks the key most recently used (\`move_to_end\`) or returns \`-1\`; \`put(key, value)\` inserts or updates, marks it most recent, and evicts the least recently used entry (\`popitem(last=False)\`) when over capacity. Read the capacity, then commands \`get k\` (print the result) and \`put k v\`; at the end print the keys from least to most recently used.

**Input:** the capacity, then commands.
**Output:** one line per \`get\`, then \`keys <k …>\` (or \`keys none\`).

\`\`\`text
2
put a 1
put b 2
get a
put c 3
get b
get c
\`\`\`
prints
\`\`\`text
1
-1
3
keys a c
\`\`\``,
          starter: String.raw`import sys
from collections import OrderedDict


class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self._data = OrderedDict()

    def get(self, key):
        # TODO
        return -1

    def put(self, key, value):
        # TODO
        pass

    def keys(self):
        return list(self._data)


cache = LRUCache(int(input()))
for line in sys.stdin:
    cmd, *args = line.split()
    if cmd == "get":
        print(cache.get(args[0]))
    else:
        cache.put(args[0], int(args[1]))
print("keys", " ".join(cache.keys()) if cache.keys() else "none")
`,
          solution: String.raw`import sys
from collections import OrderedDict


class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self._data = OrderedDict()

    def get(self, key):
        if key not in self._data:
            return -1
        self._data.move_to_end(key)
        return self._data[key]

    def put(self, key, value):
        self._data[key] = value
        self._data.move_to_end(key)
        if len(self._data) > self.capacity:
            self._data.popitem(last=False)

    def keys(self):
        return list(self._data)


cache = LRUCache(int(input()))
for line in sys.stdin:
    cmd, *args = line.split()
    if cmd == "get":
        print(cache.get(args[0]))
    else:
        cache.put(args[0], int(args[1]))
print("keys", " ".join(cache.keys()) if cache.keys() else "none")
`,
          hints: [
            "The end of the `OrderedDict` is 'most recent'; `move_to_end` on every access keeps that invariant.",
            "`popitem(last=False)` removes from the front — the least recently used.",
          ],
          cases: [
            { stdin: "2\nput a 1\nput b 2\nget a\nput c 3\nget b\nget c\n", expected: "1\n-1\n3\nkeys a c\n" },
            { stdin: "1\nput x 1\nput x 2\nget x\nput y 3\nget x\n", expected: "2\n-1\nkeys y\n", hidden: true },
            { stdin: "3\nget q\n", expected: "-1\nkeys none\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `deque([1, 2, 3]).rotate(1)` produce?",
          options: ["`[2, 3, 1]`", "`[3, 1, 2]`", "`[1, 2, 3]`", "`[3, 2, 1]`"],
          answer: 1,
          explanation: "A positive rotation moves elements from the right end to the front.",
        },
        {
          prompt: "What is `Counter(a=3, b=1) - Counter(a=1, b=5)`?",
          options: ["`Counter({'a': 2, 'b': -4})`", "`Counter({'a': 2})`", "`Counter({'b': -4})`", "`TypeError`"],
          answer: 1,
          explanation: "Subtraction keeps only positive counts; `subtract()` would keep negatives.",
        },
        {
          prompt: "Which `OrderedDict` method does a plain dict lack, making LRU caches possible?",
          options: ["`pop`", "`move_to_end`", "`update`", "`keys`"],
          answer: 1,
          explanation: "A plain dict preserves insertion order but cannot re-order an existing key in O(1).",
        },
        {
          prompt: "Where does a write through a `ChainMap` go?",
          options: ["Every layer", "The first mapping only", "The last mapping", "A new layer"],
          answer: 1,
          explanation: "Reads search the layers in order; writes and deletes affect only `maps[0]`.",
        },
        {
          prompt: "Why do `UserDict` overrides of `__setitem__` affect `update()` when `dict` overrides do not?",
          options: ["`UserDict` is faster", "`UserDict` is written in Python and routes every operation through the basic item methods", "`dict.update` is a class method", "They behave the same"],
          answer: 1,
          explanation: "The C implementation of `dict` calls its own internals; the Python one calls your overrides.",
        },
      ],
    },
    {
      slug: "text-processing-tools",
      file: "04-text-processing-tools.md",
      exercises: [
        {
          title: "Wrap, shorten, suggest",
          prompt: `The first line is a width; the second a paragraph; the third a vocabulary of words; the remaining lines are words to check. Print the paragraph wrapped to the width with \`textwrap.fill\`, then \`shorten\`ed to the width with the placeholder \` […]\`, then for each remaining word either \`ok\` if it is in the vocabulary or \`did you mean <best>\` using \`difflib.get_close_matches\` (\`n=1\`, default cutoff), or \`no suggestion\`.

**Input:** width, paragraph, vocabulary, words.
**Output:** the wrapped lines, the shortened line, then one line per word.

\`\`\`text
20
The quick brown fox jumps over the lazy dog
apple banana cherry
appel
banana
zzz
\`\`\`
prints
\`\`\`text
The quick brown fox
jumps over the lazy
dog
The quick brown […]
did you mean apple
ok
no suggestion
\`\`\``,
          starter: String.raw`import difflib
import sys
import textwrap

width = int(input())
paragraph = input()
vocab = input().split()
# TODO
`,
          solution: String.raw`import difflib
import sys
import textwrap

width = int(input())
paragraph = input()
vocab = input().split()
print(textwrap.fill(paragraph, width=width))
print(textwrap.shorten(paragraph, width=width, placeholder=" […]"))
for line in sys.stdin:
    word = line.strip()
    if not word:
        continue
    if word in vocab:
        print("ok")
        continue
    matches = difflib.get_close_matches(word, vocab, n=1)
    print(f"did you mean {matches[0]}" if matches else "no suggestion")
`,
          hints: [
            "`fill` returns one string with newlines; `shorten` collapses whitespace and truncates on a word boundary.",
            "`get_close_matches` returns a list — empty when nothing passes the cutoff.",
          ],
          cases: [
            { stdin: "20\nThe quick brown fox jumps over the lazy dog\napple banana cherry\nappel\nbanana\nzzz\n", expected: "The quick brown fox\njumps over the lazy\ndog\nThe quick brown […]\ndid you mean apple\nok\nno suggestion\n" },
            { stdin: "10\nshort\nred green\ngren\n", expected: "short\nshort\ndid you mean green\n", hidden: true },
          ],
        },
        {
          title: "Regex in depth",
          prompt: `Each line is a command. \`pairs <text>\` extracts every \`key=value\` pair with named groups and prints them as \`key:value\` space-separated in order (or \`none\`). \`kg <text>\` prints the numbers immediately followed by \` kg\` (a lookahead, so the unit is not part of the match), space-separated (or \`none\`). \`double <text>\` doubles every integer in the text with \`re.sub\` and a function.

**Input:** command lines.
**Output:** one line per command.

\`\`\`text
pairs host=db port=8080 debug
kg 5 kg of rice, 12 lb of flour, 7 kg of sugar
double a1 b22 c
\`\`\`
prints
\`\`\`text
host:db port:8080
5 7
a2 b44 c
\`\`\``,
          starter: String.raw`import re
import sys

PAIR = re.compile(r"")   # TODO: named groups key and value
KG = re.compile(r"")     # TODO: digits followed by " kg" via lookahead

for line in sys.stdin:
    cmd, _, text = line.rstrip("\n").partition(" ")
    # TODO
`,
          solution: String.raw`import re
import sys

PAIR = re.compile(r"(?P<key>\w+)=(?P<value>\S+)")
KG = re.compile(r"\d+(?= kg)")

for line in sys.stdin:
    cmd, _, text = line.rstrip("\n").partition(" ")
    if cmd == "pairs":
        found = [f"{m['key']}:{m['value']}" for m in PAIR.finditer(text)]
        print(" ".join(found) if found else "none")
    elif cmd == "kg":
        found = KG.findall(text)
        print(" ".join(found) if found else "none")
    elif cmd == "double":
        print(re.sub(r"\d+", lambda m: str(int(m.group()) * 2), text))
`,
          hints: [
            "`m[\"key\"]` reads a named group from a `Match`; `finditer` yields the matches in order.",
            "`(?= kg)` asserts what follows without consuming it, so `findall` returns just the digits.",
          ],
          cases: [
            { stdin: "pairs host=db port=8080 debug\nkg 5 kg of rice, 12 lb of flour, 7 kg of sugar\ndouble a1 b22 c\n", expected: "host:db port:8080\n5 7\na2 b44 c\n" },
            { stdin: "pairs nothing here\nkg 3 lb\ndouble 0 and 100\n", expected: "none\nnone\n0 and 200\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `textwrap.dedent` do?",
          options: ["Indents every line", "Removes the common leading whitespace from every line", "Wraps to a width", "Removes all whitespace"],
          answer: 1,
          explanation: "It is the fix for indented triple-quoted strings inside functions.",
        },
        {
          prompt: "What does `difflib.get_close_matches(\"appel\", words)` return?",
          options: ["The single best match", "A list of the closest matches above a cutoff, best first", "A ratio", "A diff"],
          answer: 1,
          explanation: "`n` bounds the list and `cutoff` (default 0.6) the similarity; the list may be empty.",
        },
        {
          prompt: "Why use `string.Template` for a template supplied by a user?",
          options: ["It is faster than f-strings", "Its `$name` placeholders cannot call methods or read attributes, so it cannot be abused", "It supports format specs", "It is the only option"],
          answer: 1,
          explanation: "`str.format` on untrusted templates can reach into objects; `Template` is deliberately limited.",
        },
        {
          prompt: "What does `(?<=\\$)\\d+` match in `\"cost $40\"`?",
          options: ["`$40`", "`40` — preceded by `$`, which is not part of the match", "`cost`", "Nothing"],
          answer: 1,
          explanation: "A lookbehind asserts context without consuming it.",
        },
        {
          prompt: "What does `re.sub(pattern, func, text)` pass to `func`?",
          options: ["The matched string", "A `Match` object for each match; its return value is the replacement", "The whole text", "The group list"],
          answer: 1,
          explanation: "That is how a computed replacement (doubling numbers, title-casing) is applied per match.",
        },
      ],
    },
    {
      slug: "enums",
      file: "05-enums.md",
      exercises: [
        {
          title: "A status machine",
          prompt: `Define \`Status(Enum)\` with values \`pending\`, \`active\` and \`closed\`, and a method \`next()\` returning the next status in definition order (\`closed\` stays \`closed\`). Commands: \`set <value>\` (look up by value; \`unknown status\` on \`ValueError\`), \`next\` (advance and print the new status's name), \`show\` (print \`<name>=<value>\`), \`list\` (all members as \`name=value\` space-separated).

**Input:** commands (the status starts as \`pending\`).
**Output:** one line per \`next\`, \`show\`, \`list\` and failed \`set\`.

\`\`\`text
list
set active
next
next
show
set archived
\`\`\`
prints
\`\`\`text
PENDING=pending ACTIVE=active CLOSED=closed
CLOSED
CLOSED
CLOSED=closed
unknown status
\`\`\``,
          starter: String.raw`import sys
from enum import Enum


class Status(Enum):
    PENDING = "pending"
    ACTIVE = "active"
    CLOSED = "closed"

    def next(self):
        # TODO: the member after self in definition order, or self if last
        return self


status = Status.PENDING
for line in sys.stdin:
    cmd, *args = line.split()
    # TODO
`,
          solution: String.raw`import sys
from enum import Enum


class Status(Enum):
    PENDING = "pending"
    ACTIVE = "active"
    CLOSED = "closed"

    def next(self):
        members = list(type(self))
        i = members.index(self)
        return members[min(i + 1, len(members) - 1)]


status = Status.PENDING
for line in sys.stdin:
    cmd, *args = line.split()
    if cmd == "set":
        try:
            status = Status(args[0])
        except ValueError:
            print("unknown status")
    elif cmd == "next":
        status = status.next()
        print(status.name)
    elif cmd == "show":
        print(f"{status.name}={status.value}")
    elif cmd == "list":
        print(" ".join(f"{m.name}={m.value}" for m in Status))
`,
          hints: [
            "`list(Status)` is the members in definition order; `type(self)` inside a method is the enum class.",
            "`Status(text)` looks up by value and raises `ValueError` for anything else.",
          ],
          cases: [
            { stdin: "list\nset active\nnext\nnext\nshow\nset archived\n", expected: "PENDING=pending ACTIVE=active CLOSED=closed\nCLOSED\nCLOSED\nCLOSED=closed\nunknown status\n" },
            { stdin: "show\nnext\nshow\n", expected: "PENDING=pending\nACTIVE\nACTIVE=active\n", hidden: true },
            { stdin: "set closed\nnext\n", expected: "CLOSED\n", hidden: true },
          ],
        },
        {
          title: "Typed permission flags",
          prompt: `Define \`Perm(Flag)\` with \`READ\`, \`WRITE\` and \`EXEC\` via \`auto()\`. The first line grants permissions by name (possibly none). Commands: \`has NAME\` (\`True\`/\`False\` via \`in\`), \`add NAME\`, \`remove NAME\`, \`show\` — printing the value and the names of the set members in definition order as \`<value>: <names>\` (or \`0: none\`).

**Input:** a line of names, then commands.
**Output:** one line per \`has\` and \`show\`.

\`\`\`text
READ EXEC
show
has WRITE
add WRITE
remove READ
show
\`\`\`
prints
\`\`\`text
5: READ EXEC
False
6: WRITE EXEC
\`\`\``,
          starter: String.raw`import sys
from enum import Flag, auto


class Perm(Flag):
    READ = auto()
    WRITE = auto()
    EXEC = auto()


perms = Perm(0)
for name in input().split():
    perms |= Perm[name]
for line in sys.stdin:
    cmd, *args = line.split()
    # TODO
`,
          solution: String.raw`import sys
from enum import Flag, auto


class Perm(Flag):
    READ = auto()
    WRITE = auto()
    EXEC = auto()


perms = Perm(0)
for name in input().split():
    perms |= Perm[name]
for line in sys.stdin:
    cmd, *args = line.split()
    if cmd == "has":
        print(Perm[args[0]] in perms)
    elif cmd == "add":
        perms |= Perm[args[0]]
    elif cmd == "remove":
        perms &= ~Perm[args[0]]
    elif cmd == "show":
        names = [m.name for m in Perm if m in perms]
        print(f"{perms.value}: {' '.join(names) if names else 'none'}")
`,
          hints: [
            "`Perm[name]` looks up by name; `|=`, `&= ~` and `in` work on flags as on bit masks.",
            "Iterating the class gives the single-bit members in definition order — test each with `in`.",
          ],
          cases: [
            { stdin: "READ EXEC\nshow\nhas WRITE\nadd WRITE\nremove READ\nshow\n", expected: "5: READ EXEC\nFalse\n6: WRITE EXEC\n" },
            { stdin: "\nshow\nremove READ\nhas READ\nadd READ\nadd READ\nshow\n", expected: "0: none\nFalse\n1: READ\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is `Status.ACTIVE == \"active\"` for a plain `Enum` with value `\"active\"`?",
          options: ["`True`", "`False` — a member is not its value", "`TypeError`", "Depends on `auto`"],
          answer: 1,
          explanation: "`StrEnum` would make it true; the plain `Enum` is deliberately strict.",
        },
        {
          prompt: "How is a member looked up by value?",
          options: ["`Status[\"active\"]`", "`Status(\"active\")`", "`Status.value(\"active\")`", "`Status.get(\"active\")`"],
          answer: 1,
          explanation: "Calling the class looks up by value (`ValueError` if absent); subscripting looks up by name.",
        },
        {
          prompt: "What does `@enum.unique` do?",
          options: ["Sorts the members", "Raises `ValueError` if two members share a value (which would otherwise be aliases)", "Makes values unique automatically", "Freezes the enum"],
          answer: 1,
          explanation: "Duplicate values silently create aliases; `unique` turns that into an error.",
        },
        {
          prompt: "Which enum class makes members usable as ints in arithmetic and comparisons?",
          options: ["`Enum`", "`IntEnum`", "`Flag`", "`StrEnum`"],
          answer: 1,
          explanation: "`IntEnum` members are ints; `StrEnum` members are strings; plain `Enum` members are neither.",
        },
        {
          prompt: "In `match`, which pattern compares against an enum member?",
          options: ["`case ACTIVE:`", "`case Status.ACTIVE:`", "`case \"ACTIVE\":`", "`case Status:`"],
          answer: 1,
          explanation: "The dotted name is a value pattern; a bare name would capture and match anything.",
        },
      ],
    },
    {
      slug: "standard-library-checkpoint",
      file: "06-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Statistics report",
          prompt: `Read amounts as decimal strings with two decimals, one per line. Print the mean, median and population standard deviation computed by \`statistics\` over floats, each with three decimals; then the exact total as a \`Decimal\` sum of the strings; then the total rounded to whole units with \`quantize(Decimal("1"), rounding=ROUND_HALF_UP)\`; then the mean as an exact \`Fraction\` of the total in cents over the count, reduced.

**Input:** at least one amount per line.
**Output:** \`mean <m>\`, \`median <d>\`, \`pstdev <s>\`, \`total <t>\`, \`rounded <r>\`, \`exact-mean <p>/<q>\` (or \`exact-mean <n>\` when the denominator is 1).

\`\`\`text
10.00
20.50
30.00
\`\`\`
prints
\`\`\`text
mean 20.167
median 20.500
pstdev 8.168
total 60.50
rounded 61
exact-mean 6050/3
\`\`\``,
          starter: String.raw`import statistics
import sys
from decimal import Decimal, ROUND_HALF_UP
from fractions import Fraction

texts = [line.strip() for line in sys.stdin if line.strip()]
floats = [float(t) for t in texts]
# TODO
`,
          solution: String.raw`import statistics
import sys
from decimal import Decimal, ROUND_HALF_UP
from fractions import Fraction

texts = [line.strip() for line in sys.stdin if line.strip()]
floats = [float(t) for t in texts]
print(f"mean {statistics.fmean(floats):.3f}")
print(f"median {statistics.median(floats):.3f}")
print(f"pstdev {statistics.pstdev(floats):.3f}")
total = sum(Decimal(t) for t in texts)
print(f"total {total}")
print(f"rounded {total.quantize(Decimal('1'), rounding=ROUND_HALF_UP)}")
cents = sum(int(t.replace(".", "")) for t in texts)
exact = Fraction(cents, len(texts))
print(f"exact-mean {exact.numerator}" if exact.denominator == 1 else f"exact-mean {exact}")
`,
          hints: [
            "Decimal from the *strings* keeps the two-decimal precision exactly; `sum` of Decimals is a Decimal.",
            "`Fraction(cents, n)` reduces automatically; test `denominator == 1` for the integer case.",
          ],
          cases: [
            { stdin: "10.00\n20.50\n30.00\n", expected: "mean 20.167\nmedian 20.500\npstdev 8.168\ntotal 60.50\nrounded 61\nexact-mean 6050/3\n" },
            { stdin: "2.50\n2.50\n", expected: "mean 2.500\nmedian 2.500\npstdev 0.000\ntotal 5.00\nrounded 5\nexact-mean 250\n", hidden: true },
            { stdin: "0.05\n", expected: "mean 0.050\nmedian 0.050\npstdev 0.000\ntotal 0.05\nrounded 0\nexact-mean 5\n", hidden: true },
          ],
        },
        {
          title: "Schedule across zones",
          prompt: `The first line is \`<zone> <ISO start datetime>\` — a meeting start as a wall-clock time in that zone. The following lines are either \`add <minutes>\` (shift the start by a \`timedelta\`), or \`in <zone>\` (print the current start converted to that zone in ISO format), or \`utc\` (print it in UTC). Use aware datetimes throughout.

**Input:** the first line, then commands.
**Output:** one line per \`in\` and \`utc\`.

\`\`\`text
Asia/Kolkata 2024-03-10T09:00:00
utc
in Europe/London
add 90
in America/New_York
\`\`\`
prints
\`\`\`text
2024-03-10T03:30:00+00:00
2024-03-10T03:30:00+00:00
2024-03-10T00:00:00-05:00
\`\`\``,
          starter: String.raw`import sys
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

zone, text = input().split()
start = datetime.fromisoformat(text).replace(tzinfo=ZoneInfo(zone))
for line in sys.stdin:
    cmd, *args = line.split()
    # TODO
`,
          solution: String.raw`import sys
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

zone, text = input().split()
start = datetime.fromisoformat(text).replace(tzinfo=ZoneInfo(zone))
for line in sys.stdin:
    cmd, *args = line.split()
    if cmd == "add":
        start += timedelta(minutes=int(args[0]))
    elif cmd == "in":
        print(start.astimezone(ZoneInfo(args[0])).isoformat())
    elif cmd == "utc":
        print(start.astimezone(timezone.utc).isoformat())
`,
          hints: [
            "Adding a `timedelta` to an aware datetime moves the instant; converting afterwards shows the new wall-clock time in each zone.",
            "New York switched to daylight time on 10 March 2024 at 02:00 local (07:00 UTC); this instant is two hours earlier, so it is still −05:00 — `ZoneInfo` decides that for you.",
          ],
          cases: [
            { stdin: "Asia/Kolkata 2024-03-10T09:00:00\nutc\nin Europe/London\nadd 90\nin America/New_York\n", expected: "2024-03-10T03:30:00+00:00\n2024-03-10T03:30:00+00:00\n2024-03-10T00:00:00-05:00\n", hidden: false },
            { stdin: "UTC 2024-01-01T00:00:00\nadd -1\nin Asia/Kolkata\n", expected: "2024-01-01T05:29:00+05:30\n", hidden: true },
            { stdin: "America/New_York 2024-07-04T20:00:00\nutc\nadd 1440\nin Europe/London\n", expected: "2024-07-05T00:00:00+00:00\n2024-07-06T01:00:00+01:00\n", hidden: true },
          ],
        },
        {
          title: "Cache operations as an enum",
          prompt: `Define \`Op(StrEnum)\` with members \`GET\`, \`PUT\`, \`DEL\` and \`SIZE\` whose values are the lower-case words (\`auto()\`). Parse each command's first word with \`Op(word)\` — an unknown word prints \`unknown op\` — and drive an LRU cache on \`OrderedDict\` of the given capacity: \`get k\` prints the value or \`-1\`, \`put k v\`, \`del k\` (prints \`deleted\` or \`missing\`), \`size\` prints the entry count. At the end print the keys from least to most recently used.

**Input:** the capacity, then commands.
**Output:** the command results, then \`keys …\` (or \`keys none\`).

\`\`\`text
2
put a 1
put b 2
get a
put c 3
del b
size
flush
\`\`\`
prints
\`\`\`text
1
missing
2
unknown op
keys a c
\`\`\``,
          starter: String.raw`import sys
from collections import OrderedDict
from enum import StrEnum, auto


class Op(StrEnum):
    GET = auto()
    PUT = auto()
    DEL = auto()
    SIZE = auto()


capacity = int(input())
cache = OrderedDict()
for line in sys.stdin:
    word, *args = line.split()
    # TODO: op = Op(word) inside try/except ValueError, then dispatch
print("keys", " ".join(cache) if cache else "none")
`,
          solution: String.raw`import sys
from collections import OrderedDict
from enum import StrEnum, auto


class Op(StrEnum):
    GET = auto()
    PUT = auto()
    DEL = auto()
    SIZE = auto()


capacity = int(input())
cache = OrderedDict()
for line in sys.stdin:
    word, *args = line.split()
    try:
        op = Op(word)
    except ValueError:
        print("unknown op")
        continue
    match op:
        case Op.GET:
            if args[0] in cache:
                cache.move_to_end(args[0])
                print(cache[args[0]])
            else:
                print(-1)
        case Op.PUT:
            cache[args[0]] = int(args[1])
            cache.move_to_end(args[0])
            if len(cache) > capacity:
                cache.popitem(last=False)
        case Op.DEL:
            print("deleted" if cache.pop(args[0], None) is not None else "missing")
        case Op.SIZE:
            print(len(cache))
print("keys", " ".join(cache) if cache else "none")
`,
          hints: [
            "`auto()` on a `StrEnum` gives the lower-cased member name as the value, so `Op(\"get\")` is `Op.GET`.",
            "Dotted names in the `case` patterns compare against the members.",
          ],
          cases: [
            { stdin: "2\nput a 1\nput b 2\nget a\nput c 3\ndel b\nsize\nflush\n", expected: "1\nmissing\n2\nunknown op\nkeys a c\n" },
            { stdin: "1\nsize\nput x 5\nput y 6\nget x\ndel y\nsize\n", expected: "0\n-1\ndeleted\n0\nkeys none\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What is `math.comb(5, 2)`?",
          options: ["`20`", "`10`", "`25`", "`120`"],
          answer: 1,
          explanation: "Combinations choose unordered pairs: 5 × 4 / 2 = 10. `perm(5, 2)` is 20.",
        },
        {
          prompt: "What does `statistics.median([1, 2, 3, 4])` return?",
          options: ["`2`", "`2.5`", "`3`", "`StatisticsError`"],
          answer: 1,
          explanation: "For an even count the median is the mean of the two middle values.",
        },
        {
          prompt: "Which expression is exactly three tenths?",
          options: ["`0.1 + 0.2`", "`Fraction(\"0.1\") + Fraction(\"0.2\")`", "`Fraction(0.1) + Fraction(0.2)`", "`round(0.1 + 0.2, 1)`"],
          answer: 1,
          explanation: "Fractions built from strings are exact; from floats they inherit the binary error.",
        },
        {
          prompt: "What does `date(2024, 3, 1) - date(2024, 2, 1)` give?",
          options: ["`29`", "`timedelta(days=29)`", "`timedelta(days=28)`", "`TypeError`"],
          answer: 1,
          explanation: "Date subtraction yields a `timedelta`; 2024 is a leap year, so February has 29 days.",
        },
        {
          prompt: "What does `datetime.now()` return, and why avoid it in a judged program?",
          options: ["An aware UTC datetime; it is fine", "A naive local datetime; it is nondeterministic", "A timestamp float", "A string"],
          answer: 1,
          explanation: "The clock differs on every run; pass the time in as data instead.",
        },
        {
          prompt: "What does `ZoneInfo(\"Europe/London\")` know that `timezone(timedelta(hours=1))` does not?",
          options: ["Nothing", "The daylight-saving rules — the offset changes twice a year", "The zone's name only", "Leap seconds"],
          answer: 1,
          explanation: "Fixed offsets are only right for zones without DST.",
        },
        {
          prompt: "What is `deque(maxlen=3)` after appending 1, 2, 3, 4?",
          options: ["`[1, 2, 3]`", "`[2, 3, 4]`", "`[1, 2, 3, 4]`", "It raises"],
          answer: 1,
          explanation: "A bounded deque discards from the opposite end when full.",
        },
        {
          prompt: "What does `Counter(\"aab\") & Counter(\"abb\")` give?",
          options: ["`Counter({'a': 2, 'b': 2})`", "`Counter({'a': 1, 'b': 1})`", "`Counter({'a': 3, 'b': 3})`", "`Counter()`"],
          answer: 1,
          explanation: "Intersection takes the minimum count per key.",
        },
        {
          prompt: "What does `textwrap.shorten(\"a b c d\", width=5, placeholder=\"…\")` produce?",
          options: ["`'a b c'`", "`'a b…'`", "`'a b c…'`", "`'…'`"],
          answer: 1,
          explanation: "It fits whole words plus the placeholder within the width.",
        },
        {
          prompt: "Which regex construct matches digits only when followed by `px`, without including `px`?",
          options: ["`\\d+px`", "`\\d+(?=px)`", "`(?<=px)\\d+`", "`\\d+(px)`"],
          answer: 1,
          explanation: "A lookahead asserts the following text; the match itself stops before it.",
        },
        {
          prompt: "What is the value of the second member of `class C(Enum): A = auto(); B = auto()`?",
          options: ["`'B'`", "`2`", "`1`", "`'b'`"],
          answer: 1,
          explanation: "`auto()` numbers plain `Enum` members from 1; on a `StrEnum` it would give the lower-cased name.",
        },
        {
          prompt: "What does `Perm.READ in (Perm.READ | Perm.EXEC)` evaluate to?",
          options: ["`False`", "`True`", "`TypeError`", "`Perm.READ`"],
          answer: 1,
          explanation: "`in` on flags tests whether every bit of the left operand is set in the right.",
        },
      ],
    },
  ],
});
