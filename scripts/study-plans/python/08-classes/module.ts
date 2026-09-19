import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "classes",
  title: "Classes and objects",
  blurb: "The class statement with __init__ and self, instance versus class attributes, the dunder methods that make a class behave like a built-in, @property and __slots__, class methods as alternative constructors, dataclasses and their options, and the design discipline of invariants and small interfaces.",
  icon: "box",
  overview: `A Python class is transparent in a way most languages' are not: an instance is a dictionary of attributes with a pointer to its class, a method is a function whose first parameter receives the instance, and every operator is a call to a double-underscore method the class may define. This module builds classes on that understanding — no magic, just a protocol — from \`__init__\` and \`self\` through the data model, properties, class methods and dataclasses, to the judgement of when a class is worth writing at all: when it protects an invariant behind a small interface.

Defining classes covers the statement, \`self\`, instance attributes, the shared-mutable class-attribute trap and \`__repr__\`. Dunder methods gives representation, equality and hashing, ordering with \`total_ordering\`, the collection dunders, arithmetic with reflected operators and \`NotImplemented\`. Properties and encapsulation covers the underscore conventions and name mangling, \`@property\` with setters, \`cached_property\`, read-only attributes and \`__slots__\`. Class and static methods covers \`cls\`, alternative constructors, class-level state and when a module function is better. Dataclasses gives the decorator, \`field\`, the options (\`order\`, \`frozen\`, \`slots\`, \`kw_only\`), \`__post_init__\` and the helpers. Designing a class works one example through invariants, representation, interface and tests.

The exercises are whole programs: a tally class with a class-level count, an account with a proper \`__repr__\`, a \`Money\` type with arithmetic and ordering dunders, a playlist that behaves as a collection, a temperature with validated and computed properties, a slotted point, a duration built by alternative constructors, a username validated by a static method, dataclass records sorted and replaced, a frozen point set, the inventory from the lesson and a bounded stack. The checkpoint adds a normalised fraction value type, a ledger of accounts with transfers, and a frozen product catalogue with derived fields.`,
  lessons: [
    {
      slug: "defining-classes",
      file: "01-defining-classes.md",
      exercises: [
        {
          title: "Tallies with a class-level count",
          prompt: `Write \`Tally\`, a named counter: \`Tally(name)\` starts at 0, \`inc(by=1)\` adds, and \`__repr__\` returns \`Tally(name='x', value=3)\`. The class keeps a **class attribute** \`created\` counting how many instances have been made. Run commands: \`new name\`, \`inc name [by]\`, \`show name\` (prints the repr), \`created\` (prints the class count).

**Input:** commands.
**Output:** one line per \`show\` and \`created\`.

\`\`\`text
new hits
inc hits
inc hits 4
show hits
new misses
created
\`\`\`
prints
\`\`\`text
Tally(name='hits', value=5)
2
\`\`\``,
          starter: String.raw`import sys


class Tally:
    created = 0

    def __init__(self, name):
        # TODO: set the instance attributes and bump the class count
        pass

    def inc(self, by=1):
        pass

    def __repr__(self):
        return ""


tallies = {}
for line in sys.stdin:
    cmd, *args = line.split()
    # TODO: new / inc / show / created
`,
          solution: String.raw`import sys


class Tally:
    created = 0

    def __init__(self, name):
        self.name = name
        self.value = 0
        Tally.created += 1

    def inc(self, by=1):
        self.value += by

    def __repr__(self):
        return f"Tally(name={self.name!r}, value={self.value})"


tallies = {}
for line in sys.stdin:
    cmd, *args = line.split()
    if cmd == "new":
        tallies[args[0]] = Tally(args[0])
    elif cmd == "inc":
        tallies[args[0]].inc(int(args[1]) if len(args) > 1 else 1)
    elif cmd == "show":
        print(tallies[args[0]])
    elif cmd == "created":
        print(Tally.created)
`,
          hints: [
            "Increment the shared counter through the class name — `self.created += 1` would create an instance attribute instead.",
            "`{self.name!r}` puts quotes around the name in the repr.",
          ],
          cases: [
            { stdin: "new hits\ninc hits\ninc hits 4\nshow hits\nnew misses\ncreated\n", expected: "Tally(name='hits', value=5)\n2\n" },
            { stdin: "created\nnew a\nnew b\nnew c\ncreated\nshow b\n", expected: "0\n3\nTally(name='b', value=0)\n", hidden: true },
            { stdin: "new x\ninc x -2\nshow x\n", expected: "Tally(name='x', value=-2)\n", hidden: true },
          ],
        },
        {
          title: "Account",
          prompt: `Write \`Account(owner, balance=0)\` with \`deposit(amount)\`, \`withdraw(amount)\` that raises \`ValueError\` when the balance would go negative, and a \`__repr__\` of the form \`Account(owner='ada', balance=120)\`. Process commands \`open owner [balance]\`, \`deposit owner amount\`, \`withdraw owner amount\` (print \`insufficient funds\` when the exception is raised) and \`show owner\`.

**Input:** commands.
**Output:** one line per \`show\` and per failed withdrawal.

\`\`\`text
open ada 100
deposit ada 50
withdraw ada 30
withdraw ada 500
show ada
\`\`\`
prints
\`\`\`text
insufficient funds
Account(owner='ada', balance=120)
\`\`\``,
          starter: String.raw`import sys


class Account:
    def __init__(self, owner, balance=0):
        pass

    def deposit(self, amount):
        pass

    def withdraw(self, amount):
        pass

    def __repr__(self):
        return ""


accounts = {}
for line in sys.stdin:
    cmd, *args = line.split()
    # TODO
`,
          solution: String.raw`import sys


class Account:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self.balance = balance

    def deposit(self, amount):
        self.balance += amount

    def withdraw(self, amount):
        if amount > self.balance:
            raise ValueError("insufficient funds")
        self.balance -= amount

    def __repr__(self):
        return f"Account(owner={self.owner!r}, balance={self.balance})"


accounts = {}
for line in sys.stdin:
    cmd, *args = line.split()
    if cmd == "open":
        accounts[args[0]] = Account(args[0], int(args[1]) if len(args) > 1 else 0)
    elif cmd == "deposit":
        accounts[args[0]].deposit(int(args[1]))
    elif cmd == "withdraw":
        try:
            accounts[args[0]].withdraw(int(args[1]))
        except ValueError:
            print("insufficient funds")
    elif cmd == "show":
        print(accounts[args[0]])
`,
          hints: [
            "Check the amount against the balance *before* changing anything, then raise.",
            "The command loop catches `ValueError` and prints the message; the class only raises.",
          ],
          cases: [
            { stdin: "open ada 100\ndeposit ada 50\nwithdraw ada 30\nwithdraw ada 500\nshow ada\n", expected: "insufficient funds\nAccount(owner='ada', balance=120)\n" },
            { stdin: "open bob\nwithdraw bob 1\nshow bob\n", expected: "insufficient funds\nAccount(owner='bob', balance=0)\n", hidden: true },
            { stdin: "open x 5\nwithdraw x 5\nshow x\n", expected: "Account(owner='x', balance=0)\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `acct.deposit(50)` translate to?",
          options: ["`deposit(acct, 50)`", "`Account.deposit(acct, 50)`", "`Account.deposit(50)`", "`acct.__dict__[\"deposit\"](50)`"],
          answer: 1,
          explanation: "Attribute lookup finds the function on the class and binds the instance as its first argument, `self`.",
        },
        {
          prompt: "What does this print?\n\n```python\nclass Team:\n    members = []\n\na, b = Team(), Team()\na.members.append(\"ada\")\nprint(b.members)\n```",
          options: ["`[]`", "`['ada']`", "`AttributeError`", "`None`"],
          answer: 1,
          explanation: "`members` is a class attribute — one list shared by every instance. Per-instance state must be created in `__init__`.",
        },
        {
          prompt: "Why does `TypeError: describe() takes 0 positional arguments but 1 was given` happen?",
          options: ["The method was called with an extra argument", "The method was defined without `self`, but the call passes the instance automatically", "The class has no `__init__`", "`describe` is a class attribute"],
          answer: 1,
          explanation: "Every instance method receives the instance as its first argument; a definition without `self` cannot accept it.",
        },
        {
          prompt: "Inside a method, what is `balance` (without `self.`)?",
          options: ["The instance attribute", "A local variable of the method, unrelated to the instance", "The class attribute", "A syntax error"],
          answer: 1,
          explanation: "Attributes are reached through `self`; a bare name is looked up in the method's local scope, then enclosing and global scopes.",
        },
        {
          prompt: "What is the recommended shape of `__repr__`?",
          options: ["A friendly sentence for users", "Text that looks like the constructor call, e.g. `Account(owner='ada', balance=5)`", "The memory address", "The class name only"],
          answer: 1,
          explanation: "The repr is for developers: unambiguous, showing the state, ideally re-creatable. Containers and tracebacks display it.",
        },
      ],
    },
    {
      slug: "dunder-methods",
      file: "02-dunder-methods.md",
      exercises: [
        {
          title: "Money with operators",
          prompt: `Implement \`Money\` holding integer cents with \`__add__\`, \`__mul__\` and \`__rmul__\` (by an int), \`__eq__\`, \`__lt__\` (decorated with \`functools.total_ordering\`), \`__hash__\` and \`__str__\` printing \`12.50\`. Return \`NotImplemented\` for foreign types. Read \`n\` amounts as text and print: their total via \`sum(amounts, Money(0))\`, the largest, the amounts sorted, \`3 * first\`, and the number of distinct amounts via a set.

**Input:** \`n\`, then \`n\` amounts with two decimals.
**Output:** \`total <x>\`, \`max <x>\`, \`sorted <x ...>\`, \`triple <x>\`, \`distinct <k>\`.

\`\`\`text
3
12.50
0.75
12.50
\`\`\`
prints
\`\`\`text
total 25.75
max 12.50
sorted 0.75 12.50 12.50
triple 37.50
distinct 2
\`\`\``,
          starter: String.raw`from functools import total_ordering


@total_ordering
class Money:
    def __init__(self, cents):
        self.cents = cents

    @classmethod
    def parse(cls, text):
        pounds, pence = text.split(".")
        return cls(int(pounds) * 100 + int(pence))

    # TODO: __add__, __mul__, __rmul__, __eq__, __lt__, __hash__, __str__


n = int(input())
amounts = [Money.parse(input().strip()) for _ in range(n)]
print(f"total {sum(amounts, Money(0))}")
print(f"max {max(amounts)}")
print("sorted", " ".join(str(m) for m in sorted(amounts)))
print(f"triple {3 * amounts[0]}")
print(f"distinct {len(set(amounts))}")
`,
          solution: String.raw`from functools import total_ordering


@total_ordering
class Money:
    def __init__(self, cents):
        self.cents = cents

    @classmethod
    def parse(cls, text):
        pounds, pence = text.split(".")
        return cls(int(pounds) * 100 + int(pence))

    def __add__(self, other):
        if not isinstance(other, Money):
            return NotImplemented
        return Money(self.cents + other.cents)

    def __mul__(self, factor):
        if not isinstance(factor, int):
            return NotImplemented
        return Money(self.cents * factor)

    def __rmul__(self, factor):
        return self * factor

    def __eq__(self, other):
        if not isinstance(other, Money):
            return NotImplemented
        return self.cents == other.cents

    def __lt__(self, other):
        if not isinstance(other, Money):
            return NotImplemented
        return self.cents < other.cents

    def __hash__(self):
        return hash(self.cents)

    def __str__(self):
        return f"{self.cents // 100}.{self.cents % 100:02d}"


n = int(input())
amounts = [Money.parse(input().strip()) for _ in range(n)]
print(f"total {sum(amounts, Money(0))}")
print(f"max {max(amounts)}")
print("sorted", " ".join(str(m) for m in sorted(amounts)))
print(f"triple {3 * amounts[0]}")
print(f"distinct {len(set(amounts))}")
`,
          hints: [
            "`sum` starts from its second argument and calls `__add__` repeatedly, so `Money(0)` must be a valid start.",
            "`3 * m` reaches `Money.__rmul__` because `int.__mul__` returns `NotImplemented` for a `Money`.",
            "Define `__hash__` alongside `__eq__` or `set(amounts)` fails.",
          ],
          cases: [
            { stdin: "3\n12.50\n0.75\n12.50\n", expected: "total 25.75\nmax 12.50\nsorted 0.75 12.50 12.50\ntriple 37.50\ndistinct 2\n" },
            { stdin: "1\n0.05\n", expected: "total 0.05\nmax 0.05\nsorted 0.05\ntriple 0.15\ndistinct 1\n", hidden: true },
            { stdin: "4\n1.00\n2.00\n0.99\n2.00\n", expected: "total 5.99\nmax 2.00\nsorted 0.99 1.00 2.00 2.00\ntriple 3.00\ndistinct 3\n", hidden: true },
          ],
        },
        {
          title: "A playlist that is a collection",
          prompt: `Implement \`Playlist\` over an internal list of titles with \`__len__\`, \`__contains__\`, \`__getitem__\` (delegating to the list, so negative indexes and slices work), \`__iter__\` and \`__bool__\`. Run commands: \`add title\`, \`len\`, \`has title\`, \`at i\` (\`no such track\` on \`IndexError\`), \`list\` (all titles space-separated, or \`empty\` when the playlist is falsy).

**Input:** commands.
**Output:** one line per query.

\`\`\`text
list
add intro
add outro
len
has intro
at -1
at 5
list
\`\`\`
prints
\`\`\`text
empty
2
True
outro
no such track
intro outro
\`\`\``,
          starter: String.raw`import sys


class Playlist:
    def __init__(self):
        self._tracks = []

    def add(self, title):
        self._tracks.append(title)

    # TODO: __len__, __contains__, __getitem__, __iter__, __bool__


p = Playlist()
for line in sys.stdin:
    cmd, *args = line.split()
    # TODO: add / len / has / at / list
`,
          solution: String.raw`import sys


class Playlist:
    def __init__(self):
        self._tracks = []

    def add(self, title):
        self._tracks.append(title)

    def __len__(self):
        return len(self._tracks)

    def __contains__(self, title):
        return title in self._tracks

    def __getitem__(self, i):
        return self._tracks[i]

    def __iter__(self):
        return iter(self._tracks)

    def __bool__(self):
        return bool(self._tracks)


p = Playlist()
for line in sys.stdin:
    cmd, *args = line.split()
    if cmd == "add":
        p.add(args[0])
    elif cmd == "len":
        print(len(p))
    elif cmd == "has":
        print(args[0] in p)
    elif cmd == "at":
        try:
            print(p[int(args[0])])
        except IndexError:
            print("no such track")
    elif cmd == "list":
        print(" ".join(p) if p else "empty")
`,
          hints: [
            "Delegating each dunder to the inner list gives correct negative indexing and slicing for free.",
            "`\" \".join(p)` works because `__iter__` yields the strings.",
          ],
          cases: [
            { stdin: "list\nadd intro\nadd outro\nlen\nhas intro\nat -1\nat 5\nlist\n", expected: "empty\n2\nTrue\noutro\nno such track\nintro outro\n" },
            { stdin: "len\nhas x\nat 0\n", expected: "0\nFalse\nno such track\n", hidden: true },
            { stdin: "add a\nadd b\nadd c\nat 1\nlen\n", expected: "b\n3\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What should `__eq__` return when `other` is of an unrelated type?",
          options: ["`False`", "`NotImplemented`", "`None`", "Raise `TypeError`"],
          answer: 1,
          explanation: "`NotImplemented` lets Python try the reflected operation and fall back to identity; returning `False` short-circuits that and can make `a == b` and `b == a` disagree.",
        },
        {
          prompt: "Which method makes `print(x)` show custom text when only one is defined?",
          options: ["`__str__` only", "`__repr__` — `str` falls back to it", "`__format__`", "`__print__`"],
          answer: 1,
          explanation: "`print` uses `str`, which falls back to `__repr__` when `__str__` is absent. Defining only `__str__` leaves containers showing the default repr.",
        },
        {
          prompt: "How does `3 * money` reach your class?",
          options: ["Through `Money.__mul__`", "`int.__mul__` returns `NotImplemented`, so Python calls `Money.__rmul__(money, 3)`", "It cannot; only `money * 3` works", "Through `__imul__`"],
          answer: 1,
          explanation: "The reflected method handles the case where the left operand does not know the right one.",
        },
        {
          prompt: "What does `@functools.total_ordering` require and provide?",
          options: ["Requires `__lt__` (or another ordering method) and `__eq__`; provides the rest of the comparisons", "Requires all six comparisons", "Provides `__eq__` and `__hash__`", "Requires `__cmp__`"],
          answer: 0,
          explanation: "Define one ordering dunder plus `__eq__`; the decorator derives `__le__`, `__gt__`, `__ge__`.",
        },
        {
          prompt: "A class defines `__len__` returning 0 for an empty collection and no `__bool__`. What is `bool(instance)` when empty?",
          options: ["`True`", "`False`", "`TypeError`", "`None`"],
          answer: 1,
          explanation: "Truth testing falls back on `__len__`; zero length is falsy. Define `__bool__` to override.",
        },
      ],
    },
    {
      slug: "properties-and-encapsulation",
      file: "03-properties-and-encapsulation.md",
      exercises: [
        {
          title: "Temperature with properties",
          prompt: `Implement \`Temperature\` storing \`_celsius\`. \`celsius\` is a property whose setter rejects values below \`-273.15\` with \`ValueError\`; \`fahrenheit\` is a computed property with a setter that converts and stores through \`celsius\` (so validation applies to both). Commands: \`c value\` sets Celsius, \`f value\` sets Fahrenheit, \`show\` prints both with two decimals; an invalid value prints \`invalid\` and leaves the temperature unchanged.

**Input:** commands (the temperature starts at 0 °C).
**Output:** one line per \`show\` and per rejected value.

\`\`\`text
c 100
show
f 32
show
c -300
show
\`\`\`
prints
\`\`\`text
100.00C 212.00F
0.00C 32.00F
invalid
0.00C 32.00F
\`\`\``,
          starter: String.raw`import sys


class Temperature:
    def __init__(self, celsius=0.0):
        self.celsius = celsius

    # TODO: celsius property + setter (validate), fahrenheit property + setter (convert)


t = Temperature()
for line in sys.stdin:
    cmd, *args = line.split()
    # TODO
`,
          solution: String.raw`import sys


class Temperature:
    def __init__(self, celsius=0.0):
        self.celsius = celsius

    @property
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        if value < -273.15:
            raise ValueError("below absolute zero")
        self._celsius = value

    @property
    def fahrenheit(self):
        return self._celsius * 9 / 5 + 32

    @fahrenheit.setter
    def fahrenheit(self, value):
        self.celsius = (value - 32) * 5 / 9


t = Temperature()
for line in sys.stdin:
    cmd, *args = line.split()
    try:
        if cmd == "c":
            t.celsius = float(args[0])
        elif cmd == "f":
            t.fahrenheit = float(args[0])
        elif cmd == "show":
            print(f"{t.celsius:.2f}C {t.fahrenheit:.2f}F")
    except ValueError:
        print("invalid")
`,
          hints: [
            "`__init__` assigns through `self.celsius`, so the setter validates the initial value too.",
            "The Fahrenheit setter converts and assigns to `self.celsius`, reusing the validation.",
          ],
          cases: [
            { stdin: "c 100\nshow\nf 32\nshow\nc -300\nshow\n", expected: "100.00C 212.00F\n0.00C 32.00F\ninvalid\n0.00C 32.00F\n" },
            { stdin: "f -500\nshow\nf 212\nshow\n", expected: "invalid\n0.00C 32.00F\n100.00C 212.00F\n", hidden: true },
            { stdin: "c -273.15\nshow\n", expected: "-273.15C -459.67F\n", hidden: true },
          ],
        },
        {
          title: "A slotted point",
          prompt: `Define \`Point\` with \`__slots__ = ("x", "y")\`. Process commands: \`set name value\` assigns an attribute (an unknown name prints \`AttributeError\`), \`get name\` prints the value, and \`dict\` prints whether the instance has a \`__dict__\` (\`hasattr(p, "__dict__")\`).

**Input:** commands (the point starts at \`0 0\`).
**Output:** one line per \`get\`, \`dict\` and failed \`set\`.

\`\`\`text
set x 5
set z 1
get x
dict
\`\`\`
prints
\`\`\`text
AttributeError
5
False
\`\`\``,
          starter: String.raw`import sys


class Point:
    # TODO: __slots__
    def __init__(self, x=0, y=0):
        self.x, self.y = x, y


p = Point()
for line in sys.stdin:
    cmd, *args = line.split()
    # TODO: set (catch AttributeError) / get / dict
`,
          solution: String.raw`import sys


class Point:
    __slots__ = ("x", "y")

    def __init__(self, x=0, y=0):
        self.x, self.y = x, y


p = Point()
for line in sys.stdin:
    cmd, *args = line.split()
    if cmd == "set":
        try:
            setattr(p, args[0], int(args[1]))
        except AttributeError:
            print("AttributeError")
    elif cmd == "get":
        print(getattr(p, args[0]))
    elif cmd == "dict":
        print(hasattr(p, "__dict__"))
`,
          hints: [
            "`setattr(obj, name, value)` assigns an attribute by name; with slots, an unknown name raises `AttributeError`.",
            "A slotted class without a `__dict__` slot has no per-instance dictionary at all.",
          ],
          cases: [
            { stdin: "set x 5\nset z 1\nget x\ndict\n", expected: "AttributeError\n5\nFalse\n" },
            { stdin: "get y\nset y -3\nget y\nset name 1\n", expected: "0\n-3\nAttributeError\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does a single leading underscore, as in `_balance`, do?",
          options: ["Makes the attribute private to the class", "Signals 'internal' by convention; nothing is enforced (and `import *` skips it)", "Mangles the name", "Makes it read-only"],
          answer: 1,
          explanation: "Python has no access control; the underscore is a message to readers. Double underscores add name mangling, still not privacy.",
        },
        {
          prompt: "Where is `self.__secret` actually stored for a class `Vault`?",
          options: ["`__secret`", "`_Vault__secret`", "`_secret`", "It is not stored — it is a compile-time constant"],
          answer: 1,
          explanation: "Name mangling prefixes the class name so a subclass's `__secret` does not collide. `vault._Vault__secret` still reads it.",
        },
        {
          prompt: "Why prefer a plain attribute over `get_x()`/`set_x()` methods?",
          options: ["Methods are slower", "A plain attribute can later become a `@property` without changing any caller", "Methods cannot be documented", "Attributes are private"],
          answer: 1,
          explanation: "Properties keep attribute syntax while adding validation or computation, so encapsulation can be introduced when needed rather than up front.",
        },
        {
          prompt: "What happens on `c.area = 5` when `area` is a `@property` with no setter?",
          options: ["The value is stored in `__dict__`", "`AttributeError: can't set attribute`", "The getter is called with 5", "It is silently ignored"],
          answer: 1,
          explanation: "A property without a setter is read-only; the assignment is refused.",
        },
        {
          prompt: "Which is a consequence of `__slots__`?",
          options: ["Instances cannot have any attributes", "Instances have no `__dict__`, use less memory, and reject attributes not named in the slots", "Attributes become private", "The class cannot be subclassed"],
          answer: 1,
          explanation: "Slots reserve fixed storage for the named attributes; a typo in an attribute name becomes an `AttributeError` rather than a silent new attribute.",
        },
      ],
    },
    {
      slug: "class-and-static-methods",
      file: "04-class-and-static-methods.md",
      exercises: [
        {
          title: "Durations from several forms",
          prompt: `Implement \`Duration\` holding total seconds with two alternative constructors: \`Duration.from_text("1h30m15s")\` (each of \`h\`, \`m\`, \`s\` optional, in that order) and \`Duration.from_seconds(n)\` — both must build the instance through \`cls(...)\`. \`__str__\` renders \`1h30m15s\` always showing all three parts, and \`__add__\` adds two durations. Commands: \`text <spec>\`, \`seconds <n>\` (each prints the parsed duration and its total seconds), \`sum\` (prints the sum of every duration parsed so far).

**Input:** commands.
**Output:** \`<h>h<m>m<s>s = <total>\` per parse, and \`<h>h<m>m<s>s\` per \`sum\`.

\`\`\`text
text 1h30m
seconds 5400
sum
\`\`\`
prints
\`\`\`text
1h30m0s = 5400
1h30m0s = 5400
3h0m0s
\`\`\``,
          starter: String.raw`import re
import sys


class Duration:
    def __init__(self, seconds):
        self.seconds = seconds

    # TODO: @classmethod from_text, @classmethod from_seconds, __add__, __str__


parsed = []
for line in sys.stdin:
    cmd, *rest = line.split()
    # TODO: sum has no argument; text / seconds take one
`,
          solution: String.raw`import re
import sys


class Duration:
    PATTERN = re.compile(r"(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?")

    def __init__(self, seconds):
        self.seconds = seconds

    @classmethod
    def from_text(cls, text):
        h, m, s = (int(x) if x else 0 for x in cls.PATTERN.fullmatch(text).groups())
        return cls(h * 3600 + m * 60 + s)

    @classmethod
    def from_seconds(cls, n):
        return cls(int(n))

    def __add__(self, other):
        if not isinstance(other, Duration):
            return NotImplemented
        return Duration(self.seconds + other.seconds)

    def __str__(self):
        h, rest = divmod(self.seconds, 3600)
        m, s = divmod(rest, 60)
        return f"{h}h{m}m{s}s"


parsed = []
for line in sys.stdin:
    cmd, *rest = line.split()
    if cmd == "sum":
        print(sum(parsed, Duration(0)))
        continue
    d = Duration.from_text(rest[0]) if cmd == "text" else Duration.from_seconds(rest[0])
    parsed.append(d)
    print(f"{d} = {d.seconds}")
`,
          hints: [
            "`cls(...)` inside a class method builds an instance of whichever class the method was called on.",
            "`divmod` twice turns total seconds into hours, minutes and seconds.",
            "A regex with three optional groups parses the text; an absent group is `None`.",
          ],
          cases: [
            { stdin: "text 1h30m\nseconds 5400\nsum\n", expected: "1h30m0s = 5400\n1h30m0s = 5400\n3h0m0s\n" },
            { stdin: "text 45s\ntext 2m\nsum\nsum\n", expected: "0h0m45s = 45\n0h2m0s = 120\n0h2m45s\n0h2m45s\n", hidden: true },
            { stdin: "seconds 3661\ntext 24h\n", expected: "1h1m1s = 3661\n24h0m0s = 86400\n", hidden: true },
          ],
        },
        {
          title: "Usernames with a static validator",
          prompt: `Implement \`Username\` with a \`@staticmethod is_valid(text)\` — 3 to 12 characters, letters, digits and underscores only, starting with a letter — that the constructor calls, raising \`ValueError\` for an invalid name, and a class attribute \`created\` counting successful constructions (increment via \`type(self)\`). Commands: \`check text\` prints \`valid\`/\`invalid\` using the static method directly; \`create text\` prints \`created <name>\` or \`rejected\`; \`count\` prints the class count.

**Input:** commands.
**Output:** one line per command.

\`\`\`text
check ada_1
check 1ada
create ada_1
create x
count
\`\`\`
prints
\`\`\`text
valid
invalid
created ada_1
rejected
1
\`\`\``,
          starter: String.raw`import re
import sys


class Username:
    created = 0

    def __init__(self, text):
        # TODO: validate with the static method, store, count
        pass

    @staticmethod
    def is_valid(text):
        # TODO
        return False


for line in sys.stdin:
    cmd, *args = line.split()
    # TODO
`,
          solution: String.raw`import re
import sys


class Username:
    created = 0
    RULE = re.compile(r"[A-Za-z][A-Za-z0-9_]{2,11}")

    def __init__(self, text):
        if not self.is_valid(text):
            raise ValueError(text)
        self.text = text
        type(self).created += 1

    @staticmethod
    def is_valid(text):
        return Username.RULE.fullmatch(text) is not None


for line in sys.stdin:
    cmd, *args = line.split()
    if cmd == "check":
        print("valid" if Username.is_valid(args[0]) else "invalid")
    elif cmd == "create":
        try:
            u = Username(args[0])
            print(f"created {u.text}")
        except ValueError:
            print("rejected")
    elif cmd == "count":
        print(Username.created)
`,
          hints: [
            "A static method uses neither `self` nor `cls`; it can be called as `Username.is_valid(...)` or `self.is_valid(...)`.",
            "`type(self).created += 1` updates the class attribute; `self.created += 1` would shadow it on the instance.",
          ],
          cases: [
            { stdin: "check ada_1\ncheck 1ada\ncreate ada_1\ncreate x\ncount\n", expected: "valid\ninvalid\ncreated ada_1\nrejected\n1\n" },
            { stdin: "count\ncreate abc\ncreate abcdefghijklm\ncreate abcdefghijkl\ncount\n", expected: "0\ncreated abc\nrejected\ncreated abcdefghijkl\n2\n", hidden: true },
            { stdin: "check a-b\ncheck ab\ncheck a_b\n", expected: "invalid\ninvalid\nvalid\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does a `@classmethod` receive as its first argument?",
          options: ["The instance", "The class it was called on (or the class of the instance it was called on)", "Nothing", "The module"],
          answer: 1,
          explanation: "`cls` is the class — which, for a subclass, is the subclass. That is what makes `cls(...)` in a factory return the right type.",
        },
        {
          prompt: "Why write `return cls(y, m, d)` rather than `return Date(y, m, d)` in `Date.from_iso`?",
          options: ["`cls` is faster", "So that `SubDate.from_iso(...)` returns a `SubDate`", "`Date` is not defined inside its own methods", "There is no difference"],
          answer: 1,
          explanation: "Hard-coding the class name makes subclasses' inherited constructors return the base class.",
        },
        {
          prompt: "What does `self.count += 1` do when `count` is a class attribute?",
          options: ["Increments the shared counter", "Creates an instance attribute `count` that shadows the class one; the class value is unchanged", "Raises `AttributeError`", "Increments both"],
          answer: 1,
          explanation: "The read finds the class attribute, but the assignment binds on the instance. Use `type(self).count += 1` or `ClassName.count += 1`.",
        },
        {
          prompt: "When is `@staticmethod` the right choice?",
          options: ["For any method that modifies the instance", "For a helper that uses neither instance nor class state but belongs with the class conceptually", "For alternative constructors", "For every method in a dataclass"],
          answer: 1,
          explanation: "Static methods are namespaced functions; constructors need `cls`, and instance behaviour needs `self`.",
        },
        {
          prompt: "What does calling `Temperature.describe()` (an instance method) without an instance do?",
          options: ["Works, with `self` as `None`", "`TypeError: missing 1 required positional argument: 'self'`", "Returns a bound method", "Creates an instance automatically"],
          answer: 1,
          explanation: "Accessed on the class, an instance method is a plain function that still expects its first argument.",
        },
      ],
    },
    {
      slug: "dataclasses",
      file: "05-dataclasses.md",
      exercises: [
        {
          title: "Employee records",
          prompt: `Define \`@dataclass(order=True) Employee\` with fields \`dept: str\`, \`salary: int\`, \`name: str\` — in that order, so the generated ordering sorts by department, then salary, then name. Read \`n\` records as \`name dept salary\`, print them sorted with plain \`sorted()\`, then print \`asdict\` of the first sorted record as JSON with sorted keys, then a copy of it made with \`replace(salary=...)\` doubled.

**Input:** \`n\`, then \`n\` lines.
**Output:** \`n\` lines \`Employee(dept='eng', salary=100, name='ada')\` (the generated repr), then the JSON line, then the replaced record's repr.

\`\`\`text
2
bob ops 90
ada eng 100
\`\`\`
prints
\`\`\`text
Employee(dept='eng', salary=100, name='ada')
Employee(dept='ops', salary=90, name='bob')
{"dept": "eng", "name": "ada", "salary": 100}
Employee(dept='eng', salary=200, name='ada')
\`\`\``,
          starter: String.raw`import json
from dataclasses import dataclass, asdict, replace


# TODO: the dataclass


n = int(input())
staff = []
for _ in range(n):
    name, dept, salary = input().split()
    # TODO: append an Employee
# TODO: print sorted, asdict as JSON, replace
`,
          solution: String.raw`import json
from dataclasses import dataclass, asdict, replace


@dataclass(order=True)
class Employee:
    dept: str
    salary: int
    name: str


n = int(input())
staff = []
for _ in range(n):
    name, dept, salary = input().split()
    staff.append(Employee(dept, int(salary), name))
ordered = sorted(staff)
for e in ordered:
    print(e)
first = ordered[0]
print(json.dumps(asdict(first), sort_keys=True))
print(replace(first, salary=first.salary * 2))
`,
          hints: [
            "`order=True` compares instances as tuples of their fields in declaration order.",
            "`asdict` gives a plain dict for `json.dumps`; `replace` returns a new instance with some fields changed.",
          ],
          cases: [
            { stdin: "2\nbob ops 90\nada eng 100\n", expected: "Employee(dept='eng', salary=100, name='ada')\nEmployee(dept='ops', salary=90, name='bob')\n{\"dept\": \"eng\", \"name\": \"ada\", \"salary\": 100}\nEmployee(dept='eng', salary=200, name='ada')\n" },
            { stdin: "3\nzed eng 50\namy eng 50\nkim eng 40\n", expected: "Employee(dept='eng', salary=40, name='kim')\nEmployee(dept='eng', salary=50, name='amy')\nEmployee(dept='eng', salary=50, name='zed')\n{\"dept\": \"eng\", \"name\": \"kim\", \"salary\": 40}\nEmployee(dept='eng', salary=80, name='kim')\n", hidden: true },
          ],
        },
        {
          title: "Frozen points",
          prompt: `Define \`@dataclass(frozen=True) Point\` with integer \`x\` and \`y\` and a \`__post_init__\` that raises \`ValueError\` when either is negative. Read \`n\` lines \`x y\`; for each print \`ok\` or \`invalid\`. Then print the number of distinct valid points (they are hashable), and try to assign \`x = 0\` on the first valid point — print \`frozen\` when \`FrozenInstanceError\` is raised — and finally print \`replace(first, x=0)\`.

**Input:** \`n\`, then \`n\` lines.
**Output:** \`n\` lines, then \`distinct <k>\`, \`frozen\`, and the replaced repr (the last two only if there is a valid point).

\`\`\`text
3
1 2
-1 0
1 2
\`\`\`
prints
\`\`\`text
ok
invalid
ok
distinct 1
frozen
Point(x=0, y=2)
\`\`\``,
          starter: String.raw`from dataclasses import dataclass, replace, FrozenInstanceError


# TODO: frozen dataclass with __post_init__ validation


n = int(input())
points = []
for _ in range(n):
    x, y = map(int, input().split())
    # TODO: try to build; print ok / invalid
# TODO: distinct, frozen test, replace
`,
          solution: String.raw`from dataclasses import dataclass, replace, FrozenInstanceError


@dataclass(frozen=True)
class Point:
    x: int
    y: int

    def __post_init__(self):
        if self.x < 0 or self.y < 0:
            raise ValueError("negative coordinate")


n = int(input())
points = []
for _ in range(n):
    x, y = map(int, input().split())
    try:
        points.append(Point(x, y))
        print("ok")
    except ValueError:
        print("invalid")
print(f"distinct {len(set(points))}")
if points:
    first = points[0]
    try:
        first.x = 0
    except FrozenInstanceError:
        print("frozen")
    print(replace(first, x=0))
`,
          hints: [
            "A frozen dataclass with `eq=True` (the default) generates `__hash__`, so a set of points works.",
            "`__post_init__` runs after the generated `__init__`; raising there rejects the instance.",
          ],
          cases: [
            { stdin: "3\n1 2\n-1 0\n1 2\n", expected: "ok\ninvalid\nok\ndistinct 1\nfrozen\nPoint(x=0, y=2)\n" },
            { stdin: "2\n-1 -1\n0 -5\n", expected: "invalid\ninvalid\ndistinct 0\n", hidden: true },
            { stdin: "3\n0 0\n5 5\n0 0\n", expected: "ok\nok\nok\ndistinct 2\nfrozen\nPoint(x=0, y=0)\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Which methods does a plain `@dataclass` generate?",
          options: ["`__init__`, `__repr__`, `__eq__`", "`__init__` only", "`__init__`, `__repr__`, `__eq__`, `__lt__`, `__hash__`", "`__repr__` and `__str__`"],
          answer: 0,
          explanation: "Ordering needs `order=True`; hashing needs `frozen=True` (or `unsafe_hash`).",
        },
        {
          prompt: "What happens with `tags: list = []` as a dataclass field?",
          options: ["Every instance shares one list", "`ValueError: mutable default … use default_factory`", "Each instance gets a new list", "`SyntaxError`"],
          answer: 1,
          explanation: "The decorator refuses mutable defaults outright; `field(default_factory=list)` is the fix.",
        },
        {
          prompt: "What does `frozen=True` change?",
          options: ["Fields cannot be reassigned after `__init__`, and instances become hashable", "Fields are private", "The class cannot be subclassed", "Only `__repr__` is generated"],
          answer: 0,
          explanation: "Immutability lets the decorator safely generate `__hash__` from the fields; `replace()` is how a 'modified' copy is made.",
        },
        {
          prompt: "Where does validation belong in a dataclass?",
          options: ["In `__init__` — override it", "In `__post_init__`, which runs after the generated `__init__`", "In `__repr__`", "Dataclasses cannot validate"],
          answer: 1,
          explanation: "`__init__` is generated; `__post_init__` is the hook for checks and derived fields.",
        },
        {
          prompt: "What does `order=True` compare?",
          options: ["The `repr` strings", "The fields as a tuple, in declaration order", "The `id`s", "Only the first field"],
          answer: 1,
          explanation: "Instances compare like tuples of their fields, so declaration order is the sort order — declare the sort key first.",
        },
      ],
    },
    {
      slug: "designing-a-class",
      file: "06-designing-a-class.md",
      exercises: [
        {
          title: "Inventory",
          prompt: `Implement the lesson's \`Inventory\`: \`add(name, price_cents, qty)\` (rejects \`qty <= 0\` with \`ValueError\`; a repeated name adds to the quantity and keeps the first price), \`remove(name, qty)\` (\`KeyError\` for an unknown name, \`ValueError\` when there is not enough), \`quantity(name)\`, \`total_value_cents()\`, \`__len__\`, \`__contains__\` and \`__iter__\` yielding \`(name, price_cents, qty)\` sorted by name. Commands: \`add name price qty\`, \`remove name qty\`, \`qty name\`, \`value\`, \`list\`; errors print \`unknown item\`, \`bad quantity\` or \`not enough\`.

**Input:** commands.
**Output:** one line per query and per error; \`list\` prints \`name qty price\` per item or \`empty\`.

\`\`\`text
add bolt 5 100
add nut 2 250
remove bolt 30
remove nut 999
remove screw 1
qty bolt
value
list
\`\`\`
prints
\`\`\`text
not enough
unknown item
70
850
bolt 70 5
nut 250 2
\`\`\``,
          starter: String.raw`import sys


class Inventory:
    def __init__(self):
        self._stock = {}  # name -> [price_cents, qty]

    # TODO: add, remove, quantity, total_value_cents, __len__, __contains__, __iter__


inv = Inventory()
for line in sys.stdin:
    cmd, *args = line.split()
    # TODO: dispatch, catching KeyError / ValueError
`,
          solution: String.raw`import sys


class Inventory:
    def __init__(self):
        self._stock = {}  # name -> [price_cents, qty]

    def add(self, name, price_cents, qty):
        if qty <= 0:
            raise ValueError("bad quantity")
        if name in self._stock:
            self._stock[name][1] += qty
        else:
            self._stock[name] = [price_cents, qty]

    def remove(self, name, qty):
        if name not in self._stock:
            raise KeyError(name)
        if qty > self._stock[name][1]:
            raise ValueError("not enough")
        self._stock[name][1] -= qty
        if self._stock[name][1] == 0:
            del self._stock[name]

    def quantity(self, name):
        return self._stock[name][1] if name in self._stock else 0

    def total_value_cents(self):
        return sum(price * qty for price, qty in self._stock.values())

    def __len__(self):
        return len(self._stock)

    def __contains__(self, name):
        return name in self._stock

    def __iter__(self):
        for name in sorted(self._stock):
            price, qty = self._stock[name]
            yield name, price, qty


inv = Inventory()
for line in sys.stdin:
    cmd, *args = line.split()
    try:
        if cmd == "add":
            inv.add(args[0], int(args[1]), int(args[2]))
        elif cmd == "remove":
            inv.remove(args[0], int(args[1]))
        elif cmd == "qty":
            print(inv.quantity(args[0]))
        elif cmd == "value":
            print(inv.total_value_cents())
        elif cmd == "list":
            if inv:
                for name, price, qty in inv:
                    print(name, qty, price)
            else:
                print("empty")
    except KeyError:
        print("unknown item")
    except ValueError as e:
        print(e)
`,
          hints: [
            "Check everything before mutating, so a failed `remove` leaves the stock unchanged.",
            "Raise `ValueError` with the exact message the command loop should print, and `KeyError` for unknown names.",
            "`if inv:` uses `__len__` for truthiness; `__iter__` sorts for deterministic output.",
          ],
          cases: [
            { stdin: "add bolt 5 100\nadd nut 2 250\nremove bolt 30\nremove nut 999\nremove screw 1\nqty bolt\nvalue\nlist\n", expected: "not enough\nunknown item\n70\n850\nbolt 70 5\nnut 250 2\n" },
            { stdin: "list\nadd a 10 0\nqty a\nadd a 10 3\nadd a 99 2\nlist\n", expected: "empty\nbad quantity\n0\na 5 10\n", hidden: true },
            { stdin: "add a 1 1\nremove a 1\nlist\nvalue\n", expected: "empty\n0\n", hidden: true },
          ],
        },
        {
          title: "A bounded stack",
          prompt: `Implement \`BoundedStack(capacity)\` whose invariant is \`0 <= len(stack) <= capacity\`: \`push(x)\` raises \`OverflowError\` when full, \`pop()\` and \`peek()\` raise \`IndexError\` when empty, \`__len__\` and \`__repr__\` (\`BoundedStack([1, 2], capacity=3)\`). Commands: \`push x\`, \`pop\`, \`peek\`, \`len\`, \`show\`; errors print \`full\` or \`empty\`.

**Input:** the capacity, then commands.
**Output:** one line per \`pop\`, \`peek\`, \`len\`, \`show\` and per error.

\`\`\`text
2
push 1
push 2
push 3
pop
show
\`\`\`
prints
\`\`\`text
full
2
BoundedStack([1], capacity=2)
\`\`\``,
          starter: String.raw`import sys


class BoundedStack:
    def __init__(self, capacity):
        self.capacity = capacity
        self._items = []

    # TODO: push, pop, peek, __len__, __repr__


stack = BoundedStack(int(input()))
for line in sys.stdin:
    cmd, *args = line.split()
    # TODO
`,
          solution: String.raw`import sys


class BoundedStack:
    def __init__(self, capacity):
        self.capacity = capacity
        self._items = []

    def push(self, x):
        if len(self._items) >= self.capacity:
            raise OverflowError("full")
        self._items.append(x)

    def pop(self):
        if not self._items:
            raise IndexError("empty")
        return self._items.pop()

    def peek(self):
        if not self._items:
            raise IndexError("empty")
        return self._items[-1]

    def __len__(self):
        return len(self._items)

    def __repr__(self):
        return f"BoundedStack({self._items!r}, capacity={self.capacity})"


stack = BoundedStack(int(input()))
for line in sys.stdin:
    cmd, *args = line.split()
    try:
        if cmd == "push":
            stack.push(int(args[0]))
        elif cmd == "pop":
            print(stack.pop())
        elif cmd == "peek":
            print(stack.peek())
        elif cmd == "len":
            print(len(stack))
        elif cmd == "show":
            print(stack)
    except OverflowError:
        print("full")
    except IndexError:
        print("empty")
`,
          hints: [
            "Every mutator checks the invariant first and raises before touching the list.",
            "`{self._items!r}` inside the repr prints the list with brackets.",
          ],
          cases: [
            { stdin: "2\npush 1\npush 2\npush 3\npop\nshow\n", expected: "full\n2\nBoundedStack([1], capacity=2)\n" },
            { stdin: "1\npop\npeek\nlen\npush 7\npeek\nlen\n", expected: "empty\nempty\n0\n7\n1\n", hidden: true },
            { stdin: "0\npush 1\nshow\n", expected: "full\nBoundedStack([], capacity=0)\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What justifies writing a class rather than a dict or a dataclass?",
          options: ["Having more than three fields", "An invariant to protect and behaviour that maintains it, behind a small interface", "Needing a `__repr__`", "Needing to sort instances"],
          answer: 1,
          explanation: "Fields alone are a dataclass or a dict; a class with methods earns its place by guarding a fact about its data.",
        },
        {
          prompt: "Why check arguments *before* mutating state in a method?",
          options: ["It is faster", "So a failed call leaves the object unchanged — the strong guarantee", "Python requires it", "To avoid `__repr__` being called"],
          answer: 1,
          explanation: "Validating first means an exception cannot leave a half-updated object behind.",
        },
        {
          prompt: "Which is the design smell?",
          options: ["A method that returns a computed value", "A `get_stock()` method returning the internal dict", "A `__repr__` that shows the state", "A frozen dataclass for a value"],
          answer: 1,
          explanation: "Handing out the internal collection lets any caller break the invariant; expose operations and queries instead.",
        },
        {
          prompt: "Why should a class's methods not `print`?",
          options: ["Printing is slow", "The class becomes unusable anywhere output is not wanted; return data and let the caller print", "`print` cannot be called from methods", "It breaks `__repr__`"],
          answer: 1,
          explanation: "I/O belongs at the edge (`main`); a method that returns values can be tested, composed and reused.",
        },
        {
          prompt: "Which pair is 'value versus entity'?",
          options: ["`int` versus `float`", "A `Money` amount versus a bank `Account`", "A list versus a tuple", "A class versus an instance"],
          answer: 1,
          explanation: "Values compare by their fields and are immutable; entities have a life cycle, change, and are equal only to themselves.",
        },
      ],
    },
    {
      slug: "classes-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "A fraction value type",
          prompt: `Implement \`Frac(num, den)\` normalised in \`__init__\`: reduce by the gcd and keep the sign in the numerator (a zero denominator raises \`ValueError\`). Define \`__add__\`, \`__sub__\`, \`__mul__\`, \`__truediv__\` (division by a zero fraction raises \`ZeroDivisionError\`), \`__eq__\`, \`__lt__\`, \`__hash__\` and \`__str__\` (\`3/4\`, or just \`2\` when the denominator is 1). Evaluate lines \`a/b op c/d\` and print the result; print the exception name for a failure.

**Input:** lines.
**Output:** one line per input line.

\`\`\`text
1/2 + 1/3
3/4 * 4/3
1/2 - 1/2
1/3 / 0/5
\`\`\`
prints
\`\`\`text
5/6
1
0
ZeroDivisionError
\`\`\``,
          starter: String.raw`import math
import sys


class Frac:
    def __init__(self, num, den=1):
        # TODO: validate, normalise sign and reduce
        self.num, self.den = num, den

    # TODO: dunders


OPS = {"+": "__add__", "-": "__sub__", "*": "__mul__", "/": "__truediv__"}
for line in sys.stdin:
    a, op, b = line.split()
    try:
        x = Frac(*map(int, a.split("/")))
        y = Frac(*map(int, b.split("/")))
        print(getattr(x, OPS[op])(y))
    except (ValueError, ZeroDivisionError) as e:
        print(type(e).__name__)
`,
          solution: String.raw`import math
import sys


class Frac:
    def __init__(self, num, den=1):
        if den == 0:
            raise ValueError("zero denominator")
        if den < 0:
            num, den = -num, -den
        g = math.gcd(num, den) or 1
        self.num, self.den = num // g, den // g

    def __add__(self, o):
        return Frac(self.num * o.den + o.num * self.den, self.den * o.den)

    def __sub__(self, o):
        return Frac(self.num * o.den - o.num * self.den, self.den * o.den)

    def __mul__(self, o):
        return Frac(self.num * o.num, self.den * o.den)

    def __truediv__(self, o):
        if o.num == 0:
            raise ZeroDivisionError("division by zero fraction")
        return Frac(self.num * o.den, self.den * o.num)

    def __eq__(self, o):
        if not isinstance(o, Frac):
            return NotImplemented
        return (self.num, self.den) == (o.num, o.den)

    def __lt__(self, o):
        return self.num * o.den < o.num * self.den

    def __hash__(self):
        return hash((self.num, self.den))

    def __str__(self):
        return f"{self.num}" if self.den == 1 else f"{self.num}/{self.den}"


OPS = {"+": "__add__", "-": "__sub__", "*": "__mul__", "/": "__truediv__"}
for line in sys.stdin:
    a, op, b = line.split()
    try:
        x = Frac(*map(int, a.split("/")))
        y = Frac(*map(int, b.split("/")))
        print(getattr(x, OPS[op])(y))
    except (ValueError, ZeroDivisionError) as e:
        print(type(e).__name__)
`,
          hints: [
            "Normalise in `__init__` so every arithmetic result is automatically reduced.",
            "`math.gcd(0, d)` is `d`, which reduces `0/5` to `0/1`.",
          ],
          cases: [
            { stdin: "1/2 + 1/3\n3/4 * 4/3\n1/2 - 1/2\n1/3 / 0/5\n", expected: "5/6\n1\n0\nZeroDivisionError\n" },
            { stdin: "1/-2 + 0/1\n2/4 - 3/-6\n1/0 + 1/1\n", expected: "-1/2\n1\nValueError\n", hidden: true },
            { stdin: "-6/8 / 3/4\n", expected: "-1\n", hidden: true },
          ],
        },
        {
          title: "Ledger",
          prompt: `Implement \`Account\` with a class method \`from_line("ada:100")\`, a \`transfer(to, amount)\` method that raises \`ValueError\` when the balance is insufficient (checking before changing either account), and a class-level count of open accounts. Commands: \`open name:balance\`, \`transfer from to amount\` (prints \`ok\`, \`insufficient funds\` or \`unknown account\`), \`report\` (prints \`name balance\` in name order, then \`accounts <count>\`).

**Input:** commands.
**Output:** one line per transfer, and the report lines.

\`\`\`text
open ada:100
open bob:20
transfer ada bob 30
transfer bob ada 500
transfer cy ada 1
report
\`\`\`
prints
\`\`\`text
ok
insufficient funds
unknown account
ada 70
bob 50
accounts 2
\`\`\``,
          starter: String.raw`import sys


class Account:
    opened = 0

    def __init__(self, name, balance):
        pass

    @classmethod
    def from_line(cls, text):
        pass

    def transfer(self, to, amount):
        pass


accounts = {}
for line in sys.stdin:
    cmd, *args = line.split()
    # TODO
`,
          solution: String.raw`import sys


class Account:
    opened = 0

    def __init__(self, name, balance):
        self.name = name
        self.balance = balance
        type(self).opened += 1

    @classmethod
    def from_line(cls, text):
        name, balance = text.split(":")
        return cls(name, int(balance))

    def transfer(self, to, amount):
        if amount > self.balance:
            raise ValueError("insufficient funds")
        self.balance -= amount
        to.balance += amount


accounts = {}
for line in sys.stdin:
    cmd, *args = line.split()
    if cmd == "open":
        acct = Account.from_line(args[0])
        accounts[acct.name] = acct
    elif cmd == "transfer":
        src, dst = accounts.get(args[0]), accounts.get(args[1])
        if src is None or dst is None:
            print("unknown account")
            continue
        try:
            src.transfer(dst, int(args[2]))
            print("ok")
        except ValueError:
            print("insufficient funds")
    elif cmd == "report":
        for name in sorted(accounts):
            print(name, accounts[name].balance)
        print(f"accounts {Account.opened}")
`,
          hints: [
            "`from_line` parses and calls `cls(name, int(balance))`.",
            "Check the source balance before touching either account, so a failed transfer changes nothing.",
          ],
          cases: [
            { stdin: "open ada:100\nopen bob:20\ntransfer ada bob 30\ntransfer bob ada 500\ntransfer cy ada 1\nreport\n", expected: "ok\ninsufficient funds\nunknown account\nada 70\nbob 50\naccounts 2\n" },
            { stdin: "report\n", expected: "accounts 0\n", hidden: true },
            { stdin: "open x:5\ntransfer x x 5\nreport\n", expected: "ok\nx 5\naccounts 1\n", hidden: true },
          ],
        },
        {
          title: "Product catalogue",
          prompt: `Define \`@dataclass(frozen=True, order=True) Product\` with fields \`name: str\`, \`price_cents: int\`, \`qty: int\` and a derived field \`value: int = field(init=False, compare=False)\` set in \`__post_init__\` with \`object.__setattr__\`. Read \`n\` products; print them ordered by value descending then name (an explicit key), then the first product with its quantity increased by one via \`replace\` (the value must be recomputed automatically), then \`asdict\` of that copy as JSON with sorted keys.

**Input:** \`n\`, then \`n\` lines \`name price qty\`.
**Output:** \`n\` lines \`name value\`, then the replaced product's repr, then the JSON.

\`\`\`text
2
bolt 5 100
nut 2 250
\`\`\`
prints
\`\`\`text
bolt 500
nut 500
Product(name='bolt', price_cents=5, qty=101, value=505)
{"name": "bolt", "price_cents": 5, "qty": 101, "value": 505}
\`\`\``,
          starter: String.raw`import json
from dataclasses import dataclass, field, replace, asdict


# TODO: the frozen dataclass with a derived value


n = int(input())
products = []
for _ in range(n):
    name, price, qty = input().split()
    products.append(Product(name, int(price), int(qty)))
# TODO: ordered output, replace, asdict
`,
          solution: String.raw`import json
from dataclasses import dataclass, field, replace, asdict


@dataclass(frozen=True, order=True)
class Product:
    name: str
    price_cents: int
    qty: int
    value: int = field(init=False, compare=False)

    def __post_init__(self):
        object.__setattr__(self, "value", self.price_cents * self.qty)


n = int(input())
products = []
for _ in range(n):
    name, price, qty = input().split()
    products.append(Product(name, int(price), int(qty)))
for p in sorted(products, key=lambda p: (-p.value, p.name)):
    print(p.name, p.value)
bumped = replace(products[0], qty=products[0].qty + 1)
print(bumped)
print(json.dumps(asdict(bumped), sort_keys=True))
`,
          hints: [
            "A frozen instance cannot be assigned normally, even in `__post_init__` — use `object.__setattr__`.",
            "`replace` builds a new instance through `__init__`, so `__post_init__` recomputes `value`.",
          ],
          cases: [
            { stdin: "2\nbolt 5 100\nnut 2 250\n", expected: "bolt 500\nnut 500\nProduct(name='bolt', price_cents=5, qty=101, value=505)\n{\"name\": \"bolt\", \"price_cents\": 5, \"qty\": 101, \"value\": 505}\n" },
            { stdin: "1\nx 0 9\n", expected: "x 0\nProduct(name='x', price_cents=0, qty=10, value=0)\n{\"name\": \"x\", \"price_cents\": 0, \"qty\": 10, \"value\": 0}\n", hidden: true },
            { stdin: "3\nc 1 1\na 10 1\nb 1 10\n", expected: "a 10\nb 10\nc 1\nProduct(name='c', price_cents=1, qty=2, value=2)\n{\"name\": \"c\", \"price_cents\": 1, \"qty\": 2, \"value\": 2}\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `__init__` return?",
          options: ["The new instance", "`None` — it initialises an instance that `__new__` already created", "The class", "Whatever the last statement evaluates to"],
          answer: 1,
          explanation: "Returning a value from `__init__` is a `TypeError`; the instance is created before `__init__` runs.",
        },
        {
          prompt: "Which attribute assignment creates per-instance state?",
          options: ["`count = 0` in the class body", "`self.count = 0` in `__init__`", "`Account.count = 0`", "`cls.count = 0` in a classmethod"],
          answer: 1,
          explanation: "Assignment through `self` writes the instance's own dictionary; the others write the class.",
        },
        {
          prompt: "What does `print([obj])` use to display `obj`?",
          options: ["`__str__`", "`__repr__`", "`__format__`", "`__print__`"],
          answer: 1,
          explanation: "Containers show their elements' `repr`; only a direct `print(obj)` uses `__str__`.",
        },
        {
          prompt: "Which dunder makes `for x in obj` work best?",
          options: ["`__len__`", "`__iter__` returning an iterator", "`__next__`", "`__contains__`"],
          answer: 1,
          explanation: "`__iter__` is the iteration protocol; `__getitem__` is only a fallback, and `__next__` belongs on the iterator, not the collection.",
        },
        {
          prompt: "What is `Money.__rmul__` for?",
          options: ["`money * 3`", "`3 * money`", "`money *= 3`", "`-money`"],
          answer: 1,
          explanation: "The reflected operator runs when the left operand's `__mul__` returns `NotImplemented`.",
        },
        {
          prompt: "How is a read-only attribute made with a property?",
          options: ["`@property` with no setter", "`@property(readonly=True)`", "Naming it with two underscores", "`__slots__`"],
          answer: 0,
          explanation: "Without a setter, assignment raises `AttributeError`.",
        },
        {
          prompt: "Which decorator marks an alternative constructor?",
          options: ["`@staticmethod`", "`@classmethod`", "`@property`", "`@constructor`"],
          answer: 1,
          explanation: "It needs the class (`cls`) to build the instance so that subclasses get instances of themselves.",
        },
        {
          prompt: "What does `@dataclass` do with a field written `items: list = field(default_factory=list)`?",
          options: ["Shares one list across instances", "Calls `list()` for each new instance", "Raises `ValueError`", "Makes the field read-only"],
          answer: 1,
          explanation: "The factory is invoked per instance, giving each its own list.",
        },
        {
          prompt: "A dataclass without `frozen=True` but with the default `eq=True`: can its instances be set members?",
          options: ["Yes", "No — `__hash__` is set to `None`", "Only if they have no fields", "Yes, hashed by identity"],
          answer: 1,
          explanation: "Value equality on a mutable object cannot safely have a hash; freeze it or set `eq=False`.",
        },
        {
          prompt: "What does `type(self).count += 1` do inside `__init__`?",
          options: ["Creates an instance attribute", "Increments the class attribute of the instance's actual class", "Raises `AttributeError`", "Increments a global"],
          answer: 1,
          explanation: "`type(self)` is the class, so the assignment targets the shared attribute — and for a subclass, that subclass's.",
        },
        {
          prompt: "What should `__lt__` return for an incomparable `other`?",
          options: ["`False`", "`NotImplemented`", "`None`", "`0`"],
          answer: 1,
          explanation: "Python then tries the reflected comparison and raises a clear `TypeError` if neither side can order the pair.",
        },
        {
          prompt: "Which is the sign of a class that should be a dataclass?",
          options: ["It has an invariant checked in every method", "It stores fields and has an `__init__`, `__repr__` and `__eq__` that only copy and compare them", "It manages a resource", "It subclasses `dict`"],
          answer: 1,
          explanation: "Pure record classes are exactly what `@dataclass` generates; hand-written boilerplate adds bugs, not value.",
        },
      ],
    },
  ],
});
