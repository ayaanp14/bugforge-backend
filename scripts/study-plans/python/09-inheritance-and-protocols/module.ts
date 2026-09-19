import { defineModule } from "../../dsl.js";

export default defineModule(import.meta.url, {
  slug: "inheritance-and-protocols",
  title: "Inheritance, protocols and duck typing",
  blurb: "Subclassing with super() and attribute lookup, duck typing with EAFP, abstract base classes and collections.abc, multiple inheritance with the MRO and mixins, typing.Protocol for structural typing, and composition over inheritance with Liskov, delegation and UserDict.",
  icon: "tree",
  overview: `Python has three ways to say that objects share behaviour, and knowing which one a situation calls for is the skill this module teaches. Inheritance shares an implementation and declares an is-a relationship; duck typing shares nothing but a method name and is how most Python code actually composes; protocols and abstract base classes make the duck-typed contract explicit — to the type checker or at construction time. Behind all of them is one mechanism, attribute lookup along the method resolution order, and one design test, Liskov's: can the subclass go wherever the base goes without anyone noticing?

Inheritance basics covers \`class Sub(Base)\`, overriding and extending with \`super()\`, the lookup order, \`isinstance\` versus \`type\`, and \`object\`. Polymorphism and duck typing explains programming to behaviour, EAFP versus LBYL, \`hasattr\`/\`getattr\`, and the \`isinstance\` chain that a method per class replaces. Abstract base classes covers \`abc.ABC\`, \`@abstractmethod\`, template methods, and \`collections.abc\` with its mixin methods. Multiple inheritance covers C3 linearisation, the diamond, cooperative \`__init__\` with \`**kwargs\`, and mixins. Protocols covers \`typing.Protocol\`, \`@runtime_checkable\`, attribute protocols and the standard \`Supports…\` family. Composition over inheritance states Liskov with the \`Square(Rectangle)\` counter-example, delegation, why subclassing \`dict\` misbehaves and \`UserDict\`, and the strategy pattern.

The exercises are whole programs: an animal hierarchy with a shared repr, employees and managers with an extended \`pay\`, a chorus of unrelated ducks handled by EAFP, a recursive total over mixed data, shapes on an ABC with a template method, a sequence built from two methods, an MRO trace through a diamond, cooperative initialisation of mixins, a runtime-checkable \`Closable\`, a structural \`Named\` protocol satisfied by four unrelated shapes, a stack by composition versus a list subclass, and a case-insensitive \`UserDict\`. The checkpoint adds a shape catalogue on an ABC, a plugin registry validated by a protocol, and a lower-casing mapping with a composed stack.`,
  lessons: [
    {
      slug: "inheritance-basics",
      file: "01-inheritance-basics.md",
      exercises: [
        {
          title: "Animals",
          prompt: `Build \`Animal(name)\` with \`speak()\` returning \`...\`, \`describe()\` returning \`<name> says <speak()>\`, and a \`__repr__\` using \`type(self).__name__\` so every subclass prints correctly. \`Dog\` and \`Cat\` override \`speak\` (\`woof\`, \`meow\`); \`Puppy(Dog)\` takes an extra \`age_weeks\`, calls \`super().__init__\`, and extends \`describe\` with \` (aged <n> weeks)\`. Read lines \`dog name\`, \`cat name\`, \`puppy name weeks\` and print each animal's repr and description.

**Input:** lines.
**Output:** two lines per animal: the repr, then the description.

\`\`\`text
dog rex
puppy bit 8
\`\`\`
prints
\`\`\`text
Dog('rex')
rex says woof
Puppy('bit')
bit says woof (aged 8 weeks)
\`\`\``,
          starter: String.raw`import sys


class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return "..."

    def describe(self):
        return f"{self.name} says {self.speak()}"

    def __repr__(self):
        return f"{type(self).__name__}({self.name!r})"


# TODO: Dog, Cat, Puppy


for line in sys.stdin:
    kind, *args = line.split()
    # TODO: build the right animal, print repr and description
`,
          solution: String.raw`import sys


class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return "..."

    def describe(self):
        return f"{self.name} says {self.speak()}"

    def __repr__(self):
        return f"{type(self).__name__}({self.name!r})"


class Dog(Animal):
    def speak(self):
        return "woof"


class Cat(Animal):
    def speak(self):
        return "meow"


class Puppy(Dog):
    def __init__(self, name, age_weeks):
        super().__init__(name)
        self.age_weeks = age_weeks

    def describe(self):
        return super().describe() + f" (aged {self.age_weeks} weeks)"


for line in sys.stdin:
    kind, *args = line.split()
    if kind == "dog":
        animal = Dog(args[0])
    elif kind == "cat":
        animal = Cat(args[0])
    else:
        animal = Puppy(args[0], int(args[1]))
    print(repr(animal))
    print(animal.describe())
`,
          hints: [
            "`describe` in the base calls `self.speak()`, so each subclass's override is what runs.",
            "`Puppy.__init__` forwards only `name` to `super().__init__` and stores its own extra field.",
          ],
          cases: [
            { stdin: "dog rex\npuppy bit 8\n", expected: "Dog('rex')\nrex says woof\nPuppy('bit')\nbit says woof (aged 8 weeks)\n" },
            { stdin: "cat tom\n", expected: "Cat('tom')\ntom says meow\n", hidden: true },
            { stdin: "puppy a 1\ndog b\ncat c\n", expected: "Puppy('a')\na says woof (aged 1 weeks)\nDog('b')\nb says woof\nCat('c')\nc says meow\n", hidden: true },
          ],
        },
        {
          title: "Employees and managers",
          prompt: `\`Employee(name, salary)\` has \`pay()\` returning the salary. \`Manager(Employee)\` adds a \`bonus\` and its \`pay()\` **extends** the base version with \`super()\`. Read staff lines \`employee name salary\` or \`manager name salary bonus\`; print each person's pay, then the total payroll, then how many objects are instances of \`Employee\` and how many of \`Manager\` (using \`isinstance\`).

**Input:** lines.
**Output:** \`<name> <pay>\` per line, then \`total <n>\`, \`employees <n>\`, \`managers <n>\`.

\`\`\`text
employee ada 100
manager bob 200 50
\`\`\`
prints
\`\`\`text
ada 100
bob 250
total 350
employees 2
managers 1
\`\`\``,
          starter: String.raw`import sys


class Employee:
    def __init__(self, name, salary):
        self.name = name
        self.salary = salary

    def pay(self):
        return self.salary


# TODO: Manager


staff = []
for line in sys.stdin:
    kind, name, *nums = line.split()
    # TODO
`,
          solution: String.raw`import sys


class Employee:
    def __init__(self, name, salary):
        self.name = name
        self.salary = salary

    def pay(self):
        return self.salary


class Manager(Employee):
    def __init__(self, name, salary, bonus):
        super().__init__(name, salary)
        self.bonus = bonus

    def pay(self):
        return super().pay() + self.bonus


staff = []
for line in sys.stdin:
    kind, name, *nums = line.split()
    if kind == "manager":
        staff.append(Manager(name, int(nums[0]), int(nums[1])))
    else:
        staff.append(Employee(name, int(nums[0])))
for person in staff:
    print(person.name, person.pay())
print(f"total {sum(p.pay() for p in staff)}")
print(f"employees {sum(isinstance(p, Employee) for p in staff)}")
print(f"managers {sum(isinstance(p, Manager) for p in staff)}")
`,
          hints: [
            "`super().pay()` gives the base salary; add the bonus to it.",
            "A `Manager` is an instance of `Employee` too, so the employee count includes managers.",
          ],
          cases: [
            { stdin: "employee ada 100\nmanager bob 200 50\n", expected: "ada 100\nbob 250\ntotal 350\nemployees 2\nmanagers 1\n" },
            { stdin: "", expected: "total 0\nemployees 0\nmanagers 0\n", hidden: true },
            { stdin: "manager x 1 1\nmanager y 2 2\n", expected: "x 2\ny 4\ntotal 6\nemployees 2\nmanagers 2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What happens?\n\n```python\nclass A:\n    def __init__(self):\n        self.x = 1\n\nclass B(A):\n    def __init__(self):\n        self.y = 2\n\nprint(B().x)\n```",
          options: ["`1`", "`AttributeError` — `B.__init__` never called `A.__init__`", "`2`", "`None`"],
          answer: 1,
          explanation: "A subclass initialiser replaces the base's; without `super().__init__()` the base attributes are never created.",
        },
        {
          prompt: "In the base class, `describe()` calls `self.speak()`. On a `Dog` instance, which `speak` runs?",
          options: ["`Animal.speak`", "`Dog.speak` — lookup starts at the instance's actual class", "Both", "It depends on where `describe` is defined"],
          answer: 1,
          explanation: "`self` is a `Dog`, and attribute lookup walks the MRO from `Dog`; every method is virtual.",
        },
        {
          prompt: "What is `isinstance(True, int)`?",
          options: ["`False`", "`True` — `bool` subclasses `int`", "`TypeError`", "`None`"],
          answer: 1,
          explanation: "`isinstance` respects inheritance, and `bool` is a subclass of `int`. `type(True) is int` is `False`.",
        },
        {
          prompt: "What does `super()` inside `Puppy.__init__` refer to?",
          options: ["The `Animal` class", "A proxy that starts lookup after `Puppy` in the MRO — here `Dog`, then `Animal`", "The instance", "The `object` class"],
          answer: 1,
          explanation: "`super()` follows the MRO of the instance's type rather than naming a parent, which is what makes it work with multiple inheritance.",
        },
        {
          prompt: "Why is `class Stack(list)` usually a mistake?",
          options: ["Lists cannot be subclassed", "It inherits every list method, so `insert(0, x)` and slicing can break the stack's rules; compose a list instead", "It is slower", "`super()` does not work with built-ins"],
          answer: 1,
          explanation: "Inheritance exposes the whole base interface; composition exposes exactly the operations you write.",
        },
      ],
    },
    {
      slug: "polymorphism-and-duck-typing",
      file: "02-polymorphism-and-duck-typing.md",
      exercises: [
        {
          title: "A chorus of ducks",
          prompt: `\`Dog\`, \`Robot\` and \`Duck\` are unrelated classes that each have \`speak()\`; \`Rock\` has no \`speak\`. Read a line of class names, instantiate each, and print what each says using **EAFP**: call \`speak()\` inside \`try\` and print \`(silent)\` on \`AttributeError\`. No \`isinstance\` and no \`hasattr\`.

**Input:** one line of names from \`dog robot duck rock\`.
**Output:** one word per name, space-separated.

\`\`\`text
dog rock robot
\`\`\`
prints
\`\`\`text
woof (silent) beep
\`\`\``,
          starter: String.raw`class Dog:
    def speak(self):
        return "woof"


class Robot:
    def speak(self):
        return "beep"


class Duck:
    def speak(self):
        return "quack"


class Rock:
    pass


KINDS = {"dog": Dog, "robot": Robot, "duck": Duck, "rock": Rock}


def voice(thing):
    # TODO: EAFP
    return ""


print(" ".join(voice(KINDS[name]()) for name in input().split()))
`,
          solution: String.raw`class Dog:
    def speak(self):
        return "woof"


class Robot:
    def speak(self):
        return "beep"


class Duck:
    def speak(self):
        return "quack"


class Rock:
    pass


KINDS = {"dog": Dog, "robot": Robot, "duck": Duck, "rock": Rock}


def voice(thing):
    try:
        return thing.speak()
    except AttributeError:
        return "(silent)"


print(" ".join(voice(KINDS[name]()) for name in input().split()))
`,
          hints: [
            "Calling a missing method raises `AttributeError` — catch exactly that.",
            "`KINDS[name]()` instantiates the class object looked up by name.",
          ],
          cases: [
            { stdin: "dog rock robot\n", expected: "woof (silent) beep\n" },
            { stdin: "duck duck\n", expected: "quack quack\n", hidden: true },
            { stdin: "rock\n", expected: "(silent)\n", hidden: true },
          ],
        },
        {
          title: "Total over mixed data",
          prompt: `Write \`total(value)\` that adds up a nested structure: an integer counts as itself, a string of digits is converted with \`int\`, and a list is summed recursively. Use EAFP: try \`int(value)\` first and, on \`TypeError\`, treat the value as an iterable. Read one literal (parse with \`ast.literal_eval\`) and print the total.

**Input:** one line holding a list literal of ints, digit strings and nested lists.
**Output:** the total.

\`\`\`text
[1, "2", [3, "4"], 5]
\`\`\`
prints
\`\`\`text
15
\`\`\``,
          starter: String.raw`import ast


def total(value):
    # TODO: try int(value); except TypeError -> sum(total(v) for v in value)
    return 0


print(total(ast.literal_eval(input())))
`,
          solution: String.raw`import ast


def total(value):
    try:
        return int(value)
    except TypeError:
        return sum(total(v) for v in value)


print(total(ast.literal_eval(input())))
`,
          hints: [
            "`int([1, 2])` raises `TypeError`, which is the signal to recurse; `int(\"2\")` succeeds.",
            "An empty list sums to 0 with no special case.",
          ],
          cases: [
            { stdin: "[1, \"2\", [3, \"4\"], 5]\n", expected: "15\n" },
            { stdin: "[]\n", expected: "0\n", hidden: true },
            { stdin: "[[[[\"7\"]]], -7, [[], 1]]\n", expected: "1\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does duck typing mean?",
          options: ["Every class must inherit from `Duck`", "Code uses an object's methods without checking its type; anything with the right methods works", "Types are checked at compile time", "Only built-in types are allowed"],
          answer: 1,
          explanation: "Behaviour, not lineage, decides. `len(x)` works on anything with `__len__`.",
        },
        {
          prompt: "Which is the EAFP spelling of a dictionary lookup with a fallback?",
          options: ["`if k in d: v = d[k] else: v = 0`", "`try: v = d[k] except KeyError: v = 0`", "`v = d[k] or 0`", "`assert k in d`"],
          answer: 1,
          explanation: "Attempt the operation and handle the specific failure; the first option is LBYL. (`d.get(k, 0)` is the shortest of all here.)",
        },
        {
          prompt: "When is LBYL preferable to EAFP?",
          options: ["Never", "When the failure is common and the check is cheap and reliable", "When the exception is a `KeyError`", "Only in loops"],
          answer: 1,
          explanation: "Raising an exception on most iterations costs more than a test; when the check can be made cheaply and cannot race, checking first reads well.",
        },
        {
          prompt: "What does `getattr(obj, \"flush\", None)` return when `obj` has no `flush`?",
          options: ["Raises `AttributeError`", "`None`", "`False`", "An empty function"],
          answer: 1,
          explanation: "The third argument is the default returned instead of raising.",
        },
        {
          prompt: "What replaces a long `isinstance` chain that picks behaviour by concrete type?",
          options: ["A longer chain", "A method on each class, called polymorphically", "`type()` comparisons", "Global variables"],
          answer: 1,
          explanation: "Behaviour belongs with the data; adding a type then means adding a class, not editing every switch.",
        },
      ],
    },
    {
      slug: "abstract-base-classes",
      file: "03-abstract-base-classes.md",
      exercises: [
        {
          title: "Shapes on an ABC",
          prompt: `Define \`Shape(ABC)\` with abstract \`area()\` and \`perimeter()\` and a concrete template method \`describe()\` returning \`<ClassName>: area <a>, perimeter <p>\` with two decimals. Implement \`Rect(w, h)\` and \`Circle(r)\`. Read shape lines and print their descriptions; a line \`shape\` attempts \`Shape()\` and prints \`abstract\` when \`TypeError\` is raised.

**Input:** lines \`rect w h\`, \`circle r\` or \`shape\`.
**Output:** one line per input line.

\`\`\`text
rect 2 3
shape
circle 1
\`\`\`
prints
\`\`\`text
Rect: area 6.00, perimeter 10.00
abstract
Circle: area 3.14, perimeter 6.28
\`\`\``,
          starter: String.raw`import math
import sys
from abc import ABC, abstractmethod


class Shape(ABC):
    # TODO: abstract area, perimeter; concrete describe
    pass


# TODO: Rect, Circle


for line in sys.stdin:
    kind, *nums = line.split()
    # TODO
`,
          solution: String.raw`import math
import sys
from abc import ABC, abstractmethod


class Shape(ABC):
    @abstractmethod
    def area(self):
        ...

    @abstractmethod
    def perimeter(self):
        ...

    def describe(self):
        return f"{type(self).__name__}: area {self.area():.2f}, perimeter {self.perimeter():.2f}"


class Rect(Shape):
    def __init__(self, w, h):
        self.w, self.h = w, h

    def area(self):
        return self.w * self.h

    def perimeter(self):
        return 2 * (self.w + self.h)


class Circle(Shape):
    def __init__(self, r):
        self.r = r

    def area(self):
        return math.pi * self.r ** 2

    def perimeter(self):
        return 2 * math.pi * self.r


for line in sys.stdin:
    kind, *nums = line.split()
    if kind == "shape":
        try:
            Shape()
        except TypeError:
            print("abstract")
        continue
    values = [float(x) for x in nums]
    shape = Rect(*values) if kind == "rect" else Circle(*values)
    print(shape.describe())
`,
          hints: [
            "`describe` is written once on the ABC in terms of the abstract methods.",
            "Instantiating a class with unimplemented abstract methods raises `TypeError`.",
          ],
          cases: [
            { stdin: "rect 2 3\nshape\ncircle 1\n", expected: "Rect: area 6.00, perimeter 10.00\nabstract\nCircle: area 3.14, perimeter 6.28\n" },
            { stdin: "circle 0\nrect 1.5 2\n", expected: "Circle: area 0.00, perimeter 0.00\nRect: area 3.00, perimeter 7.00\n", hidden: true },
            { stdin: "shape\nshape\n", expected: "abstract\nabstract\n", hidden: true },
          ],
        },
        {
          title: "A sequence from two methods",
          prompt: `Implement \`Evens(n)\` — the first \`n\` even numbers \`0, 2, 4, …\` — as a subclass of \`collections.abc.Sequence\`, defining only \`__len__\` and \`__getitem__\` (with negative indexes, \`IndexError\` past the ends, and slices). Then use the **inherited** mixin methods: read \`n\` and a query value \`q\`; print the elements, \`q in\`, \`index(q)\` (or \`absent\` on \`ValueError\`), \`count(q)\`, the reversed elements, and \`isinstance(evens, Sequence)\`.

**Input:** \`n q\`.
**Output:** \`elements <…>\`, \`in <bool>\`, \`index <i>\` or \`index absent\`, \`count <c>\`, \`reversed <…>\`, \`sequence <bool>\`.

\`\`\`text
4 4
\`\`\`
prints
\`\`\`text
elements 0 2 4 6
in True
index 2
count 1
reversed 6 4 2 0
sequence True
\`\`\``,
          starter: String.raw`from collections.abc import Sequence


class Evens(Sequence):
    def __init__(self, n):
        self.n = n

    # TODO: __len__ and __getitem__ (handle slice, negative index, IndexError)


n, q = map(int, input().split())
e = Evens(n)
print("elements", " ".join(map(str, e)))
print(f"in {q in e}")
try:
    print(f"index {e.index(q)}")
except ValueError:
    print("index absent")
print(f"count {e.count(q)}")
print("reversed", " ".join(map(str, reversed(e))))
print(f"sequence {isinstance(e, Sequence)}")
`,
          solution: String.raw`from collections.abc import Sequence


class Evens(Sequence):
    def __init__(self, n):
        self.n = n

    def __len__(self):
        return self.n

    def __getitem__(self, i):
        if isinstance(i, slice):
            return [self[j] for j in range(*i.indices(self.n))]
        if i < 0:
            i += self.n
        if not 0 <= i < self.n:
            raise IndexError(i)
        return 2 * i


n, q = map(int, input().split())
e = Evens(n)
print("elements", " ".join(map(str, e)))
print(f"in {q in e}")
try:
    print(f"index {e.index(q)}")
except ValueError:
    print("index absent")
print(f"count {e.count(q)}")
print("reversed", " ".join(map(str, reversed(e))))
print(f"sequence {isinstance(e, Sequence)}")
`,
          hints: [
            "`Sequence` supplies `__contains__`, `__iter__`, `__reversed__`, `index` and `count` from your two methods.",
            "`slice.indices(len)` turns a slice into a concrete `range` of indexes.",
          ],
          cases: [
            { stdin: "4 4\n", expected: "elements 0 2 4 6\nin True\nindex 2\ncount 1\nreversed 6 4 2 0\nsequence True\n" },
            { stdin: "3 5\n", expected: "elements 0 2 4\nin False\nindex absent\ncount 0\nreversed 4 2 0\nsequence True\n", hidden: true },
            { stdin: "1 0\n", expected: "elements 0\nin True\nindex 0\ncount 1\nreversed 0\nsequence True\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What happens when you instantiate a subclass of an ABC that has not implemented one abstract method?",
          options: ["It works; the method raises when called", "`TypeError` at instantiation naming the missing method", "A warning", "The base implementation is used"],
          answer: 1,
          explanation: "The check happens at construction, which is the point: an incomplete implementation fails fast.",
        },
        {
          prompt: "Which two methods make a `collections.abc.Sequence` subclass complete?",
          options: ["`__iter__` and `__next__`", "`__getitem__` and `__len__`", "`__contains__` and `__len__`", "`index` and `count`"],
          answer: 1,
          explanation: "The ABC derives iteration, containment, reversal, `index` and `count` from those two.",
        },
        {
          prompt: "What is true of `isinstance(x, collections.abc.Iterable)`?",
          options: ["Only classes that inherit from `Iterable` pass", "Any object with `__iter__` passes, via the ABC's subclass hook", "Only lists and tuples pass", "It raises for user classes"],
          answer: 1,
          explanation: "The `collections.abc` classes recognise structural conformance for the built-in protocols.",
        },
        {
          prompt: "How is an abstract property declared?",
          options: ["`@abstractmethod` above `@property`", "`@property` above `@abstractmethod`", "`@abstractproperty` only", "Properties cannot be abstract"],
          answer: 1,
          explanation: "`@abstractmethod` must be the innermost decorator, applied to the function before `@property` wraps it.",
        },
        {
          prompt: "Why exclude `str` in `isinstance(x, Iterable) and not isinstance(x, str)`?",
          options: ["Strings are not iterable", "A string iterates its characters, which is rarely what a 'sequence of items' test means", "`str` does not define `__iter__`", "It is faster"],
          answer: 1,
          explanation: "Text is iterable, so a flattening or one-or-many function would explode strings into characters without the guard.",
        },
      ],
    },
    {
      slug: "multiple-inheritance-and-mro",
      file: "04-multiple-inheritance-and-mro.md",
      exercises: [
        {
          title: "Trace the MRO",
          prompt: `Define the diamond \`A\`, \`B(A)\`, \`C(A)\`, \`D(B, C)\`, each with \`who()\` returning its own letter followed by \`>\` and \`super().who()\` (\`A\` returns just \`A\`). Read class names, one per line; for each print the class's \`__mro__\` as the class names joined by spaces, then the result of \`who()\` on a fresh instance.

**Input:** lines, each \`A\`, \`B\`, \`C\` or \`D\`.
**Output:** two lines per input line: \`mro: …\` and \`who: …\`.

\`\`\`text
D
B
\`\`\`
prints
\`\`\`text
mro: D B C A object
who: D>B>C>A
mro: B A object
who: B>A
\`\`\``,
          starter: String.raw`import sys


class A:
    def who(self):
        return "A"


# TODO: B(A), C(A), D(B, C) — each returns its letter + ">" + super().who()


CLASSES = {"A": A}  # TODO: add B, C, D
for line in sys.stdin:
    cls = CLASSES[line.strip()]
    # TODO: print mro and who
`,
          solution: String.raw`import sys


class A:
    def who(self):
        return "A"


class B(A):
    def who(self):
        return "B>" + super().who()


class C(A):
    def who(self):
        return "C>" + super().who()


class D(B, C):
    def who(self):
        return "D>" + super().who()


CLASSES = {"A": A, "B": B, "C": C, "D": D}
for line in sys.stdin:
    cls = CLASSES[line.strip()]
    print("mro:", " ".join(k.__name__ for k in cls.__mro__))
    print("who:", cls().who())
`,
          hints: [
            "`cls.__mro__` is a tuple of classes; print their `__name__`s.",
            "In `D`, `super()` inside `B.who` continues to `C`, not `A` — the MRO of the *instance* decides.",
          ],
          cases: [
            { stdin: "D\nB\n", expected: "mro: D B C A object\nwho: D>B>C>A\nmro: B A object\nwho: B>A\n" },
            { stdin: "C\nA\n", expected: "mro: C A object\nwho: C>A\nmro: A object\nwho: A\n", hidden: true },
          ],
        },
        {
          title: "Cooperative initialisation",
          prompt: `Write three mixins with **cooperative** initialisers — \`Named\` (keyword \`name\`), \`Timestamped\` (keyword \`created\`) and \`Tagged\` (keyword \`tags\`, a comma-separated string stored as a sorted list) — each taking its own argument by keyword, forwarding \`**kwargs\` with \`super().__init__(**kwargs)\`, and \`Event(Tagged, Timestamped, Named)\`. Read one line of \`key=value\` pairs, build \`Event(**pairs)\`, print its attributes in alphabetical order, then its MRO.

**Input:** one line with \`name=…\`, \`created=…\`, \`tags=…\` in any order.
**Output:** \`created …\`, \`name …\`, \`tags …\` (tags space-separated), then \`mro: …\`.

\`\`\`text
name=deploy tags=b,a created=2024-05-01
\`\`\`
prints
\`\`\`text
created 2024-05-01
name deploy
tags a b
mro: Event Tagged Timestamped Named object
\`\`\``,
          starter: String.raw`class Named:
    def __init__(self, *, name, **kwargs):
        # TODO: forward, then store
        pass


class Timestamped:
    pass  # TODO


class Tagged:
    pass  # TODO


class Event(Tagged, Timestamped, Named):
    pass


pairs = dict(tok.split("=", 1) for tok in input().split())
e = Event(**pairs)
print(f"created {e.created}")
print(f"name {e.name}")
print("tags", " ".join(e.tags))
print("mro:", " ".join(k.__name__ for k in Event.__mro__))
`,
          solution: String.raw`class Named:
    def __init__(self, *, name, **kwargs):
        super().__init__(**kwargs)
        self.name = name


class Timestamped:
    def __init__(self, *, created, **kwargs):
        super().__init__(**kwargs)
        self.created = created


class Tagged:
    def __init__(self, *, tags, **kwargs):
        super().__init__(**kwargs)
        self.tags = sorted(tags.split(","))


class Event(Tagged, Timestamped, Named):
    pass


pairs = dict(tok.split("=", 1) for tok in input().split())
e = Event(**pairs)
print(f"created {e.created}")
print(f"name {e.name}")
print("tags", " ".join(e.tags))
print("mro:", " ".join(k.__name__ for k in Event.__mro__))
`,
          hints: [
            "Each initialiser consumes one keyword and passes the rest along; the chain ends at `object.__init__()` with nothing left.",
            "Keyword-only parameters (`*,`) make the order of the mixins irrelevant to the caller.",
          ],
          cases: [
            { stdin: "name=deploy tags=b,a created=2024-05-01\n", expected: "created 2024-05-01\nname deploy\ntags a b\nmro: Event Tagged Timestamped Named object\n" },
            { stdin: "created=now name=x tags=z\n", expected: "created now\nname x\ntags z\nmro: Event Tagged Timestamped Named object\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "For `class D(B, C)` with `B(A)` and `C(A)`, what is `D.__mro__`?",
          options: ["`(D, B, A, C, object)`", "`(D, B, C, A, object)`", "`(D, A, B, C, object)`", "`(D, C, B, A, object)`"],
          answer: 1,
          explanation: "C3 puts the shared base `A` after every class that inherits from it, and bases left to right.",
        },
        {
          prompt: "In that diamond, what does `super().who()` inside `B.who` call when the instance is a `D`?",
          options: ["`A.who`", "`C.who`", "`D.who`", "`object.who`"],
          answer: 1,
          explanation: "`super()` proceeds to the next class in the *instance's* MRO, which after `B` is `C`.",
        },
        {
          prompt: "Why do cooperative `__init__`s take keyword-only parameters and `**kwargs`?",
          options: ["For speed", "So each class can consume its own argument and forward the rest regardless of the order the mixins are combined in", "Because positional arguments are not allowed in mixins", "To avoid `super()`"],
          answer: 1,
          explanation: "Positional arguments would need every unrelated class to agree on positions; keywords route themselves.",
        },
        {
          prompt: "Where should a mixin appear in a class's base list?",
          options: ["After the concrete base", "Before the concrete base, so its methods take precedence", "It does not matter", "Only as the sole base"],
          answer: 1,
          explanation: "The MRO searches bases left to right; a mixin meant to override must come first.",
        },
        {
          prompt: "What does `class X(A, B)` raise when `B` is a subclass of `A`?",
          options: ["Nothing", "`TypeError: Cannot create a consistent method resolution order`", "`AttributeError`", "`RecursionError`"],
          answer: 1,
          explanation: "`A` would have to precede `B` (base order) and follow it (subclass before base); C3 cannot satisfy both.",
        },
      ],
    },
    {
      slug: "protocols-and-structural-typing",
      file: "05-protocols-and-structural-typing.md",
      exercises: [
        {
          title: "Closable",
          prompt: `Define a \`@runtime_checkable\` protocol \`Closable\` with \`close(self) -> None\`. Four unrelated classes are given: \`File\` and \`Socket\` have \`close()\`, \`Buffer\` has \`flush()\` only, \`Const\` has a non-callable attribute named \`close\`. Read class names; for each instance print whether \`isinstance(obj, Closable)\` holds and, if it does, try to call \`close()\` — printing \`closed <Class>\` on success or \`not callable\` if the call raises \`TypeError\`.

**Input:** one line of class names.
**Output:** one line per name: \`<Class> closable=<bool>\` followed, when closable, by a space and \`closed <Class>\` or \`not callable\`.

\`\`\`text
File Buffer Const
\`\`\`
prints
\`\`\`text
File closable=True closed File
Buffer closable=False
Const closable=True not callable
\`\`\``,
          starter: String.raw`from typing import Protocol, runtime_checkable


# TODO: the protocol


class File:
    def close(self):
        return None


class Socket:
    def close(self):
        return None


class Buffer:
    def flush(self):
        return None


class Const:
    close = 42


KINDS = {"File": File, "Socket": Socket, "Buffer": Buffer, "Const": Const}
for name in input().split():
    obj = KINDS[name]()
    # TODO
`,
          solution: String.raw`from typing import Protocol, runtime_checkable


@runtime_checkable
class Closable(Protocol):
    def close(self) -> None: ...


class File:
    def close(self):
        return None


class Socket:
    def close(self):
        return None


class Buffer:
    def flush(self):
        return None


class Const:
    close = 42


KINDS = {"File": File, "Socket": Socket, "Buffer": Buffer, "Const": Const}
for name in input().split():
    obj = KINDS[name]()
    ok = isinstance(obj, Closable)
    line = f"{name} closable={ok}"
    if ok:
        try:
            obj.close()
            line += f" closed {name}"
        except TypeError:
            line += " not callable"
    print(line)
`,
          hints: [
            "`runtime_checkable` makes `isinstance` test for the *presence* of the member names only.",
            "`Const` passes the check because it has an attribute called `close`; calling an int raises `TypeError`.",
          ],
          cases: [
            { stdin: "File Buffer Const\n", expected: "File closable=True closed File\nBuffer closable=False\nConst closable=True not callable\n" },
            { stdin: "Socket Socket\n", expected: "Socket closable=True closed Socket\nSocket closable=True closed Socket\n", hidden: true },
            { stdin: "Buffer\n", expected: "Buffer closable=False\n", hidden: true },
          ],
        },
        {
          title: "Anything with a name",
          prompt: `Define a \`@runtime_checkable\` protocol \`Named\` with a data member \`name: str\`. Objects of four unrelated shapes are built from the input — a dataclass \`User\`, a \`namedtuple\` \`Pet\`, a plain class \`Thing\` and a \`dict\` — and a function \`greet(obj)\` prints \`hello <name>\` when \`isinstance(obj, Named)\` and \`nameless\` otherwise. (A dict does not conform: a key is not an attribute.)

**Input:** lines \`user <name>\`, \`pet <name>\`, \`thing <name>\`, \`dict <name>\`.
**Output:** one line per input line.

\`\`\`text
user ada
dict bob
pet rex
\`\`\`
prints
\`\`\`text
hello ada
nameless
hello rex
\`\`\``,
          starter: String.raw`import sys
from collections import namedtuple
from dataclasses import dataclass
from typing import Protocol, runtime_checkable


# TODO: Named protocol with a data member


@dataclass
class User:
    name: str


Pet = namedtuple("Pet", "name")


class Thing:
    def __init__(self, name):
        self.name = name


def greet(obj):
    # TODO
    pass


for line in sys.stdin:
    kind, name = line.split()
    obj = {"user": User, "pet": Pet, "thing": Thing, "dict": lambda n: {"name": n}}[kind](name)
    greet(obj)
`,
          solution: String.raw`import sys
from collections import namedtuple
from dataclasses import dataclass
from typing import Protocol, runtime_checkable


@runtime_checkable
class Named(Protocol):
    name: str


@dataclass
class User:
    name: str


Pet = namedtuple("Pet", "name")


class Thing:
    def __init__(self, name):
        self.name = name


def greet(obj):
    if isinstance(obj, Named):
        print(f"hello {obj.name}")
    else:
        print("nameless")


for line in sys.stdin:
    kind, name = line.split()
    obj = {"user": User, "pet": Pet, "thing": Thing, "dict": lambda n: {"name": n}}[kind](name)
    greet(obj)
`,
          hints: [
            "A data member in a protocol is matched by any attribute of that name — instance, class or property.",
            "`{\"name\": n}` stores a key, not an attribute, so `hasattr(d, \"name\")` is false.",
          ],
          cases: [
            { stdin: "user ada\ndict bob\npet rex\n", expected: "hello ada\nnameless\nhello rex\n" },
            { stdin: "thing box\n", expected: "hello box\n", hidden: true },
            { stdin: "dict x\ndict y\n", expected: "nameless\nnameless\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "How does a class come to satisfy a `typing.Protocol`?",
          options: ["By inheriting from it", "By having the members the protocol lists, with compatible signatures — no inheritance needed", "By calling `register`", "By defining `__protocol__`"],
          answer: 1,
          explanation: "Protocols are structural; conformance is by shape, checked by the type checker.",
        },
        {
          prompt: "What does `isinstance(x, SomeProtocol)` do without `@runtime_checkable`?",
          options: ["Returns `True` for conforming objects", "Raises `TypeError`", "Returns `False`", "Returns `None`"],
          answer: 1,
          explanation: "A plain protocol is a static concept; the decorator opts in to a run-time presence check.",
        },
        {
          prompt: "What does the runtime check verify?",
          options: ["Method signatures and return types", "Only that attributes with the listed names exist", "That the class inherits from the protocol", "Docstrings"],
          answer: 1,
          explanation: "It is `hasattr` under the hood; an attribute of the right name but wrong kind still passes.",
        },
        {
          prompt: "Which hint accepts any object with `__iter__` yielding ints?",
          options: ["`list[int]`", "`Iterable[int]`", "`tuple[int]`", "`Sequence[int]`"],
          answer: 1,
          explanation: "`Iterable` is the structural protocol for iteration; `Sequence` additionally requires indexing and length.",
        },
        {
          prompt: "When is an ABC the better choice than a protocol?",
          options: ["When third-party classes must conform without changes", "When there is shared implementation to inherit or a construction-time guarantee is wanted", "When only a type checker is used", "Never"],
          answer: 1,
          explanation: "Protocols carry no implementation and enforce nothing at run time; ABCs do both.",
        },
      ],
    },
    {
      slug: "composition-over-inheritance",
      file: "06-composition-over-inheritance.md",
      exercises: [
        {
          title: "Stack by composition",
          prompt: `Write \`BadStack(list)\` — a list subclass with \`push\` (append) and \`peek\` — and \`Stack\`, which **composes** a list and exposes only \`push\`, \`pop\`, \`peek\`, \`__len__\` and \`__bool__\`. Run the same commands on both and print the results side by side; commands that only a list has (\`insert 0 v\`, \`sort\`) succeed on the bad stack and print \`no such operation\` for the composed one (use \`getattr\` and \`AttributeError\`). \`pop\` and \`peek\` on an empty stack print \`empty\`.

**Input:** commands \`push v\`, \`pop\`, \`peek\`, \`insert i v\`, \`sort\`, \`show\`.
**Output:** for \`pop\`, \`peek\`, \`show\` and the failing operations, one line: \`bad=<result> good=<result>\` (\`show\` prints the elements bottom to top, comma-separated, or \`-\`).

\`\`\`text
push 3
push 1
insert 0 9
sort
show
pop
\`\`\`
prints
\`\`\`text
bad=ok good=no such operation
bad=ok good=no such operation
bad=1,3,9 good=3,1
bad=9 good=1
\`\`\``,
          starter: String.raw`import sys


class BadStack(list):
    def push(self, x):
        self.append(x)

    def peek(self):
        return self[-1]


class Stack:
    def __init__(self):
        self._items = []

    # TODO: push, pop, peek, __len__, __bool__


def run(stack, cmd, args):
    # TODO: return the text for this command on this stack
    return ""


bad, good = BadStack(), Stack()
for line in sys.stdin:
    cmd, *args = line.split()
    b, g = run(bad, cmd, args), run(good, cmd, args)
    if cmd in ("pop", "peek", "show", "insert", "sort"):
        print(f"bad={b} good={g}")
`,
          solution: String.raw`import sys


class BadStack(list):
    def push(self, x):
        self.append(x)

    def peek(self):
        return self[-1]


class Stack:
    def __init__(self):
        self._items = []

    def push(self, x):
        self._items.append(x)

    def pop(self):
        return self._items.pop()

    def peek(self):
        return self._items[-1]

    def __len__(self):
        return len(self._items)

    def __bool__(self):
        return bool(self._items)

    def __iter__(self):
        return iter(self._items)


def run(stack, cmd, args):
    if cmd == "push":
        stack.push(int(args[0]))
        return "ok"
    if cmd in ("pop", "peek"):
        if not stack:
            return "empty"
        return str(getattr(stack, cmd)())
    if cmd == "show":
        return ",".join(map(str, stack)) if stack else "-"
    try:
        method = getattr(stack, cmd)
    except AttributeError:
        return "no such operation"
    method(*map(int, args))
    return "ok"


bad, good = BadStack(), Stack()
for line in sys.stdin:
    cmd, *args = line.split()
    b, g = run(bad, cmd, args), run(good, cmd, args)
    if cmd in ("pop", "peek", "show", "insert", "sort"):
        print(f"bad={b} good={g}")
`,
          hints: [
            "The composed `Stack` has exactly the methods you wrote; `getattr(stack, \"insert\")` raises `AttributeError` on it.",
            "Give `Stack` an `__iter__` (or `__getitem__`) so `show` can list it the same way as the list subclass.",
          ],
          cases: [
            { stdin: "push 3\npush 1\ninsert 0 9\nsort\nshow\npop\n", expected: "bad=ok good=no such operation\nbad=ok good=no such operation\nbad=1,3,9 good=3,1\nbad=9 good=1\n" },
            { stdin: "pop\npeek\nshow\n", expected: "bad=empty good=empty\nbad=empty good=empty\nbad=- good=-\n", hidden: true },
            { stdin: "push 5\npeek\ninsert 0 7\npeek\nshow\n", expected: "bad=5 good=5\nbad=ok good=no such operation\nbad=5 good=5\nbad=7,5 good=5\n", hidden: true },
          ],
        },
        {
          title: "A case-insensitive mapping",
          prompt: `Subclass \`collections.UserDict\` to make \`CaseDict\`, which folds keys with \`casefold()\` in \`__setitem__\`, \`__getitem__\`, \`__delitem__\` and \`__contains__\`. Because \`UserDict\` routes everything through those methods, \`update\`, the constructor and \`get\` all fold too. Commands: \`set K v\`, \`get K\` (\`missing\` on \`KeyError\`), \`has K\`, \`update K=v K=v …\`, \`keys\` (sorted).

**Input:** commands.
**Output:** one line per \`get\`, \`has\` and \`keys\`.

\`\`\`text
set Name ada
get NAME
update AGE=3 name=bob
get name
keys
\`\`\`
prints
\`\`\`text
ada
bob
age name
\`\`\``,
          starter: String.raw`import sys
from collections import UserDict


class CaseDict(UserDict):
    # TODO: __setitem__, __getitem__, __delitem__, __contains__ with casefold
    pass


d = CaseDict()
for line in sys.stdin:
    cmd, *args = line.split()
    # TODO
`,
          solution: String.raw`import sys
from collections import UserDict


class CaseDict(UserDict):
    def __setitem__(self, key, value):
        super().__setitem__(key.casefold(), value)

    def __getitem__(self, key):
        return super().__getitem__(key.casefold())

    def __delitem__(self, key):
        super().__delitem__(key.casefold())

    def __contains__(self, key):
        return super().__contains__(key.casefold())


d = CaseDict()
for line in sys.stdin:
    cmd, *args = line.split()
    if cmd == "set":
        d[args[0]] = args[1]
    elif cmd == "get":
        try:
            print(d[args[0]])
        except KeyError:
            print("missing")
    elif cmd == "has":
        print(args[0] in d)
    elif cmd == "update":
        d.update(dict(tok.split("=", 1) for tok in args))
    elif cmd == "keys":
        print(" ".join(sorted(d)))
`,
          hints: [
            "`UserDict.update` calls your `__setitem__`, unlike `dict.update`.",
            "Fold the key in every method that receives one; the stored keys are then always folded.",
          ],
          cases: [
            { stdin: "set Name ada\nget NAME\nupdate AGE=3 name=bob\nget name\nkeys\n", expected: "ada\nbob\nage name\n" },
            { stdin: "get x\nhas X\nset X 1\nhas x\nkeys\n", expected: "missing\nFalse\nTrue\nx\n", hidden: true },
            { stdin: "update A=1 a=2\nkeys\nget A\n", expected: "a\n2\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "Why does a mutable `Square(Rectangle)` violate Liskov substitution?",
          options: ["Squares have fewer sides", "Code written for `Rectangle` may set the width and expect the height unchanged; a `Square` cannot honour that", "`super()` cannot be used", "Rectangles cannot be subclassed"],
          answer: 1,
          explanation: "The subclass must keep the base's behavioural promises; a square's invariant breaks one of them.",
        },
        {
          prompt: "What does `__getattr__` *not* forward when used for delegation?",
          options: ["Methods", "Dunder methods such as `__len__`, which the interpreter looks up on the type", "Attributes starting with `_`", "Class attributes"],
          answer: 1,
          explanation: "Special-method lookup bypasses instance `__getattr__`; forward the dunders you need explicitly.",
        },
        {
          prompt: "Why does overriding `__setitem__` in a `dict` subclass not affect `update()`?",
          options: ["`update` is a class method", "The C implementation of `dict` calls its own internals, bypassing Python overrides", "`update` uses `__setattr__`", "It does affect it"],
          answer: 1,
          explanation: "`collections.UserDict` is written in Python and routes every operation through the basic methods, so overrides are honoured.",
        },
        {
          prompt: "Which is the composition solution to 'a class whose sorting behaviour varies'?",
          options: ["A subclass per sort order", "A `key` field holding a function", "Multiple inheritance from each order", "A global setting"],
          answer: 1,
          explanation: "Behaviour that varies at run time is a strategy — data, usually a callable — not a class hierarchy.",
        },
        {
          prompt: "What is the default recommendation?",
          options: ["Inherit whenever code can be reused", "Compose by default; inherit for genuine is-a with substantial shared implementation", "Never inherit", "Always use mixins"],
          answer: 1,
          explanation: "Composition exposes exactly the interface you write and cannot break a base contract; inheritance is for real is-a relationships.",
        },
      ],
    },
    {
      slug: "inheritance-checkpoint",
      file: "07-checkpoint.md",
      kind: "test",
      passMark: 70,
      exercises: [
        {
          title: "Shape catalogue",
          prompt: `Define \`Shape(ABC)\` with abstract \`area()\`, a concrete \`describe()\` returning \`<ClassName> <area with two decimals>\`, and \`__lt__\` comparing areas so shapes sort. Implement \`Rect(w, h)\`, \`Circle(r)\` and \`Square(Rect)\` (constructed with one side, passing it twice to \`super().__init__\`). Read shapes; print them sorted by area ascending (ties keep input order), then \`total <sum of areas>\` with two decimals, then \`squares <count>\` using \`isinstance\` against \`Rect\` **and** \`Square\`: \`rects <n> squares <m>\` where a square counts as both.

**Input:** lines \`rect w h\`, \`circle r\`, \`square s\`.
**Output:** the sorted descriptions, then \`total …\`, then \`rects … squares …\`.

\`\`\`text
rect 2 3
square 2
circle 1
\`\`\`
prints
\`\`\`text
Circle 3.14
Square 4.00
Rect 6.00
total 13.14
rects 2 squares 1
\`\`\``,
          starter: String.raw`import math
import sys
from abc import ABC, abstractmethod


class Shape(ABC):
    @abstractmethod
    def area(self):
        ...

    # TODO: describe, __lt__


# TODO: Rect, Circle, Square(Rect)


shapes = []
for line in sys.stdin:
    kind, *nums = line.split()
    # TODO
`,
          solution: String.raw`import math
import sys
from abc import ABC, abstractmethod


class Shape(ABC):
    @abstractmethod
    def area(self):
        ...

    def describe(self):
        return f"{type(self).__name__} {self.area():.2f}"

    def __lt__(self, other):
        return self.area() < other.area()


class Rect(Shape):
    def __init__(self, w, h):
        self.w, self.h = w, h

    def area(self):
        return self.w * self.h


class Circle(Shape):
    def __init__(self, r):
        self.r = r

    def area(self):
        return math.pi * self.r ** 2


class Square(Rect):
    def __init__(self, side):
        super().__init__(side, side)


shapes = []
for line in sys.stdin:
    kind, *nums = line.split()
    values = [float(x) for x in nums]
    shapes.append({"rect": Rect, "circle": Circle, "square": Square}[kind](*values))
for s in sorted(shapes):
    print(s.describe())
print(f"total {sum(s.area() for s in shapes):.2f}")
print(f"rects {sum(isinstance(s, Rect) for s in shapes)} squares {sum(isinstance(s, Square) for s in shapes)}")
`,
          hints: [
            "`sorted` only needs `__lt__`; define it once on the ABC.",
            "A `Square` is an instance of `Rect` too, so it counts in both totals.",
          ],
          cases: [
            { stdin: "rect 2 3\nsquare 2\ncircle 1\n", expected: "Circle 3.14\nSquare 4.00\nRect 6.00\ntotal 13.14\nrects 2 squares 1\n" },
            { stdin: "square 1\nrect 1 1\n", expected: "Square 1.00\nRect 1.00\ntotal 2.00\nrects 2 squares 1\n", hidden: true },
            { stdin: "circle 2\n", expected: "Circle 12.57\ntotal 12.57\nrects 0 squares 0\n", hidden: true },
          ],
        },
        {
          title: "Plugin registry",
          prompt: `A \`@runtime_checkable\` protocol \`Plugin\` requires a data member \`name\` and a method \`run(x)\`. Candidate classes are given: \`Doubler\` and \`Squarer\` conform, \`Broken\` lacks \`run\`, \`Anonymous\` lacks \`name\`. Read a line of class names to register — accept a candidate only if its instance satisfies the protocol, printing \`registered <name attr>\` or \`rejected <ClassName>\` — then read an integer and print \`<name>: <result>\` for every registered plugin in registration order.

**Input:** a line of class names, then an integer.
**Output:** one line per candidate, then one line per registered plugin.

\`\`\`text
Doubler Broken Squarer Anonymous
5
\`\`\`
prints
\`\`\`text
registered double
rejected Broken
registered square
rejected Anonymous
double: 10
square: 25
\`\`\``,
          starter: String.raw`from typing import Protocol, runtime_checkable


# TODO: Plugin protocol


class Doubler:
    name = "double"

    def run(self, x):
        return 2 * x


class Squarer:
    name = "square"

    def run(self, x):
        return x * x


class Broken:
    name = "broken"


class Anonymous:
    def run(self, x):
        return x


CANDIDATES = {"Doubler": Doubler, "Squarer": Squarer, "Broken": Broken, "Anonymous": Anonymous}
registry = []
for cls_name in input().split():
    # TODO
    pass
x = int(input())
for plugin in registry:
    print(f"{plugin.name}: {plugin.run(x)}")
`,
          solution: String.raw`from typing import Protocol, runtime_checkable


@runtime_checkable
class Plugin(Protocol):
    name: str

    def run(self, x: int) -> int: ...


class Doubler:
    name = "double"

    def run(self, x):
        return 2 * x


class Squarer:
    name = "square"

    def run(self, x):
        return x * x


class Broken:
    name = "broken"


class Anonymous:
    def run(self, x):
        return x


CANDIDATES = {"Doubler": Doubler, "Squarer": Squarer, "Broken": Broken, "Anonymous": Anonymous}
registry = []
for cls_name in input().split():
    obj = CANDIDATES[cls_name]()
    if isinstance(obj, Plugin):
        registry.append(obj)
        print(f"registered {obj.name}")
    else:
        print(f"rejected {cls_name}")
x = int(input())
for plugin in registry:
    print(f"{plugin.name}: {plugin.run(x)}")
`,
          hints: [
            "A protocol may mix a data member and a method; the runtime check tests both names.",
            "None of the candidate classes inherit from `Plugin` — conformance is structural.",
          ],
          cases: [
            { stdin: "Doubler Broken Squarer Anonymous\n5\n", expected: "registered double\nrejected Broken\nregistered square\nrejected Anonymous\ndouble: 10\nsquare: 25\n" },
            { stdin: "Broken\n3\n", expected: "rejected Broken\n", hidden: true },
            { stdin: "Squarer Squarer\n-2\n", expected: "registered square\nregistered square\nsquare: 4\nsquare: 4\n", hidden: true },
          ],
        },
        {
          title: "Lower-casing mapping and a composed history",
          prompt: `Build \`LowerDict(UserDict)\` whose keys are always stored lower-cased, and \`History\`, a class that composes a list to record every command as \`<n>: <command line>\` with \`add(line)\`, \`last(k)\` returning the last \`k\` entries (fewer if there are fewer) and \`__len__\`. Commands: \`set K v\`, \`get K\` (\`missing\` when absent), \`del K\` (\`missing\` when absent), \`history k\` (prints the last \`k\` entries, one per line) and \`count\` (prints the number of recorded commands). Every command, including \`history\` and \`count\`, is recorded before it is executed.

**Input:** commands.
**Output:** one line per \`get\`, per failed \`del\`, per \`count\`, and \`k\` lines per \`history\`.

\`\`\`text
set Name ada
get NAME
del name
del name
history 2
count
\`\`\`
prints
\`\`\`text
ada
missing
4: del name
5: history 2
6
\`\`\``,
          starter: String.raw`import sys
from collections import UserDict


class LowerDict(UserDict):
    # TODO: fold keys in __setitem__, __getitem__, __delitem__, __contains__
    pass


class History:
    def __init__(self):
        self._entries = []

    # TODO: add, last, __len__


d = LowerDict()
history = History()
for line in sys.stdin:
    line = line.rstrip("\n")
    history.add(line)
    cmd, *args = line.split()
    # TODO
`,
          solution: String.raw`import sys
from collections import UserDict


class LowerDict(UserDict):
    def __setitem__(self, key, value):
        super().__setitem__(key.lower(), value)

    def __getitem__(self, key):
        return super().__getitem__(key.lower())

    def __delitem__(self, key):
        super().__delitem__(key.lower())

    def __contains__(self, key):
        return super().__contains__(key.lower())


class History:
    def __init__(self):
        self._entries = []

    def add(self, line):
        self._entries.append(f"{len(self._entries) + 1}: {line}")

    def last(self, k):
        return self._entries[-k:] if k > 0 else []

    def __len__(self):
        return len(self._entries)


d = LowerDict()
history = History()
for line in sys.stdin:
    line = line.rstrip("\n")
    history.add(line)
    cmd, *args = line.split()
    if cmd == "set":
        d[args[0]] = args[1]
    elif cmd == "get":
        print(d[args[0]] if args[0] in d else "missing")
    elif cmd == "del":
        if args[0] in d:
            del d[args[0]]
        else:
            print("missing")
    elif cmd == "history":
        for entry in history.last(int(args[0])):
            print(entry)
    elif cmd == "count":
        print(len(history))
`,
          hints: [
            "`History` exposes only `add`, `last` and `__len__`; the list stays private.",
            "Record the line before dispatching, so `history` and `count` see themselves.",
          ],
          cases: [
            { stdin: "set Name ada\nget NAME\ndel name\ndel name\nhistory 2\ncount\n", expected: "ada\nmissing\n4: del name\n5: history 2\n6\n" },
            { stdin: "history 3\ncount\n", expected: "1: history 3\n2\n", hidden: true },
            { stdin: "set A 1\nset a 2\nget A\ncount\n", expected: "2\n4\n", hidden: true },
          ],
        },
      ],
      quiz: [
        {
          prompt: "What does `super().__init__(name)` do in a subclass initialiser?",
          options: ["Creates a new base instance", "Runs the next class's `__init__` in the MRO on the same instance, so its attributes get set", "Copies the base's attributes", "Nothing unless the base is abstract"],
          answer: 1,
          explanation: "There is one instance; each initialiser in the chain adds its attributes to it.",
        },
        {
          prompt: "What is `type(p) == Dog` when `p` is a `Puppy(Dog)`?",
          options: ["`True`", "`False` — `type` is exact; `isinstance(p, Dog)` would be `True`", "`TypeError`", "`None`"],
          answer: 1,
          explanation: "`type()` returns the concrete class; inheritance is only respected by `isinstance`/`issubclass`.",
        },
        {
          prompt: "Which style is EAFP?",
          options: ["`if hasattr(x, \"close\"): x.close()`", "`try: x.close() except AttributeError: pass`", "`if isinstance(x, Closable): x.close()`", "`assert hasattr(x, \"close\")`"],
          answer: 1,
          explanation: "Ask forgiveness: attempt the call and handle the specific failure.",
        },
        {
          prompt: "What happens when `Shape()` is called and `Shape` has an unimplemented `@abstractmethod`?",
          options: ["An instance with a missing method", "`TypeError: Can't instantiate abstract class …`", "`NotImplementedError` when the method is called", "A warning"],
          answer: 1,
          explanation: "ABCs enforce completeness at construction.",
        },
        {
          prompt: "Which methods does `collections.abc.Mapping` require?",
          options: ["`__getitem__`, `__len__`, `__iter__`", "`__getitem__` only", "`keys` and `values`", "`__setitem__` and `__delitem__`"],
          answer: 0,
          explanation: "From those three it derives `__contains__`, `keys`, `items`, `values`, `get` and `__eq__`.",
        },
        {
          prompt: "In `class D(B, C)`, which class's method runs for a name defined in both `B` and `C`?",
          options: ["`C`'s", "`B`'s — earlier in the MRO", "Both", "It raises an ambiguity error"],
          answer: 1,
          explanation: "The MRO lists bases left to right; the first class with the attribute wins.",
        },
        {
          prompt: "What is a mixin?",
          options: ["A class with many fields", "A small class providing one capability, meant to be combined with a real base and holding little or no state", "An abstract class", "A module"],
          answer: 1,
          explanation: "Mixins compose behaviour; they are listed before the concrete base so their methods take precedence.",
        },
        {
          prompt: "What does a `Protocol` with `name: str` require of a conforming object?",
          options: ["A method `name()`", "An attribute, class attribute or property called `name`", "Inheritance from the protocol", "A `__name__`"],
          answer: 1,
          explanation: "Data members in a protocol match any attribute of that name.",
        },
        {
          prompt: "Why is `@runtime_checkable` needed for `isinstance(x, MyProtocol)`?",
          options: ["It is not; all protocols support it", "Protocols are static by default; the decorator enables a presence check of the member names", "It makes signatures checked", "It registers the class"],
          answer: 1,
          explanation: "Without it `isinstance` raises `TypeError`; with it, names are checked, signatures are not.",
        },
        {
          prompt: "Which base should a dict-like class use so that overriding `__setitem__` affects `update` and the constructor?",
          options: ["`dict`", "`collections.UserDict` (or `collections.abc.MutableMapping`)", "`object`", "`list`"],
          answer: 1,
          explanation: "Both route every operation through the basic item methods; `dict`'s C code does not.",
        },
        {
          prompt: "What does the Liskov substitution principle require?",
          options: ["Subclasses must add methods", "A subclass must be usable wherever the base is, without breaking the base's promises", "Subclasses must be immutable", "Every class needs an ABC"],
          answer: 1,
          explanation: "Preconditions may not be strengthened, postconditions may not be weakened, invariants must hold.",
        },
        {
          prompt: "Which delegation mechanism forwards *unknown* attribute reads to an inner object?",
          options: ["`__getattribute__`", "`__getattr__`", "`__dict__`", "`super()`"],
          answer: 1,
          explanation: "`__getattr__` is called only when normal lookup fails, which makes it the forwarding hook; `__getattribute__` intercepts everything.",
        },
      ],
    },
  ],
});
