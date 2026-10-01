---
skill: python
level: basic
---

## python-basic-051
topic: types-operators
answer: D
run: python

What does this program print?

```python
print(0.1 + 0.2 == 0.3, 0.5 + 0.25 == 0.75)
```

- A: `True True`
- B: `False False`
- C: `True False`
- D: `False True`

> Floats are stored in binary. 0.1, 0.2 and 0.3 have no exact binary form, so
> `0.1 + 0.2` comes out as 0.30000000000000004 and is not equal to the stored
> 0.3. 0.5, 0.25 and 0.75 are sums of powers of two and are stored exactly, so
> that comparison is `True`. Compare floats with `math.isclose` instead.

## python-basic-052
topic: types-operators
answer: A, D, E

Which of these expressions evaluate to `True`? Select all that apply.

- A: `5 == 5.0`
- B: `"5" == 5`
- C: `0 < -1 < 5`
- D: `bool("0")`
- E: `1 < 2 < 3`

> `==` compares numbers by value across `int` and `float`, so 5 equals 5.0. A
> string never equals a number — Python does not convert one to the other. A
> chained comparison `a < b < c` means `a < b and b < c`, so E is true and C
> is false (0 < -1 fails). `bool` of any non-empty string is `True`, even
> `"0"`.

## python-basic-053
topic: types-operators
answer: A
run: python

What does this program print?

```python
a = 3
b = 2.0
print(a * b, type(a * b).__name__, a // b)
```

- A: `6.0 float 1.0`
- B: `6 int 1`
- C: `6.0 float 1`
- D: `6 float 1.0`

> When an `int` and a `float` meet in arithmetic, the `int` is converted and
> the result is a `float`, even when it is a whole number — so `6.0`. That
> holds for `//` too: floor division still floors (3 / 2.0 = 1.5 becomes 1),
> but with a float operand the result is the float `1.0`.

## python-basic-054
topic: control-flow
answer: C

What happens when this program runs?

```python
i = 0
while i < 5:
    if i == 3:
        continue
    i += 1
print(i)
```

- A: It prints `5`.
- B: It prints `3`.
- C: It never finishes.
- D: It prints `4`.

> `continue` jumps straight back to the `while` test, skipping `i += 1`. Once
> `i` is 3, every pass sees `i == 3`, continues, and leaves `i` unchanged, and
> `3 < 5` stays true — an infinite loop. The `print` is never reached.

## python-basic-055
topic: control-flow
answer: B
run: python

What does this program print?

```python
letters = ["a", "b", "c"]
out = ""
for i, ch in enumerate(letters, 1):
    out += ch * i
print(out)
```

- A: `bcc`
- B: `abbccc`
- C: `abc`
- D: `aabbbcccc`

> `enumerate(letters, 1)` yields `(1, "a")`, `(2, "b")`, `(3, "c")`: the second
> argument is the number the count starts from. Each letter is repeated `i`
> times. Without the `1` the count would start at 0 and give `bcc`.

## python-basic-056
topic: strings
answer: D
run: python

What does this program print?

```python
s = "hello"
s.replace("l", "")
t = s.replace("l", "")
print(s, t)
```

- A: `heo heo`
- B: `hello helo`
- C: `heo hello`
- D: `hello heo`

> Strings are immutable, so `replace` cannot change `s`: it returns a new
> string. The second line throws that result away; the third keeps it in `t`.
> Without a count argument, `replace` replaces every occurrence, so both l's
> go.

## python-basic-057
topic: strings
answer: C

Given `words = ["a", "b", "c"]`, which expression evaluates to the string `"a-b-c"`?

- A: `words.join("-")`
- B: `"-".join(*words)`
- C: `"-".join(words)`
- D: `str(words).replace(", ", "-")`

> `join` is a method of the separator string and takes one iterable of
> strings. Lists have no `join` method (A is an `AttributeError`). B unpacks
> the list into three separate arguments, so `join` raises a `TypeError`. D
> works on the list's text form and gives `"['a'-'b'-'c']"`, brackets and
> quotes included.

## python-basic-058
topic: strings
answer: A
run: python

What does this program print?

```python
text = "a  b c"
print(len(text.split()), len(text.split(" ")))
```

- A: `3 4`
- B: `3 3`
- C: `4 4`
- D: `4 3`

> There are two spaces between `a` and `b`. With no argument, `split()` splits
> on runs of whitespace and drops empty strings: `['a', 'b', 'c']`. With an
> explicit `" "` every single space is a separator, so the two adjacent
> spaces leave an empty string between them: `['a', '', 'b', 'c']`.

## python-basic-059
topic: lists-tuples
answer: B
run: python

What does this program print?

```python
items = [5, 3, 5, 7]
items.remove(5)
last = items.pop()
items.insert(0, last)
print(items)
```

- A: `[7, 3]`
- B: `[7, 3, 5]`
- C: `[3, 5, 7]`
- D: `[7, 5, 3]`

> `remove(5)` deletes only the first 5, leaving `[3, 5, 7]`. `pop()` with no
> index removes and returns the last item, 7, leaving `[3, 5]`. `insert(0, 7)`
> puts it at the front.

## python-basic-060
topic: lists-tuples
answer: A

What happens when this line runs?

```python
a, b = (1, 2, 3)
```

- A: It raises a `ValueError`.
- B: `a` is `1`, `b` is `2`, and the `3` is dropped.
- C: `a` is `1` and `b` is `(2, 3)`.
- D: It raises a `TypeError`.

> Plain unpacking needs exactly as many names as values. Three values into
> two names raises `ValueError: too many values to unpack (expected 2)`; the
> type (a tuple) is fine, which is why it is not a `TypeError`. To collect the
> rest you would write `a, *b = (1, 2, 3)`, which makes `b` the list
> `[2, 3]`.

## python-basic-061
topic: lists-tuples
answer: D
run: python

What does this program print?

```python
a, b, c = 1, 2, 3
a, b = b, a + b
c, a = a, c
print(a, b, c)
```

- A: `2 4 2`
- B: `3 4 2`
- C: `2 3 2`
- D: `3 3 2`

> In a tuple assignment the whole right-hand side is evaluated first, then
> assigned. Line 2 computes `(2, 1 + 2)`, so `a = 2`, `b = 3`. Line 3 computes
> `(2, 3)` from the current `a` and `c`, so `c = 2`, `a = 3`. Doing either
> line one name at a time gives the other options.

## python-basic-062
topic: dicts-sets
answer: B
run: python

What does this program print?

```python
counts = {}
for ch in "abcab":
    counts[ch] = counts.get(ch, 0) + 1
print(counts)
```

- A: `{'a': 1, 'b': 1, 'c': 1}`
- B: `{'a': 2, 'b': 2, 'c': 1}`
- C: `{'a': 2, 'b': 2}`
- D: It raises a `KeyError`.

> `counts.get(ch, 0)` returns 0 for a letter not seen yet instead of raising
> `KeyError`, so each letter's count starts at 1 and goes up on every repeat.
> Keys appear in the order they were first inserted: a, b, c.

## python-basic-063
topic: dicts-sets
answer: C

Which expression evaluates to an empty set?

- A: `{}`
- B: `{()}`
- C: `set()`
- D: `{None}`

> Empty braces `{}` make an empty dictionary — dicts had the syntax first — so
> an empty set can only be written `set()`. `{()}` is a set holding one
> element, the empty tuple, and `{None}` is a set holding `None`.

## python-basic-064
topic: dicts-sets
answer: C
run: python

What does this program print?

```python
a = {"x": 1, "y": 2}
b = {"y": 20, "z": 30}
a.update(b)
print(a)
```

- A: `{'x': 1, 'y': 2, 'z': 30}`
- B: `{'y': 20, 'z': 30}`
- C: `{'x': 1, 'y': 20, 'z': 30}`
- D: `{'x': 1, 'z': 30, 'y': 20}`

> `update` copies every pair from `b` into `a`: a key `a` already has gets
> `b`'s value (y becomes 20) and keeps its place in the order, and a new key
> (z) is added at the end. Keys `b` does not mention (x) are kept.

## python-basic-065
topic: functions
answer: B, C, E

Given the function below, which calls return `3`? Select all that apply.

```python
def diff(a, b):
    return a - b
```

- A: `diff(2, 5)`
- B: `diff(b=2, a=5)`
- C: `diff(5, 2)`
- D: `diff(b=5, a=2)`
- E: `diff(5, b=2)`

> Keyword arguments bind by name, so the order they are written in does not
> matter: B and E both set `a = 5`, `b = 2`, as does the positional call C,
> and all three return 3. A and D both set `a = 2`, `b = 5` and return -3.

## python-basic-066
topic: functions
answer: A
run: python

What does this program print?

```python
def reset(values):
    values.append(0)
    values = []
    values.append(1)

data = [5]
reset(data)
print(data)
```

- A: `[5, 0]`
- B: `[1]`
- C: `[5, 0, 1]`
- D: `[5]`

> The parameter `values` starts as another name for the caller's list, so
> `append(0)` changes `data`. `values = []` then rebinds only the local name to
> a new list; `data` is not affected, and the 1 goes into the new list, which
> is thrown away when the function returns.

## python-basic-067
topic: functions
answer: D

What happens when this program runs?

```python
print(square(4))

def square(n):
    return n * n
```

- A: It prints `16`.
- B: It prints `None`.
- C: It raises a `SyntaxError` before running.
- D: It raises a `NameError`.

> A `def` is a statement that runs from top to bottom like any other: the name
> `square` exists only once the `def` has executed. The first line runs
> before that, so looking up `square` raises `NameError`. The file itself is
> valid syntax.

## python-basic-068
topic: comprehensions
answer: B
run: python

What does this program print?

```python
print([c.upper() for c in "a1b2" if c.isalpha()])
```

- A: `['A', '1', 'B', '2']`
- B: `['A', 'B']`
- C: `AB`
- D: `['1', '2']`

> A comprehension can loop over a string character by character. The `if`
> keeps only letters (`isalpha()` is false for digits), and the result is
> always a list — the comprehension does not join the strings.

## python-basic-069
topic: comprehensions
answer: D
run: python

What does this program print?

```python
keys = ["a", "b", "c"]
vals = [1, 2, 3]
print({k: v * 10 for k, v in zip(keys, vals) if v != 2})
```

- A: `{'a': 10, 'b': 20, 'c': 30}`
- B: `{'a': 1, 'c': 3}`
- C: `[('a', 10), ('c', 30)]`
- D: `{'a': 10, 'c': 30}`

> `zip` pairs the lists item by item: `("a", 1)`, `("b", 2)`, `("c", 3)`. The
> `if` drops the pair whose value is 2, and the expression `k: v * 10` builds
> each remaining entry with the value multiplied.

## python-basic-070
topic: comprehensions
answer: A

What kind of object does the expression `(x * x for x in range(3))` evaluate to?

- A: A generator
- B: A tuple
- C: A list
- D: A set

> Parentheses around a comprehension make a generator expression: a lazy
> iterator that produces 0, 1, 4 one at a time as it is consumed. There is no
> tuple comprehension — `tuple(x * x for x in range(3))` is how you build a
> tuple. Brackets make a list and braces a set.

## python-basic-071
topic: oop
answer: C
run: python

What does this program print?

```python
class Pet:
    def __init__(self, name):
        self.name = name

    def __str__(self):
        return "Pet " + self.name

p = Pet("Tom")
print(p, p.name)
```

- A: `Tom Tom`
- B: `Pet Tom Pet Tom`
- C: `Pet Tom Tom`
- D: `Pet(Tom) Tom`

> `print` converts each argument with `str()`, which calls the object's
> `__str__` method, so `p` is shown as `Pet Tom`. `p.name` is just the string
> `"Tom"`, printed as is.

## python-basic-072
topic: oop
answer: B

What happens when this program runs?

```python
class User:
    def __init__(self, name, age):
        self.name = name
        self.age = age

u = User("Ali")
```

- A: `u.age` is `None`.
- B: It raises a `TypeError`.
- C: `u.age` is `0`.
- D: `u` is created without an `age` attribute.

> `User("Ali")` calls `__init__(self, "Ali")`, and `age` has no default, so
> the call fails with `TypeError: __init__() missing 1 required positional
> argument: 'age'`. The object is never handed back to `u`; Python does not
> fill missing arguments with `None` or 0.

## python-basic-073
topic: oop
answer: A
run: python

What does this program print?

```python
class Car:
    wheels = 4

a = Car()
b = Car()
a.wheels = 3
print(a.wheels, b.wheels, Car.wheels)
```

- A: `3 4 4`
- B: `3 3 3`
- C: `3 3 4`
- D: `4 4 4`

> `wheels = 4` in the class body is a class attribute, shared by reading.
> Assigning `a.wheels = 3` creates an instance attribute on `a` alone, which
> hides the class attribute for `a` only. `b` has no attribute of its own, so
> it still reads the class's 4, and `Car.wheels` is unchanged.

## python-basic-074
topic: exceptions
answer: C

What happens when this program runs?

```python
try:
    x = 1 / 0
except ValueError:
    print("A")
finally:
    print("B")
print("C")
```

- A: It prints `A`, `B` and `C`.
- B: It prints `B` and `C`.
- C: It prints `B`, then stops with a `ZeroDivisionError`.
- D: It stops with a `ZeroDivisionError` and prints nothing.

> `1 / 0` raises `ZeroDivisionError`, which `except ValueError` does not
> match, so `A` is never printed. `finally` runs on the way out regardless, so
> `B` is printed; then the exception, still unhandled, ends the program before
> the last line, and `C` never appears.

## python-basic-075
topic: exceptions
answer: D
run: python

What does this program print?

```python
def withdraw(balance, amount):
    if amount > balance:
        raise ValueError("insufficient funds")
    return balance - amount

try:
    print(withdraw(50, 80))
except ValueError as e:
    print("Error:", e)
```

- A: `-30`
- B: `Error: ValueError`
- C: `Error: ValueError: insufficient funds`
- D: `Error: insufficient funds`

> `raise` stops `withdraw` before its `return`, so the inner `print` never
> runs. `except ValueError as e` binds the exception object to `e`, and
> printing an exception shows its message only — the class name appears in a
> traceback, not in `str(e)`.
